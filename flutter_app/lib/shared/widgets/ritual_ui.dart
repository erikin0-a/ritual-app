import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

// ---------------------------------------------------------------------------
// LiquidSilkBackground
// ---------------------------------------------------------------------------

class LiquidSilkBackground extends StatefulWidget {
  const LiquidSilkBackground({
    super.key,
    this.intensity = 0.5,
    this.colorScheme = 'default',
  });

  /// 0.0 – very subtle, 1.0 – deep saturated crimson/violet.
  final double intensity;

  /// 'default' | 'ritual' | 'warm'
  final String colorScheme;

  @override
  State<LiquidSilkBackground> createState() => _LiquidSilkBackgroundState();
}

class _LiquidSilkBackgroundState extends State<LiquidSilkBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 24),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return CustomPaint(
          painter: _SilkPainter(
            progress: _controller.value,
            intensity: widget.intensity,
            colorScheme: widget.colorScheme,
          ),
          child: const SizedBox.expand(),
        );
      },
    );
  }
}

class _SilkPainter extends CustomPainter {
  const _SilkPainter({
    required this.progress,
    required this.intensity,
    required this.colorScheme,
  });

  final double progress;
  final double intensity;
  final String colorScheme;

  // Lerp color alpha toward full opacity based on intensity.
  Color _i(Color c) {
    final base = c.a;
    final boosted = base * (0.3 + 0.7 * intensity);
    return c.withValues(alpha: boosted.clamp(0.0, 1.0));
  }

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;

