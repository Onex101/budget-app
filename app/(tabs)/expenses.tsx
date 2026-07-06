import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  EmptyState,
  Field,
  FloatingActionButton,
  FormSheetModal,
  PillButton,
  SectionCard,
  SectionHeading,
  TactileButton
} from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { getBudgetSnapshot } from '@/lib/budget';
import { formatDateKey, isDateInRange } from '@/lib/dates';
import { formatCurrency, formatFriendlyDate } from '@/lib/formatters';
import { fireEntryCreatedHaptic } from '@/lib/haptics';
import { useBudgetStore } from '@/store/useBudgetStore';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, '').trim());
}

type ExpenseFormValues = {
  name: string;
  amount: string;
  category: string;
  date: string;
};

export default function ExpensesScreen() {
  const profile = useBudgetStore((state) => state.profile);
  const recurringExpenses = useBudgetStore((state) => state.recurringExpenses);
  const expenses = useBudgetStore((state) => state.expenses);
  const addExpense = useBudgetStore((state) => state.addExpense);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const deleteExpense = useBudgetStore((state) => state.deleteExpense);

  const snapshot = getBudgetSnapshot({ profile, recurringExpenses, expenses });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      name: '',
      amount: '',
      category: '',
      date: formatDateKey(new Date()),
    },
  });

  if (!profile || !snapshot) {
    return <Redirect href="/onboarding" />;
  }

  const currentCycleEntries = expenses.filter((expense) =>
    isDateInRange(expense.date, snapshot.activeCycleStart, snapshot.activeCycleEnd),
  );

  const resetForm = () => {
    setEditingId(null);
    reset({
      name: '',
      amount: '',
      category: '',
      date: formatDateKey(new Date()),
    });
    setFormVisible(false);
  };

  const onSubmitForm = (values: ExpenseFormValues) => {
    const parsedAmount = parseMoney(values.amount);

    if (editingId) {
      updateExpense(editingId, {
        name: values.name,
        amountZar: parsedAmount,
        category: values.category,
        date: values.date,
      });
    } else {
      addExpense({
        name: values.name,
        amountZar: parsedAmount,
        category: values.category,
        date: values.date,
      });

      void fireEntryCreatedHaptic();
    }

    resetForm();
  };

  return (
    <View style={styles.root}>
      <AppScreen>
        <SectionHeading
          eyebrow="Expenses"
          title="Expense ledger"
          caption="Log every spend quickly and move on."
        />

        <View style={styles.summaryStrip}>
          <Text style={styles.summaryText}>{`${formatCurrency(snapshot.currentCycleExpensesTotal)} this cycle`}</Text>
          <Text style={styles.summaryDot}>•</Text>
          <Text style={styles.summaryText}>{`${currentCycleEntries.length} entries`}</Text>
        </View>

        <SectionCard accentColor={AppColors.limeDark} subtitle="Latest entries first." title="Ledger">
          {expenses.length === 0 ? (
            <EmptyState message="Your first expense makes the savings picture real." title="No expenses yet" />
          ) : (
            expenses.map((expense) => {
              const isManual = expense.source === 'manual';
              const sourceLabel = isManual ? 'Manual' : 'Wishlist';

              return (
                <View key={expense.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleBlock}>
                      <Text style={styles.entryTitle}>{expense.name}</Text>
                      <Text style={styles.entryMeta}>{`${formatFriendlyDate(expense.date)}${expense.category ? ` · ${expense.category}` : ''} · ${sourceLabel}`}</Text>
                    </View>
                    <Text style={styles.entryAmount}>{formatCurrency(expense.amountZar)}</Text>
                  </View>

                  <View style={styles.entryFooter}>
                    {isManual ? (
                      <View style={styles.inlineActions}>
                        <PillButton
                          label="Manage"
                          onPress={() => {
                            setEditingId(expense.id);
                            reset({
                              name: expense.name,
                              amount: expense.amountZar.toString(),
                              category: expense.category ?? '',
                              date: expense.date,
                            });
                            setFormVisible(true);
                          }}
                          small
                          fullWidth={false}
                          variant="secondary"
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>

      </AppScreen>

      <FloatingActionButton
        label="+"
        onPress={() => {
          resetForm();
          setFormVisible(true);
        }}
      />

      <FormSheetModal
        onClose={() => {
          resetForm();
        }}
        subtitle="Quick spend capture."
        title={editingId ? 'Edit expense' : 'Add expense'}
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
          <TactileButton fullWidth={false} label={editingId ? 'Save' : 'Add'} onPress={handleSubmit(onSubmitForm)} />
          {editingId ? (
            <PillButton
              fullWidth={false}
              label="Delete"
              onPress={() => {
                deleteExpense(editingId);
                resetForm();
              }}
              variant="danger"
            />
          ) : null}
          <PillButton fullWidth={false} label="Cancel" onPress={resetForm} variant="ghost" />
        </View>
      </FormSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 999,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.surfaceMuted,
  },
  summaryText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: AppColors.mutedText,
  },
  summaryDot: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 10,
    color: AppColors.mutedText,
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
  entryCard: {
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryTitleBlock: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
    color: AppColors.text,
  },
  entryMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: AppColors.mutedText,
  },
  entryAmount: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    color: AppColors.text,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
});