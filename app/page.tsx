"use client";

import { useEffect, useMemo, useState } from "react";
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
  color: string;
};

type ReportSection = {
  title: string;
  body: string;
};

const brandName = "운명서재";
const brandSubText = "인생을 읽어주는 감성 운세 리포트";

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

const categories: Category[] = [
  { id: "today", title: "오늘의 운세", subtitle: "오늘 잡아야 할 기회", emoji: "🌙", price: 1900, color: "from-amber-300 to-yellow-600" },
  { id: "worry", title: "고민풀이", subtitle: "지금 고민의 방향", emoji: "✨", price: 3900, color: "from-violet-300 to-purple-700" },
  { id: "money", title: "재물운", subtitle: "돈이 들어오고 새는 구조", emoji: "💰", price: 6900, color: "from-yellow-300 to-orange-600" },
  { id: "career", title: "직업/사업운", subtitle: "내게 맞는 돈벌이", emoji: "💼", price: 6900, color: "from-sky-300 to-blue-700" },
  { id: "love", title: "연애운", subtitle: "인연과 감정 흐름", emoji: "❤️", price: 6900, color: "from-rose-300 to-pink-700" },
  { id: "marriage", title: "결혼운", subtitle: "오래 가는 인연의 조건", emoji: "💍", price: 6900, color: "from-pink-200 to-rose-600" },
  { id: "compatibility", title: "궁합풀이", subtitle: "연인/부부 궁합", emoji: "👥", price: 6900, color: "from-fuchsia-300 to-purple-700" },
  { id: "family", title: "가족관계 풀이", subtitle: "가족 간 기운과 거리", emoji: "🏠", price: 6900, color: "from-emerald-200 to-green-700" },
  { id: "partner", title: "사업파트너 궁합", subtitle: "함께 돈을 만들 수 있는가", emoji: "🤝", price: 12900, color: "from-cyan-200 to-teal-700" },
  { id: "lifeFlow", title: "인생흐름 대운", subtitle: "10년 단위 인생 방향", emoji: "👑", price: 12900, color: "from-amber-200 to-stone-700" },
  { id: "monthly", title: "12개월 상세운세", subtitle: "월별 기회와 조심점", emoji: "🗓️", price: 12900, color: "from-indigo-300 to-slate-700" },
  { id: "premium", title: "AI 프리미엄 상담", subtitle: "OpenAI 기반 긴 상담", emoji: "🔮", price: 29000, color: "from-purple-300 to-black" },
];

const consultPlans = [
  { id: "basic", title: "일반 상담권", price: 19000, desc: "고민 1개 · 현실적인 선택 방향 풀이" },
  { id: "premium", title: "프리미엄 상담권", price: 29000, desc: "깊은 고민 1개 · 긴 감성 상담 리포트" },
  { id: "couple", title: "궁합 상담권", price: 39000, desc: "두 사람 정보 기반 관계/궁합 집중 풀이" },
];

const reviews = [
  ["오늘의 운세", "읽다가 진짜 내 얘기 같아서 소름 돋았어요. 그냥 좋은 말이 아니라 지금 왜 막혀 있는지 설명해줘서 끝까지 읽었습니다."],
  ["재물운", "돈운 풀이가 현실적이라 바로 실행할 게 보였어요. 막연하게 부자 된다는 말이 아니라 어디서 돈이 새는지 짚어줘서 좋았습니다."],
  ["궁합풀이", "궁합 결과가 길고 감성적이라 결제해도 아깝지 않았어요. 왜 끌리고 왜 부딪히는지 설명돼서 놀랐습니다."],
  ["직업/사업운", "내가 왜 자꾸 한 가지를 못 붙잡는지 이해했어요. 바로 30일 계획을 세웠습니다."],
  ["고민풀이", "상담받는 느낌이었어요. 무조건 하라 말라가 아니라 작은 테스트부터 하라는 말이 현실적이었습니다."],
];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function selectedCategory(id: CategoryId) {
  return categories.find((item) => item.id === id) || categories[0];
}

function displayName(user: UserInfo) {
  return user.name.trim() || "당신";
}

function displayPartner(user: UserInfo) {
  return user.partnerName.trim() || "상대방";
}

