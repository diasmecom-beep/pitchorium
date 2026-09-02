import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export function HomeButton() {
  return (
    <TouchableOpacity style={styles.button} onPress={() => router.replace('/')} accessibilityLabel="Accueil">
      <Text style={styles.icon}>🌍</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#132D46',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  icon: { fontSize: 20 },
});
