import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REACTIONS, reactionByKey } from '../constants/reactions';
import { MediaFrame } from './MediaFrame';
import { forwardPost } from '../lib/feed';
import { searchProfilesOnly } from '../lib/search';
import { COLORS, RADIUS, CARD_SHADOW } from '../constants/theme';
import type { Post, Profile, ReactionKey } from '../types/database';

export type PostRow = {
  post: Post;
  author: Profile | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  myReaction: ReactionKey | null;
  sharedByMe: boolean;
  savedByMe: boolean;
  taggedProfile?: Profile | null;
  sharedPost?: Post | null;
  sharedPostAuthor?: Profile | null;
};

export function PostCard({
  row,
  viewerId,
  onReact,
  onRemoveReaction,
  onToggleShare,
  onToggleSave,
  onEdit,
  onDelete,
  onHide,
}: {
  row: PostRow;
  viewerId?: string;
  onReact: (postId: string, reaction: ReactionKey) => void;
  onRemoveReaction: (postId: string) => void;
  onToggleShare: (postId: string, currentlyShared: boolean) => void;
  onToggleSave: (postId: string, currentlySaved: boolean) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onHide?: (postId: string) => void;
}) {
  const { post, author, likeCount, commentCount, shareCount, myReaction, sharedByMe, savedByMe, taggedProfile, sharedPost, sharedPostAuthor } =
    row;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardQuery, setForwardQuery] = useState('');
  const [forwardResults, setForwardResults] = useState<Profile[]>([]);
  const [forwardSearching, setForwardSearching] = useState(false);
  const [forwardedTo, setForwardedTo] = useState<string | null>(null);

  const authorName = author
    ? author.role === 'entrepreneur'
      ? author.company_name || author.full_name
      : author.full_name
    : 'Utilisateur';

  const activeReaction = reactionByKey(myReaction);
  const isOwner = !!viewerId && viewerId === post.author_id;
  const mediaItems = (
    post.media_urls?.length ? post.media_urls : post.image_url ? [post.image_url] : post.video_url ? [post.video_url] : []
  ).filter(Boolean);
  const [frameIndex, setFrameIndex] = useState(0);
  const [mediaWidth, setMediaWidth] = useState(0);

  const sharedMediaItems = (
    sharedPost
      ? sharedPost.media_urls?.length
        ? sharedPost.media_urls
        : sharedPost.image_url
          ? [sharedPost.image_url]
          : sharedPost.video_url
            ? [sharedPost.video_url]
            : []
      : []
  ).filter(Boolean);
  const sharedAuthorName = sharedPostAuthor
    ? sharedPostAuthor.role === 'entrepreneur'
      ? sharedPostAuthor.company_name || sharedPostAuthor.full_name
      : sharedPostAuthor.full_name
    : 'Utilisateur';

  const handleForwardQueryChange = async (text: string) => {
    setForwardQuery(text);
    if (text.trim().length < 2) {
      setForwardResults([]);
      return;
    }
    setForwardSearching(true);
    setForwardResults(await searchProfilesOnly(text));
    setForwardSearching(false);
  };

  const handleForwardTo = async (recipient: Profile) => {
    if (!viewerId) return;
    await forwardPost(post.id, post.body, viewerId, recipient.id);
    setForwardedTo(recipient.full_name);
    setForwardQuery('');
    setForwardResults([]);
    setTimeout(() => {
      setForwardOpen(false);
      setForwardedTo(null);
    }, 900);
  };

  const handleQuickTap = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    if (myReaction) {
      onRemoveReaction(post.id);
    } else {
      onReact(post.id, 'heart');
    }
  };

  const handlePick = (key: ReactionKey) => {
    if (myReaction === key) {
      onRemoveReaction(post.id);
    } else {
      onReact(post.id, key);
    }
    setPickerOpen(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.header}
          activeOpacity={0.7}
          onPress={() => author && router.push(`/profile/${author.id}`)}
        >
          {author?.avatar_url ? (
            <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString('fr-FR')}</Text>
          </View>
        </TouchableOpacity>

        {!!viewerId && (
          <View>
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen((v) => !v)}>
              <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            {menuOpen && (
              <View style={styles.menuDropdown}>
                {isOwner && onEdit && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuOpen(false);
                      onEdit(post.id);
                    }}
                  >
                    <Text style={styles.menuItemText}>Modifier</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    setForwardOpen(true);
                  }}
                >
                  <Text style={styles.menuItemText}>Transférer</Text>
                </TouchableOpacity>
                {onHide && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuOpen(false);
                      onHide(post.id);
                    }}
                  >
                    <Text style={styles.menuItemText}>Masquer</Text>
                  </TouchableOpacity>
                )}
                {isOwner && onDelete && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuOpen(false);
                      onDelete(post.id);
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      <Modal visible={forwardOpen} animationType="slide" transparent onRequestClose={() => setForwardOpen(false)}>
        <TouchableOpacity style={styles.forwardBackdrop} activeOpacity={1} onPress={() => setForwardOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.forwardSheet} onPress={() => {}}>
            <Text style={styles.forwardTitle}>Transférer à...</Text>
            {forwardedTo ? (
              <Text style={styles.forwardSentText}>✓ Envoyé à {forwardedTo}</Text>
            ) : (
              <>
                <TextInput
                  style={styles.forwardInput}
                  placeholder="Rechercher une personne..."
                  placeholderTextColor={COLORS.textMuted}
                  value={forwardQuery}
                  onChangeText={handleForwardQueryChange}
                  autoFocus
                />
                {forwardSearching && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 10 }} />}
                {forwardResults.map((p) => {
                  const name = p.role === 'entrepreneur' ? p.company_name || p.full_name : p.full_name;
                  return (
                    <TouchableOpacity key={p.id} style={styles.forwardResultRow} onPress={() => handleForwardTo(p)}>
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={styles.forwardAvatar} />
                      ) : (
                        <View style={styles.forwardAvatarPlaceholder}>
                          <Text style={styles.forwardAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.forwardResultName}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {post.shared_post_id && (
        <View style={styles.repostNote}>
          <Ionicons name="repeat" size={14} color={COLORS.success} />
          <Text style={styles.repostNoteText}>{authorName} a partagé</Text>
        </View>
      )}

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}

      {sharedPost && (
        <TouchableOpacity
          style={styles.sharedBox}
          activeOpacity={0.8}
          onPress={() => router.push(`/post/${sharedPost.id}`)}
        >
          <View style={styles.sharedHeader}>
            {sharedPostAuthor?.avatar_url ? (
              <Image source={{ uri: sharedPostAuthor.avatar_url }} style={styles.sharedAvatar} />
            ) : (
              <View style={styles.sharedAvatarPlaceholder}>
                <Text style={styles.sharedAvatarInitial}>{sharedAuthorName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.sharedAuthorName} numberOfLines={1}>
              {sharedAuthorName}
            </Text>
          </View>
          {sharedPost.body ? (
            <Text style={styles.sharedBody} numberOfLines={4}>
              {sharedPost.body}
            </Text>
          ) : null}
          {sharedMediaItems.length > 0 && (
            <View style={styles.sharedMediaWrap}>
              <MediaFrame url={sharedMediaItems[0]} />
            </View>
          )}
        </TouchableOpacity>
      )}

      {mediaItems.length > 0 && (
        <View style={styles.mediaWrapper} onLayout={(e) => setMediaWidth(e.nativeEvent.layout.width)}>
          {mediaWidth > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const width = e.nativeEvent.layoutMeasurement.width;
                if (width > 0) setFrameIndex(Math.round(e.nativeEvent.contentOffset.x / width));
              }}
            >
              {mediaItems.map((url, i) => (
                <View key={i} style={[styles.mediaFrame, { width: mediaWidth }]}>
                  <MediaFrame url={url} />
                </View>
              ))}
            </ScrollView>
          )}
          {mediaItems.length > 1 && (
            <View style={styles.dotsRow} pointerEvents="none">
              {mediaItems.map((_, i) => (
                <View key={i} style={[styles.dot, i === frameIndex && styles.dotActive]} />
              ))}
            </View>
          )}
          {post.filter_color && (
            <View style={[styles.postImageFilter, { backgroundColor: post.filter_color }]} pointerEvents="none" />
          )}
          {taggedProfile && (
            <TouchableOpacity style={styles.tagChip} onPress={() => router.push(`/profile/${taggedProfile.id}`)}>
              <Text style={styles.tagChipText}>
                @ {taggedProfile.role === 'entrepreneur' ? taggedProfile.company_name || taggedProfile.full_name : taggedProfile.full_name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.actionsWrapper}>
        {pickerOpen && (
          <View style={styles.pickerRow}>
            {REACTIONS.map((r) => (
              <TouchableOpacity key={r.key} style={styles.pickerButton} onPress={() => handlePick(r.key)}>
                <Text style={styles.pickerEmoji}>{r.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.6}
            onPress={handleQuickTap}
            onLongPress={() => setPickerOpen(true)}
          >
            {activeReaction ? (
              <Text style={styles.reactionEmoji}>{activeReaction.emoji}</Text>
            ) : (
              <Ionicons name="heart-outline" size={22} color={COLORS.textSecondary} />
            )}
            <Text style={[styles.actionCount, activeReaction && { color: activeReaction.color }]}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.6} onPress={() => router.push(`/post/${post.id}`)}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.actionCount}>{commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.6}
            onPress={() => onToggleShare(post.id, sharedByMe)}
          >
            <Ionicons
              name={sharedByMe ? 'repeat' : 'repeat-outline'}
              size={21}
              color={sharedByMe ? COLORS.success : COLORS.textSecondary}
            />
            <Text style={[styles.actionCount, sharedByMe && styles.actionCountShared]}>{shareCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            activeOpacity={0.6}
            onPress={() => onToggleSave(post.id, savedByMe)}
          >
            <Ionicons
              name={savedByMe ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={savedByMe ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 14,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.border },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerText: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  timestamp: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  menuButton: { padding: 6 },
  menuDropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 4,
    minWidth: 130,
    zIndex: 10,
    ...CARD_SHADOW,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 14 },
  menuItemText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  body: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 21, paddingHorizontal: 14 },
  repostNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14 },
  repostNoteText: { fontSize: 12, color: COLORS.success, fontWeight: '700' },
  sharedBox: {
    marginHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  sharedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  sharedAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.border },
  sharedAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedAvatarInitial: { color: '#fff', fontWeight: '700', fontSize: 11 },
  sharedAuthorName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  sharedBody: { fontSize: 13, color: COLORS.textPrimary, paddingHorizontal: 10, paddingBottom: 10 },
  sharedMediaWrap: { width: '100%', aspectRatio: 4 / 3, backgroundColor: COLORS.border },
  mediaWrapper: { width: '100%', aspectRatio: 4 / 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  mediaFrame: { height: '100%' },
  postImageFilter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.28 },
  dotsRow: { position: 'absolute', top: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff' },
  tagChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagChipText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  actionsWrapper: { position: 'relative', paddingHorizontal: 14 },
  pickerRow: {
    position: 'absolute',
    bottom: '100%',
    left: 14,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
    ...CARD_SHADOW,
  },
  pickerButton: { padding: 4 },
  pickerEmoji: { fontSize: 24 },
  actions: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveButton: { marginLeft: 'auto' },
  reactionEmoji: { fontSize: 19 },
  actionCount: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  actionCountShared: { color: COLORS.success },
  forwardBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  forwardSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 10,
    minHeight: 220,
  },
  forwardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  forwardSentText: { color: COLORS.success, fontWeight: '600', paddingVertical: 20, textAlign: 'center' },
  forwardInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  forwardResultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  forwardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border },
  forwardAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardAvatarInitial: { color: '#fff', fontWeight: '700', fontSize: 13 },
  forwardResultName: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
});
