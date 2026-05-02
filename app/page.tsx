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
    id: "traditional",
    title: "평생종합사주",
    subtitle: "초년운부터 말년운까지 전체 흐름",
    emoji: "📜",
    price: 29900,
    featured: true,
    badge: "런칭특가",
  },
  {
    id: "money",
    title: "재물운",
    subtitle: "돈복·돈이 붙는 방식·새는 구조",
    emoji: "💰",
    price: 6900,
    featured: true,
  },
  {
    id: "career",
    title: "직업/사업운",
    subtitle: "맞는 직업군과 피해야 할 일",
    emoji: "💼",
    price: 6900,
    featured: true,
  },
  {
    id: "love",
    title: "연애운",
    subtitle: "어울리는 상대와 피해야 할 상대",
    emoji: "❤️",
    price: 6900,
    featured: true,
  },
  {
    id: "lifeFlow",
    title: "인생흐름",
    subtitle: "반복되는 패턴과 전환점",
    emoji: "👑",
    price: 12900,
    featured: true,
  },
  {
    id: "today",
    title: "오늘운세",
    subtitle: "오늘 조심할 말과 선택",
    emoji: "🌙",
    price: 1900,
  },
  {
    id: "worry",
    title: "고민풀이",
    subtitle: "같은 고민이 반복되는 이유",
    emoji: "✨",
    price: 3900,
  },
  {
    id: "marriage",
    title: "결혼운",
    subtitle: "배우자 유형과 생활 기준",
    emoji: "💍",
    price: 6900,
  },
  {
    id: "compatibility",
    title: "궁합풀이",
    subtitle: "끌리는 이유와 부딪히는 이유",
    emoji: "👥",
    price: 6900,
  },
  {
    id: "family",
    title: "가족관계",
    subtitle: "책임·서운함·거리감",
    emoji: "🏠",
    price: 6900,
  },
  {
    id: "partner",
    title: "사업파트너",
    subtitle: "돈·역할·책임 구조",
    emoji: "🤝",
    price: 12900,
  },
  {
    id: "monthly",
    title: "12개월운세",
    subtitle: "앞으로 1년 월별 흐름",
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
    role: "직업·현실 방향",
    image: "/characters/bro.png",
    emoji: "🧑‍💼",
    categoryId: "career",
  },
  {
    id: "grandma",
    title: "춘옥할매",
    role: "인생흐름·가족",
    image: "/characters/grandma.png",
    emoji: "👵",
    categoryId: "lifeFlow",
  },
  {
    id: "seoyeon",
    title: "서연",
    role: "연애·결혼",
    image: "/characters/seoyeon.png",
    emoji: "💘",
    categoryId: "love",
  },
  {
    id: "teacher",
    title: "도훈",
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
    text: "직업군을 그냥 찍어주는 게 아니라 왜 맞는지 사주 근거로 풀어줘서 좋았어요.",
  },
  {
    name: "뿌xx",
    category: "재물운",
    text: "돈복보다 돈이 새는 구조를 말해줘서 현실적으로 와닿았어요.",
  },
  {
    name: "하xx",
    category: "연애운",
    text: "어떤 사람을 피해야 하는지까지 말해줘서 제 연애 패턴이 보였어요.",
  },
  {
    name: "우xx",
    category: "평생종합사주",
    text: "초년운부터 말년운까지 보니까 인생 큰 흐름이 잡혔어요.",
  },
  {
    name: "민xx",
    category: "궁합풀이",
    text: "좋다 나쁘다가 아니라 왜 끌리고 왜 부딪히는지 나눠줘서 좋았어요.",
  },
  {
    name: "준xx",
    category: "사업파트너",
    text: "사람 좋은 것과 같이 돈 버는 건 다르다는 말이 기억나요.",
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

const questionExamples: Record<CategoryId, string[]> = {
  today: [
    "오늘 제 운에서 가장 조심해야 할 흐름은 뭔가요?",
    "오늘 돈, 말, 사람관계에서 피해야 할 선택이 있나요?",
    "오늘 하루를 좋게 넘기려면 어떤 기운을 써야 하나요?",
  ],
  worry: [
    "제 사주에서 같은 고민이 반복되는 이유가 뭔가요?",
    "지금 제 운에서 붙잡아야 할 것과 내려놔야 할 것은 뭔가요?",
    "이 고민이 제 인생 흐름에서 어떤 의미인지 봐주세요.",
  ],
  money: [
    "제 사주에서 돈복은 있는 편인가요?",
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
    "제 사주에서 결혼운은 있는 편인가요?",
    "저에게 맞는 배우자 유형과 결혼 흐름을 봐주세요.",
    "만나는 사람이 있다면 결혼까지 가려면 뭘 맞춰야 하나요?",
  ],
  compatibility: [
    "우리 둘은 사주적으로 맞는 부분과 안 맞는 부분이 뭔가요?",
    "이 관계가 오래 갈 수 있는 구조인지 봐주세요.",
    "왜 끌리는데도 자꾸 부딪히는지 궁금해요.",
  ],
  family: [
    "이 가족관계에서 왜 자꾸 부딪히는지 봐주세요.",
    "가족 안에서 제가 어디까지 감당해야 하는지 궁금해요.",
    "상대방과 저의 맞는 부분과 안 맞는 부분이 궁금해요.",
  ],
  partner: [
    "이 사람과 사업파트너로 맞는지 봐주세요.",
    "같이 돈을 벌 수 있는 구조인지 궁금해요.",
    "두 사람의 동업운과 앞으로 1년 사업 흐름을 봐주세요.",
  ],
  lifeFlow: [
    "제 인생 전체 흐름에서 지금은 어떤 시기인가요?",
    "제 운은 늦게 풀리는 편인가요, 빠르게 치고 나가는 편인가요?",
    "앞으로 1년 안에 큰 전환점이 올 수 있는지 봐주세요.",
  ],
  monthly: [
    "앞으로 12개월 전체 운세 흐름을 봐주세요.",
    "올해 돈, 일, 관계에서 조심할 달이 궁금해요.",
    "올해 움직이면 좋은 달과 쉬어야 할 달을 알려주세요.",
  ],
  premium: [
    "지금 제일 답답한 문제를 깊게 풀어주세요.",
    "제가 지금 무엇을 붙잡고 무엇을 내려놔야 할까요?",
    "현재 상황에서 현실적으로 가장 좋은 선택은 뭘까요?",
  ],
  traditional: [
    "제 평생 전체 운의 큰 흐름을 봐주세요.",
    "초년운, 중년운, 말년운이 궁금해요.",
    "재물운, 직업운, 연애·결혼운, 인복까지 종합적으로 봐주세요.",
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

function getPaidBullets(categoryId: CategoryId) {
  if (categoryId === "career") {
    return [
      "내 사주에 맞는 직업군 3~5개",
      "피해야 할 직업군과 일 구조",
      "직장형·사업형·부업형 판정",
      "앞으로 3개월·1년 직업운 흐름",
    ];
  }

  if (categoryId === "money") {
    return [
      "돈복이 살아나는 조건",
      "돈이 새는 구조",
      "맞는 수익 방향",
      "피해야 할 돈 선택",
    ];
  }

  if (categoryId === "love") {
    return [
      "어울리는 상대 유형",
      "피해야 할 상대 유형",
      "연애에서 반복되는 패턴",
      "앞으로 3개월·1년 인연 흐름",
    ];
  }

  if (categoryId === "marriage") {
    return [
      "내 결혼운의 진짜 흐름",
      "어울리는 배우자 유형",
      "피해야 할 결혼 상대",
      "앞으로 3개월·1년 결혼운",
    ];
  }

  if (categoryId === "compatibility") {
    return [
      "두 사람 사주 비교",
      "끌리는 이유와 부딪히는 이유",
      "오래 가는 조건",
      "관계가 나빠지는 위험 신호",
    ];
  }

  if (categoryId === "family") {
    return [
      "가족 안에서의 역할",
      "반복되는 서운함",
      "거리 조절 기준",
      "어디서 선을 그어야 하는지",
    ];
  }

  if (categoryId === "partner") {
    return [
      "같이 돈을 벌 수 있는 구조인지",
      "역할 분담과 충돌 지점",
      "절대 같이 하면 안 되는 조건",
      "앞으로 1년 동업 흐름",
    ];
  }

  if (categoryId === "monthly") {
    return [
      "앞으로 12개월 월별 흐름",
      "돈·일·관계에서 조심할 달",
      "움직이면 좋은 시기",
      "올해 피해야 할 선택",
    ];
  }

  if (categoryId === "traditional") {
    return [
      "초년운·청년운·중년운·말년운",
      "재물운·직업운·연애결혼운",
      "인복·건강운·가족운",
      "앞으로 1년 삶의 방향",
    ];
  }

  if (categoryId === "lifeFlow") {
    return [
      "반복되는 인생 패턴",
      "늦게 풀리는지 빠르게 치는지",
      "돈·일·관계의 큰 방향",
      "앞으로 3개월·1년 전환 흐름",
    ];
  }

  return [
    "내 사주에 맞는 핵심 방향",
    "피해야 할 선택과 반복 패턴",
    "앞으로 3개월 흐름",
    "앞으로 1년 전체 기준",
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
      className="h-full w-full object-contain"
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
        <div className="relative aspect-[3/4.6] w-full overflow-hidden bg-black p-3">
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
    title.includes("결혼운")
  ) {
    return "text-[#e0b36d]";
  }

  if (
    title.includes("피해야") ||
    title.includes("막히") ||
    title.includes("새는") ||
    title.includes("위험")
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
    <article className="relative overflow-hidden rounded-[28px] border border-[#7a5b37] bg-[#121217] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#d8a86f]/10 blur-3xl" />

      <div className="mb-4">
        <div className="text-[10px] font-black tracking-[0.36em] text-[#d8a86f]">
          {getSectionLabel(index)}
        </div>
        <h3
          className={cx(
            "mt-2 break-keep text-[22px] font-black leading-tight tracking-[-0.045em]",
            accent
          )}
        >
          {title}
        </h3>
        <div className="mt-3 h-[2px] w-12 bg-[#d8a86f]" />
      </div>

      {firstLine ? (
        <div className="rounded-[22px] border border-[#7a5b37] bg-black/45 p-4">
          <p className="break-keep text-[18px] font-black leading-[1.65] tracking-[-0.035em] text-white">
            {firstLine}
          </p>
        </div>
      ) : null}

      {restLines.length > 0 ? (
        <div className="mt-4 space-y-4 break-keep text-[15px] font-medium leading-8 text-[#d8d0c6]">
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
            무료에서 멈춘 흐름을 이어서, 맞는 방향과 피해야 할 선택까지 봅니다.
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

  const reviewPages = Math.ceil(reviews.length / 3);
  const reviewsPerPage = 3;
  const visibleReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage
  );

  const birthMeta = `${user.year || "----"}년 ${user.month || "--"}월 ${
    user.day || "--"
  }일 · ${user.calendar} · ${user.gender}`;

  const paidBullets = getPaidBullets(categoryId);

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

      setAiPreview(data.preview || data.result || "[API 응답 없음] 무료 운세 결과를 불러오지 못했습니다.");
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
      alert("결과 내용을 복사했어.");
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
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2b1908_0%,transparent_36%),radial-gradient(circle_at_bottom,#160d22_0%,transparent_38%)]" />

      <header className="sticky top-0 z-40 bg-black/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-4">
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
                  <span>
                    <span className="block font-black text-[#d8a86f]">
                      {item.title}
                    </span>
                    <span className="text-sm text-[#c8beb0]">
                      {item.subtitle}
                    </span>
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
              <div className="mb-5 overflow-hidden rounded-[28px] border border-[#7a5b37] bg-black p-2 shadow-[0_18px_45px_rgba(216,168,111,0.08)]">
                <BrandLogo />
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-[#7a5b37] bg-black">
                <div className="aspect-[4/5] w-full p-4">
                  <SafeImage src="/characters/bro.png" alt="운세형" fallback="🧑‍💼" />
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-5">
                  <div className="inline-flex rounded-full border border-[#7a5b37] bg-[#28231e] px-4 py-2 text-xs font-black tracking-[0.1em] text-[#e0b36d]">
                    형이 귀신같이 봐준다
                  </div>
                </div>
              </div>

              <h1 className="mt-7 text-[42px] font-black leading-[1.1] tracking-[-0.075em] text-white">
                야, 지금 네 사주
                <br />
                그냥 넘기면
                <br />
                <span className="text-[#d8a86f]">또 반복된다</span>
              </h1>

              <p className="mt-6 break-keep text-[18px] font-medium leading-[1.8] tracking-[-0.04em] text-[#c8beb0]">
                무료에서는 사주의 핵심 흐름을 먼저 봅니다.
                <br />
                전체 리포트에서는 <span className="font-black text-[#d8a86f]">맞는 방향과 피해야 할 선택</span>까지 깊게 봅니다.
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
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">
                소름사주는 이렇게 봅니다
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  ["무료", "사주상 지금 어떤 흐름인지 핵심을 먼저 보여줍니다."],
                  ["유료", "결론부터 보고, 카테고리별 핵심 답을 깊게 봅니다."],
                  ["기준", "운영자의 예시가 아니라 개개인의 사주 구조로만 풀이합니다."],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-[#7a5b37] bg-[#1b1612] p-4">
                    <div className="text-sm font-black text-[#d8a86f]">{title}</div>
                    <div className="mt-1 text-sm leading-6 text-[#c8beb0]">{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">
                누구에게 물어볼까요?
              </h2>
              <p className="mt-2 break-keep text-sm leading-6 text-[#c8beb0]">
                고민에 따라 보는 관점이 달라집니다.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                {characters.map((card) => (
                  <CharacterCard
                    key={card.id}
                    card={card}
                    onSelect={() => goInput(card.categoryId)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">
                지금 많이 보는 상담
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {featuredCategories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goInput(item.id)}
                    className="min-h-[142px] rounded-[24px] border border-[#7a5b37] bg-[#15110d] p-4 text-left transition hover:border-[#e0b36d]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#7a5b37] bg-black/45 text-2xl">
                        {item.emoji}
                      </div>

                      {item.badge ? (
                        <span className="rounded-2xl border border-[#d8a86f] px-2 py-1 text-center text-[10px] font-black leading-tight text-[#e0b36d]">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="font-black leading-tight text-[#d8a86f]">
                      {item.title}
                    </div>
                    <div className="mt-2 text-sm leading-5 text-[#c8beb0]">
                      {item.subtitle}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-[24px] border border-[#7a5b37] bg-black/25 p-4">
                <div className="mb-3 text-sm font-black text-[#e0b36d]">
                  더 보기
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {normalCategories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goInput(item.id)}
                      className="rounded-2xl border border-[#7a5b37] bg-[#11100f] px-3 py-3 text-left transition hover:border-[#e0b36d]"
                    >
                      <div className="text-sm font-black text-[#d8a86f]">
                        {item.emoji} {item.title}
                      </div>
                      <div className="mt-1 text-xs leading-4 text-[#c8beb0]">
                        {item.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7a5b37] bg-[#111111] p-5">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-[#d8a86f]">
                먼저 본 사람들은 이렇게 느꼈어요
              </h2>
              <div className="mt-2 text-sm text-[#e0b36d]">★★★★★ 4.8</div>

              <div className="mt-4 space-y-3">
                {visibleReviews.map((review) => (
                  <div
                    key={`${review.name}-${review.category}-${review.text}`}
                    className="rounded-3xl border border-[#7a5b37] bg-black/35 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-sm font-black text-[#d8a86f]">
                        {review.name} · {review.category}
                      </div>
                      <div className="text-xs text-[#e0b36d]">★★★★★</div>
                    </div>
                    <p className="m-0 text-sm leading-6 text-white">
                      “{review.text}”
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {Array.from({ length: reviewPages }, (_, index) => index + 1).map(
                  (page) => (
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
                  )
                )}
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
                </div>
              </div>

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
                    {item.title}
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
          <div className="space-y-5">
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
                    무료에서는 지금 사주에서 보이는 핵심 흐름과 반복되는 문제를 먼저 봅니다.
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
                  <div className="mb-3 text-xl font-black text-[#d8a86f]">
                    여기까지가 무료 분석입니다
                  </div>

                  <p className="break-keep text-sm leading-6 text-[#c8beb0]">
                    무료에서는 사주상 지금 보이는 흐름과 반복되는 문제까지만 보여드립니다.
                    전체 리포트에서는 결론부터 보고, 카테고리별 핵심 답을 깊게 풉니다.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[#7a5b37] bg-black/45 p-4">
                    <div className="mb-2 text-sm font-black text-[#f5efe6]">
                      여기서 끊기면 중요한 흐름을 놓칠 수 있어요
                    </div>

                    <div className="mt-3 space-y-2 text-sm font-semibold text-white">
                      {paidBullets.map((item) => (
                        <div key={item}>✓ {item}</div>
                      ))}
                    </div>
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

                  <button
                    type="button"
                    onClick={openFullReportForTest}
                    disabled={fullLoading}
                    className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-5 py-4 text-sm font-black text-black disabled:opacity-60"
                  >
                    {fullLoading
                      ? "테스트 전체 리포트 생성 중..."
                      : "테스트용 전체 리포트 바로 보기"}
                  </button>
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

              <button
                type="button"
                onClick={() =>
                  requestTossPayment(selectedPlanInfo.title, selectedPlanInfo.price)
                }
                className="mt-3 w-full rounded-full border border-[#d8a86f] bg-white px-6 py-4 text-sm font-black text-black"
              >
                토스 결제창 테스트
              </button>
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

            <div className="space-y-3">
              <details className="rounded-2xl border border-[#7a5b37] bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-[#e0b36d]">
                  이용약관
                </summary>
                <p className="mt-4 text-xs leading-6 text-[#d8d0c6]">
                  본 서비스는 오락·참고용 콘텐츠이며 의학, 법률, 투자, 심리치료, 종교·무속 행위를 대체하지 않습니다. 중요한 결정은 현실 상황과 함께 판단해 주세요.
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
                  연락처: 고객문의 이메일로 접수
                </p>
              </details>

              <details className="rounded-2xl border border-[#7a5b37] bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-[#e0b36d]">
                  환불 및 취소 규정
                </summary>
                <p className="mt-4 text-xs leading-6 text-[#d8d0c6]">
                  유료 리포트는 결제 후 입력 정보를 바탕으로 생성되는 디지털 콘텐츠입니다. 리포트 생성이 시작되었거나 결과 열람이 가능한 상태가 된 경우 단순 변심 환불은 제한될 수 있습니다.
                </p>
              </details>
            </div>

            <div className="mt-5 border-t border-[#7a5b37] pt-4 text-[11px] leading-5 text-[#9d9388]">
              <p>상호명: 비앤케이 컴퍼니 · 대표자: 이성국 · 사업자등록번호: 519-03-02347</p>
              <p>통신판매업신고번호: 2024-경북구미-0959 · 고객문의: kkokku0@naver.com</p>
              <p className="mt-2">© 소름사주. All rights reserved.</p>
            </div>
          </footer>
        ) : null}
      </main>
    </div>
  );
}