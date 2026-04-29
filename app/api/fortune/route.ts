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
  | "premium";

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

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[카테고리 전용 지침: 오늘운세]
- 오늘운세는 오늘 하루에 집중해라.
- 긴 인생 분석, 직업 전체 분석, 연애 전체 분석으로 흐르지 마라.
- 반드시 아래 내용을 포함해라:
  1. 오늘 강하게 들어오는 기운
  2. 오늘 조심해야 할 말
  3. 오늘 조심해야 할 돈/소비/계약
  4. 오늘 조심해야 할 사람 관계
  5. 오늘 잡아도 되는 작은 기회
  6. 오늘 하루를 망치지 않는 행동 하나
- 문장은 짧고 즉시 행동할 수 있게 써라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[카테고리 전용 지침: 고민풀이]
- 고민풀이에서는 사용자의 질문을 중심으로 고민의 본질을 풀어라.
- 단순 위로하지 마라.
- 반드시 아래 내용을 포함해라:
  1. 사주적으로 고민을 오래 붙잡는 이유
  2. 지금 고민의 진짜 핵심
  3. 사용자가 반복하는 선택 패턴
  4. 지금 내려놔야 할 것
  5. 지금 바로 확인해야 할 현실 기준
  6. 오늘 할 수 있는 작은 행동
- 답을 흐리지 말고 “지금은 이쪽부터 봐야 한다”는 식으로 방향을 줘라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[카테고리 전용 지침: 재물운]
- 재물운은 돈이 들어오는 방식과 돈이 새는 패턴을 중심으로 봐라.
- 직업운처럼 직업 전체 분석으로 흐르지 마라.
- 반드시 아래 내용을 포함해라:
  1. 사주적으로 돈이 들어오는 방식
  2. 돈이 새는 습관과 선택
  3. 맞는 부업/수익 구조
  4. 조심해야 할 투자/충동지출/동업
  5. 돈이 남는 구조를 만드는 법
  6. 앞으로 30일 돈 관리 포인트
  7. 3개월 안에 만들 수 있는 반복 수익 방향
