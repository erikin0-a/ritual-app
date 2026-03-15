/**
 * name-audio-service.ts
 *
 * Pre-warms and caches partner name audio in Supabase Storage.
 * Called during ritual setup so name segments play without first-play latency.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { normalizeNameForStorage } from '@/lib/ritual-participants'
import type { ParticipantId, RitualParticipants } from '@/types'

const BUCKET = process.env.EXPO_PUBLIC_GUIDED_AUDIO_BUCKET ?? 'guided-audio'
const VOICE_PROFILE = process.env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE ?? 'marusya-romantic-v1'
const NAME_PREFIX = process.env.EXPO_PUBLIC_GUIDED_AUDIO_NAME_PREFIX ?? 'name-library'
const FUNCTION_NAME = process.env.EXPO_PUBLIC_GUIDED_AUDIO_FUNCTION_NAME ?? 'guided-audio-resolver'
const CACHE_PREFIX = '@name_audio_url:'

function buildNameStoragePath(name: string, gender: string): string {
  const normalizedName = normalizeNameForStorage(name)
  return `${NAME_PREFIX}/${VOICE_PROFILE}/${gender}/${normalizedName}.mp3`
}

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

async function objectExists(storagePath: string): Promise<boolean> {
  try {
    const pathParts = storagePath.split('/')
    const fileName = pathParts.pop()
    const folder = pathParts.join('/')
    if (!fileName) return false
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { search: fileName })
    if (error) return false
    return Boolean(data?.some((entry) => entry.name === fileName))
  } catch {
    return false
  }
}

async function synthesizeNameViaEdgeFunction(
  participantId: ParticipantId,
  participants: RitualParticipants,
  storagePath: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        cueKey: `__name_warmup_${participantId}`,
        bucket: BUCKET,
        participants,
        segments: [
          {
            cacheKey: storagePath,
            kind: 'name',
            text: participants[participantId].name,
            storagePath,
            participantId,
          },
        ],
      },
    })
    if (error) return null
    const resolved = (data as { segments?: Array<{ uri?: string }> } | null)?.segments?.[0]
    return resolved?.uri ?? null
  } catch {
    return null
  }
}

/**
 * Ensures name audio exists in Supabase Storage for one participant.
 * Returns the public URL, or null if unavailable (network/API failure).
 * Caches the URL in AsyncStorage so subsequent calls skip the network check.
 */
export async function ensureNameAudio(
  participantId: ParticipantId,
  participants: RitualParticipants,
): Promise<string | null> {
  const participant = participants[participantId]
  const storagePath = buildNameStoragePath(participant.name, participant.gender)
  const asyncStorageKey = `${CACHE_PREFIX}${storagePath}`

  try {
    const cached = await AsyncStorage.getItem(asyncStorageKey)
    if (cached) return cached
  } catch {
    // Cache miss — proceed
  }

  const exists = await objectExists(storagePath)
  if (exists) {
    const url = getPublicUrl(storagePath)
    AsyncStorage.setItem(asyncStorageKey, url).catch(() => null)
    return url
  }

  const url = await synthesizeNameViaEdgeFunction(participantId, participants, storagePath)
  if (url) {
    AsyncStorage.setItem(asyncStorageKey, url).catch(() => null)
  }
  return url
}

/**
 * Pre-warms audio for both ritual participants concurrently.
 * Swallows individual failures — one name failing does not block the other.
 */
export async function warmNameAudio(participants: RitualParticipants): Promise<void> {
  await Promise.allSettled([
    ensureNameAudio('p1', participants),
    ensureNameAudio('p2', participants),
  ])
}
