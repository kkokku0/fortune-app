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
  | "health"
  | "children"
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

type Grade = "상" | "중상" | "중" | "중하" | "하";

type SajuProfile = {
  type: string;
  core: string;
  risk: string;
  direction: string;
  avoid: string[];
  action: string[];
};

type TenGodKey =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

type TenGodCountsLike = Partial<Record<TenGodKey, number>>;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ROUTE_VERSION = "soreum-route-v14-children-dedicated-full-report-no-shrink";
const RELATIONSHIP_LOGIC = "family-partner-compatibility-saju-risk-final";
const YEARLY_LOGIC = "newyear-career-money-jobchange-health-final";
const PROFILE_LOGIC = "category-profile-specific-risk-direction-v2";
const PREVIEW_LOGIC = "preview-1200-1700-plus-v2";
const CHILDREN_LOGIC = "children-dedicated-report-jasik-janyeo-v2";
const NL = String.fromCharCode(10);

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function getName(user?: UserInfo) {
  return safeText(user?.name, "너");
}

function gradeSentence(target: string, grade: Grade) {
  return `${target}은 '${grade}'으로 본다.`;
}

function getCategoryTitle(categoryId?: CategoryId, categoryTitle?: string) {
  if (categoryTitle) {
    if (categoryTitle === "인생흐름") return "인생대운";
    if (categoryTitle === "12개월운세") return "신년운세";
    if (categoryTitle === "자녀운") return "자식운";
    return categoryTitle;
  }

  const map: Record<CategoryId, string> = {
    today: "오늘운세",
    worry: "고민풀이",
    money: "재물운",
    career: "직업/사업운",
    love: "연애운",
    marriage: "결혼운",
    health: "건강운",
    children: "자식운",
    compatibility: "궁합풀이",
    family: "가족관계",
    partner: "사업파트너",
    lifeFlow: "인생대운",
    monthly: "신년운세",
    premium: "프리미엄상담",
    traditional: "평생종합사주",
  };

  return categoryId ? map[categoryId] : "운세풀이";
}

function hasPartnerBirthInfo(user?: UserInfo) {
  return Boolean(user?.partnerYear && user?.partnerMonth && user?.partnerDay);
}

function isCompatibilityCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return categoryId === "compatibility" || title.includes("궁합");
}

function isFamilyCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return categoryId === "family" || title.includes("가족");
}

function isPartnerCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return categoryId === "partner" || title.includes("사업파트너") || title.includes("동업") || title.includes("파트너");
}

function isChildrenCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return categoryId === "children" || title.includes("자식") || title.includes("자녀");
}

function isMonthlyCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "monthly" ||
    title.includes("신년") ||
    title.includes("올해") ||
    title.includes("해운") ||
    title.includes("12개월") ||
    title.includes("월별")
  );
}

function isCareerCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return categoryId === "career" || title.includes("직업") || (title.includes("사업") && !isPartnerCategory(categoryId, title));
}

