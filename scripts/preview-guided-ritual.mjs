import fs from 'node:fs'
import path from 'node:path'

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const content = fs.readFileSync(envPath, 'utf8')
  const entries = content
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=')
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
    })

  return Object.fromEntries(entries)
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function normalizeForPreviewTts(text) {
  return text
    .replace(/\{\{p1\.name\}\}|\{\{p2\.name\}\}/g, '…')
    .replace(/<break[^>]*\/>/g, '…')
    // Keep v3 audio tags, but map our common script tags
    // to tags that are more likely to be interpreted correctly.
    .replace(/\[pause\]|\[pauses\]|\[slower\]|\[slow\]/gi, '[pause]')
    .replace(/\[soft\]|\[calm\]/gi, '[calm]')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseVoiceBlocks(markdown) {
  const lines = markdown.split(/\r?\n/)
  const blocks = []

  let current = null
  let currentCueKey = null

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    const cueMatch = line.match(/^####\s+Cue\s+`([^`]+)`/)
    if (cueMatch) {
      currentCueKey = cueMatch[1]
    }

    if (line.trim().startsWith('**Озвучка')) {
      current = {
        cueKey: currentCueKey,
        startLine: i + 1,
        common: [],
        a: [],
        b: [],
      }
      continue
    }

    if (!current) continue

    const trimmed = line.trim()
    if (!trimmed) {
      blocks.push(current)
      current = null
      continue
    }

    if (trimmed.startsWith('(') || trimmed.startsWith('---') || trimmed.startsWith('#### ')) {
      blocks.push(current)
      current = null
      continue
    }

    const aMatch = trimmed.match(/^Вариант A:\s*(.*)$/)
    if (aMatch) {
      current.a.push(aMatch[1])
      continue
    }

    const bMatch = trimmed.match(/^Вариант B:\s*(.*)$/)
    if (bMatch) {
      current.b.push(bMatch[1])
      continue
    }

    current.common.push(trimmed)
  }

  if (current) blocks.push(current)
  return blocks
}

async function fetchPreviewAudio({ supabaseUrl, anonKey, functionName, text }) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    signal: AbortSignal.timeout(90_000),
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error ?? `preview failed status=${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function main() {
  const env = loadEnvFile()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  const functionName = 'guided-audio-preview'

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env')
  }

  const tagArg = process.argv[2]
  const tagFromEnv =
    env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE ||
    env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID ||
    null
  const tag = slugify(tagArg || tagFromEnv || 'preview')

  const markdownPath = path.join(process.cwd(), 'guided-ritual-script.md')
  const markdown = fs.readFileSync(markdownPath, 'utf8')
  const blocks = parseVoiceBlocks(markdown)

  const outDir = path.join(process.cwd(), '.local', 'guided-ritual-preview', tag)
  fs.mkdirSync(outDir, { recursive: true })

  const manifest = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const baseName = block.cueKey ? `${block.cueKey}` : `section-${block.startLine}`
    const commonText = normalizeForPreviewTts(block.common.join(' '))

    const hasVariants = block.a.length > 0 || block.b.length > 0
    const variants = hasVariants
      ? [
          { id: 'A', text: normalizeForPreviewTts([commonText, block.a.join(' ')].filter(Boolean).join(' ')) },
          { id: 'B', text: normalizeForPreviewTts([commonText, block.b.join(' ')].filter(Boolean).join(' ')) },
        ].filter((v) => v.text)
      : [{ id: 'base', text: commonText }].filter((v) => v.text)

    for (const variant of variants) {
      const fileName = `${slugify(baseName)}__${variant.id}.mp3`
      const filePath = path.join(outDir, fileName)

      if (fs.existsSync(filePath)) {
        manifest.push({ cueKey: block.cueKey, variant: variant.id, file: fileName, skipped: true })
        continue
      }

      console.log(`[preview] ${fileName}`)
      const audio = await fetchPreviewAudio({
        supabaseUrl,
        anonKey,
        functionName,
        text: variant.text,
      })
      fs.writeFileSync(filePath, audio)
      manifest.push({ cueKey: block.cueKey, variant: variant.id, file: fileName, skipped: false, text: variant.text })
    }
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`[preview] done. tag=${tag} files=${manifest.length} dir=${outDir}`)
}

main().catch((error) => {
  console.error('[preview] failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})

