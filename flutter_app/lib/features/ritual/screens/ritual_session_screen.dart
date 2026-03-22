import 'dart:math';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../domain/constants/guided_session.dart';
import '../../../domain/constants/ritual_content.dart';
import '../../../domain/models/app_models.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';
import '../state/ritual_controller.dart';

// ==========================================================================
// RitualSessionScreen — one persistent scene, overlay architecture
// ==========================================================================

class RitualSessionScreen extends ConsumerStatefulWidget {
  const RitualSessionScreen({super.key, required this.mode});

  final String mode;

  @override
  ConsumerState<RitualSessionScreen> createState() =>
      _RitualSessionScreenState();
}

class _RitualSessionScreenState extends ConsumerState<RitualSessionScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(ritualControllerProvider.notifier).startRitual(
            widget.mode == 'guided' ? RitualMode.guided : RitualMode.free,
          );
    });
  }

  @override
  void dispose() {
    ref.read(ritualControllerProvider.notifier).resetRitual();
    super.dispose();
  }

  double get _roundIntensity {
    final state = ref.read(ritualControllerProvider);
    if (state.phase == SessionPhase.loading) return 0.2;
    if (state.currentRound == null) return 0.3;
    return 0.18 + ((state.currentRound! - 1) / 4) * 0.82;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ritualControllerProvider);
    final safeTop = MediaQuery.of(context).padding.top;
    final safeBottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Layer 1: always visible — silk background with dynamic intensity
          LiquidSilkBackground(intensity: _roundIntensity),

          // Layer 2: persistent header (visible after loading)
          if (state.phase != SessionPhase.loading)
            _SessionHeader(
              safeTop: safeTop,
              currentRound: state.currentRound,
              completedRounds: state.completedRounds,
              isPaused: state.isPaused,
              onClose: () async {
                await ref
                    .read(ritualControllerProvider.notifier)
                    .resetRitual();
                if (!context.mounted) return;
                context.pop();
              },
              onPauseToggle: () => ref
                  .read(ritualControllerProvider.notifier)
                  .pauseToggle(),
            ),

          // Layer 3: main content area — centered timer during playback
          if (state.phase == SessionPhase.roundPlayback)
            _MeditationTimer(
              remaining: state.roundTimeRemaining,
              total: state.rounds
                  .firstWhere((r) => r.id == state.currentRound)
                  .duration,
            ),

          // Layer 4: voice subtitle — bottom
          if (state.currentCueSubtitle != null)
            _VoiceSubtitle(
              text: state.currentCueSubtitle!,
              safeBottom: safeBottom,
            ),

          // Layer 5: phase overlays
          _LoadingOverlay(visible: state.phase == SessionPhase.loading),
          _PreludeOverlay(
            visible: state.phase == SessionPhase.prelude,
            mode: widget.mode,
            participants: state.voiceParticipants,
            onConsentComplete: () {
              // Controller already advances from prelude
            },
          ),
          _TransitionOverlay(
            visible: state.phase == SessionPhase.transition,
            roundId: state.currentRound,
          ),
          _SetupOverlay(
            visible: state.phase == SessionPhase.setup,
            roundId: state.currentRound,
          ),
          _CompletionOverlay(
            visible: state.phase == SessionPhase.completion,
            onRestart: () => ref
                .read(ritualControllerProvider.notifier)
                .startRitual(
                  widget.mode == 'guided'
                      ? RitualMode.guided
                      : RitualMode.free,
                ),
          ),
        ],
      ),
    );
  }
}

// ==========================================================================
// _SessionHeader
// ==========================================================================

class _SessionHeader extends StatelessWidget {
  const _SessionHeader({
    required this.safeTop,
    required this.currentRound,
    required this.completedRounds,
    required this.isPaused,
    required this.onClose,
    required this.onPauseToggle,
  });

  final double safeTop;
  final int? currentRound;
  final List<int> completedRounds;
  final bool isPaused;
  final VoidCallback onClose;
  final VoidCallback onPauseToggle;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: safeTop + 12,
      left: 0,
      right: 0,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                onClose();
              },
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(Icons.close, color: AppColors.text, size: 22),
              ),
            ),
            const Spacer(),
            _RoundDots(
              currentRound: currentRound,
              completedRounds: completedRounds,
            ),
            const Spacer(),
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                onPauseToggle();
              },
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Icon(
                  isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                  color: AppColors.text,
                  size: 22,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================================================
// _RoundDots
// ==========================================================================

class _RoundDots extends StatelessWidget {
  const _RoundDots({
    required this.currentRound,
    required this.completedRounds,
  });

  final int? currentRound;
  final List<int> completedRounds;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final round = index + 1;
        final active = round == currentRound;
        final completed = completedRounds.contains(round);

        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: active ? 18 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: active
                ? AppColors.accent
                : completed
                    ? AppColors.accent.withValues(alpha: 0.4)
                    : Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(999),
          ),
        );
      }),
    );
  }
}

