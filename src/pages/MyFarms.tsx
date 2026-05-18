import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Leaf, Droplets, Thermometer, Loader2, Trash2, Edit2, X, Save, Check } from 'lucide-react';
import { farmsApi } from '../services/api';

interface Farm {
  id: string; name: string; location: string; size_ha: number;
  crops: string[]; health_pct: number; irrigation_type: string;
  updated_at: string; image_url: string | null;
}

const IRRIGATION_TYPES = ['Rain-fed', 'Manual', 'Drip', 'Sprinkler', 'Center Pivot', 'Flood'];
const ZIM_CROPS = ['Maize','Tobacco','Cotton','Wheat','Sorghum','Soybean','Groundnut','Sunflower','Sugarcane','Barley','Millet','Cowpea','Beans','Tomato','Pepper','Onion','Cabbage','Potato','Sweet Potato','Cassava'];

function CropPicker({ selected, onChange }: { selected: string[]; onChange: (c: string[]) => void }) {
  const toggle = (crop: string) => onChange(selected.includes(crop) ? selected.filter(c => c !== crop) : [...selected, crop]);
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {ZIM_CROPS.map(crop => (
        <button key={crop} type="button" onClick={() => toggle(crop)} style={{
          padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: '1px solid',
          borderColor: selected.includes(crop) ? 'var(--primary-green)' : 'var(--border-color)',
          background: selected.includes(crop) ? 'var(--light-green)' : 'transparent',
          color: selected.includes(crop) ? 'var(--primary-green)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {selected.includes(crop) && <Check size={10} />}{crop}
        </button>
      ))}
    </div>
  );
}

function FarmModal({ farm, onClose, onSave }: { farm?: Farm; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: farm?.name ?? '', location: farm?.location ?? '',
    size_ha: (farm?.size_ha ?? '') as any,
    crops: farm?.crops ?? [] as string[],
    irrigation_type: farm?.irrigation_type ?? 'Rain-fed',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.crops.length === 0) { setError('Please select at least one crop.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, size_ha: Number(form.size_ha) || 0 };
      if (farm) await farmsApi.update(farm.id, payload);
      else await farmsApi.create(payload);
      onSave();
    } catch (err: any) { setError(err.message || 'Failed to save farm'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-bold text-lg">{farm ? 'Edit Farm' : 'Add New Farm'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <div style={{ flex: 2 }}>
              <label className="form-label">Farm Name *</label>
              <input className="input" value={form.name} placeholder="e.g. Moyo Farm A" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Size (ha)</label>
              <input className="input" type="number" min="0" step="0.1" placeholder="0" value={form.size_ha} onChange={e => setForm(f => ({ ...f, size_ha: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Location *</label>
            <input className="input" value={form.location} placeholder="e.g. Mazowe, Mashonaland Central" onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Irrigation Type</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {IRRIGATION_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, irrigation_type: t }))} style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: '1px solid',
                  borderColor: form.irrigation_type === t ? 'var(--primary-green)' : 'var(--border-color)',
                  background: form.irrigation_type === t ? 'var(--light-green)' : 'transparent',
                  color: form.irrigation_type === t ? 'var(--primary-green)' : 'var(--text-muted)',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Crops Grown * <span className="text-muted" style={{ fontWeight: 400 }}>(tap to select)</span></label>
            <CropPicker selected={form.crops} onChange={crops => setForm(f => ({ ...f, crops }))} />
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
      setFarms(farmsRes.data); setStats(statsRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const deleteFarm = async (id: string) => {
    if (!confirm('Delete this farm?')) return;
    await farmsApi.delete(id); loadData();
  };

  const healthColor = (pct: number) => pct >= 75 ? 'var(--primary-green)' : pct >= 50 ? 'var(--warning-orange)' : '#ef4444';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>My Farms</h1>
          <p className="text-sm text-muted mt-1">Health score is auto-calculated from AI disease scan history.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditFarm(undefined); setModalOpen(true); }}><Plus size={16} /> Add Farm</button>
      </div>

      <div className="dashboard-grid">
        {[
          { label: 'Total Farms', value: stats?.totalFarms ?? '–', icon: MapPin, color: 'var(--primary-green)' },
          { label: 'Total Area', value: stats ? `${stats.totalAreaHa} ha` : '–', icon: Leaf, color: 'var(--info-blue)' },
          { label: 'AI Health Score', value: stats ? `${stats.avgHealthPct}%` : '–', icon: Thermometer, color: 'var(--warning-orange)' },
          { label: 'Irrigation Types', value: farms.length > 0 ? new Set(farms.map(f => f.irrigation_type)).size : '–', icon: Droplets, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="col-span-3 card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start">
              <div className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Farm</button>
          </div>
        ) : farms.map((farm, i) => (
          <div key={farm.id} className="col-span-4 card animate-fade-in p-0 overflow-hidden" style={{ animationDelay: `${(i + 4) * 0.05}s` }}>
            <div style={{ height: 140, background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {farm.image_url ? <img src={farm.image_url} alt={farm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={48} style={{ color: 'var(--primary-green)', opacity: 0.4 }} />}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{farm.name}</h3>
                <div className="flex gap-1">
                  <button className="btn-icon" onClick={() => { setEditFarm(farm); setModalOpen(true); }}><Edit2 size={14} /></button>
                  <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => deleteFarm(farm.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted mb-3"><MapPin size={11} /> {farm.location}</div>
              <div className="flex gap-2 flex-wrap mb-3">{farm.crops.map(c => <span key={c} className="badge badge-green">{c}</span>)}</div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">AI Health Score</span>
                <span className="font-bold" style={{ color: healthColor(farm.health_pct) }}>{farm.health_pct}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${farm.health_pct}%`, background: healthColor(farm.health_pct), borderRadius: 4, transition: 'width 1s ease-out' }} />
              </div>
              <div className="text-xs text-muted mt-3">{farm.size_ha > 0 ? `${farm.size_ha} ha` : 'Size not set'} · {farm.irrigation_type}</div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <FarmModal farm={editFarm} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); loadData(); }} />}
    </div>
  );
}
