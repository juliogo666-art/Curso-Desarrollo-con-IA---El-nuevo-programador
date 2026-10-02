function getWeekRange(hoy) {
  const diaSemana = hoy.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

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
  return typeof goal === 'number' && goal > 0 && goal <= 10000;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getWeekRange, getMinutesInWeek, getProgressPercentage, getProgressColor, isValidGoal };
}
