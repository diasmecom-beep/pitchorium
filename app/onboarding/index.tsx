import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../context/AuthProvider';
import { EntrepreneurOnboardingForm } from '../../components/onboarding/EntrepreneurOnboardingForm';
import { ContributeurOnboardingForm } from '../../components/onboarding/ContributeurOnboardingForm';

export default function Onboarding() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return profile.role === 'entrepreneur' ? (
    <EntrepreneurOnboardingForm profile={profile} />
  ) : (
    <ContributeurOnboardingForm profile={profile} />
  );
}
