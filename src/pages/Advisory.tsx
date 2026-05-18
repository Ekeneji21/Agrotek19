import { useState, useEffect } from 'react';
import { BookOpen, Star, Award, Users, MessageCircle, Loader2 } from 'lucide-react';
import { advisoryApi } from '../services/api';

export function Advisory() {
  const [tips, setTips] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([advisoryApi.list(), advisoryApi.getStats()])
      .then(([tRes, sRes]) => { setTips(tRes.data); setStats(sRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Agricultural Knowledge Base</h1>
          <p className="text-sm text-muted mt-1">Expert farming tips and best practices for Zimbabwe.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {[
          { label: 'Expert Agronomists', value: stats?.total ?? '–', icon: Users, color: 'var(--primary-green)' },
          { label: 'Total Consultations', value: stats?.consultations ?? '–', icon: MessageCircle, color: 'var(--info-blue)' },
          { label: 'Avg Rating', value: stats?.avgRating ?? '–', icon: Star, color: '#eab308' },
          { label: 'Certified Experts', value: stats?.certified ?? '–', icon: Award, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="col-span-3 card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start">
              <div className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}

        <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: 'var(--primary-green)' }} />
            <h2 className="card-title" style={{ margin: 0 }}>Farming Tips & Best Practices</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="dashboard-grid" style={{ gap: '1rem' }}>
              {tips.map((t, i) => (
                <div key={t.id} className="col-span-4 scan-result-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">{t.title}</h3>
                    <span className="badge badge-green">{t.category}</span>
                  </div>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>{t.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
