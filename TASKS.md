# TASKS.md — Quiniela Expertos del Mundial 2026

Tareas pendientes de implementación. Ordenadas por prioridad sugerida.

---

## T1 — Onboarding: demo interactivo de pronósticos y puntuación
**Estado:** Pendiente ⏳  
**Archivo(s) afectados:** `src/pages/Onboarding/Onboarding.tsx`, `src/pages/Onboarding/StepDemo.tsx` (nuevo)

Nuevo paso en el flujo de onboarding que enseña al jugador cómo funciona la quiniela antes de su primer pronóstico real. Se inserta entre `StepProfile` y `StepBonus`.

### Acto 1 — Elige tu pronóstico
Muestra un partido ficticio **MEX 🇲🇽 vs 🇺🇸 USA** con el componente `ResultPicker` ya existente (mismo diseño LOCAL / EMPATE / VISITANTE). El jugador selecciona una opción para continuar.

### Acto 2 — Revela el marcador real
Anima la revelación del marcador real **2-1 MEX**. Luego desglosa los puntos según lo que el jugador predijo:
- Si eligió **LOCAL** → animación de acierto: `+3 pts ✓`
- Si eligió **EMPATE** o **VISITANTE** → animación de fallo: `+0 pts ✗`, con mensaje motivacional

El paso no bloquea el avance ni afecta puntos reales — es puramente educativo.

---

## T2 — Admin: sección "Premios" con generador de tarjeta estilo Panini
**Estado:** Pendiente ⏳  
**Archivo(s) afectados:** `src/pages/Admin/AdminPremios.tsx` (nuevo), `src/pages/Admin/PaniniCard.tsx` (nuevo), `src/pages/Admin/AdminLayout.tsx`

Nueva página en `/admin/premios`. El admin construye una tarjeta coleccionable de **340 × 480 px** para reconocer a un jugador y la exporta como PNG.

### Formulario (lado izquierdo en desktop, arriba en móvil)
- **Selector de jugador** — dropdown con avatar + nombre (lista de usuarios con `onboardingCompleted`)
- **Título del premio** — campo de texto libre (ej. "MVP del Torneo", "El Certero")
- **Mostrar puntos** — checkbox; muestra `stats.totalPoints` del jugador en la tarjeta
- **Mostrar posición** — checkbox; muestra `#N` en la tabla general
- **Color de acento** — selector visual de 6 opciones: Dorado / Plata / Bronce / Verde / Rojo / Azul

### Preview en tiempo real (lado derecho en desktop, abajo en móvil)
La tarjeta se actualiza en tiempo real conforme el admin edita el formulario. Usa los mismos colores hardcodeados que las otras share cards (sin `var(--accent)` — restricción html2canvas).

### Tarjeta (340 × 480 px)
```
┌─────────────────────────┐
│  QUINIELA EXPERTOS      │  ← header con franja de color de acento
│  MUNDIAL 2026           │
├─────────────────────────┤
│                         │
│      [avatar 120×156]   │  ← avatar rectangular estilo Panini
│                         │
│   NOMBRE DEL JUGADOR    │  ← Bebas Neue 28px
│   ── TÍTULO PREMIO ──   │  ← Bebas Neue 18px, color acento
│                         │
│   ⭐ 142 pts   #3       │  ← visible si checkboxes activos
│                         │
│   quinielaexpertos26    │  ← footer de marca
└─────────────────────────┘
```

### Exportación
- **Desktop / Android**: descarga directa (`<a download>`)
- **iOS PWA**: `navigator.share({ files: [png] })` → guarda en biblioteca de fotos
- Flujo idéntico al de `useShareImage` ya existente en el proyecto

### Integración en AdminLayout
Agregar enlace "Premios" en la sección REPORTES del sidebar desktop y en el panel "Más" del tab bar móvil.

---

## T3 — Admin/jugador: cambio de vista rápido en navegación
**Estado:** Pendiente ⏳  
**Archivo(s) afectados:** `src/pages/Admin/AdminLayout.tsx`, posiblemente `src/context/AuthContext.tsx`

El admin también puede ser jugador. Agregar en la barra de navegación del admin una acción rápida para cambiar entre **vista admin** y **vista jugador** (Dashboard) sin tener que cerrar sesión.

### Comportamiento
- Botón/chip en el sidebar desktop (parte inferior, antes del footer) y en el header móvil del admin
- Label: "Ver como jugador →" / al estar en el Dashboard como admin: "← Ir al admin"
- Navega a `/` (Dashboard) o `/admin` según el contexto
- No requiere cambio de rol ni re-autenticación — solo es navegación

### Consideraciones
- El admin ya tiene acceso al Dashboard (las rutas no lo bloquean), solo falta el atajo visual
- El botón en el Dashboard ya existe implícitamente si hay un enlace a `/admin` — revisar si ya está o si falta añadirlo también ahí
