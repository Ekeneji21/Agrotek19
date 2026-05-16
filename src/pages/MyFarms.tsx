import React, { useState, useEffect } from 'react';
import { MapPin, Plus, MoreHorizontal, Leaf, Droplets, Thermometer, ArrowUpRight, Loader2, Trash2, Edit2, X, Save } from 'lucide-react';
import { farmsApi } from '../services/api';

interface Farm {
  id: string;
  name: string;
  location: string;
  size_ha: number;
  crops: string[];
  health_pct: number;
  irrigation_type: string;
  updated_at: string;
  image_url: string | null;
}

const IRRIGATION_TYPES = ['Manual', 'Drip', 'Sprinkler', 'Center Pivot', 'Flood', 'Rain-fed'];

function FarmModal({ farm, onClose, onSave }: { farm?: Farm; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: farm?.name ?? '',
    location: farm?.location ?? '',
    size_ha: farm?.size_ha ?? 0,
    crops: farm?.crops.join(', ') ?? '',
    irrigation_type: farm?.irrigation_type ?? 'Manual',
    health_pct: farm?.health_pct ?? 80,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        crops: form.crops.split(',').map(s => s.trim()).filter(Boolean),
        size_ha: Number(form.size_ha),
        health_pct: Number(form.health_pct),
      };
      if (farm) await farmsApi.update(farm.id, payload);
      else await farmsApi.create(payload);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save farm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-bold text-lg">{farm ? 'Edit Farm' : 'Add New Farm'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <label className="form-label">Farm Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Location *</label>
            <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required placeholder="e.g. Mazowe, Mashonaland Central" />
          </div>
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label className="form-label">Size (hectares)</label>
              <input className="input" type="number" min="0" step="0.1" value={form.size_ha} onChange={e => setForm(f => ({ ...f, size_ha: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Health %</label>
              <input className="input" type="number" min="0" max="100" value={form.health_pct} onChange={e => setForm(f => ({ ...f, health_pct: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Crops (comma-separated)</label>
            <input className="input" value={form.crops} onChange={e => setForm(f => ({ ...f, crops: e.target.value }))} placeholder="e.g. Maize, Sorghum, Cotton" />
          </div>
          <div>
            <label className="form-label">Irrigation Type</label>
            <select className="input" value={form.irrigation_type} onChange={e => setForm(f => ({ ...f, irrigation_type: e.target.value }))}>
              {IRRIGATION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> {farm ? 'Update' : 'Create'} Farm</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MyFarms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFarm, setEditFarm] = useState<Farm | undefined>(undefined);

  const loadData = async () => {
    try {
      const [farmsRes, statsRes] = await Promise.all([farmsApi.list(), farmsApi.stats()]);
      setFarms(farmsRes.data);
      setStats(statsRes.data);
    } catch {/* handled */}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const deleteFarm = async (id: string) => {
    if (!confirm('Delete this farm?')) return;
    await farmsApi.delete(id);
    loadData();
  };

  const openAdd = () => { setEditFarm(undefined); setModalOpen(true); };
  const openEdit = (farm: Farm) => { setEditFarm(farm); setModalOpen(true); };
  const handleSaved = () => { setModalOpen(false); loadData(); };

  const timeAgo = (dt: string) => {
    const diff = Date.now() - new Date(dt).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>My Farms</h1>
          <p className="text-sm text-muted mt-1">Manage and monitor all your agricultural operations.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Farm</button>
      </div>

      <div className="dashboard-grid">
        {[
          { label: 'Total Farms', value: stats?.totalFarms ?? '–', icon: MapPin, color: 'var(--primary-green)' },
          { label: 'Total Area', value: stats ? `${stats.totalAreaHa} ha` : '–', icon: Leaf, color: 'var(--info-blue)' },
          { label: 'Avg Health', value: stats ? `${stats.avgHealthPct}%` : '–', icon: Thermometer, color: 'var(--warning-orange)' },
          { label: 'Irrigation Types', value: farms.length > 0 ? new Set(farms.map(f => f.irrigation_type)).size : '–', icon: Droplets, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="col-span-3 card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start">
              <div className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}15` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}

        {loading ? (
          <div className="col-span-12 flex justify-center py-12"><Loader2 size={36} className="animate-spin text-muted" /></div>
        ) : farms.length === 0 ? (
          <div className="col-span-12 card text-center py-12">
            <MapPin size={48} className="text-muted mx-auto mb-3" />
            <h3 className="font-bold mb-2">No farms yet</h3>
            <p className="text-sm text-muted mb-4">Click "Add Farm" to register your first farm.</p>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Farm</button>
          </div>
        ) : farms.map((farm, i) => (
          <div key={farm.id} className="col-span-4 card animate-fade-in p-0 overflow-hidden" style={{ animationDelay: `${(i + 4) * 0.05}s`, padding: 0 }}>
            <div style={{ height: 160, overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {farm.image_url ? (
                <img src={farm.image_url} alt={farm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Leaf size={48} className="text-muted" style={{ opacity: 0.3 }} />
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{farm.name}</h3>
                <div className="flex gap-1">
                  <button className="btn-icon" onClick={() => openEdit(farm)}><Edit2 size={14} /></button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteFarm(farm.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted mb-3">
                <MapPin size={12} /> {farm.location}
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {farm.crops.map(c => <span key={c} className="badge badge-green">{c}</span>)}
                {farm.crops.length === 0 && <span className="text-xs text-muted">No crops set</span>}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Health</span>
                <span className="font-bold text-primary">{farm.health_pct}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 4, marginTop: 6 }}>
                <div style={{ height: '100%', width: `${farm.health_pct}%`, background: farm.health_pct > 80 ? 'var(--primary-green)' : 'var(--warning-orange)', borderRadius: 4, transition: 'width 1s ease-out' }} />
              </div>
              <div className="flex justify-between mt-3 text-xs text-muted">
                <span>{farm.size_ha} ha · {farm.irrigation_type}</span>
                <span>{timeAgo(farm.updated_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <FarmModal farm={editFarm} onClose={() => setModalOpen(false)} onSave={handleSaved} />}
    </div>
  );
}
