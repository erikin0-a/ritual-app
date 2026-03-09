/**
 * AudioService — concurrent voice + background music playback for Guided Ritual.
 *
 * Features:
 * - Local file cache in FileSystem.cacheDirectory
 * - Preload music and voice assets before playback
 * - ElevenLabs synthesis from script keys with {NAME1}/{NAME2} substitution
 * - Fallback to remote stream URI when local cache is not ready
 */
import { Audio, type AVPlaybackSource } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { VOICE_SCRIPT_CATALOG } from '@/constants/voice-script-catalog'

const MUSIC_VOLUME = 0.3
const VOICE_VOLUME = 1.0
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}guided-audio/`

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID
const ELEVENLABS_MODEL_ID = process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2'
const ELEVENLABS_USE_VARIABLES_API = process.env.EXPO_PUBLIC_ELEVENLABS_USE_VARIABLES_API === 'true'

export interface VoiceVariables {
  NAME1?: string
  NAME2?: string
}

export interface VoicePlayOptions {
  variables?: VoiceVariables
  fallbackUri?: string
}

export type PreloadItem = string | {
  voiceKey: string
  variables?: VoiceVariables
  fallbackUri?: string
}

// In-memory sound cache so we never re-open the same local file/URI in one session.
const soundCache = new Map<string, Audio.Sound>()

// Active sound references.
let _voiceSound: Audio.Sound | null = null
let _musicSound: Audio.Sound | null = null

let cacheReady = false

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 120)
}

function fastHash(input: string): string {
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

function toBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let out = ''
  let i = 0
  while (i < bytes.length) {
    const b0 = bytes[i++]
    const b1 = i < bytes.length ? bytes[i++] : undefined
    const b2 = i < bytes.length ? bytes[i++] : undefined

    out += alphabet[b0 >> 2]
    out += alphabet[((b0 & 0b11) << 4) | ((b1 ?? 0) >> 4)]
    out += b1 === undefined ? '=' : alphabet[((b1 & 0b1111) << 2) | ((b2 ?? 0) >> 6)]
    out += b2 === undefined ? '=' : alphabet[b2 & 0b111111]
  }

  return out
}

async function ensureCacheDir(): Promise<void> {
  if (cacheReady) return
  if (!FileSystem.cacheDirectory) {
    throw new Error('FileSystem.cacheDirectory is not available in this runtime')
  }
  const info = await FileSystem.getInfoAsync(CACHE_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true })
  }
  cacheReady = true
}

function applyNameVariables(template: string, variables?: VoiceVariables): string {
  const name1 = variables?.NAME1?.trim() || 'Вы'
  const name2 = variables?.NAME2?.trim() || 'Партнёр'
  return template
    .replaceAll('{NAME1}', name1)
    .replaceAll('{NAME2}', name2)
}

function buildVoiceCachePath(voiceKey: string, variables?: VoiceVariables): string {
  const varsPart = `${variables?.NAME1 ?? ''}-${variables?.NAME2 ?? ''}`
  const safeKey = sanitizeFilenamePart(voiceKey)
  const hash = fastHash(`${voiceKey}:${varsPart}`)
  return `${CACHE_DIR}voice-${safeKey}-${hash}.mp3`
}

function buildUriCachePath(uri: string): string {
  const hash = fastHash(uri)
  return `${CACHE_DIR}remote-${hash}.mp3`
}

async function loadSound(uri: string): Promise<Audio.Sound> {
  if (soundCache.has(uri)) {
    return soundCache.get(uri)!
  }

  const { sound } = await Audio.Sound.createAsync(
    { uri } as AVPlaybackSource,
    { shouldPlay: false },
  )
  soundCache.set(uri, sound)
  return sound
}

async function cacheRemoteUri(uri: string): Promise<string> {
  if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
    return uri
  }

  await ensureCacheDir()
  const localPath = buildUriCachePath(uri)
  const info = await FileSystem.getInfoAsync(localPath)
  if (info.exists) {
    return localPath
  }

  try {
    const result = await FileSystem.downloadAsync(uri, localPath)
    return result.uri
  } catch {
    return uri
  }
}

async function synthesizeToCache(voiceKey: string, variables?: VoiceVariables): Promise<string> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error('ElevenLabs env vars are not configured')
  }

  const template = VOICE_SCRIPT_CATALOG[voiceKey]
  if (!template) {
    throw new Error(`Unknown voice key: ${voiceKey}`)
  }

  await ensureCacheDir()
  const localPath = buildVoiceCachePath(voiceKey, variables)
  const info = await FileSystem.getInfoAsync(localPath)
  if (info.exists) {
    return localPath
  }

  const endpoint = `${ELEVENLABS_BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`
  const body: Record<string, unknown> = {
    text: ELEVENLABS_USE_VARIABLES_API ? template : applyNameVariables(template, variables),
    model_id: ELEVENLABS_MODEL_ID,
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.75,
    },
  }

  // Optional compatibility path for accounts enabled with template-variable support.
  if (ELEVENLABS_USE_VARIABLES_API) {
    body.variables = {
      NAME1: variables?.NAME1?.trim() || 'Вы',
      NAME2: variables?.NAME2?.trim() || 'Партнёр',
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => 'unknown_error')
    throw new Error(`ElevenLabs synthesis failed: ${response.status} ${message}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const base64 = toBase64(bytes)

  await FileSystem.writeAsStringAsync(localPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })

  return localPath
}

