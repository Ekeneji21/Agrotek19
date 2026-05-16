import React, { useState } from 'react';
import { Search, ShoppingCart, Star, Package, Filter } from 'lucide-react';

const products = [
  { id: 1, name: 'Azoxystrobin Fungicide', category: 'Chemicals', price: 45, unit: '1L', rating: 4.6, reviews: 42, seller: 'AgroChem Zim', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop' },
  { id: 2, name: 'Hybrid Maize Seed SC513', category: 'Seeds', price: 32, unit: '10kg', rating: 4.8, reviews: 89, seller: 'SeedCo Zimbabwe', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop' },
  { id: 3, name: 'Drip Irrigation Kit', category: 'Equipment', price: 250, unit: 'kit', rating: 4.5, reviews: 31, seller: 'IrriTech Harare', img: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=300&h=300&fit=crop' },
  { id: 4, name: 'NPK Fertilizer 7:14:7', category: 'Fertilizer', price: 28, unit: '50kg', rating: 4.7, reviews: 67, seller: 'ZimFert Ltd', img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&h=300&fit=crop' },
  { id: 5, name: 'Knapsack Sprayer 16L', category: 'Equipment', price: 85, unit: 'unit', rating: 4.3, reviews: 24, seller: 'FarmTools Zim', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=300&fit=crop' },
  { id: 6, name: 'Cotton Seed SZ-75', category: 'Seeds', price: 18, unit: '5kg', rating: 4.4, reviews: 53, seller: 'Cottco Seeds', img: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300&h=300&fit=crop' },
];

const categories = ['All', 'Seeds', 'Chemicals', 'Fertilizer', 'Equipment'];

export function Marketplace() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    (category === 'All' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Marketplace</h1>
          <p className="text-sm text-muted mt-1">Buy agricultural inputs from verified Zimbabwean suppliers.</p>
        </div>
        <button className="btn btn-primary"><ShoppingCart size={16} /> Cart (0)</button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar flex-1" style={{ maxWidth: 400 }}>
          <Search size={16} className="text-muted flex-shrink-0" />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c}
              className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="dashboard-grid">
        {filtered.map((p, i) => (
          <div key={p.id} className="col-span-4 card animate-fade-in p-0 overflow-hidden" style={{ animationDelay: `${i * 0.05}s`, padding: 0 }}>
            <div style={{ height: 180, overflow: 'hidden', background: 'var(--bg-color)' }}>
              <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="p-4">
              <span className="badge badge-green mb-2">{p.category}</span>
              <h3 className="font-bold text-sm mb-1">{p.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted mb-2">
                <Package size={11} /> {p.seller}
              </div>
              <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#eab308' }}>
                <Star size={12} fill="#eab308" /> {p.rating} <span className="text-muted">({p.reviews})</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-extrabold text-primary">${p.price}</span>
                  <span className="text-xs text-muted"> / {p.unit}</span>
                </div>
                <button className="btn btn-primary btn-sm"><ShoppingCart size={14} /> Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
