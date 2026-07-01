import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { getThemeColors } from '@/constants/theme';
import { useBudgetStore } from '@/store/useBudgetStore';

function SettingsButton({ color, border, raised }: { color: string; border: string; raised: string }) {
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [styles.settingsButton, { backgroundColor: raised, borderColor: border }, pressed && styles.pressed]}>
      <MaterialCommunityIcons color={color} name="cog-outline" size={20} />
    </Pressable>
  );
}

export default function TabLayout() {
  const appTheme = useBudgetStore((state) => state.appTheme);
  const colors = useMemo(() => getThemeColors(appTheme), [appTheme]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: {
          fontFamily: 'Nunito_800ExtraBold',
          fontSize: 20,
          color: colors.text,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => <SettingsButton border={colors.border} color={colors.text} raised={colors.surfaceRaised} />,
        sceneStyle: { backgroundColor: colors.backgroundBottom },
        tabBarActiveTintColor: colors.limeDark,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons color={color} name="home-heart" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons color={color} name="cash-multiple" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons color={color} name="gift-outline" size={24} />,
        }}
      />
      <Tabs.Screen
        name="wins"
        options={{
          title: 'Wins',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons color={color} name="trophy-outline" size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    width: 38,
    height: 38,
    marginRight: 14,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  tabBar: {
    height: 80,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 2,
  },
  tabBarLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
});
