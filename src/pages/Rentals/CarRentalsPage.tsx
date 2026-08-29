import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  TableProperties, 
  LayoutList, 
  RotateCcw
} from 'lucide-react';
import type { CarRental, RentalFilter, RentalPaymentStatus } from '../../types';
import { RentalService } from '../../services/rentals/rentalService';
import { DateNavigator } from '../../components/navigation/DateNavigator';
import { RentalTable } from '../../components/table/RentalTable';
import { RentalModalForm } from '../../components/forms/RentalModalForm';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  formatDateDisplay, 
  formatMonthHeader,
  getWeekDates
} from '../../utils/dateUtils';

export const CarRentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<CarRental[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState('2026-08-29');
  const [activeView, setActiveView] = useState<'day' | 'week' | 'month'>('month');

  // Filter & Search State
  const [filters, setFilters] = useState<RentalFilter>({
    searchQuery: '',
    carType: '',
    paymentStatus: 'All',
    nationality: '',
    dateFrom: '',
    dateTo: ''
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Display Mode: Table vs Cards
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<CarRental | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = RentalService.subscribe((list) => {
      setRentals(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // Filter rentals based on date navigation & filter panel
  const filteredRentals = useMemo(() => {
    let result = [...rentals];

    // 1. Date Scope Filter
    if (!filters.dateFrom && !filters.dateTo) {
      if (activeView === 'day') {
        result = result.filter((r) => r.rentDate === currentDate || r.returnDate === currentDate);
      } else if (activeView === 'week') {
        const startYMD = weekDates[0];
        const endYMD = weekDates[6];
        result = result.filter((r) => r.rentDate >= startYMD && r.rentDate <= endYMD);
      } else if (activeView === 'month') {
        const [year, month] = currentDate.split('-');
        const prefix = `${year}-${month}`;
        result = result.filter((r) => r.rentDate.startsWith(prefix) || r.returnDate.startsWith(prefix));
      }
    } else {
      if (filters.dateFrom && filters.dateTo) {
        result = result.filter((r) => r.rentDate >= filters.dateFrom! && r.rentDate <= filters.dateTo!);
      } else if (filters.dateFrom) {
        result = result.filter((r) => r.rentDate >= filters.dateFrom!);
      } else if (filters.dateTo) {
        result = result.filter((r) => r.rentDate <= filters.dateTo!);
      }
    }

    // 2. Search Query (Agreement #, Customer, Phone, ID, Car, Nationality, Notes)
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.agreementNumber?.toLowerCase().includes(q) ||
          r.customerName?.toLowerCase().includes(q) ||
          r.contactNumber?.toLowerCase().includes(q) ||
          r.idNumber?.toLowerCase().includes(q) ||
          r.carNumber?.toLowerCase().includes(q) ||
          r.carType?.toLowerCase().includes(q) ||
          r.nationality?.toLowerCase().includes(q) ||
          r.note?.toLowerCase().includes(q)
      );
    }

    // 3. Car Type Filter
    if (filters.carType) {
      result = result.filter((r) => r.carType.toLowerCase().includes(filters.carType!.toLowerCase()));
    }

    // 4. Payment Status Filter
    if (filters.paymentStatus && filters.paymentStatus !== 'All') {
      result = result.filter((r) => r.paymentStatus === filters.paymentStatus);
    }

    // 5. Nationality Filter
    if (filters.nationality) {
      result = result.filter((r) => r.nationality?.toLowerCase().includes(filters.nationality!.toLowerCase()));
    }

    return result;
  }, [rentals, currentDate, activeView, weekDates, filters]);

  // Unique list of car types & nationalities for filter dropdowns
  const availableCarTypes = useMemo(() => {
    const types = new Set<string>();
    rentals.forEach((r) => { if (r.carType) types.add(r.carType); });
    return Array.from(types);
  }, [rentals]);

  const availableNationalities = useMemo(() => {
    const nats = new Set<string>();
    rentals.forEach((r) => { if (r.nationality) nats.add(r.nationality); });
    return Array.from(nats);
  }, [rentals]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingRental(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (r: CarRental) => {
    setEditingRental(r);
    setIsModalOpen(true);
  };

  const handleSaveRental = (saved: CarRental) => {
    showToast(`Rental agreement ${saved.agreementNumber} saved successfully`, 'success');
  };

  const handleDeleteRental = () => {
    if (!isAdmin) {
      showToast('Action restricted: Only Administrators can delete rental agreements.', 'error');
      return;
    }
    showToast('Rental agreement deleted', 'info');
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRentals.length === 0) {
      showToast('No rentals to export', 'info');
      return;
    }

    const headers = [
      'Row #',
      'Agreement #',
      'Customer Name',
      'Contact Number',
      'ID Number',
      'Nationality',
      'Car Type',
      'Car Number',
      'Car Model',
      'Rental Days',
      'Rent Date',
      'Rent Time',
      'Return Date',
      'Return Time',
      'Rent Price (BHD)',
      'Advance Payment',
      'Remaining Amount',
      'Deposit Amount',
      'Payment Status',
      'Note'
    ];

    const rows = filteredRentals.map((r, i) => [
      r.rowNumber || i + 1,
      `"${r.agreementNumber}"`,
      `"${r.customerName}"`,
      `"${r.contactNumber}"`,
      `"${r.idNumber || ''}"`,
      `"${r.nationality || ''}"`,
      `"${r.carType}"`,
      `"${r.carNumber}"`,
      `"${r.carModel || ''}"`,
      r.rentalDays,
      r.rentDate,
      r.rentTime,
      r.returnDate,
      r.returnTime,
      r.rentPrice.toFixed(3),
      r.advancePayment.toFixed(3),
      r.remainingAmount.toFixed(3),
      r.depositAmount.toFixed(3),
      r.paymentStatus,
      `"${(r.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SkyLimo_Car_Rentals_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Car Rentals exported to CSV', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.carType ||
    (filters.paymentStatus && filters.paymentStatus !== 'All') ||
    filters.nationality ||
    filters.dateFrom ||
    filters.dateTo
  );

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      carType: '',
      paymentStatus: 'All',
      nationality: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const pageTitle = useMemo(() => {
    if (hasActiveFilters) return 'Filtered Rental Agreements';
    if (activeView === 'day') {
      const parts = currentDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      return `${formatDateDisplay(currentDate)} — ${dayName} CAR RENTALS`;
    }
    if (activeView === 'week') {
      return `WEEKLY RENTALS (${formatDateDisplay(weekDates[0])} — ${formatDateDisplay(weekDates[6])})`;
    }
    return `${formatMonthHeader(currentDate)} CAR RENTALS`;
  }, [hasActiveFilters, activeView, currentDate, weekDates]);

  return (
    <div className="page-container">
      {/* 1. Page Title Toolbar */}
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">{pageTitle}</h2>
          <span className="page-title-badge">{filteredRentals.length} AGREEMENTS</span>
        </div>
      </div>

      {/* 2. Date & View Navigator Bar (Day, Week, Month) */}
      <DateNavigator
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeView={activeView}
        onViewChange={setActiveView}
        onAddBooking={handleOpenAdd}
        addButtonLabel="ADD RENTAL"
      />

      {/* 3. Compact Collapsible Search & Filter Bar */}
      <div className="bookings-filter-bar">
        <div className="bookings-filter-top">
          {/* Real-time search input */}
          <div className="bookings-search-input-wrap">
            <Search size={14} className="search-icon" color="#888" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              placeholder="Search customer, agreement #, phone, ID, car, nationality..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '12px' }}
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            />
          </div>

          <button
            className={`btn ${isFilterExpanded ? 'btn-primary' : 'btn-secondary'} btn-sm btn-filter-toggle`}
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <Filter size={12} />
            <span>View Filters</span>
            {hasActiveFilters && (
              <span className="filter-active-dot" />
            )}
          </button>

          <div className="bookings-filter-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
              <Download size={13} />
              <span className="hide-mobile">Export</span>
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Print Rentals Sheet">
              <Printer size={13} />
              <span className="hide-mobile">Print</span>
            </button>

            <div className="view-switcher" style={{ marginLeft: '4px' }}>
              <button
                type="button"
                className={`view-tab ${displayMode === 'table' ? 'active' : ''}`}
                onClick={() => setDisplayMode('table')}
                title="Spreadsheet Table View"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <TableProperties size={12} />
                  <span className="hide-mobile">Table</span>
                </span>
              </button>
              <button
                type="button"
                className={`view-tab ${displayMode === 'cards' ? 'active' : ''}`}
                onClick={() => setDisplayMode('cards')}
                title="Mobile Cards View"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <LayoutList size={12} />
                  <span className="hide-mobile">Cards</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Expandable Filter Panel */}
      {isFilterExpanded && (
        <div className="bookings-filter-expanded" style={{ backgroundColor: 'var(--color-white)', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700 }}>Car Make / Type</label>
              <select
                className="form-select"
                style={{ fontSize: '11px', height: '30px' }}
                value={filters.carType || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, carType: e.target.value }))}
              >
                <option value="">All Car Types</option>
                {availableCarTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700 }}>Payment Status</label>
              <select
                className="form-select"
                style={{ fontSize: '11px', height: '30px' }}
                value={filters.paymentStatus || 'All'}
                onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value as RentalPaymentStatus | 'All' }))}
              >
                <option value="All">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="UNPAID">UNPAID</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700 }}>Nationality</label>
              <select
                className="form-select"
                style={{ fontSize: '11px', height: '30px' }}
                value={filters.nationality || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, nationality: e.target.value }))}
              >
                <option value="">All Nationalities</option>
                {availableNationalities.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700 }}>Date From</label>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '11px', height: '30px' }}
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700 }}>Date To</label>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '11px', height: '30px' }}
                value={filters.dateTo || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={resetFilters}
                style={{ fontSize: '10px', padding: '2px 8px' }}
              >
                <RotateCcw size={11} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Main Rental Agreements Table or Cards */}
      <RentalTable
        rentals={filteredRentals}
        loading={loading}
        onRowClick={handleRowClick}
        viewMode={displayMode}
      />

      {/* 5. Rental Modal Form (Add / Edit / Delete) */}
      <RentalModalForm
        isOpen={isModalOpen}
        rental={editingRental}
        defaultDate={currentDate}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRental}
        onDelete={isAdmin ? handleDeleteRental : undefined}
      />
    </div>
  );
};
