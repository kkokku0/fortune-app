import OpenAI from "openai";

export async function GET() {
  return Response.json({
    ok: true,
    message: "fortune api is working",
  });
}

export async function POST(req: Request) {
  try {
    const { user, categoryTitle, question } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY가 없습니다. .env.local을 확인하세요." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const name = user?.name || "당신";
    const birth = `${user?.year || "미입력"}-${user?.month || "미입력"}-${user?.day || "미입력"}`;
    const gender = user?.gender || "미입력";
    const calendar = user?.calendar || "양력";
    const birthTime = user?.birthTime || "모름";

    const prompt = `
당신은 한국어 프리미엄 운세 상담가입니다.

사용자:
이름 ${name}
생년월일 ${birth}
구분 ${calendar}
출생시간 ${birthTime}
성별 ${gender}
분석주제 ${categoryTitle}
질문 ${question || "없음"}

아래 형식으로 작성하세요.

[전체 총평]
[현재 운의 흐름]
[돈/일/관계 흐름]
[조심해야 할 선택]
[앞으로 30일 조언]
[마지막 위로]

조건:
- 900자 이상 1200자 이하
- 반복 문장 금지
- 불안만 조장하지 말고 현실적인 행동 조언 포함
- 한국어로 작성
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    return Response.json({
      result: response.choices[0]?.message?.content || "결과가 생성되지 않았습니다.",
    });
  } catch (error: any) {
    console.error("OpenAI error:", error);

    return Response.json(
      {
        error: error?.message || "AI 운세 생성 실패",
      },
      { status: 500 }
    );
  }
}