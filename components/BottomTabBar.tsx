import { useState } from 'react';
import { router, usePathname } from 'expo-router';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthProvider';
import { COLORS } from '../constants/theme';
import { BaobabIcon } from './icons/BaobabIcon';
import { SproutIcon } from './icons/SproutIcon';

type Tab = { key: string; path: string };

const LEFT_TABS: Tab[] = [
  { key: 'home', path: '/(tabs)' },
  { key: 'projects', path: '/(tabs)/showcase' },
];

const RIGHT_TABS: Tab[] = [
  { key: 'search', path: '/search' },
  { key: 'messages', path: '/(tabs)/messages' },
  { key: 'profile', path: '/(tabs)/profile' },
];

const CREATE_OPTIONS = [
  { key: 'project', icon: 'folder-outline', label: 'Nouveau projet', path: '/project/new' },
  { key: 'post', icon: 'create-outline', label: 'Nouvelle publication', path: '/post/new' },
  { key: 'story', icon: 'color-palette-outline', label: 'Nouvelle story', path: '/story/new' },
] as const;

function TabIcon({ tabKey, active }: { tabKey: string; active: boolean }) {
  const opacity = active ? 1 : 0.55;
  if (tabKey === 'home') return <BaobabIcon size={24} color={active ? COLORS.accent : COLORS.textMuted} />;
  if (tabKey === 'projects') return <SproutIcon size={24} color={active ? COLORS.success : COLORS.textMuted} />;
  if (tabKey === 'search') return <Ionicons name="search-outline" size={23} color={COLORS.textPrimary} style={{ opacity }} />;
  if (tabKey === 'messages')
    return <Ionicons name="chatbubble-ellipses-outline" size={23} color={COLORS.textPrimary} style={{ opacity }} />;
  return <Ionicons name="person-circle-outline" size={25} color={COLORS.textPrimary} style={{ opacity }} />;
}

// Barre de navigation persistante façon Instagram : rendue une seule fois au niveau racine
// (voir app/_layout.tsx), donc visible sur tous les écrans y compris les pages de détail
// (projet, profil, publication, conversation) qui restent poussées via le Stack racine.
export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const isActive = (tab: Tab) => {
    if (tab.path === '/(tabs)') return pathname === '/' || pathname === '/(tabs)';
    return pathname.startsWith(tab.path.replace('(tabs)/', ''));
  };

  const navigateToTab = (path: string) => {
    // Ramène toujours à un seul écran avant de changer d'onglet, pour éviter d'accumuler un
    // historique de retour au fil des ouvertures depuis le menu "Créer" ou la recherche.
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace(path as never);
  };

  const renderTab = (tab: Tab) => {
    const active = isActive(tab);
    return (
      <TouchableOpacity key={tab.key} style={styles.item} onPress={() => navigateToTab(tab.path)}>
        {tab.key === 'profile' && profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={[styles.avatar, active && styles.avatarActive]} />
        ) : (
          <TabIcon tabKey={tab.key} active={active} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {LEFT_TABS.map(renderTab)}
        {profile?.role === 'entrepreneur' && (
          <TouchableOpacity style={styles.item} onPress={() => setCreateMenuOpen(true)} accessibilityLabel="Créer">
            <View style={styles.addButton}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </TouchableOpacity>
        )}
        {RIGHT_TABS.map(renderTab)}
      </View>

      <Modal visible={createMenuOpen} animationType="slide" transparent onRequestClose={() => setCreateMenuOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setCreateMenuOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Créer</Text>
            {CREATE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.sheetItem}
                onPress={() => {
                  setCreateMenuOpen(false);
                  router.push(opt.path as never);
                }}
              >
                <Ionicons name={opt.icon} size={22} color={COLORS.primary} style={styles.sheetItemIcon} />
                <Text style={styles.sheetItemLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={() => setCreateMenuOpen(false)}>
              <Text style={styles.closeText}>Annuler</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: 'transparent' },
  avatarActive: { borderColor: COLORS.primary },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  sheetItemIcon: { width: 30, textAlign: 'center' },
  sheetItemLabel: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
  closeButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  closeText: { color: COLORS.textMuted, fontWeight: '600' },
});
