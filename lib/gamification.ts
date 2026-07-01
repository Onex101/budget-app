import type { BudgetSnapshot, GamificationState, UserProfile } from '@/lib/types';

const XP_PER_LEVEL = 120;

export function getGamificationXp(gamification: GamificationState): number {
  return (
    gamification.dailyCheckInStreak * 12 +
    gamification.expenseLoggingStreak * 18 +
    gamification.impulseDefeats * 24 +
    gamification.earnedBadgeIds.length * 40
  );
}

export function getGamificationLevel(xpPoints: number): number {
  return Math.max(1, Math.floor(xpPoints / XP_PER_LEVEL) + 1);
}

export function getGamificationLevelProgress(xpPoints: number): number {
  const currentLevel = getGamificationLevel(xpPoints);
  const currentLevelFloor = (currentLevel - 1) * XP_PER_LEVEL;

  return Math.max(0, Math.min(1, (xpPoints - currentLevelFloor) / XP_PER_LEVEL));
}

export function getCycleShieldLoad(snapshot: BudgetSnapshot | null, profile: UserProfile | null): number {
  if (!snapshot || !profile) {
    return 0;
  }

  const cycleCapacity = snapshot.currentCycleOpeningRollover + profile.netPayZar;

  if (cycleCapacity <= 0) {
    return 1;
  }

  const committedAmount = snapshot.totalRecurringPerCycle + snapshot.currentCycleExpensesTotal;

  return Math.max(0, Math.min(1, committedAmount / cycleCapacity));
}