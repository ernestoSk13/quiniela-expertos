# Resumen de sesión — 23-24 May 2026 (noche)

Continuación directa de la Fase 12 de rediseño visual. Se cerró el fix de JornadaShareCard y se completó el rediseño del panel Admin completo ("Mission Control").

---

## Commits de esta sesión

- `a8b7ca8` — JornadaShareCard: layout 2 columnas + createPortal
- `03ac99d` — Admin panel completo: 8 archivos, +1,817 / -705 líneas

---

## Fix: JornadaShareCard — imagen "cortada"

**Problema:** la card off-screen tenía 24 partidos en columna única → ~1,000px de alto. html2canvas capturaba solo la parte visible, resultando en imagen cortada.

**Solución 1 — 2 columnas:**
```tsx
const pairs: Match[][] = []
for (let i = 0; i < scoredMatches.length; i += 2) {
  pairs.push(scoredMatches.slice(i, Math.min(i + 2, scoredMatches.length)))
}
// Render: pairs.map(pair => <div style={{ display: 'flex', gap: 4 }}>{pair.map(match => ...)}</div>)
// Filler para fila impar: {pair.length === 1 && <div style={{ flex: 1 }} />}
```
→ Reduce altura de ~1,000px a ~504px para 24 partidos.

**Solución 2 — createPortal:**
```tsx
import { createPortal } from 'react-dom'
// ...
return (
  <>
    {createPortal(offScreenCard, document.body)}
    <button ...>Compartir</button>
  </>
)
```
La card off-screen vive como hijo directo de `<body>`, bypaseando el contenedor `position: sticky` de MatchdayPredictions que causaba el clipping.

**PointsPill** compacto: `fontSize: 9`, `lineHeight: '14px'`, `padding: '0px 5px'`.

---

## Rediseño Admin — "Mission Control"

8 archivos rediseñados con estética operacional/técnica. Toda la lógica preservada íntegra.

### AdminLayout.tsx

- **Header**: franja 3px `accent-light → accent → transparent` al tope; "Quiniela Expertos / ADMIN" en Bebas Neue con avatar
- **Nav desktop**: íconos SVG (CalendarIcon, UsersIcon, StarIcon, ShieldIcon, TableIcon, GearIcon) + label; active state con `accent-deep` bg + `accent-light` color
- **`NAV_ICONS: Record<string, JSX.Element>`**: requiere `import { type JSX } from 'react'` (no `React.JSX`)
- **Botones header**: `.adm-btn-danger` (borde rojo 22% opacity) y `.adm-btn-ghost` (borde blanco 8%)
- **Mobile tab bar**: íconos 16px + label uppercase 0.58rem; columnas con `adm-tab` + `adm-tab-active`
- **Fix crítico**: `display: flex` se removió de `.adm-tabbar` en CSS y se movió a Tailwind className (`flex`). Sin esto, el `display: flex` del CSS sobreescribía el `md:hidden` de Tailwind y la tab bar aparecía en desktop.

```tsx
// ✅ Correcto
<nav className="md:hidden fixed bottom-0 left-0 right-0 flex adm-tabbar" ...>

// CSS
.adm-tabbar {
  background: var(--surface-nav);
  border-top: 1px solid rgba(255,255,255,0.06);
  /* sin display: flex — lo maneja Tailwind */
}
```

### MatchdayList.tsx

- Borde izquierdo 4px con color según estado:
  ```tsx
  const STATUS_BORDER: Record<MatchdayStatus, string> = {
    upcoming: 'rgba(255,255,255,0.1)',
    open:     'var(--accent)',
    closed:   'rgba(250,204,21,0.5)',
    finished: 'rgba(74,222,128,0.45)',
  }
  ```
- Título en Bebas Neue 1.1rem; badge count con `accent-deep` bg
- Skeleton shimmer durante carga
- Botón deadline edit: texto `✏ editar` con hover accent inline
- Clases compartidas: `.mdl-btn-primary`, `.mdl-btn-secondary`, `.mdl-btn-ghost`, `.mdl-input`

