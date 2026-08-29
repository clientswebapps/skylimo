import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { PresenceService } from '../../services/presence/presenceService';

const COLLAPSED_STORAGE_KEY = 'skylimo_sidebar_collapsed';

export const AppShell: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const lastActivityRef = useRef<number>(Date.now());

  // Real-time presence heartbeat & route location updater
  useEffect(() => {
    if (!user) return;

    // 1. Immediate presence ping on route change
    PresenceService.updatePresence(user, location.pathname, false);

    // 2. Track user activity (mouse / keypress) to detect idle/away state
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    // 3. Heartbeat interval every 30 seconds
    const interval = setInterval(() => {
      const isIdle = Date.now() - lastActivityRef.current > 4 * 60 * 1000; // 4 minutes idle
      PresenceService.updatePresence(user, location.pathname, isIdle);
    }, 30000);

    // 4. Set offline on tab close / unload
    const handleUnload = () => {
      PresenceService.setOffline(user);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user, location.pathname]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              type="button" 
              className="mobile-header-menu-btn"
              onClick={toggleSidebar}
              aria-label="Toggle navigation menu"
              title="Navigation Menu"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

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
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
