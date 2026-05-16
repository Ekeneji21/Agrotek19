import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
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
    data: { total, available, certified, consultations, avgRating: Number(avgRating.toFixed(1)) }
  });
});

// POST /advisory/consult
router.post('/consult', (req: AuthRequest, res: Response) => {
  const { agronomistId, message } = req.body;
  if (!agronomistId || !message)
    return res.status(400).json({ success: false, message: 'agronomistId and message are required' });

  const ag = db.prepare('SELECT id FROM agronomists WHERE id = ?').get(agronomistId);
  if (!ag) return res.status(404).json({ success: false, message: 'Agronomist not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO consultations (id, user_id, agronomist_id, message) VALUES (?, ?, ?, ?)').run(id, req.userId, agronomistId, message);

  const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(id);
  return res.status(201).json({ success: true, message: 'Consultation request submitted', data: consultation });
});

// GET /advisory/consultations
router.get('/consultations', (req: AuthRequest, res: Response) => {
  const consultations = db.prepare(`
    SELECT c.*, a.name as agronomist_name, a.specialty
    FROM consultations c
    JOIN agronomists a ON a.id = c.agronomist_id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId);
  return res.json({ success: true, message: 'OK', data: consultations });
});

export default router;
