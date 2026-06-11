export type Theme =
  | "dev_tech"
  | "creation"
  | "achievement"
  | "struggle"
  | "social"
  | "study"
  | "exercise"
  | "food"
  | "travel"
  | "work"
  | "nature"
  | "daily";

// 각 테마를 단독으로 확정하는 강한 키워드 (1개만 있어도 테마 인정)
const THEME_KEYWORDS_STRONG: Record<Theme, string[]> = {
  dev_tech: [
    "개발", "코딩", "코드", "프로그램", "앱", "배포", "버그",
    "서버", "github", "api", "데이터베이스", "db", "디버그", "개발자",
    "프론트", "백엔드", "리액트", "파이썬", "자바스크립트", "타입스크립트",
  ],
  creation: ["창작", "작곡", "그림", "디자인"],
  achievement: ["성공", "해냈", "달성", "합격", "드디어", "마침내", "뿌듯"],
  struggle: ["힘들", "포기", "실패", "지쳐", "막혔", "괴로"],
  social: ["친구", "가족", "엄마", "아빠", "형", "누나", "동생", "연인"],
  study: ["공부", "시험", "수업", "학교", "과제", "강의", "도서관"],
  exercise: ["운동", "헬스", "요가", "수영", "등산", "자전거"],
  food: ["식사", "요리", "음식", "맛있"],
  travel: ["여행", "드라이브", "나들이"],
  work: ["회의", "업무", "출근", "야근", "미팅", "직장"],
  nature: ["바다", "자연"],
  daily: [],
};

// 2개 이상 매칭되어야 테마로 인정하는 약한 키워드
const THEME_KEYWORDS_WEAK: Record<Theme, string[]> = {
  dev_tech: ["사이트", "웹", "next", "서버"],
  creation: ["만들었", "완성", "제작", "그렸", "편집", "촬영"],
  achievement: ["끝냈", "처음으로", "이겼", "통과", "완료"],
  struggle: ["어렵", "모르겠", "못 했"],
  social: ["만났", "대화", "통화", "같이", "사람들"],
  study: ["읽었", "배웠"],
  exercise: ["달렸", "걸었", "산책", "뛰었", "pt"],
  food: ["먹었", "카페", "커피", "밥", "마셨", "먹고"],
  travel: ["외출", "방문", "놀러"],
  work: ["일했", "발표"],
  nature: ["하늘", "바람", "꽃", "나무", "강", "공원", "날씨"],
  daily: [],
};

// 일기 본문에서 추출하는 활동 키워드 — 표시용 레이블 매핑
const ACTIVITY_KEYWORD_MAP: Record<string, string> = {
  // dev_tech
  "개발": "개발", "코딩": "코딩", "코드": "코드", "버그": "버그", "배포": "배포",
  "프론트": "프론트엔드", "백엔드": "백엔드", "리액트": "React",
  // creation
  "그림": "그림", "디자인": "디자인", "작곡": "작곡", "창작": "창작",
  // achievement
  "성공": "성공", "합격": "합격", "달성": "달성",
  // social
  "친구": "친구", "가족": "가족", "연인": "연인",
  // study
  "공부": "공부", "시험": "시험", "과제": "과제", "강의": "강의",
  // exercise
  "운동": "운동", "헬스": "헬스", "요가": "요가", "등산": "등산", "수영": "수영",
  // food
  "카페": "카페", "커피": "커피", "요리": "요리", "식사": "식사",
  // travel
  "여행": "여행", "드라이브": "드라이브",
  // work
  "회의": "회의", "업무": "업무", "야근": "야근", "미팅": "미팅",
  // nature
  "바다": "바다", "산책": "산책", "공원": "공원",
};

