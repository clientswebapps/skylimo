import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      showToast('Signed in successfully', 'success');
      navigate('/bookings');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-black)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        borderTop: '5px solid var(--color-primary)'
      }}>
        {/* Brand Header */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img 
              src="/cropped-skylimo-logo.png" 
              alt="SkyLimo Tourism & Rent Car" 
              style={{
                maxWidth: '220px',
                width: '100%',
                height: 'auto',
                maxHeight: '60px',
                objectFit: 'contain'
              }}
            />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-black)', letterSpacing: '-0.2px' }}>
            Trips Operations Portal
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Sign in with your authorized operational account
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  autoFocus
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '32px', height: '36px' }}
                  placeholder="name@skylimobh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={15} color="#888" style={{ position: 'absolute', left: '10px', top: '11px' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '32px', height: '36px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock size={15} color="#888" style={{ position: 'absolute', left: '10px', top: '11px' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', marginTop: '6px', fontSize: '13px', height: '38px' }}
              disabled={loading}
            >
              <LogIn size={15} />
              <span>{loading ? 'Verifying Account...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
