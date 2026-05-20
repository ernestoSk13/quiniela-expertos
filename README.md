# Quiniela Expertos del Mundial 2026

Web app de quiniela de fútbol para el Mundial FIFA 2026. Los usuarios envían pronósticos por jornada y acumulan puntos según sus aciertos. Incluye panel de administración, ranking en tiempo real y temas visuales por país sede.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 |
| Estilos | Tailwind CSS v4 + CSS custom properties |
| Auth | Firebase Authentication (email/contraseña + Google) |
| Base de datos | Cloud Firestore (tiempo real) |
| Storage | Firebase Storage (avatares) |
| Hosting | Firebase Hosting |
| Scoring | Cloud Functions gen2 (Node.js 22) |
| Project ID | `quinielaexpertos26` |

---

## Funcionalidades Implementadas

### Para jugadores
- **Login** — correo/contraseña o Google; acceso solo para correos autorizados por el admin
- **Onboarding** — configurar nombre, subir avatar y registrar predicciones de bonus (goleador, balón de oro, fase de México, campeón)
- **Dashboard** — tabla de posiciones en tiempo real, tarjeta de siguiente jornada, resumen de bonus editables hasta el 11 jun 2026
- **Pronósticos** — keypad numérico en móvil, inputs directos + sidebar de progreso en desktop; soporte de fase eliminatoria con selección de equipo que avanza en caso de empate
- **Temas por país sede** — México 🇲🇽, Canadá 🇨🇦, EUA 🇺🇸 — fondo, header, tarjetas y acentos cambian con la paleta FIFA WC 2026

### Para administradores
- **Gestión de jornadas** — crear, editar, cambiar estado (upcoming/open/closed/finished), modificar deadline de pronósticos
- **Ingreso de resultados** — marcador por partido; en fases eliminatorias: especificar equipo ganador
- **Gestión de jugadores** — editar nombre, avatar y rol; monitoreo de onboarding y conteo de pronósticos por jugador
- **Evaluación de bonus** — ingresar resultados finales del torneo para otorgar puntos bonus automáticamente
- **Gestión de acceso** — agregar/eliminar correos permitidos
- **Restaurar datos** — reset completo de puntos, pronósticos, resultados y onboarding (preserva admins)

---

## Reglas del Juego

### Acceso
Solo pueden iniciar sesión usuarios cuyo correo fue registrado previamente por el administrador (colección `allowedUsers`).

### Onboarding
Al iniciar sesión por primera vez el usuario configura:
1. **Nombre** — cómo aparece en la tabla general
2. **Avatar** — foto de perfil (o se asigna automáticamente desde Storage)
3. **Bonus predictions** — cuatro preguntas previas al torneo con valor de 5 pts cada una

### Pronósticos por Jornada
- El usuario predice el marcador exacto de cada partido
- Se pueden editar hasta el `predictionDeadline` de la jornada
- En fases eliminatorias con empate al 90', se debe indicar qué equipo avanza (`tieWinner`)

### Sistema de Puntos

#### Pronósticos por partido

