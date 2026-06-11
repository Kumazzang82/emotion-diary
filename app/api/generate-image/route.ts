import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Theme } from "@/lib/analyze";

const MOOD_EN: Record<string, string> = {
  happy:   "joyful and uplifting",
  sad:     "melancholic and tender",
  angry:   "intense and turbulent",
  anxious: "uneasy and dreamlike",
  tired:   "quiet and weary",
  love:    "romantic and longing",
  calm:    "serene and peaceful",
};

// 감정별 색감 & 분위기 — 일러스트 특화
const MOOD_PALETTE: Record<string, string> = {
  happy:   "warm golden yellow and soft coral, dappled light through leaves, luminous and joyful color harmony",
  sad:     "cool cerulean blue and soft lavender, gentle misty rain, quiet wistful atmosphere",
  angry:   "deep crimson and burning amber, dramatic swirling sky, bold emotional tension",
  anxious: "swirling indigo and violet, dreamlike surreal elements, eerie yet beautiful twilight",
  tired:   "warm amber and dusty rose, soft dim evening light, intimate and melancholy stillness",
  love:    "soft rose pink and warm gold, blooming petals, romantic sweet warmth",
  calm:    "sage green and sky blue, still water reflection, peaceful morning solitude",
};

// 테마별 장면 풀 — 인물/풍경/사물 구도를 섞어서 매번 다른 이미지
const THEME_SCENE_POOL: Record<string, string[]> = {
  dev_tech: [
    "a warm desk viewed from above — keyboard, coffee mug, sticky notes, a plant, soft morning light — no text or labels visible",
    "a cozy dimly lit room at night, a softly glowing monitor showing only abstract blue and purple light gradients and bokeh — no text, no code",
    "a rain-streaked window at night with blurred city lights outside, a faint reflection of an indoor lamp on the glass",
  ],
  creation: [
    "an open sketchbook with scattered pencils and dried flowers on a wooden table, soft natural light",
    "paint-stained hands hovering above a half-finished canvas, vivid colors",
    "a sunlit studio corner, canvases leaning against the wall, dust motes floating in golden afternoon light",
  ],
  achievement: [
    "a solitary figure at a hilltop, arms wide open, looking out over a vast horizon bathed in golden light",
    "a mountain summit breaking through clouds, dramatic sunbeams pouring through in rays of gold and white",
    "an empty road stretching to the horizon, a single pair of footprints in the sand, clear blue sky above",
  ],
  struggle: [
    "a lone figure walking down a rain-soaked street at night, reflected neon lights shimmering on wet pavement",
    "a small boat on dark choppy waters, heavy clouds parting above with a sliver of light",
    "bare winter branches against a heavy grey sky, a single leaf still holding on",
  ],
  social: [
    "two silhouettes at a café table by a foggy window, warm light inside, cold dark outside",
    "an empty park bench with two indentations in the grass, golden evening light slanting across",
    "a cozy table set for two — two cups of tea, a shared book, soft candlelight — no people",
  ],
  study: [
    "an open book bathed in soft lamplight, a steaming cup of tea beside it, a cozy reading nook",
    "a window seat with scattered books and a potted plant, long afternoon shadows across the floor",
    "a library aisle viewed from below, warm amber light filtering through tall wooden shelves",
  ],
  exercise: [
    "a figure running through a wide open field, long grass bending in the wind, sky filling the frame",
    "an empty running track in early morning mist, dew glistening on each lane",
    "a pair of worn sneakers on a sunlit wooden floor, a water bottle and towel beside them",
  ],
  food: [
    "a steaming bowl on a small wooden table, soft window light, cozy and quiet",
    "a bakery window at dusk — golden loaves and pastries glowing from inside the warm shop",
    "a kitchen windowsill with small herb pots, morning light, fresh ingredients laid on a cutting board",
  ],
  travel: [
    "a winding road curving through autumn countryside, mountains in the golden distance",
    "a train window view — fields, forests, a river — landscape blurred in gentle motion",
    "a figure with a backpack standing at a crossroads, facing a wide open landscape at sunrise",
  ],
  work: [
    "a focused figure at a desk in warm lamplight, papers and a coffee mug, quiet late-night atmosphere",
    "a city-view office window at night, one small desk lamp glowing inside, skyscrapers outside",
    "a tidy wooden desk from above — open planner, pen, coffee, morning sunlight casting soft shadows",
  ],
  nature: [
    "an open sky with drifting clouds, light rays breaking through — pure vast stillness",
    "a forest path dappled with sunlight, leaves rustling, deep green and gold",
    "a calm lake reflecting the sky at golden hour, reeds at the edge, perfect glassy stillness",
  ],
  daily: [
    "a window seat bathed in soft morning light, a book and a cup of tea — ordinary beauty",
    "a cozy bedroom corner at dusk — a reading lamp, a potted plant, a rumpled blanket",
    "a quiet street on an early Sunday morning, shuttered shops, long shadows, nobody in sight",
  ],
};

