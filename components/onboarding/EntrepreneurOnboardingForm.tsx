import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { ChipSelect } from '../ChipSelect';
import { SearchableChipSelect } from '../SearchableChipSelect';
import { ImpactCriteriaForm } from '../ImpactCriteriaForm';
import { AvatarPicker } from '../AvatarPicker';
import { HomeButton } from '../HomeButton';
import { computeImpactScore, type ImpactScores } from '../../constants/impact';
import { AFRICA_ACP_COUNTRIES } from '../../constants/countries';
import type { Profile } from '../../types/database';
import {
  ENTREPRENEUR_NEEDS,
  EXPERTISE_DOMAINS,
  FUNDING_INSTRUMENTS,
  PROJECT_STAGES,
  SECTORS,
  TEAM_SIZES,
} from '../../constants/taxonomy';

export function EntrepreneurOnboardingForm({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [companyName, setCompanyName] = useState(profile.company_name ?? '');
  const [sector, setSector] = useState<string[]>(profile.sector ? [profile.sector] : []);
  const [stage, setStage] = useState<string[]>(profile.stage ? [profile.stage] : []);
  const [country, setCountry] = useState<string[]>(profile.country ? [profile.country] : []);
  const [city, setCity] = useState(profile.city ?? '');
  const [foundingYear, setFoundingYear] = useState(
    profile.founding_year ? String(profile.founding_year) : ''
  );
  const [teamSize, setTeamSize] = useState<string[]>(profile.team_size ? [profile.team_size] : []);
  const [website, setWebsite] = useState(profile.website ?? '');
  const [pitchShort, setPitchShort] = useState(profile.pitch_short ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');

  const [needs, setNeeds] = useState<string[]>(profile.needs ?? []);
  const [expertiseNeeded, setExpertiseNeeded] = useState<string[]>(profile.expertise_needed ?? []);
  const [fundingAmount, setFundingAmount] = useState(
    profile.funding_amount_sought ? String(profile.funding_amount_sought) : ''
  );
  const [fundingTypes, setFundingTypes] = useState<string[]>(profile.funding_types_sought ?? []);

  const [impactScores, setImpactScores] = useState<ImpactScores>(profile.impact_scores ?? {});
  const [impactNotes, setImpactNotes] = useState(profile.impact_notes ?? '');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        company_name: companyName,
        sector: sector[0] ?? null,
        stage: stage[0] ?? null,
        country: country[0] ?? null,
        city,
        founding_year: foundingYear ? Number(foundingYear) : null,
        team_size: teamSize[0] ?? null,
        website,
        pitch_short: pitchShort,
        bio,
        needs,
        expertise_needed: needs.includes('expertise') ? expertiseNeeded : [],
        funding_amount_sought: needs.includes('financement') && fundingAmount ? Number(fundingAmount) : null,
        funding_types_sought: needs.includes('financement') ? fundingTypes : [],
        impact_scores: impactScores,
        impact_score: computeImpactScore(impactScores),
        impact_notes: impactNotes || null,
        onboarding_completed: true,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refreshProfile();
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Votre photo</Text>
      <AvatarPicker userId={profile.id} avatarUrl={avatarUrl} onChange={setAvatarUrl} />

      <Text style={styles.sectionTitle}>Votre entreprise</Text>

      <Text style={styles.label}>Nom de l'entreprise / du projet</Text>
      <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} />

      <Text style={styles.label}>Secteur d'activité</Text>
      <ChipSelect options={SECTORS} selected={sector} onChange={setSector} multiple={false} />

      <Text style={styles.label}>Stade de développement</Text>
      <ChipSelect options={PROJECT_STAGES} selected={stage} onChange={setStage} multiple={false} />

      <Text style={styles.label}>Taille de l'équipe</Text>
      <ChipSelect options={TEAM_SIZES} selected={teamSize} onChange={setTeamSize} multiple={false} />

      <Text style={styles.label}>Pays</Text>
      <SearchableChipSelect options={AFRICA_ACP_COUNTRIES} selected={country} onChange={setCountry} />

      <Text style={styles.label}>Ville</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />

      <Text style={styles.label}>Année de création</Text>
      <TextInput style={styles.input} value={foundingYear} onChangeText={setFoundingYear} keyboardType="numeric" />

      <Text style={styles.label}>Site web (optionnel)</Text>
      <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />

      <Text style={styles.label}>Pitch en une phrase</Text>
      <TextInput style={styles.input} value={pitchShort} onChangeText={setPitchShort} />

      <Text style={styles.label}>Présentation détaillée</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={5}
      />

      <Text style={styles.sectionTitle}>Ce que vous recherchez</Text>
      <ChipSelect options={ENTREPRENEUR_NEEDS} selected={needs} onChange={setNeeds} />

      {needs.includes('expertise') && (
        <>
          <Text style={styles.label}>Dans quel(s) domaine(s) ?</Text>
          <ChipSelect options={EXPERTISE_DOMAINS} selected={expertiseNeeded} onChange={setExpertiseNeeded} />
        </>
      )}

      {needs.includes('financement') && (
        <>
          <Text style={styles.label}>Montant recherché (€)</Text>
          <TextInput
            style={styles.input}
            value={fundingAmount}
            onChangeText={setFundingAmount}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Type de financement souhaité</Text>
          <ChipSelect options={FUNDING_INSTRUMENTS} selected={fundingTypes} onChange={setFundingTypes} />
        </>
      )}

      <Text style={styles.sectionTitle}>Critères d'impact</Text>
      <ImpactCriteriaForm
        scores={impactScores}
        onChange={setImpactScores}
        notes={impactNotes}
        onNotesChange={setImpactNotes}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Enregistrement...' : 'Continuer'}</Text>
      </TouchableOpacity>
    </ScrollView>
    <HomeButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  label: { fontSize: 13, color: '#666', marginTop: 10, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
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