async function resolvePlaybackUri(item: PreloadItem, defaultVariables?: VoiceVariables): Promise<string> {
  if (typeof item === 'string') {
    if (VOICE_SCRIPT_CATALOG[item]) {
      return synthesizeToCache(item, defaultVariables)
    }
    return cacheRemoteUri(item)
  }

  const variables = item.variables ?? defaultVariables
  try {
    return await synthesizeToCache(item.voiceKey, variables)
  } catch {
    if (item.fallbackUri) {
      return cacheRemoteUri(item.fallbackUri)
    }
    throw new Error(`Unable to resolve voice key "${item.voiceKey}" and no fallbackUri provided`)
  }
}

export const AudioService = {
  /** Configure app-wide audio mode once. */
  async configure(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    })
  },

  /**
   * Preload a list of music URIs and/or voice keys.
   * Voice keys are synthesized and cached, remote URIs are downloaded to cache.
   */
  async preload(
    items: PreloadItem[],
    onProgress?: (progress: number) => void,
    defaultVariables?: VoiceVariables,
  ): Promise<void> {
    const total = items.length
    if (total === 0) {
      onProgress?.(1)
      return
    }

    for (let i = 0; i < total; i++) {
      try {
        const uri = await resolvePlaybackUri(items[i], defaultVariables)
        await loadSound(uri)
      } catch {
        // Keep progressing: preload failures should not block ritual start.
      }
      onProgress?.((i + 1) / total)
    }
  },

  /**
   * Play a voice line from either a voice key or direct URI.
   * Falls back to fallbackUri when synthesis/cache is unavailable.
   */
  async playVoice(keyOrUri: string, options?: VoicePlayOptions): Promise<void> {
    await AudioService.stopVoice()

    let playableUri: string
    if (VOICE_SCRIPT_CATALOG[keyOrUri]) {
      try {
        playableUri = await synthesizeToCache(keyOrUri, options?.variables)
      } catch {
        if (!options?.fallbackUri) {
          throw new Error(`Voice key "${keyOrUri}" failed and no fallbackUri was provided`)
        }
        playableUri = await cacheRemoteUri(options.fallbackUri)
      }
    } else {
      playableUri = await cacheRemoteUri(keyOrUri)
    }

    const sound = await loadSound(playableUri)
    await sound.setVolumeAsync(VOICE_VOLUME)
    await sound.setPositionAsync(0)
    await sound.playAsync()
    _voiceSound = sound
  },

  /** Play looping background music. */
  async playMusic(uri: string): Promise<void> {
    await AudioService.stopMusic()
    const playableUri = await cacheRemoteUri(uri)
    const sound = await loadSound(playableUri)
    await sound.setVolumeAsync(MUSIC_VOLUME)
    await sound.setIsLoopingAsync(true)
    await sound.setPositionAsync(0)
    await sound.playAsync()
    _musicSound = sound
  },

  async stopVoice(): Promise<void> {
    if (_voiceSound) {
      await _voiceSound.stopAsync().catch(() => null)
      _voiceSound = null
    }
  },

  async stopMusic(): Promise<void> {
    if (_musicSound) {
      await _musicSound.stopAsync().catch(() => null)
      _musicSound = null
    }
  },

  async stopAll(): Promise<void> {
    await Promise.all([AudioService.stopVoice(), AudioService.stopMusic()])
  },

  async pauseAll(): Promise<void> {
    await Promise.all([
      _voiceSound?.pauseAsync().catch(() => null),
      _musicSound?.pauseAsync().catch(() => null),
    ])
  },

  async resumeAll(): Promise<void> {
    await Promise.all([
      _voiceSound?.playAsync().catch(() => null),
      _musicSound?.playAsync().catch(() => null),
    ])
  },

  async stop(): Promise<void> {
    await AudioService.stopAll()
  },

  async pause(): Promise<void> {
    await AudioService.pauseAll()
  },

  async resume(): Promise<void> {
    await AudioService.resumeAll()
  },

  /** Release all loaded sounds and clear caches for this app session. */
  async releaseAll(): Promise<void> {
    await AudioService.stopAll()
    for (const sound of soundCache.values()) {
      await sound.unloadAsync().catch(() => null)
    }
    soundCache.clear()
    _voiceSound = null
    _musicSound = null
  },
}
