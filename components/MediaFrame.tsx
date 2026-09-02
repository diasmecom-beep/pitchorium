import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { isVideoUrl } from '../lib/mediaType';
import { COLORS } from '../constants/theme';

// Affiche un média (photo ou vidéo) en occupant tout l'espace disponible du conteneur parent —
// utilisé pour les galeries plein écran (largeur écran) des publications, stories et éditeurs.
export function MediaFrame({ url }: { url: string }) {
  if (!url) return null;
  if (isVideoUrl(url)) {
    if (Platform.OS === 'web') {
      return <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' }} />;
    }
    return (
      <TouchableOpacity style={styles.videoFallback} onPress={() => Linking.openURL(url)}>
        <Text style={styles.playIcon}>▶️</Text>
        <Text style={styles.videoText}>Voir la vidéo</Text>
      </TouchableOpacity>
    );
  }
  return <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%', backgroundColor: COLORS.border },
  videoFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary },
  playIcon: { fontSize: 28 },
  videoText: { color: '#fff', fontWeight: '600' },
});
