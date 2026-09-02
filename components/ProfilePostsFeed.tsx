import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { removeReaction, setReaction, toggleSave, toggleShare, deletePost } from '../lib/feed';
import { PostCard, type PostRow } from './PostCard';
import { COLORS } from '../constants/theme';
import type { Post, PostComment, PostLike, PostSave, PostShare, Profile, ReactionKey } from '../types/database';

export function ProfilePostsFeed({ authorId, viewer }: { authorId: string; viewer: Profile }) {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });
    const postList = (posts as Post[] | null) ?? [];

    if (postList.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const postIds = postList.map((p) => p.id);
    const taggedIds = Array.from(new Set(postList.map((p) => p.tagged_profile_id).filter((id): id is string => !!id)));
    const sharedPostIds = Array.from(new Set(postList.map((p) => p.shared_post_id).filter((id): id is string => !!id)));
    const [{ data: author }, { data: likes }, { data: comments }, { data: shares }, { data: saves }, { data: tagged }, { data: sharedPostsRaw }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', authorId).single(),
        supabase.from('post_likes').select('*').in('post_id', postIds),
        supabase.from('post_comments').select('*').in('post_id', postIds),
        supabase.from('post_shares').select('*').in('post_id', postIds),
        supabase.from('post_saves').select('*').in('post_id', postIds).eq('profile_id', viewer.id),
        taggedIds.length > 0 ? supabase.from('profiles').select('*').in('id', taggedIds) : Promise.resolve({ data: [] }),
        sharedPostIds.length > 0 ? supabase.from('posts').select('*').in('id', sharedPostIds) : Promise.resolve({ data: [] }),
      ]);

    const taggedById = new Map((tagged as Profile[] | null)?.map((p) => [p.id, p]) ?? []);
    const sharedPostsById = new Map((sharedPostsRaw as Post[] | null)?.map((p) => [p.id, p]) ?? []);
    const sharedAuthorIds = Array.from(new Set(Array.from(sharedPostsById.values()).map((p) => p.author_id)));
    const { data: sharedAuthorsRaw } =
      sharedAuthorIds.length > 0
        ? await supabase.from('profiles').select('*').in('id', sharedAuthorIds)
        : { data: [] as Profile[] };
    const sharedAuthorsById = new Map((sharedAuthorsRaw as Profile[] | null)?.map((a) => [a.id, a]) ?? []);

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
    const savedPostIds = new Set((saves as PostSave[] | null)?.map((s) => s.post_id) ?? []);

    setRows(
      postList.map((post) => {
        const postLikes = likesByPost.get(post.id) ?? [];
        const postShares = sharesByPost.get(post.id) ?? [];
        const mine = postLikes.find((l) => l.profile_id === viewer.id);
        return {
          post,
          author: (author as Profile) ?? null,
          likeCount: postLikes.length,
          commentCount: commentCountByPost.get(post.id) ?? 0,
          shareCount: postShares.length,
          myReaction: mine?.reaction ?? null,
          sharedByMe: postShares.some((s) => s.profile_id === viewer.id),
          savedByMe: savedPostIds.has(post.id),
          taggedProfile: post.tagged_profile_id ? taggedById.get(post.tagged_profile_id) ?? null : null,
          sharedPost: post.shared_post_id ? sharedPostsById.get(post.shared_post_id) ?? null : null,
          sharedPostAuthor: post.shared_post_id
            ? sharedAuthorsById.get(sharedPostsById.get(post.shared_post_id)?.author_id ?? '') ?? null
            : null,
        };
      })
    );
    setLoading(false);
  }, [authorId, viewer.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleReact = async (postId: string, reaction: ReactionKey) => {
    setRows((prev) =>
      prev.map((r) => (r.post.id === postId ? { ...r, myReaction: reaction, likeCount: r.likeCount + (r.myReaction ? 0 : 1) } : r))
    );
    await setReaction(postId, viewer.id, reaction);
  };

  const handleRemoveReaction = async (postId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.post.id === postId ? { ...r, myReaction: null, likeCount: Math.max(0, r.likeCount - 1) } : r))
    );
    await removeReaction(postId, viewer.id);
  };

  const handleToggleShare = async (postId: string, currentlyShared: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.post.id === postId
          ? { ...r, sharedByMe: !currentlyShared, shareCount: r.shareCount + (currentlyShared ? -1 : 1) }
          : r
      )
    );
    await toggleShare(postId, viewer.id, currentlyShared);
  };

  const handleToggleSave = async (postId: string, currentlySaved: boolean) => {
    setRows((prev) => prev.map((r) => (r.post.id === postId ? { ...r, savedByMe: !currentlySaved } : r)));
    await toggleSave(postId, viewer.id, currentlySaved);
  };

  const handleEdit = (postId: string) => router.push(`/post/new?postId=${postId}`);

  const handleDelete = async (postId: string) => {
    setRows((prev) => prev.filter((r) => r.post.id !== postId));
    await deletePost(postId);
  };

  if (loading) return null;

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.sectionTitle}>Publications</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>Aucune publication pour l'instant.</Text>
      ) : (
        rows.map((row) => (
          <PostCard
            key={row.post.id}
            row={row}
            viewerId={viewer.id}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
            onToggleShare={handleToggleShare}
            onToggleSave={handleToggleSave}
            onEdit={row.post.author_id === viewer.id ? handleEdit : undefined}
            onDelete={row.post.author_id === viewer.id ? handleDelete : undefined}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, marginBottom: 2 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
