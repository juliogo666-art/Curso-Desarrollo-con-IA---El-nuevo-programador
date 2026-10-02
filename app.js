const CLAVE_STORAGE = 'diarioEstudio_sesiones';
const CLAVE_OBJETIVO = 'diario-estudio-objetivo-semanal';

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

function fechaLocalDesdeTexto(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function esFechaConsecutiva(anterior, siguiente) {
  const esperado = fechaLocalDesdeTexto(anterior);
  esperado.setDate(esperado.getDate() + 1);
  const anio = esperado.getFullYear();
  const mes = String(esperado.getMonth() + 1).padStart(2, '0');
  const dia = String(esperado.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}` === siguiente;
}

function calcularRacha(sesiones, hoy) {
  const hoyStr = hoy || obtenerFechaHoy();
  const diasConSesion = new Set(
    sesiones.filter(s => s.fecha && s.fecha <= hoyStr).map(s => s.fecha)
  );

  let cursor = fechaLocalDesdeTexto(hoyStr);
  if (!diasConSesion.has(hoyStr)) {
    cursor.setDate(cursor.getDate() - 1);
    const ayer = obtenerFechaHoyDesdeDate(cursor);
    if (!diasConSesion.has(ayer)) return 0;
  }

  let racha = 0;
  while (true) {
    const fechaStr = obtenerFechaHoyDesdeDate(cursor);
    if (diasConSesion.has(fechaStr)) {
      racha++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return racha;
}

function obtenerFechaHoyDesdeDate(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function calcularMejorRacha(sesiones, hoy) {
  const hoyStr = hoy || obtenerFechaHoy();
  const dias = [...new Set(
    sesiones.filter(s => s.fecha && s.fecha <= hoyStr).map(s => s.fecha)
  )].sort();

  if (dias.length === 0) return 0;

  let mejor = 1;
  let actual = 1;

  for (let i = 1; i < dias.length; i++) {
    if (esFechaConsecutiva(dias[i - 1], dias[i])) {
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
  const total = Math.round(minutos);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

function calcularDiasEsteMes(sesiones, hoy) {
  const hoyStr = hoy || obtenerFechaHoy();
  const prefijo = hoyStr.slice(0, 7);

  const diasUnicos = new Set(
    sesiones
      .filter(s => s.fecha && s.fecha.startsWith(prefijo))
      .map(s => s.fecha)
  );

  return diasUnicos.size;
}

function mostrarRacha() {
  const sesiones = cargarSesiones();
  const hoy = obtenerFechaHoy();
  const racha = calcularRacha(sesiones, hoy);
  document.getElementById('rachaNumero').textContent = racha;
  const mejor = calcularMejorRacha(sesiones, hoy);
  document.getElementById('mejorRachaNumero').textContent = mejor;
  const total = calcularTotalMinutos(sesiones);
  document.getElementById('totalMinutos').textContent = formatearMinutos(total);
  const diasMes = calcularDiasEsteMes(sesiones, hoy);
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
  const sesiones = cargarSesiones().map(s => ({ date: s.fecha, minutes: s.minutos }));
  const grid = document.getElementById('heatmapGrid');
  const rangeEl = document.getElementById('heatmapRange');
  const today = new Date();
  const cells = buildHeatMap(sesiones, today);
  const { start, end } = getHeatMapRange(today, 12);

  rangeEl.textContent = formatDateRange(start, end);

  grid.innerHTML = cells.map(cell => {
    const label = formatDayLabel(cell.date, cell.minutes);
    return `<div class="heatmap-cell ${cell.level}" aria-label="${label}"></div>`;
  }).join('');
}

function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

function cargarObjetivo() {
  return parseGoalStored(localStorage.getItem(CLAVE_OBJETIVO));
}

function guardarObjetivo(minutos) {
  localStorage.setItem(CLAVE_OBJETIVO, String(minutos));
}

function mostrarProgreso() {
  const sesiones = cargarSesiones();
  const objetivo = cargarObjetivo();
  const hoy = new Date();

  const minutosSemana = getMinutesInWeek(sesiones, hoy);
  const porcentaje = getProgressPercentage(minutosSemana, objetivo);
  const color = getProgressColor(porcentaje);

  const barra = document.getElementById('progress-bar');
  const texto = document.getElementById('progress-text');
  const mensaje = document.getElementById('progress-message');

  barra.style.width = Math.min(porcentaje, 100) + '%';
  barra.style.backgroundColor = color;
  texto.textContent = `${minutosSemana} / ${objetivo} min`;

  if (isGoalAchieved(minutosSemana, objetivo)) {
    mensaje.textContent = '¡Objetivo cumplido! 🎉';
  } else {
    mensaje.textContent = '';
  }
}

function init() {
  document.getElementById('fecha').value = obtenerFechaHoy();

  const objetivo = cargarObjetivo();
  if (objetivo > 0) {
    document.getElementById('goal-input').value = objetivo;
  }

  document.getElementById('save-goal-btn').addEventListener('click', () => {
    const input = document.getElementById('goal-input');
    const resultado = normalizeGoal(input.value);

    if (!resultado.ok) {
      mostrarToast('⚠️ El objetivo debe ser entre 1 y 10.000 minutos');
      return;
    }

    guardarObjetivo(resultado.value);
    input.value = resultado.value;
    mostrarProgreso();
    mostrarToast('✅ Objetivo guardado');
  });

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
    mostrarProgreso();
    mostrarToast('✅ Sesión guardada');
  });

  mostrarRacha();
  mostrarSesiones();
  mostrarHeatMap();
  mostrarProgreso();
}

if (typeof document !== 'undefined') {
  init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcularRacha,
    calcularMejorRacha,
    calcularTotalMinutos,
    calcularDiasEsteMes,
    formatearMinutos
  };
}
