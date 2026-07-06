import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen, EmptyState, SectionCard, SectionHeading, StatChip } from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import { computeHoursRequired, getBudgetSnapshot, getWishlistInsight } from '@/lib/budget';
import { formatCurrency, formatFriendlyDate, formatHours } from '@/lib/formatters';
import { useBudgetStore } from '@/store/useBudgetStore';

export default function WinsScreen() {
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
  const earnedBadges = BADGE_DEFINITIONS.filter((badge) => gamification.earnedBadgeIds.includes(badge.id));

  return (
    <AppScreen>
      <SectionHeading
        eyebrow="Wins"
        title="Proof that the plan is working"
        caption="Review progress and keep momentum high."
      />

      <SectionCard accentColor={AppColors.limeDark} subtitle="Scan your progress in one glance." title="Progress summary">
        <View style={styles.statRow}>
          <StatChip label="Badges" tone="sky" value={`${earnedBadges.length}`} />
          <StatChip label="Trophies" tone="amber" value={`${insight.purchasedItems.length}`} />
          <StatChip label="Impulse defeats" tone="red" value={`${gamification.impulseDefeats}`} />
        </View>
      </SectionCard>

      <SectionCard accentColor={AppColors.sky} subtitle="Habit milestones." title="Earned badges">
        {earnedBadges.length === 0 ? (
          <EmptyState message="Keep checking in and logging." title="No badges yet" />
        ) : (
          earnedBadges.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
              <View style={styles.badgeContent}>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard accentColor={AppColors.amber} subtitle="Purchased wishlist items." title="Trophy shelf">
        {insight.purchasedItems.length === 0 ? (
          <EmptyState message="Purchased wishlist items appear here." title="No trophies yet" />
        ) : (
          insight.purchasedItems.map((item) => (
            <View key={item.id} style={styles.trophyCard}>
              <View style={styles.trophyHeader}>
                <View style={styles.badgeContent}>
                  <Text style={styles.badgeTitle}>{item.name}</Text>
                  <Text style={styles.badgeDescription}>{formatFriendlyDate(item.purchasedAt ?? item.createdAt)}</Text>
                </View>
                <Text style={styles.trophyAmount}>{formatCurrency(item.costZar)}</Text>
              </View>
              <Text style={styles.trophyMeta}>{formatHours(computeHoursRequired(item.costZar, snapshot.hourlyRate))} of work earned this one.</Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard accentColor={AppColors.red} subtitle="Deleted wishes." title="Impulse victories">
        {insight.deletedItems.length === 0 ? (
          <EmptyState message="Delete a wish to record your first impulse win." title="No impulse defeats yet" />
        ) : (
          insight.deletedItems.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.deletedCard}>
              <Text style={styles.badgeTitle}>{item.name}</Text>
              <Text style={styles.badgeDescription}>Removed {formatFriendlyDate(item.deletedAt ?? item.createdAt)}</Text>
            </View>
          ))
        )}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  badgeDot: {
    width: 18,
    height: 18,
    marginTop: 4,
    borderRadius: 999,
  },
  badgeContent: {
    flex: 1,
    gap: 4,
  },
  badgeTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: AppColors.text,
  },
  badgeDescription: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.mutedText,
  },
  trophyCard: {
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  trophyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  trophyAmount: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 17,
    color: AppColors.text,
  },
  trophyMeta: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  deletedCard: {
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
});