function isValidDateString(text) {
  if (typeof text !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;

  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year
    && date.getMonth() + 1 === month
    && date.getDate() === day;
}

function isValidSession(session) {
  if (!session || typeof session !== 'object') return false;
  if (typeof session.date !== 'string') return false;
  if (!isValidDateString(session.date)) return false;
  if (typeof session.minutes !== 'number' || !Number.isFinite(session.minutes)) return false;
  if (session.minutes < 0) return false;
  return true;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sumMinutesByDay(sessions) {
  const totals = new Map();
  for (const session of sessions) {
    if (!isValidSession(session)) continue;
    const current = totals.get(session.date) || 0;
    totals.set(session.date, current + session.minutes);
  }
  return totals;
}

function colorForMinutes(minutes) {
  if (minutes <= 0) return 'empty';
  if (minutes <= 30) return 'level-1';
  if (minutes <= 60) return 'level-2';
  if (minutes <= 120) return 'level-3';
  return 'level-4';
}

function getWeekStart(today) {
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekday = weekStart.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  weekStart.setDate(weekStart.getDate() - daysFromMonday);
  return weekStart;
}

function getHeatMapRange(today, weeks = 12) {
  const weekStart = getWeekStart(today);
  const start = new Date(weekStart);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + weeks * 7 - 1);
  return { start, end };
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function buildHeatMap(sessions, today, weeks = 12) {
  const totals = sumMinutesByDay(sessions);
  const { start } = getHeatMapRange(today, weeks);
  const todayKey = toDateKey(today);
  const totalCells = weeks * 7;
  const cells = [];

  for (let i = 0; i < totalCells; i++) {
    const date = addDays(start, i);
    const key = toDateKey(date);
    const raw = totals.get(key) || 0;
    const isFuture = key > todayKey;
    const level = colorForMinutes(Math.round(raw));

    cells.push({
      date: key,
      minutes: raw,
      level,
      isFuture,
      isOutOfRange: isFuture
    });
  }

  return cells;
}

const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTH_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function formatDateShort(date) {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
}

function formatDateRange(start, end) {
  return `${formatDateShort(start)} — ${formatDateShort(end)}`;
}

function formatDayLabel(dateKey, minutes) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dateText = `${day} de ${MONTH_LONG[month - 1]}`;
  if (minutes > 0) return `${dateText}: ${minutes} minutos`;
  return `${dateText}: sin estudio`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidDateString,
    isValidSession,
    toDateKey,
    sumMinutesByDay,
    colorForMinutes,
    getWeekStart,
    getHeatMapRange,
    buildHeatMap,
    formatDateRange,
    formatDayLabel
  };
}
