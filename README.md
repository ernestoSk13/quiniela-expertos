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
- **Onboarding** — 4 pasos: (1) configurar nombre + **avatar rectangular** con opción de cámara o galería, (2) demo interactivo de pronósticos (partido ficticio MEX vs USA), (3) registrar predicciones de bonus, (4) guardar acceso directo (bookmark) en el dispositivo
- **Dashboard** — leaderboard estilo carta FIFA con avatar y posición destacada para top 3 (medallas); historial personal por jugador; countdown al inicio del torneo; tarjeta de siguiente jornada con lista de próximos partidos del día más cercano (agrupados por hora de cierre, bandera + nombre completo) y barra de progreso de pronósticos; acceso a jornadas anteriores; resumen de bonus editables hasta el 11 jun 2026
- **Pronósticos** — selector de resultado por partido: **LOCAL · EMPATE · VISITANTE**; tres botones tipo pill, el activo lleva color de acento; en fases eliminatorias con empate aparece inline la pregunta `¿Quién pasa?`; barra de progreso (n/m partidos predichos); bloqueo automático por partido **10 minutos antes** de que inicie, enforced en Firestore rules (inmune a manipulación del reloj)
- **Historial personal** — al tocar cualquier fila del leaderboard: card de avatar, stats del jugador (puntos, aciertos, % de aciertos), gráfica de evolución de puntos con área degradada y desglose de pronósticos por jornada; accordion por jornada con resultado real, pronóstico y puntos
- **Ver predicciones post-jornada** — cuando una jornada cierra, toggle "Ver todos" muestra qué resultado pronosticó cada jugador partido a partido (LOCAL/EMPATE/VISITANTE) con indicador de puntos obtenidos
- **Premios de jornada** — slideshow animado con 6 categorías (El Sabio 🧠, El Certero 🎯, El Enrachado 🔥, El Inalcanzable ⭐, El Sotanero 😅, El MVP 🏆) más una slide personal "Tu jornada" al final; aparece en el Dashboard cuando la jornada está calificada
- **Compartir resumen de premios** — imagen PNG con los 6 premios de la jornada, compartible vía Web Share API en móvil o descarga directa en desktop
- **Compartir como imagen** — botones para generar PNG del resumen de una jornada cerrada y de la tabla general; usa Web Share API en móvil o descarga directa en desktop
- **Temas por país** — 14 temas disponibles: 🇲🇽 🇨🇦 🇺🇸 🇩🇪 🇫🇷 🇦🇷 🇪🇸 🇧🇪 🇨🇮 🇧🇷 🇵🇹 🇳🇱 🇯🇵 🏴󠁧󠁢󠁥󠁮󠁧󠁿. Cada tema usa colores multi-bandera en los blobs del fondo para mayor distinción visual. Selector compacto tipo dropdown en el header (un solo botón con la bandera activa).
- **Zona horaria personalizada** — los deadlines y horarios de partidos se muestran en la zona del jugador (CDMX / Tijuana-LA / Cancún / auto-detect desde el navegador); configurable en Preferencias
- **Preferencias** — editar nombre y foto de perfil (Cámara/Galería); cambiar tema (dropdown), zona horaria, instalar PWA, activar notificaciones push, gestionar cuenta; accesible como tab en móvil (sin perder contexto)

### Para administradores
- **Navegación** — sidebar vertical fija en desktop (224px) con secciones GESTIÓN / REPORTES / CONFIG; tab bar en móvil; botón **"← Ver como jugador"** para cambiar entre vista admin y dashboard sin cerrar sesión
- **Generador de tarjetas Panini (`/admin/premios`)** — crear tarjeta coleccionable 340×480px para reconocer a un jugador; formulario con selector de jugador, título, checkboxes de puntos/posición, 6 acentos de color; preview en tiempo real; exporta PNG (descarga o Web Share API)
- **Gestión de jornadas** — crear, editar, cambiar estado (upcoming/open/closed/finished), modificar deadline de pronósticos
- **Ingreso de resultados** — marcador por partido; en fases eliminatorias: especificar equipo ganador
- **Gestión de jugadores** — editar nombre, avatar y rol (`player` / `admin` / `observer`); monitoreo de onboarding y conteo de pronósticos por jugador
- **Evaluación de bonus** — ingresar resultados finales del torneo para otorgar puntos bonus automáticamente
- **Gestión de acceso** — agregar/eliminar correos permitidos; generar link de invitación por correo con TTL de 7 días
- **Tabla general (`/admin/tabla`)** — vista completa del leaderboard con historial de cualquier jugador y botón para descargar la tabla como PNG en formato móvil
- **Configuración de puntos (`/admin/config`)** — editar todos los valores de scoring desde la UI; cambios aplican a calificaciones futuras (no recalifica predicciones puntuadas previamente)
- **Calcular premios de jornada** — botón en `/admin/jornada/:id` (jornadas cerradas/finalizadas) que ejecuta la CF `computeMatchdayAwards`; muestra badge con fecha de último cálculo
- **Restaurar datos** — reset completo de puntos, pronósticos, resultados y onboarding (preserva admins)

---

## Reglas del Juego

### Acceso
Solo pueden iniciar sesión usuarios cuyo correo fue registrado previamente por el administrador (colección `allowedUsers`). Los roles disponibles son `player` (participa en pronósticos y tabla), `admin` (gestiona el torneo) y `observer` (acceso de lectura, no aparece en tabla ni puede hacer pronósticos).

### Onboarding
Al iniciar sesión por primera vez el usuario configura:
1. **Nombre** — cómo aparece en la tabla general
2. **Avatar** — foto de perfil (o se asigna automáticamente desde Storage)
3. **Bonus predictions** — cuatro preguntas previas al torneo con valor de 5 pts cada una

### Pronósticos por Jornada
- El usuario predice el **resultado** de cada partido: local gana / empate / visitante gana
- Se pueden editar hasta el `predictionDeadline` de la jornada **o** hasta **10 minutos antes** de que el partido inicie (`scheduledAt - 10 min`), lo que ocurra primero
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
| `theme` | `ThemeId` | Tema visual elegido (14 opciones) |
| `timezone` | `string \| undefined` | IANA timezone string; ausente = auto-detect del navegador |
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

14 temas disponibles, cada uno con la **paleta de colores de su bandera** aplicada en los blobs del fondo para máxima distinción visual. El selector está en el header como dropdown compacto (`[bandera] Tema ▼`).

| # | Tema | Acento principal |
|---|------|-----------------|
| 1 | 🇲🇽 México | `#00C853` verde |
| 2 | 🇨🇦 Canadá | `#E51414` rojo |
| 3 | 🇺🇸 EUA | `#2535F0` azul |
| 4 | 🇩🇪 Alemania | `#DD0000` rojo |
| 5 | 🇫🇷 Francia | `#002395` azul |
| 6 | 🇦🇷 Argentina | `#74ACDF` celeste |
| 7 | 🇪🇸 España | `#AA151B` rojo |
| 8 | 🇧🇪 Bélgica | `#EF3340` rojo |
| 9 | 🇨🇮 Costa de Marfil | `#F77F00` naranja |
| 10 | 🇧🇷 Brasil | `#009C3B` verde |
| 11 | 🇵🇹 Portugal | `#C8102E` rojo |
| 12 | 🇳🇱 Países Bajos | `#FF6C00` naranja |
| 13 | 🇯🇵 Japón | `#BC002D` carmesí |
| 14 | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra | `#CF142B` rojo |

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
