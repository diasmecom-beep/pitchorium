import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ChipSelect } from './ChipSelect';
import { IMPACT_CRITERIA, IMPACT_LEVELS, computeImpactScore, labelForImpactTier, type ImpactScores } from '../constants/impact';

type Props = {
  scores: ImpactScores;
  onChange: (scores: ImpactScores) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
};

export function ImpactCriteriaForm({ scores, onChange, notes, onNotesChange }: Props) {
  const total = computeImpactScore(scores);

  const setLevel = (key: string, level: string[]) => {
    onChange({ ...scores, [key]: Number(level[0] ?? 0) });
  };

  return (
    <View>
      <View style={styles.scoreBox}>
        <Text style={styles.scoreValue}>{total}/100</Text>
        <Text style={styles.scoreTier}>{labelForImpactTier(total)}</Text>
      </View>
      <Text style={styles.hint}>
        Auto-évaluez la place de chaque critère dans votre projet. Ce score sert à vous situer dans le classement
        impact de Pitchorium et à orienter les mécènes/investisseurs sensibles à ces enjeux.
      </Text>

      {IMPACT_CRITERIA.map((criterion) => {
        const level = String(scores[criterion.key] ?? 0);
        return (
          <View key={criterion.key} style={styles.criterionBlock}>
            <Text style={styles.criterionLabel}>{criterion.label}</Text>
            <Text style={styles.criterionHelp}>{criterion.helpText}</Text>
            <ChipSelect options={IMPACT_LEVELS} selected={[level]} onChange={(v) => setLevel(criterion.key, v)} multiple={false} />
          </View>
        );
      })}

      <Text style={styles.label}>Précisions sur votre démarche d'impact (optionnel)</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={onNotesChange}
        multiline
        numberOfLines={4}
        placeholder="Ex: 30% de femmes dans l'équipe, matériaux recyclés, formation de 20 jeunes par an..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scoreBox: {
    backgroundColor: '#132D46',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  scoreTier: { color: '#c9c9d9', fontSize: 13, marginTop: 2 },
  hint: { fontSize: 12, color: '#888', marginBottom: 12 },
  criterionBlock: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E0D3',
    gap: 6,
  },
  criterionLabel: { fontWeight: '700', fontSize: 14, color: '#132D46' },
  criterionHelp: { fontSize: 12, color: '#777', marginBottom: 2 },
  label: { fontSize: 13, color: '#666', marginTop: 10, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
