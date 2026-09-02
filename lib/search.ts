import { supabase } from './supabase';
import type { Post, Profile, Project } from '../types/database';

export type SearchResults = {
  projects: Project[];
  profiles: Profile[];
};

// Recherche simple par mot-clé sur les projets (titre/résumé/secteur) et les profils
// (nom, entreprise, organisation) — utilisée par la barre de recherche du fil d'actualité.
export async function searchProjectsAndProfiles(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return { projects: [], profiles: [] };

  const [{ data: projects }, { data: profiles }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%,sector.ilike.%${q}%,country.ilike.%${q}%`)
      .limit(10),
    supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%,organization.ilike.%${q}%,headline.ilike.%${q}%`)
      .limit(10),
  ]);

  return {
    projects: (projects as Project[]) ?? [],
    profiles: (profiles as Profile[]) ?? [],
  };
}

// Recherche de projets à partir des filtres de la barre d'outils (Localisation / Catégorie /
// Etat / mot-clé). Les projets non publiés ('draft') restent exclus.
export async function searchProjectsFiltered(filters: {
  country: string | null;
  sector: string | null;
  state: string | null;
  query: string;
}): Promise<Project[]> {
  let q = supabase
    .from('projects')
    .select('*')
    .in('status', filters.state ? [filters.state] : ['published', 'funded', 'closed'])
    .order('created_at', { ascending: false })
    .limit(30);

  if (filters.country) q = q.eq('country', filters.country);
  if (filters.sector) q = q.eq('sector', filters.sector);
  if (filters.query.trim().length >= 2) {
    const kw = filters.query.trim();
    q = q.or(`title.ilike.%${kw}%,summary.ilike.%${kw}%`);
  }

  const { data } = await q;
  return (data as Project[]) ?? [];
}

// Profils à afficher par défaut sur l'écran de recherche (avant saisie d'un mot-clé).
export async function fetchBrowseProfiles(excludeId: string): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_completed', true)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(30);
  return (data as Profile[]) ?? [];
}

// Mosaïque de publications pour l'écran de recherche/exploration façon Instagram : les photos
// mènent au profil de leur auteur (pas à un profil directement).
export async function fetchRecentPostPhotos(limit = 60): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as Post[]) ?? [];
}

export async function searchProfilesOnly(query: string): Promise<Profile[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%,organization.ilike.%${q}%,headline.ilike.%${q}%`)
    .limit(10);
  return (data as Profile[]) ?? [];
}

// Pour un profil entrepreneur trouvé dans la recherche, renvoie ses projets publiés
// (pour afficher l'avancement du financement directement dans les résultats).
export async function fetchProjectsForOwner(ownerId: string): Promise<Project[]> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  return (data as Project[]) ?? [];
}
