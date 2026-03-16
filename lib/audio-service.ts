/* eslint-disable no-console */
/**
 * AudioService — concurrent voice + background music playback for Guided Ritual.
 *
 * Guided voice is driven by cue manifests:
 * - phrase segments are fetched from storage when available,
 * - participant names are fetched from the name library,
 * - development builds can synthesize missing segments directly via ElevenLabs.
 */
import { Audio, type AVPlaybackSource, type AVPlaybackStatus } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { VOICE_SCRIPT_CATALOG } from '@/constants/voice-script-catalog'
import { clearGuidedCueManifestCache, resolveGuidedCueManifest } from '@/lib/guided-audio-manifest'
import { DEFAULT_RITUAL_PARTICIPANTS } from '@/lib/ritual-participants'
import { ensureNameAudioAtPath } from '@/lib/name-audio-service'
import type { GuidedAudioSegment, GuidedCueManifest, GuidedPreloadItem, ParticipantId, RitualParticipants } from '@/types'

const MUSIC_VOLUME = 0.3
const VOICE_VOLUME = 1.0
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const CACHE_DIR = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}guided-audio/` : null

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID
const ELEVENLABS_MODEL_ID = process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2'

export interface VoicePlayOptions {
  participants?: RitualParticipants
  fallbackUri?: string
  subtitleTemplate?: string
  highlightedParticipants?: ParticipantId[]
}

const soundCache = new Map<string, Audio.Sound>()

let _voiceSound: Audio.Sound | null = null
let _musicSound: Audio.Sound | null = null
let _voicePlaybackToken = 0
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

async function ensureCacheDir(): Promise<boolean> {
  if (cacheReady) return true
  if (!CACHE_DIR) {
    return false
  }

  const info = await FileSystem.getInfoAsync(CACHE_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true })
  }
  cacheReady = true
  return true
}

function buildTextCachePath(text: string, cacheKey?: string): string {
  const safeKey = sanitizeFilenamePart(cacheKey ?? text)
  return `${CACHE_DIR ?? ''}segment-${safeKey}-${fastHash(text)}.mp3`
}

function buildUriCachePath(uri: string): string {
  return `${CACHE_DIR ?? ''}remote-${fastHash(uri)}.mp3`
}

async function loadSound(uri: string): Promise<Audio.Sound> {
  if (soundCache.has(uri)) {
    return soundCache.get(uri)!
  }

  const { sound, status } = await Audio.Sound.createAsync(
    { uri } as AVPlaybackSource,
    { shouldPlay: false },
  )
  if (!status.isLoaded) {
    const loadError = 'error' in status ? status.error : 'unknown_audio_load_error'
    await sound.unloadAsync().catch(() => null)
    throw new Error(`Audio load failed for ${uri}: ${loadError}`)
  }
  soundCache.set(uri, sound)
  return sound
}

async function cacheRemoteUri(uri: string): Promise<string> {
  if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
    return uri
  }

  const canCacheLocally = await ensureCacheDir()
  if (!canCacheLocally) {
    return uri
  }
  const localPath = buildUriCachePath(uri)
  const info = await FileSystem.getInfoAsync(localPath)
  if (info.exists) return localPath

  try {
    const result = await FileSystem.downloadAsync(uri, localPath)
    return result.uri
  } catch {
    return uri
  }
}

async function synthesizeTextToCache(text: string, cacheKey?: string): Promise<string> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error('ElevenLabs env vars are not configured')
  }

  const canCacheLocally = await ensureCacheDir()
  const localPath = canCacheLocally ? buildTextCachePath(text, cacheKey) : null
  if (localPath) {
    const info = await FileSystem.getInfoAsync(localPath)
    if (info.exists) return localPath
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
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

  const arrayBuffer = await response.arrayBuffer()
  const audioBase64 = toBase64(new Uint8Array(arrayBuffer))

  if (!localPath) {
    return `data:audio/mpeg;base64,${audioBase64}`
  }

  await FileSystem.writeAsStringAsync(localPath, audioBase64, {
    encoding: FileSystem.EncodingType.Base64,
  })

  return localPath
}

async function resolveSegmentPlaybackUri(segment: GuidedAudioSegment): Promise<string> {
  if (segment.uri) {
    try {
      const cachedUri = await cacheRemoteUri(segment.uri)
      await loadSound(cachedUri)
      if (__DEV__) {
        console.log('[GuidedAudio] Using remote/storage segment', {
          cacheKey: segment.cacheKey,
          kind: segment.kind,
          storagePath: segment.storagePath,
        })
      }
      return cachedUri
    } catch {
      // Fall through to name-service or local synthesis.
    }
  }

  // For name segments: synthesize via edge function and persist to Supabase
  // so subsequent plays hit storage instead of re-synthesizing every time.
  if (segment.kind === 'name' && segment.storagePath) {
    try {
      const nameUri = await ensureNameAudioAtPath(segment.text, segment.storagePath)
      if (nameUri) {
        const cachedUri = await cacheRemoteUri(nameUri)
        await loadSound(cachedUri)
        if (__DEV__) {
          console.log('[GuidedAudio] Name audio resolved via name-audio-service', {
            cacheKey: segment.cacheKey,
            storagePath: segment.storagePath,
          })
        }
        return cachedUri
      }
    } catch {
      // Fall through to local synthesis.
    }
  }

  const synthesizedUri = await synthesizeTextToCache(segment.text, segment.cacheKey)
  await loadSound(synthesizedUri)
  if (__DEV__) {
    console.log('[GuidedAudio] Falling back to local ElevenLabs synthesis', {
      cacheKey: segment.cacheKey,
      kind: segment.kind,
      preview: segment.text.slice(0, 80),
    })
  }
  return synthesizedUri
}

function waitForPlaybackToFinish(sound: Audio.Sound, playbackToken: number): Promise<void> {
  return new Promise((resolve) => {
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return

      if (playbackToken !== _voicePlaybackToken) {
        sound.setOnPlaybackStatusUpdate(null)
        resolve()
        return
      }

      if (status.didJustFinish) {
        sound.setOnPlaybackStatusUpdate(null)
        resolve()
      }
    })
  })
}

async function playSoundUri(uri: string, playbackToken: number): Promise<void> {
  if (playbackToken !== _voicePlaybackToken) return

  const sound = await loadSound(uri)
  await sound.setVolumeAsync(VOICE_VOLUME)
  await sound.setPositionAsync(0)
  _voiceSound = sound
  await sound.playAsync()
  await waitForPlaybackToFinish(sound, playbackToken)
}

async function playGuidedCueManifest(manifest: GuidedCueManifest): Promise<void> {
  const playbackToken = ++_voicePlaybackToken
  for (const segment of manifest.audioSegments) {
    if (playbackToken !== _voicePlaybackToken) return
    const segmentUri = await resolveSegmentPlaybackUri(segment)
    await playSoundUri(segmentUri, playbackToken)
  }
  if (playbackToken === _voicePlaybackToken) {
    _voiceSound = null
  }
}

async function resolveGuidedManifestForPlayback(
  cueKey: string,
  options?: VoicePlayOptions,
): Promise<GuidedCueManifest> {
  return resolveGuidedCueManifest(
    cueKey,
    options?.participants ?? DEFAULT_RITUAL_PARTICIPANTS,
    options?.subtitleTemplate,
    options?.highlightedParticipants,
  )
}

export const AudioService = {
  async configure(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    })
  },

  async preload(
    items: GuidedPreloadItem[],
    onProgress?: (progress: number) => void,
    participants: RitualParticipants = DEFAULT_RITUAL_PARTICIPANTS,
  ): Promise<void> {
    const total = items.length
    if (total === 0) {
      onProgress?.(1)
      return
    }

    for (let index = 0; index < total; index++) {
      try {
        const item = items[index]
        const manifest = await resolveGuidedManifestForPlayback(item.cueKey, {
          participants,
        })

        for (const segment of manifest.audioSegments) {
          try {
            const segmentUri = await resolveSegmentPlaybackUri(segment)
            await loadSound(segmentUri)
          } catch {
            // Keep progressing; a missing segment should not block ritual start.
          }
        }
      } catch {
        // Keep progressing; a missing cue should not block ritual start.
      }
      onProgress?.((index + 1) / total)
    }
  },

  async playVoice(keyOrUri: string, options?: VoicePlayOptions): Promise<GuidedCueManifest | null> {
    await AudioService.stopVoice()

    if (VOICE_SCRIPT_CATALOG[keyOrUri]) {
      const manifest = await resolveGuidedManifestForPlayback(keyOrUri, options)
      playGuidedCueManifest(manifest).catch(() => null)
      return manifest
    }

    const playableUri = await cacheRemoteUri(options?.fallbackUri ?? keyOrUri)
    const sound = await loadSound(playableUri)
    _voicePlaybackToken += 1
    _voiceSound = sound
    await sound.setVolumeAsync(VOICE_VOLUME)
    await sound.setPositionAsync(0)
    await sound.playAsync()
    return null
  },

  async playMusic(uri: string): Promise<void> {
    await AudioService.stopMusic()
    try {
      const playableUri = await cacheRemoteUri(uri)
      const sound = await loadSound(playableUri)
      await sound.setVolumeAsync(MUSIC_VOLUME)
      await sound.setIsLoopingAsync(true)
      await sound.setPositionAsync(0)
      await sound.playAsync()
      _musicSound = sound
      return
    } catch {
      // Fall back to bundled ambient track when remote music is unavailable.
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/audio/ritual_music.mp3'),
      {
        shouldPlay: true,
        isLooping: true,
        volume: MUSIC_VOLUME,
      },
    )
    _musicSound = sound
  },

  async stopVoice(): Promise<void> {
    _voicePlaybackToken += 1
    if (_voiceSound) {
      _voiceSound.setOnPlaybackStatusUpdate(null)
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

  async releaseAll(): Promise<void> {
    await AudioService.stopAll()
    for (const sound of soundCache.values()) {
      await sound.unloadAsync().catch(() => null)
    }
    soundCache.clear()
    clearGuidedCueManifestCache()
    _voiceSound = null
    _musicSound = null
  },
}
