import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { ChipSelect } from '../../../components/ChipSelect';
import { labelForFundingInstrument } from '../../../constants/taxonomy';
import type { CampaignReward, CampaignTier, CampaignUpdate, Pledge, Project } from '../../../types/database';

type PledgeWithBacker = Pledge & { backer: { full_name: string } | null };

const MAX_TIERS = 5;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ManageCampaign() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tiers, setTiers] = useState<CampaignTier[]>([]);
  const [rewards, setRewards] = useState<CampaignReward[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [pledges, setPledges] = useState<PledgeWithBacker[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: p }, { data: t }, { data: r }, { data: u }, { data: pl }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('campaign_tiers').select('*').eq('project_id', id).order('amount'),
      supabase.from('campaign_rewards').select('*').eq('project_id', id).order('min_amount'),
      supabase.from('campaign_updates').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('pledges').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ]);
    const pledgeRows = (pl as Pledge[]) ?? [];
    const backerIds = [...new Set(pledgeRows.map((pledge) => pledge.backer_id))];
    const { data: backers } = backerIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', backerIds)
      : { data: [] as { id: string; full_name: string }[] };
    const backerById = new Map((backers ?? []).map((b) => [b.id, b.full_name]));

    setProject(p as Project | null);
    setTiers((t as CampaignTier[]) ?? []);
    setRewards((r as CampaignReward[]) ?? []);
    setUpdates((u as CampaignUpdate[]) ?? []);
    setPledges(
      pledgeRows.map((pledge) => ({
        ...pledge,
        backer: { full_name: backerById.get(pledge.backer_id) ?? 'Contributeur' },
      }))
    );
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const [tierAmount, setTierAmount] = useState('');
  const [tierTitle, setTierTitle] = useState('');
  const [tierDescription, setTierDescription] = useState('');
  const [tierSaving, setTierSaving] = useState(false);

  const addTier = async () => {
    if (!project || tiers.length >= MAX_TIERS) return;
    if (!(Number(tierAmount) > 0) || !tierTitle.trim() || !tierDescription.trim()) return;
    setTierSaving(true);
    await supabase.from('campaign_tiers').insert({
      project_id: project.id,
      amount: Number(tierAmount) || 0,
      title: tierTitle,
      description: tierDescription,
      sort_order: tiers.length,
    });
    setTierAmount('');
    setTierTitle('');
    setTierDescription('');
    setTierSaving(false);
    load();
  };

  const deleteTier = async (tierId: string) => {
    await supabase.from('campaign_tiers').delete().eq('id', tierId);
    load();
  };

  const [rewardMinAmount, setRewardMinAmount] = useState('');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardInstruments, setRewardInstruments] = useState<string[]>([]);
  const [rewardQuantity, setRewardQuantity] = useState('');
  const [rewardSaving, setRewardSaving] = useState(false);

  const addReward = async () => {
    if (!project) return;
    setRewardSaving(true);
    await supabase.from('campaign_rewards').insert({
      project_id: project.id,
      min_amount: Number(rewardMinAmount) || 0,
      title: rewardTitle,
      description: rewardDescription,
      applicable_instruments: rewardInstruments,
      quantity_available: rewardQuantity ? Number(rewardQuantity) : null,
    });
    setRewardMinAmount('');
    setRewardTitle('');
    setRewardDescription('');
    setRewardInstruments([]);
    setRewardQuantity('');
    setRewardSaving(false);
    load();
  };

  const deleteReward = async (rewardId: string) => {
    await supabase.from('campaign_rewards').delete().eq('id', rewardId);
    load();
  };

  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [updateSaving, setUpdateSaving] = useState(false);

  const addUpdate = async () => {
    if (!project) return;
    setUpdateSaving(true);
    await supabase.from('campaign_updates').insert({
      project_id: project.id,
      title: updateTitle,
      body: updateBody,
    });
    setUpdateTitle('');
    setUpdateBody('');
    setUpdateSaving(false);
    load();
  };

  const [markingId, setMarkingId] = useState<string | null>(null);

  const markPledgeReceived = async (pledge: PledgeWithBacker) => {
    if (!project) return;
    setMarkingId(pledge.id);
    await supabase.from('pledges').update({ status: 'completed' }).eq('id', pledge.id);
    await supabase
      .from('projects')
      .update({ amount_raised: project.amount_raised + pledge.amount })
      .eq('id', project.id);
    setMarkingId(null);
    load();
  };

  if (loading || !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const acceptsLoveMoneyOnly =
    project.funding_instruments_accepted.length === 1 && project.funding_instruments_accepted[0] === 'Love money';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Paliers de financement">
        <Text style={styles.hint}>
          Chaque palier est débloqué dès que le montant collecté l'atteint, même si l'objectif total n'est pas
          encore atteint.
        </Text>
        {tiers.map((tier) => (
          <View key={tier.id} style={styles.card}>
            <Text style={styles.cardAmount}>{tier.amount.toLocaleString('fr-FR')} €</Text>
            <Text style={styles.cardTitle}>{tier.title}</Text>
            <Text style={styles.cardBody}>{tier.description}</Text>
            <TouchableOpacity onPress={() => deleteTier(tier.id)}>
              <Text style={styles.deleteText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))}

        {tiers.length === 0 && (
          <Text style={styles.hint}>
            Aucun palier défini. Ajoutez-en au moins un pour indiquer clairement à quoi servira chaque montant
            collecté.
          </Text>
        )}

        {tiers.length >= MAX_TIERS ? (
          <Text style={styles.hint}>Maximum de {MAX_TIERS} paliers atteint.</Text>
        ) : (
          <>
            <Text style={styles.label}>Montant du palier (€)</Text>
            <TextInput style={styles.input} value={tierAmount} onChangeText={setTierAmount} keyboardType="numeric" />
            <Text style={styles.label}>Titre (ex: "Premier lot produit")</Text>
            <TextInput style={styles.input} value={tierTitle} onChangeText={setTierTitle} />
            <Text style={styles.label}>Ce que ce palier permet de faire</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={tierDescription}
              onChangeText={setTierDescription}
              multiline
            />
            <TouchableOpacity style={styles.buttonSecondary} onPress={addTier} disabled={tierSaving}>
              <Text style={styles.buttonSecondaryText}>
                {tierSaving ? 'Ajout...' : `+ Ajouter ce palier (${tiers.length}/${MAX_TIERS})`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Section>

      <Section title="Contreparties">
        {acceptsLoveMoneyOnly ? (
          <Text style={styles.hint}>
            Votre projet n'accepte que le "Love money" : pas de contrepartie matérielle attendue, seulement un
            engagement de soutien de la part des contributeurs et un retour d'expérience de votre part (voir
            "Actualités" ci-dessous).
          </Text>
        ) : (
          <>
            <Text style={styles.hint}>
              Définissez des contreparties par type de financement (ex: réservées aux investisseurs en equity).
              Laissez vide pour qu'une contrepartie s'applique à tous les types acceptés.
            </Text>
            {rewards.map((reward) => (
              <View key={reward.id} style={styles.card}>
                <Text style={styles.cardAmount}>À partir de {reward.min_amount.toLocaleString('fr-FR')} €</Text>
                <Text style={styles.cardTitle}>{reward.title}</Text>
                <Text style={styles.cardBody}>{reward.description}</Text>
                {reward.applicable_instruments.length > 0 && (
                  <Text style={styles.cardMeta}>
                    Réservé à : {reward.applicable_instruments.map(labelForFundingInstrument).join(', ')}
                  </Text>
                )}
                <TouchableOpacity onPress={() => deleteReward(reward.id)}>
                  <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.label}>Montant minimum (€)</Text>
            <TextInput
              style={styles.input}
              value={rewardMinAmount}
              onChangeText={setRewardMinAmount}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Titre de la contrepartie</Text>
            <TextInput style={styles.input} value={rewardTitle} onChangeText={setRewardTitle} />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rewardDescription}
              onChangeText={setRewardDescription}
              multiline
            />
            <Text style={styles.label}>Réservée à ces types de financement (optionnel)</Text>
            <ChipSelect
              options={project.funding_instruments_accepted}
              selected={rewardInstruments}
              onChange={setRewardInstruments}
            />
            <Text style={styles.label}>Quantité disponible (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={rewardQuantity}
              onChangeText={setRewardQuantity}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.buttonSecondary} onPress={addReward} disabled={rewardSaving}>
              <Text style={styles.buttonSecondaryText}>{rewardSaving ? 'Ajout...' : '+ Ajouter cette contrepartie'}</Text>
            </TouchableOpacity>
          </>
        )}
      </Section>

      <Section title="Contributions reçues">
        <Text style={styles.hint}>
          Pitchorium ne traite pas les paiements : confirmez manuellement chaque contribution une fois le
          paiement effectivement reçu (virement, mobile money, etc.). Cela met à jour le montant collecté et
          débloque les paliers concernés.
        </Text>
        {pledges.length === 0 && <Text style={styles.hint}>Aucune contribution pour le moment.</Text>}
        {pledges.map((pledge) => (
          <View key={pledge.id} style={styles.card}>
            <Text style={styles.cardAmount}>{pledge.amount.toLocaleString('fr-FR')} €</Text>
            <Text style={styles.cardTitle}>{pledge.backer?.full_name ?? 'Contributeur'}</Text>
            <Text style={styles.cardMeta}>
              {pledge.funding_instrument} · {pledge.payment_method} ·{' '}
              {pledge.status === 'completed' ? 'Reçu' : 'En attente'}
            </Text>
            {pledge.status !== 'completed' && (
              <TouchableOpacity onPress={() => markPledgeReceived(pledge)} disabled={markingId === pledge.id}>
                <Text style={styles.confirmText}>
                  {markingId === pledge.id ? 'Confirmation...' : 'Marquer comme reçu'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </Section>

      <Section title="Actualités">
        <Text style={styles.hint}>
          Tenez vos contributeurs informés — c'est particulièrement important pour les contributeurs "love money"
          à qui vous devez un retour d'expérience.
        </Text>
        {updates.map((update) => (
          <View key={update.id} style={styles.card}>
            <Text style={styles.cardTitle}>{update.title}</Text>
            <Text style={styles.cardBody}>{update.body}</Text>
          </View>
        ))}
        <Text style={styles.label}>Titre</Text>
        <TextInput style={styles.input} value={updateTitle} onChangeText={setUpdateTitle} />
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={updateBody}
          onChangeText={setUpdateBody}
          multiline
        />
        <TouchableOpacity style={styles.buttonSecondary} onPress={addUpdate} disabled={updateSaving}>
          <Text style={styles.buttonSecondaryText}>{updateSaving ? 'Publication...' : '+ Publier une actualité'}</Text>
        </TouchableOpacity>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 60, gap: 8 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  hint: { fontSize: 12, color: '#888', marginBottom: 8 },
  label: { fontSize: 13, color: '#666', marginTop: 8, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  card: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E0D3',
    gap: 2,
  },
  cardAmount: { fontWeight: '700', color: '#132D46' },
  cardTitle: { fontWeight: '600', fontSize: 15 },
  cardBody: { color: '#444', fontSize: 14 },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  deleteText: { color: '#B3452C', fontSize: 13, marginTop: 6 },
  confirmText: { color: '#2e7d32', fontSize: 13, marginTop: 6, fontWeight: '600' },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#132D46',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: { color: '#132D46', fontWeight: '600' },
});
