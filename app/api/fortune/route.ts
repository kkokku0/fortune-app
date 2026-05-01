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
사용자 정보:
- 이름/별명: ${getName(user)}
- 생년월일: ${safeText(user?.year, "미입력")}년 ${safeText(user?.month, "미입력")}월 ${safeText(user?.day, "미입력")}일
- 음력/양력: ${safeText(user?.calendar, "미입력")}
- 출생시간: ${safeText(user?.birthTime, "모름")}
- 성별: ${safeText(user?.gender, "미입력")}
- 질문: ${safeText(user?.question, "없음")}

상대방 정보:
- 이름/별명: ${safeText(user?.partnerName, "없음")}
- 생년월일: ${safeText(user?.partnerYear, "미입력")}년 ${safeText(user?.partnerMonth, "미입력")}월 ${safeText(user?.partnerDay, "미입력")}일
- 음력/양력: ${safeText(user?.partnerCalendar, "미입력")}
- 출생시간: ${safeText(user?.partnerBirthTime, "모름")}
- 성별: ${safeText(user?.partnerGender, "미입력")}
`;
}

function getHook(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "money" || title.includes("재물")) {
    return {
      first: "쯧쯧, 이러니까 돈이 들어와도 네 손에 오래 안 남는 거야.",
      second: "돈복이 아예 없는 건 아닌데, 돈이 들어오는 길을 아직 제대로 못 잡은 흐름이야.",
    };
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return {
      first: "야, 앞길이 막막한 이유가 있어. 능력이 없어서가 아니라 방향을 잘못 잡고 있는 흐름이야.",
      second: "이대로 가면 1년 뒤에도 똑같이 ‘뭐 해먹고 살지?’만 반복할 수 있어.",
    };
  }

  if (categoryId === "love" || title.includes("연애")) {
    return {
      first: "너는 연애운이 없는 게 아니야. 안 맞는 사람한테 마음을 쓰는 흐름이 문제야.",
      second: "상대가 애매한데도 네가 의미를 붙이면, 그건 운명이 아니라 감정노동 시작이야.",
    };
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return {
      first: "너는 결혼운이 없는 게 아니야. 아무 사람이나 붙잡으면 결혼이 복이 아니라 짐이 되는 사주야.",
      second: "설렘만 보고 가면 나중에 생활에서 크게 부딪힌다.",
    };
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return {
      first: "이 관계, 그냥 좋다 나쁘다로 보면 큰일 난다.",
      second: "끌림은 있는데, 서로의 약점을 정확히 건드리는 궁합일 수 있어.",
    };
  }

  if (categoryId === "family" || title.includes("가족")) {
    return {
      first: "가족이라고 네가 다 감당해야 하는 건 아니야.",
      second: "정을 끊으라는 게 아니라, 선을 못 긋는 게 문제야.",
    };
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return {
      first: "좋은 사람과 돈이 맞는 사람은 달라.",
      second: "이걸 구분 못 하면 돈도 관계도 같이 흔들린다.",
    };
  }

  if (categoryId === "traditional" || title.includes("평생종합사주")) {
    return {
      first: "쯧쯧, 이러니까 지금 돈도 기운도 줄줄 새는 거야.",
      second: "너는 망한 사주가 아니야. 근데 운을 담는 그릇을 아직 제대로 못 만든 사주야.",
    };
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return {
      first: "올해 그냥 흘려보내면 안 된다.",
      second: "돈, 일, 관계 중 하나는 반드시 정리하고 넘어가야 하는 흐름이야.",
    };
  }

  if (categoryId === "today" || title.includes("오늘")) {
    return {
      first: "오늘은 말 한마디, 돈 한 번 쓰는 것부터 조심해야 하는 날이야.",
      second: "괜히 감정 따라 움직이면 일이 꼬일 수 있어.",
    };
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return {
      first: "지금 네 고민, 갑자기 생긴 게 아니야.",
      second: "사주 흐름상 반복되던 패턴이 이번에 다시 올라온 거야.",
    };
  }

  return {
    first: "쯧쯧, 이거 그냥 넘기면 또 같은 자리 돈다.",
    second: "운이 없는 게 아니라, 운을 쓰는 방식이 꼬인 거야.",
  };
}

function getCategoryGuide(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "money" || title.includes("재물")) {
    return `
