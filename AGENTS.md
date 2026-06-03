# AGENTS.md — Guía para Agentes de IA

Instrucciones para contribuir a **Quiniela Expertos del Mundial 2026** como agente de IA.

## Contexto del Proyecto

App de quiniela de fútbol para el Mundial 2026. Los usuarios predicen el **resultado** de cada partido (LOCAL / EMPATE / VISITANTE) y acumulan puntos según sus aciertos. Stack: **React 19 + TypeScript + Vite 6** + **Firebase** (Auth, Firestore, Storage, Hosting, Cloud Functions gen2) + **Tailwind CSS v4**.

Lee el `README.md` completo para entender las reglas del negocio y los modelos de datos antes de hacer cambios.

---

## Estado Actual (Junio 2026)

- [x] Firebase configurado (Auth, Firestore, Storage, Hosting, Cloud Functions gen2)
- [x] Autenticación — email/contraseña + Google, lista de correos permitidos
- [x] Onboarding — display name, avatar, bonus predictions (3 pasos: perfil, bonus, instalar PWA); rediseñado con estética "Tournament Registration"
- [x] Dashboard — tabla de posiciones en tiempo real, siguiente jornada, sección de bonus, countdown al torneo, jornadas anteriores; tab bar en móvil con 4 pestañas (pronósticos / tabla / historial / preferencias)
- [x] Pronósticos — selector LOCAL/EMPATE/VISITANTE por partido con auto-save (debounce 400ms); bloqueo por `scheduledAt` individual además del deadline de jornada; componente `ResultPicker.tsx` reutilizable
- [x] Panel de Admin — jornadas, resultados, jugadores, bonus, acceso; tabla general (`/admin/tabla`); configuración de puntos (`/admin/config`); nav desktop con 6 ítems, tab bar móvil con 4
- [x] Temas por país — México / Canadá / EUA (paleta FIFA WC 2026), skill `/add-theme` para agregar nuevos
- [x] Cloud Functions gen2 — `onMatchUpdated` (scoring por resultado: 3pts acierto + 1pt tieWinner bonus), `evaluateBonusPredictions`, `getInvite`, `sendDeadlineReminders`, `notifyResultsPublished`, `sendMassNotification`
- [x] Historial por jugador — `PlayerHistoryModal`: bottom-sheet/modal con card avatar rectangular, badge de posición, stat bar Bebas Neue, gráfica SVG con área de relleno, acordeón por jornada con PredRow detallado
- [x] Post-jornada — toggle "Ver todos" en jornadas cerradas/finalizadas muestra predicciones de todos los jugadores partido a partido con badges de puntos
- [x] Puntos configurables — `config/scoring` en Firestore; admin edita desde `/admin/config`; Cloud Functions leen config con fallback a `DEFAULT_SCORING`
- [x] Link de invitación — admin genera token por correo desde `/admin/usuarios`; invitado abre `/invite/:token` y llega al login con correo pre-cargado
- [x] Compartir como imagen — `useShareImage` (html2canvas + Web Share API con `forceDownload` opcional); `LeaderboardShareCard` (botón "Compartir mi posición" comentado temporalmente), `JornadaShareCard` post-jornada, `LeaderboardPNGCard` en `/admin/tabla`
- [x] Leaderboard estilo carta FIFA — componente `LeaderboardRow` compartido entre dashboard, admin y PNG card; filas alternadas con fondo transparente del acento del tema
- [x] `Preferences.tsx` rediseñado — header Bebas Neue, theme cards con glow, toggle premium, account con iconos SVG; **pendiente de deploy junto con el fix de mobile tab**
- [x] Modo resultado simple (Fase 14A-C) — predicciones de resultado LOCAL/EMPATE/VISITANTE; auto-save con debounce 400ms; `ResultPicker.tsx` extraído
- [x] Rol `observer` — acceso sin participar en tabla ni pronósticos; bloqueado a nivel de Firestore rules
- [x] Admin sidebar vertical — sidebar 224px con secciones GESTIÓN/REPORTES/CONFIG; Restaurar con 2 pasos; mobile tab bar sin cambios
- [x] ScoringConfig simplificada (14E) — eliminados `exactScore`/`exactKnockoutWithTie`; banner "Modo resultado simple" en `/admin/config`
- [x] 14 temas de países con colores multi-bandera en blobs; selector compacto dropdown en header; `ThemeContext` limpia todas las clases al cambiar
- [x] Zona horaria personalizada — `user.timezone`, hook `useUserTimezone`, selector en Preferencias; admin también muestra horas locales
- [x] Script `fix-timestamps` — corrige timestamps ingresados como hora local (offset configurable)
- [x] Admin/jugador switch — botón en sidebar y header mobile para cambiar entre vistas sin re-login
- [x] `/admin/premios` — tarjeta Panini 340×480px; 6 acentos; preview en tiempo real; exporta PNG
- [x] Onboarding mejorado — paso 2 demo interactivo, avatar rectangular portrait 96×128, botones Cámara/Galería, paso "Guardar acceso" (bookmark)
- [x] ~~Fase 13~~ — **Cancelada**
- [ ] **PENDIENTE**: Modo claro (T8) — rama `feat/T8-light-mode`, pausado por diseño

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

