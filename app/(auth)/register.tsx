import { useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { PitchoriumLogo } from '../../components/icons/PitchoriumLogo';
import type { UserRole } from '../../types/database';

export default function Register() {
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName } },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      // La confirmation par email est activée sur le projet Supabase :
      // aucune session n'est ouverte tant que le lien reçu par email n'est pas cliqué.
      setConfirmationSent(true);
      return;
    }
    router.replace('/onboarding');
  };

  if (confirmationSent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.subtitle}>
          Un email de confirmation a été envoyé à {email}. Cliquez sur le lien qu'il contient pour
          activer votre compte, puis connectez-vous.
        </Text>
        <Link href="/(auth)/login" style={styles.link}>
          <Text>Retour à la connexion</Text>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PitchoriumLogo size="sm" clickable={false} />
      <Text style={styles.title}>Créer un compte</Text>

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'entrepreneur' && styles.roleButtonActive]}
          onPress={() => setRole('entrepreneur')}
        >
          <Text style={role === 'entrepreneur' ? styles.roleTextActive : styles.roleText}>
            Entrepreneur
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'contributeur' && styles.roleButtonActive]}
          onPress={() => setRole('contributeur')}
        >
          <Text style={role === 'contributeur' ? styles.roleTextActive : styles.roleText}>
            Contributeur
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.roleHint}>
        {role === 'entrepreneur'
          ? "Vous portez un projet et cherchez du soutien."
          : 'Investisseur, mécène, mentor, expert, partenaire... vous soutenez des projets.'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom complet"
        value={fullName}
        onChangeText={setFullName}
      />
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

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Création...' : "S'inscrire"}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        <Text>Déjà un compte ? Connectez-vous</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#555', lineHeight: 22 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  roleHint: { fontSize: 13, color: '#777', marginBottom: 8 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D9D0C0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  roleButtonActive: { backgroundColor: '#132D46', borderColor: '#132D46' },
  roleText: { color: '#333' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
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
  link: { marginTop: 16, alignSelf: 'center' },
});
