import { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Star, Package, Loader2, X, Plus, Minus, CheckCircle } from 'lucide-react';
import { marketplaceApi } from '../services/api';

interface CartItem { id: string; name: string; price_usd: number; unit: string; qty: number; }

export function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.listProducts(category, search || undefined);
      setProducts(res.data);
    } catch {/* handled */}
    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    marketplaceApi.getCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price_usd: p.price_usd, unit: p.unit, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price_usd, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      await marketplaceApi.createOrder({
        items: cart.map(i => ({ productId: i.id, quantity: i.qty, priceUsd: i.price_usd }))
      });
      setCart([]);
      setOrdered(true);
    } catch (err: any) {
      alert(err.message || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Marketplace</h1>
          <p className="text-sm text-muted mt-1">Buy agricultural inputs from verified Zimbabwean suppliers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setCartOpen(true); setOrdered(false); }}>
          <ShoppingCart size={16} /> Cart ({cartCount})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar flex-1" style={{ maxWidth: 400 }}>
          <Search size={16} className="text-muted flex-shrink-0" />
          <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={36} className="animate-spin text-muted" /></div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <Package size={48} className="text-muted mx-auto mb-3" />
          <p className="text-muted">No products found.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {products.map((p, i) => {
            const inCart = cart.find(c => c.id === p.id);
            return (
              <div key={p.id} className="col-span-4 card animate-fade-in p-0 overflow-hidden" style={{ animationDelay: `${i * 0.05}s`, padding: 0 }}>
                <div style={{ height: 180, overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <Package size={56} className="text-muted" style={{ opacity: 0.3 }} />}
                </div>
                <div className="p-4">
                  <span className="badge badge-green mb-2">{p.category}</span>
                  <h3 className="font-bold text-sm mb-1">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted mb-2"><Package size={11} /> {p.seller}</div>
                  <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#eab308' }}>
                    <Star size={12} fill="#eab308" /> {p.rating} <span className="text-muted">({p.review_count})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-extrabold text-primary">${p.price_usd}</span>
                      <span className="text-xs text-muted"> / {p.unit}</span>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button className="btn-icon" style={{ width: 28, height: 28, borderRadius: 4 }} onClick={() => updateQty(p.id, -1)}><Minus size={12} /></button>
                        <span className="font-bold text-sm">{inCart.qty}</span>
                        <button className="btn-icon btn-primary" style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--primary-green)', color: 'white' }} onClick={() => updateQty(p.id, 1)}><Plus size={12} /></button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => addToCart(p)}><ShoppingCart size={14} /> Add</button>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-2">{p.stock > 0 ? `${p.stock} in stock` : <span className="text-danger">Out of stock</span>}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="modal-overlay" onClick={() => setCartOpen(false)}>
          <div className="modal" style={{ maxWidth: 420, marginLeft: 'auto', marginRight: 0, height: '100vh', maxHeight: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Your Cart</h2>
              <button className="btn-icon" onClick={() => setCartOpen(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
              {ordered ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Order Placed!</h3>
                  <p className="text-sm text-muted">Your order has been submitted successfully.</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted">Your cart is empty.</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center scan-result-card gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-xs text-muted">${item.price_usd} / {item.unit}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn-icon" style={{ width: 26, height: 26, borderRadius: 4 }} onClick={() => updateQty(item.id, -1)}><Minus size={11} /></button>
                        <span className="font-bold">{item.qty}</span>
                        <button className="btn-icon" style={{ width: 26, height: 26, borderRadius: 4 }} onClick={() => updateQty(item.id, 1)}><Plus size={11} /></button>
                      </div>
                      <span className="font-bold text-primary">${(item.qty * item.price_usd).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!ordered && cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 0' }}>
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="font-extrabold text-lg text-primary">${cartTotal.toFixed(2)}</span>
                </div>
                <button className="btn btn-primary btn-lg w-full" disabled={ordering} onClick={placeOrder}>
                  {ordering ? <><Loader2 size={16} className="animate-spin" /> Placing Order…</> : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
