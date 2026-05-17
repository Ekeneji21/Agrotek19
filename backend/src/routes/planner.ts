import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import fetch from 'node-fetch';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Zimbabwe districts → coordinates + agro-ecological region
const ZIM_DISTRICTS: Record<string, { lat: number; lng: number; region: string }> = {
  'Harare':          { lat: -17.83, lng: 31.03, region: 'II' },
  'Mazowe':          { lat: -17.50, lng: 30.97, region: 'II' },
  'Marondera':       { lat: -18.18, lng: 31.55, region: 'II' },
  'Bindura':         { lat: -17.30, lng: 31.32, region: 'II' },
  'Chinhoyi':        { lat: -17.37, lng: 30.20, region: 'II' },
  'Chegutu':         { lat: -18.13, lng: 30.15, region: 'II' },
  'Mutare':          { lat: -18.97, lng: 32.67, region: 'I' },
  'Chipinge':        { lat: -20.18, lng: 32.62, region: 'I' },
  'Nyanga':          { lat: -18.22, lng: 32.75, region: 'I' },
  'Gweru':           { lat: -19.45, lng: 29.82, region: 'III' },
  'Kwekwe':          { lat: -18.93, lng: 29.81, region: 'III' },
  'Kadoma':          { lat: -18.33, lng: 29.92, region: 'III' },
  'Zvishavane':      { lat: -20.33, lng: 30.03, region: 'III' },
  'Bulawayo':        { lat: -20.13, lng: 28.63, region: 'IV' },
  'Plumtree':        { lat: -20.48, lng: 27.83, region: 'IV' },
  'Hwange':          { lat: -18.37, lng: 26.50, region: 'IV' },
  'Victoria Falls':  { lat: -17.93, lng: 25.83, region: 'IV' },
  'Beitbridge':      { lat: -22.22, lng: 30.00, region: 'V' },
  'Chiredzi':        { lat: -21.05, lng: 31.67, region: 'V' },
  'Masvingo':        { lat: -20.07, lng: 30.83, region: 'III' },
  'Kariba':          { lat: -16.52, lng: 28.80, region: 'IV' },
  'Gokwe':           { lat: -18.22, lng: 28.93, region: 'III' },
  'Murewa':          { lat: -17.63, lng: 31.77, region: 'II' },
  'Wedza':           { lat: -18.60, lng: 31.57, region: 'II' },
  'Gutu':            { lat: -20.67, lng: 31.35, region: 'III' },
};

const REGION_DESC: Record<string, string> = {
  'I':   'Eastern Highlands — rainfall >1000mm/yr, cool temperatures, suited for tea, coffee, macadamia, intensive horticulture',
  'II':  'Mashonaland — rainfall 750-1000mm/yr, good for intensive cropping: maize, tobacco, soybean, wheat, horticulture',
  'III': 'Midlands — rainfall 500-750mm/yr, semi-intensive: cotton, sorghum, sunflower, groundnut, drought-tolerant maize',
  'IV':  'Matabeleland — rainfall 450-650mm/yr, semi-extensive: cattle ranching, sorghum, millet, cotton',
  'V':   'Lowveld — rainfall <450mm/yr, extensive/irrigation: sugarcane (irrigation), cattle, game',
};

