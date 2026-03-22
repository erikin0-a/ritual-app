import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';

class TruthOrDareScreen extends StatelessWidget {
  const TruthOrDareScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RitualScaffold(
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Правда или Действие',
              style: GoogleFonts.playfairDisplay(
                color: AppColors.text,
                fontSize: 40,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Лёгкий · Острый · Дикий · Скоро',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
