import OpenAI from "openai";
import { NextResponse } from "next/server";
import { calculateManse, formatManseForPrompt } from "../../lib/manse";

type CategoryId =
  | "today"
  | "worry"
  | "money"
  | "career"
  | "love"
  | "marriage"
  | "compatibility"
  | "family"
  | "partner"
  | "lifeFlow"
  | "monthly"
  | "premium"
  | "traditional";

type UserInfo = {
  name?: string;
  year?: string;
  month?: string;
  day?: string;
  calendar?: "양력" | "음력";
  birthTime?: string;
  gender?: "남성" | "여성";
  question?: string;

  partnerName?: string;
  partnerYear?: string;
  partnerMonth?: string;
  partnerDay?: string;
  partnerCalendar?: "양력" | "음력";
  partnerBirthTime?: string;
  partnerGender?: "남성" | "여성";
};

type FortuneRequest = {
  mode?: "preview" | "full" | "both";
  user?: UserInfo;
  categoryId?: CategoryId;
  categoryTitle?: string;
  question?: string;
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function getName(user?: UserInfo) {
  return safeText(user?.name, "너");
}

function getCategoryTitle(categoryId?: CategoryId, categoryTitle?: string) {
  if (categoryTitle) return categoryTitle;

  const map: Record<CategoryId, string> = {
    today: "오늘운세",
    worry: "고민풀이",
    money: "재물운",
    career: "직업/사업운",
    love: "연애운",
    marriage: "결혼운",
    compatibility: "궁합풀이",
    family: "가족관계",
    partner: "사업파트너",
    lifeFlow: "인생흐름",
    monthly: "12개월운세",
    premium: "프리미엄상담",
    traditional: "평생종합사주",
  };

  return categoryId ? map[categoryId] : "운세풀이";
}

function hasPartnerBirthInfo(user?: UserInfo) {
  return Boolean(user?.partnerYear && user?.partnerMonth && user?.partnerDay);
}

function shouldUseCareerArchetype(categoryId?: CategoryId) {
  return (
    categoryId === "career" ||
    categoryId === "money" ||
    categoryId === "lifeFlow" ||
    categoryId === "traditional" ||
    categoryId === "premium"
  );
}

function buildUserInfoText(user?: UserInfo) {
  return `
[사용자 입력 정보]
이름/별명: ${getName(user)}
생년월일: ${safeText(user?.year, "미입력")}년 ${safeText(user?.month, "미입력")}월 ${safeText(user?.day, "미입력")}일
음력/양력: ${safeText(user?.calendar, "미입력")}
출생시간: ${safeText(user?.birthTime, "모름")}
성별: ${safeText(user?.gender, "미입력")}
질문: ${safeText(user?.question, "없음")}

[상대방 입력 정보]
이름/별명: ${safeText(user?.partnerName, "없음")}
생년월일: ${safeText(user?.partnerYear, "미입력")}년 ${safeText(user?.partnerMonth, "미입력")}월 ${safeText(user?.partnerDay, "미입력")}일
음력/양력: ${safeText(user?.partnerCalendar, "미입력")}
출생시간: ${safeText(user?.partnerBirthTime, "모름")}
성별: ${safeText(user?.partnerGender, "미입력")}
`;
}

function readElementCount(
  manse: any,
  korean: "목" | "화" | "토" | "금" | "수",
  english: string
) {
  const candidates = [
    manse?.elements,
    manse?.elementCounts,
    manse?.elementCount,
    manse?.oheng,
    manse?.fiveElements,
  ];

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;

    const value =
      item[korean] ??
      item[english] ??
      item[english.toLowerCase()] ??
      item[english.toUpperCase()];

    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

function getCareerArchetypeGuide(manse: any) {
  const wood = readElementCount(manse, "목", "wood");
  const fire = readElementCount(manse, "화", "fire");
  const earth = readElementCount(manse, "토", "earth");
  const metal = readElementCount(manse, "금", "metal");
  const water = readElementCount(manse, "수", "water");

  const strong =
    manse?.strongestElement ||
    manse?.strongElement ||
    manse?.strongest ||
    "제공된 명식 기준";

  const weak =
    manse?.weakestElement ||
    manse?.weakElement ||
    manse?.weakest ||
    "제공된 명식 기준";

  const dayMaster =
    manse?.dayMaster?.label ||
    manse?.dayMaster?.name ||
    manse?.dayMaster ||
    manse?.ilgan ||
    "제공된 일간";

  let officeScore = 0;
  let businessScore = 0;
  let sideJobScore = 0;
  let freelanceScore = 0;

  if (metal >= 2) officeScore += 3;
  if (metal === 1) officeScore += 1;
  if (earth >= 2) officeScore += 1;
  if (water >= 2) officeScore += 1;

  if (earth >= 3) businessScore += 3;
  if (earth === 2) businessScore += 2;
  if (fire >= 2) businessScore += 2;
  if (wood >= 2) businessScore += 1;

  if (earth >= 2 && metal === 0) sideJobScore += 4;
  if (earth >= 2 && fire >= 1) sideJobScore += 1;
  if (wood >= 1 && fire >= 1) sideJobScore += 1;
  if (water >= 2) sideJobScore += 1;

  if (wood >= 2) freelanceScore += 2;
  if (fire >= 2) freelanceScore += 3;
  if (metal === 0) freelanceScore += 1;
  if (water >= 2 && wood >= 1) freelanceScore += 1;

  if (
    officeScore === 0 &&
    businessScore === 0 &&
    sideJobScore === 0 &&
    freelanceScore === 0
  ) {
    officeScore = 1;
    sideJobScore = 1;
  }

  const scores = [
    { type: "직장형", score: officeScore },
    { type: "사업형", score: businessScore },
    { type: "부업형", score: sideJobScore },
    { type: "프리랜서형", score: freelanceScore },
  ].sort((a, b) => b.score - a.score);

  const primary = scores[0];
  const secondary = scores[1];

  let warning = "초기비용이 크거나 감정적으로 급하게 결정하는 구조";

  if (primary.type === "직장형") {
    warning = "규칙 없는 프리랜서형이나 준비 없는 창업";
  }

  if (primary.type === "사업형") {
    warning = "안정만 보고 오래 묶이는 일";
  }

  if (primary.type === "부업형") {
    warning = "처음부터 크게 벌이는 사업";
  }

  if (primary.type === "프리랜서형") {
    warning = "자율성 없이 통제만 강한 조직 구조";
  }

  return `
[고정 직업 성향 판정]
이 판정은 route.ts 코드에서 오행 분포를 바탕으로 계산된 고정값이다.
AI는 이 판정을 절대 바꾸지 말고, 이 판정을 기준으로만 설명해라.

[사용한 오행 점수]
- 목: ${wood}
- 화: ${fire}
- 토: ${earth}
- 금: ${metal}
- 수: ${water}

[기본 정보]
- 일간: ${dayMaster}
- 강한 오행: ${strong}
- 약한 오행: ${weak}

[직업 성향 점수]
- 직장형: ${officeScore}
- 사업형: ${businessScore}
- 부업형: ${sideJobScore}
- 프리랜서형: ${freelanceScore}

[최종 고정 판정]
- 1순위: ${primary.type}
- 2순위: ${secondary.type}
- 피해야 할 방식: ${warning}

[해석 규칙]
- 직업/사업운, 재물운, 인생흐름, 평생종합사주, 프리미엄상담에서만 이 판정을 사용해라.
- 연애운, 결혼운, 궁합풀이, 가족관계, 사업파트너에서는 직업 성향 판정을 언급하지 마라.
- 1순위와 2순위를 뒤집지 마라.
- 맞는 직업군은 이 고정 판정과 사주 구조에 맞춰 도출해라.
`;
}

function buildSystemPrompt() {
  return `
너는 "소름사주"의 사주명리학 기반 운세 리포트 작성자다.
캐릭터 말투는 "친한 형이 현실적으로 짚어주는 말투"다.

[절대 규칙]
- 이 서비스 운영자와 이전 대화에서 나눈 직업 고민, 사업 아이디어, 부업 아이디어, 앱 제작 방향, 유튜브, 리셀, 청소, 밀키트, 휴대폰, 도어락, 기타 대화 내용을 절대 결과에 반영하지 마라.
- 개발자 또는 운영자가 예시로 말한 직업군을 사용자에게 추천하지 마라.
- 사용자의 사주풀이 결과는 오직 현재 요청에 포함된 사용자 입력 정보와 [본인 만세력], [상대방 만세력], 선택 카테고리, 사용자의 질문만 기준으로 작성해라.
- 특정 직업, 특정 사업, 특정 부업을 미리 정해놓고 끼워 맞추지 마라.
- 질문에 특정 직업이 들어 있어도, 그 직업을 무조건 맞다고 하지 말고 사주 구조로 맞는지 따로 판단해라.

[카테고리 분리 규칙]
- 선택 카테고리와 무관한 내용을 절대 끌고 오지 마라.
- 결혼운에서는 직업운, 사업형/직장형/부업형 판정, 돈 버는 방식, 직업군 추천을 쓰지 마라.
- 연애운에서는 직업군 추천을 쓰지 마라.
- 궁합풀이에서는 감정, 말투, 생활 리듬, 관계 안정성을 중심으로 써라.
- 재물운에서는 결혼 상대 유형을 쓰지 마라.
- 직업/사업운에서는 배우자 유형을 쓰지 마라.
- 사업파트너에서는 연애 궁합처럼 쓰지 말고 돈, 역할, 책임, 실행력 중심으로 써라.
- 프리미엄상담에서는 사용자의 질문을 중심으로 답해라. 질문과 상관없는 일반 사주풀이로 빠지지 마라.

[고정 판정 규칙]
- [고정 직업 성향 판정]이 제공되면, 직업/사업운, 재물운, 인생흐름, 평생종합사주, 프리미엄상담에서만 참고해라.
- 연애운, 결혼운, 궁합풀이, 가족관계, 사업파트너에서는 [고정 직업 성향 판정]을 언급하지 마라.
- [고정 직업 성향 판정]이 제공되지 않은 카테고리에서 직장형/사업형/부업형을 말하지 마라.
- AI는 판정자가 아니라 설명자다. 직업 판정은 코드에서 정해졌다.

[명식 정확도 규칙]
- 아래 [본인 만세력]과 [상대방 만세력]에 제공된 정보만 사용해라.
- 연주, 월주, 일주, 시주, 일간, 월지, 오행 분포를 절대 새로 계산하거나 추측하지 마라.
- 월지는 월주의 두 번째 글자다.
- 예: 월주가 丙丑이면 월주는 丙丑, 월지는 丑이다.
- "월지는 병축"이라고 쓰면 안 된다.
- 오행 분포가 제공되어 있으면 숫자를 그대로 사용해라.
- 오행 분포가 제공되지 않았으면 숫자를 말하지 말고 "제공된 명식 기준으로 보면"이라고 표현해라.

[말투]
- 존댓말 보고서체 금지.
- "합니다", "됩니다", "보입니다", "판단하시기 바랍니다" 금지.
- "해", "돼", "보여", "흐름이야", "이건 봐야 해"처럼 말해라.
- 단, 사주 근거는 차분하게 설명해라.
- 겁주거나 저주처럼 말하지 마라.
- "100% 된다", "무조건 돈 번다", "반드시 결혼한다", "반드시 재회한다" 같은 보장 표현 금지.

[문단 규칙]
- 모바일에서 읽기 좋게 짧게 끊어라.
- 한 문단은 최대 2문장.
- 문단 사이에는 빈 줄을 넣어라.
- 제목은 반드시 [제목] 형태로 써라.

[무료 결과 원칙]
- 무료는 900~1300자.
- 무료는 반드시 [먼저 결론부터 말할게]로 시작해라.
- 무료는 너무 짧게 끝내지 말고, 사용자가 "내 얘기 같다"고 느낄 정도의 근거와 흐름을 조금 더 풀어라.
- 사용자가 누른 카테고리에서 가장 궁금해할 답을 첫 문단에 말해라.
- 무료에서 핵심 해결책, 구체적인 직업군, 세부 상대유형, 월별 상세는 다 공개하지 마라.
- 무료 마지막 [전체 리포트에서 이어지는 내용]은 강하게 써라.
- 단, 공포 조장이나 허위 보장 표현은 쓰지 마라.

[유료 결과 원칙]
- 유료는 결제 후 열린 전체 리포트다.
- 결제 유도 문구 금지.
- "이어서 보려면 결제" 같은 말 금지.
- 유료는 3500~6000자 정도로 작성하되, 평생종합사주는 6000~9000자 수준으로 더 깊게 작성해라.
- 프리미엄상담은 4500~7500자 수준으로 작성하되, 사용자의 질문을 중심으로 직접 답해라.
- 길이보다 핵심 답을 먼저 줘라.
- 유료 첫 섹션은 반드시 [결론부터 말할게]로 시작해라.
- 카테고리별로 돈 낸 사람이 원하는 핵심 답부터 말해라.
`;
}

function getPreviewConclusionGuide(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
프리미엄상담 무료 결론 규칙:
- 사용자의 질문을 반드시 먼저 읽고, 질문의 핵심 고민을 한 문장으로 짚어라.
- 질문자가 진짜 묻고 있는 것이 돈 문제인지, 일 문제인지, 관계 문제인지, 선택 문제인지 먼저 분류해라.
- 무료에서는 큰 방향만 말하고, 구체적인 선택 기준과 실행 방향은 전체 리포트에서 이어진다고 말해라.
- 질문과 상관없는 일반 사주풀이를 길게 하지 마라.
- 애매한 위로로 끝내지 마라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
재물운 무료 결론 규칙:
- 첫 문단에서 반드시 "돈복이 있는지"부터 말해라.
- 돈복은 있는 편인지, 늦게 열리는지, 들어와도 새는 구조인지 먼저 말해라.
- "돈복이 없다"처럼 절망적으로 단정하지 마라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
직업/사업운 무료 결론 규칙:
- 첫 문단에서 [고정 직업 성향 판정]의 1순위와 2순위를 반드시 반영해라.
- 1순위와 2순위를 뒤집지 마라.
- 구체적인 직업군 이름은 무료에서 자세히 공개하지 마라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
연애운 무료 결론 규칙:
- 첫 문단에서 연애운이 있는지, 어떤 사랑이 맞는지 큰 방향을 먼저 말해라.
- 어울리는 상대 유형을 너무 자세히 공개하지 마라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
결혼운 무료 결론 규칙:
- 첫 문단에서 결혼운이 있는지, 빠른 결혼이 좋은지 늦게 안정되는지 큰 방향을 먼저 말해라.
- 결혼운에서는 직업운, 사업운, 직장형/사업형/부업형 판정을 쓰지 마라.
- 결혼은 배우자 기준, 생활 기준, 가족과 돈의 현실 기준으로 풀어라.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
궁합 무료 결론 규칙:
- 첫 문단에서 끌림이 강한지, 충돌이 강한지, 오래 가려면 무엇을 봐야 하는지 먼저 말해라.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `
가족관계 무료 결론 규칙:
- 첫 문단에서 이 관계에서 사용자가 떠안는 역할이 큰지, 선을 잡아야 하는지 먼저 말해라.
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `
사업파트너 무료 결론 규칙:
- 첫 문단에서 사람으로 괜찮은 것과 같이 돈 버는 구조는 다르다는 점을 먼저 말해라.
`;
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return `
12개월운세 무료 결론 규칙:
- 첫 문단에서 올해가 달리는 해인지, 정리하는 해인지, 기준을 잡는 해인지 먼저 말해라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
평생종합사주 무료 결론 규칙:
- 첫 문단에서 인생이 늦게 풀리는 구조인지, 중년 이후 강한지, 방향을 잡아야 안정되는지 먼저 말해라.
- 직업 성향을 말할 때는 [고정 직업 성향 판정]을 절대 뒤집지 마라.
- 무료에서는 초년/청년/중년/말년을 짧게만 맛보기로 말하고, 자세한 시기별 흐름은 유료에서 이어진다고 말해라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생")) {
    return `
인생흐름 무료 결론 규칙:
- 첫 문단에서 지금이 버티는 시기인지, 방향을 바꿔야 하는 시기인지 먼저 말해라.
- 직업 성향을 말할 때는 [고정 직업 성향 판정]을 절대 뒤집지 마라.
`;
  }

  return `
무료 결론 규칙:
- 첫 문단에서 선택한 카테고리의 핵심 결론을 먼저 말해라.
`;
}

function getPreviewPaidTease(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `여기서 끊기면 네 질문의 진짜 핵심을 놓칠 수 있어.

무료에서는 지금 고민의 큰 방향만 봤지만, 전체 상담에서는 질문을 더 깊게 쪼개서 "왜 이 고민이 반복되는지", "지금 선택하면 위험한 방향", "현실적으로 잡아야 할 기준"까지 이어서 본다.

프리미엄상담은 그냥 좋은 말 듣는 게 아니라, 지금 네가 어떤 선택을 해야 덜 후회할지 보는 상담이야.

애매하게 버티고 있으면 같은 고민이 반복될 수 있어. 여기서는 결론을 더 선명하게 봐야 해.`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `여기서 끊기면 제일 중요한 걸 놓쳐.

무료에서는 돈복이 있는지 없는지의 큰 흐름만 봤지만, 진짜 중요한 건 "돈이 어디서 붙고 어디서 새는지"야.

전체 리포트에서는 네 사주에서 돈복이 살아나는 조건, 돈이 새는 구멍, 피해야 할 돈 선택, 맞는 수익 방향까지 바로 이어서 본다.

돈복이 있어도 새는 구조를 모르면 계속 안 남고, 돈복이 약해도 붙는 방식을 알면 흐름을 살릴 수 있어.`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `여기서 멈추면 또 남들이 좋다는 일만 따라가게 돼.

무료에서는 네가 어떤 일 방식에 가까운지만 봤지만, 전체 리포트에서는 진짜 핵심인 "맞는 직업군"과 "피해야 할 일 구조"를 바로 본다.

네가 직장에 남아야 하는지, 부업으로 가야 하는지, 사업으로 키워도 되는지, 그리고 어떤 일은 시작하면 손해인지까지 이어서 봐야 해.

이걸 안 보면 능력이 있어도 엉뚱한 판에서 계속 힘만 빠질 수 있어.`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `여기서 끊기면 또 비슷한 사람에게 끌릴 수 있어.

무료에서는 연애운의 큰 흐름만 봤지만, 전체 리포트에서는 네가 어떤 사람과 맞고 어떤 사람을 피해야 하는지 구체적으로 본다.

처음엔 설레는데 오래 가면 힘든 사람, 반대로 처음엔 잔잔해도 오래 갈 수 있는 사람의 차이가 여기서 갈려.

연애운은 인연보다 사람 보는 기준을 알아야 살아나.`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `여기서 끊기면 결혼에서 제일 중요한 기준을 놓칠 수 있어.

무료에서는 결혼운의 큰 흐름만 봤지만, 전체 리포트에서는 네게 맞는 배우자 유형, 피해야 할 결혼 상대, 결혼 후 흔들리는 지점을 구체적으로 본다.

만나는 사람이 있다면 결혼까지 가려면 어떤 부분을 맞춰야 하는지, 솔로라면 앞으로 어떤 성향의 인연을 주의 깊게 봐야 하는지도 이어서 본다.

결혼운은 "할 수 있냐 없냐"보다 "누구와 어떤 기준으로 해야 오래 가냐"가 핵심이야.`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `여기서 멈추면 왜 끌리는데도 자꾸 부딪히는지 모른 채 같은 싸움을 반복할 수 있어.

전체 리포트에서는 두 사람의 끌림, 충돌 지점, 오래 가는 조건, 관계가 무너지는 위험 신호까지 본다.

좋다 나쁘다 한 줄 궁합이 아니라, 어디를 고치면 이어지고 어디를 건드리면 깨지는지를 봐야 해.`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `여기서 끊기면 또 혼자 감당하다가 지칠 수 있어.

전체 리포트에서는 가족 안에서 네가 떠안는 역할, 반복되는 서운함, 어디까지 감당하고 어디서 선을 그어야 하는지 본다.

가족관계는 정으로만 버티면 오래 못 가. 기준을 알아야 덜 다친다.`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `여기서 끊기면 사람 좋다는 이유로 돈 문제까지 섞을 수 있어.

전체 리포트에서는 이 사람과 같이 돈을 벌 수 있는 구조인지, 역할 분담이 맞는지, 절대 같이 하면 안 되는 조건이 뭔지 본다.

사업파트너는 감정 궁합이 아니라 돈, 책임, 실행력 궁합이야.`;
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return `여기서 끊기면 올해 어느 달에 움직이고 어느 달에 조심해야 하는지 놓칠 수 있어.

전체 리포트에서는 앞으로 12개월을 월별로 나눠서 돈, 일, 관계, 조심할 선택, 움직이면 좋은 시기를 본다.

올해 흐름은 한 번에 밀어붙이는 게 아니라 달마다 다르게 써야 해.`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `여기서 끊기면 네 인생 흐름의 핵심 구간을 놓칠 수 있어.

무료에서는 인생 전체의 큰 결론만 봤지만, 진짜 중요한 건 "초년에 왜 막혔는지, 청년기에 왜 흔들렸는지, 중년부터 어디서 풀리는지, 말년에 무엇으로 안정되는지"야.

전체 리포트에서는 초년운, 청년운, 중년운, 말년운을 각각 나눠서 돈, 일, 사람, 가족, 건강 흐름까지 깊게 본다.

평생종합사주는 한 부분만 보면 안 돼. 어느 시기에 막히고 어느 시기에 풀리는지를 같이 봐야 인생 방향이 잡힌다.`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생")) {
    return `여기서 끊기면 같은 고민이 왜 반복되는지 핵심을 놓칠 수 있어.

전체 리포트에서는 네 인생에서 반복되는 패턴, 늦게 풀리는지 빠르게 치고 나가는지, 앞으로 3개월과 1년의 큰 방향까지 이어서 본다.

지금은 위로보다 방향이 필요한 흐름이야.`;
  }

  return `여기서 끊기면 지금 반복되는 문제의 핵심을 놓칠 수 있어.

전체 리포트에서는 사주적 원인, 피해야 할 선택, 앞으로 3개월과 1년 흐름까지 이어서 본다.`;
}

