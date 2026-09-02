import { NEED_TO_CONTRIBUTION_TYPES } from '../constants/taxonomy';
import type { Profile } from '../types/database';

function intersects(a: string[], b: string[]) {
  return a.some((v) => b.includes(v));
}

// Un contributeur est pertinent pour un entrepreneur si leurs secteurs se recoupent,
// ou si l'un des rôles du contributeur répond à l'un des besoins de l'entrepreneur.
export function isContributeurRelevantForEntrepreneur(entrepreneur: Profile, contributeur: Profile) {
  if (entrepreneur.sector && contributeur.sectors_of_interest?.includes(entrepreneur.sector)) return true;
  const relevantTypes = (entrepreneur.needs ?? []).flatMap((need) => NEED_TO_CONTRIBUTION_TYPES[need] ?? []);
  return intersects(relevantTypes, contributeur.contribution_types ?? []);
}

export function isEntrepreneurRelevantForContributeur(contributeur: Profile, entrepreneur: Profile) {
  return isContributeurRelevantForEntrepreneur(entrepreneur, contributeur);
}

// Deux entrepreneurs sont complémentaires s'ils partagent un terrain commun (pays, zone
// d'impact) mais opèrent dans des secteurs différents — synergies plutôt que concurrence —
// ou s'ils expriment des besoins qui se recoupent avec l'expertise de l'autre (mentorat entre
// pairs, partage de fournisseurs/partenaires...).
export function areEntrepreneursComplementary(a: Profile, b: Profile) {
  if (a.id === b.id) return false;
  const sameSector = a.sector && b.sector && a.sector === b.sector;
  const sharedGround = (a.country && a.country === b.country) || (a.city && a.city === b.city);
  if (sharedGround && !sameSector) return true;

  const needsOverlapWithExpertise =
    intersects(a.needs ?? [], b.expertise_needed ?? []) || intersects(b.needs ?? [], a.expertise_needed ?? []);
  if (needsOverlapWithExpertise) return true;

  return intersects(a.needs ?? [], ['partenariats', 'communaute']) && intersects(b.needs ?? [], ['partenariats', 'communaute']);
}
