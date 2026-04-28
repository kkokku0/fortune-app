"use client";

import { useMemo, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

type Step = "home" | "input" | "result" | "consult" | "consultResult";
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
};

type Character = {
  id: string;
  title: string;
  badge: string;
  image: string;
  emoji: string;
  subtitle: string;
  quote: string;
  chips: string[];
  categoryId: CategoryId;
};

const categories: Category[] = [
  { id: "today", title: "오늘의 운세", subtitle: "오늘 뭐 조심해야 하는지 딱 봐줄게", emoji: "🌙", price: 1900 },
  { id: "worry", title: "고민풀이", subtitle: "그 고민 계속 들고 가면 더 꼬인다", emoji: "✨", price: 3900 },
  { id: "money", title: "재물운", subtitle: "돈이 왜 안 남는지 먼저 까보자", emoji: "💰", price: 6900 },
  { id: "career", title: "직업/사업운", subtitle: "지금 일 계속해도 되는지 봐줄게", emoji: "💼", price: 6900 },
  { id: "love", title: "연애운", subtitle: "그 사람 마음보다 네 패턴이 먼저다", emoji: "❤️", price: 6900 },
  { id: "marriage", title: "결혼운", subtitle: "설렘 말고 같이 살아도 되는 사람인지", emoji: "💍", price: 6900 },
  { id: "compatibility", title: "궁합풀이", subtitle: "왜 끌리고 왜 싸우는지 딱 갈라줌", emoji: "👥", price: 6900 },
  { id: "family", title: "가족관계 풀이", subtitle: "가족이라 더 힘든 그 문제 봐줄게", emoji: "🏠", price: 6900 },
  { id: "partner", title: "사업파트너 궁합", subtitle: "같이 돈 벌 사람인지 봐줄게", emoji: "🤝", price: 12900 },
  { id: "lifeFlow", title: "인생흐름 대운", subtitle: "네 인생이 왜 돌아왔는지 큰 흐름 보기", emoji: "👑", price: 12900 },
  { id: "monthly", title: "12개월 상세운세", subtitle: "움직일 달과 참아야 할 달", emoji: "🗓️", price: 12900 },
  { id: "premium", title: "AI 프리미엄 상담", subtitle: "오래 붙잡은 고민을 길게 풀어줌", emoji: "🔮", price: 29000 },
];

const characters: Character[] = [
  {
    id: "bro",
    title: "운세형의 현실 사주",
    badge: "BEST",
    image: "/characters/bro.png",
    emoji: "🧑‍💼",
    subtitle: "돈 · 일 · 방향 전문",
    quote: "야, 지금 네가 막힌 이유부터 까보자.",
    chips: ["재물운", "직업운", "인생 방향"],
    categoryId: "career",
  },
  {
    id: "grandma",
    title: "초옥 할매의 인생 대운",
    badge: "NEW",
    image: "/characters/grandma.png",
    emoji: "👵",
    subtitle: "인생흐름 · 대운 · 가족",
    quote: "니 인생 왜 돌아왔는지 내가 딱 짚어줄게.",
    chips: ["인생흐름", "대운", "가족운"],
    categoryId: "lifeFlow",
  },
  {
    id: "love",
    title: "민지의 연애 상담소",
    badge: "HOT",
    image: "/characters/love.png",
    emoji: "💘",
    subtitle: "연애 · 재회 · 궁합 전문",
    quote: "그 사람 마음보다 네가 왜 흔들리는지가 먼저야.",
    chips: ["연애운", "재회", "궁합"],
    categoryId: "love",
  },
  {
    id: "money",
    title: "돈맥 보는 재물 상담",
    badge: "RICH",
    image: "/characters/money.png",
    emoji: "💰",
    subtitle: "재물운 · 부업 · 사업 감각",
    quote: "돈이 없는 게 아니라 새는 구멍이 먼저다.",
    chips: ["돈운", "부업운", "사업운"],
    categoryId: "money",
  },
];

