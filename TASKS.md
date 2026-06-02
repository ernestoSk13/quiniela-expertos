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
**Estado:** Pendiente ⏳  
**Archivos afectados:** `src/types/User.ts`, `src/pages/Preferences/Preferences.tsx`, `src/hooks/useUserTimezone.ts` (nuevo), `src/pages/Dashboard/Dashboard.tsx`, `src/pages/Predictions/MatchdayPredictions.tsx`, `src/services/firestoreUsers.ts`

Los jugadores están en distintas zonas (CDMX = UTC-6/UTC-5, Tijuana/LA = UTC-8/UTC-7). Actualmente todos los horarios se muestran en UTC — los jugadores ven los partidos a horas que no corresponden a su ciudad.

### Estrategia

1. **Auto-detectar** la zona horaria del navegador como valor por defecto (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
2. **Permitir override manual** desde Preferencias (selector con las opciones más relevantes para los jugadores).
3. **Guardar en Firestore** en el campo `timezone?: string` del documento `users/{uid}` para que sea consistente entre dispositivos.

### Zona horaria en `User`

```ts
// src/types/User.ts — agregar campo opcional:
timezone?: string   // IANA timezone string, ej. 'America/Mexico_City'
```

### Hook `useUserTimezone`

```ts
// src/hooks/useUserTimezone.ts
// Lee user.timezone si existe; si no, devuelve el timezone del navegador.
// Exporta: { timezone: string }
```

### Opciones del selector en Preferencias

| Label mostrado | IANA string |
|----------------|-------------|
| Ciudad de México (UTC-6) | `America/Mexico_City` |
| Tijuana / Los Ángeles (UTC-8) | `America/Los_Angeles` |
| Cancún (UTC-5, sin cambio de horario) | `America/Cancun` |
| Detectar automáticamente | `''` (vacío = usar browser) |

### Dónde reemplazar `timeZone: 'UTC'`

Buscar todos los `toLocaleString` y `toLocaleDateString` con `timeZone: 'UTC'` en los componentes de UI (no en Cloud Functions ni en el admin de resultados — el admin sigue ingresando en UTC). Reemplazar con el timezone del usuario via el hook.

Archivos clave a revisar:
- `src/pages/Dashboard/Dashboard.tsx` — `formatDeadline`
- `src/pages/Predictions/MatchdayPredictions.tsx` — horas de partidos
- `src/pages/Admin/MatchdayDetail.tsx` — **NO cambiar** (admin ingresa en UTC)

### Nota importante
El admin **sigue ingresando marcadores y tiempos en UTC**. Solo la visualización para jugadores cambia. No modificar el formato de guardado en Firestore.

---

## T5 — Onboarding: reemplazar paso "Instalar" por "Guardar acceso directo"
**Estado:** Pendiente ⏳  
**Archivo afectado:** `src/pages/Onboarding/StepInstall.tsx`

El paso actual enseña a instalar la PWA, pero muchos usuarios simplemente quieren guardar un acceso rápido sin instalar una "app". Reemplazar las instrucciones de instalación por instrucciones de **bookmark / acceso directo** según el dispositivo.

### Instrucciones por plataforma

| Plataforma | Pasos |
|------------|-------|
| **iOS Safari** | 1. Toca el botón Compartir (cuadro con flecha ↑). 2. Desplázate y selecciona "Añadir marcador". 3. Elige "Favoritos" y toca "Guardar". |
| **Android Chrome** | 1. Toca el menú (⋮) en la esquina superior derecha. 2. Toca el ícono ⭐ o "Añadir a Marcadores". |
| **Desktop** | Presiona **Ctrl+D** (Windows/Linux) o **⌘+D** (Mac) para guardar en favoritos. |

### Cambios en el componente
- Título: "Guarda el acceso" (en lugar de "Instala la app")
- Beneficios chips: "Acceso rápido" / "Siempre a mano" / "Sin perder la URL"
- Ilustración: reemplazar el ícono de teléfono con instalación por un ícono de bookmark/estrella con glow
- Botones: "Listo, ya lo guardé" / "Omitir por ahora" (misma lógica de `onDone`)
- El `detectPlatform()` existente se puede reutilizar tal cual
