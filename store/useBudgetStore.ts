import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { computeEarnedBadgeIds } from '@/lib/badges';
import { getBudgetSnapshot, roundMoney } from '@/lib/budget';
import { clampPaydayDay, formatDateKey, getCycleStartForDate, isConsecutiveDate } from '@/lib/dates';
import type {
    AppThemeId,
    ExpenseEntry,
    ExpenseInput,
    ExpenseUpdate,
    GamificationState,
    OnboardingPayload,
    RecurringExpense,
    RecurringExpenseInput,
    UserProfile,
    WishlistItem,
    WishlistItemInput,
    WishlistItemUpdate,
} from '@/lib/types';

type BudgetStoreState = {
  hasHydrated: boolean;
  profile: UserProfile | null;
  recurringExpenses: RecurringExpense[];
  expenses: ExpenseEntry[];
  wishlistItems: WishlistItem[];
  gamification: GamificationState;
  appTheme: AppThemeId;
};

type BudgetStoreActions = {
  setHasHydrated: (value: boolean) => void;
  setAppTheme: (theme: AppThemeId) => void;
  registerAppOpen: (date?: string) => void;
  completeOnboarding: (payload: OnboardingPayload) => void;
  updateProfile: (profilePatch: Partial<Pick<UserProfile, 'netPayZar' | 'paydayDay' | 'startingRolloverZar'>>) => void;
  replaceRecurringExpenses: (inputs: RecurringExpenseInput[]) => void;
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, patch: ExpenseUpdate) => void;
  deleteExpense: (id: string) => void;
  addWishlistItem: (input: WishlistItemInput) => void;
  updateWishlistItem: (id: string, patch: WishlistItemUpdate) => void;
  deleteWishlistItem: (id: string) => void;
  purchaseWishlistItem: (id: string) => void;
  resetAllData: () => void;
};

export type BudgetStore = BudgetStoreState & BudgetStoreActions;

const initialGamification: GamificationState = {
  dailyCheckInStreak: 0,
  expenseLoggingStreak: 0,
  impulseDefeats: 0,
  earnedBadgeIds: [],
};

function makeId(prefix: string): string {
  return [prefix, Date.now().toString(36), Math.random().toString(36).slice(2, 8)].join('_');
}

function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return roundMoney(Math.max(0, value));
}

function normalizeRecurringExpenses(inputs: RecurringExpenseInput[]): RecurringExpense[] {
  return inputs
    .map((expense) => ({
      id: makeId('recurring'),
      name: expense.name.trim(),
      amountZar: normalizeMoney(expense.amountZar),
      isActive: true,
    }))
    .filter((expense) => expense.name.length > 0 && expense.amountZar > 0);
}

function enrichGamificationState(gamification: GamificationState): GamificationState {
  return {
    ...gamification,
    earnedBadgeIds: computeEarnedBadgeIds(gamification),
  };
}

function updateDailyCheckIn(gamification: GamificationState, date: string): GamificationState {
  if (gamification.lastAppOpenDate === date) {
    return gamification;
  }

  const dailyCheckInStreak = gamification.lastAppOpenDate
    ? isConsecutiveDate(gamification.lastAppOpenDate, date)
      ? gamification.dailyCheckInStreak + 1
      : 1
    : 1;

  return enrichGamificationState({
    ...gamification,
    lastAppOpenDate: date,
    dailyCheckInStreak,
  });
}

function updateExpenseLoggingStreak(gamification: GamificationState, date: string): GamificationState {
  if (gamification.lastExpenseLogDate === date) {
    return gamification;
  }

  const expenseLoggingStreak = gamification.lastExpenseLogDate
    ? isConsecutiveDate(gamification.lastExpenseLogDate, date)
      ? gamification.expenseLoggingStreak + 1
      : 1
    : 1;

  return enrichGamificationState({
    ...gamification,
    lastExpenseLogDate: date,
    expenseLoggingStreak,
  });
}

function sortEntriesByDateDescending<T extends { date?: string; createdAt?: string; purchasedAt?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftKey = left.date ?? left.purchasedAt ?? left.createdAt ?? '';
    const rightKey = right.date ?? right.purchasedAt ?? right.createdAt ?? '';

    return rightKey.localeCompare(leftKey);
  });
}

