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
**Estado:** Completada ✅ (PR #11, deploy 2026-06-02)

---

## T7 — Temas de países adicionales (14 temas en total)
**Estado:** Completada ✅ (PR #12, deploy 2026-06-02)

---

## T9 — Onboarding: avatar rectangular + opción de cámara
**Estado:** Completada ✅ (PR #14, deploy 2026-06-02)

---

## T8 — Modo claro (light theme)
**Estado:** Pausado 🔄 (rama `feat/T8-light-mode` — requiere más trabajo de diseño)  
**Archivos afectados:** `src/index.css`, `src/pages/Preferences/Preferences.tsx`, `src/types/User.ts`, `src/services/firestoreUsers.ts`, posiblemente `src/context/ThemeContext.tsx`

Actualmente la app es 100% oscura. Agregar soporte para un modo de apariencia claro donde fondos, superficies y textos se inviertan a tonos blancos/grises claros, manteniendo el color de acento del tema del país activo.

### Estrategia

El modo claro es **ortogonal** a los temas de país — un usuario puede tener tema España (rojo) en modo claro o en modo oscuro. Son dos dimensiones independientes:
- `theme` (país) → controla los colores de acento (`--accent`, `--accent-light`, blobs, etc.)
- `colorMode` (`'dark' | 'light'`) → controla fondos, superficies y texto

### Variables CSS a sobreescribir en modo claro

```css
.light-mode {
  --bg-base:      #F5F5F7;   /* Fondo principal — gris muy claro (estilo Apple) */
  --surface-nav:  #FFFFFF;   /* Header/tab bar — blanco */
  --surface-card: #FFFFFF;   /* Tarjetas — blanco con sombra sutil */

  /* Texto */
  color-scheme: light;
}
```

Los colores de acento (`--accent`, `--accent-light`, etc.) y los blobs **no cambian** con el modo — los gestiona el tema de país.

### Cambios en componentes

La mayoría del texto usa clases Tailwind como `text-white`, `text-gray-*`, `text-gray-500`, etc. En modo claro:
- `text-white` → debe verse oscuro: usar `text-gray-900` o similar
- `text-gray-500` → ya funciona bien en ambos modos
- `border-gray-800` → debe ser `border-gray-200` en claro

**Opciones de implementación:**
1. **CSS `color-scheme` + variables** (menos invasivo): sobreescribir solo las variables de fondo/superficie y usar `color-scheme: light` para que el navegador ajuste los defaults. Puede requerir ajustes manuales en componentes que usan colores hardcodeados.
2. **Clase `.light-mode` en `<html>` + variantes Tailwind** (más control): agregar la clase al elemento `<html>` y usar selectores CSS `[class~="light-mode"] .text-white { color: #111 }` para invertir los colores de texto globalmente.

**Recomendación:** Opción 2 con un bloque CSS global en `index.css` que sobreescriba las clases de texto y borde más comunes al aplicar `.light-mode`, más los ajustes de `--surface-*` y `--bg-base`.

### Toggle en Preferencias

Agregar un selector de apariencia en la sección de Preferencias (debajo de Tema):
```
Apariencia
  [🌙 Oscuro]  [☀️ Claro]   ← dos botones tipo pill, activo resaltado
```

### Persistencia

Guardar `colorMode: 'dark' | 'light'` en el documento del usuario en Firestore (`users/{uid}`), igual que se guarda `timezone` y `theme`. Aplicar al cargar la app desde `AuthContext`/`ThemeContext`.

### Consideraciones

- Los componentes off-screen para `html2canvas` (share cards) ya usan colores hardcodeados — no se ven afectados por el modo claro.
- El panel de admin puede quedar solo en modo oscuro en una primera versión (los admins suelen ser power users que prefieren oscuro).
- Las tarjetas Panini (`PaniniCard.tsx`) usan gradientes propios — no se ven afectadas.
- Probar especialmente: tab bar móvil, header, tarjetas del leaderboard, modal de historial, vista de pronósticos.
