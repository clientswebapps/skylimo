import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { DailyBookingsPage } from './pages/Bookings/DailyBookingsPage';
import { DriversPage } from './pages/Drivers/DriversPage';
import { VehiclesPage } from './pages/Vehicles/VehiclesPage';
import { UsersPage } from './pages/Users/UsersPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes inside AppShell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/bookings" element={<DailyBookingsPage />} />
              <Route path="/calendar" element={<Navigate to="/bookings" replace />} />
              <Route path="/search" element={<Navigate to="/bookings" replace />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              
              {/* Admin Only Route */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UsersPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/bookings" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
