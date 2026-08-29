import React, { useState, useMemo } from 'react';
import type { Booking } from '../../types';
import { formatTotalCurrency } from '../../utils/currencyUtils';

interface TripsGradientChartProps {
  bookings: Booking[];
}

type Timeframe = 'daily' | 'weekly' | 'monthly';

interface DataPoint {
  label: string;
  subLabel?: string;
  count: number;
  revenue: number;
  completed: number;
}

export const TripsGradientChart: React.FC<TripsGradientChartProps> = ({ bookings }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate chart data points based on selected timeframe
  const chartData: DataPoint[] = useMemo(() => {
    const today = new Date();

    if (timeframe === 'daily') {
      // Last 7 days
      const points: DataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ymd = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

        const dayBookings = bookings.filter((b) => b.date === ymd);
        const revenue = dayBookings.reduce(
          (sum, b) => sum + (Number(b.cash) || 0) + (Number(b.card) || 0) + (Number(b.bankTransfer) || 0) + (Number(b.credit) || 0),
          0
        );
        const completed = dayBookings.filter((b) => b.status === 'Completed').length;

        points.push({
          label: `${dayName} ${dayNum}`,
          subLabel: `${dayNum} ${monthShort}`,
          count: dayBookings.length,
          revenue,
          completed
        });
      }
      return points;
    }

    if (timeframe === 'weekly') {
      // Last 6 weeks
      const points: DataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const endDay = new Date(today);
        endDay.setDate(today.getDate() - i * 7);
        const startDay = new Date(endDay);
        startDay.setDate(endDay.getDate() - 6);

        const startYMD = startDay.toISOString().split('T')[0];
        const endYMD = endDay.toISOString().split('T')[0];

        const weekBookings = bookings.filter((b) => b.date >= startYMD && b.date <= endYMD);
        const revenue = weekBookings.reduce(
          (sum, b) => sum + (Number(b.cash) || 0) + (Number(b.card) || 0) + (Number(b.bankTransfer) || 0) + (Number(b.credit) || 0),
          0
        );
        const completed = weekBookings.filter((b) => b.status === 'Completed').length;

        const startLabel = startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endLabel = endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        points.push({
          label: `Wk ${6 - i}`,
          subLabel: `${startLabel} - ${endLabel}`,
          count: weekBookings.length,
          revenue,
          completed
        });
      }
      return points;
    }

    // Monthly (12 months of current year)
    const currentYear = today.getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const monthBookings = bookings.filter((b) => b.date && b.date.startsWith(monthPrefix));
      const revenue = monthBookings.reduce(
        (sum, b) => sum + (Number(b.cash) || 0) + (Number(b.card) || 0) + (Number(b.bankTransfer) || 0) + (Number(b.credit) || 0),
        0
      );
      const completed = monthBookings.filter((b) => b.status === 'Completed').length;

      return {
        label: m,
        subLabel: `${m} ${currentYear}`,
        count: monthBookings.length,
        revenue,
        completed
      };
    });
  }, [bookings, timeframe]);

  // Calculations for graph geometry
  const maxCount = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => d.count), 0);
    return highest === 0 ? 5 : Math.ceil(highest * 1.25);
  }, [chartData]);

  const totalPeriodTrips = useMemo(() => chartData.reduce((s, d) => s + d.count, 0), [chartData]);
  const totalPeriodRevenue = useMemo(() => chartData.reduce((s, d) => s + d.revenue, 0), [chartData]);
  const avgTrips = useMemo(() => (chartData.length ? (totalPeriodTrips / chartData.length).toFixed(1) : '0'), [chartData, totalPeriodTrips]);

  // SVG dimensions
  const width = 800;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute point coordinates
  const points = useMemo(() => {
    if (chartData.length <= 1) return [];
    return chartData.map((d, i) => {
      const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.count / maxCount) * chartHeight;
      return { x, y, data: d, index: i };
    });
  }, [chartData, maxCount, chartWidth, chartHeight]);

  // Generate smooth SVG Bézier path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${p.y} L ${p.x} ${paddingTop + chartHeight} Z`
      };
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = paddingTop + chartHeight;

    const area = `${d} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { linePath: d, areaPath: area };
  }, [points, chartHeight]);

  // Y-axis grid ticks (4 intervals)
  const yTicks = useMemo(() => {
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const val = Math.round((maxCount / count) * i);
      const y = paddingTop + chartHeight - (val / maxCount) * chartHeight;
      ticks.push({ val, y });
    }
    return ticks;
  }, [maxCount, chartHeight]);

  return (
    <div style={{
      backgroundColor: 'var(--color-white)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '12px 18px',
        backgroundColor: 'var(--color-black)',
        color: 'var(--color-white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '2px solid var(--color-primary)'
      }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Trip Velocity & Volume Trends
          </span>
          <span style={{ fontSize: '11px', color: '#AAA', marginLeft: '10px' }}>
            {timeframe === 'daily' ? 'Last 7 Days' : timeframe === 'weekly' ? 'Last 6 Weeks' : '12-Month Progression'}
          </span>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div style={{ display: 'flex', backgroundColor: '#222', borderRadius: '4px', padding: '2px', gap: '2px' }}>
          {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                setTimeframe(tf);
                setHoveredIndex(null);
              }}
              style={{
                background: timeframe === tf ? 'var(--color-primary)' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: timeframe === tf ? 800 : 500,
                borderRadius: '3px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.15s ease'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '10px 16px',
        backgroundColor: '#FBFBFB',
        borderBottom: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Period Trips</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>{totalPeriodTrips}</div>
        </div>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Period Revenue</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-success)' }}>BHD {formatTotalCurrency(totalPeriodRevenue)}</div>
        </div>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Average Velocity</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#333' }}>{avgTrips} <span style={{ fontSize: '10px', color: '#888' }}>/ {timeframe === 'daily' ? 'day' : timeframe === 'weekly' ? 'week' : 'mo'}</span></div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ padding: '16px 12px 10px', position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '550px' }}
        >
          <defs>
            {/* Gradient Fill under the curve */}
            <linearGradient id="tripGradientShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#DC2626" stopOpacity="0.18" />
              <stop offset="85%" stopColor="#DC2626" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#DC2626" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={t.y}
                x2={width - paddingRight}
                y2={t.y}
                stroke="#EAEAEA"
                strokeDasharray={idx === 0 ? '0' : '4 4'}
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 8}
                y={t.y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#999"
                fontWeight="600"
              >
                {t.val}
              </text>
            </g>
          ))}

          {/* Area Gradient */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#tripGradientShade)"
            />
          )}

          {/* Main Curve Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#DC2626"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {/* Data Points & X-Axis Labels */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx} style={{ cursor: 'pointer' }}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={paddingTop + chartHeight}
                    stroke="rgba(220, 38, 38, 0.4)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                {/* Point Outer Ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7 : 4.5}
                  fill="#FFFFFF"
                  stroke="#DC2626"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Point Center Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 3.5 : 2}
                  fill="#DC2626"
                />

                {/* Value Pill above point */}
                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={isHovered ? '#DC2626' : '#444'}
                >
                  {p.data.count}
                </text>

                {/* X-Axis Label */}
                <text
                  x={p.x}
                  y={paddingTop + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isHovered ? '800' : '600'}
                  fill={isHovered ? 'var(--color-primary)' : '#666'}
                >
                  {p.data.label}
                </text>

                {/* Invisible hit-box for easy hovering */}
                <rect
                  x={p.x - 25}
                  y={paddingTop}
                  width={50}
                  height={chartHeight + 30}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovered */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div style={{
            position: 'absolute',
            left: `${Math.min(Math.max(points[hoveredIndex].x - 60, 20), width - 150)}px`,
            top: '20px',
            backgroundColor: 'rgba(20, 20, 20, 0.94)',
            backdropFilter: 'blur(4px)',
            color: '#FFF',
            padding: '8px 12px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            fontSize: '11px',
            pointerEvents: 'none',
            zIndex: 10,
            borderLeft: '3px solid var(--color-primary)'
          }}>
            <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: '3px' }}>
              {points[hoveredIndex].data.subLabel || points[hoveredIndex].data.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#AAA' }}>Total Trips:</span>
              <span style={{ fontWeight: 800, color: '#FFF' }}>{points[hoveredIndex].data.count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#AAA' }}>Completed:</span>
              <span style={{ fontWeight: 700, color: '#4ADE80' }}>{points[hoveredIndex].data.completed}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#AAA' }}>Revenue:</span>
              <span style={{ fontWeight: 700, color: '#FCD34D' }}>BHD {formatTotalCurrency(points[hoveredIndex].data.revenue)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
