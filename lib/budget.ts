import { countMonthlyCyclesBetween, formatDateKey, getCycleEndForStart, getCycleStartForDate, isDateInRange } from '@/lib/dates';
import type { BudgetSnapshot, ExpenseEntry, RecurringExpense, UserProfile, WishlistInsight, WishlistItem } from '@/lib/types';

const HOURS_PER_MONTH = 160;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumExpenseAmounts(expenses: ExpenseEntry[]): number {
  return roundMoney(expenses.reduce((total, expense) => total + expense.amountZar, 0));
}

function sumRecurringAmounts(expenses: RecurringExpense[]): number {
  return roundMoney(
    expenses.filter((expense) => expense.isActive).reduce((total, expense) => total + expense.amountZar, 0),
  );
}

export function computeHoursRequired(costZar: number, hourlyRate: number): number {
  if (hourlyRate <= 0) {
    return 0;
  }

  return roundMoney(costZar / hourlyRate);
}

export function getBudgetSnapshot(input: {
  profile: UserProfile | null;
  recurringExpenses: RecurringExpense[];
  expenses: ExpenseEntry[];
  now?: Date;
}): BudgetSnapshot | null {
  const { expenses, profile, recurringExpenses } = input;

  if (!profile) {
    return null;
  }

  const now = input.now ?? new Date();
  const cycleStartDate = getCycleStartForDate(now, profile.paydayDay);
  const cycleEndDate = getCycleEndForStart(cycleStartDate, profile.paydayDay);
  const cycleStartKey = formatDateKey(cycleStartDate);
  const cycleEndKey = formatDateKey(cycleEndDate);
  const activeRecurringTotal = sumRecurringAmounts(recurringExpenses);
  const cyclesCompletedBeforeCurrent = countMonthlyCyclesBetween(profile.cycleAnchorDate, cycleStartKey);
  const expensesSinceAnchor = expenses.filter((expense) => expense.date >= profile.cycleAnchorDate);
  const expensesBeforeCurrentCycle = expensesSinceAnchor.filter((expense) => expense.date < cycleStartKey);
  const currentCycleExpenses = expensesSinceAnchor.filter((expense) =>
    isDateInRange(expense.date, cycleStartKey, cycleEndKey),
  );
  const currentCycleOpeningRollover = roundMoney(
    profile.startingRolloverZar +
      cyclesCompletedBeforeCurrent * profile.netPayZar -
      cyclesCompletedBeforeCurrent * activeRecurringTotal -
      sumExpenseAmounts(expensesBeforeCurrentCycle),
  );
  const currentCycleExpensesTotal = sumExpenseAmounts(currentCycleExpenses);
  const savingsBank = roundMoney(
    currentCycleOpeningRollover + profile.netPayZar - activeRecurringTotal - currentCycleExpensesTotal,
  );

  return {
    hourlyRate: roundMoney(profile.netPayZar / HOURS_PER_MONTH),
    activeCycleStart: cycleStartKey,
    activeCycleEnd: cycleEndKey,
    currentCycleOpeningRollover,
    currentCycleExpensesTotal,
    totalRecurringPerCycle: activeRecurringTotal,
    savingsBank,
    isRedZone: savingsBank < 0,
    totalCyclesTracked: cyclesCompletedBeforeCurrent + 1,
  };
}

export function getWishlistInsight(items: WishlistItem[], snapshot: BudgetSnapshot | null): WishlistInsight {
  const activeItems = items
    .filter((item) => item.status === 'active')
    .sort((left, right) => left.costZar - right.costZar || left.createdAt.localeCompare(right.createdAt));
  const purchasedItems = items
    .filter((item) => item.status === 'purchased')
    .sort((left, right) => (right.purchasedAt ?? '').localeCompare(left.purchasedAt ?? ''));
  const deletedItems = items
    .filter((item) => item.status === 'deleted')
    .sort((left, right) => (right.deletedAt ?? '').localeCompare(left.deletedAt ?? ''));
  const affordableItems =
    snapshot && !snapshot.isRedZone
      ? activeItems.filter((item) => item.costZar <= snapshot.savingsBank)
      : [];
  const nextUnlockItem =
    snapshot && activeItems.length > 0
      ? activeItems.find((item) => item.costZar > Math.max(snapshot.savingsBank, 0)) ?? affordableItems[0]
      : undefined;

  return {
    activeItems,
    purchasedItems,
    deletedItems,
    affordableItems,
    nextUnlockItem,
  };
}

export function getAffordabilityProgress(costZar: number, snapshot: BudgetSnapshot | null): number {
  if (!snapshot || costZar <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, snapshot.savingsBank / costZar));
}