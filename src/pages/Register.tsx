import React, { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props { onSwitch: () => void; }

export function Register({ onSwitch }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', location: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, location: form.location });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Tendai Moyo', icon: User, autocomplete: 'name' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: Mail, autocomplete: 'email' },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+263 77 123 4567', icon: Phone, autocomplete: 'tel' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Mazowe, Mashonaland Central', icon: MapPin, autocomplete: 'address-level2' },
  ] as const;

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Leaf size={28} />
          </div>
          <div>
            <div className="auth-logo-name">AgriSense</div>
            <div className="auth-logo-sub">Zimbabwe</div>
          </div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands of Zimbabwean farmers managing smarter</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-grid">
            {fields.map(f => (
              <div key={f.key} className="auth-field">
                <label className="form-label">{f.label}</label>
                <div className="input-icon-wrap">
                  <f.icon size={15} />
                  <input
                    className="input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={set(f.key)}
                    autoComplete={f.autocomplete}
                    required={f.key === 'name' || f.key === 'email'}
                  />
                </div>
              </div>
            ))}

            <div className="auth-field">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap" style={{ position: 'relative' }}>
                <Lock size={15} />
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" className="btn-icon" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="form-label">Confirm Password</label>
              <div className="input-icon-wrap">
                <Lock size={15} />
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full auth-submit" disabled={loading}>
            {loading ? <><Loader2 size={17} className="animate-spin" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" className="auth-link" onClick={onSwitch}>Sign in</button>
        </p>
      </div>

      <div className="auth-bg-pattern" aria-hidden />
    </div>
  );
}
