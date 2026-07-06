import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  BudgetShield,
  Field,
  FloatingActionButton,
  FormSheetModal,
  PillButton,
  ProgressBar,
  SectionCard,
  SectionHeading,
  TactileButton,
} from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { computeHoursRequired, getAffordabilityProgress, getBudgetSnapshot, getWishlistInsight } from '@/lib/budget';
import { formatDateKey } from '@/lib/dates';
import { formatCurrency, formatCycleRange, formatHours } from '@/lib/formatters';
import { getCycleShieldLoad } from '@/lib/gamification';
import { fireEntryCreatedHaptic } from '@/lib/haptics';
import { useBudgetStore } from '@/store/useBudgetStore';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, '').trim());
}

function normalizeUrl(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

type QuickExpenseFormValues = {
  name: string;
  amount: string;
  category: string;
  date: string;
};

export default function DashboardScreen() {
  const profile = useBudgetStore((state) => state.profile);
  const recurringExpenses = useBudgetStore((state) => state.recurringExpenses);
  const expenses = useBudgetStore((state) => state.expenses);
  const wishlistItems = useBudgetStore((state) => state.wishlistItems);
  const addExpense = useBudgetStore((state) => state.addExpense);
  const addWishlistItem = useBudgetStore((state) => state.addWishlistItem);

  const [formVisible, setFormVisible] = useState(false);
  const [wishFormVisible, setWishFormVisible] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickExpenseFormValues>({
    defaultValues: {
      name: '',
      amount: '',
      category: '',
      date: formatDateKey(new Date()),
    },
  });
  const {
    control: wishControl,
    handleSubmit: handleWishSubmit,
    reset: resetWish,
    formState: { errors: wishErrors },
  } = useForm<{ name: string; cost: string; url: string }>({
    defaultValues: {
      name: '',
      cost: '',
      url: '',
    },
  });

  const snapshot = getBudgetSnapshot({ profile, recurringExpenses, expenses });

  if (!profile || !snapshot) {
    return <Redirect href="/onboarding" />;
  }

  const insight = getWishlistInsight(wishlistItems, snapshot);
  const highlightItem = insight.affordableItems[0] ?? insight.nextUnlockItem;
  const remainingAmount = highlightItem ? Math.max(0, highlightItem.costZar - snapshot.savingsBank) : 0;
  const highlightProgress = highlightItem ? getAffordabilityProgress(highlightItem.costZar, snapshot) : 0;
  const cycleShieldLoad = getCycleShieldLoad(snapshot, profile);
  const isPressureHigh = cycleShieldLoad >= 0.8;

  const resetExpenseForm = () => {
    reset({
      name: '',
      amount: '',
      category: '',
      date: formatDateKey(new Date()),
    });
    setFormVisible(false);
  };

  const handleQuickExpenseSubmit = (values: QuickExpenseFormValues) => {
    const parsedAmount = parseMoney(values.amount);

    addExpense({
      name: values.name,
      amountZar: parsedAmount,
      category: values.category,
      date: values.date,
    });

    void fireEntryCreatedHaptic();
    resetExpenseForm();
  };

  const resetWishForm = () => {
    resetWish({
      name: '',
      cost: '',
      url: '',
    });
    setWishFormVisible(false);
  };

  const handleQuickWishSubmit = (values: { name: string; cost: string; url: string }) => {
    const parsedCost = parseMoney(values.cost);

    addWishlistItem({
      name: values.name,
      costZar: parsedCost,
      url: normalizeUrl(values.url),
    });

    resetWishForm();
  };

  return (
    <View style={styles.root}>
      <AppScreen>
        <SectionHeading title="Dashboard" caption="Check bank, then take one action." />

        <SectionCard
          accentColor={snapshot.isRedZone ? AppColors.red : AppColors.limeDark}
          style={styles.heroCard}
          subtitle={
            snapshot.isRedZone
              ? 'Red Zone active. Log essentials first.'
              : isPressureHigh
                ? 'Cycle pressure is high. Log essentials first.'
                : 'Healthy cycle. Capture spend and keep momentum.'
          }
          title="Savings Bank">
          <Text style={[styles.heroValue, snapshot.isRedZone && styles.heroValueRed]}>{formatCurrency(snapshot.savingsBank)}</Text>
          <Text style={styles.heroCaption}>{formatCycleRange(snapshot.activeCycleStart, snapshot.activeCycleEnd)}</Text>

          <BudgetShield
            caption={
              snapshot.isRedZone
                ? 'Red Zone active. Reduce non-essential spend.'
                : isPressureHigh
                  ? 'Spending pressure is high.'
                : 'Shield stable this cycle.'
            }
            progress={cycleShieldLoad}
            title="Cycle shield"
          />
        </SectionCard>

        <SectionCard
          accentColor={AppColors.sky}
          subtitle="One next move."
          title="Next Best Action">
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
                  ? 'Unlocked now. Buy it or keep buffering.'
                  : `${formatCurrency(remainingAmount)} to unlock.`}
              </Text>
              <View style={styles.secondaryCtaRow}>
                <PillButton
                  fullWidth={false}
                  label="Add Wish"
                  onPress={() => {
                    resetWish({
                      name: '',
                      cost: '',
                      url: '',
                    });
                    setWishFormVisible(true);
                  }}
                  small
                  variant="secondary"
                />
              </View>
            </View>
          ) : (
            <View style={styles.blockGap}>
              <Text style={styles.supportCopy}>Add one wish to start planning unlocks.</Text>
              <View style={styles.secondaryCtaRow}>
                <PillButton
                  fullWidth={false}
                  label="Add Wish"
                  onPress={() => {
                    resetWish({
                      name: '',
                      cost: '',
                      url: '',
                    });
                    setWishFormVisible(true);
                  }}
                  small
                  variant="secondary"
                />
              </View>
            </View>
          )}
        </SectionCard>
      </AppScreen>

      <FloatingActionButton
        label="+"
        onPress={() => {
          reset({
            name: '',
            amount: '',
            category: '',
            date: formatDateKey(new Date()),
          });
          setFormVisible(true);
        }}
      />

      <FormSheetModal
        onClose={() => {
          resetExpenseForm();
        }}
        subtitle="Quick spend capture."
        title="Add expense"
        visible={formVisible}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Field label="What was it?" onChangeText={onChange} placeholder="Groceries" value={value} />
          )}
        />
        <Controller
          control={control}
          name="amount"
          rules={{
            validate: (value) => {
              const parsed = parseMoney(value);
              return Number.isFinite(parsed) && parsed > 0 ? true : 'Enter a valid expense amount.';
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Field keyboardType="decimal-pad" label="Amount (ZAR)" onChangeText={onChange} placeholder="450" value={value} />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <Field label="Category (optional)" onChangeText={onChange} placeholder="Food" value={value} />
          )}
        />
        <Controller
          control={control}
          name="date"
          rules={{
            validate: (value) => (DATE_PATTERN.test(value) ? true : 'Use the date format YYYY-MM-DD.'),
          }}
          render={({ field: { onChange, value } }) => (
            <Field hint="Use YYYY-MM-DD." label="Date" onChangeText={onChange} placeholder="2026-06-30" value={value} />
          )}
        />
        {errors.amount ? <Text style={styles.errorText}>{errors.amount.message}</Text> : null}
        {!errors.amount && errors.date ? <Text style={styles.errorText}>{errors.date.message}</Text> : null}
        <View style={styles.actionRow}>
          <TactileButton fullWidth={false} label="Add Expense" onPress={handleSubmit(handleQuickExpenseSubmit)} />
          <PillButton fullWidth={false} label="Cancel" onPress={resetExpenseForm} variant="ghost" />
        </View>
      </FormSheetModal>

      <FormSheetModal
        onClose={() => {
          resetWishForm();
        }}
        subtitle="Quick wishlist capture."
        title="Add wish"
        visible={wishFormVisible}>
        <Controller
          control={wishControl}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Field label="Item name" onChangeText={onChange} placeholder="Noise-cancelling headphones" value={value} />
          )}
        />
        <Controller
          control={wishControl}
          name="cost"
          rules={{
            validate: (value) => {
              const parsed = parseMoney(value);
              return Number.isFinite(parsed) && parsed > 0 ? true : 'Enter a valid wishlist cost.';
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Field keyboardType="decimal-pad" label="Cost (ZAR)" onChangeText={onChange} placeholder="3499" value={value} />
          )}
        />
        <Controller
          control={wishControl}
          name="url"
          render={({ field: { onChange, value } }) => (
            <Field label="URL (optional)" onChangeText={onChange} placeholder="https://store.example/item" value={value} />
          )}
        />
        {wishErrors.cost ? <Text style={styles.errorText}>{wishErrors.cost.message}</Text> : null}
        <View style={styles.actionRow}>
          <TactileButton fullWidth={false} label="Add Wish" onPress={handleWishSubmit(handleQuickWishSubmit)} />
          <PillButton fullWidth={false} label="Cancel" onPress={resetWishForm} variant="ghost" />
        </View>
      </FormSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroCard: {
    gap: 10,
  },
  heroValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 34,
    color: AppColors.text,
  },
  heroValueRed: {
    color: AppColors.red,
  },
  heroCaption: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  blockGap: {
    gap: 10,
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
    fontSize: 18,
    color: AppColors.text,
  },
  cardSubline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
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
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.mutedText,
  },
  secondaryCtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: AppColors.red,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
});
