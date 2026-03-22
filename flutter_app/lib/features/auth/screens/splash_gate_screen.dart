import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';

class SplashGateScreen extends StatefulWidget {
  const SplashGateScreen({super.key});

  @override
  State<SplashGateScreen> createState() => _SplashGateScreenState();
}

class _SplashGateScreenState extends State<SplashGateScreen>
    with TickerProviderStateMixin {
  late final AnimationController _dotController;
  late final AnimationController _flashController;
  late final AnimationController _textController;
  late final AnimationController _progressController;

  @override
  void initState() {
    super.initState();

    // Dots converge over 2s
    _dotController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..forward();

    // Flash at t=2s
    _flashController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    // Text fade-in at t=2.2s
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    // Progress line over 3.5s
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3500),
    )..forward();

    // Sequence: flash at 2s, text at 2.2s
    _dotController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _flashController.forward().then((_) => _flashController.reverse());
        Future<void>.delayed(const Duration(milliseconds: 200), () {
          if (mounted) _textController.forward();
        });
      }
    });

    // Navigate after 4s
    Timer(const Duration(seconds: 4), () {
      if (!mounted) return;
      context.go('/auth');
    });
  }

  @override
  void dispose() {
    _dotController.dispose();
    _flashController.dispose();
    _textController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const LiquidSilkBackground(intensity: 0.15),

          // Animated dots
          AnimatedBuilder(
            animation: _dotController,
            builder: (context, _) {
              final t = Curves.easeInOut.transform(_dotController.value);
              final leftX = -screenWidth / 2 + (screenWidth / 2) * t;
              final rightX = screenWidth * 1.5 - (screenWidth / 2) * t;
              final centerY = screenHeight / 2;

              return Stack(
                children: [
                  Positioned(
                    left: leftX - 4,
                    top: centerY - 4,
                    child: _GlowDot(),
                  ),
                  Positioned(
                    left: rightX - 4,
                    top: centerY - 4,
                    child: _GlowDot(),
                  ),
                ],
              );
            },
          ),

          // Flash overlay
          AnimatedBuilder(
            animation: _flashController,
            builder: (context, _) {
              return AnimatedOpacity(
                opacity: _flashController.value * 0.35,
                duration: Duration.zero,
                child: Container(color: AppColors.accent),
              );
            },
          ),

          // Text
          Center(
            child: FadeTransition(
              opacity: _textController,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Nightly',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 52,
                      fontStyle: FontStyle.italic,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'AURA',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.35),
                      letterSpacing: 6,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom progress line
          Positioned(
            bottom: 0,
            left: 0,
            child: AnimatedBuilder(
              animation: _progressController,
              builder: (context, _) {
                return Container(
                  height: 1,
                  width: screenWidth * _progressController.value,
                  color: AppColors.accent,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _GlowDot extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.white.withValues(alpha: 0.6),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }
}
