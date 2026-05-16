import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';

import authRoutes from './routes/auth';
import farmsRoutes from './routes/farms';
import diseaseRoutes from './routes/disease';
import weatherRoutes from './routes/weather';
import alertsRoutes from './routes/alerts';
import advisoryRoutes from './routes/advisory';
import marketplaceRoutes from './routes/marketplace';
import analyticsRoutes from './routes/analytics';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

initDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgriSense API running on http://localhost:${PORT}/api`);
});

export default app;