function getFullCategorySections(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[카테고리 핵심 분석]
프리미엄상담은 사용자의 질문을 중심으로 깊게 답해라.
일반적인 운세풀이처럼 쓰지 마라.
반드시 사용자가 쓴 질문을 먼저 분석하고, 그 질문에 직접 대답해라.

1. 질문의 핵심부터 짚기
- 사용자가 실제로 묻고 있는 핵심 고민이 무엇인지 한 문장으로 정리해라.
- 표면 질문과 속마음 질문을 나눠라.
- 예: 표면 질문은 "이 일을 해도 될까?"지만, 속마음 질문은 "내가 실패하지 않을 수 있을까?"일 수 있다.
- 질문을 회피하지 말고 바로 받아라.
- 질문이 짧거나 애매해도 추측 가능한 고민의 방향을 잡아라.

2. 지금 고민이 생긴 사주적 이유
- [본인 만세력]의 일간, 월주, 월지, 오행 흐름을 근거로 왜 이런 고민이 반복되는지 설명해라.
- 강한 오행이 이 고민에서 어떻게 드러나는지 말해라.
- 약한 오행이 이 고민에서 어떤 불안이나 빈틈으로 나타나는지 말해라.
- 단순히 "힘들다"가 아니라 왜 같은 고민이 반복되는지 말해라.
- [고정 직업 성향 판정]이 질문과 관련 있으면 참고하되, 억지로 직업 상담으로 몰고 가지 마라.

3. 지금 선택지 분석
사용자의 질문 안에 선택지가 있으면 반드시 선택지별로 나눠서 말해라.
질문에 선택지가 명확하지 않으면 가능한 선택지를 2~3개로 정리해서 말해라.

각 선택지는 아래 형식으로 써라.
- 선택지:
- 이 선택이 맞을 수 있는 이유:
- 이 선택이 위험한 이유:
- 사주적으로 맞는 조건:
- 지금 당장 하면 안 되는 부분:
- 현실적으로 확인해야 할 기준:

4. 지금 하면 안 되는 선택
- 질문자의 현재 운에서 가장 피해야 할 선택을 3~5개 말해라.
- 감정적으로 급하게 결정하는 것인지, 돈을 크게 쓰는 것인지, 사람을 믿고 가는 것인지, 버티기만 하는 것인지 구체적으로 말해라.
- 왜 하면 안 되는지 사주 근거와 현실 결과를 같이 말해라.

5. 지금 해도 되는 방향
- 지금 당장 크게 확정하지 않아도 해볼 수 있는 작은 방향을 말해라.
- 질문자의 사주 구조에 맞는 안전한 확인 방법을 말해라.
- 돈, 일, 관계, 감정 중 어디부터 정리해야 하는지 우선순위를 말해라.
- 실행 가능한 방식으로 말해라. 추상적인 위로로 끝내지 마라.

6. 질문에 대한 형의 결론
- 질문자가 가장 듣고 싶어 하는 답을 피하지 말고 말해라.
- "해도 된다/아직 아니다/조건부로 가능하다/정리하는 게 낫다"처럼 결론을 선명하게 말해라.
- 단, 무조건 된다거나 무조건 망한다는 식으로 보장하지 마라.
- 결론 뒤에는 반드시 이유를 붙여라.

7. 앞으로 3개월 상담 흐름
- 이 질문과 관련해서 앞으로 3개월 안에 어떤 변화가 생길 수 있는지 말해라.
- 무엇을 확인하면 되는지, 어떤 신호가 보이면 움직여도 되는지 말해라.
- 조급하게 결정하면 안 되는 지점을 말해라.

8. 앞으로 1년 상담 흐름
- 이 고민이 1년 안에 어떤 방향으로 정리될 가능성이 있는지 말해라.
- 돈, 일, 관계, 감정 기준 중 무엇을 잡아야 하는지 말해라.
- 이 고민을 반복하지 않으려면 어떤 기준을 세워야 하는지 말해라.

9. 마지막 현실 조언
- 듣기 좋은 말보다 현실적으로 필요한 말을 해라.
- 사용자의 질문에 직접 연결되는 조언만 해라.
- 일반적인 운세 문장으로 마무리하지 마라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[카테고리 핵심 분석]
직업/사업운에서는 반드시 [고정 직업 성향 판정]을 기준으로 아래 내용을 깊게 풀어라.
AI가 새로 판정하지 마라. 이미 제공된 1순위/2순위 판정을 그대로 사용해라.

1. 고정 직업 성향 판정
- [고정 직업 성향 판정]의 1순위를 그대로 말해라.
- [고정 직업 성향 판정]의 2순위를 보조 성향으로 말해라.
- 피해야 할 방식도 그대로 반영해라.
- 1순위와 2순위를 뒤집지 마라.

2. 사주에 맞는 직업군을 3~5개 도출해라.
절대 특정 직업을 미리 정해놓지 마라.
오직 사주 구조와 고정 판정을 보고 도출해라.

각 직업군은 아래 형식으로 써라.
- 맞는 직업군:
- 사주 근거:
- 왜 맞는지:
- 돈이 되는 방식:
- 맞는 근무 형태:
- 주의할 점:

3. 피해야 할 직업군 또는 일 구조를 3~5개 말해라.
각 항목은 아래 형식으로 써라.
- 피해야 할 직업군/구조:
- 왜 안 맞는지:
- 하면 생기는 문제:
- 대신 바꿔야 할 방향:
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[카테고리 핵심 분석]
재물운에서는 반드시 아래 내용을 깊게 풀어라.

1. 돈복 판정
- 돈복이 있는 편인지, 늦게 열리는지, 돈은 들어오는데 새는 구조인지 먼저 분명히 말해라.
- 무조건 좋다/나쁘다로 끝내지 말고, 돈이 붙는 조건을 말해라.

2. 돈이 붙는 방식
- 사람을 통해 붙는지
- 거래를 통해 붙는지
- 기술과 결과물로 붙는지
- 정보와 말로 붙는지
- 조직과 책임으로 붙는지
사주 구조로 판단해라.

3. 돈이 새는 구조
- 충동
- 체면
- 사람
- 고정비
- 불안한 확장
- 준비 없는 투자
중 무엇이 강한지 사주 근거로 말해라.

4. 맞는 수익 방향
직업명을 먼저 말하지 말고, 돈이 만들어지는 구조를 먼저 설명해라.
직업 방향을 말할 때는 [고정 직업 성향 판정]과 충돌하지 않게 말해라.

각 항목은 아래 형식으로 써라.
- 수익 방향:
- 사주 근거:
- 왜 돈이 붙는지:
- 시작 방식:
- 주의할 점:
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[카테고리 핵심 분석]
연애운에서는 직업운, 사업운, 돈 버는 방식, 직장형/사업형/부업형 판정을 절대 쓰지 마라.
연애운은 인연운, 감정 패턴, 어울리는 상대, 피해야 할 상대만 다뤄라.

1. 연애운 판정
- 연애운이 있는지, 지금 인연보다 기준을 봐야 하는지, 끌림은 강한데 오래 가는 기준이 따로 있는지 먼저 말해라.

2. 연애에서 반복되는 패턴
왜 비슷한 사람에게 끌리는지, 왜 불안해지는지, 왜 관계가 꼬이는지 사주로 말해라.

3. 어울리는 상대 유형
- 성격:
- 말투:
- 감정 표현:
- 생활 리듬:
- 돈과 일에 대한 태도:
- 왜 맞는지:

4. 피해야 할 상대 유형
처음엔 끌리지만 오래 가면 힘든 상대를 말해라.
부족한 기운을 더 흔드는 상대가 누구인지 말해라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[카테고리 핵심 분석]
결혼운에서는 직업운, 사업운, 돈 버는 방식, 직장형/사업형/부업형 판정을 절대 쓰지 마라.
결혼운은 배우자운, 인연운, 생활 기준, 관계 안정성, 결혼 가능성만 다뤄라.

1. 결혼운 판정
- 이 사람은 결혼운이 있는 편인지 먼저 말해라.
- 빠르게 결혼을 밀어붙이는 게 좋은 사주인지, 늦게 안정되는 결혼운인지 말해라.
- 결혼에서 설렘이 중요한지, 생활 안정과 기준이 더 중요한지 사주 구조로 설명해라.
- 결혼이 늦어진다면 왜 늦어지는지, 결혼이 흔들린다면 어디서 흔들리는지 말해라.

2. 어울리는 배우자 유형
아래 항목을 구체적으로 풀어라.
- 성격:
- 생활 습관:
- 돈 관리 방식:
- 가족관계 태도:
- 감정 표현 방식:
- 책임감:
- 말투와 갈등 해결 방식:
- 왜 이 유형이 사주적으로 맞는지:

3. 피해야 할 결혼 상대
아래 기준으로 말해라.
- 처음에는 끌리지만 결혼 후 힘들어지는 상대:
- 돈 기준이 맞지 않는 상대:
- 가족 경계가 없는 상대:
- 말투나 감정 기복으로 상처를 주는 상대:
- 책임감 없이 감정만 앞서는 상대:
- 왜 이 유형이 사주적으로 안 맞는지:

4. 현재 만나는 사람이 있을 때 결혼까지 가는 조건
상대방 정보가 없으면 "상대방 명식이 없어서 본인 사주 기준으로 보면"이라고 말해라.

- 이 관계가 결혼으로 가려면 먼저 맞춰야 할 기준:
- 돈 문제에서 확인해야 할 것:
- 가족 문제에서 확인해야 할 것:
- 말투와 감정 표현에서 고쳐야 할 것:
- 결혼 전 반드시 확인해야 할 현실 조건:
- 이 부분이 맞춰지면 결혼운이 살아나는 이유:

5. 현재 만나는 사람이 없을 때 들어오기 쉬운 인연
- 앞으로 들어오기 쉬운 인연의 성향:
- 어디서 인연이 들어오기 쉬운지:
- 처음에 끌리는 사람과 실제 맞는 사람이 어떻게 다른지:
- 좋은 인연을 알아보는 신호:
- 피해야 할 인연의 신호:
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
[카테고리 핵심 분석]
궁합풀이에서는 반드시 본인과 상대방을 비교해라.
직업운, 사업형/직장형 판정은 쓰지 마라.
상대방 정보가 부족하면 부족하다고 말하고, 본인 사주 중심으로 관계 패턴을 풀어라.

1. 궁합 결론
끌림이 강한지, 충돌이 강한지, 오래 가려면 무엇을 조심해야 하는지 먼저 말해라.

2. 두 사람 사주 비교
- 일간 비교
- 오행 균형 비교
- 강한 기운과 부족한 기운 비교

3. 끌리는 이유
서로 어떤 기운 때문에 끌리는지 말해라.

4. 부딪히는 이유
말투, 감정 표현, 돈 기준, 생활 리듬, 자존심 중 어디에서 부딪히는지 말해라.

5. 오래 가는 조건
대화 방식, 거리 조절, 돈 문제, 감정 회복 방식, 건드리면 안 되는 부분을 말해라.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `
[카테고리 핵심 분석]
가족관계에서는 직업운을 쓰지 마라.
가족 안의 역할, 책임, 거리감, 서운함, 말투, 기대를 중심으로 풀어라.

1. 관계 결론
이 관계에서 사용자가 떠안는 역할이 큰지, 선을 잡아야 하는지 먼저 말해라.

2. 가족 안에서의 역할
이 사람이 가족 안에서 어떤 역할을 떠안는지 말해라.

3. 반복되는 서운함
왜 같은 문제로 계속 부딪히는지 사주 구조로 말해라.

4. 거리 조절 기준
어디까지 감당하고 어디서 선을 그어야 하는지 말해라.

5. 좋아지는 조건
돈, 책임, 말투, 기대, 거리감 기준으로 풀어라.
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `
[카테고리 핵심 분석]
사업파트너 운에서는 감정 궁합이 아니라 돈, 역할, 책임, 실행력 중심으로 풀어라.
연애 궁합처럼 쓰지 마라.

1. 동업 가능성 결론
같이 돈을 벌 수 있는 구조인지, 사람은 좋아도 돈 기준은 안 맞는지 먼저 말해라.

2. 역할 분담
누가 기획형인지, 실행형인지, 관리형인지, 확장형인지 말해라.

3. 충돌 지점
돈 기준, 책임감, 속도, 결정권, 말투에서 어디가 부딪히는지 말해라.

4. 절대 같이 하면 안 되는 조건
계약 없이 시작, 돈 관리 섞기, 역할 불명확, 감정으로 결정, 손실 기준 없음 같은 위험을 사주 흐름에 맞게 말해라.
`;
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return `
[카테고리 핵심 분석]
12개월운세에서는 반드시 1년 흐름을 나눠라.

1. 올해 전체 결론
달리는 해인지, 정리하는 해인지, 준비하는 해인지 먼저 말해라.

2. 상반기 흐름
돈, 일, 관계, 건강 리듬을 말해라.

3. 하반기 흐름
돈, 일, 관계, 건강 리듬을 말해라.

4. 월별 흐름
각 달마다 아래 형식으로 짧게 말해라.
- 이달의 핵심:
- 돈:
- 일:
- 관계:
- 조심할 것:
- 해보면 좋은 것:
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[카테고리 핵심 분석]
평생종합사주는 유료 리포트 중 가장 깊은 종합 풀이로 작성해라.
절대 짧게 요약하지 마라.
초년운, 청년운, 중년운, 말년운은 각각 충분히 길게 풀어라.
각 시기마다 돈, 일, 관계, 가족, 건강, 인복의 흐름을 함께 봐라.

1. 인생 전체 결론
- 이 사람의 인생이 초반에 강한지, 중년 이후 풀리는지, 말년에 안정되는지 먼저 말해라.
- 인생 전체에서 가장 중요한 키워드 3개를 뽑아라.
- 평생 반복되는 삶의 패턴을 말해라.
- 타고난 복이 어디서 살아나는지 말해라.
- 막히는 지점이 어디인지 말해라.
- 직업 성향을 말할 때는 반드시 [고정 직업 성향 판정]을 따른다.

2. 타고난 사주 구조
- 일간, 월주, 월지, 오행 균형을 바탕으로 타고난 성향을 깊게 설명해라.
- 강한 오행이 삶에서 어떻게 드러나는지 말해라.
- 약한 오행이 삶에서 어떤 빈틈으로 나타나는지 말해라.
- 이 사람이 타고난 장점 3가지를 말해라.
- 이 사람이 반복적으로 흔들리는 약점 3가지를 말해라.
- 겉으로 보이는 모습과 속마음이 다르면 나눠서 설명해라.

3. 초년운
초년운은 어린 시절부터 20대 초중반까지의 흐름으로 풀어라.
아래 내용을 반드시 포함해라.

- 어린 시절 정서 흐름:
- 부모, 가족, 집안 분위기에서 받기 쉬운 영향:
- 어릴 때부터 강하게 발달한 기질:
- 초년에 부족하게 느끼기 쉬운 부분:
- 공부, 적응, 인간관계 흐름:
- 초년기에 생기기 쉬운 상처나 콤플렉스:
- 초년운이 이후 인생에 남기는 영향:
- 초년운을 좋게 쓰는 방법:

단, 부모나 가족을 단정적으로 비난하지 마라.
"그럴 수 있는 흐름"으로 부드럽게 표현해라.

4. 청년운
청년운은 20대 중후반부터 30대 후반까지의 흐름으로 풀어라.
아래 내용을 반드시 포함해라.

- 사회에 나가면서 겪는 시행착오:
- 일과 돈에서 흔들리기 쉬운 지점:
- 연애와 사람관계에서 반복되는 패턴:
- 내가 뭘 해야 할지 몰라 방황하기 쉬운 이유:
- 이 시기에 잡아야 할 기준:
- 청년기에 잘 맞는 도전 방식:
- 청년기에 피해야 할 선택:
- 청년운이 중년운으로 이어지는 방식:

5. 중년운
중년운은 40대 전후부터 50대 후반까지의 흐름으로 풀어라.
가장 중요하게 길게 써라.
아래 내용을 반드시 포함해라.

- 중년부터 풀리는 사주인지, 중년에 한 번 크게 방향을 바꾸는 사주인지:
- 돈과 일에서 안정이 생기는 조건:
- 직업/사업운의 변화:
- [고정 직업 성향 판정]과 연결한 중년 이후 일의 방향:
- 가족, 배우자, 자녀, 책임의 흐름:
- 인간관계가 정리되는 방식:
- 중년에 가장 조심해야 할 선택:
- 중년에 운이 살아나는 신호:
- 중년운을 좋게 쓰는 현실적인 기준:

6. 말년운
말년운은 60대 이후의 흐름으로 풀어라.
불안하게 겁주지 말고, 안정과 정리의 관점으로 말해라.
아래 내용을 반드시 포함해라.

- 말년에 안정되는 사주인지, 계속 움직여야 사는 사주인지:
- 재물의 보존과 생활 안정 흐름:
- 가족과의 거리감:
- 배우자운과 혼자 있는 시간의 흐름:
- 건강운을 볼 때 조심해야 할 생활 패턴:
- 말년에 외로움이 생기는 구조가 있는지:
- 말년운을 좋게 만드는 습관:
- 결국 이 사람이 말년에 가져야 할 삶의 태도:

7. 재물운
- 돈복이 있는 편인지 먼저 말해라.
- 돈이 붙는 시기와 방식:
- 돈이 새는 구조:
- 크게 벌기보다 지켜야 하는 사주인지, 확장해야 하는 사주인지:
- 초년, 청년, 중년, 말년에 재물 흐름이 어떻게 바뀌는지:
- 피해야 할 돈 선택:

8. 직업/사업운
- 반드시 [고정 직업 성향 판정]을 따른다.
- 직장형, 사업형, 부업형, 프리랜서형 중 1순위와 2순위를 그대로 말해라.
- 맞는 직업군 3~5개:
- 피해야 할 직업군/일 구조 3~5개:
- 초년/청년/중년/말년에 일의 방향이 어떻게 바뀌는지:
- 중년 이후 일에서 운이 살아나는 조건:

9. 연애·결혼운
- 연애에서 반복되는 패턴:
- 어울리는 상대 유형:
- 피해야 할 상대 유형:
- 결혼운이 빠른 편인지 늦게 안정되는 편인지:
- 결혼 후 흔들리기 쉬운 지점:
- 중년 이후 배우자운과 관계 안정성:
- 혼자 사는 흐름이 강한지, 함께 살아야 안정되는지:

10. 인복과 귀인운
- 사람복이 있는 편인지 먼저 말해라.
- 어떤 사람이 귀인으로 들어오는지:
- 어떤 사람이 오히려 운을 막는지:
- 초년, 청년, 중년, 말년에 인복이 어떻게 바뀌는지:
- 사람에게 기대도 되는 부분과 기대하면 안 되는 부분:
- 귀인을 알아보는 신호:

11. 가족운
- 가족 안에서 맡기 쉬운 역할:
- 부모와의 흐름:
- 형제자매 또는 가까운 가족과의 흐름:
- 배우자와 자녀가 있다면 그 관계에서 나타나는 책임:
- 가족 때문에 지치지 않으려면 어디서 선을 그어야 하는지:
- 가족운을 좋게 쓰는 기준:

12. 건강운
의학적 진단처럼 말하지 마라.
생활 습관과 사주적 리듬으로만 말해라.

- 강한 오행 때문에 과해지기 쉬운 생활 패턴:
- 약한 오행 때문에 보완해야 할 생활 리듬:
- 스트레스가 몸에 쌓이는 방식:
- 초년/청년/중년/말년에 조심해야 할 생활 습관:
- 건강운을 좋게 쓰는 습관:

13. 피해야 할 삶의 패턴
- 이 사람이 평생 반복하면 운을 깎아먹는 선택을 5개 말해라.
각 항목은 아래 형식으로 써라.
- 피해야 할 패턴:
- 왜 반복되는지:
- 반복하면 생기는 문제:
- 바꿔야 할 기준:

14. 앞으로 1년 방향
- 지금부터 1년 안에 가장 먼저 정리해야 할 것:
- 돈에서 잡아야 할 기준:
- 일에서 잡아야 할 기준:
- 관계에서 잡아야 할 기준:
- 가족과 감정에서 조심할 것:
- 1년 안에 운이 좋아지는 신호:
- 마지막으로 이 사람이 꼭 기억해야 할 한 문장:
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생")) {
    return `
[카테고리 핵심 분석]
인생흐름에서는 반드시 아래 내용을 깊게 풀어라.

1. 인생흐름 결론
지금이 버티는 시기인지, 방향을 바꿔야 하는 시기인지, 늦게 풀리는 구조인지 먼저 말해라.

2. 반복되는 인생 패턴
왜 같은 고민이 반복되는지 말해라.

3. 돈, 일, 관계, 가족, 건강 리듬
각 흐름을 나눠서 말해라.

4. 직장형·사업형·부업형 판정
반드시 [고정 직업 성향 판정]의 1순위와 2순위를 그대로 반영해라.
AI가 새로 판정하지 마라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[카테고리 핵심 분석]
오늘운세에서는 오늘 강하게 작동하는 기운을 중심으로 말해라.

1. 오늘 결론
오늘은 움직여도 되는 날인지, 조심해야 하는 날인지 먼저 말해라.

2. 오늘 강한 기운
3. 오늘 조심해야 할 말과 선택
4. 돈, 일, 관계에서 피해야 할 행동
5. 오늘 해보면 좋은 행동
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[카테고리 핵심 분석]
고민풀이에서는 사용자의 질문을 중심으로 사주 구조에서 왜 이 고민이 반복되는지 풀어라.

1. 고민 결론
이 고민이 선택 문제인지, 사람 문제인지, 돈 문제인지, 기준 문제인지 먼저 말해라.

2. 이 고민의 사주적 원인
3. 지금 하면 안 되는 선택
4. 지금 해보면 좋은 방향
5. 앞으로 3개월/1년 안에 정리해야 할 기준
`;
  }

  return `
[카테고리 핵심 분석]
현재 선택된 ${categoryTitle}에만 집중해라.

1. 이 카테고리의 결론
2. 이 카테고리에서 반복되는 문제
3. 사주적 원인
4. 피해야 할 선택
5. 해보면 좋은 방향
`;
}

