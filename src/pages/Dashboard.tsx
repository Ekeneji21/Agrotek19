import { useEffect, useState } from 'react';
import {
  CloudRain, Sun as SunIcon, Cloud, Zap, MessageCircle, TrendingUp,
  Loader2, Bug, Bell, AlertTriangle, Leaf, ShoppingBag,
  ThumbsUp
} from 'lucide-react';
import { weatherApi, diseaseApi, alertsApi, marketApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  profile?: { crops: string[]; region: string; size: string } | null;
  setActiveTab: (tab: string) => void;
}

const severityColor = (s: string) => s === 'High' ? 'var(--danger)' : s === 'Medium' ? 'var(--warning-orange)' : 'var(--primary-green)';
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

function getPriorityTip(weather: any, crops: string[]): { title: string; body: string; icon: string } {
  if (!weather) return {
    icon: '🌱',
    title: 'Complete your profile',
    body: 'Enable location access so we can give you weather-based advice for your specific area.',
  };
  const temp = weather.temperature;
  const humidity = weather.humidity;
  const hasMaize = crops.includes('Maize');
  const hasTobacco = crops.includes('Tobacco');

  if (humidity > 70 && temp > 25) return {
    icon: '⚠️',
    title: 'High disease risk today',
    body: `Hot and humid conditions (${temp}°C, ${humidity}% humidity) favour fungal diseases. Inspect ${hasMaize ? 'maize for grey leaf spot' : hasTobacco ? 'tobacco for blue mould' : 'your crops'} today.`,
  };
  if (temp > 35) return {
    icon: '🌡️',
    title: 'Heat stress alert',
    body: `Temperature is ${temp}°C — well above optimal. Irrigate in the early morning or evening to reduce heat stress on your crops.`,
  };
  return {
    icon: '✅',
    title: 'Good conditions today',
    body: `Weather is suitable for field work at ${temp}°C. Good time to check crop health or apply scheduled inputs.`,
  };
}

