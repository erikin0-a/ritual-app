import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/analytics_service.dart';
import '../../../domain/models/app_models.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';

class DiceScreen extends ConsumerStatefulWidget {
  const DiceScreen({super.key});

  @override
  ConsumerState<DiceScreen> createState() => _DiceScreenState();
}

class _DiceScreenState extends ConsumerState<DiceScreen> {
  static const _actions = [
    'Поцелуй',
    'Шёпот',
    'Проведи пальцами',
    'Прикоснись',
    'Обними',
    'Замри рядом',
    'Поцелуй медленно',
    'Скажи фразу',
    'Прижми ближе',
    'Проведи губами',
  ];

  static const _bodyParts = [
    'шея',
    'запястье',
    'ключица',
    'спина',
    'бедро',
    'ладонь',
    'живот',
    'плечо',
    'талия',
    'ухо',
  ];

  static const _styles = [
    'медленно',
    'очень мягко',
    'нежно',
    'на три вдоха',
    'с паузой',
    'едва касаясь',
    'чуть дольше обычного',
    'не отводя взгляд',
    'как будто это секрет',
    'почти не касаясь',
  ];

  DiceResult? _result;
  bool _isRolling = false;

  Future<void> _roll() async {
    setState(() => _isRolling = true);
    await ref.read(analyticsServiceProvider).diceRolled();
    await Future<void>.delayed(const Duration(milliseconds: 500));
    final random = Random();
    setState(() {
      _result = DiceResult(
        action: _actions[random.nextInt(_actions.length)],
        bodyPart: _bodyParts[random.nextInt(_bodyParts.length)],
        style: _styles[random.nextInt(_styles.length)],
      );
      _isRolling = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return RitualScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Кубики',
            style: GoogleFonts.playfairDisplay(
              color: AppColors.text,
              fontSize: 42,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Случайная чувственная комбинация',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _DiceTile(label: 'Действие', value: _result?.action ?? '...')),
                    const SizedBox(width: 12),
                    Expanded(child: _DiceTile(label: 'Зона', value: _result?.bodyPart ?? '...')),
                    const SizedBox(width: 12),
                    Expanded(child: _DiceTile(label: 'Стиль', value: _result?.style ?? '...')),
                  ],
                ),
                const SizedBox(height: 20),
                RitualGlassCard(
                  child: SizedBox(
                    width: double.infinity,
                    child: Text(
                      _result == null
                          ? 'Бросьте кубики, чтобы получить комбинацию'
                          : '${_result!.action} · ${_result!.bodyPart} · ${_result!.style}',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.playfairDisplay(
                        color: AppColors.text,
                        fontSize: 30,
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                RitualButton(
                  label: _isRolling ? 'КРУТИМ...' : 'БРОСИТЬ КУБИКИ',
                  onTap: _isRolling ? null : _roll,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DiceTile extends StatelessWidget {
  const _DiceTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return RitualGlassCard(
      height: 160,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 9,
              letterSpacing: 3,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.playfairDisplay(
              color: AppColors.text,
              fontSize: 28,
            ),
          ),
        ],
      ),
    );
  }
}
