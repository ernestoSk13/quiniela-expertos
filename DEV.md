# Desarrollo Local

## Requisitos previos

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- `npm install` en el proyecto raíz
- `cd functions && npm install` para las Cloud Functions

---

## Levantar el entorno

Necesitas **dos terminales** abiertas al mismo tiempo.

### Terminal 1 — Emuladores Firebase

```bash
npm run emulators
```

| Servicio  | URL                   |
| --------- | --------------------- |
| Auth      | http://localhost:9099 |
| Firestore | http://localhost:8080 |
| Functions | http://localhost:5001 |
| Storage   | http://localhost:9199 |
| UI admin  | http://localhost:4000 |

### Terminal 2 — App

Primera vez (o después de restaurar datos):

```bash
npm run seed
```

Luego:

```bash
npm run dev
```

App disponible en **http://localhost:5173**

---

## Variables de entorno (`.env.local`)

```bash
VITE_USE_EMULATORS=true          # Datos locales (emuladores)
VITE_EMULATOR_HOST=localhost     # Cambiar por IP local para pruebas en iPhone (ver abajo)
```

Para producción: `VITE_USE_EMULATORS=false` (y quitar `VITE_EMULATOR_HOST`).

---

## Setup inicial (primera vez con emuladores)

### 1. Agregar usuario permitido

- Abre http://localhost:4000 → **Firestore**
- En `allowedUsers`, crea un documento con ID = `tu@correo.com` (sin campos)

### 2. Crear usuario en Auth

- En la UI → **Authentication** → agregar usuario con el mismo correo y contraseña

### 3. Hacer admin

- En Firestore → `users/{uid}` → cambiar `role` a `"admin"`

---

## Importar datos de producción al emulador

Útil para trabajar con datos reales (equipos, jornadas, partidos) sin seed manual. Requiere `service-account.json` en la raíz del proyecto.

```bash
npm run pull-from-prod                              # teams + matchdays + matches
npm run pull-from-prod -- --collections=teams       # Solo equipos
```

### Corregir timestamps (UTC offset)

Si los timestamps de partidos/jornadas fueron ingresados como hora local en lugar de UTC, usa el script de corrección:

```bash
npm run fix-timestamps              # Preview — muestra qué cambiaría sin tocar nada
npm run fix-timestamps -- --apply   # Aplica en producción (+6h por defecto, CDMX)
npm run fix-timestamps -- --apply --emulator   # Aplica en emulador
npm run fix-timestamps -- --apply --offset=7  # Para UTC-7 (Tijuana/LA)
```

---

## Probar desde iPhone (misma red Wi-Fi)

1. Obtener la IP local del Mac:

   ```bash
   ipconfig getifaddr en0
   # ej. 192.168.86.40
   ```

2. Actualizar `.env.local`:

   ```bash
   VITE_USE_EMULATORS=true
   VITE_EMULATOR_HOST=192.168.86.40
   ```

3. Iniciar el dev server escuchando en todas las interfaces:

   ```bash
   npm run dev -- --host
   ```

4. En el iPhone, abrir `http://192.168.86.40:5173`

---

## Rutas de la app

| URL                  | Vista                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| `/login`             | Login (email/contraseña o Google); lee `?email=` para pre-llenar desde invitación       |
| `/onboarding`        | Nombre, foto, bonus predictions                                                         |
| `/dashboard`         | Tabla general, siguiente jornada, bonus, jornadas anteriores                            |
| `/jornada/:id`       | Pronósticos de una jornada; en jornadas cerradas/finalizadas incluye toggle "Ver todos" |
| `/invite/:token`     | Página pública de bienvenida para invitados; no requiere auth                           |
| `/admin`             | Panel admin — jornadas                                                                  |
| `/admin/jornada/:id` | Detalle de jornada — partidos y resultados                                              |
| `/admin/jugadores`   | Perfiles de jugadores (onboarding + conteo de pronósticos)                              |
| `/admin/bonus`       | Evaluar bonus predictions al final del torneo                                           |
| `/admin/usuarios`    | Gestión de correos con acceso + botón "Invitar" por correo                              |
| `/admin/tabla`       | Tabla general (solo desktop nav) — reutiliza LeaderboardTable + PlayerHistoryModal      |
| `/admin/config`      | Configuración de puntos (solo desktop nav) — formulario por categoría con advertencia   |
| `/admin/premios`     | Generador de tarjetas Panini — formulario + preview en tiempo real + exportar PNG        |