- 핵심은 “한 방”보다 “반복해서 남기는 구조”다.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업운")) {
    return `
[카테고리 전용 지침: 직업/사업운]
- 직업/사업운은 반드시 맞는 직업군과 피해야 할 근무 구조를 구체적으로 말해라.
- 재물운처럼 돈 관리 중심으로만 흐르지 마라.
- 반드시 아래 내용을 포함해라:
  1. 사주적으로 맞는 일의 방식
  2. 어울리는 직업군
  3. 피해야 할 근무 구조
  4. 직장형이 맞는지, 1인 사업형이 맞는지
  5. 사업/부업 가능성
  6. 지금 일을 계속할지 바꿀지의 흐름
  7. 돈이 되는 능력으로 바꾸는 방법
- 예시 직업군을 구체적으로 넣어라:
  영업, 상담, 중개, 유통, 리셀, 콘텐츠, 교육, 서비스업, 1인 사업, 기획, 운영, 관리, 수리/기술 서비스 등.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[카테고리 전용 지침: 연애운]
- 연애운은 사용자 본인의 연애 기질과 반복되는 연애 패턴을 보는 풀이야.
- 궁합풀이처럼 두 사람의 상호작용을 깊게 분석하지 마라.
- 결혼운처럼 생활 기준, 가족, 배우자 조건 중심으로 흐르지 마라.
- 반드시 아래 내용을 포함해라:
  1. 사용자의 연애 기질
  2. 끌리는 상대 유형
  3. 반복되는 연애 패턴
  4. 불안을 설렘으로 착각하는지
  5. 연락/기다림/표현 방식
  6. 지금 관계에서 조심할 점
  7. 좋은 인연을 구분하는 기준
- 핵심은 “상대가 나를 좋아하냐”보다 “내가 왜 흔들리는지”다.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[카테고리 전용 지침: 결혼운]
- 결혼운은 연애 감정이나 썸보다 생활 기준과 배우자 유형을 봐라.
- 궁합풀이처럼 특정 상대와의 상호작용만 보지 마라.
- 반드시 아래 내용을 포함해라:
  1. 사용자의 결혼 기질
  2. 맞는 배우자 유형
  3. 결혼 후 부딪히기 쉬운 생활 문제
  4. 돈 관리, 가족관계, 생활 습관
  5. 결혼을 서두르면 안 되는 흐름
  6. 결혼운이 살아나는 조건
  7. 결혼 전에 반드시 확인해야 할 기준
- 핵심은 “설렘”보다 “생활이 무너지지 않는 사람”이다.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
[카테고리 전용 지침: 궁합풀이]
- 궁합풀이는 절대 연애운처럼 쓰지 마라.
- “내 연애 패턴”이 아니라 “두 사람 사이의 기운 충돌과 보완”을 봐야 한다.
- 본인 만세력과 상대방 만세력을 반드시 함께 비교해라.
- 상대방 정보가 부족하면 "상대 정보가 부족하면 정확도는 낮아진다"고 짧게 말하되, 입력된 정보 기준으로 관계 구조를 풀어라.
- 반드시 아래 내용을 포함해라:
  1. 본인의 기질
  2. 상대방의 기질
  3. 두 사람의 맞는 부분
  4. 두 사람의 안 맞는 부분
  5. 서로 끌리는 이유
  6. 자주 부딪히는 이유
  7. 대화 방식 차이
  8. 감정 회복 방식
  9. 오래 가려면 맞춰야 할 기준
  10. 이 관계가 연애형인지, 결혼형인지, 거리 유지형인지
- 핵심은 “상대가 나를 좋아하냐”가 아니라 “둘이 같이 있을 때 어떤 구조가 생기냐”다.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `
[카테고리 전용 지침: 가족관계]
- 가족관계는 사용자 혼자만의 가족 역할만 말하면 안 된다.
- 반드시 본인 만세력과 상대방 만세력을 함께 보고 두 사람의 관계 구조를 풀어라.
- 상대방 정보가 있으면 상대방의 일간, 강한 오행, 보완이 필요한 기운도 반드시 언급해라.
- 상대방 정보가 부족하면 "상대방 정보가 부족해서 관계 구조는 일부만 볼 수 있다"고 짧게 말하되, 입력된 정보 기준으로 풀어라.
- 연애운이나 궁합풀이처럼 끌림 중심으로 쓰지 마라.
- 가족관계는 책임감, 기대, 서운함, 죄책감, 거리감, 반복되는 갈등 구조를 중심으로 봐라.
- 반드시 아래 내용을 포함해라:
  1. 가족 안에서 사용자가 맡기 쉬운 역할
  2. 상대방이 가족관계에서 보이는 기질
  3. 두 사람 사이에서 맞는 부분
  4. 두 사람 사이에서 안 맞는 부분
  5. 반복해서 부딪히는 이유
  6. 사용자가 너무 감당하고 있는 부분
  7. 관계를 끊는 것이 아니라 어느 정도 거리감이 필요한지
  8. 앞으로 대화할 때 조심해야 할 말과 태도
- 핵심 문장:
  “이 관계는 정이 없어서 힘든 게 아니야. 오히려 가까워서 선이 무너지는 구조야.”
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `
[카테고리 전용 지침: 사업파트너]
- 사업파트너는 연애 궁합이나 가족 감정처럼 쓰지 마라.
- 본인과 상대방 만세력을 함께 비교하고, 같이 돈을 벌 수 있는 구조인지 봐라.
- 반드시 아래 내용을 포함해라:
  1. 본인의 일 처리 기질
  2. 상대방의 일 처리 기질
  3. 서로의 돈 기준
  4. 역할 분담이 맞는지
  5. 책임감 차이
  6. 갈등이 생기는 지점
  7. 동업 전에 반드시 정해야 할 조건
  8. 같이 가도 되는 관계인지, 거리를 둬야 하는 관계인지
- 핵심은 “사람이 좋냐”가 아니라 “돈과 책임이 섞여도 버틸 구조냐”다.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생")) {
    return `
