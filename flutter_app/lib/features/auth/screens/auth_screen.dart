import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  static const _phrases = [
    ('Искусство ', 'близости'),
    ('Истинное ', 'притяжение'),
    ('За гранью ', 'привычного'),
    ('Эстетика ', 'чувств'),
  ];

  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % _phrases.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final phrase = _phrases[_index];
    return RitualScaffold(
      child: Column(
        children: [
          const Spacer(flex: 4),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 700),
            child: RichText(
              key: ValueKey(_index),
              textAlign: TextAlign.center,
              text: TextSpan(
                style: GoogleFonts.playfairDisplay(
                  fontSize: 44,
                  color: AppColors.text,
                  height: 1.15,
                ),
                children: [
                  TextSpan(text: phrase.$1),
                  TextSpan(
                    text: phrase.$2,
                    style: GoogleFonts.playfairDisplay(
                      fontStyle: FontStyle.italic,
                      color: AppColors.text.withOpacity(0.76),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(flex: 3),
          RitualButton(
            label: 'НАЧАТЬ СЕЙЧАС',
            onTap: () => context.go('/onboarding'),
          ),
          const SizedBox(height: 16),
          RitualButton(
            label: 'Войти через Apple',
            onTap: () => context.go('/onboarding'),
            secondary: true,
          ),
          const SizedBox(height: 10),
          RitualButton(
            label: 'Войти через Google',
            onTap: () => context.go('/onboarding'),
            secondary: true,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => context.go('/onboarding'),
                  child: const Text(
                    'РЕГИСТРАЦИЯ',
                    style:
                        TextStyle(color: AppColors.textMuted, letterSpacing: 2),
                  ),
                ),
              ),
              Expanded(
                child: TextButton(
                  onPressed: () => context.go('/onboarding'),
                  child: const Text(
                    'ВОЙТИ',
                    textAlign: TextAlign.center,
                    style:
                        TextStyle(color: AppColors.textMuted, letterSpacing: 2),
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
