import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppScreen, Field, PillButton, SectionCard, SectionHeading } from '@/components/AppUI';
import { AppColors, themePresets } from '@/constants/theme';
import { useBudgetStore } from '@/store/useBudgetStore';

type RecurringDraft = {
  id: string;
  name: string;
  amount: string;
};

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, '').trim());
}

function makeDraft(name = '', amount = ''): RecurringDraft {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name,
    amount,
  };
}

export default function SettingsScreen() {
  const profile = useBudgetStore((state) => state.profile);
  const recurringExpenses = useBudgetStore((state) => state.recurringExpenses);
  const updateProfile = useBudgetStore((state) => state.updateProfile);
  const replaceRecurringExpenses = useBudgetStore((state) => state.replaceRecurringExpenses);
  const resetAllData = useBudgetStore((state) => state.resetAllData);
  const appTheme = useBudgetStore((state) => state.appTheme);
  const setAppTheme = useBudgetStore((state) => state.setAppTheme);

  const [netPay, setNetPay] = useState('');
  const [paydayDay, setPaydayDay] = useState('');
  const [startingRollover, setStartingRollover] = useState('0');
  const [recurringDrafts, setRecurringDrafts] = useState<RecurringDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedThemePreset, setSelectedThemePreset] = useState(appTheme);

  useEffect(() => {
    setSelectedThemePreset(appTheme);
  }, [appTheme]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setNetPay(profile.netPayZar.toString());
    setPaydayDay(profile.paydayDay.toString());
    setStartingRollover(profile.startingRolloverZar.toString());
    setRecurringDrafts(
      recurringExpenses.length > 0
        ? recurringExpenses.map((expense) => makeDraft(expense.name, expense.amountZar.toString()))
        : [makeDraft()],
    );
  }, [profile, recurringExpenses]);

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  const updateDraft = (id: string, patch: Partial<RecurringDraft>) => {
    setRecurringDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  };

  const handleSave = () => {
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

    updateProfile({
      netPayZar: parsedNetPay,
      paydayDay: parsedPayday,
      startingRolloverZar: Number.isFinite(parsedRollover) ? parsedRollover : 0,
    });
    replaceRecurringExpenses(
      recurringDrafts.map((draft) => ({
        name: draft.name,
        amountZar: parseMoney(draft.amount),
      })),
    );
    setError(null);
    router.replace('/(tabs)');
  };

  const handleReset = () => {
    Alert.alert('Reset local data?', 'This clears your budget, wishlist, badges, and history from this device only.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetAllData();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <SectionHeading
        eyebrow="Settings"
        title="Tune the plan"
        caption="Budget model and style previews."
      />

      <SectionCard accentColor={AppColors.limeDark} subtitle="Preview alternatives before a full theme rollout." title="Theme lab">
        <View style={styles.themeChipRow}>
          {themePresets.map((preset) => (
            <PillButton
              key={preset.id}
              fullWidth={false}
              label={preset.name}
              onPress={() => {
                setSelectedThemePreset(preset.id);
                setAppTheme(preset.id);
              }}
              small
              variant={selectedThemePreset === preset.id ? 'primary' : 'ghost'}
            />
          ))}
        </View>

        {themePresets.filter((preset) => preset.id === selectedThemePreset).map((preset) => (
          <View key={preset.id} style={styles.themePreviewCard}>
            <Text style={styles.themeTitle}>{preset.name}</Text>
            <Text style={styles.themeNote}>{preset.note}</Text>
            <View style={styles.themeSwatches}>
              {preset.swatches.map((color) => (
                <View key={color} style={[styles.themeSwatch, { backgroundColor: color }]} />
              ))}
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard accentColor={AppColors.sky} title="Income and cycle">
        <Field keyboardType="decimal-pad" label="Monthly net pay (ZAR)" onChangeText={setNetPay} value={netPay} />
        <Field keyboardType="number-pad" label="Payday day of month" onChangeText={setPaydayDay} value={paydayDay} />
        <Field keyboardType="decimal-pad" label="Starting rollover (ZAR)" onChangeText={setStartingRollover} value={startingRollover} />
      </SectionCard>

      <SectionCard accentColor={AppColors.amber} title="Recurring monthly costs">
        {recurringDrafts.map((draft) => (
          <View key={draft.id} style={styles.recurringBlock}>
            <Field label="Expense name" onChangeText={(value) => updateDraft(draft.id, { name: value })} value={draft.name} />
            <Field keyboardType="decimal-pad" label="Amount (ZAR)" onChangeText={(value) => updateDraft(draft.id, { amount: value })} value={draft.amount} />
            <PillButton label="Remove row" onPress={() => setRecurringDrafts((current) => current.filter((row) => row.id !== draft.id))} small variant="ghost" />
          </View>
        ))}
        <PillButton label="Add recurring cost" onPress={() => setRecurringDrafts((current) => [...current, makeDraft()])} variant="secondary" />
      </SectionCard>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actionRow}>
        <PillButton label="Save changes" onPress={handleSave} />
        <PillButton label="Reset all local data" onPress={handleReset} variant="danger" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  themeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themePreviewCard: {
    gap: 8,
    borderWidth: 2,
    borderColor: AppColors.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: AppColors.surfaceMuted,
  },
  themeTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: AppColors.text,
  },
  themeNote: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  themeSwatches: {
    flexDirection: 'row',
    gap: 8,
  },
  themeSwatch: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  recurringBlock: {
    gap: 10,
    paddingVertical: 6,
  },
  errorText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: AppColors.red,
  },
  actionRow: {
    gap: 12,
  },
});