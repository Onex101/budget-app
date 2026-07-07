import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppColors, AppMotion, AppRadii, getThemeColors } from '@/constants/theme';
import { fireButtonHaptic } from '@/lib/haptics';
import { useBudgetStore } from '@/store/useBudgetStore';

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  bottomInset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  caption?: string;
};

type SectionCardProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

type PillButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  small?: boolean;
  fullWidth?: boolean;
};

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

type StatChipProps = {
  label: string;
  value: string;
  tone?: 'lime' | 'sky' | 'amber' | 'red';
};

type EmptyStateProps = {
  title: string;
  message: string;
};

type LoadingSplashProps = {
  label?: string;
};

type BudgetShieldProps = {
  progress: number;
  title?: string;
  caption?: string;
};

type FormSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

type FloatingActionButtonProps = {
  label: string;
  onPress: () => void;
  size?: 'compact' | 'regular';
};

type AnimatedDeficitWrapperProps = {
  isActive: boolean;
  children: ReactNode;
};

function getButtonPalette(variant: PillButtonProps['variant']) {
  const colors = getThemeColors(useBudgetStore.getState().appTheme);

  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: colors.sky,
        shadowColor: '#1D4ED8',
        borderColor: colors.border,
        textColor: colors.text,
      };
    case 'danger':
      return {
        backgroundColor: colors.red,
        shadowColor: '#9F1D1D',
        borderColor: colors.border,
        textColor: colors.text,
      };
    case 'ghost':
      return {
        backgroundColor: colors.surfaceRaised,
        shadowColor: colors.border,
        borderColor: colors.border,
        textColor: colors.text,
      };
    case 'primary':
    default:
      return {
        backgroundColor: colors.limeDark,
        shadowColor: '#0B7A55',
        borderColor: colors.border,
        textColor: colors.text,
      };
  }
}

function useThemeColors() {
  const appTheme = useBudgetStore((state) => state.appTheme);
  return useMemo(() => getThemeColors(appTheme), [appTheme]);
}

export function AppScreen({ children, scroll = true, bottomInset = 120, contentContainerStyle }: AppScreenProps) {
  const colors = useThemeColors();
  const baseContentStyle = useMemo(
    () => [
      styles.screenContent,
      scroll ? styles.screenContentScroll : styles.screenContentStatic,
      { paddingBottom: bottomInset },
    ] as const,
    [bottomInset, scroll],
  );

  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[baseContentStyle, contentContainerStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[baseContentStyle, contentContainerStyle]}>{children}</View>
  );

  return (
    <LinearGradient
      colors={[colors.backgroundTop, colors.backgroundBottom]}
      end={{ x: 0.85, y: 1 }}
      start={{ x: 0.15, y: 0 }}
      style={styles.screen}>
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowBlue]} />
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowGold]} />
      {content}
    </LinearGradient>
  );
}

export function LoadingSplash({ label = 'Loading your money map...' }: LoadingSplashProps) {
  const colors = useThemeColors();

  return (
    <LinearGradient
      colors={[colors.backgroundTop, colors.backgroundBottom]}
      end={{ x: 0.85, y: 1 }}
      start={{ x: 0.15, y: 0 }}
      style={styles.loadingScreen}>
      <View style={[styles.loadingBadge, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <ActivityIndicator size="large" color={colors.sky} />
      </View>
      <Text style={[styles.loadingText, { color: colors.text }]}>{label}</Text>
    </LinearGradient>
  );
}

export function SectionHeading({ eyebrow, title, caption }: SectionHeadingProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.sectionHeading}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.sky }]}>{eyebrow}</Text> : null}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {caption ? <Text style={[styles.sectionCaption, { color: colors.mutedText }]}>{caption}</Text> : null}
    </View>
  );
}