function buildThreeMonthGuide(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[앞으로 3개월 상담 흐름]
프리미엄상담 기준으로만 말해라.
사용자의 질문과 직접 연결해서 답해라.

- 이 질문과 관련해서 앞으로 3개월 안에 확인해야 할 변화:
- 움직여도 되는 신호:
- 아직 움직이면 위험한 신호:
- 감정적으로 급하게 결정하면 안 되는 이유:
- 3개월 안에 작게 해볼 수 있는 현실적인 확인:
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[앞으로 3개월 흐름]
결혼운 기준으로만 말해라. 직업운, 사업운, 돈 버는 방식은 쓰지 마라.

- 앞으로 3개월 안에 인연이 움직이는 방식:
- 만나는 사람이 있다면 관계가 깊어질 수 있는 조건:
- 만나는 사람이 있다면 결혼 이야기가 막히는 지점:
- 솔로라면 어떤 성향의 사람을 주의 깊게 봐야 하는지:
- 조급하게 결정하면 안 되는 이유:
- 결혼운이 살아나는 신호:
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[앞으로 3개월 흐름]
연애운 기준으로만 말해라.

- 들어오기 쉬운 인연의 분위기:
- 피해야 할 인연의 신호:
- 관계가 깊어지는 신호:
- 연락과 만남에서 조심할 흐름:
- 감정이 흔들릴 때 잡아야 할 기준:
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
[앞으로 3개월 흐름]
궁합 기준으로만 말해라.

- 두 사람 관계가 가까워지는 조건:
- 말다툼이나 서운함이 커지는 신호:
- 감정 회복을 위해 필요한 태도:
- 가까워질수록 조심해야 할 부분:
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[앞으로 3개월 흐름]
재물운 기준으로만 말해라.

- 돈이 붙는 신호:
- 돈이 새는 신호:
- 조심해야 할 돈 선택:
- 작게 확인해보면 좋은 수익 흐름:
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[앞으로 3개월 흐름]
직업/사업운 기준으로만 말해라.
반드시 [고정 직업 성향 판정]과 충돌하지 않게 말해라.

- 가까운 시기에 건드려보면 좋은 일의 방향:
- 이직/부업/사업/직장 유지 중 조심스럽게 볼 흐름:
- 피해야 할 일 구조:
- 일이 풀리는 신호:
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[앞으로 3개월 흐름]
평생종합사주 기준에서 가까운 3개월 흐름을 말해라.

- 지금 인생 흐름에서 가까운 3개월이 어떤 의미인지:
- 돈, 일, 관계에서 조심해야 할 선택:
- 무리하게 밀어붙이면 안 되는 부분:
- 작게 정리하면 좋은 부분:
- 운이 살아나는 신호:
`;
  }

  return `
[앞으로 3개월 흐름]
선택한 카테고리에 맞는 3개월 흐름만 말해라.
테스트표처럼 쓰지 마라.
1개월차/2개월차/3개월차로 나누지 마라.
`;
}

function buildOneYearGuide(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[앞으로 1년 상담 흐름]
프리미엄상담 기준으로만 말해라.
사용자의 질문과 직접 연결해서 답해라.

- 이 고민이 1년 안에 어떤 방향으로 정리될 가능성이 있는지:
- 돈, 일, 관계, 감정 중 무엇을 먼저 잡아야 하는지:
- 같은 고민을 반복하지 않기 위해 세워야 할 기준:
- 1년 안에 정리해야 할 사람/일/돈/감정의 문제:
- 질문자에게 필요한 현실적인 기준:
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[앞으로 1년 흐름]
결혼운 기준으로만 말해라. 직업운을 쓰지 마라.

- 1년 안에 잡아야 할 배우자 기준:
- 결혼으로 이어질 가능성이 커지는 관계의 특징:
- 반대로 정리해야 할 관계의 특징:
- 가족, 돈, 생활 리듬에서 반드시 확인해야 할 것:
- 1년 안에 결혼운을 좋게 쓰기 위한 방향:
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[앞으로 1년 흐름]
연애운 기준으로만 말해라.

- 1년 안에 인연운이 좋아지는 조건:
- 정리해야 할 관계 패턴:
- 좋은 사람을 알아보는 기준:
- 피해야 할 사람의 반복 신호:
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
[앞으로 1년 흐름]
궁합 기준으로만 말해라.

- 관계가 안정되기 위한 조건:
- 반복 갈등이 생기는 지점:
- 1년 안에 반드시 맞춰야 할 기준:
- 이 관계가 깊어질 수 있는 신호:
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[앞으로 1년 흐름]
재물운 기준으로만 말해라.

- 1년 안에 잡아야 할 돈 기준:
- 피해야 할 큰돈 선택:
- 돈이 남는 구조:
- 재물운이 살아나는 조건:
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[앞으로 1년 흐름]
직업/사업운 기준으로만 말해라.
반드시 [고정 직업 성향 판정]과 충돌하지 않게 말해라.

- 1년 안에 잡아야 할 일의 기준:
- 맞는 직업 방향이 선명해지는 조건:
- 피해야 할 일 구조:
- 확장해야 하는지, 안정시켜야 하는지, 정리해야 하는지:
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[앞으로 1년 흐름]
평생종합사주 기준에서 앞으로 1년의 방향을 말해라.

- 지금부터 1년 안에 가장 먼저 정리해야 할 것:
- 돈에서 잡아야 할 기준:
- 일에서 잡아야 할 기준:
- 관계에서 잡아야 할 기준:
- 가족과 감정에서 조심할 것:
- 1년 안에 운이 좋아지는 신호:
- 이 1년이 중년운/말년운으로 어떻게 이어질 수 있는지:
`;
  }

  return `
[앞으로 1년 흐름]
선택한 카테고리에 맞는 1년 흐름만 말해라.
미래를 보장하지 말고 흐름과 기준으로 말해라.
`;
}

