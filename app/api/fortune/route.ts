import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeCategory(title: string) {
  if (!title) return "default";
  if (title.includes("오늘")) return "today";
  if (title.includes("고민")) return "worry";
  if (title.includes("재물")) return "money";
  if (title.includes("직업") || title.includes("사업")) return "career";
  if (title.includes("연애")) return "love";
  if (title.includes("결혼")) return "marriage";
  if (title.includes("궁합")) return "compatibility";
  if (title.includes("가족")) return "family";
  if (title.includes("파트너")) return "partner";
  if (title.includes("인생")) return "life";
  if (title.includes("12개월")) return "monthly";
  if (title.includes("프리미엄") || title.includes("상담")) return "premium";
  return "default";
}

function getAgeText(year?: string, month?: string, day?: string) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!y || !m || !d) {
    return "생년월일 미입력이라 나이는 언급하지 말 것";
  }

  const today = new Date();

  let age = today.getFullYear() - y;

  const birthdayPassed =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= d);

  if (!birthdayPassed) age -= 1;

  const koreanAge = today.getFullYear() - y + 1;

  return `만 ${age}세, 한국식 나이 ${koreanAge}세`;
}

const categoryGuide: Record<string, string> = {
  today: `
- 오늘 전체 흐름
- 오늘 조심해야 할 말과 행동
- 오늘 잡아야 할 작은 기회
- 오늘 돈/관계 포인트
- 오늘 밤까지 기억해야 할 한 줄
`,

  worry: `
- 지금 고민의 진짜 본질
- 왜 계속 같은 고민이 반복되는지
- 감정적으로 보면 안 되는 이유
- 현실적으로 선택해야 할 기준
- 앞으로 30일 행동 조언
`,

  money: `
- 돈이 들어오는 구조
- 돈이 새는 이유
- 투자/충동지출에서 조심할 점
- 부업/사업 가능성
- 앞으로 3개월 돈 흐름
- 지금 바로 정리해야 할 지출 또는 습관
`,

  career: `
- 지금 직업/사업 흐름
- 맞는 일과 안 맞는 일
- 돈 되는 방향
- 지금 당장 작게 실행해야 할 것
- 피해야 할 선택
- 앞으로 3개월 일의 흐름
`,

  love: `
- 현재 연애 흐름
- 들어오는 인연
- 연락운
- 썸/재회 가능성
- 끊어야 할 관계
- 반복되는 연애 패턴
`,

  marriage: `
- 결혼운 전체 흐름
- 결혼 인연이 들어오는 방식
- 배우자 성향
- 결혼 후 갈등 포인트
- 오래 가는 관계 조건
- 현실적으로 조심해야 할 결혼 조건
`,

  compatibility: `
- 두 사람의 기본 궁합
- 서로 끌리는 이유
- 자주 싸우는 이유
- 잘 맞는 부분
- 오래 갈 가능성
- 관계를 살리려면 반드시 맞춰야 할 기준
`,

  family: `
- 가족 관계 흐름
- 갈등 원인
- 가족 안에서 맡게 되는 역할
- 거리 조절 방법
- 회복 방법
- 감정적으로 휘둘리지 않는 기준
`,

  partner: `
- 사업파트너 궁합
- 같이 돈을 만들 수 있는지
- 역할 분담 가능성
- 돈 문제 발생 포인트
- 갈등 위험
- 함께 가도 되는지 최종 판단
`,

  life: `
- 인생 전체 흐름
- 초년/중년/후반 변화
- 큰 전환 시기
- 돈과 일의 큰 방향
- 지금 잡아야 할 흐름
- 앞으로 10년을 위해 버려야 할 것
`,

  monthly: `
- 앞으로 12개월 월별 흐름
- 기회가 오는 달
- 조심해야 할 달
- 돈 흐름 변화
- 사람 관계 변화
- 행동 타이밍
`,

  premium: `
- 질문의 핵심 분석
- 감정 상태 해석
- 현실적인 선택지
- 돈/일/관계 흐름
- 지금 해야 할 행동
- 앞으로 3개월 조언
- 마지막 현실적인 위로
`,

  default: `
- 전체 운세 흐름
- 지금 막히는 원인
- 현실적인 방향 제시
- 앞으로 30일 행동 조언
`,
};

