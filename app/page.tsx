"use client";

import { useMemo, useState, type ReactNode } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

type Step = "home" | "input" | "result" | "consult";

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
  partnerBirthTime: string;
  partnerGender: "남성" | "여성";
};

type Category = {
  id: CategoryId;
  title: string;
  subtitle: string;
  emoji: string;
  price: number;
  featured?: boolean;
};

type Character = {
  id: string;
  title: string;
  image: string;
  emoji: string;
  categoryId: CategoryId;
};

type ConsultPlan = {
  id: string;
  title: string;
  price: number;
  desc: string;
};

type Review = {
  name: string;
  category: string;
  text: string;
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
  partnerBirthTime: "",
  partnerGender: "여성",
};

const categories: Category[] = [
  {
    id: "money",
    title: "재물운",
    subtitle: "돈이 왜 안 남는지",
    emoji: "💰",
    price: 6900,
    featured: true,
  },
  {
    id: "career",
    title: "직업/사업운",
    subtitle: "지금 하는 일 계속해도 되는지",
    emoji: "💼",
    price: 6900,
    featured: true,
  },
  {
    id: "love",
    title: "연애운",
    subtitle: "그 사람 마음과 내 패턴",
    emoji: "❤️",
    price: 6900,
    featured: true,
  },
  {
    id: "lifeFlow",
    title: "인생흐름",
    subtitle: "앞으로 큰 흐름과 전환점",
    emoji: "👑",
    price: 12900,
    featured: true,
  },
  {
    id: "today",
    title: "오늘운세",
    subtitle: "오늘 조심할 선택",
    emoji: "🌙",
    price: 1900,
  },
  {
    id: "worry",
    title: "고민풀이",
    subtitle: "계속 맴도는 문제",
    emoji: "✨",
    price: 3900,
  },
  {
    id: "marriage",
    title: "결혼운",
    subtitle: "배우자운과 생활 기준",
    emoji: "💍",
    price: 6900,
  },
  {
    id: "compatibility",
    title: "궁합풀이",
    subtitle: "왜 끌리고 부딪히는지",
    emoji: "👥",
    price: 6900,
  },
  {
    id: "family",
    title: "가족관계",
    subtitle: "가까워서 어려운 관계",
    emoji: "🏠",
    price: 6900,
  },
  {
    id: "partner",
    title: "사업파트너",
    subtitle: "같이 돈 벌 사람인지",
    emoji: "🤝",
    price: 12900,
  },
  {
    id: "monthly",
    title: "12개월운세",
    subtitle: "움직일 달과 참을 달",
    emoji: "🗓️",
    price: 12900,
  },
  {
    id: "premium",
    title: "프리미엄상담",
    subtitle: "질문 하나를 깊게",
    emoji: "🔮",
    price: 29000,
  },
];

const characters: Character[] = [
  {
    id: "bro",
    title: "운세형",
    image: "/characters/bro.png",
    emoji: "🧑‍💼",
    categoryId: "career",
  },
  {
    id: "grandma",
    title: "춘옥할매",
    image: "/characters/grandma.png",
    emoji: "👵",
    categoryId: "lifeFlow",
  },
  {
    id: "seoyeon",
    title: "서연",
    image: "/characters/seoyeon.png",
    emoji: "💘",
    categoryId: "love",
  },
  {
    id: "teacher",
    title: "도훈",
    image: "/characters/teacher.png",
    emoji: "💰",
    categoryId: "money",
  },
];

