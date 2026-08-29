import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

const COLLAPSED_STORAGE_KEY = 'skylimo_sidebar_collapsed';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // On resize to large screens, close mobile drawer if open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Backdrop on mobile when sidebar drawer is open */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeSidebar} 
          aria-label="Close sidebar overlay"
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        isCollapsed={isCollapsed}
        onClose={closeSidebar}
        onToggleCollapse={toggleCollapse}
      />

      <div className="main-wrapper">
        {/* Proper Non-Floating Mobile Header (visible only on mobile <768px) */}
        <header className="mobile-top-header">
          <div className="mobile-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              height: '30px',
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <img 
                src="/cropped-skylimo-logo.png" 
                alt="SkyLimo" 
                style={{ maxHeight: '26px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <span className="mobile-brand-title">Operations</span>
          </div>

          <button 
            type="button" 
            className="mobile-header-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            title="Navigation Menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
