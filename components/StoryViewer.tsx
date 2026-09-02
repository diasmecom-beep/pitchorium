import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';
import type { StoryGroup } from '../lib/stories';
import type { Profile } from '../types/database';

const STORY_DURATION_MS = 4500;
const TICK_MS = 50;

export function StoryViewer({
  groups,
  startGroupIndex,
  onClose,
}: {
  groups: StoryGroup[];
  startGroupIndex: number | null;
  onClose: () => void;
}) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex ?? 0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [taggedProfile, setTaggedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (startGroupIndex === null) return;
    setGroupIndex(startGroupIndex);
    setStoryIndex(0);
  }, [startGroupIndex]);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  const goNext = () => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(0);
    }
  };

  // Barre de progression : un interval qui met à jour uniquement son propre état, sans jamais
  // déclencher un changement d'état ailleurs pendant le rendu.
  useEffect(() => {
    if (startGroupIndex === null || !story) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + (TICK_MS / STORY_DURATION_MS) * 100));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [groupIndex, storyIndex, startGroupIndex, story]);

  // Avance automatique : minuteur indépendant de l'animation de la barre, sûr pour appeler
  // goNext (qui peut fermer la visionneuse via le composant parent).
  useEffect(() => {
    if (startGroupIndex === null || !story) return;
    const timeout = setTimeout(goNext, STORY_DURATION_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex, startGroupIndex]);

  useEffect(() => {
    if (!story?.tagged_profile_id) {
      setTaggedProfile(null);
      return;
    }
    let active = true;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', story.tagged_profile_id)
      .single()
      .then(({ data }) => {
        if (active) setTaggedProfile((data as Profile) ?? null);
      });
    return () => {
      active = false;
    };
  }, [story?.tagged_profile_id]);

  if (startGroupIndex === null || !group || !story) return null;

  const authorName =
    group.author.role === 'entrepreneur' ? group.author.company_name || group.author.full_name : group.author.full_name;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.progressRow}>
          {group.stories.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${i < storyIndex ? 100 : i === storyIndex ? progress : 0}%` },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerAuthor}
            onPress={() => {
              onClose();
              router.push(`/profile/${group.author.id}`);
            }}
          >
            {group.author.avatar_url ? (
              <Image source={{ uri: group.author.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{authorName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.authorName}>{authorName}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageWrapper}>
          <Image source={{ uri: story.image_url }} style={styles.storyImage} resizeMode="contain" />
          {story.filter_color && (
            <View style={[styles.filterOverlay, { backgroundColor: story.filter_color }]} pointerEvents="none" />
          )}
          {taggedProfile && (
            <TouchableOpacity
              style={styles.tagChip}
              onPress={() => {
                onClose();
                router.push(`/profile/${taggedProfile.id}`);
              }}
            >
              <Text style={styles.tagChipText}>
                @ {taggedProfile.role === 'entrepreneur' ? taggedProfile.company_name || taggedProfile.full_name : taggedProfile.full_name}
              </Text>
            </TouchableOpacity>
          )}
          {story.caption ? (
            <Text style={[styles.caption, { color: story.caption_color || '#fff' }]}>{story.caption}</Text>
          ) : null}
        </View>

        <View style={styles.tapZones}>
          <TouchableOpacity style={styles.tapZone} onPress={goPrev} />
          <TouchableOpacity style={styles.tapZone} onPress={goNext} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 4, paddingTop: 50, paddingHorizontal: 8 },
  progressTrack: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  headerAuthor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 13 },
  authorName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  closeButton: { padding: 8 },
  closeText: { color: '#fff', fontSize: 20 },
  imageWrapper: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  storyImage: { flex: 1, width: '100%' },
  filterOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.28 },
  tagChip: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagChipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  caption: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '18%',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  tapZones: { position: 'absolute', top: 90, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  tapZone: { flex: 1 },
});