### MatchdayDetail.tsx

- Breadcrumb con hover accent (inline `onMouseEnter/Leave`)
- Headers de grupo: `GRUPO {X}` Bebas Neue + línea `rgba(255,255,255,0.06)` + badge de conteo
- Flags 1.6rem; score en Bebas Neue 1.6rem; hora en 0.7rem muted
- Score inputs: `.mdd-score-input` Bebas Neue 1.3rem, 52px ancho
- Botón editar: `.mdd-icon-btn` 30×30px con ✏️
- Botón borrar resultado: `.mdd-btn-danger`
- Skeleton: `.mdd-shimmer` para grupos y filas

### AllowedUsers.tsx

- Badge `{emails.length} usuarios` junto al título
- `.au-link-btn`: icon LinkIcon + "Invitar"; al copiar → `au-link-copied` (verde)
- CheckIcon SVG al confirmar copia (2.5s)
- `.au-remove-btn`: texto muted → rojo en hover
- Separador vertical `1px rgba(255,255,255,0.08)` entre Invitar y Quitar

### UserProfiles.tsx

- Stats inline en el header: `{N} registrados`, `{X}/{Y} onboarding` (verde), `{Z} pronósticos`
- Badge onboarding: `✓ OK` verde o `⏳` amber según estado
- Número de pronósticos en Bebas Neue-like (`fontWeight: 700`)
- Botón `.up-edit-btn`: borde 1px 8% + hover accent
- Formulario de edición: `border-top rgba(255,255,255,0.06)` + `bg rgba(0,0,0,0.2)`
- Labels con `text-transform: uppercase` + `letter-spacing: 0.1em`

### ScoringConfig.tsx

- Grupos con emoji header: ⚽ Fase de Grupos, ⚡ Eliminatorias, 🏆 Bonos
- Franja top 3px en cada card de grupo
- `.sc-number-input`: Bebas Neue 1.3rem, 64px, `-webkit-appearance: none` (sin spinners)
- Label "pts" flotante dentro del input (position absolute)
- Warning amber: `rgba(250,204,21,0.06)` bg + borde 25%
- Confirmación dos pasos: "Guardar" → show warning → "Confirmar y guardar"

### BonusEvaluation.tsx

- Título `BONUS FINAL` Bebas Neue + descripción
- Card con franja 3px accent en la parte superior
- `Field` wrapper component: label uppercase + hint opcional
- Botón submit: `linear-gradient(135deg, accent-light → accent)` + Bebas Neue + `letter-spacing: 0.1em`
- Done state: 🏆 + "¡PUNTOS BONUS OTORGADOS!" Bebas Neue 1.8rem

### AdminLeaderboard.tsx

- Header "TABLA GENERAL" Bebas Neue + badge de conteo
- LeaderboardPNGCard alineado a la derecha
- Sin skeleton propio (delega en LeaderboardTable)

---

## Notas técnicas relevantes

- **`JSX.Element` en Record**: usar `import { type JSX } from 'react'` (TypeScript no encuentra el namespace `JSX` sin esto en proyectos con new JSX transform)
- **CSS `display` vs Tailwind responsive**: si un CSS class setea `display`, sobreescribe utilidades responsive de Tailwind. Siempre dejar el `display` controlado por Tailwind utilities (`flex`, `hidden`, `md:hidden`, etc.) y no duplicarlo en CSS classes del componente
- **Tailwind `md:hidden` + CSS `display: flex`**: el CSS tiene mayor especificidad si aparece después del stylesheet de Tailwind → el responsive utility pierde. Solución: no poner `display` en clases CSS companion

---

## Estado del proyecto tras esta sesión