function createSections(user: UserInfo, categoryId: CategoryId): ReportSection[] {
  const name = displayName(user);
  const partner = displayPartner(user);

  if (categoryId === "money") {
    return [
      { title: "재물운 전체 흐름", body: `${name}님의 재물운은 한 번에 크게 터지는 운이라기보다 작은 신뢰와 반복 구조가 쌓이면서 커지는 축적형에 가깝습니다. 지금은 돈이 없는 시기가 아니라 돈이 머물 구조를 만들어야 하는 시기입니다.` },
      { title: "투자운", body: "단타보다 흐름을 보는 쪽이 맞습니다. 급하게 들어가면 손실이 생기기 쉽고, 기다리면 기회가 오는 구조입니다. 주변 추천이나 급등 이슈를 따라가는 투자는 피해야 합니다." },
      { title: "부업운", body: "사람 상대, 정보 전달, 경험 기반 부업에서 수익 가능성이 높습니다. 지금 바로 시작하면 작은 돈이라도 들어올 구조를 만들 수 있습니다." },
      { title: "사업운", body: "사업은 가능합니다. 다만 크게 시작하면 위험합니다. 1개 상품, 1개 서비스만 집중해서 반응을 보는 것이 중요합니다. 작게 팔아보고 반응이 오면 넓히는 방식이 맞습니다." },
      { title: "앞으로 3개월 돈운", body: "첫 달은 지출 정리, 둘째 달은 판매 테스트, 셋째 달은 반복 상품 만들기가 좋습니다. 작은 결제가 반복되기 시작하면 마음이 안정되고 다음 수익 구조가 보입니다." },
    ];
  }

  if (categoryId === "career") {
    return [
      { title: "직업/사업운 총평", body: `${name}님은 누가 시키는 일만 반복할 때보다 스스로 방향을 잡고 사람에게 설명하거나 제안할 때 힘이 살아납니다. 결국 사람을 만나고 신뢰를 쌓을 때 운이 커집니다.` },
      { title: "맞는 일의 조건", body: "사람의 불편함을 해결하고, 설명과 설득이 들어가며, 한 번 하고 끝나는 일이 아니라 반복되거나 소개가 생기는 일이 잘 맞습니다." },
      { title: "피해야 할 일", body: "몸만 쓰고 단가가 낮은 일, 감정 소모가 큰데 가격을 올리기 어려운 일, 남의 평가에 계속 흔들리는 일은 오래가기 어렵습니다." },
      { title: "지금 해야 할 실행", body: "하나의 서비스를 정하고 3가지 가격표를 만드세요. 무료로 설명만 하지 말고 작은 금액이라도 받아보는 경험이 필요합니다." },
    ];
  }

  if (categoryId === "love") {
    return [
      { title: "연애운 전체 흐름", body: `${name}님의 연애운은 지금 결정의 흐름입니다. 누군가는 들어오고, 누군가는 정리되는 시기입니다. 지금은 누굴 붙잡을지보다 누굴 놓을지가 더 중요합니다.` },
      { title: "연락운", body: "먼저 연락할 사람은 완전히 끊어진 인연이 아니라 애매하게 이어져 있던 사람입니다. 특히 늦은 밤이나 혼자 있는 시간대에 연락이 올 가능성이 있습니다." },
      { title: "썸 흐름", body: "지금 썸은 오래 끌면 흐려집니다. 상대가 확실하게 표현하지 않는다면 먼저 선을 정해야 합니다." },
      { title: "끊어야 할 인연", body: "말은 달콤하지만 행동이 없는 사람을 조심해야 합니다. 기다리게 만들고 애매하게 붙잡는 관계는 운을 막습니다." },
    ];
  }

  if (categoryId === "compatibility") {
    return [
      { title: "궁합 전체 총평", body: `${name}님과 ${partner}님의 궁합은 단순히 좋다, 나쁘다로 자르기 어렵습니다. 서로의 기질 차이가 처음에는 끌림으로 나타나고, 시간이 지나면 갈등의 원인이 되기도 합니다.` },
      { title: "처음 끌리는 이유", body: "서로에게 자신에게 부족한 분위기를 느낄 수 있습니다. 이 끌림은 단순한 호감이라기보다 서로의 빈틈을 자극하는 느낌에 가깝습니다." },
      { title: "갈등 지점", body: "감정을 표현하는 속도와 방식이 다를 수 있습니다. 한쪽은 바로 확인받고 싶어 하고, 다른 한쪽은 시간을 두고 정리하려 할 수 있습니다." },
      { title: "잘 맞는 부분", body: "현실적인 목표를 함께 세우면 시너지가 납니다. 돈, 생활, 미래 계획처럼 구체적인 주제를 함께 정리할 때 관계가 안정됩니다." },
    ];
  }

  if (categoryId === "monthly") {
    return [
      { title: "1~2월: 정리와 회복", body: "무리하게 새 일을 벌이기보다 지난 선택을 정리하는 시기입니다. 마음과 공간, 돈의 흐름을 정리해야 다음 기회가 들어올 자리가 생깁니다." },
      { title: "3~4월: 시도와 노출", body: "사람들에게 보여주는 운이 강해집니다. 혼자 준비만 하지 말고 콘텐츠, 서비스, 판매글, 상담 제안처럼 밖으로 꺼내야 합니다." },
      { title: "5~6월: 관계와 기회", body: "사람을 통해 기회가 들어올 수 있습니다. 소개, 문의, 협업, 제안이 생길 수 있지만 모든 제안을 다 잡을 필요는 없습니다." },
      { title: "7~8월: 지출과 체력 관리", body: "체력과 지출을 조심해야 합니다. 마음이 급해지면 불필요한 결제나 무리한 확장이 생길 수 있습니다." },
      { title: "9~10월: 수익화와 결과", body: "앞서 보여준 것들이 결과로 돌아오기 좋은 시기입니다. 작은 결제, 반복 고객, 후기, 소개가 생길 수 있습니다." },
      { title: "11~12월: 방향 재설정", body: "잘된 것은 남기고, 힘만 들고 돈이 안 된 것은 줄여야 합니다." },
    ];
  }

  if (categoryId === "lifeFlow") {
    return [
      { title: "인생흐름 전체 총평", body: `${name}님의 인생은 직선으로 곧게 가기보다 우회와 전환을 통해 길이 만들어지는 흐름입니다. 남들보다 늦게 느껴지는 순간이 있어도 자기 방식에 맞는 길을 찾는 과정입니다.` },
      { title: "초년의 흐름", body: "주변 기대나 환경에 맞추느라 스스로의 욕구를 뒤로 미뤘을 가능성이 있습니다. 해야 하는 것을 먼저 선택하며 답답함이 쌓였을 수 있습니다." },
      { title: "중년의 전환", body: "남이 정해준 길보다 자기 구조를 만들고 싶어지는 흐름이 강해집니다. 기술, 경험, 사람을 연결해 수익 구조를 만드는 것이 중요합니다." },
      { title: "후반 운", body: "경험이 쌓인 뒤 더 강해지는 운입니다. 사람을 보는 눈, 돈의 흐름을 읽는 감각, 맞지 않는 것을 아는 기준이 자산이 됩니다." },
    ];
  }

  return [
    { title: "전체 흐름", body: `${name}님의 운은 지금 조용히 방향을 바꾸는 중입니다. 겉으로는 답답하고 멈춘 것처럼 느껴질 수 있지만, 실제로는 선택의 기준을 다시 세워야 하는 전환기에 가깝습니다.` },
    { title: "현재 상황 해석", body: "지금의 불안은 약해서 생긴 것이 아닙니다. 잘하고 싶은 마음, 실패하고 싶지 않은 마음, 더 이상 시간을 낭비하고 싶지 않은 마음이 한꺼번에 올라와서 생기는 감정입니다." },
    { title: "현실적인 선택지", body: "첫째, 7일 테스트로 줄이세요. 둘째, 비용이 드는 선택은 작은 규모로 먼저 해보세요. 셋째, 혼자 판단하지 말고 실제 고객이나 주변 반응을 확인하세요." },
    { title: "마지막 메시지", body: "운은 생각 속에서만 열리지 않습니다. 오늘 작게 움직이는 순간, 흐름은 다시 반응하기 시작합니다." },
  ];
}

