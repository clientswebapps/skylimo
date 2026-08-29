import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, RefreshCw, KeyRound, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_CAR_TYPES, STATUS_OPTIONS } from '../../constants';
import { firebaseConfig } from '../../services/firebase/config';
import { UserService } from '../../services/users/userService';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [adminName, setAdminName] = useState(user?.displayName || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!adminName.trim()) {
      showToast('Display name cannot be empty', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      await UserService.updateUser(user.uid, {
        displayName: adminName.trim(),
        password: adminPassword.trim() ? adminPassword.trim() : undefined
      });
      showToast('Admin profile and security settings updated successfully', 'success');
      setAdminPassword('');
    } catch (err: any) {
      showToast('Error updating profile: ' + (err.message || ''), 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local demo dataset to initial spreadsheet sample?')) {
      localStorage.removeItem('skylimo_local_bookings');
      localStorage.removeItem('skylimo_local_drivers');
      localStorage.removeItem('skylimo_local_vehicles');
      localStorage.removeItem('skylimo_local_users');
      showToast('Sample dataset restored', 'success');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  return (
    <div className="page-container" style={{ overflowY: 'auto' }}>
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">System Settings & Configuration</h2>
        </div>
      </div>

      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* System Overview Card */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={17} color="var(--color-primary)" />
            Application Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>System:</span>
              <p style={{ fontWeight: 600 }}>SkyLimo Booking Trips Operations System</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Logged-in User:</span>
              <p style={{ fontWeight: 600 }}>{user?.displayName} ({user?.email})</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>User Role:</span>
              <p style={{ fontWeight: 600, textTransform: 'uppercase', color: isAdmin ? 'var(--color-primary)' : 'inherit' }}>
                {user?.role} {isAdmin && '— Full Administrator'}
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Currency Mode:</span>
              <p style={{ fontWeight: 600 }}>BHD (Bahraini Dinar — 3 Decimal Precision)</p>
            </div>
          </div>
        </div>

        {/* Admin Profile & Password Security Card */}
        {isAdmin && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={17} color="var(--color-primary)" />
              Admin Profile & Password Management
            </h3>

            <form onSubmit={handleUpdateAdminProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Leave blank to keep current"
                    className="form-input"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={updatingProfile}>
                  <Save size={13} />
                  <span>{updatingProfile ? 'Saving Changes...' : 'Update Admin Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Master Controlled Lists */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={17} color="var(--color-primary)" />
            Controlled Dropdowns & Master Types
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-black)' }}>Supported Car Types:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {DEFAULT_CAR_TYPES.map((t) => (
                  <span key={t} className="page-title-badge" style={{ background: '#EAEAEA', color: '#111' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-black)' }}>Configured Trip Statuses:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {STATUS_OPTIONS.map((st) => (
                  <span key={st} className="page-title-badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    {st}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Firebase Backend Details */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={17} color="var(--color-primary)" />
            Firebase Backend Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Project ID:</span>
              <p style={{ fontWeight: 600 }}>{firebaseConfig.projectId}</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Auth Domain:</span>
              <p style={{ fontWeight: 600 }}>{firebaseConfig.authDomain}</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Database:</span>
              <p style={{ fontWeight: 600 }}>Cloud Firestore (with offline persistence)</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Security Level:</span>
              <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>RBAC Security Rules Active</p>
            </div>
          </div>
        </div>

        {/* Developer / Demo Reset */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-black)' }}>
              Reset Demo Dataset
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Re-seeds sample August 2026 trips, drivers, and vehicles.
            </p>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleResetData}>
            <RefreshCw size={13} />
            Reset Data
          </button>
        </div>
      </div>
    </div>
  );
};