const initialState: BudgetStoreState = {
  hasHydrated: false,
  profile: null,
  recurringExpenses: [],
  expenses: [],
  wishlistItems: [],
  gamification: initialGamification,
  appTheme: 'arcade-night',
};

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
      setAppTheme: (theme) => {
        set({ appTheme: theme });
      },
      registerAppOpen: (date) => {
        const today = date ?? formatDateKey(new Date());

        set((state) => ({
          gamification: updateDailyCheckIn(state.gamification, today),
        }));
      },
      completeOnboarding: (payload) => {
        const now = new Date();
        const paydayDay = clampPaydayDay(payload.paydayDay);
        const today = formatDateKey(now);
        const profile: UserProfile = {
          netPayZar: normalizeMoney(payload.netPayZar),
          paydayDay,
          createdAt: today,
          cycleAnchorDate: formatDateKey(getCycleStartForDate(now, paydayDay)),
          startingRolloverZar: normalizeMoney(payload.startingRolloverZar ?? 0),
        };

        set(() => ({
          profile,
          recurringExpenses: normalizeRecurringExpenses(payload.recurringExpenses),
          gamification: updateDailyCheckIn(initialGamification, today),
        }));
      },
      updateProfile: (profilePatch) => {
        set((state) => {
          if (!state.profile) {
            return state;
          }

          return {
            profile: {
              ...state.profile,
              ...profilePatch,
              paydayDay: profilePatch.paydayDay
                ? clampPaydayDay(profilePatch.paydayDay)
                : state.profile.paydayDay,
              netPayZar:
                profilePatch.netPayZar === undefined
                  ? state.profile.netPayZar
                  : normalizeMoney(profilePatch.netPayZar),
              startingRolloverZar:
                profilePatch.startingRolloverZar === undefined
                  ? state.profile.startingRolloverZar
                  : normalizeMoney(profilePatch.startingRolloverZar),
            },
          };
        });
      },
      replaceRecurringExpenses: (inputs) => {
        set({ recurringExpenses: normalizeRecurringExpenses(inputs) });
      },
      addExpense: (input) => {
        const date = input.date ?? formatDateKey(new Date());
        const expense: ExpenseEntry = {
          id: makeId('expense'),
          name: input.name.trim() || 'Expense',
          amountZar: normalizeMoney(input.amountZar),
          date,
          category: input.category?.trim() || undefined,
          source: 'manual',
        };

        if (expense.amountZar <= 0) {
          return;
        }

        set((state) => ({
          expenses: sortEntriesByDateDescending([expense, ...state.expenses]),
          gamification: updateExpenseLoggingStreak(state.gamification, date),
        }));
      },
      updateExpense: (id, patch) => {
        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.id !== id) {
              return expense;
            }

            return {
              ...expense,
              name: patch.name === undefined ? expense.name : patch.name.trim() || expense.name,
              amountZar:
                patch.amountZar === undefined ? expense.amountZar : normalizeMoney(patch.amountZar),
              date: patch.date ?? expense.date,
              category: patch.category === undefined ? expense.category : patch.category.trim() || undefined,
            };
          }),
        }));
      },
      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },
      addWishlistItem: (input) => {
        const item: WishlistItem = {
          id: makeId('wish'),
          name: input.name.trim() || 'Wishlist Item',
          costZar: normalizeMoney(input.costZar),
          url: input.url?.trim() || undefined,
          createdAt: formatDateKey(new Date()),
          status: 'active',
        };

        if (item.costZar <= 0) {
          return;
        }

        set((state) => ({
          wishlistItems: sortEntriesByDateDescending([item, ...state.wishlistItems]),
        }));
      },
      updateWishlistItem: (id, patch) => {
        set((state) => ({
          wishlistItems: state.wishlistItems.map((item) => {
            if (item.id !== id || item.status !== 'active') {
              return item;
            }

            return {
              ...item,
              name: patch.name === undefined ? item.name : patch.name.trim() || item.name,
              costZar: patch.costZar === undefined ? item.costZar : normalizeMoney(patch.costZar),
              url: patch.url === undefined ? item.url : patch.url.trim() || undefined,
            };
          }),
        }));
      },
      deleteWishlistItem: (id) => {
        set((state) => {
          let didDefeatImpulse = false;

          const wishlistItems = state.wishlistItems.map((item) => {
            if (item.id !== id || item.status !== 'active') {
              return item;
            }

            didDefeatImpulse = true;

            return {
              ...item,
              status: 'deleted' as const,
              deletedAt: formatDateKey(new Date()),
            };
          });

          return {
            wishlistItems,
            gamification: didDefeatImpulse
              ? enrichGamificationState({
                  ...state.gamification,
                  impulseDefeats: state.gamification.impulseDefeats + 1,
                })
              : state.gamification,
          };
        });
      },
      purchaseWishlistItem: (id) => {
        set((state) => {
          const item = state.wishlistItems.find((entry) => entry.id === id && entry.status === 'active');
          const snapshot = getBudgetSnapshot({
            profile: state.profile,
            recurringExpenses: state.recurringExpenses,
            expenses: state.expenses,
          });

          if (!item || !snapshot || snapshot.isRedZone || snapshot.savingsBank < item.costZar) {
            return state;
          }

          const purchasedAt = formatDateKey(new Date());
          const purchaseExpense: ExpenseEntry = {
            id: makeId('expense'),
            name: item.name,
            amountZar: item.costZar,
            date: purchasedAt,
            category: 'Wishlist',
            source: 'wishlist_purchase',
            wishlistItemId: item.id,
          };

          return {
            wishlistItems: state.wishlistItems.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    status: 'purchased' as const,
                    purchasedAt,
                  }
                : entry,
            ),
            expenses: sortEntriesByDateDescending([purchaseExpense, ...state.expenses]),
            gamification: updateExpenseLoggingStreak(state.gamification, purchasedAt),
          };
        });
      },
      resetAllData: () => {
        set({
          ...initialState,
          hasHydrated: true,
        });
      },
    }),
    {
      name: 'budget-wishlist-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        recurringExpenses: state.recurringExpenses,
        expenses: state.expenses,
        wishlistItems: state.wishlistItems,
        gamification: state.gamification,
        appTheme: state.appTheme,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.registerAppOpen();
      },
    },
  ),
);