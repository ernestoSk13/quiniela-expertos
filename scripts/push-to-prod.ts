#!/usr/bin/env tsx
/**
 * Migra colecciones del emulador local a Firestore de producción.
 *
 * Requiere:
 *   1. Emuladores corriendo: npm run emulators
 *   2. service-account.json en la raíz del proyecto
 *
 * Uso:
 *   npm run push-to-prod
 *   npm run push-to-prod -- --collections teams,matchdays   (solo esas colecciones)
 */

import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, WriteBatch } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ID = 'quinielaexpertos26'
const SERVICE_ACCOUNT_PATH = resolve(process.cwd(), 'service-account.json')

const ALL_COLLECTIONS = ['teams', 'matchdays', 'matches', 'allowedUsers']

// ── Parse CLI args ──────────────────────────────────────────────────────────
const collectionsArg = process.argv.find(a => a.startsWith('--collections='))
const COLLECTIONS = collectionsArg
  ? collectionsArg.replace('--collections=', '').split(',').map(s => s.trim())
  : ALL_COLLECTIONS

// ── Apps ────────────────────────────────────────────────────────────────────

const emulatorApp = initializeApp({ projectId: PROJECT_ID }, 'emulator')
const emulatorDb = getFirestore(emulatorApp)
emulatorDb.settings({ host: 'localhost:8080', ssl: false })

let serviceAccount: object
try {
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
} catch {
  console.error('❌ No se encontró service-account.json en la raíz del proyecto.')
  console.error('   Descárgalo en: Firebase Console → Configuración → Cuentas de servicio')
  process.exit(1)
}

const prodApp = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId: PROJECT_ID }, 'prod')
const prodDb = getFirestore(prodApp)

// ── Migration ────────────────────────────────────────────────────────────────

async function migrateCollection(name: string): Promise<void> {
  const snap = await emulatorDb.collection(name).get()
  if (snap.empty) {
    console.log(`  ⚠️  ${name}: vacío, se omite`)
    return
  }

  // Firestore batch: max 500 ops. Usamos flush automático.
  let batch: WriteBatch = prodDb.batch()
  let batchCount = 0
  let totalCount = 0

  for (const docSnap of snap.docs) {
    batch.set(prodDb.doc(`${name}/${docSnap.id}`), docSnap.data())
    batchCount++
    totalCount++

    if (batchCount === 499) {
      await batch.commit()
      batch = prodDb.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) await batch.commit()
  console.log(`  ✓ ${name}: ${totalCount} documentos`)
}

async function main() {
  console.log(`🚀 Migrando emulador → producción`)
  console.log(`   Colecciones: ${COLLECTIONS.join(', ')}\n`)

  for (const col of COLLECTIONS) {
    await migrateCollection(col)
  }

  console.log('\n✅ Migración completada.')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Error en la migración:', err.message ?? err)
  process.exit(1)
})
