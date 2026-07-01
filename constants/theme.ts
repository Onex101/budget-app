import type { AppThemeId } from '@/lib/types';

export const gamificationTokens = {
  colors: {
    bgMain: '#0F0F12',
    bgCard: '#1C1C24',
    borderBold: '#000000',
    textMain: '#FFFFFF',
    textMuted: '#9E9EAF',
    financialSurplus: '#10B981',
    financialDeficit: '#EF4444',
    streakActive: '#FF5722',
    xpPoints: '#3B82F6',
    rarityCommon: '#A0A0B0',
    rarityEpic: '#8B5CF6',
    rarityLegendary: '#F59E0B',
  },
  radii: {
    card: 18,
    pill: 9999,
  },
  motion: {
    springElastic: { damping: 10, stiffness: 100, mass: 0.6 },
    springTight: { damping: 15, stiffness: 150 },
  },
} as const;

export type AppThemeColors = {
  backgroundTop: string;
  backgroundBottom: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  text: string;
  mutedText: string;
  border: string;
  lime: string;
  limeDark: string;
  sky: string;
  amber: string;
  red: string;
  redSurface: string;
  goldSurface: string;
  blueSurface: string;
  successSurface: string;
  epicSurface: string;
  shadow: string;
  overlay: string;
};

type ThemePreset = {
  id: AppThemeId;
  name: string;
  note: string;
  colors: AppThemeColors;
  swatches: string[];
};

export const themePresets: ThemePreset[] = [
  {
    id: 'arcade-night',
    name: 'Arcade Night',
    note: 'Current vibe',
    colors: {
      backgroundTop: '#181821',
      backgroundBottom: gamificationTokens.colors.bgMain,
      surface: gamificationTokens.colors.bgCard,
      surfaceMuted: '#252531',
      surfaceRaised: '#30303C',
      text: gamificationTokens.colors.textMain,
      mutedText: gamificationTokens.colors.textMuted,
      border: gamificationTokens.colors.borderBold,
      lime: gamificationTokens.colors.financialSurplus,
      limeDark: gamificationTokens.colors.financialSurplus,
      sky: gamificationTokens.colors.xpPoints,
      amber: gamificationTokens.colors.rarityLegendary,
      red: gamificationTokens.colors.financialDeficit,
      redSurface: '#381A1F',
      goldSurface: '#3D2B0E',
      blueSurface: '#162843',
      successSurface: '#123126',
      epicSurface: '#24183B',
      shadow: 'rgba(0, 0, 0, 0.55)',
      overlay: 'rgba(8, 8, 10, 0.72)',
    },
    swatches: ['#0F0F12', '#1C1C24', '#10B981', '#3B82F6'],
  },
  {
    id: 'mint-graph',
    name: 'Mint Graph',
    note: 'Light + playful',
    colors: {
      backgroundTop: '#F4FFF7',
      backgroundBottom: '#E9F8EE',
      surface: '#FFFFFF',
      surfaceMuted: '#EAF8F0',
      surfaceRaised: '#DCF2E5',
      text: '#103525',
      mutedText: '#4F6B5E',
      border: '#1A4E38',
      lime: '#22C55E',
      limeDark: '#16A34A',
      sky: '#0EA5E9',
      amber: '#F59E0B',
      red: '#DC2626',
      redSurface: '#FEE2E2',
      goldSurface: '#FEF3C7',
      blueSurface: '#DBF0FF',
      successSurface: '#DCFCE7',
      epicSurface: '#E0E7FF',
      shadow: 'rgba(10, 49, 33, 0.18)',
      overlay: 'rgba(16, 52, 38, 0.26)',
    },
    swatches: ['#F4FFF7', '#DFF5E7', '#22C55E', '#0EA5E9'],
  },
  {
    id: 'sunset-ledger',
    name: 'Sunset Ledger',
    note: 'Warm contrast',
    colors: {
      backgroundTop: '#2A1638',
      backgroundBottom: '#1A1024',
      surface: '#2D1B3D',
      surfaceMuted: '#3C2750',
      surfaceRaised: '#4E3567',
      text: '#FFF5EA',
      mutedText: '#D7C2B2',
      border: '#0F0B17',
      lime: '#F97316',
      limeDark: '#EA580C',
      sky: '#F59E0B',
      amber: '#FDBA74',
      red: '#EF4444',
      redSurface: '#4A1F2B',
      goldSurface: '#4A3517',
      blueSurface: '#3D2A5A',
      successSurface: '#45321D',
      epicSurface: '#4B245D',
      shadow: 'rgba(0, 0, 0, 0.45)',
      overlay: 'rgba(9, 5, 13, 0.68)',
    },
    swatches: ['#1A1024', '#2D1B3D', '#F97316', '#F59E0B'],
  },
];

export function getThemeColors(themeId: AppThemeId): AppThemeColors {
  return themePresets.find((preset) => preset.id === themeId)?.colors ?? themePresets[0].colors;
}

export const AppColors = getThemeColors('arcade-night');

export const AppRadii = gamificationTokens.radii;

export const AppMotion = gamificationTokens.motion;
