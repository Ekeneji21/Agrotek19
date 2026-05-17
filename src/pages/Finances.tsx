import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { transactionsApi, farmsApi } from '../services/api';

const INCOME_CATEGORIES = ['Crop Sale', 'Livestock Sale', 'Government Subsidy', 'Contract Farming', 'Other Income'];
const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticides/Fungicides', 'Labour', 'Equipment', 'Fuel', 'Irrigation', 'Transport', 'Other Expense'];

export function Finances() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    category: INCOME_CATEGORIES[0],
    amount_usd: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    farm_id: '',
  });

  const load = async () => {
    try {
      const [txRes, sumRes, farmRes] = await Promise.all([
        transactionsApi.list(),
        transactionsApi.summary(),
        farmsApi.list(),
      ]);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setFarms(farmRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTypeChange = (type: 'income' | 'expense') => {
    setForm(f => ({ ...f, type, category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount_usd || Number(form.amount_usd) <= 0) return;
    setSubmitting(true);
    try {
      await transactionsApi.create({ ...form, amount_usd: Number(form.amount_usd), farm_id: form.farm_id || undefined });
      setForm(f => ({ ...f, amount_usd: '', description: '' }));
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await transactionsApi.delete(id);
    await load();
  };

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const summaryCards = summary ? [
    { label: 'Total Income', value: fmt(summary.totalIncome), color: 'var(--primary-green)', icon: TrendingUp, positive: true },
    { label: 'Total Expenses', value: fmt(summary.totalExpense), color: '#ef4444', icon: TrendingDown, positive: false },
    { label: 'Net Profit', value: fmt(summary.netProfit), color: summary.netProfit >= 0 ? 'var(--primary-green)' : '#ef4444', icon: DollarSign, positive: summary.netProfit >= 0 },
    { label: 'This Month Net', value: fmt(summary.monthNet), color: summary.monthNet >= 0 ? 'var(--primary-green)' : '#ef4444', icon: Calendar, positive: summary.monthNet >= 0 },
  ] : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Farm Finances</h1>
          <p className="text-sm text-muted mt-1">Track your income and expenses across all farms.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Summary Cards */}
        {loading ? (
          <div className="col-span-12 flex justify-center py-8"><Loader2 size={28} className="animate-spin text-muted" /></div>
        ) : summaryCards.map((s, i) => (
          <div key={i} className="col-span-3 card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted mb-1">{s.label}</div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}

        {/* Add Transaction */}
        <div className="col-span-4 card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="card-title mb-4">Record Transaction</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Income / Expense toggle */}
            <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {(['income', 'expense'] as const).map(t => (
                <button key={t} type="button"
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: form.type === t ? (t === 'income' ? 'var(--primary-green)' : '#ef4444') : 'transparent',
                    color: form.type === t ? 'white' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer',
                  }}
                  onClick={() => handleTypeChange(t)}
                >
                  {t === 'income' ? '+ Income' : '− Expense'}
                </button>
              ))}
            </div>

            <div>
              <label className="form-label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Amount (USD) *</label>
              <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount_usd} onChange={e => setForm(f => ({ ...f, amount_usd: e.target.value }))} required />
            </div>

            <div>
              <label className="form-label">Description *</label>
              <input className="input" placeholder="e.g. Sold 3 tonnes of maize"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>

            <div>
              <label className="form-label">Date *</label>
              <input className="input" type="date" value={form.transaction_date}
                onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} required />
            </div>

            {farms.length > 0 && (
              <div>
                <label className="form-label">Farm (optional)</label>
                <select className="input" value={form.farm_id} onChange={e => setForm(f => ({ ...f, farm_id: e.target.value }))}>
                  <option value="">— All farms —</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-1" disabled={submitting}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Plus size={14} /> Add Transaction</>}
            </button>
          </form>
        </div>

        {/* Transaction List */}
        <div className="col-span-8 card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h2 className="card-title mb-4">Transaction History</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <DollarSign size={40} />
              <h3>No transactions yet</h3>
              <p>Record your first income or expense to start tracking your farm finances.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-md" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: tx.type === 'income' ? '#dcfce7' : '#fee2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tx.type === 'income'
                      ? <TrendingUp size={16} style={{ color: 'var(--primary-green)' }} />
                      : <TrendingDown size={16} style={{ color: '#ef4444' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm truncate">{tx.description}</span>
                      <span className="font-bold ml-2 shrink-0" style={{ color: tx.type === 'income' ? 'var(--primary-green)' : '#ef4444' }}>
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount_usd)}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-muted">
                      <span className="badge badge-green" style={{ fontSize: 10 }}>{tx.category}</span>
                      {tx.farm_name && <span>· {tx.farm_name}</span>}
                      <span>· {new Date(tx.transaction_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn-icon" style={{ color: '#ef4444', flexShrink: 0 }} onClick={() => handleDelete(tx.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