function shouldUseCareerArchetype(categoryId?: CategoryId) {
  return (
    categoryId === "career" ||
    categoryId === "money" ||
    categoryId === "lifeFlow" ||
    categoryId === "monthly" ||
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

function readElementCount(manse: any, korean: "목" | "화" | "토" | "금" | "수", english: string) {
  const candidates = [
    manse?.elements,
    manse?.elementCounts,
    manse?.elementCount,
    manse?.oheng,
    manse?.fiveElements,
    manse?.fiveElementCounts,
  ];

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;

    const value = item[korean] ?? item[english] ?? item[english.toLowerCase()] ?? item[english.toUpperCase()];

    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

function getElementSnapshot(manse: any) {
  const wood = readElementCount(manse, "목", "wood");
  const fire = readElementCount(manse, "화", "fire");
  const earth = readElementCount(manse, "토", "earth");
  const metal = readElementCount(manse, "금", "metal");
  const water = readElementCount(manse, "수", "water");

  const strongestElement = manse?.strongestElement || manse?.strongElement || manse?.strongest || "제공된 명식 기준";
  const weakestElement = manse?.weakestElement || manse?.weakElement || manse?.weakest || "제공된 명식 기준";
  const dayMaster = manse?.dayMaster?.label || manse?.dayMaster?.name || manse?.dayMaster || manse?.ilgan || "제공된 일간";

  return { wood, fire, earth, metal, water, strongestElement, weakestElement, dayMaster };
}

function getTenGodCounts(manse: any): TenGodCountsLike {
  return manse?.tenGods?.counts || manse?.tenGodCounts || manse?.sip성Counts || manse?.sipsungCounts || {};
}

function countTenGodGroup(tenGods: TenGodCountsLike, keys: TenGodKey[]) {
  return keys.reduce((sum, key) => sum + Number(tenGods[key] || 0), 0);
}

function getReadableElementFlow(manse: any) {
  const snap = getElementSnapshot(manse);
  const labelMap: Record<string, string> = {
    목: "성장과 방향을 잡는 힘",
    화: "추진력과 표현력, 회복 리듬",
    토: "현실감과 책임감, 버티는 힘",
    금: "정리력과 판단력, 끊어내는 힘",
    수: "생각의 깊이와 회복력, 유연함",
  };

  return {
    strongest: String(snap.strongestElement),
    weakest: String(snap.weakestElement),
    strongestText: labelMap[String(snap.strongestElement)] || "좋게 타고난 힘",
    weakestText: labelMap[String(snap.weakestElement)] || "반복해서 보완해야 할 부분",
  };
}

function profileLines(profile: SajuProfile) {
  const avoidLines = profile.avoid.map((item, index) => `${index + 1}. ${item}`).join(NL);
  const actionLines = profile.action.map((item, index) => `${index + 1}. ${item}`).join(NL);

  return `
[카테고리별 사주 프로필]
- 프로필: ${profile.type}
- 핵심 해석: ${profile.core}
- 가장 조심할 점: ${profile.risk}
- 잡아야 할 방향: ${profile.direction}

[이 사람에게 맞춘 하지 말아야 할 선택]
${avoidLines}

[이 사람에게 맞춘 실행 방향]
${actionLines}
`;
}

function gradeByScore(score: number): Grade {
  if (score >= 9) return "상";
  if (score >= 7) return "중상";
  if (score >= 5) return "중";
  if (score >= 3) return "중하";
  return "하";
}

function getMoneyGrade(manse: any): Grade {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  let score = 0;

  score += earth >= 4 ? 4 : earth >= 3 ? 3 : earth >= 2 ? 2 : earth;
  score += water >= 2 ? 2 : water;
  score += fire >= 2 ? 2 : fire;
  score += metal >= 2 ? 2 : metal >= 1 ? 1 : 0;
  score += wood >= 2 ? 1 : 0;

  if (earth >= 3 && metal === 0) score -= 1;
  if (fire === 0) score -= 1;
  if (water >= 2 && earth >= 2) score += 1;

  return gradeByScore(score);
}

function getHealthGrade(manse: any): Grade {
  const { fire, earth, metal, water } = getElementSnapshot(manse);
  let score = 5;

  if (fire >= 1) score += 1;
  if (fire >= 2) score += 1;
  if (water >= 1) score += 1;
  if (earth >= 2) score += 1;
  if (fire === 0) score -= 3;
  if (metal === 0) score -= 1;
  if (earth >= 4) score -= 1;
  if (water === 0) score -= 1;

  return gradeByScore(score);
}

function getChildrenFlow(manse: any) {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  let score = 0;

  score += wood >= 2 ? 2 : wood;
  score += fire >= 1 ? 1 : 0;
  score += water >= 2 ? 2 : water;
  score += earth >= 2 ? 1 : 0;
  if (metal === 0) score -= 1;
  if (fire === 0) score -= 1;

  if (score >= 5) return "자식 인연이 비교적 강하고, 자식복이 관계 속에서 드러나는 편";
  if (score >= 3) return "자식운은 중간 이상이지만 기대와 거리 조율이 중요한 편";
  if (score >= 1) return "자식운이 늦게 드러나거나 책임과 함께 들어오는 편";
  return "자식운은 약하게 단정하기보다 관계 조율과 양육 기준이 중요한 편";
}

function getMarriageFlow(manse: any) {
  const { earth, metal, water, fire } = getElementSnapshot(manse);
  if (earth >= 3 && fire === 0) return "늦게 안정되는 결혼운";
  if (metal >= 2 || water >= 2) return "기준이 맞아야 열리는 결혼운";
  if (fire >= 2) return "인연이 빠르게 들어올 수 있지만 선택 기준이 중요한 결혼운";
  return "생활 기준을 맞춰야 안정되는 결혼운";
}

function getCompatibilityScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 65,
      grade: "정보 부족형 궁합",
      summary: "상대방 정보가 부족해서 기본 궁합만 보는 흐름",
      risk: "상대방 생년월일과 출생시간이 없으면 실제 충돌 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 60;

  if (me.weakestElement && partner.strongestElement && me.weakestElement === partner.strongestElement) score += 10;
  if (partner.weakestElement && me.strongestElement && partner.weakestElement === me.strongestElement) score += 10;
  if (me.strongestElement && partner.strongestElement && me.strongestElement === partner.strongestElement) score -= 8;

  const myTotal = me.wood + me.fire + me.earth + me.metal + me.water || 1;
  const partnerTotal = partner.wood + partner.fire + partner.earth + partner.metal + partner.water || 1;

  const diff =
    Math.abs(me.wood / myTotal - partner.wood / partnerTotal) +
    Math.abs(me.fire / myTotal - partner.fire / partnerTotal) +
    Math.abs(me.earth / myTotal - partner.earth / partnerTotal) +
    Math.abs(me.metal / myTotal - partner.metal / partnerTotal) +
    Math.abs(me.water / myTotal - partner.water / partnerTotal);

  if (diff < 0.8) score += 8;
  if (diff > 1.6) score -= 8;
  if (me.fire === 0 && partner.fire === 0) score -= 7;
  if (me.earth >= 3 && partner.earth >= 3) score -= 7;
  if ((me.water >= 2 && partner.fire >= 2) || (partner.water >= 2 && me.fire >= 2)) score += 1;

  score = Math.max(35, Math.min(92, score));

  if (score >= 85) {
    return {
      score,
      grade: "좋은 궁합",
      summary: "서로 보완하는 힘이 강해서 오래 갈 가능성이 있는 궁합",
      risk: "좋다고 방심하면 생활 기준에서 작은 균열이 생길 수 있다",
    };
  }

  if (score >= 75) {
    return {
      score,
      grade: "괜찮은 궁합",
      summary: "끌림과 현실 조율이 함께 있는 궁합",
      risk: "초반에는 잘 맞아도 돈, 가족, 생활 리듬을 맞춰야 오래 간다",
    };
  }

  if (score >= 60) {
    return {
      score,
      grade: "보통 궁합",
      summary: "좋은 부분과 부딪히는 부분이 같이 있는 궁합",
      risk: "서로의 차이를 이해하지 못하면 같은 문제로 반복해서 싸울 수 있다",
    };
  }

  if (score >= 50) {
    return {
      score,
      grade: "주의가 필요한 궁합",
      summary: "끌림은 있어도 결혼이나 장기 관계에서는 조율이 많이 필요한 궁합",
      risk: "감정만 믿고 밀어붙이면 생활 문제에서 크게 부딪힐 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 궁합",
    summary: "처음 끌림보다 오래 맞춰가는 과정이 훨씬 어려운 궁합",
    risk: "결혼까지 가면 돈, 가족, 말투, 생활방식에서 피로가 커질 수 있다",
  };
}

function getFamilyScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 63,
      grade: "정보 부족형 가족궁합",
      summary: "상대방 정보가 부족해서 기본 가족관계 흐름만 보는 구조",
      risk: "상대방 생년월일과 출생시간이 없으면 실제 충돌 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 60;

  if (me.weakestElement && partner.strongestElement && me.weakestElement === partner.strongestElement) score += 8;
  if (partner.weakestElement && me.strongestElement && partner.weakestElement === me.strongestElement) score += 8;
  if (me.strongestElement && partner.strongestElement && me.strongestElement === partner.strongestElement) score -= 6;

  if (me.earth >= 3 && partner.earth >= 3) score -= 8;
  if (me.fire === 0 && partner.fire === 0) score -= 5;
  if (me.water >= 2 && partner.water >= 2) score += 4;
  if (me.metal === 0 && partner.metal === 0) score -= 4;

  const myTotal = me.wood + me.fire + me.earth + me.metal + me.water || 1;
  const partnerTotal = partner.wood + partner.fire + partner.earth + partner.metal + partner.water || 1;

  const diff =
    Math.abs(me.wood / myTotal - partner.wood / partnerTotal) +
    Math.abs(me.fire / myTotal - partner.fire / partnerTotal) +
    Math.abs(me.earth / myTotal - partner.earth / partnerTotal) +
    Math.abs(me.metal / myTotal - partner.metal / partnerTotal) +
    Math.abs(me.water / myTotal - partner.water / partnerTotal);

  if (diff < 0.8) score += 6;
  if (diff > 1.6) score -= 6;

  score = Math.max(35, Math.min(92, score));

  if (score >= 85) {
    return {
      score,
      grade: "좋은 가족궁합",
      summary: "서로의 부족한 부분을 보완할 수 있는 가족관계",
      risk: "가깝다는 이유로 선을 무시하면 작은 서운함이 쌓일 수 있다",
    };
  }

  if (score >= 75) {
    return {
      score,
      grade: "괜찮은 가족궁합",
      summary: "정은 있지만 생활 기준과 말투를 맞춰야 안정되는 관계",
      risk: "가족이라는 이유로 기대가 커지면 부담과 서운함이 반복될 수 있다",
    };
  }

  if (score >= 60) {
    return {
      score,
      grade: "보통 가족궁합",
      summary: "좋은 마음과 부딪히는 지점이 같이 있는 가족관계",
      risk: "역할, 책임, 돈 문제에서 선을 정하지 않으면 반복해서 감정이 상할 수 있다",
    };
  }

  if (score >= 50) {
    return {
      score,
      grade: "거리 조절이 필요한 가족궁합",
      summary: "정은 있어도 가까울수록 피로가 쌓일 수 있는 관계",
      risk: "한쪽이 계속 참거나 책임지면 관계가 무거워질 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 가족궁합",
    summary: "가깝게 지낼수록 말투, 책임, 돈 문제에서 충돌이 커질 수 있는 관계",
    risk: "정으로만 버티면 관계가 회복되기보다 감정 피로가 누적될 수 있다",
  };
}

function getBusinessPartnerScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 62,
      grade: "정보 부족형 파트너궁합",
      summary: "상대방 정보가 부족해서 기본 동업 흐름만 보는 구조",
      risk: "상대방 생년월일과 출생시간이 없으면 돈과 역할 충돌 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 58;

  if (me.weakestElement && partner.strongestElement && me.weakestElement === partner.strongestElement) score += 8;
  if (partner.weakestElement && me.strongestElement && partner.weakestElement === me.strongestElement) score += 8;
  if (me.strongestElement && partner.strongestElement && me.strongestElement === partner.strongestElement) score -= 6;

  if ((me.earth >= 2 && partner.metal >= 1) || (partner.earth >= 2 && me.metal >= 1)) score += 7;
  if ((me.water >= 2 && partner.fire >= 1) || (partner.water >= 2 && me.fire >= 1)) score += 5;
  if (me.metal === 0 && partner.metal === 0) score -= 8;
  if (me.fire === 0 && partner.fire === 0) score -= 4;
  if (me.earth >= 3 && partner.earth >= 3) score -= 5;

  const myTotal = me.wood + me.fire + me.earth + me.metal + me.water || 1;
  const partnerTotal = partner.wood + partner.fire + partner.earth + partner.metal + partner.water || 1;

  const diff =
    Math.abs(me.wood / myTotal - partner.wood / partnerTotal) +
    Math.abs(me.fire / myTotal - partner.fire / partnerTotal) +
    Math.abs(me.earth / myTotal - partner.earth / partnerTotal) +
    Math.abs(me.metal / myTotal - partner.metal / partnerTotal) +
    Math.abs(me.water / myTotal - partner.water / partnerTotal);

  if (diff < 0.8) score += 4;
  if (diff > 1.7) score -= 7;

  score = Math.max(35, Math.min(92, score));

  if (score >= 85) {
    return {
      score,
      grade: "좋은 사업파트너궁합",
      summary: "역할을 나누면 서로의 부족한 부분을 채워 돈 흐름을 만들 수 있는 관계",
      risk: "좋은 궁합이어도 계약과 돈 기준을 대충 넘기면 나중에 균열이 생길 수 있다",
    };
  }

  if (score >= 75) {
    return {
      score,
      grade: "괜찮은 사업파트너궁합",
      summary: "같이 일할 수 있는 힘은 있지만 역할과 책임을 정확히 나눠야 하는 관계",
      risk: "처음엔 잘 맞아도 수익 배분, 업무 강도, 결정권에서 부딪힐 수 있다",
    };
  }

  if (score >= 60) {
    return {
      score,
      grade: "보통 사업파트너궁합",
      summary: "아이디어나 방향은 맞을 수 있지만 돈 기준을 잡아야 하는 동업 관계",
      risk: "말로만 시작하면 역할, 책임, 비용 부담에서 반복 충돌이 생길 수 있다",
    };
  }

  if (score >= 50) {
    return {
      score,
      grade: "주의가 필요한 사업파트너궁합",
      summary: "같이 일하려면 계약과 역할 분담이 매우 중요한 관계",
      risk: "호감이나 의리로 시작하면 돈 문제에서 관계가 틀어질 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 사업파트너궁합",
    summary: "같이 돈을 벌기보다 책임과 기준 문제로 부딪히기 쉬운 관계",
    risk: "동업으로 가면 수익 배분, 결정권, 책임 소재에서 피로가 커질 수 있다",
  };
}

function getLifeFlow(manse: any) {
  const { earth, fire, metal, water } = getElementSnapshot(manse);
  if (earth >= 3 && fire === 0) return "초년보다 중년 이후에 기준을 잡으며 풀리는 흐름";
  if (water >= 2 && metal === 0) return "감각은 있으나 방향을 잡기 전까지 흔들리는 흐름";
  if (fire >= 2) return "빠르게 움직일수록 기회가 생기지만 무리하면 꺾이는 흐름";
  return "한 번에 치고 나가기보다 쌓아서 안정되는 흐름";
}

function getMajorLuckChanceCount(manse: any) {
  const { earth, fire, metal, water, wood } = getElementSnapshot(manse);
  let score = 0;
  if (earth >= 3) score += 1;
  if (water >= 2) score += 1;
  if (wood >= 2) score += 1;
  if (fire >= 2) score += 1;
  if (metal >= 2) score += 1;
  if (fire === 0 || metal === 0) score -= 1;
  if (score >= 3) return "3번";
  if (score >= 1) return "2번";
  return "1~2번";
}

function getMostImportantLuckPhase(manse: any) {
  const { earth, fire, metal, water } = getElementSnapshot(manse);
  if (earth >= 3 && fire === 0) return "청년 후반부터 중년 초입";
  if (water >= 2 && metal === 0) return "중년 초입부터 중년 중반";
  if (fire >= 2) return "청년기부터 빠르게 열리는 시기";
  if (metal >= 2) return "중년 이후 자리 잡는 시기";
  return "중년 이후 안정적으로 커지는 시기";
}

function getCareerArchetype(manse: any) {
  const { wood, fire, earth, metal, water, strongestElement, weakestElement, dayMaster } = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);

  let officeScore = 0;
  let businessScore = 0;
  let sideJobScore = 0;
  let freelanceScore = 0;
  let expertScore = 0;

  if (metal >= 3) officeScore += 5;
  if (metal === 2) officeScore += 3;
  if (metal === 1) officeScore += 1;
  if (water >= 2 && metal >= 1) officeScore += 1;
  if (earth >= 2 && metal >= 2) officeScore += 1;
  if (metal === 0) officeScore -= 4;

  if (earth >= 3) businessScore += 3;
  if (fire >= 2) businessScore += 3;
  if (wood >= 2) businessScore += 2;
  if (water >= 2 && earth >= 2) businessScore += 1;
  if (metal === 0 && earth >= 3) businessScore += 1;

  if (earth >= 2 && metal === 0) sideJobScore += 5;
  if (earth >= 3 && fire === 0) sideJobScore += 3;
  if (water >= 2) sideJobScore += 2;
  if (wood >= 1) sideJobScore += 1;
  if (fire <= 1 && earth >= 3) sideJobScore += 1;

  if (wood >= 2) freelanceScore += 2;
  if (fire >= 2) freelanceScore += 4;
  if (wood >= 2 && fire >= 1) freelanceScore += 2;
  if (metal === 0 && fire >= 1) freelanceScore += 1;

  if (water >= 2) expertScore += 3;
  if (earth >= 2) expertScore += 2;
  if (metal >= 1) expertScore += 1;
  if (wood >= 1 && water >= 1) expertScore += 1;

  if (authority >= 3) officeScore += 4;
  if (authority >= 2 && resource >= 1) officeScore += 1;
  if (wealth >= 3) businessScore += 4;
  if (wealth >= 2 && output >= 2) businessScore += 2;
  if (output >= 2) sideJobScore += 2;
  if (output >= 3) freelanceScore += 4;
  if (resource >= 3) expertScore += 4;

  if (earth >= 3 && metal === 0) {
    sideJobScore += 4;
    businessScore += 1;
    officeScore -= 3;
  }

  if (earth >= 3 && fire === 0 && metal === 0) {
    sideJobScore += 3;
    expertScore += 1;
    officeScore -= 2;
  }

  if (water >= 2 && metal === 0) {
    sideJobScore += 2;
    expertScore += 1;
  }

  const scores = [
    { type: "직장형", score: officeScore },
    { type: "사업형", score: businessScore },
    { type: "부업형", score: sideJobScore },
    { type: "프리랜서형", score: freelanceScore },
    { type: "전문기술형", score: expertScore },
  ].sort((a, b) => b.score - a.score);

  const primary = scores[0];
  const secondary = scores[1];
  let combined = primary.type;

  if (primary.type === "부업형" && (secondary.type === "사업형" || secondary.type === "전문기술형")) {
    combined = "부업형에 가까운 자기수익형";
  } else if (primary.type === "부업형" && secondary.type === "직장형") {
    combined = "직장+부업형";
  } else if (primary.type === "사업형" && secondary.type === "부업형") {
    combined = "사업형이지만 부업부터 키워야 하는 타입";
  } else if (primary.type === "전문기술형" && secondary.type === "부업형") {
    combined = "전문기술+부업형";
  } else if (primary.type === "직장형" && secondary.type === "부업형") {
    combined = "직장 기반 부업형";
  }

  let warning = "초기비용이 크거나 감정적으로 급하게 결정하는 구조";
  if (combined.includes("직장") && !combined.includes("부업")) warning = "규칙 없는 프리랜서형이나 준비 없는 창업";
  if (combined.includes("사업")) warning = "준비 없이 크게 벌이는 사업, 무리한 확장, 빚내서 시작하는 구조";
  if (combined.includes("부업")) warning = "처음부터 크게 벌이는 사업, 고정비 큰 창업, 무리한 투자";
  if (combined.includes("프리랜서")) warning = "수입 구조 없이 감각만 믿고 움직이는 방식";
  if (combined.includes("전문기술")) warning = "기술 없이 말로만 하는 사업, 남의 말 듣고 시작하는 투자";

  return {
    wood,
    fire,
    earth,
    metal,
    water,
    strongestElement,
    weakestElement,
    dayMaster,
    scores,
    primary: primary.type,
    secondary: secondary.type,
    combined,
    warning,
    tenGods: { wealth, output, authority, resource },
  };
}

function getCareerArchetypeGuide(manse: any) {
  const career = getCareerArchetype(manse);
  const scoreLines = career.scores.map((item) => `- ${item.type}: ${item.score}`).join(NL);

  return `
[고정 직업 성향 판정]
이 판정은 route.ts 코드에서 오행 분포와 십성 분포를 바탕으로 계산된 고정값이다.
AI는 이 판정을 절대 바꾸지 말고, 이 판정을 기준으로만 설명해라.

[사용한 오행 점수]
- 목: ${career.wood}
- 화: ${career.fire}
- 토: ${career.earth}
- 금: ${career.metal}
- 수: ${career.water}

[사용한 십성 보조 점수]
- 재성 묶음: ${career.tenGods?.wealth ?? 0}
- 식상 묶음: ${career.tenGods?.output ?? 0}
- 관성 묶음: ${career.tenGods?.authority ?? 0}
- 인성 묶음: ${career.tenGods?.resource ?? 0}

[기본 정보]
- 일간: ${career.dayMaster}
- 강한 오행: ${career.strongestElement}
- 약한 오행: ${career.weakestElement}

[직업 성향 점수]
${scoreLines}

[최종 고정 판정]
- 1순위: ${career.primary}
- 2순위: ${career.secondary}
- 최종 표현: ${career.combined}
- 피해야 할 방식: ${career.warning}

[해석 규칙]
- 직업/사업운, 재물운, 인생대운, 신년운세, 평생종합사주, 프리미엄상담에서만 이 판정을 사용해라.
- 연애운, 결혼운, 궁합풀이, 가족관계, 사업파트너, 건강운, 자식운, 오늘운세에서는 직업 성향 판정을 언급하지 마라.
- 1순위와 2순위를 뒤집지 마라.
- 최종 표현을 절대 바꾸지 마라.
- "안정적인 직장형이 우선"처럼 최종 표현과 다른 말을 하지 마라.
- "안정적인 기반이 필요하다"와 "직장형이다"는 다르다.
- 안정 기반이 필요하다고 해서 직장형으로 결론 내리지 마라.
- 재물운에서도 직업 성향을 말해야 한다면 반드시 위 [최종 표현]과 같은 표현을 사용해라.
- 신년운세, 평생종합사주, 프리미엄상담에서도 직업 성향을 말해야 한다면 반드시 위 [최종 표현]과 같은 표현을 사용해라.
- 사주상 기반이 필요한 사람에게는 "직장을 다니며 부업"이라고 단정하지 말고, "생활 기반이나 고정 수입 구조 위에 자기 수익 구조를 얹을 때 좋다"라고 표현해라.
`;
}

function getMoneyProfile(manse: any): SajuProfile {
  const career = getCareerArchetype(manse);
  const moneyGrade = getMoneyGrade(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  if (wealth >= 3 && output >= 2) {
    return {
      type: "수익화 빠른 실행형 재물 구조",
      core: `돈복은 '${moneyGrade}'으로 보되, 돈은 실행과 판매 감각에서 붙기 쉬운 구조야. 직업 성향은 '${career.combined}'으로 고정해서 봐야 하고, 작게 팔아보고 반응이 오는 쪽을 키울 때 재물운이 살아나.`,
      risk: "수익 신호가 보이면 너무 빨리 판을 키우거나 고정비를 먼저 키우는 게 위험해.",
      direction: "작게 팔아보고 반복 구매나 재문의가 생기는 구조만 남겨야 해.",
      avoid: ["수익이 보이자마자 매장, 장비, 재고, 광고비를 크게 늘리는 선택", "회수 기간을 계산하지 않고 돈부터 묶는 선택", "사람 반응은 확인하지 않고 아이디어만 믿고 시작하는 선택"],
      action: ["먼저 1개 상품이나 서비스만 정해서 작게 팔아보기", "재문의가 생기는지 기록하기", "고정비를 쓰기 전에 손실 한도와 회수 기간 정하기"],
    };
  }

  if (output >= 3 && wealth <= 1) {
    return {
      type: "재능은 있는데 돈길 설계가 필요한 재물 구조",
      core: `돈복은 '${moneyGrade}'으로 보지만, 핵심은 재능을 돈으로 바꾸는 구조야. 말, 기술, 콘텐츠, 손재주, 서비스 능력은 있는데 가격표와 판매 구조가 약하면 돈이 남지 않아.`,
      risk: "잘해주기만 하고 돈을 못 받는 구조가 제일 위험해.",
      direction: "가격표, 상품 구성, 반복 고객 구조를 먼저 만들어야 해.",
      avoid: ["무료로 계속 해주면서 실력만 소모하는 선택", "가격을 못 정하고 상대 반응에 끌려가는 선택", "팔릴 구조 없이 기술이나 콘텐츠만 더 쌓는 선택"],
      action: ["가격표를 먼저 만들기", "무료와 유료의 경계를 정하기", "반복 구매가 가능한 작은 구성 만들기"],
    };
  }

  if (resource >= 3) {
    return {
      type: "지식·준비형 재물 구조",
      core: `돈복은 '${moneyGrade}'으로 보되, 돈은 공부·정보·분석·자격·상담·정리된 지식에서 붙기 쉬워. 다만 준비만 길어지면 돈길이 늦게 열린다.`,
      risk: "완벽해질 때까지 기다리다가 시작 타이밍을 놓치는 게 위험해.",
      direction: "배운 것을 작은 상품이나 상담, 문서, 서비스로 바로 테스트해야 해.",
      avoid: ["자격증과 공부만 늘리고 판매 구조를 만들지 않는 선택", "완벽한 준비를 핑계로 시작을 미루는 선택", "정보만 모으고 실제 고객 반응을 확인하지 않는 선택"],
      action: ["배운 내용으로 작은 유료 테스트 만들기", "고객이 돈을 낼 문제를 하나만 정하기", "자료·상담·서비스 중 하나로 포장하기"],
    };
  }

  if (authority >= 3) {
    return {
      type: "안정 기반형 재물 구조",
      core: `돈복은 '${moneyGrade}'으로 보며, 돈은 책임 있는 역할, 관리, 조직, 규칙 있는 구조에서 안정적으로 들어오기 쉬워. 하지만 안정만 잡으면 자기 돈길이 늦어질 수 있어.`,
      risk: "책임은 큰데 보상은 적은 역할에 오래 묶이는 게 위험해.",
      direction: "안정 수입은 지키되, 자기 이름으로 받을 수 있는 수익을 옆에 붙여야 해.",
      avoid: ["남의 일만 책임지고 내 돈길은 미루는 선택", "직책이나 책임감 때문에 손해를 감수하는 선택", "수입원을 하나로만 묶어두는 선택"],
      action: ["내가 책임지는 일 중 돈으로 바꿀 수 있는 능력 찾기", "작은 외부 수익 구조 하나 만들기", "역할 대비 보상이 맞는지 점검하기"],
    };
  }

  if (peer >= 3) {
    return {
      type: "경쟁·동료 영향형 재물 구조",
      core: `돈복은 '${moneyGrade}'으로 보지만, 사람과 경쟁, 협업 속에서 돈길이 열리기 쉬워. 대신 사람 때문에 돈이 새는 구조도 같이 조심해야 해.`,
      risk: "친하다는 이유로 돈을 섞거나 비교심리 때문에 무리하는 게 위험해.",
      direction: "사람과 돈 기준을 분리하고 정산 기준을 먼저 잡아야 해.",
      avoid: ["친하다는 이유로 돈을 빌려주거나 같이 쓰는 선택", "정산 기준 없는 협업이나 동업", "비교심리 때문에 과하게 쓰는 소비"],
      action: ["돈거래 기준을 문서나 메시지로 남기기", "협업 전 역할과 정산일 정하기", "사람 때문에 쓰는 돈을 따로 기록하기"],
    };
  }

  return {
    type: `${career.combined} 기반 재물 구조`,
    core: `돈복은 '${moneyGrade}'으로 보며, 직업 성향은 '${career.combined}' 흐름과 연결해서 봐야 해. 돈은 한 번에 크게 잡기보다 네가 직접 통제할 수 있는 구조에서 살아나.`,
    risk: "방향 없이 이것저것 건드리다가 돈과 체력이 같이 새는 게 위험해.",
    direction: "작게 검증하고 반복되는 돈길만 남겨야 해.",
    avoid: ["무리한 투자", "준비 없는 사업개시", "고정비 큰 선택"],
    action: ["손실 한도 정하기", "작게 팔아보기", "반복되는 돈길만 남기기"],
  };
}

function getCareerProfile(manse: any): SajuProfile {
  const career = getCareerArchetype(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);

  if (wealth >= 3 && output >= 2) {
    return {
      type: `${career.combined} / 실행수익형`,
      core: `너는 '${career.combined}'에 가깝고, 일은 실행해서 반응을 만들고 그 반응을 수익으로 바꾸는 쪽이 맞아.`,
      risk: "아이디어가 괜찮다고 바로 크게 시작하는 게 위험해.",
      direction: "작은 판매, 작은 서비스, 작은 프로젝트로 반응을 확인한 뒤 키워야 해.",
      avoid: ["고정비 큰 창업", "검증 없는 광고비 지출", "재고부터 쌓는 선택"],
      action: ["작은 테스트 상품 만들기", "반응 기록하기", "되는 것만 남기기"],
    };
  }

  if (output >= 3) {
    return {
      type: `${career.combined} / 표현·기술형`,
      core: `너는 '${career.combined}' 흐름 위에서 말, 기술, 손재주, 콘텐츠, 서비스처럼 밖으로 꺼내는 능력이 중요해.`,
      risk: "실력만 쌓고 가격표나 판매 구조를 만들지 않는 게 위험해.",
      direction: "기술이나 표현을 바로 상품·서비스·콘텐츠로 포장해야 해.",
      avoid: ["무료 노동", "가격 없는 서비스", "배우기만 하고 팔지 않는 구조"],
      action: ["서비스 메뉴 만들기", "가격표 만들기", "작은 고객 반응 확인하기"],
    };
  }

  if (authority >= 3) {
    return {
      type: `${career.combined} / 책임관리형`,
      core: `너는 '${career.combined}'에 가깝지만, 일에서는 책임·관리·규칙·운영을 맡을 때 안정감이 생겨.`,
      risk: "남의 책임만 떠안고 내 수익 구조를 못 만드는 게 위험해.",
      direction: "관리 능력을 내 이름의 수익 구조로 옮기는 준비가 필요해.",
      avoid: ["보상 없는 책임", "감정노동 과다 역할", "내 역할이 흐린 일"],
      action: ["내가 맡을 역할 정하기", "보상 기준 확인하기", "관리 능력을 상품화하기"],
    };
  }

  if (resource >= 3) {
    return {
      type: `${career.combined} / 지식전문형`,
      core: `너는 '${career.combined}' 흐름과 함께 지식, 분석, 상담, 자격, 정리된 정보를 돈으로 바꿀 때 일이 풀려.`,
      risk: "준비만 계속하고 실행이 늦어지는 게 위험해.",
      direction: "배운 것을 작게 제공하고, 돈을 내는 사람이 있는지 빨리 확인해야 해.",
      avoid: ["자격증만 늘리기", "완벽주의", "실행 없는 공부"],
      action: ["작은 상담·자료·서비스 만들기", "유료 테스트하기", "반복 질문 모으기"],
    };
  }

  return {
    type: career.combined,
    core: `너는 '${career.combined}'에 가깝다. 직업명보다 중요한 건 돈과 역할이 만들어지는 구조야.`,
    risk: career.warning,
    direction: "생활 기반을 무너뜨리지 않으면서 자기 수익 구조를 작게 만들어야 해.",
    avoid: [career.warning, "남 말만 듣고 시작하는 일", "수익 구조 없는 일"],
    action: ["작게 테스트하기", "반응 확인하기", "반복 수요 찾기"],
  };
}

function getHealthProfile(manse: any): SajuProfile {
  const flow = getReadableElementFlow(manse);
  const healthGrade = getHealthGrade(manse);
  const snap = getElementSnapshot(manse);

  if (snap.fire === 0 || flow.weakest === "화") {
    return {
      type: "피로·회복 리듬 관리형",
      core: `건강운은 '${healthGrade}'으로 보며, 몸을 밀어붙이는 힘보다 회복 리듬을 먼저 잡아야 해.`,
      risk: "잠이 무너지고 피로가 쌓이면 판단력과 컨디션이 같이 흔들릴 수 있어.",
      direction: "수면, 따뜻한 식사, 무리하지 않는 운동, 스트레스 배출 리듬을 잡아야 해.",
      avoid: ["밤낮이 바뀌는 생활", "몰아서 무리하는 일", "피곤한데 카페인으로 버티는 습관"],
      action: ["수면 시간 고정", "찬 음식 줄이기", "가벼운 걷기부터 시작"],
    };
  }

  if (snap.earth >= 4 || flow.weakest === "토") {
    return {
      type: "소화·위장·장 리듬 관리형",
      core: `건강운은 '${healthGrade}'으로 보며, 책임감과 긴장이 몸에 쌓일 때 소화·위장·장 리듬으로 드러나기 쉬워.`,
      risk: "속이 불편해도 계속 참거나, 스트레스를 먹는 것으로 푸는 패턴이 위험해.",
      direction: "식사 시간, 소화 리듬, 과식·야식 조절을 먼저 잡아야 해.",
      avoid: ["야식과 과식", "불규칙한 식사", "속 불편함을 계속 참는 것"],
      action: ["식사 시간 고정", "자극적인 음식 줄이기", "불편하면 검진 받기"],
    };
  }

  if (flow.weakest === "수") {
    return {
      type: "수면·순환·회복력 관리형",
      core: `건강운은 '${healthGrade}'으로 보며, 회복력과 수면, 몸 안의 순환 리듬을 챙겨야 안정돼.`,
      risk: "쉬어도 회복이 안 되는 느낌을 방치하는 게 위험해.",
      direction: "수면의 질, 수분 섭취, 가벼운 움직임, 몸을 차갑게 두지 않는 습관이 중요해.",
      avoid: ["잠 줄이기", "몸을 차갑게 두는 습관", "회복 없이 계속 버티기"],
      action: ["물 섭취 체크", "수면 환경 정리", "가벼운 스트레칭"],
    };
  }

  if (flow.weakest === "금") {
    return {
      type: "호흡·피부·긴장 정리형",
      core: `건강운은 '${healthGrade}'으로 보며, 긴장이 쌓였을 때 호흡, 피부, 건조함, 목·어깨 쪽으로 신호가 올 수 있어.`,
      risk: "쉴 때도 몸에 힘이 들어간 상태를 오래 두는 게 위험해.",
      direction: "호흡, 스트레칭, 정리된 생활 공간, 건조함 관리가 필요해.",
      avoid: ["긴장한 상태로 오래 앉아 있기", "수분 부족", "몸의 건조함 방치"],
      action: ["목·어깨 풀기", "호흡 운동", "생활 공간 정리"],
    };
  }

  return {
    type: "균형 리듬 관리형",
    core: `건강운은 '${healthGrade}'으로 보며, 핵심은 ${flow.weakestText} 쪽을 생활에서 보완하는 거야.`,
    risk: "무리한 뒤 한 번에 무너지는 패턴이 위험해.",
    direction: "식사, 수면, 움직임, 스트레스 배출을 한꺼번에 크게 바꾸지 말고 하나씩 잡아야 해.",
    avoid: ["몰아서 무리하기", "몸의 신호 무시하기", "검진 미루기"],
    action: ["수면 체크", "식사 리듬 잡기", "가벼운 운동"],
  };
}

function getRelationshipProfile(manse: any, mode: "love" | "marriage" | "children" = "love"): SajuProfile {
  const tenGods = getTenGodCounts(manse);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  if (mode === "children") {
    if (output >= 3) {
      return {
        type: "표현과 정서 교류가 중요한 자식운",
        core: "자식운은 말의 온도와 정서 교류에서 살아나는 흐름이야. 자식 인연은 감정 교류, 대화, 표현 방식에서 강하게 드러나고, 자식이 있다면 부모의 말투와 반응이 관계를 좌우해.",
        risk: "기대가 커지면 말이 앞서고 아이가 부담으로 느낄 수 있어. 좋은 뜻으로 하는 말도 아이 입장에서는 압박처럼 들어갈 수 있다.",
        direction: "통제보다 대화, 기준보다 온도 조절이 중요해. 자식의 가능성은 표현력, 예술성, 말, 콘텐츠, 기술, 사람 앞에서 드러내는 능력 쪽으로 살려주는 게 좋아.",
        avoid: ["말로 몰아붙이기", "기대 과다", "감정적인 훈육", "자식의 선택을 부모 기준으로만 재단하기"],
        action: ["칭찬과 기준 분리", "말투 조절", "감정 표현 기다리기", "자식의 재능 방향을 관찰해서 환경 만들어주기"],
      };
    }

    if (resource >= 3) {
      return {
        type: "기대와 보호가 강한 자식운",
        core: "자식운은 보호하려는 마음이 강하게 들어오는 구조야. 자식 인연은 안정적인 환경을 만들어주는 쪽에서 살아나지만, 과하면 간섭으로 느껴질 수 있어.",
        risk: "걱정이 많아져 자식의 선택을 대신하려는 게 위험해. 부모가 불안해서 길을 먼저 정해주면 자식의 독립성과 가능성이 늦게 살아날 수 있다.",
        direction: "기대보다 거리감, 보호보다 자율성을 잡아야 해. 자식의 가능성은 공부형, 전문성, 자격, 안정형 진로, 깊게 파고드는 분야에서 살아날 수 있어.",
        avoid: ["과한 간섭", "대신 결정하기", "걱정으로 통제하기", "공부나 진로를 부모 불안으로 밀어붙이기"],
        action: ["선택권 주기", "경제적 선 정하기", "기대치 낮추기", "자식이 스스로 고를 수 있는 선택지를 만들어주기"],
      };
    }

    return {
      type: "거리와 기준 조율형 자식운",
      core: "자식운은 붙잡는 흐름보다 관계의 거리와 기준을 잘 맞출 때 안정돼. 자식 인연은 단정할 수 없지만, 들어온다면 기쁨과 책임이 함께 오는 구조로 봐야 해.",
      risk: "경제적 책임이나 기대를 혼자 크게 떠안는 게 위험해. 자식 문제를 부모의 체면이나 대리만족으로 끌고 가면 관계가 무거워질 수 있어.",
      direction: "사랑과 기준을 분리해야 해. 자식의 가능성은 한쪽으로 몰아붙이기보다 성향을 관찰해서 기술형, 안정형, 독립형 중 맞는 방향을 천천히 잡아주는 게 좋아.",
      avoid: ["경제적 책임 과다", "기대 강요", "거리감 없는 간섭", "자식을 통해 부모의 못 이룬 욕심을 채우려는 선택"],
      action: ["경제적 기준 정하기", "말의 온도 조절", "부모 삶도 지키기", "자식과 가족 사이에서 역할과 기대치를 미리 조율하기"],
    };
  }

  if (authority >= 3 && mode === "marriage") {
    return {
      type: "생활 기준이 중요한 결혼운",
      core: "결혼은 설렘보다 생활 기준, 책임 분담, 돈 기준이 맞을 때 안정돼.",
      risk: "상대의 조건만 보고 감정 회복 방식이나 생활 리듬을 놓치는 게 위험해.",
      direction: "돈, 가족 거리감, 역할 분담을 결혼 전부터 맞춰야 해.",
      avoid: ["외로움 때문에 결혼 결정", "돈 기준 미확인", "가족 문제를 나중으로 미루기"],
      action: ["돈 쓰는 방식 확인", "가족 거리감 대화", "역할 분담 정하기"],
    };
  }

  if (output >= 3) {
    return {
      type: "표현·반응이 중요한 연애운",
      core: "연애는 말투, 반응, 연락의 온도에서 크게 흔들릴 수 있어.",
      risk: "초반 설렘에 빨리 반응하다가 생활 기준을 놓치는 게 위험해.",
      direction: "표현은 하되 상대의 반복 행동을 보고 판단해야 해.",
      avoid: ["설렘만 보고 시작", "말만 많은 사람에게 끌리는 것", "불안해서 연락을 몰아치는 것"],
      action: ["반복 행동 보기", "연락 기준 정하기", "말보다 생활 태도 보기"],
    };
  }

  if (resource >= 3) {
    return {
      type: "신중 관찰형 관계운",
      core: "연애와 결혼은 천천히 관찰하고 확신이 생겨야 안정되는 흐름이야.",
      risk: "생각만 많아지고 실제 대화가 늦어지는 게 위험해.",
      direction: "혼자 판단하지 말고 필요한 질문을 직접 확인해야 해.",
      avoid: ["혼자 추측하기", "확인 없이 마음 접기", "완벽한 사람 기다리기"],
      action: ["중요한 질문 직접 하기", "상대의 생활 리듬 보기", "불편한 점 기록하기"],
    };
  }

  if (peer >= 3) {
    return {
      type: "자존심·거리 조절형 관계운",
      core: "관계에서 서로의 자존심과 주도권이 부딪히기 쉬워.",
      risk: "이기고 지는 문제로 가면 관계가 빨리 지친다.",
      direction: "서로의 영역과 거리감을 인정해야 오래 간다.",
      avoid: ["기싸움", "비교", "상대 통제"],
      action: ["각자 시간 존중", "싸움 후 회복 방식 정하기", "말투 조절"],
    };
  }

  return {
    type: mode === "marriage" ? "기준 조율형 결혼운" : "기준 조율형 연애운",
    core: "이 관계운은 끌림보다 기준을 먼저 잡을 때 안정돼.",
    risk: "외로움이나 분위기 때문에 기준을 낮추는 게 위험해.",
    direction: "상대의 말보다 반복되는 태도와 생활 리듬을 봐야 해.",
    avoid: ["외로움 때문에 시작", "생활 리듬 무시", "불편한 점을 미루기"],
    action: ["상대의 반복 행동 보기", "돈과 시간 기준 확인", "불편한 점 빨리 말하기"],
  };
}

function getYearlyProfile(manse: any): SajuProfile {
  const money = getMoneyProfile(manse);
  const career = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const flow = getReadableElementFlow(manse);

  if (flow.weakest === "화" || health.type.includes("회복")) {
    return {
      type: "회복 후 테스트하는 해",
      core: "올해는 무리하게 크게 벌리기보다 몸과 생활 리듬을 먼저 회복하고, 작은 테스트로 가능성을 확인하는 해로 봐야 해.",
      risk: "컨디션이 무너진 상태에서 돈이나 일을 크게 움직이는 게 위험해.",
      direction: "1~3개월은 정리, 4~6개월은 작은 테스트, 7~9개월은 되는 것만 남기기, 10~12개월은 안정화가 좋아.",
      avoid: ["무리한 확장", "피로 누적", "큰돈 들어가는 선택"],
      action: ["생활 리듬 회복", "작은 수익 테스트", "되는 것만 남기기"],
    };
  }

  if (money.type.includes("수익화") || career.type.includes("실행")) {
    return {
      type: "작게 팔아보고 키우는 해",
      core: "올해는 생각보다 실행과 반응 확인이 중요해. 다만 처음부터 크게 가면 부담이 커질 수 있어.",
      risk: "반응이 조금 왔다고 바로 돈을 크게 넣는 게 위험해.",
      direction: "작게 팔고, 반복 반응이 생기는 것만 키워야 해.",
      avoid: ["검증 없는 광고비", "재고 선구매", "고정비 확장"],
      action: ["작은 판매", "반응 기록", "반복 수요 확인"],
    };
  }

  return {
    type: "정리와 기준을 세우는 해",
    core: "올해는 한 방보다 기준을 세우고 새는 부분을 줄이는 쪽에서 운이 살아나.",
    risk: "돈, 사람, 일을 한꺼번에 바꾸려는 게 위험해.",
    direction: "정리할 것과 키울 것을 나눠야 해.",
    avoid: ["한 번에 다 바꾸기", "감정적 결정", "고정비 증가"],
    action: ["정리 목록 만들기", "작은 테스트", "고정비 점검"],
  };
}

function getLifeProfile(manse: any): SajuProfile {
  const career = getCareerArchetype(manse);
  const money = getMoneyProfile(manse);
  const health = getHealthProfile(manse);
  const flow = getReadableElementFlow(manse);

  if (career.combined.includes("부업") || career.combined.includes("자기수익")) {
    return {
      type: "중년 이후 자기판이 커지는 인생대운",
      core: `인생 흐름은 초년에 바로 완성되기보다 중년 이후 자기 수익 구조가 커지는 쪽이 강해. ${money.type}와 연결해서 봐야 해.`,
      risk: "초년의 답답함을 평생 운으로 착각하는 게 위험해.",
      direction: "청년기에는 테스트, 중년에는 자기판 확장, 말년에는 안정화가 중요해.",
      avoid: ["초년 실패로 포기", "준비 없는 큰 확장", "건강 리듬 무시"],
      action: ["작은 수익 구조 만들기", "반복 수요 찾기", "건강 리듬 유지"],
    };
  }

  if (health.type.includes("회복") || flow.weakest === "화") {
    return {
      type: "건강 리듬을 잡아야 대운을 잡는 흐름",
      core: "인생대운은 기회만 보는 게 아니라 몸이 버틸 수 있는 리듬을 같이 봐야 해.",
      risk: "좋은 기회가 와도 몸이 무너지면 오래 끌고 가기 어려워.",
      direction: "일과 돈보다 회복 리듬을 먼저 잡을 때 대운이 안정돼.",
      avoid: ["과로", "수면 무시", "몸의 신호 무시"],
      action: ["수면 고정", "일의 양 조절", "회복 시간 확보"],
    };
  }

  return {
    type: "기준을 세울수록 안정되는 인생대운",
    core: "인생 흐름은 급하게 뒤집기보다 기준을 세우고 쌓아갈 때 안정되는 쪽이야.",
    risk: "방향 없이 사람과 돈, 일을 끌고 가는 게 위험해.",
    direction: "초년에는 기준, 청년에는 실험, 중년에는 자리, 말년에는 안정이 중요해.",
    avoid: ["기준 없는 선택", "사람 때문에 흔들리기", "무리한 확장"],
    action: ["정리 기준 만들기", "작은 실험 기록하기", "건강 리듬 지키기"],
  };
}

function getWorryProfile(manse: any, question: string): SajuProfile {
  const q = question || "";
  const money = getMoneyProfile(manse);
  const career = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);

  if (/돈|투자|사업|창업|매출|수익|부업|대출|빚|장사|판매/.test(q)) {
    return {
      type: `돈 고민 / ${money.type}`,
      core: money.core,
      risk: money.risk,
      direction: money.direction,
      avoid: money.avoid,
      action: money.action,
    };
  }

  if (/직장|일|이직|퇴사|직업|회사|알바|사업|창업|부업/.test(q)) {
    return {
      type: `일 고민 / ${career.type}`,
      core: career.core,
      risk: career.risk,
      direction: career.direction,
      avoid: career.avoid,
      action: career.action,
    };
  }

  if (/건강|몸|아프|병원|잠|피로|소화|위|장|스트레스/.test(q)) {
    return {
      type: `건강 고민 / ${health.type}`,
      core: health.core,
      risk: health.risk,
      direction: health.direction,
      avoid: health.avoid,
      action: health.action,
    };
  }

  if (/연애|결혼|가족|사람|관계|궁합|상대|친구|동료/.test(q)) {
    return {
      type: `관계 고민 / ${relation.type}`,
      core: relation.core,
      risk: relation.risk,
      direction: relation.direction,
      avoid: relation.avoid,
      action: relation.action,
    };
  }

  return {
    type: "혼합 고민 / 핵심 좁히기형",
    core: "이 고민은 돈·일·사람·몸 중 어디가 가장 먼저 막혔는지 하나로 좁혀야 풀려.",
    risk: "한 번에 전부 바꾸려는 선택이 가장 위험해.",
    direction: "오늘 당장 할 일, 며칠 보류할 일, 정리해야 할 일을 나눠야 해.",
    avoid: ["큰돈 쓰기", "충동적인 퇴사나 계약", "관계 정리를 감정으로 바로 결정하기"],
    action: ["문제 하나로 좁히기", "오늘 결정하지 않아도 되는 일 보류하기", "손실이 큰 선택부터 멈추기"],
  };
}

function getPremiumProfile(manse: any, question: string): SajuProfile {
  const worry = getWorryProfile(manse, question);
  const money = getMoneyProfile(manse);
  const career = getCareerProfile(manse);
  const health = getHealthProfile(manse);

  return {
    type: `프리미엄 종합 / ${worry.type}`,
    core: `프리미엄 사주는 질문을 중심으로 보되 돈·일·관계·건강을 함께 연결해서 봐야 해. 질문의 핵심은 ${worry.type}이고, 돈은 ${money.type}, 일은 ${career.type}, 건강은 ${health.type} 흐름으로 같이 봐야 해.`,
    risk: `가장 위험한 건 ${worry.risk} 그리고 돈·일·건강을 한 번에 뒤집는 선택이야.`,
    direction: `먼저 ${worry.direction} 그다음 돈은 ${money.direction} 일은 ${career.direction} 건강은 ${health.direction}`,
    avoid: [...worry.avoid.slice(0, 2), ...money.avoid.slice(0, 1), ...career.avoid.slice(0, 1), ...health.avoid.slice(0, 1)],
    action: [...worry.action.slice(0, 2), ...money.action.slice(0, 1), ...career.action.slice(0, 1), ...health.action.slice(0, 1)],
  };
}

function getCategoryProfileText(categoryId: CategoryId, categoryTitle: string, manse: any, question: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) return profileLines(getPremiumProfile(manse, question));
  if (categoryId === "worry" || title.includes("고민")) return profileLines(getWorryProfile(manse, question));
  if (categoryId === "money" || title.includes("재물")) return profileLines(getMoneyProfile(manse));
  if (isCareerCategory(categoryId, title)) return profileLines(getCareerProfile(manse));
  if (categoryId === "health" || title.includes("건강")) return profileLines(getHealthProfile(manse));
  if (categoryId === "love" || title.includes("연애")) return profileLines(getRelationshipProfile(manse, "love"));
  if (categoryId === "marriage" || title.includes("결혼")) return profileLines(getRelationshipProfile(manse, "marriage"));
  if (isChildrenCategory(categoryId, title)) return profileLines(getRelationshipProfile(manse, "children"));
  if (isMonthlyCategory(categoryId, title)) return profileLines(getYearlyProfile(manse));
  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) return profileLines(getLifeProfile(manse));

  return `
[카테고리별 사주 프로필]
- 이 카테고리는 관계/점수형 또는 공통형 카테고리다.
- [고정 결론]과 [카테고리 전용 지침]을 우선 적용해라.
- 추상적인 조언으로 끝내지 말고 선택 카테고리에 맞는 현실 행동으로 풀어라.
`;
}