// 감정 키워드 — 일기 본문에서 직접 추출
const EMOTION_KEYWORD_MAP: Record<string, string> = {
  "기뻤": "기쁨", "기쁘": "기쁨", "행복": "행복", "즐거": "즐거움",
  "뿌듯": "뿌듯함", "설렘": "설렘", "설렜": "설렘", "감사": "감사함",
  "신났": "신남", "좋았": "좋은 기분",
  "슬펐": "슬픔", "슬퍼": "슬픔", "울었": "슬픔", "외로": "외로움",
  "힘들": "힘듦", "지쳤": "지침", "피곤": "피곤함",
  "화가": "화남", "짜증": "짜증", "답답": "답답함",
  "불안": "불안", "걱정": "걱정", "무서": "두려움",
  "아쉬": "아쉬움", "그리": "그리움",
};

export interface DiaryAnalysis {
  themes: Theme[];
  keywords: string[];         // 활동 키워드 (API 전달용)
  emotionKeywords: string[];  // 감정 키워드 (표시용)
}

export function analyzeDiary(text: string): DiaryAnalysis {
  const lower = text.toLowerCase();
  const themes: Theme[] = [];
  const activityKeywords: string[] = [];
  const emotionKeywords: string[] = [];

  // 테마 감지: 강한 키워드 1개 or 약한 키워드 2개 이상
  for (const theme of Object.keys(THEME_KEYWORDS_STRONG) as Theme[]) {
    const strongMatches = THEME_KEYWORDS_STRONG[theme].filter(kw => lower.includes(kw));
    const weakMatches = THEME_KEYWORDS_WEAK[theme].filter(kw => lower.includes(kw));

    if (strongMatches.length > 0 || weakMatches.length >= 2) {
      themes.push(theme);
      // 실제 일기에 등장한 키워드만 수집
      [...strongMatches, ...weakMatches].forEach(kw => {
        const label = ACTIVITY_KEYWORD_MAP[kw];
        if (label && !activityKeywords.includes(label)) {
          activityKeywords.push(label);
        }
      });
    }
  }

  // 감정 키워드: 일기 본문에 직접 등장한 감정 표현만 수집
  for (const [match, label] of Object.entries(EMOTION_KEYWORD_MAP)) {
    if (lower.includes(match) && !emotionKeywords.includes(label)) {
      emotionKeywords.push(label);
    }
  }

  return {
    themes: themes.length > 0 ? themes : ["daily"],
    keywords: activityKeywords.slice(0, 5),
    emotionKeywords: emotionKeywords.slice(0, 4),
  };
}

export const THEME_LABELS: Record<Theme, string> = {
  dev_tech: "개발/기술",
  creation: "창작",
  achievement: "성취",
  struggle: "도전",
  social: "인간관계",
  study: "학습",
  exercise: "운동",
  food: "식사",
  travel: "여행",
  work: "업무",
  nature: "자연",
  daily: "일상",
};

export const THEME_EMOJI: Record<Theme, string> = {
  dev_tech: "💻",
  creation: "🎨",
  achievement: "🏆",
  struggle: "💪",
  social: "🤝",
  study: "📚",
  exercise: "🏃",
  food: "🍽️",
  travel: "✈️",
  work: "💼",
  nature: "🌿",
  daily: "☀️",
};

// 테마별 이미지 (긍정 무드 / 어두운 무드)
const THEME_IMAGES: Record<Theme, [string, string]> = {
  dev_tech: [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
  ],
  creation: [
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80",
  ],
  achievement: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    "https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=600&q=80",
  ],
  struggle: [
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=80",
    "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80",
  ],
  social: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
    "https://images.unsplash.com/photo-1516471013-22f20a228b86?w=600&q=80",
  ],
  study: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80",
  ],
  exercise: [
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80",
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80",
  ],
  food: [
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
    "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&q=80",
  ],
  travel: [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80",
  ],
  work: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80",
  ],
  nature: [
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80",
  ],
  daily: [
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  ],
};

const POSITIVE_MOODS = new Set(["happy", "love", "calm"]);

