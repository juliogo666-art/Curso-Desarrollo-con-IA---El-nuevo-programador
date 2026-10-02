# Tasks 001 — Mapa de Calor de Estudio

Desglose de `specs/001-heat-map/plan.md` en tareas ejecutables. Cada una dura 20-30 min, va en orden de dependencia y lleva su "Hecho cuando:" verificable.

**Puerta de calidad (constitución 4):** no se avanza con `node --test` en rojo. El orden es lógica pura + tests en verde → luego DOM.

**Antes de empezar:** la tarea 0 es bloqueante. La contradicción RF-1 / RF-3 está documentada en el plan §6 y hay que cerrar la lectura antes de escribir la lógica, o el resultado será imposible de verificar.

---

## Fase 0 — Desbloqueo de la spec

- [x] **T0. Resolver la contradicción RF-1 / RF-3 en la spec**
  Cubre: RF-1, RF-3
  Editar `specs/001-heat-map/spec.md`: la cláusula de RF-1 sobre días posteriores al día actual debe decir "**sin sesión**", de modo que cuando hay sesión futura manda RF-3. Ajustar también la línea correspondiente del criterio de finalización, que hoy es incompatible con RF-3.
  **Hecho cuando:** la spec ya no contiene dos cláusulas que exijan gris y color para el mismo día, y RF-3 sigue teniendo una primera cláusula con contenido.

---

## Fase 1 — Validación de datos

Ninguna tarea aquí depende de otra. Todas son lógica pura.

- [x] **T1. `isValidDateString`**
  Cubre: RF-5
  Valida forma `AAAA-MM-DD` **y** calendario real: construir `new Date(y, m-1, d)` y comparar `getFullYear`/`getMonth`/`getDate`. Rechaza `2026-02-30` y `2026-13-01`, acepta `2024-02-29` (bisiesto). Sin `toISOString()` ni `new Date("AAAA-MM-DD")`.
  **Hecho cuando:** `node --test` pasa los casos `2026-02-30 → false`, `2026-13-01 → false`, `2024-02-29 → true`, `26-10-01 → false`, `2026-10-1 → false`, `"" → false`, `null → false`, número → `false`.

- [x] **T2. `isValidSession`**
  Cubre: RF-5
  Compone T1: objeto válido, `date` cadena que pase T1, `minutes` número finito ≥ 0. Descarta `"45"` como cadena y los negativos.
  **Hecho cuando:** `node --test` pasa: minutos negativos → `false`, `minutes: "45"` → `false`, `{date:"2026-10-01",minutes:0}` → `true`, `undefined` → `false`.

- [x] **T3. `sumMinutesByDay`**
  Cubre: RF-2, RF-5
  Acumula minutos por fecha usando T2 como filtro. `minutes: 0` crea la entrada con total 0, no la borra. Devuelve `Map<string, number>`.
  **Hecho cuando:** `node --test` pasa: dos sesiones del mismo día → suma; `date` nula, negativo y `"45"` → ignorados; `minutes: 0` → entrada con valor 0; `[]` → `Map` vacío.

---

## Fase 2 — Escala de color

- [x] **T4. `colorForMinutes`**
  Cubre: RF-2
  Recibe minutos **ya redondeados**. Devuelve `empty` | `level-1` | `level-2` | `level-3` | `level-4`, con el límite inferior incluido en cada rango.
  **Hecho cuando:** `node --test` pasa las fronteras `0 → empty`, `1 → level-1`, `30 → level-1`, `31 → level-2`, `60 → level-2`, `61 → level-3`, `120 → level-3`, `121 → level-4`, `10000 → level-4`, `-5 → empty`.

---

## Fase 3 — Cálculo del rango

- [x] **T5. `getWeekStart` y `getHeatMapRange`**
  Cubre: RF-1
  `getWeekStart(today)` devuelve el lunes de la semana. `getHeatMapRange(today, weeks=12)` devuelve 12 semanas **completas**: empieza en el lunes de hace 11 semanas y termina en el domingo de la semana actual (D4). Todo con `setDate` en hora local, nunca UTC (D9).
  **Hecho cuando:** `node --test` pasa: para un jueves devuelve el lunes anterior; para un lunes devuelve ese mismo lunes; para un domingo devuelve el lunes de 6 días antes; el rango abarca exactamente 84 días y sus extremos son lunes y domingo.

- [x] **T6. `toDateKey`**
  Cubre: constitución 5
  Convierte un `Date` local en `"AAAA-MM-DD"` con `getFullYear`/`getMonth`/`getDate` y `padStart`.
  **Hecho cuando:** `node --test` pasa: `new Date(2026, 9, 1)` → `"2026-10-01"`; `new Date(2026, 0, 5)` → `"2026-01-05"` (mes con cero a la izquierda).

---

## Fase 4 — Ensamblado del mapa