function getFixedConclusionBlock(
  categoryId: CategoryId,
  categoryTitle: string,
  user: UserInfo,
  manse: any,
  partnerManse?: any | null
) {
  const name = getName(user);
  const moneyGrade = getMoneyGrade(manse);
  const healthGrade = getHealthGrade(manse);
  const career = getCareerArchetype(manse);
  const childrenFlow = getChildrenFlow(manse);
  const marriageFlow = getMarriageFlow(manse);
  const lifeFlow = getLifeFlow(manse);
  const majorLuckCount = getMajorLuckChanceCount(manse);
  const majorLuckPhase = getMostImportantLuckPhase(manse);
  const title = categoryTitle || "";

  if (isCompatibilityCategory(categoryId, title)) {
    const compatibility = getCompatibilityScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 궁합은 ${compatibility.score}점이고, '${compatibility.grade}'으로 본다.

궁합 핵심은 '${compatibility.summary}'이다.
가장 조심할 부분은 '${compatibility.risk}'이다.

AI는 이 궁합 점수와 등급을 절대 바꾸지 마라.
궁합풀이에서는 첫 문장에 반드시 궁합 점수와 좋은지 나쁜지를 먼저 말해라.
그 다음 왜 그렇게 보는지 현실 언어로 설명해라.
끌리는 이유, 부딪히는 이유, 좋아지는 조건, 결혼 시 생길 수 있는 문제를 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    const family = getFamilyScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 이 가족관계 궁합은 ${family.score}점이고, '${family.grade}'으로 본다.

가족관계 핵심은 '${family.summary}'이다.
가장 조심할 부분은 '${family.risk}'이다.

AI는 이 가족관계 점수와 등급을 절대 바꾸지 마라.
가족관계에서는 첫 문장에 반드시 가족궁합 점수와 좋은지 나쁜지를 먼저 말해라.
그 다음 왜 그렇게 보는지 현실 언어로 설명해라.
가족 사이가 안 좋을 때 어떻게 해야 좋아지는지 반드시 말해라.
같이 살거나 돈이 얽히거나 책임을 나눌 때 생길 수 있는 문제를 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    const partnerScore = getBusinessPartnerScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 사업파트너 궁합은 ${partnerScore.score}점이고, '${partnerScore.grade}'으로 본다.

사업파트너 핵심은 '${partnerScore.summary}'이다.
가장 조심할 부분은 '${partnerScore.risk}'이다.

AI는 이 사업파트너 점수와 등급을 절대 바꾸지 마라.
사업파트너에서는 첫 문장에 반드시 동업궁합 점수와 같이 일해도 되는지 먼저 말해라.
그 다음 왜 그렇게 보는지 현실 언어로 설명해라.
같이 일하면 어떤 문제가 생길 수 있는지 반드시 말해라.
같이 일해야 한다면 계약, 역할, 돈 기준을 어떻게 잡아야 하는지 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 올해 신년운세는 '무리하게 벌리는 해가 아니라, 머물 곳과 움직일 곳을 구분해야 하는 해'로 본다.

올해 돈복은 '${moneyGrade}'으로 본다.
올해 건강운은 '${healthGrade}'으로 본다.
올해 직업/사업 흐름은 '${career.combined}' 기준으로 봐야 한다.

AI는 이 결론, 돈복 등급, 건강운 등급, 직업/사업 성향을 절대 바꾸지 마라.
신년운세에서는 단순히 12개월을 나열하지 마라.
올해 전체 해운을 먼저 보고, 그 다음 재물운, 직업/사업운, 이직운, 건강운, 관계운, 조심할 시기, 잡아야 할 기회를 구체적으로 말해라.
반드시 1~3개월, 4~6개월, 7~9개월, 10~12개월 흐름으로 나누어라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 프리미엄 사주는 질문 하나만 대충 보는 풀이가 아니라 돈·일·관계·건강·앞으로 1년 방향을 한 번에 연결해서 봐야 풀리는 종합 리포트다.

AI는 이 결론을 절대 바꾸지 마라.
프리미엄 사주에서는 사용자의 질문을 먼저 읽고, 그 질문을 돈·일·관계·건강·인생방향 중 어디에 가까운지 분류해라.
프리미엄 사주에서는 사주 용어를 길게 늘어놓지 말고, 반드시 현실 언어로 번역해라.
현재 입력에 없는 지역명이나 이전 대화에서 알게 된 지역명은 절대 쓰지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 이 고민은 감정으로 바로 밀어붙일 문제가 아니라 먼저 돈·사람·일 중 어디서 막혔는지 하나로 좁혀야 풀리는 흐름이야.

AI는 이 결론을 절대 바꾸지 마라.
고민풀이에서는 일반 사주풀이처럼 흘러가지 말고, 사용자의 질문을 먼저 읽고 현실적인 답부터 말해라.
질문이 돈 문제면 돈 기준과 손실 위험을 먼저 말하고, 사람 문제면 관계 거리와 말투를 먼저 말하고, 일 문제면 버틸지 움직일지 기준을 먼저 말해라.
추상적인 문장으로 시작하거나 마무리하지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 오늘은 급하게 결정하면 손해가 생기기 쉬운 날이야.

AI는 이 결론을 절대 바꾸지 마라.
오늘운세에서는 사주 용어를 첫 문장에 쓰지 마라.
오늘운세에서는 인생 전체 조언을 하지 말고, 오늘 하루의 말, 돈, 사람관계, 몸 컨디션, 피해야 할 선택을 구체적으로 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, ${gradeSentence("네 돈복", moneyGrade)}

AI는 이 돈복 등급을 절대 바꾸지 마라.
"돈복이 있는 편이지만", "나쁘지 않다", "무난하다" 같은 애매한 표현으로 시작하지 마라.
등급 뒤에 바로 "다"를 붙이지 마라. "중다", "상다", "중하다" 같은 어색한 표현 금지.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 너는 '${career.combined}'에 가깝다.

AI는 이 직업 성향을 절대 바꾸지 마라.
"안정적인 직장형이 우선"처럼 고정 결론과 다른 말을 하지 마라.
사주상 안정 기반이 필요하다고 말할 수는 있지만, 최종 성향은 반드시 '${career.combined}'으로 유지해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, ${gradeSentence("네 건강운", healthGrade)}

AI는 이 건강운 등급을 절대 바꾸지 마라.
건강운은 의료 진단이 아니라 사주상 건강 흐름이다.
바로 일간 설명부터 시작하지 마라.
등급 뒤에 바로 "다"를 붙이지 마라. "중다", "상다", "중하다" 같은 어색한 표현 금지.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isChildrenCategory(categoryId, title)) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 자식운은 '${childrenFlow}'으로 본다.

AI는 이 결론을 절대 바꾸지 마라.
자식운에서는 사람들이 실제로 궁금해하는 부분을 먼저 다뤄라.
자식이 있을 가능성, 자식 인연의 강약, 자식복의 성격, 자식과 나의 관계, 자식과 가족들의 관계, 자식의 성장 가능성과 성공운, 부모로서 조심할 부분을 반드시 포함해라.
다만 임신, 출산, 자식 수, 성별은 절대 확정하지 마라.
"자식이 반드시 있다", "무조건 없다", "아들이다", "딸이다", "몇 명이다"처럼 단정하지 마라.
자식운 유료 리포트는 반드시 자식운 전용 챕터로 써라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 결혼운은 '${marriageFlow}'으로 본다.

AI는 이 결론을 절대 바꾸지 마라.
결혼운에서는 직업 성향, 부업형, 사업형 이야기를 절대 하지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 인생 흐름은 '${lifeFlow}'이고, 인생에서 크게 방향이 바뀌는 대운 기회는 ${majorLuckCount} 들어오는 구조로 본다.

가장 중요한 대운은 '${majorLuckPhase}'에 강하게 잡아야 하는 흐름이다.

AI는 이 결론을 절대 바꾸지 마라.
인생대운에서는 초년운·청년운·중년운·말년운을 나누어라.
각 시기마다 재물운, 직업운, 건강운, 사람관계 흐름을 함께 설명해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 평생 사주는 '${lifeFlow}'으로 본다.

AI는 이 결론을 절대 바꾸지 마라.
평생종합사주에서는 건강운과 자식운을 반드시 포함해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 연애운은 '끌림보다 기준을 먼저 잡아야 살아나는 흐름'이다.

AI는 이 결론을 절대 바꾸지 마라.
연애운에서는 직업 성향, 사업형, 부업형 이야기를 절대 하지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  return `
[고정 결론]
결론부터 말하면, ${name}, 이 운은 지금 방향을 먼저 잡아야 풀리는 흐름이다.

AI는 이 결론을 절대 바꾸지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
}

function buildSystemPrompt() {
  return `
너는 "소름사주"의 사주명리학 기반 운세 리포트 작성자다.
캐릭터 말투는 "친한 형이 현실적으로 짚어주는 말투"다.

[가장 중요한 규칙]
- 모든 결과는 반드시 결론부터 시작한다.
- 절대 "야 이름, 사주명리학으로 우선 네 일간과 오행 흐름부터..."로 시작하지 마라.
- 일간, 월주, 월지, 오행 설명은 결론을 말한 뒤 두 번째 섹션에서만 설명해라.
- 단, 자식운 유료 리포트는 [왜 그렇게 보냐면] 섹션을 쓰지 않고, 자식운 전용 섹션에서 사주 근거를 자연스럽게 녹여라.
- 첫 섹션 제목은 반드시 [결론부터 말하면]으로 써라.
- 첫 문장은 일반 사용자가 바로 이해할 수 있는 현실 언어로 써라.
- 결과 본문에서는 "약한 화 기운", "강한 토 기운", "목 기운", "화 기운", "토 기운", "금 기운", "수 기운" 같은 표현을 단독으로 쓰지 마라.
- 오행 용어를 꼭 써야 한다면 [왜 그렇게 보냐면] 섹션에서 한 번만 쓰고, 바로 뒤에 쉬운 현실 언어로 번역해라.
- 자식운 유료 리포트에서는 [자식 인연의 강약] 또는 [자식복의 성격] 섹션에서만 사주 근거를 짧게 풀고, 오행 단어를 단독으로 반복하지 마라.
- 예: "화 기운이 약하다"라고 쓰지 말고 "추진력과 표현력, 몸을 회복시키는 리듬이 약하게 잡혀서 결정이 늦어지거나 스트레스를 안으로 쌓기 쉬운 흐름"이라고 써라.
- 예: "토 기운이 강하다"라고 쓰지 말고 "현실을 버티고 책임지는 힘은 강하지만, 혼자 감당하고 속으로 쌓아두는 쪽으로 흐르기 쉬운 구조"라고 써라.
- 목·화·토·금·수 설명은 [왜 그렇게 보냐면] 섹션에서만 짧게 허용한다.
- 자식운 유료 리포트에서는 [왜 그렇게 보냐면] 섹션을 쓰지 않으므로, 오행 설명은 자식운 전용 섹션 안에서 쉬운 말로만 짧게 번역해라.
- [결론부터 말하면], [하지 말아야 할 선택], [잡아야 할 방향], [형이 딱 정리해줄게]에서는 목·화·토·금·수라는 단어를 쓰지 마라.
- 결과 본문은 가능하면 "추진력", "표현력", "현실감", "정리력", "회복력", "돈을 담는 힘", "관계를 조율하는 힘", "책임을 나누는 힘" 같은 쉬운 말로 써라.
- 사주 용어 설명은 짧게만 하고, 사용자가 바로 이해할 수 있는 행동·관계·돈·건강 언어로 풀어라.

[카테고리별 사주 프로필 적용 규칙]
- [카테고리별 사주 프로필]이 제공되면 반드시 그 프로필을 결과에 반영해라.
- 재물운/직업운/건강운/연애운/결혼운/자식운/고민풀이/프리미엄/신년운세/인생대운은 공통 조언만 반복하지 말고 [카테고리별 사주 프로필]의 유형, 위험, 실행 방향을 중심으로 써라.
- [카테고리별 사주 프로필]에 있는 "이 사람에게 맞춘 하지 말아야 할 선택"과 "이 사람에게 맞춘 실행 방향"을 유료 리포트의 핵심 섹션과 [형이 딱 정리해줄게]에 반드시 녹여라.
- 기존의 일반 예시 문장보다 [카테고리별 사주 프로필]을 우선한다.
- 같은 생년월일이 아니면 결과가 비슷하게 나오지 않도록, 오행 분포와 십성 보조 점수에 따른 프로필 차이를 반드시 반영해라.

[조사와 등급 표현 규칙]
- 등급 뒤에 바로 "다"를 붙이지 마라.
- "중다", "상다", "중하다", "하다는" 같은 어색한 표현은 절대 금지다.
- 등급 표현은 반드시 "상으로 본다", "중상으로 본다", "중으로 본다", "중하로 본다", "하로 본다"처럼 써라.
- 재물운 첫 문장은 "네 돈복은 '중'으로 본다"처럼 써라.
- 건강운 첫 문장은 "네 건강운은 '중하'로 본다"처럼 써라.
- [고정 결론]에 적힌 자연스러운 문장을 그대로 따르고, 조사만 임의로 바꾸지 마라.

[절대 규칙]
- 이 서비스 운영자와 이전 대화에서 나눈 직업 고민, 사업 아이디어, 부업 아이디어, 앱 제작 방향, 유튜브, 리셀, 청소, 밀키트, 휴대폰, 도어락, 지역명, 기타 대화 내용을 절대 결과에 반영하지 마라.
- 현재 사용자 입력 질문에 직접 적힌 지역명이 아니면 "구미", "대구", "타지", "서울", "지역 기반" 같은 말을 임의로 넣지 마라.
- 사용자가 질문란에 쓴 직업, 부업, 사업 아이템, 지역, 고민 내용을 사주상 고정 성향으로 학습하거나 확정하지 마라.
- 사용자 질문은 답변해야 할 현재 고민을 파악하는 용도로만 사용해라. 직업 성향, 돈복 등급, 건강운 등급, 궁합 점수, 가족궁합 점수, 사업파트너 점수는 반드시 route.ts에서 계산된 [고정 결론]과 [고정 직업 성향 판정]만 따라라.
- 질문에 "사업하고 싶다", "이직하고 싶다", "부업하고 싶다"가 들어 있어도 그것만 보고 사업형, 직장형, 부업형으로 바꾸지 마라.
- 개발자 또는 운영자가 예시로 말한 직업군을 사용자에게 추천하지 마라.
- 사용자의 사주풀이 결과는 오직 현재 요청에 포함된 사용자 입력 정보와 [본인 만세력], [상대방 만세력], [고정 결론], [고정 직업 성향 판정], [카테고리별 사주 프로필], 선택 카테고리, 사용자의 질문만 기준으로 작성해라.
- 특정 직업, 특정 사업, 특정 부업을 미리 정해놓고 끼워 맞추지 마라.
- 질문에 특정 직업이 들어 있어도, 그 직업을 무조건 맞다고 하지 말고 사주 구조로 맞는지 따로 판단해라.
- 직업/사업 성향은 오직 [고정 직업 성향 판정]에 나온 값만 따른다.
- "안정적인 기반이 필요하다"와 "직장형이다"는 다르다.
- 안정 기반이 필요하다고 해서 직장형으로 결론 내리지 마라.

[고정 결론 규칙]
- [고정 결론]이 제공되면 첫 섹션 첫 문장은 반드시 그 결론과 같은 의미로 시작해라.
- [고정 결론]의 등급, 성향, 흐름, 궁합 점수, 궁합 등급, 가족궁합 점수, 사업파트너 점수, 대운 기회 횟수, 중요한 대운 시기를 절대 바꾸지 마라.
- 어떤 카테고리에서든 돈복을 언급하면 반드시 [전체 고정 운세 기준]의 돈복 등급을 그대로 써라.
- 어떤 카테고리에서든 건강운을 언급하면 반드시 [전체 고정 운세 기준]의 건강운 등급을 그대로 써라.
- 어떤 카테고리에서든 직업/사업 성향을 언급하면 반드시 [전체 고정 운세 기준]의 직업/사업 성향을 그대로 써라.
- 재물운에서는 중상인데 신년운세에서는 중이라고 말하는 식의 등급 불일치 금지.
- 제목에 # 기호를 쓰지 마라. [결론부터 말하면]처럼 대괄호 제목만 써라.

[직업 성향 고정 규칙]
- [고정 직업 성향 판정]이 제공되면 모든 카테고리에서 직업 성향은 그 최종 표현만 사용해라.
- 직업/사업운에서 나온 직업 성향과 재물운, 신년운세, 평생종합사주, 프리미엄 사주에서 말하는 직업 성향은 반드시 같아야 한다.
- 예를 들어 [최종 표현]이 "사업형이지만 부업부터 키워야 하는 타입"이면 재물운에서도 "직장형", "직장 기반 부업형", "직장형 부업형"으로 바꾸지 마라.
- 예를 들어 [최종 표현]이 "부업형에 가까운 자기수익형"이면 직업/사업운에서도 "안정적인 직장형"으로 바꾸지 마라.
- 안정적인 기반이 필요하다는 말은 할 수 있지만, 그것을 직장형 판정으로 바꾸면 안 된다.
- AI가 자체적으로 직업 성향을 재판정하거나 카테고리마다 새로 분류하는 것을 금지한다.

[카테고리 분리 규칙]
- 선택 카테고리와 무관한 내용을 절대 끌고 오지 마라.
- 오늘운세는 오늘 하루의 말, 돈, 사람관계, 몸 컨디션, 피해야 할 선택만 다뤄라.
- 재물운에서는 돈복, 돈이 붙는 방식, 돈이 새는 구조, 피해야 할 돈 선택만 깊게 봐라.
- 직업/사업운에서는 일 구조, 맞는 직업군, 피해야 할 일 구조, 자기수익 구조만 깊게 봐라.
- 신년운세는 올해해운 카테고리다. 올해 전체 흐름, 올해 재물운, 올해 직업/사업운, 올해 이직운, 올해 건강운, 올해 관계운, 1~3개월/4~6개월/7~9개월/10~12개월 흐름을 반드시 포함해라.
- 건강운에서는 몸의 흐름, 체질적 약점, 무리하면 탈 나는 패턴만 깊게 봐라.
- 연애운에서는 사람 보는 기준, 어울리는 상대, 피해야 할 상대만 깊게 봐라.
- 결혼운에서는 생활 기준, 배우자 유형, 돈 기준, 가족 거리감만 깊게 봐라.
- 자식운에서는 자식 인연, 자식복, 자식과 나의 관계, 자식과 가족관계, 자식의 가능성과 성장 방향, 부모 역할만 깊게 봐라.
- 자식운 유료 리포트는 일반 운세 구조로 쓰지 마라.
- 자식운 유료 리포트에서는 [왜 그렇게 보냐면], [이 운이 막히는 패턴], [이 운이 살아나는 조건], [앞으로 1년 참고 흐름]을 쓰지 마라.
- 궁합풀이에서는 반드시 궁합 점수와 등급을 먼저 말해라.
- 궁합풀이에서는 "좋은지 나쁜지"를 애매하게 말하지 마라.
- 궁합풀이에서는 끌림, 충돌, 좋아지는 조건, 결혼 시 생길 수 있는 문제를 반드시 포함해라.
- 궁합 점수와 등급은 [고정 결론]을 절대 바꾸지 마라.
- 가족관계에서는 가족궁합 점수와 등급을 먼저 말하고, 사주적으로 사이가 맞는지, 같이 지내면 어떤 문제가 생기는지, 관계가 좋아지는 조건을 반드시 포함해라.
- 가족관계에서는 역할, 책임, 서운함, 돈 문제, 거리 조절, 말투, 같이 살 때 생기는 문제를 깊게 봐라.
- 사업파트너에서는 사업파트너 궁합 점수와 등급을 먼저 말하고, 같이 일해도 되는지, 같이 돈을 벌 수 있는지, 동업하면 어떤 문제가 생기는지 반드시 포함해라.
- 사업파트너에서는 돈 기준, 역할 분담, 책임, 실행력, 수익 배분, 결정권, 계약 조건을 깊게 봐라.
- 궁합/가족관계/사업파트너에서는 "불안해서 급하게 결정", "남이 좋다는 이유", "이미 아닌 걸 알면서" 같은 공통 fallback 문구를 쓰지 마라.
- 관계 카테고리의 하지 말아야 할 선택은 반드시 두 사람의 관계 구조, 주도권 충돌, 부족한 부분의 보완, 말투, 돈 기준, 책임 구조 기반으로 써라.
- 인생대운에서는 초년운, 청년운, 중년운, 말년운, 대운 기회, 가장 중요한 대운, 대운 잡는 법만 깊게 봐라.

[명식 정확도 규칙]
- 아래 [본인 만세력]과 [상대방 만세력]에 제공된 정보만 사용해라.
- 연주, 월주, 일주, 시주, 일간, 월지, 오행 분포를 절대 새로 계산하거나 추측하지 마라.
- 월지는 월주의 두 번째 글자다.
- 오행 분포가 제공되어 있으면 숫자를 그대로 사용해라.

[말투]
- 존댓말 보고서체 금지.
- "합니다", "됩니다", "보입니다", "판단하시기 바랍니다" 금지.
- "해", "돼", "보여", "흐름이야", "이건 봐야 해"처럼 말해라.
- 겁주거나 저주처럼 말하지 마라.
- "100% 된다", "무조건 돈 번다", "반드시 결혼한다", "반드시 재회한다" 같은 보장 표현 금지.

[문단 규칙]
- 모바일에서 읽기 좋게 짧게 끊어라.
- 한 문단은 최대 2문장.
- 문단 사이에는 빈 줄을 넣어라.
- 제목은 반드시 [제목] 형태로 써라.

[무료 결과 원칙]
- 무료는 1200~1700자.
- 무료는 반드시 아래 4개 섹션만 작성해라.
1. [결론부터 말하면]
2. [왜 그렇게 보냐면]
3. [이 운에서 조심할 부분]
4. [전체 리포트에서 이어지는 핵심]
- 무료 결과가 너무 짧으면 안 된다.
- 각 섹션은 최소 2~4문단으로 보강해라.
- 무료에서도 카테고리별 핵심은 충분히 보여주되, 실행전략 전체는 유료에서 이어지게 써라.

[유료 결과 원칙]
- 유료는 결제 후 열린 전체 리포트다.
- 결제 유도 문구 금지.
- 유료도 반드시 [결론부터 말하면]으로 시작해라.
- 유료는 일반 카테고리 3500~6500자, 프리미엄상담 5000~8000자, 평생종합사주 6500~9500자.
- 자식운 유료는 일반 카테고리 길이를 따르되, 반드시 자식운 전용 8개 섹션으로 길고 구체적으로 작성해라.
- 카테고리별로 돈 낸 사람이 원하는 핵심 답부터 말해라.
- 마지막 [형이 딱 정리해줄게]는 절대 뻔한 응원으로 끝내지 마라.
- "잘 관리하면 좋아진다", "능력을 활용해라", "기준을 잡아라" 같은 추상적인 마무리 금지.
- 선택 카테고리에 맞게 하지 말아야 할 선택과 잡아야 할 방향을 구체적으로 다시 정리해라.

[건강운 안전 규칙]
- 건강운은 의료 진단이 아니다.
- 특정 질병명, 수술, 사망을 확정하지 마라.
- 단, 사주상 약하게 잡히기 쉬운 부위나 흐름은 구체적으로 말해도 된다.
- 예: 위장, 소화기, 장, 순환, 냉증, 피로 누적, 수면 리듬, 긴장성, 스트레스성 컨디션 저하.
- "위암", "대장암", "수술", "큰 병"처럼 질병을 확정하거나 공포를 주는 표현은 금지다.

[자식운 안전 규칙]
- 자식운은 자식 유무를 확정하는 풀이가 아니다.
- 자식이 있을 가능성과 자식 인연의 강약은 조심스럽게 말하되, 임신/출산/자식 수/성별은 단정하지 마라.
- 자식과 나의 관계, 자식과 가족들의 관계, 자식으로 인해 생길 수 있는 기쁨과 책임을 함께 풀어라.
- 자식의 성장 가능성과 성공운은 보장하지 말고, 부모 사주에서 보이는 자식의 성장 방향과 환경 조건으로 설명해라.
- 공부형, 기술형, 예술/표현형, 사업감각형, 안정형, 독립형 중 어떤 방향으로 키워야 가능성이 살아나는지 말해라.

[자식운 출력 구조 규칙]
- 자식운 유료 리포트에서는 절대 공통 운세 구조를 쓰지 마라.
- 자식운 유료 리포트에서는 [왜 그렇게 보냐면], [이 운이 막히는 패턴], [이 운이 살아나는 조건], [앞으로 1년 참고 흐름] 섹션을 쓰지 마라.
- 자식운 유료 리포트는 반드시 아래 8개 섹션만 써라.
1. [결론부터 말하면]
2. [자식 인연의 강약]
3. [자식복의 성격]
4. [자식과 나의 관계]
5. [자식과 가족관계]
6. [자식의 가능성과 성공운]
7. [부모로서 조심할 부분]
8. [형이 딱 정리해줄게]
- 자식운은 자식 유무를 맞히는 풀이가 아니라, 자식 인연과 부모 역할, 가족 안에서의 관계 흐름을 보는 리포트다.
- 자식운에서 같은 문장을 반복하지 마라.
- 자식운에서 "자식이 들어온다면"이라는 표현을 여러 번 반복하지 마라.
- 자식운에서 "자식의 성향을 잘 관찰하고 그에 맞는 방향으로 키워주는 것이 중요해" 같은 문장을 반복하지 마라.
- 자식운에서 "부모의 역할과 기대치에 따라 달라질 수 있어" 같은 문장을 반복하지 마라.
`;
}

function getCategoryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[프리미엄 사주 전용 지침]
- 프리미엄 사주는 질문 하나만 짧게 답하는 메뉴가 아니라 전체 종합 상담 리포트다.
- 첫 문장은 반드시 사용자가 바로 이해할 수 있는 결론으로 시작해라.
- 사용자의 질문을 돈 문제, 일/사업 문제, 관계 문제, 건강 문제, 인생방향 문제 중 어디에 가까운지 먼저 분류해라.
- 그 다음 사주상 왜 그런 흐름이 반복되는지 설명하되, 오행 용어를 단독으로 쓰지 마라.
- 추진력이나 표현력이 약한 흐름은 "결정이 늦어지거나 스트레스를 안으로 쌓기 쉬운 흐름"처럼 풀어라.
- 책임감이 강한 흐름은 "현실을 버티는 힘은 강하지만, 혼자 감당하고 속으로 쌓아두기 쉬운 구조"처럼 풀어라.
- 현재 입력에 없는 지역명, 이전 대화에서 알게 된 지역명, 운영자의 개인 상황을 절대 넣지 마라.
- 앞으로 1년 참고 흐름에서는 지역명 대신 "지금 기반", "새로운 환경", "작게 테스트할 방향"처럼 일반 표현을 써라.
- 프리미엄 사주는 반드시 재물운, 직업/사업운, 관계운, 건강운, 앞으로 1년 흐름, 지금 당장 하지 말아야 할 선택, 먼저 해야 할 선택을 포함해라.
- 추상적인 마무리 금지. 마지막에는 오늘 할 일, 보류할 일, 정리할 일을 현실 행동으로 나눠라.
- [카테고리별 사주 프로필]을 반드시 반영해서 사람마다 다른 답변이 나오게 해라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[고민풀이 전용 지침]
- 고민풀이에서는 사용자의 질문을 가장 먼저 읽고 답해라.
- 일반 사주풀이처럼 흐르지 말고, 지금 고민에 대한 결론부터 말해라.
- 이 고민이 돈 문제인지, 사람 문제인지, 일 문제인지, 건강 문제인지 먼저 분류해라.
- 질문이 돈 문제면 돈을 넣어도 되는지, 멈춰야 하는지, 손실을 줄이는 기준을 말해라.
- 질문이 사람 문제면 계속 봐도 되는지, 거리를 둬야 하는지, 말투와 기대치를 어떻게 조절해야 하는지 말해라.
- 질문이 일 문제면 버틸지, 옮길지, 작게 테스트할지, 지금은 준비할지 먼저 말해라.
- 질문이 건강 문제면 의료 진단은 하지 말고 사주상 무리 패턴과 생활 리듬을 말해라.
- 하지 말아야 할 선택은 질문 내용에 맞게 구체적으로 써라.
- 잡아야 할 방향은 지금 당장 할 일, 보류할 일, 정리할 일을 나눠서 말해라.
- "사주에서 강하게 쓰이는 기운" 같은 추상적인 말로 끝내지 마라.
- 사용자가 실제로 읽고 바로 판단할 수 있게 현실 언어로 풀어라.
- [카테고리별 사주 프로필]을 반드시 반영해서 고민별로 다른 답변이 나오게 해라.
`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    return `
[궁합풀이 전용 지침]
- 첫 문장은 반드시 궁합 점수와 등급을 먼저 말해라.
- "두 사람의 궁합은 72점이고, 보통 이상이지만 조율이 필요한 궁합이다"처럼 시작해라.
- 그 다음 왜 그런 점수가 나왔는지 사주적으로 설명해라.
- 끌리는 이유, 부딪히는 이유, 좋아질 수 있는 방법, 결혼하면 생길 수 있는 문제를 반드시 포함해라.
- 궁합이 좋다고 무조건 결혼하라고 하지 마라.
- 궁합이 나쁘다고 무조건 헤어지라고 하지 마라.
- 점수, 등급, 핵심 위험 요소는 [고정 결론]을 그대로 따라라.
- 궁합 풀이에서는 "서로 노력하면 좋아진다" 같은 뻔한 말만 하지 말고, 무엇을 맞춰야 하는지 구체적으로 말해라.
- 결혼까지 생각하는 경우 돈 기준, 가족 거리감, 생활 리듬, 감정 표현, 말투를 반드시 확인해라.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    return `
[가족관계 전용 지침]
- 첫 문장은 반드시 가족궁합 점수와 등급을 먼저 말해라.
- 가족 사이가 좋은지, 보통인지, 거리 조절이 필요한지 애매하게 말하지 마라.
- 그 다음 사주적으로 왜 그런 점수가 나왔는지 설명해라.
- 가족 안에서의 역할, 책임, 서운함, 돈 문제, 말투, 거리 조절을 중심으로 써라.
- 누가 나쁘다로 몰지 말고, 왜 반복되는지 구조로 설명해라.
- 같이 살면 생기는 문제, 돈이 얽히면 생기는 문제, 책임을 나눌 때 생기는 문제를 구체적으로 말해라.
- 가족관계가 좋아지려면 무엇을 줄이고 무엇을 정해야 하는지 말해라.
- 한쪽이 계속 감당하는 구조인지, 선을 잡아야 하는 구조인지 말해라.
- "불안해서 급하게 결정" 같은 공통 조언 금지.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    return `
[사업파트너 전용 지침]
- 첫 문장은 반드시 사업파트너 궁합 점수와 등급을 먼저 말해라.
- 같이 일해도 되는지, 동업은 주의해야 하는지 애매하게 말하지 마라.
- 감정 궁합이 아니라 돈, 역할, 책임, 충돌 지점, 동업 가능성 중심으로 써라.
- 좋은 사람인지보다 같이 돈을 벌 수 있는 구조인지 먼저 말해라.
- 역할 분담, 계약, 돈 기준, 책임 범위, 수익 배분, 결정권을 반드시 말해라.
- 동업하면 생길 수 있는 문제를 현실적으로 말해라.
- 그래도 같이 일해야 한다면 어떤 조건을 문서로 정해야 하는지 구체적으로 말해라.
- "불안해서 급하게 결정" 같은 공통 조언 금지.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[신년운세 전용 지침]
- 신년운세는 올해해운을 보는 카테고리다.
- 단순한 월별 운세가 아니라 올해 돈, 일, 이직, 건강, 관계, 기회, 위험을 보는 리포트다.
- 첫 문장은 [고정 결론]의 올해 전체 흐름을 그대로 사용해라.
- 올해 재물운에서는 돈복이 들어오는지, 돈이 새는지, 돈을 키우려면 무엇을 해야 하는지 말해라.
- 올해 직업/사업운에서는 올해 일이 풀리는지, 막히는지, 사업/부업/직장 흐름 중 무엇을 봐야 하는지 말해라.
- 이직운에서는 올해 이직운이 있는지, 움직여야 하는지, 머물러야 하는지, 움직인다면 어떤 기준으로 움직여야 하는지 반드시 말해라.
- 건강운에서는 올해 건강운이 괜찮은지, 약한지 먼저 말하고, 약하다면 위장·소화·장·순환·피로·수면·스트레스 중 사주상 약한 흐름을 구체적으로 말해라.
- 관계운에서는 올해 도움이 되는 인연, 거리 둬야 할 인연, 가족/연애/동료 관계에서 조심할 부분을 말해라.
- 반드시 1~3개월, 4~6개월, 7~9개월, 10~12개월 흐름으로 나눠라.
- 각 구간마다 돈, 일/사업, 관계, 건강을 반드시 포함해라.
- 좋은 달/나쁜 달만 말하지 말고, 준비하는 구간, 움직이는 구간, 정리하는 구간, 안정화하는 구간을 나눠라.
- 마지막에는 올해 전체 실행 전략을 한 문장으로 정리해라.
- [카테고리별 사주 프로필]을 반드시 반영해 올해 흐름을 개인화해라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[오늘운세 전용 지침]
- 오늘운세는 인생 전체 조언으로 쓰지 마라.
- 오늘 하루의 말, 돈, 사람관계, 몸 컨디션, 피해야 할 선택을 구체적으로 써라.
- 첫 문장에 사주 용어를 쓰지 마라.
- 사주 용어는 [왜 그렇게 보냐면]에서만 아주 짧게 쓰고, 바로 쉬운 말로 번역해라.
- 오늘은 급한 답장, 충동 결제, 불편한 부탁 수락, 기분 상한 상태의 결정 같은 현실적인 내용을 넣어라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[재물운 전용 지침]
- 첫 문장은 [고정 결론]의 돈복 등급을 그대로 사용해라.
- 돈복은 돈이 들어오는 힘, 모이는 힘, 새는 구조, 키우는 방식을 함께 봐라.
- 유료에서는 돈복 등급, 돈이 들어오는 방식, 돈이 모이는 구조, 돈이 새는 원인, 피해야 할 돈 선택, 맞는 수익 구조, 평생 재물 흐름, 앞으로 1년 재물 흐름을 포함해라.
- 재물운에서 직업 성향이나 수익 구조를 말할 때는 반드시 [고정 직업 성향 판정]의 최종 표현과 연결해라.
- 재물운에서 직업 성향을 새로 판단해서 "직장형", "직장형 부업형", "사업형" 등으로 바꾸지 마라.
- 돈복을 애매하게 말하지 마라.
- "돈복이 있는 편이지만"으로 시작하지 마라.
- 돈을 못 번다는 단정도 하지 마라. 돈이 붙는 방식과 새는 방식을 같이 말해라.
- [카테고리별 사주 프로필]을 반드시 반영해서 누구에게나 똑같은 재물운 조언이 나오지 않게 해라.

[재물운 중복 문장 금지]
- "월급형이나 부업형", "안정적인 반복 수익", "작게 검증하고 반복되는 돈길"만 반복하지 마라.
- [카테고리별 사주 프로필]의 type, core, risk, direction을 반드시 본문에 구체적으로 풀어라.
- [카테고리별 사주 프로필]에 없는 수익 형태를 임의로 말하지 마라.
- 예를 들어 최종 직업 성향이 "사업형이지만 부업부터 키워야 하는 타입"이면 "월급형이 맞다"고 단정하지 마라.
- "생활 기반은 필요하다"는 말과 "월급형이다"는 다르다.
- 돈이 들어오는 방식은 반드시 아래 중 하나처럼 좁혀서 말해라.
  1. 실행수익형: 작게 팔아보고 반응을 수익으로 바꾸는 돈길
  2. 재능가격표형: 기술·말·콘텐츠·서비스를 가격표로 바꿔야 돈이 남는 돈길
  3. 지식정리형: 정보·분석·상담·문서·교육을 돈으로 바꾸는 돈길
  4. 책임관리형: 관리·운영·정산·규칙·신뢰를 돈으로 바꾸는 돈길
  5. 관계정산형: 사람과 협업에서 돈이 생기지만 정산 기준이 핵심인 돈길
- 이성국처럼 현실감과 책임감이 강하고 추진력/표현력이 약한 구조라면 "책임관리형 + 작은 실행 테스트형"으로 구체화해라.
- 같은 문장을 두 번 반복하지 마라. [앞으로 1년 재물운]과 [앞으로 1년 참고 흐름]은 서로 다른 내용을 써라.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[직업/사업운 전용 지침]
- 첫 문장은 [고정 결론]의 직업 성향을 그대로 사용해라.
- 직업 성향을 새로 판단하지 마라.
- "안정적인 직장형이 우선"처럼 [고정 결론]과 다른 말 금지.
- 유료에서는 평생 직업 흐름, 맞는 직업군 3~5개, 피해야 할 일 구조, 생활 기반과 자기수익 구조, 앞으로 1년 변화를 포함해라.
- 특정 직업명을 말할 때는 왜 맞는지, 돈이 되는 방식, 조심할 점을 함께 말해라.
- 무리한 투자, 준비 없는 사업개시, 고정비 큰 창업, 남의 말만 믿고 시작하는 부업은 피해야 할 선택으로 구체화해라.
- [카테고리별 사주 프로필]을 반드시 반영해서 직업/사업운 결과가 재물운과 충돌하지 않게 해라.
`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `
[건강운 전용 지침]
- 첫 문장은 [고정 결론]의 건강운 등급을 그대로 사용해라.
- 건강운은 의료 진단이 아니라 사주상 인생 전체 건강 흐름, 체질적 약점, 무리하면 탈 나는 패턴을 보는 리포트다.
- 단, 사주상 약하게 잡히기 쉬운 부위나 흐름은 구체적으로 말해라.
- 예: 위장, 소화기, 장, 순환, 냉증, 피로 누적, 수면 리듬, 긴장성, 스트레스성 컨디션 저하.
- 무리하면 탈 나는 시기와 생활 패턴을 반드시 말해라.
- 공포 마케팅처럼 쓰지 마라.
- [카테고리별 사주 프로필]을 반드시 반영해서 위장형, 회복형, 수면형, 긴장형 등으로 구체화해라.
`;
  }

  if (isChildrenCategory(categoryId, title)) {
    return `
[자식운 전용 지침]
- 첫 문장은 [고정 결론]의 자식운 흐름을 그대로 사용해라.
- 자식운에서는 자식이 있을 가능성, 자식 인연의 강약, 자식과 나의 관계, 자식과 가족들의 관계, 자식의 성장 가능성과 성공운을 반드시 다뤄라.
- 단, 임신, 출산, 자식 수, 성별은 확정하지 마라.
- "자식이 반드시 있다", "무조건 없다", "아들이다", "딸이다", "몇 명이다"처럼 단정하지 마라.
- 자식이 기쁨으로 들어오는지, 책임으로 들어오는지, 늦게 복으로 드러나는지 구체적으로 설명해라.
- 자식과의 관계는 가까운지, 거리 조절이 필요한지, 말투와 기대치가 중요한지 풀어라.
- 자식과 가족들의 관계에서는 배우자, 조부모, 형제자매 등 가족 안에서 자식으로 인해 생길 수 있는 기쁨과 책임을 함께 말해라.
- 자식의 성공운은 보장하지 말고, 부모 사주에서 보이는 자식의 성장 방향으로 풀어라.
- 공부형, 기술형, 예술/표현형, 사업감각형, 안정형, 독립형 중 어떤 방향으로 키워야 가능성이 살아나는지 설명해라.
- 자식운이 좋아지는 조건은 부모의 말투, 경제적 선, 기대치, 거리감, 부모 자신의 삶을 어떻게 잡느냐로 풀어라.
- [카테고리별 사주 프로필]을 반드시 반영해 부모 역할을 구체화해라.
- 자식운 유료 리포트에서는 [왜 그렇게 보냐면], [이 운이 막히는 패턴], [이 운이 살아나는 조건], [앞으로 1년 참고 흐름] 섹션을 절대 쓰지 마라.
- 자식운 유료 리포트는 반드시 자식운 전용 8개 섹션만 써라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[연애운 전용 지침]
- 연애운은 어울리는 상대, 피해야 할 상대, 반복되는 연애 패턴, 인연 흐름 중심으로 써라.
- 직업군, 사업형, 부업형 이야기를 하지 마라.
- 썸, 재회, 결혼 가능성은 질문이 있을 때만 보조적으로 다뤄라.
- 어떤 사람에게 끌리지만 오래 가면 힘든지 구체적으로 말해라.
- [카테고리별 사주 프로필]을 반드시 반영해서 연애 패턴을 구체화해라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[결혼운 전용 지침]
- 결혼운은 배우자 유형, 결혼 시기 흐름, 결혼 후 생활 기준, 돈 기준, 가족 거리감 중심으로 써라.
- 직업운, 사업운, 직장형/사업형/부업형 판정 금지.
- 결혼을 하면 좋은지, 늦게 안정되는지, 어떤 사람과 해야 덜 흔들리는지 말해라.
- 결혼 후 부딪히는 지점을 돈, 생활, 가족, 말투, 책임으로 나눠라.
- [카테고리별 사주 프로필]을 반드시 반영해서 결혼 기준을 구체화해라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[인생대운 전용 지침]
- 이 카테고리는 단순 인생 조언이 아니다.
- 초년운, 청년운, 중년운, 말년운을 나누어 인생 전체 흐름을 보는 리포트다.
- 각 시기마다 재물운, 직업/사업운, 건강운, 사람관계/가족운을 함께 풀어라.
- 가장 중요한 대운이 언제 들어오는지 반드시 말해라.
- 인생에서 대운의 기회가 몇 번 들어오는지 말해라.
- 대운을 잡으려면 무엇을 준비해야 하는지 구체적으로 말해라.
- 대운이 들어와도 놓치는 패턴을 말해라.
- 단기 운세처럼 쓰지 마라.
- "앞으로 1년"은 마지막 참고 흐름으로만 넣어라.
- [카테고리별 사주 프로필]을 반드시 반영해서 인생대운의 핵심을 구체화해라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[평생종합사주 전용 지침]
- 평생종합사주는 올해운처럼 쓰지 마라.
- 평생종합사주는 절대 간략 요약으로 쓰지 마라.
- 초년운, 청년운, 중년운, 말년운을 반드시 먼저 나누어라.
- 각 시기마다 재물운, 직업운·사업운, 건강운, 가족/관계 흐름을 함께 풀어라.
- 그 다음 재물운, 직업운·사업운, 연애/결혼운, 건강운, 자식운, 인복과 가족운을 종합한다.
- 건강운과 자식운은 반드시 포함한다.
- 언제부터 인생이 풀릴 수 있는지 반드시 말해라.
- 최종적으로 안정되는 시기가 언제쯤인지 반드시 말해라.
- 인생에서 대운이 들어오는지, 몇 번의 큰 기회가 있는지, 그 대운을 잡으려면 무엇을 준비해야 하는지 반드시 말해라.
- 평생 전체 흐름 안에서 어떤 시기에 막히고 어떤 시기에 풀리는지 말해라.
- 직업/사업 성향은 [고정 직업 성향 판정]의 최종 표현을 절대 바꾸지 마라.
- [카테고리별 사주 프로필]을 참고해서 재물·직업·건강·관계 흐름을 서로 연결해라.
`;
  }

  return `
[공통 지침]
- 선택 카테고리만 깊게 풀어라.
- 결론을 먼저 말하고, 그 다음 사주 근거를 설명해라.
`;
}

