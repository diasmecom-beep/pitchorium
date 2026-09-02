import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useLanguage } from '../../context/LanguageProvider';
import { createPost, deletePost, fetchHiddenPostIds, hidePost, removeReaction, setReaction, toggleSave, toggleShare } from '../../lib/feed';
import { pickAndUploadMultipleMedia } from '../../lib/mediaUpload';
import { fetchStoryGroups, type StoryGroup } from '../../lib/stories';
import { PostCard, type PostRow } from '../../components/PostCard';
import { StoriesBar } from '../../components/StoriesBar';
import { StoryViewer } from '../../components/StoryViewer';
import { COLORS, RADIUS, MAX_CONTENT_WIDTH } from '../../constants/theme';
import type { Post, PostComment, PostLike, PostSave, PostShare, Profile, ReactionKey } from '../../types/database';

export default function Feed() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [composerPicking, setComposerPicking] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);

  const loadStories = useCallback(async () => {
    if (!profile) return;
    setStoryGroups(await fetchStoryGroups(profile));
  }, [profile]);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: follows } = await supabase.from('follows').select('followee_id').eq('follower_id', profile.id);
    const followedIds = (follows ?? []).map((f) => f.followee_id);
    const visibleAuthorIds = Array.from(new Set([...followedIds, profile.id]));

    let postsQuery = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    // Tant que l'utilisateur ne suit personne, on affiche tout le fil pour éviter un écran vide.
    if (followedIds.length > 0) {
      postsQuery = postsQuery.in('author_id', visibleAuthorIds);
    }
    const [{ data: posts }, hiddenIds] = await Promise.all([postsQuery, fetchHiddenPostIds(profile.id)]);
    const hiddenSet = new Set(hiddenIds);
    const postList = ((posts as Post[] | null) ?? []).filter((p) => !hiddenSet.has(p.id));

    if (postList.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const postIds = postList.map((p) => p.id);
    const sharedPostIds = Array.from(new Set(postList.map((p) => p.shared_post_id).filter((id): id is string => !!id)));

    const [{ data: authorsRaw }, { data: likes }, { data: comments }, { data: shares }, { data: saves }, { data: sharedPostsRaw }] =
      await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('post_likes').select('*').in('post_id', postIds),
        supabase.from('post_comments').select('*').in('post_id', postIds),
        supabase.from('post_shares').select('*').in('post_id', postIds),
        supabase.from('post_saves').select('*').in('post_id', postIds).eq('profile_id', profile.id),
        sharedPostIds.length > 0 ? supabase.from('posts').select('*').in('id', sharedPostIds) : Promise.resolve({ data: [] }),
      ]);

    const sharedPostsById = new Map((sharedPostsRaw as Post[] | null)?.map((p) => [p.id, p]) ?? []);
    const authorsById = new Map((authorsRaw as Profile[] | null)?.map((a) => [a.id, a]) ?? []);
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

    const builtRows: PostRow[] = postList.map((post) => {
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
        savedByMe: savedPostIds.has(post.id),
        taggedProfile: post.tagged_profile_id ? authorsById.get(post.tagged_profile_id) ?? null : null,
        sharedPost: post.shared_post_id ? sharedPostsById.get(post.shared_post_id) ?? null : null,
        sharedPostAuthor: post.shared_post_id
          ? authorsById.get(sharedPostsById.get(post.shared_post_id)?.author_id ?? '') ?? null
          : null,
      };
    });

    setRows(builtRows);
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadStories();
    }, [load, loadStories])
  );

  // useFocusEffect ne se redéclenche que sur un changement de focus, pas simplement parce que
  // `profile` devient disponible : juste après une connexion, cet écran peut être monté avant que
  // le profil ait fini de charger, `load()` s'arrête alors immédiatement (`if (!profile) return`)
  // et le spinner reste bloqué indéfiniment car rien ne relance le chargement ensuite. Ce second
  // effet rattrape ce cas en relançant dès que le profil arrive.
  useEffect(() => {
    if (profile) {
      load();
      loadStories();
    }
  }, [profile, load, loadStories]);

  const handleToggleSave = async (postId: string, currentlySaved: boolean) => {
    if (!profile) return;
    setRows((prev) => prev.map((r) => (r.post.id === postId ? { ...r, savedByMe: !currentlySaved } : r)));
    await toggleSave(postId, profile.id, currentlySaved);
  };

  const handlePickImage = async () => {
    if (!profile) return;
    setComposerError(null);
    setComposerPicking(true);
    try {
      const items = await pickAndUploadMultipleMedia(profile.id);
      if (items.length > 0) setComposerImages((prev) => [...prev, ...items.map((i) => i.url)]);
    } catch (e: any) {
      setComposerError(e?.message || "Impossible d'ajouter ces fichiers. Réessayez.");
    } finally {
      setComposerPicking(false);
    }
  };

  const handlePublish = async () => {
    if (!profile || !composerText.trim()) return;
    setComposerError(null);
    setPosting(true);
    try {
      await createPost(profile.id, composerText.trim(), composerImages[0] ?? null, null, null, null, composerImages);
      setComposerText('');
      setComposerImages([]);
      await load();
    } catch (e: any) {
      setComposerError(e?.message || 'La publication a échoué. Réessayez.');
    } finally {
      setPosting(false);
    }
  };

  const handleEditPost = (postId: string) => router.push(`/post/new?postId=${postId}`);

  const handleDeletePost = async (postId: string) => {
    setRows((prev) => prev.filter((r) => r.post.id !== postId));
    await deletePost(postId);
  };

  const handleHidePost = async (postId: string) => {
    if (!profile) return;
    setRows((prev) => prev.filter((r) => r.post.id !== postId));
    await hidePost(profile.id, postId);
  };

  const handleReact = async (postId: string, reaction: ReactionKey) => {
    if (!profile) return;
    setRows((prev) =>
      prev.map((r) =>
        r.post.id === postId
          ? { ...r, myReaction: reaction, likeCount: r.likeCount + (r.myReaction ? 0 : 1) }
          : r
      )
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

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.post.id}
        style={styles.feedList}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load().finally(() => setRefreshing(false));
            }}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerPad}>
            <StoriesBar
              groups={storyGroups}
              ownProfile={profile}
              onAddStory={() => router.push('/story/new')}
              onOpenGroup={setStoryViewerIndex}
            />
            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                placeholder={t('postPlaceholder')}
                value={composerText}
                onChangeText={setComposerText}
                multiline
              />
              {composerImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {composerImages.map((url, i) => (
                    <View key={i} style={styles.composerImageWrap}>
                      <Image source={{ uri: url }} style={styles.composerImage} />
                      <TouchableOpacity
                        style={styles.composerImageRemove}
                        onPress={() => setComposerImages((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <Text style={styles.composerImageRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              {composerError ? <Text style={styles.composerErrorText}>{composerError}</Text> : null}
              <View style={styles.composerActions}>
                <TouchableOpacity onPress={handlePickImage} disabled={composerPicking} style={styles.composerAttach}>
                  {composerPicking ? (
                    <ActivityIndicator size="small" color={COLORS.textSecondary} />
                  ) : (
                    <Ionicons name="attach" size={20} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.publishButton, (!composerText.trim() || posting) && styles.publishButtonDisabled]}
                  onPress={handlePublish}
                  disabled={!composerText.trim() || posting}
                >
                  <Text style={styles.publishButtonText}>{posting ? '...' : t('publish')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('emptyFeed')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            row={item}
            viewerId={profile.id}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
            onToggleShare={handleToggleShare}
            onToggleSave={handleToggleSave}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onHide={handleHidePost}
          />
        )}
      />
      <StoryViewer groups={storyGroups} startGroupIndex={storyViewerIndex} onClose={() => setStoryViewerIndex(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  feedList: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  list: { paddingVertical: 12, gap: 12, backgroundColor: COLORS.background },
  headerPad: { paddingHorizontal: 16, gap: 10 },
  composer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 8,
  },
  composerInput: { minHeight: 60, fontSize: 15, textAlignVertical: 'top', color: COLORS.textPrimary },
  composerImageWrap: { marginRight: 8 },
  composerImage: { width: 100, height: 130, borderRadius: 8, backgroundColor: COLORS.border },
  composerImageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerImageRemoveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  composerErrorText: { color: COLORS.danger, fontSize: 12 },
  composerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  composerAttach: { padding: 4 },
  publishButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 },
  publishButtonDisabled: { opacity: 0.5 },
  publishButtonText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: COLORS.textMuted, textAlign: 'center' },
});
