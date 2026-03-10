/* eslint-disable @typescript-eslint/array-type */
/* global Deno, Response */
// @ts-nocheck
import { describeError, synthesizeText } from '../_shared/guided-audio.ts'

interface PreviewRequestPayload {
  text: string
}

let lastPreviewText: string | null = null

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
    const payload = (await request.json()) as PreviewRequestPayload
    const text = typeof payload?.text === 'string' ? payload.text : ''
    lastPreviewText = text.slice(0, 160)

    if (!text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing text' }),
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const audioBytes = await synthesizeText(text)
    return new Response(audioBytes, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[guided-audio-preview] failed', error)
    return new Response(
      JSON.stringify({
        error: describeError(error),
        textPreview: lastPreviewText,
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

