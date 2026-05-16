import React, { useEffect, useState } from 'react';
import {
  MoreHorizontal, Upload, CloudRain, Cloud, Sun as SunIcon,
  ShieldAlert, CheckCircle2, Leaf, TrendingUp, ArrowUpRight, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi, weatherApi, diseaseApi } from '../services/api';

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
        <div className="text-xs text-muted">Health</div>
      </div>
    </div>
  );
};

const weatherIcon = (icon: string, size = 44) => {
  if (icon === 'sun') return <SunIcon size={size} color="white" style={{ opacity: 0.9 }} />;
  if (icon === 'cloud-rain') return <CloudRain size={size} color="white" style={{ opacity: 0.9 }} />;
  return <Cloud size={size} color="white" style={{ opacity: 0.9 }} />;
};

export function Dashboard() {
  const [cropHealth, setCropHealth] = useState<{ label: string; pct: number }[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [healthRes, trendsRes, financialRes, historyRes] = await Promise.all([
          analyticsApi.getCropHealth(),
          analyticsApi.getDiseaseTrends(),
          analyticsApi.getFinancialImpact(),
          diseaseApi.getHistory(),
        ]);
        setCropHealth(healthRes.data);
        setTrends(trendsRes.data);
        setFinancial(financialRes.data);
        setScanHistory(historyRes.data.slice(0, 3));
      } catch {/* handled per-section */}

      // Weather uses geolocation
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        ).catch(() => null);

        const lat = pos?.coords.latitude ?? -17.8252; // Harare fallback
        const lng = pos?.coords.longitude ?? 31.0335;

        const [wRes, fRes] = await Promise.all([
          weatherApi.getCurrent(lat, lng),
          weatherApi.getForecast(lat, lng, 3),
        ]);
        setWeather(wRes.data);
        setForecast(fRes.data.daily?.slice(0, 3) ?? []);
      } catch {/* weather unavailable */}

      setLoading(false);
    };
    load();
  }, []);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Farmer Dashboard</h1>
          <p className="text-sm text-muted mt-1">Welcome back! Here's your farm overview.</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-green"><TrendingUp size={12} /> Live data</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Crop Health */}
        <div className="col-span-4 card animate-fade-in">
          <div className="card-header">
            <h2 className="card-title">My Crops Health Summary</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : cropHealth.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">Add farms to see crop health.</p>
          ) : (
            <div className="flex justify-around items-center pt-2">
              {cropHealth.slice(0, 3).map(c => <CropRing key={c.label} pct={c.pct} label={c.label} />)}
            </div>
          )}
        </div>

        {/* Weather */}
        <div className="col-span-3 card weather-card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <h2 className="card-title text-white" style={{ opacity: 0.95 }}>Current Weather</h2>
            <button className="btn-icon text-white"><MoreHorizontal size={18} /></button>
          </div>
          {weather ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                {weatherIcon(weather.icon)}
                <div>
                  <div className="weather-temp">{weather.temperature}°C</div>
                  <div className="text-xs" style={{ opacity: 0.85 }}>{weather.description} · {weather.humidity}% Humidity</div>
                </div>
              </div>
              <div className="weather-forecast">
                {forecast.map((d: any, i: number) => (
                  <div key={i}>
                    <div className="text-xs mb-1" style={{ opacity: 0.7 }}>{d.day}</div>
                    {d.icon === 'sun' ? <SunIcon size={16} /> : d.rainChance > 30 ? <CloudRain size={16} /> : <Cloud size={16} />}
                    <div className="text-xs font-bold mt-1">{d.rainChance}%</div>
                    <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>Rain</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center gap-1 font-bold text-sm mb-1" style={{ color: '#fbbf24' }}>
                  <ShieldAlert size={14} /> Wind {weather.windSpeed} km/h
                </div>
                <div className="text-xs" style={{ opacity: 0.85 }}>Feels like {weather.feelsLike}°C · Vis {weather.visibility ?? '–'} km</div>
              </div>
            </>
          ) : (
            <div className="text-xs text-center py-4" style={{ opacity: 0.7 }}>
              {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Enable location for live weather'}
            </div>
          )}
        </div>

        {/* Disease Detection Quick */}
        <div className="col-span-5 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h2 className="card-title">Disease Detection</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }} className="flex flex-col gap-3">
              <div className="upload-zone" style={{ minHeight: '120px', cursor: 'default' }}>
                <Upload size={22} className="text-muted" />
                <div className="font-semibold text-sm mt-2">AI Scan Available</div>
                <div className="text-xs text-muted mt-1">Go to Disease Detection page</div>
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div className="text-xs text-muted mb-2 font-semibold">Recent scan results</div>
              {scanHistory.length === 0 ? (
                <p className="text-xs text-muted">No scans yet.</p>
              ) : scanHistory.map((item: any) => (
                <div key={item.id} className="table-row">
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-color)' }}>
                    {item.image_path ? (
                      <img
                        src={`${BASE_URL.replace('/api', '')}${item.image_path}`}
                        alt={item.crop}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : <Leaf size={20} className="text-muted m-auto mt-2" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{item.crop}</div>
                    <div className="text-xs text-muted">{item.disease}</div>
                  </div>
                  <span className="badge badge-green">{item.confidence}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
              <div>
                <h3 className="font-semibold text-sm mb-1">Expert Recommendations</h3>
                <p className="text-xs text-muted mb-2">Connect to advisors on agriculture and get suitable treatment recommendations for your crops.</p>
                <button className="btn btn-sm btn-outline text-primary" style={{ borderColor: 'var(--primary-green)' }}>
                  View Advisory
                </button>
              </div>
            </div>
            <div className="scan-result-card" style={{ flex: '1 1 280px' }}>
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
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

        {/* Disease Trend Analytics */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h2 className="card-title">Disease Scan Trends</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold">Monthly Scans This Year</h3>
            <div className="flex gap-3 text-xs items-center">
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Scans</span>
            </div>
          </div>
          <div style={{ height: 180, marginLeft: -10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="historical" name="Scans" stroke="#3b82f6" strokeWidth={2} fill="url(#ch)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Impact */}
        <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="card-header">
            <h2 className="card-title">Financial Impact Estimate</h2>
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : financial && financial.estimatedRevenueUsd > 0 ? (
            <div className="flex gap-6 justify-center" style={{ flexWrap: 'wrap' }}>
              {[
                { label: 'Est. Revenue', value: `$${financial.estimatedRevenueUsd.toLocaleString()}`, pct: financial.yieldHealthPct, color: 'var(--primary-green)' },
                { label: 'Est. Cost', value: `$${financial.estimatedCostUsd.toLocaleString()}`, pct: 80, color: '#ef4444' },
                { label: 'Est. ROI', value: `${financial.roiPct}%`, pct: Math.min(financial.roiPct, 100), color: 'var(--info-blue)' },
              ].map((m, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div style={{ width: 1, background: 'var(--border-color)' }} />}
                  <div className="text-center flex flex-col items-center" style={{ minWidth: 140 }}>
                    <div className="text-sm font-semibold text-muted mb-1">{m.label}</div>
                    <div className="text-xl font-bold mb-3" style={{ color: m.color }}>{m.value}</div>
                    <div className="progress-ring">
                      <svg width="80" height="80" className="progress-circle">
                        <circle cx="40" cy="40" r="34" className="progress-circle-bg" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" strokeWidth="6" stroke={m.color} fill="none" strokeLinecap="round"
                          style={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 * (1 - m.pct / 100), transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease' }} />
                      </svg>
                      <div className="progress-text"><div className="text-lg font-bold">{m.pct}%</div></div>
                    </div>
                    <span className="badge badge-green mt-2"><ArrowUpRight size={10} /> Live</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-4">Add farms to see financial estimates.</p>
          )}
        </div>
      </div>
    </div>
  );
}
