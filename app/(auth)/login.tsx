import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { PitchoriumLogo } from '../../components/icons/PitchoriumLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setSubmitting(false);
      setError(signInError.message);
      return;
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', data.user.id)
      .single();
    setSubmitting(false);
    router.replace(profileData?.onboarding_completed ? '/(tabs)' : '/onboarding');
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleSubmitting(true);
    const redirectTo = Platform.OS === 'web' ? window.location.origin : Linking.createURL('/');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleSubmitting(false);
    }
    // Sur le web, signInWithOAuth redirige la page entière vers Google : le retour est géré
    // par la garde de routage dans app/index.tsx une fois la session établie.
  };

  return (
    <View style={styles.container}>
      <PitchoriumLogo size="lg" clickable={false} />
      <Text style={styles.subtitle}>Connectez-vous</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Connexion...' : 'Se connecter'}</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={googleSubmitting}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.googleButtonText}>
          {googleSubmitting ? 'Redirection...' : 'Continuer avec Google'}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" style={styles.link}>
        <Text>Pas encore de compte ? Inscrivez-vous</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 12, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#132D46',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#B3452C' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D9D0C0' },
  dividerText: { fontSize: 12, color: '#888' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 13,
    backgroundColor: '#fff',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
    borderWidth: 1.5,
    borderColor: '#4285F4',
    borderRadius: 999,
    width: 22,
    height: 22,
    textAlign: 'center',
    lineHeight: 20,
  },
  googleButtonText: { color: '#222', fontWeight: '600', fontSize: 15 },
  link: { marginTop: 16, alignSelf: 'center' },
});
