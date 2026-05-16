import React from 'react';
import { CloudRain, Cloud, Sun, Wind, Droplets, Thermometer, Eye, ArrowDown, ArrowUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const hourlyData = [
  { time: '6AM', temp: 18, rain: 10 }, { time: '9AM', temp: 22, rain: 15 },
  { time: '12PM', temp: 28, rain: 5 }, { time: '3PM', temp: 30, rain: 20 },
  { time: '6PM', temp: 26, rain: 40 }, { time: '9PM', temp: 21, rain: 30 },
];

const weeklyData = [
  { day: 'Mon', high: 29, low: 17, rain: 20 }, { day: 'Tue', high: 27, low: 16, rain: 45 },
  { day: 'Wed', high: 30, low: 18, rain: 10 }, { day: 'Thu', high: 26, low: 15, rain: 60 },
  { day: 'Fri', high: 28, low: 17, rain: 25 }, { day: 'Sat', high: 31, low: 19, rain: 5 },
  { day: 'Sun', high: 29, low: 18, rain: 15 },
];

export function WeatherIntel() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Weather Intelligence</h1>
          <p className="text-sm text-muted mt-1">Real-time weather data for your farming operations.</p>
        </div>
        <span className="badge badge-blue">Live Data</span>
      </div>

      <div className="dashboard-grid">
        {/* Current Weather */}
        <div className="col-span-4 card weather-card animate-fade-in" style={{ minHeight: 240 }}>
          <div className="flex items-center gap-3 mb-4">
            <CloudRain size={56} color="white" style={{ opacity: 0.9 }} />
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>26°C</div>
              <div className="text-sm" style={{ opacity: 0.85 }}>Partly Cloudy with Light Rain</div>
              <div className="text-xs mt-1" style={{ opacity: 0.7 }}>Mazowe Valley · Updated 5 min ago</div>
            </div>
          </div>
          <div className="flex gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
            {[
              { icon: Droplets, label: 'Humidity', value: '75%' },
              { icon: Wind, label: 'Wind', value: '12 km/h' },
              { icon: Eye, label: 'Visibility', value: '8 km' },
              { icon: Thermometer, label: 'Feels Like', value: '28°C' },
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
        </div>

        {/* Hourly Forecast */}
        <div className="col-span-8 card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <h2 className="card-title mb-4">Hourly Temperature & Rainfall</h2>
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
        </div>

        {/* 7-Day Forecast */}
        <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title mb-4">7-Day Forecast</h2>
          <div className="flex gap-3" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {weeklyData.map((d, i) => (
              <div key={i} className="scan-result-card text-center flex-shrink-0" style={{ minWidth: 120, flex: 1 }}>
                <div className="font-bold text-sm mb-2">{d.day}</div>
                {d.rain > 30 ? <CloudRain size={28} className="text-info mx-auto mb-2" style={{ margin: '0 auto 8px' }} />
                  : d.rain > 15 ? <Cloud size={28} className="text-muted mx-auto mb-2" style={{ margin: '0 auto 8px' }} />
                  : <Sun size={28} className="text-warning mx-auto mb-2" style={{ margin: '0 auto 8px', color: '#eab308' }} />}
                <div className="flex justify-center gap-2 text-sm">
                  <span className="font-bold flex items-center gap-1"><ArrowUp size={10} className="text-danger" />{d.high}°</span>
                  <span className="text-muted flex items-center gap-1"><ArrowDown size={10} className="text-info" />{d.low}°</span>
                </div>
                <div className="text-xs text-muted mt-1 flex items-center justify-center gap-1"><Droplets size={10} />{d.rain}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
