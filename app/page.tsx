"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

type Step = "home" | "input" | "result" | "consult";

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
  name: string;
  year: string;
  month: string;
  day: string;
  calendar: "양력" | "음력";
  birthTime: string;
  gender: "남성" | "여성";
  question: string;

  partnerName: string;
  partnerYear: string;
  partnerMonth: string;
  partnerDay: string;
  partnerCalendar: "양력" | "음력";
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
  birthTime: "",
  gender: "남성",
  question: "",

  partnerName: "",
  partnerYear: "",
  partnerMonth: "",
  partnerDay: "",
  partnerCalendar: "양력",
  partnerBirthTime: "",
  partnerGender: "여성",
};

const categories: Category[] = [
  {
    id: "today",
    title: "오늘운세",
    subtitle: "오늘 말·돈·사람관계에서 조심할 것",
    hook: "오늘 피해야 할 말과 돈 선택을 먼저 확인",
    emoji: "🌙",
    price: 1900,
    featured: true,
    badge: "가볍게 시작",
  },
  {
    id: "worry",
    title: "고민풀이",
    subtitle: "지금 고민이 반복되는 사주적 이유",
    hook: "왜 같은 고민이 반복되는지 흐름 확인",
    emoji: "✨",
    price: 6900,
    featured: true,
    badge: "가성비",
  },
  {
    id: "money",
    title: "재물운",
    subtitle: "돈복 등급과 돈이 붙는 구조",
    hook: "돈이 안 남는 이유와 새는 구멍 확인",
    emoji: "💰",
    price: 6900,
    featured: true,
  },
  {
    id: "career",
    title: "직업/사업운",
    subtitle: "직장형·사업형·부업형 판정",
    hook: "나는 직장형일까, 사업형일까?",
    emoji: "💼",
    price: 6900,
    featured: true,
  },
  {
    id: "monthly",
    title: "신년운세",
    subtitle: "올해 재물·직업·이직·건강 흐름",
    hook: "올해 움직일지 머물지 기준 확인",
    emoji: "🌅",
    price: 9900,
    featured: true,
    badge: "올해해운",
  },
  {
    id: "health",
    title: "건강운",
    subtitle: "인생 건강운과 체질적 약점",
    hook: "무리하면 약해지는 생활 패턴 확인",
    emoji: "🩺",
    price: 6900,
    featured: true,
    badge: "신규",
  },
  {
    id: "love",
    title: "연애운",
    subtitle: "어울리는 상대와 피해야 할 상대",
    hook: "올해 인연이 들어오는 시기와 상대 유형",
    emoji: "❤️",
    price: 6900,
    featured: true,
  },
  {
    id: "marriage",
    title: "결혼운",
    subtitle: "배우자 유형과 결혼 후 생활 기준",
    hook: "언제 결혼운이 들어오고 어떤 사람과 맞는지",
    emoji: "💍",
    price: 6900,
    featured: true,
  },
  {
    id: "children",
    title: "자식운",
    subtitle: "자식 인연·자식복·관계 흐름",
    hook: "자식 인연과 부모 역할 흐름 확인",
    emoji: "🧒",
    price: 6900,
    featured: true,
    badge: "신규",
  },
  {
    id: "lifeFlow",
    title: "인생대운",
    subtitle: "초년·청년·중년·말년과 대운 기회",
    hook: "내 인생에서 크게 열리는 시기 확인",
    emoji: "👑",
    price: 9900,
    featured: true,
    badge: "대운분석",
  },
  {
    id: "traditional",
    title: "평생종합사주",
    subtitle: "재물·직업·결혼·건강·자식까지 종합",
    hook: "돈·일·관계·건강·자식운 전체 흐름",
    emoji: "📜",
    price: 9900,
    featured: true,
    badge: "종합인기",
  },
  {
    id: "compatibility",
    title: "궁합풀이",
    subtitle: "궁합 점수·끌림·충돌·결혼 가능성",
    hook: "좋아하는데 왜 자꾸 부딪히는지 확인",
    emoji: "👥",
    price: 6900,
  },
  {
    id: "family",
    title: "가족관계",
    subtitle: "가족궁합·책임·서운함·거리 조절",
    hook: "가족 사이가 왜 힘든지 사주적으로 확인",
    emoji: "🏠",
    price: 6900,
  },
  {
    id: "partner",
    title: "사업파트너",
    subtitle: "동업궁합·돈·역할·책임 구조",
    hook: "같이 돈 벌어도 되는 사람인지 확인",
    emoji: "🤝",
    price: 6900,
  },
  {
    id: "premium",
    title: "프리미엄상담",
    subtitle: "질문 하나를 깊게 풀어보기",
    hook: "현재 고민 하나를 길고 구체적으로 분석",
    emoji: "🔮",
    price: 9900,
  },
];

