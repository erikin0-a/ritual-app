import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplitude_flutter/events/base_event.dart';

import '../../domain/models/app_models.dart';
import 'app_services.dart';

final analyticsServiceProvider = Provider<AnalyticsService>(
  (ref) => AnalyticsService(ref),
);

class AnalyticsService {
  AnalyticsService(this._ref)
      : _sessionId =
            '${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}-${Random().nextInt(1 << 32).toRadixString(36)}';

  final Ref _ref;
  final String _sessionId;

  Future<void> track(String event,
      [Map<String, Object?> props = const {}]) async {
    final amplitude = _ref.read(amplitudeProvider);
    final env = _ref.read(appEnvProvider);
    if (!env.hasAmplitude) return;

    await amplitude.track(
      BaseEvent(
        event,
        eventProperties: {
          'platform': defaultTargetPlatform.name,
          'session_id': _sessionId,
          ...props,
        },
      ),
    );
  }

  Future<void> onboardingCompleted() => track('onboarding_completed');

  Future<void> ritualStarted(RitualMode mode) => track('ritual_started', {
        'mode': mode.name,
      });

  Future<void> ritualRoundCompleted(int round, RitualMode mode) =>
      track('ritual_round_completed', {
        'round': round,
        'mode': mode.name,
      });

  Future<void> ritualCompleted(RitualMode mode) => track('ritual_completed', {
        'mode': mode.name,
      });

  Future<void> premiumToggleClicked({
    required String source,
    required bool hasPremiumAccess,
  }) =>
      track('premium_toggle_clicked', {
        'paywall_source': source,
        'has_premium_access': hasPremiumAccess,
      });

  Future<void> paywallOpened(String source) => track('paywall_opened', {
        'paywall_source': source,
      });

  Future<void> paywallCtaClicked({
    required String source,
    required String cta,
  }) =>
      track('paywall_cta_clicked', {
        'paywall_source': source,
        'cta': cta,
      });

  Future<void> trialStarted(String source) => track('trial_started', {
        'paywall_source': source,
        'plan': 'annual',
      });

  Future<void> subscriptionStarted({
    required String source,
    required String plan,
  }) =>
      track('subscription_started', {
        'paywall_source': source,
        'plan': plan,
      });

  Future<void> premiumSessionStarted() => track('premium_session_started', {
        'mode': 'guided',
      });

  Future<void> premiumSessionCompleted() => track('premium_session_completed', {
        'mode': 'guided',
      });

  Future<void> diceRolled() => track('dice_rolled');
}
