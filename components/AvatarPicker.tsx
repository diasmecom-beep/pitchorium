import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { pickAndUploadAvatar } from '../lib/mediaUpload';

type Props = {
  userId: string;
  avatarUrl: string | null;
  onChange: (url: string) => void;
};

export function AvatarPicker({ userId, avatarUrl, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    setError(null);
    setUploading(true);
    try {
      const url = await pickAndUploadAvatar(userId);
      if (url) onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.row}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <TouchableOpacity style={styles.button} onPress={handlePick} disabled={uploading}>
        <Text style={styles.buttonText}>
          {uploading ? 'Envoi...' : avatarUrl ? 'Changer la photo' : '+ Ajouter une photo de profil'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E7E0D3' },
  placeholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EDE6D8' },
  button: {
    borderWidth: 1,
    borderColor: '#132D46',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonText: { color: '#132D46', fontWeight: '600', fontSize: 14 },
  error: { color: '#B3452C', fontSize: 12 },
});