### Sistema de diseño — Bebas Neue
- La fuente **Bebas Neue** está cargada globalmente vía `@import url(...)` en `src/index.css`.
- Se usa para: títulos de header, marcadores de partidos, nombres en modales, estadísticas destacadas.
- En los componentes también se puede cargar vía `<style>{ \`@import url(...)\` }</style>` (necesario si el componente se captura con html2canvas fuera del DOM principal).
- Stack de fuente recomendado: `'Bebas Neue', Impact, 'Arial Narrow', sans-serif`

### html2canvas — Colores en cards off-screen
- Los componentes usados como "off-screen card" para html2canvas (ej. `LeaderboardShareCard`, `LeaderboardPNGCard`, `JornadaShareCard`) deben usar **colores hardcodeados**, no `var(--accent)` ni otras CSS custom properties.
- html2canvas no resuelve variables CSS del contexto del DOM en elementos con `position: absolute; left: -9999px`.
- Cada componente de este tipo define su propio `COLORS` record con valores literales por tema.
- Usar `crossOrigin="anonymous"` en `<img>` para avatares de Firebase Storage (CORS configurado en el bucket).

### TypeScript — noUnusedLocals
- El proyecto tiene `"noUnusedLocals": true` en `tsconfig.json`. Variables declaradas y nunca leídas causan error TS6133.
- Si se comenta un bloque de JSX que deja estado/funciones sin usar, eliminar o comentar también las declaraciones correspondientes.

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
│   ├── LeaderboardRow.tsx           # Fila estilo carta FIFA (avatar + nombre + pts); compartida dashboard/admin/PNG
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
│   ├── useShareImage.ts             # html2canvas → Web Share API o descarga (`forceDownload`)
│   ├── useTeams.ts
│   └── useUserTimezone.ts           # Lee user.timezone o fallback a Intl.DateTimeFormat browser
├── lib/
│   ├── firebase.ts                  # Configuración Firebase + emuladores
│   └── themes.ts                    # THEMES array + themeClassName()
├── pages/
│   ├── Admin/
│   │   ├── AdminLayout.tsx          # Sidebar 224px desktop (GESTIÓN/REPORTES/CONFIG) + MOBILE_NAV + switch admin↔jugador
│   │   ├── AdminLeaderboard.tsx     # /admin/tabla — reutiliza LeaderboardTable + PlayerHistoryModal + LeaderboardPNGCard
│   │   ├── AdminPremios.tsx         # /admin/premios — generador tarjeta Panini (formulario + preview + PNG export)
│   │   ├── AllowedUsers.tsx         # + botón "Invitar" que genera token y copia link
│   │   ├── BonusEvaluation.tsx      # Evalúa bonus predictions via Cloud Function
│   │   ├── LeaderboardPNGCard.tsx   # Botón "Compartir tabla" → PNG full table (420px, alto adaptativo, descarga forzada)
│   │   ├── MatchdayDetail.tsx
│   │   ├── MatchdayList.tsx
│   │   ├── PaniniCard.tsx           # Tarjeta 340×480px con gradiente de acento; 6 colores; compatible con html2canvas
│   │   ├── ScoringConfig.tsx        # /admin/config — formulario simplificado (modo resultado simple, 4 campos)
│   │   └── UserProfiles.tsx         # Lista jugadores con conteo de pronósticos y estado onboarding
│   ├── Dashboard/
│   │   ├── BonusSummary.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LeaderboardShareCard.tsx # Botón "Compartir mi posición" → PNG con LeaderboardRow del usuario
│   │   ├── LeaderboardTable.tsx     # Lista de LeaderboardRow con onClick → PlayerHistoryModal
│   │   ├── PlayerHistoryModal.tsx   # Bottom-sheet/modal con historial y gráfica SVG
│   │   └── TournamentCountdown.tsx  # Countdown al 2026-06-11T13:00:00Z (se oculta al iniciar)
│   ├── Invite/
│   │   └── InvitePage.tsx           # /invite/:token — pública; llama getInvite, muestra bienvenida
│   ├── Login/Login.tsx              # Lee ?email= query param para pre-llenar desde link de invitación
│   ├── Onboarding/
│   │   ├── Onboarding.tsx           # 4 pasos: Perfil(1) → Demo(2) → Bonus(3) → Acceso(4)
│   │   ├── StepBonus.tsx
│   │   ├── StepDemo.tsx             # Paso 2: partido ficticio MEX vs USA + reveal de puntos
│   │   ├── StepInstall.tsx          # Paso 4: instrucciones de bookmark por plataforma (iOS/Android/Desktop)
│   │   └── StepProfile.tsx          # Avatar rectangular 96×128px; botones Cámara (capture=user) y Galería
│   ├── Preferences/
│   │   └── Preferences.tsx          # /preferencias — acceso desde gear icon desktop; en móvil se renderiza inline como tab en Dashboard
│   └── Predictions/
│       ├── JornadaShareCard.tsx     # Botón "Compartir" en post-jornada → PNG con resumen de pronósticos
│       ├── MatchdayPredictions.tsx  # Selector LOCAL/EMPATE/VISITANTE con auto-save debounce 400ms
│       ├── PostMatchdayView.tsx     # Vista post-jornada: predicciones de todos × partido
│       └── ResultPicker.tsx        # Selector reutilizable de resultado (home/draw/away)
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