// ==========================================================================
// _MeditationTimer — CustomPaint arc ring with breathing glow
// ==========================================================================

class _MeditationTimer extends StatefulWidget {
  const _MeditationTimer({
    required this.remaining,
    required this.total,
  });

  final int remaining;
  final int total;

  @override
  State<_MeditationTimer> createState() => _MeditationTimerState();
}

class _MeditationTimerState extends State<_MeditationTimer>
    with TickerProviderStateMixin {
  late final AnimationController _breathController;
  late final AnimationController _arcController;
  late final Animation<double> _breathAnimation;

  double _previousSweep = 1.0;

  @override
  void initState() {
    super.initState();
    _breathController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);
    _breathAnimation = Tween<double>(begin: 0.08, end: 0.22).animate(
      CurvedAnimation(parent: _breathController, curve: Curves.easeInOut),
    );

    _arcController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _previousSweep = widget.total > 0 ? widget.remaining / widget.total : 1.0;
  }

  @override
  void didUpdateWidget(covariant _MeditationTimer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.remaining != widget.remaining) {
      final newSweep =
          widget.total > 0 ? widget.remaining / widget.total : 0.0;
      _previousSweep = newSweep + (1.0 / widget.total); // from previous tick
      _arcController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _breathController.dispose();
    _arcController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final minutes =
        (widget.remaining ~/ 60).toString().padLeft(2, '0');
    final seconds =
        (widget.remaining % 60).toString().padLeft(2, '0');
    final targetSweep =
        widget.total > 0 ? widget.remaining / widget.total : 0.0;

    return Center(
      child: AnimatedBuilder(
        animation: Listenable.merge([_breathAnimation, _arcController]),
        builder: (context, _) {
          final currentSweep = Tween<double>(
            begin: _previousSweep,
            end: targetSweep,
          ).evaluate(CurvedAnimation(
            parent: _arcController,
            curve: Curves.easeInOut,
          ));

          return Stack(
            alignment: Alignment.center,
            children: [
              // Outer breathing glow
              Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accent
                          .withValues(alpha: _breathAnimation.value),
                      blurRadius: 60,
                      spreadRadius: 10,
                    ),
                  ],
                ),
              ),
              // Arc ring
              SizedBox(
                width: 260,
                height: 260,
                child: CustomPaint(
                  painter: _ArcPainter(sweep: currentSweep),
                ),
              ),
              // Time text
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$minutes:$seconds',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 58,
                      color: Colors.white,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'ОСТАЛОСЬ',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white.withValues(alpha: 0.3),
                      letterSpacing: 3,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  const _ArcPainter({required this.sweep});

  final double sweep;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    // Background arc
    canvas.drawArc(
      rect,
      -pi / 2,
      2 * pi,
      false,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.06)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke,
    );

    // Progress arc
    if (sweep > 0) {
      canvas.drawArc(
        rect,
        -pi / 2,
        2 * pi * sweep,
        false,
        Paint()
          ..color = AppColors.accent
          ..strokeWidth = 2.0
          ..strokeCap = StrokeCap.round
          ..style = PaintingStyle.stroke,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ArcPainter oldDelegate) =>
      oldDelegate.sweep != sweep;
}

// ==========================================================================
// _VoiceSubtitle
// ==========================================================================

class _VoiceSubtitle extends StatelessWidget {
  const _VoiceSubtitle({
    required this.text,
    required this.safeBottom,
  });

  final String text;
  final double safeBottom;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: safeBottom + 80,
      left: 24,
      right: 24,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 600),
        transitionBuilder: (child, animation) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.08),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            ),
          );
        },
        child: Text(
          text,
          key: ValueKey(text),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: Colors.white.withValues(alpha: 0.8),
            height: 1.55,
          ),
        ),
      ),
    );
  }
}

// ==========================================================================
// _LoadingOverlay
// ==========================================================================

class _LoadingOverlay extends StatefulWidget {
  const _LoadingOverlay({required this.visible});

  final bool visible;

  @override
  State<_LoadingOverlay> createState() => _LoadingOverlayState();
}

