# Plan 001 — Mapa de Calor de Estudio

Plan de implementación de `specs/001-heat-map/spec.md`. Solo describe **qué** y **por qué**; el código se escribirá en la fase de tarea.

## 0. Estado de partida (hallazgos)

Ya existe una implementación en curso que este plan corrige:

| Hallazgo | Impacto |
|---|---|
| `app.js` invoca `require('./heat-map.js')` dentro de `mostrarHeatMap()` | **Bloqueante.** `require` no existe en el navegador → `ReferenceError` en cada guardado y en la carga inicial. El mapa no funciona. |
| `getWeeksRange` termina en `hoy`, sin relleno hasta el domingo | **Bloqueante (RF-1).** Sin relleno, el grid no son 12 columnas alineadas de lunes a domingo y no existen las celdas grises que pide RF-1. |
| El listado es plano y el CSS usa `repeat(12, 1fr)` | **Incorrecto (RF-1).** "Columnas = semana, filas = día" solo funciona con flujo por columnas y 7 filas. |
| `getColorForMinutes` compara minutos crudos sin redondear | **Incorrecto (RF-2).** Falta el redondeo al entero más cercano. |
| No se valida el formato de fecha | **Incorrecto (RF-5).** Falta el descarte explícito de fechas malformadas. |
| Las celdas llevan `title` | **Fuera de alcance.** La spec excluye tooltips. |
| `role="img"` en el contenedor **y** en cada una de las 84 celdas | **Accesibilidad.** Aroles anidados redundantes; 84 imágenes para un lector de pantalla. |
| Identificadores en español (`minutosPorDia`, `fechaLegible`) | **Conflito con constitución 6** (código en inglés). |

**Dudas resueltas en este plan** (estaban marcadas `[NECESITA ACLARACIÓN]` en la spec):

- **Ubicación del mapa:** entre las estadísticas y el formulario. Las stats son la lectura de un vistazo, el mapa es la prueba visual de la constancia, y el formulario es la acción. Poner el formulario más arriba competiría con el objetivo motivacional.
- **Contradicción RF-1 / RF-3:** ver §6. Requiere una corrección literal de la spec antes de cerrar los criterios de finalización.

---

## 1. Archivos y responsabilidades

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `heat-map.js` | Ya existe → **reescribir** | Toda la lógica del mapa. Funciones puras: nada de DOM, nada de localStorage, "hoy" entra por parámetro. Exportación dual navegador/Node. | RF-1, RF-2, RF-3, RF-5, RF-7 |
| `heat-map.test.js` | Ya existe → **reescribir** | Tests de la lógica con `node --test`. Cubre cada criterio de aceptación verificable. | Todos |
| `app.js` | Modificar | Único punto de contacto con el DOM y el almacenamiento. Llama a las funciones puras y pinta el resultado. **Sin `require`.** | RF-4, RNF accesibilidad |
| `index.html` | Modificar | Estructura y orden de las secciones; anclas para el grid, la leyenda y el indicador. Un `<script>` más. | RF-1, RF-6, RF-7 |
| `styles.css` | Modificar | Grid de 7 filas con flujo por columnas, los 5 niveles de color, leyenda e indicador. Responsive. | RF-1, RF-6, RNF responsive |
| `MEMORY.md` | Modificar | Estado, decisiones y errores a evitar. | — |
| `docs/constitution.md` | **No tocar** | Principios innegociables. | — |
| `specs/001-heat-map/spec.md` | Modificar | Solo la cláusula contradictoria de RF-1 (ver §6). | — |

Ningún archivo nuevo. Ninguna dependencia. Sigue funcionando con doble clic sobre `index.html` (constitución 1).

---

## 2. Funciones puras de lógica

Todas reciben `today` como parámetro y devuelven datos planos. Sin `Date.now()`, sin `document`, sin `localStorage` (constitución 3).