---

## Flujo de prueba de pronósticos

1. En `/admin`, abre una jornada con el botón **"Abrir"**
2. En `/dashboard` aparecerá el botón **"Hacer pronósticos"** con barra de progreso
3. Por cada partido aparece el selector **LOCAL · EMPATE · VISITANTE** — tocar un botón guarda el pronóstico inmediatamente
4. En eliminatorias: si el usuario selecciona "EMPATE", aparece inline la pregunta **¿Quién pasa?** con los dos equipos del partido
5. La barra de progreso en la parte superior muestra `Pronósticos: n / m partidos`
6. Los partidos cuyo `scheduledAt` ya pasó se bloquean automáticamente (botones deshabilitados) aunque la jornada siga abierta

## Flujo de prueba de post-jornada (Fase 10)

1. En `/admin/jornada/:id`, cambia el status a **"Cerrado"** o **"Finalizado"**
2. En `/jornada/:id` aparecerá el toggle **"Mis pronósticos" / "Ver todos"**
3. "Ver todos" muestra, por cada partido, el pronóstico de cada jugador con badge de puntos
4. En el Dashboard aparecerá la jornada en la sección **"Jornadas anteriores"**

---

## Flujo de prueba de link de invitación

1. En `/admin/usuarios`, agrega un correo que aún no tenga cuenta
2. Haz click en **"Invitar"** — se genera un token en `invites/{token}` y se copia el link al portapapeles
3. Abre el link en una ventana incógnita: deberías ver la pantalla de bienvenida con el correo pre-cargado
4. El botón "Crear cuenta / Iniciar sesión" lleva a `/login?email=correo@ejemplo.com`
5. Para probar errores: modifica el token en la URL → estado "Link no válido"; espera que el emulador tenga un invite expirado → estado "Invitación expirada"
6. En emuladores: la Cloud Function `getInvite` debe estar corriendo (`npm run emulators`) y el código compilado (`cd functions && npm run build`)

## Flujo de prueba de configuración de puntos

1. Ve a `/admin/config` (solo visible en desktop nav)
2. Cambia un valor (ej. `correctPrediction` de 3 a 2)
3. Al presionar "Guardar" aparece la advertencia — confirma con "Confirmar y guardar"
4. Ingresa un resultado en `/admin/jornada/:id` — el scoring usará el nuevo valor
5. Verifica en Firestore → `predictions/{id}` que `points` refleja el valor nuevo

## Flujo de prueba de compartir como imagen

1. **Posición personal**: en `/dashboard`, debajo de la tabla, botón "Compartir mi posición". En móvil abre Web Share API; en desktop descarga el PNG.
2. **Resumen de jornada**: en `/jornada/:id` con jornada cerrada/finalizada, en el toggle "Mis pronósticos" aparece botón "Compartir" arriba a la derecha. Solo genera PNG si hay predicciones ya calificadas.
3. **Tabla general (admin)**: en `/admin/tabla`, botón "Compartir tabla" → siempre descarga el PNG (force download) con la tabla completa en formato móvil 420px de ancho, alto adaptativo según número de jugadores.
4. **Avatares en el PNG**: si no aparecen avatares en el PNG, verifica que el dominio del `avatarUrl` soporte CORS (Google Photos sí; Firebase Storage requiere config). `useShareImage` ya carga las imágenes con `crossOrigin="anonymous"` y espera `onload` antes de capturar.

