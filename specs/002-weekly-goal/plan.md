# Plan 002 — Objetivo Semanal de Estudio

## Archivos y responsabilidades

| Archivo | Responsabilidad |
|---------|-----------------|
| `index.html` | Añadir sección de objetivo semanal (input, botón, barra de progreso) |
| `styles.css` | Estilos de la sección, barra de progreso y toast |
| `app.js` | Lógica de guardar objetivo, calcular progreso, actualizar UI |
| `weekly-goal.js` | Funciones puras: cálculo de minutos de la semana, porcentaje, color |
| `weekly-goal.test.js` | Tests de las funciones puras |

## Funciones puras (con "hoy" como parámetro)

| Función | Parámetros | Retorno | Descripción |
|---------|-----------|---------|-------------|
| `getWeekRange(hoy)` | `hoy: Date` | `{ start: Date, end: Date }` | Devuelve el lunes y domingo de la semana de `hoy` |
| `getMinutesInWeek(sessions, hoy)` | `sessions: Array, hoy: Date` | `number` | Suma minutos de sesiones en la semana actual |
| `getProgressPercentage(minutes, goal)` | `minutes: number, goal: number` | `number` | Porcentaje del objetivo (0-100+, sin tope) |
| `getProgressColor(percentage)` | `percentage: number` | `string` | Color según porcentaje (naranja suave → verde) |
| `isValidGoal(goal)` | `goal: number` | `boolean` | true si goal > 0 y <= 10000 |

## Algoritmo en pseudocódigo

### Cálculo de minutos de la semana
```
getMinutesInWeek(sessions, hoy):
  { start, end } = getWeekRange(hoy)
  total = 0
  for session in sessions:
    if session.date >= start AND session.date <= end:
      if session.minutes > 0:
        total += session.minutes
  return total
```

### Cálculo de porcentaje
```
getProgressPercentage(minutes, goal):
  if goal <= 0: return 0
  return (minutes / goal) * 100
```

### Color según porcentaje
```
getProgressColor(percentage):
  if percentage >= 100: return "#4CAF50" (verde)
  if percentage >= 80: return "#FF6B35" (naranja intenso)
  if percentage >= 50: return "#FF8C42" (naranja medio)
  return "#FFB347" (naranja suave)
```

## Interfaz

### HTML (sección añadida encima de las estadísticas)
```html
<section class="weekly-goal">
  <h2>🎯 Objetivo semanal</h2>
  <div class="goal-input">
    <input type="number" id="goal-input" placeholder="Ej: 300" min="1">
    <span>minutos/semana</span>
    <button id="save-goal-btn">💾 Guardar</button>
  </div>
  <div class="progress-container">
    <div class="progress-bar" id="progress-bar"></div>
  </div>
  <p class="progress-text" id="progress-text">0 / 0 min</p>
  <p class="progress-message" id="progress-message"></p>
</section>
```

### CSS
- Barra de progreso: contenedor con fondo gris claro, relleno con color dinámico.
- Transición suave en el relleno (0.3s).
- Responsive: input y botón se apilan en móvil.

## Decisiones justificadas

| Decisión | Alternativa descartada | Por qué |
|----------|----------------------|---------|
| Clave separada `diario-estudio-objetivo-semanal` | Dentro de `diario-estudio-sesiones` | Separación de conceptos, no mezclar sesiones con configuración |
| Semana empieza en lunes | Domingo | Convención más común en España y Europa |
| Barra de progreso con color dinámico | Barra de color fijo | Mayor motivación visual al cambiar de color |
| Input type="number" | type="text" con validación | Validación nativa del navegador, mejor UX en móvil |
| Mensaje de felicitación al 100% | Solo cambio de color | Refuerzo positivo explícito |

## Estrategia de tests con `node --test`

| Test | Función | RF cubierto |
|------|---------|-------------|
| `getWeekRange` devuelve lunes y domingo correctos | `getWeekRange` | RF-3 |
| `getMinutesInWeek` suma solo sesiones de la semana actual | `getMinutesInWeek` | RF-3 |
| `getMinutesInWeek` ignora sesiones fuera de la semana | `getMinutesInWeek` | RF-3 |
| `getMinutesInWeek` ignora minutos negativos | `getMinutesInWeek` | RF-3 |
| `getProgressPercentage` calcula porcentaje correcto | `getProgressPercentage` | RF-4 |
| `getProgressPercentage` devuelve 0 si goal es 0 | `getProgressPercentage` | RF-4 |
| `getProgressColor` devuelve color correcto según porcentaje | `getProgressColor` | RF-7 |
| `isValidGoal` valida correctamente | `isValidGoal` | RF-1 |

## RF cubiertos por cada parte

| Parte | RF cubiertos |
|-------|-------------|
| `getWeekRange` | RF-3 |
| `getMinutesInWeek` | RF-3, RF-6 |
| `getProgressPercentage` | RF-4 |
| `getProgressColor` | RF-7 |
| `isValidGoal` | RF-1 |
| HTML/CSS/JS de UI | RF-1, RF-2, RF-4, RF-5, RF-6, RF-7 |
