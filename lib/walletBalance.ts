import { supabase } from './supabase';
import type { WalletTransaction } from '../types/database';

// Réserve pré-provisionnée : PAS un portefeuille électronique réel. Pitchorium ne détient ni ne
// déplace de fonds — ce solde est auto-déclaré par le contributeur (comme un budget personnel)
// et sert uniquement à accélérer ses contributions dans l'appli.

export async function fetchTransactions(profileId: string): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data as WalletTransaction[]) ?? [];
}

export async function addFunds(profileId: string, currentBalance: number, amount: number, note?: string) {
  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert({ profile_id: profileId, amount, type: 'topup', note: note || null });
  if (txError) throw txError;
  const { error } = await supabase
    .from('profiles')
    .update({ available_balance: currentBalance + amount })
    .eq('id', profileId);
  if (error) throw error;
}

export async function spendFromBalance(profileId: string, currentBalance: number, amount: number, note?: string) {
  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert({ profile_id: profileId, amount: -amount, type: 'pledge', note: note || null });
  if (txError) throw txError;
  const { error } = await supabase
    .from('profiles')
    .update({ available_balance: Math.max(0, currentBalance - amount) })
    .eq('id', profileId);
  if (error) throw error;
}
