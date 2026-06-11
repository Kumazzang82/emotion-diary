"use client";

export type Mood = {
  id: string;
  emoji: string;
  label: string;
  selected: string;
  unselected: string;
};

export const MOODS: Mood[] = [
  { id: "happy",   emoji: "😊", label: "행복", selected: "border-amber-300  bg-amber-50  text-amber-800  shadow-md shadow-amber-100",  unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
  { id: "sad",     emoji: "😢", label: "슬픔", selected: "border-blue-300   bg-blue-50   text-blue-800   shadow-md shadow-blue-100",   unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
  { id: "angry",   emoji: "😠", label: "화남", selected: "border-rose-300   bg-rose-50   text-rose-800   shadow-md shadow-rose-100",   unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
  { id: "anxious", emoji: "😰", label: "불안", selected: "border-violet-300 bg-violet-50 text-violet-800 shadow-md shadow-violet-100", unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
  { id: "tired",   emoji: "😴", label: "피곤", selected: "border-stone-300  bg-stone-100 text-stone-700  shadow-md shadow-stone-100",  unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
  { id: "love",    emoji: "🥰", label: "설렘", selected: "border-pink-300   bg-pink-50   text-pink-800   shadow-md shadow-pink-100",   unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
  { id: "calm",    emoji: "😌", label: "평온", selected: "border-teal-300   bg-teal-50   text-teal-800   shadow-md shadow-teal-100",   unselected: "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50" },
];

interface MoodSelectorProps {
  selected: string | null;
  onChange: (id: string) => void;
}

export default function MoodSelector({ selected, onChange }: MoodSelectorProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3">오늘의 기분</p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => onChange(mood.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                ${isSelected ? `${mood.selected} scale-105` : mood.unselected}`}
            >
              <span className="text-base leading-none">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
