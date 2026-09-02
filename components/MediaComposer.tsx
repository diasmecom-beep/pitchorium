import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { searchProfilesOnly } from '../lib/search';
import { EmojiPicker } from './EmojiPicker';
import { MediaFrame } from './MediaFrame';
import { COLORS } from '../constants/theme';
import type { Profile } from '../types/database';

const TEXT_COLORS = ['#FFFFFF', '#1C1B18', COLORS.accent, COLORS.gold, COLORS.success, COLORS.danger];

export type MediaComposerResult = {
  caption: string;
  color: string;
  taggedProfileId: string | null;
};

type Panel = 'text' | 'emoji' | 'tag' | null;

export function MediaComposer({
  images,
  publishing,
  submitLabel = 'Publier',
  errorMessage,
  onCancel,
  onPublish,
}: {
  images: string[];
  publishing: boolean;
  submitLabel?: string;
  errorMessage?: string | null;
  onCancel: () => void;
  onPublish: (result: MediaComposerResult) => void;
}) {
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState(TEXT_COLORS[0]);
  const [taggedProfile, setTaggedProfile] = useState<Profile | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(0);

  const togglePanel = (p: Panel) => setPanel((current) => (current === p ? null : p));

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

  const nameFor = (p: Profile) => (p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name);

  return (
    <View style={styles.container}>
      <View style={styles.previewWrapper} onLayout={(e) => setPreviewWidth(e.nativeEvent.layout.width)}>
        {previewWidth > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const width = e.nativeEvent.layoutMeasurement.width;
              if (width > 0) setFrameIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            style={StyleSheet.absoluteFill}
          >
            {images.map((url, i) => (
              <View key={i} style={[styles.frame, { width: previewWidth }]}>
                <MediaFrame url={url} />
              </View>
            ))}
          </ScrollView>
        )}

        {images.length > 1 && (
          <View style={styles.dotsRow} pointerEvents="none">
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === frameIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        {taggedProfile && (
          <View style={styles.tagChip}>
            <Text style={styles.tagChipText}>@ {nameFor(taggedProfile)}</Text>
          </View>
        )}
        {caption ? <Text style={[styles.captionPreview, { color }]}>{caption}</Text> : null}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={() => togglePanel('text')}>
          <Text style={[styles.toolIcon, panel === 'text' && styles.toolIconActive]}>Aa</Text>
          <Text style={styles.toolLabel}>Texte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => togglePanel('emoji')}>
          <Text style={[styles.toolIcon, panel === 'emoji' && styles.toolIconActive]}>😀</Text>
          <Text style={styles.toolLabel}>Émoticône</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => togglePanel('tag')}>
          <Text style={[styles.toolIcon, panel === 'tag' && styles.toolIconActive]}>@</Text>
          <Text style={styles.toolLabel}>Identifier</Text>
        </TouchableOpacity>
      </View>

      {panel === 'text' && (
        <View style={styles.panel}>
          <TextInput
            style={styles.captionInput}
            placeholder="Ajouter du texte..."
            placeholderTextColor={COLORS.textMuted}
            value={caption}
            onChangeText={setCaption}
            autoFocus
          />
          <View style={styles.colorRow}>
            {TEXT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>
      )}

      {panel === 'emoji' && (
        <View style={styles.emojiPanel}>
          <EmojiPicker dark onInsert={(emoji) => setCaption((c) => c + emoji)} />
        </View>
      )}

      {panel === 'tag' && (
        <View style={styles.panel}>
          {taggedProfile ? (
            <View style={styles.taggedRow}>
              <Text style={styles.taggedText}>Identifié·e : {nameFor(taggedProfile)}</Text>
              <TouchableOpacity onPress={() => setTaggedProfile(null)}>
                <Text style={styles.removeTagText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.captionInput}
                placeholder="Rechercher une personne..."
                placeholderTextColor={COLORS.textMuted}
                value={tagQuery}
                onChangeText={handleTagQueryChange}
                autoFocus
              />
              {searching && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
              {tagResults.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.tagResultRow}
                  onPress={() => {
                    setTaggedProfile(p);
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

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishButton, publishing && styles.publishButtonDisabled]}
          onPress={() => onPublish({ caption, color, taggedProfileId: taggedProfile?.id ?? null })}
          disabled={publishing}
        >
          <Text style={styles.publishText}>{publishing ? '...' : submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16, gap: 12 },
  previewWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  frame: { height: '100%' },
  dotsRow: { position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff' },
  captionPreview: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '20%',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  errorText: { color: COLORS.danger, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 8, fontSize: 13 },
  tagChip: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagChipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around' },
  toolButton: { alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 10 },
  toolIcon: { color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '700' },
  toolIconActive: { color: COLORS.accent },
  toolLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  panel: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, gap: 10 },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  colorRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center' },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  colorSwatchActive: { borderColor: '#fff' },
  emojiPanel: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 },
  taggedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taggedText: { color: '#fff', fontWeight: '600' },
  removeTagText: { color: COLORS.danger, fontWeight: '600' },
  tagResultRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  tagResultText: { color: '#fff', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  cancelText: { color: '#fff', fontWeight: '600' },
  publishButton: { flex: 2, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.accent },
  publishButtonDisabled: { opacity: 0.5 },
  publishText: { color: '#fff', fontWeight: '700' },
});
