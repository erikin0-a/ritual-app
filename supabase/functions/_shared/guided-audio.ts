/* eslint-disable import/no-unresolved */
/* global Deno, TextEncoder */
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secret')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export function fastHash(input: string): string {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

export function normalizeNameForStorage(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  if (normalized.length > 0) {
    return normalized
  }

  return `name-${fastHash(name.trim().toLowerCase())}`
}

function toBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let output = ''
  let index = 0

  while (index < bytes.length) {
    const b0 = bytes[index++]
    const b1 = index < bytes.length ? bytes[index++] : undefined
    const b2 = index < bytes.length ? bytes[index++] : undefined

    output += alphabet[b0 >> 2]
    output += alphabet[((b0 & 0b11) << 4) | ((b1 ?? 0) >> 4)]
    output += b1 === undefined ? '=' : alphabet[((b1 & 0b1111) << 2) | ((b2 ?? 0) >> 6)]
    output += b2 === undefined ? '=' : alphabet[b2 & 0b111111]
  }

  return output
}

export function buildParticipantsKey(participants: { p1: { name: string; gender: string }; p2: { name: string; gender: string } }): string {
  return fastHash(`${participants.p1.name}:${participants.p1.gender}:${participants.p2.name}:${participants.p2.gender}`)
}

export async function objectExists(supabase: ReturnType<typeof createClient>, bucket: string, storagePath: string) {
  const pathParts = storagePath.split('/')
  const fileName = pathParts.pop()
  const folder = pathParts.join('/')

  if (!fileName) return false

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    search: fileName,
  })

  if (error) return false
  return Boolean(data?.some((entry) => entry.name === fileName))
}

export async function synthesizeText(text: string) {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY') ?? ''
  const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID') ?? ''
  const modelId = Deno.env.get('ELEVENLABS_MODEL_ID') ?? 'eleven_multilingual_v2'

  if (!apiKey || !voiceId) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID secret')
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      output_format: 'mp3_44100_128',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => 'unknown_error')
    throw new Error(`ElevenLabs synthesis failed: ${response.status} ${message}`)
  }

  const audioBuffer = await response.arrayBuffer()
  return new Uint8Array(audioBuffer)
}

export async function uploadAudioBytes(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  storagePath: string,
  audioBytes: Uint8Array,
) {
  const { error } = await supabase.storage.from(bucket).upload(storagePath, audioBytes, {
    contentType: 'audio/mpeg',
    upsert: true,
  })

  if (error) {
    throw error
  }
}

export async function uploadJson(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  storagePath: string,
  payload: unknown,
) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(JSON.stringify(payload, null, 2))

  const { error } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
    contentType: 'application/json',
    upsert: true,
  })

  if (error) {
    throw error
  }
}

export function getPublicUrl(supabase: ReturnType<typeof createClient>, bucket: string, storagePath: string) {
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
}

export function encodeAudioBase64(audioBytes: Uint8Array) {
  return toBase64(audioBytes)
}

export function describeError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
    const parts = [
      typeof candidate.message === 'string' ? candidate.message : null,
      typeof candidate.code === 'string' ? `code=${candidate.code}` : null,
      typeof candidate.details === 'string' ? `details=${candidate.details}` : null,
      typeof candidate.hint === 'string' ? `hint=${candidate.hint}` : null,
    ].filter(Boolean)

    if (parts.length > 0) {
      return parts.join(' | ')
    }

    try {
      return JSON.stringify(error)
    } catch {
      return 'unknown_error'
    }
  }

  return 'unknown_error'
}
