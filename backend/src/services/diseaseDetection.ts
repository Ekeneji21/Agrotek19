import Groq from 'groq-sdk';
import fs from 'fs';

export interface DetectionResult {
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  treatment: string;
  disease_explanation: string;
  isHealthy: boolean;
  source: 'groq' | 'demo';
}

const PROMPT = `You are an expert agricultural plant pathologist.

FIRST: Is this image showing a plant, crop, or plant part (leaf, stem, fruit, flower)?
If NO (e.g. people, animals, objects, code, screenshots, text, soil only) — respond with exactly: {"notPlant":true}

If YES: identify the exact crop from its visual features (leaf shape, texture, color, stem, fruit). Do NOT assume or default to Maize. Possible crops include: Maize, Tobacco, Tomato, Cotton, Wheat, Sorghum, Soybean, Groundnut, Potato, Pepper, Cabbage, Onion, Sugarcane, Sunflower, Cassava, Sweet Potato, Banana, Mango, Citrus, Bean, Cowpea, and others.

Respond with ONLY this JSON — no markdown, no explanation:
{
  "crop": "the actual crop species visible in the image",
  "isHealthy": true or false,
  "disease": "exact disease name, or 'None — Healthy' if healthy",
  "confidence": integer 0-100,
  "severity": "Low" or "Medium" or "High",
  "disease_explanation": "2-3 sentences explaining: what this disease is, how it spreads (causal organism: fungus/bacteria/virus/pest), what conditions trigger it, and what happens to the plant if left untreated",
  "treatment": "2-3 specific actionable treatment sentences with chemical names and Zimbabwe-available products where applicable"
}`;

async function detectWithGroq(imagePath: string): Promise<DetectionResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
    }],
    temperature: 0.1,
  });

  const text = (response.choices[0]?.message?.content ?? '').trim();
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Model returned non-JSON response: ${text.slice(0, 200)}`);
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
    disease_explanation: String(parsed.disease_explanation ?? ''),
    treatment: String(parsed.treatment ?? 'Consult your local agronomist.'),
    isHealthy: Boolean(parsed.isHealthy),
    source: 'groq',
  };
}

// ─── DEMO FALLBACK (no API key set) ──────────────────────────────────────────
const DEMO_DISEASES: { crop: string; disease: string; severity: DetectionResult['severity'] }[] = [
  { crop: 'Maize',   disease: 'Grey Leaf Spot',       severity: 'Medium' },
  { crop: 'Maize',   disease: 'Northern Leaf Blight',  severity: 'High'   },
  { crop: 'Maize',   disease: 'Common Rust',           severity: 'Medium' },
  { crop: 'Tomato',  disease: 'Early Blight',          severity: 'High'   },
  { crop: 'Tomato',  disease: 'Late Blight',           severity: 'High'   },
  { crop: 'Sorghum', disease: 'Anthracnose',           severity: 'High'   },
  { crop: 'Cotton',  disease: 'Bacterial Blight',      severity: 'Low'    },
  { crop: 'Wheat',   disease: 'Powdery Mildew',        severity: 'Medium' },
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
    disease_explanation: 'This disease is caused by a fungal pathogen that spreads through infected crop residue and wind-borne spores. It thrives in warm, humid conditions and can cause significant yield loss if left untreated.',
    treatment: DEMO_TREATMENTS[entry.disease] ?? 'Consult your local agronomist.',
    isHealthy: false,
    source: 'demo',
  };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export async function detectDisease(imagePath: string, fileSizeBytes: number): Promise<DetectionResult> {
  if (process.env.GROQ_API_KEY) {
    console.log('[Disease] Using Groq Llama 3.2 Vision model…');
    return detectWithGroq(imagePath);
  }

  console.warn('[Disease] No GROQ_API_KEY set — running in demo mode. Get a free key at console.groq.com');
  return fallbackDetect(fileSizeBytes);
}
