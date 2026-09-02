import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, CARD_SHADOW } from '../constants/theme';
import { FundingProgressBar } from './FundingProgressBar';
import type { Project, Profile } from '../types/database';

export type ProfileSearchRow = { profile: Profile; projects: Project[] };

export function SearchPanel({
  projects,
  profileRows,
  loading,
}: {
  projects: Project[];
  profileRows: ProfileSearchRow[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.panel}>
        <Text style={styles.emptyText}>Recherche...</Text>
      </View>
    );
  }

  if (projects.length === 0 && profileRows.length === 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.emptyText}>Aucun résultat.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.panel} contentContainerStyle={{ gap: 10 }}>
      {projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projets</Text>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.card}
              onPress={() => router.push(`/project/${project.id}`)}
            >
              <Text style={styles.cardTitle}>{project.title}</Text>
              <Text style={styles.cardMeta}>
                {project.sector} · {project.country}
              </Text>
              <FundingProgressBar raised={project.amount_raised} goal={project.funding_goal} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {profileRows.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profils</Text>
          {profileRows.map(({ profile, projects: ownerProjects }) => (
            <TouchableOpacity
              key={profile.id}
              style={styles.card}
              onPress={() => router.push(`/profile/${profile.id}`)}
            >
              <Text style={styles.cardTitle}>
                {profile.role === 'entrepreneur' ? profile.company_name || profile.full_name : profile.full_name}
              </Text>
              <Text style={styles.cardMeta}>
                {profile.role === 'entrepreneur' ? 'Entrepreneur' : 'Contributeur'}
                {profile.headline ? ` · ${profile.headline}` : ''}
              </Text>
              {ownerProjects.map((project) => (
                <View key={project.id} style={styles.ownerProject}>
                  <Text style={styles.ownerProjectTitle}>{project.title}</Text>
                  <FundingProgressBar raised={project.amount_raised} goal={project.funding_goal} />
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
    maxHeight: 360,
    ...CARD_SHADOW,
  },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', padding: 12 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardMeta: { fontSize: 12, color: COLORS.textMuted },
  ownerProject: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  ownerProjectTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
});
