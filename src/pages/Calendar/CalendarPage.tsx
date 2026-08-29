import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Booking } from '../../types';
import { getLocalBookings, BookingService } from '../../services/bookings/bookingService';
import { 
  formatMonthHeader, 
  getMonthMatrix, 
  getWeekDates, 
  parseDateYMD, 
  getTodayYMD,
  formatDateDisplay
} from '../../utils/dateUtils';
import { DateNavigator } from '../../components/navigation/DateNavigator';
import { StatusBadge } from '../../components/status/StatusBadge';

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as 'week' | 'month') || 'month';
  const initialDate = searchParams.get('date') || getTodayYMD();

  const [activeView, setActiveView] = useState<'week' | 'month'>(initialView);
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [allBookings, setAllBookings] = useState<Booking[]>(() => getLocalBookings());

  const navigate = useNavigate();
  const todayStr = getTodayYMD();

  useEffect(() => {
    const v = searchParams.get('view') as 'week' | 'month';
    if (v && (v === 'week' || v === 'month')) {
      setActiveView(v);
    }
    const d = searchParams.get('date');
    if (d) {
      setCurrentDate(d);
    }
  }, [searchParams]);

  useEffect(() => {
    return BookingService.subscribeAll(setAllBookings);
  }, []);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    setSearchParams({ view: activeView, date: newDate });
  };

  const handleViewChange = (view: 'day' | 'week' | 'month') => {
    if (view === 'day') {
      navigate(`/bookings?date=${currentDate}`);
      return;
    }
    setActiveView(view);
    setSearchParams({ view, date: currentDate });
  };

  const handleDayClick = (dateStr: string) => {
    navigate(`/bookings?date=${dateStr}`);
  };

  const dateObj = parseDateYMD(currentDate);
  const monthMatrix = getMonthMatrix(dateObj.getFullYear(), dateObj.getMonth());
  const weekDates = getWeekDates(currentDate);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">
            {activeView === 'month' 
              ? formatMonthHeader(currentDate) 
              : `WEEKLY SCHEDULE (${formatDateDisplay(weekDates[0])} — ${formatDateDisplay(weekDates[6])})`}
          </h2>
        </div>
      </div>

      <DateNavigator
        currentDate={currentDate}
        onDateChange={handleDateChange}
        activeView={activeView}
        onViewChange={handleViewChange}
        onAddBooking={() => navigate(`/bookings?date=${currentDate}`)}
      />

      {/* MONTHLY CALENDAR VIEW */}
      {activeView === 'month' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {daysOfWeek.map((day) => (
              <div key={day} className="calendar-header-day">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {monthMatrix.flat().map((item, idx) => {
              const dayBookings = allBookings.filter((b) => b.date === item.date);
              const isToday = item.date === todayStr;

              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!item.isCurrentMonth ? 'inactive' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(item.date)}
                  title={`View ${item.date} bookings`}
                >
                  <div className="calendar-cell-top">
                    <span className="calendar-day-number">{item.dayNumber}</span>
                    {dayBookings.length > 0 && (
                      <span className="page-title-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {dayBookings.length} {dayBookings.length === 1 ? 'Trip' : 'Trips'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        style={{
                          fontSize: '10px',
                          background: '#F0F0F0',
                          padding: '2px 4px',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          borderLeft: '2px solid var(--color-primary)'
                        }}
                      >
                        <b>{b.time}</b> {b.customer} ({b.driver || 'No Driver'})
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <span style={{ fontSize: '9px', color: 'var(--color-primary)', fontWeight: 700 }}>
                        +{dayBookings.length - 2} more trips
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEKLY OPERATIONAL PLANNING VIEW */}
      {activeView === 'week' && (
        <div className="weekly-grid">
          {weekDates.map((wDate) => {
            const dayTrips = allBookings.filter((b) => b.date === wDate);
            const wDateObj = parseDateYMD(wDate);
            const dayName = wDateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const isToday = wDate === todayStr;

            return (
              <div 
                key={wDate} 
                className="weekly-day-column"
                style={{ border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}
              >
                <div 
                  className="weekly-day-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDayClick(wDate)}
                  title="Click to open full daily sheet"
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '12px' }}>{dayName}</span>
                    <span style={{ fontSize: '11px', marginLeft: '6px', color: '#BBB' }}>{formatDateDisplay(wDate)}</span>
                  </div>
                  <span className="page-title-badge" style={{ background: 'var(--color-white)', color: 'var(--color-black)' }}>
                    {dayTrips.length}
                  </span>
                </div>

                <div className="weekly-trips-list">
                  {dayTrips.length === 0 ? (
                    <div style={{ color: '#999', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
                      No trips scheduled
                    </div>
                  ) : (
                    dayTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="weekly-trip-card"
                        onClick={() => handleDayClick(wDate)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-black)' }}>{trip.time}</span>
                          <StatusBadge status={trip.status} />
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{trip.customer}</div>
                        <div style={{ color: '#555', fontSize: '10px' }}>{trip.from} → {trip.to}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#777' }}>
                          <span>👨‍✈️ {trip.driver || 'Unassigned'}</span>
                          <span>🚗 {trip.carNumber || '—'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
