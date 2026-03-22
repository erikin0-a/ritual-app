import '../models/app_models.dart';
import 'voice_script_catalog.dart';

enum CueType { voice, music }

class AudioCueVariant {
  const AudioCueVariant({
    this.voiceKey,
    this.subtitle,
    this.highlightedParticipants = const [],
  });

  final String? voiceKey;
  final String? subtitle;
  final List<ParticipantId> highlightedParticipants;
}

class AudioCue {
  const AudioCue({
    required this.offsetSeconds,
    required this.type,
    this.voiceKey,
    this.fallbackUri,
    this.subtitle,
    this.highlightedParticipants = const [],
    this.variants = const {},
  });

  final int offsetSeconds;
  final CueType type;
  final String? voiceKey;
  final String? fallbackUri;
  final String? subtitle;
  final List<ParticipantId> highlightedParticipants;
  final Map<GuidedBranch, AudioCueVariant> variants;
}

class RoundAudioTrack {
  const RoundAudioTrack({
    required this.roundId,
    required this.musicUri,
    required this.cues,
  });

  final int roundId;
  final String musicUri;
  final List<AudioCue> cues;
}

String buildMusicUri(String baseUrl, String filename) => '$baseUrl/music/$filename';

String buildVoiceFallbackUri(String baseUrl, String filename) => '$baseUrl/voice/$filename';

