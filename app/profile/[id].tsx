import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useLanguage } from '../../context/LanguageProvider';
import { getOrCreateConversation } from '../../lib/conversations';
import { getFollowCounts, isFollowing, toggleFollow } from '../../lib/feed';
import { logProfileView } from '../../lib/stats';
import { labelForContributionType, labelForNeed, labelForOrganizationType, labelForStage } from '../../constants/taxonomy';
import { ImpactBadge } from '../../components/ImpactBadge';
import { EntrepreneurProjectPortfolio } from '../../components/EntrepreneurProjectPortfolio';
import { ProfilePostsFeed } from '../../components/ProfilePostsFeed';
import { COLORS, MAX_CONTENT_WIDTH } from '../../constants/theme';
import type { Profile } from '../../types/database';

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

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: myProfile } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [followingThem, setFollowingThem] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [postCount, setPostCount] = useState(0);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (active) {
            setProfile(data as Profile);
            setLoading(false);
          }
        });
      if (id) {
        getFollowCounts(id).then((result) => {
          if (active) setCounts(result);
        });
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', id)
          .then(({ count }) => {
            if (active) setPostCount(count ?? 0);
          });
      }
      if (myProfile && id && myProfile.id !== id) {
        isFollowing(myProfile.id, id).then((result) => {
          if (active) setFollowingThem(result);
        });
        logProfileView(myProfile.id, id);
      }
      return () => {
        active = false;
      };
    }, [id, myProfile])
  );

  const handleToggleFollow = async () => {
    if (!myProfile || !profile) return;
    setFollowBusy(true);
    const next = !followingThem;
    setFollowingThem(next);
    setCounts((c) => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
    try {
      await toggleFollow(myProfile.id, profile.id, followingThem);
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>Profil introuvable.</Text>
      </View>
    );
  }

  const isEntrepreneur = profile.role === 'entrepreneur';
  const isOwnProfile = myProfile?.id === profile.id;
  const isPrivateToViewer = profile.details_private && !isOwnProfile;
  const showDetails = !isPrivateToViewer;

  const handleMessage = async () => {
    if (!myProfile) return;
    setStarting(true);
    try {
      const conversationId = await getOrCreateConversation(myProfile.id, profile.id);
      router.push(`/conversation/${conversationId}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(isEntrepreneur ? profile.company_name || profile.full_name : profile.full_name)
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/profile/${profile.id}/followers`)}>
            <Text style={styles.statNumber}>{counts.followers}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/profile/${profile.id}/following`)}>
            <Text style={styles.statNumber}>{counts.following}</Text>
            <Text style={styles.statLabel}>Abonnements</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.roleBadge}>{isEntrepreneur ? 'Entrepreneur' : 'Contributeur'}</Text>
      <Text style={styles.name}>{isEntrepreneur ? profile.company_name || profile.full_name : profile.full_name}</Text>
      {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      <ImpactBadge score={profile.impact_score} scores={profile.impact_scores} notes={profile.impact_notes} />

      {myProfile && myProfile.id !== profile.id && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessage} disabled={starting}>
            <Text style={styles.messageButtonText}>{starting ? 'Ouverture...' : '✉️ Envoyer un message'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followButton, followingThem && styles.followButtonActive]}
            onPress={handleToggleFollow}
            disabled={followBusy}
          >
            <Text style={[styles.followButtonText, followingThem && styles.followButtonTextActive]}>
              {followingThem ? `✓ ${t('following')}` : `+ ${t('follow')}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isPrivateToViewer && (
        <Text style={styles.privateNotice}>🔒 Ce profil garde ses informations détaillées privées.</Text>
      )}

      {showDetails && (
        <TouchableOpacity style={styles.expandToggle} onPress={() => setDetailsExpanded((v) => !v)}>
          <Text style={styles.expandToggleText}>
            {detailsExpanded ? 'Voir moins ▲' : 'Voir plus d’informations et les projets ▼'}
          </Text>
        </TouchableOpacity>
      )}

      {showDetails &&
        detailsExpanded &&
        (isEntrepreneur ? (
          <>
            <Field label="Porté par" value={profile.full_name} />
            <Field label="Secteur" value={profile.sector} />
            <Field label="Stade" value={profile.stage ? labelForStage(profile.stage) : null} />
            <Field label="Localisation" value={[profile.city, profile.country].filter(Boolean).join(', ')} />
            <Field label="Pitch" value={profile.pitch_short} />
            <ChipList label="Recherche" values={profile.needs?.map(labelForNeed)} />
            <ChipList label="Expertise recherchée" values={profile.expertise_needed} />
            {profile.funding_amount_sought ? (
              <Field
                label="Financement recherché"
                value={`${profile.funding_amount_sought.toLocaleString('fr-FR')} €`}
              />
            ) : null}
            <ChipList label="Financement souhaité" values={profile.funding_types_sought} />
            <EntrepreneurProjectPortfolio ownerId={profile.id} />
          </>
        ) : (
          <>
            <ChipList label="Rôles" values={profile.contribution_types?.map(labelForContributionType)} />
            <Field
              label="Type de structure"
              value={profile.organization_type ? labelForOrganizationType(profile.organization_type) : null}
            />
            <Field label="Organisation" value={profile.organization} />
            <Field label="Pays" value={profile.country} />
            <ChipList label="Secteurs d'intérêt" values={profile.sectors_of_interest} />
            <ChipList label="Domaines d'expertise" values={profile.expertise_domains} />
            {profile.investment_ticket_min || profile.investment_ticket_max ? (
              <Field
                label="Ticket d'investissement"
                value={`${profile.investment_ticket_min?.toLocaleString('fr-FR') ?? '?'} € - ${
                  profile.investment_ticket_max?.toLocaleString('fr-FR') ?? '?'
                } €`}
              />
            ) : null}
            <ChipList label="Instruments" values={profile.investment_instruments} />
            <ChipList label="Type de mécénat" values={profile.mecenat_types} />
            <Field label="Disponibilité mentorat" value={profile.mentor_availability} />
          </>
        ))}

      {myProfile && <ProfilePostsFeed authorId={profile.id} viewer={myProfile} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40, gap: 4, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.border },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 30 },
  statsRow: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headline: { fontSize: 15, color: COLORS.textSecondary, marginTop: 2 },
  bio: { fontSize: 14, color: COLORS.textPrimary, marginTop: 6, lineHeight: 20 },
  privateNotice: { fontSize: 13, color: COLORS.textMuted, marginTop: 12, fontStyle: 'italic' },
  expandToggle: { paddingVertical: 10, marginTop: 4 },
  expandToggleText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  messageButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageButtonText: { color: '#fff', fontWeight: '600' },
  followButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  followButtonActive: { backgroundColor: COLORS.background },
  followButtonText: { color: COLORS.primary, fontWeight: '600' },
  followButtonTextActive: { color: COLORS.primary },
  field: { marginTop: 12 },
  fieldLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  fieldValue: { fontSize: 15, color: COLORS.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: COLORS.background, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
});