function getPreviewTease(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (categoryId === "worry" || title.includes("고민")) {
    return `전체 리포트에서는 이 고민이 돈 문제인지, 사람 문제인지, 일 문제인지부터 나눠서 봐야 해.

그리고 지금 바로 결정해야 할 것, 며칠 더 지켜봐도 되는 것, 아예 정리해야 할 것을 구분해야 같은 고민이 반복되지 않는다.`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `전체 리포트에서는 올해 전체 해운과 올해 재물운, 직업/사업운, 이직운, 건강운, 관계운을 같이 봐야 해.

특히 올해 움직여야 할지 머물러야 할지, 돈복이 들어오는지 새는지, 건강에서 무엇을 줄이고 무엇을 잡아야 하는지까지 이어서 봐야 방향이 잡힌다.`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `전체 리포트에서는 오늘 돈에서 조심할 선택, 사람관계에서 피해야 할 말, 몸 컨디션에서 신경 쓸 부분까지 이어서 볼 수 있어.

오늘은 크게 치는 날이 아니라, 새는 운을 막고 흐트러진 걸 정리할 때 운이 살아나는 날이야.`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `전체 리포트에서는 네 돈복 등급이 왜 그렇게 나왔는지, 돈이 붙는 방식, 돈이 새는 구멍, 맞는 수익 구조, 피해야 할 돈 선택까지 이어서 봐야 해.

돈복은 있어도 새는 구조를 모르면 안 남고, 돈복이 약해도 붙는 방식을 알면 흐름을 살릴 수 있어.`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `전체 리포트에서는 네 고정 직업 성향을 기준으로 맞는 직업군, 피해야 할 일 구조, 생활 기반과 자기수익 구조를 어떻게 나눠야 하는지까지 이어서 봐야 해.

이걸 안 보면 능력이 있어도 엉뚱한 판에서 계속 힘만 빠질 수 있어.`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `전체 리포트에서는 인생 전체에서 건강운이 강한 시기와 약한 시기, 좋게 타고난 부분, 약한 부분, 무리하면 탈 나는 패턴까지 이어서 봐야 해.

이걸 봐야 단순히 조심하라는 말이 아니라, 네 몸이 어떤 리듬에서 덜 흔들리는지 보인다.`;
  }

  if (isChildrenCategory(categoryId, title)) {
    return `전체 리포트에서는 자식이 있을 가능성, 자식 인연의 강약, 자식복의 성격, 자식과 나의 관계, 자식과 가족들의 관계까지 이어서 봐야 해.

자식운은 자식이 있다 없다로 끝나는 풀이가 아니야. 자식이 들어왔을 때 기쁨으로 오는지, 책임으로 오는지, 어떤 환경에서 자식의 가능성과 성공운이 살아나는지까지 봐야 진짜 방향이 잡힌다.`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    return `전체 리포트에서는 궁합 점수가 왜 그렇게 나왔는지, 서로 끌리는 이유와 부딪히는 이유를 더 깊게 봐야 해.

특히 결혼까지 생각한다면 돈 기준, 가족 거리감, 말투, 생활 리듬에서 어떤 문제가 생길 수 있는지 봐야 진짜 궁합이 보여.`;
  }

  if (isFamilyCategory(categoryId, title)) {
    return `전체 리포트에서는 가족궁합 점수가 왜 그렇게 나왔는지, 가족 안에서 반복되는 역할과 서운함이 어디서 생기는지 더 깊게 봐야 해.

같이 살거나 돈이 얽히거나 책임을 나눠야 한다면, 어느 선까지 감당하고 어디서 거리를 둬야 하는지 봐야 관계가 덜 무거워진다.`;
  }

  if (isPartnerCategory(categoryId, title)) {
    return `전체 리포트에서는 사업파트너 궁합 점수가 왜 그렇게 나왔는지, 같이 일할 때 돈·역할·책임·결정권에서 어떤 문제가 생기는지 더 깊게 봐야 해.

동업은 좋은 사람과 하는 게 아니라, 돈 기준과 역할 기준이 맞는 사람과 해야 오래 간다.`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `전체 리포트에서는 초년운, 청년운, 중년운, 말년운을 나누고 인생에서 들어오는 대운 기회를 자세히 봐야 해.

대운은 그냥 기다린다고 잡히는 게 아니라, 들어오기 전에 돈·일·건강·사람 중 무엇을 먼저 준비해야 하는지 알아야 잡을 수 있어.`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `전체 리포트에서는 초년운, 청년운, 중년운, 말년운을 나눠서 돈, 일, 사람, 가족, 건강운, 자식운까지 같이 본다.

평생종합사주는 한 부분만 보면 안 돼. 어느 시기에 막히고 어느 시기에 풀리는지를 같이 봐야 인생 방향이 잡힌다.`;
  }

  return `전체 리포트에서는 사주적 원인, 피해야 할 선택, 앞으로 1년 참고 흐름까지 이어서 본다.

여기서 끊기면 지금 반복되는 문제의 핵심을 놓칠 수 있어.`;
}

