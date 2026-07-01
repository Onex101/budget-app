import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen, Field, PillButton, SectionCard, SectionHeading, StatChip } from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { useBudgetStore } from '@/store/useBudgetStore';

type RecurringDraft = {
  id: string;
  name: string;
  amount: string;
};

function makeDraft(name = ''): RecurringDraft {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name,
    amount: '',
  };
}

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, '').trim());
}

export default function OnboardingScreen() {
  const hasHydrated = useBudgetStore((state) => state.hasHydrated);
  const profile = useBudgetStore((state) => state.profile);
  const completeOnboarding = useBudgetStore((state) => state.completeOnboarding);

  const [netPay, setNetPay] = useState('');
  const [paydayDay, setPaydayDay] = useState('25');
  const [startingRollover, setStartingRollover] = useState('0');
  const [recurringDrafts, setRecurringDrafts] = useState<RecurringDraft[]>([
    makeDraft('Rent'),
    makeDraft('Transport'),
    makeDraft('Internet'),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeRecurringIndex, setActiveRecurringIndex] = useState(0);

  if (!hasHydrated) {
    return null;
  }

  if (profile) {
    return <Redirect href="/(tabs)" />;
  }

  const updateDraft = (id: string, patch: Partial<RecurringDraft>) => {
    setRecurringDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  };

  const removeDraft = (id: string) => {
    setRecurringDrafts((current) => {
      const next = current.filter((draft) => draft.id !== id);
      const safeNext = next.length > 0 ? next : [makeDraft()];
      setActiveRecurringIndex((value) => Math.min(value, safeNext.length - 1));

      return safeNext;
    });
  };

  const addDraft = () => {
    setRecurringDrafts((current) => {
      const next = [...current, makeDraft()];
      setActiveRecurringIndex(next.length - 1);
      return next;
    });
  };

  const totalSteps = 3;
  const isFinalStep = stepIndex === totalSteps - 1;
  const activeRecurringDraft = recurringDrafts[activeRecurringIndex] ?? recurringDrafts[0];

  const handleSubmit = () => {
    const parsedNetPay = parseMoney(netPay);
    const parsedPayday = Number.parseInt(paydayDay, 10);
    const parsedRollover = parseMoney(startingRollover || '0');

    if (!Number.isFinite(parsedNetPay) || parsedNetPay <= 0) {
      setError('Enter a valid monthly net pay in ZAR.');
      return;
    }

    if (!Number.isFinite(parsedPayday) || parsedPayday < 1 || parsedPayday > 31) {
      setError('Choose a payday between 1 and 31.');
      return;
    }

    setError(null);
    completeOnboarding({
      netPayZar: parsedNetPay,
      paydayDay: parsedPayday,
      startingRolloverZar: Number.isFinite(parsedRollover) ? parsedRollover : 0,
      recurringExpenses: recurringDrafts.map((draft) => ({
        name: draft.name,
        amountZar: parseMoney(draft.amount),
      })),
    });
    router.replace('/(tabs)');
  };

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <View style={styles.topBlock}>
        <SectionHeading
          eyebrow={`Start here · Step ${stepIndex + 1} of ${totalSteps}`}
          title="Build your money map"
          caption="Quick setup. No scrolling."
        />

        <View style={styles.stepDots}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View key={index} style={[styles.stepDot, index === stepIndex && styles.stepDotActive]} />
          ))}
        </View>

        {stepIndex === 0 ? (
          <SectionCard
            accentColor={AppColors.limeDark}
            subtitle="Hours-based budgeting with lock rules."
            title="How this works">
            <View style={styles.chipRow}>
              <StatChip label="Currency" tone="sky" value="ZAR" />
              <StatChip label="Working month" tone="amber" value="160 hrs" />
              <StatChip label="Cycle" tone="lime" value="Payday-based" />
            </View>
          </SectionCard>
        ) : null}

        {stepIndex === 1 ? (
          <SectionCard accentColor={AppColors.sky} title="Income and payday">
            <Field keyboardType="decimal-pad" label="Monthly net pay (ZAR)" onChangeText={setNetPay} placeholder="18000" value={netPay} />
            <Field hint="For example, 25 means every cycle begins on the 25th." keyboardType="number-pad" label="Payday day of month" onChangeText={setPaydayDay} placeholder="25" value={paydayDay} />
            <Field hint="Optional cushion or debt carried into the app on day one." keyboardType="decimal-pad" label="Starting rollover (ZAR)" onChangeText={setStartingRollover} placeholder="0" value={startingRollover} />
          </SectionCard>
        ) : null}

        {stepIndex === 2 && activeRecurringDraft ? (
          <SectionCard accentColor={AppColors.amber} title="Recurring monthly costs">
            <Text style={styles.helper}>One item at a time. Leave blank if not needed.</Text>
            <Text style={styles.rowCounter}>{`Item ${activeRecurringIndex + 1} of ${recurringDrafts.length}`}</Text>

            <View style={styles.recurringBlock}>
              <Field
                label="Expense name"
                onChangeText={(value) => updateDraft(activeRecurringDraft.id, { name: value })}
                placeholder="Rent"
                value={activeRecurringDraft.name}
              />
              <Field
                keyboardType="decimal-pad"
                label="Amount (ZAR)"
                onChangeText={(value) => updateDraft(activeRecurringDraft.id, { amount: value })}
                placeholder="6500"
                value={activeRecurringDraft.amount}
              />
            </View>

            <View style={styles.rowActionsWrap}>
              <PillButton
                disabled={activeRecurringIndex === 0}
                fullWidth={false}
                label="Previous"
                onPress={() => setActiveRecurringIndex((value) => Math.max(0, value - 1))}
                small
                variant="ghost"
              />
              <PillButton
                disabled={activeRecurringIndex >= recurringDrafts.length - 1}
                fullWidth={false}
                label="Next"
                onPress={() =>
                  setActiveRecurringIndex((value) => Math.min(recurringDrafts.length - 1, value + 1))
                }
                small
                variant="secondary"
              />
              <PillButton fullWidth={false} label="Add row" onPress={addDraft} small variant="secondary" />
              <PillButton
                fullWidth={false}
                label="Remove"
                onPress={() => removeDraft(activeRecurringDraft.id)}
                small
                variant="ghost"
              />
            </View>
          </SectionCard>
        ) : null}
      </View>

      <View style={styles.bottomBlock}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.navActions}>
          <PillButton
            disabled={stepIndex === 0}
            label="Back"
            onPress={() => {
              setError(null);
              setStepIndex((value) => Math.max(0, value - 1));
            }}
            variant="ghost"
          />
          {isFinalStep ? (
            <PillButton label="Create my budget" onPress={handleSubmit} />
          ) : (
            <PillButton
              label="Next step"
              onPress={() => {
                setError(null);
                setStepIndex((value) => Math.min(totalSteps - 1, value + 1));
              }}
            />
          )}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBlock: {
    gap: 14,
  },
  bottomBlock: {
    gap: 10,
    paddingBottom: 6,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 14,
    height: 6,
    borderRadius: 999,
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  stepDotActive: {
    width: 34,
    backgroundColor: AppColors.sky,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  helper: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.mutedText,
  },
  recurringBlock: {
    gap: 10,
    paddingTop: 2,
  },
  rowCounter: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  rowActionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: AppColors.red,
  },
  navActions: {
    gap: 10,
  },
});