import { supabase } from './supabase';

const MISSING_COLUMN_RE = /Could not find the '([^']+)' column/;

// Insère/met à jour en retirant automatiquement les colonnes qu'une migration pas encore
// exécutée n'a pas encore créées (erreur PostgREST PGRST204 "colonne introuvable"), pour que la
// publication réussisse quand même avec les champs disponibles plutôt que d'échouer entièrement.
export async function insertResilient(table: string, rows: Record<string, unknown>[]) {
  let payload = rows.map((r) => ({ ...r }));
  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await supabase.from(table).insert(payload);
    if (!error) return;
    const match = error.message?.match(MISSING_COLUMN_RE);
    if (match && payload.some((r) => match[1] in r)) {
      payload = payload.map((r) => {
        const next = { ...r };
        delete next[match[1]];
        return next;
      });
      continue;
    }
    throw error;
  }
  throw new Error('Publication impossible : trop de colonnes manquantes en base.');
}

export async function updateResilient(table: string, id: string, updates: Record<string, unknown>) {
  let payload = { ...updates };
  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await supabase.from(table).update(payload).eq('id', id);
    if (!error) return;
    const match = error.message?.match(MISSING_COLUMN_RE);
    if (match && match[1] in payload) {
      const next = { ...payload };
      delete next[match[1]];
      payload = next;
      continue;
    }
    throw error;
  }
  throw new Error('Mise à jour impossible : trop de colonnes manquantes en base.');
}
