# Resumen de sesión — 21–22 May 2026 (últimas 12 horas)

Sesión larga centrada en cerrar **Fase 10.5** (mejoras al panel de admin) y avanzar **Fase 11** (compartir, invitación, rediseño de leaderboard). Todo desplegado a producción en `quinielaexpertos26-a7440.web.app`.

---

## 1. Fase 10.5 — Tabla general en admin + puntos configurables

**Commit:** `d7ed451` feat(fase-10.5)

- Nueva pestaña **"Tabla"** en el nav desktop del admin (`/admin/tabla`) que reutiliza `LeaderboardTable` + `PlayerHistoryModal`. El admin puede abrir el historial de cualquier jugador.
- Nueva pestaña **"Puntos"** (`/admin/config`) con formulario agrupado por categoría:
  - Partidos normales: `exactScore`, `correctResult`
  - Eliminatorias con empate al 90': `exactKnockoutWithTie`, `correctTieWinner`
  - Bonus: `groupBonus`, `bonusPrediction`
- Confirmación en dos pasos antes de guardar: advierte que cambiar valores no recalifica predicciones ya puntuadas.
- Cloud Functions ahora leen `config/scoring` antes de cada calificación (`getScoringConfig()` con fallback a `DEFAULT_SCORING`).
- Split de nav admin: `MOBILE_NAV` (4 ítems, tab bar) vs `DESKTOP_NAV` (6 ítems). Tabla y Puntos solo en escritorio.

**Archivos clave nuevos:**
- `src/services/firestoreConfig.ts`
- `src/hooks/useScoringConfig.ts`
- `src/pages/Admin/ScoringConfig.tsx`
- `src/pages/Admin/AdminLeaderboard.tsx`

---

## 2. Fase 11 — Link de invitación

**Commit:** `c73de9a` feat(fase-11)

- Cloud Function `getInvite(token)`: lee `invites/{token}` con Admin SDK (sin auth requerida), valida expiración, devuelve `{ email }`.
- `generateInviteLink(email)` (cliente admin): genera token UUID, guarda en `invites/{token}` con TTL 7 días, devuelve URL.
- Botón **"Invitar"** por correo en `/admin/usuarios` que copia el link al portapapeles con feedback "Copiado".
- Página pública `/invite/:token` (sin auth guard) → bienvenida con correo pre-cargado → botón a `/login?email=...`.
- Firestore rules: `invites/{token}` — write: isAdmin; read: false (solo Admin SDK).

---

## 3. Login simplificado a solo Google

**Commit:** `67a1148` refactor(login)

- Removidos: formulario email/contraseña, divider, manejo de errores específicos, `signInWithEmailAndPassword`.
- Mantenido: botón único de Google sign-in, estado de loading, estado de error.

---

## 4. Compartir como imagen — primera iteración

**Commits:** `0479b32`, `0ea1d9e`, `e95bd76`

- `useShareImage` con `html2canvas` + Web Share API y fallback a descarga (`forceDownload`).
- `LeaderboardShareCard` (dashboard): botón "Compartir mi posición" → PNG con la fila del usuario.
- `JornadaShareCard` (post-jornada): botón "Compartir" arriba del toggle → PNG con resumen de pronósticos calificados.
- `LeaderboardPNGCard` (admin): botón "Compartir tabla" → PNG de la tabla general completa, formato móvil 9:16 (390×844px).
- Avatares cargados con `crossOrigin="anonymous"` + espera de `img.onload/onerror` antes del capture.
- Fix posterior: en `LeaderboardPNGCard` se fuerza descarga directa (no usa Web Share API).

---

## 5. Rediseño del leaderboard tipo carta FIFA — iteración larga

**Commit:** `c5eee82` feat(leaderboard) (desplegado a producción)

### Iteraciones del PNG card (proceso de descubrimiento)
1. **Primer intento**: tabla con columnas Pts/Exactos. Problema: nombres recortados verticalmente por bug de html2canvas con `overflow:hidden` + flex + `line-height` corto.
2. **Segundo intento**: cada celda como contenedor full-height. No resolvió el recorte vertical.
3. **Tercer intento**: layout de 2 líneas (nombre + "X marcadores exactos") con avatar circular. Sin overflow:hidden en el nombre. Funcionó.
4. **Cuarto intento (final)**: rediseño completo estilo FIFA Ultimate Team — mini-card rectangular a la izquierda con avatar completo, nombre grande, posición prefijada al nombre, puntos enormes a la derecha.

### Diseño final
- **Componente compartido** `src/components/LeaderboardRow.tsx` (inline styles, intencionales para que html2canvas funcione sin problemas).
- Mini-card 40×48 con avatar `objectFit: cover` + borde medalla (oro/plata/bronce) para top 3.
- Posición "N." antes del nombre, en color medalla para top 3 o blanco muted para el resto.
- Filas con fondo `rgba(accent, 0.14)` (oscuro) / `rgba(accent, 0.05)` (claro) alternando, transparentes para que el blob temático se vea a través.
- Highlight de usuario actual: `box-shadow` ring del acento + chip "TÚ".
- Altura `ROW_H = 48` (compacto).

### Consumidores
- `LeaderboardTable` (Dashboard + AdminLeaderboard): lista con `onClick` → modal de historial.
- `LeaderboardPNGCard`: mismo row dentro del PNG (header + filas + footer).

---

## 6. Documentación

**Commits:** `8237189`, `ea3ed0a`, `36097a4`

Cinco archivos sincronizados:
- **PLAN.md**: Fase 10.5 completa, Fase 11 con sub-secciones (invitación, compartir, rediseño leaderboard) + nueva sub-sección "Rediseño del modal de historial" pendiente.
- **AGENTS.md**: estado actual, archivos nuevos en estructura (`LeaderboardRow`, share cards, `useShareImage`, `firestoreInvites`, `firestoreConfig`).
- **DEV.md**: nuevos flujos de prueba (invitación, scoring config, compartir como imagen) + notas sobre inline styles de LeaderboardRow + manejo CORS de avatares.
- **IDEAS.md** (local-only): marcado compartir y rediseño leaderboard como hechos; agregada idea futura de **avatares estilo Panini con Gemini nano banana**.
- **README.md**: login Google-only + invitación, compartir imagen, admin tabla/config, modelos Firestore para `config/scoring` e `invites/{token}`.

---

## Tareas pendientes (próxima sesión)

- **Rediseño del modal de historial** (`PlayerHistoryModal`) — el usuario va a proveer mock design. Debe mantener stats, gráfica de evolución, acordeón por jornada y bottom-sheet en móvil; revisar consistencia con el nuevo leaderboard FIFA.
- **Notificaciones push** (Fase 11) — recordatorio antes del `predictionDeadline` y aviso de resultados (service worker + FCM).

## Ideas futuras agregadas a IDEAS.md

- **Avatares estilo Panini con IA** — integrar Gemini "nano banana" para transformar foto del onboarding en estampa estilo FIFA Panini. Encaja con el rediseño del leaderboard tipo carta FIFA.

---

## Stats del día

- **17 commits** en las últimas 12 horas (~13:30 → 00:52)
- **3 deploys** a producción (hosting + functions + rules en distintos momentos)
- Stack tocado: React/TS frontend, Cloud Functions gen2, Firestore rules, html2canvas + Web Share API
- Bugs resueltos en el camino: recorte vertical de texto en html2canvas, CORS de avatares de Google, padding/alineación del PNG card
