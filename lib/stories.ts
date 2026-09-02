import { supabase } from './supabase';
import { insertResilient } from './resilientWrite';
import type { Profile, Story } from '../types/database';

export type StoryGroup = { author: Profile; stories: Story[] };

const DAY_MS = 24 * 60 * 60 * 1000;

// Renvoie les stories actives (< 24h) des comptes suivis + les siennes, groupées par auteur,
// avec son propre groupe toujours en premier (comme sur Instagram).
export async function fetchStoryGroups(profile: Profile): Promise<StoryGroup[]> {
  const { data: follows } = await supabase.from('follows').select('followee_id').eq('follower_id', profile.id);
  const followedIds = (follows ?? []).map((f) => f.followee_id);
  const visibleAuthorIds = Array.from(new Set([...followedIds, profile.id]));

  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .in('author_id', visibleAuthorIds)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  const storyList = (stories as Story[]) ?? [];
  if (storyList.length === 0) return [];

  const authorIds = Array.from(new Set(storyList.map((s) => s.author_id)));
  const { data: authors } = await supabase.from('profiles').select('*').in('id', authorIds);
  const authorsById = new Map((authors as Profile[] | null)?.map((a) => [a.id, a]) ?? []);

  const grouped = new Map<string, Story[]>();
  storyList.forEach((s) => {
    const list = grouped.get(s.author_id) ?? [];
    list.push(s);
    grouped.set(s.author_id, list);
  });

  const groups: StoryGroup[] = Array.from(grouped.entries())
    .map(([authorId, list]) => ({ author: authorsById.get(authorId), stories: list }))
    .filter((g): g is StoryGroup => !!g.author);

  groups.sort((a, b) => {
    if (a.author.id === profile.id) return -1;
    if (b.author.id === profile.id) return 1;
    return b.stories[b.stories.length - 1].created_at.localeCompare(a.stories[a.stories.length - 1].created_at);
  });

  return groups;
}

// Crée une ou plusieurs stories d'affilée à partir de plusieurs photos/vidéos sélectionnées en
// une fois (comme sur Instagram : chaque média devient une "frame" séparée dans le carrousel de
// stories). Seule la première frame porte la légende/couleur/identification saisies.
export async function createStoryBatch(
  authorId: string,
  mediaUrls: string[],
  caption?: string | null,
  captionColor?: string | null,
  taggedProfileId?: string | null
) {
  if (mediaUrls.length === 0) return;
  const rows = mediaUrls.map((imageUrl, index) => ({
    author_id: authorId,
    image_url: imageUrl,
    caption: index === 0 ? caption || null : null,
    caption_color: index === 0 ? captionColor || null : null,
    tagged_profile_id: index === 0 ? taggedProfileId || null : null,
  }));
  await insertResilient('stories', rows);
}
