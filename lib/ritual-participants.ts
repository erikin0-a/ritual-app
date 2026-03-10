import type {
  ParticipantGender,
  ParticipantGrammarForms,
  ParticipantId,
  RitualParticipant,
  RitualParticipants,
} from '@/types'

const DEFAULT_NAME_BY_ID: Record<ParticipantId, string> = {
  p1: 'Партнёр 1',
  p2: 'Партнёр 2',
}

const DEFAULT_GENDER_BY_ID: Record<ParticipantId, ParticipantGender> = {
  p1: 'm',
  p2: 'f',
}

export const DEFAULT_RITUAL_PARTICIPANTS: RitualParticipants = {
  p1: { id: 'p1', name: DEFAULT_NAME_BY_ID.p1, gender: DEFAULT_GENDER_BY_ID.p1 },
  p2: { id: 'p2', name: DEFAULT_NAME_BY_ID.p2, gender: DEFAULT_GENDER_BY_ID.p2 },
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

export function normalizeParticipantName(name: string | null | undefined, fallbackId: ParticipantId): string {
  const trimmed = name?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_NAME_BY_ID[fallbackId]
}

export function createParticipant(
  id: ParticipantId,
  name: string | null | undefined,
  gender?: ParticipantGender,
): RitualParticipant {
  return {
    id,
    name: normalizeParticipantName(name, id),
    gender: gender ?? DEFAULT_GENDER_BY_ID[id],
  }
}

export function createRitualParticipants(input?: Partial<RitualParticipants>): RitualParticipants {
  return {
    p1: createParticipant('p1', input?.p1?.name, input?.p1?.gender),
    p2: createParticipant('p2', input?.p2?.name, input?.p2?.gender),
  }
}

export function getOrderedParticipants(participants: RitualParticipants): RitualParticipant[] {
  return [participants.p1, participants.p2]
}

export function getParticipantById(participants: RitualParticipants, participantId: ParticipantId): RitualParticipant {
  return participants[participantId]
}

export function getOtherParticipantId(participantId: ParticipantId): ParticipantId {
  return participantId === 'p1' ? 'p2' : 'p1'
}

export function getParticipantGrammarForms(gender: ParticipantGender): ParticipantGrammarForms {
  return gender === 'f'
    ? {
        subjectPronoun: 'она',
        objectPronoun: 'её',
        possessivePronoun: 'её',
        dativePronoun: 'ей',
        journeyVerb: 'прошла',
      }
    : {
        subjectPronoun: 'он',
        objectPronoun: 'его',
        possessivePronoun: 'его',
        dativePronoun: 'ему',
        journeyVerb: 'прошёл',
      }
}

function replaceLegacyTokens(template: string): string {
  return template
    .replaceAll('{NAME1}', '{{p1.name}}')
    .replaceAll('{NAME2}', '{{p2.name}}')
}

function getTokenValue(
  participants: RitualParticipants,
  participantId: ParticipantId,
  tokenName: string,
): string | null {
  const participant = getParticipantById(participants, participantId)
  const forms = getParticipantGrammarForms(participant.gender)

  switch (tokenName) {
    case 'name':
      return participant.name
    case 'subjectPronoun':
      return forms.subjectPronoun
    case 'objectPronoun':
      return forms.objectPronoun
    case 'possessivePronoun':
      return forms.possessivePronoun
    case 'dativePronoun':
      return forms.dativePronoun
    case 'journeyVerb':
      return forms.journeyVerb
    default:
      return null
  }
}

export function renderParticipantTemplate(template: string, participants: RitualParticipants): string {
  const normalizedTemplate = replaceLegacyTokens(template)

  return normalizedTemplate.replace(/\{\{(p1|p2)\.(\w+)\}\}/g, (match, participantId, tokenName) => {
    const value = getTokenValue(participants, participantId as ParticipantId, tokenName)
    return value ?? match
  })
}

export interface TemplateSegment {
  kind: 'phrase' | 'name'
  text: string
  participantId?: ParticipantId
}

export function splitTemplateIntoAudioSegments(
  template: string,
  participants: RitualParticipants,
): TemplateSegment[] {
  const normalizedTemplate = replaceLegacyTokens(template)
  const segments: TemplateSegment[] = []
  const nameTokenRegex = /\{\{(p1|p2)\.name\}\}/g
  let lastIndex = 0

  for (const match of normalizedTemplate.matchAll(nameTokenRegex)) {
    const [matchedToken, participantId] = match
    const matchIndex = match.index ?? 0
    const phraseChunk = normalizedTemplate.slice(lastIndex, matchIndex)
    const renderedChunk = renderParticipantTemplate(phraseChunk, participants)

    if (renderedChunk.length > 0) {
      segments.push({
        kind: 'phrase',
        text: renderedChunk,
      })
    }

    segments.push({
      kind: 'name',
      text: getParticipantById(participants, participantId as ParticipantId).name,
      participantId: participantId as ParticipantId,
    })

    lastIndex = matchIndex + matchedToken.length
  }

  const trailingChunk = normalizedTemplate.slice(lastIndex)
  const renderedTrailingChunk = renderParticipantTemplate(trailingChunk, participants)

  if (renderedTrailingChunk.length > 0) {
    segments.push({
      kind: 'phrase',
      text: renderedTrailingChunk,
    })
  }

  return segments
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

  const fallbackKey = fastHash(name.trim().toLowerCase())
  return `name-${fallbackKey}`
}
