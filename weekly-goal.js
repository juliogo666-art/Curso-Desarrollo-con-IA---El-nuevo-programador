function getWeekRange(hoy) {
  const diaSemana = hoy.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diffLunes, 0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  return { start: lunes, end: domingo };
}

function getMinutesInWeek(sesiones, hoy) {
  const { start, end } = getWeekRange(hoy);
  let total = 0;

  for (const s of sesiones) {
    if (!s.fecha || typeof s.minutos !== 'number' || s.minutos < 0) continue;

    const [anio, mes, dia] = s.fecha.split('-').map(Number);
    const fechaSesion = new Date(anio, mes - 1, dia);

    if (fechaSesion >= start && fechaSesion <= end) {
      total += s.minutos;
    }
  }

  return total;
}

function getProgressPercentage(minutes, goal) {
  if (goal <= 0) return 0;
  return (minutes / goal) * 100;
}

function getProgressColor(percentage) {
  if (percentage >= 100) return '#4CAF50';
  if (percentage >= 80) return '#FF6B35';
  if (percentage >= 50) return '#FF8C42';
  return '#FFB347';
}

function isValidGoal(goal) {
  return typeof goal === 'number' && Number.isInteger(goal) && goal > 0 && goal <= 10000;
}

function normalizeGoal(valor) {
  if (valor === '' || valor === null || valor === undefined) {
    return { ok: false };
  }
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero)) {
    return { ok: false };
  }
  const rounded = Math.round(numero);
  if (!isValidGoal(rounded)) {
    return { ok: false, value: rounded };
  }
  return { ok: true, value: rounded };
}

function parseGoalStored(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  const numero = typeof valor === 'number' ? valor : parseInt(valor, 10);
  if (!Number.isFinite(numero) || !isValidGoal(numero)) return 0;
  return numero;
}

function isGoalAchieved(minutes, goal) {
  return goal > 0 && minutes >= goal;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWeekRange,
    getMinutesInWeek,
    getProgressPercentage,
    getProgressColor,
    isValidGoal,
    normalizeGoal,
    parseGoalStored,
    isGoalAchieved
  };
}
