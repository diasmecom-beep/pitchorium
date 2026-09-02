import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import type { Profile } from '../types/database';
import type { StoryGroup } from '../lib/stories';

export function StoriesBar({
  groups,
  ownProfile,
  onAddStory,
  onOpenGroup,
}: {
  groups: StoryGroup[];
  ownProfile: Profile;
  onAddStory: () => void;
  onOpenGroup: (index: number) => void;
}) {
  const ownGroupIndex = groups.findIndex((g) => g.author.id === ownProfile.id);
  const hasOwnStory = ownGroupIndex >= 0;
  const otherGroups = groups.filter((g) => g.author.id !== ownProfile.id);

  const displayName = (p: Profile) => (p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => (hasOwnStory ? onOpenGroup(ownGroupIndex) : onAddStory())}
        onLongPress={onAddStory}
      >
        <View style={[styles.ring, hasOwnStory && styles.ringActive]}>
          {ownProfile.avatar_url ? (
            <Image source={{ uri: ownProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{displayName(ownProfile).charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {!hasOwnStory && (
            <TouchableOpacity style={styles.addBadge} onPress={onAddStory}>
              <Text style={styles.addBadgeText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.label} numberOfLines={1}>
          Votre story
        </Text>
      </TouchableOpacity>

      {otherGroups.map((group) => {
        const realIndex = groups.indexOf(group);
        return (
          <TouchableOpacity key={group.author.id} style={styles.item} onPress={() => onOpenGroup(realIndex)}>
            <View style={[styles.ring, styles.ringActive]}>
              {group.author.avatar_url ? (
                <Image source={{ uri: group.author.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{displayName(group.author).charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {displayName(group.author)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const RING = 68;
const AVATAR = 60;

const styles = StyleSheet.create({
  row: { gap: 14, paddingBottom: 6, paddingHorizontal: 2 },
  item: { alignItems: 'center', width: 72 },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringActive: { borderColor: COLORS.accent },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: COLORS.border },
  avatarPlaceholder: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 20 },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  addBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13, lineHeight: 14 },
  label: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