## Flujo de prueba de scoring

El scoring lo ejecuta la Cloud Function `onMatchUpdated`. En emuladores, la función se dispara automáticamente al guardar resultados desde el admin.

1. Asegúrate de que los emuladores están corriendo con `npm run emulators` (incluye el emulador de Functions)
2. Haz que un jugador ingrese pronósticos para una jornada abierta (selector LOCAL/EMPATE/VISITANTE)
3. En `/admin/jornada/:id`, ingresa el marcador final de un partido y guarda
4. La función deriva el resultado (`home` / `draw` / `away`) del marcador y lo compara con `prediction.result`
5. Verifica en http://localhost:4000 → Firestore → `predictions/{id}` que `points` e `isCorrect` fueron escritos
6. Verifica en `users/{uid}` que `stats.totalPoints` y `stats.correctPredictions` se incrementaron

**Bonus de fase de grupos:** cuando todos los partidos con `phase: "group_stage"` pasen a `status: "finished"`, la función otorga automáticamente +5pts al jugador con más **predicciones correctas** (no exactas). El guard `config/tournament.groupBonusAwarded` evita doble ejecución.

**Evaluación de bonus manual:** en `/admin/bonus`, ingresa los 4 resultados reales y presiona "Otorgar puntos bonus". Llama a la función `evaluateBonusPredictions` y actualiza a todos los jugadores en una sola operación.

---

## Cloud Functions — desarrollo

Las funciones viven en `functions/src/index.ts`. Para modificarlas:

```bash
cd functions
npm run build          # Compilar TypeScript → lib/
npm run build:watch    # Watch mode durante desarrollo
```

El emulador de Functions (`npm run emulators`) carga el código compilado desde `functions/lib/`. Necesitas hacer `build` antes de que los cambios se reflejen en el emulador; no hay hot-reload para functions.

**Dependencias clave:**

- `firebase-functions` ^7 — API gen2 (`firebase-functions/v2/firestore`, `/v2/https`)
- `firebase-admin` ^13 — acceso a Firestore desde el servidor
- Node.js 22

---

## Sistema de temas

Los temas cambian el fondo, header, tarjetas y acentos de toda la app.

**Archivos que definen los temas:**

- `src/index.css` — CSS custom properties por tema (`:root`, `.theme-canada`, `.theme-usa`)
- `src/lib/themes.ts` — array `THEMES` que alimenta el selector en el Dashboard

**Para agregar un tema nuevo**, usar el skill de Claude Code:

```
/add-theme
```

El skill pregunta el país, deriva los colores de la bandera con la energía visual de la paleta FIFA WC 2026, y actualiza ambos archivos automáticamente.

**Variables CSS disponibles en toda la app:**

| Variable              | Uso                                                     |
| --------------------- | ------------------------------------------------------- |
| `var(--accent)`       | Botones, highlights, bordes activos                     |
| `var(--accent-hover)` | Hover de botones                                        |
| `var(--accent-light)` | Texto de acento                                         |
| `var(--accent-dim)`   | Fondo muy oscuro tintado (filas seleccionadas)          |
| `var(--accent-muted)` | `rgba` semi-transparente para cajas/bordes              |
| `var(--accent-deep)`  | `rgba` muy semi-transparente para filas del leaderboard |
| `var(--bg-base)`      | Color base de la página                                 |
| `var(--surface-nav)`  | Header y tab bar                                        |
| `var(--surface-card)` | Tarjetas y paneles                                      |

**Clases utilitarias:**

| Clase          | Descripción                                           |
| -------------- | ----------------------------------------------------- |
| `app-bg`       | Fondo de página completo con blobs radiales temáticos |
| `surface-nav`  | Fondo para headers y navbars                          |
| `surface-card` | Fondo para tarjetas/paneles                           |

