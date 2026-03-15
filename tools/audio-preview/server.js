#!/usr/bin/env node
/**
 * Audio Preview Tool — сервер
 * Запуск: cd tools/audio-preview && node server.js
 * Открыть: http://localhost:3333
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const express = require('express')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// ─── Config ──────────────────────────────────────────────────────────────────

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID
const MODEL_ID = process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_v3'
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BUCKET = process.env.EXPO_PUBLIC_GUIDED_AUDIO_BUCKET || 'guided-audio'
const PHRASE_PREFIX = process.env.EXPO_PUBLIC_GUIDED_AUDIO_PHRASE_PREFIX || 'guided-phrases'
const VOICE_PROFILE = process.env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE || 'marusya-romantic-v1'
const CATALOG_PATH = path.join(__dirname, '../../constants/voice-script-catalog.ts')

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
      const map = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
        к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
        х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
      }
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

function interpolateNames(text, p1Name, p2Name) {
  return text
    .replace(/\{\{p1\.name\}\}/g, p1Name || 'Партнёр 1')
    .replace(/\{\{p2\.name\}\}/g, p2Name || 'Партнёр 2')
}

function roundLabel(key) {
  if (key.startsWith('prelude_') || key.startsWith('transition_')) return 'Пролог'
  const m = key.match(/^round_(\d+)/)
  if (!m) return 'Прочее'
  const n = parseInt(m[1])
  if (n === 0) return 'Раунд 1'
  if (n === 1) return 'Раунд 1'
  return `Раунд ${n}`
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

function loadCatalog() {
  const content = fs.readFileSync(CATALOG_PATH, 'utf8')
  const catalog = {}
  const lines = content.split('\n')
  let currentKey = null
  let currentValue = ''
  let inValue = false
  let valueStartsNextLine = false // key: \n   'value...'

  for (const line of lines) {
    if (!inValue) {
      if (valueStartsNextLine) {
        // This line should be the start of the value
        valueStartsNextLine = false
        const trimmed = line.trim()
        if (trimmed.startsWith("'")) {
          const inner = trimmed.slice(1) // strip leading quote
          if (inner.endsWith("',")) {
            catalog[currentKey] = inner.slice(0, -2)
            currentKey = null
          } else if (inner.endsWith("'")) {
            catalog[currentKey] = inner.slice(0, -1)
            currentKey = null
          } else {
            currentValue = inner
            inValue = true
          }
        }
        continue
      }
      // key only: "  round_1_task_01:"
      const keyOnly = line.match(/^\s+(\w+):\s*$/)
      if (keyOnly) {
        currentKey = keyOnly[1]
        valueStartsNextLine = true
        continue
      }
      // single-line: "  key: 'value',"
      const oneliner = line.match(/^\s+(\w+):\s*'(.*)',\s*$/)
      if (oneliner) {
        catalog[oneliner[1]] = oneliner[2]
        continue
      }
      // key + start of value: "  key: 'value..."
      const startMulti = line.match(/^\s+(\w+):\s*'(.*)$/)
      if (startMulti) {
        currentKey = startMulti[1]
        const val = startMulti[2]
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
      }
    } else {
      const trimmed = line.trim()
      if (trimmed.endsWith("',")) {
        currentValue += ' ' + trimmed.slice(0, -2)
        catalog[currentKey] = currentValue.replace(/\s+/g, ' ').trim()
        currentKey = null
        currentValue = ''
        inValue = false
      } else {
        currentValue += ' ' + trimmed
      }
    }
  }

  return catalog
}

function saveCueToCatalog(key, newText) {
  let content = fs.readFileSync(CATALOG_PATH, 'utf8')

  // Find and replace the value for this key
  // Handle both single-line and multi-line values
  const singleLineRegex = new RegExp(`(\\s+${key}:\\s*')([^']*)(')`, 'g')
  if (singleLineRegex.test(content)) {
    content = content.replace(new RegExp(`(\\s+${key}:\\s*')([^']*)(')`), `$1${newText}$3`)
  } else {
    // Multi-line: find key and replace until closing quote
    const lines = content.split('\n')
    let inTarget = false
    const result = []
    for (const line of lines) {
      if (!inTarget && line.match(new RegExp(`^\\s+${key}:\\s*`))) {
        inTarget = true
        result.push(`  ${key}:`)
        result.push(`    '${newText}',`)
        continue
      }
      if (inTarget) {
        if (line.trim().endsWith("',") || line.trim() === "'") {
          inTarget = false
        }
        continue
      }
      result.push(line)
    }
    content = result.join('\n')
  }

  fs.writeFileSync(CATALOG_PATH, content, 'utf8')
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────

function generateTTS(text) {
  return new Promise((resolve, reject) => {
    const cleanText = stripSsml(text)
    const body = JSON.stringify({
      text: cleanText,
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
        res.on('data', d => (err += d))
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

function checkSupabaseExists(storagePath) {
  return new Promise(resolve => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`)
    const opts = { hostname: url.hostname, path: url.pathname + url.search, method: 'HEAD' }
    const req = https.request(opts, res => resolve(res.statusCode === 200))
    req.on('error', () => resolve(false))
    req.end()
  })
}

function uploadToSupabase(storagePath, buffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'x-upsert': 'true'
      }
    }

    const req = https.request(options, res => {
      let body = ''
      res.on('data', d => (body += d))
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

function getSupabasePublicUrl(storagePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/catalog — return all cues grouped by round
app.get('/api/catalog', (req, res) => {
  try {
    const catalog = loadCatalog()
    const groups = {}

    const roundOrder = ['Пролог', 'Раунд 1', 'Раунд 2', 'Раунд 3', 'Раунд 4', 'Раунд 5']
    for (const r of roundOrder) groups[r] = []

    for (const [key, text] of Object.entries(catalog)) {
      const round = roundLabel(key)
      if (!groups[round]) groups[round] = []
      groups[round].push({ key, text })
    }

    res.json({ groups, roundOrder })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/speak — TTS for preview (full interpolated text)
// Body: { text, p1Name, p2Name }
// Returns: audio/mpeg
app.post('/api/speak', async (req, res) => {
  const { text, p1Name, p2Name } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })

  try {
    const interpolated = interpolateNames(text, p1Name, p2Name)
    const audio = await generateTTS(interpolated)
    res.set('Content-Type', 'audio/mpeg')
    res.send(audio)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/regenerate — regenerate phrase (without names), upload to Supabase
// Body: { key, text, p1Name, p2Name }
// Returns: { url, storagePath }
app.post('/api/regenerate', async (req, res) => {
  const { key, text, p1Name, p2Name } = req.body
  if (!key || !text) return res.status(400).json({ error: 'key and text required' })

  try {
    // Extract phrase segments (split on name placeholders)
    const parts = text.split(/\{\{p[12]\.name\}\}/)
    const phraseSegments = parts.map(p => p.trim()).filter(p => p.length > 2)

    const results = []

    for (const seg of phraseSegments) {
      const clean = stripSsml(seg)
      if (clean.length < 3) continue
      const storagePath = buildStoragePath(clean)

      console.log(`  Generating: "${clean.slice(0, 50)}..."`)
      const audio = await generateTTS(clean)
      await uploadToSupabase(storagePath, audio)
      results.push({ segment: clean, storagePath, url: getSupabasePublicUrl(storagePath) })
    }

    res.json({ ok: true, segments: results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/save-cue — update text in voice-script-catalog.ts
// Body: { key, text }
app.post('/api/save-cue', (req, res) => {
  const { key, text } = req.body
  if (!key || !text) return res.status(400).json({ error: 'key and text required' })

  try {
    saveCueToCatalog(key, text)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/check-audio/:key — check if audio exists in Supabase for a cue's phrase segments
app.get('/api/check-audio/:key', async (req, res) => {
  const { key } = req.params
  try {
    const catalog = loadCatalog()
    const text = catalog[key]
    if (!text) return res.status(404).json({ error: 'Key not found' })

    const parts = text.split(/\{\{p[12]\.name\}\}/)
    const phraseSegments = parts.map(p => p.trim()).filter(p => p.length > 2)

    const checks = await Promise.all(
      phraseSegments.map(async seg => {
        const clean = stripSsml(seg)
        const storagePath = buildStoragePath(clean)
        const exists = await checkSupabaseExists(storagePath)
        return { segment: clean.slice(0, 40), storagePath, exists }
      })
    )

    const allExist = checks.every(c => c.exists)
    res.json({ allExist, segments: checks })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = 3333
app.listen(PORT, () => {
  console.log(`\n🎙  Ritual Audio Preview Tool`)
  console.log(`================================`)
  console.log(`  URL:   http://localhost:${PORT}`)
  console.log(`  Voice: ${VOICE_ID || '(not configured)'}`)
  console.log(`  Model: ${MODEL_ID}`)
  console.log(`  Catalog: ${CATALOG_PATH}`)
  console.log(`================================\n`)

  if (!ELEVENLABS_API_KEY) console.warn('⚠️  EXPO_PUBLIC_ELEVENLABS_API_KEY not set')
  if (!SUPABASE_URL) console.warn('⚠️  EXPO_PUBLIC_SUPABASE_URL not set')
})