### Completado en Fase 12
- ✅ NumericKeypad, PredictionsSidebar, CompactMatchRow
- ✅ Onboarding (4 archivos)
- ✅ PlayerHistoryModal, LeaderboardShareCard
- ✅ Preferences (refactor + PreferencesContent export)
- ✅ Dashboard (mobile tab fix)
- ✅ PostMatchdayView
- ✅ InvitePage
- ✅ JornadaShareCard (2-col + createPortal)
- ✅ Admin completo (8 archivos)
- ✅ LeaderboardShareCard — badge inline + Bebas Neue global (commit `ad79741`)
- ✅ AdminMetrics — dashboard de métricas + tab bar móvil con panel "Más" (commit `988c585`)
- ✅ AdminNotifications — notificación masiva push (commit `7cfb954`)

### Posibles próximas áreas
- Ganador de jornada (badge al jugador con más puntos por jornada)
- Rachas (streak de jornadas con al menos un exacto)
- Vista previa de pronósticos del admin
- Páginas de error / 404
- Mejoras de performance (code splitting)

---

---

## LeaderboardShareCard — fix badge + font rendering (commit `ad79741`)

Archivo: `src/pages/Dashboard/LeaderboardShareCard.tsx`

### Problema raíz: Bebas Neue no disponible para html2canvas

**Síntoma:** el nombre del jugador ("KURI") se renderizaba como "KIIDI" o "KIIRI" en la imagen capturada — los glifos "U" y "R" de Bebas Neue se distorsionaban (U → dos barras verticales, R → D).

**Causa:** Bebas Neue solo se cargaba dentro de `<style>` JSX en `Login.tsx` y `TournamentCountdown.tsx`. Al desmontarse esos componentes, el `@font-face` desaparecía del documento. html2canvas luego intentaba usar la fuente desde caché del navegador pero sin la declaración `@font-face` activa, los glifos se renderizaban con artifacts.

**Fix:**
```html
<!-- index.html — carga global y persistente -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
```

### Problema secundario: badge desalineado

**Síntoma:** el número de posición (badge dorado) no se alineaba verticalmente con el nombre del jugador.

**Historial de intentos fallidos:**
1. `position: absolute; top: -11; left: -11` sobre el avatar → clipping por `overflow: hidden` del contenedor padre
2. Overlay cuadrado dentro del avatar (`borderRadius: '0 0 7px 0'`) → "se ve peor que antes"
3. Wrapper con `paddingTop: 14` + badge absolute en `top: 0` + flexbox `alignItems: center` → `lineHeight: 16` (bug) → `lineHeight: 1` (fix parcial)
4. `display: flex; alignItems: center; justifyContent: center` con `<span>` child → texto sigue demasiado abajo (flexbox no confiable en html2canvas)
5. `lineHeight: '27px'` sin flexbox (texto directo en div, sin span) → badge ok, pero nombre aún con problemas de font
6. Badge movido al lado del nombre con flex row → `alignItems: center` ignorado en html2canvas

**Fix final:** `display: inline-block` + `verticalAlign: 'middle'` en ambos elementos (badge y nombre) dentro de un div contenedor sin flex:
```tsx
<div style={{ marginBottom: 14 }}>
  <div style={{
    display: 'inline-block',
    verticalAlign: 'middle',
    width: 28, height: 28,
    // estilos del badge...
  }}>
    {position}
  </div>
  <div style={{
    display: 'inline-block',
    verticalAlign: 'middle',
    // estilos del nombre...
  }}>
    {player.displayName}
  </div>
</div>
```

### `document.fonts.ready` en handleShare

```tsx
async function handleShare() {
  await document.fonts.ready  // garantiza que Bebas Neue esté cargada antes del capture
  // ...await imgs...
  await captureAndShare(cardRef.current, 'quiniela-mi-posicion')
}
```

### Reglas html2canvas aprendidas en este bug

| Técnica CSS | ¿Funciona en html2canvas? |
|---|---|
| `display: flex; alignItems: center` | ❌ No confiable para alineación vertical |
| `position: absolute` con coords negativas | ❌ Clipped si hay `overflow: hidden` ancestro |
| `display: inline-block; verticalAlign: middle` | ✅ Confiable |
| `lineHeight` numérico igual a altura del contenedor | ✅ Confiable para centrar texto |
| `whiteSpace: nowrap; overflow: hidden` en flex child | ⚠️ Puede causar rendering artifacts de texto |
| Fuente vía `@font-face` en `<style>` JSX de componente | ❌ Desaparece al desmontar el componente |
| Fuente vía `<link>` en `index.html` | ✅ Persistente durante toda la sesión |

