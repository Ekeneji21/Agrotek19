import React from 'react';
import {
  MoreHorizontal, Upload, CloudRain, Cloud, Sun as SunIcon,
  ShieldAlert, ChevronDown, CheckCircle2, Leaf, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const graphData = [
  { name: 'Jan', historical: 50 }, { name: 'Feb', historical: 120 },
  { name: 'Mar', historical: 150 }, { name: 'Apr', historical: 220 },
  { name: 'May', historical: 130 }, { name: 'Jun', historical: 100 },
  { name: 'Jul', historical: 140 }, { name: 'Aug', historical: 160 },
  { name: 'Sep', historical: 90, predicted: 90 },
  { name: 'Oct', predicted: 140 }, { name: 'Nov', predicted: 190 },
  { name: 'Dec', predicted: 170 },
];

const CropRing = ({ pct, label }: { pct: number; label: string }) => {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="progress-ring">
        <svg width="68" height="68" className="progress-circle">
          <circle cx="34" cy="34" r={r} className="progress-circle-bg" />
          <circle cx="34" cy="34" r={r} className="progress-circle-value"
            style={{ strokeDasharray: c, strokeDashoffset: c * (1 - pct / 100) }} />
        </svg>
        <div className="progress-text">
          <div className="progress-value">{pct}%</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted">Healthy</div>
      </div>
    </div>
  );
};

