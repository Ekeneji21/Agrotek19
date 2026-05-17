import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /transactions
router.get('/', (req: AuthRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT t.*, f.name as farm_name
    FROM transactions t
    LEFT JOIN farms f ON t.farm_id = f.id
    WHERE t.user_id = ?
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT 100
  `).all(req.userId);
  return res.json({ success: true, message: 'OK', data: rows });
});

// GET /transactions/summary
router.get('/summary', (req: AuthRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT type, SUM(amount_usd) as total
    FROM transactions
    WHERE user_id = ?
    GROUP BY type
  `).all(req.userId) as { type: string; total: number }[];

  const income = rows.find(r => r.type === 'income')?.total ?? 0;
  const expense = rows.find(r => r.type === 'expense')?.total ?? 0;

  const thisMonth = db.prepare(`
    SELECT type, SUM(amount_usd) as total
    FROM transactions
    WHERE user_id = ? AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    GROUP BY type
  `).all(req.userId) as { type: string; total: number }[];

  const monthIncome = thisMonth.find(r => r.type === 'income')?.total ?? 0;
  const monthExpense = thisMonth.find(r => r.type === 'expense')?.total ?? 0;

  return res.json({
    success: true, message: 'OK',
    data: {
      totalIncome: Math.round(income * 100) / 100,
      totalExpense: Math.round(expense * 100) / 100,
      netProfit: Math.round((income - expense) * 100) / 100,
      monthIncome: Math.round(monthIncome * 100) / 100,
      monthExpense: Math.round(monthExpense * 100) / 100,
      monthNet: Math.round((monthIncome - monthExpense) * 100) / 100,
    }
  });
});

// POST /transactions
router.post('/', (req: AuthRequest, res: Response) => {
  const { type, category, amount_usd, description, transaction_date, farm_id } = req.body;
  if (!type || !category || !amount_usd || !description || !transaction_date) {
    return res.status(400).json({ success: false, message: 'type, category, amount_usd, description, transaction_date are required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be income or expense' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO transactions (id, user_id, farm_id, type, category, amount_usd, description, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, farm_id ?? null, type, category, Number(amount_usd), description, transaction_date);

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  return res.status(201).json({ success: true, message: 'Transaction recorded', data: row });
});

// DELETE /transactions/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
  return res.json({ success: true, message: 'Deleted', data: null });
});

export default router;
