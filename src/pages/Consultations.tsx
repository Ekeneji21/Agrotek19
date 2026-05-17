import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, Clock, CheckCircle, Bot, User, Leaf } from 'lucide-react';
import { advisoryApi } from '../services/api';

export function Consultations() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ agronomist_name: string; agronomist_specialty: string; agronomist_location: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConsultations = async () => {
    try {
      const res = await advisoryApi.getConsultations();
      setConsultations(res.data);
    } catch {/* handled */}
    setLoading(false);
  };

  useEffect(() => { loadConsultations(); }, []);

  // Poll while any consultation is pending
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
      }, 20_000);
    }
    if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [consultations]);

  const sendRequest = async () => {
    if (!msgText.trim() || sending) return;
    setSending(true);
    setSent(null);
    try {
      const res = await advisoryApi.requestConsultation(msgText.trim());
      setSent(res.data);
      setMsgText('');
      await loadConsultations();
    } catch {/* handled */}
    setSending(false);
  };

  const PROMPTS = [
    'My maize leaves are turning yellow from the edges — what could it be?',
    'When is the best time to apply top-dress fertilizer on tobacco?',
    'How do I control fall armyworm on my maize crop?',
    'What is the recommended spacing for soybean in Region II?',
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>AI Agronomist Consultations</h1>
          <p className="text-sm text-muted mt-1">Ask any farming question — we'll route you to the nearest expert who replies within 3 minutes.</p>
        </div>
      </div>

      {/* Ask form */}
      <div className="card animate-fade-in mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={18} style={{ color: 'var(--primary-green)' }} />
          <h2 className="card-title" style={{ margin: 0 }}>Ask a Question</h2>
        </div>
        <p className="text-xs text-muted mb-3">Describe your farming problem in detail. The AI will auto-assign the nearest available agronomist to answer.</p>

        {/* Suggestion chips */}
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          {PROMPTS.map((p, i) => (
            <button key={i} onClick={() => setMsgText(p)} style={{
              background: 'var(--light-green)', border: '1px solid var(--primary-green)',
              color: 'var(--primary-green)', borderRadius: 16, padding: '4px 12px',
              fontSize: '0.75rem', cursor: 'pointer',
            }}>
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={msgText}
          onChange={e => setMsgText(e.target.value)}
          placeholder="E.g. My tobacco seedlings are wilting after transplanting despite regular watering. What could be causing this and how do I fix it?"
          rows={4}
          style={{
            width: '100%', resize: 'vertical', padding: '10px 12px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            fontSize: '0.85rem', fontFamily: 'inherit',
          }}
        />
        <div className="flex items-center gap-3 mt-3">
          <button className="btn btn-primary" onClick={sendRequest} disabled={sending || !msgText.trim()}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sending ? 'Sending…' : 'Send to Agronomist'}
          </button>
          <span className="text-xs text-muted flex items-center gap-1">
            <Clock size={12} /> AI replies in ~3 minutes
          </span>
        </div>

        {sent && (
          <div className="mt-3 animate-fade-in" style={{ background: 'var(--light-green)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid var(--primary-green)' }}>
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--primary-green)' }}>
              <CheckCircle size={15} /> Sent to {sent.agronomist_name}
            </div>
            <p className="text-xs text-muted mt-1">{sent.agronomist_specialty} · {sent.agronomist_location} · Reply expected in ~3 minutes</p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="card-title mb-4">My Consultations</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
        ) : consultations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Leaf size={48} className="text-muted mx-auto mb-3" />
            <h3 className="font-bold mb-1">No consultations yet</h3>
            <p className="text-sm text-muted">Ask your first question above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {consultations.map((c, i) => (
              <div key={i} className="animate-fade-in" style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                overflow: 'hidden', animationDelay: `${i * 0.05}s`,
              }}>
                {/* Header */}
                <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="font-semibold text-sm">{c.agronomist_name}</span>
                    <span className="text-xs text-muted ml-2">{c.agronomist_specialty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString()}</span>
                    <span className={`badge ${c.status === 'replied' ? 'badge-green' : 'badge-orange'}`}>
                      {c.status === 'replied' ? 'Replied' : 'Pending'}
                    </span>
                  </div>
                </div>
                {/* Farmer message */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={15} color="#fff" />
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, borderBottomLeftRadius: 4, padding: '8px 14px', fontSize: '0.85rem', lineHeight: 1.5, flex: 1 }}>
                    {c.message}
                  </div>
                </div>
                {/* AI reply */}
                {c.status === 'replied' && c.ai_reply ? (
                  <div style={{ padding: '0 16px 12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={15} style={{ color: 'var(--primary-green)' }} />
                    </div>
                    <div style={{ background: 'var(--light-green)', borderRadius: 12, borderBottomLeftRadius: 4, padding: '8px 14px', fontSize: '0.85rem', lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap' }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: 'var(--primary-green)' }}>{c.agronomist_name}</div>
                      {c.ai_reply}
                    </div>
                  </div>
                ) : c.status === 'pending' ? (
                  <div style={{ padding: '8px 16px 12px 58px', fontSize: '0.8rem' }}>
                    <span className="text-muted flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Awaiting reply from {c.agronomist_name}…
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
