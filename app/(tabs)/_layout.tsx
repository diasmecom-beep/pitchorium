import { Stack } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PitchoriumLogo } from '../../components/icons/PitchoriumLogo';
import { NotificationBell } from '../../components/NotificationBell';
import { useLanguage } from '../../context/LanguageProvider';
import { useMenu } from '../../context/MenuProvider';
import { COLORS } from '../../constants/theme';

function MenuButton() {
  const { open } = useMenu();
  return (
    <TouchableOpacity style={styles.menuButton} onPress={open} accessibilityLabel="Menu">
      <Text style={styles.menuIcon}>☰</Text>
    </TouchableOpacity>
  );
}

function HeaderRight() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <NotificationBell />
      <MenuButton />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerTitleAlign: 'left',
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('home'),
          headerTitle: () => (
            <View style={styles.headerLogo}>
              <PitchoriumLogo size="sm" />
            </View>
          ),
        }}
      />
      <Stack.Screen name="showcase" options={{ title: t('showcase') }} />
      <Stack.Screen name="messages" options={{ title: t('messages') }} />
      <Stack.Screen name="profile" options={{ title: t('profile') }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  menuButton: { paddingHorizontal: 16, paddingVertical: 6 },
  menuIcon: { fontSize: 20, color: COLORS.textPrimary },
  headerLogo: { paddingLeft: 4 },
});
