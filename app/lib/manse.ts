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

export type TenGodKey =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

export type TenGodCounts = Record<TenGodKey, number>;

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

  calculationVersion: string;
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
  rawElementCounts: ElementCounts;

  strongestElement: ElementKey;
  weakestElement: ElementKey;
  strongElements: ElementKey[];
  weakElements: ElementKey[];

  dayMasterStrengthScore: number;
  dayMasterStrengthLabel: "신강" | "중화" | "신약";

  tenGods: {
    yearStem: TenGodKey;
    yearBranch: TenGodKey;
    monthStem: TenGodKey;
    monthBranch: TenGodKey;
    dayStem: TenGodKey;
    dayBranch: TenGodKey;
    timeStem: TenGodKey | null;
    timeBranch: TenGodKey | null;
    counts: TenGodCounts;
  };

  summary: {
    dayMasterText: string;
    monthText: string;
    elementBalanceText: string;
    strengthText: string;
    timeText: string;
    neutralFlowText: string;
    moneyHintText: string;
    relationshipHintText: string;
    careerHintText: string;
    healthHintText: string;
  };
};

const MANSE_CALCULATION_VERSION = "manse-weighted-hidden-stems-season-v2";

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
  甲: "갑목은 큰 나무처럼 방향을 정하면 오래 밀고 가는 힘이 있어.",
  乙: "을목은 풀과 꽃처럼 유연하고 섬세하게 적응하는 힘이 있어.",
  丙: "병화는 태양처럼 드러나고 표현하며 분위기를 밝히는 힘이 있어.",
  丁: "정화는 촛불처럼 집중력과 감각, 섬세한 표현력이 강해.",
  戊: "무토는 큰 산처럼 버티고 중심을 잡는 힘이 강해.",
  己: "기토는 논밭처럼 현실을 관리하고 사람을 돌보는 힘이 있어.",
  庚: "경금은 큰 쇠처럼 결단하고 기준을 세우는 힘이 강해.",
  辛: "신금은 보석처럼 세밀함, 완성도, 품질 감각이 강해.",
  壬: "임수는 큰 물처럼 흐름을 읽고 생각을 넓게 펼치는 힘이 있어.",
  癸: "계수는 비와 안개처럼 섬세한 감각과 깊은 관찰력이 있어.",
};

const ELEMENT_MEANING: Record<ElementKey, string> = {
  목: "성장, 시작, 방향성, 확장, 관계의 싹",
  화: "표현, 추진력, 드러남, 열정, 감정의 온도",
  토: "현실감, 책임, 기반, 돈을 담는 그릇, 생활 안정",
  금: "기준, 정리, 결단, 관리, 끊어내는 힘",
  수: "생각, 정보, 감각, 흐름 읽기, 지혜, 유연함",
};

const ELEMENT_PLAIN_LABEL: Record<ElementKey, string> = {
  목: "성장과 방향을 잡는 힘",
  화: "추진력과 표현력, 회복 리듬",
  토: "현실감과 책임감, 버티는 힘",
  금: "정리력과 판단력, 끊어내는 힘",
  수: "생각의 깊이와 회복력, 유연함",
};

