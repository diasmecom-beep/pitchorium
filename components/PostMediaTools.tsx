import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { searchProfilesOnly } from '../lib/search';
import { EmojiPicker } from './EmojiPicker';
import { MediaFrame } from './MediaFrame';
import { COLORS, RADIUS } from '../constants/theme';
import type { Profile } from '../types/database';

const FILTER_COLORS = [COLORS.accent, COLORS.primary, COLORS.gold, COLORS.success, '#000000'];

type Panel = 'emoji' | 'filter' | 'tag' | null;

// Panneau d'édition des photos/vidéos d'une publication : émoticônes insérées dans la légende,
// filtre de couleur appliqué à la galerie, et identification d'une personne.
export function PostMediaTools({
  images,
  onRemoveImage,
  filterColor,
  taggedProfile,
  onInsertEmoji,
  onFilterChange,
  onTagChange,
}: {
  images: string[];
  onRemoveImage: (index: number) => void;
  filterColor: string | null;
  taggedProfile: Profile | null;
  onInsertEmoji: (emoji: string) => void;
  onFilterChange: (color: string | null) => void;
  onTagChange: (profile: Profile | null) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const togglePanel = (p: Panel) => setPanel((current) => (current === p ? null : p));
  const nameFor = (p: Profile) => (p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name);

  const handleTagQueryChange = async (text: string) => {
    setTagQuery(text);
    if (text.trim().length < 2) {
      setTagResults([]);
      return;
    }
    setSearching(true);
    const results = await searchProfilesOnly(text);
    setTagResults(results);
    setSearching(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((url, i) => (
          <View key={i} style={styles.previewWrapper}>
            <MediaFrame url={url} />
            {filterColor && <View style={[styles.filterOverlay, { backgroundColor: filterColor }]} pointerEvents="none" />}
            {i === 0 && taggedProfile && (
              <View style={styles.tagChip}>
                <Text style={styles.tagChipText}>@ {nameFor(taggedProfile)}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveImage(i)}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={() => togglePanel('emoji')}>
          <Text style={styles.toolIcon}>😀</Text>
          <Text style={styles.toolLabel}>Émoticône</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => togglePanel('filter')}>
          <Text style={styles.toolIcon}>🎨</Text>
          <Text style={styles.toolLabel}>Filtre</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => togglePanel('tag')}>
          <Text style={styles.toolIcon}>@</Text>
          <Text style={styles.toolLabel}>Identifier</Text>
        </TouchableOpacity>
      </View>

      {panel === 'emoji' && (
        <View style={styles.emojiPanel}>
          <EmojiPicker onInsert={onInsertEmoji} />
        </View>
      )}

      {panel === 'filter' && (
        <View style={styles.panel}>
          <View style={styles.colorRow}>
            <TouchableOpacity
              style={[styles.filterSwatch, !filterColor && styles.swatchActive]}
              onPress={() => onFilterChange(null)}
            >
              <Text style={styles.filterNoneText}>Aucun</Text>
            </TouchableOpacity>
            {FILTER_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }, filterColor === c && styles.swatchActive]}
                onPress={() => onFilterChange(c)}
              />
            ))}
          </View>
        </View>
      )}

      {panel === 'tag' && (
        <View style={styles.panel}>
          {taggedProfile ? (
            <View style={styles.taggedRow}>
              <Text style={styles.taggedText}>Identifié·e : {nameFor(taggedProfile)}</Text>
              <TouchableOpacity onPress={() => onTagChange(null)}>
                <Text style={styles.removeTagText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.tagInput}
                placeholder="Rechercher une personne..."
                placeholderTextColor={COLORS.textMuted}
                value={tagQuery}
                onChangeText={handleTagQueryChange}
              />
              {searching && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />}
              {tagResults.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.tagResultRow}
                  onPress={() => {
                    onTagChange(p);
                    setTagQuery('');
                    setTagResults([]);
                    setPanel(null);
                  }}
                >
                  <Text style={styles.tagResultText}>{nameFor(p)}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrapper: { width: 140, height: 180, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.border, marginRight: 8 },
  filterOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.28 },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tagChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagChipText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around' },
  toolButton: { alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 10 },
  toolIcon: { fontSize: 18 },
  toolLabel: { color: COLORS.textMuted, fontSize: 10 },
  panel: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  emojiPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center' },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border },
  swatchActive: { borderColor: COLORS.primary },
  filterSwatch: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterNoneText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '600' },
  taggedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taggedText: { color: COLORS.textPrimary, fontWeight: '600' },
  removeTagText: { color: COLORS.danger, fontWeight: '600' },
  tagInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
  },
  tagResultRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  tagResultText: { color: COLORS.textPrimary, fontSize: 14 },
});
