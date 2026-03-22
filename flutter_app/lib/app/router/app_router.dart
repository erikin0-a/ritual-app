import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/auth_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/dice/screens/dice_screen.dart';
import '../../features/hub/screens/modes_hub_screen.dart';
import '../../features/paywall/screens/paywall_screen.dart';
import '../../features/ritual/screens/ritual_mode_screen.dart';
import '../../features/ritual/screens/ritual_session_screen.dart';
import '../../features/ritual/screens/ritual_setup_screen.dart';
import '../../features/auth/screens/splash_gate_screen.dart';
import '../../features/stories/screens/stories_screen.dart';
import '../../features/truth_or_dare/screens/truth_or_dare_screen.dart';
import '../../features/auth/state/auth_controller.dart';

Page<void> _fadePage(Widget child, GoRouterState state) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 500),
    reverseTransitionDuration: const Duration(milliseconds: 400),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(opacity: animation, child: child);
    },
  );
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = RouterRefreshNotifier(ref);
  ref.onDispose(notifier.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final path = state.uri.path;
      final inAuth = path.startsWith('/auth');
      final inOnboarding = path.startsWith('/onboarding');
      final inSplash = path == '/';

      if (auth.isLoading) {
        return inSplash ? null : '/';
      }

      if (!auth.isOnboarded) {
        if (inAuth || inOnboarding || inSplash) return null;
        return '/auth';
      }

      if (inAuth || inOnboarding || inSplash) {
        return '/hub';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        pageBuilder: (context, state) =>
            _fadePage(const SplashGateScreen(), state),
      ),
      GoRoute(
        path: '/auth',
        pageBuilder: (context, state) =>
            _fadePage(const AuthScreen(), state),
      ),
      GoRoute(
        path: '/onboarding',
        pageBuilder: (context, state) =>
            _fadePage(const OnboardingScreen(), state),
      ),
      GoRoute(
        path: '/hub',
        pageBuilder: (context, state) =>
            _fadePage(const ModesHubScreen(), state),
      ),
      GoRoute(
        path: '/paywall',
        pageBuilder: (context, state) => _fadePage(
          PaywallScreen(
            source: state.uri.queryParameters['source'] ?? 'unknown',
          ),
          state,
        ),
      ),
      GoRoute(
        path: '/ritual-mode',
        pageBuilder: (context, state) =>
            _fadePage(const RitualModeScreen(), state),
      ),
      GoRoute(
        path: '/ritual-setup',
        pageBuilder: (context, state) => _fadePage(
          RitualSetupScreen(
            mode: state.uri.queryParameters['mode'] == 'guided'
                ? 'guided'
                : 'free',
          ),
          state,
        ),
      ),
      GoRoute(
        path: '/ritual-session',
        pageBuilder: (context, state) => _fadePage(
          RitualSessionScreen(
            mode: state.uri.queryParameters['mode'] == 'guided'
                ? 'guided'
                : 'free',
          ),
          state,
        ),
      ),
      GoRoute(
        path: '/dice',
        pageBuilder: (context, state) =>
            _fadePage(const DiceScreen(), state),
      ),
      GoRoute(
        path: '/stories',
        pageBuilder: (context, state) =>
            _fadePage(const StoriesScreen(), state),
      ),
      GoRoute(
        path: '/truth-or-dare',
        pageBuilder: (context, state) =>
            _fadePage(const TruthOrDareScreen(), state),
      ),
    ],
  );
});

class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(this.ref) {
    _sub = ref.listen<AuthState>(
      authControllerProvider,
      (_, __) => notifyListeners(),
      fireImmediately: false,
    );
  }

  final Ref ref;
  ProviderSubscription<AuthState>? _sub;

  @override
  void dispose() {
    _sub?.close();
    super.dispose();
  }
}
