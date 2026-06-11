"use client";

import { useState, useMemo } from "react";
import { THEME_EMOJI, THEME_LABELS } from "@/lib/analyze";
import { MOODS } from "@/components/MoodSelector";
import GeneratedLyrics from "@/components/GeneratedLyrics";
import type { DiaryEntry } from "@/lib/storage";

type Tab = "all" | "month" | "mood";

function getEntryMonth(entry: DiaryEntry) {
  const d = new Date(entry.createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(isoMonth: string, currentMonth: string) {
  if (isoMonth === currentMonth) return "이번 달";
  const [year, month] = isoMonth.split("-");
  return `${year}년 ${parseInt(month)}월`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
  });
}

interface Props {
  entries: DiaryEntry[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
}

export default function DiaryHistory({ entries, onClose, onDelete, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [detail, setDetail] = useState<DiaryEntry | null>(null);

  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const availableMonths = useMemo(() => {
    const set = new Set(entries.map(getEntryMonth));
    return Array.from(set).sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "month") {
      const m = monthFilter ?? currentMonth;
      list = list.filter((e) => getEntryMonth(e) === m);
    } else if (tab === "mood" && moodFilter) {
      list = list.filter((e) => e.mood === moodFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.diaryText.toLowerCase().includes(q) ||
          e.songs.some((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, tab, moodFilter, monthFilter, search, currentMonth]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "month" && !monthFilter) setMonthFilter(currentMonth);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    if (detail?.id === id) setDetail(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF8F5]">
      {/* 배경 오브 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-100/50 blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-rose-100/40 blur-[60px]" />
      </div>

      {detail && <EntryDetail entry={detail} onClose={() => setDetail(null)} onDelete={handleDelete} onEdit={onEdit} />}

      <div className="relative flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pt-12 pb-20">

          {/* 헤더 */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-xs text-stone-400 mb-1">기록 보관함</p>
              <h2 className="text-2xl font-bold text-stone-800">나의 일기</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:border-stone-300 shadow-sm transition-all"
            >
              ✕
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200 mb-5">
            {(["all", "month", "mood"] as Tab[]).map((t) => {
              const labels: Record<Tab, string> = { all: "전체", month: "월별", mood: "감정별" };
              return (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    tab === t
                      ? "bg-white text-stone-700 shadow-sm border border-stone-200"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* 월별 필터 */}
          {tab === "month" && availableMonths.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
              {availableMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setMonthFilter(m)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    (monthFilter ?? currentMonth) === m
                      ? "bg-violet-50 border-violet-300 text-violet-700"
                      : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {formatMonth(m, currentMonth)}
                </button>
              ))}
            </div>
          )}

          {/* 감정별 필터 */}
          {tab === "mood" && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setMoodFilter(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  moodFilter === null
                    ? "bg-violet-50 border-violet-300 text-violet-700"
                    : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                }`}
              >
                전체
              </button>
              {MOODS.map((mood) => {
                const count = entries.filter((e) => e.mood === mood.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setMoodFilter(mood.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      moodFilter === mood.id
                        ? "bg-violet-50 border-violet-300 text-violet-700"
                        : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                    <span className="text-stone-300">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 검색창 */}
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="일기 내용 또는 추천곡으로 검색"
              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50 transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs">
                ✕
              </button>
            )}
          </div>

          <p className="text-xs text-stone-400 mb-3">
            {filtered.length > 0 ? `${filtered.length}개의 일기` : ""}
          </p>

          {/* 빈 상태 */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-2xl">
                {search ? "🔍" : "📖"}
              </div>
              <p className="text-stone-500 text-sm">{search ? "검색 결과가 없어요" : "저장된 일기가 없어요"}</p>
              {!search && <p className="text-stone-400 text-xs">일기를 작성하고 저장해보세요</p>}
            </div>
          )}

          {/* 일기 카드 목록 */}
          <div className="space-y-2">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setDetail(entry)}
                className="w-full text-left px-4 py-3.5 rounded-xl bg-white border border-stone-200 hover:border-violet-200 hover:shadow-md hover:shadow-violet-50 transition-all duration-150 group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{entry.moodEmoji}</span>
                    <span className="text-xs text-stone-600 font-medium">{entry.moodLabel || "기록"}</span>
                  </div>
                  <span className="text-[11px] text-stone-400">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-2.5 group-hover:text-stone-700 transition-colors">
                  {entry.diaryText}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.themes.slice(0, 3).map((theme) => (
                      <span key={theme} className="text-[11px] text-violet-500">
                        {THEME_EMOJI[theme]} {THEME_LABELS[theme]}
                      </span>
                    ))}
                    {entry.themes.length > 3 && <span className="text-[11px] text-stone-300">+{entry.themes.length - 3}</span>}
                  </div>
                  {entry.songs.length > 0 && (
                    <span className="text-[11px] text-stone-400">♪ {entry.songs.length}곡</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 상세 보기 ───────────────────────────────────────────

const DETAIL_GRADIENTS: Record<string, string> = {
  happy:   "from-amber-200  via-yellow-100  to-orange-50",
  sad:     "from-blue-200   via-sky-100     to-indigo-50",
  angry:   "from-rose-200   via-red-100     to-orange-50",
  anxious: "from-violet-200 via-purple-100  to-pink-50",
  tired:   "from-stone-200  via-stone-100   to-stone-50",
  love:    "from-pink-200   via-rose-100    to-fuchsia-50",
  calm:    "from-teal-200   via-emerald-100 to-cyan-50",
};

function EntryDetail({ entry, onClose, onDelete, onEdit }: {
  entry: DiaryEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const handleDelete = () => {
    if (window.confirm("이 일기를 삭제할까요?")) onDelete(entry.id);
  };
  const hasImage = !!entry.imageUrl && !imgError;
  const gradient = DETAIL_GRADIENTS[entry.mood ?? ""] ?? "from-violet-200 via-rose-100 to-amber-50";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#FAF8F5]">

      {/* 상단 네비게이션 바 */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8F5]/90 backdrop-blur-sm border-b border-stone-200/60 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-medium hover:border-stone-300 hover:text-stone-800 shadow-sm transition-all"
        >
          ← 목록
        </button>
        <p className="text-sm font-semibold text-stone-700">
          {entry.moodEmoji} {entry.moodLabel || "기록"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-xs font-medium hover:bg-amber-100 hover:border-amber-300 transition-all"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-100 hover:border-rose-300 transition-all"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pt-5 pb-16 space-y-5">

          {/* 일기 카드 — 앨범 커버 히어로 */}
          {/* 이미지 URL 유효성 감지 — CSS backgroundImage는 onError를 지원하지 않으므로 hidden img로 처리 */}
          {entry.imageUrl && !imgError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.imageUrl}
              alt=""
              style={{ display: "none" }}
              onError={() => setImgError(true)}
            />
          )}
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-xl"
            style={{
              minHeight: "min(50vh, 420px)",
              ...(hasImage ? { backgroundImage: `url(${entry.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
            }}
          >
            {!hasImage && <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />}
            {imgError && (
              <div className="absolute top-4 right-5 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-200/70 backdrop-blur-sm">
                <span className="text-[10px] text-stone-500">이미지 만료됨</span>
              </div>
            )}

            {/* 바텀-업 그라디언트 */}
            <div className={`absolute inset-0 ${
              hasImage
                ? "bg-gradient-to-t from-black/90 via-black/20 to-transparent"
                : "bg-gradient-to-t from-black/35 via-transparent to-transparent"
            }`} />

            {/* 날짜 — 상단 좌측 */}
            <div className="absolute top-4 left-5 z-10">
              <p className={`text-xs font-medium ${hasImage ? "text-white/50" : "text-stone-400"}`}>
                {entry.dateLabel}
              </p>
            </div>

            {/* 콘텐츠: 하단 정렬 */}
            <div className="relative z-10 flex flex-col justify-end h-full px-5 pb-6 pt-12"
              style={{ minHeight: "min(50vh, 420px)" }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-2xl">{entry.moodEmoji}</span>
                <span className={`text-base font-bold ${hasImage ? "text-white/95" : "text-stone-800"}`}>
                  {entry.moodLabel || "기록"}
                </span>
              </div>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${hasImage ? "text-white/85" : "text-stone-700"}`}>
                {entry.diaryText}
              </p>
            </div>
          </div>

          {/* 추천 음악 */}
          {entry.songs.length > 0 && (
            <GeneratedLyrics songs={entry.songs} isLoading={false} />
          )}
        </div>
      </div>
    </div>
  );
}
