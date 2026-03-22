import 'dart:async';
import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/analytics_service.dart';
import '../../../core/services/guided_audio_service.dart';
import '../../../domain/constants/audio_timeline.dart';
import '../../../domain/constants/guided_session.dart';
import '../../../domain/constants/ritual_config.dart';
import '../../../domain/logic/ritual_participants.dart';
import '../../../domain/models/app_models.dart';
import '../../auth/state/auth_controller.dart';

enum RitualStatus { idle, starting, inRound, transitioning, completed }

enum SessionPhase {
  prelude,
  transition,
  setup,
  roundPlayback,
  completion,
  loading
}

const _ritualUnset = Object();

class RitualState {
  const RitualState({
    required this.status,
    required this.phase,
    required this.currentRound,
    required this.roundTimeRemaining,
    required this.mode,
    required this.isPaused,
    required this.completedRounds,
    required this.rounds,
    required this.branchByRound,
    required this.currentCueSubtitle,
    required this.voiceParticipants,
    required this.warmupReady,
  });

  factory RitualState.initial() => RitualState(
        status: RitualStatus.idle,
        phase: SessionPhase.loading,
        currentRound: null,
        roundTimeRemaining: 0,
        mode: RitualMode.free,
        isPaused: false,
        completedRounds: const [],
        rounds: getRitualRounds(DurationPreference.standard),
        branchByRound: const {},
        currentCueSubtitle: null,
        voiceParticipants: defaultRitualParticipants,
        warmupReady: false,
      );

  final RitualStatus status;
  final SessionPhase phase;
  final int? currentRound;
  final int roundTimeRemaining;
  final RitualMode mode;
  final bool isPaused;
  final List<int> completedRounds;
  final List<RoundConfig> rounds;
  final Map<int, GuidedBranch> branchByRound;
  final String? currentCueSubtitle;
  final RitualParticipants voiceParticipants;
  final bool warmupReady;

  RitualState copyWith({
    RitualStatus? status,
    SessionPhase? phase,
    int? currentRound,
    int? roundTimeRemaining,
    RitualMode? mode,
    bool? isPaused,
    List<int>? completedRounds,
    List<RoundConfig>? rounds,
    Map<int, GuidedBranch>? branchByRound,
    Object? currentCueSubtitle = _ritualUnset,
    RitualParticipants? voiceParticipants,
    bool? warmupReady,
  }) {
    return RitualState(
      status: status ?? this.status,
      phase: phase ?? this.phase,
      currentRound: currentRound ?? this.currentRound,
      roundTimeRemaining: roundTimeRemaining ?? this.roundTimeRemaining,
      mode: mode ?? this.mode,
      isPaused: isPaused ?? this.isPaused,
      completedRounds: completedRounds ?? this.completedRounds,
      rounds: rounds ?? this.rounds,
      branchByRound: branchByRound ?? this.branchByRound,
      currentCueSubtitle: identical(currentCueSubtitle, _ritualUnset)
          ? this.currentCueSubtitle
          : currentCueSubtitle as String?,
      voiceParticipants: voiceParticipants ?? this.voiceParticipants,
      warmupReady: warmupReady ?? this.warmupReady,
    );
  }
}

final ritualControllerProvider =
    NotifierProvider<RitualController, RitualState>(RitualController.new);

class RitualController extends Notifier<RitualState> {
  Timer? _roundTimer;

  @override
  RitualState build() => RitualState.initial();

  Future<void> startRitual(RitualMode mode) async {
    final auth = ref.read(authControllerProvider);
    final durationPreference =
        auth.durationPreference ?? DurationPreference.standard;
    final rounds = getRitualRounds(durationPreference);
    final firstRound = rounds.first;
    final participants = auth.ritualParticipants;

    state = state.copyWith(
      status: RitualStatus.starting,
      phase: mode == RitualMode.guided
          ? SessionPhase.loading
          : SessionPhase.transition,
      mode: mode,
      currentRound: firstRound.id,
      roundTimeRemaining: firstRound.duration,
      completedRounds: const [],
      rounds: rounds,
      voiceParticipants: participants,
      warmupReady: mode == RitualMode.free,
    );

    await ref.read(analyticsServiceProvider).ritualStarted(mode);

    if (mode == RitualMode.guided) {
      await _prepareGuided(participants);
      state = state.copyWith(phase: SessionPhase.prelude, warmupReady: true);
      await Future<void>.delayed(const Duration(milliseconds: 1200));
    }

    await _startRoundPlayback(initial: true);
  }

  Future<void> _prepareGuided(RitualParticipants participants) async {
    final service = ref.read(guidedAudioServiceProvider);
    await service.warmNameAudio(participants);
    await service.preload(getAllGuidedPreloadItems(), participants);
  }

