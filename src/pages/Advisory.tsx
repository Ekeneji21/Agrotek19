import React, { useState, useEffect } from 'react';
import { MessageCircle, Star, Phone, MapPin, Award, Users, Loader2, ExternalLink } from 'lucide-react';
import { advisoryApi } from '../services/api';

export function Advisory() {
  const [agronomists, setAgronomists] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([advisoryApi.getAgronomists(), advisoryApi.list(), advisoryApi.getStats()])
      .then(([aRes, tRes, sRes]) => {
        setAgronomists(aRes.data);
        setTips(tRes.data);
        setStats(sRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Advisory Services</h1>
          <p className="text-sm text-muted mt-1">Connect directly with Zimbabwean agronomists via call or WhatsApp.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {[
          { label: 'Available Agronomists', value: stats?.available ?? '–', icon: Users, color: 'var(--primary-green)' },
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

        {/* Agronomists */}
        <div className="col-span-7 card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <h2 className="card-title mb-4">Agronomists — Direct Contact</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {agronomists.map((a) => (
                <div key={a.id} className="scan-result-card flex gap-4 items-center">
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    👨‍🌾
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{a.name}</h3>
                      <span className={`badge ${a.available ? 'badge-green' : 'badge-orange'}`}>{a.available ? 'Available' : 'Busy'}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{a.specialty}</p>
                    {a.bio && <p className="text-xs text-muted mt-1" style={{ fontStyle: 'italic' }}>{a.bio}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {a.location}</span>
                      <span className="flex items-center gap-1" style={{ color: '#eab308' }}><Star size={11} fill="#eab308" /> {a.rating} ({a.review_count} reviews)</span>
                    </div>
                    {a.phone && (
                      <div className="flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: 'var(--primary-green)' }}>
                        <Phone size={11} /> {a.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {a.phone && (
                      <a href={`tel:${a.phone.replace(/\s/g, '')}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                        <Phone size={13} /> Call
                      </a>
                    )}
                    {a.whatsapp && (
                      <a href={`https://wa.me/${a.whatsapp}`} target="_blank" rel="noreferrer"
                        className="btn btn-outline btn-sm" style={{ textDecoration: 'none', color: '#16a34a', borderColor: '#16a34a' }}>
                        <ExternalLink size={13} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="col-span-5 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="card-title mb-4">Farming Tips & Knowledge</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {tips.map((t) => (
                <div key={t.id} className="scan-result-card">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-sm">{t.title}</h3>
                    <span className="badge badge-green">{t.category}</span>
                  </div>
                  <p className="text-xs text-muted">{t.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