const MOOD_ATMOSPHERE: Record<string, string> = {
  happy: "따뜻한 황금빛, 밝고 생동감 넘치는 분위기",
  sad: "차가운 블루톤, 고요하고 감성적인 분위기",
  angry: "강렬한 붉은 대비, 드라마틱한 분위기",
  anxious: "보랏빛 안개, 몽환적이고 긴장된 분위기",
  tired: "채도 낮은 따뜻한 톤, 나른하고 고요한 분위기",
  love: "핑크빛 보케, 몽환적이고 달콤한 분위기",
  calm: "청록빛 은빛, 평온하고 잔잔한 분위기",
};

const THEME_VISUAL_DESC: Record<Theme, string> = {
  dev_tech: "코드가 빛나는 화면, 창조하는 개발자의 공간",
  creation: "무언가를 만들어가는 창작의 순간",
  achievement: "마침내 정상에 오른 순간의 벅찬 감동",
  struggle: "혼자 버텨내는 강인한 의지의 장면",
  social: "사람과 사람 사이 따뜻한 연결의 순간",
  study: "집중과 탐구, 지식이 쌓이는 고요한 공간",
  exercise: "땀과 의지, 한계를 넘는 역동적인 장면",
  food: "정성스럽게 차려진 한 끼의 따뜻한 온기",
  travel: "지평선으로 이어지는 길, 자유로운 여정",
  work: "집중된 업무, 전문성이 빛나는 순간",
  nature: "광활한 자연 속 인간의 작은 존재감",
  daily: "특별하지 않지만 소중한 일상의 한 장면",
};

export function generateImageUrl(mood: string, themes: Theme[]): string {
  const idx = POSITIVE_MOODS.has(mood) ? 0 : 1;
  return THEME_IMAGES[themes[0]][idx];
}

export function generateImagePrompt(mood: string, themes: Theme[]): string {
  const atmosphere = MOOD_ATMOSPHERE[mood] || "시네마틱한 분위기";
  return `${THEME_VISUAL_DESC[themes[0]]} — ${atmosphere}`;
}

