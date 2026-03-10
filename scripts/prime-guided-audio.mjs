import fs from 'node:fs'
import path from 'node:path'

import { VOICE_SCRIPT_CATALOG } from '../constants/voice-script-catalog.ts'
import { splitTemplateIntoAudioSegments } from '../lib/ritual-participants.ts'

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

function fastHash(input) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24)
  }

  return (hash >>> 0).toString(16)
}

function sanitizeTextForStorage(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/<break[^>]*\/>/g, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return normalized || 'segment'
}

function buildPhraseStoragePath(prefix, voiceProfile, segmentText) {
  const normalizedText = segmentText.trim()
  const segmentKey = sanitizeTextForStorage(normalizedText)
  return `${prefix}/${voiceProfile}/${segmentKey}-${fastHash(normalizedText)}.mp3`
}

function createParticipants(p1Gender, p2Gender) {
  return {
    p1: { id: 'p1', name: 'Alex', gender: p1Gender },
    p2: { id: 'p2', name: 'Mia', gender: p2Gender },
  }
}

function buildPhraseSegments(voiceProfile, phrasePrefix) {
  const variants = [
    createParticipants('m', 'm'),
    createParticipants('m', 'f'),
    createParticipants('f', 'm'),
    createParticipants('f', 'f'),
  ]

  const deduped = new Map()

  for (const cueKey of Object.keys(VOICE_SCRIPT_CATALOG)) {
    const template = VOICE_SCRIPT_CATALOG[cueKey]
    for (const participants of variants) {
      const segments = splitTemplateIntoAudioSegments(template, participants)
      for (const segment of segments) {
        if (segment.kind !== 'phrase') continue
        const normalizedText = segment.text.trim()
        if (!normalizedText) continue

        const storagePath = buildPhraseStoragePath(phrasePrefix, voiceProfile, normalizedText)
        deduped.set(storagePath, {
          text: normalizedText,
          storagePath,
        })
      }
    }
  }

  return [...deduped.values()]
}

async function invokePrimeFunction({ supabaseUrl, anonKey, functionName, bucket, segments }) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    signal: AbortSignal.timeout(90_000),
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      bucket,
      segments,
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage = payload?.error ?? `Prime failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  return payload
}

async function main() {
  const env = loadEnvFile()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  const bucket = env.EXPO_PUBLIC_GUIDED_AUDIO_BUCKET ?? 'guided-audio'
  const voiceProfile = env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE ?? 'marusya-romantic-v1'
  const phrasePrefix = env.EXPO_PUBLIC_GUIDED_AUDIO_PHRASE_PREFIX ?? 'guided-phrases'
  const functionName = 'guided-audio-prime'

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env')
  }

  const batchSize = Number(process.argv[2] ?? 20)
  const segments = buildPhraseSegments(voiceProfile, phrasePrefix)

  console.log(`[Prime] Prepared ${segments.length} unique phrase segments`)

  let uploadedCount = 0
  let skippedCount = 0

  for (let index = 0; index < segments.length; index += batchSize) {
    const batch = segments.slice(index, index + batchSize)
    console.log(
      `[Prime] Starting batch ${Math.floor(index / batchSize) + 1}/${Math.ceil(segments.length / batchSize)} first=${batch[0]?.storagePath ?? 'n/a'} count=${batch.length}`,
    )
    const result = await invokePrimeFunction({
      supabaseUrl,
      anonKey,
      functionName,
      bucket,
      segments: batch,
    })

    const uploaded = result?.uploaded?.length ?? 0
    const skipped = result?.skipped?.length ?? 0
    uploadedCount += uploaded
    skippedCount += skipped

    console.log(
      `[Prime] Batch ${Math.floor(index / batchSize) + 1}/${Math.ceil(segments.length / batchSize)} uploaded=${uploaded} skipped=${skipped}`,
    )
  }

  console.log(`[Prime] Done. Uploaded=${uploadedCount} skipped=${skippedCount}`)
}

main().catch((error) => {
  console.error('[Prime] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
