import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthProvider';
import { ChipSelect } from '../../../components/ChipSelect';
import { spendFromBalance } from '../../../lib/walletBalance';
import { PAYMENT_METHODS } from '../../../constants/taxonomy';
import { COLORS } from '../../../constants/theme';
import type { CampaignReward, Project } from '../../../types/database';

export default function Pledge() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, refreshProfile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [rewards, setRewards] = useState<CampaignReward[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('campaign_rewards').select('*').eq('project_id', id).order('min_amount'),
      ]).then(([{ data: p }, { data: r }]) => {
        if (active) {
          setProject(p as Project | null);
          setRewards((r as CampaignReward[]) ?? []);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  const [amount, setAmount] = useState('');
  const [instrument, setInstrument] = useState<string[]>([]);
  const [rewardId, setRewardId] = useState<string[]>([]);
  const [commitment, setCommitment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string[]>([]);
  const [payFromBalance, setPayFromBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const chosenInstrument = instrument[0];
  const isLoveMoney = chosenInstrument === 'Love money';
  const amountNumber = Number(amount) || 0;

  const eligibleRewards = useMemo(() => {
    return rewards.filter(
      (r) =>
        r.min_amount <= amountNumber &&
        (r.applicable_instruments.length === 0 || (chosenInstrument && r.applicable_instruments.includes(chosenInstrument)))
    );
  }, [rewards, amountNumber, chosenInstrument]);

  const nextTierHint =
    project && amountNumber > 0
      ? `Ce montant s'ajoutera aux ${project.amount_raised.toLocaleString('fr-FR')} € déjà collectés.`
      : null;

  const handleSubmit = async () => {
    if (!profile || !project) return;
    setError(null);
    if (!chosenInstrument) {
      setError('Choisissez un type de financement.');
      return;
    }
    if (isLoveMoney && !commitment) {
      setError("Cochez la case d'engagement pour continuer.");
      return;
    }
    if (!payFromBalance && !paymentMethod[0]) {
      setError('Choisissez un moyen de paiement.');
      return;
    }
    if (payFromBalance && amountNumber > (profile.available_balance ?? 0)) {
      setError('Le montant dépasse votre solde disponible.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('pledges').insert({
      project_id: project.id,
      backer_id: profile.id,
      amount: amountNumber,
      funding_instrument: chosenInstrument,
      reward_id: isLoveMoney ? null : rewardId[0] ?? null,
      payment_method: payFromBalance ? 'Solde Pitchorium' : paymentMethod[0],
      commitment_accepted: isLoveMoney ? commitment : false,
    });
    if (!insertError && payFromBalance) {
      await spendFromBalance(profile.id, profile.available_balance ?? 0, amountNumber, `Contribution — ${project.title}`);
      await refreshProfile();
    }
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
  };

  if (loading || !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Merci pour votre soutien !</Text>
        <Text style={styles.body}>
          Votre contribution de {amountNumber.toLocaleString('fr-FR')} € a été enregistrée avec le statut « en
          attente ». Pitchorium ne traite pas encore de paiement réel : l'entrepreneur confirmera la réception
          des fonds via son moyen de paiement choisi, ce qui débloquera officiellement les paliers concernés.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace(`/project/${project.id}`)}>
          <Text style={styles.buttonText}>Retour au projet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Soutenir {project.title}</Text>

      <Text style={styles.label}>Montant (€)</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
      {nextTierHint ? <Text style={styles.hint}>{nextTierHint}</Text> : null}

      <Text style={styles.label}>Type de financement</Text>
      <ChipSelect
        options={project.funding_instruments_accepted}
        selected={instrument}
        onChange={setInstrument}
        multiple={false}
      />

      {isLoveMoney ? (
        <TouchableOpacity style={styles.commitmentBox} onPress={() => setCommitment(!commitment)}>
          <View style={[styles.checkbox, commitment && styles.checkboxChecked]} />
          <Text style={styles.commitmentText}>
            Je m'engage à soutenir ce projet en connaissance de cause, sans attendre de contrepartie matérielle.
            En échange, l'entrepreneur s'engage à me tenir informé(e) de l'avancement via les actualités du
            projet.
          </Text>
        </TouchableOpacity>
      ) : (
        eligibleRewards.length > 0 && (
          <>
            <Text style={styles.label}>Contrepartie (optionnel)</Text>
            <ChipSelect
              options={eligibleRewards.map((r) => ({ value: r.id, label: r.title }))}
              selected={rewardId}
              onChange={setRewardId}
              multiple={false}
            />
          </>
        )
      )}

      {profile && (profile.available_balance ?? 0) > 0 && (
        <TouchableOpacity style={styles.balanceOption} onPress={() => setPayFromBalance((v) => !v)}>
          <View style={[styles.checkbox, payFromBalance && styles.checkboxChecked]} />
          <Text style={styles.balanceOptionText}>
            Payer avec mon solde disponible ({(profile.available_balance ?? 0).toLocaleString('fr-FR')} €)
          </Text>
        </TouchableOpacity>
      )}

      {!payFromBalance && (
        <>
          <Text style={styles.label}>Moyen de paiement</Text>
          <ChipSelect options={PAYMENT_METHODS} selected={paymentMethod} onChange={setPaymentMethod} multiple={false} />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Envoi...' : 'Confirmer ma contribution'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 8, paddingBottom: 60 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 20 },
  label: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 2 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  commitmentBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F3EDE2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#132D46',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#132D46' },
  balanceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  balanceOptionText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  commitmentText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 19 },
  button: {
    backgroundColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#B3452C', marginTop: 8 },
});
