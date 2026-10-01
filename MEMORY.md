# MEMORY.md

## Estado actual
- Web funcional con formulario de sesiones, racha actual, mejor racha, total de minutos, días este mes, toast de confirmación y mapa de calor de 12 semanas.
- Datos en localStorage (clave: `diarioEstudio_sesiones`).

## Funcionalidades
- Registrar sesión (fecha, tema, minutos).
- Racha actual: días consecutivos terminando hoy.
- Mejor racha: secuencia más larga de días consecutivos con sesión.
- Total de minutos: suma de todas las sesiones registradas (incluye futuras).
- Días este mes: días únicos con sesión en el mes actual (incluye futuras).
- Lista de sesiones ordenada de más reciente a más antigua.
- Toast de confirmación al guardar sesión.

## Pruebas
- Verificado con Chrome DevTools: racha, mejor racha, total y días este mes funcionan correctamente.
- Consola sin errores.
- Diseño responsive verificado en móvil (375px).

## Specs
- `specs/001-heat-map/spec.md`: mapa de calor tipo GitHub (12 semanas, escala fija de colores, leyenda, indicador temporal). Pendiente de implementación.
- `specs/001-heat-map/plan.md`: plan de implementación con decisiones técnicas y estrategia de tests.
- `specs/001-heat-map/tasks.md`: desglose en 20 tareas. Única completada: **T1** (`isValidDateString` en `heat-map.js`).
- `heat-map.js` y `heat-map.test.js` están a medio implementar: los tests actuales pasan, pero la lógica vieja (`getWeeksRange`, `getColorForMinutes`, `formatDateLocal`) todavía no sigue la spec. Lo corrigen las tareas T4, T5, T6 y T10.

## Decisiones
- Mejor racha se calcula en vivo, no se guarda.
- Total de minutos se calcula en vivo, no se guarda.
- Días este mes se calcula en vivo, no se guarda.
- Total en formato "X h Y min" (solo "Y min" si h=0).
- Fechas futuras no cuentan para ninguna racha, pero sí para el total y días este mes.
- Minutos con decimales se redondean al mostrar el total.
- Solo se muestra el número de la mejor racha, no cuándo fue.

## Diseño
- Paleta: fondo crema cálido con gradiente sutil, naranja energético (#FF6B35, #FF8C42), texto oscuro (#2D2A26).
- Tipografía: system-ui con pesos altos (800/900) para hero y stats.
- Layout: hero con gradiente naranja y sombra cálida, cards blancas con sombras suaves, bordes redondeados (16px).
- Micro-interacciones: hover con elevación en botón, transiciones suaves en inputs.
- Emojis: 📚 título, 🔥 racha, ⭐ mejor racha, ⏱️ total/minutos, 📅 fecha/este mes, ✏️ formulario, 📖 tema, 💾 guardar, 📋 sesiones.
- Principio: colores cálidos y energéticos para motivar, hero destacable como elemento central.

## Errores a evitar
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")` para fechas (UTC).
- No añadir dependencias ni build.