async function getWeatherContext(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=14&timezone=Africa%2FHarare`;
    const res = await fetch(url);
    const data = await res.json() as any;
    const daily = data.daily;
    if (!daily) return 'Weather data unavailable';

    const avgMax = (daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / 14).toFixed(1);
    const avgMin = (daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) / 14).toFixed(1);
    const totalRain = daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0).toFixed(1);
    const rainDays = daily.precipitation_sum.filter((r: number) => r > 1).length;

    return `Current 14-day forecast: avg max ${avgMax}°C, avg min ${avgMin}°C, total rain ${totalRain}mm over ${rainDays} rainy days.`;
  } catch {
    return 'Weather data unavailable.';
  }
}

const PLAN_PROMPT = (crop: string, quantity: string, unit: string, district: string, region: string, regionDesc: string, weather: string, month: string) => `
You are an expert Zimbabwean agricultural advisor with 20+ years experience helping smallholder and commercial farmers in Zimbabwe.

A farmer in ${district}, Zimbabwe (Agro-Ecological Region ${region}: ${regionDesc}) wants to grow:
- Crop: ${crop}
- Quantity: ${quantity} ${unit}
- Current month: ${month}
- Weather context: ${weather}

Generate a complete, highly practical farming plan. Respond with ONLY valid JSON — no markdown, no explanation:

{
  "crop": "${crop}",
  "location": "${district}",
  "region": "${region}",
  "quantity_summary": "e.g. 1500 plants covering approx 0.5 ha",
  "land_needed_ha": number,
  "planting_window": "e.g. October - November",
  "expected_harvest": "e.g. April - May",
  "season_suitability": "Good / Fair / Poor — with one sentence reason",
  "variety_recommendation": "specific variety names suited for Region ${region} in Zimbabwe",
  "phases": [
    {
      "name": "phase name",
      "timeline": "e.g. August Week 1-2",
      "duration": "e.g. 2 weeks",
      "tasks": ["specific task 1", "specific task 2", "specific task 3"],
      "warning": "optional critical warning or null"
    }
  ],
  "inputs": [
    {
      "name": "exact product name",
      "category": "Seeds | Fertilizer | Chemical | Labour | Equipment | Other",
      "quantity": "exact amount with units",
      "timing": "when to apply",
      "cost_usd": number,
      "local_source": "where to buy in Zimbabwe"
    }
  ],
  "labour": {
    "total_person_days": number,
    "peak_period": "when most labour is needed",
    "estimated_cost_usd": number
  },
  "costs": {
    "inputs_usd": number,
    "labour_usd": number,
    "total_usd": number
  },
  "yield": {
    "unit": "kg or bales or tonnes",
    "expected": number,
    "min": number,
    "max": number,
    "farmgate_price_usd_per_unit": number,
    "expected_revenue_usd": number,
    "expected_profit_usd": number
  },
  "risks": ["specific risk 1", "specific risk 2"],
  "key_tips": ["practical tip 1", "practical tip 2", "practical tip 3"]
}

Rules:
- All costs in USD realistic for Zimbabwe 2024/2025
- All quantities exact — never say "sufficient" or "as needed"
- Mention specific Zimbabwe brands/suppliers: SeedCo, Agritex, ZimFert, Cottco, TIMB, GMB, Prodairy, etc.
- phases must cover full crop cycle from land prep to post-harvest
- inputs list must be complete — include every seed, fertilizer, chemical, tool needed
- yield estimates must be realistic for Region ${region} smallholder conditions
`.trim();

// POST /planner/generate
router.post('/generate', async (req: AuthRequest, res: Response) => {
  const { crop, quantity, unit, district } = req.body;
  if (!crop || !quantity || !unit || !district) {
    return res.status(400).json({ success: false, message: 'crop, quantity, unit, and district are required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI planner not configured. Add GROQ_API_KEY to .env' });
  }

  const location = ZIM_DISTRICTS[district] ?? { lat: -17.83, lng: 31.03, region: 'II' };
  const weather = await getWeatherContext(location.lat, location.lng);
  const month = new Date().toLocaleString('en-ZW', { month: 'long', timeZone: 'Africa/Harare' });
  const regionDesc = REGION_DESC[location.region] ?? '';

  const prompt = PLAN_PROMPT(crop, String(quantity), unit, district, location.region, regionDesc, weather, month);

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const text = (completion.choices[0]?.message?.content ?? '').trim();
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let plan: any;
    try {
      plan = JSON.parse(jsonText);
    } catch {
      return res.status(500).json({ success: false, message: 'AI returned invalid response. Please try again.' });
    }

    // Save plan to DB
    const id = uuidv4();
    db.prepare(`
      INSERT INTO farm_plans (id, user_id, crop, location, quantity, plan_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, crop, district, `${quantity} ${unit}`, JSON.stringify(plan));

    return res.json({ success: true, message: 'Plan generated', data: { id, ...plan } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to generate plan' });
  }
});

// GET /planner/saved — list saved plans
router.get('/saved', (req: AuthRequest, res: Response) => {
  const plans = db.prepare(`
    SELECT id, crop, location, quantity, created_at FROM farm_plans
    WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.userId);
  return res.json({ success: true, message: 'OK', data: plans });
});

// GET /planner/saved/:id — get full saved plan
router.get('/saved/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM farm_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!row) return res.status(404).json({ success: false, message: 'Plan not found' });
  return res.json({ success: true, message: 'OK', data: { id: row.id, ...JSON.parse(row.plan_json), created_at: row.created_at } });
});

// DELETE /planner/saved/:id
router.delete('/saved/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM farm_plans WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  return res.json({ success: true, message: 'Deleted', data: null });
});

export default router;