재물운 전용:
- 재물운만 풀어라.
- 반드시 "타고난 돈복이 어느 정도인지" 먼저 말해라.
- 돈복이 강한지, 약한지, 늦게 열리는지, 사람을 통해 열리는지, 기술/정보/영업/장사로 열리는지 구체적으로 말해라.
- 반드시 "돈이 좋아지는 직업/부업/수익 구조"를 말해라.
- 예시 방향: 영업, 중개, 유통, 리셀, 상담, 콘텐츠, 교육, 기술서비스, 수리, 청소/관리 서비스, 1인 사업, 온라인 판매, 정보 정리형 사업.
- 단, 사용자 사주 흐름에 맞게 골라서 말해라. 전부 나열하지 마라.
- 투자운은 종목 추천이 아니라 성향으로만 말해라. 예: 공격 투자보다 현금흐름형, 단기 충동투자보다 기록형, 남 말 투자보다 직접 검증형.
- 돈이 들어오는 방식, 돈이 새는 패턴, 돈이 남는 조건을 나눠라.
- 충동구매, 정 때문에 나가는 돈, 남 말 듣고 움직이는 돈, 큰돈만 노리는 습관을 맵게 찔러라.
- 하지만 돈이 남는 구조를 만들면 수익이 커질 수 있다는 희망도 반드시 넣어라.
- 특정 종목 추천, 투자 수익률 보장은 금지.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
직업/사업운 전용:
- 직업/사업운만 풀어라.
- 반드시 "사주적으로 맞는 직업군"을 구체적으로 말해라.
- 직장형, 사업형, 부업형, 사람 상대형, 기술형, 콘텐츠형, 영업형, 관리형 중 어디에 가까운지 분명히 말해라.
- 반드시 "이런 방향으로 가면 낫다"는 방향 제시를 해라.
- 예시 방향: 영업/상담/중개/유통/리셀/콘텐츠/교육/서비스업/기술서비스/수리/청소관리/1인 사업/운영관리/기획.
- 사용자 사주 흐름에 맞는 2~4개만 골라서 말해라. 전부 나열하지 마라.
- 피해야 할 일 구조도 말해라. 예: 반복노동, 감정소모 큰 조직, 내 판단을 못 쓰는 일, 큰 자본이 먼저 들어가는 사업 등.
- 생각만 많고 실행이 늦은 패턴을 맵게 찔러라.
- 방향만 잡으면 돈 되는 흐름을 만들 수 있다는 희망도 반드시 넣어라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
연애운 전용:
- 연애운만 풀어라. 궁합이나 결혼운처럼 쓰지 마라.
- 반드시 "나와 어울리는 상대 유형"을 구체적으로 말해라.
- 어울리는 상대의 성격, 말투, 생활 리듬, 감정 표현 방식, 돈/일에 대한 태도를 말해라.
- 반드시 "피해야 할 상대 유형"도 말해라.
- 예: 말은 달콤하지만 행동 없는 사람, 연락이 들쑥날쑥한 사람, 책임감 없는 사람, 외로울 때만 다가오는 사람.
- 타고난 연애운, 끌리는 상대 유형, 반복되는 연애 패턴을 말해라.
- 외로움 때문에 사람 보는 눈이 흐려지는 부분을 맵게 찔러라.
- 사람 보는 기준만 바꾸면 좋은 인연이 들어올 수 있다는 희망도 반드시 넣어라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
결혼운 전용:
- 결혼운만 풀어라.
- 반드시 "어울리는 배우자 유형"을 구체적으로 말해라.
- 배우자 성향, 생활 기준, 돈 관리 방식, 가족관계 태도, 책임감을 말해라.
- 피해야 할 결혼 상대 유형도 말해라.
- 아무 사람이나 붙잡으면 결혼이 짐이 될 수 있다는 흐름을 찔러라.
- 기준만 바로 잡으면 안정적인 배우자운이 열릴 수 있다는 희망도 넣어라.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
궁합풀이 전용:
- 반드시 본인과 상대방을 비교해라.
- 맞는 부분, 안 맞는 부분, 끌리는 이유, 부딪히는 이유를 나눠라.
- 본인 혼자만 분석하지 마라.
- 이 관계에서 잘 맞추려면 어떤 대화 방식과 거리감이 필요한지 구체적으로 말해라.
- 부딪히는 궁합이라도 서로의 방식만 알면 관계가 나아질 수 있다는 희망도 넣어라.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `
가족관계 전용:
- 반드시 본인과 상대방의 관계 구조를 함께 풀어라.
- 가족 안에서의 역할, 상대 기질, 반복되는 서운함, 거리 조절을 말해라.
- 가족이라고 다 감당하는 패턴을 맵게 찔러라.
- 앞으로 어떤 방식으로 말하고, 어디까지 선을 그어야 하는지 구체적으로 말해라.
- 선을 잡으면 관계가 덜 무거워질 수 있다는 희망도 넣어라.
`;
  }

  if (categoryId === "partner" || title.includes("사업파트너")) {
    return `
사업파트너 전용:
- 감정 궁합이 아니라 돈, 역할, 책임, 실행력 구조를 봐라.
- 좋은 사람과 돈이 맞는 사람은 다르다는 점을 강하게 말해라.
- 본인과 상대방을 비교해라.
- 같이 하면 맞는 역할 분담과 절대 같이 하면 안 되는 구조를 말해라.
- 역할만 제대로 나누면 같이 돈 벌 구조가 될 수 있다는 희망도 넣어라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생종합사주")) {
    return `
평생종합사주 전용:
- 단기 운세가 아니다.
- 초년운, 청년운, 중년운, 말년운을 중심으로 길게 풀어라.
- 재물운, 직업/사업운, 인복과 귀인운, 연애·결혼운, 건강운, 가족운을 포함해라.
- 재물운에서는 돈복과 돈이 좋아지는 직업/수익 구조를 말해라.
- 직업/사업운에서는 사주적으로 맞는 직업군과 피해야 할 일 구조를 말해라.
- 연애·결혼운에서는 어울리는 상대와 피해야 할 상대를 말해라.
- 각 시기마다 뼈 때리는 문장을 반드시 넣어라.
- 하지만 "망한 사주"가 아니라 고치면 뒤로 갈수록 밝아질 수 있다는 희망을 반드시 넣어라.
- "이번 달 평생총운" 같은 표현 금지.
- 건강운은 질병 단정 금지. 생활관리와 컨디션 흐름으로 말해라.
`;
  }

  if (categoryId === "monthly" || title.includes("12개월")) {
    return `
12개월운세 전용:
- 1년 흐름을 월별 또는 계절별로 나눠라.
- 움직이면 좋은 달, 조심해야 할 달, 돈/관계/일 흐름을 구분해라.
- 조심할 달뿐 아니라 살아나는 달도 반드시 말해라.
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생")) {
    return `
인생흐름 전용:
- 인생 전체의 큰 전환 흐름을 봐라.
- 늦게 풀리는 구조인지, 빠르게 치고 나가는 구조인지 말해라.
- 같은 고민을 반복하는 이유를 찔러라.
- 앞으로 어떤 방향으로 살아야 운이 열리는지 구체적으로 말해라.
- 방향을 잡으면 흐름이 밝아질 수 있다는 희망도 넣어라.
`;
  }

  return `
공통:
- 현재 선택된 카테고리만 깊게 풀어라.
- 다른 카테고리 추천 금지.
- 고치지 않으면 반복될 결과와, 고치면 풀리는 방향을 같이 말해라.
- 팩폭만 하지 말고 반드시 희망 회복 문장을 넣어라.
- 구체적인 방향 제시를 반드시 넣어라.
`;
}