| Función | Firma | Entrada | Salida | RF |
|---|---|---|---|---|
| `isValidSession` | `(session) → boolean` | Una sesión | `true` si fecha `AAAA-MM-DD` real y `minutes` es número finito ≥ 0 | RF-5 |
| `isValidDateString` | `(text) → boolean` | Cadena | Valida forma **y** calendario (rechaza `2026-02-30`, `2026-13-01`) | RF-5 |
| `toDateKey` | `(date) → "AAAA-MM-DD"` | `Date` local | Clave de fecha usando `getFullYear/getMonth/getDate` | constitución 5 |
| `sumMinutesByDay` | `(sessions) → Map<string, number>` | Sesiones | Minutos acumulados por fecha, solo de sesiones válidas | RF-2, RF-5 |
| `colorForMinutes` | `(minutes) → level` | Minutos ya redondeados | `empty` \| `level-1..4` | RF-2 |
| `getWeekStart` | `(today) → Date` | Fecha local | Lunes de la semana de `today` | RF-1 |
| `getHeatMapRange` | `(today, weeks=12) → {start, end}` | Fecha local | 12 semanas completas alineadas a lunes | RF-1 |
| `buildHeatMap` | `(sessions, today, weeks=12) → Cell[]` | Sesiones + hoy | 84 celdas en orden cronológico, lunes→domingo, con `isFuture` | RF-1, RF-2, RF-3, RF-5 |
| `formatDayLabel` | `(dateKey, minutes) → string` | Celda | `"1 de octubre: 45 minutos"` / `"1 de octubre: sin estudio"` | RNF accesibilidad |
| `formatDateRange` | `(start, end) → string` | Rango | `"12 sep — 4 oct"` | RF-7 |

`Cell` = `{ date, minutes, level, isFuture, isOutOfRange }`.

**Por qué el listado va plano y cronológico.** El algoritmo no conoce la geometría. La columna↔semana y la fila↔día las resuelve el CSS con 7 filas y flujo por columnas. Así la lógica se testea en una línea (`cells[0].date` es un lunes) y no necesita una función aparte de "colocar en fila N, columna M".

**Por qué `isOutOfRange` viaja en la celda.** La spec ya no necesita celdas grises fuera de rango si el rango son 12 semanas completas (ver §6), pero el campo queda documentando el borde y evita que un futuro cambio reintroduzca el bug.

---

## 3. Algoritmo en pseudocódigo

Cubre RF-1, RF-2, RF-3, RF-5.

```
buildHeatMap(sessions, today, weeks = 12):

    // 1. Acumular minutos por día. Descarta lo que no es válido.  [RF-2, RF-5]
    totals = empty map
    for session in sessions:
        if NOT isValidSession(session):            # fecha real, minutes número ≥ 0
            continue                             # RF-5: sesión ignorada
        key = session.date
        totals[key] = totals.get(key, 0) + session.minutes

    // 2. Rango de 12 semanas completas alineado a lunes.  [RF-1]
    weekStart  = getWeekStart(today)              # lunes de la semana actual
    start      = weekStart - (weeks - 1) semanas   # lunes de hace 11 semanas
    totalCells = weeks * 7                        # 84  [RF-1]

    // 3. Recorrer un número fijo de días.  [RF-1]
    #    Bucle por conteo, no por comparación de fechas: el cambio de horario
    #    de verano altera la duración real del día y rompería "while d <= end".
    cells = []
    for i = 0 to totalCells - 1:
        date  = start + i días
        key   = toDateKey(date)                   # fecha LOCAL (constitución 5)
        raw   = totals.get(key, 0)
        isFuture = date > hoy (comparando Y/M/D, no la marca de tiempo)

        # Sesión futura dentro de la ventana: se muestra con su color.  [RF-3]
        # Sesión futura fuera de la ventana: no existe celda, se ignora. [RF-3]
        if isFuture AND raw = 0:
            level = "empty"                       # día futuro vacío → gris  [RF-1]
        else if isFuture:
            level = colorForMinutes(round(raw))   # [RF-3] gana sobre el gris
        else:
            level = colorForMinutes(round(raw))   # [RF-2]

        cells.append({ date: key, minutes: raw, level, isFuture })

    return cells                                  # siempre 84 elementos
```

```
colorForMinutes(minutes):                          # recibe el entero ya redondeado
    if minutes <= 0:   return "empty"             # RF-2: 0 min → gris
    if minutes <= 30:  return "level-1"           # límite inferior incluido: 30 → level-1
    if minutes <= 60:  return "level-2"           # 31 → level-2
    if minutes <= 120: return "level-3"           # 61 → level-3
    return "level-4"                              # 121+ → level-4, sin techo
```

```
isValidSession(session):
    if session no es objeto:                    return false
    if session.date no es cadena:               return false
    if NOT isValidDateString(session.date):     return false   # RF-5
    if session.minutes no es número finito:     return false   # "invalid" fuera
    if session.minutes < 0:                     return false   # RF-5
    return true

isValidDateString(text):
    if text no tiene forma "AAAA-MM-DD":        return false
   _year, _month, _day = partes enteras
    _date = new Date(_year, _month - 1, _day)   # constructor numérico = hora local
    return _date.getFullYear() == _year
       AND _date.getMonth() + 1 == _month
       AND _date.getDate() == _day              # rechaza 2026-02-30 y 2026-13-01
```