- **Score nuevo** (`!wasFinished && isFinished`): deriva el resultado del marcador (`home`/`draw`/`away`), compara contra `prediction.result`, escribe `points` e `isCorrect` en cada predicción, incrementa `stats.totalPoints` y `stats.correctPredictions` del usuario. Si es `group_stage`, llama a `checkAndAwardGroupBonus()`.
- **Corrección de score** (ambos `finished` con scores distintos): recalcula y aplica el delta de puntos.
- **Revert** (`wasFinished && !isFinished`): borra puntos de predicciones y los resta de stats.

### `evaluateBonusPredictions` — Callable HTTP
Solo admins. Recibe `{ topScorer, goldenBall, mexicoPhase, champion }` y otorga puntos por cada acierto comparando contra `bonusPredictions` de cada usuario. Puntos por acierto = `cfg.bonusPrediction` (default 5). Marca `bonusPredictions.pointsAwarded = true` para evitar doble puntuación.

### `getInvite` — Callable HTTP (sin auth)
Recibe `{ token }`. Lee `invites/{token}` via Admin SDK (bypassa rules). Valida que no haya expirado. Devuelve `{ email }`. No requiere autenticación — el invitado aún no tiene cuenta.

### `checkAndAwardGroupBonus` — Helper interno
Otorga `cfg.groupBonus` pts (default 5) al usuario (o usuarios empatados) con más predicciones exactas en la fase de grupos, cuando todos los partidos de grupos están `finished`. Protegido por `config/tournament.groupBonusAwarded` (transacción Firestore para evitar doble ejecución).

### `checkAndAwardGroupBonus` — Helper interno
Otorga `cfg.groupBonus` pts (default 5) al usuario con más aciertos (`isCorrect === true`) en la fase de grupos, cuando todos los partidos de grupos están `finished`. Transacción Firestore para evitar doble ejecución (`config/tournament.groupBonusAwarded`).

### Lógica de puntuación (`computePoints`)
Los valores se leen de `config/scoring`. Si no existe el documento se usa `DEFAULT_SCORING`.

| Campo | Default | Descripción |
|-------|---------|-------------|
| `correctPrediction` | 3 | Resultado correcto (LOCAL/EMPATE/VISITANTE) |
| `correctTieWinner` | 1 | Bonus por tieWinner correcto en eliminatoria con empate al 90' |
| `groupBonus` | 5 | Bonus al jugador con más aciertos en fase de grupos |
| `bonusPrediction` | 5 | Cada acierto de bonus prediction |

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

## Flujo de Deploy

