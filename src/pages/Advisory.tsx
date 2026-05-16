import React from 'react';
import { MessageCircle, Star, Phone, MapPin, Award, Users } from 'lucide-react';

const agronomists = [
  { name: 'Dr. Tapiwa Moyo', specialty: 'Cereal Crops & Disease Management', location: 'Harare', rating: 4.9, reviews: 128, available: true, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
  { name: 'Dr. Chiedza Ndlovu', specialty: 'Cotton & Tobacco Specialist', location: 'Bulawayo', rating: 4.7, reviews: 95, available: true, img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop' },
  { name: 'Eng. Blessing Mufara', specialty: 'Irrigation & Soil Health', location: 'Mutare', rating: 4.8, reviews: 76, available: false, img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop' },
];

const tips = [
  { title: 'Crop Rotation Best Practices', desc: 'Learn how to rotate maize, sorghum, and legumes for optimal soil health.', category: 'Soil Health' },
  { title: 'Water-Efficient Irrigation', desc: 'Techniques to reduce water usage by 30% without affecting crop yield.', category: 'Irrigation' },
  { title: 'Integrated Pest Management', desc: 'Combine biological, cultural, and chemical methods for pest control.', category: 'Pest Control' },
  { title: 'Post-Harvest Handling', desc: 'Reduce post-harvest losses with proper drying and storage methods.', category: 'Storage' },
];

export function Advisory() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Advisory Services</h1>
          <p className="text-sm text-muted mt-1">Connect with expert agronomists and access farming knowledge.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Stats */}
        {[
          { label: 'Active Agronomists', value: '24', icon: Users, color: 'var(--primary-green)' },
          { label: 'Consultations', value: '156', icon: MessageCircle, color: 'var(--info-blue)' },
          { label: 'Avg Rating', value: '4.8', icon: Star, color: '#eab308' },
          { label: 'Certified Experts', value: '18', icon: Award, color: '#8b5cf6' },
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
          <div className="flex flex-col gap-3">
            {agronomists.map((a, i) => (
              <div key={i} className="scan-result-card flex gap-4 items-center">
                <img src={a.img} alt={a.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{a.name}</h3>
                    <span className={`badge ${a.available ? 'badge-green' : 'badge-orange'}`}>{a.available ? 'Available' : 'Busy'}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{a.specialty}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {a.location}</span>
                    <span className="flex items-center gap-1" style={{ color: '#eab308' }}><Star size={11} /> {a.rating} ({a.reviews})</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="btn btn-primary btn-sm"><MessageCircle size={14} /> Chat</button>
                  <button className="btn btn-outline btn-sm"><Phone size={14} /> Call</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advisory Tips */}
        <div className="col-span-5 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="card-title mb-4">Farming Tips & Knowledge</h2>
          <div className="flex flex-col gap-3">
            {tips.map((t, i) => (
              <div key={i} className="scan-result-card" style={{ cursor: 'pointer' }}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-sm">{t.title}</h3>
                  <span className="badge badge-green">{t.category}</span>
                </div>
                <p className="text-xs text-muted">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
