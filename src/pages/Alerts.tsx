import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bug, CloudRain, TrendingDown, CheckCircle, Clock, Loader2, Bell } from 'lucide-react';
import { alertsApi } from '../services/api';

const TYPE_ICON: Record<string, React.ElementType> = {
  disease: Bug,
  weather: CloudRain,
  market: TrendingDown,
  system: CheckCircle,
  default: Bell,
};

export function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadAlerts = async () => {
    try {
      const res = await alertsApi.list();
      setAlerts(res.data);
    } catch {/* handled */}
    setLoading(false);
  };

  useEffect(() => { loadAlerts(); }, []);

  const markRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    await alertsApi.markRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    await alertsApi.markAllRead().catch(() => {});
  };

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.read)
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;
  const severityColor = (s: string) => s === 'High' ? 'badge-red' : s === 'Medium' ? 'badge-orange' : s === 'Info' ? 'badge-blue' : 'badge-green';
  const borderColor = (s: string) => s === 'High' ? 'var(--danger)' : s === 'Medium' ? 'var(--warning-orange)' : 'var(--primary-green)';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Alerts & Notifications</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? 'Loading…' : `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCircle size={14} /> Mark All Read
        </button>
      </div>

      <div className="tabs">
        {['all', 'unread', 'disease', 'weather', 'market'].map(t => (
          <div key={t} className={`tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'unread' && unreadCount > 0 && (
              <span className="badge badge-red ml-1" style={{ fontSize: '0.625rem', padding: '0 4px' }}>{unreadCount}</span>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={36} className="animate-spin text-muted" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Bell size={48} className="text-muted mx-auto mb-3" />
          <h3 className="font-bold mb-1">No alerts</h3>
          <p className="text-sm text-muted">You're all caught up.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((alert, i) => {
            const Icon = TYPE_ICON[alert.type] ?? TYPE_ICON.default;
            return (
              <div
                key={alert.id}
                className="card flex gap-4 items-start animate-fade-in"
                style={{ animationDelay: `${i * 0.04}s`, borderLeft: `4px solid ${borderColor(alert.severity)}`, opacity: alert.read ? 0.7 : 1, cursor: alert.read ? 'default' : 'pointer' }}
                onClick={() => !alert.read && markRead(alert.id)}
              >
                <div className="flex items-center justify-center flex-shrink-0" style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: alert.severity === 'High' ? 'var(--danger-light)' : alert.severity === 'Medium' ? 'var(--warning-bg)' : 'var(--light-green)',
                }}>
                  <Icon size={20} style={{ color: borderColor(alert.severity) }} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-sm">{alert.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${severityColor(alert.severity)}`}>{alert.severity}</span>
                      {!alert.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-green)', flexShrink: 0 }} />}
                    </div>
                  </div>
                  <p className="text-sm text-secondary">{alert.message}</p>
                  <div className="flex items-center gap-1 text-xs text-muted mt-2">
                    <Clock size={12} /> {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
