# Spec 002 — Objetivo Semanal de Estudio

## Contexto y objetivo

El Diario de Estudio registra sesiones con fecha, tema y minutos. Actualmente muestra estadísticas agregadas (racha, total, días este mes) pero no ofrece una meta semanal que motive al usuario a cumplir un objetivo.

**Objetivo:** Permitir al usuario fijar un objetivo de minutos de estudio por semana y mostrar cuánto lleva acumulado en la semana actual, para motivarse a cumplirlo.

**Por qué:** Refuerza la motivación mediante una meta clara y alcanzable, y permite ver el progreso semanal de un vistazo.

## Usuarios

- **Estudiante autodidacta** que registra sesiones diarias y quiere una meta semanal que le motive a estudiar de forma constante.

## Historias de usuario

1. Como estudiante, quiero fijar un objetivo de minutos de estudio para cada semana para tener una meta clara.
2. Como estudiante, quiero ver cuántos minutos llevo estudiados en la semana actual para saber cuánto me falta.
3. Como estudiante, quiero ver el progreso de forma visual (barra de progreso) para motivarme a cumplir el objetivo.
4. Como estudiante, quiero cambiar mi objetivo semanal en cualquier momento para ajustarlo a mi disponibilidad.

## Definiciones

- **Semana:** Período de 7 días que empieza en lunes y termina en domingo, según la fecha local del usuario.
- **Límites de la semana:** Son dos fechas-calendario (año, mes, día), no instantes. El cálculo compara solo año, mes y día, nunca horas, por lo que un cambio de horario de verano no altera el resultado. La fecha de hoy se obtiene con la fecha local (`getFullYear`, `getMonth`, `getDate`); nunca con `toISOString()` ni con `new Date("AAAA-MM-DD")`, que se interpretan en UTC y desplazan el día.
- **Minutos de la semana:** Suma de minutos de todas las sesiones cuya fecha cae dentro de la semana actual (lunes a domingo).
- **Objetivo semanal:** Número de minutos que el usuario quiere estudiar en una semana. Se guarda en localStorage con la clave `diario-estudio-objetivo-semanal`.

## Requisitos funcionales

### RF-1: Fijar objetivo semanal
**Criterios de aceptación (EARS):**
- WHEN el usuario introduce un número de minutos y pulsa "Guardar objetivo", THE SYSTEM SHALL guardar el objetivo en localStorage.
- SI el usuario introduce un número negativo o cero, THEN THE SYSTEM SHALL mostrar un error y no guardar el objetivo.
- SI el usuario introduce un número con decimales, THEN THE SYSTEM SHALL redondear al entero más cercano (siguiendo la regla estándar de `Math.round()`: 300.5 → 301).
- SI el usuario introduce un número mayor que 10,000, THEN THE SYSTEM SHALL mostrar un error indicando que el objetivo es demasiado grande.
- SI el usuario introduce texto no numérico o borra el input, THEN THE SYSTEM SHALL mostrar un error y no guardar el objetivo.
- WHEN el objetivo se guarda correctamente, THE SYSTEM SHALL mostrar un toast de confirmación con `role="status"` y `aria-live="polite"` (no interrumpe la lectura, porque es un mensaje de éxito).
- WHERE se muestra el input del objetivo, THE SYSTEM SHALL tener un `<label for="goal-input">` visible y un `<p id="goal-help">` asociado por `aria-describedby` indicando el rango válido (1-10000).

### RF-2: Mostrar objetivo semanal
**Criterios de aceptación (EARS):**
- WHEN la página carga, THE SYSTEM SHALL mostrar el objetivo semanal actual si existe.
- SI no hay objetivo fijado, THEN THE SYSTEM SHALL mostrar un input vacío con placeholder "Ej: 300".
- SI hay objetivo fijado, THEN THE SYSTEM SHALL mostrar el valor en el input.
- WHERE se muestra el objetivo, THE SYSTEM SHALL indicar "minutos/semana" como unidad.
- WHERE se muestra el input, THE SYSTEM SHALL tener un layout responsive que se adapte a pantallas de 320px sin scroll horizontal: el input, la unidad y el botón se reorganizan en varias líneas cuando no caben en una (flex-wrap).

**Nota:** Este RF se verifica manualmente con Chrome DevTools (no es testeable con `node --test`).

### RF-3: Calcular minutos de la semana actual
**Criterios de aceptación (EARS):**
- WHEN se calcula el progreso, THE SYSTEM SHALL sumar los minutos de todas las sesiones cuya fecha cae dentro de la semana actual, comparando solo año, mes y día.
- SI una sesión tiene fecha futura, THEN THE SYSTEM SHALL incluirla en el cálculo si cae dentro de la semana actual. La regla "Las fechas futuras no suman" de AGENTS.md se refiere a la racha, no al objetivo semanal.
- SI una sesión tiene minutos negativos, minutos no numéricos (null, undefined, string) o fecha inválida, THEN THE SYSTEM SHALL ignorarla para el cálculo. La sesión no se elimina de localStorage.
- SI no hay sesiones en la semana actual, THEN THE SYSTEM SHALL mostrar 0 minutos.