class _LoadingOverlayState extends State<_LoadingOverlay>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;
  late final AnimationController _progressController;
  int _phraseIndex = 0;

  static const _phrases = [
    'Приглушаем свет...',
    'Настраиваем атмосферу...',
    'Ваш ритуал готовится...',
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..forward();

    // Cycle phrases
    Future.doWhile(() async {
      await Future<void>.delayed(const Duration(seconds: 2));
      if (!mounted) return false;
      setState(() => _phraseIndex = (_phraseIndex + 1) % _phrases.length);
      return mounted && widget.visible;
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: widget.visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 600),
      child: IgnorePointer(
        ignoring: !widget.visible,
        child: Container(
          color: Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(flex: 3),
              // "Nightly" pulsing text
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, _) {
                  return Opacity(
                    opacity: _pulseAnimation.value,
                    child: Text(
                      'Nightly',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 52,
                        fontStyle: FontStyle.italic,
                        color: Colors.white,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
              // Cycling phrases
              SizedBox(
                height: 24,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 500),
                  child: Text(
                    _phrases[_phraseIndex],
                    key: ValueKey(_phraseIndex),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
                  ),
                ),
              ),
              const Spacer(flex: 3),
              // Thin progress line
              AnimatedBuilder(
                animation: _progressController,
                builder: (context, _) {
                  // Fast to 60%, slow to 90%
                  final t = _progressController.value;
                  final progress = t < 0.5
                      ? (t / 0.5) * 0.6
                      : 0.6 + ((t - 0.5) / 0.5) * 0.3;
                  return Container(
                    height: 1,
                    width: 200 * progress,
                    color: AppColors.accent,
                  );
                },
              ),
              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }
}

// ==========================================================================
// _PreludeOverlay — consent screen with split hold gesture
// ==========================================================================

class _PreludeOverlay extends StatefulWidget {
  const _PreludeOverlay({
    required this.visible,
    required this.mode,
    required this.participants,
    required this.onConsentComplete,
  });

  final bool visible;
  final String mode;
  final RitualParticipants participants;
  final VoidCallback onConsentComplete;

  @override
  State<_PreludeOverlay> createState() => _PreludeOverlayState();
}

class _PreludeOverlayState extends State<_PreludeOverlay>
    with TickerProviderStateMixin {
  bool _p1Holding = false;
  bool _p2Holding = false;
  double _p1Progress = 0.0;
  double _p2Progress = 0.0;
  bool _completed = false;

  late final AnimationController _p1Controller;
  late final AnimationController _p2Controller;

  @override
  void initState() {
    super.initState();
    _p1Controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..addListener(() {
        setState(() => _p1Progress = _p1Controller.value);
        _checkComplete();
      });

    _p2Controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..addListener(() {
        setState(() => _p2Progress = _p2Controller.value);
        _checkComplete();
      });
  }

  void _checkComplete() {
    if (_p1Progress >= 1.0 && _p2Progress >= 1.0 && !_completed) {
      _completed = true;
      HapticFeedback.heavyImpact();
      widget.onConsentComplete();
    }
  }

  @override
  void dispose() {
    _p1Controller.dispose();
    _p2Controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bothActive = _p1Holding && _p2Holding;

    return AnimatedOpacity(
      opacity: widget.visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 600),
      child: IgnorePointer(
        ignoring: !widget.visible,
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              color: Colors.black.withValues(alpha: 0.5),
              child: Column(
                children: [
                  // Top half — partner 2 (rotated 180)
                  Expanded(
                    child: Transform.rotate(
                      angle: pi,
                      child: _ConsentHalf(
                        name: widget.participants.p2.name,
                        progress: _p2Progress,
                        isHolding: _p2Holding,
                        onHoldStart: () {
                          setState(() => _p2Holding = true);
                          _p2Controller.forward();
                        },
                        onHoldEnd: () {
                          setState(() => _p2Holding = false);
                          if (_p2Progress < 1.0) {
                            _p2Controller.reverse();
                          }
                        },
                      ),
                    ),
                  ),
                  // Divider
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        height: 1,
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          boxShadow: bothActive
                              ? [
                                  const BoxShadow(
                                    color: Colors.white,
                                    blurRadius: 30,
                                    spreadRadius: 2,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                    ],
                  ),
                  // Bottom half — partner 1
                  Expanded(
                    child: _ConsentHalf(
                      name: widget.participants.p1.name,
                      progress: _p1Progress,
                      isHolding: _p1Holding,
                      onHoldStart: () {
                        setState(() => _p1Holding = true);
                        _p1Controller.forward();
                      },
                      onHoldEnd: () {
                        setState(() => _p1Holding = false);
                        if (_p1Progress < 1.0) {
                          _p1Controller.reverse();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ConsentHalf extends StatelessWidget {
  const _ConsentHalf({
    required this.name,
    required this.progress,
    required this.isHolding,
    required this.onHoldStart,
    required this.onHoldEnd,
  });

  final String name;
  final double progress;
  final bool isHolding;
  final VoidCallback onHoldStart;
  final VoidCallback onHoldEnd;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPressStart: (_) => onHoldStart(),
      onLongPressEnd: (_) => onHoldEnd(),
      behavior: HitTestBehavior.opaque,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Name watermark
          AnimatedOpacity(
            duration: const Duration(milliseconds: 300),
            opacity: isHolding ? 0.08 : 0.04,
            child: Text(
              name,
              style: GoogleFonts.playfairDisplay(
                fontSize: 72,
                color: Colors.white,
              ),
            ),
          ),
          // Progress ring
          SizedBox(
            width: 100,
            height: 100,
            child: CustomPaint(
              painter: _ArcPainter(sweep: progress),
            ),
          ),
          // Label
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                name,
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              AnimatedOpacity(
                duration: const Duration(milliseconds: 200),
                opacity: progress >= 1.0 ? 0.0 : 0.5,
                child: const Text(
                  'удерживайте',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ==========================================================================
// _TransitionOverlay
// ==========================================================================

class _TransitionOverlay extends StatefulWidget {
  const _TransitionOverlay({
    required this.visible,
    required this.roundId,
  });

  final bool visible;
  final int? roundId;

  @override
  State<_TransitionOverlay> createState() => _TransitionOverlayState();
}

class _TransitionOverlayState extends State<_TransitionOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _enterController;

  @override
  void initState() {
    super.initState();
    _enterController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
  }

  @override
  void didUpdateWidget(covariant _TransitionOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.visible && !oldWidget.visible) {
      _enterController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _enterController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scene =
        widget.roundId != null ? guidedRoundScenes[widget.roundId] : null;

    return AnimatedOpacity(
      opacity: widget.visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 500),
      child: IgnorePointer(
        ignoring: !widget.visible,
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              color: const Color(0xB3000000),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.1),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: _enterController,
                  curve: Curves.easeOutCubic,
                )),
                child: FadeTransition(
                  opacity: _enterController,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.roundId == null
                              ? 'ПЕРЕХОД'
                              : 'РАУНД ${widget.roundId}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            letterSpacing: 4,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          scene?.transitionTitle ?? 'Готовьтесь',
                          style: GoogleFonts.playfairDisplay(
                            color: Colors.white,
                            fontSize: 44,
                          ),
                        ),
                        if (scene?.transitionBody != null) ...[
                          const SizedBox(height: 12),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 40),
                            child: Text(
                              scene!.transitionBody,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.6),
                                height: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================================================
// _SetupOverlay
// ==========================================================================

class _SetupOverlay extends StatelessWidget {
  const _SetupOverlay({
    required this.visible,
    required this.roundId,
  });

  final bool visible;
  final int? roundId;

  @override
  Widget build(BuildContext context) {
    final scene = roundId != null ? guidedRoundScenes[roundId] : null;

    return AnimatedOpacity(
      opacity: visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 500),
      child: IgnorePointer(
        ignoring: !visible,
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: Container(
              color: const Color(0xB3000000),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        scene?.setupTitle ?? 'Подготовка',
                        style: GoogleFonts.playfairDisplay(
                          color: Colors.white,
                          fontSize: 36,
                        ),
                      ),
                      if (scene?.setupBody != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          scene!.setupBody!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================================================
// _CompletionOverlay
// ==========================================================================

class _CompletionOverlay extends StatelessWidget {
  const _CompletionOverlay({
    required this.visible,
    required this.onRestart,
  });

  final bool visible;
  final VoidCallback onRestart;

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 800),
      child: IgnorePointer(
        ignoring: !visible,
        child: Container(
          color: Colors.black.withValues(alpha: 0.3),
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  finalMessage.title,
                  style: GoogleFonts.playfairDisplay(
                    color: Colors.white,
                    fontSize: 40,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  finalMessage.body,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    height: 1.55,
                  ),
                ),
                const SizedBox(height: 32),
                RitualButton(
                  label: 'ЕЩЁ РАЗ',
                  onTap: onRestart,
                ),
                const SizedBox(height: 12),
                RitualButton(
                  label: 'В КОЛЛЕКЦИЮ',
                  onTap: () => context.go('/hub'),
                  secondary: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
