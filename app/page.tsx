"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

declare global {
  interface Window {
    KCP_Pay_Execute_Web?: (form: HTMLFormElement) => void;
  }
}

type Step = "intro" | "home" | "input" | "result" | "consult";

type CategoryId =
  | "today"
  | "money"
  | "career"
  | "love"
  | "health"
  | "compatibility"
  | "monthly"
  | "lifeFlow"
  | "traditional"
  | "premium";

type MaritalStatus = "미혼" | "연애중" | "기혼" | "이혼/재혼 고민" | "비공개";

type RepeatGhostAnswers = {
  money?: string;
  work?: string;
  relationship?: string;
  blocked?: string;
  regret?: string;
  category?: string;
};

type UserInfo = {
  name: string;
  year: string;
  month: string;
  day: string;
  calendar: "양력" | "음력";
  lunarLeapMonth: boolean;
  birthTime: string;
  gender: "남성" | "여성";
  maritalStatus: MaritalStatus;
  repeatGhostAnswers: RepeatGhostAnswers;
  question: string;
  compatibilityType: "연인/배우자 궁합" | "사업파트너 궁합";

  partnerName: string;
  partnerYear: string;
  partnerMonth: string;
  partnerDay: string;
  partnerCalendar: "양력" | "음력";
  partnerLunarLeapMonth: boolean;
  partnerBirthTime: string;
  partnerGender: "남성" | "여성";
};

type Category = {
  id: CategoryId;
  title: string;
  subtitle: string;
  hook?: string;
  emoji: string;
  price: number;
  featured?: boolean;
  badge?: string;
};

type Character = {
  id: string;
  title: string;
  role: string;
  image: string;
  emoji: string;
  categoryId: CategoryId;
};

type Review = {
  name: string;
  category: string;
  text: string;
};

type ConsultPlan = {
  id: string;
  title: string;
  price: number;
  desc: string;
};

const emptyUser: UserInfo = {
  name: "",
  year: "",
  month: "",
  day: "",
  calendar: "양력",
  lunarLeapMonth: false,
  birthTime: "",
  gender: "남성",
  maritalStatus: "비공개",
  repeatGhostAnswers: {},
  question: "",
  compatibilityType: "연인/배우자 궁합",

  partnerName: "",
  partnerYear: "",
  partnerMonth: "",
  partnerDay: "",
  partnerCalendar: "양력",
  partnerLunarLeapMonth: false,
  partnerBirthTime: "",
  partnerGender: "여성",
};

const categories: Category[] = [
  {
    id: "today",
    title: "오늘운세",
    subtitle: "오늘 하루 돈·사람·말·몸에서 조심할 운",
    hook: "오늘 네 운이 어디서 열리고 어디서 막히는지 확인",
    emoji: "🌙",
    price: 1900,
    featured: true,
    badge: "가볍게 시작",
  },
  {
    id: "money",
    title: "재물운",
    subtitle: "돈복 등급·돈이 붙는 방식·피해야 할 돈",
    hook: "왜 벌어도 안 모이는지, 언제 돈복이 강해지는지 확인",
    emoji: "💰",
    price: 6900,
    featured: true,
  },
  {
    id: "career",
    title: "일·사업운",
    subtitle: "일복이 돈복으로 바뀌는 자리와 피해야 할 판",
    hook: "내 일이 돈이 되는지, 남 좋은 일로 새는지 확인",
    emoji: "💼",
    price: 6900,
    featured: true,
  },
  {
    id: "love",
    title: "사랑·결혼운",
    subtitle: "인연운·배우자 유형·결혼까지 가는 흐름",
    hook: "왜 비슷한 사람에게 흔들리고, 어떤 사람과 오래 가는지 확인",
    emoji: "❤️",
    price: 6900,
    featured: true,
  },
  {
    id: "health",
    title: "건강운",
    subtitle: "사주상 몸이 무너지는 방식과 조심할 시기",
    hook: "쉬어도 무거운 이유를 사주 흐름으로 확인",
    emoji: "🩺",
    price: 6900,
    featured: true,
  },
  {
    id: "compatibility",
    title: "궁합운",
    subtitle: "연인/배우자 궁합 또는 사업파트너 궁합",
    hook: "그 사람이 내 복이 될지, 악운이 될지 확인",
    emoji: "👥",
    price: 6900,
    featured: true,
  },
  {
    id: "monthly",
    title: "올해운세",
    subtitle: "올해 강해지는 달·돈복·일운·관계·건강 흐름",
    hook: "몇 월에 어떤 운이 강해지는지 포인트만 확인",
    emoji: "🌅",
    price: 6900,
    featured: true,
    badge: "올해운",
  },
  {
    id: "lifeFlow",
    title: "인생대운",
    subtitle: "초년·청년·중년·말년과 잡아야 할 대운",
    hook: "대운이 언제 열리고 어디서 막히는지 확인",
    emoji: "👑",
    price: 6900,
    featured: true,
    badge: "대운분석",
  },
  {
    id: "traditional",
    title: "평생종합사주",
    subtitle: "돈·일·인연·건강·자식·대운 전체 흐름",
    hook: "평생 반복되는 막힘과 반드시 살려야 할 복 확인",
    emoji: "📜",
    price: 14900,
    featured: true,
    badge: "대표상품",
  },
  {
    id: "premium",
    title: "내 고민 사주풀이",
    subtitle: "질문 하나에 붙은 운의 흐름을 깊게 풀이",
    hook: "해도 되는지, 멈춰야 하는지, 기다려야 하는지 확인",
    emoji: "🔮",
    price: 19900,
    featured: true,
    badge: "심화상담",
  },
];

const characters: Character[] = [
  {
    id: "bro",
    title: "운세형 도훈",
    role: "일·사업운·올해운세",
    image: "/characters/bro.png",
    emoji: "🧑‍💼",
    categoryId: "career",
  },
  {
    id: "grandma",
    title: "춘옥할매",
    role: "인생대운·평생종합사주",
    image: "/characters/grandma.png",
    emoji: "👵",
    categoryId: "lifeFlow",
  },
  {
    id: "seoyeon",
    title: "서연",
    role: "사랑·결혼운·궁합운",
    image: "/characters/seoyeon.png",
    emoji: "💘",
    categoryId: "love",
  },
  {
    id: "teacher",
    title: "돈맥선생",
    role: "재물운·돈복 흐름",
    image: "/characters/teacher.png",
    emoji: "💰",
    categoryId: "money",
  },
];

const reviews: Review[] = [
  {
    name: "성xx",
    category: "일·사업운",
    text: "직장형인지 사업형인지 계속 헷갈렸는데 고정 판정처럼 나와서 신뢰가 갔어요.",
  },
  {
    name: "뿌xx",
    category: "재물운",
    text: "돈복을 먼저 상중하로 말해주니까 바로 집중됐어요.",
  },
  {
    name: "하xx",
    category: "사랑·결혼운",
    text: "어떤 사람을 피해야 하는지까지 말해줘서 제 연애 패턴이 보였어요.",
  },
  {
    name: "우xx",
    category: "평생종합사주",
    text: "초년운부터 건강운, 자식 흐름까지 같이 보니까 진짜 종합사주 느낌이 났어요.",
  },
  {
    name: "민xx",
    category: "궁합운",
    text: "점수부터 나오고 왜 부딪히는지 설명해줘서 좋았어요.",
  },
  {
    name: "준xx",
    category: "사업파트너 궁합",
    text: "사람 좋은 것과 같이 돈 버는 건 다르다는 말이 기억나요.",
  },
  {
    name: "지xx",
    category: "오늘운세",
    text: "오늘 말이랑 돈에서 조심할 게 구체적으로 나와서 보기 편했어요.",
  },
  {
    name: "라xx",
    category: "내 고민 사주풀이",
    text: "그냥 위로가 아니라 지금 하지 말아야 할 선택을 짚어줘서 좋았어요.",
  },
  {
    name: "동xx",
    category: "재물운",
    text: "돈이 들어오는 방식과 돈이 새는 구조를 나눠줘서 현실적이었어요.",
  },
  {
    name: "서xx",
    category: "사랑·결혼운",
    text: "처음엔 설레는데 오래 가면 힘든 사람 유형이 너무 정확했어요.",
  },
  {
    name: "강xx",
    category: "일·사업운",
    text: "맞는 일 구조와 피해야 할 일 구조가 나와서 방향이 잡혔어요.",
  },
  {
    name: "현xx",
    category: "사랑·결혼운",
    text: "사랑·결혼운을 막연하게 말하지 않고 생활 기준을 알려줘서 좋았어요.",
  },
  {
    name: "도xx",
    category: "인생대운",
    text: "초년·청년·중년·말년으로 나눠서 보니까 내 인생 흐름이 이해됐어요.",
  },
  {
    name: "윤xx",
    category: "올해운세",
    text: "올해 돈, 일, 건강, 이직 흐름을 한 번에 보니까 방향이 잡혔어요.",
  },
  {
    name: "박xx",
    category: "내 고민 사주풀이",
    text: "제가 쓴 질문을 제대로 받아서 답해주는 느낌이라 만족했어요.",
  },
  {
    name: "최xx",
    category: "오늘운세",
    text: "오늘 급하게 답장하지 말라는 말이 딱 와닿았어요.",
  },
  {
    name: "은xx",
    category: "건강운",
    text: "질병 단정이 아니라 체질 흐름으로 풀어줘서 부담 없이 읽었어요.",
  },
  {
    name: "태xx",
    category: "일·사업운",
    text: "맞는 일만 말하는 게 아니라 피해야 할 일 구조를 말해줘서 좋았어요.",
  },
  {
    name: "소xx",
    category: "사랑·결혼운",
    text: "제가 왜 비슷한 사람에게 끌리는지 설명이 좋았어요.",
  },
  {
    name: "기xx",
    category: "궁합운",
    text: "몇 점인지 먼저 나오니까 진짜 궁합 본 느낌이 났어요.",
  },
  {
    name: "혜xx",
    category: "궁합운",
    text: "가족궁합 점수랑 거리 조절 기준이 나와서 마음이 정리됐어요.",
  },
  {
    name: "진xx",
    category: "사업파트너 궁합",
    text: "동업 전에 봤는데 역할과 돈 기준을 먼저 정하라는 말이 도움 됐어요.",
  },
  {
    name: "수xx",
    category: "평생종합사주",
    text: "중년운부터 건강관리까지 같이 보니까 훨씬 현실적이었어요.",
  },
  {
    name: "영xx",
    category: "내 고민 사주풀이",
    text: "막연한 답이 아니라 지금 정리해야 할 기준을 말해줘서 좋았어요.",
  },
  {
    name: "규xx",
    category: "재물운",
    text: "돈복 등급을 먼저 보고 나니까 왜 돈이 안 남는지도 이해됐어요.",
  },
  {
    name: "미xx",
    category: "사랑·결혼운",
    text: "배우자 유형과 피해야 할 상대를 나눠줘서 기준이 생겼어요.",
  },
  {
    name: "찬xx",
    category: "일·사업운",
    text: "직업 결과가 볼 때마다 바뀌지 않아서 좋았어요.",
  },
  {
    name: "아xx",
    category: "내 고민 사주풀이",
    text: "제가 물어본 고민을 중심으로 답이 나와서 일반 운세랑 달랐어요.",
  },
  {
    name: "혁xx",
    category: "오늘운세",
    text: "오늘 돈 새는 지출 조심하라는 말이 바로 써먹을 수 있었어요.",
  },
  {
    name: "연xx",
    category: "사랑·결혼운",
    text: "좋은 인연보다 피해야 할 사람을 말해주는 게 더 도움이 됐어요.",
  },
  {
    name: "재xx",
    category: "인생대운",
    text: "대운 기회가 몇 번 들어오는지 말해줘서 결제한 느낌이 있었어요.",
  },
  {
    name: "나xx",
    category: "올해운세",
    text: "올해 이직해야 할지 머물러야 할지 기준이 나와서 좋았어요.",
  },
  {
    name: "원xx",
    category: "평생종합사주",
    text: "초년운, 청년운, 중년운, 말년운에 건강과 자식까지 있어서 돈 낸 느낌이 있었어요.",
  },
  {
    name: "희xx",
    category: "자식 흐름",
    text: "자식 유무를 단정하지 않고 인연과 관계 흐름으로 말해줘서 좋았어요.",
  },
  {
    name: "석xx",
    category: "재물운",
    text: "무리한 투자랑 고정비 큰 사업 조심하라는 게 현실적이었어요.",
  },
  {
    name: "로xx",
    category: "내 고민 사주풀이",
    text: "혼자 생각하던 고민이 왜 반복되는지 정리됐어요.",
  },
  {
    name: "유xx",
    category: "사랑·결혼운",
    text: "결혼을 해야 하냐보다 어떤 기준으로 해야 하는지 알려줘서 좋았어요.",
  },
  {
    name: "빈xx",
    category: "사업파트너 궁합",
    text: "좋은 사람과 돈이 맞는 사람은 다르다는 말이 기억에 남아요.",
  },
  {
    name: "경xx",
    category: "건강운",
    text: "위장·소화·장 리듬 같은 식으로 구체적으로 나와서 좋았어요.",
  },
  {
    name: "훈xx",
    category: "일·사업운",
    text: "맞는 직업군을 나눠서 설명해줘서 실용적이었어요.",
  },
  {
    name: "별xx",
    category: "오늘운세",
    text: "처음엔 1,900원이라 봤는데 다음엔 재물운도 보고 싶어졌어요.",
  },
  {
    name: "림xx",
    category: "올해운세",
    text: "올해 돈복이 들어오는지, 건강운은 괜찮은지 같이 봐서 만족했어요.",
  },
];

const birthTimes = [
  "모름 / 선택 안 함",
  "자시 23:00~01:00",
  "축시 01:00~03:00",
  "인시 03:00~05:00",
  "묘시 05:00~07:00",
  "진시 07:00~09:00",
  "사시 09:00~11:00",
  "오시 11:00~13:00",
  "미시 13:00~15:00",
  "신시 15:00~17:00",
  "유시 17:00~19:00",
  "술시 19:00~21:00",
  "해시 21:00~23:00",
];

