"use client";

export type Song = {
  title: string;
  artist: string;
  year?: number;
  reason?: string;
  category?: "western" | "jpop" | "instrumental";
  // 저장된 이전 데이터 호환용
  genre?: string;
  tags?: string[];
};

interface GeneratedLyricsProps {
  songs: Song[] | null;
  isLoading: boolean;
}

const CATEGORY_STYLE = {
  western: {
    border: "border-l-violet-300",
    bg: "from-violet-50/60",
    badge: "bg-violet-100 text-violet-500 border-violet-200",
    text: "서양곡",
  },
  jpop: {
    border: "border-l-fuchsia-300",
    bg: "from-fuchsia-50/50",
    badge: "bg-fuchsia-100 text-fuchsia-500 border-fuchsia-200",
    text: "J-POP",
  },
  instrumental: {
    border: "border-l-rose-300",
    bg: "from-rose-50/50",
    badge: "bg-rose-100 text-rose-500 border-rose-200",
    text: "연주곡",
  },
} as const;

const FALLBACK_STYLES = [
  CATEGORY_STYLE.western,
  CATEGORY_STYLE.jpop,
  CATEGORY_STYLE.instrumental,
] as const;

export default function GeneratedLyrics({ songs, isLoading }: GeneratedLyricsProps) {
  if (isLoading) {
    return (
      <div>
        <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-widest mb-3">추천 음악</p>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-[80px] rounded-xl border-l-[3px] border border-stone-100 animate-pulse bg-gradient-to-r ${FALLBACK_STYLES[i].bg} to-white`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <div>
        <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-widest mb-3">추천 음악</p>
        <div className="flex flex-col items-center justify-center h-[100px] gap-2 rounded-xl border border-stone-200 bg-stone-50">
          <p className="text-xs text-stone-400">일기를 작성하고 생성해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-widest mb-3">추천 음악</p>
      <div className="space-y-2.5">
        {songs.map((song, i) => {
          const style =
            (song.category && CATEGORY_STYLE[song.category]) ??
            FALLBACK_STYLES[i] ??
            CATEGORY_STYLE.western;
          const categoryText =
            (song.category && CATEGORY_STYLE[song.category]?.text) ??
            (["서양곡", "J-POP", "연주곡"][i] ?? "");
          const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
            `${song.artist} ${song.title} official`
          )}`;

          return (
            <div
              key={i}
              className={`px-4 py-2.5 rounded-xl border border-stone-200 border-l-[3px] ${style.border} bg-gradient-to-r ${style.bg} to-white`}
            >
              {/* 상단: 카테고리 배지 + 제목/아티스트 + 듣기 버튼 */}
              <div className="flex items-center gap-3">
                <span
                  className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}
                >
                  {categoryText}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{song.title}</p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">{song.artist}</p>
                </div>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 text-xs font-medium hover:bg-red-100 hover:border-red-300 transition-all"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16">
                    <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                  </svg>
                  듣기
                </a>
              </div>

              {/* 추천 이유 한 줄 */}
              {song.reason && (
                <p className="text-xs text-stone-400 mt-2 pl-[60px]">
                  {song.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
