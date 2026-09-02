import { View } from 'react-native';
import { COLORS } from '../../constants/theme';

// Baobab stylisé, construit à partir de formes simples (aucune dépendance SVG) : silhouette
// reconnaissable — tronc large, ramure évasée — symbole de résilience et d'ancrage africain,
// utilisé pour le Portefeuille d'Impact.
export function BaobabIcon({ size = 24, color = COLORS.accent }: { size?: number; color?: string }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center' }}>
      <View
        style={{
          width: s * 0.78,
          height: s * 0.4,
          borderRadius: s * 0.4,
          backgroundColor: color,
          position: 'absolute',
          top: 0,
        }}
      />
      <View
        style={{
          width: s * 0.32,
          height: s * 0.3,
          borderRadius: s * 0.16,
          backgroundColor: color,
          position: 'absolute',
          top: s * 0.06,
          left: 0,
        }}
      />
      <View
        style={{
          width: s * 0.32,
          height: s * 0.3,
          borderRadius: s * 0.16,
          backgroundColor: color,
          position: 'absolute',
          top: s * 0.06,
          right: 0,
        }}
      />
      <View
        style={{
          width: s * 0.22,
          height: s * 0.44,
          backgroundColor: color,
          position: 'absolute',
          top: s * 0.34,
          left: s * 0.39,
          borderRadius: s * 0.04,
        }}
      />
      <View
        style={{
          width: s * 0.5,
          height: s * 0.08,
          backgroundColor: color,
          position: 'absolute',
          bottom: 0,
          borderRadius: s * 0.04,
          opacity: 0.5,
        }}
      />
    </View>
  );
}
