// SOREUM PAGE THEATER KEEP + DUPLICATE REPORT REMOVED V2
"use client";

// PAGE_RELATIONSHIP_MODELS_V1 - 3D scores + relationship model image matching connected.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  makeRelationshipSeed,
  pickDistinctRelationshipModel,
  pickRelationshipModel,
  type RelationshipModel,
  type RelationshipVisualProfile,
} from "./lib/relationshipModels";

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: Record<string, unknown>) => Promise<any>;
    };
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

  // 내 고민 상담 접수 정보
  worryType: string;
  worrySituation: string;
  currentRegion: string;
  candidateRegions: string;
  worryReason: string;
  currentWork: string;
  moneySituation: string;
  relationshipInfo: string;
  healthConcern: string;
  desiredVerdict: string;

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

type ScoreMetric = {
  key: string;
  label: string;
  score: number;
  verdict: string;
  description: string;
};

type ImageVisualTags = {
  gender: "male" | "female";
  mood:
    | "clean"
    | "sexy"
    | "innocent"
    | "confident"
    | "warm"
    | "cold"
    | "professional"
    | "active";
  outfit: "shirt" | "knit" | "dress" | "casual" | "office" | "sports";
  pose: "standing" | "chair" | "stool" | "desk" | "stairs" | "wall";
};

type LoveMarriageScoreVisual = {
  kind: "loveMarriage";
  version: string;
  love: {
    overall: number;
    grade: string;
    verdict: string;
    metrics: ScoreMetric[];
  };
  marriage: {
    overall: number;
    grade: string;
    verdict: string;
    metrics: ScoreMetric[];
  };
  visualProfiles: {
    user: ImageVisualTags;
    idealPartner: ImageVisualTags;
    userTitle: string;
    userDescription: string;
    partnerTitle: string;
    partnerDescription: string;
  };
};

type CompatibilityScoreVisual = {
  kind: "compatibility";
  version: string;
  overall: {
    score: number;
    grade: string;
    verdict: string;
    summary: string;
  };
  headlineScores: {
    love: number;
    marriage: number;
    intimacy: number | null;
  };
  attraction: {
    userToPartner: number;
    partnerToUser: number;
    mutual: number;
    verdict: string;
  };
  relationshipMetrics: ScoreMetric[];
  intimacyMetrics: ScoreMetric[];
  visualProfiles: {
    user: ImageVisualTags;
    partner: ImageVisualTags;
    userTitle: string;
    userDescription: string;
    partnerTitle: string;
    partnerDescription: string;
  };
};

type RelationshipScoreVisual =
  | LoveMarriageScoreVisual
  | CompatibilityScoreVisual
  | null;

type WealthScoreSet = {
  earning: number;
  saving: number;
  growing: number;
  keeping: number;
};

type WealthBlocker = {
  type: string;
  score: number;
  description: string;
};

type WealthWindow = {
  age: string;
  startAge: number;
  endAge: number;
  meaning: string;
};

type WealthProfile = {
  version: string;
  capacity: {
    grade: string;
    range: string;
    headline: string;
  };
  utilization: number;
  scores: WealthScoreSet;
  moneyStyle: {
    primary: string;
    secondary: string;
    score: number;
    description: string;
  };
  blockers: WealthBlocker[];
  primaryBlocker: WealthBlocker;
  windows: {
    first: WealthWindow;
    expansion: WealthWindow;
    peak: WealthWindow;
    risk: WealthWindow;
    consolidation: WealthWindow;
  };
  peakRange: string;
  continuityNote: string;
};

type PreviewScoreItem = {
  key: string;
  label: string;
  score: number;
  verdict: string;
  description?: string;
};

type CareerFreeComicScene = {
  id: string;
  order: number;
  sceneKey: string;
  dohoonImageKey?: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  protagonistGender: "male" | "female";
  cast: "protagonist" | "dohoon" | "both";
  mood: "tense" | "reveal" | "warning" | "hope" | "mystery" | "gold";
  shot: "wide" | "medium" | "closeup" | "back" | "split";
  dialogue?: string;
  narration?: string;
  emphasis?: string;
  leftLabel?: string;
  leftValue?: string;
  rightLabel?: string;
  rightValue?: string;
  bullets?: string[];
  locked?: boolean;
};

type CategoryPreviewProfile =
  | {
      kind: "today";
      version: string;
      overallScore: number;
      verdict: string;
      moneyScore: number;
      workScore: number;
      relationshipScore: number;
      healthScore: number;
      bestTime: string;
      strongestArea: string;
      warningArea: string;
      doOne: string;
      avoidOne: string;
      paidHookTitle?: string;
      paidHookBody?: string;
      paidHookQuote?: string;
      paidLockedItems?: Array<{ title: string; teaser: string }>;
      paidFinalHook?: string;
      paidCtaLabel?: string;
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "career";
      version: string;
      split: { office: number; own: number };
      primary: string;
      secondary: string;
      verdict: string;
      scores: PreviewScoreItem[];
      moneyRole: string;
      strongestSkill: string;
      avoidWork: string;
      transitionWindow: string;
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "love";
      version: string;
      loveScore: number;
      marriageScore: number;
      headline: string;
      attractionPoint: string;
      partnerTitle: string;
      partnerDescription: string;
      avoidPartner: string;
      relationshipRisk: string;
      strongWindow: string;
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "health";
      version: string;
      grade: string;
      overallScore: number;
      metrics: PreviewScoreItem[];
      primaryWeakness: string;
      firstSignal: string;
      avoidHabit: string;
      recoveryAction: string;
      cautionWindow: string;
      medicalNotice: string;
      healthStory?: any;
      healthPaidReportSource?: "ai-full" | "fallback";
      healthPaidReport?: {
        reportFormat: "part-report";
        opening: {
          grade: string;
          verdict: string;
          summary: string;
          weakAxis: string;
          cautionStyle: string;
          yearCaution: string;
        };
        part1: {
          title: string;
          weakPlaceTitle: string;
          weakPlaceBody: string;
          balance: Array<{ key: string; label: string; score: number; level: string }>;
          firstBreakTitle: string;
          firstBreakBody: string;
          breakSequence: string[];
          keyInsight: string;
        };
        part2: {
          title: string;
          intro: string;
          signals: Array<{ level: number; title: string; body: string }>;
          dangerPattern: string[];
          keyWarning: string;
        };
        part3: {
          title: string;
          lifetimeCrises: Array<{ order: number; age: string; body: string }>;
          currentAge: number;
          nextCrisis: string;
          nextCrisisBody: string;
          year: number;
          cautionMonths: Array<{ month: number; label: string; body: string }>;
          timelineInsight: string;
        };
        part4: {
          title: string;
          harmfulHabits: string[];
          helpfulHabits: string[];
          keyInsight: string;
          body: string;
        };
        part5: {
          title: string;
          food: { verdict: string; recommended: string[]; reduce: string[]; body: string };
          rhythm: { verdict: string; actions: string[]; body: string };
          exercise: { verdict: string; items: Array<{ label: string; stars: number }>; body: string };
        };
        final: {
          title: string;
          verdict: string;
          body: string;
          whyThisVerdict: string;
          strongestHealthPattern: string;
          biggestRiskPattern: string;
          nextTurningPoint: string;
          thisYearFocus: string;
          actionPriority: string;
          longTermAdvice: string;
          closingMessage: string;
          remember: Array<{ label: string; value: string }>;
          medicalNotice: string;
        };
      };
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "compatibility";
      version: string;
      overallScore: number;
      grade: string;
      verdict: string;
      loveScore: number;
      marriageScore: number;
      intimacyScore: number | null;
      mutualAttraction: number;
      strongestMetric: PreviewScoreItem;
      weakestMetric: PreviewScoreItem;
      conflictPoint: string;
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "year";
      version: string;
      year: number;
      overallScore: number;
      theme: string;
      headline: string;
      bestMonth: number | string;
      moneyMonth: number | string;
      careerMonth: number | string;
      relationshipWarningMonth: number | string;
      healthWarningMonth: number | string;
      moneyScore?: number;
      careerScore?: number;
      businessScore?: number;
      loveScore?: number;
      marriageScore?: number;
      relationshipScore?: number;
      healthScore?: number;
      strongestArea?: string;
      weakestArea?: string;
      cautionMonth?: string;
      moneyLeakMonth?: string;
      relationshipMonth?: string;
      action: string;
      avoid: string;
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "lifeFlow";
      version: string;
      chanceCount: number;
      headline: string;
      curve: PreviewScoreItem[];
      firstRise: string;
      biggestWindow: string;
      cautionWindow: string;
      lateLife: string;
      freeVerdict?: string;
      firstRiseText?: string;
      biggestWindowText?: string;
      cautionWindowText?: string;
      lateLifeText?: string;
      dohoonHook?: string;
      lockedItems?: string[];
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "lifetime";
      version: string;
      headline: string;
      metrics: PreviewScoreItem[];
      strongestBlessing: PreviewScoreItem;
      weakestHole: PreviewScoreItem;
      turningWindow: string;
      coreAdvice: string;
      webtoonScenes?: CareerFreeComicScene[];
    }
  | {
      kind: "worry";
      version: string;
      verdict: "밀어라" | "기다려라" | "멈춰라" | "조건부 진행";
      headline: string;
      reasons: string[];
      avoidNow: string;
      doNow: string;
      webtoonScenes?: CareerFreeComicScene[];
    };

type ComicChapter = {
  sceneType?: string;
  speaker?: string;
  emotion?: string;
  title?: string;
  text?: string;
  character?: string;
  mood?: string;
  background?: string;
  visualHint?: string;
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

  worryType: "",
  worrySituation: "",
  currentRegion: "",
  candidateRegions: "",
  worryReason: "",
  currentWork: "",
  moneySituation: "",
  relationshipInfo: "",
  healthConcern: "",
  desiredVerdict: "",

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
    title: "연애운·결혼운",
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
    title: "내 고민 상담",
    subtitle: "질문 하나에 붙은 운의 흐름을 깊게 상담",
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
    role: "연애운·결혼운·궁합운",
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
    category: "연애운·결혼운",
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
    category: "내 고민 상담",
    text: "그냥 위로가 아니라 지금 하지 말아야 할 선택을 짚어줘서 좋았어요.",
  },
  {
    name: "동xx",
    category: "재물운",
    text: "돈이 들어오는 방식과 돈이 새는 구조를 나눠줘서 현실적이었어요.",
  },
  {
    name: "서xx",
    category: "연애운·결혼운",
    text: "처음엔 설레는데 오래 가면 힘든 사람 유형이 너무 정확했어요.",
  },
  {
    name: "강xx",
    category: "일·사업운",
    text: "맞는 일 구조와 피해야 할 일 구조가 나와서 방향이 잡혔어요.",
  },
  {
    name: "현xx",
    category: "연애운·결혼운",
    text: "연애운·결혼운을 막연하게 말하지 않고 생활 기준을 알려줘서 좋았어요.",
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
    category: "내 고민 상담",
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
    category: "연애운·결혼운",
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
    category: "내 고민 상담",
    text: "막연한 답이 아니라 지금 정리해야 할 기준을 말해줘서 좋았어요.",
  },
  {
    name: "규xx",
    category: "재물운",
    text: "돈복 등급을 먼저 보고 나니까 왜 돈이 안 남는지도 이해됐어요.",
  },
  {
    name: "미xx",
    category: "연애운·결혼운",
    text: "배우자 유형과 피해야 할 상대를 나눠줘서 기준이 생겼어요.",
  },
  {
    name: "찬xx",
    category: "일·사업운",
    text: "직업 결과가 볼 때마다 바뀌지 않아서 좋았어요.",
  },
  {
    name: "아xx",
    category: "내 고민 상담",
    text: "제가 물어본 고민을 중심으로 답이 나와서 일반 운세랑 달랐어요.",
  },
  {
    name: "혁xx",
    category: "오늘운세",
    text: "오늘 돈 새는 지출 조심하라는 말이 바로 써먹을 수 있었어요.",
  },
  {
    name: "연xx",
    category: "연애운·결혼운",
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
    category: "내 고민 상담",
    text: "혼자 생각하던 고민이 왜 반복되는지 정리됐어요.",
  },
  {
    name: "유xx",
    category: "연애운·결혼운",
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
    title: "내 고민 상담",
    price: 19900,
    desc: "질문 1개 · 사주 흐름으로 깊게 상담",
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
    "제 사주에서 연애운과 결혼운은 어떤 흐름인가요?",
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
    "재물운, 일·사업운, 연애운·결혼운, 건강운, 자식 흐름까지 종합적으로 봐주세요.",
  ],
  premium: [
    "친구가 죽었는데 상가집을 가야 할지 말아야 할지 봐주세요.",
    "지금 이 선택을 해도 되는지, 멈춰야 하는지 딱 잘라 말해주세요.",
    "사람·돈·일이 얽힌 고민인데 무엇을 먼저 봐야 하는지 알려주세요.",
  ],
};


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

const worryTypeOptions = [
  "사람·관계",
  "돈·거래",
  "일·사업",
  "이사·거주",
  "가족",
  "건강·몸",
  "경조사·예의",
  "선택·결정",
  "기타",
];

function getWorryIntakeMissingLabels(user: UserInfo) {
  const missing: string[] = [];
  const hasText = (value?: string, min = 1) => normalizeWorryLine(value).length >= min;

  // v159: 한 줄 질문만으로 바로 유료를 열지 않는다.
  // AI가 상황별 추가 질문을 5~7개 던지고, 최소 4개 이상 답해야 15,000자급 풀이 재료가 생긴다.
  if (!hasText(user.question, 6)) missing.push("한 줄 상담 질문");

  const followupAnswerCount = String(user.worrySituation || "")
    .split("\n")
    .filter((line) => line.trim().startsWith("-") && line.includes(":"))
    .length;
  if (followupAnswerCount < 4) missing.push("AI 추가 질문 답변 4개 이상");

  return missing;
}
function isWorryIntakeReady(user: UserInfo) {
  return getWorryIntakeMissingLabels(user).length === 0;
}

function normalizeWorryLine(value?: string) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function resetWorryFieldsForType(user: UserInfo, nextType: string): UserInfo {
  return {
    ...user,
    worryType: nextType,
    currentRegion: "",
    candidateRegions: "",
    currentWork: "",
    moneySituation: "",
    relationshipInfo: "",
    healthConcern: "",
  };
}
function getPremiumWorryPayload(source: UserInfo) {
  const payload: Record<string, string> = {
    worryType: normalizeWorryLine(source.worryType),
    question: normalizeWorryLine(source.question),
    situation: normalizeWorryLine(source.worrySituation),
    reason: normalizeWorryLine(source.worryReason),
    desiredVerdict: normalizeWorryLine(source.desiredVerdict),
  };

  const add = (key: string, value?: string) => {
    const text = normalizeWorryLine(value);
    if (text) payload[key] = text;
  };

  // 내 고민 상담은 특정 유형별로 필드를 자르지 않는다.
  // 사용자가 직접 적은 세부정보만 모두 모아서 AI에 보낸다.
  add("currentRegion", source.currentRegion);
  add("candidateRegions", source.candidateRegions);
  add("currentWork", source.currentWork);
  add("moneySituation", source.moneySituation);
  add("relationshipInfo", source.relationshipInfo);
  add("healthConcern", source.healthConcern);

  return payload;
}
function buildPremiumQuestionForApi(source: UserInfo) {
  const p = getPremiumWorryPayload(source);
  const labels: Record<string, string> = {
    worryType: "고민 유형",
    question: "질문",
    situation: "현재 상황",
    currentRegion: "장소·날짜·기준점",
    candidateRegions: "선택지·비교 대상",
    reason: "고민 이유",
    currentWork: "일·역할·책임",
    moneySituation: "돈·비용·손해",
    relationshipInfo: "관련 사람·관계",
    healthConcern: "몸·마음 상태",
    desiredVerdict: "원하는 판정",
  };

  return Object.entries(p)
    .filter(([, value]) => normalizeWorryLine(value).length > 0)
    .map(([key, value]) => `${labels[key] || key}: ${value}`)
    .join("\n");
}

function getPremiumApiUser(source: UserInfo): UserInfo {
  const payload = getPremiumWorryPayload(source);

  return {
    ...source,
    // v161: question에는 원래 사용자가 적은 한 줄 질문만 보낸다.
    // 접수지 전체 문자열을 question에 넣으면 AI가 "고민 유형: 질문:" 같은 라벨을 본문에 복붙한다.
    question: payload.question || "",
    worryType: payload.worryType || "",
    worrySituation: payload.situation || "",
    currentRegion: payload.currentRegion || "",
    candidateRegions: payload.candidateRegions || "",
    worryReason: payload.reason || "",
    currentWork: payload.currentWork || "",
    moneySituation: payload.moneySituation || "",
    relationshipInfo: payload.relationshipInfo || "",
    healthConcern: payload.healthConcern || "",
    desiredVerdict: payload.desiredVerdict || "",
  };
}

function getPremiumApiBodyFields(source: UserInfo) {
  const payload = getPremiumWorryPayload(source);
  return {
    // v161: route의 내 고민 상담 엔진은 이 원문 질문과 아래 세부 필드를 facts로 정리해서 사용한다.
    question: payload.question || "",
    worryType: payload.worryType || "",
    situation: payload.situation || "",
    currentRegion: payload.currentRegion || "",
    candidateRegions: payload.candidateRegions || "",
    reason: payload.reason || "",
    currentWork: payload.currentWork || "",
    moneySituation: payload.moneySituation || "",
    relationshipInfo: payload.relationshipInfo || "",
    healthConcern: payload.healthConcern || "",
    desiredVerdict: payload.desiredVerdict || "",
    premiumQuestion: buildPremiumQuestionForApi(source),
  };
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

function makePortOnePaymentId() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  // KCP는 paymentId에 한글/특수문자를 쓰지 않는 것이 안전합니다.
  return `soreum-${Date.now()}-${randomPart}`;
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
    return [
      "오늘 돈에서 조심할 선택",
      "오늘 사람관계에서 피해야 할 말",
      "오늘 몸 컨디션에서 신경 쓸 부분",
      "오늘 운을 살리는 한 가지 행동",
    ];
  }

  if (categoryId === "money") {
    return [
      "내 평생 돈그릇과 현재 활용도",
      "버는 힘·모으는 힘·키우는 힘·지키는 힘",
      "인생에서 돈그릇이 커지는 나이대",
      "최대 재물 돈문과 재물 위험구간",
    ];
  }

  if (categoryId === "career") {
    return [
      "직장형·사업형·자기수익형 판정",
      "일복이 돈복으로 바뀌는 자리",
      "내 사주에 맞는 일의 형태",
      "기운만 빠지는 일의 판",
    ];
  }

  if (categoryId === "love") {
    return [
      "연애운과 결혼운의 진짜 흐름",
      "들어오는 인연과 피해야 할 사람",
      "결혼까지 갈 수 있는 기준",
      "결혼으로 가려면 맞춰야 할 것",
    ];
  }

  if (categoryId === "health") {
    return [
      "사주상 몸이 무너지는 방식",
      "몸이 먼저 보내는 신호",
      "건강을 조심해야 할 시기",
      "몸을 살리는 생활 리듬",
    ];
  }

  if (categoryId === "compatibility") {
    return [
      "궁합 점수와 등급",
      "왜 끌리고 왜 부딪히는지",
      "결혼까지 갈 수 있는 궁합인지",
      "사업파트너라면 돈 앞에서 맞는지",
    ];
  }

  if (categoryId === "monthly") {
    return [
      "올해 전체 운의 결론",
      "돈복이 움직이는 달",
      "일·사업운이 강해지는 달",
      "사람관계와 건강을 조심할 달",
    ];
  }

  if (categoryId === "lifeFlow") {
    return [
      "초년운·청년운·중년운·말년운",
      "인생 대운 기회가 몇 번 오는지",
      "가장 중요한 대운 시기",
      "대운을 막는 악운과 잡아야 할 복",
    ];
  }

  if (categoryId === "traditional") {
    return [
      "초년운·청년운·중년운·말년운",
      "재물운·일사업운·연애결혼운",
      "건강운·자식 흐름·인복",
      "평생 조심할 악운과 반드시 살려야 할 복",
    ];
  }

  if (categoryId === "premium") {
    return [
      "질문에 대한 결론",
      "왜 이 고민이 반복되는지",
      "잡아야 할 것과 내려놔야 할 것",
      "도훈의 최종 판정",
    ];
  }

  return [
    "내 사주에 맞는 핵심 방향",
    "피해야 할 선택과 반복 패턴",
    "앞으로 참고할 흐름",
    "전체 운의 방향",
  ];
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
    warning:
      "좋은 말만 듣고 넘기면 같은 자리에서 또 막힐 수 있습니다. 점수와 등급 뒤에 숨어 있는 돈·일·사람·몸의 흐름을 끝까지 확인해야 합니다.",
    points: [
      "복이 붙는 자리",
      "악운이 붙는 선택",
      "운이 움직이는 시기",
      "도훈의 마지막 판정",
    ],
    buttonText: "도훈의 전체 리포트 열기",
  };

  const hooks: Partial<Record<CategoryId, PaidHook>> = {
    today: {
      title: "오늘 운은 짧게 지나가지만, 놓치면 바로 새는 날입니다",
      body: "무료에서는 오늘 가장 먼저 조심할 기운만 봤습니다. 전체 리포트에서는 오늘의 재물운, 일·사업운, 인연운, 건강운을 따로 열어서 돈이 새는 순간과 말이 꼬이는 지점을 봅니다.",
      warning:
        "오늘은 하루 운이라 길게 끌지 않습니다. 대신 오늘 돈을 써도 되는지, 연락을 해도 되는지, 몸을 무리해도 되는지 바로 확인해야 합니다.",
      points: [
        "오늘의 재물운",
        "오늘의 일·사업운",
        "오늘의 인연운",
        "오늘의 건강운",
      ],
      buttonText: "도훈의 오늘운 전체 풀이 열기",
    },
    money: {
      title: "돈그릇은 보였습니다. 이제 언제 커지고 어디서 깨지는지 봐야 합니다",
      body: "무료에서는 평생 돈그릇, 현재 활용도, 네 가지 재물 점수, 돈 버는 방식과 첫 돈문까지 열었습니다. 전체 리포트에서는 최대 재물 돈문에서 무엇으로 돈을 키우는지, 위험구간에서 무엇을 피해야 하는지, 번 돈을 언제 자산으로 굳히는지까지 같은 판정을 이어서 풉니다.",
      warning:
        "돈그릇이 커도 시기를 잘못 쓰면 돈이 남지 않습니다. 유료에서는 무료에서 본 금액·점수·나이대를 바꾸지 않고, 그 판정이 현실에서 어떤 직업·사업·거래·자산 흐름으로 이어지는지 자세히 엽니다.",
      points: [
        "돈그릇이 커지는 인생 구간",
        "인생 최대 재물 돈문",
        "재물 위험구간과 피해야 할 선택",
        "돈이 자산으로 굳는 시기",
      ],
      buttonText: "내 평생 재물 흐름 전체 보기",
    },
    career: {
      title:
        "방금 나온 일 성향 판정, 여기서 끊기면 또 남 좋은 일만 할 수 있습니다",
      body: "진짜 중요한 건 네가 무슨 일을 해야 사주가 사는지입니다. 직장에 있으면 살아나는지, 사업으로 가야 하는지, 어느 판에 들어가면 이름도 몫도 남는지까지 봐야 합니다.",
      warning:
        "일복이 있어도 남 좋은 일만 하면 돈복으로 바뀌지 않습니다. 네 역할이 남는 자리와 기운만 빠지는 자리를 구분해야 합니다.",
      points: [
        "직장형·사업형 판정",
        "맞는 일의 형태",
        "피해야 할 일의 판",
        "일이 풀리는 시기",
      ],
      buttonText: "일·사업운 전체 리포트 열기",
    },
    love: {
      title: "인연운이 있다는 말만으로는 부족합니다",
      body: "전체 리포트에서는 어떤 사람이 들어오는지, 누구를 만나면 마음만 늙는지, 올해 몇 월 전후로 인연이 움직이는지, 결혼까지 갈 수 있는 운인지까지 봅니다.",
      warning:
        "좋아하는 마음만 보고 가면 같은 자리에서 또 다칠 수 있습니다. 맞는 사람과 피해야 할 사람을 사주 흐름으로 갈라봐야 합니다.",
      points: [
        "들어오는 인연 시기",
        "맞는 사람 유형",
        "피해야 할 사람",
        "결혼까지 갈 수 있는 기준",
      ],
      buttonText: "연애운·결혼운 전체 풀이 열기",
    },
    health: {
      title:
        "건강운은 겁주는 풀이가 아니라, 몸이 먼저 보내는 신호를 보는 겁니다",
      body: "전체 리포트에서는 사주상 어느 계통이 약하게 잡히는지, 몇 월 전후로 몸이 무너지기 쉬운지, 어떤 음식과 운동 흐름이 맞는지까지 봅니다.",
      warning:
        "몸이 먼저 무거워지는데도 넘기면 운이 들어와도 버틸 힘이 약해집니다. 위장·소화·수면·피로·순환 흐름을 따로 봐야 합니다.",
      points: [
        "약하게 잡히는 몸 계통",
        "몸이 무거워지는 시기",
        "맞는 음식 흐름",
        "맞는 운동 흐름",
      ],
      buttonText: "건강운 20페이지 열기",
    },
    compatibility: {
      title: "궁합 점수만 보면, 왜 끌리고 왜 터지는지 놓칩니다",
      body: "전체 리포트에서는 이 사람이 내 복인지 악운인지, 연애로 좋은지 결혼까지 갈 수 있는지, 사업파트너라면 같이 돈을 벌 수 있는지까지 따로 봅니다.",
      warning:
        "좋은 사람과 오래 갈 사람은 다릅니다. 좋은 사람과 같이 돈 벌 수 있는 사람도 다릅니다. 궁합은 점수 뒤의 이유를 봐야 합니다.",
      points: [
        "궁합 점수와 등급",
        "끌리는 이유",
        "부딪히는 지점",
        "결혼 또는 동업 가능성",
      ],
      buttonText: "궁합운 20페이지 열기",
    },
    monthly: {
      title: "올해운세는 1월부터 12월까지 늘어놓는 풀이가 아닙니다",
      body: "전체 리포트에서는 올해 돈이 움직이는 달, 일이 강해지는 달, 사람관계가 흔들리는 달, 몸을 조심해야 할 달을 찍어서 봅니다.",
      warning:
        "좋은 달을 놓치면 복이 지나가고, 나쁜 달을 모르고 들어가면 손해가 먼저 붙습니다. 올해는 움직일 달과 멈출 달이 다릅니다.",
      points: [
        "돈복이 움직이는 달",
        "일·사업운이 강해지는 달",
        "사람관계가 흔들리는 달",
        "건강 조심 달",
      ],
      buttonText: "올해운세 20페이지 열기",
    },
    lifeFlow: {
      title: "대운은 기다린다고 내 것이 되는 운이 아닙니다",
      body: "전체 리포트에서는 초년·청년·중년·말년의 흐름과 인생에서 가장 큰 대운이 언제 들어오는지, 무엇이 그 대운을 막는지까지 봅니다.",
      warning:
        "대운이 와도 잡을 그릇이 없으면 지나갑니다. 돈·일·사람·건강 중 무엇이 대운을 열고 막는지 봐야 합니다.",
      points: [
        "초년·청년·중년·말년",
        "가장 중요한 대운",
        "대운을 막는 악운",
        "잡아야 할 복",
      ],
      buttonText: "인생대운 20페이지 열기",
    },
    traditional: {
      title:
        "평생종합사주는 한 가지 운이 아니라, 네 인생 전체판을 여는 리포트입니다",
      body: "돈이 안 모인 이유가 일 때문인지, 일이 막힌 이유가 사람 때문인지, 몸이 무거운 이유가 오래 버틴 운 때문인지까지 같이 봐야 합니다. 평생종합사주는 초년부터 말년까지 돈·일·사람·건강·자식·대운을 한 판으로 펼쳐봅니다.",
      warning:
        "평생종합사주는 14,900원 대표 상품입니다. 초년부터 말년까지 돈·일·사람·건강·자식·대운이 어디서 붙고 어디서 막히는지 끝까지 열어봐야 합니다.",
      points: [
        "초년·청년·중년·말년",
        "평생 재물·일·사랑·건강",
        "자식 흐름과 인복",
        "평생 조심할 악운",
      ],
      buttonText: "평생사주 20페이지 전체판 열기",
    },
    premium: {
      title:
        "이 고민은 위로가 아니라, 해도 되는지 멈춰야 하는지 답을 봐야 합니다",
      body: "내 고민 상담은 종합사주가 아닙니다. 네가 적은 질문 하나를 놓고 지금 밀어붙여도 되는지, 기다려야 하는지, 정리해야 하는지, 사주상 어디서 막히고 어디서 풀리는지를 바로 봅니다.",
      warning:
        "내 고민 상담은 19,900원 심화 상담입니다. 돈이면 돈, 일이라면 일, 사람이라면 사람까지 질문 하나를 평생운처럼 깊게 파고듭니다.",
      points: [
        "질문에 대한 결론",
        "왜 반복되는 고민인지",
        "앞으로 1년 흐름",
        "도훈의 최종 답",
      ],
      buttonText: "내 고민 20페이지 심화판 열기",
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
      className={
        compact ? "h-12 w-auto object-contain" : "h-auto w-full object-contain"
      }
    />
  );
}

function normalizeComicChapters(value: unknown): ComicChapter[] {
  if (!Array.isArray(value)) return [];

  const chapters: ComicChapter[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const raw = item as Record<string, unknown>;
    const chapter: ComicChapter = {
      sceneType: typeof raw.sceneType === "string" ? raw.sceneType : "",
      speaker: typeof raw.speaker === "string" ? raw.speaker : "",
      emotion: typeof raw.emotion === "string" ? raw.emotion : "",
      title: typeof raw.title === "string" ? raw.title : "",
      text: typeof raw.text === "string" ? raw.text : "",
      character: typeof raw.character === "string" ? raw.character : "",
      mood:
        typeof raw.mood === "string"
          ? raw.mood
          : typeof raw.background === "string"
            ? raw.background
            : "",
      background: typeof raw.background === "string" ? raw.background : "",
      visualHint: typeof raw.visualHint === "string" ? raw.visualHint : "",
    };

    if (chapter.title || chapter.text) {
      chapters.push(chapter);
    }
  });

  return chapters;
}

function getComicCharacterImage(scene: ComicChapter) {
  const key =
    `${scene.character || ""} ${scene.speaker || ""} ${scene.emotion || ""} ${scene.sceneType || ""}`.toLowerCase();

  if (
    key.includes("bad") ||
    key.includes("ghost") ||
    key.includes("악운") ||
    key.includes("warningghost")
  ) {
    return {
      src: "/characters/bad-luck-ghost.png",
      fallback: "👻",
      name: "악운",
    };
  }

  if (
    key.includes("fortune") ||
    key.includes("spirit") ||
    key.includes("blessing") ||
    key.includes("복")
  ) {
    return {
      src: "/characters/fortune-spirit.png",
      fallback: "✨",
      name: "복",
    };
  }

  if (
    key.includes("user") ||
    key.includes("shadow") ||
    key.includes("내담자")
  ) {
    return {
      src: "/characters/user-shadow.png",
      fallback: "👤",
      name: "내담자",
    };
  }

  if (key.includes("warning") || key.includes("경고")) {
    return {
      src: "/characters/dohoon-warning.png",
      fallback: "⚠️",
      name: "도훈",
    };
  }

  if (key.includes("point") || key.includes("final") || key.includes("판정")) {
    return {
      src: "/characters/dohoon-pointing.png",
      fallback: "👉",
      name: "도훈",
    };
  }

  if (key.includes("smile") || key.includes("good") || key.includes("gold")) {
    return {
      src: "/characters/dohoon-smile.png",
      fallback: "🙂",
      name: "도훈",
    };
  }

  if (
    key.includes("serious") ||
    key.includes("mind") ||
    key.includes("personality")
  ) {
    return {
      src: "/characters/dohoon-serious.png",
      fallback: "🔮",
      name: "도훈",
    };
  }

  return { src: "/characters/dohoon.png", fallback: "🔮", name: "도훈" };
}

function getComicPanelClass(scene: ComicChapter) {
  const mood =
    `${scene.mood || ""} ${scene.background || ""} ${scene.sceneType || ""}`.toLowerCase();

  if (
    mood.includes("red") ||
    mood.includes("warning") ||
    mood.includes("dark")
  ) {
    return "from-[#2a0508] via-[#140608] to-[#050505]";
  }

  if (
    mood.includes("gold") ||
    mood.includes("blessing") ||
    mood.includes("fortune")
  ) {
    return "from-[#3b2507] via-[#1a0f04] to-[#050505]";
  }

  if (
    mood.includes("mist") ||
    mood.includes("shadow") ||
    mood.includes("mind")
  ) {
    return "from-[#16172a] via-[#0b0b12] to-[#050505]";
  }

  return "from-[#231207] via-[#0d0907] to-[#050505]";
}

function FortuneComicPanel({
  scene,
  index,
  total,
}: {
  scene: ComicChapter;
  index: number;
  total: number;
}) {
  const image = getComicCharacterImage(scene);
  const panelClass = getComicPanelClass(scene);
  const title = scene.title || "도훈의 판정";
  const text = scene.text || "이 장면의 풀이가 비어 있습니다.";

  return (
    <article
      className={cx(
        "relative min-h-[520px] overflow-hidden rounded-[34px] border border-[#7a5b37] bg-gradient-to-br p-5 shadow-[0_26px_80px_rgba(0,0,0,0.48)]",
        panelClass,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,215,142,0.65)_1px,transparent_0)] [background-size:30px_30px]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#e0b36d]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#a855f7]/14 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="rounded-full border border-[#7a5b37] bg-black/45 px-4 py-2 text-[10px] font-black tracking-[0.22em] text-[#e0b36d]">
          도훈의 사주극장
        </div>
        <div className="rounded-full border border-[#7a5b37] bg-black/45 px-3 py-2 text-xs font-black text-white">
          {index + 1} / {total}
        </div>
      </div>

      <div className="relative z-10 mt-5 flex min-h-[285px] items-end justify-center">
        <div className="relative h-[300px] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-[#7a5b37] bg-black/18 shadow-[0_18px_48px_rgba(0,0,0,0.38)]">
          <SafeImage
            src={image.src}
            alt={image.name}
            fallback={image.fallback}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/62 to-transparent" />
        </div>
      </div>

      <div className="relative z-20 -mt-4 rounded-[28px] border border-[#d8a86f] bg-[rgba(255,248,238,0.96)] p-5 text-[#15100c] shadow-[0_22px_54px_rgba(0,0,0,0.42)]">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-[#b91c1c] px-3 py-1 text-[11px] font-black text-white">
            장면 {index + 1}
          </span>
          {scene.sceneType ? (
            <span className="rounded-full border border-[#d8a86f] bg-[#fff7ea] px-3 py-1 text-[11px] font-black text-[#7a4c16]">
              {scene.sceneType}
            </span>
          ) : null}
        </div>

        <h3 className="break-keep text-[24px] font-black leading-tight tracking-[-0.055em] text-[#120d09] md:text-[28px]">
          {title}
        </h3>
        <p className="mt-4 whitespace-pre-line break-keep text-[17px] font-black leading-8 tracking-[-0.035em] text-[#241710] md:text-[19px] md:leading-9">
          {text}
        </p>
      </div>
    </article>
  );
}

