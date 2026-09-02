import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { addFunds, fetchTransactions } from '../lib/walletBalance';
import { BaobabIcon } from '../components/icons/BaobabIcon';
import { COLORS, RADIUS } from '../constants/theme';
import type { Pledge, Project, TimeContribution, WalletTransaction } from '../types/database';

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function Wallet() {
  const { profile, refreshProfile } = useAuth();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [projectsById, setProjectsById] = useState<Record<string, Project>>({});
  const [timeLogs, setTimeLogs] = useState<TimeContribution[]>([]);
  const [loading, setLoading] = useState(true);

  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupOpen, setTopupOpen] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    fetchTransactions(profile.id).then(setTransactions);
    const [{ data: pl }, { data: tc }] = await Promise.all([
      supabase
        .from('pledges')
        .select('*')
        .eq('backer_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false }),
      supabase
        .from('time_contributions')
        .select('*')
        .eq('contributor_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);
    const pledgeRows = (pl as Pledge[]) ?? [];
    setPledges(pledgeRows);
    setTimeLogs((tc as TimeContribution[]) ?? []);

    const projectIds = [...new Set(pledgeRows.map((p) => p.project_id))];
    if (projectIds.length) {
      const { data: projects } = await supabase.from('projects').select('*').in('id', projectIds);
      const map: Record<string, Project> = {};
      (projects as Project[] | null)?.forEach((p) => (map[p.id] = p));
      setProjectsById(map);
    }
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = useMemo(() => {
    const pledgesThisMonth = pledges.filter((p) => isThisMonth(p.created_at));
    const amountThisMonth = pledgesThisMonth.reduce((sum, p) => sum + p.amount, 0);
    const amountAllTime = pledges.reduce((sum, p) => sum + p.amount, 0);
    const projectsSupported = new Set(pledges.map((p) => p.project_id)).size;
    const projectsThisMonth = new Set(pledgesThisMonth.map((p) => p.project_id)).size;

    const hoursThisMonthLogs = timeLogs.filter((t) => isThisMonth(t.created_at));
    const hoursThisMonth = hoursThisMonthLogs.reduce((sum, t) => sum + t.hours, 0);
    const hoursAllTime = timeLogs.reduce((sum, t) => sum + t.hours, 0);

    return { amountThisMonth, amountAllTime, projectsSupported, projectsThisMonth, hoursThisMonth, hoursAllTime };
  }, [pledges, timeLogs]);

  const handleAddTime = async () => {
    if (!profile) return;
    setError(null);
    if (!(Number(hours) > 0)) {
      setError('Indiquez un nombre d\'heures valide.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('time_contributions').insert({
      contributor_id: profile.id,
      hours: Number(hours),
      description: description || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setHours('');
    setDescription('');
    load();
  };

  const handleAddFunds = async () => {
    if (!profile) return;
    const value = Number(topupAmount);
    if (!(value > 0)) return;
    setToppingUp(true);
    try {
      await addFunds(profile.id, profile.available_balance ?? 0, value);
      await refreshProfile();
      setTopupAmount('');
      setTopupOpen(false);
      load();
    } finally {
      setToppingUp(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <BaobabIcon size={30} color={COLORS.accent} />
        <Text style={styles.title}>Mon portefeuille d'impact</Text>
      </View>
      <Text style={styles.subtitle}>La valeur ajoutée que vous créez sur Pitchorium.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ce mois-ci</Text>
        <Text style={styles.summaryLine}>
          {stats.amountThisMonth.toLocaleString('fr-FR')} € investis · {stats.projectsThisMonth} projet(s)
          soutenu(s)
        </Text>
        <Text style={styles.summaryLine}>{stats.hoursThisMonth}h de savoir partagées</Text>
      </View>

      <View style={styles.summaryCardAlt}>
        <Text style={styles.summaryTitleAlt}>Depuis le début</Text>
        <Text style={styles.summaryLineAlt}>
          {stats.amountAllTime.toLocaleString('fr-FR')} € investis au total · {stats.projectsSupported} projet(s)
          soutenu(s)
        </Text>
        <Text style={styles.summaryLineAlt}>{stats.hoursAllTime}h de savoir partagées au total</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeaderRow}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <TouchableOpacity onPress={() => setTopupOpen((v) => !v)}>
            <Text style={styles.balanceAddLink}>{topupOpen ? 'Annuler' : '+ Ajouter des fonds'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>{(profile.available_balance ?? 0).toLocaleString('fr-FR')} €</Text>
        <Text style={styles.balanceDisclaimer}>
          Ceci n'est pas un portefeuille électronique réel : Pitchorium ne détient ni ne déplace de
          fonds. C'est une réserve que vous déclarez et gérez vous-même, pour contribuer plus vite
          dans l'appli sans ressaisir un moyen de paiement à chaque fois.
        </Text>
        {topupOpen && (
          <View style={styles.topupRow}>
            <TextInput
              style={[styles.input, styles.topupInput]}
              value={topupAmount}
              onChangeText={setTopupAmount}
              keyboardType="numeric"
              placeholder="Montant (€)"
            />
            <TouchableOpacity style={styles.topupButton} onPress={handleAddFunds} disabled={toppingUp}>
              <Text style={styles.buttonText}>{toppingUp ? '...' : 'Ajouter'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {transactions.length > 0 && (
          <View style={styles.transactionList}>
            {transactions.slice(0, 5).map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <Text style={[styles.transactionAmount, tx.amount < 0 && styles.transactionNegative]}>
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount.toLocaleString('fr-FR')} €
                </Text>
                <Text style={styles.transactionDate}>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Ajouter du temps partagé</Text>
      <Text style={styles.hint}>
        Mentorat, conseil, formation... déclarez le temps que vous avez consacré à des entrepreneurs.
      </Text>
      <Text style={styles.label}>Heures</Text>
      <TextInput style={styles.input} value={hours} onChangeText={setHours} keyboardType="numeric" />
      <Text style={styles.label}>Description (optionnel)</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Session de mentorat avec AgriConnect Bénin"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleAddTime} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Ajout...' : '+ Ajouter'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historique</Text>
      {pledges.length === 0 && timeLogs.length === 0 && (
        <Text style={styles.hint}>Aucune contribution enregistrée pour le moment.</Text>
      )}
      {pledges.map((p) => (
        <View key={p.id} style={styles.historyRow}>
          <Text style={styles.historyAmount}>{p.amount.toLocaleString('fr-FR')} €</Text>
          <Text style={styles.historyDetail}>
            {projectsById[p.project_id]?.title ?? 'Projet'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      ))}
      {timeLogs.map((t) => (
        <View key={t.id} style={styles.historyRow}>
          <Text style={styles.historyAmount}>{t.hours}h</Text>
          <Text style={styles.historyDetail}>
            {t.description ?? 'Temps partagé'} · {new Date(t.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 60, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '700', flexShrink: 1 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#132D46',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    marginBottom: 12,
  },
  summaryCardAlt: {
    backgroundColor: '#F3EDE2',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    marginBottom: 8,
  },
  summaryTitle: { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  summaryLine: { color: '#e6e6f0', fontSize: 15, fontWeight: '600' },
  summaryTitleAlt: { color: '#132D46', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  summaryLineAlt: { color: '#333', fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', marginBottom: 4 },
  label: { fontSize: 13, color: '#666', marginTop: 8, marginBottom: 2 },
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
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#B3452C', marginTop: 6 },
  historyRow: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E7E0D3',
  },
  historyAmount: { fontWeight: '700', color: '#132D46' },
  historyDetail: { fontSize: 12, color: '#777', marginTop: 2 },
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  balanceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  balanceAddLink: { fontSize: 13, color: COLORS.accent, fontWeight: '700' },
  balanceAmount: { fontSize: 30, fontWeight: '800', color: COLORS.primary },
  balanceDisclaimer: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15, marginTop: 2 },
  topupRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  topupInput: { flex: 1 },
  topupButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionList: { marginTop: 10, gap: 4, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  transactionAmount: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  transactionNegative: { color: COLORS.danger },
  transactionDate: { fontSize: 12, color: COLORS.textMuted },
});
