# Resumen de sesión — 22 May 2026

Sesión centrada en tres temas: fix de CORS en avatares (bug de producción), navegación por tabs en el dashboard móvil, y rediseño del modal de historial del jugador.

---

## 1. Fix CORS — Avatares rotos en el leaderboard

**Bug:** Los avatares en `LeaderboardRow` no cargaban en producción.

**Causa:** `crossOrigin="anonymous"` en el `<img>` hace que el browser envíe un header `Origin` en la petición. Firebase Storage respondía con status 200 pero sin el header `Access-Control-Allow-Origin` → bloqueado.

**Fix:** CORS configurado directamente en el bucket `quinielaexpertos26.firebasestorage.app` usando un script Node.js con firebase-admin y la service account existente. No hubo cambios de código.

**Orígenes autorizados:**
- `https://quinielaexpertos26-a7440.web.app`
- `https://quinielaexpertos26.firebaseapp.com`
- `http://localhost:5173` y `http://localhost:4173`

**Nota técnica:** No se usó `gsutil` (no instalado). Script temporal `.cjs` ejecutado con `node` y eliminado al terminar.

---

## 2. Tabs en el dashboard móvil (Fase 6 mejora)

**Commit:** `95b977d`

**Motivación:** Con muchos participantes el dashboard se vuelve muy largo en móvil al apilar tabla + jornada + historial en una sola columna.

### Diseño

**Móvil (< lg / 1024px):** Barra de tabs fija en la parte inferior (mismo patrón que admin), con tres tabs:

| Tab | Contenido |
|-----|-----------|
| 📅 Pronósticos | TournamentCountdown + tarjeta de siguiente jornada + BonusSummary + Jornadas anteriores |
| 📊 Tabla | LeaderboardTable + LeaderboardShareCard |
| 🕐 Historial | Stats del usuario (3 cajas) + gráfica de evolución + acordeón por jornada (inline, sin modal) |

**Desktop (≥ lg):** Layout original sin cambios. Grid de 3 columnas: leaderboard (2/3) + sidebar (1/3).

### Implementación

- `PlayerHistoryModal.tsx`: se exportó `HistoryContent` para reutilizarlo en el tab inline.
- `Dashboard.tsx`: restructurado con dos bloques de render separados — `lg:hidden` (tabs) y `hidden lg:block` (grid desktop). Estado `activeTab: 'predictions' | 'leaderboard' | 'history'`.
- Iconos SVG inline de Material Design (calendar, leaderboard, history). Default: `'predictions'`.

### Archivos modificados
- `src/pages/Dashboard/Dashboard.tsx`
- `src/pages/Dashboard/PlayerHistoryModal.tsx`

---

## 3. Rediseño del modal de historial (Fase 11)

**Commits:** `f3719ca`

### Diseño nuevo (basado en mock provisto)

**Header en dos piezas:**

1. **Card de avatar** (68×88px) con badge de posición superpuesto en esquina superior izquierda (`position: absolute, top: -10, left: -10`, 32px de diámetro). Colores del badge: dorado / plata / bronce para top 3, gris para el resto.
2. **Columna derecha:** nombre del jugador + botón ✕ en la misma fila, seguido de 3 stat boxes compactos (80px cada uno):
   - **Puntos** (`totalPoints`) — color acento
   - **Aciertos** (`exactPredictions + correctPredictions`) — total que sumaron puntos
   - **Exactos** (`exactPredictions`) — marcador exacto
   - Font 16px para valores ≥ 100, 20px para el resto

**Contenido inferior** (sin cambios): gráfica de evolución de puntos + acordeón por jornada.

### Cambios de interfaz

- `LeaderboardTable.tsx`: `onPlayerClick` ahora pasa `(player: User, position: number)` en lugar de solo `player`.
- `Dashboard.tsx`: estado `selectedPlayer` cambió de `User | null` a `{ player: User; position: number } | null`.
- `AdminLeaderboard.tsx`: mismo cambio de estado + pasa posición al modal.

### Archivos modificados
- `src/pages/Dashboard/PlayerHistoryModal.tsx`
- `src/pages/Dashboard/LeaderboardTable.tsx`
- `src/pages/Dashboard/Dashboard.tsx`
- `src/pages/Admin/AdminLeaderboard.tsx`

---

## Tareas pendientes (próximas sesiones)

- **Notificaciones push** (Fase 11) — service worker + FCM, recordatorio antes del `predictionDeadline` y aviso de resultados.
