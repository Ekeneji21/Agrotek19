import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bug, CloudRain, TrendingDown, CheckCircle, Clock, Loader2, Bell, Trash2, TrendingUp, Minus } from 'lucide-react';
import { alertsApi, marketApi } from '../services/api';

const TYPE_ICON: Record<string, React.ElementType> = {
  disease: Bug,
  weather: CloudRain,
  market: TrendingDown,
  system: CheckCircle,
  default: Bell,
};

const TREND_ICON: Record<string, React.ElementType> = { up: TrendingUp, down: TrendingDown, stable: Minus, volatile: AlertTriangle };
const TREND_COLOR: Record<string, string> = { up: 'var(--primary-green)', down: 'var(--danger)', stable: 'var(--text-muted)', volatile: 'var(--warning-orange)' };

export function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [prices, setPrices] = useState<any>(null);
  const [pricesLoading, setPricesLoading] = useState(false);

  const loadAlerts = async () => {
    try {
      const res = await alertsApi.list();
      setAlerts(res.data);
    } catch {/* handled */}
    setLoading(false);
  };

  const loadPrices = async () => {
    if (prices) return;
    setPricesLoading(true);
    try {
      const res = await marketApi.getPrices();
      setPrices(res.data);
    } catch {/* handled */}
    setPricesLoading(false);
  };

  useEffect(() => { loadAlerts(); }, []);
  useEffect(() => { if (filter === 'prices') loadPrices(); }, [filter]);

  const markRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    await alertsApi.markRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    await alertsApi.markAllRead().catch(() => {});
  };

  const deleteAlert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts(prev => prev.filter(a => a.id !== id));
    await alertsApi.delete(id).catch(() => {});
  };

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.read)
    : filter === 'prices' ? []
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;
  const severityColor = (s: string) => s === 'High' ? 'badge-red' : s === 'Medium' ? 'badge-orange' : s === 'Info' ? 'badge-blue' : 'badge-green';
  const borderColor = (s: string) => s === 'High' ? 'var(--danger)' : s === 'Medium' ? 'var(--warning-orange)' : 'var(--primary-green)';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Alerts & Market Prices</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? 'Loading…' : `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {filter !== 'prices' && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCircle size={14} /> Mark All Read
          </button>
        )}
      </div>

      <div className="tabs">
        {['all', 'unread', 'disease', 'weather', 'market', 'prices'].map(t => (
          <div key={t} className={`tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'prices' ? 'Market Prices' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'unread' && unreadCount > 0 && (
              <span className="badge badge-red ml-1" style={{ fontSize: '0.625rem', padding: '0 4px' }}>{unreadCount}</span>
            )}
          </div>
        ))}
      </div>

      {filter === 'prices' ? (
        pricesLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={36} className="animate-spin text-muted" /></div>
        ) : prices ? (
          <div>
            <div className="card mb-4" style={{ background: 'var(--light-green)', border: '1px solid var(--primary-green)' }}>
              <p className="text-sm text-secondary"><strong>Source:</strong> {prices.source}</p>
            </div>
            <div className="flex flex-col gap-3">
              {prices.prices.map((p: any, i: number) => {
                const TIcon = TREND_ICON[p.trend] ?? Minus;
                return (
                  <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{p.commodity}</h3>
                          <TIcon size={14} style={{ color: TREND_COLOR[p.trend] }} />
                          <span className="text-xs" style={{ color: TREND_COLOR[p.trend], textTransform: 'capitalize' }}>{p.trend}</span>
                        </div>
                        <p className="text-xs text-muted">{p.note}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>
                          USD {p.market_price.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted">per {p.unit}</div>
                        {p.gmb_price && (
                          <div className="text-xs text-muted">GMB: USD {p.gmb_price}/{p.unit}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <TrendingDown size={48} className="text-muted mx-auto mb-3" />
            <h3 className="font-bold mb-1">Failed to load prices</h3>
            <button className="btn btn-outline btn-sm mt-2" onClick={() => { setPrices(null); loadPrices(); }}>Retry</button>
          </div>
        )
      ) : loading ? (
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
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--danger)', padding: 4 }}
                        onClick={(e) => deleteAlert(alert.id, e)}
                        title="Delete alert"
                      >
                        <Trash2 size={14} />
                      </button>
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
