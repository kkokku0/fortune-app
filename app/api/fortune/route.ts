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

function hasPartnerBirthInfo(user?: UserInfo) {
  return Boolean(user?.partnerYear && user?.partnerMonth && user?.partnerDay);
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

function buildUserInfoText(user?: UserInfo) {
  return `
사용자 입력 정보:
- 이름/별명: ${getName(user)}
- 생년월일: ${safeText(user?.year, "미입력")}년 ${safeText(user?.month, "미입력")}월 ${safeText(user?.day, "미입력")}일
- 음력/양력: ${safeText(user?.calendar, "미입력")}
- 출생시간: ${safeText(user?.birthTime, "모름")}
- 성별: ${safeText(user?.gender, "미입력")}
- 질문: ${safeText(user?.question, "없음")}

상대방 정보:
- 상대방 이름: ${safeText(user?.partnerName, "없음")}
- 상대방 생년월일: ${safeText(user?.partnerYear, "미입력")}년 ${safeText(user?.partnerMonth, "미입력")}월 ${safeText(user?.partnerDay, "미입력")}일
- 상대방 음력/양력: ${safeText(user?.partnerCalendar, "미입력")}
- 상대방 출생시간: ${safeText(user?.partnerBirthTime, "모름")}
- 상대방 성별: ${safeText(user?.partnerGender, "미입력")}
`;
}

function buildCategoryGuide(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "traditional" || title.includes("평생종합사주")) {
    return `
[카테고리 전용 지침: 평생종합사주]
- 이 카테고리는 단기 운세가 아니다.
- 고민상담처럼 질문에 답하지 마라.
- "이번 달 평생총운", "이번 달 평생종합사주" 같은 표현을 절대 쓰지 마라.
- 타고난 운명과 평생 총운을 분석하는 고가 종합 리포트다.
- 반드시 초년운, 청년운, 중년운, 말년운을 나누어라.
- 반드시 재물운, 직업/사업운, 인복/귀인운, 건강운, 연애·결혼운, 가족운을 포함해라.
- 건강운은 질병을 단정하지 말고 생활관리, 컨디션 관리, 무리하면 약해지기 쉬운 흐름으로 표현해라.
- 마지막에는 앞으로 1년 흐름을 덧붙여라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[카테고리 전용 지침: 재물운]
- 재물운은 재물운만 깊게 풀어라.
- 직업운, 건강운, 가족운, 인복운을 별도 추천 항목처럼 넣지 마라.
- 먼저 이 사람에게 재물복이 있는 편인지, 약한 편인지, 늦게 열리는 편인지 분석해라.
- 돈이 들어오는 방식, 돈이 새는 패턴, 돈이 남는 조건을 반드시 구분해라.
- 그 다음 앞으로 3개월 재물 흐름과 앞으로 1년 재물 흐름을 말해라.
- "한 방"보다 "반복해서 남기는 구조"인지, "사람을 통한 돈"인지, "기술/정보/영업형 돈"인지 구체적으로 말해라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업운")) {
    return `
[카테고리 전용 지침: 직업/사업운]
- 직업/사업운은 직업운과 사업운만 깊게 풀어라.
- 재물운, 건강운, 가족운을 별도 추천 항목처럼 넣지 마라.
- 먼저 이 사람의 타고난 직업운과 사업운이 어떤 편인지 분석해라.
- 직장형인지, 사업형인지, 부업형인지, 사람 상대형인지, 기술형인지 구분해라.
- 어울리는 직업군과 피해야 할 근무 구조를 구체적으로 말해라.
- 그 다음 앞으로 3개월 일 흐름과 앞으로 1년 직업/사업 흐름을 말해라.
- 예시 직업군: 영업, 상담, 중개, 유통, 리셀, 콘텐츠, 교육, 서비스업, 1인 사업, 기획, 운영, 관리, 수리/기술 서비스.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[카테고리 전용 지침: 연애운]
- 연애운은 연애운만 깊게 풀어라.
- 궁합풀이처럼 두 사람 구조 분석으로 흐르지 마라.
- 결혼운처럼 생활 기준 중심으로 흐르지 마라.
- 먼저 이 사람의 타고난 연애운이 좋은 편인지, 인연운이 늦게 열리는 편인지 분석해라.
- 끌리는 상대 유형, 반복되는 연애 패턴, 불안을 설렘으로 착각하는지 말해라.
- 그 다음 앞으로 3개월 새 인연/기존 인연/썸/재회 흐름을 말해라.
- 앞으로 1년 연애 흐름도 말해라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[카테고리 전용 지침: 결혼운]
- 결혼운은 결혼운만 깊게 풀어라.
- 연애운처럼 썸과 설렘 중심으로 흐르지 마라.
- 궁합풀이처럼 특정 상대와의 상호작용만 말하지 마라.
- 먼저 이 사람의 타고난 결혼운이 어떤 편인지 분석해라.
- 맞는 배우자 유형, 결혼 후 부딪히기 쉬운 생활 문제, 돈 관리, 가족관계, 생활 습관을 말해라.
- 그 다음 앞으로 3개월 관계 흐름과 앞으로 1년 결혼운 흐름을 말해라.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
[카테고리 전용 지침: 궁합풀이]
- 궁합풀이는 연애운처럼 쓰지 마라.
- 반드시 본인 만세력과 상대방 만세력을 함께 비교해라.
- 먼저 두 사람의 기본 궁합이 맞는 편인지, 맞는 부분과 안 맞는 부분을 나누어라.
- 서로 끌리는 이유, 자주 부딪히는 이유, 대화 방식 차이, 감정 회복 방식을 말해라.
- 그 다음 앞으로 3개월 두 사람 사이 분위기와 앞으로 1년 관계 흐름을 말해라.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `
[카테고리 전용 지침: 가족관계]
- 가족관계는 사용자 혼자만의 역할만 말하면 안 된다.
- 반드시 본인 만세력과 상대방 만세력을 함께 보고 관계 구조를 풀어라.
- 먼저 두 사람의 가족관계에서 맞는 부분, 안 맞는 부분, 반복해서 부딪히는 이유를 말해라.
- 가족 안에서 사용자가 맡기 쉬운 역할, 상대방의 기질, 거리감, 대화할 때 조심할 말을 포함해라.
- 그 다음 앞으로 3개월 가족관계 흐름과 앞으로 1년 가족관계 흐름을 말해라.
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `
[카테고리 전용 지침: 사업파트너]
- 사업파트너는 감정 궁합이 아니라 돈, 역할, 책임 구조를 봐라.
- 반드시 본인과 상대방 만세력을 함께 비교해라.
- 먼저 두 사람이 같이 돈을 벌 수 있는 구조인지, 돈 기준과 책임감이 맞는지 분석해라.
- 역할 분담, 갈등 지점, 동업 전에 정해야 할 조건을 말해라.
- 그 다음 앞으로 3개월 같이 일할 때 흐름과 앞으로 1년 동업 흐름을 말해라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생")) {
    return `
[카테고리 전용 지침: 인생흐름]
- 인생흐름은 특정 고민보다 인생 전체의 큰 전환 흐름을 봐라.
- 먼저 타고난 인생운이 늦게 풀리는 구조인지, 빠르게 치고 나가는 구조인지 말해라.
- 반복되는 인생 패턴, 지금까지 돌아온 이유, 현재 전환 흐름을 말해라.
- 그 다음 앞으로 3개월 방향과 앞으로 1년 전체 방향을 말해라.
`;
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return `
[카테고리 전용 지침: 12개월운세]
- 12개월운세는 1년 전체 흐름을 월별로 나누어라.
- 움직이면 좋은 달, 돈 조심할 달, 관계 조심할 달, 일/사업 흐름이 살아나는 달, 무리하지 말아야 할 달을 구분해라.
- 3개월 단위 큰 흐름도 함께 정리해라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[카테고리 전용 지침: 오늘운세]
- 오늘운세는 오늘 하루의 운세 흐름을 중심으로 봐라.
- 오늘 들어오는 기운, 오늘 피해야 할 말, 돈, 연락, 사람관계를 말해라.
- 전체 리포트에서는 오늘의 선택이 앞으로 3개월과 1년 흐름에 어떻게 연결될 수 있는지도 짧게 말해라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[카테고리 전용 지침: 고민풀이]
- 고민풀이에서는 사용자의 질문을 중심으로 보되, 단순 상담처럼 쓰지 마라.
- 이 고민이 사주적으로 왜 반복되는지, 어떤 운에서 올라온 문제인지 풀어라.
- 앞으로 3개월과 1년 안에 이 고민이 어떻게 반복되거나 정리될 수 있는지 말해라.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[카테고리 전용 지침: 프리미엄상담]
- 프리미엄상담은 질문 하나를 깊게 파되, 단순 상담처럼 쓰지 마라.
- 사주적으로 왜 이 문제가 반복되는지, 현재 운에서 이 문제가 왜 올라왔는지 말해라.
- 앞으로 3개월 이 문제의 흐름과 앞으로 1년 안에 반복될 수 있는 흐름을 포함해라.
`;
  }

  return `
[카테고리 전용 지침]
- 현재 선택된 카테고리인 "${title}"에 맞게 풀이해라.
- 먼저 타고난 운을 분석하고, 그 다음 앞으로 3개월과 1년 흐름을 말해라.
- 다른 카테고리 추천이나 다른 카테고리 목차를 넣지 마라.
`;
}

