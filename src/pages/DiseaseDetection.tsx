import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Camera, X, Loader2, AlertTriangle, CheckCircle, Leaf, Bug, Zap, Info } from 'lucide-react';
import { diseaseApi } from '../services/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

interface ScanResult {
  id: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  disease_explanation: string;
  image_path: string;
  scanned_at: string;
}

interface Props { setActiveTab: (tab: string) => void; }

export function DiseaseDetection({ setActiveTab }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    diseaseApi.getHistory()
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

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
    setError(null);
    try {
      const res = await diseaseApi.scanImage(file);
      setResult(res.data as ScanResult);
      setHistory(prev => [res.data as ScanResult, ...prev].slice(0, 20));
    } catch (err: any) {
      setError(err.message || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const clearImage = () => { setImage(null); setFile(null); setResult(null); setError(null); };
  const severityColor = (s: string) => s === 'High' ? 'badge-red' : s === 'Medium' ? 'badge-orange' : 'badge-green';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>AI Disease Detection</h1>
          <p className="text-sm text-muted mt-1">Upload a crop image for instant AI-powered diagnosis.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Upload */}
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
                <div className="text-xs text-muted mt-1">or click to browse · JPG, PNG up to 10MB</div>
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
                {scanning
                  ? <><Loader2 size={18} className="animate-spin" /> Analyzing with AI…</>
                  : <><Zap size={18} /> Run AI Diagnosis</>}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="col-span-7 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title mb-4">Diagnosis Results</h2>

          {error && !scanning && (
            <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
              <AlertTriangle size={48} />
              <h3 style={{ color: 'var(--danger-color)' }}>Scan Failed</h3>
              <p>{error}</p>
            </div>
          )}

          {!result && !scanning && !error && (
            <div className="empty-state">
              <Bug size={48} />
              <h3>No Scan Results Yet</h3>
              <p>Upload a crop image and run the AI scanner to get instant disease detection and treatment recommendations.</p>
            </div>
          )}

          {scanning && (
            <div className="empty-state animate-pulse">
              <Loader2 size={48} className="animate-spin" />
              <h3 className="mt-4">Analyzing Image…</h3>
              <p>Our AI model is identifying diseases. This usually takes a few seconds.</p>
            </div>
          )}

          {result && !scanning && (
            <div className="animate-fade-in">
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="scan-result-card flex-1" style={{ minWidth: 220, borderLeft: '4px solid var(--primary-green)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={20} className="text-primary" />
                    <span className="font-bold text-lg">Detection Complete</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Crop Identified', value: result.crop },
                      { label: 'Disease Detected', value: result.disease, danger: true },
                      { label: 'Confidence', value: `${result.confidence}%`, bold: true },
                    ].map(row => (
                      <React.Fragment key={row.label}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted">{row.label}</span>
                          <span className={`font-semibold${row.danger ? ' text-danger' : ''}${row.bold ? ' text-primary text-lg' : ''}`}>{row.value}</span>
                        </div>
                        <div style={{ height: 1, background: 'var(--border-color)' }} />
                      </React.Fragment>
                    ))}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Severity</span>
                      <span className={`badge ${severityColor(result.severity)}`}>
                        <AlertTriangle size={10} /> {result.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-1" style={{ minWidth: 220 }}>
                  {result.disease_explanation && (
                    <div className="scan-result-card" style={{ background: 'var(--warning-bg)', borderLeft: '4px solid var(--warning-orange)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={16} style={{ color: 'var(--warning-orange)' }} />
                        <span className="font-bold text-sm">About This Disease</span>
                      </div>
                      <p className="text-sm" style={{ lineHeight: 1.7 }}>{result.disease_explanation}</p>
                    </div>
                  )}
                  <div className="scan-result-card" style={{ background: 'var(--light-green)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf size={16} className="text-primary" />
                      <span className="font-bold text-sm">Recommended Treatment</span>
                    </div>
                    <p className="text-sm" style={{ lineHeight: 1.7 }}>{result.treatment}</p>
                  </div>
                </div>
              </div>

              {/* Post-diagnosis actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('marketplace')} style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: 'var(--light-green)', border: '1.5px solid var(--primary-green)', borderRadius: 10, color: 'var(--primary-green)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  🛒 Buy Treatment
                </button>
                <button onClick={() => setActiveTab('consultations')} style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: '#f0f9ff', border: '1.5px solid var(--info-blue)', borderRadius: 10, color: 'var(--info-blue)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  💬 Ask Expert
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`My ${result.crop} crop has been diagnosed with ${result.disease} (${result.confidence}% confidence, ${result.severity} severity).\n\nRecommended treatment:\n${result.treatment}\n\nDiagnosed by AgriSense Zimbabwe AI`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: '#f0fdf4', border: '1.5px solid #22c55e', borderRadius: 10, color: '#16a34a', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                  📱 Share on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="card-title mb-4">Scan History</h2>
          {historyLoading ? (
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No previous scans. Upload a crop image above to start.</p>
          ) : (
            <div className="flex gap-3 overflow-hidden" style={{ flexWrap: 'wrap' }}>
              {history.map((item) => (
                <div key={item.id} className="scan-result-card flex gap-3 items-center" style={{ flex: '1 1 300px', maxWidth: 420 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-color)' }}>
                    {item.image_path ? (
                      <img src={`${BASE_URL}${item.image_path}`} alt={item.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <Leaf size={24} className="text-muted m-auto mt-3" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{item.crop} – {item.disease}</span>
                      <span className={`badge ${severityColor(item.severity)}`}>{item.confidence}%</span>
                    </div>
                    <div className="text-xs text-muted mt-1">{new Date(item.scanned_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
