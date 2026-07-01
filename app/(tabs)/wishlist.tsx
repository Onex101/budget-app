import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  AnimatedDeficitWrapper,
  AppScreen,
  EmptyState,
  Field,
  FloatingActionButton,
  FormSheetModal,
  PillButton,
  ProgressBar,
  SectionCard,
  SectionHeading,
  StatChip,
  TactileButton,
} from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { computeHoursRequired, getAffordabilityProgress, getBudgetSnapshot, getWishlistInsight } from '@/lib/budget';
import { formatCurrency, formatFriendlyDate, formatHours } from '@/lib/formatters';
import { fireEntryCreatedHaptic, fireVaultClearHaptic } from '@/lib/haptics';
import { useBudgetStore } from '@/store/useBudgetStore';

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

export default function WishlistScreen() {
  const profile = useBudgetStore((state) => state.profile);
  const recurringExpenses = useBudgetStore((state) => state.recurringExpenses);
  const expenses = useBudgetStore((state) => state.expenses);
  const wishlistItems = useBudgetStore((state) => state.wishlistItems);
  const addWishlistItem = useBudgetStore((state) => state.addWishlistItem);
  const updateWishlistItem = useBudgetStore((state) => state.updateWishlistItem);
  const deleteWishlistItem = useBudgetStore((state) => state.deleteWishlistItem);
  const purchaseWishlistItem = useBudgetStore((state) => state.purchaseWishlistItem);

  const snapshot = getBudgetSnapshot({ profile, recurringExpenses, expenses });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  if (!profile || !snapshot) {
    return <Redirect href="/onboarding" />;
  }

  const insight = getWishlistInsight(wishlistItems, snapshot);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCost('');
    setUrl('');
    setError(null);
    setFormVisible(false);
  };

  const handleSubmit = () => {
    const parsedCost = parseMoney(cost);

    if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
      setError('Enter a valid wishlist cost.');
      return;
    }

    if (editingId) {
      updateWishlistItem(editingId, {
        name,
        costZar: parsedCost,
        url: normalizeUrl(url),
      });
    } else {
      addWishlistItem({
        name,
        costZar: parsedCost,
        url: normalizeUrl(url),
      });

      void fireEntryCreatedHaptic();
    }

    resetForm();
  };

  const handlePurchase = (itemId: string, isAffordable: boolean) => {
    if (!isAffordable || snapshot.isRedZone) {
      return;
    }

    purchaseWishlistItem(itemId);
    void fireVaultClearHaptic();
  };

  const openLink = async (value?: string) => {
    if (!value) {
      return;
    }

    try {
      await Linking.openURL(value);
    } catch {
      Alert.alert('Could not open link', 'The URL looks invalid or is not supported on this device.');
    }
  };

  return (
    <View style={styles.root}>
      <AppScreen>
        <SectionHeading
          eyebrow="Wishlist"
          title="Make wants wait"
          caption="Track wants before you buy."
        />

        <AnimatedDeficitWrapper isActive={snapshot.isRedZone}>
          <SectionCard accentColor={AppColors.limeDark} subtitle="Unlock status and bank." title="Affordability snapshot">
            <View style={styles.statRow}>
              <StatChip label="Ready now" tone="lime" value={`${insight.affordableItems.length}`} />
              <StatChip label="Active wishes" tone="sky" value={`${insight.activeItems.length}`} />
              <StatChip label="Bank" tone={snapshot.isRedZone ? 'red' : 'amber'} value={formatCurrency(snapshot.savingsBank)} />
            </View>
          </SectionCard>
        </AnimatedDeficitWrapper>

        <SectionCard accentColor={AppColors.amber} subtitle="Active wishes." title="Wishlist board">
          {insight.activeItems.length === 0 ? (
            <EmptyState message="A clear wishlist is how the app starts turning temptation into a measured target." title="No active wishes" />
          ) : (
            insight.activeItems.map((item) => {
              const isAffordable = insight.affordableItems.some((entry) => entry.id === item.id);
              const hoursRequired = computeHoursRequired(item.costZar, snapshot.hourlyRate);
              const amountRemaining = Math.max(0, item.costZar - snapshot.savingsBank);

              return (
                <View key={item.id} style={styles.wishCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleBlock}>
                      <Text style={styles.entryTitle}>{item.name}</Text>
                      <Text style={styles.entryMeta}>{formatCurrency(item.costZar)} · {formatHours(hoursRequired)}</Text>
                      <Text style={styles.entryMeta}>Added {formatFriendlyDate(item.createdAt)}</Text>
                    </View>
                    <Text style={[styles.statusPill, isAffordable ? styles.statusPillReady : styles.statusPillWaiting]}>
                      {isAffordable ? 'Ready' : 'Waiting'}
                    </Text>
                  </View>

                  <ProgressBar progress={getAffordabilityProgress(item.costZar, snapshot)} />
                  <Text style={styles.supportText}>
                    {snapshot.isRedZone
                      ? 'Red Zone active. Buying is locked.'
                      : isAffordable
                        ? 'Unlocked. Buy now or wait.'
                        : `${formatCurrency(amountRemaining)} still needed to unlock it.`}
                  </Text>

                  <View style={styles.inlineActionsWrap}>
                    <PillButton
                      disabled={!isAffordable || snapshot.isRedZone}
                      fullWidth={false}
                      label="Buy"
                      onPress={() => handlePurchase(item.id, isAffordable)}
                      small
                    />
                    <PillButton
                      label="Edit"
                      onPress={() => {
                        setEditingId(item.id);
                        setName(item.name);
                        setCost(item.costZar.toString());
                        setUrl(item.url ?? '');
                        setError(null);
                        setFormVisible(true);
                      }}
                      small
                      fullWidth={false}
                      variant="secondary"
                    />
                    {item.url ? <PillButton label="Link" onPress={() => openLink(item.url)} small fullWidth={false} variant="ghost" /> : null}
                    <PillButton label="Delete" onPress={() => deleteWishlistItem(item.id)} small fullWidth={false} variant="ghost" />
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
          setCost('');
          setUrl('');
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
        subtitle="Quick wishlist capture."
        title={editingId ? 'Edit wish' : 'Capture wish'}
        visible={formVisible}>
        <Field label="Item name" onChangeText={setName} placeholder="Noise-cancelling headphones" value={name} />
        <Field keyboardType="decimal-pad" label="Cost (ZAR)" onChangeText={setCost} placeholder="3499" value={cost} />
        <Field label="URL (optional)" onChangeText={setUrl} placeholder="https://store.example/item" value={url} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionRow}>
          <TactileButton fullWidth={false} label={editingId ? 'Save Wish' : 'Lock Wish'} onPress={handleSubmit} />
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
  wishCard: {
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
    fontSize: 19,
    color: AppColors.text,
  },
  entryMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: AppColors.mutedText,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    overflow: 'hidden',
  },
  statusPillReady: {
    backgroundColor: AppColors.successSurface,
    color: AppColors.text,
  },
  statusPillWaiting: {
    backgroundColor: AppColors.goldSurface,
    color: AppColors.text,
  },
  supportText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.mutedText,
  },
  inlineActionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
});