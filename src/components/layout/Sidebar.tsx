import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  KeyRound,
  FileBarChart,
  UserCheck, 
  Car, 
  Users, 
  ShieldCheck,
  Radio,
  LogOut, 
  User as UserIcon, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = false, 
  isCollapsed = false, 
  onClose,
  onToggleCollapse 
}) => {
  const { user, isAdmin, signOut } = useAuth();

  // On mobile drawer overlay (isOpen === true), never collapse icons/text
  const effectiveCollapsed = isCollapsed && !isOpen;

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${effectiveCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header" style={{ justifyContent: effectiveCollapsed ? 'center' : 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {effectiveCollapsed ? (
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '6px', 
              backgroundColor: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '3px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              <img 
                src="/cropped-skylimo-logo.png" 
                alt="SkyLimo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '38px',
                padding: '3px 8px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                <img 
                  src="/cropped-skylimo-logo.png" 
                  alt="SkyLimo Tourism & Rent Car" 
                  style={{
                    maxHeight: '32px',
                    maxWidth: '140px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop/Tablet Collapse & Expand Toggle */}
        {onToggleCollapse && !isOpen && (
          <button
            type="button"
            className="sidebar-collapse-toggle-btn"
            onClick={onToggleCollapse}
            title={effectiveCollapsed ? "Expand sidebar" : "Collapse to icon-only mode"}
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Mobile Drawer Close Button */}
        {onClose && isOpen && (
          <button
            type="button"
            className="hamburger-btn"
            style={{ color: '#FFF', border: '1px solid #333', display: 'flex' }}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          end
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Dashboard"
        >
          <LayoutDashboard size={18} className="nav-item-icon" />
          {!effectiveCollapsed && <span className="nav-item-label">Dashboard</span>}
        </NavLink>

        <NavLink 
          to="/bookings" 
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Daily Bookings"
        >
          <CalendarDays size={18} className="nav-item-icon" />
          {!effectiveCollapsed && <span className="nav-item-label">Daily Bookings</span>}
        </NavLink>

        <NavLink 
          to="/rentals" 
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Car Rentals"
        >
          <KeyRound size={18} className="nav-item-icon" />
          {!effectiveCollapsed && <span className="nav-item-label">Car Rentals</span>}
        </NavLink>

        <NavLink 
          to="/reports" 
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Trips Report"
        >
          <FileBarChart size={18} className="nav-item-icon" />
          {!effectiveCollapsed && <span className="nav-item-label">Trips Report</span>}
        </NavLink>

        {!effectiveCollapsed ? (
          <div className="sidebar-section-title">
            Management
          </div>
        ) : (
          <div className="sidebar-divider" title="Management" />
        )}

        <NavLink 
          to="/drivers" 
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Drivers"
        >
          <UserCheck size={18} className="nav-item-icon" />
          {!effectiveCollapsed && <span className="nav-item-label">Drivers</span>}
        </NavLink>

        <NavLink 
          to="/vehicles" 
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Vehicles"
        >
          <Car size={18} className="nav-item-icon" />
          {!effectiveCollapsed && <span className="nav-item-label">Vehicles</span>}
        </NavLink>

        {isAdmin && (
          <>
            <NavLink 
              to="/users" 
              onClick={handleNavClick}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title="Staff & Users"
            >
              <Users size={18} className="nav-item-icon" />
              {!effectiveCollapsed && <span className="nav-item-label">Staff & Users</span>}
            </NavLink>

            <NavLink 
              to="/logs" 
              onClick={handleNavClick}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title="Activity Logs"
            >
              <ShieldCheck size={18} className="nav-item-icon" />
              {!effectiveCollapsed && <span className="nav-item-label">Activity Logs</span>}
            </NavLink>

            <NavLink 
              to="/online" 
              onClick={handleNavClick}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title="Online & Active Users"
            >
              <Radio size={18} className="nav-item-icon" color="#10B981" />
              {!effectiveCollapsed && (
                <span className="nav-item-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Online Users</span>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)'
                  }} />
                </span>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer User Info */}
      <div className="sidebar-footer" style={{ justifyContent: effectiveCollapsed ? 'center' : 'space-between', padding: effectiveCollapsed ? '10px 4px' : '14px 16px' }}>
        {!effectiveCollapsed ? (
          <>
            <div className="user-badge">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={14} color="var(--color-primary)" />
                <span className="user-name">{user?.displayName || 'User'}</span>
              </div>
              <span className="user-role-tag">{user?.role === 'admin' ? 'Administrator' : 'Staff Member'}</span>
            </div>

            <button 
              type="button"
              onClick={signOut}
              title="Sign Out"
              style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', display: 'flex' }}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <button 
            type="button"
            onClick={signOut}
            title={`Sign Out (${user?.displayName || 'User'} - ${user?.role || 'staff'})`}
            className="sidebar-mini-logout-btn"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
