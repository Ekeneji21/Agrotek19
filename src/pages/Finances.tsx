import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { transactionsApi } from '../services/api';
import { useToast } from '../components/Toast';

const INCOME_CATEGORIES = ['Crop Sale', 'Livestock Sale', 'Government Subsidy', 'Contract Farming', 'Other Income'];
const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticides/Fungicides', 'Labour', 'Equipment', 'Fuel', 'Irrigation', 'Transport', 'Other Expense'];

const QUICK_INCOME = [
  { label: '🌽 Sold Maize',     category: 'Crop Sale',      desc: 'Sold maize' },
  { label: '🌿 Sold Tobacco',   category: 'Crop Sale',      desc: 'Sold tobacco' },
  { label: '🌻 Sold Soybean',   category: 'Crop Sale',      desc: 'Sold soybean' },
  { label: '🐄 Sold Livestock', category: 'Livestock Sale', desc: 'Livestock sale' },
];

const QUICK_EXPENSE = [
  { label: '🌱 Bought Seeds',     category: 'Seeds',                  desc: 'Seed purchase' },
  { label: '💊 Bought Fertilizer', category: 'Fertilizer',            desc: 'Fertilizer purchase' },
  { label: '🧴 Bought Chemicals', category: 'Pesticides/Fungicides', desc: 'Pesticide/fungicide purchase' },
  { label: '👷 Paid Labour',      category: 'Labour',                 desc: 'Labour costs' },
  { label: '⛽ Fuel',             category: 'Fuel',                   desc: 'Fuel' },
  { label: '🚛 Transport',        category: 'Transport',              desc: 'Transport costs' },
];

interface QuickFormState {
  show: boolean;
  type: 'income' | 'expense';
  category: string;
  desc: string;
  amount: string;
}

