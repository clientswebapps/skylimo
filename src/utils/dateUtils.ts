/**
 * Date utilities for SkyLimo application
 */

// Formats a Date object to YYYY-MM-DD string
export function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parses a YYYY-MM-DD string into a local Date object
export function parseDateYMD(ymdStr: string): Date {
  if (!ymdStr) return new Date();
  const [year, month, day] = ymdStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

// Formats YYYY-MM-DD into "24/08/2026"
export function formatDateDisplay(ymdStr: string): string {
  if (!ymdStr) return '';
  const [year, month, day] = ymdStr.split('-');
  if (!year || !month || !day) return ymdStr;
  return `${day}/${month}/${year}`;
}

// Formats YYYY-MM-DD into "24/08/2026 — MONDAY BOOKING TRIPS"
export function formatDailyHeader(ymdStr: string): string {
  if (!ymdStr) return '';
  const date = parseDateYMD(ymdStr);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const formattedDate = formatDateDisplay(ymdStr);
  return `${formattedDate} — ${dayName} BOOKING TRIPS`;
}

// Gets Month and Year label, e.g. "AUGUST 2026"
export function formatMonthHeader(ymdStr: string): string {
  const date = parseDateYMD(ymdStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

// Navigates +1 or -1 day
export function addDays(ymdStr: string, days: number): string {
  const date = parseDateYMD(ymdStr);
  date.setDate(date.getDate() + days);
  return formatDateYMD(date);
}

// Navigates +1 or -1 month
export function addMonths(ymdStr: string, months: number): string {
  const date = parseDateYMD(ymdStr);
  date.setMonth(date.getMonth() + months);
  return formatDateYMD(date);
}

// Gets the Monday of the week for a given date
export function getStartOfWeek(ymdStr: string): Date {
  const date = parseDateYMD(ymdStr);
  const day = date.getDay(); // 0 is Sun, 1 is Mon
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const start = new Date(date);
  start.setDate(diff);
  return start;
}

// Gets array of 7 dates (YYYY-MM-DD) for the given week
export function getWeekDates(ymdStr: string): string[] {
  const start = getStartOfWeek(ymdStr);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatDateYMD(d));
  }
  return dates;
}

// Gets calendar matrix for monthly view (weeks array)
export function getMonthMatrix(year: number, monthIndex: number): { date: string; dayNumber: number; isCurrentMonth: boolean }[][] {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const totalDays = lastDay.getDate();
  
  const matrix: { date: string; dayNumber: number; isCurrentMonth: boolean }[][] = [];
  let currentWeek: { date: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, monthIndex - 1, dayNum);
    currentWeek.push({
      date: formatDateYMD(prevDate),
      dayNumber: dayNum,
      isCurrentMonth: false
    });
  }
  
  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(year, monthIndex, d);
    currentWeek.push({
      date: formatDateYMD(curDate),
      dayNumber: d,
      isCurrentMonth: true
    });
    
    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Next month padding
  if (currentWeek.length > 0) {
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      const nextDate = new Date(year, monthIndex + 1, nextMonthDay);
      currentWeek.push({
        date: formatDateYMD(nextDate),
        dayNumber: nextMonthDay,
        isCurrentMonth: false
      });
      nextMonthDay++;
    }
    matrix.push(currentWeek);
  }
  
  return matrix;
}

export function getTodayYMD(): string {
  return formatDateYMD(new Date());
}
