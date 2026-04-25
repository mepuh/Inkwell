import { MD3LightTheme } from 'react-native-paper';

/**
 * Inkwell Brand Color Palette
 * Organized from lightest to darkest with semantic mapping
 */
export const InkwellColors = {
  // Neutral/Background palette (lightest to darkest)
  neutral50: '#F9F4F1',  // Lightest - near white
  neutral100: '#FDF8EC', // Off-white/cream
  neutral200: '#DECDC5', // Light beige/tan
  neutral400: '#A67F6E', // Warm gray/taupe
  neutral600: '#86614F', // Medium brown
  neutral900: '#3A1F12', // Darkest - dark brown

  // Semantic color assignments
  primary: '#86614F',       // Medium brown - warm, inviting
  secondary: '#A67F6E',     // Warm taupe - complementary accent
  background: '#F9F4F1',    // Lightest - main background
  surface: '#FDF8EC',       // Off-white - card/surface background
  surfaceVariant: '#DECDC5', // Light tan - secondary surface
  onBackground: '#3A1F12',  // Darkest - text on background
  onSurface: '#3A1F12',     // Darkest - text on surface
  onSurfaceVariant: '#86614F', // Medium brown - secondary text
  onPrimary: '#FDF8EC',     // Cream - text/icons on primary
  error: '#D32F2F',         // Material error red (not in palette)
  onError: '#FFFFFF',       // White text on error
};

/**
 * Inkwell Paper Material Design 3 Theme
 * Light theme only for now
 */
export const inkwellTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: InkwellColors.primary,
    onPrimary: InkwellColors.onPrimary,
    primaryContainer: InkwellColors.neutral200,
    onPrimaryContainer: InkwellColors.neutral900,
    secondary: InkwellColors.secondary,
    onSecondary: InkwellColors.onPrimary,
    secondaryContainer: InkwellColors.neutral200,
    onSecondaryContainer: InkwellColors.neutral900,
    tertiary: InkwellColors.neutral400,
    onTertiary: InkwellColors.onPrimary,
    background: InkwellColors.background,
    onBackground: InkwellColors.onBackground,
    surface: InkwellColors.surface,
    onSurface: InkwellColors.onSurface,
    surfaceVariant: InkwellColors.surfaceVariant,
    onSurfaceVariant: InkwellColors.neutral600,
    surfaceDim: InkwellColors.surface,
    surfaceBright: InkwellColors.neutral100,
    outline: InkwellColors.neutral400,
    outlineVariant: InkwellColors.neutral200,
    error: InkwellColors.error,
    onError: InkwellColors.onError,
    errorContainer: InkwellColors.neutral200,
    onErrorContainer: InkwellColors.neutral900,
  },
};

/**
 * Inkwell Typography Scale
 * Uses system fonts for now (can integrate specific fonts later if desired)
 */
export const TypographyScale = {
  // Headings
  headlineSmall: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  // Title
  titleSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  // Body
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  // Label
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
};

/**
 * Inkwell Spacing Scale
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Inkwell Border Radius
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
