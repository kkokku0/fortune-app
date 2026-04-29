export type CalendarType = "양력" | "음력";
export type GenderType = "남성" | "여성";

export type ManseInput = {
  year?: string;
  month?: string;
  day?: string;
  calendar?: CalendarType;
  birthTime?: string;
  gender?: GenderType;
};

export type FiveElements = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type ManseResult = {
  isApproximate: boolean;
  notice: string;
  solarDate: {
    year: number;
    month: number;
    day: number;
  };
  calendar: CalendarType;
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  dayMaster: {
    stem: string;
    element: string;
    yinYang: string;
    label: string;
  };
  fiveElements: FiveElements;
  strongestElement: string;
  weakestElement: string;
  fiveElementsText: string;
  summary: string;
};

const heavenlyStems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const earthlyBranches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

const stemElements: Record<string, { element: string; yinYang: string; label: string }> = {
  갑: { element: "목", yinYang: "양", label: "갑목" },
  을: { element: "목", yinYang: "음", label: "을목" },
  병: { element: "화", yinYang: "양", label: "병화" },
  정: { element: "화", yinYang: "음", label: "정화" },
  무: { element: "토", yinYang: "양", label: "무토" },
  기: { element: "토", yinYang: "음", label: "기토" },
  경: { element: "금", yinYang: "양", label: "경금" },
  신: { element: "금", yinYang: "음", label: "신금" },
  임: { element: "수", yinYang: "양", label: "임수" },
  계: { element: "수", yinYang: "음", label: "계수" },
};

const branchElements: Record<string, string> = {
  자: "수",
  축: "토",
  인: "목",
  묘: "목",
  진: "토",
  사: "화",
  오: "화",
  미: "토",
  신: "금",
  유: "금",
  술: "토",
  해: "수",
};

const elementKeyMap: Record<string, keyof FiveElements> = {
  목: "wood",
  화: "fire",
  토: "earth",
  금: "metal",
  수: "water",
};

const elementKoreanMap: Record<keyof FiveElements, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function getGanji(index: number) {
  const stem = heavenlyStems[mod(index, 10)];
  const branch = earthlyBranches[mod(index, 12)];
  return `${stem}${branch}`;
}

function addElementCount(target: FiveElements, element: string, amount = 1) {
  const key = elementKeyMap[element];
  if (!key) return;
  target[key] += amount;
}

function parseHourBranch(birthTime?: string) {
  const value = birthTime || "";

  if (value.includes("자시")) return "자";
  if (value.includes("축시")) return "축";
  if (value.includes("인시")) return "인";
  if (value.includes("묘시")) return "묘";
  if (value.includes("진시")) return "진";
  if (value.includes("사시")) return "사";
  if (value.includes("오시")) return "오";
  if (value.includes("미시")) return "미";
  if (value.includes("신시")) return "신";
  if (value.includes("유시")) return "유";
  if (value.includes("술시")) return "술";
  if (value.includes("해시")) return "해";

  return "시주미상";
}

function getYearPillar(year: number) {
  // 1984년 갑자년 기준
  return getGanji(year - 1984);
}

function getDayPillar(year: number, month: number, day: number) {
  // 1900-01-31을 갑자일로 놓는 간이 기준.
  // 실제 서비스 고도화 시 검증된 만세력 엔진으로 교체 권장.
  const base = Date.UTC(1900, 0, 31);
  const target = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((target - base) / 86400000);
  return getGanji(diffDays);
}

function getMonthPillar(year: number, month: number) {
  // 간이 월주.
  // 실제 월주는 절기 기준이므로 정확한 만세력 라이브러리로 교체 권장.
  const monthBranchBySolarMonth = ["축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자"];
  const branch = monthBranchBySolarMonth[mod(month - 1, 12)];

  const yearStem = heavenlyStems[mod(year - 4, 10)];
  const startStemMap: Record<string, number> = {
    갑: 2,
    기: 2,
    을: 4,
    경: 4,
    병: 6,
    신: 6,
    정: 8,
    임: 8,
    무: 0,
    계: 0,
  };

  const startStemIndex = startStemMap[yearStem] ?? 2;
  const stem = heavenlyStems[mod(startStemIndex + month - 1, 10)];

  return `${stem}${branch}`;
}

