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

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, WriteBatch } from 'firebase-admin/firestore'

const PROJECT_ID = 'quinielaexpertos26'

const ALL_COLLECTIONS = ['teams', 'matchdays', 'matches', 'allowedUsers', 'users', 'config', 'predictions']

// ── Parse CLI args ──────────────────────────────────────────────────────────
const collectionsArg = process.argv.find(a => a.startsWith('--collections='))
const COLLECTIONS = collectionsArg
  ? collectionsArg.replace('--collections=', '').split(',').map(s => s.trim())
  : ALL_COLLECTIONS

// ── Apps ────────────────────────────────────────────────────────────────────

let serviceAccount: object

const SA_FILE = join(process.cwd(), 'service-account.json')

if (existsSync(SA_FILE)) {
  try {
    serviceAccount = JSON.parse(readFileSync(SA_FILE, 'utf8'))
    console.log('🔑 Usando service-account.json')
  } catch {
    console.error('❌ service-account.json no contiene un JSON válido.')
    process.exit(1)
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } catch {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT no contiene un JSON válido.')
    console.error('   Tip: descarga el JSON desde Firebase Console y guárdalo como service-account.json')
    process.exit(1)
  }
} else {
  console.error('❌ No se encontró service-account.json ni FIREBASE_SERVICE_ACCOUNT.')
  console.error('   Descarga el JSON en: Firebase Console → Configuración → Cuentas de servicio')
  console.error('   y guárdalo como service-account.json en la raíz del proyecto.')
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
