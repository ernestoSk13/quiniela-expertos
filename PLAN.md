# Plan de Trabajo — Quiniela Expertos del Mundial 2026

## Estado actual (Mayo 2026)

- [x] Fases 1–11 (parcial) completadas y desplegadas en producción
- [x] Cloud Functions gen2 activas (`onMatchUpdated`, `evaluateBonusPredictions`, `getInvite`)
- [x] Sistema de temas con paleta FIFA WC 2026 (México / Canadá / EUA)
- [x] Panel de admin completo: jornadas, resultados, jugadores, bonus, acceso, tabla general, configuración de puntos
- [x] Historial personal por jugador con gráfica SVG de evolución de puntos
- [x] Vista post-jornada: predicciones de todos los jugadores visibles al cerrar
- [x] Puntos configurables desde Firestore (`config/scoring`); Cloud Functions leen config con fallback a defaults
- [x] Link de invitación: admin genera token por correo, invitado llega a página de bienvenida
- [x] Compartir como imagen: posición personal, resumen de jornada y tabla general (PNG)
- [x] Leaderboard rediseñado tipo carta FIFA (mini-card con avatar) — componente compartido entre dashboard, admin y PNG card
- [x] Rediseño visual completo: Onboarding, Pronósticos, Modal de historial, Preferencias, Admin panel, Share Cards (Fase 12)
- [x] Fix flujo mobile — Preferencias como tab inline en Dashboard (`PreferencesContent` named export)

---

## Decisiones tomadas

