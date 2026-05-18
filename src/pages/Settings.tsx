import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell, Save, Loader2, CheckCircle } from 'lucide-react';
import { authApi, alertsApi } from '../services/api';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: checked ? 'var(--primary-green)' : 'var(--border-color)', borderRadius: 24, transition: 'var(--transition)' }}>
        <span style={{ position: 'absolute', height: 18, width: 18, left: checked ? 22 : 3, bottom: 3, background: 'white', borderRadius: '50%', transition: 'var(--transition)' }} />
      </span>
    </label>
  );
}

export function Settings() {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', location: '' });
  const [notifSettings, setNotifSettings] = useState({ disease_alerts: true, weather_warnings: true, market_updates: true, advisory_messages: true, weekly_reports: false });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([authApi.getProfile(), alertsApi.getSettings()])
      .then(([pRes, nRes]) => {
        const u = pRes.data;
        setProfile({ name: u.name || '', email: u.email || '', phone: u.phone || '', location: u.location || '' });
        const n = nRes.data;
        setNotifSettings({ disease_alerts: n.disease_alerts, weather_warnings: n.weather_warnings, market_updates: n.market_updates, advisory_messages: n.advisory_messages, weekly_reports: n.weekly_reports });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await authApi.updateProfile({ name: profile.name, phone: profile.phone, location: profile.location });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err.message || 'Failed to save'); }
    setSaving(false);
  };

  const saveNotif = async () => {
    setSaving(true);
    try {
      await alertsApi.updateSettings(notifSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {/* handled */}
    setSaving(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword)
      return setError('Passwords do not match');
    setSaving(true); setError(''); setSaved(false);
    try {
      await authApi.updatePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setSaved(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err.message || 'Failed to update password'); }
    setSaving(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Account Settings</h1>
          <p className="text-sm text-muted mt-1">Manage your profile, preferences, and security.</p>
        </div>
        {saved && <span className="badge badge-green"><CheckCircle size={12} /> Saved</span>}
      </div>

      <div className="tabs">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: Shield },
        ].map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setError(''); setSaved(false); }}>
            <span className="flex items-center gap-2"><t.icon size={14} /> {t.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={36} className="animate-spin text-muted" /></div>
      ) : (
        <>
          {tab === 'profile' && (
            <div className="dashboard-grid animate-fade-in">
              <div className="col-span-4 card flex flex-col items-center text-center">
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 16 }}>
                  👨‍🌾
                </div>
                <h2 className="font-bold text-lg">{profile.name || 'Your Name'}</h2>
                <p className="text-sm text-muted">{profile.location || 'Location not set'}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted">
                  <Mail size={12} /> {profile.email}
                </div>
              </div>

              <div className="col-span-8 card">
                <h2 className="card-title mb-4">Personal Information</h2>
                {error && <p className="text-sm text-danger mb-3">{error}</p>}
                <form onSubmit={saveProfile}>
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div>
                      <label className="form-label">Full Name</label>
                      <div className="input-icon-wrap"><User size={14} /><input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /></div>
                    </div>
                    <div>
                      <label className="form-label">Email (read-only)</label>
                      <div className="input-icon-wrap"><Mail size={14} /><input className="input" value={profile.email} readOnly style={{ opacity: 0.6 }} /></div>
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <div className="input-icon-wrap"><Phone size={14} /><input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+263 77 123 4567" /></div>
                    </div>
                    <div>
                      <label className="form-label">Location</label>
                      <div className="input-icon-wrap"><MapPin size={14} /><input className="input" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="Mazowe, Mashonaland Central" /></div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-6" disabled={saving}>
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card animate-fade-in">
              <h2 className="card-title mb-4">Notification Preferences</h2>
              {[
                { key: 'disease_alerts', label: 'Disease Alerts', desc: 'Get notified about disease outbreaks near your farms.' },
                { key: 'weather_warnings', label: 'Weather Warnings', desc: 'Receive severe weather alerts for your region.' },
                { key: 'market_updates', label: 'Market Price Updates', desc: 'Daily updates on commodity prices.' },
                { key: 'advisory_messages', label: 'Advisory Messages', desc: 'Notifications from your connected agronomists.' },
                { key: 'weekly_reports', label: 'Weekly Reports', desc: 'Receive a weekly summary of your farm performance.' },
              ].map(n => (
                <div key={n.key} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div className="font-semibold text-sm">{n.label}</div>
                    <div className="text-xs text-muted">{n.desc}</div>
                  </div>
                  <Toggle
                    checked={notifSettings[n.key as keyof typeof notifSettings]}
                    onChange={v => setNotifSettings(s => ({ ...s, [n.key]: v }))}
                  />
                </div>
              ))}
              <button className="btn btn-primary mt-6" disabled={saving} onClick={saveNotif}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Preferences</>}
              </button>
            </div>
          )}

          {tab === 'security' && (
            <div className="card animate-fade-in">
              <h2 className="card-title mb-4">Change Password</h2>
              {error && <p className="text-sm text-danger mb-3">{error}</p>}
              <form onSubmit={savePassword} className="flex flex-col gap-4" style={{ maxWidth: 500 }}>
                {[
                  { key: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
                  { key: 'newPassword', label: 'New Password', placeholder: '••••••••' },
                  { key: 'confirmPassword', label: 'Confirm New Password', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input className="input" type="password" placeholder={f.placeholder}
                      value={passwords[f.key as keyof typeof passwords]}
                      onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><Save size={16} /> Update Password</>}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
