import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/analytics_service.dart';
import '../../../domain/logic/ritual_participants.dart';
import '../../../domain/models/app_models.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';
import '../state/auth_controller.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen>
    with TickerProviderStateMixin {
  bool _ageAccepted = false;
  final _p1Controller = TextEditingController();
  final _p2Controller = TextEditingController();
  ParticipantGender _p1Gender = ParticipantGender.m;
  ParticipantGender _p2Gender = ParticipantGender.f;
  String? _error;
  int _phraseIndex = 0;

  static const _phrases = [
    'Пространство для двоих',
    'Ваш ритуал близости',
    'Каждый вечер — ваш',
  ];

  late final AnimationController _phraseTimer;

  @override
  void initState() {
    super.initState();
    _phraseTimer = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          setState(() => _phraseIndex = (_phraseIndex + 1) % _phrases.length);
          _phraseTimer.forward(from: 0);
        }
      });
    _phraseTimer.forward();
  }

  @override
  void dispose() {
    _phraseTimer.dispose();
    _p1Controller.dispose();
    _p2Controller.dispose();
    super.dispose();
  }

  Future<void> _complete() async {
    if (_p1Controller.text.trim().length < 2) {
      setState(
          () => _error = 'Имя первого партнёра должно быть не менее 2 символов');
      return;
    }
    if (_p2Controller.text.trim().length < 2) {
      setState(
          () => _error = 'Имя второго партнёра должно быть не менее 2 символов');
      return;
    }

    HapticFeedback.mediumImpact();

    final auth = ref.read(authControllerProvider.notifier);
    auth.setOnboardingPrefs(
      intimacyLevel: IntimacyLevel.moderate,
      durationPreference: DurationPreference.standard,
      partnerName: _p2Controller.text.trim(),
    );
    auth.setRitualParticipants(
      createRitualParticipants(
        p1: RitualParticipant(
          id: ParticipantId.p1,
          name: _p1Controller.text.trim(),
          gender: _p1Gender,
        ),
        p2: RitualParticipant(
          id: ParticipantId.p2,
          name: _p2Controller.text.trim(),
          gender: _p2Gender,
        ),
      ),
    );
    auth.completeOnboarding();
    await ref.read(analyticsServiceProvider).onboardingCompleted();
    if (!mounted) return;
    context.go('/hub');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const LiquidSilkBackground(intensity: 0.15),
          SafeArea(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 450),
                child: !_ageAccepted ? _buildAgeStep() : _buildNamesStep(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAgeStep() {
    return Column(
      key: const ValueKey('age'),
      children: [
        const Spacer(),
        Text(
          'Nightly',
          style: GoogleFonts.playfairDisplay(
            fontSize: 48,
            fontStyle: FontStyle.italic,
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 18),
        // Cycling phrases
        SizedBox(
          height: 20,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: Text(
              _phrases[_phraseIndex].toUpperCase(),
              key: ValueKey(_phraseIndex),
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                letterSpacing: 2.5,
              ),
            ),
          ),
        ),
        const Spacer(),
        const Text(
          'ВНИМАНИЕ',
          style: TextStyle(
            color: AppColors.textMuted,
            fontSize: 10,
            letterSpacing: 4,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'Данное приложение предназначено исключительно для совершеннолетних.\nПожалуйста, подтвердите ваш возраст.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            height: 1.6,
          ),
        ),
        const Spacer(),
        RitualButton(
          label: 'МНЕ ЕСТЬ 18 ЛЕТ',
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() => _ageAccepted = true);
          },
        ),
        const SizedBox(height: 14),
        RitualButton(
          label: 'МНЕ НЕТ 18 ЛЕТ',
          onTap: () {},
          secondary: true,
        ),
      ],
    );
  }

  Widget _buildNamesStep() {
    return SingleChildScrollView(
      key: const ValueKey('names'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Кто сегодня',
            style: GoogleFonts.playfairDisplay(
              fontSize: 44,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Введите имена, чтобы ритуал обращался к вам лично',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 32),
          _PartnerCard(
            label: 'ПАРТНЁР 1',
            controller: _p1Controller,
            gender: _p1Gender,
            onGenderChanged: (value) {
              HapticFeedback.selectionClick();
              setState(() => _p1Gender = value);
            },
          ),
          const SizedBox(height: 16),
          _PartnerCard(
            label: 'ПАРТНЁР 2',
            controller: _p2Controller,
            gender: _p2Gender,
            onGenderChanged: (value) {
              HapticFeedback.selectionClick();
              setState(() => _p2Gender = value);
            },
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(color: AppColors.danger, fontSize: 12),
            ),
          ],
          const SizedBox(height: 24),
          RitualButton(
            label: 'НАЧАТЬ РИТУАЛ',
            onTap: _complete,
          ),
        ],
      ),
    );
  }
}

class _PartnerCard extends StatelessWidget {
  const _PartnerCard({
    required this.label,
    required this.controller,
    required this.gender,
    required this.onGenderChanged,
  });

  final String label;
  final TextEditingController controller;
  final ParticipantGender gender;
  final ValueChanged<ParticipantGender> onGenderChanged;

  @override
  Widget build(BuildContext context) {
    return RitualGlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 10,
              letterSpacing: 3,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            style: GoogleFonts.playfairDisplay(
              fontSize: 28,
              color: AppColors.text,
            ),
            cursorColor: AppColors.accent,
            decoration: const InputDecoration(
              hintText: 'Имя',
              hintStyle: TextStyle(color: AppColors.textMuted),
              border: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.borderStrong),
              ),
              enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.borderStrong),
              ),
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.accent),
              ),
              isDense: true,
              contentPadding: EdgeInsets.only(bottom: 8),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text(
                'пол:',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const SizedBox(width: 12),
              _GenderPill(
                label: 'Он',
                selected: gender == ParticipantGender.m,
                onTap: () => onGenderChanged(ParticipantGender.m),
              ),
              const SizedBox(width: 8),
              _GenderPill(
                label: 'Она',
                selected: gender == ParticipantGender.f,
                onTap: () => onGenderChanged(ParticipantGender.f),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GenderPill extends StatelessWidget {
  const _GenderPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.accent : AppColors.glass,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.glassBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.text : AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
