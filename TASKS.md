# TASKS.md — Quiniela Expertos del Mundial 2026

Tareas pendientes de implementación. Ordenadas por prioridad sugerida.

---

## T1 — Onboarding: demo interactivo de pronósticos y puntuación
**Estado:** Completada ✅ (PR #8, deploy 2026-06-02)

---

## T2 — Admin: sección "Premios" con generador de tarjeta estilo Panini
**Estado:** Completada ✅ (PR #7, deploy 2026-06-02)

---

## T3 — Admin/jugador: cambio de vista rápido en navegación
**Estado:** Completada ✅ (PR #6, deploy 2026-06-02)

---

## T4 — Soporte de zonas horarias por jugador
**Estado:** Completada ✅ (PR #10, deploy 2026-06-02)

---

## T5 — Onboarding: reemplazar paso "Instalar" por "Guardar acceso directo"
**Estado:** Completada ✅ (PR #9, deploy 2026-06-02)

---

## T6 — Rediseño de tarjeta Panini (`/admin/premios`)
**Estado:** Pendiente ⏳  
**Archivo afectado:** `src/pages/Admin/PaniniCard.tsx`

Rediseñar la tarjeta para que **todo el fondo** use el color de acento seleccionado (no solo el header), los textos contrasten sobre ese fondo, y el avatar sea más grande.

### Cambios visuales

- **Fondo:** toda la tarjeta usa el color de acento como fondo (gradiente del `gradientA` al `gradientB` de arriba a abajo, o sólido del `primary`). El fondo oscuro `#0C0D14` actual desaparece.
- **Textos:** cambiar a colores que contrasten sobre el acento — blanco puro o negro según la luminosidad del color. Para dorado/plata/bronce/verde → texto blanco. Para rojo/azul → texto blanco también.
- **Avatar:** aumentar de 108×140px a ~130×168px para que sea más prominente.
- **Badges de stats:** ajustar colores para que contrasten sobre el fondo de acento (fondo semi-transparente oscuro o claro según el acento).
- **Footer y líneas decorativas:** adaptar al nuevo esquema cromático.

### Referencia visual
La imagen de referencia muestra la tarjeta actual con fondo oscuro y header de acento. El objetivo es que el acento cubra toda la tarjeta con el texto contrastando encima.

---

## T7 — Agregar temas de países adicionales
**Estado:** Pendiente ⏳  
**Skill:** `/add-theme` (ya existe en el proyecto)  
**Archivos afectados:** `src/index.css`, `src/lib/themes.ts`

Agregar 7 temas nuevos usando el skill `/add-theme` con las paletas FIFA WC 2026 de cada selección:

| País | Colores principales | Bandera |
|------|---------------------|---------|
| **Alemania** | Negro `#000000`, Rojo `#DD0000`, Amarillo `#FFCE00` | 🇩🇪 |
| **Francia** | Azul `#002395`, Blanco `#FFFFFF`, Rojo `#ED2939` | 🇫🇷 |
| **Argentina** | Celeste `#74ACDF`, Blanco `#FFFFFF` | 🇦🇷 |
| **España** | Rojo `#AA151B`, Amarillo `#F1BF00` | 🇪🇸 |
| **Bélgica** | Negro `#000000`, Amarillo `#FAD201`, Rojo `#EF3340` | 🇧🇪 |
| **Costa de Marfil** | Naranja `#F77F00`, Blanco `#FFFFFF`, Verde `#009A44` | 🇨🇮 |
| **Brasil** | Verde `#009C3B`, Amarillo `#FFDF00`, Azul `#002776` | 🇧🇷 |

Cada tema necesita: variables CSS en `src/index.css` (`.theme-<id>`) y entrada en el array `THEMES` de `src/lib/themes.ts`.
