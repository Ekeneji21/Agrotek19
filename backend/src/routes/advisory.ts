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

// POST /advisory/consult — submit request; AI replies asynchronously after 3 minutes
router.post('/consult', (req: AuthRequest, res: Response) => {
  const { agronomistId, message } = req.body;
  if (!agronomistId || !message)
    return res.status(400).json({ success: false, message: 'agronomistId and message are required' });

  const ag = db.prepare('SELECT * FROM agronomists WHERE id = ?').get(agronomistId) as Agronomist | undefined;
  if (!ag) return res.status(404).json({ success: false, message: 'Agronomist not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO consultations (id, user_id, agronomist_id, message, status) VALUES (?, ?, ?, ?, ?)').run(id, req.userId, agronomistId, message, 'pending');

  // Schedule AI reply in 3 minutes (for testing; production would use a queue)
  const REPLY_DELAY_MS = 3 * 60 * 1000;
  setTimeout(async () => {
    if (!process.env.GROQ_API_KEY) return;
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const prompt = `You are ${ag.name}, a Zimbabwean agronomist specialising in ${ag.specialty}, based in ${ag.location}. A farmer has sent you this consultation request:\n\n"${message}"\n\nReply as an expert agronomist. Be practical, specific to Zimbabwe conditions, and include:\n- Direct answer to their question\n- Recommended products/chemicals with specific Zimbabwe brands if applicable\n- Any nearby shops or market info if chemicals are mentioned\n- Action steps\nKeep reply under 300 words.`;
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

  return res.status(201).json({ success: true, message: 'Consultation submitted. You will receive a reply within 3 minutes.', data: { id, status: 'pending' } });
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
