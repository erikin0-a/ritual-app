#!/usr/bin/env node
/**
 * generate-phrases.js
 *
 * Предгенерирует все фразы сценария через ElevenLabs и загружает в Supabase Storage.
 * Имена партнёров НЕ генерирует — только статические фразы.
 *
 * Запуск: node tools/scripts/generate-phrases.js
 * Dry run: node tools/scripts/generate-phrases.js --dry-run
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const https = require('https')
const fs = require('fs')
const path = require('path')

// Локальный кэш сгенерированных файлов
const LOCAL_CACHE_DIR = path.join(__dirname, '../../.phrase-cache')

// ─── Config ──────────────────────────────────────────────────────────────────

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID
const MODEL_ID = process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5'
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BUCKET = process.env.EXPO_PUBLIC_GUIDED_AUDIO_BUCKET || 'guided-audio'
const PHRASE_PREFIX = process.env.EXPO_PUBLIC_GUIDED_AUDIO_PHRASE_PREFIX || 'guided-phrases'
const VOICE_PROFILE = process.env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE || 'marusya-romantic-v1'

const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_EXISTING = !process.argv.includes('--force')
const DELAY_MS = 800 // пауза между запросами чтобы не флудить API

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripSsml(text) {
  return text
    .replace(/<break[^>]*\/>/g, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function fastHash(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

function sanitizeForStorage(value) {
  const normalized = stripSsml(value)
    .trim()
    .toLowerCase()
    .replace(/[а-яё]/g, c => {
      const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
      return map[c] || c
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return normalized.length > 0 ? normalized : 'segment'
}

function buildStoragePath(text) {
  const clean = text.trim()
  const key = sanitizeForStorage(clean)
  return `${PHRASE_PREFIX}/${VOICE_PROFILE}/${key}-${fastHash(clean)}.mp3`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────

function generateAudio(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3 }
    })

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, res => {
      if (res.statusCode !== 200) {
        let err = ''
        res.on('data', d => err += d)
        res.on('end', () => reject(new Error(`ElevenLabs ${res.statusCode}: ${err}`)))
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────

function uploadToSupabase(storagePath, buffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'x-upsert': 'true'
      }
    }

    const req = https.request(options, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) resolve(body)
        else reject(new Error(`Supabase ${res.statusCode}: ${body}`))
      })
    })

    req.on('error', reject)
    req.write(buffer)
    req.end()
  })
}

function checkExists(storagePath) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`)
    const options = { hostname: url.hostname, path: url.pathname, method: 'HEAD' }
    const req = https.request(options, res => resolve(res.statusCode === 200))
    req.on('error', () => resolve(false))
    req.end()
  })
}

// ─── Load catalog ─────────────────────────────────────────────────────────────

function loadCatalog() {
  const catalogPath = path.join(__dirname, '../../constants/voice-script-catalog.ts')
  const content = fs.readFileSync(catalogPath, 'utf8')

  const catalog = {}
  const regex = /(\w+):\s*\n?\s*'([\s\S]*?)(?<!\\)',/g
  let match

  // simpler extraction
  const lines = content.split('\n')
  let currentKey = null
  let currentValue = ''
  let inValue = false

  for (const line of lines) {
    if (!inValue) {
      const keyMatch = line.match(/^\s+(\w+):\s*$/) || line.match(/^\s+(\w+):\s*'(.*)/)
      if (keyMatch) {
        currentKey = keyMatch[1]
        if (keyMatch[2] !== undefined) {
          const val = keyMatch[2]
          if (val.endsWith("',")) {
            catalog[currentKey] = val.slice(0, -2)
            currentKey = null
          } else if (val.endsWith("'")) {
            catalog[currentKey] = val.slice(0, -1)
            currentKey = null
          } else {
            currentValue = val
            inValue = true
          }
        } else {
          inValue = true
          currentValue = ''
        }
      }
    } else {
      const trimmed = line.trim()
      if (trimmed.endsWith("',")) {
        const chunk = trimmed.slice(0, -2).replace(/^'/, '')
        currentValue += currentValue ? ' ' + chunk : chunk
        catalog[currentKey] = currentValue.trim()
        currentKey = null
        currentValue = ''
        inValue = false
      } else {
        const chunk = trimmed.replace(/^'/, '')
        currentValue += currentValue ? ' ' + chunk : chunk
      }
    }
  }

  return catalog
}

// ─── Split into phrase segments (skip name placeholders) ─────────────────────

function extractPhraseSegments(text) {
  // Split on {{p1.name}} and {{p2.name}} — collect only phrase parts
  const parts = text.split(/\{\{p[12]\.name\}\}/)
  return parts.map(p => p.trim()).filter(p => p.length > 2)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎙  Ritual Audio Pre-Generator')
  console.log('================================')
  console.log(`Model: ${MODEL_ID}`)
  console.log(`Voice: ${VOICE_ID}`)
  console.log(`Bucket: ${BUCKET}`)
  if (DRY_RUN) console.log('⚠️  DRY RUN — файлы генерироваться не будут\n')
  if (SKIP_EXISTING) console.log('ℹ️  Пропускаем уже существующие файлы (--force чтобы перезаписать)\n')

  const catalog = loadCatalog()
  const keys = Object.keys(catalog)
  console.log(`Загружен каталог: ${keys.length} фраз\n`)

  // Collect all unique phrase segments
  const segmentMap = new Map() // storagePath → { text, keys[] }

  for (const [key, template] of Object.entries(catalog)) {
    const segments = extractPhraseSegments(template)
    for (const seg of segments) {
      const clean = stripSsml(seg)
      if (clean.length < 3) continue
      const storagePath = buildStoragePath(clean)
      if (!segmentMap.has(storagePath)) {
        segmentMap.set(storagePath, { text: clean, keys: [key] })
      } else {
        segmentMap.get(storagePath).keys.push(key)
      }
    }
  }

  const segments = Array.from(segmentMap.entries())
  console.log(`Уникальных сегментов для генерации: ${segments.length}`)

  const totalChars = segments.reduce((sum, [, { text }]) => sum + text.length, 0)
  const costFlash = (totalChars / 1000 * 0.08).toFixed(3)
  const costV3 = (totalChars / 1000 * 0.18).toFixed(3)
  console.log(`Символов: ${totalChars} | Стоимость: $${costFlash} (flash) / $${costV3} (v3)\n`)

  let generated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < segments.length; i++) {
    const [storagePath, { text, keys }] = segments[i]
    const progress = `[${i + 1}/${segments.length}]`

    if (SKIP_EXISTING && !DRY_RUN) {
      const exists = await checkExists(storagePath)
      if (exists) {
        console.log(`${progress} ⏭  ${keys[0]} — уже существует`)
        skipped++
        continue
      }
    }

    if (DRY_RUN) {
      console.log(`${progress} 🔍 DRY: "${text.slice(0, 60)}..." → ${storagePath}`)
      continue
    }

    try {
      // Локальный путь кэша
      const cacheFile = path.join(LOCAL_CACHE_DIR, path.basename(storagePath))

      let audioBuffer

      // Используем локальный кэш если есть
      if (fs.existsSync(cacheFile)) {
        process.stdout.write(`${progress} 📁  "${text.slice(0, 50)}..." (из кэша)`)
        audioBuffer = fs.readFileSync(cacheFile)
      } else {
        process.stdout.write(`${progress} 🎙  "${text.slice(0, 50)}..."`)
        audioBuffer = await generateAudio(text)
        // Сохраняем локально
        fs.mkdirSync(LOCAL_CACHE_DIR, { recursive: true })
        fs.writeFileSync(cacheFile, audioBuffer)
        await sleep(DELAY_MS)
      }

      await uploadToSupabase(storagePath, audioBuffer)
      console.log(` ✅ (${audioBuffer.length} bytes)`)
      generated++
    } catch (err) {
      console.log(` ❌ ${err.message}`)
      failed++
    }
  }

  console.log('\n================================')
  console.log(`✅ Сгенерировано: ${generated}`)
  console.log(`⏭  Пропущено:    ${skipped}`)
  console.log(`❌ Ошибок:       ${failed}`)
  console.log('================================')

  if (generated > 0) {
    console.log('\n🚀 Фразы загружены в Supabase Storage.')
    console.log(`   Bucket: ${BUCKET}/${PHRASE_PREFIX}/${VOICE_PROFILE}/`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
