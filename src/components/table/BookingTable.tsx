import React, { useState } from 'react';
import { CalendarX2, Phone, Car, UserCheck, LayoutList, TableProperties, Edit2 } from 'lucide-react';
import type { Booking, BookingStatus, Driver, Vehicle } from '../../types';
import { TABLE_COLUMNS, STATUS_OPTIONS, DEFAULT_CAR_TYPES } from '../../constants';
import { formatCurrency, formatTotalCurrency } from '../../utils/currencyUtils';
import { formatDateDisplay } from '../../utils/dateUtils';
import { StatusBadge } from '../status/StatusBadge';

interface BookingTableProps {
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onEditBooking: (booking: Booking) => void;
  onInlineUpdate: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking?: (id: string) => void;
  isAdmin?: boolean;
}

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  drivers,
  vehicles,
  onEditBooking,
  onInlineUpdate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeleteBooking: _onDeleteBooking,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isAdmin: _isAdmin = false
}) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>(() => {
    try {
      return typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table';
    } catch {
      return 'table';
    }
  });

  const totals = bookings.reduce(
    (acc, b) => {
      acc.cash += Number(b.cash) || 0;
      acc.card += Number(b.card) || 0;
      acc.bankTransfer += Number(b.bankTransfer) || 0;
      acc.credit += Number(b.credit) || 0;
      acc.commission += Number(b.commission) || 0;
      return acc;
    },
    { cash: 0, card: 0, bankTransfer: 0, credit: 0, commission: 0 }
  );

  const grandTotal = totals.cash + totals.card + totals.bankTransfer + totals.credit;

  if (bookings.length === 0) {
    return (
      <div className="table-wrapper empty-state">
        <CalendarX2 size={40} color="var(--color-muted)" />
        <h3 className="empty-state-title">NO BOOKINGS FOUND</h3>
        <p className="empty-state-text">There are no booking trips scheduled for this view.</p>
      </div>
    );
  }

  const activeDrivers = drivers.filter((d) => d.isActive);
  const activeVehicles = vehicles.filter((v) => v.isActive);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mobile / Tablet View Switch Bar */}
      <div className="booking-table-switch-bar">
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          <span><b>{bookings.length}</b> {bookings.length === 1 ? 'Trip' : 'Trips'}</span>
          <span>•</span>
          <span style={{ color: 'var(--color-black)' }}><b>BHD {formatTotalCurrency(grandTotal)}</b> Total</span>
        </div>

        <div className="view-switcher" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className={`view-tab ${displayMode === 'table' ? 'active' : ''}`}
            onClick={() => setDisplayMode('table')}
            title="Spreadsheet Table View"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <TableProperties size={12} /> Table
            </span>
          </button>
          <button
            type="button"
            className={`view-tab ${displayMode === 'cards' ? 'active' : ''}`}
            onClick={() => setDisplayMode('cards')}
            title="Mobile Cards View"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <LayoutList size={12} /> Cards
            </span>
          </button>
        </div>
      </div>

      {/* 1. SPREADSHEET TABLE MODE */}
      {displayMode === 'table' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {TABLE_COLUMNS.map((col) => (
                  <th 
                    key={col.id} 
                    style={{ 
                      minWidth: col.minWidth, 
                      textAlign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left' 
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const isSelected = selectedRowId === booking.id;

                return (
                  <tr 
                    key={booking.id} 
                    className={isSelected ? 'selected' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedRowId(booking.id);
                      onEditBooking(booking);
                    }}
                    title="Click to view & edit booking details"
                  >
                    {/* 1. Invoice */}
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {booking.invoice || '—'}
                    </td>

                    {/* 2. Date */}
                    <td>{formatDateDisplay(booking.date)}</td>

                    {/* 3. Customer */}
                    <td style={{ fontWeight: 600 }}>{booking.customer}</td>

                    {/* 4. Mobile Phone */}
                    <td>
                      {booking.mobilePhone ? (
                        <a 
                          href={`tel:${booking.mobilePhone}`} 
                          style={{ color: 'inherit', textDecoration: 'none' }}
                          title="Call customer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {booking.mobilePhone}
                        </a>
                      ) : '—'}
                    </td>

                    {/* 5. Time */}
                    <td style={{ fontWeight: 700 }}>{booking.time}</td>

                    {/* 6. From */}
                    <td title={booking.from}>
                      <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {booking.from || '—'}
                      </div>
                    </td>

                    {/* 7. To */}
                    <td title={booking.to}>
                      <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {booking.to || '—'}
                      </div>
                    </td>

                    {/* 8. Flight */}
                    <td style={{ fontWeight: 600, color: booking.flight ? 'var(--color-info)' : 'inherit' }}>
                      {booking.flight || '—'}
                    </td>

                    {/* 9. Car Time Out */}
                    <td>{booking.carTimeOut || '—'}</td>

                    {/* 10. Car Time In */}
                    <td>{booking.carTimeIn || '—'}</td>

                    {/* 11. Car Type */}
                    <td>
                      <select
                        className="inline-select"
                        value={booking.carType}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onInlineUpdate(booking.id, { carType: e.target.value })}
                      >
                        {DEFAULT_CAR_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>

                    {/* 12. Car Number */}
                    <td>
                      <select
                        className="inline-select"
                        value={booking.carNumber}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const veh = vehicles.find((v) => v.carNumber === e.target.value);
                          onInlineUpdate(booking.id, {
                            carNumber: e.target.value,
                            carType: veh ? veh.carType : booking.carType
                          });
                        }}
                      >
                        <option value="">-- Car --</option>
                        {activeVehicles.map((v) => (
                          <option key={v.id} value={v.carNumber}>{v.carNumber}</option>
                        ))}
                        {!activeVehicles.some((v) => v.carNumber === booking.carNumber) && booking.carNumber && (
                          <option value={booking.carNumber}>{booking.carNumber} (Historical)</option>
                        )}
                      </select>
                    </td>

                    {/* 13. Cash */}
                    <td className="numeric">
                      {formatCurrency(booking.cash)}
                    </td>

                    {/* 14. Card */}
                    <td className="numeric">
                      {formatCurrency(booking.card)}
                    </td>

                    {/* 15. Bank Transfer */}
                    <td className="numeric">
                      {formatCurrency(booking.bankTransfer)}
                    </td>

                    {/* 16. Credit */}
                    <td className="numeric">
                      {formatCurrency(booking.credit)}
                    </td>

                    {/* 17. Commission */}
                    <td className="numeric" style={{ color: booking.commission ? 'var(--color-primary)' : 'inherit' }}>
                      {formatCurrency(booking.commission)}
                    </td>

                    {/* 18. Driver */}
                    <td>
                      <select
                        className="inline-select"
                        value={booking.driver}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onInlineUpdate(booking.id, { driver: e.target.value })}
                        style={{ fontWeight: 600 }}
                      >
                        <option value="">-- Select Driver --</option>
                        {activeDrivers.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                        {!activeDrivers.some((d) => d.name === booking.driver) && booking.driver && (
                          <option value={booking.driver}>{booking.driver} (Historical)</option>
                        )}
                      </select>
                    </td>

                    {/* 19. Status */}
                    <td>
                      <select
                        className="inline-select"
                        value={booking.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onInlineUpdate(booking.id, { status: e.target.value as BookingStatus })}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    {/* 20. Note */}
                    <td title={booking.note || ''}>
                      <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {booking.note || '—'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={12} style={{ textAlign: 'left' }}>
                  TOTAL TRIPS: <span style={{ color: 'var(--color-primary)' }}>{bookings.length}</span>
                  &nbsp;|&nbsp; REVENUE TOTAL: <span style={{ color: 'var(--color-success)' }}>BHD {formatTotalCurrency(grandTotal)}</span>
                </td>
                <td className="numeric">{formatTotalCurrency(totals.cash)}</td>
                <td className="numeric">{formatTotalCurrency(totals.card)}</td>
                <td className="numeric">{formatTotalCurrency(totals.bankTransfer)}</td>
                <td className="numeric">{formatTotalCurrency(totals.credit)}</td>
                <td className="numeric" style={{ color: 'var(--color-primary)' }}>{formatTotalCurrency(totals.commission)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 2. TOUCH-FRIENDLY MOBILE CARDS MODE */}
      {displayMode === 'cards' && (
        <div className="mobile-cards-container">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="mobile-trip-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onEditBooking(booking)}
              title="Click to view & edit details"
            >
              <div className="mobile-trip-card-header">
                <div>
                  <span className="mobile-trip-time">{booking.time}</span>
                  {booking.flight && (
                    <span style={{ marginLeft: '8px', color: 'var(--color-info)', fontWeight: 700, fontSize: '12px' }}>
                      ✈️ {booking.flight}
                    </span>
                  )}
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="mobile-trip-customer">{booking.customer}</div>
                {booking.mobilePhone && (
                  <a 
                    href={`tel:${booking.mobilePhone}`} 
                    className="mobile-trip-phone"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone size={13} /> {booking.mobilePhone}
                  </a>
                )}
              </div>

              <div className="mobile-trip-route">
                📍 <b>From:</b> {booking.from || '—'} <br />
                🏁 <b>To:</b> {booking.to || '—'}
              </div>

              <div className="mobile-trip-meta">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} color="var(--color-primary)" />
                  <b>Driver:</b> {booking.driver || 'Unassigned'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={14} color="var(--color-primary)" />
                  <b>Car:</b> {booking.carNumber || '—'} ({booking.carType})
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#444', background: '#F5F5F5', padding: '4px 8px', borderRadius: '4px' }}>
                💰 <b>Payment:</b>&nbsp;
                {booking.cash > 0 && `Cash: BHD ${formatCurrency(booking.cash)} `}
                {booking.card > 0 && `Card: BHD ${formatCurrency(booking.card)} `}
                {booking.bankTransfer > 0 && `Bank: BHD ${formatCurrency(booking.bankTransfer)} `}
                {booking.credit > 0 && `Credit: BHD ${formatCurrency(booking.credit)} `}
                {booking.commission > 0 && `(Comm: BHD ${formatCurrency(booking.commission)}) `}
                {!booking.cash && !booking.card && !booking.bankTransfer && !booking.credit && 'Unpaid / Pending'}
              </div>

              {booking.note && (
                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                  📝 {booking.note}
                </div>
              )}

              <div className="mobile-trip-actions">
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Inv: <b>{booking.invoice}</b>
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBooking(booking);
                    }}
                  >
                    <Edit2 size={12} /> Edit Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
