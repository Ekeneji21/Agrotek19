import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Agronomist, AdvisoryTip } from '../types';

const router = Router();
router.use(requireAuth);

// GET /advisory
router.get('/', (_req: AuthRequest, res: Response) => {
  const tips = db.prepare('SELECT * FROM advisory_tips ORDER BY created_at DESC').all() as AdvisoryTip[];
  return res.json({ success: true, message: 'OK', data: tips });
});

// GET /advisory/agronomists
router.get('/agronomists', (_req: AuthRequest, res: Response) => {
  const agronomists = (db.prepare('SELECT * FROM agronomists ORDER BY rating DESC').all() as Agronomist[])
    .map(a => ({ ...a, available: a.available === 1 }));
  return res.json({ success: true, message: 'OK', data: agronomists });
});

// GET /advisory/stats
router.get('/stats', (_req: AuthRequest, res: Response) => {
  const total = (db.prepare('SELECT COUNT(*) as c FROM agronomists').get() as { c: number }).c;
  const available = (db.prepare('SELECT COUNT(*) as c FROM agronomists WHERE available = 1').get() as { c: number }).c;
  const certified = (db.prepare('SELECT COUNT(*) as c FROM agronomists WHERE rating >= 4.7').get() as { c: number }).c;
  const consultations = (db.prepare('SELECT COUNT(*) as c FROM consultations').get() as { c: number }).c;
  const avgRating = (db.prepare('SELECT AVG(rating) as r FROM agronomists').get() as { r: number }).r;

  return res.json({
    success: true, message: 'OK',
    data: { total, available, certified, consultations, avgRating: Number((avgRating || 0).toFixed(1)) }
  });
});

// Find nearest agronomist to farmer based on location string matching
function findNearestAgronomist(farmerLocation: string): Agronomist {
  const agronomists = db.prepare('SELECT * FROM agronomists WHERE available = 1 ORDER BY rating DESC').all() as Agronomist[];
  if (!agronomists.length) {
    return db.prepare('SELECT * FROM agronomists ORDER BY rating DESC LIMIT 1').get() as Agronomist;
  }
  const loc = (farmerLocation || '').toLowerCase();
  // Try to match by city/region name
  const match = agronomists.find(a => {
    const aLoc = a.location.toLowerCase();
    return loc.includes(aLoc) || aLoc.includes(loc.split(/[\s,]+/)[0]);
  });
  return match ?? agronomists[0];
}

// POST /advisory/consult — auto-routes to nearest agronomist; AI replies asynchronously after 3 minutes
router.post('/consult', (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ success: false, message: 'message is required' });

  const farmer = db.prepare('SELECT name, location FROM users WHERE id = ?').get(req.userId) as { name: string; location: string } | undefined;
  const ag = findNearestAgronomist(farmer?.location ?? '') as Agronomist;

  const id = uuidv4();
  db.prepare('INSERT INTO consultations (id, user_id, agronomist_id, message, status) VALUES (?, ?, ?, ?, ?)').run(id, req.userId, ag.id, message, 'pending');

  // Schedule AI reply in 3 minutes
  const REPLY_DELAY_MS = 3 * 60 * 1000;
  setTimeout(async () => {
    if (!process.env.GROQ_API_KEY) return;
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const farmerName = farmer?.name ?? 'the farmer';
      const prompt = `You are ${ag.name}, a Zimbabwean agronomist specialising in ${ag.specialty}, based in ${ag.location}. ${farmerName} has sent you this consultation:\n\n"${message}"\n\nReply as this expert agronomist. Be practical, Zimbabwe-specific, and include:\n- Direct answer\n- Recommended products/chemicals with Zimbabwe brand names if applicable (ZimFert, SeedCo, Agritex, AgroChem Zim, Windmill)\n- Where to find inputs: Agritex depots, agro-dealers, GMB stockists near ${ag.location}\n- Clear action steps\nKeep reply under 300 words.`;
      const completion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 600,
      });
      const reply = completion.choices[0]?.message?.content ?? '';
      if (reply) {
        db.prepare(`UPDATE consultations SET ai_reply=?, reply_at=datetime('now'), status='replied' WHERE id=?`).run(reply, id);
      }
    } catch (err) {
      console.error('[Advisory AI reply error]', err);
    }
  }, REPLY_DELAY_MS);

  return res.status(201).json({ success: true, message: 'Consultation submitted. You will receive a reply within 3 minutes.', data: { id, agronomist_name: ag.name, agronomist_specialty: ag.specialty, agronomist_location: ag.location, status: 'pending' } });
});

// GET /advisory/consultations
router.get('/consultations', (req: AuthRequest, res: Response) => {
  const consultations = db.prepare(`
    SELECT c.*, a.name as agronomist_name, a.specialty, a.email as agronomist_email
    FROM consultations c
    JOIN agronomists a ON a.id = c.agronomist_id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId);
  return res.json({ success: true, message: 'OK', data: consultations });
});

export default router;
