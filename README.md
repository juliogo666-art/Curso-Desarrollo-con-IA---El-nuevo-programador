# Diario de Estudio

Web estática para registrar sesiones de estudio y ver la racha, el objetivo semanal y un mapa de calor de las últimas 12 semanas.

## Cómo usarla

Abre `index.html` con doble clic. No hace falta servidor, `npm` ni build.

Los datos se guardan en el navegador (`localStorage`):

- `diarioEstudio_sesiones`: array de `{ fecha: "AAAA-MM-DD", tema, minutos }`
- `diario-estudio-objetivo-semanal`: minutos objetivo de la semana

Para empezar de cero, en DevTools → Application → Local Storage borra esas dos claves.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos |
| `app.js` | Interfaz, localStorage, racha y lista de sesiones |
| `heat-map.js` | Lógica pura del mapa de calor |
| `weekly-goal.js` | Lógica pura del objetivo semanal |
| `tests/` | Tests de Node (`app`, `heat-map`, `weekly-goal`) |
| `docs/constitution.md` | Principios del proyecto |
| `specs/` | Specs, planes y tareas (SDD) |
| `README_curso.md` | Notas de las clases del curso |

## Tests

Desde la raíz del proyecto:

```
node --test
```

No instala paquetes. Las funciones de cálculo no usan el DOM.

## Más contexto

Reglas para agentes: `AGENTS.md`. Estado reciente: `MEMORY.md`.
