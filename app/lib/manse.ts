export type CalendarType = "양력" | "음력";
export type GenderType = "남성" | "여성";

export type ManseInput = {
  name?: string;
  year?: string;
  month?: string;
  day?: string;
  calendar?: CalendarType;
  birthTime?: string;
  gender?: GenderType;
};

export type ElementKey = "목" | "화" | "토" | "금" | "수";
export type YinYang = "양" | "음";

export type Pillar = {
  stem: string;
  branch: string;
  pillar: string;

  stemKr: string;
  branchKr: string;
  pillarKr: string;

  stemElement: ElementKey;
  branchElement: ElementKey;

  stemYinYang: YinYang;
  branchYinYang: YinYang;
};

export type DayMaster = {
  stem: string;
  stemKr: string;
  label: string;
  element: ElementKey;
  yinYang: YinYang;
  description: string;
};

export type ElementCounts = Record<ElementKey, number> & {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type ManseResult = {
  input: {
    name: string;
    year: number | null;
    month: number | null;
    day: number | null;
    calendar: CalendarType;
    birthTime: string;
    gender: GenderType;
  };

  warning?: string;

  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  timePillar: Pillar | null;

  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  timeStem: string | null;
  timeBranch: string | null;

  dayMaster: DayMaster;

  elements: ElementCounts;
  elementCounts: ElementCounts;

  strongestElement: ElementKey;
  weakestElement: ElementKey;
  strongElements: ElementKey[];
  weakElements: ElementKey[];

  summary: {
    dayMasterText: string;
    monthText: string;
    elementBalanceText: string;
    timeText: string;
    neutralFlowText: string;
    moneyHintText: string;
    relationshipHintText: string;
  };
};

const HEAVENLY_STEMS = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
] as const;

const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;

const STEM_KR: Record<string, string> = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계",
};

const BRANCH_KR: Record<string, string> = {
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해",
};

const STEM_ELEMENT: Record<string, ElementKey> = {
  甲: "목",
  乙: "목",
  丙: "화",
  丁: "화",
  戊: "토",
  己: "토",
  庚: "금",
  辛: "금",
  壬: "수",
  癸: "수",
};

const BRANCH_ELEMENT: Record<string, ElementKey> = {
  子: "수",
  丑: "토",
  寅: "목",
  卯: "목",
  辰: "토",
  巳: "화",
  午: "화",
  未: "토",
  申: "금",
  酉: "금",
  戌: "토",
  亥: "수",
};

const STEM_YINYANG: Record<string, YinYang> = {
  甲: "양",
  乙: "음",
  丙: "양",
  丁: "음",
  戊: "양",
  己: "음",
  庚: "양",
  辛: "음",
  壬: "양",
  癸: "음",
};

const BRANCH_YINYANG: Record<string, YinYang> = {
  子: "양",
  丑: "음",
  寅: "양",
  卯: "음",
  辰: "양",
  巳: "음",
  午: "양",
  未: "음",
  申: "양",
  酉: "음",
  戌: "양",
  亥: "음",
};

const DAY_MASTER_DESC: Record<string, string> = {
  甲: "갑목은 큰 나무 같은 기운이라 방향성, 성장 욕구, 버티는 힘이 강해.",
  乙: "을목은 풀과 꽃 같은 기운이라 유연함, 적응력, 섬세한 관계 감각이 강해.",
  丙: "병화는 태양 같은 기운이라 드러남, 표현력, 추진력, 존재감이 강해.",
  丁: "정화는 촛불 같은 기운이라 감각, 집중력, 섬세한 표현, 사람 마음을 읽는 힘이 있어.",
  戊: "무토는 큰 산 같은 기운이라 버팀, 책임감, 현실감, 중심을 잡는 힘이 강해.",
  己: "기토는 논밭 같은 기운이라 돌봄, 실속, 관리, 현실적인 감각이 있어.",
  庚: "경금은 큰 쇠 같은 기운이라 결단, 기준, 실행력, 자르는 힘이 강해.",
  辛: "신금은 보석 같은 기운이라 세밀함, 기준, 완성도, 품질 감각이 강해.",
  壬: "임수는 큰 물 같은 기운이라 생각, 정보, 흐름 읽기, 이동성이 강해.",
  癸: "계수는 비와 안개 같은 기운이라 감수성, 직감, 관찰력, 깊은 생각이 강해.",
};

