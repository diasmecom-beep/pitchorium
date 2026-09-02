import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import {
  isContributeurRelevantForEntrepreneur,
  isEntrepreneurRelevantForContributeur,
  areEntrepreneursComplementary,
} from '../../lib/matching';
import { searchProjectsFiltered, searchProfilesOnly, fetchProjectsForOwner } from '../../lib/search';
import { ImpactBadge } from '../../components/ImpactBadge';
import { ChipSelect } from '../../components/ChipSelect';
import { FundingProgressBar } from '../../components/FundingProgressBar';
import { SearchPanel, type ProfileSearchRow } from '../../components/SearchPanel';
import { ProjectSearchToolbar, type ProjectFilters } from '../../components/ProjectSearchToolbar';
import { IMPACT_MIN_FILTERS } from '../../constants/impact';
import { labelForContributionType, labelForNeed } from '../../constants/taxonomy';
import { COLORS, RADIUS, CARD_SHADOW } from '../../constants/theme';
import type { Profile, Project } from '../../types/database';

const EMPTY_FILTERS: ProjectFilters = { country: null, sector: null, state: null, query: '' };

function daysUntil(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function ProjectsHub() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortByImpact, setSortByImpact] = useState(false);
  const [minImpact, setMinImpact] = useState<string[]>(['0']);

  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [endingSoon, setEndingSoon] = useState<Project[]>([]);
  const [relevantProfiles, setRelevantProfiles] = useState<Profile[]>([]);
  const [complementaryEntrepreneurs, setComplementaryEntrepreneurs] = useState<Profile[]>([]);

  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [searching, setSearching] = useState(false);
  const [searchProjects, setSearchProjects] = useState<Project[]>([]);
  const [searchProfiles, setSearchProfiles] = useState<ProfileSearchRow[]>([]);

  const load = useCallback(async () => {
    if (!profile) return;
    const targetRole = profile.role === 'entrepreneur' ? 'contributeur' : 'entrepreneur';

    const [{ data: recent }, { data: soon }, { data: candidates }, { data: peers }] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .not('deadline', 'is', null)
        .gte('deadline', new Date().toISOString())
        .lte('deadline', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('deadline', { ascending: true })
        .limit(10),
      supabase.from('profiles').select('*').eq('role', targetRole).eq('onboarding_completed', true).neq('id', profile.id),
      profile.role === 'entrepreneur'
        ? supabase.from('profiles').select('*').eq('role', 'entrepreneur').eq('onboarding_completed', true).neq('id', profile.id)
        : Promise.resolve({ data: [] }),
    ]);

    setRecentProjects((recent as Project[]) ?? []);
    setEndingSoon((soon as Project[]) ?? []);

    const allCandidates = (candidates as Profile[]) ?? [];
    const relevant = allCandidates.filter((other) =>
      profile.role === 'entrepreneur'
        ? isContributeurRelevantForEntrepreneur(profile, other)
        : isEntrepreneurRelevantForContributeur(profile, other)
    );
    setRelevantProfiles((relevant.length > 0 ? relevant : allCandidates).slice(0, 10));

    const allPeers = (peers as Profile[]) ?? [];
    const complementary = allPeers.filter((other) => areEntrepreneursComplementary(profile, other));
    setComplementaryEntrepreneurs(complementary.slice(0, 10));

    setLoading(false);
    setRefreshing(false);
  }, [profile]);

  // useFocusEffect ne se redéclenche pas simplement parce que `profile` devient disponible
  // (uniquement au changement de focus) : juste après une connexion, cet écran peut monter avant
  // que le profil ait fini de charger, ce qui bloquerait le spinner indéfiniment sans ce filet.
  useEffect(() => {
    if (profile) load();
  }, [profile, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const sortedRecent = useMemo(() => {
    const threshold = Number(minImpact[0] ?? '0');
    const filtered = threshold > 0 ? recentProjects.filter((p) => p.impact_score >= threshold) : recentProjects;
    if (!sortByImpact) return filtered;
    return [...filtered].sort((a, b) => b.impact_score - a.impact_score);
  }, [recentProjects, sortByImpact, minImpact]);

  const hasActiveFilters = (f: ProjectFilters) => !!(f.country || f.sector || f.state || f.query.trim().length >= 2);

  const runSearch = async (nextFilters: ProjectFilters) => {
    if (!hasActiveFilters(nextFilters)) {
      setSearchProjects([]);
      setSearchProfiles([]);
      return;
    }
    setSearching(true);
    const [projects, profiles] = await Promise.all([
      searchProjectsFiltered(nextFilters),
      searchProfilesOnly(nextFilters.query),
    ]);
    const entrepreneurs = profiles.filter((p) => p.role === 'entrepreneur');
    const projectsByOwner = await Promise.all(entrepreneurs.map((p) => fetchProjectsForOwner(p.id)));
    setSearchProjects(projects);
    setSearchProfiles(
      profiles.map((p) => ({
        profile: p,
        projects: p.role === 'entrepreneur' ? projectsByOwner[entrepreneurs.indexOf(p)] ?? [] : [],
      }))
    );
    setSearching(false);
  };

  const handleFiltersChange = (nextFilters: ProjectFilters) => {
    setFilters(nextFilters);
    runSearch(nextFilters);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const showSearchPanel = hasActiveFilters(filters);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      <ProjectSearchToolbar filters={filters} onChange={handleFiltersChange} />

      {showSearchPanel ? (
        <SearchPanel projects={searchProjects} profileRows={searchProfiles} loading={searching} />
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Plus récents</Text>
            <View style={styles.impactToggle}>
              <Text style={styles.impactToggleLabel}>Trier par impact</Text>
              <Switch value={sortByImpact} onValueChange={setSortByImpact} />
            </View>
          </View>
          <ChipSelect options={IMPACT_MIN_FILTERS} selected={minImpact} onChange={setMinImpact} multiple={false} />

          <FlatList
            data={sortedRecent}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.hList}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun projet publié pour le moment.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.projectCard} onPress={() => router.push(`/project/${item.id}`)}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.sector} · {item.country}
                </Text>
                <FundingProgressBar raised={item.amount_raised} goal={item.funding_goal} />
                <ImpactBadge score={item.impact_score} compact />
              </TouchableOpacity>
            )}
          />

          <Text style={styles.sectionTitle}>Profils pertinents pour vous</Text>
          <FlatList
            data={relevantProfiles}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.hList}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun profil pour le moment.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.profileCard} onPress={() => router.push(`/profile/${item.id}`)}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.role === 'entrepreneur' ? item.company_name || item.full_name : item.full_name}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={2}>
                  {item.role === 'entrepreneur' ? item.headline || item.pitch_short : item.headline}
                </Text>
                <View style={styles.chipRow}>
                  {(item.role === 'entrepreneur'
                    ? item.needs?.map(labelForNeed)
                    : item.contribution_types?.map(labelForContributionType)
                  )
                    ?.slice(0, 2)
                    .map((v) => (
                      <View key={v} style={styles.chip}>
                        <Text style={styles.chipText}>{v}</Text>
                      </View>
                    ))}
                </View>
              </TouchableOpacity>
            )}
          />

          {profile?.role === 'entrepreneur' && complementaryEntrepreneurs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Entrepreneurs complémentaires</Text>
              <FlatList
                data={complementaryEntrepreneurs}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.hList}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.profileCard} onPress={() => router.push(`/profile/${item.id}`)}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.company_name || item.full_name}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={2}>
                      {item.headline || item.pitch_short}
                    </Text>
                    <View style={styles.chipRow}>
                      {item.needs?.slice(0, 2).map(labelForNeed).map((v) => (
                        <View key={v} style={styles.chip}>
                          <Text style={styles.chipText}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>Bientôt en fin de délai</Text>
          {endingSoon.length === 0 ? (
            <Text style={styles.emptyText}>Aucun projet ne se termine dans les 7 prochains jours.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {endingSoon.map((item) => (
                <TouchableOpacity key={item.id} style={styles.urgentCard} onPress={() => router.push(`/project/${item.id}`)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>
                      {item.sector} · {item.country}
                    </Text>
                    <FundingProgressBar raised={item.amount_raised} goal={item.funding_goal} />
                  </View>
                  <View style={styles.countdownBadge}>
                    <Text style={styles.countdownText}>
                      {item.deadline ? `${daysUntil(item.deadline)} j` : '—'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {profile?.role === 'entrepreneur' && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/project/new')}>
          <Text style={styles.fabText}>+ Nouveau projet</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 8, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 8 },
  impactToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  impactToggleLabel: { fontSize: 12, color: COLORS.textSecondary },
  hList: { gap: 12, paddingVertical: 4, paddingRight: 8 },
  projectCard: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 6,
    ...CARD_SHADOW,
  },
  profileCard: {
    width: 200,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 6,
    ...CARD_SHADOW,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardMeta: { fontSize: 12, color: COLORS.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: { backgroundColor: COLORS.background, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  chipText: { fontSize: 11, color: COLORS.textSecondary },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  urgentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    ...CARD_SHADOW,
  },
  countdownBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  countdownText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  fab: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  fabText: { color: '#fff', fontWeight: '600' },
});
