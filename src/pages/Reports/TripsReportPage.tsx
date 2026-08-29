import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  DollarSign, 
  Users 
} from 'lucide-react';
import type { Booking, Driver } from '../../types';
import { BookingService } from '../../services/bookings/bookingService';
import { DriverService } from '../../services/drivers/driverService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currencyUtils';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export const TripsReportPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Month and Year state (default to August 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(7); // 7 = August (0-indexed)

  const { showToast } = useToast();

  useEffect(() => {
    const unsubBookings = BookingService.subscribeAll((data) => {
      setBookings(data);
    });
    const unsubDrivers = DriverService.subscribe(setDrivers);

    return () => {
      unsubBookings();
      unsubDrivers();
    };
  }, []);

  const monthPrefix = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
  const monthName = MONTH_NAMES[selectedMonthIndex];

  // Navigate month
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonthIndex((m) => m + 1);
    }
  };

  // Filter bookings for the selected month
  const monthBookings = useMemo(() => {
    return bookings.filter((b) => b.date && b.date.startsWith(monthPrefix));
  }, [bookings, monthPrefix]);

  // Financial Breakdown by Payment Channel
  const financialTotals = useMemo(() => {
    let cash = 0;
    let card = 0;
    let bankTransfer = 0;
    let credit = 0;
    let commission = 0;

    monthBookings.forEach((b) => {
      cash += Number(b.cash) || 0;
      card += Number(b.card) || 0;
      bankTransfer += Number(b.bankTransfer) || 0;
      credit += Number(b.credit) || 0;
      commission += Number(b.commission) || 0;
    });

    const totalEarning = cash + card + bankTransfer + credit + commission;

    return {
      cash,
      card,
      bankTransfer,
      credit,
      commission,
      totalEarning
    };
  }, [monthBookings]);

  // Driver Performance Breakdown
  const driverStats = useMemo(() => {
    // Collect all driver names
    const driverNameMap = new Map<string, { totalTrips: number; totalEarning: number }>();

    // Seed from active driver list
    drivers.forEach((d) => {
      if (d.name) {
        driverNameMap.set(d.name.trim(), { totalTrips: 0, totalEarning: 0 });
      }
    });

    // Aggregate from month bookings
    monthBookings.forEach((b) => {
      const driverName = b.driver?.trim() || 'Unassigned';
      const tripTotal = (Number(b.cash) || 0) + 
                        (Number(b.card) || 0) + 
                        (Number(b.bankTransfer) || 0) + 
                        (Number(b.credit) || 0) + 
                        (Number(b.commission) || 0);

      const existing = driverNameMap.get(driverName) || { totalTrips: 0, totalEarning: 0 };
      driverNameMap.set(driverName, {
        totalTrips: existing.totalTrips + 1,
        totalEarning: existing.totalEarning + tripTotal
      });
    });

    const result = Array.from(driverNameMap.entries()).map(([name, stat]) => ({
      name,
      totalTrips: stat.totalTrips,
      totalEarning: stat.totalEarning
    }));

    // Sort by earning descending or keep known order
    return result.filter((d) => d.name !== 'Unassigned' || d.totalTrips > 0);
  }, [drivers, monthBookings]);

  const totalTripsAllDrivers = monthBookings.length;

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (monthBookings.length === 0) {
      showToast('No bookings to export for this month', 'info');
      return;
    }

    const lines: string[] = [];
    lines.push(`SKYLIMO ${monthName} ${selectedYear} BOOKING TRIPS REPORT`);
    lines.push('');
    lines.push('PAYMENT CHANNEL BREAKDOWN');
    lines.push('CASH,CARD,BANK TRANSFER,CREDIT,COMMISSION,TOTAL EARNING');
    lines.push([
      financialTotals.cash.toFixed(3),
      financialTotals.card.toFixed(3),
      financialTotals.bankTransfer.toFixed(3),
      financialTotals.credit.toFixed(3),
      financialTotals.commission.toFixed(3),
      financialTotals.totalEarning.toFixed(3)
    ].join(','));
    lines.push('');
    lines.push('DRIVERS AND TRIPS SUMMARY');
    lines.push('DRIVER NAME,TOTAL TRIPS,TOTAL EARNING');
    driverStats.forEach((d) => {
      lines.push(`"${d.name}",${d.totalTrips},${d.totalEarning.toFixed(3)}`);
    });
    lines.push(`TOTAL TRIPS OF ALL DRIVERS,${totalTripsAllDrivers},${financialTotals.totalEarning.toFixed(3)}`);

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKYLIMO_${monthName}_${selectedYear}_REPORT.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported to CSV', 'success');
  };

  // Chart Data Calculations
  const incomeChannels = [
    { label: 'CASH', amount: financialTotals.cash, color: '#EAB308' },
    { label: 'CARD', amount: financialTotals.card, color: '#06B6D4' },
    { label: 'BANK TRANSFER', amount: financialTotals.bankTransfer, color: '#22C55E' },
    { label: 'CREDIT', amount: financialTotals.credit, color: '#EF4444' },
    { label: 'COMMISSION', amount: financialTotals.commission, color: '#F97316' }
  ];

  const maxIncomeVal = Math.max(...incomeChannels.map((c) => c.amount), 100);
  const maxDriverVal = Math.max(...driverStats.map((d) => d.totalEarning), 100);

  return (
    <div className="page-container report-page-container">
      {/* 1. Page Header & Actions Toolbar */}
      <div className="page-toolbar report-toolbar hide-on-print">
        <div className="page-title-group">
          <h2 className="page-title">
            SKYLIMO {monthName} {selectedYear} BOOKING TRIPS REPORT
          </h2>
          <span className="page-title-badge">{totalTripsAllDrivers} TOTAL TRIPS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Month Selector */}
          <div className="date-nav-center-group" style={{ display: 'flex', alignItems: 'center', background: '#FFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px 4px' }}>
            <button
              type="button"
              className="date-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontWeight: 800, fontSize: '12px', padding: '0 10px', letterSpacing: '0.5px' }}>
              {monthName} {selectedYear}
            </span>

            <button
              type="button"
              className="date-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
            <Download size={13} />
            <span className="hide-mobile">Export CSV</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={handlePrint} title="Print or Save PDF">
            <Printer size={13} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          REPORT PRINTABLE DOCUMENT BODY (Matches PDF Layout)
          ───────────────────────────────────────────────────────────── */}
      <div className="report-sheet-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Printable Title Banner */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
            SKYLIMO OPERATIONS MANAGEMENT
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.2px' }}>
            SKYLIMO {monthName} {selectedYear} BOOKING TRIPS REPORT
          </h1>
          <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            Official Monthly Operational Revenue & Driver Trips Summary
          </p>
        </div>

        {/* Top Summary Tables Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(380px, 2fr)', gap: '20px', alignItems: 'start' }}>
          
          {/* 1. EARNING (Payment Method Breakdown Table) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #10B981', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th colSpan={5} style={{ backgroundColor: '#A7F3D0', color: '#065F46', padding: '6px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px', borderBottom: '1px solid #10B981' }}>
                      EARNING
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: '#D1FAE5', color: '#047857', fontWeight: 700, fontSize: '10px' }}>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #A7F3D0' }}>CASH</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #A7F3D0' }}>CARD</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #A7F3D0' }}>BANK TRANSFER</th>
                    <th style={{ padding: '6px 4px', borderRight: '1px solid #A7F3D0' }}>CREDIT</th>
                    <th style={{ padding: '6px 4px' }}>COMMISSION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#FFFFFF', fontWeight: 700, color: '#111827' }}>
                    <td style={{ padding: '8px 4px', borderRight: '1px solid #E5E7EB' }}>{formatCurrency(financialTotals.cash)}</td>
                    <td style={{ padding: '8px 4px', borderRight: '1px solid #E5E7EB' }}>{formatCurrency(financialTotals.card)}</td>
                    <td style={{ padding: '8px 4px', borderRight: '1px solid #E5E7EB' }}>{formatCurrency(financialTotals.bankTransfer)}</td>
                    <td style={{ padding: '8px 4px', borderRight: '1px solid #E5E7EB' }}>{formatCurrency(financialTotals.credit)}</td>
                    <td style={{ padding: '8px 4px' }}>{formatCurrency(financialTotals.commission)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Earning Box */}
            <div style={{ alignSelf: 'flex-end', display: 'inline-flex', border: '1px solid #10B981', borderRadius: '4px', overflow: 'hidden', fontSize: '11px' }}>
              <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 800, padding: '6px 12px' }}>
                TOTAL EARNING
              </div>
              <div style={{ backgroundColor: '#FFFFFF', color: '#111827', fontWeight: 900, padding: '6px 14px' }}>
                {formatCurrency(financialTotals.totalEarning)}
              </div>
            </div>
          </div>

          {/* 2. DRIVERS AND TRIP Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #F97316', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th colSpan={driverStats.length + 1} style={{ backgroundColor: '#FED7AA', color: '#9A3412', padding: '6px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px', borderBottom: '1px solid #F97316' }}>
                      DRIVERS AND TRIP
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 700, fontSize: '10px' }}>
                    <th style={{ padding: '6px 8px', borderRight: '1px solid #FDBA74', textAlign: 'left', minWidth: '90px' }}>NAME</th>
                    {driverStats.map((d) => (
                      <th key={d.name} style={{ padding: '6px 8px', borderRight: '1px solid #FDBA74', minWidth: '70px', textTransform: 'uppercase' }}>
                        {d.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#FFFFFF', fontWeight: 700, color: '#111827' }}>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', textAlign: 'left', color: '#4B5563', fontSize: '10px' }}>
                      TOTAL TRIP
                    </td>
                    {driverStats.map((d) => (
                      <td key={d.name} style={{ padding: '6px 8px', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                        {d.totalTrips}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ backgroundColor: '#F9FAFB', fontWeight: 800, color: '#111827' }}>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #E5E7EB', textAlign: 'left', color: '#4B5563', fontSize: '10px' }}>
                      TOTAL EARNING
                    </td>
                    {driverStats.map((d) => (
                      <td key={d.name} style={{ padding: '6px 8px', borderRight: '1px solid #E5E7EB' }}>
                        {formatCurrency(d.totalEarning)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Trips Summary Box */}
            <div style={{ alignSelf: 'flex-start', display: 'inline-flex', border: '1px solid #F97316', borderRadius: '4px', overflow: 'hidden', fontSize: '11px' }}>
              <div style={{ backgroundColor: '#FFEDD5', color: '#9A3412', fontWeight: 800, padding: '6px 12px' }}>
                TOTAL TRIP OF ALL DRIVER
              </div>
              <div style={{ backgroundColor: '#FFFFFF', color: '#111827', fontWeight: 900, padding: '6px 14px' }}>
                {totalTripsAllDrivers}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            VISUAL CHARTS SECTION (INCOME & DRIVERS INCOME)
            ───────────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '10px' }}>
          
          {/* Chart 1: INCOME by Payment Channel */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', letterSpacing: '-0.2px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} color="var(--color-primary)" />
              INCOME
            </h3>

            {/* SVG Bar Chart */}
            <div style={{ width: '100%', height: '240px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none">
                {/* Background Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={170 - pct * 140}
                    x2="390"
                    y2={170 - pct * 140}
                    stroke="#F3F4F6"
                    strokeWidth="1"
                  />
                ))}

                {/* Bars */}
                {incomeChannels.map((c, i) => {
                  const barWidth = 42;
                  const barSpacing = 68;
                  const x = 50 + i * barSpacing;
                  const barHeight = maxIncomeVal > 0 ? (c.amount / maxIncomeVal) * 140 : 0;
                  const y = 170 - barHeight;

                  return (
                    <g key={c.label}>
                      {/* Bar shadow */}
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        fill="#000000"
                        opacity="0.06"
                        rx="3"
                      />
                      {/* Bar Body */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        fill={c.color}
                        rx="3"
                      />
                      {/* Amount Label on top */}
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(y - 6, 15)}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="800"
                        fill="#1F2937"
                      >
                        {formatCurrency(c.amount)}
                      </text>
                      {/* Category Label at bottom */}
                      <text
                        x={x + barWidth / 2}
                        y="190"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="700"
                        fill="#4B5563"
                      >
                        {c.label}
                      </text>
                    </g>
                  );
                })}

                {/* Base Axis Line */}
                <line x1="40" y1="170" x2="390" y2="170" stroke="#9CA3AF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Chart 2: DRIVERS INCOME */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', letterSpacing: '-0.2px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="var(--color-primary)" />
              DRIVERS INCOME
            </h3>

            {/* SVG Bar Chart for Drivers */}
            <div style={{ width: '100%', height: '240px', position: 'relative', overflowX: 'auto' }}>
              <svg 
                width={Math.max(driverStats.length * 60 + 60, 400)} 
                height="220" 
                viewBox={`0 0 ${Math.max(driverStats.length * 60 + 60, 400)} 220`}
              >
                {/* Background Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={170 - pct * 140}
                    x2={driverStats.length * 60 + 40}
                    y2={170 - pct * 140}
                    stroke="#F3F4F6"
                    strokeWidth="1"
                  />
                ))}

                {/* Driver Bars */}
                {driverStats.map((d, i) => {
                  const barWidth = 34;
                  const x = 50 + i * 58;
                  const barHeight = maxDriverVal > 0 ? (d.totalEarning / maxDriverVal) * 140 : 0;
                  const y = 170 - barHeight;

                  return (
                    <g key={d.name}>
                      {/* Bar Shadow */}
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        fill="#000000"
                        opacity="0.06"
                        rx="3"
                      />
                      {/* Bar Body */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        fill="#06B6D4"
                        rx="3"
                      />
                      {/* Amount Label on top */}
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(y - 6, 15)}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="800"
                        fill="#1F2937"
                      >
                        {formatCurrency(d.totalEarning)}
                      </text>
                      {/* Driver Name at bottom */}
                      <text
                        x={x + barWidth / 2}
                        y="188"
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill="#374151"
                      >
                        {d.name.length > 8 ? d.name.substring(0, 7) + '..' : d.name}
                      </text>
                      {/* Trip count badge */}
                      <text
                        x={x + barWidth / 2}
                        y="200"
                        textAnchor="middle"
                        fontSize="7.5"
                        fontWeight="600"
                        fill="#6B7280"
                      >
                        {d.totalTrips} trips
                      </text>
                    </g>
                  );
                })}

                {/* Base Axis Line */}
                <line x1="40" y1="170" x2={driverStats.length * 60 + 40} y2="170" stroke="#9CA3AF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer Signature & Notes in Print */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', fontSize: '10px', color: '#9CA3AF' }}>
          <div>Generated by SkyLimo Trips Operations System</div>
          <div>All figures in Bahraini Dinar (BHD)</div>
        </div>
      </div>
    </div>
  );
};
