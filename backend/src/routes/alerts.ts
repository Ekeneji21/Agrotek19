import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Alert, AlertSettings } from '../types';

const router = Router();
router.use(requireAuth);

// GET /alerts
router.get('/', (req: AuthRequest, res: Response) => {
  const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId) as Alert[];
  return res.json({ success: true, message: 'OK', data: alerts.map(a => ({ ...a, read: a.read === 1 })) });
});

// PUT /alerts/:id/read
router.put('/:id/read', (req: AuthRequest, res: Response) => {
  const result = db.prepare('UPDATE alerts SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
  return res.json({ success: true, message: 'Marked as read', data: null });
});

// PUT /alerts/read-all
router.put('/read-all/bulk', (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE alerts SET read = 1 WHERE user_id = ?').run(req.userId);
  return res.json({ success: true, message: 'All alerts marked as read', data: null });
});

// GET /alerts/settings
router.get('/settings', (req: AuthRequest, res: Response) => {
  let settings = db.prepare('SELECT * FROM alert_settings WHERE user_id = ?').get(req.userId) as AlertSettings | undefined;
  if (!settings) {
    const id = uuidv4();
    db.prepare('INSERT OR IGNORE INTO alert_settings (id, user_id) VALUES (?, ?)').run(id, req.userId);
    settings = db.prepare('SELECT * FROM alert_settings WHERE user_id = ?').get(req.userId) as AlertSettings;
  }
  return res.json({
    success: true, message: 'OK',
    data: {
      ...settings,
      disease_alerts: settings.disease_alerts === 1,
      weather_warnings: settings.weather_warnings === 1,
      market_updates: settings.market_updates === 1,
      advisory_messages: settings.advisory_messages === 1,
      weekly_reports: settings.weekly_reports === 1,
    }
  });
});

// PUT /alerts/settings
router.put('/settings', (req: AuthRequest, res: Response) => {
  const { disease_alerts, weather_warnings, market_updates, advisory_messages, weekly_reports } = req.body;
  db.prepare(`
    UPDATE alert_settings SET
      disease_alerts = COALESCE(?, disease_alerts),
      weather_warnings = COALESCE(?, weather_warnings),
      market_updates = COALESCE(?, market_updates),
      advisory_messages = COALESCE(?, advisory_messages),
      weekly_reports = COALESCE(?, weekly_reports)
    WHERE user_id = ?
  `).run(
    disease_alerts != null ? (disease_alerts ? 1 : 0) : null,
    weather_warnings != null ? (weather_warnings ? 1 : 0) : null,
    market_updates != null ? (market_updates ? 1 : 0) : null,
    advisory_messages != null ? (advisory_messages ? 1 : 0) : null,
    weekly_reports != null ? (weekly_reports ? 1 : 0) : null,
    req.userId
  );
  const settings = db.prepare('SELECT * FROM alert_settings WHERE user_id = ?').get(req.userId) as AlertSettings;
  return res.json({ success: true, message: 'Settings updated', data: settings });
});

// Internal helper – called when a disease scan happens to insert an alert for the user
export function createAlert(userId: string, type: string, title: string, message: string, severity: string) {
  const id = uuidv4();
  db.prepare('INSERT INTO alerts (id, user_id, type, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)').run(id, userId, type, title, message, severity);
}

export default router;