// 테마별 가사 템플릿
const LYRIC_LINES: Record<Theme, { verse: string[]; chorus: string[] }> = {
  dev_tech: {
    verse: [
      "빈 화면 앞에 앉아 첫 줄을 써내려가",
      "코드 한 줄 한 줄 쌓아 만들어가는 나만의 세상",
      "에러와 씨름하다 보면 어느새 새벽이야",
      "실행 버튼 누르는 그 긴장감이 좋아",
    ],
    chorus: [
      "화면 속에 피어난 나의 가능성",
      "만들고 또 만들며 오늘도 성장해",
      "내 손끝에서 시작된 작은 기적",
      "내가 그린 세상, 내가 쌓아온 내일",
    ],
  },
  creation: {
    verse: [
      "아무것도 없던 곳에 뭔가를 만들어냈어",
      "처음엔 막막했지만 결국엔 해냈잖아",
      "상상이 현실로 바뀌는 그 순간의 짜릿함",
      "내 손으로 빚어낸 오늘 하루의 결과물",
    ],
    chorus: [
      "없던 것에서 있는 것으로, 나만의 작품",
      "창조하는 기쁨이 이런 거구나",
      "두 손 가득 채워진 오늘의 성취감",
      "다시 시작할 용기가 여기서 나",
    ],
  },
  achievement: {
    verse: [
      "드디어 해냈어, 오래 기다려온 이 순간",
      "포기하고 싶었던 날들이 스쳐 지나가",
      "끝내 이뤄낸 이 승리가 눈물겹도록 값져",
      "첫 발걸음이 이렇게 먼 길을 걸어왔어",
    ],
    chorus: [
      "할 수 있다고 믿었던 내가 맞았어",
      "결국엔 해내는 사람이 되고 싶었어",
      "이 순간을 오래 기억할게, 오늘의 나",
      "작은 성공들이 쌓여 나를 만들어가",
    ],
  },
  struggle: {
    verse: [
      "왜 이렇게 안 되는 건지 모르겠어",
      "분명 노력했는데 결과가 따라오질 않아",
      "한 발 내딛을 때마다 두 발씩 미끄러져",
      "그래도 포기란 말은 아직 하고 싶지 않아",
    ],
    chorus: [
      "버텨내는 것도 용기라는 걸 알아",
      "지금 힘들다고 끝난 게 아니야",
      "언젠가 웃으면서 돌아볼 날이 올 거야",
      "오늘의 나, 잘 버텨줘서 고마워",
    ],
  },
  social: {
    verse: [
      "네 얼굴 보는 것만으로 하루가 환해져",
      "오랜만에 나눈 이야기가 따뜻했어",
      "혼자였다면 몰랐을 것들을 너와 함께 알아가",
      "사람 사이에서 피어나는 작은 위로들",
    ],
    chorus: [
      "혼자가 아니란 걸 다시 느꼈어",
      "옆에 있어줘서, 고마워",
      "우리가 함께하는 이 시간들이 내 보물",
      "또 만나자, 그 말이 제일 좋아",
    ],
  },
  study: {
    verse: [
      "모르던 걸 알아가는 기쁨이 이거구나",
      "페이지를 넘길수록 세상이 넓어지는 것 같아",
      "어렵게 느껴지던 것들이 하나씩 풀려가",
      "오늘도 조금 더 알게 된 나",
    ],
    chorus: [
      "배운다는 건 조금씩 자라는 것",
      "지금 이 순간의 노력이 내일의 나를 만들어",
      "포기하지 않는 한 답은 반드시 있어",
      "한 페이지씩, 한 걸음씩",
    ],
  },
  exercise: {
    verse: [
      "땀이 눈을 가려도 멈추기 싫었어",
      "몸이 무거워도 한 발 더 내딛었어",
      "숨이 차오르는 그 순간이 살아있는 느낌",
      "움직일수록 머릿속이 맑아지는 것 같아",
    ],
    chorus: [
      "내 몸을 믿고 끝까지 달렸어",
      "한계라고 생각한 그 너머에 내가 있어",
      "오늘도 최선을 다한 이 몸에게 고마워",
      "내일은 더 멀리, 더 높이",
    ],
  },
  food: {
    verse: [
      "오늘의 한 끼가 하루를 구했어",
      "따뜻한 한 잔이 마음까지 녹여줘",
      "맛있는 거 먹을 때 혼자여도 행복해",
      "음식 앞에선 고민도 잠깐 내려놓게 돼",
    ],
    chorus: [
      "소소한 것들이 행복이더라",
      "배부른 이 순간, 충분해",
      "맛있는 하루에 감사해",
      "이런 소소함이 쌓여 하루가 돼",
    ],
  },
  travel: {
    verse: [
      "낯선 길을 걸으며 생각이 많아졌어",
      "일상에서 벗어나니 숨통이 트이는 것 같아",
      "새로운 곳에서 새로운 나를 만난 것 같아",
      "여기까지 온 것만으로도 충분해",
    ],
    chorus: [
      "떠나는 것도 용기가 필요해",
      "새로운 곳에서 충전되는 나",
      "이 길 위에서 만난 작은 발견들",
      "돌아가도 괜찮아, 충분히 느꼈으니까",
    ],
  },
  work: {
    verse: [
      "오늘도 열심히 했어, 그걸로 충분해",
      "지치도록 일했지만 해냈다는 게 남아",
      "잘 해낼 수 있을까 걱정했던 나인데",
      "퇴근길에서야 비로소 숨을 쉬는 것 같아",
    ],
    chorus: [
      "열심히 사는 나, 수고했어",
      "오늘의 노력은 반드시 어딘가에 쌓여",
      "내일의 나에게 부끄럽지 않은 하루",
      "다 잘 될 거야, 진짜로",
    ],
  },
  nature: {
    verse: [
      "하늘을 올려다보니 잠깐 멈추게 됐어",
      "바람이 지나가며 뭔가를 말해주는 것 같아",
      "자연 앞에선 내 고민이 작아지더라",
      "계절이 바뀌는 걸 느끼며 시간을 실감해",
    ],
    chorus: [
      "이 순간 여기 있다는 게 기적이야",
      "자연과 함께할 때 내가 가장 나다워",
      "작은 것들이 아름답다는 걸 다시 알았어",
      "그냥 있어도 괜찮은 날",
    ],
  },
  daily: {
    verse: [
      "평범한 하루도 지나고 나면 소중해질 거야",
      "아무 일 없는 날이 사실은 제일 좋은 날",
      "일상이 조금씩 쌓여 나를 만들어가",
      "오늘 하루도 나름대로 잘 살았어",
    ],
    chorus: [
      "특별하지 않아도 괜찮아",
      "이 하루가 내 것이라는 사실로 충분해",
      "그냥 살아있는 것, 그게 다야",
      "내일도 오늘처럼 버텨보자",
    ],
  },
};