- **Tiempo extra y penales:** Los pronósticos se evalúan sobre el marcador al **final del tiempo regular (90')**. En fases eliminatorias, cuando un usuario pronostica empate, aparece una pregunta adicional: "¿Quién pasa a la siguiente ronda?". El campo `matches.winner` guarda el equipo que avanzó; `predictions.tieWinner` guarda el pronóstico del usuario.
- **Scoring server-side:** Toda lógica de puntos vive en Cloud Functions. El cliente solo lee.
- **Bonus de grupos:** +5pts automático al usuario(s) con más predicciones exactas en fase de grupos, una sola vez al terminar todos los partidos de grupos. Guard: `config/tournament.groupBonusAwarded`.
- **Bonus onboarding:** Evaluación manual por el admin (4 preguntas × 5pts). No se puede deshacer.
- **[Fase 14] Modo resultado simple:** A partir de la Fase 14 los usuarios ya no ingresan marcadores exactos — solo predicen quién gana o si hay empate. El admin sigue ingresando marcadores reales para determinar el resultado. Las predicciones existentes (si las hubiera antes del cambio) se consideran migradas: se deriva `result` a partir de `homeScore`/`awayScore` históricos. Cambiar el sistema de puntos no recalifica predicciones ya puntuadas.
- **Bloqueo de predicciones por partido:** Además del `predictionDeadline` de la jornada, cada partido se bloquea individualmente en cuanto su `scheduledAt` pasa. Permite que en jornadas con partidos en días distintos los primeros se bloqueen automáticamente sin afectar los siguientes.
- **Visibilidad de pronósticos ajenos:** Los pronósticos de otros jugadores solo son visibles cuando la jornada tiene `status: 'closed'` o `'finished'`. Está aplicado tanto en Firestore rules (servidor) como en el toggle de UI (cliente).
- **Leaderboard como colección pública:** Todos los `isAllowedUser()` pueden leer la colección `users` completa — necesario para que el query de leaderboard funcione. La restricción de escritura sigue siendo individual (cada usuario solo escribe el suyo, admins pueden escribir cualquiera).
- **Puntos configurables:** Los valores de puntos viven en `config/scoring` (Firestore). Las Cloud Functions leen este documento antes de cada calificación; si no existe, usan `DEFAULT_SCORING` (3/1/3/1/5/5). Cambiar los valores mid-torneo no recalifica predicciones ya puntuadas.
- **Links de invitación:** Tokens UUID guardados en `invites/{token}` con TTL de 7 días. La Cloud Function `getInvite` los valida sin auth (Admin SDK bypassa las rules). El cliente admin escribe tokens directamente con permisos `isAdmin()`. El link lleva al invitado a `/invite/:token` → bienvenida con correo pre-cargado → login.

---

## Fase 1 — Scaffolding
**Estado:** Completada ✓

- [x] Inicializar app React + TypeScript + Vite
- [x] Instalar y configurar Tailwind CSS v4
- [x] Configurar `.env` con variables de Firebase
- [x] Configurar Firebase Emulator Suite (Auth, Firestore, Storage, UI)
- [x] Conectar Firebase SDK con flag `VITE_USE_EMULATORS`
- [x] Definir interfaces TypeScript en `src/types/`
- [x] Alias `@/` → `src/` en Vite y TypeScript

---

## Fase 2 — Autenticación y Control de Acceso
**Estado:** Completada ✓

- [x] Colección `allowedUsers/{email}` — el admin pre-registra correos autorizados
- [x] Pantalla de login (email/contraseña + Google), mobile-first
- [x] Verificación de email en `allowedUsers` antes de permitir acceso
- [x] `AuthContext` con listener en tiempo real al documento del usuario
- [x] Guards de ruta: `GuestRoute`, `OnboardingRoute`, `ProtectedRoute`, `AdminRoute`
- [x] Firestore security rules con `isAllowedUser()` e `isAdmin()`

---

## Fase 3 — Seed Data
**Estado:** Completada ✓

- [x] Script `scripts/seed.ts` con 48 equipos, grupos y banderas
- [x] Jornadas y partidos de fase de grupos con fechas UTC
- [x] IDs determinísticos para re-runs idempotentes
- [x] `npm run seed` + `npm run pull-from-prod` para importar datos reales

---

## Fase 4 — Panel de Administración
**Estado:** Completada ✓

- [x] `AdminLayout` con nav (Jornadas / Jugadores / Bonus / Acceso) + tab bar en móvil
- [x] `/admin` — lista de jornadas, cambio de estado
- [x] `/admin/jornada/:id` — partidos con entrada inline de resultados; selector de ganador en eliminatorias
- [x] `/admin/jugadores` — editar perfil, rol, avatar; ver estado de onboarding y conteo de pronósticos
- [x] `/admin/bonus` — formulario para evaluar bonus predictions al final del torneo
- [x] `/admin/usuarios` — gestión de correos permitidos
- [x] `clearMatchResult` para corregir resultados mal ingresados
- [x] Botón "Restaurar" para reset completo de datos (preserva admins)

---

## Fase 5 — Onboarding
**Estado:** Completada ✓

- [x] Flujo 2 pasos: perfil (nombre + avatar) → bonus predictions
- [x] Subida de avatar a Firebase Storage
- [x] Formulario de bonus con datos reales de `teams/` para campeón
- [x] Escritura en Firestore con `onboardingCompleted: true` al finalizar

---

## Fase 6 — Dashboard
**Estado:** Completada ✓

- [x] Tabla de posiciones en tiempo real (`onSnapshot` sobre `users`)
- [x] Tarjeta de siguiente jornada con acceso directo a pronósticos
- [x] Resumen de bonus predictions con edición hasta el 11 jun 2026
- [x] Selector de tema (México / Canadá / EUA) en el header
- [x] Navegación por tabs en móvil (< lg): "Pronósticos" / "Tabla" / "Historial" con barra fija en la parte inferior; desktop sin cambios
- [x] Tab "Historial": stats del usuario + gráfica de evolución + acordeón por jornada, todo inline (sin abrir modal)

---

## Fase 7 — Pronósticos
**Estado:** Completada ✓

- [x] Vista de jornada con lista de partidos compacta
- [x] Keypad numérico fijo en móvil
- [x] Inputs directos + sidebar de progreso y cambios pendientes en desktop
- [x] Validación de deadline antes de guardar (flag `readOnly`)
- [x] Soporte de `tieWinner` en fases eliminatorias
- [x] Edición de pronósticos mientras la jornada esté abierta

---

## Fase 7.5 — Sistema de Temas
**Estado:** Completada ✓

- [x] Paleta FIFA WC 2026 en CSS custom properties (`:root`, `.theme-canada`, `.theme-usa`)
- [x] Fondo con blobs radiales estilo FIFA (clase `app-bg`)
- [x] Superficies temáticas: `surface-nav` (header/tab bar) y `surface-card` (tarjetas)
- [x] `ThemeContext` que aplica clase en `<html>` según preferencia del usuario
- [x] Skill `/add-theme` para agregar nuevos países desde Claude Code

---

## Fase 8 — Scoring (Cloud Functions)
**Estado:** Completada ✓

- [x] `onMatchUpdated` — trigger gen2 que califica predicciones al guardar resultados
- [x] Scoring de grupo: exacto (3pts) y resultado G/E/P (1pt)
- [x] Scoring de eliminatorias: no-empate (score) y empate al 90' (score + tieWinner)
- [x] Re-scoring: si cambia el resultado, recalcula y aplica solo el delta
- [x] Reset: si se borra un resultado, revierte los puntos de los usuarios
- [x] `checkAndAwardGroupBonus`: +5pts automático al mejor de grupos al terminar todos sus partidos
- [x] `evaluateBonusPredictions` — callable HTTP (solo admins) para otorgar puntos de bonus

---

## Fase 9 — Historial por Jugador
**Estado:** Completada ✓

- [x] Modal al tocar cualquier fila del leaderboard — se abre un bottom-sheet (móvil) / modal centrado (desktop)
- [x] Stats del jugador: total de puntos, exactos, correctos, predicciones enviadas
- [x] Gráfica SVG de evolución de puntos acumulados jornada a jornada
- [x] Acordeón por jornada: partido a partido con resultado real, pronóstico y badge (3pts/1pt/0pts)
- [x] Historial detallado solo visible para el propio usuario; otros ven solo sus stats
- [x] "Ver mi historial →" visible en el leaderboard + hint al pie de tabla

---

## Fase 10 — Post-Jornada: Ver Predicciones de Otros
**Estado:** Completada ✓

- [x] Reglas de Firestore actualizadas: se permiten leer pronósticos de jornadas con status `closed`/`finished`
- [x] Toggle "Mis pronósticos" / "Ver todos" en la vista de jornada cuando el status es `closed` o `finished`
- [x] Vista post-jornada: cada partido muestra resultado real + pronóstico y puntos de cada jugador
- [x] Indicador visual por pronóstico: +3 verde (exacto), +1 amarillo (correcto), +0 gris (fallado)
- [x] Sección "Jornadas anteriores" en el Dashboard para acceder a jornadas pasadas
- [x] Protección: toggle solo aparece cuando `matchday.status` es `closed` o `finished`

---

## Fase 10.5 — Mejoras al Panel de Admin
**Estado:** Completada ✓

### Tabla general en el admin
- [x] Nueva pestaña "Tabla" en `AdminLayout` (desktop) → `/admin/tabla` con `AdminLeaderboard`
- [x] Reutiliza `LeaderboardTable` + `PlayerHistoryModal`; admin ve historial completo de cualquier jugador

### Panel de configuración de puntos
- [x] Documento `config/scoring` en Firestore con los valores de puntos configurables:
  - `exactScore` (default: 3) — marcador exacto
  - `correctResult` (default: 1) — resultado correcto (G/E/P o ganador)
  - `exactKnockoutWithTie` (default: 3) — marcador exacto + tieWinner en eliminatoria con empate al 90'
  - `correctTieWinner` (default: 1) — solo tieWinner correcto en eliminatoria con empate al 90'
  - `groupBonus` (default: 5) — bonus al jugador con más exactos en fase de grupos
  - `bonusPrediction` (default: 5) — cada predicción de bonus acertada (goleador, balón de oro, etc.)
- [x] UI en admin (`/admin/config`) con formulario agrupado por categoría
- [x] Cloud Function `onMatchUpdated` y `evaluateBonusPredictions` leen la config desde Firestore en lugar de hardcodear los valores; fallback a `DEFAULT_SCORING` si el documento no existe
- [x] Advertencia en la UI antes de guardar: cambiar puntos no recalifica predicciones ya puntuadas
- [ ] Botón "Re-calificar todo" (descartado por complejidad vs. impacto; se puede hacer manualmente con Restaurar + re-ingreso)

---

## Fase 11 — Compartir y Notificaciones

### Link de invitación
**Estado:** Completado ✓

- [x] Cloud Function `getInvite(token)` — lee `invites/{token}` sin auth; valida expiración; devuelve `{ email }`
- [x] `generateInviteLink(email)` — admin escribe `invites/{token}` (UUID) con TTL de 7 días; devuelve la URL
- [x] Botón "Invitar" por correo en `/admin/usuarios` — genera token, copia link al portapapeles, confirma con "Copiado"
- [x] Página pública `/invite/:token` — llama `getInvite`, muestra bienvenida personalizada con correo pre-cargado y botón a `/login`
- [x] Login pre-llena el campo de correo desde `?email=` query param (viene del link de invitación)
- [x] Firestore rules: `invites/{token}` — write: isAdmin; read: false (Admin SDK en Cloud Function omite reglas)

### Compartir como imagen
**Estado:** Completado ✓

- [x] `useShareImage` con `html2canvas` + Web Share API y fallback a descarga (`forceDownload`)
- [x] `LeaderboardShareCard` — botón en dashboard para compartir la propia posición
- [x] `JornadaShareCard` — botón en vista post-jornada para compartir resumen de pronósticos
- [x] `LeaderboardPNGCard` — botón en `/admin/tabla` para descargar la tabla general completa (tamaño móvil)
- [x] Avatares con `crossOrigin="anonymous"` para que html2canvas pueda capturarlos vía CORS
- [x] Pre-espera de carga de imágenes (`onload`/`onerror`) antes del capture para evitar PNGs con avatares vacíos
- [x] CORS configurado en Firebase Storage bucket (`quinielaexpertos26.firebasestorage.app`) vía script Node con Admin SDK — fix para avatares bloqueados en el leaderboard en producción

### Rediseño de leaderboard (carta FIFA)
**Estado:** Completado ✓

- [x] Componente compartido `src/components/LeaderboardRow.tsx` con mini-card de avatar, posición prefijada al nombre (con color medal para top 3) y puntos grandes a la derecha
- [x] Filas alternadas con fondo transparente `rgba(accent, 0.14/0.05)` para que el blob temático se vea a través
- [x] Aplicado en dashboard (con click → modal de historial y highlight de "tú"), en `/admin/tabla` y en el PNG card
- [x] Inline styles en el componente para compatibilidad total con html2canvas

### Rediseño del modal de historial
**Estado:** Completado ✓

- [x] Header: card de avatar (68×88px) con badge de posición superpuesto en esquina superior izquierda (32px, colores medalla para top 3)
- [x] 3 stat boxes compactos (80px c/u): Puntos / Aciertos (exactos+correctos) / Exactos; fuente 16px para valores ≥ 100
- [x] `LeaderboardTable.onPlayerClick` ahora pasa `(player, position)` — Dashboard y AdminLeaderboard actualizados
- [x] Contenido inferior sin cambios: gráfica de evolución + acordeón por jornada

---

## Fase 12 — Rediseño Visual (Mayo 2026)

### Pronósticos
**Estado:** Completado ✓ (desplegado)

- [x] `NumericKeypad.tsx` — panel frosted-glass (`rgba(8,18,10,0.82)` + `backdrop-filter: blur(20px) saturate(160%)`), botones con gradiente interno y `scale(0.93)` en `:active`, botón Guardar con pill de conteo, ícono SVG de borrar
- [x] `PredictionsSidebar.tsx` — barra de progreso con glow, marcadores pendientes en Bebas Neue acento, partidos guardados con punto verde, icono SVG de reloj para deadline en ámbar

### Onboarding
**Estado:** Completado ✓ (desplegado)

- [x] `Onboarding.tsx` — fondo con rayas diagonales, "REGISTRO DEL TORNEO" en Bebas Neue, progress stepper con círculos numerados (completado / activo pulsante / pendiente), card con franja superior de gradiente acento
- [x] `StepProfile.tsx` — zona de foto con anillo SVG punteado + 4 puntos decorativos, input de nombre en Bebas Neue tipo marcador arcade, botón de cámara pill, botón continuar con gradiente
- [x] `StepBonus.tsx` — 4 field-cards con borde izquierdo acento, inputs y selects en Bebas Neue, select de campeón con bandera inline al seleccionar
- [x] `StepInstall.tsx` — ilustración SVG de teléfono con glow animado, chips de beneficios en pill, círculos numerados de pasos, dos botones (confirmar + omitir)

### Modal de historial
**Estado:** Completado ✓ (desplegado)

- [x] `PlayerHistoryModal.tsx` — card avatar rectangular (68×88px) con badge de posición superpuesto, animaciones de entrada (overlay fade + sheet slide-up), franja heroica con gradiente, stat bar en Bebas Neue con borde izquierdo acento, gráfica SVG con área de relleno degradada, acordeón con chevron rotante, badge de puntos por partido, pill "TÚ" para perfil propio, estado vacío con ícono SVG de calendario

### Leaderboard Share Card
**Estado:** Completado ✓ (desplegado)

- [x] `LeaderboardShareCard.tsx` — card off-screen 400px para html2canvas: franja superior gradiente, avatar rectangular 80×104px con badge de posición, nombre en Bebas Neue 28px, stat bar con borde acento, footer de marca
- [x] Botón "Compartir mi posición" comentado intencionalmente — restaurar en el futuro cuando se decida
- [x] Colores hardcodeados en `COLORS` record (no CSS variables) para compatibilidad con html2canvas

### Preferencias
**Estado:** Completado ✓ (desplegado)

- [x] `Preferences.tsx` — header con "PREFERENCIAS" en Bebas Neue, `SectionHeader` con línea gradiente, tema con 3 cards (flag 4xl + glow acento al activo), sección instalación con chips pill + instrucciones numeradas, toggle de notificaciones 50×28px + borde izquierdo al activar + LockIcon si denegado, cuenta con iconos SVG (persona/mail), botón cerrar sesión rojo

### Fix Mobile — Tab de Preferencias
**Estado:** Completado ✓ (desplegado)

- [x] `Dashboard.tsx`: `setActiveTab('preferences')` en el tab de móvil (ya no llama a `navigate`)
- [x] `PreferencesContent` extraído como named export de `Preferences.tsx`; renderizado inline en el panel mobile del Dashboard
- [x] La ruta `/preferencias` permanece solo para acceso desktop (ícono engranaje del header)

### Admin panel completo
**Estado:** Completado ✓ (desplegado)

- [x] `AdminLayout.tsx` — header con franja accent 3px, "ADMIN" Bebas Neue, nav desktop con íconos SVG, mobile tab bar con íconos
- [x] `MatchdayList.tsx` — borde izquierdo 4px en color de estado, skeleton shimmer, botones glass
- [x] `MatchdayDetail.tsx` — headers de grupo Bebas Neue, banderas 1.6rem, score Bebas Neue 1.6rem
- [x] `AllowedUsers.tsx` — badge de conteo, botón Invitar con animación de copia, chip verde "Copiado"
- [x] `UserProfiles.tsx` — stats inline en header, badges onboarding/preds, formulario de edición expandible
- [x] `ScoringConfig.tsx` — grupos con emoji, inputs numéricos Bebas Neue 1.3rem, warning amber dos pasos
- [x] `BonusEvaluation.tsx` — card con franja accent, botón submit gradiente Bebas Neue
- [x] `AdminLeaderboard.tsx` — header Bebas Neue, badge de conteo

### Share Cards
**Estado:** Completado ✓ (desplegado)

- [x] `JornadaShareCard.tsx` — layout 2 columnas (evita imagen cortada), `createPortal` para evitar clipping por sticky parent
- [x] `LeaderboardPNGCard.tsx` — hero header Bebas Neue con chip del líder, stat pills, footer de marca, `createPortal`

---

### Notificaciones push
**Estado:** Completado ✓

- [x] `public/firebase-messaging-sw.js` — service worker FCM para notificaciones en background
- [x] `usePushNotifications` hook — permiso, token FCM, toggle activar/desactivar; no aplica con emuladores
- [x] `User.fcmToken?: string` + `saveFcmToken()` en firestoreUsers
- [x] Botón campana en el header del dashboard (solo donde push es soportado: Chrome/Firefox/Android)
- [x] CF `sendDeadlineReminders` — cron horario, avisa 1h antes del `predictionDeadline` de jornadas abiertas
- [x] CF `notifyResultsPublished` — trigger en `matchdays/{id}`, avisa al pasar a `closed`/`finished`
- [x] Limpieza automática de tokens inválidos en Firestore tras envío fallido
- [x] iOS Safari sin PWA: campana oculta (notificaciones no soportadas fuera de PWA)

### Métricas de admin
**Estado:** Completado ✓

- [x] `AdminMetrics.tsx` — página `/admin/metricas` con 4 stat cards (activos, predicciones totales, promedio de puntos, tasa de exactos), barras de participación por jornada y tabla de partidos más difíciles (ordenados por tasa de exactos ascendente)
- [x] Tab "Más" en la barra mobile del admin — panel slide-up con acceso a Bonus, Métricas, Notificaciones, Puntos

### Notificaciones masivas
**Estado:** Completado ✓

- [x] `AdminNotifications.tsx` — página `/admin/notificaciones` con 4 plantillas predefinidas, editor de título/cuerpo (límites 50/150 chars), preview iOS en tiempo real, confirmación en dos pasos
- [x] CF `sendMassNotification` — callable, solo admins; lee todos los `fcmToken`, llama `sendPush`, devuelve `{ sent }`
- [x] `sendMassNotification()` en `cloudFunctions.ts`

---

## Fase 13 — Gamificación: Premios de Jornada + Imagen Compartible
**Estado:** Pendiente ⏳

Presenta los premios de cada jornada con un slideshow animado y una imagen PNG compartible en WhatsApp/redes. El botón aparece en el Dashboard encima de la tabla general una vez que la jornada está calificada.

> **Contexto de modelo:** El sistema usa predicciones de resultado (`'home' | 'draw' | 'away'`). No existen marcadores exactos. `Prediction.isCorrect` es la única fuente de verdad sobre acierto. `UserStats.correctPredictions` cuenta resultados correctos. Los campos `isExact`, `isCorrectResult`, `homeScore` y `awayScore` fueron eliminados del tipo `Prediction`.

### Premios (6 categorías + slide personal)

| # | Premio | Criterio | Emoji | Stat mostrada |
|---|--------|----------|-------|---------------|
| 1 | **El Sabio** | Más aciertos en la jornada; excluye no participantes. Desempate: mayor % sobre predichos → mayor puntuación de jornada | 🧠 | `{n} aciertos` |
| 2 | **El Certero** | Mayor % de aciertos entre quienes predijeron ≥75% de los partidos (mín. redondeado arriba). Desempate: mayor puntuación de jornada. Omitir slide si menos de 3 jugadores califican | 🎯 | `{n}/{N} · {pct}%` |
| 3 | **El Enrachado** | Mayor racha activa: jornadas consecutivas hasta la actual con ≥1 acierto. Omitir en J1 o si nadie alcanza ≥2 | 🔥 | `{n} jornadas seguidas` |
| 4 | **El Inalcanzable** | Más puntos acumulados en la tabla general | ⭐ | `{n} pts totales` |
| 5 | **El Sotanero** | Menos aciertos entre participantes. Desempate: menor % → menor puntuación. Omitir si todos empataron en 0 | 😅 | `{n} aciertos` |
| 6 | **El MVP de la Jornada** | Más puntos en esta jornada | 🏆 | `+{n} pts` |
| 7 | **Tu jornada** | Slide personal de cierre: posición en tabla (con delta ↑↓), aciertos con comparativa grupal, puntos ganados, badge del premio si aplica | 👤 | siempre visible |

**Empates:** todos los jugadores empatados en la misma slide. Avatares circulares (56px) en fila, máx. 5 — si hay más: chip `+N` con fondo acento.

**Orden de presentación:** Sabio → Certero (si califica) → Enrachado (si aplica) → Inalcanzable → Sotanero (si aplica) → MVP → Tu jornada

### Modelo de datos

#### `Matchday` — campo nuevo opcional

```ts
// src/types/Matchday.ts
export interface AwardEntry {
  uid: string
  displayName: string
  avatarUrl: string | null
  value: number    // stat principal: pts, count, streak, pct*100 para El Certero
  label: string    // human-readable: "6 aciertos", "+28 pts", "3 jornadas", "6/8 · 75%"
}

export interface MatchdayAwards {
  el_sabio:         AwardEntry[]
  el_certero:       AwardEntry[]   // vacío si menos de 3 jugadores califican
  el_enrachado?:    AwardEntry[]   // ausente si J1 o nadie llega a streak ≥2
  el_inalcanzable:  AwardEntry[]
  el_sotanero?:     AwardEntry[]   // ausente si todos empataron en 0 aciertos
  el_mvp:           AwardEntry[]
  totalMatches:     number         // N partidos de la jornada (denominador de El Certero)
  computedAt:       string         // ISO timestamp
}

// En Matchday agregar:
awards?: MatchdayAwards
```

#### `User` — campos de racha (ya presentes en producción desde Fase 14A)

```ts
// src/types/User.ts — ya existen:
currentStreak?: number   // jornadas consecutivas activas con ≥1 acierto
maxStreak?: number       // racha máxima histórica del usuario
```

### Cloud Function: `computeMatchdayAwards`

Callable onCall, solo admins. Input: `{ matchdayId: string }`.

**Algoritmo:**

```
1. Validar admin (request.auth + role === 'admin')
2. Leer matchday → verificar status === 'closed' || 'finished'
3. Contar partidos de la jornada: N = matches donde matchdayId === id
4. Query: db.collection('predictions').where('matchdayId', '==', id)
5. Agrupar por userId → Map<uid, { points, correctCount, totalPredicted }>
   - points         = sum(prediction.points ?? 0)
   - correctCount   = count donde isCorrect === true
   - totalPredicted = count donde points !== null  (predicciones calificadas)
   - participated   = totalPredicted > 0
6. Leer todos los User docs → displayName, avatarUrl, stats.totalPoints
7. Calcular ganadores por categoría:
   - el_sabio:
       max(correctCount) entre participated=true
       desempate: mayor (correctCount/totalPredicted) → mayor points
       todos los empatados al final
   - el_certero:
       umbral = ceil(N * 0.75)   // mín. 75% de partidos predichos
       filtrar usuarios con totalPredicted >= umbral
       pct = correctCount / totalPredicted para cada uno
       max(pct); desempate: mayor points
       si menos de 3 calificados → el_certero = []  (slide omitida)
       label = "{correctCount}/{totalPredicted} · {round(pct*100)}%"
   - el_sotanero:
       min(correctCount) entre participated=true
       desempate: menor (correctCount/totalPredicted) → menor points
       omitir si min === 0 Y todos los participated tienen correctCount === 0
   - el_inalcanzable: max(user.stats.totalPoints); todos los empatados
   - el_mvp:          max(points) entre participated=true; todos los empatados
8. El Enrachado (solo si matchday.order > 1):
   a. Leer IDs de matchdays anteriores (status 'closed'/'finished') ordenados por .order ASC
   b. Cargar en chunks: query predictions where matchdayId IN [...ids]
      agregar en memoria: Map<userId, Map<matchdayId, hasCorrect: bool>>
   c. Para cada usuario con participated=true:
      - Recorrer matchdays anteriores en orden DESCENDENTE desde (actual - 1)
      - Si tuvo ≥1 isCorrect en esa jornada → streak++; si no → stop
      - Sumar 1 si correctCount > 0 en la jornada actual
   d. El Enrachado = usuarios con mayor streak; mínimo streak ≥ 2 para mostrarse
      si nadie llega a 2 → el_enrachado omitido
   e. Batch update: user.currentStreak = streak; user.maxStreak = max(actual, histórico)
9. Armar objeto MatchdayAwards (con totalMatches = N) → escribir en matchday.awards (merge)
10. Return { success: true, awards }
```

**Optimización de El Enrachado:** Un único query por chunks (`where('matchdayId', 'in', [...ids])`) — agrupación en memoria. Evita N×M queries.

### UI: `AwardsShowcase.tsx`

Modal full-screen (portal en `document.body`) con slideshow animado.

**Orden de slides:** Sabio → Certero (si el_certero.length ≥ 3) → Enrachado (si aplica) → Inalcanzable → Sotanero (si aplica) → MVP → **Tu jornada** (siempre al final)

**Diseño de cada slide (premios):**
```
┌────────────────────────────────┐
│ JORNADA X · PREMIOS  [🔊] [✕]  │  ← header fijo, Bebas Neue
├────────────────────────────────┤
│                                │
│           🎯                   │  ← emoji: scale bounce entrada
│                                │
│       EL CERTERO               │  ← Bebas Neue 40px, var(--accent)
│                                │
│   [ava]  [ava]                 │  ← avatares circulares 56px en fila
│   Nombre Nombre                │  ← Bebas Neue 20px
│                                │
│      ▲ 8/8 · 100%              │  ← stat badge acento
│                                │
│  ●●○○○○○  ← progress dots     │
│  ◄  2/7  ►                    │  ← navegación manual
│  ████░░░░  ← barra auto-adv   │  ← 5s por slide
└────────────────────────────────┘
```

**Slide "Tu jornada" (última, siempre visible):**
```
┌────────────────────────────────┐
│ JORNADA X · PREMIOS  [🔊] [✕]  │
├────────────────────────────────┤
│          👤                    │
│       TU JORNADA               │
│                                │
│   #3 en la jornada  ↑2         │  ← posición con delta vs jornada anterior
│   6 de 8 aciertos              │  ← mejor que el 73% del grupo
│   +18 pts esta jornada         │
│                                │
│   🏆 MVP de la Jornada         │  ← badge si ganó algún premio (o frase motivacional)
│                                │
│  ●●●●●●●  ← último dot        │
└────────────────────────────────┘
```

**Animación de slides:**
- Entrada: `translateX(+100%) → 0` + `opacity 0→1`, 320ms ease-out
- Salida: `translateX(0 → -100%)` + fade, simultánea a la entrada
- Emoji: `scale(0) → scale(1.25) → scale(1)`, 500ms con overshoot
- Avatares: `scale(0.5) opacity-0 → scale(1) opacity-1`, staggered por índice
- Auto-avance: barra de progreso CSS lineal 5s; se pausa al hover/touch
- Swipe: `touchstart`/`touchend` con delta ≥ 50px

**Audio (activable):**
- Botón 🔊 en el header (ON por defecto, silenciable)
- Al revelar el ganador de cada slide: fanfarria de 0.5s generada con Web Audio API (sin assets externos)
- No aplica en la slide "Tu jornada"

**Cuando hay múltiples ganadores:**
- Avatares circulares (56px) en fila horizontal centrada, máximo 5 visibles
- Si hay más de 5: chip `+N` con fondo acento al final de la fila
- Nombre de cada jugador debajo del avatar en Bebas Neue 16px

### Imagen compartible — Exportación (Fase 13B)

> **Decisión:** El GIF animado se descartó. Sin marcadores exactos no hay narrativa visual de "el vidente adivinando el score". Se reemplaza por una imagen estática PNG que consolida los premios en un resumen visual práctico para WhatsApp. No se instala `gif.js`.

**Stack:** solo `html2canvas` (ya disponible en el proyecto).

**`AwardsSummaryCard.tsx` — frame off-screen (400×700px)**

Imagen estática con los premios en formato compacto:
- Sin CSS variables — colores hardcoded de `COLORS[themeId]` (misma restricción que `LeaderboardShareCard`)
- Bebas Neue cargada vía `index.html` → `await document.fonts.ready`
- Layout vertical: header "JORNADA X · PREMIOS", luego una fila por premio con emoji + título + avatar(es) + stat
- `display: inline-block` + `verticalAlign: middle` (sin flexbox — requisito html2canvas)

**Flujo de generación:**
```
Click "Compartir resumen"
  → setShareState('rendering')
  → await document.fonts.ready
  → html2canvas(AwardsSummaryCard ref) → canvas
  → canvas.toBlob('image/png') → blob
  → Mobile: navigator.share({ files: [new File([blob], 'premios-jornada.png')] })
  → Desktop: <a download> auto-click
```

**Estados del botón:**
```
"Compartir resumen"  →  "Preparando..."  →  compartir/descargar
```

### Integración en Dashboard

**Lógica de visibilidad:**
```ts
// La jornada más reciente cerrada/finalizada con awards calculados
const awardsMatchday = matchdays
  .filter(md => (md.status === 'closed' || md.status === 'finished') && md.awards)
  .sort((a, b) => b.order - a.order)[0]
```

**Posición:** Encima del `<h2>Tabla general</h2>` — tanto en tab "Tabla" mobile como en columna izquierda desktop.

```tsx
{awardsMatchday && (
  <button onClick={() => setShowAwards(true)}>
    🏆 Premios de la jornada — {awardsMatchday.name}
  </button>
)}
{showAwards && awardsMatchday?.awards && (
  <AwardsShowcase
    awards={awardsMatchday.awards}
    matchdayName={awardsMatchday.name}
    matchdayOrder={awardsMatchday.order}
    themeId={themeId}
    onClose={() => setShowAwards(false)}
  />
)}
```

### Admin: Trigger en `MatchdayDetail`

Sección al final de la página, solo visible cuando `matchday.status === 'closed' || 'finished'`:

```tsx
// Botón "Calcular premios" o "Recalcular premios" si awards ya existe
// Badge "Premios calculados ✓ {fecha}" cuando matchday.awards?.computedAt existe
// Estado: computing (spinner) + error banner rojo si falla
```

### Archivos

| Acción | Archivo |
|--------|---------|
| ✨ Crear | `src/pages/Dashboard/AwardsShowcase.tsx` — modal slideshow + slide "Tu jornada" |
| ✨ Crear | `src/pages/Dashboard/AwardsSummaryCard.tsx` — frame off-screen PNG para html2canvas |
| ✏️ Modificar | `src/types/Matchday.ts` — agregar `AwardEntry`, `MatchdayAwards`, campo `awards?` en `Matchday` |
| ✏️ Modificar | `functions/src/index.ts` — agregar CF `computeMatchdayAwards` |
| ✏️ Modificar | `src/services/cloudFunctions.ts` — agregar callable `computeMatchdayAwards` |
| ✏️ Modificar | `src/pages/Admin/MatchdayDetail.tsx` — agregar sección de trigger de premios |
| ✏️ Modificar | `src/pages/Dashboard/Dashboard.tsx` — agregar botón + estado `showAwards` |

> `src/types/User.ts` ya contiene `currentStreak?` y `maxStreak?` desde Fase 14A — no requiere modificación.

### Fases de entrega

| Fase | Qué incluye |
|------|-------------|
| **13A** | Tipos + CF `computeMatchdayAwards` + trigger en admin + `AwardsShowcase` (slideshow + slide "Tu jornada" + audio) + integración en Dashboard |
| **13B** | `AwardsSummaryCard` + captura html2canvas + botón "Compartir resumen" dentro del showcase |

### Decisiones y restricciones técnicas

- **Sin GIF:** Descartado. Sin marcadores exactos el GIF no tiene narrativa. html2canvas ya existe en el proyecto.
- **El Certero — umbral 75%:** `ceil(N * 0.75)` predicciones mínimas. Si menos de 3 jugadores califican, la slide se omite. El denominador del % es `totalPredicted` del usuario, no N — para reflejar sus oportunidades reales.
- **El Sotanero — empate total en 0:** Si todos los participantes tienen `correctCount === 0`, la slide se omite.
- **Racha mínima para El Enrachado:** Streak ≥ 2. Una sola jornada acertada no es racha. Si nadie alcanza 2, la slide se omite aunque no sea J1.
- **Audio Web Audio API:** Fanfarria de 0.5s generada programáticamente (sin assets externos). Botón 🔊 en el header del modal — ON por defecto, silenciable. No aplica en slide "Tu jornada".
- **Slide "Tu jornada":** Datos calculados en cliente desde los datos ya cargados en Dashboard. `currentUserId` se pasa como prop a `AwardsShowcase`. Si el usuario ganó un premio, se muestra su emoji + nombre. Si no, frase motivacional corta.
- **Recálculo:** El admin puede recalcular en cualquier momento. `computedAt` se actualiza; el cliente siempre lee el valor más reciente.
- **`awards` en Firestore:** Campo directo en `matchdays/{id}` (no subcollección) para que `useMatchdays` lo cargue sin cambios.

---

## Fase 14 — Modo Resultado Simple
**Estado:** Pendiente ⏳

Cambio de requerimiento: los usuarios ya **no ingresan marcadores exactos**. Solo predicen el resultado: **local gana / empate / visitante gana**. Esto afecta el modelo de datos, la Cloud Function de scoring, la UI de pronósticos, el historial, la vista post-jornada y la gamificación.

El admin **sigue ingresando el marcador real** (homeScore / awayScore) para determinar el resultado del partido. El cliente solo lo usa para mostrar el resultado, no para comparar con pronósticos.

---

### 14A — Modelo de datos + Cloud Function de scoring
**Estado:** Pendiente ⏳

#### Cambios en tipos

```ts
// src/types/Prediction.ts
type PredictionResult = 'home' | 'draw' | 'away'

interface Prediction {
  userId: string
  matchdayId: string
  matchId: string
  result: PredictionResult | null      // reemplaza homeScore + awayScore
  tieWinner?: string                   // solo en eliminatorias con result === 'draw'
  points?: number
  isCorrect?: boolean                  // reemplaza isExact + isCorrectResult
  scoredAt?: string
}
```

Los campos `homeScore`, `awayScore`, `isExact`, `isCorrectResult` se eliminan del tipo. Las predicciones antiguas en Firestore (si las hay) se ignoran — el sistema las trata como `result: null` (no predicción).

#### Cambios en `config/scoring`

| Campo anterior | Campo nuevo | Default |
|---|---|---|
| `exactScore` (3) | ~~eliminado~~ | — |
| `correctResult` (1) | `correctPrediction` (3) | 3 pts |
| `exactKnockoutWithTie` (3) | ~~eliminado~~ | — |
| `correctTieWinner` (1) | `correctTieWinner` (1) | 1 pt bonus |
| `groupBonus` (5) | `groupBonus` (5) | sin cambio |
| `bonusPrediction` (5) | `bonusPrediction` (5) | sin cambio |

> El "bonus de grupos" se redefine: ya no es por más exactos, sino por **más predicciones correctas** en la fase de grupos (ver 14A-decisiones).

#### Cloud Function `onMatchUpdated` — nueva lógica de scoring

```
1. Derivar matchResult: homeScore > awayScore → 'home' | homeScore < awayScore → 'away' | igual → 'draw'
2. Para cada predicción del partido:
   a. isCorrect = prediction.result === matchResult
   b. points = isCorrect ? scoring.correctPrediction : 0
   c. En eliminatorias con matchResult === 'draw' y prediction.result === 'draw':
      - Si prediction.tieWinner === match.winner → points += scoring.correctTieWinner
3. Aplicar delta (igual que antes) para no duplicar ni perder puntos en re-scorings
```

#### Migración de predicciones existentes

Si el torneo aún no comenzó: no hay predicciones existentes — no se necesita migración.
Si ya hay predicciones con `homeScore`/`awayScore`: escribir script de migración one-shot que derive `result` y limpie los campos obsoletos antes de activar la nueva CF.

#### Archivos

| Acción | Archivo |
|--------|---------|
| ✏️ Modificar | `src/types/Prediction.ts` — reemplazar campos de score por `result` + `isCorrect` |
| ✏️ Modificar | `functions/src/index.ts` — nueva lógica en `onMatchUpdated` |
| ✏️ Modificar | `functions/src/index.ts` — ajustar `checkAndAwardGroupBonus` (usar correctos en lugar de exactos) |
| ✏️ Modificar | `src/services/firestorePredictions.ts` — adaptar escritura de predicciones al nuevo tipo |

---

### 14B — UI de pronósticos
**Estado:** Pendiente ⏳

Reemplaza el teclado numérico y los inputs de marcador por un selector de 3 opciones por partido.

#### Diseño del selector por partido

```
┌─────────────────────────────────────────────────────┐
│  🇲🇽  México          vs          Argentina  🇦🇷      │
├──────────────┬──────────────┬───────────────────────┤
│  [  LOCAL  ] │  [ EMPATE ]  │  [ VISITANTE ]        │
│  México gana │     X        │   Argentina gana       │
└──────────────┴──────────────┴───────────────────────┘
```

- Tres botones tipo pill/tab: **LOCAL · EMPATE · VISITANTE**
- El botón activo lleva el color acento del tema con glow
- En eliminatorias: si el usuario elige "EMPATE", aparece inline la pregunta `¿Quién pasa?` con dos botones (equipo local / equipo visitante) — igual que el `tieWinner` actual pero integrado en el mismo row
- En partidos bloqueados (readOnly): los botones se muestran deshabilitados con opacidad, resaltando la selección hecha

#### Eliminar

- `NumericKeypad.tsx` — ya no se usa
- `PredictionsSidebar.tsx` — reemplazar por un indicador de progreso simplificado (n de m partidos predichos)

#### Indicador de progreso

- Reemplaza la sidebar de desktop y el pill del keypad
- Un `ProgressBar` horizontal arriba de la lista: `Pronósticos: 5 / 8`
- En móvil: mismo componente sticky bajo el header de la jornada

#### Archivos

| Acción | Archivo |
|--------|---------|
| ✨ Crear | `src/components/ResultPicker.tsx` — selector de 3 opciones reutilizable |
| ✨ Crear | `src/components/PredictionProgress.tsx` — barra de progreso (reemplaza sidebar + keypad pill) |
| ✏️ Modificar | `src/pages/Predictions/MatchdayPredictions.tsx` — usar `ResultPicker` por partido, eliminar keypad |
| 🗑️ Eliminar | `src/components/NumericKeypad.tsx` |
| 🗑️ Eliminar | `src/pages/Predictions/PredictionsSidebar.tsx` |

---

### 14C — Post-jornada e historial
**Estado:** Pendiente ⏳

Adaptar todas las vistas que mostraban marcadores pronosticados al nuevo formato de resultado.

#### Vista post-jornada (toggle "Ver todos")

Antes: mostraba `2-1` (pronóstico) vs `2-0` (real).
Ahora: muestra **LOCAL / EMPATE / VISITANTE** con ícono de equipo; resultado real como badge `2-0 · Local`.

```
México 🇲🇽  vs  Argentina 🇦🇷   Resultado real: 2-0
  María:    [LOCAL ✓] +3pts
  Carlos:   [EMPATE ✗] +0pts
  Kuri:     [LOCAL ✓] +3pts
```

#### Modal de historial (`PlayerHistoryModal`)

- Stat boxes: cambiar **"Exactos"** por **"Aciertos"** y **"Correctos"** desaparece (solo había exactos y correctos; ahora solo hay un tipo: correcto/incorrecto)
- Stats nuevos: `totalCorrect` / `totalPredictions` / `accuracy %`
- Acordeón por jornada: badge por partido cambia de `+3 / +1 / +0` a `✓ +3pts / ✗ +0pts`
- Gráfica de evolución: sin cambios (sigue siendo puntos acumulados)

#### `User.stats` — campos afectados

```ts
// Antes
stats: {
  totalPoints: number
  exactPredictions: number    // ← eliminar
  correctResults: number      // ← renombrar a correctPredictions
  totalPredictions: number
}

// Después
stats: {
  totalPoints: number
  correctPredictions: number  // ← renombrado
  totalPredictions: number
  accuracy?: number           // % calculado: correctPredictions / totalPredictions
}
```

La CF `onMatchUpdated` actualiza `correctPredictions` en lugar de `exactPredictions` + `correctResults`.

#### Archivos

| Acción | Archivo |
|--------|---------|
| ✏️ Modificar | `src/types/User.ts` — actualizar `stats` |
| ✏️ Modificar | `src/pages/Dashboard/PlayerHistoryModal.tsx` — nuevos stat boxes + badges |
| ✏️ Modificar | `src/pages/Predictions/MatchdayPredictions.tsx` — vista post-jornada con nuevo formato |
| ✏️ Modificar | `functions/src/index.ts` — actualizar stats en `onMatchUpdated` |

---

### 14D — Gamificación: ajuste de premios (impacto en Fase 13)
**Estado:** Absorbida en Fase 13 ✓

Los cambios de esta sub-fase (reemplazar "El Vidente" por "El Certero", ajustar "El Enrachado" a ≥1 acierto, actualizar algoritmos) fueron incorporados directamente en la redefinición de la Fase 13 (Mayo 2026). No requiere trabajo adicional — la Fase 13 ya incluye el modelo correcto desde el inicio.

> Lo que sigue es el registro histórico original de la decisión:

#### Tabla de premios actualizada

| # | Premio | Criterio anterior | Criterio nuevo |
|---|--------|-------------------|----------------|
| 1 | **El Sotanero** | Menos aciertos (exactos+correctos) | Menos aciertos — sin cambio conceptual |
| 2 | **El Sabio** | Más aciertos (exactos+correctos) | Más aciertos — sin cambio conceptual |
| 3 | **El Vidente** | Más marcadores exactos | ~~Eliminado~~ → reemplazado por **El Certero** |
| 3 | **El Certero** 🎯 | *(nuevo)* | Mayor % de aciertos entre quienes predicaron todos los partidos de la jornada |
| 4 | **El Enrachado** | Jornadas consecutivas con ≥1 exacto | Jornadas consecutivas con ≥1 acierto |
| 5 | **El Inalcanzable** | Más puntos acumulados totales | Sin cambio |
| 6 | **El MVP de la Jornada** | Más puntos esta jornada | Sin cambio |

> **El Certero:** solo compite quien predicó los N partidos de la jornada. Entre ellos, gana quien tuvo mayor porcentaje de aciertos. En empate, gana quien tiene más puntos en la jornada.

#### Cambios en `MatchdayAwards`

```ts
export interface MatchdayAwards {
  el_mvp:           AwardEntry[]
  el_certero:       AwardEntry[]   // reemplaza el_vidente
  el_sabio:         AwardEntry[]
  el_enrachado?:    AwardEntry[]
  el_inalcanzable:  AwardEntry[]
  el_sotanero:      AwardEntry[]
  computedAt:       string
}
```

`AwardEntry.value` para El Certero = porcentaje (0–100); `label` = `"8/8 partidos · 100%"`.

#### Algoritmo de El Certero en `computeMatchdayAwards`

```
1. Contar total de partidos en la jornada (N)
2. Filtrar usuarios que predijeron exactamente N partidos
3. Calcular accuracy = correctCount / N para cada uno
4. Ganador(es) = max(accuracy); empate desempatado por points
```

#### Archivos

| Acción | Archivo |
|--------|---------|
| ✏️ Modificar | `src/types/Matchday.ts` — renombrar `el_vidente` → `el_certero` en `MatchdayAwards` |
| ✏️ Modificar | `functions/src/index.ts` — `computeMatchdayAwards`: reemplazar lógica de exactos por accuracy + redefinir El Enrachado |
| ✏️ Modificar | `src/pages/Dashboard/AwardsShowcase.tsx` — actualizar slide de El Certero (emoji 🎯, label de %) |

---

### Admin: ajustes al panel de configuración de puntos (`14E`)
**Estado:** Pendiente ⏳

- Eliminar campos `exactScore` y `exactKnockoutWithTie` del formulario `ScoringConfig`
- Renombrar `correctResult` → `correctPrediction` con descripción actualizada
- Añadir advertencia visible: "El torneo usa modo resultado simple. Los usuarios solo predicen Local / Empate / Visitante."

#### Archivos

| Acción | Archivo |
|--------|---------|
| ✏️ Modificar | `src/pages/Admin/ScoringConfig.tsx` — simplificar formulario |
| ✏️ Modificar | `functions/src/index.ts` — actualizar `DEFAULT_SCORING` |

---

### Orden de implementación recomendado

| Sub-fase | Qué implementar primero | Por qué |
|----------|-------------------------|---------|
| **14A** | Tipos + CF scoring | El resto del sistema depende del nuevo contrato de datos |
| **14B** | UI de pronósticos | La parte más visible para usuarios |
| **14C** | Post-jornada + historial | Lectura; no bloquea ingreso de predicciones |
| **14D** | Premios (si Fase 13 está lista) | Solo si Fase 13 ya existe |
| **14E** | Admin scoring config | Bajo impacto; se puede hacer al final |

### Decisiones y restricciones

- **El admin sigue ingresando marcadores:** La UI admin (`MatchdayDetail`) no cambia. El marcador real sigue siendo la fuente de verdad para derivar el resultado.
- **Bonus de grupos:** Se redefine como el usuario con más **predicciones correctas** (no exactas) en la fase de grupos. Si hay empate en correctas, gana quien tenga más puntos totales al cierre de grupos.
- **tieWinner en eliminatorias:** Se mantiene. Si el usuario predice "EMPATE" en una eliminatoria, el sistema sigue preguntando `¿Quién pasa?`. La CF evalúa `tieWinner` igual que antes.
- **Predicciones antiguas:** Si ya hay jornadas calificadas bajo el sistema anterior, sus puntos no se recalculan. La nueva CF solo aplica al invocar con un resultado nuevo o modificado.
- **`isExact` / `isCorrectResult`:** Eliminados del tipo. La CF escribe solo `isCorrect`. El cliente no debe leer los campos viejos.
- **Fase 13 es independiente:** La Fase 13 (slideshow de premios) puede implementarse antes o después de la Fase 14. Si se hace antes, usar los tipos actuales; al llegar a 14D se migra `el_vidente → el_certero`.
