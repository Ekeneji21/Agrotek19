import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Star, Phone, MapPin, Award, Users, Loader2, Mail, Clock, CheckCircle, Send } from 'lucide-react';
import { advisoryApi } from '../services/api';

export function Advisory() {
  const [agronomists, setAgronomists] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [consTab, setConsTab] = useState<'request' | 'replies'>('request');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([advisoryApi.getAgronomists(), advisoryApi.list(), advisoryApi.getStats(), advisoryApi.getConsultations()])
      .then(([aRes, tRes, sRes, cRes]) => {
        setAgronomists(aRes.data);
        setTips(tRes.data);
        setStats(sRes.data);
        setConsultations(cRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Poll for replies on pending consultations every 30s
  useEffect(() => {
    const hasPending = consultations.some(c => c.status === 'pending');
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await advisoryApi.getConsultations();
          setConsultations(res.data);
          if (!res.data.some((c: any) => c.status === 'pending') && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch {}
      }, 30_000);
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [consultations]);

  const sendRequest = async () => {
    if (!selected || !msgText.trim()) return;
    setSending(true);
    try {
      await advisoryApi.requestConsultation(selected.id, msgText.trim());
      const res = await advisoryApi.getConsultations();
      setConsultations(res.data);
      setMsgText('');
      setConsTab('replies');
    } catch {/* handled */}
    setSending(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Advisory Services</h1>
          <p className="text-sm text-muted mt-1">Send a consultation request — AI responds within 3 minutes.</p>
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

        {/* Agronomists + Consultation */}
        <div className="col-span-7 card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <h2 className="card-title mb-4">Select an Agronomist</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {agronomists.map((a) => (
                <div
                  key={a.id}
                  className="scan-result-card flex gap-4 items-center"
                  style={{ cursor: 'pointer', border: selected?.id === a.id ? '2px solid var(--primary-green)' : '1px solid var(--border)', transition: 'border 0.15s' }}
                  onClick={() => setSelected(a)}
                >
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
                    <div className="flex items-center gap-3 mt-1">
                      {a.phone && (
                        <a href={`tel:${a.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary-green)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          <Phone size={11} /> {a.phone}
                        </a>
                      )}
                      {a.email && (
                        <a href={`mailto:${a.email}`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--info-blue)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          <Mail size={11} /> Email
                        </a>
                      )}
                    </div>
                  </div>
                  {selected?.id === a.id && (
                    <CheckCircle size={20} style={{ color: 'var(--primary-green)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Consultation form */}
          {selected && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="tabs" style={{ marginBottom: 12 }}>
                <div className={`tab ${consTab === 'request' ? 'active' : ''}`} onClick={() => setConsTab('request')}>Send Request</div>
                <div className={`tab ${consTab === 'replies' ? 'active' : ''}`} onClick={() => setConsTab('replies')}>
                  My Consultations
                  {consultations.some(c => c.status === 'pending') && (
                    <span className="badge badge-orange ml-1" style={{ fontSize: '0.6rem' }}>Pending</span>
                  )}
                </div>
              </div>

              {consTab === 'request' ? (
                <div>
                  <p className="text-sm text-muted mb-2">Message to <strong>{selected.name}</strong>:</p>
                  <textarea
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Describe your farming problem or question in detail…"
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={sendRequest} disabled={sending || !msgText.trim()}>
                      {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {sending ? 'Sending…' : 'Send Request'}
                    </button>
                    <span className="text-xs text-muted">AI will reply within ~3 minutes</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {consultations.length === 0 ? (
                    <p className="text-sm text-muted">No consultations yet.</p>
                  ) : consultations.map((c, i) => (
                    <div key={i} className="scan-result-card" style={{ borderLeft: `3px solid ${c.status === 'replied' ? 'var(--primary-green)' : 'var(--warning-orange)'}` }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold">{c.agronomist_name}</span>
                        <span className={`badge ${c.status === 'replied' ? 'badge-green' : 'badge-orange'}`}>
                          {c.status === 'replied' ? 'Replied' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-2" style={{ fontStyle: 'italic' }}>{c.message}</p>
                      {c.status === 'replied' && c.ai_reply ? (
                        <div style={{ background: 'var(--light-green)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--primary-green)' }}>Reply from {c.agronomist_name}:</div>
                          <p className="text-xs" style={{ whiteSpace: 'pre-wrap' }}>{c.ai_reply}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Clock size={11} className="animate-pulse" /> Awaiting reply…
                        </div>
                      )}
                      <div className="text-xs text-muted mt-1">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
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
