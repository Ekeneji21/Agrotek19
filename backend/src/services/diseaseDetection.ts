import fetch from 'node-fetch';
import fs from 'fs';

export interface DetectionResult {
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  treatment: string;
  isHealthy: boolean;
  source: 'huggingface' | 'plant.id' | 'demo';
}

// ─── HUGGING FACE — primary, free, no host restrictions ────────────────────
// Model: mobilenet_v2 fine-tuned on 38 crop disease classes (PlantVillage dataset)
// Classes include: Maize Grey Leaf Spot, Maize Common Rust, Maize Northern Leaf Blight,
// Tomato Early Blight, Tomato Late Blight, Tomato Bacterial Spot, Cotton diseases, etc.
// Get a free token at https://huggingface.co → Settings → Access Tokens → New token (read)

const HF_MODEL = 'linkanjarad/mobilenet_v2_1.0_224-fine-tuned-plant-disease';

async function detectWithHuggingFace(imagePath: string): Promise<DetectionResult> {
  const apiKey = process.env.HF_API_KEY!;
  const imageBuffer = fs.readFileSync(imagePath);

  const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!resp.ok) {
    const err = await resp.text();
    // Model may be loading (503) — give a clear message
    if (resp.status === 503) throw new Error('Model is loading, please retry in 20 seconds');
    throw new Error(`HuggingFace API error ${resp.status}: ${err}`);
  }

  const predictions = await resp.json() as Array<{ label: string; score: number }>;
  if (!Array.isArray(predictions) || predictions.length === 0)
    throw new Error('No predictions returned from model');

  const top = predictions[0];
  return parseHFLabel(top.label, top.score);
}

// HF model labels follow the format: "CropName___ConditionName"
// e.g. "Corn_(maize)___Northern_Leaf_Blight", "Tomato___healthy"
function parseHFLabel(label: string, score: number): DetectionResult {
  const [rawCrop, rawCondition] = label.split('___');

  const crop = rawCrop
    .replace(/_/g, ' ')
    .replace(/\(([^)]+)\)/g, '($1)')
    .replace('Corn (maize)', 'Maize')
    .replace('Grape', 'Grapes')
    .trim();

  const conditionRaw = (rawCondition ?? 'healthy').replace(/_/g, ' ').trim();
  const isHealthy = conditionRaw.toLowerCase() === 'healthy';
  const confidence = Math.round(score * 100);

  if (isHealthy) {
    return {
      crop,
      disease: 'None — Healthy',
      confidence,
      severity: 'Low',
      treatment: `Your ${crop} crop appears healthy. Continue regular monitoring, maintain good field hygiene, and ensure adequate nutrition and irrigation.`,
      isHealthy: true,
      source: 'huggingface',
    };
  }

  const disease = conditionRaw
    .replace(/cercospora leaf spot/i, 'Cercospora Leaf Spot (Grey Leaf Spot)')
    .replace(/northern leaf blight/i, 'Northern Leaf Blight')
    .replace(/common rust/i, 'Common Rust')
    .trim();

  const severity: DetectionResult['severity'] = confidence >= 80 ? 'High' : confidence >= 55 ? 'Medium' : 'Low';

  return {
    crop,
    disease,
    confidence,
    severity,
    treatment: buildTreatment(disease, crop),
    isHealthy: false,
    source: 'huggingface',
  };
}

// ─── PLANT.ID v3 — secondary option ────────────────────────────────────────
// Requires paid plan for server-side use (plant.id free tier locks to one browser domain)
// Set PLANT_ID_API_KEY in .env to enable

