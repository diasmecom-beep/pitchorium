import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Compléter mon profil' }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
