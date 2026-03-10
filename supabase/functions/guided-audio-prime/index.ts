/* eslint-disable @typescript-eslint/array-type */
/* global Deno, Response */
// @ts-nocheck
import {
  createServiceClient,
  describeError,
  getPublicUrl,
  objectExists,
  synthesizeText,
  uploadAudioBytes,
} from '../_shared/guided-audio.ts'

const DEFAULT_BUCKET = 'guided-audio'

interface PrimeRequestPayload {
  bucket?: string
  segments: Array<{
    text: string
    storagePath: string
  }>
}

let lastPrimeStoragePath: string | null = null
let lastPrimeTextPreview: string | null = null

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
    const payload = await request.json() as PrimeRequestPayload
    const bucket = payload.bucket ?? DEFAULT_BUCKET
    const supabase = createServiceClient()

    const uploaded: Array<{ storagePath: string; uri: string }> = []
    const skipped: string[] = []

    for (const segment of payload.segments) {
      lastPrimeStoragePath = segment.storagePath
      lastPrimeTextPreview = segment.text.slice(0, 120)
      const exists = await objectExists(supabase, bucket, segment.storagePath)
      if (exists) {
        skipped.push(segment.storagePath)
        continue
      }

      const audioBytes = await synthesizeText(segment.text)
      await uploadAudioBytes(supabase, bucket, segment.storagePath, audioBytes)
      uploaded.push({
        storagePath: segment.storagePath,
        uri: getPublicUrl(supabase, bucket, segment.storagePath),
      })
    }

    return new Response(
      JSON.stringify({
        uploaded,
        skipped,
      }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('[guided-audio-prime] failed', error)
    return new Response(
      JSON.stringify({
        error: describeError(error),
        storagePath: lastPrimeStoragePath,
        textPreview: lastPrimeTextPreview,
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