`formatDateRange(start, end)` concatena `formatDateShort(start)` y `formatDateShort(end)` con una raya. Como cada extremo lleva su mes, un rango que cruza cambio de mes muestra los dos sin lógica extra (**RF-7**).

---

## 4. Cómo se pinta en la interfaz

**`index.html`** — Sección `heatmap` entre `.stats` y `.formulario`, con: título, elemento del indicador de rango (encima, alineado a la izquierda), contenedor del grid, y bloque de leyenda con los 5 niveles. Un `<script>` a `heat-map.js` **antes** de `app.js`, sin `type="module"` (rompería `file://`, constitución 1).

**`app.js`** — `mostrarHeatMap()`:
1. Lee las sesiones (única vez).
2. Calcula `cells = buildHeatMap(sessions, today)`.
3. Escribe el texto del indicador con `formatDateRange(...)`. **RF-7**
4. Rellena el grid con una celda por elemento de `cells`, en orden. **RF-1**
5. La leyenda vive en el HTML, no se genera por JS. Al ser contenido fijo, no necesita testeabilidad y evita que se desincronice del CSS. **RF-6**

Se invoca al arrancar y dentro del manejador de guardado, junto a `mostrarRacha()` y `mostrarSesiones()`. **RF-4**

**`styles.css`** — El detalle que hace funcionar RF-1:
- El grid declara **7 filas**, no 12 columnas, y el flujo va **por columnas**.
- Cada celda es un cuadrado (`aspect-ratio`), color por clase de nivel.
- Consecuencia: como `cells` es cronológico y empieza en lunes, cada bloque de 7 celdas llena una columna de arriba abajo → **columnas = semana, filas = día de la semana**. La geometría sale gratis del CSS.
- Responsive: 12 columnas y `gap` pequeño caben en 320px sin scroll horizontal; las celdas encogen por `aspect-ratio`. **RNF responsive**
- Accesibilidad: el contenedor lleva el rol y la etiqueta resumen; cada celda lleva `aria-label` descriptivo y **no** lleva `title` (la spec saca los tooltips del alcance) ni `role="img"` (84 imágenes anidadas saturan al lector de pantalla). **RNF accesibilidad**
- La leyenda usa los mismos valores de color que las celdas, en un solo bloque de reglas compartidas, para que no puedan divergir. **RF-6**
- `prefers-reduced-motion` respetado: la transición de hover del botón se desactiva. No se añade animación de entrada al mapa: el movimiento no provocado por el usuario solo se usa para llamar la atención sobre algo concreto, y una entrada de 84 celdas ralentiza la lectura.

**Sin datos →** el mapa se pinta entero en gris por `colorForMinutes(0) = empty`, sin caso especial. **RF-5**

---

