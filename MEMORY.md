# MEMORY.md

## Estado actual
- Web funcional: sesiones, racha, mejor racha, total, días del mes, toast, mapa de calor (12 semanas lunes–domingo) y objetivo semanal.
- Tests en `tests/` con `node --test`. Coordinator registrado en `opencode.json`.

## Datos
- `diarioEstudio_sesiones`: `{ fecha, tema, minutos }`.
- `diario-estudio-objetivo-semanal`: minutos objetivo.

## Decisiones
- Mapa: 12 semanas completas alineadas a lunes; lista plana y geometría en CSS (7 filas, flujo por columnas).
- Sesiones del mapa se mapean a `{ date, minutes }` en `app.js`; localStorage no cambia.
- Días futuros sin sesión en gris; con sesión, color según RF-3.
- Bucle del mapa por conteo fijo de 84 (DST).
- Racha: si hoy no hay sesión y ayer sí, se cuenta desde ayer. Fechas futuras no suman a ninguna racha.
- Mejor racha compara días locales con `setDate`, no milisegundos ni `new Date("AAAA-MM-DD")`.
- Total y días del mes sí incluyen fechas futuras.
- Semana del objetivo: lunes–domingo. Normalizar `lunes` a `00:00:00` y `domingo` a `23:59:59.999` en `getWeekRange` para no excluir sesiones al usar `new Date()` con hora del día.

## Errores a evitar
- `toISOString()` / `new Date("AAAA-MM-DD")` / `require` en el navegador.
- Comparar fechas con `<=` o 86400000 ms (DST).
- Instancias de `Date` con hora/minuto en `getWeekRange`: al comparar `fechaSesion >= start` descarta la sesión del lunes si `start` retiene la hora actual.
- Forma `AAAA-MM-DD` no implica día real (`2026-02-30`).
- Borrar `diario-estudio-sesiones`: la clave real es `diarioEstudio_sesiones`.
