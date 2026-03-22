import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_env.dart';
import '../../domain/constants/audio_timeline.dart';
import '../../domain/constants/voice_script_catalog.dart';
import '../../domain/logic/ritual_participants.dart';
import '../../domain/models/app_models.dart';
import 'app_services.dart';

final guidedAudioServiceProvider = Provider<GuidedAudioService>(
  (ref) => GuidedAudioService(ref),
);

class GuidedAudioService {
  GuidedAudioService(this._ref);

  final Ref _ref;
  final Map<String, GuidedCueManifest> _manifestCache = {};
  final Map<String, Future<GuidedCueManifest>> _inFlightManifests = {};

  static const _nameAudioCachePrefix = '@name_audio_url:';

  AppEnv get _env => _ref.read(appEnvProvider);
  SupabaseClient? get _supabase => _ref.read(supabaseClientProvider);
  SharedPreferences get _preferences => _ref.read(sharedPreferencesProvider);

  List<RoundAudioTrack> timeline() =>
      buildAudioTimeline(_env.guidedAudioPublicBaseUrl);

  String _storagePublicUrl(String storagePath) {
    final supabase = _supabase;
    if (supabase == null) return storagePath;
    return supabase.storage
        .from(_env.guidedAudioBucket)
        .getPublicUrl(storagePath);
  }

