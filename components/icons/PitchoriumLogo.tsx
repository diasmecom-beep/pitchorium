import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { BaobabIcon } from './BaobabIcon';

// Marque Pitchorium : badge navy avec baobab doré (ancrage africain, sérieux) + wordmark.
// size='lg' pour les écrans d'authentification, 'sm' pour les en-têtes/menus.
// Cliquable par défaut (ramène à l'accueil) ; passez clickable=false pour l'usage décoratif
// (ex: écran de connexion, où il n'y a pas encore d'accueil à rejoindre).
export function PitchoriumLogo({ size = 'lg', clickable = true }: { size?: 'sm' | 'lg'; clickable?: boolean }) {
  const badge = size === 'lg' ? 72 : 32;
  const iconSize = size === 'lg' ? 40 : 18;
  const wordmarkSize = size === 'lg' ? 30 : 17;

  const content = (
    <View style={[styles.row, size === 'lg' && styles.rowLg]}>
      <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
        <BaobabIcon size={iconSize} color={COLORS.gold} />
      </View>
      <View>
        <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>Pitchorium</Text>
        {size === 'lg' && <Text style={styles.tagline}>Afrique ⇄ Diaspora</Text>}
      </View>
    </View>
  );

  if (!clickable) return content;

  return (
    <TouchableOpacity onPress={() => router.replace('/(tabs)')} accessibilityLabel="Accueil Pitchorium">
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLg: { flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8 },
  badge: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontWeight: '800', color: COLORS.primary, letterSpacing: 0.3 },
  tagline: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
});
