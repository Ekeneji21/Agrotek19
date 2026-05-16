import React, { useState, useEffect } from 'react';
import { MessageCircle, Star, Phone, MapPin, Award, Users, Loader2, Send, X } from 'lucide-react';
import { advisoryApi } from '../services/api';

function ConsultModal({ agronomist, onClose }: { agronomist: any; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await advisoryApi.requestConsultation(agronomist.id, message);
      setDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to send consultation request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-bold text-lg">Request Consultation</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-lg mb-2">Request Sent!</h3>
            <p className="text-sm text-muted mb-4">Your consultation request has been sent to {agronomist.name}. They will respond shortly.</p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex gap-3 items-center mb-4 p-3 rounded-md" style={{ background: 'var(--bg-color)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👨‍🌾</div>
              <div>
                <div className="font-semibold">{agronomist.name}</div>
                <div className="text-xs text-muted">{agronomist.specialty}</div>
              </div>
            </div>
            <label className="form-label">Describe your issue *</label>
            <textarea
              className="input"
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your crop issue, location, and any symptoms you've observed…"
              style={{ resize: 'vertical' }}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={sending || !message.trim()} onClick={send}>
                {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send Request</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Advisory() {
  const [agronomists, setAgronomists] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consultTarget, setConsultTarget] = useState<any>(null);

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
          <p className="text-sm text-muted mt-1">Connect with expert agronomists and access farming knowledge.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {[
          { label: 'Active Agronomists', value: stats?.available ?? '–', icon: Users, color: 'var(--primary-green)' },
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
          <h2 className="card-title mb-4">Available Agronomists</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {agronomists.map((a) => (
                <div key={a.id} className="scan-result-card flex gap-4 items-center">
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    👨‍🌾
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{a.name}</h3>
                      <span className={`badge ${a.available ? 'badge-green' : 'badge-orange'}`}>{a.available ? 'Available' : 'Busy'}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">{a.specialty}</p>
                    {a.bio && <p className="text-xs text-muted mt-1" style={{ fontStyle: 'italic' }}>{a.bio}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {a.location}</span>
                      <span className="flex items-center gap-1" style={{ color: '#eab308' }}><Star size={11} fill="#eab308" /> {a.rating} ({a.review_count})</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="btn btn-primary btn-sm" disabled={!a.available} onClick={() => setConsultTarget(a)}>
                      <MessageCircle size={14} /> Chat
                    </button>
                    <button className="btn btn-outline btn-sm" disabled={!a.available} onClick={() => setConsultTarget(a)}>
                      <Phone size={14} /> Call
                    </button>
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
                <div key={t.id} className="scan-result-card" style={{ cursor: 'pointer' }}>
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

      {consultTarget && <ConsultModal agronomist={consultTarget} onClose={() => setConsultTarget(null)} />}
    </div>
  );
}
