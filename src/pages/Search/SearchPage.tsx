import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, Download, Printer } from 'lucide-react';
import type { Booking, BookingFilter, Driver, Vehicle, BookingStatus } from '../../types';
import { BookingService } from '../../services/bookings/bookingService';
import { DriverService, getLocalDrivers } from '../../services/drivers/driverService';
import { VehicleService, getLocalVehicles } from '../../services/vehicles/vehicleService';
import { STATUS_OPTIONS, DEFAULT_CAR_TYPES } from '../../constants';
import { BookingTable } from '../../components/table/BookingTable';
import { BookingModalForm } from '../../components/forms/BookingModalForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

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

  // Instantaneous initial state (0ms)
  const [results, setResults] = useState<Booking[]>(() => BookingService.getFilteredSync({
    searchQuery: urlQuery,
    dateFrom: '',
    dateTo: '',
    driver: 'All',
    vehicle: 'All',
    carType: 'All',
    status: 'All',
    paymentMethod: 'All'
  }));

  const [drivers, setDrivers] = useState<Driver[]>(() => getLocalDrivers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getLocalVehicles());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const fetchResults = useCallback(() => {
    // Instantaneous local filter computation (0ms)
    const data = BookingService.getFilteredSync(filters);
    setResults(data);
  }, [filters]);

  useEffect(() => {
    const unsubDrivers = DriverService.subscribe(setDrivers);
    const unsubVehicles = VehicleService.subscribe(setVehicles);
    return () => {
      unsubDrivers();
      unsubVehicles();
    };
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== filters.searchQuery) {
      setFilters((prev) => ({ ...prev, searchQuery: q }));
    }
  }, [searchParams]);

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
    setSearchParams({});
    setResults(BookingService.getFilteredSync(resetValues));
  };

  const handleInlineUpdate = async (id: string, updates: Partial<Booking>) => {
    setResults((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    await BookingService.update(id, updates);
    showToast('Updated booking', 'info');
    fetchResults();
  };

  const handleSaveModal = async (formData: Omit<Booking, 'id'>) => {
    if (editingBooking) {
      setResults((prev) => prev.map((b) => (b.id === editingBooking.id ? { ...b, ...formData } : b)));
      await BookingService.update(editingBooking.id, formData);
      showToast('Booking updated successfully', 'success');
    } else {
      const created = await BookingService.create(formData);
      setResults((prev) => [created, ...prev]);
      showToast('Booking created successfully', 'success');
    }
    fetchResults();
  };

  const handleDeleteBooking = async (id: string) => {
    setResults((prev) => prev.filter((b) => b.id !== id));
    await BookingService.delete(id);
    showToast('Booking deleted', 'info');
    fetchResults();
  };

  const exportCSV = () => {
    if (results.length === 0) {
      showToast('No records to export', 'info');
      return;
    }

    const headers = [
      'Invoice', 'Date', 'Customer', 'Mobile Phone', 'Time', 'From', 'To',
      'Flight', 'Car Time Out', 'Car Time In', 'Car Type', 'Car Number',
      'Cash', 'Card', 'Bank Transfer', 'Credit', 'Commission', 'Driver', 'Status', 'Note'
    ];

    const rows = results.map((b) => [
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
    link.setAttribute('download', `skylimo_trips_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">Global Search & Filter</h2>
          <span className="page-title-badge">{results.length} MATCHING TRIPS</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Export to CSV">
            <Download size={14} />
            Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()} title="Print Table">
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px',
        marginBottom: '12px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '13px' }}
              placeholder="Search by customer, invoice number, phone, flight (e.g. RJ 672), car (e.g. 640315), location, driver..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />
            <Search size={16} color="#888" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <button className="btn btn-secondary" onClick={handleResetFilters} title="Reset all filters">
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          paddingTop: '6px',
          borderTop: '1px solid var(--color-border-light)'
        }}>
          <div>
            <label className="form-label" style={{ fontSize: '10px' }}>Date From</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '10px' }}>Date To</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '10px' }}>Driver</label>
            <select
              className="form-select"
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
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
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
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
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
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
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
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
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}
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
      </div>

      <BookingTable
        bookings={results}
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

      <BookingModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={editingBooking}
        drivers={drivers}
        vehicles={vehicles}
      />
    </div>
  );
};