Depende de T3, T4, T5, T6. Es el núcleo.

- [x] **T7. `buildHeatMap`**
  Cubre: RF-1, RF-2, RF-3, RF-5
  Tres pasos del pseudocódigo del plan §3: (1) acumular con `sumMinutesByDay`; (2) rango de T5; (3) bucle por **conteo fijo** de `weeks * 7` iteraciones, no `while fecha <= fin`, para que el cambio de horario no salte días (D5). Compara futuro por componentes Y/M/D, no por marca de tiempo. Aplica `Math.round` antes de `colorForMinutes` (D8). Devuelve `Cell[]` con `{date, minutes, level, isFuture, isOutOfRange}`.
  **Hecho cuando:** `node --test` pasa: exactamente 84 celdas; `cells[0].date` es lunes; para toda columna `i`, `cells[i*7]` es lunes y `cells[i*7+6]` es domingo; sin sesiones → las 84 en `empty`; `120.4` minutos → `level-3`.

- [x] **T8. Casos de `buildHeatMap` para fechas futuras y borde**
  Cubre: RF-3, RF-5
  Sobre T7: sesión futura **con** minutos dentro de la ventana → nivel coloreado e `isFuture = true`; sesión futura **sin** sesión → `empty`; sesión futura fuera de las 12 semanas → ausente; sesión antigua fuera de rango → ausente; `date` malformada → la celda del día sale `empty` sin romper.
  **Hecho cuando:** `node --test` pasa los cinco casos con `today` fijo, sin depender del reloj real.

- [x] **T9. `formatDateRange` y `formatDayLabel`**
  Cubre: RF-7, RNF accesibilidad
  `formatDateRange` → `"DD mmm — DD mmm"`, cada extremo con su mes, de modo que un cruce de mes muestra ambos sin lógica extra. `formatDayLabel` → `"1 de octubre: 45 minutos"` o `"1 de octubre: sin estudio"`, en español.
  **Hecho cuando:** `node --test` pasa: rango dentro de un mes → `"1 oct — 4 oct"`; rango cruzando cambio de mes → aparecen los dos meses; rango cruzando año; etiqueta con minutos incluye fecha y minutos; etiqueta de día vacío dice "sin estudio".

- [x] **T10. Exportación dual y limpieza de `heat-map.js`**
  Cubre: constitución 1, constitución 3, RNF idioma
  Reescribir el archivo con identificadores en inglés (D10): nada de `minutosPorDia` ni `fechaLegible`. Exportar bajo `if (typeof module !== 'undefined' && module.exports)` para que funcione en Node y en navegador (D1). Sin `DOM`, sin `localStorage`, sin `Date.now()`: "hoy" entra siempre por parámetro. Eliminar `getWeeksRange`, `getColorForMinutes` y `formatDateLocal` viejos, sustituidos por T5, T4 y T6.
  **Hecho cuando:** `node --test` sigue en verde y `heat-map.js` no contiene ninguna referencia a `document`, `localStorage`, `require` ni `Date.now()`.

---

## Fase 5 — Puerta de calidad de la lógica

- [x] **T11. `node --test` completo en verde**
  Cubre: todos los RF con criterios verificables
  Ejecutar `node --test` en la raíz y eliminar los dos tests cuyo nombre no describe lo que su aserción comprueba: "buildHeatMap marca días futuros" usa ayer como fecha, y el de DST usa una fecha arbitraria dentro del rango en lugar de un cruce real de cambio de horario. Sustituirlos por los casos de T8 y por un caso de rango que cruza DST de verdad.
  **Hecho cuando:** `node --test` reporta todos en verde, sin tests omitidos, y ningún nombre de test afirma algo que su aserción no compruebe.

---

## Fase 6 — Estructura

- [x] **T12. Sección del mapa en `index.html`**
  Cubre: RF-1, RF-6, RF-7
  Sección entre `.stats` y `.formulario` (D11), con título, elemento del indicador de rango, contenedor del grid y bloque de leyenda con los 5 niveles. La leyenda es HTML fijo, no se genera por JS (D7). Añadir `<script src="heat-map.js">` **antes** de `app.js`, sin `type="module"`.
  **Hecho cuando:** `index.html` contiene la sección con los tres anclas que consume `app.js`, y sigue sin módulos ES ni atributos `type="module"`.

---

## Fase 7 — Presentación

- [x] **T13. Colores y leyenda en `styles.css`**
  Cubre: RF-6
  Definir los 5 niveles en un solo bloque de reglas compartido por las celdas y por la leyenda, para que no puedan divergir. Quitar los `title` de las celdas (los tooltips están fuera de alcance) y el `role="img"` anidado.
  **Hecho cuando:** las celdas y la leyenda comparten los mismos valores de color, y ninguna celda del HTML tiene `title`.