## 5. Decisiones técnicas

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D1 | Un solo archivo `heat-map.js` compartido por navegador y Node, con exportación dual condicionada (`typeof module`) | **(a)** `<script type="module">` con `import`/`export` | Los módulos ES están bloqueados por CORS en `file://`; la web dejaría de abrirse con doble clic. Viola constitución 1. |
| | | **(b)** Duplicar la lógica dentro del test | Los tests pasarían probando una copia, no el código real. La puerta de los tests no significaría nada. |
| | | **(c)** `app.js` usa `require` | Es lo que hay ahora y **no existe en el navegador**. Rompe la web entera. |
| D2 | `heat-map.js` define funciones globales y `app.js` las usa directamente por ámbito global | Injectar un objeto `window.DiaryHeatMap` explícito | La exportación dual (D1) deja los nombres ya en alcance global. Envolverlos en un objeto añade indirección sin beneficio en 6 funciones. |
| D3 | El listado es plano y cronológico; el CSS hace semanas×días | Calcular `row`/`col` en JS y usar `grid-area` | Pone geometría de presentación en la lógica pura, que la constitución 3 excluye. Con 7 filas y flujo por columnas, la alineación sale del orden cronológico. |
| D4 | El rango son 12 semanas **completas** alineadas a lunes (empieza en lunes, termina en el domingo de la semana actual) | 84 días terminando hoy | Terminar en hoy impide alinear columnas: el último bloque no acaba en domingo y RF-1 queda imposible de cumplir. Con hoy = jueves, la columna 12 incluye vie/dom futuros en gris, que es exactamente lo que RF-1 describe. |
| D5 | Bucle por **conteo fijo** de 84 iteraciones, no `while fecha <= fin` | Comparar `current <= end` | Un día no siempre dura 24h: el cambio de horario de verano rompe la comparación y salta o repite un día. Contar es immune al DST y trivial de verificar. |
| D6 | Validar la fecha contra el calendario real (`new Date(y, m-1, d)` y comparar componentes) | Solo validar con `/^\d{4}-\d{2}-\d{2}$/` | La forma correcta admite `2026-02-30`. Comparar componentes contra el calendario es lo que detecta el caso del spec. |
| D7 | Leyenda fija en HTML, no generada por JS | Generarla desde el mismo array de niveles que usa `colorForMinutes` | Los colores viven en CSS en ambos casos; la leyenda estática no puede desincronizarse de nada y no necesita test. |
| D8 | Redondear con `Math.round` **antes** de decidir el nivel | Decidir el nivel con los minutos crudos | RF-2 manda redondear. `30.6` sin redondear da `level-2`, y redondeado da `31 → level-2`; pero `120.4` sin redondear da `level-4` y redondeado da `level-3`. El redondeo cambia el resultado, así que va explícito. |
| D9 | Fechas en hora local en todo el recorrido (`getFullYear/getMonth/getDate`, `new Date(y, m-1, d)`, `setDate`) | `toISOString()` o `new Date("AAAA-MM-DD")` | Ambos interprets en UTC y desplazan el día hacia atrás. Prohibido explícitamente en constitución 5 y en MEMORY. |
| D10 | Identificadores y comentarios en inglés; cadenas visibles en español | Todo en español | Constitución 6. Los datos de localStorage (`fecha`, `tema`, `minutos`) **no se tocan**: son el contrato con lo ya guardado (constitución 5). |
| D11 | El mapa se sitúa entre stats y formulario | Bajo la lista de sesiones | Confirma la duda `[NECESITA ACLARACIÓN]` de la spec: las stats son lectura inmediata, el mapa la prueba visual, el formulario la acción. |
| D12 | Sin animación de entrada en el mapa | Fundido + deslizamiento al cargar | Movimiento no provocado por el usuario en 84 celdas; ralentiza la lectura y es el patrón que más delata una página generada. |

---

## 6. Bloqueo a resolver: contradicción RF-1 / RF-3

Tal como está escrita, la spec se contradice y **las dos lecturas no pueden cumplirse a la vez**:

- **RF-1:** "días posteriores al día actual en gris claro".
- **RF-3:** "sesión con fecha futura dentro de las 12 semanas visibles → mostrarla con su color correspondiente".

Con D4 la columna 12 contiene días futuros. Si una sesión existe en esa columna, RF-3 dice "verde" y RF-1 dice "gris". Un día no puede ser ambos.

**Lectura propuesta (recomendada):** el gris de RF-1 aplica a los días posteriores al día actual **que no tienen sesión**, y cuando hay sesión futura manda RF-3. Es la única lectura que deja RF-3 con contenido (si no, su primera cláusula sería vacía) y la que casa con el propio RF-3, que ya dice "días futuros **sin sesión** → gris".

**Consecuencia sobre el criterio de finalización** "Las celdas fuera de rango ... posteriores al día actual se muestran en gris claro": con esta lectura solo es cierto cuando no tienen sesión.

**Acción requerida antes de dar la tarea por cerrada:** editar esa línea de la spec para que diga "días posteriores al día actual **sin sesión**". Mientras no se edite, el criterio de finalización y RF-3 son incompatibles y no se pueden marcar los dos como cumplidos a la vez.

---

## 7. Estrategia de tests

`node --test` en la raíz, sin instalar nada (constitución 4). Nombres en español, código en inglés.

### `sumMinutesByDay` — RF-2, RF-5
- Dos sesiones del mismo día → suma.
- Sesión con `date` nula → ignorada.
- `minutes` negativo → ignorada.
- `minutes` como cadena (`"45"`) → ignorada.
- `minutes: 0` → el día existe con total 0 (no se borra).
- Arreglo vacío → mapa vacío.

### `isValidSession` / `isValidDateString` — RF-5
- `"2026-02-30"` → `false` (no existe en el calendario).
- `"2026-13-01"` → `false`.
- `"2024-02-29"` → `true` (año bisiesto, caso límite explícito).
- `"2026-02-28"` → `true`.
- `"26-10-01"`, `"2026-10-1"`, `""`, `null` → `false`.
- `"hoy"`, número, objeto → `false`.

### `colorForMinutes` — RF-2
- Frontera de cada rango: `0`, `1`, `30`, `31`, `60`, `61`, `120`, `121`.
- `10000` → `level-4` (sin techo, caso límite).
- `-5` → `empty`.

