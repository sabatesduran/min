import { Tabs } from 'expo-router';

import { ca } from '@/locales/ca';
import { MinIcon, type MinIconName } from '@/ui/components/icon';
import { useMinTheme } from '@/ui/use-min-theme';

const icons: Record<string, MinIconName> = {
  index: 'now',
  people: 'people',
  settings: 'settings',
};

export default function TabsLayout() {
  const { colors } = useMinTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: { backgroundColor: colors.raised, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, focused, size }) => {
          const icon = icons[route.name] ?? icons.index!;
          return <MinIcon name={icon} color={String(color)} size={size} strokeWidth={focused ? 2.1 : 1.6} />;
        },
      })}>
      <Tabs.Screen name="index" options={{ title: ca.tabs.now }} />
      <Tabs.Screen name="agenda" options={{ href: null }} />
      <Tabs.Screen name="people" options={{ title: 'Equip' }} />
      <Tabs.Screen name="settings" options={{ title: 'Configuració' }} />
    </Tabs>
  );
}
