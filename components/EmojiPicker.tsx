import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EMOJI_CATEGORIES, SKIN_TONE_ELIGIBLE, SKIN_TONE_MODIFIERS } from '../constants/emojis';
import { COLORS } from '../constants/theme';

// Grille d'émojis par catégorie avec un sélecteur de teint de peau en haut : le teint choisi
// s'applique automatiquement aux émojis "personne/geste" qui le supportent.
export function EmojiPicker({ onInsert, dark }: { onInsert: (emoji: string) => void; dark?: boolean }) {
  const [tone, setTone] = useState('');

  const categoryLabelStyle = dark ? styles.categoryLabelDark : styles.categoryLabel;
  const emojiTextStyle = styles.emojiText;

  return (
    <View>
      <View style={styles.toneRow}>
        {SKIN_TONE_MODIFIERS.map((t) => (
          <TouchableOpacity
            key={t.modifier || 'default'}
            style={[styles.toneSwatch, { backgroundColor: t.swatch }, tone === t.modifier && styles.toneSwatchActive]}
            onPress={() => setTone(t.modifier)}
          />
        ))}
      </View>
      <ScrollView style={styles.grid} nestedScrollEnabled>
        {EMOJI_CATEGORIES.map((cat) => (
          <View key={cat.label} style={{ marginBottom: 10 }}>
            <Text style={categoryLabelStyle}>{cat.label}</Text>
            <View style={styles.emojiGrid}>
              {cat.emojis.map((e, i) => (
                <TouchableOpacity
                  key={e + i}
                  style={styles.emojiButton}
                  onPress={() => onInsert(tone && SKIN_TONE_ELIGIBLE.has(e) ? e + tone : e)}
                >
                  <Text style={emojiTextStyle}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toneRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingBottom: 8 },
  toneSwatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'transparent' },
  toneSwatchActive: { borderColor: COLORS.accent },
  grid: { maxHeight: 190 },
  categoryLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  categoryLabelDark: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emojiButton: { padding: 6 },
  emojiText: { fontSize: 22 },
});