const ELEMENT_MEANING: Record<ElementKey, string> = {
  목: "성장, 시작, 방향성, 확장, 관계의 싹",
  화: "표현, 추진력, 드러남, 열정, 감정의 온도",
  토: "현실감, 책임, 기반, 돈을 담는 그릇, 생활 안정",
  금: "기준, 정리, 결단, 관리, 끊어내는 힘",
  수: "생각, 정보, 감각, 흐름 읽기, 지혜, 유연함",
};

function toNumber(value?: string): number | null {
  if (!value) return null;

  const normalized = value.replace(/[^0-9]/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;

  return parsed;
}

function clampMonth(value: number | null): number | null {
  if (!value) return null;
  if (value < 1 || value > 12) return null;
  return value;
}

function clampDay(value: number | null): number | null {
  if (!value) return null;
  if (value < 1 || value > 31) return null;
  return value;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function getStem(index: number) {
  return HEAVENLY_STEMS[mod(index, 10)];
}

function getBranch(index: number) {
  return EARTHLY_BRANCHES[mod(index, 12)];
}

function makePillar(stem: string, branch: string): Pillar {
  const stemKr = STEM_KR[stem];
  const branchKr = BRANCH_KR[branch];

  return {
    stem,
    branch,
    pillar: `${stem}${branch}`,

    stemKr,
    branchKr,
    pillarKr: `${stemKr}${branchKr}`,

    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],

    stemYinYang: STEM_YINYANG[stem],
    branchYinYang: BRANCH_YINYANG[branch],
  };
}

function getKoreanPillar(pillar: Pillar | null) {
  if (!pillar) return "없음";
  return `${pillar.pillarKr}(${pillar.pillar})`;
}

function getSolarYearForSaju(year: number, month: number, day: number) {
  // MVP 근사값: 입춘을 2월 4일로 고정.
  if (month < 2) return year - 1;
  if (month === 2 && day < 4) return year - 1;
  return year;
}

function getYearPillar(year: number, month: number, day: number) {
  // 1984년 갑자년 기준.
  const sajuYear = getSolarYearForSaju(year, month, day);
  const offset = sajuYear - 1984;

  return makePillar(getStem(offset), getBranch(offset));
}

function getMonthBranchIndex(month: number, day: number) {
  // 절기 기준 월지 근사값.
  // 정확한 절기 시각 계산은 전문 만세력 API 또는 라이브러리 연동 시 교체.
  if (month === 1) return day >= 6 ? 1 : 0; // 丑 / 子
  if (month === 2) return day >= 4 ? 2 : 1; // 寅 / 丑
  if (month === 3) return day >= 6 ? 3 : 2; // 卯 / 寅
  if (month === 4) return day >= 5 ? 4 : 3; // 辰 / 卯
  if (month === 5) return day >= 6 ? 5 : 4; // 巳 / 辰
  if (month === 6) return day >= 6 ? 6 : 5; // 午 / 巳
  if (month === 7) return day >= 7 ? 7 : 6; // 未 / 午
  if (month === 8) return day >= 8 ? 8 : 7; // 申 / 未
  if (month === 9) return day >= 8 ? 9 : 8; // 酉 / 申
  if (month === 10) return day >= 8 ? 10 : 9; // 戌 / 酉
  if (month === 11) return day >= 7 ? 11 : 10; // 亥 / 戌
  if (month === 12) return day >= 7 ? 0 : 11; // 子 / 亥

  return 2;
}

function getMonthStemIndex(yearStem: string, monthBranchIndex: number) {
  // 월간 공식:
  // 甲己년 丙寅월 시작
  // 乙庚년 戊寅월 시작
  // 丙辛년 庚寅월 시작
  // 丁壬년 壬寅월 시작
  // 戊癸년 甲寅월 시작
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem as any);

  let tigerMonthStemIndex = 2; // 丙

  if (yearStemIndex === 0 || yearStemIndex === 5) tigerMonthStemIndex = 2;
  if (yearStemIndex === 1 || yearStemIndex === 6) tigerMonthStemIndex = 4;
  if (yearStemIndex === 2 || yearStemIndex === 7) tigerMonthStemIndex = 6;
  if (yearStemIndex === 3 || yearStemIndex === 8) tigerMonthStemIndex = 8;
  if (yearStemIndex === 4 || yearStemIndex === 9) tigerMonthStemIndex = 0;

  const diffFromTiger = mod(monthBranchIndex - 2, 12);

  return mod(tigerMonthStemIndex + diffFromTiger, 10);
}

