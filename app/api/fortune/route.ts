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

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ROUTE_VERSION = "soreum-route-family-partner-newyear-v3";
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
  if (categoryTitle) return categoryTitle === "인생흐름" ? "인생대운" : categoryTitle;

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

  if (score >= 5) return "자식 인연이 비교적 강한 편";
  if (score >= 3) return "자식운은 중간 이상이지만 관계 조율이 중요한 편";
  if (score >= 1) return "자식운이 늦게 드러나거나 책임으로 들어오는 편";
  return "자식운은 관계 조율과 거리감이 중요한 편";
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
  };
}

function getCareerArchetypeGuide(manse: any) {
  const career = getCareerArchetype(manse);
  const scoreLines = career.scores.map((item) => `- ${item.type}: ${item.score}`).join(NL);

  return `
[고정 직업 성향 판정]
이 판정은 route.ts 코드에서 오행 분포를 바탕으로 계산된 고정값이다.
AI는 이 판정을 절대 바꾸지 말고, 이 판정을 기준으로만 설명해라.

[사용한 오행 점수]
- 목: ${career.wood}
- 화: ${career.fire}
- 토: ${career.earth}
- 금: ${career.metal}
- 수: ${career.water}

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
- 직업/사업운, 재물운, 인생대운, 평생종합사주, 프리미엄상담에서만 이 판정을 사용해라.
- 연애운, 결혼운, 궁합풀이, 가족관계, 사업파트너, 건강운, 자식운, 오늘운세에서는 직업 성향 판정을 언급하지 마라.
- 1순위와 2순위를 뒤집지 마라.
- 최종 표현을 절대 바꾸지 마라.
- "안정적인 직장형이 우선"처럼 최종 표현과 다른 말을 하지 마라.
- "안정적인 기반이 필요하다"와 "직장형이다"는 다르다.
- 안정 기반이 필요하다고 해서 직장형으로 결론 내리지 마라.
- 사주상 기반이 필요한 사람에게는 "직장을 다니며 부업"이라고 단정하지 말고, "생활 기반이나 고정 수입 구조 위에 자기 수익 구조를 얹을 때 좋다"라고 표현해라.
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

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 오늘은 급하게 결정하면 손해가 생기기 쉬운 날이야.

AI는 이 결론을 절대 바꾸지 마라.
오늘운세에서는 "토 기운", "화 기운", "오행" 같은 말을 첫 문장에 쓰지 마라.
첫 문장은 반드시 사용자가 바로 이해할 수 있는 현실 언어로 시작해라.
오늘운세에서는 인생 전체 조언을 하지 말고, 오늘 하루의 말, 돈, 사람관계, 몸 컨디션, 피해야 할 선택을 구체적으로 말해라.
사주 용어는 [왜 그렇게 보냐면] 섹션에서만 쉽게 번역해서 설명해라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, ${gradeSentence("네 돈복", moneyGrade)}

AI는 이 돈복 등급을 절대 바꾸지 마라.
"돈복이 있는 편이지만", "나쁘지 않다", "무난하다" 같은 애매한 표현으로 시작하지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
등급 뒤에 바로 "다"를 붙이지 마라. "중다", "상다", "중하다" 같은 어색한 표현 금지.
등급 표현은 "상으로 본다", "중상으로 본다", "중으로 본다", "중하로 본다", "하로 본다"처럼 자연스럽게 써라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
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
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
바로 일간 설명부터 시작하지 마라.
등급 뒤에 바로 "다"를 붙이지 마라. "중다", "상다", "중하다" 같은 어색한 표현 금지.
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
그 다음 사주적으로 왜 그렇게 보는지 설명해라.
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
그 다음 사주적으로 왜 그렇게 보는지 설명해라.
같이 일하면 어떤 문제가 생길 수 있는지 반드시 말해라.
같이 일해야 한다면 계약, 역할, 돈 기준을 어떻게 잡아야 하는지 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "children" || title.includes("자식")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 자식운은 '${childrenFlow}'으로 본다.

AI는 이 결론을 절대 바꾸지 마라.
자식 유무, 임신, 출산, 자식 수, 성별은 절대 단정하지 마라.
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

  if (categoryId === "compatibility" || title.includes("궁합")) {
    const compatibility = getCompatibilityScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 궁합은 ${compatibility.score}점이고, '${compatibility.grade}'으로 본다.

궁합 핵심은 '${compatibility.summary}'이다.
가장 조심할 부분은 '${compatibility.risk}'이다.

AI는 이 궁합 점수와 등급을 절대 바꾸지 마라.
궁합풀이에서는 첫 문장에 반드시 궁합 점수와 좋은지 나쁜지를 먼저 말해라.
그 다음 사주적으로 왜 그렇게 보는지 설명해라.
궁합이 안 좋은 경우에는 어떻게 하면 좋아질 수 있는지 반드시 말해라.
궁합이 안 좋은데 결혼하면 어떤 문제가 생길 수 있는지 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
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

[가족관계가 좋아지는 조건]
- 기대치를 낮춰야 하는지, 역할을 나눠야 하는지, 거리를 둬야 하는지 구체적으로 말해라.
- 돈 기준과 말투 기준을 어떻게 잡아야 하는지 말해라.

[그래도 가족으로 오래 보려면]
- 한쪽만 참는 구조가 되면 안 된다고 말해라.
- 관계를 끊으라는 식이 아니라 덜 다치는 거리와 기준을 제시해라.
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
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

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 인생 흐름은 '${lifeFlow}'이고, 인생에서 크게 방향이 바뀌는 대운 기회는 ${majorLuckCount} 들어오는 구조로 본다.

가장 중요한 대운은 '${majorLuckPhase}'에 강하게 잡아야 하는 흐름이다.

AI는 이 결론을 절대 바꾸지 마라.
인생대운에서는 단순한 성격풀이를 하지 말고, 초년운·청년운·중년운·말년운을 나누어라.
각 시기마다 재물운, 직업운, 건강운, 사람관계 흐름을 함께 설명해라.
가장 중요한 대운이 언제쯤 강하게 들어오는지, 그 기회를 잡으려면 무엇을 준비해야 하는지 반드시 말해라.
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

  if (categoryId === "family" || title.includes("가족")) {
    const family = getFamilyScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 이 가족관계 궁합은 ${family.score}점이고, '${family.grade}'으로 본다.

가족관계 핵심은 '${family.summary}'이다.
가장 조심할 부분은 '${family.risk}'이다.

AI는 이 가족관계 점수와 등급을 절대 바꾸지 마라.
가족관계에서는 첫 문장에 반드시 가족궁합 점수와 좋은지 나쁜지를 먼저 말해라.
그 다음 사주적으로 왜 그렇게 보는지 설명해라.
가족 사이가 안 좋을 때 어떻게 해야 좋아지는지 반드시 말해라.
같이 살거나 돈이 얽히거나 책임을 나눌 때 생길 수 있는 문제를 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    const partnerScore = getBusinessPartnerScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 사업파트너 궁합은 ${partnerScore.score}점이고, '${partnerScore.grade}'으로 본다.

사업파트너 핵심은 '${partnerScore.summary}'이다.
가장 조심할 부분은 '${partnerScore.risk}'이다.

AI는 이 사업파트너 점수와 등급을 절대 바꾸지 마라.
사업파트너에서는 첫 문장에 반드시 동업궁합 점수와 같이 일해도 되는지 먼저 말해라.
그 다음 사주적으로 왜 그렇게 보는지 설명해라.
같이 일하면 어떤 문제가 생길 수 있는지 반드시 말해라.
같이 일해야 한다면 계약, 역할, 돈 기준을 어떻게 잡아야 하는지 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    const yearlyMoneyGrade = getMoneyGrade(manse);
    const yearlyHealthGrade = getHealthGrade(manse);
    return `
[고정 결론]
결론부터 말하면, ${name}, 올해 신년운세는 '무리하게 벌리는 해가 아니라, 머물 곳과 움직일 곳을 구분해야 하는 해'로 본다.

올해 돈복은 '${yearlyMoneyGrade}'으로 본다.
올해 건강운은 '${yearlyHealthGrade}'으로 본다.

AI는 이 결론, 돈복 등급, 건강운 등급을 절대 바꾸지 마라.
신년운세에서는 단순히 12개월을 나열하지 마라.
올해 전체 해운을 먼저 보고, 그 다음 재물운, 직업/사업운, 이직운, 건강운, 관계운, 조심할 시기, 잡아야 할 기회를 구체적으로 말해라.
이직운에서는 올해 움직여야 하는지, 지금 자리에 머물러야 하는지, 움직인다면 언제 어떤 기준으로 움직여야 하는지 반드시 말해라.
재물운에서는 올해 돈복이 들어오는지, 돈이 새는지, 돈을 키우려면 무엇을 해야 하는지 말해라.
건강운에서는 올해 건강운이 괜찮은지 나쁜지 먼저 말하고, 약하다면 생활에서 무엇을 줄이고 무엇을 잡아야 하는지 구체적으로 말해라.
반드시 1~3개월, 4~6개월, 7~9개월, 10~12개월 흐름으로 나누어라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 이 질문은 '감정으로 밀어붙이기보다 사주상 맞는 기준을 먼저 잡아야 풀리는 고민'이다.

AI는 사용자의 질문을 읽고 이 결론을 질문에 맞게 구체화해라.
첫 문장은 반드시 결론부터 시작해라.
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
- 첫 섹션 제목은 반드시 [결론부터 말하면]으로 써라.
- 첫 문장은 일반 사용자가 바로 이해할 수 있는 현실 언어로 써라.
- "강한 토 기운", "약한 화 기운" 같은 말은 첫 문장에 쓰지 마라.

[조사와 등급 표현 규칙]
- 등급 뒤에 바로 "다"를 붙이지 마라.
- "중다", "상다", "중하다", "하다는" 같은 어색한 표현은 절대 금지다.
- 등급 표현은 반드시 "상으로 본다", "중상으로 본다", "중으로 본다", "중하로 본다", "하로 본다"처럼 써라.
- 재물운 첫 문장은 "네 돈복은 '중'으로 본다"처럼 써라.
- 건강운 첫 문장은 "네 건강운은 '중하'로 본다"처럼 써라.
- [고정 결론]에 적힌 자연스러운 문장을 그대로 따르고, 조사만 임의로 바꾸지 마라.

[절대 규칙]
- 이 서비스 운영자와 이전 대화에서 나눈 직업 고민, 사업 아이디어, 부업 아이디어, 앱 제작 방향, 유튜브, 리셀, 청소, 밀키트, 휴대폰, 도어락, 기타 대화 내용을 절대 결과에 반영하지 마라.
- 개발자 또는 운영자가 예시로 말한 직업군을 사용자에게 추천하지 마라.
- 사용자의 사주풀이 결과는 오직 현재 요청에 포함된 사용자 입력 정보와 [본인 만세력], [상대방 만세력], [고정 결론], [고정 직업 성향 판정], 선택 카테고리, 사용자의 질문만 기준으로 작성해라.
- 특정 직업, 특정 사업, 특정 부업을 미리 정해놓고 끼워 맞추지 마라.
- 질문에 특정 직업이 들어 있어도, 그 직업을 무조건 맞다고 하지 말고 사주 구조로 맞는지 따로 판단해라.
- 직업/사업 성향은 오직 [고정 직업 성향 판정]에 나온 값만 따른다.
- "안정적인 기반이 필요하다"와 "직장형이다"는 다르다.
- 안정 기반이 필요하다고 해서 직장형으로 결론 내리지 마라.

[고정 결론 규칙]
- [고정 결론]이 제공되면 첫 섹션 첫 문장은 반드시 그 결론과 같은 의미로 시작해라.
- [고정 결론]의 등급, 성향, 흐름, 궁합 점수, 궁합 등급, 대운 기회 횟수, 중요한 대운 시기를 절대 바꾸지 마라.

[카테고리 분리 규칙]
- 선택 카테고리와 무관한 내용을 절대 끌고 오지 마라.
- 오늘운세는 오늘 하루의 말, 돈, 사람관계, 몸 컨디션, 피해야 할 선택만 다뤄라.
- 재물운에서는 돈복, 돈이 붙는 방식, 돈이 새는 구조, 피해야 할 돈 선택만 깊게 봐라.
- 직업/사업운에서는 일 구조, 맞는 직업군, 피해야 할 일 구조, 자기수익 구조만 깊게 봐라.
- 건강운에서는 몸의 흐름, 체질적 약점, 무리하면 탈 나는 패턴만 깊게 봐라.
- 연애운에서는 사람 보는 기준, 어울리는 상대, 피해야 할 상대만 깊게 봐라.
- 결혼운에서는 생활 기준, 배우자 유형, 돈 기준, 가족 거리감만 깊게 봐라.
- 자식운에서는 자식 인연, 자식복, 관계 흐름, 부모 역할만 깊게 봐라.
- 궁합풀이에서는 반드시 궁합 점수와 등급을 먼저 말해라.
- 궁합풀이에서는 "좋은지 나쁜지"를 애매하게 말하지 마라.
- 궁합풀이에서는 끌림, 충돌, 좋아지는 조건, 결혼 시 생길 수 있는 문제를 반드시 포함해라.
- 궁합 점수와 등급은 [고정 결론]을 절대 바꾸지 마라.
- 인생대운에서는 초년운, 청년운, 중년운, 말년운, 대운 기회, 가장 중요한 대운, 대운 잡는 법만 깊게 봐라.
- 가족관계에서는 가족궁합 점수와 등급을 먼저 말하고, 사주적으로 사이가 맞는지, 같이 지내면 어떤 문제가 생기는지, 관계가 좋아지는 조건을 반드시 포함해라.
- 가족관계에서는 역할, 책임, 서운함, 돈 문제, 거리 조절, 말투, 같이 살 때 생기는 문제를 깊게 봐라.
- 사업파트너에서는 사업파트너 궁합 점수와 등급을 먼저 말하고, 같이 일해도 되는지, 같이 돈을 벌 수 있는지, 동업하면 어떤 문제가 생기는지 반드시 포함해라.
- 사업파트너에서는 돈 기준, 역할 분담, 책임, 실행력, 수익 배분, 결정권, 계약 조건을 깊게 봐라.

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
- 무료는 900~1300자.
- 무료는 반드시 아래 4개 섹션만 작성해라.
1. [결론부터 말하면]
2. [왜 그렇게 보냐면]
3. [이 운에서 조심할 부분]
4. [전체 리포트에서 이어지는 핵심]

[유료 결과 원칙]
- 유료는 결제 후 열린 전체 리포트다.
- 결제 유도 문구 금지.
- 유료도 반드시 [결론부터 말하면]으로 시작해라.
- 유료는 일반 카테고리 3500~6000자, 프리미엄상담 4500~7500자, 평생종합사주 6000~9000자.
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
- 자식 인연, 자식복, 자식과의 관계 흐름, 부모 역할로 풀어라.
- 임신/출산/자식 수/성별을 단정하지 마라.
`;
}

function getCategoryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (categoryId === "today" || title.includes("오늘")) {
    return `
[오늘운세 전용 지침]
- 오늘운세는 인생 전체 조언으로 쓰지 마라.
- 오늘 하루의 말, 돈, 사람관계, 몸 컨디션, 피해야 할 선택을 구체적으로 써라.
- 첫 문장에 사주 용어를 쓰지 마라.
- "강한 토 기운", "약한 화 기운" 같은 표현은 [왜 그렇게 보냐면]에서 쉬운 말로 번역해서만 써라.
- 오늘은 급한 답장, 충동 결제, 불편한 부탁 수락, 기분 상한 상태의 결정 같은 현실적인 내용을 넣어라.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `
[재물운 전용 지침]
- 첫 문장은 [고정 결론]의 돈복 등급을 그대로 사용해라.
- 돈복은 돈이 들어오는 힘, 모이는 힘, 새는 구조, 키우는 방식을 함께 봐라.
- 유료에서는 돈복 등급, 돈이 들어오는 방식, 돈이 모이는 구조, 돈이 새는 원인, 피해야 할 돈 선택, 맞는 수익 구조, 평생 재물 흐름, 앞으로 1년 재물 흐름을 포함해라.
- 돈복을 애매하게 말하지 마라.
- "돈복이 있는 편이지만"으로 시작하지 마라.
- 돈을 못 번다는 단정도 하지 마라. 돈이 붙는 방식과 새는 방식을 같이 말해라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[직업/사업운 전용 지침]
- 첫 문장은 [고정 결론]의 직업 성향을 그대로 사용해라.
- 직업 성향을 새로 판단하지 마라.
- "안정적인 직장형이 우선"처럼 [고정 결론]과 다른 말 금지.
- 유료에서는 평생 직업 흐름, 맞는 직업군 3~5개, 피해야 할 일 구조, 생활 기반과 자기수익 구조, 앞으로 1년 변화를 포함해라.
- 특정 직업명을 말할 때는 왜 맞는지, 돈이 되는 방식, 조심할 점을 함께 말해라.
- 무리한 투자, 준비 없는 사업개시, 고정비 큰 창업, 남의 말만 믿고 시작하는 부업은 피해야 할 선택으로 구체화해라.
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
`;
  }

  if (categoryId === "children" || title.includes("자식")) {
    return `
[자식운 전용 지침]
- 첫 문장은 [고정 결론]의 자식운 흐름을 그대로 사용해라.
- 자식 유무, 임신, 출산, 자식 수, 성별을 확정하지 마라.
- 자식운은 자식 인연, 자식복, 자식과의 관계 흐름, 부모 역할로 풀어라.
- 자식이 기쁨으로 들어오는지, 책임으로 들어오는지, 늦게 복으로 드러나는지 구체적으로 설명해라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[연애운 전용 지침]
- 연애운은 어울리는 상대, 피해야 할 상대, 반복되는 연애 패턴, 인연 흐름 중심으로 써라.
- 직업군, 사업형, 부업형 이야기를 하지 마라.
- 썸, 재회, 결혼 가능성은 질문이 있을 때만 보조적으로 다뤄라.
- 어떤 사람에게 끌리지만 오래 가면 힘든지 구체적으로 말해라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[결혼운 전용 지침]
- 결혼운은 배우자 유형, 결혼 시기 흐름, 결혼 후 생활 기준, 돈 기준, 가족 거리감 중심으로 써라.
- 직업운, 사업운, 직장형/사업형/부업형 판정 금지.
- 결혼을 하면 좋은지, 늦게 안정되는지, 어떤 사람과 해야 덜 흔들리는지 말해라.
- 결혼 후 부딪히는 지점을 돈, 생활, 가족, 말투, 책임으로 나눠라.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
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
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
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
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `
[사업파트너 전용 지침]
- 첫 문장은 반드시 사업파트너 궁합 점수와 등급을 먼저 말해라.
- 같이 일해도 되는지, 동업은 주의해야 하는지 애매하게 말하지 마라.
- 감정 궁합이 아니라 돈, 역할, 책임, 충돌 지점, 동업 가능성 중심으로 써라.
- 좋은 사람인지보다 같이 돈을 벌 수 있는 구조인지 먼저 말해라.
- 역할 분담, 계약, 돈 기준, 책임 범위, 수익 배분, 결정권을 반드시 말해라.
- 동업하면 생길 수 있는 문제를 현실적으로 말해라.
- 그래도 같이 일해야 한다면 어떤 조건을 문서로 정해야 하는지 구체적으로 말해라.
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
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[평생종합사주 전용 지침]
- 평생종합사주는 올해운처럼 쓰지 마라.
- 초년운, 청년운, 중년운, 말년운을 먼저 보고, 그 다음 재물/직업/연애/결혼/건강/자식/인복을 종합한다.
- 건강운과 자식운은 반드시 포함한다.
- 평생 전체 흐름 안에서 어떤 시기에 막히고 어떤 시기에 풀리는지 말해라.
`;
  }

  if (categoryId === "premium" || title.includes("프리미엄")) {
    return `
[프리미엄상담 전용 지침]
- 사용자의 질문을 반드시 직접 받아서 답한다.
- 질문에 대한 결론을 먼저 말한다.
- 일반 사주풀이로 빠지지 말고, 질문과 사주 구조를 연결해라.
- 사용자가 질문을 애매하게 써도 질문의 핵심을 추정해서 현실적인 답을 먼저 준다.
- 마지막에는 지금 당장 하지 말아야 할 선택과 먼저 해야 할 선택을 구체적으로 나눠라.
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

  if (categoryId === "today" || title.includes("오늘")) {
    return `전체 리포트에서는 오늘 돈에서 조심할 선택, 사람관계에서 피해야 할 말, 몸 컨디션에서 신경 쓸 부분까지 이어서 볼 수 있어.

오늘은 크게 치는 날이 아니라, 새는 운을 막고 흐트러진 걸 정리할 때 운이 살아나는 날이야.`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `전체 리포트에서는 네 돈복 등급이 왜 그렇게 나왔는지, 돈이 붙는 방식, 돈이 새는 구멍, 맞는 수익 구조, 피해야 할 돈 선택까지 이어서 봐야 해.

돈복은 있어도 새는 구조를 모르면 안 남고, 돈복이 약해도 붙는 방식을 알면 흐름을 살릴 수 있어.`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `전체 리포트에서는 네 고정 직업 성향을 기준으로 맞는 직업군, 피해야 할 일 구조, 생활 기반과 자기수익 구조를 어떻게 나눠야 하는지까지 이어서 봐야 해.

이걸 안 보면 능력이 있어도 엉뚱한 판에서 계속 힘만 빠질 수 있어.`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `전체 리포트에서는 인생 전체에서 건강운이 강한 시기와 약한 시기, 좋게 타고난 부분, 약한 부분, 무리하면 탈 나는 패턴까지 이어서 봐야 해.

이걸 봐야 단순히 조심하라는 말이 아니라, 네 몸이 어떤 리듬에서 덜 흔들리는지 보인다.`;
  }

  if (categoryId === "children" || title.includes("자식")) {
    return `전체 리포트에서는 자식 인연의 강약, 자식복이 드러나는 방식, 자식과의 관계 흐름, 부모로서 조심할 부분까지 이어서 봐야 해.

자식운은 자식이 있다 없다로 끝나는 게 아니라, 관계 흐름을 알아야 덜 흔들린다.`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `전체 리포트에서는 궁합 점수가 왜 그렇게 나왔는지, 서로 끌리는 이유와 부딪히는 이유를 더 깊게 봐야 해.

특히 결혼까지 생각한다면 돈 기준, 가족 거리감, 말투, 생활 리듬에서 어떤 문제가 생길 수 있는지 봐야 진짜 궁합이 보여.`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `전체 리포트에서는 가족궁합 점수가 왜 그렇게 나왔는지, 가족 안에서 반복되는 역할과 서운함이 어디서 생기는지 더 깊게 봐야 해.

같이 살거나 돈이 얽히거나 책임을 나눠야 한다면, 어느 선까지 감당하고 어디서 거리를 둬야 하는지 봐야 관계가 덜 무거워진다.`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
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

  if (isCompatibilityCategory(categoryId, title)) {
    return `
[하지 말아야 할 선택]
1. 사주상 부딪히는 지점을 사랑으로 덮는 것
- 이 궁합은 끌림만으로 판단하면 안 돼.
- 두 사람의 오행 흐름에서 한쪽의 강한 기운이 다른 쪽에게는 압박처럼 느껴질 수 있어.
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
- 두 사람의 오행 흐름에서 강한 기운끼리 부딪히면, 서로를 걱정하면서도 말투와 방식에서 상처가 생길 수 있어.

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
- 사주상 강한 기운끼리 만나면 둘 다 주도권을 잡으려 하고, 약한 기운이 비슷하면 실행이 밀릴 수 있어.

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
1. 남의 말만 듣고 들어가는 투자
- 지인이 좋다고 해서 따라 들어가는 돈은 조심해야 해.
- 네 사주는 돈이 들어오는 방식보다 돈이 새는 구멍을 막는 게 먼저야.

2. 무리한 대출이나 빚을 끼고 시작하는 사업
- 돈복이 있어도 감당 범위를 넘긴 고정비는 운을 눌러.
- 처음부터 크게 벌이는 구조보다 작게 검증하고 키우는 흐름이 맞아.

3. 체면 때문에 쓰는 돈
- 보여주기식 소비, 관계 유지용 지출, 급한 호의는 재물운을 새게 만들어.

4. 준비 안 된 동업
- 계약, 역할, 책임, 돈 기준이 없는 동업은 피해야 해.
- 좋은 사람과 돈이 맞는 사람은 다르다.

5. 회수 계획 없이 들어가는 장사나 투자
- 돈이 묶이는 구조는 네 사주에서 심리 압박을 크게 만들 수 있어.
- 시작 전 손실 한도, 회수 기간, 빠져나올 기준을 먼저 정해야 해.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
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
- 사주상 토가 강하거나 화가 약하면 위장, 소화, 장 쪽으로 부담이 쌓이는 흐름이 나올 수 있어.
- 병명으로 단정하는 건 아니지만, 소화 리듬과 장 컨디션은 꾸준히 봐야 해.

2. 밤낮이 무너지는 생활
- 화 기운이 약하면 몸을 따뜻하게 돌리고 회복시키는 리듬이 약해질 수 있어.
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
- 이 카테고리에서는 단순 조언이 아니라 사주상 강한 기운과 약한 기운이 어떻게 문제를 만드는지 봐야 해.

2. 반복되는 문제를 성격 탓으로만 보는 것
- 같은 문제가 반복된다면 성격보다 구조를 먼저 봐야 해.
- 사주상 강한 기운이 과하게 쓰이거나 약한 기운이 무너질 때 같은 일이 반복될 수 있어.

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
1. 돈이 새는 구멍부터 막아라
- 먼저 고정비, 충동소비, 사람 때문에 나가는 돈, 체면 때문에 쓰는 돈부터 줄여야 해.

2. 무리한 투자보다 반복 수익을 먼저 만들어라
- 월급, 부업, 기술료, 소개 수익, 재판매 마진, 관리형 수익처럼 반복되는 구조를 먼저 봐야 해.

3. 지인 말 듣고 돈 넣는 구조를 피하고, 네가 통제할 수 있는 돈길을 잡아라
- 네가 직접 확인하고, 작게 테스트하고, 손실 범위를 정할 수 있는 구조가 맞아.

4. 처음부터 큰 사업보다 작은 수익 구조부터 만들어라
- 고정비 큰 매장, 대출 끼고 시작하는 사업, 재고를 많이 안고 시작하는 장사는 조심해야 해.

5. 돈이 붙는 방식은 ‘기술 + 반복 + 신뢰’ 쪽으로 잡아라
- 네가 할 줄 아는 것, 사람들이 반복해서 필요로 하는 것, 신뢰가 쌓일수록 단가가 올라가는 구조에서 재물운이 살아나.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
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
1. 사주에서 강하게 쓰이는 기운을 현실의 기준으로 바꿔라
- 강한 기운은 장점이지만 기준 없이 쓰면 고집이나 무리수가 될 수 있어.

2. 약한 기운이 흔들리는 상황을 줄여라
- 약한 부분은 반복되는 문제로 드러나기 쉬워.
- 그 부분을 생활 기준과 선택 기준으로 보완해야 해.

3. 지금 카테고리에서 먼저 정해야 할 기준을 잡아라
- 돈이면 돈 기준, 관계면 거리감, 일이면 역할과 구조를 먼저 봐야 해.

4. 감정이 아니라 반복되는 패턴을 보고 선택해라
- 운은 한 번의 기분보다 반복되는 흐름에서 더 잘 보여.
`;
}

function getFinalSummaryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

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
- 돈이 붙는 방식과 돈이 새는 구조를 다시 정리해라.
- 무리한 투자, 지인 말 듣고 들어가는 돈, 준비 없는 사업, 고정비 큰 창업을 조심하라고 말해라.
- 맞는 방향은 반복 수익, 기술, 신뢰, 작은 판매, 관리형 수익, 직접 통제 가능한 돈길이라고 말해라.
- 마지막 문장은 "그게 네 사주에서 재물운을 살리는 방식이야."로 끝내라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[형이 딱 정리해줄게]
- 고정 직업 성향을 다시 말해라.
- 안정적인 직장형이라는 말로 흐리지 마라.
- 생활 기반은 필요하지만 자기 수익 구조를 따로 만들어야 한다고 말해라.
- 준비 없는 큰 사업, 남이 돈 된다는 부업, 고정비 큰 창업을 조심하라고 말해라.
- 맞는 방향은 작게 시작해서 반복 수요를 확인하고, 기술·정보·정리·관리 능력을 돈으로 바꾸는 것이라고 말해라.
- 마지막 문장은 "네 사주는 남의 판에서 오래 버티는 것보다, 네 판을 조금씩 만드는 쪽에서 일이 풀린다."로 끝내라.
`;
  }

  if (categoryId === "health" || title.includes("건강")) {
    return `
[형이 딱 정리해줄게]
- 건강운 등급을 자연스러운 조사로 다시 말해라. 예: "네 건강운은 '중하'로 본다."
- 의료 진단이 아니라 사주상 건강 흐름이라고 말해라.
- 약한 흐름을 위장·소화·장 리듬, 순환, 피로 누적, 수면, 스트레스성 긴장 중 사주에 맞춰 구체적으로 정리해라.
- 하지 말아야 할 것은 참기, 밤낮 무너짐, 스트레스 삼키기, 몰아서 무리하기라고 말해라.
- 맞는 방향은 식사·수면·스트레스 배출·몸을 따뜻하게 하는 리듬이라고 말해라.
- 마지막 문장은 "너는 무리해서 강해지는 타입이 아니라, 리듬을 잡아야 덜 흔들리는 타입이야."로 끝내라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[형이 딱 정리해줄게]
- 연애운 결론을 다시 말해라.
- 외로움 때문에 시작하는 관계, 초반 설렘만 보는 관계, 생활 리듬이 안 맞는 사람을 조심하라고 말해라.
- 맞는 방향은 끌림보다 기준, 감정보다 반복되는 태도, 설렘보다 안정감이라고 말해라.
- 마지막 문장은 "네 연애운은 사람을 잘 고를 때 살아나는 운이야."로 끝내라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[형이 딱 정리해줄게]
- 결혼운 결론을 다시 말해라.
- 외로움 때문에 결혼 결정, 돈 기준 불일치, 가족 문제 무시, 상대를 바꾸려는 생각을 조심하라고 말해라.
- 맞는 방향은 생활 기준, 돈 기준, 가족 거리감, 역할 분담이 맞는 사람이라고 말해라.
- 마지막 문장은 "네 결혼운은 설렘보다 생활 기준이 맞을 때 안정된다."로 끝내라.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
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

  if (categoryId === "family" || title.includes("가족")) {
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

  if (categoryId === "partner" || title.includes("사업파트너")) {
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

  if (categoryId === "children" || title.includes("자식")) {
    return `
[형이 딱 정리해줄게]
- 자식운 결론을 다시 말해라.
- 자식 유무, 임신, 출산을 단정하지 마라.
- 기대, 간섭, 경제적 책임을 혼자 떠안는 것을 조심하라고 말해라.
- 맞는 방향은 기대보다 기준, 통제보다 거리, 감정보다 말의 온도라고 말해라.
- 마지막 문장은 "자식운은 붙잡는 운이 아니라, 관계의 온도를 맞춰야 살아나는 운이야."로 끝내라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[형이 딱 정리해줄게]
- 올해 전체 해운을 다시 한 문장으로 말해라.
- 올해 재물운은 돈복이 들어오는지, 돈이 새는지, 돈을 키우려면 무엇을 해야 하는지 정리해라.
- 올해 직업/사업운은 움직일지 머물지, 이직운이 있는지, 테스트해야 할 방향이 무엇인지 정리해라.
- 건강운은 괜찮은지 약한지 먼저 말하고, 약하다면 생활에서 무엇을 줄이고 무엇을 잡아야 하는지 말해라.
- 관계운에서는 올해 도움 되는 인연과 거리 둘 인연을 구분해라.
- 1~3개월, 4~6개월, 7~9개월, 10~12개월 중 가장 중요한 구간을 다시 짚어라.
- 마지막 문장은 "올해는 무조건 크게 움직이는 해가 아니라, 머물 곳과 움직일 곳을 구분할 때 운이 살아나는 해다."로 끝내라.
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

  return `
[형이 딱 정리해줄게]
- 절대 뻔한 응원으로 끝내지 마라.
- 선택 카테고리의 결론을 다시 말해라.
- 하지 말아야 할 선택과 잡아야 할 방향을 구체적으로 다시 정리해라.
`;
}

function getFullSections(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

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
- 월급형, 기술형, 장사형, 사업형, 부업형, 중개형, 콘텐츠형, 사람관계형 중 사주 흐름에 맞는 것을 골라 설명해라.
- 돈이 한 번에 크게 들어오는 사주인지, 작게 반복해서 모이는 사주인지 구분해라.

[돈이 새는 구조]
- 충동, 체면, 사람, 고정비, 불안한 확장, 준비 없는 투자 중 어디서 새는지 말해라.
- 돈이 새는 장면을 현실적으로 풀어라.

[맞는 수익 구조]
- [고정 직업 성향 판정]과 충돌하지 않게 설명해라.
- 직업명보다 돈이 만들어지는 구조를 먼저 말해라.
- 작게 테스트할 수 있는 수익 구조와 피해야 할 구조를 나눠라.

[평생 재물 흐름]
- 초년, 청년, 중년, 말년 재물 흐름을 나눠라.
- 언제 돈을 모으기 좋고, 언제 새기 쉬운지 말해라.

[앞으로 1년 재물운]
- 앞으로 1년 동안 돈을 키우는 방식과 돈이 새는 위험을 나눠라.
- 무리한 투자, 준비 없는 사업개시, 고정비 큰 확장을 조심시켜라.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[고정 직업 성향 판정]
- [고정 직업 성향 판정]의 최종 표현을 그대로 설명해라.
- 안정 기반이 필요하다고 해도 최종 성향을 바꾸지 마라.

[맞는 직업군]
- 사주적으로 맞는 직업군을 3~5개 제시해라.
- 각 직업군마다 왜 맞는지, 돈이 되는 방식, 주의할 점을 말해라.
- 단순히 직업명만 나열하지 말고, 어떤 구조가 맞는지 말해라.

[피해야 할 일 구조]
- 피해야 할 직업군/구조를 3~5개 말해라.
- 왜 안 맞는지 설명해라.
- 준비 없는 사업개시, 무리한 투자, 고정비 큰 창업, 남이 시켜서 하는 일, 감정노동 과다 구조를 사주에 맞춰 설명해라.

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
- 건강운 등급이 왜 그렇게 나왔는지 오행 구조로 설명해라.

[좋게 타고난 부분]
- 회복력, 버티는 힘, 체력 흐름 중 사주상 강한 부분을 말해라.
- 어떤 생활을 하면 건강운이 살아나는지 말해라.

[약하게 잡힌 부분]
- 체질적 약점, 무리하면 탈 나는 패턴을 말해라.
- 병명 확정 금지.
- 단, 위장·소화기, 장 리듬, 순환, 몸의 열, 피로 누적, 수면, 긴장성 컨디션처럼 구체적인 흐름은 말해라.

[위장·소화·장 흐름]
- 토가 과하거나 화가 약한 구조라면 위장, 소화, 장 리듬이 예민해질 수 있다고 말해라.
- 단, 의학적 진단처럼 말하지 마라.

[시기별 건강 흐름]
- 초년, 청년, 중년, 말년 건강운을 나눠라.
- 어느 시기에 무리하면 탈이 나기 쉬운지 말해라.

[앞으로 1년 건강운]
- 앞으로 1년 동안 조심해야 할 생활 패턴과 좋아지는 루틴을 말해라.
`;
  }

  if (categoryId === "children" || title.includes("자식")) {
    return `
[자식 인연의 강약]
- 자식 유무가 아니라 사주상 자식 인연 흐름으로 말해라.

[자식복의 성격]
- 기쁨으로 오는지, 책임으로 오는지, 늦게 복으로 드러나는지 설명해라.

[자식과의 관계 흐름]
- 가까운 관계인지, 거리 조절이 필요한지, 말과 기준이 중요한지 풀어라.

[부모로서 조심할 부분]
- 기대, 간섭, 경제적 책임, 감정 표현 중 무엇을 조심해야 하는지 말해라.

[자식운이 좋아지는 조건]
- 말투, 경제적 선, 기대치, 거리감, 부모 자신의 삶을 어떻게 잡아야 하는지 말해라.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
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

  if (isMonthlyCategory(categoryId, title)) {
    return `
[올해 전체 해운]
- 올해가 어떤 해인지 먼저 결론 내려라.
- 올해는 움직여야 하는 해인지, 버텨야 하는 해인지, 준비해야 하는 해인지, 정리해야 하는 해인지 말해라.

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

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `
[초년운]
- 어릴 때부터 20대 초반까지의 흐름을 풀어라.
- 가족 영향, 성격 형성, 공부/진로 기초, 건강 흐름, 돈에 대한 감각을 포함해라.

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
[초년운]
[청년운]
[중년운]
[말년운]

[재물운]
- 돈복 등급을 다시 확인하고, 평생 재물 흐름을 말해라.

[직업운/사업운]
- [고정 직업 성향 판정]을 절대 바꾸지 말고 평생 직업 흐름을 말해라.

[연애운/결혼운]
- 연애 패턴, 배우자 유형, 결혼 후 생활 기준을 말해라.

[건강운]
- 인생 전체 건강운, 체질적 약점, 무리하면 탈 나는 패턴을 반드시 포함해라.

[자식운]
- 자식 인연, 자식복, 관계 흐름, 부모 역할을 반드시 포함해라.

[인복과 가족운]
[인생 전체에서 반복되는 패턴]
[앞으로 1년 참고 흐름]
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
}) {
  const { user, categoryId, categoryTitle, question, manseText, fixedConclusionText } = params;

  return `
${buildUserInfoText(user)}

${manseText}

${fixedConclusionText}

[선택 카테고리]
${categoryTitle}

[사용자 질문]
${question || "없음"}

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
- 궁합풀이에서는 [본인 만세력]과 [상대방 만세력]을 비교해라.
- 어려운 명리학 용어는 현실 언어로 풀어라.

[이 운에서 조심할 부분]
- 이 카테고리에서 반복될 수 있는 문제를 말해라.
- 겁주지 말고, 왜 그런 패턴이 나오는지 사주 근거로 말해라.

[전체 리포트에서 이어지는 핵심]
${getPreviewTease(categoryId, categoryTitle)}

길이:
- 900~1300자.
- 문단 사이에 빈 줄을 넣어라.
- 말투는 친한 형처럼.
`;
}

function buildFullPrompt(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
  fixedConclusionText: string;
}) {
  const { user, categoryId, categoryTitle, question, manseText, fixedConclusionText } = params;
  const categorySections = getFullSections(categoryId, categoryTitle);

  return `
${buildUserInfoText(user)}

${manseText}

${fixedConclusionText}

[선택 카테고리]
${categoryTitle}

[사용자 질문]
${question || "없음"}

${getCategoryGuide(categoryId, categoryTitle)}

[전체 리포트 작성 지시]
전체 유료 리포트를 작성해라.
결제 유도 문구 금지.
다른 카테고리 추천 금지.
등급 표현은 "중다", "상다"처럼 쓰지 말고 "중으로 본다", "상으로 본다"처럼 자연스럽게 써라.

공통 구조:
[결론부터 말하면]
[왜 그렇게 보냐면]
[타고난 ${categoryTitle}]
[이 운이 막히는 패턴]
[이 운이 살아나는 조건]
${categorySections}
[앞으로 1년 참고 흐름]
${getRiskChoices(categoryId, categoryTitle)}
${getDirectionChoices(categoryId, categoryTitle)}
${getFinalSummaryGuide(categoryId, categoryTitle)}

길이:
- 일반 카테고리: 3500~6000자.
- 프리미엄상담: 4500~7500자.
- 평생종합사주: 6000~9000자.
- 문단 사이에 빈 줄을 넣어라.
`;
}

function fallbackPreview(categoryId: CategoryId, categoryTitle: string, user: UserInfo, manse: any, partnerManse?: any | null) {
  const fixed = getFixedConclusionBlock(categoryId, categoryTitle, user, manse, partnerManse).replace("[고정 결론]", "").trim();

  return `[결론부터 말하면]

${fixed}

[왜 그렇게 보냐면]

제공된 만세력 기준으로 보면 이 결론은 일간과 오행 분포에서 나온 흐름이야.

자세한 명식 풀이는 전체 리포트에서 더 길게 봐야 하지만, 무료에서는 먼저 결론과 큰 방향만 잡아줄게.

[이 운에서 조심할 부분]

이 운은 무리하게 밀어붙인다고 바로 좋아지는 흐름은 아니야.

사주상 강한 기운을 잘 쓰고, 약한 기운이 흔들리는 지점을 조심해야 반복이 줄어들어.

[전체 리포트에서 이어지는 핵심]

${getPreviewTease(categoryId, categoryTitle)}`;
}

function fallbackFull(categoryId: CategoryId, categoryTitle: string, user: UserInfo, manse: any, partnerManse?: any | null) {
  const fixed = getFixedConclusionBlock(categoryId, categoryTitle, user, manse, partnerManse).replace("[고정 결론]", "").trim();

  return `[결론부터 말하면]

${fixed}

[왜 그렇게 보냐면]

제공된 만세력 기준으로 보면 이 결론은 일간, 월지, 오행 분포의 균형에서 나온 흐름이야.

강한 기운은 장점이 되지만, 과하면 부담이 되고 약한 기운은 반복되는 문제로 나타날 수 있어.

[타고난 ${categoryTitle}]

이 운은 없는 운이라기보다, 맞는 방식으로 써야 살아나는 운이야.

[이 운이 막히는 패턴]

급하게 결정하거나, 약한 기운을 무시하고 밀어붙이면 같은 문제가 반복될 수 있어.

[이 운이 살아나는 조건]

사주상 강한 기운은 살리고, 부족한 기운을 생활과 선택으로 보완해야 해.

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
  if (categoryId === "traditional") return 1900;
  if (categoryId === "premium") return 1900;
  return 1700;
}

function getFullMaxTokens(categoryId: CategoryId) {
  if (categoryId === "traditional") return 11000;
  if (categoryId === "premium") return 9000;
  return 7200;
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
    const careerBlock = shouldUseCareerArchetype(categoryId)
      ? getCareerArchetypeGuide(myManse)
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
      const preview = fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
      const full = fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);

      if (mode === "full") {
        return NextResponse.json({ preview: "", full, result: full, manse: myManse, partnerManse, fixedConclusion: fixedConclusionText, routeVersion: ROUTE_VERSION });
      }

      if (mode === "both") {
        return NextResponse.json({ preview, full, result: full, manse: myManse, partnerManse, fixedConclusion: fixedConclusionText, routeVersion: ROUTE_VERSION });
      }

      return NextResponse.json({ preview, full: "", result: preview, manse: myManse, partnerManse, fixedConclusion: fixedConclusionText, routeVersion: ROUTE_VERSION });
    }

    if (mode === "preview") {
      let preview = "";
      try {
        preview = await generateText(
          buildPreviewPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText }),
          getPreviewMaxTokens(categoryId)
        );
      } catch (error) {
        console.error("preview generation error:", error);
        preview = fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
      }

      return NextResponse.json({
        preview: preview || fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse),
        full: "",
        result: preview || fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse),
        manse: myManse,
        partnerManse,
        fixedConclusion: fixedConclusionText,
        routeVersion: ROUTE_VERSION,
      });
    }

    if (mode === "full") {
      let full = "";
      try {
        full = await generateText(
          buildFullPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText }),
          getFullMaxTokens(categoryId)
        );
      } catch (error) {
        console.error("full generation error:", error);
        full = fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);
      }

      return NextResponse.json({
        preview: "",
        full: full || fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse),
        result: full || fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse),
        manse: myManse,
        partnerManse,
        fixedConclusion: fixedConclusionText,
        routeVersion: ROUTE_VERSION,
      });
    }

    let preview = "";
    let full = "";

    try {
      preview = await generateText(
        buildPreviewPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText }),
        getPreviewMaxTokens(categoryId)
      );
    } catch (error) {
      console.error("preview generation error:", error);
      preview = fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse);
    }

    try {
      full = await generateText(
        buildFullPrompt({ user, categoryId, categoryTitle, question, manseText, fixedConclusionText }),
        getFullMaxTokens(categoryId)
      );
    } catch (error) {
      console.error("full generation error:", error);
      full = fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse);
    }

    return NextResponse.json({
      preview: preview || fallbackPreview(categoryId, categoryTitle, user, myManse, partnerManse),
      full: full || fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse),
      result: full || fallbackFull(categoryId, categoryTitle, user, myManse, partnerManse),
      manse: myManse,
      partnerManse,
      fixedConclusion: fixedConclusionText,
      routeVersion: ROUTE_VERSION,
    });
  } catch (error) {
    console.error("fortune route error:", error);

    return NextResponse.json(
      {
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
        error: "AI 운세 생성 중 문제가 발생했습니다.",
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "soreum saju fortune route is working", model: MODEL, routeVersion: ROUTE_VERSION, relationshipLogic: "family-partner-compatibility-saju-risk-final", yearlyLogic: "newyear-career-money-jobchange-health-v1" });
}