const characters: Character[] = [
  {
    id: "bro",
    title: "운세형 도훈",
    role: "직업·신년·현실 방향",
    image: "/characters/bro.png",
    emoji: "🧑‍💼",
    categoryId: "career",
  },
  {
    id: "grandma",
    title: "춘옥할매",
    role: "인생대운·가족",
    image: "/characters/grandma.png",
    emoji: "👵",
    categoryId: "lifeFlow",
  },
  {
    id: "seoyeon",
    title: "서연",
    role: "연애·결혼·궁합",
    image: "/characters/seoyeon.png",
    emoji: "💘",
    categoryId: "love",
  },
  {
    id: "teacher",
    title: "돈맥선생",
    role: "재물·돈 흐름",
    image: "/characters/teacher.png",
    emoji: "💰",
    categoryId: "money",
  },
];

const reviews: Review[] = [
  {
    name: "성xx",
    category: "직업/사업운",
    text: "직장형인지 사업형인지 계속 헷갈렸는데 고정 판정처럼 나와서 신뢰가 갔어요.",
  },
  {
    name: "뿌xx",
    category: "재물운",
    text: "돈복을 먼저 상중하로 말해주니까 바로 집중됐어요.",
  },
  {
    name: "하xx",
    category: "연애운",
    text: "어떤 사람을 피해야 하는지까지 말해줘서 제 연애 패턴이 보였어요.",
  },
  {
    name: "우xx",
    category: "평생종합사주",
    text: "초년운부터 건강운, 자식운까지 같이 보니까 진짜 종합사주 느낌이 났어요.",
  },
  {
    name: "민xx",
    category: "궁합풀이",
    text: "점수부터 나오고 왜 부딪히는지 설명해줘서 좋았어요.",
  },
  {
    name: "준xx",
    category: "사업파트너",
    text: "사람 좋은 것과 같이 돈 버는 건 다르다는 말이 기억나요.",
  },
  {
    name: "지xx",
    category: "오늘운세",
    text: "오늘 말이랑 돈에서 조심할 게 구체적으로 나와서 보기 편했어요.",
  },
  {
    name: "라xx",
    category: "고민풀이",
    text: "그냥 위로가 아니라 지금 하지 말아야 할 선택을 짚어줘서 좋았어요.",
  },
  {
    name: "동xx",
    category: "재물운",
    text: "돈이 들어오는 방식과 돈이 새는 구조를 나눠줘서 현실적이었어요.",
  },
  {
    name: "서xx",
    category: "연애운",
    text: "처음엔 설레는데 오래 가면 힘든 사람 유형이 너무 정확했어요.",
  },
  {
    name: "강xx",
    category: "직업/사업운",
    text: "맞는 일 구조와 피해야 할 일 구조가 나와서 방향이 잡혔어요.",
  },
  {
    name: "현xx",
    category: "결혼운",
    text: "결혼운을 막연하게 말하지 않고 생활 기준을 알려줘서 좋았어요.",
  },
  {
    name: "도xx",
    category: "인생대운",
    text: "초년·청년·중년·말년으로 나눠서 보니까 내 인생 흐름이 이해됐어요.",
  },
  {
    name: "윤xx",
    category: "신년운세",
    text: "올해 돈, 일, 건강, 이직 흐름을 한 번에 보니까 방향이 잡혔어요.",
  },
  {
    name: "박xx",
    category: "프리미엄상담",
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
    category: "직업/사업운",
    text: "맞는 일만 말하는 게 아니라 피해야 할 일 구조를 말해줘서 좋았어요.",
  },
  {
    name: "소xx",
    category: "연애운",
    text: "제가 왜 비슷한 사람에게 끌리는지 설명이 좋았어요.",
  },
  {
    name: "기xx",
    category: "궁합풀이",
    text: "몇 점인지 먼저 나오니까 진짜 궁합 본 느낌이 났어요.",
  },
  {
    name: "혜xx",
    category: "가족관계",
    text: "가족궁합 점수랑 거리 조절 기준이 나와서 마음이 정리됐어요.",
  },
  {
    name: "진xx",
    category: "사업파트너",
    text: "동업 전에 봤는데 역할과 돈 기준을 먼저 정하라는 말이 도움 됐어요.",
  },
  {
    name: "수xx",
    category: "평생종합사주",
    text: "중년운부터 건강관리까지 같이 보니까 훨씬 현실적이었어요.",
  },
  {
    name: "영xx",
    category: "고민풀이",
    text: "막연한 답이 아니라 지금 정리해야 할 기준을 말해줘서 좋았어요.",
  },
  {
    name: "규xx",
    category: "재물운",
    text: "돈복 등급을 먼저 보고 나니까 왜 돈이 안 남는지도 이해됐어요.",
  },
  {
    name: "미xx",
    category: "결혼운",
    text: "배우자 유형과 피해야 할 상대를 나눠줘서 기준이 생겼어요.",
  },
  {
    name: "찬xx",
    category: "직업/사업운",
    text: "직업 결과가 볼 때마다 바뀌지 않아서 좋았어요.",
  },
  {
    name: "아xx",
    category: "프리미엄상담",
    text: "제가 물어본 고민을 중심으로 답이 나와서 일반 운세랑 달랐어요.",
  },
  {
    name: "혁xx",
    category: "오늘운세",
    text: "오늘 돈 새는 지출 조심하라는 말이 바로 써먹을 수 있었어요.",
  },
  {
    name: "연xx",
    category: "연애운",
    text: "좋은 인연보다 피해야 할 사람을 말해주는 게 더 도움이 됐어요.",
  },
  {
    name: "재xx",
    category: "인생대운",
    text: "대운 기회가 몇 번 들어오는지 말해줘서 결제한 느낌이 있었어요.",
  },
  {
    name: "나xx",
    category: "신년운세",
    text: "올해 이직해야 할지 머물러야 할지 기준이 나와서 좋았어요.",
  },
  {
    name: "원xx",
    category: "평생종합사주",
    text: "초년운, 청년운, 중년운, 말년운에 건강과 자식까지 있어서 돈 낸 느낌이 있었어요.",
  },
  {
    name: "희xx",
    category: "자식운",
    text: "자식 유무를 단정하지 않고 인연과 관계 흐름으로 말해줘서 좋았어요.",
  },
  {
    name: "석xx",
    category: "재물운",
    text: "무리한 투자랑 고정비 큰 사업 조심하라는 게 현실적이었어요.",
  },
  {
    name: "로xx",
    category: "고민풀이",
    text: "혼자 생각하던 고민이 왜 반복되는지 정리됐어요.",
  },
  {
    name: "유xx",
    category: "결혼운",
    text: "결혼을 해야 하냐보다 어떤 기준으로 해야 하는지 알려줘서 좋았어요.",
  },
  {
    name: "빈xx",
    category: "사업파트너",
    text: "좋은 사람과 돈이 맞는 사람은 다르다는 말이 기억에 남아요.",
  },
  {
    name: "경xx",
    category: "건강운",
    text: "위장·소화·장 리듬 같은 식으로 구체적으로 나와서 좋았어요.",
  },
  {
    name: "훈xx",
    category: "직업/사업운",
    text: "맞는 직업군을 나눠서 설명해줘서 실용적이었어요.",
  },
  {
    name: "별xx",
    category: "오늘운세",
    text: "처음엔 1,900원이라 봤는데 다음엔 재물운도 보고 싶어졌어요.",
  },
  {
    name: "림xx",
    category: "신년운세",
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
    title: "일반 상담권",
    price: 9900,
    desc: "고민 1개 · 현실적인 선택 방향",
  },
  {
    id: "premium",
    title: "프리미엄 상담권",
    price: 19900,
    desc: "깊은 고민 1개 · 긴 상담 리포트",
  },
  {
    id: "couple",
    title: "궁합 상담권",
    price: 19900,
    desc: "두 사람 관계/궁합 집중 풀이",
  },
];

