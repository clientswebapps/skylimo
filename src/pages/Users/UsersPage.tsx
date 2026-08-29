import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  User as UserIcon, 
  CheckCircle, 
  XCircle, 
  X, 
  Save, 
  Trash2, 
  Edit, 
  Lock, 
  Mail, 
  ShieldCheck, 
  KeyRound,
  Activity,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppUser, UserRole, ActivityLog } from '../../types';
import { UserService } from '../../services/users/userService';
import { ActivityService } from '../../services/activity/activityService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // User Logs Modal state
  const [isUserLogsModalOpen, setIsUserLogsModalOpen] = useState(false);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<AppUser | null>(null);

  // Delete User Confirmation Modal state
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Add user form state
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addDisplayName, setAddDisplayName] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('staff');

  // Edit user form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [editIsActive, setEditIsActive] = useState(true);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);

  const [saving, setSaving] = useState(false);

  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubUsers = UserService.subscribe(setUsers);
    const unsubLogs = ActivityService.subscribe(setAllLogs);
    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, []);

  const openAddModal = () => {
    setAddEmail('');
    setAddPassword('');
    setAddDisplayName('');
    setAddRole('staff');
    setIsAddModalOpen(true);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditDisplayName(u.displayName || '');
    setEditPassword('');
    setEditRole(u.role);
    setEditIsActive(u.isActive);
    setConfirmDeleteUser(false);
    setIsEditModalOpen(true);
  };

  const openUserLogsModal = (u: AppUser) => {
    setSelectedUserForLogs(u);
    setIsUserLogsModalOpen(true);
  };

  // Robust helper to test if a log belongs to a given user across UIDs, emails, and names
  const doesLogMatchUser = (log: ActivityLog, u: AppUser): boolean => {
    if (!log || !u) return false;
    const userUid = (u.uid || '').trim().toLowerCase();
    const userEmail = (u.email || '').trim().toLowerCase();
    const userDisplayName = (u.displayName || '').trim().toLowerCase();
    const emailPrefix = userEmail.includes('@') ? userEmail.split('@')[0] : userEmail;

    const logUserId = (log.userId || '').trim().toLowerCase();
    const logUserEmail = (log.userEmail || '').trim().toLowerCase();
    const logUserName = (log.userName || '').trim().toLowerCase();
    const logEmailPrefix = logUserEmail.includes('@') ? logUserEmail.split('@')[0] : logUserEmail;

    // 1. Direct UID match
    if (logUserId && userUid && logUserId === userUid) return true;

    // 2. Direct Email match
    if (logUserEmail && userEmail && logUserEmail === userEmail) return true;

    // 3. Match by email prefix (e.g. staff1 == staff1, or usr-staff-1 containing staff1)
    if (emailPrefix && (logUserEmail === userEmail || logEmailPrefix === emailPrefix || logUserId.includes(emailPrefix) || userUid.includes(logEmailPrefix))) return true;

    // 4. Match by Display Name (e.g. "Staff 1" == "Staff 1")
    if (userDisplayName && logUserName && (logUserName === userDisplayName || logUserName.includes(userDisplayName) || userDisplayName.includes(logUserName))) return true;

    return false;
  };

  // Specific user's logs
  const selectedUserLogs = useMemo(() => {
    if (!selectedUserForLogs) return [];
    return allLogs.filter((l) => doesLogMatchUser(l, selectedUserForLogs));
  }, [allLogs, selectedUserForLogs]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }
    if (!addPassword || addPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      const newUser = await UserService.createWithAuth({
        email: addEmail.trim().toLowerCase(),
        password: addPassword,
        displayName: addDisplayName.trim() || addEmail.split('@')[0],
        role: addRole
      });
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase());
        return [...filtered, newUser];
      });

      ActivityService.log({
        action: 'create',
        module: 'users',
        description: `Created new user account ${newUser.email} (${newUser.role.toUpperCase()})`
      });

      showToast(`User ${newUser.displayName} (${newUser.email}) created successfully! They can log in immediately.`, 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error creating user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    try {
      const isSelf = editingUser.uid === currentUser?.uid || editingUser.email.toLowerCase() === currentUser?.email?.toLowerCase();
      const finalRole = isSelf ? editingUser.role : editRole;

      await UserService.updateUser(editingUser.uid, {
        displayName: editDisplayName.trim() || editingUser.email.split('@')[0],
        role: finalRole,
        isActive: isSelf ? true : editIsActive,
        password: editPassword.trim() ? editPassword.trim() : undefined
      });

      ActivityService.log({
        action: 'update',
        module: 'users',
        description: `Updated profile & settings for user ${editingUser.email}${editPassword.trim() ? ' (Password changed)' : ''}`
      });

      showToast(`User ${editDisplayName || editingUser.email} updated successfully`, 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast('Error updating user: ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: AppUser) => {
    const isSelf = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();
    if (isSelf) {
      showToast('You cannot deactivate your own account', 'error');
      return;
    }

    setUsers((prev) => prev.map((usr) => (usr.uid === u.uid ? { ...usr, isActive: !usr.isActive } : usr)));
    await UserService.toggleActive(u.uid, u.isActive);

    ActivityService.log({
      action: 'status_change',
      module: 'users',
      description: `${u.isActive ? 'Deactivated' : 'Activated'} user account ${u.email}`
    });

    showToast(`User ${u.email} is now ${u.isActive ? 'Inactive' : 'Active'}`, 'info');
  };

  const handleRoleChange = async (u: AppUser, newRole: UserRole) => {
    const isSelf = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();
    if (isSelf) {
      showToast('You cannot change your own role', 'error');
      return;
    }

    setUsers((prev) => prev.map((usr) => (usr.uid === u.uid ? { ...usr, role: newRole } : usr)));
    await UserService.updateRole(u.uid, newRole);

    ActivityService.log({
      action: 'update',
      module: 'users',
      description: `Changed role for user ${u.email} to ${newRole.toUpperCase()}`
    });

    showToast(`Role for ${u.displayName || u.email} updated to ${newRole.toUpperCase()}`, 'success');
  };

  const handleModalDeleteUser = async (u: AppUser) => {
    if (!confirmDeleteUser) {
      setConfirmDeleteUser(true);
      return;
    }

    try {
      setUsers((prev) => prev.filter((usr) => usr.uid !== u.uid && usr.email.toLowerCase() !== u.email.toLowerCase()));
      await UserService.delete(u.uid);

      ActivityService.log({
        action: 'delete',
        module: 'users',
        description: `Deleted user account ${u.email} (${u.displayName || 'User'})`
      });

      showToast(`User account ${u.email} deleted successfully`, 'info');
      setIsEditModalOpen(false);
      setConfirmDeleteUser(false);
    } catch (err: any) {
      showToast('Error deleting user: ' + (err.message || ''), 'error');
    }
  };

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

  return (
    <div className="page-container">
      {/* Page Toolbar */}
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">Staff & Users Management</h2>
          <span className="page-title-badge">{users.length} ACCOUNTS</span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>ADD USER</span>
        </button>
      </div>

      {/* Users Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>User Name</th>
              <th style={{ width: '240px' }}>Email Address</th>
              <th style={{ width: '170px' }}>System Role</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '230px', textAlign: 'center' }}>Actions & Audit</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();
              const userActivityCount = allLogs.filter((l) => doesLogMatchUser(l, u)).length;

              return (
                <tr key={u.uid} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={14} color="var(--color-primary)" />
                      <span>{u.displayName}</span>
                      {isSelf && (
                        <span className="page-title-badge" style={{ fontSize: '9px', padding: '1px 5px', background: '#EAEAEA', color: '#333' }}>
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {isSelf ? (
                      <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={13} />
                        Administrator (Self)
                      </span>
                    ) : (
                      <select
                        className="inline-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        style={{ fontWeight: 600 }}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${u.isActive ? 'status-completed' : 'status-cancelled'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {/* View Logs Button */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openUserLogsModal(u)}
                        title={`View Activity History for ${u.displayName || u.email}`}
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Activity size={12} color="var(--color-primary)" />
                        <span>Logs</span>
                        {userActivityCount > 0 && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '0 4px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#111' }}>
                            {userActivityCount}
                          </span>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(u)}
                        title="Edit User Name, Password, or Role"
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>

                      {/* Toggle Active Button */}
                      {!isSelf && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleActive(u)}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          {u.isActive ? (
                            <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <XCircle size={12} /> Deactivate
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle size={12} /> Activate
                            </span>
                          )}
                        </button>
                      )}

                      {/* Delete Button */}
                      {!isSelf && (
                        <button
                          type="button"
                          className="btn-icon"
                          title="Delete User"
                          style={{ color: 'var(--color-danger)', padding: '4px' }}
                          onClick={() => setUserToDelete(u)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. ADD USER MODAL (Email, Password, Name, Role)
          ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} color="var(--color-primary)" />
                Add New User Account
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      autoFocus
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '32px' }}
                      placeholder="e.g. staff2@skylimobh.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                    />
                    <Mail size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Assigned Password * (Min 6 Characters)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '32px' }}
                      placeholder="Enter initial password"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                    />
                    <Lock size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Full Name / Display Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '32px' }}
                      placeholder="e.g. Tariq Al-Mansoor"
                      value={addDisplayName}
                      onChange={(e) => setAddDisplayName(e.target.value)}
                    />
                    <UserIcon size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    System Access Role *
                  </label>
                  <select
                    className="form-select"
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                  >
                    <option value="staff">Staff (Standard Dispatch Operations)</option>
                    <option value="admin">Administrator (Full System & User Management)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Save size={14} />
                  <span>{saving ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EDIT USER MODAL (Edit Name, Role, Password)
          ───────────────────────────────────────────────────────────── */}
      {isEditModalOpen && editingUser && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit size={16} color="var(--color-primary)" />
                Edit User Details
              </h2>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    className="form-input"
                    value={editingUser.email}
                    style={{ backgroundColor: '#F3F4F6', color: '#666' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Full Name / Display Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '32px' }}
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                    />
                    <UserIcon size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Change Password (Leave blank to keep current)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      minLength={6}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '32px' }}
                      placeholder="Enter new password (optional)"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                    <KeyRound size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    System Role
                  </label>
                  {editingUser.uid === currentUser?.uid || editingUser.email.toLowerCase() === currentUser?.email?.toLowerCase() ? (
                    <div style={{ padding: '6px 10px', background: '#F3F4F6', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      Administrator (Cannot change your own role)
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                    >
                      <option value="staff">Staff (Standard Dispatch Access)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  )}
                </div>

                {!(editingUser.uid === currentUser?.uid || editingUser.email.toLowerCase() === currentUser?.email?.toLowerCase()) && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Account Status
                    </label>
                    <select
                      className="form-select"
                      value={editIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    >
                      <option value="active">Active (Can log in)</option>
                      <option value="inactive">Inactive (Access disabled)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {!(editingUser.uid === currentUser?.uid || editingUser.email.toLowerCase() === currentUser?.email?.toLowerCase()) && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        backgroundColor: confirmDeleteUser ? 'var(--color-danger)' : undefined,
                        color: confirmDeleteUser ? '#FFF' : 'var(--color-danger)',
                        borderColor: confirmDeleteUser ? 'var(--color-danger)' : 'var(--color-border)',
                        fontSize: '11px',
                        padding: '6px 12px'
                      }}
                      onClick={() => handleModalDeleteUser(editingUser)}
                    >
                      <Trash2 size={13} />
                      <span>{confirmDeleteUser ? 'Confirm Delete Account?' : 'Delete User'}</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Save size={14} />
                    <span>{saving ? 'Updating...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. USER INDIVIDUAL ACTIVITY LOGS MODAL
          ───────────────────────────────────────────────────────────── */}
      {isUserLogsModalOpen && selectedUserForLogs && (
        <div className="modal-backdrop" onClick={() => setIsUserLogsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--color-primary)" />
                <div>
                  <h2 className="modal-title">
                    Activity Logs: {selectedUserForLogs.displayName || selectedUserForLogs.email}
                  </h2>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
                    {selectedUserForLogs.email} • {selectedUserForLogs.role.toUpperCase()}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setIsUserLogsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px' }}>
              {selectedUserLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                  <Activity size={28} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>No Activity Recorded Yet</div>
                  <div style={{ fontSize: '11px' }}>This user has not performed any recorded operations yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedUserLogs.map((log) => (
                    <div 
                      key={log.id}
                      style={{ 
                        padding: '10px 12px', 
                        backgroundColor: '#F9FAFB', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '9.5px', 
                            fontWeight: 800, 
                            padding: '1px 6px', 
                            borderRadius: '3px', 
                            backgroundColor: log.action === 'create' ? '#D1FAE5' : log.action === 'delete' ? '#FEE2E2' : '#EFF6FF',
                            color: log.action === 'create' ? '#065F46' : log.action === 'delete' ? '#991B1B' : '#1E40AF',
                            textTransform: 'uppercase'
                          }}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'capitalize' }}>
                            {log.module}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6B7280' }}>
                          <Clock size={11} />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#1F2937', fontWeight: 600 }}>
                        {log.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link 
                to="/logs" 
                className="btn btn-secondary btn-sm"
                onClick={() => setIsUserLogsModalOpen(false)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
              >
                <span>View Full System Audit</span>
                <ExternalLink size={12} />
              </Link>

              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={() => setIsUserLogsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. IN-APP DELETE CONFIRMATION MODAL
          ───────────────────────────────────────────────────────────── */}
      {userToDelete && (
        <div className="modal-backdrop" onClick={() => setUserToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)' }}>
                <Trash2 size={16} />
                Delete User Account
              </h2>
              <button 
                type="button" 
                onClick={() => setUserToDelete(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete user <b>{userToDelete.displayName || userToDelete.email}</b> (<code>{userToDelete.email}</code>)?
              </p>
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '4px', padding: '10px', fontSize: '11px', color: '#991B1B' }}>
                ⚠️ This will immediately revoke their access, delete their account profile, and remove all credentials.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={async () => {
                  const target = userToDelete;
                  setUserToDelete(null);
                  try {
                    setUsers((prev) => prev.filter((usr) => usr.uid !== target.uid && usr.email.toLowerCase() !== target.email.toLowerCase()));
                    await UserService.delete(target.uid);

                    ActivityService.log({
                      action: 'delete',
                      module: 'users',
                      description: `Deleted user account ${target.email} (${target.displayName || 'User'})`
                    });

                    showToast(`User account ${target.email} deleted successfully`, 'info');
                  } catch (err: any) {
                    showToast('Error deleting user: ' + (err.message || ''), 'error');
                  }
                }}
              >
                <Trash2 size={13} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