const reviews: Review[] = [
  { name: "뿌xx", category: "재물운", text: "돈이 안 모이는 이유를 지출 습관이랑 연결해서 말해줘서 현실적이었어요." },
  { name: "성xx", category: "직업/사업운", text: "그냥 힘내라는 말이 아니라 지금 뭘 줄여야 하는지 알려줘서 좋았어요." },
  { name: "하xx", category: "연애운", text: "상대 마음보다 내 패턴을 먼저 보라는 말이 딱 맞았어요." },
  { name: "꼬xx", category: "인생흐름", text: "왜 계속 돌아왔는지 설명해주는데 이상하게 위로가 됐어요." },
  { name: "민xx", category: "궁합풀이", text: "좋다 나쁘다가 아니라 왜 부딪히는지 풀어줘서 상담받는 느낌이었어요." },
  { name: "도xx", category: "결혼운", text: "결혼은 감정이 아니라 생활이라는 말이 계속 남았어요." },
  { name: "라xx", category: "고민풀이", text: "머릿속으로만 돌던 고민을 현실 선택으로 나눠줘서 정리가 됐어요." },
  { name: "쭈xx", category: "12개월운세", text: "움직일 달과 쉬어야 할 달을 나눠주니까 계획 세우기 좋았어요." },
  { name: "현xx", category: "재물운", text: "무조건 벌라는 말보다 새는 구멍부터 보라는 말이 와닿았어요." },
  { name: "몽xx", category: "직업/사업운", text: "하고 싶은 게 많아서 헷갈렸는데 하나로 좁히라는 말이 현실적이었어요." },
  { name: "별xx", category: "연애운", text: "불안을 사랑으로 착각할 수 있다는 말이 제 상황이랑 너무 맞았어요." },
  { name: "준xx", category: "사업파트너", text: "사람 좋다고 같이 가면 안 된다는 말 듣고 계약 조건부터 다시 봤어요." },
  { name: "나xx", category: "가족관계", text: "가족이라도 선이 있어야 오래 간다는 말이 마음에 남았어요." },
  { name: "솔xx", category: "프리미엄상담", text: "짧은 운세보다 상담처럼 길게 풀어줘서 돈 낸 느낌이 있었어요." },
  { name: "해xx", category: "오늘운세", text: "오늘 피해야 할 선택을 콕 집어줘서 괜히 서두르지 않게 됐어요." },
  { name: "우xx", category: "인생흐름", text: "늦은 게 아니라 돌아온 시간이 재료가 된다는 말이 위로됐어요." },
  { name: "루xx", category: "재물운", text: "돈복 얘기만 하는 게 아니라 돈이 남는 구조를 말해줘서 좋았어요." },
  { name: "찬xx", category: "직업/사업운", text: "지금 일을 그만둘지 말지보다 어떤 방식으로 바꿔야 하는지 알게 됐어요." },
  { name: "유xx", category: "연애운", text: "상대 연락 하나에 흔들리는 이유를 설명해줘서 마음이 정리됐어요." },
  { name: "빈xx", category: "결혼운", text: "결혼을 감정이 아니라 생활 기준으로 보라는 말이 현실적이었어요." },
  { name: "태xx", category: "궁합풀이", text: "왜 서로 좋아하는데도 자꾸 엇갈리는지 이해가 됐어요." },
  { name: "미xx", category: "고민풀이", text: "선택을 못 하는 게 아니라 잃을까 봐 멈춘 거라는 말이 딱 맞았어요." },
  { name: "진xx", category: "12개월운세", text: "무조건 달리라는 말이 아니라 멈출 달도 알려줘서 좋았어요." },
  { name: "아xx", category: "오늘운세", text: "짧게 봤는데도 오늘 조심할 포인트가 분명해서 괜찮았어요." },
  { name: "봄xx", category: "재물운", text: "내 소비 패턴을 보는 느낌이라 뜨끔했어요." },
  { name: "강xx", category: "직업/사업운", text: "돈 되는 능력부터 정리하라는 말이 지금 상황에 맞았어요." },
  { name: "리xx", category: "연애운", text: "좋아하는 마음보다 내 일상이 무너지는지가 중요하다는 말이 남았어요." },
  { name: "수xx", category: "가족관계", text: "가족에게 미안해서 못 하던 말을 조금은 정리할 수 있었어요." },
  { name: "호xx", category: "사업파트너", text: "정 때문에 같이 하려던 일을 다시 생각하게 됐어요." },
  { name: "온xx", category: "프리미엄상담", text: "내 질문 하나를 길게 파고들어줘서 상담받는 기분이었어요." },
  { name: "린xx", category: "인생흐름", text: "계속 꼬였다고만 생각했는데 흐름을 다르게 보게 됐어요." },
  { name: "석xx", category: "재물운", text: "투자보다 먼저 새는 돈을 막으라는 말이 현실적이었어요." },
  { name: "은xx", category: "연애운", text: "상대가 아니라 내 불안이 문제였다는 말이 너무 와닿았어요." },
  { name: "대xx", category: "직업/사업운", text: "이직보다 먼저 현재 구조를 바꾸라는 조언이 도움됐어요." },
  { name: "채xx", category: "결혼운", text: "좋은 사람인지보다 같이 생활이 되는지를 보라는 게 좋았어요." },
  { name: "규xx", category: "궁합풀이", text: "싸우는 이유가 성격 차이보다 회복 방식 차이라는 말이 기억나요." },
  { name: "메xx", category: "고민풀이", text: "생각을 더 하라는 말이 아니라 작게 테스트하라는 말이 좋았어요." },
  { name: "기xx", category: "오늘운세", text: "오늘은 바로 답하지 말라는 말 덕분에 실수 안 했어요." },
  { name: "여xx", category: "12개월운세", text: "한 해를 무작정 버티는 게 아니라 나눠서 보는 느낌이었어요." },
  { name: "파xx", category: "재물운", text: "부업을 막 시작하려던 참인데 검증부터 하라는 말이 도움됐어요." },
  { name: "늘xx", category: "인생흐름", text: "늦었다는 생각이 많았는데 전환점이라는 말이 힘이 됐어요." },
  { name: "정xx", category: "직업/사업운", text: "내가 에너지를 어디에 낭비하는지 보게 됐어요." },
  { name: "율xx", category: "연애운", text: "기다릴지 말지보다 내 마음이 왜 흔들리는지 알게 됐어요." },
  { name: "산xx", category: "가족관계", text: "가까울수록 선이 필요하다는 말이 제일 좋았어요." },
  { name: "담xx", category: "프리미엄상담", text: "짧은 문장 몇 개가 아니라 긴 흐름으로 설명돼서 만족했어요." },
  { name: "서xx", category: "결혼운", text: "결혼을 너무 감정으로만 봤다는 걸 알게 됐어요." },
  { name: "로xx", category: "사업파트너", text: "같이 돈 벌 사람인지 보는 기준이 생겼어요." },
  { name: "지xx", category: "궁합풀이", text: "상대랑 왜 끌리는지, 왜 피곤한지 둘 다 설명돼서 신기했어요." },
  { name: "윤xx", category: "고민풀이", text: "내가 답을 모르는 게 아니라 겁내고 있었다는 말이 맞았어요." },
  { name: "희xx", category: "오늘운세", text: "간단하게 봤는데도 오늘의 기준이 생겨서 좋았어요." },
  { name: "노xx", category: "재물운", text: "돈이 들어오는 운보다 돈이 머무는 구조를 말해줘서 신뢰가 갔어요." },
  { name: "마xx", category: "직업/사업운", text: "다 벌리기보다 하나로 좁히라는 말이 지금 제일 필요했어요." },
  { name: "다xx", category: "연애운", text: "상대 연락보다 내 하루가 무너지는지 보라는 말이 기억나요." },
  { name: "필xx", category: "인생흐름", text: "과거를 후회하기보다 재료로 보라는 말이 좋았어요." },
  { name: "초xx", category: "12개월운세", text: "언제 움직이고 언제 기다릴지 감이 잡혔어요." },
  { name: "비xx", category: "가족관계", text: "책임감과 죄책감을 구분해줘서 마음이 좀 가벼워졌어요." },
  { name: "건xx", category: "프리미엄상담", text: "내 질문을 현실적인 행동으로 바꿔줘서 좋았어요." },
  { name: "소xx", category: "결혼운", text: "감정보다 생활 기준이라는 말이 계속 생각났어요." },
  { name: "단xx", category: "사업파트너", text: "처음에 불편한 얘기를 해야 나중에 덜 다친다는 말이 맞는 것 같아요." },
  { name: "원xx", category: "궁합풀이", text: "잘 맞는 부분과 부딪히는 부분을 같이 말해줘서 좋았어요." },
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
    price: 19000,
    desc: "고민 1개 · 현실적인 선택 방향",
  },
  {
    id: "premium",
    title: "프리미엄 상담권",
    price: 29000,
    desc: "깊은 고민 1개 · 긴 상담 리포트",
  },
  {
    id: "couple",
    title: "궁합 상담권",
    price: 39000,
    desc: "두 사람 관계/궁합 집중 풀이",
  },
];