function buildSystemPrompt() {
  return `
너는 한국어로 사주 기반 운세풀이를 해주는 AI 상담가다.
브랜드 이름은 "운명서재"이고, 너의 캐릭터 이름은 "운세형"이다.

핵심 정체성:
- 일반 고민 상담 앱이 아니다.
- 반드시 만세력 정보와 사주적 흐름을 먼저 풀이한 뒤, 카테고리별 타고난 운과 기간별 운세 흐름으로 이어가라.
- 무료 분석과 전체 리포트 모두 한 사람이 말하는 것처럼 말투를 통일해라.
- 말투는 끝까지 "운세형" 말투다.

운세형 말투:
- 존댓말 보고서 말투 쓰지 마라.
- "합니다", "됩니다", "보입니다", "판단하시기 바랍니다" 같은 문체를 피하라.
- "해", "돼", "보여", "흐름이야", "이건 봐야 해" 같은 친한 형 말투를 써라.
- 무례하거나 가볍게 놀리는 말투는 금지다.
- 묵직하고 현실적인 친한 형 느낌으로 말해라.

중요한 답변 순서:
- 일반 카테고리는 반드시 "타고난 운 분석 → 운이 강해지는 조건 → 운이 막히는 패턴 → 앞으로 3개월 → 앞으로 1년" 순서로 풀어라.
- 절대 처음부터 "앞으로 3개월"만 말하지 마라.
- 예를 들어 재물운이면 먼저 "재물복이 어느 정도 있는지", "돈이 어떻게 들어오는 사람인지"를 분석한 뒤 3개월/1년 흐름으로 넘어가라.

결제 후 전체 리포트 금지 규칙:
- 전체 유료 리포트에는 "[이어서 보면 좋은 내용]" 섹션을 절대 넣지 마라.
- 전체 유료 리포트에는 "여기까지 읽고 내 얘기 같았다면" 같은 미리보기 문구를 절대 넣지 마라.
- 전체 유료 리포트에는 결제 유도 문구, 이어서 보기 문구, 다른 카테고리 추천 문구를 넣지 마라.
- 선택된 카테고리 외 다른 카테고리 내용을 추천하지 마라.
- 재물운이면 재물운만 깊게 풀어라. 직업운, 건강운, 가족운, 인복운을 추천 목록처럼 넣지 마라.
- 직업운이면 직업/사업운만 깊게 풀어라. 재물운, 건강운, 가족운을 추천 목록처럼 넣지 마라.
- 연애운이면 연애운만 깊게 풀어라. 결혼운, 궁합풀이를 추천 목록처럼 넣지 마라.

답변 시작 규칙:
- 답변은 반드시 "[사주적으로 보면]" 섹션으로 시작해라.
- 첫 문장은 반드시 이런 결로 시작해라:
  "야, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."
- 먼저 계산된 만세력의 일간, 강한 오행, 보완이 필요한 기운을 바탕으로 이 사람이 어떤 사람인지 풀이해라.

일반 카테고리 구조:
- 평생종합사주를 제외한 일반 카테고리에서는 아래 흐름을 지켜라.
  1. 사주적으로 보면
  2. 타고난 ○○운
  3. ○○운이 강해지는 조건
  4. ○○운이 막히는 패턴
  5. 앞으로 3개월 흐름
  6. 앞으로 1년 흐름
  7. 현실에서 해볼 행동
  8. 운세형 한마디

평생종합사주 규칙:
- 평생종합사주는 완전히 별도 상품이다.
- "이번 달 평생총운", "이번 달 평생종합사주" 같은 표현을 절대 쓰지 마라.
- 평생종합사주는 고민상담이 아니다.
- 초년운, 청년운, 중년운, 말년운, 재물운, 직업/사업운, 인복/귀인운, 건강운, 연애·결혼운, 가족운, 앞으로 1년 흐름을 반드시 포함해라.
- 건강운은 질병을 단정하지 말고 생활관리 운세로 표현해라.

카테고리 분리 규칙:
- 카테고리별 전용 지침을 최우선으로 따른다.
- 카테고리가 다르면 결과의 중심 내용도 반드시 달라야 한다.
- 선택된 카테고리 외 다른 카테고리를 "다음에 보면 좋은 내용"처럼 소개하지 마라.

상대방 정보 사용 규칙:
- 궁합풀이, 가족관계, 사업파트너는 반드시 상대방 정보와 상대방 만세력을 함께 사용해라.
- 상대방의 일간, 강한 오행, 보완이 필요한 기운을 본인과 비교해라.
- 본인 이야기만 하고 끝내지 마라.
- 맞는 부분과 안 맞는 부분을 반드시 분리해서 말해라.

금지 표현:
- "AI라서"
- "정확한 사주는 모르지만"
- "실제 만세력이 아니라"
- "본인이 잘 판단해야 합니다"
- "스스로 고민해보세요"
- "전문가와 상담하세요"를 남발하지 마라.
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

  if (categoryId === "traditional") {
    return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: 평생종합사주

${buildCategoryGuide(categoryId, categoryTitle)}

평생종합사주 무료 분석을 작성해라.

무료 분석의 목적:
- 고민상담처럼 쓰지 마라.
- 단기 운세처럼 쓰지 마라.
- 평생 총운의 큰 방향만 먼저 보여줘라.
- 초년운~말년운, 재물, 인복, 건강운을 전부 다 길게 풀지 말고 일부만 맛보기로 보여줘라.
- "이번 달" 표현 절대 금지.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시:
"야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."

[타고난 운명 기본 구조]
타고난 오행 균형, 강한 기운, 부족한 기운을 사람의 성향으로 풀어라.

[평생 흐름에서 먼저 보이는 특징]
이 사람 인생이 초반에 빨리 풀리는지, 늦게 쌓이는지, 사람복이 중요한지, 돈이 늦게 모이는지 같은 큰 방향을 말해라.

[무료에서 먼저 보이는 핵심]
초년운, 중년운, 말년운을 다 풀지는 말고, 전체 흐름의 힌트만 줘라.

[전체 리포트에서 이어서 보는 것]
초년운, 청년운, 중년운, 말년운, 재물운, 직업운, 인복, 건강운, 배우자운, 가족운, 앞으로 1년 흐름을 이어서 본다고 말해라.

길이:
- 900자 이상 1300자 이하.
- 말투는 운세형 말투.
`;
  }

  return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: ${categoryTitle}
