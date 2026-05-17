import React, { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props { onSwitch: () => void; }

export function Login({ onSwitch }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Leaf size={28} />
          </div>
          <div>
            <div className="auth-logo-name">AgriSense</div>
            <div className="auth-logo-sub">Zimbabwe</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your farm management account</p>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrap">
              <Mail size={15} />
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <Lock size={15} />
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full auth-submit" disabled={loading}>
            {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button type="button" className="auth-link" onClick={onSwitch}>
            Create account
          </button>
        </p>
      </div>

      <div className="auth-bg-pattern" aria-hidden />
    </div>
  );
}
