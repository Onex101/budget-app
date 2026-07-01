import * as Haptics from 'expo-haptics';

function wait(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function safelyRun(effect: () => Promise<void>) {
  try {
    await effect();
  } catch {
    return;
  }
}

export async function fireButtonHaptic() {
  await safelyRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export async function fireEntryCreatedHaptic() {
  await safelyRun(() => Haptics.selectionAsync());
}

export async function fireVaultClearHaptic() {
  await safelyRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  await wait(120);
  await safelyRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  await wait(120);
  await safelyRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}