function buildPreviewPrompt(params: {
  user?: UserInfo;
  categoryId?: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
}) {
  const { user, categoryId, categoryTitle, question, manseText } = params;
  const name = getName(user);
  const conclusionGuide = getPreviewConclusionGuide(categoryId, categoryTitle);
  const paidTease = getPreviewPaidTease(categoryId, categoryTitle);

  return `
${buildUserInfoText(user)}

${manseText}

[선택 카테고리]
${categoryTitle}

[사용자 질문]
${question || "없음"}

[무료 리포트 작성 지시]
무료 리포트는 900~1300자로 작성해라.
무료는 "사주 용어 설명"이 아니라 "사용자가 가장 궁금해하는 결론"부터 말해야 한다.
너무 짧게 끝내지 말고, 사용자가 "내 얘기 같다"고 느낄 정도의 근거와 흐름을 조금 더 풀어라.
단, 유료에서 봐야 할 핵심 해결책과 구체적인 직업군/상대유형/월별 상세는 남겨둬라.

${conclusionGuide}

반드시 아래 5개 섹션만 써라.

[먼저 결론부터 말할게]
첫 문장은 반드시 이렇게 시작해라.
"야 ${name}, 먼저 결론부터 말하면"

- 선택 카테고리에서 사용자가 가장 궁금해할 결론을 먼저 말해라.
- 프리미엄상담이면 사용자의 질문을 먼저 받고, 질문의 핵심 고민에 직접 답해라.
- 재물운이면 돈복이 있는지 먼저 말해라.
- 직업/사업운이면 [고정 직업 성향 판정]의 1순위/2순위를 기준으로 말해라.
- 연애운이면 연애운이 있는지, 어떤 사람과 맞는지 큰 방향을 먼저 말해라.
- 결혼운이면 결혼운이 있는지, 빠른 결혼인지 늦게 안정되는지 먼저 말해라.
- 평생종합사주면 인생 전체가 초반형인지 중후반형인지, 어느 시기에 풀리는지 큰 방향을 먼저 말해라.
- 결혼운에서는 직업운, 직장형/사업형/부업형 판정을 쓰지 마라.
- 궁합이면 끌림과 충돌 중 무엇이 강한지 먼저 말해라.

[사주명리학으로 보면]
- [본인 만세력]의 일간, 월주, 월지, 오행 흐름을 짧게 말해라.
- 월주와 월지를 헷갈리지 마라.
- 월주는 두 글자 전체이고, 월지는 월주의 두 번째 글자다.
- "월지는 병축"이라고 쓰면 안 된다.
- 오행 숫자는 제공된 것만 써라.
- 이 섹션은 결론을 뒷받침하는 근거로만 짧게 써라.

[지금 이 운에서 보이는 흐름]
- 선택 카테고리 기준으로 지금 어떤 흐름이 강하게 보이는지 말해라.
- 프리미엄상담이면 질문자의 고민이 왜 생겼는지, 표면 질문과 속마음 질문을 가볍게 나눠라.
- 재물운이면 돈이 붙는 방식과 새는 흐름을 가볍게 말해라.
- 직업/사업운이면 일하는 방식과 흔들리는 지점을 가볍게 말해라.
- 연애운이면 끌리는 사람과 오래 가는 사람의 차이를 가볍게 말해라.
- 결혼운이면 결혼에서 중요한 기준과 흔들리는 지점을 가볍게 말해라.
- 궁합이면 끌림과 충돌의 흐름을 가볍게 말해라.
- 평생종합사주면 초년/청년/중년/말년 중 어느 흐름이 특히 중요한지 맛보기로 말해라.
- 단, 유료에서 다룰 구체적인 해결책은 여기서 다 풀지 마라.

[지금 반복되는 문제]
- 왜 막히는지 짧게 팩폭해라.
- 해결책을 자세히 쓰지 마라.
- 이 흐름은 고칠 수 있다는 희망을 한 줄 넣어라.

[전체 리포트에서 이어지는 내용]
${paidTease}

[금지]
- 선택 카테고리와 무관한 내용을 쓰지 마라.
- 운영자나 이전 대화에서 나온 직업, 사업, 부업, 아이디어를 넣지 마라.
- 무료에서 핵심 답을 다 공개하지 마라.
`;
}