function getRiskChoices(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (isChildrenCategory(categoryId, title)) {
    return `
[부모로서 조심할 부분 참고]
1. 자식 인연을 있다 없다로 단정하는 것
- 자식운은 자식 유무를 맞히는 풀이가 아니야.
- 자식 인연이 어떤 방식으로 들어오고, 그 관계가 어떻게 깊어지는지를 봐야 해.

2. 자식을 부모의 대리만족으로 끌고 가는 것
- 부모가 못 이룬 것을 자식에게 대신 시키려 하면 자식운은 복보다 부담으로 바뀔 수 있어.
- 자식의 가능성은 부모 욕심이 아니라 자식이 반복해서 힘을 내는 환경에서 살아나.

3. 경제적 책임을 혼자 다 떠안는 것
- 교육비, 지원, 생활비, 가족 도움의 선이 흐려지면 사랑이 부담으로 변할 수 있어.
- 돈의 선을 정하지 않으면 가족 안에서 자식 문제가 갈등의 중심이 될 수 있다.

4. 말투와 기대치를 조절하지 않는 것
- 좋은 뜻으로 하는 말도 반복되면 아이에게는 평가나 통제로 느껴질 수 있어.
- 자식운은 말의 온도에서 좋아지기도 하고, 말의 압박에서 무거워지기도 해.

5. 가족 전체의 기준 없이 자식 문제를 다루는 것
- 자식 문제는 부모 한 사람만의 문제가 아니라 배우자, 조부모, 형제자매와도 연결될 수 있어.
- 가족 안에서 기대치, 돈, 교육 방향, 책임 범위를 미리 맞춰야 해.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[하지 말아야 할 선택]
1. 질문의 핵심을 정하지 않고 이것저것 한 번에 바꾸는 것
- 프리미엄 사주에서 제일 먼저 볼 건 "지금 무엇이 제일 막혔는지"야.
- 돈, 일, 관계, 건강을 한꺼번에 뒤집으려 하면 오히려 판단이 흐려질 수 있어.

2. 지금 불안하다는 이유로 큰돈이 들어가는 선택을 하는 것
- 무리한 투자, 대출을 끼고 시작하는 사업, 고정비 큰 창업, 준비 안 된 동업은 조심해야 해.
- 사주상 운이 열려도 그릇이 준비되지 않으면 좋은 운이 부담으로 바뀔 수 있어.

3. 사람 문제를 정으로만 끌고 가는 것
- 오래 본 사람, 가까운 사람, 믿고 싶은 사람이라는 이유만으로 계속 맞춰주면 관계가 무거워질 수 있어.
- 돈거래, 책임, 기대치, 말투 기준을 정해야 해.

4. 몸이 보내는 신호를 무시하고 버티는 것
- 프리미엄 사주에서는 돈과 일만 보는 게 아니라 몸의 리듬도 같이 봐야 해.
- 피로, 수면, 소화, 장 컨디션, 스트레스성 긴장이 무너지면 좋은 기회가 와도 오래 못 끌고 간다.

5. 사주 용어만 보고 현실 선택을 흐리는 것
- "기운이 약하다"는 말 자체가 중요한 게 아니야.
- 실제로는 결정이 늦어지는지, 말이 막히는지, 몸이 쉽게 지치는지, 돈이 새는지로 봐야 해.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[하지 말아야 할 선택]
1. 지금 불안한 마음만 보고 바로 결정하는 것
- 이 고민은 당장 답을 내야 풀리는 문제가 아닐 수 있어.
- 사주 흐름상 급하게 움직이면 오히려 후회가 남기 쉬운 구조야.

2. 사람 말에 흔들려 내 기준을 잃는 것
- 주변 조언이 많을수록 네 판단이 흐려질 수 있어.
- 지금은 누가 맞냐보다, 네 사주에 맞는 선택 기준이 먼저야.

3. 손해가 두려워 아닌 걸 계속 붙잡는 것
- 이미 마음이 무겁고 흐름이 막힌 선택이라면 계속 끌고 가도 좋아지기 어려워.
- 버틸 문제인지, 정리할 문제인지 구분해야 해.

4. 돈·관계·일 문제를 한꺼번에 해결하려는 것
- 고민이 커질수록 한 번에 다 바꾸고 싶어지는데, 그러면 더 흔들릴 수 있어.
- 지금은 가장 큰 문제 하나부터 줄이는 게 맞아.

5. 몸과 마음이 지친 상태에서 큰 결정을 내리는 것
- 컨디션이 무너지면 판단도 같이 흐려져.
- 중요한 결정은 잠, 식사, 감정이 조금 돌아온 뒤에 하는 게 좋아.
`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    return `
[하지 말아야 할 선택]
1. 사주상 부딪히는 지점을 사랑으로 덮는 것
- 이 궁합은 끌림만으로 판단하면 안 돼.
- 두 사람의 관계 흐름에서 한쪽이 강하게 밀어붙이면 다른 쪽에게는 압박처럼 느껴질 수 있어.
- 그래서 "좋아하니까 괜찮겠지"로 넘기면 같은 문제로 다시 싸울 가능성이 커져.

2. 말투와 감정 표현 차이를 성격 문제로만 보는 것
- 사주에서 표현 방식이 다르면 한쪽은 솔직하다고 느끼고, 한쪽은 공격받는다고 느낄 수 있어.
- 이건 단순히 누가 나쁘다의 문제가 아니라 서로 감정을 처리하는 속도가 다른 구조야.

3. 돈과 가족 문제를 나중으로 미루는 것
- 궁합이 흔들리는 관계는 연애할 때보다 결혼을 생각할 때 돈과 가족 거리감에서 더 크게 드러나.
- 이 부분을 미루면 결혼 후 생활 리듬에서 피로가 커질 수 있어.

4. 한쪽만 맞추는 관계로 끌고 가는 것
- 한쪽 사주가 더 강하게 밀고, 다른 쪽이 계속 받아주는 구조라면 처음엔 유지돼도 오래 가면 지친다.
- 궁합이 좋아지려면 한쪽 희생이 아니라 둘 다 조정해야 해.

5. 결혼을 감정의 결론처럼 정하는 것
- 이 궁합은 감정만 보면 헷갈릴 수 있어.
- 결혼까지 생각한다면 생활 기준, 돈 기준, 가족 거리감, 싸운 뒤 회복 방식까지 봐야 해.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    return `
[하지 말아야 할 선택]
1. 가족이라는 이유로 사주상 충돌 구조를 무시하는 것
- 가족관계는 정이 있다고 해서 자동으로 편해지는 관계가 아니야.
- 두 사람 모두 자기 방식이 강하면, 서로를 걱정하면서도 말투와 방식에서 상처가 생길 수 있어.

2. 한쪽만 계속 책임지는 구조로 가는 것
- 가족 안에서 한 사람만 돈, 돌봄, 결정, 감정처리를 계속 맡으면 관계가 기울어져.
- 사주상 책임감이 강한 사람이 계속 떠안으면 정이 아니라 부담으로 바뀔 수 있어.

3. 돈 문제를 정으로 덮는 것
- 가족 사이 돈은 더 조심해야 해.
- 빌려주는 돈, 대신 내는 돈, 같이 부담하는 돈을 명확히 하지 않으면 나중에 고마움보다 서운함이 커질 수 있어.

4. 말투 문제를 사소하게 넘기는 것
- 가족관계에서 반복되는 상처는 큰 사건보다 같은 말투에서 쌓일 수 있어.
- 사주상 표현 방식이 다르면 한쪽은 조언이라 생각하고, 한쪽은 간섭이나 비난으로 받아들일 수 있어.

5. 가까이 지내야 좋은 가족이라고 착각하는 것
- 어떤 가족궁합은 가까울수록 부딪히고, 거리를 두면 오히려 좋아지는 구조가 있어.
- 거리를 두는 건 가족을 버리는 게 아니라 관계를 오래 가게 만드는 방법일 수 있어.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    return `
[하지 말아야 할 선택]
1. 사람 좋다는 이유로 같이 일하는 것
- 사업파트너는 인간적인 호감보다 돈 기준과 실행 구조가 먼저야.
- 사주상 한쪽은 밀어붙이고 한쪽은 계산하거나 기다리는 구조라면, 좋은 사람이어도 같이 일할 때 답답함이 생길 수 있어.

2. 역할을 정하지 않고 시작하는 것
- 동업에서 가장 위험한 건 누가 무엇을 책임지는지 흐린 상태야.
- 둘 다 주도권을 잡으려 하면 결정권에서 부딪히고, 둘 다 실행이 약하면 일이 밀릴 수 있어.

3. 수익 배분을 감으로 정하는 것
- 돈이 들어오기 전에는 괜찮아 보여도, 돈이 들어온 뒤에는 기여도와 배분 문제가 크게 드러날 수 있어.
- 수익률, 비용 부담, 정산일, 손실 책임을 말로만 넘기면 나중에 관계가 틀어진다.

4. 계약 없이 의리로 가는 것
- 동업은 의리로 시작해도 계약으로 지켜야 해.
- 좋은 운이 들어와도 기준이 없으면 돈이 생기는 순간 갈등이 커질 수 있어.

5. 바로 큰 사업으로 들어가는 것
- 사업파트너 궁합이 아주 좋지 않은 이상, 처음부터 고정비 큰 구조로 가면 위험해.
- 먼저 작은 프로젝트로 실행력, 책임감, 돈 기준이 맞는지 확인해야 해.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[하지 말아야 할 선택]
1. 올해 운이 좋다는 말만 믿고 바로 크게 벌이는 것
- 신년운세에서 중요한 건 좋은 해인지보다 어떤 순서로 움직여야 하는지야.
- 운이 들어와도 준비 없이 크게 벌리면 돈보다 부담이 먼저 커질 수 있어.

2. 이직운이 애매한데 감정으로 회사를 그만두는 것
- 올해 이직운은 움직일 때와 머물 때를 나눠 봐야 해.
- 불만 때문에 나가는 이직과 더 좋은 구조로 가는 이직은 완전히 달라.

3. 돈복이 들어온다고 먼저 쓰는 것
- 돈복이 있어도 새는 구조가 크면 남는 돈이 없어.
- 올해는 들어오는 돈보다 고정비, 충동소비, 무리한 투자, 사업 초기비용을 먼저 봐야 해.

4. 건강 신호를 무시하고 버티는 것
- 올해 건강운이 약하게 잡히면 몸이 먼저 신호를 줄 수 있어.
- 특히 위장, 소화, 장, 수면, 피로, 순환 쪽 흐름은 가볍게 넘기지 마.

5. 사람 문제를 계속 미루는 것
- 올해 관계운에서 불편한 사람을 계속 끌고 가면 중요한 시기에 발목을 잡을 수 있어.
- 거리 둘 사람, 다시 봐야 할 사람, 도움 되는 사람을 구분해야 해.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[하지 말아야 할 선택]
1. 기분 상한 상태에서 바로 답장하는 것
- 오늘은 말이 짧아지거나 표정이 굳어 보일 수 있어.
- 특히 카톡, 전화, 가족이나 가까운 사람과의 대화에서 한 박자 늦추는 게 좋아.

2. 급하게 돈 쓰는 것
- 오늘은 작은 지출이 모여서 돈이 새기 쉬운 흐름이야.
- 충동구매, 배달, 필요 없는 결제, 남 때문에 쓰는 돈을 조심해.

3. 누가 재촉한다고 바로 결정하는 것
- 오늘은 빠른 결정이 운을 살리는 날이 아니야.
- 계약, 구매, 약속, 돈 관련 대답은 한 번 더 보고 움직이는 게 좋아.

4. 이미 아닌 걸 알면서 억지로 끌고 가는 것
- 오늘은 버티는 힘이 고집으로 바뀌기 쉬워.
- 안 맞는 대화, 안 맞는 약속, 불편한 부탁은 무리해서 끌고 가지 마.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[하지 말아야 할 선택]
- 아래 항목을 그대로 복붙하듯 쓰지 마라.
- 반드시 [카테고리별 사주 프로필]의 위험 요소를 먼저 반영해서 이 사람에게 맞춘 표현으로 바꿔라.
- 특히 "남의 말만 듣고 들어가는 투자", "체면 때문에 쓰는 돈" 같은 공통 문장은 이유와 장면을 개인화해서 써라.

1. 회수 기간 없이 돈을 묶는 선택
- 장사든 투자든 먼저 봐야 할 건 얼마를 벌 수 있냐가 아니라 언제 회수되느냐야.
- 회수 기준이 없으면 돈보다 마음이 먼저 묶여서 판단이 흐려질 수 있어.

2. 고정비부터 키우는 선택
- 임대료, 장비값, 광고비, 인건비처럼 매달 빠지는 돈이 커지면 재물운이 눌릴 수 있어.
- 시작은 작게 하고, 반복 매출이 확인된 뒤 고정비를 늘려야 해.

3. 정산 기준 없는 협업이나 동업
- 좋은 사람과 돈 기준이 맞는 사람은 달라.
- 역할, 책임, 비용 부담, 수익 배분, 빠지는 기준을 정하지 않으면 돈 때문에 관계가 틀어질 수 있어.

4. 체면성 지출과 거절 못 해서 나가는 돈
- 보여주기식 소비, 관계 유지용 지출, 급한 호의는 돈을 새게 만든다.
- 이 사주는 돈이 들어오는 힘만큼 지출 기준을 잡는 힘이 중요해.

5. 준비가 덜 된 상태에서 크게 벌리는 사업
- 운이 있어도 그릇이 준비되지 않으면 기회가 부담이 된다.
- 처음부터 크게 벌이기보다 작게 검증하고, 손실 한도와 빠져나올 기준을 먼저 정해야 해.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[하지 말아야 할 선택]
1. 준비 없이 바로 사업을 크게 시작하는 것
- 고정비 큰 매장, 인건비, 임대료부터 안고 들어가는 방식은 조심해야 해.
- 사주가 사업 쪽으로 열려도 처음부터 크게 벌리면 운보다 부담이 먼저 커져.

2. 안정만 보고 오래 묶이는 일
- 생활 기반은 필요하지만, 그것만으로는 운이 답답해질 수 있어.
- 안정이 필요하다는 말과 직장형이라는 말은 다르다.

3. 남이 돈 된다는 말만 믿고 따라가는 부업
- 부업형이라고 해서 아무 부업이나 맞는 건 아니야.
- 네가 통제할 수 없고, 구조를 이해하지 못하는 부업은 피해야 해.

4. 기술이나 루트 없이 시작하는 판매/창업
- 감으로 시작하면 돈보다 피로가 먼저 쌓여.
- 네가 직접 팔 수 있는 이유, 다시 사게 만들 이유, 고정 고객을 만들 이유가 있어야 해.

5. 초반부터 빚을 내서 판을 키우는 것
- 아직 검증되지 않은 구조에 돈을 먼저 넣으면 회복이 늦어질 수 있어.
- 네 사주는 작게 확인하고 키우는 방식이 훨씬 안전해.
`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `
[하지 말아야 할 선택]
1. 속이 불편한데도 계속 참는 것
- 책임감과 긴장이 몸에 쌓이거나 회복 리듬이 약해지면 위장, 소화, 장 쪽으로 부담이 쌓이는 흐름이 나올 수 있어.
- 병명으로 단정하는 건 아니지만, 소화 리듬과 장 컨디션은 꾸준히 봐야 해.

2. 밤낮이 무너지는 생활
- 몸을 회복시키는 리듬이 약하면 잠이 무너졌을 때 컨디션이 더 쉽게 흔들릴 수 있어.
- 잠이 무너지면 운보다 몸이 먼저 버티지 못해.

3. 스트레스를 속으로만 삼키는 것
- 표현이 막히면 몸이 먼저 긴장하는 구조가 될 수 있어.
- 말하지 못한 스트레스가 위장, 어깨, 목, 수면 쪽으로 갈 수 있어.

4. 한 번에 몰아서 무리하는 것
- 평소엔 버티다가 한 번에 무너지는 패턴을 조심해야 해.
- 운동도 일도 회복 시간을 빼면 건강운이 꺾여.

5. 몸의 신호를 운으로만 넘기는 것
- 사주는 흐름을 보는 거지 진단이 아니야.
- 실제 증상이 있으면 병원 검진은 따로 봐야 해.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[하지 말아야 할 선택]
1. 초년의 실패를 평생 운으로 착각하는 것
- 초년운이 답답한 사주도 중년 이후에 풀리는 경우가 있어.
- 초반에 안 풀렸다고 인생 전체를 포기하면 대운을 못 잡아.

2. 대운이 들어오기 전에 무리하게 판을 키우는 것
- 운이 아직 준비 구간인데 큰돈, 큰 사업, 큰 결정을 하면 부담이 먼저 커질 수 있어.
- 대운은 준비 없이 맞으면 기회가 아니라 압박으로 들어올 수 있어.

3. 사람 정리를 못 해서 좋은 운을 막는 것
- 대운이 들어올 때는 사람관계도 같이 바뀐다.
- 붙잡지 않아도 될 인연을 계속 붙잡으면 새 운이 들어올 자리가 없어.

4. 건강을 무시하고 버티기만 하는 것
- 인생 대운은 체력과 컨디션이 받쳐줘야 잡을 수 있어.
- 몸이 무너지면 좋은 기회가 와도 오래 못 끌고 가.

5. 같은 방식으로 계속 밀어붙이는 것
- 대운이 바뀌면 방법도 바뀌어야 해.
- 예전 방식으로만 버티면 새 기회를 알아보지 못할 수 있어.
`;
  }

  return `
[하지 말아야 할 선택]
1. 선택 카테고리의 사주 구조를 보지 않고 감정으로만 판단하는 것
- 이 카테고리에서는 단순 조언이 아니라 타고난 장점과 반복해서 흔들리는 약점이 어떻게 문제를 만드는지 봐야 해.

2. 반복되는 문제를 성격 탓으로만 보는 것
- 같은 문제가 반복된다면 성격보다 구조를 먼저 봐야 해.
- 타고난 장점이 과하게 쓰이거나 약한 부분이 무너질 때 같은 일이 반복될 수 있어.

3. 기준 없이 관계나 돈을 끌고 가는 것
- 운이 막히는 시기에는 기준 없는 선택이 손해로 이어질 수 있어.
- 돈, 사람, 일 중 어디에서 기준이 필요한지 먼저 봐야 해.

4. 이미 불편한 흐름을 알면서도 계속 미루는 것
- 사주에서 반복되는 문제는 미룰수록 더 무거워질 수 있어.
- 지금 줄여야 할 것과 붙잡아야 할 것을 구분해야 해.
`;
}

function getDirectionChoices(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (isChildrenCategory(categoryId, title)) {
    return `
[자식운이 좋아지는 조건 참고]
1. 자식 인연을 조심스럽게 보고 관계로 풀어라
- 자식운은 유무를 단정하는 게 아니라 인연의 흐름과 관계의 질을 보는 거야.
- 가능성이 강하게 보이면 "비교적 강하다"로, 약하게 보이면 "늦게 드러나거나 조율이 필요하다"로 풀어라.

2. 사랑과 기준을 분리해라
- 사랑한다고 다 허용하는 것도 아니고, 기준을 세운다고 차갑게 대하는 것도 아니야.
- 말투는 따뜻하게, 기준은 분명하게 가야 자식운이 안정된다.

3. 자식의 성장 방향을 하나로 밀어붙이지 마라
- 공부형, 기술형, 예술/표현형, 사업감각형, 안정형, 독립형 중 어디서 힘이 살아나는지 관찰해야 해.
- 부모가 원하는 방향보다 아이가 반복해서 몰입하는 방향을 봐야 한다.

4. 가족 안의 돈과 책임 기준을 정해라
- 교육비, 지원, 생활비, 조부모 도움, 형제자매 비교 문제를 미리 조율해야 해.
- 자식 문제가 가족 전체의 감정싸움으로 커지지 않게 기준을 잡아야 한다.

5. 부모 자신의 삶도 지켜라
- 자식에게 전부를 걸면 자식도 부담스럽고 부모도 쉽게 지쳐.
- 부모의 생활 리듬과 경제적 선이 살아 있어야 자식운도 덜 무거워진다.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[잡아야 할 방향]
1. 질문의 핵심을 먼저 하나로 좁혀라
- 돈이 문제인지, 일이 문제인지, 사람이 문제인지, 몸이 문제인지 먼저 구분해야 해.
- 핵심을 하나로 줄여야 답도 선명해져.

2. 사주 용어를 현실 행동으로 바꿔라
- 추진력이 약하면 작은 마감일을 잡고, 표현이 약하면 말로 미루지 말고 글로 정리해.
- 책임감이 과하면 혼자 떠안지 말고 역할을 나눠야 해.

3. 돈은 크게 벌리기보다 새는 구멍부터 막아라
- 고정비, 충동지출, 사람 때문에 나가는 돈, 준비 없는 투자를 먼저 줄여야 해.
- 그 다음 작게 테스트해서 반복되는 수익 구조를 봐야 해.

4. 일은 한 번에 바꾸지 말고 작은 테스트로 확인해라
- 이직, 사업, 부업 모두 바로 크게 움직이는 것보다 작게 검증하는 게 좋아.
- 반응이 있는지, 반복 가능한지, 몸이 버티는지를 먼저 봐야 해.

5. 건강은 의지보다 리듬으로 잡아라
- 무조건 버티는 방식보다 식사, 수면, 걷기, 스트레스 배출, 검진 같은 기본 리듬을 잡아야 해.
- 몸이 안정돼야 돈과 일의 판단도 덜 흔들려.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[잡아야 할 방향]
1. 고민의 핵심을 하나로 줄여라
- 지금 문제를 전부 한꺼번에 보려고 하면 답이 더 안 보여.
- 돈 문제인지, 사람 문제인지, 일 문제인지 먼저 하나로 좁혀야 해.

2. 당장 할 결정과 미뤄도 되는 결정을 나눠라
- 모든 고민이 오늘 결론 나야 하는 건 아니야.
- 지금 움직여야 할 것과 조금 더 지켜봐도 되는 걸 구분해야 해.

3. 감정보다 반복된 패턴을 봐라
- 이번 한 번만 힘든 건지, 같은 문제가 계속 반복된 건지 봐야 해.
- 반복된 문제라면 감정보다 구조를 바꿔야 풀려.

4. 손해를 줄이는 선택부터 해라
- 좋은 선택을 찾기 전에 나쁜 선택을 피하는 게 먼저일 때가 있어.
- 무리한 돈, 무리한 관계, 무리한 약속부터 줄여야 해.

5. 지금 사주에서 약한 흐름을 보완하는 쪽으로 가라
- 밀어붙여야 풀리는 고민인지, 쉬어야 풀리는 고민인지 봐야 해.
- 네 사주에서 약한 기운이 흔들릴 때는 속도를 늦추는 게 오히려 답이 될 수 있어.
`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    return `
[잡아야 할 방향]
1. 감정보다 생활 기준을 먼저 맞춰라
- 이 궁합은 좋아하는 마음만으로 오래 가는 구조가 아니야.
- 연락, 돈, 가족, 시간 쓰는 방식이 맞아야 관계가 안정돼.

2. 서로의 사주상 예민한 지점을 알아야 해
- 한쪽이 강하게 밀고 가는 기운이면 다른 쪽은 압박을 느낄 수 있어.
- 한쪽이 감정을 쌓는 구조면 작은 말도 오래 남을 수 있어.

3. 싸움 후 회복 방식을 정해라
- 궁합은 안 싸우는 것보다 싸운 뒤 어떻게 돌아오는지가 중요해.
- 사과 방식, 혼자 있는 시간, 대화 타이밍을 맞춰야 해.

4. 돈과 가족 기준은 미리 말해라
- 결혼을 생각한다면 이 부분은 반드시 봐야 해.
- 돈 문제와 가족 문제는 결혼 후에 더 크게 드러날 수 있어.

5. 한쪽만 맞추는 구조를 끊어라
- 오래 가려면 둘 다 조정해야 해.
- 한 사람만 참고 맞추는 관계는 결국 무너질 수 있어.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    return `
[잡아야 할 방향]
1. 정과 책임을 분리해라
- 가족을 아끼는 마음과 모든 걸 대신 감당하는 건 달라.
- 어디까지 도와주고 어디서 멈출지 기준을 잡아야 해.

2. 사주상 부딪히는 말투를 줄여라
- 서로 걱정해서 하는 말도 한쪽에게는 간섭처럼 느껴질 수 있어.
- 맞는 말을 하더라도 말투와 타이밍을 조절해야 관계가 덜 다쳐.

3. 돈 기준을 미리 정해라
- 가족 사이 돈 문제는 나중에 말하면 더 힘들어져.
- 빌려주는 돈, 함께 쓰는 돈, 대신 내는 돈의 기준을 먼저 정해야 해.

4. 적당한 거리를 죄책감으로 보지 마라
- 어떤 가족궁합은 적당한 거리가 있어야 더 오래 간다.
- 덜 부딪히는 거리를 찾는 게 관계를 포기하는 건 아니야.

5. 역할을 다시 나눠라
- 늘 하던 사람이 계속 하는 구조를 바꿔야 해.
- 책임을 나누고 기대치를 낮추면 관계가 가벼워질 수 있어.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    return `
[잡아야 할 방향]
1. 역할을 먼저 나눠라
- 누가 영업, 운영, 돈 관리, 고객 대응, 실행을 맡는지 정해야 해.
- 역할이 겹치면 감정싸움이 되고, 비면 일이 멈춘다.

2. 돈 기준을 문서로 정해라
- 수익 배분, 비용 부담, 손실 책임, 정산일을 처음부터 정해야 해.
- 말로만 정한 동업은 운이 좋아도 오래 가기 어렵다.

3. 작은 프로젝트로 먼저 테스트해라
- 바로 큰 사업을 열기보다 작은 일로 실행력과 책임감을 확인해야 해.
- 같이 일해보면 사주보다 더 현실적인 부분이 보인다.

4. 결정권을 정해라
- 모든 걸 둘이 같이 결정하면 속도가 늦어질 수 있어.
- 어떤 일은 누가 최종 결정하는지 정해야 해.

5. 빠져나오는 기준까지 정해라
- 시작 조건만큼 중요한 게 종료 조건이야.
- 잘 안 됐을 때 어떻게 정리할지 미리 정해야 관계가 덜 상해.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[잡아야 할 방향]
1. 올해 전체 방향은 머물 곳과 움직일 곳을 구분하는 것
- 올해는 무조건 움직인다고 좋은 해가 아니야.
- 지금 자리를 지켜야 하는 부분과 새로 테스트해야 하는 부분을 나눠야 해.

2. 재물운은 돈이 들어오는 방식보다 새는 구멍부터 봐라
- 돈복이 들어와도 고정비와 충동 지출이 크면 남지 않아.
- 올해는 수입을 키우는 것과 동시에 새는 돈을 막아야 해.

3. 직업/사업운은 작은 테스트로 확인해라
- 이직, 부업, 사업 모두 바로 크게 움직이지 말고 작은 테스트를 먼저 해.
- 반응이 있는지, 반복 가능한지, 몸이 버티는지 확인해야 해.

4. 이직운은 감정이 아니라 조건으로 판단해라
- 지금 일이 싫어서 나가는 건 위험할 수 있어.
- 연봉, 업무강도, 성장 가능성, 사람 스트레스, 이동 후 안정성을 같이 봐야 해.

5. 건강운은 회복 루틴을 먼저 만들어라
- 올해 건강운이 약하면 무리해서 버티는 방식은 안 맞아.
- 식사, 수면, 걷기, 스트레스 배출, 검진 같은 기본 루틴이 운을 받쳐줘야 해.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[잡아야 할 방향]
- 아래 항목을 그대로 복붙하듯 쓰지 마라.
- 반드시 [카테고리별 사주 프로필]의 실행 방향을 우선 반영해라.
- 이 사람의 돈길을 하나로 좁혀서 말해라. 여러 유형을 나열하지 마라.

1. 돈이 들어오는 길과 돈이 남는 길을 분리해라
- 돈을 버는 방식과 돈이 남는 방식은 달라.
- 수익이 생겨도 회수 기간, 고정비, 정산 기준이 없으면 남는 돈이 약해질 수 있어.

2. 작은 수익 테스트를 먼저 만들어라
- 처음부터 큰돈을 넣지 말고, 1개 상품·1개 서비스·1개 거래부터 반응을 봐야 해.
- 반복 문의, 재구매, 소개, 유지관리처럼 다시 돈이 생기는 신호를 확인해야 해.

3. 네가 통제할 수 있는 돈길을 잡아라
- 남의 말, 남의 시스템, 남의 기분에만 의존하는 돈길은 흔들리기 쉬워.
- 네가 가격, 시간, 품질, 정산, 고객 대응을 어느 정도 통제할 수 있어야 재물운이 살아나.

4. 신뢰가 쌓일수록 단가가 오르는 구조를 봐라
- 단순히 한 번 팔고 끝나는 구조보다, 신뢰가 쌓이면 재문의나 관리 수익이 생기는 구조가 좋아.
- 기술, 관리, 정리, 운영, 상담, 유지보수, 반복 서비스처럼 신뢰가 돈으로 바뀌는 쪽을 봐야 해.

5. 돈 기록을 습관으로 만들어라
- 이 사주는 감으로 돈을 굴리면 새는 구멍을 늦게 알아차릴 수 있어.
- 고정비, 변동비, 사람 때문에 나간 돈, 테스트 비용, 회수된 돈을 따로 기록해야 돈복이 남는 쪽으로 바뀐다.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[잡아야 할 방향]
1. 생활 기반은 안정시키되, 자기 수익 구조를 따로 만들어라
- 이건 안정적인 직장형이라는 뜻이 아니야.
- 흔들리지 않을 최소 기반 위에 네 기술, 네 루트, 네 고객을 만들어야 한다는 뜻이야.

2. 작게 시작해서 반복 수요를 확인해라
- 처음부터 큰 사업보다 작게 테스트하고 반응을 보는 흐름이 맞아.

3. 네가 직접 통제할 수 있는 일을 골라라
- 남의 기분, 남의 결정, 남의 시스템에만 의존하면 운이 답답해져.

4. 기술·정보·정리·관리 능력을 돈으로 바꾸는 구조를 봐라
- 단순히 몸만 쓰는 일보다, 경험이 쌓일수록 단가가 올라가는 방향이 좋아.

5. 일의 이름보다 돈이 생기는 구조를 봐라
- 직업명이 좋아 보여도 돈길이 안 보이면 오래 못 가.
- 네 사주는 구조를 잡아야 버는 타입으로 봐야 해.
`;
  }

  return `
[잡아야 할 방향]
1. 타고난 장점을 현실의 기준으로 바꿔라
- 장점도 기준 없이 쓰면 고집이나 무리수가 될 수 있어.

2. 반복해서 흔들리는 상황을 줄여라
- 약한 부분은 같은 문제로 다시 드러나기 쉬워.
- 그 부분을 생활 기준과 선택 기준으로 보완해야 해.

3. 지금 카테고리에서 먼저 정해야 할 기준을 잡아라
- 돈이면 돈 기준, 관계면 거리감, 일이면 역할과 구조를 먼저 봐야 해.

4. 감정이 아니라 반복되는 패턴을 보고 선택해라
- 운은 한 번의 기분보다 반복되는 흐름에서 더 잘 보여.
`;
}

function getFinalSummaryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[형이 딱 정리해줄게]
- 프리미엄 사주의 핵심 결론을 다시 한 문장으로 말해라.
- 사용자의 질문이 돈, 일, 관계, 건강, 인생방향 중 어디에 가까운지 다시 정리해라.
- [카테고리별 사주 프로필]의 위험과 실행 방향을 반드시 다시 정리해라.
- 사주 용어로 끝내지 말고 현실 언어로 다시 풀어라.
- 오늘 당장 할 일 3개를 구체적으로 말해라.
- 며칠 보류할 일 3개를 구체적으로 말해라.
- 정리해야 할 선택 3개를 구체적으로 말해라.
- 마지막 문장은 "프리미엄 사주는 겁주는 풀이가 아니라, 지금 네가 덜 흔들리게 선택 순서를 잡아주는 풀이야."로 끝내라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[형이 딱 정리해줄게]
- 사용자의 고민을 돈, 사람, 일, 건강 중 어디에 가까운지 다시 말해라.
- [카테고리별 사주 프로필]의 위험과 실행 방향을 반드시 다시 정리해라.
- 지금 바로 하면 안 되는 선택을 구체적으로 정리해라.
- 오늘 당장 할 일, 며칠 보류할 일, 정리해야 할 일을 나눠라.
- 사주 용어로 끝내지 말고 현실 행동으로 끝내라.
- 마지막 문장은 "이 고민은 한 번에 뒤집는 게 아니라, 제일 위험한 선택부터 피할 때 풀리기 시작해."로 끝내라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 올해 전체 해운을 다시 한 문장으로 말해라.
- [카테고리별 사주 프로필]의 올해 위험과 실행 방향을 반드시 다시 정리해라.
- 올해 재물운은 돈복이 들어오는지, 돈이 새는지, 돈을 키우려면 무엇을 해야 하는지 정리해라.
- 올해 직업/사업운은 움직일지 머물지, 이직운이 있는지, 테스트해야 할 방향이 무엇인지 정리해라.
- 건강운은 괜찮은지 약한지 먼저 말하고, 약하다면 생활에서 무엇을 줄이고 무엇을 잡아야 하는지 말해라.
- 관계운에서는 올해 도움 되는 인연과 거리 둘 인연을 구분해라.
- 1~3개월, 4~6개월, 7~9개월, 10~12개월 중 가장 중요한 구간을 다시 짚어라.
- 마지막 문장은 "올해는 무조건 크게 움직이는 해가 아니라, 머물 곳과 움직일 곳을 구분할 때 운이 살아나는 해다."로 끝내라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[형이 딱 정리해줄게]
- 오늘운세는 추상적인 인생 조언으로 끝내지 마라.
- 오늘 조심할 말, 돈, 사람관계, 몸 컨디션을 구체적으로 정리해라.
- 오늘은 무리한 확장보다 정리, 급한 결정보다 보류, 감정적인 말보다 한 박자 늦춘 답변이 좋다고 말해라.
- 마지막 문장은 "오늘은 크게 치는 날이 아니라, 새는 운을 막고 흐트러진 걸 정리할 때 운이 살아나는 날이야."로 끝내라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[형이 딱 정리해줄게]
- 절대 뻔한 응원으로 끝내지 마라.
- 돈복 등급을 자연스러운 조사로 다시 말해라. 예: "네 돈복은 '중'으로 본다."
- [카테고리별 사주 프로필]의 재물 구조, 위험, 실행 방향을 반드시 다시 정리해라.
- 돈이 붙는 방식과 돈이 새는 구조를 다시 정리해라.
- 무리한 투자, 지인 말 듣고 들어가는 돈, 준비 없는 사업, 고정비 큰 창업을 조심하라고 말해라.
- 맞는 방향은 [카테고리별 사주 프로필]의 실행 방향을 우선해서 말해라.
- 마지막 문장은 "그게 네 사주에서 재물운을 살리는 방식이야."로 끝내라.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 고정 직업 성향을 다시 말해라.
- [카테고리별 사주 프로필]의 일 구조, 위험, 실행 방향을 반드시 다시 정리해라.
- 안정적인 직장형이라는 말로 흐리지 마라.
- 생활 기반은 필요하지만 자기 수익 구조를 따로 만들어야 한다고 말해라.
- 준비 없는 큰 사업, 남이 돈 된다는 부업, 고정비 큰 창업을 조심하라고 말해라.
- 맞는 방향은 [카테고리별 사주 프로필]의 실행 방향을 우선해서 말해라.
- 마지막 문장은 "네 사주는 남의 판에서 오래 버티는 것보다, 네 판을 조금씩 만드는 쪽에서 일이 풀린다."로 끝내라.
`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `
[형이 딱 정리해줄게]
- 건강운 등급을 자연스러운 조사로 다시 말해라. 예: "네 건강운은 '중하'로 본다."
- [카테고리별 사주 프로필]의 건강 유형, 위험, 실행 방향을 반드시 다시 정리해라.
- 의료 진단이 아니라 사주상 건강 흐름이라고 말해라.
- 약한 흐름을 위장·소화·장 리듬, 순환, 피로 누적, 수면, 스트레스성 긴장 중 사주에 맞춰 구체적으로 정리해라.
- 하지 말아야 할 것은 참기, 밤낮 무너짐, 스트레스 삼키기, 몰아서 무리하기라고 말해라.
- 맞는 방향은 [카테고리별 사주 프로필]의 실행 방향을 우선해서 말해라.
- 마지막 문장은 "너는 무리해서 강해지는 타입이 아니라, 리듬을 잡아야 덜 흔들리는 타입이야."로 끝내라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[형이 딱 정리해줄게]
- 연애운 결론을 다시 말해라.
- [카테고리별 사주 프로필]의 관계 유형, 위험, 실행 방향을 반드시 다시 정리해라.
- 외로움 때문에 시작하는 관계, 초반 설렘만 보는 관계, 생활 리듬이 안 맞는 사람을 조심하라고 말해라.
- 맞는 방향은 끌림보다 기준, 감정보다 반복되는 태도, 설렘보다 안정감이라고 말해라.
- 마지막 문장은 "네 연애운은 사람을 잘 고를 때 살아나는 운이야."로 끝내라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[형이 딱 정리해줄게]
- 결혼운 결론을 다시 말해라.
- [카테고리별 사주 프로필]의 결혼 유형, 위험, 실행 방향을 반드시 다시 정리해라.
- 외로움 때문에 결혼 결정, 돈 기준 불일치, 가족 문제 무시, 상대를 바꾸려는 생각을 조심하라고 말해라.
- 맞는 방향은 생활 기준, 돈 기준, 가족 거리감, 역할 분담이 맞는 사람이라고 말해라.
- 마지막 문장은 "네 결혼운은 설렘보다 생활 기준이 맞을 때 안정된다."로 끝내라.
`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 궁합 점수와 등급을 다시 말해라.
- 이 궁합이 좋은지 나쁜지 애매하게 말하지 마라.
- 끌리는 이유와 부딪히는 이유를 구체적으로 다시 정리해라.
- 궁합이 좋아지려면 돈 기준, 가족 거리감, 말투, 생활 리듬 중 무엇을 맞춰야 하는지 말해라.
- 결혼하면 생길 수 있는 문제를 현실적으로 말해라.
- 마지막 문장은 "이 관계는 감정만 보면 헷갈리고, 생활 기준까지 맞춰야 진짜 궁합이 보이는 관계야."로 끝내라.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 가족궁합 점수와 등급을 다시 말해라.
- 가족 사이가 좋은지, 보통인지, 거리 조절이 필요한지 애매하게 말하지 마라.
- 가족 안에서 반복되는 역할, 책임, 돈 문제, 말투 문제를 구체적으로 정리해라.
- 같이 살거나 돈이 얽히면 어떤 문제가 생기는지 현실적으로 말해라.
- 관계가 좋아지려면 어떤 선을 정하고 어떤 기대를 줄여야 하는지 말해라.
- 마지막 문장은 "이 가족관계는 정으로만 버티는 관계가 아니라, 선을 정해야 오래 덜 다치는 관계야."로 끝내라.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 사업파트너 궁합 점수와 등급을 다시 말해라.
- 같이 일해도 되는지, 조심해야 하는지 애매하게 말하지 마라.
- 돈 기준, 역할 분담, 책임 범위, 결정권에서 어디가 위험한지 구체적으로 정리해라.
- 동업을 한다면 반드시 문서로 정해야 할 내용을 말해라.
- 호감보다 구조가 중요하다고 말해라.
- 마지막 문장은 "이 관계는 좋은 사람이냐보다, 같이 돈을 벌 구조가 맞느냐를 먼저 봐야 하는 관계야."로 끝내라.
`;
  }

  if (isChildrenCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 자식운 결론을 다시 말해라.
- [카테고리별 사주 프로필]의 자식운 유형, 위험, 실행 방향을 반드시 다시 정리해라.
- 자식이 있을 가능성, 자식 인연의 강약, 자식복의 성격, 자식과 나의 관계, 자식과 가족들의 관계를 정리해라.
- 자식의 성장 가능성과 성공운은 보장하지 말고, 어떤 환경에서 가능성이 살아나는지 말해라.
- 임신, 출산, 자식 수, 성별은 단정하지 마라.
- 기대, 간섭, 경제적 책임, 비교, 대리만족을 조심하라고 말해라.
- 맞는 방향은 기대보다 기준, 통제보다 거리, 감정보다 말의 온도, 그리고 부모 자신의 삶을 지키는 것이라고 말해라.
- 마지막 문장은 "자식운은 붙잡는 운이 아니라, 관계의 온도와 성장 환경을 맞춰야 살아나는 운이야."로 끝내라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[형이 딱 정리해줄게]
- 인생대운을 추상적인 조언으로 끝내지 마라.
- 초년운, 청년운, 중년운, 말년운 중 어디서 가장 크게 풀리는지 다시 말해라.
- 인생에서 대운 기회가 몇 번 들어오는지 말해라.
- 가장 중요한 대운을 잡으려면 무엇을 준비해야 하는지 구체적으로 정리해라.
- 돈, 일, 건강, 사람 중 무엇을 먼저 잡아야 하는지 말해라.
- 마지막 문장은 "네 인생은 한 번에 끝나는 운이 아니라, 대운이 들어오는 시기를 알아보고 그 전에 준비할 때 크게 달라지는 흐름이야."로 끝내라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[형이 딱 정리해줄게]
- 평생종합사주에서는 절대 공통 fallback 문장으로 마무리하지 마라.
- "감정으로만 판단", "반복되는 문제를 성격 탓", "기준 없이 관계나 돈" 같은 공통 문구를 쓰지 마라.
- 첫 문장은 평생 사주 결론을 다시 말하되, 반드시 초년·청년·중년·말년 흐름을 한 문장 안에 연결해라.
- 두 번째 문단에서는 재물운이 언제부터 모이기 쉬운지, 돈이 새는 시기가 언제인지 말해라.
- 세 번째 문단에서는 직업운·사업운이 언제부터 자기 판으로 커지는지 말해라.
- 네 번째 문단에서는 건강운에서 평생 조심해야 할 흐름과 가장 조심할 시기를 말해라.
- 다섯 번째 문단에서는 인연·가족·자식운에서 책임, 거리감, 말투 기준을 어떻게 잡아야 하는지 말해라.
- 마지막 문단에서는 대운이 들어오는 핵심 시기와 최종적으로 안정되는 시기를 반드시 말해라.
- 마지막 문장은 "이 사주는 초년에 다 끝나는 운이 아니라, 중년 이후 기준을 잡을수록 돈·일·관계가 같이 안정되는 흐름이야."로 끝내라.
`;
  }

  return `
[형이 딱 정리해줄게]
- 절대 뻔한 응원으로 끝내지 마라.
- 선택 카테고리의 결론을 다시 말해라.
- 하지 말아야 할 선택과 잡아야 할 방향을 구체적으로 다시 정리해라.
`;
}

function getFullSections(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[질문의 핵심 분류]
- 사용자의 질문을 돈, 일/사업, 관계, 건강, 인생방향 중 어디에 가까운지 먼저 분류해라.
- 질문이 애매하면 가장 큰 걱정이 무엇인지 추정하되 단정하지 말고 "이 질문은 우선 ~쪽으로 봐야 한다"고 말해라.

[사주상 반복되는 패턴]
- 제공된 만세력 기준으로 반복되는 성향을 설명해라.
- 오행 용어를 쓸 때는 반드시 쉬운 말로 번역해라.
- 예: 추진력과 표현력, 회복 리듬이 약하면 결정을 미루거나 스트레스를 안으로 쌓기 쉽다.
- 예: 책임감과 버티는 힘이 강하면 현실은 잘 견디지만, 혼자 감당하고 속으로 쌓아두기 쉽다.
- [카테고리별 사주 프로필]의 핵심 해석을 반드시 반영해라.

[재물운]
- 돈복 등급과 돈이 붙는 방식을 말해라.
- 돈이 새는 구조, 피해야 할 돈 선택, 올해 돈을 키우는 방식을 구체적으로 말해라.
- [카테고리별 사주 프로필]의 재물 방향과 충돌하지 않게 써라.

[직업/사업운]
- 고정 직업 성향 판정을 바꾸지 말고 설명해라.
- 맞는 일 구조, 피해야 할 일 구조, 이직/사업/부업을 판단하는 기준을 말해라.
- 현재 입력에 없는 지역명이나 이전 대화의 지역 정보를 절대 넣지 마라.

[관계운]
- 가까운 사람, 가족, 연인, 동료, 사업관계에서 반복될 수 있는 문제를 말해라.
- 정으로 끌고 갈 관계와 선을 정해야 할 관계를 나눠라.

[건강운]
- 의료 진단이 아니라 사주상 건강 흐름으로 설명해라.
- 위장, 소화, 장, 순환, 피로, 수면, 스트레스성 긴장 중 사주상 약한 흐름을 현실적으로 풀어라.

[앞으로 1년 참고 흐름]
- 지역명 없이 올해 흐름을 말해라.
- 지금 기반을 지켜야 할 부분, 새로운 환경을 작게 테스트해도 되는 부분, 돈을 조심해야 할 부분, 건강을 회복해야 할 부분을 나눠라.

[오늘 당장 할 일]
- 지금 바로 할 수 있는 행동 3가지를 말해라.
- 예: 지출 멈추기, 조건 정리하기, 연락 하루 보류하기, 작은 테스트 하나 정하기, 수면 리듬 회복하기.

[며칠 보류할 일]
- 바로 결정하면 위험한 선택을 말해라.
- 예: 큰돈 들어가는 선택, 퇴사, 동업, 계약, 관계 정리, 무리한 확장.

[정리해야 할 일]
- 계속 끌고 가면 운을 막는 선택을 말해라.
- 사람, 돈, 습관, 일 구조 중 정리해야 할 것을 구체적으로 말해라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[이 고민의 핵심]
- 사용자의 질문을 읽고 돈, 사람, 일, 건강, 가족, 연애 중 어디에 가까운 고민인지 먼저 분류해라.
- 고민의 표면 이유와 실제로 막힌 지점을 나눠서 설명해라.
- [카테고리별 사주 프로필]의 핵심 해석을 반드시 반영해라.

[지금 바로 결정하면 위험한 이유]
- 지금 감정 상태에서 결정하면 어떤 문제가 생길 수 있는지 구체적으로 말해라.
- 돈이면 손실, 사람관계면 말실수나 관계 악화, 일이면 충동 퇴사나 무리한 확장을 조심시켜라.

[사주상 반복되는 고민 패턴]
- 제공된 만세력 기준으로 어떤 장점이 과하게 쓰이고, 어떤 약점이 불안으로 반복되는지 쉽게 풀어라.
- 어려운 명리학 용어보다 현실 언어로 설명해라.

[돈 문제라면]
- 돈을 넣어도 되는지, 멈춰야 하는지, 손실을 줄이는 기준을 말해라.
- 무리한 투자, 준비 없는 사업개시, 고정비 큰 선택, 지인 말만 듣고 움직이는 선택을 구체적으로 경고해라.

[사람 문제라면]
- 계속 봐도 되는 관계인지, 거리를 둬야 하는 관계인지 말해라.
- 말투, 기대치, 돈거래, 책임 떠안기, 가족/연인/동료 거리감을 구체적으로 말해라.

[일 문제라면]
- 지금 버틸지, 움직일지, 작게 테스트할지, 준비할지 말해라.
- 감정적인 퇴사, 준비 없는 창업, 남이 좋다는 부업, 고정비 큰 사업을 구체적으로 조심시켜라.

[오늘 당장 할 일]
- 사용자가 지금 바로 할 수 있는 행동 3가지를 말해라.
- 연락 보류, 지출 중단, 조건 정리, 하루 더 보기, 작은 테스트처럼 현실 행동으로 써라.

[며칠 보류할 일]
- 바로 결정하지 말아야 할 것을 말해라.
- 돈, 계약, 관계 정리, 퇴사, 사업 시작처럼 큰 결정을 구체적으로 나눠라.

[정리해야 할 것]
- 계속 끌고 가면 더 무거워지는 문제를 말해라.
- 사람, 돈, 약속, 일, 습관 중 무엇을 줄여야 하는지 말해라.
`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    return `
[궁합 점수 해석]
- 두 사람의 궁합 점수가 왜 그렇게 나왔는지 설명해라.
- 좋은 점과 나쁜 점을 함께 말해라.

[서로 끌리는 이유]
- 사주적으로 왜 끌리는지 설명해라.
- 감정, 분위기, 말투, 생활 리듬 중 어디서 끌리는지 말해라.

[부딪히는 이유]
- 서로가 반복해서 싸울 수 있는 지점을 구체적으로 말해라.
- 말투, 돈, 가족, 생활습관, 감정 표현 중 어디서 부딪히는지 말해라.

[이 궁합이 좋아지는 조건]
- 이 관계가 좋아지려면 무엇을 맞춰야 하는지 말해라.
- 연락 방식, 돈 기준, 가족 거리감, 생활 리듬, 감정 표현을 구체적으로 말해라.

[이 궁합으로 결혼하면 생길 수 있는 문제]
- 결혼 후 나타날 수 있는 현실 문제를 말해라.
- 돈, 집안, 역할 분담, 생활 습관, 감정 피로 중 사주상 강하게 보이는 것을 풀어라.
- 겁주지 말고 현실적인 경고로 말해라.

[그래도 이어가려면]
- 이 관계를 유지하려면 서로 어떤 노력을 해야 하는지 말해라.
- 한쪽만 참는 구조가 되면 안 된다고 말해라.

[결혼 전 반드시 확인할 것]
- 돈 쓰는 방식, 가족 거리감, 싸움 후 회복 방식, 생활 리듬, 감정 표현 방식을 체크리스트처럼 풀어라.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    return `
[가족궁합 점수 해석]
- 가족궁합 점수가 왜 그렇게 나왔는지 설명해라.
- 좋은 점과 힘든 점을 함께 말해라.

[사이가 맞는 부분]
- 가족으로서 서로 기대거나 도움 받을 수 있는 부분을 말해라.
- 정, 책임감, 생활 리듬, 말투, 돈 감각 중 맞는 부분을 구체적으로 말해라.

[반복해서 부딪히는 이유]
- 가족 안에서 반복되는 서운함과 충돌 지점을 설명해라.
- 역할, 책임, 돈, 말투, 거리감 중 어디서 부딪히는지 말해라.

[같이 살거나 가까이 지내면 생길 수 있는 문제]
- 같이 살 때 생활 방식, 돈, 집안일, 감정 표현에서 생길 수 있는 문제를 말해라.
- 겁주지 말고 현실적인 경고로 말해라.

[돈이 얽힐 때 조심할 부분]
- 빌려주는 돈, 대신 내는 돈, 같이 부담하는 돈, 생활비, 가족 사업 비용 같은 부분을 구체적으로 말해라.

[가족관계가 좋아지는 조건]
- 기대치를 낮춰야 하는지, 역할을 나눠야 하는지, 거리를 둬야 하는지 구체적으로 말해라.
- 돈 기준과 말투 기준을 어떻게 잡아야 하는지 말해라.

[그래도 가족으로 오래 보려면]
- 한쪽만 참는 구조가 되면 안 된다고 말해라.
- 관계를 끊으라는 식이 아니라 덜 다치는 거리와 기준을 제시해라.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    return `
[사업파트너 궁합 점수 해석]
- 사업파트너 궁합 점수가 왜 그렇게 나왔는지 설명해라.
- 같이 일할 때 좋은 점과 위험한 점을 함께 말해라.

[같이 돈을 벌 수 있는 부분]
- 서로의 강점이 어떻게 돈 흐름으로 연결될 수 있는지 말해라.
- 영업, 실행, 관리, 기획, 돈 관리, 사람관리 중 어디가 맞는지 구체적으로 풀어라.

[같이 일하면 부딪히는 이유]
- 수익 배분, 역할 분담, 책임감, 속도 차이, 결정권에서 어디가 문제인지 말해라.
- 좋은 사람이어도 동업에서 틀어지는 이유를 사주 구조로 설명해라.

[동업하면 생길 수 있는 현실 문제]
- 돈이 들어오기 전과 돈이 들어온 후 생길 수 있는 문제를 나눠라.
- 비용 부담, 손실 책임, 고객 대응, 업무량 불균형, 결정권 충돌을 구체적으로 말해라.

[그래도 같이 일하려면]
- 계약서에 넣어야 할 기준을 말해라.
- 역할, 수익 배분, 비용 부담, 정산일, 종료 조건, 의사결정권을 반드시 다뤄라.

[동업 전 테스트 방법]
- 바로 사업을 열지 말고 작은 프로젝트로 실행력과 책임감을 확인하라고 말해라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[올해 전체 해운]
- 올해가 어떤 해인지 먼저 결론 내려라.
- 올해는 움직여야 하는 해인지, 버텨야 하는 해인지, 준비해야 하는 해인지, 정리해야 하는 해인지 말해라.
- [카테고리별 사주 프로필]의 올해 유형을 반드시 반영해라.

[올해 재물운]
- 돈복이 들어오는지, 약한지, 중간인지 먼저 말해라.
- 돈이 들어오는 방식과 돈이 새는 구조를 나눠라.
- 무리한 투자, 사업 초기비용, 고정비, 충동소비를 조심해야 하는지 말해라.

[올해 직업/사업운]
- 일이 풀리는 해인지, 막히는 해인지, 준비하는 해인지 말해라.
- 직장, 사업, 부업, 프리랜서 흐름 중 무엇이 강한지 말해라.
- 고정 직업 성향 판정과 충돌하지 않게 설명해라.

[올해 이직운]
- 이직운이 있는지, 없는지, 애매한지 먼저 말해라.
- 움직여야 하는 사람인지, 지금은 머물러야 하는 사람인지 말해라.
- 움직인다면 어떤 조건일 때 움직여야 하는지 말해라.
- 머물러야 한다면 무엇을 준비해야 하는지 말해라.

[올해 건강운]
- 올해 건강운이 괜찮은지 약한지 먼저 말해라.
- 약하다면 위장·소화·장·순환·피로·수면·스트레스 중 사주상 약한 흐름을 구체적으로 말해라.
- 생활에서 무엇을 줄이고 무엇을 잡아야 하는지 말해라.

[올해 관계운]
- 올해 도움이 되는 인연과 거리 둘 인연을 나눠라.
- 가족, 연애, 동료, 사업관계에서 조심할 부분을 말해라.

[1~3개월 흐름]
- 돈, 일/사업, 관계, 건강을 나누어 설명해라.
- 이 구간에서 정리해야 할 것과 피해야 할 선택을 말해라.

[4~6개월 흐름]
- 작게 테스트해야 할 방향을 말해라.
- 수익, 일, 관계에서 어떤 반응을 확인해야 하는지 설명해라.

[7~9개월 흐름]
- 되는 것과 안 되는 것을 구분하는 시기로 풀어라.
- 남길 것, 줄일 것, 거리 둘 것을 구체적으로 말해라.

[10~12개월 흐름]
- 확장보다 안정화가 필요한지, 실제로 키워도 되는지 사주 흐름으로 말해라.
- 다음 해를 위해 준비해야 할 구조를 말해라.

[올해 실행 전략]
- 올해 실제로 해야 할 순서를 정리해라.
- 준비 → 테스트 → 정리 → 안정화 흐름으로 마무리해라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[오늘 돈에서 조심할 것]
- 충동결제, 불필요한 지출, 남 때문에 쓰는 돈을 구체적으로 말해라.

[오늘 사람관계에서 조심할 말]
- 급한 답장, 차가운 말투, 기분 상한 상태의 대화를 구체적으로 말해라.

[오늘 몸 컨디션에서 신경 쓸 부분]
- 과식, 찬 음식, 밤늦은 무리, 피로 누적을 현실적으로 말해라.

[오늘 운을 살리는 한 가지]
- 오늘 당장 할 수 있는 행동 하나를 구체적으로 말해라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[돈이 들어오는 방식]
- 사주상 돈이 어디서 붙는지 구체적으로 말해라.
- 절대 "월급형, 기술형, 장사형, 사업형, 부업형"을 단순 나열하지 마라.
- [카테고리별 사주 프로필]의 type을 기준으로 돈길을 하나로 좁혀라.
- 돈이 한 번에 크게 들어오는 사주인지, 작게 반복해서 모이는 사주인지 구분해라.
- "왜 그 방식이어야 하는지"를 현실감, 책임감, 추진력, 표현력, 정리력, 회복력 같은 쉬운 말로 풀어라.
- 예: 책임관리형이면 관리, 운영, 정산, 신뢰, 반복 고객, 유지보수, 관리형 수익처럼 풀어라.
- 예: 실행수익형이면 작은 판매, 테스트, 반응, 재구매, 마진, 회전율처럼 풀어라.
- 예: 재능가격표형이면 기술, 콘텐츠, 서비스, 가격표, 무료와 유료의 경계처럼 풀어라.

[돈이 모이는 구조]
- 돈이 들어오는 방식과 돈이 모이는 방식은 다르게 설명해라.
- 들어오는 방식은 수익 발생 구조이고, 모이는 방식은 지출 통제·회수 기간·반복성·정산 기준이다.
- 이 사람이 돈을 모으려면 무엇을 기록하고, 무엇을 줄이고, 무엇을 반복해야 하는지 말해라.

[돈이 새는 구조]
- 충동, 체면, 사람, 고정비, 불안한 확장, 준비 없는 투자 중 어디서 새는지 말해라.
- 돈이 새는 장면을 현실적으로 풀어라.
- [카테고리별 사주 프로필]의 위험 요소를 반드시 반영해라.
- "사람 때문에 쓰는 돈"처럼 뭉뚱그리지 말고, 부탁 거절 실패, 정산 기준 없음, 체면성 결제, 고정비 선결제, 회수 늦은 재고처럼 구체화해라.

[맞는 수익 구조]
- [고정 직업 성향 판정]의 최종 표현을 그대로 기준으로 설명해라.
- 직업/사업운에서 나온 직업 성향과 재물운의 수익 구조 설명이 서로 다르면 안 된다.
- 직업명보다 돈이 만들어지는 구조를 먼저 말해라.
- 작게 테스트할 수 있는 수익 구조와 피해야 할 구조를 나눠라.
- [카테고리별 사주 프로필]의 실행 방향을 반드시 반영해라.
- "월급형"이라고 단정하지 말고, 생활 기반·고정 수입·현금흐름·자기수익 구조를 구분해서 설명해라.

[평생 재물 흐름]
- 초년, 청년, 중년, 말년 재물 흐름을 나눠라.
- 언제 돈을 모으기 좋고, 언제 새기 쉬운지 말해라.
- 각 시기마다 돈을 벌 방식, 돈을 지킬 방식, 조심할 선택을 다르게 써라.

[앞으로 1년 재물운]
- 앞으로 1년 동안 돈을 키우는 방식과 돈이 새는 위험을 나눠라.
- 무리한 투자, 준비 없는 사업개시, 고정비 큰 확장을 조심시켜라.
- 1~3개월, 4~6개월, 7~9개월, 10~12개월 중 최소 2개 구간을 짚어라.

[앞으로 1년 참고 흐름]
- [앞으로 1년 재물운]과 같은 말을 반복하지 마라.
- 이 섹션은 돈 외에 일의 리듬, 사람관계, 건강 컨디션이 재물운에 미치는 영향을 짧게 연결해라.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[고정 직업 성향 판정]
- [고정 직업 성향 판정]의 최종 표현을 그대로 설명해라.
- 안정 기반이 필요하다고 해도 최종 성향을 바꾸지 마라.
- [카테고리별 사주 프로필]의 일 구조를 반드시 반영해라.

[맞는 직업군]
- 사주적으로 맞는 직업군을 3~5개 제시해라.
- 각 직업군마다 왜 맞는지, 돈이 되는 방식, 주의할 점을 말해라.
- 단순히 직업명만 나열하지 말고, 어떤 구조가 맞는지 말해라.

[피해야 할 일 구조]
- 피해야 할 직업군/구조를 3~5개 말해라.
- 왜 안 맞는지 설명해라.
- 준비 없는 사업개시, 무리한 투자, 고정비 큰 창업, 남이 시켜서 하는 일, 감정노동 과다 구조를 사주에 맞춰 설명해라.
- [카테고리별 사주 프로필]의 위험 요소를 반드시 반영해라.

[평생 직업 흐름]
- 젊을 때 맞는 일, 중년 이후 맞는 일을 나눠라.
- 초년에는 시행착오가 있는지, 중년 이후 자기 판이 커지는지 말해라.

[앞으로 1년 직업/사업 변화]
- 앞으로 1년 동안 움직여야 할 방향, 테스트해야 할 방향, 피해야 할 결정을 말해라.
- 직장을 다니라는 식으로 단정하지 말고, 생활 기반과 자기수익 구조를 나눠 설명해라.
`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `
[인생 전체 건강운]
- 의료 진단이 아니라 사주상 건강 흐름으로 설명해라.
- 건강운 등급이 왜 그렇게 나왔는지 몸의 리듬, 회복력, 스트레스가 쌓이는 방식으로 설명해라.
- [카테고리별 사주 프로필]의 건강 유형을 반드시 반영해라.

[좋게 타고난 부분]
- 회복력, 버티는 힘, 체력 흐름 중 좋게 타고난 부분을 말해라.
- 어떤 생활을 하면 건강운이 살아나는지 말해라.

[약하게 잡힌 부분]
- 체질적 약점, 무리하면 탈 나는 패턴을 말해라.
- 병명 확정 금지.
- 단, 위장·소화기, 장 리듬, 순환, 몸의 열, 피로 누적, 수면, 긴장성 컨디션처럼 구체적인 흐름은 말해라.

[위장·소화·장 흐름]
- 책임과 긴장이 몸에 쌓이거나 회복 리듬이 약한 구조라면 위장, 소화, 장 리듬이 예민해질 수 있다고 말해라.
- 단, 의학적 진단처럼 말하지 마라.

[시기별 건강 흐름]
- 초년, 청년, 중년, 말년 건강운을 나눠라.
- 어느 시기에 무리하면 탈이 나기 쉬운지 말해라.

[앞으로 1년 건강운]
- 앞으로 1년 동안 조심해야 할 생활 패턴과 좋아지는 루틴을 말해라.
`;
  }

  if (isChildrenCategory(categoryId, title)) {
    return `
[자식 인연의 강약]
- 자식이 있을 가능성, 자식 인연의 강약, 자식이 들어오는 흐름을 조심스럽게 말해라.
- 단, 임신·출산·자식 수·성별은 확정하지 마라.
- [카테고리별 사주 프로필]의 자식운 유형을 반드시 반영해라.
- 자식 인연이 강하게 잡히는지, 중간 이상인지, 늦게 드러나는지, 책임으로 먼저 들어오는지 현실 언어로 풀어라.
- "반드시 있다", "무조건 없다" 같은 말 대신 "비교적 강하게 본다", "늦게 드러나는 편으로 본다", "관계 조율이 더 중요한 편으로 본다"처럼 써라.

[자식복의 성격]
- 자식이 기쁨으로 오는지, 책임으로 오는지, 늦게 복으로 드러나는지 설명해라.
- 자식이 부모에게 힘이 되는 구조인지, 부모가 많이 받쳐줘야 하는 구조인지 말해라.
- 자식복을 편하게만 해석하지 말고, 기쁨·책임·경제적 부담·정서적 보람이 어떻게 섞이는지 말해라.
- 자식복이 바로 편안함으로 오지 않아도 시간이 지나 가족 안에서 고마움과 보람으로 드러날 수 있다는 식으로 풀어라.

[자식과 나의 관계]
- 자식과 가까운 관계인지, 거리 조절이 필요한지, 말과 기준이 중요한지 풀어라.
- 부모가 통제하려 들 때 깨지는지, 방임하면 멀어지는지, 어떤 양육 태도가 맞는지 말해라.
- 자식과의 관계에서 말투, 기대치, 인정 욕구, 비교, 감정 표현, 경제적 선을 구체적으로 풀어라.
- 부모가 자식에게 너무 앞서가면 어떤 문제가 생기는지, 반대로 너무 놔두면 어떤 문제가 생기는지 균형 있게 설명해라.

[자식과 가족관계]
- 자식이 가족 안에서 어떤 역할로 들어오는지 말해라.
- 배우자, 조부모, 형제자매 등 가족관계 안에서 자식으로 인해 생길 수 있는 기쁨과 책임을 함께 말해라.
- 가족 사이에서 자식 문제로 돈, 교육, 기대치, 말투가 부딪힐 수 있는지 풀어라.
- 자식 문제를 한 사람이 혼자 떠안는 구조인지, 가족 전체가 기준을 나눠야 하는 구조인지 말해라.
- 가족 안에서 자식이 분위기를 밝히는 역할인지, 책임을 모으는 역할인지, 관계 조율의 중심이 되는지 설명해라.

[자식의 가능성과 성공운]
- 자식이 어떤 운을 타고 들어오는지 단정하지 말고, 부모 사주에서 보이는 자식의 성장 방향을 말해라.
- 공부형, 기술형, 예술/표현형, 사업감각형, 안정형, 독립형 중 어떤 쪽으로 키워야 가능성이 살아나는지 설명해라.
- 성공 가능성은 보장하지 말고, 어떤 환경을 만들어줘야 자식운이 좋아지는지 말해라.
- 자식의 성공운은 돈을 많이 번다, 크게 성공한다 식으로 단정하지 마라.
- 부모 사주에서 보이는 성장 환경, 성향을 살리는 방향, 꺾이는 양육 방식까지 같이 설명해라.

[부모로서 조심할 부분]
- 기대, 간섭, 경제적 책임, 감정 표현 중 무엇을 조심해야 하는지 말해라.
- 자식을 통해 부모가 대리만족하려는 흐름은 피해야 한다고 말해라.
- 비교, 성적 압박, 진로 강요, 돈으로만 해결하려는 태도, 말투로 몰아붙이는 방식을 구체적으로 경고해라.
- 조심할 부분은 겁주는 말이 아니라 실제 부모 역할에서 바꿀 수 있는 행동으로 써라.

[자식운이 좋아지는 조건]
- 말투, 경제적 선, 기대치, 거리감, 부모 자신의 삶을 어떻게 잡아야 하는지 말해라.
- 자식운은 붙잡는 운이 아니라 관계의 온도와 성장 환경을 맞출 때 좋아진다고 풀어라.
- 부모가 먼저 생활 리듬, 돈 기준, 감정 표현 기준을 잡아야 자식운이 덜 무거워진다고 말해라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[초년운]
- 어릴 때부터 20대 초반까지의 흐름을 풀어라.
- 가족 영향, 성격 형성, 공부/진로 기초, 건강 흐름, 돈에 대한 감각을 포함해라.
- [카테고리별 사주 프로필]의 인생대운 유형을 참고해라.

[청년운]
- 20대 중후반부터 30대 흐름을 풀어라.
- 직업 선택, 돈의 기초, 연애·결혼 흐름, 사람관계, 시행착오를 포함해라.

[중년운]
- 40대부터 50대 흐름을 풀어라.
- 재물운, 직업/사업운, 가족 책임, 건강관리, 자리 잡는 시기를 포함해라.

[말년운]
- 60대 이후 흐름을 풀어라.
- 재물 안정, 건강 흐름, 가족과의 거리, 마음의 평안, 남는 운을 포함해라.

[내 인생의 대운 기회]
- 인생에서 크게 방향이 바뀌는 기회가 몇 번 들어오는지 말해라.
- 대운은 정확한 연도 확정이 아니라, 사주 흐름상 강하게 열리는 시기대로 설명해라.
- 대운의 기회가 돈, 일, 사람, 건강 중 어디서 오는지 말해라.

[가장 중요한 대운]
- 가장 크게 잡아야 할 대운 시기를 말해라.
- 그 시기에 재물운, 직업운, 건강운, 사람관계가 어떻게 움직이는지 설명해라.

[대운을 잡으려면]
- 이 사주가 대운을 놓치는 패턴을 말해라.
- 대운이 들어오기 전에 준비해야 할 일, 정리해야 할 사람, 줄여야 할 습관을 구체적으로 말해라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[타고난 사주 핵심]
- 일간, 월지, 오행 분포를 현실 언어로 번역해라.
- 사주 용어를 길게 늘어놓지 말고, 이 사람이 평생 반복하기 쉬운 장점과 약점을 먼저 말해라.

[초년운]
- 어릴 때부터 20대 초반까지의 흐름을 풀어라.
- 가족 영향, 성격 형성, 공부/진로 기초, 건강 흐름, 돈에 대한 감각을 포함해라.
- 초년에 막히는 부분이 있다면 왜 막히는지 말해라.

[청년운]
- 20대 중후반부터 30대 흐름을 풀어라.
- 직업 선택, 돈의 기초, 연애·결혼 흐름, 사람관계, 시행착오를 포함해라.
- 이 시기에 돈과 일이 어떻게 흔들리고 어떤 기준을 잡아야 하는지 말해라.

[중년운]
- 40대부터 50대 흐름을 풀어라.
- 재물운, 직업/사업운, 가족 책임, 건강관리, 자리 잡는 시기를 포함해라.
- 인생이 풀리는 핵심 시기가 중년 쪽이면 반드시 강하게 설명해라.

[말년운]
- 60대 이후 흐름을 풀어라.
- 재물 안정, 건강 흐름, 가족과의 거리, 마음의 평안, 남는 운을 포함해라.
- 말년에 무엇을 남기고 무엇을 줄여야 안정되는지 말해라.

[재물운]
- 돈복 등급을 [전체 고정 운세 기준]과 동일하게 말해라.
- 돈이 들어오는 방식, 돈이 모이는 방식, 돈이 새는 구조를 설명해라.
- 초년·청년·중년·말년 중 어느 시기에 돈이 모이기 쉬운지 말해라.

[직업운·사업운]
- [고정 직업 성향 판정]을 절대 바꾸지 말고 평생 직업 흐름을 말해라.
- 직장형/사업형/부업형을 새로 판단하지 마라.
- 젊을 때 맞는 일 구조와 중년 이후 맞는 일 구조를 나눠라.
- 언제 자기 판이 커질 수 있는지 말해라.

[건강운]
- 인생 전체 건강운, 체질적 약점, 무리하면 탈 나는 패턴을 반드시 포함해라.
- 위장·소화·장·순환·피로·수면·스트레스성 긴장 중 해당되는 흐름을 현실적으로 풀어라.
- 어느 시기에 건강을 가장 조심해야 하는지 말해라.

[인연·가족·자식운]
- 연애/결혼 패턴, 가족 거리감, 자식 인연, 자식복, 관계 흐름, 부모 역할을 포함해라.
- 자식 유무, 임신, 출산, 자식 수, 성별은 단정하지 마라.
- 가족이나 자식과의 관계에서 기대, 책임, 거리감, 말투 기준을 설명해라.

[대운과 인생이 풀리는 시기]
- 인생에서 크게 방향이 바뀌는 기회가 몇 번 들어오는지 말해라.
- 가장 중요한 대운이 언제쯤 들어오는지 말해라.
- 대운은 정확한 연도 단정이 아니라 청년 후반, 중년 초입, 중년 중반, 중년 이후처럼 시기 흐름으로 설명해라.
- 그 기회가 돈, 일, 사람, 건강 중 어디서 오는지 말해라.

[최종적으로 안정되는 시기]
- 돈, 일, 건강, 관계가 최종적으로 안정되는 시기를 종합해서 말해라.
- 왜 그 시기에 안정되는지 사주 흐름과 현실 선택 기준을 연결해라.
- 안정되기 전에 반드시 줄여야 할 선택을 말해라.
`;
  }

  return `
[카테고리 핵심 분석]
- 선택 카테고리의 핵심만 깊게 풀어라.
`;
}

