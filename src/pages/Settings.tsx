import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell, Palette, Save, Camera } from 'lucide-react';

export function Settings() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Account Settings</h1>
          <p className="text-sm text-muted mt-1">Manage your profile, preferences, and notifications.</p>
        </div>
      </div>

      <div className="tabs">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: Shield },
        ].map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="flex items-center gap-2"><t.icon size={14} /> {t.label}</span>
          </div>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="dashboard-grid animate-fade-in">
          <div className="col-span-4 card flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--light-green)' }} />
              <button className="btn-icon absolute" style={{ bottom: 0, right: 0, background: 'var(--primary-green)', color: 'white', width: 28, height: 28 }}>
                <Camera size={14} />
              </button>
            </div>
            <h2 className="font-bold text-lg">Tendai Moyo</h2>
            <p className="text-sm text-muted">Farmer • Mazowe Valley</p>
            <span className="badge badge-green mt-2">Premium Account</span>
          </div>

          <div className="col-span-8 card">
            <h2 className="card-title mb-4">Personal Information</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div>
                <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>Full Name</label>
                <input className="input" defaultValue="Tendai Moyo" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>Email</label>
                <input className="input" defaultValue="tendai@agrisense.co.zw" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>Phone</label>
                <input className="input" defaultValue="+263 77 123 4567" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>Location</label>
                <input className="input" defaultValue="Mazowe, Mashonaland Central" />
              </div>
            </div>
            <button className="btn btn-primary mt-6"><Save size={16} /> Save Changes</button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card animate-fade-in">
          <h2 className="card-title mb-4">Notification Preferences</h2>
          {[
            { label: 'Disease Alerts', desc: 'Get notified about disease outbreaks near your farms.' },
            { label: 'Weather Warnings', desc: 'Receive severe weather alerts for your region.' },
            { label: 'Market Price Updates', desc: 'Daily updates on commodity prices.' },
            { label: 'Advisory Messages', desc: 'Notifications from your connected agronomists.' },
            { label: 'Weekly Reports', desc: 'Receive a weekly summary of your farm performance.' },
          ].map((n, i) => (
            <div key={i} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div className="font-semibold text-sm">{n.label}</div>
                <div className="text-xs text-muted">{n.desc}</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                <input type="checkbox" defaultChecked={i < 3} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: i < 3 ? 'var(--primary-green)' : 'var(--border-color)', borderRadius: 24, transition: 'var(--transition)' }}>
                  <span style={{ position: 'absolute', height: 18, width: 18, left: i < 3 ? 22 : 3, bottom: 3, background: 'white', borderRadius: '50%', transition: 'var(--transition)' }} />
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {tab === 'security' && (
        <div className="card animate-fade-in">
          <h2 className="card-title mb-4">Security Settings</h2>
          <div className="flex flex-col gap-4" style={{ maxWidth: 500 }}>
            <div>
              <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>Current Password</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>New Password</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted mb-1" style={{ display: 'block' }}>Confirm Password</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><Save size={16} /> Update Password</button>
          </div>
        </div>
      )}
    </div>
  );
}
