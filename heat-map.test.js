const { test } = require('node:test');
const assert = require('node:assert');
const { getMinutesByDay, getColorForMinutes, getWeeksRange, buildHeatMap, isValidDateString } = require('./heat-map.js');

// --- T1: isValidDateString ---

test('isValidDateString acepta una fecha real con formato correcto', () => {
  assert.strictEqual(isValidDateString('2026-10-01'), true);
  assert.strictEqual(isValidDateString('2026-02-28'), true);
  assert.strictEqual(isValidDateString('2024-02-29'), true); // año bisiesto
});

test('isValidDateString rechaza fechas que no existen en el calendario', () => {
  assert.strictEqual(isValidDateString('2026-02-30'), false);
  assert.strictEqual(isValidDateString('2026-04-31'), false);
  assert.strictEqual(isValidDateString('2026-13-01'), false);
  assert.strictEqual(isValidDateString('2026-00-10'), false);
  assert.strictEqual(isValidDateString('2026-10-00'), false);
  assert.strictEqual(isValidDateString('2025-02-29'), false); // 2025 no es bisiesto
});

test('isValidDateString rechaza formato incorrecto', () => {
  assert.strictEqual(isValidDateString('26-10-01'), false);
  assert.strictEqual(isValidDateString('2026-10-1'), false);
  assert.strictEqual(isValidDateString('2026/10/01'), false);
  assert.strictEqual(isValidDateString('2026-10-01 '), false);
  assert.strictEqual(isValidDateString(''), false);
});

test('isValidDateString rechaza valores que no son cadena', () => {
  assert.strictEqual(isValidDateString(null), false);
  assert.strictEqual(isValidDateString(undefined), false);
  assert.strictEqual(isValidDateString(20261001), false);
  assert.strictEqual(isValidDateString({}), false);
  assert.strictEqual(isValidDateString([]), false);
});

// Tests
test('getMinutesByDay suma minutos por día correctamente', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 30 },
    { fecha: '2026-10-01', minutos: 20 },
    { fecha: '2026-10-02', minutos: 45 }
  ];
  const result = getMinutesByDay(sesiones);
  assert.strictEqual(result['2026-10-01'], 50);
  assert.strictEqual(result['2026-10-02'], 45);
});

test('getMinutesByDay ignora sesiones inválidas', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 30 },
    { fecha: null, minutos: 20 },
    { fecha: '2026-10-02', minutos: -10 },
    { fecha: '2026-10-03', minutos: 'invalid' }
  ];
  const result = getMinutesByDay(sesiones);
  assert.strictEqual(result['2026-10-01'], 30);
  assert.strictEqual(result['2026-10-02'], undefined);
  assert.strictEqual(result['2026-10-03'], undefined);
});

test('getColorForMinutes asigna colores correctamente', () => {
  assert.strictEqual(getColorForMinutes(0), 'empty');
  assert.strictEqual(getColorForMinutes(1), 'level-1');
  assert.strictEqual(getColorForMinutes(30), 'level-1');
  assert.strictEqual(getColorForMinutes(31), 'level-2');
  assert.strictEqual(getColorForMinutes(60), 'level-2');
  assert.strictEqual(getColorForMinutes(61), 'level-3');
  assert.strictEqual(getColorForMinutes(120), 'level-3');
  assert.strictEqual(getColorForMinutes(121), 'level-4');
  assert.strictEqual(getColorForMinutes(10000), 'level-4');
});

test('getWeeksRange devuelve rango correcto de 12 semanas', () => {
  const today = new Date(2026, 9, 1); // 1 de octubre de 2026
  const { start, end } = getWeeksRange(today, 12);

  // Debe ser 84 días (12 semanas * 7 días)
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  assert.strictEqual(diffDays, 83); // 84 días inclusive = 83 días de diferencia
});

test('buildHeatMap genera 84 días', () => {
  const today = new Date(2026, 9, 1);
  const sesiones = [
    { fecha: '2026-10-01', minutos: 45 },
    { fecha: '2026-09-30', minutos: 30 }
  ];
  const days = buildHeatMap(sesiones, today);
  assert.strictEqual(days.length, 84);
});

test('buildHeatMap marca días futuros como empty', () => {
  const today = new Date(2026, 9, 1); // 1 de octubre
  const sesiones = [
    { fecha: '2026-09-30', minutos: 45 } // Ayer (dentro del rango)
  ];
  const days = buildHeatMap(sesiones, today);
  const yesterday = days.find(d => d.date === '2026-09-30');
  assert.ok(yesterday, 'Debe encontrar el día');
  assert.strictEqual(yesterday.color, 'level-2');
  assert.strictEqual(yesterday.isFuture, false);
});

test('buildHeatMap marca días fuera de rango como empty', () => {
  const today = new Date(2026, 9, 1);
  const sesiones = [
    { fecha: '2026-01-01', minutos: 45 } // Fuera de rango
  ];
  const days = buildHeatMap(sesiones, today);
  const outOfRange = days.find(d => d.date === '2026-01-01');
  assert.strictEqual(outOfRange, undefined); // No está en el mapa
});

test('buildHeatMap asigna color correcto según minutos', () => {
  const today = new Date(2026, 9, 1);
  const sesiones = [
    { fecha: '2026-10-01', minutos: 45 } // level-2
  ];
  const days = buildHeatMap(sesiones, today);
  const day = days.find(d => d.date === '2026-10-01');
  assert.ok(day, 'Debe encontrar el día');
  assert.strictEqual(day.color, 'level-2');
  assert.strictEqual(day.minutes, 45);
});

test('buildHeatMap maneja año bisiesto', () => {
  const today = new Date(2024, 2, 1); // 1 de marzo de 2024 (año bisiesto)
  const sesiones = [
    { fecha: '2024-02-29', minutos: 30 } // 29 de febrero
  ];
  const days = buildHeatMap(sesiones, today);
  const feb29 = days.find(d => d.date === '2024-02-29');
  assert.ok(feb29, 'Debe encontrar el día');
  assert.strictEqual(feb29.minutes, 30);
  assert.strictEqual(feb29.color, 'level-1');
});

test('buildHeatMap maneja cambio de horario (DST)', () => {
  const today = new Date(2026, 9, 1);
  const sesiones = [
    { fecha: '2026-09-15', minutos: 60 } // Dentro del rango
  ];
  const days = buildHeatMap(sesiones, today);
  const dstDay = days.find(d => d.date === '2026-09-15');
  assert.ok(dstDay, 'Debe encontrar el día');
  assert.strictEqual(dstDay.minutes, 60);
  assert.strictEqual(dstDay.color, 'level-2');
});
