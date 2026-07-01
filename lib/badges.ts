import type { BadgeDefinition, BadgeId, GamificationState } from '@/lib/types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'daily-checkin-3',
    title: 'Three-Day Spark',
    description: 'Opened the app three days in a row.',
    color: '#7ccf00',
  },
  {
    id: 'daily-checkin-7',
    title: 'Weekly Rhythm',
    description: 'Kept a seven-day check-in streak alive.',
    color: '#1cb0f6',
  },
  {
    id: 'expense-streak-7',
    title: 'Receipt Ranger',
    description: 'Logged expenses for seven straight days.',
    color: '#ffb020',
  },
  {
    id: 'impulse-defeat-1',
    title: 'First Pause',
    description: 'Deleted one wishlist item instead of buying it.',
    color: '#ff7a59',
  },
  {
    id: 'impulse-defeat-5',
    title: 'Impulse Ninja',
    description: 'Defeated five impulse purchases.',
    color: '#ff4b4b',
  },
];

export function computeEarnedBadgeIds(gamification: GamificationState): BadgeId[] {
  const earnedBadgeIds = new Set<BadgeId>();

  if (gamification.dailyCheckInStreak >= 3) {
    earnedBadgeIds.add('daily-checkin-3');
  }

  if (gamification.dailyCheckInStreak >= 7) {
    earnedBadgeIds.add('daily-checkin-7');
  }

  if (gamification.expenseLoggingStreak >= 7) {
    earnedBadgeIds.add('expense-streak-7');
  }

  if (gamification.impulseDefeats >= 1) {
    earnedBadgeIds.add('impulse-defeat-1');
  }

  if (gamification.impulseDefeats >= 5) {
    earnedBadgeIds.add('impulse-defeat-5');
  }

  return BADGE_DEFINITIONS.filter((badge) => earnedBadgeIds.has(badge.id)).map((badge) => badge.id);
}

export function getBadgeById(id: BadgeId): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === id);
}