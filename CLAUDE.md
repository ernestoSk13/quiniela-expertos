# CLAUDE.md — Quiniela Expertos del Mundial 2026

App de quiniela para el Mundial FIFA 2026. Stack: **React 19 + TypeScript + Vite 6 + Firebase + Tailwind CSS v4**.

Lee `AGENTS.md` para el contexto completo del proyecto, modelos de datos y reglas de negocio.

---

## Reglas de los Agentes — cuándo invocar cada uno

**Invocar agentes solo cuando aplica directamente al cambio en curso. No invocar por defecto.**

| Agente | Invocar cuando... | NO invocar cuando... |
|--------|-------------------|----------------------|
| `chief-architect` | Diseño de features nuevas, decisiones de arquitectura, refactors significativos | Bugfixes o cambios de UI menores |
| `firebase-firestore-auditor` | Se modifican `firestore.rules`, `firestore.indexes.json`, queries Firestore, Cloud Functions | Cambios puramente en componentes React |
| `security-guardian` | Se toca auth, manejo de tokens/invites, Firestore rules, variables de entorno | Cambios visuales, refactors internos sin superficie de ataque |
| `prompt-token-optimizer` | Antes de tareas que requieren leer muchos archivos o contexto largo | Operaciones simples en 1-2 archivos |
| `ui-ux-reviewer` | Antes de hacer PR o al finalizar un feature completo | Mid-implementation, cambios de lógica sin UI |
| `technical-writer` | Al completar un feature (actualizar AGENTS.md, DEV.md) | Durante la implementación |

### Orden recomendado para una feature nueva

1. `chief-architect` → diseño (una vez)
2. Implementación
3. `firebase-firestore-auditor` (si toca Firestore) + `security-guardian` (si toca auth/rules)
4. `ui-ux-reviewer` → antes de dar por terminado
5. `technical-writer` → actualizar docs si hay cambios de API o flujos nuevos

### Reglas de paralelización

- **Lanzar en paralelo** agentes sin dependencia entre sí (ej. `firebase-firestore-auditor` + `security-guardian` sobre archivos distintos).
- **Dar contexto acotado** — indicar exactamente qué archivos y líneas revisar. Nunca "revisa el proyecto".
- **El orquestador decide, el agente ejecuta** — no delegar decisiones de arquitectura a subagentes; solo tareas con output concreto (diff, tipos TS, reglas de Firestore).
- **`prompt-token-optimizer` primero** — invocarlo antes de cualquier sesión donde se vayan a lanzar múltiples agentes.

---

## Convenciones críticas (resumen rápido)

- **Sin `<StrictMode>`** — rompe el emulador de Firestore
- **`getDocs` en lugar de `onSnapshot`** para queries compuestas (bug del emulador)
- **Sin colores hardcodeados de acento** — usar `var(--accent)`, `var(--accent-hover)`, etc.
- **Excepción:** componentes off-screen para html2canvas usan `COLORS` record con valores literales
- **Puntos siempre server-side** — el cliente nunca calcula puntos
- **`!= null`** para chequear `null | undefined` (no `!== null`)
- **Todos los archivos `.tsx` / `.ts`** — sin `any` explícito, sin `React.FC<>`
- **Firestore en `src/services/`** — los componentes no llaman a `collection()` / `doc()` directamente

---

## Verificación local obligatoria antes de commit o deploy

**REGLA ABSOLUTA: Nunca hacer `git commit`, `git push` ni `firebase deploy` sin antes pedirle al desarrollador que pruebe los cambios en localhost y confirme que funcionan.**

### Flujo obligatorio

1. Terminar la implementación
2. **Parar** — no hacer commit todavía
3. Decirle al desarrollador exactamente qué probar y cómo
4. Esperar confirmación explícita ("funciona", "listo", "dale", etc.)
5. Solo entonces hacer commit y/o deploy

### Instrucciones de prueba local según el tipo de cambio

**Cambio de UI / componentes React:**
```bash
# Terminal 1 — si no está corriendo ya:
npm run dev
# Abrir http://localhost:5173
```
Indicar: qué pantalla abrir, qué interacciones hacer, qué debe verse diferente.

**Cambio que involucra Firestore / Auth / Cloud Functions:**
```bash
# Terminal 1
npm run emulators

# Terminal 2 — primera vez o después de resetear datos:
npm run seed
# Luego:
npm run dev
# Abrir http://localhost:5173
# Emulator UI: http://localhost:4000
```
Indicar: qué usuario usar, qué datos crear/modificar, qué verificar en Firestore.

**Cambio en Cloud Functions:**
```bash
# Después de editar functions/src/index.ts:
cd functions && npm run build && cd ..
# Reiniciar emuladores (Ctrl+C y volver a correr):
npm run emulators
```
Indicar: qué acción en el admin dispara la función, qué documentos de Firestore revisar.

**Cambio en Firestore rules:**
```bash
npm run emulators   # Las rules se recargan automáticamente al iniciar
```
Indicar: qué operación debe ser permitida / bloqueada y con qué usuario.

### Formato de las instrucciones

Al terminar una implementación, siempre dar este bloque antes del commit:

```
✋ Antes de hacer commit, prueba esto en localhost:

1. [Comando para levantar el entorno si es necesario]
2. [URL o pantalla a abrir]
3. [Acción específica a realizar]
4. [Qué debe verse / qué debe pasar]
5. [Edge case o caso negativo a verificar si aplica]

Cuando confirmes que funciona, hago el commit.
```

### Deploy a producción

Solo después de que el desarrollador haya probado en localhost Y haya dado el OK explícito:

```bash
# Cambiar a producción
sed -i '' 's/VITE_USE_EMULATORS=true/VITE_USE_EMULATORS=false/' .env.local

# Build y deploy frontend
npm run build
firebase deploy --only hosting

# Deploy Cloud Functions (solo si cambiaron)
cd functions && npm run build && cd ..
firebase deploy --only functions

# Restaurar entorno de desarrollo
sed -i '' 's/VITE_USE_EMULATORS=false/VITE_USE_EMULATORS=true/' .env.local
```

**Verificar antes de deploy:** `.env.local` debe tener `VITE_USE_EMULATORS=false`. Si está en `true`, la app de producción apuntará al emulador local y no funcionará.

---

## Pendientes activos

- **Modo claro (T8)** — rama `feat/T8-light-mode` existe pero está pausada. El CSS de overrides de Tailwind no fue suficiente para cubrir los inline styles `rgba(255,255,255,X)` que hay en muchos componentes. Requiere una refactorización más profunda de variables CSS de texto antes de completarse.
