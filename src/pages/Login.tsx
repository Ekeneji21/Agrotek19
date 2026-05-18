import { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, Leaf, Shield, Zap, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

interface Props { onSwitch: () => void; }

export function Login({ onSwitch }: Props) {
  const { login } = useAuth();
  const { error: showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      showError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap,       text: 'AI disease detection in under 30 seconds' },
    { icon: BarChart3, text: 'Live market prices & weather intelligence' },
    { icon: Shield,    text: 'Expert agronomist consultations on demand' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-family)' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '3rem', background: 'linear-gradient(145deg, #14532d 0%, #16a34a 60%, #22c55e 100%)',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        {/* Background circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>AgriSense</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '2px', textTransform: 'uppercase' }}>Zimbabwe</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Smart farming<br />starts here.
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={18} />
                </div>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.6, fontStyle: 'italic' }}>
            "AgriSense helped me identify grey leaf spot before it spread. Saved my entire maize crop."
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.65, marginTop: '0.5rem' }}>— Tendai M., Mazowe District</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: 'var(--bg-color)', minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', justifyContent: 'center' }} className="auth-mobile-logo">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>AgriSense</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary-green)', letterSpacing: '2px', textTransform: 'uppercase' }}>Zimbabwe</div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>Welcome back</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to your farm management account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.375rem',
                    border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.375rem',
                    border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem', marginTop: '0.5rem',
                background: loading ? 'var(--border-color)' : 'var(--primary-green)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 4px 12px rgb(22 163 74 / 0.3)',
              }}
            >
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button type="button" onClick={onSwitch}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-green)', fontWeight: 600, fontSize: '0.875rem' }}>
              Create account
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
