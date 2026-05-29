# Resumen de sesión — 23 May 2026 (tarde/noche)

Sesión larga de rediseño visual completo ("Fase 12"). Se rediseñaron 9 componentes con estética premium FIFA — Bebas Neue, frosted-glass, animaciones, stat bars con borde acento. Todos los cambios funcionales/lógicos se preservaron íntegros.

---

## Commits de esta sesión

- `847f8ad` — Predictions: CompactMatchRow, NumericKeypad, PredictionsSidebar
- `0d09d4e` — Onboarding (4 archivos) + PlayerHistoryModal + LeaderboardShareCard

**Pendiente de commit/deploy:**
- `Preferences.tsx` rediseñado
- `LeaderboardShareCard.tsx` (ya committed en `0d09d4e`, pero el deploy aún no)
- `Dashboard.tsx` fix mobile tab (aún sin modificar)

---

## Rediseños completados

### NumericKeypad.tsx
- Panel frosted-glass: `rgba(8,18,10,0.82)` + `backdrop-filter: blur(20px) saturate(160%)`
- Botones `.kp-digit` con gradiente interno y `scale(0.93)` en `:active`
- Botón Guardar: gradiente `accent-light → accent`, pill con contador de cambios
- Ícono SVG de borrar (no emoji)
- Separador `1px solid rgba(255,255,255,0.06)` entre guardar y teclado

### PredictionsSidebar.tsx
- Barra de progreso `h-2` con glow + label `%` flotante
- Marcadores pendientes en Bebas Neue con `var(--accent)`
- Partidos guardados: punto verde + marcador en gris muted
- Deadline: ícono SVG reloj + texto ámbar `rgba(255,200,50,0.75)`

### Onboarding.tsx
- Fondo con rayas diagonales: `repeating-linear-gradient(-55deg, ...)`
- Header "REGISTRO DEL TORNEO" en Bebas Neue
- Stepper con 3 círculos numerados: completado (fill acento + checkmark), actual (pulsante con anillo animado), futuro (hollow gris)
- Card con franja superior de 3px gradiente acento; animación `ob-enter` (fade-up) en cada cambio de paso

### StepProfile.tsx
- Zona de foto: ring SVG punteado + 4 puntos decorativos en las esquinas
- Avatar con borde acento 2px dentro
- Pill de cámara para subir foto
- Input de nombre Bebas Neue 1.4rem — glow acento en focus
- Botón continuar con gradiente y flecha SVG

### StepBonus.tsx
- 4 field-cards con borde izquierdo 3px acento, emoji + título + subtítulo
- `.sb-arcade-input` Bebas Neue 1.3rem, uppercase, glow en focus
- `.sb-select` con flecha SVG custom
- Select de campeón: bandera del equipo aparece inline al seleccionar

### StepInstall.tsx
- Ilustración SVG de teléfono con animación `si-phone-glow` (drop-shadow pulsante)
- 3 chips de beneficios: pill con `accent-deep` bg, `accent-muted` border + glow, íconos SVG propios
- Pasos numerados: círculos con borde acento en lugar de emojis
- Botón primario gradiente + botón "Omitir" en muted

### PlayerHistoryModal.tsx
- Overlay fade-in + sheet slide-up desde abajo
- Hero strip: `linear-gradient(to bottom, var(--accent-deep), transparent)`
- Franja top 3px gradiente
- Avatar rectangular 68×88px con badge de posición (medalla/colores para top 3) + glow ring extra
- Nombre en Bebas Neue 1.7rem; pill "TÚ" para perfil propio; botón X SVG con hover
- Stat bar: `borderLeft: 2px solid var(--accent)`, números en Bebas Neue, divisores verticales
- `PointsChart`: SVG con área degradada (`url(#phm-chart-fill)`), 2 líneas guía punteadas, último punto con `filter: drop-shadow`, labels J1/J2 en flex row HTML
- `MatchdayItem`: borde izquierdo 3px, chevron SVG rotante, badge de pts
- `PredRow`: formato `{flag} COD | score | COD {flag}` + pronóstico debajo + punto coloreado + pts
- Estado vacío: ícono SVG calendario + textos muted

