import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { DiseaseScan } from '../types';

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

// Disease knowledge base for realistic AI responses
// In production, replace analyzeImage() with a real ML model call (e.g. TensorFlow, Roboflow, PlantNet API)
const DISEASE_KNOWLEDGE: Record<string, { disease: string; severity: string; treatment: string }[]> = {
  Maize: [
    { disease: 'Grey Leaf Spot', severity: 'Medium', treatment: 'Apply azoxystrobin or propiconazole fungicide at first sign. Ensure good air circulation, practice crop rotation, and plant resistant varieties next season.' },
    { disease: 'Northern Leaf Blight', severity: 'High', treatment: 'Apply mancozeb or tebuconazole fungicide. Remove and destroy infected plant material. Avoid overhead irrigation.' },
    { disease: 'Fall Armyworm', severity: 'High', treatment: 'Apply emamectin benzoate or spinetoram insecticide early in infestation. Monitor fields twice weekly. Use pheromone traps.' },
    { disease: 'Streak Virus', severity: 'High', treatment: 'No cure; remove infected plants immediately. Control leafhopper vectors with imidacloprid. Plant certified virus-free seed.' },
  ],
  Sorghum: [
    { disease: 'Anthracnose', severity: 'High', treatment: 'Apply thiophanate-methyl or carbendazim. Remove infected debris. Plant resistant varieties and avoid dense planting.' },
    { disease: 'Downy Mildew', severity: 'Medium', treatment: 'Seed treatment with metalaxyl. Apply fosetyl-aluminium foliar spray. Improve field drainage.' },
    { disease: 'Head Smut', severity: 'Medium', treatment: 'Use certified smut-free seed. Treat seeds with carboxin + thiram. Remove galls before they break open.' },
  ],
  Cotton: [
    { disease: 'Bacterial Blight', severity: 'Low', treatment: 'Use certified disease-free seed. Apply copper oxychloride spray. Ensure proper field drainage and avoid mechanical injuries.' },
    { disease: 'Bollworm Infestation', severity: 'High', treatment: 'Apply cypermethrin or chlorpyrifos. Monitor with pheromone traps. Use Bt-based biopesticides for early-stage larvae.' },
    { disease: 'Alternaria Leaf Spot', severity: 'Medium', treatment: 'Apply mancozeb or chlorothalonil. Reduce humidity through proper spacing. Destroy crop debris after harvest.' },
  ],
  Tomato: [
    { disease: 'Early Blight', severity: 'High', treatment: 'Apply chlorothalonil or mancozeb fungicide every 7 days. Mulch around plants to prevent soil splash. Remove lower infected leaves.' },
    { disease: 'Late Blight', severity: 'High', treatment: 'Apply cymoxanil + mancozeb or metalaxyl immediately. Avoid overhead watering. Destroy all infected plant material.' },
    { disease: 'Fusarium Wilt', severity: 'High', treatment: 'No effective chemical cure. Remove and destroy infected plants. Solarize soil. Plant resistant varieties next season.' },
  ],
  Wheat: [
    { disease: 'Stem Rust', severity: 'High', treatment: 'Apply propiconazole or tebuconazole at flag leaf stage. Plant resistant varieties. Monitor from ear emergence.' },
    { disease: 'Powdery Mildew', severity: 'Medium', treatment: 'Apply triadimefon or myclobutanil. Ensure adequate spacing for air circulation. Avoid excess nitrogen.' },
  ],
};

const CROPS = Object.keys(DISEASE_KNOWLEDGE);

function analyzeImage(fileSizeBytes: number): { crop: string; disease: string; confidence: number; severity: string; treatment: string } {
  // Deterministic-ish selection based on file characteristics
  // Replace this function body with a real ML model call in production
  const cropIdx = fileSizeBytes % CROPS.length;
  const crop = CROPS[cropIdx];
  const diseases = DISEASE_KNOWLEDGE[crop];
  const diseaseIdx = Math.floor(fileSizeBytes / 1024) % diseases.length;
  const result = diseases[diseaseIdx];
  const confidence = 82 + (fileSizeBytes % 17); // 82–98%

  return { crop, confidence, ...result };
}

// POST /disease/scan
router.post('/scan', upload.single('image'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });

  const analysis = analyzeImage(req.file.size);
  const id = uuidv4();
  const imagePath = `/uploads/${req.file.filename}`;

  db.prepare(`
    INSERT INTO disease_scans (id, user_id, image_path, crop, disease, confidence, severity, treatment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, imagePath, analysis.crop, analysis.disease, analysis.confidence, analysis.severity, analysis.treatment);

  const scan = db.prepare('SELECT * FROM disease_scans WHERE id = ?').get(id);
  return res.json({ success: true, message: 'Scan complete', data: scan });
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