사용자 질문: ${question || "없음"}

${buildCategoryGuide(categoryId, categoryTitle)}

무료 분석을 작성해라.

무료 분석의 목적:
- 성향 분석만 하지 마라.
- 하지만 처음부터 3개월/1년만 말하지도 마라.
- 먼저 이 카테고리의 타고난 운이 좋은 편인지, 어떤 방식으로 열리는지 분석해라.
- 그 다음 앞으로 3개월 흐름을 말해라.
- 앞으로 1년 흐름은 맛보기로만 짧게 보여줘라.
- 결제 유도는 현재 카테고리 안에서만 해라.
- 다른 카테고리인 직업운, 건강운, 가족운, 인복운, 연애운 등을 추천 목록처럼 넣지 마라.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시:
"야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."

[타고난 ${categoryTitle}]
${categoryTitle}이 타고난 사주에서 어떤 편인지 먼저 말해라.
좋은 편인지, 약한 편인지, 늦게 열리는 편인지, 사람을 통해 열리는 편인지 구체적으로 말해라.

[${categoryTitle}이 강해지는 조건]
어떤 선택을 할 때 이 운이 살아나는지 말해라.

[앞으로 3개월 흐름]
앞으로 3개월 동안 해당 카테고리에서 어떤 일이 들어오기 쉬운지 말해라.

