// Supabase Edge Function — envoie un email au destinataire quand il reçoit un nouveau message.
//
// Déclenchement : un Database Webhook sur la table "messages" (événement INSERT) qui appelle
// cette fonction. Voir supabase/functions/notify-new-message/README.md pour la mise en place.
//
// Variables d'environnement nécessaires (secrets Supabase) :
// - RESEND_API_KEY : clé API Resend (https://resend.com)
// - SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectées automatiquement par Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Adresse d'envoi. En attendant la vérification d'un domaine sur Resend, utilisez leur
// domaine de test "onboarding@resend.dev" (fonctionne uniquement pour envoyer vers l'adresse
// du compte Resend). Une fois votre domaine vérifié, remplacez par ex. "notifications@pitchorium.com".
const FROM_ADDRESS = 'Pitchorium <onboarding@resend.dev>';

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
};

Deno.serve(async (req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
  }

  const payload = await req.json();
  const message: MessageRecord = payload.record;
  if (!message) {
    return new Response(JSON.stringify({ error: 'No message record in payload' }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: conversation } = await supabase
    .from('conversations')
    .select('participant_one_id, participant_two_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  const recipientId =
    conversation.participant_one_id === message.sender_id
      ? conversation.participant_two_id
      : conversation.participant_one_id;

  const [{ data: recipientProfile }, { data: senderProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email_notifications_enabled')
      .eq('id', recipientId)
      .single(),
    supabase.from('profiles').select('full_name, company_name').eq('id', message.sender_id).single(),
  ]);

  if (!recipientProfile || recipientProfile.email_notifications_enabled === false) {
    return new Response(JSON.stringify({ skipped: true, reason: 'Notifications disabled' }), { status: 200 });
  }

  const { data: recipientAuth } = await supabase.auth.admin.getUserById(recipientId);
  const recipientEmail = recipientAuth?.user?.email;
  if (!recipientEmail) {
    return new Response(JSON.stringify({ error: 'Recipient has no email' }), { status: 404 });
  }

  const senderName = senderProfile?.company_name || senderProfile?.full_name || 'Un membre de Pitchorium';

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject: `Nouveau message de ${senderName} sur Pitchorium`,
      html: `
        <p>Bonjour ${recipientProfile.full_name},</p>
        <p><strong>${senderName}</strong> vous a envoyé un message sur Pitchorium :</p>
        <blockquote style="border-left: 3px solid #1a1a2e; padding-left: 12px; color: #333;">
          ${message.body}
        </blockquote>
        <p>Connectez-vous à Pitchorium pour répondre.</p>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    return new Response(JSON.stringify({ error: 'Resend API error', details: errorText }), { status: 502 });
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});
