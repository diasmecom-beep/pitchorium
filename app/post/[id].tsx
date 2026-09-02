import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useLanguage } from '../../context/LanguageProvider';
import {
  addComment,
  fetchSharers,
  removeCommentReaction,
  removeReaction,
  setCommentReaction,
  setReaction,
  toggleSave,
  toggleShare,
} from '../../lib/feed';
import { PostCard, type PostRow } from '../../components/PostCard';
import { REACTIONS, reactionByKey } from '../../constants/reactions';
import { COLORS, RADIUS, MAX_CONTENT_WIDTH } from '../../constants/theme';
import type {
  CommentReaction,
  Post,
  PostComment,
  PostLike,
  PostSave,
  PostShare,
  Profile,
  ReactionKey,
} from '../../types/database';

type FlatComment = {
  comment: PostComment;
  author: Profile | null;
  myReaction: ReactionKey | null;
  reactionCount: number;
  depth: number;
};

function displayName(p: Profile | null) {
  if (!p) return 'Utilisateur';
  return p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name;
}

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [row, setRow] = useState<PostRow | null>(null);
  const [comments, setComments] = useState<FlatComment[]>([]);
  const [sharers, setSharers] = useState<Profile[]>([]);
  const [showSharers, setShowSharers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: string; authorName: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [pickerForComment, setPickerForComment] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile || !id) return;
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).single();
    if (!post) {
      setLoading(false);
      return;
    }

    const [{ data: author }, { data: likes }, { data: commentList }, { data: shares }, { data: saves }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', post.author_id).single(),
        supabase.from('post_likes').select('*').eq('post_id', id),
        supabase.from('post_comments').select('*').eq('post_id', id).order('created_at', { ascending: true }),
        supabase.from('post_shares').select('*').eq('post_id', id),
        supabase.from('post_saves').select('*').eq('post_id', id).eq('profile_id', profile.id),
      ]);

    const postLikes = (likes as PostLike[]) ?? [];
    const postShares = (shares as PostShare[]) ?? [];
    const postSaves = (saves as PostSave[]) ?? [];
    const mine = postLikes.find((l) => l.profile_id === profile.id);
    setRow({
      post: post as Post,
      author: (author as Profile) ?? null,
      likeCount: postLikes.length,
      commentCount: (commentList as PostComment[] | null)?.length ?? 0,
      shareCount: postShares.length,
      myReaction: mine?.reaction ?? null,
      sharedByMe: postShares.some((s) => s.profile_id === profile.id),
      savedByMe: postSaves.length > 0,
    });

    const rawComments = (commentList as PostComment[] | null) ?? [];
    const commentIds = rawComments.map((c) => c.id);
    const authorIds = Array.from(new Set(rawComments.map((c) => c.author_id)));

    const [{ data: commentAuthors }, { data: commentReactions }] = await Promise.all([
      authorIds.length > 0
        ? supabase.from('profiles').select('*').in('id', authorIds)
        : Promise.resolve({ data: [] as Profile[] }),
      commentIds.length > 0
        ? supabase.from('comment_reactions').select('*').in('comment_id', commentIds)
        : Promise.resolve({ data: [] as CommentReaction[] }),
    ]);
    const authorsById = new Map((commentAuthors as Profile[] | null)?.map((a) => [a.id, a]) ?? []);
    const reactionsByComment = new Map<string, CommentReaction[]>();
    (commentReactions as CommentReaction[] | null)?.forEach((r) => {
      const list = reactionsByComment.get(r.comment_id) ?? [];
      list.push(r);
      reactionsByComment.set(r.comment_id, list);
    });

    // Aplati : commentaires racine suivis de leurs réponses (profondeur 1), triés par date.
    const roots = rawComments.filter((c) => !c.parent_comment_id);
    const flat: FlatComment[] = [];
    const toRow = (c: PostComment, depth: number): FlatComment => {
      const rs = reactionsByComment.get(c.id) ?? [];
      return {
        comment: c,
        author: authorsById.get(c.author_id) ?? null,
        myReaction: rs.find((r) => r.profile_id === profile.id)?.reaction ?? null,
        reactionCount: rs.length,
        depth,
      };
    };
    roots.forEach((rootComment) => {
      flat.push(toRow(rootComment, 0));
      rawComments
        .filter((c) => c.parent_comment_id === rootComment.id)
        .forEach((reply) => flat.push(toRow(reply, 1)));
    });
    setComments(flat);
    setLoading(false);
  }, [id, profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleReact = async (postId: string, reaction: ReactionKey) => {
    if (!profile || !row) return;
    setRow({ ...row, myReaction: reaction, likeCount: row.likeCount + (row.myReaction ? 0 : 1) });
    await setReaction(postId, profile.id, reaction);
  };

  const handleRemoveReaction = async (postId: string) => {
    if (!profile || !row) return;
    setRow({ ...row, myReaction: null, likeCount: Math.max(0, row.likeCount - 1) });
    await removeReaction(postId, profile.id);
  };

  const handleToggleShare = async (postId: string, currentlyShared: boolean) => {
    if (!profile || !row) return;
    setRow({ ...row, sharedByMe: !currentlyShared, shareCount: row.shareCount + (currentlyShared ? -1 : 1) });
    await toggleShare(postId, profile.id, currentlyShared);
  };

  const handleToggleSave = async (postId: string, currentlySaved: boolean) => {
    if (!profile || !row) return;
    setRow({ ...row, savedByMe: !currentlySaved });
    await toggleSave(postId, profile.id, currentlySaved);
  };

  const handleOpenSharers = async () => {
    if (!id) return;
    setShowSharers((v) => !v);
    if (!showSharers) setSharers(await fetchSharers(id));
  };

  const handleCommentReact = async (commentId: string, key: ReactionKey, current: ReactionKey | null) => {
    if (!profile) return;
    setPickerForComment(null);
    if (current === key) {
      setComments((prev) =>
        prev.map((c) => (c.comment.id === commentId ? { ...c, myReaction: null, reactionCount: c.reactionCount - 1 } : c))
      );
      await removeCommentReaction(commentId, profile.id);
    } else {
      setComments((prev) =>
        prev.map((c) =>
          c.comment.id === commentId
            ? { ...c, myReaction: key, reactionCount: c.reactionCount + (current ? 0 : 1) }
            : c
        )
      );
      await setCommentReaction(commentId, profile.id, key);
    }
  };

  const handleSendComment = async () => {
    if (!profile || !id || !commentText.trim()) return;
    setSending(true);
    try {
      await addComment(id, profile.id, commentText.trim(), replyTo?.commentId ?? null);
      setCommentText('');
      setReplyTo(null);
      await load();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!row) {
    return (
      <View style={styles.center}>
        <Text>Publication introuvable.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.comment.id}
        style={styles.feedList}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <PostCard
              row={row}
              viewerId={profile?.id}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
              onToggleShare={handleToggleShare}
              onToggleSave={handleToggleSave}
              onEdit={(postId) => router.push(`/post/new?postId=${postId}`)}
            />
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              {row.shareCount > 0 && (
                <TouchableOpacity onPress={handleOpenSharers}>
                  <Text style={styles.sharersLink}>
                    {showSharers ? 'Masquer' : 'Voir'} qui a partagé ({row.shareCount})
                  </Text>
                </TouchableOpacity>
              )}
              {showSharers && (
                <View style={styles.sharersBox}>
                  {sharers.length === 0 ? (
                    <Text style={styles.emptyText}>Chargement...</Text>
                  ) : (
                    sharers.map((s) => (
                      <TouchableOpacity key={s.id} style={styles.sharerRow} onPress={() => router.push(`/profile/${s.id}`)}>
                        {s.avatar_url ? (
                          <Image source={{ uri: s.avatar_url }} style={styles.sharerAvatar} />
                        ) : (
                          <View style={styles.sharerAvatarPlaceholder}>
                            <Text style={styles.sharerInitial}>{displayName(s).charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={styles.sharerName}>{displayName(s)}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
              <Text style={styles.commentsTitle}>{t('comments')}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.emptyText, { paddingHorizontal: 16 }]}>—</Text>}
        renderItem={({ item }) => {
          const activeReaction = reactionByKey(item.myReaction);
          return (
            <View style={[styles.commentRow, item.depth > 0 && styles.commentReply]}>
              <TouchableOpacity onPress={() => item.author && router.push(`/profile/${item.author.id}`)}>
                <Text style={styles.commentAuthor}>{displayName(item.author)}</Text>
              </TouchableOpacity>
              <Text style={styles.commentBody}>{item.comment.body}</Text>
              <View style={styles.commentActionsWrapper}>
                {pickerForComment === item.comment.id && (
                  <View style={styles.commentPickerRow}>
                    {REACTIONS.map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        style={styles.commentPickerButton}
                        onPress={() => handleCommentReact(item.comment.id, r.key, item.myReaction)}
                      >
                        <Text style={styles.commentPickerEmoji}>{r.emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleCommentReact(item.comment.id, 'heart', item.myReaction)
                    }
                    onLongPress={() => setPickerForComment(item.comment.id)}
                  >
                    <Text style={[styles.commentActionText, activeReaction && { color: activeReaction.color }]}>
                      {activeReaction ? `${activeReaction.emoji} ` : ''}
                      J'aime{item.reactionCount > 0 ? ` (${item.reactionCount})` : ''}
                    </Text>
                  </TouchableOpacity>
                  {item.depth === 0 && (
                    <TouchableOpacity
                      onPress={() => setReplyTo({ commentId: item.comment.id, authorName: displayName(item.author) })}
                    >
                      <Text style={styles.commentActionText}>Répondre</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
      {replyTo && (
        <View style={styles.replyBanner}>
          <Text style={styles.replyBannerText}>Réponse à {replyTo.authorName}</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={styles.replyBannerCancel}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={replyTo ? `Répondre à ${replyTo.authorName}...` : t('writeComment')}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity onPress={handleSendComment} disabled={sending || !commentText.trim()}>
          <Text style={styles.sendText}>{t('send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feedList: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  list: { paddingVertical: 16, gap: 10, backgroundColor: COLORS.background },
  commentsTitle: { fontSize: 15, fontWeight: '700', marginTop: 4, color: COLORS.textPrimary },
  emptyText: { color: COLORS.textMuted, paddingVertical: 8 },
  sharersLink: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  sharersBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 6,
  },
  sharerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  sharerAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.border },
  sharerAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharerInitial: { color: '#fff', fontWeight: '700', fontSize: 12 },
  sharerName: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  commentRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  commentReply: { marginLeft: 44 },
  commentAuthor: { fontSize: 13, fontWeight: '700', marginBottom: 2, color: COLORS.textPrimary },
  commentBody: { fontSize: 14, color: COLORS.textPrimary },
  commentActionsWrapper: { position: 'relative', marginTop: 4 },
  commentActions: { flexDirection: 'row', gap: 16 },
  commentActionText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  commentPickerRow: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    flexDirection: 'row',
    gap: 2,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentPickerButton: { padding: 3 },
  commentPickerEmoji: { fontSize: 18 },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replyBannerText: { fontSize: 12, color: COLORS.textSecondary },
  replyBannerCancel: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendText: { color: COLORS.primary, fontWeight: '700' },
});