    // Background gradient
    final background = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          AppColors.gradientStart,
          AppColors.gradientMid,
          AppColors.gradientEnd,
        ],
      ).createShader(rect);
    canvas.drawRect(rect, background);

    // --- 6 mesh orbs (was 4) ---

    // Orb 1 – pink upper-left
    _drawMeshOrb(canvas, size,
      center: Offset(
        size.width * (0.22 + 0.04 * sin(progress * pi * 2)),
        size.height * (0.18 + 0.03 * cos(progress * pi * 2)),
      ),
      radius: size.width * 0.52,
      colors: [_i(const Color(0xCCF07AAE)), _i(const Color(0x889B2369)), const Color(0x00381320)],
    );

    // Orb 2 – violet upper-right
    _drawMeshOrb(canvas, size,
      center: Offset(
        size.width * (0.78 + 0.05 * cos(progress * pi * 2)),
        size.height * (0.26 + 0.05 * sin(progress * pi * 2)),
      ),
      radius: size.width * 0.46,
      colors: [_i(const Color(0xAA9D63FF)), _i(const Color(0x66511A56)), const Color(0x00210B23)],
    );

    // Orb 3 – crimson lower-center
    _drawMeshOrb(canvas, size,
      center: Offset(
        size.width * (0.42 + 0.07 * cos(progress * pi * 2)),
        size.height * (0.72 + 0.05 * sin(progress * pi * 2)),
      ),
      radius: size.width * 0.62,
      colors: [_i(const Color(0x889A143B)), _i(const Color(0x66E04F8F)), const Color(0x00160710)],
    );

    // Orb 4 – soft blush lower-right
    _drawMeshOrb(canvas, size,
      center: Offset(
        size.width * (0.84 + 0.03 * sin(progress * pi * 4)),
        size.height * (0.80 + 0.03 * cos(progress * pi * 2)),
      ),
      radius: size.width * 0.34,
      colors: [_i(const Color(0x66F2C1D0)), _i(const Color(0x446C274F)), const Color(0x00170A12)],
    );

    // Orb 5 – crimson center-left (slow phase offset π*1.3)
    _drawMeshOrb(canvas, size,
      center: Offset(
        size.width * (0.20 + 0.05 * sin(progress * pi * 1.3)),
        size.height * (0.48 + 0.04 * cos(progress * pi * 1.3)),
      ),
      radius: size.width * 0.38,
      colors: [_i(const Color(0x88C2185B)), _i(const Color(0x44791342)), const Color(0x00000000)],
    );

    // Orb 6 – orchid bottom-right (phase offset π*0.7)
    _drawMeshOrb(canvas, size,
      center: Offset(
        size.width * (0.82 + 0.04 * cos(progress * pi * 0.7)),
        size.height * (0.78 + 0.03 * sin(progress * pi * 0.7)),
      ),
      radius: size.width * 0.44,
      colors: [_i(const Color(0x66A55BFF)), _i(const Color(0x44571E6B)), const Color(0x00000000)],
    );

    // --- 3 silk wave layers (was 2) ---

    _drawSilkWave(canvas, size,
      yFactor: 0.18 + 0.04 * sin(progress * pi * 2),
      amplitude: 46,
      thickness: 120,
      colors: [
        const Color(0x00F6B7CE),
        _i(const Color(0x59F07AAE)),
        _i(const Color(0x30A55BFF)),
        const Color(0x00F6B7CE),
      ],
    );

    _drawSilkWave(canvas, size,
      yFactor: 0.62 + 0.05 * cos(progress * pi * 2),
      amplitude: 62,
      thickness: 150,
      colors: [
        const Color(0x00E0A3BA),
        _i(const Color(0x50C2185B)),
        _i(const Color(0x28531A56)),
        const Color(0x00E0A3BA),
      ],
    );

    // Wave 3 – new, lower portion with offset phase
    _drawSilkWave(canvas, size,
      yFactor: 0.84 + 0.03 * sin(progress * pi * 2 + pi * 0.7),
      amplitude: 38,
      thickness: 100,
      colors: [
        const Color(0x00F07AAE),
        _i(const Color(0x40E04F8F)),
        _i(const Color(0x209D63FF)),
        const Color(0x00F07AAE),
      ],
    );

    // Vignette
    final vignette = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0, -0.08),
        radius: 1.18,
        colors: [
          Colors.transparent,
          Colors.black.withValues(alpha: 0.55),
        ],
      ).createShader(rect);
    canvas.drawRect(rect, vignette);
  }

  void _drawMeshOrb(
    Canvas canvas,
    Size size, {
    required Offset center,
    required double radius,
    required List<Color> colors,
  }) {
    final orbRect = Rect.fromCircle(center: center, radius: radius);
    final paint = Paint()
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 90)
      ..shader = RadialGradient(
        colors: colors,
        stops: const [0.0, 0.48, 1.0],
      ).createShader(orbRect);
    canvas.drawCircle(center, radius, paint);
  }

  void _drawSilkWave(
    Canvas canvas,
    Size size, {
    required double yFactor,
    required double amplitude,
    required double thickness,
    required List<Color> colors,
  }) {
    final path = Path();
    final baseY = size.height * yFactor;

    path.moveTo(-size.width * 0.2, baseY);
    for (double x = -size.width * 0.2; x <= size.width * 1.2; x += 20) {
      final wave =
          sin((x / size.width * 2.7 * pi) + (progress * 2 * pi)) * amplitude;
      final fold = cos((x / size.width * 1.3 * pi) - (progress * pi)) *
          (amplitude * 0.45);
      path.lineTo(x, baseY + wave + fold);
    }

    final strokePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 55)
      ..shader = LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: colors,
        stops: const [0.0, 0.35, 0.7, 1.0],
      ).createShader(Offset.zero & size);

    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _SilkPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.intensity != intensity ||
      oldDelegate.colorScheme != colorScheme;
}

// ---------------------------------------------------------------------------
// RitualScaffold
// ---------------------------------------------------------------------------

class RitualScaffold extends StatelessWidget {
  const RitualScaffold({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
    this.intensity = 0.5,
  });

