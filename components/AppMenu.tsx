import { router } from 'expo-router';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { LANGUAGES } from '../constants/translations';
import { COLORS } from '../constants/theme';
import { PitchoriumLogo } from './icons/PitchoriumLogo';
import { BaobabIcon } from './icons/BaobabIcon';
import type { ReactNode } from 'react';

export function AppMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const go = (path: string) => {
    onClose();
    router.replace(path as never);
  };

  const goDetail = (path: string) => {
    onClose();
    router.push(path as never);
  };

  const handleLogout = async () => {
    onClose();
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.panel} onPress={() => {}}>
          <ScrollView>
            <View style={{ marginBottom: 14 }}>
              <PitchoriumLogo size="sm" clickable={false} />
            </View>
            <Text style={styles.title}>{t('menu')}</Text>

            <MenuItem icon="🌍" label={t('home')} onPress={() => go('/(tabs)')} />
            <MenuItem icon="🗂️" label={t('showcase')} onPress={() => go('/(tabs)/showcase')} />
            <MenuItem icon="✉️" label={t('messages')} onPress={() => go('/(tabs)/messages')} />
            <MenuItem icon="👤" label={t('profile')} onPress={() => go('/(tabs)/profile')} />
            {profile?.role === 'contributeur' && (
              <MenuItem
                icon={<BaobabIcon size={18} color={COLORS.accent} />}
                label={t('wallet')}
                onPress={() => goDetail('/wallet')}
              />
            )}

            <Text style={styles.sectionTitle}>{t('language')}</Text>
            <View style={styles.langRow}>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langChip, language === l.code && styles.langChipActive]}
                  onPress={() => setLanguage(l.code)}
                >
                  <Text style={[styles.langChipText, language === l.code && styles.langChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>{t('close')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string | ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemIcon}>{typeof icon === 'string' ? <Text style={styles.itemIconText}>{icon}</Text> : icon}</View>
      <Text style={styles.itemLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  itemIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  itemIconText: { fontSize: 18 },
  itemLabel: { fontSize: 16, color: COLORS.textPrimary },
  sectionTitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  langChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langChipText: { fontSize: 13, color: COLORS.textSecondary },
  langChipTextActive: { color: '#fff', fontWeight: '600' },
  logoutButton: { marginTop: 24, paddingVertical: 12, alignItems: 'center' },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 15 },
  closeButton: { paddingVertical: 8, alignItems: 'center' },
  closeText: { color: COLORS.textMuted },
});
