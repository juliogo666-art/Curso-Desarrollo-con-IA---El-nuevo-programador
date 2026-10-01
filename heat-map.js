function isValidDateString(text) {
  if (typeof text !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;

  const [year, month, day] = text.split('-').map(Number);

  // Numeric constructor interprets in local time (never UTC).
  const date = new Date(year, month - 1, day);

  // Reject dates that overflowed into another month or year (2026-02-30).
  return date.getFullYear() === year
    && date.getMonth() + 1 === month
    && date.getDate() === day;
}

function getMinutesByDay(sesiones) {
  const minutosPorDia = {};
  for (const s of sesiones) {
    if (!s.fecha || typeof s.minutos !== 'number' || s.minutos < 0) continue;
    minutosPorDia[s.fecha] = (minutosPorDia[s.fecha] || 0) + s.minutos;
  }
  return minutosPorDia;
}

function getColorForMinutes(minutos) {
  if (minutos <= 0) return 'empty';
  if (minutos <= 30) return 'level-1';
  if (minutos <= 60) return 'level-2';
  if (minutos <= 120) return 'level-3';
  return 'level-4';
}

function formatDateLocal(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getWeeksRange(today, weeks = 12) {
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const end = new Date(today);

  return { start, end };
}

function buildHeatMap(sesiones, today) {
  const minutosPorDia = getMinutesByDay(sesiones);
  const { start, end } = getWeeksRange(today);

  const days = [];
  const current = new Date(start);

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const day = current.getDate();
    const dateStr = formatDateLocal(year, month, day);
    const minutes = minutosPorDia[dateStr] || 0;
    const isFuture = current > today;

    days.push({
      date: dateStr,
      minutes,
      color: isFuture ? 'empty' : getColorForMinutes(minutes),
      isFuture
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

function formatDateShort(date) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function formatDateRange(start, end) {
  return `${formatDateShort(start)} — ${formatDateShort(end)}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getMinutesByDay, getColorForMinutes, getWeeksRange, buildHeatMap, formatDateRange, isValidDateString };
}
