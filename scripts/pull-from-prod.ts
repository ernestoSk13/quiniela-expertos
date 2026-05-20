#!/usr/bin/env tsx
/**
 * Importa colecciones de Firestore de producción al emulador local.
 *
 * Requiere:
 *   1. Emuladores corriendo: npm run emulators
 *   2. service-account.json en la raíz del proyecto
 *
 * Uso:
 *   npm run pull-from-prod
 *   npm run pull-from-prod -- --collections teams,matchdays   (solo esas colecciones)
 */

import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, WriteBatch } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ID = 'quinielaexpertos26'
const SERVICE_ACCOUNT_PATH = resolve(process.cwd(), 'service-account.json')

const ALL_COLLECTIONS = ['teams', 'matchdays', 'matches']

// ── Parse CLI args ──────────────────────────────────────────────────────────
const collectionsArg = process.argv.find(a => a.startsWith('--collections='))
const COLLECTIONS = collectionsArg
  ? collectionsArg.replace('--collections=', '').split(',').map(s => s.trim())
  : ALL_COLLECTIONS

// ── Apps ────────────────────────────────────────────────────────────────────

let serviceAccount: object
try {
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
} catch {
  console.error('❌ No se encontró service-account.json en la raíz del proyecto.')
  console.error('   Descárgalo en: Firebase Console → Configuración → Cuentas de servicio')
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