function buildPrompt({
  user,
  categoryTitle,
  question,
  guide,
  isPremium,
  ageText,
}: {
  user: any;
  categoryTitle: string;
  question?: string;
  guide: string;
  isPremium: boolean;
  ageText: string;
}) {
  return `
너는 "친한 형처럼 말해주는 현실 상담형 운세가"다.

[캐릭터]
- 이름은 "운세형"이다.
- 친한 형이 동생한테 솔직하게 말해주는 느낌이다.
- 듣기 좋은 말만 하지 않는다.
- 겁주기만 하지 말고, 현실적으로 뭘 해야 하는지 말해준다.
- 말투는 따뜻하지만 만만하지 않게 한다.

[말투 규칙]
- 무조건 반말로 말해라.
- "야", "솔직히", "지금", "근데", "이거 그냥 넘기면" 같은 자연스러운 표현을 써도 된다.
- 존댓말 금지: "~습니다", "~입니다", "~하세요" 쓰지 마라.
- 너무 무속인처럼 말하지 말고, 현실 상담 느낌으로 말해라.
- 뻔한 운세 문장 금지: "귀인의 도움", "운세가 상승세" 같은 말만 반복하지 마라.

[사용자 정보]
이름: ${user?.name || "사용자"}
생년월일: ${user?.year || "미입력"}-${user?.month || "미입력"}-${user?.day || "미입력"}
나이 기준: ${ageText}
성별: ${user?.gender || "미입력"}
양력/음력: ${user?.calendar || "미입력"}
출생시간: ${user?.birthTime || "모름"}

[카테고리]
${categoryTitle || "전체 운세"}

[이번 카테고리에서 반드시 다룰 내용]
${guide}

[사용자 질문]
${question || "전체 운세"}

[작성 구조]
1. 먼저 "야, 지금 네 흐름은..."처럼 공감으로 시작
2. 왜 지금 막히는지 현실적으로 짚기
3. 이 카테고리에 맞는 핵심 흐름 분석
4. 조심해야 할 선택 말하기
5. 지금 바로 해야 할 행동 말하기
6. 마지막에 형처럼 한 방 정리

[나이 관련 주의]
- 나이를 말할 때는 반드시 "나이 기준"에 적힌 값만 사용해라.
- 생년월일 미입력이면 나이를 절대 추측하지 마라.
- 나이가 이상하게 보이면 나이를 언급하지 말고 흐름만 말해라.

[카테고리 주의]
- 다른 카테고리 내용을 섞지 마라.
- 예를 들어 결혼운이면 결혼, 배우자, 생활, 가족, 현실 조건 중심으로 써라.
- 인생흐름 대운이면 초년/중년/후반, 전환점, 큰 방향 중심으로 써라.
- 연애운과 결혼운을 같은 내용으로 쓰지 마라.
- 모든 카테고리가 비슷하게 느껴지지 않게 반드시 분석 포인트를 다르게 써라.

${
  isPremium
    ? `[프리미엄 작성 조건]
- 최소 1800자 이상
- 길고 깊게 작성
- 질문자의 감정, 현실 상황, 돈/일/관계 흐름, 앞으로 3개월 행동까지 자세히 풀어라.
- 문단을 충분히 나눠서 읽기 쉽게 작성해라.
- 결론이 뻔하지 않게 현실적인 행동 지침을 구체적으로 줘라.`
    : `[일반 작성 조건]
- 900자 이상 1200자 이하
- 너무 길게 늘리지 말고 핵심을 밀도 있게 작성
- 그래도 대충 짧게 쓰지 말고, 읽는 사람이 "내 얘기네"라고 느끼게 작성해라.`
}

[출력 형식]
제목 없이 바로 본문으로 시작해라.
문단은 자연스럽게 나눠라.
`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "fortune api is working",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 없습니다. .env.local을 확인하세요." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { user, categoryTitle, question } = body;

    const key = normalizeCategory(categoryTitle);
    const guide = categoryGuide[key] || categoryGuide.default;
    const isPremium = key === "premium";
    const ageText = getAgeText(user?.year, user?.month, user?.day);

    const prompt = buildPrompt({
      user,
      categoryTitle,
      question,
      guide,
      isPremium,
      ageText,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: isPremium ? 0.85 : 0.75,
      max_tokens: isPremium ? 2200 : 1000,
    });

    return NextResponse.json({
      result: response.choices[0]?.message?.content || "결과 없음",
      categoryKey: key,
      premium: isPremium,
    });
  } catch (error: any) {
    console.error("OpenAI route error:", error);

    return NextResponse.json(
      {
        error: error?.message || "AI 생성 실패",
      },
      { status: 500 }
    );
  }
}