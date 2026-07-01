export type ExpenseSource = 'manual' | 'wishlist_purchase';

export type WishlistStatus = 'active' | 'purchased' | 'deleted';

export type BadgeId =
  | 'daily-checkin-3'
  | 'daily-checkin-7'
  | 'expense-streak-7'
  | 'impulse-defeat-1'
  | 'impulse-defeat-5';

export type AppThemeId = 'arcade-night' | 'mint-graph' | 'sunset-ledger';

export type UserProfile = {
  netPayZar: number;
  paydayDay: number;
  createdAt: string;
  cycleAnchorDate: string;
  startingRolloverZar: number;
};

export type RecurringExpense = {
  id: string;
  name: string;
  amountZar: number;
  isActive: boolean;
};

export type ExpenseEntry = {
  id: string;
  name: string;
  amountZar: number;
  date: string;
  category?: string;
  source: ExpenseSource;
  wishlistItemId?: string;
};

export type WishlistItem = {
  id: string;
  name: string;
  costZar: number;
  url?: string;
  createdAt: string;
  status: WishlistStatus;
  purchasedAt?: string;
  deletedAt?: string;
};

export type GamificationState = {
  lastAppOpenDate?: string;
  lastExpenseLogDate?: string;
  dailyCheckInStreak: number;
  expenseLoggingStreak: number;
  impulseDefeats: number;
  earnedBadgeIds: BadgeId[];
};

export type RecurringExpenseInput = {
  name: string;
  amountZar: number;
};

export type OnboardingPayload = {
  netPayZar: number;
  paydayDay: number;
  recurringExpenses: RecurringExpenseInput[];
  startingRolloverZar?: number;
};

export type ExpenseInput = {
  name: string;
  amountZar: number;
  date?: string;
  category?: string;
};

export type ExpenseUpdate = Partial<ExpenseInput>;

export type WishlistItemInput = {
  name: string;
  costZar: number;
  url?: string;
};

export type WishlistItemUpdate = Partial<WishlistItemInput>;

export type BudgetSnapshot = {
  hourlyRate: number;
  activeCycleStart: string;
  activeCycleEnd: string;
  currentCycleOpeningRollover: number;
  currentCycleExpensesTotal: number;
  totalRecurringPerCycle: number;
  savingsBank: number;
  isRedZone: boolean;
  totalCyclesTracked: number;
};

export type WishlistInsight = {
  activeItems: WishlistItem[];
  purchasedItems: WishlistItem[];
  deletedItems: WishlistItem[];
  affordableItems: WishlistItem[];
  nextUnlockItem?: WishlistItem;
};

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  color: string;
};