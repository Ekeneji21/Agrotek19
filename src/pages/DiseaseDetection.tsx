import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Loader2, AlertTriangle, CheckCircle, Leaf, Bug, Zap } from 'lucide-react';

interface ScanResult {
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
}

// Simulated AI scan - replace with diseaseApi.scanImage(file) when backend is ready
const simulateScan = (file: File): Promise<ScanResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const diseases = [
        { crop: 'Maize', disease: 'Grey Leaf Spot', confidence: 94, severity: 'Medium', treatment: 'Apply fungicide (azoxystrobin) at first sign of symptoms. Rotate crops and use resistant varieties.' },
        { crop: 'Sorghum', disease: 'Anthracnose', confidence: 87, severity: 'High', treatment: 'Remove infected plant debris. Apply thiophanate-methyl. Plant resistant varieties next season.' },
        { crop: 'Cotton', disease: 'Bacterial Blight', confidence: 91, severity: 'Low', treatment: 'Use certified disease-free seed. Apply copper-based bactericides. Ensure proper field drainage.' },
        { crop: 'Tomato', disease: 'Early Blight', confidence: 96, severity: 'High', treatment: 'Apply chlorothalonil or mancozeb fungicide. Mulch around plants to prevent soil splash.' },
      ];
      resolve(diseases[Math.floor(Math.random() * diseases.length)]);
    }, 2500);
  });
};

export function DiseaseDetection() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<(ScanResult & { image: string; date: string })[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setResult(null);
    try {
      // Replace with: const res = await diseaseApi.scanImage(file);
      const res = await simulateScan(file);
      setResult(res);
      setHistory(prev => [{ ...res, image: image!, date: new Date().toLocaleString() }, ...prev].slice(0, 10));
    } catch {
      alert('Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const clearImage = () => { setImage(null); setFile(null); setResult(null); };

  const severityColor = (s: string) => s === 'High' ? 'badge-red' : s === 'Medium' ? 'badge-orange' : 'badge-green';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>AI Disease Detection</h1>
          <p className="text-sm text-muted mt-1">Upload or capture a crop image for instant AI-powered diagnosis.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Upload Section */}
        <div className="col-span-5 card animate-fade-in">
          <h2 className="card-title mb-4">Scan Your Crop</h2>

          {!image ? (
            <>
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                style={{ minHeight: 260 }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={40} />
                <div className="font-semibold mt-2">Drag & drop your crop image here</div>
                <div className="text-xs text-muted mt-1">or click to browse • JPG, PNG up to 10MB</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

              <div className="flex gap-3 mt-4">
                <button className="btn btn-primary flex-1" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} /> Upload Image
                </button>
                <button className="btn btn-outline flex-1" onClick={() => fileRef.current?.click()}>
                  <Camera size={16} /> Take Photo
                </button>
              </div>
            </>
          ) : (
            <div className="animate-fade-in">
              <div className="relative rounded-md overflow-hidden mb-4" style={{ maxHeight: 300 }}>
                <img src={image} alt="Uploaded crop" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg-color)' }} />
                <button className="btn-icon absolute" style={{ top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white' }} onClick={clearImage}>
                  <X size={16} />
                </button>
              </div>

              <button className="btn btn-primary btn-lg w-full" onClick={handleScan} disabled={scanning}>
                {scanning ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing with AI...</> : <><Zap size={18} /> Run AI Diagnosis</>}
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="col-span-7 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title mb-4">Diagnosis Results</h2>

          {!result && !scanning && (
            <div className="empty-state">
              <Bug size={48} />
              <h3>No Scan Results Yet</h3>
              <p>Upload a crop image and run the AI scanner to get instant disease detection and treatment recommendations.</p>
            </div>
          )}

          {scanning && (
            <div className="empty-state animate-pulse">
              <span className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <h3 className="mt-4">Analyzing Image...</h3>
              <p>Our AI model is identifying diseases in your crop image. This usually takes a few seconds.</p>
            </div>
          )}

          {result && !scanning && (
            <div className="animate-fade-in">
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                {/* Main Result */}
                <div className="scan-result-card flex-1" style={{ minWidth: 220, borderLeft: '4px solid var(--primary-green)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={20} className="text-primary" />
                    <span className="font-bold text-lg">Detection Complete</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Crop Identified</span>
                      <span className="font-semibold">{result.crop}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border-color)' }} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Disease Detected</span>
                      <span className="font-semibold text-danger">{result.disease}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border-color)' }} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Confidence</span>
                      <span className="font-bold text-primary text-lg">{result.confidence}%</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border-color)' }} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Severity</span>
                      <span className={`badge ${severityColor(result.severity)}`}>
                        <AlertTriangle size={10} /> {result.severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Treatment */}
                <div className="scan-result-card flex-1" style={{ minWidth: 220, background: 'var(--light-green)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf size={20} className="text-primary" />
                    <span className="font-bold">Recommended Treatment</span>
                  </div>
                  <p className="text-sm" style={{ lineHeight: 1.7 }}>{result.treatment}</p>
                  <button className="btn btn-primary btn-sm mt-4">Contact Agronomist</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scan History */}
        {history.length > 0 && (
          <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="card-title mb-4">Scan History</h2>
            <div className="flex gap-3 overflow-hidden" style={{ flexWrap: 'wrap' }}>
              {history.map((item, i) => (
                <div key={i} className="scan-result-card flex gap-3 items-center" style={{ flex: '1 1 300px', maxWidth: 400 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.image} alt={item.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{item.crop} – {item.disease}</span>
                      <span className={`badge ${severityColor(item.severity)}`}>{item.confidence}%</span>
                    </div>
                    <div className="text-xs text-muted mt-1">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