  String _fastHash(String input) {
    var hash = 2166136261;
    for (final codeUnit in input.codeUnits) {
      hash ^= codeUnit;
      hash +=
          (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash & 0xffffffff).toRadixString(16);
  }

  String _stripSsml(String value) {
    return value
        .replaceAll(RegExp(r'<break[^>]*\/>'), ' ')
        .replaceAll(RegExp(r'<\/?[^>]+>'), ' ')
        .replaceAll(RegExp(r'\[.*?\]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  String _sanitizeTextForStorage(String value) {
    final normalized = _stripSsml(value)
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9а-яё]+', unicode: true), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');

    return normalized.length > 64 ? normalized.substring(0, 64) : normalized;
  }

  String _phraseStoragePath(String segmentText) {
    final normalizedText = segmentText.trim();
    final strippedText = _stripSsml(normalizedText);
    final segmentKey = _sanitizeTextForStorage(normalizedText);
    return '${_env.guidedAudioPhrasePrefix}/${_env.guidedAudioVoiceProfile}/'
        '$segmentKey-${_fastHash(strippedText)}.mp3';
  }

  String _nameStoragePath(
      ParticipantId participantId, RitualParticipants participants) {
    final participant = participants[participantId];
    final normalizedName = normalizeNameForStorage(participant.name);
    return '${_env.guidedAudioNamePrefix}/${_env.guidedAudioVoiceProfile}/'
        '${participant.gender.name}/$normalizedName.mp3';
  }

  List<GuidedAudioSegment> _buildLocalSegments(
      String cueKey, RitualParticipants participants) {
    final template = voiceScriptCatalog[cueKey];
    if (template == null) return const [];

    final segments = splitTemplateIntoAudioSegments(template, participants);
    return [
      for (var index = 0; index < segments.length; index++)
        GuidedAudioSegment(
          id: '$cueKey-segment-${index + 1}',
          cacheKey: _fastHash(
            '$cueKey:${segments[index].kind.name}:${segments[index].participantId?.name ?? 'phrase'}:${segments[index].text}',
          ),
          kind: segments[index].kind,
          text: segments[index].text,
          participantId: segments[index].participantId,
          storagePath: segments[index].kind == GuidedAudioSegmentKind.name
              ? _nameStoragePath(segments[index].participantId!, participants)
              : _phraseStoragePath(segments[index].text),
          uri: _storagePublicUrl(
            segments[index].kind == GuidedAudioSegmentKind.name
                ? _nameStoragePath(segments[index].participantId!, participants)
                : _phraseStoragePath(segments[index].text),
          ),
        ),
    ];
  }

  Future<Map<String, dynamic>?> _resolveRemoteSegments(
    String cueKey,
    List<GuidedAudioSegment> segments,
    RitualParticipants participants,
  ) async {
    final supabase = _supabase;
    if (supabase == null || !_env.hasSupabase) {
      return null;
    }

    try {
      final response = await supabase.functions.invoke(
        _env.guidedAudioFunctionName,
        body: {
          'cueKey': cueKey,
          'voiceProfile': _env.guidedAudioVoiceProfile,
          'bucket': _env.guidedAudioBucket,
          'manifestPrefix': _env.guidedAudioManifestPrefix,
          'segments': [
            for (final segment in segments)
              {
                'cacheKey': segment.cacheKey,
                'kind': segment.kind.name,
                'text': segment.text,
                'storagePath': segment.storagePath,
                'participantId': segment.participantId?.name,
              },
          ],
          'participants': {
            'p1': {
              'id': participants.p1.id.name,
              'name': participants.p1.name,
              'gender': participants.p1.gender.name,
            },
            'p2': {
              'id': participants.p2.id.name,
              'name': participants.p2.name,
              'gender': participants.p2.gender.name,
            },
          },
        },
      );

      return response.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  GuidedCueManifest buildGuidedCueManifest(
    String cueKey,
    RitualParticipants participants, {
    String? subtitleTemplate,
    List<ParticipantId> highlightedParticipants = const [],
  }) {
    final template = voiceScriptCatalog[cueKey] ?? '';
    final localSegments = _buildLocalSegments(cueKey, participants);
    return GuidedCueManifest(
      cueKey: cueKey,
      renderedText: renderParticipantTemplate(template, participants),
      subtitleText: _stripSsml(renderParticipantTemplate(
          subtitleTemplate ?? template, participants)),
      highlightedParticipants: highlightedParticipants,
      audioSegments: localSegments,
    );
  }

  Future<GuidedCueManifest> resolveGuidedCueManifest(
    String cueKey,
    RitualParticipants participants, {
    String? subtitleTemplate,
    List<ParticipantId> highlightedParticipants = const [],
  }) async {
    final cacheKey =
        '$cueKey:${participants.p1.name}:${participants.p2.name}:${subtitleTemplate ?? ''}:${highlightedParticipants.map((e) => e.name).join(',')}';
    final cached = _manifestCache[cacheKey];
    if (cached != null) return cached;

    final inFlight = _inFlightManifests[cacheKey];
    if (inFlight != null) return inFlight;

    final future = () async {
      final localManifest = buildGuidedCueManifest(
        cueKey,
        participants,
        subtitleTemplate: subtitleTemplate,
        highlightedParticipants: highlightedParticipants,
      );
      final remote = await _resolveRemoteSegments(
        cueKey,
        localManifest.audioSegments,
        participants,
      );

      final remoteSegments = <String, Map<String, dynamic>>{};
      for (final segment
          in (remote?['segments'] as List<dynamic>? ?? const [])) {
        final map = segment as Map<String, dynamic>;
        remoteSegments[map['cacheKey'] as String] = map;
      }

      final resolvedManifest = GuidedCueManifest(
        cueKey: localManifest.cueKey,
        renderedText: localManifest.renderedText,
        subtitleText: localManifest.subtitleText,
        highlightedParticipants: localManifest.highlightedParticipants,
        remoteManifestUri: remote?['manifestUri'] as String?,
        generatedNamePaths: (remote?['generatedNamePaths'] as List<dynamic>?)
            ?.map((item) => item.toString())
            .toList(),
        audioSegments: [
          for (final segment in localManifest.audioSegments)
            remoteSegments.containsKey(segment.cacheKey)
                ? segment.copyWith(
                    storagePath:
                        remoteSegments[segment.cacheKey]!['storagePath']
                            as String?,
                    uri: remoteSegments[segment.cacheKey]!['uri'] as String?,
                  )
                : segment,
        ],
      );

      _manifestCache[cacheKey] = resolvedManifest;
      return resolvedManifest;
    }();

    _inFlightManifests[cacheKey] = future;
    try {
      return await future;
    } finally {
      _inFlightManifests.remove(cacheKey);
    }
  }

  Future<String?> ensureNameAudioAtPath(String name, String storagePath) async {
    final cacheKey = '$_nameAudioCachePrefix$storagePath';
    final cached = _preferences.getString(cacheKey);
    if (cached != null && cached.isNotEmpty) return cached;

    final supabase = _supabase;
    if (supabase == null) return null;

    try {
      final response = await supabase.functions.invoke(
        _env.guidedAudioPrimeFunctionName,
        body: {
          'bucket': _env.guidedAudioBucket,
          'segments': [
            {
              'text': name,
              'storagePath': storagePath,
            }
          ],
        },
      );

      final data = response.data as Map<String, dynamic>?;
      final uploaded = data?['uploaded'] as List<dynamic>?;
      final url = uploaded != null && uploaded.isNotEmpty
          ? (uploaded.first as Map<String, dynamic>)['uri'] as String?
          : _storagePublicUrl(storagePath);
      if (url != null) {
        await _preferences.setString(cacheKey, url);
      }
      return url;
    } catch (_) {
      return null;
    }
  }

  Future<void> warmNameAudio(RitualParticipants participants) async {
    await Future.wait([
      ensureNameAudioAtPath(
        participants.p1.name,
        _nameStoragePath(ParticipantId.p1, participants),
      ),
      ensureNameAudioAtPath(
        participants.p2.name,
        _nameStoragePath(ParticipantId.p2, participants),
      ),
    ]);
  }

  Future<void> playMusic(String uri) async {
    final player = _ref.read(musicPlayerProvider);
    await player.setLoopMode(LoopMode.one);
    await player.setVolume(0.3);
    await player.setUrl(uri);
    await player.play();
  }

  Future<void> stopMusic() async {
    final player = _ref.read(musicPlayerProvider);
    await player.stop();
  }

  Future<GuidedCueManifest?> playVoice(
    String keyOrUri, {
    required RitualParticipants participants,
    String? fallbackUri,
    String? subtitleTemplate,
    List<ParticipantId> highlightedParticipants = const [],
  }) async {
    final player = _ref.read(voicePlayerProvider);
    if (voiceScriptCatalog.containsKey(keyOrUri)) {
      final manifest = await resolveGuidedCueManifest(
        keyOrUri,
        participants,
        subtitleTemplate: subtitleTemplate,
        highlightedParticipants: highlightedParticipants,
      );
      if (manifest.audioSegments.isNotEmpty) {
        await player.setUrl(
            manifest.audioSegments.first.uri ?? fallbackUri ?? keyOrUri);
        await player.play();
      }
      return manifest;
    }

    await player.setUrl(fallbackUri ?? keyOrUri);
    await player.play();
    return null;
  }

  Future<void> pauseAll() async {
    await Future.wait([
      _ref.read(voicePlayerProvider).pause(),
      _ref.read(musicPlayerProvider).pause(),
    ]);
  }

  Future<void> resumeAll() async {
    await Future.wait([
      _ref.read(voicePlayerProvider).play(),
      _ref.read(musicPlayerProvider).play(),
    ]);
  }

  Future<void> stopAll() async {
    await Future.wait([
      _ref.read(voicePlayerProvider).stop(),
      _ref.read(musicPlayerProvider).stop(),
    ]);
  }

  Future<void> preload(
    List<GuidedPreloadItem> items,
    RitualParticipants participants,
  ) async {
    for (final item in items) {
      await resolveGuidedCueManifest(item.cueKey, participants);
    }
  }

  String serializeParticipants(RitualParticipants participants) {
    return jsonEncode({
      'p1': {
        'id': participants.p1.id.name,
        'name': participants.p1.name,
        'gender': participants.p1.gender.name,
      },
      'p2': {
        'id': participants.p2.id.name,
        'name': participants.p2.name,
        'gender': participants.p2.gender.name,
      },
    });
  }

  RitualParticipants deserializeParticipants(String? raw) {
    if (raw == null || raw.isEmpty) return defaultRitualParticipants;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return RitualParticipants(
        p1: RitualParticipant(
          id: ParticipantId.p1,
          name: (map['p1'] as Map<String, dynamic>)['name'] as String? ??
              'Партнёр 1',
          gender:
              ((map['p1'] as Map<String, dynamic>)['gender'] as String?) == 'f'
                  ? ParticipantGender.f
                  : ParticipantGender.m,
        ),
        p2: RitualParticipant(
          id: ParticipantId.p2,
          name: (map['p2'] as Map<String, dynamic>)['name'] as String? ??
              'Партнёр 2',
          gender:
              ((map['p2'] as Map<String, dynamic>)['gender'] as String?) == 'm'
                  ? ParticipantGender.m
                  : ParticipantGender.f,
        ),
      );
    } catch (_) {
      return defaultRitualParticipants;
    }
  }
}