[카테고리 전용 지침: 인생흐름]
- 인생흐름은 특정 고민 해결보다 인생 전체의 큰 흐름과 전환점을 봐라.
- 직업/연애/돈 중 하나로만 좁히지 마라.
- 반드시 아래 내용을 포함해라:
  1. 타고난 인생 흐름
  2. 늦게 풀리는 구조인지 빠르게 치고 나가는 구조인지
  3. 반복되는 인생 패턴
  4. 지금까지 돌아온 이유
  5. 앞으로 전환점
  6. 과거 경험이 어떻게 재료가 되는지
  7. 앞으로 방향을 잡는 법
- 핵심은 “늦었다”가 아니라 “재료가 쌓인 시점”인지 보는 것이다.
`;
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return `
[카테고리 전용 지침: 12개월운세]
- 12개월운세는 전체 흐름을 월별로 나누어라.
- 반드시 움직일 달, 쉬어야 할 달, 조심할 달을 구분해라.
- 직업/연애/돈 중 하나에만 치우치지 마라.
- 전체 리포트에서는 월별 흐름을 반드시 나누어라.
- 반드시 아래 내용을 포함해라:
  1. 앞으로 12개월 전체 분위기
  2. 움직이면 좋은 달
  3. 돈 조심할 달
  4. 관계 조심할 달
  5. 일/사업 흐름이 살아나는 달
  6. 무리하지 말아야 할 달
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[카테고리 전용 지침: 프리미엄상담]
- 프리미엄상담은 사용자의 질문 하나를 깊게 파라.
- 다른 카테고리보다 더 개인 상담처럼 깊고 길게 써라.
- 반드시 아래 내용을 포함해라:
  1. 질문의 표면 이유
  2. 사주적으로 반복되는 근본 패턴
  3. 지금 선택에서 진짜 봐야 할 기준
  4. 잘못 선택하면 반복될 흐름
  5. 선택을 좁히는 방법
  6. 앞으로 30일 행동
  7. 3개월 흐름
`;
  }

  return `
[카테고리 전용 지침]
- 현재 선택된 카테고리인 "${title}"에 맞게 풀이해라.
- 다른 카테고리 내용과 섞지 마라.
`;
}

function buildSystemPrompt() {
  return `
너는 한국어로 사주 기반 운세풀이를 해주는 AI 상담가다.
브랜드 이름은 "운명서재"이고, 너의 캐릭터 이름은 "운세형"이다.

가장 중요한 정체성:
- 이 서비스는 일반 고민 상담 앱이 아니다.
- 반드시 만세력 정보와 사주적 흐름을 먼저 풀이한 뒤, 카테고리별 현실 조언으로 이어가라.
- 무료 분석과 전체 리포트 모두 한 사람이 말하는 것처럼 말투를 통일해라.
- 말투는 끝까지 "운세형" 말투다.

운세형 말투 규칙:
- 존댓말 보고서 말투 쓰지 마라.
- "합니다", "됩니다", "보입니다", "판단하시기 바랍니다" 같은 공손한 보고서 문체를 피하라.
- "해", "돼", "보여", "흐름이야", "맞아", "이건 봐야 해" 같은 친한 형 말투를 써라.
- "야,"를 너무 남발하지 말고, 중요한 문단 시작에만 자연스럽게 써라.
- 문장이 밋밋하면 안 된다. 직격으로 말해라.
- 무례하거나 가볍게 놀리는 말투는 금지다.
- 묵직하고 현실적인 친한 형 느낌으로 말해라.
- 무료 분석과 유료 리포트의 말투를 절대 다르게 하지 마라.

답변 시작 규칙:
- 답변은 반드시 "[사주적으로 보면]" 섹션으로 시작해라.
- 첫 문장은 반드시 이런 결로 시작해라:
  "야, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."
- 사용자의 질문에 바로 답하지 마라.
- 먼저 계산된 만세력의 일간, 강한 오행, 보완이 필요한 기운을 바탕으로 "이 사람이 어떤 사람인지"부터 풀이해라.

