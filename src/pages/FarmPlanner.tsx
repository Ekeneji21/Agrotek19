import React, { useState, useEffect } from 'react';
import {
  Sprout, MapPin, Loader2, ChevronRight, AlertTriangle,
  DollarSign, TrendingUp, Calendar, Package, Trash2, BookOpen, MessageCircle, CheckCircle
} from 'lucide-react';
import { plannerApi, transactionsApi } from '../services/api';
import { useToast } from '../components/Toast';

const CROPS = [
  'Tobacco', 'Maize', 'Cotton', 'Soybean', 'Wheat', 'Sorghum', 'Groundnut',
  'Sunflower', 'Sugarcane', 'Tomato', 'Cabbage', 'Onion', 'Potato',
  'Sweet Potato', 'Cassava', 'Cowpea', 'Beans', 'Pepper', 'Barley', 'Millet',
];

const UNITS = ['plants', 'hectares', 'kg (target yield)'];

const DISTRICTS = [
  'Harare', 'Mazowe', 'Marondera', 'Bindura', 'Chinhoyi', 'Chegutu', 'Murewa', 'Wedza',
  'Mutare', 'Chipinge', 'Nyanga',
  'Gweru', 'Kwekwe', 'Kadoma', 'Zvishavane', 'Masvingo', 'Gutu', 'Gokwe',
  'Bulawayo', 'Plumtree', 'Hwange', 'Victoria Falls', 'Kariba',
  'Beitbridge', 'Chiredzi',
];

const PHASE_COLORS = [
  '#16a34a', '#0284c7', '#d97706', '#9333ea', '#dc2626', '#0891b2',
];

