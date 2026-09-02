import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthProvider';
import { fetchFollowers } from '../../../lib/feed';
import { COLORS } from '../../../constants/theme';
import type { Profile } from '../../../types/database';

export default function Followers() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: myProfile } = useAuth();
  const [owner, setOwner] = useState<Profile | null>(null);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let active = true;
      setLoading(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
        .then(async ({ data }) => {
          if (!active) return;
          const ownerProfile = data as Profile | null;
          setOwner(ownerProfile);
          const canView = ownerProfile && (ownerProfile.followers_visible || ownerProfile.id === myProfile?.id);
          if (canView) {
            const list = await fetchFollowers(id);
            if (active) setFollowers(list);
          }
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id, myProfile])
  );

  const displayName = (p: Profile) => (p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const canView = owner && (owner.followers_visible || owner.id === myProfile?.id);

  if (!canView) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Ce profil a choisi de ne pas rendre sa liste d'abonnés publique.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={followers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucun abonné pour l'instant.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => router.push(`/profile/${item.id}`)}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{displayName(item).charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{displayName(item)}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center' },
  list: { padding: 16, gap: 4, backgroundColor: COLORS.background, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.border },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
});