### `getWeekStart` / `getHeatMapRange` — RF-1
- Para hoy jueves → devuelve el lunes anterior.
- Para hoy lunes → devuelve ese mismo lunes.
- Para hoy domingo → devuelve el lunes 6 días antes.
- El rango cubre exactamente 12 semanas.
- Rango que cruza el cambio de hora: los extremos siguen siendo lunes y domingo (DST).

### `buildHeatMap` — RF-1, RF-2, RF-3, RF-5
- Devuelve **exactamente 84** celdas.
- `cells[0].date` es un **lunes** (alineación del inicio).
- Para cada columna `i`, `cells[i*7]` es lunes y `cells[i*7+6]` es domingo → cubre RF-1 entero con una aserción.
- Sin sesiones → las 84 celdas en `empty`.
- Hoy tiene sesión → nivel correcto en su celda.
- Sesión futura **con** minutos → nivel coloreado e `isFuture = true`. **RF-3**
- Sesión futura **sin** sesión → `empty`. **RF-3**
- Sesión futura fuera de las 12 semanas → no aparece en ninguna celda. **RF-3**
- Sesión antigua fuera de rango → no aparece. **RF-5**
- `120.4` minutos → `level-3` (redondeo, D8). **RF-2**
- `date` malformada → la celda de ese día sale `empty`, sin romper. **RF-5**
- `today` fijo en todos los tests → sin dependencia del reloj real.

### `formatDateRange` / `formatDayLabel` — RF-7, RNF accesibilidad
- Rango dentro de un mes → `"1 oct — 4 oct"`.
- Rango cruzando cambio de mes → aparecen los dos meses. **RF-7**
- Rango cruzando año (enero).
- Etiqueta de día con minutos → incluye fecha y minutos.
- Etiqueta de día vacío → "sin estudio".

### Rendimiento — RNF (<100ms con 500 sesiones)
- 500 sesiones sobre 84 días → `buildHeatMap` devuelve 84 celdas.
- Medición del tiempo con margen amplio (por ejemplo 500ms) para que no sea un test frágil. La cifra real se documenta en MEMORY; el test garantiza ausencia de degradación, no un cronómetro exacto.

### Fuera de los tests
El HTML, el CSS y el DOM. Se verifican con Chrome DevTools según constitución 4 y AGENTS.md: `index.html` abierto, sesión guardada, mapa actualizado sin recargar (RF-4), consola limpia, vista a 375px sin scroll horizontal (RNF responsive), y `aria-label` presente en las celdas.

### Puerta
No se avanza con tests en rojo (constitución 4). El orden es: lógica pura + tests en verde → luego el DOM.

---

## 8. Trazabilidad

| RF | Implementado en |
|---|---|
| RF-1 grid 84 celdas, columnas=semana, filas=día, relleno gris | `getWeekStart`, `getHeatMapRange`, `buildHeatMap` (paso 2 y 3); CSS 7 filas + flujo por columnas |
| RF-2 escala fija, suma por día, redondeo, límites incluidos | `sumMinutesByDay`, `colorForMinutes`, `buildHeatMap` (paso 1, 3 y 4) |
| RF-3 futuras dentro/fuera de ventana, futuras vacías en gris | `buildHeatMap` (paso 3); tests de futura con/sin sesión |
| RF-4 actualización al guardar y en carga | `mostrarHeatMap()` en `init()` y en el manejador de `submit` |
| RF-5 sin datos, antiguas, 0, negativos, fecha inválida | `isValidSession`, `isValidDateString`, `sumMinutesByDay`, `buildHeatMap` |
| RF-6 leyenda de 5 niveles, mismos colores, siempre debajo | Bloque de leyenda fijo en `index.html`; color compartido en `styles.css` |
| RF-7 rango "DD mmm — DD mmm", alineado a la izquierda, cruza meses | `formatDateRange`, `formatDayLabel`; elemento en `index.html`; CSS |

| RNF | Implementado en |
|---|---|
| Rendimiento <100ms / 500 sesiones | Algoritmo O(sesiones + 84); test con margen amplio |
| Responsive 320px sin scroll | CSS del grid, `gap` pequeño, celdas con `aspect-ratio` |
| Accesibilidad por celda | `formatDayLabel` → `aria-label`; sin `role="img"` anidado |
| Sin dependencias ni build | Un `<script>` clásico; sin npm |
| Lógica separada | `heat-map.js` sin DOM ni localStorage; "hoy" por parámetro |
| Tests con `node --test` | `heat-map.test.js` |
| Código en inglés, interfaz en español | `heat-map.js` y `app.js` en inglés; etiquetas y textos en español |
