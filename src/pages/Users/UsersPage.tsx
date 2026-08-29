import React, { useState, useEffect } from 'react';
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
  KeyRound 
} from 'lucide-react';
import type { AppUser, UserRole } from '../../types';
import { UserService } from '../../services/users/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

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

  const [saving, setSaving] = useState(false);

  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    return UserService.subscribe(setUsers);
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
    setIsEditModalOpen(true);
  };

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

      showToast(`User ${editDisplayName || editingUser.email} updated successfully`, 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast('Error updating user', 'error');
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
    showToast(`Role for ${u.displayName || u.email} updated to ${newRole.toUpperCase()}`, 'success');
  };

  const handleDeleteUser = async (u: AppUser) => {
    const isSelf = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();
    if (isSelf) {
      showToast('You cannot delete your own account', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently remove user "${u.email}"?`)) {
      setUsers((prev) => prev.filter((usr) => usr.uid !== u.uid));
      await UserService.delete(u.uid);
      showToast(`User ${u.email} removed`, 'info');
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
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '200px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();

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
                          onClick={() => handleDeleteUser(u)}
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

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
