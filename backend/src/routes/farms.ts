import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Farm } from '../types';

const router = Router();
router.use(requireAuth);

const parseFarm = (f: Farm) => ({ ...f, crops: JSON.parse(f.crops) });

// GET /farms
router.get('/', (req: AuthRequest, res: Response) => {
  const farms = (db.prepare('SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC').all(req.userId) as Farm[]).map(parseFarm);
  return res.json({ success: true, message: 'OK', data: farms });
});

// GET /farms/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const farm = db.prepare('SELECT * FROM farms WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as Farm | undefined;
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  return res.json({ success: true, message: 'OK', data: parseFarm(farm) });
});

// POST /farms
router.post('/', (req: AuthRequest, res: Response) => {
  const { name, location, size_ha, crops = [], irrigation_type = 'Manual', health_pct = 80, image_url } = req.body;
  if (!name || !location) return res.status(400).json({ success: false, message: 'name and location are required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO farms (id, user_id, name, location, size_ha, crops, irrigation_type, health_pct, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, name, location, size_ha, JSON.stringify(crops), irrigation_type, health_pct, image_url ?? null);

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(id) as Farm;
  return res.status(201).json({ success: true, message: 'Farm created', data: parseFarm(farm) });
});

// PUT /farms/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT id FROM farms WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ success: false, message: 'Farm not found' });

  const { name, location, size_ha, crops, irrigation_type, health_pct, image_url } = req.body;
  db.prepare(`
    UPDATE farms SET
      name = COALESCE(?, name),
      location = COALESCE(?, location),
      size_ha = COALESCE(?, size_ha),
      crops = COALESCE(?, crops),
      irrigation_type = COALESCE(?, irrigation_type),
      health_pct = COALESCE(?, health_pct),
      image_url = COALESCE(?, image_url),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? null, location ?? null, size_ha ?? null,
    crops ? JSON.stringify(crops) : null,
    irrigation_type ?? null, health_pct ?? null, image_url ?? null,
    req.params.id
  );

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id) as Farm;
  return res.json({ success: true, message: 'Farm updated', data: parseFarm(farm) });
});

// DELETE /farms/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const result = db.prepare('DELETE FROM farms WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ success: false, message: 'Farm not found' });
  return res.json({ success: true, message: 'Farm deleted', data: null });
});

// GET /farms/stats/summary
router.get('/stats/summary', (req: AuthRequest, res: Response) => {
  const farms = db.prepare('SELECT size_ha, health_pct FROM farms WHERE user_id = ?').all(req.userId) as { size_ha: number; health_pct: number }[];
  const totalArea = farms.reduce((s, f) => s + f.size_ha, 0);
  const avgHealth = farms.length ? Math.round(farms.reduce((s, f) => s + f.health_pct, 0) / farms.length) : 0;
  return res.json({
    success: true, message: 'OK',
    data: { totalFarms: farms.length, totalAreaHa: totalArea, avgHealthPct: avgHealth }
  });
});

export default router;
