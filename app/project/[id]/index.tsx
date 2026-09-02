import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthProvider';
import { labelForFundingInstrument } from '../../../constants/taxonomy';
import { ImpactBadge } from '../../../components/ImpactBadge';
import { COLORS } from '../../../constants/theme';
import type { CampaignReward, CampaignTier, CampaignUpdate, Profile, Project } from '../../../types/database';

function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [tiers, setTiers] = useState<CampaignTier[]>([]);
  const [rewards, setRewards] = useState<CampaignReward[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('campaign_tiers').select('*').eq('project_id', id).order('amount'),
        supabase.from('campaign_rewards').select('*').eq('project_id', id).order('min_amount'),
        supabase.from('campaign_updates').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ]).then(([{ data: p }, { data: t }, { data: r }, { data: u }]) => {
        if (active) {
          setProject(p as Project | null);
          setTiers((t as CampaignTier[]) ?? []);
          setRewards((r as CampaignReward[]) ?? []);
          setUpdates((u as CampaignUpdate[]) ?? []);
          setLoading(false);
        }
        const ownerId = (p as Project | null)?.owner_id;
        if (ownerId) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', ownerId)
            .single()
            .then(({ data: o }) => {
              if (active) setOwner(o as Profile | null);
            });
        }
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  const handleInterest = async () => {
    if (!profile || !project) return;
    setSending(true);
    const { error } = await supabase.from('project_interests').insert({
      project_id: project.id,
      investor_id: profile.id,
      message: message || null,
    });
    setSending(false);
    if (!error) setSent(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text>Projet introuvable.</Text>
      </View>
    );
  }

  const isOwner = profile?.id === project.owner_id;
  const progressPct = project.funding_goal > 0 ? Math.min(100, (project.amount_raised / project.funding_goal) * 100) : 0;
  const remainingDays = daysLeft(project.deadline);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {project.gallery_urls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {project.gallery_urls.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.galleryImage} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.meta}>
        {project.sector} · {project.impact_area} · {project.country}
      </Text>
      {owner && (
        <TouchableOpacity onPress={() => router.push(`/profile/${owner.id}`)}>
          <Text style={styles.ownerLink}>
            Porté par {owner.role === 'entrepreneur' ? owner.company_name || owner.full_name : owner.full_name}
          </Text>
        </TouchableOpacity>
      )}
      <ImpactBadge score={project.impact_score} scores={project.impact_scores} notes={project.impact_notes} />

      {project.video_url ? (
        <TouchableOpacity onPress={() => Linking.openURL(project.video_url!)}>
          <Text style={styles.videoLink}>▶ Voir la vidéo de présentation</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.fundingBox}>
        <Text style={styles.fundingText}>
          {project.amount_raised.toLocaleString('fr-FR')} € collectés sur{' '}
          {project.funding_goal.toLocaleString('fr-FR')} €
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        {remainingDays !== null && (
          <Text style={styles.deadlineText}>
            {remainingDays > 0 ? `${remainingDays} jour(s) restant(s)` : 'Campagne terminée'}
          </Text>
        )}
        {project.funding_instruments_accepted.length > 0 && (
          <Text style={styles.instrumentsText}>
            Financements acceptés : {project.funding_instruments_accepted.join(', ')}
          </Text>
        )}
      </View>

      {isOwner && (
        <TouchableOpacity style={styles.manageButton} onPress={() => router.push(`/project/${project.id}/manage`)}>
          <Text style={styles.manageButtonText}>Gérer la campagne</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Résumé</Text>
      <Text style={styles.body}>{project.summary}</Text>

      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.body}>{project.description}</Text>

      {tiers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Paliers de financement</Text>
          {tiers.map((tier) => {
            const unlocked = project.amount_raised >= tier.amount;
            return (
              <View key={tier.id} style={[styles.tierCard, unlocked && styles.tierCardUnlocked]}>
                <Text style={styles.tierAmount}>
                  {unlocked ? '✓ ' : ''}
                  {tier.amount.toLocaleString('fr-FR')} €
                </Text>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.body}>{tier.description}</Text>
              </View>
            );
          })}
        </>
      )}

      {rewards.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Contreparties</Text>
          {rewards.map((reward) => (
            <View key={reward.id} style={styles.tierCard}>
              <Text style={styles.tierAmount}>À partir de {reward.min_amount.toLocaleString('fr-FR')} €</Text>
              <Text style={styles.tierTitle}>{reward.title}</Text>
              <Text style={styles.body}>{reward.description}</Text>
              {reward.applicable_instruments.length > 0 && (
                <Text style={styles.meta}>
                  Réservé à : {reward.applicable_instruments.map(labelForFundingInstrument).join(', ')}
                </Text>
              )}
            </View>
          ))}
        </>
      )}

      {project.funding_instruments_accepted.length === 1 &&
        project.funding_instruments_accepted[0] === 'Love money' && (
          <Text style={styles.body}>
            Ce projet est financé en love money : pas de contrepartie matérielle, mais un engagement de soutien
            et des retours d'expérience réguliers de l'entrepreneur.
          </Text>
        )}

      {!isOwner && project.status === 'published' && project.funding_instruments_accepted.length > 0 && (
        <TouchableOpacity style={styles.button} onPress={() => router.push(`/project/${project.id}/pledge`)}>
          <Text style={styles.buttonText}>Contribuer au financement</Text>
        </TouchableOpacity>
      )}

      {updates.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Actualités</Text>
          {updates.map((update) => (
            <View key={update.id} style={styles.tierCard}>
              <Text style={styles.tierTitle}>{update.title}</Text>
              <Text style={styles.body}>{update.body}</Text>
            </View>
          ))}
        </>
      )}

      {profile?.role === 'contributeur' && !isOwner && (
        <View style={styles.interestBox}>
          <Text style={styles.sectionTitle}>Manifester votre intérêt</Text>
          {sent ? (
            <Text style={styles.sentText}>Votre message a été envoyé à l'entrepreneur.</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Votre message (optionnel)"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.buttonSecondary} onPress={handleInterest} disabled={sending}>
                <Text style={styles.buttonSecondaryText}>{sending ? 'Envoi...' : "Je suis intéressé(e)"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 8, paddingBottom: 60 },
  gallery: { marginBottom: 12 },
  galleryImage: { width: 220, height: 150, borderRadius: 10, marginRight: 10, backgroundColor: '#E7E0D3' },
  title: { fontSize: 24, fontWeight: '700' },
  meta: { fontSize: 13, color: '#888', marginBottom: 8 },
  videoLink: { color: '#132D46', fontWeight: '600', marginBottom: 8 },
  ownerLink: { color: COLORS.primary, fontWeight: '600', fontSize: 13, marginBottom: 4 },
  fundingBox: {
    backgroundColor: '#F3EDE2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    gap: 6,
  },
  fundingText: { fontWeight: '600', color: '#132D46' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#D9D0C0', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#132D46' },
  deadlineText: { fontSize: 12, color: '#666' },
  instrumentsText: { fontSize: 12, color: '#666' },
  manageButton: {
    borderWidth: 1,
    borderColor: '#132D46',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  manageButtonText: { color: '#132D46', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16 },
  body: { fontSize: 15, color: '#333', lineHeight: 22 },
  tierCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7E0D3',
    marginTop: 8,
    gap: 2,
  },
  tierCardUnlocked: { borderColor: '#2e7d32', backgroundColor: '#f0f8f1' },
  tierAmount: { fontWeight: '700', color: '#132D46' },
  tierTitle: { fontWeight: '600', fontSize: 15 },
  interestBox: { marginTop: 24, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonSecondaryText: { color: '#132D46', fontWeight: '600', fontSize: 16 },
  sentText: { color: '#2e7d32' },
});
