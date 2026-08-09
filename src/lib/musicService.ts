import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface MusicSettings {
  playlistUrl: string;
  updatedAt: string;
  updatedBy: string;
}

const MUSIC_DOC = doc(db, "settings", "music");

export async function getMusicSettings(): Promise<MusicSettings | null> {
  try {
    const snap = await getDoc(MUSIC_DOC);
    if (!snap.exists()) return null;
    return snap.data() as MusicSettings;
  } catch {
    return null;
  }
}

export async function setMusicSettings(
  playlistUrl: string,
  updatedBy: string
): Promise<void> {
  await setDoc(MUSIC_DOC, {
    playlistUrl,
    updatedBy,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * YouTube playlist URL'ini embed URL'ine çevirir.
 * https://www.youtube.com/playlist?list=PLxxx
 * → https://www.youtube.com/embed/videoseries?list=PLxxx&autoplay=1&loop=1
 */
export function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const listId = parsed.searchParams.get("list");
    if (listId) {
      return `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1&loop=1&controls=1`;
    }
    // Doğrudan video linki de destekleyelim
    const videoId =
      parsed.searchParams.get("v") ||
      parsed.pathname.split("/").pop();
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1`;
    }
  } catch {
    // geçersiz url
  }
  return url;
}
