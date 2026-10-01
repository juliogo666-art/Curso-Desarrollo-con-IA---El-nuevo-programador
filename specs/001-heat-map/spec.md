# Spec 001 — Mapa de Calor de Estudio

## Contexto y objetivo

El Diario de Estudio registra sesiones con fecha, tema y minutos. Actualmente muestra estadísticas agregadas (racha, total, días este mes) pero no ofrece una visión temporal del progreso.

**Objetivo:** Mostrar un mapa de calor tipo GitHub que permita visualizar de un vistazo los días estudiados de las últimas 12 semanas, donde la intensidad del color refleja los minutos estudiados.

**Por qué:** Refuerza la motivación mediante visibilidad del progreso constante y ayuda a identificar patrones de estudio.

## Usuarios

- **Estudiante autodidacta** que registra sesiones diarias y quiere ver su constancia reflejada visualmente.

## Historias de usuario

1. Como estudiante, quiero ver un mapa de calor con mis últimos 3 meses de estudio para sentir que mi esfuerzo acumulado es visible.
2. Como estudiante, quiero distinguir rápidamente los días en los que estudié más de los que estudié menos para identificar mis patrones.
3. Como estudiante, quiero ver los días sin sesión en gris para distinguir claramente cuándo no estudié.

## Requisitos funcionales

### RF-1: Visualización del mapa de calor
**Criterios de aceptación (EARS):**
- WHEN la página carga, THE SYSTEM SHALL mostrar un mapa de calor con exactamente 84 celdas (12 semanas × 7 días) en formato de grid.
- WHERE el mapa se muestra, THE SYSTEM SHALL organizar los días en columnas por semana y filas por día de la semana (lunes a domingo).
- IF el día actual no es lunes, THEN THE SYSTEM SHALL mostrar las celdas de días anteriores a la primera semana en gris claro (fuera de rango).
- IF el día actual no es domingo, THEN THE SYSTEM SHALL mostrar las celdas de días posteriores al día actual en gris claro (fuera de rango).

### RF-2: Cálculo de intensidad por día
**Criterios de aceptación (EARS):**
- WHEN se muestra un día, THE SYSTEM SHALL asignar color según escala fija:
  - 0 minutos → gris claro (día vacío)
  - 1-30 minutos → verde suave
  - 31-60 minutos → verde medio
  - 61-120 minutos → verde intenso
  - 121+ minutos → verde máximo
- IF un día tiene múltiples sesiones, THEN THE SYSTEM SHALL sumar todos los minutos de ese día para determinar la intensidad.
- IF los minutos tienen decimales, THEN THE SYSTEM SHALL redondear al entero más cercano antes de asignar color.
- WHERE se definen los rangos, THE SYSTEM SHALL incluir el límite inferior en cada rango (ej: 30 minutos = verde suave, 31 = verde medio).

### RF-3: Fechas futuras
**Criterios de aceptación (EARS):**
- IF una sesión tiene fecha futura dentro de las 12 semanas visibles, THEN THE SYSTEM SHALL mostrarla en el mapa con su color correspondiente.
- IF una sesión tiene fecha futura fuera de las 12 semanas visibles, THEN THE SYSTEM SHALL ignorarla en el mapa.
- WHERE el mapa muestra días futuros sin sesión, THE SYSTEM SHALL mostrarlos en gris claro.

### RF-4: Actualización dinámica
**Criterios de aceptación (EARS):**
- WHEN se guarda una nueva sesión, THE SYSTEM SHALL actualizar el mapa de calor sin recargar la página.
- WHEN se carga la página, THE SYSTEM SHALL calcular el mapa desde cero basándose en las sesiones guardadas.

### RF-5: Compatibilidad de datos
**Criterios de aceptación (EARS):**
- IF no hay sesiones guardadas, THEN THE SYSTEM SHALL mostrar el mapa completo en gris claro.
- WHERE se muestran sesiones antiguas (fuera de las 12 semanas), THE SYSTEM SHALL ignorarlas en el mapa.
- IF una sesión tiene minutos = 0, THEN THE SYSTEM SHALL tratarla como día vacío (gris claro).
- IF una sesión tiene minutos negativos, THEN THE SYSTEM SHALL ignorarla.
- IF una sesión tiene fecha inválida o malformada, THEN THE SYSTEM SHALL ignorarla.

