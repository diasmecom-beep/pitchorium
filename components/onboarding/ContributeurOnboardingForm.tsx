import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { ChipSelect } from '../ChipSelect';
import { SearchableChipSelect } from '../SearchableChipSelect';
import { AvatarPicker } from '../AvatarPicker';
import { HomeButton } from '../HomeButton';
import { WORLD_COUNTRIES } from '../../constants/worldCountries';
import { AFRICA_ACP_COUNTRIES } from '../../constants/countries';
import type { Profile } from '../../types/database';
import {
  CONTRIBUTION_TYPES,
  EXPERT_MISSION_TYPES,
  EXPERTISE_DOMAINS,
  FUNDING_INSTRUMENTS,
  MECENAT_TYPES,
  MENTOR_AVAILABILITY,
  MENTOR_FORMATS,
  ORGANIZATION_TYPES,
  PROJECT_STAGES,
  SECTORS,
} from '../../constants/taxonomy';

export function ContributeurOnboardingForm({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [headline, setHeadline] = useState(profile.headline ?? '');
  const [organizationType, setOrganizationType] = useState<string[]>(
    profile.organization_type ? [profile.organization_type] : []
  );
  const [organization, setOrganization] = useState(profile.organization ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [country, setCountry] = useState<string[]>(profile.country ? [profile.country] : []);
  const [interventionCountries, setInterventionCountries] = useState<string[]>(
    profile.intervention_countries ?? []
  );
  const [bio, setBio] = useState(profile.bio ?? '');
  const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications_enabled ?? true);

  const [contributionTypes, setContributionTypes] = useState<string[]>(profile.contribution_types ?? []);
  const [sectorsOfInterest, setSectorsOfInterest] = useState<string[]>(profile.sectors_of_interest ?? []);
  const [expertiseDomains, setExpertiseDomains] = useState<string[]>(profile.expertise_domains ?? []);

  const [ticketMin, setTicketMin] = useState(
    profile.investment_ticket_min ? String(profile.investment_ticket_min) : ''
  );
  const [ticketMax, setTicketMax] = useState(
    profile.investment_ticket_max ? String(profile.investment_ticket_max) : ''
  );
  const [investmentStages, setInvestmentStages] = useState<string[]>(profile.investment_stages ?? []);
  const [investmentInstruments, setInvestmentInstruments] = useState<string[]>(
    profile.investment_instruments ?? []
  );

  const [mecenatTypes, setMecenatTypes] = useState<string[]>(profile.mecenat_types ?? []);

  const [mentorAvailability, setMentorAvailability] = useState<string[]>(
    profile.mentor_availability ? [profile.mentor_availability] : []
  );
  const [mentorFormat, setMentorFormat] = useState<string[]>(profile.mentor_format ? [profile.mentor_format] : []);
  const [expertMissionTypes, setExpertMissionTypes] = useState<string[]>(profile.expert_mission_types ?? []);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isInvestisseur = contributionTypes.includes('investisseur');
  const isMecene = contributionTypes.includes('mecene');
  const isMentor = contributionTypes.includes('mentor');
  const isExpert = contributionTypes.includes('expert');

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        headline,
        organization_type: organizationType[0] ?? null,
        organization,
        website,
        country: country[0] ?? null,
        intervention_countries: interventionCountries,
        bio,
        email_notifications_enabled: emailNotifications,
        contribution_types: contributionTypes,
        sectors_of_interest: sectorsOfInterest,
        expertise_domains: isMentor || isExpert ? expertiseDomains : [],
        investment_ticket_min: isInvestisseur && ticketMin ? Number(ticketMin) : null,
        investment_ticket_max: isInvestisseur && ticketMax ? Number(ticketMax) : null,
        investment_stages: isInvestisseur ? investmentStages : [],
        investment_instruments: isInvestisseur ? investmentInstruments : [],
        mecenat_types: isMecene ? mecenatTypes : [],
        mentor_availability: isMentor ? mentorAvailability[0] ?? null : null,
        mentor_format: isMentor ? mentorFormat[0] ?? null : null,
        expert_mission_types: isExpert ? expertMissionTypes : [],
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

        <Text style={styles.sectionTitle}>Vos rôles sur la plateforme</Text>
        <Text style={styles.hint}>Sélectionnez un ou plusieurs rôles.</Text>
        <ChipSelect options={CONTRIBUTION_TYPES} selected={contributionTypes} onChange={setContributionTypes} />

        <Text style={styles.sectionTitle}>Votre profil</Text>

        <Text style={styles.label}>Type de structure</Text>
        <Text style={styles.hint}>Particulier, entreprise, ONG, association, fondation, institution...</Text>
        <ChipSelect options={ORGANIZATION_TYPES} selected={organizationType} onChange={setOrganizationType} multiple={false} />

        <Text style={styles.label}>Titre (ex: Business Angel, Directeur RSE chez X...)</Text>
        <TextInput style={styles.input} value={headline} onChangeText={setHeadline} />

        <Text style={styles.label}>Organisation / structure (nom, optionnel)</Text>
        <TextInput style={styles.input} value={organization} onChangeText={setOrganization} />

        <Text style={styles.label}>Site web (optionnel)</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />

        <Text style={styles.label}>Pays de résidence</Text>
        <SearchableChipSelect options={WORLD_COUNTRIES} selected={country} onChange={setCountry} />

        <Text style={styles.label}>Pays d'intervention (un ou plusieurs)</Text>
        <SearchableChipSelect
          options={AFRICA_ACP_COUNTRIES}
          selected={interventionCountries}
          onChange={setInterventionCountries}
          multiple
        />

        <Text style={styles.label}>Présentez-vous librement</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={5}
          placeholder="Parcours, motivations, ce qui vous anime dans votre engagement..."
        />

        <Text style={styles.label}>Secteurs qui vous intéressent</Text>
        <ChipSelect options={SECTORS} selected={sectorsOfInterest} onChange={setSectorsOfInterest} />

        {(isMentor || isExpert) && (
          <>
            <Text style={styles.sectionTitle}>Domaines d'expertise</Text>
            <ChipSelect options={EXPERTISE_DOMAINS} selected={expertiseDomains} onChange={setExpertiseDomains} />
          </>
        )}

        {isInvestisseur && (
          <>
            <Text style={styles.sectionTitle}>En tant qu'investisseur</Text>
            <Text style={styles.label}>Ticket d'investissement minimum (€)</Text>
            <TextInput style={styles.input} value={ticketMin} onChangeText={setTicketMin} keyboardType="numeric" />
            <Text style={styles.label}>Ticket d'investissement maximum (€)</Text>
            <TextInput style={styles.input} value={ticketMax} onChangeText={setTicketMax} keyboardType="numeric" />
            <Text style={styles.label}>Stades d'investissement préférés</Text>
            <ChipSelect options={PROJECT_STAGES} selected={investmentStages} onChange={setInvestmentStages} />
            <Text style={styles.label}>Instruments d'investissement</Text>
            <ChipSelect
              options={FUNDING_INSTRUMENTS}
              selected={investmentInstruments}
              onChange={setInvestmentInstruments}
            />
          </>
        )}

        {isMecene && (
          <>
            <Text style={styles.sectionTitle}>En tant que mécène</Text>
            <Text style={styles.label}>Type de soutien proposé</Text>
            <ChipSelect options={MECENAT_TYPES} selected={mecenatTypes} onChange={setMecenatTypes} />
          </>
        )}

        {isMentor && (
          <>
            <Text style={styles.sectionTitle}>En tant que mentor</Text>
            <Text style={styles.label}>Disponibilité</Text>
            <ChipSelect
              options={MENTOR_AVAILABILITY}
              selected={mentorAvailability}
              onChange={setMentorAvailability}
              multiple={false}
            />
            <Text style={styles.label}>Format</Text>
            <ChipSelect options={MENTOR_FORMATS} selected={mentorFormat} onChange={setMentorFormat} multiple={false} />
          </>
        )}

        {isExpert && (
          <>
            <Text style={styles.sectionTitle}>En tant qu'expert</Text>
            <Text style={styles.label}>Type de mission proposée</Text>
            <ChipSelect options={EXPERT_MISSION_TYPES} selected={expertMissionTypes} onChange={setExpertMissionTypes} />
          </>
        )}

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Recevoir les actualités des projets par email</Text>
          <Switch value={emailNotifications} onValueChange={setEmailNotifications} />
        </View>

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
  container: { padding: 20, paddingBottom: 80, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  hint: { fontSize: 13, color: '#777', marginBottom: 6 },
  label: { fontSize: 13, color: '#666', marginTop: 10, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchLabel: { fontSize: 14, color: '#333', flex: 1, paddingRight: 12 },
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