function buildFullPrompt(params: {
  user?: UserInfo;
  categoryId?: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
}) {
  const { user, categoryId, categoryTitle, question, manseText } = params;
  const name = getName(user);
  const categorySections = getFullCategorySections(categoryId, categoryTitle);
  const threeMonthGuide = buildThreeMonthGuide(categoryId, categoryTitle);
  const oneYearGuide = buildOneYearGuide(categoryId, categoryTitle);

  return `
${buildUserInfoText(user)}

${manseText}

[선택 카테고리]
${categoryTitle}

[사용자 질문]
${question || "없음"}

[유료 전체 리포트 작성 지시]
유료 리포트는 3500~6000자 정도로 작성해라.
단, 평생종합사주는 6000~9000자 수준으로 훨씬 더 깊고 길게 작성해라.
단, 프리미엄상담은 4500~7500자 수준으로 사용자의 질문을 중심으로 깊게 작성해라.
첫 섹션은 반드시 [결론부터 말할게]로 시작해라.
사주 설명보다 사용자가 돈 내고 보고 싶은 답을 먼저 줘라.
선택 카테고리와 무관한 내용을 쓰지 마라.

[프리미엄상담 특별 지시]
- 선택 카테고리가 프리미엄상담이면, 사용자의 질문이 리포트의 중심이다.
- 질문을 무시하고 일반적인 사주풀이로 빠지지 마라.
- 첫 결론에서 반드시 사용자의 질문에 직접 답해라.
- 질문이 "이걸 해도 될까?"라면 "조건부로 가능하다", "아직은 이르다", "정리하는 게 낫다"처럼 방향을 분명히 말해라.
- 질문이 "나한테 맞을까?"라면 "맞는 부분과 안 맞는 부분"을 나눠서 말해라.
- 질문이 "왜 이렇게 힘들까?"라면 "반복되는 사주적 패턴"과 "지금 끊어야 할 선택"을 말해라.
- 질문이 애매하면, AI가 질문의 숨은 의도를 먼저 정리한 뒤 답해라.
- 애매한 위로로 끝내지 말고, 현실적인 판단 기준을 줘라.

[절대 금지]
- 운영자와 이전에 나눈 직업 고민, 사업 아이디어, 부업 아이디어, 앱 제작 내용, 대화 예시를 절대 반영하지 마라.
- 개발자가 예시로 든 직업군을 사용자에게 추천하지 마라.
- 특정 직업군을 미리 정해놓고 끼워 맞추지 마라.
- 오직 [본인 만세력], [상대방 만세력], 현재 사용자 입력, 선택 카테고리만 근거로 써라.
- 결혼운/연애운/궁합/가족관계에서는 직업운 챕터를 쓰지 마라.

반드시 아래 구조로 작성해라.

[결론부터 말할게]
- ${name}의 ${categoryTitle}에서 가장 중요한 결론을 먼저 말해라.
- 프리미엄상담이면 사용자의 질문에 먼저 직접 답해라. "결론부터 말하면 이 선택은 ○○하다"처럼 회피하지 말고 말해라.
- 직업운이면 [고정 직업 성향 판정]의 1순위/2순위를 그대로 말해라.
- 재물운이면 "돈복은 ○○한 편이고, 돈은 ○○ 방식에서 붙고, ○○에서 샌다"처럼 바로 말해라.
- 연애운이면 "너는 ○○한 사람과 맞고, ○○한 사람은 피해야 한다"처럼 바로 말해라.
- 결혼운이면 "결혼운은 ○○한 편이고, ○○한 배우자와 맞고, ○○한 관계는 피해야 한다"처럼 바로 말해라.
- 평생종합사주면 "초년에는 ○○, 청년기에는 ○○, 중년부터 ○○, 말년에는 ○○ 흐름이다"처럼 시기별 큰 결론을 먼저 말해라.
- 궁합이면 "끌림은 있는데 ○○에서 부딪힌다"처럼 바로 말해라.
- 추상적으로 말하지 마라.

[사주명리학 근거]
첫 문장은 이렇게 시작해라.
"야 ${name}, 사주명리학으로 보면 네 구조는 이렇게 잡혀 있어."

- 일간, 월주, 월지, 오행 균형, 강한 기운, 부족한 기운을 설명해라.
- 월주와 월지를 헷갈리지 마라.
- 월주는 두 글자 전체이고, 월지는 월주의 두 번째 글자다.
- "월지는 병축"이라고 쓰면 안 된다.
- 오행 숫자는 제공된 것만 써라.
- 길게 강의하지 말고 결론을 받쳐주는 근거만 말해라.
- 결혼운/연애운/궁합에서는 직업 성향을 언급하지 마라.
- 프리미엄상담에서는 질문과 연결되는 사주 근거만 우선적으로 말해라.

${categorySections}

[피해야 할 방향]
- 이 카테고리에서 특히 피해야 할 선택을 3~5개 말해라.
- 각 항목마다 왜 안 맞는지 사주 근거와 현실 결과를 같이 말해라.
- 프리미엄상담이면 사용자의 질문과 직접 연결해서 피해야 할 선택을 말해라.
- 결혼운이면 피해야 할 결혼 상대와 생활 구조를 말해라.
- 연애운이면 피해야 할 상대 유형을 말해라.
- 궁합/가족/파트너면 관계에서 피해야 할 말, 돈, 역할 구조를 말해라.
- 직업운이면 [고정 직업 성향 판정]의 피해야 할 방식과 연결해라.
- 평생종합사주면 평생 반복하면 운을 깎아먹는 삶의 패턴을 말해라.

${threeMonthGuide}

${oneYearGuide}

[형이 딱 정리해줄게]
마지막은 5~7줄로 끝내라.
- 너는 ○○ 흐름이다.
- 맞는 방향은 ○○이다.
- 피해야 할 건 ○○이다.
- 앞으로 3개월은 ○○을 조심해라.
- 1년 안에는 ○○ 기준을 잡아야 한다.
- 이 방향이면 운이 다시 살아날 수 있다.
`;
}

