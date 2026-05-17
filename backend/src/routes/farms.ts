import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Farm } from '../types';

const router = Router();
router.use(requireAuth);

function calcHealthFromScans(userId: string): number {
  const scans = db.prepare(`
    SELECT severity FROM disease_scans
    WHERE user_id = ? AND scanned_at >= datetime('now', '-30 days')
  `).all(userId) as { severity: string }[];

  if (scans.length === 0) return 85;

  let health = 95;
  scans.forEach(s => {
    if (s.severity === 'High') health -= 12;
    else if (s.severity === 'Medium') health -= 6;
    else health -= 2;
  });
  return Math.max(20, Math.min(95, health));
}

const parseFarm = (f: Farm) => ({ ...f, crops: JSON.parse(f.crops) });

// GET /farms
router.get('/', (req: AuthRequest, res: Response) => {
  const health = calcHealthFromScans(req.userId!);
  const farms = (db.prepare('SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC').all(req.userId) as Farm[])
    .map(f => ({ ...parseFarm(f), health_pct: health }));
  return res.json({ success: true, message: 'OK', data: farms });
});

// GET /farms/:id — must come AFTER /stats/summary
router.get('/:id', (req: AuthRequest, res: Response) => {
  const farm = db.prepare('SELECT * FROM farms WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as Farm | undefined;
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  return res.json({ success: true, message: 'OK', data: { ...parseFarm(farm), health_pct: calcHealthFromScans(req.userId!) } });
});

// POST /farms
router.post('/', (req: AuthRequest, res: Response) => {
  const { name, location, size_ha = 0, crops = [], irrigation_type = 'Manual', image_url } = req.body;
  if (!name || !location) return res.status(400).json({ success: false, message: 'name and location are required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO farms (id, user_id, name, location, size_ha, crops, irrigation_type, health_pct, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, name, location, Number(size_ha), JSON.stringify(crops), irrigation_type, 85, image_url ?? null);

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(id) as Farm;
  return res.status(201).json({ success: true, message: 'Farm created', data: parseFarm(farm) });
});

// PUT /farms/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT id FROM farms WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ success: false, message: 'Farm not found' });

  const { name, location, size_ha, crops, irrigation_type, image_url } = req.body;
  db.prepare(`
    UPDATE farms SET
      name = COALESCE(?, name),
      location = COALESCE(?, location),
      size_ha = COALESCE(?, size_ha),
      crops = COALESCE(?, crops),
      irrigation_type = COALESCE(?, irrigation_type),
      image_url = COALESCE(?, image_url),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? null, location ?? null, size_ha ?? null,
    crops ? JSON.stringify(crops) : null,
    irrigation_type ?? null, image_url ?? null,
    req.params.id
  );

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id) as Farm;
  return res.json({ success: true, message: 'Farm updated', data: { ...parseFarm(farm), health_pct: calcHealthFromScans(req.userId!) } });
});

// DELETE /farms/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const result = db.prepare('DELETE FROM farms WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ success: false, message: 'Farm not found' });
  return res.json({ success: true, message: 'Farm deleted', data: null });
});

// GET /farms/stats/summary
router.get('/stats/summary', (req: AuthRequest, res: Response) => {
  const farms = db.prepare('SELECT size_ha FROM farms WHERE user_id = ?').all(req.userId) as { size_ha: number }[];
  const totalArea = farms.reduce((s, f) => s + f.size_ha, 0);
  const health = calcHealthFromScans(req.userId!);
  return res.json({
    success: true, message: 'OK',
    data: { totalFarms: farms.length, totalAreaHa: Math.round(totalArea * 10) / 10, avgHealthPct: health }
  });
});

export default router;
