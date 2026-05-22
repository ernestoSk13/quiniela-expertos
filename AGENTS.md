# AGENTS.md — Guía para Agentes de IA

Instrucciones para contribuir a **Quiniela Expertos del Mundial 2026** como agente de IA.

## Contexto del Proyecto

App de quiniela de fútbol para el Mundial 2026. Los usuarios pronostican marcadores por jornada y acumulan puntos. Stack: **React 19 + TypeScript + Vite 6** + **Firebase** (Auth, Firestore, Storage, Hosting, Cloud Functions gen2) + **Tailwind CSS v4**.

Lee el `README.md` completo para entender las reglas del negocio y los modelos de datos antes de hacer cambios.

---

## Estado Actual (Mayo 2026)

- [x] Firebase configurado (Auth, Firestore, Storage, Hosting, Cloud Functions gen2)
- [x] Autenticación — email/contraseña + Google, lista de correos permitidos
- [x] Onboarding — display name, avatar, bonus predictions (2 pasos)
- [x] Dashboard — tabla de posiciones en tiempo real, siguiente jornada, sección de bonus, countdown al torneo, jornadas anteriores
- [x] Pronósticos — keypad numérico en móvil (con scroll automático al partido activo), inputs directos + sidebar en desktop (partidos guardados colapsan con animación, sección "Guardados" con edición por lápiz); bloqueo por `scheduledAt` individual además del deadline de jornada
- [x] Panel de Admin — jornadas, resultados, jugadores, bonus, acceso; tabla general (`/admin/tabla`); configuración de puntos (`/admin/config`); nav desktop con 6 ítems, tab bar móvil con 4
- [x] Temas por país — México / Canadá / EUA (paleta FIFA WC 2026), skill `/add-theme` para agregar nuevos
- [x] Cloud Functions gen2 — `onMatchUpdated` (scoring + config dinámica), `evaluateBonusPredictions` (bonus + config dinámica), `getInvite` (valida tokens de invitación sin auth)
- [x] Historial por jugador — modal desde el leaderboard con stats, gráfica SVG de evolución y acordeón por jornada
- [x] Post-jornada — toggle "Ver todos" en jornadas cerradas/finalizadas muestra predicciones de todos los jugadores partido a partido con badges de puntos
- [x] Puntos configurables — `config/scoring` en Firestore; admin edita desde `/admin/config`; Cloud Functions leen config con fallback a `DEFAULT_SCORING`
- [x] Link de invitación — admin genera token por correo desde `/admin/usuarios`; invitado abre `/invite/:token` y llega al login con correo pre-cargado

---

## Convenciones de Código

### TypeScript
- Todos los archivos `.tsx` / `.ts`. Sin `any` explícito.
- Los modelos de Firestore tienen sus interfaces en `src/types/`. Úsalas siempre.
- Prefiere `interface` sobre `type` para modelos de datos.

### React
- Componentes funcionales con hooks. Sin componentes de clase.
- Un componente por archivo. Nombre del archivo = nombre del componente (PascalCase).
- Props tipadas como `interface` separada. Evita `React.FC<>`.
- Custom hooks en `src/hooks/`, prefijo `use`.
- **No usar `<StrictMode>`** — causa errores de aserción en el emulador de Firestore con queries compuestas (`ve: -1`).

### Firebase / Firestore
- Toda interacción con Firestore va en `src/services/`. Los componentes no llaman a `collection()` / `doc()` directamente.
- Usa `onSnapshot` para datos en tiempo real; `getDocs` para queries compuestas (evita bug del emulador).
- Document IDs de predicciones: `{userId}_{matchId}`.
- Operaciones batch: máximo 499 ops por batch (cliente) / 500 (admin SDK).

