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
- [x] Dashboard — tabla de posiciones en tiempo real, siguiente jornada, sección de bonus
- [x] Pronósticos — keypad numérico en móvil, inputs directos en desktop, sidebar con progreso y cambios pendientes, soporte de fases eliminatorias (tieWinner)
- [x] Panel de Admin — jornadas, resultados de partidos, gestión de jugadores (con conteo de pronósticos y estado de onboarding), gestión de acceso, evaluación de bonus
- [x] Temas por país — México / Canadá / EUA (paleta FIFA WC 2026), skill `/add-theme` para agregar nuevos
- [x] Cloud Functions gen2 — scoring automático al actualizar resultados, evaluación manual de bonus predictions

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
├── src/index.ts                     # onMatchUpdated + evaluateBonusPredictions
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
│   ├── useLeaderboard.ts
│   ├── useMatchdays.ts
│   ├── useMatches.ts
│   ├── usePredictions.ts            # getDocs (no onSnapshot) por bug del emulador
│   └── useTeams.ts
├── lib/
│   ├── firebase.ts                  # Configuración Firebase + emuladores
│   └── themes.ts                    # THEMES array + themeClassName()
├── pages/
│   ├── Admin/
│   │   ├── AdminLayout.tsx          # Nav + bottom tab bar (móvil). Rutas: Jornadas / Jugadores / Bonus / Acceso
│   │   ├── AllowedUsers.tsx
│   │   ├── BonusEvaluation.tsx      # Evalúa bonus predictions via Cloud Function
│   │   ├── MatchdayDetail.tsx
│   │   ├── MatchdayList.tsx
│   │   └── UserProfiles.tsx         # Lista jugadores con conteo de pronósticos y estado onboarding
│   ├── Dashboard/
│   │   ├── BonusSummary.tsx
│   │   ├── Dashboard.tsx
│   │   └── LeaderboardTable.tsx
│   ├── Login/Login.tsx
│   ├── Onboarding/
│   │   ├── Onboarding.tsx
│   │   ├── StepBonus.tsx
│   │   └── StepProfile.tsx
│   └── Predictions/
│       ├── CompactMatchRow.tsx
│       ├── MatchdayPredictions.tsx
│       ├── NumericKeypad.tsx        # Keypad fijo en móvil
│       └── PredictionsSidebar.tsx  # Sidebar de desktop (progreso, cambios pendientes, deadline)
├── services/
│   ├── cloudFunctions.ts           # Wrapper para callables (evaluateBonusPredictions)
│   ├── firestoreAdmin.ts           # resetAllData()
│   ├── firestoreMatchdays.ts
│   ├── firestoreMatches.ts
│   ├── firestorePredictions.ts     # savePredictions(), getPredictionCountsByUser()
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
Solo admins. Recibe `{ topScorer, goldenBall, mexicoPhase, champion }` y otorga 5pts por cada acierto comparando contra `bonusPredictions` de cada usuario. Marca `bonusPredictions.pointsAwarded = true` para evitar doble puntuación.

### `checkAndAwardGroupBonus` — Helper interno
Otorga +5pts al usuario (o usuarios empatados) con más predicciones exactas en la fase de grupos, cuando todos los partidos de grupos están `finished`. Protegido por `config/tournament.groupBonusAwarded` (transacción Firestore para evitar doble ejecución).

### Lógica de puntuación (`computePoints`)
| Caso | Exacto (3pts) | Resultado correcto (1pt) |
|------|--------------|--------------------------|
| Fase de grupos | home+away exactos | G/E/P correcto |
| Eliminatoria sin empate al 90' | home+away exactos | ganador correcto |
| Eliminatoria con empate al 90' | home+away + tieWinner | solo tieWinner correcto |

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
3. **Predicciones** — Solo guardar si `matchday.status === 'open'` y `Date.now() < predictionDeadline`. Lógica en `MatchdayPredictions.tsx` → `readOnly` flag.
4. **Leaderboard** — Lee la colección `users` filtrada por `onboardingCompleted === true`, ordenada por `stats.totalPoints` desc. Los puntos son escritos server-side por `onMatchUpdated`.
5. **Scoring** — Siempre server-side (Cloud Functions). El cliente solo lee `stats` y `prediction.points`. Nunca calcular puntos en el cliente.

---

## Reglas de Negocio

- Puntos se calculan **server-side** (Cloud Functions). El cliente solo lee; nunca calcula.
- `bonusPredictions.pointsAwarded` evita doble puntuación de bonus.
- Bonus editables hasta `2026-06-11T13:00:00Z` (hardcodeado en `BonusSummary.tsx`).
- Predicciones de jornada: editables hasta el `predictionDeadline` de la jornada.
- En fases eliminatorias con empate al 90', se requiere `tieWinner` (equipo que avanza).
- Zona horaria: **UTC**. "Lo que escribes es lo que ves". `toLocaleString` usa `timeZone: 'UTC'`.
- `!= null` (desigualdad débil) para chequear `null | undefined`. Usar en lugar de `!== null` cuando un valor puede ser `undefined`.

---

## Comandos Útiles

```bash
# Frontend
npm run dev              # Dev server localhost:5173
npm run build            # Build de producción (tsc + vite)
npm run emulators        # Firebase Emulators (Auth/Firestore/Storage/Functions)
npm run seed             # Seed de datos iniciales en emulador
npm run pull-from-prod   # Importa teams/matchdays/matches de producción al emulador
firebase deploy --only hosting    # Deploy frontend a producción
firebase deploy --only functions  # Deploy Cloud Functions a producción

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
- No exponer pronósticos de otros usuarios antes de que cierre la jornada.
- No modificar `firestore.rules` sin actualizar tests de reglas.
- No hacer commits con credenciales distintas al proyecto `quinielaexpertos26`.
- No agregar features no solicitadas ("gold-plating").
- No usar `firebase-functions` < v4 — las funciones son gen2 y requieren el API v2 (`firebase-functions/v2/...`).
