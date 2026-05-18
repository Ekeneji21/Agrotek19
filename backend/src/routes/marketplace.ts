import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Product, Order } from '../types';

const router = Router();
router.use(requireAuth);

// GET /marketplace/products?category=
router.get('/products', (req: AuthRequest, res: Response) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products';
  const params: (string | null)[] = [];

  const conditions: string[] = [];
  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category as string);
  }
  if (search) {
    conditions.push('name LIKE ?');
    params.push(`%${search}%`);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY rating DESC';

  const products = db.prepare(query).all(...params) as Product[];
  return res.json({ success: true, message: 'OK', data: products });
});

// GET /marketplace/products/:id
router.get('/products/:id', (req: AuthRequest, res: Response) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as Product | undefined;
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  return res.json({ success: true, message: 'OK', data: product });
});

// GET /marketplace/orders
router.get('/orders', (req: AuthRequest, res: Response) => {
  const orders = (db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.userId) as Order[])
    .map(o => ({ ...o, items: JSON.parse(o.items) }));
  return res.json({ success: true, message: 'OK', data: orders });
});

// POST /marketplace/orders
router.post('/orders', (req: AuthRequest, res: Response) => {
  const { items } = req.body; // [{ productId, quantity, priceUsd }]
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ success: false, message: 'items array is required' });

  const total = items.reduce((sum: number, i: { quantity: number; priceUsd: number }) => sum + i.quantity * i.priceUsd, 0);
  const id = uuidv4();

  db.prepare('INSERT INTO orders (id, user_id, items, total_usd) VALUES (?, ?, ?, ?)').run(id, req.userId, JSON.stringify(items), total);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order;
  return res.status(201).json({ success: true, message: 'Order placed', data: { ...order, items: JSON.parse(order.items) } });
});

// GET /marketplace/categories
router.get('/categories', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all() as { category: string }[];
  return res.json({ success: true, message: 'OK', data: ['All', ...rows.map(r => r.category)] });
});

export default router;
