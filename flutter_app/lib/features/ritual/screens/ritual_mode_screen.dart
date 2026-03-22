import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/analytics_service.dart';
import '../../../domain/models/app_models.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';
import '../../paywall/state/subscription_controller.dart';

class RitualModeScreen extends ConsumerStatefulWidget {
  const RitualModeScreen({super.key});

  @override
  ConsumerState<RitualModeScreen> createState() => _RitualModeScreenState();
}

class _RitualModeScreenState extends ConsumerState<RitualModeScreen>
    with TickerProviderStateMixin {
  late final AnimationController _card1Controller;
  late final AnimationController _card2Controller;

  @override
  void initState() {
    super.initState();
    _card1Controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _card2Controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    // Staggered entrance
    Future<void>.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _card1Controller.forward();
    });
    Future<void>.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _card2Controller.forward();
    });
  }

  @override
  void dispose() {
    _card1Controller.dispose();
    _card2Controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final subscription = ref.watch(subscriptionControllerProvider);
    final isPremium = subscription.asData?.value == SubscriptionStatus.premium;

    Future<void> handleMode(RitualMode mode) async {
      HapticFeedback.lightImpact();

      if (mode == RitualMode.guided) {
        await ref.read(analyticsServiceProvider).premiumToggleClicked(
              source: 'ritual_mode_select',
              hasPremiumAccess: isPremium,
            );
      }

      if (mode == RitualMode.guided && !isPremium) {
        if (!context.mounted) return;
        context.push('/paywall?source=ritual_mode_select');
        return;
      }

      if (!context.mounted) return;
      context.push('/ritual-setup?mode=${mode.name}');
    }

    return RitualScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.arrow_back_ios_new,
                  color: AppColors.text, size: 20),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'РИТУАЛ',
            style: GoogleFonts.playfairDisplay(
              color: AppColors.text,
              fontSize: 44,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Выберите глубину\nвашего погружения.',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 15,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 32),

          // Simple card
          _StaggeredCard(
            controller: _card1Controller,
            child: RitualGlassCard(
              onTap: () => handleMode(RitualMode.free),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Simple',
                    style: GoogleFonts.playfairDisplay(
                      color: AppColors.text,
                      fontSize: 28,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Базовый сенсорный опыт. Таймер и субтитры.',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  const Text('· Круговой таймер',
                      style: TextStyle(color: AppColors.textMuted)),
                  const Text('· Субтитры фраз',
                      style: TextStyle(color: AppColors.textMuted)),
                  const Text('· 5 раундов близости',
                      style: TextStyle(color: AppColors.textMuted)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Privilege card with accent border + glow
          _StaggeredCard(
            controller: _card2Controller,
            child: RitualGlassCard(
              onTap: () => handleMode(RitualMode.guided),
              accentBorder: true,
              glowColor: AppColors.accent,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Privilège',
                        style: GoogleFonts.playfairDisplay(
                          color: AppColors.text,
                          fontStyle: FontStyle.italic,
                          fontSize: 30,
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.auto_awesome,
                          color: AppColors.textSecondary, size: 18),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Полное сенсорное погружение. Направляющий голос, синхронизированные вибрации и адаптивный звук.',
                    style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.45),
                  ),
                  const SizedBox(height: 16),
                  const Text('· Иммерсивный голос',
                      style: TextStyle(color: AppColors.text)),
                  const Text('· Синхронная тактильность',
                      style: TextStyle(color: AppColors.text)),
                  const Text('· Адаптивный звук',
                      style: TextStyle(color: AppColors.text)),
                  const SizedBox(height: 18),
                  const RitualButton(label: 'ОТКРЫТЬ ДОСТУП', onTap: null),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StaggeredCard extends StatelessWidget {
  const _StaggeredCard({
    required this.controller,
    required this.child,
  });

  final AnimationController controller;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final curved =
            CurvedAnimation(parent: controller, curve: Curves.easeOutCubic);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.08),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
    );
  }
}