function getHourPillar(dayPillar: string, birthTime?: string) {
  const branch = parseHourBranch(birthTime);

  if (branch === "시주미상") {
    return "시주미상";
  }

  const dayStem = dayPillar[0];
  const branchIndex = earthlyBranches.indexOf(branch);

  const startStemMap: Record<string, number> = {
    갑: 0,
    기: 0,
    을: 2,
    경: 2,
    병: 4,
    신: 4,
    정: 6,
    임: 6,
    무: 8,
    계: 8,
  };

  const startStemIndex = startStemMap[dayStem] ?? 0;
  const stem = heavenlyStems[mod(startStemIndex + branchIndex, 10)];

  return `${stem}${branch}`;
}

function countElementsFromPillar(pillar: string, counts: FiveElements) {
  if (!pillar || pillar === "시주미상") return;

  const stem = pillar[0];
  const branch = pillar[1];

  const stemElement = stemElements[stem]?.element;
  const branchElement = branchElements[branch];

  if (stemElement) addElementCount(counts, stemElement, 1);
  if (branchElement) addElementCount(counts, branchElement, 1);
}

function getStrongestAndWeakest(counts: FiveElements) {
  const entries = Object.entries(counts) as Array<[keyof FiveElements, number]>;

  const strongest = [...entries].sort((a, b) => b[1] - a[1])[0]?.[0] || "wood";
  const weakest = [...entries].sort((a, b) => a[1] - b[1])[0]?.[0] || "water";

  return {
    strongestElement: elementKoreanMap[strongest],
    weakestElement: elementKoreanMap[weakest],
  };
}

function buildSummary(strongest: string, weakest: string, dayMasterLabel: string) {
  return `일간은 ${dayMasterLabel}이며, 오행 분포상 ${strongest}의 기운이 비교적 강하고 ${weakest}의 기운은 보완이 필요한 흐름으로 계산됩니다.`;
}

export function calculateManse(input: ManseInput): ManseResult {
  const year = toNumber(input.year, 1990);
  const month = Math.min(Math.max(toNumber(input.month, 1), 1), 12);
  const day = Math.min(Math.max(toNumber(input.day, 1), 1), 31);
  const calendar = input.calendar || "양력";

  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(dayPillar, input.birthTime);

  const counts: FiveElements = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  [yearPillar, monthPillar, dayPillar, hourPillar].forEach((pillar) => {
    countElementsFromPillar(pillar, counts);
  });

  const dayStem = dayPillar[0];
  const dayMaster = stemElements[dayStem] || {
    element: "미상",
    yinYang: "미상",
    label: "미상",
  };

  const { strongestElement, weakestElement } = getStrongestAndWeakest(counts);

  const fiveElementsText = `목 ${counts.wood}, 화 ${counts.fire}, 토 ${counts.earth}, 금 ${counts.metal}, 수 ${counts.water}`;

  return {
    isApproximate: true,
    notice:
      "현재 계산은 MVP용 간이 만세력입니다. 절기 기반 월주와 음력 변환은 추후 전용 만세력 엔진으로 교체하는 것을 권장합니다.",
    solarDate: {
      year,
      month,
      day,
    },
    calendar,
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    dayMaster: {
      stem: dayStem,
      element: dayMaster.element,
      yinYang: dayMaster.yinYang,
      label: dayMaster.label,
    },
    fiveElements: counts,
    strongestElement,
    weakestElement,
    fiveElementsText,
    summary: buildSummary(strongestElement, weakestElement, dayMaster.label),
  };
}

export function formatManseForPrompt(manse: ManseResult) {
  return `
계산된 만세력 정보:
- 계산 방식: ${manse.isApproximate ? "MVP용 간이 계산" : "정밀 계산"}
- 안내: ${manse.notice}
- 기준 날짜: ${manse.solarDate.year}년 ${manse.solarDate.month}월 ${manse.solarDate.day}일 (${manse.calendar})
- 년주: ${manse.pillars.year}
- 월주: ${manse.pillars.month}
- 일주: ${manse.pillars.day}
- 시주: ${manse.pillars.hour}
- 일간: ${manse.dayMaster.label}
- 일간 오행: ${manse.dayMaster.element}
- 일간 음양: ${manse.dayMaster.yinYang}
- 오행 분포: ${manse.fiveElementsText}
- 강하게 잡히는 기운: ${manse.strongestElement}
- 보완이 필요한 기운: ${manse.weakestElement}
- 요약: ${manse.summary}
`;
}