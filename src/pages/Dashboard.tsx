import { useEffect, useState } from 'react';
import {
  CloudRain, Cloud, Sun as SunIcon, ShieldAlert, Leaf, TrendingUp,
  TrendingDown, Loader2, Bug, Bell, DollarSign, MessageCircle, Zap, BarChart3
} from 'lucide-react';
import { analyticsApi, weatherApi, diseaseApi, alertsApi, transactionsApi, advisoryApi, marketApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const weatherIcon = (icon: string, size = 40) => {
  if (icon === 'sun') return <SunIcon size={size} color="white" style={{ opacity: 0.9 }} />;
  if (icon === 'cloud-rain') return <CloudRain size={size} color="white" style={{ opacity: 0.9 }} />;
  return <Cloud size={size} color="white" style={{ opacity: 0.9 }} />;
};

const severityColor = (s: string) => s === 'High' ? 'var(--danger)' : s === 'Medium' ? 'var(--warning-orange)' : 'var(--primary-green)';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

export function Dashboard() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [finances, setFinances] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [scanRes, alertRes, finRes, consRes, priceRes, trendRes] = await Promise.all([
          diseaseApi.getHistory(),
          alertsApi.list(),
          transactionsApi.summary(),
          advisoryApi.getConsultations(),
          marketApi.getPrices(),
          analyticsApi.getDiseaseTrends(),
        ]);
        setScans(scanRes.data.slice(0, 4));
        setAlerts(alertRes.data.filter((a: any) => !a.read).slice(0, 4));
        setFinances(finRes.data);
        setConsultations(consRes.data.slice(0, 3));
        setPrices(priceRes.data.prices?.slice(0, 5) ?? []);
        void trendRes;
      } catch {/* per-section fallback */}

      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        ).catch(() => null);
        const lat = pos?.coords.latitude ?? -17.8252;
        const lng = pos?.coords.longitude ?? 31.0335;
        const [wRes, fRes] = await Promise.all([weatherApi.getCurrent(lat, lng), weatherApi.getForecast(lat, lng, 3)]);
        setWeather(wRes.data);
        setForecast(fRes.data.daily?.slice(0, 3) ?? []);
      } catch {/* weather unavailable */}

      setLoading(false);
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{greeting}, {user?.name?.split(' ')[0] ?? 'Farmer'}!</h1>
          <p className="text-sm text-muted mt-1">Here's everything happening on your farm today.</p>
        </div>
        <span className="badge badge-green"><TrendingUp size={12} /> Live data</span>
      </div>

      <div className="dashboard-grid">

        {/* ── Finance Summary ── */}
        <div className="col-span-3 card animate-fade-in">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={16} style={{ color: 'var(--primary-green)' }} /><span className="text-xs font-semibold text-muted">Income (All time)</span></div>
          {loading ? <Loader2 size={18} className="animate-spin text-muted" /> : <div className="stat-value text-primary">USD {(finances?.totalIncome ?? 0).toLocaleString()}</div>}
        </div>
        <div className="col-span-3 card animate-fade-in" style={{ animationDelay: '0.04s' }}>
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={16} style={{ color: 'var(--danger)' }} /><span className="text-xs font-semibold text-muted">Expenses</span></div>
          {loading ? <Loader2 size={18} className="animate-spin text-muted" /> : <div className="stat-value" style={{ color: 'var(--danger)' }}>USD {(finances?.totalExpense ?? 0).toLocaleString()}</div>}
        </div>
        <div className="col-span-3 card animate-fade-in" style={{ animationDelay: '0.08s' }}>
          <div className="flex items-center gap-2 mb-1"><BarChart3 size={16} style={{ color: finances?.netProfit >= 0 ? 'var(--primary-green)' : 'var(--danger)' }} /><span className="text-xs font-semibold text-muted">Net Profit</span></div>
          {loading ? <Loader2 size={18} className="animate-spin text-muted" /> : <div className="stat-value" style={{ color: finances?.netProfit >= 0 ? 'var(--primary-green)' : 'var(--danger)' }}>USD {(finances?.netProfit ?? 0).toLocaleString()}</div>}
        </div>
        <div className="col-span-3 card animate-fade-in" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} style={{ color: 'var(--info-blue)' }} /><span className="text-xs font-semibold text-muted">This Month</span></div>
          {loading ? <Loader2 size={18} className="animate-spin text-muted" /> : <div className="stat-value" style={{ color: 'var(--info-blue)' }}>USD {(finances?.monthNet ?? 0).toLocaleString()}</div>}
        </div>

        {/* ── Weather ── */}
        <div className="col-span-4 card weather-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title text-white mb-3" style={{ opacity: 0.95 }}>Today's Weather</h2>
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
                    {d.rainChance > 30 ? <CloudRain size={16} /> : <SunIcon size={16} />}
                    <div className="text-xs font-bold mt-1">{d.rainChance}%</div>
                    <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>Rain</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center gap-1 font-bold text-sm" style={{ color: '#fbbf24' }}>
                  <ShieldAlert size={13} /> Wind {weather.windSpeed} km/h · Feels like {weather.feelsLike}°C
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-center py-6" style={{ opacity: 0.7 }}>
              {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Enable location for live weather'}
            </div>
          )}
        </div>

        {/* ── Recent Disease Scans ── */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bug size={16} style={{ color: 'var(--primary-green)' }} />
            <h2 className="card-title" style={{ margin: 0 }}>Recent Disease Scans</h2>
          </div>
          {loading ? <div className="flex justify-center py-4"><Loader2 size={22} className="animate-spin text-muted" /></div>
          : scans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Zap size={28} className="text-muted mx-auto mb-2" />
              <p className="text-xs text-muted">No scans yet. Use Disease Detection to analyse your crops.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {scans.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                    {s.image_path ? <img src={`${BASE_URL}${s.image_path}`} alt={s.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={20} className="text-muted m-auto mt-2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.crop}</div>
                    <div className="text-xs text-muted truncate">{s.disease}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(s.severity), flexShrink: 0 }} title={s.severity} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Unread Alerts ── */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} style={{ color: 'var(--warning-orange)' }} />
            <h2 className="card-title" style={{ margin: 0 }}>Unread Alerts</h2>
            {alerts.length > 0 && <span className="badge badge-red ml-auto">{alerts.length}</span>}
          </div>
          {loading ? <div className="flex justify-center py-4"><Loader2 size={22} className="animate-spin text-muted" /></div>
          : alerts.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">All clear — no unread alerts.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((a: any) => (
                <div key={a.id} className="flex gap-2 items-start" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: severityColor(a.severity), flexShrink: 0, marginTop: 5 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{a.title}</div>
                    <div className="text-xs text-muted truncate">{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Market Prices ── */}
        <div className="col-span-6 card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} style={{ color: 'var(--primary-green)' }} />
            <h2 className="card-title" style={{ margin: 0 }}>Zimbabwe Commodity Prices</h2>
          </div>
          {loading ? <div className="flex justify-center py-4"><Loader2 size={22} className="animate-spin text-muted" /></div>
          : (
            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>Commodity</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>Price (USD)</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 0' }}>{p.commodity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-green)' }}>{p.market_price}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem' }}>/{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Recent Consultations ── */}
        <div className="col-span-6 card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} style={{ color: 'var(--info-blue)' }} />
            <h2 className="card-title" style={{ margin: 0 }}>Recent Consultations</h2>
          </div>
          {loading ? <div className="flex justify-center py-4"><Loader2 size={22} className="animate-spin text-muted" /></div>
          : consultations.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">No consultations yet. Use the Consultations page to ask an agronomist.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {consultations.map((c: any, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{c.agronomist_name}</div>
                    <div className="text-xs text-muted truncate">{c.message}</div>
                  </div>
                  <span className={`badge ${c.status === 'replied' ? 'badge-green' : 'badge-orange'}`} style={{ flexShrink: 0 }}>
                    {c.status === 'replied' ? 'Replied' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