function getMonthPillar(yearPillar: Pillar, month: number, day: number) {
  const branchIndex = getMonthBranchIndex(month, day);
  const stemIndex = getMonthStemIndex(yearPillar.stem, branchIndex);

  return makePillar(getStem(stemIndex), getBranch(branchIndex));
}

function getDayPillar(year: number, month: number, day: number) {
  // MVP 안정 계산.
  // 1900-01-31을 甲辰 기준으로 잡고 60갑자 순환.
  // 전문 만세력 API 도입 시 이 함수만 교체하면 됨.
  const base = Date.UTC(1900, 0, 31);
  const target = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((target - base) / 86400000);

  const baseStemIndex = 0; // 甲
  const baseBranchIndex = 4; // 辰

  return makePillar(
    getStem(baseStemIndex + diffDays),
    getBranch(baseBranchIndex + diffDays)
  );
}

function parseTimeBranchIndex(birthTime?: string) {
  if (!birthTime) return null;

  const text = birthTime.trim();

  if (!text || text.includes("모름")) return null;

  if (text.includes("자시")) return 0;
  if (text.includes("축시")) return 1;
  if (text.includes("인시")) return 2;
  if (text.includes("묘시")) return 3;
  if (text.includes("진시")) return 4;
  if (text.includes("사시")) return 5;
  if (text.includes("오시")) return 6;
  if (text.includes("미시")) return 7;
  if (text.includes("신시")) return 8;
  if (text.includes("유시")) return 9;
  if (text.includes("술시")) return 10;
  if (text.includes("해시")) return 11;

  const hourMatch = text.match(/(\d{1,2})/);
  if (!hourMatch) return null;

  const hour = Number(hourMatch[1]);

  if (hour >= 23 || hour < 1) return 0;
  if (hour >= 1 && hour < 3) return 1;
  if (hour >= 3 && hour < 5) return 2;
  if (hour >= 5 && hour < 7) return 3;
  if (hour >= 7 && hour < 9) return 4;
  if (hour >= 9 && hour < 11) return 5;
  if (hour >= 11 && hour < 13) return 6;
  if (hour >= 13 && hour < 15) return 7;
  if (hour >= 15 && hour < 17) return 8;
  if (hour >= 17 && hour < 19) return 9;
  if (hour >= 19 && hour < 21) return 10;
  if (hour >= 21 && hour < 23) return 11;

  return null;
}

function getTimeStemIndex(dayStem: string, branchIndex: number) {
  // 시간 공식:
  // 甲己일 甲子시 시작
  // 乙庚일 丙子시 시작
  // 丙辛일 戊子시 시작
  // 丁壬일 庚子시 시작
  // 戊癸일 壬子시 시작
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem as any);

  let ratHourStemIndex = 0;

  if (dayStemIndex === 0 || dayStemIndex === 5) ratHourStemIndex = 0;
  if (dayStemIndex === 1 || dayStemIndex === 6) ratHourStemIndex = 2;
  if (dayStemIndex === 2 || dayStemIndex === 7) ratHourStemIndex = 4;
  if (dayStemIndex === 3 || dayStemIndex === 8) ratHourStemIndex = 6;
  if (dayStemIndex === 4 || dayStemIndex === 9) ratHourStemIndex = 8;

  return mod(ratHourStemIndex + branchIndex, 10);
}

function getTimePillar(dayPillar: Pillar, birthTime?: string) {
  const branchIndex = parseTimeBranchIndex(birthTime);

  if (branchIndex === null) return null;

  const stemIndex = getTimeStemIndex(dayPillar.stem, branchIndex);

  return makePillar(getStem(stemIndex), getBranch(branchIndex));
}

function createEmptyElementCount() {
  return {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  } as Record<ElementKey, number>;
}

function addElement(counts: Record<ElementKey, number>, element: ElementKey, amount = 1) {
  counts[element] += amount;
}

function countElements(pillars: Array<Pillar | null>) {
  const counts = createEmptyElementCount();

  pillars.forEach((pillar) => {
    if (!pillar) return;

    addElement(counts, pillar.stemElement, 1);
    addElement(counts, pillar.branchElement, 1);
  });

  return counts;
}

