import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { DailyBookingsPage } from './pages/Bookings/DailyBookingsPage';
import { CarRentalsPage } from './pages/Rentals/CarRentalsPage';
import { TripsReportPage } from './pages/Reports/TripsReportPage';
import { DriversPage } from './pages/Drivers/DriversPage';
import { VehiclesPage } from './pages/Vehicles/VehiclesPage';
import { UsersPage } from './pages/Users/UsersPage';
import { ActivityLogsPage } from './pages/Logs/ActivityLogsPage';

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
              <Route path="/rentals" element={<CarRentalsPage />} />
              <Route path="/reports" element={<TripsReportPage />} />
              <Route path="/calendar" element={<Navigate to="/bookings" replace />} />
              <Route path="/search" element={<Navigate to="/bookings" replace />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              
              {/* Admin Only Routes */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UsersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/logs" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ActivityLogsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/settings" element={<Navigate to="/bookings" replace />} />
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
