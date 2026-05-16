import React from 'react';
import { 
  LayoutDashboard, Tractor, Activity, CloudSun, 
  AlertTriangle, BookOpen, Store, Settings, X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-farms', label: 'My Farms', icon: Tractor },
  { id: 'disease-detection', label: 'Disease Detection', icon: Activity, badge: 'AI' },
  { id: 'weather-intel', label: 'Weather Intel', icon: CloudSun },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badgeCount: 3 },
];

const secondaryNav = [
  { id: 'advisory', label: 'Advisory', icon: BookOpen },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const handleClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <svg className="logo-icon" viewBox="0 0 38 38">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4caf50"/>
                <stop offset="100%" stopColor="#2e7d32"/>
              </linearGradient>
            </defs>
            <circle cx="19" cy="19" r="18" fill="url(#logoGrad)"/>
            <path d="M19 7c-2.5 5-7.5 7-7.5 12.5a7.5 7.5 0 0015 0C26.5 14 21.5 12 19 7z" fill="#fff" opacity="0.92"/>
            <path d="M19 12c-1.2 2.5-3.5 3.5-3.5 6a3.5 3.5 0 007 0c0-2.5-2.3-3.5-3.5-6z" fill="#66bb6a"/>
          </svg>
          <div className="logo-text">
            AgriSense
            <span>Zimbabwe</span>
          </div>

          {/* Close button for mobile */}
          <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ display: 'none', marginLeft: 'auto' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col flex-1">
          <div className="nav-section-label">Main</div>
          {mainNav.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleClick(item.id)}
            >
              <item.icon size={19} />
              {item.label}
              {item.badge && (
                <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>{item.badge}</span>
              )}
              {item.badgeCount && (
                <span className="nav-badge">{item.badgeCount}</span>
              )}
            </div>
          ))}

          <div className="nav-section-label">Services</div>
          {secondaryNav.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleClick(item.id)}
            >
              <item.icon size={19} />
              {item.label}
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <div className="nav-section-label">Account</div>
          <div
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleClick('settings')}
          >
            <Settings size={19} />
            Account Settings
          </div>
        </nav>
      </aside>
    </>
  );
}
