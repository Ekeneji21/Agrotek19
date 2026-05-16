import React, { useEffect } from 'react';
import { Search, Bell, Menu, Moon, Sun, ChevronDown } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Header({ toggleSidebar, isDarkMode, toggleDarkMode }: HeaderProps) {
  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={22} />
        </button>
        <div className="search-bar">
          <Search size={16} className="text-muted flex-shrink-0" />
          <input type="text" placeholder="Search crops, diseases, markets..." />
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn-icon"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="btn-icon relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="flex items-center gap-2" style={{ cursor: 'pointer', marginLeft: '0.25rem' }}>
          <img
            src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
            alt="User profile"
            className="avatar"
          />
          <ChevronDown size={14} className="text-muted" />
        </div>
      </div>
    </header>
  );
}