const MOOD_LYRIC_WRAP: Record<string, { intro: string; outro: string }> = {
  happy: { intro: "햇살 같은 하루였어", outro: "오늘 같은 날이 계속되길" },
  sad: { intro: "마음 한켠이 무거운 하루였어", outro: "그래도 내일은 조금 나을 거야" },
  angry: { intro: "가슴 속에 뭔가가 치밀어 올랐어", outro: "이 감정도 결국 지나가겠지" },
  anxious: { intro: "온종일 마음이 어딘가 불안했어", outro: "천천히 괜찮아질 거라 믿어" },
  tired: { intro: "몸도 마음도 온통 지쳐버린 날", outro: "오늘만큼은 쉬어도 돼" },
  love: { intro: "가슴이 두근두근, 이상한 하루", outro: "이 설렘이 오래오래 이어지길" },
  calm: { intro: "잔잔하고 고요한 하루였어", outro: "이대로 충분해, 오늘 하루" },
};

const GENRE_MAP: Record<string, Partial<Record<Theme, string>> & { default: string }> = {
  happy: { dev_tech: "Indie Pop", creation: "Indie Folk", achievement: "Pop Rock", default: "Indie Pop" },
  sad: { dev_tech: "Ambient", creation: "Singer-Songwriter", achievement: "Acoustic Ballad", default: "Acoustic Ballad" },
  angry: { dev_tech: "Electronic Rock", creation: "Alternative", achievement: "Rock", default: "Rock" },
  anxious: { dev_tech: "Ambient Electronic", creation: "Art Pop", default: "Ambient Electronic" },
  tired: { dev_tech: "Lo-fi", creation: "Chillhop", default: "Lo-fi Chill" },
  love: { dev_tech: "Synth Pop", creation: "R&B", default: "R&B / Soul" },
  calm: { dev_tech: "Neo Soul", creation: "Folk", default: "Neo Soul" },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique<T>(arr: T[], exclude: T[]): T {
  const filtered = arr.filter((item) => !exclude.includes(item));
  return filtered.length > 0 ? pick(filtered) : pick(arr);
}

export function generateLyrics(mood: string, themes: Theme[]): string {
  const wrap = MOOD_LYRIC_WRAP[mood] ?? { intro: "오늘 하루", outro: "수고했어" };
  const primary = themes[0];
  const secondary = themes[1] ?? themes[0];

  const pLines = LYRIC_LINES[primary];
  const sLines = LYRIC_LINES[secondary];

  const v1a = pick(pLines.verse);
  const v1b = pickUnique(pLines.verse, [v1a]);
  const ch1 = pick(pLines.chorus);
  const ch2 = pickUnique(pLines.chorus, [ch1]);
  const v2a = pick(sLines.verse);
  const v2b = pickUnique(sLines.verse, [v2a]);

  return `[Intro]
${wrap.intro}

[Verse 1]
${v1a}
${v1b}

[Chorus]
${ch1}
${ch2}

[Verse 2]
${v2a}
${v2b}

[Outro]
${wrap.outro}`;
}

export function generateGenre(mood: string, themes: Theme[]): string {
  const moodMap = GENRE_MAP[mood];
  if (!moodMap) return "Indie";
  return moodMap[themes[0]] ?? moodMap.default;
}
