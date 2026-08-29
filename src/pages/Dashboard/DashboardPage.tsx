import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Car, 
  UserCheck, 
  Search 
} from 'lucide-react';
import type { Booking, Driver, Vehicle } from '../../types';
import { BookingService } from '../../services/bookings/bookingService';
import { DriverService } from '../../services/drivers/driverService';
import { VehicleService } from '../../services/vehicles/vehicleService';
import { getTodayYMD, formatDateDisplay } from '../../utils/dateUtils';
import { formatTotalCurrency } from '../../utils/currencyUtils';
import { TripsGradientChart } from '../../components/charts/TripsGradientChart';

export const DashboardPage: React.FC = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const navigate = useNavigate();
  const todayStr = getTodayYMD();

  useEffect(() => {
    const unsubBookings = BookingService.subscribeAll(setAllBookings);
    const unsubDrivers = DriverService.subscribe(setDrivers);
    const unsubVehicles = VehicleService.subscribe(setVehicles);

    return () => {
      unsubBookings();
      unsubDrivers();
      unsubVehicles();
    };
  }, []);

  const todayBookings = allBookings.filter((b) => b.date === todayStr);

  const totalTrips = todayBookings.length;
  const completedTrips = todayBookings.filter((b) => b.status === 'Completed').length;
  const confirmedTrips = todayBookings.filter((b) => b.status === 'Confirmed').length;
  const pendingTrips = todayBookings.filter((b) => b.status === 'Pending').length;
  const cancelledTrips = todayBookings.filter((b) => b.status === 'Cancelled' || b.status === 'No Show').length;

  const todayRevenue = todayBookings.reduce((sum, b) => {
    return sum + (Number(b.cash) || 0) + (Number(b.card) || 0) + (Number(b.bankTransfer) || 0) + (Number(b.credit) || 0);
  }, 0);

  const activeDrivers = drivers.filter((d) => d.isActive);
  const activeVehicles = vehicles.filter((v) => v.isActive);

  return (
    <div className="page-container" style={{ overflowY: 'auto' }}>
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">Operational Dashboard</h2>
          <span className="page-title-badge">TODAY: {formatDateDisplay(todayStr)}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/bookings')}
          >
            <Search size={15} />
            Search Database
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/bookings?date=${todayStr}`)}
          >
            <CalendarDays size={16} />
            OPEN DAILY SHEET
          </button>
        </div>
      </div>

      <div className="card-grid">
        <div className="stat-card accent-red">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title">Today's Total Trips</span>
            <CalendarDays size={18} color="var(--color-primary)" />
          </div>
          <span className="stat-card-value">{totalTrips}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Est. Revenue: <b>BHD {formatTotalCurrency(todayRevenue)}</b>
          </span>
        </div>

        <div className="stat-card accent-green">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title">Completed Trips</span>
            <CheckCircle size={18} color="var(--color-success)" />
          </div>
          <span className="stat-card-value">{completedTrips}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
            {totalTrips > 0 ? `${Math.round((completedTrips / totalTrips) * 100)}% execution rate` : 'No trips yet'}
          </span>
        </div>

        <div className="stat-card accent-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title">Confirmed & Pending</span>
            <Clock size={18} color="var(--color-warning)" />
          </div>
          <span className="stat-card-value">{confirmedTrips + pendingTrips}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {confirmedTrips} confirmed, {pendingTrips} pending
          </span>
        </div>

        <div className="stat-card accent-neutral">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title">Cancelled / No Show</span>
            <XCircle size={18} color="var(--color-neutral)" />
          </div>
          <span className="stat-card-value">{cancelledTrips}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {cancelledTrips} flagged trips
          </span>
        </div>
      </div>

      <div className="dashboard-main-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Velocity Trend Line Graph with Gradient Shades */}
        <TripsGradientChart bookings={allBookings} />

        {/* 2. FLEET OVERVIEW: Active Drivers & Active Vehicles Side-by-Side Underneath */}
        <div className="dashboard-fleet-grid">
          {/* Active Drivers Card */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="var(--color-primary)" />
                Active Drivers ({activeDrivers.length})
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => navigate('/drivers')}
              >
                Manage
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {activeDrivers.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                  No active drivers registered.
                </div>
              ) : (
                activeDrivers.slice(0, 6).map((d) => {
                  const assignedTrips = todayBookings.filter((b) => b.driver === d.name).length;
                  return (
                    <div 
                      key={d.id} 
                      style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 10px',
                        backgroundColor: '#FAFAFA',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-black)',
                          color: 'var(--color-white)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}>
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{d.name}</div>
                          {d.phone && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{d.phone}</div>}
                        </div>
                      </div>
                      <span className="page-title-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {assignedTrips} {assignedTrips === 1 ? 'Trip Today' : 'Trips Today'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Vehicles Card */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={16} color="var(--color-primary)" />
                Active Vehicles ({activeVehicles.length})
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => navigate('/vehicles')}
              >
                Manage
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {activeVehicles.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                  No active vehicles registered.
                </div>
              ) : (
                activeVehicles.slice(0, 6).map((v) => {
                  const assignedTrips = todayBookings.filter((b) => b.carNumber === v.carNumber).length;
                  return (
                    <div 
                      key={v.id} 
                      style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 10px',
                        backgroundColor: '#FAFAFA',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          backgroundColor: '#2b2b2b',
                          color: '#f0c040',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          🚗
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{v.carNumber}</span>
                          <span style={{ fontSize: '11px', color: '#777', marginLeft: '6px' }}>({v.carType})</span>
                        </div>
                      </div>
                      <span className="page-title-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {assignedTrips} {assignedTrips === 1 ? 'Trip' : 'Trips'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
