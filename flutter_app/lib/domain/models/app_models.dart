enum RitualMode { free, guided }

enum GuidedBranch { a, b }

enum SubscriptionStatus { free, premium, loading }

enum IntimacyLevel { light, moderate, spicy }

enum DurationPreference { short, standard, extended }

enum ParticipantId { p1, p2 }

enum ParticipantGender { m, f }

enum GuidedAudioSegmentKind { phrase, name }

enum TruthOrDareCategory { light, spicy, wild }

enum TruthOrDareType { truth, dare }

class UserProfile {
  const UserProfile({
    required this.id,
    required this.intimacyLevel,
    required this.durationPreference,
    required this.isPremium,
    required this.createdAt,
    this.partnerId,
  });

  final String id;
  final IntimacyLevel intimacyLevel;
  final DurationPreference durationPreference;
  final String? partnerId;
  final bool isPremium;
  final String createdAt;
}

class RitualSession {
  const RitualSession({
    required this.id,
    required this.mode,
    required this.startedAt,
    required this.roundsCompleted,
    this.completedAt,
  });

  final String id;
  final RitualMode mode;
  final String startedAt;
  final String? completedAt;
  final int roundsCompleted;
}

class DiceResult {
  const DiceResult({
    required this.action,
    required this.bodyPart,
    required this.style,
  });

  final String action;
  final String bodyPart;
  final String style;
}

class RitualParticipant {
  const RitualParticipant({
    required this.id,
    required this.name,
    required this.gender,
  });

  final ParticipantId id;
  final String name;
  final ParticipantGender gender;

  RitualParticipant copyWith({
    ParticipantId? id,
    String? name,
    ParticipantGender? gender,
  }) {
    return RitualParticipant(
      id: id ?? this.id,
      name: name ?? this.name,
      gender: gender ?? this.gender,
    );
  }
}

class RitualParticipants {
  const RitualParticipants({
    required this.p1,
    required this.p2,
  });

  final RitualParticipant p1;
  final RitualParticipant p2;

  RitualParticipant operator [](ParticipantId id) => id == ParticipantId.p1 ? p1 : p2;

  RitualParticipants copyWith({
    RitualParticipant? p1,
    RitualParticipant? p2,
  }) {
    return RitualParticipants(
      p1: p1 ?? this.p1,
      p2: p2 ?? this.p2,
    );
  }
}

class ParticipantGrammarForms {
  const ParticipantGrammarForms({
    required this.subjectPronoun,
    required this.objectPronoun,
    required this.possessivePronoun,
    required this.dativePronoun,
    required this.journeyVerb,
  });

  final String subjectPronoun;
  final String objectPronoun;
  final String possessivePronoun;
  final String dativePronoun;
  final String journeyVerb;
}

class GuidedAudioSegment {
  const GuidedAudioSegment({
    required this.id,
    required this.cacheKey,
    required this.kind,
    required this.text,
    this.storagePath,
    this.uri,
    this.participantId,
  });

  final String id;
  final String cacheKey;
  final GuidedAudioSegmentKind kind;
  final String text;
  final String? storagePath;
  final String? uri;
  final ParticipantId? participantId;

  GuidedAudioSegment copyWith({
    String? storagePath,
    String? uri,
  }) {
    return GuidedAudioSegment(
      id: id,
      cacheKey: cacheKey,
      kind: kind,
      text: text,
      storagePath: storagePath ?? this.storagePath,
      uri: uri ?? this.uri,
      participantId: participantId,
    );
  }
}

class GuidedCueManifest {
  const GuidedCueManifest({
    required this.cueKey,
    required this.renderedText,
    required this.subtitleText,
    required this.highlightedParticipants,
    required this.audioSegments,
    this.remoteManifestUri,
    this.generatedNamePaths,
  });

  final String cueKey;
  final String renderedText;
  final String subtitleText;
  final List<ParticipantId> highlightedParticipants;
  final List<GuidedAudioSegment> audioSegments;
  final String? remoteManifestUri;
  final List<String>? generatedNamePaths;
}

class GuidedPreloadItem {
  const GuidedPreloadItem({
    required this.cueKey,
    this.fallbackUri,
  });

  final String cueKey;
  final String? fallbackUri;
}

class TruthOrDareCardModel {
  const TruthOrDareCardModel({
    required this.id,
    required this.type,
    required this.category,
    required this.content,
  });

  final String id;
  final TruthOrDareType type;
  final TruthOrDareCategory category;
  final String content;
}