export function SectionCard({ children, title, subtitle, accentColor = AppColors.lime, style }: SectionCardProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.cardShell}>
      <View style={[styles.cardShadowLayer, { backgroundColor: colors.border }]} />
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }, style]}>
        <View style={[styles.cardAccent, { backgroundColor: accentColor, borderColor: colors.border }]} />
        {title ? <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text> : null}
        {subtitle ? <Text style={[styles.cardSubtitle, { color: colors.mutedText }]}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function PillButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  small = false,
  fullWidth,
}: PillButtonProps) {
  const shouldFillWidth = fullWidth ?? !small;
  const buttonDepth = small ? 4 : 6;
  const inlineWidth = Math.max(
    small ? 112 : 118,
    Math.min(small ? 270 : 360, label.length * (small ? 9.5 : 10) + (small ? 38 : 44)),
  );
  const { backgroundColor, borderColor, shadowColor, textColor } = getButtonPalette(variant);
  const offsetY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: disabled ? 0 : offsetY.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        if (disabled) {
          return;
        }

        void fireButtonHaptic();
        offsetY.value = withSpring(buttonDepth, AppMotion.springTight);
      }}
      onPressOut={() => {
        offsetY.value = withSpring(0, AppMotion.springElastic);
      }}
      onPress={onPress}
      style={[
        styles.buttonShell,
        shouldFillWidth ? styles.buttonFullWidth : styles.buttonInline,
        !shouldFillWidth && { width: inlineWidth },
        small && styles.buttonSmall,
        disabled && styles.buttonDisabled,
        { paddingBottom: buttonDepth },
      ]}>
      <View
        style={[
          styles.buttonShadowLayer,
          { backgroundColor: shadowColor, borderColor, top: buttonDepth },
        ]}
      />
      <Animated.View
        style={[
          styles.buttonFace,
          small && styles.buttonFaceSmall,
          { backgroundColor, borderColor, bottom: buttonDepth },
          animatedStyle,
        ]}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={small ? 0.74 : 0.62}
          numberOfLines={1}
          style={[styles.buttonLabel, small && styles.buttonLabelSmall, { color: textColor }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function TactileButton(props: PillButtonProps) {
  return <PillButton {...props} />;
}

export function Field({ label, hint, ...inputProps }: FieldProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedText}
        style={[
          styles.fieldInput,
          { borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.text },
          inputProps.multiline && styles.fieldInputMultiline,
        ]}
        {...inputProps}
      />
      {hint ? <Text style={[styles.fieldHint, { color: colors.mutedText }]}>{hint}</Text> : null}
    </View>
  );
}

export function StatChip({ label, value, tone = 'lime' }: StatChipProps) {
  const colors = useThemeColors();
  const toneStyles = {
    backgroundColor:
      tone === 'sky'
        ? colors.blueSurface
        : tone === 'amber'
          ? colors.goldSurface
          : tone === 'red'
            ? colors.redSurface
            : colors.successSurface,
  };

  return (
    <View style={[styles.statChip, { borderColor: colors.border, shadowColor: colors.shadow }, toneStyles]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const colors = useThemeColors();
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.progressTrack, { borderColor: colors.border }]}>
      <View style={[styles.progressFillWrap, { width: `${clampedProgress * 100}%` }]}>
        <LinearGradient colors={[colors.sky, colors.amber]} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.progressFill} />
      </View>
    </View>
  );
}

export function BudgetShield({ progress, title = 'Cycle shield', caption }: BudgetShieldProps) {
  const colors = useThemeColors();
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const isCritical = clampedProgress >= 0.8;
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = isCritical
      ? withRepeat(withSequence(withTiming(0.38, { duration: 750 }), withTiming(1, { duration: 750 })), -1, false)
      : withTiming(1, { duration: 180 });
  }, [isCritical, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.shieldGroup}>
      <View style={styles.shieldHeader}>
        <Text style={[styles.shieldTitle, { color: colors.text }]}>{title}</Text>
        <Text
          style={[
            styles.shieldStatus,
            {
              backgroundColor: isCritical ? colors.redSurface : colors.successSurface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}>
          {isCritical ? 'Pressure high' : 'Stable'}
        </Text>
      </View>
      <View style={[styles.shieldTrack, { borderColor: colors.border }]}>
        <Animated.View
          style={[
            styles.shieldFill,
            animatedStyle,
            {
              width: `${clampedProgress * 100}%`,
              backgroundColor: isCritical ? colors.red : colors.lime,
            },
          ]}
        />
      </View>
      {caption ? <Text style={[styles.shieldCaption, { color: colors.mutedText }]}>{caption}</Text> : null}
    </View>
  );
}

