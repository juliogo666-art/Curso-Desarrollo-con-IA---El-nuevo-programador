const { test } = require('node:test');
const assert = require('node:assert');
const {
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
} = require('../heat-map.js');

function weekday(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

test('isValidDateString acepta una fecha real con formato correcto', () => {
  assert.strictEqual(isValidDateString('2026-10-01'), true);
  assert.strictEqual(isValidDateString('2026-02-28'), true);
  assert.strictEqual(isValidDateString('2024-02-29'), true);
});

test('isValidDateString rechaza fechas que no existen en el calendario', () => {
  assert.strictEqual(isValidDateString('2026-02-30'), false);
  assert.strictEqual(isValidDateString('2026-13-01'), false);
  assert.strictEqual(isValidDateString('2025-02-29'), false);
});

test('isValidDateString rechaza formato incorrecto y valores que no son cadena', () => {
  assert.strictEqual(isValidDateString('26-10-01'), false);
  assert.strictEqual(isValidDateString('2026-10-1'), false);
  assert.strictEqual(isValidDateString(''), false);
  assert.strictEqual(isValidDateString(null), false);
  assert.strictEqual(isValidDateString(20261001), false);
});

test('isValidSession acepta minutos 0 y rechaza inválidos', () => {
  assert.strictEqual(isValidSession({ date: '2026-10-01', minutes: 0 }), true);
  assert.strictEqual(isValidSession({ date: '2026-10-01', minutes: -1 }), false);
  assert.strictEqual(isValidSession({ date: '2026-10-01', minutes: '45' }), false);
  assert.strictEqual(isValidSession(undefined), false);
});

test('sumMinutesByDay suma el mismo día y filtra inválidos', () => {
  const totals = sumMinutesByDay([
    { date: '2026-10-01', minutes: 30 },
    { date: '2026-10-01', minutes: 20 },
    { date: null, minutes: 20 },
    { date: '2026-10-02', minutes: -10 },
    { date: '2026-10-03', minutes: '45' },
    { date: '2026-10-04', minutes: 0 }
  ]);
  assert.strictEqual(totals.get('2026-10-01'), 50);
  assert.strictEqual(totals.has('2026-10-02'), false);
  assert.strictEqual(totals.has('2026-10-03'), false);
  assert.strictEqual(totals.get('2026-10-04'), 0);
  assert.strictEqual(sumMinutesByDay([]).size, 0);
});

test('colorForMinutes cubre las fronteras de cada nivel', () => {
  assert.strictEqual(colorForMinutes(0), 'empty');
  assert.strictEqual(colorForMinutes(1), 'level-1');
  assert.strictEqual(colorForMinutes(30), 'level-1');
  assert.strictEqual(colorForMinutes(31), 'level-2');
  assert.strictEqual(colorForMinutes(60), 'level-2');
  assert.strictEqual(colorForMinutes(61), 'level-3');
  assert.strictEqual(colorForMinutes(120), 'level-3');
  assert.strictEqual(colorForMinutes(121), 'level-4');
  assert.strictEqual(colorForMinutes(10000), 'level-4');
  assert.strictEqual(colorForMinutes(-5), 'empty');
});

test('toDateKey formatea fecha local con ceros a la izquierda', () => {
  assert.strictEqual(toDateKey(new Date(2026, 9, 1)), '2026-10-01');
  assert.strictEqual(toDateKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('getWeekStart devuelve el lunes de la semana', () => {
  const thursday = getWeekStart(new Date(2026, 9, 1));
  const monday = getWeekStart(new Date(2026, 8, 28));
  const sunday = getWeekStart(new Date(2026, 9, 4));
  assert.strictEqual(toDateKey(thursday), '2026-09-28');
  assert.strictEqual(toDateKey(monday), '2026-09-28');
  assert.strictEqual(toDateKey(sunday), '2026-09-28');
});

test('getHeatMapRange cubre 12 semanas de lunes a domingo', () => {
  const { start, end } = getHeatMapRange(new Date(2026, 9, 1), 12);
  assert.strictEqual(start.getDay(), 1);
  assert.strictEqual(end.getDay(), 0);
  assert.strictEqual(toDateKey(start), '2026-07-13');
  assert.strictEqual(toDateKey(end), '2026-10-04');
});

test('getHeatMapRange conserva lunes y domingo al cruzar el cambio de hora', () => {
  const { start, end } = getHeatMapRange(new Date(2026, 2, 30), 12);
  assert.strictEqual(start.getDay(), 1);
  assert.strictEqual(end.getDay(), 0);
  const cells = buildHeatMap([], new Date(2026, 2, 30));
  assert.strictEqual(cells.length, 84);
});

test('buildHeatMap genera 84 celdas alineadas de lunes a domingo', () => {
  const today = new Date(2026, 9, 1);
  const cells = buildHeatMap([], today);
  assert.strictEqual(cells.length, 84);
  assert.strictEqual(weekday(cells[0].date), 1);
  for (let i = 0; i < 12; i++) {
    assert.strictEqual(weekday(cells[i * 7].date), 1);
    assert.strictEqual(weekday(cells[i * 7 + 6].date), 0);
  }
  assert.ok(cells.every((cell) => cell.level === 'empty'));
});

test('buildHeatMap redondea minutos antes de asignar color', () => {
  const today = new Date(2026, 9, 1);
  const cells = buildHeatMap([{ date: '2026-10-01', minutes: 120.4 }], today);
  const day = cells.find((cell) => cell.date === '2026-10-01');
  assert.strictEqual(day.level, 'level-3');
});

test('buildHeatMap colorea una sesión futura dentro de la ventana', () => {
  const today = new Date(2026, 9, 1);
  const cells = buildHeatMap([{ date: '2026-10-03', minutes: 45 }], today);
  const future = cells.find((cell) => cell.date === '2026-10-03');
  assert.ok(future);
  assert.strictEqual(future.isFuture, true);
  assert.strictEqual(future.level, 'level-2');
});

test('buildHeatMap deja en gris un día futuro sin sesión', () => {
  const today = new Date(2026, 9, 1);
  const future = buildHeatMap([], today).find((cell) => cell.date === '2026-10-03');
  assert.ok(future);
  assert.strictEqual(future.isFuture, true);
  assert.strictEqual(future.level, 'empty');
});

test('buildHeatMap ignora sesiones fuera de las 12 semanas', () => {
  const today = new Date(2026, 9, 1);
  const cells = buildHeatMap([
    { date: '2026-01-01', minutes: 45 },
    { date: '2026-12-01', minutes: 45 }
  ], today);
  assert.strictEqual(cells.find((cell) => cell.date === '2026-01-01'), undefined);
  assert.strictEqual(cells.find((cell) => cell.date === '2026-12-01'), undefined);
});

test('buildHeatMap ignora fechas malformadas sin romper', () => {
  const today = new Date(2026, 9, 1);
  const cells = buildHeatMap([{ date: 'no-es-fecha', minutes: 45 }], today);
  assert.strictEqual(cells.length, 84);
  const day = cells.find((cell) => cell.date === '2026-10-01');
  assert.strictEqual(day.level, 'empty');
});

test('formatDateRange muestra ambos meses al cruzar el mes o el año', () => {
  assert.strictEqual(
    formatDateRange(new Date(2026, 9, 1), new Date(2026, 9, 4)),
    '1 oct — 4 oct'
  );
  assert.strictEqual(
    formatDateRange(new Date(2026, 8, 12), new Date(2026, 9, 4)),
    '12 sep — 4 oct'
  );
  assert.strictEqual(
    formatDateRange(new Date(2025, 11, 28), new Date(2026, 0, 4)),
    '28 dic — 4 ene'
  );
});

test('formatDayLabel describe minutos o día vacío en español', () => {
  assert.strictEqual(formatDayLabel('2026-10-01', 45), '1 de octubre: 45 minutos');
  assert.strictEqual(formatDayLabel('2026-10-01', 0), '1 de octubre: sin estudio');
});

test('buildHeatMap con 500 sesiones termina en menos de 500ms', () => {
  const today = new Date(2026, 9, 1);
  const sessions = [];
  for (let i = 0; i < 500; i++) {
    sessions.push({ date: '2026-09-15', minutes: 10 });
  }
  const started = Date.now();
  const cells = buildHeatMap(sessions, today);
  const elapsed = Date.now() - started;
  assert.strictEqual(cells.length, 84);
  assert.ok(elapsed < 500, `tardó ${elapsed}ms`);
});
