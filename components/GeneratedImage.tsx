"use client";

interface GeneratedImageProps {
  imageUrl: string | null;
  isLoading: boolean;
  prompt: string | null;
}

export default function GeneratedImage({ imageUrl, isLoading, prompt }: GeneratedImageProps) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">생성된 이미지</p>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">이미지 생성 중...</p>
          </div>
        ) : imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="생성된 이미지"
              className="w-full h-full object-cover"
            />
            {prompt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                <p className="text-xs text-zinc-400 line-clamp-2">{prompt}</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-zinc-600">일기를 작성하고 생성해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
