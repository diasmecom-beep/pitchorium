import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecentPostPhotos, searchProfilesOnly } from '../lib/search';
import { COLORS } from '../constants/theme';
import type { Post, Profile } from '../types/database';

export default function Search() {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setPhotos(await fetchRecentPostPhotos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleChangeQuery = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setProfiles([]);
      return;
    }
    setSearching(true);
    setProfiles(await searchProfilesOnly(text));
    setSearching(false);
  };

  const displayName = (p: Profile) => (p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name);
  const showingSearch = query.trim().length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un profil"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleChangeQuery}
          autoFocus
        />
      </View>

      {showingSearch ? (
        <FlatList
          key="profiles-list"
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.profileList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{searching ? 'Recherche...' : 'Aucun profil trouvé.'}</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.profileRow} onPress={() => router.push(`/profile/${item.id}`)}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.profileInitial}>{displayName(item).charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View>
                <Text style={styles.profileName}>{displayName(item)}</Text>
                <Text style={styles.profileRole}>{item.role === 'entrepreneur' ? 'Entrepreneur' : 'Contributeur'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          key="photos-grid"
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune publication avec photo pour l'instant.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cell} onPress={() => router.push(`/profile/${item.author_id}`)}>
              <Image source={{ uri: item.image_url! }} style={styles.cellImage} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const GAP = 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    margin: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary },
  grid: { paddingHorizontal: GAP },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
  cell: { flex: 1 / 3, aspectRatio: 1, margin: GAP / 2 },
  cellImage: { width: '100%', height: '100%', backgroundColor: COLORS.border },
  profileList: { padding: 16, gap: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.border },
  profileAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: '#fff', fontWeight: '700' },
  profileName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  profileRole: { fontSize: 12, color: COLORS.textMuted },
});
