import { VOICE_SCRIPT_CATALOG } from '@/constants/voice-script-catalog'
import { supabase } from '@/lib/supabase'
import {
  normalizeNameForStorage,
  renderParticipantTemplate,
  splitTemplateIntoAudioSegments,
} from '@/lib/ritual-participants'
import type { GuidedAudioSegment, GuidedCueManifest, ParticipantId, RitualParticipants } from '@/types'

const GUIDED_AUDIO_BUCKET = process.env.EXPO_PUBLIC_GUIDED_AUDIO_BUCKET ?? 'guided-audio'
const GUIDED_AUDIO_VOICE_PROFILE = process.env.EXPO_PUBLIC_GUIDED_AUDIO_VOICE_PROFILE ?? 'marusya-romantic-v1'
const GUIDED_AUDIO_FUNCTION_NAME = process.env.EXPO_PUBLIC_GUIDED_AUDIO_FUNCTION_NAME ?? 'guided-audio-resolver'
const GUIDED_AUDIO_MANIFEST_PREFIX = process.env.EXPO_PUBLIC_GUIDED_AUDIO_MANIFEST_PREFIX ?? 'guided-manifests'
const GUIDED_AUDIO_NAME_PREFIX = process.env.EXPO_PUBLIC_GUIDED_AUDIO_NAME_PREFIX ?? 'name-library'
const GUIDED_AUDIO_PHRASE_PREFIX = process.env.EXPO_PUBLIC_GUIDED_AUDIO_PHRASE_PREFIX ?? 'guided-phrases'
const HAS_REMOTE_GUIDED_AUDIO =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)

interface RemoteSegmentResolution {
  cacheKey: string
  uri: string
  storagePath?: string
}

interface GuidedAudioResolverResponse {
  cueKey: string
  manifestUri?: string
  generatedNamePaths?: string[]
  segments?: RemoteSegmentResolution[]
}

const cueManifestCache = new Map<string, GuidedCueManifest>()
const cueManifestInFlight = new Map<string, Promise<GuidedCueManifest>>()

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

const CYRILLIC_MAP: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
}

function sanitizeTextForStorage(value: string): string {
  const normalized = stripSsml(value)
    .trim()
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => CYRILLIC_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return normalized.length > 0 ? normalized : 'segment'
}

