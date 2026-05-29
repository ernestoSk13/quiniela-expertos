# Quiniela Expertos del Mundial 2026

Web app de quiniela de fútbol para el Mundial FIFA 2026. Los usuarios predicen el resultado de cada partido (local gana / empate / visitante gana) y acumulan puntos según sus aciertos. Incluye panel de administración, ranking en tiempo real y temas visuales por país sede.

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
- **Login con Google** — acceso solo para correos autorizados por el admin (cuentas Gmail)
- **Link de invitación** — el admin genera un link personalizado por correo con TTL de 7 días; el invitado abre `/invite/:token` y llega al login con su correo pre-cargado
- **Onboarding** — 3 pasos: configurar nombre + avatar, registrar predicciones de bonus (goleador, balón de oro, fase de México, campeón), instalar como PWA
- **Dashboard** — leaderboard estilo carta FIFA con avatar y posición destacada para top 3 (medallas); historial personal por jugador; countdown al inicio del torneo; tarjeta de siguiente jornada con barra de progreso de pronósticos; acceso a jornadas anteriores; resumen de bonus editables hasta el 11 jun 2026
- **Pronósticos** — selector de resultado por partido: **LOCAL · EMPATE · VISITANTE**; tres botones tipo pill, el activo lleva color de acento; en fases eliminatorias con empate aparece inline la pregunta `¿Quién pasa?`; barra de progreso (n/m partidos predichos); bloqueo automático por partido en cuanto inicia (`scheduledAt`)
- **Historial personal** — al tocar cualquier fila del leaderboard: card de avatar, stats del jugador (puntos, aciertos, % de aciertos), gráfica de evolución de puntos con área degradada y desglose de pronósticos por jornada; accordion por jornada con resultado real, pronóstico y puntos
- **Ver predicciones post-jornada** — cuando una jornada cierra, toggle "Ver todos" muestra qué resultado pronosticó cada jugador partido a partido (LOCAL/EMPATE/VISITANTE) con indicador de puntos obtenidos
- **Premios de jornada** — slideshow animado con 6 categorías (El Sabio 🧠, El Certero 🎯, El Enrachado 🔥, El Inalcanzable ⭐, El Sotanero 😅, El MVP 🏆) más una slide personal "Tu jornada" al final; aparece en el Dashboard cuando la jornada está calificada
- **Compartir resumen de premios** — imagen PNG con los 6 premios de la jornada, compartible vía Web Share API en móvil o descarga directa en desktop
- **Compartir como imagen** — botones para generar PNG del resumen de una jornada cerrada y de la tabla general; usa Web Share API en móvil o descarga directa en desktop
- **Temas por país sede** — México 🇲🇽, Canadá 🇨🇦, EUA 🇺🇸 — fondo, header, tarjetas y acentos cambian con la paleta FIFA WC 2026
- **Preferencias** — cambiar tema, instalar PWA, activar notificaciones push, gestionar cuenta; accesible como tab en móvil (sin perder contexto)

### Para administradores
- **Gestión de jornadas** — crear, editar, cambiar estado (upcoming/open/closed/finished), modificar deadline de pronósticos
- **Ingreso de resultados** — marcador por partido; en fases eliminatorias: especificar equipo ganador
- **Gestión de jugadores** — editar nombre, avatar y rol; monitoreo de onboarding y conteo de pronósticos por jugador
- **Evaluación de bonus** — ingresar resultados finales del torneo para otorgar puntos bonus automáticamente
- **Gestión de acceso** — agregar/eliminar correos permitidos; generar link de invitación por correo con TTL de 7 días
- **Tabla general (`/admin/tabla`)** — vista completa del leaderboard con historial de cualquier jugador y botón para descargar la tabla como PNG en formato móvil
- **Configuración de puntos (`/admin/config`)** — editar todos los valores de scoring desde la UI; cambios aplican a calificaciones futuras (no recalifica predicciones puntuadas previamente)
- **Calcular premios de jornada** — botón en `/admin/jornada/:id` (jornadas cerradas/finalizadas) que ejecuta la CF `computeMatchdayAwards`; muestra badge con fecha de último cálculo
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
- El usuario predice el **resultado** de cada partido: local gana / empate / visitante gana
- Se pueden editar hasta el `predictionDeadline` de la jornada **o** hasta que el partido inicie (`scheduledAt`), lo que ocurra primero
- Una vez que una jornada cierra (`status: closed` o `finished`), los pronósticos de todos los jugadores se revelan
- En fases eliminatorias: si el usuario predice empate, debe indicar además qué equipo avanza (`tieWinner`)

### Sistema de Puntos

#### Pronósticos por partido

| Caso | Puntos |
|------|--------|
| Resultado correcto (local/empate/visitante) | **3 pts** |
| Resultado correcto + `tieWinner` correcto (eliminatoria con empate al 90') | **3 + 1 pts** |
| Solo `tieWinner` correcto en eliminatoria con empate | **1 pt** |
| Pronóstico incorrecto | **0 pts** |

> El admin sigue ingresando el marcador real (ej. `2-1`). El sistema deriva el resultado automáticamente para comparar con el pronóstico del usuario.

#### Bonus

| Bonus | Puntos |
|-------|--------|
| Predicción de bonus acertada (×4) | **5 pts c/u** |
| Más predicciones correctas en fase de grupos (puede haber empate) | **+5 pts** |

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
| `stats.correctPredictions` | `number` | Predicciones con resultado correcto |
| `stats.totalPredictions` | `number` | Incrementado al guardar pronósticos |
| `currentStreak` | `number` | Jornadas consecutivas activas con ≥1 acierto |
| `maxStreak` | `number` | Racha máxima histórica |

### `matchdays/{matchdayId}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `name` | `string` | Ej. "Jornada 1 — Fase de Grupos" |
| `phase` | `string` | `group_stage` · `round_of_32` · `round_of_16` · `quarterfinals` · `semifinals` · `third_place` · `final` |
| `order` | `number` | Para ordenar |
| `predictionDeadline` | `Timestamp` | Límite para pronósticos |
| `status` | `'upcoming' \| 'open' \| 'closed' \| 'finished'` | |
| `awards` | `MatchdayAwards \| undefined` | Calculado por admin vía CF `computeMatchdayAwards` |

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
| `result` | `'home' \| 'draw' \| 'away' \| null` | Resultado pronosticado por el usuario |
| `tieWinner` | `string \| null` | Código ISO del equipo; solo eliminatorias con `result === 'draw'` |
| `submittedAt` / `updatedAt` | `Timestamp` | |
| `points` | `number \| null` | `null` hasta que Cloud Functions calcule |
| `isCorrect` | `boolean \| null` | `true` si `result` coincide con el resultado real |

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

### `config/scoring`
Valores de puntos configurables desde `/admin/config`. Las Cloud Functions leen este doc antes de cada calificación; si no existe usan `DEFAULT_SCORING`.

| Campo | Default | Notas |
|-------|---------|-------|
| `correctPrediction` | `3` | Resultado correcto (local/empate/visitante) |
| `correctTieWinner` | `1` | Bonus por `tieWinner` correcto en eliminatoria con empate al 90' |
| `groupBonus` | `5` | Bonus al jugador con más aciertos en fase de grupos |
| `bonusPrediction` | `5` | Cada acierto de bonus prediction |

### `invites/{token}`
Documentos creados por el admin para invitar jugadores. Solo se leen vía Cloud Function `getInvite`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `email` | `string` | Correo del invitado |
| `createdAt` | `Timestamp` | |
| `expiresAt` | `Timestamp` | TTL 7 días desde creación |

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
