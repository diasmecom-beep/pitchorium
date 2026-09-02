import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IMPACT_CRITERIA, IMPACT_LEVELS, labelForImpactTier } from '../constants/impact';
import { COLORS } from '../constants/theme';

type Props = {
  score: number;
  scores?: Record<string, number> | null;
  notes?: string | null;
  compact?: boolean;
};

export function ImpactBadge({ score, scores, notes, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  if (!score) return null;

  const hasDetail = !!scores;

  const badge = (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>
        🌍 {score}/100 · {labelForImpactTier(score)}
        {hasDetail ? '  ›' : ''}
      </Text>
    </View>
  );

  if (!hasDetail) return badge;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Détail du score d'impact</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.closeText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{score}/100</Text>
              <Text style={styles.scoreTier}>{labelForImpactTier(score)}</Text>
            </View>

            <Text style={styles.disclaimer}>
              Auto-évaluation déclarée par l'entrepreneur, non vérifiée par Pitchorium.
            </Text>

            <ScrollView style={styles.list}>
              {IMPACT_CRITERIA.map((criterion) => {
                const level = scores?.[criterion.key] ?? 0;
                const levelLabel = IMPACT_LEVELS.find((l) => Number(l.value) === level)?.label ?? 'Non concerné';
                return (
                  <View key={criterion.key} style={styles.row}>
                    <View style={styles.rowHeader}>
                      <Text style={styles.rowLabel}>{criterion.label}</Text>
                      <View style={styles.dots}>
                        {[1, 2, 3].map((d) => (
                          <View key={d} style={[styles.dot, d <= level && styles.dotFilled]} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.rowLevel}>{levelLabel}</Text>
                  </View>
                );
              })}

              {notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>Précisions</Text>
                  <Text style={styles.notesText}>{notes}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.successLight,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  badgeCompact: { paddingVertical: 3, paddingHorizontal: 8, marginTop: 4 },
  text: { color: COLORS.success, fontWeight: '700', fontSize: 13 },
  textCompact: { fontSize: 11 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  closeText: { color: COLORS.primary, fontWeight: '600' },
  scoreBox: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 4 },
  scoreValue: { color: '#fff', fontSize: 26, fontWeight: '800' },
  scoreTier: { color: COLORS.accentLight, fontSize: 13, marginTop: 2 },
  disclaimer: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 8 },
  list: { marginTop: 4 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1, paddingRight: 8 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotFilled: { backgroundColor: COLORS.success },
  rowLevel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  notesBox: { marginTop: 12, marginBottom: 20, backgroundColor: COLORS.background, borderRadius: 10, padding: 12 },
  notesTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  notesText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
