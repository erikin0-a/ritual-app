import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';

class ModesHubScreen extends StatelessWidget {
  const ModesHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RitualScaffold(
      child: ExcludeSemantics(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const SizedBox(height: 4),
            const _HubTopBar(),
            const SizedBox(height: 24),
            const _HubHero(),
            const SizedBox(height: 28),
            _ModeHeroCard(
              title: 'Ритуал',
              subtitle: 'Ведомое путешествие для двоих',
              eyebrow: 'SIGNATURE',
              meta: 'голос · ритм · прикосновения',
              alignment: Alignment.topRight,
              palette: const [
                Color(0xFFDD5A93),
                Color(0xFF7F1B4C),
                Color(0xFF281019),
              ],
              onTap: () => context.push('/ritual-mode'),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _ModeEditorialCard(
                    title: 'Chance',
                    subtitle: 'Воля случая',
                    label: 'play',
                    palette: const [
                      Color(0xFF6C223E),
                      Color(0xFF241019),
                    ],
                    accentAlignment: Alignment.topCenter,
                    onTap: () => context.push('/dice'),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _ModeEditorialCard(
                    title: 'Fantasies',
                    subtitle: 'Сценарии и роли',
                    label: 'soon',
                    palette: const [
                      Color(0xFF3A1739),
                      Color(0xFF170D19),
                    ],
                    accentAlignment: Alignment.bottomRight,
                    onTap: () => context.push('/stories'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _ModeWideCard(
              title: 'Правда или действие',
              subtitle: 'Лёгкий · Острый · Дикий',
              badge: 'new scene',
              palette: const [
                Color(0xFF2F111C),
                Color(0xFF12090F),
              ],
              onTap: () => context.push('/truth-or-dare'),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
                color: AppColors.ink.withValues(alpha: 0.36),
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.glassBorder),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0x66F7E8EE),
                          Color(0x22FFFFFF),
                        ],
                      ),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      color: AppColors.pearl,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Text(
                      'Частная коллекция для двоих. Выберите настроение и позвольте экрану задать ритм.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _HubTopBar extends StatelessWidget {
  const _HubTopBar();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: AppColors.borderStrong),
            color: AppColors.ink.withValues(alpha: 0.34),
          ),
          child: const Text(
            'PRIVATE COLLECTION',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 10,
              letterSpacing: 2.6,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const Spacer(),
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.glassBorder),
            color: AppColors.ink.withValues(alpha: 0.28),
          ),
          child: const Icon(
            Icons.nightlight_round,
            color: AppColors.pearl,
            size: 18,
          ),
        ),
      ],
    );
  }
}

class _HubHero extends StatelessWidget {
  const _HubHero();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'CURATED FOR TWO',
          style: TextStyle(
            color: AppColors.textMuted,
            fontSize: 11,
            letterSpacing: 3.2,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        Text.rich(
          TextSpan(
            children: [
              const TextSpan(text: 'Collection\n'),
              TextSpan(
                text: 'de minuit',
                style: GoogleFonts.playfairDisplay(
                  fontStyle: FontStyle.italic,
                  color: AppColors.pearl,
                ),
              ),
            ],
          ),
          style: GoogleFonts.playfairDisplay(
            color: AppColors.text,
            fontSize: 43,
            height: 0.98,
            letterSpacing: -1.2,
          ),
        ),
        const SizedBox(height: 14),
        const Text(
          'Выберите режим как настроение вечера: мягкое погружение, игра случая или более смелая динамика.',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            height: 1.55,
          ),
        ),
      ],
    );
  }
}

class _ModeHeroCard extends StatelessWidget {
  const _ModeHeroCard({
    required this.title,
    required this.subtitle,
    required this.eyebrow,
    required this.meta,
    required this.onTap,
    required this.palette,
    required this.alignment,
  });

  final String title;
  final String subtitle;
  final String eyebrow;
  final String meta;
  final VoidCallback onTap;
  final List<Color> palette;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return RitualGlassCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        height: 268,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: palette,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x26140912),
              blurRadius: 28,
              offset: Offset(0, 18),
            ),
          ],
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: RadialGradient(
              center: alignment,
              radius: 1.0,
              colors: [
                AppColors.pearl.withValues(alpha: 0.16),
                AppColors.blush.withValues(alpha: 0.12),
                Colors.transparent,
              ],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      eyebrow,
                      style: const TextStyle(
                        color: AppColors.pearl,
                        fontSize: 10,
                        letterSpacing: 3,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        color: Colors.black.withValues(alpha: 0.14),
                        border: Border.all(color: AppColors.glassBorder),
                      ),
                      child: const Text(
                        'ENTER',
                        style: TextStyle(
                          color: AppColors.pearl,
                          fontSize: 10,
                          letterSpacing: 2.2,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  title,
                  style: GoogleFonts.playfairDisplay(
                    color: AppColors.pearl,
                    fontSize: 38,
                    height: 0.98,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  meta,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    letterSpacing: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ModeEditorialCard extends StatelessWidget {
  const _ModeEditorialCard({
    required this.title,
    required this.subtitle,
    required this.label,
    required this.palette,
    required this.accentAlignment,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String label;
  final List<Color> palette;
  final Alignment accentAlignment;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return RitualGlassCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        height: 214,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: palette,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A140912),
              blurRadius: 24,
              offset: Offset(0, 14),
            ),
          ],
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: RadialGradient(
              center: accentAlignment,
              radius: 1.05,
              colors: [
                AppColors.blush.withValues(alpha: 0.14),
                AppColors.pearl.withValues(alpha: 0.08),
                Colors.transparent,
              ],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 9,
                    letterSpacing: 2.8,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Text(
                  title,
                  style: GoogleFonts.playfairDisplay(
                    color: AppColors.pearl,
                    fontSize: 27,
                    height: 1.02,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ModeWideCard extends StatelessWidget {
  const _ModeWideCard({
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.palette,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String badge;
  final List<Color> palette;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return RitualGlassCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        height: 142,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: palette,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A12090F),
              blurRadius: 22,
              offset: Offset(0, 12),
            ),
          ],
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: RadialGradient(
              center: Alignment.centerRight,
              radius: 1.0,
              colors: [
                AppColors.orchid.withValues(alpha: 0.12),
                AppColors.blush.withValues(alpha: 0.10),
                Colors.transparent,
              ],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: AppColors.borderStrong),
                          color: Colors.white.withValues(alpha: 0.04),
                        ),
                        child: Text(
                          badge.toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 9,
                            letterSpacing: 2.2,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        title,
                        style: GoogleFonts.playfairDisplay(
                          color: AppColors.pearl,
                          fontSize: 30,
                          height: 0.98,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.glassBorder),
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                  child: const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppColors.pearl,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
