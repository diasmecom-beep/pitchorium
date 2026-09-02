import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

// Sur le web, `asset.uri` renvoyé par expo-image-picker est une URL "blob:" générée par le
// navigateur (ex: "blob:http://localhost:8082/94f4...") — elle ne contient jamais l'extension du
// fichier d'origine. Essayer de la déduire en cherchant un "." dans cette URL produisait une
// "extension" absurde (parfois avec des ":" ou "/"), ce qui cassait l'URL de stockage finale et
// empêchait la photo/vidéo de s'afficher. On déduit donc l'extension du type MIME réel du blob.
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-msvideo': 'avi',
  'video/3gpp': '3gp',
};

function extensionFromMime(mimeType: string | undefined, fallback: string): string {
  if (mimeType && MIME_TO_EXTENSION[mimeType.toLowerCase()]) {
    return MIME_TO_EXTENSION[mimeType.toLowerCase()];
  }
  return fallback;
}

function isVideoMime(mimeType: string | undefined): boolean {
  return !!mimeType && mimeType.toLowerCase().startsWith('video/');
}

// Sélectionne une ou plusieurs images depuis la galerie de l'utilisateur, les envoie dans le
// bucket Supabase Storage "project-media" (sous un dossier propre à l'utilisateur), et renvoie
// leurs URLs publiques.
export async function pickAndUploadImages(userId: string): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Accès à la photothèque refusé. Autorisez l'accès dans les réglages pour ajouter des photos.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });

  if (result.canceled) return [];

  const urls: string[] = [];
  for (const asset of result.assets) {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const extension = extensionFromMime(asset.mimeType || blob.type, 'jpg');
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabase.storage.from('project-media').upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    if (error) throw error;

    const { data } = supabase.storage.from('project-media').getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

// Sélectionne une seule image (photo de profil) et l'envoie dans le même bucket, sous
// "{userId}/avatar-...", renvoie son URL publique ou null si l'utilisateur annule.
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Accès à la photothèque refusé. Autorisez l'accès dans les réglages pour ajouter une photo.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const extension = extensionFromMime(asset.mimeType || blob.type, 'jpg');
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from('project-media').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  if (error) throw error;

  const { data } = supabase.storage.from('project-media').getPublicUrl(path);
  return data.publicUrl;
}

export type PickedMedia = { url: string; type: 'image' | 'video' };

// Sélectionne une ou plusieurs photos et/ou vidéos (bouton trombone) pour une publication ou une
// story, et renvoie leurs URLs publiques avec leur type détecté.
export async function pickAndUploadMultipleMedia(userId: string): Promise<PickedMedia[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Accès à la photothèque refusé. Autorisez l'accès dans les réglages pour ajouter des photos ou vidéos.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });

  if (result.canceled) return [];

  const items: PickedMedia[] = [];
  for (const asset of result.assets) {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const mimeType = asset.mimeType || blob.type;
    const isVideo = asset.type === 'video' || isVideoMime(mimeType);
    const extension = extensionFromMime(mimeType, isVideo ? 'mp4' : 'jpg');
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabase.storage.from('project-media').upload(path, blob, {
      contentType: blob.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    });
    if (error) throw error;

    const { data } = supabase.storage.from('project-media').getPublicUrl(path);
    items.push({ url: data.publicUrl, type: isVideo ? 'video' : 'image' });
  }

  return items;
}

// Sélectionne une seule image pour illustrer une publication du fil d'actualité.
export async function pickAndUploadPostImage(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Accès à la photothèque refusé. Autorisez l'accès dans les réglages pour ajouter une photo.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const extension = extensionFromMime(asset.mimeType || blob.type, 'jpg');
  const path = `${userId}/post-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from('project-media').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  if (error) throw error;

  const { data } = supabase.storage.from('project-media').getPublicUrl(path);
  return data.publicUrl;
}
