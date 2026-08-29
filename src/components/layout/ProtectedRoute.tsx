import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-black, #111111)',
        color: '#ffffff',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: 'var(--color-primary, #D90000)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '18px',
          padding: '8px 16px',
          borderRadius: '4px',
          letterSpacing: '1px'
        }}>
          SKYLIMO
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#A0A0A0',
          fontWeight: 500
        }}>
          <div style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: 'var(--color-primary, #D90000)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span>Authenticating & Loading Trips...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/bookings" replace />;
  }

  return <>{children}</>;
};
