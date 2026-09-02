import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import { fetchNotifications, markAllNotificationsRead, notificationLabel, type NotificationRow } from '../lib/notifications';
import { COLORS, RADIUS } from '../constants/theme';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
}

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      let cancelled = false;
      (async () => {
        const data = await fetchNotifications(profile.id);
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
        await markAllNotificationsRead(profile.id);
      })();
      return () => {
        cancelled = true;
      };
    }, [profile])
  );

  const goToNotification = (row: NotificationRow) => {
    const { notification } = row;
    if (notification.post_id) {
      router.push(`/post/${notification.post_id}`);
    } else if (notification.actor_id) {
      router.push(`/profile/${notification.actor_id}`);
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
    <FlatList
      data={rows}
      keyExtractor={(item) => item.notification.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const actorName = item.actor
          ? item.actor.role === 'entrepreneur'
            ? item.actor.company_name || item.actor.full_name
            : item.actor.full_name
          : 'Quelqu\'un';
        return (
          <TouchableOpacity
            style={[styles.row, !item.notification.read_at && styles.rowUnread]}
            onPress={() => goToNotification(item)}
          >
            {item.actor?.avatar_url ? (
              <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{actorName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{notificationLabel(item.notification, actorName)}</Text>
              <Text style={styles.time}>{timeAgo(item.notification.created_at)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: COLORS.textMuted },
  list: { padding: 12, gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
  },
  rowUnread: { backgroundColor: COLORS.primary + '0d' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.border },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700' },
  label: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 19 },
  time: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