> Nunca usar `bg-emerald-*`, `bg-blue-*` etc. para colores de acento. Siempre `bg-[var(--accent)]`.

---

## Notas importantes

- **No usar `<StrictMode>`** en `main.tsx` — causa errores de aserción en Firestore emulador con queries compuestas. Ver `src/main.tsx`.
- **`usePredictions` usa `getDocs`** (no `onSnapshot`) para evitar el mismo bug con el emulador. Llamar a `refresh()` después de guardar para actualizar el estado.
- **`useAllMatchdayPredictions` también usa `getDocs`** — mismo motivo. El fetch se dispara lazy solo cuando `enabled = true` (al activar el tab "Ver todos").
- **Leaderboard requiere leer colección completa de `users`** — la regla de Firestore debe permitir `read` a `isAllowedUser()` sin restricción de `userId`. Una regla `request.auth.uid == userId` rompe el query de colección silenciosamente.
- **Bloqueo por partido**: `MatchdayPredictions` calcula `matchReadOnly = readOnly || match.scheduledAt.toDate() <= new Date()` por cada partido. En modo `readOnly`, los botones del selector LOCAL/EMPATE/VISITANTE se deshabilitan y resaltan el valor guardado. No confundir con `readOnly` que aplica a la jornada entera.
- **Modo resultado simple (Fase 14):** Los usuarios ya no ingresan marcadores exactos. El campo `prediction.result` puede ser `'home' | 'draw' | 'away'`. Los campos `homeScore`, `awayScore`, `isExact` e `isCorrectResult` fueron eliminados del tipo `Prediction`. Si ves predicciones antiguas con esos campos en Firestore, la Cloud Function los ignora — solo lee `result`.
- **Zona horaria del jugador** — los timestamps se almacenan en UTC pero se muestran en la zona del usuario. El hook `useUserTimezone()` lee `user.timezone` (IANA) o hace fallback al timezone del navegador. Admin pages (`MatchdayDetail`, `MatchdayList`) también usan el timezone del admin. Los inputs `datetime-local` del admin siguen siendo UTC (label "(UTC)" en el form). Si necesitas corregir timestamps ingresados como hora local, usa `npm run fix-timestamps`.
- **Batch limit**: máximo 499 ops por batch (cliente) / 500 (admin SDK en functions).
- **`!= null`** — usar desigualdad débil cuando un valor puede ser `null` o `undefined`. `!== null` no captura `undefined`.
- **Functions hot-reload**: no existe. Hacer `cd functions && npm run build` antes de reiniciar el emulador para ver cambios.
- **`pull-from-prod`**: lee `service-account.json` de la raíz si existe; si no, cae a la variable `FIREBASE_SERVICE_ACCOUNT`. No poner el JSON directamente en `.env.local` — la clave privada tiene saltos de línea que `dotenv` no maneja.
- **`getInvite` Cloud Function**: no requiere auth (`request.auth` puede ser null). Usa Admin SDK para leer `invites/{token}` — las rules de Firestore no aplican al Admin SDK. Si la función no está corriendo en el emulador (`npm run emulators`) la página `/invite/:token` fallará silenciosamente.
- **`config/scoring`**: si el documento no existe en Firestore, todas las Cloud Functions usan `DEFAULT_SCORING` (`correctPrediction: 3`, `correctTieWinner: 1`, `groupBonus: 5`, `bonusPrediction: 5`). Para inicializar en el emulador, ve a `/admin/config` y guarda sin cambios.
- **AdminLayout MOBILE_NAV vs DESKTOP_NAV**: el tab bar móvil solo tiene 4 ítems (Jornadas/Jugadores/Bonus/Acceso). "Tabla" y "Puntos" solo están en el nav de escritorio. No agregar ítems al tab bar sin revisar el espacio disponible en pantallas pequeñas.
- **LeaderboardRow** es un componente compartido (`src/components/LeaderboardRow.tsx`) con **inline styles** — esto es intencional para que html2canvas pueda capturarlo sin problemas. Si modificas el diseño, hazlo con `style={{...}}` y no con `className` para colores/dimensiones; clases solo para hover/cursor. Tres consumidores: `LeaderboardTable` (Dashboard + AdminLeaderboard), `LeaderboardPNGCard` (admin), y `LeaderboardShareCard` (dashboard, posición personal).
- **html2canvas + avatares**: el componente carga `<img crossOrigin="anonymous">` para que el canvas no quede _tainted_. Antes de capturar, todos los share cards esperan a que las imágenes terminen de cargar (`Promise.all` sobre `img.onload/onerror`). Si un avatar viene de un dominio sin CORS, html2canvas lo omite y el resto del PNG sale correcto.

