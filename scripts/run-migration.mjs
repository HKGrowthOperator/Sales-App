#!/usr/bin/env node
// ============================================================
// Migration-Runner — führt SQL-Dateien gegen DATABASE_URL aus.
// Nutzung:  node scripts/run-migration.mjs supabase/migrations/014_*.sql [weitere...]
// Liest DATABASE_URL aus .env.local (nie committen!).
// Benötigt das pg-Paket:  npm i -D pg
// Alternative: SQL im Supabase SQL-Editor ausführen.
// ============================================================
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const url = process.env.DATABASE_URL
if (!url) {
  console.error('❌ DATABASE_URL fehlt (in .env.local hinterlegen).')
  process.exit(1)
}
const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Nutzung: node scripts/run-migration.mjs <migration.sql> [...]')
  process.exit(1)
}

let pg
try {
  pg = await import('pg')
} catch {
  console.error('❌ pg-Paket fehlt. Installieren mit:  npm i -D pg')
  console.error('   Oder die SQL-Datei im Supabase SQL-Editor ausführen.')
  process.exit(1)
}

const client = new pg.default.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  for (const f of files) {
    const sql = readFileSync(resolve(process.cwd(), f), 'utf8')
    process.stdout.write(`→ ${f} … `)
    await client.query('begin')
    try {
      await client.query(sql)
      await client.query('commit')
      console.log('✅')
    } catch (e) {
      await client.query('rollback')
      console.log('❌')
      console.error(`   ${e.message}`)
      process.exitCode = 1
      break
    }
  }
} finally {
  await client.end()
}
