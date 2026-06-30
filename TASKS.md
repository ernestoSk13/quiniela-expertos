# TASKS.md — Quiniela Expertos del Mundial 2026

Tareas pendientes de implementación. Ordenadas por prioridad sugerida.

---

## T1 — Onboarding: demo interactivo de pronósticos y puntuación
**Estado:** Completada ✅ (PR #8, deploy 2026-06-02)

---

## T2 — Admin: sección "Premios" con generador de tarjeta estilo Panini
**Estado:** Completada ✅ (PR #7, deploy 2026-06-02)

---

## T3 — Admin/jugador: cambio de vista rápido en navegación
**Estado:** Completada ✅ (PR #6, deploy 2026-06-02)

---

## T4 — Soporte de zonas horarias por jugador
**Estado:** Completada ✅ (PR #10, deploy 2026-06-02)

---

## T5 — Onboarding: reemplazar paso "Instalar" por "Guardar acceso directo"
**Estado:** Completada ✅ (PR #9, deploy 2026-06-02)

---

## T6 — Rediseño de tarjeta Panini (`/admin/premios`)
**Estado:** Completada ✅ (PR #11, deploy 2026-06-02)

---

## T7 — Temas de países adicionales (14 temas en total)
**Estado:** Completada ✅ (PR #12, deploy 2026-06-02)

---

## T9 — Onboarding: avatar rectangular + opción de cámara
**Estado:** Completada ✅ (PR #14, deploy 2026-06-02)

---

## T10 — Admin: banner de jugadores pendientes de onboarding
**Estado:** Completada ✅ (PR #16, deploy 2026-06-04)

---

## T11 — Admin: banner de jugadores sin pronóstico en jornada abierta
**Estado:** Completada ✅ (PR #17, deploy 2026-06-04)

---

## T12 — Cambio de avatar desde la barra superior
**Estado:** Completada ✅ (PR #15, deploy 2026-06-04)

---

## T8 — Modo claro (light theme)
**Estado:** Pausado 🔄 (rama `feat/T8-light-mode` — requiere más trabajo de diseño)  
**Archivos afectados:** `src/index.css`, `src/pages/Preferences/Preferences.tsx`, `src/types/User.ts`, `src/services/firestoreUsers.ts`, posiblemente `src/context/ThemeContext.tsx`

Actualmente la app es 100% oscura. Agregar soporte para un modo de apariencia claro donde fondos, superficies y textos se inviertan a tonos blancos/grises claros, manteniendo el color de acento del tema del país activo.

### Estrategia

El modo claro es **ortogonal** a los temas de país — un usuario puede tener tema España (rojo) en modo claro o en modo oscuro. Son dos dimensiones independientes:
- `theme` (país) → controla los colores de acento (`--accent`, `--accent-light`, blobs, etc.)
- `colorMode` (`'dark' | 'light'`) → controla fondos, superficies y texto

### Variables CSS a sobreescribir en modo claro

```css
.light-mode {
  --bg-base:      #F5F5F7;   /* Fondo principal — gris muy claro (estilo Apple) */
  --surface-nav:  #FFFFFF;   /* Header/tab bar — blanco */
  --surface-card: #FFFFFF;   /* Tarjetas — blanco con sombra sutil */

  /* Texto */
  color-scheme: light;
}
```

Los colores de acento (`--accent`, `--accent-light`, etc.) y los blobs **no cambian** con el modo — los gestiona el tema de país.

### Cambios en componentes

La mayoría del texto usa clases Tailwind como `text-white`, `text-gray-*`, `text-gray-500`, etc. En modo claro:
- `text-white` → debe verse oscuro: usar `text-gray-900` o similar
- `text-gray-500` → ya funciona bien en ambos modos
- `border-gray-800` → debe ser `border-gray-200` en claro

**Opciones de implementación:**
1. **CSS `color-scheme` + variables** (menos invasivo): sobreescribir solo las variables de fondo/superficie y usar `color-scheme: light` para que el navegador ajuste los defaults. Puede requerir ajustes manuales en componentes que usan colores hardcodeados.
2. **Clase `.light-mode` en `<html>` + variantes Tailwind** (más control): agregar la clase al elemento `<html>` y usar selectores CSS `[class~="light-mode"] .text-white { color: #111 }` para invertir los colores de texto globalmente.

**Recomendación:** Opción 2 con un bloque CSS global en `index.css` que sobreescriba las clases de texto y borde más comunes al aplicar `.light-mode`, más los ajustes de `--surface-*` y `--bg-base`.

### Toggle en Preferencias

Agregar un selector de apariencia en la sección de Preferencias (debajo de Tema):
```
Apariencia
  [🌙 Oscuro]  [☀️ Claro]   ← dos botones tipo pill, activo resaltado
```

### Persistencia

Guardar `colorMode: 'dark' | 'light'` en el documento del usuario en Firestore (`users/{uid}`), igual que se guarda `timezone` y `theme`. Aplicar al cargar la app desde `AuthContext`/`ThemeContext`.

### Consideraciones

- Los componentes off-screen para `html2canvas` (share cards) ya usan colores hardcodeados — no se ven afectados por el modo claro.
- El panel de admin puede quedar solo en modo oscuro en una primera versión (los admins suelen ser power users que prefieren oscuro).
- Las tarjetas Panini (`PaniniCard.tsx`) usan gradientes propios — no se ven afectadas.
- Probar especialmente: tab bar móvil, header, tarjetas del leaderboard, modal de historial, vista de pronósticos.

---

## T13 — Editar nombre y avatar desde Preferencias
**Estado:** Completada ✅ (rama `feat/T13-edit-profile-preferences`, deploy pendiente)

Los jugadores podrán cambiar su nombre de usuario y su avatar directamente desde la sección de Preferencias (la misma pantalla donde cambian el tema y la zona horaria).

### Alcance

- **Nombre de usuario:** campo de texto editable con botón "Guardar". Mismo validation que en onboarding (no vacío, máximo ~30 chars).
- **Avatar:** reutilizar el flujo de T12 (Cámara / Galería) que ya existe en el header del Dashboard. No duplicar lógica — extraer el picker a un componente compartido o invocar el mismo handler desde Preferencias.

### Archivos afectados

- `src/pages/Preferences/Preferences.tsx` — agregar sección "Perfil" con campo de nombre + botón de avatar
- `src/services/firestoreUsers.ts` — ya existe `adminUpdateUser`; agregar/reutilizar función para que el jugador actualice su propio `displayName`
- `src/services/storageAvatars.ts` — reutilizar el upload que ya usa T12
- Posiblemente extraer el avatar picker de `Dashboard.tsx` a un componente `AvatarPicker.tsx` si se va a compartir

### Consideraciones

- El nombre actualizado debe reflejarse en tiempo real en el header (ya se actualiza via `onSnapshot` en `AuthContext`).
- No permitir guardar si el nombre no cambió (deshabilitar botón o no hacer el write).
- En móvil, Preferencias se renderiza inline en el Dashboard — el flujo de cámara/galería debe funcionar igual que desde el header.

---

## T14 — Deadline de pronósticos: 10 minutos antes del partido (anti-trampas)
**Estado:** Completada ✅ (rama `feat/T14-prediction-cutoff-10min`, deploy pendiente)

Actualmente el cierre de predicciones coincide con `match.scheduledAt` (inicio del partido). Cambiar el corte a **10 minutos antes** del inicio, y mover el enforcement a **Firestore security rules** para que no sea bypasseable manipulando el reloj del dispositivo.

### Por qué server-side

El check actual está en `MatchdayPredictions.tsx` comparando `Date.now()` contra `match.scheduledAt` — si el jugador cambia la hora de su computadora, puede saltarse ese bloqueo. La solución es enforcement en Firestore rules usando `request.time`, que es el timestamp del **servidor de Google**, inmune al reloj del cliente.

### Cambios en Firestore rules (`firestore.rules`)

En la rule de escritura de predicciones (`predictions/{predictionId}`), agregar la condición:

```
// Obtener el partido correspondiente
let match = get(/databases/$(database)/documents/matches/$(matchId)).data;
allow write: if isAllowedUser()
  && matchday.status == 'open'
  && request.time < match.scheduledAt - duration.seconds(600);  // 10 min antes
```

La UI puede seguir calculando y mostrando el countdown con `Date.now()` (experiencia de usuario), pero si el write llega tarde, Firestore lo rechaza con error de permisos independientemente del reloj local.

### Cambios en el cliente (`MatchdayPredictions.tsx`)

- Cambiar la condición `matchReadOnly` de `Date.now() >= match.scheduledAt` a `Date.now() >= match.scheduledAt - 10 * 60 * 1000`
- Actualizar el texto del tooltip/estado bloqueado: "Cierre 10 min antes del partido"
- El countdown en UI puede mostrar cuánto tiempo falta para el cierre (no para el inicio)

### Archivos afectados

- `firestore.rules` — condición de escritura en predicciones
- `src/pages/Predictions/MatchdayPredictions.tsx` — flag `matchReadOnly` y texto de UI
- `firestore.indexes.json` — revisar si el `get()` adicional requiere índice (normalmente no para documento único)

### Consideraciones

- El `get()` en Firestore rules consume 1 read por operación de escritura — costo bajo y aceptable.
- Probar con el emulador: crear un partido con `scheduledAt` a 5 min en el futuro y verificar que el write es rechazado.
- Si `match.scheduledAt` es un Timestamp de Firestore, la comparación con `request.time` y `duration.seconds()` funciona nativamente en rules.
- Agregar test de reglas en `firestore.rules.test` (si existe) o documentar el caso de prueba manual.

---

## T15 — Dashboard: mostrar dos recuadros de jornada simultáneos
**Estado:** Completada ✅ (PR #24, deploy 2026-06-15)

Cuando hay dos jornadas con `status === 'open'` al mismo tiempo, el dashboard debe mostrar ambas: primero el recuadro de la jornada en curso y justo debajo el de la jornada siguiente. Esto le permite al jugador adelantar sus pronósticos de la siguiente jornada sin tener que esperar a que cierre la actual.

La condición para mostrar el segundo recuadro es únicamente que la jornada esté en estado `'open'` (el admin la abre desde el panel). No se muestra si está en `'upcoming'`.

### Comportamiento esperado

- **Una sola jornada `open`** → comportamiento actual sin cambios (un recuadro).
- **Dos jornadas `open`** → dos recuadros apilados verticalmente (móvil) / en la columna derecha del sidebar (desktop):
  1. **Recuadro superior** — jornada más antigua (`order` menor), etiqueta "Jornada en curso".
  2. **Recuadro inferior** — jornada más reciente (`order` mayor), etiqueta "Próxima jornada". Misma apariencia pero con un borde o distinción visual sutil para diferenciarlas.
- Cada recuadro tiene su propia barra de progreso de pronósticos y su propio botón CTA.

### Archivos afectados

- `src/pages/Dashboard/Dashboard.tsx` — cambios principales:
  - Reemplazar `matchdays.find(md => md.status === 'open' || md.status === 'upcoming')` por `matchdays.filter(md => md.status === 'open')` para obtener hasta 2 jornadas abiertas, más la primera `'upcoming'` como fallback si no hay ninguna `'open'`.
  - Agregar un segundo conjunto de hooks (`useMatchesByMatchday`, `useMatchdayProgress`) para la segunda jornada abierta. Los hooks deben llamarse siempre (no condicionalmente) para cumplir las reglas de React hooks — pasar `''` como `matchdayId` cuando no hay segunda jornada.
  - Convertir `nextMatchdayCard` de un JSX element a una función `renderMatchdayCard(matchday, matches, filled, total, label)` para reutilizarla con cada jornada.
  - En móvil: apilar los dos recuadros verticalmente dentro del `space-y-4`.
  - En desktop: apilar los dos recuadros verticalmente en la columna sidebar (`space-y-4`).

### Consideraciones

- El cálculo `upcomingGroups` (partidos del día más cercano con su cierre) depende de `nextMatches` y del matchday específico — extraerlo a una función pura `computeUpcomingGroups(matches, matchday, timezone)` para poder llamarla dos veces.
- `useMatchdayProgress` retorna `{ filled, total }` — llamarlo para ambas jornadas, pasando el `uid` del usuario.
- `useMatchesByMatchday` se puede llamar con `''` sin efectos secundarios (el hook retorna `[]` si el id está vacío).
- No hay cambios en Firestore rules ni en Cloud Functions — la condición es puramente de UI basada en `matchday.status`.
- El segundo recuadro debe verse clickeable aunque muestre una jornada que el jugador aún no ha tocado (filled = 0 → botón "Hacer pronósticos").

---

## T16 — Historial de todos
**Estado:** Completada ✅ (PR #25 + fix PR #26, deploy 2026-06-15)

En el tab de Historial (móvil), agregar un selector de jugador para que cualquier participante pueda ver cómo les fue a los demás en los partidos ya jugados. Actualmente el tab solo muestra el historial propio.

### Comportamiento esperado

- Al abrir el tab "Historial" en móvil, aparece un selector horizontal de jugadores encima del contenido.
- El jugador propio aparece primero, con la etiqueta "Yo", y está seleccionado por default.
- Al tocar otro jugador, el historial (gráfica + acordeón de jornadas) se reemplaza con el del jugador seleccionado.
- Los stats de cabecera (Puntos / Aciertos / Enviados) también cambian para mostrar los del jugador seleccionado.
- En desktop esta funcionalidad ya existe: click en cualquier fila del leaderboard abre el `PlayerHistoryModal`. El mismo modal debe mostrar el historial completo también para jugadores ajenos (actualmente muestra un candado). Aprovechar este cambio para desbloquearlo.

### Implementación

**`src/pages/Dashboard/Dashboard.tsx`**

- Agregar estado `const [historyUserId, setHistoryUserId] = useState<string>(user?.uid ?? '')`, inicializado al uid del usuario activo.
- En `historySection`, añadir encima de los stats un selector horizontal scrolleable tipo pill-list con todos los jugadores del array `players` (ya disponible en el componente). El pill del jugador propio muestra "Yo"; los demás muestran su `displayName` truncado + avatar pequeño (`Avatar` component, `size="sm"`).
- Reemplazar `user.uid` en `<HistoryContent userId={user.uid} />` por `historyUserId`.
- Los stats (Puntos / Aciertos / Enviados) deben leer de `players.find(p => p.uid === historyUserId)` en lugar de `user` para que reflejen al jugador seleccionado.

**`src/pages/Dashboard/PlayerHistoryModal.tsx`**

- Eliminar la condición `isOwnProfile ? ... : <lock>` y mostrar siempre `<HistoryContent userId={player.uid} teamsMap={teamsMap} />`.
- La prop `isOwnProfile` puede mantenerse para el badge "TÚ" en el header, pero no para bloquear el contenido.

### Firestore rules

Sin cambios. La regla actual ya permite leer predicciones ajenas cuando `matchday.status in ['closed', 'finished']`:

```
allow read: if isAllowedUser() && (
  resource.data.userId == request.auth.uid ||
  isAdmin() ||
  get(...matchdays/...).data.status in ['closed', 'finished'] ||
  ...
);
```

`usePlayerHistory` usa `getUserPredictions(userId)` que hace una query collection. Firestore filtra silenciosamente los documentos que no pasan la regla, así que solo devolverá predicciones de jornadas cerradas — que es exactamente lo que el historial debe mostrar.

### Archivos afectados

- `src/pages/Dashboard/Dashboard.tsx` — estado `historyUserId`, pill-list de jugadores, stats dinámicos
- `src/pages/Dashboard/PlayerHistoryModal.tsx` — remover bloqueo de historial ajeno

### Consideraciones

- El pill-list debe ser horizontalmente scrolleable sin barra visible (`overflow-x-auto scrollbar-none`) para no ocupar demasiado espacio vertical.
- `Avatar` ya acepta `size="sm"` — usar ese tamaño en los pills.
- Cuando se cambia de jugador, `usePlayerHistory` re-ejecuta con el nuevo `userId` — la carga es automática.
- Si `players` está vacío (cargando leaderboard), mostrar solo el pill del usuario actual.
- No mostrar el pill-list si hay un solo jugador.

---

## T17 — Modo de marcador exacto para fases eliminatorias
**Estado:** Completada ✅ (PR #27, deploy 2026-06-26)

La fase de grupos está terminando. Para la fase de 16vos de final (Round of 32, del 28 de junio al 4 de julio de 2026) y el resto de la eliminatoria, los jugadores ya no solo predicen el resultado (LOCAL/EMPATE/VISITANTE) sino el **marcador exacto** (ej. 2-1). La puntuación cambia completamente.

### Nueva lógica de puntuación (`exact_score` mode)

| Condición | Puntos |
|-----------|--------|
| Marcador exacto (homeGoals y awayGoals correctos) | **5 pts** (total) |
| Resultado correcto pero marcador incorrecto | **2 pts** |
| Goles de un equipo adivinados (aunque el resultado sea incorrecto) | **1 pt** por equipo |
| Nada correcto | 0 pts |

Ejemplos:
- Predijo 2-1, marcador real 2-1 → 5 pts (marcador exacto)
- Predijo 2-1, marcador real 3-1 → 2 pts (resultado correcto: local gana) + 1 pt (goles del visitante correctos) = **3 pts**
- Predijo 2-0, marcador real 1-0 → 2 pts (resultado correcto: local gana, ningún equipo exacto)
- Predijo 1-2, marcador real 0-2 → 1 pt (goles del visitante correctos, pero resultado incorrecto)

**Nota de configuración:** Los valores de puntos de `exact_score` se agregarán a `config/scoring` en Firestore (mismos que `correctPrediction` actualmente pero con campos nuevos: `exactScore`, `correctResult`, `correctGoals`). El admin puede ajustarlos desde `/admin/config`.

### Cambios en modelo de datos

**`src/types/index.ts` / `src/types/Matchday.ts`**
```typescript
// Agregar campo en Matchday
predictionMode: 'result' | 'exact_score';  // default 'result' para jornadas existentes
```

**`src/types/index.ts` / Prediction**
```typescript
// Campos nuevos en Prediction (opcionales para compatibilidad con jornadas pasadas)
homeGoals?: number;
awayGoals?: number;
// El campo 'result' ('home'|'draw'|'away') se mantiene pero en modo exact_score
// se deriva de homeGoals/awayGoals al guardar
```

**`config/scoring` en Firestore** — agregar campos:
```
exactScore: 5        // antes llamado exactScore, ya existía pero se eliminó en 14E
correctResult: 2     // resultado correcto sin marcador exacto
correctGoals: 1      // goles de un equipo correctos
```

### Cambios en UI

**`src/pages/Predictions/ResultPicker.tsx`** — solo se usa en modo `result`

**Nuevo componente: `src/pages/Predictions/ScorePicker.tsx`**
- Dos inputs numéricos (homeGoals | awayGoals) con botones +/- para cambiar el valor
- Rango 0-20, valor inicial 0
- Auto-save con debounce 400ms (igual que `ResultPicker`)
- Bloqueo cuando `matchReadOnly` (mismo criterio: 10 min antes del partido)
- Diseño mobile-first: grande y táctil (los jugadores lo usan desde el celular)
- Mostrar el resultado derivado debajo del marcador (ej. "Victoria Local" / "Empate" / "Victoria Visitante") en gris para ayuda visual

**`src/pages/Predictions/MatchdayPredictions.tsx`**
- Detectar `matchday.predictionMode` para mostrar `ScorePicker` o `ResultPicker`
- Al guardar en modo `exact_score`, derivar `result` del marcador: `homeGoals > awayGoals → 'home'`, `homeGoals < awayGoals → 'away'`, `homeGoals === awayGoals → 'draw'`
- El campo `result` se sigue guardando para que Firestore rules no requieran cambios

**`src/pages/Predictions/PostMatchdayView.tsx`**
- En modo `exact_score`, mostrar el marcador ingresado por cada jugador (ej. "2-1") en lugar del badge LOCAL/EMP/VISIT
- Mostrar puntos obtenidos por cada predicción si la jornada está cerrada/terminada

**`src/pages/Dashboard/PlayerHistoryModal.tsx` y `HistoryContent`**
- En jornadas `exact_score`, mostrar el marcador predicho y el real en el acordeón de jornadas

### Cambios en Cloud Functions (`functions/src/index.ts`)

**`onMatchUpdated`** — agregar rama para `matchday.predictionMode === 'exact_score'`:

```typescript
function computeExactScorePoints(
  prediction: { homeGoals?: number; awayGoals?: number },
  match: { homeScore: number; awayScore: number },
  cfg: ScoringConfig
): number {
  const isExact = prediction.homeGoals === match.homeScore && prediction.awayGoals === match.awayScore;
  if (isExact) return cfg.exactScore ?? 5;

  const predictedResult = deriveResult(prediction.homeGoals, prediction.awayGoals);
  const actualResult = deriveResult(match.homeScore, match.awayScore);
  const resultCorrect = predictedResult === actualResult;

  let pts = 0;
  if (resultCorrect) pts += cfg.correctResult ?? 2;
  if (prediction.homeGoals === match.homeScore) pts += cfg.correctGoals ?? 1;
  if (prediction.awayGoals === match.awayScore) pts += cfg.correctGoals ?? 1;
  return pts;
}
```

La función debe leer el `predictionMode` del documento de jornada antes de decidir qué función de puntuación usar.

### Cambios en Admin

**`src/pages/Admin/MatchdayDetail.tsx`**
- Agregar selector de `predictionMode` ('Resultado' / 'Marcador exacto') al crear o editar una jornada
- Para jornadas de eliminatorias, el admin selecciona "Marcador exacto"

**`src/pages/Admin/ScoringConfig.tsx`**
- Agregar sección "Puntuación — Marcador exacto" con campos: Marcador exacto (5), Resultado correcto (2), Goles de equipo (1)
- Banner informativo: "Activo solo en jornadas con modo Marcador exacto"

**`src/pages/Admin/MatchdayList.tsx`**
- Badge visual junto al nombre de la jornada indicando el modo: "Resultado" (gris) o "Marcador exacto" (dorado)

### Jornada de 16vos de final — calendario

El admin deberá crear esta jornada manualmente desde `/admin` con `predictionMode: 'exact_score'`. Los equipos TBD se actualizan cuando se conozcan los clasificados (el admin edita el partido desde `MatchdayDetail`).

Horarios en **UTC**:

| Match | Fecha | Hora UTC | Local | Visitante | Sede |
|-------|-------|----------|-------|-----------|------|
| 73 | 28 jun | 19:00 | Sudáfrica | Canadá | SoFi Stadium, Inglewood |
| 76 | 29 jun | 17:00 | Brasil | Japón | NRG Stadium, Houston |
| 74 | 29 jun | 20:30 | Alemania | 3ro C/D/F | Gillette Stadium, Foxborough |
| 75 | 29 jun | 21:00 | Países Bajos | Marruecos | Estadio BBVA, Guadalupe |
| 78 | 30 jun | 17:00 | Costa de Marfil | 2do I | AT&T Stadium, Arlington |
| 77 | 30 jun | 21:00 | 1ro I | 3ro D/F/G | MetLife Stadium, E. Rutherford |
| 79 | 30 jun | 21:00 | México | 3ro C/E/H | Estadio Azteca, Ciudad de México |
| 80 | 1 jul | 16:00 | 1ro L | 3ro E/I/J/K | Mercedes-Benz Stadium, Atlanta |
| 81 | 1 jul | 20:00 | Estados Unidos | Bosnia-Herzegovina | Levi's Stadium, Santa Clara |
| 82 | 1 jul | 20:00 | 1ro G | 3ro A/H/I/J | Lumen Field, Seattle |
| 84 | 2 jul | 19:00 | 1ro H | 2do J | SoFi Stadium, Inglewood |
| 83 | 2 jul | 23:00 | 2do K | 2do L | BMO Field, Toronto |
| 85 | 3 jul | 03:00 | Suiza | 3ro E/F/G/I/J | BC Place, Vancouver |
| 88 | 3 jul | 18:00 | Australia | 2do G | AT&T Stadium, Arlington |
| 86 | 3 jul | 22:00 | Argentina | 2do H | Hard Rock Stadium, Miami Gardens |
| 87 | 4 jul | 01:30 | 1ro K | 3ro D/E/I/J/L | Arrowhead Stadium, Kansas City |

> **Nota:** Los equipos marcados como "1ro X", "2do X", "3ro X" son TBD hasta que termine la fase de grupos (26-27 de junio). El admin puede editar los nombres de los equipos en cada partido desde `MatchdayDetail` una vez que se definan los clasificados.

### Archivos afectados

- `src/types/Matchday.ts` (o `index.ts`) — campo `predictionMode`
- `src/types/index.ts` — campos `homeGoals`, `awayGoals` en `Prediction`
- `src/pages/Predictions/ScorePicker.tsx` — **nuevo componente**
- `src/pages/Predictions/MatchdayPredictions.tsx` — branching por `predictionMode`
- `src/pages/Predictions/PostMatchdayView.tsx` — mostrar marcador en lugar de badge
- `src/pages/Dashboard/PlayerHistoryModal.tsx` — marcador en acordeón
- `src/pages/Admin/MatchdayDetail.tsx` — selector de `predictionMode`
- `src/pages/Admin/MatchdayList.tsx` — badge de modo
- `src/pages/Admin/ScoringConfig.tsx` — sección exact_score
- `src/services/firestoreConfig.ts` — campos nuevos en `ScoringConfig` y `DEFAULT_SCORING`
- `functions/src/index.ts` — `computeExactScorePoints`, branching en `onMatchUpdated`

### Consideraciones

- Las jornadas existentes (fase de grupos) tienen `predictionMode` implícitamente `'result'` — agregar fallback `?? 'result'` en todos los lugares que lean este campo para no romper historial.
- Los partidos eliminatorios no pueden terminar en empate (excepto al 90', con prórroga y penales). El `ScorePicker` sí permite empate al ingresar marcador — el resultado extra-tiempo/penales va en campo separado (fuera del alcance de T17, se verá en T18 si aplica).
- El deadline de 10 minutos antes del partido (T14) aplica igual en modo `exact_score` — las Firestore rules no requieren cambios.
- `checkAndAwardGroupBonus` no aplica a jornadas de eliminatoria — asegurarse de que la condición `group_stage` lo excluya (ya existe en el código).
- Probar especialmente en móvil: los inputs numéricos con +/- deben ser grandes y cómodos de tocar.

---

## T18 — Historial: segmented control "Fase de Grupos / Playoffs"
**Estado:** Completada ✅ (PR #28, deploy 2026-06-26)

El tab de Historial (en `PlayerHistoryModal` y en el tab inline de Dashboard) mostrará un segmented control de dos opciones para filtrar por fase del torneo. La vista de Playoffs mostrará los marcadores exactos predichos en lugar del badge de resultado (LOCAL/EMP/VISIT).

### Comportamiento esperado

- Encima del gráfico de puntos aparece un segmented control con dos pills: **"Fase de Grupos"** y **"Playoffs"**.
- **Fase de Grupos** (default inicial si hay jornadas de grupos): filtra a jornadas con `matchday.phase === 'group_stage'`. Las filas de predicción muestran el badge de resultado (LOCAL / EMPATE / VISITANTE) como actualmente.
- **Playoffs**: filtra a jornadas con cualquier otra `phase` (`round_of_32`, `round_of_16`, etc.). Las filas de predicción muestran el **marcador predicho** (`homeGoals-awayGoals`, ej. `2-1`) en lugar del badge de resultado. El marcador real ya se muestra en la columna central — al lado de él se mostrará en qué se equivocó/acertó el jugador.
- El gráfico SVG de evolución de puntos se recalcula para reflejar solo las jornadas del segmento activo.
- Si no hay jornadas en uno de los segmentos (ej. playoffs aún no empezaron), ese pill aparece en gris deshabilitado.
- El segmented control selecciona automáticamente el segmento que tiene la jornada más reciente con datos al cargar.

### Cambios en componentes

**`src/pages/Dashboard/PlayerHistoryModal.tsx`**

- Agregar estado `const [phase, setPhase] = useState<'groups' | 'playoffs'>('groups')` en `HistoryContent`.
- Filtrar `history` antes de renderizar: grupos → `mh.matchday.phase === 'group_stage'`; playoffs → cualquier otra.
- Agregar componente `SegmentedControl` inline con dos pills estilizados con `var(--accent)` cuando están activos.
- En `PredRow`, recibir una prop `predictionMode: PredictionMode` (propagada desde `MatchdayItem` → `HistoryContent`). Cuando `predictionMode === 'exact_score'`, mostrar `${p.homeGoals ?? '?'}–${p.awayGoals ?? '?'}` en lugar de `resultLabel(p.result)`.
- `PointsChart` recibe el array ya filtrado — sin cambios internos.

**`src/hooks/usePlayerHistory.ts`**

Sin cambios de interfaz. `MatchdayHistory.matchday` ya expone `phase` y `predictionMode`.

### Diseño del segmented control

```
┌─────────────────────────────────────────┐
│  ◉ Fase de Grupos    ○ Playoffs         │
└─────────────────────────────────────────┘
```

- Fondo del contenedor: `rgba(0,0,0,0.25)` con `border-radius: 0.5rem`
- Pill activo: `background: var(--accent)`, texto blanco
- Pill inactivo: texto `rgba(255,255,255,0.4)`, sin fondo
- Tamaño mínimo de pill: 44px de alto (touch target)
- Fuente: Bebas Neue, `tracking-widest`

### Archivos afectados

- `src/pages/Dashboard/PlayerHistoryModal.tsx` — segmented control, filtrado, prop `predictionMode` en `PredRow`

### Consideraciones

- Cuando el segmento activo no tiene datos, mostrar el estado vacío actual ("Sin partidos calificados") en lugar de un error.
- Si solo hay jornadas de grupos (aún no hay playoffs), el segmented control no aparece — mostrar directamente el acordeón actual sin cambios.
- La prop `isOwnProfile` no afecta el segmented control — funciona igual para historial propio y ajeno.
- No cambiar la estructura de datos de `usePlayerHistory` — todo el filtrado es en UI.

---

## T19 — Admin: dashboard analítico de métricas
**Estado:** Completada ✅ (PR #30, deploy 2026-06-26)

Nueva sección en el panel de admin con tarjetas de métricas calculadas a partir del historial de predicciones. El objetivo es mostrar datos curiosos y competitivos sobre el desempeño de los jugadores a lo largo del torneo.

### Ubicación

- Nueva ruta `/admin/metricas` vinculada desde el sidebar de admin bajo la sección **REPORTES** (junto a `/admin/tabla`).
- Nuevo archivo: `src/pages/Admin/AdminMetrics.tsx`.
- Registrar la ruta en `App.tsx` o donde estén las rutas admin.
- Agregar item "Métricas" al `MOBILE_NAV` del admin y al sidebar desktop en `AdminLayout.tsx`.

### Tarjetas de métricas

Cada tarjeta es un cuadro compacto con: ícono decorativo, título de la métrica, nombre del jugador ganador (con avatar pequeño), y el valor numérico destacado en Bebas Neue.

| # | Título | Descripción de cálculo |
|---|--------|------------------------|
| 1 | **Racha de aciertos** | Jugador con la racha más larga de predicciones correctas consecutivas (`isCorrect === true`) entre todos los partidos calificados, ordenados por `scheduledAt`. |
| 2 | **Racha de errores** | Jugador con la racha más larga de predicciones incorrectas consecutivas (`isCorrect === false` o `points === 0`). |
| 3 | **Mayor caída** | Jugador que más posiciones cayó entre su mejor posición histórica (tras cualquier jornada) y su posición actual. Requiere calcular el leaderboard acumulado tras cada jornada. |
| 4 | **Mayor remontada** | Jugador que más posiciones subió entre su peor posición histórica y la actual. |
| 5 | **Más consistente** | Jugador con la menor desviación estándar de puntos por jornada (mínimo 2 jornadas). Indica quien siempre saca puntos similares. |
| 6 | **Mejor jornada** | Jugador que más puntos acumuló en una sola jornada. Mostrar también el nombre de la jornada. |
| 7 | **Peor jornada** | Jugador con menos puntos (0) en una jornada donde todos los demás sacaron al menos 1. |
| 8 | **Más arriesgado** | Jugador con mayor proporción de predicciones de **empate** en fase de grupos (la predicción más difícil de acertar estadísticamente). |

### Cálculo client-side

Todos los cálculos se hacen en el cliente — el grupo es pequeño (< 30 jugadores, < 700 predicciones totales), no hay necesidad de Cloud Functions.

Datos necesarios (todos ya disponibles o accesibles con queries existentes):

```typescript
// 1. Todos los usuarios con onboardingCompleted
const users = await getDocs(query(collection(db, 'users'), where('onboardingCompleted', '==', true)))

// 2. Todas las predicciones calificadas (points != null)
// Hacer query por usuario en paralelo — reutilizar getUserPredictions(userId) por cada jugador
// O agregar una función getAllScoredPredictions() en firestorePredictions.ts

// 3. Todos los partidos finalizados (ya existe getFinishedMatches())

// 4. Todas las jornadas (ya se consultan en usePlayerHistory)
```

Crear un hook `useAdminMetrics()` en `src/hooks/useAdminMetrics.ts` que:
1. Cargue todos los datos en paralelo con `Promise.all`
2. Compute cada métrica como función pura
3. Retorne `{ metrics: MetricCard[], loading: boolean }`

```typescript
interface MetricCard {
  id: string
  title: string
  winner: User        // jugador ganador de la métrica
  value: string       // valor destacado ej. "7 seguidas", "12 pts", "+5 puestos"
  subtitle?: string   // contexto adicional ej. "Jornada R32"
  icon: 'streak' | 'drop' | 'rise' | 'consistent' | 'bold' | 'best' | 'worst'
}
```

### Diseño de la página

```
┌─────────────────────────────────────────────────────────────┐
│  MÉTRICAS DEL TORNEO                                        │
│  Calculado sobre N partidos calificados                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 🔥 Racha de  │  │ 💀 Racha de  │  │ 📉 Mayor     │     │
│  │    aciertos  │  │    errores   │  │    caída     │     │
│  │              │  │              │  │              │     │
│  │ [Avatar] Ana │  │ [Avatar] Bob │  │ [Avatar] Clo │     │
│  │   7 seguidas │  │   5 seguidas │  │   -4 puestos │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ...más tarjetas en grid...                                │
└─────────────────────────────────────────────────────────────┘
```

- Grid: 2 columnas en móvil, 3-4 en desktop (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- Cada tarjeta: `surface-card` con `border: 1px solid rgba(255,255,255,0.06)`, padding 16px, border-radius 12px
- Valor numérico: Bebas Neue, `font-size: 2rem`, `color: var(--accent-light)`
- Ícono decorativo: SVG pequeño (24px) en esquina superior derecha, `opacity: 0.2`
- Avatar del jugador: `Avatar` component, `size="sm"` (ya existe)
- Estado de carga: skeleton placeholders con `animate-pulse`
- Si hay empate en una métrica (dos jugadores con el mismo valor), mostrar "Varios" con los avatares apilados

### Archivos afectados

- `src/pages/Admin/AdminMetrics.tsx` — **nuevo componente** con grid de tarjetas
- `src/hooks/useAdminMetrics.ts` — **nuevo hook** con carga y cálculo de métricas
- `src/services/firestorePredictions.ts` — posiblemente agregar `getAllScoredPredictions()` si la carga por usuario es lenta
- `src/pages/Admin/AdminLayout.tsx` — agregar item "Métricas" en sidebar y mobile nav
- `src/App.tsx` (o donde estén las rutas admin) — registrar `/admin/metricas`

### Consideraciones

- Hacer todas las queries de predicciones en paralelo (`Promise.allSettled`) para no bloquear la carga.
- Memoizar el cálculo de métricas con `useMemo` — los datos no cambian mientras el admin está en la página.
- Si no hay suficientes datos para una métrica (ej. menos de 2 jornadas calificadas), mostrar la tarjeta en gris con texto "Insuficientes datos".
- El cálculo de posiciones históricas requiere reconstruir el leaderboard tras cada jornada: agrupar predicciones por jornada, calcular puntos acumulados hasta cada jornada, ordenar usuarios y asignar posición. Es O(n·m) donde n = jugadores y m = jornadas — perfectamente eficiente para el tamaño de este torneo.
- No mostrar la métrica "Peor jornada" si todos los jugadores tuvieron 0 en alguna jornada (no es informativo).
- Las métricas de racha deben ordenar predicciones por `match.scheduledAt` dentro de cada jornada y luego por `matchday.order` entre jornadas — para que la racha sea cronológicamente correcta.

---

## T20 — Bonus: ver predicciones de todos
**Estado:** Completada ✅ (PR #29, deploy 2026-06-26)

En el recuadro "Mis bonus" del Dashboard, agregar un botón "Ver predicciones de los demás" que abra un modal con una matriz comparativa de los bonus de todos los jugadores.

### Comportamiento esperado

- El botón aparece **solo después del deadline** (`2026-06-11T13:00:00Z`) — antes del cierre nadie debe poder ver las predicciones ajenas para no copiar.
- Al hacer click, se abre un modal/bottom-sheet con una tabla donde:
  - **Columnas** = las 4 preguntas bonus: Goleador · Balón de Oro · México llega a · Campeón
  - **Filas** = todos los jugadores con `onboardingCompleted === true`, ordenados por posición en la tabla general (mismo orden que el leaderboard)
  - **Intersección** = el valor que ese jugador escribió/seleccionó
- Si un jugador no completó algún campo, mostrar "—".
- Para la columna **Campeón**, mostrar `flag + name` del equipo (mismo formato que `BonusSummary`).
- Para la columna **México llega a**, traducir el valor interno al label legible (usando `MEXICO_PHASE_LABELS`, ya definido en `BonusSummary.tsx`).
- Resaltar visualmente la fila del jugador actual (el usuario logueado).
- Si `bonusPredictions.pointsAwarded === true`, mostrar al lado del nombre un badge "✓ Pts" indicando que ya se evaluaron sus bonus.

### Datos disponibles sin queries adicionales

El array `players` de `useLeaderboard` en `Dashboard.tsx` ya incluye el campo `bonusPredictions` de cada usuario. No se necesita ninguna consulta extra a Firestore — los datos están en memoria.

### Archivos afectados

- `src/pages/Dashboard/BonusSummary.tsx` — agregar botón "Ver predicciones de los demás" + recibir `players` como prop nueva
- `src/pages/Dashboard/BonusAllModal.tsx` — **nuevo componente** modal con la matriz
- `src/pages/Dashboard/Dashboard.tsx` — pasar `players` a `BonusSummary`

### Diseño del modal

```
┌──────────────────────────────────────────────────────────────────────┐
│  Bonus de todos                                         [×]          │
│  ─────────────────────────────────────────────────────────────────── │
│  JUGADOR         │ GOLEADOR    │ BALÓN ORO   │ MÉXICO  │ CAMPEÓN    │
│  ─────────────────────────────────────────────────────────────────── │
│  1 Ana ★ TÚ      │ Messi       │ Messi       │ Semis   │ 🇦🇷 ARG    │
│  2 Bob            │ Mbappé      │ Vinicius    │ Cuartos │ 🇧🇷 BRA    │
│  ...                                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

- Bottom-sheet en móvil (igual que `PlayerHistoryModal`), modal centrado en desktop
- Columna de jugador: sticky left, con número de posición + nombre truncado
- Las 4 columnas de respuestas: ancho fijo, texto truncado con `text-overflow: ellipsis`
- La fila del usuario logueado: fondo `var(--accent-deep)` con borde izquierdo `var(--accent)`
- Header fijo mientras el body hace scroll horizontal

### Firestore rules

Sin cambios. `bonusPredictions` es parte del documento `users/{uid}` que ya es legible por cualquier `isAllowedUser()`.

### Consideraciones

- La columna "Campeón" puede ser larga (flag + nombre completo) — truncar en móvil o usar el código del equipo como fallback si el nombre no cabe.
- No mostrar el botón si `players` está vacío o cargando.
- El modal debe cerrarse con Escape y con click en el overlay (igual que `PlayerHistoryModal`).

---

## T21 — Criterio de desempate y stats de exactitud
**Estado:** Completada ✅ (PR #32, deploy 2026-06-30)

Con la fase eliminatoria en modo `exact_score`, el criterio de desempate actual (solo por puntos) ya no distingue suficientemente entre jugadores. El nuevo criterio es:

1. **Puntos totales** (mayor gana) — ya implementado
2. **Marcadores exactos** (mayor gana) — nuevo: `stats.exactScoreCount`
3. **Fallos** (menor gana) — nuevo: `stats.incorrectPredictions`

Además, en cada fila del leaderboard, después de "N aciertos" mostrar también los exactos y fallos.

### Cambios en modelo de datos

**`src/types/User.ts`** — agregar campos en la interfaz `UserStats`:
```typescript
exactScoreCount: number      // predicciones con marcador exacto (isExact === true)
incorrectPredictions: number // predicciones incorrectas (isCorrect === false, match finished)
```

### Cambios en Cloud Functions (`functions/src/index.ts`)

**`computeExactScorePoints`** — extender el valor de retorno para exponer `isExact`:
```typescript
return { points, isCorrect, isExact }  // isExact: boolean
```

**`onMatchUpdated`** — al actualizar stats de cada predicción:
- Cuando `isExact === true`: `stats.exactScoreCount += 1`
- Cuando `isCorrect === false`: `stats.incorrectPredictions += 1`

Los tres casos ya manejados (nuevo score, corrección, revert) deben actualizar estos campos con el mismo patrón delta que se usa para `stats.totalPoints` y `stats.correctPredictions`.

En modo `result`, `isExact` siempre es `false` — no afecta `exactScoreCount`.

### Cambios en leaderboard — ordenamiento

**`src/hooks/useLeaderboard.ts`** — aplicar ordenamiento secundario y terciario client-side (los datos ya están cargados):

```typescript
players.sort((a, b) => {
  if (b.stats.totalPoints !== a.stats.totalPoints)
    return b.stats.totalPoints - a.stats.totalPoints
  if ((b.stats.exactScoreCount ?? 0) !== (a.stats.exactScoreCount ?? 0))
    return (b.stats.exactScoreCount ?? 0) - (a.stats.exactScoreCount ?? 0)
  return (a.stats.incorrectPredictions ?? 0) - (b.stats.incorrectPredictions ?? 0)
})
```

Firestore sigue ordenando por `stats.totalPoints desc` — el sort extra se hace sobre el array ya cargado.

### Cambios en UI — display de stats

**`src/components/LeaderboardRow.tsx`** (o donde se muestren los stats en la fila):

Actualmente muestra algo como `14 aciertos`. Cambiar a:

```
14 aciertos · 3 exactos 🎯 · 8 fallos ❌
```

Verificar también si `LeaderboardPNGCard.tsx` muestra esta línea — si es así, actualizar también allí (con valores hardcodeados del `COLORS` record, sin `var(--accent)`).

### Archivos afectados

- `src/types/User.ts` — `exactScoreCount`, `incorrectPredictions` en `UserStats`
- `functions/src/index.ts` — `computeExactScorePoints` retorna `isExact`; `onMatchUpdated` actualiza los dos campos nuevos
- `src/hooks/useLeaderboard.ts` — sort secundario/terciario client-side
- `src/components/LeaderboardRow.tsx` — mostrar exactos 🎯 y fallos ❌ tras los aciertos
- `src/pages/Admin/LeaderboardPNGCard.tsx` — si muestra la línea de stats, actualizar también

### Consideraciones

- `exactScoreCount` y `incorrectPredictions` no existen en documentos de usuarios ya escritos — usar `?? 0` como fallback en todos los lugares que los lean para evitar `NaN`.
- El sort client-side se aplica sobre el array ya cargado por `useLeaderboard`, sin queries adicionales.
- La lógica de corrección de score y revert en `onMatchUpdated` ya maneja deltas para `totalPoints`/`correctPredictions` — seguir el mismo patrón para los nuevos campos.
- Al revertir un score, restar los contadores solo si el valor previo era positivo (evitar negativos).
- Los datos de `LeaderboardPNGCard` se renderizan off-screen para html2canvas — no usar `var(--accent)` para los emojis/texto si se agrega color; los emojis son seguros.

---

## T22 — Seeds para rondas eliminatorias restantes (R16, QF, SF, Final)
**Estado:** Completada ✅ (PR #33, deploy 2026-06-30)

Crear los scripts de seed para las cuatro rondas que siguen al Round of 32. Todos usan `predictionMode: 'exact_score'`. Los equipos son TBD hasta que se definan los clasificados; el admin los edita desde `/admin/jornada/{id}`.

### Scripts a crear

| Script | Matchday ID | Fase | Partidos | `order` |
|--------|-------------|------|----------|---------|
| `scripts/seed-r16.ts` | `r16_stage` | `round_of_16` | 8 (M89–M96) | 5 |
| `scripts/seed-qf.ts` | `qf_stage` | `quarter_finals` | 4 (M97–M100) | 6 |
| `scripts/seed-sf.ts` | `sf_stage` | `semi_finals` | 2 (M101–M102) | 7 |
| `scripts/seed-final.ts` | `final_stage` | `final` | 2 (M103–M104) | 8 |

Seguir exactamente el mismo patrón de `scripts/seed-r32.ts`: boilerplate de Firebase Admin, `MATCHDAY`, `MATCHES`, `seedMatchday()`, `seedMatches()`, `main()`.

### Comandos en `package.json`

Agregar los siguientes scripts (mismo patrón que `seed:r32` / `seed:r32:prod`):
```json
"seed:r16":        "tsx scripts/seed-r16.ts",
"seed:r16:prod":   "FIRESTORE_EMULATOR_HOST='' tsx scripts/seed-r16.ts",
"seed:qf":         "tsx scripts/seed-qf.ts",
"seed:qf:prod":    "FIRESTORE_EMULATOR_HOST='' tsx scripts/seed-qf.ts",
"seed:sf":         "tsx scripts/seed-sf.ts",
"seed:sf:prod":    "FIRESTORE_EMULATOR_HOST='' tsx scripts/seed-sf.ts",
"seed:final":      "tsx scripts/seed-final.ts",
"seed:final:prod": "FIRESTORE_EMULATOR_HOST='' tsx scripts/seed-final.ts"
```

### Calendario completo (UTC) — fuente: worldcupwiki.com

#### R16 — Octavos de Final (4–7 jul)
`predictionDeadline`: `2026-07-04T16:50:00Z` (10 min antes del primer partido)

| ID | Fecha UTC | Hora UTC | Local | Visitante | Sede |
|----|-----------|----------|-------|-----------|------|
| `r16_m90` | 2026-07-04 | 17:00 | Canadá | Marruecos | NRG Stadium, Houston |
| `r16_m89` | 2026-07-04 | 21:00 | Paraguay | Gan. M77 | Lincoln Financial Field, Philadelphia |
| `r16_m91` | 2026-07-05 | 20:00 | Brasil | Noruega | MetLife Stadium, East Rutherford |
| `r16_m92` | 2026-07-06 | 00:00 | Gan. M79 | Gan. M80 | Estadio Azteca, Ciudad de México |
| `r16_m93` | 2026-07-06 | 19:00 | Gan. M83 | Gan. M84 | AT&T Stadium, Arlington |
| `r16_m94` | 2026-07-07 | 00:00 | Gan. M81 | Gan. M82 | Lumen Field, Seattle |
| `r16_m95` | 2026-07-07 | 16:00 | Gan. M86 | Gan. M88 | Mercedes-Benz Stadium, Atlanta |
| `r16_m96` | 2026-07-07 | 20:00 | Gan. M85 | Gan. M87 | BC Place, Vancouver |

> Nota: Canadá, Marruecos, Paraguay, Brasil y Noruega ya están confirmados. El resto son TBD.

#### QF — Cuartos de Final (9–11 jul)
`predictionDeadline`: `2026-07-09T19:50:00Z`

| ID | Fecha UTC | Hora UTC | Local | Visitante | Sede |
|----|-----------|----------|-------|-----------|------|
| `qf_m97` | 2026-07-09 | 20:00 | Gan. M89 | Gan. M90 | Gillette Stadium, Foxborough |
| `qf_m98` | 2026-07-10 | 19:00 | Gan. M93 | Gan. M94 | SoFi Stadium, Inglewood |
| `qf_m99` | 2026-07-11 | 21:00 | Gan. M91 | Gan. M92 | Hard Rock Stadium, Miami Gardens |
| `qf_m100` | 2026-07-12 | 01:00 | Gan. M95 | Gan. M96 | Arrowhead Stadium, Kansas City |

#### SF — Semifinales (14–15 jul)
`predictionDeadline`: `2026-07-14T18:50:00Z`

| ID | Fecha UTC | Hora UTC | Local | Visitante | Sede |
|----|-----------|----------|-------|-----------|------|
| `sf_m101` | 2026-07-14 | 19:00 | Gan. M97 | Gan. M98 | AT&T Stadium, Arlington |
| `sf_m102` | 2026-07-15 | 19:00 | Gan. M99 | Gan. M100 | Mercedes-Benz Stadium, Atlanta |

#### Final (18–19 jul)
`predictionDeadline`: `2026-07-18T20:50:00Z` (10 min antes del Tercer Lugar)

Un solo matchday `final_stage` con los dos partidos finales:

| ID | Fecha UTC | Hora UTC | Local | Visitante | Sede |
|----|-----------|----------|-------|-----------|------|
| `final_m103` | 2026-07-18 | 21:00 | Per. M101 | Per. M102 | Hard Rock Stadium, Miami Gardens |
| `final_m104` | 2026-07-19 | 19:00 | Gan. M101 | Gan. M102 | MetLife Stadium, East Rutherford |

> `Per.` = Perdedor de. El M103 es el partido por el Tercer Lugar. Ambos van en el mismo matchday `final_stage`.

### Consideraciones

- Todos los matchdays: `status: 'upcoming'`, `predictionMode: 'exact_score'`.
- `startDate` / `endDate` del matchday deben abarcar todos sus partidos.
- Todos los equipos son `TBD` excepto los ya confirmados en R16 (Canadá, Marruecos, Paraguay, Brasil, Noruega). Usar `homeTeamCode: 'TBD'` como en `seed-r32.ts`.
- El M103 (tercer lugar) y M104 (final) comparten matchday `final_stage` — el `predictionDeadline` es 10 min antes del partido más temprano (M103 el 18 jul).
- Verificar los horarios contra el calendario oficial de FIFA antes de ejecutar en producción — la fuente usada aquí es worldcupwiki.com; pueden ajustarse horarios menores.

---

## T23 — Admin/Métricas: nuevas métricas de marcador exacto + quitar "Participación por jornada"

**Estado:** Pendiente

Con la fase eliminatoria en modo `exact_score`, ahora hay datos de goles pronosticados (`homeGoals`/`awayGoals`) que T19 no aprovechaba. Reemplazar la sección "PARTICIPACIÓN POR JORNADA" (poco útil, redundante con el progreso que ya se ve en el Dashboard) por métricas nuevas basadas en marcador exacto.

### Quitar: sección "Participación por jornada"

En `src/pages/Admin/AdminMetrics.tsx`:
- Eliminar el bloque JSX `{/* ── Participación por jornada ── */}` (la llamada a `SectionHeader title="PARTICIPACIÓN POR JORNADA"` + `met-section-body` con `MatchdayMetricsRow`).
- Eliminar la interfaz `MatchdayRow`, el cálculo de `matchdayRows` dentro de `loadMetrics()`, y el componente `MatchdayMetricsRow`.
- `noData` actualmente se basa en `metrics.matchdayRows.length === 0` — cambiar la condición a algo que siga teniendo sentido sin esa data (ej. `metrics.totalPredictions === 0`).
- Revisar si las clases CSS `.met-jornada-*` quedan sin uso tras el cambio y eliminarlas del bloque `styles`.
- La sección "PARTIDOS MÁS DIFÍCILES" (`hardestMatches`) **se mantiene** — no depende de `matchdayRows`.

### Agregar: nuevas tarjetas de métricas (`useAdminMetrics.ts`)

Mismo patrón que las 8 tarjetas existentes (`MetricCard`, grid `met-grid-records`). Todas requieren predicciones de jornadas `predictionMode === 'exact_score'` con `homeGoals`/`awayGoals` no nulos.

| # | Título | Ícono | Cálculo |
|---|--------|-------|---------|
| 9 | **Francotirador** | 🎯 (`target`, nuevo) | Jugador con más `stats.exactScoreCount` total. Ya viene acumulado server-side desde T21 — solo iterar `users`, sin recalcular desde predicciones. |
| 10 | **Ojo de águila** | 👁️ (`eye`, nuevo) | Mejor proporción `exactScoreCount / total de predicciones en jornadas exact_score`, con mínimo de predicciones calificadas (ej. ≥5) para calificar y evitar que un jugador con 1 sola predicción gane. |
| 11 | **Mayor error de marcador** | 📏 (`ruler`, nuevo) | La predicción individual (cualquier jugador, cualquier partido `exact_score` calificado) con mayor error absoluto: `\|homeGoals_pred - homeScore\| + \|awayGoals_pred - awayScore\|`. Mostrar `subtitle` con "Predijo X–Y, fue Z–W" y el partido. |
| 12 | **Más ofensivo** | ⚔️ (`offensive`, nuevo) | Jugador con el promedio más alto de goles totales pronosticados (`homeGoals + awayGoals`) en jornadas `exact_score`. |
| 13 | **Más cauteloso** | 🛡️ (`cautious`, nuevo) | Igual que #12 pero el promedio más bajo. |

```typescript
// useAdminMetrics.ts — extender MetricIcon
export type MetricIcon =
  | 'streak_correct' | 'streak_wrong' | 'drop' | 'rise'
  | 'consistent' | 'best' | 'worst' | 'bold'
  | 'target' | 'eye' | 'ruler' | 'offensive' | 'cautious'   // nuevos
```

Cálculo de #9–#13 reutiliza `scoredByUser` (ya filtrado a `points != null`) agregando un filtro adicional `matchdayById[matchById[p.matchId].matchdayId]?.predictionMode === 'exact_score' && p.homeGoals != null && p.awayGoals != null`. Para #9 no hace falta iterar predicciones — usar directamente `user.stats.exactScoreCount ?? 0` (ya viene en el doc de `users`).

### Agregar: sección "Marcadores más predichos" (reemplazo de Participación por jornada)

En `src/pages/Admin/AdminMetrics.tsx`, agregar una sección agregada (no por jugador) similar en estructura a "Partidos más difíciles":

- Para cada partido finalizado con `predictionMode === 'exact_score'` y al menos 2 predicciones, calcular el marcador más repetido entre todos los jugadores (`Map<"H-A", count>`) y el % que lo eligió.
- Mostrar fila: equipos + marcador real + "Marcador más predicho: 2–1 (38%)" + indicador si ese marcador coincidió con el resultado real (✅/❌).
- Reutilizar el patrón de `MatchRow`/`HardMatchRow` (mismo estilo `met-match-row`) en vez de crear un sistema visual nuevo.
- Esta sección requiere las predicciones completas por partido (`predsByMatch`, ya calculado en `loadMetrics()`), filtrando a las de jornadas `exact_score`.

### Archivos afectados

- `src/pages/Admin/AdminMetrics.tsx` — quitar sección de participación; agregar sección "Marcadores más predichos"; ajustar `noData`
- `src/hooks/useAdminMetrics.ts` — 5 tarjetas nuevas (#9–13), extender `MetricIcon`
- Iconos SVG nuevos en `ICON_PATHS` (`AdminMetrics.tsx`) para `target`, `eye`, `ruler`, `offensive`, `cautious`

### Consideraciones

- Todas las métricas nuevas quedan vacías/"Sin datos" mientras la fase de grupos siga activa (no hay `homeGoals`/`awayGoals` en modo `result`) — comportamiento esperado, no es un bug.
- `exactScoreCount` ya tiene fallback `?? 0` desde T21 — reutilizar el mismo patrón.
- Para "Mayor error de marcador", limitar candidatos a predicciones con ambos campos de goles no nulos (evitar `NaN` si una predicción quedó incompleta).
- "Marcadores más predichos" puede tener empates (dos marcadores con el mismo conteo) — en ese caso mostrar el primero encontrado o "Varios marcadores empatados", igual que el patrón de empate ya usado en T19.
- No tocar la lógica de puntuación ni Cloud Functions — todo el trabajo es de lectura/agregación en el cliente, igual que T19.