### RF-4: Mostrar progreso semanal
**Criterios de aceptación (EARS):**
- WHEN la página carga, THE SYSTEM SHALL mostrar una barra de progreso que represente el porcentaje del objetivo cumplido.
- WHERE se muestra la barra, THE SYSTEM SHALL mostrar el texto "X / Y min" donde X son los minutos estudiados e Y es el objetivo.
- SI el objetivo es 0 o no existe, THEN THE SYSTEM SHALL mostrar la barra vacía (0%) y el texto "0 / 0 min".
- SI los minutos estudiados superan el objetivo, THEN THE SYSTEM SHALL mostrar la barra al 100% y el texto "X / Y min" con X > Y.
- WHEN se guarda una nueva sesión, THE SYSTEM SHALL actualizar la barra de progreso sin recargar la página.
- WHERE se muestra el progreso, THE SYSTEM SHALL tener exactamente una región viva con `aria-live="polite"` (el texto "X / Y min"), para que cada cambio se anuncie una sola vez. El mensaje de felicitación (RF-7) queda fuera de esa región.

### RF-5: Cambiar objetivo semanal
**Criterios de aceptación (EARS):**
- WHEN el usuario modifica el input del objetivo y pulsa "Guardar objetivo", THE SYSTEM SHALL actualizar el objetivo guardado.
- SI el usuario borra el input y pulsa "Guardar objetivo", THEN THE SYSTEM SHALL mostrar un error indicando que el objetivo no puede estar vacío.
- WHEN el objetivo se actualiza, THE SYSTEM SHALL recalcular el progreso con el nuevo objetivo.
- SI tras el cambio el objetivo ya no se cumple, THEN THE SYSTEM SHALL ocultar el mensaje de felicitación.
- WHERE se muestra un error, THE SYSTEM SHALL mostrarlo en un elemento persistente y enfocable (`<p id="goal-error" role="alert" tabindex="-1">`), distinto del toast, y mover el foco a ese elemento.
- WHERE el input tiene un error, THE SYSTEM SHALL marcarlo con `aria-invalid="true"` y apuntar su `aria-describedby` al mensaje de error.

**Nota:** Este RF se verifica manualmente con Chrome DevTools (no es testeable con `node --test`).

### RF-6: Compatibilidad de datos
**Criterios de aceptación (EARS):**
- SI no hay objetivo guardado, THEN THE SYSTEM SHALL comportarse como si el objetivo fuera 0 (barra vacía).
- SI el objetivo guardado en localStorage tiene un formato inválido, THEN THE SYSTEM SHALL ignorarlo y comportarse como si no hubiera objetivo. Esta decisión la toma una función pura (ver RNF "Lógica separada"), no la capa de localStorage.
- SI no hay sesiones guardadas, THEN THE SYSTEM SHALL mostrar 0 minutos en la barra de progreso.

### RF-7: Visualización del progreso
**Criterios de aceptación (EARS):**
- WHERE se muestra la barra de progreso, THE SYSTEM SHALL usar un color de relleno que cambie según el porcentaje:
  - 0-49%: #FFB347 (naranja suave)
  - 50-79%: #FF8C42 (naranja medio)
  - 80-99%: #FF6B35 (naranja intenso)
  - 100%+: #4CAF50 (verde, objetivo cumplido)
- El relleno de la barra es decorativo y no está sujeto a contraste mínimo: la información la transmiten el texto "X / Y min" y el `aria-label`, que sí cumplen 4.5:1. La barra conserva `role="progressbar"` para exponer su estado a lectores de pantalla, con los valores de ARIA definidos abajo.
- WHERE se muestra la barra de progreso, THE SYSTEM SHALL tener `role="progressbar"` y un `aria-label` descriptivo que se actualiza con el progreso (ej: "Progreso semanal: 150 de 300 minutos, 50%").
- WHEN el objetivo es 0 o no existe, THE SYSTEM SHALL fijar `aria-valuemin="0"`, `aria-valuemax="100"` y `aria-valuenow="0"` (porcentaje), evitando un máximo no válido.
- WHEN el objetivo es mayor que 0, THE SYSTEM SHALL fijar `aria-valuemin="0"`, `aria-valuemax` = porcentaje del objetivo (puede superar 100 si los minutos son mayores) y `aria-valuenow` = minutos estudiados. Si los minutos superan el objetivo, el texto visible se mantiene como "X / Y min" con X > Y.

## Requisitos no funcionales