export function Finances() {
  const { success, error: showError } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [quickForm, setQuickForm] = useState<QuickFormState>({
    show: false, type: 'income', category: '', desc: '', amount: '',
  });

  const [customForm, setCustomForm] = useState({
    type: 'income' as 'income' | 'expense',
    category: INCOME_CATEGORIES[0],
    amount_usd: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const load = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([transactionsApi.list(), transactionsApi.summary()]);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openQuick = (type: 'income' | 'expense', category: string, desc: string) => {
    setQuickForm({ show: true, type, category, desc, amount: '' });
  };

  const submitQuick = async () => {
    const amt = Number(quickForm.amount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      await transactionsApi.create({
        type: quickForm.type,
        category: quickForm.category,
        amount_usd: amt,
        description: quickForm.desc,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setQuickForm(q => ({ ...q, show: false, amount: '' }));
      success(`${quickForm.type === 'income' ? 'Income' : 'Expense'} of $${amt} recorded`);
      await load();
    } catch (e: any) {
      showError(e.message || 'Failed to save');
    }
    setSubmitting(false);
  };

  const submitCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.amount_usd || Number(customForm.amount_usd) <= 0) return;
    setSubmitting(true);
    try {
      await transactionsApi.create({ ...customForm, amount_usd: Number(customForm.amount_usd) });
      setCustomForm(f => ({ ...f, amount_usd: '', description: '' }));
      setShowCustomForm(false);
      success('Transaction recorded');
      await load();
    } catch (e: any) {
      showError(e.message || 'Failed to save');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await transactionsApi.delete(id);
    success('Transaction deleted');
    await load();
  };

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const total = totalIncome + totalExpense;
  const incomeWidth = total > 0 ? (totalIncome / total) * 100 : 50;
  const fmt = (n: number) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Farm Finances</h1>
          <p className="text-sm text-muted mt-1">Tap to record income or expenses — keep it simple.</p>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && summary && (
        <div className="card mb-4 animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-green)' }}>Income {fmt(totalIncome)}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>Expenses {fmt(totalExpense)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 10, background: '#fee2e2', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${incomeWidth}%`, background: 'var(--primary-green)', borderRadius: 10, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginTop: '1rem' }}>
            {[
              { label: 'Total Income',  value: fmt(totalIncome),       color: 'var(--primary-green)', icon: TrendingUp },
              { label: 'Total Expenses',value: fmt(totalExpense),      color: '#ef4444',              icon: TrendingDown },
              { label: 'Net Profit',    value: fmt(summary.netProfit), color: summary.netProfit >= 0 ? 'var(--primary-green)' : '#ef4444', icon: DollarSign },
              { label: 'This Month',    value: fmt(summary.monthNet),  color: summary.monthNet >= 0  ? 'var(--primary-green)' : '#ef4444', icon: Calendar },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add income */}
      <div className="card mb-3 animate-fade-in">
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.625rem' }}>
          💰 Quick Add Income
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUICK_INCOME.map(q => (
            <button key={q.label} onClick={() => openQuick('income', q.category, q.desc)} style={{
              padding: '0.5rem 1rem', borderRadius: 20, border: '1.5px solid var(--primary-green)',
              background: 'var(--light-green)', color: 'var(--primary-green)', fontWeight: 600,
              fontSize: '0.825rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick-add expense */}
      <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.625rem' }}>
          📤 Quick Add Expense
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUICK_EXPENSE.map(q => (
            <button key={q.label} onClick={() => openQuick('expense', q.category, q.desc)} style={{
              padding: '0.5rem 1rem', borderRadius: 20, border: '1.5px solid #ef4444',
              background: '#fef2f2', color: '#ef4444', fontWeight: 600,
              fontSize: '0.825rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick amount modal */}
      {quickForm.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setQuickForm(q => ({ ...q, show: false }))}>
          <div className="card animate-fade-in" style={{ maxWidth: 340, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>{quickForm.desc}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {quickForm.type === 'income' ? 'How much did you receive?' : 'How much did you spend?'}
            </div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1.25rem' }}>$</span>
              <input
                autoFocus
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={quickForm.amount}
                onChange={e => setQuickForm(q => ({ ...q, amount: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && submitQuick()}
                style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2rem', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: '1.5rem', fontWeight: 700, background: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={() => setQuickForm(q => ({ ...q, show: false }))} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 10, background: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={submitQuick} disabled={submitting || !quickForm.amount} style={{
                flex: 2, padding: '0.75rem', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                background: quickForm.type === 'income' ? 'var(--primary-green)' : '#ef4444', color: '#fff',
                opacity: !quickForm.amount ? 0.5 : 1,
              }}>
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} /> : `Record ${quickForm.type === 'income' ? 'Income' : 'Expense'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom transaction toggle */}
      <div className="mb-4">
        <button onClick={() => setShowCustomForm(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none',
          border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.625rem 1rem',
          cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)',
        }}>
          <Plus size={15} /> Add Custom Transaction {showCustomForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showCustomForm && (
          <div className="card mt-3 animate-fade-in">
            <form onSubmit={submitCustom} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {(['income', 'expense'] as const).map(t => (
                  <button key={t} type="button"
                    style={{ flex: 1, padding: '0.625rem', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer', background: customForm.type === t ? (t === 'income' ? 'var(--primary-green)' : '#ef4444') : 'transparent', color: customForm.type === t ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setCustomForm(f => ({ ...f, type: t, category: t === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }))}>
                    {t === 'income' ? '+ Income' : '− Expense'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                  <select style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.875rem' }}
                    value={customForm.category} onChange={e => setCustomForm(f => ({ ...f, category: e.target.value }))}>
                    {(customForm.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Amount (USD)</label>
                  <input type="number" min="0.01" step="0.01" placeholder="0.00" required
                    value={customForm.amount_usd} onChange={e => setCustomForm(f => ({ ...f, amount_usd: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.875rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                  <input placeholder="What was this for?" required
                    value={customForm.description} onChange={e => setCustomForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.875rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                  <input type="date" required
                    value={customForm.transaction_date} onChange={e => setCustomForm(f => ({ ...f, transaction_date: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.875rem' }} />
                </div>
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '0.75rem', background: 'var(--primary-green)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
                Add Transaction
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', alignItems: 'center' }}>
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.375rem 1rem', borderRadius: 20, border: '1px solid var(--border-color)',
            background: filter === f ? 'var(--primary-green)' : 'var(--card-bg)',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.825rem', cursor: 'pointer', textTransform: 'capitalize',
          }}>{f === 'all' ? 'All' : f === 'income' ? '💰 Income' : '📤 Expenses'}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} records</span>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <DollarSign size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</p>
          <p style={{ fontSize: '0.825rem' }}>Tap a quick button above to record your first entry</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(tx => (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--border-color)', borderLeft: `4px solid ${tx.type === 'income' ? 'var(--primary-green)' : '#ef4444'}` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: tx.type === 'income' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tx.type === 'income' ? <TrendingUp size={16} style={{ color: 'var(--primary-green)' }} /> : <TrendingDown size={16} style={{ color: '#ef4444' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.description}</span>
                  <span style={{ fontWeight: 800, color: tx.type === 'income' ? 'var(--primary-green)' : '#ef4444', fontSize: '0.95rem' }}>
                    {tx.type === 'income' ? '+' : '−'}${Number(tx.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: 'var(--light-green)', color: 'var(--primary-green)', fontWeight: 600 }}>{tx.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.transaction_date).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
