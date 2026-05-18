import { Router, Response } from 'express';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Farm, DiseaseScan } from '../types';

const router = Router();
router.use(requireAuth);

// GET /analytics/crop-health
router.get('/crop-health', (req: AuthRequest, res: Response) => {
  const farms = db.prepare('SELECT crops, health_pct FROM farms WHERE user_id = ?').all(req.userId) as { crops: string; health_pct: number }[];

  const cropMap: Record<string, { total: number; count: number }> = {};
  farms.forEach(f => {
    const crops: string[] = JSON.parse(f.crops);
    crops.forEach(c => {
      if (!cropMap[c]) cropMap[c] = { total: 0, count: 0 };
      cropMap[c].total += f.health_pct;
      cropMap[c].count++;
    });
  });

  const data = Object.entries(cropMap).map(([label, { total, count }]) => ({
    label,
    pct: Math.round(total / count),
  }));

  return res.json({ success: true, message: 'OK', data });
});

// GET /analytics/outbreaks
router.get('/outbreaks', (_req: AuthRequest, res: Response) => {
  // Aggregate disease scan data to show trends
  const rows = db.prepare(`
    SELECT disease, COUNT(*) as count, AVG(confidence) as avgConf
    FROM disease_scans
    GROUP BY disease
    ORDER BY count DESC
    LIMIT 5
  `).all() as { disease: string; count: number; avgConf: number }[];

  return res.json({ success: true, message: 'OK', data: rows });
});

// GET /analytics/financial
router.get('/financial', (req: AuthRequest, res: Response) => {
  const farms = db.prepare('SELECT size_ha, health_pct FROM farms WHERE user_id = ?').all(req.userId) as { size_ha: number; health_pct: number }[];
  const totalHa = farms.reduce((s, f) => s + f.size_ha, 0);
  const avgHealth = farms.length ? farms.reduce((s, f) => s + f.health_pct, 0) / farms.length : 0;

  // Simple heuristic estimates (replace with real financial data when available)
  const yieldPerHa = 3.5; // tons/ha average
  const pricePerTon = 280; // USD
  const costPerHa = 180;
  const estimatedYield = totalHa * yieldPerHa * (avgHealth / 100);
  const estimatedRevenue = estimatedYield * pricePerTon;
  const estimatedCost = totalHa * costPerHa;
  const roi = estimatedCost > 0 ? ((estimatedRevenue - estimatedCost) / estimatedCost) * 100 : 0;

  return res.json({
    success: true, message: 'OK',
    data: {
      estimatedYieldTons: Math.round(estimatedYield * 10) / 10,
      estimatedRevenueUsd: Math.round(estimatedRevenue),
      estimatedCostUsd: Math.round(estimatedCost),
      roiPct: Math.round(roi),
      yieldHealthPct: Math.round(avgHealth),
    }
  });
});

// GET /analytics/disease-trends
router.get('/disease-trends', (req: AuthRequest, res: Response) => {
  // Monthly scan counts for the current year
  const rows = db.prepare(`
    SELECT strftime('%m', scanned_at) as month, COUNT(*) as count
    FROM disease_scans
    WHERE user_id = ? AND strftime('%Y', scanned_at) = strftime('%Y', 'now')
    GROUP BY month
    ORDER BY month
  `).all(req.userId) as { month: string; count: number }[];

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = MONTHS.map((name, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = rows.find(r => r.month === m);
    return { name, historical: found?.count ?? 0 };
  });

  return res.json({ success: true, message: 'OK', data });
});

export default router;
