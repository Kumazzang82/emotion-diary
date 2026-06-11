"use client";

import { useState, useEffect } from "react";
import MoodSelector, { MOODS } from "@/components/MoodSelector";
import DiaryEditor from "@/components/DiaryEditor";
import GeneratedLyrics from "@/components/GeneratedLyrics";
import DiaryHistory from "@/components/DiaryHistory";
import { analyzeDiary, type DiaryAnalysis } from "@/lib/analyze";
import { saveEntry, updateEntry, loadEntries, deleteEntry, loadRecentSongs, addRecentSongs, type DiaryEntry } from "@/lib/storage";
import type { Song } from "@/components/GeneratedLyrics";

type GeneratedResult = {
  imageUrl: string | null;
  imagePrompt: string | null;
  songs: Song[];
};

type LoadingState = { image: boolean; lyrics: boolean };

type Snapshot = {
  diaryText: string;
  mood: string | null;
};

const MOOD_GRADIENTS: Record<string, string> = {
  happy:   "from-amber-200  via-yellow-100  to-orange-50",
  sad:     "from-blue-200   via-sky-100     to-indigo-50",
  angry:   "from-rose-200   via-red-100     to-orange-50",
  anxious: "from-violet-200 via-purple-100  to-pink-50",
  tired:   "from-stone-200  via-stone-100   to-stone-50",
  love:    "from-pink-200   via-rose-100    to-fuchsia-50",
  calm:    "from-teal-200   via-emerald-100 to-cyan-50",
};

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [diaryText, setDiaryText] = useState("");
  const [loading, setLoading] = useState<LoadingState>({ image: false, lyrics: false });
  const [analysis, setAnalysis] = useState<DiaryAnalysis | null>(null);
  const [result, setResult] = useState<Partial<GeneratedResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => { setEntries(loadEntries()); }, []);

  const isGenerating = loading.image || loading.lyrics;
  const showResults = analysis !== null || isGenerating;
  const hasResult = result.imageUrl != null || (result.songs && result.songs.length > 0);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const canGenerate = diaryText.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    setError(null);
    setResult({});
    setIsSaved(false);
    setSnapshot({ diaryText, mood: selectedMood });

    const analyzed = analyzeDiary(diaryText);
    setAnalysis(analyzed);

    const payload = {
      mood: selectedMood ?? "calm",
      themes: analyzed.themes,
      keywords: analyzed.keywords,
      diaryText,
      recentSongs: loadRecentSongs(),
    };
    setLoading({ image: true, lyrics: true });

    const [imageRes, lyricsRes] = await Promise.allSettled([
      fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
      fetch("/api/generate-lyrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
    ]);

    setLoading({ image: false, lyrics: false });
    const errors: string[] = [];

    if (imageRes.status === "fulfilled") {
      setResult((prev) => ({ ...prev, imageUrl: imageRes.value.imageUrl ?? null, imagePrompt: imageRes.value.imagePrompt ?? null }));
      if (imageRes.value.error) errors.push("이미지 생성 실패 — 배경색으로 대체됩니다");
    } else {
      setResult((prev) => ({ ...prev, imageUrl: null }));
      errors.push("이미지 생성 실패");
    }

    if (lyricsRes.status === "fulfilled" && !lyricsRes.value.error) {
      const songs = lyricsRes.value.songs ?? [];
      setResult((prev) => ({ ...prev, songs }));
      if (songs.length > 0) {
        addRecentSongs(songs.map((s: { title: string; artist: string }) => ({ title: s.title, artist: s.artist })));
      }
    } else {
      errors.push("노래 추천 실패");
    }

    if (errors.length > 0) setError(errors.join(" · ") + " — API 키를 확인해주세요.");
  };

  const handleEdit = (entry: DiaryEntry) => {
    setDiaryText(entry.diaryText);
    setSelectedMood(entry.mood);
    setSnapshot({ diaryText: entry.diaryText, mood: entry.mood });
    setResult({ imageUrl: entry.imageUrl ?? null, imagePrompt: null, songs: entry.songs });
    setAnalysis({ themes: entry.themes, keywords: entry.keywords, emotionKeywords: [] });
    setIsSaved(false);
    setError(null);
    setEditingEntry(entry);
    setShowHistory(false);
  };

  const handleSave = () => {
    if (!analysis) return;
    const moodData = MOODS.find((m) => m.id === selectedMood);
    const entry: DiaryEntry = {
      id: editingEntry?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: editingEntry?.createdAt ?? Date.now(),
      dateLabel: editingEntry?.dateLabel ?? today,
      mood: selectedMood,
      moodEmoji: moodData?.emoji ?? "📝",
      moodLabel: moodData?.label ?? "",
      diaryText,
      imageUrl: null,
      themes: analysis.themes,
      keywords: analysis.keywords,
      songs: result.songs ?? [],
    };
    if (editingEntry) {
      updateEntry(entry);
    } else {
      saveEntry(entry);
    }
    setEntries(loadEntries());
    setEditingEntry(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = (id: string) => { deleteEntry(id); setEntries(loadEntries()); };

  const snapshotMoodData = MOODS.find((m) => m.id === (snapshot?.mood ?? selectedMood));
  const moodGradient = MOOD_GRADIENTS[snapshot?.mood ?? selectedMood ?? ""] ?? "from-violet-200 via-rose-100 to-amber-50";
  const hasImage = !!result.imageUrl;

  return (
    <>
      {showHistory && (
        <DiaryHistory entries={entries} onClose={() => setShowHistory(false)} onDelete={handleDelete} onEdit={handleEdit} />
      )}

      <main className="min-h-screen bg-[#FAF8F5] px-4 pb-20">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-violet-200/50 blur-[90px]" />
          <div className="absolute -bottom-24 -left-16 w-[360px] h-[360px] rounded-full bg-rose-200/40 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-100/30 blur-[70px]" />
        </div>

        <div className="relative max-w-md mx-auto pt-12">

          {/* 헤더 */}
          <header className="flex items-start justify-between mb-10">
            <div>
              <p className="text-xs text-stone-400 mb-1">{today}</p>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-stone-800 to-violet-700 bg-clip-text text-transparent">
                  감정 일기
                </span>
                {snapshotMoodData && <span className="ml-2">{snapshotMoodData.emoji}</span>}
              </h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="relative mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 text-xs font-medium hover:bg-violet-100 hover:border-violet-300 shadow-sm transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              기록
              {entries.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-400 text-white text-[10px] flex items-center justify-center font-bold">
                  {entries.length > 9 ? "9+" : entries.length}
                </span>
              )}
            </button>
          </header>

          {/* 수정 모드 배너 */}
          {editingEntry && (
            <div className="mb-5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">{editingEntry.moodEmoji}</span>
                <p className="text-xs text-amber-700 font-medium">기록 수정 중</p>
                <p className="text-xs text-amber-400">{editingEntry.dateLabel}</p>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-xs text-amber-500 hover:text-amber-700 font-medium transition-colors"
              >
                취소
              </button>
            </div>
          )}

          {/* 기분 선택 */}
          <section className="mb-7">
            <MoodSelector selected={selectedMood} onChange={setSelectedMood} />
          </section>

          {/* 일기 입력 */}
          <section className="mb-4">
            <DiaryEditor value={diaryText} onChange={setDiaryText} />
          </section>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 mb-8
              ${canGenerate && !isGenerating
                ? "bg-gradient-to-br from-violet-600 to-violet-800 text-white hover:from-violet-500 hover:to-violet-700 shadow-lg shadow-violet-200 active:scale-[0.98]"
                : "bg-stone-100 text-stone-300 border border-stone-200 cursor-not-allowed"
              }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                생성 중...
              </span>
            ) : showResults ? "↺  다시 생성하기" : "✦  이미지 & 음악 추천"}
          </button>

          {/* 에러 */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-600">
              {error}
            </div>
          )}

          {/* 결과 영역 — 입력칸 아래에 표시 */}
          {showResults && (
            <div className="space-y-5">
              <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-rose-100" />

              {/* 이미지 카드 */}
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-xl"
                style={hasImage ? { backgroundImage: `url(${result.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                {!hasImage && <div className={`absolute inset-0 bg-gradient-to-br ${moodGradient}`} />}
                <div className={`absolute inset-0 ${
                  hasImage
                    ? "bg-gradient-to-t from-black/88 via-black/20 to-transparent"
                    : "bg-gradient-to-t from-black/35 via-transparent to-transparent"
                }`} />

                {loading.image && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                <div className="relative z-10 min-h-[300px] flex flex-col justify-end px-5 pb-6 pt-5">
                  {snapshotMoodData && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{snapshotMoodData.emoji}</span>
                      <span className={`text-base font-bold ${hasImage ? "text-white/95" : "text-stone-800"}`}>
                        {snapshotMoodData.label}
                      </span>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${hasImage ? "text-white/85" : "text-stone-700"}`}>
                    {snapshot?.diaryText ?? diaryText}
                  </p>
                </div>
              </div>

              {/* 추천 음악 */}
              <section>
                <GeneratedLyrics songs={result.songs ?? null} isLoading={loading.lyrics} />
              </section>

              {/* 저장 버튼 */}
              {hasResult && !isGenerating && (
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`w-full py-3.5 rounded-2xl text-sm font-semibold border transition-all duration-300 active:scale-[0.98]
                    ${isSaved
                      ? "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-100"
                      : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100 hover:border-violet-300 shadow-sm"
                    }`}
                >
                  {isSaved ? "✓ 저장됐어요!" : editingEntry ? "수정 내용 저장하기" : "일기 저장하기"}
                </button>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
