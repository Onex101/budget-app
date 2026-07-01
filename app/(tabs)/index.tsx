import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen, BudgetShield, ProgressBar, SectionCard, SectionHeading, StatChip } from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { computeHoursRequired, getAffordabilityProgress, getBudgetSnapshot, getWishlistInsight } from '@/lib/budget';
import { formatCurrency, formatCycleRange, formatHours } from '@/lib/formatters';
import { getCycleShieldLoad, getGamificationLevel, getGamificationLevelProgress, getGamificationXp } from '@/lib/gamification';
import { useBudgetStore } from '@/store/useBudgetStore';

export default function DashboardScreen() {
  const profile = useBudgetStore((state) => state.profile);
  const recurringExpenses = useBudgetStore((state) => state.recurringExpenses);
  const expenses = useBudgetStore((state) => state.expenses);
  const wishlistItems = useBudgetStore((state) => state.wishlistItems);
  const gamification = useBudgetStore((state) => state.gamification);

  const snapshot = getBudgetSnapshot({ profile, recurringExpenses, expenses });

  if (!profile || !snapshot) {
    return <Redirect href="/onboarding" />;
  }

  const insight = getWishlistInsight(wishlistItems, snapshot);
  const highlightItem = insight.affordableItems[0] ?? insight.nextUnlockItem;
  const remainingAmount = highlightItem ? Math.max(0, highlightItem.costZar - snapshot.savingsBank) : 0;
  const highlightProgress = highlightItem ? getAffordabilityProgress(highlightItem.costZar, snapshot) : 0;
  const cycleShieldLoad = getCycleShieldLoad(snapshot, profile);
  const xpPoints = getGamificationXp(gamification);
  const xpLevel = getGamificationLevel(xpPoints);
  const xpLevelProgress = getGamificationLevelProgress(xpPoints);
  const visibleStreak = Math.max(gamification.dailyCheckInStreak, gamification.expenseLoggingStreak);

  return (
    <AppScreen>
      <SectionHeading
        eyebrow="Dashboard"
        title="Budget Buddy"
        caption="Track cash, hours, and momentum."
      />

      <View style={styles.statusBannerRow}>
        <Text style={[styles.statusBanner, styles.statusBannerBlue]}>{`${xpPoints} XP`}</Text>
        <Text style={[styles.statusBanner, styles.statusBannerGold]}>{`Level ${xpLevel}`}</Text>
        <Text style={[styles.statusBanner, styles.statusBannerOrange]}>{`${visibleStreak} day streak`}</Text>
      </View>

      <SectionCard
        accentColor={snapshot.isRedZone ? AppColors.red : AppColors.limeDark}
        style={styles.heroCard}
        subtitle={snapshot.isRedZone ? 'Red Zone: wishlist buying is locked.' : 'In the green. Spend deliberately.'}
        title="Savings Bank">
        <Text style={[styles.heroValue, snapshot.isRedZone && styles.heroValueRed]}>{formatCurrency(snapshot.savingsBank)}</Text>
        <Text style={styles.heroCaption}>{formatCycleRange(snapshot.activeCycleStart, snapshot.activeCycleEnd)}</Text>

        <BudgetShield
          caption={
            cycleShieldLoad >= 0.8
              ? 'Commitments are high. Slow new spending.'
              : 'Shield healthy. Keep logging spends.'
          }
          progress={cycleShieldLoad}
          title="Cycle shield"
        />

        <View style={styles.statRow}>
          <StatChip label="Hourly rate" tone="sky" value={formatCurrency(snapshot.hourlyRate)} />
          <StatChip label="Recurring" tone="amber" value={formatCurrency(snapshot.totalRecurringPerCycle)} />
          <StatChip label="Expenses" tone={snapshot.isRedZone ? 'red' : 'lime'} value={formatCurrency(snapshot.currentCycleExpensesTotal)} />
        </View>
      </SectionCard>

      <SectionCard
        accentColor={AppColors.sky}
        subtitle="Closest item to unlock."
        title="Closest Unlock">
        {highlightItem ? (
          <View style={styles.blockGap}>
            <View style={styles.inlineHeader}>
              <View style={styles.titleGroup}>
                <Text style={styles.cardHeadline}>{highlightItem.name}</Text>
                <Text style={styles.cardSubline}>{formatCurrency(highlightItem.costZar)} · {formatHours(computeHoursRequired(highlightItem.costZar, snapshot.hourlyRate))}</Text>
              </View>
              <Text style={styles.chipText}>{insight.affordableItems.some((item) => item.id === highlightItem.id) ? 'Ready now' : 'Still earning'}</Text>
            </View>

            <ProgressBar progress={highlightProgress} />
            <Text style={styles.supportCopy}>
              {insight.affordableItems.some((item) => item.id === highlightItem.id)
                ? 'Unlocked. Buy now or keep building cushion.'
                : `${formatCurrency(remainingAmount)} to go before this one is unlocked.`}
            </Text>
          </View>
        ) : (
          <Text style={styles.supportCopy}>Add a wishlist item to start tracking unlocks.</Text>
        )}
      </SectionCard>

      <SectionCard accentColor={AppColors.amber} subtitle="Consistency beats perfection." title="Consistency Wins">
        <View style={styles.blockGap}>
          <View style={styles.levelHeader}>
            <Text style={styles.cardHeadline}>{`Level ${xpLevel}`}</Text>
            <Text style={styles.cardSubline}>{`${xpPoints} XP banked`}</Text>
          </View>
          <ProgressBar progress={xpLevelProgress} />
        </View>
        <View style={styles.statRow}>
          <StatChip label="Check-in streak" tone="lime" value={`${gamification.dailyCheckInStreak} days`} />
          <StatChip label="Expense streak" tone="amber" value={`${gamification.expenseLoggingStreak} days`} />
          <StatChip label="Impulse defeats" tone="red" value={`${gamification.impulseDefeats}`} />
        </View>
        <View style={styles.quickRow}>
          <Text style={styles.summaryPill}>{`Unlocked items: ${insight.affordableItems.length}`}</Text>
          <Text style={styles.summaryPill}>{`Badges: ${gamification.earnedBadgeIds.length}`}</Text>
          <Text style={styles.summaryPill}>{`Trophies: ${insight.purchasedItems.length}`}</Text>
        </View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusBannerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: AppColors.border,
    color: AppColors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    overflow: 'hidden',
  },
  statusBannerBlue: {
    backgroundColor: AppColors.blueSurface,
  },
  statusBannerGold: {
    backgroundColor: AppColors.goldSurface,
  },
  statusBannerOrange: {
    backgroundColor: '#3B2414',
  },
  heroCard: {
    gap: 12,
  },
  heroValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 40,
    color: AppColors.text,
  },
  heroValueRed: {
    color: AppColors.red,
  },
  heroCaption: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: AppColors.mutedText,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  blockGap: {
    gap: 12,
  },
  levelHeader: {
    gap: 4,
  },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    gap: 4,
  },
  cardHeadline: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: AppColors.text,
  },
  cardSubline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: AppColors.mutedText,
  },
  chipText: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.successSurface,
    color: AppColors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
  },
  supportCopy: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.mutedText,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 1,
    borderColor: AppColors.border,
    color: AppColors.text,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
});
