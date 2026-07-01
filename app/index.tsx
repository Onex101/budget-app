import { Redirect } from 'expo-router';

import { LoadingSplash } from '@/components/AppUI';
import { useBudgetStore } from '@/store/useBudgetStore';

export default function IndexScreen() {
  const hasHydrated = useBudgetStore((state) => state.hasHydrated);
  const profile = useBudgetStore((state) => state.profile);

  if (!hasHydrated) {
    return <LoadingSplash />;
  }

  return <Redirect href={profile ? '/(tabs)' : '/onboarding'} />;
}