  final Widget child;
  final EdgeInsets padding;
  final double intensity;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          LiquidSilkBackground(intensity: intensity),
          SafeArea(
            child: Padding(
              padding: padding,
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// RitualGlassCard — press animation + shimmer border
// ---------------------------------------------------------------------------

class RitualGlassCard extends StatefulWidget {
  const RitualGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.height,
    this.onTap,
    this.accentBorder = false,
    this.glowColor,
  });

  final Widget child;
  final EdgeInsets padding;
  final double? height;
  final VoidCallback? onTap;
  final bool accentBorder;
  final Color? glowColor;

  @override
  State<RitualGlassCard> createState() => _RitualGlassCardState();
}

class _RitualGlassCardState extends State<RitualGlassCard>
    with TickerProviderStateMixin {
  late final AnimationController _pressController;
  late final Animation<double> _scaleAnimation;
  late final AnimationController _shimmerController;
  late final Animation<Color?> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    _pressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      reverseDuration: const Duration(milliseconds: 300),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _pressController, curve: Curves.easeOut, reverseCurve: Curves.elasticOut),
    );

    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _shimmerAnimation = ColorTween(
      begin: AppColors.glassBorder,
      end: AppColors.borderStrong,
    ).animate(CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pressController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_scaleAnimation, _shimmerAnimation]),
      builder: (context, child) {
        final borderColor = widget.accentBorder
            ? AppColors.accent
            : (_shimmerAnimation.value ?? AppColors.glassBorder);

        final card = Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            height: widget.height,
            padding: widget.padding,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: borderColor),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.surfaceRaised.withValues(alpha: 0.90),
                  AppColors.surface.withValues(alpha: 0.76),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: (widget.glowColor ?? AppColors.accent).withValues(alpha: 0.12),
                  blurRadius: 34,
                  offset: const Offset(0, 16),
                ),
                if (widget.glowColor != null)
                  BoxShadow(
                    color: widget.glowColor!.withValues(alpha: 0.25),
                    blurRadius: 30,
                  ),
              ],
            ),
            child: widget.child,
          ),
        );

        if (widget.onTap == null) return card;
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTapDown: (_) => _pressController.forward(),
          onTapUp: (_) {
            _pressController.reverse();
            HapticFeedback.lightImpact();
            widget.onTap?.call();
          },
          onTapCancel: () => _pressController.reverse(),
          child: card,
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// RitualButton — press scale + haptic + glow
// ---------------------------------------------------------------------------

class RitualButton extends StatefulWidget {
  const RitualButton({
    super.key,
    required this.label,
    required this.onTap,
    this.secondary = false,
    this.enabled = true,
  });

  final String label;
  final VoidCallback? onTap;
  final bool secondary;
  final bool enabled;

  @override
  State<RitualButton> createState() => _RitualButtonState();
}

class _RitualButtonState extends State<RitualButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pressController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _pressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 300),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _pressController, curve: Curves.easeOut, reverseCurve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _pressController.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (!widget.enabled || widget.onTap == null) return;
    HapticFeedback.lightImpact();
    widget.onTap!();
  }

  @override
  Widget build(BuildContext context) {
    final isPrimary = !widget.secondary;

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: AnimatedOpacity(
        opacity: widget.enabled ? 1 : 0.55,
        duration: const Duration(milliseconds: 180),
        child: GestureDetector(
          onTapDown: widget.enabled ? (_) => _pressController.forward() : null,
          onTapUp: widget.enabled
              ? (_) {
                  _pressController.reverse();
                  _handleTap();
                }
              : null,
          onTapCancel: widget.enabled ? () => _pressController.reverse() : null,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 18),
            decoration: BoxDecoration(
              color: widget.secondary
                  ? AppColors.surfaceAlt
                  : const Color(0xFFF5F2ED),
              borderRadius: BorderRadius.circular(999),
              border: widget.secondary
                  ? Border.all(color: AppColors.glassBorder)
                  : null,
              boxShadow: isPrimary
                  ? [
                      BoxShadow(
                        color: AppColors.accent.withValues(alpha: 0.35),
                        blurRadius: 24,
                      ),
                    ]
                  : null,
            ),
            child: Text(
              widget.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: widget.secondary ? AppColors.text : Colors.black,
                fontSize: 11,
                letterSpacing: widget.secondary ? 0.8 : 2.2,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
