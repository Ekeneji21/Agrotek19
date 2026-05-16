import React, { useState } from 'react';
import { MapPin, Plus, MoreHorizontal, Leaf, Droplets, Thermometer, ArrowUpRight } from 'lucide-react';

const farmsData = [
  { id: 1, name: 'Mazowe Valley Farm', location: 'Mazowe, Mashonaland Central', size: '120 ha', crops: ['Maize', 'Sorghum'], health: 87, irrigation: 'Drip', lastUpdate: '2 hours ago', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop' },
  { id: 2, name: 'Nyanga Highlands Plot', location: 'Nyanga, Manicaland', size: '45 ha', crops: ['Cotton', 'Tobacco'], health: 72, irrigation: 'Sprinkler', lastUpdate: '5 hours ago', img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop' },
  { id: 3, name: 'Chiredzi Estate', location: 'Chiredzi, Masvingo', size: '200 ha', crops: ['Sugarcane', 'Maize'], health: 94, irrigation: 'Center Pivot', lastUpdate: '30 min ago', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=250&fit=crop' },
];

export function MyFarms() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>My Farms</h1>
          <p className="text-sm text-muted mt-1">Manage and monitor all your agricultural operations.</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add Farm</button>
      </div>

      <div className="dashboard-grid">
        {/* Stats Row */}
        {[
          { label: 'Total Farms', value: '3', icon: MapPin, color: 'var(--primary-green)', change: '' },
          { label: 'Total Area', value: '365 ha', icon: Leaf, color: 'var(--info-blue)', change: '+20 ha' },
          { label: 'Avg Health', value: '84%', icon: Thermometer, color: 'var(--warning-orange)', change: '+3%' },
          { label: 'Water Usage', value: '2.4M L', icon: Droplets, color: '#8b5cf6', change: '-8%' },
        ].map((s, i) => (
          <div key={i} className="col-span-3 card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start">
              <div className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.change && <span className="stat-change up"><ArrowUpRight size={12} /> {s.change}</span>}
              </div>
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}15` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}

        {/* Farm Cards */}
        {farmsData.map((farm, i) => (
          <div key={farm.id} className="col-span-4 card animate-fade-in p-0 overflow-hidden" style={{ animationDelay: `${(i + 4) * 0.05}s`, padding: 0 }}>
            <div style={{ height: 160, overflow: 'hidden' }}>
              <img src={farm.img} alt={farm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{farm.name}</h3>
                <button className="btn-icon"><MoreHorizontal size={16} /></button>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted mb-3">
                <MapPin size={12} /> {farm.location}
              </div>
              <div className="flex gap-2 mb-3">
                {farm.crops.map(c => <span key={c} className="badge badge-green">{c}</span>)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Health</span>
                <span className="font-bold text-primary">{farm.health}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 4, marginTop: 6 }}>
                <div style={{ height: '100%', width: `${farm.health}%`, background: farm.health > 80 ? 'var(--primary-green)' : 'var(--warning-orange)', borderRadius: 4, transition: 'width 1s ease-out' }} />
              </div>
              <div className="flex justify-between mt-3 text-xs text-muted">
                <span>{farm.size} · {farm.irrigation}</span>
                <span>{farm.lastUpdate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
