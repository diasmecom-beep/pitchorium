import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { hidePost, removeReaction, setReaction, toggleSave, toggleShare } from '../lib/feed';
import { PostCard, type PostRow } from '../components/PostCard';
import { COLORS, MAX_CONTENT_WIDTH } from '../constants/theme';
import type { Post, PostComment, PostLike, PostSave, PostShare, Profile, ReactionKey } from '../types/database';

export default function SavedPosts() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: saves } = await supabase
      .from('post_saves')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });
    const saveList = (saves as PostSave[] | null) ?? [];

    if (saveList.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const postIds = saveList.map((s) => s.post_id);
    const { data: posts } = await supabase.from('posts').select('*').in('id', postIds);
    const postList = (posts as Post[] | null) ?? [];
    const authorIds = Array.from(new Set(postList.map((p) => p.author_id)));

    const [{ data: authors }, { data: likes }, { data: comments }, { data: shares }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', authorIds),
      supabase.from('post_likes').select('*').in('post_id', postIds),
      supabase.from('post_comments').select('*').in('post_id', postIds),
      supabase.from('post_shares').select('*').in('post_id', postIds),
    ]);

    const authorsById = new Map((authors as Profile[] | null)?.map((a) => [a.id, a]) ?? []);
    const likesByPost = new Map<string, PostLike[]>();
    (likes as PostLike[] | null)?.forEach((l) => {
      const list = likesByPost.get(l.post_id) ?? [];
      list.push(l);
      likesByPost.set(l.post_id, list);
    });
    const commentCountByPost = new Map<string, number>();
    (comments as PostComment[] | null)?.forEach((c) => {
      commentCountByPost.set(c.post_id, (commentCountByPost.get(c.post_id) ?? 0) + 1);
    });
    const sharesByPost = new Map<string, PostShare[]>();
    (shares as PostShare[] | null)?.forEach((s) => {
      const list = sharesByPost.get(s.post_id) ?? [];
      list.push(s);
      sharesByPost.set(s.post_id, list);
    });

    // Ordonné selon la date d'enregistrement (le plus récent en premier).
    const postsById = new Map(postList.map((p) => [p.id, p]));
    const orderedPosts = saveList.map((s) => postsById.get(s.post_id)).filter((p): p is Post => !!p);

    setRows(
      orderedPosts.map((post) => {
        const postLikes = likesByPost.get(post.id) ?? [];
        const postShares = sharesByPost.get(post.id) ?? [];
        const mine = postLikes.find((l) => l.profile_id === profile.id);
        return {
          post,
          author: authorsById.get(post.author_id) ?? null,
          likeCount: postLikes.length,
          commentCount: commentCountByPost.get(post.id) ?? 0,
          shareCount: postShares.length,
          myReaction: mine?.reaction ?? null,
          sharedByMe: postShares.some((s) => s.profile_id === profile.id),
          savedByMe: true,
        };
      })
    );
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (profile) load();
  }, [profile, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleReact = async (postId: string, reaction: ReactionKey) => {
    if (!profile) return;
    setRows((prev) =>
      prev.map((r) => (r.post.id === postId ? { ...r, myReaction: reaction, likeCount: r.likeCount + (r.myReaction ? 0 : 1) } : r))
    );
    await setReaction(postId, profile.id, reaction);
  };

  const handleRemoveReaction = async (postId: string) => {
    if (!profile) return;
    setRows((prev) =>
      prev.map((r) => (r.post.id === postId ? { ...r, myReaction: null, likeCount: Math.max(0, r.likeCount - 1) } : r))
    );
    await removeReaction(postId, profile.id);
  };

  const handleToggleShare = async (postId: string, currentlyShared: boolean) => {
    if (!profile) return;
    setRows((prev) =>
      prev.map((r) =>
        r.post.id === postId
          ? { ...r, sharedByMe: !currentlyShared, shareCount: r.shareCount + (currentlyShared ? -1 : 1) }
          : r
      )
    );
    await toggleShare(postId, profile.id, currentlyShared);
  };

  const handleToggleSave = async (postId: string, currentlySaved: boolean) => {
    if (!profile) return;
    setRows((prev) => prev.filter((r) => r.post.id !== postId));
    await toggleSave(postId, profile.id, currentlySaved);
  };

  const handleHide = async (postId: string) => {
    if (!profile) return;
    setRows((prev) => prev.filter((r) => r.post.id !== postId));
    await hidePost(profile.id, postId);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.post.id}
      style={styles.feedList}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucune publication enregistrée pour l'instant.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          row={item}
          viewerId={profile?.id}
          onReact={handleReact}
          onRemoveReaction={handleRemoveReaction}
          onToggleShare={handleToggleShare}
          onToggleSave={handleToggleSave}
          onHide={handleHide}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  feedList: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  list: { paddingVertical: 12, backgroundColor: COLORS.background, flexGrow: 1 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center' },
});