- **Rendimiento:** El cálculo del progreso debe ser instantáneo (< 10ms).
- **Responsive:** La sección del objetivo semanal debe adaptarse a pantallas de 320px sin scroll horizontal.
- **Teclado:** Orden de tabulación lógico, foco visible en el input y el botón, y activación del botón con Enter y Espacio.
- **Tamaño de toque:** El input y el botón del objetivo deben alcanzar al menos 44x44px de área interactiva.
- **Sin dependencias:** HTML, CSS y JS puros, sin librerías ni build.
- **Lógica separada:** Los cálculos deben ser funciones puras sin DOM ni localStorage, que reciben "hoy" como parámetro. La spec exige estas funciones puras, todas testeables con `node --test`:
  - `getWeekRange(hoy)` → lunes y domingo de la semana actual.
  - `getMinutesInWeek(sesiones, hoy)` → minutos válidos de la semana.
  - `getProgressPercentage(minutos, objetivo)` → porcentaje, con 0 si el objetivo no es positivo.
  - `getProgressColor(porcentaje)` → color de relleno según el rango.
  - `isValidGoal(valor)` → si un objetivo es válido (entero entre 1 y 10000).
  - `normalizeGoal(valor)` → redondea y valida la entrada del usuario (cubre decimales, vacío y texto).
  - `parseGoalStored(valor)` → valida el objetivo leído de localStorage y devuelve 0 si el formato es inválido (cumple RF-6).
  - `isGoalAchieved(minutos, objetivo)` → si se cumple o supera el objetivo (cumple RF-5 y RF-7).
- **Tests:** La lógica anterior se prueba con `node --test` sin instalar paquetes. Los RF de interfaz (RF-1, RF-2, RF-4 y RF-5) se verifican manualmente con Chrome DevTools; solo su lógica de cálculo se automatiza.
- **Idioma:** Código en inglés; interfaz y documentación en español.

## Casos límite

| Caso | Comportamiento esperado | Verificación |
|------|------------------------|--------------|
| Sin objetivo fijado | Barra vacía, input vacío con placeholder | `node --test` |
| Objetivo = 0 | Barra vacía, mensaje de error al intentar guardar | `node --test` (lógica) + manual (mensaje) |
| Objetivo negativo | Mensaje de error, no se guarda | `node --test` |
| Objetivo con decimales | Redondeo al entero más cercano (Math.round) | `node --test` |
| Objetivo > 10,000 | Mensaje de error, no se guarda | `node --test` |
| Objetivo = 10,000 exacto | Válido, se guarda | `node --test` |
| Objetivo = 10,000.5 | Se redondea a 10,000 y es válido | `node --test` |
| Minutos estudiados = 0 | Barra al 0%, texto "0 / Y min" | `node --test` |
| Minutos estudiados > objetivo | Barra al 100%, texto "X / Y min" con X > Y, mensaje de felicitación | `node --test` |
| Semana sin sesiones | 0 minutos, barra al 0% | `node --test` |
| No hay ninguna sesión guardada (array vacío) | 0 minutos en la barra | `node --test` |
| Cambio de semana | El progreso se reinicia al calcular la nueva semana | `node --test` |
| Semana que cruza mes o año | El cálculo funciona correctamente | `node --test` |
| Fecha futura dentro de la semana | Se incluye en el cálculo | `node --test` |
| Objetivo guardado con formato inválido | Se ignora, se comporta como si no hubiera objetivo | `node --test` |
| Sesión con minutos negativos | Se ignora en el cálculo (no se elimina de localStorage) | `node --test` |
| Sesión con minutos no numéricos | Se ignora en el cálculo (no se elimina de localStorage) | `node --test` |
| Sesión con fecha inválida | Se ignora en el cálculo (no se elimina de localStorage) | `node --test` |
| Zona horaria | Cálculo siempre en hora local del usuario | `node --test` |
| Horario de verano (DST) | Cálculo por año/mes/día, no por horas | `node --test` |
| Vista móvil a 320px | Sin scroll horizontal, input y botón apilados | Manual (DevTools) |

## Fuera de alcance

- Mostrar el objetivo semanal en el mapa de calor.
- Notificaciones o recordatorios para cumplir el objetivo.
- Estadísticas históricas de objetivos cumplidos.
- Personalizar el inicio de la semana (lunes vs domingo).
- Compartir el progreso en redes sociales.
- Exportar el progreso como imagen o PDF.

## Criterios de finalización

- [ ] El usuario puede fijar un objetivo semanal en minutos.
- [ ] El objetivo se guarda en localStorage y persiste al recargar.
- [ ] Se muestra una barra de progreso con el porcentaje del objetivo cumplido.
- [ ] Se muestra el texto "X / Y min" con los minutos estudiados y el objetivo.
- [ ] La barra de progreso cambia de color según el porcentaje.
- [ ] Se muestra un mensaje de felicitación cuando se cumple o supera el objetivo.
- [ ] Se puede cambiar el objetivo en cualquier momento.
- [ ] Los errores (objetivo inválido, vacío, demasiado grande) se muestran correctamente.
- [ ] Tests de lógica pasan con `node --test`.
- [ ] Verificado con Chrome DevTools (consola sin errores, vista móvil correcta).

## Dudas abiertas

- [RESUELTO] La sección del objetivo semanal se coloca encima de las estadísticas.
- [RESUELTO] El objetivo semanal se guarda en localStorage con clave separada `diario-estudio-objetivo-semanal`.
- [RESUELTO] El relleno de la barra es decorativo; el contraste se garantiza en el texto y el aria-label, conservando la paleta actual.