### LeaderboardShareCard.tsx (off-screen)
- Card 400px para html2canvas: franja top, hero strip, avatar 80×104px con badge
- Nombre Bebas Neue 28px, stat bar con borde acento, footer "QUINIELA EXPERTOS · MUNDIAL 2026"
- `COLORS` record con colores hardcodeados por tema (html2canvas no resuelve CSS vars)
- **Botón "Compartir mi posición" comentado intencionalmente** — no restaurar sin confirmación
- Removidos: `useState`, `captureAndShare`, `handleShare`, `ShareIcon` (TS6133 fix)

### Preferences.tsx (pendiente de deploy)
- Header sticky: "PREFERENCIAS" Bebas Neue, botón back pill con chevron
- `SectionHeader`: label + línea gradiente `accent → transparent`
- Tema: grid 3 cols, flag `text-4xl`, activo = `accent-muted` bg + `accent` border + glow
- Install: chips pill, botón nativo gradiente, pasos numerados con círculos acento, nota iOS italic
- Notificaciones: toggle inline 50×28px, borde izquierdo acento cuando ON, `LockIcon` + texto ámbar cuando denegado
- Cuenta: `PersonIcon`/`MailIcon` por campo, avatar 28px, botón logout rojo con `LogoutIcon`

---

## Problema identificado — Mobile Preferences tab

**Situación:** el tab "Preferencias" en móvil llama a `navigate('/preferencias')`, lo que hace que el Dashboard (y su tab bar) desaparezca. El usuario pierde contexto.

**Solución acordada:** Tab inline en Dashboard
- Cambiar `onClick` del tab de preferencias de `navigate('/preferencias')` a `setActiveTab('preferences')`
- Agregar `{activeTab === 'preferences' && <PreferencesContent />}` en la sección mobile del Dashboard
- La ruta `/preferencias` queda solo para desktop (gear icon en header)

**Estado:** Pendiente. No se modificó `Dashboard.tsx` todavía.

---

## Documentación actualizada al final de sesión

- `PLAN.md` — nueva "Fase 12 — Rediseño Visual", actualizado Estado actual
- `AGENTS.md` — estado al día, StepInstall.tsx y Preferences.tsx en estructura, 3 secciones nuevas de convenciones (Bebas Neue, html2canvas, noUnusedLocals), 3 reglas nuevas en "Qué NO Hacer"
- `README.md` — lista de funcionalidades para jugadores actualizada
- `IDEAS.md` — nueva sección "Pendientes inmediatos" (mobile tab fix, deploy, botón compartir)

---

## Próxima sesión: qué hacer primero

1. Modificar `Dashboard.tsx`:
   - Cambiar `onClick={() => id === 'preferences' ? navigate('/preferencias') : setActiveTab(id)}` → `onClick={() => setActiveTab(id)}`
   - Agregar panel `{activeTab === 'preferences' && <PreferencesPanel />}` (puede importar el contenido de `Preferences.tsx` o duplicar inline)
2. Probar en local que la tab bar no desaparezca al ir a Preferencias en móvil
3. Deploy conjunto: `Preferences.tsx` + `LeaderboardShareCard.tsx` + `Dashboard.tsx`

---

## Notas técnicas

- **Bebas Neue**: ya cargada globalmente en `index.css`; en cards off-screen se puede re-importar via `<style>` si es necesario
- **html2canvas**: no resuelve CSS variables → usar `COLORS` record con literales por tema
- **noUnusedLocals: true** en tsconfig → cualquier estado/función/import que quede sin usar por comentar JSX provoca TS6133; eliminar o comentar también las declaraciones
- **LeaderboardTable.onPlayerClick**: recibe `(player, position)` — Dashboard y AdminLeaderboard actualizados para pasar position