function getPremiumTease(categoryId?: CategoryId, categoryTitle?: string) {
  const title = categoryTitle || "";

  if (categoryId === "money" || title.includes("재물")) {
    return `
[여기서 끊기면 위험한 이유]

지금 돈이 왜 안 남는지 여기서 대충만 보고 넘기면, 앞으로도 똑같이 샐 가능성이 커.

하지만 반대로 말하면, 네 돈이 어디서 새는지만 제대로 잡아도 재물운은 살아날 수 있어. 돈복이 없는 게 아니라 돈이 남는 구조를 아직 못 만든 쪽에 가까워.

전체 리포트에서는 네 돈이 어떤 직업·부업·수익 구조에서 살아나는지, 앞으로 3개월에 잡아야 할 돈의 흐름, 1년 안에 절대 피해야 할 선택까지 이어서 봐야 해.

이걸 알면 막막했던 돈 흐름이 조금씩 정리되고, 작은 돈도 남는 구조로 바뀔 수 있어. 긴 풀이를 봐야 네 돈이 어디서 살아나는지 보인다.
`;
  }

  if (categoryId === "career" || title.includes("직업") || title.includes("사업")) {
    return `
[여기서 끊기면 위험한 이유]

지금 네가 막힌 이유를 모르고 계속 버티면, 1년 뒤에도 똑같이 “뭐 해먹고 살지?” 하고 있을 수 있어.

근데 걱정만 할 필요는 없어. 너는 방향만 잡히면 돈 되는 흐름을 만들 수 있는 사주야. 문제는 능력이 아니라 어디에 힘을 써야 하는지 아직 정리가 안 된 거야.

전체 리포트에서는 네가 직장형인지, 사업형인지, 부업형인지, 어떤 직업군이 맞는지, 앞으로 3개월 안에 어떤 방향을 테스트해야 하는지까지 이어서 봐야 해.

이걸 알아야 네 일이 어디서 풀리고, 어떤 방식으로 돈을 만들어야 하는지 보인다.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `
[여기서 끊기면 위험한 이유]

연애운이 없는 게 아니라, 사람 보는 기준이 흔들리는 게 문제야.

여기서 멈추면 또 애매한 사람에게 의미를 붙이고, 불안을 설렘으로 착각하고, 같은 상처를 반복할 수 있어.

하지만 네 연애운이 막힌 건 아니야. 어울리는 상대 유형을 제대로 알고, 피해야 할 사람을 거르면 흐름은 달라질 수 있어.

전체 리포트에서는 네가 어떤 사람을 만나야 하는지, 어떤 사람은 피해야 하는지, 앞으로 3개월 안에 들어올 인연 흐름, 1년 안에 연애운이 살아나는 조건까지 봐야 해.
`;
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    return `
[여기서 끊기면 위험한 이유]

이 관계는 좋다, 나쁘다 한마디로 끝낼 수 없어.

끌림은 있는데 서로의 약점을 건드리는 궁합이면, 좋아하는 마음만으로는 버티기 힘들어질 수 있어.

그래도 답이 없는 관계라고 단정할 필요는 없어. 서로 어디서 부딪히는지만 제대로 알면, 감정 싸움이 줄고 관계가 훨씬 편해질 수 있어.

전체 리포트에서는 너와 상대가 맞는 부분, 안 맞는 부분, 감정 회복 방식, 앞으로 3개월 관계 흐름과 1년 안에 깊어질지 멀어질지 봐야 해.
`;
  }

  if (categoryId === "family" || title.includes("가족")) {
    return `
[여기서 끊기면 위험한 이유]

가족이라고 다 감당하는 게 네 역할은 아니야.

여기서 멈추면 또 참고, 또 넘기고, 결국 네 마음만 지치는 흐름이 반복될 수 있어.

하지만 관계를 끊어야만 답인 건 아니야. 선을 제대로 잡으면 가족관계도 덜 무거워질 수 있어.

전체 리포트에서는 너와 상대의 가족관계 구조, 왜 같은 말로 계속 부딪히는지, 앞으로 3개월과 1년 안에 거리 조절을 어떻게 해야 하는지 봐야 해.
`;
  }

  if (categoryId === "traditional" || title.includes("평생종합사주")) {
    return `
[여기서 끊기면 위험한 이유]

평생종합사주는 여기서 대충 보고 끝낼 풀이가 아니야.

지금 돈이 새는 이유, 일이 막히는 이유, 사람 때문에 흔들리는 이유, 인생이 왜 계속 돌아가는 느낌인지 전부 이어져 있어.

그래도 너무 겁먹을 필요는 없어. 너는 망한 사주가 아니야. 초반에 흔들려도 뒤로 갈수록 쌓이는 힘이 있는 사주일 수 있어.

전체 리포트에서는 초년운, 청년운, 중년운, 말년운을 나눠서 네 인생이 어디서 막혔고 어디서 풀릴지 봐야 해. 특히 맞는 직업, 돈이 살아나는 방향, 어울리는 인연까지 같이 봐야 삶의 방향이 잡힌다.

이걸 알면 무엇을 버리고 무엇을 잡아야 할지 보인다. 지금 흐름을 제대로 보면 앞으로의 인생은 충분히 밝아질 수 있어.
`;
  }

  return `
[여기서 끊기면 위험한 이유]

여기서 대충 보고 넘기면 같은 문제가 다시 반복될 수 있어.

지금 네 운이 막힌 이유는 단순한 기분 문제가 아니라, 반복되는 선택과 사주 흐름이 같이 만든 패턴이야.

하지만 이건 고치면 풀리는 흐름이기도 해. 네가 뭘 바꿔야 하는지 알기만 해도 앞으로의 선택은 훨씬 달라질 수 있어.

전체 리포트에서는 앞으로 3개월과 1년 흐름, 피해야 할 선택, 지금 가야 할 방향까지 이어서 봐야 해.

긴 풀이를 봐야 네 흐름이 어디서 막히고 어디서 살아나는지 보인다.
`;
}

function buildSystemPrompt() {
  return `
너는 한국어로 사주 기반 운세풀이를 해주는 AI 상담가다.
브랜드는 "소름사주", 캐릭터는 "운세형"이다.

핵심:
- 일반 상담 앱처럼 쓰지 마라.
- 분석가 말투 금지.
- 사주명리학과 음양오행 흐름을 바탕으로 운세를 풀어라.
- 결과는 참고용 콘텐츠이며 미래를 보장하지 않는다.
- 그래도 말투는 약하면 안 된다. 먼저 찌르고, 그 다음 근거를 대라.

말투:
- 친한 형이 직설적으로 말하는 톤.
- 존댓말 보고서체 금지.
- "합니다", "됩니다", "보입니다", "판단하시기 바랍니다" 금지.
- "해", "돼", "보여", "흐름이야", "이건 봐야 해"처럼 말해라.
- 사람 자체를 깎아내리지 말고, 반복되는 패턴을 때려라.

후킹 규칙:
- 모든 답변은 반드시 [사주적으로 보면]으로 시작한다.
- [사주적으로 보면] 첫 문장과 두 번째 문장은 프롬프트에서 지정한 문장을 그대로 써라.
- 그 다음 "야 이름, 사주 흐름으로 보면..."으로 사주 근거를 이어라.
- 절대 바로 사주 설명부터 시작하지 마라.

구체적 방향 제시 규칙:
- 재물운은 반드시 "돈이 좋아지는 직업/부업/수익 구조"를 말해라.
- 직업/사업운은 반드시 "사주적으로 맞는 직업군"과 "피해야 할 일 구조"를 말해라.
- 연애운은 반드시 "어울리는 상대 유형"과 "피해야 할 상대 유형"을 말해라.
- 결혼운은 반드시 "어울리는 배우자 유형"과 "결혼 후 맞춰야 할 생활 기준"을 말해라.
- 궁합/가족/사업파트너는 반드시 상대방과 비교해서 방향을 말해라.
- 막연히 "노트에 적어라", "계획을 세워라"로 끝내지 마라.
- 사용자가 실제로 방향을 잡을 수 있게 말해라.

팩폭 규칙:
- 맵게 써라.
- 게으름, 미룸, 핑계, 눈치, 집착, 충동, 돈 새는 습관, 사람 보는 눈, 외로움, 고집, 정 때문에 손해 보는 패턴을 상황에 맞게 써라.
- 단, 저주, 인신공격, 모욕, 확정적 불행은 금지.
- 반드시 "이걸 못 고치면 반복될 결과"와 "고치면 풀리는 방향"을 같이 말해라.

희망 회복 규칙:
- 팩폭만 하고 끝내지 마라.
- 반드시 "고치면 좋아지는 미래"를 넣어라.
- 사용자를 절망시키지 마라.
- "이 흐름만 잡으면 충분히 좋아질 수 있다", "돈도 사람도 다시 붙을 수 있다" 같은 회복 문장을 자연스럽게 넣어라.
- 단순 위로가 아니라 사주 흐름상 어떻게 좋아지는지 말해라.

무료 결과 규칙:
- 무료 결과는 반드시 4개 섹션만 작성해라.
- [사주적으로 보면], [한 줄로 딱 말하면], [타고난 ○○운], [여기서 끊기면 위험한 이유]만 써라.
- 무료에서 [앞으로 3개월 흐름], [앞으로 1년 흐름], [현실에서 해볼 행동], [형이 딱 말할게] 쓰지 마라.
- 무료 결과는 900~1300자.

유료 결과 규칙:
- 이미 결제 후 열린 전체 리포트다.
- [이어서 보면 좋은 내용] 금지.
- "여기까지 읽고 내 얘기 같았다면" 금지.
- 결제 유도 문구 금지.
- 다른 카테고리 추천 금지.
- 일반 유료 결과는 3500~5000자.
- 평생종합사주는 5500~7500자.

금지 표현:
- AI라서
- 정확한 사주는 모르지만
- 실제 만세력이 아니라
- 스스로 고민해보세요
- 본인이 판단하시기 바랍니다
- 전문가와 상담하세요 반복
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
  const hook = getHook(categoryId, categoryTitle);
  const premiumTease = getPremiumTease(categoryId, categoryTitle);

  return `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: ${categoryTitle}
사용자 질문: ${question || "없음"}

${getCategoryGuide(categoryId, categoryTitle)}

무료 분석을 작성해라.

반드시 아래 4개 섹션만 작성해라.
다른 섹션은 절대 추가하지 마라.

[사주적으로 보면]
첫 문장은 반드시 그대로:
${hook.first}

두 번째 문장은 반드시 그대로:
${hook.second}

그 다음 반드시 이어서:
야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야.

그 다음 ${categoryTitle}에서 왜 이런 패턴이 반복되는지 짧고 강하게 찔러라.
하지만 "고치면 좋아질 수 있다"는 희망도 한 문장 넣어라.

[한 줄로 딱 말하면]
${categoryTitle}에 대해 선고형으로 한 문장 말해라.
예쁘게 포장하지 말고, 듣는 사람이 멈칫하게 써라.
단, 완전히 절망적인 말로 끝내지 말고 바꿀 수 있는 흐름임을 넣어라.

[타고난 ${categoryTitle}]
타고난 ${categoryTitle}이 좋은 편인지, 약한 편인지, 늦게 열리는지, 사람을 통해 열리는지 핵심만 분석해라.
전부 공개하지 마라.
반드시 카테고리에 맞는 구체 방향을 하나 이상 넣어라.
- 재물운이면 돈이 좋아지는 직업/부업/수익 구조를 일부 보여줘라.
- 직업/사업운이면 맞는 직업군을 일부 보여줘라.
- 연애운이면 어울리는 상대 유형을 일부 보여줘라.
고치지 않으면 반복될 문제를 하나는 맵게 말해라.
그리고 반드시 "이걸 잡으면 흐름은 밝아질 수 있다"는 희망을 넣어라.

${premiumTease}

길이: 900~1300자.
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
  const hook = getHook(categoryId, categoryTitle);

  const commonHeader = `
${buildUserInfoText(user)}

${manseText}

분석 카테고리: ${categoryTitle}
사용자 질문: ${question || "없음"}

${getCategoryGuide(categoryId, categoryTitle)}
`;

  if (categoryId === "traditional") {
    return `
${commonHeader}

평생종합사주 전체 리포트를 작성해라.
결제 후 전체 리포트다. 결제 유도 문구 금지.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시 그대로:
${hook.first}

두 번째 문장은 반드시 그대로:
${hook.second}

그 다음 반드시 이어서:
야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야.

왜 지금까지 돈, 사람, 일에서 같은 패턴이 반복됐는지 맵게 찔러라.
하지만 완전히 막힌 사주는 아니라는 점도 말해라.
이 흐름만 잡으면 뒤로 갈수록 좋아질 수 있다는 희망을 반드시 넣어라.

[한 줄로 딱 말하면]
평생 흐름을 한 문장으로 선고하듯 말해라.
팩폭과 희망을 같이 담아라.

[타고난 사주 구조]
일간, 오행 균형, 강한 기운, 부족한 기운을 현실 패턴으로 풀어라.
장점과 위험한 반복 패턴을 같이 말해라.
좋은 운을 담을 그릇을 만들면 삶이 어떻게 밝아지는지도 말해라.

[초년운]
어릴 때부터 20대 초중반까지의 흐름을 풀어라.
눈치, 참는 습관, 혼자 감당하는 습관, 인정 욕구가 있다면 찔러라.
하지만 이 시기의 경험이 나중에 버티는 힘이 될 수 있다는 점도 말해라.

[청년운]
20대 후반~30대 흐름을 풀어라.
직업 선택, 인간관계, 연애, 돈의 기초가 어떻게 흔들렸는지 말해라.
미룸, 사람 선택, 돈 새는 습관 중 발목 잡는 것을 찔러라.
방향을 잡으면 돈 되는 흐름이 보일 수 있다는 희망도 넣어라.

[중년운]
40대~50대 흐름을 풀어라.
재물, 사업, 가족 책임, 사회적 자리를 말해라.
돈과 사람을 잘못 다루면 어떻게 막히는지 맵게 말해라.
하지만 중년 이후에 자리 잡을 가능성도 반드시 말해라.

[말년운]
60대 이후 흐름을 풀어라.
건강관리, 가족과의 거리, 재물 안정, 마음의 평안을 말해라.
지금부터 줄여야 할 습관을 말해라.
잘 정리하면 말년운이 편해질 수 있다는 희망도 넣어라.

[재물운]
돈이 들어오는 방식, 새는 구간, 남는 조건을 말해라.
돈복이 강한지 약한지, 늦게 열리는지 말해라.
돈이 좋아지는 직업/부업/수익 구조를 구체적으로 말해라.
돈이 남는 구조를 만들면 수익이 커질 수 있다는 희망을 넣어라.

[직업/사업운]
직장형인지, 사업형인지, 부업형인지, 사람 상대형인지 말해라.
사주적으로 맞는 직업군을 3~5개 구체적으로 말해라.
피해야 할 일 구조도 말해라.
방향만 잡으면 돈 되는 일이 보일 수 있다고 말해라.

[인복과 귀인운]
도움 되는 사람, 피해야 할 사람을 말해라.
사람을 정리하면 좋은 인연과 귀인이 들어올 자리가 생긴다고 말해라.

[연애·결혼운]
연애와 결혼에서 반복되는 패턴을 말해라.
어울리는 상대 유형과 피해야 할 상대 유형을 구체적으로 말해라.
기준을 바꾸면 안정적인 인연이 들어올 수 있다고 말해라.

[건강운]
질병 단정 금지.
생활 리듬, 과로, 스트레스, 컨디션 흐름으로 말해라.
리듬을 잡으면 운의 흐름도 가벼워질 수 있다고 말해라.

[가족운]
가족에게서 받는 영향, 책임감, 거리감을 말해라.
선을 잡으면 가족관계가 덜 무거워질 수 있다고 말해라.

[앞으로 1년 흐름]
앞으로 1년 동안 돈, 일, 관계에서 잡아야 할 흐름과 피해야 할 흐름을 말해라.
바꾸면 좋아지는 방향을 분명히 말해라.

[형이 딱 말할게]
6~10줄로 강하게 마무리해라.
팩폭으로 끝내지 말고 희망으로 끝내라.

길이: 5500~7500자.
`;
  }

  return `
${commonHeader}

전체 유료 리포트를 작성해라.
결제 후 전체 리포트다. 결제 유도 문구 금지.
다른 카테고리 추천 금지.
선택된 카테고리인 "${categoryTitle}"만 깊게 풀어라.

반드시 아래 구조로 작성해라.

[사주적으로 보면]
첫 문장은 반드시 그대로:
${hook.first}

두 번째 문장은 반드시 그대로:
${hook.second}

그 다음 반드시 이어서:
야 ${name}, 사주 흐름으로 보면 너는 일간이 ○○이고, 오행 중 ○○ 기운이 강하게 잡히는 흐름이야.

그 다음 이 카테고리에서 반복되는 핵심 문제를 바로 찔러라.
하지만 이 흐름은 고치면 좋아질 수 있다는 희망도 반드시 넣어라.

[한 줄로 딱 말하면]
${categoryTitle}에 대해 선고형으로 한 문장 말해라.
팩폭과 희망을 같이 담아라.

[타고난 ${categoryTitle}]
타고난 ${categoryTitle}이 좋은 편인지, 약한 편인지, 늦게 열리는지, 사람을 통해 열리는지 구체적으로 말해라.
재물운이면 돈이 좋아지는 직업/부업/수익 구조를 말해라.
직업/사업운이면 사주적으로 맞는 직업군을 말해라.
연애운이면 어울리는 상대 유형과 피해야 할 상대 유형을 말해라.
막히는 부분만 말하지 말고, 살아나는 조건도 같이 말해라.

[${categoryTitle}이 강해지는 조건]
어떤 선택, 사람, 환경, 습관에서 이 운이 살아나는지 말해라.
재물운이면 돈이 붙는 일의 방식과 수익 구조를 말해라.
직업/사업운이면 어떤 방향으로 가야 일과 돈이 풀리는지 말해라.
연애운이면 어떤 사람을 찾아야 하는지 말해라.
고치면 어떻게 풀리는지도 말해라.

[${categoryTitle}이 막히는 패턴]
게으름, 미룸, 핑계, 눈치, 집착, 충동, 돈 새는 습관, 사람 보는 눈, 외로움, 고집 중 해당되는 것을 써라.
고치지 않으면 반복될 결과를 맵게 말해라.
하지만 이걸 고치면 흐름이 밝아질 수 있다는 말도 넣어라.

[앞으로 3개월 ${categoryTitle}]
잡아야 할 흐름과 피해야 할 흐름을 나누어라.
작은 기회가 들어올 수 있다는 희망도 넣어라.

[앞으로 1년 ${categoryTitle}]
1년 동안 바꾸지 않으면 반복될 문제와, 바꾸면 좋아지는 방향을 말해라.
이 섹션은 반드시 희망적으로 마무리해라.

[지금 피해야 할 선택]
지금 하면 꼬일 선택 3개를 말해라.
각 선택마다 왜 위험한지 설명해라.

[현실에서 해볼 행동]
실천 행동 3개를 말해라.
단순히 노트에 적으라는 식으로 끝내지 마라.
재물운이면 돈이 붙는 구조를 만드는 행동.
직업/사업운이면 직업/부업/사업 방향을 테스트하는 행동.
연애운이면 어울리는 상대를 알아보고 피해야 할 사람을 거르는 행동을 말해라.

[형이 딱 말할게]
6~10줄로 강하게 마무리해라.
팩폭으로 끝내지 말고, "너는 바뀔 수 있고 흐름도 살아날 수 있다"는 느낌으로 끝내라.

길이: 3500~5000자.
`;
}

function fallbackPreview(categoryTitle: string, user?: UserInfo) {
  const manse = calculateManse(user || {});
  const name = getName(user);

  return `[사주적으로 보면]

쯧쯧, 이거 그냥 넘기면 또 같은 자리 돈다.

운이 없는 게 아니라, 운을 쓰는 방식이 꼬인 거야.

야 ${name}, 사주 흐름으로 보면 너는 일간이 ${manse.dayMaster.label}이고, 오행 중 ${manse.strongestElement} 기운이 비교적 강하게 잡히는 흐름이야.

[한 줄로 딱 말하면]

너는 운이 없는 게 아니라, 운을 쓰는 방식이 아직 정리되지 않은 쪽에 가까워. 하지만 이 흐름은 고치면 충분히 좋아질 수 있어.

[타고난 ${categoryTitle}]

${categoryTitle}은 없는 운이 아니라, 맞는 방식으로 써야 열리는 운이야.

좋은 말로 포장하면 안 돼. 지금 네 흐름에서 제일 조심할 건 방향 없이 움직이는 습관이야. 그래도 맞는 방향만 잡으면 네 흐름은 훨씬 밝아질 수 있어.

[여기서 끊기면 위험한 이유]

여기서 대충 보고 넘기면 같은 문제가 다시 반복될 수 있어.

전체 리포트에서는 ${categoryTitle} 안에서 왜 막히는지, 어떤 방향으로 가야 풀리는지, 앞으로 3개월과 1년 흐름이 어디로 움직이는지 더 깊게 이어서 볼 수 있어. 긴 풀이를 봐야 막막했던 흐름 안에서 희망이 보인다.`;
}

function fallbackFull(categoryTitle: string, user?: UserInfo) {
  const manse = calculateManse(user || {});
  const name = getName(user);

  return `[사주적으로 보면]

쯧쯧, 이거 그냥 넘기면 또 같은 자리 돈다.

운이 없는 게 아니라, 운을 쓰는 방식이 꼬인 거야.

야 ${name}, 사주 흐름으로 보면 너는 일간이 ${manse.dayMaster.label}이고, 오행 중 ${manse.strongestElement} 기운이 비교적 강하게 잡히는 흐름이야.

[한 줄로 딱 말하면]

너는 운이 없는 게 아니라, 운을 쓰는 방식이 꼬인 쪽에 가까워. 하지만 이건 바꾸면 좋아질 수 있는 흐름이야.

[타고난 ${categoryTitle}]

${categoryTitle}은 없는 운이 아니라, 맞는 방식에서 열리는 운이야.

[${categoryTitle}이 강해지는 조건]

네 판단을 쓰고, 사람 반응을 확인하고, 작은 결과를 반복하는 환경에서 운이 살아나.

[${categoryTitle}이 막히는 패턴]

네 판단을 못 쓰고, 감정만 소모하고, 반복만 하는 구조는 오래 갈수록 답답해져.

이거 못 고치면 계속 같은 자리 돈다. 하지만 이걸 고치면 흐름은 훨씬 밝아질 수 있어.

[앞으로 3개월 ${categoryTitle}]

앞으로 3개월은 작은 검증이 중요한 시기야.

[앞으로 1년 ${categoryTitle}]

앞으로 1년은 지금 잡은 방향이 결과로 이어질 수 있는 흐름이야.

[지금 피해야 할 선택]

1. 남이 좋다는 이유만으로 따라가는 선택.

2. 불안해서 급하게 결정하는 선택.

3. 이미 아닌 걸 알면서 계속 끌고 가는 선택.

[현실에서 해볼 행동]

1. 지금 ${categoryTitle}에서 가장 많이 흔들리는 부분을 하나만 정해.

2. 그 흐름을 막는 습관 하나를 줄여.

3. 3개월 동안 같은 기준으로 흐름을 관찰해.

[형이 딱 말할게]

${name}, 좋은 말로 포장하면 안 된다.

너는 기다리기만 하면 풀리는 사람이 아니야.

움직이는 방식부터 바꿔야 해.

근데 희망은 있어. 이 흐름을 잡으면 네 운은 다시 살아날 수 있어.`;
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
    temperature: 0.88,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

export async function POST(request: Request) {
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

    if (!process.env.OPENAI_API_KEY) {
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
          categoryId === "traditional" ? 1600 : 1400
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
          categoryId === "traditional" ? 7600 : 5200
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
        categoryId === "traditional" ? 1600 : 1400
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
        categoryId === "traditional" ? 7600 : 5200
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
    message: "soreum saju concrete direction route is working",
    model: MODEL,
  });
}