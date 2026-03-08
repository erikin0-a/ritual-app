export const Colors = {
  background: '#1E1B2E',
  accent: '#FF4F8B',
  secondary: '#FF8A3D',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  surface: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.12)',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
} as const

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 24, fontWeight: '600' as const, color: Colors.text },
  h3: { fontSize: 20, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: Colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
} as const
