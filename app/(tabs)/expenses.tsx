import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
    AnimatedDeficitWrapper,
    AppScreen,
    BudgetShield,
    EmptyState,
    Field,
    FloatingActionButton,
    FormSheetModal,
    PillButton,
    SectionCard,
    SectionHeading,
    StatChip,
    TactileButton,
} from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { getBudgetSnapshot } from '@/lib/budget';
import { formatDateKey, isDateInRange } from '@/lib/dates';
import { formatCurrency, formatFriendlyDate } from '@/lib/formatters';
import { getCycleShieldLoad } from '@/lib/gamification';
import { fireEntryCreatedHaptic } from '@/lib/haptics';
import { useBudgetStore } from '@/store/useBudgetStore';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, '').trim());
}

export default function ExpensesScreen() {
  const profile = useBudgetStore((state) => state.profile);
  const recurringExpenses = useBudgetStore((state) => state.recurringExpenses);
  const expenses = useBudgetStore((state) => state.expenses);
  const addExpense = useBudgetStore((state) => state.addExpense);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const deleteExpense = useBudgetStore((state) => state.deleteExpense);

  const snapshot = getBudgetSnapshot({ profile, recurringExpenses, expenses });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(formatDateKey(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  if (!profile || !snapshot) {
    return <Redirect href="/onboarding" />;
  }

  const currentCycleEntries = expenses.filter((expense) =>
    isDateInRange(expense.date, snapshot.activeCycleStart, snapshot.activeCycleEnd),
  );
  const cycleShieldLoad = getCycleShieldLoad(snapshot, profile);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setCategory('');
    setDate(formatDateKey(new Date()));
    setError(null);
    setFormVisible(false);
  };

  const handleSubmit = () => {
    const parsedAmount = parseMoney(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid expense amount.');
      return;
    }

    if (!DATE_PATTERN.test(date)) {
      setError('Use the date format YYYY-MM-DD.');
      return;
    }

    if (editingId) {
      updateExpense(editingId, {
        name,
        amountZar: parsedAmount,
        category,
        date,
      });
    } else {
      addExpense({
        name,
        amountZar: parsedAmount,
        category,
        date,
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
          title="Log what actually left"
          caption="Keep the ledger accurate."
        />

        <AnimatedDeficitWrapper isActive={snapshot.isRedZone}>
          <SectionCard accentColor={AppColors.amber} subtitle="Cycle spend and shield." title="Current cycle">
            <View style={styles.statRow}>
              <StatChip label="Cycle total" tone="amber" value={formatCurrency(snapshot.currentCycleExpensesTotal)} />
              <StatChip label="Entries this cycle" tone="sky" value={`${currentCycleEntries.length}`} />
              <StatChip label="Savings bank" tone={snapshot.isRedZone ? 'red' : 'lime'} value={formatCurrency(snapshot.savingsBank)} />
            </View>
            <BudgetShield
              caption={
                cycleShieldLoad >= 0.8
                  ? 'Running hot. Focus essentials.'
                  : 'Healthy. Keep logging.'
              }
              progress={cycleShieldLoad}
              title="Cycle shield"
            />
          </SectionCard>
        </AnimatedDeficitWrapper>

        <SectionCard accentColor={AppColors.limeDark} subtitle="Manual entries are editable." title="Ledger">
          {expenses.length === 0 ? (
            <EmptyState message="Your first expense makes the savings picture real." title="No expenses yet" />
          ) : (
            expenses.map((expense) => {
              const isManual = expense.source === 'manual';

              return (
                <View key={expense.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleBlock}>
                      <Text style={styles.entryTitle}>{expense.name}</Text>
                      <Text style={styles.entryMeta}>
                        {formatFriendlyDate(expense.date)}
                        {expense.category ? ` · ${expense.category}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.entryAmount}>{formatCurrency(expense.amountZar)}</Text>
                  </View>

                  <View style={styles.entryFooter}>
                    <Text style={styles.entrySource}>{isManual ? 'Manual expense' : 'Wishlist purchase'}</Text>
                    {isManual ? (
                      <View style={styles.inlineActions}>
                        <PillButton
                          label="Edit"
                          onPress={() => {
                            setEditingId(expense.id);
                            setName(expense.name);
                            setAmount(expense.amountZar.toString());
                            setCategory(expense.category ?? '');
                            setDate(expense.date);
                            setError(null);
                            setFormVisible(true);
                          }}
                          small
                          fullWidth={false}
                          variant="secondary"
                        />
                        <PillButton label="Delete" onPress={() => deleteExpense(expense.id)} small fullWidth={false} variant="ghost" />
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
          setEditingId(null);
          setName('');
          setAmount('');
          setCategory('');
          setDate(formatDateKey(new Date()));
          setError(null);
          setFormVisible(true);
        }}
      />

      <FormSheetModal
        onClose={() => {
          setFormVisible(false);
          setEditingId(null);
          setError(null);
        }}
        subtitle="Quick spend capture."
        title={editingId ? 'Edit expense' : 'Capture expense'}
        visible={formVisible}>
        <Field label="What was it?" onChangeText={setName} placeholder="Groceries" value={name} />
        <Field keyboardType="decimal-pad" label="Amount (ZAR)" onChangeText={setAmount} placeholder="450" value={amount} />
        <Field label="Category (optional)" onChangeText={setCategory} placeholder="Food" value={category} />
        <Field hint="Use YYYY-MM-DD." label="Date" onChangeText={setDate} placeholder="2026-06-30" value={date} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionRow}>
          <TactileButton fullWidth={false} label={editingId ? 'Save Expense' : 'Log Expense'} onPress={handleSubmit} />
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
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    gap: 12,
    paddingVertical: 14,
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
    gap: 4,
  },
  entryTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: AppColors.text,
  },
  entryMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  entryAmount: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 17,
    color: AppColors.text,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  entrySource: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
});