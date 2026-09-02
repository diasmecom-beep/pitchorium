import { View } from 'react-native';
import { COLORS } from '../../constants/theme';

// Petite pousse stylisée (deux feuilles + tige), construite à partir de formes simples —
// utilisée pour l'onglet "Projets" (croissance, développement).
export function SproutIcon({ size = 24, color = COLORS.success }: { size?: number; color?: string }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          position: 'absolute',
          bottom: s * 0.32,
          left: s * 0.5 - s * 0.02,
          width: s * 0.42,
          height: s * 0.22,
          borderTopLeftRadius: s * 0.4,
          borderBottomRightRadius: s * 0.4,
          backgroundColor: color,
          transform: [{ rotate: '-20deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: s * 0.32,
          right: s * 0.5 - s * 0.02,
          width: s * 0.42,
          height: s * 0.22,
          borderTopRightRadius: s * 0.4,
          borderBottomLeftRadius: s * 0.4,
          backgroundColor: color,
          transform: [{ rotate: '20deg' }],
        }}
      />
      <View style={{ width: s * 0.1, height: s * 0.34, backgroundColor: color, borderRadius: s * 0.05 }} />
      <View
        style={{
          width: s * 0.62,
          height: s * 0.08,
          backgroundColor: color,
          borderRadius: s * 0.04,
          opacity: 0.45,
          marginTop: s * 0.04,
        }}
      />
    </View>
  );
}
