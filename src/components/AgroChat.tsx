import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, ShoppingCart } from 'lucide-react';
import { chatApi } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  marketplaceItems?: any[];
}

const SUGGESTIONS = [
  'Best maize variety for Mashonaland?',
  'How to treat fall armyworm on maize?',
  'Fertilizer plan for 1 ha tobacco?',
  'GMB maize price 2024/2025?',
];

export function AgroChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hie! I\'m AgriBot 🌱 Ask me anything about farming in Zimbabwe — crops, diseases, fertilizers, prices, chemicals and more.',
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await chatApi.send(msg, history.slice(0, -1));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply,
        marketplaceItems: res.data.marketplaceItems,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect right now. Please check your connection and try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--primary-green)', color: '#fff',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Ask AI Agronomist"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 999,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          height: 500, maxHeight: 'calc(100vh - 110px)',
          background: 'var(--card-bg)', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column',
          border: '1px solid var(--border)',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', background: 'var(--primary-green)', color: '#fff',
            borderRadius: 'var(--radius) var(--radius) 0 0', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Bot size={20} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>AgriBot</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>AI Agricultural Advisor • Zimbabwe</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'user' ? 'var(--primary-green)' : 'var(--light-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.role === 'user' ? <User size={14} color="#fff" /> : <Bot size={14} color="var(--primary-green)" />}
                  </div>
                  <div style={{
                    maxWidth: '82%', padding: '8px 12px', borderRadius: 12,
                    background: m.role === 'user' ? 'var(--primary-green)' : 'var(--bg-secondary)',
                    color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.82rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12,
                  }}>
                    {m.content}
                  </div>
                </div>
                {/* Marketplace items */}
                {m.marketplaceItems && m.marketplaceItems.length > 0 && (
                  <div style={{ marginLeft: 36, marginTop: 6 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShoppingCart size={11} /> Available in Marketplace:
                    </div>
                    {m.marketplaceItems.map((p: any) => (
                      <div key={p.id} style={{
                        background: 'var(--light-green)', border: '1px solid var(--primary-green)',
                        borderRadius: 8, padding: '6px 10px', marginBottom: 4,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.seller} • {p.unit}</div>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-green)' }}>
                          USD {p.price_usd}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="var(--primary-green)" />
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 12, borderBottomLeftRadius: 4 }}>
                  <Loader2 size={14} className="animate-spin text-muted" />
                </div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{
                    background: 'var(--light-green)', border: '1px solid var(--primary-green)',
                    color: 'var(--primary-green)', borderRadius: 16, padding: '4px 10px',
                    fontSize: '0.72rem', cursor: 'pointer',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about crops, pests, prices…"
              disabled={loading}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 20,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: input.trim() && !loading ? 'var(--primary-green)' : 'var(--border)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