async function detectWithPlantId(imagePath: string): Promise<DetectionResult> {
  const apiKey = process.env.PLANT_ID_API_KEY!;
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');

  // Try v3 first, fall back to v2
  for (const [version, url] of [
    ['v3', 'https://plant.id/api/v3/health_assessment'],
    ['v2', 'https://api.plant.id/v2/health_assessment'],
  ] as const) {
    const body = version === 'v3'
      ? { images: [imageBase64], health: 'all', similar_images: false }
      : { images: [`data:image/jpeg;base64,${imageBase64}`], modifiers: ['health_all'] };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (text.includes('Host not in allowlist')) {
      if (version === 'v2') throw new Error('Plant.id: Host not in allowlist on both v2 and v3. Upgrade to a paid plan or use HF_API_KEY instead.');
      continue;
    }
    if (!resp.ok) throw new Error(`Plant.id ${version} error: ${text}`);

    const data = JSON.parse(text) as any;
    return version === 'v3' ? parsePlantIdV3(data) : parsePlantIdV2(data);
  }

  throw new Error('Plant.id: all endpoints failed');
}

function parsePlantIdV3(data: any): DetectionResult {
  const result = data.result;
  const isHealthy = result?.is_healthy?.binary === true;
  const plantName = result?.classification?.suggestions?.[0]?.name ?? 'Unknown Plant';

  if (isHealthy) {
    return { crop: plantName, disease: 'None — Healthy', confidence: Math.round((result?.is_healthy?.probability ?? 0.9) * 100), severity: 'Low', treatment: 'Your crop appears healthy. Continue regular monitoring.', isHealthy: true, source: 'plant.id' };
  }
  const top = result?.disease?.suggestions?.[0];
  const disease = top?.name ?? 'Unidentified Disease';
  const confidence = Math.round((top?.probability ?? 0.5) * 100);
  return { crop: plantName, disease, confidence, severity: confidence >= 80 ? 'High' : confidence >= 55 ? 'Medium' : 'Low', treatment: buildTreatment(disease, plantName), isHealthy: false, source: 'plant.id' };
}

function parsePlantIdV2(data: any): DetectionResult {
  const health = data.health_assessment;
  const plantName = data.suggestions?.[0]?.plant_name ?? 'Unknown Plant';
  const isHealthy = health?.is_healthy === true;

  if (isHealthy) {
    return { crop: plantName, disease: 'None — Healthy', confidence: Math.round((health?.is_healthy_probability ?? 0.9) * 100), severity: 'Low', treatment: 'Your crop appears healthy. Continue regular monitoring.', isHealthy: true, source: 'plant.id' };
  }
  const top = health?.diseases?.[0];
  const disease = top?.name ?? 'Unidentified Disease';
  const confidence = Math.round((top?.probability ?? 0.5) * 100);
  return { crop: plantName, disease, confidence, severity: confidence >= 80 ? 'High' : confidence >= 55 ? 'Medium' : 'Low', treatment: buildTreatment(disease, plantName), isHealthy: false, source: 'plant.id' };
}

// ─── TREATMENT KNOWLEDGE BASE ───────────────────────────────────────────────
const TREATMENTS: Record<string, string> = {
  'Grey Leaf Spot':           'Apply azoxystrobin or propiconazole fungicide at first sign. Practice crop rotation and plant resistant varieties next season.',
  'Cercospora Leaf Spot':     'Apply azoxystrobin or propiconazole fungicide at first sign. Practice crop rotation and plant resistant varieties next season.',
  'Northern Leaf Blight':     'Apply mancozeb or tebuconazole fungicide. Remove and destroy infected plant material. Avoid overhead irrigation.',
  'Common Rust':              'Apply triazole fungicide (propiconazole). Plant rust-resistant hybrids. Scout fields regularly from tasselling.',
  'Fall Armyworm':            'Apply emamectin benzoate or spinetoram insecticide early in infestation. Monitor fields twice weekly. Use pheromone traps.',
  'Early Blight':             'Apply chlorothalonil or mancozeb fungicide every 7 days. Mulch around plants. Remove lower infected leaves.',
  'Late Blight':              'Apply cymoxanil + mancozeb or metalaxyl immediately. Avoid overhead watering. Destroy all infected material.',
  'Bacterial Spot':           'Use copper-based bactericide. Remove infected leaves. Avoid working with plants when wet. Plant certified seed.',
  'Leaf Mold':                'Improve ventilation and reduce humidity. Apply copper fungicide. Avoid overhead irrigation.',
  'Septoria Leaf Spot':       'Apply chlorothalonil or mancozeb. Remove lower infected leaves. Rotate crops; avoid planting tomatoes in same spot.',
  'Spider Mites':             'Apply miticide (abamectin or spiromesifen). Increase humidity. Remove heavily infested plant parts.',
  'Target Spot':              'Apply azoxystrobin or difenoconazole fungicide. Improve air circulation. Practice crop rotation.',
  'Mosaic Virus':             'No cure — remove and destroy infected plants immediately. Control aphid vectors with imidacloprid. Use virus-free certified seed.',
  'Yellow Leaf Curl Virus':   'No cure — remove infected plants. Control whitefly vectors with imidacloprid. Use reflective mulch to deter insects.',
  'Powdery Mildew':           'Apply sulphur-based or systemic fungicide (myclobutanil). Improve air circulation. Avoid excess nitrogen fertilizer.',
  'Downy Mildew':             'Apply fosetyl-aluminium or metalaxyl foliar spray. Improve drainage. Treat seeds with metalaxyl.',
  'Black Rot':                'Apply copper-based fungicide. Remove infected plant material. Improve drainage and air circulation.',
  'Anthracnose':              'Apply thiophanate-methyl or carbendazim. Remove infected debris. Plant resistant varieties.',
  'Bacterial Blight':         'Use copper oxychloride spray. Use certified disease-free seed. Ensure proper drainage and avoid mechanical injuries.',
  'Healthy':                  'Crop appears healthy. Continue regular monitoring, maintain good field hygiene, and ensure adequate nutrition.',
};

