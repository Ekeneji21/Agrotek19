import fetch from 'node-fetch';
import fs from 'fs';

export interface DetectionResult {
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  treatment: string;
  isHealthy: boolean;
}

// ─── PLANT.ID INTEGRATION ──────────────────────────────────────────────────
// Get your API key at https://plant.id
// Add PLANT_ID_API_KEY=your_key to backend/.env
// The app automatically switches from the fallback to real AI when the key is present.

async function detectWithPlantId(imagePath: string): Promise<DetectionResult> {
  const apiKey = process.env.PLANT_ID_API_KEY!;
  const imageData = fs.readFileSync(imagePath).toString('base64');

  const body = {
    images: [imageData],
    health: 'all',
    similar_images: false,
  };

  const resp = await fetch('https://plant.id/api/v3/health_assessment', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Plant.id API error ${resp.status}: ${err}`);
  }

  const data = await resp.json() as any;

  // Parse Plant.id v3 health_assessment response
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
    };
  }

  const topDisease = result?.disease?.suggestions?.[0];
  const diseaseName = topDisease?.name ?? 'Unidentified Disease';
  const confidence = Math.round((topDisease?.probability ?? 0.5) * 100);

  const treatment = buildTreatment(diseaseName, plantName);
  const severity = confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low';

  return {
    crop: plantName,
    disease: diseaseName,
    confidence,
    severity: severity as DetectionResult['severity'],
    treatment,
    isHealthy: false,
  };
}

// ─── FALLBACK (when no API key is set) ─────────────────────────────────────
// Uses file characteristics as a demonstration stand-in.
// NOT suitable for real diagnosis — only for UI testing.

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
  const cropIdx = fileSizeBytes % CROPS.length;
  const crop = CROPS[cropIdx];
  const diseases = DISEASE_KB[crop];
  const diseaseIdx = Math.floor(fileSizeBytes / 1024) % diseases.length;
  const result = diseases[diseaseIdx];
  const confidence = 82 + (fileSizeBytes % 17);
  return { crop, confidence, isHealthy: false, ...result };
}

// ─── GENERIC TREATMENT BUILDER (used with Plant.id results) ────────────────
function buildTreatment(disease: string, crop: string): string {
  const d = disease.toLowerCase();
  if (d.includes('blight'))  return `For ${disease} on ${crop}: Apply mancozeb or chlorothalonil fungicide every 7–10 days. Remove infected leaves. Ensure good air circulation and avoid overhead irrigation.`;
  if (d.includes('rust'))    return `For ${disease} on ${crop}: Apply propiconazole or tebuconazole systemic fungicide. Monitor regularly from early season. Plant resistant varieties where available.`;
  if (d.includes('wilt'))    return `For ${disease} on ${crop}: No chemical cure — remove and destroy infected plants to prevent spread. Improve drainage. Use resistant varieties next season.`;
  if (d.includes('mildew'))  return `For ${disease} on ${crop}: Apply sulphur-based or systemic fungicide (myclobutanil). Improve air circulation. Avoid excess nitrogen fertilizer.`;
  if (d.includes('spot'))    return `For ${disease} on ${crop}: Apply copper-based or mancozeb fungicide. Remove affected leaves. Rotate crops and avoid working in wet fields.`;
  if (d.includes('armyworm') || d.includes('pest') || d.includes('worm')) return `For ${disease} on ${crop}: Apply appropriate insecticide (emamectin benzoate or chlorpyrifos). Scout fields early morning. Use pheromone traps for monitoring.`;
  return `For ${disease} on ${crop}: Consult your local agronomist for specific treatment recommendations. Remove severely infected plant material and monitor the spread.`;
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────
export async function detectDisease(imagePath: string, fileSizeBytes: number): Promise<DetectionResult> {
  if (process.env.PLANT_ID_API_KEY) {
    return detectWithPlantId(imagePath);
  }
  // No API key — use fallback (for development/demo only)
  console.warn('[Disease Detection] PLANT_ID_API_KEY not set — using demo fallback. Not suitable for real diagnoses.');
  return fallbackDetect(fileSizeBytes);
}
