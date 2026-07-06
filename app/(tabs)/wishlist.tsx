import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  EmptyState,
  Field,
  FloatingActionButton,
  FormSheetModal,
  PillButton,
  SectionCard,
  SectionHeading,
  TactileButton,
} from '@/components/AppUI';
import { AppColors } from '@/constants/theme';
import { computeHoursRequired, getBudgetSnapshot, getWishlistInsight } from '@/lib/budget';
import { formatCurrency, formatFriendlyDate, formatHours } from '@/lib/formatters';
import { fireEntryCreatedHaptic, fireVaultClearHaptic } from '@/lib/haptics';
import { useBudgetStore } from '@/store/useBudgetStore';

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, '').trim());
}

type WishlistFormValues = {
  name: string;
  cost: string;
  url: string;
};

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
  const [formVisible, setFormVisible] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WishlistFormValues>({
    defaultValues: {
      name: '',
      cost: '',
      url: '',
    },
  });

  if (!profile || !snapshot) {
    return <Redirect href="/onboarding" />;
  }

  const insight = getWishlistInsight(wishlistItems, snapshot);
  const focusItem = insight.affordableItems[0] ?? insight.nextUnlockItem;

  const resetForm = () => {
    setEditingId(null);
    reset({
      name: '',
      cost: '',
      url: '',
    });
    setFormVisible(false);
  };

  const onSubmitForm = (values: WishlistFormValues) => {
    const parsedCost = parseMoney(values.cost);

    if (editingId) {
      updateWishlistItem(editingId, {
        name: values.name,
        costZar: parsedCost,
        url: normalizeUrl(values.url),
      });
    } else {
      addWishlistItem({
        name: values.name,
        costZar: parsedCost,
        url: normalizeUrl(values.url),
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
          title="Unlock queue"
          caption="Track wants, wait, then buy with intent."
        />

        <View style={styles.summaryStrip}>
          <Text style={styles.summaryText}>{`${insight.affordableItems.length} ready`}</Text>
          <Text style={styles.summaryDot}>•</Text>
          <Text style={styles.summaryText}>{`${Math.max(0, insight.activeItems.length - insight.affordableItems.length)} waiting`}</Text>
        </View>

        <SectionCard accentColor={AppColors.amber} subtitle="Active wishes, newest first." title="Wishlist board">
          {insight.activeItems.length === 0 ? (
            <EmptyState message="A clear wishlist is how the app starts turning temptation into a measured target." title="No active wishes" />
          ) : (
            insight.activeItems.map((item) => {
              const isAffordable = insight.affordableItems.some((entry) => entry.id === item.id);
              const hoursRequired = computeHoursRequired(item.costZar, snapshot.hourlyRate);

              return (
                <View key={item.id} style={styles.wishCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleBlock}>
                      <Text style={styles.entryTitle}>{item.name}</Text>
                      <Text style={styles.entryMeta}>{`${formatCurrency(item.costZar)} · ${formatHours(hoursRequired)} · ${formatFriendlyDate(item.createdAt)}`}</Text>
                    </View>
                    <Text style={[styles.statusPill, isAffordable ? styles.statusPillReady : styles.statusPillWaiting]}>
                      {isAffordable ? 'Ready' : 'Waiting'}
                    </Text>
                  </View>

                  <View style={styles.inlineActionsWrap}>
                    <PillButton
                      disabled={!isAffordable || snapshot.isRedZone}
                      fullWidth={false}
                      label="Buy"
                      onPress={() => handlePurchase(item.id, isAffordable)}
                      small
                    />
                    <PillButton
                      label="Manage"
                      onPress={() => {
                        setEditingId(item.id);
                        reset({
                          name: item.name,
                          cost: item.costZar.toString(),
                          url: item.url ?? '',
                        });
                        setFormVisible(true);
                      }}
                      small
                      fullWidth={false}
                      variant="secondary"
                    />
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>

        {focusItem ? (
          <Text style={styles.focusLine}>
            {`Next unlock: ${focusItem.name} · ${formatCurrency(focusItem.costZar)} · ${formatHours(computeHoursRequired(focusItem.costZar, snapshot.hourlyRate))}`}
          </Text>
        ) : null}
      </AppScreen>

      <FloatingActionButton
        label="+"
        onPress={() => {
          setEditingId(null);
          reset({
            name: '',
            cost: '',
            url: '',
          });
          setFormVisible(true);
        }}
      />

      <FormSheetModal
        onClose={() => {
          resetForm();
        }}
        subtitle="Quick wishlist capture."
        title={editingId ? 'Edit wish' : 'Add wish'}
        visible={formVisible}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Field label="Item name" onChangeText={onChange} placeholder="Noise-cancelling headphones" value={value} />
          )}
        />
        <Controller
          control={control}
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
          control={control}
          name="url"
          render={({ field: { onChange, value } }) => (
            <Field label="URL (optional)" onChangeText={onChange} placeholder="https://store.example/item" value={value} />
          )}
        />
        {errors.cost ? <Text style={styles.errorText}>{errors.cost.message}</Text> : null}
        <View style={styles.actionRow}>
          <TactileButton fullWidth={false} label={editingId ? 'Save' : 'Add'} onPress={handleSubmit(onSubmitForm)} />
          {editingId ? (
            <PillButton
              fullWidth={false}
              label="Delete"
              onPress={() => {
                deleteWishlistItem(editingId);
                resetForm();
              }}
              variant="danger"
            />
          ) : null}
          {editingId && watch('url') ? (
            <PillButton
              fullWidth={false}
              label="Open"
              onPress={() => {
                void openLink(normalizeUrl(watch('url') ?? ''));
              }}
              variant="secondary"
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
  focusLine: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
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
  wishCard: {
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
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 11,
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
  inlineActionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
});