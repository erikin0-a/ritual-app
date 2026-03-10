/* eslint-disable @typescript-eslint/array-type */
/* global Deno, Response */
// @ts-nocheck
import {
  buildParticipantsKey,
  createServiceClient,
  describeError,
  getPublicUrl,
  normalizeNameForStorage,
  objectExists,
  synthesizeText,
  uploadAudioBytes,
  uploadJson,
} from '../_shared/guided-audio.ts'

const DEFAULT_BUCKET = 'guided-audio'
const DEFAULT_MANIFEST_PREFIX = 'guided-manifests'

interface RequestPayload {
  cueKey: string
  bucket?: string
  manifestPrefix?: string
  participants: {
    p1: { id: 'p1'; name: string; gender: 'm' | 'f' }
    p2: { id: 'p2'; name: string; gender: 'm' | 'f' }
  }
  segments: Array<{
    cacheKey: string
    kind: 'phrase' | 'name'
    text: string
    storagePath?: string
    participantId?: 'p1' | 'p2'
  }>
}

let lastResolverStoragePath: string | null = null
let lastResolverSegmentKind: string | null = null

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload = await request.json() as RequestPayload
    const bucket = payload.bucket ?? DEFAULT_BUCKET
    const manifestPrefix = payload.manifestPrefix ?? DEFAULT_MANIFEST_PREFIX
    const supabase = createServiceClient()

    const generatedNamePaths: string[] = []
    const resolvedSegments: Array<{ cacheKey: string; uri: string; storagePath?: string }> = []

    for (const segment of payload.segments) {
      lastResolverStoragePath = segment.storagePath ?? null
      lastResolverSegmentKind = segment.kind
      if (!segment.storagePath) continue

      let hasObject = await objectExists(supabase, bucket, segment.storagePath)
      if (!hasObject && segment.kind === 'name' && segment.participantId) {
        const participant = payload.participants[segment.participantId]
        const normalizedName = normalizeNameForStorage(participant.name)
        if (normalizedName.length > 0) {
          const audioBytes = await synthesizeText(participant.name)
          await uploadAudioBytes(supabase, bucket, segment.storagePath, audioBytes)
          generatedNamePaths.push(segment.storagePath)
          hasObject = true
        }
      }

      if (hasObject) {
        resolvedSegments.push({
          cacheKey: segment.cacheKey,
          storagePath: segment.storagePath,
          uri: getPublicUrl(supabase, bucket, segment.storagePath),
        })
      }
    }

    const manifestPath = `${manifestPrefix}/${payload.cueKey}/${buildParticipantsKey(payload.participants)}.json`
    const manifestPayload = {
      cueKey: payload.cueKey,
      generatedNamePaths,
      segments: resolvedSegments,
    }

    await uploadJson(supabase, bucket, manifestPath, manifestPayload)

    return new Response(
      JSON.stringify({
        cueKey: payload.cueKey,
        generatedNamePaths,
        segments: resolvedSegments,
        manifestUri: getPublicUrl(supabase, bucket, manifestPath),
      }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('[guided-audio-resolver] failed', error)
    return new Response(
      JSON.stringify({
        error: describeError(error),
        storagePath: lastResolverStoragePath,
        segmentKind: lastResolverSegmentKind,
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
