export const Fonts = {
  display: 'PlayfairDisplay_400Regular',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
} as const

export const Colors = {
  bg: '#0D0A0F',
  background: '#0D0A0F',
  backgroundElevated: '#0E0E0E',
  backgroundCanvas: '#050505',
  accent: '#C2185B',
  accentDark: '#8B1A4A',
  accentStrong: '#D0316E',
  accentMuted: 'rgba(194, 24, 91, 0.18)',
  secondary: '#D4956A',
  secondarySoft: 'rgba(212, 149, 106, 0.18)',
  success: '#7EC8A4',
  warning: '#EDBC78',
  danger: '#F0708A',
  text: '#F5F0F2',
  textSecondary: 'rgba(245, 240, 242, 0.62)',
  textMuted: 'rgba(245, 240, 242, 0.38)',
  textInverse: '#0D080A',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  surface: 'rgba(20, 13, 16, 0.88)',
  surfaceAlt: 'rgba(28, 17, 22, 0.96)',
  surfaceRaised: 'rgba(38, 22, 28, 0.98)',
  surfaceTransparent: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  overlay: 'rgba(4, 3, 4, 0.64)',
  overlayStrong: 'rgba(4, 3, 4, 0.88)',
  wineDeep: '#4A0E20',
  wineMid: '#6B1530',
  wineLight: '#8D2242',
  gradientStart: '#1E0A11',
  gradientMid: '#120810',
  gradientEnd: '#040304',
  ritualGlow: 'rgba(194, 24, 91, 0.2)',
  ritualGlowStrong: 'rgba(194, 24, 91, 0.4)',
} as const

export const SemanticColors = {
  page: Colors.background,
  pageAlt: Colors.backgroundElevated,
  surfacePrimary: Colors.surface,
  surfaceSecondary: Colors.surfaceAlt,
  surfaceRaised: Colors.surfaceRaised,
  surfaceAccent: Colors.accentMuted,
  surfaceSuccess: 'rgba(126, 200, 164, 0.14)',
  surfaceWarning: 'rgba(237, 188, 120, 0.14)',
  hairline: Colors.border,
  hairlineStrong: Colors.borderStrong,
  chip: 'rgba(255, 255, 255, 0.06)',
  chipAccent: 'rgba(194, 24, 91, 0.18)',
  chipSuccess: 'rgba(126, 200, 164, 0.16)',
  chipWarning: 'rgba(237, 188, 120, 0.16)',
  timerTrack: 'rgba(255, 255, 255, 0.08)',
  timerFill: Colors.accentStrong,
  subtitleSurface: 'rgba(8, 5, 7, 0.84)',
  backdrop: Colors.overlay,
  backdropStrong: Colors.overlayStrong,
} as const

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  full: 9999,
} as const

export const Motion = {
  instant: 140,
  fast: 220,
  medium: 360,
  slow: 560,
  slower: 860,
} as const

export const Shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 10,
  },
  glow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
  },
} as const

export const Typography = {
  display: {
    fontFamily: Fonts.display,
    fontSize: 40,
    fontWeight: '300' as const,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '300' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '300' as const,
    color: Colors.text,
  },
  h3: {
    fontSize: 19,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.text,
    lineHeight: 23,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 23,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
  },
} as const