---

## LeaderboardPNGCard — rediseño (misma sesión, commit `6a9a1b2`)

Archivo: `src/pages/Admin/LeaderboardPNGCard.tsx`

### COLORS record extendido
```ts
const COLORS: Record<ThemeId, {
  bg: string; surface: string; accent: string; border: string
  accentLight: string; heroStripe: string
}> = {
  mexico: { ..., accentLight: '#69F0AE', heroStripe: 'rgba(0,200,83,0.13)' },
  canada: { ..., accentLight: '#FF6B6B', heroStripe: 'rgba(229,20,20,0.13)' },
  usa:    { ..., accentLight: '#7B8BFF', heroStripe: 'rgba(37,53,240,0.13)' },
}
```

### Estructura de la card (off-screen, 420px)
1. **Franja 3px**: `linear-gradient(to right, accentLight + 'cc', accent + '88', transparent)`
2. **Hero header** (140px fijo, padding 16px/20px/14px):
   - Brand row: círculo ⚽ (28px, rgba(255,255,255,0.06)) + "Quiniela Expertos · Mundial 2026" (8px, accent, tracking 0.18em) + stat pills derecha ("N jug." gris, "X exactos" en accent bg)
   - Title row: "TABLA GENERAL" Bebas Neue 26px + fecha (10px, 0.32 opacity) a la izquierda; chip del líder a la derecha
   - **Chip del líder**: `rgba(255,255,255,0.05)` bg + border `rgba(255,255,255,0.08)` + 🏆 + nombre 11px + pts en Bebas Neue 22px accent
3. **Player rows**: `LeaderboardRow` ya existente (colores hardcodeados, html2canvas-safe)
4. **Footer** (44px): ⚽ QUINIELA EXPERTOS · MUNDIAL 2026 + URL

### CARD_H calculado dinámicamente
```tsx
const CARD_H = Math.max(
  MIN_CARD_H,  // 480
  3 + HEADER_H + 16 + rowsTotalH + 16 + FOOTER_H,
)
// rowsTotalH = players.length * ROW_H + (players.length - 1) * ROW_GAP
```

### createPortal
Agregado igual que JornadaShareCard — renderiza en `document.body` para evitar clipping.

### Botón visible "Exportar tabla"
Glass style consistente con botones del panel admin:
```tsx
style={{
  color: sharing ? 'var(--accent-light)' : 'rgba(255,255,255,0.45)',
  border: '1px solid rgba(255,255,255,0.09)',
  background: sharing ? 'var(--accent-deep)' : 'rgba(255,255,255,0.04)',
}}
// onMouseEnter/Leave para hover accent
```

---

## AdminMetrics — dashboard de métricas (commit `988c585`)

Archivo: `src/pages/Admin/AdminMetrics.tsx` (nuevo)

### Datos que se cargan (Promise.all)
```ts
getDocs(collection(db, 'users'))         // stats por jugador
getDocs(query(collection(db, 'matchdays'), orderBy('order')))
getDocs(collection(db, 'matches'))
getDocs(collection(db, 'predictions'))   // todas (~700 max para grupo de 15)
```

### Métricas calculadas
- **Global**: jugadores activos, total pronósticos, promedio de puntos, tasa de exactos
- **Por jornada**: participantes únicos (Set de userIds), total puntos, exactos, correctos, partidos finalizados
- **Partidos difíciles**: matches finished, ordenados por `exactCount / totalPredictions` ascendente, top 8

