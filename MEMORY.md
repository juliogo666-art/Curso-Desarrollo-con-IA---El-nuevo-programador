# MEMORY.md

## Estado actual
- Web funcional con formulario de sesiones, racha actual, mejor racha, total de minutos, días este mes, toast de confirmación, mapa de calor de 12 semanas y objetivo semanal de estudio.
- Datos en localStorage (claves: `diarioEstudio_sesiones` y `diario-estudio-objetivo-semanal`).

## Funcionalidades
- Registrar sesión (fecha, tema, minutos).
- Racha actual: días consecutivos terminando hoy.
- Mejor racha: secuencia más larga de días consecutivos con sesión.
- Total de minutos: suma de todas las sesiones registradas (incluye futuras).
- Días este mes: días únicos con sesión en el mes actual (incluye futuras).
- Lista de sesiones ordenada de más reciente a más antigua.
- Toast de confirmación al guardar sesión.
- Objetivo semanal: fijar minutos objetivo, ver progreso en barra con color dinámico.

## Pruebas
- Verificado con Chrome DevTools: racha, mejor racha, total, días este mes y objetivo semanal funcionan correctamente.
- Consola sin errores.
- Diseño responsive verificado en móvil (375px).

## Specs
- `specs/001-heat-map/spec.md`: mapa de calor tipo GitHub (12 semanas, escala fija de colores, leyenda, indicador temporal). Pendiente de implementación.
- `specs/001-heat-map/plan.md`: plan de implementación con decisiones técnicas y estrategia de tests.
- `specs/001-heat-map/tasks.md`: desglose en 20 tareas. Única completada: **T1** (`isValidDateString` en `heat-map.js`).
- `heat-map.js` y `heat-map.test.js` están a medio implementar: los tests actuales pasan, pero la lógica vieja (`getWeeksRange`, `getColorForMinutes`, `formatDateLocal`) todavía no sigue la spec. Lo corrigen las tareas T4, T5, T6 y T10.
- `specs/002-weekly-goal/spec.md`: objetivo semanal de estudio. **Revisada y ampliada** (3 revisiones: constitución/fechas, accesibilidad/móvil, cobertura de tests). Añadidos requisitos de ARIA, contraste, teclado y tamaño de toque; tabla de casos límite con columna de verificación; 8 funciones puras exigidas.
- `specs/002-weekly-goal/plan.md`: plan de implementación. **Desactualizado**: no incluye las nuevas funciones puras ni los requisitos de accesibilidad.
- `specs/002-weekly-goal/tasks.md`: 10 tareas, todas completadas. **Desactualizado**: faltan las tareas de accesibilidad y de las funciones puras nuevas.

## Decisiones
- Mejor racha se calcula en vivo, no se guarda.
- Total de minutos se calcula en vivo, no se guarda.
- Días este mes se calcula en vivo, no se guarda.
- Total en formato "X h Y min" (solo "Y min" si h=0).
- Fechas futuras no cuentan para ninguna racha, pero sí para el total y días este mes.
- Minutos con decimales se redondean al mostrar el total.
- Solo se muestra el número de la mejor racha, no cuándo fue.
- Objetivo semanal guardado en localStorage con clave separada `diario-estudio-objetivo-semanal`.
- Semana empieza en lunes.
- Barra de progreso con color dinámico según porcentaje (naranja suave → verde).
- Sección de objetivo semanal colocada encima de las estadísticas.

## Diseño
- Paleta: fondo crema cálido con gradiente sutil, naranja energético (#FF6B35, #FF8C42), texto oscuro (#2D2A26).
- Tipografía: system-ui con pesos altos (800/900) para hero y stats.
- Layout: hero con gradiente naranja y sombra cálida, cards blancas con sombras suaves, bordes redondeados (16px).
- Micro-interacciones: hover con elevación en botón, transiciones suaves en inputs.
- Emojis: 📚 título, 🔥 racha, ⭐ mejor racha, ⏱️ total/minutos, 📅 fecha/este mes, ✏️ formulario, 📖 tema, 💾 guardar, 📋 sesiones, 🎯 objetivo semanal.
- Principio: colores cálidos y energéticos para motivar, hero destacable como elemento central.

- El relleno de la barra de progreso es decorativo y no cumple 3:1 de contraste; la información va en el texto "X / Y min" y el aria-label, que sí cumplen 4.5:1. No reintentar subir el contraste: la paleta es decisión del usuario.
- `aria-valuemax` es el porcentaje del objetivo (puede pasar de 100), no el objetivo en minutos; con objetivo 0 se fija 100 para no generar un rango inválido.
- Solo hay una región `aria-live="polite"` (el texto de progreso). El toast es `role="status"` y los errores van en un `p` persistente con `role="alert"` y `tabindex="-1"`.
- La clave de sesiones es `diarioEstudio_sesiones` (con guion bajo), no `diario-estudio-sesiones`. Ya está corregido en AGENTS.md.

## Errores a evitar
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")` para fechas (UTC).
- No añadir dependencias ni build.
- No usar `require()` en el navegador (solo en Node.js para tests).
- No cambiar la clave de localStorage sin migrar los datos ya guardados.