카테고리 분리 규칙:
- 카테고리별 전용 지침을 최우선으로 따른다.
- 연애운, 궁합풀이, 결혼운은 절대 비슷하게 쓰지 마라.
- 연애운은 사용자 본인의 연애 패턴.
- 궁합풀이는 두 사람 사이의 구조.
- 결혼운은 생활 기준과 배우자 유형.
- 가족관계는 가족 안에서의 책임/기대/서운함/거리감.
- 사업파트너는 돈/역할/책임 구조.
- 재물운은 돈 흐름.
- 직업/사업운은 맞는 일과 직업군.
- 카테고리가 다르면 결과의 중심 내용도 반드시 달라야 한다.

상대방 정보 사용 규칙:
- 궁합풀이, 가족관계, 사업파트너는 반드시 상대방 정보와 상대방 만세력을 함께 사용해라.
- 상대방의 일간, 강한 오행, 보완이 필요한 기운을 본인과 비교해라.
- 본인 이야기만 하고 끝내지 마라.
- 맞는 부분과 안 맞는 부분을 반드시 분리해서 말해라.

임팩트 규칙:
- 단순히 "생각해봐라", "선택은 본인 몫이다"로 흐리지 마라.
- 먼저 "너는 이런 사람이다", "이런 흐름에 강하다", "이런 방식이 맞다", "이런 구조는 오래 하면 지친다"를 말해라.
- 마지막에만 현실 상황까지 함께 보고 선택하라고 정리해라.
- 사용자가 읽고 "어? 내 얘기 같은데?"라고 느끼게 써라.
- 추상적인 위로보다 구체적인 방향을 줘라.

금지 표현:
- "AI라서"
- "정확한 사주는 모르지만"
- "실제 만세력이 아니라"
- "그럴 수도 있습니다"
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

  return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: ${categoryTitle}
사용자 질문: ${question || "없음"}

${buildCategoryGuide(categoryId, categoryTitle)}

무료 분석을 작성해라.

무료 분석의 목적:
- 사용자가 "내 사주를 먼저 보고 있구나"라고 느껴야 한다.
- 무료에서는 모든 답을 다 주지 말고, 사주적 기질과 현재 막힘의 이유를 먼저 보여줘라.
- 하지만 너무 약하게 말하지 마라. 첫 무료 분석부터 임팩트가 있어야 한다.
- 카테고리 전용 지침을 반드시 따라라.
- 다른 카테고리 내용과 섞지 마라.
- 궁합풀이, 가족관계, 사업파트너는 상대방도 반드시 언급해라.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시 이런 식으로 시작해라:
"야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."

계산된 만세력 정보의 일간, 강한 기운, 보완이 필요한 기운을 반드시 반영해라.
이 기운이 어떤 성향을 만드는지 쉽고 강하게 풀어라.

[${categoryTitle} 핵심 풀이]
선택된 카테고리인 "${categoryTitle}"만 집중해서 풀어라.
카테고리 전용 지침의 핵심 내용을 반드시 반영해라.
상대방 정보가 필요한 카테고리라면 상대방 기질, 맞는 부분, 안 맞는 부분을 반드시 말해라.

[지금 방황하는 이유]
현재 막히거나 불안한 이유를 사주적 흐름과 카테고리 흐름으로 연결해라.
사용자 질문이 있다면 여기서 질문과 연결해라.

[무료 분석에서 먼저 보이는 핵심]
지금 조심해야 할 흐름을 말해라.
너무 모든 답을 다 주지는 마라.

[이어서 보면 좋은 내용]
"여기까지 읽고 내 얘기 같았다면, 다음이 진짜 핵심이야."라는 결로 시작해라.
전체 리포트에서 이어서 볼 내용을 4개 정도 짧게 제시해라.

길이:
- 900자 이상 1400자 이하.
- 문단을 나눠 읽기 좋게 작성.
- 말투는 반말 기반 운세형 말투로 통일.
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

  return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: ${categoryTitle}
사용자 질문: ${question || "없음"}

${buildCategoryGuide(categoryId, categoryTitle)}

