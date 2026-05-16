import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export interface DetectionResult {
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  treatment: string;
  isHealthy: boolean;
  source: 'gemini' | 'demo';
}

const PROMPT = `You are an expert agricultural plant pathologist specializing in African and Zimbabwean crops.

FIRST — decide if this image shows a crop, plant, or plant part (leaf, stem, fruit, root).
If it does NOT show a plant or crop, respond with exactly:
{"notPlant": true}

If it IS a plant/crop, respond with ONLY this JSON — no markdown, no explanation:
{
  "crop": "common crop name (e.g. Maize, Tomato, Cotton, Wheat, Sorghum, Soybean, Groundnut)",
  "isHealthy": true or false,
  "disease": "exact disease name, or 'None — Healthy' if healthy",
  "confidence": integer 0-100,
  "severity": "Low" or "Medium" or "High",
  "treatment": "2-3 specific, actionable treatment sentences including chemical names where applicable"
}

Rules:
- Only analyse actual plant/crop tissue — reject animals, people, objects, soil only, etc.
- If the plant is healthy, set isHealthy=true, disease='None — Healthy', severity='Low'
- severity: Low=early/minor, Medium=moderate spread, High=severe/widespread
- treatment must be practical for a Zimbabwean smallholder farmer
- If the image is too blurry or dark to assess, respond with {"notPlant": true}`;

async function detectWithGemini(imagePath: string): Promise<DetectionResult> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const result = await model.generateContent([
    PROMPT,
    { inlineData: { data: base64, mimeType } },
  ]);

  const text = result.response.text().trim();
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (parsed.notPlant) {
    throw new Error('Image does not appear to show a crop or plant. Please upload a clear photo of a plant leaf, stem, or fruit.');
  }

  const severity: DetectionResult['severity'] =
    parsed.severity === 'High' ? 'High' : parsed.severity === 'Medium' ? 'Medium' : 'Low';

  return {
    crop: String(parsed.crop ?? 'Unknown'),
    disease: String(parsed.disease ?? 'Unknown'),
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
    severity,
    treatment: String(parsed.treatment ?? 'Consult your local agronomist.'),
    isHealthy: Boolean(parsed.isHealthy),
    source: 'gemini',
  };
}

// ─── DEMO FALLBACK (no API key set) ──────────────────────────────────────────
const DEMO_DISEASES: { crop: string; disease: string; severity: DetectionResult['severity'] }[] = [
  { crop: 'Maize',   disease: 'Grey Leaf Spot',      severity: 'Medium' },
  { crop: 'Maize',   disease: 'Northern Leaf Blight', severity: 'High'   },
  { crop: 'Maize',   disease: 'Common Rust',          severity: 'Medium' },
  { crop: 'Tomato',  disease: 'Early Blight',         severity: 'High'   },
  { crop: 'Tomato',  disease: 'Late Blight',          severity: 'High'   },
  { crop: 'Sorghum', disease: 'Anthracnose',          severity: 'High'   },
  { crop: 'Cotton',  disease: 'Bacterial Blight',     severity: 'Low'    },
  { crop: 'Wheat',   disease: 'Powdery Mildew',       severity: 'Medium' },
];

const DEMO_TREATMENTS: Record<string, string> = {
  'Grey Leaf Spot':       'Apply azoxystrobin or propiconazole fungicide at first sign. Practice crop rotation and plant resistant varieties next season.',
  'Northern Leaf Blight': 'Apply mancozeb or tebuconazole fungicide. Remove and destroy infected plant material. Avoid overhead irrigation.',
  'Common Rust':          'Apply triazole fungicide (propiconazole). Plant rust-resistant hybrids. Scout fields regularly from tasselling.',
  'Early Blight':         'Apply chlorothalonil or mancozeb fungicide every 7 days. Mulch around plants. Remove lower infected leaves.',
  'Late Blight':          'Apply cymoxanil + mancozeb or metalaxyl immediately. Avoid overhead watering. Destroy all infected material.',
  'Anthracnose':          'Apply thiophanate-methyl or carbendazim. Remove infected debris. Plant resistant varieties.',
  'Bacterial Blight':     'Use copper oxychloride spray. Use certified disease-free seed. Ensure proper drainage.',
  'Powdery Mildew':       'Apply sulphur-based or systemic fungicide (myclobutanil). Improve air circulation. Avoid excess nitrogen fertilizer.',
};

function fallbackDetect(fileSizeBytes: number): DetectionResult {
  const entry = DEMO_DISEASES[fileSizeBytes % DEMO_DISEASES.length];
  return {
    ...entry,
    confidence: 82 + (fileSizeBytes % 17),
    treatment: DEMO_TREATMENTS[entry.disease] ?? 'Consult your local agronomist.',
    isHealthy: false,
    source: 'demo',
  };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export async function detectDisease(imagePath: string, fileSizeBytes: number): Promise<DetectionResult> {
  if (process.env.GEMINI_API_KEY) {
    console.log('[Disease] Using Gemini 2.0 Flash vision model…');
    return detectWithGemini(imagePath);
  }

  console.warn('[Disease] No GEMINI_API_KEY set — running in demo mode. Get a free key at aistudio.google.com');
  return fallbackDetect(fileSizeBytes);
}