export function Dashboard({ profile, setActiveTab }: Props) {
  const { user } = useAuth();
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [scanRes, alertRes, priceRes] = await Promise.all([
          diseaseApi.getHistory(),
          alertsApi.list(),
          marketApi.getPrices(),
        ]);
        setScans(scanRes.data.slice(0, 3));
        setAlerts(alertRes.data.filter((a: any) => !a.read).slice(0, 3));
        setPrices(priceRes.data.prices?.slice(0, 6) ?? []);
      } catch { /* handled */ }

      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        ).catch(() => null);
        const lat = pos?.coords.latitude ?? -17.8252;
        const lng = pos?.coords.longitude ?? 31.0335;
        const [wRes, fRes] = await Promise.all([weatherApi.getCurrent(lat, lng), weatherApi.getForecast(lat, lng, 3)]);
        setWeather(wRes.data);
        setForecast(fRes.data.daily?.slice(0, 3) ?? []);
      } catch { /* weather unavailable */ }

      setLoading(false);
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const crops = profile?.crops ?? [];
  const tip = getPriorityTip(weather, crops);

  const quickActions = [
    {
      icon: Bug, label: 'Scan a Disease', desc: 'Photo → instant AI diagnosis', tab: 'disease-detection',
      color: 'var(--danger)', bg: '#fef2f2',
    },
    {
      icon: MessageCircle, label: 'Ask an Expert', desc: 'AI + human agronomists', tab: 'consultations',
      color: 'var(--info-blue)', bg: '#f0f9ff',
    },
    {
      icon: ShoppingBag, label: 'Market Prices', desc: 'Zimbabwe commodity prices', tab: 'alerts',
      color: '#8b5cf6', bg: '#f5f3ff',
    },
    {
      icon: TrendingUp, label: 'Farm Planner', desc: 'AI crop plan & budget', tab: 'planner',
      color: 'var(--primary-green)', bg: 'var(--light-green)',
    },
  ];

  return (
    <div className="page-container">
      {/* Greeting */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>
          {greeting}, {user?.name?.split(' ')[0] ?? 'Farmer'} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {profile ? `${profile.crops.slice(0, 2).join(' · ')}${profile.crops.length > 2 ? ` +${profile.crops.length - 2} more` : ''} · ${profile.region}` : "Let's check what needs attention on your farm today."}
        </p>
      </div>

      {/* TODAY'S PRIORITY */}
      <div style={{
        background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
        borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
        color: '#fff', display: 'flex', alignItems: 'flex-start', gap: '1rem',
      }}>
        <div style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{tip.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>TODAY'S PRIORITY</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{tip.title}</div>
          <p style={{ fontSize: '0.85rem', opacity: 0.88, lineHeight: 1.5 }}>{tip.body}</p>
        </div>
        {weather && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{weather.temperature}°C</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{weather.humidity}% humidity</div>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {quickActions.map(a => (
          <button key={a.tab} onClick={() => setActiveTab(a.tab)} style={{
            background: 'var(--card-bg)', border: '1.5px solid var(--border-color)',
            borderRadius: 12, padding: '1rem', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{a.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">

        {/* MY CROPS */}
        <div className="col-span-4 card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>My Crops</h2>
            {crops.length > 0 && <button onClick={() => setActiveTab('planner')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 600 }}>Plan →</button>}
          </div>
          {crops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <Leaf size={32} style={{ color: 'var(--border-color)', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Set up your farm profile to see personalised insights</p>
              <button onClick={() => localStorage.removeItem('agrisense_profile')} style={{ fontSize: '0.8rem', color: 'var(--primary-green)', background: 'none', border: '1px solid var(--primary-green)', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontWeight: 600 }}>
                Complete Setup
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {crops.map(c => (
                <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.75rem', background: 'var(--light-green)', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-green)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-green)' }} />
                  {c}
                </span>
              ))}
            </div>
          )}
          {profile?.region && (
            <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>📍 {profile.region}</span>
              <span>🌾 {profile.size}</span>
            </div>
          )}
        </div>

        {/* 3-DAY WEATHER */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <h2 className="card-title" style={{ marginBottom: '0.875rem' }}>3-Day Forecast</h2>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
          ) : forecast.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>Enable location for live forecast</p>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {forecast.map((d: any, i: number) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0.75rem 0.5rem', background: 'var(--bg-color)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>{d.day}</div>
                  {d.rainChance > 30 ? <CloudRain size={20} style={{ color: '#3b82f6', margin: '0 auto' }} /> : d.rainChance > 10 ? <Cloud size={20} style={{ color: 'var(--text-muted)', margin: '0 auto' }} /> : <SunIcon size={20} style={{ color: '#eab308', margin: '0 auto' }} />}
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: 6 }}>{d.high ?? d.temp ?? '–'}°</div>
                  <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: 2 }}>{d.rainChance}% rain</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MARKET PRICES */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Commodity Prices</h2>
            <button onClick={() => setActiveTab('alerts')} style={{ fontSize: '0.78rem', color: 'var(--primary-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>All →</button>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
          : prices.length === 0 ? <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No prices available</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {prices.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: i < prices.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 500 }}>{p.commodity}</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary-green)' }}>${p.market_price}<span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.7rem' }}>/{p.unit}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UNREAD ALERTS */}
        <div className="col-span-6 card animate-fade-in" style={{ animationDelay: '0.12s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} style={{ color: 'var(--warning-orange)' }} />
              <h2 className="card-title" style={{ margin: 0 }}>Alerts</h2>
              {alerts.length > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{alerts.length}</span>}
            </div>
            <button onClick={() => setActiveTab('alerts')} style={{ fontSize: '0.78rem', color: 'var(--primary-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>All →</button>
          </div>
          {alerts.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--primary-green)' }}>
              <ThumbsUp size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>All clear — no unread alerts</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {alerts.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', padding: '0.625rem', background: 'var(--bg-color)', borderRadius: 8, borderLeft: `3px solid ${severityColor(a.severity)}` }}>
                  <AlertTriangle size={14} style={{ color: severityColor(a.severity), flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT SCANS */}
        <div className="col-span-6 card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bug size={16} style={{ color: 'var(--primary-green)' }} />
              <h2 className="card-title" style={{ margin: 0 }}>Recent Scans</h2>
            </div>
            <button onClick={() => setActiveTab('disease-detection')} style={{ fontSize: '0.78rem', color: 'var(--primary-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Scan →</button>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
          : scans.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', textAlign: 'center' }}>
              <Zap size={28} style={{ color: 'var(--border-color)' }} />
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No scans yet</p>
              <button onClick={() => setActiveTab('disease-detection')} style={{ fontSize: '0.8rem', color: 'var(--primary-green)', background: 'var(--light-green)', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontWeight: 600 }}>
                Scan your first crop →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {scans.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--border-color)' }}>
                    {s.image_path ? <img src={`${BASE_URL}${s.image_path}`} alt={s.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={18} style={{ color: 'var(--text-muted)', margin: '9px auto', display: 'block' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{s.crop} — {s.disease}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.scanned_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(s.severity), flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
