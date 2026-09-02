export const SECTORS = [
  'AgriTech',
  'EdTech',
  'FinTech',
  'Santé / HealthTech',
  'Énergie / CleanTech',
  'Commerce & Retail',
  'Industrie & Manufacturing',
  'Tourisme & Culture',
  'Services aux entreprises',
  'Économie créative & Médias',
  'Mobilité & Logistique',
  'Artisanat',
  'Cosmétiques & Bien-être',
  'Textile & Tissage',
  'Couture & Mode',
  'Métiers manuels & Bâtiment',
  'Menuiserie & Ébénisterie',
  'Bijouterie & Joaillerie',
  'Restauration & Métiers de bouche',
  'Coiffure & Esthétique',
  'Agroalimentaire & Transformation',
  'Autre',
] as const;

export const IMPACT_AREAS = [
  'Emploi des jeunes',
  'Inclusion financière',
  'Égalité femmes-hommes',
  'Climat & environnement',
  'Éducation',
  'Santé',
  'Diaspora & migration',
  'Développement rural',
  'Autre',
] as const;

export const PROJECT_STAGES = [
  { value: 'idee', label: 'Idée' },
  { value: 'prototype', label: 'Prototype / MVP' },
  { value: 'early', label: 'Early stage (premiers clients)' },
  { value: 'croissance', label: 'Croissance' },
  { value: 'scale', label: 'Scale-up / Expansion' },
] as const;

export const TEAM_SIZES = ['1 (solo)', '2-5', '6-10', '11-50', '50+'] as const;

// Ce qu'un entrepreneur peut rechercher sur la plateforme.
export const ENTREPRENEUR_NEEDS = [
  { value: 'visibilite', label: 'Visibilité' },
  { value: 'financement', label: 'Financement' },
  { value: 'mentorat', label: 'Mentorat' },
  { value: 'accompagnement', label: 'Accompagnement / Formation' },
  { value: 'expertise', label: 'Expertise dans un domaine précis' },
  { value: 'communaute', label: "Communauté d'échange / Réseau" },
  { value: 'partenariats', label: 'Partenariats commerciaux' },
  { value: 'recrutement', label: 'Recrutement de talents' },
  { value: 'marche', label: 'Accès à de nouveaux marchés (Europe/Afrique)' },
] as const;

export const EXPERTISE_DOMAINS = [
  'Juridique',
  'Comptabilité & Finance',
  'Marketing & Communication',
  'Vente & Développement commercial',
  'Technologie & Digital',
  'Ressources humaines',
  'Stratégie & Gestion',
  'Export & International',
  'Levée de fonds',
  'Propriété intellectuelle',
  'Opérations & Supply chain',
  'Autre',
] as const;

// Rôle(s) qu'un contributeur choisit de jouer sur la plateforme (sélection multiple).
export const CONTRIBUTION_TYPES = [
  { value: 'investisseur', label: 'Investisseur' },
  { value: 'mecene', label: 'Mécène / Donateur' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'expert', label: 'Expert / Consultant' },
  { value: 'partenaire', label: 'Partenaire commercial' },
  { value: 'recruteur', label: "Recruteur / Pourvoyeur d'emploi" },
] as const;

export const FUNDING_INSTRUMENTS = [
  'Don',
  'Subvention',
  "Prêt d'honneur",
  'Love money',
  'Prise de participation (equity)',
  'Obligations convertibles',
  'Crowdfunding',
] as const;

export const MECENAT_TYPES = [
  'Don financier',
  'Don en nature / matériel',
  "Sponsoring d'événement",
  'Mécénat de compétences',
] as const;

export const MENTOR_AVAILABILITY = ['Ponctuelle', 'Quelques heures / mois', 'Régulière / récurrente'] as const;

export const MENTOR_FORMATS = ['Visio', 'Présentiel', 'Les deux'] as const;

export const EXPERT_MISSION_TYPES = [
  'Audit / Diagnostic',
  'Formation',
  'Conseil ponctuel',
  'Accompagnement continu',
] as const;

type Labeled = { value: string; label: string };

function findLabel(options: readonly (string | Labeled)[], value: string): string {
  const match = options.find((o) => (typeof o === 'string' ? o === value : o.value === value));
  if (!match) return value;
  return typeof match === 'string' ? match : match.label;
}

export function labelForNeed(value: string) {
  return findLabel(ENTREPRENEUR_NEEDS, value);
}

export function labelForContributionType(value: string) {
  return findLabel(CONTRIBUTION_TYPES, value);
}

export function labelForStage(value: string) {
  return findLabel(PROJECT_STAGES, value);
}

// Nature de la structure du contributeur — permet de distinguer particuliers, entreprises,
// ONG/associations, fondations et institutions.
export const ORGANIZATION_TYPES = [
  'Particulier',
  'Entreprise privée',
  'ONG / Association (loi 1901, ASBL...)',
  'Fondation',
  'Institution publique',
  'Organisation internationale',
  'Coopérative',
  'Autre',
] as const;

export function labelForOrganizationType(value: string) {
  return findLabel(ORGANIZATION_TYPES, value);
}

export const PAYMENT_METHODS = [
  'Carte bancaire',
  'Virement bancaire',
  'Mobile Money',
  'PayPal',
  'Espèces (remise en main propre)',
] as const;

// Durées de campagne proposées (en jours) — la plateforme impose un minimum de 30 et un maximum de 90.
export const CAMPAIGN_DURATIONS = [30, 45, 60, 75, 90] as const;

// Commission par défaut prélevée par la plateforme sur les fonds collectés.
export const DEFAULT_PLATFORM_FEE_PERCENT = 5;

export function labelForFundingInstrument(value: string) {
  return findLabel(FUNDING_INSTRUMENTS, value);
}

// Correspondance besoin d'entrepreneur -> type(s) de contributeur pertinent(s), utilisée pour le matching.
export const NEED_TO_CONTRIBUTION_TYPES: Record<string, string[]> = {
  financement: ['investisseur', 'mecene'],
  mentorat: ['mentor'],
  accompagnement: ['mentor', 'expert'],
  expertise: ['expert', 'mentor'],
  partenariats: ['partenaire'],
  recrutement: ['recruteur'],
  visibilite: ['investisseur', 'mecene', 'partenaire'],
  communaute: ['investisseur', 'mecene', 'mentor', 'expert', 'partenaire', 'recruteur'],
  marche: ['partenaire', 'investisseur'],
};
