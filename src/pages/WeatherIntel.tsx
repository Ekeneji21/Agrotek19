import { useState, useEffect } from 'react';
import { CloudRain, Cloud, Sun, Wind, Droplets, Thermometer, Eye, ArrowDown, ArrowUp, Loader2, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { weatherApi } from '../services/api';

function WeatherIcon({ icon, size = 28 }: { icon: string; size?: number }) {
  if (icon === 'sun') return <Sun size={size} style={{ color: '#eab308' }} />;
  if (icon === 'cloud-rain') return <CloudRain size={size} className="text-info" />;
  return <Cloud size={size} className="text-muted" />;
}

export function WeatherIntel() {
  const [current, setCurrent] = useState<any>(null);
  const [forecast, setForecast] = useState<{ daily: any[]; hourly: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');
  const [_coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadWeather = async (lat: number, lng: number) => {
    setLoading(true);
    setError('');
    try {
      const [cRes, fRes] = await Promise.all([
        weatherApi.getCurrent(lat, lng),
        weatherApi.getForecast(lat, lng, 7),
      ]);
      setCurrent(cRes.data);
      setForecast(fRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        // Reverse geocode with nominatim
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          setLocationName(d.address?.city || d.address?.town || d.address?.village || d.display_name?.split(',')[0] || '');
        } catch {/* no geocode */}

        loadWeather(lat, lng);
      },
      () => {
        // Default to Harare
        setCoords({ lat: -17.8252, lng: 31.0335 });
        setLocationName('Harare');
        loadWeather(-17.8252, 31.0335);
      },
      { timeout: 6000 }
    );
  }, []);

  const hourlyData = forecast?.hourly?.filter((_: any, i: number) => i % 3 === 0).slice(0, 8) ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Weather Intelligence</h1>
          <p className="text-sm text-muted mt-1">Real-time weather data for your farming operations.</p>
        </div>
        <span className="badge badge-blue">{loading ? 'Loading…' : 'Live Data'}</span>
      </div>

      {error && <div className="card mb-4" style={{ borderLeft: '4px solid var(--danger)' }}><p className="text-sm text-danger">{error}</p></div>}

      <div className="dashboard-grid">
        {/* Current Weather */}
        <div className="col-span-4 card weather-card animate-fade-in" style={{ minHeight: 240 }}>
          {loading ? (
            <div className="flex justify-center items-center" style={{ minHeight: 200 }}>
              <Loader2 size={36} className="animate-spin" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
          ) : current ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                {current.icon === 'sun' ? <Sun size={56} color="white" style={{ opacity: 0.9 }} />
                  : current.icon === 'cloud-rain' ? <CloudRain size={56} color="white" style={{ opacity: 0.9 }} />
                  : <Cloud size={56} color="white" style={{ opacity: 0.9 }} />}
                <div>
                  <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{current.temperature}°C</div>
                  <div className="text-sm" style={{ opacity: 0.85 }}>{current.description}</div>
                  <div className="text-xs mt-1 flex items-center gap-1" style={{ opacity: 0.7 }}>
                    <MapPin size={11} /> {locationName || 'Your Location'} · Updated just now
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
                {[
                  { icon: Droplets, label: 'Humidity', value: `${current.humidity}%` },
                  { icon: Wind, label: 'Wind', value: `${current.windSpeed} km/h` },
                  { icon: Eye, label: 'Visibility', value: current.visibility ? `${current.visibility} km` : 'N/A' },
                  { icon: Thermometer, label: 'Feels Like', value: `${current.feelsLike}°C` },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ flex: '1 1 45%', padding: '0.5rem', background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)' }}>
                    <m.icon size={16} style={{ opacity: 0.8 }} />
                    <div>
                      <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>{m.label}</div>
                      <div className="font-bold text-sm">{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Hourly Chart */}
        <div className="col-span-8 card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <h2 className="card-title mb-4">Hourly Temperature & Rain Probability</h2>
          {loading ? <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-muted" /></div> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} />
                  <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} fill="url(#tempGrad)" name="Temp °C" />
                  <Area type="monotone" dataKey="rain" stroke="#3b82f6" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Rain %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 7-Day Forecast */}
        <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title mb-4">7-Day Forecast</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="flex gap-3" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {(forecast?.daily ?? []).map((d: any, i: number) => (
                <div key={i} className="scan-result-card text-center flex-shrink-0" style={{ minWidth: 120, flex: 1 }}>
                  <div className="font-bold text-sm mb-2">{d.day}</div>
                  <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center' }}>
                    <WeatherIcon icon={d.icon} size={28} />
                  </div>
                  <div className="flex justify-center gap-2 text-sm">
                    <span className="font-bold flex items-center gap-1"><ArrowUp size={10} style={{ color: '#ef4444' }} />{d.high}°</span>
                    <span className="text-muted flex items-center gap-1"><ArrowDown size={10} style={{ color: '#3b82f6' }} />{d.low}°</span>
                  </div>
                  <div className="text-xs text-muted mt-1 flex items-center justify-center gap-1"><Droplets size={10} />{d.rainChance}%</div>
                  <div className="text-xs text-muted mt-1">{d.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