## Flujo de prueba de premios de jornada (Fase 13)

1. Pre-requisitos: una jornada con `status: 'closed'` o `'finished'` y al menos un partido con resultado ingresado y predicciones calificadas
2. En `/admin/jornada/:id` → al final de la página aparece el botón **"Calcular premios"** (solo cuando la jornada está cerrada/finalizada)
3. Al presionar el botón: spinner durante el cálculo → badge **"Premios calculados ✓ {fecha}"** al terminar
4. Verifica en http://localhost:4000 → Firestore → `matchdays/{id}` que el campo `awards` fue escrito con las categorías `el_sabio`, `el_certero`, `el_enrachado` (si aplica), `el_inalcanzable`, `el_sotanero` (si aplica), `el_mvp` y `computedAt`
5. En el Dashboard → encima de la tabla general debe aparecer el botón **"🏆 Premios de la jornada — {nombre}"**
6. Al abrir el modal: verifica que las slides aparezcan en orden Sabio → Certero → Enrachado → Inalcanzable → Sotanero → MVP → Tu jornada
7. Slide **"Tu jornada"** (última): muestra posición en la tabla con delta (↑↓), aciertos de la jornada con comparativa grupal, puntos ganados y badge del premio obtenido (o frase motivacional si no ganaste ninguno)
8. Botón **"Compartir resumen"** dentro del modal: genera PNG con html2canvas y lo comparte (Web Share API en móvil) o descarga en desktop
9. Audio: el botón 🔊 en el header del modal activa/silencia la fanfarria de 0.5s al revelar cada ganador

**Edge cases a probar:**
- Jornada con menos de 3 jugadores que predicaron ≥75% de partidos → slide de El Certero omitida
- Todos los participantes con 0 aciertos → slide de El Sotanero omitida
- Primera jornada del torneo → slide de El Enrachado omitida (no hay historial)
- Empate entre 2+ jugadores en un premio → todos sus avatares aparecen en la misma slide

---

## Deploy a producción

```bash
# 1. Cambiar a producción — usa sed para no tocar el resto del archivo
sed -i '' 's/VITE_USE_EMULATORS=true/VITE_USE_EMULATORS=false/' .env.local
sed -i '' 's/VITE_EMULATOR_HOST=localhost//' .env.local

# 2. Build y deploy del frontend
npm run build
firebase deploy --only hosting

# 3. Build y deploy de Cloud Functions (requiere plan Blaze)
cd functions && npm run build && cd ..
firebase deploy --only functions

# 4. Deploy de reglas de Firestore (cuando hayan cambiado)
firebase deploy --only firestore:rules

# 5. Restaurar entorno de desarrollo
sed -i '' 's/VITE_USE_EMULATORS=false/VITE_USE_EMULATORS=true/' .env.local
echo "VITE_EMULATOR_HOST=localhost" >> .env.local

# 6. Si hay datos nuevos del emulador para subir a Firestore
npm run push-to-prod
```

> **Nota:** El paso 1 quita `VITE_EMULATOR_HOST` del archivo. El paso 5 lo restaura al final. Verifica con `grep "^VITE_" .env.local` que ambas variables quedaron correctas.
