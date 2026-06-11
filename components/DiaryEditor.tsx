"use client";

import { useState } from "react";

interface DiaryEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DiaryEditor({ value, onChange }: DiaryEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3">일기</p>
      <textarea
        value={localValue}
        onChange={handleChange}
        placeholder="오늘 하루를 자유롭게 써보세요..."
        rows={7}
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50 transition-all leading-relaxed shadow-sm"
      />
      <p className="text-right text-xs text-stone-300 mt-1.5">{localValue.length}자</p>
    </div>
  );
}