### Styling — Tailwind CSS v4
- `@import "tailwindcss"` en `src/index.css`. Sin `tailwind.config.js`.
- **Mobile-first**. La app se usa principalmente desde celular.
- Sin CSS-in-JS ni módulos CSS.
- **Colores temáticos** via CSS custom properties — nunca hardcodear `emerald-*`, `blue-*`, etc. para colores de acento. Usa las variables:
  - `bg-[var(--accent)]` — color de acción principal
  - `bg-[var(--accent-hover)]` — hover de acción
  - `text-[var(--accent-light)]` — texto de acento
  - `bg-[var(--accent-muted)]` — fondo semi-transparente
  - `bg-[var(--accent-deep)]` — fondo muy semi-transparente (filas seleccionadas)
  - `surface-nav` — clase utilitaria para header/tab bar
  - `surface-card` — clase utilitaria para tarjetas/paneles
  - `app-bg` — clase utilitaria para el fondo de página completa

---

## Estructura de Archivos

```
functions/                           # Cloud Functions gen2 (Node.js 22)
├── src/index.ts                     # onMatchUpdated + evaluateBonusPredictions + getInvite
├── package.json                     # firebase-admin ^13, firebase-functions ^7
└── tsconfig.json

src/
├── components/
│   ├── Avatar.tsx
│   ├── AuthGuard.tsx
│   ├── LoadingScreen.tsx
│   ├── StatusBadge.tsx
│   └── ThemeSelector.tsx            # Selector de tema en el Dashboard
├── context/
│   ├── AuthContext.tsx              # onSnapshot en tiempo real del user doc
│   └── ThemeContext.tsx             # Aplica clase de tema en <html>
├── hooks/
│   ├── useAllMatchdayPredictions.ts # getDocs lazy: todos los pronósticos de una jornada
│   ├── useLeaderboard.ts
│   ├── useMatchdayProgress.ts       # Cuenta predicciones enviadas vs total para barra de progreso
│   ├── useMatchdays.ts
│   ├── useMatches.ts
│   ├── usePlayerHistory.ts          # Historial de predicciones calificadas agrupadas por jornada
│   ├── usePredictions.ts            # getDocs (no onSnapshot) por bug del emulador
│   ├── useScoringConfig.ts          # onSnapshot en config/scoring; expone DEFAULT_SCORING como fallback
│   └── useTeams.ts
├── lib/
│   ├── firebase.ts                  # Configuración Firebase + emuladores
│   └── themes.ts                    # THEMES array + themeClassName()
├── pages/
│   ├── Admin/
│   │   ├── AdminLayout.tsx          # DESKTOP_NAV (6 ítems) + MOBILE_NAV (4 ítems, tab bar)
│   │   ├── AdminLeaderboard.tsx     # /admin/tabla — reutiliza LeaderboardTable + PlayerHistoryModal
│   │   ├── AllowedUsers.tsx         # + botón "Invitar" que genera token y copia link
│   │   ├── BonusEvaluation.tsx      # Evalúa bonus predictions via Cloud Function
│   │   ├── MatchdayDetail.tsx
│   │   ├── MatchdayList.tsx
│   │   ├── ScoringConfig.tsx        # /admin/config — formulario de puntos con advertencia antes de guardar
│   │   └── UserProfiles.tsx         # Lista jugadores con conteo de pronósticos y estado onboarding
│   ├── Dashboard/
│   │   ├── BonusSummary.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── PlayerHistoryModal.tsx   # Bottom-sheet/modal con historial y gráfica SVG
│   │   └── TournamentCountdown.tsx  # Countdown al 2026-06-11T13:00:00Z (se oculta al iniciar)
│   ├── Invite/
│   │   └── InvitePage.tsx           # /invite/:token — pública; llama getInvite, muestra bienvenida
│   ├── Login/Login.tsx              # Lee ?email= query param para pre-llenar desde link de invitación
│   ├── Onboarding/
│   │   ├── Onboarding.tsx
│   │   ├── StepBonus.tsx
│   │   └── StepProfile.tsx
│   └── Predictions/
│       ├── CompactMatchRow.tsx
│       ├── MatchdayPredictions.tsx
│       ├── NumericKeypad.tsx        # Keypad fijo en móvil
│       ├── PostMatchdayView.tsx     # Vista post-jornada: predicciones de todos × partido
│       └── PredictionsSidebar.tsx  # Sidebar de desktop (progreso, cambios pendientes, guardados)
├── services/
│   ├── cloudFunctions.ts           # Wrappers callables: evaluateBonusPredictions, getInvite
│   ├── firestoreAdmin.ts           # resetAllData()
│   ├── firestoreConfig.ts          # ScoringConfig, DEFAULT_SCORING, subscribeScoringConfig, saveScoringConfig
│   ├── firestoreInvites.ts         # generateInviteLink(email) — escribe invites/{token} desde cliente admin
│   ├── firestoreMatchdays.ts
│   ├── firestoreMatches.ts
│   ├── firestorePredictions.ts     # savePredictions(), getUserPredictions(), getMatchdayAllPredictions()
│   ├── firestoreUsers.ts           # ensureUserDoc(), updateUserTheme(), adminUpdateUser()
│   ├── storageAvatars.ts
│   └── storageMatchdayImages.ts
└── types/
    ├── index.ts
    ├── Match.ts
    ├── Matchday.ts
    ├── Team.ts
    └── User.ts                     # Incluye theme?: ThemeId
```