### Secciones UI
1. **4 stat cards** — grid `auto-fit minmax(140px, 1fr)`, la de "Promedio de puntos" con `border-left: accent`
2. **Participación por jornada** — fila por jornada con barra de progreso + pills compactos (pts promedio, exactos, correctos, partidos)
3. **Partidos más difíciles** — fixture (homeCode vs awayCode) + marcador + barra de dificultad coloreada:
   - `exactRate < 10%` → rojo `rgba(239,68,68,0.8)`
   - `exactRate < 25%` → ámbar `rgba(250,204,21,0.75)`
   - `exactRate ≥ 25%` → verde `rgba(74,222,128,0.7)`
4. **Estado vacío** con 📊 cuando no hay pronósticos puntuados aún
5. **Botón "Actualizar"** recarga los datos sin refrescar la página; ícono con `animation: spin` mientras carga

### Navegación
- **Desktop nav**: nuevo item "Métricas" con `ChartIcon` entre Tabla y Puntos
- **Nav items más compactos**: `padding: 5px 8px`, `font-size: 0.72rem`, `gap: 4px`

## Tab bar móvil — reestructuración con panel "Más" (mismo commit)

### Antes
5 tabs: Jornadas / Jugadores / Bonus / Acceso / Métricas

### Después
4 tabs fijos + 1 tab "Más":
- `MOBILE_NAV`: Jornadas / Jugadores / Acceso / Tabla
- `MORE_NAV` (oculto bajo "Más"): Bonus / Métricas / Puntos

### Implementación del panel "Más"
```tsx
const [showMore, setShowMore] = useState(false)
const isMoreActive = MORE_PATHS.some(p => location.pathname.startsWith(p))
useEffect(() => { setShowMore(false) }, [location.pathname])  // cierre automático
```

Panel posicionado con `bottom: calc(60px + env(safe-area-inset-bottom))` para quedar justo encima del tab bar. Backdrop transparente para cerrar al tocar fuera. Animación `adm-slide-up` (opacity + translateY, 0.18s).

El tab "Más" aparece en `accent-light` si la ruta activa es `/admin/bonus`, `/admin/metricas`, `/admin/notificaciones` o `/admin/config`.

---

## AdminNotifications — notificación masiva push (commit `7cfb954`)

### Cloud Function `sendMassNotification` (`functions/src/index.ts`)
```ts
export const sendMassNotification = onCall(async request => {
  // valida auth + rol admin
  const { title, body } = request.data
  const tokens = await getFcmTokens()
  await sendPush(tokens, title.trim(), body.trim())
  return { sent: tokens.length }
})
```
Reutiliza los helpers `getFcmTokens()` y `sendPush()` ya existentes (que también limpian tokens inválidos).

### Servicio cliente (`src/services/cloudFunctions.ts`)
```ts
export async function sendMassNotification(title: string, body: string): Promise<{ sent: number }> {
  const fn = httpsCallable<{ title; body }, { sent: number }>(functions, 'sendMassNotification')
  return (await fn({ title, body })).data
}
```

### UI `AdminNotifications.tsx`
- **Badge** con conteo de usuarios con `fcmToken` (fetched al montar vía `getDocs`)
- **4 plantillas**: 📅 Jornada abierta / ⏰ Cierre próximo / 🏆 Resultados listos / ✏️ Personalizado
- **Inputs** con contador de caracteres: título 50 chars, mensaje 150 chars
- **Preview en tiempo real** estilo notificación iOS (phone mockup con fondo #1c1c1e, tarjeta gris, app icon ⚽)
- **Flujo de envío en dos pasos**:
  1. Botón "Enviar notificación" → muestra `notif-confirm-box` (fondo ámbar 5%) con el conteo de jugadores
  2. "Confirmar y enviar" → llama la Cloud Function → banner verde con "Enviada a N jugadores"
- **Banner de error** en rojo si la CF falla
- Botón "Nueva notificación" para resetear el formulario tras enviar

### Layout desktop
Grid `1fr 280px` (compose + preview side-by-side). En móvil: columna única.

### Navegación
- Agregada a `MORE_NAV` (panel "Más" en móvil) y a `DESKTOP_NAV` con label "Notifs" + `BellIcon`
- `MORE_PATHS` actualizado para que el tab "Más" se ilumine en `/admin/notificaciones`