const questionExamples: Record<CategoryId, string[]> = {
  today: [
    "오늘 제가 말, 돈, 사람관계에서 조심해야 할 것은 뭔가요?",
    "오늘 급하게 결정하면 손해 볼 일이 있을까요?",
    "오늘 운을 좋게 쓰려면 뭘 하고 뭘 피해야 하나요?",
  ],
  worry: [
    "제 사주에서 같은 고민이 반복되는 이유가 뭔가요?",
    "지금 제 운에서 붙잡아야 할 것과 내려놔야 할 것은 뭔가요?",
    "이 고민이 제 인생 흐름에서 어떤 의미인지 봐주세요.",
  ],
  money: [
    "제 사주에서 돈복은 상·중·하 중 어디인가요?",
    "돈이 들어오는 운과 새는 운을 같이 봐주세요.",
    "제 사주에서 돈이 붙는 방식과 피해야 할 돈 선택이 궁금해요.",
  ],
  career: [
    "제 사주에서 직업운과 사업운은 어떤 편인가요?",
    "저는 직장형인지, 사업형인지, 부업형인지 봐주세요.",
    "제 사주에 맞는 직업군과 피해야 할 직업군이 궁금해요.",
  ],
  love: [
    "제 사주에서 연애운은 좋은 편인가요?",
    "저는 어떤 인연이 잘 맞고 어떤 인연을 피해야 하나요?",
    "앞으로 1년 인연운과 연애 흐름이 궁금해요.",
  ],
  marriage: [
    "제 사주에서 결혼운은 어떤 흐름인가요?",
    "저에게 맞는 배우자 유형과 결혼 흐름을 봐주세요.",
    "만나는 사람이 있다면 결혼까지 가려면 뭘 맞춰야 하나요?",
  ],
  health: [
    "제 사주에서 건강운은 좋은 편인가요?",
    "인생 전체에서 건강상 약하게 타고난 부분이 궁금해요.",
    "제 체질적 약점과 무리하면 탈 나는 흐름을 봐주세요.",
  ],
  children: [
    "제 사주에서 자식운은 어떤 편인가요?",
    "자식 인연과 자식복이 강한 편인지 궁금해요.",
    "자식과의 관계 흐름과 부모로서 조심할 부분을 봐주세요.",
  ],
  compatibility: [
    "우리 둘의 궁합은 몇 점이고 좋은 궁합인가요?",
    "이 관계가 결혼까지 가도 괜찮은 궁합인지 봐주세요.",
    "우리 둘이 왜 끌리고 왜 자꾸 부딪히는지 궁금해요.",
  ],
  family: [
    "이 가족관계 궁합은 몇 점이고 좋은 편인가요?",
    "가족 사이가 왜 자꾸 부딪히는지 사주적으로 봐주세요.",
    "같이 살거나 돈이 얽히면 어떤 문제가 생길 수 있는지 궁금해요.",
  ],
  partner: [
    "이 사람과 사업파트너 궁합은 몇 점인가요?",
    "같이 일해도 되는지, 동업하면 문제가 생길지 봐주세요.",
    "두 사람의 돈 기준, 역할 분담, 책임 구조가 맞는지 궁금해요.",
  ],
  lifeFlow: [
    "제 초년운, 청년운, 중년운, 말년운 흐름을 봐주세요.",
    "제 인생에서 가장 중요한 대운은 언제 들어오나요?",
    "제 인생에 대운의 기회는 몇 번 있고, 그걸 잡으려면 뭘 준비해야 하나요?",
  ],
  monthly: [
    "올해 제 신년운세 전체 흐름을 봐주세요.",
    "올해 돈복, 직업운, 건강운이 어떤지 궁금해요.",
    "올해 이직운이 있는지, 지금 움직여야 할지 머물러야 할지 봐주세요.",
  ],
  premium: [
    "지금 제일 답답한 문제를 깊게 풀어주세요.",
    "제가 지금 무엇을 붙잡고 무엇을 내려놔야 할까요?",
    "현재 상황에서 현실적으로 가장 좋은 선택은 뭘까요?",
  ],
  traditional: [
    "제 평생 전체 운의 큰 흐름을 봐주세요.",
    "초년운, 중년운, 말년운이 궁금해요.",
    "재물운, 직업운, 연애·결혼운, 건강운, 자식운까지 종합적으로 봐주세요.",
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

  if (categoryId === "monthly") {
    return [
      "올해 전체 해운 결론",
      "올해 재물운·돈복 흐름",
      "올해 직업/사업운과 이직운",
      "올해 건강운과 조심할 시기",
    ];
  }

  if (categoryId === "career") {
    return [
      "직장형·사업형·부업형 명확한 판정",
      "평생 직업 흐름과 앞으로 1년 변화",
      "내 사주에 맞는 직업군 3~5개",
      "피해야 할 직업군과 일 구조",
    ];
  }

  if (categoryId === "money") {
    return [
      "돈복 상·중상·중·중하·하 명확한 판정",
      "돈이 들어오는 방식",
      "돈이 새는 구조",
      "평생 재물 흐름과 앞으로 1년 재물운",
    ];
  }

  if (categoryId === "health") {
    return [
      "인생 전체에서의 건강운 흐름",
      "좋게 타고난 부분과 약한 부분",
      "위장·소화·장·순환 등 체질 흐름",
      "앞으로 1년 건강운 참고 흐름",
    ];
  }

  if (categoryId === "children") {
    return [
      "자식 인연의 강약",
      "자식복이 드러나는 방식",
      "자식과의 관계 흐름",
      "부모로서 조심해야 할 부분",
    ];
  }

  if (categoryId === "lifeFlow") {
    return [
      "초년운·청년운·중년운·말년운",
      "인생 대운 기회가 몇 번 오는지",
      "가장 중요한 대운 시기",
      "대운을 잡기 위해 준비해야 할 것",
    ];
  }

  if (categoryId === "compatibility") {
    return [
      "궁합 점수와 등급",
      "서로 끌리는 이유와 부딪히는 이유",
      "궁합이 좋아지는 조건",
      "결혼하면 생길 수 있는 현실 문제",
    ];
  }

  if (categoryId === "family") {
    return [
      "가족궁합 점수와 등급",
      "사주적으로 부딪히는 이유",
      "같이 살거나 돈이 얽히면 생길 문제",
      "가족관계가 좋아지는 조건",
    ];
  }

  if (categoryId === "partner") {
    return [
      "사업파트너 궁합 점수와 등급",
      "같이 돈을 벌 수 있는 구조",
      "동업하면 생길 수 있는 문제",
      "계약·역할·수익배분 기준",
    ];
  }

  if (categoryId === "love") {
    return [
      "어울리는 상대 유형",
      "피해야 할 상대 유형",
      "연애에서 반복되는 패턴",
      "앞으로 1년 인연 흐름",
    ];
  }

  if (categoryId === "marriage") {
    return [
      "내 결혼운의 진짜 흐름",
      "어울리는 배우자 유형",
      "피해야 할 결혼 상대",
      "결혼 후 맞춰야 할 생활 기준",
    ];
  }

  if (categoryId === "traditional") {
    return [
      "초년운·청년운·중년운·말년운",
      "재물운·직업운·연애결혼운",
      "건강운·자식운·인복·가족운",
      "인생 전체에서 조심해야 할 반복 패턴",
    ];
  }

  return [
    "내 사주에 맞는 핵심 방향",
    "피해야 할 선택과 반복 패턴",
    "앞으로 1년 참고 흐름",
    "전체 운의 방향",
  ];
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
    title.includes("자식운") ||
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
          <p className="break-keep text-[18px] font-black leading-[1.75] tracking-[-0.035em] text-white md:text-[20px]">
            {firstLine}
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
                  : undefined
              )}
            >
              {line}
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

  if (sections.length === 0) return null;

  return (
    <div className="mt-5 space-y-5">
      {paid ? (
        <div className="rounded-[28px] border border-[#7a5b37] bg-black/35 p-5">
          <div className="text-[10px] font-black tracking-[0.32em] text-[#d8a86f]">
            SOREUM FULL REPORT
          </div>
          <div className="mt-2 text-xl font-black tracking-[-0.045em] text-white">
            결론부터 보고, 사주 근거로 깊게 풀어봅니다
          </div>
          <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
            무료에서 멈춘 흐름을 이어서, 카테고리별 핵심 답과 피해야 할 선택까지 봅니다.
          </p>
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-black text-white">{children}</label>;
}

export default function Page() {
  const [step, setStep] = useState<Step>("home");
  const [categoryId, setCategoryId] = useState<CategoryId>("today");
  const [selectedPlan, setSelectedPlan] = useState("premium");
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

  const showPartnerFields =
    categoryId === "compatibility" ||
    categoryId === "partner" ||
    categoryId === "family";

  const showQuestion = categoryId === "premium" || categoryId === "worry";

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
  }일 · ${user.calendar} · ${user.gender}`;

  const paidBullets = getPaidBullets(categoryId);

  const baseFileName = useMemo(() => {
    return makeSafeFileName(`${nameOf(user)}_${category.title}_소름사주_리포트`);
  }, [user.name, category.title]);

  useEffect(() => {
    const host = window.location.hostname;

    setIsLocalTest(
      host === "localhost" ||
        host === "127.0.0.1" ||
        host.startsWith("192.168.")
    );
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
      if (parsed.user) setUser(parsed.user);
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
      setUser(parsed.user);
      setAiPreview(parsed.preview || "");
      setPaid(true);
      setStep("result");

      setTimeout(() => {
        generateFullResult(parsed.categoryId, parsed.user);
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

  const requestTossPayment = async (orderName: string, amount: number) => {
    if (!privacyAgreed) {
      alert("개인정보 수집·이용에 동의해야 결제를 진행할 수 있습니다.");
      return;
    }

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      alert("토스 클라이언트 키가 없습니다. .env.local을 확인하세요.");
      return;
    }

    try {
      window.localStorage.setItem(
        "fortune-pending-payment",
        JSON.stringify({
          categoryId,
          user,
          preview: aiPreview,
        })
      );

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: `guest_${Date.now()}` });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId: `fortune_${Date.now()}`,
        orderName,
        successUrl: `${window.location.origin}${window.location.pathname}?payment=success`,
        failUrl: `${window.location.origin}${window.location.pathname}?payment=fail`,
        customerName: nameOf(user),
      });
    } catch (error) {
      console.error(error);
      alert("결제창을 여는 중 문제가 발생했거나 결제가 취소되었습니다.");
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


        @media (max-width: 767px) {
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
        {step === "home" && (
          <div className="home-compact space-y-10">
            <section className="home-hero relative overflow-hidden rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_78%_30%,rgba(216,168,111,0.2),transparent_36%),linear-gradient(135deg,#050505_0%,#0b0a09_48%,#170f08_100%)] shadow-[0_42px_130px_rgba(0,0,0,0.58)]">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,207,119,0.65)_1px,transparent_0)] [background-size:32px_32px]" />

              <div className="relative grid gap-0 lg:grid-cols-[0.92fr_0.88fr]">
                <div className="z-10 flex flex-col justify-center p-6 py-10 md:p-8 lg:p-10 lg:py-12">
                  <div className="mb-9 max-w-[300px]">
                    <BrandLogo />
                  </div>

                  <h1 className="break-keep text-[42px] font-black leading-[1.08] tracking-[-0.085em] text-white md:text-[62px]">
                    소름 돋게 맞는
                    <br />
                    내 <span className="text-[#e0b36d]">사주 흐름</span>
                  </h1>

                  <p className="mt-6 break-keep text-lg font-medium leading-8 text-[#e8ded2] md:text-xl">
                    지금 막힌 이유, 돈이 새는 이유,
                    <br />
                    사람 때문에 힘든 이유까지
                    <br />
                    친한 형 도훈이가 현실적으로 풀어줄게.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {[
                      ["🎯", "결론부터 말해줌", "핵심만 바로 이해되는 풀이"],
                      ["🔒", "완전 비밀 보장", "입력 정보는 저장하지 않아요"],
                      ["👑", "프리미엄 리포트", "더 깊은 흐름과 실행 전략"],
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
                    내 사주 흐름 무료로 먼저 보기 〉
                  </button>

                  <div className="mt-3 max-w-xl text-center text-sm font-black text-[#d8a86f]">
                    무료로 결론과 핵심까지 확인 가능
                  </div>
                </div>

                <div className="relative min-h-[460px] overflow-hidden bg-black lg:min-h-[560px]">
                  <SafeImage src="/characters/dohoon-hero.png" alt="운세형 도훈 메인 이미지" fallback="🧑‍💼" />
                  <div className="absolute inset-y-0 left-0 hidden w-44 bg-gradient-to-r from-[#050505] to-transparent lg:block" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
                </div>
              </div>
            </section>


            <section className="rounded-[26px] border border-[#7a5b37] bg-[radial-gradient(circle_at_88%_18%,rgba(216,168,111,0.12),transparent_32%),linear-gradient(135deg,#10100f,#080706)] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.28)] md:rounded-[30px] md:p-6">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto mb-3 w-fit rounded-full border border-[#7a5b37] bg-black/40 px-4 py-1.5 text-[10px] font-black tracking-[0.18em] text-[#d8a86f] md:text-xs">
                  SOREUM DIFFERENCE
                </div>
                <h2 className="break-keep text-2xl font-black leading-tight tracking-[-0.055em] text-white md:text-3xl">
                  왜 소름사주는<br className="md:hidden" /> 다르게 느껴질까요?
                </h2>
                <p className="mx-auto mt-4 max-w-xl break-keep text-base font-black leading-7 text-[#e0b36d] md:text-lg md:leading-8">
                  좋은 말만 듣고 싶다면,<br />
                  소름사주는 조금 불편할 수 있습니다.
                </p>
                <div className="mx-auto mt-5 max-w-2xl space-y-4 break-keep text-sm font-medium leading-7 text-[#d8d0c6] md:text-base md:leading-8">
                  <p>
                    소름사주는 “언젠가 좋아진다”보다<br className="hidden md:block" />
                    왜 같은 문제가 반복되는지를 먼저 봅니다.
                  </p>
                  <p className="mx-auto max-w-xl rounded-[22px] border border-[#7a5b37] bg-black/36 p-4 text-center text-[#f4eadc] md:p-5">
                    돈이 들어와도 남지 않는 이유,<br />
                    좋아하는데 오래 못 가는 이유,<br />
                    일을 시작해도 끝까지 끌고 가지 못하는 이유,<br />
                    몸이 괜찮다가도 한 번씩 무너지는 이유.
                  </p>
                  <p>
                    이 흐름은 우연이 아니라<br className="hidden md:block" />
                    내 사주 안에서 반복되는 패턴일 수 있습니다.
                  </p>
                  <p className="text-base font-black leading-7 text-white md:text-lg md:leading-8">
                    그래서 소름사주는 운세를 예쁘게 포장하지 않고,<br className="hidden md:block" />
                    지금 내 선택이 어디서 꼬이는지부터 짚어드립니다.
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
                  ["🎯", "결론부터 말해줌", "바쁜 당신을 위한 핵심 진단 풀이"],
                  ["📝", "카테고리별 정밀 분석", "재물·연애·직업 흐름을 따로 분석"],
                  ["🔒", "반복 패턴 분석", "돈·사람·일에서 반복되는 막힘을 짚어드려요"],
                  ["👑", "프리미엄 전체 리포트", "더 깊고 상세한 인생 흐름 제공"],
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
                  getCategory("marriage"),
                  getCategory("compatibility"),
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
                  생년월일을 입력하고
                  <br />
                  <span className="text-[#e0b36d]">무료로 핵심을 확인해보세요</span>
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
                      <button key={value} type="button" onClick={() => setUser({ ...user, calendar: value })} className={cx("rounded-2xl border p-4 font-black", user.calendar === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-[#7a5b37] bg-[#14110d] text-white")}>{value}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["남성", "여성"] as const).map((value) => (
                      <button key={value} type="button" onClick={() => setUser({ ...user, gender: value })} className={cx("rounded-2xl border p-4 font-black", user.gender === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-[#7a5b37] bg-[#14110d] text-white")}>{value}</button>
                    ))}
                  </div>
                  <select value={user.birthTime} onChange={(event) => setUser({ ...user, birthTime: event.target.value })} className="w-full p-4">
                    {birthTimes.map((time) => <option key={time} value={time === "모름 / 선택 안 함" ? "" : time}>{time}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => goInput("today")}
                    className="w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#f5c66d] to-[#b78343] px-6 py-5 text-lg font-black text-black"
                  >
                    무료로 사주 보기 〉
                  </button>
                </div>
              </div>

              <div className="rounded-[34px] border border-[#7a5b37] bg-[radial-gradient(circle_at_80%_20%,rgba(216,168,111,0.16),transparent_36%),#11100f] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                <h2 className="text-3xl font-black tracking-[-0.06em] text-white">
                  여기서 끊기면
                  <br />
                  <span className="text-[#e0b36d]">진짜 중요한 선택 기준을 놓칠 수 있어요</span>
                </h2>
                <p className="mt-5 break-keep text-base leading-8 text-[#d8d0c6]">
                  무료 결과는 결론과 핵심 흐름까지만 보여드려요. 전체 리포트에서는 돈이 들어오는 방식, 사람관계의 반복 패턴, 일과 건강의 흐름까지 이어서 확인할 수 있어요.
                </p>
                <p className="mt-4 break-keep text-base font-black leading-8 text-white">
                  앞으로 무엇을 잡고,
                  <br />
                  무엇을 피해야 하는지까지 확인해보세요.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-5">
                  {["돈이 들어오는 방식", "돈이 새는 구멍", "피해야 할 선택", "앞으로 흐름", "지금 해야 할 행동"].map((item) => (
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
                  전체 리포트 보기 〉
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
                  { title: "오늘운세 전체 리포트", desc: "오늘의 운세 흐름", price: 1900, points: ["오늘 하루 흐름", "피해야 할 선택", "좋은 시간 & 키워드"], id: "today" as CategoryId },
                  { title: "일반 사주 전체 리포트", desc: "재물운·연애운·직업운 등", price: 6900, points: ["핵심 흐름 + 상세 풀이", "앞으로 선택 기준", "실행 전략과 조언"], id: "money" as CategoryId },
                  { title: "프리미엄 전체 리포트", desc: "평생종합사주 · 프리미엄 상담", price: 9900, points: ["평생 흐름 + 대운 해석", "돈·일·관계·건강 전체", "가장 중요한 대운과 기회"], id: "traditional" as CategoryId },
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
                    신년운세에서 보는 것
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-white">
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">올해 재물운</div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">올해 직업운</div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">올해 이직운</div>
                    <div className="rounded-2xl border border-[#7a5b37] bg-black/30 p-3">올해 건강운</div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#c8beb0]">
                    올해 움직여야 할지, 머물러야 할지, 돈복이 들어오는지, 건강은 어디를 조심해야 하는지까지 봅니다.
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
                음력 생일만 알고 있다면 음력으로 선택해도 풀이가 가능하지만,
                정밀도는 양력 입력이 더 안정적입니다.
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
                    onClick={() => setUser({ ...user, calendar: value })}
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
                    음력만 알고 있다면 음력으로 선택해도 풀이가 가능하지만, 궁합
                    정밀도는 양력 입력이 더 안정적입니다.
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
                          setUser({ ...user, partnerCalendar: value })
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
                    만세력 계산과 사주풀이를 생성 중입니다
                  </div>
                  <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                    무료에서는 지금 사주에서 보이는 핵심 결론과 반복되는 문제를 먼저 봅니다.
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
                  <div className="mb-3 text-2xl font-black leading-tight text-[#d8a86f]">
                    여기서 끊기면
                    <br />
                    진짜 중요한 선택 기준을 놓칠 수 있어요
                  </div>

                  <p className="break-keep text-sm leading-7 text-[#c8beb0]">
                    무료 결과는 결론과 핵심 흐름까지만 보여드려요.
                    전체 리포트에서는 돈이 들어오는 방식, 사람관계의 반복 패턴,
                    일과 건강의 흐름까지 이어서 확인할 수 있어요.
                  </p>

                  <p className="mt-3 break-keep text-sm font-black leading-7 text-white">
                    앞으로 무엇을 잡고,
                    <br />
                    무엇을 피해야 하는지까지 확인해보세요.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[#7a5b37] bg-black/45 p-4">
                    <div className="mb-2 text-sm font-black text-[#f5efe6]">
                      전체 리포트에서 이어지는 내용
                    </div>

                    <div className="mt-3 space-y-2 text-sm font-semibold text-white">
                      {paidBullets.map((item) => (
                        <div key={item}>✓ {item}</div>
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
                      requestTossPayment(`${category.title} 전체 리포트`, category.price)
                    }
                    className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-5 py-4 text-base font-black text-white"
                  >
                    전체 리포트 열기 {category.price.toLocaleString()}원
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
                    운세형의 전체 맞춤 리포트
                  </h2>

                  {fullLoading && !aiFull ? (
                    <div className="rounded-3xl border border-[#7a5b37] bg-[#1b1612] p-5">
                      <div className="text-lg font-black text-[#d8a86f]">
                        전체 리포트를 깊게 생성 중입니다
                      </div>
                      <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                        결론부터 정리하고, 사주 근거와 카테고리별 핵심 답을 이어서 풀어보고 있어요.
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
                혼자 오래 고민한 문제,
                <br />
                <span className="text-[#d8a86f]">운세형이 길게 풀어준다</span>
              </h1>
              <p className="mt-4 text-base leading-7 text-[#c8beb0]">
                질문 중심으로 감정, 현실, 선택지를 같이 풀어주는 상담형 리포트입니다.
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
                    requestTossPayment(selectedPlanInfo.title, selectedPlanInfo.price)
                  }
                  className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-6 py-4 text-sm font-black text-black"
                >
                  로컬 테스트용 토스 결제창
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