function cx(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

function getCategory(id: CategoryId) {
  return categories.find((item) => item.id === id) || categories[0];
}

function nameOf(user: UserInfo) {
  return user.name.trim() || "너";
}

function fallbackPreview(categoryId: CategoryId, user: UserInfo) {
  const name = nameOf(user);

  const map: Record<CategoryId, string> = {
    today: `야 ${name}, 오늘은 작은 선택 하나가 하루 흐름을 바꾸는 날이다. 말 한마디, 연락 하나, 돈 쓰는 순간 하나가 생각보다 크게 이어질 수 있어. 오늘은 감정 올라온 상태에서 바로 결정하면 손해 보기 쉽다. 그래서 중요한 연락, 돈 쓰는 일, 누군가에게 확답하는 일은 한 번 숨 고르고 가는 게 좋다.`,
    worry: `야 ${name}, 지금 고민은 단순히 선택을 못 해서가 아니다. 이미 답은 어느 정도 알고 있는데 실패하거나 잃을까 봐 멈춘 상태에 가깝다. 생각이 부족한 게 아니라, 기준이 흐려져서 계속 제자리에서 맴도는 흐름이다.`,
    money: `야 ${name}, 돈이 안 들어오는 게 문제가 아니라 남지 않는 구조가 더 커 보인다. 지금은 더 벌려고 무리하기보다 새는 구멍부터 막아야 돈운이 열린다. 특히 감정적으로 돈을 쓰거나, 확신 없는 일에 돈을 넣는 선택은 조심해야 한다.`,
    career: `야 ${name}, 지금 일 흐름은 더 열심히가 아니라 어디에 힘을 몰아야 하는지가 핵심이다. 방향이 흩어지면 결과도 흩어진다. 지금은 이것저것 다 잡으려는 것보다 돈이 될 수 있는 한 가지 흐름을 먼저 좁혀야 한다.`,
    love: `야 ${name}, 지금 연애운은 상대 마음보다 네가 왜 흔들리는지를 먼저 봐야 한다. 설렘과 불안을 헷갈리면 비슷한 관계가 반복될 수 있다. 지금은 상대가 나를 좋아하느냐보다, 그 관계가 나를 안정시키는지 봐야 한다.`,
    marriage: `야 ${name}, 결혼운은 설렘보다 생활, 돈, 가족, 습관을 봐야 한다. 같이 살아도 무너지지 않을 기준이 있는지가 중요하다. 좋아하는 마음만으로는 버티기 어려운 현실 조건들이 들어오는 흐름이다.`,
    compatibility: `야 ${name}, 이 관계는 좋다 나쁘다로 자르기 어렵다. 끌리는 이유도 있고 부딪히는 이유도 분명하다. 서로 다르게 반응하는 지점을 봐야 한다. 궁합은 안 싸우는 관계가 아니라, 싸워도 회복할 수 있는 구조가 있는지를 보는 거다.`,
    family: `야 ${name}, 가족관계는 가까워서 더 어렵다. 책임감과 서운함 사이에서 선을 다시 잡아야 한다. 가족이라고 해서 모든 걸 감당해야 하는 건 아니고, 가까울수록 기준이 있어야 오래 간다.`,
    partner: `야 ${name}, 사업파트너는 사람 좋다고 같이 가면 위험하다. 역할, 돈 기준, 책임 범위가 먼저다. 좋은 사람이어도 돈이 섞이면 다른 모습이 나올 수 있어서 처음부터 기준을 잡아야 한다.`,
    lifeFlow: `야 ${name}, 네 인생흐름은 직선보다 돌아가며 길이 만들어지는 쪽에 가깝다. 늦은 게 아니라 쌓인 경험을 구조로 바꿀 때다. 지금 답답한 건 멈춘 게 아니라 방향을 다시 잡으라는 신호에 가깝다.`,
    monthly: `야 ${name}, 앞으로 12개월은 움직일 달과 참아야 할 달이 다르다. 타이밍을 알아야 힘을 덜 쓰고 결과를 잡는다. 무조건 밀어붙이는 방식보다, 정리할 달과 실행할 달을 나눠야 한다.`,
    premium: `야 ${name}, 이건 그냥 운세가 아니라 네 질문 하나를 깊게 파는 상담이다. 감정과 현실을 같이 봐야 답이 나온다. 지금 네가 붙잡고 있는 고민은 표면보다 안쪽 이유가 더 중요하다.`,
  };

  return `${map[categoryId]}

조금 더 길게 보면, 지금 네 흐름은 단순히 운이 좋다 나쁘다로 끝낼 문제가 아니다. 같은 고민이 반복됐다면 거기에는 반드시 패턴이 있고, 그 패턴을 먼저 봐야 방향이 잡힌다.

무료 분석에서는 네가 지금 왜 막혀 있는지, 어떤 선택을 조심하면 좋은지, 어디서부터 흐름을 정리해야 하는지 먼저 짚어준다. 여기까지만 봐도 지금 상황을 이해하는 데는 충분하다.

다만 앞으로 30일에서 3개월 사이에 어떤 흐름이 바뀌는지, 돈·일·관계에서 무엇을 먼저 정리해야 하는지까지 보고 싶다면 전체 리포트에서 이어서 보면 된다.`;
}

function fallbackFull(categoryId: CategoryId, user: UserInfo) {
  const name = nameOf(user);
  const category = getCategory(categoryId);

  const intro = `야 ${name}, 지금부터는 조금 길게 풀어볼게.

지금 네 흐름은 단순히 운이 좋다 나쁘다로 자를 수 있는 구간이 아니다. 겉으로 보기에는 막힌 것처럼 보여도, 실제로는 방향을 다시 잡으라는 신호가 강하게 들어와 있다. 이럴 때 제일 위험한 건 조급해서 아무거나 붙잡는 거다. 사람도, 일도, 돈도 마찬가지다.

지금은 더 많이 벌고, 더 열심히 하고, 더 붙잡는 게 답이 아닐 수 있다. 오히려 어디에서 힘이 새고 있는지, 어떤 선택이 계속 같은 결과를 만들고 있는지 먼저 봐야 한다. 좋은 흐름이 들어와도 받을 준비가 안 되어 있으면 결국 다시 흘려보내게 된다.`;

  const categoryText: Record<CategoryId, string> = {
    today: `오늘은 말과 선택을 조심해야 한다. 크게 움직이는 것보다 작은 실수를 막는 게 더 중요하다. 특히 감정이 올라온 상태에서 바로 답하거나 결정하면 나중에 후회할 수 있다. 오늘은 한 번 멈추고, 확인하고, 그 다음에 움직이는 게 좋다. 오늘 들어오는 기회는 거창한 모양이 아니라 작은 연락, 작은 제안, 작은 정리에서 시작될 가능성이 높다.`,
    worry: `지금 고민의 핵심은 선택 자체보다 선택 이후를 감당할 수 있을지에 대한 불안이다. 네가 답을 모르는 게 아니라, 답을 선택했을 때 잃을 것이 있을까 봐 멈춘 상태에 가깝다. 이럴 때는 큰 결론보다 작은 테스트가 먼저다. 작게 해보고 반응을 봐야 머릿속 고민이 현실 판단으로 바뀐다.`,
    money: `돈 흐름에서는 새는 구멍이 먼저 보인다. 돈이 없어서 문제가 아니라, 들어온 돈이 머무는 구조가 약하다. 지출 기준, 충동 구매, 검증 안 된 부업이나 투자에 대한 끌림을 조심해야 한다. 앞으로 3개월은 더 버는 것보다 남기는 구조를 만드는 게 먼저다. 돈은 한 번 크게 들어오는 것보다 반복해서 남는 구조가 만들어질 때 진짜 힘이 생긴다.`,
    career: `일 흐름에서는 방향 분산이 가장 크게 보인다. 하고 싶은 것도 많고 살 길을 찾고 싶은 마음도 강한데, 하나로 묶이는 구조가 약하다. 지금은 직업을 바꾸는 것보다 돈이 되는 능력과 반복 가능한 서비스를 먼저 정리해야 한다. 이것저것 다 벌리면 에너지만 빠지고 결과는 흐려질 수 있다.`,
    love: `연애 흐름에서는 상대보다 네 반응 패턴이 더 중요하다. 누가 나를 좋아하느냐보다, 내가 누구 앞에서 불안해지고 흔들리는지를 봐야 한다. 설렘과 불안을 헷갈리면 같은 관계를 반복할 수 있다. 좋은 인연은 마음을 계속 불안하게 만드는 사람이 아니라, 내 일상까지 무너지지 않게 해주는 사람이다.`,
    marriage: `결혼운은 연애운과 다르게 봐야 한다. 같이 웃는 사람보다 같이 생활을 버틸 수 있는 사람이 중요하다. 돈, 가족, 습관, 책임감에서 기준이 맞지 않으면 감정이 좋아도 오래가기 어렵다. 결혼운을 볼 때는 언제 만나는지도 중요하지만, 어떤 사람과 생활 기준이 맞는지가 더 중요하다.`,
    compatibility: `궁합은 좋다 나쁘다가 아니다. 서로 끌리는 이유와 부딪히는 이유가 동시에 있다. 처음에는 다름이 매력으로 보이지만, 시간이 지나면 그 차이가 피로가 될 수 있다. 그래서 관계를 살리려면 표현 방식과 갈등 해결 기준을 맞춰야 한다. 회복 방식이 맞으면 오래 가고, 회복 방식이 안 맞으면 사소한 일도 크게 번진다.`,
    family: `가족관계는 가까워서 더 어렵다. 책임감 때문에 거절하기 어렵고, 서운함이 쌓여도 쉽게 끊어내기 어렵다. 하지만 가족이라고 해서 모든 부탁을 받아야 하는 건 아니다. 가까울수록 선이 있어야 오래 간다. 지금은 정이 없는 게 아니라, 내 감정이 무너지지 않는 선을 만드는 게 필요하다.`,
    partner: `사업파트너 궁합에서는 정과 친분보다 역할과 돈 기준이 먼저다. 좋은 사람이어도 돈을 같이 벌면 다른 얼굴이 나온다. 누가 결정하고, 누가 실행하고, 돈은 어떻게 나눌지 명확해야 한다. 시작 전에 불편한 얘기를 피하면 나중에 더 큰 갈등으로 돌아올 수 있다.`,
    lifeFlow: `인생흐름은 돌아온 시간이 헛된 게 아니라 재료가 되는 흐름이다. 네 인생은 직선형보다 경험을 쌓고 방향을 틀면서 길이 만들어지는 구조에 가깝다. 지금은 과거를 후회하기보다 그것을 돈이 되는 구조로 바꿔야 한다. 늦었다고 느끼는 시점이 오히려 방향을 바꾸기 좋은 전환점일 수 있다.`,
    monthly: `앞으로 12개월은 한 번에 달리는 흐름이 아니다. 움직일 달과 쉬어야 할 달이 나뉜다. 초반에는 정리와 테스트가 중요하고, 중반에는 사람 반응을 봐야 하며, 후반에는 반복 가능한 구조를 만들어야 한다. 좋은 달에 무리하고, 쉬어야 할 달에 억지로 밀면 흐름이 꼬일 수 있다.`,
    premium: `프리미엄 상담은 한 가지 질문을 깊게 파는 흐름이다. 감정만 보면 답이 흐리고, 현실만 보면 마음이 따라오지 않는다. 그래서 네가 지금 왜 흔들리는지, 무엇을 줄이고 무엇을 붙잡아야 하는지를 같이 봐야 한다. 지금 질문의 핵심은 표면의 답보다 반복되는 구조를 확인하는 데 있다.`,
  };

  return `${intro}

[${category.title} 핵심]
${categoryText[categoryId]}

[지금 네가 막히는 진짜 이유]
지금 막힘은 한 가지 이유로만 생긴 게 아니다. 마음은 급한데 기준이 흐리고, 기준이 흐리니까 선택이 자꾸 늦어지고, 선택이 늦어지니까 다시 불안해지는 흐름이 반복된다. 이럴 때는 운이 없는 게 아니라 운을 받을 그릇이 정리되지 않은 상태에 가깝다. 그래서 지금은 뭘 더 추가하기보다 불필요한 것부터 걷어내야 한다.

[조심해야 할 선택]
지금 가장 조심해야 할 건 불안해서 급하게 결정하는 거다. 급하게 시작한 일, 애매하게 붙잡은 사람, 검증 안 된 돈벌이 방식은 처음엔 뭔가 하는 것 같아도 결국 다시 지치게 만들 수 있다. 지금은 큰 선택보다 작은 검증이 먼저다. 특히 남들이 좋다고 하는 방향을 그대로 따라가면 네 흐름과 맞지 않아 오래 버티기 어렵다.

[돈·일·관계에서 먼저 봐야 할 것]
돈은 들어오는 양보다 남는 구조를 봐야 하고, 일은 오래 반복할 수 있는 형태인지 봐야 한다. 관계는 나를 안정시키는 사람인지, 계속 불안하게 만드는 사람인지 구분해야 한다. 이 세 가지가 정리되지 않으면 아무리 좋은 기회가 와도 다시 흔들릴 수 있다.

[앞으로 30일]
앞으로 30일은 정리하는 시간으로 써라. 지출, 관계, 일 방향 중에서 가장 자주 흔들리는 지점을 하나만 고르고 그 부분부터 정리해라. 전부 다 바꾸려고 하면 아무것도 못 바꾼다. 하루에 하나씩만 줄이고, 하나씩만 확인해라. 작은 정리가 쌓이면 흐름이 달라진다.

[앞으로 3개월]
3개월 흐름은 작게 보여주고 반응을 확인하는 쪽이 좋다. 사람에게 보여주고, 돈을 받아보고, 반복 가능한지 확인해야 한다. 머릿속에서만 고민하면 운이 움직이지 않는다. 처음부터 크게 벌리기보다 작은 테스트를 여러 번 하면서 반응이 오는 쪽으로 힘을 모아라.

[실제로 해볼 행동]
첫째, 이번 주 안에 지금 제일 불안한 문제를 종이에 하나만 적어라. 둘째, 그 문제를 해결하기 위해 오늘 할 수 있는 가장 작은 행동을 정해라. 셋째, 돈이든 관계든 일이든 결과가 바로 안 나와도 최소 7일은 같은 방향으로 관찰해라. 운은 갑자기 터지는 것처럼 보여도 사실은 작은 반복이 쌓여서 움직인다.

[운세형 한마디]
${name}, 지금 네가 필요한 건 대단한 확신이 아니다. 오늘 바로 줄일 것 하나, 오늘 바로 시작할 것 하나를 정하는 거다. 운은 생각 속에서 열리는 게 아니라 움직이는 순간부터 반응한다. 그러니까 너무 큰 답을 찾으려고 멈추지 말고, 작게라도 네 흐름을 다시 움직여라.`;
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
      className="h-full w-full object-contain"
      onError={() => setFailed(true)}
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
          <SafeImage
            src={card.image}
            alt={card.title}
            fallback={card.emoji}
          />
        </div>
      </button>

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

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-black text-white">{children}</label>;
}

export default function Page() {
  const [step, setStep] = useState<Step>("home");
  const [categoryId, setCategoryId] = useState<CategoryId>("today");
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paid, setPaid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState("");
  const [aiFull, setAiFull] = useState("");
  const [consultQuestion, setConsultQuestion] = useState("");
  const [consultAiResult, setConsultAiResult] = useState("");
  const [user, setUser] = useState<UserInfo>(emptyUser);
  const [reviewPage, setReviewPage] = useState(1);

  const category = useMemo(() => getCategory(categoryId), [categoryId]);
  const selectedPlanInfo = consultPlans.find((plan) => plan.id === selectedPlan) || consultPlans[1];
  const showPartnerFields = categoryId === "compatibility" || categoryId === "partner" || categoryId === "family";
  const showQuestion = categoryId === "premium" || categoryId === "worry";
  const birthMeta = `${user.year || "----"}년 ${user.month || "--"}월 ${user.day || "--"}일 · ${user.calendar} · ${user.gender}`;
  const featuredCategories = categories.filter((item) => item.featured);
  const normalCategories = categories.filter((item) => !item.featured);
  const reviewPages = 14;
  const reviewsPerPage = 3;
  const visibleReviews = reviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage);

  const goInput = (id: CategoryId) => {
    setCategoryId(id);
    setPaid(false);
    setAiPreview("");
    setAiFull("");
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
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: `guest_${Date.now()}` });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId: `fortune_${Date.now()}`,
        orderName,
        successUrl: window.location.href,
        failUrl: window.location.href,
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
        body: JSON.stringify({ user, categoryTitle: category.title, question: user.question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI 생성 실패");
      }

      setAiPreview(data.preview || fallbackPreview(categoryId, user));
      setAiFull(data.full || data.result || fallbackFull(categoryId, user));
    } catch (error) {
      console.error(error);
      setAiPreview(fallbackPreview(categoryId, user));
      setAiFull(fallbackFull(categoryId, user));
    } finally {
      setAiLoading(false);
    }
  };

  const generateConsultAI = async () => {
    setAiLoading(true);
    setConsultAiResult("");

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { ...user, question: consultQuestion },
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

  const PrivacyBox = () => (
    <label className="flex items-start gap-3 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4 text-left text-white">
      <input
        type="checkbox"
        checked={privacyAgreed}
        onChange={(event) => setPrivacyAgreed(event.target.checked)}
        className="mt-1 h-5 w-5 accent-[#d8a86f]"
      />
      <span>
        <span className="block text-sm font-black text-white">개인정보 수집·이용 동의</span>
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
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2b1908_0%,transparent_36%),radial-gradient(circle_at_bottom,#160d22_0%,transparent_38%)]" />

      <header className="sticky top-0 z-40 bg-black/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-4">
          <button type="button" onClick={() => setStep("home")} className="text-left">
            <div className="text-2xl font-black tracking-[-0.05em] text-[#d8a86f]">운명서재</div>
            <div className="text-[11px] font-black tracking-[0.12em] text-[#b98a52]">듣기 좋은 말보다 지금 필요한 말</div>
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
        <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setMenuOpen(false)}>
          <aside
            className="ml-auto h-full w-[82%] max-w-[360px] overflow-y-auto border-l border-[#7a5b37] bg-[#0d0b0a] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white">전체 메뉴</div>
                <div className="text-sm text-[#c8beb0]">원하는 운세를 선택하세요</div>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="text-3xl text-white">
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
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#7a5b37] bg-black/40 text-2xl">{item.emoji}</span>
                  <span>
                    <span className="block font-black text-[#d8a86f]">{item.title}</span>
                    <span className="text-sm text-[#c8beb0]">{item.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[460px] px-4 pb-24 pt-6">
        {step === "home" && (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[38px] border border-[#7a5b37] bg-[#171717] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.58)]">
              <div className="relative overflow-hidden rounded-[30px] border border-[#7a5b37] bg-black">
                <div className="aspect-[4/5] w-full">
                  <SafeImage src="/characters/bro.png" alt="운세형" fallback="🧑‍💼" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-5">
                  <div className="inline-flex rounded-full border border-[#7a5b37] bg-[#28231e] px-4 py-2 text-xs font-black tracking-[0.1em] text-[#e0b36d]">
                    운세형이 솔직하게 봐준다
                  </div>
                </div>
              </div>

              <h1 className="mt-7 text-[46px] font-black leading-[1.08] tracking-[-0.075em] text-white">
                야, 지금 네 흐름
                <br />
                그냥 넘기면
                <br />
                <span className="text-[#d8a86f]">또 반복된다</span>
              </h1>

              <p className="mt-6 break-keep text-[18px] font-medium leading-[1.8] tracking-[-0.04em] text-[#c8beb0]">
                좋은 말만 해주는 운세가 아닙니다.
                <span className="font-bold text-[#f5efe6]"> 지금 막힌 이유</span>와
                <span className="font-bold text-[#d8a86f]"> 반복되는 패턴</span>을 먼저 무료로 확인해보세요.
              </p>

              <button
                type="button"
                onClick={() => goInput("today")}
                className="mt-8 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-6 py-5 text-[21px] font-black text-white shadow-[0_20px_55px_rgba(216,168,111,0.22)]"
              >
                무료로 내 흐름 먼저 보기
              </button>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">운명서재는 이렇게 봅니다</h2>
              <p className="mt-3 break-keep text-[15px] font-medium leading-7 text-[#c8beb0]">
                음양오행의 균형과 사주의 흐름을 바탕으로,
                <span className="font-bold text-[#f5efe6]"> 타고난 기질</span>,
                <span className="font-bold text-[#d8a86f]"> 현재 막히는 지점</span>,
                그리고 현실에서 바꿀 수 있는 선택을 함께 풀어드립니다.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  ["타고난 기질", "내가 어떤 흐름에 강하고 약한지 봅니다."],
                  ["현재 흐름", "지금 왜 막히는지, 반복되는 패턴을 봅니다."],
                  ["현실 방향", "오늘부터 바꿀 수 있는 선택을 제안합니다."],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4">
                    <div className="text-sm font-black text-[#d8a86f]">{title}</div>
                    <div className="mt-1 text-sm leading-6 text-[#c8beb0]">{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">무료 분석에서 먼저 보여드려요</h2>
              <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">
                부담 없이 먼저 읽어보고, 내 얘기 같다고 느껴지는 지점부터 더 깊게 확인하면 됩니다.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "지금 왜 흐름이 막혔는지",
                  "같은 선택이 반복되는 이유",
                  "오늘 조심해야 할 포인트",
                  "지금 바로 바꿀 수 있는 행동 하나",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d8a86f] text-sm font-black text-black">✓</span>
                    <span className="text-sm font-bold text-[#f5efe6]">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.32)]">
              <div className="rounded-[26px] border border-[#7a5b37] bg-[#1b1612] p-5">
                <div className="inline-flex rounded-full border border-[#d8a86f] bg-black/35 px-4 py-2 text-xs font-black tracking-[0.08em] text-[#e0b36d]">
                  부담은 낮게, 해석은 깊게
                </div>

                <h2 className="mt-5 text-2xl font-black leading-tight tracking-[-0.045em] text-white">
                  처음부터 큰돈 쓰지 않아도 됩니다
                </h2>

                <p className="mt-4 break-keep text-[15px] font-medium leading-7 text-[#c8beb0]">
                  <span className="font-black text-[#d8a86f]">오늘의 흐름은 1,900원부터</span>,
                  재물·연애·직업/사업운처럼 더 깊은 리포트는
                  <span className="font-black text-[#f5efe6]"> 6,900원</span>으로 확인할 수 있습니다.
                </p>

                <p className="mt-3 break-keep text-sm leading-6 text-[#c8beb0]">
                  무료 분석으로 먼저 흐름을 보고, 필요한 경우에만 전체 리포트로 이어서 보세요.
                </p>

                <button
                  type="button"
                  onClick={() => goInput("today")}
                  className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-5 py-4 text-base font-black text-white shadow-[0_16px_38px_rgba(216,168,111,0.18)]"
                >
                  1,900원부터 확인하기 →
                </button>
              </div>
            </section>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2
                    className="text-3xl font-black tracking-[-0.055em]"
                    style={{ color: "#d8a86f" }}
                  >
                    누구에게 물어볼까요?
                  </h2>
                  <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">
                    고민에 따라 보는 관점이 달라집니다. 지금 상황에 맞는 전문가를 선택해보세요.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[#d8a86f] bg-[#241e18] px-2 py-4 text-[11px] font-black leading-tight text-[#e0b36d] [writing-mode:vertical-rl] [text-orientation:upright]">
                  전문가
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {characters.map((card) => (
                  <CharacterCard key={card.id} card={card} onSelect={() => goInput(card.categoryId)} />
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">지금 많이 보는 상담</h2>
              <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">
                처음이라면 아래 4개 중 하나부터 보는 걸 추천해요.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {featuredCategories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goInput(item.id)}
                    className="min-h-[140px] rounded-[24px] border border-[#7a5b37] bg-[#15110d] p-4 text-left transition hover:border-[#e0b36d]"
                  >
                    <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-[#7a5b37] bg-black/45 text-2xl">{item.emoji}</div>
                    <div className="font-black leading-tight text-[#d8a86f]">{item.title}</div>
                    <div className="mt-2 text-sm leading-5 text-[#c8beb0]">{item.subtitle}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-[24px] border border-[#7a5b37] bg-black/25 p-4">
                <div className="mb-3 text-sm font-black text-[#e0b36d]">더 보기</div>
                <div className="grid grid-cols-2 gap-2">
                  {normalCategories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goInput(item.id)}
                      className="rounded-2xl border border-[#7a5b37] bg-[#11100f] px-3 py-3 text-left transition hover:border-[#e0b36d]"
                    >
                      <div className="text-sm font-black text-[#d8a86f]">{item.emoji} {item.title}</div>
                      <div className="mt-1 text-xs leading-4 text-[#c8beb0]">{item.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <div className="mb-4">
                <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">먼저 본 사람들은 이렇게 느꼈어요</h2>
                <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">
                  과하게 포장하지 않고, 지금 필요한 말을 들었다는 후기가 많습니다.
                </p>
                <div className="mt-2 text-sm text-[#e0b36d]">★★★★★ 4.8</div>
              </div>

              <div className="space-y-3">
                {visibleReviews.map((review) => (
                  <div key={`${review.name}-${review.category}-${review.text}`} className="rounded-3xl border border-[#7a5b37] bg-black/35 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-sm font-black text-[#d8a86f]">{review.name} · {review.category}</div>
                      <div className="text-xs text-[#e0b36d]">★★★★★</div>
                    </div>
                    <p className="m-0 text-sm leading-6 text-white">“{review.text}”</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-center gap-2">
                {Array.from({ length: reviewPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setReviewPage(page)}
                    className={cx(
                      "grid h-9 w-9 place-items-center rounded-full border text-sm font-black",
                      reviewPage === page
                        ? "border-[#d8a86f] bg-[#d8a86f] text-black"
                        : "border-[#7a5b37] bg-black/35 text-[#c8beb0]"
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
            <button type="button" onClick={() => setStep("home")} className="text-sm font-bold text-[#c8beb0]">← 홈으로</button>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-5">
              <div className="mb-5 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-3xl border border-[#7a5b37] bg-[#1b1612] text-3xl">{category.emoji}</div>
                <div>
                  <h1 className="text-2xl font-black text-[#d8a86f]">{category.title}</h1>
                  <p className="text-sm text-[#c8beb0]">{category.subtitle}</p>
                </div>
              </div>

              <FieldLabel>분석 메뉴</FieldLabel>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value as CategoryId)} className="mb-4 w-full p-4">
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>

              <FieldLabel>이름 또는 별명</FieldLabel>
              <input value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} placeholder="예: 성국" className="mb-4 w-full p-4" />

              <FieldLabel>생년월일</FieldLabel>
              <div className="mb-4 grid grid-cols-3 gap-2">
                <input value={user.year} onChange={(event) => setUser({ ...user, year: event.target.value })} placeholder="년도" className="p-4 text-center" />
                <input value={user.month} onChange={(event) => setUser({ ...user, month: event.target.value })} placeholder="월" className="p-4 text-center" />
                <input value={user.day} onChange={(event) => setUser({ ...user, day: event.target.value })} placeholder="일" className="p-4 text-center" />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["양력", "음력"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUser({ ...user, calendar: value })}
                    className={cx(
                      "rounded-2xl border p-4 font-black",
                      user.calendar === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-[#7a5b37] bg-[#14110d] text-white"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <FieldLabel>출생 시간</FieldLabel>
              <select value={user.birthTime} onChange={(event) => setUser({ ...user, birthTime: event.target.value })} className="mb-4 w-full p-4">
                {birthTimes.map((time) => (
                  <option key={time} value={time === "모름 / 선택 안 함" ? "" : time}>{time}</option>
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
                      user.gender === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-[#7a5b37] bg-[#14110d] text-white"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {showPartnerFields && (
                <div className="mb-4 rounded-3xl border border-[#7a5b37] bg-[#14110d] p-4">
                  <div className="mb-3 font-black text-[#d8a86f]">상대방 정보</div>
                  <input value={user.partnerName} onChange={(event) => setUser({ ...user, partnerName: event.target.value })} placeholder="상대방 이름 또는 별명" className="mb-3 w-full p-4" />
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <input value={user.partnerYear} onChange={(event) => setUser({ ...user, partnerYear: event.target.value })} placeholder="년도" className="p-4 text-center" />
                    <input value={user.partnerMonth} onChange={(event) => setUser({ ...user, partnerMonth: event.target.value })} placeholder="월" className="p-4 text-center" />
                    <input value={user.partnerDay} onChange={(event) => setUser({ ...user, partnerDay: event.target.value })} placeholder="일" className="p-4 text-center" />
                  </div>
                </div>
              )}

              {showQuestion && (
                <div className="mb-4">
                  <FieldLabel>상담 질문</FieldLabel>
                  <textarea value={user.question} onChange={(event) => setUser({ ...user, question: event.target.value })} placeholder="예: 지금 하는 일을 계속해도 될까요?" className="min-h-32 w-full p-4" />
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
                  setStep("result");
                  setTimeout(() => generateAIResult(), 100);
                }}
                disabled={aiLoading || !privacyAgreed}
                className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-6 py-5 text-lg font-black text-white disabled:opacity-60"
              >
                {aiLoading ? "운세형이 읽는 중..." : privacyAgreed ? "무료 결과 먼저 보기" : "개인정보 동의 후 진행"}
              </button>
            </section>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("input")} className="text-sm font-bold text-[#c8beb0]">← 다시 입력하기</button>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-5">
              <div className="mb-4 rounded-full border border-[#7a5b37] bg-[#241e18] px-4 py-2 text-xs font-black text-[#e0b36d]">무료 분석 결과</div>
              <h1 className="text-3xl font-black leading-tight text-white">{nameOf(user)}의 <span className="text-[#d8a86f]">{category.title}</span> 리포트</h1>
              <p className="mt-2 whitespace-pre-line text-sm text-[#c8beb0]">{birthMeta}</p>
              <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white">{aiPreview || fallbackPreview(categoryId, user)}</p>

              {!paid && (
                <div className="mt-6 rounded-[28px] border border-[#7a5b37] bg-[#1b1612] p-5">
                  <div className="mb-3 text-xl font-black text-[#d8a86f]">여기까지가 무료 분석입니다</div>
                  <p className="text-sm leading-6 text-[#c8beb0]">
                    지금 흐름은 확인됐고, 다음 리포트에서는 앞으로 30일 흐름과 돈·일·관계에서 조심할 선택까지 이어서 봅니다.
                  </p>
                  <div className="mt-4 rounded-2xl border border-[#7a5b37] bg-black/45 p-4">
                    <div className="text-sm font-black text-[#e0b36d]">전체 리포트에서 더 보는 내용</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold text-white">
                      <div>✓ 앞으로 30일 흐름</div>
                      <div>✓ 돈·일·관계에서 조심할 선택</div>
                      <div>✓ 지금 바꾸면 좋은 행동</div>
                      <div>✓ 3개월 안에 달라질 포인트</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => requestTossPayment(`${category.title} 전체 리포트`, category.price)}
                    className="mt-5 w-full rounded-full border border-[#d8a86f] bg-gradient-to-r from-[#d8a86f] to-[#b78343] px-5 py-4 text-base font-black text-white"
                  >
                    전체 리포트 열기 {category.price.toLocaleString()}원
                  </button>

                  <button type="button" onClick={() => setPaid(true)} className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 text-sm font-black text-black">
                    테스트용 전체 보기
                  </button>
                </div>
              )}
            </section>

            {paid && (
              <section className="space-y-4">
                <article className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
                  <div className="mb-3 rounded-full border border-[#7a5b37] bg-[#241e18] px-4 py-2 text-center text-xs font-black text-[#e0b36d]">전체 리포트 오픈</div>
                  <h2 className="mb-3 text-xl font-black text-[#d8a86f]">운세형의 전체 맞춤 리포트</h2>
                  <p className="whitespace-pre-line text-[17px] leading-8 text-white">{aiFull || fallbackFull(categoryId, user)}</p>
                </article>

                <button type="button" onClick={() => setStep("consult")} className="w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 font-black text-black">
                  1:1로 더 깊게 물어보기
                </button>
              </section>
            )}
          </div>
        )}

        {step === "consult" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("home")} className="text-sm font-bold text-[#c8beb0]">← 홈으로</button>

            <section className="rounded-[34px] border border-[#7a5b37] bg-[#111111] p-6">
              <h1 className="text-3xl font-black leading-tight text-white">혼자 오래 고민한 문제,<br /><span className="text-[#d8a86f]">운세형이 길게 풀어준다</span></h1>
              <p className="mt-4 text-base leading-7 text-[#c8beb0]">질문 중심으로 감정, 현실, 선택지를 같이 풀어주는 상담형 리포트입니다.</p>
            </section>

            <section className="space-y-3">
              {consultPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cx(
                    "w-full rounded-[28px] border p-5 text-left",
                    selectedPlan === plan.id ? "border-[#d8a86f] bg-[#241e18]" : "border-[#7a5b37] bg-[#111111]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-[#d8a86f]">{plan.title}</div>
                      <div className="mt-1 text-sm leading-5 text-[#c8beb0]">{plan.desc}</div>
                    </div>
                    <div className="text-lg font-black text-[#e0b36d]">{plan.price.toLocaleString()}원</div>
                  </div>
                </button>
              ))}
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-xl font-black text-[#d8a86f]">상담 질문 작성</h2>
              <textarea value={consultQuestion} onChange={(event) => setConsultQuestion(event.target.value)} placeholder="지금 가장 답답한 고민을 적어주세요." className="mt-4 min-h-36 w-full p-4" />
              <div className="mt-4"><PrivacyBox /></div>

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
                  <h3 className="text-lg font-black text-[#d8a86f]">상담 미리보기</h3>
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-white">{consultAiResult}</p>
                </article>
              )}

              <button type="button" onClick={() => requestTossPayment(selectedPlanInfo.title, selectedPlanInfo.price)} className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-6 py-4 text-sm font-black text-black">
                토스 결제창 테스트
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
