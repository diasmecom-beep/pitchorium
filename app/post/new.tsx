import { useEffect, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';
import { createPost, updatePost } from '../../lib/feed';
import { pickAndUploadMultipleMedia } from '../../lib/mediaUpload';
import { PostMediaTools } from '../../components/PostMediaTools';
import { COLORS, RADIUS } from '../../constants/theme';
import type { Post, Profile } from '../../types/database';

export default function NewPost() {
  const { profile } = useAuth();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const isEditing = !!postId;

  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [taggedProfile, setTaggedProfile] = useState<Profile | null>(null);
  const [posting, setPosting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
      const p = post as Post | null;
      if (p) {
        setText(p.body);
        setImages(p.media_urls?.length ? p.media_urls : p.image_url ? [p.image_url] : []);
        setFilterColor(p.filter_color);
        if (p.tagged_profile_id) {
          const { data: tagged } = await supabase.from('profiles').select('*').eq('id', p.tagged_profile_id).single();
          setTaggedProfile((tagged as Profile) ?? null);
        }
      }
      setLoading(false);
    })();
  }, [postId]);

  const handlePickImage = async () => {
    if (!profile) return;
    setError(null);
    setPicking(true);
    try {
      const items = await pickAndUploadMultipleMedia(profile.id);
      if (items.length > 0) setImages((prev) => [...prev, ...items.map((i) => i.url)]);
    } catch (e: any) {
      setError(e?.message || "Impossible d'ajouter ces fichiers. Réessayez.");
    } finally {
      setPicking(false);
    }
  };

  const handlePublish = async () => {
    if (!profile || !text.trim()) return;
    setError(null);
    setPosting(true);
    try {
      if (isEditing && postId) {
        await updatePost(postId, { body: text.trim(), mediaUrls: images, taggedProfileId: taggedProfile?.id ?? null });
        router.replace(`/post/${postId}`);
      } else {
        await createPost(profile.id, text.trim(), images[0] ?? null, null, taggedProfile?.id ?? null, filterColor, images);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e?.message || 'La publication a échoué. Réessayez.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: isEditing ? 'Modifier la publication' : 'Nouvelle publication' }} />
      <TextInput
        style={styles.input}
        placeholder="Partagez une avancée, une actualité de votre projet..."
        value={text}
        onChangeText={setText}
        multiline
        autoFocus={!isEditing}
      />

      {images.length > 0 ? (
        <PostMediaTools
          images={images}
          onRemoveImage={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
          filterColor={filterColor}
          taggedProfile={taggedProfile}
          onInsertEmoji={(emoji) => setText((t) => t + emoji)}
          onFilterChange={setFilterColor}
          onTagChange={setTaggedProfile}
        />
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} disabled={picking}>
          {picking ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="attach" size={22} color={COLORS.primary} />}
          <Text style={styles.attachLabel}>Photo / Vidéo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishButton, (!text.trim() || posting) && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={!text.trim() || posting}
        >
          <Text style={styles.publishButtonText}>{posting ? '...' : isEditing ? 'Enregistrer' : 'Publier'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
    color: COLORS.textPrimary,
  },
  errorText: { color: COLORS.danger, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attachButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attachLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  publishButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22 },
  publishButtonDisabled: { opacity: 0.5 },
  publishButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