---

## Cloud Functions (gen2)

Las funciones viven en `functions/src/index.ts` y se despliegan en `us-central1`.

### `onMatchUpdated` — Trigger de Firestore
Se dispara en cualquier actualización a `matches/{matchId}`. Detecta tres casos:

- **Score nuevo** (`!wasFinished && isFinished`): califica todas las predicciones del partido con `computePoints()`, escribe `points / isExact / isCorrectResult` en cada predicción, e incrementa `stats` del usuario con `FieldValue.increment()`. Si el partido es de `group_stage`, llama a `checkAndAwardGroupBonus()`.
- **Corrección de score** (ambos `finished` con scores distintos): recalcula y aplica el delta de puntos.
- **Revert** (`wasFinished && !isFinished`): borra puntos de predicciones y los resta de stats.

### `evaluateBonusPredictions` — Callable HTTP
Solo admins. Recibe `{ topScorer, goldenBall, mexicoPhase, champion }` y otorga puntos por cada acierto comparando contra `bonusPredictions` de cada usuario. Puntos por acierto = `cfg.bonusPrediction` (default 5). Marca `bonusPredictions.pointsAwarded = true` para evitar doble puntuación.

### `getInvite` — Callable HTTP (sin auth)
Recibe `{ token }`. Lee `invites/{token}` via Admin SDK (bypassa rules). Valida que no haya expirado. Devuelve `{ email }`. No requiere autenticación — el invitado aún no tiene cuenta.

### `checkAndAwardGroupBonus` — Helper interno
Otorga `cfg.groupBonus` pts (default 5) al usuario (o usuarios empatados) con más predicciones exactas en la fase de grupos, cuando todos los partidos de grupos están `finished`. Protegido por `config/tournament.groupBonusAwarded` (transacción Firestore para evitar doble ejecución).

### Lógica de puntuación (`computePoints`)
Los valores de puntos se leen de `config/scoring` al inicio de cada calificación. Si el documento no existe se usa `DEFAULT_SCORING`.

| Caso | Exacto (`cfg.exactScore`) | Resultado correcto (`cfg.correctResult`) |
|------|--------------------------|------------------------------------------|
| Fase de grupos | home+away exactos | G/E/P correcto |
| Eliminatoria sin empate al 90' | home+away exactos | ganador correcto |
| Eliminatoria con empate al 90' | home+away + tieWinner (`cfg.exactKnockoutWithTie`) | solo tieWinner (`cfg.correctTieWinner`) |

---

## Sistema de Temas

Los temas se definen en dos lugares:

1. **`src/index.css`** — bloque de variables CSS por tema (`.theme-canada`, `.theme-usa`, etc.)
2. **`src/lib/themes.ts`** — array `THEMES` con `id`, `label`, `flag`, `className`

Para agregar un tema nuevo: usar el skill `/add-theme` o seguir el patrón exacto de `.theme-canada`.

El `ThemeContext` aplica la clase en `<html>`. El selector vive en el header del Dashboard.

El campo `theme?: ThemeId` se guarda en el documento `users/{uid}` de Firestore.

---

## Flujos Críticos (no romper)