const BRANCH_HIDDEN_STEMS: Record<string, Array<{ stem: string; weight: number }>> = {
  子: [{ stem: "癸", weight: 0.9 }],
  丑: [
    { stem: "己", weight: 0.55 },
    { stem: "癸", weight: 0.25 },
    { stem: "辛", weight: 0.2 },
  ],
  寅: [
    { stem: "甲", weight: 0.55 },
    { stem: "丙", weight: 0.25 },
    { stem: "戊", weight: 0.2 },
  ],
  卯: [{ stem: "乙", weight: 0.9 }],
  辰: [
    { stem: "戊", weight: 0.55 },
    { stem: "乙", weight: 0.25 },
    { stem: "癸", weight: 0.2 },
  ],
  巳: [
    { stem: "丙", weight: 0.55 },
    { stem: "戊", weight: 0.25 },
    { stem: "庚", weight: 0.2 },
  ],
  午: [
    { stem: "丁", weight: 0.7 },
    { stem: "己", weight: 0.25 },
  ],
  未: [
    { stem: "己", weight: 0.55 },
    { stem: "丁", weight: 0.25 },
    { stem: "乙", weight: 0.2 },
  ],
  申: [
    { stem: "庚", weight: 0.55 },
    { stem: "壬", weight: 0.25 },
    { stem: "戊", weight: 0.2 },
  ],
  酉: [{ stem: "辛", weight: 0.9 }],
  戌: [
    { stem: "戊", weight: 0.55 },
    { stem: "辛", weight: 0.25 },
    { stem: "丁", weight: 0.2 },
  ],
  亥: [
    { stem: "壬", weight: 0.65 },
    { stem: "甲", weight: 0.25 },
  ],
};

const MONTH_SEASON_BONUS: Record<string, Partial<Record<ElementKey, number>>> = {
  寅: { 목: 1.3, 화: 0.25 },
  卯: { 목: 1.5 },
  辰: { 토: 1.0, 목: 0.25, 수: 0.15 },
  巳: { 화: 1.3, 토: 0.25 },
  午: { 화: 1.5 },
  未: { 토: 1.0, 화: 0.25, 목: 0.15 },
  申: { 금: 1.3, 수: 0.25 },
  酉: { 금: 1.5 },
  戌: { 토: 1.0, 금: 0.25, 화: 0.15 },
  亥: { 수: 1.3, 목: 0.25 },
  子: { 수: 1.5 },
  丑: { 토: 1.0, 수: 0.25, 금: 0.15 },
};

const ELEMENT_GENERATES: Record<ElementKey, ElementKey> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

const ELEMENT_CONTROLS: Record<ElementKey, ElementKey> = {
  목: "토",
  화: "금",
  토: "수",
  금: "목",
  수: "화",
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
  // 간이 계산: 입춘을 2월 4일로 고정.
  // 상용 단계에서는 실제 절기 시각 계산 또는 전문 만세력 API로 교체 권장.
  if (month < 2) return year - 1;
  if (month === 2 && day < 4) return year - 1;
  return year;
}

function getYearPillar(year: number, month: number, day: number) {
  const sajuYear = getSolarYearForSaju(year, month, day);
  const offset = sajuYear - 1984;
  return makePillar(getStem(offset), getBranch(offset));
}

function getMonthBranchIndex(month: number, day: number) {
  // 간이 절기 기준. 실제 절기 시간은 전문 라이브러리/API 연동 권장.
  if (month === 1) return day >= 6 ? 1 : 0;
  if (month === 2) return day >= 4 ? 2 : 1;
  if (month === 3) return day >= 6 ? 3 : 2;
  if (month === 4) return day >= 5 ? 4 : 3;
  if (month === 5) return day >= 6 ? 5 : 4;
  if (month === 6) return day >= 6 ? 6 : 5;
  if (month === 7) return day >= 7 ? 7 : 6;
  if (month === 8) return day >= 8 ? 8 : 7;
  if (month === 9) return day >= 8 ? 9 : 8;
  if (month === 10) return day >= 8 ? 10 : 9;
  if (month === 11) return day >= 7 ? 11 : 10;
  if (month === 12) return day >= 7 ? 0 : 11;
  return 2;
}

function getMonthStemIndex(yearStem: string, monthBranchIndex: number) {
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem as any);
  let tigerMonthStemIndex = 2;

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
  // 간이 안정 계산.
  // 1900-01-31을 甲辰 기준으로 잡고 60갑자 순환.
  // 상용 단계에서는 검증된 만세력 API 또는 라이브러리로 교체 권장.
  const base = Date.UTC(1900, 0, 31);
  const target = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((target - base) / 86400000);
  return makePillar(getStem(diffDays), getBranch(4 + diffDays));
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