function withEnglishElementKeys(counts: Record<ElementKey, number>): ElementCounts {
  return {
    ...counts,
    wood: counts.목,
    fire: counts.화,
    earth: counts.토,
    metal: counts.금,
    water: counts.수,
  };
}

function getStrongestElement(counts: Record<ElementKey, number>) {
  const order: ElementKey[] = ["목", "화", "토", "금", "수"];

  return [...order].sort((a, b) => {
    if (counts[b] !== counts[a]) return counts[b] - counts[a];
    return order.indexOf(a) - order.indexOf(b);
  })[0];
}

function getWeakestElement(counts: Record<ElementKey, number>) {
  const order: ElementKey[] = ["목", "화", "토", "금", "수"];

  return [...order].sort((a, b) => {
    if (counts[a] !== counts[b]) return counts[a] - counts[b];
    return order.indexOf(a) - order.indexOf(b);
  })[0];
}

function getStrongElements(counts: Record<ElementKey, number>) {
  const max = Math.max(...Object.values(counts));

  return (Object.entries(counts) as Array<[ElementKey, number]>)
    .filter(([, value]) => value === max)
    .map(([key]) => key);
}

function getWeakElements(counts: Record<ElementKey, number>) {
  const min = Math.min(...Object.values(counts));

  return (Object.entries(counts) as Array<[ElementKey, number]>)
    .filter(([, value]) => value === min)
    .map(([key]) => key);
}

function getDayMaster(dayPillar: Pillar): DayMaster {
  return {
    stem: dayPillar.stem,
    stemKr: dayPillar.stemKr,
    label: `${dayPillar.stemKr}${dayPillar.stemElement}`,
    element: dayPillar.stemElement,
    yinYang: dayPillar.stemYinYang,
    description: DAY_MASTER_DESC[dayPillar.stem],
  };
}

function getElementMeaning(element: ElementKey) {
  return ELEMENT_MEANING[element];
}

function getNeutralFlowText(strongest: ElementKey, weakest: ElementKey) {
  return `강한 ${strongest} 기운은 ${getElementMeaning(strongest)} 쪽으로 힘을 쓰게 만들고, 약한 ${weakest} 기운은 ${getElementMeaning(weakest)} 쪽에서 보완이 필요하다는 뜻이야.`;
}

function getMoneyHintText(strongest: ElementKey, weakest: ElementKey) {
  let first = "";

  if (strongest === "토") {
    first = "토가 강하면 돈을 담는 그릇, 현실감, 책임감은 있는 편이야.";
  } else if (strongest === "화") {
    first = "화가 강하면 드러내고 움직이면서 돈 흐름을 만들 수 있는 편이야.";
  } else if (strongest === "목") {
    first = "목이 강하면 돈을 바로 쥐기보다 키워가고 확장하는 방식에서 재물 흐름이 살아나기 쉬워.";
  } else if (strongest === "금") {
    first = "금이 강하면 돈을 관리하고 기준을 세우는 힘이 있는 편이야.";
  } else {
    first = "수가 강하면 정보, 흐름, 감각을 돈으로 연결하는 힘이 생기기 쉬워.";
  }

  let second = "";

  if (weakest === "금") {
    second = "다만 금이 약하면 돈을 정리하고 끊어낼 기준이 약해져서 새는 돈을 조심해야 해.";
  } else if (weakest === "화") {
    second = "다만 화가 약하면 표현과 추진력이 약해져서 좋은 기회가 와도 드러내는 힘이 부족할 수 있어.";
  } else if (weakest === "목") {
    second = "다만 목이 약하면 새로 키우는 힘과 방향성이 흔들려서 꾸준한 확장이 중요해.";
  } else if (weakest === "수") {
    second = "다만 수가 약하면 정보와 흐름을 읽는 힘을 보완해야 돈 선택이 안정돼.";
  } else {
    second = "다만 토가 약하면 돈을 담는 구조와 생활 기반을 먼저 잡아야 해.";
  }

  return `${first} ${second}`;
}