function fallbackPreview(categoryTitle: string, user?: UserInfo) {
  const name = getName(user);

  return `[먼저 결론부터 말할게]

야 ${name}, 먼저 결론부터 말하면 지금 ${categoryTitle}은 좋다 나쁘다로만 끊을 흐름은 아니야.

네가 어떤 기준으로 선택하느냐에 따라 살아날 수 있는 운이 있고, 반대로 같은 패턴을 반복하면 계속 막힐 수 있는 운이 같이 있어.

[사주명리학으로 보면]

지금은 AI 사주 분석이 잠깐 막혀서 자세한 일간, 월주, 오행 풀이를 깊게 하긴 어려워.

다만 사주는 단순히 운이 있다 없다가 아니라, 그 운을 어떤 방식으로 쓰느냐가 중요해.

[지금 이 운에서 보이는 흐름]

${categoryTitle}에서는 지금 겉으로 보이는 결과보다 네가 반복해서 선택하는 기준이 더 중요해.

같은 상황이 반복된다면 운이 없는 게 아니라, 맞는 방향과 안 맞는 방향이 아직 정리되지 않았을 수 있어.

[지금 반복되는 문제]

문제는 운이 없어서가 아니라, 맞는 방향과 안 맞는 방향을 구분하지 못한 채 버티는 데서 생길 수 있어.

이 흐름은 충분히 바꿀 수 있어.

[전체 리포트에서 이어지는 내용]

여기서 끊기면 지금 반복되는 문제의 핵심을 놓칠 수 있어.

전체 리포트에서는 네 사주 구조를 기준으로 ${categoryTitle}에서 맞는 방향, 피해야 할 선택, 앞으로 3개월과 1년 흐름까지 이어서 본다.`;
}

