import { supabase } from './supabase';

export type StatsWindow = { label: string; days: number };

export const STATS_WINDOWS: StatsWindow[] = [
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 182 },
  { label: '1 an', days: 365 },
];

export async function logProfileView(viewerId: string, viewedProfileId: string) {
  if (viewerId === viewedProfileId) return;
  await supabase.from('profile_views').insert({ viewer_id: viewerId, viewed_profile_id: viewedProfileId });
}

export async function countProfileViews(profileId: string, sinceDays: number): Promise<number> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('profile_views')
    .select('id', { count: 'exact', head: true })
    .eq('viewed_profile_id', profileId)
    .gte('created_at', since);
  return count ?? 0;
}

export async function countFollowEvents(
  profileId: string,
  sinceDays: number
): Promise<{ gained: number; lost: number }> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: gained }, { count: lost }] = await Promise.all([
    supabase
      .from('follow_events')
      .select('id', { count: 'exact', head: true })
      .eq('followee_id', profileId)
      .eq('event', 'follow')
      .gte('created_at', since),
    supabase
      .from('follow_events')
      .select('id', { count: 'exact', head: true })
      .eq('followee_id', profileId)
      .eq('event', 'unfollow')
      .gte('created_at', since),
  ]);
  return { gained: gained ?? 0, lost: lost ?? 0 };
}

// Répartition des vues de profil par semaine sur la fenêtre demandée — pour un graphe simple.
export async function profileViewsByWeek(
  profileId: string,
  sinceDays: number
): Promise<{ weekStart: string; count: number }[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const { data } = await supabase
    .from('profile_views')
    .select('created_at')
    .eq('viewed_profile_id', profileId)
    .gte('created_at', since.toISOString());

  const rows = data ?? [];
  const buckets = new Map<string, number>();
  rows.forEach((r: { created_at: string }) => {
    const d = new Date(r.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return Array.from(buckets.entries())
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