function PlanView({ plan, onBack: _onBack, onAddBudget }: { plan: any; onBack: () => void; onAddBudget?: (plan: any) => void }) {
  const whatsappText = encodeURIComponent(
    `Hi, I need advice on my ${plan.crop} crop in ${plan.location}.\n\nMy farm plan:\n- Quantity: ${plan.quantity_summary}\n- Planting window: ${plan.planting_window}\n- Expected yield: ${plan.yield?.expected} ${plan.yield?.unit}\n- Total budget needed: $${plan.costs?.total_usd}\n\nCan you assist?`
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', color: 'white' }}>
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="text-xs mb-1" style={{ opacity: 0.7 }}>AI Farm Plan</div>
            <h2 className="text-2xl font-bold">{plan.crop}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm" style={{ opacity: 0.85 }}>
              <MapPin size={14} /> {plan.location} · Region {plan.region}
            </div>
            <div className="text-sm mt-1" style={{ opacity: 0.85 }}>{plan.quantity_summary}</div>
          </div>
          <div className="text-right">
            <div className="text-xs mb-1" style={{ opacity: 0.7 }}>Season Suitability</div>
            <div className="font-bold text-lg">{plan.season_suitability?.split('—')[0]?.trim()}</div>
            <div className="text-xs mt-1" style={{ opacity: 0.75 }}>{plan.planting_window} → {plan.expected_harvest}</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          <div className="p-3 rounded-md flex-1" style={{ background: 'rgba(0,0,0,0.2)', minWidth: 120 }}>
            <div className="text-xs mb-1" style={{ opacity: 0.7 }}>Total Cost</div>
            <div className="font-bold text-xl">${plan.costs?.total_usd?.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-md flex-1" style={{ background: 'rgba(0,0,0,0.2)', minWidth: 120 }}>
            <div className="text-xs mb-1" style={{ opacity: 0.7 }}>Expected Revenue</div>
            <div className="font-bold text-xl">${plan.yield?.expected_revenue_usd?.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-md flex-1" style={{ background: 'rgba(0,0,0,0.2)', minWidth: 120 }}>
            <div className="text-xs mb-1" style={{ opacity: 0.7 }}>Expected Profit</div>
            <div className="font-bold text-xl" style={{ color: plan.yield?.expected_profit_usd >= 0 ? '#86efac' : '#fca5a5' }}>
              ${plan.yield?.expected_profit_usd?.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-md flex-1" style={{ background: 'rgba(0,0,0,0.2)', minWidth: 120 }}>
            <div className="text-xs mb-1" style={{ opacity: 0.7 }}>Expected Yield</div>
            <div className="font-bold text-xl">{plan.yield?.expected} {plan.yield?.unit}</div>
            <div className="text-xs" style={{ opacity: 0.7 }}>Range: {plan.yield?.min}–{plan.yield?.max}</div>
          </div>
        </div>

        <div className="mt-3 text-sm" style={{ opacity: 0.8 }}>
          <strong>Recommended variety:</strong> {plan.variety_recommendation}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Phase Timeline */}
        <div className="col-span-12 card animate-fade-in">
          <h3 className="card-title mb-4 flex items-center gap-2"><Calendar size={18} /> Crop Calendar — Full Cycle</h3>
          <div className="flex flex-col gap-3">
            {plan.phases?.map((phase: any, i: number) => (
              <div key={i} className="rounded-md overflow-hidden" style={{ border: `1px solid ${PHASE_COLORS[i % PHASE_COLORS.length]}30` }}>
                <div className="flex items-center gap-3 px-4 py-2" style={{ background: `${PHASE_COLORS[i % PHASE_COLORS.length]}15` }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: PHASE_COLORS[i % PHASE_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold">{phase.name}</span>
                    <span className="text-xs text-muted ml-2">· {phase.timeline} · {phase.duration}</span>
                  </div>
                  {phase.warning && <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />}
                </div>
                <div className="px-4 py-3">
                  <ul className="flex flex-col gap-1">
                    {phase.tasks?.map((task: string, j: number) => (
                      <li key={j} className="text-sm flex items-start gap-2">
                        <ChevronRight size={14} style={{ color: PHASE_COLORS[i % PHASE_COLORS.length], flexShrink: 0, marginTop: 2 }} />
                        {task}
                      </li>
                    ))}
                  </ul>
                  {phase.warning && (
                    <div className="mt-2 text-xs p-2 rounded" style={{ background: '#fef3c7', color: '#92400e' }}>
                      ⚠ {phase.warning}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inputs Table */}
        <div className="col-span-8 card animate-fade-in">
          <h3 className="card-title mb-4 flex items-center gap-2"><Package size={18} /> Inputs Required</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  {['Input', 'Category', 'Quantity', 'When', 'Cost (USD)', 'Where to Buy'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.inputs?.map((inp: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'var(--bg-color)' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{inp.name}</td>
                    <td style={{ padding: '8px 10px' }}><span className="badge badge-green" style={{ fontSize: 10 }}>{inp.category}</span></td>
                    <td style={{ padding: '8px 10px' }}>{inp.quantity}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 12 }}>{inp.timing}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--primary-green)' }}>${inp.cost_usd}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 12 }}>{inp.local_source}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                  <td colSpan={4} style={{ padding: '10px', fontWeight: 700 }}>Total Inputs</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-green)', fontSize: 15 }}>${plan.costs?.inputs_usd?.toLocaleString()}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '4px 10px', color: 'var(--text-muted)' }}>Labour ({plan.labour?.total_person_days} person-days, peak: {plan.labour?.peak_period})</td>
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>${plan.labour?.estimated_cost_usd?.toLocaleString()}</td>
                  <td />
                </tr>
                <tr style={{ background: 'var(--light-green)' }}>
                  <td colSpan={4} style={{ padding: '10px', fontWeight: 700, fontSize: 15 }}>TOTAL BUDGET</td>
                  <td style={{ padding: '10px', fontWeight: 800, color: 'var(--primary-green)', fontSize: 17 }}>${plan.costs?.total_usd?.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right column: Risks + Tips + Actions */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Yield Summary */}
          <div className="card animate-fade-in">
            <h3 className="card-title mb-3 flex items-center gap-2"><TrendingUp size={16} /> Yield & Return</h3>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: 'Expected yield', value: `${plan.yield?.expected} ${plan.yield?.unit}` },
                { label: 'Yield range', value: `${plan.yield?.min}–${plan.yield?.max} ${plan.yield?.unit}` },
                { label: 'Farm gate price', value: `$${plan.yield?.farmgate_price_usd_per_unit}/${plan.yield?.unit}` },
                { label: 'Expected revenue', value: `$${plan.yield?.expected_revenue_usd?.toLocaleString()}`, bold: true },
                { label: 'Total costs', value: `$${plan.costs?.total_usd?.toLocaleString()}` },
                { label: 'Expected profit', value: `$${plan.yield?.expected_profit_usd?.toLocaleString()}`, bold: true, green: true },
              ].map((row, i) => (
                <div key={i} className="flex justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                  <span className="text-muted">{row.label}</span>
                  <span style={{ fontWeight: row.bold ? 700 : 500, color: row.green ? 'var(--primary-green)' : undefined }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          {plan.risks?.length > 0 && (
            <div className="card animate-fade-in">
              <h3 className="card-title mb-3 flex items-center gap-2"><AlertTriangle size={16} style={{ color: '#d97706' }} /> Risks to Watch</h3>
              <ul className="flex flex-col gap-2">
                {plan.risks.map((r: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span style={{ color: '#d97706', flexShrink: 0 }}>⚠</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {plan.key_tips?.length > 0 && (
            <div className="card animate-fade-in">
              <h3 className="card-title mb-3 flex items-center gap-2"><BookOpen size={16} /> Key Tips</h3>
              <ul className="flex flex-col gap-2">
                {plan.key_tips.map((t: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span style={{ color: 'var(--primary-green)', flexShrink: 0 }}>✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Share with agronomist */}
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank" rel="noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none', justifyContent: 'center' }}
          >
            <MessageCircle size={16} /> Share Plan with Agronomist
          </a>

          {/* Log budget to Finances */}
          {onAddBudget && (
            <button
              className="btn btn-outline w-full"
              style={{ borderColor: 'var(--primary-green)', color: 'var(--primary-green)' }}
              onClick={() => onAddBudget(plan)}
            >
              <DollarSign size={16} /> Log Budget to Finances
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PlannerProps {
  profile?: { crops: string[]; region: string; size: string } | null;
  setActiveTab?: (tab: string) => void;
}

const REGION_TO_DISTRICT: Record<string, string> = {
  'Harare / Mashonaland': 'Harare',
  'Bulawayo / Matabeleland': 'Bulawayo',
  'Mutare / Manicaland': 'Mutare',
  'Gweru / Midlands': 'Gweru',
  'Masvingo': 'Masvingo',
  'Chinhoyi / Mashonaland West': 'Chinhoyi',
  'Bindura / Mashonaland Central': 'Bindura',
};

export function FarmPlanner({ profile, setActiveTab: _setActiveTab }: PlannerProps) {
  const defaultCrop = profile?.crops?.[0] ?? 'Tobacco';
  const defaultDistrict = profile?.region ? (REGION_TO_DISTRICT[profile.region] ?? 'Mazowe') : 'Mazowe';
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ crop: defaultCrop, quantity: '', unit: 'plants', district: defaultDistrict });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [error, setError] = useState('');
  const [budgetLogged, setBudgetLogged] = useState(false);

  useEffect(() => {
    plannerApi.getSaved()
      .then(r => setSavedPlans(r.data))
      .catch(() => {})
      .finally(() => setSavedLoading(false));
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Enter a valid quantity.'); return; }
    setError('');
    setLoading(true);
    setPlan(null);
    try {
      const res = await plannerApi.generate(form);
      setPlan(res.data);
      plannerApi.getSaved().then(r => setSavedPlans(r.data)).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan. Check your GROQ_API_KEY.');
    } finally {
      setLoading(false);
    }
  };

  const loadSaved = async (id: string) => {
    try {
      const res = await plannerApi.getSavedById(id);
      setPlan(res.data);
    } catch {}
  };

  const deleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await plannerApi.deleteSaved(id);
    setSavedPlans(p => p.filter(s => s.id !== id));
    if (plan?.id === id) setPlan(null);
  };

  const generateFromProfile = () => {
    if (!profile) return;
    const profileForm = {
      crop: profile.crops?.[0] ?? defaultCrop,
      quantity: profile.size === 'Under 1 ha' ? '2000' : profile.size === '1–5 ha' ? '10000' : profile.size === '5–20 ha' ? '40000' : '100000',
      unit: 'plants',
      district: defaultDistrict,
    };
    setForm(profileForm);
    // Auto-submit
    if (!profileForm.quantity) return;
    setError('');
    setLoading(true);
    setPlan(null);
    plannerApi.generate(profileForm)
      .then(res => {
        setPlan(res.data);
        plannerApi.getSaved().then(r => setSavedPlans(r.data)).catch(() => {});
      })
      .catch((err: any) => setError(err.message || 'Failed to generate plan.'))
      .finally(() => setLoading(false));
  };

  const handleAddBudget = async (p: any) => {
    if (budgetLogged) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await transactionsApi.create({
        type: 'expense',
        category: 'Seeds',
        amount_usd: p.costs?.total_usd ?? 0,
        description: `Farm plan budget: ${p.crop} in ${p.location}`,
        transaction_date: today,
      });
      setBudgetLogged(true);
      success(`$${p.costs?.total_usd?.toLocaleString()} budget logged to Finances`);
    } catch {
      toastError('Failed to log budget. Please try again.');
    }
  };

  if (plan) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Farm Planner</h1>
            <p className="text-sm text-muted mt-1">AI-generated plan for {plan.crop} in {plan.location}</p>
          </div>
          <div className="flex gap-2">
            {budgetLogged && (
              <span className="badge badge-green" style={{ alignSelf: 'center' }}>
                <CheckCircle size={12} /> Budget Logged
              </span>
            )}
            <button className="btn btn-outline" onClick={() => { setPlan(null); setBudgetLogged(false); }}>← New Plan</button>
          </div>
        </div>
        <PlanView plan={plan} onBack={() => setPlan(null)} onAddBudget={budgetLogged ? undefined : handleAddBudget} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Farm Planner</h1>
          <p className="text-sm text-muted mt-1">Tell the AI what you want to grow — get a complete plan from preparation to harvest.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Form */}
        <div className="col-span-5 card animate-fade-in">
          <h2 className="card-title mb-1">What do you want to grow?</h2>
          <p className="text-xs text-muted mb-4">The AI will calculate everything — inputs, costs, timeline, and expected profit.</p>

          {profile && (
            <button
              type="button"
              className="btn btn-outline w-full mb-2"
              style={{ borderColor: 'var(--primary-green)', color: 'var(--primary-green)', fontWeight: 700 }}
              onClick={generateFromProfile}
              disabled={loading}
            >
              <Sprout size={16} /> Generate from My Profile ({profile.crops?.[0]}, {profile.size})
            </button>
          )}

          <form onSubmit={generate} className="flex flex-col gap-4">
            {error && <p className="text-sm text-danger">{error}</p>}

            <div>
              <label className="form-label">Crop</label>
              <select className="input" value={form.crop} onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 2 }}>
                <label className="form-label">How much?</label>
                <input className="input" type="number" min="1" placeholder="e.g. 1500"
                  value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
              </div>
              <div style={{ flex: 2 }}>
                <label className="form-label">Unit</label>
                <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Your District</label>
              <select className="input" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-2" disabled={loading}>
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> AI is building your plan…</>
                : <><Sprout size={18} /> Generate Farming Plan</>}
            </button>

            {loading && (
              <div className="text-center text-xs text-muted animate-pulse">
                Fetching weather for {form.district} · Calculating inputs · Building crop calendar…
              </div>
            )}
          </form>
        </div>

        {/* How it works */}
        <div className="col-span-7 card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="card-title mb-4">What you'll get</h2>
          <div className="flex flex-col gap-4">
            {[
              { icon: Calendar, color: '#16a34a', title: 'Full Crop Calendar', desc: 'Week-by-week plan from land preparation all the way through harvesting and curing.' },
              { icon: Package, color: '#0284c7', title: 'Complete Inputs List', desc: 'Every seed, fertilizer, chemical, and tool you need — exact quantities and local prices in USD.' },
              { icon: DollarSign, color: '#d97706', title: 'Cost & Profit Estimate', desc: 'Total budget needed, expected yield, farm gate price, and projected profit based on your district.' },
              { icon: AlertTriangle, color: '#dc2626', title: 'Risks & Local Tips', desc: 'Season-specific risks for your agro-ecological region and practical tips from Zimbabwean farming experience.' },
              { icon: MessageCircle, color: '#8b5cf6', title: 'Share with Agronomist', desc: 'One tap to send your plan via WhatsApp to a specialist for review and advice.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-muted mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Plans */}
        {(savedLoading || savedPlans.length > 0) && (
          <div className="col-span-12 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="card-title mb-4">Saved Plans</h2>
            {savedLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-muted" /></div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {savedPlans.map(p => (
                  <div key={p.id} onClick={() => loadSaved(p.id)}
                    className="scan-result-card flex items-center gap-3 cursor-pointer"
                    style={{ flex: '1 1 260px', maxWidth: 340 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sprout size={20} style={{ color: 'var(--primary-green)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{p.crop}</div>
                      <div className="text-xs text-muted">{p.location} · {p.quantity}</div>
                      <div className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <button className="btn-icon" style={{ color: '#ef4444', flexShrink: 0 }} onClick={e => deleteSaved(p.id, e)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
