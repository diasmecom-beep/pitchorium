import { supabase } from './supabase';

// Renvoie l'id de la conversation entre les deux profils, en la créant si besoin.
// L'ordre canonique (tri lexicographique des ids) évite les doublons de conversation.
export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  const [participantOne, participantTwo] = [userId, otherUserId].sort();

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_one_id', participantOne)
    .eq('participant_two_id', participantTwo)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_one_id: participantOne, participant_two_id: participantTwo })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}
