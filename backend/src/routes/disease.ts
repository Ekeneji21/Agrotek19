import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { detectDisease } from '../services/diseaseDetection';
import { createAlert } from './alerts';

const router = Router();
router.use(requireAuth);

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /disease/scan
router.post('/scan', upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });

  const imagePath = path.join(uploadsDir, req.file.filename);

  try {
    const analysis = await detectDisease(imagePath, req.file.size);
    const id = uuidv4();
    const dbImagePath = `/uploads/${req.file.filename}`;

    db.prepare(`
      INSERT INTO disease_scans (id, user_id, image_path, crop, disease, confidence, severity, treatment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, dbImagePath, analysis.crop, analysis.disease, analysis.confidence, analysis.severity, analysis.treatment);

    // Fire an alert for Medium/High severity detections
    if (!analysis.isHealthy && (analysis.severity === 'High' || analysis.severity === 'Medium')) {
      const alertSeverity = analysis.severity === 'High' ? 'High' : 'Medium';
      createAlert(
        req.userId!,
        'disease',
        `${analysis.severity} Risk: ${analysis.disease} Detected`,
        `AI scan identified ${analysis.disease} on your ${analysis.crop} with ${analysis.confidence}% confidence. ${analysis.severity === 'High' ? 'Immediate action recommended.' : 'Monitor closely and consider treatment.'}`,
        alertSeverity
      );
    }

    const scan = db.prepare('SELECT * FROM disease_scans WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Scan complete', data: scan });
  } catch (err: any) {
    // Clean up uploaded file on error
    fs.unlink(imagePath, () => {});
    return res.status(500).json({ success: false, message: err.message || 'Scan failed' });
  }
});

// GET /disease/history
router.get('/history', (req: AuthRequest, res: Response) => {
  const scans = db.prepare('SELECT * FROM disease_scans WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 20').all(req.userId);
  return res.json({ success: true, message: 'OK', data: scans });
});

// GET /disease/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const scan = db.prepare('SELECT * FROM disease_scans WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
  return res.json({ success: true, message: 'OK', data: scan });
});

export default router;