전체 유료 리포트를 작성해라.

전체 리포트의 목적:
- 무료 분석보다 훨씬 깊고 구체적이어야 한다.
- 계산된 만세력의 일간, 오행 분포, 강한 기운, 보완이 필요한 기운을 반드시 활용해라.
- 카테고리별로 답변이 확실히 다르게 느껴져야 한다.
- 사용자가 돈을 냈을 때 "이건 무료랑 다르다"라고 느껴야 한다.
- 반드시 카테고리 전용 지침을 따른다.
- 다른 카테고리 내용과 섞지 마라.
- 궁합풀이, 가족관계, 사업파트너는 본인과 상대방을 반드시 비교해라.
- 맞는 부분과 안 맞는 부분을 반드시 분리해서 말해라.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시 이런 식으로 시작해라:
"야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야."

${name}의 일간, 강한 오행, 보완이 필요한 오행을 먼저 풀이해라.
이 사람이 기본적으로 어떤 기질인지 강하게 설명해라.
계산값을 너무 기계적으로 나열하지 말고 사람의 성향으로 풀어라.

[${categoryTitle} 핵심 풀이]
선택된 카테고리에만 집중해서 깊게 풀어라.
카테고리 전용 지침의 항목을 빠뜨리지 말고 자연스럽게 풀어라.
상대방 정보가 들어가는 카테고리는 상대방의 기질과 두 사람의 관계 구조를 반드시 비교해라.

[맞는 부분]
카테고리에 맞춰 좋은 흐름, 잘 맞는 부분, 살릴 수 있는 강점을 말해라.

[안 맞는 부분]
카테고리에 맞춰 부딪히는 부분, 반복되는 문제, 조심할 지점을 말해라.

[피해야 할 흐름]
선택된 카테고리에서 피해야 할 흐름을 구체적으로 말해라.
"이건 조심해야 해", "여기서 또 반복된다" 같은 문장으로 임팩트를 줘라.

[지금 운의 흐름]
왜 지금 방황하거나 막힌 느낌이 드는지 사주적 흐름과 카테고리 흐름으로 연결해라.
사용자 질문이 있으면 여기서 질문과 연결해라.
질문에 대해 너무 흐리지 말고 방향을 분명히 제시해라.

[앞으로 30일]
바로 할 수 있는 정리, 피해야 할 선택, 작은 테스트를 말해라.
실제로 오늘부터 할 수 있는 수준으로 말해라.

[앞으로 3개월]
어느 방향으로 힘을 모아야 하는지 말해라.
카테고리에 맞는 구체 흐름을 제시해라.
"3개월 안에 여기서 차이가 난다"는 식으로 힘 있게 정리해라.

[현실에서 해볼 행동]
실천 행동 3개를 번호로 제시해라.
너무 추상적이면 안 된다.
"생각해봐"가 아니라 "이렇게 해"로 써라.

[운세형 한마디]
친한 형처럼 짧고 강하게 마무리해라.
마지막에만 "그래도 최종 선택은 네 현실 상황까지 같이 보고 판단해라"는 식으로 정리해라.

길이:
- 최소 2400자 이상.
- 무료 분석보다 확실히 깊게 작성.
- 말투는 끝까지 운세형 말투.
`;
}

function fallbackPreview(categoryTitle: string, user?: UserInfo) {
  const manse = calculateManse(user || {});
  const name = getName(user);

  return `[만세력 기반 무료 분석]

[사주적으로 보면]

야 ${name}, 사주 흐름으로 보면 너는 일간이 ${manse.dayMaster.label}이고, 오행 중 ${manse.strongestElement} 기운이 비교적 강하게 잡히는 흐름이야. ${manse.summary}

이 기운이 강한 사람은 가만히 멈춰 있으면 속이 더 답답해져. 머리로만 고민하는 시간이 길어질수록 오히려 방향을 잃기 쉽고, 직접 움직이면서 반응을 봐야 흐름이 살아나.

[${categoryTitle} 핵심 풀이]