const consultPlans: ConsultPlan[] = [
  {
    id: "basic",
    title: "내 고민 사주풀이",
    price: 19900,
    desc: "질문 1개 · 사주 흐름으로 깊게 풀이",
  },
  {
    id: "couple",
    title: "궁합 심화 풀이",
    price: 19900,
    desc: "연인/배우자 또는 사업파트너 관계 집중 풀이",
  },
];

const questionExamples: Record<CategoryId, string[]> = {
  today: [
    "오늘 제가 말, 돈, 사람관계에서 조심해야 할 것은 뭔가요?",
    "오늘 급하게 결정하면 손해 볼 일이 있을까요?",
    "오늘 운을 좋게 쓰려면 뭘 하고 뭘 피해야 하나요?",
  ],
  money: [
    "제 사주에서 돈복은 상·중·하 중 어디인가요?",
    "돈이 붙는 방식과 돈이 새는 이유를 같이 봐주세요.",
    "제 재물운이 강해지는 시기와 피해야 할 돈 선택이 궁금해요.",
  ],
  career: [
    "제 사주에서 일운과 사업운은 어떤 편인가요?",
    "저는 직장형인지, 사업형인지, 자기수익형인지 봐주세요.",
    "제 사주에 맞는 일의 형태와 피해야 할 판이 궁금해요.",
  ],
  love: [
    "제 사주에서 사랑운과 결혼운은 어떤 흐름인가요?",
    "저는 어떤 인연이 잘 맞고 어떤 사람을 피해야 하나요?",
    "결혼까지 가려면 어떤 기준을 맞춰야 하는지 봐주세요.",
  ],
  health: [
    "제 사주에서 건강운은 어떤 흐름인가요?",
    "몸이 약해지는 방식과 조심할 시기가 궁금해요.",
    "제 체질적 약점과 몸이 먼저 보내는 신호를 봐주세요.",
  ],
  compatibility: [
    "우리 둘의 궁합은 몇 점이고 좋은 궁합인가요?",
    "이 관계가 결혼까지 갈 수 있는 궁합인지 봐주세요.",
    "이 사람과 사업파트너로 같이 돈을 벌 수 있는지 봐주세요.",
  ],
  monthly: [
    "올해 제 전체 운세 흐름을 봐주세요.",
    "올해 돈복이 움직이는 달과 일운이 강해지는 달이 궁금해요.",
    "올해 사람관계가 흔들리는 달과 건강을 조심해야 할 달을 봐주세요.",
  ],
  lifeFlow: [
    "제 초년운, 청년운, 중년운, 말년운 흐름을 봐주세요.",
    "제 인생에서 가장 중요한 대운은 언제 들어오나요?",
    "제 인생에 대운의 기회는 몇 번 있고, 무엇을 조심해야 하나요?",
  ],
  traditional: [
    "제 평생 전체 운의 큰 흐름을 봐주세요.",
    "초년운, 청년운, 중년운, 말년운이 궁금해요.",
    "재물운, 일·사업운, 사랑·결혼운, 건강운, 자식 흐름까지 종합적으로 봐주세요.",
  ],
  premium: [
    "지금 제일 답답한 문제를 깊게 풀어주세요.",
    "제가 지금 무엇을 붙잡고 무엇을 내려놔야 할까요?",
    "현재 상황에서 해도 되는지, 멈춰야 하는지, 기다려야 하는지 봐주세요.",
  ],
};

const maritalStatuses: MaritalStatus[] = ["미혼", "연애중", "기혼", "이혼/재혼 고민", "비공개"];

const blockedLuckOptions = ["돈", "일·사업", "사람관계", "사랑·결혼", "몸·건강", "마음·불안"] as const;

function cx(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

function getCategory(id: CategoryId) {
  return categories.find((item) => item.id === id) || categories[0];
}

function nameOf(user: UserInfo) {
  return user.name.trim() || "너";
}

function getRelationshipStatusText(status?: MaritalStatus) {
  if (!status || status === "비공개") return "관계상태 비공개";
  return `현재 ${status}`;
}

function normalizeUserInfo(value?: Partial<UserInfo> | null): UserInfo {
  return {
    ...emptyUser,
    ...(value || {}),
    lunarLeapMonth: Boolean(value?.lunarLeapMonth),
    partnerLunarLeapMonth: Boolean(value?.partnerLunarLeapMonth),
    maritalStatus: value?.maritalStatus || "비공개",
    repeatGhostAnswers: value?.repeatGhostAnswers || {},
  };
}

function getKcpMobileGoodName(targetCategoryId: CategoryId) {
  // KCP 모바일 결제창에서 한글 상품명이 ?????로 깨지는 경우가 있어
  // 모바일 결제창에만 카테고리별 영문 상품명을 보냅니다.
  // 사이트 화면/리포트명은 기존 한글 그대로 유지됩니다.
  const map: Record<CategoryId, string> = {
    today: "SoreumSaju Today Report",
    money: "SoreumSaju Money Report",
    career: "SoreumSaju Career Business Report",
    love: "SoreumSaju Love Marriage Report",
    health: "SoreumSaju Health Report",
    compatibility: "SoreumSaju Compatibility Report",
    monthly: "SoreumSaju Yearly Report",
    lifeFlow: "SoreumSaju Life Flow Report",
    traditional: "SoreumSaju Full Saju Report",
    premium: "SoreumSaju Personal Question Report",
  };

  return map[targetCategoryId] || "SoreumSaju Fortune Report";
}

function getKcpMobileShopName() {
  // 모바일 결제창 한글 인코딩 깨짐 방지용
  return "SoreumSaju";
}

function isMobileDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return (
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 767
  );
}

function makeSafeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 60) || "소름사주_리포트"
  );
}

function getPaidBullets(categoryId: CategoryId) {
  if (categoryId === "today") {
    return ["오늘 돈에서 조심할 선택", "오늘 사람관계에서 피해야 할 말", "오늘 몸 컨디션에서 신경 쓸 부분", "오늘 운을 살리는 한 가지 행동"];
  }

  if (categoryId === "money") {
    return ["돈복 상·중상·중·중하·하 명확한 판정", "돈이 붙는 방식과 돈이 새는 이유", "돈복이 강해지는 시기", "잡아야 할 돈과 피해야 할 돈"];
  }

  if (categoryId === "career") {
    return ["직장형·사업형·자기수익형 판정", "일복이 돈복으로 바뀌는 자리", "내 사주에 맞는 일의 형태", "기운만 빠지는 일의 판"];
  }

  if (categoryId === "love") {
    return ["사랑운과 결혼운의 진짜 흐름", "들어오는 인연과 피해야 할 사람", "결혼까지 갈 수 있는 기준", "결혼으로 가려면 맞춰야 할 것"];
  }

  if (categoryId === "health") {
    return ["사주상 몸이 무너지는 방식", "몸이 먼저 보내는 신호", "건강을 조심해야 할 시기", "몸을 살리는 생활 리듬"];
  }

  if (categoryId === "compatibility") {
    return ["궁합 점수와 등급", "왜 끌리고 왜 부딪히는지", "결혼까지 갈 수 있는 궁합인지", "사업파트너라면 돈 앞에서 맞는지"];
  }

  if (categoryId === "monthly") {
    return ["올해 전체 운의 결론", "돈복이 움직이는 달", "일·사업운이 강해지는 달", "사람관계와 건강을 조심할 달"];
  }

  if (categoryId === "lifeFlow") {
    return ["초년운·청년운·중년운·말년운", "인생 대운 기회가 몇 번 오는지", "가장 중요한 대운 시기", "대운을 막는 악운과 잡아야 할 복"];
  }

  if (categoryId === "traditional") {
    return ["초년운·청년운·중년운·말년운", "재물운·일사업운·사랑결혼운", "건강운·자식 흐름·인복", "평생 조심할 악운과 반드시 살려야 할 복"];
  }

  if (categoryId === "premium") {
    return ["질문에 대한 결론", "왜 이 고민이 반복되는지", "잡아야 할 것과 내려놔야 할 것", "도훈의 최종 판정"];
  }

  return ["내 사주에 맞는 핵심 방향", "피해야 할 선택과 반복 패턴", "앞으로 참고할 흐름", "전체 운의 방향"];
}


type PaidHook = {
  title: string;
  body: string;
  warning: string;
  points: string[];
  buttonText: string;
};

function getPaidHook(categoryId: CategoryId): PaidHook {
  const common = {
    title: "무료 판정만 보고 끊기면, 진짜 열리는 자리를 못 봅니다",
    body: "무료에서는 지금 먼저 봐야 할 막힌 자리만 열었습니다. 전체 리포트에서는 그 막힘이 어디서 왔는지, 어느 시기에 풀리는지, 무엇을 잡아야 복이 붙는지까지 이어서 봅니다.",
    warning: "좋은 말만 듣고 넘기면 같은 자리에서 또 막힐 수 있습니다. 점수와 등급 뒤에 숨어 있는 돈·일·사람·몸의 흐름을 끝까지 확인해야 합니다.",
    points: ["복이 붙는 자리", "악운이 붙는 선택", "운이 움직이는 시기", "도훈의 마지막 판정"],
    buttonText: "전체 리포트 열기",
  };

  const hooks: Partial<Record<CategoryId, PaidHook>> = {
    today: {
      title: "오늘 운은 짧게 지나가지만, 놓치면 바로 새는 날입니다",
      body: "무료에서는 오늘 가장 먼저 조심할 기운만 봤습니다. 전체 리포트에서는 오늘의 재물운, 일·사업운, 인연운, 건강운을 따로 열어서 돈이 새는 순간과 말이 꼬이는 지점을 봅니다.",
      warning: "오늘은 하루 운이라 길게 끌지 않습니다. 대신 오늘 돈을 써도 되는지, 연락을 해도 되는지, 몸을 무리해도 되는지 바로 확인해야 합니다.",
      points: ["오늘의 재물운", "오늘의 일·사업운", "오늘의 인연운", "오늘의 건강운"],
      buttonText: "오늘 전체 흐름 열기",
    },
    money: {
      title: "방금 나온 돈복, 등급만 보고 끝내면 또 새는 돈을 못 막습니다",
      body: "무료에서 돈복이 보였다면 이제 봐야 할 건 더 분명합니다. 언제 돈이 붙는지, 뭘 해서 돈을 버는지, 어떤 돈을 건드리면 손해가 먼저 붙는지까지 봐야 재물운이 남습니다.",
      warning: "돈복이 있어도 새는 자리 못 막으면 벌어도 남는 게 없습니다. 특히 정 때문에 쓰는 돈, 남 말 듣고 들어가는 돈, 내 몫이 흐린 돈은 끝까지 봐야 합니다.",
      points: ["돈복이 강해지는 나이대", "올해 돈이 움직이는 달", "뭘 해서 돈을 버는지", "피해야 할 돈"],
      buttonText: "재물운 전체 열기",
    },
    career: {
      title: "방금 나온 일 성향 판정, 여기서 끊기면 또 남 좋은 일만 할 수 있습니다",
      body: "진짜 중요한 건 네가 무슨 일을 해야 사주가 사는지입니다. 직장에 있으면 살아나는지, 사업으로 가야 하는지, 어느 판에 들어가면 이름도 몫도 남는지까지 봐야 합니다.",
      warning: "일복이 있어도 남 좋은 일만 하면 돈복으로 바뀌지 않습니다. 네 역할이 남는 자리와 기운만 빠지는 자리를 구분해야 합니다.",
      points: ["직장형·사업형 판정", "맞는 일의 형태", "피해야 할 일의 판", "일이 풀리는 시기"],
      buttonText: "일·사업운 전체 열기",
    },
    love: {
      title: "인연운이 있다는 말만으로는 부족합니다",
      body: "전체 리포트에서는 어떤 사람이 들어오는지, 누구를 만나면 마음만 늙는지, 올해 몇 월 전후로 인연이 움직이는지, 결혼까지 갈 수 있는 운인지까지 봅니다.",
      warning: "좋아하는 마음만 보고 가면 같은 자리에서 또 다칠 수 있습니다. 맞는 사람과 피해야 할 사람을 사주 흐름으로 갈라봐야 합니다.",
      points: ["들어오는 인연 시기", "맞는 사람 유형", "피해야 할 사람", "결혼까지 갈 수 있는 기준"],
      buttonText: "사랑·결혼운 전체 열기",
    },
    health: {
      title: "건강운은 겁주는 풀이가 아니라, 몸이 먼저 보내는 신호를 보는 겁니다",
      body: "전체 리포트에서는 사주상 어느 계통이 약하게 잡히는지, 몇 월 전후로 몸이 무너지기 쉬운지, 어떤 음식과 운동 흐름이 맞는지까지 봅니다.",
      warning: "몸이 먼저 무거워지는데도 넘기면 운이 들어와도 버틸 힘이 약해집니다. 위장·소화·수면·피로·순환 흐름을 따로 봐야 합니다.",
      points: ["약하게 잡히는 몸 계통", "몸이 무거워지는 시기", "맞는 음식 흐름", "맞는 운동 흐름"],
      buttonText: "건강운 전체 열기",
    },
    compatibility: {
      title: "궁합 점수만 보면, 왜 끌리고 왜 터지는지 놓칩니다",
      body: "전체 리포트에서는 이 사람이 내 복인지 악운인지, 연애로 좋은지 결혼까지 갈 수 있는지, 사업파트너라면 같이 돈을 벌 수 있는지까지 따로 봅니다.",
      warning: "좋은 사람과 오래 갈 사람은 다릅니다. 좋은 사람과 같이 돈 벌 수 있는 사람도 다릅니다. 궁합은 점수 뒤의 이유를 봐야 합니다.",
      points: ["궁합 점수와 등급", "끌리는 이유", "부딪히는 지점", "결혼 또는 동업 가능성"],
      buttonText: "궁합운 전체 열기",
    },
    monthly: {
      title: "올해운세는 1월부터 12월까지 늘어놓는 풀이가 아닙니다",
      body: "전체 리포트에서는 올해 돈이 움직이는 달, 일이 강해지는 달, 사람관계가 흔들리는 달, 몸을 조심해야 할 달을 찍어서 봅니다.",
      warning: "좋은 달을 놓치면 복이 지나가고, 나쁜 달을 모르고 들어가면 손해가 먼저 붙습니다. 올해는 움직일 달과 멈출 달이 다릅니다.",
      points: ["돈복이 움직이는 달", "일·사업운이 강해지는 달", "사람관계가 흔들리는 달", "건강 조심 달"],
      buttonText: "올해운세 전체 열기",
    },
    lifeFlow: {
      title: "대운은 기다린다고 내 것이 되는 운이 아닙니다",
      body: "전체 리포트에서는 초년·청년·중년·말년의 흐름과 인생에서 가장 큰 대운이 언제 들어오는지, 무엇이 그 대운을 막는지까지 봅니다.",
      warning: "대운이 와도 잡을 그릇이 없으면 지나갑니다. 돈·일·사람·건강 중 무엇이 대운을 열고 막는지 봐야 합니다.",
      points: ["초년·청년·중년·말년", "가장 중요한 대운", "대운을 막는 악운", "잡아야 할 복"],
      buttonText: "인생대운 전체 열기",
    },
    traditional: {
      title: "평생종합사주는 한 가지 운이 아니라, 네 인생 전체판을 여는 리포트입니다",
      body: "돈이 안 모인 이유가 일 때문인지, 일이 막힌 이유가 사람 때문인지, 몸이 무거운 이유가 오래 버틴 운 때문인지까지 같이 봐야 합니다. 평생종합사주는 초년부터 말년까지 돈·일·사람·건강·자식·대운을 한 판으로 펼쳐봅니다.",
      warning: "평생종합사주는 14,900원 대표 상품입니다. 초년부터 말년까지 돈·일·사람·건강·자식·대운이 어디서 붙고 어디서 막히는지 끝까지 열어봐야 합니다.",
      points: ["초년·청년·중년·말년", "평생 재물·일·사랑·건강", "자식 흐름과 인복", "평생 조심할 악운"],
      buttonText: "평생종합사주 전체 열기",
    },
    premium: {
      title: "이 고민은 위로가 아니라, 해도 되는지 멈춰야 하는지 답을 봐야 합니다",
      body: "내 고민 사주풀이는 종합사주가 아닙니다. 네가 적은 질문 하나를 놓고 지금 밀어붙여도 되는지, 기다려야 하는지, 정리해야 하는지, 사주상 어디서 막히고 어디서 풀리는지를 바로 봅니다.",
      warning: "내 고민 사주풀이는 19,900원 심화 풀이입니다. 돈이면 돈, 일이라면 일, 사람이라면 사람까지 질문 하나를 평생운처럼 깊게 파고듭니다.",
      points: ["질문에 대한 결론", "왜 반복되는 고민인지", "앞으로 1년 흐름", "도훈의 최종 답"],
      buttonText: "내 고민 전체 풀이 열기",
    },
  };

  return hooks[categoryId] || common;
}