function getRelationshipHintText(dayMaster: DayMaster, strongest: ElementKey, weakest: ElementKey) {
  let first = "";

  if (dayMaster.element === "목") {
    first = "목 일간은 관계에서 성장감과 방향성을 중요하게 봐.";
  } else if (dayMaster.element === "화") {
    first = "화 일간은 관계에서 표현, 반응, 감정의 온도를 중요하게 봐.";
  } else if (dayMaster.element === "토") {
    first = "토 일간은 관계에서 안정, 책임, 생활의 균형을 중요하게 봐.";
  } else if (dayMaster.element === "금") {
    first = "금 일간은 관계에서 신뢰, 기준, 말과 행동의 일치를 중요하게 봐.";
  } else {
    first = "수 일간은 관계에서 감정의 흐름, 생각의 깊이, 편안한 소통을 중요하게 봐.";
  }

  return `${first} 강한 ${strongest} 기운은 관계에서 자주 드러나는 힘이고, 약한 ${weakest} 기운은 상대와 맞춰갈 때 보완해야 하는 부분이야.`;
}

function buildSummary(params: {
  dayMaster: DayMaster;
  monthPillar: Pillar;
  timePillar: Pillar | null;
  counts: Record<ElementKey, number>;
  strongestElement: ElementKey;
  weakestElement: ElementKey;
}) {
  const {
    dayMaster,
    monthPillar,
    timePillar,
    counts,
    strongestElement,
    weakestElement,
  } = params;

  const dayMasterText = `일간은 ${dayMaster.label}(${dayMaster.stem})이야. ${dayMaster.description}`;

  const monthText = `월주는 ${monthPillar.pillarKr}(${monthPillar.pillar})이고, 월지는 ${monthPillar.branchKr}(${monthPillar.branch})야. 월지는 계절감, 사회적 환경, 기본 흐름을 보는 핵심 자리야.`;

  const elementBalanceText = `오행 분포는 목 ${counts.목}, 화 ${counts.화}, 토 ${counts.토}, 금 ${counts.금}, 수 ${counts.수}로 잡혀 있어. 강한 기운은 ${strongestElement}, 보완이 필요한 기운은 ${weakestElement}이야.`;

  const timeText = timePillar
    ? `시주는 ${timePillar.pillarKr}(${timePillar.pillar})로 잡혀 있어. 시주는 말년 흐름, 깊은 속마음, 결과물의 자리로 참고해.`
    : "출생시간이 없어서 시주는 계산하지 않았어. 그래서 말년 흐름, 깊은 내면, 결과물 해석은 조심스럽게 봐야 해.";

  const neutralFlowText = getNeutralFlowText(strongestElement, weakestElement);
  const moneyHintText = getMoneyHintText(strongestElement, weakestElement);
  const relationshipHintText = getRelationshipHintText(
    dayMaster,
    strongestElement,
    weakestElement
  );

  return {
    dayMasterText,
    monthText,
    elementBalanceText,
    timeText,
    neutralFlowText,
    moneyHintText,
    relationshipHintText,
  };
}

export function calculateManse(input: ManseInput = {}): ManseResult {
  const rawYear = toNumber(input.year);
  const rawMonth = clampMonth(toNumber(input.month));
  const rawDay = clampDay(toNumber(input.day));

  const name = input.name?.trim() || "너";
  const calendar = input.calendar || "양력";
  const gender = input.gender || "남성";
  const birthTime = input.birthTime || "";

  const fallbackDate = new Date();
  const year = rawYear || fallbackDate.getFullYear();
  const month = rawMonth || fallbackDate.getMonth() + 1;
  const day = rawDay || fallbackDate.getDate();

  const warningParts: string[] = [];

  if (!rawYear || !rawMonth || !rawDay) {
    warningParts.push(
      "생년월일 정보가 부족해서 일부 값은 현재 날짜 기준으로 임시 계산했습니다."
    );
  }

  if (calendar === "음력") {
    warningParts.push(
      "현재 manse.ts는 음력 날짜를 실제 양력으로 변환하지 않고 입력값 기준으로 계산합니다. 실제 서비스에서는 음력 변환 API 또는 전문 만세력 라이브러리 연동이 필요합니다."
    );
  }

  const yearPillar = getYearPillar(year, month, day);
  const monthPillar = getMonthPillar(yearPillar, month, day);
  const dayPillar = getDayPillar(year, month, day);
  const timePillar = getTimePillar(dayPillar, birthTime);

  const baseCounts = countElements([yearPillar, monthPillar, dayPillar, timePillar]);
  const elements = withEnglishElementKeys(baseCounts);
  const elementCounts = withEnglishElementKeys(baseCounts);

  const strongestElement = getStrongestElement(baseCounts);
  const weakestElement = getWeakestElement(baseCounts);
  const strongElements = getStrongElements(baseCounts);
  const weakElements = getWeakElements(baseCounts);

  const dayMaster = getDayMaster(dayPillar);

  const summary = buildSummary({
    dayMaster,
    monthPillar,
    timePillar,
    counts: baseCounts,
    strongestElement,
    weakestElement,
  });

  return {
    input: {
      name,
      year: rawYear,
      month: rawMonth,
      day: rawDay,
      calendar,
      birthTime,
      gender,
    },

    warning: warningParts.length > 0 ? warningParts.join(" ") : undefined,

    yearPillar,
    monthPillar,
    dayPillar,
    timePillar,

    yearStem: yearPillar.stem,
    yearBranch: yearPillar.branch,
    monthStem: monthPillar.stem,
    monthBranch: monthPillar.branch,
    dayStem: dayPillar.stem,
    dayBranch: dayPillar.branch,
    timeStem: timePillar?.stem || null,
    timeBranch: timePillar?.branch || null,

    dayMaster,

    elements,
    elementCounts,

    strongestElement,
    weakestElement,
    strongElements,
    weakElements,

    summary,
  };
}

