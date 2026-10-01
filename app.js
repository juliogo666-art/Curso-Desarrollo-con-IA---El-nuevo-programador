const CLAVE_STORAGE = 'diarioEstudio_sesiones';

function cargarSesiones() {
  const datos = localStorage.getItem(CLAVE_STORAGE);
  return datos ? JSON.parse(datos) : [];
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesiones));
}

function obtenerFechaHoy() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function calcularRacha(sesiones) {
  if (sesiones.length === 0) return 0;

  const diasConSesion = new Set(sesiones.map(s => s.fecha));

  let racha = 0;
  let fecha = new Date();

  while (true) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${anio}-${mes}-${dia}`;

    if (diasConSesion.has(fechaStr)) {
      racha++;
      fecha.setDate(fecha.getDate() - 1);
    } else {
      break;
    }
  }

  return racha;
}

function calcularMejorRacha(sesiones) {
  if (sesiones.length === 0) return 0;

  const dias = [...new Set(sesiones.map(s => s.fecha))].sort();
  let mejor = 1;
  let actual = 1;

  for (let i = 1; i < dias.length; i++) {
    const prev = new Date(dias[i - 1]);
    const curr = new Date(dias[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      actual++;
      mejor = Math.max(mejor, actual);
    } else {
      actual = 1;
    }
  }

  return mejor;
}

function formatearFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

function calcularTotalMinutos(sesiones) {
  return sesiones.reduce((total, s) => total + s.minutos, 0);
}

function formatearMinutos(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

function calcularDiasEsteMes(sesiones) {
  const ahora = new Date();
  const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
  const anioActual = ahora.getFullYear();

  const diasUnicos = new Set(
    sesiones
      .filter(s => s.fecha.startsWith(`${anioActual}-${mesActual}`))
      .map(s => s.fecha)
  );

  return diasUnicos.size;
}

function mostrarRacha() {
  const sesiones = cargarSesiones();
  const racha = calcularRacha(sesiones);
  document.getElementById('rachaNumero').textContent = racha;
  const mejor = calcularMejorRacha(sesiones);
  document.getElementById('mejorRachaNumero').textContent = mejor;
  const total = calcularTotalMinutos(sesiones);
  document.getElementById('totalMinutos').textContent = formatearMinutos(total);
  const diasMes = calcularDiasEsteMes(sesiones);
  document.getElementById('diasMesNumero').textContent = diasMes;
}

function mostrarSesiones() {
  const sesiones = cargarSesiones();
  const lista = document.getElementById('listaSesiones');

  if (sesiones.length === 0) {
    lista.innerHTML = '<li class="vacio">Aún no hay sesiones registradas</li>';
    return;
  }

  const ordenadas = [...sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha));

  lista.innerHTML = ordenadas.map(s => `
    <li>
      <div>
        <div class="sesia-tema">${s.tema}</div>
        <div class="sesia-fecha">${formatearFecha(s.fecha)}</div>
      </div>
      <span class="sesia-minutos">${s.minutos} min</span>
    </li>
  `).join('');
}

function mostrarHeatMap() {
  const sesiones = cargarSesiones();
  const grid = document.getElementById('heatmapGrid');
  const rangeEl = document.getElementById('heatmapRange');
  const { buildHeatMap, getWeeksRange, formatDateRange } = require('./heat-map.js');

  const today = new Date();
  const days = buildHeatMap(sesiones, today);
  const { start, end } = getWeeksRange(today, 12);

  rangeEl.textContent = formatDateRange(start, end);

  grid.innerHTML = days.map(d => {
    const [anio, mes, dia] = d.date.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    const fechaLegible = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const label = d.minutes > 0 ? `${fechaLegible}: ${d.minutos} min` : `${fechaLegible}: sin estudio`;
    return `<div class="heatmap-cell ${d.color}" role="img" aria-label="${label}" title="${label}"></div>`;
  }).join('');
}

function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

function init() {
  document.getElementById('fecha').value = obtenerFechaHoy();

  document.getElementById('formulario').addEventListener('submit', (e) => {
    e.preventDefault();

    const fecha = document.getElementById('fecha').value;
    const tema = document.getElementById('tema').value.trim();
    const minutos = parseInt(document.getElementById('minutos').value, 10);

    if (!fecha || !tema || !minutos || minutos <= 0) return;

    const sesiones = cargarSesiones();
    sesiones.push({ fecha, tema, minutos });
    guardarSesiones(sesiones);

    document.getElementById('tema').value = '';
    document.getElementById('minutos').value = '';

    mostrarRacha();
    mostrarSesiones();
    mostrarHeatMap();
    mostrarToast('✅ Sesión guardada');
  });

  mostrarRacha();
  mostrarSesiones();
  mostrarHeatMap();
}

init();
