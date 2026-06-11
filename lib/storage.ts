import type { Song } from "@/components/GeneratedLyrics";
import type { Theme } from "@/lib/analyze";

export type DiaryEntry = {
  id: string;
  createdAt: number;
  dateLabel: string;
  mood: string | null;
  moodEmoji: string;
  moodLabel: string;
  diaryText: string;
  imageUrl: string | null;
  themes: Theme[];
  keywords: string[];
  songs: Song[];
};

const KEY = "emotion-diary-entries";

export function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveEntry(entry: DiaryEntry): void {
  const entries = [entry, ...loadEntries()];
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries.map((e) => ({ ...e, imageUrl: null }))));
    } catch {}
  }
}

export function updateEntry(entry: DiaryEntry): void {
  const entries = loadEntries().map((e) => e.id === entry.id ? entry : e);
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries.map((e) => ({ ...e, imageUrl: null }))));
    } catch {}
  }
}

export function deleteEntry(id: string): void {
  const entries = loadEntries().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(entries));
}

// ─── 최근 추천곡 이력 ────────────────────────────────────

const RECENT_SONGS_KEY = "emotion-diary-recent-songs";
const RECENT_SONGS_LIMIT = 24; // 최대 보관 수

export type RecentSong = { title: string; artist: string };

export function loadRecentSongs(): RecentSong[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SONGS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addRecentSongs(songs: RecentSong[]): void {
  const existing = loadRecentSongs();
  const combined = [...songs, ...existing];
  const seen = new Set<string>();
  const unique = combined.filter((s) => {
    const key = `${s.title.toLowerCase()}|${s.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  try {
    localStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(unique.slice(0, RECENT_SONGS_LIMIT)));
  } catch {}
}
