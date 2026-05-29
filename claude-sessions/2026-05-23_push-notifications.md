# Resumen de sesión — 23 May 2026

Sesión enfocada en implementar notificaciones push con Firebase Cloud Messaging (FCM).

---

## Push Notifications (Fase 11 — completada)

**Commit:** `8fd1e00`

### Arquitectura

**Cliente:**
- `public/firebase-messaging-sw.js` — service worker con compat SDK de CDN (gstatic). Maneja notificaciones cuando la app está en background o cerrada. Config de Firebase hardcodeada (aceptable, es pública).
- `src/hooks/usePushNotifications.ts` — hook que gestiona: detección de soporte, solicitud de permiso, obtención de token FCM con VAPID key, guardado en Firestore, borrado al desactivar. No se inicializa con emuladores activos.
- `src/lib/firebase.ts` — se exportó `app` (antes era solo `const`).
- `src/types/User.ts` — añadido `fcmToken?: string`.
- `src/services/firestoreUsers.ts` — añadida `saveFcmToken(uid, token | null)`.
- `src/pages/Dashboard/Dashboard.tsx` — botón campana en el header: outline = off, acento = on, spinner = cargando. Solo visible cuando `push.isSupported`.

**Cloud Functions (nuevas):**
- `sendDeadlineReminders` — `onSchedule('every 60 minutes')`. Detecta jornadas `open` con `predictionDeadline` en ventana de 50-70 min, envía push a todos los usuarios con token.
- `notifyResultsPublished` — `onDocumentUpdated('matchdays/{matchdayId}')`. Detecta transición de `open/upcoming` → `closed/finished`, envía push de resultados.
- `getFcmTokens()` + `sendPush()` — helpers internos. `sendPush` limpia tokens inválidos de Firestore tras errores de envío.

### Decisiones

- **Permiso:** botón campana voluntario en el header (no banner invasivo).
- **Timing recordatorio:** ventana 50-70 min antes del deadline (cron hourly siempre captura al menos una vez).
- **iOS:** campana oculta si `'Notification' in window === false` — en iOS Safari sin PWA no se soporta. Se habilitará cuando se implemente PWA.
- **Multi-dispositivo:** `fcmToken` es un solo string por usuario (el último dispositivo que se registra). Suficiente para el caso de uso actual.
- **Costo:** FCM gratis. Cloud Scheduler usa 1 de 3 jobs gratis del free tier.

### VAPID Key
Configurada en `.env.local` como `VITE_VAPID_KEY`. Generada en Firebase Console → Project Settings → Cloud Messaging → Web Push certificates.

### Prueba
- Token registration: ✅ verificado en Firestore Console
- `notifyResultsPublished`: ✅ push recibida al cerrar jornada desde admin

---

## Tareas pendientes

- **PWA** — `manifest.json` + service worker de instalación; habilitaría push en iOS 16.4+. Está en IDEAS.md.
- No quedan pendientes de Fase 11.
