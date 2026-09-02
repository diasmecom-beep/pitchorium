import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../context/AuthProvider';
import { LanguageProvider } from '../context/LanguageProvider';
import { MenuProvider, useMenu } from '../context/MenuProvider';
import { BottomTabBar } from '../components/BottomTabBar';
import { AppMenu } from '../components/AppMenu';
import { NotificationBell } from '../components/NotificationBell';
import { COLORS } from '../constants/theme';

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

function RootContent() {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const { visible, close } = useMenu();

  useEffect(() => {
    // Précharge la police d'icônes tôt, et absorbe tout rejet (ex: délai dépassé sur un réseau
    // lent) pour que les icônes retombent silencieusement sur leur glyphe de repli plutôt que
    // de faire planter l'appli via une promesse non gérée.
    Font.loadAsync(Ionicons.font).catch(() => {});
  }, []);

  const hideChrome =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/onboarding') ||
    !session ||
    !profile?.onboarding_completed;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.textPrimary,
          headerTitleAlign: 'left',
          headerRight: () => <HeaderRight />,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="project/[id]/index" options={{ headerShown: true, title: 'Projet' }} />
        <Stack.Screen name="project/[id]/manage" options={{ headerShown: true, title: 'Gérer la campagne' }} />
        <Stack.Screen name="project/[id]/pledge" options={{ headerShown: true, title: 'Contribuer' }} />
        <Stack.Screen name="project/new" options={{ headerShown: true, title: 'Nouveau projet' }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: 'Profil' }} />
        <Stack.Screen name="profile/[id]/followers" options={{ headerShown: true, title: 'Abonnés' }} />
        <Stack.Screen name="profile/[id]/following" options={{ headerShown: true, title: 'Abonnements' }} />
        <Stack.Screen name="wallet" options={{ headerShown: true, title: "Portefeuille d'impact" }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: 'Conversation' }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Publication' }} />
        <Stack.Screen name="saved" options={{ headerShown: true, title: 'Publications enregistrées' }} />
        <Stack.Screen name="search" options={{ headerShown: true, title: 'Recherche' }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="stats" options={{ headerShown: true, title: 'Statistiques' }} />
        <Stack.Screen name="post/new" options={{ headerShown: true, title: 'Nouvelle publication' }} />
        <Stack.Screen name="story/new" options={{ headerShown: true, title: 'Nouvelle story' }} />
      </Stack>
      {!hideChrome && <BottomTabBar />}
      {!hideChrome && <AppMenu visible={visible} onClose={close} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <MenuProvider>
            <RootContent />
          </MenuProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  menuButton: { paddingHorizontal: 16, paddingVertical: 6 },
  menuIcon: { fontSize: 20, color: COLORS.textPrimary },
});