List<RoundAudioTrack> buildAudioTimeline(String baseUrl) {
  return [
    RoundAudioTrack(
      roundId: 1,
      musicUri: buildMusicUri(baseUrl, 'round1-ambient.mp3'),
      cues: [
        AudioCue(
          offsetSeconds: 0,
          type: CueType.voice,
          voiceKey: 'round_0_intro_01',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-intro.mp3'),
          subtitle:
              'Добро пожаловать, {{p1.name}} и {{p2.name}}. В этом раунде нельзя касаться. Только взгляд.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 40,
          type: CueType.voice,
          voiceKey: 'round_1_task_01',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-task1.mp3'),
          subtitle: 'Посмотрите друг другу в глаза. Просто держите взгляд одну минуту.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 100,
          type: CueType.voice,
          voiceKey: 'round_1_task_02',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-task2.mp3'),
          subtitle: 'Сделайте вместе вдох и выдох. И снова — взгляд.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 140,
          type: CueType.voice,
          voiceKey: 'round_1_task_03',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-task3.mp3'),
          subtitle:
              '{{p1.name}}, скажи одну фразу, которая заставляет тебя хотеть партнёра сильнее. {{p2.name}} — только взгляд и кивок.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 170,
          type: CueType.voice,
          voiceKey: 'round_1_task_06',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-task4.mp3'),
          subtitle: 'Улыбнитесь друг другу. Медленно. Как будто это ваш секрет.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 220,
          type: CueType.voice,
          voiceKey: 'round_1_task_09',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-task5.mp3'),
          subtitle: '{{p1.name}} шепчет: «Я здесь». {{p2.name}} отвечает: «Я вижу тебя».',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 260,
          type: CueType.voice,
          voiceKey: 'round_1_task_16',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r1-task6.mp3'),
          subtitle:
              'Теперь — по очереди. {{p1.name}}, прошепчи имя {{p2.name}}. {{p2.name}}, прошепчи имя {{p1.name}}.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
      ],
    ),
    RoundAudioTrack(
      roundId: 2,
      musicUri: buildMusicUri(baseUrl, 'round2-tension.mp3'),
      cues: [
        AudioCue(
          offsetSeconds: 0,
          type: CueType.voice,
          voiceKey: 'round_2_task_01',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-intro.mp3'),
          subtitle: 'Сейчас на экране появится рулетка. Она выберет того, кто будет вести этот раунд.',
        ),
        AudioCue(
          offsetSeconds: 8,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-lead.mp3'),
          subtitle: 'Ведущий выбран. Второй партнёр только принимает.',
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_2_task_02_a',
              subtitle:
                  '{{p1.name}} ведёт этот раунд. {{p2.name}} — ты принимаешь. Без ответных прикосновений.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_2_task_02_b',
              subtitle:
                  '{{p2.name}} ведёт этот раунд. {{p1.name}} — ты принимаешь. Без ответных прикосновений.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 20,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-task1.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_2_task_03_a',
              subtitle:
                  '{{p2.name}}, дай руку. {{p1.name}}, начни с ладони. Медленно проведи пальцем по контуру… и остановись.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_2_task_03_b',
              subtitle:
                  '{{p1.name}}, дай руку. {{p2.name}}, начни с ладони. Медленно проведи пальцем по контуру… и остановись.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 40,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-task2.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_2_task_04_a',
              subtitle:
                  '{{p1.name}}, положи ладонь на грудь партнёра, там где слышно дыхание. Десять секунд… и убери руку. {{p2.name}}, просто принимай.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_2_task_04_b',
              subtitle:
                  '{{p2.name}}, ладонь — на грудь партнёра, там где слышно дыхание. Десять секунд… и убери руку. {{p1.name}}, просто принимай.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 80,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-task3.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_2_task_06_a',
              subtitle:
                  '{{p1.name}}, шаг ближе. Остановись в сантиметре. {{p2.name}}, почувствуй тепло… без ответа.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_2_task_06_b',
              subtitle:
                  '{{p2.name}}, шаг ближе. Остановись в сантиметре. {{p1.name}}, почувствуй тепло… без ответа.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 160,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-task4.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_2_task_14_a',
              subtitle:
                  '{{p1.name}}, один короткий поцелуй в шею. И сразу — пауза. Смотри в глаза.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_2_task_14_b',
              subtitle:
                  '{{p2.name}}, один короткий поцелуй в шею. И сразу — пауза. Смотри в глаза.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 250,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r2-task5.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_2_task_15_a',
              subtitle:
                  '{{p1.name}}, обними партнёра на три вдоха. Затем отпусти… и снова оставь расстояние. {{p2.name}}, не отвечай руками.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_2_task_15_b',
              subtitle:
                  '{{p2.name}}, обними партнёра на три вдоха. Затем отпусти… и снова оставь расстояние. {{p1.name}}, не отвечай руками.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
      ],
    ),
    RoundAudioTrack(
      roundId: 3,
      musicUri: buildMusicUri(baseUrl, 'round3-desire.mp3'),
      cues: [
        AudioCue(
          offsetSeconds: 0,
          type: CueType.voice,
          voiceKey: 'round_3_task_01',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-intro.mp3'),
          subtitle:
              'Сейчас начинается раунд «Соблазнение». Снимать вещи нельзя. Действует один партнёр. Через пару минут вы поменяетесь.',
        ),
        AudioCue(
          offsetSeconds: 10,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-lead.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_3_task_01_a',
              subtitle:
                  'Сейчас действует {{p1.name}}. {{p2.name}} — ты принимаешь. Руки при себе. Только дыхание.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_3_task_01_b',
              subtitle:
                  'Сейчас действует {{p2.name}}. {{p1.name}} — ты принимаешь. Руки при себе. Только дыхание.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 40,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-task1.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_3_task_02_a',
              subtitle:
                  '{{p1.name}}, начни прикосновения. Кончики пальцев — медленно по плечу. Потом — по шее. Остановись. Убери руку.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_3_task_02_b',
              subtitle:
                  '{{p2.name}}, начни прикосновения. Кончики пальцев — медленно по плечу. Потом — по шее. Остановись. Убери руку.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 120,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-task2.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_3_task_12_a',
              subtitle:
                  '{{p1.name}}, один поцелуй в шею. Затем ладонь на талию. Притяни ближе на один вдох… и отпусти. {{p2.name}} — не отвечай руками.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_3_task_12_b',
              subtitle:
                  '{{p2.name}}, один поцелуй в шею. Затем ладонь на талию. Притяни ближе на один вдох… и отпусти. {{p1.name}} — не отвечай руками.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 170,
          type: CueType.voice,
          voiceKey: 'round_3_task_13',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-task3.mp3'),
          subtitle:
              'Ещё тридцать секунд. Поцелуи по ключице. Медленно, один за другим. Не ускоряйся.',
        ),
        AudioCue(
          offsetSeconds: 210,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-shift.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_3_task_14_a',
              subtitle:
                  'Смена. Теперь действует {{p2.name}}. {{p1.name}} — стой спокойно. Руки при себе. Только дыхание.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_3_task_14_b',
              subtitle:
                  'Смена. Теперь действует {{p1.name}}. {{p2.name}} — стой спокойно. Руки при себе. Только дыхание.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 240,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-task4.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_3_task_15_a',
              subtitle:
                  '{{p2.name}}, начни прикосновения. Ладонь — на грудь партнёра через одежду. Один вдох вместе… и убери руку.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_3_task_15_b',
              subtitle:
                  '{{p1.name}}, начни прикосновения. Ладонь — на грудь партнёра через одежду. Один вдох вместе… и убери руку.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
        AudioCue(
          offsetSeconds: 270,
          type: CueType.voice,
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r3-task5.mp3'),
          variants: {
            GuidedBranch.a: const AudioCueVariant(
              voiceKey: 'round_3_task_16_a',
              subtitle:
                  'И последнее в этом раунде. {{p2.name}}, подойди к уху партнёра и скажи: «Я хочу тебя». Потом отстранись на шаг.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
            GuidedBranch.b: const AudioCueVariant(
              voiceKey: 'round_3_task_16_b',
              subtitle:
                  'И последнее в этом раунде. {{p1.name}}, подойди к уху партнёра и скажи: «Я хочу тебя». Потом отстранись на шаг.',
              highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
            ),
          },
        ),
      ],
    ),
    RoundAudioTrack(
      roundId: 4,
      musicUri: buildMusicUri(baseUrl, 'round4-intimate.mp3'),
      cues: [
        AudioCue(
          offsetSeconds: 0,
          type: CueType.voice,
          voiceKey: 'round_4_task_01',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r4-intro.mp3'),
          subtitle:
              'Вы почти у цели. Сейчас можно снять одну-две вещи. Но только по очереди — и только если партнёр согласен.',
        ),
        AudioCue(
          offsetSeconds: 40,
          type: CueType.voice,
          voiceKey: 'round_4_task_03',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r4-task1.mp3'),
          subtitle:
              '{{p1.name}}, твоя очередь. Коснись рукой одежды партнёра — той вещи, которую ты хочешь снять. Посмотри партнёру в глаза.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 150,
          type: CueType.voice,
          voiceKey: 'round_4_task_09',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r4-task2.mp3'),
          subtitle:
              'Теперь {{p2.name}}. Коснись рукой одежды партнёра — той вещи, которую хочешь снять. Посмотри партнёру в глаза.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 250,
          type: CueType.voice,
          voiceKey: 'round_4_task_16',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r4-task3.mp3'),
          subtitle:
              'Теперь — поцелуи и руки. 20 секунд действует {{p1.name}}. Потом 20 секунд действует {{p2.name}}. Держите очередность.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
      ],
    ),
    RoundAudioTrack(
      roundId: 5,
      musicUri: buildMusicUri(baseUrl, 'round5-finale.mp3'),
      cues: [
        AudioCue(
          offsetSeconds: 0,
          type: CueType.voice,
          voiceKey: 'round_5_task_01',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r5-intro.mp3'),
          subtitle:
              'Финальный раунд. Главное правило остаётся: без проникновения и без кульминации. Сейчас будет меньше слов.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 60,
          type: CueType.voice,
          voiceKey: 'round_5_task_04',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r5-task1.mp3'),
          subtitle:
              '{{p1.name}} — веди одну минуту: поцелуи и руки. {{p2.name}} — только принимай. Потом смена.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 120,
          type: CueType.voice,
          voiceKey: 'round_5_task_05',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r5-task2.mp3'),
          subtitle:
              'Смена. {{p2.name}} — веди одну минуту: поцелуи и руки. {{p1.name}} — только принимай.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 180,
          type: CueType.voice,
          voiceKey: 'round_5_task_06',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r5-task3.mp3'),
          subtitle:
              'Если вам обоим комфортно — снимите ещё одну вещь. По очереди. Сначала {{p1.name}}… потом {{p2.name}}.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 220,
          type: CueType.voice,
          voiceKey: 'round_5_task_07',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r5-task4.mp3'),
          subtitle:
              'Теперь ближе. {{p1.name}}, поцелуй ниже живота. Рука — по внутренней стороне бедра. Три мягких касания.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
        AudioCue(
          offsetSeconds: 270,
          type: CueType.voice,
          voiceKey: 'round_5_task_08',
          fallbackUri: buildVoiceFallbackUri(baseUrl, 'r5-task5.mp3'),
          subtitle: 'Я оставляю вас вдвоём. Дальше вы ведёте сами.',
          highlightedParticipants: [ParticipantId.p1, ParticipantId.p2],
        ),
      ],
    ),
  ];
}

AudioCueVariant? getCueVariant(AudioCue cue, GuidedBranch? branch) => cue.variants[branch];

RoundAudioTrack? getAudioTrack(List<RoundAudioTrack> timeline, int roundId) {
  for (final track in timeline) {
    if (track.roundId == roundId) return track;
  }
  return null;
}

List<GuidedPreloadItem> getPreloadItemsForRound(List<RoundAudioTrack> timeline, int roundId) {
  final track = getAudioTrack(timeline, roundId);
  if (track == null) return const [];

  return track.cues
      .expand((cue) => [
            cue.voiceKey,
            cue.variants[GuidedBranch.a]?.voiceKey,
            cue.variants[GuidedBranch.b]?.voiceKey,
          ])
      .whereType<String>()
      .map((cueKey) => GuidedPreloadItem(cueKey: cueKey))
      .toList(growable: false);
}

List<GuidedPreloadItem> getAllGuidedPreloadItems() {
  return voiceScriptKeys
      .map((cueKey) => GuidedPreloadItem(cueKey: cueKey))
      .toList(growable: false);
}