| Caso | Puntos |
|------|--------|
| Marcador exacto (fase de grupos o eliminatoria sin empate) | **3 pts** |
| Resultado correcto G/E/P (fase de grupos) | **1 pt** |
| Ganador correcto (eliminatoria sin empate al 90') | **1 pt** |
| Marcador exacto **+** tieWinner correcto (eliminatoria con empate al 90') | **3 pts** |
| Solo tieWinner correcto (eliminatoria con empate al 90') | **1 pt** |
| Pronóstico incorrecto | **0 pts** |

#### Bonus

| Bonus | Puntos |
|-------|--------|
| Predicción de bonus acertada (×4) | **5 pts c/u** |
| Más predicciones exactas en fase de grupos (puede haber empate) | **+5 pts** |

> Los puntos se calculan automáticamente server-side (Cloud Functions `onMatchUpdated`) al ingresar resultados. El cliente solo lee.

---

## Modelos de Firestore

### `users/{userId}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `uid` | `string` | Firebase Auth UID |
| `email` | `string` | |
| `displayName` | `string` | Nombre en rankings |
| `avatarUrl` | `string` | URL de Storage |
| `onboardingCompleted` | `boolean` | |
| `role` | `'player' \| 'admin'` | |
| `theme` | `'mexico' \| 'canada' \| 'usa'` | Tema visual elegido |
| `createdAt` | `Timestamp` | |
| `bonusPredictions.topScorer` | `string` | |
| `bonusPredictions.goldenBall` | `string` | |
| `bonusPredictions.mexicoPhase` | `string` | Valor del select: `grupos`, `ronda32`, `octavos`, etc. |
| `bonusPredictions.champion` | `string` | Código ISO del equipo |
| `bonusPredictions.pointsAwarded` | `boolean` | Evita doble puntuación |
| `stats.totalPoints` | `number` | Actualizado por Cloud Functions |
| `stats.exactPredictions` | `number` | |
| `stats.correctPredictions` | `number` | |
| `stats.totalPredictions` | `number` | Incrementado al guardar pronósticos |

### `matchdays/{matchdayId}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `name` | `string` | Ej. "Jornada 1 — Fase de Grupos" |
| `phase` | `string` | `group_stage` · `round_of_32` · `round_of_16` · `quarterfinals` · `semifinals` · `third_place` · `final` |
| `order` | `number` | Para ordenar |
| `predictionDeadline` | `Timestamp` | Límite para pronósticos |
| `status` | `'upcoming' \| 'open' \| 'closed' \| 'finished'` | |

### `matches/{matchId}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `matchdayId` | `string` | |
| `homeTeam` / `awayTeam` | `string` | Nombre completo |
| `homeTeamCode` / `awayTeamCode` | `string` | Código ISO (ej. `MEX`) |
| `scheduledAt` | `Timestamp` | Fecha/hora en UTC |
| `phase` | `string` | |
| `status` | `'upcoming' \| 'live' \| 'finished'` | |
| `homeScore` / `awayScore` | `number \| null` | Marcador al 90' |
| `winner` | `string \| null` | Código ISO; solo eliminatorias con empate al 90' |

### `predictions/{userId}_{matchId}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `userId` / `matchId` / `matchdayId` | `string` | |
| `homeScore` / `awayScore` | `number` | Marcador pronosticado |
| `tieWinner` | `string \| null` | Solo fases eliminatorias |
| `submittedAt` / `updatedAt` | `Timestamp` | |
| `points` | `number \| null` | `null` hasta que Cloud Functions calcule |
| `isExact` / `isCorrectResult` | `boolean \| null` | |

### `teams/{teamCode}`

| Campo | Tipo |
|-------|------|
| `id` | `string` (código ISO) |
| `name` | `string` |
| `flag` | `string` (emoji) |
| `group` | `string \| null` |

### `allowedUsers/{email}`
Documento vacío — su existencia indica que el correo tiene acceso.

### `config/tournament`
| Campo | Tipo | Notas |
|-------|------|-------|
| `groupBonusAwarded` | `boolean` | Guard para el bonus de fase de grupos; escrito por Cloud Functions |

---

## Sistema de Temas

Los temas usan la **paleta oficial FIFA WC 2026**. Cada tema define CSS custom properties que cambian el fondo, header, tarjetas y colores de acento en toda la app.

| Tema | Acento | Fondo base | Nav/Header |
|------|--------|-----------|-----------|
| 🇲🇽 México | `#00C853` | `#010a04` | `#051510` |
| 🇨🇦 Canadá | `#E51414` | `#0a0101` | `#180404` |
| 🇺🇸 EUA | `#2535F0` | `#01020c` | `#040618` |

Para agregar un nuevo tema: `/add-theme` en Claude Code.

---

## Setup Local

Ver `DEV.md` para instrucciones completas de desarrollo local con emuladores.

```bash
npm install
cd functions && npm install && cd ..
npm run emulators   # Terminal 1
npm run dev         # Terminal 2
```

Requiere Node.js 18+.

---

## Deploy

```bash
# Asegurarse de apuntar a producción
echo "VITE_USE_EMULATORS=false" > .env.local

# Build y deploy del frontend
npm run build
firebase deploy --only hosting

# Deploy de Cloud Functions (requiere plan Blaze)
cd functions && npm run build && cd ..
firebase deploy --only functions
```
