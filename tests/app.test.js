const { test } = require('node:test');
const assert = require('node:assert');
const {
  calcularRacha,
  calcularMejorRacha,
  calcularTotalMinutos,
  calcularDiasEsteMes,
  formatearMinutos
} = require('../app.js');

test('calcularRacha cuenta días consecutivos que terminan hoy', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 20 },
    { fecha: '2026-09-30', minutos: 20 },
    { fecha: '2026-09-29', minutos: 20 }
  ];
  assert.strictEqual(calcularRacha(sesiones, '2026-10-01'), 3);
});

test('calcularRacha sigue viva desde ayer si hoy no hay sesión', () => {
  const sesiones = [
    { fecha: '2026-09-30', minutos: 20 },
    { fecha: '2026-09-29', minutos: 20 }
  ];
  assert.strictEqual(calcularRacha(sesiones, '2026-10-01'), 2);
});

test('calcularRacha es 0 si faltan hoy y ayer', () => {
  const sesiones = [{ fecha: '2026-09-28', minutos: 20 }];
  assert.strictEqual(calcularRacha(sesiones, '2026-10-01'), 0);
});

test('calcularRacha ignora fechas futuras', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 20 },
    { fecha: '2026-10-02', minutos: 40 }
  ];
  assert.strictEqual(calcularRacha(sesiones, '2026-10-01'), 1);
});

test('calcularMejorRacha encuentra la secuencia más larga sin UTC', () => {
  const sesiones = [
    { fecha: '2026-09-28', minutos: 10 },
    { fecha: '2026-09-29', minutos: 10 },
    { fecha: '2026-09-30', minutos: 10 },
    { fecha: '2026-10-02', minutos: 10 },
    { fecha: '2026-10-03', minutos: 10 }
  ];
  assert.strictEqual(calcularMejorRacha(sesiones, '2026-10-03'), 3);
});

test('calcularMejorRacha ignora días futuros', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 10 },
    { fecha: '2026-10-02', minutos: 10 }
  ];
  assert.strictEqual(calcularMejorRacha(sesiones, '2026-10-01'), 1);
});

test('calcularTotalMinutos suma todas las sesiones incluidas las futuras', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 45 },
    { fecha: '2026-12-01', minutos: 15.4 }
  ];
  assert.strictEqual(calcularTotalMinutos(sesiones), 60.4);
});

test('formatearMinutos redondea y usa horas cuando corresponde', () => {
  assert.strictEqual(formatearMinutos(45), '45 min');
  assert.strictEqual(formatearMinutos(60.4), '1 h 0 min');
  assert.strictEqual(formatearMinutos(90), '1 h 30 min');
});

test('calcularDiasEsteMes cuenta días únicos del mes incluyendo futuros', () => {
  const sesiones = [
    { fecha: '2026-10-01', minutos: 10 },
    { fecha: '2026-10-01', minutos: 20 },
    { fecha: '2026-10-20', minutos: 10 },
    { fecha: '2026-09-30', minutos: 10 }
  ];
  assert.strictEqual(calcularDiasEsteMes(sesiones, '2026-10-02'), 2);
});