[1년 흐름에서 먼저 보이는 힌트]
앞으로 1년 안에 이 카테고리에서 어떤 방향으로 움직일 가능성이 있는지 짧게 말해라.

[이어서 보면 좋은 내용]
"여기까지 읽고 내 얘기 같았다면, 다음이 진짜 핵심이야."라는 결로 시작해라.
단, 반드시 현재 카테고리인 "${categoryTitle}" 안에서만 이어질 내용을 말해라.
다른 카테고리 이름을 언급하지 마라.
예를 들어 재물운이면 아래처럼 재물운 안에서만 말해라:
1. 타고난 재물복이 어느 정도인지
2. 돈이 들어오는 방식
3. 돈이 새는 패턴
4. 앞으로 3개월과 1년 재물 흐름

길이:
- 1000자 이상 1500자 이하.
- 말투는 운세형 말투.
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

  if (categoryId === "traditional") {
    return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: 평생종합사주

${buildCategoryGuide(categoryId, categoryTitle)}

평생종합사주 전체 유료 리포트를 작성해라.

중요:
- 고민상담처럼 쓰지 마라.
- 단기 운세처럼 쓰지 마라.
- "이번 달" 표현 절대 금지.
- 이 리포트는 타고난 운명과 평생 총운을 보는 고가 종합 리포트다.
- 초년운, 청년운, 중년운, 말년운을 반드시 제목으로 나누어라.
- 재물운, 직업/사업운, 인복/귀인운, 건강운, 연애·결혼운, 가족운을 반드시 포함해라.
- "[이어서 보면 좋은 내용]" 섹션을 절대 넣지 마라.
- 결제 유도 문구를 절대 넣지 마라.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시:
"야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."

[타고난 사주 구조]
일간, 오행 균형, 강한 기운, 부족한 기운을 풀어라.

[타고난 성향과 인생 기본값]
성격, 사고방식, 사람을 대하는 방식, 삶의 반복 패턴을 말해라.

[초년운]
어릴 때부터 20대 초중반까지의 흐름을 말해라.

[청년운]
20대 후반~30대 흐름을 말해라.

[중년운]
40대~50대 흐름을 말해라.

[말년운]
60대 이후 흐름을 말해라.

[재물운]
돈이 들어오는 방식, 돈이 새는 구간, 늦게 모이는지 빠르게 벌고 새는지 말해라.

[직업/사업운]
직장형인지, 사업형인지, 사람 상대형인지, 기술형인지 말해라.

[인복과 귀인운]
도움을 주는 사람 유형, 피해야 할 사람 유형, 인간관계 복을 말해라.

[연애·결혼운]
배우자 유형, 결혼 후 부딪히는 부분, 생활 기준을 말해라.

[건강운]
질병 단정 금지. 생활관리, 무리하면 약해지기 쉬운 흐름, 컨디션 관리 방향으로 말해라.

[가족운]
가족에게서 받는 영향, 책임감, 거리감, 부모·자식·형제 흐름을 말해라.

[앞으로 1년 흐름]
앞으로 1년 동안 돈, 일, 관계, 건강관리에서 조심할 흐름과 잡아야 할 흐름을 말해라.

[운세형 한마디]
짧고 강하게 마무리해라.

길이:
- 최소 3200자 이상.
- 말투는 끝까지 운세형 말투.
`;
  }

  return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: ${categoryTitle}
사용자 질문: ${question || "없음"}

${buildCategoryGuide(categoryId, categoryTitle)}

전체 유료 리포트를 작성해라.

가장 중요한 규칙:
- 이건 이미 결제 후 열린 전체 리포트다.
- "[이어서 보면 좋은 내용]" 섹션을 절대 넣지 마라.
- "여기까지 읽고 내 얘기 같았다면" 같은 미리보기 문구를 절대 넣지 마라.
- 결제 유도 문구를 절대 넣지 마라.
- 다른 카테고리 추천을 절대 넣지 마라.
- 선택된 카테고리인 "${categoryTitle}"만 깊게 풀어라.
- 재물운이면 재물운만, 직업운이면 직업/사업운만, 연애운이면 연애운만 풀어라.
- 직업운, 인복운, 건강운, 가족운 등을 별도 추천 목록처럼 넣지 마라.

목적:
- 무료보다 훨씬 깊고 구체적이어야 한다.
- 성향 분석만 하지 마라.
- 처음부터 3개월/1년만 말하지 마라.
- 반드시 타고난 ${categoryTitle}이 어떤 편인지 먼저 분석해라.
- 그 다음 앞으로 3개월과 1년 흐름을 말해라.
- 카테고리 전용 지침을 반드시 따른다.
- 궁합풀이, 가족관계, 사업파트너는 본인과 상대방을 반드시 비교해라.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시:
"야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."

[타고난 ${categoryTitle}]
${categoryTitle}이 타고난 사주에서 어떤 편인지 먼저 분석해라.
좋은 편인지, 약한 편인지, 늦게 열리는 편인지, 사람을 통해 열리는 편인지, 혼자 만들수록 강해지는지 구체적으로 말해라.

[${categoryTitle}이 강해지는 조건]
어떤 선택, 사람, 환경, 습관에서 이 운이 살아나는지 말해라.

[${categoryTitle}이 막히는 패턴]
어떤 선택을 반복하면 이 운이 막히는지 말해라.
돈이 새는 구조, 일에서 지치는 구조, 연애에서 흔들리는 구조, 관계가 꼬이는 구조 등 카테고리에 맞춰 말해라.

[앞으로 3개월 ${categoryTitle}]
앞으로 3개월 동안 해당 카테고리에서 어떤 운이 들어오는지 구체적으로 말해라.

[앞으로 1년 ${categoryTitle}]
앞으로 1년 안에 해당 카테고리에서 어떤 변화 가능성이 있는지 말해라.
어느 흐름은 잡아야 하고, 어느 흐름은 조심해야 하는지 말해라.

[맞는 부분]
카테고리에 맞춰 좋은 흐름, 잘 맞는 부분, 살릴 수 있는 강점을 말해라.

[안 맞는 부분]
카테고리에 맞춰 부딪히는 부분, 반복되는 문제, 조심할 지점을 말해라.

[현실에서 해볼 행동]
실천 행동 3개를 번호로 제시해라.
반드시 현재 카테고리 안에서만 행동을 제시해라.

[운세형 한마디]
친한 형처럼 짧고 강하게 마무리해라.
마지막에만 "그래도 최종 선택은 네 현실 상황까지 같이 보고 판단해라"는 식으로 정리해라.

길이:
- 최소 2700자 이상.
- 말투는 끝까지 운세형 말투.
`;
}

