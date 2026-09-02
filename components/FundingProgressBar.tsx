import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export function FundingProgressBar({ raised, goal }: { raised: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.amount}>
          {raised.toLocaleString('fr-FR')} € <Text style={styles.goal}>/ {goal.toLocaleString('fr-FR')} €</Text>
        </Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  track: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.success,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  goal: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  pct: { fontSize: 12, fontWeight: '700', color: COLORS.success },
});