function SafeImage({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid h-full w-full place-items-center text-6xl text-white">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={compact ? "leading-tight" : "text-center"}>
        <div
          className={
            compact
              ? "text-xl font-black tracking-[-0.05em] text-[#d8a86f]"
              : "text-4xl font-black tracking-[-0.07em] text-[#d8a86f]"
          }
        >
          소름사주
        </div>
        <div
          className={
            compact
              ? "text-[10px] font-black tracking-[0.12em] text-[#b98a52]"
              : "mt-1 text-sm font-black tracking-[0.08em] text-[#b98a52]"
          }
        >
          형이 귀신같이 봐준다
        </div>
      </div>
    );
  }

  return (
    <img
      src="/brand/soreum-logo.png"
      alt="소름사주 - 형이 귀신같이 봐준다"
      onError={() => setFailed(true)}
      className={compact ? "h-12 w-auto object-contain" : "h-auto w-full object-contain"}
    />
  );
}


function DohoonStoryHero({ onStart }: { onStart: () => void }) {
  const storyLines = [
    <>
      네 사주 안에
      <br />
      <span className="text-[#e0b36d]">네 운을 막는 무언가</span>가 숨어 있다.
    </>,
    <>
      그걸 모르고 살면
      <br />
      돈은 벌어도 안 모이고,
      <br />
      사람은 만나도 마음이 다치고,
      <br />
      일은 해도 내 몫이 늦고,
      <br />
      몸은 쉬어도 계속 무겁다.
    </>,
    <>
      소름사주는
      <br />
      좋은 말부터 하지 않는다.
    </>,
    <>
      먼저 네 운이
      <br />
      막힌 자리부터 본다.
    </>,
    <>
      복이 붙는 자리,
      <br />
      악운이 붙는 자리,
      <br />
      돈이 새는 구멍,
      <br />
      인연이 꼬이는 이유,
      <br />
      몸이 먼저 보내는 신호까지.
    </>,
    <>
      도훈이 네 사주를 펼쳐놓고
      <br />
      사주에 보이는 대로
      <br />
      <span className="text-[#e0b36d]">딱 까서 알려줄게.</span>
    </>,
  ];

  return (
    <section className="intro-hero-v3 relative min-h-[calc(100vh-32px)] overflow-hidden rounded-[34px] border border-[#7a5b37] bg-black shadow-[0_42px_130px_rgba(0,0,0,0.62)]">
      <div className="intro-bg-v3 absolute inset-0">
        <SafeImage
          src="/characters/dohoon-hero.png"
          alt="도훈 사주풀이 이미지"
          fallback="🧑‍💼"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/16 to-black/88" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/34 via-black/4 to-black/14" />
      <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black via-black/76 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_17%,rgba(255,218,145,0.20),transparent_38%)]" />
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,207,119,0.55)_1px,transparent_0)] [background-size:34px_34px]" />

      <button
        type="button"
        onClick={onStart}
        className="intro-mini-badge absolute left-4 top-4 z-20 rounded-full border border-[#7a5b37] bg-black/42 px-4 py-2 text-left backdrop-blur-md md:left-7 md:top-7"
      >
        <span className="block text-[15px] font-black leading-none tracking-[-0.04em] text-[#e0b36d] md:text-[17px]">
          소름사주
        </span>
        <span className="mt-1 hidden text-[9px] font-black tracking-[0.22em] text-[#b98a52] md:block">
          SOREUM SAJU
        </span>
      </button>

      <div className="relative z-10 flex min-h-[calc(100vh-32px)] flex-col justify-end px-5 pb-8 pt-20 md:px-10 md:pb-11">
        <div className="intro-copy-wrap-v3 relative mx-auto mb-9 h-[292px] w-full max-w-[620px] text-center md:mb-10 md:h-[318px]">
          {storyLines.map((line, index) => (
            <div
              key={index}
              className="intro-story-line-v3 absolute inset-x-0 bottom-0"
              style={{ animationDelay: `${index * 3.6}s` }}
            >
              <p className="break-keep text-[20px] font-black leading-[1.76] tracking-[-0.055em] text-[#f8efe2] drop-shadow-[0_8px_30px_rgba(0,0,0,1)] md:text-[30px] md:leading-[1.66]">
                {line}
              </p>
            </div>
          ))}
        </div>

        <div className="relative z-20 mx-auto w-full max-w-[520px]">
          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f6c76f] to-[#b98544] px-8 py-5 text-lg font-black text-black shadow-[0_22px_70px_rgba(216,168,111,0.28)] md:text-xl"
          >
            내 사주 보러가기 〉
          </button>

          <button
            type="button"
            onClick={onStart}
            className="mt-4 w-full text-center text-sm font-black text-[#e0b36d] underline underline-offset-4"
          >
            바로 시작하기
          </button>
        </div>
      </div>
    </section>
  );
}

