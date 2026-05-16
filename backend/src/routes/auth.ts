import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { User } from '../types';
import { createAlert } from './alerts';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const makeToken = (userId: string, email: string) =>
  jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

// POST /auth/register
router.post('/register', (req: Request, res: Response) => {
  const { name, email, password, phone = '', location = '' } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'name, email and password are required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing)
    return res.status(409).json({ success: false, message: 'Email already registered' });

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, location)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email, hash, phone, location);

  db.prepare(`
    INSERT INTO alert_settings (id, user_id) VALUES (?, ?)
  `).run(uuidv4(), id);

  const user = db.prepare('SELECT id, name, email, phone, location, account_type, avatar_url, created_at FROM users WHERE id = ?').get(id) as Omit<User, 'password_hash'>;

  // Welcome alert
  createAlert(id, 'system', 'Welcome to AgriSense Zimbabwe! 🌱',
    `Hi ${name}! Your account is ready. Start by adding your first farm, then scan a crop image for AI disease detection. Check Weather Intel for live forecasts.`,
    'Info');

  return res.status(201).json({ success: true, message: 'Registered successfully', data: { token: makeToken(id, email), user } });
});

// POST /auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const { password_hash, ...safeUser } = user;
  return res.json({ success: true, message: 'Login successful', data: { token: makeToken(user.id, user.email), user: safeUser } });
});

// GET /auth/profile
router.get('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, phone, location, account_type, avatar_url, created_at FROM users WHERE id = ?').get(req.userId) as Omit<User, 'password_hash'> | undefined;
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, message: 'OK', data: user });
});

// PUT /auth/profile
router.put('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, phone, location } = req.body;
  db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), location = COALESCE(?, location) WHERE id = ?')
    .run(name ?? null, phone ?? null, location ?? null, req.userId);
  const user = db.prepare('SELECT id, name, email, phone, location, account_type, avatar_url, created_at FROM users WHERE id = ?').get(req.userId);
  return res.json({ success: true, message: 'Profile updated', data: user });
});

// PUT /auth/password
router.put('/password', requireAuth, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as User;
  if (!bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.userId);
  return res.json({ success: true, message: 'Password updated' });
});

export default router;
