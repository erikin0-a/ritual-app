import '../models/app_models.dart';

const Map<ParticipantId, String> _defaultNameById = {
  ParticipantId.p1: 'Партнёр 1',
  ParticipantId.p2: 'Партнёр 2',
};

const Map<ParticipantId, ParticipantGender> _defaultGenderById = {
  ParticipantId.p1: ParticipantGender.m,
  ParticipantId.p2: ParticipantGender.f,
};

const defaultRitualParticipants = RitualParticipants(
  p1: RitualParticipant(
    id: ParticipantId.p1,
    name: 'Партнёр 1',
    gender: ParticipantGender.m,
  ),
  p2: RitualParticipant(
    id: ParticipantId.p2,
    name: 'Партнёр 2',
    gender: ParticipantGender.f,
  ),
);

String normalizeParticipantName(String? name, ParticipantId fallbackId) {
  final trimmed = name?.trim();
  return trimmed != null && trimmed.isNotEmpty
      ? trimmed
      : _defaultNameById[fallbackId]!;
}

RitualParticipant createParticipant(
  ParticipantId id,
  String? name, {
  ParticipantGender? gender,
}) {
  return RitualParticipant(
    id: id,
    name: normalizeParticipantName(name, id),
    gender: gender ?? _defaultGenderById[id]!,
  );
}

RitualParticipants createRitualParticipants({
  RitualParticipant? p1,
  RitualParticipant? p2,
}) {
  return RitualParticipants(
    p1: createParticipant(
      ParticipantId.p1,
      p1?.name,
      gender: p1?.gender,
    ),
    p2: createParticipant(
      ParticipantId.p2,
      p2?.name,
      gender: p2?.gender,
    ),
  );
}

ParticipantGrammarForms getParticipantGrammarForms(ParticipantGender gender) {
  switch (gender) {
    case ParticipantGender.f:
      return const ParticipantGrammarForms(
        subjectPronoun: 'она',
        objectPronoun: 'её',
        possessivePronoun: 'её',
        dativePronoun: 'ей',
        journeyVerb: 'прошла',
      );
    case ParticipantGender.m:
      return const ParticipantGrammarForms(
        subjectPronoun: 'он',
        objectPronoun: 'его',
        possessivePronoun: 'его',
        dativePronoun: 'ему',
        journeyVerb: 'прошёл',
      );
  }
}

String _replaceLegacyTokens(String template) {
  return template
      .replaceAll('{NAME1}', '{{p1.name}}')
      .replaceAll('{NAME2}', '{{p2.name}}');
}

String? _getTokenValue(
  RitualParticipants participants,
  ParticipantId participantId,
  String tokenName,
) {
  final participant = participants[participantId];
  final forms = getParticipantGrammarForms(participant.gender);

  switch (tokenName) {
    case 'name':
      return participant.name;
    case 'subjectPronoun':
      return forms.subjectPronoun;
    case 'objectPronoun':
      return forms.objectPronoun;
    case 'possessivePronoun':
      return forms.possessivePronoun;
    case 'dativePronoun':
      return forms.dativePronoun;
    case 'journeyVerb':
      return forms.journeyVerb;
    default:
      return null;
  }
}

String renderParticipantTemplate(String template, RitualParticipants participants) {
  final normalizedTemplate = _replaceLegacyTokens(template);
  return normalizedTemplate.replaceAllMapped(
    RegExp(r'\{\{(p1|p2)\.(\w+)\}\}'),
    (match) {
      final participantId = match.group(1) == 'p1' ? ParticipantId.p1 : ParticipantId.p2;
      final tokenName = match.group(2)!;
      return _getTokenValue(participants, participantId, tokenName) ?? match.group(0)!;
    },
  );
}

class TemplateSegment {
  const TemplateSegment({
    required this.kind,
    required this.text,
    this.participantId,
  });

  final GuidedAudioSegmentKind kind;
  final String text;
  final ParticipantId? participantId;
}

List<TemplateSegment> splitTemplateIntoAudioSegments(
  String template,
  RitualParticipants participants,
) {
  final normalizedTemplate = _replaceLegacyTokens(template);
  final segments = <TemplateSegment>[];
  final regex = RegExp(r'\{\{(p1|p2)\.name\}\}');
  var lastIndex = 0;

  for (final match in regex.allMatches(normalizedTemplate)) {
    final phraseChunk = normalizedTemplate.substring(lastIndex, match.start);
    final renderedChunk = renderParticipantTemplate(phraseChunk, participants);

    if (renderedChunk.isNotEmpty) {
      segments.add(
        TemplateSegment(
          kind: GuidedAudioSegmentKind.phrase,
          text: renderedChunk,
        ),
      );
    }

    final participantId = match.group(1) == 'p1' ? ParticipantId.p1 : ParticipantId.p2;
    segments.add(
      TemplateSegment(
        kind: GuidedAudioSegmentKind.name,
        text: participants[participantId].name,
        participantId: participantId,
      ),
    );

    lastIndex = match.end;
  }

  final trailingChunk = normalizedTemplate.substring(lastIndex);
  final renderedTrailing = renderParticipantTemplate(trailingChunk, participants);
  if (renderedTrailing.isNotEmpty) {
    segments.add(
      TemplateSegment(
        kind: GuidedAudioSegmentKind.phrase,
        text: renderedTrailing,
      ),
    );
  }

  return segments;
}

String normalizeNameForStorage(String name) {
  final normalizedBase = name
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9а-яё]+', unicode: true), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
  final normalized = normalizedBase.length > 40
      ? normalizedBase.substring(0, 40)
      : normalizedBase;

  if (normalized.isNotEmpty) {
    return normalized;
  }

  return 'name-${_fastHash(name.trim().toLowerCase())}';
}

String _fastHash(String input) {
  var hash = 2166136261;
  for (final codeUnit in input.codeUnits) {
    hash ^= codeUnit;
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash & 0xffffffff).toRadixString(16);
}