function stripSsml(value: string): string {
  return value
    .replace(/<break[^>]*\/>/g, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getStoragePublicUrl(storagePath: string): string {
  return supabase.storage.from(GUIDED_AUDIO_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

function buildParticipantsCacheKey(participants: RitualParticipants): string {
  return fastHash(
    `${participants.p1.name}:${participants.p1.gender}:${participants.p2.name}:${participants.p2.gender}:${GUIDED_AUDIO_VOICE_PROFILE}`,
  )
}

function buildPhraseStoragePath(segmentText: string): string {
  const normalizedText = segmentText.trim()
  const segmentKey = sanitizeTextForStorage(normalizedText)
  return `${GUIDED_AUDIO_PHRASE_PREFIX}/${GUIDED_AUDIO_VOICE_PROFILE}/${segmentKey}-${fastHash(normalizedText)}.mp3`
}

function buildNameStoragePath(participantId: ParticipantId, participants: RitualParticipants): string {
  const participant = participants[participantId]
  const normalizedName = normalizeNameForStorage(participant.name)
  return `${GUIDED_AUDIO_NAME_PREFIX}/${GUIDED_AUDIO_VOICE_PROFILE}/${participant.gender}/${normalizedName}.mp3`
}

function createSegmentId(cueKey: string, index: number): string {
  return `${cueKey}-segment-${index + 1}`
}

function buildLocalSegments(cueKey: string, participants: RitualParticipants): GuidedAudioSegment[] {
  const template = VOICE_SCRIPT_CATALOG[cueKey]
  if (!template) return []

  return splitTemplateIntoAudioSegments(template, participants).map((segment, index) => {
    const normalizedText = segment.kind === 'phrase' ? segment.text.trim() : segment.text
    const storagePath = segment.kind === 'name'
      ? buildNameStoragePath(segment.participantId!, participants)
      : buildPhraseStoragePath(normalizedText)

    return {
      id: createSegmentId(cueKey, index),
      cacheKey: fastHash(`${cueKey}:${segment.kind}:${segment.participantId ?? 'phrase'}:${normalizedText}`),
      kind: segment.kind,
      text: normalizedText,
      participantId: segment.participantId,
      storagePath,
      uri: getStoragePublicUrl(storagePath),
    }
  })
}

function mergeRemoteSegments(
  segments: GuidedAudioSegment[],
  remoteSegments: RemoteSegmentResolution[] | undefined,
): GuidedAudioSegment[] {
  if (!remoteSegments || remoteSegments.length === 0) return segments

  const remoteMap = new Map(remoteSegments.map((segment) => [segment.cacheKey, segment]))
  return segments.map((segment) => {
    const remoteSegment = remoteMap.get(segment.cacheKey)
    if (!remoteSegment) return segment

    return {
      ...segment,
      storagePath: remoteSegment.storagePath ?? segment.storagePath,
      uri: remoteSegment.uri,
    }
  })
}

async function resolveRemoteSegments(
  cueKey: string,
  segments: GuidedAudioSegment[],
  participants: RitualParticipants,
): Promise<GuidedAudioResolverResponse | null> {
  if (!HAS_REMOTE_GUIDED_AUDIO) {
    if (__DEV__) {
      console.log('[GuidedAudio] Remote resolver skipped: missing Supabase public env vars')
    }
    return null
  }

  try {
    if (__DEV__) {
      console.log('[GuidedAudio] Resolving remote manifest', {
        cueKey,
        segmentCount: segments.length,
        participants: [participants.p1.name, participants.p2.name],
      })
    }
    const { data, error } = await supabase.functions.invoke<GuidedAudioResolverResponse>(GUIDED_AUDIO_FUNCTION_NAME, {
      body: {
        cueKey,
        voiceProfile: GUIDED_AUDIO_VOICE_PROFILE,
        bucket: GUIDED_AUDIO_BUCKET,
        manifestPrefix: GUIDED_AUDIO_MANIFEST_PREFIX,
        segments: segments.map((segment) => ({
          cacheKey: segment.cacheKey,
          kind: segment.kind,
          text: segment.text,
          storagePath: segment.storagePath,
          participantId: segment.participantId,
        })),
        participants,
      },
    })

    if (error) {
      if (__DEV__) {
        console.log('[GuidedAudio] Resolver returned error', {
          cueKey,
          message: error.message,
        })
      }
      return null
    }
    if (__DEV__) {
      console.log('[GuidedAudio] Resolver completed', {
        cueKey,
        generatedNamePaths: data?.generatedNamePaths?.length ?? 0,
        remoteSegments: data?.segments?.length ?? 0,
      })
    }
    return data ?? null
  } catch (error) {
    if (__DEV__) {
      console.log('[GuidedAudio] Resolver request failed', {
        cueKey,
        error,
      })
    }
    return null
  }
}

export function buildGuidedCueManifest(
  cueKey: string,
  participants: RitualParticipants,
  subtitleTemplate?: string,
  highlightedParticipants: ParticipantId[] = [],
): GuidedCueManifest {
  const template = VOICE_SCRIPT_CATALOG[cueKey]
  const renderedText = template ? renderParticipantTemplate(template, participants) : ''
  const localSegments = buildLocalSegments(cueKey, participants)

  return {
    cueKey,
    renderedText,
    subtitleText: stripSsml(renderParticipantTemplate(subtitleTemplate ?? template ?? '', participants)),
    highlightedParticipants,
    audioSegments: localSegments,
  }
}

export async function resolveGuidedCueManifest(
  cueKey: string,
  participants: RitualParticipants,
  subtitleTemplate?: string,
  highlightedParticipants: ParticipantId[] = [],
): Promise<GuidedCueManifest> {
  const cacheKey = `${cueKey}:${buildParticipantsCacheKey(participants)}:${subtitleTemplate ?? ''}:${highlightedParticipants.join(',')}`
  const cachedManifest = cueManifestCache.get(cacheKey)
  if (cachedManifest) return cachedManifest
  const inFlightManifest = cueManifestInFlight.get(cacheKey)
  if (inFlightManifest) return inFlightManifest

  const manifestPromise = (async () => {
    const localManifest = buildGuidedCueManifest(cueKey, participants, subtitleTemplate, highlightedParticipants)
    const remoteResolution = await resolveRemoteSegments(cueKey, localManifest.audioSegments, participants)

    const resolvedManifest: GuidedCueManifest = {
      ...localManifest,
      remoteManifestUri: remoteResolution?.manifestUri,
      generatedNamePaths: remoteResolution?.generatedNamePaths,
      audioSegments: mergeRemoteSegments(localManifest.audioSegments, remoteResolution?.segments),
    }

    cueManifestCache.set(cacheKey, resolvedManifest)
    return resolvedManifest
  })()

  cueManifestInFlight.set(cacheKey, manifestPromise)
  try {
    return await manifestPromise
  } finally {
    cueManifestInFlight.delete(cacheKey)
  }
}

export function clearGuidedCueManifestCache(): void {
  cueManifestCache.clear()
  cueManifestInFlight.clear()
}
