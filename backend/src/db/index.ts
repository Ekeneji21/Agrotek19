// node:sqlite is built into Node.js 22.5+ — no npm package needed
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './agrisense.db';
const resolvedPath = path.resolve(dbPath);

const db = new DatabaseSync(resolvedPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      location TEXT DEFAULT '',
      account_type TEXT DEFAULT 'free',
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      size_ha REAL NOT NULL DEFAULT 0,
      crops TEXT NOT NULL DEFAULT '[]',
      irrigation_type TEXT DEFAULT 'Manual',
      health_pct INTEGER DEFAULT 85,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disease_scans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL,
      crop TEXT NOT NULL,
      disease TEXT NOT NULL,
      confidence REAL NOT NULL,
      severity TEXT NOT NULL,
      treatment TEXT NOT NULL,
      scanned_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      disease_alerts INTEGER DEFAULT 1,
      weather_warnings INTEGER DEFAULT 1,
      market_updates INTEGER DEFAULT 1,
      advisory_messages INTEGER DEFAULT 1,
      weekly_reports INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS agronomists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      location TEXT NOT NULL,
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      available INTEGER DEFAULT 1,
      avatar_url TEXT,
      bio TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      whatsapp TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS advisory_tips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_usd REAL NOT NULL,
      unit TEXT NOT NULL,
      rating REAL DEFAULT 4.0,
      review_count INTEGER DEFAULT 0,
      seller TEXT NOT NULL,
      image_url TEXT,
      stock INTEGER DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      items TEXT NOT NULL DEFAULT '[]',
      total_usd REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      farm_id TEXT REFERENCES farms(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      amount_usd REAL NOT NULL,
      description TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Add new columns to existing tables if upgrading
  try { db.exec(`ALTER TABLE agronomists ADD COLUMN phone TEXT DEFAULT ''`); } catch {}
  try { db.exec(`ALTER TABLE agronomists ADD COLUMN whatsapp TEXT DEFAULT ''`); } catch {}

  seedData();
}

function seedData() {
  const agCount = db.prepare('SELECT COUNT(*) as c FROM agronomists').get() as { c: number };
  if (agCount.c > 0) {
    // Update existing agronomists with phone/whatsapp if missing
    db.prepare(`UPDATE agronomists SET phone='+263 77 234 5610', whatsapp='263772345610' WHERE id='ag-1' AND phone=''`).run();
    db.prepare(`UPDATE agronomists SET phone='+263 78 456 7821', whatsapp='263784567821' WHERE id='ag-2' AND phone=''`).run();
    db.prepare(`UPDATE agronomists SET phone='+263 71 678 9032', whatsapp='263716789032' WHERE id='ag-3' AND phone=''`).run();
    db.prepare(`UPDATE agronomists SET phone='+263 77 890 1243', whatsapp='263778901243' WHERE id='ag-4' AND phone=''`).run();
    return;
  }

  const insertAg = db.prepare(`
    INSERT INTO agronomists (id, name, specialty, location, rating, review_count, available, bio, phone, whatsapp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const agronomists = [
    ['ag-1', 'Dr. Tapiwa Moyo', 'Cereal Crops & Disease Management', 'Harare', 4.9, 128, 1,
      'PhD in Plant Pathology from UZ. 15+ years in maize and sorghum disease management across Zimbabwe.',
      '+263 77 234 5610', '263772345610'],
    ['ag-2', 'Dr. Chiedza Ndlovu', 'Cotton & Tobacco Specialist', 'Bulawayo', 4.7, 95, 1,
      'Specialist in cash crop production and integrated pest management for cotton and tobacco.',
      '+263 78 456 7821', '263784567821'],
    ['ag-3', 'Eng. Blessing Mufara', 'Irrigation & Soil Health', 'Mutare', 4.8, 76, 0,
      'Agricultural Engineer with expertise in drip/sprinkler systems and soil fertility programs.',
      '+263 71 678 9032', '263716789032'],
    ['ag-4', 'Dr. Rutendo Zimba', 'Horticulture & Vegetable Crops', 'Gweru', 4.6, 61, 1,
      'Specialist in commercial vegetable production, greenhouse management, and export-quality standards.',
      '+263 77 890 1243', '263778901243'],
    ['ag-5', 'Mr. Farai Chikwanda', 'Smallholder Farming & Subsidies', 'Masvingo', 4.5, 44, 1,
      'Extension officer with 10+ years helping smallholder farmers access government subsidy programs.',
      '+263 78 012 3454', '263780123454'],
    ['ag-6', 'Dr. Nyasha Dube', 'Livestock & Mixed Farming', 'Gwanda', 4.8, 83, 1,
      'Veterinarian and agronomist specialising in integrated crop-livestock systems for semi-arid regions.',
      '+263 71 234 5665', '263712345665'],
  ];

  const insertTip = db.prepare(`
    INSERT INTO advisory_tips (id, title, description, category) VALUES (?, ?, ?, ?)
  `);

  const tips = [
    ['tip-1', 'Crop Rotation Best Practices', 'Rotate maize, sorghum, and legumes to maintain soil health and suppress diseases.', 'Soil Health'],
    ['tip-2', 'Water-Efficient Irrigation', 'Reduce water usage by up to 30% without affecting yield using deficit irrigation.', 'Irrigation'],
    ['tip-3', 'Integrated Pest Management', 'Combine biological, cultural, and chemical methods for sustainable pest control.', 'Pest Control'],
    ['tip-4', 'Post-Harvest Handling', 'Reduce losses with proper drying, sorting, and hermetic storage methods.', 'Storage'],
    ['tip-5', 'Soil Testing & Fertilizer Planning', 'Interpret soil test results and develop a cost-effective fertilizer programme.', 'Soil Health'],
    ['tip-6', 'Drought-Tolerant Variety Selection', 'Choose the right variety for low-rainfall regions to secure yield under water stress.', 'Seeds'],
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, price_usd, unit, rating, review_count, seller, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['prod-1', 'Azoxystrobin Fungicide', 'Chemicals', 45, '1L', 4.6, 42, 'AgroChem Zim', 85],
    ['prod-2', 'Hybrid Maize Seed SC513', 'Seeds', 32, '10kg', 4.8, 89, 'SeedCo Zimbabwe', 200],
    ['prod-3', 'Drip Irrigation Kit (1 ha)', 'Equipment', 250, 'kit', 4.5, 31, 'IrriTech Harare', 15],
    ['prod-4', 'NPK Fertilizer 7:14:7', 'Fertilizer', 28, '50kg', 4.7, 67, 'ZimFert Ltd', 320],
    ['prod-5', 'Knapsack Sprayer 16L', 'Equipment', 85, 'unit', 4.3, 24, 'FarmTools Zim', 50],
    ['prod-6', 'Cotton Seed SZ-75', 'Seeds', 18, '5kg', 4.4, 53, 'Cottco Seeds', 140],
    ['prod-7', 'Mancozeb 80% WP Fungicide', 'Chemicals', 22, '500g', 4.5, 38, 'AgroChem Zim', 95],
    ['prod-8', 'Urea Fertilizer 46% N', 'Fertilizer', 35, '50kg', 4.6, 72, 'ZimFert Ltd', 280],
  ];

  db.exec('BEGIN');
  try {
    agronomists.forEach(a => insertAg.run(...a));
    tips.forEach(t => insertTip.run(...t));
    products.forEach(p => insertProduct.run(...p));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export default db;
