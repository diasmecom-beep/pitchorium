import { supabase } from './supabase';
import type { AppNotification, Profile } from '../types/database';

export type NotificationRow = { notification: AppNotification; actor: Profile | null };

export async function fetchNotifications(recipientId: string, limit = 50): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const list = (data as AppNotification[]) ?? [];
  if (list.length === 0) return [];

  const actorIds = Array.from(new Set(list.map((n) => n.actor_id).filter((id): id is string => !!id)));
  const actorsById = new Map<string, Profile>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase.from('profiles').select('*').in('id', actorIds);
    (actors as Profile[] | null)?.forEach((a) => actorsById.set(a.id, a));
  }

  return list.map((notification) => ({
    notification,
    actor: notification.actor_id ? actorsById.get(notification.actor_id) ?? null : null,
  }));
}

export async function countUnreadNotifications(recipientId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .is('read_at', null);
  return count ?? 0;
}

export async function markAllNotificationsRead(recipientId: string) {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', recipientId)
    .is('read_at', null);
}

export function notificationLabel(n: AppNotification, actorName: string): string {
  switch (n.type) {
    case 'follow':
      return `${actorName} a commencé à vous suivre`;
    case 'like':
      return `${actorName} a réagi à votre publication`;
    case 'comment':
      return `${actorName} a commenté votre publication`;
    case 'reply':
      return `${actorName} a répondu à votre commentaire`;
    case 'share':
      return `${actorName} a repartagé votre publication`;
    case 'new_post':
      return `${actorName} a publié quelque chose de nouveau`;
    case 'tag':
      return `${actorName} vous a identifié·e`;
    case 'profile_view':
      return `${actorName} a consulté votre profil`;
    default:
      return `${actorName} a interagi avec vous`;
  }
}