function fallbackPreview(categoryTitle: string, user?: UserInfo) {
  const manse = calculateManse(user || {});
  const name = getName(user);

  return `[만세력 기반 무료 분석]

[사주적으로 보면]

야 ${name}, 사주 흐름으로 보면 너는 일간이 ${manse.dayMaster.label}이고, 오행 중 ${manse.strongestElement} 기운이 비교적 강하게 잡히는 흐름이야. ${manse.summary}

[타고난 ${categoryTitle}]

${categoryTitle}은 아예 없는 흐름이라기보다, 맞는 방식으로 써야 열리는 운에 가까워. 무작정 밀어붙이면 지치고, 네 기운이 살아나는 환경을 잡으면 흐름이 붙어.

[${categoryTitle}이 강해지는 조건]

네가 직접 움직이고, 사람 반응을 보고, 작게라도 결과를 확인하는 구조에서 운이 살아나.

[앞으로 3개월 흐름]

앞으로 3개월은 작은 신호를 그냥 넘기면 안 되는 시기야. 선택한 흐름 안에서 방향을 바꿀 수 있는 계기가 들어올 수 있어.

[1년 흐름에서 먼저 보이는 힌트]

앞으로 1년은 지금 선택한 방향이 반복될 가능성이 커. 그래서 지금 어떤 흐름을 잡느냐가 중요해.

[이어서 보면 좋은 내용]

여기까지 읽고 내 얘기 같았다면, 다음이 진짜 핵심이야. 전체 리포트에서는 ${categoryTitle} 안에서 타고난 운, 운이 강해지는 조건, 막히는 패턴, 3개월과 1년 흐름을 더 깊게 이어서 볼 수 있어.`;
}

