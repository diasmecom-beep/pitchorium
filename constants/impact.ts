// Référentiel d'impact Pitchorium — auto-déclaratif, utilisé pour calculer un score
// de durabilité/impact (0-100) affiché sur les profils entrepreneurs et sur les projets,
// et permettant de les classer (vitrine triée par impact).

export type ImpactCriterion = {
  key: string;
  label: string;
  helpText: string;
};

export const IMPACT_CRITERIA: ImpactCriterion[] = [
  {
    key: 'environnement',
    label: "Respect de l'environnement",
    helpText: 'Réduction de l\'empreinte écologique, usage de ressources et matériaux durables.',
  },
  {
    key: 'durabilite_economique',
    label: 'Durabilité économique',
    helpText: 'Modèle économique viable sur le long terme, résilience face aux chocs.',
  },
  {
    key: 'autonomisation',
    label: 'Autonomisation des bénéficiaires',
    helpText:
      "Renforce l'autonomie financière ou opérationnelle de ses bénéficiaires (agriculteurs, artisans, clients...).",
  },
  {
    key: 'parite',
    label: 'Égalité femmes-hommes',
    helpText: "Présence de femmes dans l'équipe/la gouvernance, produits ou services adressés aux femmes.",
  },
  {
    key: 'jeunesse',
    label: 'Inclusion des jeunes',
    helpText: 'Emploi, formation ou opportunités concrètes pour les jeunes.',
  },
  {
    key: 'utilite_publique',
    label: "Service d'utilité publique",
    helpText: 'Répond à un besoin essentiel : santé, éducation, énergie, eau, alimentation...',
  },
  {
    key: 'inclusion_sociale',
    label: 'Inclusion sociale',
    helpText: 'Accessibilité pour les populations vulnérables, zones rurales/enclavées, personnes en situation de handicap.',
  },
  {
    key: 'emplois_locaux',
    label: "Création d'emplois locaux",
    helpText: "Nombre et qualité des emplois créés localement.",
  },
  {
    key: 'transfert_competences',
    label: 'Transfert de compétences & éducation',
    helpText: "Formation et montée en compétences des équipes ou des bénéficiaires.",
  },
  {
    key: 'gouvernance',
    label: 'Gouvernance responsable',
    helpText: 'Transparence, éthique, redevabilité envers les parties prenantes.',
  },
  {
    key: 'synergie_diaspora',
    label: 'Synergie Afrique - Diaspora',
    helpText:
      'Contribue à créer des ponts concrets entre entrepreneurs africains et afrodescendants européens.',
  },
  {
    key: 'bien_etre',
    label: 'Bien-être',
    helpText: 'Contribue à la santé mentale, physique ou à la qualité de vie des bénéficiaires et des équipes.',
  },
];

export const IMPACT_LEVELS = [
  { value: '0', label: 'Non concerné' },
  { value: '1', label: 'Partiellement' },
  { value: '2', label: 'Important' },
  { value: '3', label: 'Central' },
] as const;

export type ImpactScores = Record<string, number>;

// Score agrégé 0-100 à partir des niveaux (0-3) renseignés pour chaque critère.
export function computeImpactScore(scores: ImpactScores): number {
  const maxPerCriterion = 3;
  const total = IMPACT_CRITERIA.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0);
  const max = IMPACT_CRITERIA.length * maxPerCriterion;
  if (max === 0) return 0;
  return Math.round((total / max) * 100);
}

export function labelForImpactTier(score: number): string {
  if (score >= 70) return 'Fort impact';
  if (score >= 40) return 'Impact modéré';
  if (score > 0) return 'Impact émergent';
  return 'Non renseigné';
}

// Seuils proposés pour le filtre "impact minimum" (Vitrine, Découvrir).
export const IMPACT_MIN_FILTERS = [
  { value: '0', label: 'Tous' },
  { value: '40', label: '40+ (modéré)' },
  { value: '70', label: '70+ (fort impact)' },
] as const;