### RF-6: Leyenda de colores
**Criterios de aceptación (EARS):**
- WHEN se muestra el mapa, THE SYSTEM SHALL incluir una leyenda visual debajo del grid con los 5 niveles de color y su rango de minutos correspondiente.
- WHERE se muestra la leyenda, THE SYSTEM SHALL usar los mismos colores que el mapa para cada nivel.
- WHERE se muestra la leyenda, THE SYSTEM SHALL mantenerla siempre debajo del grid, independientemente del tamaño de pantalla.

### RF-7: Indicador temporal
**Criterios de aceptación (EARS):**
- WHEN se muestra el mapa, THE SYSTEM SHALL indicar el rango de fechas visible en formato "DD mmm — DD mmm" (ej: "12 sep — 4 oct").
- WHERE se muestra el indicador, THE SYSTEM SHALL colocarlo encima del grid, alineado a la izquierda.
- IF el rango de 12 semanas cruza un cambio de mes, THEN THE SYSTEM SHALL mostrar ambos meses en el indicador.

## Requisitos no funcionales

- **Rendimiento:** El mapa debe calcularse en menos de 100ms con hasta 500 sesiones.
- **Responsive:** El grid debe adaptarse a pantallas de 320px sin scroll horizontal.
- **Accesibilidad:** Cada celda debe tener texto alternativo descriptivo (ej: "1 de octubre: 45 minutos").
- **Sin dependencias:** HTML, CSS y JS puros, sin librerías ni build.
- **Lógica separada:** Los cálculos del mapa (fechas, colores, intensidad) deben ser funciones puras sin DOM ni localStorage, que reciben "hoy" como parámetro.
- **Tests:** La lógica del mapa debe ser testeable con `node --test` sin instalar paquetes.
- **Idioma:** Código en inglés; interfaz y documentación en español.

## Casos límite

| Caso | Comportamiento esperado |
|------|------------------------|
| Sin sesiones | Mapa completo en gris claro |
| Múltiples sesiones mismo día | Suma de minutos para calcular intensidad |
| Sesiones con fecha futura dentro de 12 semanas | Se muestran con su color correspondiente |
| Sesiones con fecha futura fuera de 12 semanas | No se muestran en el mapa |
| Sesiones fuera del rango (>12 semanas) | No se muestran en el mapa |
| Minutos con decimales | Redondeo al entero más cercano para asignar color |
| Minutos = 0 | Día vacío (gris claro) |
| Minutos negativos | Sesión ignorada |
| Fecha inválida o malformada | Sesión ignorada |
| Zona horaria | Cálculo siempre en hora local del usuario |
| Horario de verano (DST) | Cálculo basado en fechas, no en horas |
| Año bisiesto | Cálculo correcto del 29 de febrero |
| Minutos muy grandes (10,000+) | Verde máximo (sin límite superior) |
| Cambio de fecha del sistema | Mapa se recalcula al recargar la página |

## Fuera de alcance

- Exportar el mapa como imagen o PDF.
- Compartir el mapa en redes sociales.
- Hacer clic en un día para ver detalles o editar sesiones.
- Tooltips con información adicional al pasar el mouse.
- Personalizar la escala de colores o el número de semanas.
- Mostrar rachas o estadísticas adicionales dentro del mapa.
- Recálculo automático del mapa sin recargar la página (excepto al guardar sesión).

## Criterios de finalización

- [ ] El mapa muestra 84 celdas (12 semanas) en grid correcto (lunes a domingo).
- [ ] Las celdas fuera de rango (anteriores a la primera semana o posteriores al día actual) se muestran en gris claro.
- [ ] La escala de colores fija funciona según RF-2 con límites inclusivos.
- [ ] Se actualiza dinámicamente al guardar sesión.
- [ ] Responsive en 320px sin scroll horizontal.
- [ ] Texto alternativo accesible en cada celda.
- [ ] Leyenda visible debajo del grid con los 5 niveles.
- [ ] Indicador temporal visible encima del grid.
- [ ] Tests de lógica pasan con `node --test`.
- [ ] Verificado con Chrome DevTools (consola sin errores, vista móvil correcta).

## Dudas abiertas

- [NECESITA ACLARACIÓN] ¿El mapa se coloca encima o debajo de las estadísticas actuales? (decidir en el plan de implementación)