  Future<void> _startRoundPlayback({bool initial = false}) async {
    final round =
        state.rounds.firstWhere((item) => item.id == state.currentRound);
    final transitionKey =
        initial ? 'intro-${round.id}' : '${round.id - 1}-${round.id}';

    state = state.copyWith(
      status: RitualStatus.inRound,
      phase: SessionPhase.transition,
      roundTimeRemaining: round.duration,
    );

    if (state.mode == RitualMode.guided &&
        guidedTransitionCues.containsKey(transitionKey)) {
      final cue = guidedTransitionCues[transitionKey]!;
      await ref.read(guidedAudioServiceProvider).playVoice(
            cue.voiceKey,
            participants: state.voiceParticipants,
            subtitleTemplate: cue.subtitle,
            highlightedParticipants: cue.highlightedParticipants,
          );
      state = state.copyWith(currentCueSubtitle: cue.subtitle);
      await Future<void>.delayed(Duration(milliseconds: cue.delayMs));
    } else {
      await Future<void>.delayed(const Duration(milliseconds: 1200));
    }

    final scene = guidedRoundScenes[state.currentRound];
    if (state.mode == RitualMode.guided &&
        scene != null &&
        scene.setupKind != GuidedSetupKind.none) {
      state = state.copyWith(phase: SessionPhase.setup);
      await Future<void>.delayed(const Duration(milliseconds: 1400));
      if (scene.setupKind == GuidedSetupKind.roulette) {
        setRoundBranch(
          scene.roundId,
          Random().nextBool() ? GuidedBranch.a : GuidedBranch.b,
        );
      } else if (!state.branchByRound.containsKey(scene.roundId)) {
        setRoundBranch(scene.roundId, GuidedBranch.a);
      }
    }

    if (state.mode == RitualMode.guided) {
      final track = getAudioTrack(
        ref.read(guidedAudioServiceProvider).timeline(),
        state.currentRound!,
      );
      if (track != null) {
        await ref.read(guidedAudioServiceProvider).playMusic(track.musicUri);
      }
    }

    state = state.copyWith(phase: SessionPhase.roundPlayback);
    _roundTimer?.cancel();
    _roundTimer =
        Timer.periodic(const Duration(seconds: 1), (_) => tickTimer());
  }

  void setRoundBranch(int roundId, GuidedBranch branch) {
    state = state.copyWith(
      branchByRound: {
        ...state.branchByRound,
        roundId: branch,
      },
    );
  }

  Future<void> tickTimer() async {
    if (state.isPaused || state.phase != SessionPhase.roundPlayback) {
      return;
    }

    if (state.roundTimeRemaining <= 1) {
      await advanceRound();
      return;
    }

    final newRemaining = state.roundTimeRemaining - 1;
    state = state.copyWith(roundTimeRemaining: newRemaining);

    if (state.mode == RitualMode.guided) {
      final track = getAudioTrack(
        ref.read(guidedAudioServiceProvider).timeline(),
        state.currentRound!,
      );
      final elapsed = state.rounds
              .firstWhere((item) => item.id == state.currentRound)
              .duration -
          newRemaining;
      if (track != null) {
        for (final cue in track.cues) {
          if (cue.offsetSeconds == elapsed) {
            final variant =
                getCueVariant(cue, state.branchByRound[state.currentRound!]);
            final subtitle = variant?.subtitle ?? cue.subtitle;
            if ((variant?.voiceKey ?? cue.voiceKey) != null) {
              await ref.read(guidedAudioServiceProvider).playVoice(
                    variant?.voiceKey ?? cue.voiceKey!,
                    participants: state.voiceParticipants,
                    fallbackUri: cue.fallbackUri,
                    subtitleTemplate: subtitle,
                    highlightedParticipants: variant?.highlightedParticipants ??
                        cue.highlightedParticipants,
                  );
              state = state.copyWith(currentCueSubtitle: subtitle);
            }
          }
        }
      }
    }
  }

  Future<void> advanceRound() async {
    _roundTimer?.cancel();
    final currentRound = state.currentRound;
    if (currentRound == null) return;

    final completedRounds = [...state.completedRounds, currentRound];
    await ref
        .read(analyticsServiceProvider)
        .ritualRoundCompleted(currentRound, state.mode);

    RoundConfig? nextRound;
    for (final item in state.rounds) {
      if (item.id == currentRound + 1) {
        nextRound = item;
        break;
      }
    }
    if (nextRound == null) {
      await completeRitual(completedRounds: completedRounds);
      return;
    }

    state = state.copyWith(
      completedRounds: completedRounds,
      currentRound: nextRound.id,
      roundTimeRemaining: nextRound.duration,
      currentCueSubtitle: null,
    );
    await _startRoundPlayback();
  }

  Future<void> completeRitual({List<int>? completedRounds}) async {
    _roundTimer?.cancel();
    await ref.read(guidedAudioServiceProvider).stopAll();
    state = state.copyWith(
      status: RitualStatus.completed,
      phase: SessionPhase.completion,
      currentRound: null,
      completedRounds: completedRounds ?? state.completedRounds,
      currentCueSubtitle: null,
    );
    await ref.read(analyticsServiceProvider).ritualCompleted(state.mode);
    if (state.mode == RitualMode.guided) {
      await ref.read(analyticsServiceProvider).premiumSessionCompleted();
    }
  }

  Future<void> pauseToggle() async {
    final nextPaused = !state.isPaused;
    state = state.copyWith(isPaused: nextPaused);
    if (nextPaused) {
      await ref.read(guidedAudioServiceProvider).pauseAll();
    } else {
      await ref.read(guidedAudioServiceProvider).resumeAll();
    }
  }

  Future<void> resetRitual() async {
    _roundTimer?.cancel();
    await ref.read(guidedAudioServiceProvider).stopAll();
    state = RitualState.initial().copyWith(
      voiceParticipants: ref.read(authControllerProvider).ritualParticipants,
    );
  }
}