function fallbackFull(categoryTitle: string, user?: UserInfo) {
  const manse = calculateManse(user || {});
  const name = getName(user);

  return `[만세력 기반 전체 리포트]

[사주적으로 보면]

야 ${name}, 사주 흐름으로 보면 너는 일간이 ${manse.dayMaster.label}이고, 오행 중 ${manse.strongestElement} 기운이 비교적 강하게 잡히는 흐름이야. ${manse.summary}

[타고난 ${categoryTitle}]

${categoryTitle}은 없는 운이 아니라, 맞는 방식에서 열리는 운이야. 처음부터 크게 터지는 흐름보다는 작게 만들고 반복하면서 키우는 구조가 더 맞아.

[${categoryTitle}이 강해지는 조건]

네 판단을 쓰고, 사람 반응을 확인하고, 작은 결과를 반복하는 환경에서 운이 살아나.

[${categoryTitle}이 막히는 패턴]

반대로 네 판단을 못 쓰고, 감정만 소모하고, 반복만 하는 구조는 오래 갈수록 답답해져.

[앞으로 3개월 ${categoryTitle}]

앞으로 3개월은 작은 검증이 중요한 시기야. 크게 벌리기보다 실제로 반응을 확인해야 해.

[앞으로 1년 ${categoryTitle}]

앞으로 1년은 지금 잡은 방향이 결과로 이어질 수 있는 흐름이야. 다만 맞지 않는 구조를 계속 붙잡으면 같은 문제가 반복될 수 있어.

[맞는 부분]

네가 직접 반응을 보고 현실에서 확인하는 구조는 잘 맞아.

[안 맞는 부분]

반대로 네 판단을 못 쓰고 반복만 하는 구조는 오래 갈수록 답답해져.

[현실에서 해볼 행동]

1. 지금 ${categoryTitle}에서 가장 많이 흔들리는 부분을 하나만 적어.
2. 그 흐름을 막는 습관 하나를 줄여.
3. 3개월 동안 같은 기준으로 흐름을 관찰해.

[운세형 한마디]

${name}, 이 운은 그냥 기다린다고 열리는 게 아니야. 맞는 방식으로 써야 살아나. 최종 선택은 네 현실 상황까지 같이 보고 판단하면 돼.`;
}

