// Charte graphique Pitchorium — sobre, sérieuse et chaleureuse.
// Navy profond = sécurité / fiabilité / sérieux financier.
// Terracotta = solidarité avec l'Afrique, chaleur humaine.
// Vert savane = croissance, réussite, développement pragmatique.
export const COLORS = {
  primary: '#132D46',
  primaryDark: '#0B1D2E',
  primaryLight: '#1F3F5C',
  accent: '#C1652F',
  accentLight: '#E8A46B',
  success: '#2E7D5C',
  successLight: '#DDEEE6',
  gold: '#D9A441',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  border: '#E7E0D3',
  inputBorder: '#D9D0C0',
  textPrimary: '#1C1B18',
  textSecondary: '#6B6459',
  textMuted: '#8A8072',
  danger: '#B3452C',
  white: '#FFFFFF',
} as const;

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Largeur maximale du contenu principal (fil, profils...) sur grand écran — au-delà d'un mobile,
// une photo pleine largeur sur un moniteur large est illisible, donc on centre une colonne façon
// application sociale plutôt que d'étirer le contenu sur toute la fenêtre.
export const MAX_CONTENT_WIDTH = 600;

// Ombre douce cross-platform (iOS/Android/Web) pour les cartes — donne de la profondeur
// sans être trop marquée, cohérent avec une identité "sobre".
export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;
