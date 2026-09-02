import { supabase } from './supabase';
import { insertResilient, updateResilient } from './resilientWrite';
import { getOrCreateConversation, sendMessage } from './conversations';
import type { Profile, ReactionKey } from '../types/database';

export async function getFollowCounts(profileId: string): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('followee_id', profileId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId: string, followeeId: string, currentlyFollowing: boolean) {
  if (currentlyFollowing) {
    await supabase.from('follows').delete().eq('follower_id', followerId).eq('followee_id', followeeId);
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
  }
}

export async function fetchFollowers(profileId: string): Promise<Profile[]> {
  const { data: follows } = await supabase.from('follows').select('follower_id').eq('followee_id', profileId);
  const ids = (follows ?? []).map((f) => f.follower_id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from('profiles').select('*').in('id', ids);
  return (data as Profile[]) ?? [];
}

export async function fetchFollowing(profileId: string): Promise<Profile[]> {
  const { data: follows } = await supabase.from('follows').select('followee_id').eq('follower_id', profileId);
  const ids = (follows ?? []).map((f) => f.followee_id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from('profiles').select('*').in('id', ids);
  return (data as Profile[]) ?? [];
}

// Qui a repartagé une publication — pour savoir où elle a été diffusée.
export async function fetchSharers(postId: string): Promise<Profile[]> {
  const { data: shares } = await supabase.from('post_shares').select('profile_id').eq('post_id', postId);
  const ids = (shares ?? []).map((s) => s.profile_id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from('profiles').select('*').in('id', ids);
  return (data as Profile[]) ?? [];
}

export async function setReaction(postId: string, profileId: string, reaction: ReactionKey) {
  const { error } = await supabase
    .from('post_likes')
    .upsert({ post_id: postId, profile_id: profileId, reaction }, { onConflict: 'post_id,profile_id' });
  if (error) throw error;
}

export async function removeReaction(postId: string, profileId: string) {
  await supabase.from('post_likes').delete().eq('post_id', postId).eq('profile_id', profileId);
}

// Partager une publication l'ajoute réellement dans le fil de la personne qui partage (visible
// par ses propres abonnés), en plus d'incrémenter le compteur de partages sur l'originale.
export async function toggleShare(postId: string, profileId: string, currentlyShared: boolean) {
  if (currentlyShared) {
    await supabase.from('post_shares').delete().eq('post_id', postId).eq('profile_id', profileId);
    await supabase.from('posts').delete().eq('author_id', profileId).eq('shared_post_id', postId);
  } else {
    await supabase.from('post_shares').insert({ post_id: postId, profile_id: profileId });
    try {
      await insertResilient('posts', [{ author_id: profileId, body: '', shared_post_id: postId }]);
    } catch {
      // Le repost visuel est une bonification : si la colonne shared_post_id n'existe pas encore
      // (migration 0016 non exécutée), le compteur de partage ci-dessus a quand même été mis à jour.
    }
  }
}

export async function toggleSave(postId: string, profileId: string, currentlySaved: boolean) {
  if (currentlySaved) {
    await supabase.from('post_saves').delete().eq('post_id', postId).eq('profile_id', profileId);
  } else {
    await supabase.from('post_saves').insert({ post_id: postId, profile_id: profileId });
  }
}

export async function createPost(
  authorId: string,
  body: string,
  imageUrl: string | null,
  projectId: string | null,
  taggedProfileId?: string | null,
  filterColor?: string | null,
  mediaUrls?: string[]
) {
  await insertResilient('posts', [
    {
      author_id: authorId,
      body,
      image_url: imageUrl,
      project_id: projectId,
      tagged_profile_id: taggedProfileId || null,
      filter_color: filterColor || null,
      media_urls: mediaUrls ?? [],
    },
  ]);
}

export async function updatePost(
  postId: string,
  updates: { body?: string; mediaUrls?: string[]; taggedProfileId?: string | null }
) {
  const payload: Record<string, unknown> = {};
  if (updates.body !== undefined) payload.body = updates.body;
  if (updates.mediaUrls !== undefined) payload.media_urls = updates.mediaUrls;
  if (updates.taggedProfileId !== undefined) payload.tagged_profile_id = updates.taggedProfileId;
  await updateResilient('posts', postId, payload);
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

// Masque une publication du fil du profil courant uniquement (privé, réversible en base mais pas
// d'écran "afficher les publications masquées" pour l'instant — décision volontairement simple).
export async function hidePost(profileId: string, postId: string) {
  await supabase.from('post_hides').insert({ profile_id: profileId, post_id: postId });
}

export async function fetchHiddenPostIds(profileId: string): Promise<string[]> {
  const { data } = await supabase.from('post_hides').select('post_id').eq('profile_id', profileId);
  return (data ?? []).map((r) => r.post_id);
}

// Transfère une publication à quelqu'un via un message dans une conversation.
export async function forwardPost(postId: string, postBody: string, senderId: string, recipientId: string) {
  const conversationId = await getOrCreateConversation(senderId, recipientId);
  const preview = postBody.trim().slice(0, 140);
  const message = preview
    ? `📤 A partagé une publication avec vous : "${preview}${postBody.length > 140 ? '…' : ''}"\npitchorium://post/${postId}`
    : `📤 A partagé une publication avec vous.\npitchorium://post/${postId}`;
  await sendMessage(conversationId, senderId, message);
}

export async function addComment(
  postId: string,
  authorId: string,
  body: string,
  parentCommentId?: string | null
) {
  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: authorId, body, parent_comment_id: parentCommentId || null });
  if (error) throw error;
}

export async function setCommentReaction(commentId: string, profileId: string, reaction: ReactionKey) {
  const { error } = await supabase
    .from('comment_reactions')
    .upsert({ comment_id: commentId, profile_id: profileId, reaction }, { onConflict: 'comment_id,profile_id' });
  if (error) throw error;
}

export async function removeCommentReaction(commentId: string, profileId: string) {
  await supabase.from('comment_reactions').delete().eq('comment_id', commentId).eq('profile_id', profileId);
}