- [x] **T14. Geometría del grid en `styles.css`**
  Cubre: RF-1, RNF responsive
  El grid declara **7 filas** y flujo **por columnas** (D3). Cada celda es cuadrado con `aspect-ratio`. Como `cells` es cronológico y empieza en lunes, cada bloque de 7 llena una columna → columnas = semana, filas = día. Sin animación de entrada (D12). `gap` pequeño para que 12 columnas quepan en 320px sin scroll horizontal.
  **Hecho cuando:** con datos de prueba en el navegador, las 12 columnas se leen como semanas y cada columna va de lunes arriba a domingo abajo, sin scroll horizontal a 320px.

- [x] **T15. `mostrarHeatMap` en `app.js` sin `require`**
  Cubre: RF-4, RNF accesibilidad
  Quitar el `require('./heat-map.js')` actual, que lanza `ReferenceError` en el navegador. Usar las funciones puras por ámbito global (D2). Escribir el indicador con `formatDateRange`, rellenar el grid con una celda por elemento de `cells` en orden, y poner `aria-label` desde `formatDayLabel`. Invocarla en `init()` y en el manejador de `submit`, junto a `mostrarRacha()` y `mostrarSesiones()`.
  **Hecho cuando:** guardar una sesión repinta el mapa sin recargar la página, la consola no registra ningún `ReferenceError`, y las 84 celdas tienen `aria-label` descriptivo.

- [x] **T16. `prefers-reduced-motion`**
  Cubre: RNF accesibilidad
  Desactivar la transición de hover del botón cuando el sistema pide movimiento reducido.
  **Hecho cuando:** con movimiento reducido activo, el botón no tiene transición.

---

## Fase 8 — Verificación en navegador

Sin tests; se comprueba con Chrome DevTools según constitución 4 y AGENTS.md.

- [x] **T17. Verificación funcional y responsive**
  Cubre: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RNF
  Abrir `index.html` con doble clic. Registrar sesiones y comprobar: 84 celdas en 12 columnas de semanas; escala correcta para minutos en las cinco franjas; días sin sesión en gris; sesión futura con minutos coloreada; leyenda con los 5 niveles debajo; indicador de rango encima y alineado a la izquierda. Guardar una sesión y ver el mapa actualizarse sin recargar. Revisar la consola vacía. Redimensionar a 320px y confirmar que no hay scroll horizontal.
  **Hecho cuando:** todos los puntos se comprueban en el navegador, la consola está sin errores y a 320px no hay scroll horizontal.

- [x] **T18. Persistencia y datos intactos**
  Cubre: constitución 5
  Recargar y confirmar que el mapa se recalcula igual. Registrar con fecha antigua y futura y confirmar que la antigua no aparece. Comprobar que el formato en localStorage sigue siendo `{fecha, tema, minutos}` y que la racha, el total y los días del mes no han cambiado.
  **Hecho cuando:** tras recargar el mapa es idéntico, la sesión antigua no aparece y ninguna estadística previa se ha alterado.

---

## Fase 9 — Cierre documental

- [x] **T19. Actualizar `MEMORY.md`**
  Cubre: —
  Estado actual con el mapa implementado. Decisiones: 12 semanas completas alineadas a lunes, lista plana con geometría en CSS, bucle por conteo fijo, validación de calendario, redondeo antes del nivel. **Errores a evitar:** `require` en el navegador rompe la web; comparar fechas con `<=` se rompe con el cambio de horario; una forma de fecha correcta no garantiza un día real.
  **Hecho cuando:** `MEMORY.md` refleja el estado real y un lector nuevo que rompa el mapa por uno de esos tres errores lo encuentra descrito.

---

## Secuencia resumida

```
T0 (desbloqueo spec)
  ↓
T1 T2 T3 ─┐
T4        ├→ T7 → T8 → T10 → T11 (puerta: tests en verde)
T5 T6 ────┘         ↑
T9 ─────────────────┘
  ↓
T12 → T13 T14 → T15 T16 → T17 T18 → T19
```

## Comprobación de cobertura

| RF | Tareas |
|---|---|
| RF-1 | T0, T5, T7, T12, T14, T17 |
| RF-2 | T3, T4, T7, T8, T17 |
| RF-3 | T0, T7, T8, T17 |
| RF-4 | T15, T17 |
| RF-5 | T1, T2, T3, T7, T8, T17 |
| RF-6 | T12, T13, T17 |
| RF-7 | T9, T12, T17 |
| RNF accesibilidad | T9, T13, T15, T16, T17 |
| RNF responsive | T14, T17 |
| RNF rendimiento | T11 |
| RNF idioma | T10 |
| Constitución 1 | T10, T12 |
| Constitución 3 | T6, T10 |
| Constitución 4 | T11, T17 |
| Constitución 5 | T6, T18 |
| Constitución 6 | T10 |
