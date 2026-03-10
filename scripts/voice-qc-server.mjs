import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import url from 'node:url'

const HOST = '127.0.0.1'
const PORT = Number(process.env.GUIDED_QC_PORT || process.argv[2] || 4317)
const MAX_PORT_TRIES = 20
const ROOT = process.cwd()

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk.toString('utf8')
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function loadPublicConfig() {
  try {
    const envPath = path.join(ROOT, '.env')
    const content = fs.readFileSync(envPath, 'utf8')
    const entries = content
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=')
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
      })

    const env = Object.fromEntries(entries)
    return {
      supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL || '',
      anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  } catch {
    return { supabaseUrl: '', anonKey: '' }
  }
}

function updateCueLine({ cueKey, variant, text }) {
  const scriptPath = path.join(ROOT, 'guided-ritual-script.md')
  const source = fs.readFileSync(scriptPath, 'utf8')
  const lines = source.split(/\r?\n/)
  const cueHeader = `#### Cue \`${cueKey}\``
  const cueIndex = lines.findIndex((line) => line.trim().startsWith(cueHeader))
  if (cueIndex === -1) {
    throw new Error(`Cue not found: ${cueKey}`)
  }

  const voiceIndex = lines.findIndex((line, index) => index > cueIndex && line.trim().startsWith('**Озвучка'))
  if (voiceIndex === -1) {
    throw new Error(`Voice block not found: ${cueKey}`)
  }

  let endIndex = lines.length
  for (let i = voiceIndex + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('#### Cue ') || trimmed.startsWith('### ') || trimmed === '---') {
      endIndex = i
      break
    }
  }

  const targetVariant = String(variant || 'base')
  let replaced = false

  if (targetVariant === 'A' || targetVariant === 'B') {
    const prefix = targetVariant === 'A' ? 'Вариант A:' : 'Вариант B:'
    for (let i = voiceIndex + 1; i < endIndex; i += 1) {
      const trimmed = lines[i].trim()
      if (trimmed.startsWith(prefix)) {
        lines[i] = `${prefix} ${text}`.trim()
        replaced = true
        break
      }
    }
  } else {
    for (let i = voiceIndex + 1; i < endIndex; i += 1) {
      const trimmed = lines[i].trim()
      if (!trimmed) continue
      if (trimmed.startsWith('(')) continue
      if (trimmed.startsWith('Вариант A:') || trimmed.startsWith('Вариант B:')) continue
      if (/^\[[^\]]+\]$/.test(trimmed)) continue
      lines[i] = text
      replaced = true
      break
    }
  }

  if (!replaced) {
    throw new Error(`Could not locate editable line for cue ${cueKey} variant ${targetVariant}`)
  }

  fs.writeFileSync(scriptPath, `${lines.join('\n')}\n`, 'utf8')
}

function resolvePath(requestPath) {
  const normalized = requestPath === '/' ? '/tools/voice-qc/index.html' : requestPath
  const absolute = path.resolve(ROOT, `.${normalized}`)
  if (!absolute.startsWith(ROOT)) return null
  return absolute
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/')
  if ((parsed.pathname || '/') === '/tools/voice-qc/update-cue' && req.method === 'POST') {
    readJsonBody(req)
      .then((payload) => {
        const cueKey = String(payload?.cueKey || '').trim()
        const variant = String(payload?.variant || 'base').trim()
        const text = String(payload?.text || '').trim()

        if (!cueKey || !text) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ error: 'cueKey and text are required' }))
          return
        }

        updateCueLine({ cueKey, variant, text })
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: true }))
      })
      .catch((error) => {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ error: error?.message || 'update failed' }))
      })
    return
  }

  if ((parsed.pathname || '/') === '/tools/voice-qc/config.json') {
    const payload = loadPublicConfig()
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    res.end(JSON.stringify(payload))
    return
  }

  const absolutePath = resolvePath(parsed.pathname || '/')
  if (!absolutePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  fs.stat(absolutePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    const ext = path.extname(absolutePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    })

    const stream = fs.createReadStream(absolutePath)
    stream.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Read error')
    })
    stream.pipe(res)
  })
})

function listenWithFallback(startPort) {
  let attempt = 0
  let currentPort = startPort

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE' && attempt < MAX_PORT_TRIES) {
      attempt += 1
      currentPort += 1
      console.log(`[guided:qc] Port in use. Retrying on ${HOST}:${currentPort}...`)
      setTimeout(() => {
        server.listen(currentPort, HOST)
      }, 100)
      return
    }

    console.error('[guided:qc] Failed to start server:', error?.message ?? error)
    process.exit(1)
  })

  server.on('listening', () => {
    console.log(`[guided:qc] Open http://${HOST}:${currentPort}`)
    console.log('[guided:qc] Press Ctrl+C to stop')
  })

  server.listen(currentPort, HOST)
}

listenWithFallback(PORT)