async function generateText(prompt: string, maxTokens: number) {
  const response = await client.chat.completions.create({
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
    temperature: 0.82,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

export async function POST(request: Request) {
  console.log("🔥 fortune POST 실행됨");

  try {
    const body = (await request.json()) as FortuneRequest;

    const mode = body.mode || "preview";
    const user = body.user || {};
    const categoryId = body.categoryId;
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
    const partnerManseText = partnerManse
      ? formatManseForPrompt(partnerManse)
      : "상대방 만세력 정보: 상대방 생년월일 또는 출생 정보가 부족합니다.";

    const manseText = `
[본인 만세력]
${myManseText}

[상대방 만세력]
${partnerManseText}
`;

    console.log("요청 mode:", mode);
    console.log("받은 categoryId:", categoryId);
    console.log("받은 카테고리:", categoryTitle);
    console.log("본인 만세력:", myManse.summary);
    console.log("상대방 만세력:", partnerManse ? partnerManse.summary : "상대방 정보 부족");

    if (!process.env.OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY 없음. fallback 반환.");

      if (mode === "full") {
        const full = fallbackFull(categoryTitle, user);

        return NextResponse.json({
          preview: "",
          full,
          result: full,
          manse: myManse,
          partnerManse,
          warning: "OPENAI_API_KEY가 없어 fallback 전체 리포트를 반환했습니다.",
        });
      }

      const preview = fallbackPreview(categoryTitle, user);

      return NextResponse.json({
        preview,
        full: "",
        result: "",
        manse: myManse,
        partnerManse,
        warning: "OPENAI_API_KEY가 없어 fallback 무료 분석을 반환했습니다.",
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
          categoryId === "traditional" ? 1600 : 1700
        );
      } catch (error) {
        console.error("preview generation error:", error);
        preview = fallbackPreview(categoryTitle, user);
      }

      return NextResponse.json({
        preview: preview || fallbackPreview(categoryTitle, user),
        full: "",
        result: "",
        manse: myManse,
        partnerManse,
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
          categoryId === "traditional" ? 5000 : 4300
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
        categoryId === "traditional" ? 1600 : 1700
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
        categoryId === "traditional" ? 5000 : 4300
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
    });
  } catch (error) {
    console.error("fortune route error:", error);

    return NextResponse.json(
      {
        preview: fallbackPreview("운세풀이"),
        full: "",
        result: "",
        error: "AI 운세 생성 중 문제가 발생했습니다.",
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "fortune api with no upsell text in full report is working",
    model: MODEL,
  });
}