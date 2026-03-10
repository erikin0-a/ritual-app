import fs from 'node:fs'
import path from 'node:path'

import { VOICE_SCRIPT_CATALOG } from '../constants/voice-script-catalog.ts'
import { normalizeNameForStorage, splitTemplateIntoAudioSegments } from '../lib/ritual-participants.ts'

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

function buildNameStoragePath(prefix, voiceProfile, participantId, participants) {
  const participant = participants[participantId]
  const normalizedName = normalizeNameForStorage(participant.name)
  return `${prefix}/${voiceProfile}/${participant.gender}/${normalizedName}.mp3`
}

function buildSegments(cueKey, participants, voiceProfile, phrasePrefix, namePrefix) {
  const template = VOICE_SCRIPT_CATALOG[cueKey]
  const segments = splitTemplateIntoAudioSegments(template, participants)

  return segments.map((segment) => ({
    cacheKey: fastHash(`${cueKey}:${segment.kind}:${segment.participantId ?? 'phrase'}:${segment.kind === 'phrase' ? segment.text.trim() : segment.text}`),
    kind: segment.kind,
    text: segment.kind === 'phrase' ? segment.text.trim() : segment.text,
    participantId: segment.participantId,
    storagePath: segment.kind === 'name'
      ? buildNameStoragePath(namePrefix, voiceProfile, segment.participantId, participants)
      : buildPhraseStoragePath(phrasePrefix, voiceProfile, segment.text),
  }))
}

async function invokeResolver({ supabaseUrl, anonKey, functionName, bucket, manifestPrefix, cueKey, participants, segments }) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      cueKey,
      bucket,
      manifestPrefix,
      participants,
      segments,
    }),
  })

  const payload = await response.json().catch(() => null)
  return {
    status: response.status,
    payload,
  }
}

async function main() {
  const env = loadEnvFile()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  const bucket = env.EXPO_PUBLIC_GUIDED_AUDIO_BUCKET ?? 'guided-audio'
  const voiceProfile = env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE ?? 'marusya-romantic-v1'
  const manifestPrefix = env.EXPO_PUBLIC_GUIDED_AUDIO_MANIFEST_PREFIX ?? 'guided-manifests'
  const namePrefix = env.EXPO_PUBLIC_GUIDED_AUDIO_NAME_PREFIX ?? 'name-library'
  const phrasePrefix = env.EXPO_PUBLIC_GUIDED_AUDIO_PHRASE_PREFIX ?? 'guided-phrases'
  const functionName = env.EXPO_PUBLIC_GUIDED_AUDIO_FUNCTION_NAME ?? 'guided-audio-resolver'

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env')
  }

  const participants = {
    p1: { id: 'p1', name: 'Anna', gender: 'f' },
    p2: { id: 'p2', name: 'Max', gender: 'm' },
  }

  const cueKeys = [
    'round_0_intro_01',
    'round_1_task_01',
    'round_1_task_03',
    'round_2_task_01',
    'round_4_task_03',
  ]

  let failed = false

  for (const cueKey of cueKeys) {
    const segments = buildSegments(cueKey, participants, voiceProfile, phrasePrefix, namePrefix)
    const nameSegmentCount = segments.filter((segment) => segment.kind === 'name').length
    const result = await invokeResolver({
      supabaseUrl,
      anonKey,
      functionName,
      bucket,
      manifestPrefix,
      cueKey,
      participants,
      segments,
    })

    const remoteSegmentCount = result.payload?.segments?.length ?? 0
    const passedStatus = result.status === 200
    const passedCoverage = nameSegmentCount === 0 || remoteSegmentCount >= nameSegmentCount
    const passed = passedStatus && passedCoverage

    console.log(
      `[QA] ${cueKey} status=${result.status} remoteSegments=${remoteSegmentCount}/${segments.length} nameSegments=${nameSegmentCount} result=${passed ? 'PASS' : 'FAIL'}`,
    )

    if (!passed) {
      failed = true
      console.log(JSON.stringify(result.payload, null, 2))
    }
  }

  if (failed) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('[QA] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
