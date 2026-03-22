import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const bg = Color(0xFF0D0A0F);
  static const bgSoft = Color(0xFF130B13);
  static const backgroundElevated = Color(0xFF0E0E0E);
  static const backgroundCanvas = Color(0xFF050505);
  static const accent = Color(0xFFC2185B);
  static const accentDark = Color(0xFF8B1A4A);
  static const accentStrong = Color(0xFFD0316E);
  static const blush = Color(0xFFF07AAE);
  static const orchid = Color(0xFFA55BFF);
  static const plum = Color(0xFF4A1538);
  static const berry = Color(0xFF7C1B4D);
  static const ink = Color(0xFF120811);
  static const pearl = Color(0xFFF7E8EE);
  static const secondary = Color(0xFFD4956A);
  static const success = Color(0xFF7EC8A4);
  static const warning = Color(0xFFEDBC78);
  static const danger = Color(0xFFF0708A);
  static const text = Color(0xFFF5F0F2);
  static const textSecondary = Color(0x9EF5F0F2);
  static const textMuted = Color(0x61F5F0F2);
  static const glass = Color(0x14FFFFFF);
  static const glassBorder = Color(0x1FFFFFFF);
  static const surface = Color(0xE0140D10);
  static const surfaceAlt = Color(0xF01C1116);
  static const surfaceRaised = Color(0xFA26161C);
  static const border = Color(0x14FFFFFF);
  static const borderStrong = Color(0x24FFFFFF);
  static const wineDeep = Color(0xFF4A0E20);
  static const wineMid = Color(0xFF6B1530);
  static const wineLight = Color(0xFF8D2242);
  static const gradientStart = Color(0xFF170A12);
  static const gradientMid = Color(0xFF120811);
  static const gradientEnd = Color(0xFF050306);
}

class AppTheme {
  static ThemeData build() {
    final base = ThemeData.dark(useMaterial3: true);
    final textTheme =
        GoogleFonts.playfairDisplayTextTheme(base.textTheme).copyWith(
      displayLarge: GoogleFonts.playfairDisplay(
        fontSize: 40,
        color: AppColors.text,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.4,
      ),
      headlineLarge: GoogleFonts.playfairDisplay(
        fontSize: 32,
        color: AppColors.text,
        fontWeight: FontWeight.w400,
      ),
      headlineMedium: GoogleFonts.playfairDisplay(
        fontSize: 26,
        color: AppColors.text,
        fontWeight: FontWeight.w400,
      ),
      bodyLarge: const TextStyle(
        fontSize: 15,
        color: AppColors.text,
        height: 1.45,
      ),
      bodyMedium: const TextStyle(
        fontSize: 13,
        color: AppColors.textSecondary,
        height: 1.4,
      ),
      labelSmall: const TextStyle(
        fontSize: 10,
        color: AppColors.textMuted,
        letterSpacing: 2.4,
        fontWeight: FontWeight.w600,
      ),
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bg,
      textTheme: textTheme,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.accent,
        secondary: AppColors.secondary,
        surface: AppColors.surface,
        error: AppColors.danger,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
    );
  }
}