function buildTreatment(disease: string, crop: string): string {
  // Try exact match first, then keyword match
  for (const [key, treatment] of Object.entries(TREATMENTS)) {
    if (disease.toLowerCase().includes(key.toLowerCase())) return treatment;
  }
  // Generic fallback
  const d = disease.toLowerCase();
  if (d.includes('blight') || d.includes('spot') || d.includes('mold') || d.includes('mildew') || d.includes('rot'))
    return `For ${disease} on ${crop}: Apply an appropriate fungicide (mancozeb or chlorothalonil). Remove infected plant material. Improve air circulation and avoid overhead irrigation.`;
  if (d.includes('rust'))
    return `For ${disease} on ${crop}: Apply propiconazole or tebuconazole systemic fungicide. Monitor regularly from early season.`;
  if (d.includes('virus') || d.includes('mosaic') || d.includes('curl'))
    return `For ${disease} on ${crop}: No chemical cure — remove infected plants immediately. Control insect vectors. Use certified disease-free seed.`;
  if (d.includes('worm') || d.includes('mite') || d.includes('insect') || d.includes('pest'))
    return `For ${disease} on ${crop}: Apply appropriate insecticide or miticide. Scout fields regularly. Use pheromone traps for monitoring.`;
  return `For ${disease} on ${crop}: Consult your local agronomist for specific treatment. Remove severely infected material and monitor the spread carefully.`;
}

// ─── DEMO FALLBACK (no API keys set) ───────────────────────────────────────
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

function fallbackDetect(fileSizeBytes: number): DetectionResult {
  const entry = DEMO_DISEASES[fileSizeBytes % DEMO_DISEASES.length];
  return {
    ...entry,
    confidence: 82 + (fileSizeBytes % 17),
    treatment: buildTreatment(entry.disease, entry.crop),
    isHealthy: false,
    source: 'demo',
  };
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────
export async function detectDisease(imagePath: string, fileSizeBytes: number): Promise<DetectionResult> {
  // Priority 1: Hugging Face (free, no host restrictions, 38 crop disease classes)
  if (process.env.HF_API_KEY) {
    console.log('[Disease] Using HuggingFace AI model…');
    return detectWithHuggingFace(imagePath);
  }

  // Priority 2: Plant.id (paid plan required for server-side)
  if (process.env.PLANT_ID_API_KEY) {
    console.log('[Disease] Using Plant.id API…');
    return detectWithPlantId(imagePath);
  }

  // Fallback: demo mode
  console.warn('[Disease] No API key set — running in demo mode. Set HF_API_KEY for real AI.');
  return fallbackDetect(fileSizeBytes);
}
