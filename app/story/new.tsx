import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { createStoryBatch } from '../../lib/stories';
import { pickAndUploadMultipleMedia } from '../../lib/mediaUpload';
import { MediaComposer, type MediaComposerResult } from '../../components/MediaComposer';
import { COLORS } from '../../constants/theme';

export default function NewStory() {
  const { profile } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    if (!profile) return;
    setError(null);
    setPicking(true);
    try {
      const items = await pickAndUploadMultipleMedia(profile.id);
      if (items.length > 0) {
        setImages(items.map((i) => i.url));
      }
    } catch (e: any) {
      setError(e?.message || "Impossible d'ajouter ces fichiers. Réessayez.");
    } finally {
      setPicking(false);
    }
  };

  const handlePublish = async (result: MediaComposerResult) => {
    if (!profile || images.length === 0) return;
    setError(null);
    setPublishing(true);
    try {
      await createStoryBatch(profile.id, images, result.caption, result.color, result.taggedProfileId);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || "La publication de la story a échoué. Réessayez.");
    } finally {
      setPublishing(false);
    }
  };

  if (images.length === 0) {
    return (
      <View style={styles.center}>
        {picking ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : (
          <TouchableOpacity style={styles.pickButton} onPress={handlePick}>
            <Ionicons name="attach" size={26} color="#fff" />
            <Text style={styles.pickButtonText}>Ajouter des photos ou vidéos</Text>
          </TouchableOpacity>
        )}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <MediaComposer
      images={images}
      publishing={publishing}
      submitLabel="Envoyer la story"
      errorMessage={error}
      onCancel={() => router.back()}
      onPublish={handlePublish}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', gap: 16, padding: 24 },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  pickButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#ff8a80', textAlign: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.7)', marginTop: 8 },
});