1. **Auth guard** — Sin auth → `/login`. Auth pero sin onboarding → `/onboarding`.
2. **Onboarding** — Escribe `onboardingCompleted: true` **antes** de redirigir. `AuthContext` lo detecta via `onSnapshot` y `OnboardingRoute` redirige.
3. **Predicciones** — Solo guardar si `matchday.status === 'open'` y `Date.now() < predictionDeadline`. Adicionalmente, cada partido se bloquea individualmente cuando `match.scheduledAt <= new Date()`, aunque la jornada siga abierta. Lógica en `MatchdayPredictions.tsx` → flags `readOnly` y `matchReadOnly` por partido.
4. **Leaderboard** — Lee la colección `users` filtrada por `onboardingCompleted === true`, ordenada por `stats.totalPoints` desc. Los puntos son escritos server-side por `onMatchUpdated`. La regla de Firestore permite `read` a cualquier `isAllowedUser()` — sin este permiso el query de colección falla.
5. **Scoring** — Siempre server-side (Cloud Functions). El cliente solo lee `stats` y `prediction.points`. Nunca calcular puntos en el cliente.

---

## Reglas de Negocio

- Puntos se calculan **server-side** (Cloud Functions). El cliente solo lee; nunca calcula.
- `bonusPredictions.pointsAwarded` evita doble puntuación de bonus.
- Bonus editables hasta `2026-06-11T13:00:00Z` (hardcodeado en `BonusSummary.tsx`).
- Predicciones de jornada: editables hasta el `predictionDeadline` de la jornada **y** hasta que el `scheduledAt` del partido individual pase — lo que ocurra primero.
- En fases eliminatorias con empate al 90', se requiere `tieWinner` (equipo que avanza).
- Pronósticos ajenos: solo visibles cuando `matchday.status` es `'closed'` o `'finished'`. Aplicado en Firestore rules (con `get()` al documento de jornada) y en el toggle de UI.
- Zona horaria: **UTC**. "Lo que escribes es lo que ves". `toLocaleString` usa `timeZone: 'UTC'`.
- `!= null` (desigualdad débil) para chequear `null | undefined`. Usar en lugar de `!== null` cuando un valor puede ser `undefined`.
- **Puntos configurables:** Los valores de puntos viven en `config/scoring`. Las Cloud Functions los leen con `getScoringConfig()` antes de cada calificación. Cambiar los valores no recalifica predicciones ya puntuadas — advertir al usuario antes de guardar.
- **Invites:** Tokens guardados en `invites/{token}` (TTL 7 días). Solo el admin puede escribirlos. La lectura va por `getInvite` Cloud Function (Admin SDK omite rules). `/invite/:token` es una ruta pública sin guard de auth.

---

## Comandos Útiles

```bash
# Frontend
npm run dev              # Dev server localhost:5173
npm run build            # Build de producción (tsc + vite)
npm run emulators        # Firebase Emulators (Auth/Firestore/Storage/Functions)
npm run seed             # Seed de datos iniciales en emulador
npm run pull-from-prod   # Importa teams/matchdays/matches de producción al emulador
firebase deploy --only hosting          # Deploy frontend a producción
firebase deploy --only functions        # Deploy Cloud Functions a producción
firebase deploy --only firestore:rules  # Deploy reglas de Firestore

# Dentro de functions/
npm run build            # Compilar TypeScript → lib/
```

---

## Qué NO Hacer

- No calcular puntos en el cliente — siempre son calculados por `onMatchUpdated`.
- No usar `<StrictMode>` — rompe el emulador de Firestore.
- No usar `onSnapshot` para queries con `where` + `orderBy` compuestas en el emulador — usar `getDocs`.
- No hardcodear colores de acento (`emerald-*`, etc.) — usar variables CSS `var(--accent)`.
- No hacer writes a Firestore sin verificar el estado de la jornada.
- No exponer pronósticos de otros usuarios si `matchday.status` no es `'closed'` ni `'finished'` — verificar tanto en Firestore rules como en UI.
- No modificar `firestore.rules` sin actualizar tests de reglas.
- No hacer commits con credenciales distintas al proyecto `quinielaexpertos26`.
- No agregar features no solicitadas ("gold-plating").
- No usar `firebase-functions` < v4 — las funciones son gen2 y requieren el API v2 (`firebase-functions/v2/...`).
