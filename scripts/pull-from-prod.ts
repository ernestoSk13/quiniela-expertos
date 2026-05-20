#!/usr/bin/env tsx
/**
 * Importa colecciones de Firestore de producción al emulador local.
 *
 * Requiere:
 *   1. Emuladores corriendo: npm run emulators
 *   2. Variable FIREBASE_SERVICE_ACCOUNT en .env.local con el JSON de la cuenta de servicio
 *
 * Uso:
 *   npm run pull-from-prod
 *   npm run pull-from-prod -- --collections teams,matchdays   (solo esas colecciones)
 */

import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, WriteBatch } from 'firebase-admin/firestore'

const PROJECT_ID = 'quinielaexpertos26'

const ALL_COLLECTIONS = ['teams', 'matchdays', 'matches']

// ── Parse CLI args ──────────────────────────────────────────────────────────
const collectionsArg = process.argv.find(a => a.startsWith('--collections='))
const COLLECTIONS = collectionsArg
  ? collectionsArg.replace('--collections=', '').split(',').map(s => s.trim())
  : ALL_COLLECTIONS

// ── Apps ────────────────────────────────────────────────────────────────────

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT.')
  console.error('   Agrégala en .env.local con el contenido JSON de la cuenta de servicio.')
  console.error('   Descárgalo en: Firebase Console → Configuración → Cuentas de servicio')
  process.exit(1)
}

let serviceAccount: object
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} catch {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT no contiene un JSON válido.')
  process.exit(1)
}

const prodApp = initializeApp(
  { credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId: PROJECT_ID },
  'prod',
)
const prodDb = getFirestore(prodApp)

const emulatorApp = initializeApp({ projectId: PROJECT_ID }, 'emulator')
const emulatorDb = getFirestore(emulatorApp)
emulatorDb.settings({ host: 'localhost:8080', ssl: false })

// ── Migration ────────────────────────────────────────────────────────────────

async function pullCollection(name: string): Promise<void> {
  const snap = await prodDb.collection(name).get()
  if (snap.empty) {
    console.log(`  ⚠️  ${name}: vacío en producción, se omite`)
    return
  }

  let batch: WriteBatch = emulatorDb.batch()
  let batchCount = 0
  let totalCount = 0

  for (const docSnap of snap.docs) {
    batch.set(emulatorDb.doc(`${name}/${docSnap.id}`), docSnap.data())
    batchCount++
    totalCount++

    if (batchCount === 499) {
      await batch.commit()
      batch = emulatorDb.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) await batch.commit()
  console.log(`  ✓ ${name}: ${totalCount} documentos`)
}

async function main() {
  console.log(`⬇️  Importando producción → emulador`)
  console.log(`   Colecciones: ${COLLECTIONS.join(', ')}\n`)

  for (const col of COLLECTIONS) {
    await pullCollection(col)
  }

  console.log('\n✅ Importación completada.')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Error en la importación:', err.message ?? err)
  process.exit(1)
})