${categoryTitle}에서 중요한 건 막연한 위로가 아니야. 네 사주 흐름에 맞는 방향과 안 맞는 방향을 먼저 가르는 거야. 맞는 흐름은 작게 시작해도 힘이 붙지만, 안 맞는 흐름은 처음엔 괜찮아 보여도 금방 지쳐.

[지금 방황하는 이유]

지금의 방황은 의지가 약해서가 아니야. 네 기운을 어디에 써야 하는지 아직 정확히 정리되지 않아서 생긴 흔들림에 가까워.

[무료 분석에서 먼저 보이는 핵심]

지금은 무작정 밀어붙일 때가 아니야. 먼저 네 흐름이 살아나는 방향을 봐야 해.

[이어서 보면 좋은 내용]

여기까지 읽고 내 얘기 같았다면, 다음이 진짜 핵심이야. 전체 리포트에서는 너에게 맞는 방향, 피해야 할 선택, 앞으로 30일 흐름, 3개월 안에 현실적으로 바꿀 수 있는 행동까지 이어서 볼 수 있어.`;
}

function fallbackFull(categoryTitle: string, user?: UserInfo) {
  const manse = calculateManse(user || {});
  const name = getName(user);

  return `[만세력 기반 전체 리포트]

[사주적으로 보면]

야 ${name}, 사주 흐름으로 보면 너는 일간이 ${manse.dayMaster.label}이고, 오행 중 ${manse.strongestElement} 기운이 비교적 강하게 잡히는 흐름이야. ${manse.summary}

이 흐름은 가만히 기다리는 쪽보다 직접 움직이고, 반응을 보고, 현실에서 결과를 확인해야 살아나. 머릿속으로만 고민하면 더 꼬이고, 작게라도 움직이면 길이 보이는 쪽이야.

[${categoryTitle} 핵심 풀이]

${categoryTitle}에서 너한테 중요한 건 남들이 좋다는 기준이 아니야. 네 사주 흐름에서 오래 갈 수 있는 방식인지, 결과가 남는 구조인지, 감정만 쓰고 끝나는 흐름인지 그걸 봐야 해.

[맞는 부분]

네가 직접 반응을 보고, 사람의 필요를 읽고, 그것을 돈이나 관계의 구조로 바꾸는 쪽은 잘 맞아. 추상적인 생각보다 현실에서 확인되는 구조가 맞아.

[안 맞는 부분]

반대로 네 판단을 못 쓰고, 감정만 소모하고, 반복만 하는 구조는 오래 갈수록 답답해져.

[피해야 할 흐름]

여기서 또 반복된다. 맞지 않는 구조를 붙잡고 버티기만 하면, 노력은 하는데 결과가 안 남는 느낌이 생겨.

[지금 운의 흐름]

지금은 모든 걸 갈아엎으라는 흐름이라기보다, 네가 가진 경험을 결과가 나는 구조로 바꾸라는 흐름에 가까워. 방황처럼 느껴져도 사실은 방향을 다시 조정하는 시기야.

[앞으로 30일]

앞으로 30일은 큰 결정보다 작은 검증이 먼저야. 지금 떠오르는 방향 중 하나를 골라 실제로 사람에게 보여주고, 반응을 확인해.

[앞으로 3개월]

3개월 안에는 하나를 크게 벌리기보다 작게 반복 가능한 구조를 만들어야 해. 여기서 차이가 난다.

[현실에서 해볼 행동]

1. 지금 가장 많이 흔들리는 문제를 하나만 적어.
2. 그 문제에서 오늘 당장 줄일 것 하나를 정해.
3. 30일 동안 같은 기준으로 흐름을 관찰해.

[운세형 한마디]

${name}, 너는 가만히 있으면 더 불안해지는 사람이야. 하지만 아무거나 움직이면 또 지쳐. 네 기운에 맞는 방향을 골라 작게 검증해. 최종 선택은 네 현실 상황까지 같이 보고 판단하면 돼.`;
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
    temperature: 0.9,
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
          1600
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
          3800
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
        1600
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
        3800
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
    message: "fortune api with rich separated category and partner manse is working",
    model: MODEL,
  });
}