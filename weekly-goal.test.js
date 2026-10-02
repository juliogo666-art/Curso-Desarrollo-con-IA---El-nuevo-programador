const { test } = require('node:test');
const assert = require('node:assert');
const { getWeekRange, getMinutesInWeek, getProgressPercentage, getProgressColor, isValidGoal } = require('./weekly-goal.js');

test('getWeekRange devuelve lunes y domingo correctos', () => {
  const hoy = new Date(2026, 9, 2);
  const { start, end } = getWeekRange(hoy);

  assert.strictEqual(start.getDay(), 1);
  assert.strictEqual(end.getDay(), 0);
  assert.strictEqual(start.getDate(), 28);
  assert.strictEqual(end.getDate(), 4);
});

test('getWeekRange funciona cuando hoy es lunes', () => {
  const hoy = new Date(2026, 8, 28);
  const { start, end } = getWeekRange(hoy);

  assert.strictEqual(start.getDate(), 28);
  assert.strictEqual(end.getDate(), 4);
});

test('getWeekRange funciona cuando hoy es domingo', () => {
  const hoy = new Date(2026, 9, 4);
  const { start, end } = getWeekRange(hoy);

  assert.strictEqual(start.getDate(), 28);
  assert.strictEqual(end.getDate(), 4);
});

test('getMinutesInWeek suma solo sesiones de la semana actual', () => {
  const hoy = new Date(2026, 9, 2);
  const sesiones = [
    { fecha: '2026-09-28', minutos: 30 },
    { fecha: '2026-09-29', minutos: 45 },
    { fecha: '2026-09-30', minutos: 60 },
    { fecha: '2026-10-01', minutos: 20 },
    { fecha: '2026-10-02', minutos: 15 },
    { fecha: '2026-10-03', minutos: 90 },
    { fecha: '2026-09-27', minutos: 100 },
    { fecha: '2026-10-05', minutos: 200 }
  ];

  const total = getMinutesInWeek(sesiones, hoy);
  assert.strictEqual(total, 260);
});

test('getMinutesInWeek ignora sesiones con minutos negativos', () => {
  const hoy = new Date(2026, 9, 2);
  const sesiones = [
    { fecha: '2026-09-30', minutos: 60 },
    { fecha: '2026-10-01', minutos: -10 }
  ];

  const total = getMinutesInWeek(sesiones, hoy);
  assert.strictEqual(total, 60);
});

test('getMinutesInWeek devuelve 0 si no hay sesiones en la semana', () => {
  const hoy = new Date(2026, 9, 2);
  const sesiones = [
    { fecha: '2026-09-20', minutos: 60 },
    { fecha: '2026-10-10', minutos: 30 }
  ];

  const total = getMinutesInWeek(sesiones, hoy);
  assert.strictEqual(total, 0);
});

test('getProgressPercentage calcula porcentaje correcto', () => {
  assert.strictEqual(getProgressPercentage(150, 300), 50);
  assert.strictEqual(getProgressPercentage(300, 300), 100);
  assert.strictEqual(getProgressPercentage(0, 300), 0);
  assert.strictEqual(getProgressPercentage(450, 300), 150);
});

test('getProgressPercentage devuelve 0 si goal es 0', () => {
  assert.strictEqual(getProgressPercentage(100, 0), 0);
});

test('getProgressColor devuelve color correcto segun porcentaje', () => {
  assert.strictEqual(getProgressColor(0), '#FFB347');
  assert.strictEqual(getProgressColor(30), '#FFB347');
  assert.strictEqual(getProgressColor(50), '#FF8C42');
  assert.strictEqual(getProgressColor(70), '#FF8C42');
  assert.strictEqual(getProgressColor(80), '#FF6B35');
  assert.strictEqual(getProgressColor(95), '#FF6B35');
  assert.strictEqual(getProgressColor(100), '#4CAF50');
  assert.strictEqual(getProgressColor(150), '#4CAF50');
});

test('isValidGoal valida correctamente', () => {
  assert.strictEqual(isValidGoal(300), true);
  assert.strictEqual(isValidGoal(1), true);
  assert.strictEqual(isValidGoal(10000), true);
  assert.strictEqual(isValidGoal(0), false);
  assert.strictEqual(isValidGoal(-10), false);
  assert.strictEqual(isValidGoal(10001), false);
  assert.strictEqual(isValidGoal('300'), false);
  assert.strictEqual(isValidGoal(null), false);
});