function buildReport(user: UserInfo, categoryId: CategoryId) {
  const category = selectedCategory(categoryId);
  const name = displayName(user);
  const birth = user.year && user.month && user.day ? `${user.year}년 ${user.month}월 ${user.day}일` : "생년월일 미입력";
  const relation = categoryId === "compatibility" || categoryId === "family" || categoryId === "partner";
  const partnerBirth = user.partnerYear && user.partnerMonth && user.partnerDay ? `${user.partnerYear}년 ${user.partnerMonth}월 ${user.partnerDay}일` : "상대 생년월일 미입력";
  const meta = `${birth} · ${user.calendar} · ${user.gender}${user.birthTime ? ` · ${user.birthTime}` : ""}${relation ? `
상대: ${displayPartner(user)} · ${partnerBirth} · ${user.partnerGender}${user.partnerBirthTime ? ` · ${user.partnerBirthTime}` : ""}` : ""}`;
  const preview = `${name}님의 ${category.title}은 지금 조용히 방향을 바꾸는 흐름에 놓여 있습니다. 겉으로는 답답하고 멈춘 것처럼 느껴질 수 있지만 실제로는 선택의 기준을 다시 세워야 하는 전환기에 가깝습니다.

👉 이 다음 내용에서 진짜 중요한 선택과 결과가 이어집니다. 지금 끊기면 흐름을 놓칠 수 있습니다.`;

  return {
    headline: `${name}님의 ${category.title} 리포트`,
    meta,
    preview,
    sections: createSections(user, categoryId),
  };
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

  const [user, setUser] = useState<UserInfo>({
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
  });

  const category = selectedCategory(categoryId);
  const report = useMemo(() => buildReport(user, categoryId), [user, categoryId]);
  const currentPlan = consultPlans.find((plan) => plan.id === selectedPlan) || consultPlans[1];
  const showPartnerFields = categoryId === "compatibility" || categoryId === "partner" || categoryId === "family";
  const showQuestion = categoryId === "premium" || categoryId === "worry";

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = params.get("amount");

  if (!paymentKey || !orderId || !amount) return;

  const confirmPayment = async () => {
    try {
      const response = await fetch("/api/toss/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "결제 승인 실패");
      }

      setPaid(true);
      setStep("result");
      alert("결제가 완료되었습니다. 전체 리포트를 열었습니다.");

      window.history.replaceState({}, "", window.location.pathname);
    } catch (error) {
      console.error(error);
      alert("결제 승인 중 오류가 발생했습니다.");
    }
  };

  confirmPayment();
}, []);
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
      alert("토스 클라이언트 키가 없습니다. .env.local에 NEXT_PUBLIC_TOSS_CLIENT_KEY를 넣고 서버를 재시작하세요.");
      return;
    }

    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: `guest_${Date.now()}` });
      const orderId = `fortune_${Date.now()}`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}${window.location.pathname}`,
        failUrl: `${window.location.origin}${window.location.pathname}?payment=fail`,
        customerName: displayName(user),
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
        body: JSON.stringify({
          user: { ...user, question: consultQuestion || user.question },
          categoryTitle: currentPlan.title,
          question: consultQuestion || user.question,
        }),
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
        <input
          type="checkbox"
          checked={privacyAgreed}
          onChange={(event) => setPrivacyAgreed(event.target.checked)}
          className="mt-1 h-5 w-5 accent-[#d8a86f]"
        />
        <span>
          <span className="block text-sm font-black text-[#d8a86f]">개인정보 수집·이용 동의</span>
          <span className="mt-1 block text-xs leading-5 text-white/55">
            운세 분석과 상담 리포트 생성을 위해 이름/별명, 생년월일, 성별, 출생시간, 상담 질문을 수집·이용합니다.
          </span>
        </span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070607] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#4b2b0b_0%,transparent_35%),radial-gradient(circle_at_bottom,#1d1235_0%,transparent_35%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-4">
          <button onClick={() => setStep("home")} className="text-left">
            <div className="text-2xl font-black tracking-tight">{brandName}</div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-[#d8a86f]">{brandSubText}</div>
          </button>
          <button onClick={() => setMenuOpen(true)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xl">☰</button>
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
              <button onClick={() => setMenuOpen(false)} className="text-3xl text-white/70">×</button>
            </div>
            <div className="space-y-3">
              {categories.map((item) => (
                <button key={item.id} onClick={() => goInput(item.id)} className="flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left">
                  <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl", item.color)}>{item.emoji}</span>
                  <span>
                    <span className="block font-black">{item.title}</span>
                    <span className="text-sm text-white/45">{item.subtitle}</span>
                  </span>
                </button>
              ))}
              <button onClick={() => { setMenuOpen(false); setStep("consult"); }} className="flex w-full items-center gap-4 rounded-3xl border border-[#d8a86f]/30 bg-[#d8a86f]/10 p-4 text-left">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d8a86f] text-2xl">🪬</span>
                <span>
                  <span className="block font-black">1:1 운세 상담권</span>
                  <span className="text-sm text-white/45">상담형 리포트 결제</span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[460px] px-5 pb-24 pt-6">
        {step === "home" && (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-6 shadow-2xl">
              <div className="mb-5 inline-flex rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-4 py-2 text-xs font-black tracking-[0.18em] text-[#d8a86f]">오늘의 운 · 고민 · 궁합 · 재물운</div>
              <h1 className="text-4xl font-black leading-tight tracking-tight">지금 당신의 운은<br />어디에서 막히고<br />어디로 열릴까요?</h1>
              <p className="mt-5 text-lg leading-8 text-white/65">
                짧은 점괘가 아니라, 지금 내 상황을 길게 읽어주는 감성 운세 리포트입니다. 돈, 일, 관계, 사랑, 인생 흐름까지 지금 필요한 선택을 부드럽지만 현실적으로 풀어드립니다.
              </p>
              <div className="mt-6 rounded-[28px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5">
                <p className="text-base leading-7 text-white/70">
                  많은 사람은 운이 나빠서 막히는 것이 아니라, <span className="font-black text-[#d8a86f]">지금 무엇을 붙잡고 무엇을 내려놓아야 하는지</span> 몰라서 오래 헤맵니다.
                </p>
                <p className="mt-3 text-sm font-bold text-[#d8a86f]">👉 지금 흐름을 알면 다음 선택이 달라집니다.</p>
              </div>
              <button onClick={() => goInput("today")} className="mt-7 w-full rounded-full bg-[#d8a86f] px-6 py-5 text-lg font-black text-black shadow-[0_18px_40px_rgba(216,168,111,0.25)]">3초 만에 내 운세 미리보기</button>
              <button onClick={() => setStep("consult")} className="mt-3 w-full rounded-full border border-[#d8a86f]/40 bg-black/30 px-6 py-5 text-lg font-black text-[#d8a86f]">1:1 운세 상담권 보기</button>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-2xl font-black">운세 카테고리</h2>
              <p className="mt-1 text-sm text-white/45">원하는 주제를 선택하면 맞춤 입력 화면으로 이동합니다</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {categories.map((item) => (
                  <button key={item.id} onClick={() => goInput(item.id)} className="min-h-[142px] rounded-[26px] border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-[#d8a86f]/70">
                    <div className={cn("mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl", item.color)}>{item.emoji}</div>
                    <div className="font-black leading-tight">{item.title}</div>
                    <div className="mt-2 text-sm leading-5 text-white/45">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black">사용자 후기</h2>
                <span className="text-sm text-[#d8a86f]">★★★★★ 4.8</span>
              </div>
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <div key={review[1]} className="rounded-3xl bg-black/30 p-4">
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
            <button onClick={() => setStep("home")} className="text-sm font-bold text-white/45">← 홈으로</button>
            <section className="rounded-[34px] border border-white/10 bg-white/[0.055] p-5">
              <div className="mb-5 flex items-center gap-4">
                <div className={cn("grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br text-3xl", category.color)}>{category.emoji}</div>
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
                  <button key={value} onClick={() => setUser({ ...user, calendar: value })} className={cn("rounded-2xl border p-4 font-black", user.calendar === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-white/10 bg-black/35 text-white/45")}>{value}</button>
                ))}
              </div>

              <label className="mb-2 block text-sm font-black text-white/70">출생 시간</label>
              <select value={user.birthTime} onChange={(event) => setUser({ ...user, birthTime: event.target.value })} className="mb-4 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none">
                {birthTimes.map((time) => <option key={time} value={time === "모름 / 선택 안 함" ? "" : time} className="bg-[#111]">{time}</option>)}
              </select>

              <label className="mb-2 block text-sm font-black text-white/70">성별</label>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["남성", "여성"] as const).map((value) => (
                  <button key={value} onClick={() => setUser({ ...user, gender: value })} className={cn("rounded-2xl border p-4 font-black", user.gender === value ? "border-[#d8a86f] bg-[#d8a86f] text-black" : "border-white/10 bg-black/35 text-white/45")}>{value}</button>
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
                  <select value={user.partnerBirthTime} onChange={(event) => setUser({ ...user, partnerBirthTime: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none">
                    {birthTimes.map((time) => <option key={time} value={time === "모름 / 선택 안 함" ? "" : time} className="bg-[#111]">상대방 {time}</option>)}
                  </select>
                </div>
              )}

              {showQuestion && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-black text-white/70">상담 질문</label>
                  <textarea value={user.question} onChange={(event) => setUser({ ...user, question: event.target.value })} placeholder="예: 지금 하는 일을 계속해도 될까요? 돈이 되는 방향을 알고 싶어요." className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none placeholder:text-white/25" />
                </div>
              )}

              <PrivacyBox />

              <button
                onClick={async () => {
                  if (!privacyAgreed) {
                    alert("개인정보 수집·이용에 동의해야 운세 분석을 진행할 수 있습니다.");
                    return;
                  }
                  setPaid(false);
                  setStep("result");
                  await generateAIResult();
                }}
                disabled={aiLoading || !privacyAgreed}
                className="mt-5 w-full rounded-full bg-[#d8a86f] px-6 py-5 text-lg font-black text-black disabled:opacity-60"
              >
                {aiLoading ? "AI 분석 중..." : privacyAgreed ? "운세 분석 시작하기" : "개인정보 동의 후 진행"}
              </button>
            </section>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-5">
            <button onClick={() => setStep("input")} className="text-sm font-bold text-white/45">← 다시 입력하기</button>
            <section className="rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-4 py-2 text-xs font-black text-[#d8a86f]">AI 분석 완료</div>
                <div className="text-sm text-[#d8a86f]">★★★★★</div>
              </div>
              <h1 className="text-3xl font-black leading-tight">{report.headline}</h1>
              <p className="mt-2 whitespace-pre-line text-sm text-white/35">{report.meta}</p>
              <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/65">{report.preview}</p>

              {!paid && (
                <div className="mt-6 rounded-[28px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5">
                  <div className="mb-2 text-lg font-black text-[#d8a86f]">🔒 전체 풀이 잠금</div>
                  <p className="text-sm leading-6 text-white/60">현재는 미리보기만 공개되었습니다. 전체 리포트에서는 AI 리포트와 세부 풀이를 확인할 수 있습니다.</p>
                  <div className="mt-4 space-y-1 text-sm leading-6 text-[#d8a86f]">
                    <div>👉 여기서 끊기면 중요한 흐름 놓칩니다</div>
                    <div>👉 지금 선택에 따라 3개월이 바뀝니다</div>
                    <div>👉 이 다음 내용이 핵심입니다</div>
                  </div>
                  <button onClick={() => requestTossPayment(`${category.title} 전체 리포트`, category.price)} className="mt-5 w-full rounded-full bg-[#d8a86f] px-5 py-4 font-black text-black">
                    전체 리포트 결제하기 {category.price.toLocaleString()}원
                  </button>
                  <button onClick={() => setPaid(true)} className="mt-3 w-full rounded-full border border-white/10 px-5 py-4 text-sm font-black text-white/50">
                    테스트용으로 바로 열기
                  </button>
                </div>
              )}
            </section>

            {paid && (
              <section className="space-y-4">
                {aiLoading && <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5"><h2 className="text-xl font-black text-[#d8a86f]">AI가 운세를 작성 중입니다...</h2></article>}
                {aiResult && <article className="rounded-[30px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5"><h2 className="mb-3 text-xl font-black text-[#d8a86f]">AI 맞춤 운세 리포트</h2><p className="whitespace-pre-line text-[17px] leading-8 text-white/75">{aiResult}</p></article>}
                {report.sections.map((section, index) => (
                  <article key={section.title} className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5">
                    <div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#d8a86f] text-sm font-black text-black">{index + 1}</span><h2 className="text-xl font-black text-[#d8a86f]">{section.title}</h2></div>
                    <p className="whitespace-pre-line text-[17px] leading-8 text-white/68">{section.body}</p>
                  </article>
                ))}
                <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-[#d8a86f]/20 to-purple-900/20 p-5">
                  <h2 className="text-2xl font-black">더 깊게 묻고 싶다면</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">상담권으로 더 긴 고민 리포트를 받을 수 있습니다.</p>
                  <button onClick={() => setStep("consult")} className="mt-5 w-full rounded-full bg-white px-5 py-4 font-black text-black">AI 프리미엄 상담하기</button>
                </div>
              </section>
            )}
          </div>
        )}

        {step === "consult" && (
          <div className="space-y-5">
            <button onClick={() => setStep("home")} className="text-sm font-bold text-white/45">← 홈으로</button>
            <section className="rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-6">
              <div className="mb-4 inline-flex rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-4 py-2 text-xs font-black text-[#d8a86f]">PREMIUM CONSULTING</div>
              <h1 className="text-3xl font-black leading-tight">혼자 오래 고민한 문제,<br />길게 풀어드립니다</h1>
              <p className="mt-4 text-base leading-7 text-white/60">질문 중심의 감정 해석과 현실적인 선택지를 함께 제시하는 상담형 리포트입니다.</p>
            </section>
            <section className="space-y-3">
              {consultPlans.map((plan) => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={cn("w-full rounded-[28px] border p-5 text-left", selectedPlan === plan.id ? "border-[#d8a86f] bg-[#d8a86f]/12" : "border-white/10 bg-white/[0.04]")}>
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
              <button onClick={async () => { if (!privacyAgreed) { alert("개인정보 수집·이용에 동의해야 상담을 진행할 수 있습니다."); return; } setStep("consultResult"); await generateConsultAI(); }} disabled={!privacyAgreed || aiLoading} className="mt-5 w-full rounded-full bg-[#d8a86f] px-6 py-5 text-lg font-black text-black disabled:opacity-60">
                {aiLoading ? "상담 생성 중..." : "테스트용 상담 결과 보기"}
              </button>
              <button onClick={() => requestTossPayment(currentPlan.title, currentPlan.price)} className="mt-3 w-full rounded-full border border-[#d8a86f]/40 px-6 py-4 text-sm font-black text-[#d8a86f]">토스 결제창 테스트</button>
            </section>
          </div>
        )}

        {step === "consultResult" && (
          <div className="space-y-5">
            <button onClick={() => setStep("consult")} className="text-sm font-bold text-white/45">← 상담 다시하기</button>
            <section className="rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5">
              <div className="mb-4 rounded-full border border-[#d8a86f]/30 bg-[#d8a86f]/10 px-4 py-2 text-center text-xs font-black text-[#d8a86f]">상담 리포트 생성 완료</div>
              <h1 className="text-3xl font-black leading-tight">{displayName(user)}님의<br />프리미엄 상담 리포트</h1>
            </section>
            <section className="space-y-4">
              {aiLoading && <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5"><h2 className="text-xl font-black text-[#d8a86f]">AI 상담 생성 중입니다...</h2></article>}
              {consultAiResult && <article className="rounded-[30px] border border-[#d8a86f]/25 bg-[#d8a86f]/10 p-5"><h2 className="mb-3 text-xl font-black text-[#d8a86f]">AI 프리미엄 상담 결과</h2><p className="whitespace-pre-line text-[17px] leading-8 text-white/75">{consultAiResult}</p></article>}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