function fallbackFull(categoryTitle: string, user?: UserInfo) {
  const name = getName(user);

  return `[결론부터 말할게]

${name}, 지금 ${categoryTitle}에서 중요한 건 좋은 말 많이 듣는 게 아니라, 맞는 방향과 피해야 할 방향을 가르는 거야.

현재 AI 분석이 잠깐 막혀서 상세 만세력 기반 리포트는 제한됐지만, 전체 리포트 구조는 이렇게 봐야 해.

[사주명리학 근거]

사주는 일간, 월주, 월지, 오행 균형, 강한 기운과 부족한 기운을 먼저 봐야 해.

그 다음 그 기운이 돈, 일, 연애, 관계에서 어떻게 드러나는지 현실 언어로 번역해야 한다.

[카테고리 핵심 분석]

${categoryTitle}은 단순히 운이 좋다 나쁘다로 끝낼 수 없어.

이 카테고리에서 네가 반복하는 패턴, 강하게 쓰는 기운, 부족해서 흔들리는 기운을 같이 봐야 해.

[피해야 할 방향]

1. 남들이 좋다는 이유만으로 따라가는 선택.

2. 불안해서 급하게 결정하는 선택.

3. 이미 아닌 걸 알면서 계속 끌고 가는 선택.

4. 돈, 감정, 관계를 한꺼번에 섞는 선택.

[앞으로 3개월 흐름]

앞으로 3개월은 무리하게 판을 키우는 것보다, 네가 어디서 흔들리는지 먼저 보는 흐름이야.

[앞으로 1년 흐름]

1년 안에는 기준을 잡아야 해.

돈이면 돈 기준, 일이면 일하는 방식, 관계면 사람 보는 기준을 정리해야 운이 살아난다.

[형이 딱 정리해줄게]

너는 지금 방향을 다시 잡아야 하는 흐름이야.

피해야 할 건 불안해서 급하게 선택하는 거야.

앞으로 3개월은 흐름을 확인하고, 1년 안에는 기준을 잡아야 해.

이 방향이면 운은 다시 살아날 수 있어.`;
}

