import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Calendar, Menu, X } from 'lucide-react';
import { formatDateDisplay, getTodayYMD } from '../../utils/dateUtils';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen = false }) => {
  const [quickSearch, setQuickSearch] = useState('');
  const navigate = useNavigate();
  const todayStr = getTodayYMD();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/bookings?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {onToggleSidebar && (
          <button 
            type="button"
            className="hamburger-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            title="Menu"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="header-search">
          <Search size={15} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search customer, invoice, flight, driver, car..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
          />
        </form>
      </div>

      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: '#F5F5F5', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
          <Calendar size={14} color="var(--color-primary)" />
          <span>Today: {formatDateDisplay(todayStr)}</span>
          <Clock size={13} style={{ marginLeft: '4px' }} />
        </div>
      </div>
    </header>
  );
};
