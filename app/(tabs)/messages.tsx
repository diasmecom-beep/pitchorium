import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import type { Conversation, Message, Profile } from '../../types/database';

type ConversationRow = {
  conversation: Conversation;
  other: Profile | null;
  lastMessage: Message | null;
  unreadCount: number;
};

export default function Messages() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_one_id.eq.${profile.id},participant_two_id.eq.${profile.id}`)
      .order('last_message_at', { ascending: false });

    const convs = (conversations as Conversation[]) ?? [];
    if (convs.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const otherIds = convs.map((c) => (c.participant_one_id === profile.id ? c.participant_two_id : c.participant_one_id));
    const convIds = convs.map((c) => c.id);

    const [{ data: others }, { data: messages }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', otherIds),
      supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: true }),
    ]);

    const othersById = new Map((others as Profile[] | null)?.map((p) => [p.id, p]) ?? []);
    const messagesByConv = new Map<string, Message[]>();
    (messages as Message[] | null)?.forEach((m) => {
      const list = messagesByConv.get(m.conversation_id) ?? [];
      list.push(m);
      messagesByConv.set(m.conversation_id, list);
    });

    const builtRows: ConversationRow[] = convs.map((c) => {
      const otherId = c.participant_one_id === profile.id ? c.participant_two_id : c.participant_one_id;
      const convMessages = messagesByConv.get(c.id) ?? [];
      const unreadCount = convMessages.filter((m) => m.sender_id !== profile.id && !m.read_at).length;
      return {
        conversation: c,
        other: othersById.get(otherId) ?? null,
        lastMessage: convMessages[convMessages.length - 1] ?? null,
        unreadCount,
      };
    });

    setRows(builtRows);
    setLoading(false);
  }, [profile]);

  // Filet pour la course entre le montage de cet écran et la fin du chargement du profil juste
  // après une connexion (voir le commentaire équivalent dans (tabs)/index.tsx).
  useEffect(() => {
    if (profile) load();
  }, [profile, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalUnread = useMemo(() => rows.reduce((sum, r) => sum + r.unreadCount, 0), [rows]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.conversation.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              Aucune conversation pour le moment. Rendez-vous sur un profil pour envoyer un message.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/conversation/${item.conversation.id}`)}
          >
            {item.other?.avatar_url ? (
              <Image source={{ uri: item.other.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <View style={styles.rowBody}>
              <Text style={styles.rowName}>
                {item.other?.role === 'entrepreneur'
                  ? item.other?.company_name || item.other?.full_name
                  : item.other?.full_name ?? 'Utilisateur'}
              </Text>
              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.lastMessage?.body ?? 'Nouvelle conversation'}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      {totalUnread > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>{totalUnread} message(s) non lu(s)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E7E0D3',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E7E0D3' },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE6D8' },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowPreview: { fontSize: 13, color: '#777', marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#132D46',
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#888', textAlign: 'center' },
  summaryBar: { padding: 10, alignItems: 'center', backgroundColor: '#F3EDE2' },
  summaryText: { fontSize: 12, color: '#555', fontWeight: '600' },
});