export function Dashboard() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Farmer Dashboard</h1>
          <p className="text-sm text-muted mt-1">Welcome back! Here's your farm overview.</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-green"><TrendingUp size={12} /> All systems healthy</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* ─── ROW 1: HEALTH + WEATHER + DISEASE SCAN ─── */}
        {/* Crop Health */}
        <div className="col-span-4 card animate-fade-in">
          <div className="card-header">
            <h2 className="card-title">My Crops Health Summary</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex justify-between items-center" style={{ paddingTop: '0.5rem' }}>
            <CropRing pct={85} label="Maize" />
            <CropRing pct={78} label="Sorghum" />
            <CropRing pct={92} label="Cotton" />
          </div>
        </div>

        {/* Weather */}
        <div className="col-span-3 card weather-card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <h2 className="card-title text-white" style={{ opacity: 0.95 }}>Current Weather</h2>
            <button className="btn-icon text-white"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <CloudRain size={44} color="white" style={{ opacity: 0.9 }} />
            <div>
              <div className="weather-temp">26°C</div>
              <div className="text-xs" style={{ opacity: 0.85 }}>Light Rain · 75% Humidity</div>
            </div>
          </div>
          <div className="weather-forecast">
            <div><div className="text-xs mb-1" style={{ opacity: 0.7 }}>1 day</div><Cloud size={16} /><div className="text-xs font-bold mt-1">26%</div><div style={{ fontSize: '0.625rem', opacity: 0.7 }}>Rainfall</div></div>
            <div><div className="text-xs mb-1" style={{ opacity: 0.7 }}>2 day</div><SunIcon size={16} /><div className="text-xs font-bold mt-1">20%</div><div style={{ fontSize: '0.625rem', opacity: 0.7 }}>Rainfall</div></div>
            <div><div className="text-xs mb-1" style={{ opacity: 0.7 }}>3 day</div><CloudRain size={16} /><div className="text-xs font-bold mt-1">75%</div><div style={{ fontSize: '0.625rem', opacity: 0.7 }}>Rainfall</div></div>
          </div>
          {/* Disease Risk */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)' }}>
            <div className="flex items-center gap-1 font-bold text-sm mb-1" style={{ color: '#fbbf24' }}>
              <ShieldAlert size={14} /> Medium Risk
            </div>
            <div className="text-xs" style={{ opacity: 0.85 }}>of Maize Grey Leaf Spot</div>
          </div>
        </div>

        {/* Disease Detection Quick */}
        <div className="col-span-5 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h2 className="card-title">Disease Detection</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }} className="flex flex-col gap-3">
              <button className="btn btn-primary btn-lg w-full">
                <Activity size={18} /> Scan Now
              </button>
              <div className="upload-zone" style={{ minHeight: '120px' }}>
                <Upload size={22} className="text-muted" />
                <div className="font-semibold text-sm mt-2">Drag-and-drop image</div>
                <div className="text-xs text-muted mt-1">Upload the crop image</div>
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div className="text-xs text-muted mb-2 font-semibold" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recent scan results</span>
              </div>
              {[
                { crop: 'Maize', img: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=80&h=80&fit=crop' },
                { crop: 'Sorghum', img: 'https://images.unsplash.com/photo-1572008779051-24750bb8baea?w=80&h=80&fit=crop' },
                { crop: 'Cotton', img: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=80&h=80&fit=crop' },
              ].map((item) => (
                <div key={item.crop} className="table-row">
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.img} alt={item.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{item.crop}</div>
                    <div className="text-xs text-muted">Healthy</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Early Blight</div>
                    <div className="text-xs text-muted">Detected</div>
                  </div>
                  <span className="badge badge-green">94%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── ROW 2: ADVISORY + ANALYTICS ─── */}
        {/* Advisory */}
        <div className="col-span-8 card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Advisory and Treatment</h2>
              <p className="card-subtitle">Connecting farmers to agronomists and suggesting suitable treatments.</p>
            </div>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="scan-result-card flex gap-3 items-center" style={{ flex: '1 1 280px' }}>
              <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                <img src="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=200&h=200&fit=crop" alt="Farmer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Recommendation</h3>
                <p className="text-xs text-muted mb-2">Connect to advisors on agriculture and get suitable treatment recommendations for your crops.</p>
                <button className="btn btn-sm btn-outline text-primary" style={{ borderColor: 'var(--primary-green)' }}>
                  View Recommendations
                </button>
              </div>
            </div>
            <div className="scan-result-card" style={{ flex: '1 1 280px' }}>
              <div className="flex gap-2 items-center mb-3">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="Agronomist" />
                <div>
                  <h3 className="font-semibold text-sm">Connect to Agronomists</h3>
                  <p className="text-xs text-muted">Find suitable agronomists near you.</p>
                </div>
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <div className="flex gap-2 items-center p-2 rounded-sm" style={{ flex: '1 1 140px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  <Leaf size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs font-medium">Suitable Treatments</span>
                </div>
                <div className="flex gap-2 items-center p-2 rounded-sm" style={{ flex: '1 1 140px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs font-medium">Preventive Measures</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Early Warning Analytics */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h2 className="card-title">Early Warning Analytics</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold">Zimbabwe Outbreak Heatmap</h3>
            <button className="btn btn-sm btn-outline">Filters</button>
          </div>

          {/* Map Placeholder */}
          <div className="relative overflow-hidden rounded-md mb-4" style={{ height: 160, background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Zimbabwe_location_map.svg/1200px-Zimbabwe_location_map.svg.png" alt="Zimbabwe Map" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, filter: 'grayscale(0.8)' }} />
            <div className="absolute" style={{ top: '30%', left: '50%', width: 60, height: 60, background: '#ef4444', borderRadius: '50%', filter: 'blur(18px)', opacity: 0.55 }} />
            <div className="absolute" style={{ top: '55%', left: '30%', width: 45, height: 45, background: '#eab308', borderRadius: '50%', filter: 'blur(14px)', opacity: 0.6 }} />
            <div className="absolute" style={{ bottom: '25%', right: '30%', width: 50, height: 50, background: '#22c55e', borderRadius: '50%', filter: 'blur(16px)', opacity: 0.55 }} />
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold">Disease Trend Graphs</h3>
            <div className="flex gap-3 text-xs items-center">
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Historical</span>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2e7d32', display: 'inline-block' }} /> Predicted</span>
            </div>
          </div>

          <div style={{ height: 150, marginLeft: -10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-main)' }} />
                <Area type="monotone" dataKey="historical" stroke="#3b82f6" strokeWidth={2} fill="url(#ch)" />
                <Area type="monotone" dataKey="predicted" stroke="#2e7d32" strokeWidth={2} strokeDasharray="5 5" fill="url(#cp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── ROW 3: FINANCIAL IMPACT ─── */}
        <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="card-header">
            <h2 className="card-title">Financial Impact</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex gap-6 justify-center" style={{ flexWrap: 'wrap' }}>
            <div className="text-center flex flex-col items-center" style={{ minWidth: 140 }}>
              <div className="text-sm font-semibold text-muted mb-1">Yield</div>
              <div className="text-xl font-bold text-primary mb-3">$1.38 <span className="text-sm font-normal text-muted">yield</span></div>
              <div className="progress-ring">
                <svg width="80" height="80" className="progress-circle">
                  <circle cx="40" cy="40" r="34" className="progress-circle-bg" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" className="progress-circle-value" strokeWidth="6" style={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 * 0.15 }} />
                </svg>
                <div className="progress-text"><div className="text-lg font-bold">85%</div></div>
              </div>
              <span className="badge badge-green mt-2"><ArrowUpRight size={10} /> +12%</span>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div className="text-center flex flex-col items-center" style={{ minWidth: 140 }}>
              <div className="text-sm font-semibold text-muted mb-1">Cost Analysis</div>
              <div className="text-xl font-bold mb-3">$100 <span className="text-sm font-normal text-muted">/cost</span></div>
              <div className="progress-ring">
                <svg width="80" height="80" className="progress-circle">
                  <circle cx="40" cy="40" r="34" className="progress-circle-bg" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" strokeWidth="6" stroke="#ef4444" fill="none" strokeLinecap="round"
                    className="progress-circle" style={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 * 0.2, transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                </svg>
                <div className="progress-text"><div className="text-lg font-bold">80%</div></div>
              </div>
              <span className="badge badge-red mt-2"><TrendingUp size={10} /> -5%</span>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div className="text-center flex flex-col items-center" style={{ minWidth: 140 }}>
              <div className="text-sm font-semibold text-muted mb-1">ROI</div>
              <div className="text-xl font-bold mb-3" style={{ color: 'var(--info-blue)' }}>138%</div>
              <div className="progress-ring">
                <svg width="80" height="80" className="progress-circle">
                  <circle cx="40" cy="40" r="34" className="progress-circle-bg" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" strokeWidth="6" stroke="var(--info-blue)" fill="none" strokeLinecap="round"
                    className="progress-circle" style={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 * 0.08, transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                </svg>
                <div className="progress-text"><div className="text-lg font-bold">92%</div></div>
              </div>
              <span className="badge badge-blue mt-2"><ArrowUpRight size={10} /> +8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export Activity icon for use in the scan button
import { Activity } from 'lucide-react';
