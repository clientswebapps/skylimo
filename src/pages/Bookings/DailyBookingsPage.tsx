import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  RotateCcw, 
  Download, 
  Printer, 
  Filter, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import type { Booking, BookingFilter, Driver, Vehicle, BookingStatus } from '../../types';
import { BookingService, getLocalBookings } from '../../services/bookings/bookingService';
import { DriverService, getLocalDrivers } from '../../services/drivers/driverService';
import { VehicleService, getLocalVehicles } from '../../services/vehicles/vehicleService';
import { STATUS_OPTIONS, DEFAULT_CAR_TYPES } from '../../constants';
import { 
  formatDailyHeader, 
  formatMonthHeader, 
  getMonthMatrix, 
  getWeekDates, 
  parseDateYMD, 
  getTodayYMD, 
  formatDateDisplay 
} from '../../utils/dateUtils';
import { DateNavigator } from '../../components/navigation/DateNavigator';
import { BookingTable } from '../../components/table/BookingTable';
import { BookingModalForm } from '../../components/forms/BookingModalForm';
import { StatusBadge } from '../../components/status/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DailyBookingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = (searchParams.get('view') as 'day' | 'week' | 'month') || 'day';
  const urlDate = searchParams.get('date') || getTodayYMD();
  const urlQuery = searchParams.get('q') || '';

  const [activeView, setActiveView] = useState<'day' | 'week' | 'month'>(urlView);
  const [currentDate, setCurrentDate] = useState<string>(urlDate);
  const [isFilterOpen, setIsFilterOpen] = useState(Boolean(urlQuery));

  const [filters, setFilters] = useState<BookingFilter>({
    searchQuery: urlQuery,
    dateFrom: '',
    dateTo: '',
    driver: 'All',
    vehicle: 'All',
    carType: 'All',
    status: 'All',
    paymentMethod: 'All'
  });

  // Cached instant initial state (0ms)
  const [allBookings, setAllBookings] = useState<Booking[]>(() => getLocalBookings());
  const [drivers, setDrivers] = useState<Driver[]>(() => getLocalDrivers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getLocalVehicles());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const todayStr = getTodayYMD();

  // Sync with searchParams
  useEffect(() => {
    const v = searchParams.get('view') as 'day' | 'week' | 'month';
    if (v && (v === 'day' || v === 'week' || v === 'month')) {
      setActiveView(v);
    }
    const d = searchParams.get('date');
    if (d) {
      setCurrentDate(d);
    }
    const q = searchParams.get('q');
    if (q !== null && q !== filters.searchQuery) {
      setFilters((prev) => ({ ...prev, searchQuery: q }));
      if (q) setIsFilterOpen(true);
    }
  }, [searchParams]);

  // Real-time subscriptions
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

  // Check if advanced or search filters are currently active
  const hasActiveFilters = Boolean(
    filters.searchQuery?.trim() ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.driver !== 'All' ||
    filters.vehicle !== 'All' ||
    filters.carType !== 'All' ||
    filters.status !== 'All' ||
    filters.paymentMethod !== 'All'
  );

  const activeFiltersCount = [
    Boolean(filters.searchQuery?.trim()),
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
    filters.driver !== 'All',
    filters.vehicle !== 'All',
    filters.carType !== 'All',
    filters.status !== 'All',
    filters.paymentMethod !== 'All'
  ].filter(Boolean).length;

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    setSearchParams({ view: activeView, date: newDate });
  };

  const handleViewChange = (view: 'day' | 'week' | 'month') => {
    setActiveView(view);
    setSearchParams({ view, date: currentDate });
  };

  const handleDayClick = (dateStr: string) => {
    setCurrentDate(dateStr);
    setActiveView('day');
    setSearchParams({ view: 'day', date: dateStr });
  };

  const handleResetFilters = () => {
    const resetValues: BookingFilter = {
      searchQuery: '',
      dateFrom: '',
      dateTo: '',
      driver: 'All',
      vehicle: 'All',
      carType: 'All',
      status: 'All',
      paymentMethod: 'All'
    };
    setFilters(resetValues);
    setSearchParams({ view: activeView, date: currentDate });
  };

  const handleInlineUpdate = async (id: string, updates: Partial<Booking>) => {
    setAllBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    try {
      await BookingService.update(id, updates);
      showToast('Booking updated', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    }
  };

  const handleSaveModal = async (formData: Omit<Booking, 'id'>) => {
    if (editingBooking) {
      setAllBookings((prev) => prev.map((b) => (b.id === editingBooking.id ? { ...b, ...formData } : b)));
      await BookingService.update(editingBooking.id, formData);
      showToast('Booking trip updated successfully', 'success');
    } else {
      const created = await BookingService.create(formData);
      setAllBookings((prev) => [created, ...prev]);
      showToast('New booking trip created successfully', 'success');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    setAllBookings((prev) => prev.filter((b) => b.id !== id));
    try {
      await BookingService.delete(id);
      showToast('Booking deleted', 'info');
    } catch (err: any) {
      showToast('Unable to delete booking', 'error');
    }
  };

  // Filtered dataset when search/filter active
  const filteredBookings = BookingService.getFilteredSync(filters);

  // Day trips dataset
  const dayBookings = allBookings.filter((b) => b.date === currentDate);

  // Week trips dataset
  const weekDates = getWeekDates(currentDate);
  const weekTrips = allBookings.filter((b) => weekDates.includes(b.date));

  // Month matrix dataset
  const dateObj = parseDateYMD(currentDate);
  const monthMatrix = getMonthMatrix(dateObj.getFullYear(), dateObj.getMonth());
  const monthPrefix = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  const monthTrips = allBookings.filter((b) => b.date.startsWith(monthPrefix));

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Current active records for export
  const currentDisplayBookings = hasActiveFilters 
    ? filteredBookings 
    : activeView === 'day' 
      ? dayBookings 
      : activeView === 'week' 
        ? weekTrips 
        : monthTrips;

  const exportCSV = () => {
    if (currentDisplayBookings.length === 0) {
      showToast('No records to export', 'info');
      return;
    }

    const headers = [
      'Invoice', 'Date', 'Customer', 'Mobile Phone', 'Time', 'From', 'To',
      'Flight', 'Car Time Out', 'Car Time In', 'Car Type', 'Car Number',
      'Cash', 'Card', 'Bank Transfer', 'Credit', 'Commission', 'Driver', 'Status', 'Note'
    ];

    const rows = currentDisplayBookings.map((b) => [
      `"${b.invoice || ''}"`,
      `"${b.date || ''}"`,
      `"${b.customer || ''}"`,
      `"${b.mobilePhone || ''}"`,
      `"${b.time || ''}"`,
      `"${b.from || ''}"`,
      `"${b.to || ''}"`,
      `"${b.flight || ''}"`,
      `"${b.carTimeOut || ''}"`,
      `"${b.carTimeIn || ''}"`,
      `"${b.carType || ''}"`,
      `"${b.carNumber || ''}"`,
      b.cash || 0,
      b.card || 0,
      b.bankTransfer || 0,
      b.credit || 0,
      b.commission || 0,
      `"${b.driver || ''}"`,
      `"${b.status || ''}"`,
      `"${(b.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skylimo_bookings_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      {/* 1. PAGE TITLE & HEADER TOOLBAR */}
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">
            {hasActiveFilters 
              ? 'Filtered Booking Records'
              : activeView === 'day'
                ? formatDailyHeader(currentDate)
                : activeView === 'week'
                  ? `WEEKLY SCHEDULE (${formatDateDisplay(weekDates[0])} — ${formatDateDisplay(weekDates[6])})`
                  : formatMonthHeader(currentDate)
            }
          </h2>
          <span className="page-title-badge">
            {hasActiveFilters 
              ? `${filteredBookings.length} MATCHING` 
              : activeView === 'day'
                ? `${dayBookings.length} TRIPS`
                : activeView === 'week'
                  ? `${weekTrips.length} TRIPS`
                  : `${monthTrips.length} TRIPS`
            }
          </span>
        </div>
      </div>

      {/* 2. DATE & VIEW NAVIGATOR (Day, Week, Month) */}
      <DateNavigator
        currentDate={currentDate}
        onDateChange={handleDateChange}
        activeView={activeView}
        onViewChange={handleViewChange}
        onAddBooking={() => {
          setEditingBooking(null);
          setIsModalOpen(true);
        }}
      />

      {/* 3. COMPACT COLLAPSIBLE SEARCH & FILTER BAR */}
      <div className="bookings-filter-bar">
        <div className="bookings-filter-top">
          {/* Real-time search input */}
          <div className="bookings-search-input-wrap">
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '12px' }}
              placeholder="Search customer, invoice, phone, flight, car, driver..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />
            <Search size={14} color="#888" style={{ position: 'absolute', left: '10px' }} />
          </div>

          <div className="bookings-filter-actions">
            {/* Toggle View Filters button */}
            <button 
              type="button"
              className={`btn btn-sm ${isFilterOpen ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              title="Toggle advanced filter criteria"
            >
              <Filter size={12} />
              <span>{isFilterOpen ? 'Hide Filters' : 'View Filters'}</span>
              {activeFiltersCount > 0 && (
                <span className="page-title-badge" style={{ background: isFilterOpen ? '#FFFFFF' : 'var(--color-primary)', color: isFilterOpen ? 'var(--color-black)' : '#FFFFFF', fontSize: '9px', padding: '1px 4px' }}>
                  {activeFiltersCount}
                </span>
              )}
              {isFilterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', height: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}
                onClick={handleResetFilters}
                title="Clear all search queries and filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            {/* Export & Print Utilities */}
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '11px', height: '32px', padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={exportCSV} 
              title="Export current booking view to CSV"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '11px', height: '32px', padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => window.print()} 
              title="Print table"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Expanded Detailed Filter Controls */}
        {isFilterOpen && (
          <div className="bookings-filter-expanded">
            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Date From</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Date To</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Driver</label>
              <select
                className="form-select"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.driver}
                onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
              >
                <option value="All">All Drivers</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Vehicle</label>
              <select
                className="form-select"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.vehicle}
                onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
              >
                <option value="All">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.carNumber}>{v.carNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Car Type</label>
              <select
                className="form-select"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.carType}
                onChange={(e) => setFilters({ ...filters, carType: e.target.value })}
              >
                <option value="All">All Car Types</option>
                {DEFAULT_CAR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Status</label>
              <select
                className="form-select"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as BookingStatus | 'All' })}
              >
                <option value="All">All Statuses</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '10px' }}>Payment Filter</label>
              <select
                className="form-select"
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', minHeight: '30px' }}
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value as any })}
              >
                <option value="All">All Payments</option>
                <option value="cash">Has Cash</option>
                <option value="card">Has Card</option>
                <option value="bankTransfer">Has Bank Transfer</option>
                <option value="credit">Has Credit</option>
                <option value="commission">Has Commission</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN DISPLAY AREA */}

      {/* A. When search/filter is active -> Show filtered results table */}
      {hasActiveFilters && (
        <BookingTable
          bookings={filteredBookings}
          drivers={drivers}
          vehicles={vehicles}
          onEditBooking={(b) => {
            setEditingBooking(b);
            setIsModalOpen(true);
          }}
          onInlineUpdate={handleInlineUpdate}
          onDeleteBooking={handleDeleteBooking}
          isAdmin={isAdmin}
        />
      )}

      {/* B. When Day View is active (and no search filter active) */}
      {!hasActiveFilters && activeView === 'day' && (
        <BookingTable
          bookings={dayBookings}
          drivers={drivers}
          vehicles={vehicles}
          onEditBooking={(b) => {
            setEditingBooking(b);
            setIsModalOpen(true);
          }}
          onInlineUpdate={handleInlineUpdate}
          onDeleteBooking={handleDeleteBooking}
          isAdmin={isAdmin}
        />
      )}

      {/* C. When Week View is active */}
      {!hasActiveFilters && activeView === 'week' && (
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
                  title="Click to open daily spreadsheet"
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

      {/* D. When Month View is active */}
      {!hasActiveFilters && activeView === 'month' && (
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
              const cellBookings = allBookings.filter((b) => b.date === item.date);
              const isToday = item.date === todayStr;

              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!item.isCurrentMonth ? 'inactive' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(item.date)}
                  title={`Click to view ${item.date} bookings`}
                >
                  <div className="calendar-cell-top">
                    <span className="calendar-day-number">{item.dayNumber}</span>
                    {cellBookings.length > 0 && (
                      <span className="page-title-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {cellBookings.length} {cellBookings.length === 1 ? 'Trip' : 'Trips'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {cellBookings.slice(0, 2).map((b) => (
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
                    {cellBookings.length > 2 && (
                      <span style={{ fontSize: '9px', color: 'var(--color-primary)', fontWeight: 700 }}>
                        +{cellBookings.length - 2} more trips
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT BOOKING MODAL */}
      <BookingModalForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBooking(null);
        }}
        onSave={handleSaveModal}
        onDelete={handleDeleteBooking}
        initialData={editingBooking}
        drivers={drivers}
        vehicles={vehicles}
        defaultDate={currentDate}
      />
    </div>
  );
};