export function AnimatedDeficitWrapper({ isActive, children }: AnimatedDeficitWrapperProps) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = isActive
      ? withRepeat(withSequence(withTiming(0.45, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false)
      : withTiming(1, { duration: 180 });
  }, [isActive, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function FormSheetModal({ visible, onClose, title, subtitle, children }: FormSheetModalProps) {
  const colors = useThemeColors();
  const translateY = useSharedValue(460);

  useEffect(() => {
    if (!visible) {
      translateY.value = 460;
      return;
    }

    translateY.value = withSpring(0, AppMotion.springElastic);
  }, [translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} />
        <Animated.View style={[styles.modalSheet, { borderColor: colors.border, backgroundColor: colors.surface }, animatedStyle]}>
          <View style={[styles.modalHandle, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} />
          {title ? <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>{subtitle}</Text> : null}
          <View style={styles.modalContent}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function FloatingActionButton({ label, onPress, size = 'compact' }: FloatingActionButtonProps) {
  const colors = useThemeColors();
  const isCompact = size === 'compact';
  const buttonDepth = isCompact ? 4 : 6;
  const faceSize = isCompact ? 58 : 72;
  const radius = faceSize / 2;
  const shellSize = faceSize + buttonDepth;
  const offsetY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.fabContainer}>
      <Pressable
        accessibilityLabel="Add"
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          void fireButtonHaptic();
          offsetY.value = withSpring(buttonDepth, AppMotion.springTight);
        }}
        onPressOut={() => {
          offsetY.value = withSpring(0, AppMotion.springElastic);
        }}
        style={[styles.fabShell, { width: shellSize, minHeight: shellSize + buttonDepth, paddingBottom: buttonDepth }]}>
        <View
          style={[
            styles.fabShadowLayer,
            {
              top: buttonDepth,
              borderColor: colors.border,
              backgroundColor: colors.surfaceRaised,
              height: faceSize,
              borderRadius: radius,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.fabFace,
            {
              bottom: buttonDepth,
              borderColor: colors.border,
              backgroundColor: colors.limeDark,
              height: faceSize,
              borderRadius: radius,
            },
            animatedStyle,
          ]}>
          <Text style={[styles.fabLabel, { color: colors.text, fontSize: isCompact ? 30 : 38, lineHeight: isCompact ? 32 : 40 }]}>{label}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.emptyState, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.mutedText }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  screenGlowBlue: {
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  screenGlowGold: {
    bottom: 120,
    left: -90,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  screenContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 14,
  },
  screenContentScroll: {
    flexGrow: 1,
  },
  screenContentStatic: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  loadingBadge: {
    width: 88,
    height: 88,
    borderRadius: AppRadii.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 3,
    borderColor: AppColors.border,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 0,
    elevation: 10,
  },
  loadingText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: AppColors.text,
  },
  sectionHeading: {
    gap: 6,
  },
  eyebrow: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: AppColors.sky,
  },
  sectionTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 26,
    lineHeight: 30,
    color: AppColors.text,
  },
  sectionCaption: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.mutedText,
  },
  cardShell: {
    position: 'relative',
    paddingBottom: 6,
  },
  cardShadowLayer: {
    position: 'absolute',
    top: 6,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: AppRadii.card,
    backgroundColor: AppColors.border,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    padding: 16,
    gap: 10,
    borderWidth: 3,
    borderColor: AppColors.border,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 0,
    elevation: 10,
  },
  cardAccent: {
    width: 72,
    height: 12,
    borderRadius: AppRadii.pill,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  cardTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: AppColors.text,
  },
  cardSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.mutedText,
  },
  buttonShell: {
    position: 'relative',
    minHeight: 58,
    justifyContent: 'flex-start',
    maxWidth: '100%',
  },
  buttonFullWidth: {
    alignSelf: 'stretch',
  },
  buttonInline: {
    alignSelf: 'flex-start',
    minWidth: 0,
    maxWidth: '100%',
  },
  buttonSmall: {
    minHeight: 46,
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonShadowLayer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: AppRadii.pill,
    borderWidth: 3,
  },
  buttonFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: AppRadii.pill,
    borderWidth: 3,
  },
  buttonFaceSmall: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
  buttonLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flexShrink: 1,
    textAlign: 'center',
  },
  buttonLabelSmall: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: AppColors.text,
  },
  fieldInput: {
    minHeight: 54,
    borderRadius: AppRadii.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.text,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  fieldInputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.mutedText,
  },
  statChip: {
    flex: 1,
    minWidth: 100,
    padding: 14,
    borderRadius: AppRadii.card,
    gap: 6,
    borderWidth: 2,
    borderColor: AppColors.border,
    shadowColor: AppColors.shadow,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 0,
    elevation: 4,
  },
  limeChip: {
    backgroundColor: AppColors.successSurface,
  },
  skyChip: {
    backgroundColor: AppColors.blueSurface,
  },
  amberChip: {
    backgroundColor: AppColors.goldSurface,
  },
  redChip: {
    backgroundColor: AppColors.redSurface,
  },
  statValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: AppColors.text,
  },
  statLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: AppColors.mutedText,
  },
  progressTrack: {
    width: '100%',
    height: 16,
    borderRadius: AppRadii.pill,
    backgroundColor: '#11151E',
    borderWidth: 2,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  progressFillWrap: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: AppRadii.pill,
  },
  progressFill: {
    height: '100%',
    borderRadius: AppRadii.pill,
  },
  shieldGroup: {
    gap: 8,
  },
  shieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  shieldTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: AppColors.text,
  },
  shieldStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppRadii.pill,
    borderWidth: 2,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    overflow: 'hidden',
  },
  shieldStatusSafe: {
    backgroundColor: AppColors.successSurface,
    color: AppColors.text,
    borderColor: AppColors.border,
  },
  shieldStatusCritical: {
    backgroundColor: AppColors.redSurface,
    color: AppColors.text,
    borderColor: AppColors.border,
  },
  shieldTrack: {
    width: '100%',
    height: 16,
    borderRadius: AppRadii.pill,
    borderWidth: 2,
    borderColor: AppColors.border,
    backgroundColor: '#0D0D11',
    overflow: 'hidden',
  },
  shieldFill: {
    height: '100%',
    borderRadius: AppRadii.pill,
  },
  shieldCaption: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.mutedText,
  },
  emptyState: {
    borderRadius: AppRadii.card,
    padding: 18,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 2,
    borderColor: AppColors.border,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: AppColors.text,
  },
  emptyMessage: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.mutedText,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: AppColors.overlay,
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 3,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 64,
    height: 8,
    borderRadius: AppRadii.pill,
    borderWidth: 2,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceRaised,
  },
  modalTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: AppColors.text,
  },
  modalSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.mutedText,
  },
  modalContent: {
    gap: 10,
  },
  fabContainer: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    zIndex: 20,
  },
  fabShell: {
    position: 'relative',
  },
  fabShadowLayer: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceRaised,
  },
  fabFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    borderWidth: 3,
    borderColor: AppColors.border,
    backgroundColor: AppColors.limeDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 30,
    lineHeight: 32,
    color: AppColors.text,
    textAlign: 'center',
  },
});