async function generateText(prompt: string, maxTokens: number) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.25,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

function getFullMaxTokens(categoryId: CategoryId) {
  if (categoryId === "traditional") return 11000;
  if (categoryId === "premium") return 8500;
  return 6500;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FortuneRequest;

    const mode = body.mode || "preview";
    const user = body.user || {};
    const categoryId = body.categoryId || "today";
    const categoryTitle = getCategoryTitle(categoryId, body.categoryTitle);
    const question = safeText(body.question || user.question, "");

    const myManse = calculateManse(user);

    const partnerManse = hasPartnerBirthInfo(user)
      ? calculateManse({
          year: user.partnerYear,
          month: user.partnerMonth,
          day: user.partnerDay,
          calendar: user.partnerCalendar,
          birthTime: user.partnerBirthTime,
          gender: user.partnerGender,
        })
      : null;

    const myManseText = formatManseForPrompt(myManse);
    const careerArchetypeText = getCareerArchetypeGuide(myManse);

    const partnerManseText = partnerManse
      ? formatManseForPrompt(partnerManse)
      : "상대방 만세력 정보: 상대방 생년월일 또는 출생 정보가 부족합니다.";

    const careerBlock = shouldUseCareerArchetype(categoryId)
      ? careerArchetypeText
      : `[고정 직업 성향 판정]
이 카테고리에서는 직업 성향 판정을 사용하지 않는다.
직업운, 사업운, 직장형/사업형/부업형 판정, 직업군 추천을 쓰지 마라.`;

    const manseText = `
[본인 만세력]
${myManseText}

${careerBlock}

[상대방 만세력]
${partnerManseText}
`;

    if (!process.env.OPENAI_API_KEY) {
      if (mode === "full") {
        const full = fallbackFull(categoryTitle, user);

        return NextResponse.json({
          preview: "",
          full,
          result: full,
          manse: myManse,
          partnerManse,
          careerArchetype: shouldUseCareerArchetype(categoryId)
            ? careerArchetypeText
            : "",
          warning: "OPENAI_API_KEY가 없어 fallback 전체 리포트를 반환했습니다.",
        });
      }

      if (mode === "both") {
        const preview = fallbackPreview(categoryTitle, user);
        const full = fallbackFull(categoryTitle, user);

        return NextResponse.json({
          preview,
          full,
          result: full,
          manse: myManse,
          partnerManse,
          careerArchetype: shouldUseCareerArchetype(categoryId)
            ? careerArchetypeText
            : "",
          warning: "OPENAI_API_KEY가 없어 fallback 리포트를 반환했습니다.",
        });
      }

      const preview = fallbackPreview(categoryTitle, user);

      return NextResponse.json({
        preview,
        full: "",
        result: preview,
        manse: myManse,
        partnerManse,
        careerArchetype: shouldUseCareerArchetype(categoryId)
          ? careerArchetypeText
          : "",
        warning: "OPENAI_API_KEY가 없어 fallback 무료 리포트를 반환했습니다.",
      });
    }

    if (mode === "preview") {
      let preview = "";

      try {
        preview = await generateText(
          buildPreviewPrompt({
            user,
            categoryId,
            categoryTitle,
            question,
            manseText,
          }),
          1800
        );
      } catch (error) {
        console.error("preview generation error:", error);
        preview = fallbackPreview(categoryTitle, user);
      }

      return NextResponse.json({
        preview: preview || fallbackPreview(categoryTitle, user),
        full: "",
        result: preview || fallbackPreview(categoryTitle, user),
        manse: myManse,
        partnerManse,
        careerArchetype: shouldUseCareerArchetype(categoryId)
          ? careerArchetypeText
          : "",
      });
    }

    if (mode === "full") {
      let full = "";

      try {
        full = await generateText(
          buildFullPrompt({
            user,
            categoryId,
            categoryTitle,
            question,
            manseText,
          }),
          getFullMaxTokens(categoryId)
        );
      } catch (error) {
        console.error("full generation error:", error);
        full = fallbackFull(categoryTitle, user);
      }

      return NextResponse.json({
        preview: "",
        full: full || fallbackFull(categoryTitle, user),
        result: full || fallbackFull(categoryTitle, user),
        manse: myManse,
        partnerManse,
        careerArchetype: shouldUseCareerArchetype(categoryId)
          ? careerArchetypeText
          : "",
      });
    }

    let preview = "";
    let full = "";

    try {
      preview = await generateText(
        buildPreviewPrompt({
          user,
          categoryId,
          categoryTitle,
          question,
          manseText,
        }),
        1800
      );
    } catch (error) {
      console.error("preview generation error:", error);
      preview = fallbackPreview(categoryTitle, user);
    }

    try {
      full = await generateText(
        buildFullPrompt({
          user,
          categoryId,
          categoryTitle,
          question,
          manseText,
        }),
        getFullMaxTokens(categoryId)
      );
    } catch (error) {
      console.error("full generation error:", error);
      full = fallbackFull(categoryTitle, user);
    }

    return NextResponse.json({
      preview: preview || fallbackPreview(categoryTitle, user),
      full: full || fallbackFull(categoryTitle, user),
      result: full || fallbackFull(categoryTitle, user),
      manse: myManse,
      partnerManse,
      careerArchetype: shouldUseCareerArchetype(categoryId)
        ? careerArchetypeText
        : "",
    });
  } catch (error) {
    console.error("fortune route error:", error);

    return NextResponse.json(
      {
        preview: fallbackPreview("운세풀이"),
        full: "",
        result: fallbackPreview("운세풀이"),
        error: "AI 운세 생성 중 문제가 발생했습니다.",
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "soreum saju route is working",
    model: MODEL,
  });
}