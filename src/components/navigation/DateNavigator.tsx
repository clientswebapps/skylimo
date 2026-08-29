import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Layers, 
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { 
  formatDateDisplay, 
  addDays, 
  getTodayYMD, 
  getMonthMatrix 
} from '../../utils/dateUtils';
import { getLocalBookings } from '../../services/bookings/bookingService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

interface DateNavigatorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  activeView: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  onAddBooking: () => void;
  addButtonLabel?: string;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onDateChange,
  activeView,
  onViewChange,
  onAddBooking,
  addButtonLabel = 'ADD BOOKING'
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive initial year/month from currentDate (YYYY-MM-DD)
  const [initialYear, initialMonth] = currentDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(initialYear || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth ? initialMonth - 1 : new Date().getMonth());

  // Close calendar popover on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  // Sync internal calendar view when currentDate prop changes externally
  useEffect(() => {
    const [y, m] = currentDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [currentDate]);

  const handlePrev = () => {
    if (activeView === 'day') {
      onDateChange(addDays(currentDate, -1));
    } else if (activeView === 'week') {
      onDateChange(addDays(currentDate, -7));
    } else {
      const [y, m, d] = currentDate.split('-').map(Number);
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;
      const monthStr = String(prevMonth).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      onDateChange(`${prevYear}-${monthStr}-${dayStr}`);
    }
  };

  const handleNext = () => {
    if (activeView === 'day') {
      onDateChange(addDays(currentDate, 1));
    } else if (activeView === 'week') {
      onDateChange(addDays(currentDate, 7));
    } else {
      const [y, m, d] = currentDate.split('-').map(Number);
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      const monthStr = String(nextMonth).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      onDateChange(`${nextYear}-${monthStr}-${dayStr}`);
    }
  };

  const handlePopoverPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handlePopoverNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleDaySelect = (selectedDateStr: string) => {
    onDateChange(selectedDateStr);
    setIsCalendarOpen(false);
  };

  const handleTodayClick = () => {
    const today = getTodayYMD();
    onDateChange(today);
    const [tY, tM] = today.split('-').map(Number);
    setViewYear(tY);
    setViewMonth(tM - 1);
    setIsCalendarOpen(false);
  };

  const handleSelectMonthClick = () => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const [curY, curM] = currentDate.split('-').map(Number);

    let targetDate = '';
    if (curY === viewYear && curM === viewMonth + 1) {
      targetDate = currentDate;
    } else {
      const todayStr = getTodayYMD();
      const [tY, tM] = todayStr.split('-').map(Number);
      if (tY === viewYear && tM === viewMonth + 1) {
        targetDate = todayStr;
      } else {
        targetDate = `${viewYear}-${monthStr}-01`;
      }
    }

    onDateChange(targetDate);
    setIsCalendarOpen(false);
  };

  const todayStr = getTodayYMD();
  const monthMatrix = getMonthMatrix(viewYear, viewMonth);
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const allBookings = getLocalBookings();
  const bookedDatesSet = new Set(allBookings.map((b) => b.date));

  return (
    <div className="page-toolbar date-nav-toolbar">
      {/* Date Navigation & View Switcher */}
      <div className="date-nav-left-group">
        <div className="calendar-picker-container" ref={containerRef}>
          <div className="date-navigator">
            <button className="date-nav-btn" onClick={handlePrev} title="Previous Day">
              <ChevronLeft size={15} />
            </button>
            
            <button 
              type="button"
              className="date-display-picker" 
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              title="Click to open full calendar"
              aria-expanded={isCalendarOpen}
            >
              <CalendarIcon size={13} color="var(--color-primary)" />
              <span>{formatDateDisplay(currentDate)}</span>
            </button>

            <button className="date-nav-btn" onClick={handleNext} title="Next Day">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Interactive Calendar Popover */}
          {isCalendarOpen && (
            <div className="calendar-picker-popover" role="dialog" aria-label="Choose Date">
              {/* Popover Header */}
              <div className="calendar-picker-header">
                <button 
                  type="button" 
                  className="calendar-picker-nav-btn" 
                  onClick={handlePopoverPrevMonth}
                  title="Previous Month"
                >
                  <ChevronLeft size={15} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    className="calendar-picker-select"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    aria-label="Select Month"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  <select
                    className="calendar-picker-select"
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    aria-label="Select Year"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  type="button" 
                  className="calendar-picker-nav-btn" 
                  onClick={handlePopoverNextMonth}
                  title="Next Month"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Day of Week Header */}
              <div className="calendar-picker-days-header">
                {daysOfWeek.map((d) => (
                  <div key={d} className="calendar-picker-day-head">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Day Grid */}
              <div className="calendar-picker-body">
                {monthMatrix.flat().map((item, idx) => {
                  const isSelected = item.date === currentDate;
                  const isToday = item.date === todayStr;
                  const hasTrips = bookedDatesSet.has(item.date);

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`calendar-picker-cell ${!item.isCurrentMonth ? 'inactive' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDaySelect(item.date)}
                      title={`${item.date} ${hasTrips ? '(Has bookings)' : ''}`}
                    >
                      <span>{item.dayNumber}</span>
                      {hasTrips && <span className="calendar-picker-trip-dot" />}
                    </button>
                  );
                })}
              </div>

              {/* Popover Footer */}
              <div className="calendar-picker-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  onClick={handleSelectMonthClick}
                  title={`Select ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                >
                  <Check size={12} />
                  <span>Select</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  onClick={handleTodayClick}
                  title="Jump to Today's bookings"
                >
                  <RotateCcw size={11} color="var(--color-primary)" />
                  <span>Today</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setIsCalendarOpen(false)}
                >
                  <X size={11} />
                  <span>Close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="view-filter-group" role="group" aria-label="Filter view mode">
          <span className="view-filter-label">
            <Layers size={12} color="var(--color-primary)" />
            <span>View:</span>
          </span>
          <div className="view-switcher">
            <button 
              type="button"
              className={`view-tab ${activeView === 'day' ? 'active' : ''}`}
              onClick={() => onViewChange('day')}
              title="Daily spreadsheet view"
            >
              Day
            </button>
            <button 
              type="button"
              className={`view-tab ${activeView === 'week' ? 'active' : ''}`}
              onClick={() => onViewChange('week')}
              title="Weekly schedule view"
            >
              Week
            </button>
            <button 
              type="button"
              className={`view-tab ${activeView === 'month' ? 'active' : ''}`}
              onClick={() => onViewChange('month')}
              title="Monthly calendar view"
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="date-nav-right-group">
        <button className="btn btn-primary btn-add-booking-top" onClick={onAddBooking}>
          <Plus size={14} />
          <span>{addButtonLabel}</span>
        </button>
      </div>
    </div>
  );
};
