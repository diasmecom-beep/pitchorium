import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { FundingProgressBar } from './FundingProgressBar';
import { ImpactBadge } from './ImpactBadge';
import { COLORS, RADIUS, CARD_SHADOW } from '../constants/theme';
import type { Project } from '../types/database';

export function EntrepreneurProjectPortfolio({ ownerId }: { ownerId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [ownerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return null;

  const ongoing = projects.filter((p) => p.status === 'published');
  const done = projects.filter((p) => p.status === 'funded' || p.status === 'closed');

  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.sectionTitle}>Projets en cours</Text>
      {ongoing.length === 0 ? (
        <Text style={styles.emptyText}>Aucun projet en cours.</Text>
      ) : (
        ongoing.map((p) => (
          <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/project/${p.id}`)}>
            <Text style={styles.cardTitle}>{p.title}</Text>
            <Text style={styles.cardMeta}>
              {p.sector} · {p.country}
            </Text>
            <FundingProgressBar raised={p.amount_raised} goal={p.funding_goal} />
            <ImpactBadge score={p.impact_score} compact />
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Projets terminés</Text>
      {done.length === 0 ? (
        <Text style={styles.emptyText}>Aucun projet terminé pour l'instant.</Text>
      ) : (
        done.map((p) => (
          <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/project/${p.id}`)}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <View style={[styles.statusBadge, p.status === 'funded' && styles.statusBadgeFunded]}>
                <Text style={styles.statusBadgeText}>{p.status === 'funded' ? 'Financé' : 'Clôturé'}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>
              {p.sector} · {p.country}
            </Text>
            <FundingProgressBar raised={p.amount_raised} goal={p.funding_goal} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: 13, marginBottom: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 6,
    marginBottom: 10,
    ...CARD_SHADOW,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  cardMeta: { fontSize: 12, color: COLORS.textMuted },
  statusBadge: { backgroundColor: COLORS.textMuted, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  statusBadgeFunded: { backgroundColor: COLORS.success },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
