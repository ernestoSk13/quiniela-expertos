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

| Servicio | URL |
|----------|-----|
| Auth | http://localhost:9099 |
| Firestore | http://localhost:8080 |
| Functions | http://localhost:5001 |
| Storage | http://localhost:9199 |
| UI admin | http://localhost:4000 |

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

| URL | Vista |
|-----|-------|
| `/login` | Login (email/contraseña o Google) |
| `/onboarding` | Nombre, foto, bonus predictions |
| `/dashboard` | Tabla general, siguiente jornada, bonus, jornadas anteriores |
| `/jornada/:id` | Pronósticos de una jornada; en jornadas cerradas/finalizadas incluye toggle "Ver todos" |
| `/admin` | Panel admin — jornadas |
| `/admin/jornada/:id` | Detalle de jornada — partidos y resultados |
| `/admin/jugadores` | Perfiles de jugadores (onboarding + conteo de pronósticos) |
| `/admin/bonus` | Evaluar bonus predictions al final del torneo |
| `/admin/usuarios` | Gestión de correos con acceso |

---

## Flujo de prueba de pronósticos

1. En `/admin`, abre una jornada con el botón **"Abrir"**
2. En `/dashboard` aparecerá el botón **"Hacer pronósticos"** con barra de progreso
3. En móvil: keypad numérico fijo en la parte inferior; la vista hace scroll automático al partido activo
4. En desktop: inputs directos por partido + sidebar con progreso, cambios pendientes y sección "Guardados"; los partidos ya guardados colapsan con animación
5. Los partidos cuyo `scheduledAt` ya pasó se bloquean automáticamente (input deshabilitado) aunque la jornada siga abierta

## Flujo de prueba de post-jornada (Fase 10)

1. En `/admin/jornada/:id`, cambia el status a **"Cerrado"** o **"Finalizado"**
2. En `/jornada/:id` aparecerá el toggle **"Mis pronósticos" / "Ver todos"**
3. "Ver todos" muestra, por cada partido, el pronóstico de cada jugador con badge de puntos
4. En el Dashboard aparecerá la jornada en la sección **"Jornadas anteriores"**

---

## Flujo de prueba de scoring

El scoring lo ejecuta la Cloud Function `onMatchUpdated`. En emuladores, la función se dispara automáticamente al guardar resultados desde el admin.

1. Asegúrate de que los emuladores están corriendo con `npm run emulators` (incluye el emulador de Functions)
2. Haz que un jugador ingrese pronósticos para una jornada abierta
3. En `/admin/jornada/:id`, ingresa el marcador final de un partido y guarda
4. La función se ejecuta en el emulador y actualiza `stats.totalPoints` del jugador
5. Verifica en http://localhost:4000 → Firestore → `predictions/{id}` que `points`, `isExact` e `isCorrectResult` fueron escritos
6. Verifica en `users/{uid}` que `stats.totalPoints` se incrementó

**Bonus de fase de grupos:** cuando todos los partidos con `phase: "group_stage"` pasen a `status: "finished"`, la función otorga automáticamente +5pts al jugador con más predicciones exactas. El guard `config/tournament.groupBonusAwarded` evita doble ejecución.

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

| Variable | Uso |
|----------|-----|
| `var(--accent)` | Botones, highlights, bordes activos |
| `var(--accent-hover)` | Hover de botones |
| `var(--accent-light)` | Texto de acento |
| `var(--accent-dim)` | Fondo muy oscuro tintado (filas seleccionadas) |
| `var(--accent-muted)` | `rgba` semi-transparente para cajas/bordes |
| `var(--accent-deep)` | `rgba` muy semi-transparente para filas del leaderboard |
| `var(--bg-base)` | Color base de la página |
| `var(--surface-nav)` | Header y tab bar |
| `var(--surface-card)` | Tarjetas y paneles |

**Clases utilitarias:**

| Clase | Descripción |
|-------|-------------|
| `app-bg` | Fondo de página completo con blobs radiales temáticos |
| `surface-nav` | Fondo para headers y navbars |
| `surface-card` | Fondo para tarjetas/paneles |

> Nunca usar `bg-emerald-*`, `bg-blue-*` etc. para colores de acento. Siempre `bg-[var(--accent)]`.

---

## Notas importantes

- **No usar `<StrictMode>`** en `main.tsx` — causa errores de aserción en Firestore emulador con queries compuestas. Ver `src/main.tsx`.
- **`usePredictions` usa `getDocs`** (no `onSnapshot`) para evitar el mismo bug con el emulador. Llamar a `refresh()` después de guardar para actualizar el estado.
- **`useAllMatchdayPredictions` también usa `getDocs`** — mismo motivo. El fetch se dispara lazy solo cuando `enabled = true` (al activar el tab "Ver todos").
- **Leaderboard requiere leer colección completa de `users`** — la regla de Firestore debe permitir `read` a `isAllowedUser()` sin restricción de `userId`. Una regla `request.auth.uid == userId` rompe el query de colección silenciosamente.
- **Bloqueo por partido**: `MatchdayPredictions` calcula `matchReadOnly = readOnly || match.scheduledAt.toDate() <= new Date()` por cada partido. No confundir con `readOnly` que aplica a la jornada entera.
- **Zona horaria UTC** — toda fecha/hora se almacena y muestra en UTC. `toLocaleString` usa `timeZone: 'UTC'`.
- **Batch limit**: máximo 499 ops por batch (cliente) / 500 (admin SDK en functions).
- **`!= null`** — usar desigualdad débil cuando un valor puede ser `null` o `undefined`. `!== null` no captura `undefined`.
- **Functions hot-reload**: no existe. Hacer `cd functions && npm run build` antes de reiniciar el emulador para ver cambios.
- **`pull-from-prod`**: lee `service-account.json` de la raíz si existe; si no, cae a la variable `FIREBASE_SERVICE_ACCOUNT`. No poner el JSON directamente en `.env.local` — la clave privada tiene saltos de línea que `dotenv` no maneja.

---

## Deploy a producción

```bash
# 1. Asegurarse de apuntar a producción
echo "VITE_USE_EMULATORS=false" > .env.local

# 2. Build y deploy del frontend
npm run build
firebase deploy --only hosting

# 3. Build y deploy de Cloud Functions (requiere plan Blaze)
cd functions && npm run build && cd ..
firebase deploy --only functions

# 4. Si hay datos nuevos del emulador para subir a Firestore
npm run push-to-prod
```
