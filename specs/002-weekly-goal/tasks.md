# Tareas 002 — Objetivo Semanal de Estudio

- [x] **T1. Crear `weekly-goal.js` con funciones puras.** RF-3, RF-4, RF-7
  - Hecho cuando: `getWeekRange`, `getMinutesInWeek`, `getProgressPercentage`, `getProgressColor`, `isValidGoal` están implementadas y exportadas.

- [x] **T2. Crear `weekly-goal.test.js` con tests de funciones puras.** RF-3, RF-4, RF-7
  - Hecho cuando: Todos los tests pasan con `node --test`.

- [x] **T3. Añadir sección de objetivo semanal en `index.html`.** RF-1, RF-2, RF-4
  - Hecho cuando: La sección con input, botón, barra de progreso y texto está en el HTML encima de las estadísticas.

- [x] **T4. Añadir estilos de la sección en `styles.css`.** RF-4, RF-7
  - Hecho cuando: La barra de progreso, input, botón y mensajes tienen estilos correctos y responsive.

- [x] **T5. Implementar lógica de guardar objetivo en `app.js`.** RF-1, RF-5
  - Hecho cuando: El botón "Guardar" valida el input, guarda en localStorage y muestra toast de confirmación.

- [x] **T6. Implementar carga de objetivo al iniciar en `app.js`.** RF-2
  - Hecho cuando: Al cargar la página, el input muestra el objetivo guardado si existe.

- [x] **T7. Implementar cálculo y visualización del progreso en `app.js`.** RF-3, RF-4, RF-7
  - Hecho cuando: La barra de progreso y el texto "X / Y min" se muestran correctamente al cargar.

- [x] **T8. Implementar actualización del progreso al guardar sesión.** RF-4
  - Hecho cuando: Al guardar una nueva sesión, la barra de progreso se actualiza sin recargar.

- [x] **T9. Implementar mensaje de felicitación al cumplir objetivo.** RF-7
  - Hecho cuando: Al alcanzar o superar el 100%, se muestra "¡Objetivo cumplido! 🎉".

- [x] **T10. Verificar con Chrome DevTools.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7
  - Hecho cuando: La funcionalidad funciona correctamente, consola sin errores, vista móvil correcta.

- [x] **T11. Añadir `normalizeGoal`, `parseGoalStored` e `isGoalAchieved`.** RF-1, RF-5, RF-6
  - Hecho cuando: Las tres funciones están exportadas y `cargarObjetivo` / el guardado las usan.

- [x] **T12. Tests de las funciones puras nuevas.** RF-1, RF-5, RF-6
  - Hecho cuando: `node --test` cubre redondeo, localStorage inválido y objetivo cumplido.