const reviews = [
  ["직업/사업운", "‘방향만 많고 구조가 없다’는 말에 뜨끔했어요. 그래서 하나만 정해서 바로 판매글 올렸습니다."],
  ["재물운", "돈이 왜 안 모이는지 현실적으로 말해줘서 지출부터 정리했어요. 카드값 보는 눈이 달라졌습니다."],
  ["연애운", "그 사람 문제가 아니라 내 불안 패턴이라는 말이 너무 맞았어요. 괜히 계속 확인하려던 걸 멈췄습니다."],
  ["인생흐름", "내가 왜 계속 돌아왔는지 설명해주는데 이상하게 위로가 됐어요. 늦은 게 아니라 방향을 찾는 중이라는 말이 남았어요."],
  ["궁합풀이", "좋다 나쁘다가 아니라 왜 끌리고 왜 싸우는지 말투까지 풀어줘서 상담받는 느낌이었어요."],
  ["결혼운", "결혼은 감정이 아니라 생활이라는 말이 계속 남았어요. 진짜 현실적으로 봐줘요."],
  ["고민풀이", "크게 하지 말고 작게 테스트하라는 말이 현실적이었어요. 바로 7일만 해보기로 정했습니다."],
  ["12개월 운세", "움직일 달과 쉬어야 할 달을 나눠주니까 계획 세우기 좋았어요."],
  ["사업파트너", "친하다고 같이 하면 안 된다는 말 듣고 역할이랑 돈 기준부터 적었습니다."],
  ["오늘의 운세", "짧은 점괘가 아니라 오늘 조심할 말과 행동을 알려줘서 계속 보게 됩니다."],
  ["재물운", "돈이 없는 게 아니라 새고 있다는 말이 너무 맞아서 자동결제부터 싹 봤어요."],
  ["프리미엄 상담", "긴 고민을 진짜 친한 형처럼 풀어줘서 결제한 게 아깝지 않았습니다."],
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

const consultPlans = [
  { id: "basic", title: "일반 상담권", price: 19000, desc: "고민 1개 · 현실적인 선택 방향 풀이" },
  { id: "premium", title: "프리미엄 상담권", price: 29000, desc: "깊은 고민 1개 · 긴 상담 리포트" },
  { id: "couple", title: "궁합 상담권", price: 39000, desc: "두 사람 정보 기반 관계/궁합 집중 풀이" },
];

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

function cx(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

function getCategory(id: CategoryId) {
  return categories.find((item) => item.id === id) || categories[0];
}

function nameOf(user: UserInfo) {
  return user.name.trim() || "너";
}

function previewText(categoryId: CategoryId, user: UserInfo) {
  const name = nameOf(user);

  const map: Record<CategoryId, string> = {
    today: `야 ${name}, 오늘은 그냥 대충 넘기면 조금 아까운 날이다.

오늘 흐름은 크게 터지는 운이라기보다, 작은 선택 하나가 하루 분위기를 바꾸는 쪽에 가깝다. 말 한마디, 연락 하나, 돈 쓰는 순간 하나가 생각보다 크게 이어질 수 있어.

특히 오늘은 감정이 올라온 상태에서 바로 결정하면 손해 보기 쉽다. 괜히 욱해서 말하거나, 충동적으로 결제하거나, 별일 아닌 일에 자존심 세우면 나중에 “아 그때 참을걸” 하는 흐름이 나온다.

반대로 오늘 잘 잡아야 할 건 미뤄둔 정리다. 답장, 돈 정리, 해야 할 일 목록, 찝찝했던 약속 같은 것들. 이런 작은 것 하나 정리하면 오늘 운이 훨씬 가볍게 풀린다.

그러니까 오늘은 큰 결심보다 작은 정리가 맞다. 대단한 변화보다 흐름을 막고 있던 작은 돌 하나를 치우는 날이라고 보면 된다.`,

    worry: `야 ${name}, 지금 네 고민은 단순히 선택을 못 해서 생긴 게 아니다.

사실 네 안에서는 이미 어느 정도 답을 알고 있을 가능성이 크다. 근데 그 선택을 했을 때 잃는 게 있을까 봐, 혹은 실패하면 또 시간만 날릴까 봐 자꾸 멈추는 거다.

지금 이 고민은 “뭘 해야 하지?”의 문제가 아니라 “내가 이걸 감당할 수 있을까?”의 문제에 가깝다. 그래서 누가 옆에서 좋은 말 몇 마디 해준다고 쉽게 풀리는 고민이 아니다.

현실 기준으로 잘라봐야 한다. 돈이 되는지, 시간이 되는지, 체력이 버티는지, 반복 가능한지, 그리고 실제 사람 반응이 있는지. 이 다섯 가지를 안 보고 감정만 따라가면 또 같은 자리로 돌아온다.

솔직히 지금은 더 고민한다고 답이 선명해지는 구간이 아니다. 작게 해보고, 반응 보고, 그다음 판단해야 하는 구간이다.`,

    money: `야 ${name}, 요즘 돈 문제 좀 이상하지 않냐.

아예 돈이 안 들어오는 건 아닌데, 들어와도 이상하게 남지 않고 어디론가 계속 빠지는 느낌. 월급이든 부업이든 뭔가 들어오긴 하는데 막상 지나고 보면 손에 남는 게 별로 없고, “내가 그렇게 많이 썼나?” 싶은 순간이 있었을 거다.

근데 이건 단순히 네가 소비를 못 해서가 아니다. 지금 네 돈운은 돈을 더 많이 버는 것보다 먼저 돈이 새는 구멍을 막아야 열리는 흐름이다.

솔직히 지금 상태에서 무작정 부업을 하나 더 늘리거나, 남들이 좋다는 투자에 급하게 들어가면 돈이 늘기보다 피로만 늘 가능성이 크다.

문제는 대부분 여기서 착각한다는 거다. “더 벌면 해결되겠지”라고 생각하는데, 지금은 더 버는 것보다 어디서 새는지 찾는 게 먼저다.

지금 네 돈운은 큰돈 한 방보다 작은 돈이 반복해서 들어오는 구조에 더 맞다. 그러려면 먼저 가격표, 판매글, 서비스 구조처럼 돈이 들어올 통로를 만들어야 한다.`,

    career: `야 ${name}, 요즘 일 쪽으로 계속 애매하지 않았냐.

열심히는 하는데 결과가 안 붙고, 뭔가 새로 해야 할 것 같은데 어디서부터 움직여야 할지 애매한 느낌. 머리로는 이것도 해볼까, 저것도 해볼까 계속 떠오르는데 막상 하나를 붙잡고 밀고 나가려면 자꾸 힘이 빠지는 상태일 수 있다.

이건 네가 게을러서가 아니다. 지금 네 직업운은 “더 열심히”가 아니라 “어디에 힘을 몰아야 하는지”가 더 중요한 시기다.

방향이 너무 많으면 운도 흩어진다. 지금은 모든 가능성을 다 들고 가는 게 아니라, 돈이 될 가능성이 있는 것 하나를 골라 작게 검증해야 한다.

솔직히 말하면, 지금 네가 제일 조심해야 할 건 또 새로운 걸 찾다가 아무것도 끝까지 못 밀고 가는 패턴이다.

지금은 아이디어보다 실행 증거가 필요하다. 누가 돈을 낼지, 누가 문의할지, 누가 다시 찾을지 확인해야 한다.`,

    love: `야 ${name}, 요즘 마음이 좀 복잡하지 않냐.

누군가는 계속 생각나고, 누군가는 정리해야 할 것 같은데 마음이 딱 끊기지는 않는 상태. 연락 하나에 기분이 흔들리고, 별말 아닌 말에도 괜히 의미를 찾게 되는 흐름이 있었을 수 있다.

근데 지금 연애운에서 중요한 건 “누가 나를 좋아하냐”보다 “내가 누구 때문에 계속 불안해지냐”다.

사람은 좋아도 관계가 나를 계속 소모시키면 그건 인연이 아니라 미련일 수 있다. 지금 네 흐름에는 정리해야 할 감정과 남겨도 되는 감정이 같이 떠 있다.

여기서 기준을 못 잡으면 같은 사람, 비슷한 말투, 비슷한 패턴에 또 흔들릴 가능성이 크다.

진짜 인연은 너를 계속 시험 보게 만들지 않는다. 설렘은 있어도 불안만 반복된다면 그건 한 번 멈춰서 봐야 한다.`,

    marriage: `야 ${name}, 결혼운은 연애운하고 완전히 다르게 봐야 한다.

연애는 설렘으로 버틸 수 있지만, 결혼은 생활로 버텨야 한다. 지금 네 결혼운에서 중요한 건 “좋아하는 사람이 있냐”보다 “같이 살아도 무너지지 않을 기준이 있냐”다.

감정은 있는데 돈 이야기, 가족 이야기, 생활 습관 이야기를 피하고 있다면 그건 결혼운이 좋아도 나중에 흔들릴 수 있다.

결혼 인연은 화려하게 오는 경우보다, 의외로 현실적인 안정감을 주는 사람 쪽으로 들어올 가능성이 크다. 말은 적어도 행동이 꾸준한 사람, 감정적으로 흔들릴 때 같이 무너지는 사람이 아니라 중심을 잡아주는 사람이 더 맞다.

근데 여기서 착각하면 안 된다. 외롭다고 결혼을 생각하면 관계가 무거워지고, 불안해서 붙잡으면 나중에 더 큰 갈등으로 돌아온다.`,

    compatibility: `야 ${name}, 이 사람하고 그냥 좋다 나쁘다로 끝낼 관계는 아닌 것 같다.

끌리는 이유도 분명 있고, 동시에 부딪히는 이유도 분명해. 처음에는 서로 다른 점이 매력으로 느껴졌을 가능성이 크다. 그런데 시간이 지나면서 바로 그 차이가 답답함으로 바뀌는 흐름이 보인다.

문제는 둘 중 누가 나쁘냐가 아니다. 서로 반응하는 방식이 달라서 같은 상황도 완전히 다르게 받아들이는 거다.

한 사람은 확인받고 싶어 하고, 한 사람은 시간을 두고 정리하려 한다면, 둘 다 상처받을 수 있다.

이 관계는 감정만으로 밀어붙이면 흔들리고, 기준을 세우면 오히려 오래 갈 수 있다. 중요한 건 좋아하는 마음보다 싸운 뒤 회복하는 방식이다.`,

    family: `야 ${name}, 가족관계는 남보다 더 어렵다.

왜냐면 멀어지기도 어렵고, 그렇다고 계속 가까이 있기엔 상처가 쌓이기 쉽거든. 지금 가족관계 운에서 보이는 핵심은 책임감과 서운함이 같이 있다는 거다.

너는 가족 안에서 분위기를 살피거나, 누가 힘들어 보이면 괜히 마음이 무거워지는 역할을 맡았을 가능성이 있다. 근데 그게 오래되면 어느 순간 “왜 나만 신경 쓰지?”라는 마음이 올라온다.

가족이라고 해서 모든 부탁을 다 받아야 하는 건 아니다. 가까운 사이일수록 오히려 선이 필요하다.

돈 이야기, 연락 빈도, 간섭의 범위, 부탁의 기준을 정하지 않으면 같은 감정이 계속 반복된다.`,

    partner: `야 ${name}, 사업파트너 궁합은 일반 궁합보다 훨씬 냉정하게 봐야 한다.

사람이 좋아도 같이 돈 벌면 완전히 다른 문제가 생긴다. 지금 이 관계에서 중요한 건 서로 친하냐가 아니라, 역할이 겹치지 않고 돈 기준이 명확하냐는 거다.

한 사람은 아이디어를 내고, 한 사람은 정리와 관리가 된다면 꽤 괜찮은 조합이 될 수 있다. 근데 둘 다 주도권을 잡으려 하거나, 돈 이야기를 미루면 나중에 관계가 틀어질 가능성이 크다.

사업에서 제일 위험한 말이 “우리 사이에 뭘 그렇게까지 해”다. 정 때문에 시작하고, 돈 때문에 끝나는 경우가 정말 많다.

이 관계는 감정보다 계약, 역할, 수익 배분 기준이 먼저다.`,

    lifeFlow: `야 ${name}, 인생흐름 대운은 오늘 내일 운세처럼 보면 안 된다.

이건 네 인생이 어떤 방식으로 흘러왔고, 앞으로 어떤 방향으로 힘이 붙는지를 보는 거다. 너는 직선으로 쭉 가는 타입이라기보다, 돌아가고 부딪히고 다시 방향을 잡으면서 길이 만들어지는 흐름에 가깝다.

그래서 남들보다 늦는 것처럼 느껴지는 순간이 있었을 수 있다. 근데 그 시간이 전부 헛된 건 아니다.

사람 보는 눈, 돈에 대한 감각, 맞지 않는 일을 걸러내는 기준이 뒤늦게 강해지는 타입일 수 있다.

지금 중요한 건 과거에 뭐가 늦었냐가 아니라, 앞으로 10년을 어떤 구조로 가져갈 거냐는 거다.

여기서 방향을 잘못 잡으면 몸만 바쁘고 결과가 없는 시간이 반복될 수 있다.`,

    monthly: `야 ${name}, 앞으로 12개월은 그냥 흘려보내면 좀 아깝다.

어떤 달은 움직여야 하고, 어떤 달은 절대 무리하면 안 되는 흐름이 있다. 지금 네가 필요한 건 “올해 운이 좋다/나쁘다” 같은 말이 아니다.

언제 보여줘야 하는지, 언제 돈을 아껴야 하는지, 언제 사람을 조심해야 하는지 그 타이밍을 아는 게 더 중요하다.

특히 앞으로 몇 달은 작은 선택 하나가 뒤에 꽤 길게 이어질 수 있다. 잘 움직이면 기회가 되고, 대충 넘기면 또 비슷한 고민이 반복된다.

월별 흐름은 그냥 재미로 보는 게 아니라, 힘을 줄 달과 힘을 뺄 달을 구분하는 지도에 가깝다.`,

    premium: `야 ${name}, 프리미엄 상담은 그냥 운세 보는 느낌으로 보면 아깝다.

이건 네가 지금 갖고 있는 고민 하나를 중심으로, 감정이 왜 꼬였는지와 현실적으로 뭘 해야 하는지를 같이 보는 거다.

지금 네가 답답한 건 운이 없어서라기보다, 선택지가 너무 많거나 반대로 하나밖에 안 보인다고 느끼기 때문일 수 있다.

사람은 불안하면 자꾸 급한 선택을 한다. 돈이 급하면 검증 안 된 일에 뛰어들고, 외로우면 애매한 사람을 붙잡고, 일이 답답하면 또 새로운 것만 찾는다.

근데 그렇게 움직이면 잠깐은 뭔가 하는 것 같아도 결국 같은 자리로 돌아오기 쉽다.

프리미엄 상담에서는 네 질문을 기준으로 무엇을 줄이고, 무엇을 붙잡고, 앞으로 3개월 동안 어떻게 움직여야 하는지를 더 깊게 봐야 한다.`,
  };

  return `${map[categoryId]}

그래도 너무 겁먹을 필요는 없다. 흐름이 꼬였다는 건, 반대로 말하면 어디 하나만 제대로 풀어도 전체가 움직일 수 있다는 뜻이기도 하다.

지금 네 운에서 중요한 건 대단한 결심이 아니다. 오늘 바로 바꿀 수 있는 작은 선택 하나, 지금 끊어야 할 습관 하나, 더 이상 붙잡지 말아야 할 사람이나 방향 하나를 확인하는 거다.

특히 최근에 이런 느낌이 있었다면 그냥 넘기면 안 된다.

✔ 생각은 많은데 실행이 자꾸 밀린다
✔ 돈이 들어와도 이상하게 남지 않는다
✔ 사람 관계에서 같은 패턴으로 계속 피곤하다
✔ 뭘 해야 할지 알 것 같은데 몸이 안 움직인다
✔ 새로운 걸 찾는데 막상 하나도 끝까지 못 간다

이 중 하나라도 해당되면 지금은 운이 없는 게 아니라, 방향을 다시 잡아야 하는 시기다.

문제는 여기서 대부분 잘못 움직인다는 거다.

불안하니까 급하게 시작하고, 외로우니까 애매한 사람을 붙잡고, 돈이 급하니까 검증 안 된 선택에 돈을 쓰고, 답답하니까 또 새로운 것만 찾는다.

그렇게 하면 잠깐은 움직이는 것 같아도 결국 다시 원점으로 돌아온다.

근데 지금 네 흐름에는 분명히 하나의 실마리가 있다.

그걸 잡으면 앞으로 30일에서 3개월 사이에 체감이 달라질 수 있다.

👉 여기서부터가 진짜 중요한 얘기다.
👉 지금 네가 절대 하면 안 되는 선택이 하나 있다.
👉 그리고 반대로, 지금 바로 작게 시작해야 하는 방향도 하나 있다.
👉 이걸 모르고 계속 가면 같은 고민을 몇 달 더 반복할 수 있다.`;
}

function sectionsFor(categoryId: CategoryId, user: UserInfo) {
  const name = nameOf(user);
  const common = [
    { title: "지금 흐름", body: `야 ${name}, 지금은 더 고민한다고 풀리는 구간이 아니다. 기준을 다시 잡아야 하는 시기다.` },
    { title: "조심할 선택", body: "불안해서 급하게 시작하는 선택, 외로워서 애매한 사람을 붙잡는 선택, 돈이 급해서 검증 안 된 일에 뛰어드는 선택은 조심해야 한다." },
    { title: "해야 할 행동", body: "오늘 바로 할 수 있는 작은 테스트 하나를 정해라. 작게 보여주고, 반응을 보고, 그 반응이 오는 쪽에 힘을 줘야 한다." },
  ];

  if (categoryId === "money") {
    return [
      { title: "돈이 안 남는 이유", body: `야 ${name}, 지금 돈운은 버는 양보다 새는 구멍이 더 크게 보인다.` },
      { title: "3개월 돈 흐름", body: "첫 달은 지출 정리, 둘째 달은 작은 판매 테스트, 셋째 달은 반복 수익 구조 만들기가 좋다." },
      { title: "돈맥 한마디", body: "더 벌 생각보다 먼저 남기는 구조부터 잡아라." },
    ];
  }

  if (categoryId === "lifeFlow") {
    return [
      { title: "인생 전체 흐름", body: `야 ${name}, 네 인생은 직선보다 돌아가며 길이 만들어지는 흐름이다.` },
      { title: "전환점", body: "지금부터는 남이 정해준 길보다 네 경험을 수익 구조로 바꾸는 쪽에 힘이 붙는다." },
      { title: "앞으로 10년", body: "맞지 않는 일과 사람을 줄이고, 반복 가능한 구조를 만들어야 한다." },
    ];
  }

  if (categoryId === "love" || categoryId === "compatibility") {
    return [
      { title: "감정 흐름", body: `야 ${name}, 지금은 상대 마음보다 네가 왜 흔들리는지를 먼저 봐야 한다.` },
      { title: "관계의 핵심", body: "설렘인지 불안인지 구분해야 한다. 불안을 사랑으로 착각하면 같은 패턴이 반복된다." },
      { title: "관계 조언", body: "애매하게 붙잡는 사람보다 행동으로 안정감을 주는 사람을 봐야 한다." },
    ];
  }

  return common;
}

function buildReport(user: UserInfo, categoryId: CategoryId) {
  const category = getCategory(categoryId);
  const birth = user.year && user.month && user.day ? `${user.year}년 ${user.month}월 ${user.day}일` : "생년월일 미입력";
  const partnerBirth = user.partnerYear && user.partnerMonth && user.partnerDay ? `${user.partnerYear}년 ${user.partnerMonth}월 ${user.partnerDay}일` : "상대 생년월일 미입력";
  const showPartner = categoryId === "compatibility" || categoryId === "family" || categoryId === "partner";

  return {
    headline: `${nameOf(user)}의 ${category.title} 리포트`,
    meta: `${birth} · ${user.calendar} · ${user.gender}${user.birthTime ? ` · ${user.birthTime}` : ""}${showPartner ? `
상대: ${user.partnerName || "상대방"} · ${partnerBirth}` : ""}`,
    preview: previewText(categoryId, user),
    sections: sectionsFor(categoryId, user),
  };
}

function CharacterCardView({ card, onSelect }: { card: Character; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full overflow-hidden rounded-[24px] border border-[#d8a86f]/25 bg-black shadow-xl transition hover:-translate-y-1 hover:border-[#d8a86f]/80"
    >
      <div className="relative aspect-[3/5.6] w-full overflow-hidden bg-black">
        <img
          src={card.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-xl"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <div className="absolute inset-0 bg-black/35" />

        <img
          src={card.image}
          alt={card.title}
          className="relative z-10 h-full w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <div className="absolute inset-0 -z-10 grid place-items-center bg-gradient-to-br from-[#2b1b10] via-[#151018] to-black p-5 text-center">
          <div className="text-5xl">{card.emoji}</div>
          <div className="mt-3 text-sm font-black leading-tight text-white">{card.title}</div>
        </div>
      </div>

      <div className="border-t border-[#d8a86f]/20 bg-[#d8a86f] px-2 py-1 text-center text-xs font-black text-black">
        물어보기 →
      </div>
    </button>
  );
}

export default function Page() {
  const [step, setStep] = useState<Step>("home");
  const [categoryId, setCategoryId] = useState<CategoryId>("today");
  const [paid, setPaid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [consultQuestion, setConsultQuestion] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [consultAiResult, setConsultAiResult] = useState("");
  const [user, setUser] = useState<UserInfo>(emptyUser);

  const category = getCategory(categoryId);
  const report = useMemo(() => buildReport(user, categoryId), [user, categoryId]);
  const currentPlan = consultPlans.find((plan) => plan.id === selectedPlan) || consultPlans[1];
  const showPartnerFields = categoryId === "compatibility" || categoryId === "partner" || categoryId === "family";
  const showQuestion = categoryId === "premium" || categoryId === "worry";

  const goInput = (id: CategoryId) => {
    setCategoryId(id);
    setPaid(false);
    setMenuOpen(false);
    setAiResult("");
    setStep("input");
  };

  const requestTossPayment = async (orderName: string, amount: number) => {
    if (!privacyAgreed) {
      alert("개인정보 수집·이용에 동의해야 결제를 진행할 수 있습니다.");
      return;
    }

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      alert("토스 클라이언트 키가 없습니다.");
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
    setAiResult("");
    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, categoryTitle: category.title, question: user.question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 생성 실패");
      setAiResult(data.result || "");
    } catch (error) {
      console.error(error);
      setAiResult("AI 결과를 불러오지 못했습니다. API 키, route.ts, 서버 재시작 상태를 확인해주세요.");
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
        body: JSON.stringify({ user: { ...user, question: consultQuestion }, categoryTitle: currentPlan.title, question: consultQuestion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 생성 실패");
      setConsultAiResult(data.result || "");
    } catch (error) {
      console.error(error);
      setConsultAiResult("AI 상담 결과를 불러오지 못했습니다. API 키와 서버 상태를 확인해주세요.");
    } finally {
      setAiLoading(false);
    }
  };

  const PrivacyBox = () => (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
      <label className="flex items-start gap-3 text-left">
        <input type="checkbox" checked={privacyAgreed} onChange={(event) => setPrivacyAgreed(event.target.checked)} className="mt-1 h-5 w-5 accent-[#d8a86f]" />
        <span>
          <span className="block text-sm font-black text-[#d8a86f]">개인정보 수집·이용 동의</span>
          <span className="mt-1 block text-xs leading-5 text-white/55">운세 분석과 상담 리포트 생성을 위해 이름/별명, 생년월일, 성별, 출생시간, 상담 질문을 수집·이용합니다.</span>
        </span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070607] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#4b2b0b_0%,transparent_35%),radial-gradient(circle_at_bottom,#1d1235_0%,transparent_35%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-4">
          <button type="button" onClick={() => setStep("home")} className="text-left">
            <div className="text-2xl font-black tracking-tight">운명서재</div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-[#d8a86f]">듣기 좋은 말보다 지금 필요한 말</div>
          </button>
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xl">☰</button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setMenuOpen(false)}>
          <aside className="ml-auto h-full w-[82%] max-w-[360px] overflow-y-auto bg-[#111] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black">전체 메뉴</div>
                <div className="text-sm text-white/40">원하는 운세를 선택하세요</div>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="text-3xl text-white/70">×</button>
            </div>
            <div className="space-y-3">
              {categories.map((item) => (
                <button key={item.id} type="button" onClick={() => goInput(item.id)} className="flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d8a86f]/20 text-2xl">{item.emoji}</span>
                  <span>
                    <span className="block font-black">{item.title}</span>
                    <span className="text-sm text-white/45">{item.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[460px] px-5 pb-24 pt-6">
        {step === "home" && (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-6 shadow-2xl">
              <div className="mb-5 inline-flex rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-4 py-2 text-xs font-black tracking-[0.18em] text-[#d8a86f]">운세형이 솔직하게 봐준다</div>
              <h1 className="text-4xl font-black leading-tight tracking-tight">야, 지금 네 흐름<br />그냥 넘기면<br />또 반복된다</h1>
              <p className="mt-5 text-lg leading-8 text-white/65">좋은 말만 해주는 운세가 아닙니다. 친한 형처럼 솔직하게, 지금 왜 막혔는지와 뭘 먼저 바꿔야 하는지 길게 풀어드립니다.</p>
              <button type="button" onClick={() => goInput("today")} className="mt-7 w-full rounded-full bg-[#d8a86f] px-6 py-5 text-lg font-black text-black shadow-[0_18px_40px_rgba(216,168,111,0.25)]">운세형한테 지금 흐름 물어보기</button>
              <button type="button" onClick={() => setStep("consult")} className="mt-3 w-full rounded-full border border-[#d8a86f]/40 bg-black/30 px-6 py-5 text-lg font-black text-[#d8a86f]">1:1 운세 상담권 보기</button>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black">누구한테 볼래?</h2>
                  <p className="mt-2 text-sm text-[#d8a86f] font-bold">지금 네 상황, 이미 답은 나와있다</p>
                  <p className="mt-1 text-sm text-white/45">누구한테 물어보느냐에 따라 답이 달라진다</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-3 py-2 text-xs font-black text-[#d8a86f]">AI 상담 캐릭터</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {characters.map((card) => (
                  <CharacterCardView key={card.id} card={card} onSelect={() => goInput(card.categoryId)} />
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-2xl font-black">운세 카테고리</h2>
              <p className="mt-1 text-sm text-white/45">지금 네 상황, 이미 답은 나와있다. 어디를 봐야 할지만 고르면 된다.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {categories.map((item) => (
                  <button key={item.id} type="button" onClick={() => goInput(item.id)} className="min-h-[142px] rounded-[26px] border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-[#d8a86f]/70">
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#d8a86f]/20 text-2xl">{item.emoji}</div>
                    <div className="font-black leading-tight">{item.title}</div>
                    <div className="mt-2 text-sm leading-5 text-white/45">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 rounded-3xl border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-4">
                <div className="text-lg font-black text-[#d8a86f]">오늘 처음이면 무료로 먼저 봐도 된다</div>
                <p className="mt-2 text-sm leading-6 text-white/60">근데 무료만 보고 끝내지 마라. 진짜 중요한 건 마지막에 나오는 “지금 피해야 할 선택”이다.</p>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black">먼저 본 사람들</h2>
                <span className="text-sm text-[#d8a86f]">★★★★★ 4.8</span>
              </div>
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <div key={`${review[0]}-${index}`} className="rounded-3xl bg-black/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-[#d8a86f]">★★★★★</div>
                      <div className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/45">{review[0]}</div>
                    </div>
                    <p className="m-0 text-sm leading-6 text-white/65">“{review[1]}”</p>
                    <div className="mt-2 text-xs text-white/30">사용자 {index + 1}***</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === "input" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("home")} className="text-sm font-bold text-white/45">← 홈으로</button>
            <section className="rounded-[34px] border border-white/10 bg-white/[0.055] p-5">
              <div className="mb-5 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#d8a86f]/20 text-3xl">{category.emoji}</div>
                <div>
                  <h1 className="text-2xl font-black">{category.title}</h1>
                  <p className="text-sm text-white/45">{category.subtitle}</p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-black text-white/70">분석 메뉴</label>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value as CategoryId)} className="mb-4 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none">
                {categories.map((item) => <option key={item.id} value={item.id} className="bg-[#111]">{item.title}</option>)}
              </select>

              <label className="mb-2 block text-sm font-black text-white/70">이름 또는 별명</label>
              <input value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} placeholder="예: 성국" className="mb-4 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none placeholder:text-white/25" />

              <label className="mb-2 block text-sm font-black text-white/70">생년월일</label>
              <div className="mb-4 grid grid-cols-3 gap-2">
                <input value={user.year} onChange={(event) => setUser({ ...user, year: event.target.value })} placeholder="년도" className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-white outline-none placeholder:text-white/25" />
                <input value={user.month} onChange={(event) => setUser({ ...user, month: event.target.value })} placeholder="월" className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-white outline-none placeholder:text-white/25" />
                <input value={user.day} onChange={(event) => setUser({ ...user, day: event.target.value })} placeholder="일" className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-white outline-none placeholder:text-white/25" />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["양력", "음력"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setUser({ ...user, calendar: value })} className={cx("rounded-2xl border p-4 font-black", user.calendar === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-white/10 bg-black/35 text-white/45")}>{value}</button>
                ))}
              </div>

              <label className="mb-2 block text-sm font-black text-white/70">출생 시간</label>
              <select value={user.birthTime} onChange={(event) => setUser({ ...user, birthTime: event.target.value })} className="mb-4 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none">
                {birthTimes.map((time) => <option key={time} value={time === "모름 / 선택 안 함" ? "" : time} className="bg-[#111]">{time}</option>)}
              </select>

              <label className="mb-2 block text-sm font-black text-white/70">성별</label>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["남성", "여성"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setUser({ ...user, gender: value })} className={cx("rounded-2xl border p-4 font-black", user.gender === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-white/10 bg-black/35 text-white/45")}>{value}</button>
                ))}
              </div>

              {showPartnerFields && (
                <div className="mb-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 font-black text-[#d8a86f]">상대방 정보</div>
                  <input value={user.partnerName} onChange={(event) => setUser({ ...user, partnerName: event.target.value })} placeholder="상대방 이름 또는 별명" className="mb-3 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none placeholder:text-white/25" />
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <input value={user.partnerYear} onChange={(event) => setUser({ ...user, partnerYear: event.target.value })} placeholder="년도" className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-white outline-none placeholder:text-white/25" />
                    <input value={user.partnerMonth} onChange={(event) => setUser({ ...user, partnerMonth: event.target.value })} placeholder="월" className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-white outline-none placeholder:text-white/25" />
                    <input value={user.partnerDay} onChange={(event) => setUser({ ...user, partnerDay: event.target.value })} placeholder="일" className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-white outline-none placeholder:text-white/25" />
                  </div>
                </div>
              )}

              {showQuestion && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-black text-white/70">상담 질문</label>
                  <textarea value={user.question} onChange={(event) => setUser({ ...user, question: event.target.value })} placeholder="예: 지금 하는 일을 계속해도 될까요?" className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none placeholder:text-white/25" />
                </div>
              )}

              <PrivacyBox />

              <button type="button" onClick={async () => { if (!privacyAgreed) return alert("개인정보 수집·이용에 동의해야 진행할 수 있습니다."); setPaid(false); setStep("result"); await generateAIResult(); }} disabled={aiLoading || !privacyAgreed} className="mt-5 w-full rounded-full bg-[#d8a86f] px-6 py-5 text-lg font-black text-black disabled:opacity-60">
                {aiLoading ? "운세형이 읽는 중..." : privacyAgreed ? "운세형한테 물어보기" : "개인정보 동의 후 진행"}
              </button>
            </section>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("input")} className="text-sm font-bold text-white/45">← 다시 입력하기</button>
            <section className="rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5">
              <div className="mb-4 rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-4 py-2 text-xs font-black text-[#d8a86f]">운세형 분석 완료</div>
              <h1 className="text-3xl font-black leading-tight">{report.headline}</h1>
              <p className="mt-2 whitespace-pre-line text-sm text-white/35">{report.meta}</p>
              <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/70">{report.preview}</p>

              {!paid && (
                <div className="mt-6 rounded-[28px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5">
                  <div className="mb-3 text-xl font-black text-[#d8a86f]">🔒 야, 여기서부터가 진짜 핵심이다</div>
                  <p className="text-sm leading-6 text-white/70">지금까지는 네 흐름의 일부만 보여준 거야. 여기까지만 봐도 어느 정도 감은 왔을 거다.</p>
                  <p className="mt-3 text-sm leading-6 text-white/60">근데 진짜 중요한 건 “좋다/나쁘다”가 아니라, 지금 네가 뭘 멈추고 뭘 시작해야 하는지다.</p>
                  <div className="mt-4 space-y-2 text-sm font-bold text-[#d8a86f]">
                    <div>👉 여기서부터 진짜 중요한 얘기다</div>
                    <div>👉 지금 네가 절대 하면 안 되는 선택이 하나 있다</div>
                    <div>👉 그리고 대부분 여기서 다 틀린다</div>
                    <div>👉 지금 확인하면 같은 고민을 몇 달 줄일 수 있다</div>
                  </div>
                  <p className="mt-4 text-sm text-white/60">지금 여기서 멈추면 같은 고민 또 반복될 수 있다.</p>
                  <button type="button" onClick={() => requestTossPayment(`${category.title} 전체 리포트`, category.price)} className="mt-5 w-full rounded-full bg-[#d8a86f] px-5 py-4 font-black text-black">이어서 확인하기 (진짜 핵심) {category.price.toLocaleString()}원</button>
                  <button type="button" onClick={() => setPaid(true)} className="mt-3 w-full rounded-full border border-white/10 px-5 py-4 text-sm font-black text-white/50">테스트용으로 내 결과 끝까지 보기</button>
                </div>
              )}
            </section>

            {paid && (
              <section className="space-y-4">
                {aiLoading && <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5"><h2 className="text-xl font-black text-[#d8a86f]">운세형이 길게 풀어주는 중...</h2></article>}
                {aiResult && <article className="rounded-[30px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5"><h2 className="mb-3 text-xl font-black text-[#d8a86f]">운세형의 맞춤 리포트</h2><p className="whitespace-pre-line text-[17px] leading-8 text-white/75">{aiResult}</p></article>}
                {report.sections.map((section, index) => (
                  <article key={section.title} className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5">
                    <div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#d8a86f] text-sm font-black text-black">{index + 1}</span><h2 className="text-xl font-black text-[#d8a86f]">{section.title}</h2></div>
                    <p className="whitespace-pre-line text-[17px] leading-8 text-white/68">{section.body}</p>
                  </article>
                ))}
                <button type="button" onClick={() => setStep("consult")} className="w-full rounded-full bg-white px-5 py-4 font-black text-black">1:1로 더 깊게 물어보기</button>
              </section>
            )}
          </div>
        )}

        {step === "consult" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("home")} className="text-sm font-bold text-white/45">← 홈으로</button>
            <section className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6">
              <h1 className="text-3xl font-black leading-tight">혼자 오래 고민한 문제,<br />운세형이 길게 풀어준다</h1>
              <p className="mt-4 text-base leading-7 text-white/60">질문 중심으로 감정, 현실, 선택지를 같이 풀어주는 상담형 리포트입니다.</p>
            </section>
            <section className="space-y-3">
              {consultPlans.map((plan) => (
                <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className={cx("w-full rounded-[28px] border p-5 text-left", selectedPlan === plan.id ? "border-[#d8a86f] bg-[#d8a86f]/12" : "border-white/10 bg-white/[0.04]")}>
                  <div className="flex items-center justify-between gap-3">
                    <div><div className="text-xl font-black">{plan.title}</div><div className="mt-1 text-sm leading-5 text-white/45">{plan.desc}</div></div>
                    <div className="text-lg font-black text-[#d8a86f]">{plan.price.toLocaleString()}원</div>
                  </div>
                </button>
              ))}
            </section>
            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-black">상담 질문 작성</h2>
              <textarea value={consultQuestion} onChange={(event) => setConsultQuestion(event.target.value)} placeholder="지금 가장 답답한 고민을 적어주세요." className="mt-4 min-h-36 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none placeholder:text-white/25" />
              <div className="mt-4"><PrivacyBox /></div>
              <button type="button" onClick={async () => { if (!privacyAgreed) return alert("개인정보 수집·이용에 동의해야 상담을 진행할 수 있습니다."); setStep("consultResult"); await generateConsultAI(); }} disabled={!privacyAgreed || aiLoading} className="mt-5 w-full rounded-full bg-[#d8a86f] px-6 py-5 text-lg font-black text-black disabled:opacity-60">{aiLoading ? "상담 생성 중..." : "테스트용 상담 결과 보기"}</button>
              <button type="button" onClick={() => requestTossPayment(currentPlan.title, currentPlan.price)} className="mt-3 w-full rounded-full border border-[#d8a86f]/40 px-6 py-4 text-sm font-black text-[#d8a86f]">토스 결제창 테스트</button>
            </section>
          </div>
        )}

        {step === "consultResult" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("consult")} className="text-sm font-bold text-white/45">← 상담 다시하기</button>
            <section className="rounded-[34px] border border-white/10 bg-white/[0.05] p-5"><h1 className="text-3xl font-black leading-tight">{nameOf(user)}의<br />프리미엄 상담 리포트</h1></section>
            {aiLoading && <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5"><h2 className="text-xl font-black text-[#d8a86f]">AI 상담 생성 중입니다...</h2></article>}
            {consultAiResult && <article className="rounded-[30px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5"><h2 className="mb-3 text-xl font-black text-[#d8a86f]">운세형의 프리미엄 상담 결과</h2><p className="whitespace-pre-line text-[17px] leading-8 text-white/75">{consultAiResult}</p></article>}
          </div>
        )}
      </main>
    </div>
  );
}