export function formatManseForPrompt(manse: ManseResult) {
  const input = manse.input;

  const warning = manse.warning ? `\n[주의]\n${manse.warning}\n` : "";

  const timePillarText = manse.timePillar
    ? getKoreanPillar(manse.timePillar)
    : "출생시간 미입력으로 시주 없음";

  const strongElementsText = manse.strongElements.join(", ");
  const weakElementsText = manse.weakElements.join(", ");

  return `
[입력값]
- 이름/별명: ${input.name}
- 생년월일: ${input.year ?? "미입력"}년 ${input.month ?? "미입력"}월 ${input.day ?? "미입력"}일
- 음력/양력: ${input.calendar}
- 출생시간: ${input.birthTime || "모름"}
- 성별: ${input.gender}
${warning}
[사주팔자]
- 연주: ${getKoreanPillar(manse.yearPillar)}
- 월주: ${getKoreanPillar(manse.monthPillar)}
- 일주: ${getKoreanPillar(manse.dayPillar)}
- 시주: ${timePillarText}

[핵심 기준]
- 일간: ${manse.dayMaster.label}(${manse.dayMaster.stem})
- 일간 오행: ${manse.dayMaster.element}
- 일간 음양: ${manse.dayMaster.yinYang}
- 월주: ${getKoreanPillar(manse.monthPillar)}
- 월지: ${manse.monthPillar.branchKr}(${manse.monthBranch})

[오행 분포]
- 목: ${manse.elementCounts.목}
- 화: ${manse.elementCounts.화}
- 토: ${manse.elementCounts.토}
- 금: ${manse.elementCounts.금}
- 수: ${manse.elementCounts.수}

[오행 해석용 요약]
- 강한 오행: ${manse.strongestElement}
- 약한 오행: ${manse.weakestElement}
- 강한 오행 묶음: ${strongElementsText}
- 약한 오행 묶음: ${weakElementsText}

[오행 의미]
- 목: ${getElementMeaning("목")}
- 화: ${getElementMeaning("화")}
- 토: ${getElementMeaning("토")}
- 금: ${getElementMeaning("금")}
- 수: ${getElementMeaning("수")}

[사주 요약]
${manse.summary.dayMasterText}

${manse.summary.monthText}

${manse.summary.elementBalanceText}

${manse.summary.timeText}

[카테고리 공통 해석 보조]
- 전체 흐름 참고: ${manse.summary.neutralFlowText}
- 재물운 참고: ${manse.summary.moneyHintText}
- 연애운/결혼운/관계운 참고: ${manse.summary.relationshipHintText}

[중요 규칙]
- 위 명식만 사용해라.
- 연주, 월주, 일주, 시주를 새로 만들지 마라.
- 오행 숫자를 바꾸지 마라.
- 월주는 ${getKoreanPillar(manse.monthPillar)}이고, 월지는 ${manse.monthPillar.branchKr}(${manse.monthBranch})이다.
- "월지는 ${manse.monthPillar.pillarKr}"처럼 쓰면 안 된다.
- 월지는 반드시 지지 한 글자만 말해라.
`;
}

export function getElementLabel(element: ElementKey) {
  return element;
}

export function getPillarLabel(pillar: Pillar | null) {
  return getKoreanPillar(pillar);
}

export function getElementMeaningForPrompt(element: ElementKey) {
  return getElementMeaning(element);
}