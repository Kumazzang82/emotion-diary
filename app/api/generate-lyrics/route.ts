import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { THEME_LABELS, type Theme } from "@/lib/analyze";

const MOOD_KO: Record<string, string> = {
  happy: "행복",
  sad: "슬픔",
  angry: "화남",
  anxious: "불안",
  tired: "피곤",
  love: "설렘",
  calm: "평온",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  const { mood, themes, keywords, diaryText, recentSongs = [] } = await req.json();
  const themesKo = (themes as Theme[]).map((t) => THEME_LABELS[t] ?? t).join(", ");
  const moodKo = MOOD_KO[mood] ?? mood;

  const recentList = (recentSongs as { title: string; artist: string }[])
    .slice(0, 20)
    .map((s) => `- ${s.title} (${s.artist})`)
    .join("\n");

  const avoidBlock = recentList
    ? `\n반드시 추천하지 말아야 할 곡 (최근 추천 이력):\n${recentList}\n`
    : "";

  const prompt = `다음 일기 내용과 감정에 어울리는 노래 3곡을 아래 구성으로 추천해줘.

일기:
"""
${diaryText}
"""

감정: ${moodKo}
테마: ${themesKo}
${avoidBlock}
[추천 구성 — 순서와 카테고리 고정]
1. 서양곡 (category: "western") — 영미권/유럽권 아티스트의 팝·록·R&B·소울 등
2. J-POP (category: "jpop") — 일본 아티스트의 곡
3. 연주곡 (category: "instrumental") — 피아노·기타·OST·재즈·클래식 등 가사 없는 악기 연주곡

분위기는 일기 내용과 감정에 맞게 선택해줘.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 쓰지 마.
{"songs":[
  {"category":"western","title":"곡명","artist":"원곡 아티스트","year":발매연도숫자,"reason":"추천 이유 한 문장"},
  {"category":"jpop","title":"곡명","artist":"원곡 아티스트","year":발매연도숫자,"reason":"추천 이유 한 문장"},
  {"category":"instrumental","title":"곡명","artist":"원곡 아티스트","year":발매연도숫자,"reason":"추천 이유 한 문장"}
]}

[원곡 가수 정확성 규칙 — 최우선]
- artist 필드는 반드시 원곡을 처음 발표한 아티스트 실명만 허용
- 커버 가수·커버 채널명·유튜버 채널명을 artist에 절대 쓰지 말 것
- 예: title="소원", artist="이적" (커버 채널명 금지)
- 곡명 또는 원곡 가수 중 하나라도 확신이 없으면 다른 확실한 곡으로 대체

[기타 규칙]
1. 위 '추천하지 말아야 할 곡' 목록의 곡은 절대 추천하지 마
2. Billboard·Oricon·멜론 등 주요 차트에 오른 검증된 곡만
3. year(발매연도) 반드시 포함
4. 불확실하거나 마이너한 곡은 추천하지 마
5. reason: 이 곡의 분위기를 이모지 1개 + 짧은 한국어 문구로 (예: "🌙 차분한 밤", "☀️ 긍정적인 하루", "🏃 운동 후의 상쾌함") — 해시태그나 긴 문장 금지, 5~10자 이내 짧은 문구`;



  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "당신은 음악 큐레이터입니다. 반드시 JSON만 출력하세요." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 650,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(content);
    const songs = Array.isArray(parsed.songs) ? parsed.songs : [];

    return NextResponse.json({ songs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
