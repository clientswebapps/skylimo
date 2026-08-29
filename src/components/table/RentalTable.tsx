import React from 'react';
import { KeyRound, Calendar, Car, User, Phone, Tag } from 'lucide-react';
import type { CarRental } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface RentalTableProps {
  rentals: CarRental[];
  loading?: boolean;
  onRowClick?: (rental: CarRental) => void;
  viewMode?: 'table' | 'cards';
}

export const RentalTable: React.FC<RentalTableProps> = ({
  rentals,
  loading = false,
  onRowClick,
  viewMode = 'table'
}) => {
  // Format date helper: YYYY-MM-DD -> DD.MM.YYYY
  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '-';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dStr;
  };

  const totalRentPrice = rentals.reduce((sum, r) => sum + (Number(r.rentPrice) || 0), 0);
  const totalDeposit = rentals.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Loading rental agreements...
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
        <KeyRound size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-black)', marginBottom: '4px' }}>
          No Rental Agreements Found
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          No car rentals match the selected date or filter criteria. Click "+ ADD RENTAL" to create one.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CARDS VIEW (Mobile / Tablet Switcher)
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {rentals.map((r, idx) => (
          <div
            key={r.id}
            onClick={() => onRowClick && onRowClick(r)}
            style={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'border-color 0.15s ease'
            }}
          >
            {/* Header: Agreement # & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#888' }}>#{r.rowNumber || idx + 1}</span>
                <span className="rental-agreement-badge">{r.agreementNumber}</span>
              </div>
              <span className={`rental-status-badge rental-status-${(r.paymentStatus || 'PAID').toLowerCase()}`}>
                {r.paymentStatus || 'PAID'}
              </span>
            </div>

            {/* Customer Details */}
            <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--color-black)' }}>
                <User size={13} color="var(--color-primary)" />
                <span>{r.customerName}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={11} /> {r.contactNumber}
                </span>
                {r.nationality && (
                  <span style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                    {r.nationality}
                  </span>
                )}
              </div>
            </div>

            {/* Car & Schedule Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Car size={11} /> Car:
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-black)' }}>
                  {r.carType} ({r.carNumber})
                </span>
              </div>
              <div>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Calendar size={11} /> Period:
                </span>
                <span style={{ fontWeight: 600 }}>
                  {r.rentalDays} Day{r.rentalDays > 1 ? 's' : ''} ({formatDateDisplay(r.rentDate)} → {formatDateDisplay(r.returnDate)})
                </span>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '8px 10px', borderRadius: '4px', fontSize: '11px' }}>
              <div>
                <span style={{ color: '#888' }}>Rent: </span>
                <strong style={{ color: 'var(--color-black)' }}>{formatCurrency(r.rentPrice)}</strong>
              </div>
              {r.depositAmount > 0 && (
                <div>
                  <span style={{ color: '#888' }}>Deposit: </span>
                  <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(r.depositAmount)}</strong>
                </div>
              )}
            </div>

            {r.note && (
              <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tag size={10} color="#888" />
                <span>{r.note}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SPREADSHEET TABLE VIEW (Grouped Headers matching user sheet)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="table-wrapper rental-table-wrapper" style={{ overflowX: 'auto' }}>
      <table className="data-table rental-data-table">
        {/* Grouped Header Structure */}
        <thead>
          <tr className="rental-header-group-row">
            <th rowSpan={2} style={{ width: '45px', textAlign: 'center' }}>#</th>
            <th rowSpan={2} style={{ width: '130px', textAlign: 'center' }}>
              AGREEMENT # /<br />INVOICE #
            </th>
            <th colSpan={4} className="rental-group-header rental-group-customer">
              CUSTOMER DETAILS
            </th>
            <th colSpan={3} className="rental-group-header rental-group-car">
              CAR DETAILS
            </th>
            <th colSpan={5} className="rental-group-header rental-group-rent">
              RENT DETAILS
            </th>
            <th colSpan={5} className="rental-group-header rental-group-payment">
              PAYMENT
            </th>
            <th rowSpan={2} style={{ minWidth: '180px' }}>NOTE</th>
          </tr>
          <tr className="rental-header-sub-row">
            {/* Customer Details */}
            <th style={{ minWidth: '170px' }}>NAME</th>
            <th style={{ width: '130px' }}>CONTACT NUMBER</th>
            <th style={{ width: '110px' }}>ID NUMBER</th>
            <th style={{ width: '90px' }}>NATIONALITY</th>

            {/* Car Details */}
            <th style={{ width: '120px' }}>TYPE</th>
            <th style={{ width: '95px' }}>NUMBER</th>
            <th style={{ width: '75px' }}>MODEL</th>

            {/* Rent Details */}
            <th style={{ width: '65px', textAlign: 'center' }}>DAYS</th>
            <th style={{ width: '95px' }}>RENT DATE</th>
            <th style={{ width: '80px' }}>RENT TIME</th>
            <th style={{ width: '95px' }}>RETURN DATE</th>
            <th style={{ width: '80px' }}>RETURN TIME</th>

            {/* Payment Details */}
            <th style={{ width: '100px', textAlign: 'right' }}>RENT PRICE</th>
            <th style={{ width: '90px', textAlign: 'right' }}>ADVANCE</th>
            <th style={{ width: '90px', textAlign: 'right' }}>REMAINING</th>
            <th style={{ width: '85px', textAlign: 'right' }}>DEPOSIT</th>
            <th style={{ width: '80px', textAlign: 'center' }}>PAID</th>
          </tr>
        </thead>

        <tbody>
          {rentals.map((r, idx) => (
            <tr
              key={r.id}
              onClick={() => onRowClick && onRowClick(r)}
              className="clickable-row"
            >
              {/* Row # */}
              <td style={{ textAlign: 'center', color: '#666', fontWeight: 600, fontSize: '11px' }}>
                {r.rowNumber || 606 + idx}
              </td>

              {/* Agreement / Invoice # */}
              <td style={{ textAlign: 'center' }}>
                <span className="rental-agreement-badge">
                  {r.agreementNumber}
                </span>
              </td>

              {/* Customer Name */}
              <td style={{ fontWeight: 700, color: 'var(--color-black)' }}>
                {r.customerName}
              </td>

              {/* Contact Number */}
              <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                {r.contactNumber}
              </td>

              {/* ID Number */}
              <td style={{ fontSize: '11px', color: '#555' }}>
                {r.idNumber || '-'}
              </td>

              {/* Nationality */}
              <td>
                {r.nationality ? (
                  <span className="rental-nationality-pill">
                    {r.nationality}
                  </span>
                ) : (
                  '-'
                )}
              </td>

              {/* Car Type */}
              <td>
                <span className="rental-cartype-pill">
                  {r.carType}
                </span>
              </td>

              {/* Car Number */}
              <td style={{ fontWeight: 700, textAlign: 'center' }}>
                <span className="rental-carnumber-pill">
                  {r.carNumber}
                </span>
              </td>

              {/* Car Model */}
              <td style={{ color: '#555', textAlign: 'center' }}>
                {r.carModel || '-'}
              </td>

              {/* Rental Days */}
              <td style={{ textAlign: 'center', fontWeight: 700 }}>
                {r.rentalDays}
              </td>

              {/* Rent Date */}
              <td style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
                {formatDateDisplay(r.rentDate)}
              </td>

              {/* Rent Time */}
              <td style={{ fontSize: '11px', color: '#555' }}>
                {r.rentTime}
              </td>

              {/* Return Date */}
              <td style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
                {formatDateDisplay(r.returnDate)}
              </td>

              {/* Return Time */}
              <td style={{ fontSize: '11px', color: '#555' }}>
                {r.returnTime}
              </td>

              {/* Rent Price */}
              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-black)' }}>
                {formatCurrency(r.rentPrice)}
              </td>

              {/* Advance Payment */}
              <td style={{ textAlign: 'right', color: '#555' }}>
                {r.advancePayment > 0 ? formatCurrency(r.advancePayment) : '-'}
              </td>

              {/* Remaining Amount */}
              <td style={{ textAlign: 'right', color: r.remainingAmount > 0 ? 'var(--color-danger)' : '#555', fontWeight: r.remainingAmount > 0 ? 700 : 400 }}>
                {r.remainingAmount > 0 ? formatCurrency(r.remainingAmount) : '-'}
              </td>

              {/* Deposit Amount */}
              <td style={{ textAlign: 'right', fontWeight: 600, color: r.depositAmount > 0 ? 'var(--color-primary)' : '#888' }}>
                {r.depositAmount > 0 ? r.depositAmount.toFixed(0) : '-'}
              </td>

              {/* Paid Status */}
              <td style={{ textAlign: 'center' }}>
                <span className={`rental-status-badge rental-status-${(r.paymentStatus || 'PAID').toLowerCase()}`}>
                  {r.paymentStatus || 'PAID'}
                </span>
              </td>

              {/* Note */}
              <td style={{ fontSize: '11px', color: '#555' }}>
                {r.note || '-'}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Totals Summary Footer */}
        <tfoot>
          <tr className="table-summary-row">
            <td colSpan={14} style={{ fontWeight: 700, padding: '10px 14px', fontSize: '12px' }}>
              TOTAL RENTALS: <span style={{ color: 'var(--color-primary)' }}>{rentals.length}</span>
            </td>
            <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-success)', fontSize: '12px' }}>
              {formatCurrency(totalRentPrice)}
            </td>
            <td colSpan={2}></td>
            <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)', fontSize: '12px' }}>
              {totalDeposit > 0 ? totalDeposit.toFixed(0) : '0'}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
