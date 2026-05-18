import { useEffect, useState, useRef } from 'react';
import { Search, Bell, Menu, Moon, Sun, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Header({ toggleSidebar, isDarkMode, toggleDarkMode }: HeaderProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={22} />
        </button>
        <div className="search-bar">
          <Search size={16} className="text-muted flex-shrink-0" />
          <input type="text" placeholder="Search crops, diseases, markets…" />
        </div>
      </div>

      <div className="header-actions">
        <button className="btn-icon" onClick={toggleDarkMode} title={isDarkMode ? 'Light mode' : 'Dark mode'}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="btn-icon relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* User dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
            onClick={() => setDropdownOpen(v => !v)}
          >
            <div className="user-avatar-initials">{initials}</div>
            <div className="header-user-info">
              <span className="header-user-name">{user?.name?.split(' ')[0] ?? 'Farmer'}</span>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="font-semibold text-sm">{user?.name}</div>
                <div className="text-xs text-muted">{user?.email}</div>
                {user?.location && <div className="text-xs text-muted">{user.location}</div>}
              </div>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item">
                <User size={14} /> Profile
              </button>
              <button className="user-dropdown-item">
                <Settings size={14} /> Settings
              </button>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item user-dropdown-danger" onClick={logout}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