function CharacterCard({
  card,
  onSelect,
}: {
  card: Character;
  onSelect: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full overflow-hidden rounded-[30px] border border-[#7a5b37] bg-black shadow-[0_18px_45px_rgba(0,0,0,0.42)] transition hover:-translate-y-1 hover:border-[#e0b36d]"
      >
        <div className="relative aspect-[3/4.6] w-full overflow-hidden bg-black">
          <SafeImage src={card.image} alt={card.title} fallback={card.emoji} />
        </div>
      </button>

      <div className="rounded-[20px] border border-[#7a5b37] bg-[#14110d] p-3 text-center">
        <div className="text-sm font-black text-[#d8a86f]">{card.title}</div>
        <div className="mt-1 text-xs font-bold text-[#c8beb0]">{card.role}</div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-full border border-[#d8a86f] bg-white px-3 py-3 text-center text-sm font-black text-black shadow-[0_10px_24px_rgba(216,168,111,0.14)]"
      >
        물어보기 →
      </button>
    </div>
  );
}

function splitReportSections(text: string) {
  const source = text.trim();

  if (!source) {
    return [] as Array<{ title: string; body: string }>;
  }

  const sections: Array<{ title: string; body: string }> = [];
  const chunks = source.split("[");

  const intro = chunks[0]?.trim();

  if (intro) {
    sections.push({
      title: "소름사주 풀이",
      body: intro,
    });
  }

  chunks.slice(1).forEach((chunk) => {
    const closeIndex = chunk.indexOf("]");
    if (closeIndex === -1) return;

    const title = chunk.slice(0, closeIndex).trim() || "소름사주 풀이";
    const body = chunk.slice(closeIndex + 1).trim();

    if (!body) return;

    sections.push({ title, body });
  });

  if (sections.length === 0) {
    return [
      {
        title: "소름사주 풀이",
        body: source,
      },
    ];
  }

  return sections;
}

function getSectionLabel(index: number) {
  const chapterNumber = String(index + 1).padStart(2, "0");
  return `CHAPTER ${chapterNumber}`;
}

function getSectionAccent(title: string) {
  if (
    title.includes("결론") ||
    title.includes("맞는") ||
    title.includes("어울리는") ||
    title.includes("돈복") ||
    title.includes("돈이 붙") ||
    title.includes("건강운") ||
    title.includes("자식 흐름") ||
    title.includes("대운") ||
    title.includes("오늘") ||
    title.includes("궁합") ||
    title.includes("신년") ||
    title.includes("해운") ||
    title.includes("이직")
  ) {
    return "text-[#e0b36d]";
  }

  if (
    title.includes("피해야") ||
    title.includes("막히") ||
    title.includes("새는") ||
    title.includes("약점") ||
    title.includes("위험") ||
    title.includes("부딪")
  ) {
    return "text-[#ef4444]";
  }

  return "text-white";
}

function isNumberedLine(line: string) {
  const first = line.charAt(0);
  const second = line.charAt(1);
  return first >= "0" && first <= "9" && second === ".";
}

function isQuoteLine(line: string) {
  const first = line.charAt(0);
  return first === "\"" || first === "“" || first === "'";
}

function isRedPointLine(line: string) {
  return line.trim().startsWith("|");
}

function cleanRedPointLine(line: string) {
  return line.trim().replace(/^\|\s*/, "");
}

function ReportSection({
  title,
  body,
  index,
  paid,
}: {
  title: string;
  body: string;
  index: number;
  paid?: boolean;
}) {
  const lines = body
    .split(String.fromCharCode(10))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const firstLine = lines[0] || "";
  const restLines = lines.slice(1);
  const accent = getSectionAccent(title);

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#7a5b37] bg-[#121217] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.28)] md:p-7">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#d8a86f]/10 blur-3xl" />

      <div className="mb-4">
        <div className="text-[10px] font-black tracking-[0.36em] text-[#d8a86f]">
          {getSectionLabel(index)}
        </div>
        <h3
          className={cx(
            "mt-2 break-keep text-[22px] font-black leading-tight tracking-[-0.045em] md:text-[26px]",
            accent
          )}
        >
          {title}
        </h3>
        <div className="mt-3 h-[2px] w-12 bg-[#d8a86f]" />
      </div>

      {firstLine ? (
        <div className="rounded-[22px] border border-[#7a5b37] bg-black/45 p-4">
          <p
            className={cx(
              "break-keep text-[18px] font-black leading-[1.75] tracking-[-0.035em] md:text-[20px]",
              isRedPointLine(firstLine) ? "border-l-4 border-[#b91c1c] pl-4 text-[#ef4444]" : "text-white"
            )}
          >
            {isRedPointLine(firstLine) ? cleanRedPointLine(firstLine) : firstLine}
          </p>
        </div>
      ) : null}

      {restLines.length > 0 ? (
        <div className="mt-4 space-y-5 break-keep text-[16px] font-medium leading-9 text-[#d8d0c6]">
          {restLines.map((line, lineIndex) => (
            <p
              key={`${title}-${index}-${lineIndex}`}
              className={cx(
                isNumberedLine(line)
                  ? "rounded-2xl border border-[#7a5b37] bg-black/30 p-3 text-white"
                  : undefined,
                isQuoteLine(line)
                  ? "border-l-2 border-[#d8a86f] pl-3 text-[#f5efe6]"
                  : undefined,
                isRedPointLine(line)
                  ? "rounded-none border-l-4 border-[#b91c1c] bg-transparent py-1 pl-4 text-[19px] font-black leading-[2.0] text-[#ef4444] md:text-[21px]"
                  : undefined
              )}
            >
              {isRedPointLine(line) ? cleanRedPointLine(line) : line}
            </p>
          ))}
        </div>
      ) : null}

      {paid && index === 0 ? (
        <div className="mt-4 rounded-full border border-[#d8a86f] bg-[#241e18] px-4 py-2 text-center text-xs font-black text-[#e0b36d]">
          전체 리포트 열람 중
        </div>
      ) : null}
    </article>
  );
}

function ResultReport({ text, paid = false }: { text: string; paid?: boolean }) {
  const sections = splitReportSections(text);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [showAllChapters, setShowAllChapters] = useState(!paid);

  useEffect(() => {
    setChapterIndex(0);
    setShowAllChapters(!paid);
  }, [text, paid]);

  if (sections.length === 0) return null;

  const safeChapterIndex = Math.min(chapterIndex, sections.length - 1);
  const currentSection = sections[safeChapterIndex];
  const hasManyChapters = sections.length > 1;
  const progressPercent = Math.round(((safeChapterIndex + 1) / sections.length) * 100);

  const goPrevChapter = () => {
    setChapterIndex((prev) => Math.max(0, prev - 1));
  };

  const goNextChapter = () => {
    setChapterIndex((prev) => Math.min(sections.length - 1, prev + 1));
  };

  if (!paid || showAllChapters) {
    return (
      <div className="mt-5 space-y-5">
        {paid ? (
          <div className="rounded-[28px] border border-[#7a5b37] bg-black/35 p-5">
            <div className="text-[10px] font-black tracking-[0.32em] text-[#d8a86f]">
              SOREUM FULL REPORT
            </div>
            <div className="mt-2 text-xl font-black tracking-[-0.045em] text-white">
              전체 리포트를 한 번에 펼쳐서 보고 있습니다
            </div>
            <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
              챕터별로 넘겨보고 싶으면 다시 카드형 보기로 바꿀 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAllChapters(false);
                setChapterIndex(0);
              }}
              className="mt-4 w-full rounded-full border border-[#d8a86f] bg-[#241e18] px-5 py-3 text-sm font-black text-[#e0b36d]"
            >
              챕터 넘기기로 보기
            </button>
          </div>
        ) : null}

        {sections.map((section, index) => (
          <ReportSection
            key={`${section.title}-${index}`}
            title={section.title}
            body={section.body}
            index={index}
            paid={paid}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="overflow-hidden rounded-[30px] border border-[#7a5b37] bg-[radial-gradient(circle_at_80%_20%,rgba(216,168,111,0.13),transparent_32%),#0f0e0d] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black tracking-[0.32em] text-[#d8a86f]">
              SOREUM FULL REPORT
            </div>
            <div className="mt-2 break-keep text-xl font-black tracking-[-0.045em] text-white">
              챕터별로 넘기며 전체 리포트를 읽습니다
            </div>
          </div>

          <div className="rounded-full border border-[#7a5b37] bg-black/40 px-4 py-2 text-sm font-black text-[#e0b36d]">
            {safeChapterIndex + 1} / {sections.length}
          </div>
        </div>

        <p className="mt-4 break-keep text-sm leading-6 text-[#c8beb0]">
          한 번에 길게 읽는 대신, 돈 낸 전체 리포트를 챕터별로 끊어서 봅니다. 필요하면 전체보기로 다시 펼칠 수 있습니다.
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-[#d8a86f] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sections.map((section, index) => (
            <button
              key={`chapter-tab-${section.title}-${index}`}
              type="button"
              onClick={() => setChapterIndex(index)}
              className={cx(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-black transition",
                safeChapterIndex === index
                  ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                  : "border-[#7a5b37] bg-black/35 text-[#c8beb0]"
              )}
            >
              {String(index + 1).padStart(2, "0")}. {section.title.slice(0, 12)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <ReportSection
          key={`${currentSection.title}-${safeChapterIndex}-single`}
          title={currentSection.title}
          body={currentSection.body}
          index={safeChapterIndex}
          paid={paid}
        />
      </div>

      <div className="rounded-[28px] border border-[#7a5b37] bg-[#11100f] p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={goPrevChapter}
            disabled={!hasManyChapters || safeChapterIndex === 0}
            className="rounded-full border border-[#7a5b37] bg-black/35 px-4 py-4 text-sm font-black text-white disabled:opacity-35"
          >
            〈 이전 챕터
          </button>

          <button
            type="button"
            onClick={() => setShowAllChapters(true)}
            className="order-3 col-span-2 rounded-full border border-[#d8a86f] bg-white px-4 py-4 text-sm font-black text-black sm:order-none sm:col-span-1"
          >
            전체보기
          </button>

          <button
            type="button"
            onClick={goNextChapter}
            disabled={!hasManyChapters || safeChapterIndex === sections.length - 1}
            className="rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-4 py-4 text-sm font-black text-black disabled:opacity-35"
          >
            다음 챕터 〉
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {sections.map((section, index) => (
            <button
              key={`dot-${section.title}-${index}`}
              type="button"
              aria-label={`${index + 1}번 챕터로 이동`}
              onClick={() => setChapterIndex(index)}
              className={cx(
                "h-2.5 rounded-full transition-all",
                safeChapterIndex === index ? "w-8 bg-[#d8a86f]" : "w-2.5 bg-[#7a5b37]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-black text-white">{children}</label>;
}

function MaritalStatusSelector({
  user,
  onChange,
  compact = false,
}: {
  user: UserInfo;
  onChange: (next: UserInfo) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2" : "mb-4"}>
      {!compact && <FieldLabel>현재 관계 상태</FieldLabel>}
      {compact && (
        <div className="text-sm font-black text-[#d8a86f]">현재 관계 상태</div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {maritalStatuses.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...user, maritalStatus: value })}
            className={cx(
              "rounded-2xl border px-3 py-3 text-sm font-black",
              user.maritalStatus === value
                ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                : "border-[#7a5b37] bg-[#14110d] text-white"
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="mt-2 break-keep text-xs leading-5 text-[#c8beb0]">
        사랑·결혼운에서 기혼자에게 새 인연 중심으로 나오는 것을 줄이고, 현재 상황에 맞춰 부부관계·연애중·재혼운을 다르게 봅니다.
      </p>
    </div>
  );
}

function BlockedLuckSelector({
  user,
  onChange,
  compact = false,
}: {
  user: UserInfo;
  onChange: (next: UserInfo) => void;
  compact?: boolean;
}) {
  const selected = user.repeatGhostAnswers?.blocked || "";

  const setBlockedLuck = (value: string) => {
    onChange({
      ...user,
      repeatGhostAnswers: {
        blocked: value,
        category: value,
      },
    });
  };

  return (
    <div
      className={cx(
        compact
          ? "rounded-[26px] border border-[#7a5b37] bg-[#14110d] p-4"
          : "mb-4 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-[#d8a86f]">
            지금 내 운을 막는 자리
          </div>
          <p className="mt-2 break-keep text-xs leading-5 text-[#c8beb0]">
            딱 하나만 골라줘. 도훈이가 그 부분을 중심으로 돈·일·사람·몸에서 어디가 막히는지 더 선명하게 봅니다.
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-[#7a5b37] bg-black/35 px-3 py-1 text-[11px] font-black text-[#e0b36d]">
          선택
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {blockedLuckOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setBlockedLuck(option)}
            className={cx(
              "rounded-2xl border px-3 py-3 text-center text-sm font-black leading-5",
              selected === option
                ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                : "border-[#7a5b37] bg-[#11100f] text-white"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="mt-3 break-keep text-xs leading-5 text-[#c8beb0]">
        선택하지 않아도 사주풀이가 가능하지만, 하나를 고르면 결과에서 지금 제일 답답한 부분을 더 먼저 짚어줍니다.
      </p>
    </div>
  );
}

export default function Page() {
  const [step, setStep] = useState<Step>("intro");
  const [categoryId, setCategoryId] = useState<CategoryId>("today");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [paid, setPaid] = useState(false);
  const [isLocalTest, setIsLocalTest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState("");
  const [aiFull, setAiFull] = useState("");
  const [consultQuestion, setConsultQuestion] = useState("");
  const [consultAiResult, setConsultAiResult] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [user, setUser] = useState<UserInfo>(emptyUser);

  const category = useMemo(() => getCategory(categoryId), [categoryId]);
  const selectedPlanInfo =
    consultPlans.find((plan) => plan.id === selectedPlan) || consultPlans[1];

  const showPartnerFields = categoryId === "compatibility";

  const showQuestion = categoryId === "premium";

  const featuredCategories = categories.filter((item) => item.featured);
  const normalCategories = categories.filter((item) => !item.featured);

  const reviewsPerPage = 3;
  const reviewPages = Math.ceil(reviews.length / reviewsPerPage);
  const visibleReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage
  );

  const birthMeta = `${user.year || "----"}년 ${user.month || "--"}월 ${
    user.day || "--"
  }일 · ${user.calendar}${user.calendar === "음력" && user.lunarLeapMonth ? " 윤달" : ""} · ${user.gender} · ${getRelationshipStatusText(user.maritalStatus)}`;

  const paidBullets = getPaidBullets(categoryId);
  const paidHook = getPaidHook(categoryId);

  const baseFileName = useMemo(() => {
    return makeSafeFileName(`${nameOf(user)}_${category.title}_소름사주_리포트`);
  }, [user.name, category.title]);

  useEffect(() => {
    console.log("SOREUM_PAGE_VERSION", "page-v65-paid-chapter-slider");
  }, []);

  useEffect(() => {
    const host = window.location.hostname;

    setIsLocalTest(
      host === "localhost" ||
        host === "127.0.0.1" ||
        host.startsWith("192.168.")
    );
  }, []);

  useEffect(() => {
    const scriptId = "kcp-spay-script";

    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;

    // PC 결제창용 운영 스크립트입니다.
    // 모바일은 requestKcpMobilePayment에서 별도 모바일 결제창으로 이동합니다.
    script.src = "https://spay.kcp.co.kr/plugin/kcp_spay_hub.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("rid");

    if (!resultId) return;

    try {
      const saved = window.localStorage.getItem(`fortune-result-${resultId}`);
      if (!saved) return;

      const parsed = JSON.parse(saved) as {
        categoryId?: CategoryId;
        user?: UserInfo;
        preview?: string;
        full?: string;
        paid?: boolean;
      };

      if (parsed.categoryId) setCategoryId(parsed.categoryId);
      if (parsed.user) setUser(normalizeUserInfo(parsed.user));
      if (parsed.preview) setAiPreview(parsed.preview);
      if (parsed.full) setAiFull(parsed.full);
      setPaid(Boolean(parsed.paid && parsed.full));
      setStep("result");
    } catch (error) {
      console.error("saved result restore error:", error);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "fail") {
      alert("결제가 취소되었거나 실패했습니다.");
      return;
    }

    if (payment !== "success") return;

    const saved = window.localStorage.getItem("fortune-pending-payment");

    if (!saved) {
      alert("결제는 성공했지만 저장된 운세 정보가 없습니다. 다시 무료 결과를 생성한 뒤 전체 리포트를 열어주세요.");
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        categoryId: CategoryId;
        user: UserInfo;
        preview: string;
      };

      setCategoryId(parsed.categoryId);
      const restoredUser = normalizeUserInfo(parsed.user);
      setUser(restoredUser);
      setAiPreview(parsed.preview || "");
      setPaid(true);
      setStep("result");

      setTimeout(() => {
        generateFullResult(parsed.categoryId, restoredUser);
      }, 200);
    } catch (error) {
      console.error("payment restore error:", error);
      alert("결제 후 리포트 정보를 복원하지 못했습니다.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goInput = (id: CategoryId) => {
    setCategoryId(id);
    setPaid(false);
    setAiPreview("");
    setAiFull("");
    setConsultAiResult("");
    setMenuOpen(false);
    setStep("input");
  };

  const savePendingPayment = (
    orderId: string,
    orderName: string,
    amount: number
  ) => {
    window.localStorage.setItem(
      "fortune-pending-payment",
      JSON.stringify({
        categoryId,
        user,
        preview: aiPreview,
        orderId,
        orderName,
        amount,
      })
    );
  };

  const requestKcpMobilePayment = async (orderName: string, amount: number) => {
    try {
      const siteCd = process.env.NEXT_PUBLIC_KCP_SITE_CD;

      if (!siteCd) {
        alert("KCP 사이트 코드가 없습니다. Vercel 환경변수 NEXT_PUBLIC_KCP_SITE_CD를 확인하세요.");
        return;
      }

      const orderId = `SOREUM${Date.now()}`;
      savePendingPayment(orderId, orderName, amount);

      const retUrl = `${window.location.origin}/api/kcp/approve`;

      const response = await fetch("/api/kcp/mobile/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          // 모바일 KCP 거래등록에는 영문 상품명을 사용해서 ????? 깨짐을 막습니다.
          // localStorage에는 기존 orderName을 저장해두므로 사이트 복귀 후 리포트 흐름은 그대로입니다.
          orderName: getKcpMobileGoodName(categoryId),
          amount,
          buyerName: nameOf(user),
          buyerTel: "01000000000",
          retUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "KCP 모바일 거래등록에 실패했습니다."
        );
      }

      const payUrl = String(data.PayUrl || "");
      const approvalKey = String(data.approvalKey || "");

      if (!payUrl || !approvalKey) {
        throw new Error("KCP 모바일 결제창 주소 또는 승인키가 없습니다.");
      }

      const form = document.createElement("form");
      form.name = "order_info";
      form.method = "post";
      form.acceptCharset = "euc-kr";
      form.action =
        payUrl.substring(0, payUrl.lastIndexOf("/")) +
        "/jsp/encodingFilter/encodingFilter.jsp";

      const payData: Record<string, string> = {
        site_cd: siteCd,
        pay_method: "CARD",
        currency: "410",
        shop_name: getKcpMobileShopName(),
        Ret_URL: retUrl,
        approval_key: approvalKey,
        PayUrl: payUrl,
        ordr_idxx: orderId,
        good_name: getKcpMobileGoodName(categoryId),
        good_mny: String(amount),
        buyr_name: nameOf(user),
        buyr_mail: "",
        buyr_tel2: "01000000000",
        escw_used: "N",
      };

      Object.entries(payData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "KCP 모바일 결제창을 여는 중 문제가 발생했습니다.";
      alert(message);
    }
  };

  const requestKcpPayment = async (orderName: string, amount: number) => {
    if (!privacyAgreed) {
      alert("개인정보 수집·이용에 동의해야 결제를 진행할 수 있습니다.");
      return;
    }

    const siteCd = process.env.NEXT_PUBLIC_KCP_SITE_CD;

    if (!siteCd) {
      alert("KCP 사이트 코드가 없습니다. .env.local 또는 Vercel의 NEXT_PUBLIC_KCP_SITE_CD를 확인하세요.");
      return;
    }

    if (isMobileDevice()) {
      await requestKcpMobilePayment(orderName, amount);
      return;
    }

    if (!window.KCP_Pay_Execute_Web) {
      alert("KCP 결제창 스크립트를 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    try {
      const orderId = `SOREUM${Date.now()}`;
      savePendingPayment(orderId, orderName, amount);

      const form = document.createElement("form");
      form.name = "order_info";
      form.method = "post";
      form.action = "/api/kcp/approve";

      const payData: Record<string, string> = {
        site_cd: siteCd,
        site_name: "소름사주",

        // PC 신용카드 결제
        pay_method: "100000000000",

        ordr_idxx: orderId,
        good_name: orderName,
        good_mny: String(amount),
        currency: "WON",

        buyr_name: nameOf(user),
        buyr_mail: "",
        buyr_tel1: "",
        buyr_tel2: "01000000000",

        // 결제 인증 완료 후 KCP가 넘겨줄 서버 주소
        Ret_URL: `${window.location.origin}/api/kcp/approve`,

        // 에스크로 사용 안 함
        escrow_yn: "N",

        // 디지털 콘텐츠 제공기간
        good_expr: "0",
      };

      Object.entries(payData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      window.KCP_Pay_Execute_Web(form);
    } catch (error) {
      console.error(error);
      alert("KCP 결제창을 여는 중 문제가 발생했거나 결제가 취소되었습니다.");
    }
  };

  const generateAIResult = async () => {
    setAiLoading(true);
    setAiPreview("");
    setAiFull("");

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "preview",
          user,
          categoryId,
          categoryTitle: category.title,
          question: user.question,
          compatibilityType: user.compatibilityType,
        }),
      });

      const rawText = await response.text();
      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`서버가 JSON이 아닌 응답을 보냈습니다.\n${rawText.slice(0, 1000)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "무료 결과 생성 실패");
      }

      setAiPreview(
        data.preview ||
          data.result ||
          "[API 응답 없음] 무료 운세 결과를 불러오지 못했습니다."
      );
      setAiFull("");
    } catch (error) {
      console.error(error);

      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      setAiPreview(`[무료 리포트 오류]\n\n${message}`);
      setAiFull("");
    } finally {
      setAiLoading(false);
    }
  };

  const generateFullResult = async (
    targetCategoryId: CategoryId = categoryId,
    targetUser: UserInfo = user
  ) => {
    const targetCategory = getCategory(targetCategoryId);

    setPaid(true);
    setFullLoading(true);
    setAiFull("전체 리포트 요청을 보내는 중입니다...");

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "full",
          user: targetUser,
          categoryId: targetCategoryId,
          categoryTitle: targetCategory.title,
          question: targetUser.question,
          compatibilityType: targetUser.compatibilityType,
        }),
      });

      const rawText = await response.text();

      console.log("FULL STATUS:", response.status);
      console.log("FULL RAW RESPONSE:", rawText);

      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `서버가 JSON이 아닌 응답을 보냈습니다.\n\n상태코드: ${response.status}\n\n응답내용:\n${rawText.slice(
            0,
            1200
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `전체 리포트 생성 실패. 상태코드: ${response.status}`
        );
      }

      const fullText = data?.full || data?.result || data?.preview || "";

      if (!fullText) {
        throw new Error(
          `API는 응답했지만 full/result 값이 비어 있습니다.\n\n응답내용:\n${JSON.stringify(
            data,
            null,
            2
          ).slice(0, 1500)}`
        );
      }

      setAiFull(fullText);
      setPaid(true);
    } catch (error) {
      console.error("FULL REPORT ERROR:", error);

      const message = error instanceof Error ? error.message : "알 수 없는 오류";

      setAiFull(`[전체 리포트 오류]

유료 리포트를 불러오지 못했습니다.

아래 내용을 복사해서 확인해 주세요.

${message}`);
      setPaid(true);
    } finally {
      setFullLoading(false);
    }
  };

  const openFullReportForTest = async () => {
    if (!isLocalTest) {
      alert("로컬 테스트 환경에서만 사용할 수 있습니다.");
      return;
    }

    if (!privacyAgreed) {
      alert("개인정보 수집·이용에 동의해야 전체 리포트를 볼 수 있습니다.");
      return;
    }

    setPaid(true);
    setStep("result");
    setAiFull("전체 리포트를 불러오는 중입니다...");

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);

    await generateFullResult();
  };

  const generateConsultAI = async () => {
    setAiLoading(true);
    setConsultAiResult("");

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "full",
          user: { ...user, question: consultQuestion },
          categoryId: "premium",
          categoryTitle: selectedPlanInfo.title,
          question: consultQuestion,
          compatibilityType: user.compatibilityType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI 생성 실패");
      }

      setConsultAiResult(data.full || data.result || "결과를 불러오지 못했습니다.");
    } catch (error) {
      console.error(error);
      setConsultAiResult("AI 상담 결과를 불러오지 못했습니다. API 키와 서버 상태를 확인해주세요.");
    } finally {
      setAiLoading(false);
    }
  };

  const getCurrentResultText = () => {
    const title = `${nameOf(user)}의 ${category.title} 리포트`;
    const body = paid && aiFull ? aiFull : aiPreview;

    return `${title}

${birthMeta}

${body || "아직 생성된 결과가 없습니다."}`;
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentResultText());
      alert(`${baseFileName} 내용을 복사했어.`);
    } catch (error) {
      console.error(error);
      alert("복사에 실패했어. 브라우저 권한을 확인해줘.");
    }
  };

  const createRevisitLink = () => {
    if (!aiPreview && !aiFull) return "";

    const resultId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    window.localStorage.setItem(
      `fortune-result-${resultId}`,
      JSON.stringify({
        categoryId,
        user,
        preview: aiPreview,
        full: aiFull,
        paid,
      })
    );

    return `${window.location.origin}${window.location.pathname}?rid=${resultId}`;
  };

  const shareResult = async () => {
    if (!aiPreview && !aiFull) {
      alert("먼저 운세 결과를 생성해줘.");
      return;
    }

    const link = createRevisitLink();
    const shareText = `${nameOf(user)}의 ${category.title} 운세 결과가 도착했어.
소름사주에서 다시 확인해봐.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "소름사주 운세 결과",
          text: shareText,
          url: link,
        });
        return;
      }

      await navigator.clipboard.writeText(link);
      alert("이 브라우저에서는 공유창이 안 떠서 다시 보기 링크를 복사했어.");
    } catch (error) {
      console.error(error);

      try {
        await navigator.clipboard.writeText(link);
        alert("공유창이 닫혔거나 실패해서 다시 보기 링크를 복사했어.");
      } catch {
        alert("공유에 실패했어. 모바일에서 다시 시도해줘.");
      }
    }
  };

  const copyRevisitLink = async () => {
    if (!aiPreview && !aiFull) {
      alert("먼저 운세 결과를 생성해줘.");
      return;
    }

    try {
      const link = createRevisitLink();
      await navigator.clipboard.writeText(link);
      alert("다시 보기 링크를 복사했어. 같은 브라우저에서 다시 열 수 있어.");
    } catch (error) {
      console.error(error);
      alert("다시 보기 링크 생성에 실패했어.");
    }
  };

  const ResultActionButtons = () => {
    if (aiLoading || fullLoading || (!aiPreview && !aiFull)) return null;

    return (
      <div className="mt-5 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={copyResult}
          className="rounded-full border border-[#d8a86f] bg-[#14110d] px-5 py-4 text-sm font-black text-white"
        >
          결과 복사하기
        </button>

        <button
          type="button"
          onClick={shareResult}
          className="rounded-full border border-[#d8a86f] bg-[#241e18] px-5 py-4 text-sm font-black text-[#e0b36d]"
        >
          공유하기
        </button>

        <button
          type="button"
          onClick={copyRevisitLink}
          className="rounded-full border border-[#d8a86f] bg-white px-5 py-4 text-sm font-black text-black"
        >
          다시 보기 링크 받기
        </button>
      </div>
    );
  };

  const PrivacyBox = () => (
    <label className="flex items-start gap-3 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4 text-left text-white">
      <input
        type="checkbox"
        checked={privacyAgreed}
        onChange={(event) => setPrivacyAgreed(event.target.checked)}
        className="mt-1 h-5 w-5 accent-[#d8a86f]"
      />
      <span>
        <span className="block text-sm font-black text-white">
          개인정보 수집·이용 동의
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#c8beb0]">
          운세 분석과 상담 리포트 생성을 위해 이름/별명, 생년월일, 성별, 출생시간, 상담 질문을 수집·이용합니다.
        </span>
      </span>
    </label>
  );

  return (
    <div className="fortune-page min-h-screen bg-[#080706] text-white antialiased">
      <style jsx global>{`
        .fortune-page {
          font-family: "Noto Serif KR", "Gowun Batang", "Nanum Myeongjo", serif;
        }
        .fortune-page button,
        .fortune-page input,
        .fortune-page select,
        .fortune-page textarea {
          font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
        }
        .fortune-page article,
        .fortune-page article p,
        .fortune-page article h3 {
          font-family: "Noto Serif KR", "Gowun Batang", "Nanum Myeongjo", serif;
        }
        .fortune-page * {
          border-color: #d8a86f !important;
        }
        .fortune-page input,
        .fortune-page select,
        .fortune-page textarea {
          border: 1px solid #7a5b37 !important;
          background: #11100f !important;
          color: #ffffff !important;
          border-radius: 18px !important;
          outline: none !important;
        }
        .fortune-page input::placeholder,
        .fortune-page textarea::placeholder {
          color: rgba(255, 255, 255, 0.45) !important;
        }
        .fortune-page option {
          background: #111111 !important;
          color: #ffffff !important;
        }



        .intro-bg-v3 img {
          object-position: center top !important;
          filter: brightness(1.18) contrast(1.12) saturate(1.12) drop-shadow(0 0 26px rgba(255, 213, 145, 0.12)) !important;
          transform: scale(1.065);
        }

        .home-hero-image img {
          object-position: center top !important;
          filter: brightness(1.2) contrast(1.1) saturate(1.1) drop-shadow(0 0 24px rgba(255, 213, 145, 0.13)) !important;
          transform: scale(1.018);
        }

        .intro-hero-v3,
        .intro-hero-v3 p {
          font-family: "Noto Serif KR", "Gowun Batang", "Nanum Myeongjo", serif;
        }

        .intro-mini-badge {
          box-shadow: 0 12px 34px rgba(0,0,0,0.34);
        }

        .intro-copy-wrap-v3 {
          pointer-events: none;
        }

        .intro-story-line-v3 {
          opacity: 0;
          transform: translateY(64px);
          animation: soreumIntroStoryV3 21.6s infinite;
        }

        @keyframes soreumIntroStoryV3 {
          0% {
            opacity: 0;
            transform: translateY(64px);
            filter: blur(7px);
          }

          6% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }

          17% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }

          23% {
            opacity: 0;
            transform: translateY(-46px);
            filter: blur(5px);
          }

          100% {
            opacity: 0;
            transform: translateY(-46px);
            filter: blur(5px);
          }
        }

        @media (max-width: 767px) {
          .intro-hero-v3 {
            min-height: calc(100vh - 20px) !important;
            border-radius: 26px !important;
          }

          .intro-hero-v3 > div.relative {
            min-height: calc(100vh - 20px) !important;
            padding-left: 18px !important;
            padding-right: 18px !important;
            padding-bottom: 28px !important;
          }

          .intro-bg-v3 img {
            object-position: center top !important;
            filter: brightness(1.15) contrast(1.12) saturate(1.12) drop-shadow(0 0 22px rgba(255, 213, 145, 0.12)) !important;
            transform: scale(1.105);
          }

          .intro-mini-badge {
            left: 12px !important;
            top: 12px !important;
            padding: 7px 12px !important;
          }

          .intro-copy-wrap-v3 {
            height: 315px !important;
            max-width: 94% !important;
            margin-bottom: 32px !important;
          }

          .intro-story-line-v3 p {
            font-size: 20px !important;
            line-height: 1.76 !important;
            letter-spacing: -0.055em !important;
          }

          .fortune-page main {
            padding-left: 10px !important;
            padding-right: 10px !important;
            padding-top: 10px !important;
          }

          .home-compact {
            gap: 18px !important;
          }

          .home-hero {
            border-radius: 26px !important;
            min-height: 0 !important;
          }

          .home-hero > div:nth-child(2) {
            display: flex !important;
            flex-direction: column-reverse !important;
            min-height: 0 !important;
          }

          .home-hero > div:nth-child(2) > div:first-child {
            position: relative !important;
            inset: auto !important;
            z-index: 10 !important;
            justify-content: flex-start !important;
            padding: 18px !important;
            padding-top: 18px !important;
            background: linear-gradient(180deg, rgba(5,5,5,0.98) 0%, rgba(9,7,5,0.98) 100%) !important;
          }

          .home-hero > div:nth-child(2) > div:last-child {
            min-height: 360px !important;
            height: 360px !important;
            border-bottom: 1px solid rgba(216,168,111,0.55) !important;
          }

          .home-hero h1 {
            font-size: 38px !important;
            line-height: 1.08 !important;
          }

          .home-hero p {
            font-size: 15px !important;
            line-height: 1.65 !important;
          }

          .home-hero img {
            object-position: center top !important;
          }

          .home-hero-image img {
            object-position: center top !important;
            filter: brightness(1.18) contrast(1.1) saturate(1.1) drop-shadow(0 0 22px rgba(255, 213, 145, 0.13)) !important;
            transform: scale(1.018);
          }

          .home-hero .max-w-\[300px\] {
            max-width: 180px !important;
            margin-bottom: 16px !important;
          }

          .home-hero .mt-7.grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
          }

          .home-hero .mt-7.grid > div {
            padding: 9px !important;
            border-radius: 16px !important;
          }

          .home-hero .mt-7.grid .text-2xl {
            font-size: 18px !important;
          }

          .home-hero .mt-7.grid .font-black {
            font-size: 11px !important;
            line-height: 1.25 !important;
          }

          .home-hero .mt-7.grid .text-xs {
            display: none !important;
          }

          .trust-reasons {
            display: block !important;
          }

          .trust-reasons h2 {
            font-size: 22px !important;
            margin-bottom: 12px !important;
          }

          .trust-reasons > div {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 10px !important;
            padding: 2px 2px 10px !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .trust-reasons > div > * {
            flex: 0 0 220px !important;
            scroll-snap-align: start !important;
            padding: 16px !important;
            border-radius: 22px !important;
          }

          .category-section h2,
          .expert-section h2,
          .price-section h2,
          .review-section h2 {
            font-size: 22px !important;
            margin-bottom: 12px !important;
          }

          .category-scroll,
          .expert-scroll,
          .price-scroll,
          .review-scroll {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 10px !important;
            padding: 2px 2px 10px !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .category-scroll > * {
            flex: 0 0 148px !important;
            min-height: 152px !important;
            padding: 14px !important;
            scroll-snap-align: start !important;
          }

          .category-scroll .h-16 {
            height: 48px !important;
            width: 48px !important;
            font-size: 26px !important;
            border-radius: 16px !important;
          }

          .category-scroll .text-lg {
            font-size: 15px !important;
          }

          .quick-start-section {
            display: grid !important;
            gap: 12px !important;
          }

          .quick-start-section > div,
          .quick-start-section > section {
            border-radius: 26px !important;
            padding: 18px !important;
          }

          .quick-start-section h2 {
            font-size: 24px !important;
          }

          .expert-scroll > * {
            flex: 0 0 180px !important;
            scroll-snap-align: start !important;
          }

          .price-scroll > * {
            flex: 0 0 250px !important;
            scroll-snap-align: start !important;
          }

          .review-scroll > * {
            flex: 0 0 260px !important;
            scroll-snap-align: start !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2b1908_0%,transparent_36%),radial-gradient(circle_at_bottom,#160d22_0%,transparent_38%)]" />

      {step !== "intro" && (
      <header className="sticky top-0 z-40 bg-black/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => setStep("home")}
            className="flex items-center text-left"
          >
            <BrandLogo compact />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-2xl border border-[#7a5b37] bg-[#14110d] px-4 py-2 text-xl text-white"
          >
            ☰
          </button>
        </div>
      </header>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="ml-auto h-full w-[82%] max-w-[360px] overflow-y-auto border-l border-[#7a5b37] bg-[#0d0b0a] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white">전체 메뉴</div>
                <div className="text-sm text-[#c8beb0]">
                  원하는 운세를 선택하세요
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-3xl text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goInput(item.id)}
                  className="flex w-full items-center gap-4 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4 text-left"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#7a5b37] bg-black/40 text-2xl">
                    {item.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block font-black text-[#d8a86f]">
                      {item.title}
                    </span>
                    <span className="text-sm text-[#c8beb0]">
                      {item.subtitle}
                    </span>
                    <span className="mt-1 block text-sm font-black text-white">
                      {item.price.toLocaleString()}원
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1120px] px-4 pb-24 pt-6">
        {step === "intro" && (
          <DohoonStoryHero onStart={() => setStep("home")} />
        )}

        {step === "home" && (
          <div className="home-compact space-y-10">
            <section className="home-hero relative overflow-hidden rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_78%_28%,rgba(216,168,111,0.26),transparent_38%),linear-gradient(135deg,#0a0908_0%,#110d09_44%,#201409_100%)] shadow-[0_42px_130px_rgba(0,0,0,0.56)]">
              <div className="absolute inset-0 opacity-14 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,207,119,0.65)_1px,transparent_0)] [background-size:32px_32px]" />

              <div className="relative grid gap-0 lg:grid-cols-[0.92fr_0.88fr]">
                <div className="z-10 flex flex-col justify-center p-6 py-10 md:p-8 lg:p-10 lg:py-12">
                  <div className="mb-9 max-w-[300px]">
                    <BrandLogo />
                  </div>

                  <h1 className="break-keep text-[42px] font-black leading-[1.08] tracking-[-0.085em] text-white md:text-[62px]">
                    무료에서 막힌 자리 보고,
                    <br />
                    <span className="text-[#e0b36d]">전체에서 복의 자리까지 연다</span>
                  </h1>

                  <p className="mt-6 break-keep text-lg font-medium leading-8 text-[#e8ded2] md:text-xl">
                    무료에서는 먼저 막힌 자리만 본다.
                    <br />
                    전체 리포트에서는 언제 풀리고, 어디서 새고,
                    <br />
                    무엇을 잡아야 하는지까지 딱 까서 본다.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {[
                      ["🎯", "무료 판정 먼저", "돈·일·사람·몸에서 먼저 막힌 자리"],
                      ["🔒", "완전 비밀 보장", "입력 정보는 저장하지 않아요"],
                      ["👑", "유료 전체 리포트", "시기·복·악운·도훈의 판정까지"],
                    ].map(([icon, title, desc]) => (
                      <div key={title} className="rounded-[22px] border border-[#7a5b37] bg-black/35 p-4">
                        <div className="text-2xl">{icon}</div>
                        <div className="mt-2 font-black text-white">{title}</div>
                        <div className="mt-1 break-keep text-xs leading-5 text-[#c8beb0]">{desc}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => goInput("today")}
                    className="mt-8 w-full max-w-xl rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f5c66d] to-[#b78343] px-8 py-5 text-xl font-black text-black shadow-[0_20px_65px_rgba(216,168,111,0.22)]"
                  >
                    무료로 막힌 자리 먼저 보기 〉
                  </button>

                  <div className="mt-3 max-w-xl text-center text-sm font-black text-[#d8a86f]">
                    결제 전 무료 판정 먼저 확인 가능
                  </div>
                </div>

                <div className="home-hero-image relative min-h-[460px] overflow-hidden bg-black lg:min-h-[560px]">
                  <SafeImage src="/characters/dohoon-hero.png" alt="운세형 도훈 메인 이미지" fallback="🧑‍💼" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,218,145,0.16),transparent_36%)]" />
                  <div className="absolute inset-y-0 left-0 hidden w-36 bg-gradient-to-r from-[rgba(5,5,5,0.38)] to-transparent lg:block" />
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[rgba(0,0,0,0.54)] to-transparent" />
                </div>
              </div>
            </section>


            <section className="rounded-[26px] border border-[#7a5b37] bg-[radial-gradient(circle_at_88%_18%,rgba(216,168,111,0.12),transparent_32%),linear-gradient(135deg,#10100f,#080706)] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.28)] md:rounded-[30px] md:p-6">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto mb-3 w-fit rounded-full border border-[#7a5b37] bg-black/40 px-4 py-1.5 text-[10px] font-black tracking-[0.18em] text-[#d8a86f] md:text-xs">
                  SOREUM DIFFERENCE
                </div>
                <h2 className="break-keep text-2xl font-black leading-tight tracking-[-0.055em] text-white md:text-3xl">
                  네 사주 안에<br className="md:hidden" /> 네 운을 막는 무언가가 숨어 있다
                </h2>

                <p className="mx-auto mt-4 max-w-xl break-keep text-base font-black leading-7 text-[#e0b36d] md:text-lg md:leading-8">
                  소름사주는 좋은 말부터 하지 않는다.
                </p>

                <div className="mx-auto mt-5 max-w-2xl space-y-4 break-keep text-sm font-medium leading-7 text-[#d8d0c6] md:text-base md:leading-8">
                  <p className="mx-auto max-w-xl rounded-[22px] border border-[#7a5b37] bg-black/36 p-4 text-center text-[#f4eadc] md:p-5">
                    그걸 모르고 살면
                    <br />
                    돈은 벌어도 안 모이고,
                    <br />
                    사람은 만나도 마음이 다치고,
                    <br />
                    일은 해도 내 몫이 늦고,
                    <br />
                    몸은 쉬어도 계속 무겁다.
                  </p>

                  <p className="text-base font-black leading-7 text-white md:text-lg md:leading-8">
                    먼저 네 운이 막힌 자리부터 본다.
                  </p>

                  <p>
                    복이 붙는 자리,
                    <br />
                    악운이 붙는 자리,
                    <br />
                    돈이 새는 구멍,
                    <br />
                    인연이 꼬이는 이유,
                    <br />
                    몸이 먼저 보내는 신호까지.
                  </p>

                  <p className="text-base font-black leading-7 text-[#e0b36d] md:text-lg md:leading-8">
                    도훈이 네 사주를 펼쳐놓고
                    <br />
                    사주에 보이는 대로
                    <br />
                    딱 까서 알려줄게.
                  </p>
                </div>
              </div>
            </section>

            <section className="trust-reasons">
              <h2 className="mb-6 text-center text-3xl font-black tracking-[-0.06em] text-white">
                소름사주가 선택받는 이유
              </h2>
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["🎯", "막힌 자리부터 판정", "좋은 말보다 지금 먼저 봐야 할 지점"],
                  ["💰", "돈이 새는 구멍 확인", "돈복이 있어도 왜 안 모이는지 분석"],
                  ["👥", "인연이 꼬이는 이유", "끌리는 사람과 피해야 할 사람 구분"],
                  ["👑", "전체 리포트", "복·악운·대운까지 길게 풀어주는 유료 풀이"],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="rounded-[28px] border border-[#7a5b37] bg-[#10100f] p-5 text-center shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                    <div className="text-4xl">{icon}</div>
                    <div className="mt-3 text-lg font-black text-[#e0b36d]">{title}</div>
                    <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="category-section">
              <h2 className="mb-6 text-center text-3xl font-black tracking-[-0.06em] text-white">
                사람들이 많이 보는 사주 카테고리
              </h2>
              <div className="category-scroll grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  getCategory("money"),
                  getCategory("career"),
                  getCategory("love"),
                  getCategory("compatibility"),
                  getCategory("monthly"),
                  getCategory("traditional"),
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goInput(item.id)}
                    className="group relative min-h-[190px] rounded-[28px] border border-[#7a5b37] bg-[#10100f] p-5 text-center transition hover:-translate-y-1 hover:border-[#e0b36d] hover:bg-[#17120c]"
                  >
                    {item.badge ? (
                      <div className="absolute right-3 top-3 rounded-full bg-[#f97316] px-2 py-1 text-[11px] font-black text-white">
                        {item.badge}
                      </div>
                    ) : null}
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-[#7a5b37] bg-[#1c1712] text-4xl">
                      {item.emoji}
                    </div>
                    <div className="mt-4 text-lg font-black text-[#e0b36d]">{item.title}</div>
                    <p className="mt-2 break-keep text-xs leading-5 text-[#c8beb0]">{item.hook || item.subtitle}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="quick-start-section grid gap-6 lg:grid-cols-[360px_1fr]">
              <div className="rounded-[34px] border border-[#7a5b37] bg-[#11100f] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                <h2 className="break-keep text-3xl font-black leading-tight tracking-[-0.06em] text-white">
                  생년월일을 넣으면
                  <br />
                  <span className="text-[#e0b36d]">막힌 자리부터 봅니다</span>
                </h2>

                <div className="mt-5 space-y-3">
                  <input
                    value={user.name}
                    onChange={(event) => setUser({ ...user, name: event.target.value })}
                    placeholder="이름"
                    className="w-full p-4"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input value={user.year} onChange={(event) => setUser({ ...user, year: event.target.value })} placeholder="년도" className="p-4 text-center" />
                    <input value={user.month} onChange={(event) => setUser({ ...user, month: event.target.value })} placeholder="월" className="p-4 text-center" />
                    <input value={user.day} onChange={(event) => setUser({ ...user, day: event.target.value })} placeholder="일" className="p-4 text-center" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["양력", "음력"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setUser({
                            ...user,
                            calendar: value,
                            lunarLeapMonth: value === "음력" ? user.lunarLeapMonth : false,
                          })
                        }
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.calendar === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white"
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  {user.calendar === "음력" && (
                    <button
                      type="button"
                      onClick={() =>
                        setUser({ ...user, lunarLeapMonth: !user.lunarLeapMonth })
                      }
                      className={cx(
                        "rounded-2xl border p-4 text-left text-sm font-black",
                        user.lunarLeapMonth
                          ? "border-[#d8a86f] bg-[#241e18] text-[#e0b36d]"
                          : "border-[#7a5b37] bg-[#14110d] text-white"
                      )}
                    >
                      {user.lunarLeapMonth ? "✓ " : ""}윤달 생일입니다
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#c8beb0]">
                        부모님이 윤달 생일이라고 알려준 경우에만 선택하세요.
                      </span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {(["남성", "여성"] as const).map((value) => (
                      <button key={value} type="button" onClick={() => setUser({ ...user, gender: value })} className={cx("rounded-2xl border p-4 font-black", user.gender === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-[#7a5b37] bg-[#14110d] text-white")}>{value}</button>
                    ))}
                  </div>

                  <MaritalStatusSelector user={user} onChange={setUser} compact />

                  <select value={user.birthTime} onChange={(event) => setUser({ ...user, birthTime: event.target.value })} className="w-full p-4">
                    {birthTimes.map((time) => <option key={time} value={time === "모름 / 선택 안 함" ? "" : time}>{time}</option>)}
                  </select>

                  <BlockedLuckSelector user={user} onChange={setUser} compact />

                  <button
                    type="button"
                    onClick={() => goInput("today")}
                    className="w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f5c66d] to-[#b78343] px-6 py-5 text-lg font-black text-black"
                  >
                    무료로 막힌 자리 먼저 보기 〉
                  </button>
                </div>
              </div>

              <div className="rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_80%_20%,rgba(216,168,111,0.16),transparent_36%),#11100f] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                <h2 className="text-3xl font-black tracking-[-0.06em] text-white">
                  무료에서 멈추면
                  <br />
                  <span className="text-[#e0b36d]">복이 붙는 자리와 악운이 붙는 자리를 놓칩니다</span>
                </h2>
                <p className="mt-5 break-keep text-base leading-8 text-[#d8d0c6]">
                  무료는 문만 열어줍니다. 전체 리포트에서는 돈이 언제 붙는지, 어떤 일에서 네 몫이 남는지, 어떤 사람은 피해야 하는지, 몸이 먼저 보내는 신호와 올해 조심할 달까지 이어서 봅니다.
                </p>
                <p className="mt-4 break-keep text-base font-black leading-8 text-white">
                  돈·일·사람·몸은 따로 노는 게 아닙니다.
                  <br />
                  한 군데가 막히면 다른 운도 같이 늦어집니다.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-5">
                  {["복이 붙는 자리", "돈이 새는 구멍", "피해야 할 인연", "몸이 보내는 신호", "올해 조심할 악운"].map((item) => (
                    <div key={item} className="rounded-2xl border border-[#7a5b37] bg-black/35 p-4 text-center text-sm font-black text-[#e0b36d]">
                      ✓
                      <br />
                      {item}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goInput("traditional")}
                  className="mt-6 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f5c66d] to-[#b78343] px-6 py-5 text-lg font-black text-black"
                >
                  평생종합사주로 전체판 보기 〉
                </button>
              </div>
            </section>

            <section className="expert-section">
              <h2 className="mb-6 text-center text-3xl font-black tracking-[-0.06em] text-white">
                전문가별로 골라보기
              </h2>
              <div className="expert-scroll grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {characters.map((card) => (
                  <CharacterCard key={card.id} card={card} onSelect={() => goInput(card.categoryId)} />
                ))}
              </div>
            </section>

            <section className="price-section">
              <h2 className="mb-6 text-center text-3xl font-black tracking-[-0.06em] text-white">
                전체 리포트 요금 안내
              </h2>
              <div className="price-scroll grid gap-5 lg:grid-cols-3">
                {[
                  { title: "오늘운세 전체 리포트", desc: "오늘운세·재물운·사랑·결혼운·악운", price: 1900, points: ["오늘 하루 흐름", "오늘 돈이 새는 자리", "오늘 조심할 악운"], id: "today" as CategoryId },
                  { title: "일반 사주 전체 리포트", desc: "재물운·일·사업운·사랑·결혼운 등", price: 6900, points: ["복이 붙는 자리", "악운이 붙는 자리", "피해야 할 선택"], id: "money" as CategoryId },
                  { title: "심화 사주 리포트", desc: "평생종합사주 · 내 고민 사주풀이", price: 14900, points: ["평생 반복되는 막힘", "돈·일·관계·건강 전체", "잡아야 할 대운과 악운", "내 고민은 19,900원 심화"], id: "traditional" as CategoryId },
                ].map((plan, index) => (
                  <button key={plan.title} type="button" onClick={() => goInput(plan.id)} className={cx("rounded-[30px] border p-6 text-left transition hover:-translate-y-1", index === 2 ? "border-[#f3cf7a] bg-[linear-gradient(135deg,#20150a,#3a280e)] shadow-[0_20px_60px_rgba(216,168,111,0.15)]" : "border-[#7a5b37] bg-[#10100f]")}>
                    <div className="text-lg font-black text-[#e0b36d]">{plan.title}</div>
                    <div className="mt-1 text-sm text-[#c8beb0]">{plan.desc}</div>
                    <div className="mt-5 text-4xl font-black text-white">{plan.price.toLocaleString()}<span className="text-lg">원</span></div>
                    <div className="mt-5 space-y-2 text-sm font-semibold text-[#e8ded2]">{plan.points.map((point) => <div key={point}>✓ {point}</div>)}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="review-section">
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.06em] text-white">소름사주 실제 후기</h2>
                  <div className="mt-2 text-sm text-[#e0b36d]">★★★★★ 4.8 · 후기 42개</div>
                </div>
                <div className="rounded-full border border-[#7a5b37] bg-black/35 px-3 py-2 text-xs font-black text-[#e0b36d]">{reviewPage}/14</div>
              </div>
              <div className="review-scroll grid gap-4 md:grid-cols-3">
                {visibleReviews.map((review) => (
                  <div key={`${review.name}-${review.category}-${review.text}`} className="rounded-[28px] border border-[#7a5b37] bg-[#10100f] p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-sm font-black text-[#d8a86f]">{review.name} · {review.category}</div>
                      <div className="text-xs text-[#e0b36d]">★★★★★</div>
                    </div>
                    <p className="m-0 break-keep text-sm leading-7 text-white">“{review.text}”</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {Array.from({ length: reviewPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} type="button" onClick={() => setReviewPage(page)} className={cx("grid h-9 w-9 place-items-center rounded-full border text-sm font-black", reviewPage === page ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-[#7a5b37] bg-black/35 text-[#c8beb0]")}>{page}</button>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === "input" && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setStep("home")}
              className="text-sm font-bold text-[#c8beb0]"
            >
              ← 홈으로
            </button>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-5">
              <div className="mb-5 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-3xl border border-[#7a5b37] bg-[#1b1612] text-3xl">
                  {category.emoji}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#d8a86f]">
                    {category.title}
                  </h1>
                  <p className="text-sm text-[#c8beb0]">{category.subtitle}</p>
                  <p className="mt-1 text-sm font-black text-white">
                    {category.price.toLocaleString()}원
                  </p>
                </div>
              </div>

              {categoryId === "monthly" ? (
                <div className="mb-5 rounded-3xl border border-[#7a5b37] bg-[#241e18] p-4">
                  <div className="text-sm font-black text-[#e0b36d]">
                    올해운세에서 보는 것
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-white">
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">돈복이 움직이는 달</div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">일·사업운이 강해지는 달</div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">사람관계가 흔들리는 달</div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">건강을 조심해야 할 달</div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#c8beb0]">
                    올해 돈복이 움직이는 달, 일·사업운이 강해지는 달, 사람관계가 흔들리는 달, 건강을 조심해야 할 달을 사주 포인트로 봅니다.
                  </p>
                </div>
              ) : null}

              <div className="mb-5 rounded-3xl border border-[#7a5b37] bg-[#1b1612] p-4">
                <div className="text-sm font-black text-[#d8a86f]">
                  이런 질문을 해볼 수 있어요
                </div>
                <div className="mt-3 space-y-2">
                  {questionExamples[categoryId].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setUser({ ...user, question: example })}
                      className="w-full rounded-2xl border border-[#7a5b37] bg-black/35 px-4 py-3 text-left text-sm font-semibold leading-5 text-[#f5efe6]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <FieldLabel>분석 메뉴</FieldLabel>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value as CategoryId)}
                className="mb-4 w-full p-4"
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · {item.price.toLocaleString()}원
                  </option>
                ))}
              </select>

              <FieldLabel>이름 또는 별명</FieldLabel>
              <input
                value={user.name}
                onChange={(event) => setUser({ ...user, name: event.target.value })}
                placeholder="예: 성국"
                className="mb-4 w-full p-4"
              />

              <FieldLabel>생년월일</FieldLabel>

              <div className="mb-3 rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4 text-sm leading-6 text-[#e0d6c8]">
                정확한 사주 계산을 위해 가능하면{" "}
                <span className="font-black text-[#d8a86f]">양력 생일</span>을
                입력해주세요.
                <br />
                음력 생일만 알고 있다면 음력으로 선택하면 자동으로 양력 기준으로 변환해서 풀이합니다.
                윤달 생일인 경우에만 윤달 체크를 선택해주세요.
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <input
                  value={user.year}
                  onChange={(event) => setUser({ ...user, year: event.target.value })}
                  placeholder="년도"
                  className="p-4 text-center"
                />
                <input
                  value={user.month}
                  onChange={(event) => setUser({ ...user, month: event.target.value })}
                  placeholder="월"
                  className="p-4 text-center"
                />
                <input
                  value={user.day}
                  onChange={(event) => setUser({ ...user, day: event.target.value })}
                  placeholder="일"
                  className="p-4 text-center"
                />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["양력", "음력"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setUser({
                        ...user,
                        calendar: value,
                        lunarLeapMonth: value === "음력" ? user.lunarLeapMonth : false,
                      })
                    }
                    className={cx(
                      "rounded-2xl border p-4 font-black",
                      user.calendar === value
                        ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                        : "border-[#7a5b37] bg-[#14110d] text-white"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {user.calendar === "음력" && (
                <button
                  type="button"
                  onClick={() =>
                    setUser({ ...user, lunarLeapMonth: !user.lunarLeapMonth })
                  }
                  className={cx(
                    "mb-4 w-full rounded-2xl border p-4 text-left text-sm font-black",
                    user.lunarLeapMonth
                      ? "border-[#d8a86f] bg-[#241e18] text-[#e0b36d]"
                      : "border-[#7a5b37] bg-[#14110d] text-white"
                  )}
                >
                  {user.lunarLeapMonth ? "✓ " : ""}윤달 생일입니다
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#c8beb0]">
                    부모님이 “윤달 생일”이라고 알려준 경우에만 선택하세요. 대부분은 평달이라 선택하지 않아도 됩니다.
                  </span>
                </button>
              )}

              <FieldLabel>출생 시간</FieldLabel>
              <select
                value={user.birthTime}
                onChange={(event) =>
                  setUser({ ...user, birthTime: event.target.value })
                }
                className="mb-4 w-full p-4"
              >
                {birthTimes.map((time) => (
                  <option key={time} value={time === "모름 / 선택 안 함" ? "" : time}>
                    {time}
                  </option>
                ))}
              </select>

              <FieldLabel>성별</FieldLabel>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["남성", "여성"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUser({ ...user, gender: value })}
                    className={cx(
                      "rounded-2xl border p-4 font-black",
                      user.gender === value
                        ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                        : "border-[#7a5b37] bg-[#14110d] text-white"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <MaritalStatusSelector user={user} onChange={setUser} />

              <BlockedLuckSelector user={user} onChange={setUser} />


              {categoryId === "compatibility" && (
                <div className="mb-4 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4">
                  <div className="mb-3 font-black text-[#d8a86f]">
                    궁합 종류 선택
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["연인/배우자 궁합", "사업파트너 궁합"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUser({ ...user, compatibilityType: value })}
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.compatibilityType === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white"
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 break-keep text-xs leading-5 text-[#c8beb0]">
                    연인/배우자 궁합은 결혼까지 갈 수 있는 궁합인지 보고, 사업파트너 궁합은 같이 돈을 벌 수 있는 구조인지 봅니다.
                  </p>
                </div>
              )}

              {showPartnerFields && (
                <div className="mb-4 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4">
                  <div className="mb-3 font-black text-[#d8a86f]">
                    상대방 정보
                  </div>

                  <input
                    value={user.partnerName}
                    onChange={(event) =>
                      setUser({ ...user, partnerName: event.target.value })
                    }
                    placeholder="상대방 이름 또는 별명"
                    className="mb-3 w-full p-4"
                  />

                  <div className="mb-3 rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4 text-sm leading-6 text-[#e0d6c8]">
                    상대방 정보도 가능하면{" "}
                    <span className="font-black text-[#d8a86f]">양력 생일</span>로
                    입력해주세요.
                    <br />
                    음력만 알고 있다면 음력으로 선택하면 자동으로 양력 기준으로 변환해서 궁합을 봅니다.
                    윤달 생일인 경우에만 윤달 체크를 선택해주세요.
                  </div>

                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <input
                      value={user.partnerYear}
                      onChange={(event) =>
                        setUser({ ...user, partnerYear: event.target.value })
                      }
                      placeholder="년도"
                      className="p-4 text-center"
                    />
                    <input
                      value={user.partnerMonth}
                      onChange={(event) =>
                        setUser({ ...user, partnerMonth: event.target.value })
                      }
                      placeholder="월"
                      className="p-4 text-center"
                    />
                    <input
                      value={user.partnerDay}
                      onChange={(event) =>
                        setUser({ ...user, partnerDay: event.target.value })
                      }
                      placeholder="일"
                      className="p-4 text-center"
                    />
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {(["양력", "음력"] as const).map((value) => (
                      <button
                        key={`partner-${value}`}
                        type="button"
                        onClick={() =>
                          setUser({
                            ...user,
                            partnerCalendar: value,
                            partnerLunarLeapMonth:
                              value === "음력" ? user.partnerLunarLeapMonth : false,
                          })
                        }
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.partnerCalendar === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white"
                        )}
                      >
                        상대 {value}
                      </button>
                    ))}
                  </div>

                  {user.partnerCalendar === "음력" && (
                    <button
                      type="button"
                      onClick={() =>
                        setUser({
                          ...user,
                          partnerLunarLeapMonth: !user.partnerLunarLeapMonth,
                        })
                      }
                      className={cx(
                        "mb-3 w-full rounded-2xl border p-4 text-left text-sm font-black",
                        user.partnerLunarLeapMonth
                          ? "border-[#d8a86f] bg-[#241e18] text-[#e0b36d]"
                          : "border-[#7a5b37] bg-[#14110d] text-white"
                      )}
                    >
                      {user.partnerLunarLeapMonth ? "✓ " : ""}상대가 윤달 생일입니다
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#c8beb0]">
                        상대 생일이 음력 윤달이라고 들은 경우에만 선택하세요.
                      </span>
                    </button>
                  )}

                  <FieldLabel>상대방 출생 시간</FieldLabel>
                  <select
                    value={user.partnerBirthTime}
                    onChange={(event) =>
                      setUser({ ...user, partnerBirthTime: event.target.value })
                    }
                    className="mb-3 w-full p-4"
                  >
                    {birthTimes.map((time) => (
                      <option
                        key={`partner-${time}`}
                        value={time === "모름 / 선택 안 함" ? "" : time}
                      >
                        {time}
                      </option>
                    ))}
                  </select>

                  <FieldLabel>상대방 성별</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(["남성", "여성"] as const).map((value) => (
                      <button
                        key={`partner-gender-${value}`}
                        type="button"
                        onClick={() =>
                          setUser({ ...user, partnerGender: value })
                        }
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.partnerGender === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white"
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showQuestion && (
                <div className="mb-4">
                  <FieldLabel>상담 질문</FieldLabel>
                  <textarea
                    value={user.question}
                    onChange={(event) =>
                      setUser({ ...user, question: event.target.value })
                    }
                    placeholder="예: 지금 가장 답답한 문제를 적어주세요."
                    className="min-h-32 w-full p-4"
                  />
                </div>
              )}

              <PrivacyBox />

              <button
                type="button"
                onClick={() => {
                  if (!privacyAgreed) {
                    alert("개인정보 수집·이용에 동의해야 진행할 수 있습니다.");
                    return;
                  }

                  setPaid(false);
                  setAiLoading(true);
                  setAiPreview("");
                  setAiFull("");
                  setStep("result");

                  setTimeout(() => generateAIResult(), 100);
                }}
                disabled={aiLoading || !privacyAgreed}
                className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-6 py-5 text-lg font-black text-white disabled:opacity-60"
              >
                {aiLoading
                  ? "운세형이 읽는 중..."
                  : privacyAgreed
                  ? "무료 결과 먼저 보기"
                  : "개인정보 동의 후 진행"}
              </button>
            </section>
          </div>
        )}

        {step === "result" && (
          <div className="mx-auto max-w-[760px] space-y-5">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="text-sm font-bold text-[#c8beb0]"
            >
              ← 다시 입력하기
            </button>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-5">
              <div className="mb-4 rounded-full border border-[#7a5b37] bg-[#241e18] px-4 py-2 text-xs font-black text-[#e0b36d]">
                무료 분석 결과
              </div>

              <h1 className="text-3xl font-black leading-tight text-white">
                {nameOf(user)}의{" "}
                <span className="text-[#d8a86f]">{category.title}</span> 리포트
              </h1>

              <p className="mt-2 whitespace-pre-line text-sm text-[#c8beb0]">
                {birthMeta}
              </p>

              {aiLoading ? (
                <div className="mt-5 rounded-3xl border border-[#7a5b37] bg-[#1b1612] p-5">
                  <div className="text-lg font-black text-[#d8a86f]">
                    도훈이 네 사주를 펼쳐보고 있습니다
                  </div>
                  <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                    무료에서는 지금 네 운에서 먼저 봐야 할 막힌 자리와 핵심 흐름을 먼저 봅니다.
                  </p>
                </div>
              ) : (
                <>
                  <ResultReport
                    text={
                      aiPreview ||
                      "[API 응답 없음] 운세 결과를 불러오지 못했습니다."
                    }
                  />
                  <ResultActionButtons />
                </>
              )}

              {!paid && !aiLoading && (
                <div className="mt-6 rounded-[28px] border border-[#7a5b37] bg-[#1b1612] p-5">
                  <div className="mb-3 rounded-full border border-[#7a5b37] bg-black/35 px-4 py-2 text-[11px] font-black tracking-[0.18em] text-[#d8a86f]">
                    전체 리포트에서 열리는 다음 판정
                  </div>

                  <div className="mb-3 break-keep text-2xl font-black leading-tight text-[#d8a86f]">
                    {paidHook.title}
                  </div>

                  <p className="break-keep text-sm leading-7 text-[#c8beb0]">
                    {paidHook.body}
                  </p>

                  <p className="mt-3 break-keep rounded-2xl border border-[#7a5b37] bg-black/35 p-4 text-sm font-black leading-7 text-white">
                    {paidHook.warning}
                  </p>

                  <div className="mt-4 rounded-2xl border border-[#7a5b37] bg-black/45 p-4">
                    <div className="mb-2 text-sm font-black text-[#f5efe6]">
                      전체 리포트에서 이어지는 내용
                    </div>

                    <div className="mt-3 grid gap-2 text-sm font-semibold text-white sm:grid-cols-2">
                      {paidHook.points.map((item) => (
                        <div key={item} className="rounded-xl border border-[#7a5b37] bg-[#14110d] px-3 py-2">✓ {item}</div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#7a5b37] bg-black/30 p-4 text-xs leading-6 text-[#c8beb0]">
                    서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 즉시 디지털 리포트가 생성됩니다.
                    <br />
                    교환/환불 규정: 디지털 콘텐츠 특성상 리포트 생성이 시작되었거나 결과 열람이 가능한 경우 단순 변심 환불은 제한될 수 있습니다.
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      requestKcpPayment(`${category.title} 전체 리포트`, category.price)
                    }
                    className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-5 py-4 text-base font-black text-white"
                  >
                    {paidHook.buttonText} {category.price.toLocaleString()}원
                  </button>

                  {isLocalTest && (
                    <button
                      type="button"
                      onClick={openFullReportForTest}
                      disabled={fullLoading}
                      className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 text-sm font-black text-black disabled:opacity-60"
                    >
                      {fullLoading
                        ? "테스트 전체 리포트 생성 중..."
                        : "로컬 테스트용 전체 리포트 바로 보기"}
                    </button>
                  )}
                </div>
              )}
            </section>

            {paid && (
              <section className="space-y-4">
                <article className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
                  <div className="mb-3 rounded-full border border-[#7a5b37] bg-[#241e18] px-4 py-2 text-center text-xs font-black text-[#e0b36d]">
                    전체 리포트 오픈
                  </div>

                  <h2 className="mb-3 text-xl font-black text-[#d8a86f]">
                    도훈의 전체 맞춤 리포트
                  </h2>

                  {fullLoading && !aiFull ? (
                    <div className="rounded-3xl border border-[#7a5b37] bg-[#1b1612] p-5">
                      <div className="text-lg font-black text-[#d8a86f]">
                        도훈이 전체 리포트를 깊게 풀고 있습니다
                      </div>
                      <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                        무료 판정에서 멈춘 흐름을 이어서, 시기·복·악운·현실 조언까지 깊게 풀고 있습니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ResultReport
                        text={
                          aiFull ||
                          "[API 응답 없음] 전체 리포트를 불러오지 못했습니다."
                        }
                        paid
                      />
                      <ResultActionButtons />
                    </>
                  )}
                </article>

                <button
                  type="button"
                  onClick={() => setStep("consult")}
                  className="w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 font-black text-black"
                >
                  1:1로 더 깊게 물어보기
                </button>
              </section>
            )}
          </div>
        )}

        {step === "consult" && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setStep("home")}
              className="text-sm font-bold text-[#c8beb0]"
            >
              ← 홈으로
            </button>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-6">
              <h1 className="text-3xl font-black leading-tight text-white">
                혼자 오래 붙잡은 문제,
                <br />
                <span className="text-[#d8a86f]">도훈이 막힌 자리부터 본다</span>
              </h1>
              <p className="mt-4 text-base leading-7 text-[#c8beb0]">
                질문 뒤에 숨어 있는 반복 흐름을 보고, 해도 되는지 멈춰야 하는지 사주 근거로 풀어주는 상담형 리포트입니다.
              </p>
            </section>

            <section className="space-y-3">
              {consultPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cx(
                    "w-full rounded-[28px] border p-5 text-left",
                    selectedPlan === plan.id
                      ? "border-[#d8a86f] bg-[#241e18]"
                      : "border-[#7a5b37] bg-[#111111]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-[#d8a86f]">
                        {plan.title}
                      </div>
                      <div className="mt-1 text-sm leading-5 text-[#c8beb0]">
                        {plan.desc}
                      </div>
                    </div>
                    <div className="text-lg font-black text-[#e0b36d]">
                      {plan.price.toLocaleString()}원
                    </div>
                  </div>
                </button>
              ))}
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-xl font-black text-[#d8a86f]">
                상담 질문 작성
              </h2>

              <textarea
                value={consultQuestion}
                onChange={(event) => setConsultQuestion(event.target.value)}
                placeholder="지금 가장 답답한 고민을 적어주세요."
                className="mt-4 min-h-36 w-full p-4"
              />

              <div className="mt-4">
                <PrivacyBox />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!privacyAgreed) {
                    alert("개인정보 수집·이용에 동의해야 상담을 진행할 수 있습니다.");
                    return;
                  }

                  setTimeout(() => generateConsultAI(), 100);
                }}
                disabled={!privacyAgreed || aiLoading}
                className="mt-5 w-full rounded-full border border-[#d8a86f] bg-[#d8a86f] px-6 py-5 text-lg font-black text-black disabled:opacity-60"
              >
                {aiLoading ? "상담 생성 중..." : "상담 결과 미리보기"}
              </button>

              {consultAiResult && (
                <article className="mt-5 rounded-[26px] border border-[#7a5b37] bg-black/45 p-5">
                  <h3 className="text-lg font-black text-[#d8a86f]">
                    상담 미리보기
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-white">
                    {consultAiResult}
                  </p>
                </article>
              )}

              {isLocalTest && (
                <button
                  type="button"
                  onClick={() =>
                    requestKcpPayment(selectedPlanInfo.title, selectedPlanInfo.price)
                  }
                  className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-6 py-4 text-sm font-black text-black"
                >
                  로컬 테스트용 KCP 결제창
                </button>
              )}
            </section>
          </div>
        )}

        {step === "home" ? (
          <footer className="mt-10 rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5 text-[#c8beb0]">
            <div className="mb-4">
              <div className="text-xl font-black text-[#d8a86f]">
                소름사주 안내
              </div>
              <p className="mt-2 break-keep text-xs leading-5 text-[#c8beb0]">
                소름사주는 입력한 생년월일, 출생시간, 성별, 상담 카테고리를 바탕으로 AI가 생성하는 사주·운세 디지털 리포트 서비스입니다.
              </p>
            </div>

            <div className="mb-4 rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4">
              <div className="text-sm font-black text-[#e0b36d]">
                제공하지 않는 서비스
              </div>
              <p className="mt-3 break-keep text-xs leading-6 text-[#d8d0c6]">
                소름사주는 사주·운세 기반의 디지털 콘텐츠를 제공하며, 아래 서비스는 제공하지 않습니다.
              </p>
              <ul className="mt-3 space-y-1 text-xs leading-6 text-[#d8d0c6]">
                <li>- 의료 진단, 질병 예측, 치료 지시</li>
                <li>- 투자 종목 추천, 수익 보장, 손실 보전</li>
                <li>- 법률 자문, 소송·계약 판단 대행</li>
                <li>- 심리치료, 정신건강 진단, 상담 치료</li>
                <li>- 종교·무속 행위, 굿, 부적, 기도 대행</li>
                <li>- 결혼·임신·합격·취업·재회 확정 보장</li>
              </ul>
            </div>

            <div className="space-y-3">
              <details className="rounded-2xl border border-[#7a5b37] bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-[#e0b36d]">
                  이용약관
                </summary>
                <p className="mt-4 text-xs leading-6 text-[#d8d0c6]">
                  본 서비스는 오락·참고용 콘텐츠이며 의학, 법률, 투자, 심리치료, 종교·무속 행위를 대체하지 않습니다. 중요한 결정은 현실 상황과 함께 판단해 주세요.
                </p>
                <p className="mt-3 text-xs leading-6 text-[#d8d0c6]">
                  서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 즉시 디지털 리포트가 생성됩니다.
                </p>
              </details>

              <details className="rounded-2xl border border-[#7a5b37] bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-[#e0b36d]">
                  개인정보처리방침
                </summary>
                <p className="mt-4 text-xs leading-6 text-[#d8d0c6]">
                  리포트 생성을 위해 이름 또는 별명, 생년월일, 출생시간, 성별, 선택 카테고리, 상담 질문을 수집·이용합니다.
                </p>
                <p className="mt-2 rounded-xl border border-[#7a5b37] bg-[#11100f] p-3 text-xs leading-6">
                  개인정보 보호책임자: 이성국
                  <br />
                  이메일: kkokku0@naver.com
                  <br />
                  대표전화번호: 010-5355-5146
                </p>
              </details>

              <details className="rounded-2xl border border-[#7a5b37] bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-[#e0b36d]">
                  환불 및 취소 규정
                </summary>
                <p className="mt-4 text-xs leading-6 text-[#d8d0c6]">
                  유료 리포트는 결제 후 입력 정보를 바탕으로 생성되는 디지털 콘텐츠입니다.
                </p>
                <p className="mt-3 text-xs leading-6 text-[#d8d0c6]">
                  교환/환불 규정: 디지털 콘텐츠 특성상 리포트 생성이 시작되었거나 결과 열람이 가능한 경우 단순 변심 환불은 제한될 수 있습니다.
                </p>
                <p className="mt-3 text-xs leading-6 text-[#d8d0c6]">
                  단, 결제 오류, 시스템 오류, 중복 결제 등 회사 귀책 사유가 확인되는 경우에는 고객문의 접수 후 확인 절차를 거쳐 환불이 가능합니다.
                </p>
              </details>
            </div>

            <div className="mt-5 border-t border-[#7a5b37] pt-4 text-[11px] leading-5 text-[#9d9388]">
              <div className="mb-2 text-sm font-black text-[#e0b36d]">회사정보</div>
              <p>상호명: 비앤케이 컴퍼니</p>
              <p>대표자: 이성국</p>
              <p>사업자등록번호: 519-03-02347</p>
              <p>사업장주소: 경북 구미시 백산로 4길 40, 이림스칼렛 201호</p>
              <p>대표전화번호: 010-5355-5146</p>
              <p>이메일: kkokku0@naver.com</p>
              <p>통신판매업신고번호: 2024-경북구미-0959</p>
              <p className="mt-2">© 소름사주. All rights reserved.</p>
            </div>
          </footer>
        ) : null}
      </main>
    </div>
  );
}
