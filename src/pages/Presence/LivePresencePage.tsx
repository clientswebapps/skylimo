import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Search, 
  RotateCcw, 
  Users, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserPresence, PresenceStatus } from '../../types';
import { PresenceService } from '../../services/presence/presenceService';

export const LivePresencePage: React.FC = () => {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Real-time Firestore presence stream
  useEffect(() => {
    return PresenceService.subscribe(setPresences);
  }, []);

  // Update relative time tickers every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter presences
  const filteredPresences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return presences.filter((p) => {
      if (q) {
        const matches = 
          p.userName?.toLowerCase().includes(q) ||
          p.userEmail?.toLowerCase().includes(q) ||
          p.currentPageName?.toLowerCase().includes(q) ||
          p.currentPath?.toLowerCase().includes(q) ||
          p.browser?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
      if (selectedRole !== 'All' && p.userRole !== selectedRole) return false;
      return true;
    });
  }, [presences, searchQuery, selectedStatus, selectedRole]);

  // Presence KPIs
  const stats = useMemo(() => {
    let online = 0;
    let away = 0;
    let offline = 0;
    presences.forEach((p) => {
      if (p.status === 'online') online++;
      else if (p.status === 'away') away++;
      else offline++;
    });
    return { total: presences.length, online, away, offline };
  }, [presences]);

  const formatLastSeen = (isoString?: string) => {
    if (!isoString) return 'Never';
    const diffSec = Math.floor((currentTime - new Date(isoString).getTime()) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'Mobile') return <Smartphone size={14} color="#6366F1" />;
    if (deviceType === 'Tablet') return <Tablet size={14} color="#8B5CF6" />;
    return <Monitor size={14} color="#3B82F6" />;
  };

  const getStatusBadge = (status: PresenceStatus) => {
    if (status === 'online') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: '12px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          fontSize: '11px',
          fontWeight: 800
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)',
            animation: 'pulse 2s infinite'
          }} />
          Online (Active)
        </span>
      );
    }
    if (status === 'away') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: '12px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          fontSize: '11px',
          fontWeight: 700
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#F59E0B'
          }} />
          Away (Idle)
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '12px',
        backgroundColor: '#F3F4F6',
        border: '1px solid #E5E7EB',
        color: '#6B7280',
        fontSize: '11px',
        fontWeight: 600
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#9CA3AF'
        }} />
        Offline
      </span>
    );
  };

  const getPageBadge = (path: string, pageName: string) => {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: '#F0F9FF',
        border: '1px solid #BAE6FD',
        color: '#0369A1',
        fontSize: '11.5px',
        fontWeight: 700
      }}>
        <Globe size={12} color="#0284C7" />
        {pageName}
        <span style={{ fontSize: '10px', color: '#0284C7', opacity: 0.8, fontWeight: 500 }}>({path})</span>
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* 1. Header Toolbar */}
      <div className="page-toolbar">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="#10B981" />
            <h2 className="page-title">Live Online Users & Presence</h2>
          </div>
          <span className="page-title-badge" style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
            🟢 {stats.online} ONLINE NOW
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10B981', fontWeight: 700, backgroundColor: '#F0FDF4', padding: '4px 10px', borderRadius: '20px', border: '1px solid #BBF7D0' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
            Real-time Cloud Sync
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={18} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Online</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>{stats.online}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={18} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Away / Idle</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#D97706' }}>{stats.away}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} color="#4B5563" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tracked Accounts</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} color="#1E40AF" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Heartbeat Status</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E40AF' }}>Every 30s</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bookings-filter-bar" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              placeholder="Search user, email, or page..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '11px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-select"
              style={{ width: '100%', height: '32px', fontSize: '11px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="online">🟢 Online Only</option>
              <option value="away">🟡 Away / Idle Only</option>
              <option value="offline">⚪ Offline Only</option>
            </select>
          </div>

          <div>
            <select
              className="form-select"
              style={{ width: '100%', height: '32px', fontSize: '11px' }}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="staff">Staff Only</option>
              <option value="admin">Administrators Only</option>
            </select>
          </div>

          {(searchQuery || selectedStatus !== 'All' || selectedRole !== 'All') && (
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('All');
                  setSelectedRole('All');
                }}
                style={{ width: '100%', height: '32px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Real-time Presence Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>User & Role</th>
              <th style={{ width: '150px' }}>Status</th>
              <th>Current Page / Screen</th>
              <th style={{ width: '180px' }}>Device & Platform</th>
              <th style={{ width: '130px' }}>Last Activity</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Audit</th>
            </tr>
          </thead>
          <tbody>
            {filteredPresences.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>No User Presence Records Found</div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>Users will automatically appear here once they log in and navigate the app.</div>
                </td>
              </tr>
            ) : (
              filteredPresences.map((p) => (
                <tr key={p.id} style={{ backgroundColor: p.status === 'online' ? '#F0FDF4' : '#FFFFFF' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: p.userRole === 'admin' ? '#FEE2E2' : '#EFF6FF',
                        color: p.userRole === 'admin' ? '#991B1B' : '#1E40AF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '12px',
                        position: 'relative'
                      }}>
                        {p.userName ? p.userName.substring(0, 2).toUpperCase() : 'US'}
                        <span style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: p.status === 'online' ? '#10B981' : (p.status === 'away' ? '#F59E0B' : '#9CA3AF'),
                          border: '2px solid #FFFFFF'
                        }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '12px', color: '#111' }}>
                            {p.userName}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '2px',
                            backgroundColor: p.userRole === 'admin' ? '#FEE2E2' : '#EFF6FF',
                            color: p.userRole === 'admin' ? '#991B1B' : '#1E40AF'
                          }}>
                            {p.userRole?.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                          {p.userEmail}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{getStatusBadge(p.status)}</td>

                  <td>
                    {getPageBadge(p.currentPath || '/', p.currentPageName || 'Dashboard')}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#374151' }}>
                      {getDeviceIcon(p.deviceType)}
                      <span style={{ fontWeight: 600 }}>{p.deviceType || 'Desktop'}</span>
                      <span style={{ color: '#9CA3AF', fontSize: '10px' }}>•</span>
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>{p.browser || 'Web'}</span>
                    </div>
                  </td>

                  <td style={{ fontSize: '11px', fontWeight: 600, color: p.status === 'online' ? '#059669' : '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} color={p.status === 'online' ? '#10B981' : '#9CA3AF'} />
                      {formatLastSeen(p.lastSeen)}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <Link
                      to="/logs"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 7px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      title={`View logs for ${p.userName}`}
                    >
                      <span>Logs</span>
                      <ArrowRight size={10} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
