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
**Estado:** Pendiente 🔲

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