function buildPreviewPrompt(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
  fixedConclusionText: string;
  profileText: string;
}) {
  const { user, categoryId, categoryTitle, question, manseText, fixedConclusionText, profileText } = params;

  return `
${buildUserInfoText(user)}

${manseText}

${fixedConclusionText}

${profileText}

[선택 카테고리]
${categoryTitle}

[사용자 질문]
${question || "없음"}

[질문 사용 제한]
- 위 사용자 질문은 현재 고민을 이해하는 용도로만 사용해라.
- 질문에 나온 직업, 부업, 사업, 지역, 과거 대화 맥락을 사주상 고정 성향으로 학습하거나 반영하지 마라.
- 직업 성향, 돈복 등급, 건강운 등급, 궁합 점수는 반드시 [고정 결론]과 [고정 직업 성향 판정]만 따른다.

${getCategoryGuide(categoryId, categoryTitle)}

[무료 결과 작성 지시]
무료 결과를 작성해라.

반드시 아래 4개 섹션만 써라.
다른 제목 추가 금지.

[결론부터 말하면]
- 첫 문장은 반드시 [고정 결론]과 같은 의미로 시작해라.
- 만세력 설명부터 시작하지 마라.
- 첫 문장은 사용자가 바로 이해할 수 있는 현실어로 써라.
- 등급 표현은 "중다", "상다"처럼 쓰지 말고 "중으로 본다", "상으로 본다"처럼 써라.

[왜 그렇게 보냐면]
- 여기서 일간, 월지, 오행 분포를 설명해라.
- [본인 만세력]에 있는 값만 사용해라.
- 궁합풀이, 가족관계, 사업파트너에서는 [본인 만세력]과 [상대방 만세력]을 비교해라.
- 어려운 명리학 용어는 현실 언어로 풀어라.
- 오행 용어를 길게 쓰지 말고 현실 단어로 번역해라.

[이 운에서 조심할 부분]
- 이 카테고리에서 반복될 수 있는 문제를 말해라.
- 겁주지 말고, 왜 그런 패턴이 나오는지 사주 근거로 말해라.
- 궁합/가족관계/사업파트너에서는 공통 fallback 문구를 쓰지 말고 두 사람의 사주 구조 기반으로 말해라.
- 재물운/직업운/건강운/연애운/결혼운/자식운/신년운세/고민풀이/프리미엄은 [카테고리별 사주 프로필]의 위험 요소를 반드시 반영해라.

[전체 리포트에서 이어지는 핵심]
${getPreviewTease(categoryId, categoryTitle)}

길이:
- 1200~1700자.
- 문단 사이에 빈 줄을 넣어라.
- 말투는 친한 형처럼.
`;
}