function isAccessError(message: string) {
  return (
    message.includes("does not exist") ||
    message.includes("billing") ||
    message.includes("quota") ||
    message.includes("permission") ||
    message.includes("not supported") ||
    message.includes("inaccessible")
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다.", imageUrl: null });
  }

  const { mood, themes, keywords, diaryText } = await req.json();
  const typedThemes = themes as Theme[];

  const moodDesc  = MOOD_EN[mood]     || mood;
  const palette   = MOOD_PALETTE[mood] || "warm and emotional color palette";
  const scenePool = THEME_SCENE_POOL[typedThemes[0] as keyof typeof THEME_SCENE_POOL]
    ?? THEME_SCENE_POOL.daily;
  const scene = scenePool[Math.floor(Math.random() * scenePool.length)];
  const keywordStr = (keywords as string[]).slice(0, 3).join(", ");
  const diarySnippet = (diaryText as string).slice(0, 120);

  const prompt = `A single emotionally evocative digital illustration in the style of an indie album cover or Japanese light novel cover art.

Scene: ${scene}
Diary context: "${diarySnippet}"
Emotional mood: ${moodDesc}
Color palette: ${palette}
Keywords: ${keywordStr}

Art style requirements:
- Warm painterly digital illustration, NOT photorealism or photography
- Soft anime-inspired aesthetic with subtle Studio Ghibli warmth — gentle, not literal
- Atmospheric and emotional, like a cover painting for an indie music album or literary novel
- Composition variety is essential: some images should be wide landscape shots, some intimate still-life close-ups, some aerial overhead views, some atmospheric empty scenes with no people at all — match the scene description naturally
- When the scene is a landscape, object, or place: render it with NO human figures; let the environment carry the emotion
- When figures appear: stylized silhouettes or partial forms only — no realistic faces, no portraits
- Beautiful dreamy composition with strong color mood
- Single striking image, magazine or album cover quality
- CRITICAL — absolutely NO text of any kind: no letters, numbers, words, sentences, code lines, signs, captions, subtitles, labels, watermarks, or characters from any writing system
- If any screen, monitor, phone, or display appears: show ONLY abstract glowing shapes, color gradients, or bokeh light — never code, text, UI, or any readable content on the screen
- No keyboards with visible labels, no books with legible text, no signboards, no menus`;

  const client = new OpenAI({ apiKey });

  // 1순위: gpt-image-1
  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    });

    const item = (response.data ?? [])[0];
    if (item?.b64_json) {
      return NextResponse.json({
        imageUrl: `data:image/png;base64,${item.b64_json}`,
        imagePrompt: prompt,
        source: "gpt-image-1",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!isAccessError(message)) {
      return NextResponse.json({ error: message, imageUrl: null });
    }
  }

  // 2순위: dall-e-3 → dall-e-2
  for (const model of ["dall-e-3", "dall-e-2"] as const) {
    try {
      const response = await client.images.generate({
        model,
        prompt,
        n: 1,
        size: "1024x1024",
      });

      const item = (response.data ?? [])[0];
      if (!item) break;

      const revisedPrompt = (item as { revised_prompt?: string }).revised_prompt ?? prompt;

      // 임시 URL을 base64로 변환해 저장 — DALL-E URL은 ~1시간 후 만료됨
      if (item.url) {
        try {
          const imgFetch = await fetch(item.url);
          const buf = await imgFetch.arrayBuffer();
          const b64 = Buffer.from(buf).toString("base64");
          const ct = imgFetch.headers.get("content-type") ?? "image/png";
          return NextResponse.json({
            imageUrl: `data:${ct};base64,${b64}`,
            imagePrompt: revisedPrompt,
            source: model,
          });
        } catch {
          // 변환 실패 시 만료 URL 그대로 반환 (fallback)
          return NextResponse.json({
            imageUrl: item.url,
            imagePrompt: revisedPrompt,
            source: model,
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!isAccessError(message)) {
        return NextResponse.json({ error: message, imageUrl: null });
      }
    }
  }

  return NextResponse.json({
    imageUrl: null,
    error: "사용 가능한 이미지 모델이 없습니다. OpenAI API 키와 크레딧을 확인해주세요.",
  });
}
