import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  RotateCcw, 
  Activity, 
  User, 
  CalendarDays, 
  KeyRound, 
  Car, 
  UserCheck, 
  Lock, 
  Trash2, 
  PlusCircle, 
  Edit3, 
  CheckCircle2, 
  Clock,
  X 
} from 'lucide-react';
import type { ActivityLog, ActivityActionType, ActivityModule } from '../../types';
import { ActivityService } from '../../services/activity/activityService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ActivityLogsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [selectedAction, setSelectedAction] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    return ActivityService.subscribe(setLogs);
  }, []);

  const handleConfirmClearAllLogs = async () => {
    if (!isAdmin) {
      showToast('Action restricted: Only Administrators can clear activity logs.', 'error');
      return;
    }
    setIsClearing(true);
    try {
      await ActivityService.clearAllLogs(user);
      showToast('All activity logs have been cleared and reset successfully.', 'success');
      setIsClearConfirmOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to clear activity logs', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  // Distinct user options for filtering
  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => {
      if (l.userEmail) {
        map.set(l.userEmail, l.userName ? `${l.userName} (${l.userEmail})` : l.userEmail);
      }
    });
    return Array.from(map.entries());
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return logs.filter((log) => {
      // 1. Search Query
      if (query) {
        const matchesQuery = 
          log.description.toLowerCase().includes(query) ||
          log.userName?.toLowerCase().includes(query) ||
          log.userEmail?.toLowerCase().includes(query) ||
          log.module.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // 2. User Filter
      if (selectedUser !== 'All' && log.userEmail !== selectedUser && log.userId !== selectedUser) {
        return false;
      }

      // 3. Module Filter
      if (selectedModule !== 'All' && log.module !== selectedModule) {
        return false;
      }

      // 4. Action Filter
      if (selectedAction !== 'All' && log.action !== selectedAction) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'all') {
        const logDateStr = log.timestamp ? log.timestamp.split('T')[0] : '';
        if (dateFilter === 'today' && logDateStr !== todayStr) {
          return false;
        }
        if (dateFilter === 'week') {
          const logDate = new Date(log.timestamp);
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        }
        if (dateFilter === 'month') {
          const logDate = new Date(log.timestamp);
          if (logDate.getMonth() !== now.getMonth() || logDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedUser, selectedModule, selectedAction, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let security = 0;

    logs.forEach((l) => {
      if (l.action === 'create') creates++;
      else if (l.action === 'update' || l.action === 'status_change') updates++;
      else if (l.action === 'delete') deletes++;
      else if (l.action === 'login' || l.module === 'auth' || l.module === 'users') security++;
    });

    return {
      total: logs.length,
      creates,
      updates,
      deletes,
      security
    };
  }, [logs]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedUser('All');
    setSelectedModule('All');
    setSelectedAction('All');
    setDateFilter('all');
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No activity logs to export', 'info');
      return;
    }

    const lines: string[] = [];
    lines.push('SKYLIMO SYSTEM ACTIVITY AUDIT LOG');
    lines.push('');
    lines.push('TIMESTAMP,USER NAME,USER EMAIL,ROLE,MODULE,ACTION,DESCRIPTION');
    filteredLogs.forEach((l) => {
      lines.push([
        `"${new Date(l.timestamp).toLocaleString()}"`,
        `"${l.userName || 'Admin'}"`,
        `"${l.userEmail || ''}"`,
        `"${l.userRole || 'admin'}"`,
        `"${l.module}"`,
        `"${l.action}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`
      ].join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKYLIMO_ACTIVITY_LOGS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Activity logs exported to CSV', 'success');
  };

  // Helper formatting
  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (_) {
      return ts;
    }
  };

  const getModuleIcon = (mod: ActivityModule) => {
    switch (mod) {
      case 'bookings': return <CalendarDays size={13} color="var(--color-primary)" />;
      case 'rentals': return <KeyRound size={13} color="#059669" />;
      case 'drivers': return <UserCheck size={13} color="#D97706" />;
      case 'vehicles': return <Car size={13} color="#2563EB" />;
      case 'users': return <User size={13} color="#7C3AED" />;
      case 'auth': return <Lock size={13} color="#DC2626" />;
      default: return <Activity size={13} color="#4B5563" />;
    }
  };

  const getActionBadge = (action: ActivityActionType) => {
    switch (action) {
      case 'create':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
            <PlusCircle size={10} /> CREATE
          </span>
        );
      case 'update':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
            <Edit3 size={10} /> UPDATE
          </span>
        );
      case 'delete':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
            <Trash2 size={10} /> DELETE
          </span>
        );
      case 'status_change':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, backgroundColor: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
            <CheckCircle2 size={10} /> STATUS
          </span>
        );
      case 'login':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
            <Lock size={10} /> LOGIN
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
            {action.toUpperCase()}
          </span>
        );
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedUser !== 'All' || selectedModule !== 'All' || selectedAction !== 'All' || dateFilter !== 'all';

  return (
    <div className="page-container">
      {/* 1. Top Header */}
      <div className="page-toolbar">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--color-primary)" />
            <h2 className="page-title">Activity & Audit Logs</h2>
          </div>
          <span className="page-title-badge">
            {hasActiveFilters ? `${filteredLogs.length} MATCHING` : `${logs.length} TOTAL LOGS`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export Logs CSV">
            <Download size={13} />
            <span className="hide-mobile">Export CSV</span>
          </button>

          {isAdmin && (
            <button 
              type="button" 
              className="btn btn-danger btn-sm" 
              onClick={() => setIsClearConfirmOpen(true)}
              disabled={logs.length === 0 || isClearing}
              title="Clear all activity logs (Admin only)"
              style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Trash2 size={13} />
              <span>Clear All Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="#111" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Events</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#111' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={18} color="#065F46" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Created Records</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#065F46' }}>{stats.creates}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={18} color="#1E40AF" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Updates & Edits</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E40AF' }}>{stats.updates}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={18} color="#991B1B" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deletions</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#991B1B' }}>{stats.deletes}</div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="bookings-filter-bar" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 1' }}>
            <Search size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              placeholder="Search description, customer, user..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '11px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* User Filter */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%', height: '32px', fontSize: '11px' }}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="All">All Users & Admins</option>
              {userOptions.map(([email, label]) => (
                <option key={email} value={email}>{label}</option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%', height: '32px', fontSize: '11px' }}
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="All">All Modules</option>
              <option value="bookings">Daily Bookings</option>
              <option value="rentals">Car Rentals</option>
              <option value="drivers">Drivers</option>
              <option value="vehicles">Vehicles</option>
              <option value="users">Staff & Users</option>
              <option value="auth">Auth & Security</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%', height: '32px', fontSize: '11px' }}
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="All">All Action Types</option>
              <option value="create">Creates</option>
              <option value="update">Updates / Edits</option>
              <option value="delete">Deletions</option>
              <option value="status_change">Status Changes</option>
              <option value="login">Logins</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%', height: '32px', fontSize: '11px' }}
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
                style={{ width: '100%', height: '32px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Activity Logs Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '170px' }}>Date & Timestamp</th>
              <th style={{ width: '180px' }}>User / Performed By</th>
              <th style={{ width: '110px' }}>Action</th>
              <th style={{ width: '120px' }}>Module</th>
              <th>Activity Description & Context</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  <Activity size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>No Activity Records Found</div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>Try adjusting your filters or search query.</div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#374151' }}>
                      <Clock size={12} color="var(--color-primary)" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#111' }}>
                          {log.userName || 'User'}
                        </span>
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          padding: '1px 5px', 
                          borderRadius: '2px', 
                          backgroundColor: log.userRole === 'admin' ? '#FEE2E2' : '#EFF6FF', 
                          color: log.userRole === 'admin' ? '#991B1B' : '#1E40AF' 
                        }}>
                          {log.userRole?.toUpperCase() || 'USER'}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {log.userEmail}
                      </span>
                    </div>
                  </td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>
                      {getModuleIcon(log.module)}
                      {log.module}
                    </span>
                  </td>
                  <td style={{ fontSize: '11.5px', color: '#1F2937', lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 600 }}>{log.description}</div>
                    {log.details?.changes && Array.isArray(log.details.changes) && log.details.changes.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {log.details.changes.map((ch: any, idx: number) => (
                          <div 
                            key={idx} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#475569' }}>{ch.label || ch.field}:</span>
                            <span style={{ textDecoration: 'line-through', color: '#EF4444', opacity: 0.85 }}>{ch.oldVal || '(empty)'}</span>
                            <span style={{ color: '#059669', fontWeight: 800 }}>➔</span>
                            <span style={{ color: '#059669', fontWeight: 700 }}>{ch.newVal || '(empty)'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Clear All Logs Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="modal-backdrop" onClick={() => !isClearing && setIsClearConfirmOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)' }}>
                <Trash2 size={16} />
                Clear All Activity Logs
              </h2>
              <button 
                type="button" 
                onClick={() => !isClearing && setIsClearConfirmOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                disabled={isClearing}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete all <b>{logs.length}</b> activity log records from both the app and the cloud database?
              </p>
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '4px', padding: '10px', fontSize: '11.5px', color: '#991B1B' }}>
                ⚠️ <b>Security Notice:</b> This action is restricted to Administrators only and will permanently reset the system activity audit trail.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setIsClearConfirmOpen(false)}
                disabled={isClearing}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm" 
                onClick={handleConfirmClearAllLogs}
                disabled={isClearing}
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isClearing ? 'Clearing Logs...' : 'Yes, Delete All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
