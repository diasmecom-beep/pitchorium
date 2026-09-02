import { COLORS } from './theme';
import type { ReactionKey } from '../types/database';

export const REACTIONS: { key: ReactionKey; emoji: string; label: string; color: string }[] = [
  { key: 'heart', emoji: '❤️', label: "J'aime", color: COLORS.danger },
  { key: 'thumbsup', emoji: '👍', label: "Pouce levé", color: COLORS.success },
  { key: 'thumbsdown', emoji: '👎', label: 'Pouce baissé', color: COLORS.textMuted },
  { key: 'fire', emoji: '🔥', label: 'Flammes', color: COLORS.accent },
  { key: 'target', emoji: '🎯', label: 'Cible', color: COLORS.primary },
  { key: 'rocket', emoji: '🚀', label: 'Fusée', color: COLORS.gold },
  { key: 'handshake', emoji: '🤝', label: 'Poignée de main', color: COLORS.success },
  { key: 'sad', emoji: '😢', label: 'Triste', color: COLORS.textMuted },
  { key: 'laugh', emoji: '😂', label: 'Rire', color: COLORS.accentLight },
];

export function reactionByKey(key: string | null | undefined) {
  return REACTIONS.find((r) => r.key === key) ?? null;
}
