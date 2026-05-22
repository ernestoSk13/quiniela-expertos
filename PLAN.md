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

---

## Decisiones tomadas

- **Tiempo extra y penales:** Los pronósticos se evalúan sobre el marcador al **final del tiempo regular (90')**. En fases eliminatorias, cuando un usuario pronostica empate, aparece una pregunta adicional: "¿Quién pasa a la siguiente ronda?". El campo `matches.winner` guarda el equipo que avanzó; `predictions.tieWinner` guarda el pronóstico del usuario.
- **Scoring server-side:** Toda lógica de puntos vive en Cloud Functions. El cliente solo lee.
- **Bonus de grupos:** +5pts automático al usuario(s) con más predicciones exactas en fase de grupos, una sola vez al terminar todos los partidos de grupos. Guard: `config/tournament.groupBonusAwarded`.
- **Bonus onboarding:** Evaluación manual por el admin (4 preguntas × 5pts). No se puede deshacer.
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

### Compartir como imagen *(pendiente)*
- [ ] Screenshot de posición / resumen de jornada con Web Share API + html2canvas

### Notificaciones push *(pendiente)*
- [ ] Recordatorio antes del predictionDeadline + aviso de resultados (service worker + FCM)
