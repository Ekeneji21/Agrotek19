import React, { useState } from 'react';
import { AlertTriangle, Bug, CloudRain, TrendingDown, CheckCircle, Bell, Clock } from 'lucide-react';

const alertsData = [
  { id: 1, type: 'disease', title: 'Grey Leaf Spot Outbreak', message: 'High risk detected in Mazowe region. Your maize fields may be affected.', time: '15 min ago', severity: 'High', read: false, icon: Bug },
  { id: 2, type: 'weather', title: 'Heavy Rain Warning', message: 'Expected 45mm rainfall in the next 24 hours. Secure livestock and equipment.', time: '1 hour ago', severity: 'Medium', read: false, icon: CloudRain },
  { id: 3, type: 'market', title: 'Maize Price Drop Alert', message: 'Maize prices have dropped by 8% in Harare market. Consider holding stock.', time: '3 hours ago', severity: 'Low', read: false, icon: TrendingDown },
  { id: 4, type: 'disease', title: 'Fall Armyworm Detected', message: 'Neighboring farms report fall armyworm activity. Inspect your fields.', time: '5 hours ago', severity: 'High', read: true, icon: Bug },
  { id: 5, type: 'weather', title: 'Frost Advisory', message: 'Light frost expected tonight in highland areas above 1500m.', time: '8 hours ago', severity: 'Medium', read: true, icon: CloudRain },
  { id: 6, type: 'system', title: 'Weekly Health Report Ready', message: 'Your weekly crop health summary is now available for review.', time: '1 day ago', severity: 'Info', read: true, icon: CheckCircle },
];

export function Alerts() {
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState(alertsData);

  const filtered = filter === 'all' ? alerts : filter === 'unread' ? alerts.filter(a => !a.read) : alerts.filter(a => a.type === filter);
  const severityColor = (s: string) => s === 'High' ? 'badge-red' : s === 'Medium' ? 'badge-orange' : s === 'Info' ? 'badge-blue' : 'badge-green';

  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Alerts & Notifications</h1>
          <p className="text-sm text-muted mt-1">{alerts.filter(a => !a.read).length} unread alerts</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}><CheckCircle size={14} /> Mark All Read</button>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {['all', 'unread', 'disease', 'weather', 'market'].map(t => (
          <div key={t} className={`tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {/* Alert List */}
      <div className="flex flex-col gap-3">
        {filtered.map((alert, i) => (
          <div
            key={alert.id}
            className="card flex gap-4 items-start animate-fade-in"
            style={{
              animationDelay: `${i * 0.04}s`,
              borderLeft: `4px solid ${alert.severity === 'High' ? 'var(--danger)' : alert.severity === 'Medium' ? 'var(--warning-orange)' : 'var(--primary-green)'}`,
              opacity: alert.read ? 0.7 : 1,
            }}
            onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a))}
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: alert.severity === 'High' ? 'var(--danger-light)' : alert.severity === 'Medium' ? 'var(--warning-bg)' : 'var(--light-green)',
            }}>
              <alert.icon size={20} style={{ color: alert.severity === 'High' ? 'var(--danger)' : alert.severity === 'Medium' ? 'var(--warning-orange)' : 'var(--primary-green)' }} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-sm">{alert.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`badge ${severityColor(alert.severity)}`}>{alert.severity}</span>
                  {!alert.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-green)' }} />}
                </div>
              </div>
              <p className="text-sm text-secondary">{alert.message}</p>
              <div className="flex items-center gap-1 text-xs text-muted mt-2"><Clock size={12} /> {alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