function FortuneComicTheater({
  chapters,
  paid = false,
}: {
  chapters: ComicChapter[];
  paid?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [chapters]);

  if (!chapters.length) return null;

  const safeIndex = Math.min(index, chapters.length - 1);
  const current = chapters[safeIndex];

  return (
    <section className="mt-5 rounded-[36px] border border-[#7a5b37] bg-[#0b0908] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.38)] md:p-4">
      <div className="mb-3 rounded-[28px] border border-[#7a5b37] bg-[radial-gradient(circle_at_88%_15%,rgba(216,168,111,0.16),transparent_36%),#11100f] p-5">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#d8a86f]">
          SOREUM COMIC REPORT
        </div>
        <div className="mt-2 break-keep text-2xl font-black tracking-[-0.06em] text-white">
          도훈의 전체 리포트
        </div>
        <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
          {paid
            ? "결제 후 열린 전체 리포트을 한 장씩 넘겨봅니다."
            : "무료에서는 문 앞까지만 보여줍니다. 잠긴 장면 뒤에 20페이지 전체판이 이어집니다."}
        </p>
      </div>

      <FortuneComicPanel
        scene={current}
        index={safeIndex}
        total={chapters.length}
      />

      <div className="mt-3 rounded-[28px] border border-[#7a5b37] bg-[#11100f] p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            disabled={safeIndex === 0}
            className="rounded-full border border-[#7a5b37] bg-black/35 px-4 py-4 text-sm font-black text-white disabled:opacity-35"
          >
            〈 이전 장면
          </button>

          <button
            type="button"
            onClick={() =>
              setIndex((prev) => Math.min(chapters.length - 1, prev + 1))
            }
            disabled={safeIndex === chapters.length - 1}
            className="rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-4 py-4 text-sm font-black text-black disabled:opacity-35 sm:col-start-3"
          >
            다음 장면 〉
          </button>

          <div className="order-3 col-span-2 flex items-center justify-center gap-1.5 sm:order-none sm:col-span-1 sm:col-start-2 sm:row-start-1">
            {chapters.map((chapter, chapterIndex) => (
              <button
                key={`comic-dot-${chapter.title || chapterIndex}-${chapterIndex}`}
                type="button"
                aria-label={`${chapterIndex + 1}번 웹툰 장면으로 이동`}
                onClick={() => setIndex(chapterIndex)}
                className={cx(
                  "h-2.5 rounded-full transition-all",
                  safeIndex === chapterIndex
                    ? "w-8 bg-[#d8a86f]"
                    : "w-2.5 bg-[#7a5b37]",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getTwentyPageProductName(category: Category) {
  if (category.id === "today") return "도훈의 오늘운 전체 풀이";
  if (category.id === "traditional") return "평생사주 전체판";
  if (category.id === "premium") return "내 고민 심화판";
  return `${category.title} 전체 리포트`;
}


function TextReportAccordion(_props: { text: string; paid?: boolean }) {
  // 웹툰형 결과만 노출하기 위해 텍스트 리포트 UI는 무료/유료 모두 렌더링하지 않습니다.
  return null;
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
  return first === '"' || first === "“" || first === "'";
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
            accent,
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
              isRedPointLine(firstLine)
                ? "border-l-4 border-[#b91c1c] pl-4 text-[#ef4444]"
                : "text-white",
            )}
          >
            {isRedPointLine(firstLine)
              ? cleanRedPointLine(firstLine)
              : firstLine}
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
                  : undefined,
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

function ResultReport({
  text,
  paid = false,
}: {
  text: string;
  paid?: boolean;
}) {
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
  const progressPercent = Math.round(
    ((safeChapterIndex + 1) / sections.length) * 100,
  );

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
          한 번에 길게 읽는 대신, 돈 낸 전체 리포트를 챕터별로 끊어서 봅니다.
          필요하면 전체보기로 다시 펼칠 수 있습니다.
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
                  : "border-[#7a5b37] bg-black/35 text-[#c8beb0]",
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
            disabled={
              !hasManyChapters || safeChapterIndex === sections.length - 1
            }
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
                safeChapterIndex === index
                  ? "w-8 bg-[#d8a86f]"
                  : "w-2.5 bg-[#7a5b37]",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreGlow(score: number) {
  if (score >= 85) return "rgba(250,204,21,0.95)";
  if (score >= 70) return "rgba(244,114,182,0.92)";
  if (score >= 55) return "rgba(168,85,247,0.9)";
  return "rgba(100,116,139,0.86)";
}

function ScoreOrb3D({
  score,
  label,
  verdict,
  compact = false,
}: {
  score: number;
  label: string;
  verdict?: string;
  compact?: boolean;
}) {
  const safeScore = clampScore(score);
  const glow = scoreGlow(safeScore);
  const size = compact ? "h-28 w-28" : "h-48 w-48 md:h-56 md:w-56";

  return (
    <div className="[perspective:1000px]">
      <div
        className={cx(
          "score-orb-3d relative grid place-items-center rounded-full [transform-style:preserve-3d]",
          size,
        )}
        style={
          {
            "--score": `${safeScore * 3.6}deg`,
            "--orb-glow": glow,
          } as CSSProperties
        }
      >
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,var(--orb-glow)_0deg,var(--orb-glow)_var(--score),rgba(255,255,255,0.08)_var(--score),rgba(255,255,255,0.02)_360deg)] shadow-[0_0_65px_var(--orb-glow)]" />
        <div className="absolute inset-[8%] rounded-full border border-white/20 bg-[radial-gradient(circle_at_34%_26%,rgba(255,255,255,0.44),rgba(255,255,255,0.08)_23%,rgba(22,10,30,0.96)_69%)] backdrop-blur-xl" />
        <div className="score-orb-ring absolute -inset-[9%] rounded-full border border-[#f0c77e]/35" />
        <div className="score-orb-ring-reverse absolute inset-[5%] rounded-full border border-[#d946ef]/25" />
        <div className="relative z-10 text-center [transform:translateZ(48px)]">
          <div className={cx("font-black leading-none text-white", compact ? "text-3xl" : "text-6xl md:text-7xl")}>{safeScore}</div>
          <div className={cx("mt-2 font-black tracking-[-0.04em] text-[#f4d69b]", compact ? "text-[11px]" : "text-sm")}>{label}</div>
        </div>
        {verdict && !compact ? (
          <div className="absolute -bottom-14 left-1/2 w-[240px] -translate-x-1/2 text-center text-sm font-black leading-6 text-[#f7e8cf]">
            {verdict}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RadarPlate3D({
  title,
  metrics,
}: {
  title: string;
  metrics: ScoreMetric[];
}) {
  const list = metrics.slice(0, 8);
  const size = 320;
  const center = size / 2;
  const radius = 118;
  const points = list.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, list.length);
    const valueRadius = radius * (clampScore(item.score) / 100);
    return {
      ...item,
      x: center + Math.cos(angle) * valueRadius,
      y: center + Math.sin(angle) * valueRadius,
      lx: center + Math.cos(angle) * (radius + 28),
      ly: center + Math.sin(angle) * (radius + 28),
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const ringValues = [0.25, 0.5, 0.75, 1];

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#7a5b37] bg-[radial-gradient(circle_at_50%_22%,rgba(216,168,111,0.18),transparent_38%),linear-gradient(145deg,#160f1d,#080706)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.46)] md:p-6">
      <div className="text-center text-[11px] font-black tracking-[0.24em] text-[#d8a86f]">RELATION RADAR</div>
      <h3 className="mt-2 text-center text-xl font-black text-white">{title}</h3>
      <div className="mt-4 flex justify-center [perspective:900px]">
        <div className="relative [transform:rotateX(57deg)_rotateZ(-3deg)] [transform-style:preserve-3d]">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-[330px] w-[330px] max-w-full overflow-visible drop-shadow-[0_22px_28px_rgba(217,70,239,0.22)]">
            <defs>
              <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5d08a" stopOpacity="0.82" />
                <stop offset="55%" stopColor="#d946ef" stopOpacity="0.56" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.42" />
              </linearGradient>
              <filter id="radarGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {ringValues.map((scale) => {
              const ring = list.map((_, index) => {
                const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, list.length);
                return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
              }).join(" ");
              return <polygon key={scale} points={ring} fill="none" stroke="rgba(216,168,111,0.22)" strokeWidth="1.2" />;
            })}
            {list.map((_, index) => {
              const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, list.length);
              return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="rgba(255,255,255,0.12)" />;
            })}
            <polygon points={polygon} fill="url(#radarFill)" stroke="#f5d08a" strokeWidth="2" filter="url(#radarGlow)" />
            {points.map((point) => <circle key={point.key} cx={point.x} cy={point.y} r="4.2" fill="#fff2c4" stroke="#d946ef" strokeWidth="2" />)}
          </svg>
        </div>
      </div>
      <div className="-mt-9 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {list.map((item) => (
          <div key={item.key} className="rounded-2xl border border-[#7a5b37] bg-black/35 p-3 text-center">
            <div className="text-xs font-black text-[#d8d0c6]">{item.label}</div>
            <div className="mt-1 text-xl font-black text-[#f4d69b]">{clampScore(item.score)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttractionBeam({ data }: { data: CompatibilityScoreVisual["attraction"] }) {
  const left = clampScore(data.userToPartner);
  const right = clampScore(data.partnerToUser);
  const mutual = clampScore(data.mutual);
  return (
    <section className="rounded-[30px] border border-[#7a5b37] bg-[radial-gradient(circle_at_50%_55%,rgba(236,72,153,0.18),transparent_35%),#100b12] p-5">
      <div className="text-center text-[11px] font-black tracking-[0.24em] text-[#d8a86f]">ATTRACTION FLOW</div>
      <h3 className="mt-2 text-center text-xl font-black text-white">서로 끌어당기는 힘</h3>
      <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <div className="text-xs font-black text-[#c8beb0]">나 → 상대</div>
          <div className="mt-1 text-3xl font-black text-white">{left}</div>
        </div>
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 animate-pulse rounded-full bg-[#d946ef]/25 blur-xl" />
          <div className="absolute inset-2 grid place-items-center rounded-full border border-[#f4d69b] bg-[radial-gradient(circle,#7c2d6d,#160b18_68%)] shadow-[0_0_36px_rgba(217,70,239,0.48)]">
            <div className="text-center"><div className="text-2xl font-black text-white">{mutual}</div><div className="text-[10px] font-black text-[#f4d69b]">상호 끌림</div></div>
          </div>
        </div>
        <div>
          <div className="text-xs font-black text-[#c8beb0]">상대 → 나</div>
          <div className="mt-1 text-3xl font-black text-white">{right}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#f472b6]" style={{ width: `${left}%` }} /></div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="ml-auto h-full rounded-full bg-gradient-to-l from-[#d8a86f] to-[#f472b6]" style={{ width: `${right}%` }} /></div>
      </div>
      <p className="mt-5 break-keep text-center text-sm font-black leading-7 text-[#f5efe6]">{data.verdict}</p>
    </section>
  );
}


function toRelationshipVisualProfile(
  tags: ImageVisualTags,
): RelationshipVisualProfile {
  const moodMap: Record<ImageVisualTags["mood"], RelationshipVisualProfile["mood"]> = {
    clean: "clean",
    sexy: "sexy",
    innocent: "innocent",
    confident: "confident",
    warm: "warm",
    cold: "cold",
    professional: "mature",
    active: "confident",
  };

  const styleMap: Record<ImageVisualTags["outfit"], RelationshipVisualProfile["style"]> = {
    shirt: "minimal",
    knit: "casual",
    dress: "romantic",
    casual: "casual",
    office: "office",
    sports: "sporty",
  };

  const energyMap: Record<ImageVisualTags["pose"], RelationshipVisualProfile["energy"]> = {
    standing: "confident",
    chair: "calm",
    stool: "mysterious",
    desk: "mature",
    stairs: "active",
    wall: "dominant",
  };

  return {
    gender: tags.gender,
    mood: moodMap[tags.mood],
    style: styleMap[tags.outfit],
    energy: energyMap[tags.pose],
  };
}

function buildRelationshipModelSeed(
  user: UserInfo,
  categoryId: CategoryId,
  salt: string,
) {
  return makeRelationshipSeed(
    [
      user.year,
      user.month,
      user.day,
      user.birthTime,
      user.gender,
      user.partnerYear,
      user.partnerMonth,
      user.partnerDay,
      user.partnerBirthTime,
      user.partnerGender,
      categoryId,
      salt,
    ].join("|"),
  );
}

function RelationshipModelCard({
  model,
  title,
  description,
  notice,
  featured = false,
}: {
  model: RelationshipModel;
  title: string;
  description: string;
  notice: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`min-w-0 overflow-hidden border border-[#7a5b37] bg-[linear-gradient(145deg,#17110f,#090707)] shadow-[0_20px_55px_rgba(0,0,0,0.38)] ${
        featured ? "rounded-[34px]" : "rounded-[26px]"
      }`}
    >
      {/*
        관계 인물 이미지는 원본 비율이 서로 달라도 카드 폭을 항상 꽉 채운다.
        기존 non-featured 카드의 scale-[0.78] + object-contain 조합 때문에
        세로 사진이 카드 중앙에 가느다란 띠처럼 보이는 문제가 있었다.

        - 카드 프레임은 4:5로 통일
        - 실제 이미지는 object-cover
        - 얼굴이 잘리지 않도록 상단 16%를 기준점으로 사용
        - 이미지 자체 scale을 제거해서 화질 저하/빈 여백 방지
      */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0d0a0b]">
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-bold leading-6 text-[#756b63]">
          인물 이미지를 불러오는 중입니다
        </div>

        {/* 원본 비율이 극단적으로 다른 경우에도 빈 공간이 보이지 않도록 배경만 아주 약하게 채운다. */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            src={model.path}
            alt=""
            className="h-full w-full scale-[1.04] object-cover object-[50%_16%] blur-2xl brightness-[0.18] saturate-75"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        {/* 실제 보여주는 인물 사진 */}
        <img
          src={model.path}
          alt={title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 z-[1] h-full w-full object-cover object-[50%_16%] transition-transform duration-500 hover:scale-[1.01]"
          onError={(event) => {
            const image = event.currentTarget;
            if (image.dataset.fallbackApplied === "true") {
              image.style.display = "none";
              return;
            }

            image.dataset.fallbackApplied = "true";
            image.src =
              model.gender === "male"
                ? "/relationship-models/male/m001.webp"
                : "/relationship-models/female/f001.webp";
          }}
        />

        {/* 얼굴/상반신은 가리지 않고 하단 텍스트만 읽히게 하는 그라데이션 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[42%] bg-gradient-to-t from-black via-black/55 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 z-[3] p-4 sm:p-5">
          <div className="inline-flex rounded-full border border-[#f0c784]/55 bg-black/55 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#f0c784] backdrop-blur-md">
            SOREUM VISUAL TYPE
          </div>

          <h3 className="mt-2 break-keep text-lg font-black leading-tight text-white sm:text-xl">
            {title}
          </h3>
        </div>
      </div>

      <div className={featured ? "p-6 sm:p-8" : "p-4 sm:p-5"}>
        <p className="break-keep text-sm font-bold leading-7 text-[#efe7dc]">
          {description}
        </p>

        <p className="mt-3 break-keep rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-[11px] leading-5 text-[#aaa096]">
          {notice}
        </p>
      </div>
    </article>
  );
}

function LoveMarriageVisualModels({
  data,
  user,
}: {
  data: LoveMarriageScoreVisual;
  user: UserInfo;
}) {
  const partnerProfile: RelationshipVisualProfile = {
    ...toRelationshipVisualProfile(data.visualProfiles.idealPartner),
    gender: user.gender === "남성" ? "female" : "male",
  };
  const partnerSeed = buildRelationshipModelSeed(user, "love", "love-partner");
  const partnerModel = pickRelationshipModel(partnerProfile, partnerSeed);

  return (
    <section className="space-y-5">
      <div className="text-center">
        <div className="text-[10px] font-black tracking-[0.28em] text-[#d8a86f]">
          IDEAL PARTNER VISUAL
        </div>
        <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
          네가 반복해서 끌리는 사람
        </h3>
        <p className="mx-auto mt-3 max-w-2xl break-keep text-sm font-bold leading-7 text-[#cfc2b4]">
          얼굴과 분위기, 체형과 옷차림까지 사주에서 반복해서 마음이 가는 상대의 결을 한 장에 담았다.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[460px] px-1 sm:px-0">
        <RelationshipModelCard
          model={partnerModel}
          featured
          title={
            data.visualProfiles.partnerTitle ||
            "네가 반복해서 끌리는 상대의 얼굴과 분위기"
          }
          description={data.visualProfiles.partnerDescription}
          notice="실제 미래 배우자의 얼굴을 그대로 예측한 사진이 아니라, 사주에서 반복적으로 끌리는 상대의 얼굴 분위기·체형·스타일을 시각화한 이미지입니다."
        />
      </div>
    </section>
  );
}

function CompatibilityVisualModels({
  data,
  user,
}: {
  data: CompatibilityScoreVisual;
  user: UserInfo;
}) {
  const userProfile: RelationshipVisualProfile = {
    ...toRelationshipVisualProfile(data.visualProfiles.user),
    gender: user.gender === "남성" ? "male" : "female",
  };
  const partnerProfile: RelationshipVisualProfile = {
    ...toRelationshipVisualProfile(data.visualProfiles.partner),
    gender:
      user.partnerGender === "여성"
        ? "female"
        : user.partnerGender === "남성"
          ? "male"
          : user.gender === "남성"
            ? "female"
            : "male",
  };
  const userSeed = buildRelationshipModelSeed(
    user,
    "compatibility",
    "compatibility-user",
  );
  const partnerSeed = buildRelationshipModelSeed(
    user,
    "compatibility",
    "compatibility-partner",
  );
  const userModel = pickRelationshipModel(userProfile, userSeed);
  const partnerModel = pickDistinctRelationshipModel(
    partnerProfile,
    partnerSeed,
    userModel.gender === partnerProfile.gender ? [userModel.id] : [],
  );

  return (
    <section className="space-y-3">
      <div className="text-center">
        <div className="text-[10px] font-black tracking-[0.28em] text-[#d8a86f]">
          TWO-PERSON VISUAL
        </div>
        <h3 className="mt-2 text-xl font-black text-white">
          이 관계 안에서 드러나는 두 사람의 모습
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RelationshipModelCard
          model={userModel}
          title={
            data.visualProfiles.userTitle ||
            "이 관계에서 드러나는 너의 모습"
          }
          description={data.visualProfiles.userDescription}
          notice="실제 얼굴을 재현한 것이 아니라, 이 관계 안에서 드러나는 너의 분위기와 역할을 시각화한 이미지입니다."
        />
        <RelationshipModelCard
          model={partnerModel}
          title={
            data.visualProfiles.partnerTitle ||
            "이 관계에서 드러나는 상대의 모습"
          }
          description={data.visualProfiles.partnerDescription}
          notice="실제 얼굴을 재현한 것이 아니라, 이 관계 안에서 드러나는 상대의 분위기와 역할을 시각화한 이미지입니다."
        />
      </div>
    </section>
  );
}

function RelationshipVisualTeaser({
  data,
  user,
}: {
  data: RelationshipScoreVisual;
  user: UserInfo;
}) {
  const isCompatibility = data.kind === "compatibility";
  const firstProfile = toRelationshipVisualProfile(data.visualProfiles.user);
  const secondProfile = toRelationshipVisualProfile(
    isCompatibility ? data.visualProfiles.partner : data.visualProfiles.idealPartner,
  );
  const firstSeed = buildRelationshipModelSeed(
    user,
    isCompatibility ? "compatibility" : "love",
    "preview-user",
  );
  const secondSeed = buildRelationshipModelSeed(
    user,
    isCompatibility ? "compatibility" : "love",
    "preview-partner",
  );
  const firstModel = pickRelationshipModel(firstProfile, firstSeed);
  const secondModel = pickDistinctRelationshipModel(
    secondProfile,
    secondSeed,
    firstModel.gender === secondProfile.gender ? [firstModel.id] : [],
  );

  const items = [
    {
      model: firstModel,
      label: isCompatibility ? "관계 속 나의 모습" : "연애할 때 드러나는 내 분위기",
    },
    {
      model: secondModel,
      label: isCompatibility ? "관계 속 상대의 모습" : "내가 끌리는 상대의 분위기",
    },
  ];

  return (
    <section className="mt-5 rounded-[30px] border border-[#7a5b37] bg-[#0c090a] p-4">
      <div className="text-center">
        <div className="text-[10px] font-black tracking-[0.28em] text-[#d8a86f]">
          LOCKED RELATIONSHIP VISUAL
        </div>
        <h2 className="mt-2 break-keep text-xl font-black text-white">
          얼굴과 세부 상대 유형은 전체 리포트에서 공개됩니다
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map(({ model, label }) => (
          <article
            key={`${model.id}-${label}`}
            className="overflow-hidden rounded-[24px] border border-[#7a5b37] bg-black"
          >
            <div className="relative h-48 overflow-hidden bg-[#130d10] sm:h-60">
              <img
                src={model.path}
                alt="잠긴 관계 인물 이미지"
                loading="lazy"
                className="h-full w-full scale-[1.2] object-cover object-bottom blur-[3px] brightness-[0.32] saturate-50"
                onError={(event) => {
                  const image = event.currentTarget;
                  if (image.dataset.fallbackApplied === "true") {
                    image.style.display = "none";
                    return;
                  }
                  image.dataset.fallbackApplied = "true";
                  image.src = model.gender === "male"
                    ? "/relationship-models/male/m001.webp"
                    : "/relationship-models/female/f001.webp";
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.76)_35%,rgba(0,0,0,0.12)_100%)]" />
              <div className="absolute inset-x-0 top-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#d8a86f] bg-black/75 text-xl text-[#f0c784] shadow-[0_0_30px_rgba(216,168,111,0.22)]">
                  🔒
                </div>
                <div className="mt-3 px-3 text-sm font-black text-white">
                  얼굴 비공개
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-3 pt-12">
                <div className="break-keep text-center text-xs font-black leading-5 text-[#efe7dc]">
                  {label}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 break-keep rounded-2xl border border-[#7a5b37] bg-[#1b1512] p-4 text-center text-sm font-bold leading-6 text-[#e0b36d]">
        전체 리포트에서는 실제 얼굴이 보이는 이미지와 함께 얼굴 분위기·체형·옷차림·말투·결혼 상대 유형까지 공개합니다.
      </p>
    </section>
  );
}

function CompatibilityScoreTheater({ data, user }: { data: CompatibilityScoreVisual; user: UserInfo }) {
  return (
    <section className="mt-5 space-y-5 rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.13),transparent_35%),#090708] p-4 md:p-5">
      <div className="rounded-[28px] border border-[#7a5b37] bg-black/35 p-5 text-center">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#d8a86f]">SOREUM 3D COMPATIBILITY</div>
        <h2 className="mt-2 text-2xl font-black text-white">두 사람의 관계 전체판</h2>
        <div className="mt-8 flex justify-center pb-14"><ScoreOrb3D score={data.overall.score} label="전체 궁합" verdict={data.overall.verdict} /></div>
        <p className="mt-1 break-keep text-sm leading-7 text-[#c8beb0]">{data.overall.summary}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[24px] border border-[#7a5b37] bg-[#120d14] p-3 text-center"><ScoreOrb3D compact score={data.headlineScores.love} label="연애 궁합" /></div>
        <div className="rounded-[24px] border border-[#7a5b37] bg-[#120d14] p-3 text-center"><ScoreOrb3D compact score={data.headlineScores.marriage} label="결혼 궁합" /></div>
        <div className="rounded-[24px] border border-[#7a5b37] bg-[#120d14] p-3 text-center"><ScoreOrb3D compact score={data.headlineScores.intimacy ?? 0} label={data.headlineScores.intimacy === null ? "동업 호흡" : "속궁합"} /></div>
      </div>

      <CompatibilityVisualModels data={data} user={user} />
      <AttractionBeam data={data.attraction} />
      <RadarPlate3D title="두 사람의 관계 균형" metrics={data.relationshipMetrics} />
      {data.intimacyMetrics.length > 0 ? <RadarPlate3D title="두 사람의 속궁합 코어" metrics={data.intimacyMetrics} /> : null}
    </section>
  );
}

function LoveMarriageScoreTheater({ data, user }: { data: LoveMarriageScoreVisual; user: UserInfo }) {
  return (
    <section className="mt-5 space-y-5 rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.13),transparent_35%),#090708] p-4 md:p-5">
      <div className="text-center">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#d8a86f]">SOREUM 3D LOVE REPORT</div>
        <h2 className="mt-2 text-2xl font-black text-white">연애운과 결혼운을 따로 봅니다</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-[#7a5b37] bg-black/35 p-5 text-center">
          <div className="flex justify-center pb-14"><ScoreOrb3D score={data.love.overall} label="연애운" verdict={data.love.verdict} /></div>
        </div>
        <div className="rounded-[28px] border border-[#7a5b37] bg-black/35 p-5 text-center">
          <div className="flex justify-center pb-14"><ScoreOrb3D score={data.marriage.overall} label="결혼운" verdict={data.marriage.verdict} /></div>
        </div>
      </div>
      <LoveMarriageVisualModels data={data} user={user} />
      <RadarPlate3D title="연애 매력과 관계 지속력" metrics={data.love.metrics} />
      <RadarPlate3D title="결혼 안정과 현실 적응력" metrics={data.marriage.metrics} />
    </section>
  );
}

function MoneyScoreBar({
  label,
  score,
  hint,
}: {
  label: string;
  score: number;
  hint: string;
}) {
  const safeScore = clampScore(score);
  return (
    <div className="rounded-[22px] border border-[#7a5b37] bg-black/35 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">{label}</div>
          <div className="mt-1 text-[11px] font-bold text-[#9f958b]">{hint}</div>
        </div>
        <div className="text-3xl font-black leading-none text-[#f2cf8b]">{safeScore}</div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8d5a20] via-[#d8a86f] to-[#f4d69b] transition-all duration-700"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

function MoneyPreviewTheater({
  profile,
  user,
}: {
  profile: WealthProfile;
  user: UserInfo;
}) {
  const scoreItems = [
    { key: "earning", label: "버는 힘", score: profile.scores.earning },
    { key: "saving", label: "모으는 힘", score: profile.scores.saving },
    { key: "growing", label: "키우는 힘", score: profile.scores.growing },
    { key: "keeping", label: "지키는 힘", score: profile.scores.keeping },
  ];
  const weakest = [...scoreItems].sort((x, y) => x.score - y.score)[0];

  // 실제 프로젝트에 존재하는 도훈 이미지 풀에서 장면별 표정을 고른다.
  // reveal=놀람/발견, analysis=진지한 분석, decision=핵심 지적, mystery=결제 직전 궁금증.
  const moneyImages = {
    surprised: pickDohoonSceneImage({
      user,
      categoryId: "money",
      sceneOrder: 1,
      imageKey: "reveal",
      salt: "money-surprised-reveal",
    }),
    serious: pickDohoonSceneImage({
      user,
      categoryId: "money",
      sceneOrder: 2,
      imageKey: "analysis",
      salt: "money-serious-analysis",
    }),
    pointing: pickDohoonSceneImage({
      user,
      categoryId: "money",
      sceneOrder: 4,
      imageKey: "decision",
      salt: "money-peak-decision",
    }),
    mystery: pickDohoonSceneImage({
      user,
      categoryId: "money",
      sceneOrder: 5,
      imageKey: "mystery",
      salt: "money-paid-curiosity",
    }),
  };

  const MoneyPhoto = ({
    src,
    alt,
    position = "center top",
  }: {
    src: string;
    alt: string;
    position?: string;
  }) => (
    <div className="relative min-h-[430px] overflow-hidden bg-black sm:min-h-[560px]">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: position }}
        onError={(event) => {
          const image = event.currentTarget;
          if (image.dataset.fallbackApplied === "true") return;
          image.dataset.fallbackApplied = "true";
          image.src = "/characters/dohoon.png";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
    </div>
  );

  return (
    <section className="mt-5 overflow-hidden border border-[#765634] bg-[#0b0908] text-white shadow-[0_34px_120px_rgba(0,0,0,.5)]">
      {/* 01 놀라는 도훈 + 금액 */}
      <article className="relative bg-black">
        <MoneyPhoto src={moneyImages.surprised} alt="돈그릇을 보고 놀라는 도훈" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <div className="w-fit border border-[#d8a86f] bg-black/70 px-3 py-1 text-[10px] font-black tracking-[0.22em] text-[#f1ca89]">
            MONEY REVEAL
          </div>
          <div className="mt-4 break-keep text-[24px] font-black leading-9 text-[#f5efe6]">
            “잠깐. {nameOf(user)}, 이 사주…
            <br />생각보다 돈 그릇이 큰데?”
          </div>
          <div className="mt-5 text-[12px] font-black tracking-[0.16em] text-[#c7aa83]">
            이 사주가 평생 다룰 수 있는 재산 규모
          </div>
          <div className="mt-1 break-keep text-[52px] font-black leading-none tracking-[-0.08em] text-[#f0c56a] sm:text-[78px]">
            {profile.capacity.range}
          </div>
          <p className="mt-4 max-w-xl break-keep text-[15px] font-bold leading-7 text-[#ddd1c4]">
            현재 통장 잔고가 아니라, 맞는 돈길을 잡았을 때 이 사주가 감당할 수 있는 재물의 크기다.
          </p>
        </div>
      </article>

      {/* 02 반전: 활용도 */}
      <article className="grid bg-[#e8dfd1] text-black md:grid-cols-2">
        <MoneyPhoto src={moneyImages.serious} alt="심각하게 재물운을 분석하는 도훈" />
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <div className="w-fit border-2 border-black bg-[#d8a86f] px-3 py-1 text-[10px] font-black tracking-[0.18em]">
            BUT
          </div>
          <h3 className="mt-4 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] sm:text-[46px]">
            그런데 큰 돈그릇이
            <br />그대로 내 돈이 되는 건 아니다.
          </h3>
          <div className="mt-6 text-[13px] font-black text-[#67584b]">현재 재물 활용도</div>
          <div className="mt-1 text-[76px] font-black leading-none tracking-[-0.08em] text-[#9b201b]">
            {profile.utilization}%
          </div>
          <p className="mt-5 break-keep text-[16px] font-bold leading-8 text-[#51453b]">
            지금 방식대로만 가면 돈그릇 전체를 쓰지 못한다. 네 재물운에는 분명히 <strong className="text-black">돈이 커지는 방식</strong>과 <strong className="text-black">돈을 막는 방식</strong>이 따로 있다.
          </p>
        </div>
      </article>

      {/* 03 능력치: 답이 아니라 궁금증 */}
      <article className="bg-[#15110e] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">MONEY POWER</div>
          <h3 className="mt-3 text-[30px] font-black tracking-[-0.05em] sm:text-[42px]">돈의 네 가지 힘</h3>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {scoreItems.map((item) => (
              <div key={item.key} className="border border-[#4d3a28] bg-[#0b0908] p-5">
                <div className="flex items-end justify-between gap-4">
                  <div className="text-lg font-black">{item.label}</div>
                  <div className="text-[38px] font-black leading-none text-[#f0c56a]">{clampScore(item.score)}</div>
                </div>
                <div className="mt-4 h-2 overflow-hidden bg-white/10">
                  <div className="h-full bg-[#d8a86f]" style={{ width: `${clampScore(item.score)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-l-4 border-[#b83a32] bg-[#26120f] p-5">
            <div className="text-sm font-black text-[#e9b0a8]">네 돈을 막는 첫 번째 구멍</div>
            <div className="mt-2 text-[25px] font-black text-white">{weakest.label}</div>
            <p className="mt-2 break-keep text-sm font-bold leading-7 text-[#d7c8bc]">
              돈을 못 버는 사주가 아니다. 강한 힘을 어떻게 써야 하는지보다, 약한 축을 그대로 두고 돈을 키우려 할 때 손실이 커진다.
            </p>
          </div>
        </div>
      </article>

      {/* 04 피크는 공개, 방법은 잠금 */}
      <article className="relative min-h-[560px] overflow-hidden bg-black">
        <img
          src={moneyImages.pointing}
          alt="재물 피크를 발견한 도훈"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-80"
          onError={(event) => {
            const image = event.currentTarget;
            if (image.dataset.fallbackApplied === "true") return;
            image.dataset.fallbackApplied = "true";
            image.src = "/characters/dohoon.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/15" />
        <div className="relative flex min-h-[560px] max-w-2xl flex-col justify-center p-6 sm:p-10">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">BIG MONEY WINDOW</div>
          <h3 className="mt-4 break-keep text-[34px] font-black leading-[1.16] tracking-[-0.055em] sm:text-[50px]">
            네 돈은 평생
            <br />똑같이 움직이지 않는다.
          </h3>
          <div className="mt-7 text-sm font-black text-[#c9b89f]">가장 큰 돈이 움직이는 구간</div>
          <div className="mt-1 text-[58px] font-black leading-none tracking-[-0.07em] text-[#f0c56a] sm:text-[78px]">
            {profile.windows.peak.age}
          </div>
          <div className="mt-3 text-[23px] font-black text-white">최대 재물 피크 · {profile.peakRange}</div>
          <p className="mt-5 break-keep text-[16px] font-bold leading-8 text-[#ddd2c5]">
            이 시기가 강하다는 것까지는 무료에서 공개한다. 하지만 <strong className="text-[#f0c56a]">이때 직장·사업·거래·자산 중 무엇을 잡아야 실제 돈이 되는지</strong>는 사람마다 완전히 다르다.
          </p>
        </div>
      </article>

      {/* 05 의미심장한 도훈 + 결제 직전 */}
      <article className="grid bg-[#e5b75f] text-black md:grid-cols-2">
        <div className="order-2 flex flex-col justify-center p-6 sm:p-9 md:order-1">
          <div className="w-fit border-2 border-black bg-black px-3 py-1 text-[10px] font-black tracking-[0.18em] text-[#f0c56a]">
            THE QUESTION
          </div>
          <h3 className="mt-5 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] sm:text-[48px]">
            그럼 {profile.capacity.range}을
            <br />실제 내 돈으로 만들려면?
          </h3>
          <p className="mt-5 break-keep text-[16px] font-black leading-8">
            돈복이 있는지는 이미 봤다. 이제 중요한 건 <strong>어디서 벌고, 언제 키우고, 무엇을 피해야 이 돈이 네 것이 되는가</strong>다.
          </p>

          <div className="mt-7 grid gap-2">
            {[
              "무슨 방식으로 벌어야 돈이 가장 빨리 커지는가",
              "직장·사업·부업 중 어디에 돈줄이 붙는가",
              "첫 번째로 돈이 크게 움직이는 나이",
              "재산이 가장 커지는 피크에서 해야 할 선택",
              "큰돈을 잃기 쉬운 정확한 위험 구간",
              "돈이 들어와도 남지 않는 진짜 이유",
              "돈이 자산으로 굳는 시기와 행동",
            ].map((item) => (
              <div key={item} className="border-2 border-black bg-[#f6dfaa] px-4 py-3 text-sm font-black leading-6">
                🔒 {item}
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 md:order-2">
          <MoneyPhoto src={moneyImages.mystery} alt="의미심장하게 웃는 도훈" position="center 8%" />
        </div>
      </article>
    </section>
  );
}


function MoneyPaidUnlockCard({
  profile,
  category,
  isLocalTest,
  fullLoading,
  onPay,
  onTest,
}: {
  profile: WealthProfile;
  category: Category;
  isLocalTest: boolean;
  fullLoading: boolean;
  onPay: () => void;
  onTest: () => void;
}) {
  const unlocked = [
    { label: "최대 재물 돈문", value: profile.windows.peak.age, note: "인생에서 돈의 크기가 가장 크게 움직이는 구간" },
    { label: "재물 위험구간", value: "정확한 나이 잠금", note: "큰돈이 움직일수록 같이 조심해야 하는 선택" },
    { label: "돈이 내 것이 되는 시기", value: "정확한 나이 잠금", note: "번 돈이 소비가 아니라 자산으로 굳는 구간" },
  ];

  return (
    <section className="mt-6 overflow-hidden rounded-[32px] border border-[#d8a86f] bg-[radial-gradient(circle_at_82%_12%,rgba(216,168,111,0.18),transparent_34%),linear-gradient(145deg,#211406,#0c0907_72%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] md:p-6">
      <div className="rounded-full border border-[#7a5b37] bg-black/42 px-4 py-2 text-center text-[10px] font-black tracking-[0.22em] text-[#d8a86f]">
        FREE RESULT → FULL MONEY REPORT
      </div>

      <h2 className="mt-5 break-keep text-[28px] font-black leading-tight tracking-[-0.06em] text-white md:text-[34px]">
        네 돈그릇은 이미 보였다.
        <br />
        <span className="text-[#f2cf8b]">이제 언제, 무엇으로 채우는지를 본다.</span>
      </h2>

      <p className="mt-4 break-keep text-sm font-bold leading-7 text-[#d8d0c6]">
        무료에서 나온 <span className="text-white">{profile.capacity.range}</span>, 활용도 <span className="text-white">{profile.utilization}%</span>, 4대 재물 점수와 돈문 판정은 결제 후에도 바뀌지 않는다. 전체 리포트는 같은 판정을 이어서 왜 그런지와 실제 돈길을 깊게 푼다.
      </p>

      <div className="mt-5 grid gap-3">
        {unlocked.map((item, index) => (
          <div key={item.label} className="relative overflow-hidden rounded-[24px] border border-[#7a5b37] bg-black/34 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black text-[#d8a86f]">{item.label}</div>
                <div className={cx("mt-1 text-xl font-black", index === 0 ? "text-[#f2cf8b]" : "text-white")}>{item.value}</div>
                <p className="mt-2 break-keep text-xs font-bold leading-5 text-[#a99f94]">{item.note}</p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d8a86f] bg-[#211607] text-lg">{index === 0 ? "🔥" : "🔒"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-[#7a5b37] bg-[#120d09] p-4">
        <div className="text-sm font-black text-white">전체 리포트에서 바로 이어지는 내용</div>
        <div className="mt-3 grid gap-2 text-sm font-bold text-[#efe6da] sm:grid-cols-2">
          {[
            "최대 돈문에서 돈이 열리는 실제 방식",
            "직장·사업·거래·자산 중 내 1순위 돈길",
            "재물 위험구간의 정확한 나이와 피할 선택",
            "돈이 자산으로 굳는 시기와 남기는 방법",
            "내 돈그릇을 막는 원인의 현실 장면",
            "무료 4대 점수를 왜 그렇게 판정했는지",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-[#7a5b37] bg-black/35 px-3 py-3">✓ {item}</div>
          ))}
        </div>
      </div>

      <p className="mt-5 break-keep text-center text-base font-black leading-7 text-[#f4eadc]">
        “돈그릇이 커도 때와 돈길을 못 잡으면 그릇만 크고 비어 있다.”
      </p>

      <button
        type="button"
        onClick={onPay}
        className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f2c76e] to-[#b78343] px-5 py-5 text-base font-black text-black shadow-[0_18px_54px_rgba(216,168,111,0.2)]"
      >
        내 평생 재물 흐름 전체 보기 · {category.price.toLocaleString()}원
      </button>

      {isLocalTest ? (
        <button
          type="button"
          onClick={onTest}
          disabled={fullLoading}
          className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 text-sm font-black text-black disabled:opacity-60"
        >
          {fullLoading ? "테스트 전체 리포트 생성 중..." : "로컬 테스트용 전체 리포트 바로 보기"}
        </button>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[#7a5b37] bg-black/28 p-4 text-xs leading-6 text-[#a99f94]">
        서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 즉시 디지털 리포트가 생성됩니다. 디지털 콘텐츠 특성상 리포트 생성이 시작되었거나 결과 열람이 가능한 경우 단순 변심 환불은 제한될 수 있습니다.
      </div>
    </section>
  );
}

function getCategoryPreviewContinuityText(profile: CategoryPreviewProfile) {
  if (profile.kind === "today") return `오늘 ${profile.overallScore}점 · 가장 좋은 시간 ${profile.bestTime} · 강한 운 ${profile.strongestArea}`;
  if (profile.kind === "career") return `직장형 ${profile.split.office} : 내 판형 ${profile.split.own} · 중심 판정 ${profile.verdict}`;
  if (profile.kind === "love") return `연애운 ${profile.loveScore} · 결혼운 ${profile.marriageScore} · 강한 인연 흐름 ${profile.strongWindow}`;
  if (profile.kind === "health") return `몸 리듬 ${profile.overallScore}점 · 먼저 챙길 곳 ${profile.primaryWeakness} · 주의구간 ${profile.cautionWindow}`;
  if (profile.kind === "compatibility") return `전체 궁합 ${profile.overallScore}점 · 연애 ${profile.loveScore} · 결혼 ${profile.marriageScore}`;
  if (profile.kind === "year") return `${profile.year}년 ${profile.overallScore}점 · 최고운 ${profile.bestMonth}월 · 핵심 테마 ${profile.theme}`;
  if (profile.kind === "lifeFlow") return `큰 대운 ${profile.chanceCount}번 · 첫 상승 ${profile.firstRise} · 최대구간 ${profile.biggestWindow}`;
  if (profile.kind === "lifetime") return `가장 센 복 ${profile.strongestBlessing.label} ${profile.strongestBlessing.score}점 · 최대 전환기 ${profile.turningWindow}`;
  return `도훈의 무료 판정 ${profile.verdict} · 지금 할 것 ${profile.doNow}`;
}


function CareerStoryWebtoon({
  profile,
  user,
  freeComicScenes = [],
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "career" }>;
  user: UserInfo;
  freeComicScenes?: CareerFreeComicScene[];
}) {
  const protagonistGender: RelationshipVisualProfile["gender"] =
    user.gender === "여성" ? "female" : "male";

  const protagonistProfile: RelationshipVisualProfile = {
    gender: protagonistGender,
    mood: profile.split.own >= 60 ? "confident" : profile.split.office >= 60 ? "clean" : "mature",
    style: profile.split.own >= 60 ? "minimal" : "office",
    energy: profile.split.own >= 60 ? "dominant" : profile.split.office >= 60 ? "calm" : "confident",
  };

  const protagonist = pickRelationshipModel(
    protagonistProfile,
    buildRelationshipModelSeed(user, "career", "career-webtoon-protagonist"),
  );

  const ownDominant = profile.split.own >= 60;
  const officeDominant = profile.split.office >= 60;
  const mixed = !ownDominant && !officeDominant;

  const routeScenes = [...freeComicScenes].sort((a, b) => a.order - b.order);
  const routeScene = (order: number) => routeScenes.find((item) => item.order === order);

  const dohoonImageFor = (order: number, key?: string) =>
    pickDohoonSceneImage({
      user,
      categoryId: "career",
      sceneOrder: order,
      imageKey: key,
      salt: routeScene(order)?.sceneKey || `career-${order}`,
    });

  const sceneCopy = (order: number, fallback: string) =>
    routeScene(order)?.dialogue || fallback;
  const sceneEmphasis = (order: number, fallback: string) =>
    routeScene(order)?.emphasis || fallback;
  const sceneNarration = (order: number, fallback: string) =>
    routeScene(order)?.narration || fallback;

  const heroLine = ownDominant
    ? "너는 남이 만든 판 안에서 오래 버틸수록 답답해진다."
    : officeDominant
      ? "너는 조직을 버려야 사는 사람이 아니다. 대신 자리와 권한이 커져야 한다."
      : "너는 회사와 내 판 중 하나만 고르는 사람이 아니다. 둘을 연결해야 일이 산다.";

  const twistQuestion = ownDominant
    ? "그럼 당장 사업하면 되겠네?"
    : officeDominant
      ? "그럼 그냥 회사에 오래 있으면 되겠네?"
      : "그럼 회사도 하고 부업도 아무거나 하면 되겠네?";

  const twistAnswer = ownDominant
    ? "아니. 준비 없이 크게 벌이는 게 네 함정이야."
    : officeDominant
      ? "아니. 권한도 이름도 안 커지는 자리에 오래 있으면 더 막혀."
      : "아니. 두 판을 동시에 벌이는 게 아니라, 본업에서 만든 힘을 자기 수익으로 옮겨야 해.";

  const weaponLines = [
    profile.moneyRole,
    profile.strongestSkill,
    profile.primary,
  ].filter(Boolean).slice(0, 3);

  const scores = profile.scores.slice(0, 4);
  const strongestScore = [...scores].sort((a, b) => b.score - a.score)[0];
  const weakestScore = [...scores].sort((a, b) => a.score - b.score)[0];

  const ProtagonistImage = ({
    className = "",
    position = "50% 14%",
    dark = false,
  }: {
    className?: string;
    position?: string;
    dark?: boolean;
  }) => (
    <img
      src={protagonist.path}
      alt={user.gender === "여성" ? "여성 사주 주인공" : "남성 사주 주인공"}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      style={{ objectPosition: position, filter: dark ? "brightness(.58) saturate(.78) contrast(1.08)" : undefined }}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied === "true") return;
        image.dataset.fallbackApplied = "true";
        image.src = protagonistGender === "male"
          ? "/relationship-models/male/m001.webp"
          : "/relationship-models/female/f001.webp";
      }}
    />
  );

  const Bubble = ({
    children,
    dark = false,
    side = "left",
  }: {
    children: ReactNode;
    dark?: boolean;
    side?: "left" | "right";
  }) => (
    <div
      className={cx(
        "relative z-20 max-w-[88%] border-[3px] border-black px-5 py-4 text-[18px] font-black leading-[1.65] tracking-[-0.045em] shadow-[7px_8px_0_rgba(0,0,0,.3)] sm:max-w-[76%] sm:text-[22px]",
        dark ? "bg-[#17110d] text-white" : "bg-[#fffaf1] text-[#21160f]",
        side === "right" ? "ml-auto" : "mr-auto",
      )}
    >
      <span
        className={cx(
          "absolute -top-[13px] h-6 w-6 rotate-45 border-l-[3px] border-t-[3px] border-black",
          dark ? "bg-[#17110d]" : "bg-[#fffaf1]",
          side === "right" ? "right-10" : "left-10",
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );

  return (
    <section className="career-story-webtoon mt-5 overflow-hidden border border-[#7a5b37] bg-black text-white shadow-[0_34px_110px_rgba(0,0,0,.48)]">
      <style jsx>{`
        .career-story-webtoon { font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif; }
        .career-story-webtoon * { border-color: initial !important; }
        .career-cut { position: relative; overflow: hidden; border-bottom: 8px solid #050505 !important; }
        .career-halftone { background-image: radial-gradient(rgba(0,0,0,.18) 1px, transparent 1px); background-size: 8px 8px; }
        .career-speed { background-image: repeating-conic-gradient(from -8deg at 50% 50%, rgba(255,255,255,.09) 0deg 1deg, transparent 1deg 8deg); }
        .career-ink { text-shadow: 3px 3px 0 rgba(0,0,0,.28); }
      `}</style>

      <article className="career-cut min-h-[610px] bg-black sm:min-h-[720px]">
        <ProtagonistImage dark />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/95" />
        <div className="career-speed absolute inset-0 opacity-20" />
        <div className="absolute left-4 top-4 z-20 border-2 border-white bg-black/80 px-3 py-1 text-[10px] font-black tracking-[.18em]">
          무료 일·사업운 · EPISODE 01
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-9 sm:p-9 sm:pb-12">
          <div className="text-sm font-black tracking-[.18em] text-[#f1c96e]">첫 장면</div>
          <h2 className="career-ink mt-3 break-keep text-[40px] font-black leading-[1.05] tracking-[-.075em] sm:text-[62px]">
            {nameOf(user)},<br />일이 안 풀린 게<br />능력 부족 때문일까?
          </h2>
          <p className="mt-5 max-w-xl break-keep text-[17px] font-black leading-8 text-[#efe7db] sm:text-[20px]">
            {sceneCopy(1, heroLine)}
          </p>
        </div>
      </article>

      <article className="career-cut bg-[#e7bd63] text-black">
        <div className="career-halftone absolute inset-0 opacity-40" />
        <div className="relative z-10 p-5 py-10 sm:p-9 sm:py-14">
          <div className="text-center text-xs font-black tracking-[.18em]">도훈의 첫 판정</div>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="border-[4px] border-black bg-white p-4 text-center shadow-[6px_7px_0_#111] sm:p-6">
              <div className="text-sm font-black">직장형</div>
              <div className="mt-2 text-[58px] font-black leading-none tracking-[-.08em] sm:text-[82px]">{profile.split.office}</div>
            </div>
            <div className="text-3xl font-black">VS</div>
            <div className="border-[4px] border-black bg-[#15110d] p-4 text-center text-white shadow-[6px_7px_0_#8b5b15] sm:p-6">
              <div className="text-sm font-black text-[#f1d18a]">내 판형</div>
              <div className="mt-2 text-[58px] font-black leading-none tracking-[-.08em] text-[#f1d18a] sm:text-[82px]">{profile.split.own}</div>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-xl">
            <Bubble>
              “{profile.verdict}”<br />
              <span className="text-[#8b1d1d]">문제는 직업 이름이 아니라 네 판단이 결과에 남느냐야.</span>
            </Bubble>
          </div>
        </div>
      </article>

      <article className="career-cut relative min-h-[560px] bg-[#14100d] sm:min-h-[640px]">
        <img src={dohoonImageFor(4, routeScene(4)?.dohoonImageKey)} alt="도훈" className="absolute inset-0 h-full w-full object-cover object-top opacity-85" onError={(e)=>{e.currentTarget.src='/characters/dohoon.png';}} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/15" />
        <div className="relative z-10 flex min-h-[560px] flex-col justify-center p-5 sm:min-h-[640px] sm:p-9">
          <div className="max-w-xl">
            <div className="text-sm font-black text-[#e7c477]">두 번째 장면 · 반전</div>
            <div className="mt-4 text-[28px] font-black leading-tight sm:text-[42px]">“{sceneCopy(4, twistQuestion)}”</div>
            <div className="mt-6 text-[54px] font-black leading-none tracking-[-.08em] text-[#f2c96c] sm:text-[78px]">아니.</div>
            <p className="mt-5 break-keep text-[18px] font-black leading-8 text-white sm:text-[22px]">{sceneEmphasis(4, twistAnswer)}</p>
          </div>
        </div>
      </article>

      <article className="career-cut bg-[#8b1717] text-white">
        <div className="grid lg:grid-cols-[.95fr_1.05fr]">
          <div className="relative min-h-[360px] overflow-hidden bg-black lg:min-h-[500px]">
            <img src={dohoonImageFor(5, routeScene(5)?.dohoonImageKey)} alt="도훈 경고" className="block h-auto w-full object-contain" onError={(e)=>{e.currentTarget.src='/characters/dohoon.png';}} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>
          <div className="flex min-h-[360px] flex-col justify-center p-5 sm:p-8 lg:min-h-[500px]">
            <div className="w-fit border-2 border-white bg-black px-3 py-1 text-[10px] font-black tracking-[.18em]">경고 컷</div>
            <div className="mt-5 text-sm font-black text-[#ffd1c7]">오래 하면 네 일운을 깎는 자리</div>
            <div className="mt-3 break-keep text-[38px] font-black leading-[1.08] tracking-[-.065em] sm:text-[56px]">{sceneEmphasis(5, profile.avoidWork)}</div>
            <p className="mt-5 break-keep border-t border-white/30 pt-5 text-[17px] font-black leading-8 text-[#ffe6df]">
              바쁘다는 이유만으로 버티지 마. 네 이름·가격·결정권·결과 중 아무것도 남지 않으면 그 일은 경력이 아니라 소모가 된다.
            </p>
          </div>
        </div>
      </article>

      <article className="career-cut bg-[#efe6d7] p-5 text-black sm:p-9">
        <div className="text-xs font-black tracking-[.18em] text-[#88631f]">네가 먼저 가져야 할 무기</div>
        <h3 className="mt-3 break-keep text-[34px] font-black leading-tight tracking-[-.06em] sm:text-[48px]">사업장이 아니라<br />이 셋부터다.</h3>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {weaponLines.map((item, index) => (
            <div key={`${item}-${index}`} className="relative min-h-[170px] border-[3px] border-black bg-white p-5 shadow-[6px_7px_0_#111]">
              <div className="text-[56px] font-black leading-none text-black/10">0{index + 1}</div>
              <div className="mt-[-18px] break-keep text-[22px] font-black leading-7 tracking-[-.045em]">{item}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Bubble side="right">
            “네가 들어간 뒤 <span className="text-[#8b1d1d]">가격·조건·결과 중 하나라도 네 손에 들어오면</span> 그때부터 일복이 돈복으로 바뀐다.”
          </Bubble>
        </div>
      </article>

      <article className="career-cut bg-[#11100f] p-5 sm:p-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[.18em] text-[#e7c477]">일할 때 살아나는 능력</div>
            <h3 className="mt-3 text-[34px] font-black tracking-[-.06em] sm:text-[46px]">네 값이 비싸지는 이유</h3>
          </div>
          {strongestScore ? <div className="text-right"><div className="text-xs font-black text-[#bcae9e]">가장 강함</div><div className="text-4xl font-black text-[#f1cd7c]">{strongestScore.score}</div></div> : null}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {scores.map((item) => {
            const strong = strongestScore?.key === item.key;
            const weak = weakestScore?.key === item.key;
            return (
              <div key={item.key} className={cx("border-2 p-5", strong ? "border-[#f0cb77] bg-[#34230d]" : weak ? "border-[#9e3030] bg-[#2b1111]" : "border-[#51483f] bg-[#1b1917]")}>
                <div className="flex items-end justify-between gap-3">
                  <div className="text-lg font-black">{item.label}</div>
                  <div className={cx("text-5xl font-black", strong ? "text-[#f0cb77]" : weak ? "text-[#ff8585]" : "text-white")}>{item.score}</div>
                </div>
                <p className="mt-3 break-keep text-sm font-bold leading-6 text-[#cfc5b8]">{item.verdict}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 border-l-[7px] border-[#e7c477] bg-white/7 p-4 text-[17px] font-black leading-8">
          {profile.strongestSkill}
        </div>
      </article>

      <article className="career-cut bg-[#f3d47d] p-5 text-black sm:p-9">
        <div className="career-halftone absolute inset-0 opacity-25" />
        <div className="relative z-10">
          <div className="text-xs font-black tracking-[.18em]">현실 체크 · 이런 자리에서 일이 살아난다</div>
          <h3 className="mt-3 break-keep text-[34px] font-black leading-tight tracking-[-.06em] sm:text-[48px]">
            “그래서 실제로<br />어떤 일을 잡아야 하는데?”
          </h3>
          <div className="mt-7 grid gap-3">
            {(routeScene(6)?.bullets?.length ? routeScene(6)!.bullets! : weaponLines).slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-start gap-4 border-[3px] border-black bg-[#fffaf0] p-5 shadow-[6px_7px_0_#111]">
                <div className="grid h-11 w-11 shrink-0 place-items-center bg-black text-lg font-black text-[#f3d47d]">{index + 1}</div>
                <div className="break-keep text-[18px] font-black leading-7 sm:text-[21px]">{item}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 border-[3px] border-black bg-[#17110d] p-5 text-white">
            <div className="text-xs font-black text-[#f3d47d]">도훈의 한 줄 판정</div>
            <p className="mt-2 break-keep text-[20px] font-black leading-8">
              {sceneEmphasis(7, profile.strongestSkill)}
            </p>
          </div>
        </div>
      </article>

      <article className="career-cut relative min-h-[580px] bg-black sm:min-h-[680px]">
        <ProtagonistImage dark position="50% 10%" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/25" />
        <div className="relative z-10 flex min-h-[580px] flex-col justify-end p-5 pb-10 sm:min-h-[680px] sm:p-9 sm:pb-12">
          <div className="text-sm font-black text-[#efc96f]">미래 암시</div>
          <h3 className="mt-3 break-keep text-[38px] font-black leading-[1.08] tracking-[-.065em] sm:text-[58px]">
            {sceneCopy(8, "그리고 네 일 인생에는 판이 크게 바뀌는 때가 있다.")}
          </h3>
          <div className="mt-6 border-l-[7px] border-[#efc96f] bg-black/45 p-5">
            <div className="text-sm font-black text-[#cfc5b8]">첫 번째 큰 전환 흐름</div>
            <div className="mt-2 text-[34px] font-black text-[#efc96f] sm:text-[48px]">{sceneEmphasis(8, profile.transitionWindow)}</div>
          </div>
          <p className="mt-5 max-w-xl break-keep text-[17px] font-bold leading-8 text-[#e7ded4]">
            이때 무조건 회사를 나가라는 뜻은 아니다. <strong className="text-white">어떤 역할을 들고 움직이느냐</strong>가 결과를 가른다.
          </p>
        </div>
      </article>

      <article className="relative bg-[#140d08] p-5 py-12 text-center sm:p-9 sm:py-16">
        <div className="career-halftone absolute inset-0 opacity-15" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-[#efc96f] bg-black text-3xl">🔒</div>
          <div className="mt-5 text-xs font-black tracking-[.22em] text-[#efc96f]">다음 화 잠김</div>
          <h3 className="mt-3 break-keep text-[32px] font-black leading-tight tracking-[-.06em] sm:text-[46px]">
            {sceneCopy(9, "회사에 남을지, 내 판으로 나갈지는 아직 결론이 아니다.")}
          </h3>
          <p className="mx-auto mt-5 max-w-xl break-keep text-[16px] font-bold leading-8 text-[#d6ccc0]">
            {sceneNarration(9, "정확한 직무·사업 구조, 일을 옮겨야 하는 시기, 버텨야 하는 시기, 돈이 붙는 역할은 전체 리포트에서 같은 판정을 이어서 푼다.")}
          </p>
          <div className="mt-7 grid gap-2 text-left sm:grid-cols-2">
            {["내 사주에 맞는 구체적인 직무군", "직장에 남을 때 잡아야 할 자리", "사업으로 갈 때 피해야 할 판", "일운이 크게 열리는 다음 시기"].map((item) => (
              <div key={item} className="border border-[#76614c] bg-black/45 p-4 text-sm font-black leading-6 text-[#efe5d8]">🔒 {item}</div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}


const DOHOON_POOL_COUNTS = {
  "01_today": 2,
  "02_wealth": 18,
  "03_work_business": 6,
  "04_love_marriage": 14,
  "05_health": 2,
  "06_compatibility": 14,
  "07_year": 6,
  "08_life_cycle": 12,
  "09_lifetime": 6,
  "10_worry_consult": 20,
  "11_mystic_special": 30,
} as const;

type DohoonPoolKey = keyof typeof DOHOON_POOL_COUNTS;

type DohoonSceneMeaning =
  | "opening"
  | "thinking"
  | "analysis"
  | "reveal"
  | "warning"
  | "decision"
  | "guide"
  | "confidence"
  | "future"
  | "mystery"
  | "ending";

function stableDohoonHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function getDohoonCategoryPool(categoryId: CategoryId): DohoonPoolKey {
  const map: Record<CategoryId, DohoonPoolKey> = {
    today: "01_today",
    money: "02_wealth",
    career: "03_work_business",
    love: "04_love_marriage",
    health: "05_health",
    compatibility: "06_compatibility",
    monthly: "07_year",
    lifeFlow: "08_life_cycle",
    traditional: "09_lifetime",
    premium: "10_worry_consult",
  };
  return map[categoryId];
}

function getDohoonScenePools(
  categoryId: CategoryId,
  meaning: DohoonSceneMeaning,
): DohoonPoolKey[] {
  const primary = getDohoonCategoryPool(categoryId);
  const byMeaning: Record<DohoonSceneMeaning, DohoonPoolKey[]> = {
    opening: [primary, "01_today", "03_work_business", "09_lifetime", "10_worry_consult"],
    thinking: [primary, "10_worry_consult", "09_lifetime", "03_work_business", "11_mystic_special"],
    analysis: [primary, "03_work_business", "09_lifetime", "10_worry_consult", "01_today"],
    reveal: [primary, "10_worry_consult", "11_mystic_special", "09_lifetime", "03_work_business"],
    warning: [primary, "11_mystic_special", "10_worry_consult", "05_health", "09_lifetime"],
    decision: [primary, "03_work_business", "10_worry_consult", "09_lifetime", "11_mystic_special"],
    guide: [primary, "03_work_business", "01_today", "09_lifetime", "10_worry_consult"],
    confidence: [primary, "03_work_business", "07_year", "09_lifetime", "01_today"],
    future: [primary, "07_year", "08_life_cycle", "09_lifetime", "11_mystic_special"],
    mystery: [primary, "11_mystic_special", "10_worry_consult", "09_lifetime"],
    ending: [primary, "09_lifetime", "07_year", "08_life_cycle", "11_mystic_special"],
  };
  return [...new Set(byMeaning[meaning])];
}

function normalizeDohoonSceneMeaning(value?: string): DohoonSceneMeaning {
  const key = String(value || "").toLowerCase();
  if (key.includes("warning") || key.includes("danger")) return "warning";
  if (key.includes("think")) return "thinking";
  if (key.includes("analysis")) return "analysis";
  if (key.includes("reveal") || key.includes("reversal") || key.includes("secret")) return "reveal";
  if (key.includes("decision") || key.includes("judge") || key.includes("point")) return "decision";
  if (key.includes("guide")) return "guide";
  if (key.includes("confidence") || key.includes("confident")) return "confidence";
  if (key.includes("future") || key.includes("timing")) return "future";
  if (key.includes("mystery") || key.includes("lock")) return "mystery";
  if (key.includes("ending") || key.includes("final")) return "ending";
  return "opening";
}

function buildDohoonPoolPaths(pools: DohoonPoolKey[]) {
  const paths: string[] = [];
  pools.forEach((pool) => {
    const count = DOHOON_POOL_COUNTS[pool];
    for (let index = 1; index <= count; index += 1) {
      paths.push(
        `/characters/dohoon/${pool}/dohun_${String(index).padStart(3, "0")}.webp`,
      );
    }
  });
  return paths;
}

function pickDohoonSceneImage(params: {
  user: UserInfo;
  categoryId: CategoryId;
  sceneOrder: number;
  imageKey?: string;
  salt?: string;
}) {
  const meaning = normalizeDohoonSceneMeaning(params.imageKey);
  const pools = getDohoonScenePools(params.categoryId, meaning);
  const candidates = buildDohoonPoolPaths(pools);
  if (!candidates.length) return "/characters/dohoon.png";

  const seed = stableDohoonHash(
    [
      params.user.year,
      params.user.month,
      params.user.day,
      params.user.birthTime,
      params.user.gender,
      params.categoryId,
      meaning,
      params.sceneOrder,
      params.salt || "",
    ].join("|"),
  );

  return candidates[seed % candidates.length];
}

function getPreviewScene(
  profile: CategoryPreviewProfile,
  order: number,
  fallbackScenes: CareerFreeComicScene[] = [],
) {
  const profileScenes = Array.isArray(profile.webtoonScenes)
    ? profile.webtoonScenes
    : [];
  const scenes = profileScenes.length ? profileScenes : fallbackScenes;
  return scenes.find((scene) => scene.order === order);
}




function extractPaidHealthSection(text: string, titles: string[]) {
  if (!text) return "";
  const normalized = text.replace(/\r/g, "");
  for (const title of titles) {
    const marker = `[${title}]`;
    const start = normalized.indexOf(marker);
    if (start < 0) continue;
    const bodyStart = start + marker.length;
    const rest = normalized.slice(bodyStart);
    const next = rest.search(/\n\s*\[[^\]]+\]/);
    return (next >= 0 ? rest.slice(0, next) : rest).trim();
  }
  return "";
}


function cleanHealthMonthCardBody(value: string) {
  const normalized = String(value || "").replace(/\r/g, "").trim();
  if (!normalized) return "";

  // 서버의 월별 body에 다음 [섹션]이 섞여 들어온 경우 그 직전에서 반드시 끊는다.
  const bracketIndex = normalized.search(/\s*\[[^\]]+\]/);
  const clipped = (bracketIndex >= 0 ? normalized.slice(0, bracketIndex) : normalized).trim();

  // 지나치게 긴 공통 원고가 카드에 복제되는 것도 막는다.
  return clipped.length > 360 ? `${clipped.slice(0, 357).trim()}…` : clipped;
}

function getHealthYearMonthCards(
  yearBody: string,
  fallback: Array<{ month: number; label: string; body: string }>,
) {
  const normalized = String(yearBody || "").replace(/\r/g, "").trim();
  const monthRegex = /(?:^|[^\d])(1[0-2]|[1-9])월(?:\s*전후)?/g;
  const found: number[] = [];
  let match: RegExpExecArray | null;

  // 11월을 1월로 잘못 읽지 않도록 10~12월을 포함한 월 전체 숫자를 잡는다.
  while ((match = monthRegex.exec(normalized)) !== null) {
    const month = Number(match[1]);
    if (month >= 1 && month <= 12 && !found.includes(month)) found.push(month);
  }

  const fallbackByMonth = new Map(fallback.map((item) => [item.month, item]));
  const months = found.length ? found.slice(0, 2) : fallback.map((item) => item.month).slice(0, 2);

  return months.map((month) => {
    const item = fallbackByMonth.get(month);
    return {
      month,
      label: item?.label || `${month}월 전후`,
      body: cleanHealthMonthCardBody(item?.body || ""),
    };
  });
}



function TodayPaidPartReport({
  profile,
  user,
  fullText,
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "today" }>;
  user: UserInfo;
  fullText: string;
}) {
  const sections = splitReportSections(fullText);
  const hero = pickDohoonSceneImage({
    user,
    categoryId: "today",
    sceneOrder: 1,
    imageKey: "opening",
    salt: "today-paid-v201-hero",
  });

  const splitLead = (body: string) => {
    const parts = String(body || "").split(/\n{2,}/).map((v) => v.trim()).filter(Boolean);
    return {
      lead: parts[0] || "",
      rest: parts.slice(1).join("\n\n"),
    };
  };

  const statCards = [
    { label: "오늘 점수", value: `${profile.overallScore}점` },
    { label: "가장 좋은 시간", value: profile.bestTime },
    { label: "가장 강한 운", value: profile.strongestArea },
    { label: "조심할 운", value: profile.warningArea },
  ];

  return (
    <div className="overflow-hidden bg-[#080705] text-white">
      <section className="relative overflow-hidden bg-black">
        <img
          src={hero}
          alt=""
          className="block h-auto w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <div className="text-[10px] font-black tracking-[0.28em] text-[#f2c477]">TODAY FULL REPORT</div>
          <div className="mt-3 text-[58px] font-black leading-none tracking-[-0.07em] text-[#f1c67d] sm:text-[82px]">
            {profile.overallScore}
            <span className="ml-1 text-2xl tracking-normal text-white/55">점</span>
          </div>
          <h2 className="mt-4 max-w-2xl break-keep text-[28px] font-black leading-[1.18] tracking-[-0.05em] sm:text-[44px]">
            {profile.verdict}
          </h2>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-[#5b452d] bg-[#17120d] p-5">
              <div className="text-[10px] font-black tracking-[0.14em] text-[#aa9172]">{item.label}</div>
              <div className="mt-2 break-keep text-[20px] font-black leading-7 text-[#f1c67d]">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[26px] bg-[#1c2617] p-5">
            <div className="text-[10px] font-black tracking-[0.18em] text-[#b8d58b]">오늘 잡을 것</div>
            <div className="mt-3 break-keep text-xl font-black leading-8">{profile.doOne}</div>
          </div>
          <div className="rounded-[26px] bg-[#2b1717] p-5">
            <div className="text-[10px] font-black tracking-[0.18em] text-[#e6a3a3]">오늘 피할 것</div>
            <div className="mt-3 break-keep text-xl font-black leading-8">{profile.avoidOne}</div>
          </div>
        </div>
      </section>

      {sections.map((section, index) => {
        const { lead, rest } = splitLead(section.body);
        const image = pickDohoonSceneImage({
          user,
          categoryId: "today",
          sceneOrder: index + 2,
          imageKey: /오전|시간|오후|저녁/i.test(section.title) ? "decision" : index % 2 ? "analysis" : "mystery",
          salt: `today-paid-v201-${index}`,
        });

        return (
          <section key={`${section.title}-${index}`} className="border-t border-white/8">
            <div className="relative min-h-[360px] overflow-hidden bg-[#11100e]">
              <img
                src={image}
                alt=""
                className="block h-auto w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
                <div className="text-[10px] font-black tracking-[0.24em] text-[#f1c67d]">
                  PART {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 break-keep text-[28px] font-black leading-tight sm:text-[40px]">{section.title}</h3>
                {lead ? (
                  <p className="mt-4 max-w-2xl break-keep text-[15px] font-bold leading-7 text-white/88 sm:text-[17px]">
                    {lead}
                  </p>
                ) : null}
              </div>
            </div>
            {rest ? (
              <div className="bg-[#0d0b09] px-6 py-8 sm:px-9">
                <div className="whitespace-pre-line break-keep text-[15px] font-medium leading-8 text-[#d8cec2]">{rest}</div>
              </div>
            ) : null}
          </section>
        );
      })}

      <section className="border-t border-white/8 bg-[#0a0908] px-6 py-8 text-[12px] font-semibold leading-6 text-white/45 sm:px-9">
        서비스 제공기간: 결제 완료 후 즉시 생성됩니다. 디지털 콘텐츠 특성상 생성이 시작되었거나 결과를 열람할 수 있는 경우
        단순 변심 환불은 제한될 수 있습니다.
      </section>
    </div>
  );
}


function CareerFreeResultV208({
  profile,
}: {
  profile: any;
}) {
  const top3 = Array.isArray(profile?.top3) ? profile.top3 : [];
  return (
    <section className="space-y-5 text-[#171717]">
      <div className="rounded-[28px] border border-[#d6a45f] bg-white p-5">
        <div className="text-xs font-black tracking-[0.18em] text-[#8d6738]">WORK & BUSINESS</div>
        <div className="mt-2 text-2xl font-black text-[#171717]">{profile?.verdict || "일·사업운 첫 판정"}</div>
        <p className="mt-4 break-keep text-[15px] font-bold leading-8 text-[#37312b]">{profile?.freeHeadline}</p>
        <p className="mt-3 break-keep text-[15px] leading-8 text-[#4b443d]">{profile?.freeBody}</p>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white p-5">
        <div className="text-lg font-black text-[#171717]">회사형 vs 내 판</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f4f1ec] p-4">
            <div className="text-xs font-bold text-[#6d6256]">회사형</div>
            <div className="mt-1 text-3xl font-black text-[#171717]">{profile?.split?.office ?? "-"}%</div>
          </div>
          <div className="rounded-2xl bg-[#f4f1ec] p-4">
            <div className="text-xs font-bold text-[#6d6256]">내 판·독립형</div>
            <div className="mt-1 text-3xl font-black text-[#171717]">{profile?.split?.own ?? "-"}%</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white p-5">
        <div className="text-lg font-black text-[#171717]">돈 되는 직업길</div>
        <div className="mt-4 space-y-4">
          {top3.slice(0, 2).map((item: any) => (
            <div key={`${item.rank}-${item.label}`} className="border-l-4 border-[#d2a15e] pl-4">
              <div className="text-xs font-black text-[#9a6c31]">{item.rank}순위</div>
              <div className="mt-1 text-xl font-black text-[#171717]">{item.label}</div>
              <p className="mt-2 break-keep text-[14px] leading-7 text-[#4b443d]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#d6a45f] bg-[#1b150f] p-5">
        <div className="text-xs font-black tracking-[0.16em] text-[#e6b970]">여기까지 봐야 사업운이 산다</div>
        <p className="mt-3 break-keep text-[17px] font-black leading-8 text-white">
          {profile?.curiosityHook || "같은 업종이라도 어디에서 무엇을 쥐느냐에 따라 돈그릇이 완전히 달라진다."}
        </p>
        <div className="mt-5 space-y-2 text-sm leading-7 text-white/75">
          <div>🔒 3순위 현실 대안</div>
          <div>🔒 직장에 남는다면 잡아야 할 자리</div>
          <div>🔒 밖으로 나가면 돈이 커지는 구조</div>
          <div>🔒 내 돈그릇이 커지는 조건</div>
          <div>🔒 사업을 한다면 돈 되는 업종 TOP 3</div>
        </div>
      </div>
    </section>
  );
}

function YearFreeResultV206({
  profile,
  scoreVisual,
  onUnlock,
}: {
  profile: any;
  scoreVisual?: any;
  onUnlock?: () => void;
}) {
  const metrics = [
    ["재물운", Number(profile?.moneyScore ?? scoreVisual?.money ?? 0)],
    ["직장운", Number(profile?.careerScore ?? scoreVisual?.career ?? 0)],
    ["사업운", Number(profile?.businessScore ?? scoreVisual?.business ?? 0)],
    ["연애운", Number(profile?.loveScore ?? scoreVisual?.love ?? 0)],
    ["결혼운", Number(profile?.marriageScore ?? scoreVisual?.marriage ?? 0)],
    ["인간관계운", Number(profile?.relationshipScore ?? scoreVisual?.relationship ?? 0)],
    ["건강운", Number(profile?.healthScore ?? scoreVisual?.health ?? 0)],
  ].filter(([, v]) => Number.isFinite(v) && Number(v) > 0);

  return (
    <div className="space-y-6 text-[#171717]">
      <section className="rounded-[28px] border border-[#d6a45f] bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold tracking-[0.18em] text-[#7a684f]">THIS YEAR</div>
        <div className="mt-2 text-3xl font-black text-[#171717]">올해운세 {profile?.overallScore ?? "-"}점</div>
        <p className="mt-4 break-keep text-[16px] font-bold leading-8 text-[#2b2621]">
          {profile?.freeVerdict || `올해 가장 강한 운은 ${profile?.strongestArea ?? "계산 중"}이고, 가장 약한 운은 ${profile?.weakestArea ?? "계산 중"}이다.`}
        </p>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="text-xl font-black text-[#171717]">올해 운세판</div>
        <div className="mt-4 space-y-4">
          {metrics.map(([label, value]) => (
            <div key={String(label)}>
              <div className="flex items-center justify-between text-sm font-bold text-[#222]">
                <span className="text-[#222]">{label}</span>
                <span className="text-[#111]">{value}점</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-black" style={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-black/10 bg-white p-5">
          <div className="text-xs font-black tracking-[0.14em] text-[#9b6d31]">올해 가장 강한 운</div>
          <div className="mt-2 text-2xl font-black text-[#171717]">{profile?.strongestArea ?? "-"}</div>
          <p className="mt-3 break-keep text-[14px] leading-7 text-[#45403a]">{profile?.strongestText || profile?.headline}</p>
        </div>
        <div className="rounded-[24px] border border-black/10 bg-white p-5">
          <div className="text-xs font-black tracking-[0.14em] text-[#8b5c5c]">올해 가장 약한 운</div>
          <div className="mt-2 text-2xl font-black text-[#171717]">{profile?.weakestArea ?? "-"}</div>
          <p className="mt-3 break-keep text-[14px] leading-7 text-[#45403a]">{profile?.weakestText || "약한 운에서는 큰 결정을 서두르지 않는 것이 좋다."}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f5f2ed] p-4">
            <div className="text-xs font-bold text-[#6d6256]">올해 최고 달</div>
            <div className="mt-1 text-2xl font-black text-[#171717]">{profile?.bestMonth ?? "-"}</div>
          </div>
          <div className="rounded-2xl bg-[#f5f2ed] p-4">
            <div className="text-xs font-bold text-[#6d6256]">올해 주의 달</div>
            <div className="mt-1 text-2xl font-black text-[#171717]">{profile?.cautionMonth ?? profile?.relationshipWarningMonth ?? "-"}</div>
          </div>
        </div>
        <p className="mt-5 break-keep text-[15px] leading-8 text-[#3c3731]">{profile?.bestMonthText}</p>
        <p className="mt-3 break-keep text-[15px] leading-8 text-[#3c3731]">{profile?.cautionMonthText}</p>
      </section>

      <section className="rounded-[28px] border border-[#d6a45f] bg-[#1b150f] p-5 shadow-sm">
        <div className="text-xs font-black tracking-[0.16em] text-[#e6b970]">도훈이 아직 안 보여준 것</div>
        <p className="mt-3 break-keep text-[17px] font-black leading-8 text-white">
          {profile?.curiosityHook || "돈이 들어오는 달과 새는 달, 일이 크게 움직이는 달은 서로 다르다. 이걸 확인해야 올해 운을 제대로 쓸 수 있다."}
        </p>
        <div className="mt-5 space-y-2 text-sm leading-7 text-white/75">
          <div>🔒 돈이 실제로 들어오는 달 · 돈이 새는 달</div>
          <div>🔒 직장운과 사업운이 각각 움직이는 시기</div>
          <div>🔒 인연이 강하게 들어오는 달 · 관계 주의 달</div>
          <div>🔒 몸과 생활 리듬을 조심할 달</div>
          <div>🔒 올해 반드시 잡아야 할 것 · 버려야 할 것</div>
        </div>
        {onUnlock ? (
          <button onClick={onUnlock} className="mt-5 w-full rounded-2xl bg-white px-4 py-4 text-base font-black text-black">
            올해운세 전체 보기
          </button>
        ) : null}
      </section>
    </div>
  );
}

function LifeFlowFreeResultV206({ profile, user, onUnlock }: { profile: any; user?: UserInfo; onUnlock?: () => void }) {
  const rows = [
    ["첫 상승", profile?.firstRise, profile?.firstRiseText],
    ["가장 큰 기회", profile?.biggestWindow, profile?.biggestWindowText],
    ["주의 전환", profile?.cautionWindow, profile?.cautionWindowText],
    ["후반 인생", profile?.lateLife, profile?.lateLifeText],
  ].filter(([, v]) => v);
  const dohoonImage = user ? pickDohoonSceneImage({
    user,
    categoryId: "lifeFlow",
    sceneOrder: 4,
    imageKey: "mystery",
    salt: "lifeflow-free-premium-hook",
  }) : "/characters/dohoon-hero.png";
  const lockedItems = Array.isArray(profile?.lockedItems) ? profile.lockedItems : [
    "내 인생에 큰 대운이 총 몇 번 들어오는가",
    "제1·제2·제3대운의 정확한 나이와 연도",
    "그중 인생에서 가장 중요한 대운",
    "그 대운에서 반드시 잡아야 하는 기회",
  ];

  return (
    <div className="space-y-6 text-[#2b2118]">
      <section className="overflow-hidden rounded-[30px] border border-[#6f593b] bg-[#24201c] text-[#f7efdf] shadow-[0_24px_70px_rgba(36,32,28,0.18)]">
        <div className="px-5 py-6 sm:px-6">
          <div className="text-xs font-black tracking-[0.18em] text-[#cba96f]">LIFE FLOW</div>
          <div className="mt-2 text-3xl font-black">인생대운</div>
          <div className="mt-2 text-sm leading-6 text-[#f7efdf]/70">언제부터 풀리고, 어느 나이대에서 판이 바뀌는지를 보는 리포트</div>
          <div className="mt-6 rounded-[24px] border border-[#cba96f]/35 bg-black/20 p-5">
            <div className="text-xs font-black text-[#cba96f]">무료 첫 판정</div>
            <p className="mt-2 break-keep text-[17px] font-black leading-8">
              {profile?.freeVerdict || profile?.headline}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#dfd2bc] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-[11px] font-black tracking-[0.15em] text-[#9b7946]">내 인생의 흐름을 실제로 풀어보면</div>
        <div className="mt-5 space-y-4">
          {rows.map(([label, value, text], index) => (
            <div key={String(label)} className="rounded-[22px] border border-[#e8ddca] bg-white/70 p-5">
              <div className="flex items-end justify-between gap-3">
                <div className="text-xs font-black text-[#8b6a3c]">{label}</div>
                <div className="text-xl font-black text-[#2b2118]">{String(value)}</div>
              </div>
              {text ? <p className="mt-3 break-keep text-[15px] leading-7 text-[#493d30]">{String(text)}</p> : null}
              {index === 1 ? <div className="mt-3 text-xs font-black text-[#9b7946]">※ 가장 강한 정확한 나이·연도는 전체 리포트에서 공개</div> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#6f593b] bg-[#24201c] text-[#f7efdf] shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
        <div className="relative">
          <SafeImage src={dohoonImage} alt="인생대운을 설명하는 도훈" fallback="🔮" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-5 pb-6 pt-20">
            <div className="text-xs font-black tracking-[0.14em] text-[#d7b477]">도훈의 한마디</div>
            <p className="mt-2 break-keep text-[18px] font-black leading-8">
              {profile?.dohoonHook || "진짜 중요한 건 가장 큰 대운이 정확히 언제 오고, 그때 무엇을 잡아야 하는지다."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#dfd2bc] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-xs font-black tracking-[0.14em] text-[#9b7946]">전체 리포트에서 공개</div>
        <div className="mt-2 text-2xl font-black">여기서부터가 진짜 대운이다</div>
        <div className="mt-4 space-y-3">
          {lockedItems.map((item: string) => (
            <div key={item} className="rounded-2xl border border-[#e6dac6] bg-white/75 px-4 py-3 text-sm font-bold leading-6 text-[#493d30]">🔒 {item}</div>
          ))}
        </div>
        <p className="mt-5 break-keep text-sm leading-7 text-[#6b5944]">
          무료에서는 인생 곡선과 첫 상승·큰 기회·주의 구간까지 보여준다. 전체판에서는 그 흐름을 실제 나이와 연도로 좁히고, 그때 들어오는 기회를 어떻게 잡아야 하는지까지 판정한다.
        </p>
        {onUnlock ? (
          <button onClick={onUnlock} className="mt-5 w-full rounded-2xl bg-[#2b2118] px-4 py-4 text-base font-black text-[#f7efdf]">
            내 인생의 가장 큰 대운 확인하기
          </button>
        ) : null}
      </section>
    </div>
  );
}

function LifetimeFreeResultV206({ profile, onUnlock }: { profile: any; onUnlock?: () => void }) {
  const metrics = Array.isArray(profile?.metrics) ? profile.metrics : [];
  const moneyBowlPreview = (profile as any)?.moneyBowlPreview;
  const sortedMetrics = [...metrics].sort((a: any, b: any) => Number(b?.score || 0) - Number(a?.score || 0));
  const strongestMetric = sortedMetrics[0] || profile?.strongestBlessing || null;
  const secondMetric = sortedMetrics[1] || null;
  const careerRows = metrics.filter((item: any) =>
    /일|직업|사업|재물|돈/.test(String(item?.label || ""))
  ).slice(0, 3);

  return (
    <div className="space-y-6 text-[#2b2118]">
      <section className="overflow-hidden rounded-[30px] border border-[#d8c8a8] bg-[#17120e] shadow-sm">
        <div className="p-6 text-[#fff8e8]">
          <div className="text-xs font-semibold tracking-[0.22em] text-[#d8b86a]">LIFETIME REPORT</div>
          <div className="mt-2 text-3xl font-black">평생종합사주</div>
          <div className="mt-3 text-sm leading-7 text-[#eee2ca]">
            돈·일·사랑·가족·건강·대운을 따로 떼지 않고, 결국 어떤 인생으로 모이는지를 보는 리포트
          </div>
          {profile?.headline ? (
            <div className="mt-5 rounded-2xl border border-[#d8b86a]/30 bg-white/5 p-4 text-base font-bold leading-7 text-[#fff8e8]">
              {String(profile.headline)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e1d4bb] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-xs font-bold tracking-[0.16em] text-[#8a6a2f]">평생에서 먼저 보이는 두 축</div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {profile?.strongestBlessing ? (
            <div className="rounded-2xl bg-[#f4ead6] p-4">
              <div className="text-xs font-bold text-[#7b6544]">가장 강한 복</div>
              <div className="mt-1 text-xl font-black text-[#2b2118]">{String(profile.strongestBlessing?.label || profile.strongestBlessing)}</div>
              <div className="mt-2 text-sm leading-6 text-[#5b4a38]">
                이 복은 그냥 '좋다'로 끝나는 게 아니라, 평생 돈·일·사람 중 어디에서 실제 결과가 남는지를 결정하는 중심축이다.
              </div>
            </div>
          ) : null}
          {profile?.weakestHole ? (
            <div className="rounded-2xl bg-[#f4ead6] p-4">
              <div className="text-xs font-bold text-[#7b6544]">가장 약한 구멍</div>
              <div className="mt-1 text-xl font-black text-[#2b2118]">{String(profile.weakestHole?.label || profile.weakestHole)}</div>
              <div className="mt-2 text-sm leading-6 text-[#5b4a38]">
                평생 같은 방식으로 반복해서 발목을 잡을 수 있는 자리다. 이 부분을 어떻게 관리하느냐에 따라 강한 복을 실제로 남길 수 있는지가 갈린다.
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e1d4bb] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-xs font-bold tracking-[0.16em] text-[#8a6a2f]">내 평생 운의 강약</div>
        <div className="mt-2 text-2xl font-black text-[#2b2118]">
          {strongestMetric ? `${String(strongestMetric.label)}이 가장 강하다` : "강한 운부터 먼저 본다"}
        </div>
        {strongestMetric ? (
          <p className="mt-3 text-sm leading-7 text-[#5b4a38]">
            네 사주에서 가장 강하게 잡힌 건 {String(strongestMetric.label)} {Number(strongestMetric.score)}점이다.
            {secondMetric ? ` 그다음은 ${String(secondMetric.label)} ${Number(secondMetric.score)}점이다.` : ""}
            아래 점수는 좋고 나쁨의 순위가 아니라, 평생 어느 분야의 힘이 더 강하게 작동하는지를 비교한 것이다.
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          {sortedMetrics.map((item: any, idx: number) => (
            <div key={String(item.key || item.label)}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-[#4a3a2b]">{String(item.label)}</span>
                  {idx === 0 ? <span className="ml-2 rounded-full bg-[#17120e] px-2 py-1 text-[10px] font-black text-[#e4c87d]">가장 강한 운</span> : null}
                </div>
                <div className="text-lg font-black text-[#8a6a2f]">{Number(item.score)}점</div>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#eadfc9]">
                <div className="h-full rounded-full bg-[#8a6a2f]" style={{ width: `${Math.max(0, Math.min(100, Number(item.score) || 0))}%` }} />
              </div>
              {item.verdict ? <div className="mt-1 text-xs text-[#76634d]">{String(item.verdict)}</div> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e1d4bb] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-xs font-bold tracking-[0.16em] text-[#8a6a2f]">인생이 크게 움직이는 때</div>
        <div className="mt-2 text-2xl font-black text-[#2b2118]">{String(profile?.turningWindow || "중년 전후")}</div>
        <p className="mt-3 text-sm leading-7 text-[#5b4a38]">
          이 시기는 단순히 운이 좋아지는 나이가 아니다. 직장·역할·돈 버는 방식·사람관계 가운데 실제 하나 이상이 바뀌면서
          그동안 쌓아온 경험이 자기 몫으로 전환되는 구간이다. 같은 기회가 와도 무엇을 잡느냐에 따라 이후 인생의 크기가 달라진다.
        </p>
      </section>

      <section className="rounded-[28px] border border-[#e1d4bb] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-xs font-bold tracking-[0.16em] text-[#8a6a2f]">평생 먹고살 일은 따로 본다</div>
        <div className="mt-2 text-2xl font-black text-[#2b2118]">무슨 일을 해야 돈이 커지는가</div>
        <p className="mt-3 text-sm leading-7 text-[#5b4a38]">
          평생종합에서는 '안정적인 일을 해라' 같은 말로 끝내지 않는다. 직업적으로 맞는 1·2·3순위 축을 좁히고,
          회사 안에서 돈이 커지는지, 부업이나 자기수익을 붙여야 하는지, 어떤 방식으로 자기 가격을 만들어야 하는지를 같이 본다.
        </p>
        {careerRows.length ? (
          <div className="mt-4 space-y-2">
            {careerRows.map((item: any, idx: number) => (
              <div key={`${idx}-${String(item?.label || "")}`} className="flex items-center justify-between rounded-2xl bg-[#f4ead6] px-4 py-3">
                <span className="text-sm font-bold text-[#4a3a2b]">{String(item?.label || `직업축 ${idx + 1}`)}</span>
                <span className="text-sm font-black text-[#8a6a2f]">{Number(item?.score || 0) ? `${Number(item.score)}점` : "상세 분석"}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4 rounded-2xl bg-[#17120e] p-5 text-[#fff8e8]">

      {moneyBowlPreview?.amount && /\d/.test(String(moneyBowlPreview.amount)) ? (
        <section className="mx-auto mt-8 w-full max-w-2xl px-4">
          <div className="rounded-[28px] border border-[#c7a96b]/45 bg-[#1c1712] px-6 py-7 text-[#f6eddc] shadow-sm">
            <div className="text-[12px] font-semibold tracking-[0.18em] text-[#c9aa6b]">
              MONEY BOWL
            </div>
            <h3 className="mt-2 text-[22px] font-bold leading-tight">
              내 평생 돈그릇
            </h3>
            <div className="mt-2 text-[13px] leading-6 text-[#d8c7a5]">
              연봉이 아니라 평생에 걸쳐 남길 수 있는 장기 자산의 상단 목표권
            </div>
            <div className="mt-5 text-[34px] font-black leading-none text-[#d8b86f]">
              {moneyBowlPreview.amount}
            </div>
            <p className="mt-4 text-[15px] leading-7 text-[#eee3d1]">
              {moneyBowlPreview.meaning}
            </p>

            <div className="mt-5 rounded-2xl bg-[#f3ead8] px-4 py-4 text-[#2a2118]">
              <div className="text-[12px] font-bold text-[#8b6a2f]">돈그릇을 채우는 1순위 길</div>
              <div className="mt-1 text-[18px] font-extrabold">{moneyBowlPreview.mainPath}</div>
              {moneyBowlPreview.jobs ? (
                <div className="mt-2 text-[14px] leading-6">{moneyBowlPreview.jobs}</div>
              ) : null}
            </div>

            <p className="mt-5 text-[14px] font-semibold leading-6 text-[#d9c49a]">
              {moneyBowlPreview.hook}
            </p>
          </div>
        </section>
      ) : null}

          <div className="text-sm font-black text-[#e4c87d]">{String(profile?.paidHookTitle || "여기서부터가 진짜 평생판이다")}</div>
          <div className="mt-2 text-base font-black leading-7 text-[#fff8e8]">
            {String(profile?.paidHookBody || "강한 운이 언제 실제 돈과 자리로 바뀌는지까지 봐야 한다.")}
          </div>
          {profile?.paidHookQuote ? (
            <div className="mt-4 border-l-2 border-[#d8b86a] pl-3 text-sm font-bold leading-6 text-[#e4c87d]">
              “{String(profile.paidHookQuote)}”
            </div>
          ) : null}
          <div className="mt-4 space-y-1.5 text-sm leading-6 text-[#eee2ca]">
            {(Array.isArray(profile?.paidLockedItems) ? profile.paidLockedItems : []).map((item: any, idx: number) => (
              <div key={idx}>잠금 · {String(item)}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e1d4bb] bg-[#fffaf0] p-5 text-[#2b2118] shadow-sm">
        <div className="text-xl font-black text-[#2b2118]">이 한 리포트에서 끝까지 이어서 보는 것</div>
        <div className="mt-3 space-y-2 text-sm leading-7 text-[#5b4a38]">
          <div>핵심 기질 → 왜 초년과 중년의 흐름이 달라지는지</div>
          <div>초년 · 20대 · 30대 · 40대 · 50대 이후의 실제 변화</div>
          <div>평생 먹고살 일 → 직업순위 → 돈그릇 → 사업·부업 가능성</div>
          <div>사랑·결혼 → 사람복·악연 → 가족과의 거리</div>
          <div>건강 고비 → 크게 조심할 고비 → 크게 열리는 대운 → 말년운</div>
        </div>
        {profile?.coreAdvice ? (
          <div className="mt-4 rounded-2xl bg-[#f4ead6] p-4 text-sm font-bold leading-7 text-[#4a3a2b]">
            {String(profile.coreAdvice)}
          </div>
        ) : null}
        {onUnlock ? (
          <button onClick={onUnlock} className="mt-5 w-full rounded-2xl bg-[#17120e] px-4 py-4 font-black text-[#fff8e8]">
            {String(profile?.paidCtaLabel || "내 평생 직업·돈·대운 전체 보기")}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function CategoryPaidVisualReportV206({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const chunks = String(text || "")
    .split(/\n(?=\[[^\]]+\])/g)
    .map((v) => v.trim())
    .filter(Boolean);
  return (
    <div className="space-y-5">
      {chunks.map((chunk, index) => {
        const match = chunk.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
        const heading = match?.[1]?.trim() || (index === 0 ? title : "");
        const body = (match?.[2] ?? chunk).trim();
        return (
          <section key={`${heading}-${index}`} className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
            {heading ? (
              <div className="border-b border-black/5 bg-black/[0.025] px-5 py-4">
                <div className="text-lg font-black">{heading}</div>
              </div>
            ) : null}
            <div className="whitespace-pre-wrap px-5 py-5 text-[15px] leading-7 text-black/78">{body}</div>
          </section>
        );
      })}
    </div>
  );
}

function CategoryPaidPartReport({ categoryId, categoryTitle, user, fullText }: {
  categoryId: CategoryId; categoryTitle: string; user: UserInfo; fullText: string;
}) {
  const cleaned = (fullText || "").trim();
  const sections = splitReportSections(cleaned);
  const hero = pickDohoonSceneImage({
    user,
    categoryId,
    sceneOrder: 1,
    imageKey: "analysis",
    salt: `paid-${categoryId}-hero-v201`,
  });

  const splitLead = (body: string) => {
    const parts = String(body || "").split(/\n{2,}/).map((v) => v.trim()).filter(Boolean);
    if (!parts.length) return { lead: "", rest: "" };
    if (parts.length === 1) {
      const text = parts[0];
      const cut = Math.min(text.length, 190);
      return {
        lead: text.slice(0, cut).trim() + (text.length > cut ? "…" : ""),
        rest: text.length > cut ? text.slice(cut).trim() : "",
      };
    }
    return { lead: parts[0], rest: parts.slice(1).join("\n\n") };
  };

  return (
    <div className="overflow-hidden bg-[#090806] text-white">
      <section className="relative overflow-hidden bg-[#0c0a08]">
        <img
          src={hero}
          alt=""
          className="block h-auto w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <div className="text-[10px] font-black tracking-[0.28em] text-[#f1c67d]">SAJU FULL REPORT</div>
          <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.12] tracking-[-0.055em] sm:text-[52px]">
            {user.name || "당신"}의 {categoryTitle}
          </h2>
          <p className="mt-3 text-sm font-bold text-white/65">전체 리포트</p>
        </div>
      </section>

      {sections.length ? sections.map((section, index) => {
        const image = pickDohoonSceneImage({
          user,
          categoryId,
          sceneOrder: index + 2,
          imageKey: /TURN|MAP|시기|달|판정/i.test(section.title || "")
            ? "decision"
            : index % 2
              ? "analysis"
              : "mystery",
          salt: `paid-${categoryId}-v201-${index}`,
        });
        const { lead, rest } = splitLead(section.body);

        return (
          <section key={`${section.title}-${index}`} className="border-t border-white/8 bg-[#0d0b09]">
            <div className="relative min-h-[360px] overflow-hidden bg-[#11100e]">
              <img
                src={image}
                alt=""
                className="block h-auto w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
                <div className="text-[10px] font-black tracking-[0.24em] text-[#f1c67d]">
                  PART {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 break-keep text-[28px] font-black leading-tight tracking-[-0.045em] sm:text-[40px]">
                  {section.title}
                </h3>
                {lead ? (
                  <p className="mt-4 max-w-2xl break-keep text-[15px] font-bold leading-7 text-white/88 sm:text-[17px]">
                    {lead}
                  </p>
                ) : null}
              </div>
            </div>

            {rest ? (
              <div className="px-6 py-8 sm:px-9 sm:py-10">
                <div className="whitespace-pre-line break-keep text-[15px] font-medium leading-8 text-[#d8cec2]">
                  {rest}
                </div>
              </div>
            ) : null}
          </section>
        );
      }) : <ResultReport text={cleaned} paid={false} />}

      <section className="border-t border-white/8 bg-[#0a0908] px-6 py-8 text-[12px] font-semibold leading-6 text-white/45 sm:px-9">
        서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 디지털 리포트가 즉시 생성됩니다.
        디지털 콘텐츠 특성상 생성이 시작되었거나 결과 열람이 가능한 경우 단순 변심에 의한 환불은 제한될 수 있습니다.
      </section>
    </div>
  );
}


function CareerPaidPartReport({
  profile,
  user,
  fullText,
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "career" }>;
  user: UserInfo;
  fullText: string;
}) {
  const sections = splitReportSections(fullText);
  const sectionBody = (index: number) => sections[index]?.body || "";
  const sectionTitle = (index: number, fallback: string) => sections[index]?.title || fallback;

  const scores = (profile.scores || []).slice(0, 4);
  const strongest = [...scores].sort((a, b) => b.score - a.score)[0];
  const weakest = [...scores].sort((a, b) => a.score - b.score)[0];
  const ownDominant = profile.split.own >= profile.split.office;

  const hero = pickDohoonSceneImage({
    user,
    categoryId: "career",
    sceneOrder: 1,
    imageKey: "decision",
    salt: "career-paid-hero-v200",
  });

  const sceneImage = (order: number, key: string) =>
    pickDohoonSceneImage({
      user,
      categoryId: "career",
      sceneOrder: order,
      imageKey: key,
      salt: `career-paid-v200-${order}-${key}`,
    });

  const partCards = [
    { index: 1, eyebrow: "COMPANY POSITION", image: sceneImage(2, "analysis") },
    { index: 2, eyebrow: "MY MONEY ROLE", image: sceneImage(3, "gold") },
    { index: 3, eyebrow: "CAREER TURN", image: sceneImage(4, "decision"), accent: true },
    { index: 4, eyebrow: "OFFICE vs OWN", image: sceneImage(5, "mystery") },
    { index: 5, eyebrow: "AVOID", image: sceneImage(6, "warning") },
    { index: 6, eyebrow: "GROW THIS ROLE", image: sceneImage(7, "analysis") },
  ];

  return (
    <div className="overflow-hidden bg-[#0b0b0d] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-black">
        <img src={hero} alt="" className="block h-auto w-full object-contain opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <div className="text-[11px] font-black tracking-[0.28em] text-[#d8a86f]">
            CAREER FULL REPORT
          </div>
          <h2 className="mt-4 break-keep text-[38px] font-black leading-[1.08] tracking-[-0.055em] sm:text-[58px]">
            {nameOf(user)}의 일,
            <br />
            회사에 남을지
            <br />
            내 판을 만들지.
          </h2>
          <div className="mt-6 max-w-[680px] break-keep text-[17px] font-bold leading-8 text-white/82">
            {profile.verdict}
          </div>
        </div>
      </section>

      {/* CORE VERDICT */}
      <section className="px-5 py-8 sm:px-8">
        <div className="rounded-[30px] border border-white/10 bg-[#141417] p-6">
          <div className="text-[10px] font-black tracking-[0.24em] text-[#d8a86f]">CAREER CORE</div>
          <div className="mt-3 text-2xl font-black leading-tight">{profile.primary}</div>
          <div className="mt-2 text-sm font-bold leading-6 text-white/60">{profile.secondary}</div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white/[0.055] p-5">
              <div className="text-xs font-black text-white/45">직장형</div>
              <div className="mt-2 text-4xl font-black">{profile.split.office}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, profile.split.office)}%` }} />
              </div>
            </div>
            <div className="rounded-[24px] border border-[#d8a86f]/35 bg-[#25190d] p-5">
              <div className="text-xs font-black text-[#d8a86f]">내 판형</div>
              <div className="mt-2 text-4xl font-black text-[#f4c98e]">{profile.split.own}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#d8a86f]" style={{ width: `${Math.max(4, profile.split.own)}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] bg-black/35 px-5 py-4 text-sm font-bold leading-7 text-white/72">
            {ownDominant
              ? "내 이름으로 책임지고 돈을 움직이는 자리가 살아난다. 다만 처음부터 크게 벌이는 판보다, 이미 돈이 도는 작은 판을 키우는 순서가 맞다."
              : "조직 안에서도 충분히 살아난다. 대신 단순 처리자가 아니라 판단권·거래·운영 책임이 붙는 자리로 올라가야 한다."}
          </div>
        </div>
      </section>

      {/* SCORE MAP */}
      {scores.length ? (
        <section className="px-5 pb-8 sm:px-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-black tracking-[0.24em] text-[#d8a86f]">WORK POWER MAP</div>
              <h3 className="mt-2 text-2xl font-black">일할 때 실제로 쓰는 힘</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {scores.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-[24px] border border-white/8 bg-[#141417] p-5">
                <div className="text-xs font-black text-white/48">{item.label}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-black">{item.score}</span>
                  <span className="pb-1 text-xs font-bold text-white/40">점</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, Math.min(100, item.score))}%` }} />
                </div>
              </div>
            ))}
          </div>
          {strongest && weakest ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] bg-[#202617] p-5">
                <div className="text-[10px] font-black tracking-[0.18em] text-[#b8d58b]">가장 센 무기</div>
                <div className="mt-2 text-xl font-black">{strongest.label}</div>
                <div className="mt-2 text-sm font-bold leading-6 text-white/62">{profile.strongestSkill}</div>
              </div>
              <div className="rounded-[22px] bg-[#2b1717] p-5">
                <div className="text-[10px] font-black tracking-[0.18em] text-[#e4a3a3]">피로가 쌓이는 자리</div>
                <div className="mt-2 text-xl font-black">{weakest.label}</div>
                <div className="mt-2 text-sm font-bold leading-6 text-white/62">{profile.avoidWork}</div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* PART 01 */}
      {sections[0] ? (
        <section className="px-5 pb-8 sm:px-8">
          <div className="rounded-[30px] bg-[#efe7dc] p-6 text-[#15110e]">
            <div className="text-[10px] font-black tracking-[0.22em] text-[#9b692d]">PART 01 · FIRST VERDICT</div>
            <h3 className="mt-2 text-3xl font-black leading-tight">{sectionTitle(0, "일·사업 첫 판정")}</h3>
            <div className="mt-5 whitespace-pre-line text-[15px] font-semibold leading-8 text-[#3c342e]">
              {sectionBody(0)}
            </div>
          </div>
        </section>
      ) : null}

      {/* KEY ROLE */}
      <section className="px-5 pb-8 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[28px] border border-[#d8a86f]/30 bg-[#1c1510] p-6">
            <div className="text-[10px] font-black tracking-[0.2em] text-[#d8a86f]">MONEY ROLE</div>
            <div className="mt-3 text-2xl font-black">{profile.moneyRole}</div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#141417] p-6">
            <div className="text-[10px] font-black tracking-[0.2em] text-white/40">TRANSITION WINDOW</div>
            <div className="mt-3 text-2xl font-black">{profile.transitionWindow}</div>
          </div>
        </div>
      </section>

      {/* MAIN PARTS */}
      {partCards.map((card) => {
        const section = sections[card.index];
        if (!section) return null;
        return (
          <section key={`${section.title}-${card.index}`} className="pb-8">
            <div className="relative overflow-hidden bg-black">
              <img src={card.image} alt="" className="block h-auto w-full object-contain" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
            <div className="px-5 pt-5 sm:px-8">
              <div className="text-[10px] font-black tracking-[0.24em] text-[#d8a86f]">
                PART {String(card.index + 1).padStart(2, "0")} · {card.eyebrow}
              </div>
              <h3 className="mt-2 break-keep text-3xl font-black leading-tight sm:text-4xl">{section.title}</h3>
            </div>
            <div className="px-5 pt-6 sm:px-8">
              <div className="whitespace-pre-line text-[15px] font-medium leading-8 text-white/78">
                {section.body}
              </div>
            </div>
          </section>
        );
      })}

      {/* FINAL */}
      {sections[7] ? (
        <section className="px-5 pb-10 sm:px-8">
          <div className="rounded-[32px] border border-[#d8a86f]/35 bg-gradient-to-b from-[#26180b] to-[#100c09] p-6 sm:p-8">
            <div className="text-[10px] font-black tracking-[0.24em] text-[#d8a86f]">FINAL VERDICT</div>
            <h3 className="mt-3 text-3xl font-black">{sections[7].title}</h3>
            <div className="mt-5 whitespace-pre-line text-[15px] font-semibold leading-8 text-white/80">
              {sections[7].body}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-5 pb-10 sm:px-8">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 text-xs font-semibold leading-6 text-white/48">
          서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 즉시 디지털 리포트가 생성됩니다.
          디지털 콘텐츠 특성상 리포트 생성이 시작되었거나 결과 열람이 가능한 경우 단순 변심 환불은 제한될 수 있습니다.
        </div>
      </section>
    </div>
  );
}


function MoneyPaidPartReport({
  profile,
  user,
  fullText,
}: {
  profile: WealthProfile;
  user: UserInfo;
  fullText: string;
}) {
  const sections = splitReportSections(fullText);
  const scoreItems = [
    { label: "버는 힘", score: profile.scores.earning },
    { label: "모으는 힘", score: profile.scores.saving },
    { label: "키우는 힘", score: profile.scores.growing },
    { label: "지키는 힘", score: profile.scores.keeping },
  ];
  const strongest = [...scoreItems].sort((a, b) => b.score - a.score)[0];
  const weakest = [...scoreItems].sort((a, b) => a.score - b.score)[0];

  const windows = [
    { no: "01", label: "첫 돈문", value: profile.windows.first.age, body: profile.windows.first.meaning },
    { no: "02", label: "돈그릇 확장기", value: profile.windows.expansion.age, body: profile.windows.expansion.meaning },
    { no: "03", label: "최대 재물 피크", value: profile.windows.peak.age, body: profile.windows.peak.meaning, hot: true },
    { no: "04", label: "재물 위험구간", value: profile.windows.risk.age, body: profile.windows.risk.meaning, danger: true },
    { no: "05", label: "돈이 굳는 시기", value: profile.windows.consolidation.age, body: profile.windows.consolidation.meaning },
  ];

  const sectionBody = (index: number) => sections[index]?.body || "";
  const sectionTitle = (index: number, fallback: string) => sections[index]?.title || fallback;

  return (
    <div className="overflow-hidden bg-[#0b0908] text-white">
      {/* OPENING */}
      <section className="relative min-h-[650px] overflow-hidden bg-black">
        <img
          src="/characters/dohoon-hero.png"
          alt="도훈의 재물운 전체 리포트"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-78"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
        <div className="relative flex min-h-[650px] flex-col justify-end p-6 sm:p-10">
          <div className="text-[11px] font-black tracking-[0.24em] text-[#d8a86f]">MONEY FULL REPORT</div>
          <h2 className="mt-4 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.06em] sm:text-[58px]">
            {nameOf(user)}의 돈그릇,
            <br />이제 실제 돈길까지 연다.
          </h2>
          <div className="mt-7 flex flex-wrap items-end gap-x-7 gap-y-4">
            <div>
              <div className="text-xs font-black text-[#aa9a89]">평생 돈그릇</div>
              <div className="mt-1 text-[46px] font-black leading-none text-[#f0c56a]">{profile.capacity.range}</div>
            </div>
            <div>
              <div className="text-xs font-black text-[#aa9a89]">현재 활용도</div>
              <div className="mt-1 text-[46px] font-black leading-none">{profile.utilization}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* PART 01 */}
      <section className="bg-[#17110e] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">PART 01 · MONEY VERDICT</div>
          <h3 className="mt-3 break-keep text-[31px] font-black tracking-[-0.05em] sm:text-[44px]">
            {sectionTitle(0, "내 돈복 첫 판정")}
          </h3>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {scoreItems.map((item) => (
              <div key={item.label} className="border border-[#4d3a28] bg-[#0b0908] p-5">
                <div className="text-sm font-black text-[#bda98e]">{item.label}</div>
                <div className="mt-2 text-[42px] font-black leading-none text-[#f0c56a]">{item.score}</div>
                <div className="mt-4 h-2 bg-white/10">
                  <div className="h-full bg-[#d8a86f]" style={{ width: `${clampScore(item.score)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="border-l-4 border-[#d8a86f] bg-[#211a14] p-5">
              <div className="text-xs font-black text-[#c6aa82]">가장 강한 돈의 힘</div>
              <div className="mt-2 text-2xl font-black">{strongest.label} {strongest.score}</div>
            </div>
            <div className="border-l-4 border-[#b53a31] bg-[#25110f] p-5">
              <div className="text-xs font-black text-[#e0a49e]">가장 먼저 보완할 축</div>
              <div className="mt-2 text-2xl font-black">{weakest.label} {weakest.score}</div>
            </div>
          </div>
          {sectionBody(0) ? <p className="mt-7 whitespace-pre-line break-keep text-[15px] font-bold leading-8 text-[#d7cabc]">{sectionBody(0)}</p> : null}
        </div>
      </section>

      {/* PART 02 */}
      <section className="grid bg-[#e8dfd1] text-black md:grid-cols-2">
        <div className="relative min-h-[480px] overflow-hidden bg-black">
          <img src="/characters/dohoon-pointing.png" alt="돈 버는 구조를 짚는 도훈" className="block h-auto w-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#7a5b37]">PART 02 · HOW MONEY COMES</div>
          <h3 className="mt-3 text-[31px] font-black tracking-[-0.05em] sm:text-[43px]">돈이 들어오는 구조</h3>
          <div className="mt-6 border-2 border-black bg-[#d8a86f] p-5">
            <div className="text-xs font-black">주 수입축</div>
            <div className="mt-2 text-[32px] font-black tracking-[-0.05em]">{profile.moneyStyle.primary}</div>
            <div className="mt-2 text-sm font-black">보조축 · {profile.moneyStyle.secondary}</div>
          </div>
          <p className="mt-5 break-keep text-[15px] font-bold leading-8 text-[#51453b]">{profile.moneyStyle.description}</p>
          {sectionBody(1) ? <p className="mt-5 whitespace-pre-line break-keep border-t border-black/20 pt-5 text-[15px] font-bold leading-8 text-[#51453b]">{sectionBody(1)}</p> : null}
        </div>
      </section>

      {/* PART 03 MONEY TURN */}
      <section className="bg-[#0e0b09] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">PART 03 · MONEY TURN</div>
          <h3 className="mt-3 text-[31px] font-black tracking-[-0.05em] sm:text-[44px]">돈이 움직이는 다섯 구간</h3>
          <div className="mt-8 space-y-3">
            {windows.map((item) => (
              <div
                key={item.no}
                className={`border p-5 ${item.hot ? "border-[#d8a86f] bg-[#2b1d0d]" : item.danger ? "border-[#8d312b] bg-[#25100e]" : "border-[#463527] bg-[#15110e]"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-black tracking-[0.15em] text-[#bca587]">MONEY TURN {item.no} · {item.label}</div>
                  <div className={`text-[26px] font-black ${item.danger ? "text-[#ef928a]" : "text-[#f0c56a]"}`}>{item.value}</div>
                </div>
                <p className="mt-3 break-keep text-sm font-bold leading-7 text-[#d8cbbd]">{item.body}</p>
              </div>
            ))}
          </div>
          {sectionBody(2) ? <p className="mt-7 whitespace-pre-line break-keep text-[15px] font-bold leading-8 text-[#d7cabc]">{sectionBody(2)}</p> : null}
        </div>
      </section>

      {/* PART 04 BLOCKERS */}
      <section className="bg-[#6c1713] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#ffd1c8]">PART 04 · MONEY LEAK</div>
          <h3 className="mt-3 text-[31px] font-black tracking-[-0.05em] sm:text-[44px]">돈이 새는 자리</h3>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {profile.blockers.slice(0, 4).map((item) => (
              <div key={`${item.type}-${item.score}`} className="border border-white/25 bg-black/20 p-5">
                <div className="flex items-end justify-between gap-3">
                  <div className="text-xl font-black">{item.type}</div>
                  <div className="text-[34px] font-black text-[#ffd0bf]">{item.score}</div>
                </div>
                <p className="mt-3 break-keep text-sm font-bold leading-7 text-[#ffe0d9]">{item.description}</p>
              </div>
            ))}
          </div>
          {sectionBody(3) ? <p className="mt-7 whitespace-pre-line break-keep text-[15px] font-bold leading-8 text-[#ffe3dc]">{sectionBody(3)}</p> : null}
        </div>
      </section>

      {/* PART 05 STRATEGY */}
      <section className="bg-[#e8dfd1] px-5 py-12 text-black sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#7a5b37]">PART 05 · MONEY STRATEGY</div>
          <h3 className="mt-3 text-[31px] font-black tracking-[-0.05em] sm:text-[44px]">돈을 실제 자산으로 만드는 3축</h3>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              { key: "EARN", title: "버는 방식", body: `${profile.moneyStyle.primary}을 주축으로 잡고 ${profile.moneyStyle.secondary}을 보조로 붙인다.`, score: profile.scores.earning },
              { key: "KEEP", title: "지키는 방식", body: `${profile.primaryBlocker.type}을 먼저 통제해야 번 돈이 남는다.`, score: profile.scores.keeping },
              { key: "GROW", title: "키우는 방식", body: `${profile.windows.expansion.age} 확장기를 거쳐 ${profile.windows.peak.age} 피크를 준비한다.`, score: profile.scores.growing },
            ].map((item) => (
              <div key={item.key} className="border-2 border-black bg-[#f7f0e4] p-5">
                <div className="text-xs font-black tracking-[0.18em] text-[#7a5b37]">{item.key}</div>
                <div className="mt-2 text-[24px] font-black">{item.title}</div>
                <div className="mt-3 text-[#9b201b]">{"★".repeat(Math.max(1, Math.round(item.score / 20)))}</div>
                <p className="mt-4 break-keep text-sm font-bold leading-7 text-[#51453b]">{item.body}</p>
              </div>
            ))}
          </div>
          {sectionBody(4) ? <p className="mt-7 whitespace-pre-line break-keep text-[15px] font-bold leading-8 text-[#51453b]">{sectionBody(4)}</p> : null}
        </div>
      </section>

      {/* FINAL */}
      <section className="relative min-h-[580px] overflow-hidden bg-black">
        <img src="/characters/dohoon-smile.png" alt="재물운 마지막 판정을 내리는 도훈" className="absolute inset-0 h-full w-full object-cover object-top opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="relative flex min-h-[580px] max-w-2xl flex-col justify-center p-6 sm:p-10">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">FINAL VERDICT</div>
          <h3 className="mt-4 break-keep text-[36px] font-black leading-[1.15] tracking-[-0.055em] sm:text-[52px]">
            돈그릇은 {profile.capacity.range}.
            <br />관건은 피크가 아니라 준비다.
          </h3>
          <p className="mt-6 break-keep text-[16px] font-bold leading-8 text-[#ddd2c5]">
            {`${profile.windows.peak.age}의 큰 돈문을 살리려면 ${profile.moneyStyle.primary}을 중심에 두고 ${profile.primaryBlocker.type}을 먼저 막아야 한다. 무료에서 확인한 돈그릇은 출발점일 뿐이다. 실제 차이는 언제 확장하고, 언제 멈추고, 번 돈을 언제 자산으로 굳히느냐에서 벌어진다.`}
          </p>
          {sections.length > 5 ? (
            <div className="mt-6 border-l-4 border-[#d8a86f] bg-white/5 p-5">
              <div className="whitespace-pre-line break-keep text-[15px] font-bold leading-8 text-[#eadfce]">
                {sections.slice(5).map((section) => section.body).filter(Boolean).join("\n\n")}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function HealthPaidPartReport({
  profile,
  user,
  fullText,
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "health" }>;
  user: UserInfo;
  fullText: string;
}) {
  const report = profile.healthPaidReport;
  if (!report) return <ResultReport text={fullText} paid={false} />;

  const weakBody =
    extractPaidHealthSection(fullText, ["내 사주상 몸의 약한 자리"]) ||
    report.part1.weakPlaceBody;
  const breakBody =
    extractPaidHealthSection(fullText, ["무리하면 먼저 꺾이는 곳"]) ||
    report.part1.firstBreakBody;
  const signalBody =
    extractPaidHealthSection(fullText, ["몸이 보내는 첫 신호"]) ||
    report.part2.intro;
  const crisisBody =
    extractPaidHealthSection(fullText, ["인생에서 건강이 흔들리는 고비"]) || "";
  const yearBody =
    extractPaidHealthSection(fullText, ["올해 건강을 조심해야 할 달"]) || "";
  const harmfulBody =
    extractPaidHealthSection(fullText, ["건강을 망치는 생활 습관"]) || "";
  const helpfulBody =
    extractPaidHealthSection(fullText, ["건강이 살아나는 생활법"]) || report.part4.body;
  const foodBody =
    extractPaidHealthSection(fullText, ["음식으로 건강을 지키는 법"]) ||
    report.part5.food.body;
  const rhythmBody =
    extractPaidHealthSection(fullText, ["생활 리듬으로 건강을 지키는 법"]) ||
    report.part5.rhythm.body;
  const exerciseBody =
    extractPaidHealthSection(fullText, ["운동으로 건강을 지키는 법"]) ||
    report.part5.exercise.body;
  const finalBody =
    extractPaidHealthSection(fullText, ["건강운 마지막 판정"]) ||
    report.final.body;

  const safeCautionMonths = getHealthYearMonthCards(
    yearBody,
    report.part3.cautionMonths,
  );

  const renderParagraphs = (body: string) =>
    body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, i) => (
        <p key={i} className="break-keep text-[15px] font-medium leading-8 text-[#4c4036]">
          {p}
        </p>
      ));

  const hero = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 2,
    imageKey: "paid-opening",
    salt: "health-paid-v181-opening",
  });
  const timeImage = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 5,
    imageKey: "paid-time",
    salt: "health-paid-v181-time",
  });
  const finalImage = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 8,
    imageKey: "paid-final",
    salt: "health-paid-v181-final",
  });

  return (
    <div className="overflow-hidden rounded-[30px] border border-[#6d5337] bg-[#eee6da] text-black shadow-[0_28px_90px_rgba(0,0,0,.32)]">
      <section className="relative min-h-[68vh] overflow-hidden bg-black text-white">
        <img
          src={hero}
          alt="도훈 건강운 전체 리포트"
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={(e) => {
            if (e.currentTarget.dataset.fallbackApplied === "true") return;
            e.currentTarget.dataset.fallbackApplied = "true";
            e.currentTarget.src = "/characters/dohoon.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
        <div className="relative flex min-h-[68vh] flex-col justify-end p-6 sm:p-9">
          <div className="text-[11px] font-black tracking-[0.2em] text-[#e0b36d]">HEALTH REPORT</div>
          <h2 className="mt-3 text-[34px] font-black leading-[1.15] tracking-[-0.055em] sm:text-[50px]">
            {nameOf(user)}의 건강운
          </h2>
          <div className="mt-5 w-fit border border-[#d8a86f] bg-black/60 px-4 py-2 text-lg font-black text-[#efc987]">
            종합 건강운 · {report.opening.grade}
          </div>
          <p className="mt-5 max-w-2xl break-keep text-[21px] font-black leading-9">
            {report.opening.summary}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              ["약한 축", report.opening.weakAxis],
              ["주의 방식", report.opening.cautionStyle],
              ["올해 주의", report.opening.yearCaution],
            ].map(([label, value]) => (
              <div key={label} className="border border-white/15 bg-black/45 p-3">
                <div className="text-[10px] text-[#bba993]">{label}</div>
                <div className="mt-1 break-keep text-sm font-black">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs font-black tracking-[0.18em] text-[#8b673f]">PART 01</div>
          <h3 className="mt-2 text-[31px] font-black tracking-[-0.05em]">{report.part1.title}</h3>
          <h4 className="mt-8 text-xl font-black">{report.part1.weakPlaceTitle}</h4>
          <div className="mt-4 space-y-4">{renderParagraphs(weakBody)}</div>

          <div className="mt-8 rounded-[24px] bg-[#18130f] p-5 text-white">
            <div className="mb-5 text-sm font-black text-[#e0b36d]">사주상 건강 밸런스</div>
            <div className="space-y-5">
              {report.part1.balance.map((item) => (
                <div key={item.key}>
                  <div className="mb-2 flex justify-between text-sm font-black">
                    <span>{item.label}</span>
                    <span className="text-[#efc987]">{item.score} · {item.level}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#d2a35f]" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-l-4 border-[#d8a86f] pl-4 text-lg font-black leading-8">
              {report.part1.keyInsight}
            </div>
          </div>

          <h4 className="mt-9 text-xl font-black">{report.part1.firstBreakTitle}</h4>
          <div className="mt-4 space-y-4">{renderParagraphs(breakBody)}</div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {report.part1.breakSequence.map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                <span className="rounded-full border border-[#8c704e] bg-white px-4 py-2 text-sm font-black">{item}</span>
                {i < report.part1.breakSequence.length - 1 ? <span className="font-black text-[#9b7042]">→</span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#17120f] px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs font-black tracking-[0.18em] text-[#d8a86f]">PART 02</div>
          <h3 className="mt-2 text-[31px] font-black tracking-[-0.05em]">{report.part2.title}</h3>
          <div className="mt-5 space-y-4 text-[#d8cdc1]">{renderParagraphs(signalBody)}</div>
          <div className="mt-8 space-y-3">
            {report.part2.signals.map((s) => (
              <div key={s.level} className="grid grid-cols-[54px_1fr] gap-4 border-b border-white/10 py-4">
                <div className="text-2xl font-black text-[#d8a86f]">0{s.level}</div>
                <div>
                  <div className="font-black">{s.title}</div>
                  <div className="mt-1 text-sm leading-6 text-[#bfb2a5]">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-[22px] border border-[#9e3b31] bg-[#35110f] p-5">
            <div className="text-xs font-black tracking-[0.16em] text-[#ef9b88]">가장 위험한 패턴</div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {report.part2.dangerPattern.map((item, i) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="font-black">{item}</span>
                  {i < report.part2.dangerPattern.length - 1 ? <span>→</span> : null}
                </div>
              ))}
            </div>
            <p className="mt-4 break-keep font-black leading-7">{report.part2.keyWarning}</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs font-black tracking-[0.18em] text-[#8b673f]">PART 03</div>
          <h3 className="mt-2 text-[31px] font-black tracking-[-0.05em]">{report.part3.title}</h3>
          {crisisBody ? <div className="mt-5 space-y-4">{renderParagraphs(crisisBody)}</div> : null}

          <div className="mt-8 border-l-2 border-[#9b7042] pl-6">
            {report.part3.lifetimeCrises.map((c) => (
              <div key={c.order} className="relative pb-8">
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-[#9b7042]" />
                <div className="text-[11px] font-black text-[#8b673f]">HEALTH TURN {c.order}</div>
                <div className="mt-1 text-2xl font-black">{c.age}</div>
                <p className="mt-2 break-keep text-sm leading-7 text-[#5c5045]">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-[24px] bg-[#1b1510] p-5 text-white">
            <div className="text-xs text-[#c3ad92]">현재 나이 {report.part3.currentAge}세 · 다음 체크 구간</div>
            <div className="mt-2 text-[32px] font-black text-[#efc987]">{report.part3.nextCrisis}</div>
            <p className="mt-3 break-keep text-sm leading-7 text-[#d4c8ba]">{report.part3.nextCrisisBody}</p>
          </div>

          <h4 className="mt-9 text-xl font-black">{report.part3.year}년 건강 흐름</h4>
          {yearBody ? <div className="mt-4 space-y-4">{renderParagraphs(yearBody)}</div> : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {safeCautionMonths.map((m) => (
              <div key={m.month} className="border border-[#a48662] bg-white p-5">
                <div className="text-3xl font-black text-[#9b7042]">{m.label}</div>
                {m.body ? <p className="mt-2 break-keep text-sm leading-7 text-[#5c5045]">{m.body}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050708] text-white">
        <img
          src={timeImage}
          alt="도훈 건강운 생활 판정"
          className="absolute inset-0 h-full w-full object-cover object-[72%_top] opacity-25 sm:object-[78%_top] sm:opacity-30"
        />
        {/* PART 04는 텍스트가 주인공이다. 사진은 분위기만 남기고 본문 영역은 강하게 어둡힌다. */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/90" />
        <div className="relative px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-xs font-black tracking-[0.18em] text-[#d8a86f]">PART 04</div>
            <h3 className="mt-2 text-[31px] font-black tracking-[-0.05em]">{report.part4.title}</h3>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="border border-[#8d3930] bg-[#2a100e]/90 p-5">
                <div className="font-black text-[#f1a38e]">건강운을 깎는 습관</div>
                <div className="mt-4 space-y-3">
                  {report.part4.harmfulHabits.map((x) => <div key={x} className="text-sm font-bold">− {x}</div>)}
                </div>
              </div>
              <div className="border border-[#8d704c] bg-[#221b13]/90 p-5">
                <div className="font-black text-[#efc987]">건강운을 살리는 습관</div>
                <div className="mt-4 space-y-3">
                  {report.part4.helpfulHabits.map((x) => <div key={x} className="text-sm font-bold">+ {x}</div>)}
                </div>
              </div>
            </div>
            <div className="mt-7 text-2xl font-black leading-9 text-[#efc987]">{report.part4.keyInsight}</div>
            {harmfulBody ? (
              <div className="mt-6 max-w-2xl space-y-4 rounded-[20px] bg-black/35 p-5 text-[#eee3d7] backdrop-blur-[1px] [&_p]:!text-[#eee3d7]">
                {renderParagraphs(harmfulBody)}
              </div>
            ) : null}
            <div className="mt-4 max-w-2xl space-y-4 rounded-[20px] bg-black/35 p-5 text-[#eee3d7] backdrop-blur-[1px] [&_p]:!text-[#eee3d7]">
              {renderParagraphs(helpfulBody)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs font-black tracking-[0.18em] text-[#8b673f]">PART 05</div>
          <h3 className="mt-2 text-[31px] font-black tracking-[-0.05em]">{report.part5.title}</h3>

          <h4 className="mt-9 text-2xl font-black">FOOD · 식사 흐름</h4>
          <div className="mt-3 text-lg font-black text-[#8b673f]">{report.part5.food.verdict}</div>
          <div className="mt-4 space-y-4">{renderParagraphs(foodBody)}</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[#e2d4bd] p-5">
              <div className="font-black">잘 맞는 쪽</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.part5.food.recommended.map((x) => <span key={x} className="rounded-full bg-white px-3 py-2 text-xs font-black">{x}</span>)}
              </div>
            </div>
            <div className="rounded-[22px] bg-[#d9cbc1] p-5">
              <div className="font-black">줄여야 할 쪽</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.part5.food.reduce.map((x) => <span key={x} className="rounded-full bg-white px-3 py-2 text-xs font-black">{x}</span>)}
              </div>
            </div>
          </div>

          <h4 className="mt-10 text-2xl font-black">RHYTHM · 생활 리듬</h4>
          <div className="mt-3 text-lg font-black text-[#8b673f]">{report.part5.rhythm.verdict}</div>
          <div className="mt-4 space-y-4">{renderParagraphs(rhythmBody)}</div>
          <div className="mt-5 grid gap-2">
            {report.part5.rhythm.actions.map((x) => <div key={x} className="border-b border-black/10 py-3 text-sm font-black">{x}</div>)}
          </div>

          <h4 className="mt-10 text-2xl font-black">EXERCISE · 운동 흐름</h4>
          <div className="mt-3 text-lg font-black text-[#8b673f]">{report.part5.exercise.verdict}</div>
          <div className="mt-4 space-y-4">{renderParagraphs(exerciseBody)}</div>
          <div className="mt-5 space-y-3">
            {report.part5.exercise.items.map((x) => (
              <div key={x.label} className="flex items-center justify-between border-b border-black/10 py-3">
                <span className="font-black">{x.label}</span>
                <span className="tracking-[0.08em] text-[#9b7042]">{"★".repeat(x.stars)}{"☆".repeat(5 - x.stars)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050505] text-white">
        <img
          src={finalImage}
          alt="도훈 건강운 최종 판정"
          className="absolute right-0 top-0 h-[520px] w-full object-cover object-top opacity-[0.16] sm:w-[72%]"
          onError={(e) => {
            if (e.currentTarget.dataset.fallbackApplied === "true") return;
            e.currentTarget.dataset.fallbackApplied = "true";
            e.currentTarget.src = "/characters/dohoon.png";
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.34)_0%,rgba(5,5,5,.78)_28%,#050505_56%,#050505_100%)]" />

        <div className="relative mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="text-xs font-black tracking-[0.18em] text-[#e0b36d]">
            FINAL · 도훈의 최종 판정
          </div>

          <h3 className="mt-4 max-w-2xl break-keep text-[34px] font-black leading-[1.16] tracking-[-0.05em] text-white sm:text-[48px]">
            {report.final.verdict}
          </h3>

          <p className="mt-6 max-w-2xl break-keep text-[16px] font-medium leading-8 text-[#eee4da]">
            {report.final.body}
          </p>

          <div className="mt-10 border-l-4 border-[#d8a86f] bg-black/45 px-5 py-1">
            <div className="text-[12px] font-black tracking-[0.13em] text-[#d8a86f]">
              왜 이런 판정이 나왔나
            </div>
            <p className="mt-3 break-keep text-[16px] font-bold leading-8 text-white">
              {report.final.whyThisVerdict}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[#766044] bg-[#15110d] p-5">
              <div className="text-[11px] font-black tracking-[0.12em] text-[#d8a86f]">
                가장 강한 건강 패턴
              </div>
              <p className="mt-3 break-keep text-[15px] font-medium leading-7 text-[#f2e9df]">
                {report.final.strongestHealthPattern}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#713a32] bg-[#1b0e0c] p-5">
              <div className="text-[11px] font-black tracking-[0.12em] text-[#e28f7d]">
                가장 조심할 반복 패턴
              </div>
              <p className="mt-3 break-keep text-[15px] font-medium leading-7 text-[#f2e9df]">
                {report.final.biggestRiskPattern}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <div className="text-[12px] font-black tracking-[0.13em] text-[#d8a86f]">
              앞으로 주목할 시간
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
                <div className="text-[11px] font-black text-[#a99a8b]">다음 건강 전환 구간</div>
                <p className="mt-2 break-keep text-[16px] font-bold leading-8 text-white">
                  {report.final.nextTurningPoint}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
                <div className="text-[11px] font-black text-[#a99a8b]">{report.part3.year}년 집중 관리</div>
                <p className="mt-2 break-keep text-[16px] font-bold leading-8 text-white">
                  {report.final.thisYearFocus}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[26px] border border-[#8a6b43] bg-[#1b140d] p-6">
            <div className="text-[12px] font-black tracking-[0.13em] text-[#e0b36d]">
              지금 가장 먼저 바꿀 것
            </div>
            <div className="mt-3 break-keep text-[25px] font-black leading-9 text-white">
              {report.final.actionPriority}
            </div>
          </div>

          <div className="mt-10">
            <div className="text-[12px] font-black tracking-[0.13em] text-[#d8a86f]">
              장기적으로 건강운을 살리는 법
            </div>
            <p className="mt-3 break-keep text-[16px] font-medium leading-8 text-[#e8ded4]">
              {report.final.longTermAdvice}
            </p>
          </div>

          <div className="mt-10 border-y border-white/12 py-7">
            <div className="text-[12px] font-black tracking-[0.13em] text-[#d8a86f]">
              결국 기억해야 할 세 가지
            </div>
            <div className="mt-4 grid gap-1">
              {report.final.remember.map((x, index) => (
                <div
                  key={x.label}
                  className="grid grid-cols-[44px_1fr] gap-4 border-t border-white/10 py-4 first:border-t-0"
                >
                  <div className="text-2xl font-black text-[#d8a86f]">0{index + 1}</div>
                  <div>
                    <div className="text-[11px] font-black tracking-[0.1em] text-[#a99a8b]">
                      {x.label}
                    </div>
                    <div className="mt-1 break-keep text-[18px] font-black leading-7 text-white">
                      {x.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[28px] bg-[#eee5d9] p-6 text-[#211a14] sm:p-8">
            <div className="text-[11px] font-black tracking-[0.14em] text-[#8b673f]">
              도훈의 마지막 한마디
            </div>
            <p className="mt-4 break-keep text-[22px] font-black leading-9 tracking-[-0.025em]">
              {report.final.closingMessage}
            </p>
          </div>

          {finalBody ? (
            <details className="mt-7 rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
              <summary className="cursor-pointer text-[12px] font-black tracking-[0.1em] text-[#c9b8a5]">
                기존 건강운 마무리 해석 함께 보기
              </summary>
              <div className="mt-4 space-y-4">
                {finalBody
                  .split(/\n{2,}/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
                    <p
                      key={i}
                      className="break-keep text-[14px] font-medium leading-7 text-[#e2d8ce]"
                    >
                      {p}
                    </p>
                  ))}
              </div>
            </details>
          ) : null}

          <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-6 text-[#a79a8d]">
            {report.final.medicalNotice}
          </p>
        </div>
      </section>
    </div>
  );
}

function HealthLongformStory({
  profile,
  user,
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "health" }>;
  user: UserInfo;
}) {
  const story = profile.healthStory;

  if (!story) {
    return (
      <PersonalizedRouteWebtoon
        profile={profile}
        user={user}
        scoreVisual={null}
        freeComicScenes={profile.webtoonScenes || []}
      />
    );
  }

  const energy = [
    { label: "기본 체력", value: story.energyScores.stamina },
    { label: "버티는 힘", value: story.energyScores.endurance },
    { label: "회복력", value: story.energyScores.recovery },
    { label: "피로 인지", value: story.energyScores.fatigueAwareness },
    { label: "생활리듬 민감도", value: story.energyScores.rhythmSensitivity },
  ];

  const maxEnergy = Math.max(...energy.map((x) => x.value));
  const minEnergy = Math.min(...energy.map((x) => x.value));

  const heroImage = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 1,
    imageKey: "opening",
    salt: "health-longform-hero",
  });

  const revealImage = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 3,
    imageKey: "analysis",
    salt: "health-longform-reveal",
  });

  const warningImage = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 5,
    imageKey: "warning",
    salt: "health-longform-warning",
  });

  const endingImage = pickDohoonSceneImage({
    user,
    categoryId: "health",
    sceneOrder: 7,
    imageKey: "ending",
    salt: "health-longform-ending",
  });

  const lockedItems = [
    `두 번째 건강 변화구간 ${story.secondTurningAgeLocked}`,
    `회복운 상승구간 ${story.recoveryAgeLocked}`,
    ...story.lockedTopics,
  ].slice(0, 6);

  return (
    <section className="mt-5 overflow-hidden border border-[#7b5d3e] bg-[#0b0908] text-white shadow-[0_34px_120px_rgba(0,0,0,.48)]">
      <style jsx>{`
        .health-longform {
          font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
        }
        .health-longform .progress-track {
          height: 12px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
        }
        .health-longform .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #d8a86f, #f4d9a0);
        }
        .health-longform .dark-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #933d32, #e09273);
        }
        .health-longform .age-line {
          position: relative;
          height: 180px;
          border: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 100% 25%, 12.5% 100%;
        }
        .health-longform .age-point {
          position: absolute;
          width: 12px;
          height: 12px;
          margin-left: -6px;
          margin-top: -6px;
          border-radius: 999px;
          background: #efc987;
          box-shadow: 0 0 0 4px rgba(239,201,135,.12);
        }
        .health-longform .age-segment {
          position: absolute;
          height: 3px;
          transform-origin: left center;
          background: linear-gradient(90deg, #efc987, #f5e2b7);
        }
      `}</style>

      <div className="health-longform">
        <section className="relative min-h-[78vh] overflow-hidden bg-black">
          <img
            src={heroImage}
            alt="도훈 건강운 첫 판정"
            className="absolute inset-0 h-full w-full object-cover object-top"
            onError={(event) => {
              const img = event.currentTarget;
              if (img.dataset.fallbackApplied === "true") return;
              img.dataset.fallbackApplied = "true";
              img.src = "/characters/dohoon.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5" />
          <div className="relative flex min-h-[78vh] flex-col justify-end p-6 sm:p-9">
            <div className="w-fit border border-[#d8a86f] bg-black/65 px-3 py-1 text-[10px] font-black tracking-[0.22em] text-[#f1ca89]">
              건강운 첫 판정
            </div>

            <h2 className="mt-5 break-keep text-[34px] font-black leading-[1.18] tracking-[-0.06em] sm:text-[52px]">
              {story.openingVerdict}
            </h2>

            <p className="mt-5 max-w-2xl break-keep text-[16px] font-bold leading-8 text-[#e3d8cb] sm:text-[18px]">
              {story.openingBody}
            </p>

            <div className="mt-6 border-l-4 border-[#d8a86f] pl-4 text-[15px] font-bold leading-7 text-[#f0dfca]">
              {story.sajuReason}
            </div>
          </div>
        </section>

        <section className="bg-[#17110e] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">
              HEALTH ENERGY MAP
            </p>
            <h3 className="mt-3 break-keep text-[30px] font-black tracking-[-0.05em] sm:text-[42px]">
              네 사주에서 읽힌 건강 에너지
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[#cfc0af]">
              점수 하나보다 강한 축과 약한 축의 차이를 본다. 이 차이가 커질수록
              “괜찮아 보이는데 어느 순간 확 지치는” 느낌이 생길 수 있다.
            </p>

            <div className="mt-8 grid gap-5">
              {energy.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-end justify-between gap-4">
                    <span className="text-sm font-black text-[#f3e8db]">
                      {item.label}
                    </span>
                    <span className="text-2xl font-black text-[#f1ca89]">
                      {item.value}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 border border-[#4e3b2b] bg-[#0e0b09] p-5">
              <div className="text-[12px] font-black tracking-[0.16em] text-[#d8a86f]">
                이상 지점
              </div>
              <div className="mt-2 text-[25px] font-black leading-9">
                {story.anomalyTitle}
              </div>
              <p className="mt-4 break-keep text-[15px] leading-7 text-[#cdbdac]">
                {story.anomalyBody}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-[#a99784]">가장 강한 지표</div>
                  <div className="mt-1 text-3xl font-black text-[#f1ca89]">
                    {maxEnergy}
                  </div>
                </div>
                <div className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs text-[#a99784]">가장 약한 지표</div>
                  <div className="mt-1 text-3xl font-black text-white">
                    {minEnergy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid bg-[#e8dfd1] text-black md:grid-cols-2">
          <div className="relative min-h-[420px] overflow-hidden bg-black">
            <img
              src={revealImage}
              alt="도훈 건강운 반전 분석"
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(event) => {
                const img = event.currentTarget;
                if (img.dataset.fallbackApplied === "true") return;
                img.dataset.fallbackApplied = "true";
                img.src = "/characters/dohoon.png";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9">
            <div className="w-fit border-2 border-black bg-[#d8a86f] px-3 py-1 text-[10px] font-black tracking-[0.18em]">
              반전
            </div>
            <h3 className="mt-4 break-keep text-[30px] font-black leading-[1.25] tracking-[-0.05em] sm:text-[42px]">
              그런데 건강운에서 진짜 봐야 하는 건 지금 몸 상태가 아니다.
            </h3>
            <p className="mt-5 break-keep text-[16px] font-bold leading-8 text-[#4d4036]">
              언제 이 균형이 깨지는지, 그리고 무너질 때 어떤 순서로 신호가
              붙는지를 봐야 한다.
            </p>
          </div>
        </section>

        <section className="bg-[#0d0b0a] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">
              SIGNAL ORDER
            </p>
            <h3 className="mt-3 break-keep text-[30px] font-black tracking-[-0.05em] sm:text-[42px]">
              네 몸은 이런 순서로 신호를 보낸다
            </h3>

            <div className="mt-8 grid gap-4">
              {story.signalSequence.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-black tracking-[0.16em] text-[#a88d6d]">
                        SIGNAL {index + 1}
                      </div>
                      <div className="mt-1 text-xl font-black">{item.label}</div>
                    </div>
                    <div className="text-3xl font-black text-[#efc987]">
                      {item.score}
                    </div>
                  </div>

                  <div className="mt-4 progress-track">
                    <div
                      className="dark-progress-fill"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>

                  <p className="mt-4 break-keep text-[14px] leading-7 text-[#cbbbad]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-l-4 border-[#b94d3b] bg-[#35110f] p-5">
              <div className="text-[12px] font-black tracking-[0.15em] text-[#f1b19e]">
                여기서 긴장해야 하는 이유
              </div>
              <p className="mt-2 break-keep text-[18px] font-black leading-8">
                첫 번째 신호를 놓치면 두 번째와 세 번째 신호가 더 빠르게
                이어질 수 있다.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#17110e] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">
              AGE FLOW
            </p>
            <h3 className="mt-3 break-keep text-[30px] font-black tracking-[-0.05em] sm:text-[42px]">
              건강 리듬은 평생 똑같지 않다
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[#cdbdac]">
              전체적으로 나쁜 흐름인지 보는 게 아니라, 유독 꺾이는 지점이
              어디인지 본다.
            </p>

            <div className="age-line mt-8">
              {story.ageFlow.map((point, index) => {
                const left = (index / Math.max(1, story.ageFlow.length - 1)) * 100;
                const top = 100 - point.score;
                const next = story.ageFlow[index + 1];

                let segment = null;

                if (next) {
                  const nextLeft =
                    ((index + 1) / Math.max(1, story.ageFlow.length - 1)) * 100;
                  const nextTop = 100 - next.score;
                  const dx = nextLeft - left;
                  const dy = nextTop - top;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  segment = (
                    <div
                      className="age-segment"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${length}%`,
                        transform: `rotate(${angle}deg)`,
                      }}
                    />
                  );
                }

                return (
                  <div key={`${point.age}-${index}`}>
                    {segment}
                    <div
                      className="age-point"
                      style={{ left: `${left}%`, top: `${top}%` }}
                    />
                    <div
                      className="absolute text-[10px] font-black text-[#d2c0ab]"
                      style={{
                        left: `${left}%`,
                        bottom: 6,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {point.age}세
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-[#5c4937] bg-[#0f0c0a] p-4">
                <div className="text-[11px] text-[#a88d6d]">첫 변화구간</div>
                <div className="mt-1 text-2xl font-black text-[#f1ca89]">
                  {story.firstTurningAge}
                </div>
              </div>
              <div className="border border-[#5c4937] bg-[#0f0c0a] p-4">
                <div className="text-[11px] text-[#a88d6d]">두 번째 변화구간</div>
                <div className="mt-1 text-2xl font-black text-white blur-[6px]">
                  {story.secondTurningAgeLocked}
                </div>
              </div>
              <div className="border border-[#5c4937] bg-[#0f0c0a] p-4">
                <div className="text-[11px] text-[#a88d6d]">회복운 상승구간</div>
                <div className="mt-1 text-2xl font-black text-white blur-[6px]">
                  {story.recoveryAgeLocked}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid bg-[#7d1717] md:grid-cols-2">
          <div className="relative min-h-[420px] overflow-hidden bg-black">
            <img
              src={warningImage}
              alt="도훈 건강운 경고"
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(event) => {
                const img = event.currentTarget;
                if (img.dataset.fallbackApplied === "true") return;
                img.dataset.fallbackApplied = "true";
                img.src = "/characters/dohoon.png";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d0909] via-black/10 to-transparent" />
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9">
            <div className="w-fit border-2 border-black bg-white px-3 py-1 text-[10px] font-black tracking-[0.18em] text-[#8b1010]">
              WARNING
            </div>
            <h3 className="mt-4 break-keep text-[30px] font-black leading-[1.2] tracking-[-0.05em] sm:text-[42px]">
              네 건강운에서 가장 조심해야 할 습관
            </h3>
            <div className="mt-5 border-[3px] border-black bg-[#fff0e9] p-5 text-[20px] font-black leading-8 text-[#6e0f0f] shadow-[8px_8px_0_rgba(0,0,0,.25)]">
              {story.warningHabit}
            </div>
            <p className="mt-5 break-keep text-[15px] font-bold leading-7 text-[#f5d8d0]">
              아픈 뒤 관리하는 것보다 회복력이 떨어지기 시작하는 순간을
              먼저 잡는 게 중요하다.
            </p>
          </div>
        </section>

        <section className="bg-[#e7ddcf] px-5 py-12 text-black sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#8a6845]">
              CURRENT RHYTHM
            </p>
            <h3 className="mt-3 break-keep text-[30px] font-black tracking-[-0.05em] sm:text-[42px]">
              지금은 부담과 회복 중 어느 쪽이 앞서나
            </h3>

            <div className="mt-8 grid gap-6">
              <div>
                <div className="mb-2 flex justify-between text-sm font-black">
                  <span>몸의 부담</span>
                  <span>{story.currentRhythm.burden}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#7d1717]"
                    style={{ width: `${story.currentRhythm.burden}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm font-black">
                  <span>회복력</span>
                  <span>{story.currentRhythm.recovery}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#9f7b4e]"
                    style={{ width: `${story.currentRhythm.recovery}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-6 break-keep text-[16px] font-bold leading-8 text-[#4b4036]">
              {story.currentRhythm.comment}
            </p>
          </div>
        </section>

        <section className="bg-[#0f0c0a] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">
              지금 바꿔야 할 한 가지
            </div>
            <h3 className="mt-3 break-keep text-[32px] font-black leading-[1.2] tracking-[-0.05em] sm:text-[46px]">
              {story.actionFirst}
            </h3>
            <p className="mt-5 break-keep text-[16px] font-bold leading-8 text-[#d3c4b6]">
              {story.actionReason}
            </p>
          </div>
        </section>

        <section className="relative min-h-[72vh] overflow-hidden bg-black">
          <img
            src={endingImage}
            alt="도훈 건강운 잠금"
            className="absolute inset-0 h-full w-full object-cover object-top brightness-[0.38] saturate-50"
            onError={(event) => {
              const img = event.currentTarget;
              if (img.dataset.fallbackApplied === "true") return;
              img.dataset.fallbackApplied = "true";
              img.src = "/characters/dohoon.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />

          <div className="relative mx-auto flex min-h-[72vh] max-w-3xl flex-col justify-end p-6 sm:p-9">
            <div className="w-fit border border-[#d8a86f] bg-black/70 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-[#efc987]">
              여기서부터 잠긴다
            </div>
            <h3 className="mt-4 break-keep text-[32px] font-black leading-[1.2] tracking-[-0.05em] sm:text-[48px]">
              여기까지 분석하면서 아직 판정하지 않은 게 있다.
            </h3>
            <p className="mt-4 break-keep text-[16px] font-bold leading-8 text-[#d9c9b8]">
              지금까지는 왜 몸이 흔들리는 사람인지 봤다. 여기서부터는
              언제, 어떤 순서로 나타나고 어떻게 피해야 하는지를 본다.
            </p>

            <div className="mt-7 grid gap-3">
              {lockedItems.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-center justify-between border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <span className="text-sm font-black text-white/88">{item}</span>
                  <span className="text-lg">🔒</span>
                </div>
              ))}
            </div>

            <div className="mt-7 border-t border-white/10 pt-6 text-[13px] leading-6 text-[#a99a8b]">
              사주 해석은 건강 상태나 질병을 진단하는 의료행위가 아니다.
              몸에 이상이 있거나 지속적인 증상이 있으면 의료진의 진료가 우선이다.
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function PersonalizedRouteWebtoon({
  profile,
  user,
  scoreVisual,
  freeComicScenes = [],
}: {
  profile: CategoryPreviewProfile;
  user: UserInfo;
  scoreVisual: RelationshipScoreVisual;
  freeComicScenes?: CareerFreeComicScene[];
}) {
  const categoryForProfile: CategoryId =
    profile.kind === "year"
      ? "monthly"
      : profile.kind === "lifeFlow"
        ? "lifeFlow"
        : profile.kind === "lifetime"
          ? "traditional"
          : profile.kind === "worry"
            ? "premium"
            : profile.kind;

  const scenes = [...freeComicScenes].sort((a, b) => a.order - b.order);

  if (!scenes.length) return null;

  const moodClass = (scene: CareerFreeComicScene) => {
    if (scene.mood === "warning") return "bg-[#7d1717] text-white";
    if (scene.mood === "gold") return "bg-[#e5bd63] text-black";
    if (scene.mood === "hope") return "bg-[#e9dfc6] text-black";
    if (scene.mood === "mystery") return "bg-[#0b0908] text-white";
    if (scene.mood === "reveal") return "bg-[#ece4d7] text-black";
    return "bg-[#17110d] text-white";
  };

  const labelFor = (scene: CareerFreeComicScene) => {
    const key = String(scene.dohoonImageKey || scene.sceneKey || "").toLowerCase();
    if (scene.locked || key.includes("mystery")) return "다음 장면 잠김";
    if (key.includes("warning")) return "경고";
    if (key.includes("reveal")) return "반전";
    if (key.includes("analysis") || key.includes("thinking")) return "사주 분석";
    if (key.includes("decision") || key.includes("guide")) return "도훈의 판정";
    if (key.includes("future")) return "앞으로의 흐름";
    if (key.includes("confidence")) return "강점";
    if (key.includes("ending")) return "마지막 판정";
    return scene.order === 1 ? "첫 장면" : `장면 ${scene.order}`;
  };

  return (
    <section className="personalized-route-webtoon mt-5 overflow-hidden border border-[#7a5b37] bg-black shadow-[0_34px_110px_rgba(0,0,0,.45)]">
      <style jsx>{`
        .personalized-route-webtoon {
          font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
        }
        .personalized-route-webtoon * {
          border-color: initial !important;
        }
        .route-webtoon-cut {
          position: relative;
          overflow: hidden;
          border-bottom: 8px solid #050505 !important;
        }
      `}</style>

      {scenes.map((scene, index) => {
        const image = pickDohoonSceneImage({
          user,
          categoryId: categoryForProfile,
          sceneOrder: scene.order,
          imageKey: scene.dohoonImageKey || "analysis",
          salt: scene.sceneKey || `${profile.kind}-${scene.order}`,
        });

        const isLocked = Boolean(scene.locked);
        const isDanger = scene.mood === "warning";
        const reverse = index % 2 === 1;

        return (
          <article
            key={scene.id || `${profile.kind}-${scene.order}-${index}`}
            className={cx("route-webtoon-cut", moodClass(scene))}
          >
            <div
              className={cx(
                "grid min-h-[470px] md:grid-cols-2",
                reverse ? "md:[&>*:first-child]:order-2" : undefined,
              )}
            >
              <div className="relative min-h-[360px] overflow-hidden bg-black md:min-h-[470px]">
                <img
                  src={image}
                  alt={`도훈 ${labelFor(scene)}`}
                  className={cx(
                    "absolute inset-0 h-full w-full object-cover object-top",
                    isLocked ? "brightness-[0.42] saturate-50 blur-[1px]" : undefined,
                  )}
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallbackApplied === "true") return;
                    img.dataset.fallbackApplied = "true";
                    img.src = "/characters/dohoon.png";
                  }}
                />
                <div
                  className={cx(
                    "absolute inset-0",
                    isDanger
                      ? "bg-gradient-to-t from-[#4b0808] via-black/10 to-black/5"
                      : "bg-gradient-to-t from-black/80 via-black/5 to-black/5",
                  )}
                />
                <div className="absolute left-4 top-4 rounded-full border border-[#d8a86f] bg-black/65 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-[#f0c784]">
                  {labelFor(scene)}
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[10px] font-black text-white">
                  {scene.order} / {scenes.length}
                </div>
                {isLocked ? (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#d8a86f] bg-black/70 text-3xl">
                      🔒
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative flex flex-col justify-center p-5 sm:p-8">
                <div
                  className={cx(
                    "w-fit border-2 border-black px-3 py-1 text-[10px] font-black tracking-[0.18em]",
                    isDanger
                      ? "bg-white text-[#8b1010]"
                      : isLocked
                        ? "bg-[#d8a86f] text-black"
                        : "bg-[#efc86f] text-black",
                  )}
                >
                  {scene.mood === "warning"
                    ? "WARNING"
                    : scene.mood === "mystery"
                      ? "LOCKED"
                      : "SOREUM SCENE"}
                </div>

                {scene.dialogue ? (
                  <h3
                    className={cx(
                      "mt-4 break-keep text-[30px] font-black leading-[1.22] tracking-[-0.06em] sm:text-[42px]",
                      scene.mood === "gold" ||
                        scene.mood === "hope" ||
                        scene.mood === "reveal"
                        ? "text-[#17100b]"
                        : "text-white",
                    )}
                  >
                    {scene.dialogue}
                  </h3>
                ) : null}

                {scene.emphasis ? (
                  <div
                    className={cx(
                      "mt-5 border-[3px] border-black p-5 text-[18px] font-black leading-8 shadow-[7px_8px_0_rgba(0,0,0,.28)] sm:text-[21px]",
                      isDanger
                        ? "bg-[#fff0e9] text-[#6e0f0f]"
                        : "bg-[#fffaf0] text-[#20150e]",
                    )}
                  >
                    {scene.emphasis}
                  </div>
                ) : null}

                {scene.narration ? (
                  <p
                    className={cx(
                      "mt-5 break-keep text-[15px] font-bold leading-7 sm:text-[17px] sm:leading-8",
                      scene.mood === "gold" ||
                        scene.mood === "hope" ||
                        scene.mood === "reveal"
                        ? "text-[#44372d]"
                        : "text-[#e3d8cb]",
                    )}
                  >
                    {scene.narration}
                  </p>
                ) : null}

                {scene.bullets?.length ? (
                  <div className="mt-5 grid gap-2">
                    {scene.bullets.map((item, bulletIndex) => (
                      <div
                        key={`${scene.id}-bullet-${bulletIndex}`}
                        className={cx(
                          "border-2 border-black p-3 text-sm font-black leading-6",
                          scene.mood === "gold" ||
                            scene.mood === "hope" ||
                            scene.mood === "reveal"
                            ? "bg-white text-black"
                            : "bg-black/45 text-white",
                        )}
                      >
                        {bulletIndex + 1}. {item}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {index === 2 && scoreVisual?.kind === "loveMarriage" ? (
              <div className="border-t-[8px] border-black bg-[#0b0909] p-4">
                <RelationshipVisualTeaser data={scoreVisual} user={user} />
              </div>
            ) : null}

            {index === 2 && scoreVisual?.kind === "compatibility" ? (
              <div className="border-t-[8px] border-black bg-[#090709] p-4">
                <RelationshipVisualTeaser data={scoreVisual} user={user} />
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}


function getHealthStyleProfileFacts(profile: CategoryPreviewProfile) {
  if (profile.kind === "today") {
    return [
      { label: "오늘 점수", value: `${profile.overallScore}` },
      { label: "가장 좋은 시간", value: profile.bestTime },
      { label: "살아나는 운", value: profile.strongestArea },
      { label: "조심할 운", value: profile.warningArea },
    ];
  }

  if (profile.kind === "career") {
    return [
      { label: "회사형", value: `${profile.split.office}%` },
      { label: "자기판형", value: `${profile.split.own}%` },
      { label: "주 역할", value: profile.primary },
      { label: "전환 시기", value: profile.transitionWindow },
    ];
  }

  if (profile.kind === "love") {
    return [
      { label: "연애운", value: `${profile.loveScore}` },
      { label: "결혼운", value: `${profile.marriageScore}` },
      { label: "끌리는 지점", value: profile.attractionPoint },
      { label: "강한 인연 시기", value: profile.strongWindow },
    ];
  }

  if (profile.kind === "compatibility") {
    return [
      { label: "전체 궁합", value: `${profile.overallScore}` },
      { label: "연애", value: `${profile.loveScore}` },
      { label: "결혼", value: `${profile.marriageScore}` },
      { label: "끌림", value: `${profile.mutualAttraction}` },
    ];
  }

  if (profile.kind === "year") {
    return [
      { label: "올해 점수", value: `${profile.overallScore}` },
      { label: "가장 좋은 달", value: `${profile.bestMonth}월` },
      { label: "돈의 달", value: `${profile.moneyMonth}월` },
      { label: "일의 달", value: `${profile.careerMonth}월` },
    ];
  }

  if (profile.kind === "lifeFlow") {
    return [
      { label: "큰 기회 횟수", value: `${profile.chanceCount}회` },
      { label: "첫 상승", value: profile.firstRise },
      { label: "가장 큰 구간", value: profile.biggestWindow },
      { label: "주의 구간", value: profile.cautionWindow },
    ];
  }

  if (profile.kind === "lifetime") {
    return [
      { label: "가장 강한 복", value: profile.strongestBlessing.label },
      { label: "가장 약한 구멍", value: profile.weakestHole.label },
      { label: "전환 구간", value: profile.turningWindow },
      { label: "핵심 방향", value: profile.coreAdvice },
    ];
  }

  if (profile.kind === "worry") {
    return [
      { label: "판정", value: profile.verdict },
      { label: "지금 할 것", value: profile.doNow },
      { label: "지금 피할 것", value: profile.avoidNow },
    ];
  }

  return [];
}

function getHealthStyleCategoryLabel(profile: CategoryPreviewProfile) {
  if (profile.kind === "today") return "TODAY FORTUNE";
  if (profile.kind === "career") return "WORK & BUSINESS";
  if (profile.kind === "love") return "LOVE & MARRIAGE";
  if (profile.kind === "compatibility") return "COMPATIBILITY";
  if (profile.kind === "year") return "YEAR FORTUNE";
  if (profile.kind === "lifeFlow") return "LIFE FLOW";
  if (profile.kind === "lifetime") return "LIFETIME SAJU";
  if (profile.kind === "worry") return "SAJU CONSULT";
  return "SOREUM SAJU";
}

function getHealthStyleCategoryHeadline(profile: CategoryPreviewProfile) {
  if (profile.kind === "today") return profile.verdict;
  if (profile.kind === "career") return profile.verdict;
  if (profile.kind === "love") return profile.headline;
  if (profile.kind === "compatibility") return profile.verdict;
  if (profile.kind === "year") return profile.headline;
  if (profile.kind === "lifeFlow") return profile.headline;
  if (profile.kind === "lifetime") return profile.headline;
  if (profile.kind === "worry") return profile.headline;
  return "";
}


function LoveMarriageFreeResult({
  profile,
  user,
  scoreVisual,
  freeComicScenes = [],
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "love" }>;
  user: UserInfo;
  scoreVisual: RelationshipScoreVisual;
  freeComicScenes?: CareerFreeComicScene[];
}) {
  const hero = pickDohoonSceneImage({
    user,
    categoryId: "love",
    sceneOrder: 1,
    imageKey: "opening",
    salt: "love-marriage-free-v204",
  });

  const loveVisual = scoreVisual?.kind === "loveMarriage" ? scoreVisual : null;
  const firstImpression =
    loveVisual?.love.metrics.find((item) => item.key === "firstImpression") || null;
  const expression =
    loveVisual?.love.metrics.find((item) => item.key === "expression") || null;
  const discernment =
    loveVisual?.love.metrics.find((item) => item.key === "discernment") || null;
  const stability =
    loveVisual?.love.metrics.find((item) => item.key === "relationshipStability") || null;
  const spouseLuck =
    loveVisual?.marriage.metrics.find((item) => item.key === "spouseLuck") || null;
  const marriageStability =
    loveVisual?.marriage.metrics.find((item) => item.key === "marriageStability") || null;

  const bars = [
    firstImpression ? { label: "인연 유입력", score: firstImpression.score, text: "새 인연이 나를 의식하게 만드는 힘" } : null,
    expression ? { label: "호감 전달력", score: expression.score, text: "좋아하는 마음이 상대에게 전달되는 힘" } : null,
    discernment ? { label: "사람 보는 눈", score: discernment.score, text: "끌림과 오래 갈 사람을 가려내는 힘" } : null,
    stability ? { label: "연애 지속력", score: stability.score, text: "관계를 오래 끌고 가는 힘" } : null,
    spouseLuck ? { label: "배우자복", score: spouseLuck.score, text: "함께 안정될 배우자를 만나는 힘" } : null,
    marriageStability ? { label: "결혼 안정도", score: marriageStability.score, text: "결혼 후 관계를 유지하는 힘" } : null,
  ].filter(Boolean) as Array<{ label: string; score: number; text: string }>;

  const partnerDescription =
    loveVisual?.visualProfiles.partnerDescription || profile.partnerDescription;
  const verdict =
    loveVisual?.love.verdict || profile.headline;

  return (
    <section className="mt-5 overflow-hidden border border-[#72563a] bg-[#090806] text-white shadow-[0_34px_120px_rgba(0,0,0,.48)]">
      <section className="relative overflow-hidden bg-black">
        <img
          src={hero}
          alt=""
          className="block h-auto w-full object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <div className="text-[10px] font-black tracking-[0.24em] text-[#efc47e]">FREE LOVE & MARRIAGE</div>
          <h2 className="mt-3 break-keep text-[32px] font-black leading-[1.12] tracking-[-0.055em] sm:text-[48px]">
            {verdict}
          </h2>
          <p className="mt-4 break-keep text-[15px] font-bold leading-7 text-white/80">
            연애와 결혼을 같은 점수로 보지 않는다. 끌림, 사람 보는 눈, 관계 지속력과 결혼 안정도를 따로 본다.
          </p>
        </div>
      </section>

      <section className="bg-[#17110e] px-5 py-9 sm:px-8">
        <div className="text-[10px] font-black tracking-[0.22em] text-[#d8a86f]">RELATIONSHIP SCORE</div>
        <h3 className="mt-3 text-[27px] font-black tracking-[-0.05em]">내 연애와 결혼은 몇 점인가</h3>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="border border-[#80603e] bg-[#20160d] p-5">
            <div className="text-[11px] font-black text-[#ad9170]">연애운</div>
            <div className="mt-2 text-[36px] font-black text-[#f1ca89]">{profile.loveScore}점</div>
          </div>
          <div className="border border-[#80603e] bg-[#20160d] p-5">
            <div className="text-[11px] font-black text-[#ad9170]">결혼운</div>
            <div className="mt-2 text-[36px] font-black text-[#f1ca89]">{profile.marriageScore}점</div>
          </div>
        </div>

        {bars.length ? (
          <div className="mt-7 space-y-5">
            {bars.map((item) => (
              <div key={item.label}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-black text-[#f0e2d2]">{item.label}</div>
                    <div className="mt-1 text-[12px] font-bold text-[#8f7b64]">{item.text}</div>
                  </div>
                  <div className="text-[23px] font-black text-[#efc47e]">{item.score}점</div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#d8a86f]" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="bg-[#0d0b09] px-5 py-9 sm:px-8">
        <div className="text-[10px] font-black tracking-[0.2em] text-[#d8a86f]">WHO PULLS ME IN?</div>
        <h3 className="mt-3 text-[26px] font-black tracking-[-0.05em]">내가 실제로 끌리는 사람</h3>
        <p className="mt-4 break-keep text-[19px] font-black leading-8 text-[#f1ca89]">{profile.attractionPoint}</p>
        {partnerDescription ? (
          <p className="mt-3 break-keep text-[14px] font-bold leading-7 text-[#cbb9a6]">{partnerDescription}</p>
        ) : null}
      </section>

      <section className="grid gap-px bg-[#392b20] sm:grid-cols-2">
        <div className="bg-[#15100d] p-6">
          <div className="text-[10px] font-black tracking-[0.18em] text-[#d8a86f]">AVOID</div>
          <h3 className="mt-3 text-[20px] font-black">피해야 할 상대</h3>
          <p className="mt-3 break-keep text-[15px] font-bold leading-7 text-[#e4d5c5]">{profile.avoidPartner}</p>
        </div>
        <div className="bg-[#15100d] p-6">
          <div className="text-[10px] font-black tracking-[0.18em] text-[#d8a86f]">MY RISK</div>
          <h3 className="mt-3 text-[20px] font-black">내 연애의 위험 패턴</h3>
          <p className="mt-3 break-keep text-[15px] font-bold leading-7 text-[#e4d5c5]">{profile.relationshipRisk}</p>
        </div>
      </section>

      <section className="bg-[#21160f] px-5 py-9 sm:px-8">
        <div className="text-[10px] font-black tracking-[0.2em] text-[#d8a86f]">LOVE TIMING</div>
        <h3 className="mt-3 text-[25px] font-black">인연운이 강하게 움직이는 때</h3>
        <p className="mt-4 break-keep text-[22px] font-black leading-8 text-[#f1ca89]">{profile.strongWindow}</p>
      </section>

      <section className="bg-black px-5 py-9 sm:px-8">
        <div className="text-[10px] font-black tracking-[0.2em] text-[#8f7b64]">FULL REPORT에서 이어지는 것</div>
        <h3 className="mt-3 break-keep text-[25px] font-black">무료에서 본 사람과 시기를 유료에서 끝까지 판다</h3>
        <div className="mt-5 grid gap-2 text-[14px] font-bold leading-7 text-[#c9b9a8]">
          <div>· 내가 어떤 사람에게 끌리고 왜 그 사람에게 약해지는지</div>
          <div>· 상대가 나에게 빠지는 지점과 질리는 지점</div>
          <div>· 나와 오래 가는 사람과 피해야 할 사람</div>
          <div>· 올해 놓치면 아까운 인연과 실제 인연 시기</div>
          <div>· 결혼운이 움직이는 시기와 맞는 배우자 유형</div>
          <div>· 결혼 후 돈·가족 거리·말투·생활 습관</div>
        </div>
      </section>
    </section>
  );
}

function HealthStyleCategoryLongform({
  profile,
  user,
  categoryId,
  categoryTitle,
  freeComicScenes = [],
}: {
  profile: Exclude<CategoryPreviewProfile, { kind: "health" }>;
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  freeComicScenes?: CareerFreeComicScene[];
}) {
  const hero=pickDohoonSceneImage({
    user,categoryId,sceneOrder:1,imageKey:"opening",
    salt:`category-free-v203-${profile.kind}`,
  });

  const resultItems:[string,unknown][] = (() => {
    switch(profile.kind){
      case "today": return [
        ["오늘 점수",`${profile.overallScore}점`],["가장 좋은 시간",profile.bestTime],
        ["살아나는 운",profile.strongestArea],["조심할 운",profile.warningArea],
        ["오늘 할 것",profile.doOne],["오늘 피할 것",profile.avoidOne],
      ];
      case "money": return [
        ["돈그릇",profile.capacityRange],["현재 활용도",`${profile.utilization}점`],
        ["돈 버는 방식",profile.primaryStyle],["돈을 막는 것",profile.blocker],
        ["첫 상승 구간",profile.firstWindow],["가장 큰 돈의 구간",profile.peakWindow],
      ];
      case "career": return [
        ["회사 적합도",`${profile.split?.office}점`],["내 이름으로 버는 힘",`${profile.split?.own}점`],
        ["일의 첫 판정",profile.verdict],["가장 강한 무기",profile.strongestSkill],
        ["돈 되는 역할",profile.moneyRole],["전환 구간",profile.transitionWindow],
      ];
      case "love": return [
        ["연애 점수",`${profile.loveScore}점`],["결혼 점수",`${profile.marriageScore}점`],
        ["첫 판정",profile.headline],["내가 끌리는 사람",profile.attractionPoint],
        ["피해야 할 상대",profile.avoidPartner],["인연이 움직이는 때",profile.strongWindow],
      ];
      case "compatibility": return [
        ["총 궁합",`${profile.overallScore}점`],["연애 궁합",`${profile.loveScore}점`],
        ["결혼 궁합",`${profile.marriageScore}점`],["속궁합",`${profile.intimacyScore}점`],
        ["서로 끌리는 이유",profile.mutualAttraction],["부딪히는 곳",profile.conflictPoint],
      ];
      case "year": return [
        ["올해 점수",`${profile.overallScore}점`],["올해 핵심",profile.theme],
        ["가장 좋은 달",profile.bestMonth],["돈이 움직이는 달",profile.moneyMonth],
        ["일이 살아나는 달",profile.careerMonth],
        ["주의할 달",`${profile.relationshipWarningMonth} · ${profile.healthWarningMonth}`],
      ];
      case "lifeFlow": return [
        ["기회 횟수",`${profile.chanceCount}번`],["첫 상승",profile.firstRise],
        ["가장 큰 기회",profile.biggestWindow],["주의 구간",profile.cautionWindow],
        ["후반 인생",profile.lateLife],
      ];
      case "lifetime": return [
        ["가장 강한 복",profile.strongestBlessing],["가장 약한 구멍",profile.weakestHole],
        ["인생 전환점",profile.turningWindow],["평생 핵심 조언",profile.coreAdvice],
      ];
      case "worry": return [
        ["지금 판정",profile.verdict],["판정 이유",profile.reasons.join(" · ")],
        ["지금 피할 것",profile.avoidNow],["지금 할 것",profile.doNow],
      ];
      default:return [];
    }
  })().filter(([,v])=>String(v??"").trim());

  const middle=freeComicScenes[Math.min(2,Math.max(0,freeComicScenes.length-1))];
  const last=freeComicScenes[Math.max(0,freeComicScenes.length-1)];

  const mapName =
    profile.kind==="money"?"MONEY MAP":
    profile.kind==="career"?"WORK MAP":
    profile.kind==="love"?"RELATIONSHIP MAP":
    profile.kind==="compatibility"?"TWO PERSON MAP":
    profile.kind==="year"?"YEAR MAP":
    profile.kind==="lifeFlow"?"LIFE CURVE":
    profile.kind==="lifetime"?"LIFE MAP":
    profile.kind==="worry"?"DECISION MAP":"RESULT MAP";

  return (
    <section className="mt-5 overflow-hidden border border-[#72563a] bg-[#090806] text-white shadow-[0_34px_120px_rgba(0,0,0,.48)]">
      <section className="relative overflow-hidden bg-black">
        <img src={hero} alt="" className="block h-auto w-full object-contain"
          onError={(e)=>{e.currentTarget.style.display="none";}} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent"/>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <div className="text-[10px] font-black tracking-[0.24em] text-[#efc47e]">FREE SAJU RESULT</div>
          <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.12] tracking-[-0.055em] sm:text-[50px]">{categoryTitle}</h2>
          {freeComicScenes[0]?.emphasis?<p className="mt-4 break-keep text-[17px] font-black leading-8 text-white/90">{freeComicScenes[0].emphasis}</p>:null}
        </div>
      </section>

      <section className="bg-[#17110e] px-5 py-9 sm:px-8">
        <div className="text-[10px] font-black tracking-[0.22em] text-[#d8a86f]">{mapName}</div>
        <h3 className="mt-3 break-keep text-[27px] font-black tracking-[-0.05em]">무료에서 먼저 드러나는 내 결과</h3>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {resultItems.map(([label,value],i)=>(
            <div key={`${label}-${i}`} className={`border p-5 ${i===0?"col-span-2 border-[#80603e] bg-[#20160d]":"border-[#453526] bg-[#0d0a08]"}`}>
              <div className="text-[10px] font-black tracking-[0.14em] text-[#ad9170]">{label}</div>
              <div className={`mt-2 break-keep font-black leading-7 ${i===0?"text-[27px] text-[#f1ca89]":"text-[18px] text-[#eee1d2]"}`}>{String(value)}</div>
            </div>
          ))}
        </div>
      </section>

      {profile.kind === "career" && Array.isArray(profile.scores) && profile.scores.length ? (
        <section className="bg-[#0b0908] px-5 py-9 sm:px-8">
          <div className="text-[10px] font-black tracking-[0.22em] text-[#d8a86f]">CAREER DETAIL</div>
          <h3 className="mt-3 text-[26px] font-black">내가 실제로 돈으로 바꾸기 쉬운 능력</h3>
          <div className="mt-6 space-y-5">
            {profile.scores.slice(0,4).map((item) => (
              <div key={item.label}>
                <div className="flex justify-between gap-4 text-sm font-black"><span>{item.label}</span><span>{item.score}점</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d8a86f]" style={{width:`${Math.max(4,Math.min(100,item.score))}%`}} /></div>
              </div>
            ))}
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="border border-[#4b603b] bg-[#11180e] p-5"><div className="text-[10px] font-black text-[#a9c98e]">돈 되는 역할</div><div className="mt-2 text-[18px] font-black leading-7">{profile.moneyRole}</div></div>
            <div className="border border-[#663a36] bg-[#1a0e0d] p-5"><div className="text-[10px] font-black text-[#e0a19a]">피해야 할 일</div><div className="mt-2 text-[18px] font-black leading-7">{profile.avoidWork}</div></div>
          </div>
        </section>
      ) : null}

      {middle?(
        <section className="relative overflow-hidden bg-black">
          <img src={pickDohoonSceneImage({user,categoryId,sceneOrder:middle.order||3,imageKey:middle.sceneKey||"analysis",salt:`category-free-v203-middle-${profile.kind}`})}
            alt="" className="block h-auto w-full object-contain" onError={(e)=>{e.currentTarget.style.display="none";}}/>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"/>
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
            <div className="text-[10px] font-black tracking-[0.2em] text-[#d8a86f]">DOHOON'S READ</div>
            {middle.emphasis?<h3 className="mt-3 break-keep text-[29px] font-black leading-tight tracking-[-0.05em] sm:text-[40px]">{middle.emphasis}</h3>:null}
            {middle.narration?<p className="mt-4 break-keep text-[15px] font-bold leading-8 text-white/80">{middle.narration}</p>:null}
          </div>
        </section>
      ):null}

      {freeComicScenes.slice(1,4).filter((scene)=>scene && scene !== middle).map((scene, idx)=>(
        <section key={`free-insight-${scene.order}-${idx}`} className="border-t border-white/8 bg-[#14100d] px-5 py-8 sm:px-8">
          <div className="text-[10px] font-black tracking-[0.2em] text-[#d8a86f]">DEEP READ {idx+1}</div>
          {scene.emphasis ? <h3 className="mt-3 break-keep text-[23px] font-black leading-8">{scene.emphasis}</h3> : null}
          {scene.narration ? <p className="mt-3 break-keep text-[15px] font-bold leading-8 text-[#d5c7b8]">{scene.narration}</p> : null}
        </section>
      ))}

      <section className="bg-[#0d0b09] px-5 py-9 sm:px-8">
        {last?.narration?<p className="border-l-4 border-[#d8a86f] pl-4 break-keep text-[15px] font-bold leading-8 text-[#d8cbbc]">{last.narration}</p>:null}
        <div className="mt-8 border-t border-white/10 pt-7">
          <div className="text-[10px] font-black tracking-[0.18em] text-[#8f7b64]">FULL REPORT에서 이어지는 것</div>
          <p className="mt-3 break-keep text-[14px] font-bold leading-7 text-[#b9aa9a]">
            무료에서 공개한 판정은 뒤집지 않습니다. 전체판에서는 왜 이 결과가 나왔는지와 실제 시기·상황·반복 패턴,
            피해야 할 선택과 움직여야 할 순서를 구체적으로 이어서 풉니다.
          </p>
        </div>
      </section>
    </section>
  );
}


function TodayFreeResult({
  profile,
  user,
  freeComicScenes = [],
}: {
  profile: Extract<CategoryPreviewProfile, { kind: "today" }>;
  user: UserInfo;
  freeComicScenes?: CareerFreeComicScene[];
}) {
  const hero = pickDohoonSceneImage({
    user,
    categoryId: "today",
    sceneOrder: 1,
    imageKey: "opening",
    salt: "today-free-v212-hero",
  });

  const bridgeImage = pickDohoonSceneImage({
    user,
    categoryId: "today",
    sceneOrder: 4,
    imageKey: "warning",
    salt: "today-free-v212-bridge",
  });

  const reasonScenes = freeComicScenes.filter(
    (scene) => scene?.narration || scene?.emphasis,
  );
  const firstReason = reasonScenes[0];
  const secondReason = reasonScenes[1];
  const thirdReason = reasonScenes[2];
  const bestScene =
    freeComicScenes.find((scene) => scene.sceneKey?.includes("analysis")) ||
    secondReason;
  const warningScene =
    freeComicScenes.find((scene) => scene.sceneKey?.includes("warning")) ||
    thirdReason;

  const lockedItems = profile.paidLockedItems?.length
    ? profile.paidLockedItems
    : [
        { title: `${profile.bestTime}, 무엇부터 움직여야 하나`, teaser: "돈 · 일 · 연락 중 오늘 가장 먼저 잡아야 할 것" },
        { title: "오늘 돈에서 하면 안 되는 선택", teaser: "들어오는 돈보다 새는 돈을 먼저 막아야 하는지" },
        { title: "오늘 일에서 밀어도 되는 것", teaser: "연락 · 보고 · 거래 · 결정 중 실제로 움직일 것" },
        { title: "오늘 사람에게 먼저 움직여도 되는가", teaser: "연락할지 기다릴지, 오늘 꼬이는 지점" },
        { title: "오늘 몸이 꺾이는 순간", teaser: "집중력과 피로가 떨어지는 흐름" },
        { title: "오늘 반드시 해야 할 한 가지", teaser: "오늘 운을 실제 결과로 바꾸는 행동" },
        { title: "오늘 절대 하지 말아야 할 한 가지", teaser: "오늘 손실과 후회를 만드는 행동" },
      ];

  return (
    <section className="mt-5 overflow-hidden border border-[#6d543c] bg-[#120e0b] shadow-[0_34px_120px_rgba(0,0,0,.42)]">
      {/* 1. Hero — large Dohoon image + today's verdict */}
      <section className="relative overflow-hidden bg-[#0b0806]">
        <img
          src={hero}
          alt="도훈 오늘운세"
          className="block h-auto w-full object-contain"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.dataset.fallbackApplied === "true") {
              img.style.display = "none";
              return;
            }
            img.dataset.fallbackApplied = "true";
            img.src = "/characters/dohoon.png";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0806] via-[#0b0806]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <div className="text-[11px] font-black tracking-[0.22em] text-[#d6ad72]">오늘의 판정</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-[68px] font-black leading-none tracking-[-0.08em] text-[#e8c17f] sm:text-[92px]">
              {profile.overallScore}
            </div>
            <div className="pb-2 text-[20px] font-black text-[#f5eee3]/65">점</div>
          </div>
          <h2 className="mt-4 max-w-3xl break-keep text-[31px] font-black leading-[1.18] tracking-[-0.055em] text-[#fffaf1] sm:text-[48px]">
            {profile.verdict}
          </h2>
        </div>
      </section>

      {/* 2. Actual interpretation first — prose, not dashboard */}
      <section className="bg-[#f3ecdf] px-5 py-10 text-[#201914] sm:px-8 sm:py-12">
        <div className="text-[11px] font-black tracking-[0.2em] text-[#8b683e]">오늘 네 사주에서 먼저 보이는 것</div>
        <div className="mt-5 space-y-5">
          {firstReason?.narration ? (
            <p className="break-keep text-[17px] font-bold leading-8 sm:text-[18px]">{firstReason.narration}</p>
          ) : (
            <p className="break-keep text-[17px] font-bold leading-8 sm:text-[18px]">
              오늘은 {profile.strongestArea}의 흐름을 먼저 살리고, {profile.warningArea}에서 생기는 작은 실수를 줄이는 쪽으로 하루를 써야 한다.
            </p>
          )}
          {secondReason?.narration ? (
            <p className="break-keep text-[16px] font-semibold leading-8 text-[#514438]">{secondReason.narration}</p>
          ) : null}
        </div>

        <div className="mt-9">
          <div className="text-[11px] font-black tracking-[0.18em] text-[#8b683e]">오늘의 4대 운세</div>
          <h3 className="mt-3 break-keep text-[27px] font-black leading-tight tracking-[-0.04em] text-[#241b15] sm:text-[36px]">
            오늘은 어디가 강하고, 어디를 조심해야 하나
          </h3>
          <p className="mt-3 break-keep text-[14px] font-semibold leading-7 text-[#6b5b4c]">
            종합점수 하나로 끝내지 않고 재물·일·인연·건강의 흐름을 따로 보면 오늘 운의 방향이 더 선명해진다.
          </p>

          <div className="mt-6 space-y-5 border border-[#d6c5aa] bg-[#fffaf0] px-5 py-6 sm:px-6">
            {[
              { label: "오늘의 재물운", score: profile.moneyScore },
              { label: "오늘의 일·사업운", score: profile.workScore },
              { label: "오늘의 연애·인연운", score: profile.relationshipScore },
              { label: "오늘의 건강운", score: profile.healthScore },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-end justify-between gap-4">
                  <div className="text-[15px] font-black text-[#33271e] sm:text-[16px]">{item.label}</div>
                  <div className="shrink-0 text-[22px] font-black leading-none text-[#9a6e36]">
                    {item.score}<span className="ml-0.5 text-[12px] text-[#9a846c]">점</span>
                  </div>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e6dac8]">
                  <div
                    className="h-full rounded-full bg-[#a77a3f]"
                    style={{ width: `${Math.max(0, Math.min(100, Number(item.score) || 0))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border-l-4 border-[#a77a3f] bg-[#eee3d2] px-5 py-4">
              <div className="text-[10px] font-black tracking-[0.12em] text-[#8b683e]">오늘 가장 살아나는 축</div>
              <p className="mt-2 break-keep text-[16px] font-black leading-7 text-[#30241b]">
                {profile.strongestArea} · 네 가지 흐름 중 오늘 먼저 써야 할 운이다.
              </p>
            </div>
            <div className="border-l-4 border-[#8d5149] bg-[#eee3d2] px-5 py-4">
              <div className="text-[10px] font-black tracking-[0.12em] text-[#8d5149]">오늘 가장 조심할 축</div>
              <p className="mt-2 break-keep text-[16px] font-black leading-7 text-[#30241b]">
                {profile.warningArea} · 점수가 낮은 이유를 실제 행동에서 조심해야 한다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-9 grid grid-cols-3 overflow-hidden border border-[#cdbb9f] bg-[#fffaf0]">
          <div className="border-r border-[#d9cbb5] p-4 sm:p-5">
            <div className="text-[10px] font-black tracking-[0.08em] text-[#8c7860]">좋은 시간</div>
            <div className="mt-2 break-keep text-[17px] font-black leading-6 text-[#7b5429] sm:text-[20px]">{profile.bestTime}</div>
          </div>
          <div className="border-r border-[#d9cbb5] p-4 sm:p-5">
            <div className="text-[10px] font-black tracking-[0.08em] text-[#8c7860]">살아나는 운</div>
            <div className="mt-2 break-keep text-[17px] font-black leading-6 text-[#7b5429] sm:text-[20px]">{profile.strongestArea}</div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-[10px] font-black tracking-[0.08em] text-[#8c7860]">조심할 운</div>
            <div className="mt-2 break-keep text-[17px] font-black leading-6 text-[#8d433c] sm:text-[20px]">{profile.warningArea}</div>
          </div>
        </div>
      </section>

      {/* 3. Timing + concrete reading */}
      <section className="border-t border-[#d7c7ad] bg-[#fffaf0] px-5 py-10 text-[#201914] sm:px-8 sm:py-12">
        <div className="text-[11px] font-black tracking-[0.18em] text-[#9a7445]">오늘 가장 먼저 잡아야 할 시간</div>
        <h3 className="mt-3 break-keep text-[29px] font-black leading-tight tracking-[-0.045em] sm:text-[38px]">
          {profile.bestTime}, 오늘은 이 시간을 놓치지 마
        </h3>
        <p className="mt-5 break-keep text-[16px] font-bold leading-8 text-[#514438]">
          {bestScene?.narration || `${profile.bestTime} 전후에는 ${profile.strongestArea}과 관련된 일을 미루지 않는 편이 낫다.`}
        </p>

        <div className="mt-8 border-l-4 border-[#b88a4b] bg-[#f3ecdf] px-5 py-5">
          <div className="text-[11px] font-black tracking-[0.12em] text-[#8b683e]">오늘 흐름이 꺾이는 지점</div>
          <p className="mt-3 break-keep text-[16px] font-bold leading-8 text-[#40362e]">
            {warningScene?.narration || `${profile.warningArea}에서는 괜찮다고 밀어붙이기보다 한 번 멈추고 판단하는 편이 낫다.`}
          </p>
          {thirdReason?.narration && thirdReason !== warningScene ? (
            <p className="mt-3 break-keep text-[15px] font-semibold leading-7 text-[#65584c]">{thirdReason.narration}</p>
          ) : null}
        </div>
      </section>

      {/* 4. One free action only — no repeated FREE RESULT blocks */}
      <section className="bg-[#17110d] px-5 py-9 text-[#fff9ee] sm:px-8">
        <div className="text-[10px] font-black tracking-[0.2em] text-[#d8ad70]">오늘 무료에서 가져갈 한 가지</div>
        <p className="mt-3 break-keep text-[22px] font-black leading-9 text-[#f3dfb8]">{profile.doOne}</p>
        <p className="mt-3 break-keep text-[14px] font-semibold leading-7 text-[#c8b9a7]">
          오늘은 이것부터 지키고, {profile.warningArea}에서는 성급하게 반응하지 않는 게 좋다.
        </p>
      </section>

      {/* 5. Large Dohoon transition — the paid hook starts here */}
      <section className="relative overflow-hidden bg-[#090705]">
        <img
          src={bridgeImage}
          alt="도훈 오늘운세 전체판 안내"
          className="block h-auto w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090705] via-[#090705]/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <div className="text-[10px] font-black tracking-[0.2em] text-[#d8ad70]">DOHOON'S CHECK</div>
          <h3 className="mt-3 max-w-3xl break-keep text-[30px] font-black leading-tight tracking-[-0.05em] text-[#f1c987] sm:text-[44px]">
            {profile.paidHookTitle || "오늘 운은 여기서 한 번 더 갈린다"}
          </h3>
          <p className="mt-4 max-w-3xl break-keep text-[15px] font-bold leading-8 text-[#f6eee3]/85">
            {profile.paidHookBody || `오늘은 ${profile.strongestArea}을 살리는 것만큼 ${profile.warningArea}에서 실수하지 않는 게 중요하다.`}
          </p>
          <p className="mt-5 max-w-3xl break-keep border-l-2 border-[#d8ad70] pl-4 text-[17px] font-black leading-8 text-[#f6dba9]">
            “{profile.paidHookQuote || `오늘은 잘되는 걸 더 하는 것보다, ${profile.warningArea}에서 잘못 건드리지 않는 게 더 중요해.`}”
          </p>
        </div>
      </section>

      {/* 6. Ivory locked answers — short, question-led */}
      <section className="bg-[#f3ecdf] px-5 py-10 text-[#201914] sm:px-8 sm:py-12">
        <div className="text-[11px] font-black tracking-[0.18em] text-[#8b683e]">아직 공개하지 않은 오늘의 답</div>
        <h3 className="mt-3 break-keep text-[27px] font-black leading-tight tracking-[-0.04em] sm:text-[36px]">
          좋은 시간을 알았다면, 이제 무엇을 할지가 남았다
        </h3>

        <div className="mt-7 space-y-3">
          {lockedItems.map((item, idx) => (
            <div key={`today-lock-v212-${idx}`} className="border border-[#d2c1a5] bg-[#fffaf0] px-5 py-4 shadow-[0_8px_26px_rgba(80,55,25,.06)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 text-[#a77a3f]">🔒</div>
                <div className="min-w-0">
                  <div className="break-keep text-[16px] font-black leading-7 text-[#2a211a]">{item.title}</div>
                  <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#766858]">{item.teaser}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 border-t border-[#cdbb9f] pt-8 text-center">
          <div className="text-[11px] font-black tracking-[0.16em] text-[#9a7445]">오늘은 {profile.overallScore}점에서 끝나는 날이 아니다</div>
          <p className="mx-auto mt-3 max-w-2xl break-keep text-[18px] font-black leading-8 text-[#33271e]">
            {profile.paidFinalHook || `좋은 시간도 잡혔고 살아나는 운도 잡혔다. 이제 ${profile.strongestArea}을 어디에 쓰고 ${profile.warningArea}에서 무엇을 피할지 확인할 차례다.`}
          </p>
          <div className="mx-auto mt-6 max-w-xl bg-[#9b713b] px-5 py-4 text-[15px] font-black text-[#fffaf0] shadow-[0_14px_34px_rgba(83,55,24,.18)]">
            {profile.paidCtaLabel || "오늘 해야 할 것 · 피해야 할 것 확인하기 · 1,900원"}
          </div>
        </div>
      </section>
    </section>
  );
}


function SajuBasicProfileCardV214({
  user,
  profile,
  categoryId,
}: {
  user: any;
  profile: any;
  categoryId?: string;
}) {
  const foundation = profile?.sajuFoundation || profile || {};
  const currentYear = new Date().getFullYear();
  const birthYear = Number(String(user?.birthDate || user?.birth || "").slice(0, 4));
  const age = foundation?.currentAge ?? (Number.isFinite(birthYear) && birthYear > 0 ? currentYear - birthYear : null);

  const zodiacAnimals = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];
  const zodiacRaw = foundation?.zodiac || (Number.isFinite(birthYear) ? `${zodiacAnimals[birthYear % 12]}띠` : "");
  const zodiac = String(zodiacRaw || "").replace(/띠$/, "");

  const rawElements =
    foundation?.elements ||
    foundation?.elementScores ||
    foundation?.fiveElements ||
    foundation?.manse?.elements ||
    {};

  const readElement = (ko: string, hanja: string, en: string) => {
    const v = rawElements?.[ko] ?? rawElements?.[hanja] ?? rawElements?.[en] ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const elements = [
    { key: "water", label: "수(水)", value: readElement("수", "水", "water") },
    { key: "wood", label: "목(木)", value: readElement("목", "木", "wood") },
    { key: "earth", label: "토(土)", value: readElement("토", "土", "earth") },
    { key: "metal", label: "금(金)", value: readElement("금", "金", "metal") },
    { key: "fire", label: "화(火)", value: readElement("화", "火", "fire") },
  ];
  const maxValue = Math.max(...elements.map((e) => e.value), 1);
  const strongest = [...elements].sort((a, b) => b.value - a.value)[0];
  const weakest = [...elements].sort((a, b) => a.value - b.value)[0];
  const strongestMeaning = foundation?.strongestMeaning || {};
  const weakestMeaning = foundation?.weakestMeaning || {};


  const dayMaster =
    foundation?.dayMaster ||
    foundation?.ilgan ||
    foundation?.manse?.dayMaster ||
    foundation?.manse?.ilgan ||
    "";

  const bridgeMap: Record<string, string> = {
    today: "이 기본 사주가 오늘 하루에는 어떻게 움직이는지 이어서 본다.",
    wealth: "이 기본 사주가 돈에서는 어떻게 나타나는지, 이제 돈그릇과 실제 돈이 붙는 길을 본다.",
    career: "이 기본 사주가 일에서는 어떻게 나타나는지, 이제 몸값이 오르는 자리와 자기 일을 키우는 길을 본다.",
    love: "이 기본 사주가 사람을 좋아할 때 어떻게 움직이는지, 끌림과 약점을 이어서 본다.",
    marriage: "이 기본 사주가 결혼생활에서는 어떻게 나타나는지, 배우자와 현실생활의 흐름을 이어서 본다.",
    compatibility: "두 사람의 기본 기운이 실제 관계에서 어디서 붙고 어디서 부딪히는지 이어서 본다.",
    year: "이 기본 사주 위에 올해의 기운이 어떻게 겹치는지, 돈·일·사람·몸의 변화를 이어서 본다.",
    life: "이 기본 사주가 나이에 따라 언제 강해지고 언제 방향을 바꾸는지 인생 흐름으로 이어서 본다.",
    lifetime: "이 기본 사주가 평생 돈·일·사람·건강에서 어떻게 반복되는지 전체 흐름으로 이어서 본다.",
    worry: "이 기본 사주를 바탕으로 지금 묻는 고민에서 무엇을 밀고 무엇을 멈춰야 하는지 이어서 본다.",
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#d7c7ab] bg-[#f5efe4] shadow-[0_18px_55px_rgba(54,39,24,0.08)]">
      <div className="border-b border-[#d7c7ab] bg-[#1d1a17] px-6 py-6 text-[#f6efdf] sm:px-8">
        <div className="text-[11px] font-black tracking-[0.2em] text-[#caa66b]">MY SAJU FOUNDATION</div>
        <h2 className="mt-2 break-keep text-[27px] font-black tracking-[-0.04em] sm:text-[34px]">
          {user?.name || "나"}의 사주 기본판
        </h2>
        <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#d8cdbd]">
          타고난 기질과 오행의 분포를 먼저 보고, 이 메뉴의 운을 그 위에서 해석합니다.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-[#d7c7ab] bg-[#fffaf0] p-6 lg:border-b-0 lg:border-r sm:p-8">
          <div className="space-y-4">
            {age !== null && (
              <div className="flex items-center justify-between border-b border-[#e5d9c6] pb-3">
                <span className="text-[12px] font-black text-[#7d6a56]">현재 나이</span>
                <strong className="text-[17px] text-[#241d17]">{age}세</strong>
              </div>
            )}
            {zodiac && (
              <div className="flex items-center justify-between border-b border-[#e5d9c6] pb-3">
                <span className="text-[12px] font-black text-[#7d6a56]">띠</span>
                <strong className="text-[17px] text-[#241d17]">{zodiac}띠</strong>
              </div>
            )}
            {dayMaster && (
              <div className="flex items-center justify-between border-b border-[#e5d9c6] pb-3">
                <span className="text-[12px] font-black text-[#7d6a56]">일간</span>
                <strong className="text-[17px] text-[#241d17]">{String(dayMaster)}</strong>
              </div>
            )}
          </div>

          <div className="mt-7 rounded-2xl bg-[#eee4d3] p-5">
            <div className="text-[10px] font-black tracking-[0.16em] text-[#8d6c3f]">오행 균형 해석</div>
            <div className="mt-2 text-[20px] font-black text-[#2c231b]">
              강한 축 {strongest.label} · 보완 축 {weakest.label}
            </div>
            <p className="mt-3 break-keep text-[13px] font-semibold leading-6 text-[#645547]">
              오행은 좋고 나쁨을 단순 점수로 가르는 표가 아니다. 상대적으로 강한 기운은 자연스럽게 쓰는 힘,
              약한 기운은 의식적으로 보완해야 하는 힘으로 읽는다.
            </p>
          </div>
        </div>

        <div className="bg-[#fbf7ef] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black tracking-[0.16em] text-[#8d6c3f]">FIVE ELEMENTS BALANCE</div>
              <h3 className="mt-2 text-[22px] font-black tracking-[-0.03em] text-[#282019]">오행 에너지 분포</h3>
            </div>
            <div className="text-right text-[10px] font-bold leading-5 text-[#9b8a76]">절대적인 길흉이 아닌<br />명식 내부의 상대 분포</div>
          </div>

          <div className="mt-6 space-y-4">
            {elements.map((item) => {
              const pct = Math.max(3, Math.min(100, (item.value / maxValue) * 100));
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[14px] font-black text-[#342a21]">{item.label}</span>
                    <span className="text-[15px] font-black tabular-nums text-[#8b683e]">{item.value.toFixed(1)}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e4d9c8]">
                    <div className="h-full rounded-full bg-[#927044]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="border-l-4 border-[#87663d] bg-[#f0e7d8] px-4 py-4">
              <div className="text-[10px] font-black tracking-[0.12em] text-[#87663d]">가장 강한 기운</div>
              <div className="mt-1 text-[19px] font-black text-[#2c231b]">{strongest.label}</div>
              <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#665748]">
                {strongestMeaning?.summary || "이 기운이 강점으로 작동하는 방식을 풀이한다."}
              {strongestMeaning?.money ? ` 돈에서는 ${strongestMeaning.money.replace(/^돈에서는\s*/, "")}` : ""}
              {strongestMeaning?.work ? ` 일에서는 ${strongestMeaning.work.replace(/^일에서는\s*/, "")}` : ""}
              {strongestMeaning?.relationship ? ` 사람 관계에서는 ${strongestMeaning.relationship.replace(/^사람 관계에서는\s*/, "")}` : ""}
              </p>
            </div>
            <div className="border-l-4 border-[#9a5e4e] bg-[#f0e7d8] px-4 py-4">
              <div className="text-[10px] font-black tracking-[0.12em] text-[#9a5e4e]">보완이 필요한 기운</div>
              <div className="mt-1 text-[19px] font-black text-[#2c231b]">{weakest.label}</div>
              <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#665748]">
                {weakestMeaning?.summary || "이 기운에서 보완해야 할 행동을 풀이한다."}
              {weakestMeaning?.money ? ` 돈에서는 ${weakestMeaning.money.replace(/^돈에서는\s*/, "")}` : ""}
              {weakestMeaning?.work ? ` 일에서는 ${weakestMeaning.work.replace(/^일에서는\s*/, "")}` : ""}
              {weakestMeaning?.relationship ? ` 사람 관계에서는 ${weakestMeaning.relationship.replace(/^사람 관계에서는\s*/, "")}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#d7c7ab] bg-[#24201c] px-6 py-5 text-[#f7efdf] sm:px-8">
        <div className="text-[10px] font-black tracking-[0.16em] text-[#cba96f]">이 기본 사주가 이 운에서는 어떻게 나타날까?</div>
        <p className="mt-2 break-keep text-[15px] font-black leading-7">
          {bridgeMap[categoryId || ""] || "이제 이 기본 사주가 선택한 운에서 어떻게 나타나는지 구체적으로 이어서 본다."}
        </p>
      </div>
    </section>
  );
}

function CategoryPreviewWebtoon({
  profile,
  user,
  scoreVisual,
  freeComicScenes = [],
}: {
  profile: CategoryPreviewProfile;
  user: UserInfo;
  scoreVisual: RelationshipScoreVisual;
  freeComicScenes?: CareerFreeComicScene[];
}) {
  let categoryContent: ReactNode;

  if (profile?.kind === "year") {
    categoryContent = <YearFreeResultV206 profile={profile} scoreVisual={scoreVisual} />;
  } else if (profile?.kind === "lifeFlow") {
    categoryContent = <LifeFlowFreeResultV206 profile={profile} user={user} />;
  } else if (profile?.kind === "lifetime") {
    categoryContent = <LifetimeFreeResultV206 profile={profile} />;
  } else if (profile.kind === "career") {
    categoryContent = <CareerFreeResultV208 profile={profile} />;
  } else if (profile.kind === "health" && profile.healthStory) {
    categoryContent = <HealthLongformStory profile={profile} user={user} />;
  } else if (profile.kind === "health") {
    categoryContent = (
      <PersonalizedRouteWebtoon
        profile={profile}
        user={user}
        scoreVisual={scoreVisual}
        freeComicScenes={freeComicScenes}
      />
    );
  } else if (profile.kind === "today") {
    categoryContent = (
      <TodayFreeResult
        profile={profile}
        user={user}
        freeComicScenes={freeComicScenes}
      />
    );
  } else if (profile.kind === "love") {
    categoryContent = (
      <LoveMarriageFreeResult
        profile={profile}
        user={user}
        scoreVisual={scoreVisual}
        freeComicScenes={freeComicScenes}
      />
    );
  } else {
    categoryContent = (
      <HealthStyleCategoryLongform
        profile={profile}
        user={user}
        categoryId={profile.kind === "worry" ? "premium" : profile.kind as CategoryId}
        categoryTitle={
          profile.kind === "career"
            ? "일·사업운"
            : profile.kind === "compatibility"
              ? "궁합운"
              : profile.kind === "worry"
                ? "내 고민 상담"
                : ""
        }
        freeComicScenes={freeComicScenes}
      />
    );
  }

  return (
    <>
      <SajuBasicProfileCardV214
        user={user}
        profile={profile?.sajuFoundation || profile}
        categoryId={profile.kind === "worry" ? "premium" : profile.kind as CategoryId}
      />
      {categoryContent}
    </>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-black text-white">
      {children}
    </label>
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
  const [comicPreviewChapters, setComicPreviewChapters] = useState<
    ComicChapter[]
  >([]);
  const [comicFullChapters, setComicFullChapters] = useState<ComicChapter[]>(
    [],
  );
  const [scoreVisual, setScoreVisual] = useState<RelationshipScoreVisual>(null);
  const [wealthProfile, setWealthProfile] = useState<WealthProfile | null>(null);
  const [categoryPreviewProfile, setCategoryPreviewProfile] = useState<CategoryPreviewProfile | null>(null);
  const [freeComicScenes, setFreeComicScenes] = useState<CareerFreeComicScene[]>([]);
  const [consultQuestion, setConsultQuestion] = useState("");
  const [consultAiResult, setConsultAiResult] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [user, setUser] = useState<UserInfo>(emptyUser);
  const [worryFollowupLoading, setWorryFollowupLoading] = useState(false);
  const [worryFollowupData, setWorryFollowupData] = useState<any | null>(null);
  const [worryFollowupAnswers, setWorryFollowupAnswers] = useState<Record<string, string>>({});

  const category = useMemo(() => getCategory(categoryId), [categoryId]);
  const selectedPlanInfo =
    consultPlans.find((plan) => plan.id === selectedPlan) || consultPlans[1];

  const showPartnerFields = categoryId === "compatibility";

  const showQuestion = categoryId === "premium";

  const reviewsPerPage = 3;
  const reviewPages = Math.ceil(reviews.length / reviewsPerPage);
  const visibleReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage,
  );

  const birthMeta = `${user.year || "----"}년 ${user.month || "--"}월 ${
    user.day || "--"
  }일 · ${user.calendar}${user.calendar === "음력" && user.lunarLeapMonth ? " 윤달" : ""} · ${user.gender}`;

  const paidHook = getPaidHook(categoryId);

  const baseFileName = useMemo(() => {
    return makeSafeFileName(
      `${nameOf(user)}_${category.title}_소름사주_리포트`,
    );
  }, [user.name, category.title]);

  useEffect(() => {
    console.log("SOREUM_PAGE_VERSION", "page-v207-stable-all-categories");
  }, []);

  useEffect(() => {
    const host = window.location.hostname;

    setIsLocalTest(
      host === "localhost" ||
        host === "127.0.0.1" ||
        host.startsWith("192.168."),
    );
  }, []);

  useEffect(() => {
    const scriptId = "portone-v2-browser-sdk";

    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdn.portone.io/v2/browser-sdk.js";
    script.async = false;
    script.onload = () => {
      console.log(
        "PORTONE SDK LOADED",
        Boolean(window.PortOne?.requestPayment),
      );
    };
    script.onerror = () => {
      console.error("PORTONE SDK LOAD FAILED");
    };

    document.head.appendChild(script);
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
        comicPreviewChapters?: ComicChapter[];
        comicFullChapters?: ComicChapter[];
        scoreVisual?: RelationshipScoreVisual;
        wealthProfile?: WealthProfile | null;
        categoryPreviewProfile?: CategoryPreviewProfile | null;
        freeComicScenes?: CareerFreeComicScene[];
      };

      if (parsed.categoryId) setCategoryId(parsed.categoryId);
      if (parsed.user) setUser(normalizeUserInfo(parsed.user));
      if (parsed.preview) setAiPreview(parsed.preview);
      if (parsed.full) setAiFull(parsed.full);
      setComicPreviewChapters(
        normalizeComicChapters(parsed.comicPreviewChapters),
      );
      setComicFullChapters(normalizeComicChapters(parsed.comicFullChapters));
      setScoreVisual(parsed.scoreVisual || null);
      setWealthProfile(parsed.wealthProfile || null);
      setCategoryPreviewProfile(parsed.categoryPreviewProfile || null);
      setFreeComicScenes(Array.isArray(parsed.freeComicScenes) ? parsed.freeComicScenes : []);
      setPaid(Boolean(parsed.paid && parsed.full));
      setStep("result");
    } catch (error) {
      console.error("saved result restore error:", error);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("paymentId");
    const code = params.get("code");
    const message = params.get("message");

    if (code) {
      alert(message || "결제가 취소되었거나 실패했습니다.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!paymentId) return;

    handlePortOnePaymentComplete(paymentId);
    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goInput = (id: CategoryId) => {
    setCategoryId(id);
    setPaid(false);
    setAiPreview("");
    setAiFull("");
    setComicPreviewChapters([]);
    setComicFullChapters([]);
    setScoreVisual(null);
    setWealthProfile(null);
    setCategoryPreviewProfile(null);
    setConsultAiResult("");
    setWorryFollowupData(null);
    setWorryFollowupAnswers({});
    setMenuOpen(false);
    setStep("input");
  };

  const buildWorryFollowupSummary = (
    answers: Record<string, string>,
    data: any | null,
  ) => {
    const questions = Array.isArray(data?.questions) ? data.questions : [];
    return questions
      .map((question: any) => {
        const answer = normalizeWorryLine(answers[question.id]);
        if (!answer) return "";
        return `- ${question.label}: ${answer}`;
      })
      .filter(Boolean)
      .join("\n");
  };

  const applyWorryFollowupAnswer = (
    questionId: string,
    answer: string,
    data: any | null = worryFollowupData,
  ) => {
    const nextAnswers = {
      ...worryFollowupAnswers,
      [questionId]: answer,
    };
    const summary = buildWorryFollowupSummary(nextAnswers, data);
    setWorryFollowupAnswers(nextAnswers);
    setUser({
      ...user,
      worryType: data?.worryType || user.worryType || "선택·결정",
      worrySituation: summary,
      worryReason: "AI가 던진 추가 질문 답변 기준",
      desiredVerdict:
        questionId.includes("want") || questionId.includes("verdict")
          ? answer
          : user.desiredVerdict || "질문에 맞게 가라/가지 마라/기다려라/조건부 중 하나로 딱 찍어줘",
    });
  };

  const requestWorryFollowupQuestions = async () => {
    const question = normalizeWorryLine(user.question);
    if (question.length < 6) {
      alert("먼저 고민을 한 줄로 적어줘.");
      return;
    }

    setWorryFollowupLoading(true);
    setWorryFollowupData(null);
    setWorryFollowupAnswers({});

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "worry_followup",
          user,
          categoryId: "premium",
          categoryTitle: "내 고민 상담",
          question,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.followupQuestions) {
        throw new Error(data?.error || "추가 질문 생성 실패");
      }

      const nextData = {
        worryType: data.worryType || "선택·결정",
        questions: data.followupQuestions || [],
        aiUsed: data.aiUsed,
      };
      setWorryFollowupData(nextData);
      setUser({
        ...user,
        worryType: nextData.worryType,
        worrySituation: "",
        worryReason: "AI가 던진 추가 질문 답변 대기 중",
        desiredVerdict: "질문에 맞게 가라/가지 마라/기다려라/조건부 중 하나로 딱 찍어줘",
        currentRegion: "",
        candidateRegions: "",
        currentWork: "",
        moneySituation: "",
        relationshipInfo: "",
        healthConcern: "",
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "추가 질문 생성 중 오류가 났습니다.";
      alert(message);
    } finally {
      setWorryFollowupLoading(false);
    }
  };

  const savePendingPayment = (
    orderId: string,
    orderName: string,
    amount: number,
  ) => {
    window.localStorage.setItem(
      "fortune-pending-payment",
      JSON.stringify({
        categoryId,
        user,
        preview: aiPreview,
        comicPreviewChapters,
        scoreVisual,
        wealthProfile,
        categoryPreviewProfile,
        orderId,
        orderName,
        amount,
      }),
    );
  };

  const handlePortOnePaymentComplete = async (paymentId: string) => {
    const saved = window.localStorage.getItem("fortune-pending-payment");

    if (!saved) {
      alert(
        "결제는 완료됐지만 저장된 운세 정보가 없습니다. 다시 무료 결과를 생성한 뒤 전체 리포트를 열어주세요.",
      );
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        categoryId: CategoryId;
        user: UserInfo;
        preview: string;
        comicPreviewChapters?: ComicChapter[];
        scoreVisual?: RelationshipScoreVisual;
        wealthProfile?: WealthProfile | null;
        orderId?: string;
        paymentId?: string;
        orderName: string;
        amount: number;
      };

      const verifyResponse = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          orderId: parsed.orderId || parsed.paymentId || paymentId,
          orderName: parsed.orderName,
          amount: parsed.amount,
          categoryId: parsed.categoryId,
        }),
      });

      const verifyData = await verifyResponse.json().catch(() => null);

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData?.message ||
            verifyData?.error ||
            "포트원 결제 검증에 실패했습니다.",
        );
      }

      setCategoryId(parsed.categoryId);
      const restoredUser = normalizeUserInfo(parsed.user);
      setUser(restoredUser);
      setAiPreview(parsed.preview || "");
      setComicPreviewChapters(
        normalizeComicChapters(parsed.comicPreviewChapters),
      );
      setComicFullChapters([]);
      setScoreVisual(parsed.scoreVisual || null);
      setWealthProfile(parsed.wealthProfile || null);
      setCategoryPreviewProfile(parsed.categoryPreviewProfile || null);
      setFreeComicScenes(Array.isArray(parsed.freeComicScenes) ? parsed.freeComicScenes : []);
      setPaid(true);
      setStep("result");

      window.localStorage.removeItem("fortune-pending-payment");

      setTimeout(() => {
        generateFullResult(parsed.categoryId, restoredUser);
      }, 200);
    } catch (error) {
      console.error("portone payment complete error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "결제 검증 중 문제가 발생했습니다.";

      alert(errorMessage);
    }
  };

  const requestPortOnePayment = async (orderName: string, amount: number) => {
    if (!privacyAgreed) {
      alert("개인정보 수집·이용에 동의해야 결제를 진행할 수 있습니다.");
      return;
    }

    if (categoryId === "premium" && !isWorryIntakeReady(user)) {
      alert(
        `내 고민 상담은 결제 전에 상담 접수 정보를 먼저 채워야 합니다.

부족한 항목:
- ${getWorryIntakeMissingLabels(user).join("\n- ")}`,
      );
      setPaid(false);
      setStep("result");
      setTimeout(() => generateAIResult(), 100);
      return;
    }

    const configResponse = await fetch("/api/payment/config", {
      method: "GET",
      cache: "no-store",
    });

    const config = await configResponse.json().catch(() => null);

    const storeId = config?.storeId;
    const channelKey = config?.channelKey;

    if (!storeId || !channelKey) {
      alert(
        `포트원 연동값이 없습니다.
storeId: ${storeId ? "있음" : "없음"}
channelKey: ${channelKey ? "있음" : "없음"}`,
      );
      return;
    }

    if (!window.PortOne?.requestPayment) {
      alert(
        "포트원 결제창 스크립트를 불러오는 중입니다. 잠시 후 다시 눌러주세요.",
      );
      return;
    }

    try {
      const paymentId = makePortOnePaymentId();

      savePendingPayment(paymentId, orderName, amount);

      const response = await window.PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName,
        totalAmount: amount,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          fullName: nameOf(user),
          phoneNumber: "01000000000",
        },
        redirectUrl: `${window.location.origin}${window.location.pathname}`,
        forceRedirect: false,
        bypass: {
          kcp_v2: {
            site_name: "소름사주",
          },
        },
      });

      // 모바일에서는 redirectUrl로 돌아올 수 있어서 response가 없을 수 있습니다.
      if (!response) return;

      if (response.code !== undefined) {
        alert(response.message || "결제가 취소되었거나 실패했습니다.");
        return;
      }

      await handlePortOnePaymentComplete(
        String(response.paymentId || paymentId),
      );
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "포트원 결제창을 여는 중 문제가 발생했거나 결제가 취소되었습니다.";
      alert(message);
    }
  };

  const generateAIResult = async () => {
    setAiLoading(true);
    setAiPreview("");
    setAiFull("");
    setComicPreviewChapters([]);
    setComicFullChapters([]);
    setScoreVisual(null);
    setWealthProfile(null);
    setCategoryPreviewProfile(null);

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "preview",
          user: categoryId === "premium" ? getPremiumApiUser(user) : user,
          categoryId,
          categoryTitle: category.title,
          ...(categoryId === "premium"
            ? getPremiumApiBodyFields(user)
            : { question: user.question }),
          compatibilityType: user.compatibilityType,
        }),
      });

      const rawText = await response.text();
      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `서버가 JSON이 아닌 응답을 보냈습니다.\n${rawText.slice(0, 1000)}`,
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "무료 결과 생성 실패");
      }

      setAiPreview(
        data.intakePreview ||
          data.preview ||
          data.result ||
          "[API 응답 없음] 무료 운세 결과를 불러오지 못했습니다.",
      );
      setComicPreviewChapters(
        normalizeComicChapters(
          data.comicChapters ||
            data.previewComicChapters ||
            data.comicPreviewChapters,
        ),
      );
      setScoreVisual(data.scoreVisual || null);
      setWealthProfile(data.wealthProfile || null);
      setCategoryPreviewProfile(data.categoryPreviewProfile || null);
      setFreeComicScenes(
        Array.isArray(data.freeComicScenes)
          ? data.freeComicScenes
          : Array.isArray(data.categoryPreviewProfile?.webtoonScenes)
            ? data.categoryPreviewProfile.webtoonScenes
            : [],
      );
      setAiFull("");
      setComicFullChapters([]);
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";
      setAiPreview(`[무료 리포트 오류]\n\n${message}`);
      setAiFull("");
      setComicPreviewChapters([]);
      setComicFullChapters([]);
      setWealthProfile(null);
    } finally {
      setAiLoading(false);
    }
  };

  const generateFullResult = async (
    targetCategoryId: CategoryId = categoryId,
    targetUser: UserInfo = user,
  ) => {
    const targetCategory = getCategory(targetCategoryId);

    setPaid(true);
    setFullLoading(true);
    setAiFull("전체 리포트 요청을 보내는 중입니다...");
    setComicFullChapters([]);

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "full",
          user: targetCategoryId === "premium" ? getPremiumApiUser(targetUser) : targetUser,
          categoryId: targetCategoryId,
          categoryTitle: targetCategory.title,
          ...(targetCategoryId === "premium"
            ? getPremiumApiBodyFields(targetUser)
            : { question: targetUser.question }),
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
            1200,
          )}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `전체 리포트 생성 실패. 상태코드: ${response.status}`,
        );
      }

      if (
        data?.requiresWorryIntake ||
        data?.blockPaidWorryReport ||
        data?.errorCode === "WORRY_INTAKE_REQUIRED" ||
        data?.intakePreview
      ) {
        setPaid(false);
        setAiPreview(
          data?.intakePreview ||
            data?.preview ||
            "내 고민 상담은 유료 결제 전에 상담 접수 정보가 필요합니다.",
        );
        setAiFull("");
        setComicPreviewChapters(
          normalizeComicChapters(
            data?.comicChapters ||
              data?.previewComicChapters ||
              data?.comicPreviewChapters,
          ),
        );
        setComicFullChapters([]);
        return;
      }

      const fullText = data?.full || data?.result || data?.preview || "";

      if (!fullText) {
        throw new Error(
          `API는 응답했지만 full/result 값이 비어 있습니다.\n\n응답내용:\n${JSON.stringify(
            data,
            null,
            2,
          ).slice(0, 1500)}`,
        );
      }

      setAiFull(fullText);
      setComicFullChapters(
        normalizeComicChapters(
          data?.comicChapters ||
            data?.fullComicChapters ||
            data?.comicFullChapters,
        ),
      );
      setScoreVisual(data?.scoreVisual || scoreVisual || null);
      setWealthProfile(data?.wealthProfile || wealthProfile || null);

      // 건강운 유료에서는 무료(preview)에서 만들어 둔 고정 healthPaidReport를
      // 절대 재사용하지 않는다. full 응답의 profile만 신뢰한다.
      if (targetCategoryId === "health") {
        setCategoryPreviewProfile(data?.categoryPreviewProfile || null);
      } else {
        setCategoryPreviewProfile(
          data?.categoryPreviewProfile || categoryPreviewProfile || null,
        );
      }

      setFreeComicScenes(
        Array.isArray(data?.freeComicScenes)
          ? data.freeComicScenes
          : freeComicScenes,
      );

      // V189 CATEGORY UI PIPELINE:
  // Health renderer/parser stays frozen. Other paid categories should render only
  // from the latest full response, while their existing category-specific UI remains intact.
  console.log("HEALTH_FULL_PROFILE_SYNC", {
        categoryId: targetCategoryId,
        fullTextLength: fullText.length,
        hasServerProfile: Boolean(data?.categoryPreviewProfile),
        hasServerHealthPaidReport: Boolean(
          data?.categoryPreviewProfile?.kind === "health" &&
            data?.categoryPreviewProfile?.healthPaidReport,
        ),
        healthPaidReportSource:
          data?.healthPaidReportSource ||
          data?.categoryPreviewProfile?.healthPaidReportSource ||
          null,
      });

      setPaid(true);
    } catch (error) {
      console.error("FULL REPORT ERROR:", error);

      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";

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

    if (categoryId === "premium" && !isWorryIntakeReady(user)) {
      alert(
        `내 고민 상담은 유료 리포트 전에 상담 접수 정보를 먼저 채워야 합니다.

부족한 항목:
- ${getWorryIntakeMissingLabels(user).join("\n- ")}`,
      );
      setPaid(false);
      setStep("result");
      setTimeout(() => generateAIResult(), 100);
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
          worryType: user.worryType,
          situation: user.worrySituation,
          currentRegion: user.currentRegion,
          candidateRegions: user.candidateRegions,
          reason: user.worryReason,
          currentWork: user.currentWork,
          moneySituation: user.moneySituation,
          relationshipInfo: user.relationshipInfo,
          healthConcern: user.healthConcern,
          desiredVerdict: user.desiredVerdict,
          compatibilityType: user.compatibilityType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI 생성 실패");
      }

      setConsultAiResult(
        data.full || data.result || "결과를 불러오지 못했습니다.",
      );
    } catch (error) {
      console.error(error);
      setConsultAiResult(
        "AI 상담 결과를 불러오지 못했습니다. API 키와 서버 상태를 확인해주세요.",
      );
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
        comicPreviewChapters,
        comicFullChapters,
        scoreVisual,
        wealthProfile,
        categoryPreviewProfile,
        paid,
      }),
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
    if (!paid) return null;
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
          운세 분석과 상담 리포트 생성을 위해 이름/별명, 생년월일, 성별,
          출생시간, 상담 질문을 수집·이용합니다.
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
          filter: brightness(1.18) contrast(1.12) saturate(1.12)
            drop-shadow(0 0 26px rgba(255, 213, 145, 0.12)) !important;
          transform: scale(1.065);
        }

        .home-hero-image img {
          object-position: center top !important;
          filter: brightness(1.2) contrast(1.1) saturate(1.1)
            drop-shadow(0 0 24px rgba(255, 213, 145, 0.13)) !important;
          transform: scale(1.018);
        }

        .intro-hero-v3,
        .intro-hero-v3 p {
          font-family: "Noto Serif KR", "Gowun Batang", "Nanum Myeongjo", serif;
        }

        .intro-mini-badge {
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.34);
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

        @keyframes scoreOrbFloat {
          0%, 100% { transform: rotateX(8deg) rotateY(-8deg) translateY(0); }
          50% { transform: rotateX(-3deg) rotateY(10deg) translateY(-8px); }
        }
        @keyframes scoreOrbSpin {
          from { transform: rotateX(68deg) rotateZ(0deg); }
          to { transform: rotateX(68deg) rotateZ(360deg); }
        }
        @keyframes scoreOrbSpinReverse {
          from { transform: rotateY(70deg) rotateZ(360deg); }
          to { transform: rotateY(70deg) rotateZ(0deg); }
        }
        .score-orb-3d {
          animation: scoreOrbFloat 6s ease-in-out infinite;
        }
        .score-orb-ring {
          animation: scoreOrbSpin 12s linear infinite;
          box-shadow: 0 0 24px rgba(216,168,111,0.34);
        }
        .score-orb-ring-reverse {
          animation: scoreOrbSpinReverse 9s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .score-orb-3d,
          .score-orb-ring,
          .score-orb-ring-reverse {
            animation: none !important;
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
            filter: brightness(1.15) contrast(1.12) saturate(1.12)
              drop-shadow(0 0 22px rgba(255, 213, 145, 0.12)) !important;
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
            background: linear-gradient(
              180deg,
              rgba(5, 5, 5, 0.98) 0%,
              rgba(9, 7, 5, 0.98) 100%
            ) !important;
          }

          .home-hero > div:nth-child(2) > div:last-child {
            min-height: 360px !important;
            height: 360px !important;
            border-bottom: 1px solid rgba(216, 168, 111, 0.55) !important;
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
            filter: brightness(1.18) contrast(1.1) saturate(1.1)
              drop-shadow(0 0 22px rgba(255, 213, 145, 0.13)) !important;
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
                    <span className="text-[#e0b36d]">
                      전체에서 복의 자리까지 연다
                    </span>
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
                      [
                        "🎯",
                        "무료 판정 먼저",
                        "돈·일·사람·몸에서 먼저 막힌 자리",
                      ],
                      ["🔒", "완전 비밀 보장", "입력 정보는 저장하지 않아요"],
                      [
                        "👑",
                        "유료 전체 리포트",
                        "시기·복·악운·도훈의 판정까지",
                      ],
                    ].map(([icon, title, desc]) => (
                      <div
                        key={title}
                        className="rounded-[22px] border border-[#7a5b37] bg-black/35 p-4"
                      >
                        <div className="text-2xl">{icon}</div>
                        <div className="mt-2 font-black text-white">
                          {title}
                        </div>
                        <div className="mt-1 break-keep text-xs leading-5 text-[#c8beb0]">
                          {desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => goInput("today")}
                    className="mt-8 w-full max-w-xl rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f5c66d] to-[#b78343] px-8 py-5 text-xl font-black text-black shadow-[0_20px_65px_rgba(216,168,111,0.22)]"
                  >
                    무료 사주 먼저 보기 〉
                  </button>

                  <div className="mt-3 max-w-xl text-center text-sm font-black text-[#d8a86f]">
                    결제 전 무료 판정 먼저 확인 가능
                  </div>
                </div>

                <div className="home-hero-image relative min-h-[460px] overflow-hidden bg-black lg:min-h-[560px]">
                  <SafeImage
                    src="/characters/dohoon-hero.png"
                    alt="운세형 도훈 메인 이미지"
                    fallback="🧑‍💼"
                  />
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
                  네 사주 안에
                  <br className="md:hidden" /> 네 운을 막는 무언가가 숨어 있다
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
                    <br />딱 까서 알려줄게.
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
                  [
                    "🎯",
                    "막힌 자리부터 판정",
                    "좋은 말보다 지금 먼저 봐야 할 지점",
                  ],
                  [
                    "💰",
                    "돈이 새는 구멍 확인",
                    "돈복이 있어도 왜 안 모이는지 분석",
                  ],
                  [
                    "👥",
                    "인연이 꼬이는 이유",
                    "끌리는 사람과 피해야 할 사람 구분",
                  ],
                  [
                    "👑",
                    "전체 리포트",
                    "복·악운·대운까지 길게 풀어주는 유료 풀이",
                  ],
                ].map(([icon, title, desc]) => (
                  <div
                    key={title}
                    className="rounded-[28px] border border-[#7a5b37] bg-[#10100f] p-5 text-center shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                  >
                    <div className="text-4xl">{icon}</div>
                    <div className="mt-3 text-lg font-black text-[#e0b36d]">
                      {title}
                    </div>
                    <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">
                      {desc}
                    </p>
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
                    <div className="mt-4 text-lg font-black text-[#e0b36d]">
                      {item.title}
                    </div>
                    <p className="mt-2 break-keep text-xs leading-5 text-[#c8beb0]">
                      {item.hook || item.subtitle}
                    </p>
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
                    onChange={(event) =>
                      setUser({ ...user, name: event.target.value })
                    }
                    placeholder="이름"
                    className="w-full p-4"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={user.year}
                      onChange={(event) =>
                        setUser({ ...user, year: event.target.value })
                      }
                      placeholder="년도"
                      className="p-4 text-center"
                    />
                    <input
                      value={user.month}
                      onChange={(event) =>
                        setUser({ ...user, month: event.target.value })
                      }
                      placeholder="월"
                      className="p-4 text-center"
                    />
                    <input
                      value={user.day}
                      onChange={(event) =>
                        setUser({ ...user, day: event.target.value })
                      }
                      placeholder="일"
                      className="p-4 text-center"
                    />
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
                            lunarLeapMonth:
                              value === "음력" ? user.lunarLeapMonth : false,
                          })
                        }
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.calendar === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white",
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
                        setUser({
                          ...user,
                          lunarLeapMonth: !user.lunarLeapMonth,
                        })
                      }
                      className={cx(
                        "rounded-2xl border p-4 text-left text-sm font-black",
                        user.lunarLeapMonth
                          ? "border-[#d8a86f] bg-[#241e18] text-[#e0b36d]"
                          : "border-[#7a5b37] bg-[#14110d] text-white",
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
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUser({ ...user, gender: value })}
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.gender === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => goInput("today")}
                    className="w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f5c66d] to-[#b78343] px-6 py-5 text-lg font-black text-black"
                  >
                    무료 사주 먼저 보기 〉
                  </button>
                </div>
              </div>

              <div className="rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_80%_20%,rgba(216,168,111,0.16),transparent_36%),#11100f] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                <h2 className="text-3xl font-black tracking-[-0.06em] text-white">
                  무료에서 멈추면
                  <br />
                  <span className="text-[#e0b36d]">
                    복이 붙는 자리와 악운이 붙는 자리를 놓칩니다
                  </span>
                </h2>
                <p className="mt-5 break-keep text-base leading-8 text-[#d8d0c6]">
                  무료는 문만 열어줍니다. 전체 리포트에서는 돈이 언제 붙는지,
                  어떤 일에서 네 몫이 남는지, 어떤 사람은 피해야 하는지, 몸이
                  먼저 보내는 신호와 올해 조심할 달까지 이어서 봅니다.
                </p>
                <p className="mt-4 break-keep text-base font-black leading-8 text-white">
                  돈·일·사람·몸은 따로 노는 게 아닙니다.
                  <br />한 군데가 막히면 다른 운도 같이 늦어집니다.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-5">
                  {[
                    "복이 붙는 자리",
                    "돈이 새는 구멍",
                    "피해야 할 인연",
                    "몸이 보내는 신호",
                    "올해 조심할 악운",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#7a5b37] bg-black/35 p-4 text-center text-sm font-black text-[#e0b36d]"
                    >
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
                  <CharacterCard
                    key={card.id}
                    card={card}
                    onSelect={() => goInput(card.categoryId)}
                  />
                ))}
              </div>
            </section>

            <section className="price-section">
              <h2 className="mb-6 text-center text-3xl font-black tracking-[-0.06em] text-white">
                전체 리포트 요금 안내
              </h2>
              <div className="price-scroll grid gap-5 lg:grid-cols-3">
                {[
                  {
                    title: "오늘운세 전체 리포트",
                    desc: "오늘운세·재물운·연애운·결혼운·악운",
                    price: 1900,
                    points: [
                      "오늘 하루 흐름",
                      "오늘 돈이 새는 자리",
                      "오늘 조심할 악운",
                    ],
                    id: "today" as CategoryId,
                  },
                  {
                    title: "일반 사주 전체 리포트",
                    desc: "재물운·일·사업운·연애운·결혼운 등",
                    price: 6900,
                    points: [
                      "복이 붙는 자리",
                      "악운이 붙는 자리",
                      "피해야 할 선택",
                    ],
                    id: "money" as CategoryId,
                  },
                  {
                    title: "심화 사주 리포트",
                    desc: "평생종합사주 · 내 고민 사주풀이",
                    price: 14900,
                    points: [
                      "평생 반복되는 막힘",
                      "돈·일·관계·건강 전체",
                      "잡아야 할 대운과 악운",
                      "내 고민은 19,900원 심화",
                    ],
                    id: "traditional" as CategoryId,
                  },
                ].map((plan, index) => (
                  <button
                    key={plan.title}
                    type="button"
                    onClick={() => goInput(plan.id)}
                    className={cx(
                      "rounded-[30px] border p-6 text-left transition hover:-translate-y-1",
                      index === 2
                        ? "border-[#f3cf7a] bg-[linear-gradient(135deg,#20150a,#3a280e)] shadow-[0_20px_60px_rgba(216,168,111,0.15)]"
                        : "border-[#7a5b37] bg-[#10100f]",
                    )}
                  >
                    <div className="text-lg font-black text-[#e0b36d]">
                      {plan.title}
                    </div>
                    <div className="mt-1 text-sm text-[#c8beb0]">
                      {plan.desc}
                    </div>
                    <div className="mt-5 text-4xl font-black text-white">
                      {plan.price.toLocaleString()}
                      <span className="text-lg">원</span>
                    </div>
                    <div className="mt-5 space-y-2 text-sm font-semibold text-[#e8ded2]">
                      {plan.points.map((point) => (
                        <div key={point}>✓ {point}</div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="review-section">
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.06em] text-white">
                    소름사주 실제 후기
                  </h2>
                  <div className="mt-2 text-sm text-[#e0b36d]">
                    ★★★★★ 4.8 · 후기 42개
                  </div>
                </div>
                <div className="rounded-full border border-[#7a5b37] bg-black/35 px-3 py-2 text-xs font-black text-[#e0b36d]">
                  {reviewPage}/14
                </div>
              </div>
              <div className="review-scroll grid gap-4 md:grid-cols-3">
                {visibleReviews.map((review) => (
                  <div
                    key={`${review.name}-${review.category}-${review.text}`}
                    className="rounded-[28px] border border-[#7a5b37] bg-[#10100f] p-5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-sm font-black text-[#d8a86f]">
                        {review.name} · {review.category}
                      </div>
                      <div className="text-xs text-[#e0b36d]">★★★★★</div>
                    </div>
                    <p className="m-0 break-keep text-sm leading-7 text-white">
                      “{review.text}”
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {Array.from(
                  { length: reviewPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setReviewPage(page)}
                    className={cx(
                      "grid h-9 w-9 place-items-center rounded-full border text-sm font-black",
                      reviewPage === page
                        ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                        : "border-[#7a5b37] bg-black/35 text-[#c8beb0]",
                    )}
                  >
                    {page}
                  </button>
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
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">
                      돈복이 움직이는 달
                    </div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">
                      일·사업운이 강해지는 달
                    </div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">
                      사람관계가 흔들리는 달
                    </div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">
                      건강을 조심해야 할 달
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#c8beb0]">
                    올해 돈복이 움직이는 달, 일·사업운이 강해지는 달, 사람관계가
                    흔들리는 달, 건강을 조심해야 할 달을 사주 포인트로 봅니다.
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
                onChange={(event) =>
                  setCategoryId(event.target.value as CategoryId)
                }
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
                onChange={(event) =>
                  setUser({ ...user, name: event.target.value })
                }
                placeholder="예: 성국"
                className="mb-4 w-full p-4"
              />

              <FieldLabel>생년월일</FieldLabel>

              <div className="mb-3 rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4 text-sm leading-6 text-[#e0d6c8]">
                정확한 사주 계산을 위해 가능하면{" "}
                <span className="font-black text-[#d8a86f]">양력 생일</span>을
                입력해주세요.
                <br />
                음력 생일만 알고 있다면 음력으로 선택하면 자동으로 양력 기준으로
                변환해서 풀이합니다. 윤달 생일인 경우에만 윤달 체크를
                선택해주세요.
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <input
                  value={user.year}
                  onChange={(event) =>
                    setUser({ ...user, year: event.target.value })
                  }
                  placeholder="년도"
                  className="p-4 text-center"
                />
                <input
                  value={user.month}
                  onChange={(event) =>
                    setUser({ ...user, month: event.target.value })
                  }
                  placeholder="월"
                  className="p-4 text-center"
                />
                <input
                  value={user.day}
                  onChange={(event) =>
                    setUser({ ...user, day: event.target.value })
                  }
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
                        lunarLeapMonth:
                          value === "음력" ? user.lunarLeapMonth : false,
                      })
                    }
                    className={cx(
                      "rounded-2xl border p-4 font-black",
                      user.calendar === value
                        ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                        : "border-[#7a5b37] bg-[#14110d] text-white",
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
                      : "border-[#7a5b37] bg-[#14110d] text-white",
                  )}
                >
                  {user.lunarLeapMonth ? "✓ " : ""}윤달 생일입니다
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#c8beb0]">
                    부모님이 “윤달 생일”이라고 알려준 경우에만 선택하세요.
                    대부분은 평달이라 선택하지 않아도 됩니다.
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
                  <option
                    key={time}
                    value={time === "모름 / 선택 안 함" ? "" : time}
                  >
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
                        : "border-[#7a5b37] bg-[#14110d] text-white",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>


              {categoryId === "compatibility" && (
                <div className="mb-4 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4">
                  <div className="mb-3 font-black text-[#d8a86f]">
                    궁합 종류 선택
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["연인/배우자 궁합", "사업파트너 궁합"] as const).map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setUser({ ...user, compatibilityType: value })
                          }
                          className={cx(
                            "rounded-2xl border p-4 font-black",
                            user.compatibilityType === value
                              ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                              : "border-[#7a5b37] bg-[#14110d] text-white",
                          )}
                        >
                          {value}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="mt-3 break-keep text-xs leading-5 text-[#c8beb0]">
                    연인/배우자 궁합은 결혼까지 갈 수 있는 궁합인지 보고,
                    사업파트너 궁합은 같이 돈을 벌 수 있는 구조인지 봅니다.
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
                    <span className="font-black text-[#d8a86f]">양력 생일</span>
                    로 입력해주세요.
                    <br />
                    음력만 알고 있다면 음력으로 선택하면 자동으로 양력 기준으로
                    변환해서 궁합을 봅니다. 윤달 생일인 경우에만 윤달 체크를
                    선택해주세요.
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
                              value === "음력"
                                ? user.partnerLunarLeapMonth
                                : false,
                          })
                        }
                        className={cx(
                          "rounded-2xl border p-4 font-black",
                          user.partnerCalendar === value
                            ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                            : "border-[#7a5b37] bg-[#14110d] text-white",
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
                          : "border-[#7a5b37] bg-[#14110d] text-white",
                      )}
                    >
                      {user.partnerLunarLeapMonth ? "✓ " : ""}상대가 윤달
                      생일입니다
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
                            : "border-[#7a5b37] bg-[#14110d] text-white",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showQuestion && (
                <div className="mb-4 space-y-4 rounded-[30px] border border-[#7a5b37] bg-[#14110d] p-4">
                  <div>
                    <div className="text-sm font-black text-[#d8a86f]">
                      내 고민 상담
                    </div>
                    <p className="mt-2 break-keep text-xs leading-5 text-[#c8beb0]">
                      고민은 한 줄로 시작하세요. 도훈이 상황에 맞는 추가 질문을 5~7개 던집니다. 길게 쓰는 접수지가 아니라 버튼으로 필요한 재료를 모으고, 최소 4개 이상 답해야 15,000자급 유료 풀이로 넘어갑니다.
                    </p>
                  </div>

                  <div>
                    <FieldLabel>한 줄 고민</FieldLabel>
                    <textarea
                      value={user.question}
                      onChange={(event) => {
                        setUser({
                          ...user,
                          question: event.target.value,
                          worryType: "",
                          worrySituation: "",
                          worryReason: "",
                          desiredVerdict: "",
                        });
                        setWorryFollowupData(null);
                        setWorryFollowupAnswers({});
                      }}
                      placeholder="예: 친구가 죽었는데 상가집을 가야 하나 말아야 하나"
                      className="min-h-24 w-full p-4"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={requestWorryFollowupQuestions}
                    disabled={worryFollowupLoading || normalizeWorryLine(user.question).length < 6}
                    className="w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 text-sm font-black text-black disabled:opacity-60"
                  >
                    {worryFollowupLoading ? "도훈이 물어볼 걸 고르는 중..." : "도훈이 핵심 질문 5~7개 던지기"}
                  </button>

                  {worryFollowupData ? (
                    <div className="space-y-4 rounded-[26px] border border-[#7a5b37] bg-black/30 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#d8a86f] bg-[#241e18] px-3 py-1 text-xs font-black text-[#e0b36d]">
                          AI가 잡은 고민: {worryFollowupData.worryType}
                        </span>
                        <span className="text-xs font-bold text-[#c8beb0]">
                          최소 4개 이상 답하면 유료 상담으로 넘길 수 있어요. 답이 많을수록 풀이가 길고 구체적으로 나옵니다.
                        </span>
                      </div>

                      {(worryFollowupData.questions || []).map((question: any, questionIndex: number) => (
                        <div key={question.id || questionIndex} className="rounded-[22px] border border-[#7a5b37] bg-[#11100f] p-4">
                          <div className="mb-3 text-sm font-black text-white">
                            {questionIndex + 1}. {question.label}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(question.options || []).map((option: string) => (
                              <button
                                key={`${question.id}-${option}`}
                                type="button"
                                onClick={() => applyWorryFollowupAnswer(question.id, option)}
                                className={cx(
                                  "rounded-2xl border px-3 py-3 text-sm font-black",
                                  worryFollowupAnswers[question.id] === option
                                    ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                                    : "border-[#7a5b37] bg-black/35 text-white",
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          {question.allowCustom !== false ? (
                            <input
                              value={worryFollowupAnswers[question.id] || ""}
                              onChange={(event) => applyWorryFollowupAnswer(question.id, event.target.value)}
                              placeholder="직접 적어도 됩니다"
                              className="mt-3 w-full p-3 text-sm"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {getWorryIntakeMissingLabels(user).length > 0 ? (
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/35 p-4 text-xs leading-6 text-[#f5efe6]">
                      <div className="mb-2 font-black text-[#e0b36d]">
                        아직 한 줄 고민이 필요해요
                      </div>
                      {getWorryIntakeMissingLabels(user).map((item) => (
                        <div key={item}>- {item}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#d8a86f] bg-[#241e18] p-4 text-sm font-black text-[#e0b36d]">
                      접수 완료. 결제 후에는 한 줄 고민과 AI 추가 질문 답변을 기준으로 15,000자급 심화 풀이를 생성합니다.
                    </div>
                  )}
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
                  setComicPreviewChapters([]);
                  setComicFullChapters([]);
                  setWealthProfile(null);
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

        {step === "result" && aiLoading && (
          <div className="mx-auto flex min-h-[72vh] max-w-[760px] flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-7 h-28 w-28">
              <div className="absolute inset-0 animate-ping rounded-full border border-[#c9984b]/25" />
              <div className="absolute inset-3 animate-pulse rounded-full border border-[#c9984b]/50" />
              <div className="absolute inset-7 rounded-full bg-[#17181d] shadow-xl" />
            </div>
            <div className="text-[11px] font-black tracking-[0.3em] text-[#a06b24]">SAJU ANALYSIS</div>
            <h2 className="mt-3 text-2xl font-black text-white">분석하고 있습니다</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-[#c8beb0]">
              입력한 생년월일과 사주 원국을 기준으로 {category.title}의 핵심 판정과 시기를 맞추고 있습니다.
            </p>
          </div>
        )}

        {step === "result" && !aiLoading && (
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

              {!aiLoading && categoryId === "money" && wealthProfile ? (
                <MoneyPreviewTheater profile={wealthProfile} user={user} />
              ) : !aiLoading && categoryPreviewProfile ? (
                <CategoryPreviewWebtoon
                  profile={categoryPreviewProfile}
                  user={user}
                  scoreVisual={scoreVisual}
                  freeComicScenes={freeComicScenes}
                />
              ) : null}

              {aiLoading ? (
                <div className="mt-5 rounded-3xl border border-[#7a5b37] bg-[#1b1612] p-5">
                  <div className="text-lg font-black text-[#d8a86f]">
                    도훈이 네 사주를 펼쳐보고 있습니다
                  </div>
                  <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                    무료에서는 지금 네 운에서 먼저 봐야 할 막힌 자리와 핵심
                    흐름을 먼저 봅니다.
                  </p>
                </div>
              ) : (
                <>
                  {wealthProfile || categoryPreviewProfile ? null : (
                    <FortuneComicTheater chapters={comicPreviewChapters} />
                  )}
                </>
              )}

              {!paid && !aiLoading ? (
                categoryId === "health" ? (
<div className="mt-7 overflow-hidden rounded-[30px] border border-[#7a5b37] bg-[#17120e]">
                    <div className="px-5 pb-5 pt-7 sm:px-7">
                      <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">
                        FREE PREVIEW END
                      </div>

                      <h2 className="mt-3 break-keep text-[27px] font-black leading-[1.22] tracking-[-0.045em] text-[#f5efe6] sm:text-3xl">
                        여기까지가 무료로 보이는 건강운입니다.
                      </h2>

                      <p className="mt-4 break-keep text-[15px] leading-7 text-[#c8beb0]">
                        지금까지는 <strong className="text-white">몸이 어디서 먼저 흔들리는지</strong>까지
                        보여드렸습니다. 그런데 이 사주에서 더 중요한 건
                        <strong className="text-[#e6b978]"> 언제 몸이 무거워지고, 무엇을 바꿔야 회복이 빨라지는지</strong>입니다.
                      </p>

                      <div className="mt-6 border-y border-[#5f472f] py-5">
                        <div className="mb-4 text-sm font-black text-[#e6b978]">
                          전체 풀이에서 이어서 보는 것
                        </div>
                        <div className="space-y-3">
                          {[
                            "약하게 잡히는 몸의 계통",
                            "몸이 무거워지는 시기",
                            "맞는 음식·생활 흐름",
                            "맞는 운동 흐름",
                            "앞으로의 건강 리듬",
                            "도훈의 최종 판정",
                          ].map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-3 text-[15px] font-bold text-[#eee5da]"
                            >
                              <span className="text-[#d8a86f]">🔒</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="mt-5 break-keep text-sm leading-6 text-[#a99d90]">
                        무료 결과에서 확인한 흐름을 바꾸지 않고, 그 다음 시기와 생활 방향을
                        20페이지 전체 풀이에서 이어서 봅니다.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          requestPortOnePayment(
                            getTwentyPageProductName(category),
                            category.price,
                          )
                        }
                        className="mt-6 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-5 py-4 text-base font-black text-white"
                      >
                        건강운 전체 풀이 열기 · {category.price.toLocaleString()}원
                      </button>

                      {isLocalTest && (
                        <button
                          type="button"
                          onClick={openFullReportForTest}
                          disabled={fullLoading}
                          className="mt-3 w-full rounded-full border border-[#6e573d] bg-transparent px-5 py-3 text-xs font-bold text-[#9d8d7a] disabled:opacity-60"
                        >
                          {fullLoading
                            ? "테스트 전체 리포트 생성 중..."
                            : "개발용 전체 리포트 보기"}
                        </button>
                      )}

                      <details className="mt-4 text-xs text-[#8f8377]">
                        <summary className="cursor-pointer select-none text-center underline decoration-[#6e573d] underline-offset-4">
                          구매 안내 · 환불 규정
                        </summary>
                        <div className="mt-3 rounded-2xl bg-black/25 p-4 leading-6">
                          결제 완료 후 입력 정보를 바탕으로 디지털 리포트가 즉시 생성됩니다.
                          디지털 콘텐츠 특성상 리포트 생성이 시작되었거나 결과 열람이 가능한
                          경우 단순 변심 환불은 제한될 수 있습니다.
                        </div>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 overflow-hidden rounded-[30px] border border-[#7a5b37] bg-[#17120e]">
                    <div className="px-5 pb-6 pt-7 sm:px-7">
                      <div className="text-[11px] font-black tracking-[0.2em] text-[#d8a86f]">
                        FREE PREVIEW END
                      </div>

                      <h2 className="mt-3 break-keep text-[27px] font-black leading-[1.22] tracking-[-0.045em] text-[#f5efe6] sm:text-3xl">
                        여기까지가 무료로 보이는 {category.title}입니다.
                      </h2>

                      <p className="mt-4 break-keep text-[15px] leading-7 text-[#c8beb0]">
                        무료에서는 이 사주의 핵심 판정까지만 보여드립니다.
                        전체 풀이에서는 <strong className="text-[#e6b978]">무료에서 나온 판정을 바꾸지 않고</strong>{" "}
                        시기와 현실 장면, 피해야 할 선택, 실제 행동 기준까지 이어서 봅니다.
                      </p>

                      <div className="mt-6 border-y border-[#5f472f] py-5">
                        <div className="mb-4 text-sm font-black text-[#e6b978]">
                          전체 풀이에서 이어서 보는 것
                        </div>
                        <div className="space-y-3">
                          {paidHook.points.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-3 text-[15px] font-bold text-[#eee5da]"
                            >
                              <span className="text-[#d8a86f]">🔒</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          requestPortOnePayment(
                            getTwentyPageProductName(category),
                            category.price,
                          )
                        }
                        className="mt-6 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-5 py-4 text-base font-black text-white"
                      >
                        {category.title} 전체 풀이 열기 · {category.price.toLocaleString()}원
                      </button>

                      {isLocalTest && (
                        <button
                          type="button"
                          onClick={openFullReportForTest}
                          disabled={fullLoading}
                          className="mt-3 w-full rounded-full border border-[#6e573d] bg-transparent px-5 py-3 text-xs font-bold text-[#9d8d7a] disabled:opacity-60"
                        >
                          {fullLoading
                            ? "테스트 전체 리포트 생성 중..."
                            : "개발용 전체 리포트 보기"}
                        </button>
                      )}

                      <div className="mt-5 border-t border-[#493827] pt-4 text-[11px] leading-5 text-[#8f8377]">
                        <p>
                          서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 즉시 디지털 리포트가 생성됩니다.
                        </p>
                        <p className="mt-1">
                          교환/환불 규정: 디지털 콘텐츠 특성상 리포트 생성이 시작되었거나 결과 열람이 가능한 경우 단순 변심 환불은 제한될 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : null}
            </section>

            {paid && (
              <section className="space-y-4">
                <article
                  className={
                    categoryId === "health" || categoryId === "money"
                      ? "overflow-hidden rounded-[30px]"
                      : "rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5"
                  }
                >
                  {categoryId !== "health" && categoryId !== "money" ? (
                    <>
                      <div className="mb-3 rounded-full border border-[#7a5b37] bg-[#241e18] px-4 py-2 text-center text-xs font-black text-[#e0b36d]">
                        전체 리포트 오픈
                      </div>
                      <h2 className="mb-3 text-xl font-black text-[#d8a86f]">
                        도훈의 전체 사주 리포트
                      </h2>
                    </>
                  ) : null}



                  {categoryId !== "money" && categoryPreviewProfile ? (
                    <div className="mb-3 flex items-center gap-3 border-y border-[#5b452d] bg-[#120e0a] px-4 py-3">
                      <div className="shrink-0 text-[9px] font-black tracking-[0.18em] text-[#d8a86f]">FREE → FULL</div>
                      <p className="break-keep text-[12px] font-bold leading-5 text-[#cfc1b2]">
                        무료 판정 유지 · {getCategoryPreviewContinuityText(categoryPreviewProfile)}
                      </p>
                    </div>
                  ) : null}

                  {fullLoading && !aiFull ? (
                    <div className="rounded-3xl border border-[#7a5b37] bg-[#1b1612] p-5">
                      <div className="text-lg font-black text-[#d8a86f]">
                        도훈이 전체 리포트를 깊게 풀고 있습니다
                      </div>
                      <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                        무료 판정에서 멈춘 흐름을 이어서, 시기·복·악운·현실
                        조언까지 깊게 풀고 있습니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      {categoryId === "today" && aiFull && categoryPreviewProfile?.kind === "today" ? (
                        <TodayPaidPartReport
                          profile={categoryPreviewProfile}
                          user={user}
                          fullText={aiFull}
                        />
                      ) : categoryId === "money" && aiFull && wealthProfile ? (
                        <MoneyPaidPartReport
                          profile={wealthProfile}
                          user={user}
                          fullText={aiFull}
                        />
                      ) : categoryId === "career" && aiFull && categoryPreviewProfile?.kind === "career" ? (
                        <CareerPaidPartReport
                          profile={categoryPreviewProfile}
                          user={user}
                          fullText={aiFull}
                        />
                      ) : categoryId === "health" && aiFull ? (
                        categoryPreviewProfile?.kind === "health" &&
                        categoryPreviewProfile.healthPaidReport ? (
                          <HealthPaidPartReport
                            profile={categoryPreviewProfile}
                            user={user}
                            fullText={aiFull}
                          />
                        ) : (
                          // full 응답에 새 healthPaidReport가 없으면
                          // 무료에서 남은 고정 profile을 억지로 재사용하지 않는다.
                          // AI가 만든 fullText 자체를 그대로 보여준다.
                          <ResultReport text={aiFull} paid={false} />
                        )
                      ) : (
                        <>
                          {aiFull ? (
                            <CategoryPaidPartReport categoryId={categoryId} categoryTitle={category.title} user={user} fullText={aiFull} />
                          ) : null}
                        </>
                      )}
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
                <span className="text-[#d8a86f]">
                  도훈이 막힌 자리부터 본다
                </span>
              </h1>
              <p className="mt-4 text-base leading-7 text-[#c8beb0]">
                질문 뒤에 숨어 있는 반복 흐름을 보고, 해도 되는지 멈춰야 하는지
                사주 근거로 풀어주는 상담형 리포트입니다.
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
                      : "border-[#7a5b37] bg-[#111111]",
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
                    alert(
                      "개인정보 수집·이용에 동의해야 상담을 진행할 수 있습니다.",
                    );
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
                    requestPortOnePayment(
                      selectedPlanInfo.title,
                      selectedPlanInfo.price,
                    )
                  }
                  className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-6 py-4 text-sm font-black text-black"
                >
                  로컬 테스트용 포트원 결제창
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
                소름사주는 입력한 생년월일, 출생시간, 성별, 상담 카테고리를
                바탕으로 AI가 생성하는 사주·운세 디지털 리포트 서비스입니다.
              </p>
            </div>

            <div className="mb-4 rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4">
              <div className="text-sm font-black text-[#e0b36d]">
                제공하지 않는 서비스
              </div>
              <p className="mt-3 break-keep text-xs leading-6 text-[#d8d0c6]">
                소름사주는 사주·운세 기반의 디지털 콘텐츠를 제공하며, 아래
                서비스는 제공하지 않습니다.
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
                  본 서비스는 오락·참고용 콘텐츠이며 의학, 법률, 투자, 심리치료,
                  종교·무속 행위를 대체하지 않습니다. 중요한 결정은 현실 상황과
                  함께 판단해 주세요.
                </p>
                <p className="mt-3 text-xs leading-6 text-[#d8d0c6]">
                  서비스 제공기간: 결제 완료 후 입력 정보를 바탕으로 즉시 디지털
                  리포트가 생성됩니다.
                </p>
              </details>

              <details className="rounded-2xl border border-[#7a5b37] bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-[#e0b36d]">
                  개인정보처리방침
                </summary>
                <p className="mt-4 text-xs leading-6 text-[#d8d0c6]">
                  리포트 생성을 위해 이름 또는 별명, 생년월일, 출생시간, 성별,
                  선택 카테고리, 상담 질문을 수집·이용합니다.
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
                  유료 리포트는 결제 후 입력 정보를 바탕으로 생성되는 디지털
                  콘텐츠입니다.
                </p>
                <p className="mt-3 text-xs leading-6 text-[#d8d0c6]">
                  교환/환불 규정: 디지털 콘텐츠 특성상 리포트 생성이
                  시작되었거나 결과 열람이 가능한 경우 단순 변심 환불은 제한될
                  수 있습니다.
                </p>
                <p className="mt-3 text-xs leading-6 text-[#d8d0c6]">
                  단, 결제 오류, 시스템 오류, 중복 결제 등 회사 귀책 사유가
                  확인되는 경우에는 고객문의 접수 후 확인 절차를 거쳐 환불이
                  가능합니다.
                </p>
              </details>
            </div>

            <div className="mt-5 border-t border-[#7a5b37] pt-4 text-[11px] leading-5 text-[#9d9388]">
              <div className="mb-2 text-sm font-black text-[#e0b36d]">
                회사정보
              </div>
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
