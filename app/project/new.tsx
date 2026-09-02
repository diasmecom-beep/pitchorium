import { useState } from 'react';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { pickAndUploadImages } from '../../lib/mediaUpload';
import { ChipSelect } from '../../components/ChipSelect';
import { SearchableChipSelect } from '../../components/SearchableChipSelect';
import { ImpactCriteriaForm } from '../../components/ImpactCriteriaForm';
import { computeImpactScore, type ImpactScores } from '../../constants/impact';
import { AFRICA_ACP_COUNTRIES } from '../../constants/countries';
import {
  CAMPAIGN_DURATIONS,
  DEFAULT_PLATFORM_FEE_PERCENT,
  FUNDING_INSTRUMENTS,
  IMPACT_AREAS,
  SECTORS,
} from '../../constants/taxonomy';

const MAX_TIERS = 5;

type TierDraft = { amount: string; title: string; description: string };

function emptyTier(): TierDraft {
  return { amount: '', title: '', description: '' };
}

export default function NewProject() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState<string[]>([]);
  const [impactArea, setImpactArea] = useState<string[]>([]);
  const [country, setCountry] = useState<string[]>([]);
  const [fundingGoal, setFundingGoal] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [durationDays, setDurationDays] = useState<string[]>(['60']);
  const [fundingInstruments, setFundingInstruments] = useState<string[]>([]);
  const [tiers, setTiers] = useState<TierDraft[]>([emptyTier()]);
  const [impactScores, setImpactScores] = useState<ImpactScores>(profile?.impact_scores ?? {});
  const [impactNotes, setImpactNotes] = useState(profile?.impact_notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateTier = (index: number, patch: Partial<TierDraft>) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const addTier = () => {
    if (tiers.length >= MAX_TIERS) return;
    setTiers((prev) => [...prev, emptyTier()]);
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPhotos = async () => {
    if (!profile) return;
    setError(null);
    setUploadingImages(true);
    try {
      const urls = await pickAndUploadImages(profile.id);
      setGalleryUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi des photos.");
    } finally {
      setUploadingImages(false);
    }
  };

  const validTiers = tiers.filter((t) => Number(t.amount) > 0 && t.title.trim() && t.description.trim());

  const handleSubmit = async (publish: boolean) => {
    if (!profile) return;
    setError(null);

    if (publish) {
      if (!(Number(fundingGoal) > 0)) {
        setError('Indiquez un montant global de financement.');
        return;
      }
      if (validTiers.length === 0) {
        setError(
          'Définissez au moins un palier (montant + ce qu\'il permet de faire) avant de publier votre projet.'
        );
        return;
      }
    }

    setSubmitting(true);
    const duration = Number(durationDays[0]) || 60;
    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        owner_id: profile.id,
        title,
        summary,
        description,
        sector: sector[0] ?? '',
        impact_area: impactArea[0] ?? '',
        country: country[0] ?? '',
        funding_goal: Number(fundingGoal) || 0,
        video_url: videoUrl || null,
        gallery_urls: galleryUrls,
        duration_days: duration,
        deadline: publish ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null,
        funding_instruments_accepted: fundingInstruments,
        impact_scores: impactScores,
        impact_score: computeImpactScore(impactScores),
        impact_notes: impactNotes || null,
        status: publish ? 'published' : 'draft',
      })
      .select()
      .single();
    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    if (validTiers.length > 0) {
      const { error: tiersError } = await supabase.from('campaign_tiers').insert(
        validTiers.map((t, i) => ({
          project_id: data.id,
          amount: Number(t.amount),
          title: t.title,
          description: t.description,
          sort_order: i,
        }))
      );
      if (tiersError) {
        setSubmitting(false);
        setError(tiersError.message);
        return;
      }
    }

    setSubmitting(false);
    router.replace(`/project/${data.id}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Titre du projet</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Résumé court</Text>
      <TextInput style={styles.input} value={summary} onChangeText={setSummary} />

      <Text style={styles.label}>Description détaillée</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
      />

      <Text style={styles.label}>Secteur</Text>
      <ChipSelect options={SECTORS} selected={sector} onChange={setSector} multiple={false} />

      <Text style={styles.label}>Zone d'impact</Text>
      <ChipSelect options={IMPACT_AREAS} selected={impactArea} onChange={setImpactArea} multiple={false} />

      <Text style={styles.label}>Pays</Text>
      <SearchableChipSelect options={AFRICA_ACP_COUNTRIES} selected={country} onChange={setCountry} />

      <Text style={styles.sectionTitle}>Présentation visuelle</Text>

      <Text style={styles.label}>Photos du projet</Text>
      {galleryUrls.length > 0 && (
        <View style={styles.galleryRow}>
          {galleryUrls.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.galleryImage} />
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.buttonSecondary} onPress={handleAddPhotos} disabled={uploadingImages}>
        <Text style={styles.buttonSecondaryText}>{uploadingImages ? 'Envoi...' : '+ Ajouter des photos'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Vidéo de présentation (lien YouTube / Vimeo, optionnel)</Text>
      <TextInput
        style={styles.input}
        value={videoUrl}
        onChangeText={setVideoUrl}
        autoCapitalize="none"
        placeholder="https://youtube.com/..."
      />

      <Text style={styles.sectionTitle}>Financement</Text>

      <Text style={styles.label}>Objectif de financement global (€)</Text>
      <TextInput style={styles.input} value={fundingGoal} onChangeText={setFundingGoal} keyboardType="numeric" />

      <Text style={styles.label}>Paliers de financement</Text>
      <Text style={styles.hint}>
        Définissez au moins 1 palier (jusqu'à {MAX_TIERS}) : un montant et ce qu'il vous permet de faire. Chaque
        palier est débloqué dès que ce montant est atteint, même si l'objectif global ne l'est pas encore. Ex :
        1 000 € → prototype, 2 500 € → lancement dans 3 régions.
      </Text>

      {tiers.map((tier, index) => (
        <View key={index} style={styles.tierBlock}>
          <Text style={styles.tierBlockTitle}>Palier {index + 1}</Text>
          <Text style={styles.label}>Montant (€)</Text>
          <TextInput
            style={styles.input}
            value={tier.amount}
            onChangeText={(v) => updateTier(index, { amount: v })}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Titre</Text>
          <TextInput
            style={styles.input}
            value={tier.title}
            onChangeText={(v) => updateTier(index, { title: v })}
            placeholder='Ex: "Prototype fonctionnel"'
          />
          <Text style={styles.label}>Ce que ce palier permet de faire (justificatif)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={tier.description}
            onChangeText={(v) => updateTier(index, { description: v })}
            multiline
          />
          {tiers.length > 1 && (
            <TouchableOpacity onPress={() => removeTier(index)}>
              <Text style={styles.removeTierText}>Supprimer ce palier</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {tiers.length < MAX_TIERS && (
        <TouchableOpacity style={styles.buttonSecondary} onPress={addTier}>
          <Text style={styles.buttonSecondaryText}>+ Ajouter un palier ({tiers.length}/{MAX_TIERS})</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Durée de la campagne</Text>
      <ChipSelect
        options={CAMPAIGN_DURATIONS.map((d) => ({ value: String(d), label: `${d} jours` }))}
        selected={durationDays}
        onChange={setDurationDays}
        multiple={false}
      />

      <Text style={styles.label}>Types de financement acceptés</Text>
      <ChipSelect options={FUNDING_INSTRUMENTS} selected={fundingInstruments} onChange={setFundingInstruments} />
      <Text style={styles.hint}>
        Choisissez « Love money » si vous ne souhaitez pas offrir de contrepartie (seulement un engagement de
        soutien et un retour d'expérience). Pour les autres types, vous pourrez définir des contreparties après
        la création du projet.
      </Text>

      <Text style={styles.hint}>
        En cas de collecte réussie, Pitchorium prélève {DEFAULT_PLATFORM_FEE_PERCENT}% des fonds collectés pour
        financer la plateforme.
      </Text>

      <Text style={styles.sectionTitle}>Critères d'impact du projet</Text>
      <Text style={styles.hint}>
        Pré-rempli à partir de votre profil — ajustez si ce projet a un profil d'impact différent de votre
        entreprise en général.
      </Text>
      <ImpactCriteriaForm
        scores={impactScores}
        onChange={setImpactScores}
        notes={impactNotes}
        onNotesChange={setImpactNotes}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => handleSubmit(false)}
        disabled={submitting}
      >
        <Text style={styles.buttonSecondaryText}>Enregistrer comme brouillon</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleSubmit(true)} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Publication...' : 'Publier le projet'}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Vous pourrez ajouter des contreparties et d'autres actualités depuis la page du projet après publication.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, paddingBottom: 60 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  label: { fontSize: 13, color: '#666', marginTop: 8 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  galleryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  galleryImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#E7E0D3' },
  tierBlock: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E7E0D3',
    gap: 4,
  },
  tierBlockTitle: { fontWeight: '700', fontSize: 14, color: '#132D46' },
  removeTierText: { color: '#B3452C', fontSize: 13, marginTop: 6 },
  button: {
    backgroundColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: { color: '#132D46', fontWeight: '600', fontSize: 16 },
  error: { color: '#B3452C' },
});