function roundElementCounts(counts: Record<ElementKey, number>) {
  return {
    목: Math.round(counts.목 * 10) / 10,
    화: Math.round(counts.화 * 10) / 10,
    토: Math.round(counts.토 * 10) / 10,
    금: Math.round(counts.금 * 10) / 10,
    수: Math.round(counts.수 * 10) / 10,
  } as Record<ElementKey, number>;
}

function countElements(pillars: Array<Pillar | null>, monthPillar?: Pillar) {
  const counts = createEmptyElementCount();

  pillars.forEach((pillar, index) => {
    if (!pillar) return;

    const pillarWeight = index === 1 ? 1.35 : index === 2 ? 1.2 : index === 3 ? 0.9 : 1;

    addElement(counts, pillar.stemElement, 1 * pillarWeight);
    addElement(counts, pillar.branchElement, 0.9 * pillarWeight);

    const hidden = BRANCH_HIDDEN_STEMS[pillar.branch] || [];
    hidden.forEach((item) => {
      const element = STEM_ELEMENT[item.stem];
      if (element) addElement(counts, element, item.weight * pillarWeight);
    });
  });

  if (monthPillar) {
    const seasonBonus = MONTH_SEASON_BONUS[monthPillar.branch] || {};
    Object.entries(seasonBonus).forEach(([element, amount]) => {
      addElement(counts, element as ElementKey, amount || 0);
    });
  }

  return roundElementCounts(counts);
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

function getElementPlainLabel(element: ElementKey) {
  return ELEMENT_PLAIN_LABEL[element];
}

function getTenGod(dayStem: string, targetStem: string): TenGodKey {
  const dayElement = STEM_ELEMENT[dayStem];
  const targetElement = STEM_ELEMENT[targetStem];
  const dayYinYang = STEM_YINYANG[dayStem];
  const targetYinYang = STEM_YINYANG[targetStem];
  const sameYinYang = dayYinYang === targetYinYang;

  if (targetElement === dayElement) return sameYinYang ? "비견" : "겁재";
  if (ELEMENT_GENERATES[dayElement] === targetElement) return sameYinYang ? "식신" : "상관";
  if (ELEMENT_CONTROLS[dayElement] === targetElement) return sameYinYang ? "편재" : "정재";
  if (ELEMENT_CONTROLS[targetElement] === dayElement) return sameYinYang ? "편관" : "정관";
  if (ELEMENT_GENERATES[targetElement] === dayElement) return sameYinYang ? "편인" : "정인";

  return "비견";
}

function createEmptyTenGodCounts(): TenGodCounts {
  return {
    비견: 0,
    겁재: 0,
    식신: 0,
    상관: 0,
    편재: 0,
    정재: 0,
    편관: 0,
    정관: 0,
    편인: 0,
    정인: 0,
  };
}

function getBranchMainStem(branch: string) {
  const hidden = BRANCH_HIDDEN_STEMS[branch] || [];
  return hidden[0]?.stem || "戊";
}

function calculateTenGods(dayPillar: Pillar, yearPillar: Pillar, monthPillar: Pillar, timePillar: Pillar | null) {
  const dayStem = dayPillar.stem;
  const yearStemGod = getTenGod(dayStem, yearPillar.stem);
  const yearBranchGod = getTenGod(dayStem, getBranchMainStem(yearPillar.branch));
  const monthStemGod = getTenGod(dayStem, monthPillar.stem);
  const monthBranchGod = getTenGod(dayStem, getBranchMainStem(monthPillar.branch));
  const dayStemGod = getTenGod(dayStem, dayPillar.stem);
  const dayBranchGod = getTenGod(dayStem, getBranchMainStem(dayPillar.branch));
  const timeStemGod = timePillar ? getTenGod(dayStem, timePillar.stem) : null;
  const timeBranchGod = timePillar ? getTenGod(dayStem, getBranchMainStem(timePillar.branch)) : null;

  const counts = createEmptyTenGodCounts();
  [yearStemGod, yearBranchGod, monthStemGod, monthBranchGod, dayStemGod, dayBranchGod, timeStemGod, timeBranchGod]
    .filter(Boolean)
    .forEach((god) => {
      counts[god as TenGodKey] += 1;
    });

  return {
    yearStem: yearStemGod,
    yearBranch: yearBranchGod,
    monthStem: monthStemGod,
    monthBranch: monthBranchGod,
    dayStem: dayStemGod,
    dayBranch: dayBranchGod,
    timeStem: timeStemGod,
    timeBranch: timeBranchGod,
    counts,
  };
}

function calculateDayMasterStrength(dayMaster: DayMaster, counts: Record<ElementKey, number>, monthPillar: Pillar) {
  const selfElement = dayMaster.element;
  const resourceElement = Object.entries(ELEMENT_GENERATES).find(([, generated]) => generated === selfElement)?.[0] as ElementKey;
  const seasonElement = monthPillar.branchElement;

  let score = 0;
  score += counts[selfElement] * 1.15;
  score += counts[resourceElement] * 0.8;
  if (seasonElement === selfElement) score += 2.2;
  if (seasonElement === resourceElement) score += 1.1;

  const rounded = Math.round(score * 10) / 10;
  const label = rounded >= 7.5 ? "신강" : rounded >= 5.2 ? "중화" : "신약";

  return { score: rounded, label: label as "신강" | "중화" | "신약" };
}

function getNeutralFlowText(strongest: ElementKey, weakest: ElementKey) {
  return `좋게 타고난 힘은 ${getElementPlainLabel(strongest)} 쪽으로 많이 드러나고, 반복해서 보완해야 할 부분은 ${getElementPlainLabel(weakest)} 쪽으로 잡혀 있어.`;
}

function getMoneyHintText(strongest: ElementKey, weakest: ElementKey, tenGods: TenGodCounts) {
  const wealthScore = tenGods.편재 + tenGods.정재;
  const expressionScore = tenGods.식신 + tenGods.상관;

  let first = "돈은 한 번에 크게 잡는 것보다 들어오는 방식과 새는 구조를 같이 봐야 해.";

  if (wealthScore >= 3) first = "돈을 현실적으로 잡고 계산하는 감각이 비교적 뚜렷하게 들어와 있어.";
  if (expressionScore >= 3) first = "내가 가진 기술, 말, 판매력, 표현력을 돈으로 바꾸는 흐름이 살아나기 쉬워.";
  if (strongest === "토") first = "현실감과 책임감이 강해서 돈을 담을 그릇을 만들 수 있는 편이야.";
  if (strongest === "수") first = "정보와 흐름을 읽는 감각을 돈으로 연결할 때 재물 흐름이 살아나기 쉬워.";

  let second = "다만 돈이 남으려면 기준 없이 나가는 지출을 줄여야 해.";
  if (weakest === "금") second = "다만 정리력과 끊어내는 기준이 약하면 새는 돈을 놓치기 쉬워.";
  if (weakest === "화") second = "다만 추진력과 표현력이 약하게 잡히면 좋은 기회가 와도 행동이 늦어질 수 있어.";
  if (weakest === "토") second = "다만 생활 기반과 돈을 담는 구조가 약하면 들어와도 오래 남기기 어려워.";

  return `${first} ${second}`;
}

function getRelationshipHintText(dayMaster: DayMaster, strongest: ElementKey, weakest: ElementKey) {
  let first = "관계에서는 상대와 나의 속도 차이를 보는 게 중요해.";

  if (dayMaster.element === "목") first = "관계에서는 성장감과 방향이 맞는 사람에게 마음이 움직이기 쉬워.";
  if (dayMaster.element === "화") first = "관계에서는 표현, 반응, 감정의 온도가 중요하게 작용해.";
  if (dayMaster.element === "토") first = "관계에서는 안정감, 책임, 생활 균형을 중요하게 보는 편이야.";
  if (dayMaster.element === "금") first = "관계에서는 신뢰, 기준, 말과 행동의 일치가 중요하게 작용해.";
  if (dayMaster.element === "수") first = "관계에서는 감정의 흐름, 생각의 깊이, 편안한 소통이 중요해.";

  return `${first} 자주 드러나는 힘은 ${getElementPlainLabel(strongest)} 쪽이고, 관계에서 보완해야 할 부분은 ${getElementPlainLabel(weakest)} 쪽이야.`;
}

function getCareerHintText(tenGods: TenGodCounts, strongest: ElementKey) {
  const output = tenGods.식신 + tenGods.상관;
  const wealth = tenGods.편재 + tenGods.정재;
  const authority = tenGods.편관 + tenGods.정관;
  const resource = tenGods.편인 + tenGods.정인;

  if (wealth >= 3 && output >= 2) return "일은 직접 수익 구조를 만들거나 판매·기획·실행을 연결할 때 잘 살아나는 편이야.";
  if (authority >= 3) return "일은 책임, 규칙, 조직, 관리 구조 안에서 성과를 만들기 쉬운 편이야.";
  if (output >= 3) return "일은 말, 기술, 콘텐츠, 표현, 생산성을 밖으로 꺼낼 때 흐름이 살아나.";
  if (resource >= 3) return "일은 공부, 자격, 분석, 상담, 정리된 지식을 쌓아갈 때 강해져.";
  if (strongest === "토") return "일은 현실감, 관리력, 책임감을 돈이나 역할로 바꿀 때 안정돼.";
  return "일은 한 가지 이름보다 어떤 방식으로 돈과 역할이 만들어지는지 봐야 해.";
}

function getHealthHintText(strongest: ElementKey, weakest: ElementKey) {
  const weakLabel = getElementPlainLabel(weakest);
  if (weakest === "화") return "건강 흐름은 추진력과 회복 리듬이 약하게 잡힐 수 있어서 수면, 피로 누적, 몸을 따뜻하게 돌리는 습관을 봐야 해.";
  if (weakest === "토") return "건강 흐름은 생활 리듬과 소화·위장·장 컨디션을 꾸준히 봐야 안정돼.";
  if (weakest === "금") return "건강 흐름은 호흡, 피부, 정리되지 않은 긴장감, 몸의 건조함을 조심해야 해.";
  if (weakest === "수") return "건강 흐름은 회복력, 수면, 순환, 몸 안의 수분 리듬을 챙겨야 해.";
  if (weakest === "목") return "건강 흐름은 스트레칭, 간장한 긴장감, 방향 없이 쌓이는 답답함을 풀어줘야 해.";
  return `건강 흐름은 ${weakLabel} 쪽을 보완하는 생활 리듬이 중요해.`;
}

function buildSummary(params: {
  dayMaster: DayMaster;
  monthPillar: Pillar;
  timePillar: Pillar | null;
  counts: Record<ElementKey, number>;
  strongestElement: ElementKey;
  weakestElement: ElementKey;
  dayMasterStrengthScore: number;
  dayMasterStrengthLabel: "신강" | "중화" | "신약";
  tenGodCounts: TenGodCounts;
}) {
  const {
    dayMaster,
    monthPillar,
    timePillar,
    counts,
    strongestElement,
    weakestElement,
    dayMasterStrengthScore,
    dayMasterStrengthLabel,
    tenGodCounts,
  } = params;

  const dayMasterText = `일간은 ${dayMaster.label}(${dayMaster.stem})이야. ${dayMaster.description}`;
  const monthText = `월주는 ${monthPillar.pillarKr}(${monthPillar.pillar})이고, 월지는 ${monthPillar.branchKr}(${monthPillar.branch})야. 월지는 계절감, 사회적 환경, 기본 흐름을 보는 핵심 자리야.`;
  const elementBalanceText = `사주 흐름 분포는 목 ${counts.목}, 화 ${counts.화}, 토 ${counts.토}, 금 ${counts.금}, 수 ${counts.수}로 잡혀 있어. 가장 많이 드러나는 흐름은 ${strongestElement}, 반복해서 보완해야 할 흐름은 ${weakestElement} 쪽이야.`;
  const strengthText = `일간 힘은 ${dayMasterStrengthScore}점 기준으로 ${dayMasterStrengthLabel} 쪽으로 본다. 이 값은 월지 계절감, 같은 흐름, 도와주는 흐름을 함께 본 간이 판정이야.`;

  const timeText = timePillar
    ? `시주는 ${timePillar.pillarKr}(${timePillar.pillar})로 잡혀 있어. 시주는 말년 흐름, 깊은 속마음, 결과물의 자리로 참고해.`
    : "출생시간이 없어서 시주는 계산하지 않았어. 그래서 말년 흐름, 깊은 내면, 결과물 해석은 조심스럽게 봐야 해.";

  return {
    dayMasterText,
    monthText,
    elementBalanceText,
    strengthText,
    timeText,
    neutralFlowText: getNeutralFlowText(strongestElement, weakestElement),
    moneyHintText: getMoneyHintText(strongestElement, weakestElement, tenGodCounts),
    relationshipHintText: getRelationshipHintText(dayMaster, strongestElement, weakestElement),
    careerHintText: getCareerHintText(tenGodCounts, strongestElement),
    healthHintText: getHealthHintText(strongestElement, weakestElement),
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

  // 입력 누락 시 현재 날짜가 아니라 고정 기준값을 사용한다.
  // 현재 날짜를 쓰면 테스트 때 사용자가 모르는 사주가 생성되어 결과가 흔들린다.
  const fallbackYear = 1990;
  const fallbackMonth = 1;
  const fallbackDay = 1;

  const year = rawYear || fallbackYear;
  const month = rawMonth || fallbackMonth;
  const day = rawDay || fallbackDay;

  const warningParts: string[] = [];

  if (!rawYear || !rawMonth || !rawDay) {
    warningParts.push("생년월일 정보가 부족해서 1990년 1월 1일 기준으로 임시 계산했습니다. 실제 풀이에서는 생년월일을 정확히 입력해야 합니다.");
  }

  if (calendar === "음력") {
    warningParts.push("현재 manse.ts는 음력 날짜를 실제 양력으로 변환하지 않고 입력값 기준으로 계산합니다. 실제 서비스에서는 음력 변환 API 또는 전문 만세력 라이브러리 연동이 필요합니다.");
  }

  const yearPillar = getYearPillar(year, month, day);
  const monthPillar = getMonthPillar(yearPillar, month, day);
  const dayPillar = getDayPillar(year, month, day);
  const timePillar = getTimePillar(dayPillar, birthTime);

  const baseCounts = countElements([yearPillar, monthPillar, dayPillar, timePillar], monthPillar);
  const elements = withEnglishElementKeys(baseCounts);
  const elementCounts = withEnglishElementKeys(baseCounts);
  const rawElementCounts = withEnglishElementKeys(baseCounts);

  const strongestElement = getStrongestElement(baseCounts);
  const weakestElement = getWeakestElement(baseCounts);
  const strongElements = getStrongElements(baseCounts);
  const weakElements = getWeakElements(baseCounts);
  const dayMaster = getDayMaster(dayPillar);
  const strength = calculateDayMasterStrength(dayMaster, baseCounts, monthPillar);
  const tenGods = calculateTenGods(dayPillar, yearPillar, monthPillar, timePillar);

  const summary = buildSummary({
    dayMaster,
    monthPillar,
    timePillar,
    counts: baseCounts,
    strongestElement,
    weakestElement,
    dayMasterStrengthScore: strength.score,
    dayMasterStrengthLabel: strength.label,
    tenGodCounts: tenGods.counts,
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

    calculationVersion: MANSE_CALCULATION_VERSION,
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
    rawElementCounts,

    strongestElement,
    weakestElement,
    strongElements,
    weakElements,

    dayMasterStrengthScore: strength.score,
    dayMasterStrengthLabel: strength.label,

    tenGods,
    summary,
  };
}

export function formatManseForPrompt(manse: ManseResult) {
  const input = manse.input;
  const warning = manse.warning ? `\n[주의]\n${manse.warning}\n` : "";

  const timePillarText = manse.timePillar ? getKoreanPillar(manse.timePillar) : "출생시간 미입력으로 시주 없음";
  const strongElementsText = manse.strongElements.join(", ");
  const weakElementsText = manse.weakElements.join(", ");
  const tenGodCountText = Object.entries(manse.tenGods.counts)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  return `
[만세력 계산 버전]
${manse.calculationVersion}

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
- 일간 힘: ${manse.dayMasterStrengthScore}점 / ${manse.dayMasterStrengthLabel}
- 월주: ${getKoreanPillar(manse.monthPillar)}
- 월지: ${manse.monthPillar.branchKr}(${manse.monthBranch})

[가중 오행 분포]
- 목: ${manse.elementCounts.목}
- 화: ${manse.elementCounts.화}
- 토: ${manse.elementCounts.토}
- 금: ${manse.elementCounts.금}
- 수: ${manse.elementCounts.수}

[오행 해석용 요약]
- 가장 많이 드러나는 흐름: ${manse.strongestElement} / ${getElementPlainLabel(manse.strongestElement)}
- 반복해서 보완할 흐름: ${manse.weakestElement} / ${getElementPlainLabel(manse.weakestElement)}
- 강한 흐름 묶음: ${strongElementsText}
- 약한 흐름 묶음: ${weakElementsText}

[십성 요약]
- 연간: ${manse.tenGods.yearStem}
- 연지: ${manse.tenGods.yearBranch}
- 월간: ${manse.tenGods.monthStem}
- 월지: ${manse.tenGods.monthBranch}
- 일간: ${manse.tenGods.dayStem}
- 일지: ${manse.tenGods.dayBranch}
- 시간: ${manse.tenGods.timeStem || "없음"}
- 시지: ${manse.tenGods.timeBranch || "없음"}

[십성 개수]
${tenGodCountText}

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

${manse.summary.strengthText}

${manse.summary.timeText}

[카테고리 공통 해석 보조]
- 전체 흐름 참고: ${manse.summary.neutralFlowText}
- 재물운 참고: ${manse.summary.moneyHintText}
- 직업/사업운 참고: ${manse.summary.careerHintText}
- 연애운/결혼운/관계운 참고: ${manse.summary.relationshipHintText}
- 건강운 참고: ${manse.summary.healthHintText}

[중요 규칙]
- 위 명식만 사용해라.
- 연주, 월주, 일주, 시주를 새로 만들지 마라.
- 오행 숫자와 십성 개수를 바꾸지 마라.
- 월주는 ${getKoreanPillar(manse.monthPillar)}이고, 월지는 ${manse.monthPillar.branchKr}(${manse.monthBranch})이다.
- "월지는 ${manse.monthPillar.pillarKr}"처럼 쓰면 안 된다.
- 월지는 반드시 지지 한 글자만 말해라.
- 전문 절기 시각, 음력 변환, 대운 계산은 아직 간이 버전이다. 확정적인 연도 단정은 하지 마라.
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

export function getElementPlainLabelForPrompt(element: ElementKey) {
  return getElementPlainLabel(element);
}
