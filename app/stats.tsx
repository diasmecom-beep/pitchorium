import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import {
  STATS_WINDOWS,
  countFollowEvents,
  countProfileViews,
  profileViewsByWeek,
} from '../lib/stats';
import { COLORS, RADIUS, CARD_SHADOW } from '../constants/theme';

type WindowStats = { views: number; gained: number; lost: number };

export default function StatsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [byWindow, setByWindow] = useState<Record<number, WindowStats>>({});
  const [weekly, setWeekly] = useState<{ weekStart: string; count: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      let cancelled = false;
      (async () => {
        setLoading(true);
        const results = await Promise.all(
          STATS_WINDOWS.map(async (w) => {
            const [views, follows] = await Promise.all([
              countProfileViews(profile.id, w.days),
              countFollowEvents(profile.id, w.days),
            ]);
            return [w.days, { views, gained: follows.gained, lost: follows.lost }] as const;
          })
        );
        const weeks = await profileViewsByWeek(profile.id, 182);
        if (!cancelled) {
          setByWindow(Object.fromEntries(results));
          setWeekly(weeks);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [profile])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const maxWeekly = Math.max(1, ...weekly.map((w) => w.count));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Vues de profil</Text>
      <View style={styles.cardsRow}>
        {STATS_WINDOWS.map((w) => (
          <View key={w.days} style={styles.statCard}>
            <Text style={styles.statValue}>{byWindow[w.days]?.views ?? 0}</Text>
            <Text style={styles.statLabel}>{w.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Évolution hebdomadaire (6 derniers mois)</Text>
      <View style={styles.chart}>
        {weekly.length === 0 ? (
          <Text style={styles.emptyText}>Pas encore assez de données pour afficher un graphe.</Text>
        ) : (
          weekly.map((w) => (
            <View key={w.weekStart} style={styles.barRow}>
              <Text style={styles.barLabel}>
                {new Date(w.weekStart).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(w.count / maxWeekly) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{w.count}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Abonnés gagnés / perdus</Text>
      <View style={{ gap: 10 }}>
        {STATS_WINDOWS.map((w) => {
          const stats = byWindow[w.days] ?? { gained: 0, lost: 0, views: 0 };
          return (
            <View key={w.days} style={styles.followRow}>
              <Text style={styles.followWindowLabel}>{w.label}</Text>
              <View style={styles.followCounts}>
                <Text style={styles.followGained}>+{stats.gained}</Text>
                <Text style={styles.followLost}>-{stats.lost}</Text>
                <Text style={styles.followNet}>Net : {stats.gained - stats.lost >= 0 ? '+' : ''}{stats.gained - stats.lost}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginTop: 14, marginBottom: 4 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minWidth: '30%',
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  chart: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 8,
    ...CARD_SHADOW,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 44, fontSize: 11, color: COLORS.textMuted },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: COLORS.border, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 5 },
  barValue: { width: 24, fontSize: 12, color: COLORS.textPrimary, textAlign: 'right' },
  followRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  followWindowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  followCounts: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  followGained: { color: COLORS.success, fontWeight: '700' },
  followLost: { color: COLORS.danger, fontWeight: '700' },
  followNet: { color: COLORS.textMuted, fontSize: 12 },
});
