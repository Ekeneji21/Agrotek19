import fetch from 'node-fetch';
import fs from 'fs';

export interface DetectionResult {
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  treatment: string;
  isHealthy: boolean;
  source: 'plant.id' | 'demo';
}

// ─── PLANT.ID v3 ────────────────────────────────────────────────────────────
async function detectV3(imageBase64: string, apiKey: string): Promise<DetectionResult> {
  const resp = await fetch('https://plant.id/api/v3/health_assessment', {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: [imageBase64], health: 'all', similar_images: false }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(text);

  const data = JSON.parse(text) as any;
  return parseV3Response(data);
}

function parseV3Response(data: any): DetectionResult {
  const result = data.result;
  const isHealthy = result?.is_healthy?.binary === true;
  const plantName = result?.classification?.suggestions?.[0]?.name ?? 'Unknown Plant';

  if (isHealthy) {
    return {
      crop: plantName,
      disease: 'None — Healthy',
      confidence: Math.round((result?.is_healthy?.probability ?? 0.95) * 100),
      severity: 'Low',
      treatment: 'Your crop appears healthy. Continue regular monitoring and good agronomic practices.',
      isHealthy: true,
      source: 'plant.id',
    };
  }

  const topDisease = result?.disease?.suggestions?.[0];
  const diseaseName = topDisease?.name ?? 'Unidentified Disease';
  const confidence = Math.round((topDisease?.probability ?? 0.5) * 100);
  const severity = confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low';

  return {
    crop: plantName,
    disease: diseaseName,
    confidence,
    severity: severity as DetectionResult['severity'],
    treatment: buildTreatment(diseaseName, plantName),
    isHealthy: false,
    source: 'plant.id',
  };
}

// ─── PLANT.ID v2 (fallback if v3 host restriction fires) ───────────────────
async function detectV2(imageBase64: string, apiKey: string): Promise<DetectionResult> {
  const resp = await fetch('https://api.plant.id/v2/health_assessment', {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [`data:image/jpeg;base64,${imageBase64}`],
      modifiers: ['health_all'],
      plant_language: 'en',
      plant_details: ['common_names', 'name_authority'],
    }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(text);

  const data = JSON.parse(text) as any;
  return parseV2Response(data);
}

function parseV2Response(data: any): DetectionResult {
  const health = data.health_assessment;
  const plantName = data.suggestions?.[0]?.plant_name ?? 'Unknown Plant';
  const isHealthy = health?.is_healthy === true;

  if (isHealthy) {
    return {
      crop: plantName,
      disease: 'None — Healthy',
      confidence: Math.round((health?.is_healthy_probability ?? 0.9) * 100),
      severity: 'Low',
      treatment: 'Your crop appears healthy. Continue regular monitoring and good agronomic practices.',
      isHealthy: true,
      source: 'plant.id',
    };
  }

  const topDisease = health?.diseases?.[0];
  const diseaseName = topDisease?.name ?? 'Unidentified Disease';
  const confidence = Math.round((topDisease?.probability ?? 0.5) * 100);
  const severity = confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low';

  return {
    crop: plantName,
    disease: diseaseName,
    confidence,
    severity: severity as DetectionResult['severity'],
    treatment: buildTreatment(diseaseName, plantName),
    isHealthy: false,
    source: 'plant.id',
  };
}

// ─── TREATMENT BUILDER ──────────────────────────────────────────────────────
function buildTreatment(disease: string, crop: string): string {
  const d = disease.toLowerCase();
  if (d.includes('blight'))
    return `For ${disease} on ${crop}: Apply mancozeb or chlorothalonil fungicide every 7–10 days. Remove infected leaves. Ensure good air circulation and avoid overhead irrigation.`;
  if (d.includes('rust'))
    return `For ${disease} on ${crop}: Apply propiconazole or tebuconazole systemic fungicide. Monitor regularly from early season. Plant resistant varieties where available.`;
  if (d.includes('wilt'))
    return `For ${disease} on ${crop}: No chemical cure — remove and destroy infected plants to prevent spread. Improve drainage. Use resistant varieties next season.`;
  if (d.includes('mildew'))
    return `For ${disease} on ${crop}: Apply sulphur-based or systemic fungicide (myclobutanil). Improve air circulation. Avoid excess nitrogen fertilizer.`;
  if (d.includes('spot'))
    return `For ${disease} on ${crop}: Apply copper-based or mancozeb fungicide. Remove affected leaves. Rotate crops and avoid working in wet fields.`;
  if (d.includes('armyworm') || d.includes('worm') || d.includes('pest') || d.includes('insect'))
    return `For ${disease} on ${crop}: Apply emamectin benzoate or chlorpyrifos insecticide. Scout fields early morning. Use pheromone traps for monitoring.`;
  if (d.includes('mosaic') || d.includes('virus'))
    return `For ${disease} on ${crop}: No cure once infected — remove and destroy infected plants immediately. Control insect vectors with imidacloprid. Use certified disease-free seed.`;
  return `For ${disease} on ${crop}: Consult your local agronomist for specific treatment. Remove severely infected material, monitor spread, and consider broad-spectrum fungicide as a precaution.`;
}

// ─── DEMO FALLBACK ──────────────────────────────────────────────────────────
const DISEASE_KB: Record<string, { disease: string; severity: DetectionResult['severity']; treatment: string }[]> = {
  Maize: [
    { disease: 'Grey Leaf Spot', severity: 'Medium', treatment: 'Apply azoxystrobin or propiconazole fungicide at first sign. Ensure good air circulation, practice crop rotation, and plant resistant varieties next season.' },
    { disease: 'Northern Leaf Blight', severity: 'High', treatment: 'Apply mancozeb or tebuconazole fungicide. Remove and destroy infected plant material. Avoid overhead irrigation.' },
    { disease: 'Fall Armyworm', severity: 'High', treatment: 'Apply emamectin benzoate or spinetoram insecticide early in infestation. Monitor fields twice weekly. Use pheromone traps.' },
    { disease: 'Streak Virus', severity: 'High', treatment: 'No cure — remove infected plants immediately. Control leafhopper vectors with imidacloprid. Plant certified virus-free seed.' },
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

const CROPS = Object.keys(DISEASE_KB);

function fallbackDetect(fileSizeBytes: number): DetectionResult {
  const crop = CROPS[fileSizeBytes % CROPS.length];
  const diseases = DISEASE_KB[crop];
  const result = diseases[Math.floor(fileSizeBytes / 1024) % diseases.length];
  return { crop, confidence: 82 + (fileSizeBytes % 17), isHealthy: false, source: 'demo', ...result };
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────
export async function detectDisease(imagePath: string, fileSizeBytes: number): Promise<DetectionResult> {
  const apiKey = process.env.PLANT_ID_API_KEY;

  if (!apiKey) {
    console.warn('[Disease] No PLANT_ID_API_KEY — running in demo mode. Not for real use.');
    return fallbackDetect(fileSizeBytes);
  }

  const imageBase64 = fs.readFileSync(imagePath).toString('base64');

  // Try v3 first, fall back to v2 automatically
  try {
    console.log('[Disease] Running Plant.id v3 health assessment…');
    return await detectV3(imageBase64, apiKey);
  } catch (errV3: any) {
    if (errV3.message?.includes('Host not in allowlist')) {
      console.warn('[Disease] Plant.id v3 host restriction hit — trying v2 endpoint…');
      console.warn('[Disease] To fix permanently: plant.id → My Account → API Keys → clear "Allowed hosts"');
    } else {
      console.warn(`[Disease] v3 failed (${errV3.message}) — trying v2…`);
    }

    try {
      return await detectV2(imageBase64, apiKey);
    } catch (errV2: any) {
      console.error(`[Disease] Both v3 and v2 failed. v2 error: ${errV2.message}`);
      throw new Error(`Plant.id detection failed: ${errV3.message}. Fix: go to plant.id → My Account → API Keys → remove host restrictions.`);
    }
  }
}