**Antes de hacer `firebase deploy` y `git commit`, siempre pausar y pedir al desarrollador que pruebe en local.**

### 1. Avisar qué se hizo

Describe brevemente los cambios realizados:
- Qué archivos se modificaron y por qué
- Qué comportamiento cambió (antes → después)
- Si hay algo que el desarrollador deba verificar específicamente

### 2. Dar instrucciones de prueba local

Proporcionar los pasos exactos según el tipo de cambio:

```bash
# Iniciar dev server (si no está corriendo)
npm run dev
# Abrir http://localhost:5173 en el navegador
```

Indicar qué flujo recorrer:
- **UI / visual**: qué pantalla abrir, qué interacciones hacer, qué debe verse
- **Lógica de auth / rutas**: qué usuario usar, qué ruta visitar
- **Funcionalidad con Firestore**: si se necesita el emulador → `npm run emulators` + `npm run seed`
- **Cloud Functions**: hacer deploy de funciones por separado y probar el trigger

### 3. Esperar confirmación

No ejecutar `firebase deploy` ni `git commit` hasta que el desarrollador confirme que la prueba fue exitosa. Si hay algo que corregir, hacerlo antes de continuar.

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
- No usar `var(--accent)` ni CSS variables en cards off-screen para html2canvas — usar colores hardcodeados del `COLORS` record.
- No restaurar el botón "Compartir mi posición" en `LeaderboardShareCard.tsx` sin confirmación explícita del desarrollador — fue comentado intencionalmente.
- En móvil, el tab de Preferencias debe renderizarse **inline en Dashboard** (no navegar a `/preferencias`); la ruta `/preferencias` es solo para desktop.
- **No hacer commit directo a `main`** — siempre crear rama (`feat/<fase>-<descripcion>`), hacer commits ahí y abrir PR en GitHub con descripción.

---

## Flujo de Trabajo Multi-Agente

Este proyecto usa múltiples agentes especializados de Claude Code para planear e implementar cada fase. Los agentes corren en **background** (no consumen contexto del agente principal) y se coordinan desde la conversación principal.

### Agentes disponibles

| Agente | Cuándo usarlo |
|--------|---------------|
| `chief-architect` | Al iniciar cualquier fase nueva: descompone en PRs, detecta dependencias, evalúa si algo ya está hecho |
| `prompt-token-optimizer` | En paralelo con chief-architect: estima tokens por tarea, recomienda orden y qué dejar para la próxima sesión |
| `ui-ux-reviewer` | Al planear fases con componentes visuales nuevos: revisa criterios de diseño, edge cases de UI, propone mejoras |
| `technical-writer` | Al terminar fases: actualiza README.md, DEV.md y AGENTS.md |
| `security-guardian` | Al tocar auth, rules de Firestore, variables de entorno o dependencias nuevas |
| `firebase-firestore-auditor` | Al agregar queries, índices o cambios en el modelo de datos de Firestore |

### Flujo estándar de planificación

```
1. Usuario pide iniciar Fase N
2. Lanzar en paralelo (mismo mensaje):
   - chief-architect → lee archivos relevantes, propone PRs con ramas
   - prompt-token-optimizer → estima tokens por tarea, recomienda orden
   - ui-ux-reviewer (si aplica) → revisa diseño y propone mejoras
3. Esperar notificaciones de completion (automáticas)
4. Integrar resultados → decidir qué implementar en la sesión actual
5. Implementar PR por PR en ramas separadas
6. Al terminar la fase → lanzar technical-writer para actualizar docs
```

### Convenciones de ramas y PRs

- Rama: `feat/<fase>-<descripcion-corta>` — ej. `feat/14B-result-picker`, `feat/13A-awards-types`
- Título PR: corto y descriptivo (< 70 chars) — ej. `feat(gamification): add awards slideshow (13A)`
- Descripción: bullet points de qué cambió y por qué; incluir sección de pruebas
- Merge a `main` solo después de que el desarrollador haya probado en local

### Eficiencia de tokens

- Los agentes en background consumen tokens de su propia sesión, no del contexto principal — úsalos para investigación y documentación
- Lanzar agentes siempre en **paralelo** cuando sean independientes (mismo mensaje, múltiples `Agent()` calls)
- Si quedan <30% de tokens: delegar trabajo de documentación al `technical-writer` y cerrar la sesión
- Leer archivos grandes **una sola vez** al inicio de una tarea y extraer todo lo necesario en ese read
