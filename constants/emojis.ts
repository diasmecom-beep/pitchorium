import { FLAG_EMOJIS } from './flags';

// Émojis "cheveux afro" (personne aux cheveux bouclés, dans plusieurs teints de peau) — les mêmes
// que ceux recensés sous "afro" sur emojiterra/emojidb, qui reposent sur le codepoint "cheveux
// bouclés" (U+1F9B1) combiné à une personne et un ton de peau.
export const AFRO_EMOJIS: string[] = [
  '🧑🏿‍🦱', '🧑🏾‍🦱', '🧑🏽‍🦱',
  '👩🏿‍🦱', '👩🏾‍🦱', '👩🏽‍🦱',
  '👨🏿‍🦱', '👨🏾‍🦱', '👨🏽‍🦱',
  '🦱',
];

// Modificateurs de teint (Fitzpatrick) : ajoutés après un émoji "personne/geste" pour changer sa
// couleur de peau, comme sur un clavier emoji natif.
export const SKIN_TONE_MODIFIERS: { modifier: string; swatch: string }[] = [
  { modifier: '', swatch: '#FFCC4D' },
  { modifier: '\u{1F3FB}', swatch: '#F7DECE' },
  { modifier: '\u{1F3FC}', swatch: '#E5C298' },
  { modifier: '\u{1F3FD}', swatch: '#C89665' },
  { modifier: '\u{1F3FE}', swatch: '#A56A3F' },
  { modifier: '\u{1F3FF}', swatch: '#5C4033' },
];

// Émojis "geste/personne" qui acceptent un modificateur de teint — l'ajouter à un autre émoji
// n'a aucun effet visuel, donc on ne le fait que pour ceux-ci.
export const SKIN_TONE_ELIGIBLE = new Set([
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
  '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '👶', '🧒', '👦', '👧', '🧑',
  '🧓', '👴', '👵', '🕺', '💃', '🤝', '🫶',
]);

// Un large choix d'émojis courants, groupés par catégorie façon clavier emoji natif
// (visages, gestes/personnes, nature, nourriture, activités, objets, symboles, drapeaux).
export const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Visages',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
      '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
      '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
    ],
  },
  {
    label: 'Gestes & personnes',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏',
      '✍️', '💪', '🦾', '🧠', '👀', '👁️', '👶', '🧒', '👦', '👧',
      '🧑', '👨', '👩', '🧓', '👴', '👵', '🕺', '💃', '🧑‍💼', '👨‍💻',
      '👩‍💻', '🤝', '🫶',
    ],
  },
  {
    label: 'Coeurs & amour',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😻',
    ],
  },
  {
    label: 'Nature & météo',
    emojis: [
      '🌍', '🌎', '🌏', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿',
      '🍀', '🍁', '🍂', '🍃', '🌸', '🌺', '🌻', '🌼', '🌷', '🌹',
      '🐘', '🦁', '🐆', '🐍', '🦜', '🐝', '🦋', '☀️', '🌤️', '⛅',
      '🌦️', '🌧️', '⛈️', '🌩️', '🌈', '☔', '❄️', '🔥', '💧', '🌊',
    ],
  },
  {
    label: 'Nourriture',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍍',
      '🥭', '🥑', '🍆', '🌽', '🥕', '🍞', '🥐', '🧀', '🍗', '🍕',
      '🌮', '🥗', '🍲', '🍛', '🍜', '🍣', '🍩', '🍪', '🎂', '🍫',
      '☕', '🍵', '🥤', '🍷', '🍾',
    ],
  },
  {
    label: 'Activités',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
      '🥊', '🥋', '🏆', '🏅', '🥇', '🥈', '🥉', '🎯', '🎮', '🎲',
      '🧩', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻', '🥁',
      '🚀', '✈️', '🚗', '🚲', '⛵', '🏖️', '🏔️', '🗺️',
    ],
  },
  {
    label: 'Objets & travail',
    emojis: [
      '💡', '🔦', '🕯️', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '🎥',
      '📞', '☎️', '📠', '📺', '📻', '⏰', '⏳', '🔋', '🔌', '💰',
      '💵', '💳', '💎', '⚖️', '🔧', '🔨', '🛠️', '⚙️', '🔑', '🔒',
      '📌', '📎', '✂️', '📝', '📚', '📖', '📅', '📈', '📊', '📢',
      '📣', '🔔', '🧭', '🔍',
    ],
  },
  {
    label: 'Symboles',
    emojis: [
      '✅', '❌', '⭐', '🌟', '✨', '💫', '⚡', '💥', '💯', '🎉',
      '🎊', '🎁', '❗', '❓', '⁉️', '💬', '💭', '♻️', '🆕', '🔝',
    ],
  },
  {
    label: 'Afro',
    emojis: AFRO_EMOJIS,
  },
  {
    label: 'Drapeaux',
    emojis: FLAG_EMOJIS,
  },
];

export const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
