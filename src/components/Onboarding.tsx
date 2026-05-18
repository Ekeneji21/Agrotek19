import { useState } from 'react';
import { Leaf, MapPin, Sprout, ChevronRight, Check } from 'lucide-react';

const CROPS = ['Maize', 'Tobacco', 'Cotton', 'Soybean', 'Groundnut', 'Sorghum', 'Wheat', 'Tomato', 'Cabbage', 'Onion', 'Potato', 'Beans', 'Sweet Potato', 'Sunflower', 'Pepper'];
const REGIONS = ['Harare / Mashonaland', 'Bulawayo / Matabeleland', 'Mutare / Manicaland', 'Gweru / Midlands', 'Masvingo', 'Chinhoyi / Mashonaland West', 'Bindura / Mashonaland Central'];
const SIZES = ['< 1 hectare', '1–5 hectares', '5–20 hectares', '20–100 hectares', '100+ hectares'];

interface Profile { crops: string[]; region: string; size: string; }

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({ crops: [], region: '', size: '' });

  const toggleCrop = (c: string) =>
    setProfile(p => ({ ...p, crops: p.crops.includes(c) ? p.crops.filter(x => x !== c) : [...p.crops, c] }));

  const finish = () => {
    localStorage.setItem('agrisense_profile', JSON.stringify(profile));
    onDone(profile);
  };

  const steps = [
    {
      icon: Sprout,
      title: 'What crops do you grow?',
      subtitle: 'Select all that apply — we\'ll personalise alerts and advice for you.',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CROPS.map(c => (
            <button key={c} onClick={() => toggleCrop(c)} style={{
              padding: '0.5rem 1rem', borderRadius: 20, fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500,
              border: `1.5px solid ${profile.crops.includes(c) ? 'var(--primary-green)' : 'var(--border-color)'}`,
              background: profile.crops.includes(c) ? 'var(--light-green)' : 'var(--card-bg)',
              color: profile.crops.includes(c) ? 'var(--primary-green)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {profile.crops.includes(c) && <Check size={12} style={{ display: 'inline', marginRight: 4 }} />}
              {c}
            </button>
          ))}
        </div>
      ),
      canNext: profile.crops.length > 0,
    },
    {
      icon: MapPin,
      title: 'Where is your farm?',
      subtitle: 'We use your region for weather forecasts and local market prices.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setProfile(p => ({ ...p, region: r }))} style={{
              padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500,
              border: `1.5px solid ${profile.region === r ? 'var(--primary-green)' : 'var(--border-color)'}`,
              background: profile.region === r ? 'var(--light-green)' : 'var(--card-bg)',
              color: profile.region === r ? 'var(--primary-green)' : 'var(--text-secondary)',
              textAlign: 'left', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {r}
              {profile.region === r && <Check size={16} />}
            </button>
          ))}
        </div>
      ),
      canNext: !!profile.region,
    },
    {
      icon: Leaf,
      title: 'How large is your farm?',
      subtitle: 'This helps us tailor fertilizer quantities and cost estimates.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {SIZES.map(s => (
            <button key={s} onClick={() => setProfile(p => ({ ...p, size: s }))} style={{
              padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500,
              border: `1.5px solid ${profile.size === s ? 'var(--primary-green)' : 'var(--border-color)'}`,
              background: profile.size === s ? 'var(--light-green)' : 'var(--card-bg)',
              color: profile.size === s ? 'var(--primary-green)' : 'var(--text-secondary)',
              textAlign: 'left', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {s}
              {profile.size === s && <Check size={16} />}
            </button>
          ))}
        </div>
      ),
      canNext: !!profile.size,
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 16, padding: '2rem',
        width: '100%', maxWidth: 540, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? 'var(--primary-green)' : 'var(--border-color)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} style={{ color: 'var(--primary-green)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 2 }}>{current.title}</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{current.subtitle}</p>
          </div>
        </div>

        <div style={{ margin: '1.25rem 0', maxHeight: 320, overflowY: 'auto' }}>
          {current.content}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <button onClick={() => step > 0 && setStep(s => s - 1)} style={{
            background: 'none', border: 'none', cursor: step > 0 ? 'pointer' : 'default',
            color: step > 0 ? 'var(--text-secondary)' : 'transparent', fontSize: '0.875rem', fontWeight: 500,
          }}>← Back</button>

          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!current.canNext} style={{
              padding: '0.75rem 1.5rem', background: current.canNext ? 'var(--primary-green)' : 'var(--border-color)',
              color: '#fff', border: 'none', borderRadius: 10, cursor: current.canNext ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={finish} disabled={!current.canNext} style={{
              padding: '0.75rem 1.5rem', background: current.canNext ? 'var(--primary-green)' : 'var(--border-color)',
              color: '#fff', border: 'none', borderRadius: 10, cursor: current.canNext ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              Let's Go! 🌱
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
