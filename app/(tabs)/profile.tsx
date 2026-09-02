import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { getFollowCounts } from '../../lib/feed';
import { labelForContributionType, labelForNeed, labelForStage } from '../../constants/taxonomy';
import { ImpactBadge } from '../../components/ImpactBadge';
import { EntrepreneurProjectPortfolio } from '../../components/EntrepreneurProjectPortfolio';
import { ProfilePostsFeed } from '../../components/ProfilePostsFeed';
import { COLORS, MAX_CONTENT_WIDTH } from '../../constants/theme';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function ChipList({ label, values }: { label: string; values: string[] | null | undefined }) {
  if (!values || values.length === 0) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {values.map((v) => (
          <View key={v} style={styles.chip}>
            <Text style={styles.chipText}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      let active = true;
      getFollowCounts(profile.id).then((result) => {
        if (active) setCounts(result);
      });
      return () => {
        active = false;
      };
    }, [profile])
  );

  if (!profile) return null;

  const isEntrepreneur = profile.role === 'entrepreneur';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const updatePrivacy = async (field: 'followers_visible' | 'details_private', value: boolean) => {
    await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id);
    await refreshProfile();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} /> : null}
      <Text style={styles.roleBadge}>{isEntrepreneur ? 'Entrepreneur' : 'Contributeur'}</Text>
      <Text style={styles.name}>{profile.full_name}</Text>
      {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
      <View style={styles.statsRow}>
        <TouchableOpacity onPress={() => router.push(`/profile/${profile.id}/followers`)}>
          <Text style={styles.statItem}>
            <Text style={styles.statNumber}>{counts.followers}</Text> abonnés
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/profile/${profile.id}/following`)}>
          <Text style={styles.statItem}>
            <Text style={styles.statNumber}>{counts.following}</Text> abonnements
          </Text>
        </TouchableOpacity>
      </View>
      <ImpactBadge score={profile.impact_score} scores={profile.impact_scores} notes={profile.impact_notes} />

      <TouchableOpacity style={styles.expandToggle} onPress={() => setDetailsExpanded((v) => !v)}>
        <Text style={styles.expandToggleText}>{detailsExpanded ? 'Voir moins ▲' : 'Voir plus d’informations ▼'}</Text>
      </TouchableOpacity>

      {detailsExpanded &&
        (isEntrepreneur ? (
          <>
            <Field label="Entreprise" value={profile.company_name} />
            <Field label="Secteur" value={profile.sector} />
            <Field label="Stade" value={profile.stage ? labelForStage(profile.stage) : null} />
            <Field label="Localisation" value={[profile.city, profile.country].filter(Boolean).join(', ')} />
            <Field label="Pitch" value={profile.pitch_short} />
            <Field label="Présentation" value={profile.bio} />
            <ChipList label="Recherche" values={profile.needs?.map(labelForNeed)} />
            <ChipList label="Expertise recherchée" values={profile.expertise_needed} />
            {profile.funding_amount_sought ? (
              <Field label="Financement recherché" value={`${profile.funding_amount_sought.toLocaleString('fr-FR')} €`} />
            ) : null}
          </>
        ) : (
          <>
            <ChipList label="Rôles" values={profile.contribution_types?.map(labelForContributionType)} />
            <Field label="Organisation" value={profile.organization} />
            <Field label="Localisation" value={profile.country} />
            <Field label="Présentation" value={profile.bio} />
            <ChipList label="Secteurs d'intérêt" values={profile.sectors_of_interest} />
            <ChipList label="Domaines d'expertise" values={profile.expertise_domains} />
          </>
        ))}

      {isEntrepreneur ? (
        <EntrepreneurProjectPortfolio ownerId={profile.id} />
      ) : (
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/wallet')}>
          <Text style={styles.buttonSecondaryText}>🎒 Mon portefeuille d'impact</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/saved')}>
        <Text style={styles.buttonSecondaryText}>🔖 Publications enregistrées</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/stats')}>
        <Text style={styles.buttonSecondaryText}>📊 Statistiques de mon profil</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Confidentialité</Text>
      <View style={styles.privacyRow}>
        <Text style={styles.privacyLabel}>Rendre ma liste d'abonnés/abonnements visible</Text>
        <Switch
          value={profile.followers_visible ?? true}
          onValueChange={(v) => updatePrivacy('followers_visible', v)}
        />
      </View>
      <View style={styles.privacyRow}>
        <Text style={styles.privacyLabel}>Garder mes informations détaillées privées</Text>
        <Switch value={profile.details_private ?? false} onValueChange={(v) => updatePrivacy('details_private', v)} />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/onboarding')}>
        <Text style={styles.buttonText}>Modifier mon profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.feedSection}>
        <ProfilePostsFeed authorId={profile.id} viewer={profile} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, backgroundColor: '#E7E0D3' },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#132D46',
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headline: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  statItem: { fontSize: 13, color: COLORS.textSecondary },
  statNumber: { fontWeight: '700', color: COLORS.textPrimary },
  expandToggle: { paddingVertical: 8, marginTop: 4 },
  expandToggleText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  field: { marginTop: 12 },
  fieldLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#222' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    backgroundColor: '#F3EDE2',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 13, color: '#333' },
  button: {
    backgroundColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonSecondaryText: { color: '#132D46', fontWeight: '600', fontSize: 16 },
  logoutButton: { alignItems: 'center', marginTop: 16 },
  logoutText: { color: '#B3452C' },
  feedSection: { marginTop: 28, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 24, marginBottom: 4 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  privacyLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
});