function getFullReportStructure(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (isChildrenCategory(categoryId, title)) {
    return `
[출력 구조]
전체 자식운 리포트는 아래 8개 섹션만 써라.
기존 공통 운세 구조로 쓰지 마라.
자식운은 "운이 막히는 패턴", "운이 살아나는 조건", "앞으로 1년 참고 흐름" 같은 일반 운세 챕터로 쓰면 안 된다.

1. [결론부터 말하면]
2. [자식 인연의 강약]
3. [자식복의 성격]
4. [자식과 나의 관계]
5. [자식과 가족관계]
6. [자식의 가능성과 성공운]
7. [부모로서 조심할 부분]
8. [형이 딱 정리해줄게]

[자식운 필수 규칙]
- [결론부터 말하면]에서는 자식운 전체 결론을 먼저 말해라.
- [자식 인연의 강약]에서는 자식 유무를 확정하지 말고, 자식 인연이 강한지, 중간인지, 늦게 드러나는지 흐름으로 말해라.
- [자식복의 성격]에서는 자식이 기쁨으로 들어오는지, 책임으로 들어오는지, 늦게 복으로 드러나는지 설명해라.
- [자식과 나의 관계]에서는 말투, 기대치, 거리감, 통제와 방임 사이의 균형을 구체적으로 말해라.
- [자식과 가족관계]에서는 배우자, 조부모, 형제자매 등 가족 안에서 자식 문제로 생길 수 있는 기쁨과 책임을 함께 말해라.
- [자식의 가능성과 성공운]에서는 성공을 보장하지 말고, 공부형, 기술형, 예술/표현형, 사업감각형, 안정형, 독립형 중 어떤 환경에서 가능성이 살아나는지 말해라.
- [부모로서 조심할 부분]에서는 기대, 간섭, 경제적 책임, 비교, 대리만족, 말투 문제를 구체적으로 풀어라.
- [형이 딱 정리해줄게]에서는 자식 인연, 자식복, 관계, 가족관계, 성장 방향을 다시 현실적으로 정리해라.

[자식운에서 절대 쓰면 안 되는 섹션]
- [왜 그렇게 보냐면] 섹션 금지
- [이 운이 막히는 패턴] 섹션 금지
- [이 운이 살아나는 조건] 섹션 금지
- [앞으로 1년 참고 흐름] 섹션 금지
- [하지 말아야 할 선택] 별도 섹션 금지
- [잡아야 할 방향] 별도 섹션 금지

[중복 금지]
- "자식의 성향을 잘 관찰하고 그에 맞는 방향으로 키워주는 것이 중요해" 같은 문장을 반복하지 마라.
- "부모의 역할과 기대치에 따라 달라질 수 있어" 같은 문장을 반복하지 마라.
- "자식이 들어온다면 기쁨과 책임이 함께 온다"는 말을 여러 섹션에서 반복하지 마라.
- "자식이 들어온다면"이라는 표현을 여러 번 반복하지 마라.
- 같은 내용을 말하더라도 섹션마다 다른 관점으로 풀어라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[출력 구조]
전체 리포트는 아래 7개 섹션만 써라. 불필요한 챕터를 늘리지 마라.
1. [결론부터 말하면]
2. [올해 전체 흐름]
3. [올해 돈·일·이직운]
4. [올해 건강·관계운]
5. [1~3개월 / 4~6개월 / 7~9개월 / 10~12개월]
6. [올해 피해야 할 선택]
7. [올해 잡아야 할 방향]

[중복 금지]
- [올해 피해야 할 선택]과 [올해 잡아야 할 방향]은 각각 3개만 써라.
- 뻔한 말 금지: "무리하지 마라", "기준을 잡아라", "반복 수익을 만들어라"만 단독으로 쓰지 마라.
- 앞에서 이미 말한 문장을 다시 반복하지 마라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[출력 구조]
전체 리포트는 아래 7개 섹션만 써라. 불필요한 챕터를 늘리지 마라.
1. [결론부터 말하면]
2. [왜 그렇게 보냐면]
3. [돈이 들어오는 방식]
4. [돈이 새는 구조]
5. [맞는 수익 구조]
6. [앞으로 1년 재물 흐름]
7. [형이 딱 정리해줄게]

[중복 금지]
- [하지 말아야 할 선택], [잡아야 할 방향]이라는 별도 섹션을 만들지 마라.
- 피해야 할 선택과 잡아야 할 방향은 [형이 딱 정리해줄게] 안에서 3줄로만 정리해라.
- "작게 검증", "반복 수익", "고정비 조심"을 여러 섹션에서 반복하지 마라.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `
[출력 구조]
전체 리포트는 아래 7개 섹션만 써라.
1. [결론부터 말하면]
2. [고정 직업 성향]
3. [맞는 일 구조]
4. [피해야 할 일 구조]
5. [앞으로 1년 일 흐름]
6. [지금 테스트할 방향]
7. [형이 딱 정리해줄게]

[중복 금지]
- 직업 성향은 [고정 직업 성향 판정]의 최종 표현만 써라.
- 재물운에서 말한 직업 성향과 다르면 안 된다.
- 같은 조언을 피해야 할 선택/잡아야 할 방향으로 반복하지 마라.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[출력 구조]
전체 리포트는 아래 8개 섹션만 써라.
1. [결론부터 말하면]
2. [질문의 핵심]
3. [돈 흐름]
4. [일·사업 흐름]
5. [관계 흐름]
6. [건강 흐름]
7. [앞으로 1년 방향]
8. [형이 딱 정리해줄게]

[중복 금지]
- 오늘 할 일, 보류할 일, 정리할 일은 [형이 딱 정리해줄게] 안에서만 짧게 써라.
- 같은 내용을 [앞으로 1년 방향]과 [형이 딱 정리해줄게]에서 반복하지 마라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[출력 구조]
전체 리포트는 아래 8개 섹션만 써라.
1. [결론부터 말하면]
2. [초년운]
3. [청년운]
4. [중년운]
5. [말년운]
6. [내 인생의 대운 기회]
7. [가장 중요한 대운]
8. [대운을 잡으려면]

[중복 금지]
- 각 시기마다 재물·일·건강·관계를 짧게 포함하되 같은 문장 반복 금지.
- [하지 말아야 할 선택], [잡아야 할 방향] 섹션을 별도로 만들지 마라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[출력 구조]
평생종합사주는 절대 짧게 줄이지 마라. 아래 13개 섹션을 반드시 써라.
1. [결론부터 말하면]
2. [타고난 사주 핵심]
3. [초년운]
4. [청년운]
5. [중년운]
6. [말년운]
7. [재물운]
8. [직업운·사업운]
9. [건강운]
10. [인연·가족·자식운]
11. [대운과 인생이 풀리는 시기]
12. [최종적으로 안정되는 시기]
13. [형이 딱 정리해줄게]

[평생종합사주 필수 규칙]
- 평생종합사주는 인생 전체 리포트이므로 초년운·청년운·중년운·말년운을 절대 빼지 마라.
- 각 시기마다 재물, 직업/사업, 건강, 가족/관계 흐름을 함께 설명해라.
- 단순 성격풀이로 끝내지 말고 언제 막히고 언제 풀리는지 말해라.
- 재물운은 돈복 등급과 돈이 모이는 방식, 돈이 새는 구조, 중년 이후 재물 안정 가능성을 포함해라.
- 직업운·사업운은 [고정 직업 성향 판정]의 최종 표현을 절대 바꾸지 말고, 평생 일 흐름과 자기 수익 구조가 커지는 시기를 말해라.
- 건강운은 의료 진단이 아니라 사주상 건강 흐름으로 위장·소화·장·순환·피로·수면·스트레스성 긴장 중 해당 흐름을 구체적으로 말해라.
- 인연·가족·자식운은 결혼/가족/자식 인연을 단정하지 말고 관계 흐름, 책임, 거리감, 말투 기준으로 풀어라.
- 대운과 인생이 풀리는 시기는 정확한 연도 단정이 아니라 청년 후반, 중년 초입, 중년 중반, 중년 이후처럼 시기 흐름으로 말해라.
- 최종적으로 안정되는 시기는 돈, 일, 건강, 관계가 어느 시점부터 안정되는지 종합해서 말해라.
- [하지 말아야 할 선택], [잡아야 할 방향] 섹션을 별도로 만들지 말고 [형이 딱 정리해줄게] 안에서 짧게 정리해라.
`;
  }

  if (isCompatibilityCategory(categoryId, title) || isFamilyCategory(categoryId, title) || isPartnerCategory(categoryId, title)) {
    return `
[출력 구조]
전체 리포트는 아래 7개 섹션만 써라.
1. [결론부터 말하면]
2. [점수 해석]
3. [맞는 부분]
4. [부딪히는 부분]
5. [같이 가면 생길 수 있는 문제]
6. [좋아지는 조건]
7. [형이 딱 정리해줄게]

[중복 금지]
- [하지 말아야 할 선택], [잡아야 할 방향] 섹션을 별도로 만들지 마라.
- 관계 카테고리에서는 공통 조언 금지. 두 사람 구조, 말투, 돈 기준, 책임, 거리감만 써라.
`;
  }

  return `
[출력 구조]
전체 리포트는 아래 6개 섹션만 써라.
1. [결론부터 말하면]
2. [왜 그렇게 보냐면]
3. [이 운이 막히는 패턴]
4. [이 운이 살아나는 조건]
5. [앞으로 1년 참고 흐름]
6. [형이 딱 정리해줄게]

[중복 금지]
- 같은 조언을 두 번 이상 반복하지 마라.
- 불필요한 챕터를 만들지 마라.
`;
}

function cleanGeneratedText(text: string) {
  return (text || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*#\s*$/gm, "")
    .replace(/\n{4,}/g, NL + NL + NL)
    .trim();
}

function buildFullPrompt(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
  fixedConclusionText: string;
  profileText: string;
}) {
  const { user, categoryId, categoryTitle, question, manseText, fixedConclusionText, profileText } = params;
  const categorySections = getFullSections(categoryId, categoryTitle);

  return `
${buildUserInfoText(user)}

${manseText}

${fixedConclusionText}

${profileText}

[선택 카테고리]
${categoryTitle}

[사용자 질문]
${question || "없음"}

[질문 사용 제한]
- 위 사용자 질문은 현재 고민을 이해하는 용도로만 사용해라.
- 질문에 나온 직업, 부업, 사업, 지역, 과거 대화 맥락을 사주상 고정 성향으로 학습하거나 반영하지 마라.
- 직업 성향, 돈복 등급, 건강운 등급, 궁합 점수는 반드시 [고정 결론]과 [고정 직업 성향 판정]만 따른다.

${getCategoryGuide(categoryId, categoryTitle)}

[전체 리포트 작성 지시]
전체 유료 리포트를 작성해라.
결제 유도 문구 금지.
다른 카테고리 추천 금지.
등급 표현은 "중다", "상다"처럼 쓰지 말고 "중으로 본다", "상으로 본다"처럼 자연스럽게 써라.
궁합/가족관계/사업파트너에서는 "불안해서 급하게 결정", "남이 좋다는 이유", "이미 아닌 걸 알면서" 같은 공통 fallback 문구 금지.
재물운/직업운/건강운/연애운/결혼운/자식운/신년운세/고민풀이/프리미엄/인생대운은 [카테고리별 사주 프로필]의 유형, 위험, 실행 방향을 반드시 반영해라.

자식운일 경우에는 반드시 자식운 전용 출력 구조만 사용해라.
자식운일 경우 [왜 그렇게 보냐면], [이 운이 막히는 패턴], [이 운이 살아나는 조건], [앞으로 1년 참고 흐름] 섹션을 절대 쓰지 마라.
자식운일 경우 [자식 인연의 강약], [자식복의 성격], [자식과 나의 관계], [자식과 가족관계], [자식의 가능성과 성공운], [부모로서 조심할 부분]을 반드시 써라.
자식운은 일반 운세처럼 쓰지 말고 부모와 자식 관계 리포트처럼 써라.
자식운에서는 "자식이 들어온다면"이라는 표현을 여러 번 반복하지 마라.
자식운에서는 같은 문장을 섹션마다 반복하지 마라.

마크다운 제목 기호 # 를 절대 쓰지 마라. 제목은 [결론부터 말하면]처럼 대괄호만 써라.
빈 제목, # 단독 줄, 의미 없는 장식 문자를 출력하지 마라.

${getFullReportStructure(categoryId, categoryTitle)}

[카테고리 세부 참고]
아래 내용은 참고만 하고, 출력 구조의 섹션 수를 늘리지 마라.
${categorySections}
${getRiskChoices(categoryId, categoryTitle)}
${getDirectionChoices(categoryId, categoryTitle)}
${getFinalSummaryGuide(categoryId, categoryTitle)}

길이:
- 일반 카테고리: 3500~6500자.
- 프리미엄상담: 5000~8000자.
- 평생종합사주: 6500~9500자.
- 자식운: 3500~6500자. 단, 반드시 자식운 전용 8개 섹션으로 구체적으로 작성해라.
- 문단 사이에 빈 줄을 넣어라.
`;
}

function fallbackPreview(categoryId: CategoryId, categoryTitle: string, user: UserInfo, manse: any, partnerManse?: any | null) {
  const fixed = getFixedConclusionBlock(categoryId, categoryTitle, user, manse, partnerManse).replace("[고정 결론]", "").trim();
  const profileText = getCategoryProfileText(categoryId, categoryTitle, manse, safeText(user.question, ""));

  return `[결론부터 말하면]

${fixed}

[왜 그렇게 보냐면]

제공된 만세력 기준으로 보면 이 결론은 타고난 성향과 사주 흐름에서 나온 방향이야.

이번 카테고리에서는 아래 흐름을 같이 봐야 해.

${profileText}

[이 운에서 조심할 부분]

이 운은 무리하게 밀어붙인다고 바로 좋아지는 흐름은 아니야.

타고난 장점은 살리고, 반복해서 흔들리는 약점은 생활 기준으로 보완해야 같은 문제가 줄어들어.

[전체 리포트에서 이어지는 핵심]

${getPreviewTease(categoryId, categoryTitle)}`;
}

function fallbackChildrenFull(categoryId: CategoryId, categoryTitle: string, user: UserInfo, manse: any, partnerManse?: any | null) {
  const fixed = getFixedConclusionBlock(categoryId, categoryTitle, user, manse, partnerManse)
    .replace("[고정 결론]", "")
    .trim();
  const profileText = getCategoryProfileText(categoryId, categoryTitle, manse, safeText(user.question, ""));

  return `[결론부터 말하면]

${fixed}

[자식 인연의 강약]

자식운은 자식이 있다 없다를 확정하는 풀이가 아니야.

이 흐름은 자식 인연이 어떤 방식으로 들어오고, 들어온 인연을 부모가 어떤 관계로 키워가느냐를 보는 거야.

${profileText}

자식 인연이 강하게 보이면 그만큼 기쁨도 커질 수 있지만, 동시에 부모 역할도 선명해져.

반대로 자식운이 늦게 드러나는 구조라면 조급하게 단정할 게 아니라, 관계를 만들어가는 속도와 가족 안의 준비 상태를 같이 봐야 해.

[자식복의 성격]

자식복은 단순히 편하게 들어오는 복만 뜻하지 않아.

기쁨으로 드러날 수도 있고, 책임으로 먼저 들어왔다가 시간이 지나면서 가족 안에서 복으로 느껴질 수도 있어.

중요한 건 자식이 부모에게 어떤 의미로 들어오느냐야.

마음의 기쁨이 커지는 구조인지, 책임과 현실 부담이 같이 커지는 구조인지, 늦게 고마움으로 돌아오는 구조인지까지 봐야 해.

자식복이 좋다는 말도 아무 부담이 없다는 뜻은 아니야.

오히려 자식과의 관계를 잘 다듬을수록 나중에 정서적인 보람과 가족 안의 안정감으로 돌아오는 흐름에 가깝다.

[자식과 나의 관계]

자식과의 관계는 말투, 기대치, 거리감이 핵심이야.

가까운 관계가 될 수 있어도 부모가 너무 앞서가면 자식 입장에서는 사랑보다 압박으로 느껴질 수 있어.

통제와 방임 사이의 균형이 중요해.

아이를 완전히 놔두는 것도 아니고, 부모 기준으로만 끌고 가는 것도 아니야.

자식과의 관계에서 제일 중요한 건 반복되는 말투야.

부모는 조언이라고 생각해도 자식은 평가로 받아들일 수 있고, 부모는 걱정이라고 생각해도 자식은 간섭으로 느낄 수 있어.

[자식과 가족관계]

자식은 가족 안에서 기쁨이 될 수 있지만, 동시에 돈, 교육, 기대치, 책임 문제가 모이는 지점이 될 수도 있어.

배우자와 교육 방향이 다르거나, 조부모의 기대가 섞이거나, 형제자매 사이에서 비교가 생기면 자식운이 무거워질 수 있어.

그래서 자식운은 아이 하나만 보는 게 아니라 가족 전체의 말투와 기준을 같이 봐야 해.

가족 안에서 누가 어디까지 책임질지, 돈과 기대를 어디까지 둘지 미리 정해야 관계가 덜 흔들려.

자식이 가족 분위기를 밝히는 역할로 들어올 수도 있지만, 가족의 욕심과 기대가 한곳에 모이면 아이에게 부담이 될 수 있어.

그러니까 가족들이 아이를 중심으로 뭉치는 건 좋지만, 아이를 가족 기대의 중심에 세우는 건 조심해야 해.

[자식의 가능성과 성공운]

자식의 성공운은 보장처럼 말하면 안 돼.

대신 부모 사주에서 보이는 방향으로 보면, 자식의 가능성은 맞는 환경을 만들어줄 때 살아나는 쪽이야.

공부형인지, 기술형인지, 예술/표현형인지, 사업감각형인지, 안정형인지, 독립형인지를 봐야 해.

중요한 건 부모가 원하는 방향으로 밀어붙이는 게 아니라, 아이가 반복해서 힘을 내는 환경을 찾아주는 거야.

만약 표현력이 살아나는 아이면 말, 예술, 콘텐츠, 사람 앞에서 드러내는 경험이 도움이 될 수 있어.

안정형 아이면 규칙적인 환경과 차분한 루틴이 필요하고, 독립형 아이면 너무 많이 간섭하지 않을 때 가능성이 더 잘 살아날 수 있어.

[부모로서 조심할 부분]

첫째, 자식을 부모의 대리만족으로 끌고 가면 안 돼.

부모가 못 이룬 걸 아이에게 대신 시키려 하면 자식운은 복이 아니라 부담으로 바뀔 수 있어.

둘째, 경제적 책임을 혼자 다 떠안는 구조를 조심해야 해.

교육비, 지원, 생활비, 가족 도움의 선이 흐려지면 사랑이 부담으로 바뀌기 쉬워.

셋째, 말투와 기대치를 조심해야 해.

좋은 뜻으로 하는 말도 반복되면 아이에게는 평가나 통제로 느껴질 수 있어.

넷째, 비교를 조심해야 해.

형제, 친척, 친구 자녀와 비교하는 순간 자식운은 성장보다 부담으로 흐르기 쉽다.

[형이 딱 정리해줄게]

자식운은 있다 없다로 끝나는 운이 아니야.

자식 인연이 어떤 방식으로 들어오고, 그 인연을 부모가 어떤 말투와 기준으로 키워가느냐가 핵심이야.

자식복은 기쁨만 보는 게 아니라 책임, 가족 안의 역할, 돈과 기대치, 부모의 거리감까지 같이 봐야 해.

자식의 가능성과 성공운도 보장처럼 보는 게 아니라, 어떤 환경에서 가능성이 살아나는지를 봐야 해.

기대보다 기준, 통제보다 거리, 감정보다 말의 온도, 그리고 부모 자신의 삶을 지키는 게 중요해.

자식운은 붙잡는 운이 아니라, 관계의 온도와 성장 환경을 맞춰야 살아나는 운이야.`;
}

function fallbackFull(categoryId: CategoryId, categoryTitle: string, user: UserInfo, manse: any, partnerManse?: any | null) {
  if (isChildrenCategory(categoryId, categoryTitle)) {
    return fallbackChildrenFull(categoryId, categoryTitle, user, manse, partnerManse);
  }

  const fixed = getFixedConclusionBlock(categoryId, categoryTitle, user, manse, partnerManse).replace("[고정 결론]", "").trim();
  const profileText = getCategoryProfileText(categoryId, categoryTitle, manse, safeText(user.question, ""));

  return `[결론부터 말하면]

${fixed}

[왜 그렇게 보냐면]

제공된 만세력 기준으로 보면 이 결론은 일간, 월지, 사주 흐름의 균형에서 나온 방향이야.

타고난 장점도 과하면 부담이 되고, 약한 부분은 반복되는 문제로 나타날 수 있어.

${profileText}

[타고난 ${categoryTitle}]

이 운은 없는 운이라기보다, 맞는 방식으로 써야 살아나는 운이야.

[이 운이 막히는 패턴]

급하게 결정하거나, 반복해서 흔들리는 약점을 무시하고 밀어붙이면 같은 문제가 반복될 수 있어.

[이 운이 살아나는 조건]

타고난 장점은 살리고, 부족하게 반복되는 부분은 생활과 선택으로 보완해야 해.

[앞으로 1년 참고 흐름]

앞으로 1년은 결론을 바꾸는 시기가 아니라, 이미 나온 결론을 현실에서 확인하고 기준을 잡는 흐름이야.

${getRiskChoices(categoryId, categoryTitle)}

${getDirectionChoices(categoryId, categoryTitle)}

${getFinalSummaryGuide(categoryId, categoryTitle)}
`;
}

async function generateText(prompt: string, maxTokens: number) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: prompt },
    ],
    temperature: 0.12,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

function getPreviewMaxTokens(categoryId: CategoryId) {
  if (categoryId === "traditional") return 2300;
  if (categoryId === "premium") return 2300;
  if (categoryId === "monthly") return 2300;
  return 2100;
}

function getFullMaxTokens(categoryId: CategoryId) {
  if (categoryId === "traditional") return 12000;
  if (categoryId === "premium") return 10000;
  if (categoryId === "monthly") return 9000;
  if (categoryId === "children") return 9000;
  return 8200;
}

function responsePayload(params: {
  preview: string;
  full: string;
  result: string;
  manse?: any;
  partnerManse?: any | null;
  fixedConclusion?: string;
  profileText?: string;
}) {
  return {
    ...params,
    routeVersion: ROUTE_VERSION,
    relationshipLogic: RELATIONSHIP_LOGIC,
    yearlyLogic: YEARLY_LOGIC,
    worryLogic: "question-first-specific-worry-v2",
    premiumLogic: "plain-language-total-report-v2",
    childrenLogic: CHILDREN_LOGIC,
    plainLanguageLogic: "no-standalone-five-elements-v2",
    fixedCareerLogic: "single-career-archetype-across-categories-v2",
    profileLogic: PROFILE_LOGIC,
    previewLogic: PREVIEW_LOGIC,
    preserveLogic: "original-route-preserved-with-children-dedicated-structure-v2",
  };
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
    const partnerManseText = partnerManse
      ? formatManseForPrompt(partnerManse)
      : "상대방 만세력 정보: 상대방 생년월일 또는 출생 정보가 부족합니다.";

    const fixedConclusionText = getFixedConclusionBlock(categoryId, categoryTitle, user, myManse, partnerManse);
    const profileText = getCategoryProfileText(categoryId, categoryTitle, myManse, question);
    const careerBlock = shouldUseCareerArchetype(categoryId)
      ? getCareerArchetypeGuide(myManse)
      : `[고정 직업 성향 판정]
이 카테고리에서는 직업 성향 판정을 사용하지 않는다.
직업운, 사업운, 직장형/사업형/부업형 판정, 직업군 추천을 쓰지 마라.`;

    const globalCareer = getCareerArchetype(myManse);
    const globalMoneyGrade = getMoneyGrade(myManse);
    const globalHealthGrade = getHealthGrade(myManse);

    const manseText = `
[전체 고정 운세 기준]
- 돈복 등급: ${globalMoneyGrade}
- 건강운 등급: ${globalHealthGrade}
- 직업/사업 성향: ${globalCareer.combined}
- 이 기준은 모든 카테고리에서 동일하게 유지한다.
- 재물운, 신년운세, 평생종합사주, 프리미엄상담에서 돈복·건강운·직업성향을 말할 때 이 값을 절대 바꾸지 마라.

[본인 만세력]
${myManseText}

${careerBlock}

[상대방 만세력]
${partnerManseText}
`;

    if (!process.env.OPENAI_API_KEY) {
      const preview = fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
      const full = fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);

      if (mode === "full") {
        return NextResponse.json(responsePayload({ preview: "", full, result: full, manse: myManse, partnerManse, fixedConclusion: fixedConclusionText, profileText }));
      }

      if (mode === "both") {
        return NextResponse.json(responsePayload({ preview, full, result: full, manse: myManse, partnerManse, fixedConclusion: fixedConclusionText, profileText }));
      }

      return NextResponse.json(responsePayload({ preview, full: "", result: preview, manse: myManse, partnerManse, fixedConclusion: fixedConclusionText, profileText }));
    }

    if (mode === "preview") {
      let preview = "";
      try {
        preview = await generateText(
          buildPreviewPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText, profileText }),
          getPreviewMaxTokens(categoryId)
        );
      } catch (error) {
        console.error("preview generation error:", error);
        preview = fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
      }

      const finalPreview = preview || fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);

      return NextResponse.json(
        responsePayload({
          preview: cleanGeneratedText(finalPreview),
          full: "",
          result: cleanGeneratedText(finalPreview),
          manse: myManse,
          partnerManse,
          fixedConclusion: fixedConclusionText,
          profileText,
        })
      );
    }

    if (mode === "full") {
      let full = "";
      try {
        full = await generateText(
          buildFullPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText, profileText }),
          getFullMaxTokens(categoryId)
        );
      } catch (error) {
        console.error("full generation error:", error);
        full = fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);
      }

      const finalFull = full || fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);

      return NextResponse.json(
        responsePayload({
          preview: "",
          full: cleanGeneratedText(finalFull),
          result: cleanGeneratedText(finalFull),
          manse: myManse,
          partnerManse,
          fixedConclusion: fixedConclusionText,
          profileText,
        })
      );
    }

    let preview = "";
    let full = "";

    try {
      preview = await generateText(
        buildPreviewPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText, profileText }),
        getPreviewMaxTokens(categoryId)
      );
    } catch (error) {
      console.error("preview generation error:", error);
      preview = fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
    }

    try {
      full = await generateText(
        buildFullPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText, profileText }),
        getFullMaxTokens(categoryId)
      );
    } catch (error) {
      console.error("full generation error:", error);
      full = fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);
    }

    const finalPreview = preview || fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
    const finalFull = full || fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);

    return NextResponse.json(
      responsePayload({
        preview: cleanGeneratedText(finalPreview),
        full: cleanGeneratedText(finalFull),
        result: cleanGeneratedText(finalFull),
        manse: myManse,
        partnerManse,
        fixedConclusion: fixedConclusionText,
        profileText,
      })
    );
  } catch (error) {
    console.error("fortune route error:", error);

    return NextResponse.json(
      responsePayload({
        preview: `[결론부터 말하면]

지금 운세 생성 중 문제가 생겼어.

[왜 그렇게 보냐면]

서버에서 만세력 또는 AI 응답을 처리하는 중 오류가 난 상태야.

[이 운에서 조심할 부분]

코드 오류가 있는 상태에서 계속 테스트하면 결과가 흔들릴 수 있어.

[전체 리포트에서 이어지는 핵심]

터미널 에러 메시지를 확인해서 route.ts와 manse.ts 연결을 먼저 잡아야 해.`,
        full: "",
        result: "",
      }),
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "soreum saju fortune route is working",
    model: MODEL,
    routeVersion: ROUTE_VERSION,
    relationshipLogic: RELATIONSHIP_LOGIC,
    yearlyLogic: YEARLY_LOGIC,
    worryLogic: "question-first-specific-worry-v2",
    premiumLogic: "plain-language-total-report-v2",
    childrenLogic: CHILDREN_LOGIC,
    profileLogic: PROFILE_LOGIC,
    previewLogic: PREVIEW_LOGIC,
  });
}
