import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { countUnreadNotifications } from '../lib/notifications';
import { COLORS } from '../constants/theme';

export function NotificationBell() {
  const { profile } = useAuth();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (profile) {
        countUnreadNotifications(profile.id).then((count) => {
          if (!cancelled) setUnread(count);
        });
      }
      return () => {
        cancelled = true;
      };
    }, [profile])
  );

  if (!profile) return null;

  return (
    <TouchableOpacity style={styles.button} onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
      <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 10, paddingVertical: 6 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
