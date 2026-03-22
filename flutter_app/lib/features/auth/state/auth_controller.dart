import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/app_services.dart';
import '../../../core/services/guided_audio_service.dart';
import '../../../domain/logic/ritual_participants.dart';
import '../../../domain/models/app_models.dart';

class AuthState {
  const AuthState({
    required this.user,
    required this.isLoading,
    required this.isOnboarded,
    required this.intimacyLevel,
    required this.durationPreference,
    required this.partnerName,
    required this.ritualParticipants,
  });

  factory AuthState.initial() => AuthState(
        user: null,
        isLoading: true,
        isOnboarded: false,
        intimacyLevel: null,
        durationPreference: null,
        partnerName: null,
        ritualParticipants: defaultRitualParticipants,
      );

  final UserProfile? user;
  final bool isLoading;
  final bool isOnboarded;
  final IntimacyLevel? intimacyLevel;
  final DurationPreference? durationPreference;
  final String? partnerName;
  final RitualParticipants ritualParticipants;

  AuthState copyWith({
    UserProfile? user,
    bool? isLoading,
    bool? isOnboarded,
    IntimacyLevel? intimacyLevel,
    DurationPreference? durationPreference,
    String? partnerName,
    RitualParticipants? ritualParticipants,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isOnboarded: isOnboarded ?? this.isOnboarded,
      intimacyLevel: intimacyLevel ?? this.intimacyLevel,
      durationPreference: durationPreference ?? this.durationPreference,
      partnerName: partnerName ?? this.partnerName,
      ritualParticipants: ritualParticipants ?? this.ritualParticipants,
    );
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

class AuthController extends Notifier<AuthState> {
  static const _storageKey = 'ritual-auth';

  @override
  AuthState build() {
    Future.microtask(_hydrate);
    return AuthState.initial();
  }

  Future<void> _hydrate() async {
    final preferences = ref.read(sharedPreferencesProvider);
    final guidedAudio = ref.read(guidedAudioServiceProvider);
    final raw = preferences.getString(_storageKey);
    if (raw == null) {
      state = state.copyWith(isLoading: false);
      return;
    }

    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      state = state.copyWith(
        isLoading: false,
        isOnboarded: json['isOnboarded'] as bool? ?? false,
        intimacyLevel: _parseIntimacyLevel(json['intimacyLevel'] as String?),
        durationPreference: _parseDuration(json['durationPreference'] as String?),
        partnerName: json['partnerName'] as String?,
        ritualParticipants:
            guidedAudio.deserializeParticipants(json['ritualParticipants'] as String?),
      );
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> _persist() async {
    final preferences = ref.read(sharedPreferencesProvider);
    final guidedAudio = ref.read(guidedAudioServiceProvider);
    await preferences.setString(
      _storageKey,
      jsonEncode({
        'isOnboarded': state.isOnboarded,
        'intimacyLevel': state.intimacyLevel?.name,
        'durationPreference': state.durationPreference?.name,
        'partnerName': state.partnerName,
        'ritualParticipants':
            guidedAudio.serializeParticipants(state.ritualParticipants),
      }),
    );
  }

  void setUser(UserProfile? user) {
    state = state.copyWith(user: user);
  }

  void setOnboardingPrefs({
    required IntimacyLevel intimacyLevel,
    required DurationPreference durationPreference,
    required String? partnerName,
  }) {
    state = state.copyWith(
      intimacyLevel: intimacyLevel,
      durationPreference: durationPreference,
      partnerName: partnerName,
      ritualParticipants: createRitualParticipants(
        p2: RitualParticipant(
          id: ParticipantId.p2,
          name: partnerName ?? 'Партнёр',
          gender: ParticipantGender.f,
        ),
      ),
    );
    _persist();
  }

  void setRitualParticipants(RitualParticipants participants) {
    state = state.copyWith(
      ritualParticipants: participants,
      partnerName: participants.p2.name,
    );
    _persist();
  }

  void completeOnboarding() {
    state = state.copyWith(isOnboarded: true);
    _persist();
  }

  void signOut() {
    state = AuthState.initial().copyWith(isLoading: false);
    _persist();
  }

  IntimacyLevel? _parseIntimacyLevel(String? value) {
    for (final item in IntimacyLevel.values) {
      if (item.name == value) return item;
    }
    return null;
  }

  DurationPreference? _parseDuration(String? value) {
    for (final item in DurationPreference.values) {
      if (item.name == value) return item;
    }
    return null;
  }
}
