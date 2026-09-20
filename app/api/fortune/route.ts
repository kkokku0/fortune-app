// SOREUM ROUTE V176 - 2026-08-30
// 전 카테고리 무료 웹툰 장면 엔진 + 도훈 전체 이미지 풀 연동 준비본
// 속궁합 본문 실제 교체본: 주도권·패턴·밀착 방식·자세 성향·여운 포함
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { calculateManse, formatManseForPrompt } from "../../lib/manse";

const KoreanLunarCalendarModule = require("korean-lunar-calendar");

type KoreanLunarCalendarInstance = {
  setLunarDate: (
    year: number,
    month: number,
    day: number,
    isLeapMonth: boolean,
  ) => boolean;
  getSolarCalendar?: () => {
    year: number | string;
    month: number | string;
    day: number | string;
  };
  getSolarIsoFormat?: () => string;
};

type KoreanLunarCalendarConstructor = new () => KoreanLunarCalendarInstance;

function getKoreanLunarCalendarModuleCandidates() {
  const moduleAny = KoreanLunarCalendarModule as any;

  return [
    moduleAny?.default?.KoreanLunarCalendar,
    moduleAny?.default?.default,
    moduleAny?.default,
    moduleAny?.KoreanLunarCalendar?.KoreanLunarCalendar,
    moduleAny?.KoreanLunarCalendar?.default,
    moduleAny?.KoreanLunarCalendar,
    moduleAny,
  ];
}

function resolveKoreanLunarCalendarConstructor(): KoreanLunarCalendarConstructor | null {
  for (const candidate of getKoreanLunarCalendarModuleCandidates()) {
    if (typeof candidate === "function") {
      return candidate as KoreanLunarCalendarConstructor;
    }
  }

  return null;
}

function createKoreanLunarCalendar() {
  const Constructor = resolveKoreanLunarCalendarConstructor();

  if (Constructor) {
    return new Constructor();
  }

  for (const candidate of getKoreanLunarCalendarModuleCandidates()) {
    if (!candidate || typeof candidate !== "object") continue;

    if (typeof (candidate as any).getInstance === "function") {
      return (candidate as any).getInstance() as KoreanLunarCalendarInstance;
    }

    if (typeof (candidate as any).setLunarDate === "function") {
      return candidate as KoreanLunarCalendarInstance;
    }
  }

  const moduleAny = KoreanLunarCalendarModule as any;

  console.error("korean-lunar-calendar 사용 가능한 생성 방식이 없습니다.", {
    moduleType: typeof moduleAny,
    moduleKeys:
      moduleAny && typeof moduleAny === "object" ? Object.keys(moduleAny) : [],
    defaultType: typeof moduleAny?.default,
    defaultKeys:
      moduleAny?.default && typeof moduleAny.default === "object"
        ? Object.keys(moduleAny.default)
        : [],
    koreanLunarCalendarType: typeof moduleAny?.KoreanLunarCalendar,
    koreanLunarCalendarKeys:
      moduleAny?.KoreanLunarCalendar &&
      typeof moduleAny.KoreanLunarCalendar === "object"
        ? Object.keys(moduleAny.KoreanLunarCalendar)
        : [],
  });

  throw new Error("korean-lunar-calendar 생성 방식 확인 실패");
}

function readSolarFromKoreanLunarCalendar(
  calendar: KoreanLunarCalendarInstance,
) {
  if (typeof calendar.getSolarCalendar === "function") {
    const solar = calendar.getSolarCalendar();

    return {
      year: String(Number(solar.year)),
      month: String(Number(solar.month)),
      day: String(Number(solar.day)),
    };
  }

  if (typeof calendar.getSolarIsoFormat === "function") {
    const iso = calendar.getSolarIsoFormat();
    const [year, month, day] = iso.split("-");

    return {
      year: String(Number(year)),
      month: String(Number(month)),
      day: String(Number(day)),
    };
  }

  throw new Error("korean-lunar-calendar 양력 결과 함수를 찾지 못했습니다.");
}

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
  name?: string;
  year?: string;
  month?: string;
  day?: string;
  calendar?: "양력" | "음력";
  lunarLeapMonth?: boolean;
  birthTime?: string;
  gender?: "남성" | "여성";
  maritalStatus?: "미혼" | "연애중" | "기혼" | "이혼/재혼 고민" | "비공개";
  repeatGhostAnswers?: {
    money?: string;
    work?: string;
    relationship?: string;
    blocked?: string;
    regret?: string;
    category?: string;
  };
  repeatGhostType?: string;
  question?: string;
  compatibilityType?: "연인/배우자 궁합" | "사업파트너 궁합";
  partnerName?: string;
  partnerYear?: string;
  partnerMonth?: string;
  partnerDay?: string;
  partnerCalendar?: "양력" | "음력";
  partnerLunarLeapMonth?: boolean;
  partnerBirthTime?: string;
  partnerGender?: "남성" | "여성";
};

type FortuneRequest = {
  mode?: "preview" | "full" | "both" | "worry_followup";
  user?: UserInfo;
  categoryId?: CategoryId;
  categoryTitle?: string;
  question?: string;
  worry?: string;
  concern?: string;
  customQuestion?: string;
  questionText?: string;
  message?: string;
  text?: string;
  input?: string;
};

type Grade = "상" | "중상" | "중" | "중하" | "하";


type ScoreMetric = {
  key: string;
  label: string;
  score: number;
  verdict: string;
  description: string;
};

type ImageVisualTags = {
  gender: "male" | "female";
  mood: "clean" | "sexy" | "innocent" | "confident" | "warm" | "cold" | "professional" | "active";
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

type RelationshipScoreVisual = LoveMarriageScoreVisual | CompatibilityScoreVisual | null;

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
    grade: Grade;
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
};

type CareerWebtoonScene = {
  id: string;
  order: number;
  sceneKey: string;
  /** 실제 파일명이 아니라 page.tsx가 전체 도훈 이미지 풀에서 장면에 맞는 사진을 고를 때 쓰는 의미 키 */
  dohoonImageKey?: "opening" | "thinking" | "analysis" | "reveal" | "warning" | "decision" | "guide" | "confidence" | "future" | "mystery" | "ending";
  /** 장면 긴장도. 1은 도입, 5는 최고조/클리프행어 */
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

type CareerWebtoonStoryType =
  | "organization-rise"
  | "own-board"
  | "hybrid-build"
  | "expert-value"
  | "trade-sales"
  | "leader-control";

type CategoryPreviewProfile =
  | {
      kind: "today";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
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
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "money";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
      version: string;
      capacityGrade: Grade;
      capacityRange: string;
      utilization: number;
      primaryStyle: string;
      blocker: string;
      firstWindow: string;
      peakWindow: string;
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "career";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
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
      storyType: CareerWebtoonStoryType;
      webtoonScenes: CareerWebtoonScene[];
      freeHeadline?: string;
      freeBody?: string;
      curiosityHook?: string;
      top3?: Array<{ rank: number; label: string; body: string }>;
    }
  | {
      kind: "love";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
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
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "health";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
      version: string;
      grade: Grade;
      overallScore: number;
      metrics: PreviewScoreItem[];
      primaryWeakness: string;
      firstSignal: string;
      avoidHabit: string;
      recoveryAction: string;
      cautionWindow: string;
      medicalNotice: string;

      /**
       * v178 건강운 무료 세로 스크롤 전용 데이터.
       * page.tsx에서 카드 7개가 아니라 긴 한 페이지 스토리 + 그래프 + 잠금 구조로 렌더링한다.
       */
      /**
       * v179 건강운 유료 리포트.
       * 20페이지/사주극장 형식을 쓰지 않고 OPENING + PART 01~05 + FINAL로 렌더링한다.
       * 기존 건강운 원문의 내용 축을 유지하면서 화면용 데이터만 구조화한다.
       */
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
          food: {
            verdict: string;
            recommended: string[];
            reduce: string[];
            body: string;
          };
          rhythm: {
            verdict: string;
            actions: string[];
            body: string;
          };
          exercise: {
            verdict: string;
            items: Array<{ label: string; stars: number }>;
            body: string;
          };
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
      healthStory?: {
        openingVerdict: string;
        openingBody: string;
        sajuReason: string;
        energyScores: {
          stamina: number;
          endurance: number;
          recovery: number;
          fatigueAwareness: number;
          rhythmSensitivity: number;
        };
        anomalyTitle: string;
        anomalyBody: string;
        signalSequence: Array<{
          key: string;
          label: string;
          score: number;
          description: string;
        }>;
        currentRhythm: {
          burden: number;
          recovery: number;
          comment: string;
        };
        ageFlow: Array<{
          age: number;
          score: number;
          label?: string;
        }>;
        firstTurningAge: string;
        secondTurningAgeLocked: string;
        recoveryAgeLocked: string;
        warningHabit: string;
        actionFirst: string;
        actionReason: string;
        lockedTopics: string[];
      };
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "compatibility";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
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
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "year";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
      version: string;
      year: number;
      overallScore: number;
      theme: string;
      headline: string;
      bestMonth: number;
      moneyMonth: number;
      careerMonth: number;
      relationshipWarningMonth: number;
      healthWarningMonth: number;
      action: string;
      avoid: string;
      webtoonScenes?: CareerWebtoonScene[];
      moneyScore?: number;
      careerScore?: number;
      businessScore?: number;
      loveScore?: number;
      marriageScore?: number;
      relationshipScore?: number;
      healthScore?: number;
      strongestArea?: string;
      weakestArea?: string;
      cautionMonth?: string | number;
      moneyLeakMonth?: string | number;
      relationshipMonth?: string | number;
      freeVerdict?: string;
      strongestText?: string;
      weakestText?: string;
      bestMonthText?: string;
      cautionMonthText?: string;
      curiosityHook?: string;
    }
  | {
      kind: "lifeFlow";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
      version: string;
      chanceCount: number;
      headline: string;
      curve: PreviewScoreItem[];
      firstRise: string;
      biggestWindow: string;
      cautionWindow: string;
      lateLife: string;
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "lifetime";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
      version: string;
      headline: string;
      metrics: PreviewScoreItem[];
      strongestBlessing: PreviewScoreItem;
      weakestHole: PreviewScoreItem;
      turningWindow: string;
      coreAdvice: string;
      webtoonScenes?: CareerWebtoonScene[];
    }
  | {
      kind: "worry";
      sajuFoundation?: ReturnType<typeof buildSajuFoundationV211>;
      version: string;
      verdict: "밀어라" | "기다려라" | "멈춰라" | "조건부 진행";
      headline: string;
      reasons: string[];
      avoidNow: string;
      doNow: string;
      webtoonScenes?: CareerWebtoonScene[];
    };

type SajuProfile = {
  type: string;
  core: string;
  risk: string;
  direction: string;
  avoid: string[];
  action: string[];
};

type TenGodKey =
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

type TenGodCountsLike = Partial<Record<TenGodKey, number>>;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const WORRY_MODEL = process.env.OPENAI_WORRY_MODEL || "gpt-4o";
const ROUTE_VERSION = "route-v200-stable-all-categories";
const RELATIONSHIP_LOGIC = "relationship-score-visual-love-marriage-compatibility-3d-ready-v169";
const YEARLY_LOGIC = "yearly-point-months-not-quarter-list-v41";
const PROFILE_LOGIC =
  "category-profile-specific-risk-direction-v5-love-timing-partner-job-split";
const PREVIEW_LOGIC = "preview-v188-health-no-paid-fallback-clean";
const CHILDREN_LOGIC = "children-dedicated-report-jasik-janyeo-v2";
const DETERMINISTIC_LOGIC = "same-birth-same-category-same-seed-v1";
const MONEY_UNIQUE_LOGIC = "money-v170-shared-wealth-profile-preview-full-lifetime-windows";
const PREMIUM_QUESTION_LOGIC = "premium-raw-ai-no-old-fallback-v150";
const NL = String.fromCharCode(10);

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function pad2(value: string | number) {
  return String(value).padStart(2, "0");
}

type KoreaTodayInfo = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayIndex: number;
  dayName: string;
  dateLabel: string;
  isWeekend: boolean;
  isSunday: boolean;
  isSaturday: boolean;
};

function getKoreaTodayInfo(): KoreaTodayInfo {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const readPart = (type: string, fallback: number) => {
    const value = parts.find((part) => part.type === type)?.value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const year = readPart("year", now.getUTCFullYear());
  const month = readPart("month", now.getUTCMonth() + 1);
  const day = readPart("day", now.getUTCDate());
  const hour = readPart("hour", 0);
  const minute = readPart("minute", 0);
  const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[dayIndex] || "요일 미상";

  return {
    year,
    month,
    day,
    hour,
    minute,
    dayIndex,
    dayName,
    dateLabel: `${year}년 ${month}월 ${day}일 ${dayName}요일`,
    isWeekend: dayIndex === 0 || dayIndex === 6,
    isSunday: dayIndex === 0,
    isSaturday: dayIndex === 6,
  };
}

type BirthConversionInfo = {
  inputCalendar: "양력" | "음력";
  inputYear?: string;
  inputMonth?: string;
  inputDay?: string;
  lunarLeapMonth: boolean;
  convertedYear?: string;
  convertedMonth?: string;
  convertedDay?: string;
  converted: boolean;
  note: string;
};

function makeBirthConversionNote(params: {
  inputCalendar?: "양력" | "음력";
  inputYear?: string;
  inputMonth?: string;
  inputDay?: string;
  lunarLeapMonth?: boolean;
  convertedYear?: string;
  convertedMonth?: string;
  convertedDay?: string;
  converted?: boolean;
}) {
  if (params.inputCalendar !== "음력") {
    return "양력 입력이라 변환하지 않음";
  }

  if (!params.converted) {
    return `음력 ${params.inputYear}년 ${params.inputMonth}월 ${params.inputDay}일${
      params.lunarLeapMonth ? " 윤달" : " 평달"
    } 변환 실패 - 입력값 기준으로 처리됨`;
  }

  return `음력 ${params.inputYear}년 ${params.inputMonth}월 ${params.inputDay}일${
    params.lunarLeapMonth ? " 윤달" : " 평달"
  } → 양력 ${params.convertedYear}년 ${params.convertedMonth}월 ${params.convertedDay}일`;
}

function convertUserBirthForManse(user: UserInfo): UserInfo {
  if (user.calendar !== "음력") {
    return {
      ...user,
      calendar: user.calendar || "양력",
      lunarLeapMonth: false,
    };
  }

  const year = Number(user.year);
  const month = Number(user.month);
  const day = Number(user.day);
  const lunarLeapMonth = user.lunarLeapMonth === true;

  if (!year || !month || !day) {
    return user;
  }

  try {
    const lunar = createKoreanLunarCalendar();
    const ok = lunar.setLunarDate(year, month, day, lunarLeapMonth);

    if (!ok) {
      console.error("음력→양력 변환 실패:", {
        year,
        month,
        day,
        lunarLeapMonth,
      });

      return user;
    }

    const solar = readSolarFromKoreanLunarCalendar(lunar);

    return {
      ...user,
      year: solar.year,
      month: solar.month,
      day: solar.day,
      calendar: "양력",
      lunarLeapMonth,
    };
  } catch (error) {
    console.error("음력→양력 변환 오류:", error);
    return user;
  }
}

function convertPartnerBirthForManse(user: UserInfo): UserInfo {
  const basePartnerUser: UserInfo = {
    year: user.partnerYear,
    month: user.partnerMonth,
    day: user.partnerDay,
    calendar: user.partnerCalendar || "양력",
    lunarLeapMonth: user.partnerLunarLeapMonth === true,
    birthTime: user.partnerBirthTime,
    gender: user.partnerGender,
  };

  if (user.partnerCalendar !== "음력") {
    return {
      ...basePartnerUser,
      calendar: user.partnerCalendar || "양력",
      lunarLeapMonth: false,
    };
  }

  const year = Number(user.partnerYear);
  const month = Number(user.partnerMonth);
  const day = Number(user.partnerDay);
  const lunarLeapMonth = user.partnerLunarLeapMonth === true;

  if (!year || !month || !day) {
    return basePartnerUser;
  }

  try {
    const lunar = createKoreanLunarCalendar();
    const ok = lunar.setLunarDate(year, month, day, lunarLeapMonth);

    if (!ok) {
      console.error("상대 음력→양력 변환 실패:", {
        year,
        month,
        day,
        lunarLeapMonth,
      });

      return basePartnerUser;
    }

    const solar = readSolarFromKoreanLunarCalendar(lunar);

    return {
      ...basePartnerUser,
      year: solar.year,
      month: solar.month,
      day: solar.day,
      calendar: "양력",
      lunarLeapMonth,
    };
  } catch (error) {
    console.error("상대 음력→양력 변환 오류:", error);
    return basePartnerUser;
  }
}

function buildBirthConversionInfo(params: {
  inputCalendar?: "양력" | "음력";
  inputYear?: string;
  inputMonth?: string;
  inputDay?: string;
  lunarLeapMonth?: boolean;
  convertedUser: UserInfo;
}): BirthConversionInfo {
  const inputCalendar = params.inputCalendar || "양력";
  const converted =
    inputCalendar === "음력" &&
    Boolean(params.convertedUser.year) &&
    Boolean(params.convertedUser.month) &&
    Boolean(params.convertedUser.day) &&
    params.convertedUser.calendar === "양력";

  return {
    inputCalendar,
    inputYear: params.inputYear,
    inputMonth: params.inputMonth,
    inputDay: params.inputDay,
    lunarLeapMonth: params.lunarLeapMonth === true,
    convertedYear: params.convertedUser.year,
    convertedMonth: params.convertedUser.month,
    convertedDay: params.convertedUser.day,
    converted,
    note: makeBirthConversionNote({
      inputCalendar,
      inputYear: params.inputYear,
      inputMonth: params.inputMonth,
      inputDay: params.inputDay,
      lunarLeapMonth: params.lunarLeapMonth === true,
      convertedYear: params.convertedUser.year,
      convertedMonth: params.convertedUser.month,
      convertedDay: params.convertedUser.day,
      converted,
    }),
  };
}

function buildBirthConversionText(params: {
  userBirthConversion: BirthConversionInfo;
  partnerBirthConversion?: BirthConversionInfo | null;
}) {
  const partnerLine = params.partnerBirthConversion
    ? `\n- 상대 생년월일 변환: ${params.partnerBirthConversion.note}`
    : "";

  return `[생년월일 변환 기준]\n- 본인 생년월일 변환: ${params.userBirthConversion.note}${partnerLine}\n- 만세력 계산과 고정 결론은 변환된 양력일을 기준으로 한다.\n- 사용자가 음력을 선택했다면 결과 본문에서 필요할 때 "음력으로 넣은 생일은 양력으로 바꾸면 ○○년 ○월 ○일 기준"이라고 자연스럽게 말해도 된다.`;
}

function getName(user?: UserInfo) {
  return safeText(user?.name, "너");
}

function gradeSentence(target: string, grade: Grade) {
  return `${target}은 '${grade}'으로 본다.`;
}

function getCategoryTitle(categoryId?: CategoryId, categoryTitle?: string) {
  const rawTitle = safeText(categoryTitle, "");

  // v70: 카테고리명은 원래 이름을 유지한다. "재물운/일·사업운/궁합운/올해운세/인생대운"으로 바꾸지 않는다.
  if (rawTitle) {
    if (rawTitle === "오늘운세") return "오늘운세";
    if (rawTitle === "재물운") return "재물운";
    if (rawTitle === "일·사업운") return "일·사업운";
    if (rawTitle === "연애운") return "연애운";
    if (rawTitle === "궁합운") return "궁합운";
    if (rawTitle === "가까워졌을 때 맞는지") return "궁합운";
    if (rawTitle === "올해운세") return "올해운세";
    if (rawTitle === "인생대운") return "인생대운";
    if (rawTitle === "평생종합사주") return "평생종합사주";
    if (rawTitle === "내 고민 상담") return "내 고민 상담";
    if (rawTitle === "사랑·결혼운") return "연애운";
    if (rawTitle === "연인/배우자 궁합") return "궁합운";
    if (rawTitle === "12개월운세") return "올해운세";
    if (rawTitle === "인생흐름") return "인생대운";
    if (rawTitle === "자녀운") return "평생종합사주";
    if (rawTitle === "자식운") return "평생종합사주";
    if (rawTitle === "가족관계") return "내 고민 상담";
    if (rawTitle === "돈복") return "재물운";
    if (rawTitle === "일복") return "일·사업운";
    if (rawTitle === "오늘의 운") return "오늘운세";
    if (rawTitle === "올해판") return "올해운세";
    if (rawTitle === "대운판") return "인생대운";
    if (rawTitle === "평생사주") return "평생종합사주";
    if (rawTitle.includes("재물") || rawTitle.includes("돈복")) return "재물운";
    if (rawTitle.includes("일·사업") || rawTitle.includes("직업") || rawTitle.includes("사업운")) return "일·사업운";
    if (rawTitle.includes("결혼") && !rawTitle.includes("궁합")) return "결혼운";
    if (rawTitle.includes("궁합")) return "궁합운";
    return rawTitle;
  }

  const map: Record<CategoryId, string> = {
    today: "오늘운세",
    worry: "내 고민 상담",
    money: "재물운",
    career: "일·사업운",
    love: "연애운",
    marriage: "결혼운",
    health: "건강운",
    children: "평생종합사주",
    compatibility: "궁합운",
    family: "내 고민 상담",
    partner: "사업파트너 궁합",
    lifeFlow: "인생대운",
    monthly: "올해운세",
    premium: "내 고민 상담",
    traditional: "평생종합사주",
  };

  return categoryId ? map[categoryId] : "운세풀이";
}

function getEffectiveCategoryTitle(
  categoryId: CategoryId,
  categoryTitle: string,
  user?: UserInfo,
) {
  const baseTitle = getCategoryTitle(categoryId, categoryTitle);

  if (isPartnerCategory(categoryId, baseTitle) || user?.compatibilityType === "사업파트너 궁합") {
    return "사업파트너 궁합";
  }
  if (categoryId === "compatibility" || baseTitle.includes("궁합")) return "궁합운";
  if (categoryId === "love" || baseTitle.includes("연애")) return "연애운";
  if (categoryId === "marriage" || baseTitle.includes("결혼")) return "결혼운";
  if (categoryId === "money" || baseTitle.includes("재물")) return "재물운";
  if (categoryId === "career" || baseTitle.includes("사업") || baseTitle.includes("일·")) return "일·사업운";
  if (categoryId === "health" || baseTitle.includes("건강")) return "건강운";
  if (categoryId === "monthly" || baseTitle.includes("올해")) return "올해운세";
  if (categoryId === "lifeFlow" || baseTitle.includes("대운")) return "인생대운";
  if (categoryId === "traditional" || categoryId === "children" || baseTitle.includes("평생")) return "평생종합사주";
  if (categoryId === "worry" || categoryId === "premium" || categoryId === "family" || baseTitle.includes("고민")) return "내 고민 상담";
  if (categoryId === "today" || baseTitle.includes("오늘")) return "오늘운세";

  return baseTitle;
}

function getSajuTypeStoryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  let focus = "그 사람이 어떤 사주형인지, 어디서 빛나고 어디서 막히는지";

  if (categoryId === "money" || title.includes("재물"))
    focus = "돈이 붙는 자리, 돈이 새는 장면, 남는 돈이 남는 자리";
  if (isCareerCategory(categoryId, title))
    focus = "일이 열리는 자리, 남 밑에서 막히는 지점, 자기 이름값이 붙는 흐름";
  if (categoryId === "love" || title.includes("연애"))
    focus = "끌리는 사람의 공통점, 약해지는 순간, 상대가 빠지는 지점과 질리는 지점";
  if (categoryId === "marriage" || title.includes("결혼"))
    focus = "같이 살면 드러나는 돈·가족·생활 기준";
  if (categoryId === "health" || title.includes("건강"))
    focus = "몸이 먼저 보내는 신호, 오래 버티다가 꺼지는 자리";
  if (
    categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  )
    focus = "초년·청년·중년·말년에 달라지는 사주형과 대운의 문";
  if (categoryId === "traditional" || title.includes("평생"))
    focus = "나라는 사람의 전체 원형, 돈·일·관계·몸이 엮이는 큰 판";

  return `
[소름사주 사주형 스토리 규칙]
- 결과에는 반드시 "이 사람은 어떤 사주형인가"가 느껴져야 한다.
- 단순히 ${categoryTitle}만 설명하지 말고, ${focus}을 중심으로 사용자의 사주형을 이야기처럼 풀어라.
- 꾸민 제목으로 사주형 이름을 붙이지 마라. 대신 본문 안에서 "너는 남 밑에서 버틸 힘은 있는데, 이름도 몫도 안 남는 자리에서는 기운이 빠지는 사주다"처럼 바로 판정해라.
- 사주 상징은 이름 붙이기용이 아니라 현실 장면을 찌르는 용도로만 써라.
- 사주 근거는 반드시 현실 언어로 바꿔라. "현실을 버티는 힘", "끊어낼 칼", "돈을 담는 그릇", "회복 리듬"처럼 풀어라.
- 중요한 결론 문장은 줄 맨 앞에 | 를 붙여라. 예: "| 니 돈은 능력보다 '남는 돈이 남는 자리'에서 막힌다".
- | 로 시작하는 문장은 한 섹션에 1~2개만 넣어라. 이 문장은 화면에서 빨간색 핵심 문장으로 표시된다.
- 한 섹션 안에 사용자의 머릿속 독백을 2개 이상 넣어라.
  예: "이대로 가도 되나?", "조금만 더 준비하고 할까?", "괜히 시작했다가 손해 보면 어떡하지?".
- 사주 용어는 숨기지 말되, 사주 용어 하나를 쓰면 바로 다음 문장에서 현실 언어로 번역해라.
- 글은 길게 쓰되 같은 뜻을 반복하지 말고, 사주 근거 → 상징 → 장면 → 독백 → 처방 순서로 이어라.
`;
}

function getSajuSymbolStoryGuide() {
  return `
[사주 상징 변환 사전]
- 목: 막힌 흙을 뚫고 올라오는 나무, 방향을 찾는 가지, 새로 시작하려는 힘
- 화: 꺼졌다 켜지는 등불, 사람 앞에서 살아나는 불, 표현력과 회복 리듬
- 토: 산, 밭, 담벼락, 돈과 책임을 담는 그릇, 버티는 현실감
- 금: 칼, 쇠, 보석, 기준, 정리력, 판단력, 끊어내는 힘
- 수: 깊은 물, 비, 밤, 생각, 감정, 흐름을 읽는 촉, 회복력
- 비견/겁재: 나와 비슷한 사람, 경쟁, 자존심, 같이 벌지만 같이 새는 돈
- 식신/상관: 말, 표현, 기술, 콘텐츠, 손재주, 밖으로 꺼내야 돈이 되는 힘
- 편재/정재: 돈, 거래, 현실감, 돈을 벌고 지키는 방식
- 편관/정관: 책임, 직장, 규칙, 압박, 배우자 자리, 사회적 역할
- 편인/정인: 공부, 분석, 문서, 자격, 생각, 보호, 준비가 길어지는 흐름

[변환 예시]
- "토가 강하다" → "현실을 버티는 담벼락은 단단한데, 그 안에 혼자 갇히면 답답해진다."
- "금이 약하다" → "끊어낼 칼이 늦게 나오니, 아닌 걸 알면서도 오래 들고 갈 수 있다."
- "수가 강하다" → "생각의 물이 깊어서 남보다 흐름을 먼저 읽지만, 깊어질수록 결정이 늦어진다."
- "식상이 강하다" → "말·기술·콘텐츠처럼 밖으로 꺼내야 돈과 일이 열린다."
- "인성이 강하다" → "공부와 준비는 깊은데, 밖으로 내놓는 순간을 미루기 쉽다."
`;
}

function getRedPointOutputRule() {
  return `
[빨간 핵심 문장 출력 규칙]
- 화면에서 빨간색으로 강조할 문장은 줄 맨 앞에 | 를 붙여라.
- | 문장은 제목이 아니라 본문 안의 핵심 판정이다.
- 예: | 니 몸은 약해서가 아니라 오래 버티다가 꺼진다
- 예: | 니 연애는 사람이 없어서가 아니라 너무 오래 봐줘서 꼬인다
- 예: | 니 돈은 능력보다 남는 돈이 남는 자리에서 막힌다
- | 문장에는 사주형의 핵심, 위험, 반전, 처방 중 하나만 담아라.
- | 문장을 너무 많이 쓰지 마라. 무료 전체 2~3개, 유료 전체 6~10개 정도가 좋다.
`;
}

function getGhostSajuStoryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  const isToday = categoryId === "today" || title.includes("오늘");
  const isMoney = categoryId === "money" || title.includes("재물");
  const isLove = categoryId === "love" || title.includes("연애");
  const isMarriage = categoryId === "marriage" || title.includes("결혼");
  const isHealth = categoryId === "health" || title.includes("건강");
  const isRelation =
    isCompatibilityCategory(categoryId, title) ||
    isFamilyCategory(categoryId, title) ||
    isPartnerCategory(categoryId, title);

  let categoryGhost = "반복되는 선택 귀신";
  let categoryUse =
    "사용자가 같은 문제를 왜 반복하는지, 어디서 운이 새는지, 어떻게 복으로 돌리는지";

  if (isToday) {
    categoryGhost = "오늘 붙는 말귀신·돈귀신·외로움귀신·성급한 반응 악운";
    categoryUse =
      "오늘 하루의 말, 돈, 연애, 악운 한 가지를 4개 카드처럼 풀어주는 것";
  } else if (isMoney) {
    categoryGhost = "새는 돈귀신";
    categoryUse = "돈이 들어오는 자리, 돈이 새는 장면, 재물운을 잡는 방식";
  } else if (isCareerCategory(categoryId, title)) {
    categoryGhost = "판 벌리는 귀신";
    categoryUse =
      "남 밑에서 막히는 자리, 자기 이름값이 붙는 자리, 판을 크게 벌리면 손해가 먼저 붙는 지점";
  } else if (isLove) {
    categoryGhost = "외로움귀신";
    categoryUse =
      "끌리는 사람, 피해야 할 사람, 연락과 말투에서 관계가 꼬이는 장면";
  } else if (isMarriage) {
    categoryGhost = "생활고귀신과 외로움귀신";
    categoryUse = "결혼이 복이 되는 조건과 결혼이 업처럼 무거워지는 조건";
  } else if (isHealth) {
    categoryGhost = "피로귀신";
    categoryUse = "몸이 약해서가 아니라 오래 버티다가 꺼지는 흐름";
  } else if (isRelation) {
    categoryGhost = "말꼬리귀신·기대귀신·몫다툼귀신 중 관계 구조에 맞는 귀신";
    categoryUse =
      "둘 사이에서 반복되는 말투, 돈 기준, 책임, 거리감, 주도권 충돌";
  }

  return `
[귀신사주식 스토리 레이어]
- 소름사주는 귀신사주식 해석을 쓰되, 실제 귀신이 붙었다거나 빙의·저주·퇴마처럼 공포를 조장하지 않는다.
- 여기서 귀신은 반복 성향, 끼, 살, 감정 패턴, 돈이 새는 구멍, 인연 문제, 피로 흐름을 비유적으로 잡아내는 장치다.
- 선택 카테고리에서는 특히 '${categoryGhost}'을 중심으로 ${categoryUse}을 풀어라.
- 결과는 짧은 조언이 아니라 스토리로 이어져야 한다.
  1) 결론을 먼저 말한다.
  2) 사용자 안에 붙은 반복 기운을 귀신 비유로 이름 붙인다.
  3) 그 기운이 과거와 현재에서 어떤 장면으로 드러나는지 말한다.
  4) 잘 풀리면 어떤 복이 되는지 말한다.
  5) 안 풀리면 어떤 악운으로 변하는지 말한다.
  6) 오늘/올해/인생에서 피해야 할 선택을 구체적으로 찍는다.
  7) 마지막은 겁주는 말이 아니라 복으로 바꾸는 법으로 끝낸다.
- "귀신이 붙었다"처럼 단정하지 마라. "네 안에 ~귀신이 붙는 흐름이 있다. 이건 진짜 귀신이 아니라 ~한 반복 기운이다"처럼 풀어라.
- "내 안의 귀신", "피해야 할 악운", "잡아야 할 천운", "잘 풀리면", "안 풀리면", "복으로 바꾸는 법" 중 카테고리에 맞는 표현을 자연스럽게 넣어라.
- 사주 듣는 맛이 나게 써라. 단, 저주·공포·질병 확정·운명 보장으로 몰지 마라.
- 컨설팅 말투 금지: "처음부터 판을 크게 벌이지 않고 먼저 가볍게 판을 보는 것하고 데이터로 확인하라", "리스크를 관리하라", "헛힘 빼지 말고 운영하라" 같은 말투는 쓰지 마라.
- 대신 "복 붙기 전에 손해가 먼저 붙는다", "정 때문에 돈이 새면 복이 늦게 온다", "귀신 같은 촉을 불안으로 쓰면 꼬이고 돈 보는 눈으로 쓰면 산다"처럼 사주풀이 말맛으로 풀어라.
`;
}

function getPersonalStoryFingerprint(
  manse: any,
  categoryId: CategoryId,
  categoryTitle: string,
) {
  if (typeof manse === "string") {
    const read = (label: string) => {
      const m = manse.match(new RegExp(`${label}[^0-9]{0,8}([0-9]+)`));
      return m ? Number(m[1]) : 0;
    };
    const dayMatch = manse.match(
      /일간[^가-힣A-Za-z0-9]{0,8}([가-힣A-Za-z0-9]+)/,
    );
    const strongestMatch = manse.match(/강한[^\n:：]*[:：]?\s*([목화토금수])/);
    const weakestMatch = manse.match(/약한[^\n:：]*[:：]?\s*([목화토금수])/);
    manse = {
      elementCounts: {
        목: read("목"),
        화: read("화"),
        토: read("토"),
        금: read("금"),
        수: read("수"),
      },
      dayMaster: dayMatch ? dayMatch[1] : "제공된 일간",
      strongestElement: strongestMatch ? strongestMatch[1] : "제공된 명식 기준",
      weakestElement: weakestMatch ? weakestMatch[1] : "제공된 명식 기준",
      tenGodCounts: {},
    };
  }

  const snap = getElementSnapshot(manse);
  const flow = getReadableElementFlow(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);
  const career = getCareerArchetype(manse);
  const money = getMoneyProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse, "love");

  const elementImage: Record<string, string> = {
    목: "막힌 흙을 뚫고 올라가는 나무",
    화: "꺼졌다가도 다시 붙는 불씨",
    토: "속으로 무게를 삼키는 담벼락",
    금: "정리하고 끊어내는 칼",
    수: "깊고 오래 흐르는 물",
  };

  const weakestImage: Record<string, string> = {
    목: "방향을 잡는 가지가 늦게 뻗는 자리",
    화: "표현과 회복의 불씨가 늦게 켜지는 자리",
    토: "돈과 책임을 담는 그릇이 흔들리는 자리",
    금: "끊어낼 칼이 늦게 나오는 자리",
    수: "쉬고 회복하는 물길이 마르기 쉬운 자리",
  };

  let typeHint = "버티는 힘과 흔들리는 선택이 같이 있는 사주형";
  if (snap.earth >= 3 && snap.metal === 0)
    typeHint = "담벼락은 단단한데 끊어낼 칼이 늦게 나오는 사주형";
  else if (snap.water >= 3)
    typeHint =
      "생각의 물길이 깊어 남보다 먼저 감지하지만 결정이 늦어지는 사주형";
  else if (snap.fire >= 2 && snap.wood >= 2)
    typeHint = "불씨가 살아나면 빠르게 커지지만 식으면 확 꺼지는 사주형";
  else if (snap.metal >= 2)
    typeHint = "칼처럼 정리하고 판단하지만 마음이 늦게 풀리는 사주형";
  else if (snap.wood >= 2)
    typeHint = "틈만 보이면 위로 뻗지만 막히면 답답함이 커지는 사주형";
  else if (resource >= 3)
    typeHint = "공부와 준비는 깊은데 밖으로 꺼내는 버튼이 늦은 사주형";
  else if (output >= 3)
    typeHint = "말·기술·표현이 밖으로 나가야 운이 열리는 사주형";
  else if (wealth >= 3)
    typeHint = "돈 냄새는 맡지만 판을 잘못 키우면 새는 돈도 커지는 사주형";

  let categoryFocus = "이 사람의 반복 장면";
  if (categoryId === "today")
    categoryFocus = "오늘 말·돈·사람관계·몸 컨디션에서 먼저 새는 장면";
  if (categoryId === "money") categoryFocus = `${money.type} / ${money.risk}`;
  if (isCareerCategory(categoryId, categoryTitle))
    categoryFocus = `${career.combined} / ${career.warning}`;
  if (categoryId === "health")
    categoryFocus = `${health.type} / ${health.risk}`;
  if (categoryId === "love")
    categoryFocus = `${relation.type} / ${relation.risk}`;

  return `
[개인화 핑거프린트 - 반드시 내용 차이로 반영]
- 일간: ${snap.dayMaster}
- 오행 분포: 목 ${snap.wood}, 화 ${snap.fire}, 토 ${snap.earth}, 금 ${snap.metal}, 수 ${snap.water}
- 강한 축: ${snap.strongestElement} = ${elementImage[String(snap.strongestElement)] || flow.strongestText}
- 약한 축: ${snap.weakestElement} = ${weakestImage[String(snap.weakestElement)] || flow.weakestText}
- 십성 묶음: 비겁 ${peer}, 식상 ${output}, 재성 ${wealth}, 관성 ${authority}, 인성 ${resource}
- 사주형 후보: ${typeHint}
- 선택 카테고리에서 반드시 깊게 볼 축: ${categoryFocus}

[개인화 강제 규칙]
- 위 오행 분포와 십성 묶음을 숫자 그대로 나열하지 말고, 사주형·현실 장면·독백·처방으로 바꿔라.
- 다른 생년월일에도 똑같이 맞는 문장을 쓰면 실패다.
- 오늘운세도 "충동구매 조심" 같은 공통문장만 쓰지 말고, 위 사주형이 오늘 돈·말·몸에서 어떻게 새는지 장면으로 보여줘라.
- 최소 2곳 이상에서 "왜 이 사람에게 특히 그런지"를 사주상 강한 축/약한 축/십성 구조와 연결해라.
`;
}

function hasPartnerBirthInfo(user?: UserInfo) {
  return Boolean(user?.partnerYear && user?.partnerMonth && user?.partnerDay);
}

function isPartnerCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "partner" ||
    title.includes("사업파트너") ||
    title.includes("동업") ||
    title.includes("파트너")
  );
}

function isCompatibilityCategory(
  categoryId: CategoryId,
  categoryTitle: string,
) {
  const title = categoryTitle || "";
  if (isPartnerCategory(categoryId, title)) return false;

  return (
    categoryId === "compatibility" ||
    title.includes("연인/배우자") ||
    title.includes("궁합운") ||
    title.includes("궁합")
  );
}

function isFamilyCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return categoryId === "family" || title.includes("가족");
}

function isChildrenCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "children" ||
    title.includes("자식") ||
    title.includes("자녀")
  );
}

function isMonthlyCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "monthly" ||
    title.includes("올해") ||
    title.includes("해운") ||
    title.includes("신년") ||
    title.includes("12개월") ||
    title.includes("월별")
  );
}

function isLoveMarriageCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "love" ||
    categoryId === "marriage" ||
    title.includes("사랑") ||
    title.includes("연애") ||
    title.includes("결혼")
  );
}

function isCareerCategory(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "career" ||
    title.includes("일·사업") || title.includes("일·사업운") ||
    title.includes("직업") ||
    (title.includes("사업") && !isPartnerCategory(categoryId, title))
  );
}

function shouldUseCareerArchetype(categoryId?: CategoryId) {
  return (
    categoryId === "career" ||
    categoryId === "money" ||
    categoryId === "lifeFlow" ||
    categoryId === "monthly" ||
    categoryId === "traditional" ||
    categoryId === "premium"
  );
}

type RepeatGhostKey =
  | "돈이 새는 장면"
  | "정귀신"
  | "미루기귀신"
  | "판벌림귀신"
  | "외로움귀신"
  | "책임귀신"
  | "말꼬리귀신"
  | "피로귀신";

type RepeatGhostProfile = {
  primary: RepeatGhostKey;
  secondary: RepeatGhostKey;
  summary: string;
  risk: string;
  direction: string;
  source: string;
};

function normalizeMaritalStatus(user?: UserInfo) {
  const raw = safeText(user?.maritalStatus, "비공개");
  if (["미혼", "연애중", "기혼", "이혼/재혼 고민", "비공개"].includes(raw))
    return raw;
  return "비공개";
}

function getTodayRuntimeGuide(
  user?: UserInfo,
  categoryId?: CategoryId,
  categoryTitle = "",
) {
  const title = categoryTitle || "";
  if (!(categoryId === "today" || title.includes("오늘"))) {
    return "오늘운세가 아니므로 오늘 날짜/요일 전용 규칙은 적용하지 않는다.";
  }

  const today = getKoreaTodayInfo();
  const status = normalizeMaritalStatus(user);

  const workGuide = today.isWeekend
    ? "오늘은 주말이다. 회사에서 새 프로젝트를 받는다, 상사에게 인정받는다, 회의에서 협업 기회를 얻는다는 식의 평일 직장 장면을 쓰지 마라. 주말 일운은 밀린 일 정리, 다음 주 준비, 부업 구상, 거래처나 지인 연락 확인, 자료 정리, 쉬는 중에도 머릿속에서 일 계산이 도는 장면으로 써라."
    : "오늘은 평일이다. 직장, 거래처, 업무 연락, 회의, 보고, 일정 압박, 계약, 납품, 처리할 일 같은 평일형 장면을 써도 된다.";

  const relationGuide =
    "현재 관계 상태를 별도 입력받지 않는다. 새 인연이 있다고 단정하거나 배우자·연인이 있다고 가정하지 마라. 오늘의 사람운은 연락, 가까운 사람과의 말투, 약속, 가족·지인·업무 관계처럼 누구에게나 실제로 적용 가능한 현재 관계 장면으로 판정한다. 연애나 결혼 상태가 꼭 필요한 결론은 사랑·결혼운에서 사주 자체의 관계 성향과 시기로 풀어라.";

  return `
[오늘 날짜/요일 고정값]
- 오늘 기준: ${today.dateLabel}
- 현재 한국 시간: ${pad2(today.hour)}:${pad2(today.minute)}
- 주말 여부: ${today.isWeekend ? "주말" : "평일"}

[오늘운세 날짜 반영]
${workGuide}

[오늘운세 사람관계 반영]
${relationGuide}

[오늘운세 시간대 반영]
- 오늘운세는 하루를 한 덩어리로 쓰지 말고 오전·오후·저녁으로 나눠라.
- 오전에는 먼저 막히는 것, 새는 것, 몸이 늦게 풀리는 것, 말이 급해지는 장면을 본다.
- 오후에는 오전보다 풀리는 지점, 연락, 정리, 다음 주 준비, 사람 말 속에서 잡을 수 있는 작은 기회를 본다.
- 저녁에는 감정, 가족, 연인/배우자, 지출 마무리, 과식, 피로 누적, 말투 문제를 본다.
- 단순히 '오전 나쁨/오후 좋음' 공식처럼 반복하지 말고, 사주상 비겁·식상·재성·관성·인성 중 무엇이 먼저 튀는지 짧게 근거를 붙여라.
`;
}


function getMaritalStatusGuide(
  user?: UserInfo,
  categoryId?: CategoryId,
  categoryTitle = "",
) {
  const status = normalizeMaritalStatus(user);
  const title = categoryTitle || "";
  const isRelationCategory =
    categoryId === "love" ||
    categoryId === "marriage" ||
    isLoveMarriageCategory(categoryId || "today", title) ||
    isCompatibilityCategory(categoryId || "today", title) ||
    title.includes("사랑") ||
    title.includes("결혼") ||
    title.includes("궁합");

  let focus =
    "관계 상태를 단정하지 말고, 현재 입력값 기준으로 조심스럽게 풀이한다.";

  if (status === "미혼") {
    focus =
      "앞으로 들어올 인연, 피해야 할 사람, 결혼까지 갈 수 있는 기준을 중심으로 풀이한다.";
  } else if (status === "연애중") {
    focus =
      "막연한 새 인연보다 현재 상대와 계속 갈 수 있는지, 결혼까지 볼 수 있는지, 어디서 부딪히는지를 중심으로 풀이한다.";
  } else if (status === "기혼") {
    focus =
      "새로운 이성 인연이나 결혼할 사람 중심으로 말하지 말고, 배우자운·부부관계·생활 기준·가족 거리감·돈 기준을 중심으로 풀이한다.";
  } else if (status === "이혼/재혼 고민") {
    focus =
      "과거 인연의 반복 패턴, 새 인연을 받을 조건, 재혼운에서 피해야 할 사람을 중심으로 풀이한다.";
  }

  return `
[현재 관계 상태 반영]
- 사용자가 선택한 현재 관계 상태: ${status}
- 관계 해석 방향: ${focus}
- 연애운, 결혼운, 궁합운, 내 고민 상담에서 반드시 이 값을 반영해라.
- 사용자가 기혼이면 "새 인연이 들어온다", "결혼할 사람이 들어온다", "새로운 연애 상대"를 중심으로 쓰지 마라.
- 기혼자의 인연운은 "새로운 이성"이 아니라 부부 사이에 외부 사람 문제, 말, 돈, 가족 거리감이 올라오는 시기로 풀어라.
- 사용자가 연애중이면 현재 관계의 방향과 결혼 가능성, 생활 기준 충돌을 먼저 봐라.
- 사용자가 미혼이면 앞으로 들어올 인연과 피해야 할 사람을 봐도 된다.
- 사용자가 이혼/재혼 고민이면 과거 반복을 끊는 조건과 재혼운을 분리해서 봐라.
- 사용자가 비공개면 미혼/기혼을 단정하지 말고 "관계가 있는 사람이라면", "혼자라면"처럼 조심스럽게 풀어라.
${isRelationCategory ? "- 지금 선택한 카테고리는 관계 상태 반영이 특히 중요하다." : "- 관계 카테고리가 아니어도 돈·건강·일 해석에서 가족 책임이나 혼자 버티는 패턴을 보조 참고로만 반영한다."}
`;
}

function getRepeatGhostDescriptions() {
  return {
    "돈이 새는 장면": {
      summary: "돈은 들어오는데 정, 충동, 사람 말 때문에 새는 반복 흐름",
      risk: "벌어도 남는 게 흐려지고, 사람 일에 끌려가 돈과 마음이 같이 빠질 수 있다.",
      direction:
        "정 때문에 쓰는 돈, 남 말 듣고 들어가는 돈, 친분으로 끌려가는 돈을 끊을 때 재물운이 산다.",
    },
    정귀신: {
      summary: "아닌 걸 알면서도 정 때문에 오래 못 끊는 반복 흐름",
      risk: "좋은 사람 노릇을 하다가 내 시간, 돈, 감정이 먼저 닳을 수 있다.",
      direction:
        "불쌍함과 의리를 사랑이나 복으로 착각하지 말고, 선을 긋는 순간 운이 열린다.",
    },
    미루기귀신: {
      summary: "생각이 깊어서 시작과 결정이 늦어지는 반복 흐름",
      risk: "머릿속에서는 이미 여러 번 끝냈는데 현실에서는 문을 늦게 열어 기회를 놓칠 수 있다.",
      direction:
        "완벽한 확신을 기다리지 말고, 손에 잡히는 첫 문을 열어야 복이 들어온다.",
    },
    판벌림귀신: {
      summary: "꽂히면 크게 벌리고 나중에 부담이 먼저 붙는 반복 흐름",
      risk: "복이 붙기 전에 지출, 약속, 책임이 먼저 커져 몸과 돈이 같이 눌릴 수 있다.",
      direction:
        "처음부터 판 크게 벌리지 말고, 먼저 빠지는 돈과 책임을 줄여야 한다.",
    },
    외로움귀신: {
      summary: "혼자 있는 불안 때문에 사람 선택이 흔들리는 반복 흐름",
      risk: "사람이 없는 게 무서워서 마음을 늙게 만드는 사람까지 붙잡을 수 있다.",
      direction:
        "빈자리를 아무 사람으로 채우지 말고, 오래 편해지는 사람인지 봐야 한다.",
    },
    책임귀신: {
      summary: "내 몫도 아닌 짐까지 떠안고 버티는 반복 흐름",
      risk: "책임은 내가 지고 이름과 몫은 남에게 넘어가는 자리에서 운이 눌린다.",
      direction: "도와주는 것과 떠안는 것을 갈라야 일·사업운과 사람복이 산다.",
    },
    말꼬리귀신: {
      summary: "말투, 연락, 자존심 때문에 관계가 꼬이는 반복 흐름",
      risk: "작은 말 하나가 오래 남아 관계를 닫고, 닫힌 마음이 다시 열리는 데 시간이 걸린다.",
      direction:
        "말을 이기려고 하지 말고, 끊어야 할 말과 풀어야 할 말을 나눠야 한다.",
    },
    피로귀신: {
      summary: "몸이 약해서가 아니라 끝까지 버티다가 꺼지는 반복 흐름",
      risk: "몸이 보내는 신호를 미루면 운이 들어와도 몸이 못 받친다.",
      direction:
        "수면, 소화, 장, 순환, 목·어깨 긴장을 먼저 살려야 복을 받을 그릇이 산다.",
    },
  } satisfies Record<
    RepeatGhostKey,
    { summary: string; risk: string; direction: string }
  >;
}

function addGhostScore(
  scores: Record<RepeatGhostKey, number>,
  key: RepeatGhostKey,
  amount: number,
) {
  scores[key] = (scores[key] || 0) + amount;
}

function scoreRepeatGhostFromText(
  scores: Record<RepeatGhostKey, number>,
  text: string,
) {
  const value = String(text || "");

  if (/새|모으|돈|충동|고정비|투자|사업|크게 쓰|가족.*쓰|사람.*쓰/.test(value))
    addGhostScore(scores, "돈이 새는 장면", 3);
  if (/정|못 끊|가족|사람.*쓰|오래 본|다 이해|참/.test(value))
    addGhostScore(scores, "정귀신", 3);
  if (/미루|오래 고민|생각|시작.*늦|결정.*늦|기회.*놓/.test(value))
    addGhostScore(scores, "미루기귀신", 3);
  if (/크게|벌리|급하게|꽂히|확 타오르|판/.test(value))
    addGhostScore(scores, "판벌림귀신", 3);
  if (/외로|혼자|불안|연애|사람.*막힌/.test(value))
    addGhostScore(scores, "외로움귀신", 3);
  if (/책임|짐|떠안|다 이해|오래 참|내가.*많/.test(value))
    addGhostScore(scores, "책임귀신", 3);
  if (/말투|연락|자존심|마음.*닫|관계.*꼬/.test(value))
    addGhostScore(scores, "말꼬리귀신", 3);
  if (/몸|마음|피로|수면|소화|장|무겁|건강|버티/.test(value))
    addGhostScore(scores, "피로귀신", 3);
}

function getRepeatGhostProfile(user: UserInfo, manse: any): RepeatGhostProfile {
  const descriptions = getRepeatGhostDescriptions();
  const scores: Record<RepeatGhostKey, number> = {
    "돈이 새는 장면": 0,
    정귀신: 0,
    미루기귀신: 0,
    판벌림귀신: 0,
    외로움귀신: 0,
    책임귀신: 0,
    말꼬리귀신: 0,
    피로귀신: 0,
  };

  const answers = user.repeatGhostAnswers || {};
  Object.values(answers).forEach((answer) =>
    scoreRepeatGhostFromText(scores, String(answer || "")),
  );
  scoreRepeatGhostFromText(scores, safeText(user.repeatGhostType, ""));

  const snap = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  if (wealth >= 2 || peer >= 2) addGhostScore(scores, "돈이 새는 장면", 1);
  if (peer >= 3 || snap.earth >= 3) addGhostScore(scores, "정귀신", 1);
  if (resource >= 2 || snap.water >= 2) addGhostScore(scores, "미루기귀신", 1);
  if (output >= 2 || snap.fire >= 2) addGhostScore(scores, "판벌림귀신", 1);
  if (snap.water >= 2 && snap.fire <= 1) addGhostScore(scores, "외로움귀신", 1);
  if (authority >= 2 || snap.earth >= 3) addGhostScore(scores, "책임귀신", 2);
  if (output >= 2 || snap.metal >= 2) addGhostScore(scores, "말꼬리귀신", 1);
  if (snap.fire === 0 || snap.fire <= 1 || snap.earth >= 4)
    addGhostScore(scores, "피로귀신", 2);

  const sorted = (Object.keys(scores) as RepeatGhostKey[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const primary = sorted[0] || "책임귀신";
  const secondary = sorted.find((key) => key !== primary) || "돈이 새는 장면";
  const hasAnswer = Object.values(answers).some((value) => safeText(value, ""));

  return {
    primary,
    secondary,
    summary: descriptions[primary].summary,
    risk: descriptions[primary].risk,
    direction: descriptions[primary].direction,
    source: hasAnswer
      ? "사용자 반복되는 문제 5문 + 만세력 보정"
      : "만세력 보정값 중심. 사용자가 반복되는 문제 5문을 답하면 더 선명해진다.",
  };
}

function getPastLifeProfile(user: UserInfo, manse: any) {
  const ghost = getRepeatGhostProfile(user, manse);
  const snap = getElementSnapshot(manse);

  let pastType = "무사 전생";
  let image = "남의 짐을 대신 지고 길을 건너던 사람";
  let habit =
    "이번 생에도 책임을 그냥 못 지나치고, 내 몫 아닌 일까지 붙잡는 버릇";
  let blessing = "잘 풀리면 사람을 지키고 일을 끝까지 세우는 힘이 된다.";
  let shadow =
    "안 풀리면 남의 짐을 들다가 내 돈, 내 시간, 내 몸이 먼저 닳는다.";

  if (ghost.primary === "돈이 새는 장면") {
    pastType = "장사꾼 전생";
    image = "사람과 물건이 오가는 장터에서 흐름을 보던 사람";
    habit =
      "이번 생에도 돈 냄새와 사람 흐름은 읽지만, 사람 말에 흔들리면 돈이 새는 버릇";
    blessing = "잘 풀리면 거래와 사람 사이에서 돈길을 잡는 눈이 된다.";
    shadow =
      "안 풀리면 정 때문에 쓰고, 남 말 듣고 들어간 돈에서 손해가 먼저 붙는다.";
  } else if (ghost.primary === "정귀신") {
    pastType = "중매꾼 전생";
    image = "사람 사이를 이어주고 서운함을 달래던 사람";
    habit =
      "이번 생에도 사람 마음을 빨리 읽고, 아닌 관계도 정 때문에 오래 보는 버릇";
    blessing = "잘 풀리면 사람복과 연결복이 된다.";
    shadow = "안 풀리면 좋은 사람 노릇을 하다가 내 마음이 먼저 늙는다.";
  } else if (ghost.primary === "미루기귀신") {
    pastType = "선비 전생";
    image = "밤새 문서를 읽고 답을 고르던 사람";
    habit = "이번 생에도 생각이 깊어 시작 버튼이 늦게 눌리는 버릇";
    blessing = "잘 풀리면 남들이 못 보는 흐름을 먼저 읽는 눈이 된다.";
    shadow =
      "안 풀리면 좋은 생각이 머릿속에서만 돌고 복이 들어올 문을 늦게 연다.";
  } else if (ghost.primary === "판벌림귀신") {
    pastType = "떠돌이 전생";
    image = "한곳에 오래 묶이지 않고 새 길을 찾던 사람";
    habit = "이번 생에도 꽂히면 빨리 움직이고 크게 벌리고 싶은 버릇";
    blessing = "잘 풀리면 빠르게 기회를 잡는 추진력이 된다.";
    shadow = "안 풀리면 복 붙기 전에 지출과 책임이 먼저 커진다.";
  } else if (ghost.primary === "외로움귀신") {
    pastType = "길손 전생";
    image = "혼자 먼 길을 오래 걸으며 사람 온기를 그리워하던 사람";
    habit = "이번 생에도 빈자리를 사람으로 채우려는 버릇";
    blessing = "잘 풀리면 사람 마음을 깊게 이해하는 힘이 된다.";
    shadow = "안 풀리면 외로움 때문에 마음을 늙게 만드는 사람을 붙잡는다.";
  } else if (ghost.primary === "말꼬리귀신") {
    pastType = "광대·이야기꾼 전생";
    image = "말 한마디로 사람을 웃기고 울리던 사람";
    habit = "이번 생에도 말투, 연락, 표현 하나에 운이 열리고 닫히는 버릇";
    blessing = "잘 풀리면 말과 표현이 사람복을 여는 힘이 된다.";
    shadow = "안 풀리면 작은 말꼬리가 관계 전체를 꼬이게 만든다.";
  } else if (ghost.primary === "피로귀신") {
    pastType = "약방 사람 전생";
    image = "남의 아픈 곳은 잘 보면서 자기 몸은 뒤로 미루던 사람";
    habit = "이번 생에도 몸이 보내는 신호를 머리로 미루는 버릇";
    blessing = "잘 풀리면 남의 상태를 살피고 흐름을 회복시키는 감각이 된다.";
    shadow = "안 풀리면 끝까지 버티다가 어느 날 몸과 마음이 같이 꺼진다.";
  }

  if (snap.earth >= 4 && ghost.primary !== "책임귀신") {
    habit += "이 있고, 현실 책임을 속으로 삼키는 흐름도 같이 붙는다";
  }

  return { pastType, image, habit, blessing, shadow };
}

function getSoreumAddOnPrompt(
  user: UserInfo,
  manse: any,
  categoryId: CategoryId,
  categoryTitle: string,
) {
  const ghost = getRepeatGhostProfile(user, manse);
  const past = getPastLifeProfile(user, manse);
  const title = categoryTitle || "";
  const allowPastLife =
    categoryId === "lifeFlow" ||
    categoryId === "traditional" ||
    categoryId === "premium" ||
    categoryId === "worry" ||
    title.includes("대운") ||
    title.includes("평생") ||
    title.includes("고민");

  return `
[소름사주 추가 개인화 레이어]
${getMaritalStatusGuide(user, categoryId, categoryTitle)}

[반복 장면 참고]
- 1순위 반복 흐름: ${ghost.primary}
- 2순위 반복 흐름: ${ghost.secondary}
- 판정 근거: ${ghost.source}
- 반복 흐름: ${ghost.summary}
- 안 풀리면: ${ghost.risk}
- 복으로 바꾸는 법: ${ghost.direction}
- 이 내용은 선택 카테고리와 직접 연결될 때만 녹여라.
- "귀신"이라는 단어를 모든 카테고리에 반복하지 마라.
- 무료 결과에서 반복되는 문제을 별도 섹션으로 만들지 마라.
- 재물운이면 돈이 새는 장면으로, 일·사업운이면 일이 눌리는 장면으로, 연애운이면 마음이 흔들리는 장면으로 바꿔 써라.

${
  allowPastLife
    ? `[전생식 비유 참고 - 허용 카테고리에서만 사용]
- 오래된 습관: ${past.pastType}
- 전생식 비유: ${past.image}
- 이번 생에 반복되는 버릇: ${past.habit}
- 잘 풀리면: ${past.blessing}
- 안 풀리면: ${past.shadow}
- 실제 전생을 단정하지 마라. "전생식으로 비유하면" 정도로 짧게만 쓴다.
- 전생 이야기는 평생종합사주, 인생대운, 내 고민 상담에서만 보조 양념으로 쓴다. 결과의 중심으로 쓰지 마라.`
    : `[전생 사용 금지]
- 지금 카테고리에서는 전생 이야기를 쓰지 마라.
- 오늘운세, 재물운, 일·사업운, 연애운, 결혼운, 궁합운, 올해운세, 몸운에서는 오래된 습관·전생식 비유·업보 표현을 절대 출력하지 마라.`
}
`;
}

function addSoreumAddOnSectionsToOutputStructure(
  outputStructure: string,
  categoryId: CategoryId,
  categoryTitle: string,
) {
  // v67: 반복되는 문제/전생 섹션을 모든 카테고리에 자동으로 끼워 넣지 않는다.
  // 카테고리마다 선택한 주제만 깊게 파야 하므로, 전생은 인생대운/평생종합사주/내 고민 상담에서만 본문 안에 짧게 녹인다.
  return outputStructure;
}

function buildUserInfoText(user?: UserInfo) {
  // v70: 메인 화면의 "가장 궁금한 것"/반복되는 문제 답변은 결과에 절대 쓰지 않는다.
  return `
[사용자 입력 정보]
이름/별명: ${getName(user)}
생년월일: ${safeText(user?.year, "미입력")}년 ${safeText(user?.month, "미입력")}월 ${safeText(user?.day, "미입력")}일
음력/양력: ${safeText(user?.calendar, "미입력")}
출생시간: ${safeText(user?.birthTime, "모름")}
성별: ${safeText(user?.gender, "미입력")}
현재 관계 상태: ${normalizeMaritalStatus(user)}
질문: ${safeText(user?.question, "없음")}

[상대방 입력 정보]
이름/별명: ${safeText(user?.partnerName, "없음")}
생년월일: ${safeText(user?.partnerYear, "미입력")}년 ${safeText(user?.partnerMonth, "미입력")}월 ${safeText(user?.partnerDay, "미입력")}일
음력/양력: ${safeText(user?.partnerCalendar, "미입력")}
출생시간: ${safeText(user?.partnerBirthTime, "모름")}
성별: ${safeText(user?.partnerGender, "미입력")}
`;
}

function readElementCount(
  manse: any,
  korean: "목" | "화" | "토" | "금" | "수",
  english: string,
) {
  const candidates = [
    manse?.elements,
    manse?.elementCounts,
    manse?.elementCount,
    manse?.oheng,
    manse?.fiveElements,
    manse?.fiveElementCounts,
  ];

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;

    const value =
      item[korean] ??
      item[english] ??
      item[english.toLowerCase()] ??
      item[english.toUpperCase()];

    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

function getElementSnapshot(manse: any) {
  const wood = readElementCount(manse, "목", "wood");
  const fire = readElementCount(manse, "화", "fire");
  const earth = readElementCount(manse, "토", "earth");
  const metal = readElementCount(manse, "금", "metal");
  const water = readElementCount(manse, "수", "water");

  const strongestElement =
    manse?.strongestElement ||
    manse?.strongElement ||
    manse?.strongest ||
    "제공된 명식 기준";
  const weakestElement =
    manse?.weakestElement ||
    manse?.weakElement ||
    manse?.weakest ||
    "제공된 명식 기준";
  const dayMaster =
    manse?.dayMaster?.label ||
    manse?.dayMaster?.name ||
    manse?.dayMaster ||
    manse?.ilgan ||
    "제공된 일간";

  return {
    wood,
    fire,
    earth,
    metal,
    water,
    strongestElement,
    weakestElement,
    dayMaster,
  };
}

function getTenGodCounts(manse: any): TenGodCountsLike {
  return (
    manse?.tenGods?.counts ||
    manse?.tenGodCounts ||
    manse?.sip성Counts ||
    manse?.sipsungCounts ||
    {}
  );
}

function countTenGodGroup(tenGods: TenGodCountsLike, keys: TenGodKey[]) {
  return keys.reduce((sum, key) => sum + Number(tenGods[key] || 0), 0);
}

function getReadableElementFlow(manse: any) {
  const snap = getElementSnapshot(manse);
  const labelMap: Record<string, string> = {
    목: "성장과 방향을 잡는 힘",
    화: "추진력과 표현력, 회복 리듬",
    토: "현실감과 책임감, 버티는 힘",
    금: "정리력과 판단력, 끊어내는 힘",
    수: "생각의 깊이와 회복력, 유연함",
  };

  return {
    strongest: String(snap.strongestElement),
    weakest: String(snap.weakestElement),
    strongestText: labelMap[String(snap.strongestElement)] || "좋게 타고난 힘",
    weakestText:
      labelMap[String(snap.weakestElement)] || "반복해서 보완해야 할 부분",
  };
}

function profileLines(profile: SajuProfile) {
  const avoidLines = profile.avoid
    .map((item, index) => `${index + 1}. ${item}`)
    .join(NL);
  const actionLines = profile.action
    .map((item, index) => `${index + 1}. ${item}`)
    .join(NL);

  return `
[내부 참고용 사주 프로필 - 결과에 제목 그대로 출력 금지]
- 아래 프로필명과 분류명은 AI 내부 참고용이다. 결과 본문에 그대로 쓰지 마라.
- 사용자가 바로 알아듣는 말로 바꿔라. 예: "내 손으로 고치고 만들고 챙기는 돈" 금지 → "내 손으로 고치고 만들고 챙기는 일에 돈이 붙는다".
- 참고 흐름: ${profile.type}
- 핵심 판정: ${profile.core}
- 조심할 악운: ${profile.risk}
- 복이 붙는 자리: ${profile.direction}

[이 사람에게 맞춘 하지 말아야 할 선택]
${avoidLines}

[이 사람에게 맞춘 잡아야 할 방향]
${actionLines}
`;
}

function gradeByScore(score: number): Grade {
  if (score >= 9) return "상";
  if (score >= 7) return "중상";
  if (score >= 5) return "중";
  if (score >= 3) return "중하";
  return "하";
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

function hashToSeed(input: string) {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

function buildFortuneSeed(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  manse: any;
  partnerManse?: any | null;
}) {
  const seedSource = stableStringify({
    deterministicLogic: DETERMINISTIC_LOGIC,
    categoryId: params.categoryId,
    categoryTitle: params.categoryTitle,
    year: safeText(params.user.year),
    month: safeText(params.user.month),
    day: safeText(params.user.day),
    calendar: safeText(params.user.calendar),
    birthTime: safeText(params.user.birthTime, "모름"),
    gender: safeText(params.user.gender),
    partnerYear: safeText(params.user.partnerYear),
    partnerMonth: safeText(params.user.partnerMonth),
    partnerDay: safeText(params.user.partnerDay),
    partnerCalendar: safeText(params.user.partnerCalendar),
    partnerBirthTime: safeText(params.user.partnerBirthTime, "모름"),
    partnerGender: safeText(params.user.partnerGender),
    compatibilityType: safeText(params.user.compatibilityType),
    manse: params.manse,
    partnerManse: params.partnerManse || null,
  });

  return hashToSeed(seedSource);
}

function getNumberFromText(value?: string) {
  const parsed = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}



type DetailedCareerItem = {
  label: string;
  jobs: string;
  why: string;
  moneyRange: string;
  caution: string;
};

type BusinessVerdict = {
  verdict: string;
  reason: string;
  moneyRange: string;
};

function getCareerMoneyRange(score: number, rank: number, moneyGrade: Grade) {
  let boost = 0;
  if (moneyGrade === "상") boost = 2;
  else if (moneyGrade === "중상") boost = 1;
  else if (moneyGrade === "중하") boost = -1;
  else if (moneyGrade === "하") boost = -2;

  const value = score + boost - rank;
  if (value >= 15) return "30억~50억권까지 보는 그릇";
  if (value >= 12) return "20억~30억권까지 보는 그릇";
  if (value >= 9) return "10억~20억권이 현실권";
  if (value >= 6) return "5억~10억권을 안정적으로 보는 그릇";
  return "3억~7억권에서 먼저 단단히 모으는 그릇";
}


function getCareerDetailedProfile(manse: any) {
  const snap = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);
  const moneyGrade = getMoneyGrade(manse);

  // V201 핵심:
  // 예전처럼 공무원/교사/의료/옷장사 같은 "직업 사전" 항목을 그대로 1~3위로 뽑지 않는다.
  // 먼저 기초 적성 점수를 만든 뒤, 실제 돈 버는 경로(pathway)로 다시 묶는다.
  const raw = [
    {
      key: "gov",
      label: "조직·공공",
      score: authority * 4 + resource * 2 + snap.metal * 2 + snap.earth,
      jobs: "공공기관·행정·심사·계약·규정·조직관리",
      why: "규칙·책임·직함을 돈으로 바꾸는 힘",
      caution: "직함만 남고 내 몸값이 오르지 않는 자리는 오래 붙잡지 않는다.",
    },
    {
      key: "medical",
      label: "의료·상담",
      score: snap.metal * 3 + snap.water * 2 + resource * 2 + authority + output,
      jobs: "의료·치료·상담·재활·전문 서비스",
      why: "정확성과 신뢰를 반복 수입으로 바꾸는 힘",
      caution: "책임을 혼자 떠안아 몸을 갈아 넣는 구조는 피한다.",
    },
    {
      key: "education",
      label: "교육·지식",
      score: resource * 4 + snap.wood * 2 + output * 2 + authority,
      jobs: "교육·강의·상담·교재·지식 콘텐츠",
      why: "아는 것을 정리해 전달하고 단가를 만드는 힘",
      caution: "월급형 한 자리로 끝나면 돈그릇이 작아질 수 있다.",
    },
    {
      key: "legal",
      label: "법·문서·기준",
      score: authority * 3 + snap.metal * 3 + resource * 2 + snap.earth,
      jobs: "법무·세무·회계·관세·계약·심사·규정관리",
      why: "기준·계약·문서를 정확하게 다루는 힘",
      caution: "사람 감정 때문에 기준을 흐리면 단가가 떨어진다.",
    },
    {
      key: "tech",
      label: "기술·전문",
      score: snap.metal * 3 + snap.earth * 2 + snap.water + output * 2 + resource,
      jobs: "기술·개발·엔지니어링·품질·정비·유지보수",
      why: "문제를 해결하고 결과값으로 몸값을 높이는 힘",
      caution: "기술만 있고 견적·고객·계약이 없으면 바쁘기만 해진다.",
    },
    {
      key: "business",
      label: "거래·영업·유통",
      score: wealth * 4 + output * 3 + snap.fire * 2 + snap.water * 2 + peer,
      jobs: "영업·유통·무역·도매·납품·중개·대리점·총판",
      why: "사람·상품·가격·거래를 연결해 반복 매출을 만드는 힘",
      caution: "먼저 재고를 크게 안고 시작하면 현금이 묶인다.",
    },
    {
      key: "foodStore",
      label: "생활형 매장",
      score: snap.earth * 3 + snap.fire * 2 + wealth * 2 + output,
      jobs: "소형 전문점·반찬·도시락·카페·생활 서비스",
      why: "재방문과 회전율을 수익으로 바꾸는 힘",
      caution: "월세·인테리어·인건비가 먼저 큰 매장은 피한다.",
    },
    {
      key: "night",
      label: "야간·분위기 매장",
      score: snap.fire * 3 + snap.water * 2 + wealth * 2 + output - resource,
      jobs: "야간 외식·주점·분위기형 매장",
      why: "사람을 모으고 분위기를 매출로 바꾸는 힘",
      caution: "외상·직원·감정소모가 붙으면 매출과 이익이 따로 논다.",
    },
    {
      key: "fashion",
      label: "패션·잡화",
      score: snap.fire * 3 + snap.wood * 2 + snap.metal + output * 2 + wealth,
      jobs: "패션·잡화·소량사입·전문몰·라이브커머스",
      why: "감각과 빠른 상품 회전을 매출로 바꾸는 힘",
      caution: "예쁜 재고를 많이 안는 순간 돈이 묶인다.",
    },
    {
      key: "online",
      label: "온라인·콘텐츠",
      score: output * 4 + snap.water * 3 + snap.wood + snap.fire + resource,
      jobs: "전문몰·콘텐츠 판매·온라인 서비스·마케팅·플랫폼",
      why: "말·글·영상·정보를 상품과 고객으로 연결하는 힘",
      caution: "조회수만 있고 팔 물건이나 반복수익이 없으면 돈이 안 남는다.",
    },
    {
      key: "finance",
      label: "금융·자산",
      score: wealth * 3 + snap.earth * 2 + snap.metal * 2 + authority,
      jobs: "재무·보험·증권·부동산·자산관리·회계",
      why: "돈의 크기·계약·회수 시점을 직접 보는 힘",
      caution: "남의 말만 듣고 들어가는 투자형 수익은 피한다.",
    },
  ].map((item, index) => ({
    ...item,
    score: item.score + ((index + hashToSeed(item.key + String(snap.dayMaster))) % 3),
  }));

  const rawByKey = Object.fromEntries(raw.map((item) => [item.key, item])) as Record<string, any>;
  const rs = (key: string) => Number(rawByKey[key]?.score || 0);

  // "직업명"이 아니라 실제 돈 버는 경로를 만든다.
  // 1~3순위가 서로 완전히 동떨어진 직업명이 되는 문제를 막기 위해
  // 거래/운영/전문성/지식/온라인/소형사업 같은 현실 경로로 재조합한다.
  const pathways = [
    {
      key: "tradeSales",
      label: "유통·무역·B2B 영업",
      score: Math.round((rs("business") * 1.45 + rs("online") * 0.35 + rs("finance") * 0.2) / 2),
      jobs: "무역, 유통, 납품, 도매, 대리점, 총판, B2B 영업, 거래처 관리, 해외소싱",
      why: "물건·가격·거래처를 연결하고 반복 발주를 만드는 자리에서 돈이 가장 빨리 커진다.",
      companyRole: "영업, 구매, 무역, 수출입, 견적, 거래처관리, 납품관리",
      outsideRole: "자기 거래처를 가진 유통·대리점·총판·전문상품 납품",
      caution: "선재고와 외상부터 키우지 말고 주문과 마진이 확인된 거래부터 늘려야 한다.",
    },
    {
      key: "procurementOps",
      label: "구매·상품기획·영업관리",
      score: Math.round((rs("business") * 0.75 + rs("tech") * 0.5 + rs("legal") * 0.3 + rs("gov") * 0.2) / 1.75),
      jobs: "구매, 발주, 상품기획, 영업관리, 운영관리, 계약관리, 단가관리, 납기관리",
      why: "가격·조건·납기·사람을 한꺼번에 조정하는 역할에서 실무값과 몸값이 같이 오른다.",
      companyRole: "구매, 상품기획, 영업관리, 운영관리, 계약·납기·단가 관리",
      outsideRole: "대행·중개·소싱·운영 컨설팅·거래 관리 서비스",
      caution: "권한 없이 책임만 지는 관리직은 피하고, 가격이나 조건을 실제로 움직이는 자리를 잡아야 한다.",
    },
    {
      key: "expertService",
      label: "기술·전문서비스·유지보수",
      score: Math.round((rs("tech") * 1.1 + rs("legal") * 0.45 + rs("medical") * 0.25 + rs("business") * 0.2) / 2),
      jobs: "엔지니어링, 개발, 품질, 정비, 유지보수, 기술영업, 전문 상담, 자격 기반 서비스",
      why: "문제를 해결하는 전문성에 견적·계약·유지보수가 붙을 때 단가가 커진다.",
      companyRole: "기술, 품질, 개발, 유지보수, 기술영업, 전문 관리",
      outsideRole: "자기 이름의 기술 서비스·유지보수·전문 상담·프로젝트 계약",
      caution: "기술만 제공하고 가격결정권을 남에게 넘기면 돈그릇이 작아진다.",
    },
    {
      key: "knowledgeBusiness",
      label: "교육·상담·지식판매",
      score: Math.round((rs("education") * 1.0 + rs("online") * 0.65 + rs("business") * 0.25) / 1.9),
      jobs: "강의, 교육기획, 상담, 교재, 자격교육, 온라인강의, 정보상품",
      why: "알고 있는 것을 정리해 반복 판매할 때 지식이 월급이 아니라 상품이 된다.",
      companyRole: "교육기획, 상담, 사내교육, 콘텐츠 기획",
      outsideRole: "강의·상담·교재·온라인교육·전문 콘텐츠 판매",
      caution: "시간당 강의만 반복하지 말고 교재·과정·반복 수강 구조를 붙여야 한다.",
    },
    {
      key: "onlineCommerce",
      label: "전문상품 온라인판매·중개",
      score: Math.round((rs("online") * 1.05 + rs("business") * 0.75 + rs("fashion") * 0.25 + rs("finance") * 0.15) / 2.2),
      jobs: "전문몰, 온라인 판매, 스마트스토어, 중개, 상세페이지, 콘텐츠+상품 결합",
      why: "온라인에서 사람을 모으는 힘보다 실제 판매상품과 반복 구매를 붙일 때 돈이 된다.",
      companyRole: "온라인 영업, 이커머스 운영, 상품기획, 디지털 마케팅",
      outsideRole: "전문몰·온라인 중개·소량 판매·콘텐츠와 상품을 묶은 판매",
      caution: "조회수와 광고비보다 재구매율·마진·반품률을 먼저 봐야 한다.",
    },
    {
      key: "smallBusiness",
      label: "소형 전문점·생활서비스",
      score: Math.round((rs("foodStore") * 0.9 + rs("fashion") * 0.55 + rs("online") * 0.35 + rs("business") * 0.35) / 2.15),
      jobs: "소형 전문점, 예약제 서비스, 특정 타깃 매장, 반찬·도시락·생활서비스",
      why: "큰 매장보다 무엇을 파는지 선명하고 다시 찾을 이유가 있는 작은 판에서 돈이 남는다.",
      companyRole: "매장 운영, 서비스 운영, 상품·고객 관리",
      outsideRole: "소형 전문점·예약제·재방문형 서비스·특정 타깃 매장",
      caution: "권리금·월세·인건비를 먼저 크게 지는 방식은 맞지 않는다.",
    },
  ]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      moneyRange: getCareerMoneyRange(item.score, index, moneyGrade),
    }));

  const top1 = pathways[0];
  const top2 = pathways[1];
  const top3 = pathways[2];

  const ranked = raw
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      moneyRange: getCareerMoneyRange(item.score, index, moneyGrade),
    }));

  const businessScore = (key: string) => Number(rawByKey[key]?.score || 0);
  const verdict = (score: number, good: string, mid: string, bad: string) => {
    if (score >= 13) return good;
    if (score >= 9) return mid;
    return bad;
  };

  const foodScore = businessScore("foodStore");
  const nightScore = businessScore("night");
  const fashionScore = businessScore("fashion");
  const onlineScore = businessScore("online");
  const distributionScore = businessScore("business");
  const storeScore = Math.max(foodScore, businessScore("tech"), businessScore("finance"));

  const business = {
    food: {
      key: "food",
      label: "요식·회전형 음식사업",
      score: foodScore,
      verdict: verdict(foodScore, "맞다", "작게 하면 맞다", "주력으로 권하지 않는다"),
      reason: foodScore >= 13 ? "메뉴가 좁고 회전이 빠른 음식, 단골이 다시 찾는 구조가 돈이 된다." : foodScore >= 9 ? "큰 식당보다 반찬·밀키트·배달전문·예약제처럼 고정비 낮은 방식이 낫다." : "월세·인건비·재료비가 먼저 커지는 식당은 몸과 돈을 누른다.",
      moneyRange: getCareerMoneyRange(foodScore, 3, moneyGrade),
    },
    night: {
      key: "night",
      label: "외식·야간 매장",
      score: nightScore,
      verdict: verdict(nightScore, "조건부로 맞다", "주의가 많이 필요하다", "피하는 편이 낫다"),
      reason: nightScore >= 13 ? "사람을 모으는 힘은 있으나 외상과 직원 문제를 막아야 돈이 남는다." : nightScore >= 9 ? "처음 손님은 붙어도 밤기운·사람 문제·감정소모가 같이 붙는다." : "돈보다 사람 문제와 피로가 먼저 커질 가능성이 높다.",
      moneyRange: getCareerMoneyRange(nightScore, 4, moneyGrade),
    },
    fashion: {
      key: "fashion",
      label: "패션·잡화",
      score: fashionScore,
      verdict: verdict(fashionScore, "맞다", "온라인·소량사입이면 가능", "주력으로 권하지 않는다"),
      reason: fashionScore >= 13 ? "감각과 홍보, 빠른 상품 회전을 매출로 바꿀 힘이 있다." : fashionScore >= 9 ? "큰 매장보다 온라인·소량사입·특정 타깃 전문몰이 낫다." : "감각보다 재고 부담이 먼저 커질 수 있다.",
      moneyRange: getCareerMoneyRange(fashionScore, 4, moneyGrade),
    },
    store: {
      key: "store",
      label: "소형 전문점",
      score: storeScore,
      verdict: verdict(storeScore, "작은 전문점이면 맞다", "예약제·단골형이면 가능", "큰 매장은 피해야 한다"),
      reason: storeScore >= 13 ? "무엇을 파는지 선명하고 다시 찾을 이유가 있는 소형 매장은 가능하다." : storeScore >= 9 ? "혼자서도 굴러가고 예약이나 재방문이 있는 가게가 낫다." : "권리금·월세·인건비가 먼저 큰 가게는 부담이 더 크다.",
      moneyRange: getCareerMoneyRange(storeScore, 3, moneyGrade),
    },
    online: {
      key: "online",
      label: "온라인사업",
      score: onlineScore,
      verdict: verdict(onlineScore, "맞다", "팔 물건이 있으면 맞다", "보조수단으로 쓰는 편이 낫다"),
      reason: onlineScore >= 13 ? "정보·상품·플랫폼을 연결해 반복 판매로 만들 힘이 있다." : onlineScore >= 9 ? "전문몰·강의·상담처럼 실제 판매상품이 붙어야 한다." : "조회수만 쫓으면 시간만 쓰고 돈은 늦다.",
      moneyRange: getCareerMoneyRange(onlineScore, 3, moneyGrade),
    },
    distribution: {
      key: "distribution",
      label: "유통·납품·도매",
      score: distributionScore,
      verdict: verdict(distributionScore, "강하게 맞다", "반복거래가 있으면 맞다", "선재고는 피해야 한다"),
      reason: distributionScore >= 13 ? "사람·물건·가격·반복 거래가 붙으면 돈그릇이 크게 열린다." : distributionScore >= 9 ? "한 번 팔고 끝나는 일보다 다시 찾는 거래처가 있어야 산다." : "물건부터 크게 안으면 돈이 묶인다. 주문과 받을 돈이 먼저 보여야 한다.",
      moneyRange: getCareerMoneyRange(distributionScore, 2, moneyGrade),
    },
  };

  // V207: 사업 TOP3도 별도의 업종 랭킹으로 다시 뽑지 않는다.
  // 직업/재물 공통 TOP3를 "독립했을 때의 사업 형태"로 번역한다.
  // 따라서 재물운 2순위가 교육·상담·지식판매라면 일·사업운에서도 2순위가 유지된다.
  const businessTop3 = [top1, top2, top3].map((path: any, index: number) => ({
    key: path.key,
    label: path.label,
    score: Number(path.score || 0),
    verdict: index === 0 ? "가장 강한 중심 사업축" : index === 1 ? "같이 붙이면 강한 보조 사업축" : "작게 검증해 붙이는 확장 사업축",
    reason: `${path.why} 독립한다면 ${path.outsideRole} 형태로 풀어야 한다.`,
    moneyRange: path.moneyRange,
    caution: path.caution,
  }));

  // 회사/독립은 별도 직업명을 만들지 않고 "돈 버는 구조"를 판단하는 데만 쓴다.
  const officePower = authority * 4 + resource * 2 + snap.metal * 2 + snap.earth;
  const ownPower = wealth * 4 + output * 3 + snap.fire * 2 + snap.water * 2 + peer;
  const officeFit = Math.max(20, Math.min(80, Math.round(50 + (officePower - ownPower) * 2.5)));
  const ownFit = 100 - officeFit;

  return {
    top1,
    top2,
    top3,
    pathways,
    ranked,
    split: { office: officeFit, own: ownFit },
    workStyle: "사업형이지만 부업부터 키워야 하는 타입",
    strongestSkill: top1.why,
    moneyRole: top1.label,
    businessTop3,
    business,
  };
}

function getCoreMoneyCareerDetail(detail: any) {
  // V207: 재물운과 일·사업운은 직업/수익 경로를 따로 뽑지 않는다.
  // getCareerDetailedProfile()에서 계산된 pathways가 한 사람의 단일 원본이다.
  const pathways = Array.isArray(detail?.pathways) ? detail.pathways.filter(Boolean) : [];
  const rankedFallback = Array.isArray(detail?.ranked) ? detail.ranked.filter(Boolean) : [];
  const list = pathways.length >= 3 ? pathways : rankedFallback;
  const top1 = list[0] || detail.top1;
  const top2 = list[1] || detail.top2 || top1;
  const top3 = list[2] || detail.top3 || top2;
  const weak = list.slice(-3).map((item: any) => item?.label).filter(Boolean).join(", ");
  return { top1, top2, top3, weakJobs: weak || "기준 없는 투자·무리한 창업·단가 낮은 일" };
}

function getCoreCareerDetail(detail: any) {
  const excluded = new Set(["foodStore", "night", "fashion"]);
  const ranked = Array.isArray(detail?.ranked) ? detail.ranked : [];
  const core = ranked.filter((item: any) => item && !excluded.has(item.key));
  const fallback = ranked.filter(Boolean);
  const list = core.length >= 3 ? core : fallback;
  return {
    first: list[0] || detail.top1,
    second: list[1] || detail.top2 || list[0] || detail.top1,
    third: list[2] || detail.top3 || list[1] || detail.top2 || list[0] || detail.top1,
  };
}

function getDetailScore(detail: any, key: string) {
  return (Array.isArray(detail?.ranked) ? detail.ranked : []).find((item: any) => item?.key === key)?.score || 0;
}

function buildMoneyBusinessSummary(detail: any) {
  const businessScore = getDetailScore(detail, "business");
  const onlineScore = getDetailScore(detail, "online");
  const financeScore = getDetailScore(detail, "finance");
  const foodScore = getDetailScore(detail, "foodStore");
  const fashionScore = getDetailScore(detail, "fashion");
  const nightScore = getDetailScore(detail, "night");
  const strong: string[] = [];

  if (businessScore >= 12) strong.push("유통·영업·대리점·총판·중개처럼 사람과 물건과 가격을 움직이는 사업");
  if (onlineScore >= 12) strong.push("온라인 판매·콘텐츠·강의·상담처럼 사람을 모아 상품으로 바꾸는 사업");
  if (financeScore >= 12) strong.push("부동산·자산관리·계약·금융처럼 돈의 크기와 회수를 보는 사업");
  if (foodScore >= 13 && businessScore >= 10) strong.push("외식·소형매장·서비스업형 사업");
  if (fashionScore >= 13 && onlineScore >= 10) strong.push("의류·잡화·사입·라이브커머스처럼 감각과 회전율을 보는 사업");
  if (nightScore >= 14 && businessScore >= 11) strong.push("야간 매장 운영형 사업");

  if (!strong.length) {
    return `사업은 중심으로 크게 보지 않는다.

이 사주는 장사판을 아예 못 한다는 뜻이 아니다. 다만 재물운의 본줄기는 직업축, 자격, 기술값, 계약, 고정수입, 자산 쪽에서 먼저 잡아야 한다. 사업은 본업에서 돈 받을 이유가 생긴 뒤에 붙이는 보조 돈길로 보는 게 맞다.

요식업, 의류, 온라인 판매, 유통·납품 같은 업종은 전부 후보일 뿐이다. 명식에서 사업 점수가 강하게 뜨지 않으면 이런 업종을 1번 돈길로 올리면 풀이가 틀어진다.`;
  }

  const main = strong[0];
  const sub = strong.slice(1, 3).join(", ");
  return `사업운은 있다. 다만 아무 업종이나 잡으면 안 된다.

사업으로 돈이 붙는다면 중심은 ${main} 쪽이다.${sub ? ` 같이 볼 수 있는 보조 사업은 ${sub}이다.` : ""}

여기서 중요한 건 업종 이름이 아니다. 작은 판에서 먼저 팔리고, 다시 찾는 흐름이 생기고, 받을 돈과 남는 돈이 숫자로 확인되어야 한다. 고정비·재고·인건비·광고비가 먼저 큰 사업은 재물운이 열리기 전에 돈을 묶는다.`;
}

function buildMoneyCorePathText(item: any, role: string, rank: number, _overallRange: string) {
  const label = safeText(item?.label, "직업·사업 수익형");
  const jobs = safeText(item?.jobs, "자격, 기술, 계약, 관리, 영업, 자산을 다루는 일");
  const why = safeText(item?.why, "이 사주에서는 이 축이 실제 돈길로 잡힌다.");
  const score = Math.max(0, Number(item?.score || 0));
  const opening = Math.round(Math.max(38, Math.min(96, 58 + score * 2 - (rank - 1) * 9)));

  const roleText = rank === 1
    ? "이 길이 네 전체 돈그릇을 가장 많이 여는 중심축이다. 단순히 오래 일하는 것보다 네가 가격·조건·거래 규모를 직접 잡을수록 돈이 커진다."
    : rank === 2
      ? "이 길은 중심 돈길과 성격이 다르다. 큰 판을 벌리는 힘보다 전문성·단가·몸값을 올려 돈을 안정적으로 쌓는 두 번째 축이다."
      : "이 길은 중심 직업을 대신하는 길이 아니라 판을 넓히는 확장축이다. 본업에서 만든 상품·기술·정보를 더 많은 사람에게 연결해 수입원을 하나 더 만드는 용도로 쓰는 게 맞다.";

  return `${role}은 ${label}이다.

여기서 맞는 직업군은 ${jobs} 쪽이다. ${why}

재물 잠재력은 ${opening}점이다. ${roleText}`;
}


function buildStrongMoneyFullReport(user: UserInfo, manse: any) {
  const name = getName(user);
  const moneyGrade = getMoneyGrade(manse);
  const detail = getCareerDetailedProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const snap = getElementSnapshot(manse);
  const pattern = getMoneyPattern(manse);
  const moneyLabel = getMoneyPatternLabel(pattern);
  const core = getCoreMoneyCareerDetail(detail);
  const top1 = core.top1;
  const top2 = core.top2;
  const top3 = core.top3;
  const topRange = top1.moneyRange;
  const secondRange = top2.moneyRange;
  const thirdRange = top3.moneyRange;
  const wealthProfile = buildWealthProfile(user, manse);

  return `[재물운 첫 판정]
결론부터 말하면, ${name}, 네 재물운은 '${moneyGrade}'으로 본다.

하지만 이 말만으로는 돈값이 없다. 재물운은 "좋다/나쁘다"가 아니라 얼마짜리 돈그릇인지, 어떤 직업에서 열리는지, 어떤 장사를 하면 돈이 붙고 어떤 장사를 하면 돈이 새는지까지 봐야 한다.

| 너는 돈이 아예 없는 사주가 아니다. 맞는 돈을 잡으면 돈그릇이 커지고, 틀린 돈을 잡으면 벌기도 전에 묶인다.

[내 사주상 분석]
사주상 일간은 ${snap.dayMaster}으로 본다. 강하게 드러나는 축은 ${snap.strongestElement}이고, 약하게 흔들리는 축은 ${snap.weakestElement}이다.

이 말은 어렵게 풀 일이 아니다. 강한 축은 돈을 담는 방식이고, 약한 축은 돈이 새는 자리다. 그래서 이 사주는 돈이 들어오느냐 없느냐보다, 돈이 들어오기 전에 먼저 묶이는 일을 조심해야 한다.

재물운의 기본 문은 ${moneyLabel} 쪽으로 열린다. 이 문이 맞으면 돈이 남고, 이 문과 어긋나면 바쁘게 움직여도 손에 남는 돈이 약해진다.

[네 돈그릇은 얼마짜리인가]
작게 풀리면 3억~7억권에서 먼저 모으는 사주다. 이 구간은 월급, 저축, 작은 부업, 안정적인 자산으로 만드는 돈이다.

제대로 풀리면 10억~20억권이 현실권이다. 이때부터는 단순 월급만으로는 부족하고, 자격, 직함, 반복 손님, 거래처, 기술값, 강의, 상담, 판매, 납품 중 하나가 붙어야 한다.

강하게 열리면 20억~30억권 이상도 본다. 자기 이름으로 받는 돈, 반복으로 들어오는 돈, 소개가 다시 소개를 부르는 돈이 붙을 때다.

명식에서 돈길이 크게 맞으면 30억~50억권까지도 본다. 단, 이건 확정 수익이 아니다. 사주상 돈그릇이다. 맞는 직업과 맞는 업종을 잡았을 때 열리는 큰 그릇이다.

[작게 풀릴 때와 크게 풀릴 때]
작게 풀릴 때는 3억~7억권이다. 이때는 안정적으로 모으지만, 돈이 크게 튀지는 않는다. 몸은 바쁜데 돈이 작게 남는 일이 반복될 수 있다.

제대로 풀릴 때는 10억~20억권이다. 이 구간부터는 돈 버는 방식이 달라진다. 그냥 오래 일해서가 아니라, 사람들이 다시 찾는 일, 맡기면 해결되는 일, 네 이름이나 기술이나 판단이 붙는 일에서 돈이 굵어진다.

크게 풀릴 때는 30억~50억권이다. 이 구간은 아무 직업에서나 안 열린다. ${top1.label}, ${top2.label}, ${top3.label}처럼 이 명식에 맞는 직업축을 잡아야 열린다.

[돈이 붙는 가장 강한 직업길]
1순위는 ${top1.label}이다.

맞는 직업은 ${top1.jobs} 쪽이다. ${top1.why}

이 직업으로 가면 돈그릇은 ${topRange}으로 본다. 이 길은 그냥 월급만 받는 돈이 아니라 자격, 직함, 반복 고객, 거래처, 자기 이름으로 받는 돈이 붙을 때 커진다.

[돈이 붙는 같이 열리는 직업길]
2순위는 ${top2.label}이다.

맞는 직업은 ${top2.jobs} 쪽이다. ${top2.why}

이 직업의 돈그릇은 ${secondRange}이다. 1순위보다 늦게 열릴 수는 있어도, 안정성이나 확장성이 맞으면 오래 간다.

[돈이 붙는 보조로 붙는 직업길]
3순위는 ${top3.label}이다.

맞는 직업은 ${top3.jobs} 쪽이다. ${top3.why}

이 직업의 돈그릇은 ${thirdRange}이다. 이 길은 첫 번째 길이 막혔을 때 현실적으로 잡을 수 있는 돈길이다.

[사업을 한다면 어떤 업종인가]
사업을 한다면 아무 장사나 맞는 게 아니다. 이 사주에서 사업은 요식업, 외식·야간 매장, 옷장사, 가게창업, 온라인사업, 유통·납품을 전부 따로 봐야 한다.

요식업은 ${detail.business.food.verdict}이다. ${detail.business.food.reason} 돈그릇은 ${detail.business.food.moneyRange}으로 본다.

외식·야간 매장 운영은 ${detail.business.night.verdict}이다. ${detail.business.night.reason} 돈그릇은 ${detail.business.night.moneyRange}으로 본다.

옷장사는 ${detail.business.fashion.verdict}이다. ${detail.business.fashion.reason} 돈그릇은 ${detail.business.fashion.moneyRange}으로 본다.

가게창업은 ${detail.business.store.verdict}이다. ${detail.business.store.reason} 돈그릇은 ${detail.business.store.moneyRange}으로 본다.

온라인사업은 ${detail.business.online.verdict}이다. ${detail.business.online.reason} 돈그릇은 ${detail.business.online.moneyRange}으로 본다.

유통·납품·도매는 ${detail.business.distribution.verdict}이다. ${detail.business.distribution.reason} 돈그릇은 ${detail.business.distribution.moneyRange}으로 본다.

[요식업·외식·야간 매장·옷장사·가게창업 판정]
요식업은 큰 식당, 큰 카페, 고깃집처럼 월세·인테리어·인건비가 먼저 큰 판인지, 반찬·밀키트·배달전문·도시락·식자재처럼 회전이 빠른 판인지 갈라야 한다. 이 사주에서 요식업이 맞아도 크게 벌리면 복보다 부담이 먼저 붙는다.

외식·야간 매장 운영은 손님이 붙는 것과 돈이 남는 것이 다르다. 외상, 의리, 직원, 밤기운, 감정소모가 붙으면 매출은 보여도 돈이 샌다. 맞는 사주라면 분위기와 사람 모으는 힘으로 벌지만, 안 맞으면 몸과 돈이 같이 눌린다.

옷장사는 감각만으로 하면 안 된다. 온라인, 소량 사입, 빠른 회전, 특정 타깃 전문몰이면 살 수 있지만 큰 매장과 큰 재고를 안으면 돈이 묶인다.

가게창업은 큰 매장보다 작은 전문점, 예약제, 단골형, 재방문형으로 봐야 한다. 혼자서도 굴러가고 무엇을 파는지 선명해야 돈이 남는다.

[돈이 붙는 실제 흐름]
이 재물운은 갑자기 큰돈이 떨어지는 식이 아니다. 먼저 필요한 사람이 보이고, 그 사람이 돈을 내야 할 이유가 분명해져야 한다.

그다음은 반복이다. 한 번 팔고 끝나는 돈보다 다시 맡기는 손님, 반복 주문, 관리비, 구독, 정기 상담, 재방문에서 돈이 굵어진다.

마지막은 이름값이다. 회사 이름만 남고 내 값은 사라지는 돈보다, 내 판단·기술·자격·상담·강의·판매력 때문에 들어오는 돈이 커진다.

처음부터 크게 차리는 방식은 맞지 않는다. 작은 주문, 소량 판매, 예약제, 소개처럼 돈이 실제로 확인되는 일부터 잡아야 한다.

[돈이 크게 새는 장면]
첫 번째로 새는 장면은 팔리기도 전에 돈부터 묶는 장면이다. 재고, 월세, 인테리어, 광고비, 인건비가 먼저 커지면 돈이 들어오기 전에 눌린다.

두 번째로 새는 장면은 남 말만 듣고 들어가는 투자다. 누가 돈 된다 해서 들어간 돈은 네 손에 기준이 없어서 흔들린다.

세 번째로 새는 장면은 정 때문에 흐려지는 돈이다. 친하다는 이유로 돈 받을 날짜를 흐리게 두거나, 부탁 때문에 조건을 낮추면 돈복이 약해진다.

네 번째로 새는 장면은 매출은 큰데 순이익이 작은 장사다. 겉으로는 바빠 보여도 손에 남는 돈이 작으면 이 사주는 눌린다.

[재물운이 쌓이기 시작하는 시기]
재물운은 한 번에 터지는 돈보다 단계별로 쌓이는 돈으로 본다.

첫 번째 축적 구간은 ${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세 전후다. 이 시기는 큰돈을 바로 잡는 시기라기보다 돈을 보는 눈이 생기는 구간이다. 여기서 중요한 건 많이 버는 것보다 돈이 남는 일을 구분하는 것이다.

이때 잡아야 할 것은 세 가지다. 첫째, 내 사주에 맞는 직업축을 고르는 것. 둘째, 매달 고정으로 들어오는 돈을 만드는 것. 셋째, 돈이 새는 사람과 지출을 끊는 것이다. 이 세 가지를 못 잡으면 벌어도 다시 빠지고, 이 세 가지를 잡으면 적은 돈도 모이기 시작한다.

이 구간에는 무리하게 사업을 벌이면 안 된다. 재물운이 싹트는 시기이지 크게 베팅하는 시기가 아니다. 직업, 자격, 기술, 거래처, 반복 수입 중 하나를 잡아서 돈이 새지 않는 구조를 먼저 만들어야 한다.

[재물운이 굵어지는 시기]
두 번째 구간은 ${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후다. 이때부터 재물운의 크기가 달라진다.

이 시기에는 그냥 월급만 받는 돈으로는 답답해진다. 맞는 직업길이 잡혀 있으면 직함, 자격, 기술값, 거래처, 반복 계약, 소개, 재구매가 붙으면서 돈이 굵어진다. 이때는 10억권으로 넘어갈 수 있는 문이 열린다.

하지만 이 구간에서 돈을 크게 만들려면 반드시 하나가 필요하다. 남이 시키는 일만 하면 안 되고, 내가 가격을 정하거나, 조건을 협상하거나, 사람을 모으거나, 계약을 따거나, 상품을 고르거나, 기술값을 받아야 한다. 돈을 크게 벌려면 내 판단이 돈으로 바뀌는 자리에 서야 한다.

이 시기에는 명식에서 강한 직업축을 중심으로 돈이 굵어진다. 중심 길 하나가 현실에서 자리 잡으면 10억~20억권은 현실권으로 보고, 두 축 이상이 같이 붙으면 20억~30억권 이상도 본다.

[재물운이 크게 터지는 시기]
세 번째 구간은 ${timing.assetAge}세 전후부터다. 이때는 돈을 새로 버는 힘보다, 이미 만든 돈을 키우고 지키는 힘이 중요해진다.

이 시기에는 빨리 벌고 빨리 쓰는 돈보다 오래 남는 돈이 맞다. 부동산, 장기 자산, 안정적인 사업 구조, 정기 계약, 고정 거래처, 내 이름으로 들어오는 일처럼 시간이 지나도 무너지지 않는 돈이 중요하다.

여기서 돈그릇이 한 번 더 커진다. 앞에서 직업과 사업의 방향을 제대로 잡아놨다면 이 시기에는 20억~30억권 이상을 본다. 판이 크게 맞고, 무리한 지출과 사람 때문에 새는 돈을 막으면 30억~50억권까지도 보는 구간이다.

반대로 앞에서 번 돈을 자산으로 묶지 못하고, 사람 부탁·투자 말·큰 지출에 계속 흔들리면 이 시기에는 돈이 들어와도 남는 돈이 약해진다. 그래서 이 구간은 버는 시기이면서 동시에 지켜야 하는 시기다.

[재물운을 키우기 위해 지금 해야 할 순서]
첫째, 맞는 직업축부터 잡아야 한다. 이 사주는 ${top1.label}, ${top2.label}, ${top3.label} 쪽에서 돈길이 열린다. 이 축과 상관없는 일을 오래 붙잡으면 바쁜데 돈이 작게 남는다.

둘째, 돈 받는 기준을 만들어야 한다. 월급이든 단가든 상담료든 수수료든 견적이든, 내가 얼마를 받아야 남는지 기준이 있어야 한다. 기준 없이 부탁으로 움직이면 재물운이 새기 쉽다.

셋째, 반복 수입을 만들어야 한다. 한 번 받고 끝나는 돈보다 다시 들어오는 돈이 필요하다. 정기 계약, 유지관리, 재구매, 재방문, 소개, 납품, 강의 반복, 상담 반복, 자격 기반 수입 중 하나가 붙어야 돈그릇이 커진다.

넷째, 큰돈이 나가기 전에 작게 검증해야 한다. 처음부터 큰 매장, 큰 재고, 큰 광고비, 큰 투자로 들어가면 재물운이 열리기 전에 돈이 묶인다. 작게 팔아보고, 다시 찾는지 보고, 남는 돈을 확인한 뒤 키워야 한다.

[내 인생 평생 돈문 지도]
첫 돈문은 ${wealthProfile.windows.first.age}다. ${wealthProfile.windows.first.meaning}

확장 돈문은 ${wealthProfile.windows.expansion.age}다. ${wealthProfile.windows.expansion.meaning}

인생 최대 재물 돈문은 ${wealthProfile.windows.peak.age}다. ${wealthProfile.windows.peak.meaning} 이 구간의 최대 돈그릇은 ${wealthProfile.peakRange}으로 본다.

재물 위험 돈문은 ${wealthProfile.windows.risk.age}다. ${wealthProfile.windows.risk.meaning} 이때는 돈을 더 벌겠다는 마음보다 큰 손실을 만드는 선택 하나를 피하는 게 더 중요하다.

돈이 내 것으로 굳는 시기는 ${wealthProfile.windows.consolidation.age}다. ${wealthProfile.windows.consolidation.meaning}

[올해 돈이 움직이는 달]
올해는 ${timing.moneyMoveMonth}월 전후로 돈 이야기가 움직인다. 제안, 판매, 견적, 상담, 받을 돈, 계약 이야기가 붙을 수 있다. 이 달에는 기다리지만 말고 연락, 견적, 판매, 정산, 조건 협의를 직접 움직여야 한다.

${timing.moneyLeakMonth}월 전후에는 돈이 새기 쉽다. 사람 부탁, 급한 결제, 투자 이야기, 충동구매, 큰 지출을 조심해야 한다. 이 달에는 새로 벌리는 것보다 새는 돈을 막는 쪽이 맞다.

${timing.moneyCatchMonth}월 전후에는 놓친 돈을 다시 잡는 문이 열린다. 앞에서 미뤄졌던 일, 다시 연락 오는 거래, 재정리되는 계약, 받을 돈 확인을 봐야 한다. 이 달은 새 판보다 회수와 재정리에 힘이 붙는다.

[재물운 마지막 종합 판정]
최종 판정은 이거다.

${name}, 너는 돈 없는 사주가 아니다. 작게 풀리면 3억~7억권, 제대로 풀리면 10억~20억권, 강하게 열리면 20억~30억권 이상, 판이 크게 맞으면 30억~50억권까지도 보는 돈그릇이다.

하지만 아무 돈이나 잡아서 되는 사주는 아니다. ${top1.label}, ${top2.label}, ${top3.label}처럼 이 명식에 맞는 직업축에서 돈이 열린다. 사업을 한다면 요식업·외식·야간 매장·옷장사·가게창업·온라인사업·유통·납품을 전부 갈라야 한다.

돈이 붙는 길은 맞는 직업, 반복 손님, 자기 이름, 자격, 기술, 거래처, 재방문이다. 돈이 새는 길은 큰 재고, 큰 월세, 큰 광고비, 남 말 듣는 투자, 정 때문에 흐려지는 돈이다.`;
}


function buildStrongCareerFullReport(user: UserInfo, manse: any) {
  const name = getName(user);
  const detail = getCareerDetailedProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const snap = getElementSnapshot(manse);
  const top1 = detail.top1;
  const top2 = detail.top2;
  const top3 = detail.top3;
  const b1: any = detail.businessTop3?.[0];
  const b2: any = detail.businessTop3?.[1];
  const b3: any = detail.businessTop3?.[2];

  const birthYear = Number(user.year || 0);
  const nowYear = new Date().getFullYear();
  const currentAge = birthYear > 1900 ? Math.max(0, nowYear - birthYear + 1) : 0;
  const firstStart = Number(timing.firstMoneyAge || 0);
  const strongStart = Number(timing.strongMoneyAge || 0);
  const assetStart = Number(timing.assetAge || 0);

  const timingSentence = (start: number, end: number, label: string) => {
    if (!start) return "";
    if (currentAge && currentAge > end) {
      return `${start}~${end}세 전후는 이미 지나간 ${label} 구간이다. 그때 직장·역할·돈 버는 방식이 바뀌었는지 돌아보는 시점이다.`;
    }
    if (currentAge && currentAge >= start && currentAge <= end) {
      return `지금이 바로 ${start}~${end}세 ${label} 구간에 들어와 있다. 기다리는 것보다 실제 역할·단가·거래 구조를 바꾸는 행동이 중요하다.`;
    }
    return `${start}~${end}세 전후가 ${label} 구간이다. 그 전에 기술·거래처·가격 기준 중 하나를 미리 만들어 두는 편이 좋다.`;
  };

  return `[일·사업운 첫 판정]
${name}, 네 일·사업운의 핵심은 '${detail.workStyle}'이다.

이 말은 당장 회사를 그만두라는 뜻이 아니다. 회사에서도 살 수 있지만, 최종적으로 돈이 커지는 지점은 네 판단·가격·거래처·기술·고객처럼 '내 몫'이 생겼을 때다.

현재 구조로 보면 회사형 ${detail.split.office} : 자기수익형 ${detail.split.own}으로 본다. 중요한 건 직함이 아니라 어떤 역할에서 네 몸값이 실제 돈으로 바뀌느냐다.

[내 사주상 일 그릇 분석]
사주상 일간은 ${snap.dayMaster}이고, 강하게 드러나는 축은 ${snap.strongestElement}, 약하게 흔들리는 축은 ${snap.weakestElement}로 본다.

이걸 직업명으로 바로 번역하면 풀이가 틀어진다. 그래서 이번 판정은 '교사가 맞다, 옷장사가 맞다'처럼 직업 하나를 찍는 방식이 아니라, 네가 어떤 방식으로 돈을 만드는지부터 본다.

네 사주에서 중요한 것은 ① 돈이 어디서 들어오는지 직접 보는 자리, ② 가격·조건·거래를 움직일 수 있는 자리, ③ 반복 고객·반복 계약·재구매가 생기는 자리, ④ 경험이 쌓일수록 네 이름값과 단가가 올라가는 자리다.

[내게 가장 돈이 되는 직업 1순위]
1순위는 ${top1.label}이다.

구체적으로는 ${top1.jobs} 쪽이다.

왜 1순위냐면 ${top1.why}

회사에 있다면 ${top1.companyRole}처럼 결과와 돈의 흐름을 직접 보는 역할을 잡는 게 맞다.

밖으로 나간다면 ${top1.outsideRole}처럼 네 고객·네 거래처·네 가격이 생기는 구조로 가야 한다.

이 길의 돈그릇은 ${top1.moneyRange}으로 본다. 단, 직업 이름만 같다고 이 돈이 열리는 게 아니다. 반복 거래, 가격결정권, 자기 고객, 자기 이름 중 두 가지 이상이 붙어야 이 돈그릇을 실제로 쓸 수 있다.

주의할 것은 ${top1.caution}

[내게 돈이 되는 직업 2순위]
2순위는 ${top2.label}이다.

구체적으로는 ${top2.jobs} 쪽이다. ${top2.why}

회사 안에서는 ${top2.companyRole} 쪽으로 붙이면 되고, 밖으로 나가면 ${top2.outsideRole} 쪽으로 확장하는 게 맞다.

이 길은 1순위와 같은 돈그릇을 따로 하나 더 약속하는 길이 아니다. ${top2.moneyRange} 수준의 잠재력은 보되, 핵심 역할은 1순위의 몸값과 단가를 높이는 보조축이다.

1순위와 완전히 다른 인생을 살라는 뜻이 아니다. 1순위가 가장 큰 중심축이라면, 2순위는 몸값과 단가를 높이는 현실적인 보조축이다.

주의할 것은 ${top2.caution}

[내게 돈이 되는 직업 3순위]
3순위는 ${top3.label}이다.

구체적으로는 ${top3.jobs} 쪽이다. ${top3.why}

회사에서는 ${top3.companyRole}, 독립하면 ${top3.outsideRole} 쪽으로 연결할 수 있다.

이 길도 독립된 큰돈 약속으로 보지 않는다. ${top3.moneyRange} 수준의 잠재력보다 중요한 건 1순위 본업 옆에 반복수입을 하나 더 붙이는 확장축이라는 점이다.

3순위는 1순위가 막혔을 때 아무거나 잡는 대체품이 아니다. 본업 옆에 붙여 수입원을 하나 더 만드는 확장축으로 보는 게 맞다.

주의할 것은 ${top3.caution}

[직장에 남는다면 어디까지 갈 수 있나]
직장에 남는다면 단순 반복 사무나 지시만 받는 자리는 오래 갈수록 답답해진다.

네가 잡아야 할 것은 ${top1.companyRole}, ${top2.companyRole}처럼 돈·조건·고객·성과가 눈앞에 보이는 자리다.

회사 안에서도 '시키는 일을 잘하는 사람'보다 '가격을 정하고, 조건을 맞추고, 문제를 해결하고, 거래를 끝내는 사람'이 될수록 몸값이 오른다.

월급만으로 끝내면 돈그릇의 상단까지 쓰기 어렵다. 성과급, 수수료, 전문수당, 프로젝트 책임, 거래처 책임처럼 네 결과와 보상이 연결되는 구조가 붙어야 한다.

[밖으로 나가면 어디서 돈이 커지나]
밖으로 나갈 때는 처음부터 큰 창업으로 가면 안 된다.

첫 단계는 작은 주문·작은 고객·작은 계약이다. 돈이 실제로 들어오는지 먼저 확인해야 한다.

두 번째는 반복이다. 한 번 팔고 끝나는 돈보다 다시 찾는 거래처, 재구매, 정기 관리, 유지보수, 소개가 붙어야 한다.

세 번째는 가격결정권이다. 남이 정한 단가를 받는 사람에서 벗어나 네가 견적과 조건을 정하는 순간 돈그릇이 달라진다.

마지막은 자기 거래처·자기 상품·자기 서비스다. 여기까지 가야 ${top1.moneyRange}의 상단을 실제 현실권으로 볼 수 있다.

[돈그릇이 커지는 조건]
네 돈그릇은 직업 이름 하나로 커지지 않는다.

작게 벌 때는 월급이나 건별 수입으로 돈을 만든다. 여기서는 생활 기반을 만드는 단계다.

그다음은 네 역할에 가격이 붙는 단계다. 성과급·수수료·전문수당·고단가 프로젝트가 붙으면 돈의 속도가 달라진다.

그 다음은 자기 고객과 반복 거래를 갖는 단계다. 이때부터 회사 월급만으로 만드는 돈과 차이가 크게 벌어진다.

가장 크게 열릴 때는 거래처·상품·서비스·가격 중 적어도 두 가지를 네가 직접 쥐는 구조다. 이 조건이 없으면 '30억~50억권' 같은 큰 돈그릇도 실제 내 돈이 되기 어렵다.

[사업을 한다면 TOP 3]
사업을 한다면 이것저것 다 맞는다고 하지 않는다. 점수가 높은 세 가지만 본다.

1순위는 ${b1?.label || "유통·납품·도매"}다. 판정은 '${b1?.verdict || "반복거래가 있으면 맞다"}'. ${b1?.reason || ""}

2순위는 ${b2?.label || "온라인사업"}다. 판정은 '${b2?.verdict || "팔 물건이 있으면 맞다"}'. ${b2?.reason || ""}

3순위는 ${b3?.label || "소형 전문점"}다. 판정은 '${b3?.verdict || "작게 검증하면 가능"}'. ${b3?.reason || ""}

이 세 가지보다 점수가 낮은 업종은 굳이 길게 권하지 않는다. '할 수 있다'와 '큰돈이 된다'는 다른 이야기다.

[하면 돈보다 피로가 먼저 붙는 일]
첫째, 가격을 내가 못 정하면서 책임만 큰 일은 피해야 한다.

둘째, 팔리기 전에 재고·월세·인테리어·광고비가 먼저 크게 나가는 사업은 피해야 한다.

셋째, 친분 때문에 외상이나 단가 기준이 흐려지는 거래는 피해야 한다.

넷째, 직함은 있는데 내 기술·고객·거래처가 하나도 남지 않는 자리는 오래 붙잡지 않는 게 좋다.

다섯째, '누가 돈 된다고 했다'는 이유만으로 시작하는 업종은 버려라. 네 사주에서 큰돈은 남의 유행보다 네가 반복해서 다룰 수 있는 구조에서 생긴다.

[일이 크게 움직이는 시기]
${timingSentence(firstStart, firstStart + 2, "첫 직업 전환")}
${timingSentence(strongStart, strongStart + 3, "몸값과 수입이 굵어지는")}
${assetStart ? timingSentence(assetStart, assetStart + 4, "큰돈을 자산과 자기 판으로 굳히는") : ""}

올해는 ${timing.moneyMoveMonth}월 전후에 일과 돈 이야기가 움직이는 달로 본다. 견적·제안·계약·직무변경·거래 이야기가 붙으면 직접 확인해야 한다.

${timing.moneyLeakMonth}월 전후에는 급한 선택, 사람 부탁, 선지출을 조심해야 한다.

${timing.moneyCatchMonth}월 전후에는 놓쳤던 일이나 거래를 다시 잡는 흐름이 있다.

[지금부터 해야 할 순서]
첫째, 1순위인 ${top1.label} 안에서 지금 당장 맡을 수 있는 역할 하나를 정한다.

둘째, 그 역할에서 가격·견적·고객·거래처·계약 중 최소 하나를 직접 다루는 경험을 만든다.

셋째, 독립을 생각한다면 큰돈을 먼저 넣지 말고 작은 주문이나 작은 고객으로 실제 수익을 검증한다.

넷째, 한 번 들어온 돈을 반복시키는 구조를 만든다. 재구매·재계약·소개·정기관리 중 하나가 생겨야 한다.

다섯째, 반복 매출이 확인되기 전에는 큰 매장·큰 재고·무리한 투자로 판을 키우지 않는다.

[일·사업운 마지막 판정]
${name}, 네 일·사업운의 결론은 '${detail.workStyle}'이다.

가장 돈이 되는 1순위는 ${top1.label}, 2순위는 ${top2.label}, 3순위는 ${top3.label}이다.

회사에 남아도 이 세 축과 연결되는 역할을 잡아야 하고, 밖으로 나가도 이 축을 버리면 안 된다.

가장 중요한 건 '무슨 직업이냐'보다 '그 직업에서 무엇을 쥐고 있느냐'다. 가격, 거래처, 고객, 기술, 반복수입 중 네 몫이 많아질수록 돈그릇이 커진다.

사업은 맞지만 처음부터 크게 벌이지 않는다. 부업·작은 주문·작은 계약으로 먼저 돈이 들어오는지 검증하고, 반복 매출이 확인될 때 키우는 방식이 맞다.`;
}

function needsStrongCareerFullReplacement(text: string, categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  if (!isCareerCategory(categoryId, title) && !title.includes("일·사업")) return false;
  const source = text || "";
  const required = ["밥벌이가 되는 자리", "돈이 굵어지는 자리", "내 이름이 붙으면 커지는 일", "돈그릇"];
  const missing = required.filter((word) => !source.includes(word)).length;
  const sceneCount = (source.match(/장면|예를 들어|구체적으로|회사에 있으면|밖으로 나가면|피해야 할/g) || []).length;
  if (source.length < 5500) return true;
  if (missing >= 2) return true;
  if (!/억/.test(source)) return true;
  if (sceneCount < 6) return true;
  if (/강한 현실감과 책임감을 잘 활용할 수 있는 자리야/.test(source)) return true;
  if (/안정적인 기반을 만들고, 그 위에서 점차 확장/.test(source)) return true;
  return false;
}



function clampRelationshipScore(value: number, min = 35, max = 96) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function relationshipScoreGrade(score: number) {
  if (score >= 90) return "상";
  if (score >= 80) return "중상";
  if (score >= 70) return "중";
  if (score >= 60) return "중하";
  return "하";
}

function relationshipMetricVerdict(score: number) {
  if (score >= 90) return "매우 강함";
  if (score >= 80) return "강함";
  if (score >= 70) return "잘 맞는 편";
  if (score >= 60) return "조율 필요";
  if (score >= 50) return "차이가 큼";
  return "주의 필요";
}

function stableRelationshipJitter(seed: number, key: string, range = 7) {
  const mixed = hashToSeed(`${seed}:${key}:${RELATIONSHIP_LOGIC}`);
  return (mixed % (range * 2 + 1)) - range;
}

function scoreMetric(
  key: string,
  label: string,
  score: number,
  description: string,
): ScoreMetric {
  const safeScore = clampRelationshipScore(score);
  return {
    key,
    label,
    score: safeScore,
    verdict: relationshipMetricVerdict(safeScore),
    description,
  };
}

function genderToVisualTag(gender?: "남성" | "여성"): "male" | "female" {
  return gender === "여성" ? "female" : "male";
}

function oppositeVisualGender(gender?: "남성" | "여성"): "male" | "female" {
  return gender === "여성" ? "male" : "female";
}

function pickFromSeed<T>(seed: number, key: string, values: readonly T[]): T {
  return values[hashToSeed(`${seed}:${key}`) % values.length];
}

function buildImageVisualTags(
  seed: number,
  gender: "male" | "female",
  role: "user" | "partner" | "ideal",
): ImageVisualTags {
  const moods = role === "user"
    ? (["clean", "confident", "warm", "cold", "professional", "active"] as const)
    : (["clean", "sexy", "innocent", "confident", "warm", "cold", "professional"] as const);
  const outfits = gender === "male"
    ? (["shirt", "knit", "casual", "office", "sports"] as const)
    : (["dress", "knit", "casual", "office", "sports"] as const);
  const poses = ["standing", "chair", "stool", "desk", "stairs", "wall"] as const;

  return {
    gender,
    mood: pickFromSeed(seed, `${role}-mood`, moods),
    outfit: pickFromSeed(seed, `${role}-outfit`, outfits),
    pose: pickFromSeed(seed, `${role}-pose`, poses),
  };
}

function getLoveMarriageScoreVisual(
  user: UserInfo,
  manse: any,
  seed: number,
): LoveMarriageScoreVisual {
  const snap = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  const attraction = clampRelationshipScore(66 + snap.fire * 5 + snap.wood * 2 + output * 2 + stableRelationshipJitter(seed, "love-attraction"));
  const expression = clampRelationshipScore(58 + snap.fire * 4 + output * 4 - resource + stableRelationshipJitter(seed, "love-expression"));
  const discernment = clampRelationshipScore(61 + snap.metal * 4 + resource * 3 + authority - peer + stableRelationshipJitter(seed, "love-discernment"));
  const stability = clampRelationshipScore(62 + snap.earth * 4 + authority * 2 + resource - output + stableRelationshipJitter(seed, "love-stability"));
  const recovery = clampRelationshipScore(58 + snap.water * 5 + resource * 2 - peer + stableRelationshipJitter(seed, "love-recovery"));
  const intimacyCharm = clampRelationshipScore(63 + snap.fire * 4 + snap.water * 3 + wealth + output + stableRelationshipJitter(seed, "love-intimacy-charm"));

  const loveMetrics = [
    scoreMetric("firstImpression", "첫인상 흡입력", attraction, "처음 만났을 때 상대의 시선을 붙잡는 힘이다."),
    scoreMetric("expression", "감정 표현력", expression, "좋아하는 마음을 말과 행동으로 전달하는 정도다."),
    scoreMetric("discernment", "인연을 보는 눈", discernment, "끌림과 오래 갈 사람을 구분하는 힘이다."),
    scoreMetric("relationshipStability", "관계 지속력", stability, "감정 기복을 넘어 관계를 꾸준히 끌고 가는 힘이다."),
    scoreMetric("recovery", "상처 회복력", recovery, "서운함과 이별 뒤에 중심을 되찾는 속도다."),
    scoreMetric("intimacyCharm", "은근한 성적 매력", intimacyCharm, "가까워질수록 드러나는 분위기와 긴장감이다."),
  ];
  const loveOverall = clampRelationshipScore(loveMetrics.reduce((sum, item) => sum + item.score, 0) / loveMetrics.length);

  const spouseLuck = clampRelationshipScore(60 + authority * 3 + wealth * 2 + snap.earth * 3 + stableRelationshipJitter(seed, "marriage-spouse"));
  const marriageStability = clampRelationshipScore(61 + snap.earth * 5 + authority * 2 - Math.abs(snap.fire - snap.water) * 2 + stableRelationshipJitter(seed, "marriage-stability"));
  const dailyLife = clampRelationshipScore(60 + snap.earth * 4 + snap.water * 2 + resource - output + stableRelationshipJitter(seed, "marriage-daily"));
  const moneyStandard = clampRelationshipScore(57 + wealth * 4 + snap.metal * 3 + snap.earth * 2 - peer + stableRelationshipJitter(seed, "marriage-money"));
  const familyDistance = clampRelationshipScore(58 + snap.metal * 4 + authority * 2 + snap.water - peer * 2 + stableRelationshipJitter(seed, "marriage-family"));
  const satisfaction = clampRelationshipScore((spouseLuck + marriageStability + dailyLife + moneyStandard + familyDistance) / 5 + stableRelationshipJitter(seed, "marriage-satisfaction", 4));

  const marriageMetrics = [
    scoreMetric("spouseLuck", "배우자복", spouseLuck, "내 삶을 안정시키고 함께 성장할 배우자를 만나는 힘이다."),
    scoreMetric("marriageStability", "결혼 안정도", marriageStability, "결혼 후 감정과 책임을 오래 유지하는 힘이다."),
    scoreMetric("dailyLife", "생활 적응력", dailyLife, "수면·정리·식사·휴식 같은 생활 리듬을 맞추는 힘이다."),
    scoreMetric("moneyStandard", "돈 기준 안정도", moneyStandard, "생활비·저축·소비·자산 기준을 세우는 힘이다."),
    scoreMetric("familyDistance", "가족 거리 조절", familyDistance, "양가 가족과 부부 사이의 선을 지키는 힘이다."),
    scoreMetric("marriageSatisfaction", "결혼 후 만족도", satisfaction, "감정·생활·돈이 함께 맞았을 때 느끼는 안정감이다."),
  ];
  const marriageOverall = clampRelationshipScore(marriageMetrics.reduce((sum, item) => sum + item.score, 0) / marriageMetrics.length);

  const userGender = genderToVisualTag(user.gender);
  const idealGender = oppositeVisualGender(user.gender);

  return {
    kind: "loveMarriage",
    version: RELATIONSHIP_LOGIC,
    love: {
      overall: loveOverall,
      grade: relationshipScoreGrade(loveOverall),
      verdict: loveOverall >= 85 ? "사람을 강하게 끌어당기는 연애운" : loveOverall >= 75 ? "인연은 들어오지만 기준이 필요한 연애운" : loveOverall >= 65 ? "천천히 깊어지는 연애운" : "끌림보다 사람을 고르는 기준이 먼저인 연애운",
      metrics: loveMetrics,
    },
    marriage: {
      overall: marriageOverall,
      grade: relationshipScoreGrade(marriageOverall),
      verdict: marriageOverall >= 85 ? "결혼이 삶의 안정으로 이어지는 운" : marriageOverall >= 75 ? "맞는 사람을 고르면 안정되는 결혼운" : marriageOverall >= 65 ? "생활 기준을 맞춰야 편해지는 결혼운" : "감정보다 돈·생활·가족 기준을 먼저 봐야 하는 결혼운",
      metrics: marriageMetrics,
    },
    visualProfiles: {
      user: buildImageVisualTags(seed, userGender, "user"),
      idealPartner: buildImageVisualTags(seed + 91, idealGender, "ideal"),
      userTitle: "연애할 때 드러나는 네 분위기",
      userDescription: attraction >= 80 ? "처음에는 단정해 보여도 가까워질수록 시선을 오래 붙잡는 사람" : "쉽게 다 보이지 않아 시간을 두고 매력이 드러나는 사람",
      partnerTitle: "네가 실제로 끌리는 사람의 분위기",
      partnerDescription: discernment >= 75 ? "외모보다 태도와 생활 기준이 분명해 오래 믿을 수 있는 사람" : "첫눈에 분위기가 들어오고 감정을 분명히 보여주는 사람",
    },
  };
}

function getCompatibilityScoreVisual(
  user: UserInfo,
  manse: any,
  partnerManse: any | null,
  seed: number,
): CompatibilityScoreVisual {
  const compatibility = getCompatibilityScore(manse, partnerManse);
  const intimacy = getSokgunghapScore(manse, partnerManse);
  const me = getElementSnapshot(manse);
  const partner = partnerManse ? getElementSnapshot(partnerManse) : getElementSnapshot({});
  const businessPartner = user.compatibilityType === "사업파트너 궁합";
  const base = compatibility.score;

  const firstAttraction = clampRelationshipScore(base + me.fire * 2 + partner.fire * 2 + stableRelationshipJitter(seed, "compat-first"));
  const conversation = clampRelationshipScore(base - Math.abs(me.metal - partner.metal) * 4 + (me.water + partner.water) * 2 + stableRelationshipJitter(seed, "compat-talk"));
  const emotion = clampRelationshipScore(base - Math.abs(me.water - partner.water) * 5 + (me.fire + partner.fire) + stableRelationshipJitter(seed, "compat-emotion"));
  const trust = clampRelationshipScore(base + (me.earth + partner.earth) * 2 + (me.metal + partner.metal) - Math.abs(me.fire - partner.fire) * 2 + stableRelationshipJitter(seed, "compat-trust"));
  const dailyLife = clampRelationshipScore(base + (me.earth + partner.earth) * 2 - Math.abs(me.earth - partner.earth) * 5 - Math.abs(me.water - partner.water) * 2 + stableRelationshipJitter(seed, "compat-daily"));
  const money = clampRelationshipScore(base + (me.metal + partner.metal) * 2 + (me.earth + partner.earth) - Math.abs(me.wood - partner.wood) * 3 + stableRelationshipJitter(seed, "compat-money"));
  const family = clampRelationshipScore(base + (me.earth + partner.earth) + (me.metal + partner.metal) - Math.abs(me.earth - partner.earth) * 4 + stableRelationshipJitter(seed, "compat-family"));
  const contact = clampRelationshipScore((conversation + emotion + trust) / 3 + stableRelationshipJitter(seed, "compat-contact", 4));

  const relationshipMetrics = [
    scoreMetric("firstAttraction", "첫 끌림", firstAttraction, "처음 마주쳤을 때 서로를 의식하게 되는 힘이다."),
    scoreMetric("conversation", "대화 궁합", conversation, "말투와 설명 방식이 서로에게 편하게 들어가는 정도다."),
    scoreMetric("emotion", "감정 궁합", emotion, "서운함과 애정을 받아들이는 속도가 맞는 정도다."),
    scoreMetric("trust", "신뢰 궁합", trust, "말과 행동이 반복될수록 믿음이 쌓이는 정도다."),
    scoreMetric("dailyLife", "생활 궁합", dailyLife, "수면·정리·식사·휴식 리듬이 맞는 정도다."),
    scoreMetric("money", "돈 궁합", money, "소비·저축·투자·공동지출 기준이 맞는 정도다."),
    scoreMetric("family", "가족 궁합", family, "양가 가족과 부부 사이의 거리를 맞추는 정도다."),
    scoreMetric("contact", "연락 리듬", contact, "연락 빈도와 답을 기다리는 속도가 맞는 정도다."),
  ];

  const loveScore = clampRelationshipScore((firstAttraction + conversation + emotion + trust + contact) / 5);
  const marriageScore = clampRelationshipScore((trust + dailyLife + money + family + conversation) / 5);

  const bodyAttraction = clampRelationshipScore(intimacy.score + (me.fire + partner.fire) + stableRelationshipJitter(seed, "intimacy-body", 5));
  const desireTemperature = clampRelationshipScore(intimacy.score - Math.abs(me.fire - partner.fire) * 4 + stableRelationshipJitter(seed, "intimacy-desire", 5));
  const pace = clampRelationshipScore(intimacy.score - Math.abs(me.water - partner.water) * 4 - Math.abs(me.fire - partner.fire) * 2 + stableRelationshipJitter(seed, "intimacy-pace", 5));
  const lead = clampRelationshipScore(intimacy.score + Math.abs(me.fire - partner.fire) * 2 - Math.abs(me.metal - partner.metal) * 2 + stableRelationshipJitter(seed, "intimacy-lead", 5));
  const afterglow = clampRelationshipScore((bodyAttraction + desireTemperature + emotion + trust) / 4 + stableRelationshipJitter(seed, "intimacy-afterglow", 4));

  const intimacyMetrics = businessPartner ? [] : [
    scoreMetric("bodyAttraction", "몸의 끌림", bodyAttraction, "가까워졌을 때 서로의 몸과 분위기에 반응하는 힘이다."),
    scoreMetric("desireTemperature", "욕구 온도", desireTemperature, "서로 원하는 친밀감의 크기가 맞는 정도다."),
    scoreMetric("pace", "속도 궁합", pace, "가까워지는 시작과 진행 속도가 맞는 정도다."),
    scoreMetric("lead", "주도권 호흡", lead, "누가 이끌고 받아주는지가 자연스럽게 맞는 정도다."),
    scoreMetric("afterglow", "남는 여운", afterglow, "가까워진 뒤 감정과 만족감이 오래 이어지는 정도다."),
  ];

  const userToPartner = clampRelationshipScore(firstAttraction + me.fire * 2 + me.water + stableRelationshipJitter(seed, "attraction-user"));
  const partnerToUser = clampRelationshipScore(firstAttraction + partner.fire * 2 + partner.water + stableRelationshipJitter(seed, "attraction-partner"));
  const mutual = clampRelationshipScore((userToPartner + partnerToUser) / 2);

  const userGender = genderToVisualTag(user.gender);
  const partnerGender = genderToVisualTag(user.partnerGender);
  const overallVerdict = compatibility.score >= 85
    ? "서로를 보완하며 오래 갈 힘이 강한 궁합"
    : compatibility.score >= 75
      ? "끌림은 강하고 생활 기준을 맞추면 오래 가는 궁합"
      : compatibility.score >= 60
        ? "좋은 부분과 피곤한 부분이 함께 있는 궁합"
        : "감정만으로 밀면 같은 문제로 반복해서 부딪히는 궁합";

  return {
    kind: "compatibility",
    version: RELATIONSHIP_LOGIC,
    overall: {
      score: compatibility.score,
      grade: compatibility.grade,
      verdict: overallVerdict,
      summary: compatibility.summary,
    },
    headlineScores: {
      love: loveScore,
      marriage: marriageScore,
      intimacy: businessPartner ? null : intimacy.score,
    },
    attraction: {
      userToPartner,
      partnerToUser,
      mutual,
      verdict: Math.abs(userToPartner - partnerToUser) >= 12
        ? "서로 끌리지만 한쪽의 감정 온도가 더 높다"
        : mutual >= 85
          ? "서로를 강하게 의식하고 끌어당기는 관계"
          : mutual >= 70
            ? "상호 호감과 긴장감이 분명한 관계"
            : "끌림보다 신뢰와 편안함을 먼저 만들어야 하는 관계",
    },
    relationshipMetrics,
    intimacyMetrics,
    visualProfiles: {
      user: buildImageVisualTags(seed, userGender, "user"),
      partner: buildImageVisualTags(seed + 131, partnerGender, "partner"),
      userTitle: "관계에서 보이는 너",
      userDescription: userToPartner >= partnerToUser ? "상대를 더 깊게 의식하고 관계의 온도를 끌어올리는 쪽" : "처음에는 조심스럽지만 상대 반응이 확인되면 깊어지는 쪽",
      partnerTitle: "관계에서 보이는 상대",
      partnerDescription: partnerToUser >= userToPartner ? "먼저 분위기를 열고 관계의 반응을 확인하려는 쪽" : "감정을 천천히 열지만 한번 붙으면 오래 보는 쪽",
    },
  };
}

function buildRelationshipScoreVisual(params: {
  categoryId: CategoryId;
  categoryTitle: string;
  user: UserInfo;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed: number;
}): RelationshipScoreVisual {
  if (params.categoryId === "compatibility" || params.categoryTitle.includes("궁합")) {
    return getCompatibilityScoreVisual(
      params.user,
      params.manse,
      params.partnerManse || null,
      params.fortuneSeed,
    );
  }

  if (
    params.categoryId === "love" ||
    params.categoryId === "marriage" ||
    params.categoryTitle.includes("연애") ||
    params.categoryTitle.includes("결혼") ||
    params.categoryTitle.includes("사랑")
  ) {
    return getLoveMarriageScoreVisual(params.user, params.manse, params.fortuneSeed);
  }

  return null;
}

function buildStrongCompatibilityFullReport(user: UserInfo, manse: any, partnerManse: any | null) {
  const compatibility = getCompatibilityScore(manse, partnerManse || null);
  const intimacy = getSokgunghapScore(manse, partnerManse || null);
  const partnerTaste = getPartnerAttractionProfile(manse, partnerManse || null);
  const myTaste = partnerManse
    ? getPartnerAttractionProfile(partnerManse, manse)
    : {
        ideal: "내가 끌리는 취향은 본인 사주 기준으로만 기본 판정한다.",
        speech: "상대 정보가 없으면 서로의 말투 궁합은 깊게 자르지 않는다.",
        look: "외형과 분위기는 상대 사주가 들어와야 서로 맞물리는지 갈린다.",
        intimacy: "상대 정보가 없으면 가까워졌을 때 맞는지은 기본 흐름만 본다.",
        fit: "현재는 본인 사주 중심의 끌림만 본다.",
        mismatch: "상대 정보가 없으면 어긋나는 지점은 확정하지 않는다.",
      };

  const score = compatibility.score;
  const intimacyScore = intimacy.score;
  const isStrong = score >= 75;
  const isHard = score < 60;
  const intimacyStrong = intimacyScore >= 78;
  const intimacyHard = intimacyScore < 65;

  const firstVerdict = isStrong
    ? "이 관계는 처음 끌림에서 끝나는 궁합은 아니다. 서로에게 없는 기운을 건드리는 지점이 있어서 마음이 붙으면 오래 볼 수 있다."
    : isHard
      ? "이 관계는 끌림은 있어도 편하게 굴러가는 궁합은 아니다. 좋아하는 마음만 믿고 밀면 같은 자리에서 반복해서 부딪힌다."
      : "이 관계는 좋은 부분과 피곤한 부분이 같이 있다. 처음에는 끌리지만, 오래 가려면 속도와 말투를 맞춰야 한다.";

  const intimacyVerdict = intimacyStrong
    ? "속궁합은 좋은 편이다. 가까워질수록 어색해지는 궁합이 아니라, 감정이 풀리면 몸의 거리도 자연스럽게 줄어드는 쪽이다."
    : intimacyHard
      ? "속궁합은 약한 편이다. 끌림은 있어도 가까워질수록 원하는 분위기와 속도가 다르다. 감정의 안전감이 먼저 잡히지 않으면 몸의 거리도 편하게 붙지 않는다."
      : "속궁합은 중간 이상이다. 끌림은 있다. 다만 자연스럽게 척척 맞는 궁합은 아니고, 한쪽이 급하게 밀면 부담이 생기고 천천히 맞추면 깊어진다.";

  const improve = intimacyStrong
    ? "좋아지려면 이미 있는 끌림을 감정싸움으로 망치지 않는 게 핵심이다. 서운함을 오래 쌓아두지 말고, 분위기가 식기 전에 말투를 부드럽게 풀어야 한다."
    : intimacyHard
      ? "좋아지려면 스킨십보다 안정감을 먼저 만들어야 한다. 재촉하는 말, 확인받으려는 말, 갑자기 분위기를 세게 몰고 가는 행동은 관계를 닫게 만든다. 천천히 편해지는 시간을 줘야 한다."
      : "좋아지려면 속도를 맞춰야 한다. 한쪽은 확인이 빠르고, 한쪽은 마음이 열려야 가까워진다. 먼저 분위기를 만들고, 상대가 반응할 때 한 걸음씩 들어가야 깊어진다.";

  const keepOrStop = isHard
    ? "계속 만나려면 감정만으로 밀면 안 된다. 말투, 연락 속도, 돈 쓰는 기준, 가까워지는 속도 중 하나라도 계속 어긋나면 오래 갈수록 피로가 커진다."
    : "계속 만나도 되는 관계다. 다만 그냥 둔다고 좋아지는 궁합은 아니다. 끌림은 있는데, 그 끌림을 오래 가는 생활 리듬으로 바꾸는 노력이 필요하다.";

  const intimacyPatternIndex = Math.abs((score * 7 + intimacyScore * 11) % 4);
  const intimacyPattern = [
    {
      spark: "상대가 먼저 분위기를 열고, 네가 그 온도를 오래 끌고 가는 궁합이다. 처음 손이 닿는 순간보다 서로의 반응을 확인한 뒤부터 더 뜨거워진다.",
      rhythm: "짧고 급하게 끝내는 방식보다 말과 눈빛, 손길을 오래 쌓은 뒤 천천히 깊어지는 패턴이 맞다. 한 번 흐름이 붙으면 중간에 끊지 않고 오래 이어가는 쪽에서 만족도가 높다.",
      lead: "처음 주도권은 상대에게 가지만, 가까워질수록 네가 속도와 강약을 가져간다. 한쪽만 계속 끌고 가는 것보다 중간에 주도권이 자연스럽게 넘어올 때 긴장이 더 오래 간다.",
      position: "서로의 얼굴과 호흡을 가까이 느끼는 밀착형 자세가 잘 맞는다. 마주 보거나 앉은 상태에서 몸을 붙이고 반응을 확인할수록 감정과 욕구가 같이 올라간다.",
      after: "끝난 뒤 바로 거리를 두는 것보다 한동안 붙어 있거나 대화를 이어가는 쪽이 맞다. 이 여운이 있어야 다음 끌림도 더 깊어진다.",
    },
    {
      spark: "겉으로는 네가 더 차분해 보여도 실제 욕구의 깊이는 네 쪽이 더 크다. 상대는 먼저 건드리고, 너는 한 번 열리면 쉽게 식지 않는 쪽이다.",
      rhythm: "빠르게 불붙는 순간도 있지만 진짜 만족은 천천히 리듬을 맞출 때 올라간다. 자극의 세기보다 상대가 어떻게 반응하는지 읽고 그 반응을 따라가는 패턴이 더 잘 맞는다.",
      lead: "주도권은 번갈아 움직이는 편이 좋다. 한쪽이 오래 지배하면 다른 쪽이 식고, 받다가 어느 순간 흐름을 뒤집는 식의 공방에서 서로 더 강하게 끌린다.",
      position: "한쪽이 속도와 각도를 조절할 수 있는 자세가 맞다. 상대의 움직임을 억지로 바꾸기보다 리듬을 받아주다가 자연스럽게 주도권을 넘겨받는 방식이 만족도를 높인다.",
      after: "끝난 뒤에는 말보다 태도가 중요하다. 바로 휴대폰을 보거나 등을 돌리면 만족이 반감되고, 손길과 체온을 조금 더 남겨둘 때 관계의 끈적함이 오래 간다.",
    },
    {
      spark: "둘은 몸보다 분위기에서 먼저 당긴다. 평소 단정한 사람이 둘만 남았을 때 조금씩 흐트러지는 장면, 가까이 앉아 있다가 거리가 무너지는 순간에 욕구가 크게 올라간다.",
      rhythm: "계획된 이벤트보다 예상하지 못한 순간의 스킨십에서 불이 붙는다. 다만 시작은 즉흥적이어도 흐름은 천천히 가져가야 한다. 너무 서두르면 한쪽은 만족하기 전에 마음부터 닫힌다.",
      lead: "확신 있게 이끄는 쪽과 그 흐름을 받아주는 쪽이 분명할 때 잘 맞는다. 애매하게 눈치만 보는 것보다 한쪽이 먼저 당기고, 다른 쪽이 반응으로 허락하는 구조가 좋다.",
      position: "몸이 멀리 떨어지는 방식보다 가슴과 허리, 다리가 가까이 붙는 자세에서 반응이 크다. 옆으로 오래 붙어 있거나 한쪽이 안정적으로 감싸는 밀착형 자세가 잘 맞는다.",
      after: "이 궁합은 끝난 뒤의 여운까지 속궁합에 포함된다. 짧은 칭찬, 가벼운 포옹, 다음 만남을 암시하는 말이 남아야 만족이 완성된다.",
    },
    {
      spark: "처음부터 거칠게 타오르는 궁합은 아니다. 대신 신뢰가 붙은 뒤에는 평소 숨겨둔 욕구가 한꺼번에 나온다. 밖에서는 차분하지만 둘만 남으면 온도 차이가 크게 드러난다.",
      rhythm: "감정 확인과 몸의 반응이 같이 움직여야 한다. 말없이 바로 가까워지는 방식보다 장난, 대화, 눈빛으로 긴장을 충분히 만든 뒤 넘어가는 패턴에서 만족도가 높다.",
      lead: "상대가 분위기를 만들고 네가 속도를 결정하는 흐름이 맞다. 네 반응이 분명할수록 상대도 더 과감해지고, 네가 망설이면 상대도 금방 조심스러워진다.",
      position: "서로 눈을 피하지 않고 반응을 확인할 수 있는 자세가 가장 잘 맞는다. 마주 앉거나 가까이 기대어 한쪽이 속도를 조절하는 방식에서 감정과 욕구가 동시에 붙는다.",
      after: "끝난 뒤 정서적인 확인이 꼭 필요하다. 사랑받고 있다는 감각이 남아야 몸의 만족도도 높아지고, 그 확인이 빠지면 뜨거웠던 순간 뒤에 허전함이 남는다.",
    },
  ][intimacyPatternIndex];

  const intimacyMismatch = intimacyHard
    ? "문제는 욕구가 약해서가 아니라 원하는 속도와 안전감이 다르다는 데 있다. 한쪽은 몸이 가까워져야 마음을 확인하고, 다른 한쪽은 마음이 확인돼야 몸이 열린다. 이 순서를 무시하면 한쪽은 재촉받고, 다른 한쪽은 거절당했다고 느낀다."
    : intimacyStrong
      ? "이 궁합의 위험은 끌림이 약해서가 아니다. 감정이 상한 날에도 몸으로 덮으려는 순간 문제가 생긴다. 욕구는 강하지만 서운함을 풀지 않은 채 가까워지면 만족 뒤에 더 큰 거리감이 남는다."
      : "둘은 끌림이 있지만 리듬이 완전히 같지는 않다. 한쪽이 분위기를 빠르게 올리면 다른 쪽은 따라가기 전에 부담을 느낄 수 있다. 먼저 반응을 확인하고 속도를 한 단계씩 올려야 한다.";

  return `[궁합운 첫 판정]
결론부터 말하면, 두 사람의 궁합은 ${compatibility.score}점이고 '${compatibility.grade}'으로 본다.

${firstVerdict}

궁합 핵심은 이것이다. ${compatibility.summary} 좋아하는 마음이 있어도 두 사람이 원하는 속도, 말투, 가까워지는 방식이 다르면 관계는 쉽게 피곤해진다. 반대로 이 차이를 알고 맞추면 처음보다 뒤로 갈수록 더 붙을 수 있다.

[내 사주상 분석]
네 사주는 관계에서 아무나 쉽게 들이는 쪽이 아니다. 마음이 움직여도 속으로 먼저 따진다. 이 사람이 나를 편하게 하는지, 말과 행동이 같은지, 시간이 지나도 태도가 변하지 않는지를 본다.

좋아하는 마음이 생기면 가볍게 지나가지 않는다. 대신 상대가 애매하게 굴면 머릿속에서 계속 계산이 돈다. 그래서 너는 확신을 주는 사람에게 오래 가고, 말은 좋은데 행동이 흐린 사람에게는 마음이 지친다.

[내가 원하는 취향]
${myTaste.ideal}

네가 끌리는 사람은 단순히 얼굴이 예쁜 사람, 조건이 좋은 사람으로 끝나지 않는다. 분위기, 말투, 거리감, 생활 태도까지 같이 본다. 처음엔 눈에 들어오는 외형이 있어도 오래 마음이 가는 쪽은 네 기운을 편하게 풀어주는 사람이다.

${myTaste.look}

[상대가 원하는 외향과 분위기]
${partnerTaste.look}

상대가 보는 외향은 단순한 얼굴형 문제가 아니다. 상대 사주가 편하게 느끼는 분위기, 가까이 두고 싶은 인상, 오래 봐도 질리지 않는 결이 따로 있다. 그래서 네가 상대에게 맞는지는 얼굴 하나가 아니라 말투, 표정, 태도, 거리감까지 같이 봐야 한다.

[상대가 원하는 말투와 태도]
${partnerTaste.speech}

상대는 말투에서 마음을 연다. 좋아한다는 말만 많이 하는 사람보다, 불안하게 흔들지 않고 자기 마음을 분명히 보여주는 사람에게 오래 끌린다. 여기서 네 말투가 급하거나 확인을 재촉하면 상대는 뒤로 물러난다.

[나는 상대 취향에 들어가는가]
${partnerTaste.fit}

이 관계는 네가 상대 취향에 완전히 밖에 있는 궁합은 아니다. 다만 상대가 원하는 방식과 네가 다가가는 방식이 다르면, 처음 끌림은 있어도 중간에 피로가 붙는다.

상대는 네가 어떤 사람인지보다 네가 어떻게 다가오는지를 더 크게 본다. 같은 말도 부드럽게 하면 마음을 열고, 재촉하듯 던지면 닫힌다.

[상대는 내 취향에 들어오는가]
${myTaste.fit}

상대도 네 취향과 맞물리는 부분이 있다. 그래서 처음에 그냥 지나치기 어렵다. 마음이 가는 이유가 있다. 다만 끌리는 지점과 오래 맞는 지점은 다르다.

네가 원하는 안정감, 반응, 표현, 거리감이 상대에게서 얼마나 나오는지가 중요하다. 처음 설렘만 보고 가면 나중에 서운함이 생기고, 실제 태도를 보면 오래 갈지 답이 나온다.

[두 사람은 왜 서로에게 끌렸는가]
두 사람은 서로에게 없는 기운을 건드린다. 한쪽은 상대의 분위기에서 호기심을 느끼고, 한쪽은 쉽게 다 보이지 않는 반응 때문에 더 신경이 쓰인다.

이 끌림은 가벼운 호감만은 아니다. 처음에는 말보다 분위기에서 먼저 온다. 표정, 답장 속도, 만났을 때의 공기, 옆에 있을 때의 긴장감에서 서로를 의식하게 된다.

[두 사람은 어디서 어긋나는가]
가장 조심할 부분은 이것이다. ${compatibility.risk}

두 사람은 싫어서 멀어지는 궁합이 아니다. 좋아하는 방식이 달라서 멀어질 수 있다. 한쪽은 빨리 확인받고 싶고, 한쪽은 천천히 믿고 싶어 한다. 이 차이를 모르면 같은 문제로 계속 서운해진다.

[연락과 말투에서 엇갈리는 부분]
연락은 마음의 크기보다 속도 차이에서 꼬인다. 한쪽은 답이 늦으면 마음이 식은 것처럼 느끼고, 한쪽은 재촉받으면 숨이 막힌다.

말투도 중요하다. 농담처럼 던진 말이 상대에게는 거리 두는 말로 들릴 수 있고, 확인받고 싶어서 한 말이 상대에게는 압박으로 들어갈 수 있다. 이 관계는 말투가 날카로워지는 순간 끌림도 같이 식는다.

[속궁합 판정]
속궁합 점수는 ${intimacy.score}점이고 '${intimacy.grade}'으로 본다.

${intimacyVerdict}

${intimacy.summary} 두 사람은 단순히 스킨십이 편한지만 보는 궁합이 아니다. 누가 먼저 불을 붙이는지, 어느 속도에서 몸이 열리는지, 주도권이 어떻게 오갈 때 더 깊어지는지까지 봐야 한다.

[누가 먼저 불을 붙이는가]
${intimacyPattern.spark}

[두 사람이 선호하는 섹스 패턴]
${intimacyPattern.rhythm}

이 관계는 몸만 가까워지는 방식으로는 만족이 오래 가지 않는다. 눈빛, 손길, 말투, 숨이 가까워지는 순간까지 같이 쌓여야 한다. 상대의 반응을 보지 않고 자기 속도만 밀어붙이면 점수가 높아도 실제 만족은 떨어진다.

[주도권이 맞는 방식]
${intimacyPattern.lead}

[잘 맞는 자세와 밀착 방식]
${intimacyPattern.position}

여기서 말하는 자세는 체위 이름을 정답처럼 외우라는 뜻이 아니다. 둘이 가장 잘 반응하는 구조가 무엇인지 보는 것이다. 얼굴을 보고 붙는지, 한쪽이 속도를 잡는지, 옆으로 오래 밀착하는지에 따라 만족도가 달라진다.

[욕구 온도와 속도 차이]
${intimacyMismatch}

[끝난 뒤 남는 여운]
${intimacyPattern.after}

[속궁합이 좋아지는 조건]
${improve}

원하는 속도, 싫은 지점, 더 오래 이어가고 싶은 순간을 말로 꺼내야 한다. 알아서 맞춰주기를 기다리면 한쪽은 부족하다고 느끼고, 다른 한쪽은 압박받았다고 느낀다.

[가까워지면 더 붙는가 식는가]
가까워졌을 때 서로의 반응을 읽고 리듬을 맞추면 더 붙는다. 반대로 감정이 상한 날 몸으로 확인하려 들거나, 상대가 굳어 있는데도 분위기를 밀어붙이면 빠르게 식는다.

이 궁합은 점수보다 실제 태도에 따라 차이가 크게 난다. 끌림을 재촉으로 쓰면 소모되고, 상대의 반응을 읽는 데 쓰면 오래 뜨겁게 간다.

[연애로 보면 오래 가는 궁합인가]
연애로 보면 중간 이상은 간다. 다만 처음 설렘에 비해 관리가 필요한 궁합이다. 감정이 생겼다고 끝난 관계가 아니라, 말투와 속도를 계속 맞춰야 오래 간다.

좋아지려면 약속을 지키는 것, 답을 흐리지 않는 것, 서운한 말을 쌓아두지 않는 것이 중요하다. 이 세 가지가 잡히면 궁합 점수보다 실제 관계가 더 좋아진다.

[결혼까지 가면 조심할 부분]
결혼까지 보면 감정만으로는 부족하다. 돈 쓰는 방식, 가족과의 거리, 생활 리듬, 말투가 맞아야 한다.

연애 때는 다른 점이 매력으로 보이지만, 결혼하면 그 차이가 생활 피로가 된다. 특히 한쪽이 계속 맞추는 구조가 되면 결혼 후에는 서운함이 크게 쌓인다.

[이 관계를 살리는 방법]
첫째, 확인을 재촉하지 마라. 둘째, 서운함을 비꼬듯 말하지 마라. 셋째, 가까워지는 속도를 상대 반응에 맞춰라. 넷째, 말보다 반복 행동으로 믿음을 줘라.

이 관계는 감정이 없는 궁합이 아니다. 감정은 있다. 다만 감정만 믿으면 흔들리고, 방식을 맞추면 살아난다.

[궁합운 마지막 판정]
최종 판정은 이거다.

${keepOrStop}

두 사람은 끌림이 있다. 하지만 끌림만으로 오래 가는 궁합은 아니다. 상대가 원하는 외향과 분위기, 네가 원하는 취향, 서로의 말투와 속궁합이 맞물려야 깊어진다.

이 관계를 살리려면 급하게 답을 내리지 말고, 상대가 마음을 여는 속도를 봐야 한다. 천천히 열리게 만들면 깊어지고, 빨리 확인하려 들면 식는다.`;
}



function getV85CareerLaneText(item: DetailedCareerItem, name: string) {
  return `${name} 사주에서 가장 먼저 살아나는 직업길은 ${item.label}이다.

직업명만 보면 얕다. 이 길은 ${item.jobs}처럼 겉모양이 여러 갈래로 갈라져도, 안쪽 원리는 같다. ${item.why}

이 길로 가면 돈은 ${item.moneyRange}으로 본다. 단, ${item.caution}`;
}

function getV85BusinessFocus(detail: ReturnType<typeof getCareerDetailedProfile>) {
  const businessScore = getDetailScore(detail, "business");
  const onlineScore = getDetailScore(detail, "online");
  const financeScore = getDetailScore(detail, "finance");
  const storeScore = getDetailScore(detail, "foodStore");
  const nightScore = getDetailScore(detail, "night");
  const fashionScore = getDetailScore(detail, "fashion");
  const concreteStoreJobs = "편의점, 반찬가게, 분식집, 도시락, 카페, 세탁소, 미용실, 네일샵, 피부관리샵, 수리점, 휴대폰 매장, 문구점, 동네 식자재·생활용품점";

  const lines: string[] = [];

  if (businessScore >= 12) {
    lines.push(`사업으로 돈을 키우는 길은 살아 있다. 중심은 영업, 유통, 무역, 도매, 납품, 중개, 대리점, 총판, 프랜차이즈, 자영업처럼 사람·상품·가격·거래가 움직이는 일이다. 이 길은 한 번 팔고 끝나는 장사보다 반복 거래와 받을 돈이 분명할 때 커진다.`);
  }

  if (onlineScore >= 12) {
    lines.push(`온라인 쪽도 열려 있다. 유튜브, 쇼츠, 블로그, 인스타, 온라인강의, 전자책, 디자인, 광고대행, 마케팅, 스마트스토어, 쿠팡, 상세페이지, 앱·웹서비스처럼 사람을 모아 상품이나 서비스로 바꾸는 일이 맞다. 단, 조회수만 쫓으면 돈이 늦고 팔 물건이나 예약, 상담, 강의, 판매 구조가 붙어야 한다.`);
  }

  if (financeScore >= 12) {
    lines.push(`금융·부동산·자산관리 쪽도 돈을 키우는 길로 본다. 은행, 보험, 증권, 자산관리, 부동산, 경매, 분양, 대출상담, 회계, 재무처럼 숫자, 계약, 회수 시점을 보는 일에서 돈의 크기를 키울 수 있다.`);
  }

  if (storeScore >= 13) {
    lines.push(`오프라인 매장 사업을 본다면 실제 후보는 ${concreteStoreJobs} 같은 업종이다. 이런 업종은 크게 보이는 것보다 매일 팔릴 물건, 다시 오는 이유, 남는 마진이 분명해야 돈이 남는다.`);
  } else if (storeScore >= 9) {
    lines.push(`소형 매장 쪽은 크게 벌리면 조심해야 한다. 편의점, 반찬가게, 분식집, 도시락, 카페, 세탁소, 미용실, 네일샵, 피부관리샵, 수리점, 휴대폰 매장, 문구점, 동네 식자재·생활용품점 같은 업종을 보더라도 월세·인건비·재고를 낮추고 작게 검증해야 한다.`);
  }

  if (fashionScore >= 13) {
    lines.push(`의류·잡화 쪽은 감각만으로 보면 안 된다. 의류매장, 온라인 의류, 신발, 가방, 악세사리, 잡화, 빈티지, 동대문 사입, 라이브커머스는 재고를 크게 안지 않고 빠르게 돌릴 때만 돈이 된다.`);
  }

  if (nightScore >= 13) {
    lines.push(`야간 매장 운영은 조건부로만 본다. 호프, 포차, 이자카야, 바처럼 늦은 시간 사람을 상대하는 업종은 사람 모으는 힘이 있어야 하지만, 외상·직원·감정소모를 막지 못하면 돈과 몸이 같이 샌다.`);
  }

  if (!lines.length) {
    return `사업운은 중심으로 크게 보지 않는다.

이 사주는 장사판을 아예 못 한다는 뜻이 아니다. 다만 인생의 주 수입을 사업으로 바로 걸면 돈보다 부담이 먼저 붙는다. 사업을 하더라도 본업에서 쌓은 기술, 자격, 고객, 경험을 바탕으로 작게 열어야 한다.

중심 직업길을 먼저 세우고, 사업은 그 위에 붙는 보조 수익으로 보는 게 맞다.`;
  }

  return `사업을 한다면 큰 직업축과 세부 업종을 나눠 봐야 한다.

${lines.join("\n\n")}

최종적으로 사업은 처음부터 크게 벌리는 방식이 아니라, 먼저 돈 받는 기준과 반복 구조를 만든 뒤 키워야 한다. 매출보다 남는 돈, 규모보다 회수되는 돈을 먼저 봐야 한다.`;
}

function buildV85CareerFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const detail = getCareerDetailedProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const career = getCareerArchetype(manse);
  const coreCareer = getCoreCareerDetail(detail);
  const first = coreCareer.first;
  const second = coreCareer.second;
  const third = coreCareer.third;

  return `[일·사업운 첫 판정]
결론부터 말하면, ${name}의 일·사업운은 직업명 하나로 찍으면 틀어진다.

이 사주는 “무슨 직업이 1순위냐”보다 어디서 밥벌이가 되고, 어디서 돈이 굵어지고, 어디로 가면 몸과 돈이 같이 새는지를 봐야 한다.

큰 판정은 '${career.combined}'이다. 다만 이 판정은 시작점이다. 실제 밥벌이는 ${first.label} 쪽에서 먼저 잡히고, 돈의 크기는 ${second.label}과 맞물릴 때 커진다. ${third.label}은 상황이 맞으면 같이 붙는 길이다. 이 세 길은 직업명 하나가 아니라, 이 사람이 어떤 방식으로 일하고 돈을 받아야 살아나는지를 가르는 기준이다.

[내 사주상 일 그릇 분석]
이 사주는 아무 자리나 오래 붙어 있으면 사는 사주가 아니다. 일이 실제로 돌아가는 자리, 돈이 오가는 자리, 사람이 다시 찾는 자리, 기준을 잡고 결과를 내는 자리에서 기운이 산다.

사주에서 강하게 잡힌 일의 길은 ${first.label}이다. 이 길이 먼저 살아야 밥벌이가 흔들리지 않는다. 그다음에 사업, 장사, 자격, 기술, 온라인, 자산 같은 길이 붙을 때 돈의 크기가 달라진다.

[밥벌이가 되는 자리]
${getV85CareerLaneText(first, name)}

밥벌이는 여기서 먼저 만들어진다. 남 보기에 멋있어 보이는 직업보다, 네 사주가 오래 버티고 돈을 남길 수 있는 자리가 중요하다.

[돈이 굵어지는 자리]
돈이 굵어지는 길은 ${second.label} 쪽에서도 열린다.

${second.jobs} 같은 방향은 첫 길과 맞물릴 때 커진다. 단순히 일을 많이 한다고 돈이 커지는 게 아니라, 자격·기술·고객·반복 주문·소개·거래처처럼 다시 들어오는 돈이 붙어야 한다.

이 길로 돈이 붙으면 ${second.moneyRange}까지 본다. 월급으로만 끝나면 작고, 자기 이름이나 반복 고객이 붙으면 커진다.

[내 이름이 붙으면 커지는 일]
이 사주는 남의 간판 밑에서도 배울 수 있다. 하지만 평생 남의 이름으로만 움직이면 돈그릇이 다 열리지 않는다.

네가 고른 상품, 네가 맡은 고객, 네가 만든 기준, 네가 설명한 기술, 네가 관리한 거래가 다시 돌아올 때 돈이 커진다. 상담, 자격, 기술, 관리, 판매, 교육, 전문 서비스, 반복 거래처럼 이름과 신뢰가 붙는 구조가 맞다.

[나랏밥이 맞는 사주인가]
나랏밥은 ${detail.ranked.find((x: any)=>x.key==="gov")?.score >= 12 ? "맞는 쪽으로 본다" : "중심 길로 강하게 보지는 않는다"}.

공무원, 공기업, 공공기관, 행정, 세무, 관세, 공단, 협회 같은 길은 명식에서 관성과 인성이 살아 있을 때 강하게 본다. 이 기운이 강하면 안정된 월급, 신용, 연금, 대출, 자산으로 돈을 쌓는다. 약하면 조직의 틀은 버틸 수 있어도 답답함이 먼저 온다.

[전문직으로 가면 돈이 붙는가]
전문직 운은 ${detail.ranked.find((x: any)=>["medical","legal","tech"].includes(x.key))?.label} 쪽에서 본다.

의료·치료·상담, 법무·세무·회계, 기술·개발·정비·품질은 모두 같은 직업이 아니다. 이 사주에서 전문직이 맞으려면 사람에게 맡길 이유가 생겨야 한다. 자격, 기술, 기준, 해결력이 돈으로 바뀌어야 산다.

[가르치는 일로 먹고살 수 있는가]
교육운은 ${detail.ranked.find((x: any)=>x.key==="education")?.score >= 12 ? "강하게 살아 있다" : "보조 길로 본다"}.

교사, 강사, 학원, 과외, 교재, 자격증 교육, 온라인강의는 사주에 인성과 식상이 같이 살아야 돈이 된다. 강하면 지식이 상품이 되고, 약하면 남을 가르치는 일은 오래 갈수록 피곤하다.

[사업을 한다면 어떤 업종인가]
${getV85BusinessFocus(detail)}

[하면 돈보다 피로가 먼저 붙는 일]
피해야 할 일은 분명하다.

첫째, 남들이 돈 된다고 떠드는 일에 그대로 들어가는 것이다. 사주에 맞지 않는 판은 시작할 때는 그럴듯해 보여도 결국 돈보다 피로가 먼저 남는다.

둘째, 돈 받을 길이 흐린 일이다. 바쁘게 움직였는데 이름도 돈도 남지 않는 일은 오래 할수록 기운이 빠진다.

셋째, 먼저 빠지는 돈이 큰 일이다. 월세, 인건비, 재고, 광고비가 먼저 커지면 복이 붙기 전에 부담이 먼저 붙는다.

[일이 움직이는 시기]
일이 움직이는 시기는 ${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세 전후, ${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후, ${timing.assetAge}세 이후로 본다.

올해는 ${timing.moneyMoveMonth}월 전후에 일과 돈 이야기가 움직이고, ${timing.moneyLeakMonth}월 전후에는 사람 부탁이나 급한 선택으로 일이 새기 쉽다. ${timing.moneyCatchMonth}월 전후에는 놓친 일을 다시 잡는 문이 열린다.

[일·사업운 마지막 판정]
최종 판정은 이거다.

${name}는 직업명을 맞히는 사주가 아니라, 먹고사는 자리와 돈이 굵어지는 자리를 따로 봐야 하는 사주다.

중심 길은 ${first.label}이다. 여기에 ${second.label}, ${third.label}이 어떻게 붙느냐에 따라 직장형으로 안정될 수도 있고, 자기 이름이 붙는 돈으로 커질 수도 있다.

이 사주는 맞는 길과 안 맞는 길이 분명하다. 맞는 일은 작게 시작해도 반복 돈이 붙고, 안 맞는 일은 크게 벌어도 몸과 돈이 같이 눌린다.`;
}

function getV85MoneySource(detail: ReturnType<typeof getCareerDetailedProfile>) {
  const top = detail.top1;
  const key = (top as any).key;
  if (key === "gov") return "월급·신용·연금·대출·자산으로 쌓이는 돈";
  if (key === "medical" || key === "legal" || key === "tech") return "자격·전문성·해결력으로 받는 돈";
  if (key === "education") return "교육·강의·상담·교재·콘텐츠로 받는 돈";
  if (key === "business" || key === "foodStore" || key === "fashion" || key === "online" || key === "night") return "고객·상품·반복 주문·판매 구조로 굴리는 돈";
  if (key === "finance") return "숫자·계약·자산·부동산으로 묶이는 돈";
  return "기술·관리·반복 고객으로 붙는 돈";
}

type V87MoneyActionProfile = {
  doorName: string;
  moneyName: string;
  firstAction: string;
  secondAction: string;
  thirdAction: string;
  productLine: string;
  customerLine: string;
  priceLine: string;
  repeatLine: string;
  scaleLine: string;
  leakLine: string;
  firstStep: string;
  notThis: string;
};

function getV87MoneyActionProfile(detail: ReturnType<typeof getCareerDetailedProfile>): V87MoneyActionProfile {
  const top = detail.top1 as any;
  const key = String(top.key || "");

  const base: V87MoneyActionProfile = {
    doorName: "기술·관리·반복 고객형",
    moneyName: "맡기면 해결되는 돈",
    firstAction: "먼저 내가 해결할 수 있는 문제를 하나로 좁혀야 한다. 이것저것 다 하겠다고 벌리면 돈이 흐려지고, ‘이 문제는 이 사람에게 맡긴다’는 인식이 생겨야 돈문이 열린다.",
    secondAction: "그다음 가격표를 만들어야 한다. 대충 봐주고, 대충 도와주고, 나중에 받는 돈은 재물운을 흐리게 만든다. 돈 받을 기준이 분명해야 한다.",
    thirdAction: "마지막은 반복 구조다. 한 번 처리하고 끝나는 일보다, 점검·관리·재구매·재계약·소개가 이어지는 구조를 만들어야 한다.",
    productLine: "팔 것은 물건 하나가 아니라 ‘해결력’이다. 정리, 관리, 점검, 수리, 상담, 납품, 운영처럼 맡기면 일이 끝나는 상품을 만들어야 한다.",
    customerLine: "맞는 손님은 싼 것만 찾는 사람이 아니다. 문제를 빨리 끝내고 싶어 하고, 기준이 분명한 사람에게 돈이 붙는다.",
    priceLine: "가격은 낮게 깔면 안 된다. 기본금, 추가금, 관리비, 재방문 비용을 나눠야 돈이 남는다.",
    repeatLine: "반복 돈은 정기 점검, 월 관리, 재주문, 재계약, 소개에서 생긴다.",
    scaleLine: "크게 키우려면 혼자 일만 많이 하는 방식이 아니라 매뉴얼, 견적표, 계약서, 반복 고객 명단을 만들어야 한다.",
    leakLine: "돈이 새는 곳은 무료 도움, 애매한 부탁, 늦은 입금, 기준 없는 할인이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 ‘내가 돈 받고 해결할 문제 1개’를 정하고, 그 문제에 대한 가격표를 만드는 것이다.",
    notThis: "막연히 돈 되는 일을 찾는 방식은 맞지 않는다. 돈 받을 문제를 좁히지 않으면 계속 바쁜데 남는 돈이 작다.",
  };

  if (key === "gov") return {
    doorName: "안정 자산 축적형",
    moneyName: "월급·신용·연금·대출·자산으로 쌓이는 돈",
    firstAction: "재물운을 열려면 먼저 안정된 소득선을 지켜야 한다. 월급, 고정수당, 복지, 연금, 대출 신용처럼 흔들리지 않는 바닥이 돈문이다.",
    secondAction: "그다음 해야 할 일은 자산으로 묶는 것이다. 현금이 들어올 때마다 소비로 흩어지게 두지 말고 적금, 예금, 주택, 토지, 장기 자산으로 바꿔야 한다.",
    thirdAction: "승진, 시험, 자격, 직급, 호봉처럼 제도 안에서 올라가는 길을 버리면 안 된다. 이 사주는 제도권 안에서 돈의 안정성이 먼저 살아난다.",
    productLine: "팔아야 할 것은 상품보다 신용과 경력이다. 직함, 근속, 자격, 공신력이 돈으로 바뀐다.",
    customerLine: "맞는 돈줄은 투기성 손님이 아니라 기관, 조직, 안정된 계약, 장기 급여 흐름이다.",
    priceLine: "가격표보다 중요한 것은 월 고정 저축률이다. 먼저 빠지는 돈을 정해놓아야 남는다.",
    repeatLine: "반복 돈은 월급, 수당, 연금, 임대수익, 장기 이자, 안정 배당에서 생긴다.",
    scaleLine: "크게 키우려면 직장 밖에서 무리하게 장사하기보다 신용을 이용해 자산을 늘리는 쪽이 맞다.",
    leakLine: "돈이 새는 곳은 체면 지출, 가족·지인 부탁, 남이 돈 된다며 끌고 오는 투자다.",
    firstStep: "지금 당장 해야 할 첫 단계는 월 고정저축, 부채 정리, 신용관리, 장기 자산 계획을 숫자로 세우는 것이다.",
    notThis: "한 방에 뒤집는 투자와 큰 창업은 이 재물운을 흐린다. 안정선을 버리면 돈그릇이 흔들린다.",
  };

  if (key === "medical") return {
    doorName: "회복·관리 전문형",
    moneyName: "사람의 상태를 보고 회복시키는 돈",
    firstAction: "재물운을 열려면 사람의 불편한 상태를 읽고 해결하는 전문성을 만들어야 한다. 몸, 마음, 피부, 체형, 재활, 상담, 관리처럼 다시 찾아오는 분야에서 돈이 붙는다.",
    secondAction: "자격과 신뢰를 보여줘야 한다. 이 길은 말솜씨보다 경력, 자격, 후기, 소개, 재방문이 돈을 만든다.",
    thirdAction: "단발성 치료나 상담으로 끝내지 말고 관리 프로그램을 만들어야 한다. 1회 결제보다 4회, 8회, 월 관리가 재물운을 키운다.",
    productLine: "팔아야 할 것은 회복 과정이다. 진단, 상담, 관리, 재방문, 홈케어, 주기 점검이 돈으로 바뀐다.",
    customerLine: "맞는 손님은 싼 곳을 찾는 사람이 아니라 믿고 맡길 사람을 찾는 사람이다.",
    priceLine: "가격은 시간당이 아니라 프로그램 단위로 잡아야 한다. 처음 상담, 기본 관리, 집중 관리, 장기 관리로 나누면 돈이 남는다.",
    repeatLine: "반복 돈은 재방문, 관리권, 회원권, 소개, 정기 상담에서 생긴다.",
    scaleLine: "크게 키우려면 개인 실력에만 기대지 말고 예약 시스템, 관리표, 후기, 소개 루트를 만들어야 한다.",
    leakLine: "돈이 새는 곳은 무료 상담, 감정노동, 예약 취소, 늦은 결제, 몸을 갈아 넣는 과로다.",
    firstStep: "지금 당장 해야 할 첫 단계는 내가 잘 보는 문제 하나를 정하고, 그 문제를 해결하는 관리 프로그램을 만드는 것이다.",
    notThis: "아무 손님이나 다 받는 방식은 맞지 않는다. 돈보다 피로가 먼저 쌓인다.",
  };

  if (key === "education") return {
    doorName: "교육·설명 수익형",
    moneyName: "지식과 설명이 돈으로 바뀌는 돈",
    firstAction: "재물운을 열려면 남이 이해 못 하는 것을 쉽게 설명하는 상품을 만들어야 한다. 교사, 강의, 과외, 학원, 교재, 온라인 강의, 자격증 교육 쪽에서 돈문이 열린다.",
    secondAction: "내 머릿속 지식을 그냥 말로 흘리면 돈이 약하다. 커리큘럼, 교재, 강의안, 문제풀이, 상담표처럼 형태를 만들어야 돈을 받을 수 있다.",
    thirdAction: "반복 수강 구조를 만들어야 한다. 1회 강의보다 기초반, 심화반, 관리반, 자격증반처럼 다음 결제로 이어져야 커진다.",
    productLine: "팔아야 할 것은 지식이 아니라 변화다. 점수 상승, 합격, 이해, 실력 향상, 진로 정리가 상품이 된다.",
    customerLine: "맞는 손님은 배우고 싶은 사람, 자녀 교육에 돈을 쓰는 부모, 자격증·실력 향상이 필요한 사람이다.",
    priceLine: "가격은 시간당으로만 잡지 말고 과정별로 잡아야 한다. 입문, 집중, 관리, 프리미엄 과정을 나눠야 돈그릇이 커진다.",
    repeatLine: "반복 돈은 재수강, 형제·친구 소개, 월 관리, 교재 판매, 온라인 강의에서 생긴다.",
    scaleLine: "크게 키우려면 말로만 가르치지 말고 교재, 녹화강의, 커뮤니티, 관리 시스템을 붙여야 한다.",
    leakLine: "돈이 새는 곳은 무료 질문, 끝없는 보충, 감정 상담, 가격 깎기, 약속 없는 수업 변경이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 내가 가르칠 수 있는 주제 하나를 정하고, 4주짜리 과정으로 묶는 것이다.",
    notThis: "무작정 강의만 늘리는 방식은 맞지 않는다. 팔리는 과정이 없으면 체력만 빠진다.",
  };

  if (key === "legal") return {
    doorName: "기준·문서·계약 수익형",
    moneyName: "틀린 것을 잡고 기준을 세워 받는 돈",
    firstAction: "재물운을 열려면 계약, 세금, 문서, 규정, 심사, 감사처럼 기준이 필요한 일에 붙어야 한다.",
    secondAction: "이 길은 대충 봐주는 돈이 아니다. 검토 범위, 책임 범위, 수수료, 기한을 문서로 박아야 돈이 남는다.",
    thirdAction: "일회성 처리보다 정기 자문, 월 관리, 반복 신고, 계약 검토처럼 계속 들어오는 구조를 만들어야 한다.",
    productLine: "팔아야 할 것은 기준과 안전이다. 계약서, 신고, 심사, 검토, 리스크 정리가 상품이다.",
    customerLine: "맞는 손님은 문제가 터진 뒤 싼 사람을 찾는 쪽보다, 문제를 미리 막으려는 사업자와 조직이다.",
    priceLine: "가격은 건별 수수료와 월 자문료를 나눠야 한다. 급한 건은 급한 값이 따로 있어야 한다.",
    repeatLine: "반복 돈은 월 자문, 정기 신고, 계약 검토, 갱신 업무에서 생긴다.",
    scaleLine: "크게 키우려면 양식, 체크리스트, 자동화, 고객 관리표를 만들어야 한다.",
    leakLine: "돈이 새는 곳은 책임은 큰데 수수료가 작은 일, 지인 부탁, 말로만 맡기는 일이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 내가 맡을 문서·계약·신고 영역을 좁히고, 건별 가격표를 만드는 것이다.",
    notThis: "감정으로 떠안는 일은 맞지 않는다. 기준 없이 책임만 지면 돈보다 부담이 커진다.",
  };

  if (key === "tech") return {
    doorName: "기술·해결 수익형",
    moneyName: "고치고 맞추고 해결해서 받는 돈",
    firstAction: "재물운을 열려면 손에 잡히는 문제를 해결해야 한다. 전기, 전자, 기계, 설비, 개발, 수리, 품질, 자동화, 정비처럼 결과가 분명한 일에서 돈이 붙는다.",
    secondAction: "기술만 있으면 돈이 약하다. 견적, 작업 범위, 납기, 유지보수 비용을 따로 잡아야 한다.",
    thirdAction: "수리 한 번으로 끝내지 말고 점검, 유지보수, 부품 교체, 정기 관리 계약으로 이어야 한다.",
    productLine: "팔아야 할 것은 기술 시간이 아니라 해결 결과다. 설치, 점검, 수리, 개선, 유지보수, 긴급 대응이 상품이다.",
    customerLine: "맞는 손님은 싸게만 찾는 사람이 아니라 멈추면 손해가 커지는 현장, 장비, 사업자다.",
    priceLine: "가격은 출장비, 진단비, 작업비, 부품비, 긴급비, 유지보수비를 나눠야 한다.",
    repeatLine: "반복 돈은 정기 점검, 유지보수 계약, 부품 재주문, 개선 작업에서 생긴다.",
    scaleLine: "크게 키우려면 기술을 매뉴얼화하고, 작업 사례와 견적표를 쌓아야 한다.",
    leakLine: "돈이 새는 곳은 무료 진단, 무상 추가작업, 납기 지연, 책임 범위가 흐린 작업이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 작업 범위별 견적표와 유지보수 상품을 만드는 것이다.",
    notThis: "기술만 믿고 가격을 흐리게 받으면 바쁘기만 하고 돈이 남지 않는다.",
  };

  if (key === "business") return {
    doorName: "거래·영업·유통 수익형",
    moneyName: "사람과 물건과 가격을 움직여 받는 돈",
    firstAction: "재물운을 열려면 팔 물건보다 먼저 반복 거래처를 봐야 한다. 한 번 팔고 끝나는 돈보다 계속 다시 주문하는 구조가 맞다.",
    secondAction: "단가표, 마진표, 입금일, 납기, 반품 조건을 분명히 해야 한다. 거래 조건이 흐리면 매출은 커져도 돈이 안 남는다.",
    thirdAction: "품목을 너무 넓히지 말고 내가 가격을 잘 알고, 공급이 안정되고, 다시 찾는 품목으로 좁혀야 한다.",
    productLine: "팔아야 할 것은 아무 물건이 아니라 반복 수요가 있는 상품이다. 부품, 자재, 식자재, 소모품, 장비, 전문 생활용품처럼 다시 찾는 것이 맞다.",
    customerLine: "맞는 손님은 일회성 소비자보다 반복 주문을 넣는 사업자, 현장, 가게, 업체다.",
    priceLine: "가격은 매입가, 운임, 수수료, 세금, 재고 기간, 미수금 위험까지 넣어야 한다.",
    repeatLine: "반복 돈은 재주문, 납품 계약, 월 발주, 소모품 교체, 거래처 소개에서 생긴다.",
    scaleLine: "크게 키우려면 품목표, 견적 시스템, 거래처 리스트, 미수금 관리표를 만들어야 한다.",
    leakLine: "돈이 새는 곳은 과한 재고, 늦은 입금, 낮은 마진, 지인 거래, 조건 없는 외상이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 반복 주문이 생길 품목 3개와 그 품목의 실제 마진표를 만드는 것이다.",
    notThis: "팔리겠지 하고 물건부터 안는 방식은 맞지 않는다. 주문과 받을 돈이 먼저 보여야 한다.",
  };

  if (key === "foodStore" || key === "night") return {
    doorName: "외식·소형매장·서비스업 수익형",
    moneyName: "손님이 다시 찾아와 굴러가는 돈",
    firstAction: "재물운을 열려면 편의점, 반찬가게, 분식집, 도시락, 카페, 세탁소, 미용실, 네일샵, 피부관리샵, 수리점, 휴대폰 매장, 문구점, 동네 식자재·생활용품점처럼 실제로 사람들이 반복해서 돈을 쓰는 업종 중 하나를 좁혀야 한다. 큰 매장보다 회전과 재방문이 먼저다.",
    secondAction: "업종별로 돈 남는 포인트가 다르다. 반찬가게·분식집·도시락은 원가와 회전, 카페는 위치와 재방문, 세탁소·미용실·네일샵·피부관리샵·수리점은 예약과 재방문, 편의점·문구점·식자재점은 상권과 반복 구매를 봐야 한다.",
    thirdAction: "원가율, 폐기율, 인건비, 월세를 매일 봐야 한다. 매출만 보고 좋아하면 남는 돈이 사라진다.",
    productLine: "팔아야 할 것은 막연한 분위기가 아니다. 편의점은 입지와 반복 구매, 반찬가게·분식집·도시락은 원가와 회전, 카페는 재방문 이유, 세탁소·미용실·네일샵·피부관리샵·수리점은 예약과 기술값, 휴대폰 매장·문구점·식자재점은 상품 구색과 반복 구매가 돈이 된다.",
    customerLine: "맞는 돈은 업종별로 다르다. 편의점·문구점은 동네 반복 소비, 반찬가게·도시락·분식은 직장인과 가족 수요, 세탁소·미용실·네일샵·피부관리샵·수리점은 예약 손님과 재방문에서 생긴다.",
    priceLine: "가격은 원가율과 회전율을 먼저 보고 정해야 한다. 싸게 많이 파는지, 적게 팔아도 남기는지 하나로 정해야 한다.",
    repeatLine: "반복 돈은 단골, 세트메뉴, 정기 주문, 배달 재주문, 예약 손님에서 생긴다.",
    scaleLine: "크게 키우려면 메뉴를 줄이고, 레시피를 고정하고, 사람 없이도 돌아가는 운영표를 만들어야 한다.",
    leakLine: "돈이 새는 곳은 큰 인테리어, 높은 월세, 과한 재료, 직원 문제, 외상, 지인 서비스다.",
    firstStep: "지금 당장 해야 할 첫 단계는 메뉴를 넓히는 것이 아니라 ‘남는 메뉴 3개’를 정하고 원가율을 계산하는 것이다.",
    notThis: "사람 많이 오면 돈 벌겠지라는 방식은 맞지 않는다. 남는 구조가 없으면 장사는 바쁜 적자다.",
  };

  if (key === "fashion") return {
    doorName: "감각·사입·회전 수익형",
    moneyName: "빨리 팔릴 것을 골라 돌리는 돈",
    firstAction: "재물운을 열려면 예쁜 물건보다 빨리 팔릴 물건을 골라야 한다. 감각은 필요하지만 회전이 없으면 돈이 묶인다.",
    secondAction: "타깃을 좁혀야 한다. 모두에게 파는 옷은 재고가 남고, 특정 체형·나이·상황에 맞춘 상품이 돈이 된다.",
    thirdAction: "소량 테스트, 빠른 판매, 재입고 판단이 살아야 한다. 한 번에 많이 사입하면 재물운이 막힌다.",
    productLine: "팔아야 할 것은 스타일 제안이다. 출근룩, 데일리룩, 체형 커버, 특정 연령, 특정 취향처럼 이유가 있어야 팔린다.",
    customerLine: "맞는 손님은 싸게만 찾는 사람보다 내 취향을 대신 골라주길 원하는 사람이다.",
    priceLine: "가격은 사입가, 반품률, 촬영비, 광고비, 재고 기간까지 넣어야 한다.",
    repeatLine: "반복 돈은 신상 알림, 재구매, 세트 코디, 시즌 상품, 단골 리스트에서 생긴다.",
    scaleLine: "크게 키우려면 상품 수보다 회전율, 사진, 상세페이지, 고객 리스트를 먼저 키워야 한다.",
    leakLine: "돈이 새는 곳은 과한 사입, 안 팔리는 재고, 유행 지난 상품, 광고비만 쓰는 운영이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 타깃 하나를 정하고, 소량으로 팔릴 상품만 테스트하는 것이다.",
    notThis: "내 눈에 예쁘다고 크게 사입하는 방식은 맞지 않는다. 팔릴 이유가 먼저 있어야 한다.",
  };

  if (key === "online") return {
    doorName: "온라인·콘텐츠 전환 수익형",
    moneyName: "사람을 모아 상품으로 바꾸는 돈",
    firstAction: "재물운을 열려면 조회수보다 팔 것이 먼저 있어야 한다. 콘텐츠는 사람을 모으는 문이고, 돈은 상품·상담·강의·예약·판매에서 들어온다.",
    secondAction: "주제를 좁혀야 한다. 이것저것 올리면 반응은 있어도 돈이 안 모인다. 누구의 어떤 문제를 해결하는지 선명해야 한다.",
    thirdAction: "무료 콘텐츠 뒤에 유료 상품을 붙여야 한다. 상담, 전자책, 강의, 상세페이지, 스마트스토어, 예약, 멤버십 중 하나가 있어야 한다.",
    productLine: "팔아야 할 것은 콘텐츠가 아니라 결과다. 정보 정리, 구매 대행, 강의, 상담, 템플릿, 도구, 상품 추천이 돈이 된다.",
    customerLine: "맞는 손님은 막연히 구경하는 사람이 아니라 해결책을 찾는 사람이다.",
    priceLine: "가격은 무료, 입문, 본상품, 프리미엄으로 나눠야 한다. 전부 무료로 풀면 돈문이 막힌다.",
    repeatLine: "반복 돈은 구독, 재구매, 강의 후속 과정, 상담 연장, 상품 재구매에서 생긴다.",
    scaleLine: "크게 키우려면 콘텐츠 발행표, 랜딩페이지, 결제상품, 고객 DB를 만들어야 한다.",
    leakLine: "돈이 새는 곳은 조회수만 쫓는 것, 광고비, 무료 답변, 팔 상품 없는 채널 운영이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 콘텐츠 주제 하나와 그 뒤에 붙일 유료 상품 하나를 정하는 것이다.",
    notThis: "유명해지면 돈 벌겠지라는 방식은 맞지 않는다. 돈 받는 구조가 먼저 있어야 한다.",
  };

  if (key === "finance") return {
    doorName: "자산·계약·숫자 수익형",
    moneyName: "돈을 굴리고 묶어서 키우는 돈",
    firstAction: "재물운을 열려면 수입보다 자산 배치를 먼저 봐야 한다. 현금, 부동산, 대출, 세금, 보험, 투자 비중이 정리될 때 돈문이 열린다.",
    secondAction: "계약과 숫자를 직접 봐야 한다. 수익률, 이자, 세금, 중도 비용, 회수 시점이 흐리면 돈이 새어 나간다.",
    thirdAction: "빨리 벌려는 돈보다 오래 묶이는 돈을 만들어야 한다. 임대, 장기 저축, 안정 투자, 자산관리 쪽이 맞다.",
    productLine: "팔아야 할 것은 정보가 아니라 판단이다. 자산 배분, 계약 검토, 세금 정리, 위험 관리가 돈이 된다.",
    customerLine: "맞는 손님은 감으로 돈 쓰는 사람이 아니라 숫자를 정리하고 싶은 사람, 자산을 지키려는 사람이다.",
    priceLine: "가격은 결과와 책임 범위에 맞춰야 한다. 단순 소개비보다 관리비, 자문료, 성과 보수가 맞다.",
    repeatLine: "반복 돈은 자산관리, 갱신, 재계약, 임대, 세무·회계 관리에서 생긴다.",
    scaleLine: "크게 키우려면 고객 자산표, 계약 체크리스트, 리스크 기준표를 만들어야 한다.",
    leakLine: "돈이 새는 곳은 남 말 듣고 들어가는 투자, 레버리지 과다, 세금 계산 없는 매수, 회수 계획 없는 돈이다.",
    firstStep: "지금 당장 해야 할 첫 단계는 내 돈의 위치를 현금·부채·자산·투자·고정비로 나눠 적는 것이다.",
    notThis: "감으로 찍는 투자는 맞지 않는다. 숫자가 눈앞에 없으면 재물운이 닫힌다.",
  };

  return base;
}

function cleanMoneyActionLine(text: string) {
  return safeText(text, "")
    .replace(/돈문/g, "재물운")
    .replace(/문이 열린다/g, "길이 열린다")
    .replace(/문이고/g, "바닥이고")
    .replace(/문이다/g, "바닥이다")
    .replace(/막연히 돈 되는 일을 찾는 방식은 맞지 않는다\./g, "남들이 돈 된다며 몰리는 일을 따라가면 돈이 흐려진다.")
    .trim();
}

function getV89MoneyChannel(item: any) {
  const key = safeText(item?.key, "base");
  const label = safeText(item?.label, "현실수익형");
  const jobs = safeText(item?.jobs, "현실적으로 돈을 받을 수 있는 일");
  const why = safeText(item?.why, "명식에서 이 축이 돈으로 바뀌는 힘을 갖고 있다.");
  const moneyRange = safeText(item?.moneyRange, "10억~20억권이 현실권");

  if (key === "gov") return {
    title: "고정수입·신용자산형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "공무원, 공기업, 공공기관, 큰 조직, 협회, 재단, 행정·심사·계약·관리처럼 틀이 있는 자리에서 돈을 쌓아야 한다. 이 돈은 한 방에 튀는 돈이 아니라 월급, 신용, 연금, 대출, 부동산, 장기 자산으로 굵어진다.",
    expand: "재물운을 키우려면 조직 안에서 직함과 경력을 만들고, 그 신용을 자산으로 바꿔야 한다. 월급만 쓰고 끝내면 작고, 신용·대출·저축·부동산까지 연결하면 커진다.",
    avoid: "충동 창업, 지인 투자, 남 말 듣고 들어가는 장사, 규정 없는 돈거래는 맞지 않는다.",
  };

  if (key === "medical") return {
    title: "의료·회복·상담 전문수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "사람의 몸, 상태, 회복, 상담, 관리, 치료, 피부·체형·재활처럼 신뢰를 받고 맡는 일에서 돈을 받아야 한다. 핵심은 단순 판매가 아니라 상태를 읽고 좋아지게 만드는 값이다.",
    expand: "재물운을 키우려면 자격, 경력, 후기, 재방문 관리가 붙어야 한다. 병원, 센터, 상담실, 관리 프로그램, 정기 케어처럼 다시 찾는 구조가 생기면 돈그릇이 커진다.",
    avoid: "몸과 마음을 갈아 넣는 무리한 스케줄, 싸게 많이 받는 구조, 책임만 크고 가격이 낮은 일은 돈을 막는다.",
  };

  if (key === "education") return {
    title: "교육·강의·지식수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "지식, 설명, 정리, 교육, 강의, 교재, 과외, 학원, 자격증 교육처럼 남이 이해 못 하는 것을 알아듣게 만들어 돈을 받아야 한다.",
    expand: "재물운을 키우려면 강의 하나로 끝내지 말고 교재, 커리큘럼, 반복 수강, 온라인 강의, 자격 과정, 상담으로 이어야 한다. 지식이 상품이 될 때 돈이 굵어진다.",
    avoid: "무료 설명만 계속 해주거나, 누구에게나 맞추는 넓은 강의는 돈이 약하다. 가르칠 대상과 결과를 좁혀야 한다.",
  };

  if (key === "legal") return {
    title: "문서·계약·기준수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "법무, 세무, 회계, 관세, 행정, 계약, 심사, 감사, 규정관리처럼 기준을 세우고 문서로 정리하는 일에서 돈을 받아야 한다.",
    expand: "재물운을 키우려면 건별 처리비, 자문료, 월 관리, 검토 수수료처럼 가격 기준을 분명히 해야 한다. 책임 범위가 문서로 남을수록 돈이 남는다.",
    avoid: "친하다고 싸게 봐주는 일, 말로만 맡는 일, 책임은 큰데 돈은 작은 일은 재물운을 막는다.",
  };

  if (key === "tech") return {
    title: "기술·해결·유지관리 수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "개발, 전기·전자, 기계·설비, 자동화, 품질, 수리, 정비, 연구개발처럼 문제를 고치고 맞추고 해결하는 일에서 돈을 받아야 한다.",
    expand: "재물운을 키우려면 기술을 시간 단가로만 팔면 안 된다. 진단비, 작업비, 부품비, 긴급비, 유지보수비, 개선 작업비처럼 돈 받는 항목을 나눠야 한다.",
    avoid: "무료 진단, 무상 추가작업, 납기만 떠안는 일, 기술은 쓰는데 돈 받을 기준이 없는 일은 돈을 새게 한다.",
  };

  if (key === "business") return {
    title: "거래·영업·유통수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "영업, 유통, 무역, 도매, 납품, 중개, 대리점, 총판처럼 사람과 물건과 가격이 움직이는 곳에서 돈을 받아야 한다. 핵심은 매출이 아니라 마진과 입금이다.",
    expand: "재물운을 키우려면 반복 품목, 단가표, 마진표, 입금일, 납기, 반품 조건을 분명히 해야 한다. 한 번 팔고 끝나는 물건보다 반복 발주가 붙는 품목이 돈을 키운다.",
    avoid: "과한 재고, 늦은 입금, 낮은 마진, 지인 거래, 조건 없는 외상은 재물운을 막는다.",
  };

  if (key === "foodStore" || key === "night") return {
    title: "외식·소형매장·서비스업 수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "편의점, 반찬가게, 분식집, 도시락, 카페, 세탁소, 미용실, 네일샵, 피부관리샵, 수리점, 휴대폰 매장, 문구점, 동네 식자재·생활용품점처럼 실제 업종으로 갈라서 봐야 한다. 핵심은 손님 수가 아니라 업종별 원가, 회전, 예약, 재방문, 상권이다.",
    expand: "재물운을 키우려면 메뉴나 상품을 넓히는 것이 아니라 남는 품목을 좁혀야 한다. 원가율, 폐기율, 월세, 인건비, 회전율이 맞아야 돈이 남는다.",
    avoid: "큰 인테리어, 높은 월세, 과한 재료, 직원 문제, 외상, 지인 서비스는 매출은 보여도 돈을 새게 한다.",
  };

  if (key === "fashion") return {
    title: "감각·사입·회전수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "의류, 잡화, 패션, 라이브커머스, 온라인 사입처럼 감각과 회전이 돈이 되는 흐름이다. 예쁜 것을 고르는 돈이 아니라 빨리 팔릴 것을 고르는 돈이다.",
    expand: "재물운을 키우려면 타깃, 시즌, 재고 기간, 촬영, 상세페이지, 반품률을 같이 봐야 한다. 소량 테스트와 빠른 회전이 살아야 돈이 묶이지 않는다.",
    avoid: "내 눈에 예쁘다고 크게 사입하는 방식, 안 팔리는 재고, 유행 지난 상품, 광고비만 쓰는 운영은 돈을 막는다.",
  };

  if (key === "online") return {
    title: "온라인·콘텐츠·전환수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "콘텐츠, 온라인강의, 블로그, 쇼츠, 상세페이지, 스마트스토어, 앱·웹서비스처럼 사람을 모으고 결제로 바꾸는 흐름에서 돈을 받아야 한다.",
    expand: "재물운을 키우려면 조회수만 보면 안 된다. 무료 콘텐츠 뒤에 유료 상품, 상담, 강의, 예약, 판매, 멤버십이 붙어야 돈이 된다.",
    avoid: "유명해지면 돈 벌겠지라는 방식, 팔 상품 없는 채널 운영, 무료 답변만 늘어나는 구조는 재물운을 막는다.",
  };

  if (key === "finance") return {
    title: "자산·금융·부동산수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "은행, 보험, 증권, 부동산, 임대, 경매, 자산관리, 회계, 재무처럼 돈을 굴리고 묶고 지키는 곳에서 재물운이 열린다.",
    expand: "재물운을 키우려면 수입보다 자산 배치를 먼저 봐야 한다. 현금, 부채, 대출, 세금, 투자, 부동산, 고정비가 정리될 때 돈이 굵어진다.",
    avoid: "남 말 듣고 들어가는 투자, 회수 계획 없는 돈, 세금 계산 없는 매수, 레버리지 과다는 재물운을 막는다.",
  };

  return {
    title: "현실수익형",
    label,
    jobs,
    why,
    moneyRange,
    whatToDo: "현실에서 돈 받을 이유가 분명한 일에 붙어야 한다. 말보다 결과, 결과보다 반복 구조가 중요하다.",
    expand: "재물운을 키우려면 내가 무엇으로 돈을 받는지, 돈이 다시 들어오는 구조가 있는지부터 정해야 한다.",
    avoid: "남들이 돈 된다는 말만 따라가면 돈이 흐려진다.",
  };
}

function buildV85MoneyFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const moneyGrade = getMoneyGrade(manse);
  const timing = getMoneyTimingText(user, manse);
  const detail = getCareerDetailedProfile(manse);
  const snap = getElementSnapshot(manse);
  const pattern = getMoneyPattern(manse);
  const moneyLabel = getMoneyPatternLabel(pattern);
  const core = getCoreMoneyCareerDetail(detail);
  const top1 = core.top1;
  const top2 = core.top2;
  const top3 = core.top3;
  const weakJobs = core.weakJobs;
  const mainRange = safeText(top1.moneyRange, "10억~20억권이 현실권");
  const secondRange = safeText(top2.moneyRange, "5억~10억권을 안정적으로 보는 그릇");
  const thirdRange = safeText(top3.moneyRange, "3억~7억권에서 먼저 단단히 모으는 그릇");
  const businessList = [
    `요식업은 ${detail.business.food.verdict}이다. ${detail.business.food.reason} 돈그릇은 ${detail.business.food.moneyRange}으로 본다.`,
    `외식·야간 매장 운영은 ${detail.business.night.verdict}이다. ${detail.business.night.reason} 돈그릇은 ${detail.business.night.moneyRange}으로 본다.`,
    `옷장사는 ${detail.business.fashion.verdict}이다. ${detail.business.fashion.reason} 돈그릇은 ${detail.business.fashion.moneyRange}으로 본다.`,
    `가게창업은 ${detail.business.store.verdict}이다. ${detail.business.store.reason} 돈그릇은 ${detail.business.store.moneyRange}으로 본다.`,
    `온라인사업은 ${detail.business.online.verdict}이다. ${detail.business.online.reason} 돈그릇은 ${detail.business.online.moneyRange}으로 본다.`,
    `유통·납품·도매는 ${detail.business.distribution.verdict}이다. ${detail.business.distribution.reason} 돈그릇은 ${detail.business.distribution.moneyRange}으로 본다.`,
  ].join("\n\n");

  return `[재물운 첫 판정]
결론부터 말하면, ${name}의 재물운은 '${moneyGrade}'으로 본다.

이 재물운은 단순히 돈이 들어온다, 안 들어온다로 끝낼 사주가 아니다. 이 사람은 어떤 직업을 잡아야 돈이 붙는지, 어떤 사업을 하면 돈그릇이 커지는지, 어떤 일은 돈보다 손해가 먼저 붙는지까지 갈라야 한다.

최종 방향은 분명하다. 돈은 ${moneyLabel} 쪽으로 열리고, 직업으로는 ${top1.label}, ${top2.label}, ${top3.label} 축에서 먼저 붙는다. 이 세 축 밖에서 억지로 돈을 만들려고 하면 바쁘기만 하고 남는 돈이 약해진다.

[내 사주상 돈의 흐름]
사주상 일간은 ${snap.dayMaster}으로 본다. 강하게 드러나는 축은 ${snap.strongestElement}이고, 약하게 흔들리는 축은 ${snap.weakestElement}이다.

강한 축은 돈을 벌 때 써야 하는 힘이고, 약한 축은 돈이 새기 쉬운 자리다. 이 사주는 돈을 못 버는 사주가 아니라, 맞는 일을 잡아야 돈이 남는 사주다.

돈이 붙는 방식은 막연하지 않다. 네가 무엇을 맡았을 때 돈 받을 이유가 생기는지, 무엇을 팔거나 해결했을 때 다시 돈이 들어오는지, 어떤 자격·기술·계약·거래·자산이 붙어야 돈그릇이 커지는지를 봐야 한다.

[내 사주에 맞는 직업과 돈길]
첫 번째로 맞는 돈길은 ${top1.label}이다.

맞는 직업군은 ${top1.jobs} 쪽이다. ${top1.why}

이 길에서 돈그릇은 ${mainRange}으로 본다. 이 직업군은 단순히 오래 다닌다고 돈이 커지는 자리가 아니다. 이 안에서 자격, 경력, 가격표, 계약, 반복수익, 자기 이름 중 하나가 붙어야 돈문이 열린다.

두 번째로 같이 열리는 돈길은 ${top2.label}이다.

맞는 직업군은 ${top2.jobs} 쪽이다. ${top2.why}

이 길의 돈그릇은 ${secondRange}이다. 중심 돈길이 막혔을 때 도망가는 길이 아니라, 첫 번째 돈길에 붙이면 돈이 더 굵어지는 길이다.

세 번째로 보조가 되는 돈길은 ${top3.label}이다.

맞는 직업군은 ${top3.jobs} 쪽이다. ${top3.why}

이 길의 돈그릇은 ${thirdRange}이다. 이 길은 처음부터 크게 벌리는 길보다 부업, 자격, 관리비, 정기수익, 자산, 콘텐츠처럼 붙일 때 돈이 남는다.

[사업을 한다면 맞는 사업과 아닌 사업]
사업을 한다면 업종을 무조건 하나로 찍으면 안 된다. 이 명식에서 사업은 맞는 사업과 피해야 할 사업이 갈린다.

${businessList}

여기서 중요한 건 모든 업종을 하라는 뜻이 아니다. 편의점, 반찬가게, 분식집, 도시락, 카페, 세탁소, 미용실, 네일샵, 피부관리샵, 수리점, 휴대폰 매장, 문구점, 동네 식자재·생활용품점 같은 구체 업종은 외식·소형매장·서비스업형 점수가 실제로 강할 때만 사업 후보로 봐야 한다. '조심해야 한다'로 나온 사업은 궁금해도 중심으로 잡으면 안 된다. 그쪽은 돈이 벌리기 전에 고정비, 사람 문제, 재고, 몸의 피로가 먼저 붙는다.

[피해야 할 직업과 돈길]
피해야 할 돈길은 ${weakJobs} 축이다.

이 축은 아예 평생 손대지 말라는 뜻이 아니다. 다만 이 사주에서 중심 돈길로 잡기에는 약하다. 이쪽을 본업으로 크게 잡으면 돈을 벌기 전에 스트레스, 책임, 재고, 낮은 단가, 늦은 입금, 사람 문제가 먼저 생긴다.

특히 피해야 할 직업은 세 가지다.

첫째, 돈 받을 기준이 없는 일이다. 열심히 설명하고 도와주고 책임지는데 가격표가 없으면 돈이 새는 일이다.

둘째, 먼저 빠지는 돈이 큰 일이다. 월세, 인테리어, 재고, 장비, 광고비, 인건비가 먼저 큰 일은 돈그릇이 열리기 전에 몸과 현금이 눌린다.

셋째, 남 말만 믿고 들어가는 일이다. 누가 돈 된다고 해서 따라 들어가는 투자, 동업, 유행 장사는 이 사주에 맞지 않는다. 네 명식에 맞는 돈길이 아니면 남이 버는 판에서도 너는 남는 돈이 약하다.

[돈을 크게 벌기 위해 해야 할 노력]
돈을 크게 벌려면 노력의 방향을 바꿔야 한다. 그냥 더 오래 일하고 더 많이 움직이는 노력은 이 사주에서 돈그릇을 크게 키우지 못한다.

첫째, 돈 받을 명목을 만들어야 한다. 상담료, 작업비, 진단비, 관리비, 계약금, 수수료, 유지보수비, 강의료, 자문료, 납품 마진, 임대수익처럼 돈 이름이 분명해야 한다. 돈 이름이 없으면 네 노동만 남고 돈은 흐려진다.

둘째, 단가를 올릴 근거를 만들어야 한다. 자격증, 경력, 결과물, 후기, 거래처, 포트폴리오, 재구매율, 납기 신뢰, 문제 해결력 중 하나가 있어야 한다. 싸서 맡기는 사람이 아니라 믿고 맡기는 구조가 되어야 돈이 남는다.

셋째, 반복수익을 만들어야 한다. 한 번 팔고 끝나는 돈은 작다. 월 관리, 정기계약, 유지보수, 재계약, 재구매, 구독, 강의 과정, 자문 계약, 반복 납품처럼 다시 들어오는 돈이 있어야 재물운이 굵어진다.

넷째, 받을 돈과 나갈 돈을 숫자로 잡아야 한다. 매출만 보면 안 된다. 원가, 마진, 세금, 입금일, 고정비, 재고, 광고비, 인건비까지 봐야 한다. 이 계산이 잡히면 돈이 남고, 계산이 흐리면 바빠도 돈이 없다.

[내 돈그릇은 어떻게 커지는가]
돈그릇은 처음부터 크게 열리는 것이 아니다. 이 사주는 작은 돈을 정확히 남기는 훈련을 해야 큰돈을 담는다.

첫 번째 그릇은 3억~7억권이다. 이 구간은 새는 돈을 막고, 고정수입이나 작은 반복수익을 만드는 구간이다. 여기서 욕심내서 크게 벌리면 돈이 묶인다.

두 번째 그릇은 ${mainRange}이다. 이 구간은 맞는 직업군을 잡고 가격 기준을 세울 때 열린다. ${top1.label} 축에서 돈 받을 이유가 분명해지면 이 그릇으로 넘어간다.

세 번째 그릇은 20억~30억권 이상이다. 이 구간은 자기 이름, 자격, 기술, 계약, 반복수익, 거래처, 자산이 같이 붙을 때 열린다. 혼자 몸으로만 뛰는 돈이 아니라 시스템으로 다시 들어오는 돈이 생겨야 한다.

큰 판이 맞으면 30억~50억권까지도 본다. 단, 이건 아무 장사나 해서 열리는 그릇이 아니다. ${top1.label}을 중심으로 잡고, ${top2.label}과 ${top3.label}을 붙일 때 열리는 큰 그릇이다.

[지금부터 재물운을 열기 위해 잡아야 할 순서]
첫째, 중심 직업군을 정해야 한다. 이 명식은 ${top1.label}을 중심으로 봐야 한다. 여기에 맞지 않는 일을 오래 붙잡으면 돈이 아니라 피로가 쌓인다.

둘째, 그 직업군 안에서 돈 받을 상품을 만들어야 한다. 상품은 물건일 수도 있고, 기술일 수도 있고, 상담일 수도 있고, 강의일 수도 있고, 계약일 수도 있고, 관리일 수도 있다. 중요한 건 돈 받을 이유가 눈에 보여야 한다는 점이다.

셋째, 가격 기준을 세워야 한다. 싸게 해주고 많이 받는 방식은 오래 못 간다. 기본 가격, 추가 가격, 긴급 가격, 관리 가격, 정기 가격을 나눠야 돈이 남는다.

넷째, 반복 구조를 만들어야 한다. 재방문, 재구매, 재계약, 정기관리, 월 관리, 유지보수, 구독, 납품, 자문, 강의 과정 중 하나가 붙어야 한다. 이게 붙을 때 돈이 매달 다시 들어온다.

다섯째, 남는 돈을 자산으로 묶어야 한다. 현금으로만 두면 쓰이고, 무리한 투자로 넣으면 흔들린다. 이 사주는 맞는 시기에 저축, 부동산, 장기자산, 안정적인 현금흐름으로 묶어야 말년 재물운이 편해진다.

[돈이 막히는 이유]
돈이 막히는 가장 큰 이유는 일을 못해서가 아니다. 돈 받을 기준 없이 일하기 때문이다.

두 번째 이유는 맞지 않는 직업군을 붙잡는 것이다. 명식에 맞지 않는 일은 아무리 열심히 해도 돈이 늦고, 사람이 피곤하고, 남는 돈이 작다.

세 번째 이유는 욕심이 먼저 커지는 것이다. 돈이 들어오는 구조가 생기기 전에 매장, 재고, 장비, 광고, 인력을 크게 잡으면 돈그릇이 열리기 전에 구멍이 먼저 생긴다.

네 번째 이유는 정 때문에 흐려지는 돈이다. 친하다는 이유로 싸게 해주고, 부탁 때문에 늦게 받고, 조건 없이 도와주면 재물운이 흐려진다.

[재물운이 굵어지는 시기]
재물운 첫 구간은 ${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세 전후다. 이때부터 돈을 그냥 버는 것과 손에 남기는 것을 다르게 보기 시작한다.

재물운이 굵어지는 구간은 ${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후다. 이 시기에는 직업과 돈 버는 방식이 같이 바뀌어야 한다. 맞는 직업을 잡으면 10억권으로 넘어갈 수 있고, 자기 이름이나 반복수익이 붙으면 20억~30억권 이상도 본다.

${timing.assetAge}세 이후에는 빨리 벌고 빨리 쓰는 돈보다 지키고 묶는 돈이 강해진다. 이때는 자산, 부동산, 고정수익, 장기 현금흐름을 같이 봐야 한다.

[올해 돈이 움직이는 달]
올해는 ${timing.moneyMoveMonth}월 전후로 돈 이야기가 움직인다. 이때는 새 일, 견적, 계약, 판매, 정산, 제안이 들어올 수 있다.

${timing.moneyLeakMonth}월 전후에는 급한 지출과 사람 부탁을 조심해야 한다. 돈을 벌 생각보다 새는 돈을 막아야 하는 달이다.

${timing.moneyCatchMonth}월 전후에는 놓친 돈을 다시 잡는 흐름이 있다. 밀린 정산, 재계약, 다시 들어오는 일, 보류됐던 거래를 살펴야 한다.

[재물운 마지막 판정]
최종 판정은 이거다.

${name}의 재물운은 직업과 따로 떨어져 있지 않다. 돈은 ${top1.label}에서 먼저 열리고, ${top2.label}과 ${top3.label}이 붙을 때 굵어진다.

피해야 할 길은 ${weakJobs} 축이다. 이쪽은 중심으로 잡으면 돈보다 피로가 먼저 붙는다.

돈그릇은 작게는 3억~7억권, 제대로 열리면 ${mainRange}, 강하게 붙으면 20억~30억권 이상까지 본다. 판이 크게 맞으면 30억~50억권도 본다.

재물운을 여는 방법은 하나다. 맞는 직업군을 잡고, 돈 받을 명목을 만들고, 가격 기준을 세우고, 반복수익을 붙이고, 남는 돈을 자산으로 묶어야 한다. 이 순서가 잡히면 돈은 버벅거리지 않고 굵어진다.`;
}



function buildV92MoneyPreviewReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const profile = buildWealthProfile(user, manse);
  const b = profile.primaryBlocker;
  const powers = [
    ["버는 힘", profile.scores.earning],
    ["모으는 힘", profile.scores.saving],
    ["키우는 힘", profile.scores.growing],
    ["지키는 힘", profile.scores.keeping],
  ] as Array<[string, number]>;
  const strongest = [...powers].sort((a, b) => b[1] - a[1])[0];
  const weakest = [...powers].sort((a, b) => a[1] - b[1])[0];

  return `[돈그릇 공개]
도훈: "잠깐. ${name}, 이 사주 생각보다 돈그릇이 큰데?"

${name}의 평생 돈그릇은 '${profile.capacity.range}'으로 본다.

이 금액은 지금 가진 재산을 말하는 게 아니다. 맞는 돈길을 잡고, 번 돈을 반복수입과 자산으로 바꿨을 때 이 사주가 다룰 수 있는 재물의 크기다.

[그런데 문제가 하나 있다]
돈그릇이 크다고 그 돈이 저절로 내 것이 되는 건 아니다.

현재 돈그릇 활용도는 ${profile.utilization}%다.

버는 힘 ${profile.scores.earning}점
모으는 힘 ${profile.scores.saving}점
키우는 힘 ${profile.scores.growing}점
지키는 힘 ${profile.scores.keeping}점

가장 강한 힘은 '${strongest[0]}' ${strongest[1]}점이고, 가장 약한 힘은 '${weakest[0]}' ${weakest[1]}점이다.

도훈: "너는 돈을 못 버는 사람이 아니다. 돈을 크게 만드는 순서를 잘못 잡으면 돈그릇에 비해 실제로 남는 돈이 작아지는 사람이다."

[네 돈을 막는 첫 번째 구멍]
가장 먼저 봐야 할 방해요인은 '${b.type}'이다. 위험도는 ${b.score}점이다.

${b.description}

여기까지는 무료에서 공개한다. 하지만 이 구멍을 막은 뒤 어떤 돈길을 잡아야 ${profile.capacity.range}이 현실권으로 들어오는지는 아직 열지 않는다.

[가장 큰 돈이 움직이는 때]
네 인생 최대 재물 돈문은 ${profile.windows.peak.age}다.

이 구간의 최대 돈그릇은 '${profile.peakRange}'으로 본다.

하지만 중요한 건 나이가 아니다. 이때 직장 안에서 몸값을 올려야 하는지, 사업·거래를 키워야 하는지, 기술값을 받아야 하는지, 번 돈을 자산으로 옮겨야 하는지는 사주마다 다르다.

도훈: "네 경우에는 돈을 크게 만드는 길이 따로 잡혀 있다."

[그럼 이 돈을 어떻게 내 것으로 만드나]
전체 재물운에서는 다음 답을 연다.

- 무엇으로 벌어야 돈이 가장 빨리 커지는가
- 중심 돈길과 보조 돈길을 어떻게 붙여야 하는가
- ${profile.windows.expansion.age}에 무엇을 키워야 하는가
- ${profile.windows.risk.age}에 무엇을 절대 크게 벌이면 안 되는가
- ${profile.windows.peak.age}의 최대 돈문에서 어떤 선택을 해야 하는가
- ${profile.windows.consolidation.age}에 번 돈을 무엇으로 굳혀야 하는가
- 결국 ${profile.capacity.range}을 현실권으로 만드는 순서는 무엇인가

[무료 마지막 판정]
돈복이 있는지는 이미 봤다. 네 돈그릇은 '${profile.capacity.range}'이다.

이제 중요한 건 하나다.

도훈: "이 돈을 어디서 만들고, 언제 키우고, 무엇을 피해야 진짜 네 돈이 되는가."`;
}


function buildV92MoneyFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const profile = buildWealthProfile(user, manse);
  const timing = getMoneyTimingText(user, manse);
  const detail = getCareerDetailedProfile(manse);
  const core = getCoreMoneyCareerDetail(detail);
  const top1 = core.top1;
  const top2 = core.top2;
  const top3 = core.top3;
  const weakJobs = core.weakJobs;
  const blocker = profile.primaryBlocker;

  const overlap =
    Math.max(profile.windows.expansion.startAge, profile.windows.risk.startAge) <=
    Math.min(profile.windows.expansion.endAge, profile.windows.risk.endAge);

  const path1 = safeText(top1?.label, profile.moneyStyle.primary);
  const path2 = safeText(top2?.label, profile.moneyStyle.secondary);
  const path3 = safeText(top3?.label, "보조 전문수익형");

  return `[PART 01 · 돈그릇의 진짜 크기]
${name}의 평생 돈그릇은 '${profile.capacity.range}'으로 본다. 현재 활용도는 ${profile.utilization}%다.

여기서 중요한 건 금액을 여러 단계로 부풀리는 게 아니다. 이 리포트에서 기준 금액은 하나다. '${profile.capacity.range}'이 네 재물운의 중심 돈그릇이고, '${profile.peakRange}'은 최대 재물 돈문에서 조건이 맞았을 때 보는 상단 범위다.

버는 힘 ${profile.scores.earning}점 · 모으는 힘 ${profile.scores.saving}점 · 키우는 힘 ${profile.scores.growing}점 · 지키는 힘 ${profile.scores.keeping}점.

이 네 점수는 다시 판정하기 위한 숫자가 아니다. 어디에서 현금을 만들고, 어디에서 돈을 남기고, 어느 시기에 규모를 키우고, 무엇 때문에 무너질 수 있는지를 가르는 기준이다.

[PART 02 · 이 돈은 어디서 생기는가]
네 중심 돈길은 '${path1}'이다.

${safeText(top1?.why, "")}

이 길은 네 돈의 '주 수입축'이다. 오래 버티는 것보다 가격·조건·계약·성과처럼 네 판단이 돈으로 환산되는 자리를 잡아야 한다.

두 번째 돈길은 '${path2}'이다.

${safeText(top2?.why, "")}

이 길의 역할은 첫 번째 길을 대신하는 게 아니다. 중심 돈길에서 만든 고객·기술·상품·거래를 반복수입으로 바꾸거나 거래 규모를 키우는 '확장축'으로 써야 한다.

세 번째 돈길은 '${path3}'이다.

${safeText(top3?.why, "")}

이 길은 '안정축'이다. 중심 돈길과 확장축에서 번 돈이 들쭉날쭉하지 않도록 전문성·관리·유지·반복 계약처럼 다시 들어오는 돈을 붙이는 데 써야 한다.

따라서 세 돈길은 1등, 2등, 3등 직업 순위가 아니다. 네 돈은 '주 수입축 → 확장축 → 안정축'의 순서로 굵어진다.

[PART 03 ·  ${profile.capacity.range}을 현실권으로 만드는 경로]
첫 단계는 현금을 만드는 것이다. '${path1}'에서 돈 받을 이유를 분명하게 만들어야 한다. 가격, 단가, 수수료, 마진, 계약금, 기술값처럼 무엇 때문에 돈을 받는지가 선명해야 한다.

두 번째 단계는 반복시키는 것이다. '${path2}'를 이용해 한 번 들어온 돈을 재구매·재계약·반복 납품·고정 거래·관리 수입처럼 다시 들어오는 돈으로 바꿔야 한다.

세 번째 단계는 규모를 키우는 것이다. ${profile.windows.expansion.age}에는 단순히 일을 더 많이 하는 게 아니라 단가, 거래 규모, 고객의 질, 계약의 반복성을 키워야 한다.

네 번째 단계는 큰 손실을 막는 것이다. 가장 큰 방해요인은 '${blocker.type}' ${blocker.score}점이다. ${blocker.description}

마지막 단계는 자산화다. ${profile.windows.consolidation.age}에는 번 돈을 계속 현금으로 돌리기보다 장기 자산·고정 현금흐름·안정적인 사업 구조처럼 시간이 지나도 남는 것으로 바꿔야 한다.

이 다섯 단계가 이어질 때 '${profile.capacity.range}'이 단순한 가능 금액이 아니라 현실권으로 들어온다.

[PART 04 · MONEY TURN]
MONEY TURN 01 · 첫 돈문 ${profile.windows.first.age}
${profile.windows.first.meaning}

이때의 목표는 큰 베팅이 아니다. 돈을 버는 것과 남기는 것을 분리하고, 중심 돈길에서 처음으로 반복 가능한 수입 구조를 만드는 것이다.

MONEY TURN 02 · 확장 돈문 ${profile.windows.expansion.age}
${profile.windows.expansion.meaning}

이 구간에는 단가·거래처·계약·반복수입 중 적어도 하나가 커져야 한다. 같은 일을 같은 가격으로 더 많이 하는 것은 확장이 아니다.

MONEY TURN 03 · 최대 재물 돈문 ${profile.windows.peak.age}
${profile.windows.peak.meaning}

이 구간의 상단 돈그릇은 '${profile.peakRange}'이다. 여기서는 새 일을 무작정 늘리는 것보다 이미 검증된 돈길에 규모를 붙여야 한다.

MONEY TURN 04 · 위험 돈문 ${profile.windows.risk.age}
${profile.windows.risk.meaning}

${overlap
    ? `특히 이 위험 구간은 확장 돈문과 겹친다. 그래서 이 시기는 '좋은 시기냐 나쁜 시기냐'로 보면 틀린다. 돈이 커질 수 있어서 확장운은 좋지만, 동시에 투자·동업·선지출을 잘못 잡으면 손실도 같이 커지는 교차구간이다. 벌 기회는 잡되, 먼저 빠지는 돈과 사람에게 맡기는 돈은 더 엄격하게 봐야 한다.`
    : `이 구간은 돈을 더 벌겠다는 마음보다 큰 손실 하나를 피하는 게 중요하다. 투자·동업·선지출은 회수 시점과 책임 범위가 숫자로 보일 때만 움직여야 한다.`}

MONEY TURN 05 · 돈이 굳는 시기 ${profile.windows.consolidation.age}
${profile.windows.consolidation.meaning}

이때부터는 '얼마를 벌었나'보다 '얼마가 계속 남아 있나'가 중요하다. 고정수입과 자산을 늘리고, 변동성이 큰 돈의 비중은 줄이는 쪽이 맞다.

[PART 05 · 돈이 새는 실제 자리]
첫 번째는 '${blocker.type}'이다.

${blocker.description}

이 문제는 추상적인 성격 문제가 아니다. 가격을 깎아주고, 받을 날짜를 미루고, 책임 범위를 말로만 정하고, 친분 때문에 손해를 감수하는 순간 실제 돈으로 샌다.

두 번째는 선지출이다. 반복해서 팔리는 구조가 확인되기 전에 재고·월세·광고·인력·장비를 먼저 키우면 돈이 묶인다.

세 번째는 남의 확신을 내 판단으로 착각하는 것이다. 투자든 동업이든 사업이든 네가 원가·회수 시점·책임 범위를 직접 계산하지 못하면 크게 들어가지 마라.

피해야 할 돈길로 '${weakJobs}' 축이 잡히더라도 '평생 하면 안 되는 직업'이라는 뜻은 아니다. 재물운 기준으로 큰돈을 만드는 중심축으로 삼기에는 효율이 낮다는 뜻이다. 직업 적성과 재물 확장성은 구분해서 봐야 한다.

[PART 06 · 사업을 한다면]
사업운을 볼 때 업종 이름부터 찍지 않는다. 네 사주에서 사업이 돈이 되려면 세 조건이 먼저 맞아야 한다.

첫째, 팔리기 전에 큰돈이 먼저 나가지 않아야 한다.
둘째, 가격과 마진을 네가 직접 확인할 수 있어야 한다.
셋째, 한 번 판 뒤 다시 들어오는 거래가 있어야 한다.

${buildMoneyBusinessSummary(detail)}

사업을 크게 벌이는 시점은 '사업운이 있다'는 말로 정하면 안 된다. 작은 판에서 판매와 회수가 확인되고, ${profile.windows.expansion.age}의 확장 조건이 붙을 때 규모를 키우는 게 맞다.

[PART 07 · 올해 돈이 움직이는 달]
${timing.moneyMoveMonth}월 전후는 돈을 '잡는 달'이다. 새 일, 견적, 계약, 판매, 정산, 제안이 움직이면 기다리지 말고 가격과 조건을 직접 확인해야 한다.

${timing.moneyLeakMonth}월 전후는 돈을 '지키는 달'이다. 급한 지출, 사람 부탁, 선결제, 충동 확장은 한 번 더 계산해야 한다.

${timing.moneyCatchMonth}월 전후는 돈을 '회수하는 달'이다. 밀린 정산, 재계약, 보류된 거래, 다시 들어오는 고객처럼 놓친 돈을 다시 잡는 쪽이 좋다.

세 달의 역할은 다르다. 잡는 달에 움츠리지 말고, 지키는 달에 벌이지 말고, 회수하는 달에 새 판만 찾지 마라.

[PART 08 · 지금부터 해야 할 순서]
1. '${path1}'에서 네가 돈을 받는 정확한 이유를 하나 정한다.
2. 가격·단가·마진·입금일 중 흐린 숫자를 먼저 선명하게 만든다.
3. '${path2}'를 붙여 한 번 들어온 돈이 다시 들어오는 구조를 만든다.
4. ${profile.windows.expansion.age}에는 검증된 수입축의 단가와 거래 규모를 키운다.
5. ${profile.windows.risk.age}에는 투자·동업·선지출을 크게 벌이지 않는다.
6. ${profile.windows.peak.age}에는 새 돈길을 계속 찾기보다 가장 잘 벌리는 축에 규모를 집중한다.
7. ${profile.windows.consolidation.age}에는 번 돈을 자산과 장기 현금흐름으로 굳힌다.

[재물운 마지막 판정]
${name}의 돈그릇은 '${profile.capacity.range}'이다. 이 금액을 만들기 위해 전혀 다른 일을 세 개 할 필요는 없다.

중심은 '${path1}'에서 현금을 만드는 것, '${path2}'로 반복과 규모를 붙이는 것, '${path3}'로 수입을 안정시키는 것이다.

가장 중요한 시기는 ${profile.windows.expansion.age}의 확장, ${profile.windows.peak.age}의 최대 돈문, ${profile.windows.risk.age}의 손실 방어, ${profile.windows.consolidation.age}의 자산화다.

최종 판정은 간단하다.

돈을 더 많이 벌려고 먼저 크게 벌이지 마라. 네 돈길에서 '받을 이유 → 반복수입 → 규모 확대 → 손실 방어 → 자산화' 순서를 지켜라. 이 순서가 맞아야 '${profile.capacity.range}'이 네 통장과 자산에 실제로 남는다.`;
}

function getV85HealthTurningPoints(user: UserInfo, manse: any) {
  const snap = getElementSnapshot(manse);
  const values = [snap.wood, snap.fire, snap.earth, snap.metal, snap.water];
  const max = Math.max(...values);
  const min = Math.min(...values);
  let count = 2;
  if (max - min >= 4 || snap.fire === 0 || snap.water === 0 || snap.earth >= 4) count = 3;
  if (max - min >= 5) count = 4;
  const seed = buildFortuneSeed({ user, categoryId: "health", categoryTitle: "건강운", manse });
  const first = 28 + (seed % 7);
  const second = 39 + (Math.floor(seed / 5) % 7);
  const third = 49 + (Math.floor(seed / 11) % 8);
  const fourth = 58 + (Math.floor(seed / 17) % 7);
  return { count, first, second, third, fourth };
}


function getV111HealthFoodGuide(healthType: string, manse: any) {
  const snap = getElementSnapshot(manse);
  const flow = getReadableElementFlow(manse);

  if (healthType.includes("피로") || healthType.includes("수면") || snap.fire === 0 || flow.weakest === "화") {
    return {
      fit: "따뜻한 밥, 계란, 두부, 흰살생선, 닭고기, 소고기국, 미역국, 된장국, 익힌 채소, 단호박, 고구마, 대추차, 생강차처럼 몸을 데우고 기운을 천천히 올리는 음식",
      reduce: "공복 커피, 에너지음료, 얼음 음료, 밤늦은 라면, 술 마신 뒤 야식, 단 음식으로 버티는 습관",
      meal: "아침을 아예 굶기보다 작게라도 따뜻하게 넣는 쪽이 맞다. 이 사주는 찬 걸로 시작하면 몸이 늦게 켜지고, 카페인으로 억지로 올리면 오후나 저녁에 꺼진다.",
    };
  }

  if (healthType.includes("위장") || healthType.includes("소화") || flow.weakest === "토" || snap.earth >= 4) {
    return {
      fit: "죽, 누룽지, 따뜻한 국물, 익힌 양배추, 무, 감자, 단호박, 두부, 계란찜, 흰살생선, 닭가슴살, 바나나처럼 속에 부담을 덜 주는 음식",
      reduce: "매운 음식, 기름진 튀김, 야식, 과식, 탄산, 찬 음료, 빈속 커피, 급하게 먹는 식사",
      meal: "식사 시간을 고정해야 한다. 이 사주는 무엇을 먹느냐도 중요하지만, 굶었다가 몰아서 먹는 순간 장과 위가 먼저 흔들린다.",
    };
  }

  if (healthType.includes("순환") || healthType.includes("냉") || flow.weakest === "수") {
    return {
      fit: "따뜻한 물, 미역국, 콩나물국, 생선, 두부, 검은콩, 호두, 깨, 부추, 마늘, 생강차, 대추차처럼 하체와 순환을 데우는 음식",
      reduce: "얼음물, 찬 커피, 생야채만 먹는 식사, 밤늦은 음주, 짠 음식, 오래 앉은 뒤 바로 자는 습관",
      meal: "찬 음식으로 배를 채우면 몸이 더 무겁다. 따뜻한 국물과 단백질을 같이 넣고, 저녁에는 몸을 차갑게 만드는 음식을 줄여야 회복이 빠르다.",
    };
  }

  if (healthType.includes("호흡") || healthType.includes("피부") || flow.weakest === "금") {
    return {
      fit: "배, 도라지, 무, 연근, 흰살생선, 두부, 닭고기, 견과류, 올리브오일, 따뜻한 차, 물처럼 건조함을 줄이고 호흡과 피부를 덜 자극하는 음식",
      reduce: "과한 술, 담배, 튀김, 너무 매운 음식, 단 음료, 물을 거의 안 마시는 습관, 건조한 환경에서 버티는 습관",
      meal: "이 사주는 몸이 마르면 목·어깨·피부·호흡 쪽으로 신호가 온다. 수분을 한 번에 들이붓기보다 하루에 나눠 마시는 게 맞다.",
    };
  }

  return {
    fit: "따뜻한 밥, 계란, 두부, 생선, 닭고기, 익힌 채소, 제철 과일, 견과류, 된장국이나 미역국처럼 자극이 적고 매일 반복하기 쉬운 음식",
    reduce: "야식, 찬 음료, 공복 커피, 과음, 과식, 매운 음식, 기름진 음식, 단 음식으로 피로를 버티는 습관",
    meal: "이 사주는 특별한 보양식보다 매일 같은 시간에 무리 없이 먹는 힘이 중요하다. 몸이 예측할 수 있는 식사 리듬을 만들면 컨디션이 덜 흔들린다.",
  };
}

function buildV85HealthFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const health = getHealthProfile(manse);
  const food = getV111HealthFoodGuide(health.type, manse);
  const grade = getHealthGrade(manse);
  const tp = getV85HealthTurningPoints(user, manse);
  const timing = getMoneyTimingText(user, manse);
  const flow = getReadableElementFlow(manse);

  const thirdLine = tp.count >= 3
    ? `세 번째 건강 고비는 ${tp.third}~${tp.third + 2}세 전후다. 이때는 젊을 때처럼 버티면 회복이 늦다. 잠, 소화, 피로, 목·어깨, 허리, 순환 중 약한 축이 반복해서 신호를 보낸다.`
    : `세 번째 고비는 강하게 보지 않는다. 다만 50대 이후에는 새로 무리해서 탈이 나는 것보다 오래 쌓인 습관이 몸에 남는 시기다.`;
  const fourthLine = tp.count >= 4
    ? `네 번째 고비는 ${tp.fourth}세 이후다. 이 시기는 큰 병을 단정하는 자리가 아니다. 검진, 수면, 식사, 운동 루틴을 놓치면 회복이 느려지는 구간으로 본다.`
    : "";

  return `[건강운 첫 판정]
결론부터 말하면, ${name}의 건강운은 '${grade}'으로 본다.

건강운은 올해만 보는 메뉴가 아니다. 이 사주는 평생 몸의 약한 축, 인생에서 건강이 흔들리는 고비, 올해 조심할 달, 회복법을 같이 봐야 한다.

[내 사주상 몸의 약한 자리]
이 사주의 약한 축은 ${flow.weakestText} 쪽이다.

${health.core}

이 말은 병명을 맞힌다는 뜻이 아니다. 몸이 스트레스를 어디로 먼저 보내는지, 어떤 습관에서 회복이 늦어지는지 보는 것이다.

[몸이 보내는 첫 신호]
몸은 갑자기 무너지기 전에 먼저 신호를 보낸다. ${health.risk}

처음 신호는 잠, 소화, 피로, 목·어깨 긴장, 몸의 냉함, 피부·호흡 건조함 중 약한 쪽으로 온다. 이걸 무시하고 계속 밀면 작은 신호가 생활 전체를 흔든다.

[무리하면 먼저 꺾이는 곳]
무리하면 먼저 꺾이는 곳은 ${health.type}이다.

이건 몸이 약하다는 말이 아니다. 버티는 방식이 몸을 늦게 꺼뜨리는 흐름으로 본다. 한 번에 크게 아픈 사람보다, 작은 신호를 오래 무시하다가 어느 날 회복이 늦어지는 쪽이다.

[인생에서 건강이 흔들리는 고비]
이 사주는 인생에서 건강 고비가 크게 ${tp.count}번 들어오는 편이다.

첫 번째 건강 고비는 ${tp.first}~${tp.first + 2}세 전후다. 이때는 병이 온다는 뜻이 아니다. 생활 리듬이 먼저 흔들리는 시기다. 일, 돈, 사람 문제가 몰리면 수면과 소화, 피로가 먼저 반응한다.

두 번째 건강 고비는 ${tp.second}~${tp.second + 2}세 전후다. 이때는 젊을 때처럼 버티면 안 된다. 쉬어도 회복이 늦고, 몸이 보내는 신호를 가볍게 넘기면 피로가 오래 간다.

${thirdLine}

${fourthLine}

[올해 건강을 조심해야 할 달]
올해는 ${timing.moneyLeakMonth}월 전후와 ${timing.moneyCatchMonth}월 전후를 조심해서 본다. 이 시기는 몸보다 일정이 먼저 흔들리고, 일정이 흔들리면 수면·소화·피로가 같이 흔들릴 수 있다.

[건강을 망치는 생활 습관]
피해야 할 습관은 ${health.avoid.join(", ")}이다.

아픈 걸 몰라서가 아니라, 알면서도 미루는 것이 문제다. “이번만 넘기자”를 반복하면 몸이 먼저 꺼진다.

[건강이 살아나는 생활법]
살리는 방법은 ${health.action.join(", ")}이다.

거창한 운동보다 수면 시간, 따뜻한 식사, 식후 걷기, 하체 근력, 목·어깨 풀기처럼 매일 반복되는 리듬이 더 맞다.

[음식으로 건강을 지키는 법]
${name}에게 맞는 음식은 ${food.fit}이다.

줄여야 할 음식과 습관은 ${food.reduce}이다.

${food.meal}

중요한 건 특정 음식 하나가 약처럼 해결한다는 뜻이 아니다. 이 사주는 음식의 온도, 먹는 시간, 자극의 강도, 공복 시간이 몸을 크게 흔든다. 그래서 음식 관리는 “뭘 특별히 챙겨 먹을까”보다 “무엇을 반복해서 줄이고, 무엇을 매일 안정적으로 넣을까”가 핵심이다.

[생활 리듬으로 건강을 지키는 법]
생활 리듬은 수면 시간이 핵심이다. 늦게 자고 늦게 일어나는 날이 반복되면 피로가 쌓이는 속도가 빨라진다.

하루를 전부 몰아서 쓰고 한 번에 쉬는 방식보다, 일정 사이에 몸을 식히는 시간이 있어야 한다. 오래 앉아 있거나, 밤에 몸을 차갑게 둔 채 자거나, 쉬는 날 한꺼번에 무리하는 습관은 줄여야 한다.

[운동으로 건강을 지키는 법]
운동은 갑자기 몰아치는 고강도보다 매일 이어지는 쪽이 맞다. 걷기, 식후 산책, 하체 스트레칭, 종아리·발목 순환, 목·어깨·등 풀기, 가벼운 근력운동이 좋다.

이 사주는 운동을 해도 몸을 이기려고 하면 오래 못 간다. 몸을 데우고, 순환을 올리고, 굳은 곳을 풀어주는 운동이 건강운을 지킨다.

[건강운 마지막 판정]
최종 판정은 이거다.

${name}은 약해서 무너지는 몸이라기보다, 버티다가 꺼지는 몸이다. 몸이 보내는 작은 신호를 무시하지 않을 때 건강운이 산다.

이 풀이는 사주상 건강 흐름이다. 통증이나 증상이 오래가면 운세로 넘기지 말고 실제 검진을 받아야 한다.`;
}

function buildV85LifeFlowFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const timing = getMoneyTimingText(user, manse);
  const healthTp = getV85HealthTurningPoints(user, manse);
  const detail = getCareerDetailedProfile(manse);
  const coreCareer = getCoreCareerDetail(detail);
  const mainCareer = coreCareer.first;
  const secondCareer = coreCareer.second;
  const thirdCareer = coreCareer.third;
  const seed = buildFortuneSeed({ user, categoryId: "lifeFlow", categoryTitle: "인생대운", manse });
  const majorLuckCountText = getMajorLuckChanceCount(manse);
  const chanceCount = majorLuckCountText.startsWith("3") ? 3 : 2;
  const keyAge = timing.strongMoneyAge;

  // V222: 인생대운 상단 요약은 기존 인생대운 계산값을 그대로 나이/연도로 환산한다.
  const nowYear = getKoreaTodayInfo().year;
  const birthYear = getNumberFromText(user.year);
  const currentAge = birthYear > 1900 ? Math.max(0, nowYear - birthYear + 1) : 0;
  const ageToYear = (age: number) => birthYear > 1900 ? birthYear + age - 1 : 0;
  const rangeText = (startAge: number, endAge: number) => {
    const sy = ageToYear(startAge);
    const ey = ageToYear(endAge);
    return birthYear > 1900
      ? `${startAge}~${endAge}세 · ${sy}~${ey}년`
      : `${startAge}~${endAge}세`;
  };
  const firstStart = timing.firstMoneyAge;
  const firstEnd = timing.firstMoneyAge + 2;
  const secondStart = timing.strongMoneyAge;
  const secondEnd = timing.strongMoneyAge + 3;
  const thirdStart = timing.assetAge;
  const thirdEnd = timing.assetAge + 4;

  const luckStatus = (index: number, startAge: number, endAge: number) => {
    if (!currentAge) return `제${index}대운은 ${startAge}~${endAge}세 구간이다.`;
    if (currentAge < startAge) return `제${index}대운까지 ${startAge - currentAge}년 남았다. 지금은 이 대운을 받을 준비를 만드는 시기다.`;
    if (currentAge <= endAge) return `현재 ${currentAge}세로, 지금 제${index}대운 구간 안에 들어와 있다. 기다리기보다 실제 선택을 해야 하는 시기다.`;
    return `제${index}대운은 이미 지난 구간이다. 그 시기에 일·돈·사람의 판이 실제로 바뀌었는지 돌아보면 된다.`;
  };

  const nextLuck =
    currentAge && currentAge < firstStart ? { index: 1, start: firstStart, end: firstEnd } :
    currentAge && currentAge <= firstEnd ? { index: 1, start: firstStart, end: firstEnd } :
    currentAge && currentAge < secondStart ? { index: 2, start: secondStart, end: secondEnd } :
    currentAge && currentAge <= secondEnd ? { index: 2, start: secondStart, end: secondEnd } :
    chanceCount >= 3 && currentAge && currentAge < thirdStart ? { index: 3, start: thirdStart, end: thirdEnd } :
    chanceCount >= 3 && currentAge && currentAge <= thirdEnd ? { index: 3, start: thirdStart, end: thirdEnd } :
    null;

  const currentPosition = nextLuck
    ? luckStatus(nextLuck.index, nextLuck.start, nextLuck.end)
    : currentAge
      ? `현재 ${currentAge}세다. 큰 전환 대운은 지나왔고, 이제는 새 판을 크게 벌리기보다 이미 만든 돈길·자산·사람관계를 안정시키는 흐름이 중요하다.`
      : `현재 위치는 출생연도 기준 나이를 확인한 뒤 대운 구간과 함께 본다.`;

  const thirdLuckTop = chanceCount >= 3
    ? `

제3대운 — ${rangeText(thirdStart, thirdEnd)}
자리·자산·생활 기반을 굳히는 대운이다.
이때 잡아야 할 것: 반복 수입, 안정 자산, 오래 갈 거래와 믿을 사람을 남기는 것.
놓치게 만드는 것: 이미 만든 기반을 버리고 검증되지 않은 큰 판을 새로 벌이는 것.
${luckStatus(3, thirdStart, thirdEnd)}`
    : "";

  return `[내 인생의 큰 대운부터 말하면]
${name}의 인생에는 판이 크게 바뀌는 대운이 총 ${chanceCount}번 들어온다. 아래 시기는 AI가 임의로 만든 나이가 아니라 기존 인생대운 계산에서 잡힌 돈·일·자산 전환 나이를 연도로 환산한 것이다.

제1대운 — ${rangeText(firstStart, firstEnd)}
방향을 다시 잡는 대운이다.
이때 잡아야 할 것: 오래 갈 일, 내 이름으로 남는 기술·경력·거래 구조를 고르는 것.
놓치게 만드는 것: 남의 기대나 겉으로 좋아 보이는 조건만 보고 오래 남지 않을 길을 붙잡는 것.
${luckStatus(1, firstStart, firstEnd)}

제2대운 — ${rangeText(secondStart, secondEnd)}
돈과 일이 가장 굵어지는 핵심 대운이다.
이때 잡아야 할 것: 가격·계약·기술값·자격·거래처처럼 내 판단이 실제 돈으로 바뀌는 자리.
놓치게 만드는 것: 받을 돈과 책임 범위를 확인하지 않고 사람 말만 믿고 판을 크게 벌이는 것.
${luckStatus(2, secondStart, secondEnd)}${thirdLuckTop}

[가장 중요한 대운을 언제 잡아야 하나]
가장 중요한 대운은 제2대운, ${rangeText(secondStart, secondEnd)}다. 이 구간은 단순히 운이 좋다는 뜻이 아니다. 일의 역할이 커지거나, 거래처·고객이 붙거나, 돈 받을 가격과 조건을 직접 정하거나, 내 이름으로 남는 기술·자격·사업 구조가 생기면 대운의 신호로 봐야 한다.

이때는 기회가 완벽해질 때까지 기다리기보다 '내 몫이 커지는가, 반복해서 돈이 들어오는가, 책임만 늘어나는 것은 아닌가'를 확인하고 잡아야 한다. 반대로 먼저 큰돈이 나가고 회수 시점이 없거나, 지인 말만 믿어야 하거나, 책임은 내가 지는데 결정권이 없는 제안은 대운처럼 보여도 잡지 않는 편이 맞다.

[지금 나는 대운의 어디에 있나]
${currentPosition}

[인생대운 첫 판정]
결론부터 말하면, ${name}의 인생대운은 시기 싸움이다.

이 메뉴는 직업을 길게 늘어놓는 자리가 아니다. 언제 막히고, 언제 열리고, 언제 돈·일·사람·건강이 크게 바뀌는지를 보는 메뉴다.

이 사주는 아무 때나 크게 움직이면 손해가 먼저 붙는다. 운이 들어오는 구간에 움직이면 같은 선택도 결과가 달라지고, 운이 눌리는 구간에 욕심을 내면 돈보다 책임이 먼저 붙는다. 그래서 인생대운은 “좋다, 나쁘다”가 아니라 언제 잡고 언제 줄일지를 봐야 한다.

[초년운]
초년에는 모든 게 편하게 깔리는 흐름만으로 보지 않는다. 주변 분위기, 눈치, 책임, 돈에 대한 감각이 먼저 만들어지는 시기다.

이때는 내가 하고 싶은 대로 밀어붙이기보다, 주변을 보며 맞추는 시간이 길었을 수 있다. 어린 시절부터 “내 마음대로 해도 되는가”보다 “지금 분위기가 어떤가”를 먼저 살피는 힘이 생긴다. 이게 초년에는 답답함으로 오지만, 나중에는 사람과 돈을 읽는 감각이 된다.

이 시기에는 큰 성취보다 버티는 힘이 먼저 만들어진다. 초년이 답답했다고 평생 막힌 사주가 아니다. 오히려 초년에 편하게 받은 복보다, 중년 이후 직접 만든 복이 더 강하게 붙는 흐름이다.

[20대 운]
20대에는 방향을 한 번에 잡기보다 시행착오가 먼저 들어온다. 일, 사람, 돈 중 하나가 쉽게 정리되지 않고 “이게 내 길인가”를 자주 묻게 된다.

이 시기에는 좋아 보이는 길과 실제로 남는 길이 다르다. 겉으로 괜찮아 보여도 오래 하면 몸이 눌리는 일, 사람은 좋아도 돈이 남지 않는 관계, 시작은 쉬운데 책임이 커지는 선택을 겪을 수 있다.

20대 운의 핵심은 성공보다 걸러내는 힘이다. 맞지 않는 사람, 맞지 않는 일, 돈이 남지 않는 선택을 몸으로 배우는 운이다. 여기서 배운 기준이 30대 이후 돈과 일의 방향을 잡는다.

[30대 운]
30대에는 인생 방향이 다시 잡힌다. 특히 ${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세 전후는 돈과 일이 다르게 보이기 시작하는 구간이다.

이때부터는 오래 버티는 일보다 무엇이 내 이름, 기술, 거래, 반복 돈으로 남는지를 봐야 한다. 그냥 월급이 들어오는지보다, 이 일이 앞으로 내 가격이 되는지, 내 신용이 되는지, 내 다음 기회를 만드는지를 따지게 된다.

30대 운에서 잘 잡아야 할 건 직업명 하나가 아니다. ${mainCareer.label} 쪽의 큰 직업 흐름이 먼저 살아나고, ${secondCareer.label}과 ${thirdCareer.label}이 현실에서 붙을 수 있는지 봐야 한다. 여기서 길을 잘못 잡으면 40대에 다시 갈아엎는 수고가 생긴다.

[40대 운]
40대는 이 사주에서 돈과 일이 굵어지는 핵심 구간이다. ${keyAge}~${keyAge + 3}세 전후가 가장 중요하다.

이때는 작은 선택도 크게 번진다. 직장에 있으면 직함, 책임, 거래, 관리 범위가 달라지고, 밖으로 움직이면 사업, 부업, 투자, 자산, 고객 흐름이 커질 수 있다. 하지만 운이 열린다고 무조건 크게 벌리라는 뜻은 아니다.

이 구간에서 ${mainCareer.label} 쪽의 큰 직업축이 제대로 잡히면 인생의 판이 달라진다. ${secondCareer.label}은 돈의 크기를 키우는 힘으로 붙고, ${thirdCareer.label}은 상황이 맞을 때 넓어지는 길로 본다. 세부 업종은 성급하게 고르면 안 된다. 먼저 큰 직업축을 잡고, 그 안에서 돈 받는 방식을 정해야 한다.

[50대 이후 운]
50대 이후에는 새로 크게 벌리는 운보다 지키는 운이 중요하다. ${timing.assetAge}세 이후에는 자산, 건강, 사람 거리, 말년 생활을 같이 봐야 한다.

이때는 돈을 더 버는 것만큼 흩어지지 않게 묶는 힘이 중요하다. 사람 부탁, 가족 문제, 무리한 확장, 몸을 갈아 넣는 일은 말년운을 불편하게 만든다. 반대로 자산을 정리하고, 반복 수입을 만들고, 믿을 사람만 남기면 말년이 편해진다.

[인생에서 크게 바뀌는 대운]
이 사주는 인생에서 큰 대운 기회가 ${chanceCount}번 들어오는 편이다.

첫 번째는 ${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세 전후다. 방향을 다시 잡는 운이다. 이때는 내가 진짜 오래 갈 일과 잠깐 버티는 일을 구분해야 한다.

두 번째는 ${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후다. 돈과 일이 굵어지는 운이다. 이때는 내 판단이 돈으로 바뀌는 자리에 서야 한다. 가격, 조건, 계약, 기술값, 자격, 거래처, 자산 중 하나가 현실로 움직여야 한다.

${chanceCount >= 3 ? `세 번째는 ${timing.assetAge}세 이후다. 새로 벌리는 것보다 지키고 묶는 운이다. 이때는 큰돈보다 남는 돈, 새 사업보다 안정 자산, 많은 사람보다 믿을 사람을 남겨야 한다.` : `세 번째 대운은 강하게 보지 않는다. 대신 ${timing.assetAge}세 이후에는 지키는 힘이 중요해진다. 새로 크게 흔드는 것보다 이미 만든 돈길을 안정화해야 한다.`}

[가장 중요한 대운]
가장 중요한 대운은 ${keyAge}세 전후다. 이때 어떤 선택을 하느냐에 따라 이후 삶의 크기가 달라진다.

이 구간에서는 감으로 움직이면 안 된다. 받을 돈, 나갈 돈, 책임 범위, 같이 가는 사람, 몸이 버틸 수 있는 리듬까지 보고 움직여야 한다. 운은 들어오는데 기준이 없으면 돈보다 피로가 먼저 붙는다.

[돈이 굵어지는 시기]
돈이 굵어지는 시기는 ${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후다. 이때는 다시 들어오는 돈, 반복 고객, 자격, 기술, 거래처, 자산이 붙어야 한다.

돈은 한 번 크게 들어오는 것보다 다시 들어오는 구조로 커진다. 월급이면 직함과 신용, 사업이면 반복 거래, 전문직이면 자격과 고객, 자산이면 묶어두는 힘이 붙어야 한다.

[일이 바뀌는 시기]
일이 바뀌는 시기는 ${timing.firstMoneyAge}세 전후부터 움직인다. 이직, 독립, 직무 변경, 자기 이름이 붙는 일 중 하나가 올라온다.

이때 바뀌는 건 단순한 직장명이 아니다. 일하는 방식이 바뀐다. 남이 시키는 일을 처리하는 자리에서, 내가 판단하고 기준을 세우고 돈 받을 명목을 만드는 자리로 옮겨가야 운이 산다.

[사람 인연이 바뀌는 시기]
사람 인연은 30대 후반에서 40대 초반에 크게 갈린다. 귀인도 들어오지만, 돈과 책임을 흐리게 만드는 사람도 같이 들어올 수 있다.

이 시기에는 말이 좋은 사람보다 행동이 일정한 사람을 봐야 한다. 같이 하자는 말, 도와달라는 말, 투자하자는 말, 대신 책임져달라는 말이 들어오면 바로 믿지 말고 돈과 책임을 따져야 한다.

[건강이 흔들리는 시기]
건강 리듬은 ${healthTp.first}세 전후, ${healthTp.second}세 전후를 조심해서 본다. 병을 단정하는 게 아니라 몸이 예전처럼 버티지 않는 시기다.

운이 커지는 시기일수록 몸도 같이 써야 한다. 잠, 소화, 피로, 목·어깨, 허리, 순환이 흔들리면 운을 잡아도 오래 못 끌고 간다. 대운을 제대로 쓰려면 건강 리듬도 같이 잡아야 한다.

[인생대운 마지막 판정]
최종 판정은 이거다.

${name}의 인생대운은 초년에 빨리 편해지는 운보다 중년 이후 판이 바뀌는 운이다. ${keyAge}세 전후를 놓치지 말아야 한다. 이때 맞는 일과 돈길을 잡으면 인생의 크기가 달라진다.

다만 운이 열린다고 다 잡으라는 뜻은 아니다. 이 사주는 시기를 보고, 사람을 거르고, 돈 받을 기준을 세우고, 몸이 버틸 수 있는 판만 잡을 때 크게 간다.`;
}

function getLifetimeCoreCareerDetailV233(detail: any) {
  const shared = getCoreMoneyCareerDetail(detail);
  return {
    first: shared.top1,
    second: shared.top2,
    third: shared.top3,
  };
}

function buildV85TraditionalFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const detail = getCareerDetailedProfile(manse);
  const coreCareer = getLifetimeCoreCareerDetailV233(detail);
  const mainCareer = coreCareer.first;
  const secondCareer = coreCareer.second;
  const thirdCareer = coreCareer.third;
  const moneyGrade = getMoneyGrade(manse);
  const healthGrade = getHealthGrade(manse);
  const timing = getMoneyTimingText(user, manse);
  const healthTp = getV85HealthTurningPoints(user, manse);
  const relation = getRelationshipProfile(manse, "love");
  const health = getHealthProfile(manse);
  const food = getV111HealthFoodGuide(health.type, manse);
  const flow = getReadableElementFlow(manse);
  const moneySource = getV85MoneySource({ ...detail, top1: mainCareer, top2: secondCareer, top3: thirdCareer });
  const career = getCareerArchetype(manse);
  const lifetimeAssetBowl =
    resolveLifetimeMoneyBowlV232(detail, { first: mainCareer, second: secondCareer, third: thirdCareer }) ||
    "금액 계산값 확인 필요";
  const topicName = withTopicParticleV232(name);

  const careerMoneySummary = [
    `1순위 ${mainCareer.label}: ${mainCareer.jobs} · 주력 수입축`,
    `2순위 ${secondCareer.label}: ${secondCareer.jobs} · 확장 수입축`,
    `3순위 ${thirdCareer.label}: ${thirdCareer.jobs} · 전문성·보조 수입축`,
  ].join("\n");

  return `[평생종합사주 첫 판정]
결론부터 말하면, ${name}의 평생종합사주는 한 가지 운만 보면 안 된다.

이 사주는 어떤 사람으로 태어났고, 무엇으로 먹고살고, 돈은 어디서 붙고, 사랑은 어떻게 꼬이고, 건강은 어디서 꺾이고, 인생은 언제부터 풀리는지를 한 판으로 봐야 한다.

평생종합은 각 운을 따로 떼어 읽는 메뉴가 아니다. 돈이 열리는 시기와 일이 바뀌는 시기, 사람 때문에 흔들리는 시기, 건강이 눌리는 시기가 서로 맞물린다. 그래서 한 군데만 좋다고 인생이 풀리는 것도 아니고, 한 군데가 약하다고 인생이 막히는 것도 아니다.

[내 사주의 핵심 기질]
네 사주에서 강한 축은 ${flow.strongestText}이고, 반복해서 챙겨야 할 축은 ${flow.weakestText}이다.

겉으로는 무던해 보여도 속으로는 기준이 있다. 사람도 일도 그냥 흘려보내는 척하지만, 마음속으로는 계속 따진다. 이 일이 나에게 남는지, 이 사람이 나를 흔드는지, 이 돈이 다시 들어올 돈인지 본다.

이 기질은 장점도 있고 피로도 있다. 기준이 있어서 크게 흔들리지 않지만, 속으로 계산이 많아지면 몸이 늦게 풀린다. 그래서 이 사주는 마음이 편한 척한다고 편한 게 아니다. 기준이 맞아야 마음이 놓인다.

[내 인생은 빨리 풀리는가, 늦게 풀리는가]
이 사주는 초년에 전부 편하게 깔리는 팔자만으로 보지 않는다. 대신 중년 이후 내가 직접 만든 길에서 힘이 붙는다.

빨리 받은 복보다 부딪히며 만든 복이 강하다. 그래서 초년의 답답함을 평생 운으로 착각하면 안 된다. 이 사주는 처음부터 남들이 깔아준 길로 편하게 가는 쪽보다, 살면서 직접 기준을 세우고 자기 자리를 만들어야 운이 열린다.

늦게 풀린다는 말도 단순히 기다리라는 뜻이 아니다. 준비 없이 기다리면 늦게도 안 열린다. 맞는 일, 돈 받을 기준, 사람 거리, 건강 리듬을 잡아놓을 때 중년 이후 운이 커진다.

[초년운]
초년에는 눈치, 책임, 분위기, 돈 감각이 먼저 만들어진다. 마음대로 밀고 가기보다 주변을 보며 맞추는 시간이 있었을 수 있다.

이 시기는 성공보다 성격의 뼈대가 만들어지는 시기다. 쉽게 받은 복보다 버티면서 만든 감각이 남는다. 그래서 초년에는 내가 원하는 걸 바로 얻는 흐름보다, 상황을 읽고 참는 힘이 먼저 생긴다.

초년의 답답함은 약점이 아니라 나중에 사람과 돈을 보는 눈이 된다. 다만 이때 생긴 참는 습관이 너무 오래 가면, 어른이 된 뒤에도 내 몫을 제때 요구하지 못하는 문제가 생긴다.

[20대 운]
20대에는 방향이 한 번에 잡히기 어렵다. 일도 사람도 돈도 시행착오가 섞인다.

이때 만난 일과 사람 중 일부는 오래 가지 않는다. 하지만 그 과정을 통해 무엇이 맞고 무엇이 아닌지 분명해진다. 20대의 핵심은 정착보다 선별이다. 무엇이 나를 살리고 무엇이 나를 소모시키는지 몸으로 배우는 시기다.

돈도 마찬가지다. 들어와도 남지 않는 돈, 열심히 했는데 내 이름으로 남지 않는 일, 마음을 줬는데 나만 책임지는 관계를 겪으면서 기준이 생긴다.

[30대 운]
30대부터는 인생을 보는 눈이 달라진다. ${timing.firstMoneyAge}세 전후부터 돈과 일이 다르게 보이기 시작한다.

그냥 버티는 일보다 내 이름, 기술, 자격, 거래, 반복 수익으로 남는 일을 찾게 된다. 이때부터는 “얼마를 버느냐”보다 “이 일이 앞으로 내 돈길이 되느냐”가 더 중요해진다.

30대 운을 잘 쓰려면 일을 갈아타는 것보다 기준을 갈아야 한다. 책임은 내가 지는데 돈은 남에게 가는 일, 사람만 피곤하고 남는 게 없는 일, 정 때문에 거절 못 하는 관계를 줄여야 한다.

[40대 운]
40대는 돈과 일이 굵어지는 시기다. ${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후가 중요하다.

이때 ${mainCareer.label} 쪽의 큰 직업축이 제대로 잡히면 인생판이 달라진다. 여기에 ${secondCareer.label}과 ${thirdCareer.label}이 현실에서 같이 붙으면 돈과 일이 더 굵어진다.

40대의 운은 작게 들어와도 크게 번질 수 있다. 직함, 계약, 거래처, 자격, 기술값, 소개, 반복 수익이 붙으면 돈의 크기가 달라진다. 반대로 이때 무리하게 판을 벌리거나 사람을 잘못 들이면 복보다 부담이 커진다.

[50대 이후 운]
50대 이후에는 버는 운만큼 지키는 운이 중요하다. ${timing.assetAge}세 이후에는 자산, 건강, 가족 거리, 말년 생활을 같이 봐야 한다.

이 시기에는 새로 크게 벌이는 것보다 이미 만든 돈길을 안정화해야 한다. 자산을 묶고, 새는 돈을 줄이고, 몸이 버틸 수 있는 일만 남기는 쪽이 맞다. 사람도 많다고 좋은 게 아니다. 믿을 사람만 남는 구조가 말년을 편하게 만든다.

[평생 먹고살 일]
${name}의 평생 먹고살 길은 직업 이름 하나보다 '어떤 방식으로 돈을 만드는가'가 핵심이다.

1순위는 ${mainCareer.label}이다.
실제 직업·업무는 ${mainCareer.jobs} 쪽이다.
${mainCareer.why} 이것이 1순위로 보는 이유다.
주의할 점은 ${mainCareer.caution}이다.

2순위는 ${secondCareer.label}이다.
실제 직업·업무는 ${secondCareer.jobs} 쪽이다.
${secondCareer.why} 이것이 두 번째 돈길이 되는 이유다.
주의할 점은 ${secondCareer.caution}이다.

3순위는 ${thirdCareer.label}이다.
실제 직업·업무는 ${thirdCareer.jobs} 쪽이다.
${thirdCareer.why} 이것이 경력 이후 보조 돈길로 살아나는 이유다.
주의할 점은 ${thirdCareer.caution}이다.

[직장·부업·사업 중 어디에서 돈이 커지는가]
일의 기본 판정은 '${career.combined}'이다.

회사 안에서는 네 판단과 책임이 돈으로 환산되는 자리를 잡아야 한다. 단순 반복 업무보다 견적·가격·조건·납기·거래처·고객·기술·관리처럼 결과와 책임 범위가 분명한 일이 맞는다.

밖의 돈은 처음부터 큰 사업으로 뛰는 방식보다 본업에서 현금흐름을 지키면서 작게 검증하는 방식이 맞다. ${mainCareer.outsideRole || mainCareer.jobs}처럼 이미 쌓은 경험을 자기 거래·자기 고객·자기 단가로 옮기고, 반복 매출이 확인된 뒤 키워야 한다. 피해야 할 것은 ${career.warning}이다.

[직업 1·2·3순위와 돈의 역할]
${careerMoneySummary}

세 직업축에 같은 '30억~50억'을 각각 붙이지 않는다. 직장 소득, 부업 수익, 사업 매출, 평생 자산은 서로 다른 숫자다. 1순위는 가장 오래 키울 주력 수입원, 2순위는 본업과 연결할 확장 수입원, 3순위는 경력과 전문성을 단가로 바꾸는 보조 수입원으로 본다.

[내 돈그릇은 어느 정도인가]
이 사주의 돈그릇은 연봉 한 번의 크기가 아니라 평생 남길 수 있는 자산의 크기로 봐야 한다.

장기 자산 목표권은 ${lifetimeAssetBowl}이다. 이것은 매년 그만큼 번다는 뜻도 아니고, 세 직업이 각각 그만큼 번다는 뜻도 아니다. 본업에서 번 돈, 부업·거래에서 남긴 돈, 사업에서 회수한 돈, 장기간 축적한 자산이 합쳐졌을 때 보는 상단 목표권이다.

실제 돈그릇을 키우는 순서는 '안정 현금흐름 확보 → 본업에서 단가와 책임 상승 → 작은 자기수익 검증 → 반복 거래 확보 → 남은 돈을 자산으로 묶기'다. 이 순서를 지키면 돈이 커지고, 처음부터 큰 재고·큰 고정비·큰 대출을 안으면 돈그릇보다 부담이 먼저 커진다.

[무엇을 해서 돈을 키우는가]
첫 번째 돈길은 ${mainCareer.jobs}이다. ${mainCareer.why} 이것이 주력 돈길인 이유다. 회사 안에서도 단순 실무에 머무르지 말고 가격·거래·계약·성과처럼 네 판단이 숫자로 남는 자리까지 가야 한다.

두 번째 돈길은 ${secondCareer.jobs}이다. ${secondCareer.why} 이것이 확장 돈길인 이유다. 완전히 낯선 부업보다 기존 경험·상품·고객·거래처와 연결되는 방식이 효율적이다.

세 번째 돈길은 ${thirdCareer.jobs}이다. ${thirdCareer.why} 이것이 보조 돈길인 이유다. 경력이 쌓인 뒤 단가·소개·유지관리·반복 고객으로 바꿔야 돈이 된다.

[돈그릇이 커지는 조건과 막히는 조건]
돈그릇이 커지는 조건은 네 경험이 가격으로 바뀌는 것이다. 같은 일을 오래 하는 것보다 '내가 맡으면 얼마의 거래·성과·고객을 움직일 수 있는가'가 분명해질수록 돈이 굵어진다. 특히 ${timing.strongMoneyAge}세 전후부터는 경력을 그냥 보유하는 것과 자기 가격으로 바꾸는 것의 차이가 크게 벌어진다.

반대로 돈그릇을 막는 것은 안정만 지키느라 단가와 역할을 키우지 않는 것, 남의 결정만 수행하는 자리에서 오래 버티는 것, 검증 없이 먼저 큰돈을 넣는 것이다. ${mainCareer.caution}

여기서 말하는 금액은 보장 수익이나 연봉 예측이 아니다. 실제 소득은 경력·업종·자본·고객·시장 상황에 따라 달라진다.

[돈이 붙는 방식과 돈그릇]
재물운은 '${moneyGrade}'으로 본다. 돈은 ${moneySource}에서 먼저 붙는다.

장기 자산 돈그릇은 ${lifetimeAssetBowl}을 목표권으로 본다. 맞는 직업축을 잡고 반복 수익을 자산으로 남길수록 커지며, 사람 말과 정에 끌리면 들어온 돈도 샌다.

돈이 커지려면 세 가지가 붙어야 한다. 첫째, 돈 받을 명목이 분명해야 한다. 둘째, 가격을 흐리지 않아야 한다. 셋째, 한 번 들어온 돈이 다시 들어오는 구조가 있어야 한다. 이 세 가지가 잡히면 돈은 우연히 들어오는 게 아니라 쌓이기 시작한다.

[사랑과 결혼에서 반복되는 패턴]
사랑에서는 ${relation.type} 흐름이 강하다.

${relation.core}

연애와 결혼은 감정만으로 오래 가는 사주가 아니다. 말투, 생활 리듬, 돈 기준, 가족 거리까지 맞아야 오래 간다. 마음이 있어도 표현 방식이 다르면 상대는 서운해지고, 너는 억울해질 수 있다.

결혼운은 사랑보다 생활을 더 본다. 같이 살아도 무너지지 않는 사람, 돈과 책임을 흐리지 않는 사람, 감정이 올라와도 말로 관계를 망치지 않는 사람이 맞다.

[사람복과 악연]
사람복은 없다고 보지 않는다. 다만 아무나 가까이 두면 손해를 본다.

귀인은 말보다 행동이 일정한 사람이다. 처음부터 크게 약속하는 사람보다 시간이 지나도 태도가 변하지 않는 사람이 좋다. 악연은 부탁이 많고 책임은 피하면서 결국 네가 뒷수습하게 만드는 사람이다.

이 사주는 정 때문에 사람을 끊지 못하면 돈과 마음이 같이 샌다. 도와줄 사람과 끊어야 할 사람을 구분해야 인복이 복으로 남는다.

[가족과 거리감]
가족운은 가까움보다 거리 조절이 중요하다. 정 때문에 다 떠안으면 마음과 돈이 같이 눌린다.

가족에게 마음이 없는 사주가 아니다. 오히려 책임을 느끼면 오래 들고 간다. 문제는 어디까지가 도움이고 어디서부터 내 인생을 갉아먹는 책임인지 구분하지 못할 때다.

도울 수 있는 것과 떠안을 수 없는 것을 구분해야 한다. 이 선이 잡혀야 가족운도 복으로 남는다.

[건강에서 조심해야 할 자리]
건강운은 '${healthGrade}'으로 본다. ${health.core}

약한 축은 ${flow.weakestText}이다. 이쪽이 흔들릴 때 잠, 소화, 피로, 목·어깨, 순환 중 하나로 먼저 신호가 온다.

음식은 ${food.fit} 쪽이 맞고, ${food.reduce}은 줄여야 한다. 특별한 보양식보다 매일 반복되는 식사와 수면 리듬이 건강운을 지킨다.

[인생에서 건강이 흔들리는 고비]
건강 고비는 크게 ${healthTp.count}번 들어오는 편이다.

첫 번째는 ${healthTp.first}세 전후, 두 번째는 ${healthTp.second}세 전후다. ${healthTp.count >= 3 ? `세 번째는 ${healthTp.third}세 전후다.` : `세 번째 고비는 강하게 보지 않는다.`}

병을 단정하는 게 아니라 생활 리듬이 흔들리는 시기를 보는 것이다. 이 시기에는 잠, 소화, 피로, 목·어깨, 허리, 순환 중 약한 곳의 신호를 가볍게 넘기면 안 된다.

[인생에서 크게 조심해야 할 고비]
조심해야 할 고비는 두 가지다.

첫째, 방향을 잘못 잡는 고비다. 남 말만 듣고 직업이나 사업을 바꾸면 손해가 붙는다. 좋아 보이는 일과 내 사주에 맞는 일은 다르다.

둘째, 사람 때문에 돈이 새는 고비다. 정 때문에 도와주고 믿고 맡겼다가 결국 네가 책임지는 흐름을 조심해야 한다. 이 사주는 사람 하나 잘못 들이면 돈보다 기운이 먼저 빠진다.

[인생에서 크게 열리는 대운]
크게 열리는 대운은 ${timing.firstMoneyAge}세 전후와 ${timing.strongMoneyAge}세 전후다.

첫 번째는 방향을 다시 잡는 운이고, 두 번째는 돈과 일이 굵어지는 운이다. 이 시기에는 그냥 바쁘게 사는 게 아니라 무엇을 잡고 무엇을 버릴지 분명해야 한다.

대운이 들어와도 기준이 없으면 기회가 부담으로 바뀐다. 받을 돈, 맡을 책임, 같이 갈 사람, 몸이 버틸 수 있는 리듬까지 같이 봐야 한다.

[말년운]
말년은 나쁘게 보지 않는다. 다만 말년에 편하려면 중년부터 돈과 사람 정리를 해야 한다.

돈은 크게 벌어도 흩어지면 불안하고, 작게 벌어도 자산으로 묶으면 편해진다. 사람도 많다고 좋은 게 아니라 믿을 사람만 남는 쪽이 낫다.

말년에 가장 중요한 건 새로 욕심내는 힘보다 지키는 힘이다. 몸을 무리시키지 않는 일, 흩어지지 않는 돈, 감정으로 휘둘리지 않는 사람관계가 남아야 편하다.

[평생종합 마지막 판정]
최종 판정은 이거다.

${topicName} 한 가지 운으로 끝나는 사주가 아니다. 먹고사는 길은 ${mainCareer.label}, 돈은 ${moneySource}, 건강은 ${health.type}, 인생 대운은 ${timing.strongMoneyAge}세 전후가 핵심이다.

이 네 가지를 같이 잡을 때 평생 운이 열린다. 일만 잡고 몸을 버리면 오래 못 가고, 돈만 좇고 사람을 못 거르면 새고, 사랑만 보고 생활 기준을 흐리면 흔들린다. 평생종합은 결국 이 네 축을 같이 맞추는 판정이다.

이 풀이는 사주상 건강 흐름도 포함한다. 통증이나 증상이 오래가면 운세로 넘기지 말고 실제 검진을 받아야 한다.`;
}


function extractWorryQuestionValue(value: any): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";

  const directKeys = [
    "question",
    "worry",
    "concern",
    "customQuestion",
    "questionText",
    "premiumQuestion",
    "worryQuestion",
    "detailQuestion",
    "content",
    "message",
    "text",
    "input",
    "value",
    "answer",
  ];

  for (const key of directKeys) {
    const v = extractWorryQuestionValue(value[key]);
    if (v) return v;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const v = extractWorryQuestionValue(item);
      if (v) return v;
    }
  }

  return "";
}

function getWorryQuestionFromRequest(body: FortuneRequest, user: UserInfo) {
  const rawBody = body as any;
  const rawUser = user as any;
  const candidates = [
    rawBody?.question,
    rawBody?.worry,
    rawBody?.concern,
    rawBody?.customQuestion,
    rawBody?.questionText,
    rawBody?.premiumQuestion,
    rawBody?.paidQuestion,
    rawBody?.userQuestion,
    rawBody?.selectedQuestion,
    rawBody?.worryQuestion,
    rawBody?.worryText,
    rawBody?.worryDetail,
    rawBody?.worryContent,
    rawBody?.concernText,
    rawBody?.concernDetail,
    rawBody?.customConcern,
    rawBody?.detailQuestion,
    rawBody?.questionInput,
    rawBody?.worryInput,
    rawBody?.ask,
    rawBody?.query,
    rawBody?.prompt,
    rawBody?.request,
    rawBody?.description,
    rawBody?.detail,
    rawBody?.consultation,
    rawBody?.topic,
    rawBody?.message,
    rawBody?.text,
    rawBody?.input,
    rawBody?.content,
    rawBody?.value,
    rawBody?.answer,
    rawBody?.answerText,
    rawBody?.answers,
    rawBody?.form,
    rawBody?.payload,
    rawBody?.data,
    rawUser?.question,
    rawUser?.worry,
    rawUser?.concern,
    rawUser?.customQuestion,
    rawUser?.questionText,
    rawUser?.premiumQuestion,
    rawUser?.paidQuestion,
    rawUser?.userQuestion,
    rawUser?.selectedQuestion,
    rawUser?.worryQuestion,
    rawUser?.worryText,
    rawUser?.worryDetail,
    rawUser?.worryContent,
    rawUser?.concernText,
    rawUser?.concernDetail,
    rawUser?.customConcern,
    rawUser?.detailQuestion,
    rawUser?.questionInput,
    rawUser?.worryInput,
    rawUser?.ask,
    rawUser?.query,
    rawUser?.prompt,
    rawUser?.request,
    rawUser?.description,
    rawUser?.detail,
    rawUser?.consultation,
    rawUser?.topic,
    rawUser?.message,
    rawUser?.text,
    rawUser?.input,
    rawUser?.content,
    rawUser?.value,
    rawUser?.answer,
    rawUser?.answerText,
    rawUser?.answers,
  ];
  for (const item of candidates) {
    const v = extractWorryQuestionValue(item);
    if (v) return v;
  }

  const deep = extractWorryQuestionDeep(rawBody) || extractWorryQuestionDeep(rawUser);
  return deep;
}

function extractWorryQuestionDeep(value: any, depth = 0): string {
  if (depth > 4 || value == null) return "";

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return "";
    if (text.length < 6) return "";
    if (/^(preview|full|both|today|money|career|love|marriage|health|compatibility|lifeFlow|traditional|monthly|worry)$/i.test(text)) return "";
    if (/^(내 고민 상담|재물운|일·사업운|연애운|결혼운|건강운|오늘운세|평생종합사주|인생대운|올해운세)$/.test(text)) return "";
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) return "";
    return text;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const v = extractWorryQuestionDeep(item, depth + 1);
      if (v) return v;
    }
    return "";
  }

  if (typeof value !== "object") return "";

  const priorityKeys = [
    "question", "worry", "concern", "customQuestion", "questionText", "premiumQuestion", "paidQuestion",
    "userQuestion", "selectedQuestion", "worryQuestion", "worryText", "worryDetail", "worryContent",
    "concernText", "concernDetail", "customConcern", "detailQuestion", "questionInput", "worryInput",
    "ask", "query", "prompt", "request", "description", "detail", "consultation", "topic",
    "message", "text", "input", "content", "value", "answer", "answerText"
  ];

  for (const key of priorityKeys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const v = extractWorryQuestionDeep(value[key], depth + 1);
      if (v) return v;
    }
  }

  for (const [key, item] of Object.entries(value)) {
    if (/name|gender|calendar|category|mode|year|month|day|hour|minute|birth|manse|partner/i.test(key)) continue;
    const v = extractWorryQuestionDeep(item, depth + 1);
    if (v) return v;
  }

  return "";
}

function getWorryTypeV115(question: string) {
  const q = String(question || "");
  if (/결혼|혼인|배우자|남편|아내|재혼|동거|상견례|이혼|파혼/.test(q)) return "marriage";
  if (/연애|재회|썸|상대|남자친구|여자친구|헤어|이별|마음|고백|짝사랑|만나/.test(q)) return "love";
  if (/돈|재물|투자|사업자금|매출|수익|부업|대출|빚|장사|판매|월급|소득|벌고|벌어/.test(q)) return "money";
  if (/직장|일|이직|퇴사|직업|회사|알바|창업|부업|사업|장사|커리어|무슨 일을|뭘 해야/.test(q)) return "career";
  if (/건강|몸|아프|병원|잠|피로|소화|위|장|스트레스|불안|검진|운동|음식/.test(q)) return "health";
  if (/가족|부모|엄마|아빠|형제|자식|아이|자녀|집안/.test(q)) return "family";
  if (/동업|파트너|친구|지인|거래처|사람|인간관계/.test(q)) return "people";
  return "mixed";
}


function buildV115WorryFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const q = safeText(user.question, "").trim();
  const type = getWorryTypeV115(q);
  const money = getMoneyProfile(manse);
  const career = getCareerArchetype(manse);
  const careerProfile = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const moneyDirection = getConcreteMoneyDirection(manse);

  if (!q) {
    return `[내 고민 상담]
${name}, 지금 입력한 고민 문장이 확인되지 않는다.

이 상태에서 재물운, 직업운, 연애운을 억지로 섞으면 네 질문과 다른 답이 나온다.

내 고민 상담 결과를 보려면 질문 입력칸에 한 문장을 넣어야 한다.
예를 들면 “지금 퇴사해도 되나”, “이 사람을 계속 만나도 되나”, “이 사업을 시작해도 되나”, “이 돈을 써도 되나”처럼 물어봐야 한다.

[마지막 판정]
질문이 들어오면 그 질문 하나만 기준으로 밀어야 하는지, 멈춰야 하는지, 기다려야 하는지 바로 자른다.`;
  }

  let first = "";
  let saju = "";
  let push = "";
  let wait = "";
  let check = "";
  let three = "";
  let year = "";
  let doNow = "";
  let avoid = "";
  let final = "";

  if (type === "money") {
    first = "답부터 말하면, 이 고민은 돈이 되느냐보다 남는 돈으로 바뀌느냐를 먼저 봐야 한다.";
    saju = `네 재물 흐름은 '${money.type}'으로 잡힌다. ${money.core} ${moneyDirection.workAnswer} ${moneyDirection.earn}`;
    push = "지금 바로 밀어도 되는 조건은 분명하다. 받을 금액, 입금일, 내 몫, 책임 범위가 숫자로 보여야 한다. 이 네 가지가 흐리면 돈이 들어와도 남지 않는다.";
    wait = "기다려야 하는 경우도 분명하다. 상대 말은 좋은데 계약서가 없거나, 매출은 커 보이는데 먼저 빠지는 돈이 크거나, 지인 말만 믿고 들어가는 구조라면 한 박자 늦춰야 한다.";
    check = "이 돈은 크게 벌 수 있느냐보다 내가 가격을 정할 수 있느냐, 반복해서 들어오는 구조가 있느냐, 빠지는 비용을 통제할 수 있느냐를 봐야 한다.";
    three = "앞으로 3개월은 돈을 벌겠다고 벌리는 시기보다 새는 구멍을 막는 시기다. 정으로 섞는 돈, 흐린 약속, 급한 투자, 큰 고정비를 먼저 잘라야 한다.";
    year = `앞으로 1년은 ${timing.moneyMoveMonth}월에 돈 이야기가 움직이고, ${timing.moneyLeakMonth}월에는 새는 돈을 조심해야 한다. ${timing.moneyCatchMonth}월에는 놓친 돈길을 다시 잡을 문이 보인다.`;
    doNow = "지금 해야 할 선택은 작게 검증하는 것이다. 바로 크게 넣지 말고, 받을 돈이 실제로 들어오는지 먼저 확인해야 한다.";
    avoid = "피해야 할 선택은 남 말만 듣고 들어가는 투자, 내 몫이 흐린 동업, 먼저 돈부터 빠지는 장사, 가격을 못 정하는 일이다.";
    final = "최종 판정은 이거다. 이 돈 고민은 욕심으로 풀 문제가 아니다. 돈 받을 구조가 보이면 잡고, 보이지 않으면 멈춰라.";
  } else if (type === "career") {
    first = "답부터 말하면, 이 고민은 지금 일을 계속하느냐보다 그 일이 네 이름과 돈으로 남느냐를 봐야 한다.";
    saju = `네 일의 큰 판정은 '${career.combined}'이다. 직업명 하나보다 네가 한 만큼 결과가 남는 자리인지가 핵심이다.`;
    push = "지금 바로 움직여도 되는 조건은 다음 자리에 권한, 단가, 결과, 반복 수요가 보일 때다. 답답해서 나가는 건 답이 아니다.";
    wait = "조금 버티며 봐야 하는 경우도 있다. 지금 자리가 배울 게 남아 있거나, 다음 돈길이 아직 흐리면 바로 자르기보다 준비가 먼저다.";
    check = `핵심 체크는 이것이다. ${careerProfile.action.slice(0, 3).join(" · ")}이 보이면 살고, ${careerProfile.avoid.slice(0, 3).join(" · ")} 쪽이면 오래 버텨도 기운이 빠진다.`;
    three = "앞으로 3개월은 역할과 돈의 선을 확인하는 시기다. 내가 어디까지 책임지는지, 그 결과가 누구 이름으로 남는지 봐야 한다.";
    year = "앞으로 1년은 일의 방향이 갈리는 시기다. 돈 받을 명목이 생기는 자리로 가면 살고, 책임만 늘어나는 자리로 가면 같은 고민이 반복된다.";
    doNow = "지금 해야 할 선택은 직업명을 고르는 게 아니라 돈 받는 구조를 보는 것이다. 단가, 권한, 결과, 다음 기회를 적어봐라.";
    avoid = "피해야 할 선택은 감정으로 퇴사하기, 준비 없이 창업하기, 이름도 돈도 안 남는 책임만 떠안기다.";
    final = "최종 판정은 이거다. 오래 버티는 게 답이 아니다. 네가 한 만큼 이름과 돈이 남는 자리로 가야 풀린다.";
  } else if (type === "love") {
    first = "답부터 말하면, 이 고민은 상대가 좋냐보다 이 관계가 너를 편하게 만드는지 불안하게 만드는지부터 봐야 한다.";
    saju = `네 인연 흐름은 '${relation.type}'으로 잡힌다. ${relation.core}`;
    push = "지금 먼저 밀어붙이면 관계가 빨리 움직일 수는 있다. 대신 상대가 닫히거나 네가 더 확인받고 싶어지는 흐름이 생긴다.";
    wait = "조금 늦추면 상대의 말이 아니라 반복 행동이 보인다. 연락, 시간, 약속, 갈등 후 태도가 답이다.";
    check = "핵심은 상대가 너를 불안하게 만드는지 편하게 만드는지다. 좋아하는 말보다 반복 행동을 봐라.";
    three = "앞으로 3개월은 연락과 만남의 속도가 갈린다. 네가 다 맞추고 있는지, 상대도 시간을 쓰는지 봐야 한다.";
    year = "앞으로 1년은 이 인연이 깊어질지 정리될지 드러난다. 감정만 남으면 지치고, 행동이 반복되면 오래 간다.";
    doNow = "지금 해야 할 선택은 관계 속도를 늦추고 상대의 반복 행동을 보는 것이다.";
    avoid = "피해야 할 선택은 불안해서 먼저 매달리기, 말만 좋은 사람을 믿기, 반응 하나로 관계를 확정하기다.";
    final = "최종 판정은 이거다. 이 인연은 감정보다 반복 행동을 봐야 한다. 편해지면 잡고, 계속 불안하면 멈춰라.";
  } else if (type === "marriage") {
    first = "답부터 말하면, 이 고민은 마음 하나보다 같이 살아도 무너지지 않는 구조인지 봐야 한다.";
    saju = `네 결혼 흐름은 관계운 '${relation.type}'과 돈 기준이 같이 걸린다. 결혼은 감정, 생활비, 가족 거리, 말투가 같이 맞아야 산다.`;
    push = "지금 감정만 믿고 밀면 초반에는 편해도 생활비, 가족, 역할 문제에서 피로가 커질 수 있다.";
    wait = "조금 늦추면 상대가 불편한 대화를 피하는지, 돈 이야기를 흐리는지, 가족 문제에서 선을 잡는지가 보인다.";
    check = "핵심은 같이 살 때 돈과 가족과 생활 리듬이 무너지지 않는지다. 고백보다 생활 기준이 답이다.";
    three = "앞으로 3개월은 결론보다 상대의 반복 행동을 보는 시기다. 약속, 돈 쓰는 방식, 갈등 후 태도를 봐라.";
    year = "앞으로 1년은 결혼 이야기가 움직일 수 있는 흐름이다. 감정 고백보다 집, 돈, 가족 거리, 역할 분담을 맞춰야 한다.";
    doNow = "지금 해야 할 선택은 결혼 기준을 말로 꺼내는 것이다. 생활비, 저축, 가족 개입, 역할 분담을 피하지 마라.";
    avoid = "피해야 할 선택은 외로움 때문에 확정하기, 결혼하면 상대가 바뀔 거라 믿기, 돈과 가족 기준을 넘기는 것이다.";
    final = "최종 판정은 이거다. 마음만 보면 답이 안 나온다. 같이 살 때 무너질 기준을 먼저 보면 답이 나온다.";
  } else if (type === "health") {
    first = "답부터 말하면, 이 고민은 병명을 맞히는 문제가 아니라 네 몸이 먼저 보내는 신호를 잡는 문제다.";
    saju = `네 건강 흐름은 '${health.type}'이다. ${health.risk}`;
    push = "지금 계속 밀면 당장은 버틴다. 하지만 잠, 소화, 피로, 목어깨, 순환 중 약한 곳에서 먼저 신호가 올라온다.";
    wait = "조금 늦추고 몸을 보면 어떤 습관이 문제인지 보인다. 한꺼번에 바꾸기보다 먼저 흔들리는 리듬부터 잡아야 한다.";
    check = `핵심은 ${health.action.join(" · ")}부터 잡는 것이다. ${health.avoid.join(" · ")}은 줄여야 한다.`;
    three = "앞으로 3개월은 몸의 신호를 확인하는 시기다. 반복되는 피로, 소화, 잠, 통증을 운으로 넘기면 안 된다.";
    year = "앞으로 1년은 건강 리듬을 다시 잡는 시기다. 몸을 회복시키면 일과 돈도 같이 살아난다.";
    doNow = "지금 해야 할 선택은 잠자는 시간, 식사 시간, 찬 음식과 야식, 몸을 풀어주는 운동부터 잡는 것이다.";
    avoid = "피해야 할 선택은 공복 커피, 밤샘, 몰아서 운동, 피로를 참고 계속 버티는 습관이다.";
    final = "최종 판정은 이거다. 겁먹을 문제가 아니라 리듬을 바꿔야 풀린다. 증상이 오래가면 실제 검진을 받아야 한다.";
  } else {
    first = "답부터 말하면, 이 고민은 여러 가지가 섞여 보여도 먼저 막힌 축 하나를 좁혀야 풀린다.";
    saju = `네 사주에서는 돈은 '${money.type}', 일은 '${career.combined}', 몸은 '${health.type}', 사람은 '${relation.type}' 흐름이 같이 보인다. 하지만 이걸 전부 한꺼번에 풀면 답이 흐려진다.`;
    push = "지금 급하게 밀면 답답함은 줄어든다. 하지만 막힌 축을 잘못 보면 같은 고민이 다른 모양으로 다시 돌아온다.";
    wait = "조금 늦추면 이 문제가 돈 문제인지, 사람 문제인지, 일 문제인지, 몸 문제인지 갈린다.";
    check = "핵심은 지금 제일 손해가 큰 쪽이 어디인지 보는 것이다. 돈인지, 일인지, 사람인지, 몸인지 하나로 좁혀라.";
    three = "앞으로 3개월은 결론보다 원인을 좁히는 시기다. 크게 바꾸기보다 손실이 큰 선택부터 멈춰야 한다.";
    year = "앞으로 1년은 같은 고민을 반복하지 않게 기준을 세우는 시기다. 무엇을 잡고 무엇을 버릴지 분명히 해야 한다.";
    doNow = "지금 해야 할 선택은 문제를 하나로 좁히는 것이다. 오늘 결정할 일과 미뤄도 되는 일을 나눠라.";
    avoid = "피해야 할 선택은 감정으로 큰 결정을 하는 것, 돈이 큰 선택을 바로 하는 것, 사람 말만 듣고 움직이는 것이다.";
    final = "최종 판정은 이거다. 오래 생각한다고 풀리지 않는다. 먼저 막힌 축을 하나로 좁혀야 답이 나온다.";
  }

  return `[질문에 대한 답부터 말하면]\n${name}, 네 질문은 이거다.\n\n“${q}”\n\n${first}\n\n[이 질문에서 사주가 먼저 보는 자리]\n${saju}\n\n[지금 바로 밀고 가면 생기는 일]\n${push}\n\n[멈추거나 기다리면 보이는 것]\n${wait}\n\n[이 고민의 핵심 체크]\n${check}\n\n[앞으로 3개월 조심할 것]\n${three}\n\n[앞으로 1년 잡아야 할 것]\n${year}\n\n[지금 해야 할 선택]\n${doNow}\n\n[피해야 할 선택]\n${avoid}\n\n[내 고민 상담 마지막 판정]\n${final}`;
}

function isWorryCategoryV112(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  return (
    categoryId === "worry" ||
    categoryId === "premium" ||
    title.includes("고민") ||
    title.includes("상담") ||
    title.includes("프리미엄")
  );
}

function getWorryDomainV112(question: string) {
  const q = String(question || "");
  if (/결혼|혼인|배우자|남편|아내|재혼|동거|상견례|이혼|파혼/.test(q)) {
    return {
      label: "결혼·배우자 고민",
      direct: "이 고민은 좋아하냐 싫어하냐보다 같이 살아도 무너지지 않는 구조인지부터 봐야 한다.",
      core: "사주에서는 결혼 고민을 감정 하나로 보지 않는다. 돈 기준, 생활 리듬, 가족 거리, 책임감, 갈등 후 회복 방식이 같이 맞아야 결혼운이 산다.",
      push: "지금 감정만 믿고 밀면 초반에는 마음이 편해져도, 나중에는 생활비·가족·역할 문제에서 피로가 커질 수 있다.",
      wait: "조금 늦추고 보면 상대가 불편한 대화를 피하는지, 돈 이야기를 흐리는지, 가족 문제에서 선을 잡는지가 보인다.",
      threeMonth: "앞으로 3개월은 결론을 급하게 박는 시기보다 상대의 반복 행동을 보는 시기다. 말보다 실제 약속, 돈 쓰는 방식, 갈등 후 태도를 봐야 한다.",
      oneYear: "앞으로 1년은 관계의 생활성이 드러나는 흐름이다. 이때 결혼 이야기가 움직이면 감정 고백보다 돈·집·가족 거리·생활 루틴을 먼저 맞춰야 한다.",
      doNow: "지금 해야 할 건 상대에게 결혼 기준을 말로 꺼내는 것이다. 생활비, 저축, 가족 개입, 역할 분담을 피하지 않고 말해야 한다.",
      avoidNow: "피해야 할 건 외로움 때문에 확정하는 선택, 상대가 결혼 후 바뀔 거라 믿는 선택, 돈과 가족 기준을 확인하지 않고 넘어가는 선택이다.",
      final: "결론은 이거다. 이 결혼 고민은 마음만 보면 답이 안 나온다. 같이 살 때 무너질 기준을 먼저 보면 답이 나온다.",
    };
  }

  if (/연애|재회|썸|상대|남자친구|여자친구|헤어|이별|마음|고백|짝사랑|만나/.test(q)) {
    return {
      label: "연애·상대 고민",
      direct: "이 고민은 상대가 좋냐보다 이 관계가 너를 살리는 관계인지, 계속 불안하게 만드는 관계인지부터 봐야 한다.",
      core: "사주에서는 인연을 설렘만으로 보지 않는다. 끌림, 연락 속도, 말투, 반복 행동, 감정 회복 방식이 맞아야 오래 간다.",
      push: "지금 불안해서 먼저 밀어붙이면 관계는 빨리 움직일 수 있다. 대신 상대가 닫히거나 네가 더 확인받고 싶어지는 흐름이 생긴다.",
      wait: "조금 늦추고 보면 상대가 말만 하는 사람인지, 행동이 반복되는 사람인지 갈린다. 이 고민은 상대의 첫 반응보다 반복 반응이 답이다.",
      threeMonth: "앞으로 3개월은 연락과 만남의 속도가 갈린다. 네가 다 맞추고 있는지, 상대도 시간을 쓰는지, 서운함이 반복되는지 봐야 한다.",
      oneYear: "앞으로 1년은 이 관계가 깊어질지 정리될지 드러나는 시기다. 감정만 남고 생활 기준이 안 맞으면 지치고, 행동이 반복되면 오래 간다.",
      doNow: "지금 해야 할 건 관계 속도를 맞추는 것이다. 답을 빨리 달라고 몰아붙이기보다 상대가 실제로 시간을 쓰는지 봐야 한다.",
      avoidNow: "피해야 할 건 불안해서 먼저 매달리는 선택, 말만 좋은 사람을 믿는 선택, 상대 반응 하나로 관계를 확정하거나 끊는 선택이다.",
      final: "결론은 이거다. 이 인연은 감정보다 반복 행동을 봐야 한다. 상대가 계속 너를 편하게 만들면 잡고, 계속 불안하게 만들면 멈춰야 한다.",
    };
  }

  if (/돈|재물|투자|사업자금|매출|수익|부업|대출|빚|장사|판매|월급|소득|벌고|벌어/.test(q)) {
    return {
      label: "돈·재물 고민",
      direct: "이 고민은 돈이 있냐 없냐보다 어디서 돈이 붙고 어디서 새는지를 먼저 갈라야 풀린다.",
      core: "사주에서는 재물운을 한 방으로 보지 않는다. 돈 받을 명목, 가격 기준, 반복 수입, 사람 때문에 새는 구멍, 먼저 빠지는 비용을 같이 봐야 한다.",
      push: "지금 감으로 밀면 돈 이야기는 빨리 움직일 수 있다. 하지만 받을 돈, 입금일, 내 몫, 책임 범위가 흐리면 남는 돈보다 새는 돈이 먼저 커진다.",
      wait: "조금 기다리면 이 돈이 진짜 남는 돈인지, 남 좋은 일인지 보인다. 특히 사람 말만 믿고 들어가는 돈은 한 박자 늦춰야 한다.",
      threeMonth: "앞으로 3개월은 큰돈을 벌기보다 새는 구멍을 찾는 시기다. 지인 부탁, 흐린 가격, 먼저 빠지는 고정비, 감정으로 쓰는 돈을 잘라야 한다.",
      oneYear: "앞으로 1년은 돈길을 고르는 시기다. 맞는 직업축이나 사업축이 잡히면 돈이 쌓이기 시작하지만, 잘못 잡으면 바쁘기만 하고 남는 돈이 작다.",
      doNow: "지금 해야 할 건 받을 금액, 입금일, 내 몫, 책임 범위를 숫자로 정하는 것이다. 이 네 개가 안 보이면 시작하지 마라.",
      avoidNow: "피해야 할 건 남 말만 듣고 들어가는 투자, 정으로 섞는 돈, 큰 재고와 고정비, 내 몫이 흐린 동업이다.",
      final: "결론은 이거다. 이 돈 고민은 욕심 문제가 아니다. 돈 받을 자리를 정확히 잡고 새는 구멍을 닫아야 풀린다.",
    };
  }

  if (/직장|일|이직|퇴사|직업|회사|알바|창업|부업|사업|장사|커리어|무슨 일을|뭘 해야/.test(q)) {
    return {
      label: "일·직업 고민",
      direct: "이 고민은 지금 일을 계속하느냐 그만두느냐보다, 네 사주가 돈과 이름이 남는 자리로 가고 있느냐를 봐야 한다.",
      core: "사주에서는 일을 직업명 하나로 보지 않는다. 밥벌이가 되는 자리, 돈이 굵어지는 자리, 몸과 돈이 같이 새는 자리를 갈라야 한다.",
      push: "지금 감정으로 움직이면 답답함은 풀릴 수 있다. 하지만 다음 자리에서 돈 받을 구조가 안 보이면 같은 고민이 반복된다.",
      wait: "조금 버티며 보면 지금 자리가 배울 게 있는 자리인지, 책임만 떠안는 자리인지 드러난다. 버틸지 움직일지는 그걸 보고 갈라야 한다.",
      threeMonth: "앞으로 3개월은 바로 결론보다 역할과 돈의 선을 보는 시기다. 내 일이 경력으로 남는지, 내 이름과 결과가 남는지 봐야 한다.",
      oneYear: "앞으로 1년은 일의 방향이 갈리는 시기다. 맞는 직업축을 잡으면 일이 돈으로 바뀌고, 틀린 축을 잡으면 바쁘기만 하고 남는 게 약하다.",
      doNow: "지금 해야 할 건 직업명보다 돈 받는 구조를 보는 것이다. 단가, 권한, 결과, 반복 수요, 다음 기회가 보이는 일을 잡아야 한다.",
      avoidNow: "피해야 할 건 책임만 큰 자리, 이름이 안 남는 일, 돈부터 빠지는 사업, 사람 말만 믿고 들어가는 판이다.",
      final: "결론은 이거다. 이 일 고민은 오래 버티면 풀리는 문제가 아니다. 네가 한 만큼 이름과 돈이 남는 자리로 가야 풀린다.",
    };
  }

  if (/건강|몸|아프|병원|잠|피로|소화|위|장|스트레스|불안|검진|운동|음식/.test(q)) {
    return {
      label: "건강 고민",
      direct: "이 고민은 병명을 맞히는 문제가 아니라 네 몸이 어디서 먼저 신호를 보내는지 봐야 한다.",
      core: "사주에서는 건강운을 몸의 약한 축, 생활 리듬, 무리하면 꺾이는 자리, 회복법으로 본다.",
      push: "지금 무리해서 밀면 당장은 버틸 수 있다. 하지만 수면, 소화, 피로, 목어깨, 순환 중 약한 곳에서 먼저 신호가 올라온다.",
      wait: "조금 늦추고 몸을 보면 어떤 습관이 문제인지 보인다. 음식, 수면, 운동을 한꺼번에 바꾸기보다 먼저 흔들리는 리듬부터 잡아야 한다.",
      threeMonth: "앞으로 3개월은 몸의 신호를 확인하는 시기다. 반복되는 피로, 소화, 잠, 통증을 운으로 넘기면 안 된다.",
      oneYear: "앞으로 1년은 건강 리듬을 다시 잡는 시기다. 몸을 회복시키면 일과 돈도 같이 살아나고, 몸을 무시하면 좋은 운도 오래 못 끌고 간다.",
      doNow: "지금 해야 할 건 잠자는 시간, 식사 시간, 찬 음식과 야식, 몸을 풀어주는 운동을 먼저 잡는 것이다.",
      avoidNow: "피해야 할 건 공복 커피, 밤샘, 몰아서 운동, 피로를 참고 계속 버티는 습관이다.",
      final: "결론은 이거다. 이 건강 고민은 겁먹을 문제가 아니라 리듬을 바꿔야 풀린다. 증상이 오래가면 실제 검진을 받아야 한다.",
    };
  }

  return {
    label: "혼합 고민",
    direct: "이 고민은 한 가지로 보이지만 실제로는 돈·일·사람·몸 중 하나가 먼저 막혀서 생긴 문제다.",
    core: "사주에서는 고민을 감정으로만 보지 않는다. 어떤 선택이 복을 만들고, 어떤 선택이 손해를 키우는지 먼저 갈라야 한다.",
    push: "지금 급하게 밀면 답답함은 줄 수 있다. 하지만 막힌 축을 잘못 보면 같은 고민이 다시 돌아온다.",
    wait: "조금 늦추고 보면 이 문제가 돈 문제인지, 사람 문제인지, 일 문제인지, 몸 문제인지 갈린다.",
    threeMonth: "앞으로 3개월은 결론보다 원인을 좁히는 시기다. 크게 바꾸기보다 손실이 큰 선택부터 멈춰야 한다.",
    oneYear: "앞으로 1년은 같은 고민을 반복하지 않게 기준을 세우는 시기다. 무엇을 잡고 무엇을 버릴지 분명히 해야 한다.",
    doNow: "지금 해야 할 건 문제를 하나로 좁히는 것이다. 오늘 결정할 일과 미뤄도 되는 일을 나눠야 한다.",
    avoidNow: "피해야 할 건 감정으로 큰 결정을 하는 것, 돈이 큰 선택을 바로 하는 것, 사람 말만 듣고 움직이는 것이다.",
    final: "결론은 이거다. 이 고민은 오래 생각한다고 풀리지 않는다. 먼저 막힌 축을 하나로 좁혀야 답이 나온다.",
  };
}

function buildV112WorryFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const question = safeText(user.question, "").trim();
  const domain = getWorryDomainV112(question);
  const money = getMoneyProfile(manse);
  const career = getCareerArchetype(manse);
  const careerProfile = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const flow = getReadableElementFlow(manse);
  const moneyDirection = getConcreteMoneyDirection(manse);

  const questionLine = question || "입력한 고민이 비어 있다. 이 메뉴는 질문이 선명해야 답도 선명하게 나온다.";

  return `[질문에 대한 답부터 말하면]
${name}, 네가 물은 질문은 이거다.

“${questionLine}”

답부터 말하면, ${domain.direct}

이 메뉴는 평생종합사주를 다시 풀어주는 곳이 아니다. 네 질문 하나를 사주 전체에 올려놓고, 해도 되는지, 멈춰야 하는지, 기다려야 하는지 잘라주는 메뉴다.

여기서 딴 얘기를 하면 틀어진다. 돈, 일, 사람, 건강을 다 보더라도 전부 이 질문에 필요한 근거로만 써야 한다.

[내 사주상 분석]
이 질문을 볼 때 네 사주에서 먼저 잡히는 큰 축은 세 가지다.

첫째, 돈의 흐름은 '${money.type}' 쪽으로 잡힌다. ${money.core}

둘째, 일의 큰 판정은 '${career.combined}'이다. 이 말은 직업명 하나를 찍는 게 아니라, 네가 어떤 자리에서 돈과 결과를 남기는지를 보는 기준이다.

셋째, 몸과 마음의 리듬은 '${health.type}'이 먼저 걸린다. ${health.risk}

그리고 사람 문제는 '${relation.type}' 흐름이 붙는다. ${relation.core}

그러니까 이 고민은 단순히 기분 문제로만 보면 안 된다. 네 사주에서는 ${flow.strongest} 기운이 강하게 움직이고, ${flow.weakest} 기운은 쉽게 흔들리는 쪽이라서, 강한 쪽으로 밀어붙일 때는 빠르지만 약한 쪽이 무너지면 뒤가 피곤해진다.

[이 고민의 핵심]
${domain.core}

이 질문에서 중요한 건 “하고 싶다”가 아니다. 하고 난 뒤에 돈이 남는지, 사람이 남는지, 몸이 버티는지, 다음 선택지가 열리는지를 봐야 한다.

네 사주에서는 감정이 먼저 올라오는 순간보다 그 다음이 더 중요하다. 처음에는 답이 보이는 것 같아도, 실제로는 내 몫, 책임 범위, 반복되는 피로, 사람과의 선이 뒤늦게 문제로 올라올 수 있다.

[지금 밀고 가면 생기는 일]
${domain.push}

밀고 가도 되는 고민은 있다. 다만 조건이 있다. 돈 문제라면 받을 금액과 입금일이 보여야 하고, 일 문제라면 내 역할과 결과가 남아야 한다. 관계 문제라면 상대의 말보다 반복 행동이 보여야 하고, 건강 문제라면 몸이 버틸 수 있는 리듬이 먼저 잡혀야 한다.

이 조건 없이 밀면 처음엔 답답함이 풀린다. 하지만 시간이 지나면 같은 질문이 더 크게 돌아온다.

[멈추거나 기다리면 보이는 것]
${domain.wait}

기다린다는 건 아무것도 안 한다는 뜻이 아니다. 이 사주에서 기다림은 확인하는 시간이다.

돈이면 돈 받을 구조를 확인하고, 일이면 다음 자리의 권한과 돈을 확인하고, 사람이면 반복 행동을 확인하고, 건강이면 몸이 먼저 보내는 신호를 확인하는 시간이다.

이 시간을 건너뛰면 운이 와도 내가 손해 보는 쪽으로 잡는다.

[돈·일·사람·몸 중 실제로 걸린 축]
이 질문에서 돈이 걸려 있으면 핵심은 이거다. ${moneyDirection.workAnswer} ${moneyDirection.earn}

일이 걸려 있으면 핵심은 이거다. '${career.combined}' 흐름대로 네가 한 만큼 이름과 돈이 남는 자리를 잡아야 한다. 책임만 크고 결과가 남지 않는 자리는 오래 버틸수록 기운이 빠진다.

사람이 걸려 있으면 핵심은 이거다. ${relation.risk} 좋은 사람인지보다, 네 생활과 돈과 몸을 망가뜨리지 않는 사람인지 봐야 한다.

몸이 걸려 있으면 핵심은 이거다. ${health.action.join(" · ")}부터 잡아야 한다. ${health.avoid.join(" · ")}은 이 고민을 더 무겁게 만든다.

[앞으로 3개월 조심할 것]
${domain.threeMonth}

이 3개월 안에는 큰 결론보다 손해 나는 선택을 먼저 막아야 한다. 급한 계약, 급한 약속, 급한 고백, 급한 퇴사, 급한 투자, 급하게 몸을 몰아붙이는 선택이 약하다.

특히 이 시기에는 사람 말이 세게 들릴 수 있다. 누가 “이게 맞다”고 해도 네 사주에서 맞는지 따로 봐야 한다. 남이 빨리 가는 길이 네 복길은 아니다.

[앞으로 1년 잡아야 할 것]
${domain.oneYear}

올해 흐름으로 보면 돈은 ${timing.moneyMoveMonth}월에 움직이고, ${timing.moneyLeakMonth}월에 새기 쉽고, ${timing.moneyCatchMonth}월에 다시 잡을 문이 보인다.

이 달들은 단순히 돈만 뜻하지 않는다. 돈 이야기가 움직이는 달에는 일, 계약, 사람 약속, 몸의 피로도 같이 움직인다. 그래서 이 고민은 달마다 다르게 써야 한다.

움직일 달에는 확인하고, 새는 달에는 줄이고, 다시 잡는 달에는 기준을 세워야 한다.

[지금 해야 할 선택]
${domain.doNow}

그리고 하나 더 있다. 이 고민을 해결하려면 말로만 정리하면 안 된다. 받을 돈, 맡을 일, 만날 사람, 쓸 시간, 몸이 버틸 양을 눈앞에 꺼내야 한다.

정리하면 지금 네가 잡아야 할 건 ${money.action.slice(0, 2).join(" · ")}이고, 일에서는 ${careerProfile.action.slice(0, 2).join(" · ")}이며, 몸에서는 ${health.action.slice(0, 2).join(" · ")}이다.

[피해야 할 선택]
${domain.avoidNow}

네 사주에서 이 고민을 망치는 건 대개 하나다. 마음이 급해졌을 때 기준을 흐리는 것.

돈이면 정 때문에 흐리고, 일이면 책임 때문에 흐리고, 사람은 미안해서 흐리고, 몸은 “조금만 더” 하면서 흐린다. 이 흐림이 쌓이면 복이 와도 손에 남지 않는다.

[내 고민 상담 마지막 판정]
${domain.final}

${name}, 이 질문은 길게 돌려 말할 문제가 아니다. 지금 답은 “무조건 해라”도 아니고 “무조건 멈춰라”도 아니다.

네 사주에서는 조건이 보이면 잡고, 조건이 흐리면 멈춰야 한다. 돈은 입금일과 내 몫, 일은 권한과 결과, 사람은 반복 행동, 건강은 회복 리듬. 이 네 가지 중 하나라도 흐리면 지금은 속도를 늦춰야 한다.

최종 판정은 이거다. 네 고민은 감정으로 결정하면 다시 돌아오고, 사주상 기준으로 자르면 풀린다.`;
}



function buildV113WorryFullReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const question = safeText(user.question, "").trim();
  const q = question || "입력한 고민이 비어 있다";
  const domain = getWorryDomainV112(q);
  const money = getMoneyProfile(manse);
  const career = getCareerArchetype(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const moneyDirection = getConcreteMoneyDirection(manse);

  let coreAxis = "";
  let sajuGround = "";
  let whatToCheck = "";
  let whatToDo = domain.doNow;
  let whatToAvoid = domain.avoidNow;

  if (/결혼|혼인|배우자|남편|아내|재혼|동거|상견례|이혼|파혼/.test(q)) {
    coreAxis = "사람·생활·돈 기준이 같이 걸린 결혼 고민";
    sajuGround = `이 질문은 감정만 보면 틀어진다. 네 사주에서는 관계 흐름이 '${relation.type}'으로 잡히고, 결혼은 돈 쓰는 기준, 가족 거리, 갈등 후 회복 방식까지 같이 맞아야 산다. 상대가 좋으냐보다 같이 살 때 돈과 말투와 가족 선이 무너지지 않는지가 핵심이다.`;
    whatToCheck = "상대가 불편한 말을 피하는지, 돈 이야기를 흐리는지, 가족 문제에서 너를 앞에 세우는지 뒤로 빼는지 봐야 한다. 결혼 고민은 고백보다 생활 기준에서 답이 갈린다.";
  } else if (/연애|재회|썸|상대|남자친구|여자친구|헤어|이별|마음|고백|짝사랑|만나/.test(q)) {
    coreAxis = "상대의 말보다 반복 행동을 봐야 하는 인연 고민";
    sajuGround = `이 질문은 설렘 하나로 결론 내리면 틀어진다. 네 사주에서는 인연 흐름이 '${relation.type}'으로 잡힌다. 끌림은 있어도 연락 속도, 말투, 약속을 지키는 방식, 서운함이 생겼을 때 회복하는 태도에서 답이 나온다.`;
    whatToCheck = "상대가 너에게 시간을 실제로 쓰는지, 말보다 행동이 반복되는지, 네가 계속 확인받고 싶어지는 관계인지 봐야 한다. 편해지는 관계면 살고, 계속 불안하게 만드는 관계면 오래 끌수록 손해다.";
  } else if (/돈|재물|투자|사업자금|매출|수익|부업|대출|빚|장사|판매|월급|소득|벌고|벌어/.test(q)) {
    coreAxis = "돈이 붙는 자리와 새는 구멍을 가르는 재물 고민";
    sajuGround = `이 질문은 돈이 있냐 없냐가 아니라 어디서 돈이 붙고 어디서 새는지가 핵심이다. 네 재물 흐름은 '${money.type}' 쪽으로 잡힌다. ${money.core} 지금 필요한 건 돈 벌 방법을 넓히는 게 아니라, 돈 받을 명목과 새는 구멍을 정확히 자르는 것이다.`;
    whatToCheck = `${moneyDirection.workAnswer} ${moneyDirection.earn} 받을 금액, 입금일, 내 몫, 책임 범위가 흐리면 시작하면 안 된다. 이 네 개가 보이면 밀고, 안 보이면 멈춰야 한다.`;
  } else if (/직장|일|이직|퇴사|직업|회사|알바|창업|부업|사업|장사|커리어|무슨 일을|뭘 해야/.test(q)) {
    coreAxis = "지금 일을 계속할지, 돈과 이름이 남는 자리로 옮길지 보는 일 고민";
    sajuGround = `이 질문은 직업명 하나로 답이 안 난다. 네 일의 큰 판정은 '${career.combined}'이다. 이건 회사냐 창업이냐보다 먼저, 네가 한 만큼 결과와 돈이 남는 자리에 서야 한다는 뜻이다.`;
    whatToCheck = "지금 자리가 경력으로 남는지, 네 이름이나 기술값이 붙는지, 권한과 책임이 맞는지 봐야 한다. 책임만 크고 돈 받을 구조가 작으면 오래 버텨도 같은 고민이 반복된다.";
  } else if (/건강|몸|아프|병원|잠|피로|소화|위|장|스트레스|불안|검진|운동|음식/.test(q)) {
    coreAxis = "몸이 먼저 보내는 신호를 잡아야 하는 건강 고민";
    sajuGround = `이 질문은 병명을 맞히는 풀이가 아니다. 네 건강 흐름은 '${health.type}'으로 잡힌다. ${health.risk} 지금 필요한 건 겁먹는 게 아니라 몸이 먼저 흔들리는 리듬을 찾아서 끊는 것이다.`;
    whatToCheck = `먼저 볼 건 ${health.action.join(" · ")}이다. 피해야 할 건 ${health.avoid.join(" · ")}이다. 증상이 오래가면 운세로 넘기지 말고 실제 검진을 받아야 한다.`;
  } else {
    coreAxis = "돈·일·사람·몸 중 먼저 막힌 축을 좁혀야 하는 혼합 고민";
    sajuGround = `이 질문은 한 가지처럼 보여도 실제로는 돈, 일, 사람, 몸 중 하나가 먼저 막혀서 생긴 고민이다. 네 사주에서는 돈은 '${money.type}', 일은 '${career.combined}', 몸은 '${health.type}', 사람은 '${relation.type}' 흐름이 같이 보인다. 하지만 전부 다 풀면 답이 흐려진다. 먼저 막힌 축 하나를 잡아야 한다.`;
    whatToCheck = "지금 제일 손해가 큰 쪽이 돈인지, 일인지, 사람인지, 몸인지부터 좁혀라. 하나를 좁히면 답이 보이고, 전부 동시에 잡으려 하면 같은 고민이 다시 돈다.";
  }

  return `[질문에 대한 답부터 말하면]
${name}, 네 질문은 이거다.

“${q}”

답부터 말하면, ${domain.direct}

이 고민의 중심은 '${coreAxis}'이다. 그래서 이 풀이에서는 다른 운을 길게 펼치지 않는다. 재물운, 직업운, 인연운, 건강운을 보더라도 전부 이 질문에 답하기 위한 근거로만 쓴다.

[이 질문에서 사주가 먼저 보는 자리]
${sajuGround}

사주판에서 이 질문은 그냥 기분 문제가 아니다. 지금 선택을 하면 무엇이 남고, 무엇이 새고, 몸과 마음이 어디서 눌리는지를 같이 봐야 한다.

[지금 바로 밀고 가면 생기는 일]
${domain.push}

지금 밀어도 되는 경우는 조건이 분명할 때다. 돈이면 받을 금액과 입금일이 보여야 한다. 일이면 내 역할과 결과가 남아야 한다. 사람 문제면 상대의 말보다 반복 행동이 보여야 한다. 건강 문제면 몸이 버틸 리듬이 먼저 잡혀야 한다.

그 조건이 안 보이면 지금 밀어붙이는 건 답이 아니라 답답함을 잠깐 덮는 선택이다.

[멈추거나 기다리면 보이는 것]
${domain.wait}

기다린다는 건 아무것도 하지 말라는 뜻이 아니다. 이 고민에서 기다림은 확인하는 시간이다. 말로만 좋은지, 실제로 돈이 남는지, 반복 행동이 있는지, 몸이 따라오는지 확인하는 시간이다.

이 확인 없이 움직이면 같은 고민이 다른 모양으로 다시 돌아온다.

[이 고민의 핵심 체크]
${whatToCheck}

여기서 답이 갈린다. 이 조건이 맞으면 밀어도 된다. 이 조건이 흐리면 멈춰야 한다. 감정이 강해도 기준이 흐리면 손해가 먼저 붙는다.

[앞으로 3개월 조심할 것]
${domain.threeMonth}

앞으로 3개월은 큰 결론보다 손해 나는 선택을 막는 게 먼저다. 급한 계약, 급한 약속, 급한 고백, 급한 퇴사, 급한 투자, 급하게 몸을 몰아붙이는 선택이 약하다.

특히 이 시기에는 누가 옆에서 한마디 하면 마음이 흔들릴 수 있다. 남이 빨리 가는 길이 네 복길은 아니다. 네 사주에서 남는 길인지 따로 봐야 한다.

[앞으로 1년 잡아야 할 것]
${domain.oneYear}

돈이 걸린 고민이면 ${timing.moneyMoveMonth}월에 이야기가 움직이고, ${timing.moneyLeakMonth}월에는 새는 돈을 조심해야 한다. ${timing.moneyCatchMonth}월에는 놓친 흐름을 다시 잡을 문이 보인다.

일이나 사람 문제도 이 흐름과 같이 움직인다. 돈이 움직이는 달에는 제안, 약속, 계약, 관계의 기준도 같이 움직이고, 새는 달에는 괜히 서두르면 손해가 커진다.

[지금 해야 할 선택]
${whatToDo}

지금 선택은 크게 보지 말고 작게 잘라야 한다. 오늘 확인할 것, 이번 달 안에 정리할 것, 3개월 안에 결론 낼 것을 나눠라.

한 번에 인생 전체를 바꾸려 하면 흔들린다. 하지만 기준 하나를 바로 세우면 이 고민은 생각보다 빨리 정리된다.

[피해야 할 선택]
${whatToAvoid}

이 사주에서 고민을 망치는 건 마음이 급해졌을 때 기준을 흐리는 것이다. 정 때문에 봐주고, 말이 좋아서 믿고, 손해가 보여도 밀고 가는 선택이 약하다.

지금은 좋은 말보다 남는 결과를 봐야 한다. 돈이 남는지, 내 이름이 남는지, 관계가 편해지는지, 몸이 버티는지 봐라.

[내 고민 상담 마지막 판정]
${domain.final}

최종 판정은 이거다. 이 고민은 오래 생각한다고 풀리는 게 아니다. 기준을 하나로 좁히고, 그 기준에 맞으면 밀고, 안 맞으면 멈춰야 한다.`;
}


function buildV120WorryDeepReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const q = safeText(user.question, "").trim() || "지금 내가 이 선택을 해도 되는가";
  const type = getWorryQuestionTypeV120(q);
  const money = getMoneyProfile(manse);
  const career = getCareerArchetype(manse);
  const careerProfile = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const moneyDirection = getConcreteMoneyDirection(manse);
  return buildWorryDeepParagraphsV120({ name, q, type, money, career, careerProfile, health, relation, timing, moneyDirection });
}

function getWorryQuestionTypeV120(question: string) {
  const q = String(question || "");
  if (/결혼|혼인|배우자|남편|아내|재혼|동거|상견례|이혼|파혼/.test(q)) return "marriage";
  if (/연애|재회|썸|상대|남자친구|여자친구|헤어|이별|마음|고백|짝사랑|만나/.test(q)) return "love";
  if (/돈|재물|투자|사업자금|매출|수익|대출|빚|월급|소득|벌고|벌어/.test(q)) return "money";
  if (/직장|일|이직|퇴사|직업|회사|알바|창업|부업|사업|장사|커리어|무슨 일을|뭘 해야|뭐해먹고|먹고 살아/.test(q)) return "career";
  if (/건강|몸|아프|병원|잠|피로|소화|위|장|스트레스|불안|검진|운동|음식/.test(q)) return "health";
  if (/가족|부모|엄마|아빠|형제|자식|아이|자녀|집안/.test(q)) return "family";
  if (/동업|파트너|친구|지인|거래처|사람|인간관계/.test(q)) return "people";
  return "mixed";
}

function buildWorryDeepParagraphsV120(args: {
  name: string;
  q: string;
  type: string;
  money: ReturnType<typeof getMoneyProfile>;
  career: ReturnType<typeof getCareerArchetype>;
  careerProfile: ReturnType<typeof getCareerProfile>;
  health: ReturnType<typeof getHealthProfile>;
  relation: ReturnType<typeof getRelationshipProfile>;
  timing: ReturnType<typeof getMoneyTimingText>;
  moneyDirection: ReturnType<typeof getConcreteMoneyDirection>;
}) {
  const { name, q, type, money, career, careerProfile, health, relation, timing, moneyDirection } = args;
  const isCareer = type === "career";
  const isMoney = type === "money";
  const isLove = type === "love";
  const isMarriage = type === "marriage";
  const isHealth = type === "health";

  const direct = isCareer
    ? `| 답부터 말하면, 이 고민은 직업 이름 하나를 고르는 문제가 아니다. ${name}가 무엇으로 먹고살아야 하는지는 “오래 버틸 일”이 아니라 “돈과 이름이 남는 자리”로 봐야 한다.`
    : isMoney
      ? `| 답부터 말하면, 이 고민은 돈이 되느냐보다 남는 돈으로 바뀌느냐를 먼저 봐야 한다. 벌리는 판보다 받을 돈, 남는 돈, 다시 들어오는 돈이 핵심이다.`
      : isLove
        ? `| 답부터 말하면, 이 고민은 상대가 좋냐 싫으냐보다 이 관계가 너를 편하게 만드는지, 계속 불안하게 만드는지부터 봐야 한다.`
        : isMarriage
          ? `| 답부터 말하면, 이 고민은 마음 하나로 결정하면 안 된다. 같이 살아도 돈, 가족, 말투, 생활 리듬이 무너지지 않는지를 봐야 한다.`
          : isHealth
            ? `| 답부터 말하면, 이 고민은 병명을 맞히는 풀이가 아니다. 네 몸이 어디서 먼저 신호를 보내는지, 그 신호를 어떻게 끊을지를 봐야 한다.`
            : `| 답부터 말하면, 이 고민은 여러 문제가 섞여 보여도 먼저 막힌 축 하나를 좁혀야 풀린다. 돈인지, 일인지, 사람인지, 몸인지부터 잘라야 한다.`;

  const firstChoice = isCareer
    ? `지금 이 질문에서 제일 먼저 볼 건 “무슨 직업을 해야 하냐”가 아니다. 네가 일을 했을 때 돈이 남는지, 이름이 남는지, 다음 기회가 남는지다. 그냥 오래 다니는 직장, 그냥 바쁜 일, 그냥 남들이 보기 좋은 직업은 답이 아니다. 네 사주에서는 ${career.combined} 흐름이 먼저 잡히고, 그 안에서도 ${careerProfile.action.slice(0, 3).join(" · ")} 쪽에서 일이 살아난다.`
    : isMoney
      ? `지금 이 질문에서 제일 먼저 볼 건 “큰돈이 들어오냐”가 아니다. 돈이 들어와도 빠져나가는 구멍이 크면 재물운은 약하게 느껴진다. 네 재물 흐름은 ${money.type}으로 잡히고, ${money.core} 그래서 이 고민은 돈을 벌 방법보다 돈을 남기는 방식부터 봐야 한다.`
      : isLove || isMarriage
        ? `지금 이 질문에서 제일 먼저 볼 건 상대의 말이 아니다. 말은 뜨거워도 생활이 흐리면 나중에 외롭고, 표현은 서툴러도 행동이 반복되면 오래 간다. 네 인연 흐름은 ${relation.type} 쪽이라서, 끌림보다 반복 행동과 거리 조절을 먼저 봐야 한다.`
        : isHealth
          ? `지금 이 질문에서 제일 먼저 볼 건 무서운 병명 단정이 아니다. 네 건강 흐름은 ${health.type}으로 잡히고, ${health.risk} 이 사주는 몸이 바로 무너지는 쪽보다 신호를 보내다가 어느 순간 꺼지는 쪽으로 봐야 한다.`
          : `지금 이 질문에서 제일 먼저 볼 건 감정이 아니다. 네 사주에서는 돈은 ${money.type}, 일은 ${career.combined}, 몸은 ${health.type}, 사람은 ${relation.type} 흐름이 같이 보인다. 전부를 한꺼번에 말하면 듣기에는 그럴듯해도 답은 흐려진다.`;

  const sections = [
    {
      title: "도훈의 첫 판정",
      body: [
        `${name}, 네 질문은 이거다.\n\n“${q}”\n\n${direct}`,
        `이 질문은 좋은 말 몇 줄 듣고 넘길 문제가 아니다. 사주판에서 먼저 튀어나오는 건 운이 있냐 없냐가 아니라, 어디서 열리고 어디서 막히느냐다. 답이 짧게 나오면 틀어진다. 이 고민은 선택 하나가 돈, 일, 사람, 몸 중 어디를 건드리는지 같이 봐야 한다.`,
        firstChoice,
        `그래서 지금부터는 네 질문 밖으로 새지 않는다. 재물운이든 직업운이든 인연운이든 건강운이든, 전부 이 질문에 답하기 위한 근거로만 쓴다. 이 풀이의 중심은 “일반적인 운세”가 아니라 “지금 이 질문을 밀어도 되는가, 멈춰야 하는가, 기다려야 하는가”다.`,
        `최종 답을 먼저 깔면, 지금은 감정으로 확 밀 시기가 아니다. 대신 아예 멈추라는 뜻도 아니다. 조건을 확인하고 작게 증명한 뒤, 돈과 이름과 책임의 선이 보이면 밀고, 그 선이 흐리면 멈춰야 한다.`,
        `이 고민이 반복되는 이유는 네가 몰라서가 아니다. 머리로는 이미 뭔가 아닌 걸 알고 있는데, 현실에서는 돈·사람·책임·기회가 같이 엮이니까 단칼에 못 자르는 것이다. 그래서 사주풀이가 필요한 지점은 “좋다/나쁘다” 한 줄이 아니라, 어떤 조건에서 좋아지고 어떤 조건에서 망가지는지를 가르는 것이다.`,
      ],
    },
    {
      title: "이 질문에서 사주가 먼저 보는 자리",
      body: [
        `네 사주에서 먼저 보는 자리는 ${career.combined}이다. 이 말은 직업명을 하나 찍는다는 뜻이 아니다. 네가 어떤 환경에서 일을 해야 돈과 결과가 남는지를 보는 기준이다.`,
        `재물 쪽에서는 ${money.type} 흐름이 같이 보인다. ${money.core} 돈이 없다는 뜻이 아니라, 돈이 붙는 방식과 새는 방식이 분명히 갈린다는 뜻이다.`,
        `몸과 마음 쪽에서는 ${health.type} 흐름이 걸린다. ${health.risk} 이 고민을 밀어붙일 때 몸이 먼저 버티지 못하면 좋은 선택도 오래 못 간다.`,
        `사람 쪽에서는 ${relation.type} 흐름이 붙는다. ${relation.core} 그래서 이 질문에 사람이 끼어 있으면 말보다 반복 행동, 약속보다 실제 태도, 감정보다 책임을 봐야 한다.`,
        `결국 이 질문은 네 사주 전체에서 하나만 보는 게 아니다. 돈을 보면 일이 따라오고, 일을 보면 몸이 따라오고, 사람을 보면 돈과 마음이 같이 움직인다. 하지만 중심축은 하나로 좁혀야 한다. 지금 질문의 핵심은 ${isCareer ? "일과 직업" : isMoney ? "돈과 재물" : isLove ? "상대와 관계" : isMarriage ? "결혼과 생활" : isHealth ? "몸과 리듬" : "먼저 막힌 축"}이다.`,
        `이 중심축을 놓치면 풀이가 바로 엉뚱해진다. “뭐해먹고 살아야 하지”라고 물었는데 연애운이 길게 나오면 틀리고, 돈을 물었는데 성격만 길게 나오면 틀린다. 이 메뉴는 질문을 벗어나면 가치가 없다.`,
      ],
    },
    {
      title: "지금 밀고 가면 생기는 일",
      body: [
        isCareer
          ? `지금 바로 일을 크게 바꾸면 답답함은 줄어든다. 하지만 다음 자리에서 돈 받을 명목과 결과가 보이지 않으면 같은 고민이 다시 온다. 퇴사든 이직이든 창업이든, 지금 중요한 건 움직임 자체가 아니라 움직인 뒤 무엇이 남느냐다.`
          : isMoney
            ? `지금 바로 돈을 넣거나 크게 벌리면 속도는 난다. 하지만 받을 돈, 입금일, 내 몫, 빠지는 비용이 흐리면 매출보다 불안이 먼저 커진다. 이 돈은 크게 보이느냐보다 실제로 남느냐를 봐야 한다.`
            : isLove || isMarriage
              ? `지금 바로 밀어붙이면 관계는 빨리 움직일 수 있다. 하지만 상대의 반복 행동이 확인되지 않은 상태에서 속도만 올리면, 나중에는 네가 더 불안해지고 상대는 더 부담을 느낀다.`
              : isHealth
                ? `지금 몸을 무시하고 계속 밀면 당장은 버틴다. 그런데 이 사주는 버티는 힘이 있다고 끝까지 괜찮은 몸이 아니다. 잠, 소화, 피로, 목·어깨, 순환 중 약한 곳이 먼저 신호를 보낸다.`
                : `지금 급하게 밀면 답답함은 줄어든다. 하지만 막힌 축을 잘못 보면 돈 문제를 사람 문제로 풀고, 사람 문제를 일 문제로 풀면서 같은 고민이 반복된다.`,
        `밀고 가도 되는 조건은 분명하다. 숫자가 보여야 하고, 반복이 보여야 하고, 책임의 끝이 보여야 한다. 돈이면 받을 금액과 날짜, 일이면 내 역할과 결과, 사람이면 반복 행동, 건강이면 회복 리듬이 보여야 한다.`,
        `이 조건 없이 움직이면 처음엔 시원하다. 하지만 시간이 지나면 “내가 왜 또 이걸 하고 있지”라는 생각이 올라온다. 그게 이 고민의 무서운 지점이다. 선택 자체보다 선택 후에 남는 피로가 크다.`,
        `특히 네 사주는 책임이 커지는 판에서 쉽게 발을 빼지 못하는 쪽으로 흐르기 쉽다. 한 번 맡으면 끝까지 처리하려고 하니까, 시작 전에 책임 범위를 잘라야 한다. 시작한 뒤에 선을 긋겠다는 생각은 늦다.`,
        `그래서 지금 밀고 간다면 작게 밀어야 한다. 한 번에 전부 바꾸는 게 아니라 작은 계약, 작은 역할, 작은 금액, 짧은 기간으로 먼저 확인해야 한다. 작게 했을 때도 돈과 결과가 남으면 그때 키워도 늦지 않다.`,
        `판정은 이거다. 지금 바로 크게 밀면 위험하고, 작게 검증하면 살 길이 보인다. 속도보다 순서가 먼저다.`,
      ],
    },
    {
      title: "멈추거나 기다리면 보이는 것",
      body: [
        `기다린다는 건 가만히 있으라는 뜻이 아니다. 이 사주에서 기다림은 확인하는 시간이다. 말만 좋은지, 실제로 돈이 남는지, 상대가 반복 행동을 하는지, 몸이 버틸 수 있는지 보는 시간이다.`,
        `멈춰야 할 때는 신호가 있다. 말은 많은데 숫자가 없고, 기회는 커 보이는데 내 몫이 흐리고, 마음은 끌리는데 상대 행동이 반복되지 않고, 몸은 피곤한데 계속 참으라고만 하는 상황이다.`,
        `이때 멈추면 기회를 놓치는 것처럼 느껴진다. 그런데 사주상으로 보면 놓치는 게 아니라 손실을 막는 것이다. 네 운은 아무거나 빨리 잡을 때 커지는 운이 아니다. 맞는 것을 잡을 때 커진다.`,
        `기다리면 상대의 진짜 태도가 보이고, 일의 실제 돈이 보이고, 돈의 새는 구멍이 보이고, 몸의 한계가 보인다. 이 네 가지는 시간이 지나야 드러난다. 급할 때는 전부 좋아 보인다.`,
        `특히 앞으로 3개월은 확인의 시간이 강하다. 말보다 반복, 기대보다 숫자, 감정보다 몸의 반응을 봐야 한다. 이 기간에 보이는 반복이 앞으로 1년의 답을 만든다.`,
        `판정은 이거다. 기다림은 후퇴가 아니다. 조건을 확인하는 기다림이면 복이고, 겁나서 미루는 기다림이면 손해다. 둘을 갈라야 한다.`,
      ],
    },
    {
      title: "이 고민의 핵심 체크",
      body: [
        isCareer
          ? `이 고민의 핵심 체크는 직업명이 아니다. 네가 해야 할 일은 ${careerProfile.action.slice(0, 4).join(" · ")} 쪽으로 돈과 결과가 남는지 보는 것이다. 반대로 ${careerProfile.avoid.slice(0, 4).join(" · ")} 쪽이면 오래 해도 기운이 빠진다.`
          : isMoney
            ? `이 고민의 핵심 체크는 돈이 커 보이느냐가 아니다. ${moneyDirection.workAnswer} ${moneyDirection.earn} 그리고 받을 금액, 입금일, 내 몫, 책임 범위가 숫자로 보여야 한다.`
            : isLove || isMarriage
              ? `이 고민의 핵심 체크는 상대가 뭐라고 말했느냐가 아니다. ${relation.risk} 상대가 시간을 쓰는지, 약속을 지키는지, 불편한 말 앞에서 도망가지 않는지 봐야 한다.`
              : isHealth
                ? `이 고민의 핵심 체크는 ${health.action.join(" · ")}이다. 반대로 ${health.avoid.join(" · ")}은 지금 몸의 신호를 더 무겁게 만든다.`
                : `이 고민의 핵심 체크는 먼저 막힌 축 하나를 고르는 것이다. 돈이 먼저인지, 일이 먼저인지, 사람이 먼저인지, 몸이 먼저인지 좁혀야 한다.`,
        `두 번째 체크는 “내가 통제할 수 있느냐”다. 돈은 금액과 날짜를 통제할 수 있어야 하고, 일은 역할과 결과를 통제할 수 있어야 한다. 관계는 거리와 말투를 통제할 수 있어야 하고, 건강은 잠과 식사를 통제할 수 있어야 한다.`,
        `세 번째 체크는 “반복이 있느냐”다. 한 번 좋은 말, 한 번 큰 돈, 한 번 다정한 태도, 하루 컨디션 회복은 답이 아니다. 반복해서 들어오는 돈, 반복해서 남는 결과, 반복해서 편한 관계, 반복해서 회복되는 몸이 답이다.`,
        `네 번째 체크는 “피로가 어디서 생기느냐”다. 돈 때문에 피곤한지, 사람 때문에 피곤한지, 책임 때문에 피곤한지, 몸이 먼저 무너지는지 봐야 한다. 피로가 생기는 자리가 바로 이 고민의 약점이다.`,
        `다섯 번째 체크는 “내가 왜 아직 결론을 못 내렸느냐”다. 정보가 부족해서인지, 돈이 아까워서인지, 사람을 놓치기 싫어서인지, 실패가 무서워서인지 다르다. 이유가 다르면 답도 다르다.`,
        `이 다섯 가지를 통과하면 밀어도 된다. 하나라도 크게 흐리면 지금은 속도를 늦추고 조건을 다시 봐야 한다.`,
      ],
    },
    {
      title: "앞으로 3개월 조심할 것",
      body: [
        `앞으로 3개월은 결론보다 손실을 막는 시간이 먼저다. 이 시기에 큰돈, 큰 약속, 큰 고백, 큰 퇴사, 큰 투자처럼 한 번에 판을 바꾸는 선택은 조심해야 한다.`,
        `돈이 걸려 있으면 먼저 빠지는 비용을 봐야 한다. 보증금, 광고비, 재고, 교육비, 장비값, 지인에게 빌려주는 돈처럼 들어오기 전에 빠지는 돈은 신중해야 한다.`,
        `일이 걸려 있으면 역할이 늘어나는지 돈이 늘어나는지 봐야 한다. 책임만 커지고 이름과 돈이 안 남으면 이 3개월 안에 피로가 쌓인다.`,
        `사람이 걸려 있으면 말보다 반복 행동을 봐야 한다. 한 번 잘해주는 사람보다 꾸준히 시간을 쓰는 사람이 낫다. 반대로 급하게 가까워지고 급하게 약속하는 사람은 조심해야 한다.`,
        `건강이 걸려 있으면 잠과 식사를 먼저 봐야 한다. 공복 커피, 늦은 식사, 찬 음료, 몰아서 일하고 몰아서 쉬는 패턴은 이 고민을 더 무겁게 만든다.`,
        `3개월 판정은 이거다. 결론을 내기 전에 손실이 나는 자리를 먼저 막아라. 손실이 막히면 답이 보이고, 손실을 안 막으면 좋은 선택도 피곤해진다.`,
      ],
    },
    {
      title: "앞으로 1년 잡아야 할 것",
      body: [
        `앞으로 1년은 이 고민이 실제로 방향을 잡는 시간이다. 지금 당장 한 번의 선택으로 끝나는 문제가 아니라, 1년 안에 같은 고민이 반복되는지 줄어드는지를 봐야 한다.`,
        `돈은 ${timing.moneyMoveMonth}월에 움직이고, ${timing.moneyLeakMonth}월에 새기 쉽고, ${timing.moneyCatchMonth}월에 다시 잡을 문이 보인다. 이 달은 단순히 돈만 움직이는 달이 아니라, 일의 제안, 사람의 약속, 몸의 피로도 같이 움직이는 달이다.`,
        isCareer
          ? `일 문제라면 1년 안에 “이 일이 내 경력으로 남는가”를 확인해야 한다. 직함만 바뀌고 돈 받을 명목이 안 생기면 같은 고민이 반복된다. 반대로 권한, 단가, 결과가 붙으면 일이 커진다.`
          : isMoney
            ? `돈 문제라면 1년 안에 “반복해서 들어오는 돈”을 만들어야 한다. 한 번 들어오는 돈은 쓰면 끝나지만, 반복 수입은 돈그릇을 키운다. 네 재물운은 이 반복을 잡을 때 굵어진다.`
            : isLove || isMarriage
              ? `관계 문제라면 1년 안에 상대의 반복 행동이 답을 준다. 계속 말만 좋고 행동이 흐리면 정리해야 하고, 불편한 말도 피하지 않고 맞추려 한다면 더 깊게 봐도 된다.`
              : isHealth
                ? `건강 문제라면 1년 안에 생활 리듬을 다시 잡아야 한다. 잠, 식사, 걷기, 하체 순환, 목·어깨 풀기가 반복되면 몸이 산다. 한두 번 운동하고 끝내면 효과가 약하다.`
                : `혼합 문제라면 1년 안에 우선순위를 잡아야 한다. 돈부터 풀어야 하는지, 일을 바꿔야 하는지, 사람을 정리해야 하는지, 몸을 회복해야 하는지 하나를 먼저 잡아야 한다.`,
        `이 1년 안에 잡아야 할 건 거창한 성공이 아니다. 기준이다. 돈의 기준, 일의 기준, 사람의 기준, 몸의 기준이 생기면 이후 선택이 훨씬 쉬워진다.`,
        `판정은 이거다. 앞으로 1년은 결과를 완성하는 해가 아니라, 같은 고민이 반복되지 않게 기준을 세우는 해다. 이 기준이 생기면 다음 운이 들어왔을 때 바로 잡을 수 있다.`,
      ],
    },
    {
      title: "지금 해야 할 선택",
      body: [
        isCareer
          ? `지금 해야 할 선택은 직업명을 하나 고르는 게 아니다. 내가 돈을 받을 수 있는 역할, 내 이름이 남는 결과, 다음 기회로 이어지는 일을 고르는 것이다.`
          : isMoney
            ? `지금 해야 할 선택은 돈을 크게 벌리는 게 아니다. 받을 돈을 분명히 하고, 먼저 빠지는 돈을 줄이고, 반복해서 들어올 수 있는 돈을 만드는 것이다.`
            : isLove || isMarriage
              ? `지금 해야 할 선택은 상대를 붙잡느냐 버리느냐가 아니다. 상대가 반복해서 너를 편하게 만드는지, 계속 불안하게 만드는지를 확인하는 것이다.`
              : isHealth
                ? `지금 해야 할 선택은 겁먹는 게 아니다. 잠자는 시간, 식사 시간, 찬 음식과 야식, 몸을 풀어주는 운동부터 잡는 것이다.`
                : `지금 해야 할 선택은 문제를 하나로 좁히는 것이다. 오늘 결정할 것, 이번 달에 확인할 것, 3개월 안에 결론 낼 것을 나눠야 한다.`,
        `선택은 크게 하면 흔들린다. 작게 자르면 답이 보인다. 오늘 할 일 하나, 이번 주에 확인할 것 하나, 이번 달에 멈출 것 하나를 정해야 한다.`,
        `돈이 걸렸다면 숫자를 적어라. 일이 걸렸다면 역할과 결과를 적어라. 사람이 걸렸다면 상대의 반복 행동을 적어라. 건강이 걸렸다면 잠, 식사, 피로 신호를 적어라. 적지 않으면 머릿속에서만 돌고 답이 안 난다.`,
        `이 사주는 감으로 밀 때보다 확인하고 움직일 때 강하다. 확인이 끝난 뒤에는 오히려 빠르게 갈 수 있다. 다만 확인 전에는 급하게 결정하면 손해가 먼저 붙는다.`,
        `지금 해야 할 가장 현실적인 선택은 “작게 해보고 남는지 보는 것”이다. 돈이 남는지, 시간이 남는지, 사람이 남는지, 몸이 남는지 보면 답이 바로 나온다.`,
        `판정은 이거다. 지금은 인생 전체를 한 번에 바꾸는 선택이 아니라, 손실을 막고 복이 붙는 방향을 확인하는 선택을 해야 한다.`,
      ],
    },
    {
      title: "피해야 할 선택",
      body: [
        `피해야 할 첫 번째 선택은 감정으로 큰 결정을 하는 것이다. 답답하다고 바로 퇴사하고, 외롭다고 바로 관계를 확정하고, 불안하다고 큰돈을 넣고, 피곤하다고 몸의 신호를 무시하면 뒤가 피곤해진다.`,
        `두 번째는 말만 믿는 선택이다. 돈이 된다는 말, 잘해주겠다는 말, 같이 하자는 말, 괜찮다는 말보다 실제 조건을 봐야 한다. 사주에서 말은 복이 될 수도 있지만, 확인 없는 말은 새는 구멍이 된다.`,
        `세 번째는 내 몫이 흐린 선택이다. 내가 책임지고 남이 가져가는 일, 내가 돈을 넣고 남이 결정하는 일, 내가 기다리고 상대가 편한 관계는 오래 끌수록 손해다.`,
        `네 번째는 몸을 갈아 넣는 선택이다. 몸이 버텨야 돈도 벌고 관계도 유지된다. 잠과 식사를 망가뜨리면서 잡는 기회는 오래 가지 않는다.`,
        `다섯 번째는 “이번만 넘기자”는 선택이다. 이 말이 반복되면 같은 고민은 더 커진다. 이번만 넘기는 게 아니라 기준을 세워야 한다.`,
        `피해야 할 선택의 결론은 분명하다. 큰돈, 큰 책임, 큰 감정, 큰 약속은 조건이 보일 때만 잡아라. 조건이 흐리면 좋은 말이어도 지금은 멈춰야 한다.`,
      ],
    },
    {
      title: "내 고민 상담 마지막 판정",
      body: [
        `${name}, 이 질문은 짧게 끝낼 고민이 아니다. 네가 묻는 건 표면적으로는 “${q}”이지만, 사주상으로는 지금 선택이 돈·일·사람·몸 중 어디를 살리고 어디를 무너뜨리는지 보는 문제다.`,
        isCareer
          ? `최종 판정은 이거다. 너는 아무 일이나 오래 붙잡고 살 사주가 아니다. 밥벌이가 되는 자리와 돈이 굵어지는 자리를 따로 봐야 한다. 지금 일에서 이름과 돈이 남지 않으면 방향을 다시 잡아야 한다.`
          : isMoney
            ? `최종 판정은 이거다. 너는 돈을 못 버는 사주가 아니다. 다만 새는 구멍을 막지 않으면 큰돈도 작게 느껴진다. 돈 받을 명목, 반복 수입, 빠지는 비용을 잡을 때 재물운이 열린다.`
            : isLove || isMarriage
              ? `최종 판정은 이거다. 이 관계는 마음만 보면 답이 안 나온다. 상대의 반복 행동, 돈과 생활 기준, 갈등 후 회복 방식을 봐야 한다. 편해지면 잡고, 계속 불안하면 멈춰라.`
              : isHealth
                ? `최종 판정은 이거다. 이 건강 고민은 겁먹을 문제가 아니라 리듬을 바꿔야 풀린다. 잠, 식사, 운동, 회복 시간을 잡아야 한다. 증상이 오래가면 실제 검진을 받아야 한다.`
                : `최종 판정은 이거다. 이 고민은 여러 문제를 한꺼번에 들고 있어서 답이 흐려진다. 먼저 막힌 축 하나를 좁혀라. 그 하나가 잡히면 나머지도 풀린다.`,
        `지금 네가 잡아야 할 건 확신이 아니라 기준이다. 기준이 없으면 좋은 운도 손에 안 남고, 기준이 있으면 작은 기회도 돈과 결과로 바뀐다.`,
        `밀어야 할 때는 조건이 보인다. 멈춰야 할 때는 말만 많고 결과가 흐리다. 기다려야 할 때는 확인할 것이 남아 있다. 이 셋을 구분하는 게 이 고민의 답이다.`,
        `오늘 결론은 하나다. 지금 당장 크게 움직이지 말고, 조건을 확인한 뒤 작게 증명해라. 작게 했을 때 남으면 키우고, 작게 했는데도 새면 멈춰라. 그게 네 사주에 맞는 고민 해결 방식이다.`,
        `이 답은 좋은 말로 달래는 답이 아니다. 지금 네가 어떤 선택을 해야 손해가 줄고, 어떤 선택을 해야 복이 붙는지 가르는 판정이다.`,
      ],
    },
  ];

  sections.push(
    {
      title: "이 고민이 계속 반복되는 이유",
      body: [
        `이 고민이 반복되는 이유는 답이 없어서가 아니다. 답은 이미 어느 정도 보이는데, 그 답을 실행했을 때 잃을 것과 얻을 것이 같이 보이기 때문이다. 그래서 머리로는 움직이고 싶고, 속으로는 한 번 더 재고 있다.`,
        `네 사주는 무작정 저지르는 쪽보다 계산하고 움직이는 쪽이 강하다. 그래서 남들이 보기에는 결정이 늦어 보일 수 있다. 하지만 네 입장에서는 그게 단순한 망설임이 아니라 손해를 피하려는 본능이다.`,
        `문제는 오래 재기만 하면 운이 굳는다는 점이다. 계산은 필요하지만, 계산만 하고 아무것도 하지 않으면 기회가 지나간다. 그래서 이 고민은 크게 결론을 내기보다 작게 확인하는 단계가 반드시 필요하다.`,
        `같은 고민이 반복될 때는 대개 패턴이 있다. 처음에는 기대가 생기고, 그다음에는 불안이 생기고, 마지막에는 “내가 또 책임지는 거 아닌가” 하는 생각이 올라온다. 이 반복을 끊어야 한다.`,
        `이 반복을 끊는 방법은 감정 정리가 아니다. 조건 정리다. 돈이면 숫자, 일이면 역할, 사람이라면 반복 행동, 건강이라면 생활 리듬을 봐야 한다. 조건을 정리하면 감정도 따라 정리된다.`,
        `그래서 이 고민의 답은 “마음 편한 쪽으로 가라”가 아니다. 마음은 흔들릴 수 있다. 기준에 맞는 쪽으로 가야 한다. 기준이 맞으면 처음엔 불안해도 뒤가 편하고, 기준이 틀리면 처음엔 편해도 뒤가 무겁다.`,
      ],
    },
    {
      title: "현실에서 바로 확인해야 할 질문",
      body: [
        `첫 번째로 확인할 질문은 이것이다. 이 선택을 했을 때 내게 실제로 남는 것이 무엇인가. 돈이 남는지, 경력이 남는지, 사람이 남는지, 몸이 남는지 적어봐야 한다. 하나도 남지 않으면 그 선택은 복이 아니라 소모다.`,
        `두 번째 질문은 책임의 끝이다. 내가 어디까지 책임져야 하는지 모르는 선택은 시작하면 안 된다. 책임이 흐린 일은 시간이 갈수록 네 쪽으로 밀려온다. 시작 전에 책임 범위를 잘라야 한다.`,
        `세 번째 질문은 반복이다. 이 선택이 한 번으로 끝나는지, 반복해서 다시 들어오는지 봐야 한다. 반복 돈, 반복 주문, 반복 신뢰, 반복 회복이 있으면 커진다. 반복 피로만 있으면 줄여야 한다.`,
        `네 번째 질문은 상대의 태도다. 상대가 있는 고민이라면 말보다 행동이 반복되는지 봐야 한다. 급할 때만 찾는 사람, 좋을 때만 다정한 사람, 책임 앞에서 뒤로 빠지는 사람은 복이 아니다.`,
        `다섯 번째 질문은 몸이다. 이 선택을 생각했을 때 몸이 가벼워지는지 무거워지는지 봐야 한다. 사주에서 몸은 거짓말을 잘 안 한다. 머리는 합리화해도 몸은 먼저 신호를 보낸다.`,
        `이 다섯 질문에 답하면 결론이 훨씬 선명해진다. 지금 고민은 운이 없어서 막힌 게 아니라, 확인해야 할 조건을 아직 다 보지 못해서 흐린 것이다. 조건을 보면 답이 나온다.`,
      ],
    },
    {
      title: "돈·일·사람·몸으로 다시 갈라보면",
      body: [
        `돈으로 보면 이 고민은 받을 돈과 빠질 돈을 같이 봐야 한다. 들어오는 금액만 보고 움직이면 틀어진다. 먼저 빠지는 비용, 시간, 감정, 책임까지 계산해야 진짜 남는 돈이 보인다.`,
        `일로 보면 이 고민은 내가 한 만큼 결과가 남는 자리인지가 핵심이다. 네 사주는 바쁘기만 한 일에 오래 있으면 기운이 죽는다. 결과가 내 이름, 내 기술, 내 다음 기회로 이어져야 한다.`,
        `사람으로 보면 이 고민은 정 때문에 흐려질 수 있다. 미안해서 봐주고, 기대해서 믿고, 오래 알았다는 이유로 넘기면 손해가 커진다. 사람은 말보다 반복 행동으로 봐야 한다.`,
        `몸으로 보면 이 고민은 피로가 누적되는 방식까지 봐야 한다. 좋은 선택이라도 몸을 계속 갈아 넣어야 유지된다면 오래 못 간다. 잠, 식사, 회복 시간이 무너지면 운도 오래 못 끌고 간다.`,
        `네 사주에서는 이 네 축이 따로 놀지 않는다. 돈이 흔들리면 일이 흔들리고, 사람이 흔들리면 몸이 무겁고, 몸이 무너지면 좋은 기회도 버거워진다. 그래서 하나만 보고 결론 내리면 안 된다.`,
        `하지만 중심은 하나다. 질문이 일이라면 일에서 답을 내고, 돈이라면 돈에서 답을 내고, 사람이라면 사람에서 답을 내야 한다. 나머지는 근거로만 붙어야지, 답을 흐리면 안 된다.`,
      ],
    },
    {
      title: "시기별로 보면 어떻게 움직여야 하는가",
      body: [
        `지금부터 한 달은 결론보다 확인이다. 이 시기에는 말로 된 약속을 그대로 믿지 말고, 실제 숫자와 행동을 봐야 한다. 마음이 급하다고 바로 결정하면 나중에 빠져나오기 어렵다.`,
        `앞으로 3개월은 작게 시험하는 시간이다. 작은 돈, 작은 역할, 짧은 기간, 제한된 책임으로 먼저 해봐야 한다. 작게 했을 때도 남으면 키우고, 작게 했는데도 새면 멈춰야 한다.`,
        `6개월 전후에는 반복이 보인다. 처음만 좋았는지, 시간이 지나도 유지되는지 갈린다. 돈은 다시 들어오는지, 일은 다음 기회가 생기는지, 사람은 태도가 반복되는지, 몸은 회복되는지 봐야 한다.`,
        `1년 전후에는 방향을 정해야 한다. 계속 같은 고민을 한다면 그건 생각이 부족한 게 아니라 기준이 없는 것이다. 1년 안에는 잡을 것과 버릴 것을 분명히 갈라야 한다.`,
        `더 길게 보면 ${timing.firstMoneyAge}세 전후에는 돈과 일을 보는 눈이 달라지고, ${timing.strongMoneyAge}세 전후에는 돈과 일이 굵어지는 문이 열린다. 이 시기에 맞는 선택을 잡으면 작게 시작한 일이 크게 이어질 수 있다.`,
        `시기 판정은 이거다. 지금 바로 인생 전체를 뒤집지 마라. 한 달은 확인, 3개월은 시험, 6개월은 반복 확인, 1년은 방향 확정이다. 이 순서대로 가야 덜 다치고 더 크게 간다.`,
      ],
    },
    {
      title: "도훈의 마지막 압축 판정",
      body: [
        `이 고민을 한 줄로 자르면, 지금은 크게 지르는 때가 아니라 작게 증명하는 때다. 증명 없이 밀면 불안이 커지고, 증명한 뒤 키우면 복이 붙는다.`,
        `너는 답을 모르는 사람이 아니다. 다만 답을 실행했을 때 책임과 손해가 같이 보이니까 멈칫하는 것이다. 그 멈칫함을 없애려면 확신을 기다리면 안 된다. 조건을 확인해야 한다.`,
        `돈은 받을 명목이 보이면 잡고, 흐리면 멈춰라. 일은 이름과 결과가 남으면 잡고, 책임만 남으면 멈춰라. 사람은 반복 행동이 있으면 보고, 말만 좋으면 멈춰라. 몸은 회복 리듬이 잡히면 밀고, 계속 무너지면 멈춰라.`,
        `이 네 가지가 이번 고민의 기준이다. 이 기준에 맞으면 지금보다 더 크게 가도 된다. 기준에 안 맞으면 아무리 좋아 보여도 나중에 다시 같은 질문으로 돌아온다.`,
        `그래서 결론은 이거다. 지금 고민은 운이 없어서 생긴 게 아니다. 운을 어디에 써야 할지 아직 덜 좁혀져서 생긴 고민이다. 좁히면 열린다. 흐리면 또 돈, 사람, 몸이 같이 샌다.`,
        `마지막 판정은 분명하다. 지금은 무조건 밀 때도 아니고, 겁먹고 접을 때도 아니다. 조건을 보이면 작게 시작하고, 조건이 안 보이면 멈춰라. 그게 이 질문에 대한 사주상 답이다.`,
      ],
    },
  );

  const rendered = sections
    .map((section) => `[${section.title}]\n${section.body.join("\n\n")}`)
    .join("\n\n");

  return rendered;
}


function buildWorryPreviewCounselTextV122(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const q = safeText(user.question, "").trim() || "지금 이 고민을 어떻게 봐야 하는가";
  const type = getWorryQuestionTypeV120(q);
  const career = getCareerArchetype(manse);
  const money = getMoneyProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);

  const hidden = getWorryCounselHiddenMeaningV122(type, q);
  const axis = getWorryCounselAxisV122(type);

  return cleanGeneratedText(`[도훈이 질문을 받아든다]
도훈이 네 질문을 한참 들여다본다.

“${q}”

이 질문은 그냥 ${axis.short} 하나만 묻는 말이 아니다.
이 안에는 ${hidden}이 같이 걸려 있다.

도훈이 사주판 위에 네 질문을 올린다.

지금부터 봐야 할 건 하나다.
이 고민이 단순한 기분인지,
아니면 네 인생 흐름에서 반복되는 문제인지.

[무료에서 여기까지만 보여준다]
무료에서는 답을 길게 풀지 않는다.
도훈이 질문을 사주판에 올리고, 이 질문이 어디에 걸린 고민인지까지만 보여준다.

네 사주에서 일은 ${career.combined}, 돈은 ${money.type}, 사람은 ${relation.type}, 몸은 ${health.type} 흐름이 같이 보인다.
하지만 유료에서는 이 네 가지를 전부 나열하지 않는다.
네 질문에 필요한 것만 끌어와 답을 자른다.

[유료에서 열리는 것]
유료에서는 이 질문 하나를 기준으로 재물운, 일운, 인연운, 건강운, 대운, 평생 흐름 중 필요한 것만 가져와서 20,000자 이상으로 끝까지 판다.
모든 질문에 같은 목차를 붙이지 않는다.
마지막은 도훈의 판정으로 끝난다.

| 이 질문은 그냥 고민이 아니다. 네 선택이 앞으로 어디로 이어질지 보는 상담이다.`);
}

function getWorryCounselHiddenMeaningV122(type: string, q: string) {
  if (type === "career") return "밥벌이, 돈, 자존심, 미래 불안, 내가 어떤 판에서 살아나는지";
  if (type === "money") return "돈이 남는 구조, 새는 돈, 책임, 투자 위험, 앞으로 돈그릇이 커지는 방식";
  if (type === "love") return "상대 마음, 내 불안, 다시 이어질 가능성, 반복될 문제, 붙잡을지 놓을지";
  if (type === "marriage") return "사랑, 생활비, 가족 거리, 책임, 결혼 뒤에 터질 문제와 살 길";
  if (type === "health") return "몸이 보내는 신호, 피로 리듬, 생활 습관, 실제 검진이 필요한 경계";
  if (type === "family") return "가족 책임, 거리감, 돈과 정, 내가 떠안는 몫, 끊어야 할 선";
  if (type === "people") return "사람을 믿어도 되는지, 관계에서 내 몫이 흐려지는지, 같이 가면 복이 붙는지";
  return "돈, 일, 사람, 몸 중 어디가 먼저 막혔는지와 지금 선택의 손익";
}

function getWorryCounselAxisV122(type: string) {
  if (type === "career") return { short: "직업", center: "평생 밥벌이", verdict: "크게 던지기 전에 작은 돈길부터 검증해야 한다" };
  if (type === "money") return { short: "돈", center: "돈길 선택", verdict: "써도 되는 돈과 막아야 할 돈을 갈라야 한다" };
  if (type === "love") return { short: "연애", center: "인연의 지속성", verdict: "붙잡되 매달리면 안 되고, 확인하되 떠보면 안 된다" };
  if (type === "marriage") return { short: "결혼", center: "생활 인연", verdict: "마음보다 생활 기준과 책임 구조를 먼저 확인해야 한다" };
  if (type === "health") return { short: "건강", center: "몸의 경고", verdict: "겁먹을 일이 아니라 리듬을 바꿔야 할 신호다" };
  if (type === "family") return { short: "가족", center: "가족 거리와 책임", verdict: "도와주는 것과 떠안는 것을 갈라야 한다" };
  if (type === "people") return { short: "사람", center: "관계의 손익", verdict: "말보다 반복 행동과 책임을 보고 결정해야 한다" };
  return { short: "선택", center: "혼합 고민", verdict: "먼저 막힌 축 하나를 좁힌 뒤 움직여야 한다" };
}

function buildWorryCounselSectionPlanV122(type: string) {
  if (type === "career") {
    return [
      "도훈의 첫 판정",
      "이 질문의 진짜 뜻",
      "네 사주에서 밥벌이가 생기는 자리",
      "회사 안에서 살아나는 일",
      "회사 밖에서 살아나는 일",
      "사업을 한다면 어떤 판인가",
      "피해야 할 직업과 돈길",
      "돈그릇이 커지는 방식",
      "대운에서 일이 바뀌는 흐름",
      "지금 작게 검증해야 할 방향",
      "도훈의 마지막 판정",
    ];
  }
  if (type === "money") {
    return [
      "도훈의 첫 판정",
      "이 돈은 남는 돈인가 새는 돈인가",
      "네 사주에서 돈이 붙는 방식",
      "이 선택이 돈그릇을 키우는가",
      "지금 돈을 쓰면 따라오는 책임",
      "기다리면 보이는 돈의 흐름",
      "평생 재물운에서 이 선택의 자리",
      "피해야 할 돈길",
      "잡아도 되는 돈길",
      "지금 해야 할 현실 계산",
      "도훈의 마지막 판정",
    ];
  }
  if (type === "love") {
    return [
      "도훈의 첫 판정",
      "이 질문의 진짜 뜻",
      "너는 왜 이 사람에게 걸리는가",
      "상대는 어떤 방식으로 마음을 여는가",
      "두 사람은 어디서 끌리는가",
      "두 사람은 어디서 어긋나는가",
      "속궁합과 정서궁합",
      "결혼까지 가면 좋아지는 부분",
      "결혼까지 가면 터지는 부분",
      "붙잡아야 하는지 거리를 둬야 하는지",
      "도훈의 마지막 판정",
    ];
  }
  if (type === "marriage") {
    return [
      "도훈의 첫 판정",
      "이 결혼 고민의 진짜 뜻",
      "마음보다 먼저 봐야 할 생활 기준",
      "돈과 가족 거리에서 터지는 자리",
      "결혼하면 좋아지는 지점",
      "결혼하면 무거워지는 지점",
      "상대와 맞춰야 할 책임 구조",
      "평생 인연으로 볼 수 있는가",
      "서두르면 깨지는 이유",
      "결혼으로 가려면 잡아야 할 조건",
      "도훈의 마지막 판정",
    ];
  }
  if (type === "health") {
    return [
      "도훈의 첫 판정",
      "이 질문에서 몸이 보내는 신호",
      "네 사주상 약해지는 건강 리듬",
      "평생 건강 고비",
      "올해 몸이 흔들리는 시기",
      "음식으로 지켜야 할 것",
      "줄여야 할 음식",
      "생활 리듬으로 지켜야 할 것",
      "운동으로 지켜야 할 것",
      "검진이 필요한 신호",
      "도훈의 마지막 판정",
    ];
  }
  if (type === "family") {
    return [
      "도훈의 첫 판정",
      "이 가족 고민의 진짜 뜻",
      "정 때문에 떠안는 자리",
      "돈과 책임이 섞이는 장면",
      "가족에게 해도 되는 몫",
      "가족에게 하면 안 되는 몫",
      "선을 그어야 복이 사는 이유",
      "앞으로 반복될 수 있는 문제",
      "현실적으로 잡아야 할 거리",
      "내 삶을 지키는 선택",
      "도훈의 마지막 판정",
    ];
  }
  if (type === "people") {
    return [
      "도훈의 첫 판정",
      "이 사람 문제의 진짜 뜻",
      "말보다 행동을 봐야 하는 이유",
      "같이 가면 복이 붙는 사람",
      "같이 가면 운이 새는 사람",
      "돈과 책임이 흐려지는 장면",
      "동업이나 협업이면 반드시 볼 기준",
      "끊어야 할 말과 남겨야 할 말",
      "앞으로 관계가 깊어지는 조건",
      "지금 잡아야 할 거리",
      "도훈의 마지막 판정",
    ];
  }
  return [
    "도훈의 첫 판정",
    "이 질문의 진짜 뜻",
    "먼저 막힌 축은 무엇인가",
    "돈으로 보면 어디서 새는가",
    "일로 보면 어디서 막히는가",
    "사람으로 보면 무엇을 확인해야 하는가",
    "몸으로 보면 어떤 신호가 있는가",
    "지금 밀면 생기는 일",
    "기다리면 보이는 것",
    "지금 하나로 좁혀야 할 선택",
    "도훈의 마지막 판정",
  ];
}

function buildWorryCounselSectionBodyV122(params: {
  title: string;
  index: number;
  name: string;
  q: string;
  type: string;
  axis: ReturnType<typeof getWorryCounselAxisV122>;
  career: ReturnType<typeof getCareerArchetype>;
  careerProfile: ReturnType<typeof getCareerProfile>;
  money: ReturnType<typeof getMoneyProfile>;
  health: ReturnType<typeof getHealthProfile>;
  relation: ReturnType<typeof getRelationshipProfile>;
  timing: ReturnType<typeof getMoneyTimingText>;
  moneyDirection: ReturnType<typeof getConcreteMoneyDirection>;
}) {
  const { title, index, name, q, type, axis, career, careerProfile, money, health, relation, timing, moneyDirection } = params;
  const first = index === 0;
  const last = title.includes("마지막 판정");
  const relationLine = type === "love" || type === "marriage" || type === "people" ? `사람 쪽 흐름은 ${relation.type}으로 본다. ${relation.core} 그래서 이 질문에서는 말보다 반복 행동, 감정보다 책임, 끌림보다 편안함을 먼저 봐야 한다.` : `사람 문제는 보조로만 본다. 이 질문의 중심이 사람이 아니면 인연운을 길게 펼치지 말고, 사람 때문에 돈·일·몸이 흔들리는 지점만 본다.`;
  const moneyLine = type === "money" || type === "career" ? `돈 쪽 흐름은 ${money.type}이다. ${money.core} 여기서 중요한 건 돈이 들어오는지보다 들어온 돈이 남는 구조로 바뀌는지다.` : `돈은 이 고민의 중심이 아닐 수 있다. 그래도 돈이 끼어 있다면 받을 돈, 빠질 돈, 책임질 돈을 갈라야 한다. 돈 기준이 흐리면 좋은 선택도 피곤해진다.`;
  const careerLine = type === "career" ? `일 쪽 큰 판정은 ${career.combined}이다. 이 판정은 직업명 하나가 아니라, 네가 어떤 자리에서 돈과 이름을 남기는지를 보는 기준이다. ${careerProfile.action.slice(0, 3).join(" · ")} 쪽은 살리고, ${careerProfile.avoid.slice(0, 3).join(" · ")} 쪽은 줄여야 한다.` : `일은 보조 근거로 본다. 이 고민이 직업 질문이 아니더라도 일이 흔들리면 돈과 몸이 같이 흔들릴 수 있다. 그래서 역할, 책임, 결과가 남는지를 짧게 확인해야 한다.`;
  const healthLine = type === "health" ? `몸 쪽 흐름은 ${health.type}이다. ${health.risk} 이 풀이는 병명을 맞히는 것이 아니라, 사주상 몸이 무너지기 전에 보내는 신호와 생활 리듬을 보는 것이다.` : `몸은 이 고민의 마지막 안전장치다. 아무리 돈이 되고 관계가 좋아 보여도 잠, 소화, 피로, 순환이 무너지면 오래 못 간다. 몸이 계속 무거우면 그 선택은 다시 봐야 한다.`;

  if (first) {
    return [
      `${name}, 네 질문은 이거다.\n\n“${q}”\n\n답부터 말하면, 이 질문은 ${axis.center} 문제다. ${axis.verdict}.`,
      `이 메뉴는 평생종합사주가 아니다. 재물운, 일운, 인연운, 건강운, 대운을 전부 나열하는 메뉴도 아니다. 네 질문 하나를 사주 전체 위에 올려놓고, 그 고민을 풀기 위해 필요한 것만 끌어오는 상담이다.`,
      `그래서 여기서 답은 짧게 끝나면 안 된다. “된다/안 된다”만 말하면 구매자는 막다른 골목에 선다. 도훈의 판정은 선명해야 하지만, 동시에 앞으로 갈 길을 열어줘야 한다.`,
      `이 질문이 무서운 이유는 선택 하나에 돈, 일, 사람, 몸이 같이 걸릴 수 있기 때문이다. 한쪽만 보면 답이 빨라 보이지만, 실제 인생에서는 한쪽이 무너지면 다른 쪽도 같이 흔들린다.`,
      `오늘 판정의 방식은 이렇다. 먼저 이 질문의 숨은 뜻을 자르고, 사주에서 어떤 축이 반응하는지 보고, 지금 밀면 생기는 일과 멈추면 보이는 것을 가른다. 마지막은 반드시 도훈의 판정으로 끝낸다.`,
      `| 이 고민은 많은 운을 보는 게 아니라, 네 질문 하나에 필요한 운만 끌어와 답을 자르는 상담이다.`,
    ];
  }

  if (last) {
    const typeFinal = type === "career"
      ? `최종 판정은 이거다. 이 고민은 접을 고민이 아니다. 다만 지금 크게 던질 고민도 아니다. 너는 시키는 일만 하다 끝날 사람이 아니다. 하지만 네 판은 한 번에 여는 게 아니라, 작게 열어서 키워야 산다.`
      : type === "money"
        ? `최종 판정은 이거다. 이 돈은 무조건 막을 돈은 아니다. 하지만 감정으로 쓰면 새는 돈이다. 써도 된다. 단, 남는 구조가 보일 때만 써라.`
        : type === "love"
          ? `최종 판정은 이거다. 이 관계는 바로 끊을 인연은 아니다. 하지만 네가 혼자 밀고 가면 오래 못 간다. 붙잡되 매달리지는 말고, 확인하되 떠보지는 마라.`
          : type === "marriage"
            ? `최종 판정은 이거다. 결혼은 마음만으로 밀면 안 된다. 생활비, 가족 거리, 책임 구조, 갈등 후 회복 방식이 맞으면 길이 열리고, 이 기준이 흐리면 결혼 뒤에 외로움이 커진다.`
            : type === "health"
              ? `최종 판정은 이거다. 겁먹을 문제가 아니라 리듬을 바꿔야 할 신호다. 다만 통증이나 증상이 오래가면 운세로 넘기지 말고 실제 검진을 받아야 한다.`
              : type === "family"
                ? `최종 판정은 이거다. 가족을 버리라는 뜻이 아니다. 하지만 도와주는 것과 떠안는 것을 갈라야 네 삶도 살고 가족 문제도 덜 꼬인다.`
                : type === "people"
                  ? `최종 판정은 이거다. 이 사람은 말보다 책임을 보고 판단해야 한다. 반복 행동이 있으면 남기고, 말만 좋고 몫이 흐리면 거리를 둬라.`
                  : `최종 판정은 이거다. 이 고민은 한꺼번에 풀면 더 꼬인다. 먼저 막힌 축 하나를 좁히고, 그 축이 풀리는 방향으로 작게 움직여라.`;
    return [
      `${name}, 도훈의 마지막 판정은 이렇다.`,
      typeFinal,
      `왜 그렇게 보느냐. 네 사주에서 일은 ${career.combined}, 돈은 ${money.type}, 사람은 ${relation.type}, 몸은 ${health.type} 흐름으로 잡힌다. 이 네 가지가 모두 중요하지만, 이 질문에서는 ${axis.center}이 중심이다. 중심을 벗어나면 답이 흐려진다.`,
      `지금 하면 안 되는 선택은 크고 흐린 선택이다. 큰돈, 큰 약속, 큰 책임, 큰 감정은 조건이 보일 때만 잡아야 한다. 조건이 안 보이는데 마음만 앞서면 복보다 부담이 먼저 붙는다.`,
      `지금 해야 하는 선택은 작게 검증하는 것이다. 돈이면 남는 구조를 확인하고, 일이면 내 이름과 결과가 남는지 보고, 사람이면 반복 행동을 보고, 몸이면 회복 리듬을 먼저 잡아야 한다.`,
      `앞으로 열리는 길은 분명하다. 기준을 세우면 이 고민은 불안이 아니라 방향이 된다. 기준 없이 밀면 같은 고민으로 돌아오고, 기준을 잡고 작게 증명하면 길이 열린다.`,
      `도훈이 마지막으로 보는 길은 하나다. 지금은 무조건 밀 때도 아니고, 겁먹고 접을 때도 아니다. 조건이 보이면 작게 시작하고, 조건이 안 보이면 멈춰라. 그게 네 질문에 대한 사주상 답이다.`,
      `| 판정은 선명하게 간다. 크게 지르지 말고, 작게 증명해라. 증명되면 키우고, 새면 멈춰라.`,
    ];
  }

  return [
    `[${title}]에서 먼저 자를 건 질문의 중심이다. 지금 질문은 “${q}”이지만, 겉으로 보이는 말보다 속에 걸린 불안이 더 크다. 도훈은 이 고민을 ${axis.center}으로 본다.`,
    `${careerLine}`,
    `${moneyLine}`,
    `${relationLine}`,
    `${healthLine}`,
    `이 장면에서 중요한 건 많은 설명이 아니다. 질문과 상관없는 운세를 억지로 섞으면 풀이가 흐려진다. 지금 필요한 건 이 고민을 풀기 위한 근거다. 그래서 재물, 일, 사람, 몸은 모두 ${axis.center}에 답하기 위한 재료로만 쓴다.`,
    `현실 장면으로 보면, 지금 네가 조심해야 할 건 기준이 흐린 선택이다. 누가 좋다고 해서 움직이는 것, 마음이 급해서 먼저 약속하는 것, 책임 범위를 모른 채 시작하는 것, 몸이 무거운데 계속 버티는 것은 전부 같은 뿌리다.`,
    `반대로 살 길은 분명하다. 먼저 작게 보고, 숫자로 확인하고, 반복 행동을 보고, 몸이 버틸 리듬을 만든 뒤 키우는 것이다. 이 순서가 맞으면 지금 고민은 길이 되고, 이 순서가 틀리면 다시 부담이 된다.`,
    `시기상으로는 ${timing.moneyMoveMonth}월 전후에 움직임이 보이고, ${timing.moneyLeakMonth}월 전후에는 새는 선택을 조심해야 한다. ${timing.moneyCatchMonth}월 전후에는 놓친 흐름을 다시 잡는 문이 보인다. 이 달들은 돈만이 아니라 약속, 역할, 사람, 몸의 리듬까지 같이 흔든다.`,
    `이 대목의 판정은 이렇다. ${axis.verdict}. 단, 그 판정은 문을 닫는 말이 아니다. 조건을 만들면 길이 열리고, 조건 없이 움직이면 같은 고민이 반복된다는 뜻이다.`,
  ];
}

function buildV122WorryCounselReport(user: UserInfo, manse: any) {
  const name = safeText(user.name, "너");
  const q = safeText(user.question, "").trim() || "지금 내가 이 선택을 해도 되는가";
  const type = getWorryQuestionTypeV120(q);
  const axis = getWorryCounselAxisV122(type);
  const career = getCareerArchetype(manse);
  const careerProfile = getCareerProfile(manse);
  const money = getMoneyProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);
  const timing = getMoneyTimingText(user, manse);
  const moneyDirection = getConcreteMoneyDirection(manse);
  const plan = buildWorryCounselSectionPlanV122(type);

  const sections = plan.map((title, index) => ({
    title,
    body: buildWorryCounselSectionBodyV122({ title, index, name, q, type, axis, career, careerProfile, money, health, relation, timing, moneyDirection }),
  }));

  let rendered = sections
    .map((section) => `[${section.title}]\n${section.body.join("\n\n")}`)
    .join("\n\n");

  const depthBlocks = [
    `[질문을 벗어나지 않는 보강 풀이]\n이 보강 풀이는 다른 카테고리를 억지로 붙이는 것이 아니다. 네 질문이 ${axis.center}에 걸려 있기 때문에, 그 질문을 더 선명하게 자르기 위한 보강이다. 돈을 말하더라도 돈운 전체가 아니라 이 고민에서 돈이 남는지 보는 것이고, 일을 말하더라도 직업운 전체가 아니라 이 선택 뒤에 이름과 결과가 남는지 보는 것이다. 사람을 말하더라도 연애운 전체가 아니라 이 관계가 너를 살리는지 눌러버리는지 보는 것이고, 몸을 말하더라도 병명 맞히기가 아니라 이 선택을 몸이 받을 수 있는지 보는 것이다.`,
    `[도훈이 다시 보는 현실 조건]\n첫째, 이 선택을 했을 때 실제로 남는 것이 있어야 한다. 돈이면 순이익, 일이면 경력과 결과, 관계면 반복 행동, 건강이면 회복 리듬이다. 둘째, 책임의 끝이 보여야 한다. 어디까지 내가 맡고 어디서 멈추는지 모르는 선택은 시작하면 안 된다. 셋째, 반복이 있어야 한다. 한 번 뜨겁고 끝나는 선택보다 작아도 다시 들어오는 선택이 복이 된다.`,
    `[이 고민에서 가장 위험한 착각]\n가장 위험한 착각은 좋은 말이 곧 좋은 운이라고 믿는 것이다. 사주에서 좋은 운은 말이 달콤한 쪽이 아니라 실제로 남는 것이 있는 쪽으로 온다. 처음엔 조금 답답해도 기준이 선명하면 뒤가 편하고, 처음엔 시원해도 기준이 흐리면 뒤가 무겁다. 그래서 지금은 감정의 크기보다 조건의 선명함을 봐야 한다.`,
    `[작게 검증한다는 말의 진짜 뜻]\n작게 검증한다는 건 소극적으로 살라는 뜻이 아니다. 오히려 크게 가기 위해 먼저 길을 확인하라는 뜻이다. 작은 금액, 짧은 기간, 제한된 역할, 분명한 약속, 확인 가능한 결과로 먼저 해봐야 한다. 작게 해도 남으면 키우고, 작게 해도 새면 그 길은 큰돈과 큰 책임을 넣을수록 더 많이 샌다.`,
    `[앞으로 길이 열리는 방식]\n길은 갑자기 열리지 않는다. 먼저 기준이 생기고, 그 기준에 맞는 작은 선택이 반복되고, 그 반복이 신뢰가 되고, 신뢰가 돈이나 관계나 몸의 안정으로 바뀐다. 지금 네 고민은 막힌 것이 아니라 아직 좁혀지지 않은 상태다. 좁히면 길이 보이고, 흐리면 같은 고민이 다시 온다.`,
    `[최종 판정을 더 선명하게 자르면]\n지금 당장 모든 것을 결정하지 마라. 하지만 계속 미루지도 마라. 오늘은 기준을 세우고, 이번 주에는 작은 확인을 하고, 이번 달에는 새는 선택을 막아라. 그다음 남는 것이 있으면 키우고, 남는 것이 없으면 멈춰라. 이 순서가 네 사주에 맞는 상담의 결론이다.`,
  ];

  let guard = 0;
  while (rendered.length < 20500 && guard < 10) {
    rendered += `\n\n${depthBlocks[guard % depthBlocks.length]}`;
    guard += 1;
  }

  return cleanGeneratedText(rendered);
}

function needsWorryExpansionV120(text: string) {
  const cleaned = String(text || "").trim();
  if (cleaned.length < 20000) return true;
  const weakPhrases = [
    "가능성은 있다",
    "명확한 방향이 필요",
    "작은 일부터 시작",
    "점차 알게 될",
    "좋겠어",
    "중요해",
    "할 수 있어",
    "할 수 있다",
  ];
  if (weakPhrases.some((phrase) => cleaned.includes(phrase))) return true;
  const sectionCount = (cleaned.match(/^\[[^\]]+\]/gm) || []).length;
  if (sectionCount < 10) return true;
  return false;
}

function finalizeWorryFullTextV120(raw: string, user: UserInfo, manse: any) {
  const cleanedRaw = cleanGeneratedText(raw || "");
  const question = safeText(user.question, "").trim();
  const fallback = cleanGeneratedText(buildV122WorryCounselReport(user, manse));
  if (!question) return fallback;
  if (needsWorryExpansionV120(cleanedRaw)) return fallback;
  return cleanedRaw;
}

function finalizePreviewText(params: {
  raw: string;
  categoryId: CategoryId;
  categoryTitle: string;
  user: UserInfo;
  manse: any;
  partnerManse?: any | null;
}) {
  const title = params.categoryTitle || "";

  if (isWorryCategoryV112(params.categoryId, title)) {
    const raw = cleanGeneratedText(params.raw || "").trim();
    return raw || buildWorryPreviewCounselTextV122(params.user, params.manse);
  }

  // 재물운 무료는 계산형 숫자 공개 funnel을 그대로 사용한다.
  if (params.categoryId === "money" || title.includes("재물") || title.includes("돈")) {
    return cleanGeneratedText(buildV92MoneyPreviewReport(params.user, params.manse));
  }

  // 건강운은 기존 무료 전용 파이프라인/구조를 건드리지 않는다.
  if (params.categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return cleanGeneratedText(params.raw || "");
  }

  // V193: 연애/결혼/궁합을 포함한 모든 비건강 무료 결과에서
  // 예전 고정 3문단 텍스트를 강제로 덮어쓰지 않는다.
  return cleanGeneratedText(params.raw || "");
}

function isValidMoneyPaidAITextV192(text: string) {
  const cleaned = cleanGeneratedText(text || "").trim();
  if (cleaned.length < 6500) return false;

  const requiredSignals = [
    "PART 01",
    "PART 02",
    "PART 03",
    "PART 04",
    "PART 05",
    "PART 06",
    "PART 07",
    "PART 08",
  ];
  if (requiredSignals.some((signal) => !cleaned.includes(signal))) return false;

  const forbidden = [
    "무료와 유료",
    "공통 재물판정",
    "고정 판정",
    "서버 계산값",
    "절대 변경",
    "연결 규칙",
    "이 리포트에서 기준 금액",
  ];
  if (forbidden.some((phrase) => cleaned.includes(phrase))) return false;

  return true;
}

function finalizeMoneyPaidTextV192(raw: string, user: UserInfo, manse: any) {
  const cleaned = cleanGeneratedText(raw || "").trim();
  if (isValidMoneyPaidAITextV192(cleaned)) return cleaned;

  // AI 실패 때만 고정 계산형 안전본문을 사용한다.
  // 정상 AI 응답을 이 fallback으로 덮어쓰지 않는다.
  return cleanGeneratedText(buildV92MoneyFullReport(user, manse));
}

function dedupeWholeReportV200(value: string) {
  const text = cleanGeneratedText(value || "").trim();
  if (!text) return text;
  const firstHeading = text.match(/\[[^\]\n]+\]/)?.[0];
  if (!firstHeading) return text;
  const second = text.indexOf(firstHeading, text.indexOf(firstHeading) + firstHeading.length);
  if (second > Math.max(800, Math.floor(text.length * 0.35))) {
    const first = text.slice(0, second).trim(), rest = text.slice(second).trim();
    if (rest.startsWith(firstHeading) && rest.length >= first.length * 0.75) return first;
  }
  return text;
}

function finalizeFullText(params: {
  raw: string;
  categoryId: CategoryId;
  categoryTitle: string;
  user: UserInfo;
  manse: any;
  partnerManse?: any | null;
}) {
  const title = params.categoryTitle || "";

  // v150: 내 고민 상담은 예전 코드 강제본문으로 교체하면 안 된다.
  // 접수지에서 받은 한 고민만 GPT가 답해야 하는데, finalizeWorryFullTextV120이
  // 질문 안의 단어를 다시 분류하면서 이사 질문을 연애/궁합 템플릿으로 덮어쓰는 문제가 있었다.
  // 따라서 내 고민 상담은 raw AI 본문을 그대로 정리해서 반환하고, raw가 비었을 때만 짧은 실패문을 반환한다.
  if (isWorryCategoryV112(params.categoryId, title)) {
    const cleanedRaw = dedupeWholeReportV200(params.raw || "").trim();
    if (cleanedRaw) return cleanedRaw;
    return `[도훈의 첫 판정]
유료 상담 본문 생성이 비어 있다. 예전 고정본문으로 대신 채우지 않는다.

[도훈의 마지막 판정]
다시 생성해야 한다.`;
  }

  if (params.categoryId === "money" || title.includes("재물")) {
    return finalizeMoneyPaidTextV192(params.raw, params.user, params.manse);
  }

  if (isCareerCategory(params.categoryId, title) || title.includes("일·사업")) {
    return cleanGeneratedText(buildStrongCareerFullReport(params.user, params.manse));
  }

  if (isMonthlyCategory(params.categoryId, title)) {
    const yearFallback = buildYearFullReportV202({
      user: params.user,
      manse: params.manse,
      fortuneSeed: hashToSeed(stableStringify({ user: params.user, manse: params.manse, categoryId: params.categoryId, logic: "year-final-v202" })),
    });
    const raw = dedupeWholeReportV200(params.raw || "").trim();
    const genericFailure = !raw ||
      /에 대해 사주 기준으로 자세히 풀어본다/.test(raw) ||
      /한 줄로 끝낼 내용이 아니다/.test(raw) ||
      /실제 생활에서 어디서 드러나는지/.test(raw);
    if (genericFailure) return cleanGeneratedText(yearFallback);

    const required = [
      "[올해운세 첫 판정]", "[올해 재물운]", "[올해 직장운]", "[올해 사업운]",
      "[올해 연애운]", "[올해 결혼운]", "[올해 인간관계운]", "[올해 건강운]",
      "[올해 가장 운이 좋은 달]", "[올해 가장 조심해야 할 달]", "[올해운세 마지막 판정]",
    ];
    if (required.some((h) => !raw.includes(h))) return cleanGeneratedText(yearFallback);
    // V221: 제목만 갖춘 짧은 올해운세는 통과시키지 않는다.
    // 충분히 깊지 않으면 계산형 상세 리포트로 교체한다.
    if (raw.length < 8500) return cleanGeneratedText(yearFallback);
    return cleanGeneratedText(raw);
  }

  // 건강운은 V188 전용 파이프라인을 동결한다.
  if (params.categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return cleanGeneratedText(buildV85HealthFullReport(params.user, params.manse));
  }

  // V198: 비건강 카테고리는 카테고리별 원래 내용 구조를 우선한다.
  // 계산 profile은 프롬프트의 사실 기준이고, 고객 문장은 카테고리별 PART 구조로 AI가 새로 작성한다.
  const fallback = fallbackFull(params.categoryId, params.categoryTitle, params.user, params.manse, params.partnerManse || null);
  const cleaned = ensureSajuAnalysisSection(
    dedupeWholeReportV200(params.raw || fallback),
    params.categoryId,
    params.categoryTitle,
    params.manse,
  );

  const requiredCategorySignals: Partial<Record<CategoryId, string[]>> = {
    love: ["내가 실제로 끌리는 사람", "상대가 나에게 빠지는 지점", "상대가 나에게 질리는 지점", "피해야 할 사람", "인연이 강하게 움직이는 시기"],
    marriage: ["결혼운이 강하게 들어오는 시기", "나와 맞는 배우자", "피해야 할 배우자", "결혼하면 돈은 어떻게 되는가", "배우자 가족과의 관계"],
    compatibility: getCompatibilityKindFromTitle(title) === "business"
      ? ["동업 궁합 점수", "역할", "돈과 가격", "의사결정", "책임과 손실"]
      : ["궁합 점수", "왜 끌렸", "왜 부딪", "연애로 보면", "결혼까지", "속궁합"],
    monthly: ["올해운세 첫 판정", "올해 재물운", "돈이 들어오는 달과 돈이 새는 달", "올해 직장운", "올해 사업운", "올해 연애운", "올해 결혼운", "올해 인간관계운", "올해 건강운", "올해 가장 운이 좋은 달", "올해운세 마지막 판정"],
    lifeFlow: ["첫 번째 상승 구간", "가장 큰 기회", "가장 조심해야 할 전환 구간", "후반 인생"],
    traditional: ["가장 강한 복", "가장 약한 구멍", "돈복과 재물", "일·직업·사업", "연애와 결혼", "후반 인생"],
    worry: ["질문에 대한 답부터 말하면", "가장 위험한 선택", "가장 먼저 해야 할 선택", "앞으로 3개월", "앞으로 1년"],
    premium: ["질문에 대한 답부터 말하면", "가장 위험한 선택", "가장 먼저 해야 할 선택", "앞으로 3개월", "앞으로 1년"],
  };
  const requiredSignals = requiredCategorySignals[params.categoryId] || [];
  if (requiredSignals.length && requiredSignals.some((signal) => !cleaned.includes(signal))) {
    console.warn("SOREUM_PAID_CONTENT_STRUCTURE_MISMATCH", {
      categoryId: params.categoryId,
      missing: requiredSignals.filter((signal) => !cleaned.includes(signal)),
    });
  }

  return cleaned;
}

function getMoneyReasonText(manse: any) {
  const snap = getElementSnapshot(manse);
  const lines: string[] = [];
  lines.push("사주에서 재물운을 볼 때는 돈이 들어오는 힘만 보지 않는다. 돈을 잡는 힘, 돈을 오래 들고 가는 힘, 사람 말에 흔들리는 자리, 먼저 돈이 묶이는 자리까지 같이 본다.");

  if (snap.earth >= 2) {
    lines.push("네 사주는 생활에 필요한 것, 오래 쓰는 것, 눈에 보이는 물건이나 관리되는 일에서 돈 냄새를 잘 맡는다. 그래서 허공에 떠 있는 말장사보다 실제 물건, 실제 서비스, 실제 반복 관리처럼 손에 잡히는 돈이 맞다.");
  }
  if (snap.water >= 2) {
    lines.push("정보, 유통, 연결, 온라인, 해외, 중개처럼 물건과 사람이 움직이는 자리도 강하게 본다. 다만 생각이 길어지면 결정이 늦어지고, 남 말이 많아지면 돈 넣을 타이밍을 놓친다.");
  }
  if (snap.fire >= 2) {
    lines.push("사람 앞에서 설명하고 보여주고 반응을 끌어내는 힘도 있다. 그래서 말로 설득하는 판매, 상품 설명, 상담형 판매, 콘텐츠형 판매가 붙을 수 있다. 단, 말만 많고 결제까지 안 이어지는 판은 버려야 한다.");
  }
  if (snap.metal >= 2) {
    lines.push("정리하고 고치고 검수하고 정확히 맞추는 힘이 있다. 중고, 부품, 수리, 검수, 장비, 기술값처럼 정확해야 돈이 되는 일이 맞다. 반대로 감으로 크게 사들이는 재고 장사는 네 사주를 누른다.");
  }
  if (snap.wood >= 2) {
    lines.push("새 일을 키우고 사람을 성장시키는 힘도 있다. 교육, 코칭, 기획, 사람을 모으는 일에서 돈이 붙을 수 있다. 하지만 커지기 전에 돈부터 크게 넣으면 기다리는 시간이 길어져서 먼저 지친다.");
  }

  if (snap.earth >= 3 || snap.metal >= 2) {
    lines.push("처음부터 크게 벌이는 사업이 맞지 않는 이유는 분명하다. 네 돈은 한 번에 크게 깔아놓고 기다리는 돈보다, 필요한 사람이 보일 때 맞춰서 움직이는 돈에서 더 잘 남는다. 먼저 재고값, 월세, 광고비가 빠지는 장사는 돈이 벌리기 전에 몸과 마음이 먼저 묶인다.");
  } else {
    lines.push("무리한 투자가 맞지 않는 이유도 분명하다. 네 사주는 남의 말만 듣고 돈을 넣으면 손에 쥔 감각이 약해진다. 직접 보고, 직접 확인하고, 누가 왜 필요한지 보이는 돈에서 재물운이 붙는다.");
  }

  lines.push("그래서 피해야 할 장사는 그냥 '크게 벌이는 사업'이 아니다. 팔리기도 전에 돈부터 크게 묶이는 사업, 손님이 다시 찾는지 확인하기 전에 광고비부터 쓰는 사업, 지인 말만 믿고 들어가는 투자, 돈 받을 날짜가 흐린 거래가 네 사주와 맞지 않는다.");

  return lines.join("\n\n");
}

function getMoneyTimingText(user: UserInfo, manse: any) {
  const seed = hashToSeed(
    stableStringify({
      year: safeText(user.year),
      month: safeText(user.month),
      day: safeText(user.day),
      birthTime: safeText(user.birthTime, "모름"),
      gender: safeText(user.gender),
      manse,
      logic: "money-timing-v77-age-label-fixed",
    }),
  );

  const birthYear = getNumberFromText(user.year);
  const now = new Date();
  const currentYear = now.getFullYear();
  const koreanAge = birthYear && birthYear > 1900 ? currentYear - birthYear + 1 : 0;

  const firstMoneyAge = 32 + (seed % 5);
  const strongMoneyAge = 39 + (Math.floor(seed / 7) % 7);
  const assetAge = 47 + (Math.floor(seed / 13) % 9);

  const movingMonths = [2, 3, 5, 6, 9, 10, 11];
  const leakMonths = [1, 4, 7, 8, 11, 12];
  const catchMonths = [3, 5, 6, 9, 10, 12];

  const moneyMoveMonth = movingMonths[seed % movingMonths.length];
  const moneyLeakMonth = leakMonths[Math.floor(seed / 5) % leakMonths.length];
  let moneyCatchMonth = catchMonths[Math.floor(seed / 11) % catchMonths.length];
  if (moneyCatchMonth === moneyMoveMonth || moneyCatchMonth === moneyLeakMonth) {
    moneyCatchMonth = catchMonths[(catchMonths.indexOf(moneyCatchMonth) + 2) % catchMonths.length];
  }

  const ageLine = koreanAge
    ? `입력한 생년 기준 현재 나이는 한국식으로 ${koreanAge}세다. 아래의 ${firstMoneyAge}세, ${strongMoneyAge}세, ${assetAge}세는 현재 나이가 아니라 재물운이 움직이는 나이 구간이다.`
    : "입력한 생년을 숫자로 읽지 못해서 현재 나이는 본문에 단정하지 않는다. 아래 나이는 현재 나이가 아니라 재물운이 움직이는 구간이다.";

  return {
    firstMoneyAge,
    strongMoneyAge,
    assetAge,
    moneyMoveMonth,
    moneyLeakMonth,
    moneyCatchMonth,
    koreanAge,
    text: `${ageLine}

재물운 첫 구간은 ${firstMoneyAge}~${firstMoneyAge + 2}세 전후다. 이때부터 돈을 그냥 버는 것과 손에 남기는 것을 다르게 보기 시작한다.

재물운이 굵어지는 구간은 ${strongMoneyAge}~${strongMoneyAge + 3}세 전후다. 이 시기에는 한 번 팔고 끝나는 돈보다 다시 찾는 손님, 반복 주문, 정기 납품, 유지보수, 관리비처럼 되돌아오는 돈을 잡아야 한다.

${assetAge}세 이후에는 빨리 벌고 빨리 쓰는 돈보다 모아서 지키는 돈이 강해진다. 이때부터는 큰 욕심보다 오래 남는 돈이 맞다.

올해는 ${moneyMoveMonth}월 전후로 돈 이야기가 움직이고, ${moneyLeakMonth}월 전후에는 사람 부탁이나 급한 지출 때문에 돈이 새기 쉽다. ${moneyCatchMonth}월 전후에는 앞에서 놓친 돈을 다시 잡을 기회가 들어오는 시기로 본다.`,
  };
}

function getMoneyGrade(manse: any): Grade {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  let score = 0;

  score += earth >= 4 ? 4 : earth >= 3 ? 3 : earth >= 2 ? 2 : earth;
  score += water >= 2 ? 2 : water;
  score += fire >= 2 ? 2 : fire;
  score += metal >= 2 ? 2 : metal >= 1 ? 1 : 0;
  score += wood >= 2 ? 1 : 0;

  if (earth >= 3 && metal === 0) score -= 1;
  if (fire === 0) score -= 1;
  if (water >= 2 && earth >= 2) score += 1;

  return gradeByScore(score);
}

function clampWealthScore(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(25, Math.min(96, Math.round(value)));
}

function buildWealthProfile(user: UserInfo, manse: any): WealthProfile {
  const snap = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);
  const detail = getCareerDetailedProfile(manse);
  const core = getCoreMoneyCareerDetail(detail);
  const timing = getMoneyTimingText(user, manse);
  const grade = getMoneyGrade(manse);

  const earning = clampWealthScore(
    43 + wealth * 8 + output * 5 + snap.fire * 3 + snap.water * 2 + snap.wood - resource,
  );
  const saving = clampWealthScore(
    46 + snap.earth * 6 + snap.metal * 4 + authority * 2 + resource - peer * 4 - output,
  );
  const growing = clampWealthScore(
    42 + wealth * 6 + output * 4 + snap.wood * 3 + snap.fire * 2 + snap.water * 2 - Math.max(0, peer - 1) * 2,
  );
  const keeping = clampWealthScore(
    44 + snap.earth * 5 + snap.metal * 5 + resource * 2 + authority - peer * 3 - Math.max(0, snap.fire - 2) * 2,
  );

  const structuralAverage = earning * 0.29 + saving * 0.26 + growing * 0.25 + keeping * 0.20;
  const imbalance = Math.max(earning, saving, growing, keeping) - Math.min(earning, saving, growing, keeping);
  const utilization = clampWealthScore(structuralAverage - Math.max(0, imbalance - 24) * 0.18);

  const ranked = Array.isArray(detail?.ranked) ? detail.ranked : [];
  const topScore = Number(ranked.find((item: any) => item?.key === core.top1?.key)?.score || core.top1?.score || 10);
  const styleScore = clampWealthScore(58 + topScore * 2 + Math.max(wealth, output) * 2);

  const blockers: WealthBlocker[] = [
    {
      type: "사람과 돈의 경계",
      score: clampWealthScore(48 + peer * 9 + wealth * 3 + (snap.metal === 0 ? 10 : 0)),
      description: "친분·의리·부탁 때문에 가격, 받을 날짜, 내 몫이 흐려질 때 돈그릇이 가장 빨리 샌다.",
    },
    {
      type: "무리한 확장과 선지출",
      score: clampWealthScore(45 + output * 7 + snap.fire * 5 + wealth * 2 - snap.earth * 2),
      description: "돈이 반복해서 들어오는 구조가 생기기 전에 재고·월세·광고·인건비를 먼저 키우면 재물운이 눌린다.",
    },
    {
      type: "결정 지연과 기회 놓침",
      score: clampWealthScore(43 + resource * 8 + snap.water * 4 - output * 2 - snap.fire),
      description: "생각과 준비가 길어져 돈 받을 순간을 늦추거나, 가격을 확정하지 못하면 기회가 다른 사람에게 넘어간다.",
    },
    {
      type: "남의 말에 흔들리는 돈",
      score: clampWealthScore(42 + peer * 5 + snap.water * 3 + Math.max(0, 2 - snap.metal) * 7),
      description: "내가 숫자와 회수 시점을 직접 확인하지 않은 투자·동업·유행 장사는 돈복을 깨기 쉽다.",
    },
  ].sort((a, b) => b.score - a.score);

  const firstStart = timing.firstMoneyAge;
  const expansionStart = timing.strongMoneyAge;
  const peakStart = timing.assetAge;
  const riskSeed = hashToSeed(stableStringify({ user, manse, logic: "wealth-risk-window-v170" }));
  const riskStart = Math.max(firstStart + 3, expansionStart - 2 + (riskSeed % 5));
  const consolidationStart = peakStart + 5 + (Math.floor(riskSeed / 7) % 3);

  const makeWindow = (startAge: number, length: number, meaning: string): WealthWindow => ({
    startAge,
    endAge: startAge + length,
    age: `${startAge}~${startAge + length}세`,
    meaning,
  });

  const range = safeText(core.top1?.moneyRange, "10억~20억권이 현실권");
  const peakRange = topScore >= 15
    ? "30억~50억권까지 보는 큰 그릇"
    : topScore >= 12
      ? "20억~30억권 이상을 보는 그릇"
      : range;

  return {
    version: "wealth-profile-v191-money-funnel",
    capacity: {
      grade,
      range,
      headline: `${range}으로 보는 돈그릇`,
    },
    utilization,
    scores: { earning, saving, growing, keeping },
    moneyStyle: {
      primary: safeText(core.top1?.label, "현실수익형"),
      secondary: safeText(core.top2?.label, "보조수익형"),
      score: styleScore,
      description: `${safeText(core.top1?.label, "현실수익형")} 축을 중심으로 돈을 만들고, ${safeText(core.top2?.label, "보조수익형")}이 붙을 때 돈의 크기가 커진다.`,
    },
    blockers,
    primaryBlocker: blockers[0],
    windows: {
      first: makeWindow(firstStart, 2, "돈을 그냥 버는 것과 손에 남기는 것을 처음으로 갈라 보기 시작하는 첫 돈문"),
      expansion: makeWindow(expansionStart, 3, "직업·거래·반복수입의 규모가 달라지며 돈그릇이 본격적으로 커지는 확장 돈문"),
      peak: makeWindow(peakStart, 4, "인생에서 가장 큰 돈을 다루거나 자산의 크기를 키울 수 있는 최대 재물 돈문"),
      risk: makeWindow(riskStart, 2, "돈이 커지는 만큼 투자·동업·확장·사람 문제로 크게 샐 수 있어 선택을 가려야 하는 위험 돈문"),
      consolidation: makeWindow(consolidationStart, 4, "번 돈을 자산·고정수입·장기 현금흐름으로 굳혀 내 돈으로 만드는 시기"),
    },
    peakRange,
    continuityNote: "받을 이유를 만들고, 반복수입을 붙이고, 검증된 돈길의 규모를 키운 뒤, 위험구간을 방어하고 자산으로 굳히는 순서가 핵심이다.",
  };
}

function buildWealthProfilePromptBlock(profile: WealthProfile) {
  return `[MONEY_PROFILE_DATA]
capacity=${profile.capacity.range}
grade=${profile.capacity.grade}
utilization=${profile.utilization}
earning=${profile.scores.earning}
saving=${profile.scores.saving}
growing=${profile.scores.growing}
keeping=${profile.scores.keeping}
primary_style=${profile.moneyStyle.primary}
secondary_style=${profile.moneyStyle.secondary}
blocker=${profile.primaryBlocker.type}
blocker_score=${profile.primaryBlocker.score}
first_window=${profile.windows.first.age}
expansion_window=${profile.windows.expansion.age}
peak_window=${profile.windows.peak.age}
risk_window=${profile.windows.risk.age}
consolidation_window=${profile.windows.consolidation.age}
peak_range=${profile.peakRange}

[MONEY_GENERATION_RULES]
1. 위 값은 계산 데이터다. 고객에게 "공통 판정", "무료와 유료", "절대 변경 금지", "연결 규칙" 같은 제작 문구를 절대 출력하지 않는다.
2. 돈그릇 금액은 서로 역전되는 단계로 새로 만들지 않는다. capacity를 중심 금액, peak_range를 최대 돈문 상단 범위로만 사용한다.
3. 유료는 무료 숫자를 다시 길게 낭독하지 않는다. 왜 그 돈이 생기는지, 어떤 순서로 현실화되는지, 언제 확장/방어/자산화할지를 답한다.
4. 직업 적성과 재물 확장성을 혼동하지 않는다. 약한 돈길은 "평생 금지 직업"이 아니라 "큰돈의 중심축으로 효율이 낮음"으로 설명한다.
5. 확장 돈문과 위험 돈문이 겹치면 좋은 시기/나쁜 시기로 따로 말하지 말고, 돈이 커지는 만큼 손실도 커질 수 있는 교차구간으로 설명한다.
6. 같은 나이·금액·직업군 설명을 여러 섹션에서 반복하지 않는다.
7. "돈은 돈은", "넓히는 넓어지는" 같은 중복 문장을 만들지 않는다.
8. 결과의 핵심 경로는 받을 이유 → 반복수입 → 규모 확대 → 손실 방어 → 자산화 순서로 연결한다.`;
}

function clampPreviewScore(value: number, min = 28, max = 96) {
  if (!Number.isFinite(value)) return 55;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeCareerPreviewScores(items: Array<{ type: string; score: number }>) {
  const list = Array.isArray(items) ? items.slice(0, 5) : [];
  if (!list.length) return [] as PreviewScoreItem[];
  const raw = list.map((item) => Number(item.score || 0));
  const minRaw = Math.min(...raw);
  const maxRaw = Math.max(...raw);
  return list.map((item, index) => {
    const normalized = maxRaw === minRaw
      ? 68 - index * 6
      : 48 + ((Number(item.score || 0) - minRaw) / (maxRaw - minRaw)) * 44;
    return {
      key: item.type,
      label: item.type,
      score: clampPreviewScore(normalized - index * 1.5),
      verdict: index === 0 ? "가장 강한 일축" : index === 1 ? "같이 살릴 일축" : "보조 가능성",
    };
  });
}

function distinctMonths(seed: number, count: number) {
  const months: number[] = [];
  let cursor = Math.abs(Math.floor(seed)) || 1;
  for (let i = 0; i < 48 && months.length < count; i += 1) {
    const month = ((cursor + i * 5 + Math.floor(i / 2) * 3) % 12) + 1;
    if (!months.includes(month)) months.push(month);
    cursor = Math.floor(cursor / 3) + 17;
  }
  for (let month = 1; months.length < count && month <= 12; month += 1) {
    if (!months.includes(month)) months.push(month);
  }
  return months;
}

function buildCareerWebtoonScenes(params: {
  user: UserInfo;
  office: number;
  own: number;
  primary: string;
  secondary: string;
  verdict: string;
  moneyRole: string;
  strongestSkill: string;
  avoidWork: string;
  transitionWindow: string;
}): { storyType: CareerWebtoonStoryType; scenes: CareerWebtoonScene[] } {
  const protagonistGender: "male" | "female" =
    params.user.gender === "여성" ? "female" : "male";

  const p = `${params.primary} ${params.secondary} ${params.verdict} ${params.moneyRole} ${params.strongestSkill}`;
  let storyType: CareerWebtoonStoryType;

  if (params.office >= 64) storyType = "organization-rise";
  else if (params.own >= 68)
    storyType = /영업|거래|유통|무역|판매|납품|중개/.test(p)
      ? "trade-sales"
      : "own-board";
  else if (/기술|전문|개발|엔지니어|설비|품질|연구|정비/.test(p))
    storyType = "expert-value";
  else if (/관리|리더|책임|조율|운영/.test(p))
    storyType = "leader-control";
  else storyType = "hybrid-build";

  const openLine: Record<CareerWebtoonStoryType, string> = {
    "organization-rise": "너는 회사를 나가야 풀리는 사람이 아니다. 그런데 아무 자리에서 오래 버티는 것도 답이 아니다.",
    "own-board": "너는 남이 만든 판만 오래 지키면 어느 순간부터 네 값이 멈춘다.",
    "hybrid-build": "너는 회사냐 사업이냐 하나만 고르면 오히려 답을 놓친다.",
    "expert-value": "너는 말로 자리 잡는 사람이 아니다. 네 값은 해결한 문제에서 올라간다.",
    "trade-sales": "너는 일만 많이 해서는 네 몫이 커지지 않는다. 거래를 움직여야 한다.",
    "leader-control": "너는 실무만 붙들고 있을수록 손해다. 결정권이 생길 때 일이 산다.",
  };

  const revealLine: Record<CareerWebtoonStoryType, string> = {
    "organization-rise": "네가 답답했던 건 회사 때문이 아니다. 책임보다 권한이 작았기 때문이다.",
    "own-board": "네가 답답했던 건 일이 싫어서가 아니다. 결과가 네 이름으로 남지 않았기 때문이다.",
    "hybrid-build": "네가 흔들렸던 건 우유부단해서가 아니다. 안전판과 자기 몫이 둘 다 필요한 사주라서다.",
    "expert-value": "네가 손해 본 건 실력이 부족해서가 아니다. 기술값을 돈으로 바꾸는 구조가 약했기 때문이다.",
    "trade-sales": "네가 바빠도 몫이 작았던 이유는 단순하다. 네가 가격과 조건을 쥐지 못했기 때문이다.",
    "leader-control": "네가 지쳤던 건 일이 많아서만이 아니다. 책임은 지는데 마지막 결정은 남이 했기 때문이다.",
  };

  const reversal: Record<CareerWebtoonStoryType, string> = {
    "organization-rise": "그럼 그냥 회사에 오래 있으면 되냐고? 아니. 자리와 권한이 안 커지면 오래 있을 이유가 없다.",
    "own-board": "그럼 당장 사업하면 되냐고? 아니. 준비 없이 크게 벌이는 게 네 함정이다.",
    "hybrid-build": "그럼 직장도 하고 사업도 다 하라는 말이냐고? 아니다. 순서가 틀리면 둘 다 무너진다.",
    "expert-value": "기술만 잘하면 끝이냐고? 아니다. 기술값을 견적과 단가와 계약으로 바꿔야 한다.",
    "trade-sales": "그럼 물건부터 많이 잡으면 되냐고? 아니다. 주문보다 재고가 먼저 커지면 바로 막힌다.",
    "leader-control": "직급만 높아지면 되냐고? 아니다. 책임만 늘고 결정권이 없으면 더 답답해진다.",
  };

  const resolution: Record<CareerWebtoonStoryType, string> = {
    "organization-rise": "조직 안에서도 네가 결정하고 결과를 남기는 자리로 올라가야 한다.",
    "own-board": "네 이름으로 가격과 결과가 남는 작은 판부터 만들어야 한다.",
    "hybrid-build": "본업의 안전판을 지키면서 네 몫이 생기는 수익판을 하나씩 붙여야 한다.",
    "expert-value": "전문성을 견적·단가·계약으로 바꾸는 순간 네 몸값이 달라진다.",
    "trade-sales": "사람·상품·가격·조건을 직접 움직일 때 네 일이 돈이 된다.",
    "leader-control": "사람과 일을 조율하고 마지막 결정을 쥐는 자리에서 네 값이 올라간다.",
  };

  const weaponTitle: Record<CareerWebtoonStoryType, string> = {
    "organization-rise": "권한과 이름이 남는 자리",
    "own-board": "네 이름으로 받는 첫 돈",
    "hybrid-build": "본업 밖에서 확인되는 작은 수익",
    "expert-value": "기술에 붙는 가격표",
    "trade-sales": "거래처·단가·입금일을 쥐는 힘",
    "leader-control": "마지막 결정을 내릴 수 있는 권한",
  };

  // 실제 이미지 파일명은 route에서 고르지 않는다.
  // page.tsx가 아래 의미 키를 받아 /characters/dohoon 전체 풀에서 장면에 맞는 컷을 고른다.
  const image = {
    intro: "opening",
    notice: "analysis",
    judge: "decision",
    reverse: "reveal",
    warning: "warning",
    point: "guide",
    rise: "confidence",
    future: "future",
    secret: "mystery",
  } as const;

  const scenes: CareerWebtoonScene[] = [
    {
      id: "career-01",
      order: 1,
      sceneKey: `career_${storyType}_opening_${protagonistGender}`,
      dohoonImageKey: image.intro,
      intensity: 1,
      protagonistGender,
      cast: "both",
      mood: "tense",
      shot: "wide",
      dialogue: openLine[storyType],
      narration: "도훈이 명식을 보다가 한 번 더 멈춰 본다.",
    },
    {
      id: "career-02",
      order: 2,
      sceneKey: "career_dohun_notice",
      dohoonImageKey: image.notice,
      intensity: 2,
      protagonistGender,
      cast: "dohoon",
      mood: "reveal",
      shot: "closeup",
      dialogue: "이상하네. 네가 일에서 자꾸 막혔던 이유가 여기 있다.",
      emphasis: revealLine[storyType],
    },
    {
      id: "career-03",
      order: 3,
      sceneKey: `career_split_${storyType}_${protagonistGender}`,
      dohoonImageKey: image.judge,
      intensity: 3,
      protagonistGender,
      cast: "both",
      mood: "reveal",
      shot: "split",
      dialogue: "네 일 사주는 한쪽 힘이 이렇게 더 세다.",
      emphasis: params.verdict,
      leftLabel: "직장형",
      leftValue: `${params.office}`,
      rightLabel: "내 판형",
      rightValue: `${params.own}`,
    },
    {
      id: "career-04",
      order: 4,
      sceneKey: `career_reversal_${storyType}`,
      dohoonImageKey: image.reverse,
      intensity: 4,
      protagonistGender,
      cast: "dohoon",
      mood: "mystery",
      shot: "closeup",
      dialogue: reversal[storyType],
      emphasis: "여기서 대부분 한 번 잘못 움직인다.",
    },
    {
      id: "career-05",
      order: 5,
      sceneKey: `career_warning_${storyType}_${protagonistGender}`,
      dohoonImageKey: image.warning,
      intensity: 5,
      protagonistGender,
      cast: "both",
      mood: "warning",
      shot: "medium",
      dialogue: "네 일운을 제일 빨리 깎는 자리가 있다.",
      emphasis: params.avoidWork,
      narration: "이 장면을 반복하면 경력은 쌓여도 네 값은 잘 안 오른다.",
    },
    {
      id: "career-06",
      order: 6,
      sceneKey: `career_weapon_${storyType}`,
      dohoonImageKey: image.point,
      intensity: 3,
      protagonistGender,
      cast: "dohoon",
      mood: "gold",
      shot: "medium",
      dialogue: "반대로 네가 먼저 가져야 할 건 직업 이름이 아니다.",
      emphasis: weaponTitle[storyType],
      bullets: [params.moneyRole, params.strongestSkill],
    },
    {
      id: "career-07",
      order: 7,
      sceneKey: `career_value_rise_${storyType}_${protagonistGender}`,
      dohoonImageKey: image.rise,
      intensity: 3,
      protagonistGender,
      cast: "both",
      mood: "hope",
      shot: "wide",
      dialogue: "이 구조가 붙으면 같은 시간을 일해도 네 몸값이 달라진다.",
      emphasis: resolution[storyType],
      narration: `중심 일축은 ${params.primary}, 같이 살릴 축은 ${params.secondary}다.`,
    },
    {
      id: "career-08",
      order: 8,
      sceneKey: `career_future_${storyType}_${protagonistGender}`,
      dohoonImageKey: image.future,
      intensity: 4,
      protagonistGender,
      cast: "protagonist",
      mood: "mystery",
      shot: "back",
      dialogue: "그리고 네 일 인생에는 판이 한 번 크게 바뀌는 구간이 있다.",
      emphasis: `첫 변화 신호 ${params.transitionWindow}`,
      narration: "여기서는 직장만 바뀌는 게 아니라 돈 버는 방식 자체가 달라질 수 있다.",
    },
    {
      id: "career-09",
      order: 9,
      sceneKey: "career_dohun_secret",
      dohoonImageKey: image.secret,
      intensity: 5,
      protagonistGender,
      cast: "dohoon",
      mood: "mystery",
      shot: "closeup",
      dialogue: "그런데 진짜 큰 변화는 첫 변화보다 뒤에 있다.",
      emphasis: "인생 최대 일운 · 맞는 직업군 · 사업 타이밍",
      narration: "회사를 나가느냐보다 언제 움직이고 무엇을 들고 나가느냐가 더 중요하다.",
      locked: true,
    },
  ];

  return { storyType, scenes };
}

function buildTodayDomainScoresV204(params: {
  seed: number;
  snap: ReturnType<typeof getElementSnapshot>;
  wealth: number;
  output: number;
  authority: number;
  resource: number;
  peer: number;
  strongestArea: string;
  warningArea: string;
}) {
  const { seed, snap, wealth, output, authority, resource, peer, strongestArea, warningArea } = params;

  // 오늘 세부 점수는 AI 문장 생성값이 아니라 같은 만세력 snapshot + 십성 count + fortuneSeed에서 결정한다.
  // strongest/warning 판정과 숫자가 서로 충돌하지 않도록 마지막에 같은 축을 보정한다.
  const jitter = (shift: number) => ((Math.floor(seed / shift) % 9) - 4);
  const scores = {
    money: clampPreviewScore(55 + wealth * 4 + output * 2 + snap.earth + snap.water + jitter(3), 38, 92),
    work: clampPreviewScore(54 + authority * 4 + resource * 2 + snap.fire + snap.wood + jitter(5), 38, 92),
    relationship: clampPreviewScore(53 + peer * 3 + output * 2 + snap.fire + snap.water + jitter(7), 38, 92),
    health: clampPreviewScore(56 + resource * 2 + snap.wood + snap.water + snap.earth - Math.abs(snap.fire - snap.water) * 2 + jitter(11), 38, 92),
  };

  const areaKey: Record<string, keyof typeof scores | undefined> = {
    돈: "money",
    일: "work",
    사람: "relationship",
    말: "relationship",
    몸: "health",
  };
  const strongKey = areaKey[strongestArea];
  const warningKey = areaKey[warningArea];

  if (strongKey) {
    const otherMax = Math.max(...Object.entries(scores).filter(([k]) => k !== strongKey).map(([, v]) => v));
    scores[strongKey] = clampPreviewScore(Math.max(scores[strongKey], otherMax + 5), 38, 94);
  }
  if (warningKey && warningKey !== strongKey) {
    const otherMin = Math.min(...Object.entries(scores).filter(([k]) => k !== warningKey).map(([, v]) => v));
    scores[warningKey] = clampPreviewScore(Math.min(scores[warningKey], otherMin - 5), 34, 94);
  }

  return {
    moneyScore: scores.money,
    workScore: scores.work,
    relationshipScore: scores.relationship,
    healthScore: scores.health,
  };
}




function normalizeTodayPaidSectionHeadingsV215(raw: string) {
  let text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return text;

  // Formatting only: keep the generated body intact and restore the same bracketed
  // section boundary for every Today paid section.
  const headings = [
    "오늘의 종합운",
    "오늘 가장 좋은 시간",
    "오늘의 재물운",
    "오늘의 일·사업운",
    "오늘의 연애·인연운",
    "오늘의 건강운",
    "오늘 꼭 해야 할 것",
    "오늘 피해야 할 것",
    "오늘운세 마지막 판정",
  ];

  for (const heading of headings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `(^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\[\\s*)?${escaped}(?:\\s*\\])?\\s*(?=\\n|$)`,
      "g",
    );
    text = text.replace(re, (_match, prefix) => `${prefix}[${heading}]`);
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function finalizeTodayPaidSingleReportV213(raw: string) {
  let text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return text;

  // Today paid is one report only. If recovery/model output starts the report again,
  // cut everything from the second "오늘의 종합운" onward.
  const startRe = /(?:^|\n)\s*(?:#{1,6}\s*)?\[?\s*오늘의\s*종합운\s*\]?\s*(?=\n|$)/g;
  const starts = [...text.matchAll(startRe)];
  if (starts.length >= 2) {
    const cut = starts[1].index ?? -1;
    if (cut > 0) text = text.slice(0, cut).trim();
  }

  // A recovery appendix sometimes restarts with a greeting before the second report.
  const greetingRestart = text.search(
    /\n\s*안녕하세요[^\n]{0,80}\n+\s*(?:#{1,6}\s*)?\[?\s*오늘의\s*종합운\s*\]?/,
  );
  if (greetingRestart > 0) {
    text = text.slice(0, greetingRestart).trim();
  }

  // The paid Today report must finish at its first final verdict.
  // This prevents any accidental appendix/recovery text from being exposed.
  const finalHeadingRe =
    /(?:^|\n)\s*(?:#{1,6}\s*)?\[?\s*오늘운세\s*마지막\s*판정\s*\]?\s*(?=\n|$)/g;
  const finalHit = finalHeadingRe.exec(text);
  if (finalHit) {
    const bodyStart = finalHit.index + finalHit[0].length;
    const after = text.slice(bodyStart);
    const nextHeading = after.search(
      /\n\s*(?:#{1,6}\s*)?\[?\s*(?:오늘의\s*종합운|오늘\s*가장\s*좋은\s*시간|오늘의\s*재물운|오늘의\s*일·사업운|오늘의\s*연애·인연운|오늘의\s*건강운|오늘\s*꼭\s*해야\s*할\s*것|오늘\s*피해야\s*할\s*것)\s*\]?\s*(?=\n|$)/,
    );
    if (nextHeading >= 0) {
      text = text.slice(0, bodyStart + nextHeading).trim();
    }
  }

  return text;
}

function buildSajuFoundationV211(user: UserInfo, manse: any) {
  const birthYear = Number(
    user?.year ||
    String((user as any)?.birthDate || (user as any)?.birth || "").slice(0, 4)
  );
  const currentYear = new Date().getFullYear();
  const currentAge =
    Number.isFinite(birthYear) && birthYear > 0 ? currentYear - birthYear : null;

  const zodiacAnimals = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];
  const zodiac =
    Number.isFinite(birthYear) && birthYear > 0
      ? `${zodiacAnimals[birthYear % 12]}띠`
      : "";

  // Reuse the route's existing deterministic five-element calculation.
  const snap = getElementSnapshot(manse);
  const elements = {
    wood: Number(snap?.wood || 0),
    fire: Number(snap?.fire || 0),
    earth: Number(snap?.earth || 0),
    metal: Number(snap?.metal || 0),
    water: Number(snap?.water || 0),
  };

  const ordered = [
    { key: "wood", label: "목(木)", value: elements.wood },
    { key: "fire", label: "화(火)", value: elements.fire },
    { key: "earth", label: "토(土)", value: elements.earth },
    { key: "metal", label: "금(金)", value: elements.metal },
    { key: "water", label: "수(水)", value: elements.water },
  ];

  const strongestElement = [...ordered].sort((a, b) => b.value - a.value)[0];
  const weakestElement = [...ordered].sort((a, b) => a.value - b.value)[0];

  const elementStrengthMeanings: Record<string, {
    summary: string;
    money: string;
    work: string;
    relationship: string;
  }> = {
    wood: {
      summary: "시작하고 키우고 확장하는 힘이 강하다.",
      money: "돈에서는 새로운 수입원을 찾고 작은 기회를 키워가는 힘으로 나타난다.",
      work: "일에서는 새 일을 시작하고 방향을 만들며 판을 넓히는 데 강점이 있다.",
      relationship: "사람 관계에서는 먼저 다가가고 관계를 이어가며 함께 성장시키는 힘이 있다.",
    },
    fire: {
      summary: "표현하고 밀어붙이며 사람의 시선을 끄는 힘이 강하다.",
      money: "돈에서는 자신의 가치나 상품을 드러내고 기회를 실제 매출과 성과로 연결하는 힘으로 나타난다.",
      work: "일에서는 추진력·표현력·속도가 강점이 되어 앞에서 움직이고 결과를 만드는 데 유리하다.",
      relationship: "사람 관계에서는 감정을 표현하고 분위기를 살리며 상대와 빠르게 가까워지는 힘이 있다.",
    },
    earth: {
      summary: "현실감각·책임감·버티고 쌓아가는 힘이 강하다.",
      money: "돈에서는 쉽게 흔들리기보다 들어온 것을 관리하고 쌓아 자산으로 남기는 힘으로 나타난다.",
      work: "일에서는 맡은 일을 끝까지 끌고 가고 현실적인 기준으로 결과를 만드는 힘이 강하다.",
      relationship: "사람 관계에서는 가볍게 끊기보다 오래 책임지고 신뢰를 쌓는 힘이 있다.",
    },
    metal: {
      summary: "판단하고 정리하며 기준을 세우고 끊어내는 힘이 강하다.",
      money: "돈에서는 손익을 가르고 불필요한 지출을 정리하며 조건을 냉정하게 판단하는 힘으로 나타난다.",
      work: "일에서는 우선순위를 세우고 문제를 정리하며 결정해야 할 때 결론을 내리는 힘이 강하다.",
      relationship: "사람 관계에서는 맞고 틀린 기준과 관계의 선을 분명하게 정하는 힘이 있다.",
    },
    water: {
      summary: "정보를 읽고 관찰하며 상황에 맞춰 유연하게 움직이는 힘이 강하다.",
      money: "돈에서는 정보와 흐름을 읽고 타이밍을 보면서 수입 기회를 찾아내는 힘으로 나타난다.",
      work: "일에서는 상황을 빠르게 파악하고 정보를 모아 변화에 맞게 대응하는 힘이 강하다.",
      relationship: "사람 관계에서는 상대의 분위기와 속마음을 읽고 상황에 맞게 대처하는 힘이 있다.",
    },
  };

  const elementWeaknessMeanings: Record<string, {
    summary: string;
    money: string;
    work: string;
    relationship: string;
  }> = {
    wood: {
      summary: "새로 시작하고 방향을 넓혀가는 힘을 의식적으로 보완해야 한다.",
      money: "돈에서는 익숙한 수입 방식에 머물러 새 기회를 늦게 잡거나 확장 시점을 놓치기 쉽다.",
      work: "일에서는 시작을 미루거나 장기적인 성장 방향을 잡는 데 시간이 걸릴 수 있다.",
      relationship: "사람 관계에서는 먼저 다가가거나 관계를 새롭게 풀어가는 행동이 부족해질 수 있다.",
    },
    fire: {
      summary: "표현하고 행동으로 옮기며 자신을 드러내는 힘을 보완해야 한다.",
      money: "돈에서는 좋은 능력이나 상품이 있어도 가격·가치·장점을 적극적으로 보여주는 힘이 약해질 수 있다.",
      work: "일에서는 생각한 것을 바로 실행하거나 자신의 성과를 드러내는 속도가 늦어질 수 있다.",
      relationship: "사람 관계에서는 호감이나 서운함을 표현하지 않아 상대가 마음을 알아채기 어려울 수 있다.",
    },
    earth: {
      summary: "유지하고 책임지며 현실적으로 마무리하는 힘을 보완해야 한다.",
      money: "돈에서는 벌 기회를 찾는 것에 비해 모으고 유지하고 오래 남기는 관리가 약해질 수 있다.",
      work: "일에서는 시작은 빠르지만 반복 관리나 끝까지 마무리하는 힘이 흔들릴 수 있다.",
      relationship: "사람 관계에서는 관계를 안정적으로 유지하거나 꾸준히 책임지는 부분이 부담으로 느껴질 수 있다.",
    },
    metal: {
      summary: "정리·판단·결단·선 긋는 힘을 의식적으로 보완해야 한다.",
      money: "돈에서는 손절이나 지출 기준을 늦게 세우고, 필요 없는 비용을 딱 잘라 끊는 판단이 약해질 수 있다.",
      work: "일에서는 우선순위를 분명히 정하거나 아닌 일을 잘라내고 결론을 내리는 힘이 부족해질 수 있다.",
      relationship: "사람 관계에서는 싫은 것을 거절하거나 관계의 선을 분명히 긋는 일이 어려워질 수 있다.",
    },
    water: {
      summary: "정보를 충분히 읽고 속도를 조절하며 유연하게 대응하는 힘을 보완해야 한다.",
      money: "돈에서는 정보와 타이밍을 충분히 확인하기 전에 결정하거나 변화하는 흐름을 늦게 읽을 수 있다.",
      work: "일에서는 상황 변화에 맞춰 계획을 바꾸거나 정보를 모아 판단하는 과정이 부족해질 수 있다.",
      relationship: "사람 관계에서는 상대의 속도와 분위기를 읽기보다 자신의 방식대로 밀어붙이기 쉬울 수 있다.",
    },
  };

  const strongestMeaning =
    elementStrengthMeanings[String(strongestElement?.key || "")] || {
      summary: "",
      money: "",
      work: "",
      relationship: "",
    };
  const weakestMeaning =
    elementWeaknessMeanings[String(weakestElement?.key || "")] || {
      summary: "",
      money: "",
      work: "",
      relationship: "",
    };

  const dayMaster =
    manse?.dayMaster ||
    manse?.ilgan ||
    manse?.dayStem ||
    manse?.dayPillar?.stem ||
    "";

  const lifeStage =
    currentAge == null ? "unknown" :
    currentAge <= 23 ? "foundation" :
    currentAge <= 39 ? "growth" :
    currentAge <= 49 ? "expansion" :
    currentAge <= 59 ? "conversion" :
    currentAge <= 69 ? "experience-income" :
    "low-burden-income";

  const lifeStageLabel =
    lifeStage === "foundation" ? "기초 경험과 실력을 쌓는 시기" :
    lifeStage === "growth" ? "몸값과 수입원을 키우는 시기" :
    lifeStage === "expansion" ? "경력과 자기 몫을 확장하는 시기" :
    lifeStage === "conversion" ? "경험을 자기 수익으로 바꾸는 시기" :
    lifeStage === "experience-income" ? "경험·관계·전문성을 수입으로 연결하는 시기" :
    lifeStage === "low-burden-income" ? "부담을 낮추고 반복 가능한 수입을 남기는 시기" :
    "현재 나이에 맞게 현실 적용하는 시기";

  return {
    version: "saju-foundation-v211",
    currentAge,
    zodiac,
    dayMaster: String(dayMaster || ""),
    elements,
    strongestElement,
    weakestElement,
    strongestMeaning,
    weakestMeaning,
    lifeStage,
    lifeStageLabel,
  };
}

function buildCategoryPreviewProfileBase(params: {
  categoryId: CategoryId;
  categoryTitle: string;
  user: UserInfo;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed: number;
  scoreVisual: RelationshipScoreVisual;
}): CategoryPreviewProfile | null {
  const { categoryId, categoryTitle, user, manse, fortuneSeed, scoreVisual } = params;
  const sajuFoundation = buildSajuFoundationV211(user, manse);
  const snap = getElementSnapshot(manse);
  const ten = getTenGodCounts(manse);
  const wealth = countTenGodGroup(ten, ["편재", "정재"]);
  const output = countTenGodGroup(ten, ["식신", "상관"]);
  const authority = countTenGodGroup(ten, ["편관", "정관"]);
  const resource = countTenGodGroup(ten, ["편인", "정인"]);
  const peer = countTenGodGroup(ten, ["비견", "겁재"]);
  const timing = getMoneyTimingText(user, manse);
  const seed = Math.abs(Math.floor(fortuneSeed || hashToSeed(stableStringify({ user, manse, categoryId }))));

  if (categoryId === "today") {
    const overallScore = clampPreviewScore(52 + (seed % 31) + snap.fire * 2 + snap.water - Math.max(0, snap.earth - 3));
    const areas = ["돈", "일", "사람", "말", "몸"];
    const strongestArea = areas[seed % areas.length];
    const warningArea = areas[(seed + 3) % areas.length] === strongestArea ? areas[(seed + 2) % areas.length] : areas[(seed + 3) % areas.length];
    const times = ["오전 9~11시", "오전 11시~오후 1시", "오후 2~4시", "오후 5~7시", "저녁 8~10시"];
    const bestTime = times[Math.floor(seed / 7) % times.length];
    const doOne = strongestArea === "돈"
      ? "받을 돈·가격·결제 조건을 먼저 확인해라"
      : strongestArea === "사람"
        ? "필요한 연락 하나는 먼저 해라"
        : "오늘 가장 중요한 일 하나부터 끝내라";
    const avoidOne = warningArea === "말"
      ? "감정 올라왔을 때 바로 답장하지 마라"
      : warningArea === "돈"
        ? "급한 결제와 충동구매를 미뤄라"
        : "몸과 감정을 같이 몰아붙이지 마라";
    const domainScores = buildTodayDomainScoresV204({
      seed,
      snap,
      wealth,
      output,
      authority,
      resource,
      peer,
      strongestArea,
      warningArea,
    });
    const paidHook = buildTodayPaidHookV203({
      strongestArea,
      warningArea,
      bestTime,
      doOne,
      avoidOne,
    });
    return {
      sajuFoundation,
      kind: "today",
      version: "today-preview-profile-v204-domain-scores",
      overallScore,
      verdict: overallScore >= 80 ? "오늘은 잡을 건 잡아도 되는 날" : overallScore >= 65 ? "좋은 것과 조심할 것이 선명하게 갈리는 날" : "크게 벌이기보다 실수를 줄이는 날",
      ...domainScores,
      bestTime,
      strongestArea,
      warningArea,
      doOne,
      avoidOne,
      ...paidHook,
    };
  }

  if (categoryId === "money" || categoryTitle.includes("재물")) {
    const wealthProfile = buildWealthProfile(user, manse);
    return {
      sajuFoundation,
      kind: "money",
      version: "money-preview-profile-v176-webtoon",
      capacityGrade: wealthProfile.capacity.grade,
      capacityRange: wealthProfile.capacity.range,
      utilization: wealthProfile.utilization,
      primaryStyle: wealthProfile.moneyStyle.primary,
      blocker: wealthProfile.primaryBlocker.description,
      firstWindow: wealthProfile.windows.first.age,
      peakWindow: wealthProfile.windows.peak.age,
    };
  }

  if (categoryId === "career" || categoryTitle.includes("일·사업")) {
    const career = getCareerArchetype(manse);
    const fullDetail = getCareerDetailedProfile(manse);
    const scores = normalizeCareerPreviewScores(career.scores);
    const office = clampPreviewScore(Number(fullDetail.split?.office || 50), 18, 82);
    const own = 100 - office;
    const detail = getCoreCareerDetail(fullDetail);
    const moneyRole = safeText(fullDetail.top1?.label, detail.first?.label || career.primary);
    const strongestSkill = safeText(fullDetail.top1?.why, "내 판단과 역할이 결과로 바로 연결되는 일에서 강점이 살아난다.");
    const avoidWork = "큰 창업·선재고·무리한 투자·가격결정권 없이 책임만 큰 일";
    const transitionWindow = `${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세`;
    const webtoon = buildCareerWebtoonScenes({
      user, office, own, primary: fullDetail.top1?.label || career.primary, secondary: fullDetail.top2?.label || career.secondary, verdict: fullDetail.workStyle,
      moneyRole, strongestSkill, avoidWork, transitionWindow,
    });
    return {
      sajuFoundation,
      kind: "career",
      version: "career-preview-profile-v174-cinematic-webtoon",
      split: { office, own },
      primary: fullDetail.top1?.label || career.primary,
      secondary: fullDetail.top2?.label || career.secondary,
      verdict: fullDetail.workStyle,
      scores,
      moneyRole,
      strongestSkill,
      avoidWork,
      transitionWindow,
      storyType: webtoon.storyType,
      webtoonScenes: webtoon.scenes,
      freeHeadline: `${fullDetail.workStyle}. 하지만 중요한 건 회사냐 사업이냐보다 어디에서 네 몫이 생기느냐다.`,
      freeBody: `가장 먼저 볼 길은 ${fullDetail.top1?.label || moneyRole}이다. ${fullDetail.top1?.why || strongestSkill} 회사에 있다면 ${fullDetail.top1?.companyRole || moneyRole}처럼 돈과 결과가 직접 보이는 자리를 잡아야 한다. 반대로 가격결정권 없이 책임만 커지거나, 큰 재고와 고정비부터 안는 일은 피해야 한다.`,
      curiosityHook: `그런데 같은 ${fullDetail.top1?.label || moneyRole} 안에서도 돈그릇이 커지는 자리는 따로 있다. 네가 가격·거래처·고객·기술 중 무엇을 직접 쥐어야 하는지 확인해야 사업운이 산다.`,
      top3: [fullDetail.top1, fullDetail.top2, fullDetail.top3].filter(Boolean).map((item: any, idx: number) => ({
        rank: idx + 1,
        label: item.label,
        body: idx === 0
          ? `${item.why} 회사에서는 ${item.companyRole}, 밖에서는 ${item.outsideRole} 쪽으로 이어진다.`
          : `${item.why} ${idx === 1 ? "1순위를 받쳐 몸값과 단가를 높이는 길이다." : "본업 옆에서 수입원을 넓히는 확장 길이다."}`,
      })),
    };
  }

  if (categoryId === "love" || categoryId === "marriage" || categoryTitle.includes("연애") || categoryTitle.includes("결혼")) {
    const rel = getRelationshipProfile(manse);
    const loveTiming = getLoveTimingProfile(manse);
    const visual = scoreVisual && scoreVisual.kind === "loveMarriage" ? scoreVisual : null;
    return {
      sajuFoundation,
      kind: "love",
      version: "love-preview-profile-v171",
      loveScore: clampPreviewScore(Number(visual?.love.overall || 64)),
      marriageScore: clampPreviewScore(Number(visual?.marriage.overall || 62)),
      headline: visual?.love.verdict || rel.core,
      attractionPoint: safeText(visual?.visualProfiles?.partnerTitle, "네가 반복해서 끌리는 사람의 분위기"),
      partnerTitle: safeText(visual?.visualProfiles?.partnerTitle, "네가 끌리는 상대"),
      partnerDescription: safeText(visual?.visualProfiles?.partnerDescription, rel.direction),
      avoidPartner: safeText(rel.avoid?.[0], rel.risk),
      relationshipRisk: rel.risk,
      strongWindow: safeText((loveTiming as any)?.timing || (loveTiming as any)?.strong || (loveTiming as any)?.age, "인연이 강해지는 시기는 유료에서 연령·흐름으로 이어서 본다."),
    };
  }

  if (categoryId === "health" || categoryTitle.includes("건강")) {
    const health = getHealthProfile(manse);
    const recovery = clampPreviewScore(78 - Math.abs(snap.fire - snap.water) * 8 - Math.max(0, snap.earth - 3) * 4 + resource * 2);
    const sleep = clampPreviewScore(72 + snap.water * 4 - snap.fire * 5 - output * 2);
    const digestion = clampPreviewScore(70 + Math.min(snap.earth, 3) * 3 - Math.max(0, snap.earth - 3) * 9 - peer * 2);
    const tension = clampPreviewScore(74 + snap.metal * 3 - output * 5 - authority * 2);
    const metrics: PreviewScoreItem[] = [
      { key: "recovery", label: "회복력", score: recovery, verdict: recovery < 55 ? "먼저 챙겨야 함" : "버틸 힘 있음" },
      { key: "sleep", label: "수면 리듬", score: sleep, verdict: sleep < 55 ? "흔들리기 쉬움" : "관리 가능" },
      { key: "digestion", label: "소화 리듬", score: digestion, verdict: digestion < 55 ? "민감하게 반응" : "관리 가능" },
      { key: "tension", label: "긴장 회복", score: tension, verdict: tension < 55 ? "스트레스 영향 큼" : "회복 가능" },
    ];
    const weakest = [...metrics].sort((a, b) => a.score - b.score)[0];
    const cautionStart = 34 + (seed % 18);
    return {
      sajuFoundation,
      kind: "health",
      version: "health-preview-profile-v171",
      grade: getHealthGrade(manse),
      overallScore: clampPreviewScore((recovery + sleep + digestion + tension) / 4),
      metrics,
      primaryWeakness: weakest.label,
      firstSignal: health.core,
      avoidHabit: safeText(health.avoid?.[0], "몸의 신호를 무시하고 계속 버티는 습관"),
      recoveryAction: safeText(health.action?.[0], "수면과 식사 시간을 먼저 고정하기"),
      cautionWindow: `${cautionStart}~${cautionStart + 2}세 전후`,
      medicalNotice: "사주상 생활 리듬과 취약 경향을 보는 참고 정보이며 질병 진단이나 치료 지시가 아니다.",
    };
  }

  if (categoryId === "compatibility" || categoryTitle.includes("궁합")) {
    const visual = scoreVisual && scoreVisual.kind === "compatibility" ? scoreVisual : null;
    if (!visual) return null;
    const metrics = visual.relationshipMetrics.map((m) => ({ key: m.key, label: m.label, score: clampPreviewScore(m.score), verdict: m.verdict }));
    const strongestMetric = [...metrics].sort((a, b) => b.score - a.score)[0] || { key: "fit", label: "전체 호흡", score: visual.overall.score, verdict: visual.overall.verdict };
    const weakestMetric = [...metrics].sort((a, b) => a.score - b.score)[0] || strongestMetric;
    return {
      sajuFoundation,
      kind: "compatibility",
      version: "compatibility-preview-profile-v171",
      overallScore: clampPreviewScore(visual.overall.score),
      grade: visual.overall.grade,
      verdict: visual.overall.verdict,
      loveScore: clampPreviewScore(visual.headlineScores.love),
      marriageScore: clampPreviewScore(visual.headlineScores.marriage),
      intimacyScore: visual.headlineScores.intimacy === null ? null : clampPreviewScore(visual.headlineScores.intimacy),
      mutualAttraction: clampPreviewScore(visual.attraction.mutual),
      strongestMetric,
      weakestMetric,
      conflictPoint: weakestMetric.verdict,
    } as any;
  }

  if (categoryId === "monthly" || categoryTitle.includes("올해")) {
    const yearProfile = getYearlyProfile(manse);
    const months = distinctMonths(seed, 5);
    const baseYearProfile: any = {
      kind: "year",
      version: "year-preview-profile-v202",
      year: new Date().getFullYear(),
      overallScore: clampPreviewScore(58 + (seed % 29) + snap.fire + wealth * 2 - Math.max(0, snap.earth - 4) * 2),
      theme: yearProfile.type,
      headline: yearProfile.core,
      bestMonth: months[0],
      moneyMonth: months[1],
      careerMonth: months[2],
      relationshipWarningMonth: months[3],
      healthWarningMonth: months[4],
      action: safeText(yearProfile.action?.[0], "되는 흐름 하나를 골라 집중하기"),
      avoid: safeText(yearProfile.avoid?.[0], "한꺼번에 크게 벌이기"),
    };
    const total = buildYearTotalProfileV199({ user, manse, fortuneSeed, baseProfile: baseYearProfile });
    return {
      ...baseYearProfile,
      ...total,
      freeVerdict: `올해는 ${total.strongestArea}을 살리고 ${total.weakestArea}에서 무리하지 않는 해다. 전체 점수 ${total.overallScore}점으로, 모든 운을 같이 밀기보다 강한 흐름을 정확히 잡는 쪽이 유리하다.`,
      strongestText: `${total.strongestArea}이 올해 가장 강하다. ${yearAreaAdviceV202(total.strongestArea, ({재물운:total.moneyScore,직장운:total.careerScore,사업운:total.businessScore,연애운:total.loveScore,결혼운:total.marriageScore,인간관계운:total.relationshipScore,건강운:total.healthScore} as any)[total.strongestArea] || total.overallScore, true)}`,
      weakestText: `${total.weakestArea}은 올해 가장 약한 축이다. ${yearAreaAdviceV202(total.weakestArea, ({재물운:total.moneyScore,직장운:total.careerScore,사업운:total.businessScore,연애운:total.loveScore,결혼운:total.marriageScore,인간관계운:total.relationshipScore,건강운:total.healthScore} as any)[total.weakestArea] || total.overallScore, false)}`,
      bestMonthText: `${total.bestMonth} 전후는 올해 가장 운이 강하게 붙는 달이다. 제안·연락·계약·정리처럼 결과가 남는 행동 하나를 만들어야 이 달의 운을 제대로 쓴다.`,
      cautionMonthText: `${total.cautionMonth} 전후는 급한 결정과 사람 부탁을 조심할 달이다. 무조건 나쁜 달이 아니라 약한 운에서 손실을 키우지 말아야 하는 달이다.`,
      curiosityHook: `그런데 올해 돈이 들어오는 달과 돈이 새는 달은 서로 다르다. 일·사업이 크게 움직이는 달, 인연이 움직이는 달, 생활리듬을 조심할 달까지 확인해야 올해 운을 제대로 쓸 수 있다.`,
    } as any;
  }

  if (categoryId === "lifeFlow" || categoryTitle.includes("대운")) {
    const life = getLifeProfile(manse);
    const majorLuckCountText = getMajorLuckChanceCount(manse);
    const chanceCount = majorLuckCountText.startsWith("3") ? 3 : 2;
    const base = clampPreviewScore(55 + wealth * 2 + output * 2 + authority + resource);
    const curve: PreviewScoreItem[] = [
      { key: "20s", label: "20대", score: clampPreviewScore(base - 8 + (seed % 9)), verdict: "기준을 만드는 시기" },
      { key: "30s", label: "30대", score: clampPreviewScore(base + 2 + (Math.floor(seed / 3) % 8)), verdict: "방향을 다시 잡는 시기" },
      { key: "40s", label: "40대", score: clampPreviewScore(base + 13 + (Math.floor(seed / 5) % 9)), verdict: "돈과 일이 굵어지는 시기" },
      { key: "50s", label: "50대", score: clampPreviewScore(base + 7 + (Math.floor(seed / 7) % 8)), verdict: "지키고 키우는 시기" },
      { key: "60s", label: "60대 이후", score: clampPreviewScore(base + 4 + (Math.floor(seed / 11) % 7)), verdict: "남길 것을 고르는 시기" },
    ];
    const biggest = [...curve].sort((a, b) => b.score - a.score)[0];
    const caution = [...curve].sort((a, b) => a.score - b.score)[0];
    const firstRise = `${timing.firstMoneyAge}~${timing.firstMoneyAge + 2}세`;
    const strongWindow = `${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세`;

    return {
      sajuFoundation,
      kind: "lifeFlow",
      version: "lifeflow-preview-profile-v224",
      chanceCount,
      headline: life.type,
      curve,
      firstRise,
      biggestWindow: biggest.label,
      cautionWindow: caution.label,
      lateLife: safeText(curve[curve.length - 1]?.verdict, "안정과 정리가 중요해지는 흐름"),
      freeVerdict: `네 인생은 초반 결과만 보고 결론 내리면 안 된다. ${firstRise} 전후부터 돈과 일을 보는 기준이 달라지고, ${biggest.label}에는 그동안 쌓은 경험을 실제 자기 몫으로 바꾸는 힘이 커진다.`,
      firstRiseText: `${firstRise} 전후는 첫 번째로 방향을 다시 잡는 구간이다. 그냥 버티는 일보다 내 이름·기술·경력·거래처럼 앞으로도 남는 것이 무엇인지 따지기 시작한다. 이 시기에 직장, 역할, 돈 버는 방식 중 하나가 실제로 달라졌다면 인생 흐름이 움직인 흔적으로 본다.`,
      biggestWindowText: `${biggest.label}은 네 인생에서 돈과 일이 함께 굵어지는 축으로 잡힌다. 단순히 바빠지는 시기가 아니라 책임·권한·가격·거래처·고객처럼 '내 몫'이 커지는 변화가 중요하다. 다만 ${strongWindow} 가운데에서도 실제로 가장 강하게 잡아야 할 핵심 구간은 전체 리포트에서 따로 공개한다.`,
      cautionWindowText: `${caution.label}은 성공을 서두르기보다 기준을 만드는 쪽이 중요한 구간이다. 남들이 가는 속도에 맞추거나 사람 말만 따라 움직이면 돌아갈 수 있다. 대신 맞지 않는 일과 사람, 돈이 남지 않는 선택을 걸러낸 경험이 뒤의 큰 운을 받치는 재료가 된다.`,
      lateLifeText: `후반 인생은 새 판을 계속 벌이는 것보다 무엇을 남길지가 중요해진다. 돈은 반복해서 들어오는 구조와 자산으로 묶고, 사람은 오래 갈 관계를 남기고, 일은 몸을 계속 갈아 넣지 않아도 유지되는 방식으로 바꾸는 쪽이 맞다.`,
      dohoonHook: `그런데 진짜 중요한 건 ${biggest.label} 전체가 아니다. 네 인생에는 판이 크게 바뀌는 문이 몇 차례 들어오고, 그중 반드시 잡아야 할 핵심 대운의 정확한 나이와 연도가 따로 있다.`,
      lockedItems: [
        "내 인생에 큰 대운이 총 몇 번 들어오는가",
        "제1·제2·제3대운의 정확한 나이와 연도",
        "그중 인생에서 가장 중요한 대운",
        "그 대운에서 반드시 잡아야 하는 기회",
        "돈이 가장 굵어지는 시기와 일이 바뀌는 시기",
        "현재 나는 대운 전·중·후 어디에 있는가",
      ],
    } as any;
  }

  if (categoryId === "traditional" || categoryTitle.includes("평생")) {
    const career = getCareerArchetype(manse);
    const loveVisual = getLoveMarriageScoreVisual(user, manse, seed);
    const money = clampPreviewScore(56 + wealth * 7 + output * 3 + snap.earth * 2 + snap.water);
    const work = clampPreviewScore(58 + Math.max(...career.scores.map((x: any) => Number(x.score || 0))) * 3 + authority * 2);
    const love = clampPreviewScore((loveVisual.love.overall + loveVisual.marriage.overall) / 2);
    const health = clampPreviewScore(62 + snap.fire * 2 + snap.water * 2 + snap.metal * 2 - Math.max(0, snap.earth - 3) * 4);
    const people = clampPreviewScore(60 + peer * 4 + authority * 2 + resource - Math.abs(output - resource) * 2);
    const greatLuck = clampPreviewScore(65 + (seed % 24) + Math.max(wealth, authority, resource) * 2);
    const metrics: PreviewScoreItem[] = [
      { key: "money", label: "재물복", score: money, verdict: "돈이 남는 힘" },
      { key: "career", label: "일복", score: work, verdict: "역할과 성취의 힘" },
      { key: "love", label: "사랑·결혼복", score: love, verdict: "관계를 오래 가져가는 힘" },
      { key: "health", label: "건강 리듬", score: health, verdict: "운을 버텨내는 힘" },
      { key: "people", label: "인복", score: people, verdict: "사람과 기회를 연결하는 힘" },
      { key: "greatLuck", label: "대운", score: greatLuck, verdict: "판이 바뀌는 힘" },
    ];
    const strongestBlessing = [...metrics].sort((a, b) => b.score - a.score)[0];
    const weakestHole = [...metrics].sort((a, b) => a.score - b.score)[0];

      // V231: 평생종합 무료에서도 핵심 돈그릇을 바로 보여준다.
      // 직업별 연봉과 혼동하지 않고 '장기 자산 목표권'으로 명확히 표시한다.
      const lifetimeFreeDetail = getCareerDetailedProfile(manse);
      const lifetimeFreeCore = getLifetimeCoreCareerDetailV233(lifetimeFreeDetail);
      const lifetimeFreeMainCareer = lifetimeFreeCore.first;
      const lifetimeFreeMoneyBowl =
        resolveLifetimeMoneyBowlV232(lifetimeFreeDetail, lifetimeFreeCore);

      const moneyBowlPreview = lifetimeFreeMoneyBowl ? {
        label: "내 평생 돈그릇",
        amount: lifetimeFreeMoneyBowl,
        mainPath: safeText((lifetimeFreeMainCareer as any)?.label, "주력 돈길"),
        jobs: safeText((lifetimeFreeMainCareer as any)?.jobs, ""),
        meaning:
          "이 금액은 연봉이나 한 해 수입이 아니라, 본업·부업·거래·사업에서 남긴 돈을 장기간 자산으로 쌓았을 때 보는 상단 목표권이다.",
        hook:
          "같은 돈그릇을 타고나도 실제로 채우는 사람과 못 채우는 사람이 갈린다. 유료에서는 무엇을 해서 돈을 키우는지, 직장·부업·사업 중 어디서 돈이 가장 커지는지까지 이어서 본다.",
      } : null;
    return {
      sajuFoundation,
      kind: "lifetime",
      version: "lifetime-preview-profile-v171",
      headline: `네 인생에서 가장 강한 복은 ${strongestBlessing.label}이다`,
      metrics,
      strongestBlessing,
      weakestHole,
      turningWindow: `${timing.strongMoneyAge}~${timing.strongMoneyAge + 3}세 전후`,
      coreAdvice: `${strongestBlessing.label}을 살리되 ${weakestHole.label}에서 반복해서 새는 선택을 막아야 전체 운이 커진다.`,
      moneyBowlPreview,
        paidHookTitle: `${strongestBlessing.label}이 강하다고 끝이 아니다`,
      paidHookBody: `진짜 중요한 건 이 강한 복이 몇 살부터 실제 돈·자리·관계의 변화로 나타나는지다. 특히 ${timing.strongMoneyAge}세 전후부터는 평생의 직업축과 돈 버는 방식이 같이 움직이는 구간을 따로 봐야 한다.`,
      paidHookQuote: `네 사주에서 가장 강한 복을 실제 돈과 자리로 바꾸는 시기가 따로 있다.`,
      paidLockedItems: [
        "내 사주에 가장 돈이 되는 직업 1·2·3순위",
        "직장·부업·사업 중 어디에서 돈이 가장 커지는지",
        "각 직업축에서 현실적으로 보는 돈의 크기",
        "돈과 일이 동시에 커지는 정확한 인생 구간",
        "좋은 운이 와도 놓치게 만드는 반복 패턴",
        "사랑·사람·건강에서 크게 흔들리는 시기",
        "크게 열리는 대운과 말년에 결국 남는 것",
      ],
      paidCtaLabel: "내 평생 직업·돈·대운 전체 보기",
    };
  }

  if (categoryId === "premium") {
    const worry = getWorryProfile(manse, user.question || "");
    const verdicts: Array<"밀어라" | "기다려라" | "멈춰라" | "조건부 진행"> = ["조건부 진행", "기다려라", "밀어라", "멈춰라"];
    const verdict = verdicts[seed % verdicts.length];
    return {
      sajuFoundation,
      kind: "worry",
      version: "worry-preview-profile-v171",
      verdict,
      headline: `${verdict}: ${worry.type}`,
      reasons: [worry.core, worry.risk].filter(Boolean),
      avoidNow: safeText(worry.avoid?.[0], "감정적으로 바로 결정하기"),
      doNow: safeText(worry.action?.[0], "결정 기준을 하나로 좁히기"),
    };
  }

  return null;
}


type PersonalWebtoonFingerprint = {
  strongElement: string;
  weakElement: string;
  dominantTenGod: "비겁" | "식상" | "재성" | "관성" | "인성";
  dominantTenGodCount: number;
  secondaryTenGod: "비겁" | "식상" | "재성" | "관성" | "인성";
  strongImage: string;
  weakImage: string;
  coreSentence: string;
  riskSentence: string;
  relationSentence: string;
  moneySentence: string;
  workSentence: string;
  healthSentence: string;
};

function pickStableWebtoonLine<T>(
  seed: number,
  salt: string,
  values: readonly T[],
): T {
  return values[hashToSeed(`${seed}:${salt}:v177-personal-story` ) % values.length];
}

function buildPersonalWebtoonFingerprint(
  user: UserInfo,
  manse: any,
  seed: number,
): PersonalWebtoonFingerprint {
  const snap = getElementSnapshot(manse);
  const ten = getTenGodCounts(manse);

  const groups = [
    { key: "비겁" as const, count: countTenGodGroup(ten, ["비견", "겁재"]) },
    { key: "식상" as const, count: countTenGodGroup(ten, ["식신", "상관"]) },
    { key: "재성" as const, count: countTenGodGroup(ten, ["편재", "정재"]) },
    { key: "관성" as const, count: countTenGodGroup(ten, ["편관", "정관"]) },
    { key: "인성" as const, count: countTenGodGroup(ten, ["편인", "정인"]) },
  ].sort((a, b) => b.count - a.count);

  const dominant = groups[0];
  const secondary = groups[1] || groups[0];

  const strongElement = String(snap.strongestElement || "토");
  const weakElement = String(snap.weakestElement || "화");

  const strongImages: Record<string, string[]> = {
    목: ["막힌 틈을 찾아 위로 뻗는 힘", "한 번 방향이 잡히면 끝까지 자라는 힘", "새 판을 만들려는 가지"],
    화: ["사람 앞에서 살아나는 불씨", "분위기와 표현을 밀어 올리는 불", "움직이기 시작하면 속도가 붙는 불"],
    토: ["무게를 받아도 쉽게 무너지지 않는 담", "현실을 오래 버티는 바닥", "돈과 책임을 담는 그릇"],
    금: ["아닌 것을 잘라내는 칼", "기준과 가격을 세우는 쇠", "복잡한 것을 정리하는 칼날"],
    수: ["남보다 먼저 흐름을 읽는 깊은 물", "사람 말 뒤를 읽는 물", "생각과 감정을 오래 품는 물"],
  };

  const weakImages: Record<string, string[]> = {
    목: ["새 방향을 정하는 순간이 늦어지는 자리", "막힌 뒤 다른 길을 찾는 데 시간이 걸리는 자리"],
    화: ["표현과 회복의 불씨가 늦게 붙는 자리", "기분이 꺼진 뒤 다시 올라오는 데 시간이 필요한 자리"],
    토: ["돈과 책임을 한꺼번에 담으면 그릇이 흔들리는 자리", "남의 짐까지 안으면 내 몫이 흐려지는 자리"],
    금: ["아닌 걸 알아도 끊는 칼이 늦게 나오는 자리", "가격·거리·기준을 늦게 세우는 자리"],
    수: ["쉬어야 할 때도 머리가 계속 도는 자리", "감정을 오래 품어 회복이 늦어지는 자리"],
  };

  const strongImage = pickStableWebtoonLine(seed, "strong-image", strongImages[strongElement] || ["타고난 강한 축"]);
  const weakImage = pickStableWebtoonLine(seed, "weak-image", weakImages[weakElement] || ["반복해서 흔들리는 축"]);

  const coreByTenGod = {
    비겁: [
      "혼자 책임질 때보다 네 몫과 남의 몫을 정확히 갈라야 운이 산다.",
      "사람 사이에서 경쟁과 의리가 같이 붙기 때문에 선을 잘못 잡으면 네 몫이 샌다.",
    ],
    식상: [
      "머릿속에만 두면 막히고, 말·기술·표현으로 밖에 꺼내야 운이 열린다.",
      "네가 직접 설명하고 만들고 보여줄 때 일이 돈으로 바뀐다.",
    ],
    재성: [
      "돈은 감으로 잡는 게 아니라 가격·거래·회수 시점을 네 손에 쥘 때 붙는다.",
      "사람과 돈이 움직이는 판을 읽는 힘은 있는데, 기준이 흐려지면 새는 돈도 커진다.",
    ],
    관성: [
      "책임과 역할이 분명할수록 강하지만, 권한 없이 짐만 지면 운이 눌린다.",
      "직함과 기준이 있는 자리에서 버티는 힘은 강한데, 남의 책임까지 들면 피로가 먼저 온다.",
    ],
    인성: [
      "생각과 준비는 깊지만, 확신을 기다리다 시작 버튼이 늦어질 수 있다.",
      "남보다 오래 보고 판단하는 힘은 있지만, 머릿속에서만 돌면 기회를 놓친다.",
    ],
  } as const;

  const riskByWeak: Record<string, string> = {
    목: "방향이 흐려지면 괜찮은 선택지도 오래 비교하다 타이밍을 놓친다.",
    화: "기분과 체력이 같이 꺼지는 날에는 작은 일도 크게 느껴져 반응이 거칠어질 수 있다.",
    토: "사람 일과 돈 일을 동시에 떠안으면 내 몫과 남의 몫이 섞여 손해가 난다.",
    금: "아닌 걸 알면서도 끊는 말을 늦추면 돈과 관계가 같이 길어진다.",
    수: "생각이 깊어질수록 답을 늦추고, 늦어진 답이 다시 불안을 키운다.",
  };

  const relationByTenGod = {
    비겁: "관계에서는 상대와 힘겨루기가 시작되는 순간 마음이 빨리 닫힌다.",
    식상: "관계에서는 말투와 표현 하나가 끌림도 만들고 서운함도 만든다.",
    재성: "관계에서는 상대의 태도보다 생활감·돈 기준·약속 지키는 모습을 오래 본다.",
    관성: "관계에서는 책임감 있는 사람에게 끌리지만, 통제받는 느낌이 들면 오래 못 버틴다.",
    인성: "관계에서는 마음이 열리기 전까지 오래 보며, 한번 서운하면 머릿속에서 여러 번 되짚는다.",
  } as const;

  const moneyByTenGod = {
    비겁: "돈은 사람과 같이 움직일 때 생기지만, 정과 의리 때문에 네 몫이 새기 쉽다.",
    식상: "돈은 네가 직접 만든 결과·설명·기술을 밖으로 팔 때 붙는다.",
    재성: "돈은 가격·거래·마진·회수를 직접 볼 때 가장 선명하게 붙는다.",
    관성: "돈은 책임 있는 자리와 안정된 역할에서 먼저 쌓이고, 그 신용이 자산으로 이어질 때 커진다.",
    인성: "돈은 준비와 전문성을 돈 받을 상품으로 바꾸는 순간부터 붙는다.",
  } as const;

  const workByTenGod = {
    비겁: "일에서는 네 몫이 분명한 자리여야 오래 간다. 역할이 겹치면 경쟁과 피로가 같이 붙는다.",
    식상: "일에서는 네 판단·말·기술이 결과에 바로 찍히는 자리가 맞다.",
    재성: "일에서는 매출·가격·거래처·받을 돈이 눈앞에 보이는 자리가 맞다.",
    관성: "일에서는 책임과 권한이 같이 커지는 자리가 맞고, 책임만 커지는 자리는 버려야 한다.",
    인성: "일에서는 분석·자격·전문성으로 몸값이 올라가는 자리가 맞다.",
  } as const;

  const healthByWeak: Record<string, string> = {
    목: "몸은 오래 한 자세로 굳거나 답답함이 쌓일 때 먼저 신호를 보낸다.",
    화: "몸은 수면이 깨지고 기분이 꺼질 때 회복 속도가 먼저 떨어진다.",
    토: "몸은 과식·불규칙한 식사·오래 버티는 생활에서 컨디션이 먼저 흔들린다.",
    금: "몸은 긴장과 목·어깨처럼 굳는 느낌으로 피로가 먼저 드러나기 쉽다.",
    수: "몸은 잠을 자도 머리가 쉬지 않는 날에 피로가 길게 남기 쉽다.",
  };

  return {
    strongElement,
    weakElement,
    dominantTenGod: dominant.key,
    dominantTenGodCount: dominant.count,
    secondaryTenGod: secondary.key,
    strongImage,
    weakImage,
    coreSentence: pickStableWebtoonLine(seed, "core-ten", coreByTenGod[dominant.key]),
    riskSentence: riskByWeak[weakElement] || "강한 축을 과하게 쓰는 순간 약한 축에서 손해가 난다.",
    relationSentence: relationByTenGod[dominant.key],
    moneySentence: moneyByTenGod[dominant.key],
    workSentence: workByTenGod[dominant.key],
    healthSentence: healthByWeak[weakElement] || "몸은 오래 버틴 뒤에 신호가 늦게 올라오는 편이다.",
  };
}

function buildSharedCategoryWebtoonScenes(params: {
  user: UserInfo;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed: number;
  profile: CategoryPreviewProfile;
  categoryTitle: string;
}): CareerWebtoonScene[] {
  const protagonistGender: "male" | "female" =
    params.user.gender === "여성" ? "female" : "male";
  const p: any = params.profile;
  const kind = p.kind as CategoryPreviewProfile["kind"];
  const seed = Math.abs(Math.floor(params.fortuneSeed || 1));
  const fp = buildPersonalWebtoonFingerprint(params.user, params.manse, seed);
  const today = getKoreaTodayInfo();
  const status = normalizeMaritalStatus(params.user);

  const scene = (
    order: number,
    dohoonImageKey: CareerWebtoonScene["dohoonImageKey"],
    mood: CareerWebtoonScene["mood"],
    shot: CareerWebtoonScene["shot"],
    dialogue: string,
    emphasis?: string,
    narration?: string,
    locked = false,
    bullets?: string[],
  ): CareerWebtoonScene => ({
    id: `${kind}-${String(order).padStart(2, "0")}-${seed % 997}`,
    order,
    sceneKey: `${kind}_${dohoonImageKey}_${order}_${protagonistGender}_${seed % 10007}`,
    dohoonImageKey,
    intensity: (order === 1 ? 1 : order === 2 ? 2 : order === 4 || order === 6 ? 4 : order >= 7 ? 5 : 3),
    protagonistGender,
    cast: order === 1 || order === 5 ? "both" : "dohoon",
    mood,
    shot,
    dialogue,
    emphasis,
    narration,
    bullets,
    locked,
  });

  if (kind === "career" && Array.isArray(p.webtoonScenes) && p.webtoonScenes.length) {
    // 기존 커리어 9컷도 공통 고정문장처럼 보이지 않게 첫/반전/경고 장면에 개인 지문을 얹는다.
    return p.webtoonScenes.map((item: CareerWebtoonScene, index: number) => {
      if (index === 0) {
        return {
          ...item,
          sceneKey: `${item.sceneKey}_${seed % 10007}`,
          narration: fp.workSentence,
          emphasis: item.emphasis || fp.coreSentence,
        };
      }
      if (item.dohoonImageKey === "warning") {
        return {
          ...item,
          sceneKey: `${item.sceneKey}_${seed % 10007}`,
          narration: fp.riskSentence,
        };
      }
      if (item.dohoonImageKey === "reveal" || item.dohoonImageKey === "analysis") {
        return {
          ...item,
          sceneKey: `${item.sceneKey}_${seed % 10007}`,
          narration: `${fp.strongElement} 쪽 ${fp.strongImage}이 강하고, ${fp.weakElement} 쪽 ${fp.weakImage}이 약점으로 잡힌다.`,
        };
      }
      return { ...item, sceneKey: `${item.sceneKey}_${seed % 10007}` };
    });
  }

  if (kind === "today") {
    const dayPart = today.isWeekend
      ? "주말이라 회사 일보다 사람 연락·지출·다음 주 준비에서 운이 먼저 튄다."
      : "평일이라 업무 연락·거래·말투에서 운이 먼저 드러난다.";
    const relationLine =
      status === "기혼"
        ? "저녁에는 새 인연보다 배우자·가족과의 말투가 더 중요하다."
        : status === "연애중"
          ? "저녁에는 새 사람보다 현재 연인의 답장 속도와 말투를 크게 보게 된다."
          : "저녁에는 사람 하나를 오래 생각하거나 연락 타이밍을 재기 쉽다.";

    return [
      scene(
        1, "opening", "tense", "wide",
        pickStableWebtoonLine(seed, "today-open", [
          `오늘 네 운은 '${p.strongestArea}'에서 먼저 열린다. 그런데 ${p.warningArea}에서 바로 시험이 붙는다.`,
          `오늘은 좋은 운과 나쁜 운이 반반이 아니다. ${p.strongestArea}은 살고, ${p.warningArea}은 확실히 조심해야 한다.`,
          `오늘 네 사주에서 먼저 튀는 건 ${p.strongestArea}이다. 문제는 그 힘을 너무 쓰면 ${p.warningArea}에서 역으로 꼬인다는 거다.`,
        ]),
        `${p.overallScore}점 · ${p.verdict}`,
        `${fp.dominantTenGod} 흐름이 먼저 튄다. ${fp.coreSentence} ${dayPart}`,
      ),
      scene(
        2, "analysis", "reveal", "closeup",
        `${fp.strongElement} 쪽 힘이 오늘 먼저 살아난다.`,
        `${fp.strongImage} · ${p.bestTime}`,
        `${p.bestTime} 전후에는 ${p.strongestArea}과 관련된 일을 미루지 않는 편이 낫다.`,
      ),
      scene(
        3, "reveal", "reveal", "medium",
        `근데 네가 오늘 실수하는 방식은 남들과 다르다.`,
        fp.riskSentence,
        `${fp.weakElement} 쪽 ${fp.weakImage}이 오늘 약점으로 튄다.`,
      ),
      scene(
        4, "warning", "warning", "closeup",
        `특히 ${p.warningArea}에서는 '괜찮겠지' 하고 바로 반응하지 마.`,
        p.avoidOne,
        pickStableWebtoonLine(seed, "today-warning", [
          "오늘 한 번 꼬이면 큰일이 나는 날이 아니라, 작은 실수가 연달아 붙기 쉬운 날이다.",
          "오늘 손해는 큰 사건보다 말 한마디·결제 한 번·답장 한 번에서 시작된다.",
          "오늘은 운이 약해서가 아니라 반응이 빨라질 때 실수가 붙는 날이다.",
        ]),
      ),
      scene(
        5, "decision", "gold", "medium",
        `오늘 운을 살리는 행동은 복잡하지 않다.`,
        p.doOne,
        `${fp.coreSentence} 그래서 하나만 끝내고 다음으로 넘어가는 방식이 맞다.`,
      ),
      scene(
        6, "future", "hope", "wide",
        relationLine,
        `${p.bestTime} 이후에는 속도를 조금 낮춰라.`,
        `${fp.relationSentence}`,
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        p.paidHookTitle || "오늘 운은 여기서 한 번 더 갈린다.",
        p.paidHookQuote || `오늘은 잘되는 걸 더 하는 것보다 ${p.warningArea}에서 잘못 건드리지 않는 게 더 중요해.`,
        p.paidFinalHook || `${p.strongestArea}이 살아나는 순간과 ${p.warningArea}에서 실수하는 순간을 같이 확인해야 오늘 운을 제대로 쓴다.`,
        true,
      ),
    ];
  }

  if (kind === "money") {
    return [
      scene(
        1, "opening", "gold", "wide",
        pickStableWebtoonLine(seed, "money-open", [
          `네 돈그릇은 ${p.capacityRange}. 문제는 크기가 아니라 지금 그릇을 얼마나 쓰고 있느냐다.`,
          `돈복부터 말하면 ${p.capacityGrade}. 그런데 네 사주에서 진짜 문제는 돈이 안 들어오는 게 아니다.`,
          `네 재물운은 작은 돈만 만지다 끝나는 판은 아니다. 다만 맞는 돈길과 틀린 돈길 차이가 크다.`,
        ]),
        `${p.capacityGrade} · 현재 활용도 ${p.utilization}%`,
        fp.moneySentence,
      ),
      scene(
        2, "analysis", "reveal", "closeup",
        `${fp.strongElement}의 ${fp.strongImage}이 돈을 만드는 쪽에 쓰인다.`,
        p.primaryStyle,
        `${fp.dominantTenGod}이 강해서 ${fp.moneySentence}`,
      ),
      scene(
        3, "reveal", "reveal", "medium",
        "근데 벌 때보다 남길 때 성격이 더 선명하게 드러난다.",
        fp.riskSentence,
        `${fp.weakElement}의 ${fp.weakImage}이 돈의 구멍이 되기 쉽다.`,
      ),
      scene(
        4, "warning", "warning", "closeup",
        "네 돈이 가장 빨리 새는 장면은 이쪽이다.",
        p.blocker,
        pickStableWebtoonLine(seed, "money-leak", [
          "큰돈을 못 벌어서가 아니라, 들어온 돈의 기준이 흐려질 때 재물운이 무너진다.",
          "매출보다 남는 돈을 먼저 봐야 한다. 바쁜데 통장에 안 남는 판은 버려야 한다.",
          "사람 말에 끌려가거나 먼저 큰돈을 묶는 선택은 네 돈그릇을 닫는다.",
        ]),
      ),
      scene(
        5, "decision", "gold", "medium",
        "그래서 네 재물운은 '무엇을 할까'보다 '어떻게 받을까'가 먼저다.",
        p.primaryStyle,
        "가격·조건·회수 시점을 네 손에 쥐는 구조가 잡혀야 돈이 남는다.",
      ),
      scene(
        6, "future", "hope", "wide",
        "첫 돈문은 이미 따로 잡혀 있다.",
        p.firstWindow,
        "이때는 크게 벌리는 시기보다 돈이 남는 구조를 만드는 쪽이 중요하다.",
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "진짜 큰 돈문은 그 뒤에 온다.",
        `최대 재물 구간 ${p.peakWindow}`,
        "전체판에서는 이 시기에 어떤 일·사업·거래에서 돈이 굵어지는지까지 이어서 본다.",
        true,
      ),
    ];
  }

  if (kind === "love") {
    const statusLead =
      status === "기혼"
        ? "지금은 새 인연보다 배우자와 생활·말·돈 기준이 맞는지가 먼저다."
        : status === "연애중"
          ? "지금은 새 사람보다 현재 관계가 결혼까지 버틸 구조인지가 먼저다."
          : status === "이혼/재혼 고민"
            ? "새 인연보다 과거에 반복한 사람 선택을 끊는 게 먼저다."
            : "인연이 들어오느냐보다 네가 어떤 사람에게 반복해서 약해지는지가 먼저다.";

    return [
      scene(
        1, "opening", "tense", "wide",
        statusLead,
        p.headline,
        fp.relationSentence,
      ),
      scene(
        2, "reveal", "reveal", "closeup",
        `${fp.dominantTenGod}이 관계에서 이렇게 튄다.`,
        fp.relationSentence,
        `${fp.strongElement}의 ${fp.strongImage} 때문에 처음 끌림보다 상대의 태도를 오래 본다.`,
      ),
      scene(
        3, "analysis", "gold", "medium",
        "끌리는 사람과 오래 갈 사람은 같은 사람이 아니다.",
        `연애 ${p.loveScore} · 결혼 ${p.marriageScore}`,
        p.partnerDescription,
      ),
      scene(
        4, "warning", "warning", "closeup",
        "네가 특히 오래 끌려다니기 쉬운 상대는 이쪽이다.",
        p.avoidPartner,
        `${fp.weakElement}의 ${fp.weakImage}이 관계에서 약점이 될 때 ${p.relationshipRisk}`,
      ),
      scene(
        5, "decision", "hope", "medium",
        "관계를 살리는 기준은 감정 확인보다 이쪽이다.",
        p.relationshipRisk,
        "좋아한다는 말보다 반복 행동과 생활 기준이 맞는지를 봐야 오래 간다.",
      ),
      scene(
        6, "future", "hope", "wide",
        "인연이 강해지는 구간도 따로 잡힌다.",
        p.strongWindow,
        "이 시기에는 사람 수보다 한 사람의 태도를 오래 보는 게 맞다.",
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "그리고 네가 실제로 끌리는 얼굴·분위기와 결혼까지 가는 사람은 한 번 더 갈린다.",
        p.partnerTitle,
        "전체판에서 상대 유형·시기·결혼 기준을 이어서 공개한다.",
        true,
      ),
    ];
  }

  if (kind === "health") {
    return [
      scene(
        1, "opening", "tense", "wide",
        "네 몸은 약해서 무너지는 타입이라기보다, 버티다가 신호가 늦게 크게 올라오는 쪽이다.",
        `${p.grade} · ${p.overallScore}점`,
        fp.healthSentence,
      ),
      scene(
        2, "analysis", "reveal", "closeup",
        `${fp.weakElement} 쪽 ${fp.weakImage}이 몸에서도 먼저 드러난다.`,
        p.primaryWeakness,
        p.firstSignal,
      ),
      scene(
        3, "reveal", "reveal", "medium",
        "네가 '괜찮다'고 넘기는 순간이 오히려 체크 포인트다.",
        fp.riskSentence,
        "사주상 취약 경향을 생활 리듬으로 보는 것이지 질병을 확정하는 건 아니다.",
      ),
      scene(
        4, "warning", "warning", "closeup",
        "이 습관은 네 회복 속도를 가장 빨리 깎는다.",
        p.avoidHabit,
        fp.healthSentence,
      ),
      scene(
        5, "decision", "gold", "medium",
        "반대로 몸을 살리는 첫 행동은 하나면 된다.",
        p.recoveryAction,
        "한꺼번에 다 바꾸는 것보다 수면·식사·휴식 중 가장 흔들리는 하나를 먼저 고정해라.",
      ),
      scene(
        6, "future", "hope", "wide",
        "몸이 특히 흔들리기 쉬운 구간도 따로 잡힌다.",
        p.cautionWindow,
        p.medicalNotice,
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "전체판에서는 네 몸이 먼저 보내는 신호와 생활 리듬을 더 세분해서 본다.",
        p.primaryWeakness,
        p.medicalNotice,
        true,
      ),
    ];
  }

  if (kind === "compatibility") {
    const partnerFp = params.partnerManse
      ? buildPersonalWebtoonFingerprint(params.user, params.partnerManse, seed + 131)
      : null;

    return [
      scene(
        1, "opening", "tense", "split",
        "둘이 좋아하는지만 보면 궁합이 반쪽이다. 누가 더 빨리 달아오르고 누가 더 늦게 마음을 여는지부터 봐야 한다.",
        `${p.overallScore}점 · ${p.grade}`,
        p.verdict,
      ),
      scene(
        2, "reveal", "reveal", "medium",
        "너는 관계에서 이런 식으로 반응한다.",
        fp.relationSentence,
        partnerFp ? `상대는 ${partnerFp.relationSentence}` : "상대 명식과 맞물리는 부분을 함께 본다.",
      ),
      scene(
        3, "analysis", "gold", "split",
        "연애와 결혼은 같은 점수로 보면 안 된다.",
        `연애 ${p.loveScore} · 결혼 ${p.marriageScore} · 끌림 ${p.mutualAttraction}`,
        `가장 잘 맞는 축은 ${p.strongestMetric?.label || "관계 호흡"}, 가장 약한 축은 ${p.weakestMetric?.label || "생활 기준"}이다.`,
      ),
      scene(
        4, "warning", "warning", "closeup",
        "둘이 반복해서 터질 가능성이 큰 장면은 이거다.",
        p.conflictPoint,
        `네 쪽 약점은 ${fp.weakElement}의 ${fp.weakImage}${partnerFp ? `, 상대 쪽 약점은 ${partnerFp.weakElement}의 ${partnerFp.weakImage}` : ""}.`,
      ),
      scene(
        5, "decision", "hope", "medium",
        "이 관계를 살리려면 약한 점수를 억지로 올리기보다 강한 축을 먼저 써라.",
        `${p.strongestMetric?.label || "강점"} ${p.strongestMetric?.score || ""}`,
        p.strongestMetric?.verdict,
      ),
      scene(
        6, "reveal", "reveal", "medium",
        "가까워졌을 때는 감정 점수와 또 다른 호흡이 나온다.",
        p.intimacyScore == null ? "사업파트너라면 친밀감 대신 역할·돈 호흡을 본다." : `친밀감 ${p.intimacyScore}점`,
        "속도·주도권·표현 방식이 맞는지까지 봐야 실제 체감 궁합이 나온다.",
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "그리고 결혼이나 동업으로 오래 묶였을 때는 돈·생활·가족 기준에서 점수가 다시 갈린다.",
        p.weakestMetric?.label,
        "전체판에서 오래 갔을 때 터지는 장면과 맞추는 방법을 이어서 본다.",
        true,
      ),
    ];
  }

  if (kind === "year") {
    return [
      scene(
        1, "opening", "tense", "wide",
        `${p.year}년의 핵심은 '${p.theme}' 하나로 잡힌다.`,
        p.headline,
        `${fp.dominantTenGod} 흐름이 올해 운에서 먼저 튄다. ${fp.coreSentence}`,
      ),
      scene(
        2, "reveal", "gold", "medium",
        "올해 가장 힘이 붙는 달은 그냥 운이 좋은 달이 아니다. 네 강한 축을 실제로 쓰는 달이다.",
        `${p.bestMonth}월`,
        `${fp.strongElement}의 ${fp.strongImage}이 살아난다.`,
      ),
      scene(
        3, "analysis", "reveal", "split",
        "돈과 일은 같은 달에 같이 열리지 않는다.",
        `돈 ${p.moneyMonth}월 · 일 ${p.careerMonth}월`,
        `${fp.moneySentence} ${fp.workSentence}`,
      ),
      scene(
        4, "warning", "warning", "medium",
        "사람 때문에 흔들리는 달에는 네 약한 축이 먼저 튄다.",
        `${p.relationshipWarningMonth}월`,
        `${fp.weakElement}의 ${fp.weakImage}. ${fp.relationSentence}`,
      ),
      scene(
        5, "warning", "warning", "closeup",
        "몸은 이 달에 무리해서 버티면 안 된다.",
        `${p.healthWarningMonth}월`,
        fp.healthSentence,
      ),
      scene(
        6, "decision", "hope", "medium",
        "올해 하나만 밀어야 한다면 이걸 잡아.",
        p.action,
        "좋은 달을 기다리는 것보다 이 행동을 좋은 달에 맞춰 실행하는 게 중요하다.",
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "올해의 진짜 반전은 좋은 달보다 위험한 선택 하나에 있다.",
        p.avoid,
        "전체판에서 월별로 돈·일·관계·몸의 행동 기준을 이어서 본다.",
        true,
      ),
    ];
  }

  if (kind === "lifeFlow") {
    return [
      scene(
        1, "opening", "mystery", "wide",
        "네 인생은 초반부터 같은 방식으로 풀리는 사주가 아니다.",
        p.headline,
        `${fp.strongElement}의 ${fp.strongImage}은 시간이 갈수록 값이 올라가고, ${fp.weakElement}의 ${fp.weakImage}은 전환기마다 시험으로 나온다.`,
      ),
      scene(
        2, "reveal", "reveal", "medium",
        "첫 번째로 판이 바뀌는 때는 여기다.",
        p.firstRise,
        fp.coreSentence,
      ),
      scene(
        3, "analysis", "gold", "wide",
        "가장 크게 운이 붙는 구간에서는 네 강한 축을 돈과 일로 바꿔야 한다.",
        p.biggestWindow,
        `${fp.moneySentence} ${fp.workSentence}`,
      ),
      scene(
        4, "warning", "warning", "closeup",
        "반대로 이 구간에서는 욕심보다 손실을 막는 게 먼저다.",
        p.cautionWindow,
        fp.riskSentence,
      ),
      scene(
        5, "future", "hope", "back",
        "후반 인생은 초반처럼 버티는 방식으로 살면 안 된다.",
        p.lateLife,
        `후반에는 ${fp.secondaryTenGod} 흐름을 보조축으로 쓰는 게 중요하다.`,
      ),
      scene(
        6, "reveal", "reveal", "medium",
        "큰 전환은 한 번이 아니다.",
        `큰 전환 ${p.chanceCount}회`,
        "각 전환기마다 돈·일·사람 중 중심축이 달라진다.",
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "가장 큰 대운에서 무엇을 버리고 무엇을 잡아야 하는지는 아직 뒤에 있다.",
        p.biggestWindow,
        "전체판에서 전환기마다 실제 행동 기준을 이어서 본다.",
        true,
      ),
    ];
  }

  if (kind === "lifetime") {
    return [
      scene(
        1, "opening", "mystery", "wide",
        "평생사주는 복을 다 나열하는 게 아니다. 가장 센 복과 가장 큰 구멍부터 보면 네 인생 모양이 나온다.",
        p.headline,
        `${fp.dominantTenGod}이 평생 중심축이다. ${fp.coreSentence}`,
      ),
      scene(
        2, "reveal", "gold", "medium",
        "네 평생에서 가장 강한 복은 이쪽이다.",
        `${p.strongestBlessing?.label} ${p.strongestBlessing?.score}점`,
        `${p.strongestBlessing?.verdict}. ${fp.strongElement}의 ${fp.strongImage}이 이 복을 키운다.`,
      ),
      scene(
        3, "warning", "warning", "closeup",
        "반대로 평생 반복해서 새는 구멍은 이쪽이다.",
        `${p.weakestHole?.label} ${p.weakestHole?.score}점`,
        `${p.weakestHole?.verdict}. ${fp.weakElement}의 ${fp.weakImage}이 이 장면에서 튄다.`,
      ),
      scene(
        4, "analysis", "reveal", "medium",
        "복과 구멍이 부딪히는 순간 네 선택 패턴이 드러난다.",
        p.coreAdvice,
        `${fp.moneySentence} ${fp.relationSentence}`,
      ),
      scene(
        5, "future", "hope", "back",
        "인생 판이 크게 바뀌는 시기는 따로 있다.",
        p.turningWindow,
        "이때는 지금까지 버티던 방식보다 강한 축을 실제 돈·역할·관계로 바꾸는 게 중요하다.",
      ),
      scene(
        6, "reveal", "reveal", "medium",
        "돈·일·사람·몸은 따로 움직이지 않는다.",
        `${fp.workSentence}`,
        `${fp.healthSentence}`,
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "초년부터 말년까지 어디서 복이 붙고 어디서 새는지는 전체판에서 한 줄로 이어진다.",
        "평생 전체 판정",
        "전체판에서 재물·일·사랑·건강·인복·대운을 한 흐름으로 연결한다.",
        true,
      ),
    ];
  }

  if (kind === "worry") {
    const question = safeText(params.user.question, "지금 이 선택을 해도 되는지");
    return [
      scene(
        1, "opening", "tense", "wide",
        `네 질문이 "${question.slice(0, 46)}${question.length > 46 ? "…" : ""}"라면, 답부터 자른다.`,
        p.verdict,
        p.headline,
      ),
      scene(
        2, "analysis", "reveal", "closeup",
        "왜 이런 판정이 나왔는지 네 사주형부터 보면 이유가 보인다.",
        fp.coreSentence,
        `${fp.strongElement}의 ${fp.strongImage}은 강점이고, ${fp.weakElement}의 ${fp.weakImage}은 이번 고민에서 흔들리는 자리다.`,
      ),
      scene(
        3, "reveal", "reveal", "medium",
        "이번 고민에서 네가 반복하기 쉬운 실수는 이것이다.",
        fp.riskSentence,
        Array.isArray(p.reasons) ? p.reasons[0] : "",
      ),
      scene(
        4, "warning", "warning", "closeup",
        "지금 가장 먼저 하지 말아야 할 행동은 분명하다.",
        p.avoidNow,
        Array.isArray(p.reasons) ? p.reasons[1] : "",
      ),
      scene(
        5, "decision", "gold", "medium",
        "반대로 지금 해야 할 행동은 하나로 줄여야 한다.",
        p.doNow,
        `${p.verdict} 판정을 실제 행동으로 바꾸는 첫 단계다.`,
      ),
      scene(
        6, "future", "hope", "medium",
        "답은 운명 하나가 아니라 움직이는 순서에 있다.",
        p.verdict,
        "돈·일·사람 중 이번 질문과 직접 연결된 축만 끌어와 순서를 정해야 한다.",
      ),
      scene(
        7, "mystery", "mystery", "closeup",
        "그런데 이 고민이 반복되는 진짜 이유는 질문 뒤쪽에 있다.",
        `${fp.dominantTenGod}과 ${fp.weakElement} 약점이 만나는 장면`,
        "전체 상담에서 질문에 필요한 사주 축만 끌어와 최종 행동판정으로 회수한다.",
        true,
      ),
    ];
  }

  return [];
}



function buildHealthPlainSajuReasonV185(params: {
  grade: string;
  health: ReturnType<typeof getHealthProfile>;
  flow: ReturnType<typeof getReadableElementFlow>;
}) {
  const { grade, health, flow } = params;

  const weakText = String(flow?.weakestText || "").trim();
  const type = String(health?.type || "").trim();

  const opening =
    grade === "하" || grade === "중하"
      ? "이 사주는 무리한 뒤 회복이 늦어지는 흐름을 먼저 관리해야 한다."
      : grade === "상" || grade === "중상"
        ? "기본적으로 버티는 힘은 있지만 생활 리듬이 무너지면 회복 속도부터 달라지는 사주다."
        : "체력의 절대량보다 생활 리듬과 회복 속도를 일정하게 지키는 것이 중요한 사주다.";

  const weak =
    weakText
      ? `사주상 약한 축은 ${weakText}으로 잡히지만, 이를 특정 장기나 질병으로 단정하지 않는다.`
      : "사주상 약점은 특정 장기 하나보다 피로가 누적된 뒤 회복하는 과정에서 더 분명하게 드러난다.";

  const pattern =
    /수면|회복|피로/i.test(String(health?.risk || ""))
      ? "특히 잠이 흔들리고 피로가 누적될 때 다음 날까지 회복이 밀리는 패턴을 먼저 살펴야 한다."
      : /소화|식사|장/i.test(String(health?.risk || ""))
        ? "특히 식사 시간이 흔들리거나 긴장이 오래 이어질 때 소화와 피로 리듬이 함께 무너지지 않는지 살펴야 한다."
        : /긴장|목|어깨/i.test(String(health?.risk || ""))
          ? "특히 긴장이 오래 이어질 때 몸을 굳힌 채 버티는 시간이 길어지고 회복이 늦어지는 패턴을 살펴야 한다."
          : "평소에는 버텨도 일정이 몰리고 쉬는 시간이 줄어들면 작은 피로 신호를 늦게 알아차리는 패턴을 조심해야 한다.";

  const typeNote = type
    ? "건강운에서는 이 흐름을 생활 습관, 수면, 식사, 긴장과 회복의 순서로 풀어본다."
    : "";

  return [opening, weak, pattern, typeNote].filter(Boolean).join(" ");
}

function sanitizeHealthCustomerTextV185(value: string) {
  return String(value || "")
    .replace(/표현과 회복의 불씨가 늦게 붙는 자리/g, "회복 리듬이 늦게 올라오는 경향")
    .replace(/사람 말 뒤를 읽는 물/g, "주변 자극을 오래 받아들이는 경향")
    .replace(/현실을 오래 버티는 바닥/g, "무리한 상황에서도 오래 버티는 경향")
    .replace(/새 방향을 정하는 순간이 늦어지는 자리/g, "생활 리듬을 바꾸는 데 시간이 필요한 경향")
    .replace(/남보다 먼저 흐름을 읽는 깊은 물/g, "주변 변화에 민감하게 반응하는 경향")
    .replace(/\b[목화토금수]\s*쪽\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildHealthLongformStory(params: {
  user: UserInfo;
  manse: any;
  fortuneSeed: number;
  profile: Extract<CategoryPreviewProfile, { kind: "health" }>;
}) {
  const flow = getReadableElementFlow(params.manse);
  const health = getHealthProfile(params.manse);
  const grade = getHealthGrade(params.manse);
  const seed = Math.abs(Math.floor(params.fortuneSeed || 1));
  const snap = getElementSnapshot(params.manse);
  const ten = getTenGodCounts(params.manse);

  const output = countTenGodGroup(ten, ["식신", "상관"]);
  const wealth = countTenGodGroup(ten, ["편재", "정재"]);
  const authority = countTenGodGroup(ten, ["편관", "정관"]);
  const resource = countTenGodGroup(ten, ["편인", "정인"]);
  const peer = countTenGodGroup(ten, ["비견", "겁재"]);

  const clamp = (n: number) => Math.max(35, Math.min(96, Math.round(n)));
  const jitter = (salt: string, width = 7) =>
    (hashToSeed(`${seed}:${salt}:health-v178`) % (width * 2 + 1)) - width;

  const stamina = clamp(
    62 +
      snap.earth * 5 +
      snap.wood * 2 +
      authority * 2 +
      peer +
      jitter("stamina"),
  );
  const endurance = clamp(
    66 +
      snap.earth * 6 +
      authority * 3 +
      resource -
      Math.max(0, snap.fire === 0 ? 5 : 0) +
      jitter("endurance"),
  );
  const recovery = clamp(
    58 +
      snap.water * 5 +
      resource * 3 +
      snap.fire * 2 -
      authority -
      peer +
      jitter("recovery"),
  );
  const fatigueAwareness = clamp(
    52 +
      snap.water * 3 +
      snap.metal * 2 +
      resource * 2 -
      snap.earth * 3 -
      authority * 2 +
      jitter("fatigue-awareness"),
  );
  const rhythmSensitivity = clamp(
    60 +
      Math.abs(snap.fire - snap.water) * 5 +
      snap.earth * 2 +
      resource * 2 +
      jitter("rhythm"),
  );

  const strongestScore = Math.max(stamina, endurance, recovery, fatigueAwareness, rhythmSensitivity);
  const weakestScore = Math.min(stamina, endurance, recovery, fatigueAwareness, rhythmSensitivity);

  const profileFp = buildPersonalWebtoonFingerprint(
    params.user,
    params.manse,
    seed,
  );

  const signalCandidates = [
    {
      key: "sleep",
      label: "수면 리듬",
      score: clamp(
        58 +
          (snap.water <= 1 ? 12 : 0) +
          (snap.fire === 0 ? 12 : 0) +
          resource * 2 +
          jitter("signal-sleep"),
      ),
      description:
        "잠드는 시간과 깨는 시간이 흔들리면 다음날 회복속도가 눈에 띄게 떨어지는 편이다.",
    },
    {
      key: "digestion",
      label: "식사·소화 리듬",
      score: clamp(
        56 +
          snap.earth * 4 +
          (snap.wood <= 1 ? 5 : 0) +
          wealth +
          jitter("signal-digestion"),
      ),
      description:
        "식사 간격이 무너지거나 한 번에 많이 먹는 날이 이어지면 컨디션 저하가 같이 붙기 쉽다.",
    },
    {
      key: "tension",
      label: "긴장·목·어깨",
      score: clamp(
        55 +
          snap.metal * 4 +
          authority * 2 +
          peer +
          jitter("signal-tension"),
      ),
      description:
        "몸보다 머리가 먼저 긴장하는 날에는 목·어깨처럼 굳는 느낌으로 피로가 드러나기 쉽다.",
    },
    {
      key: "fatigue",
      label: "피로 누적",
      score: clamp(
        60 +
          endurance -
          recovery +
          snap.earth * 2 +
          jitter("signal-fatigue"),
      ),
      description:
        "버티는 힘이 회복력을 앞서는 날이 길어지면 어느 순간 평소 하던 일도 무겁게 느껴질 수 있다.",
    },
    {
      key: "mood",
      label: "기분·활력 저하",
      score: clamp(
        52 +
          (snap.fire <= 1 ? 13 : 0) +
          resource * 2 +
          jitter("signal-mood"),
      ),
      description:
        "표현과 활력의 불씨가 꺼지는 날에는 몸보다 먼저 의욕과 반응 속도가 떨어질 수 있다.",
    },
  ].sort((a, b) => b.score - a.score);

  const signalSequence = signalCandidates.slice(0, 4);

  const openingVerdict =
    endurance >= recovery + 12
      ? "네 몸은 약해서 문제가 되는 사주가 아니다. 버티는 힘이 회복력을 앞서는 게 문제다."
      : rhythmSensitivity >= 80
        ? "네 몸은 체력보다 생활리듬에 더 민감하게 반응하는 사주다."
        : recovery >= 80
          ? "회복력은 좋은 편이다. 문제는 회복을 믿고 무리한 날을 오래 이어가는 데 있다."
          : "네 건강운은 약함보다 리듬 관리에서 승부가 갈리는 쪽이다.";

  const openingBody = pickStableWebtoonLine(seed, "health-opening-body", [
    `평소에는 크게 티가 안 난다. 그런데 ${signalSequence[0].label}이 흔들리기 시작하면 두 번째 신호가 빠르게 붙는 편이다.`,
    `몸이 먼저 멈추는 사람이 아니라, 네가 몸보다 늦게 멈추는 사람에 가깝다. 특히 ${signalSequence[0].label}에서 첫 신호가 잘 잡힌다.`,
    `한 번 무너질 때 한 군데만 흔들리는 흐름이 아니다. ${signalSequence[0].label}에서 시작해 ${signalSequence[1].label}로 이어지는 패턴을 조심해야 한다.`,
  ]);

  const sajuReason = buildHealthPlainSajuReasonV185({
    grade,
    health,
    flow,
  });

  const anomalyTitle =
    endurance >= 85 && fatigueAwareness <= 60
      ? "버티는 힘은 높은데 피로를 알아차리는 속도는 늦다."
      : recovery <= 65 && rhythmSensitivity >= 78
        ? "회복력보다 생활리듬 민감도가 더 높다."
        : "강한 점수와 약한 점수의 차이가 건강운의 핵심이다.";

  const anomalyBody =
    `가장 강한 지표는 ${strongestScore}점, 가장 약한 지표는 ${weakestScore}점이다. ` +
    `건강운에서 중요한 건 평균점수가 아니라 이 차이다. ` +
    `네 경우에는 한동안 멀쩡해 보여도 약한 축이 먼저 흔들리면 다른 지표가 연쇄적으로 따라갈 수 있다.`;

  const burden = clamp(
    48 +
      rhythmSensitivity * 0.28 +
      Math.max(0, endurance - recovery) * 0.7 +
      jitter("current-burden", 5),
  );
  const currentRecovery = clamp(
    recovery -
      Math.max(0, rhythmSensitivity - 70) * 0.18 +
      jitter("current-recovery", 5),
  );

  const currentComment =
    burden > currentRecovery
      ? "지금 흐름에서는 버티는 힘보다 몸의 부담이 먼저 위로 올라오지 않게 리듬을 잡는 게 중요하다."
      : "현재는 회복력이 부담을 따라잡고 있다. 다만 생활리듬이 깨지면 두 선이 빠르게 뒤집힐 수 있다.";

  const birthYear = getNumberFromText(params.user.year) || 1985;
  const currentYear = getKoreaTodayInfo().year;
  const currentAge = Math.max(18, currentYear - birthYear + 1);

  const ageBase = Math.max(24, currentAge - 12);
  const ageFlow = Array.from({ length: 9 }, (_, index) => {
    const age = ageBase + index * 4;
    const phaseSeed = hashToSeed(`${seed}:health-age:${age}`) % 17;
    const dipCenter = currentAge + ((seed % 11) - 5);
    const dip =
      Math.abs(age - dipCenter) <= 4
        ? 12 + (phaseSeed % 8)
        : Math.abs(age - (dipCenter + 12)) <= 4
          ? 7 + (phaseSeed % 6)
          : 0;
    const recoveryBoost = age > dipCenter + 4 ? Math.min(10, Math.floor((age - dipCenter) / 4)) : 0;
    const score = clamp(
      78 +
        recoveryBoost -
        dip +
        (recovery - 65) * 0.2 -
        (rhythmSensitivity - 70) * 0.12 +
        jitter(`age-${age}`, 4),
    );
    return {
      age,
      score,
      label:
        Math.abs(age - dipCenter) <= 2
          ? "첫 꺾임"
          : Math.abs(age - (dipCenter + 12)) <= 2
            ? "두 번째 변화"
            : undefined,
    };
  });

  const firstTurningStart = Math.max(24, currentAge + ((seed % 7) - 3));
  const firstTurningAge = `${firstTurningStart}~${firstTurningStart + 2}세`;
  const secondTurningStart = firstTurningStart + 8 + (seed % 5);
  const recoveryStart = secondTurningStart + 4 + (seed % 4);

  const warningHabit =
    signalSequence[0].key === "sleep"
      ? "잠이 무너졌는데도 평소 페이스를 그대로 유지하는 것"
      : signalSequence[0].key === "digestion"
        ? "식사 간격이 무너진 상태에서 과식·야식을 반복하는 것"
        : signalSequence[0].key === "tension"
          ? "몸이 굳어 있는데도 휴식 없이 계속 집중하는 것"
          : signalSequence[0].key === "mood"
            ? "활력이 떨어진 상태를 의지로만 밀어붙이는 것"
            : "피곤한데도 괜찮다고 넘기며 버티는 것";

  const actionFirst =
    signalSequence[0].key === "sleep"
      ? "취침·기상 시간을 먼저 고정해라."
      : signalSequence[0].key === "digestion"
        ? "식사 시간을 먼저 고정해라."
        : signalSequence[0].key === "tension"
          ? "매일 같은 시간에 긴장을 풀어주는 휴식 구간을 먼저 만들어라."
          : signalSequence[0].key === "mood"
            ? "활력이 꺼지는 시간대에 무리한 일정을 겹치지 마라."
            : "피로가 쌓이는 날의 종료 시간을 먼저 정해라.";

  const actionReason =
    `${signalSequence[0].label}이 첫 신호로 가장 강하게 잡히기 때문이다. ` +
    `여기 하나만 고정해도 ${signalSequence[1].label}과 ${signalSequence[2].label}이 연달아 흔들리는 걸 줄이는 데 도움이 된다.`;

  return {
    openingVerdict,
    openingBody,
    sajuReason,
    energyScores: {
      stamina,
      endurance,
      recovery,
      fatigueAwareness,
      rhythmSensitivity,
    },
    anomalyTitle,
    anomalyBody,
    signalSequence,
    currentRhythm: {
      burden,
      recovery: currentRecovery,
      comment: currentComment,
    },
    ageFlow,
    firstTurningAge,
    secondTurningAgeLocked: `${secondTurningStart}~${secondTurningStart + 2}세`,
    recoveryAgeLocked: `${recoveryStart}~${recoveryStart + 2}세`,
    warningHabit,
    actionFirst,
    actionReason,
    lockedTopics: [
      "두 번째 건강 변화구간",
      "회복운이 다시 강해지는 시기",
      "몸에서 가장 먼저 나타나는 신호의 세부 순서",
      "연령대별 건강 리듬",
      "피해야 할 생활패턴",
      "건강운 최종 판정",
    ],
  };
}


function buildHealthPaidPartReport(params: {
  user: UserInfo;
  manse: any;
  fortuneSeed: number;
  profile: Extract<CategoryPreviewProfile, { kind: "health" }>;
}) {
  // v188: 이 함수는 더 이상 고객에게 보여줄 고정 유료 원고를 만들지 않는다.
  // AI full 결과를 PART UI 데이터로 변환할 때 필요한 숫자/구조 기본값만 제공한다.
  const seed = Math.abs(Math.floor(params.fortuneSeed || 1));
  const story = params.profile.healthStory;
  const snap = getElementSnapshot(params.manse);
  const clamp = (n: number) => Math.max(35, Math.min(96, Math.round(n)));
  const jitter = (salt: string, width = 4) =>
    (hashToSeed(`${seed}:${salt}:health-structure-v188`) % (width * 2 + 1)) - width;

  const currentYear = getKoreaTodayInfo().year;
  const birthYear = getNumberFromText(params.user.year) || 1985;
  const currentAge = Math.max(18, currentYear - birthYear + 1);
  const energy = story?.energyScores || {
    stamina: clamp(66 + snap.earth * 4 + jitter("stamina")),
    endurance: clamp(68 + snap.earth * 4 + jitter("endurance")),
    recovery: clamp(60 + snap.water * 4 + snap.fire * 2 + jitter("recovery")),
    fatigueAwareness: clamp(58 + snap.water * 3 - snap.earth + jitter("fatigue")),
    rhythmSensitivity: clamp(66 + Math.abs(snap.fire - snap.water) * 4 + jitter("rhythm")),
  };

  const balance = [
    { key: "recovery", label: "회복 리듬", score: energy.recovery },
    { key: "sleepFatigue", label: "수면·피로", score: clamp((energy.recovery + energy.fatigueAwareness) / 2) },
    { key: "digestion", label: "소화 리듬", score: clamp(62 + snap.earth * 3 + jitter("digestion")) },
    { key: "tension", label: "긴장·경직", score: clamp(60 + snap.metal * 3 + jitter("tension")) },
    { key: "activity", label: "활동 에너지", score: energy.endurance },
  ].map((x) => ({
    ...x,
    level: x.score >= 78 ? "강함" : x.score >= 62 ? "관찰" : "주의",
  }));

  const signalLabels =
    story?.signalSequence?.map((x) => x.label).filter(Boolean) ||
    [params.profile.firstSignal, "피로 누적", "회복 저하"].filter(Boolean);
  const firstSignal = signalLabels[0] || "첫 생활 신호";

  // PART 03과 UI 카드가 반드시 같은 값을 사용하도록 여기서 한 번만 계산한다.
  const crisis1Start = 27 + (seed % 4);
  const crisis2Start = 43 + ((seed >> 2) % 4);
  const crisis3Start = 52 + ((seed >> 4) % 4);
  const crisis4Start = 58 + ((seed >> 6) % 4);
  const crises = [
    { order: 1, age: `${crisis1Start}~${crisis1Start + 2}세 전후`, body: "생활 리듬 변화가 커지는 첫 체크 구간" },
    { order: 2, age: `${crisis2Start}~${crisis2Start + 2}세 전후`, body: "회복 방식이 달라지는 두 번째 체크 구간" },
    { order: 3, age: `${crisis3Start}~${crisis3Start + 2}세 전후`, body: "평소 취약 패턴을 꾸준히 관리해야 하는 세 번째 체크 구간" },
    { order: 4, age: `${crisis4Start}세 이후`, body: "장기 생활관리의 일관성이 중요해지는 구간" },
  ];
  const nextCrisis =
    crises.find((x) => {
      const n = parseInt(x.age, 10);
      return Number.isFinite(n) && n >= currentAge;
    }) || crises[crises.length - 1];

  const monthA = Math.min(12, 3 + (seed % 4));
  const monthB = Math.min(12, 9 + ((seed >> 3) % 4));
  const cautionMonths = [
    { month: monthA, label: `${monthA}월 전후`, body: "첫 번째 집중 관리 달" },
    { month: monthB, label: `${monthB}월 전후`, body: "두 번째 집중 관리 달" },
  ];

  const exerciseItems = [
    { label: "걷기", stars: Math.max(3, Math.min(5, 4 + (energy.recovery >= 65 ? 1 : 0))) },
    { label: "식후 산책", stars: Math.max(3, Math.min(5, 4 + (snap.earth >= 2 ? 1 : 0))) },
    { label: "하체 스트레칭", stars: Math.max(3, Math.min(5, 4 + (energy.rhythmSensitivity >= 70 ? 1 : 0))) },
    { label: "가벼운 근력운동", stars: Math.max(2, Math.min(5, 3 + (energy.endurance >= 70 ? 1 : 0))) },
    { label: "목·어깨·등 풀기", stars: Math.max(2, Math.min(5, 3 + (snap.metal >= 2 ? 1 : 0))) },
    { label: "갑작스러운 고강도 운동", stars: energy.recovery >= 78 && energy.endurance >= 78 ? 3 : 2 },
  ];

  return {
    reportFormat: "part-report" as const,
    opening: {
      grade: params.profile.grade,
      verdict: "",
      summary: "",
      weakAxis: params.profile.primaryWeakness || "",
      cautionStyle: "",
      yearCaution: cautionMonths.map((x) => x.label).join(" · "),
    },
    part1: {
      title: "내 몸은 어디부터 흔들리는가",
      weakPlaceTitle: "내 사주상 몸의 약한 자리",
      weakPlaceBody: "",
      balance,
      firstBreakTitle: "무리하면 어디부터 꺾일까",
      firstBreakBody: "",
      breakSequence: signalLabels.slice(0, 4),
      keyInsight: "",
    },
    part2: {
      title: "몸은 무너지기 전에 먼저 신호를 보낸다",
      intro: "",
      signals: [],
      dangerPattern: [],
      keyWarning: "",
    },
    part3: {
      title: "내 몸이 흔들리는 시간",
      lifetimeCrises: crises,
      currentAge,
      nextCrisis: nextCrisis.age,
      nextCrisisBody: nextCrisis.body,
      year: currentYear,
      cautionMonths,
      timelineInsight: "",
    },
    part4: {
      title: "내 건강을 깎는 것과 살리는 것",
      harmfulHabits: [],
      helpfulHabits: [],
      keyInsight: "",
      body: "",
    },
    part5: {
      title: "무엇을 먹고, 어떻게 움직여야 할까",
      food: { verdict: "", recommended: [], reduce: [], body: "" },
      rhythm: { verdict: "", actions: [], body: "" },
      exercise: { verdict: "", items: exerciseItems, body: "" },
    },
    final: {
      title: "도훈의 최종 판정",
      verdict: "",
      body: "",
      whyThisVerdict: "",
      strongestHealthPattern: "",
      biggestRiskPattern: "",
      nextTurningPoint: nextCrisis.age,
      thisYearFocus: cautionMonths.map((x) => x.label).join(" · "),
      actionPriority: "",
      longTermAdvice: "",
      closingMessage: "",
      remember: [
        { label: "내 몸의 첫 경고", value: firstSignal },
        { label: "다음 체크 구간", value: nextCrisis.age },
        { label: "지금부터 바꿀 한 가지", value: "" },
      ],
      medicalNotice:
        params.profile.medicalNotice ||
        "이 풀이는 사주상 건강 흐름을 보는 콘텐츠다. 통증이나 증상이 오래가면 실제 진료와 검진을 우선해야 한다.",
    },
  };
}

function extractHealthSectionV181(fullText: string, title: string) {
  const normalized = String(fullText || "").replace(/\r/g, "");
  const marker = `[${title}]`;
  const start = normalized.indexOf(marker);
  if (start < 0) return "";

  const after = normalized.slice(start + marker.length);
  const next = after.search(/\n\s*\[[^\]]+\]/);
  return (next >= 0 ? after.slice(0, next) : after).trim();
}

function healthSentencesV181(value: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?다요])\s+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function firstHealthSentenceV181(value: string, fallback = "") {
  return healthSentencesV181(value)[0] || fallback;
}

function lastHealthSentenceV181(value: string, fallback = "") {
  const list = healthSentencesV181(value);
  return list[list.length - 1] || fallback;
}

function extractCommaItemsV181(value: string, patterns: RegExp[], fallback: string[]) {
  const source = String(value || "").replace(/\n/g, " ");
  for (const pattern of patterns) {
    const match = source.match(pattern);
    const raw = String(match?.[1] || "").trim();
    if (!raw) continue;
    const items = raw
      .split(/,|ㆍ|·|\/| 그리고 /)
      .map((v) => v.trim().replace(/[.。]$/, ""))
      .filter((v) => v.length >= 2 && v.length <= 80);
    if (items.length) return items.slice(0, 12);
  }
  return fallback;
}

function parseHealthCrisesV181(
  section: string,
  fallback: Array<{ order: number; age: string; body: string }>,
) {
  const paragraphs = String(section || "")
    .split(/\n{2,}/)
    .map((v) => v.trim())
    .filter(Boolean);

  const parsed: Array<{ order: number; age: string; body: string }> = [];

  for (const paragraph of paragraphs) {
    const match = paragraph.match(/(\d{2}\s*~\s*\d{2}세\s*전후|\d{2}세\s*이후|\d{2}세\s*전후)/);
    if (!match) continue;

    const age = match[1].replace(/\s+/g, "");
    parsed.push({
      order: parsed.length + 1,
      age,
      body: paragraph,
    });
  }

  return parsed.length >= 2 ? parsed.slice(0, 5) : fallback;
}

function parseHealthMonthsV181(
  section: string,
  fallback: Array<{ month: number; label: string; body: string }>,
) {
  const matches = [...String(section || "").matchAll(/(\d{1,2})월(?:\s*전후)?/g)];
  const seen = new Set<number>();
  const rows: Array<{ month: number; label: string; body: string }> = [];

  for (const match of matches) {
    const month = Number(match[1]);
    if (!Number.isFinite(month) || month < 1 || month > 12 || seen.has(month)) continue;
    seen.add(month);
    rows.push({
      month,
      label: `${month}월 전후`,
      body: section,
    });
  }

  return rows.length ? rows.slice(0, 4) : fallback;
}


function sanitizeHealthPaidReportV185<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeHealthCustomerTextV185(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeHealthPaidReportV185(item)) as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeHealthPaidReportV185(item);
    }
    return result as T;
  }
  return value;
}

function buildAIHealthPaidReportV188(params: {
  profile: Extract<CategoryPreviewProfile, { kind: "health" }>;
  fullText: string;
  user: UserInfo;
  manse: any;
  fortuneSeed: number;
}) {
  // 유료 구조를 만들기 위한 기본값은 full 응답을 조립할 때만 내부에서 만든다.
  // preview profile에는 healthPaidReport를 넣지 않아 유료 화면이 먼저 보이는 현상을 막는다.
  const fallback = sanitizeHealthPaidReportV185(
    buildHealthPaidPartReport({
      user: params.user,
      manse: params.manse,
      fortuneSeed: params.fortuneSeed,
      profile: params.profile,
    }),
  );

  const fullText = sanitizeHealthCustomerTextV185(
    String(params.fullText || "").trim(),
  );
  if (!fullText) {
    throw new Error("health paid AI full text is empty");
  }

  const first = extractHealthSectionV181(fullText, "건강운 첫 판정");
  const weak = extractHealthSectionV181(fullText, "내 사주상 몸의 약한 자리");
  const signal = extractHealthSectionV181(fullText, "몸이 보내는 첫 신호");
  const breakPoint = extractHealthSectionV181(fullText, "무리하면 먼저 꺾이는 곳");
  const crisesText = extractHealthSectionV181(fullText, "인생에서 건강이 흔들리는 고비");
  const yearText = extractHealthSectionV181(fullText, "올해 건강을 조심해야 할 달");
  const harmful = extractHealthSectionV181(fullText, "건강을 망치는 생활 습관");
  const helpful = extractHealthSectionV181(fullText, "건강이 살아나는 생활법");
  const food = extractHealthSectionV181(fullText, "음식으로 건강을 지키는 법");
  const rhythm = extractHealthSectionV181(fullText, "생활 리듬으로 건강을 지키는 법");
  const exercise = extractHealthSectionV181(fullText, "운동으로 건강을 지키는 법");
  const finalText = extractHealthSectionV181(fullText, "건강운 마지막 판정");

  // If the model somehow ignored the health headings, do not fake an AI source.
  const sectionCount = [
    first, weak, signal, breakPoint, crisesText, yearText,
    harmful, helpful, food, rhythm, exercise, finalText,
  ].filter(Boolean).length;

  if (sectionCount < 10 || fullText.length < 1800) {
    console.log("SOREUM_HEALTH_AI_PARSE_FAILED", {
      sectionCount,
      fullLength: fullText.length,
    });
    throw new Error(
      `health paid AI parse failed; sections=${sectionCount}, length=${fullText.length}`,
    );
  }

  const lifetimeCrises = parseHealthCrisesV181(
    crisesText,
    fallback.part3.lifetimeCrises,
  );

  const nextCrisis =
    lifetimeCrises.find((row) => {
      const n = parseInt(row.age, 10);
      return Number.isFinite(n) && n >= fallback.part3.currentAge;
    }) || lifetimeCrises[lifetimeCrises.length - 1] || {
      age: fallback.part3.nextCrisis,
      body: fallback.part3.nextCrisisBody,
    };

  const cautionMonths = parseHealthMonthsV181(
    yearText,
    fallback.part3.cautionMonths,
  );

  const harmfulHabits = extractCommaItemsV181(
    harmful,
    [
      /피해야\s*할\s*습관(?:은|이)?\s*([^.]*)/i,
      /줄여야\s*할\s*습관(?:은|이)?\s*([^.]*)/i,
    ],
    fallback.part4.harmfulHabits,
  );

  const helpfulHabits = extractCommaItemsV181(
    helpful,
    [
      /살리는\s*방법(?:은|이)?\s*([^.]*)/i,
      /해야\s*할\s*(?:습관|행동)(?:은|이)?\s*([^.]*)/i,
    ],
    fallback.part4.helpfulHabits,
  );

  const recommendedFoods = extractCommaItemsV181(
    food,
    [
      /맞는\s*음식(?:은|이)?\s*([^.]*)/i,
      /잘\s*맞는\s*음식(?:은|이)?\s*([^.]*)/i,
    ],
    fallback.part5.food.recommended,
  );

  const reduceFoods = extractCommaItemsV181(
    food,
    [
      /줄여야\s*할\s*(?:음식과\s*습관|음식|것)(?:은|이)?\s*([^.]*)/i,
      /피해야\s*할\s*(?:음식과\s*습관|음식)(?:은|이)?\s*([^.]*)/i,
    ],
    fallback.part5.food.reduce,
  );

  const signalSentences = healthSentencesV181(signal);
  const breakSentences = healthSentencesV181(breakPoint);
  const helpfulSentences = healthSentencesV181(helpful);
  const rhythmSentences = healthSentencesV181(rhythm);
  const exerciseSentences = healthSentencesV181(exercise);
  const finalSentences = healthSentencesV181(finalText);

  const signalLabels =
    params.profile.healthStory?.signalSequence?.map((x) => x.label) ||
    fallback.part1.breakSequence;

  const signals = (signalLabels.length ? signalLabels : fallback.part1.breakSequence)
    .slice(0, 4)
    .map((label, index) => ({
      level: index + 1,
      title:
        index === 0 ? "첫 신호" :
        index === 1 ? "반복 신호" :
        index === 2 ? "회복 저하" : "생활 전체 영향",
      body:
        signalSentences[index] ||
        signalSentences[signalSentences.length - 1] ||
        fallback.part2.signals[index]?.body ||
        `${label}을 체크한다.`,
    }));

  const aiVerdict =
    finalSentences.find((v) => /판정|몸|건강운|무너지|버티|회복|리듬/.test(v)) ||
    firstHealthSentenceV181(finalText, fallback.final.verdict);

  const whyThisVerdict = [
    firstHealthSentenceV181(weak),
    firstHealthSentenceV181(breakPoint),
  ].filter(Boolean).join(" ");

  const strongestHealthPattern =
    healthSentencesV181(weak).slice(0, 3).join(" ") ||
    fallback.final.strongestHealthPattern;

  const biggestRiskPattern =
    [
      ...healthSentencesV181(breakPoint).slice(0, 2),
      firstHealthSentenceV181(harmful),
    ].filter(Boolean).join(" ") ||
    fallback.final.biggestRiskPattern;

  const nextTurningPoint =
    nextCrisis?.body
      ? `${nextCrisis.age}. ${nextCrisis.body}`
      : fallback.final.nextTurningPoint;

  const thisYearFocus =
    yearText || fallback.final.thisYearFocus;

  const actionPriority =
    helpfulHabits[0] ||
    firstHealthSentenceV181(helpful, fallback.final.actionPriority);

  const longTermAdvice =
    [
      ...rhythmSentences.slice(0, 2),
      ...exerciseSentences.slice(0, 2),
    ].filter(Boolean).join(" ") ||
    fallback.final.longTermAdvice;

  const closingMessage =
    finalSentences.slice(-3).join(" ") ||
    fallback.final.closingMessage;

  const firstSignalValue =
    signalLabels[0] ||
    fallback.final.remember[0]?.value ||
    "몸이 보내는 첫 신호";

  const aiReport = {
    ...fallback,
    opening: {
      ...fallback.opening,
      verdict: firstHealthSentenceV181(first, fallback.opening.verdict),
      summary:
        firstHealthSentenceV181(finalText, fallback.opening.summary),
      yearCaution:
        cautionMonths.map((x) => x.label).join(" · ") ||
        fallback.opening.yearCaution,
    },
    part1: {
      ...fallback.part1,
      weakPlaceBody: weak || fallback.part1.weakPlaceBody,
      firstBreakBody: breakPoint || fallback.part1.firstBreakBody,
      breakSequence: signalLabels.length
        ? signalLabels.slice(0, 4)
        : fallback.part1.breakSequence,
      keyInsight:
        lastHealthSentenceV181(weak, fallback.part1.keyInsight),
    },
    part2: {
      ...fallback.part2,
      intro: signal || fallback.part2.intro,
      signals,
      dangerPattern:
        harmfulHabits.slice(0, 4).length
          ? harmfulHabits.slice(0, 4)
          : fallback.part2.dangerPattern,
      keyWarning:
        firstHealthSentenceV181(harmful, fallback.part2.keyWarning),
    },
    part3: {
      ...fallback.part3,
      lifetimeCrises,
      nextCrisis: nextCrisis.age || fallback.part3.nextCrisis,
      nextCrisisBody: nextCrisis.body || fallback.part3.nextCrisisBody,
      cautionMonths,
      timelineInsight:
        lastHealthSentenceV181(crisesText, fallback.part3.timelineInsight),
    },
    part4: {
      ...fallback.part4,
      harmfulHabits,
      helpfulHabits,
      keyInsight:
        lastHealthSentenceV181(helpful, fallback.part4.keyInsight),
      body:
        [harmful, helpful].filter(Boolean).join("\n\n") ||
        fallback.part4.body,
    },
    part5: {
      ...fallback.part5,
      food: {
        ...fallback.part5.food,
        verdict:
          firstHealthSentenceV181(food, fallback.part5.food.verdict),
        recommended: recommendedFoods,
        reduce: reduceFoods,
        body: food || fallback.part5.food.body,
      },
      rhythm: {
        ...fallback.part5.rhythm,
        verdict:
          firstHealthSentenceV181(rhythm, fallback.part5.rhythm.verdict),
        actions:
          rhythmSentences.slice(0, 4).length
            ? rhythmSentences.slice(0, 4)
            : fallback.part5.rhythm.actions,
        body: rhythm || fallback.part5.rhythm.body,
      },
      exercise: {
        ...fallback.part5.exercise,
        verdict:
          firstHealthSentenceV181(exercise, fallback.part5.exercise.verdict),
        body: exercise || fallback.part5.exercise.body,
      },
    },
    final: {
      ...fallback.final,
      verdict: aiVerdict || fallback.final.verdict,
      body: finalText || fallback.final.body,
      whyThisVerdict:
        whyThisVerdict || fallback.final.whyThisVerdict,
      strongestHealthPattern,
      biggestRiskPattern,
      nextTurningPoint,
      thisYearFocus,
      actionPriority,
      longTermAdvice,
      closingMessage,
      remember: [
        { label: "내 몸의 첫 경고", value: firstSignalValue },
        {
          label: "다음 체크 구간",
          value: nextCrisis.age || fallback.part3.nextCrisis,
        },
        { label: "지금부터 바꿀 한 가지", value: actionPriority },
      ],
    },
  };

  return {
    ...params.profile,
    healthPaidReportSource: "ai-full" as const,
    healthPaidReport: aiReport,
  };
}


function buildTodayPaidHookV203(params: {
  strongestArea: string;
  warningArea: string;
  bestTime: string;
  doOne: string;
  avoidOne: string;
}) {
  const { strongestArea, warningArea, bestTime } = params;

  const strongLead: Record<string, string> = {
    "돈": `오늘은 돈 쪽에서 먼저 움직임이 잡힌다. 그런데 ${bestTime}가 좋다고 해서 아무 결제나 거래를 밀어도 된다는 뜻은 아니다.`,
    "일": `오늘은 일·사업 쪽 힘이 먼저 살아난다. 특히 ${bestTime} 전후의 선택이 중요한데, 무엇부터 처리하느냐에 따라 결과 차이가 커진다.`,
    "사람": `오늘은 사람 쪽에서 먼저 움직임이 생긴다. ${bestTime} 전후의 연락이나 대화가 중요하지만 먼저 움직일 일과 기다릴 일을 갈라야 한다.`,
    "말": `오늘은 말 한마디가 평소보다 크게 작용한다. ${bestTime} 전후에는 좋은 말도 힘을 받지만, 서두른 답장도 그대로 남는다.`,
    "몸": `오늘은 몸의 컨디션을 무시하고 밀어붙이면 다른 운까지 같이 흔들리기 쉽다. ${bestTime} 전후에 힘을 쓸 일과 아낄 일을 나눠야 한다.`,
  };

  const warningLead: Record<string, string> = {
    "돈": "특히 돈에서는 들어오는 것보다 먼저 빠지는 선택 하나를 조심해야 한다.",
    "일": "특히 일에서는 빨리 끝내려다 다시 손대게 되는 선택 하나를 조심해야 한다.",
    "사람": "특히 사람에서는 먼저 꺼내면 관계가 꼬일 수 있는 말과 행동이 따로 있다.",
    "말": "특히 말에서는 바로 답하는 것보다 한 번 넘겨야 하는 순간이 있다.",
    "몸": "특히 몸에서는 괜찮다고 버티다가 집중력과 판단이 같이 떨어지는 순간을 조심해야 한다.",
  };

  return {
    paidHookTitle: "오늘 운은 여기서 한 번 더 갈린다",
    paidHookBody: `${strongLead[strongestArea] || `오늘은 ${strongestArea}에서 먼저 움직임이 잡힌다.`} ${warningLead[warningArea] || `반대로 ${warningArea}에서는 한 번 더 확인하고 움직여야 한다.`}`,
    paidHookQuote: `오늘은 잘되는 걸 더 하는 것보다, ${warningArea}에서 잘못 건드리지 않는 게 더 중요해.`,
    paidLockedItems: [
      {
        title: "오늘 가장 좋은 시간에 해야 할 일",
        teaser: `${bestTime}가 왜 좋은지, 그 시간에 돈·일·연락 중 무엇을 먼저 움직여야 하는지 이어서 본다.`,
      },
      {
        title: "오늘의 재물운",
        teaser: "오늘 돈을 잡아야 하는지 지출을 막아야 하는지, 실제 돈 행동으로 나눠 본다.",
      },
      {
        title: "오늘의 일·사업운",
        teaser: "연락·보고·거래·결정 중 오늘 밀어도 되는 일과 미뤄야 할 일을 가른다.",
      },
      {
        title: "오늘의 연애·인연운",
        teaser: "먼저 연락할지 기다릴지, 오늘 사람 사이에서 꼬이기 쉬운 말과 행동을 본다.",
      },
      {
        title: "오늘의 건강운",
        teaser: "오늘 집중력과 피로가 꺾이는 흐름, 무리하지 말아야 할 생활 패턴을 본다.",
      },
      {
        title: "오늘 반드시 해야 할 한 가지",
        teaser: "오늘 운을 실제 결과로 남기기 위해 가장 먼저 끝내야 할 행동을 판정한다.",
      },
      {
        title: "오늘 절대 피해야 할 한 가지",
        teaser: "오늘 손실이나 후회를 만들기 쉬운 행동 하나를 분명하게 짚는다.",
      },
    ],
    paidFinalHook: `오늘 네 사주에는 먼저 해야 할 행동 하나와 오늘만큼은 미뤄야 할 행동 하나가 따로 잡혀 있다. ${strongestArea}이 살아나는 순간과 ${warningArea}에서 실수하는 순간을 같이 확인해야 오늘 운을 제대로 쓴다.`,
    paidCtaLabel: "오늘 해야 할 것 · 피해야 할 것 확인하기 · 1,900원",
  };
}

function buildCategoryPreviewProfile(params: {
  categoryId: CategoryId;
  categoryTitle: string;
  user: UserInfo;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed: number;
  scoreVisual: RelationshipScoreVisual;
}): CategoryPreviewProfile | null {
  let profile = buildCategoryPreviewProfileBase(params);
  if (!profile) return null;
  if (profile.kind === "health") {
    // 무료/preview에는 유료 healthPaidReport를 만들지 않는다.
    // 유료 요청이 완료되기 전에 기본 유료 내용이 먼저 노출되는 원인을 차단한다.
    profile = {
      ...profile,
      healthStory: buildHealthLongformStory({
        user: params.user,
        manse: params.manse,
        fortuneSeed: params.fortuneSeed,
        profile,
      }),
      healthPaidReportSource: undefined,
      healthPaidReport: undefined,
    } as CategoryPreviewProfile;
  }

  const webtoonScenes = buildSharedCategoryWebtoonScenes({
    user: params.user,
    manse: params.manse,
    partnerManse: params.partnerManse || null,
    fortuneSeed: params.fortuneSeed,
    profile,
    categoryTitle: params.categoryTitle,
  });
  return { ...profile, webtoonScenes } as CategoryPreviewProfile;
}

function buildCategoryPreviewProfilePromptBlock(profile: CategoryPreviewProfile | null) {
  if (!profile) return "";
  const webtoonRule = `\n[전 카테고리 무료 웹툰 연결 규칙 v177 - 사람마다 내용 자체가 달라져야 함]\n- webtoonScenes는 무료 결과에서 사용할 확정 장면 흐름이다. 유료에서 핵심 판정과 방향을 뒤집지 마라.\n- dohoonImageKey는 실제 이미지 파일명이 아니라 opening/thinking/analysis/reveal/warning/decision/guide/confidence/future/mystery/ending 같은 장면 의미 키다.\n- route.ts는 이미지 파일 경로를 절대 고르지 않는다. page.tsx가 /characters/dohoon 전체 이미지 풀에서 의미 키와 category에 맞는 컷을 안정적으로 선택한다.\n- sceneKey, intensity, mood, shot은 화면 연출용 내부 데이터다. 고객 본문에 그대로 출력하지 마라.\n- 무료 webtoonScenes의 dialogue/narration/emphasis는 이 사람의 강한 오행·약한 오행·십성 중심축·카테고리 판정을 이미 반영한 개인화 장면이다. 다른 사람에게 그대로 재사용하면 실패다.\n- 유료 본문에서도 무료 장면의 개인화 근거를 유지하고, 갑자기 누구에게나 맞는 공통 문장으로 되돌아가지 마라.\n- 건강운 유료 최종판정은 반드시 결론→왜 이런 판정인지→가장 강한 건강 패턴→가장 위험한 반복 패턴→다음 체크 시기→올해 주의 시기→지금 바꿀 행동 1개→장기 관리 방향→마지막 한 문장 순서로 회수해라.\n- 건강운 최종판정은 앞 내용을 단순 요약하지 마라. 사용자가 돈을 내고 끝까지 읽은 보람이 느껴지게 이 사람에게만 해당하는 이유와 행동 우선순위를 분명하게 판정해라.\n- 질병명·확정 진단·공포를 유발하는 단정은 금지한다. 건강운은 생활 리듬과 취약 경향을 설명하고 실제 증상은 검진을 우선하도록 안내해라.\n- 무료에서 던진 질문·경고·반전은 유료에서 반드시 이유와 현실 해답으로 회수해라.\n- locked 장면은 무료의 클리프행어다. 유료에서 시기·유형·행동 순서·구체 판정으로 풀어라.`;
  return `[CATEGORY_PROFILE_DATA]\n${JSON.stringify(profile, null, 2)}\n\n[CATEGORY_GENERATION_RULES]\n- 위 값은 무료 웹툰에서 먼저 공개되는 고정 판정이다. 유료에서 숫자, 순위, 핵심 판정, 시기를 뒤집지 마라.\n- 유료는 위 판정이 왜 나왔는지, 현실에서 어떤 장면으로 나타나는지, 무엇을 해야 하는지를 길게 설명해라.\n- JSON 원문, 내부 점수 계산식, 오행 원시값, seed는 고객 결과에 그대로 노출하지 마라.\n- 조건문으로 흐리지 말고 실제 이 사람에게 해당하는 결론으로 말해라.${webtoonRule}`;
}

function getHealthGrade(manse: any): Grade {
  const { fire, earth, metal, water } = getElementSnapshot(manse);
  let score = 5;

  if (fire >= 1) score += 1;
  if (fire >= 2) score += 1;
  if (water >= 1) score += 1;
  if (earth >= 2) score += 1;
  if (fire === 0) score -= 3;
  if (metal === 0) score -= 1;
  if (earth >= 4) score -= 1;
  if (water === 0) score -= 1;

  return gradeByScore(score);
}

function getChildrenFlow(manse: any) {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  let score = 0;

  score += wood >= 2 ? 2 : wood;
  score += fire >= 1 ? 1 : 0;
  score += water >= 2 ? 2 : water;
  score += earth >= 2 ? 1 : 0;
  if (metal === 0) score -= 1;
  if (fire === 0) score -= 1;

  if (score >= 5)
    return "자식 인연이 비교적 강하고, 자식복이 관계 속에서 드러나는 편";
  if (score >= 3)
    return "자식운은 중간 이상이지만 기대와 거리 조율이 중요한 편";
  if (score >= 1) return "자식운이 늦게 드러나거나 책임과 함께 들어오는 편";
  return "자식운은 약하게 단정하기보다 관계 조율과 양육 기준이 중요한 편";
}

function getMarriageFlow(manse: any) {
  const { earth, metal, water, fire } = getElementSnapshot(manse);
  if (earth >= 3 && fire === 0) return "늦게 안정되는 결혼운";
  if (metal >= 2 || water >= 2) return "기준이 맞아야 열리는 결혼운";
  if (fire >= 2)
    return "인연이 빠르게 들어올 수 있지만 선택 기준이 중요한 결혼운";
  return "생활 기준을 맞춰야 안정되는 결혼운";
}

function getCompatibilityScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 65,
      grade: "정보 부족형 궁합",
      summary: "상대방 정보가 부족해서 기본 궁합만 보는 흐름",
      risk: "상대방 생년월일과 출생시간이 없으면 실제 충돌 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 60;

  if (
    me.weakestElement &&
    partner.strongestElement &&
    me.weakestElement === partner.strongestElement
  )
    score += 10;
  if (
    partner.weakestElement &&
    me.strongestElement &&
    partner.weakestElement === me.strongestElement
  )
    score += 10;
  if (
    me.strongestElement &&
    partner.strongestElement &&
    me.strongestElement === partner.strongestElement
  )
    score -= 8;

  const myTotal = me.wood + me.fire + me.earth + me.metal + me.water || 1;
  const partnerTotal =
    partner.wood +
      partner.fire +
      partner.earth +
      partner.metal +
      partner.water || 1;

  const diff =
    Math.abs(me.wood / myTotal - partner.wood / partnerTotal) +
    Math.abs(me.fire / myTotal - partner.fire / partnerTotal) +
    Math.abs(me.earth / myTotal - partner.earth / partnerTotal) +
    Math.abs(me.metal / myTotal - partner.metal / partnerTotal) +
    Math.abs(me.water / myTotal - partner.water / partnerTotal);

  if (diff < 0.8) score += 8;
  if (diff > 1.6) score -= 8;
  if (me.fire === 0 && partner.fire === 0) score -= 7;
  if (me.earth >= 3 && partner.earth >= 3) score -= 7;
  if (
    (me.water >= 2 && partner.fire >= 2) ||
    (partner.water >= 2 && me.fire >= 2)
  )
    score += 1;

  score = Math.max(35, Math.min(92, score));

  if (score >= 85) {
    return {
      score,
      grade: "좋은 궁합",
      summary: "서로 보완하는 힘이 강해서 오래 갈 가능성이 있는 궁합",
      risk: "좋다고 방심하면 생활 기준에서 작은 균열이 생길 수 있다",
    };
  }

  if (score >= 75) {
    return {
      score,
      grade: "괜찮은 궁합",
      summary: "끌림과 현실 조율이 함께 있는 궁합",
      risk: "초반에는 잘 맞아도 돈, 가족, 생활 리듬을 맞춰야 오래 간다",
    };
  }

  if (score >= 60) {
    return {
      score,
      grade: "보통 궁합",
      summary: "좋은 부분과 부딪히는 부분이 같이 있는 궁합",
      risk: "서로의 차이를 이해하지 못하면 같은 문제로 반복해서 싸울 수 있다",
    };
  }

  if (score >= 50) {
    return {
      score,
      grade: "주의가 필요한 궁합",
      summary: "끌림은 있어도 결혼이나 장기 관계에서는 조율이 많이 필요한 궁합",
      risk: "감정만 믿고 밀어붙이면 생활 문제에서 크게 부딪힐 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 궁합",
    summary: "처음 끌림보다 오래 맞춰가는 과정이 훨씬 어려운 궁합",
    risk: "결혼까지 보려면 돈, 가족, 말투, 생활방식을 먼저 맞춰야 오래 간다",
  };
}


function getSokgunghapScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 67,
      grade: "정보 부족형 가까워졌을 때 맞는지",
      summary: "상대 생년월일이 부족해서 끌림과 거리감만 기본으로 보는 흐름",
      risk: "상대 정보가 부족하면 실제 스킨십 속도와 식는 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 68;

  if (me.fire >= 2 && partner.fire >= 2) score += 10;
  if (me.water >= 2 && partner.water >= 2) score += 6;
  if (me.fire >= 1 && partner.water >= 1) score += 4;
  if (partner.fire >= 1 && me.water >= 1) score += 4;
  if (me.wood >= 2 && partner.fire >= 1) score += 3;
  if (partner.wood >= 2 && me.fire >= 1) score += 3;

  if (Math.abs(me.fire - partner.fire) >= 3) score -= 8;
  if (Math.abs(me.water - partner.water) >= 3) score -= 6;
  if (me.fire === 0 && partner.fire === 0) score -= 10;
  if (me.earth >= 4 && partner.earth >= 4) score -= 5;
  if (me.metal >= 3 && partner.metal >= 3) score -= 4;

  score = Math.max(42, Math.min(94, score));

  if (score >= 88) {
    return {
      score,
      grade: "강한 가까워졌을 때 맞는지",
      summary: "처음 끌림도 강하고 가까워지는 속도도 크게 어긋나지 않는 궁합",
      risk: "감정싸움이 길어지면 좋은 끌림도 자존심 싸움으로 식을 수 있다",
    };
  }

  if (score >= 78) {
    return {
      score,
      grade: "괜찮은 가까워졌을 때 맞는지",
      summary: "끌림은 분명하지만 말투와 감정 속도에 따라 뜨거워지거나 식는 궁합",
      risk: "서운함이 쌓이면 스킨십도 같이 어색해질 수 있다",
    };
  }

  if (score >= 65) {
    return {
      score,
      grade: "속도 조율형 가까워졌을 때 맞는지",
      summary: "처음 끌림은 있으나 한쪽은 빠르고 한쪽은 천천히 열릴 수 있는 궁합",
      risk: "한쪽은 부족하다고 느끼고 한쪽은 부담스럽다고 느낄 수 있다",
    };
  }

  if (score >= 55) {
    return {
      score,
      grade: "주의가 필요한 가까워졌을 때 맞는지",
      summary: "끌림은 있어도 자연스럽게 맞물리기보다 한쪽이 맞춰줘야 하는 궁합",
      risk: "시간이 지나면 스킨십보다 피로가 먼저 쌓일 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 가까워졌을 때 맞는지",
    summary: "처음 호기심은 있어도 오래 붙는 힘은 약하게 보는 궁합",
    risk: "억지로 맞추면 더 식고, 가까워질수록 한쪽이 피곤해질 수 있다",
  };
}

function getDominantElementForTaste(manse: any) {
  const snap = getElementSnapshot(manse);
  const items = [
    { key: "목", value: snap.wood },
    { key: "화", value: snap.fire },
    { key: "토", value: snap.earth },
    { key: "금", value: snap.metal },
    { key: "수", value: snap.water },
  ].sort((a, b) => b.value - a.value);

  return items[0]?.value > 0 ? items[0].key : String(snap.strongestElement || "토");
}

function getPartnerAttractionProfile(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      ideal: "상대 정보가 부족해서 이상형을 강하게 단정하지 않는다.",
      speech: "상대 생년월일이 들어오면 어떤 말투에 약한지 더 선명하게 본다.",
      look: "외형과 분위기는 상대 사주 기준으로 다시 갈라야 한다.",
      intimacy: "가까워졌을 때 맞는지은 상대 정보가 있어야 점수와 식는 지점이 정확해진다.",
      fit: "현재는 본인 사주 중심의 끌림만 본다.",
      mismatch: "상대 정보가 없으면 둘 사이의 어긋나는 지점은 확정하지 않는다.",
    };
  }

  const dominant = getDominantElementForTaste(partnerManse);
  const me = getElementSnapshot(myManse);

  const profileMap: Record<string, {
    ideal: string;
    speech: string;
    look: string;
    intimacy: string;
    fitNeed: "wood" | "fire" | "earth" | "metal" | "water";
  }> = {
    목: {
      ideal: "상대는 답답하게 묶는 사람보다 같이 움직이고 성장하는 사람에게 끌린다.",
      speech: "상대는 가르치듯 누르는 말보다 길을 열어주는 말, 같이 해보자는 말에 약하다.",
      look: "상대는 너무 꾸민 느낌보다 자연스럽고 생기 있는 분위기, 건강하게 움직이는 인상에 눈이 간다.",
      intimacy: "상대는 무겁게 몰아가는 분위기보다 장난과 대화 속에서 자연스럽게 가까워지는 쪽이 맞다.",
      fitNeed: "wood",
    },
    화: {
      ideal: "상대는 반응이 빠르고 분위기를 살리는 사람에게 끌린다.",
      speech: "상대는 무뚝뚝한 말보다 바로 웃고 받아주는 말, 감정 표현이 살아 있는 말투에 약하다.",
      look: "상대는 표정, 눈빛, 생기, 옷차림의 포인트처럼 한눈에 들어오는 분위기에 끌린다.",
      intimacy: "상대는 분위기가 달아올라야 몸의 거리도 가까워진다. 식은 말투와 무반응에는 빨리 식는다.",
      fitNeed: "fire",
    },
    토: {
      ideal: "상대는 가볍고 변덕스러운 사람보다 믿고 기대도 되는 사람에게 마음이 열린다.",
      speech: "상대는 말만 번지르르한 것보다 약속을 지키는 말, 불안하게 흔들지 않는 말에 약하다.",
      look: "상대는 극단적으로 튀는 외형보다 편안하고 안정감 있는 인상, 생활감이 정돈된 분위기를 본다.",
      intimacy: "상대는 믿음이 쌓여야 몸도 편해진다. 흔드는 사람보다 꾸준히 곁에 있는 사람에게 긴장이 풀린다.",
      fitNeed: "earth",
    },
    금: {
      ideal: "상대는 기준이 흐린 사람보다 말과 행동이 분명한 사람에게 끌린다.",
      speech: "상대는 예의 없는 농담이나 감정적인 몰아붙임에 바로 닫힌다. 선 있는 말투에 약하다.",
      look: "상대는 옷차림, 피부결, 향, 자세처럼 깔끔하고 정돈된 분위기에 끌린다.",
      intimacy: "상대는 아무렇게나 흐르는 분위기보다 신뢰와 긴장감이 살아 있을 때 더 끌린다.",
      fitNeed: "metal",
    },
    수: {
      ideal: "상대는 처음부터 확 밀고 들어오는 사람보다 천천히 마음을 열어주는 사람에게 끌린다.",
      speech: "상대는 대답을 재촉하는 말보다 조용히 기다려주고 속마음을 알아주는 말에 약하다.",
      look: "상대는 과하게 튀는 외형보다 은근한 분위기, 깊은 눈빛, 차분한 색감에 마음이 간다.",
      intimacy: "상대는 마음이 먼저 편해야 몸도 열린다. 급하게 다가오면 닫히고, 천천히 풀리면 깊어진다.",
      fitNeed: "water",
    },
  };

  const selected = profileMap[dominant] || profileMap.토;
  const fitValue =
    selected.fitNeed === "wood" ? me.wood :
    selected.fitNeed === "fire" ? me.fire :
    selected.fitNeed === "earth" ? me.earth :
    selected.fitNeed === "metal" ? me.metal :
    me.water;

  return {
    ideal: selected.ideal,
    speech: selected.speech,
    look: selected.look,
    intimacy: selected.intimacy,
    fit: fitValue >= 2
      ? "네 사주에는 상대가 끌리는 분위기와 맞는 부분이 있다. 처음부터 완전히 어긋나는 궁합은 아니다."
      : "네 사주는 상대 취향과 맞는 부분이 약하다. 끌림이 있어도 네가 다가가는 방식이 상대에게 부담으로 갈 수 있다.",
    mismatch: fitValue >= 2
      ? "다만 맞는 부분이 있다고 방심하면 안 된다. 말투와 가까워지는 속도가 틀어지면 상대는 바로 식을 수 있다."
      : "어긋나는 부분은 가까워지는 속도와 표현 방식에서 나온다. 네가 빨리 당기면 상대는 뒤로 물러날 수 있다.",
  };
}

function getFamilyScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 63,
      grade: "정보 부족형 가족궁합",
      summary: "상대방 정보가 부족해서 기본 가족관계 흐름만 보는 구조",
      risk: "상대방 생년월일과 출생시간이 없으면 실제 충돌 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 60;

  if (
    me.weakestElement &&
    partner.strongestElement &&
    me.weakestElement === partner.strongestElement
  )
    score += 8;
  if (
    partner.weakestElement &&
    me.strongestElement &&
    partner.weakestElement === me.strongestElement
  )
    score += 8;
  if (
    me.strongestElement &&
    partner.strongestElement &&
    me.strongestElement === partner.strongestElement
  )
    score -= 6;

  if (me.earth >= 3 && partner.earth >= 3) score -= 8;
  if (me.fire === 0 && partner.fire === 0) score -= 5;
  if (me.water >= 2 && partner.water >= 2) score += 4;
  if (me.metal === 0 && partner.metal === 0) score -= 4;

  const myTotal = me.wood + me.fire + me.earth + me.metal + me.water || 1;
  const partnerTotal =
    partner.wood +
      partner.fire +
      partner.earth +
      partner.metal +
      partner.water || 1;

  const diff =
    Math.abs(me.wood / myTotal - partner.wood / partnerTotal) +
    Math.abs(me.fire / myTotal - partner.fire / partnerTotal) +
    Math.abs(me.earth / myTotal - partner.earth / partnerTotal) +
    Math.abs(me.metal / myTotal - partner.metal / partnerTotal) +
    Math.abs(me.water / myTotal - partner.water / partnerTotal);

  if (diff < 0.8) score += 6;
  if (diff > 1.6) score -= 6;

  score = Math.max(35, Math.min(92, score));

  if (score >= 85) {
    return {
      score,
      grade: "좋은 가족궁합",
      summary: "서로의 부족한 부분을 보완할 수 있는 가족관계",
      risk: "가깝다는 이유로 선을 무시하면 작은 서운함이 쌓일 수 있다",
    };
  }

  if (score >= 75) {
    return {
      score,
      grade: "괜찮은 가족궁합",
      summary: "정은 있지만 생활 기준과 말투를 맞춰야 안정되는 관계",
      risk: "가족이라는 이유로 기대가 커지면 부담과 서운함이 반복될 수 있다",
    };
  }

  if (score >= 60) {
    return {
      score,
      grade: "보통 가족궁합",
      summary: "좋은 마음과 부딪히는 지점이 같이 있는 가족관계",
      risk: "역할, 책임, 돈 문제에서 선을 정하지 않으면 반복해서 감정이 상할 수 있다",
    };
  }

  if (score >= 50) {
    return {
      score,
      grade: "거리 조절이 필요한 가족궁합",
      summary: "정은 있어도 가까울수록 피로가 쌓일 수 있는 관계",
      risk: "한쪽이 계속 참거나 책임지면 관계가 무거워질 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 가족궁합",
    summary: "가깝게 지낼수록 말투, 책임, 돈 문제에서 충돌이 커질 수 있는 관계",
    risk: "정으로만 버티면 관계가 회복되기보다 감정 피로가 누적될 수 있다",
  };
}

function getBusinessPartnerScore(myManse: any, partnerManse: any | null) {
  if (!partnerManse) {
    return {
      score: 62,
      grade: "정보 부족형 파트너궁합",
      summary: "상대방 정보가 부족해서 기본 동업 흐름만 보는 구조",
      risk: "상대방 생년월일과 출생시간이 없으면 돈과 역할 충돌 지점이 흐려질 수 있다",
    };
  }

  const me = getElementSnapshot(myManse);
  const partner = getElementSnapshot(partnerManse);
  let score = 58;

  if (
    me.weakestElement &&
    partner.strongestElement &&
    me.weakestElement === partner.strongestElement
  )
    score += 8;
  if (
    partner.weakestElement &&
    me.strongestElement &&
    partner.weakestElement === me.strongestElement
  )
    score += 8;
  if (
    me.strongestElement &&
    partner.strongestElement &&
    me.strongestElement === partner.strongestElement
  )
    score -= 6;

  if (
    (me.earth >= 2 && partner.metal >= 1) ||
    (partner.earth >= 2 && me.metal >= 1)
  )
    score += 7;
  if (
    (me.water >= 2 && partner.fire >= 1) ||
    (partner.water >= 2 && me.fire >= 1)
  )
    score += 5;
  if (me.metal === 0 && partner.metal === 0) score -= 8;
  if (me.fire === 0 && partner.fire === 0) score -= 4;
  if (me.earth >= 3 && partner.earth >= 3) score -= 5;

  const myTotal = me.wood + me.fire + me.earth + me.metal + me.water || 1;
  const partnerTotal =
    partner.wood +
      partner.fire +
      partner.earth +
      partner.metal +
      partner.water || 1;

  const diff =
    Math.abs(me.wood / myTotal - partner.wood / partnerTotal) +
    Math.abs(me.fire / myTotal - partner.fire / partnerTotal) +
    Math.abs(me.earth / myTotal - partner.earth / partnerTotal) +
    Math.abs(me.metal / myTotal - partner.metal / partnerTotal) +
    Math.abs(me.water / myTotal - partner.water / partnerTotal);

  if (diff < 0.8) score += 4;
  if (diff > 1.7) score -= 7;

  score = Math.max(35, Math.min(92, score));

  if (score >= 85) {
    return {
      score,
      grade: "좋은 사업파트너궁합",
      summary:
        "역할을 나누면 서로의 부족한 부분을 채워 돈 흐름을 만들 수 있는 관계",
      risk: "좋은 궁합이어도 계약과 돈 기준을 대충 넘기면 나중에 균열이 생길 수 있다",
    };
  }

  if (score >= 75) {
    return {
      score,
      grade: "괜찮은 사업파트너궁합",
      summary:
        "같이 일할 수 있는 힘은 있지만 역할과 책임을 정확히 나눠야 하는 관계",
      risk: "처음엔 잘 맞아도 수익 배분, 업무 강도, 결정권에서 부딪힐 수 있다",
    };
  }

  if (score >= 60) {
    return {
      score,
      grade: "보통 사업파트너궁합",
      summary:
        "아이디어나 방향은 맞을 수 있지만 돈 기준을 잡아야 하는 동업 관계",
      risk: "말로만 시작하면 역할, 책임, 비용 부담에서 반복 충돌이 생길 수 있다",
    };
  }

  if (score >= 50) {
    return {
      score,
      grade: "주의가 필요한 사업파트너궁합",
      summary: "같이 일하려면 계약과 역할 분담이 매우 중요한 관계",
      risk: "호감이나 의리로 시작하면 돈 문제에서 관계가 틀어질 수 있다",
    };
  }

  return {
    score,
    grade: "쉽지 않은 사업파트너궁합",
    summary: "같이 돈을 벌기보다 책임과 기준 문제로 부딪히기 쉬운 관계",
    risk: "동업으로 가면 수익 배분, 결정권, 책임 소재에서 피로가 커질 수 있다",
  };
}

function getLifeFlow(manse: any) {
  const { earth, fire, metal, water } = getElementSnapshot(manse);
  if (earth >= 3 && fire === 0)
    return "초년에는 책임이 먼저 붙고, 30대 중반부터 돈눈이 뜨며, 40대 초중반부터 일과 돈이 같이 붙는 사주";
  if (water >= 2 && metal === 0)
    return "생각과 촉은 빠른데 30대 초중반까지 방향이 흔들리고, 중년 초입부터 정보·거래·전문성으로 풀리는 사주";
  if (fire >= 2)
    return "청년기부터 움직일 문은 빨리 열리지만, 판을 크게 벌리면 꺾이고 30대 이후 선택을 줄일수록 살아나는 사주";
  return "초년엔 느리지만 30대 후반부터 쌓은 일이 돈으로 바뀌고, 중년 이후 안정되는 사주";
}

function getMajorLuckChanceCount(manse: any) {
  const { earth, fire, metal, water, wood } = getElementSnapshot(manse);
  let score = 0;
  if (earth >= 3) score += 1;
  if (water >= 2) score += 1;
  if (wood >= 2) score += 1;
  if (fire >= 2) score += 1;
  if (metal >= 2) score += 1;
  if (fire === 0 || metal === 0) score -= 1;
  if (score >= 3) return "3번";
  if (score >= 1) return "2번";
  return "1~2번";
}

function getMostImportantLuckPhase(manse: any) {
  const { earth, fire, metal, water } = getElementSnapshot(manse);
  if (earth >= 3 && fire === 0) return "청년 후반부터 중년 초입";
  if (water >= 2 && metal === 0) return "중년 초입부터 중년 중반";
  if (fire >= 2) return "청년기부터 빠르게 열리는 시기";
  if (metal >= 2) return "중년 이후 자리 잡는 시기";
  return "중년 이후 안정적으로 커지는 시기";
}

function getCareerArchetype(manse: any) {
  const {
    wood,
    fire,
    earth,
    metal,
    water,
    strongestElement,
    weakestElement,
    dayMaster,
  } = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);

  let officeScore = 0;
  let businessScore = 0;
  let sideJobScore = 0;
  let freelanceScore = 0;
  let expertScore = 0;

  if (metal >= 3) officeScore += 5;
  if (metal === 2) officeScore += 3;
  if (metal === 1) officeScore += 1;
  if (water >= 2 && metal >= 1) officeScore += 1;
  if (earth >= 2 && metal >= 2) officeScore += 1;
  if (metal === 0) officeScore -= 4;

  if (earth >= 3) businessScore += 3;
  if (fire >= 2) businessScore += 3;
  if (wood >= 2) businessScore += 2;
  if (water >= 2 && earth >= 2) businessScore += 1;
  if (metal === 0 && earth >= 3) businessScore += 1;

  if (earth >= 2 && metal === 0) sideJobScore += 5;
  if (earth >= 3 && fire === 0) sideJobScore += 3;
  if (water >= 2) sideJobScore += 2;
  if (wood >= 1) sideJobScore += 1;
  if (fire <= 1 && earth >= 3) sideJobScore += 1;

  if (wood >= 2) freelanceScore += 2;
  if (fire >= 2) freelanceScore += 4;
  if (wood >= 2 && fire >= 1) freelanceScore += 2;
  if (metal === 0 && fire >= 1) freelanceScore += 1;

  if (water >= 2) expertScore += 3;
  if (earth >= 2) expertScore += 2;
  if (metal >= 1) expertScore += 1;
  if (wood >= 1 && water >= 1) expertScore += 1;

  if (authority >= 3) officeScore += 4;
  if (authority >= 2 && resource >= 1) officeScore += 1;
  if (wealth >= 3) businessScore += 4;
  if (wealth >= 2 && output >= 2) businessScore += 2;
  if (output >= 2) sideJobScore += 2;
  if (output >= 3) freelanceScore += 4;
  if (resource >= 3) expertScore += 4;

  if (earth >= 3 && metal === 0) {
    sideJobScore += 4;
    businessScore += 1;
    officeScore -= 3;
  }

  if (earth >= 3 && fire === 0 && metal === 0) {
    sideJobScore += 3;
    expertScore += 1;
    officeScore -= 2;
  }

  if (water >= 2 && metal === 0) {
    sideJobScore += 2;
    expertScore += 1;
  }

  const scores = [
    { type: "직장형", score: officeScore },
    { type: "사업형", score: businessScore },
    { type: "부업형", score: sideJobScore },
    { type: "프리랜서형", score: freelanceScore },
    { type: "전문기술형", score: expertScore },
  ].sort((a, b) => b.score - a.score);

  const primary = scores[0];
  const secondary = scores[1];
  let combined = primary.type;

  if (
    primary.type === "부업형" &&
    (secondary.type === "사업형" || secondary.type === "전문기술형")
  ) {
    combined = "부업형에 가까운 자기수익형";
  } else if (primary.type === "부업형" && secondary.type === "직장형") {
    combined = "직장+부업형";
  } else if (primary.type === "사업형" && secondary.type === "부업형") {
    combined = "사업형이지만 부업부터 키워야 하는 타입";
  } else if (primary.type === "전문기술형" && secondary.type === "부업형") {
    combined = "전문기술+부업형";
  } else if (primary.type === "직장형" && secondary.type === "부업형") {
    combined = "직장 기반 부업형";
  }

  let warning = "초기비용이 크거나 감정적으로 급하게 결정하는 구조";
  if (combined.includes("직장") && !combined.includes("부업"))
    warning = "규칙 없는 프리랜서형이나 준비 없는 창업";
  if (combined.includes("사업"))
    warning = "준비 없이 크게 벌이는 사업, 무리한 확장, 빚내서 시작하는 구조";
  if (combined.includes("부업"))
    warning = "처음부터 크게 벌이는 사업, 먼저 빠지는 돈 큰 창업, 무리한 투자";
  if (combined.includes("프리랜서"))
    warning = "수입 구조 없이 감각만 믿고 움직이는 방식";
  if (combined.includes("전문기술"))
    warning = "기술 없이 말로만 하는 사업, 남의 말 듣고 시작하는 투자";

  return {
    wood,
    fire,
    earth,
    metal,
    water,
    strongestElement,
    weakestElement,
    dayMaster,
    scores,
    primary: primary.type,
    secondary: secondary.type,
    combined,
    warning,
    tenGods: { wealth, output, authority, resource },
  };
}

function getCareerArchetypeGuide(manse: any) {
  const career = getCareerArchetype(manse);
  const scoreLines = career.scores
    .map((item) => `- ${item.type}: ${item.score}`)
    .join(NL);

  return `
[고정 직업 성향 판정]
이 판정은 route.ts 코드에서 오행 분포와 십성 분포를 바탕으로 계산된 고정값이다.
AI는 이 판정을 절대 바꾸지 말고, 이 판정을 기준으로만 설명해라.

[사용한 오행 점수]
- 목: ${career.wood}
- 화: ${career.fire}
- 토: ${career.earth}
- 금: ${career.metal}
- 수: ${career.water}

[사용한 십성 보조 점수]
- 재성 묶음: ${career.tenGods?.wealth ?? 0}
- 식상 묶음: ${career.tenGods?.output ?? 0}
- 관성 묶음: ${career.tenGods?.authority ?? 0}
- 인성 묶음: ${career.tenGods?.resource ?? 0}

[기본 정보]
- 일간: ${career.dayMaster}
- 강한 오행: ${career.strongestElement}
- 약한 오행: ${career.weakestElement}

[직업 성향 점수]
${scoreLines}

[최종 고정 판정]
- 1순위: ${career.primary}
- 2순위: ${career.secondary}
- 최종 표현: ${career.combined}
- 피해야 할 방식: ${career.warning}

[해석 규칙]
- 일·사업운, 재물운, 인생대운, 올해운세, 평생종합사주, 내 고민 상담에서만 이 판정을 사용해라.
- 연애운, 결혼운, 궁합운, 가족관계, 사업파트너, 건강운, 자식운, 오늘운세에서는 직업 성향 판정을 언급하지 마라.
- 1순위와 2순위를 뒤집지 마라.
- 최종 표현을 절대 바꾸지 마라.
- "안정적인 직장형이 우선"처럼 최종 표현과 다른 말을 하지 마라.
- "안정적인 기반이 필요하다"와 "직장형이다"는 다르다.
- 안정 기반이 필요하다고 해서 직장형으로 결론 내리지 마라.
- 재물운에서도 직업 성향을 말해야 한다면 반드시 위 [최종 표현]과 같은 표현을 사용해라.
- 올해운세, 평생종합사주, 내 고민 상담에서도 직업 성향을 말해야 한다면 반드시 위 [최종 표현]과 같은 표현을 사용해라.
- 사주상 기반이 필요한 사람에게는 "직장을 다니며 부업"이라고 단정하지 말고, "생활 기반이나 고정 수입 구조 위에 자기 돈이 남는 자리를 얹을 때 좋다"라고 표현해라.
`;
}

type MoneyPattern =
  | "cashflow_manager"
  | "small_sales_tester"
  | "skill_price_builder"
  | "knowledge_packager"
  | "relationship_settlement"
  | "slow_asset_accumulator"
  | "high_leakage_controller";

function getMoneyPattern(manse: any): MoneyPattern {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);

  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  if (wealth >= 3 && output >= 2) return "small_sales_tester";
  if (output >= 3) return "skill_price_builder";
  if (resource >= 3 || water >= 3) return "knowledge_packager";
  if (authority >= 3 || (earth >= 3 && metal >= 1)) return "cashflow_manager";
  if (peer >= 3) return "relationship_settlement";

  if (earth >= 4 && fire <= 1) return "slow_asset_accumulator";
  if (water >= 3 && metal === 0) return "high_leakage_controller";
  if (earth >= 3 && metal === 0) return "slow_asset_accumulator";
  if (fire >= 2 && wood >= 2) return "small_sales_tester";
  if (metal >= 2 && earth >= 2) return "cashflow_manager";

  return "high_leakage_controller";
}

function getMoneyPatternLabel(pattern: MoneyPattern) {
  const map: Record<MoneyPattern, string> = {
    cashflow_manager: "돈은 사람과 일의 흐름을 끝까지 잡을 때 붙는다",
    small_sales_tester: "돈은 사람을 만나고 물건이 움직일 때 붙는다",
    skill_price_builder: "돈은 손에 잡히는 기술과 결과가 있을 때 붙는다",
    knowledge_packager:
      "돈은 생각으로만 보관하면 늦고 실제 일의 결과가 보일 때 붙는다",
    relationship_settlement: "돈은 필요한 사람과 필요한 일을 이어줄 때 붙는다",
    slow_asset_accumulator: "돈은 빨리 터지기보다 늦게 모여 단단해진다",
    high_leakage_controller: "돈은 새는 구멍을 끊을 때부터 남기 시작한다",
  };

  return map[pattern];
}

function getMoneyProfile(manse: any): SajuProfile {
  const career = getCareerArchetype(manse);
  const moneyGrade = getMoneyGrade(manse);
  const pattern = getMoneyPattern(manse);
  const label = getMoneyPatternLabel(pattern);

  if (pattern === "cashflow_manager") {
    return {
      type: label,
      core: `재물운은 '${moneyGrade}'으로 본다. 돈은 그냥 월급만 기다리는 자리보다 사람과 일의 흐름을 끝까지 잡을 때 붙는다. 회사 안에서는 영업관리, 거래처관리, 구매, 운영, 품질, 현장관리처럼 일이 흘러가는 자리를 잡을 때 돈길이 산다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
      risk: "돈을 잃는 자리는 책임은 내가 지는데 이름과 몫은 남에게 넘어가는 자리다. 남 좋은 일만 하다가 내 돈은 늦게 오는 흐름이 가장 강한 악운이다.",
      direction:
        "잡아야 할 돈은 내가 맡은 일이 분명하고, 내가 움직인 만큼 결과가 남는 돈이다. 피해야 할 돈은 남 말에 끌려가서 들어가는 돈, 정 때문에 흐려지는 돈, 처음부터 크게 벌려야 한다는 돈이다.",
      avoid: [
        "책임만 크고 내 몫은 흐린 돈",
        "남 말 듣고 들어가는 돈",
        "처음부터 판 크게 벌리는 돈",
      ],
      action: [
        "회사 안에서는 거래처·구매·운영·현장 흐름이 보이는 자리",
        "밖에서는 내가 움직인 결과가 남는 일",
        "정 때문에 돈이 흐려지는 선택은 끊는 흐름",
      ],
    };
  }

  if (pattern === "small_sales_tester") {
    return {
      type: label,
      core: `재물운은 '${moneyGrade}'으로 본다. 가만히 앉아서 돈이 굴러오는 사주가 아니다. 사람을 만나고, 물건이 오가고, 내가 직접 보고 움직이는 자리에서 돈이 붙는다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
      risk: "돈을 잃는 자리는 남들이 대박 났다는 말만 듣고 따라 들어가는 돈이다. 큰 매장, 큰 재고, 큰 광고비처럼 먼저 돈부터 나가는 판은 복보다 부담이 먼저 붙는다.",
      direction:
        "잡아야 할 돈은 내 눈으로 물건과 사람 반응이 보이는 돈이다. 피해야 할 돈은 남의 성공담에 끌려 들어가는 돈, 내 손에 보이지 않는 돈, 급해서 잡는 돈이다.",
      avoid: [
        "대박났다는 말만 믿고 들어가는 돈",
        "큰 재고와 큰 매장부터 안는 돈",
        "내 눈으로 확인하지 않은 돈",
      ],
      action: [
        "사람 반응이 보이는 돈",
        "내가 감당할 수 있는 만큼 굴러가는 돈",
        "한 번으로 끝나지 않고 이어지는 돈",
      ],
    };
  }

  if (pattern === "skill_price_builder") {
    return {
      type: label,
      core: `재물운은 '${moneyGrade}'으로 본다. 말만 하는 돈보다 손에 잡히는 일에 돈이 붙는다. 고치고, 만들고, 챙기고, 다시 불러줄 만한 결과가 남을 때 재물운이 산다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
      risk: "돈을 잃는 자리는 공짜로 더 해주고, 정 때문에 못 받고, 몸만 바쁘고 이름은 안 남는 자리다. 잘해주기만 하면 복이 아니라 피로가 먼저 붙는다.",
      direction:
        "잡아야 할 돈은 내 손으로 끝을 볼 수 있는 돈이다. 피해야 할 돈은 부탁처럼 들어와서 돈은 흐리고 몸만 쓰게 만드는 돈이다.",
      avoid: [
        "공짜로 더 해주는 일",
        "정 때문에 남는 돈을 못 받는 일",
        "몸만 바쁘고 이름은 안 남는 일",
      ],
      action: [
        "내 손으로 끝을 볼 수 있는 일",
        "다시 불러줄 만한 결과가 남는 일",
        "잘해줘도 내 몫이 사라지지 않는 일",
      ],
    };
  }

  if (pattern === "knowledge_packager") {
    return {
      type: label,
      core: `재물운은 '${moneyGrade}'으로 본다. 머릿속으로만 굴리는 돈은 늦다. 실제 일의 결과가 보이고, 회사 안에서는 기획·구매·운영·관리처럼 맡은 역할이 눈에 보일 때 돈길이 열린다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
      risk: "돈을 잃는 자리는 생각만 길어지는 자리다. 더 보고, 더 준비하고, 더 확실해지길 기다리다가 돈이 움직이는 때를 놓치기 쉽다.",
      direction:
        "잡아야 할 돈은 말로만 남는 돈이 아니라 결과가 보이는 돈이다. 피해야 할 돈은 준비만 길고 실제로 내게 들어오는 몫이 보이지 않는 돈이다.",
      avoid: [
        "생각만 길어지는 돈",
        "말만 하고 끝나는 돈",
        "내게 들어오는 몫이 보이지 않는 자리",
      ],
      action: [
        "회사 안에서는 기획·구매·운영·관리처럼 결과가 보이는 자리",
        "밖에서는 말보다 실제 결과가 남는 일",
        "준비만 길어지는 흐름을 끊는 돈",
      ],
    };
  }

  if (pattern === "relationship_settlement") {
    return {
      type: label,
      core: `재물운은 '${moneyGrade}'으로 본다. 사람 사이에서 돈길이 열릴 수 있는 사주다. 누가 무엇을 필요로 하는지 보고, 사람과 일의 사이를 이어줄 때 돈이 붙는다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
      risk: "돈을 잃는 자리는 친하다고 돈을 흐리게 섞는 자리다. 정으로 시작한 돈은 나중에 악운으로 돌아오기 쉽다.",
      direction:
        "잡아야 할 돈은 좋은 사람 노릇으로 끝나는 돈이 아니라 내 몫이 분명한 돈이다. 피해야 할 돈은 친분, 의리, 미안함 때문에 흐려지는 돈이다.",
      avoid: [
        "친분 때문에 흐려지는 돈",
        "좋은 사람 노릇만 하다 끝나는 돈",
        "내 몫이 분명하지 않은 동업 돈",
      ],
      action: [
        "사람 사이 필요한 것을 이어주는 자리",
        "정 때문에 흐려지지 않는 돈",
        "좋은 사람보다 내 몫이 남는 사람으로 서는 흐름",
      ],
    };
  }

  if (pattern === "slow_asset_accumulator") {
    return {
      type: label,
      core: `재물운은 '${moneyGrade}'으로 본다. 초반에 크게 터지는 돈보다 늦게 모여 단단해지는 돈이 맞다. 빨리 벌려고 흔들리면 새고, 천천히 쌓는 돈에서는 재물운이 살아난다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
      risk: "돈을 잃는 자리는 급한 욕심으로 잡는 돈이다. 한 번에 크게 벌겠다는 돈, 남들이 뛰어든다고 같이 들어가는 돈에는 손해가 먼저 붙는다.",
      direction:
        "잡아야 할 돈은 오래 남는 돈이다. 피해야 할 돈은 급하게 잡는 돈, 한 번에 크게 뒤집겠다는 돈, 사람 말에 흔들려 들어가는 돈이다.",
      avoid: [
        "급하게 잡는 돈",
        "한 번에 크게 뒤집겠다는 돈",
        "사람 말에 흔들려 들어가는 돈",
      ],
      action: [
        "늦게 모여 단단해지는 돈",
        "오래 남는 돈",
        "초반보다 중년 이후 강해지는 돈길",
      ],
    };
  }

  return {
    type: label,
    core: `재물운은 '${moneyGrade}'으로 본다. 돈을 크게 벌기 전에 먼저 새는 구멍이 보이는 사주다. 돈이 없는 사주가 아니라, 정·사람·급한 선택 때문에 들어온 돈이 빠지는 흐름을 먼저 끊어야 재물운이 산다. 일·사업 성향은 '${career.combined}'으로 고정해서 본다.`,
    risk: "돈을 잃는 자리는 남 말 듣고 들어가는 돈, 정 때문에 쓰는 돈, 친분으로 끌려가는 돈, 급해서 잡는 돈이다.",
    direction:
      "잡아야 할 돈은 내가 보고 움직인 만큼 남는 돈이다. 피해야 할 돈은 남의 말, 정, 급한 욕심 때문에 붙는 돈이다.",
    avoid: ["남 말 듣고 들어가는 돈", "정 때문에 쓰는 돈", "친분으로 끌려가는 돈"],
    action: [
      "내가 보고 움직인 만큼 남는 돈",
      "정 때문에 새지 않는 돈",
      "급한 욕심이 끼지 않는 돈",
    ],
  };
}
function getCareerProfile(manse: any): SajuProfile {
  const career = getCareerArchetype(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);

  if (wealth >= 3 && output >= 2) {
    return {
      type: `${career.combined} / 실행수익형`,
      core: `너는 '${career.combined}'에 가깝고, 일은 실행해서 반응을 만들고 그 반응을 수익으로 바꾸는 쪽이 맞아.`,
      risk: "아이디어가 괜찮다고 바로 크게 시작하는 게 위험해.",
      direction:
        "작은 판매, 작은 서비스, 작은 프로젝트로 반응을 확인한 뒤 키워야 해.",
      avoid: [
        "먼저 빠지는 돈 큰 창업",
        "검증 없는 광고비 지출",
        "재고부터 쌓는 선택",
      ],
      action: [
        "작게 판을 열어보는 흐름 상품 만들기",
        "반응 기록하기",
        "되는 것만 남기기",
      ],
    };
  }

  if (output >= 3) {
    return {
      type: `${career.combined} / 표현·기술형`,
      core: `너는 '${career.combined}' 흐름 위에서 말, 기술, 손재주, 콘텐츠, 서비스처럼 밖으로 꺼내는 능력이 중요해.`,
      risk: "실력만 쌓고 가격표나 판매 구조를 만들지 않는 게 위험해.",
      direction: "기술이나 표현을 바로 상품·서비스·콘텐츠로 포장해야 해.",
      avoid: ["무료 노동", "가격 없는 서비스", "배우기만 하고 팔지 않는 구조"],
      action: [
        "서비스 메뉴 만들기",
        "가격표 만들기",
        "작은 고객 반응 확인하기",
      ],
    };
  }

  if (authority >= 3) {
    return {
      type: `${career.combined} / 책임관리형`,
      core: `너는 '${career.combined}'에 가깝지만, 일에서는 책임·관리·규칙·운영을 맡을 때 안정감이 생겨.`,
      risk: "남의 책임만 떠안고 내 돈이 남는 자리를 못 만드는 게 위험해.",
      direction: "관리 능력을 내 이름의 돈이 남는 자리로 옮기는 준비가 필요해.",
      avoid: ["보상 없는 책임", "감정노동 과다 역할", "내 역할이 흐린 일"],
      action: [
        "내가 맡을 역할 정하기",
        "보상 기준 확인하기",
        "관리 능력을 상품화하기",
      ],
    };
  }

  if (resource >= 3) {
    return {
      type: `${career.combined} / 지식전문형`,
      core: `너는 '${career.combined}' 흐름과 함께 기획, 분석, 구매·소싱, 자료 정리, 품질관리, 운영관리처럼 정리력과 판단력이 필요한 자리에서 일이 풀려.`,
      risk: "준비와 공부만 길어지고 실제 직무나 결과물로 연결하지 못하는 게 위험해.",
      direction:
        "배운 것을 막연한 조언으로 두지 말고, 기획안·비교표·견적표·운영표·관리표처럼 회사나 거래에서 바로 쓰이는 결과물로 바꿔야 해.",
      avoid: ["자격증만 늘리기", "완벽주의", "결과물 없는 공부"],
      action: [
        "기획·구매·관리·운영 중 맞는 직무로 좁히기",
        "비교표·견적표·운영표처럼 보이는 산출물 만들기",
        "마감일과 결과물 기준을 정해서 일하기",
      ],
    };
  }

  return {
    type: career.combined,
    core: `너는 '${career.combined}'에 가깝다. 직업명보다 중요한 건 돈과 역할이 만들어지는 구조야.`,
    risk: career.warning,
    direction:
      "생활 기반을 무너뜨리지 않으면서 맞는 직무와 돈길을 구체적으로 좁혀야 해. 회사라면 관리·영업·운영·현장 중 어디가 맞는지, 사업이라면 먼저 빠지는 돈가 낮고 돈이 묶이는 시간이 보이는 구조인지 먼저 봐야 해.",
    avoid: [
      career.warning,
      "남 말만 듣고 시작하는 일",
      "돈이 남는 자리 없는 일",
    ],
    action: [
      "맞는 직무군 3개로 좁히기",
      "월 먼저 빠지는 돈와 돈이 묶이는 시간 계산하기",
      "역할·가격·마감이 분명한 일만 받기",
    ],
  };
}

function getHealthProfile(manse: any): SajuProfile {
  const flow = getReadableElementFlow(manse);
  const healthGrade = getHealthGrade(manse);
  const snap = getElementSnapshot(manse);

  if (snap.fire === 0 || flow.weakest === "화") {
    return {
      type: "피로·수면·회복 리듬 약한 건강형",
      core: `건강운은 '${healthGrade}'으로 본다. 사주상 몸을 다시 데우고 회복시키는 리듬이 약하게 잡혀서, 무리하면 잠·피로·기운 저하가 먼저 흔들리는 흐름이야.`,
      risk: "잠을 줄이고 카페인으로 버티거나, 피곤한데 계속 약속과 일을 밀어붙이면 컨디션이 한 번에 꺼질 수 있어.",
      direction:
        "맞는 관리는 수면 시간 고정, 저녁 카페인 줄이기, 따뜻한 식사, 매일 20~30분 걷기, 가벼운 하체 근력운동이야. 피해야 할 건 밤샘, 공복 커피, 고강도 운동을 갑자기 몰아서 하는 습관이야.",
      avoid: [
        "밤늦게까지 화면 보며 잠 미루기",
        "피곤한데 커피·에너지음료로 버티기",
        "운동을 한 번에 몰아서 세게 하는 것",
      ],
      action: [
        "취침·기상 시간을 1시간 안에서 고정하기",
        "저녁 카페인과 야식 줄이기",
        "걷기 30분 + 하체 스트레칭부터 시작하기",
      ],
    };
  }

  if (snap.earth >= 4 || flow.weakest === "토") {
    return {
      type: "위장·소화·장 리듬 예민형",
      core: `건강운은 '${healthGrade}'으로 본다. 사주상 책임과 긴장이 몸에 쌓일 때 위장·소화·장 리듬으로 먼저 드러나기 쉬운 흐름이야.`,
      risk: "속이 더부룩한데도 계속 참거나, 스트레스를 야식·과식·매운 음식으로 풀면 몸이 먼저 무거워진다.",
      direction:
        "맞는 관리는 식사 시간 고정, 야식 줄이기, 찬 음료 줄이기, 따뜻한 국물·죽·익힌 채소·두부·계란·생선처럼 부담 적은 음식으로 속을 덜 자극하는 거야. 운동은 식후 바로 눕지 않고 20분 걷기, 복부를 압박하지 않는 스트레칭이 맞다.",
      avoid: [
        "야식과 과식",
        "찬 음료와 자극적인 음식",
        "속이 불편한데 계속 버티는 것",
      ],
      action: [
        "식사 시간을 일정하게 잡기",
        "매운 음식·기름진 음식·찬 음료 줄이기",
        "식후 20분 걷기와 가벼운 복부·허리 스트레칭",
      ],
    };
  }

  if (flow.weakest === "수") {
    return {
      type: "수면·순환·냉한 회복력 관리형",
      core: `건강운은 '${healthGrade}'으로 본다. 사주상 회복력과 순환 리듬을 챙겨야 안정되는 구조라, 몸이 차가워지거나 잠이 깨지면 컨디션이 쉽게 흔들릴 수 있어.`,
      risk: "물을 너무 안 마시거나, 몸을 차갑게 두거나, 쉬어도 회복이 안 되는 느낌을 방치하는 게 위험해.",
      direction:
        "맞는 관리는 따뜻한 물, 규칙적인 수면, 하체 보온, 가벼운 걷기, 종아리·발목 스트레칭이야. 피해야 할 건 찬 음료를 자주 마시는 습관, 오래 앉아만 있는 패턴이야.",
      avoid: [
        "찬 음료와 몸을 차갑게 두는 습관",
        "잠을 계속 줄이는 생활",
        "오래 앉아서 움직임이 없는 패턴",
      ],
      action: [
        "따뜻한 물 섭취 늘리기",
        "하체 보온과 발목·종아리 스트레칭",
        "하루 한 번 숨이 살짝 차는 걷기",
      ],
    };
  }

  if (flow.weakest === "금") {
    return {
      type: "호흡·피부·목어깨 긴장 관리형",
      core: `건강운은 '${healthGrade}'으로 본다. 사주상 정리하고 끊어내는 힘이 약하게 흔들리면 긴장이 목·어깨·호흡·피부 건조함 쪽으로 나타나기 쉬운 흐름이야.`,
      risk: "쉴 때도 몸에 힘이 들어가 있고, 물을 적게 마시고, 건조함과 목·어깨 뭉침을 방치하면 컨디션이 눌릴 수 있어.",
      direction:
        "맞는 관리는 수분 섭취, 호흡 길게 내쉬기, 목·어깨 스트레칭, 실내 습도 관리, 가벼운 등 운동이야. 피해야 할 건 오래 앉아 긴장한 자세, 수면 부족, 건조한 환경을 오래 두는 습관이야.",
      avoid: ["긴장한 자세로 오래 앉아 있기", "수분 부족", "목·어깨 뭉침 방치"],
      action: [
        "목·어깨 스트레칭을 하루 2번 하기",
        "물 섭취와 실내 습도 챙기기",
        "호흡을 길게 내쉬는 5분 루틴 만들기",
      ],
    };
  }

  return {
    type: "균형 리듬 관리형",
    core: `건강운은 '${healthGrade}'으로 본다. 사주상 ${flow.weakestText} 쪽이 흔들릴 때 컨디션이 먼저 무너질 수 있어서, 몸의 신호를 생활 리듬으로 잡아야 해.`,
    risk: "몸이 보내는 신호를 무시하고 몰아서 일하거나 몰아서 운동하면 피로가 늦게 터질 수 있어.",
    direction:
      "맞는 관리는 수면 시간 고정, 식사 시간 고정, 매일 걷기, 하체·허리 스트레칭, 야식과 찬 음료 줄이기야. 실제 증상이 오래가면 운세로 넘기지 말고 검진을 따로 봐야 해.",
    avoid: [
      "몸의 신호를 무시하고 버티기",
      "야식·찬 음료·수면 부족을 반복하기",
      "갑자기 고강도 운동으로 몸을 밀어붙이기",
    ],
    action: [
      "수면·식사 시간을 먼저 고정하기",
      "걷기와 스트레칭부터 시작하기",
      "불편한 증상이 지속되면 검진 받기",
    ],
  };
}
function getRelationshipProfile(
  manse: any,
  mode: "love" | "marriage" | "children" = "love",
): SajuProfile {
  const tenGods = getTenGodCounts(manse);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);

  if (mode === "children") {
    if (output >= 3) {
      return {
        type: "표현과 정서 교류가 중요한 자식운",
        core: "자식운은 말의 온도와 정서 교류에서 살아나는 흐름이야. 자식 인연은 감정 교류, 대화, 표현 방식에서 강하게 드러나고, 자식이 있다면 부모의 말투와 반응이 관계를 좌우해.",
        risk: "기대가 커지면 말이 앞서고 아이가 부담으로 느낄 수 있어. 좋은 뜻으로 하는 말도 아이 입장에서는 압박처럼 들어갈 수 있다.",
        direction:
          "통제보다 대화, 기준보다 온도 조절이 중요해. 자식의 가능성은 표현력, 예술성, 말, 콘텐츠, 기술, 사람 앞에서 드러내는 능력 쪽으로 살려주는 게 좋아.",
        avoid: [
          "말로 몰아붙이기",
          "기대 과다",
          "감정적인 훈육",
          "자식의 선택을 부모 기준으로만 재단하기",
        ],
        action: [
          "칭찬과 기준 분리",
          "말투 조절",
          "감정 표현 기다리기",
          "자식의 재능 방향을 관찰해서 환경 만들어주기",
        ],
      };
    }

    if (resource >= 3) {
      return {
        type: "기대와 보호가 강한 자식운",
        core: "자식운은 보호하려는 마음이 강하게 들어오는 구조야. 자식 인연은 안정적인 환경을 만들어주는 쪽에서 살아나지만, 과하면 간섭으로 느껴질 수 있어.",
        risk: "걱정이 많아져 자식의 선택을 대신하려는 게 위험해. 부모가 불안해서 길을 먼저 정해주면 자식의 독립성과 가능성이 늦게 살아날 수 있다.",
        direction:
          "기대보다 거리감, 보호보다 자율성을 잡아야 해. 자식의 가능성은 공부형, 전문성, 자격, 안정형 진로, 깊게 파고드는 분야에서 살아날 수 있어.",
        avoid: [
          "과한 간섭",
          "대신 결정하기",
          "걱정으로 통제하기",
          "공부나 진로를 부모 불안으로 밀어붙이기",
        ],
        action: [
          "선택권 주기",
          "경제적 선 정하기",
          "기대치 낮추기",
          "자식이 스스로 고를 수 있는 선택지를 만들어주기",
        ],
      };
    }

    return {
      type: "거리와 기준 조율형 자식운",
      core: "자식운은 붙잡는 흐름보다 관계의 거리와 기준을 잘 맞출 때 안정돼. 자식 인연은 단정할 수 없지만, 들어온다면 기쁨과 책임이 함께 오는 구조로 봐야 해.",
      risk: "경제적 책임이나 기대를 혼자 크게 떠안는 게 위험해. 자식 문제를 부모의 체면이나 대리만족으로 끌고 가면 관계가 무거워질 수 있어.",
      direction:
        "사랑과 기준을 분리해야 해. 자식의 가능성은 한쪽으로 몰아붙이기보다 성향을 관찰해서 기술형, 안정형, 독립형 중 맞는 방향을 천천히 잡아주는 게 좋아.",
      avoid: [
        "경제적 책임 과다",
        "기대 강요",
        "거리감 없는 간섭",
        "자식을 통해 부모의 못 이룬 욕심을 채우려는 선택",
      ],
      action: [
        "경제적 기준 정하기",
        "말의 온도 조절",
        "부모 삶도 지키기",
        "자식과 가족 사이에서 역할과 기대치를 미리 조율하기",
      ],
    };
  }

  if (authority >= 3 && mode === "marriage") {
    return {
      type: "생활 기준이 중요한 결혼운",
      core: "결혼은 설렘보다 생활 기준, 책임 분담, 돈 기준이 맞을 때 안정돼.",
      risk: "상대의 조건만 보고 감정 회복 방식이나 생활 리듬을 놓치는 게 위험해.",
      direction: "돈, 가족 거리감, 역할 분담을 결혼 전부터 맞춰야 해.",
      avoid: [
        "외로움 때문에 결혼 결정",
        "돈 기준 미확인",
        "가족 문제를 나중으로 미루기",
      ],
      action: ["돈 쓰는 방식 확인", "가족 거리감 대화", "역할 분담 정하기"],
    };
  }

  if (output >= 3) {
    return {
      type: "표현·반응이 중요한 연애운",
      core: "연애는 말투, 반응, 연락의 온도에서 크게 흔들릴 수 있어.",
      risk: "초반 설렘에 빨리 반응하다가 생활 기준을 놓치는 게 위험해.",
      direction: "표현은 하되 상대의 반복 행동을 보고 판단해야 해.",
      avoid: [
        "설렘만 보고 시작",
        "말만 많은 사람에게 끌리는 것",
        "불안해서 연락을 몰아치는 것",
      ],
      action: ["반복 행동 보기", "연락 기준 정하기", "말보다 생활 태도 보기"],
    };
  }

  if (resource >= 3) {
    return {
      type: "신중 관찰형 관계운",
      core: "연애와 결혼은 천천히 관찰하고 확신이 생겨야 안정되는 흐름이야.",
      risk: "생각만 많아지고 실제 대화가 늦어지는 게 위험해.",
      direction: "혼자 판단하지 말고 필요한 질문을 직접 확인해야 해.",
      avoid: ["혼자 추측하기", "확인 없이 마음 접기", "완벽한 사람 기다리기"],
      action: [
        "중요한 질문 직접 하기",
        "상대의 생활 리듬 보기",
        "불편한 점 기록하기",
      ],
    };
  }

  if (peer >= 3) {
    return {
      type: "자존심·거리 조절형 관계운",
      core: "관계에서 서로의 자존심과 주도권이 부딪히기 쉬워.",
      risk: "이기고 지는 문제로 가면 관계가 빨리 지친다.",
      direction: "서로의 영역과 거리감을 인정해야 오래 간다.",
      avoid: ["기싸움", "비교", "상대 통제"],
      action: ["각자 시간 존중", "싸움 후 회복 방식 정하기", "말투 조절"],
    };
  }

  if (mode === "love" && fire >= 2) {
    return {
      type: "빠르게 끌리고 식기 쉬운 연애운",
      core: "연애운은 초반 분위기와 말의 온도에 빨리 반응하는 구조야. 끌림은 빠르게 생길 수 있지만, 상대가 꾸준한 사람인지 확인하지 않으면 감정 소모가 커질 수 있어.",
      risk: "처음 설레는 말, 빠른 연락, 강한 표현만 보고 관계를 밀어붙이는 게 위험해. 뜨거운 시작보다 식은 뒤에도 남는 태도를 봐야 해.",
      direction:
        "연락 속도보다 약속을 지키는지, 말보다 반복 행동이 일정한지, 감정이 올라왔을 때 상대가 책임 있게 반응하는지를 봐야 해.",
      avoid: [
        "초반 설렘만 보고 확정하기",
        "말 잘하는 사람에게 바로 마음 주기",
        "감정이 올라온 날 관계를 결정하기",
      ],
      action: [
        "최소 세 번의 약속 태도 보기",
        "연락 빈도보다 약속 이행 보기",
        "상대가 불편한 대화를 피하는지 확인하기",
      ],
    };
  }

  if (mode === "love" && water >= 2 && fire <= 1) {
    return {
      type: "속마음을 늦게 여는 신중형 연애운",
      core: "연애운은 쉽게 마음을 여는 쪽이 아니라, 오래 관찰하고 안전하다고 느낄 때 깊어지는 구조야. 그래서 겉으로는 괜찮아 보여도 속으로는 상대를 계속 재고 있을 수 있어.",
      risk: "혼자 생각이 많아져서 상대를 시험하거나, 확인하지 않고 마음을 접는 게 위험해. 말하지 않은 불안은 상대가 알아차리기 어렵다.",
      direction:
        "상대가 꾸준히 안심을 주는지, 감정 기복을 받아줄 수 있는지, 애매한 관계를 오래 끌지 않는지를 봐야 해.",
      avoid: [
        "혼자 결론 내리고 멀어지기",
        "상대 마음을 떠보는 식의 대화",
        "애매한 관계를 오래 유지하기",
      ],
      action: [
        "불안한 지점을 직접 질문하기",
        "관계 정의를 미루지 않기",
        "말보다 오래 유지되는 태도 보기",
      ],
    };
  }

  if (mode === "love" && earth >= 3) {
    return {
      type: "정들면 오래 가지만 부담도 커지는 연애운",
      core: "연애운은 쉽게 시작하기보다 정이 들면 오래 붙잡는 구조야. 안정감은 장점이지만, 맞지 않는 사람도 책임감 때문에 오래 끌고 갈 수 있어.",
      risk: "상대를 챙기다가 내 생활 리듬과 돈, 시간을 잃는 게 위험해. 연애가 편안함이 아니라 의무처럼 변하면 피로가 커진다.",
      direction:
        "나를 편하게 해주는 사람인지, 책임을 나눌 줄 아는 사람인지, 생활 기준이 비슷한지를 먼저 봐야 해.",
      avoid: [
        "불쌍해서 붙잡는 관계",
        "내가 다 맞춰주는 연애",
        "돈과 시간을 계속 떠안는 관계",
      ],
      action: [
        "초반부터 돈과 시간 기준 세우기",
        "상대가 책임을 나누는지 보기",
        "내 생활 루틴을 깨는 관계는 멈춰보기",
      ],
    };
  }

  if (mode === "love" && metal >= 2) {
    return {
      type: "기준이 높고 쉽게 정리하는 연애운",
      core: "연애운은 마음이 없어서가 아니라, 기준이 맞지 않으면 빠르게 선을 긋는 구조야. 그래서 좋은 사람을 만나도 작은 불편함이 크게 보일 수 있어.",
      risk: "상대를 너무 빨리 판단하거나, 완벽한 사람을 기다리다가 실제로 맞춰볼 기회를 놓치는 게 위험해.",
      direction:
        "절대 안 되는 기준과 맞춰볼 수 있는 기준을 분리해야 해. 말투, 돈 기준, 생활 습관 중 무엇이 정말 중요한지 먼저 정리해야 한다.",
      avoid: [
        "작은 단점 하나로 바로 끊기",
        "완벽한 사람만 기다리기",
        "감정을 표현하지 않고 평가만 하기",
      ],
      action: [
        "절대 기준 3개만 정하기",
        "한 번의 실수와 반복 습관 구분하기",
        "좋으면 좋다고 표현하기",
      ],
    };
  }

  if (mode === "love" && wood >= 2) {
    return {
      type: "새로운 인연에 열리지만 방향이 중요한 연애운",
      core: "연애운은 새로운 사람, 새로운 분위기, 대화가 잘 통하는 사람에게 열리기 쉬워. 다만 방향이 맞지 않으면 시작은 빨라도 오래 끌고 가기 어렵다.",
      risk: "가능성만 보고 현실 조건을 늦게 확인하는 게 위험해. 말이 잘 통한다고 생활 기준까지 맞는 건 아니다.",
      direction:
        "함께 성장할 수 있는 사람인지, 미래 계획의 속도가 맞는지, 관계 안에서 서로를 키워주는지를 봐야 해.",
      avoid: [
        "가능성만 보고 시작하기",
        "미래 얘기를 피하는 사람",
        "말은 통하지만 행동이 없는 관계",
      ],
      action: [
        "초반에 관계 방향 묻기",
        "미래 계획의 속도 확인하기",
        "말보다 실제 행동 변화 보기",
      ],
    };
  }

  return {
    type:
      mode === "marriage"
        ? "생활 기준 조율형 결혼운"
        : "거리 조절이 중요한 현실형 연애운",
    core:
      mode === "marriage"
        ? "결혼운은 설렘보다 생활 기준, 돈 기준, 가족과의 거리감이 맞을 때 안정되는 구조야."
        : "연애운은 감정이 없는 게 아니라, 가까워질수록 거리와 생활 리듬을 잘 맞춰야 안정되는 구조야.",
    risk:
      mode === "marriage"
        ? "좋아하는 마음만 믿고 돈, 가족, 역할 분담을 나중으로 미루는 게 위험해."
        : "처음엔 괜찮아도 연락 방식, 시간 사용, 말투가 맞지 않으면 같은 문제로 피로가 쌓일 수 있어.",
    direction:
      mode === "marriage"
        ? "결혼 전에는 돈 쓰는 방식, 가족 개입 범위, 집안일과 책임 분담을 구체적으로 맞춰야 해."
        : "상대가 내 생활 리듬을 존중하는지, 불편한 이야기를 피하지 않는지, 관계 속도가 맞는지를 봐야 해.",
    avoid:
      mode === "marriage"
        ? [
            "돈 기준 없이 결혼 결정",
            "가족 문제를 나중으로 미루기",
            "역할 분담 없이 같이 살기",
          ]
        : [
            "외로움 때문에 시작하기",
            "연락 방식이 안 맞는데 참기",
            "불편한 점을 계속 미루기",
          ],
    action:
      mode === "marriage"
        ? [
            "생활비 기준 정하기",
            "가족 거리감 대화하기",
            "역할 분담을 말로 끝내지 않기",
          ]
        : [
            "연락 기준을 초반에 맞추기",
            "불편한 점을 작은 말로 바로 꺼내기",
            "상대의 반복 행동을 3번 이상 확인하기",
          ],
  };
}

function getLoveTimingProfile(manse: any) {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);
  const currentYear = new Date().getFullYear();

  let strength = 0;
  if (wood >= 2) strength += 2;
  if (fire >= 2) strength += 2;
  if (water >= 2) strength += 1;
  if (output >= 2) strength += 2;
  if (authority >= 2) strength += 1;
  if (resource >= 3) strength -= 1;
  if (peer >= 3) strength -= 1;
  if (earth >= 4 && fire <= 1) strength -= 1;

  let chance =
    "올해 인연운은 없는 해가 아니라, 사람을 만날 기회는 들어오는 편이야.";
  if (strength >= 5)
    chance =
      "올해 인연운은 비교적 열리는 편이야. 가만히 있으면 약하지만, 사람을 만나는 자리에 나가면 반응이 생기기 쉬워.";
  else if (strength >= 3)
    chance =
      "올해 인연운은 중간 이상이야. 갑자기 강하게 들어오기보다 소개, 모임, 일상 동선에서 천천히 살아나는 흐름이야.";
  else if (strength >= 1)
    chance =
      "올해 인연운은 약하게 열리는 편이야. 큰 기대보다 사람 보는 기준을 정리하고 작은 만남을 늘릴 때 살아나.";
  else
    chance =
      "올해 인연운은 강하게 터지는 해라기보다, 애매한 관계를 정리하고 다음 인연을 받을 자리를 만드는 해에 가까워.";

  let timing = "3~5월, 9~10월";
  let reason = "새로운 대화가 생기고 관계를 다시 정리하기 좋은 시기야.";

  if (fire >= 2 && wood >= 1) {
    timing = "5~8월";
    reason =
      "표현력과 분위기가 살아나는 때라 썸, 만남, 연락 흐름이 빨라지기 쉬워.";
  } else if (wood >= 2) {
    timing = "3~5월";
    reason = "새로운 사람, 새로운 모임, 소개운이 열리기 쉬운 시기야.";
  } else if (metal >= 2) {
    timing = "8~10월";
    reason = "관계가 정리되고 진지한 사람을 고르기 좋은 시기야.";
  } else if (water >= 2) {
    timing = "11~2월";
    reason =
      "속마음을 천천히 나누는 인연, 오래 알고 지낸 사람과의 흐름이 살아나기 쉬워.";
  } else if (earth >= 3) {
    timing = "4월, 7월, 10월 전후";
    reason =
      "갑작스러운 만남보다 주변 소개, 익숙한 환경, 생활권 안의 인연이 들어오기 쉬워.";
  }

  return {
    year: currentYear,
    chance,
    timing,
    reason,
  };
}

function getLovePartnerProfile(manse: any) {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  const love = getRelationshipProfile(manse, "love");

  if (fire >= 2) {
    return {
      good: "감정 표현은 따뜻하지만 생활이 일정한 사람",
      avoid: "말은 뜨겁고 연락은 빠른데 약속과 책임이 들쭉날쭉한 사람",
      jobs: "운영관리, 기획, 교육, 공공기관, 회계·총무, 안정적인 기술직처럼 생활 리듬이 일정한 직업군",
      reason:
        "네 연애운은 초반 분위기에 빨리 반응하기 쉬워서, 설레게 하는 사람보다 꾸준히 지키는 사람이 오래 맞아.",
      check: "약속 시간, 말 바꾸는 빈도, 화났을 때 태도, 돈 쓰는 방식",
      type: love.type,
    };
  }

  if (water >= 2 && fire <= 1) {
    return {
      good: "기다려줄 줄 알고 말로 안심을 주는 사람",
      avoid: "애매하게 굴면서 확답을 피하거나, 네 불안을 가볍게 넘기는 사람",
      jobs: "상담, 교육, 연구, 문서·기획, 디자인, 개발, 전문기술직처럼 차분히 쌓아가는 직업군",
      reason:
        "네 연애운은 마음을 여는 데 시간이 필요해서, 감정 속도를 강요하지 않는 사람이 맞아.",
      check:
        "관계 정의를 피하는지, 불편한 질문에 답하는지, 연락이 끊겼을 때 회복 태도",
      type: love.type,
    };
  }

  if (earth >= 3) {
    return {
      good: "생활력 있고 책임을 나눌 줄 아는 사람",
      avoid: "챙김만 받으려 하거나 경제적·감정적 책임을 너에게 미루는 사람",
      jobs: "공무직, 생산·설비, 물류·관리, 회계, 자영업 운영자, 안정적인 회사원처럼 생활 기반이 있는 직업군",
      reason:
        "네 연애운은 정이 들면 오래 가지만 부담도 같이 커질 수 있어서, 책임을 나누는 사람이 맞아.",
      check: "생활비 기준, 시간 약속, 가족 거리감, 힘든 일을 함께 나누는 태도",
      type: love.type,
    };
  }

  if (metal >= 2) {
    return {
      good: "깔끔하고 약속이 분명하며 말과 행동이 일치하는 사람",
      avoid: "핑계가 많고 사과가 늦거나, 관계를 대충 흘려보내는 사람",
      jobs: "금융, 법무, 품질관리, 의료·보건, IT, 행정, 분석직처럼 기준과 책임이 분명한 직업군",
      reason:
        "네 연애운은 기준이 맞지 않으면 빨리 식을 수 있어서, 애매함이 적은 사람이 오래 맞아.",
      check: "약속 이행, 정리된 소비 습관, 말투의 예의, 갈등 후 사과 방식",
      type: love.type,
    };
  }

  if (wood >= 2) {
    return {
      good: "같이 성장하고 미래 이야기를 피하지 않는 사람",
      avoid: "가능성만 말하고 실제 행동이 없거나, 방향 없이 분위기만 좋은 사람",
      jobs: "교육, 콘텐츠, 마케팅, 영업, 기획, 창업 초기 멤버, 성장형 전문직처럼 움직임과 성장성이 있는 직업군",
      reason:
        "네 연애운은 새로움에 열리지만 방향이 없으면 오래 가지 않아서, 같이 커지는 사람이 맞아.",
      check:
        "미래 계획, 일관된 행동 변화, 자기 생활 관리, 말한 것을 실행하는지",
      type: love.type,
    };
  }

  return {
    good: "감정이 편하고 생활 리듬을 존중해주는 사람",
    avoid: "가까워질수록 네 생활을 흔들고 눈치 보게 만드는 사람",
    jobs: "정해진 리듬이 있는 회사원, 전문기술직, 교육·상담, 운영·관리직처럼 생활 패턴이 안정적인 직업군",
    reason:
      "네 연애운은 감정만으로 오래 가는 구조가 아니라 거리와 생활 리듬을 맞춰야 안정돼.",
    check: "연락 방식, 쉬는 방식, 돈과 시간 기준, 불편한 대화를 피하지 않는지",
    type: love.type,
  };
}


function getLoveMarriageLifetimeTimingV218(
  user: UserInfo,
  manse: any,
  fortuneSeed: number = 0,
) {
  const currentYear = getKoreaTodayInfo().year;
  const birthYear = getNumberFromText(user?.year) || currentYear - 35;
  const currentAge = Math.max(18, currentYear - birthYear + 1);
  const snap = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  // 출생정보 + 원국 + fortuneSeed를 함께 써서 같은 사람은 항상 같은 시기가 나오게 한다.
  const seed = Math.abs(
    hashToSeed(
      [
        "love-marriage-timeline-v218",
        birthYear,
        user?.month || "",
        user?.day || "",
        user?.hour || "",
        user?.minute || "",
        user?.gender || "",
        snap.dayMaster || "",
        snap.wood, snap.fire, snap.earth, snap.metal, snap.water,
        output, wealth, authority, resource, peer,
        fortuneSeed || 0,
      ].join(":"),
    ),
  );

  const clampAge = (n: number) => Math.max(19, Math.min(72, Math.round(n)));
  const yearFromAge = (age: number) => birthYear + age - 1;
  const window = (center: number, radius = 1) => {
    const start = clampAge(center - radius);
    const end = clampAge(center + radius);
    return {
      startAge: start,
      endAge: end,
      ageLabel: `${start}~${end}세`,
      startYear: yearFromAge(start),
      endYear: yearFromAge(end),
      yearLabel: `${yearFromAge(start)}~${yearFromAge(end)}년`,
      centerAge: clampAge(center),
      centerYear: yearFromAge(clampAge(center)),
    };
  };

  // 연인운: 표현(식상), 관계 현실성(재성/관성), 오행 균형을 반영한 3개 장기 구간.
  const loveBase1 = 24 + (seed % 7);
  const loveBase2 = loveBase1 + 7 + ((seed >> 3) % 5);
  const loveBase3 = loveBase2 + 8 + ((seed >> 6) % 6);
  const loveShift =
    (output >= 2 ? -1 : 0) +
    (snap.fire >= 2 ? -1 : 0) +
    (resource >= 3 ? 1 : 0) +
    (peer >= 3 ? 1 : 0);
  const loveWindows = [
    window(loveBase1 + loveShift, 1),
    window(loveBase2 + Math.max(-1, Math.min(1, loveShift)), 1),
    window(loveBase3, 1),
  ].sort((a, b) => a.startAge - b.startAge);

  // 결혼운: 관계를 현실화하는 재성/관성 + 토/금의 안정성을 더 크게 반영.
  const marriageBase1 =
    29 +
    ((seed >> 2) % 7) +
    (authority >= 2 ? -1 : 0) +
    (wealth >= 2 ? -1 : 0) +
    (snap.earth >= 3 ? 1 : 0);
  const marriageBase2 =
    marriageBase1 + 8 + ((seed >> 7) % 6);
  const marriageWindows = [
    window(marriageBase1, 1),
    window(marriageBase2, 1),
  ].sort((a, b) => a.startAge - b.startAge);

  const marriagePeak =
    (authority + wealth + snap.earth + snap.metal) >=
    (output + peer + snap.fire)
      ? marriageWindows[0]
      : marriageWindows[1];

  const nextLove =
    loveWindows.find((x) => x.endAge >= currentAge) || loveWindows[loveWindows.length - 1];
  const nextMarriage =
    marriageWindows.find((x) => x.endAge >= currentAge) || marriageWindows[marriageWindows.length - 1];

  const loveTiming = getLoveTimingProfile(manse);
  const marriageTiming = getMarriageTimingProfile(manse);

  const parseMonths = (raw: string) => {
    const nums = Array.from(String(raw || "").matchAll(/(\d{1,2})/g))
      .map((m) => Number(m[1]))
      .filter((n) => n >= 1 && n <= 12);
    const out: number[] = [];
    for (const n of nums) if (!out.includes(n)) out.push(n);
    return out;
  };
  const loveMonths = parseMonths(loveTiming.timing);
  const marriageMonths = parseMonths(marriageTiming.timing);
  const merged = [...loveMonths, ...marriageMonths].filter(
    (n, i, arr) => arr.indexOf(n) === i,
  );
  const overlap = loveMonths.filter((n) => marriageMonths.includes(n));
  const peakMonth = overlap[0] || merged[0] || 5;
  const progressMonth = overlap[1] || marriageMonths[0] || peakMonth;
  let cautionMonth = ((peakMonth + 5 + (seed % 3)) % 12) + 1;
  if (merged.includes(cautionMonth)) cautionMonth = (cautionMonth % 12) + 1;

  return {
    currentAge,
    currentYear,
    loveWindows,
    strongestLoveWindow:
      loveWindows.reduce((best, x) =>
        Math.abs(x.centerAge - currentAge) < Math.abs(best.centerAge - currentAge) ? x : best,
      loveWindows[0]),
    nextLoveWindow: nextLove,
    marriageWindows,
    marriagePeak,
    nextMarriageWindow: nextMarriage,
    thisYear: {
      loveMonths,
      marriageMonths,
      peakMonth,
      progressMonth,
      cautionMonth,
      loveTiming: loveTiming.timing,
      marriageTiming: marriageTiming.timing,
    },
  };
}

function getMarriageTimingProfile(manse: any) {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const currentYear = new Date().getFullYear();

  let strength = 0;
  if (authority >= 2) strength += 2;
  if (earth >= 2) strength += 2;
  if (metal >= 1) strength += 1;
  if (water >= 1) strength += 1;
  if (resource >= 3) strength += 1;
  if (fire >= 2 && earth <= 1) strength -= 1;
  if (output >= 3 && authority === 0) strength -= 1;
  if (wealth >= 3 && earth <= 1) strength -= 1;

  let chance =
    "올해 결혼운은 약하게라도 움직이는 편이지만, 바로 확정하기보다 상대의 생활 기준을 확인해야 안정돼.";
  if (strength >= 6)
    chance =
      "올해 결혼운은 비교적 현실적으로 열리는 편이야. 연애 감정보다 결혼 조건, 생활 기준, 가족 거리감이 맞는 사람이 들어오면 진지하게 볼 수 있어.";
  else if (strength >= 4)
    chance =
      "올해 결혼운은 중간 이상이야. 갑자기 결혼이 확정되는 흐름보다, 기존 인연이나 소개를 통해 진지한 관계로 넘어갈 가능성이 더 커.";
  else if (strength >= 2)
    chance =
      "올해 결혼운은 강하게 터지는 해라기보다, 결혼 기준을 정리하고 맞지 않는 관계를 걸러내는 흐름이야.";
  else
    chance =
      "올해 결혼운은 서두르면 흔들리기 쉬운 흐름이야. 결혼 자체보다 먼저 사람 보는 기준과 생활 조건을 정리해야 해.";

  let timing = "4~6월, 9~11월";
  let timingReason = "생활 기준을 맞추고 현실적인 대화가 오가기 좋은 시기야.";
  let longFlow =
    "결혼은 빠르게 결정할수록 흔들리고, 시간을 두고 기준을 확인할수록 안정되는 흐름이야.";

  if (earth >= 3 && fire <= 1) {
    timing = "9~11월, 또는 내년 초까지 이어지는 흐름";
    timingReason =
      "이 사주는 초반 설렘보다 현실 조건이 맞을 때 결혼운이 살아나서, 하반기처럼 정리와 결정이 필요한 시기가 더 맞아.";
    longFlow =
      "결혼은 늦게 안정되는 쪽이 강해. 서두르는 결혼보다 생활 기반과 돈 기준을 맞춘 뒤 하는 결혼이 훨씬 편해.";
  } else if (fire >= 2 && wood >= 1) {
    timing = "3~6월, 7~8월 전후";
    timingReason =
      "표현과 만남의 기운이 살아나는 때라 소개, 썸, 진지한 대화가 빠르게 붙기 쉬워.";
    longFlow =
      "인연은 빨리 들어올 수 있지만, 결혼은 감정이 식은 뒤에도 책임이 남는지를 봐야 해.";
  } else if (metal >= 2) {
    timing = "8~10월";
    timingReason =
      "사람을 고르는 기준이 선명해지고, 진지한 조건을 확인하기 좋은 시기야.";
    longFlow =
      "결혼은 애매한 사람과 오래 끌기보다, 기준이 맞는 사람을 만났을 때 빠르게 정리되는 흐름이야.";
  } else if (water >= 2) {
    timing = "11~2월";
    timingReason =
      "속마음과 현실 대화를 천천히 나누면서 관계가 깊어지기 쉬운 시기야.";
    longFlow = "결혼은 오래 보고 신뢰가 쌓인 뒤 안정되는 쪽이 강해.";
  } else if (wood >= 2) {
    timing = "3~5월";
    timingReason =
      "새로운 소개나 모임, 이동, 배움의 자리에서 인연이 열리기 쉬워.";
    longFlow =
      "결혼은 같이 성장할 방향이 맞을 때 살아나지만, 미래 계획이 다르면 오래 가기 어렵다.";
  }

  return {
    year: currentYear,
    chance,
    timing,
    timingReason,
    longFlow,
  };
}

function getMarriagePartnerProfile(manse: any) {
  const { wood, fire, earth, metal, water } = getElementSnapshot(manse);
  const marriage = getRelationshipProfile(manse, "marriage");

  if (earth >= 3) {
    return {
      good: "생활력 있고 책임을 나눌 줄 아는 사람",
      avoid: "말은 좋지만 경제적·감정적 책임을 상대에게 미루는 사람",
      jobs: "공무직, 안정적인 회사원, 회계·총무, 생산·설비 관리, 운영관리, 자영업 운영자처럼 생활 기반과 책임이 분명한 직업군",
      family:
        "가족과 너무 붙어 있지 않고, 배우자와 원가족 사이의 선을 정할 줄 아는 사람이 좋아.",
      money: "수입의 크기보다 돈을 모으고 쓰는 기준이 일정한 사람이 맞아.",
      check:
        "생활비 기준, 가족 지원 범위, 집안일 분담, 힘든 일을 함께 나누는 태도",
      type: marriage.type,
    };
  }

  if (metal >= 2) {
    return {
      good: "약속이 정확하고 말과 행동이 일치하는 사람",
      avoid: "핑계가 많고 사과가 늦거나, 돈과 약속을 대충 넘기는 사람",
      jobs: "금융, 법무, 행정, 의료·보건, 품질관리, IT, 분석직처럼 기준과 책임이 분명한 직업군",
      family:
        "가족 문제도 감정으로 끌고 가지 않고 원칙과 대화로 정리하는 사람이 맞아.",
      money:
        "공동 지출, 저축, 대출, 큰돈 사용 기준을 숫자로 맞출 수 있어야 해.",
      check:
        "약속 이행, 소비 습관, 갈등 후 사과 방식, 가족 개입을 선 긋는 능력",
      type: marriage.type,
    };
  }

  if (water >= 2 && fire <= 1) {
    return {
      good: "조용히 신뢰를 쌓고 감정을 안정적으로 받아주는 사람",
      avoid: "확답을 피하거나 애매한 말로 관계를 오래 끄는 사람",
      jobs: "상담, 교육, 연구, 기획, 개발, 디자인, 전문기술직처럼 차분히 쌓아가는 직업군",
      family:
        "부부 사이의 속마음을 밖으로 쉽게 흘리지 않고, 둘만의 대화를 지킬 줄 아는 사람이 좋아.",
      money: "큰소리치는 사람보다 꾸준히 벌고 꾸준히 관리하는 사람이 맞아.",
      check:
        "관계 정의를 피하는지, 불편한 대화에 답하는지, 감정 기복을 어떻게 회복하는지",
      type: marriage.type,
    };
  }

  if (fire >= 2) {
    return {
      good: "표현은 따뜻하지만 생활은 일정하게 유지하는 사람",
      avoid: "초반에는 뜨겁지만 약속과 책임이 들쭉날쭉한 사람",
      jobs: "교육, 영업관리, 서비스 운영, 기획, 공공기관, 안정적인 기술직처럼 사람을 상대하되 생활 리듬이 잡힌 직업군",
      family:
        "감정적으로 가족 편만 드는 사람보다, 배우자를 먼저 세워주는 사람이 맞아.",
      money: "기분으로 쓰는 돈보다 미래 계획에 맞춰 쓰는 돈 기준이 필요해.",
      check:
        "화났을 때 말투, 약속 시간, 돈 쓰는 습관, 결혼 이야기를 피하지 않는지",
      type: marriage.type,
    };
  }

  if (wood >= 2) {
    return {
      good: "같이 성장하고 미래 계획을 구체적으로 말하는 사람",
      avoid: "가능성만 말하고 실제 준비나 행동이 없는 사람",
      jobs: "교육, 콘텐츠, 마케팅, 기획, 영업, 성장형 전문직, 창업 초기 멤버처럼 움직임과 방향성이 있는 직업군",
      family:
        "부부가 같이 성장하려면 양가 가족보다 두 사람의 계획을 먼저 세우는 사람이 좋아.",
      money: "벌 가능성보다 실제 실행력, 저축 습관, 미래 계획을 봐야 해.",
      check: "미래 계획, 주거 계획, 일과 가정의 균형, 말한 것을 실행하는지",
      type: marriage.type,
    };
  }

  return {
    good: "감정이 편하고 생활 리듬을 존중해주는 사람",
    avoid: "가까워질수록 내 생활과 돈 기준을 흔드는 사람",
    jobs: "정해진 리듬이 있는 회사원, 전문기술직, 교육·상담, 운영·관리직처럼 생활 패턴이 안정적인 직업군",
    family: "가족과 배우자 사이의 선을 지킬 줄 아는 사람이 맞아.",
    money: "소비 성향, 저축 기준, 큰돈 결정 방식을 초반에 확인해야 해.",
    check:
      "돈과 시간 기준, 쉬는 방식, 집안일 분담, 불편한 대화를 피하지 않는지",
    type: marriage.type,
  };
}

function getYearlyProfile(manse: any): SajuProfile {
  const money = getMoneyProfile(manse);
  const career = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const flow = getReadableElementFlow(manse);

  if (flow.weakest === "화" || health.type.includes("회복")) {
    return {
      type: "회복 후 확인하는 해",
      core: "올해는 무리하게 크게 벌리기보다 몸과 생활 리듬을 먼저 회복하고, 작게 판을 열어보는 흐름으로 가능성을 확인하는 해로 봐야 해.",
      risk: "컨디션이 무너진 상태에서 돈이나 일을 크게 움직이는 게 위험해.",
      direction:
        "초반은 정리, 중반은 작게 판을 열어보는 흐름, 하반기 초입은 되는 것만 남기기, 연말은 안정화가 좋아.",
      avoid: ["무리한 확장", "피로 누적", "큰돈 들어가는 선택"],
      action: ["생활 리듬 회복", "작은 수익 확인", "되는 것만 남기기"],
    };
  }

  if (money.type.includes("수익화") || career.type.includes("실행")) {
    return {
      type: "작게 팔아보고 키우는 해",
      core: "올해는 생각보다 실행과 반응 확인이 중요해. 다만 처음부터 크게 가면 부담이 커질 수 있어.",
      risk: "반응이 조금 왔다고 바로 돈을 크게 넣는 게 위험해.",
      direction: "작게 팔고, 반복 반응이 생기는 것만 키워야 해.",
      avoid: ["검증 없는 광고비", "재고 선구매", "먼저 빠지는 돈 확장"],
      action: ["작은 판매", "반응 기록", "반복 수요 확인"],
    };
  }

  return {
    type: "정리와 기준을 세우는 해",
    core: "올해는 한 방보다 기준을 세우고 새는 부분을 줄이는 쪽에서 운이 살아나.",
    risk: "돈, 사람, 일을 한꺼번에 바꾸려는 게 위험해.",
    direction: "정리할 것과 키울 것을 나눠야 해.",
    avoid: ["한 번에 다 바꾸기", "감정적 결정", "먼저 빠지는 돈 증가"],
    action: [
      "정리 목록 만들기",
      "작게 판을 열어보는 흐름",
      "먼저 빠지는 돈 점검",
    ],
  };
}

function getLifeProfile(manse: any): SajuProfile {
  const career = getCareerArchetype(manse);
  const money = getMoneyProfile(manse);
  const health = getHealthProfile(manse);
  const flow = getReadableElementFlow(manse);

  if (
    career.combined.includes("부업") ||
    career.combined.includes("자기수익")
  ) {
    return {
      type: "중년 이후 작은 주문부터 시작하는 일이 커지는 인생대운",
      core: `인생 흐름은 초년에 바로 완성되기보다 중년 이후 자기 돈이 남는 자리가 커지는 쪽이 강해. ${money.type}와 연결해서 봐야 해.`,
      risk: "초년의 답답함을 평생 운으로 착각하는 게 위험해.",
      direction:
        "청년기에는 확인, 중년에는 작은 주문부터 시작하는 일 확장, 말년에는 안정화가 중요해.",
      avoid: ["초년 실패로 포기", "준비 없는 큰 확장", "건강 리듬 무시"],
      action: [
        "작은 돈이 남는 자리 만들기",
        "반복 수요 찾기",
        "건강 리듬 유지",
      ],
    };
  }

  if (health.type.includes("회복") || flow.weakest === "화") {
    return {
      type: "건강 리듬을 잡아야 대운을 잡는 흐름",
      core: "인생대운은 기회만 보는 게 아니라 몸이 버틸 수 있는 리듬을 같이 봐야 해.",
      risk: "좋은 기회가 와도 몸이 무너지면 오래 끌고 가기 어려워.",
      direction: "일과 돈보다 회복 리듬을 먼저 잡을 때 대운이 안정돼.",
      avoid: ["과로", "수면 무시", "몸의 신호 무시"],
      action: ["수면 고정", "일의 양 조절", "회복 시간 확보"],
    };
  }

  return {
    type: "기준을 세울수록 안정되는 인생대운",
    core: "인생 흐름은 급하게 뒤집기보다 기준을 세우고 쌓아갈 때 안정되는 쪽이야.",
    risk: "방향 없이 사람과 돈, 일을 끌고 가는 게 위험해.",
    direction:
      "초년에는 기준, 청년에는 실험, 중년에는 자리, 말년에는 안정이 중요해.",
    avoid: ["기준 없는 선택", "사람 때문에 흔들리기", "무리한 확장"],
    action: ["정리 기준 만들기", "작은 실험 기록하기", "건강 리듬 지키기"],
  };
}

function getWorryProfile(manse: any, question: string): SajuProfile {
  const q = question || "";
  const money = getMoneyProfile(manse);
  const career = getCareerProfile(manse);
  const health = getHealthProfile(manse);
  const relation = getRelationshipProfile(manse);

  if (/돈|투자|사업|창업|매출|수익|부업|대출|빚|장사|판매/.test(q)) {
    return {
      type: `돈 고민 / ${money.type}`,
      core: money.core,
      risk: money.risk,
      direction: money.direction,
      avoid: money.avoid,
      action: money.action,
    };
  }

  if (/직장|일|이직|퇴사|직업|회사|알바|사업|창업|부업/.test(q)) {
    return {
      type: `일 고민 / ${career.type}`,
      core: career.core,
      risk: career.risk,
      direction: career.direction,
      avoid: career.avoid,
      action: career.action,
    };
  }

  if (/건강|몸|아프|병원|잠|피로|소화|위|장|스트레스/.test(q)) {
    return {
      type: `건강 고민 / ${health.type}`,
      core: health.core,
      risk: health.risk,
      direction: health.direction,
      avoid: health.avoid,
      action: health.action,
    };
  }

  if (/연애|결혼|가족|사람|관계|궁합|상대|친구|동료/.test(q)) {
    return {
      type: `관계 고민 / ${relation.type}`,
      core: relation.core,
      risk: relation.risk,
      direction: relation.direction,
      avoid: relation.avoid,
      action: relation.action,
    };
  }

  return {
    type: "혼합 고민 / 핵심 좁히기형",
    core: "이 고민은 돈·일·사람·몸 중 어디가 가장 먼저 막혔는지 하나로 좁혀야 풀려.",
    risk: "한 번에 전부 바꾸려는 선택이 가장 위험해.",
    direction: "오늘 당장 할 일, 며칠 보류할 일, 정리해야 할 일을 나눠야 해.",
    avoid: [
      "큰돈 쓰기",
      "충동적인 퇴사나 계약",
      "관계 정리를 감정으로 바로 결정하기",
    ],
    action: [
      "문제 하나로 좁히기",
      "오늘 결정하지 않아도 되는 일 보류하기",
      "손실이 큰 선택부터 멈추기",
    ],
  };
}

function getPremiumQuestionDomain(question: string) {
  const q = question || "";

  if (/결혼|혼인|배우자|남편|아내|재혼|동거|상견례|이혼|파혼/.test(q)) {
    return {
      label: "결혼·배우자 핵심상담",
      focus:
        "이 관계를 결혼이나 장기 생활로 가져가도 되는지, 생활 기준과 책임 구조가 맞는지",
      criteria: [
        "생활비와 저축 기준",
        "가족 거리감",
        "갈등 후 회복 방식",
        "역할 분담",
        "상대의 책임감",
      ],
      avoid: [
        "외로움 때문에 결혼을 확정하는 선택",
        "돈과 가족 기준을 확인하지 않고 넘어가는 선택",
        "상대가 결혼 후 바뀔 거라 기대하는 선택",
      ],
      action: [
        "결혼 전 돈 기준을 눈앞의 흐름을 직접 보기하기",
        "가족 개입 범위를 말로 정하기",
        "불편한 대화를 피하지 않는지 확인하기",
      ],
    };
  }

  if (
    /연애|재회|썸|상대|남자친구|여자친구|헤어|이별|마음|고백|짝사랑/.test(q)
  ) {
    return {
      label: "연애·관계 선택 핵심상담",
      focus:
        "상대가 좋은 사람인지보다 이 관계가 오래 갈 수 있는 구조인지, 내가 어떤 패턴으로 흔들리는지",
      criteria: [
        "연락과 말투",
        "반복 행동",
        "관계 속도",
        "감정 회복 방식",
        "돈과 시간 사용 기준",
      ],
      avoid: [
        "초반 감정만 보고 관계를 확정하는 선택",
        "말은 좋은데 행동이 반복되지 않는 사람을 믿는 선택",
        "불안해서 먼저 매달리거나 끊어내는 선택",
      ],
      action: [
        "상대의 반복 행동을 확인하기",
        "관계 속도를 말로 맞추기",
        "내가 불안해지는 장면을 기록하고 기준 세우기",
      ],
    };
  }

  if (/가족|부모|엄마|아빠|형제|자매|자식|자녀|집안|시댁|처가/.test(q)) {
    return {
      label: "가족관계 핵심상담",
      focus:
        "누가 맞고 틀린지가 아니라 가족 안에서 반복되는 역할, 책임, 서운함의 구조가 무엇인지",
      criteria: [
        "거리 조절",
        "돈과 책임의 선",
        "말투",
        "기대치",
        "같이 살거나 떨어져 지낼 기준",
      ],
      avoid: [
        "가족이라는 이유로 계속 감당하는 선택",
        "돈 문제를 정으로 덮는 선택",
        "말투와 거리 문제를 사소하게 넘기는 선택",
      ],
      action: [
        "도와줄 수 있는 범위와 못 하는 범위를 정하기",
        "돈과 책임 기준을 말로 남기기",
        "가까움보다 덜 다치는 거리를 찾기",
      ],
    };
  }

  if (/동업|파트너|공동|계약|투자자|지분|수익배분|같이 일|협업/.test(q)) {
    return {
      label: "동업·사업파트너 핵심상담",
      focus:
        "좋은 사람인지가 아니라 같이 돈을 만들고 나눌 수 있는 구조인지, 책임과 결정권이 맞는지",
      criteria: [
        "역할 분담",
        "수익 배분",
        "비용 부담",
        "결정권",
        "빠져나오는 기준",
      ],
      avoid: [
        "친분만 믿고 시작하는 선택",
        "계약 없이 의리로 가는 선택",
        "수익 배분과 손실 책임을 나중으로 미루는 선택",
      ],
      action: [
        "작은 프로젝트로 먼저 확인하기",
        "역할과 돈이 돌아오는 때을 문서로 정하기",
        "잘 안 됐을 때 정리 기준까지 정하기",
      ],
    };
  }

  if (
    /돈|재물|수익|매출|투자|대출|빚|부업|창업|장사|판매|매장|먼저 빠지는 돈|월세|재고/.test(
      q,
    )
  ) {
    return {
      label: "돈·수익구조 핵심상담",
      focus:
        "돈을 벌 수 있냐보다 어떤 방식에서 돈이 남고, 어떤 선택에서 돈이 새는지",
      criteria: [
        "돈이 묶이는 시간",
        "먼저 빠지는 돈",
        "손실 한도",
        "반복 수익",
        "돈 나누는 기준",
      ],
      avoid: [
        "언제 돌아올지 보이지 않는 돈",
        "검증 전에 먼저 빠지는 돈를 키우는 선택",
        "남의 말만 믿고 들어가는 투자나 사업",
      ],
      action: [
        "손실 한도부터 정하기",
        "작게 팔거나 작게 검증하기",
        "반복 문의와 재구매가 생기는 구조만 남기기",
      ],
    };
  }

  if (/직장|회사|일|직업|이직|퇴사|취업|알바|진로|커리어|사업/.test(q)) {
    return {
      label: "일·진로 선택 핵심상담",
      focus:
        "지금 버틸지 움직일지가 아니라 어떤 일 구조에서 덜 흔들리고 오래 돈으로 이어지는지",
      criteria: [
        "생활 기반",
        "자기 돈이 남는 자리",
        "업무 강도",
        "사람 스트레스",
        "다음 선택의 구체성",
      ],
      avoid: [
        "감정만으로 퇴사하는 선택",
        "준비 없이 큰 사업으로 넘어가는 선택",
        "남이 돈 된다는 말만 듣고 따라가는 선택",
      ],
      action: [
        "1년 안에 바꿀 일 구조를 정하기",
        "현재 기반을 지키며 작은 자기 수익 루트 만들기",
        "옮길 조건과 남을 조건을 숫자로 정하기",
      ],
    };
  }

  if (/건강|몸|아프|피로|잠|수면|소화|위|장|병원|스트레스|컨디션/.test(q)) {
    return {
      label: "건강·생활리듬 핵심상담",
      focus:
        "병명을 맞히는 게 아니라 몸이 무너지는 생활 패턴과 회복 리듬을 어떻게 바꿔야 하는지",
      criteria: [
        "수면",
        "소화·장 리듬",
        "피로 누적",
        "스트레스 배출",
        "검진과 생활 관리",
      ],
      avoid: [
        "몸의 신호를 참고 넘기는 선택",
        "밤낮이 무너진 상태에서 큰 결정을 하는 선택",
        "스트레스를 안으로만 삼키는 선택",
      ],
      action: [
        "수면 시간을 먼저 고정하기",
        "소화와 장 리듬을 기록하기",
        "증상이 있으면 실제 검진으로 확인하기",
      ],
    };
  }

  return {
    label: "인생방향·선택 핵심상담",
    focus:
      "지금 질문 속에서 반복되는 선택 습관과 앞으로 인생 전반에서 바꿔야 할 방향이 무엇인지",
    criteria: [
      "반복되는 막힘",
      "버려야 할 선택 습관",
      "1년 안에 바꿀 구조",
      "인생 전반의 기준",
      "오래 가져갈 기반",
    ],
    avoid: [
      "질문의 핵심을 정하지 않고 이것저것 한 번에 바꾸는 선택",
      "불안해서 큰 결정을 먼저 해버리는 선택",
      "지금까지 반복된 습관을 그대로 끌고 가는 선택",
    ],
    action: [
      "질문을 한 문장으로 좁히기",
      "앞으로 1년 안에 바꿀 구조를 하나 정하기",
      "인생 전체에서 반복하지 않을 선택 습관을 끊기",
    ],
  };
}

function getPremiumProfile(manse: any, question: string): SajuProfile {
  const worry = getWorryProfile(manse, question);
  const domain = getPremiumQuestionDomain(question);
  const career = getCareerProfile(manse);
  const money = getMoneyProfile(manse);
  const health = getHealthProfile(manse);

  return {
    type: `프리미엄 질문핵심형 / ${domain.label} / ${worry.type}`,
    core: `내 고민 상담은 평생종합사주를 다시 반복하는 메뉴가 아니다. 질문의 핵심은 '${domain.focus}'이고, 답변은 이 질문에 대한 직접 결론과 판단 기준부터 잡아야 해. 필요할 때만 돈은 '${money.type}', 일은 '${career.type}', 건강은 '${health.type}' 흐름을 보조 근거로 연결하고, 질문과 직접 관련 없는 돈·일·관계·건강 항목을 기계적으로 나열하지 마라.`,
    risk: `가장 위험한 건 ${worry.risk} 또한 이 질문에서는 ${domain.avoid.join(", ")}을 특히 피해야 해. 공통 조언이 아니라 사용자의 질문에서 실제로 문제가 되는 선택만 골라서 말해야 한다.`,
    direction: `먼저 ${worry.direction} 그다음 이 질문의 판단 기준은 ${domain.criteria.join(", ")} 순서로 잡아야 해. 앞으로 1년 실행법은 질문의 핵심을 해결하는 구조로 쓰고, 인생 전반 실행법은 같은 문제가 반복되지 않게 선택 기준을 바꾸는 방향으로 써라.`,
    avoid: [...domain.avoid, ...worry.avoid.slice(0, 2)],
    action: [...domain.action, ...worry.action.slice(0, 2)],
  };
}

function getCategoryProfileText(
  categoryId: CategoryId,
  categoryTitle: string,
  manse: any,
  question: string,
) {
  const title = categoryTitle || "";

  if (
    categoryId === "premium" ||
    title.includes("내 고민") ||
    title.includes("프리미엄")
  )
    return profileLines(getPremiumProfile(manse, question));
  if (categoryId === "worry" || title.includes("고민"))
    return profileLines(getPremiumProfile(manse, question));
  if (categoryId === "money" || title.includes("재물"))
    return profileLines(getMoneyProfile(manse));
  if (isCareerCategory(categoryId, title))
    return profileLines(getCareerProfile(manse));
  if (categoryId === "health" || title.includes("건강"))
    return profileLines(getHealthProfile(manse));
  if (isLoveMarriageCategory(categoryId, title))
    return profileLines(getRelationshipProfile(manse, "love"));
  if (isChildrenCategory(categoryId, title))
    return profileLines(getRelationshipProfile(manse, "children"));
  if (isMonthlyCategory(categoryId, title))
    return profileLines(getYearlyProfile(manse));
  if (
    categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  )
    return profileLines(getLifeProfile(manse));

  return `
[카테고리별 사주 프로필]
- 프로필: 관계/점수형 또는 공통형 카테고리
- 핵심 해석: 이 카테고리는 점수, 등급, 관계 구조, 현실에서 부딪히는 지점을 중심으로 봐야 하는 흐름이다.
- 가장 조심할 점: 감정이나 좋은 말로만 넘기면 실제 생활, 돈 기준, 책임 구조에서 같은 문제가 반복될 수 있다.
- 잡아야 할 방향: 선택 카테고리에 맞춰 관계의 거리, 돈 기준, 말투, 역할, 책임 범위를 현실적으로 정리해야 한다.
`;
}

function getFixedConclusionBlock(
  categoryId: CategoryId,
  categoryTitle: string,
  user: UserInfo,
  manse: any,
  partnerManse?: any | null,
  fortuneSeed: number = 0,
) {
  const name = getName(user);
  const moneyGrade = getMoneyGrade(manse);
  const moneyTiming = getMoneyTimingText(user, manse);
  const healthGrade = getHealthGrade(manse);
  const career = getCareerArchetype(manse);
  const childrenFlow = getChildrenFlow(manse);
  const marriageFlow = getMarriageFlow(manse);
  const lifeFlow = getLifeFlow(manse);
  const majorLuckCount = getMajorLuckChanceCount(manse);
  const majorLuckPhase = getMostImportantLuckPhase(manse);
  const title = categoryTitle || "";
  const loveProfile = getRelationshipProfile(manse, "love");
  const marriageTiming = getMarriageTimingProfile(manse);
  const marriagePartner = getMarriagePartnerProfile(manse);

  if (isPartnerCategory(categoryId, title)) {
    const partnerScore = getBusinessPartnerScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 동업궁합은 ${partnerScore.score}점이고, '${partnerScore.grade}'으로 본다.

사업파트너 핵심은 '${partnerScore.summary}'이다.
가장 조심할 부분은 '${partnerScore.risk}'이다.

AI는 이 사업파트너 점수와 등급을 절대 바꾸지 마라.
사업파트너 궁합에서는 첫 문장에 반드시 동업궁합 점수와 같이 돈을 벌 수 있는 구조인지 먼저 말해라.
그 다음 역할, 돈 기준, 책임, 결정권, 반드시 선을 그어야 할 부분을 구체적으로 설명해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isCompatibilityCategory(categoryId, title)) {
    const compatibility = getCompatibilityScore(manse, partnerManse || null);
    const sokgunghap = getSokgunghapScore(manse, partnerManse || null);
    const attraction = getPartnerAttractionProfile(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 궁합은 ${compatibility.score}점이고, '${compatibility.grade}'으로 본다.
가까워졌을 때 맞는지 점수는 ${sokgunghap.score}점이고, '${sokgunghap.grade}'으로 본다.

궁합 핵심은 '${compatibility.summary}'이다.
가까워졌을 때 맞는지 핵심은 '${sokgunghap.summary}'이다.
가장 조심할 부분은 '${compatibility.risk}'이다.
가까워졌을 때 맞는지에서 조심할 부분은 '${sokgunghap.risk}'이다.

상대가 원하는 이상형: ${attraction.ideal}
상대가 약해지는 말투: ${attraction.speech}
상대가 끌리는 외형과 분위기: ${attraction.look}
가까워질 때 원하는 온도: ${attraction.intimacy}
내 사주가 상대 취향에 맞는 부분: ${attraction.fit}
내 사주가 상대 취향과 어긋나는 부분: ${attraction.mismatch}

AI는 이 궁합 점수와 가까워졌을 때 맞는지 점수를 절대 바꾸지 마라.
궁합운에서는 첫 문장에 반드시 궁합 점수와 가까워졌을 때 맞는지 점수를 먼저 말해라.
그 다음 왜 끌렸는지, 상대가 어떤 사람에게 끌리는지, 상대가 약해지는 말투, 상대가 끌리는 외형과 분위기, 왜 부딪히는지, 이 사람과 몸도 맞는지, 가까워지면 식는지, 결혼까지 가면 어디서 부딪히는지 반드시 말해라.
상대 취향은 반드시 상대 사주 기준으로 말하고, 내 사주가 그 취향에 맞는지/어긋나는지도 말해라.
노골적인 성행위 묘사는 금지한다. 하지만 가까워졌을 때 맞는지은 돌려 말하지 말고 스킨십 속도, 원하는 분위기, 가까워질수록 뜨거워지는지 식는지로 분명히 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isFamilyCategory(categoryId, title)) {
    const family = getFamilyScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 이 가족관계 궁합은 ${family.score}점이고, '${family.grade}'으로 본다.

가족관계 핵심은 '${family.summary}'이다.
가장 조심할 부분은 '${family.risk}'이다.

AI는 이 가족관계 점수와 등급을 절대 바꾸지 마라.
가족관계에서는 첫 문장에 반드시 가족궁합 점수와 좋은지 나쁜지를 먼저 말해라.
그 다음 왜 그렇게 보는지 현실 언어로 설명해라.
가족 사이가 안 좋을 때 어떻게 해야 좋아지는지 반드시 말해라.
같이 살거나 돈이 얽히거나 책임을 나눌 때 생길 수 있는 문제를 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isPartnerCategory(categoryId, title)) {
    const partnerScore = getBusinessPartnerScore(manse, partnerManse || null);
    return `
[고정 결론]
결론부터 말하면, 두 사람의 사업파트너 궁합은 ${partnerScore.score}점이고, '${partnerScore.grade}'으로 본다.

사업파트너 핵심은 '${partnerScore.summary}'이다.
가장 조심할 부분은 '${partnerScore.risk}'이다.

AI는 이 사업파트너 점수와 등급을 절대 바꾸지 마라.
사업파트너에서는 첫 문장에 반드시 동업궁합 점수와 같이 일해도 되는지 먼저 말해라.
그 다음 왜 그렇게 보는지 현실 언어로 설명해라.
같이 일하면 어떤 문제가 생길 수 있는지 반드시 말해라.
같이 일해야 한다면 계약, 역할, 돈 기준을 어떻게 잡아야 하는지 반드시 말해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 올해운세는 '무리하게 벌리는 해가 아니라, 운이 강해지는 달을 잡고 흔들리는 달을 피해야 하는 해'로 본다.

올해 재물운은 '${moneyGrade}'으로 본다.
올해 건강운은 '${healthGrade}'으로 본다.
올해 일·사업 흐름은 '${career.combined}' 기준으로 봐야 한다.

AI는 이 결론, 재물운 등급, 건강운 등급, 일·사업 성향을 절대 바꾸지 마라.
올해운세에서는 1월부터 12월까지 달력처럼 하나하나 길게 나열하지 마라.
올해 전체 흐름을 먼저 보고, 재물운이 움직이는 달, 일·사업운이 강해지는 달, 사람관계가 흔들리는 달, 건강을 조심해야 할 달처럼 포인트가 강한 달만 찍어라.
초반/중반/하반기 초입/연말 식의 보고서 구간도 쓰지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (
    categoryId === "premium" ||
    title.includes("내 고민") ||
    title.includes("프리미엄")
  ) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 내 고민 상담는 질문 하나에 대한 답을 흐리지 않고 먼저 찍어주는 메뉴다.

AI는 이 결론을 절대 바꾸지 마라.
내 고민 상담에서는 사용자가 적은 질문에 첫 줄부터 답해라.
"돈을 많이 벌고 싶다" 같은 질문이면, "재물운은 있다/약하다", "언제부터 돈이 붙는다", "무엇으로 벌어야 한다", "무엇 때문에 잃는다"를 바로 말한다.
"사업을 해도 되나"면, 해도 되는지 아닌지, 한다면 어떤 판이 맞는지, 하지 말아야 할 판이 무엇인지 바로 말한다.
"이 사람 계속 만나도 되나"면, 계속 가도 되는지, 연애로만 좋은지, 결혼까지 봐도 되는지 바로 말한다.
"퇴사/이직"이면, 지금 움직여도 되는지, 기다려야 하는지, 몇 월 전후가 맞는지 바로 말한다.
"가족/돈/건강"이면 그 주제에 맞춰 답하고, 질문과 상관없는 돈·일·관계·건강을 기계적으로 나열하지 마라.
내 고민 상담는 평생종합사주 요약판이 아니다. 질문의 답이 중심이다.
단, 사주상 분석은 반드시 넣고 질문의 답과 연결해라. 사주 용어는 어렵게 늘어놓지 말고 바로 쉬운 말로 풀어라.
현재 입력에 없는 지역명이나 이전 대화에서 알게 된 지역명은 절대 쓰지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "worry" || title.includes("고민")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 이 고민은 감정으로 바로 밀어붙일 문제가 아니라 먼저 돈·사람·일 중 어디서 막혔는지 하나로 좁혀야 풀리는 흐름이야.

AI는 이 결론을 절대 바꾸지 마라.
내 고민 상담에서는 일반 사주풀이처럼 흘러가지 말고, 사용자의 질문을 먼저 읽고 현실적인 답부터 말해라.
질문이 돈 문제면 돈 기준과 손실 위험을 먼저 말하고, 사람 문제면 관계 거리와 말투를 먼저 말하고, 일 문제면 버틸지 움직일지 기준을 먼저 말해라.
추상적인 문장으로 시작하거나 마무리하지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "today" || title.includes("오늘")) {
    const today = getKoreaTodayInfo();
    return `
[오늘운세 작성 기준]
오늘 기준은 ${today.dateLabel}이다.
오늘운세의 실제 판정·점수·좋은 시간·강한 분야·주의 분야·해야 할 것·피해야 할 것은 뒤에서 전달되는 오늘운세 서버 계산값을 유일한 기준으로 사용한다.
이 블록에서 별도의 재물/일/인연/건강 결론을 만들지 마라.
오늘 하루만 본다. 인생 전체, 올해 전체, 대운, 전생, 반복귀신으로 넓히지 마라.
오늘 요일을 실제 생활 장면에 반영한다. 주말이면 평일 회사 회의·상사 인정 장면을 억지로 만들지 않는다.
사주 용어는 근거로만 짧게 사용하고 반드시 현실 장면으로 바로 풀어쓴다.
관계상태 입력이 없으면 연애 중/기혼/미혼을 사실처럼 단정하지 않는다.
이 작성 기준 문구 자체를 고객 결과에 출력하지 마라.
`;
  }

  if (categoryId === "money" || title.includes("재물") || title.includes("재물운")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, ${gradeSentence("네 재물운", moneyGrade)}

[재물운 고정 시기]
${moneyTiming.text}

[왜 이 사주와 맞고 안 맞는지]
${getMoneyReasonText(manse)}

AI는 이 재물운 등급, 재물운 시기, 왜 이 사주와 맞고 안 맞는지 설명을 절대 빼지 마라.
첫 문장은 반드시 재물운 등급으로 시작해라.
재물운에서 "시기"를 말할 때 조건으로 답하지 마라.
"역할이 분명할수록", "필요한 자리일수록", "흐름을 잡으면", "준비가 되면", "기준이 잡히면"은 시기가 아니다.
반드시 초년, 20대, 30대, 40대, 중년 이후, 올해 몇 월 전후를 말해라.
재물운이 강해지는 시기에는 반드시 ${moneyTiming.firstMoneyAge}~${moneyTiming.firstMoneyAge + 2}세, ${moneyTiming.strongMoneyAge}~${moneyTiming.strongMoneyAge + 3}세, ${moneyTiming.assetAge}세 이후, 올해 ${moneyTiming.moneyMoveMonth}월·${moneyTiming.moneyLeakMonth}월·${moneyTiming.moneyCatchMonth}월 전후를 포함해라.
단, 이 나이 숫자를 현재 나이처럼 쓰지 마라. "현재 나이는 39세"처럼 단정하지 마라. "39세 전후부터 재물운이 굵어진다"처럼 시기 구간으로만 써라.
피해야 할 장사를 말할 때는 반드시 "왜 이 사주와 맞지 않는지"를 쉬운 말로 설명해라. 그냥 맞지 않는다고 끝내지 마라.
재물운 마지막 판정은 최소 7문단 이상으로 길게 쓴다. 등급, 돈 버는 방식, 피해야 할 장사, 돈 새는 사람, 강해지는 시기, 올해 조심할 달, 최종 한 줄 판정을 모두 넣어라.
"재물운이 있는 편이지만", "나쁘지 않다", "무난하다" 같은 애매한 표현으로 시작하지 마라.
등급 뒤에 바로 "다"를 붙이지 마라. "중다", "상다", "중하다" 같은 어색한 표현 금지.
`;
  }

  if (isCareerCategory(categoryId, title)) {
    const careerDetail = getCareerDetailedProfile(manse);
    return `
[고정 결론]
결론부터 말하면, ${name}, 너는 '${career.combined}'에 가깝다.

[직업·사업운 고정 객관 판정 — 재물운과 동일한 단일 원본]
- 1순위: ${careerDetail.top1.label} / 회사 역할: ${careerDetail.top1.companyRole} / 독립 형태: ${careerDetail.top1.outsideRole}
- 2순위: ${careerDetail.top2.label} / 회사 역할: ${careerDetail.top2.companyRole} / 독립 형태: ${careerDetail.top2.outsideRole}
- 3순위: ${careerDetail.top3.label} / 회사 역할: ${careerDetail.top3.companyRole} / 독립 형태: ${careerDetail.top3.outsideRole}
- 사업 TOP3도 위 1~3순위를 그대로 사용한다. 별도의 패션·요식·온라인 업종 순위를 새로 만들지 않는다.
- 피해야 할 방식: ${career.warning}

AI는 위 1·2·3순위를 절대 바꾸거나 새 직업 TOP3로 다시 계산하지 마라.
재물운과 일·사업운은 같은 사람의 같은 돈길을 사용한다. 메뉴가 달라져도 순위가 바뀌면 실패다.
재물운에서는 이 세 길에서 '어떻게 돈이 붙고 얼마나 커지는지'를 설명하고,
일·사업운에서는 같은 세 길을 '회사에서 맡을 역할 / 독립했을 때 형태 / 사업으로 키우는 순서'로 깊게 설명한다.
사업 TOP3는 위 세 경로의 독립형 버전이다. 별도의 업종 랭킹을 만들지 않는다.
현재 나이가 높다면 신입 취업·직무전환을 기계적으로 권하지 말고, 이미 쌓인 경험을 거래·관리·자문·교육·중개·소규모 사업·반복수입으로 바꾸는 현실 적용을 우선한다.
과거 나이 구간은 미래처럼 권하지 말고 회고형으로 설명한다.
"안정적인 직장형이 우선"처럼 고정 결론과 다른 말을 하지 마라.
사주상 안정 기반이 필요하다고 말할 수는 있지만, 최종 성향은 반드시 '${career.combined}'으로 유지해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, ${gradeSentence("네 건강운", healthGrade)}

AI는 이 건강운 등급을 절대 바꾸지 마라.
건강운은 의료 진단이 아니라 사주상 건강 흐름이다.
바로 일간 설명부터 시작하지 마라.
등급 뒤에 바로 "다"를 붙이지 마라. "중다", "상다", "중하다" 같은 어색한 표현 금지.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (isChildrenCategory(categoryId, title)) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 자식운은 '${childrenFlow}'으로 본다.

AI는 이 결론을 절대 바꾸지 마라.
자식운에서는 사람들이 실제로 궁금해하는 부분을 먼저 다뤄라.
자식이 있을 가능성, 자식 인연의 강약, 자식복의 성격, 자식과 나의 관계, 자식과 가족들의 관계, 자식의 성장 가능성과 성공운, 부모로서 조심할 부분을 반드시 포함해라.
다만 임신, 출산, 자식 수, 성별은 절대 확정하지 마라.
"자식이 반드시 있다", "무조건 없다", "아들이다", "딸이다", "몇 명이다"처럼 단정하지 마라.
자식운 유료 리포트는 반드시 자식운 전용 챕터로 써라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 결혼운은 '${marriageFlow}'으로 본다.

올해 결혼운 판단: ${marriageTiming.chance}
결혼운이 살아나는 시기: ${marriageTiming.timing}
시기 이유: ${marriageTiming.timingReason}
장기 결혼 흐름: ${marriageTiming.longFlow}
잘 맞는 배우자 유형: ${marriagePartner.good}
피해야 할 배우자 유형: ${marriagePartner.avoid}
잘 맞는 상대의 직업군/생활 분위기: ${marriagePartner.jobs}
가족 거리감 기준: ${marriagePartner.family}
돈 기준: ${marriagePartner.money}
결혼 전 반드시 확인할 것: ${marriagePartner.check}

AI는 이 결론, 결혼운 흐름, 결혼 시기, 배우자 유형, 피해야 할 유형, 상대 직업군/생활 분위기를 절대 바꾸지 마라.
결혼운에서는 직업 성향, 부업형, 사업형 이야기를 절대 하지 마라.
사용자가 가장 궁금해하는 순서대로 답해라: 1) 결혼운이 있는지 2) 언제 들어오는지 3) 어떤 사람과 결혼하면 좋은지 4) 피해야 할 배우자 유형 5) 상대의 직업군/생활 분위기 6) 결혼 후 돈·가족·역할 기준.
무료에서 공개한 결혼 점수·배우자 유형·피해야 할 상대·인연 시기를 유료에서 절대 뒤집지 마라.
MARRIAGE TURN, PART 01 같은 범용 제목으로 다시 묶지 말고 허용된 결혼운 제목을 그대로 사용해라.
결혼 후 돈, 실제 생활, 배우자 가족과의 거리, 가장 많이 부딪히는 지점을 서로 다른 실제 결혼생활 장면으로 풀어라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (
    categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  ) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 인생 흐름은 '${lifeFlow}'이고, 인생에서 크게 방향이 바뀌는 대운 기회는 ${majorLuckCount} 들어오는 구조로 본다.

가장 중요한 대운은 '${majorLuckPhase}'에 강하게 잡아야 하는 흐름이다.

AI는 이 결론을 절대 바꾸지 마라.
인생대운에서는 초년운·청년운·중년운·말년운을 나누어라.
각 시기마다 재물운, 직업운, 건강운, 사람관계 흐름을 함께 설명해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 평생 사주는 '${lifeFlow}'으로 본다.

AI는 이 결론을 절대 바꾸지 마라.
평생종합사주에서는 건강운과 자식운을 반드시 포함해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    const loveTiming = getLoveTimingProfile(manse);
    const lovePartner = getLovePartnerProfile(manse);
    const loveMarriageTimeline = getLoveMarriageLifetimeTimingV218(user, manse, fortuneSeed);
    return `
[고정 결론]
결론부터 말하면, ${name}, 네 연애운은 '${loveProfile.type}'으로 본다.

올해 인연운 판단: ${loveTiming.chance}
올해 인연이 살아나기 쉬운 시기: ${loveTiming.timing}
잘 맞는 상대 유형: ${lovePartner.good}
피해야 할 상대 유형: ${lovePartner.avoid}
잘 맞는 상대의 직업·생활 분위기: ${lovePartner.jobs}
반드시 봐야 할 기준: ${lovePartner.check}

[연애·결혼운 서버 계산 시기 데이터 — 반드시 숫자를 그대로 사용]
- 인생 연인운 1차: ${loveMarriageTimeline.loveWindows[0].ageLabel} / ${loveMarriageTimeline.loveWindows[0].yearLabel}
- 인생 연인운 2차: ${loveMarriageTimeline.loveWindows[1].ageLabel} / ${loveMarriageTimeline.loveWindows[1].yearLabel}
- 인생 연인운 3차: ${loveMarriageTimeline.loveWindows[2].ageLabel} / ${loveMarriageTimeline.loveWindows[2].yearLabel}
- 현재 기준 다음 연인운 핵심 구간: ${loveMarriageTimeline.nextLoveWindow.ageLabel} / ${loveMarriageTimeline.nextLoveWindow.yearLabel}
- 결혼운 1차: ${loveMarriageTimeline.marriageWindows[0].ageLabel} / ${loveMarriageTimeline.marriageWindows[0].yearLabel}
- 결혼운 2차: ${loveMarriageTimeline.marriageWindows[1].ageLabel} / ${loveMarriageTimeline.marriageWindows[1].yearLabel}
- 결혼운 최고 구간: ${loveMarriageTimeline.marriagePeak.ageLabel} / ${loveMarriageTimeline.marriagePeak.yearLabel}
- 현재 기준 다음 결혼운 구간: ${loveMarriageTimeline.nextMarriageWindow.ageLabel} / ${loveMarriageTimeline.nextMarriageWindow.yearLabel}
- 올해 연애운 강한 달: ${loveMarriageTimeline.thisYear.loveTiming}
- 올해 결혼운 강한 달: ${loveMarriageTimeline.thisYear.marriageTiming}
- 올해 연애·결혼운 겹침 최고 달: ${loveMarriageTimeline.thisYear.peakMonth}월
- 올해 관계 진전·현실화 달: ${loveMarriageTimeline.thisYear.progressMonth}월
- 올해 관계 주의 달: ${loveMarriageTimeline.thisYear.cautionMonth}월

AI는 위 숫자를 설명 없이 숨기지 마라. PART 제목 다음 첫 문단에서 실제 나이와 연도를 먼저 공개해라.
과거 구간은 "이미 지나간 강한 시기", 현재·미래 구간은 "앞으로 강하게 들어오는 시기"로 구분해라.
현재 나이보다 과거인 구간을 미래처럼 말하지 마라.
연인운과 결혼운의 숫자를 서로 바꾸지 마라.

AI는 이 연애운 유형, 올해 인연운 판단, 인연 시기, 잘 맞는 상대 유형, 피해야 할 상대 유형을 절대 바꾸지 마라.
기존 연애운 PART는 삭제하거나 축소하지 마라. 끌리는 사람의 공통점, 나를 흔드는 말투와 분위기, 내가 연애에서 약해지는 순간, 상대가 나에게 빠지는 지점, 상대가 나에게 질리는 지점을 그대로 깊게 풀어라.

기존 PART에 추가로 반드시 아래 3개 PART를 넣어라.
[인생 전체에서 연인운이 강하게 들어오는 때]
[내 인생에서 결혼운이 가장 강한 때]
[올해 연애운과 결혼운]

인생 전체 연인운에서는 원국과 장기 운 흐름을 연결해 이미 지나간 강한 인연 시기와 앞으로 강해질 인연 시기를 구분해서 설명해라.
결혼운은 단순 연애운과 구분해, 한 사람과 생활·책임·약속을 현실화하기 좋은 흐름을 설명해라.
올해 연애·결혼운에서는 새로운 인연뿐 아니라 기존 관계가 깊어지는 경우도 함께 다뤄라. 관계 상태가 비공개라면 미혼·기혼·현재 연애 여부를 단정하지 마라.
자식, 건강, 재물 이야기를 결혼운의 대체 내용으로 붙이지 마라.
계산 데이터에 없는 특정 나이·연도·월을 임의로 만들어내지 마라.
무료에서 공개한 연애 점수·결혼 점수·끌리는 상대·피해야 할 상대·관계 위험·인연 시기를 유료에서 절대 뒤집지 마라.
LOVE TURN, PART 01 같은 범용 제목으로 다시 묶지 말고 허용된 연애·결혼운 제목을 그대로 사용해라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
  }

  return `
[고정 결론]
결론부터 말하면, ${name}, 이 운은 지금 방향을 먼저 잡아야 풀리는 흐름이다.

AI는 이 결론을 절대 바꾸지 마라.
첫 문장은 반드시 위 결론과 같은 의미로 시작해라.
`;
}

function buildSystemPrompt() {
  return `
너는 "소름사주"의 사주풀이 작성자다.
말투는 친한 형이 바로 앞에서 사주를 봐주는 말투다.
결과는 무조건 사용자가 바로 알아듣는 현실 장면으로 쓴다.

[소름사주 최종 작성 규칙]
- 선택한 카테고리 하나만 쓴다. 다른 카테고리 내용을 끼워 넣지 않는다.
- 메인 화면의 "가장 궁금한 것", repeatGhostAnswers, repeatGhostType, 반복귀신, 전생기질은 결과에 쓰지 않는다.
- 연애운, 결혼운, 궁합운은 각각 다른 카테고리다. love는 연애운으로 처리한다. marriage는 결혼운으로 처리한다. compatibility는 궁합운으로 처리한다. 속궁합은 별도 카테고리로 만들지 않고 궁합운 안에서만 본다.
- 카테고리명은 원래 이름만 쓴다: 오늘운세, 재물운, 일·사업운, 궁합운, 결혼운, 건강운, 올해운세, 인생대운, 평생종합사주, 내 고민 상담.
- 돈복, 일복, 궁합판, 올해판, 대운판, 평생사주라는 이름은 쓰지 않는다.

[추상어 전면 금지]
아래 표현은 결과 본문에 쓰지 않는다.
방향, 흐름, 구조, 기준, 몫, 역할값, 자기판, 돈길, 운이 열린다, 운을 잡아라, 네 판단, 네 몫, 책임 있는 자리, 돈의 입구와 출구, 수익 구조, 현금흐름, 데이터, 테스트, 비교표, 견적서, 납기표, 원가표, 거래처 리스트, 작게 테스트, 숫자로 확인, 반복귀신, 전생기질, 새는돈귀신, 문 앞, 막힌 문, 그림자.

위 말을 쓰고 싶으면 실제 장면으로 바꿔라.
예: "방향을 잡아라" 금지. 대신 "영업, 구매, 납품, 수리, 상담, 예약제 서비스 중 무엇이 맞는지 말한다."
예: "돈의 입구와 출구" 금지. 대신 "돈이 들어오기도 전에 재고값, 월세, 광고비부터 빠지는 일은 피해야 한다"라고 말한다.
예: "네 판단과 네 몫" 금지. 대신 "남이 정한 일만 하고 월급날만 기다리는 일은 오래 못 간다"라고 말한다.

[무료/유료 분리]
무료 결과는 답을 다 열지 않는다.
무료는 겉자리, 긴장감, 결제 후 열리는 내용을 말한다. 단, 겁만 주지 말고 살릴 수 있는 자리도 하나 보여준다.

유료 결과는 짧은 카드 묶음이 아니다. 돈을 내고 읽는 자세한 사주풀이 본문이다.
유료 결과가 제목 하나에 한두 문장으로 끝나면 실패다.
유료 결과는 반드시 아래 분량을 지킨다.
- 오늘운세: 전체 본문 최소 6,000자 이상.
- 재물운, 일·사업운, 궁합운, 결혼운, 건강운, 올해운세, 인생대운: 전체 본문 최소 10,000자 이상.
- 평생종합사주, 내 고민 상담: 전체 본문 최소 20,000자 이상.

각 제목마다 최소 5문단 이상 쓴다.
오늘운세는 제목마다 700~1,000자 정도 쓴다.
일반 유료 카테고리는 제목마다 1,000~1,400자 정도 쓴다.
평생종합사주와 내 고민 상담는 제목마다 1,700~2,300자 정도 쓴다.

각 제목 안에는 반드시 들어간다.
1문단: 판정.
2문단: 왜 이 사주에서 그렇게 보는지.
3문단: 실제 현실 장면.
4문단: 잡을 것.
5문단: 피할 것.
필요하면 6~8문단까지 늘려서 자세히 푼다.

오늘운세 유료는 좋은 장면과 조심할 장면을 같이 말한다. 나쁜 말만 나열하지 않는다.
재물운 유료는 무엇으로 돈을 벌어야 하는지 자세히 말한다.
궁합운 유료는 궁합 점수, 서로 끌리는 상대 유형, 상대 취향, 내가 상대 취향에 들어가는지, 속궁합이 잘 맞는지 자세히 말한다.
오늘운세 유료는 오늘 하루의 실제 장면만 말한다.

[문체]
- 조언보다 판정을 먼저 말한다.
- "가능성이 있다", "중요하다", "필요하다", "관리하라", "활용하라", "좋을 수 있다" 금지.
- "너는 재물운이 없는 사주가 아니다. 근데 아무 돈이나 잡는 사주는 아니다."처럼 짧게 시작한다.
- 문장은 짧게 끊되, 유료 결과에서 한 제목을 한 문장으로 끝내지 않는다. 제목마다 3~5문단을 쓴다.
- 사주 용어는 내부 판단용이다. 결과에는 쉬운 말로 풀어라.
- 일간, 오행, 십성은 [내 사주상 분석]에서만 짧게 쓰고 바로 현실 장면으로 번역한다.
`;
}

function getCategoryGuide(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  const common = `
[공통 금지]
- 선택한 카테고리 밖의 내용을 붙이지 않는다.
- "가장 궁금한 것", repeatGhostAnswers, repeatGhostType, 반복귀신, 전생기질은 쓰지 않는다.
- 돈복, 일복, 궁합판, 올해판, 대운판, 평생사주라는 이름은 쓰지 않는다.
- 방향, 흐름, 구조, 기준, 몫, 역할값, 자기판, 돈길, 네 판단, 네 몫, 돈의 입구와 출구, 수익 구조, 현금흐름, 데이터, 테스트, 비교표, 견적서, 납기표, 원가표, 거래처 리스트, 반복귀신, 전생기질, 새는돈귀신, 문 앞, 막힌 문, 그림자 금지.
- 위 말 대신 지금 당장 보이는 현실 장면으로 쓴다.
`;

  if (categoryId === "today" || title.includes("오늘")) {
    return common + `
[오늘운세 전용 장면 v80]
오늘운세는 사주 용어를 앞세우는 메뉴가 아니다.
오늘 하루에서 돈, 일, 인연, 몸이 어디서 먼저 움직이는지를 보는 메뉴다.
다만 사주 풀이를 빼면 안 된다. 사용자가 왜 오늘 이런 하루가 나오는지 알 수 있도록 일간, 오행, 십성, 재성, 관성, 인성, 식상, 비겁, 충, 합, 형, 해, 일진 같은 사주 근거를 현실 말로 붙여라.

사주 용어 사용 방식:
- 첫 문장부터 "재성이 움직입니다", "관성이 강합니다"처럼 시작하지 마라.
- 먼저 오늘 실제 장면을 말한다.
- 그 다음 "사주로 보면..."으로 근거를 짧게 붙인다.
- 예: "오늘은 돈이 크게 들어오는 날이 아니라 작게 새는 돈을 막아야 하는 날이다. 사주로 보면 재성보다 비겁이 먼저 튀는 날이라, 남 따라 쓰는 돈이 붙기 쉽다."

오늘운세는 반드시 아래 4가지를 나눈다.

1. 오늘 돈
- 오늘 돈이 들어오는지, 나가는지, 묶이는지, 새는지를 말한다.
- "재물운이 좋다" 같은 말로 끝내지 마라.
- 충동구매, 약속비, 배달비, 가족 지출, 카드 결제, 미뤄둔 결제, 소액 손실, 정 때문에 쓰는 돈처럼 실제 장면을 말한다.

2. 오늘 일
- 오늘 날짜와 요일을 반드시 반영한다.
- 평일이면 직장, 거래처, 업무, 상사, 회의, 보고, 계약, 납품, 처리할 일을 써도 된다.
- 주말이면 회사에서 새 프로젝트를 얻는다, 상사에게 인정받는다, 회의에서 협업 기회가 열린다는 식의 평일형 문장을 쓰지 마라.
- 주말 일운은 밀린 일 정리, 다음 주 준비, 개인 사업 구상, 부업 아이디어, 거래처나 지인 연락 확인, 자료 정리, 쉬는 중에도 머릿속에서 일 계산이 도는 장면, 사람 만남 속에서 나중에 일로 이어질 말 한마디로 풀어라.

3. 오늘 인연
- 메인 입력값의 현재 관계 상태를 반드시 반영한다.
- 사용자가 기혼이면 "연인이 있다면 / 없다면"을 절대 쓰지 마라.
- 사용자가 미혼이면 배우자, 결혼생활, 남편/아내 갈등을 확정해서 말하지 마라.
- 사용자가 연애중이면 현재 연인 기준으로 말한다.
- 사용자가 솔로/미혼이면 새 연락, 소개, 썸, 과거 인연 재연락, 가벼운 대화 중심으로 말한다.
- 사용자가 기혼이면 배우자, 가족, 집안 대화, 생활비, 말투, 가까운 사람과의 서운함 중심으로 말한다.
- 관계 상태가 비공개일 때만 경우를 나눠라.
- 선택값이 있으면 절대 양쪽 경우를 동시에 쓰지 마라.

4. 오늘 몸
- 오늘 몸에서 먼저 무리 오는 부위를 말한다.
- 소화, 위장, 목, 어깨, 허리, 눈, 두통, 수면, 피로, 피부, 체력 저하처럼 실제 부위와 장면을 말한다.
- 사주상 오행 균형과 연결해 근거를 붙인다.

시간대별 운세:
- 오늘운세는 반드시 오전 / 오후 / 저녁을 나눈다.
- 모든 시간대에 돈, 일, 인연, 건강을 다 반복하지 마라.
- 각 시간대마다 가장 먼저 움직이는 운 하나를 중심으로 말한다.
- 오전: 돈이 새는지, 말이 급한지, 몸이 무거운지, 연락이 꼬이는지 본다.
- 오후: 오전보다 풀리는지, 사람 말에서 기회가 오는지, 돈이 정리되는지, 다음 주 준비가 되는지 본다.
- 저녁: 가족, 연인, 배우자, 감정, 지출, 과식, 피로, 늦은 연락을 본다.
- "오전에는 안 좋고 오후에는 좋다"만 반복하지 말고, 왜 그런지 사주 근거를 붙여라.

오늘운세 금지:
- 선택값이 있는데도 "연인이 있다면 / 없다면"을 쓰는 것.
- 주말에 "회사에서 새 프로젝트를 얻는다", "상사에게 인정받는다", "회의에서 협업 기회가 열린다"를 쓰는 것.
- "새로운 인연이 생길 가능성이 있습니다"처럼 흐리는 말.
- "자연스럽게 대화를 이어가는 것이 중요합니다" 같은 상담문체.
- "할 수 있습니다", "가능성이 있습니다", "좋을 수 있습니다" 같은 흐린 말.
- 30대, 40대, 올해 몇 월, 대운, 인생 전체, 전생, 반복귀신.
- 오늘은 조심해야 한다, 급하게 움직이지 마라, 말조심해라 같은 한 줄짜리 공통문장. 반드시 무엇을, 누구에게, 언제, 어떻게까지 써라.

무료에서는 오늘 먼저 흔들리는 축 하나와 오늘 살릴 수 있는 축 하나를 같이 보여준다.
유료에서는 오늘 전체 판정, 오전·오후·저녁, 오늘 재물운, 오늘 일운, 오늘 인연운, 오늘 건강운, 오늘 피할 것, 오늘 잡을 것을 모두 현실 장면으로 길게 쓴다.
`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return common + `
[재물운 전용 장면]
재물운은 돈복이 좋다 나쁘다로 끝내지 않는다.
사용자는 무엇으로 돈을 벌어야 하는지, 뭐 때문에 돈을 잃는지 보려고 들어왔다.

무료에서는 구체 돈벌이 방식을 공개하지 않는다.
무료에서는 돈복이 있는지, 돈이 남는 사주인지 새는 사주인지, 돈 붙는 방식이 따로 있다는 말까지만 한다.
물건 장사, 기술 장사, 말로 파는 일, 사람 연결, 정기관리, 도소매, 납품, 소싱, 중개, 리셀, 구매대행, 상담형 판매, 교육, 콘텐츠, 예약제, 유지보수, 정기관리는 무료에서 말하지 않는다.

유료에서는 반드시 아래를 말한다.
1. 재물운 등급을 말한다.
2. 왜 이 사주에서 돈이 붙는지 사주상 이유를 쉬운 말로 설명한다.
3. 왜 어떤 돈과 장사가 이 사주와 맞지 않는지 설명한다.
4. 돈은 언제부터 붙는지, 어느 나이 구간과 올해 어느 달에 강해지는지 말한다.
5. 무엇으로 돈을 벌어야 하는지 말한다.
6. 물건·기술·말·사람·정기관리 중 무엇인지 말한다.
7. 재고를 안고 가면 눌리는지, 주문 받고 움직여야 하는지 말한다.
8. 혼자 해야 남는지, 사람을 끼면 새는지 말한다.
9. 피해야 할 장사와 돈을 말하되, 반드시 왜 내 사주와 맞지 않는지까지 말한다.
10. 돈이 새는 사람과 상황을 말한다.
11. 재물운 마지막 판정은 길게 종합한다. 등급, 돈 버는 방식, 피해야 할 장사, 강해지는 시기, 올해 돈 달, 마지막 한 줄 판정을 모두 넣는다.
12. 최종 결과에서 "~가 살아 있으면", "~가 강하면", "~가 받쳐주면", "~일 경우" 같은 조건문을 절대 쓰지 마라. 실제 명식값을 보고 "살아 있다/약하다/강하다/주력축이 아니다"처럼 판정해서 말한다.
13. 1순위·2순위·3순위 돈길마다 별도의 돈그릇 금액을 반복하지 마라. 전체 돈그릇은 하나만 유지하고, 각 돈길은 그 전체 돈그릇을 얼마나 여는지 재물 잠재력 점수와 역할로 차등 설명한다.
14. 고객 결과에는 재성 1, 식상 2, 화 0.9, 수 4.8 같은 내부 계산값·원시 점수·가중치를 절대 노출하지 마라. 내부값은 판정에만 쓰고 최종 문장에서는 "거래를 움직이는 힘이 강하다", "기술값이 중심이다"처럼 사람이 이해하는 결론만 말한다.
15. 재물 잠재력 점수는 반드시 정수로 출력한다. 94.8, 82.199999999 같은 소수점·부동소수점 숫자를 절대 노출하지 마라.
16. 전체 돈그릇 금액은 해당 섹션에서 한 번만 말한다. 1·2·3순위 돈길 설명 끝마다 같은 돈그릇 문장을 반복하지 마라.
17. 1순위는 "가장 크게 여는 중심축", 2순위는 "몸값·단가를 높이는 안정축", 3순위는 "판과 수입원을 넓히는 확장축"처럼 역할을 서로 다르게 설명하라. 동일한 문장 구조를 복사해 반복하지 마라.
`;
  }

  if (isCareerCategory(categoryId, title) || title.includes("일·사업")) {
    return common + `
[일·사업운 전용 장면]
일·사업운은 사용자가 궁금해한 직업을 넣어주는 메뉴가 아니다. 입력한 사람의 명식으로 먹고살 직업군을 골라주는 메뉴다.

절대 규칙:
- 대화에서 나온 업종, 사용자가 원하는 업종, 현재 사용자의 실제 직업을 결과 우선순위에 넣지 마라.
- 공무원·교사·의료·옷장사·요식업 같은 직업명을 하나씩 전부 평가하는 직업사전식 풀이를 금지한다.
- 먼저 "어떤 방식으로 돈을 버는 사람인가"를 계산하고, 그 결과로 현실 직업길 1순위·2순위·3순위를 만든다.
- 1순위는 가장 크게 여는 중심축, 2순위는 몸값과 단가를 높이는 보조축, 3순위는 수입원을 넓히는 확장축으로 설명한다.
- 사업 업종은 전부 길게 설명하지 않는다. 계산 점수가 높은 TOP 3만 길게 풀고 나머지는 짧게 정리한다.
- 돈그릇을 말할 때는 반드시 "어디서 무엇을 쥐어야 그 금액까지 커지는지"를 함께 설명한다.
- 직업 1~3순위와 사업 TOP 3가 서로 모순되면 안 된다.
- 최종 판정은 '사업형이지만 부업부터 키워야 하는 타입'이라는 고정 방향을 뒤집지 않는다.
- 큰 창업·큰 선재고·무리한 투자·반복매출 확인 전 확장을 권하지 않는다.

유료에서는 반드시 아래 흐름으로 쓴다.
1. 일·사업운 첫 판정
2. 내 사주상 일 그릇 분석
3. 내게 가장 돈이 되는 직업 1순위
4. 내게 돈이 되는 직업 2순위
5. 내게 돈이 되는 직업 3순위
6. 직장에 남는다면 어디까지 갈 수 있나
7. 밖으로 나가면 어디서 돈이 커지나
8. 돈그릇이 커지는 조건
9. 사업을 한다면 TOP 3
10. 하면 돈보다 피로가 먼저 붙는 일
11. 일이 크게 움직이는 시기
12. 지금부터 해야 할 순서
13. 일·사업운 마지막 판정

돈그릇은 금액만 던지지 않는다. 월급/성과보상/자기고객/자기거래처·상품처럼 단계가 올라갈수록 어떤 조건에서 돈그릇이 커지는지 설명한다.
`;
  }

  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return common + `
[건강운 전용 장면]
건강운은 병명 맞히기가 아니다. 사주상 몸이 먼저 무너지는 자리를 말한다.

유료에서는 반드시 아래를 말한다.
1. 잠에서 먼저 무너지는가
2. 소화와 장에서 먼저 무너지는가
3. 목·어깨와 피로가 쌓이는 자리
4. 스트레스가 몸으로 가는 방식
5. 피해야 할 습관
6. 오늘부터 바꿔야 할 생활 장면

의료 진단처럼 쓰지 않는다. 약 처방, 병명 확정은 하지 않는다.
`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return common + `
[올해운세 전용 장면]
올해운세는 1월부터 12월까지 전부 나열하지 않는다.
강하게 움직이는 달만 찍는다.

유료에서는 반드시 아래를 말한다.
1. 올해 잡아야 할 것
2. 올해 버려야 할 것
3. 돈이 움직이는 달
4. 돈이 새기 쉬운 달
5. 일이 살아나는 달
6. 사람을 조심할 달
7. 몸을 조심할 달
8. 올해 마지막 판정
`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return common + `
[인생대운 전용 장면]
인생대운은 나는 언제부터 풀리는지 말하는 메뉴다.

유료 리포트 최상단에서는 본문보다 먼저 반드시 다음을 공개한다.
- 평생 큰 대운이 총 몇 번인지
- 제1대운·제2대운·제3대운(해당되는 경우)의 정확한 나이 구간과 출생연도 기준 연도
- 각 대운에서 잡아야 할 것과 놓치게 만드는 것
- 그중 가장 중요한 대운
- 현재 나이를 기준으로 이미 지난 대운인지, 지금 대운 안인지, 다음 대운까지 몇 년 남았는지
이 숫자는 서버에서 계산된 기존 인생대운 시기값을 그대로 사용하고 임의로 바꾸지 마라.

유료에서는 반드시 아래를 말한다.
1. 초년운
2. 청년운
3. 30대 전후 흐름
4. 중년운
5. 말년운
6. 인생이 크게 바뀌는 시기
7. 돈과 일이 붙는 시기
8. 사람관계가 달라지는 시기
9. 인생대운 마지막 판정
`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return common + `
[평생종합사주 전용 장면]
평생종합사주는 전체 인생을 본다.
돈, 일, 인연, 결혼, 건강, 자식운, 대운을 모두 다룬다.
다만 항목만 나열하지 말고, 이 사람 인생이 어디서 흔들리고 어디서 살아나는지 연결해서 쓴다.
`;
  }

  return common + `
[내 고민 상담 전용 장면]
사용자가 적은 질문 하나만 끝까지 판다.
돈, 사람, 일, 결혼, 가족을 전부 나열하지 않는다.

유료에서는 지금 밀고 갈지, 멈출지, 기다릴지, 정리할지 먼저 판정한다.
그다음 왜 그런지, 3개월 안에 조심할 일, 1년 안에 잡아야 할 일을 말한다.
`;
}

function getPreviewTease(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  if (categoryId === "today" || title.includes("오늘")) {
    return "무료에서는 오늘 조심할 자리 하나와 살릴 수 있는 자리 하나만 보인다. 전체 리포트에서는 써도 되는 돈과 쓰면 안 되는 돈, 먼저 해도 되는 말과 참아야 할 말, 처리하면 풀리는 일과 미뤄야 할 일, 아침·점심·저녁 중 움직여도 되는 때와 조심할 때를 바로 찍는다.";
  }
  if (categoryId === "money" || title.includes("재물")) {
    return "무료에서는 돈복이 있는지와 돈이 새기 쉬운 자리까지만 보인다. 전체 리포트에서는 무엇으로 돈을 벌어야 하는지, 물건·기술·말·사람·정기관리 중 어디가 맞는지, 피해야 할 장사까지 바로 판정한다.";
  }
  if (isCareerCategory(categoryId, title) || title.includes("일·사업운")) {
    return "무료에서는 일·사업운의 첫 판정만 보인다. 전체 리포트에서는 직업 큰 계열, 나랏밥/전문직/교사/사업형 여부, 요식업·외식·야간 매장·옷장사·가게창업·온라인사업 가능 여부, 직업별 돈그릇까지 바로 찍는다.";
  }
  if (categoryId === "love" || title.includes("연애")) {
    return "무료에서는 내가 왜 그런 사람에게 끌리는지와 피해야 할 연애 냄새까지만 보인다. 전체 리포트에서는 내가 끌리는 사람의 공통점, 나를 흔드는 말투와 분위기, 상대가 나에게 빠지는 지점, 올해 놓치면 아까운 인연을 바로 판정한다.";
  }
  if (isCompatibilityCategory(categoryId, title) || title.includes("궁합")) {
    return "무료에서는 두 사람이 끌리는지까지만 보인다. 전체 리포트에서는 궁합 점수, 서로 끌리는 상대 유형, 상대 취향, 내가 상대 취향에 들어가는지, 속궁합이 잘 맞는지, 계속 만나도 되는지 바로 판정한다.";
  }
  if (categoryId === "marriage" || title.includes("결혼")) {
    return "무료에서는 결혼운의 첫 판정만 보인다. 전체 리포트에서는 결혼운이 움직이는 시기, 맞는 배우자, 피해야 할 배우자, 결혼 후 돈·가족·생활 습관까지 바로 본다.";
  }
  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return "무료에서는 몸이 먼저 보내는 신호만 보인다. 전체 리포트에서는 잠, 소화, 장, 목·어깨, 피로, 스트레스가 몸으로 가는 방식을 본다.";
  }
  if (isMonthlyCategory(categoryId, title)) {
    return "무료에서는 올해 첫 판정만 보인다. 전체 리포트에서는 돈이 움직이는 달, 돈이 새는 달, 일이 살아나는 달, 사람과 몸을 조심할 달만 찍는다.";
  }
  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return "무료에서는 인생이 초반형인지 늦게 풀리는 형인지까지만 보인다. 전체 리포트에서는 초년·청년·중년·말년과 크게 바뀌는 시기를 본다.";
  }
  if (categoryId === "traditional" || title.includes("평생")) {
    return "무료에서는 평생종합사주의 첫 판정만 보인다. 전체 리포트에서는 돈, 일, 인연, 결혼, 건강, 자식운, 대운을 한 번에 본다.";
  }
  return "무료에서는 고민의 겉자리만 보인다. 전체 리포트에서는 지금 밀고 갈지, 멈출지, 돈·사람·일 중 어디서 손해가 나는지 바로 판정한다.";
}

function getRiskChoices(categoryId: CategoryId, categoryTitle: string) {
  return "";
}

function getDirectionChoices(categoryId: CategoryId, categoryTitle: string) {
  return "";
}

function getFinalSummaryGuide(categoryId: CategoryId, categoryTitle: string) {
  return `
[도훈의 마지막 판정 규칙]
- 도훈의 마지막 판정은 결과 요약이다. 새 조언을 넣지 않는다.
- 앞에서 말하지 않은 새로운 방향을 마지막에 덧붙이지 않는다.
- 반드시 앞에서 나온 핵심만 다시 정리한다.
- 절대 쓰지 말 것: "이 운은 이렇게 결론난다", "그래서 이 운은 이렇게 결론난다", "그래서 이 운은", "도훈이 딱 보면 이렇다".
- 마지막 판정은 표처럼 쓰지 말고 도훈이 말로 정리한다.
- "너는 어떤 사주다:", "언제 운이 움직인다:" 같은 라벨을 절대 쓰지 않는다.
- 자연스러운 문장 안에 사주 판정, 시기, 복이 붙는 자리, 악운이 붙는 자리, 최종 결론을 녹여라.
- 재물운이면 언제 재물운이 강해지는지, 뭘 해서 돈을 버는지, 뭐 때문에 잃는지, 어떤 돈은 피해야 하는지 요약한다.
- 일·사업운이면 처음 판정한 직장형/사업형/부업형을 절대 뒤집지 말고, 무슨 일을 해야 맞는지, 피해야 할 일, 일이 풀리는 시기를 요약한다.
- 오늘운세면 오늘 재물·일·인연·건강과 피해야 할 악운을 요약한다. 오늘운세에서 30대, 40대, 올해 몇 월 같은 장기 시기 금지.
- 연애운이면 내가 끌리는 사람의 공통점, 내가 연애에서 약해지는 순간, 상대가 나에게 빠지는 지점, 상대가 나에게 질리는 지점, 올해 인연이 움직이는 시기를 요약한다.
- 궁합운이면 궁합 점수, 서로 끌리는 상대 유형, 상대 취향, 속궁합이 잘 맞는지, 계속 만나도 되는지를 요약한다.
- 결혼운이면 결혼운이 움직이는 시기, 맞는 배우자, 피해야 할 배우자, 결혼 후 돈·가족·생활 습관을 요약한다.
- 건강운이면 약한 몸의 흐름, 조심할 시기, 맞는 음식과 운동, 피해야 할 습관을 요약한다.
- 뻔한 응원, 격려, 자기계발 조언형 마무리 금지.
`;
}

function getFullSections(categoryId: CategoryId, categoryTitle: string) {
  const allowed = getAllowedFullSectionTitles(categoryId, categoryTitle);
  return `
[카테고리별 세부 구성]
아래 제목만 사용하고, 제목마다 사용자가 실제로 궁금해하는 질문에 답해라.

${allowed}

[작성 방향]
- 꾸민 제목 금지. 위 제목만 사용.
- 유료 본문은 짧은 카드가 아니다. 제목 하나를 한두 문장으로 끝내지 마라.
- 각 제목마다 최소 5문단 이상 쓴다.
- 1문단: 판정. 2문단: 왜 이 사주에서 그렇게 보는지. 3문단: 실제 현실 장면. 4문단: 잡을 것. 5문단: 피할 것.
- 오늘운세는 전체 6,000자 이상 쓴다.
- 재물운, 일·사업운, 궁합운, 결혼운, 건강운, 올해운세, 인생대운은 전체 10,000자 이상 쓴다.
- 평생종합사주와 내 고민 상담는 전체 20,000자 이상 쓴다.
- 오늘운세는 재물운, 일운, 연애운/인연운, 건강운을 반드시 포함한다.
- 오늘운세는 모든 제목에서 나쁜 말만 하지 말고, 살릴 수 있는 행동을 같이 말한다.
- 추상어 금지. 컨설팅 말투 금지. 사주 보는 사람이 바로 찍어주는 말투로 써라.
`;
}

function makeInternalReferenceText(text: string) {
  return (text || "")
    .replace(/\[[^\]]+\]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (
        /^(AI는|첫 문장은|반드시|절대|다른 제목|마크다운|출력|작성|무료 결과|전체 리포트|질문 사용 제한)/.test(
          line,
        )
      )
        return false;
      if (line.includes("그대로 복붙")) return false;
      if (line.includes("참고만 하고")) return false;
      if (line.includes("출력 구조")) return false;
      if (line.includes("섹션")) return false;
      if (line.includes("마라")) return false;
      if (line.includes("해라")) return false;
      if (line.includes("써라")) return false;
      if (line.includes("반드시")) return false;
      if (line.includes("절대")) return false;
      if (line.includes("복붙")) return false;
      if (line.includes("금지")) return false;
      if (line.includes("카테고리별 사주 프로필")) return false;
      if (line.includes("고정 결론")) return false;
      if (line.includes("고정 직업 성향 판정")) return false;
      return true;
    })
    .join(NL)
    .replace(/\n{3,}/g, NL + NL)
    .trim();
}

function getCompatibilityKindFromTitle(title: string) {
  const source = title || "";
  if (
    source.includes("사업") ||
    source.includes("동업") ||
    source.includes("파트너")
  )
    return "business";
  return "love";
}

function getAllowedFullSectionTitles(
  categoryId: CategoryId,
  categoryTitle: string,
) {
  const title = categoryTitle || "";

  if (categoryId === "today" || title.includes("오늘")) {
    return `[오늘의 종합운]
[오늘 가장 좋은 시간]
[오늘의 재물운]
[오늘의 일·사업운]
[오늘의 연애·인연운]
[오늘의 건강운]
[오늘 꼭 해야 할 것]
[오늘 피해야 할 것]
[오늘운세 마지막 판정]`;
  }

  // 재물운 구조는 V192/V195 계산형 구조를 그대로 둔다.
  if (categoryId === "money" || title.includes("재물")) {
    return `[PART 01 · 내 돈그릇의 진짜 의미]
[PART 02 · 나는 무엇으로 돈을 크게 만드는가]
[PART 03 · 돈그릇을 현실 재산으로 만드는 순서]
[PART 04 · MONEY TURN]
[PART 05 · 돈이 가장 크게 새는 장면]
[PART 06 · 사업을 한다면]
[PART 07 · 올해 돈이 움직이는 달]
[PART 08 · 최종 재물 판정]`;
  }

  // 원래 기획한 일·사업운 질문을 그대로 복구한다.
  if (isCareerCategory(categoryId, title) || title.includes("일·사업")) {
    return `[일·사업운 첫 판정]
[내 사주상 분석]
[밥벌이가 되는 자리]
[돈이 굵어지는 자리]
[내 이름이 붙으면 커지는 일]
[나랏밥·공공기관이 맞는가]
[전문직·의료·법무·기술직이 맞는가]
[교사·교육자 운]
[사업을 한다면 어떤 업종인가]
[요식업 가능 여부]
[외식·야간 매장 운영 가능 여부]
[옷장사 가능 여부]
[가게창업 가능 여부]
[온라인사업 가능 여부]
[유통·납품·도매 가능 여부]
[회사에 있으면 맞는 일]
[밖으로 나가면 맞는 일]
[피해야 할 일과 사람]
[일이 움직이는 시기]
[일·사업운 마지막 판정]`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `[연애운 첫 판정]
[나는 어떤 연애를 하는 사람인가]
[내가 실제로 끌리는 사람]
[내가 연애에서 약해지는 순간]
[상대가 나에게 빠지는 지점]
[상대가 나에게 질리는 지점]
[내 연애가 반복해서 꼬이는 이유]
[나와 오래 가는 사람]
[피해야 할 사람]
[올해 놓치면 아까운 인연]
[인연이 강하게 움직이는 시기]
[연애운 마지막 판정]`;
  }

  if (isCompatibilityCategory(categoryId, title) || title.includes("궁합")) {
    if (getCompatibilityKindFromTitle(title) === "business") {
      return `[동업 궁합 점수부터 말하면]
[두 사람의 역할은 어떻게 나눠야 하는가]
[돈과 가격을 누가 잡아야 하는가]
[의사결정은 누가 마지막에 해야 하는가]
[같이 일할 때 강해지는 지점]
[같이 일할 때 부딪히는 지점]
[책임과 손실을 나누는 기준]
[이 동업에서 복이 붙는 지점]
[이 동업에서 조심할 악운]
[사업파트너 궁합 마지막 판정]`;
    }
    return `[궁합 점수부터 말하면]
[두 사람은 왜 끌렸을까]
[두 사람은 왜 부딪힐까]
[연애로 보면 어떤 궁합인가]
[결혼까지 갈 수 있는 궁합인가]
[속궁합은 잘 맞는가]
[서로가 서로에게 끌리는 지점]
[결혼으로 가려면 맞춰야 할 것]
[이 관계에서 복이 붙는 지점]
[이 관계에서 조심할 악운]
[계속 만나도 되는 관계인가]
[궁합운 마지막 판정]`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `[결혼운 첫 판정]
[나는 일찍 결혼하는 사주인가 늦게 결혼하는 사주인가]
[결혼운이 강하게 들어오는 시기]
[나와 맞는 배우자]
[피해야 할 배우자]
[배우자의 직업과 생활 분위기]
[결혼하면 돈은 어떻게 되는가]
[결혼 후 실제 생활]
[배우자 가족과의 관계]
[결혼생활에서 가장 많이 부딪히는 것]
[결혼을 결정할 때 봐야 할 기준]
[결혼운 마지막 판정]`;
  }

  // 건강운 V188 구조는 동결한다.
  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return `[건강운 첫 판정]
[내 사주상 몸의 약한 자리]
[몸이 보내는 첫 신호]
[무리하면 먼저 꺾이는 곳]
[인생에서 건강이 흔들리는 고비]
[올해 건강을 조심해야 할 달]
[건강을 망치는 생활 습관]
[건강이 살아나는 생활법]
[음식으로 건강을 지키는 법]
[생활 리듬으로 건강을 지키는 법]
[운동으로 건강을 지키는 법]
[건강운 마지막 판정]`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `[올해운세 첫 판정]
[올해 운의 전체 흐름]
[올해 재물운]
[돈이 들어오는 달과 돈이 새는 달]
[올해 직장운]
[올해 사업운]
[일이 가장 크게 움직이는 달]
[올해 연애운]
[올해 결혼운]
[인연이 강하게 들어오는 달]
[올해 인간관계운]
[올해 건강운]
[몸과 생활을 조심할 달]
[올해 가장 운이 좋은 달]
[올해 가장 조심해야 할 달]
[올해 반드시 잡아야 할 것]
[올해 반드시 버려야 할 것]
[올해운세 마지막 판정]`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `[내 인생의 큰 대운부터 말하면]
[가장 중요한 대운을 언제 잡아야 하나]
[지금 나는 대운의 어디에 있나]
[인생대운 첫 판정]
[초년운]
[20대 운]
[30대 운]
[40대 운]
[50대 이후 운]
[인생에서 크게 바뀌는 대운]
[가장 중요한 대운]
[돈이 굵어지는 시기]
[일이 바뀌는 시기]
[사람 인연이 바뀌는 시기]
[건강이 흔들리는 시기]
[인생대운 마지막 판정]`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `[평생종합사주 첫 판정]
[내 사주의 핵심 기질]
[내 인생은 빨리 풀리는가, 늦게 풀리는가]
[초년운]
[20대 운]
[30대 운]
[40대 운]
[50대 이후 운]
[평생 먹고살 일]
[돈이 붙는 방식과 돈그릇]
[사랑과 결혼에서 반복되는 패턴]
[사람복과 악연]
[가족과 거리감]
[건강에서 조심해야 할 자리]
[인생에서 건강이 흔들리는 고비]
[인생에서 크게 조심해야 할 고비]
[인생에서 크게 열리는 대운]
[말년운]
[평생종합 마지막 판정]`;
  }

  if (categoryId === "premium" || categoryId === "worry" || title.includes("고민") || title.includes("프리미엄")) {
    return `[질문에 대한 답부터 말하면]
[왜 지금 이 고민이 생겼는가]
[이 선택을 밀면 생기는 일]
[기다리면 보이는 것]
[지금 가장 위험한 선택]
[지금 가장 먼저 해야 할 선택]
[앞으로 3개월]
[앞으로 1년]
[움직여야 할 시기]
[내 고민 상담 마지막 판정]`;
  }

  return `[첫 판정]
[왜 이런 판정인가]
[움직이는 시기]
[현실에서 나타나는 장면]
[지금 해야 할 것]
[마지막 판정]`;
}

function getAllowedPreviewSectionTitles(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";

  if (categoryId === "today" || title.includes("오늘")) {
    return `[오늘의 첫 장면]
[오늘 가장 강한 시간]
[오늘 조심할 한 가지]
[전체 리포트에서 열리는 답]`;
  }
  if (categoryId === "money" || title.includes("재물")) {
    return `[돈그릇 공개]
[그런데 문제가 하나 있다]
[네 돈을 막는 첫 번째 구멍]
[가장 큰 돈이 움직이는 때]
[그럼 이 돈을 어떻게 내 것으로 만드나]
[무료 마지막 판정]`;
  }
  if (isCareerCategory(categoryId, title) || title.includes("일·사업")) {
    return `[일 그릇 공개]
[직장과 사업, 어느 쪽이 더 강한가]
[네 일이 막히는 첫 번째 이유]
[일이 크게 움직이는 때]
[그럼 어떤 일을 잡아야 하나]
[무료 마지막 판정]`;
  }
  if (categoryId === "love" || title.includes("연애")) {
    return `[내 연애의 첫 판정]
[내가 눈이 가는 사람]
[그런데 오래 갈 사람은 다르다]
[인연이 움직이는 때]
[그럼 어떤 사람을 잡아야 하나]
[무료 마지막 판정]`;
  }
  if (isCompatibilityCategory(categoryId, title) || title.includes("궁합")) {
    return `[두 사람의 첫 판정]
[둘 사이에서 가장 강한 끌림]
[그런데 부딪히는 한 가지]
[연애와 결혼은 점수가 다르다]
[끝까지 가려면 무엇을 봐야 하나]
[무료 마지막 판정]`;
  }
  if (categoryId === "marriage" || title.includes("결혼")) {
    return `[내 결혼의 첫 판정]
[같이 살면 편한 사람]
[결혼하면 힘들어지는 한 가지]
[결혼운이 움직이는 때]
[그럼 누구를 골라야 하나]
[무료 마지막 판정]`;
  }
  // 건강운 무료 구조는 기존 동결.
  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return `[몸이 먼저 보내는 신호]
[무리하면 꺼지는 자리]
[전체 리포트에서 열리는 답]`;
  }
  if (isMonthlyCategory(categoryId, title)) {
    return `[올해의 첫 판정]
[올해 가장 좋은 한 달]
[올해 가장 조심할 한 달]
[돈·일·사람 중 가장 크게 움직이는 것]
[그럼 올해 무엇을 잡아야 하나]
[무료 마지막 판정]`;
  }
  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `[내 인생 곡선의 첫 판정]
[첫 번째 상승 구간]
[가장 큰 기회 구간]
[조심해야 할 전환 구간]
[그럼 지금 나는 어디에 있나]
[무료 마지막 판정]`;
  }
  if (categoryId === "traditional" || title.includes("평생")) {
    return `[내 인생의 첫 판정]
[평생 가장 강한 복]
[평생 가장 약한 구멍]
[인생이 크게 바뀌는 때]
[그럼 내 인생은 어디에서 커지나]
[무료 마지막 판정]`;
  }
  if (isWorryCategoryV112(categoryId, title)) {
    return `[도훈의 첫 판정]
[지금 가장 먼저 봐야 할 것]
[무료에서 여기까지만]
[전체 상담에서 열리는 답]`;
  }
  return `[첫 판정]
[가장 중요한 한 가지]
[움직이는 시기]
[전체 리포트에서 열리는 답]`;
}
function buildPreviewPrompt(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
  fixedConclusionText: string;
  profileText: string;
  manse?: any;
}) {
  const {
    user,
    categoryId,
    categoryTitle,
    question,
    manseText,
    fixedConclusionText,
    profileText,
    manse,
  } = params;
  const safeProfileText = makeInternalReferenceText(profileText);
  const safeCategoryGuide = getCategoryGuide(categoryId, categoryTitle);
  const personalFingerprint = getPersonalStoryFingerprint(
    manse || manseText,
    categoryId,
    categoryTitle,
  );
  return `
역할: 너는 소름사주의 사주풀이 도훈이다.
말투: 친한 형이 앞에서 바로 사주를 찍어주는 말투. 존댓말, 보고서체, AI 설명체 금지.

사용자 입력:
${buildUserInfoText(user)}

만세력과 고정 기준:
${makeInternalReferenceText(manseText)}

고객에게 보여줄 고정 결론:
${fixedConclusionText}

카테고리 내부 프로필:
${safeProfileText}

카테고리 작성 규칙:
${safeCategoryGuide}

오늘운세 날짜/요일/사람관계 규칙:
${getTodayRuntimeGuide(user, categoryId, categoryTitle)}

개인화 참고:
${personalFingerprint}


선택 카테고리: ${getEffectiveCategoryTitle(categoryId, categoryTitle, user)}
사용자 질문: ${question || "없음"}

무료 결과는 정확히 아래 제목만 사용한다.
${getAllowedPreviewSectionTitles(categoryId, categoryTitle)}

무료 작성 규칙:
- 무료는 답을 다 열지 않는다.
- 건강운을 제외한 모든 카테고리는 재물운과 같은 궁금증 구조를 따른다: 개인 판정 공개 → 숫자/유형/시기 중 강한 결과 하나 공개 → 반전 또는 약점 하나 공개 → 중요한 시기 하나 공개 → "그래서 어떻게 해야 하는가" 직전에 잠근다.
- 무료에서 이미 공개한 문장을 전체 리포트에서 다시 길게 낭독하지 않는다.
- 무료는 누구에게나 맞는 일반론보다 이 사람의 profile 계산값을 먼저 보여준다.
- "전체 리포트에서 공개"만 반복하지 말고, 잠그기 전에 반드시 개인별로 놀랄 만한 결과 하나를 실제로 공개한다.
- 선택 카테고리 하나만 쓴다.
- 가장 궁금한 것, 반복귀신, 전생, 다른 카테고리 이야기는 쓰지 않는다.
- 첫 문장은 고정 결론과 같은 뜻으로 시작한다.
- 조언하지 말고 판정한다.
- 재물운 무료에서는 무엇으로 돈 버는지 공개하지 않는다.
- 궁합운 무료에서는 궁합 점수를 공개하지 않는다.
- 오늘운세 무료에서는 오늘 말·돈·사람·몸 중 먼저 꼬이는 축만 말한다. 장기 시기 금지.
- 오늘운세 무료도 오늘 날짜와 요일을 반영한다. 주말이면 평일 직장 장면을 쓰지 않는다. 관계상태를 임의로 가정하지 말고 연락·가까운 사람·가족·지인·업무관계처럼 현재 하루에 실제로 나타날 사람운만 판정한다.
- 중요한 판정 1~2개는 줄 앞에 | 를 붙인다.
- 문단 사이에는 빈 줄을 넣는다.
- 길이 1200~2000자.

전체 리포트에서 이어지는 핵심:
${getPreviewTease(categoryId, categoryTitle)}
`;
}

function isPremiumMoneyQuestion(question: string) {
  const q = String(question || "");
  return /(돈|재물|부자|수익|매출|사업자금|부업|벌고|벌어|많이 벌|재물운|투자|장사|판매|월급|소득)/.test(
    q,
  );
}

function isPremiumCareerQuestion(question: string) {
  const q = String(question || "");
  return /(일|직업|사업|창업|부업|이직|퇴사|회사|직장|장사|무슨 일을|뭘 해야|커리어)/.test(
    q,
  );
}

function isPremiumLoveQuestion(question: string) {
  const q = String(question || "");
  return /(연애|결혼|사랑|인연|재회|상대|남자|여자|배우자|궁합|만나|헤어|계속)/.test(
    q,
  );
}

function getPremiumQuestionSpecificStructure(
  categoryId: CategoryId,
  categoryTitle: string,
  question: string,
) {
  const title = categoryTitle || "";
  if (
    !(
      categoryId === "premium" ||
      categoryId === "worry" ||
      title.includes("내 고민") ||
      title.includes("고민") ||
      title.includes("프리미엄")
    )
  )
    return "";

  const q = String(question || "").trim();
  const money = isPremiumMoneyQuestion(q);
  const career = isPremiumCareerQuestion(q);
  const love = isPremiumLoveQuestion(q);
  const health = /건강|몸|아프|피로|잠|수면|소화|위|장|병원|스트레스|컨디션|운동|음식/.test(q);
  const family = /가족|부모|엄마|아빠|형제|자식|자녀|집안|가정/.test(q);

  if (money) {
    return `[질문에 대한 답부터 말하면]
[이 질문을 돈으로만 보면 어디가 틀어지는가]
[내 사주에서 재물운이 먼저 보는 자리]
[돈이 붙는 직업과 사업]
[피해야 할 직업과 돈길]
[지금 밀어붙이면 생기는 일]
[멈추거나 기다리면 보이는 것]
[돈이 쌓이기 시작하는 시기]
[앞으로 3개월 조심할 것]
[앞으로 1년 잡아야 할 것]
[지금 해야 할 선택]
[피해야 할 선택]
[내 고민 상담 마지막 판정]`;
  }

  if (career) {
    return `[질문에 대한 답부터 말하면]
[이 질문을 일로만 보면 어디가 틀어지는가]
[내 사주에서 일운이 먼저 보는 자리]
[맞는 직업군과 맞는 일 방식]
[사업을 한다면 가능한 판과 피해야 할 판]
[지금 밀어붙이면 생기는 일]
[멈추거나 기다리면 보이는 것]
[일이 바뀌기 좋은 시기]
[앞으로 3개월 조심할 것]
[앞으로 1년 잡아야 할 것]
[지금 해야 할 선택]
[피해야 할 선택]
[내 고민 상담 마지막 판정]`;
  }

  if (love) {
    return `[질문에 대한 답부터 말하면]
[이 질문을 감정으로만 보면 어디가 틀어지는가]
[내 사주에서 인연운이 먼저 보는 자리]
[상대와의 관계에서 끌리는 지점]
[상대와의 관계에서 어긋나는 지점]
[지금 밀어붙이면 생기는 일]
[멈추거나 기다리면 보이는 것]
[인연이 움직이는 시기]
[앞으로 3개월 조심할 것]
[앞으로 1년 잡아야 할 것]
[지금 해야 할 선택]
[피해야 할 선택]
[내 고민 상담 마지막 판정]`;
  }

  if (health) {
    return `[질문에 대한 답부터 말하면]
[이 질문을 병명으로만 보면 어디가 틀어지는가]
[내 사주에서 건강운이 먼저 보는 자리]
[몸이 보내는 첫 신호]
[음식·수면·운동에서 지켜야 할 것]
[지금 계속 무리하면 생기는 일]
[멈추거나 쉬면 보이는 것]
[건강이 흔들리기 쉬운 시기]
[앞으로 3개월 조심할 것]
[앞으로 1년 잡아야 할 것]
[지금 해야 할 선택]
[피해야 할 선택]
[내 고민 상담 마지막 판정]`;
  }

  if (family) {
    return `[질문에 대한 답부터 말하면]
[이 질문을 가족 감정으로만 보면 어디가 틀어지는가]
[내 사주에서 가족운이 먼저 보는 자리]
[가까워져야 할 사람과 거리를 둬야 할 사람]
[돈·책임·말투에서 꼬이는 지점]
[지금 밀어붙이면 생기는 일]
[멈추거나 기다리면 보이는 것]
[가족 문제가 움직이는 시기]
[앞으로 3개월 조심할 것]
[앞으로 1년 잡아야 할 것]
[지금 해야 할 선택]
[피해야 할 선택]
[내 고민 상담 마지막 판정]`;
  }

  return `[질문에 대한 답부터 말하면]
[이 질문을 겉으로만 보면 어디가 틀어지는가]
[내 사주에서 먼저 걸리는 자리]
[돈·일·사람·몸 중 진짜 막힌 축]
[지금 밀어붙이면 생기는 일]
[멈추거나 기다리면 보이는 것]
[이 고민이 반복되는 이유]
[인생 전체에서 이 문제가 움직이는 시기]
[앞으로 3개월 조심할 것]
[앞으로 1년 잡아야 할 것]
[지금 해야 할 선택]
[피해야 할 선택]
[내 고민 상담 마지막 판정]`;
}

function getPremiumQuestionSpecificGuide(
  categoryId: CategoryId,
  categoryTitle: string,
  question: string,
) {
  const title = categoryTitle || "";
  if (
    !(
      categoryId === "premium" ||
      title.includes("내 고민") ||
      title.includes("프리미엄")
    )
  )
    return "";

  const common = `
[내 고민 상담 20,000자 유료 전용 규칙 v119]
- 내 고민 상담는 무료 미리보기를 만들지 않는다. 유료에서만 길게 답한다.
- 이 메뉴는 평생종합사주도 아니고 재물운·직업운·연애운을 섞은 잡탕도 아니다. 질문 하나를 전체 사주 위에 올려놓고 그 질문에만 답한다.
- 사용자가 무엇을 물었든 첫 제목에서 바로 결론을 찍어라. "된다/안 된다/기다려라/작게 해라/멈춰라/조건부로 해라" 중 하나로 시작한다.
- 질문을 다시 길게 설명하지 말고, 질문 속 핵심 갈림길을 잡아라. 예: 퇴사 질문이면 직장운 전체가 아니라 지금 나가도 되는지, 버텨야 하는지, 준비가 먼저인지 판정한다.
- 질문이 돈이면 돈을 중심에 두고 일·사람·건강은 보조 근거로만 쓴다.
- 질문이 일이면 일의 자리와 돈 받는 방식만 판다. 연애·건강·가족 이야기를 억지로 늘리지 않는다.
- 질문이 연애·결혼이면 상대, 속도, 생활 기준, 돈 기준, 가족 거리만 판다. 재물운 전체나 평생 직업운으로 새지 않는다.
- 질문이 건강이면 병명 단정 금지. 음식, 수면, 생활 리듬, 운동, 실제 검진 문장까지 넣는다.
- 질문이 섞여 있으면 가장 먼저 손해가 큰 축 하나를 골라라. 돈인지, 일인지, 사람인지, 몸인지 먼저 자르고 그 축을 기준으로 풀이한다.

[분량 규칙]
- 전체 본문 최소 20,000자 이상을 목표로 쓴다.
- 제목은 12~13개를 사용한다.
- 각 제목마다 최소 6문단 이상 쓴다.
- 각 문단은 2~4문장으로 쓴다.
- 한 제목당 1,500~2,200자 정도로 쓴다.
- 같은 말을 반복해 분량을 채우지 마라. 각 제목은 서로 다른 질문에 답해야 한다.

[각 제목 안에 반드시 들어갈 것]
1. 판정: 지금 밀지, 멈출지, 기다릴지, 작게 해볼지 바로 말한다.
2. 사주 근거: 오행·십성 단어를 앞세우지 말고 현실 언어로 왜 그렇게 보는지 말한다.
3. 지금 상황 포착: 사용자가 지금 어떤 생각을 하고 있을지 찔러라.
4. 현실 장면: 이 선택을 하면 실제로 무슨 장면이 생기는지 말한다.
5. 시기: 앞으로 3개월, 1년, 인생 전체에서 언제 움직이는지 말한다.
6. 잡을 것: 지금 붙잡아야 할 사람, 돈, 일, 기준, 습관을 말한다.
7. 버릴 것: 피해야 할 사람, 돈, 일, 말, 선택, 습관을 말한다.

[문체 규칙]
- 친한 형이 앞에서 바로 찍는 말투로 쓴다.
- "가능성이 있다", "중요하다", "필요하다", "방향성", "구조", "흐름을 살펴보면" 같은 흐린 말 금지.
- 고객에게 내부 규칙을 설명하지 마라. "무료에서는", "유료에서는", "사용자 질문 기준", "출력 구조" 같은 말 금지.
- 질문값이 비었다는 개발자 문구 금지. 질문이 들어왔다는 전제로 답한다.
- 무조건 좋은 말 금지. 좋은 점, 막히는 점, 지금 하면 터지는 점을 같이 말한다.
- 마지막 판정은 한 줄로 끝내지 말고, 질문에 대한 최종 선택 기준을 다시 박아라.
`;

  if (isPremiumMoneyQuestion(question)) {
    return (
      common +
      `
[내 고민 상담 - 돈 많이 벌고 싶은 질문 전용 v58]
사용자 질문이 돈을 많이 벌고 싶다는 뜻이면 반드시 아래를 구체적으로 답해라.

1. 첫 챕터에서 바로 답한다.
- "재물운은 있다/약하다"로 흐리지 말고 등급을 말한다.
- "너는 돈을 크게 벌려면 무엇을 해야 하는지"를 첫 부분에 바로 말한다.
- 예: "너는 가만히 월급만 기다리는 돈보다, 사람을 만나 조건을 맞추고 물건이나 거래가 오가는 자리에서 돈이 붙는 사주다."

2. 돈이 붙는 인생 시기를 말한다.
- 20대, 30대 초중반, 40대 초중반, 중년 이후를 반드시 나눠라.
- "재물운이 강해지는 시기"를 조건으로 말하지 마라.
- 반드시 몇 살 전후를 말해라.
- 올해 흐름은 몇 월에 돈 이야기가 움직이고, 몇 월에 돈이 새고, 몇 월에 다시 잡히는지 말한다.

3. 뭘 해서 돈을 벌어야 하는지 매우 구체적으로 말한다.
- "기획, 구매, 운영, 관리"처럼 단어만 던지지 마라.
- 실제 돈 버는 장면으로 풀어라.
- 예: 거래처를 잡는 일, 물건이 들어오고 나가는 흐름을 보는 일, 납품·유통·구매 조건을 맞추는 일, 중고/재고/도매 물건의 차익을 보는 일, 현장에서 필요한 물건을 연결하는 일, 사람 부탁이 아니라 계약과 몫이 분명한 판매·중개·대행성 일.
- 사용자가 바로 "아, 이런 일을 말하는구나" 느껴야 한다.

4. 무엇 때문에 돈을 잃는지 구체적으로 말한다.
- 사람 말만 믿고 들어가는 돈.
- 친하다고 돈을 섞는 돈.
- 내 몫이 정해지지 않은 동업.
- 큰 재고와 큰 고정비를 먼저 안는 일.
- 정 때문에 무료로 더 해주는 일.
- 체면 때문에 쓰는 돈.
- 가족이나 지인 부탁에 끌려가는 돈.

5. 노력도 사주식으로 구체적으로 말한다.
- "열심히 해라" 금지.
- "돈 기록해라" 같은 컨설팅식 금지.
- 시기별로 무엇을 해야 하는지 말한다.
- 30대 중반 전후: 돈이 새는 사람과 돈이 붙는 사람을 가르는 눈이 생긴다.
- 40대 초중반 전후: 내 이름과 거래처, 반복해서 찾는 사람, 손에 잡히는 물건 흐름이 돈으로 바뀐다.
- 올해 돈이 움직이는 달: 사람과 물건, 거래 이야기가 들어오는 때다.
- 올해 돈이 새는 달: 지인·동업·급한 투자·큰 재고를 조심하는 때다.

6. 도훈 말투는 이렇게 써라.
- "자, 돈 많이 벌고 싶다 했제. 그럼 예쁜 말 말고 돈 붙는 자리부터 봐야 된다."
- "너는 돈을 못 벌 사주가 아니다. 근데 아무 돈이나 잡으면 새는 사주다."
- "네 돈은 사람을 만나고, 조건을 맞추고, 물건이나 거래의 흐름을 볼 때 붙는다."
- "그냥 열심히 하면 된다, 이런 말은 네 사주에 안 맞다. 너는 어디서 돈이 붙고 어디서 새는지를 갈라야 한다."
- "큰 판부터 벌리는 돈은 복보다 부담이 먼저 붙는다."
- "네가 잡아야 할 건 사람과 물건의 흐름에서 남는 돈이 남는 돈이다."
`
    );
  }


  if (categoryId === "today" || title.includes("오늘")) {
    return common + `

[오늘운세 v71 전용 장면 - 예전 장면 금지]
오늘운세는 예전처럼 재물운·일운·인연운·건강운을 항목별로 나열하는 메뉴가 아니다.
오늘 하루 안에서 실제로 벌어질 수 있는 장면을 찍어라.

무료 오늘운세:
- 오늘 전체 답을 다 열지 않는다.
- 오늘 말, 돈, 사람, 몸 중 어디서 먼저 꼬이는지만 보여준다.
- 정확한 시간대와 구체 행동은 유료에서 연다고 말한다.
- 전생, 대운, 올해 몇 월, 30대, 40대, 평생 이야기는 금지다.

유료 오늘운세:
반드시 아래 내용을 현실 장면으로 넣는다.
1. 오늘 첫 판정
2. 오늘 돈 쓰면 안 되는 자리
3. 오늘 말조심할 사람
4. 오늘 미뤄야 할 일
5. 오늘 몸이 무거워지는 순간
6. 오전·오후·저녁 중 조심할 때
7. 오늘 잡을 것과 버릴 것
8. 오늘 마지막 판정

오늘운세 금지:
- 오늘 나온 재물운·일운·인연운·건강운을 한 번에 묶어라 같은 예전 문장
- 장기 시기
- 나이대
- 올해 몇 월
- 대운
- 전생
- 반복귀신
- 방향
- 흐름
- 구조
- 기준
- 중요하다
- 필요하다
- 관리해야 한다

오늘운세 문체 예시:
"자, 오늘은 말부터 줄여야 된다. 오전에는 급하게 답하면 말꼬리가 잡히고, 오후에는 작은 돈이 기분 따라 나가기 쉽다. 저녁에는 몸이 무거워지니 약속을 늘리면 피곤만 남는다. 오늘은 새로 벌리는 날이 아니라 말, 돈, 약속을 줄이는 날이다."
`;
  }

  return common;
}

function getFullReportStructure(categoryId: CategoryId, categoryTitle: string) {
  return `[출력 구조]\n${getAllowedFullSectionTitles(categoryId, categoryTitle)}`;
}

function cleanGeneratedText(text: string) {
  let source = text || "";

  const hardForbiddenPhrases = [
    "그래서 이 운은 이렇게 결론난다.",
    "그래서 이 운은 이렇게 결론난다",
    "이 운은 이렇게 결론난다.",
    "이 운은 이렇게 결론난다",
    "그래서 이 운은",
    "도훈이 딱 보면 이렇다.",
    "도훈이 딱 보면 이렇다",
    "능력과 경험이 빛을 발하게 될 거야",
    "능력과 경험이 빛을 발",
    "가능성이 높아",
    "가능성이 높다",
    "중요하다는 결론이야",
    "중요하다는 결론이다",
    "너는 어떤 사주다:",
    "언제 운이 움직인다:",
    "무엇으로 복이 붙는다:",
    "무엇 때문에 악운이 붙는다:",
    "그래서 이 카테고리의 최종 판정이 무엇인지:",
    "이 카테고리의 최종 판정이 무엇인지:",
    "돈을 다룰 때는",
    "좋은 흐름이 이어질 거야",
    "가능성이 높아",
    "자식 인연은 있을 .",
    "자식 인연은 있을.",
    "자식 인연은 있을 ",
    "잘 조율하면",
    "좋은 흐름을 이어가",
    "좋은 흐름이 이어진다",
    "현실적으로 말하면",
    "네가 원하는 방향으로 나아갈 수 있을 거야",
    "네가 원하는 방향으로 나아갈 수 있다",
    "흐름을 잘 살펴보면",
    "이 흐름을 잘 살펴보면",
    "기회가 생길 거야",
    "기회가 생길 수 있어",
    "기회를 놓치기 쉬워",
    "상대가 원하는 사람은 고정 문장으로 찍으면 틀린다.",
    "상대 사주를 기준으로 봐야 한다.",
    "유료에서는 네가 그 취향에 맞는지, 아니면 어긋나는지까지 바로 가른다.",
    "무료에서는 여기까지만 본다.",
    "결제하면 자세히 나온다.",
    "외식·매장·서비스업으로 굴리는 돈",
  ];

  for (const phrase of hardForbiddenPhrases) {
    source = source.split(phrase).join("");
  }

  source = source
    .replace(/외식, 매장, 의류 같은 세부 업종은 여기서 바로 1순위로 박지 않고, 사업 세부 판정에서 따로 본다\.?/g, "")
    .replace(/세부 업종은.*?따로 본다\.?/g, "")
    .replace(/사용자가 말한 업종[^\n.]*[.\n]?/g, "")
    .replace(/후보군일 뿐[^\n.]*[.\n]?/g, "")
    .replace(/보조축/g, "같이 붙는 길")
    .replace(/확장축/g, "넓어지는 길")
    .replace(
      /사람과의 관계에서 잘 맞는 사람과 조건을 맞추는 일이\s*[.。]?/g,
      "사람과 조건을 맞추는 일에서 운이 붙는다.",
    )
    .replace(
      /사람과 조건을 맞추는 일이\s*[.。]?/g,
      "사람과 조건을 맞추는 일에서 운이 붙는다.",
    )
    .replace(
      /물건 흐름을 보고, 사람과 조건을 맞추는 일이\s*[.。]?/g,
      "물건 흐름을 보고 사람과 조건을 맞추는 일에서 돈이 붙는다.",
    )
    .replace(
      /거래처나 사람과의 조건을 잘 맞추는 일이 흐름이다[.。]?/g,
      "거래처를 잡고, 물건이나 일의 조건을 맞추는 자리에서 돈이 붙는다.",
    )
    .replace(
      /사람과의 관계에서 조건을 맞추는 일이 흐름이다[.。]?/g,
      "사람과 조건을 맞추는 자리에서 돈이 붙는다.",
    )
    .replace(
      /([가-힣]+복이)\s*[.。](?=\s|$)/g,
      "$1 끊기지 않고 이어지는 흐름이다.",
    )
    .replace(
      /([가-힣]+는|[가-힣]+은|[가-힣]+이|[가-힣]+가)\s*[.。](?=\s|$)/g,
      "$1 흐름이다.",
    )
    .replace(/\n{3,}/g, "\n\n");

  source = source
    .replace(/^\s*너는 어떤 사주다\s*[:：]\s*/gm, "")
    .replace(/^\s*언제 운이 움직인다\s*[:：]\s*/gm, "")
    .replace(/^\s*무엇으로 복이 붙는다\s*[:：]\s*/gm, "")
    .replace(/^\s*무엇 때문에 악운이 붙는다\s*[:：]\s*/gm, "")
    .replace(/^\s*그래서 이 카테고리의 최종 판정이 무엇인지\s*[:：]\s*/gm, "")
    .replace(/^\s*이 카테고리의 최종 판정이 무엇인지\s*[:：]\s*/gm, "")
    .replace(/돈을 다룰 때는\s*/g, "")
    .replace(/이라는 걸 잊지 말아야 해/g, "이다")
    .replace(/라는 걸 잊지 말아야 해/g, "다")
    .replace(/을 잊지 말아야 해/g, "을 봐야 한다")
    .replace(/를 잊지 말아야 해/g, "를 봐야 한다")
    .replace(
      /자식 인연은 있을\s*[\.。]?/g,
      "자식 인연은 아주 끊긴 흐름으로 보지는 않는다",
    )
    .replace(/좋은 흐름이 이어질 거야/g, "복으로 붙는 흐름이 있다")
    .replace(/좋은 흐름이 이어진다/g, "복으로 붙는 흐름이다")
    .replace(/좋은 흐름을 이어가[^.\n。]*[.。]?/g, "")
    .replace(/잘 조율하면[^.\n。]*[.。]?/g, "선을 제대로 잡아야 복으로 붙는다.")
    .replace(/도움이 될 거야/g, "맞는 흐름이다")
    .replace(/\n{3,}/g, "\n\n");

  // AI가 내부 프롬프트 제목을 본문처럼 따라 쓴 경우, 섹션 단위로 제거한다.
  const internalSectionTitles = [
    "카테고리별 사주 프로필",
    "내부 작성 규칙",
    "내부 규칙",
    "프롬프트",
    "개인화 강제 규칙",
    "무료 결과 작성 지시",
    "전체 리포트 작성 지시",
    "출력 구조",
    "카테고리 세부 참고",
    "당신의 사주형",
    "질문 사용 제한",
  ];

  for (const title of internalSectionTitles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    source = source.replace(
      new RegExp(`\\n?\\[${escaped}\\][\\s\\S]*?(?=\\n\\[[^\\]]+\\]|$)`, "g"),
      "",
    );
  }

  const forbiddenExactIncludes = [
    "AI는 이 결론을 절대 바꾸지 마라",
    "AI는 이 재물운 등급을 절대 바꾸지 마라",
    "AI는 이 건강운 등급을 절대 바꾸지 마라",
    "AI는 이 직업 성향을 절대 바꾸지 마라",
    "AI는 이 궁합 점수와 등급을 절대 바꾸지 마라",
    "AI는 이 가족관계 점수와 등급을 절대 바꾸지 마라",
    "AI는 이 사업파트너 점수와 등급을 절대 바꾸지 마라",
    "첫 문장은 반드시 위 결론과 같은 의미로 시작해라",
    "오늘운세에서는 사주 용어를 첫 문장에 쓰지 마라",
    "오늘운세에서는 인생 전체 조언을 하지 말고",
    "고정 결론과",
    "카테고리 전용 지침",
    "우선 적용해라",
    "결과에 절대 출력하지 마라",
    "출력 금지",
    "결제 유도 문구 금지",
    "다른 제목 추가 금지",
    "마크다운 제목 기호",
    "이 운은 이렇게 결론난다",
    "그래서 이 운은 이렇게 결론난다",
    "도훈이 딱 보면 이렇다",
    "역할이 분명할수록",
    "필요한 자리일수록",
    "기준이 잡히면",
    "흐름을 잡으면",
  ];

  const forbiddenLinePatterns = [
    /^\s*\[?내부.*규칙.*\]?\s*$/,
    /^\s*\[?내부.*출력.*금지.*\]?\s*$/,
    /^\s*\[?프롬프트.*\]?\s*$/,
    /^\s*AI는\s.+(마라|해라)\.?\s*$/,
    /^\s*(너는 어떤 사주다|언제 운이 움직인다|무엇으로 복이 붙는다|무엇 때문에 악운이 붙는다|그래서 이 카테고리의 최종 판정이 무엇인지)\s*[:：]?\s*$/,
    /^\s*첫 문장은 반드시\s.+$/,
    /^\s*(오늘운세|올해운세|내 고민 상담|내 고민 상담|궁합운|가족관계|사업파트너|재물운|직업\/사업운|건강운|자식운|결혼운|연애운|인생대운|평생종합사주)에서는\s.+(마라|해라)\.?\s*$/,
    /^\s*-\s*반드시\s*$/,
    /^\s*-\s*반드시\s.+(마라|해라|써라)\.?\s*$/,
    /^\s*-\s*.*(출력|작성|사용자|만세력|프로필|섹션|제목).*(마라|해라|써라|금지)\.?\s*$/,
    /^\s*-\s*이 카테고리는 공통 문장으로 마무리하지 마라\.?\s*$/,
    /^\s*-\s*사용자의 만세력에서.*$/,
  ];

  const cleanedLines = source
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*#\s*$/gm, "")
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (forbiddenExactIncludes.some((item) => trimmed.includes(item)))
        return false;
      if (
        trimmed.includes("이런 생각이 들 거야") ||
        trimmed.includes("이런 마음이 들 거야") ||
        trimmed.includes("머릿속을 맴돌")
      )
        return false;
      if (
        trimmed === "그래서." ||
        trimmed === "그래서" ||
        trimmed === "결론이다." ||
        trimmed === "결론이야."
      )
        return false;
      if (forbiddenLinePatterns.some((pattern) => pattern.test(trimmed)))
        return false;
      return true;
    })
    .join(NL);

  return cleanedLines
    .replace(/이라는 걸\s*[.。]/g, "이다.")
    .replace(/라는 걸\s*[.。]/g, "다.")
    .replace(/라는 점\s*[.。]/g, "라는 점을 봐야 한다.")
    .replace(/이라는 점\s*[.。]/g, "이라는 점을 봐야 한다.")
    .replace(/([가-힣]+해질)\s*[.。]/g, "$1 흐름이다.")
    .replace(/([가-힣]+될)\s*[.。]/g, "$1 흐름이다.")
    .replace(/([가-힣]+할)\s*[.。]/g, "$1 흐름이다.")
    .replace(/\s+[.。]/g, ".")
    .replace(/\n{4,}/g, NL + NL + NL)
    .replace(
      /\[결론부터 말하면\]\s*\n\s*\[결론부터 말하면\]/g,
      "[결론부터 말하면]",
    )
    .replace(/(결론부터 말하면,\s*[^\n]+)\n\s*\1/g, "$1")
    .trim();
}

function buildForcedSajuAnalysisSection(
  categoryId: CategoryId,
  categoryTitle: string,
  manse: any,
) {
  const title = categoryTitle || "";
  const dayMaster = manse?.dayPillar?.heavenlyStem || manse?.dayStem || "일간";
  const elementCount = manse?.elementCount || manse?.elements || {};
  const entries = Object.entries(elementCount as Record<string, number>).filter(([, v]) => typeof v === "number") as Array<[string, number]>;
  const strongest = entries.sort((a, b) => b[1] - a[1])[0]?.[0] || "강한 기운";
  const weakest = entries.sort((a, b) => a[1] - b[1])[0]?.[0] || "약한 기운";

  if (categoryId === "today" || title.includes("오늘")) {
    return `[오늘 사주상 이유]\n\n오늘운세는 사주 용어를 앞세우는 메뉴가 아니다. 오늘 하루에서 돈, 일, 인연, 몸이 어디서 먼저 움직이는지를 보는 메뉴다.\n\n이 사주는 급하게 말하거나 급하게 돈을 쓰면 먼저 흔들리고, 순서를 나눠 처리하면 오후부터 풀리는 쪽으로 본다. 그래서 오늘은 재물운, 일운, 인연운, 건강운을 따로 보되 한 줄로 나열하지 말고 실제 하루 장면으로 봐야 한다.`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `[내 사주상 분석]\n\n재물운에서 먼저 볼 건 돈이 있느냐 없느냐가 아니다. 이 사주는 돈이 들어오기 전에 먼저 돈이 묶이는 일을 조심해야 한다.\n\n${dayMaster} 기질은 그냥 기다리는 돈보다 직접 필요한 사람을 보고 움직이는 돈에서 살아난다. ${strongest}이 강하게 잡힌 부분은 오래 붙는 돈을 만들 힘이고, ${weakest}이 약한 부분은 남 말만 믿고 들어갈 때 돈이 새는 자리로 본다.\n\n그래서 큰 창업, 무리한 투자, 팔리기도 전에 재고부터 쌓는 일은 맞지 않는다. 필요한 물건이나 서비스를 찾아 넘기고, 다시 찾는 사람이 생기고, 받을 돈이 분명한 일이 맞다.`;
  }

  if (isCareerCategory(categoryId, title)) {
    return `[내 사주상 분석]\n\n일·사업운에서 이 사주는 남이 시킨 일만 오래 처리하는 쪽으로 끝낼 사주가 아니다.\n\n회사에 있어도 사람, 물건, 주문, 판매, 관리처럼 실제 일이 오가는 곳에서 살아난다. 밖으로 나가도 처음부터 크게 벌이는 창업보다 작은 주문, 예약제 서비스, 부업 판매처럼 돈이 실제로 들어오는 일부터 맞다.`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `[내 사주상 분석]

연애운에서는 상대와 비교하는 궁합보다 내가 어떤 사람에게 끌리고, 어떤 사람에게 약해지고, 어떤 사람을 피해야 하는지가 먼저다.

이 사주는 좋아하는 마음만 볼 게 아니다. 연락이 어떻게 꼬이는지, 말투에서 어디서 흔들리는지, 올해 인연이 어느 때 움직이는지를 같이 봐야 한다.`;
  }

  if (isCompatibilityCategory(categoryId, title) || title.includes("궁합")) {
    return `[내 사주상 분석]

궁합운에서는 사주 용어보다 두 사람이 실제로 어떻게 끌리고 어디서 부딪히는지가 먼저다.

이 관계는 처음 끌림만 볼 게 아니다. 서로 어떤 스타일에 끌리는지, 네가 상대 취향에 들어가는지, 상대가 네 취향에 들어오는지, 가까워졌을 때 몸과 마음이 맞는지를 같이 봐야 한다.`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `[내 사주상 분석]\n\n결혼운에서는 설렘보다 생활이 먼저다.\n\n이 사주는 말이 다정한 사람보다 생활이 일정하고, 돈 쓰는 방식이 흐리지 않고, 가족과 부부 사이 선을 아는 사람과 편해진다. 좋아해도 생활이 흐린 사람은 결혼 후 외로움이 먼저 온다.`;
  }

  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return `[내 사주상 분석]\n\n건강운은 병명 맞히기가 아니다. 이 사주는 약해서 바로 무너지는 쪽보다 버티다가 늦게 꺼지는 쪽으로 본다.\n\n잠, 소화, 장, 목·어깨, 피로 중 먼저 무거워지는 곳을 봐야 한다. 무리하면 몸이 먼저 신호를 보낸다.`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `[내 사주상 분석]\n\n올해운세는 1월부터 12월까지 전부 나열하는 메뉴가 아니다.\n\n돈이 움직이는 달, 돈이 새는 달, 일이 살아나는 달, 사람과 몸을 조심할 달을 따로 찍어야 한다.`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `[내 사주상 분석]\n\n인생대운은 평생종합처럼 모든 항목을 한꺼번에 늘어놓는 메뉴가 아니다.\n\n초년, 청년, 중년, 말년에 무엇이 바뀌는지와 돈·일이 붙는 시기를 찍는 메뉴다.`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `[내 사주상 분석]

평생 흐름을 한 판으로 놓고 보면, 이 사주는 현실감과 책임감, 버티는 힘이 먼저 작동한다. 처음부터 모든 길이 쉽게 열리는 구조라기보다 경험이 쌓일수록 사람과 돈을 보는 기준이 선명해지고, 그 판단력이 결국 일과 자산으로 연결되는 쪽이다.

특히 일과 돈은 따로 움직이지 않는다. 어떤 직함을 갖느냐보다 가격·조건·거래·사람을 얼마나 직접 움직일 수 있느냐에 따라 돈의 크기가 달라진다. 그래서 평생 먹고사는 길도 한 직장에 오래 다니는 것만으로 끝나지 않고, 경력과 거래 경험을 자기 단가와 반복 수익으로 바꾸는 과정이 중요하다.

사람과 건강도 같은 흐름 안에서 봐야 한다. 관계에서 책임을 지나치게 떠안으면 돈과 기운이 같이 빠지고, 일에 몰입해 회복 리듬을 놓치면 좋은 운이 들어와도 오래 끌고 가기 어렵다. 결국 평생종합에서는 돈·일·인연·건강이 어느 시기에 함께 움직이는지를 연결해서 봐야 한다.`;
  }

  return `[내 사주상 분석]\n\n이 질문은 그냥 마음 문제로 넘길 일이 아니다. 사주에서 먼저 무너지는 자리와 지금 잡아야 할 선택을 같이 봐야 한다.`;
}

function ensureSajuAnalysisSection(
  text: string,
  categoryId: CategoryId,
  categoryTitle: string,
  manse: any,
) {
  const source = text || "";
  if (categoryId === "today" || (categoryTitle || "").includes("오늘")) return source;
  if (source.includes("[내 사주상 분석]")) return source;

  const section = buildForcedSajuAnalysisSection(
    categoryId,
    categoryTitle,
    manse,
  );
  const firstClose = source.indexOf("]");
  if (firstClose < 0) return `${section}${NL}${NL}${source}`.trim();

  const nextSectionIndex = source.indexOf(`${NL}[`, firstClose + 1);
  if (nextSectionIndex > 0) {
    return `${source.slice(0, nextSectionIndex).trim()}${NL}${NL}${section}${NL}${NL}${source.slice(nextSectionIndex).trim()}`.trim();
  }

  return `${source.trim()}${NL}${NL}${section}`.trim();
}

function getPublicFixedConclusionText(block: string) {
  const withoutTitle = (block || "").replace("[고정 결론]", "").trim();
  const aiIndex = withoutTitle.indexOf("AI는 ");
  const publicPart =
    aiIndex >= 0 ? withoutTitle.slice(0, aiIndex) : withoutTitle;

  return publicPart
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(NL + NL)
    .trim();
}

function getInternalFixedRules(block: string) {
  const withoutTitle = (block || "").replace("[고정 결론]", "").trim();
  const aiIndex = withoutTitle.indexOf("AI는 ");
  if (aiIndex < 0) return "";

  return withoutTitle.slice(aiIndex).trim();
}

function buildSafeFixedConclusionBlock(block: string) {
  const publicPart = getPublicFixedConclusionText(block);
  const internalRules = getInternalFixedRules(block);

  if (!internalRules) {
    return `고객에게 보여줄 고정 결론:
${publicPart}`.trim();
  }

  return `고객에게 보여줄 고정 결론:
${publicPart}

내부 작성 규칙 시작 - 아래 내용은 결과 본문에 절대 쓰지 말고, 의미만 반영한다.
${internalRules}
내부 작성 규칙 끝`.trim();
}


function buildHealthPaidAIContextV186(user: UserInfo, manse: any) {
  const snap = getElementSnapshot(manse);
  const tenGods = getTenGodCounts(manse);
  const wealth = countTenGodGroup(tenGods, ["편재", "정재"]);
  const output = countTenGodGroup(tenGods, ["식신", "상관"]);
  const authority = countTenGodGroup(tenGods, ["편관", "정관"]);
  const resource = countTenGodGroup(tenGods, ["편인", "정인"]);
  const peer = countTenGodGroup(tenGods, ["비견", "겁재"]);

  const health = getHealthProfile(manse);
  const food = getV111HealthFoodGuide(health.type, manse);
  const grade = getHealthGrade(manse);
  const tp = getV85HealthTurningPoints(user, manse);
  const timing = getMoneyTimingText(user, manse);

  const birthKey = [
    user.year,
    user.month,
    user.day,
    user.birthTime || "",
    user.gender || "",
    user.calendar || "",
  ].join("-");

  const rawPillars = {
    yearPillar:
      manse?.yearPillar || manse?.year || manse?.pillars?.year || null,
    monthPillar:
      manse?.monthPillar || manse?.month || manse?.pillars?.month || null,
    dayPillar:
      manse?.dayPillar || manse?.day || manse?.pillars?.day || null,
    hourPillar:
      manse?.hourPillar || manse?.hour || manse?.pillars?.hour || null,
  };

  const seasonal =
    manse?.season ||
    manse?.seasonal ||
    manse?.monthBranch ||
    manse?.wolji ||
    manse?.월지 ||
    null;

  const strength =
    manse?.dayMasterStrength ||
    manse?.strength ||
    manse?.신강신약 ||
    manse?.bodyStrength ||
    null;

  const luck =
    manse?.daeun ||
    manse?.daewoon ||
    manse?.bigLuck ||
    manse?.luckCycles ||
    manse?.대운 ||
    null;

  const annual =
    manse?.annualLuck ||
    manse?.seun ||
    manse?.세운 ||
    null;

  const compact = (value: any, max = 3500) => {
    try {
      const raw = JSON.stringify(value ?? null);
      return raw.length > max ? raw.slice(0, max) + "…" : raw;
    } catch {
      return String(value ?? "");
    }
  };

  return `[건강운 유료 개인화 원국 데이터 v186]
이 블록은 고객용 문장이 아니다. 아래 구조값을 해석해서 이 사람의 건강운을 새로 작성한다.

개인 식별용 출생키: ${birthKey}
일간: ${snap.dayMaster}
원국 4주: ${compact(rawPillars, 1800)}
오행 실제 분포: 목 ${snap.wood} / 화 ${snap.fire} / 토 ${snap.earth} / 금 ${snap.metal} / 수 ${snap.water}
강한 오행: ${snap.strongestElement}
약한 오행: ${snap.weakestElement}
십성 전체값: ${compact(tenGods, 1800)}
십성 묶음: 비겁 ${peer} / 식상 ${output} / 재성 ${wealth} / 관성 ${authority} / 인성 ${resource}
월지·계절 정보: ${compact(seasonal, 900)}
신강·신약 관련값: ${compact(strength, 900)}
대운 관련 원자료: ${compact(luck, 3500)}
세운 관련 원자료: ${compact(annual, 2500)}

건강운 계산 보조값:
- 건강운 등급: ${grade}
- 건강 유형 분류: ${health.type}
- 건강 고비: ${tp.first}~${tp.first + 2}세 / ${tp.second}~${tp.second + 2}세${tp.count >= 3 ? ` / ${tp.third}~${tp.third + 2}세` : ""}${tp.count >= 4 ? ` / ${tp.fourth}세 이후` : ""}
- 올해 주의 달 계산값: ${timing.moneyLeakMonth}월 전후 / ${timing.moneyCatchMonth}월 전후
- 음식 관리 참고값: ${food.fit}
- 줄일 음식 참고값: ${food.reduce}
- 식사 리듬 참고값: ${food.meal}

개인화 판정 규칙:
- health.type 하나만 보고 글을 쓰지 마라. 그것은 보조 분류일 뿐이다.
- 반드시 일간 + 오행 5개 실제 분포 + 강약 차이 + 십성 구조 + 원국 4주 + 가능한 경우 월지/계절·대운·세운을 함께 비교해서 판정한다.
- 같은 건강 등급이나 같은 약한 오행인 두 사람도 원국·십성·오행 비율이 다르면 첫 판정, 먼저 오는 신호, 무리할 때 흔들리는 순서, 생활 습관, 회복법, 음식, 운동, 최종판정을 다르게 써라.
- 출생키가 다른데 결과 핵심문장이 같아지는 것은 실패다.
- 숫자를 고객에게 장황하게 나열하지 말고 '왜 이 사람에게 이런 패턴이 생기는지'의 근거로 사용한다.
- 무료 웹툰 문장이나 오행 비유를 사용하지 마라.
- "목 쪽/화 쪽/수 쪽", "불씨", "물", "바닥", "칼" 같은 비유로 건강을 설명하지 마라.
- 병명·발병을 예언하지 않는다. 수면·피로·식사·소화·긴장·회복·생활 리듬의 경향으로 표현한다.
- 고비와 주의 달은 계산값을 기준으로 하되, 설명은 원국 차이를 반영해 개인별로 새로 쓴다.`;
}

function buildHealthPaidPartPromptV188(params: {
  part: 1 | 2 | 3 | 4;
  user: UserInfo;
  manse: any;
  manseText: string;
}) {
  const facts = buildHealthPaidAIContextV186(params.user, params.manse);

  const common = `
너는 소름사주의 건강운 유료 리포트를 작성한다.
아래 만세력 사실값만 근거로 이 사람에게 맞는 결과를 새로 작성해라.

${facts}

[만세력 원문]
${params.manseText}

[전체 분량 원칙]
- 네 PART를 합쳐 약 5,500~6,500자 정도의 밀도로 읽히게 만든다.
- 길이를 채우기 위한 반복을 절대 하지 않는다.
- 같은 조언을 다른 제목에서 다시 설명하지 않는다.
- 한 섹션에서 이미 설명한 음식·운동·수면 조언을 최종판정에서 재탕하지 않는다.

[고객용 표현 규칙]
- 무료 결과, 웹툰 문장, healthStory, 기존 healthPaidReport를 복사하거나 참고하지 마라.
- "성장과 방향을 잡는 힘", "회복의 불씨", "사람 말 뒤를 읽는 물", "목 쪽", "화 쪽", "수 쪽" 같은 추상 오행 번역어를 고객 문장에 쓰지 마라.
- 목·화·토·금·수를 신체 증상에 기계적으로 치환하지 마라.
- 병명·발병·치료효과를 단정하지 마라.
- 사주상 취약 경향은 수면·피로·소화·긴장·회복속도·생활리듬처럼 체감 가능한 말로 설명한다.
- 판정이 '상'이면 강점을 먼저 분명히 말하고, 약점은 그 강점이 무너지는 조건으로 설명한다. 판정과 본문이 모순되면 안 된다.
- 지정된 대괄호 제목을 정확히 그대로 사용한다.
- 개인 원국 근거는 숫자 나열이 아니라 '왜 이 사람에게 특히 이런 패턴이 잡히는지'를 현실 언어로 1~2회만 설명한다.
`;

  if (params.part === 1) return `${common}
[PART 1 목표: 약 700~1,100자]
다음 네 섹션만 작성한다.

[건강운 첫 판정]
등급과 기본 강점을 먼저 말한다. 약점은 한 문단만 붙인다.

[내 사주상 몸의 약한 자리]
핵심 취약 패턴 2~3개만 현실적인 몸의 반응으로 설명한다. 추상 오행 표현은 금지한다.

[몸이 보내는 첫 신호]
첫 신호 → 반복 신호 → 회복이 늦어지는 신호 순서가 보이게 쓴다.

[무리하면 먼저 꺾이는 곳]
과로했을 때 가장 먼저 흔들리는 생활 기능과 반복 패턴을 설명한다. 앞 문장을 반복하지 마라.`;

  if (params.part === 2) return `${common}
[PART 2 목표: 약 800~1,200자]
다음 두 섹션만 작성한다.

[인생에서 건강이 흔들리는 고비]
- 제공된 건강 고비 나이를 정확히 하나의 기준으로만 사용한다.
- 고비마다 성격을 다르게 쓴다. 같은 '수면·소화·피로' 문장을 나이만 바꿔 반복하지 마라.
- 병을 예언하지 말고 생활환경·과로·회복방식 변화처럼 관리 관점으로 설명한다.
- 현재 나이와 다음 체크 구간을 판단할 수 있게 만든다.

[올해 건강을 조심해야 할 달]
- 주의 달 2개만 각각 따로 설명한다.
- 두 달의 이유와 관리 포인트가 서로 달라야 한다.
- 이 섹션에는 음식 전체 목록, 운동 전체 목록, 평생 생활습관, 최종판정을 절대 넣지 마라.
- 각 달은 2~4문장으로 끝내고 마지막에 '올해 꼭 지킬 것' 한 문장만 둔다.`;

  if (params.part === 3) return `${common}
[PART 3 목표: 약 1,800~2,300자]
다음 다섯 섹션만 작성한다. 정보량은 충분히 유지하되 같은 문장을 반복하지 마라.

[건강을 망치는 생활 습관]
이 사람에게 특히 불리한 반복 습관 3~4개만 구체적으로 설명한다.

[건강이 살아나는 생활법]
가장 먼저 바꿀 행동 3개를 우선순위로 쓴다. 앞의 나쁜 습관을 반대로 말하는 식의 단순 반복은 금지한다.

[음식으로 건강을 지키는 법]
- 맞는 식사 흐름을 한 문단으로 설명한다.
- '잘 맞는 쪽'에 대표 음식 5~8개 정도를 제시한다.
- '줄여야 할 쪽'에 대표 음식·습관 5~8개 정도를 제시한다.
- 같은 음식 목록을 본문에서 두 번 반복하지 마라.
- 치료식처럼 단정하지 마라.

[생활 리듬으로 건강을 지키는 법]
핵심 원칙 1개와 실제 행동 3개 정도로 쓴다. '수면 시간이 핵심' 같은 문장을 반복 출력하지 마라.

[운동으로 건강을 지키는 법]
- 이 사람에게 맞는 운동 방식과 강도·빈도·회복 기준을 설명한다.
- 운동 후보 5~6개가 별점으로 평가될 수 있도록 운동명을 명확히 적는다.
- 모든 사람에게 걷기 5점/고강도 2점을 고정하지 말고 원국에 따라 차이를 둔다.`;

  return `${common}
[PART 4 목표: 약 500~800자]
다음 한 섹션만 작성한다.

[건강운 마지막 판정]
- 앞 PART 내용을 다시 요약하지 마라.
- 최종 건강등급 → 앞으로 건강운을 유지하는 조건 → 현재 나이에서 중요한 관리 방향 → 다음 체크 구간 → 올해 결론 → 마지막 한 문장 순서로 쓴다.
- 음식 목록과 운동 목록은 다시 쓰지 마라.
- '버티다가 꺼지는 몸' 같은 앞선 문장을 그대로 반복하지 마라.
- 이름 뒤 조사를 자연스럽게 쓴다. 예: '이정하는'.`;
}

const HEALTH_PAID_PART_HEADINGS_V188: Record<1 | 2 | 3 | 4, string[]> = {
  1: [
    "[건강운 첫 판정]",
    "[내 사주상 몸의 약한 자리]",
    "[몸이 보내는 첫 신호]",
    "[무리하면 먼저 꺾이는 곳]",
  ],
  2: [
    "[인생에서 건강이 흔들리는 고비]",
    "[올해 건강을 조심해야 할 달]",
  ],
  3: [
    "[건강을 망치는 생활 습관]",
    "[건강이 살아나는 생활법]",
    "[음식으로 건강을 지키는 법]",
    "[생활 리듬으로 건강을 지키는 법]",
    "[운동으로 건강을 지키는 법]",
  ],
  4: ["[건강운 마지막 판정]"],
};

function isValidHealthPaidPartV188(
  part: 1 | 2 | 3 | 4,
  value: string,
) {
  const body = String(value || "").trim();
  const headings = HEALTH_PAID_PART_HEADINGS_V188[part];
  // 짧고 밀도 높은 결과를 살린다. 길이 자체를 품질로 오판하지 않는다.
  const minLengthByPart: Record<1 | 2 | 3 | 4, number> = {
    1: 500,
    2: 500,
    3: 900,
    4: 350,
  };
  return (
    body.length >= minLengthByPart[part] &&
    headings.every((heading) => body.includes(heading))
  );
}

async function generateHealthPaidMultipartV188(params: {
  user: UserInfo;
  manse: any;
  manseText: string;
  fortuneSeed: number;
}) {
  const snap = getElementSnapshot(params.manse);
  const tenGods = getTenGodCounts(params.manse);

  console.log("SOREUM_HEALTH_PERSONALIZATION_INPUT", {
    birth: {
      year: params.user.year,
      month: params.user.month,
      day: params.user.day,
      birthTime: params.user.birthTime || null,
      gender: params.user.gender || null,
      calendar: params.user.calendar || null,
    },
    dayMaster: snap.dayMaster,
    elements: {
      wood: snap.wood,
      fire: snap.fire,
      earth: snap.earth,
      metal: snap.metal,
      water: snap.water,
    },
    strongest: snap.strongestElement,
    weakest: snap.weakestElement,
    tenGods,
    fortuneSeed: params.fortuneSeed,
    fortuneSeedType: typeof params.fortuneSeed,
  });

  const parts = [1, 2, 3, 4] as const;
  const maxTokensByPart: Record<(typeof parts)[number], number> = {
    1: 2600,
    2: 2600,
    3: 3600,
    4: 1800,
  };

  const generateOne = async (part: (typeof parts)[number], attempt: number) => {
    const retryRule =
      attempt === 1
        ? ""
        : `\n\n[재작성 명령]\n직전 응답은 형식 또는 분량 조건을 충족하지 못했다. 지정 제목을 모두 사용하되 같은 설명을 반복하지 말고 핵심 정보만 다시 작성해라.`;

    const partSeed = hashToSeed(
      `${params.fortuneSeed}:health-v188:${part}:attempt:${attempt}`,
    );
    const raw = await generateText(
      buildHealthPaidPartPromptV188({
        part,
        user: params.user,
        manse: params.manse,
        manseText: params.manseText,
      }) + retryRule,
      maxTokensByPart[part],
      partSeed,
    );
    const cleaned = sanitizeHealthCustomerTextV185(String(raw || "").trim());
    const valid = isValidHealthPaidPartV188(part, cleaned);
    console.log("SOREUM_HEALTH_AI_PART", {
      part,
      attempt,
      length: cleaned.length,
      valid,
      preview: cleaned.slice(0, 180),
    });
    return { part, cleaned, valid };
  };

  // 네 PART를 순차 생성하지 않고 동시에 생성한다.
  // 기존 30~60초 체감 지연의 큰 원인이었던 4회 직렬 호출을 제거한다.
  const firstWave = await Promise.all(parts.map((part) => generateOne(part, 1)));
  const byPart = new Map<number, string>();
  const failed: Array<(typeof parts)[number]> = [];

  for (const row of firstWave) {
    if (row.valid) byPart.set(row.part, row.cleaned);
    else failed.push(row.part);
  }

  if (failed.length) {
    const retryWave = await Promise.all(failed.map((part) => generateOne(part, 2)));
    const failedAgain: Array<(typeof parts)[number]> = [];
    for (const row of retryWave) { if (row.valid) byPart.set(row.part, row.cleaned); else failedAgain.push(row.part); }
    if (failedAgain.length) {
      const thirdWave = await Promise.all(failedAgain.map((part) => generateOne(part, 3)));
      for (const row of thirdWave) if (row.valid) byPart.set(row.part, row.cleaned);
    }
  }
  if (parts.some((part) => !byPart.get(part))) {
    console.warn("SOREUM_HEALTH_AI_RECOVERED_WITH_PERSONALIZED_FALLBACK");
    return cleanGeneratedText(buildV85HealthFullReport(params.user, params.manse));
  }

  const chunks = parts.map((part) => byPart.get(part) || "");
  let combined = chunks.join("\n\n").trim();
  const allHeadings = Object.values(HEALTH_PAID_PART_HEADINGS_V188).flat();
  const headingCount = allHeadings.filter((h) => combined.includes(h)).length;

  console.log("SOREUM_HEALTH_AI_MULTIPART", {
    partLengths: chunks.map((v) => v.length),
    headingCount,
    totalLength: combined.length,
    targetBand: "4500-6000",
  });

  if (chunks.some((v) => !v) || headingCount !== allHeadings.length) {
    throw new Error(
      `health paid AI multipart incomplete; chunks=${chunks.filter(Boolean).length}, headings=${headingCount}/${allHeadings.length}`,
    );
  }

  // 너무 짧은 결과만 실패 처리한다. 8천자를 채우기 위해 문장을 덧붙이지 않는다.
  if (combined.length < 3500) {
    throw new Error(`health paid AI report too short; length=${combined.length}`);
  }

  return combined;
}

type PaidLengthRuleV194 = {
  targetMin: number; targetMax: number; hardMin: number; partMin: number; partMaxTokens: number;
};

type YearTotalProfileV199 = {
  overallScore: number;
  moneyScore: number;
  careerScore: number;
  businessScore: number;
  loveScore: number;
  marriageScore: number;
  relationshipScore: number;
  healthScore: number;
  strongestArea: string;
  weakestArea: string;
  bestMonth: string;
  cautionMonth: string;
  moneyMonth: string;
  moneyLeakMonth: string;
  careerMonth: string;
  relationshipMonth: string;
  relationshipWarningMonth: string;
  healthWarningMonth: string;
  action: string;
  avoid: string;
};

function buildYearTotalProfileV199(params: {
  user: UserInfo;
  manse: any;
  fortuneSeed: number;
  baseProfile?: CategoryPreviewProfile | null;
}): YearTotalProfileV199 {
  const { user, manse, fortuneSeed, baseProfile } = params;
  const yearBase =
    baseProfile?.kind === "year"
      ? baseProfile
      : buildCategoryPreviewProfile({
          categoryId: "monthly",
          categoryTitle: "올해운세",
          user,
          manse,
          fortuneSeed,
          scoreVisual: null,
        });

  const wealth = buildWealthProfile(user, manse);
  const careerBase = buildCategoryPreviewProfile({ categoryId: "career", categoryTitle: "일·사업운", user, manse, fortuneSeed, scoreVisual: null });
  const loveBase = buildCategoryPreviewProfile({ categoryId: "love", categoryTitle: "연애운", user, manse, fortuneSeed, scoreVisual: null });
  const healthBase = buildCategoryPreviewProfile({ categoryId: "health", categoryTitle: "건강운", user, manse, fortuneSeed, scoreVisual: null });

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const monthNum = (value: string) => {
    const m = String(value || "").match(/(?:1[0-2]|[1-9])월/);
    return m ? Number(m[0].replace("월", "")) : 0;
  };
  const shiftMonth = (value: string, shift: number) => {
    const n = monthNum(value);
    if (!n) return value || "하반기";
    return `${((n - 1 + shift + 12) % 12) + 1}월`;
  };

  const moneyScore = clamp((wealth.scores.earning + wealth.scores.saving + wealth.scores.growing + wealth.scores.keeping) / 4);
  const careerScore = clamp(careerBase?.kind === "career" ? careerBase.split.office : 70);
  const businessScore = clamp(careerBase?.kind === "career" ? careerBase.split.own : 70);
  const loveScore = clamp(loveBase?.kind === "love" ? loveBase.loveScore : 70);
  const marriageScore = clamp(loveBase?.kind === "love" ? loveBase.marriageScore : 70);
  const relationshipScore = clamp((loveScore + marriageScore) / 2);
  const healthScore = clamp(healthBase?.kind === "health" ? healthBase.overallScore : 70);
  const overallScore = clamp(
    yearBase?.kind === "year"
      ? yearBase.overallScore
      : (moneyScore + careerScore + businessScore + loveScore + marriageScore + relationshipScore + healthScore) / 7,
  );

  const scored = [
    ["재물운", moneyScore],
    ["직장운", careerScore],
    ["사업운", businessScore],
    ["연애운", loveScore],
    ["결혼운", marriageScore],
    ["인간관계운", relationshipScore],
    ["건강운", healthScore],
  ] as Array<[string, number]>;
  const strongestArea = [...scored].sort((a, b) => b[1] - a[1])[0]?.[0] || "재물운";
  const weakestArea = [...scored].sort((a, b) => a[1] - b[1])[0]?.[0] || "건강운";

  const asMonth = (value: unknown, fallback = "5월") => {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= 12) return `${n}월`;
    const text = String(value || "").trim();
    return /(?:1[0-2]|[1-9])월/.test(text) ? text : fallback;
  };
  const bestMonth = yearBase?.kind === "year" ? asMonth(yearBase.bestMonth) : "5월";
  const moneyMonth = yearBase?.kind === "year" ? asMonth(yearBase.moneyMonth, bestMonth) : bestMonth;
  const careerMonth = yearBase?.kind === "year" ? asMonth(yearBase.careerMonth, bestMonth) : bestMonth;
  const relationshipWarningMonth = yearBase?.kind === "year" ? asMonth(yearBase.relationshipWarningMonth, shiftMonth(bestMonth, 3)) : shiftMonth(bestMonth, 3);
  const healthWarningMonth = yearBase?.kind === "year" ? asMonth(yearBase.healthWarningMonth, shiftMonth(bestMonth, 5)) : shiftMonth(bestMonth, 5);

  const cautionMonth = relationshipWarningMonth || healthWarningMonth;
  const moneyLeakMonth = shiftMonth(moneyMonth, 4);
  const relationshipMonth = shiftMonth(relationshipWarningMonth, 6);
  const action = yearBase?.kind === "year" ? yearBase.action : "가장 강한 운을 먼저 밀어라";
  const avoid = yearBase?.kind === "year" ? yearBase.avoid : "약한 운에서 큰 결정을 서두르지 마라";
  return {
    overallScore,
    moneyScore,
    careerScore,
    businessScore,
    loveScore,
    marriageScore,
    relationshipScore,
    healthScore,
    strongestArea,
    weakestArea,
    bestMonth,
    cautionMonth,
    moneyMonth,
    moneyLeakMonth,
    careerMonth,
    relationshipMonth,
    relationshipWarningMonth,
    healthWarningMonth,
    action,
    avoid,
  };
}


function yearAreaAdviceV202(area: string, score: number, strong = true) {
  const high = score >= 78;
  const low = score <= 52;
  const map: Record<string, { strong: string; weak: string }> = {
    "재물운": {
      strong: "돈이 들어오는 힘보다 받아낼 돈·가격·결제조건을 직접 챙길수록 재물운을 크게 쓴다.",
      weak: "수입을 억지로 늘리기보다 새는 돈과 선지출을 막는 것이 먼저다.",
    },
    "직장운": {
      strong: "조직 안에서 역할·책임·결정권이 분명한 자리를 잡을수록 평가가 따라온다.",
      weak: "직함보다 실제 권한을 봐야 한다. 책임만 커지고 결정권이 없는 자리는 피로가 먼저 온다.",
    },
    "사업운": {
      strong: "작은 주문·반복 고객·거래처처럼 이미 반응이 확인되는 판을 키울 때 운을 쓴다.",
      weak: "새 판을 크게 여는 것보다 기존 고객과 현금흐름을 지키는 쪽이 낫다.",
    },
    "연애운": {
      strong: "새로운 인연이든 기존 관계든 연락과 만남을 너무 미루지 않을 때 관계운이 살아난다.",
      weak: "감정 확인을 서두르기보다 말투와 거리 조절이 중요하다.",
    },
    "결혼운": {
      strong: "관계가 있다면 생활·돈·가족 기준을 구체적으로 맞추는 대화가 중요하다.",
      weak: "관계 상태를 떠나 큰 약속을 급하게 정하기보다 생활 기준을 먼저 확인하는 해다.",
    },
    "인간관계운": {
      strong: "필요한 사람과의 연결이 기회로 이어지기 쉽다. 대신 누구와 오래 갈지는 선을 봐야 한다.",
      weak: "부탁과 의리 때문에 내 시간·돈을 내주는 패턴을 줄여야 한다.",
    },
    "건강운": {
      strong: "무리만 줄이면 회복 리듬을 지키기 쉬운 해다. 생활시간을 일정하게 가져가는 것이 중요하다.",
      weak: "몸을 몰아붙이지 말고 수면·식사·피로 누적을 먼저 관리해야 한다.",
    },
  };
  const item = map[area] || { strong: "강한 흐름을 실제 행동으로 연결해야 한다.", weak: "약한 흐름에서 큰 결정을 서두르지 않는 것이 좋다." };
  if (strong) return high ? item.strong : `${item.strong} 다만 점수만 믿고 크게 벌이기보다 확인된 흐름부터 잡아야 한다.`;
  return low ? item.weak : `${item.weak} 완전히 나쁜 운은 아니지만 방심하면 손실이 커질 수 있다.`;
}

function buildYearFullReportV202(params: {
  user: UserInfo;
  manse: any;
  fortuneSeed: number;
  baseProfile?: CategoryPreviewProfile | null;
}) {
  const p = buildYearTotalProfileV199(params);
  const name = getName(params.user);
  const areaScores: Record<string, number> = {
    "재물운": p.moneyScore,
    "직장운": p.careerScore,
    "사업운": p.businessScore,
    "연애운": p.loveScore,
    "결혼운": p.marriageScore,
    "인간관계운": p.relationshipScore,
    "건강운": p.healthScore,
  };
  const strongestScore = areaScores[p.strongestArea] || p.overallScore;
  const weakestScore = areaScores[p.weakestArea] || p.overallScore;
  const career = buildCategoryPreviewProfile({
    categoryId: "career", categoryTitle: "일·사업운",
    user: params.user, manse: params.manse, fortuneSeed: params.fortuneSeed, scoreVisual: null,
  });
  const wealth = buildWealthProfile(params.user, params.manse);
  const love = buildCategoryPreviewProfile({
    categoryId: "love", categoryTitle: "연애운",
    user: params.user, manse: params.manse, fortuneSeed: params.fortuneSeed, scoreVisual: null,
  });
  const snap = getElementSnapshot(params.manse);

  const monthNo = (v: string) => {
    const m=String(v||"").match(/(?:1[0-2]|[1-9])/);
    return m ? Number(m[0]) : 0;
  };
  const monthLabel = (n: number) => `${((n - 1 + 12) % 12) + 1}월`;
  const avoidCollision = (candidate: string, blocked: string[], shift=1) => {
    let n=monthNo(candidate)||5;
    const blockedNums=blocked.map(monthNo).filter(Boolean);
    let guard=0;
    while(blockedNums.includes(n) && guard<12){ n=((n-1+shift+12)%12)+1; guard++; }
    return monthLabel(n);
  };

  // V221: 서로 반대 의미인 달이 같은 달로 겹치지 않게 올해운세 안에서만 정리한다.
  const bestMonth=p.bestMonth;
  const moneyMonth=p.moneyMonth;
  const moneyLeakMonth=avoidCollision(p.moneyLeakMonth,[moneyMonth,bestMonth],1);
  const careerMonth=avoidCollision(p.careerMonth,[p.cautionMonth],1);
  const relationshipMonth=avoidCollision(p.relationshipMonth,[p.relationshipWarningMonth],1);
  const healthWarningMonth=avoidCollision(p.healthWarningMonth,[bestMonth],1);
  const cautionMonth=avoidCollision(p.cautionMonth,[bestMonth],1);

  const careerTop = career?.kind === "career"
    ? [career.top1?.label, career.top2?.label, career.top3?.label].filter(Boolean)
    : [];
  const careerTopText = careerTop.length ? careerTop.join(" · ") : "거래·관리·전문성을 직접 쓰는 일";
  const loveType = love?.kind === "love" ? safeText(love.type, "신중하게 관계를 확인하는 타입") : "신중하게 관계를 확인하는 타입";
  const loveGood = love?.kind === "love" ? safeText(love.good, "말과 행동이 일치하는 사람") : "말과 행동이 일치하는 사람";
  const loveAvoid = love?.kind === "love" ? safeText(love.avoid, "관계를 애매하게 끄는 사람") : "관계를 애매하게 끄는 사람";
  const moneyPrimary = safeText(wealth?.primary, "거래와 현금흐름을 직접 확인하는 일");
  const moneySecondary = safeText(wealth?.secondary, "반복 수입이 남는 구조");

  const strongestMeaning: Record<string,string> = {
    "재물운":"올해는 돈의 액수보다 돈이 실제로 확정되는 과정에서 성과가 난다. 가격·단가·계약조건·입금일을 직접 확인하는 행동이 결과를 만든다.",
    "직장운":"올해는 조직 안에서 역할과 결정권이 커질 때 성과가 난다. 직함보다 실제로 무엇을 결정할 수 있는지가 중요하다.",
    "사업운":"올해는 이미 반응이 확인된 거래·고객·상품을 반복시키는 힘이 강하다. 새 판보다 검증된 판의 회전수를 올리는 해다.",
    "연애운":"올해는 사람을 많이 만나는 것보다 관계가 실제로 이어지는 사람을 골라내는 힘이 강하다.",
    "결혼운":"올해는 감정보다 생활·돈·가족·미래계획을 현실적으로 맞출수록 관계가 깊어진다.",
    "인간관계운":"올해는 필요한 사람과의 연결이 실제 기회로 이어질 수 있다. 사람 수보다 관계의 질이 중요하다.",
    "건강운":"올해는 생활리듬을 안정시키면 회복이 빠르게 따라오는 편이다. 무리의 양보다 회복시간 확보가 중요하다.",
  };
  const weakMeaning: Record<string,string> = {
    "재물운":"돈을 벌 기회가 와도 먼저 빠지는 비용과 회수 시점을 놓치면 체감 수익이 줄어든다.",
    "직장운":"책임은 커지는데 권한이 따라오지 않는 자리가 가장 큰 소모다. 이름 좋은 자리보다 실제 몫을 봐야 한다.",
    "사업운":"크게 벌이는 순간 고정비와 책임이 먼저 붙을 수 있다. 올해는 검증되지 않은 확장을 피해야 한다.",
    "연애운":"상대 마음을 빨리 확인하려 들수록 관계가 부담으로 바뀔 수 있다. 속도 조절이 필요하다.",
    "결혼운":"큰 약속을 먼저 잡고 생활기준을 나중에 맞추면 갈등이 커질 수 있다.",
    "인간관계운":"부탁과 의리 때문에 내 시간·돈을 내주면 관계는 남아도 내 몫이 줄어든다.",
    "건강운":"일정을 몰아넣고 회복을 뒤로 미루는 패턴이 누적되면 생활 전체가 무거워질 수 있다.",
  };

  return `[올해운세 첫 판정]
${name}, 올해는 '${p.strongestArea}은 크게 쓰고 ${p.weakestArea}은 무리하지 않는 해'로 판정한다. 전체 점수는 ${p.overallScore}점이지만, 올해운세에서 중요한 것은 평균점수가 아니다. 실제로 어느 영역에서 일이 생기고, 어느 달에 움직이며, 그때 무엇을 선택해야 하는지가 핵심이다.

가장 강한 축은 ${p.strongestArea} ${strongestScore}점이다. ${strongestMeaning[p.strongestArea] || yearAreaAdviceV202(p.strongestArea,strongestScore,true)}

가장 약한 축은 ${p.weakestArea} ${weakestScore}점이다. ${weakMeaning[p.weakestArea] || yearAreaAdviceV202(p.weakestArea,weakestScore,false)}

올해 기억할 시기는 다섯 개다. 돈은 ${moneyMonth}, 일은 ${careerMonth}, 인연은 ${relationshipMonth}, 생활리듬은 ${healthWarningMonth}, 전체 운의 최고점은 ${bestMonth}이다. 반대로 ${cautionMonth}에는 큰 결론을 급하게 내리지 않는 편이 맞다.

[올해 운의 전체 흐름]
올해는 모든 영역이 같이 올라가는 해가 아니다. 재물 ${p.moneyScore}점, 직장 ${p.careerScore}점, 사업 ${p.businessScore}점, 연애 ${p.loveScore}점, 결혼 ${p.marriageScore}점, 인간관계 ${p.relationshipScore}점, 건강 ${p.healthScore}점으로 힘의 차이가 분명하다.

이 차이를 단순히 '좋다/나쁘다'로 보면 올해운세가 짧아진다. 강한 영역은 실제 사건을 만들 수 있는 곳이고, 약한 영역은 같은 행동을 해도 피로와 손실이 더 크게 남는 곳이다. 그래서 올해는 약한 것을 억지로 평균까지 끌어올리는 것보다 강한 영역에서 결과를 만들고, 약한 영역에서는 조건을 확인하는 방식이 유리하다.

특히 ${p.strongestArea}과 ${p.weakestArea}의 차이가 크다. ${p.strongestArea}에서는 제안·계약·관계·결정처럼 눈에 보이는 결과를 남겨야 하고, ${p.weakestArea}에서는 '남들이 하니까', '좋아 보이니까'라는 이유로 움직이면 안 된다. 올해는 선택의 개수보다 선택의 정확도가 중요하다.

[올해 재물운]
재물운은 ${p.moneyScore}점이다. 올해 돈은 막연한 횡재보다 ${moneyPrimary}에서 움직이는 흐름이 강하다. ${yearAreaAdviceV202("재물운",p.moneyScore,p.moneyScore>=65)}

돈이 붙는 방식도 중요하다. 올해는 가격을 정하고, 받을 돈을 확정하고, 결제조건을 맞추고, 실제 입금일까지 확인하는 과정에서 재물운이 살아난다. 매출이나 계약금액이 커 보여도 회수가 늦거나 먼저 나가는 비용이 크면 체감 재물운은 떨어진다.

특히 ${moneyMonth}에는 돈과 관련된 제안·판매·계약·정산 중 하나가 평소보다 크게 움직이기 쉽다. 이때는 '얼마짜리인가'만 보지 말고 마진, 회수일, 추가비용, 반복 가능성을 같이 봐야 한다. 한 번 크게 버는 것보다 ${moneySecondary}가 만들어지는 선택이 올해 재물운과 더 잘 맞는다.

[돈이 들어오는 달과 돈이 새는 달]
돈이 가장 살아나는 달은 ${moneyMonth}이다. 이미 받을 돈이 있다면 회수와 정산을 앞당기고, 판매나 거래가 있다면 가격과 조건을 분명히 하기 좋은 시기다. 새로운 수입이라면 말로만 가능성이 있는 것보다 주문·계약·입금처럼 숫자로 확인되는 것을 잡아야 한다.

반대로 돈이 새기 쉬운 달은 ${moneyLeakMonth}이다. 이 달의 문제는 '돈이 전혀 안 들어온다'가 아니라 들어오는 돈과 동시에 선지출·부탁·예상 밖 비용이 붙을 수 있다는 데 있다. 특히 사람 때문에 쓰는 돈, 계획에 없던 구매, 회수 시점이 불분명한 선결제는 한 번 더 확인하는 편이 좋다.

${moneyMonth}에는 벌 기회를 잡고, ${moneyLeakMonth}에는 남기는 구조를 지켜라. 이 두 달의 행동이 달라야 올해 재물운 점수가 실제 돈으로 남는다.

[올해 직장운]
직장운은 ${p.careerScore}점이다. 점수가 낮다고 직장에서 무조건 나쁜 일이 생긴다는 뜻은 아니다. 올해는 조직 안에서 '책임과 권한의 균형'이 특히 중요하다는 뜻이다.

${yearAreaAdviceV202("직장운",p.careerScore,p.careerScore>=65)} 일을 더 많이 맡는 것과 자리가 좋아지는 것은 같은 일이 아니다. 업무량은 늘었는데 결정권·보상·평가 기준이 그대로라면 올해는 피로만 커질 수 있다.

반대로 내가 가격·일정·거래처·결과를 직접 판단할 수 있는 역할, 또는 내 이름으로 결과가 남는 역할은 낮은 직장운 안에서도 살릴 수 있다. 올해 직장에서는 '좋은 회사인가'보다 '내가 여기서 무엇을 결정할 수 있는가'를 먼저 봐야 한다.

[올해 사업운]
사업운은 ${p.businessScore}점이다. 올해 사업운의 핵심은 큰 창업이 아니라 '검증된 돈의 문을 반복시키는 것'이다. ${yearAreaAdviceV202("사업운",p.businessScore,p.businessScore>=65)}

일·사업의 적성 축은 ${careerTopText} 쪽을 우선해서 본다. 올해 이 축에서 이미 고객 반응, 거래처 문의, 반복 주문, 소개가 생기고 있다면 그 신호를 키우는 것이 맞다. 반대로 아무 반응도 없는 새 업종에 큰돈을 먼저 넣는 것은 높은 사업운을 잘못 쓰는 방식이다.

사업운이 높을수록 오히려 시작을 크게 할 필요가 없다. 작은 주문 → 반복 주문 → 고정 거래처 → 안정된 현금흐름 순으로 확인하면서 키워야 한다. 올해는 '사업을 하느냐 마느냐'보다 어떤 방식으로 돈이 반복되는지를 확인하는 해다.

[일이 가장 크게 움직이는 달]
일과 사업이 가장 크게 움직이는 달은 ${careerMonth}이다. 이 시기에는 직무변경, 새 역할, 거래처, 계약, 납품, 사업 제안처럼 '내 역할과 돈의 구조가 달라지는 일'이 들어올 수 있다.

직장에 있다면 업무가 늘어나는 제안과 권한이 커지는 제안을 구분해야 한다. 책임만 늘면 받지 않는 쪽이 낫고, 결정권·보상·경력 가치가 같이 커지면 잡을 이유가 있다.

사업이나 부업을 보고 있다면 ${careerMonth}에는 새 아이디어를 만드는 것보다 실제 문의와 주문을 확인해라. 견적을 달라는 사람, 다시 찾는 고객, 소개로 이어지는 거래가 있다면 그쪽이 올해의 실제 사업운이다.

[올해 연애운]
연애운은 ${p.loveScore}점이다. 기본 관계 성향은 '${loveType}' 쪽으로 본다. 올해 연애운은 사람을 많이 만나는가보다 '누가 실제 관계로 남는가'가 중요하다.

잘 맞는 쪽은 ${loveGood}이고, 피해야 할 쪽은 ${loveAvoid}이다. 올해는 첫인상이 강한 사람보다 몇 번을 만나도 태도가 크게 바뀌지 않는 사람을 봐야 한다.

혼자인 경우에는 소개·지인 연결·반복해서 만나는 자리에서 관계가 생길 수 있고, 이미 관계가 있다면 연락량 자체보다 관계 정의와 앞으로의 계획을 얼마나 솔직하게 말할 수 있는지가 중요하다. 관계 상태를 임의로 단정하지 않고 같은 운을 상황에 맞게 해석한다.

[올해 결혼운]
결혼운은 ${p.marriageScore}점이다. 결혼운은 연애운과 다르게 '좋아하는 마음'보다 생활을 함께 묶을 수 있는가를 본다.

올해 관계가 결혼 쪽으로 움직인다면 돈 쓰는 기준, 사는 곳, 가족과의 거리, 일의 우선순위, 혼자 필요한 시간처럼 실제 생활 문제가 먼저 드러난다. 이런 이야기를 피하지 않고 맞춰가는 관계라면 결혼운을 쓸 수 있다.

반대로 관계가 애매한데 날짜나 약속부터 잡는 방식은 맞지 않는다. 결혼 여부와 관계없이 올해는 가까운 사람과 현실 기준이 맞는지를 확인하는 해다. 이미 결혼했다면 같은 흐름은 배우자와 돈·가족·생활 계획을 다시 맞추는 형태로 나타난다.

[인연이 강하게 들어오는 달]
사람과 관계가 가장 크게 움직이는 달은 ${relationshipMonth}이다. 새로운 사람이 들어오는 것만 뜻하지 않는다. 이미 알고 지내던 사람이 다르게 보이거나, 멀어진 관계가 다시 연결되거나, 기존 관계에서 중요한 이야기가 나오는 것도 포함한다.

${relationshipMonth}에는 상대가 나를 얼마나 좋아하는지만 보지 말고 실제 행동을 봐야 한다. 약속을 지키는지, 불편한 이야기를 피하지 않는지, 다음 만남이 자연스럽게 이어지는지가 중요하다.

반대로 ${p.relationshipWarningMonth}에는 말의 뜻을 너무 빨리 단정하거나 감정적으로 관계를 정리하지 않는 편이 좋다. 같은 관계라도 ${relationshipMonth}에는 연결을 만들고, ${p.relationshipWarningMonth}에는 오해를 줄이는 쪽으로 행동해야 한다.

[올해 인간관계운]
인간관계운은 ${p.relationshipScore}점이다. 올해 사람복은 사람 수가 늘어나는 데 있지 않다. 내게 실제 정보를 주는 사람, 거래나 일로 연결되는 사람, 어려울 때 서로 움직일 수 있는 사람을 남기는 것이 중요하다.

특히 부탁을 들어주는 것과 좋은 관계를 만드는 것을 같은 것으로 보면 손해가 생긴다. 시간·돈·책임을 계속 내 쪽에서 부담하는 관계라면 올해는 선을 다시 정해야 한다.

반대로 서로의 몫이 분명하고 필요한 때 도움을 주고받는 관계는 올해 다른 운까지 끌어올릴 수 있다. 재물·사업운이 강한 해일수록 사람관계가 실제 기회로 연결될 수 있으므로 '누구를 많이 아느냐'보다 '누구와 실제 일을 할 수 있느냐'를 봐야 한다.

[올해 건강운]
건강운은 ${p.healthScore}점이다. 올해운세의 건강 파트에서는 질병을 단정하지 않는다. 생활리듬과 회복의 흔들림만 본다.

올해는 바쁜 시기에 수면·식사·휴식 시간을 뒤로 미루면 다른 운까지 같이 떨어질 수 있다. 일이 잘될 때 더 무리하는 패턴을 특히 조심해야 한다. 반대로 일정한 시간에 자고 먹고 쉬는 기본 리듬을 지키면 컨디션의 변동폭을 줄이기 쉽다.

건강운 점수 자체보다 중요한 것은 '언제 무리하기 쉬운가'다. 그래서 아래 ${healthWarningMonth}을 별도로 기억하는 것이 좋다.

[몸과 생활을 조심할 달]
생활리듬을 가장 조심할 달은 ${healthWarningMonth}이다. 이 달에는 일을 몰아서 처리하거나 약속을 연달아 잡는 식으로 회복시간을 없애지 않는 편이 좋다.

특히 해야 할 일이 많아질수록 수면과 식사를 먼저 줄이는 습관이 있다면 순서를 바꿔야 한다. 올해 건강운에서 필요한 것은 특별한 방법보다 '무너지기 전에 회복시간을 확보하는 것'이다.

이 달은 몸에 큰 문제가 생긴다고 단정하는 달이 아니다. 일정·수면·식사·휴식 중 하나가 무너지기 시작하면 바로 원래 리듬으로 돌려놓아야 하는 달이다.

[올해 가장 운이 좋은 달]
올해 전체 흐름이 가장 강하게 열리는 달은 ${bestMonth}이다. 이 달은 단순히 기분 좋은 일이 생기는 달이 아니라, 올해 가장 강한 ${p.strongestArea}을 실제 결과로 바꾸기 좋은 시기다.

${bestMonth}에는 기다리기보다 결과가 남는 행동을 해야 한다. 계약이면 조건을 확정하고, 돈이면 입금과 가격을 확정하고, 일이면 역할을 확정하고, 관계라면 다음 단계의 약속을 잡는 식이다.

다만 최고 달이라고 모든 선택이 맞는 것은 아니다. ${p.weakestArea}과 관련된 큰 결정을 같이 밀어붙이기보다, 강한 영역에 집중해야 한다. 올해 최고 달의 핵심은 '많이 하는 것'이 아니라 '가장 잘 풀리는 것을 확정하는 것'이다.

[올해 가장 조심해야 할 달]
올해 가장 조심해야 할 달은 ${cautionMonth}이다. 이 달은 나쁜 일이 예약되어 있다는 뜻이 아니다. 판단을 서두르면 올해 가장 약한 ${p.weakestArea}의 문제가 크게 느껴질 수 있는 시기다.

${weakMeaning[p.weakestArea] || yearAreaAdviceV202(p.weakestArea,weakestScore,false)}

따라서 ${cautionMonth}에는 큰돈, 큰약속, 직장 이동, 관계 정리처럼 되돌리기 어려운 결정일수록 하루 더 확인하는 편이 좋다. 반대로 이미 조건이 충분히 확인된 일까지 무조건 미룰 필요는 없다. 올해의 주의 달은 '멈추는 달'이 아니라 '확인하고 움직이는 달'이다.

[올해 반드시 잡아야 할 것]
올해 반드시 잡아야 할 것은 '${p.action}'이다. 이 문장을 생활에 적용하면, 강한 운이 들어왔을 때 생각으로 끝내지 말고 결과 하나를 확정하라는 뜻이다.

재물이라면 가격·계약·입금일, 일이라면 역할·권한·보상, 관계라면 다음 약속과 관계의 방향처럼 눈에 보이는 것을 남겨야 한다. 올해는 가능성이 많았다는 기억보다 실제로 무엇을 확정했는지가 중요하다.

특히 ${bestMonth}과 ${moneyMonth}, ${careerMonth}처럼 핵심 달이 왔을 때 평소와 똑같이 보내면 강한 운도 체감하기 어렵다. 그 달에는 한 가지라도 평소보다 분명한 행동을 만들어라.

[올해 반드시 버려야 할 것]
올해 반드시 버려야 할 것은 '${p.avoid}'이다. 약한 운을 억지로 끌어올리려고 강한 운에서 번 힘까지 같이 쓰면 올해의 장점이 사라진다.

특히 검증되지 않은 큰 확장, 책임만 늘어나는 약속, 회수 시점이 없는 돈, 관계를 유지하기 위한 일방적인 희생은 올해 버려야 할 선택이다.

올해는 모든 영역을 완벽하게 만드는 해가 아니다. 잘되는 것을 더 잘되게 만들고, 약한 곳에서는 손실을 줄이는 해다. 이 원칙을 지키면 점수보다 실제 체감 결과가 좋아진다.

[올해운세 마지막 판정]
${name}, 올해의 핵심은 점수가 아니다. 실제 흐름은 이렇게 정리된다.

돈은 ${moneyMonth}에 잡아라. ${moneyLeakMonth}에는 들어오는 돈보다 남는 돈을 확인해라.
일과 사업은 ${careerMonth}에 움직인다. 책임만 늘어나는 자리와 내 권한·몫이 커지는 자리를 구분해라.
인연은 ${relationshipMonth}에 움직이고, ${p.relationshipWarningMonth}에는 말과 감정으로 관계를 성급하게 결론내리지 마라.
생활리듬은 ${healthWarningMonth}에 무너지지 않게 관리해라.
전체 운의 최고점은 ${bestMonth}, 가장 신중해야 할 달은 ${cautionMonth}이다.

결국 올해는 ${p.strongestArea}에서 실제 결과를 만들고 ${p.weakestArea}에서 손실을 막는 사람이 운을 제대로 쓴다. 이것이 올해 전체 흐름의 최종 판정이다.`;
}

function getPaidLengthRuleV194(categoryId: CategoryId): PaidLengthRuleV194 {
  if (categoryId === "today") return { targetMin: 6000, targetMax: 8000, hardMin: 5000, partMin: 900, partMaxTokens: 2800 };
  // 재물운은 기존 생성 안정성을 유지한다.
  if (categoryId === "money") return { targetMin: 7000, targetMax: 9000, hardMin: 5500, partMin: 1000, partMaxTokens: 3200 };
  if (categoryId === "career") return { targetMin: 10000, targetMax: 14000, hardMin: 8000, partMin: 1700, partMaxTokens: 3900 };
  if (categoryId === "love" || categoryId === "marriage") return { targetMin: 10000, targetMax: 13000, hardMin: 8000, partMin: 1600, partMaxTokens: 3700 };
  if (categoryId === "compatibility") return { targetMin: 10000, targetMax: 14000, hardMin: 8500, partMin: 1700, partMaxTokens: 3900 };
  if (categoryId === "monthly") return { targetMin: 10000, targetMax: 13000, hardMin: 8000, partMin: 1600, partMaxTokens: 3700 };
  if (categoryId === "lifeFlow") return { targetMin: 10000, targetMax: 14000, hardMin: 8500, partMin: 1700, partMaxTokens: 3900 };
  if (categoryId === "traditional") return { targetMin: 20000, targetMax: 26000, hardMin: 16000, partMin: 3200, partMaxTokens: 5600 };
  if (categoryId === "premium" || categoryId === "worry") return { targetMin: 20000, targetMax: 26000, hardMin: 16000, partMin: 3200, partMaxTokens: 5600 };
  return { targetMin: 10000, targetMax: 13000, hardMin: 8000, partMin: 1600, partMaxTokens: 3700 };
}

const PAID_REFUSAL_MARKERS_V194 = [
  "죄송하지만", "작성할 수 없습니다", "처리할 수 없습니다", "도와드릴 수 없습니다",
  "요청하신 내용을 작성", "I can't assist", "I cannot assist",
];

function hasPaidRefusalV194(value: string) {
  const body=String(value||"");
  return PAID_REFUSAL_MARKERS_V194.some((marker)=>body.includes(marker));
}

function extractPaidHeadingsV194(categoryId: CategoryId, categoryTitle: string) {
  return Array.from(getAllowedFullSectionTitles(categoryId, categoryTitle).matchAll(/\[[^\]\n]+\]/g),(m)=>m[0]);
}

function splitPaidHeadingsV194(headings: string[]) {
  const groups:string[][]=[[],[],[],[]];
  headings.forEach((heading,index)=>{
    const bucket=Math.min(3,Math.floor((index*4)/Math.max(1,headings.length)));
    groups[bucket].push(heading);
  });
  return groups.filter((group)=>group.length>0);
}

function hasPaidPartStructureV194(value:string, headings:string[]) {
  const body=String(value||"").trim();
  return (
    body.length >= 320 &&
    !hasPaidRefusalV194(body) &&
    headings.every((h)=>body.includes(h))
  );
}

function isValidPaidPartV194(value:string, headings:string[], rule:PaidLengthRuleV194) {
  const body=String(value||"").trim();
  return hasPaidPartStructureV194(body,headings) && body.length>=rule.partMin;
}


function isBadPreviewV1943(value: string) {
  const body=String(value||"").trim();
  return (
    body.length < 220 ||
    hasPaidRefusalV194(body) ||
    /(?:요청|콘텐츠).{0,20}(?:작성|제공|처리).{0,10}(?:어렵|불가|없습니다)/i.test(body)
  );
}

async function generateStablePreviewV1943(params:{
  user:UserInfo; categoryId:CategoryId; categoryTitle:string; question:string; manseText:string;
  fixedConclusionText:string; profileText:string; manse:any; fortuneSeed:number;
}) {
  const prompt=buildPreviewPrompt({
    user:params.user, categoryId:params.categoryId, categoryTitle:params.categoryTitle,
    question:params.question, manseText:params.manseText,
    fixedConclusionText:params.fixedConclusionText, profileText:params.profileText, manse:params.manse,
  });
  const first=await generateText(prompt,getPreviewMaxTokens(params.categoryId),params.fortuneSeed);
  if(!isBadPreviewV1943(first)) return first;

  const retry=await generateText(
    `${prompt}

[재작성]
직전 결과가 지나치게 짧거나 거절문으로 끝났다.
사용자에게 보여줄 무료 사주 결과만 작성해라.
선택한 카테고리의 개인 판정, 숫자·시기·주의점 중 실제 계산된 항목을 빠뜨리지 마라.
사과문·거절문·메타설명은 쓰지 마라.`,
    getPreviewMaxTokens(params.categoryId),
    hashToSeed(`${params.fortuneSeed}:preview-v1943-retry:${params.categoryId}`),
  );
  if(isBadPreviewV1943(retry)) {
    throw new Error(`preview AI invalid: category=${params.categoryId}, length=${String(retry||"").length}`);
  }
  return retry;
}



function withTopicParticleV232(name: string) {
  const value = String(name || "").trim();
  if (!value) return value;
  const last = value.charCodeAt(value.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 ? ((last - 0xac00) % 28) !== 0 : false;
  return `${value}${hasBatchim ? "은" : "는"}`;
}

function resolveLifetimeMoneyBowlV232(detail: any, core?: any) {
  const candidates = [
    detail?.moneyRange,
    detail?.moneyBowl,
    detail?.assetRange,
    core?.first?.moneyRange,
    core?.second?.moneyRange,
    core?.third?.moneyRange,
  ]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean);

  const concrete = candidates.find((v: string) => /\d/.test(v));
  return concrete || "";
}

function stripTraditionalInstructionLeakV232(input: string) {
  let out = String(input || "");

  // Never expose generation/developer instructions as customer fortune content.
  const leakPatterns = [
    /아래 작성 규칙은 내부 생성 규칙이며 결과 본문에 절대 출력하지 않는다\.\s*/g,
    /평생종합에서 직업·재물 파트는 반드시 구체적으로 쓴다\.[^\n]*\n?/g,
    /반드시 직업 1·2·3순위[^\n]*\n?/g,
    /문장은 중간에서 끊지 않는다\.[^\n]*\n?/g,
    /토큰이 부족하면[^\n]*\n?/g,
  ];
  for (const pattern of leakPatterns) out = out.replace(pattern, "");

  return out
    .replace(/([.!?。！？])이 (1순위|두 번째|세 번째|주력|확장|보조)/g, "$1 $2")
    .replace(/\. 역시 함께 조심해야 한다\./g, ".")
    .replace(/은\/는/g, "은")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanTraditionalCustomerTextV230(input: string) {
  return stripTraditionalInstructionLeakV232(String(input || ""))
    .replace(/평생종합에서 직업·재물 파트는 반드시 구체적으로 쓴다\.[\s\S]*?문단과 문장을 완결한다\.\s*/g, "")
    .replace(/건강운은 ('[^']+'으로 본다\.)\s*건강운은 \1/g, "건강운은 $1")
    .replace(/\.이다\./g, ".")
    .replace(/이다\.이다/g, "이다.")
    .replace(/\n{3,}/g, "\\n\\n")
    .trim();
}

async function continueTraditionalPaidIfCutV229(params: {
  text: string;
  user: UserInfo;
  manse: any;
  title: string;
  systemGuide: string;
}) {
  let completed = cleanGeneratedText(params.text || "").trim();
  if (!completed) return completed;

  const looksComplete = (value: string) => {
    const tail = value.trim().slice(-220);
    return /[.!?。！？"”’\]\)]\s*$/.test(tail);
  };

  // 평생종합만: 모델 출력 한계로 문장이 끊겼다면 같은 리포트를 이어서 생성한다.
  // 이미 생성된 본문은 다시 쓰지 않고, 끊긴 마지막 문장부터 자연스럽게 완결한다.
  for (let attempt = 0; attempt < 3 && !looksComplete(completed); attempt += 1) {
    const tailContext = completed.slice(-5000);
    const continuationPrompt = `
${params.title} 리포트의 이어쓰기다.

아래는 이미 사용자에게 제공될 확정 본문의 마지막 부분이다.
기존 내용을 처음부터 반복하거나 요약하지 말고, 끊긴 마지막 문장부터 바로 이어서 완결해라.

[기존 본문 마지막]
${tailContext}

[이어쓰기 규칙]
- 기존 제목과 내용을 다시 쓰지 않는다.
- 끊긴 문장을 먼저 자연스럽게 완성한다.
- 해당 섹션에서 아직 설명해야 할 내용이 남았다면 충분히 이어서 설명한다.
- 새 섹션을 임의로 생략하지 않는다.
- 문장을 임의로 축약하지 않는다.
- 마지막 문장까지 완결된 한국어 문장으로 끝낸다.
- 내부 지시문이나 생성 규칙은 출력하지 않는다.
`.trim();

    const continued = await callOpenAIText({
      system: params.systemGuide,
      user: continuationPrompt,
      maxTokens: 5000,
      temperature: 0.72,
    });

    const cleanContinuation = cleanGeneratedText(continued || "").trim();
    if (!cleanContinuation) break;

    // Prevent accidental full-report restart.
    const restartMarkers = [
      "[평생종합사주 첫 판정]",
      "[내 사주상 분석]",
    ];
    let safeContinuation = cleanContinuation;
    for (const marker of restartMarkers) {
      const restartAt = safeContinuation.indexOf(marker);
      if (restartAt > 0) safeContinuation = safeContinuation.slice(0, restartAt).trim();
      else if (restartAt === 0) safeContinuation = "";
    }
    if (!safeContinuation) break;

    completed = `${completed}\n${safeContinuation}`.trim();
  }

  return completed;
}

async function generateCategoryPaidMultipartV205(params:{
  user:UserInfo;
  categoryId:CategoryId;
  categoryTitle:string;
  question:string;
  manseText:string;
  fixedConclusionText:string;
  profileText:string;
  manse:any;
  fortuneSeed:number;
}) {
  if (params.categoryId === "health") {
    throw new Error("health must use generateHealthPaidMultipartV188");
  }

  const rule = getPaidLengthRuleV194(params.categoryId);
  const headings = extractPaidHeadingsV194(params.categoryId, params.categoryTitle);
  const groups = splitPaidHeadingsV194(headings);

  if (!headings.length || !groups.length) {
    throw new Error(`paid headings missing: ${params.categoryId}`);
  }

  const basePrompt = buildFullPrompt({
    user: params.user,
    categoryId: params.categoryId,
    categoryTitle: params.categoryTitle,
    question: params.question,
    manseText: params.manseText,
    fixedConclusionText: params.fixedConclusionText,
    profileText: params.profileText,
    manse: params.manse,
  });

  const expectedMinPerGroup = Math.max(
    520,
    Math.ceil(rule.hardMin / Math.max(1, groups.length)) - 120,
  );

  type PaidPartResultV195 = {
    partIndex:number;
    text:string;
    structuralValid:boolean;
    strongValid:boolean;
    length:number;
  };

  const buildPartPrompt = (partIndex:number, attempt:number) => {
    const partHeadings = groups[partIndex];
    return `${basePrompt}

[이번 호출에서 작성할 범위]
전체 리포트를 한 번에 작성하지 마라.
아래 제목만, 아래 순서 그대로 작성해라.
${partHeadings.join("\n")}

[출력 규칙]
- 이번 묶음은 한국어 기준 ${expectedMinPerGroup}자 이상 작성한다.
- 지정된 제목을 하나도 빼먹지 마라.
- 각 제목 아래에는 이 사람의 사주 계산값과 연결된 실제 설명을 쓴다.
- 같은 결론을 반복해서 분량을 늘리지 마라.
- 다른 PART 내용을 미리 쓰지 마라.
- "죄송하지만", "작성할 수 없습니다", "처리할 수 없습니다", "도와드릴 수 없습니다" 같은 문장을 쓰지 마라.
- "이 메뉴는", "작성 규칙", "프롬프트", "서버 계산", "profile", "무료에서", "유료에서" 같은 제작 메타 문장을 본문에 쓰지 마라.
${attempt > 1 ? `[재작성 ${attempt - 1}차] 직전 결과의 부족한 제목/분량/거절문 문제를 수정해서 다시 작성해라.` : ""}`;
  };

  const generatePart = async (partIndex:number, attempt:number):Promise<PaidPartResultV195> => {
    const partHeadings = groups[partIndex];
    const raw = await generateText(
      buildPartPrompt(partIndex, attempt),
      rule.partMaxTokens,
      hashToSeed(`${params.fortuneSeed}:paid-v205:${params.categoryId}:${partIndex}:${attempt}`),
    );

    const text = cleanGeneratedText(String(raw || "")).trim();
    const structuralValid =
      text.length >= 280 &&
      !hasPaidRefusalV194(text) &&
      partHeadings.every((heading) => text.includes(heading));

    const strongValid = structuralValid && text.length >= expectedMinPerGroup;

    console.log("SOREUM_PAID_PART_V205", {
      categoryId: params.categoryId,
      part: partIndex + 1,
      attempt,
      length: text.length,
      structuralValid,
      strongValid,
      requiredHeadings: partHeadings.length,
      refusal: hasPaidRefusalV194(text),
    });

    return {
      partIndex,
      text,
      structuralValid,
      strongValid,
      length: text.length,
    };
  };

  const indexes = groups.map((_, index) => index);
  const best = new Map<number, PaidPartResultV195>();

  // 1차: 전부 병렬 생성
  const firstWave = await Promise.all(indexes.map((index) => generatePart(index, 1)));
  firstWave.forEach((row) => best.set(row.partIndex, row));

  // 2차: 구조가 깨졌거나 너무 짧은 묶음만 재생성
  const retryIndexes = indexes.filter((index) => !best.get(index)?.strongValid);
  if (retryIndexes.length) {
    const secondWave = await Promise.all(retryIndexes.map((index) => generatePart(index, 2)));
    for (const row of secondWave) {
      const prev = best.get(row.partIndex);
      const better =
        row.strongValid ||
        (!prev?.structuralValid && row.structuralValid) ||
        (row.structuralValid === prev?.structuralValid && row.length > (prev?.length || 0));

      if (better) best.set(row.partIndex, row);
    }
  }

  // 3차: 제목 누락/거절문 등 구조 실패만 마지막으로 재시도
  const brokenIndexes = indexes.filter((index) => !best.get(index)?.structuralValid);
  if (brokenIndexes.length) {
    const thirdWave = await Promise.all(brokenIndexes.map((index) => generatePart(index, 3)));
    for (const row of thirdWave) {
      const prev = best.get(row.partIndex);
      const better =
        row.structuralValid ||
        row.length > (prev?.length || 0);

      if (better) best.set(row.partIndex, row);
    }
  }

  const chosen = indexes.map((index) => best.get(index));
  const chunks = chosen.map((row) => row?.text || "");
  let combined = chunks.join("\n\n").trim();
  let headingCount = headings.filter((heading) => combined.includes(heading)).length;

  // Today는 긴 본문 전체를 버리지 않고, 누락된 섹션만 계산값 기준으로 복구한다.
  // 5천자 이상 정상 본문에서 제목 몇 개가 빠졌다는 이유로 짧은 fallback으로 내려가는 문제를 막는다.
  if (params.categoryId === "today" && headingCount < headings.length && !hasPaidRefusalV194(combined)) {
    for (let repairAttempt = 1; repairAttempt <= 2; repairAttempt += 1) {
      const missingHeadings = headings.filter((heading) => !combined.includes(heading));
      if (!missingHeadings.length) break;

      const repairPrompt = `${basePrompt}

[오늘운세 누락 섹션 복구]
이미 생성된 전체 리포트를 다시 쓰지 마라.
아래 누락된 제목만 정확한 제목 그대로, 같은 순서로 작성해라.
${missingHeadings.join("\n")}

[중요]
- 각 제목 아래는 이 사람의 오늘 계산값(overallScore/moneyScore/workScore/relationshipScore/healthScore/bestTime/strongestArea/warningArea/doOne/avoidOne)에 맞춰 충분히 깊게 쓴다.
- 제목만 쓰거나 한두 문장으로 끝내지 마라.
- 기존 섹션을 반복하지 마라.
- 내부 지시문, 생성 규칙, 무료/유료 같은 제작 메타 문장을 출력하지 마라.
- 건강은 체력·집중력·피로·수면·식사·생활리듬만 다루고 특정 장기·질환을 만들지 마라.`;

      const repairedRaw = await generateText(
        repairPrompt,
        rule.partMaxTokens,
        hashToSeed(`${params.fortuneSeed}:paid-v206:today-repair:${repairAttempt}`),
      );
      const repaired = cleanGeneratedText(String(repairedRaw || "")).trim();
      const recovered = missingHeadings.filter((heading) => repaired.includes(heading));

      console.log("SOREUM_TODAY_PAID_REPAIR_V206", {
        attempt: repairAttempt,
        missingBefore: missingHeadings.length,
        recovered: recovered.length,
        repairLength: repaired.length,
      });

      if (recovered.length && !hasPaidRefusalV194(repaired)) {
        combined = `${combined}\n\n${repaired}`.trim();
      }
      headingCount = headings.filter((heading) => combined.includes(heading)).length;
    }
  }

  const structurallyComplete =
    headingCount === headings.length &&
    !hasPaidRefusalV194(combined);

  console.log("SOREUM_PAID_MULTIPART_V205", {
    categoryId: params.categoryId,
    partLengths: chosen.map((row) => row?.length || 0),
    totalLength: combined.length,
    headingCount,
    headingTotal: headings.length,
    hardMin: rule.hardMin,
    hardMinMet: combined.length >= rule.hardMin,
    targetMin: rule.targetMin,
    targetMinMet: combined.length >= rule.targetMin,
    structurallyComplete,
  });

  // 유료 결과 실패 기준은 구조 오류에만 둔다.
  // 목표 글자수보다 조금 짧다는 이유로 정상 리포트를 폐기하지 않는다.
  if (params.categoryId === "traditional") {
    combined = await continueTraditionalPaidIfCutV229({
      text: combined,
      user: params.user,
      manse: params.manse,
      title: params.title,
      systemGuide,
    });
  }

  if (params.categoryId === "traditional") {
    combined = stripTraditionalInstructionLeakV232(combined);
  }

  const traditionalTail = combined.trim().slice(-180);
  const traditionalLooksCut =
    params.categoryId === "traditional" &&
    combined.length > 0 &&
    !/[.!?。！？"”’\]\)]\s*$/.test(traditionalTail);

  if (
    !structurallyComplete ||
    traditionalLooksCut ||
    (params.categoryId === "today" && combined.length < rule.hardMin)
  ) {
    throw new Error(
      `paid multipart invalid: category=${params.categoryId}, length=${combined.length}, headings=${headingCount}/${headings.length}, hardMin=${rule.hardMin}`,
    );
  }

  return combined;
}


function buildFullPrompt(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  question: string;
  manseText: string;
  fixedConclusionText: string;
  profileText: string;
  manse?: any;
}) {
  const {
    user,
    categoryId,
    categoryTitle,
    question,
    manseText,
    fixedConclusionText,
    profileText,
    manse,
  } = params;
  const safeProfileText = makeInternalReferenceText(profileText);
  const categoryGuide = getCategoryGuide(categoryId, categoryTitle);
  const premiumSpecificStructure = getPremiumQuestionSpecificStructure(
    categoryId,
    categoryTitle,
    question,
  );
  const outputStructure = premiumSpecificStructure || getAllowedFullSectionTitles(categoryId, categoryTitle);
  const premiumQuestionGuide = getPremiumQuestionSpecificGuide(
    categoryId,
    categoryTitle,
    question,
  );
  const isHealthPaid =
    categoryId === "health" || categoryTitle.includes("건강") || categoryTitle.includes("몸운");
  const personalFingerprint = isHealthPaid
    ? ""
    : getPersonalStoryFingerprint(
        manse || manseText,
        categoryId,
        categoryTitle,
      );
  const healthPaidFacts = "";
  const moneyPaidGuide =
    categoryId === "money" || categoryTitle.includes("재물")
      ? `
[재물운 유료 V192 최우선 규칙]
이 재물운 유료 본문은 서버의 계산값을 재료로 GPT가 새로 풀어쓴다. 고정 템플릿 문장을 복사하지 않는다.

반드시 답해야 할 핵심 질문은 하나다.
"무료에서 공개한 이 사람의 돈그릇을 실제 재산으로 만들려면 무엇으로 벌고, 언제 키우고, 무엇을 피하고, 언제 자산으로 굳혀야 하는가?"

작성 순서:
[PART 01 · 내 돈그릇의 진짜 의미]
- 돈그릇 금액과 활용도를 짧게 확인한다.
- 같은 금액을 여러 표현으로 반복하지 않는다.
- "이 리포트에서 기준 금액은 하나다", "무료와 유료", "고정 판정", "서버 계산값" 같은 제작 문구 금지.
- 숫자 설명은 최대 2문단. 바로 현실 돈 이야기로 넘어간다.

[PART 02 · 나는 무엇으로 돈을 크게 만드는가]
- 주 수입축, 확장축, 안정축을 현실적인 일의 방식으로 설명한다.
- 직업군을 10개씩 나열하지 않는다.
- 금융·부동산·자산관리형, 장사·사업·영업형, 기술·전문직형 같은 분류명이 나오면 각각 왜 돈이 되는지와 실제 돈 받는 장면을 다르게 쓴다.
- 세 축을 억지로 하나의 직업에 모두 넣으라고 하지 않는다.
- 사용자가 현재 그 직업에 종사한다고 가정하지 않는다.

[PART 03 · 돈그릇을 현실 재산으로 만드는 순서]
- 이 사람에게 맞는 돈 성장 경로를 4~5단계로 만든다.
- 일반적인 재테크 강의처럼 쓰지 않는다.
- 각 단계마다 "무엇을 확인하면 다음 단계로 넘어가도 되는지" 현실 기준을 넣는다.
- 같은 "가격·단가·마진·계약" 단어를 매 문단 반복하지 않는다.

[PART 04 · MONEY TURN]
- first/expansion/peak/risk/consolidation 다섯 구간만 사용한다.
- 서버에 없는 새로운 나이를 만들지 않는다.
- expansion과 risk가 겹치면 교차구간이라고 한 번만 설명한다.
- 각 구간은 "무슨 일이 생긴다"보다 "그 나이에 어떤 선택을 해야 하는가"가 중심이다.

[PART 05 · 돈이 가장 크게 새는 장면]
- blocker를 중심으로 실제 생활/거래 장면 3개를 쓴다.
- 약한 직업군 전체를 "하면 안 되는 직업"으로 단정하지 않는다.
- 투자·동업·사업은 무조건 금지가 아니라 손실 조건을 구체적으로 가른다.

[PART 06 · 사업을 한다면]
- 사업운 유무보다 이 사람에게 맞는 사업 형태를 설명한다.
- 업종 이름을 길게 나열하지 않는다.
- 선재고, 고정비, 회수기간, 반복주문 중 이 사주에서 특히 중요한 것을 골라 우선순위를 준다.
- "작게 시작해라"로 끝내지 말고 무엇이 확인되면 키워도 되는지 말한다.

[PART 07 · 올해 돈이 움직이는 달]
- 서버가 준 세 달만 사용한다.
- 잡는 달 / 지키는 달 / 회수하는 달의 행동을 서로 다르게 쓴다.
- 월별 운세 12개월을 만들지 않는다.

[PART 08 · 최종 재물 판정]
- 앞 내용을 요약 복사하지 않는다.
- 지금부터 가장 먼저 바꿀 행동 1개, 다음 확장 때 잡을 것 1개, 위험구간에서 버릴 것 1개, 자산화 시기에 남길 것 1개를 판정한다.
- 마지막은 "그래서 이 사람은 어떤 방식으로 돈이 커지는 사람인가" 한 문장으로 끝낸다.

문체 금지:
- "이 리포트에서", "공통 판정", "무료에서 본", "유료에서는", "서버가 계산한", "절대 변경", "연결 규칙"
- "돈길"을 문단마다 반복하는 것
- "구조", "축", "현금흐름" 같은 추상어만으로 설명하는 것
- 같은 금액/나이/직업 분류를 앞뒤에서 계속 재진술하는 것
- "첫째 둘째 셋째"만 이어지는 교과서형 문장
- 사용자의 현재 직업이나 재산을 사실처럼 추정하는 것

고객이 읽고 남아야 하는 느낌:
"내가 얼마까지 가능한지는 무료에서 봤고, 여기서는 그 돈이 실제로 만들어지는 방법과 시기가 내 사주에 맞게 구체적으로 풀렸다."
`
      : "";

  const todayPaidGuide =
    categoryId === "today" || categoryTitle.includes("오늘")
      ? `
[오늘운세 유료 V205 복원 규칙]
오늘운세 유료는 짧은 생활조언 모음이 아니다. 무료에서 계산된 오늘의 판정을 바탕으로 하루를 실제로 읽어주는 풍부한 리포트다.

절대 기준:
- profile의 overallScore, moneyScore, workScore, relationshipScore, healthScore, verdict, bestTime, strongestArea, warningArea, doOne, avoidOne을 그대로 사용한다.
- AI가 새로운 점수·시간대를 만들거나 위 판정을 뒤집지 않는다.
- 4대 세부점수는 각 해당 섹션에서 자연스럽게 공개하고, 점수만 말하지 말고 왜 그 점수인지 현실 장면으로 충분히 풀어쓴다.
- 내부 지시문, [오늘 날짜 고정], 관계상태 처리 규칙, 서버/무료/유료/profile/프롬프트 같은 제작 문구는 고객 본문에 절대 출력하지 않는다.
- 특정 질환, 장기, 위장, 목·어깨, 면역력 같은 신체 부위를 계산 근거 없이 만들지 않는다. 건강은 오늘의 체력·집중력·피로·수면·식사·생활리듬 범위에서만 말한다.

분량과 읽는 맛:
- 전체 목표는 한국어 6,000~8,000자다. 짧게 요약하지 않는다.
- 각 제목은 서로 다른 질문에 답한다. 같은 조언을 제목만 바꿔 반복하지 않는다.
- '조심해라/미뤄라/정리해라'만 반복하지 말고, 오늘 실제로 어떤 장면에서 운이 튀는지 2~4개의 구체적 상황을 넣는다.
- 단, 사용자의 실제 직업·약속·구매·연애상태를 입력 없이 사실처럼 지어내지 않는다. 예시는 '이런 장면에서는' 식으로 쓴다.
- 문장은 도훈이 앞에서 읽어주는 느낌으로 쓴다. 교과서식 목록, AI 보고서체, 뻔한 자기계발 조언을 피한다.
- 사주 근거는 오행/십성 이름을 늘어놓지 말고, 필요한 곳에서만 '사주 흐름으로 보면' 뒤에 짧게 붙이고 바로 현실 의미를 설명한다.

섹션별 역할:
[오늘의 종합운]
- 첫 줄에 overallScore점과 verdict를 그대로 말한다.
- 왜 오늘이 이 점수인지 가장 강한 분야와 가장 조심할 분야를 연결해 5~8문단으로 풀어쓴다.
- 오전/오후/저녁을 여기서 전부 소진하지 말고 하루의 큰 방향만 잡는다.

[오늘 가장 좋은 시간]
- bestTime을 그대로 사용한다.
- 왜 이 시간이 좋은지, 이 시간에 돈·일·연락·결정 중 무엇을 우선해야 하는지 strongestArea와 doOne을 연결한다.
- 좋은 시간이라고 무조건 모든 행동이 좋은 것처럼 쓰지 않는다. warningArea에서 피해야 할 행동도 함께 가른다.

[오늘의 재물운]
- moneyScore를 반드시 표시한다.
- 오늘 돈을 잡는 장면/새는 장면/결제나 거래를 판단하는 기준을 구체적으로 쓴다.
- 배달비·충동구매 같은 상투적 예시를 모든 사람에게 고정으로 쓰지 않는다.

[오늘의 일·사업운]
- workScore를 반드시 표시한다.
- 평일/주말을 반영한다. 오늘 실제로 밀어도 되는 일, 미뤄야 할 결정, 연락·정리·거래·준비 중 어디에 힘을 써야 하는지 구체적으로 가른다.

[오늘의 연애·인연운]
- relationshipScore를 반드시 표시한다.
- 관계상태가 확정되지 않았으면 한 상태를 사실처럼 단정하지 않는다.
- 먼저 연락할지, 반응을 볼지, 말이 꼬이는 지점, 새로운 사람/기존 관계에서 오늘 중요한 태도를 오늘 흐름에 맞춰 풀어쓴다.

[오늘의 건강운]
- healthScore를 반드시 표시한다.
- warningArea와 연결하되 질병·장기명을 만들지 않는다.
- 집중력, 피로, 수면, 식사, 생활리듬 중 오늘 실제로 무너질 수 있는 패턴과 회복 행동을 설명한다.

[오늘 꼭 해야 할 것]
- doOne을 제목 아래 첫 문장에서 그대로 판정한다.
- 왜 이것이 오늘 운을 살리는지, 언제 실행하면 좋은지, 실행 전후 무엇을 확인할지 구체적으로 쓴다.

[오늘 피해야 할 것]
- avoidOne을 제목 아래 첫 문장에서 그대로 판정한다.
- 왜 이것이 오늘 손실로 이어지는지, 비슷해 보여도 해도 되는 행동과 하면 안 되는 행동을 구분한다.

[오늘운세 마지막 판정]
- 앞 문단을 복사 요약하지 않는다.
- 오늘 하루를 '언제 움직이고 / 무엇을 잡고 / 무엇을 버릴지' 세 문장으로 결론낸 뒤 도훈식 한 줄 판정으로 끝낸다.
`
      : "";

  const standardPaidGuide =
    categoryId === "health" || categoryTitle.includes("건강") || categoryTitle.includes("몸운")
      ? ""
      : `
[전 카테고리 유료 리포트 V198 내용 기준]
무료에서 계산한 결과가 원본이고 유료는 그 결과를 깊게 푸는 리포트다. 무료와 유료가 서로 다른 사람처럼 나오면 실패다.

공통 원칙:
- 건강운 V188과 재물운 V192 계산 구조는 건드리지 않는다.
- PART/TURN이라는 형식 때문에 내용을 끼워 맞추지 않는다. 카테고리별 질문 자체가 목차다.
- 서버 profile에 있는 점수·시기·유형·순위를 사실 기준으로 사용한다. AI가 숫자, 나이, 월, 상대 유형을 새로 만들지 않는다.
- 무료에서 보여준 판정은 유료에서 뒤집지 않는다. 유료에서는 왜 그런지, 언제 강해지는지, 현실에서 어떻게 나타나는지까지 확장한다.
- 같은 현실 장면, 같은 조언, 같은 문장을 여러 제목에서 반복하지 않는다.
- 고객에게 profile, JSON, 서버 계산값, 무료/유료 연결, 작성 규칙, 프롬프트 같은 제작 문구를 절대 보여주지 않는다.
- 마지막 판정은 요약이 아니라 지금 무엇을 밀고 무엇을 버릴지 결정한다.

카테고리별 핵심:
- 오늘운세: overallScore/moneyScore/workScore/relationshipScore/healthScore/verdict/bestTime/strongestArea/warningArea/doOne/avoidOne이 절대 기준이다. 오늘 하루만 쓴다. [오늘의 종합운]/[오늘 가장 좋은 시간]/[오늘의 재물운]/[오늘의 일·사업운]/[오늘의 연애·인연운]/[오늘의 건강운]/[오늘 꼭 해야 할 것]/[오늘 피해야 할 것]으로 분리한다. 관계상태를 가정하지 않는다. 주말에는 평일 회사 장면을 억지로 만들지 않는다. 각 분야는 서로 다른 실제 하루 장면으로 풀고, 건강은 체력·집중력·피로·수면·식사·생활리듬만 본다. 특정 질환·장기·면역력은 만들지 않는다.
- 재물운과 일·사업운의 직업/수익 경로 1~3순위는 getCareerDetailedProfile().pathways의 동일한 단일 원본을 사용한다. 재물운에서 나온 1·2·3순위를 일·사업운에서 다른 직업으로 바꾸거나, 사업 TOP3를 별도 업종 랭킹으로 다시 만들지 않는다.
- 일·사업운: split.office/split.own, primary, secondary, verdict, moneyRole, strongestSkill, avoidWork, transitionWindow와 기존 fixedCareerLogic을 절대 바꾸지 않는다. 직업사전처럼 공공기관·전문직·교육·요식·패션 등을 전부 한 챕터씩 풀지 말고, 돈이 되는 현실 직업길 1~3순위와 사업 TOP 3를 계산해 집중적으로 설명한다. 각 순위마다 회사에서 할 역할, 밖에서 할 형태, 돈그릇, 그 돈그릇까지 가는 조건을 연결한다. '사업형이지만 부업부터 키워야 하는 타입'이라는 핵심 판정을 뒤집지 않는다. 큰 창업·선재고·무리투자를 권하지 않는다.
- 연애운: loveScore, marriageScore, headline, attractionPoint, partnerDescription, avoidPartner, relationshipRisk, strongWindow이 기준이다. 내가 끌리는 사람과 피해야 할 사람을 관계Risk와 섞지 않는다. 상대가 나에게 빠지는 지점/질리는 지점, 반복해서 꼬이는 이유, 오래 갈 사람, 올해 인연 시기를 서로 다른 답으로 쓴다. 현재 연인이 있다고 가정하지 않는다.
- 결혼운: marriageScore와 연애 profile의 배우자 유형·피해야 할 유형·strongWindow을 기준으로 결혼 시기, 배우자 생활 분위기, 결혼 후 돈, 생활습관, 가족 거리, 반복 갈등, 결혼 판단 기준을 각각 분리한다. 연애운 문장을 복사하지 않는다.
- 궁합운: overallScore, loveScore, marriageScore, intimacyScore, mutualAttraction, strongestMetric, weakestMetric, conflictPoint를 그대로 사용한다. 연애궁합은 왜 끌리는지/왜 부딪히는지/연애/결혼/속궁합/복/악운/계속 만날지로 답한다. 사업파트너 궁합이면 속궁합을 절대 쓰지 말고 역할·돈·의사결정·책임·손실·갈등으로 바꾼다.
- 올해운세: year/overallScore/theme/headline/bestMonth/moneyMonth/careerMonth/relationshipWarningMonth/healthWarningMonth/action/avoid만 사용한다. 1~12월을 전부 나열하지 않는다. 좋은 달, 돈의 달, 일의 달, 관계 주의 달, 건강 주의 달을 각각 왜 그런 달인지 깊게 푼다.
- 인생대운: chanceCount, curve, firstRise, biggestWindow, cautionWindow, lateLife가 기준이다. 첫 상승 → 가장 큰 기회 → 주의 전환 → 후반 인생의 순서를 절대 흐리지 않는다. 서버에 없는 나이 구간을 새로 만들지 않는다.
- 평생종합사주: metrics, strongestBlessing, weakestHole, turningWindow, coreAdvice를 중심축으로 돈·일·인연·결혼·가족/자식·건강·대운을 한 인생 흐름으로 연결한다. 다른 메뉴 본문을 붙여넣지 않는다.
- 내 고민 상담: verdict는 밀어라/기다려라/멈춰라/조건부 진행 중 하나이며 reasons/avoidNow/doNow가 기준이다. 질문과 직접 관련 있는 돈·일·연애·결혼·건강·대운 근거만 끌어온다. 모든 질문에 같은 상담 목차를 기계적으로 채우지 말고, 첫 문단에서 답부터 말하고 마지막에는 왜 그 판정인지와 앞으로 갈 길을 열어준다.
`

  return `
역할: 너는 소름사주의 사주풀이 도훈이다.
말투: 친한 형이 앞에서 바로 사주를 찍어주는 말투. 존댓말, 보고서체, AI 설명체 금지.

사용자 입력:
${buildUserInfoText(user)}

만세력과 고정 기준:
${makeInternalReferenceText(manseText)}

${isHealthPaid ? "" : `고객에게 보여줄 고정 결론:
${fixedConclusionText}

카테고리 내부 프로필:
${safeProfileText}`}

카테고리 작성 규칙:
${categoryGuide}

오늘운세 날짜/요일/사람관계 규칙:
${getTodayRuntimeGuide(user, categoryId, categoryTitle)}

내 고민 질문별 추가 규칙:
${premiumQuestionGuide || "해당 없음"}

${isWorryCategoryV112(categoryId, categoryTitle) ? `[내 고민 상담 v122 최우선 지시]
이 요청은 내 고민 상담 유료 본문이다. 출력은 반드시 20,000자 이상으로 쓴다. 20,000자보다 짧으면 실패다. 절대 짧게 요약하지 마라. 질문 하나만 끝까지 판다. 질문과 직접 관련 없는 재물운·일운·연애운·건강운을 기계적으로 섞지 마라. 모든 질문에 같은 목차를 붙이지 마라. 질문 유형에 따라 장면 구성을 다르게 만들고, 첫 문단에서 바로 답하고, 마지막은 방향성과 길을 여는 도훈의 판정으로 끝내라. 지금 밀면 어떻게 되는지, 기다리면 무엇이 보이는지, 지금 해야 할 선택, 피해야 할 선택까지 길게 풀어라. 고객에게 내부 지시문을 보이지 마라.` : ""}

${isHealthPaid ? healthPaidFacts : `개인화 참고:
${personalFingerprint}`}

선택 카테고리: ${getEffectiveCategoryTitle(categoryId, categoryTitle, user)}
사용자 질문: ${question || "없음"}

출력할 리포트 구조:
${outputStructure}

${moneyPaidGuide}
${todayPaidGuide}
${standardPaidGuide}

유료 작성 규칙:
- 출력할 리포트 구조에 있는 제목만 사용한다.
- 선택 카테고리 하나만 깊게 판다.
- 가장 궁금한 것, 반복귀신, 전생 보조 레이어는 쓰지 않는다.
- 건강운 유료는 기존 무료/고정 결론을 복사하지 말고 만세력 사실값으로 첫 판정을 새로 만든다. 그 외 카테고리는 결과 첫 문장을 고정 결론과 같은 뜻으로 시작한다.
- 조언보다 판정을 먼저 말한다.

[비건강 카테고리 공통 연결 규칙 v189]
- 건강운에는 이 규칙을 적용하지 않는다. 건강운 전용 V188 파이프라인은 그대로 둔다.
- 재물운의 재물 그릇·활용도·버는 힘·모으는 힘·불리는 힘·지키는 힘·돈벌이 방식·시기 계산값을 AI가 새로 만들거나 뒤집지 마라.
- 일·사업운의 직장형/사업형/부업형 판정, 주 역할, 보조 역할, 강점, 피할 일, 전환 시기를 유료 본문에서 바꾸지 마라.
- 사랑·결혼운은 관계상태를 입력받았다고 가정하지 않는다. 새 인연, 현재 연인, 배우자를 사실처럼 만들어내지 말고 사주상 끌리는 유형·관계 패턴·결혼 성향·시기를 판정한다.
- 궁합운은 서버가 계산한 전체/연애/결혼/속궁합 점수와 강점·약점·갈등 포인트를 그대로 사용한다. AI가 다른 점수나 반대 판정을 만들면 실패다.
- 올해운세는 서버가 고른 좋은 달·돈의 달·일의 달·관계 주의 달·건강 주의 달만 확장한다. 1월부터 12월까지 월별 운세를 새로 만들지 마라.
- 인생대운은 서버가 계산한 첫 상승·가장 큰 기회·주의 구간·후반 흐름을 기준으로 현재 위치와 다음 전환을 설명한다. AI가 별도의 나이 구간을 임의 생성하지 마라.
- 평생종합사주는 서버의 강한 복·약한 구멍·전환구간을 중심축으로 돈·일·인연·결혼·건강·대운을 연결한다. 각 메뉴의 핵심 판정을 서로 모순되게 쓰지 마라.
- 내 고민 상담은 질문 하나를 먼저 판정하고 필요한 카테고리 근거만 끌어온다. 질문과 무관한 메뉴를 목차 채우기용으로 나열하지 마라.
- 무료에서 공개한 핵심 판정은 유료에서 뒤집지 않는다. 유료는 이유·시기·현실 장면·행동 우선순위를 더 깊게 공개하는 단계다.
- 고정 fallback 문장을 AI 본문을 채우는 재료처럼 반복하지 마라. 계산값은 사실 기준으로 사용하고 고객 문장은 해당 사람의 만세력과 카테고리 데이터로 새로 작성한다.

[유료 분량 절대 기준]
유료 결과는 짧은 웹툰 카드가 아니다. 자세한 사주풀이 본문이다.
아래 글자 수를 반드시 지켜라.
- 오늘운세: 전체 본문 최소 6,000자 이상.
- 재물운: 전체 본문 최소 10,000자 이상.
- 일·사업운: 전체 본문 최소 10,000자 이상.
- 궁합운: 전체 본문 최소 10,000자 이상.
- 결혼운: 전체 본문 최소 10,000자 이상.
- 건강운: 전체 본문 최소 10,000자 이상.
- 올해운세: 전체 본문 최소 10,000자 이상.
- 인생대운: 전체 본문 최소 10,000자 이상.
- 평생종합사주: 전체 본문 최소 20,000자 이상.
- 내 고민 상담: 전체 본문 최소 20,000자 이상.

한 제목을 한 문장으로 끝내지 마라. 그건 결제 리포트가 아니다.
각 제목마다 최소 5문단 이상 쓴다.
각 문단은 2~4문장으로 쓴다.
오늘운세는 제목 1개당 700~1,000자 정도 쓴다.
재물운, 일·사업운, 궁합운, 결혼운, 건강운, 올해운세, 인생대운은 제목 1개당 1,000~1,400자 정도 쓴다.
평생종합사주와 내 고민 상담는 제목 1개당 1,700~2,300자 정도 쓴다.

각 제목 안에는 반드시 아래 다섯 가지를 넣는다.
1. 판정.
2. 왜 이 사주에서 그렇게 보는지.
3. 실제 현실 장면.
4. 잡을 것.
5. 피할 것.

- 추상적인 말만 늘어놓지 마라. 현실 장면과 행동으로 설명한다. 재물운은 돈 받는 방식·반복수입·확장·손실 방어·자산화를 구체적인 상황으로 쓴다.
- 오늘운세는 오늘 하루만 말한다. 30대, 40대, 올해 몇 월, 대운, 인생 전체 금지. 오전·오후·저녁만 허용한다.
- 오늘운세는 서버가 넘긴 오늘 날짜/요일 규칙을 반드시 반영한다. 주말이면 주말형 일운, 평일이면 평일형 일운으로 쓴다.
- 오늘운세는 사용자의 관계상태를 임의로 만들지 않는다. 새 인연·연인·배우자를 사실처럼 가정하지 말고, 사람운은 연락·말투·약속·가족·지인·업무관계 중심으로 쓴다.
- 오늘운세는 재물운, 일운, 연애운/인연운, 건강운을 반드시 각각 깊게 쓴다. 단, 한 줄 나열 금지. 오늘 실제 장면으로 쓴다.
- 오늘운세는 좋은 일과 조심할 일을 반드시 같이 말한다.
- 재물운은 언제 돈이 붙는지, 무엇으로 돈을 벌어야 하는지, 무엇 때문에 돈을 잃는지 말한다.
- 일·사업운은 직장형/사업형/부업형 판정을 뒤집지 않고, 회사 안에서 맞는 일과 밖에서 맞는 일을 실제 장면으로 말한다.
- 궁합운은 궁합 점수·등급, 서로의 취향과 외향·말투, 서로가 서로에게 끌리는 지점, 왜 끌리고 왜 부딪히는지, 연락·말투의 충돌, 속궁합 점수와 판정·주도권·리듬·밀착 방식·좋아지는 조건, 연애 지속성, 결혼 가능성과 결혼 후 돈·가족·생활 충돌, 관계를 살리는 방법, 계속 만나도 되는지와 마지막 판정을 모두 깊게 다룬다.
- 결혼운은 배우자 유형, 결혼 시기, 결혼 후 돈·가족·생활 습관만 말한다.
- 건강운은 잠, 소화, 장, 목·어깨, 피로, 스트레스가 몸으로 가는 방식만 말한다.
- 건강운 유료는 반드시 이 사람의 만세력 개인 기준을 사용한다. 같은 등급이라는 이유로 다른 사람과 같은 본문을 쓰면 실패다.
- 건강운 유료의 고비 나이, 올해 주의 달, 약한 축, 첫 신호, 피해야 할 생활 습관, 음식, 운동, 최종 판정은 위 건강운 유료 AI 개인화 기준과 모순되면 안 된다.
- 건강운 유료는 [음식으로 건강을 지키는 법], [생활 리듬으로 건강을 지키는 법], [운동으로 건강을 지키는 법]을 반드시 각각 충분히 작성한다.
- 올해운세는 강한 달만 찍는다. 1월부터 12월까지 전부 나열하지 않는다.
- 인생대운은 초년·청년·중년·말년과 크게 바뀌는 시기를 말한다.
- 평생종합사주는 돈, 일, 인연, 결혼, 건강, 자식운, 대운을 연결해서 길게 말한다.
- 내 고민 상담는 사용자가 적은 질문 하나만 끝까지 판다.
- 중요한 핵심 판정은 줄 앞에 | 를 붙인다.
- 문단 사이에는 빈 줄을 넣는다.
`;
}

function fallbackPreview(
  categoryId: CategoryId,
  categoryTitle: string,
  user: UserInfo,
  manse: any,
  partnerManse?: any | null,
) {
  const fixed = getPublicFixedConclusionText(
    getFixedConclusionBlock(
      categoryId,
      categoryTitle,
      user,
      manse,
      partnerManse,
    ),
  );
  const title = categoryTitle || "";
  const label = getEffectiveCategoryTitle(categoryId, categoryTitle, user);

  if (categoryId === "today" || title.includes("오늘")) {
    return `[오늘 먼저 봐야 할 자리]
${fixed}

| 오늘은 다 막히는 날이 아니다. 먼저 건드리면 꼬이는 일이 있고, 오후부터 처리하면 풀리는 일이 따로 있다.

급한 답장과 기분 따라 쓰는 돈은 조심해야 한다. 대신 미뤄둔 연락 하나, 정리만 하면 끝나는 일 하나는 오늘 처리해도 된다.

[오늘 살릴 것과 조심할 것]
무료에서는 여기까지만 본다. 오늘 전체 답을 다 열지는 않는다.

오늘 써도 되는 돈과 쓰면 안 되는 돈, 먼저 해도 되는 말과 참아야 할 말, 처리하면 풀리는 일과 미뤄야 할 일은 전체 리포트에서 바로 찍는다.

[전체 리포트에서 열리는 장면]
전체 리포트에서는 오늘 아침·점심·저녁 중 움직여도 되는 때와 조심할 때까지 본다.`;
  }

  if (categoryId === "money" || title.includes("재물")) {
    return `[재물운 첫 느낌]
${fixed}

| 돈복이 아예 없는 사주는 아니다. 다만 아무 방식으로 벌리는 돈은 아니다.

무료에서는 무엇으로 돈을 벌어야 하는지 공개하지 않는다.

[돈이 새기 쉬운 자리]
사람 말에 끌려 들어가는 돈, 정 때문에 쓰는 돈, 돈이 들어오기도 전에 먼저 빠지는 돈에서 조심해야 한다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 물건·기술·말·사람·정기관리 중 어디서 돈이 붙는지 바로 판정한다.`;
  }

  if (isCareerCategory(categoryId, title) || title.includes("일·사업")) {
    return `[일·사업운 첫 판정]
${fixed}

| 너는 시키는 일만 오래 하다 끝날 사주는 아니다.

다만 바로 크게 벌이는 창업은 눌린다. 먼저 돈이 실제로 들어오는 작은 일부터 잡아야 한다.

[일에서 답답해지는 자리]
남이 정한 일만 하고 월급날만 기다리는 일은 오래 갈수록 속이 답답해진다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 회사 안에서 맞는 일, 밖에서 맞는 일, 처음부터 피해야 할 사업을 바로 본다.`;
  }

  if (categoryId === "love" || title.includes("연애")) {
    return `[연애운 첫 느낌]
${fixed}

| 너는 아무나 좋아하는 사주가 아니다.

끌리는 사람의 공통점이 있고, 흔들리게 만드는 말투와 분위기가 따로 있다.

[내가 흔들리는 사람]
상대가 좋은 사람인지보다, 네가 왜 그 사람에게 약해지는지를 먼저 봐야 한다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 내가 끌리는 사람의 공통점, 나를 흔드는 말투와 분위기, 내가 약해지는 순간, 상대가 나에게 빠지는 지점, 상대가 나에게 질리는 지점, 올해 놓치면 아까운 인연을 바로 판정한다.`;
  }

  if (isCompatibilityCategory(categoryId, title) || title.includes("궁합")) {
    return `[두 사람의 첫 끌림]
${fixed}

| 두 사람은 그냥 스쳐 지나가는 궁합은 아니다.

처음 끌림은 있다. 다만 끌림이 있다고 오래 가는 궁합은 아니다.

[상대 취향을 봐야 하는 자리]
서로 어떤 스타일에 끌리는지, 네가 상대 취향에 들어가는지, 속궁합이 맞는지를 봐야 한다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 궁합 점수, 서로 끌리는 상대 유형, 상대 취향, 속궁합, 계속 만나도 되는 관계인지 바로 판정한다.`;
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return `[결혼운 첫 판정]
${fixed}

| 결혼은 설렘보다 생활에서 갈린다.

좋아해도 돈 쓰는 방식, 가족 거리, 말투가 안 맞으면 결혼 후 외로워진다.

[결혼하면 피곤해지는 자리]
말은 다정한데 생활이 흐린 사람은 피곤하다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 맞는 배우자, 피해야 할 배우자, 결혼운이 움직이는 시기를 본다.`;
  }

  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return `[몸이 먼저 보내는 신호]
${fixed}

| 몸이 약해서 문제가 아니라, 버티다가 한 번에 꺼지는 쪽이 문제다.

잠, 소화, 장, 목·어깨, 피로 중 어디서 먼저 무너지는지 봐야 한다.

[무리하면 꺼지는 자리]
커피로 버티고 밥을 넘기면 오후부터 몸이 무겁다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 몸이 먼저 보내는 신호와 피해야 할 습관을 본다.`;
  }

  if (isMonthlyCategory(categoryId, title)) {
    return `[올해운세 첫 판정]
${fixed}

| 올해는 다 잡는 해가 아니다. 잡을 것과 버릴 것이 갈린다.

[올해 조심할 자리]
돈, 일, 사람, 몸 중 강하게 움직이는 달만 봐야 한다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 돈이 움직이는 달, 돈이 새는 달, 일이 살아나는 달, 사람과 몸을 조심할 달을 찍는다.`;
  }

  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return `[인생대운 첫 판정]
${fixed}

| 초반부터 편하게 풀리는 사주인지, 늦게 힘이 붙는 사주인지부터 봐야 한다.

[초반에 답답했던 자리]
초년과 청년운에서 생긴 답답함이 중년 이후 돈과 일에 어떻게 바뀌는지 봐야 한다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 초년·청년·중년·말년과 크게 바뀌는 시기를 본다.`;
  }

  if (categoryId === "traditional" || title.includes("평생")) {
    return `[평생종합사주 첫 판정]
${fixed}

| 평생종합사주는 한 가지 운만 보는 메뉴가 아니다.

돈, 일, 인연, 결혼, 건강, 자식운, 대운이 어떻게 이어지는지 봐야 한다.

[인생에서 많이 흔들리는 자리]
한 항목만 좋고 나쁘다고 끝낼 수 없다. 인생 전체에서 어디서 흔들리고 어디서 살아나는지 본다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 평생의 돈, 일, 인연, 건강, 자식운, 대운을 한 번에 본다.`;
  }

  return `[질문에 대한 첫 판정]
${fixed}

| 이 고민은 그냥 마음 문제로 넘길 일이 아니다.

[지금 조심할 자리]
지금 밀고 갈지, 멈출지, 기다릴지 먼저 갈라야 한다.

[전체 리포트에서 열리는 답]
전체 리포트에서는 ${label} 기준으로 질문 하나를 끝까지 판다.`;
}


function fallbackFull(
  categoryId: CategoryId,
  categoryTitle: string,
  user: UserInfo,
  manse: any,
  partnerManse?: any | null,
  fortuneSeed: number = 0,
) {
  const fixed = getPublicFixedConclusionText(
    getFixedConclusionBlock(categoryId, categoryTitle, user, manse, partnerManse, fortuneSeed),
  );
  const title = categoryTitle || "";
  const moneyDirection = getConcreteMoneyDirection(manse);
  const moneyTiming = getMoneyTimingText(user, manse);
  const career = getCareerArchetype(manse);
  const health = getHealthProfile(manse);
  const love = getLovePartnerProfile(manse);
  const marriage = getMarriageTimingProfile(manse);
  const compatibility = getCompatibilityScore(manse, partnerManse || null);
  const attraction = getPartnerAttractionProfile(manse, partnerManse || null);

  const long = (lines: string[]) => lines.join("\n\n");

  if (categoryId === "today" || title.includes("오늘")) {
    const today = getKoreaTodayInfo();
    const p = buildCategoryPreviewProfile({
      categoryId: "today",
      categoryTitle: title || "오늘운세",
      user,
      manse,
      fortuneSeed,
    });

    if (!p || p.kind !== "today") {
      throw new Error("today fallback profile missing");
    }

    const weekendContext = today.isWeekend
      ? "오늘은 주말이라 회사 회의나 상사 반응보다, 다음 주 준비·개인 연락·정리·부업이나 개인적인 판단처럼 쉬는 날에도 이어지는 현실 장면에서 이 운이 드러난다."
      : "오늘은 평일이라 업무 연락·처리 순서·거래·약속 시간처럼 실제 일과 사람의 움직임에서 이 운이 더 선명하게 드러난다.";

    const relationContext = normalizeMaritalStatus(user) === "기혼"
      ? "관계에서는 배우자나 가까운 가족과의 말투와 생활 대화를 먼저 본다."
      : normalizeMaritalStatus(user) === "연애중"
        ? "관계에서는 현재 연인과의 연락 속도보다 말의 온도와 반응을 먼저 본다."
        : normalizeMaritalStatus(user) === "미혼"
          ? "관계에서는 부담 없는 연락, 소개, 짧게 이어지는 대화처럼 새 인연이 들어올 틈을 먼저 본다."
          : "관계상태가 정해지지 않았으므로 특정 상대가 있다고 가정하지 않고, 가까운 사람과 새로 들어오는 연락 모두에서 말과 반응의 흐름을 본다.";

    return long([
      `[오늘의 종합운]\n${user.name}, 오늘은 ${p.overallScore}점이다. 판정은 '${p.verdict}'로 잡힌다. 오늘 하루가 전부 좋거나 전부 나쁜 식으로 흐르지 않는다. 가장 먼저 살아나는 쪽은 ${p.strongestArea}이고, 반대로 실수가 붙기 쉬운 쪽은 ${p.warningArea}다. 그래서 오늘은 잘되는 걸 무작정 더 하는 것보다 강한 운을 먼저 쓰고 약한 운에서 손실을 막는 순서가 중요하다.\n\n${weekendContext}\n\n오늘의 네 가지 세부 흐름을 나눠 보면 재물운 ${p.moneyScore}점, 일·사업운 ${p.workScore}점, 연애·인연운 ${p.relationshipScore}점, 건강운 ${p.healthScore}점이다. 이 숫자는 좋다 나쁘다를 붙이는 장식이 아니라 오늘 어디에 힘을 먼저 쓰고 어디서 속도를 줄여야 하는지 보여주는 지도다. 가장 높은 쪽에서는 결과를 남기고, 가장 낮은 쪽에서는 괜찮다고 밀어붙이지 않는 게 오늘 점수를 실제 운으로 바꾸는 방법이다.\n\n오늘의 핵심은 '${p.doOne}'이다. 반대로 '${p.avoidOne}'은 오늘만큼은 피해야 한다. 둘을 같이 봐야 한다. 해야 할 것만 보고 달리면 ${p.warningArea}에서 실수가 붙고, 조심할 것만 생각하면 ${p.strongestArea}에서 들어온 기회를 놓친다.`,
      `[오늘 가장 좋은 시간]\n오늘 가장 좋은 시간은 ${p.bestTime}다. 이 시간은 그냥 기분이 좋아지는 시간이 아니라, 오늘 가장 강한 ${p.strongestArea}을 실제 행동으로 옮기기 좋은 구간이다. 해야 할 일이 여러 개라면 이 시간에 가장 중요한 하나를 먼저 잡아라. 연락을 해야 한다면 목적이 분명한 연락, 결정을 해야 한다면 오늘 안에 끝낼 수 있는 결정, 정리를 해야 한다면 다음 행동이 바로 보이는 정리부터 하는 식이 맞다.\n\n좋은 시간이라고 모든 행동이 다 유리한 것은 아니다. ${p.warningArea}과 연결된 일은 이 시간에도 과하게 밀지 않는 편이 낫다. 오늘 좋은 시간을 쓰는 방식은 '많이 하는 것'이 아니라 '${p.doOne}'을 가장 먼저 끝내는 것이다.`,
      `[오늘의 재물운]\n오늘 재물운은 ${p.moneyScore}점이다. 오늘 돈에서는 액수보다 판단 순서가 중요하다. 바로 결제해야 할 이유가 분명한 돈과, 기분·체면·조급함 때문에 지금 당장 쓰고 싶은 돈을 갈라야 한다. 전자는 필요한 지출이지만 후자는 오늘 흐름에서 손실로 남기 쉽다.\n\n돈 이야기가 들어오면 조건부터 확인해라. 할인이라는 말, 누가 좋다고 하는 말, 지금 아니면 안 된다는 말보다 실제로 내가 필요한지와 나중에 후회할 지출인지가 기준이다. 재물운이 높은 날이라면 잡을 돈을 빠르게 구분하는 힘으로 쓰고, 낮은 날이라면 새 돈을 만들려 하기보다 새는 구멍을 막는 데 쓰는 게 맞다. 오늘의 재물운은 전체 점수와 ${p.strongestArea}/${p.warningArea} 판정 안에서 움직여야 한다.`,
      `[오늘의 일·사업운]\n오늘 일·사업운은 ${p.workScore}점이다. 오늘 일에서는 바쁜 척하는 것보다 결과 하나를 남기는 게 중요하다. ${today.isWeekend ? "주말인 오늘은 새 업무가 떨어지는 장면보다 다음 주에 바로 써먹을 준비, 미뤄둔 확인, 개인적으로 생각해 둔 일이나 부업 아이디어를 현실적인 한 단계로 줄이는 장면에서 일운을 쓴다." : "평일인 오늘은 처리 순서, 업무 연락, 거래 조건, 약속 시간처럼 바로 결과가 남는 장면에서 일운을 쓴다."}\n\n특히 ${p.bestTime}에는 '${p.doOne}'과 연결되는 일을 먼저 잡아라. 여러 일을 동시에 벌이는 것보다 하나를 끝내고 다음으로 넘어가는 편이 오늘 운과 맞는다. 반대로 '${p.avoidOne}'과 닿는 결정은 속도를 줄여라. 오늘 일운의 핵심은 많이 움직이는 게 아니라 움직인 만큼 결과가 남게 만드는 것이다.`,
      `[오늘의 연애·인연운]\n오늘 연애·인연운은 ${p.relationshipScore}점이다. ${relationContext} 오늘은 상대의 마음을 미리 결론내기보다 내가 보내는 말의 길이와 타이밍을 보는 게 중요하다. 답이 늦다고 바로 의미를 붙이거나, 분위기가 좋다고 한 번에 거리를 좁히면 오늘의 흐름을 거칠게 쓸 수 있다.\n\n새로운 연락이든 익숙한 사람이든 오늘은 상대가 한 번 더 말을 이어오는지 보는 여유가 필요하다. 반대로 내가 먼저 움직여야 하는 흐름이라면 길고 무거운 말보다 목적이 분명한 짧은 말이 낫다. 인연운 점수는 누군가가 반드시 생긴다는 뜻이 아니라, 오늘 사람 사이에서 내 매력과 판단이 얼마나 자연스럽게 작동하는지를 보여주는 값으로 봐야 한다.`,
      `[오늘의 건강운]\n오늘 건강운은 ${p.healthScore}점이다. 오늘 몸은 특정 장기나 질병을 찍는 방식으로 보지 않는다. 체력, 집중력, 피로, 식사, 수면, 생활리듬이 어느 순간 같이 무너지는지를 보는 게 맞다. 특히 ${p.warningArea}이 몸 쪽과 연결되는 날이라면 '아직 괜찮다'고 버티는 순간보다 집중력이 떨어지고 판단이 거칠어지는 순간을 먼저 신호로 봐라.\n\n해야 할 일 사이에 식사를 계속 미루거나 쉬는 시간 없이 머리를 쓰는 패턴, 늦은 시간까지 긴장을 끌고 가는 패턴은 오늘 회복을 늦춘다. 반대로 짧게라도 리듬을 끊고 다시 시작하면 남은 시간의 집중력을 지킬 수 있다. 건강운은 겁을 주는 항목이 아니라 오늘 다른 운을 끝까지 쓸 수 있게 몸의 속도를 조절하는 항목이다.`,
      `[오늘 꼭 해야 할 것]\n오늘 꼭 해야 할 것은 '${p.doOne}'이다. 이건 좋은 말 하나 붙인 조언이 아니라 오늘 ${p.strongestArea}을 실제 결과로 남기는 행동이다. ${p.bestTime} 전후에 이 행동을 먼저 끝내고, 끝냈다는 흔적이 남게 만들어라. 연락이면 보내고 끝내고, 정리면 다음 행동이 보이게 끝내고, 결정이면 조건을 확인한 뒤 하나를 확정하는 식이다.\n\n오늘은 계획을 많이 세우는 것보다 중요한 하나가 끝났는지가 더 중요하다. 이것 하나를 끝내면 나머지 운은 따라오기 쉽고, 이것을 계속 미루면 좋은 시간도 그냥 지나간다.`,
      `[오늘 피해야 할 것]\n오늘 피해야 할 것은 '${p.avoidOne}'이다. 오늘의 ${p.warningArea}은 큰 사건보다 순간적인 판단에서 손실이 붙기 쉽다. 그래서 바로 반응하고 싶은 순간일수록 한 번 더 확인하는 게 낫다.\n\n다만 아무것도 하지 말라는 뜻은 아니다. 해야 할 일은 하되, 감정·피로·조급함이 판단을 대신하는 순간만 끊어라. 오늘은 움직이지 않아서 손해 보는 날이 아니라, 잘못된 순서로 움직여서 좋은 운까지 깎아먹는 걸 피해야 하는 날이다.`,
      `[오늘운세 마지막 판정]\n${user.name}, 오늘 ${p.overallScore}점은 애매한 점수가 아니다. ${p.strongestArea}에서는 분명히 써먹을 힘이 있고, ${p.warningArea}에서는 분명히 속도를 줄여야 한다는 뜻이다. ${p.bestTime}에는 '${p.doOne}'을 먼저 실행하고, '${p.avoidOne}'은 오늘만큼은 뒤로 미뤄라.\n\n오늘은 많이 해낸 사람이 운을 잘 쓰는 날이 아니다. 맞는 시간에 맞는 하나를 잡고, 틀린 하나를 건드리지 않은 사람이 오늘 운을 제대로 쓴다.`,
    ]);
  }

  if (categoryId === "money" || title.includes("재물")) {
    return long([
      `[재물운 첫 판정]\n${fixed}\n\n너는 돈을 못 버는 사주가 아니다. 다만 돈이 붙는 방식과 돈이 새는 방식이 분명히 갈린다. 아무 장사나 시작하면 돈이 남는 게 아니라, 먼저 빠지는 돈이 적고 필요한 사람에게 바로 닿는 일에서 재물운이 산다.`,
      `[내 사주상 분석]\n이 사주는 돈이 들어오기 전에 크게 묶이는 일을 약하게 본다. 쉽게 말해 손님이 생기기도 전에 재고값, 월세, 광고비, 인테리어비가 먼저 빠지는 식이면 마음이 눌리고 돈도 늦게 돈다. 반대로 누가 무엇을 찾는지 보이고, 필요한 물건이나 서비스를 맞춰주고, 다시 찾는 사람이 생기는 쪽에서는 돈이 남는다.`,
      `[왜 이 돈은 내 사주와 맞는가]\n${moneyDirection.workAnswer}\n\n${moneyDirection.earn}\n\n이 방식이 맞는 이유는 돈이 먼저 묶이지 않고 필요한 사람을 보고 움직일 수 있기 때문이다. 팔릴지 안 팔릴지 모르는 걸 쌓아두는 돈보다, 주문이나 필요가 보인 뒤 움직이는 돈이 네 사주에 맞다.`,
      `[재물운이 쌓이기 시작하는 시기]\n${moneyTiming.firstMoneyAge}세 전후에는 돈 보는 눈이 뜬다. ${moneyTiming.strongMoneyAge}세 전후부터는 재물운이 굵어진다. ${moneyTiming.assetAge}세 이후에는 빨리 벌어 빨리 쓰는 돈보다 쌓고 지키는 돈이 강해진다. 이 숫자는 현재 나이가 아니라 재물운이 움직이는 구간이다.`,
      `[무엇으로 돈을 벌어야 하는가]\n${moneyDirection.workAnswer}\n\n말만 많은 일보다 실제 필요한 물건, 서비스, 사람의 불편을 해결하는 쪽이 낫다. 누가 필요한지 보이고, 얼마에 넘길지 보이고, 다시 찾을 이유가 있는 일이 돈을 남긴다.`,
      `[물건·기술·말·사람·정기관리 중 어디인가]\n${getMoneyPatternLabel(getMoneyPattern(manse))}\n\n물건이면 쌓아놓는 물건보다 필요한 물건을 찾아 넘기는 쪽이다. 기술이면 한 번 하고 끝나는 기술보다 다시 맡기는 기술이 낫다. 말이면 허세 부리는 말이 아니라 비교해주고 설명해주고 선택을 도와주는 말에서 돈이 붙는다.`,
      `[재고를 안고 가면 눌리는가]\n팔리기도 전에 재고를 크게 안으면 눌린다. 돈이 들어오기도 전에 빠지는 돈이 커지면 마음도 조급해지고 판단도 흐려진다. 네 재물운은 창고를 채우고 기다리는 쪽보다, 필요한 사람을 보고 맞춰서 움직이는 쪽이 낫다.`,
      `[피해야 할 장사와 그 이유]\n${moneyDirection.avoid}\n\n이게 안 맞는 이유는 돈이 벌리기 전에 먼저 빠지는 시간이 길기 때문이다. 처음부터 크게 벌이는 사업, 무리한 투자, 지인 말만 믿고 들어가는 돈은 손님보다 비용이 먼저 온다. 네 사주는 준비가 길어지는 돈보다 작아도 바로 확인되는 돈이 낫다.`,
      `[돈이 새는 사람과 상황]\n돈이 새는 사람은 부탁은 빠르고 책임은 늦은 사람이다. 같이 벌자고 말하면서 돈 넣는 건 네가 먼저 하고, 받을 날짜는 흐리고, 문제 생기면 뒤로 빠지는 사람을 조심해야 한다. 정 때문에 돈을 섞으면 재물운이 약해진다.`,
      `[올해 돈이 움직이는 달]\n올해는 ${moneyTiming.moneyMoveMonth}월에 돈 이야기가 움직이고, ${moneyTiming.moneyLeakMonth}월에는 돈이 새기 쉽다. ${moneyTiming.moneyCatchMonth}월에는 다시 잡을 돈이 보인다. 움직이는 달에는 제안, 주문, 판매, 받을 돈 확인을 잡고, 새는 달에는 투자와 큰 지출을 미뤄라.`,
      `[재물운 마지막 종합 판정]\n최종 판정은 이거다. 너는 돈을 못 버는 사주가 아니다. 다만 큰돈을 먼저 넣고 기다리는 돈은 맞지 않는다. 필요한 사람을 보고, 필요한 물건이나 서비스를 맞춰주고, 다시 찾는 사람이 생기는 쪽에서 재물운이 산다. ${moneyTiming.strongMoneyAge}세 전후부터 돈복이 굵어지고, 올해는 ${moneyTiming.moneyMoveMonth}월과 ${moneyTiming.moneyCatchMonth}월에 잡고 ${moneyTiming.moneyLeakMonth}월에는 지켜야 한다.`,
    ]);
  }

  if (categoryId === "career" || title.includes("일·사업")) {
    return long([
      `[일·사업운 첫 판정]\n${fixed}\n\n일 판정은 '${career.combined}'이다. 이 판정은 뒤집지 않는다. 너는 시키는 일만 오래 하다 끝날 사주는 아니다.`,
      `[내 사주상 분석]\n사주를 쉽게 풀면, 가만히 앉아서 남이 정한 일만 처리하는 자리보다 사람을 만나고 물건이나 서비스가 실제로 오가는 일에서 일이 산다. 오래 버티는 일만 하면 몸은 바쁜데 남는 게 약해진다.`,
      `[직장형인가 사업형인가]\n바로 창업형으로 크게 뛰라는 뜻은 아니다. 사업형 기질은 있지만 부업부터 키워야 하는 타입이다. 회사 안에서도 영업, 구매, 납품, 관리, 현장 문제 해결처럼 실제로 사람이 움직이는 일이 맞다.`,
      `[회사에 있으면 맞는 일]\n회사에 있으면 책상에만 묶이는 일보다 사람과 물건, 서비스가 움직이는 일이 낫다. 주문을 받고, 필요한 걸 찾고, 납품을 챙기고, 문제가 생기면 바로 해결하는 자리에서 일운이 산다.`,
      `[밖으로 나가면 맞는 일]\n밖으로 나가면 처음부터 매장 얻고 사람 쓰는 방식은 피해야 한다. 작은 주문, 예약제 서비스, 필요한 물건을 찾아 넘기는 일, 반복으로 맡기는 관리형 일부터 잡아야 한다.`,
      `[처음부터 크게 벌이면 안 되는 이유]\n크게 벌이면 돈보다 부담이 먼저 붙는다. 손님이 생기기도 전에 월세, 인건비, 재고, 광고비가 빠지면 네 일운은 눌린다.`,
      `[피해야 할 일과 사람]\n${career.warning}\n\n말만 많고 책임을 미루는 사람, 받을 돈이 흐린 일, 결과 없이 바쁘기만 한 일은 피해야 한다.`,
      `[일이 움직이는 시기]\n일은 한 번에 바뀌기보다 작은 주문, 소개, 재요청에서 움직인다. 갑자기 크게 갈아타기보다 먼저 돈이 실제로 들어오는 일을 잡아라.`,
      `[일·사업운 마지막 판정]\n최종 판정은 이거다. 너는 직장에만 묻혀 끝날 사주는 아니다. 그렇다고 바로 크게 창업할 사주도 아니다. 부업, 작은 주문, 반복으로 다시 찾는 일을 먼저 만들고, 그게 돈으로 확인될 때 키워야 한다.`,
    ]);
  }

  if (categoryId === "love" || title.includes("연애")) {
    const loveTiming = getLoveTimingProfile(manse);
    const lovePartner = getLovePartnerProfile(manse);
    const relationship = getRelationshipProfile(manse, "love");
    const loveMarriageTimeline = getLoveMarriageLifetimeTimingV218(user, manse, fortuneSeed);
    const { wood, fire, earth, metal, water } = getElementSnapshot(manse);

    const strongElement =
      [
        ["목", wood],
        ["화", fire],
        ["토", earth],
        ["금", metal],
        ["수", water],
      ].sort((a: any, b: any) => Number(b[1]) - Number(a[1]))[0]?.[0] || "오행";
    const weakElement =
      [
        ["목", wood],
        ["화", fire],
        ["토", earth],
        ["금", metal],
        ["수", water],
      ].sort((a: any, b: any) => Number(a[1]) - Number(b[1]))[0]?.[0] || "오행";

    const type = safeText(lovePartner.type || relationship?.type, "신중하게 마음을 여는 연애운");
    const good = safeText(lovePartner.good, "말과 행동이 일치하고 관계를 서두르지 않는 사람");
    const avoid = safeText(lovePartner.avoid, "확답을 피하고 관계를 애매하게 끄는 사람");
    const jobs = safeText(lovePartner.jobs, "생활 리듬이 안정적이고 자기 일을 꾸준히 하는 사람");
    const reason = safeText(lovePartner.reason, "마음이 붙는 속도와 관계가 안정되는 속도가 같지 않기 때문이다.");
    const check = safeText(lovePartner.check, "연락 방식, 약속, 갈등 뒤 회복 태도");
    const chance = safeText(loveTiming.chance, "올해 인연운은 천천히 열리는 편이다.");
    const timing = safeText(loveTiming.timing, "올해 중반 전후");
    const timingReason = safeText(loveTiming.reason, "익숙한 생활권과 반복해서 마주치는 관계에서 인연이 살아나기 쉽다.");

    return long([
      `[연애운 첫 판정]
결론부터 말하면, ${user.name || "너"}, 네 연애운은 '${type}'으로 본다.

${chance} 인연이 강하게 움직이기 쉬운 시기는 ${timing}다. 올해 연애운은 아무 사람이나 많이 만나는 쪽보다, 사람을 보는 기준을 분명히 하고 실제 행동이 꾸준한 사람을 골라낼 때 살아난다.

잘 맞는 사람은 ${good}이다. 반대로 ${avoid}은 초반에 마음을 흔들 수 있어도 오래 가면 네 쪽의 피로가 커진다.

잘 맞는 상대의 직업·생활 분위기는 ${jobs}이다. 직업 이름 자체가 운명을 정한다는 뜻이 아니라, 자기 생활이 있고 약속과 책임을 꾸준히 지키는 분위기가 네 연애운과 맞는다는 뜻이다.`,

      `[나는 어떤 연애를 하는 사람인가]
너는 마음이 생겼다고 바로 전부 보여주는 쪽보다, 상대를 충분히 보고 안전하다고 느껴져야 깊게 들어가는 쪽이다. ${reason}

${strongElement} 기운이 강하게 잡힌 부분은 연애에서도 장점으로 작동한다. 한 번 내 사람이라고 판단하면 쉽게 버리지 않고, 관계를 현실적으로 지키려는 힘이 생긴다. 그래서 가벼운 호감보다 신뢰가 쌓인 관계에서 네 장점이 더 잘 드러난다.

반대로 ${weakElement} 기운이 약하게 잡힌 부분은 마음을 표현하는 방식이나 관계의 속도에서 약점으로 나타날 수 있다. 좋아하는 마음이 있어도 상대가 알아서 이해해주길 기다리거나, 불편한 일이 생겼을 때 말을 늦추면 상대는 네 마음을 다르게 해석할 수 있다.

네 연애는 '좋아하느냐' 하나보다 ${check}을 실제로 확인해야 오래 간다.`,

      `[내가 실제로 끌리는 사람]
네가 실제로 오래 눈이 가는 사람은 ${good}이다. 처음부터 화려하게 밀어붙이는 사람보다, 몇 번 만나도 태도가 크게 달라지지 않고 말과 행동이 맞는 사람에게 마음이 붙는 편이다.

특히 ${jobs} 같은 분위기를 가진 사람에게 안정감을 느끼기 쉽다. 여기서 중요한 것은 특정 직업명이 아니라 생활 패턴이다. 자기 할 일을 꾸준히 하고, 약속을 지키고, 연락과 만남의 기준이 지나치게 들쭉날쭉하지 않은 사람이 맞는다.

처음에는 재미있고 자극적인 사람이 더 눈에 들어올 수 있어도, 실제 연애가 길어질수록 네가 원하는 것은 편안함과 신뢰다. 그래서 첫인상의 강한 끌림과 오래 갈 사람을 같은 기준으로 고르면 안 된다.`,

      `[내가 연애에서 약해지는 순간]
네가 가장 약해지는 순간은 상대가 확실히 잡아주지는 않으면서 기대는 계속 남겨둘 때다. ${avoid}에게 끌리면 관계를 확인하기 위해 네가 더 많이 생각하고 더 오래 기다리는 구조가 생길 수 있다.

연락 한 번, 말 한마디보다 중요한 것은 반복되는 태도다. 답이 늦었다는 사실 하나보다 연락이 끊긴 뒤 어떻게 회복하는지, 불편한 질문을 했을 때 피하는지 답하는지, 약속을 바꿨을 때 설명과 책임이 있는지를 봐야 한다.

특히 네가 이미 마음을 많이 준 뒤에는 상대의 애매한 행동을 좋게 해석하려는 쪽으로 기울 수 있다. 이때는 감정보다 ${check}을 기준으로 사람을 다시 봐야 한다.`,

      `[상대가 나에게 빠지는 지점]
상대가 네게 붙는 가장 큰 이유는 처음의 화려함보다 시간이 지나면서 보이는 안정감이다. 약속한 것을 지키고, 상대가 한 말을 기억하고, 필요할 때 현실적으로 챙겨주는 모습이 쌓일수록 매력이 커진다.

너는 관계가 깊어질수록 책임감이 보이는 타입이라 처음보다 두 번째, 세 번째 만남에서 평가가 좋아지기 쉽다. 가볍게 분위기만 만드는 사람보다 '이 사람은 믿어도 되겠다'는 느낌을 줄 때 연애운이 살아난다.

다만 마음을 너무 늦게 보여주면 이 장점이 상대에게 전달되기 전에 관계가 식을 수 있다. 좋아하면 좋아한다는 표시, 보고 싶으면 만나자는 말처럼 최소한의 확신은 직접 보여주는 편이 좋다.`,

      `[상대가 나에게 질리는 지점]
상대가 지치는 지점은 네가 마음을 닫은 뒤 이유를 충분히 설명하지 않을 때다. 너는 속으로 이미 여러 번 생각한 뒤 거리를 두지만, 상대 입장에서는 갑자기 차가워졌다고 느낄 수 있다.

또 관계를 지키려는 책임감이 강해질수록 '내가 이만큼 했으니 상대도 이 정도는 해야 한다'는 기준이 생길 수 있다. 그 기준을 말하지 않은 채 상대가 알아주기를 기다리면 서운함이 쌓인다.

연애에서 필요한 것은 참는 시간이 아니라 기준을 말하는 시간이다. 연락, 약속, 돈, 이성 친구, 혼자 쉬는 시간처럼 반복해서 부딪힐 수 있는 문제는 초반부터 네 기준을 말해야 한다.`,

      `[내 연애가 반복해서 꼬이는 이유]
반복해서 꼬이는 이유는 마음이 없는 것이 아니라 확인이 늦기 때문이다. 상대를 충분히 본다는 장점이 있지만, 애매한 관계에서도 너무 오래 판단만 하면 상대가 관계를 자기 편한 방식으로 끌고 갈 수 있다.

네가 사람을 볼 때 가장 먼저 확인해야 할 것은 말의 달콤함이 아니다. ${check}이다. 이 기준에서 계속 어긋나는 사람은 시간이 지나도 같은 문제를 반복할 가능성이 높다.

반대로 처음에는 표현이 화려하지 않아도 행동이 꾸준하고 불편한 대화를 피하지 않는 사람은 시간이 갈수록 맞는 쪽으로 들어온다. 네 연애는 첫날의 강도보다 한 달 뒤에도 같은 태도인지가 더 중요하다.`,

      `[나와 오래 가는 사람]
오래 가는 사람은 ${good}이다. 네 생활을 존중하면서도 관계를 방치하지 않고, 문제가 생겼을 때 잠수하거나 피하기보다 대화를 다시 여는 사람이 맞는다.

${jobs} 같은 생활 분위기도 잘 맞는다. 서로 자기 일이 있으면서 만날 시간을 정하고, 돈과 시간 약속을 분명히 하고, 각자의 생활을 무너뜨리지 않는 관계가 편하다.

무엇보다 네가 모든 것을 설명하지 않아도 알아주는 사람을 찾기보다, 서로 묻고 답할 수 있는 사람을 골라야 한다. 네 연애운은 '눈치가 잘 맞는 관계'보다 '대화로 맞춰갈 수 있는 관계'에서 오래 간다.`,

      `[피해야 할 사람]
피해야 할 사람은 ${avoid}이다. 초반에 호감 표현은 강한데 관계를 정의하는 순간 뒤로 빠지거나, 자기 기분에 따라 연락과 약속이 달라지는 사람은 네 마음을 오래 소모시킨다.

특히 불편한 질문을 하면 농담으로 넘기고, 약속을 어긴 뒤 설명보다 핑계를 먼저 대고, 연락이 끊긴 뒤 아무 일 없었다는 듯 돌아오는 패턴은 가볍게 넘기지 마라.

네가 확인해야 할 기준은 ${check}이다. 이 기준에서 반복해서 걸리는 사람은 '조금 더 기다리면 달라질 사람'보다 '같은 문제를 다시 만들 사람'으로 보는 편이 맞다.`,

      `[인생 전체에서 연인운이 강하게 들어오는 때]
네 인생에서 연인운이 강하게 들어오는 구간은 세 번으로 본다.

1차는 ${loveMarriageTimeline.loveWindows[0].ageLabel}, 연도로는 ${loveMarriageTimeline.loveWindows[0].yearLabel}다.
2차는 ${loveMarriageTimeline.loveWindows[1].ageLabel}, ${loveMarriageTimeline.loveWindows[1].yearLabel}다.
3차는 ${loveMarriageTimeline.loveWindows[2].ageLabel}, ${loveMarriageTimeline.loveWindows[2].yearLabel}다.

현재 나이 기준으로 다시 보면 다음 핵심 인연 구간은 ${loveMarriageTimeline.nextLoveWindow.ageLabel}, ${loveMarriageTimeline.nextLoveWindow.yearLabel}다. 이미 지난 구간은 그때 실제로 사람관계가 크게 움직였는지 돌아보는 시기이고, 앞으로의 구간은 새 인연·기존 인연의 관계 전환을 적극적으로 볼 시기다.

네 기본 연애 성향은 '${type}'이므로 인연이 들어오는 시기와 관계가 확정되는 시기가 항상 같지는 않다. 강한 시기에는 ${check}을 기준으로 실제로 이어질 사람을 골라야 한다.`,

      `[내 인생에서 결혼운이 가장 강한 때]
결혼운은 연애운과 따로 계산한다.

첫 번째 결혼운 구간은 ${loveMarriageTimeline.marriageWindows[0].ageLabel}, ${loveMarriageTimeline.marriageWindows[0].yearLabel}다.
두 번째 결혼운 구간은 ${loveMarriageTimeline.marriageWindows[1].ageLabel}, ${loveMarriageTimeline.marriageWindows[1].yearLabel}다.
그중 결혼운이 가장 강하게 잡히는 핵심 구간은 ${loveMarriageTimeline.marriagePeak.ageLabel}, ${loveMarriageTimeline.marriagePeak.yearLabel}다.

현재 나이 기준으로 앞으로 다시 강하게 보는 결혼운은 ${loveMarriageTimeline.nextMarriageWindow.ageLabel}, ${loveMarriageTimeline.nextMarriageWindow.yearLabel}다.

혼자라면 이 구간은 배우자감이 될 사람을 만나는 흐름으로 보고, 연인이 있다면 결혼·동거·가족 논의처럼 관계를 현실화하는 흐름으로 본다. 이미 결혼했다면 배우자 관계와 공동생활의 중요한 전환기로 해석한다. 상대는 ${good} 쪽이 맞고, ${avoid}의 패턴은 결혼으로 갈수록 피로를 키우기 쉽다.`,

      `[올해 연애운과 결혼운]
올해 연애운이 강하게 움직이는 시기는 ${loveMarriageTimeline.thisYear.loveTiming}다.
올해 결혼운이 현실적으로 움직이는 시기는 ${loveMarriageTimeline.thisYear.marriageTiming}다.

두 흐름이 가장 강하게 겹치는 핵심 달은 ${loveMarriageTimeline.thisYear.peakMonth}월이다. 관계를 한 단계 진전시키거나 현실적인 이야기를 꺼내기 좋은 달은 ${loveMarriageTimeline.thisYear.progressMonth}월로 본다. 반대로 관계를 성급하게 결론내리거나 감정적으로 판단하지 말아야 할 주의 달은 ${loveMarriageTimeline.thisYear.cautionMonth}월이다.

${chance} ${timingReason}

혼자라면 강한 달에 소개·재접점·반복해서 마주치는 사람을 유심히 보고, 관계가 있다면 그 시기에 관계 정의·생활 계획·결혼 이야기가 실제 행동으로 이어지는지를 봐야 한다. 올해는 인연의 숫자보다 ${check}이 안정적으로 맞는 사람이 실제 결혼운으로 이어질 가능성이 높다.`,

      `[연애운 마지막 판정]
네 연애운의 핵심은 '${type}'이다. 빨리 불붙는 관계보다 신뢰가 쌓이면서 마음이 깊어지는 관계가 맞는다.

잘 맞는 사람은 ${good}, 피해야 할 사람은 ${avoid}이다. 사람을 고를 때는 ${check}을 끝까지 봐야 한다.

올해 인연운은 ${timing}에 특히 움직이기 쉽다. 그때 들어오는 사람 중에서 말보다 행동이 꾸준하고, 관계를 애매하게 끌지 않고, 네 생활과 속도를 존중하는 사람을 잡아라. 반대로 설렘은 큰데 책임과 확답이 흐린 사람은 오래 볼수록 네 쪽이 지친다.

결국 네 연애운을 살리는 기준은 강한 자극이 아니라 '시간이 지나도 태도가 같은 사람인가'다. 그 기준을 지키면 올해 인연운을 허투루 쓰지 않는다.`,
    ]);
  }

  if (categoryId === "compatibility" || title.includes("궁합")) {
    if (!partnerManse) {
      return `[궁합운 안내]\n궁합운은 상대 생년월일이 있어야 제대로 열린다. 상대 정보를 넣지 않으면 두 사람의 궁합 점수, 상대 취향, 속궁합, 연애·결혼 궁합, 계속 만나도 되는지 판정할 수 없다.`;
    }

    // V220: 기존에 이미 설계되어 있던 상세 궁합 리포트를 실제 fallback 경로로 복원한다.
    // 점수/취향/끌림/충돌/속궁합/연애 지속성/결혼 생활/최종 판정을 모두 포함한다.
    return buildStrongCompatibilityFullReport(user, manse, partnerManse);
  }

  if (categoryId === "marriage" || title.includes("결혼")) {
    return long([
      `[결혼운 첫 판정]\n${fixed}\n\n결혼운은 연애 설렘과 다르다. 같이 살면 돈, 가족, 말투, 생활 습관이 먼저 나온다.`,
      `[내 사주상 분석]\n이 사주는 좋아하는 마음만 보고 결혼하면 피곤해질 수 있다. 생활이 일정하고 돈 쓰는 방식이 깔끔한 사람과 맞는다.`,
      `[결혼운이 움직이는 시기]\n${marriage.timing}\n\n이 시기는 현재 나이가 아니라 결혼운이 움직이는 구간이다.`,
      `[맞는 배우자 유형]\n약속을 지키고, 돈을 함부로 쓰지 않고, 가족과 부부 사이 선을 아는 사람이 맞다. 말만 다정한 사람보다 생활이 일정한 사람이 낫다.`,
      `[피해야 할 배우자 유형]\n말은 뜨겁지만 돈과 책임이 흐린 사람, 가족 문제를 부부 사이보다 앞세우는 사람은 피해야 한다.`,
      `[결혼 후 돈 문제]\n결혼 후에는 돈 쓰는 방식이 중요하다. 한쪽은 아끼고 한쪽은 기분으로 쓰면 사랑보다 피로가 먼저 쌓인다.`,
      `[결혼 후 가족 거리]\n가족과의 거리가 흐리면 결혼 후 외로워진다. 배우자를 먼저 세우는 사람이 맞다.`,
      `[결혼 후 말투와 생활 습관]\n화났을 때 말투와 쉬는 방식이 맞아야 오래 간다. 사소한 말투가 반복되면 정이 식는다.`,
      `[결혼하면 편해지는 사람]\n생활이 일정하고, 돈 약속이 분명하고, 불편한 말을 피하지 않는 사람이 편하다.`,
      `[결혼하면 더 외로워지는 사람]\n밖에서는 다정하지만 집 안 책임에서 빠지는 사람은 외롭다.`,
      `[결혼운 마지막 판정]\n최종 판정은 이거다. 결혼은 가능하다. 다만 설렘보다 생활을 봐야 한다. 돈, 가족, 말투가 맞는 사람과 가야 편해진다.`,
    ]);
  }

  if (isMonthlyCategory(categoryId, title)) {
    return buildYearFullReportV202({
      user,
      manse,
      fortuneSeed: hashToSeed(stableStringify({ user, manse, categoryId, logic: "year-full-v202" })),
    });
  }

  // V223: 인생대운은 AI 생성이 실패해도 generic placeholder로 떨어지지 않는다.
  // 기존에 완성되어 있던 인생대운 본문 + V222 상단 대운 타임라인을 그대로 사용한다.
  if (
    categoryId === "lifeFlow" ||
    title.includes("인생대운") ||
    title.includes("대운")
  ) {
    return buildV85LifeFlowFullReport(user, manse);
  }

  if (
    categoryId === "traditional" ||
    title.includes("평생종합") ||
    title.includes("평생")
  ) {
    return cleanTraditionalCustomerTextV230(buildV85TraditionalFullReport(user, manse));
  }

  // 기타 카테고리는 AI 실패 시에도 최소한 페이지가 열리도록 구조를 만든다.
  return long(getAllowedFullSectionTitles(categoryId, categoryTitle).split(/\n/).map((raw, idx) => {
    const t = stripSectionTitle(raw);
    return `[${t}]\n${idx === 0 ? fixed + "\n\n" : ""}${t}에 대해 사주 기준으로 자세히 풀어본다. 한 줄로 끝낼 내용이 아니다. 실제 생활에서 어디서 드러나는지, 무엇을 잡고 무엇을 피해야 하는지까지 봐야 한다.`;
  }));
}


function buildHealthExpansionPromptV182(params: {
  originalPrompt: string;
  firstDraft: string;
}) {
  return `${params.originalPrompt}

[중요: 1차 초안이 유료 건강운 기준보다 너무 짧아서 전면 확장한다]
아래 1차 초안의 판정과 개인 사주 근거는 유지하되, 문장을 복사하거나 같은 말을 반복하지 말고 완성된 건강운 유료 리포트 전체를 처음부터 다시 작성해라.

절대 조건:
- 최종 출력은 한국어 최소 8,000자, 권장 9,000~12,000자다.
- 12개 건강운 제목을 하나도 빼지 마라.
- 각 섹션은 이 사람의 만세력 근거와 연결된 서로 다른 내용을 가져야 한다.
- 고비 나이와 올해 주의 달은 1차 초안/내부 개인 기준과 모순시키지 마라.
- 보편적인 건강상식만 늘어놓지 마라. '이 사람은 왜 그런가'를 계속 설명해라.
- 질병을 진단하거나 발병을 확정하지 마라.
- 마지막 판정은 최소 900자 이상으로 충분히 회수해라.
- '추가 설명', '보강본' 같은 표현 없이 바로 완성 리포트만 출력해라.

[1차 초안]
${params.firstDraft}`;
}

async function generateText(prompt: string, maxTokens: number, seed: number) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: prompt },
    ],
    temperature: 0.35,
    top_p: 0.92,
    seed,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

function buildWorrySafeSystemPromptV161() {
  return `${buildSystemPrompt()}

[내 고민 상담 안전 출력 규칙 v162]
- 사용자의 고민은 운세 앱 안의 선택 상담이다. 실제 의료·법률·투자 확정 판단, 죽음 예언, 위험 행동 지시를 하지 않는다.
- 장례식, 죽음, 건강, 가족, 돈, 직장, 연애, 이별, 재회, 짝사랑, 부부, 결혼 전 관계 고민이 들어와도 거절문으로 끝내지 말고 안전한 현실 선택 상담으로 답한다.
- "죄송하지만", "처리할 수 없습니다", "도와드릴 수 없습니다", "전문가에게 문의" 같은 거절문만 출력하지 마라.
- 위험하거나 민감한 내용은 공포·예언·단정 대신 현실적 행동 기준, 경계선, 연락 문구, 확인할 조건으로 풀어라. 연애 상담은 성적 노골 묘사 없이 관계 방향, 연락, 태도, 거리, 재회 여부, 끊을지 붙잡을지로 답한다.
- 자해, 타해, 불법행위 요청이 아닌 일반 고민 상담은 반드시 한국어 완성 리포트로 답한다.`;
}

async function generateWorryTextV152(prompt: string, maxTokens: number, seed: number) {
  const completion = await client.chat.completions.create({
    model: WORRY_MODEL,
    messages: [
      { role: "system", content: buildWorrySafeSystemPromptV161() },
      { role: "user", content: prompt },
    ],
    temperature: 0.32,
    top_p: 0.9,
    seed,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

function getPreviewMaxTokens(categoryId: CategoryId) {
  if (categoryId === "traditional") return 2300;
  if (categoryId === "premium") return 2300;
  if (categoryId === "monthly") return 2300;
  return 2100;
}

function getFullMaxTokens(categoryId: CategoryId) {
  // 유료 결과는 짧은 카드가 아니라 긴 본문 리포트다.
  // gpt-4o-mini 계열의 안전한 출력 한도 안에서 최대한 길게 받는다.
  if (categoryId === "health") return 16000;
  if (categoryId === "traditional") return 16000;
  if (categoryId === "premium") return 16000;
  if (categoryId === "worry") return 16000;
  if (categoryId === "today") return 9000;
  if (categoryId === "monthly") return 14000;
  if (categoryId === "lifeFlow") return 14000;
  if (categoryId === "children") return 14000;
  return 14000;
}

type ComicChapter = {
  id: string;
  sceneType:
    | "entrance"
    | "mind"
    | "personality"
    | "core"
    | "warning"
    | "blessing"
    | "detail"
    | "timing"
    | "lock"
    | "final";
  speaker: "dohoon" | "narration" | "badLuckGhost" | "fortuneSpirit";
  character:
    | "dohoon"
    | "dohoon-serious"
    | "dohoon-pointing"
    | "dohoon-warning"
    | "dohoon-smile"
    | "dohoon-blessing"
    | "user-shadow"
    | "bad-luck-ghost"
    | "fortune-spirit";
  emotion: "normal" | "serious" | "pointing" | "warning" | "smile" | "shock";
  mood: "dark" | "redDark" | "gold" | "mist" | "paper" | "black";
  title: string;
  text: string;
  visualHint: string;
  isLocked?: boolean;
  ctaText?: string;
};

type ComicMode = "preview" | "full";
type TodayTone = "good" | "caution" | "mixed";

type WebtoonCategoryScript = {
  opening: string;
  bigLuckTitle: string;
  bigLuckText: string;
  twistTitle: string;
  twistText: string;
  blockedTitle: string;
  blockedText: string;
  ghostTitle: string;
  ghostText: string;
  blessingTitle: string;
  blessingText: string;
  detailA: string;
  detailB: string;
  timing: string;
  people: string;
  money: string;
  body: string;
  yearCaution: string;
  yearChance: string;
  avoid: string;
  choose: string;
  final: string;
  mood: ComicChapter["mood"];
};

function compactComicText(value: string, fallback = "") {
  const cleaned = cleanGeneratedText(String(value || ""))
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/^[-•]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  const text = cleaned || fallback;
  if (text.length <= 320) return text;
  const head = text.slice(0, 320);
  const stops = [head.lastIndexOf("다."), head.lastIndexOf("요."), head.lastIndexOf("야."), head.lastIndexOf("다!"), head.lastIndexOf("다?")];
  const cut = Math.max(...stops);
  if (cut >= 120) return head.slice(0, cut + 2).trim();
  return text;
}

function stripSectionTitle(value: string) {
  return String(value || "")
    .replace(/궁합판/g, "궁합운")
    .replace(/현재 나이(?:는|가)?\s*39세/g, "39세 전후 재물운 구간")
    .replace(/현재 나이(?:는|가)?\s*40세/g, "40세 전후 재물운 구간")
    .replace(/현재 나이(?:는|가)?\s*41세/g, "41세 전후 재물운 구간")
    .replace(/현재 나이(?:는|가)?\s*42세/g, "42세 전후 재물운 구간")
    .replace(/현재 나이(?:는|가)?\s*43세/g, "43세 전후 재물운 구간")
    .replace(/돈복/g, "재물운")
    .replace(/일복/g, "일·사업운")
    .replace(/오늘의 운/g, "오늘운세")
    .replace(/올해판/g, "올해운세")
    .replace(/대운판/g, "인생대운")
    .replace(/평생사주/g, "평생종합사주")
    .replace(/네 판단이 들어가는 일/g, "사람 만나고 주문 받고 팔고 챙기는 일")
    .replace(/네 몫이 남는 자리/g, "하루 종일 바빴는데 통장에 남는 돈이 있는 일")
    .replace(/네 몫/g, "남는 돈")
    .replace(/역할값/g, "받을 돈")
    .replace(/자기판/g, "작은 주문부터 시작하는 일")
    .replace(/돈의 입구와 출구/g, "돈이 들어오기 전에 먼저 빠지는 돈")
    .replace(/^\s*\[|\]\s*$/g, "")
    .replace(/^#+\s*/g, "")
    .trim();
}

function extractComicSections(resultText: string) {
  const text = cleanGeneratedText(resultText || "");
  const sectionRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=\n\[[^\]]+\]|$)/g;
  const sections: { title: string; body: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = stripSectionTitle(match[1]);
    const body = compactComicText(match[2] || "");
    if (!title || !body) continue;
    if (/내부|규칙|고정|만세력|프롬프트|AI는|절대/.test(title + body)) continue;
    sections.push({ title, body });
  }

  if (sections.length > 0) return sections;

  return text
    .split(/\n{2,}/)
    .map((body, index) => ({
      title: index === 0 ? "도훈의 첫 판정" : `사주 장면 ${index + 1}`,
      body: compactComicText(body),
    }))
    .filter((item) => item.body)
    .slice(0, 12);
}

function getTodayTone(params: {
  user: UserInfo;
  manse: any;
  fortuneSeed?: number;
}): TodayTone {
  const seed =
    Number(params.fortuneSeed || 0) ||
    hashToSeed(
      stableStringify({
        year: safeText(params.user.year),
        month: safeText(params.user.month),
        day: safeText(params.user.day),
        birthTime: safeText(params.user.birthTime, "모름"),
        manse: params.manse,
        logic: "today-tone-webtoon-v1",
      }),
    );

  const snap = getElementSnapshot(params.manse);
  let score = seed % 9;
  if (snap.fire >= 2 || snap.wood >= 2) score += 1;
  if (snap.fire === 0 || snap.earth >= 4) score -= 1;
  if (score >= 7) return "good";
  if (score <= 2) return "caution";
  return "mixed";
}

function getTodayScript(tone: TodayTone): WebtoonCategoryScript {
  if (tone === "good") {
    return {
      opening: "어? 오늘 운 괜찮은데?",
      bigLuckTitle: "작은 복이 먼저 보인다",
      bigLuckText:
        "오늘은 네가 억지로 크게 밀지 않아도 말, 연락, 제안, 작은 돈 이야기 중 하나가 슬쩍 붙을 수 있다.",
      twistTitle: "근데 크게 떠들 운은 아니다",
      twistText:
        "오늘 복은 조용히 잡아야 오래 간다. 말이 많아지면 좋은 흐름이 가벼워진다.",
      blockedTitle: "오늘 막히는 자리",
      blockedText:
        "기분 좋아서 바로 답하거나, 바로 쓰거나, 바로 약속 잡는 순간 운이 얇아진다. 한 박자 늦게 잡아야 산다.",
      ghostTitle: "성급한말귀신",
      ghostText:
        "오늘 붙는 건 나쁜 운이 아니라 성급한 반응이다. 좋은 말도 빨리 나가면 힘이 빠진다.",
      blessingTitle: "오늘의 작은 복",
      blessingText:
        "필요한 말만 하고, 돈은 늦게 쓰고, 오는 연락은 가볍게 받으면 오늘 운은 꽤 괜찮게 열린다.",
      detailA:
        "오늘은 사람 말 속에 작은 힌트가 있다. 흘려듣지 말고, 바로 결정하지도 마라.",
      detailB:
        "돈은 크게 벌 날이라기보다 새 지출을 막고 작은 이득을 챙기는 날이다.",
      timing:
        "오전보다 오후 쪽에 말과 연락 운이 더 살아난다. 저녁엔 피곤한 약속을 줄여라.",
      people:
        "가볍게 만나는 사람보다 필요한 말만 주고받는 사람이 오늘 복을 준다.",
      money:
        "충동구매는 약하다. 대신 밀린 정리, 받을 돈 확인, 작은 계산에는 운이 붙는다.",
      body: "몸은 크게 무너지지 않아도 피로가 늦게 올라온다. 저녁에 무리하면 내일로 넘어간다.",
      yearCaution:
        "오늘 조심할 건 과한 확신이다. 느낌이 좋다고 바로 확정하지 마라.",
      yearChance:
        "오늘 잡을 건 작은 연락, 작은 정리, 작은 확인이다. 여기서 운이 붙는다.",
      avoid:
        "바로 답장하기, 바로 결제하기, 기분 좋아서 약속 늘리기. 이 세 개는 피하는 게 낫다.",
      choose:
        "필요한 말만 하고, 돈은 한 번 미루고, 사람 반응은 한 박자 늦게 봐라.",
      final:
        "오늘은 크게 이기는 날이 아니라, 작게 잡아도 남는 날이다. 조용히 잡으면 괜찮다.",
      mood: "gold",
    };
  }

  if (tone === "caution") {
    return {
      opening: "어? 오늘은 그냥 넘기면 안 되겠는데?",
      bigLuckTitle: "나쁜 날로만 보면 안 된다",
      bigLuckText:
        "오늘은 운이 없어서 막히는 날이 아니다. 작은 선택 하나가 커지는 날이다.",
      twistTitle: "먼저 새는 구멍이 보인다",
      twistText:
        "말 한마디, 작은 지출, 괜한 눈치. 여기서 오늘 운이 샐 수 있다.",
      blockedTitle: "오늘 막히는 자리",
      blockedText:
        "급하게 답하고, 급하게 쓰고, 사람 기분 맞추려고 내 리듬을 깨면 하루가 꼬인다.",
      ghostTitle: "작은악운귀신",
      ghostText:
        "오늘 악운은 크게 오지 않는다. 작게 붙어서 크게 피곤하게 만든다.",
      blessingTitle: "막으면 사는 운",
      blessingText:
        "오늘은 뭘 얻는 날보다 새는 걸 막는 날이다. 안 건드리면 오히려 편하게 지나간다.",
      detailA:
        "말은 짧게 가라. 설명을 길게 하면 상대가 다르게 받아들이기 쉽다.",
      detailB:
        "돈은 지금 꼭 써야 하는 것만 써라. 기분 따라 나가는 돈은 남는 게 없다.",
      timing:
        "오전엔 말조심, 오후엔 돈조심, 저녁엔 피로조심이다. 하루가 뒤로 갈수록 몸이 무거워질 수 있다.",
      people:
        "오늘은 말 많은 사람, 부탁 많은 사람, 감정이 앞서는 사람을 가볍게 넘겨라.",
      money:
        "큰돈을 움직일 날은 아니다. 예약, 결제, 약속금, 빌려주는 돈은 한 번 더 늦춰라.",
      body: "소화, 목어깨, 두통, 잠 부족 쪽 신호를 넘기지 마라. 몸이 먼저 브레이크를 건다.",
      yearCaution:
        "오늘 조심할 건 사람 말에 끌려가는 선택이다. 네 리듬이 깨지는 순간 운이 빠진다.",
      yearChance: "오늘 잡을 건 정리다. 정리만 잘해도 내일 운이 덜 막힌다.",
      avoid:
        "급한 답장, 충동 지출, 감정 섞인 약속, 무리한 야식. 오늘은 이 네 개가 약하다.",
      choose:
        "늦게 답하고, 늦게 쓰고, 짧게 말하고, 일찍 쉬어라. 그게 오늘 복을 지키는 방식이다.",
      final:
        "오늘은 겁먹을 날은 아니다. 다만 건드리면 꼬이는 날이다. 안 건드리면 산다.",
      mood: "black",
    };
  }

  return {
    opening: "어? 오늘 운이 묘하다.",
    bigLuckTitle: "복도 있고 구멍도 있다",
    bigLuckText: "오늘은 좋은 흐름 하나와 새는 구멍 하나가 같이 붙어 있다.",
    twistTitle: "잡는 손보다 새는 손",
    twistText:
      "기회는 보이는데, 말이나 돈에서 한 번 삐끗하면 좋은 운이 얇아진다.",
    blockedTitle: "오늘 갈리는 자리",
    blockedText:
      "연락 하나가 기회가 될 수도 있고, 말 한마디가 피곤함이 될 수도 있다. 돈도 마찬가지다.",
    ghostTitle: "갈림길귀신",
    ghostText:
      "오늘은 운이 한쪽으로만 가지 않는다. 네 반응에 따라 복이 되거나 피곤함이 된다.",
    blessingTitle: "잡을 수 있는 복",
    blessingText:
      "필요한 건 잡고, 감정 섞인 건 넘겨라. 오늘은 구분하는 사람이 이긴다.",
    detailA:
      "오늘 들어오는 말과 연락은 바로 믿지 말고 한 번 걸러라. 그 안에 쓸 만한 힌트가 있다.",
    detailB:
      "돈은 작은 이득과 작은 지출이 같이 보인다. 남기는 쪽을 먼저 봐야 한다.",
    timing:
      "점심 전후로 한 번 흐름이 바뀐다. 오전에 꼬였어도 오후에 풀릴 수 있고, 반대로 방심하면 오후에 샌다.",
    people:
      "오늘은 가까운 사람보다 애매한 사람이 더 피곤하게 만들 수 있다. 선을 흐리지 마라.",
    money:
      "작은 돈이라도 기분 따라 쓰면 아깝다. 받을 것, 확인할 것, 미룰 것을 나눠라.",
    body: "몸은 버티지만 신경이 예민해질 수 있다. 카페인, 야식, 늦은 화면은 줄여라.",
    yearCaution:
      "오늘 조심할 건 애매한 약속이다. 확실하지 않은 말에 네 시간을 내주지 마라.",
    yearChance:
      "오늘 잡을 건 필요한 연락, 필요한 정리, 필요한 확인이다. 이 셋이 오늘의 복이다.",
    avoid:
      "애매한 사람에게 오래 답하기, 필요 없는 돈 쓰기, 감정으로 일정 바꾸기. 이건 피하자.",
    choose:
      "말은 반만 하고, 결정은 하루 미루고, 돈은 필요한 데만 써라. 그러면 복 쪽으로 기운다.",
    final:
      "오늘은 운이 없는 날이 아니다. 복과 구멍이 같이 있다. 구멍만 막으면 괜찮게 지나간다.",
    mood: "redDark",
  };
}

function getConcreteMoneyDirection(manse: any) {
  const pattern = getMoneyPattern(manse);

  const base = {
    workAnswer:
      "회사냐 장사냐부터 정하면 틀린다. 먼저 봐야 할 건 돈 받을 사람, 받을 금액, 입금일, 네가 맡은 역할이다. 이 네 개가 보이지 않는 일은 시작하지 마라.",
    earn:
      "돈은 네가 직접 조건을 맞추고, 물건이나 서비스를 넘기고, 입금일까지 확인하는 일에서 붙는다. 돈이 어디서 들어오고 어디서 빠지는지 네 눈에 보여야 한다.",
    start:
      "처음부터 큰돈 넣지 마라. 주문이 먼저 있고 발주가 뒤에 오는 일, 월세와 재고가 먼저 묶이지 않는 일, 받을 금액과 입금일이 먼저 정해진 일부터 잡아라.",
    avoid:
      "남 말만 믿고 들어가는 투자, 친하다고 돈 섞는 동업, 받을 금액이 흐린 일, 재고·월세·광고비가 먼저 나가는 판은 버려라.",
  };

  if (pattern === "cashflow_manager") {
    return {
      workAnswer:
        "너는 회사 월급만 보고 살 사주는 아니다. 하지만 처음부터 가게 차리고 재고 안고 기다리는 장사는 버려라. 회사 안에서는 구매, 납품관리, 거래처관리, 영업관리, 물류, 품질, 현장관리처럼 단가·마진·입금일을 직접 보는 자리를 잡아라.",
      earn:
        "밖으로 돈을 만들면 B2B 납품, 구매대행, 소싱대행, 유통 중개, 기존 업체 물건을 필요한 곳에 맞춰주는 일을 잡아라. 쉽게 말하면 필요한 물건을 찾아주고, 가격 맞추고, 납기 맞추고, 중간에서 네 받을 돈을 받는 돈이다.",
      start:
        "순서는 이거다. 고정수입을 바닥에 두고, 한두 거래처에서 필요한 물건을 받아 적고, 견적 받고, 납기 맞추고, 입금일을 정해라. 주문이 먼저이고 발주가 뒤인 구조부터 잡아라.",
      avoid:
        "큰 매장, 큰 재고, 큰 광고비, 지인이 좋다 해서 들어가는 투자, 돈 받을 사람과 입금일이 흐린 일은 버려라. 돈이 들어오기 전에 먼저 빠지는 돈를 남이 쥐는 판은 손해가 먼저 붙는다.",
    };
  }

  if (pattern === "small_sales_tester") {
    return {
      workAnswer:
        "너는 장사 기운이 있다. 단, 오프라인 매장 크게 열고 월세·직원·재고부터 안는 장사는 버려라. 온라인 판매, 위탁판매, 주문 후 발주, 소량 사입처럼 팔리는지 먼저 보이는 장사를 잡아라.",
      earn:
        "돈은 사람 반응을 보고 물건을 바꾸는 데서 붙는다. 한두 품목을 올리고, 문의가 들어오는 물건만 남기고, 팔리지 않는 물건은 바로 빼라. 필요한 물건을 찾아 납품하는 작은 거래도 맞다.",
      start:
        "시작은 소량 사입, 위탁판매, 주문 후 발주다. 광고비부터 태우지 마라. 팔린 물건, 반복 문의, 남는 금액이 먼저 보여야 돈을 더 넣는다.",
      avoid:
        "유행 끝물 상품, 대량 재고, 카드값으로 버티는 장사, 월세 먼저 나가는 매장, 남들이 대박 났다는 상품은 버려라. 팔리기 전에 돈이 먼저 나가면 복보다 부담이 먼저 붙는다.",
    };
  }

  if (pattern === "skill_price_builder") {
    return {
      workAnswer:
        "너는 물건보다 기술값을 받아야 돈이 남는 사주다. 회사 안에서는 설비, 품질, 현장관리, 기술지원, 고객관리처럼 문제를 잡고 끝내는 자리를 잡아라.",
      earn:
        "밖으로 돈을 만들면 수리, 설치, 세팅, 유지보수, 정기 점검, 납품 후 사후관리, 예약제 서비스로 받아라. '이 일 해주면 얼마'가 바로 나오는 메뉴를 만들어야 돈이 남는다.",
      start:
        "처음부터 사무실 차리고 사람 쓰지 마라. 네가 직접 끝낼 수 있는 서비스 3개를 만들고 가격을 붙여라. 방문비, 작업비, 부품비, 사후관리 기한을 처음부터 정해라.",
      avoid:
        "공짜로 더 해주는 일, 지인 부탁, 돈 얘기 못 하고 몸만 쓰는 일, 끝이 없는 AS는 버려라. 잘해주기만 하면 복이 아니라 피로가 먼저 붙는다.",
    };
  }

  if (pattern === "knowledge_packager") {
    return {
      workAnswer:
        "너는 무작정 장사판으로 뛰는 사주가 아니다. 회사 안에서는 구매, 소싱, 견적비교, 기획, 운영관리, 품질관리처럼 비교하고 정리해서 돈을 아끼거나 남기는 자리를 잡아라.",
      earn:
        "밖으로 돈을 만들면 정보가 돈이 되는 일을 잡아라. 제품 비교, 견적 정리, 소싱 대행, 구매대행, 거래처 조사, 필요한 물건을 찾아 연결해주는 일이다.",
      start:
        "머릿속에만 두면 돈이 안 된다. 비교표, 견적서, 납기표, 원가표, 거래처 리스트로 꺼내라. 네 생각이 문서와 거래로 바뀌는 순간 돈길이 열린다.",
      avoid:
        "공부만 늘리고 실행 없는 것, 말만 많은 사람과 붙는 것, 돈 받을 구조 없이 정보만 퍼주는 것, 무료 상담처럼 빠지는 일은 버려라.",
    };
  }

  if (pattern === "relationship_settlement") {
    return {
      workAnswer:
        "너는 혼자 틀어박혀 하는 일보다 사람 사이에서 돈길을 보는 사주다. 회사라면 영업관리, 거래처관리, 구매, 납품, 고객관리를 잡아라.",
      earn:
        "밖으로는 중개, 소개, 대행, 납품 연결이 맞다. 물건만 올려놓는 온라인몰보다 필요한 사람과 필요한 물건을 이어주고, 수수료·납품 마진·관리비·소개비를 받는 구조를 잡아라.",
      start:
        "친분으로 시작하지 마라. 금액, 역할, 입금일, 책임 범위를 먼저 정해라. 사람복이 재물운이 되려면 정이 아니라 계약과 입금일이 있어야 한다.",
      avoid:
        "지인과 대충 시작하는 동업, 돈 나누는 기준 없는 소개, 미안해서 못 받는 돈, 좋은 사람 노릇으로 끝나는 일은 버려라. 정으로 시작한 돈은 나중에 악운으로 돌아온다.",
    };
  }

  if (pattern === "slow_asset_accumulator") {
    return {
      workAnswer:
        "너는 급하게 창업해서 한 방에 뒤집는 사주가 아니다. 회사든 사업이든 고정으로 들어오는 돈을 깔고, 늦게라도 남는 돈을 쌓는 구조를 잡아라.",
      earn:
        "회사 안에서는 관리, 운영, 구매, 품질, 현장관리처럼 오래 갈 수 있는 자리를 잡아라. 밖으로는 정기 납품, 반복 주문, 위탁, 관리대행처럼 한 번 팔고 끝나지 않는 돈을 잡아라.",
      start:
        "처음에는 작아 보여도 반복되는 돈을 잡아라. 매달 들어오는 돈, 재고가 오래 묶이지 않는 돈, 계약과 납기가 분명한 돈이 네 사주에서 커진다.",
      avoid:
        "빚내서 크게 여는 가게, 급등주식·코인 같은 한 방 돈, 남들이 뛰어든다고 따라가는 장사, 월 고정비가 먼저 커지는 판은 버려라. 이 사주는 빠른 돈보다 지키는 돈에서 커진다.",
    };
  }

  if (pattern === "high_leakage_controller") {
    return {
      workAnswer:
        "장사를 하느냐 회사에 있느냐보다 먼저 볼 게 있다. 너는 돈이 들어와도 새는 구멍을 막지 않으면 어떤 판에 있어도 남는 게 약하다.",
      earn:
        "돈은 재고 없는 판매, 예약제 서비스, 납품 연결, 구매대행, 수수료형 일에서 붙는다. 회사 안에서는 돈, 물건, 사람, 입금일을 확인하는 관리 자리에서 돈눈이 산다.",
      start:
        "먼저 돈 새는 관계를 끊어라. 그다음 작은 판에서 실제로 남는지 봐라. 팔리는 것보다 남는 것이 먼저다. 남는 금액이 안 보이면 시작하지 마라.",
      avoid:
        "정 때문에 빌려주는 돈, 지인 부탁으로 들어가는 돈, 빨리 벌겠다고 먼저 넣는 돈, 내역이 흐린 돈은 버려라. 이 네 개가 재물운을 가장 많이 막는다.",
    };
  }

  return base;
}


function getWebtoonClosingPage(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  script: WebtoonCategoryScript;
  manse: any;
  partnerManse?: any | null;
}) {
  const title = params.categoryTitle || "";
  const moneyTiming = getMoneyTimingText(params.user, params.manse);
  const moneyDirection = getConcreteMoneyDirection(params.manse);
  const career = getCareerArchetype(params.manse);
  const careerProfile = getCareerProfile(params.manse);
  const health = getHealthProfile(params.manse);
  const love = getLovePartnerProfile(params.manse);
  const loveTiming = getLoveTimingProfile(params.manse);
  const marriage = getMarriageTimingProfile(params.manse);
  const marriagePartner = getMarriagePartnerProfile(params.manse);
  const ghost = getRepeatGhostProfile(params.user, params.manse);

  if (params.categoryId === "today" || title.includes("오늘")) {
    return {
      title: "오늘 최종 판정",
      text: comicText(
        params.script.final,
        `오늘 잡을 건 이것이다. ${params.script.yearChance}`,
        `오늘 버릴 건 이것이다. ${params.script.avoid}`,
        `말은 짧게, 돈은 늦게, 사람 반응은 한 박자 뒤에 봐라. 오늘 운은 크게 맞히는 사람이 아니라 새는 구멍을 먼저 막는 사람이 이긴다.`,
      ),
    };
  }

  if (params.categoryId === "money" || title.includes("재물")) {
    const grade = getMoneyGrade(params.manse);
    return {
      title: "재물운 최종 판정",
      text: comicText(
        `재물운은 '${grade}'로 찍는다. 재물운은 있다. 문제는 재물운이 열리는 방식이 좁고, 새는 문도 같이 보인다는 것이다.`,
        `시기는 ${moneyTiming.firstMoneyAge}~${moneyTiming.firstMoneyAge + 2}세에 돈눈이 뜨고, ${moneyTiming.strongMoneyAge}~${moneyTiming.strongMoneyAge + 3}세에 돈길이 단단해진다. ${moneyTiming.assetAge}세 이후에는 빨리 버는 돈보다 지키고 쌓는 돈이 강해진다.`,
        `올해는 ${moneyTiming.moneyMoveMonth}월에 돈 이야기가 움직이고, ${moneyTiming.moneyLeakMonth}월에는 돈이 샌다. ${moneyTiming.moneyCatchMonth}월에는 다시 잡을 기회가 온다.`,
        moneyDirection.workAnswer,
        moneyDirection.earn,
        `시작은 이렇게 해라. ${moneyDirection.start}`,
        `버릴 것은 이것이다. ${moneyDirection.avoid}`,
        `최종 판정은 이거다. 너는 아무 장사나 벌려서 돈 버는 사주가 아니다. 돈이 들어오기 전에 먼저 빠지는 돈가 보이는 판, 재고가 오래 묶이지 않는 판, 네 받을 돈이 분명한 판에서 돈이 열린다.`,
      ),
    };
  }

  if (isCareerCategory(params.categoryId, title)) {
    return {
      title: "일·사업운 최종 판정",
      text: comicText(
        `일·사업 판정은 '${career.combined}'이다. 이 판정은 뒤집지 않는다. 시키는 일만 하다 끝날 사주가 아니다. 사람 만나고 주문 받고 팔고 챙기는 일과 네 역할이 들어가야 일이 산다.`,
        `회사에 있으면 ${careerProfile.action.join(", ")} 중에서 견적·단가·납기·거래처·입금일을 직접 보는 자리를 잡아라. 그냥 오래 버티는 일은 버려라.`,
        `밖으로 판을 열면 ${career.warning} 쪽은 버려라. 처음부터 돈, 책임, 사람을 크게 안는 판은 복보다 부담이 먼저 붙는다.`,
        `피할 일은 ${careerProfile.avoid.join(", ")}이다. 이 일은 이름도 몫도 남기지 않는다.`,
        `최종 판정은 이거다. 회사냐 사업이냐가 핵심이 아니다. 네가 무엇을 맡고, 얼마가 남고, 언제 돈이 들어오는지 보이는 일이냐가 핵심이다. 이 네 개가 없으면 바빠도 운이 눌린다.`,
      ),
    };
  }

  if (isLoveMarriageCategory(params.categoryId, title)) {
    return {
      title: "사랑·결혼운 최종 판정",
      text: comicText(
        `인연운은 있다. 그런데 아무나 만나서 편해지는 사주가 아니다. 마음을 흔드는 사람과 오래 가는 사람을 갈라야 한다.`,
        `올해 인연운은 이렇게 찍는다. ${loveTiming.chance}`,
        `인연 시기는 ${loveTiming.timing}이다. 결혼까지 보는 시기는 ${marriage.timing}이고, ${marriage.timingReason}`,
        `잡을 사람은 ${love.good}이다. ${love.reason}`,
        `피할 사람은 ${love.avoid}이다. 이런 사람은 처음엔 설레도 끝에 가면 네 마음만 늙힌다.`,
        `결혼으로 보면 ${marriagePartner.good}을 잡고, ${marriagePartner.avoid}은 버려라. 결혼 전에는 ${marriagePartner.check}을 반드시 확인해라.`,
        `최종 판정은 이거다. 너는 인연이 없는 사주가 아니다. 피해야 할 사람에게 먼저 흔들리는 사주다. 사람을 고르는 기준을 바꾸면 인연운이 열린다.`,
      ),
    };
  }

  if (
    isCompatibilityCategory(params.categoryId, title) ||
    isPartnerCategory(params.categoryId, title)
  ) {
    const isBusiness =
      isPartnerCategory(params.categoryId, title) ||
      params.user.compatibilityType === "사업파트너 궁합";
    const score = isBusiness
      ? getBusinessPartnerScore(params.manse, params.partnerManse || null)
      : getCompatibilityScore(params.manse, params.partnerManse || null);
    return {
      title: isBusiness ? "사업파트너 궁합 최종 판정" : "궁합 최종 판정",
      text: comicText(
        `점수는 ${score.score}점, '${score.grade}'이다. ${score.summary}`,
        isBusiness
          ? `이 관계는 친하냐보다 같이 돈을 만들 수 있느냐가 먼저다. 역할, 수익배분, 비용부담, 결정권을 흐리면 돈부터 깨진다.`
          : `끌림은 있다. 하지만 끌림과 같이 사는 운은 다르다. 말투, 돈 기준, 생활 리듬, 가족 거리감이 맞아야 오래 간다.`,
        `조심할 건 ${score.risk}이다. ${params.script.avoid}`,
        `잡을 건 ${params.script.choose}`,
        isBusiness
          ? `최종 판정은 이거다. 계약 없이 의리로 가면 깨진다. 역할과 돈 기준을 문서처럼 선명하게 잡으면 같이 갈 수 있다.`
          : `최종 판정은 이거다. 좋아하는 마음만으로 밀면 안 된다. 이 관계는 생활 기준을 맞추면 살고, 감정만 믿으면 지친다.`,
      ),
    };
  }

  if (params.categoryId === "health" || title.includes("건강")) {
    return {
      title: "건강운 최종 판정",
      text: comicText(
        `건강운은 '${getHealthGrade(params.manse)}'로 찍는다. 몸이 약해서 바로 무너지는 사주가 아니다. 버티다가 늦게 꺼지는 사주다.`,
        `먼저 잡을 신호는 ${health.type}이다. ${health.risk}`,
        `오늘부터 바꿀 건 ${health.action.join(", ")}이다. 이건 선택이 아니라 몸이 운을 받기 위한 기본값이다.`,
        `버릴 건 ${health.avoid.join(", ")}이다. 이걸 계속하면 운이 들어와도 몸이 못 받친다.`,
        `최종 판정은 이거다. 네 건강은 병명 맞히는 문제가 아니다. 잠, 소화, 피로, 목어깨 중 먼저 무너지는 자리를 잡아야 돈과 일도 오래 간다.`,
      ),
    };
  }

  if (isMonthlyCategory(params.categoryId, title)) {
    return {
      title: "올해운세 최종 판정",
      text: comicText(
        `올해는 한 줄로 끝나는 해가 아니다. 움직일 달과 멈출 달이 갈린다.`,
        `돈은 ${moneyTiming.moneyMoveMonth}월에 움직이고, ${moneyTiming.moneyLeakMonth}월에 샌다. ${moneyTiming.moneyCatchMonth}월에는 다시 잡을 문이 온다.`,
        `일은 '${career.combined}' 판정대로 움직인다. 역할과 결과가 보이는 달에는 잡고, 감정으로 벌리는 달에는 멈춰라.`,
        `사람관계는 ${params.script.people}`,
        `몸은 ${health.type}을 먼저 잡아라. 올해 몸이 무너지면 좋은 달도 못 받친다.`,
        `최종 판정은 이거다. 올해는 무조건 밀어붙이는 해가 아니다. 움직일 달에는 잡고, 새는 달에는 말·돈·사람을 줄여라.`,
      ),
    };
  }

  if (
    params.categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  ) {
    return {
      title: "인생대운 최종 판정",
      text: comicText(
        `인생대운은 전체 종합풀이가 아니다. 어느 나이대에 문이 열리고, 어느 나이대에 잘못 잡으면 꺾이는지를 보는 메뉴다.`,
        getConcreteLifeTimingSummary(params.user, params.manse),
        `큰 방향 전환은 ${getMajorLuckChanceCount(params.manse)}번 들어온다. 제일 중요한 문은 ${getMostImportantLuckPhase(params.manse)}이다. 이때 이직, 업종 변경, 거래처 변경, 거주지 변화, 사람 정리 중 하나가 실제로 움직인다.`,
        `이 시기에 잡을 신호는 분명하다. 월급만 오르는 일이 아니라 맡는 권한이 커지는 일, 거래처나 고객이 새로 붙는 일, 돈 받을 날짜와 금액이 문서로 보이는 일, 오래 끌던 사람관계가 정리되는 일이다.`,
        `이 시기에 버릴 것도 분명하다. 부탁 때문에 떠안는 일, 지인 말만 듣고 들어가는 돈, 재고·월세·광고비가 먼저 나가는 판, 입금일 없이 몸만 쓰는 일이다. 이 네 개는 대운 문 앞에서 발목을 잡는다.`,
        `인생대운 결론은 이거다. 초년이 답답했다고 평생 같은 운이 아니다. ${getMostImportantLuckPhase(params.manse)}에 들어오는 변화는 그냥 지나가면 안 된다. 그때 돈 받을 날짜, 맡는 역할, 책임 범위, 같이 가는 사람을 잘라서 고르면 판이 바뀐다.`,
      ),
    };
  }

  if (
    params.categoryId === "traditional" ||
    title.includes("평생") ||
    isChildrenCategory(params.categoryId, title)
  ) {
    return {
      title: "평생종합 최종 판정",
      text: comicText(
        `평생종합은 인생대운처럼 시기만 보는 메뉴가 아니다. 돈, 일, 사람, 몸, 가족·자식, 말년까지 한꺼번에 묶어서 보는 전체판이다.`,
        `시기부터 찍는다. 초년은 책임과 눈치가 먼저 붙고, 20대에는 방향을 찾느라 흔들린다. 30대 중반부터 돈을 보는 눈이 뜨고, 40대 초중반부터 일과 돈이 굵어진다. 말년은 새로 벌리는 운보다 지키는 돈, 몸, 사람 거리에서 편해진다.`,
        `돈은 이렇게 잡는다. ${moneyDirection.workAnswer} ${moneyDirection.earn}`,
        `회사 안에 있으면 '${career.combined}' 판정대로 간다. 그냥 오래 앉아 있는 자리가 아니다. 견적, 단가, 납기, 거래처, 입금일, 원가, 재고를 직접 보는 자리를 잡아라. 이 숫자들을 못 보는 일은 오래 해도 돈눈이 안 뜬다.`,
        `밖으로 돈을 만들면 ${moneyDirection.start} 재고를 오래 안고 기다리는 장사, 월세부터 나가는 매장, 광고비 먼저 태우는 온라인몰은 버려라. 주문, 견적, 납기, 입금일이 먼저 보이는 돈만 잡아라.`,
        `사람은 정으로 보면 망한다. ${ghost.primary}이 반복된다. ${ghost.risk} 불쌍해서 챙기는 사람, 책임을 네 쪽으로 미루는 사람, 돈과 시간을 계속 빼가는 사람은 끊어라. 가까운 사람이라도 생활비·보증·빚·감정노동을 떠넘기면 복이 아니다.`,
        `몸은 '${getHealthGrade(params.manse)}'로 찍는다. ${health.type}을 먼저 잡아라. ${health.action.join(", ")}부터 바꾸고, ${health.avoid.join(", ")}은 버려라. 네 사주는 몸을 갈아 넣어서 평생운을 여는 사주가 아니다. 몸이 무너지면 돈과 사람도 같이 샌다.`,
        `가족·자식운은 자식 수나 성별을 맞히는 문제가 아니다. 기대를 앞세우면 관계가 무거워지고, 돈 기준을 흐리면 가족 안에서 피로가 쌓인다. 도와줄 돈, 못 도와줄 돈, 같이 살 거리, 감정노동의 선을 정해야 가족복이 남는다.`,
        `평생종합 결론은 이거다. 너는 초년부터 편하게 풀리는 사주는 아니다. 30대 중반부터 돈눈이 뜨고 40대 초중반부터 일과 돈이 굵어진다. 그때 잡을 건 견적·단가·납기·거래처·입금일이 보이는 일이고, 버릴 건 정 때문에 떠안는 사람, 재고·월세·광고비가 먼저 나가는 판, 잠·소화·피로를 무시하는 생활이다.`,
      ),
    };
  }

  const domain = getPremiumQuestionDomain(safeText(params.user.question, ""));
  return {
    title: "내 고민 최종 판정",
    text: comicText(
      `이 질문의 핵심은 ${domain.focus}이다. 답을 흐리면 안 된다.`,
      `판단 기준은 ${domain.criteria.join(", ")}이다. 이 기준에서 벗어나면 답은 틀린다.`,
      `피해야 할 선택은 ${domain.avoid.join(", ")}이다.`,
      `잡아야 할 행동은 ${domain.action.join(", ")}이다.`,
      `최종 판정은 이거다. 이 고민은 오래 생각한다고 풀리는 문제가 아니다. 해도 되는지, 멈춰야 하는지, 기다려야 하는지를 사주판 기준으로 잘라야 한다.`,
    ),
  };
}

function getWebtoonCategoryScript(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed?: number;
}): WebtoonCategoryScript {
  const { user, categoryId, categoryTitle, manse, partnerManse, fortuneSeed } =
    params;
  const title = categoryTitle || "";

  if (categoryId === "today" || title.includes("오늘")) {
    return getTodayScript(getTodayTone({ user, manse, fortuneSeed }));
  }

  if (categoryId === "money" || title.includes("재물") || title.includes("재물운")) {
    const grade = getMoneyGrade(manse);
    const timing = getMoneyTimingText(user, manse);
    return {
      opening: "어? 너 재물운이 작진 않은데?",
      bigLuckTitle: "이거 일반 재물운은 아니다",
      bigLuckText: `재물운 등급은 '${grade}'이다. 작게만 벌고 끝날 사주는 아니다. 다만 이 재물운은 아무 데서나 열리는 게 아니라, 돈을 버는 방식이 맞아야 커진다.`,
      twistTitle: "근데 이상하지?",
      twistText:
        "재물운은 보이는데 왜 아직 손에 크게 잡힌 게 없을까. 여기서 하나가 막혀 있다.",
      blockedTitle: "돈길을 막는 문",
      blockedText:
        "돈이 없는 게 문제가 아니다. 들어오기 전에 빠져나가는 문이 먼저 열린다.",
      ghostTitle: "돈이 새는 장면",
      ghostText:
        "정 때문에 새고, 사람 말에 끌려가서 새고, 급하게 잡은 돈에서 샌다. 이게 네 재물운을 늦춘다.",
      blessingTitle: "돈길이 열리는 자리",
      blessingText:
        "흐름을 직접 보고, 내 몫이 분명하고, 돈이 어디서 들어와 어디로 나가는지 보이는 자리에서 재물운이 산다.",
      detailA: getConcreteMoneyDirection(manse).workAnswer,
      detailB: getConcreteMoneyDirection(manse).earn,
      timing: timing.text,
      people:
        "사람 때문에 돈이 새는 흐름이 있다. 친하다고 흐려지는 돈, 미안해서 쓰는 돈, 거절 못 해서 나가는 돈이 약하다.",
      money:
        "돈은 벌 수 있다. 문제는 남기는 힘이다. 들어오는 돈보다 빠지는 돈을 먼저 막아야 손에 잡힌다.",
      body: "돈 움직일 때 몸도 같이 긴장한다. 잠 줄이고 무리해서 잡는 돈은 오래 못 간다.",
      yearCaution: `올해 ${timing.moneyLeakMonth}월 전후에는 사람이나 급한 지출 때문에 돈이 새기 쉽다.`,
      yearChance: `올해 ${timing.moneyMoveMonth}월과 ${timing.moneyCatchMonth}월 전후에는 돈 이야기가 움직이고 다시 잡을 기회가 보인다.`,
      avoid: getConcreteMoneyDirection(manse).avoid,
      choose: getConcreteMoneyDirection(manse).start,
      final:
        "결론은 이거다. 너는 재물운이 없는 게 아니다. 재물운이 네 손에 닿기 전에 새는 문부터 닫아야 한다.",
      mood: "gold",
    };
  }

  if (isCareerCategory(categoryId, title)) {
    const career = getCareerArchetype(manse);
    return {
      opening: "어? 너 일운이 가볍진 않은데?",
      bigLuckTitle: "시키는 일만 하다 끝날 사주는 아니다",
      bigLuckText: `너는 '${career.combined}'에 가깝다. 네 이름, 네 역할, 사람 만나고 주문 받고 팔고 챙기는 일이 들어가야 일이 살아난다.`,
      twistTitle: "근데 이상하다",
      twistText:
        "일은 하는데 왜 남는 돈은 늦게 올까. 책임은 네가 지고 결과는 남한테 가는 자리, 거기서 운이 막힌다.",
      blockedTitle: "일·사업운이 눌리는 자리",
      blockedText: `네 일운을 막는 건 ${career.warning}이다. 여기 들어가면 바쁘기만 하고 남는 게 약하다.`,
      ghostTitle: "남좋은일귀신",
      ghostText:
        "일은 네가 하고, 이름은 남이 가져가고, 책임만 남는 흐름. 이게 반복되면 일·사업운이 재물운으로 못 바뀐다.",
      blessingTitle: "이름값이 붙는 일",
      blessingText:
        "역할이 분명하고 결과가 남고, 사람 만나고 주문 받고 팔고 챙기는 일이 들어가는 일에서 복이 붙는다.",
      detailA:
        "직업명보다 구조를 봐야 한다. 같은 회사 일도 남는 돈이 보이면 살고, 흐리면 눌린다.",
      detailB:
        "판을 열어도 된다면 천천히가 아니라 정확히 열어야 한다. 먼저 빠지는 돈, 책임, 시간부터 봐야 한다.",
      timing:
        "올해 일운은 한 번에 터지기보다 방향을 고르는 흐름이다. 움직일 때와 버틸 때를 헷갈리면 힘만 빠진다.",
      people:
        "일에서 조심할 사람은 말만 많고 책임을 나누지 않는 사람이다. 가까워 보여도 네 일을 흐리게 만든다.",
      money:
        "일·사업운이 재물운으로 바뀌려면 네가 한 만큼 돌아오는 구조가 있어야 한다.",
      body: "일 때문에 몸을 너무 갈면 운이 와도 못 잡는다. 피로가 쌓이는 방식부터 봐야 한다.",
      yearCaution: "올해는 감정으로 퇴사하거나 급하게 벌리는 선택이 약하다.",
      yearChance:
        "올해 잡을 건 네 역할이 선명해지는 자리다. 직함보다 실제 권한과 결과를 봐라.",
      avoid:
        "책임만 큰 자리, 이름이 안 남는 일, 돈부터 빠지는 판. 이건 피해야 한다.",
      choose:
        "사람 만나고 주문 받고 팔고 챙기는 일이 들어가고 결과가 남고, 다음 일이 이어지는 자리를 잡아라.",
      final:
        "결론은 이거다. 너는 남 좋은 일만 하다 끝날 사주가 아니다. 남는 돈이 보이는 자리로 가야 산다.",
      mood: "redDark",
    };
  }

  if (isLoveMarriageCategory(categoryId, title)) {
    const love = getLovePartnerProfile(manse);
    const marriage = getMarriageTimingProfile(manse);
    return {
      opening: "어? 너 인연운이 없는 사람은 아닌데?",
      bigLuckTitle: "사람이 안 들어오는 사주는 아니다",
      bigLuckText:
        "오히려 마음을 건드리는 인연은 들어온다. 문제는 좋은 사람보다 먼저 흔드는 사람이 보인다는 거다.",
      twistTitle: "근데 왜 끝이 이상하지?",
      twistText:
        "처음엔 끌리는데 끝에 가면 네 마음만 늙는 관계. 그 흐름이 사주 안에 보인다.",
      blockedTitle: "인연을 막는 자리",
      blockedText:
        "인연이 없는 게 아니다. 피해야 할 사람한테 먼저 흔들리면 좋은 사람 자리가 비어 있지 않는다.",
      ghostTitle: "헛정귀신",
      ghostText:
        "말은 달콤한데 행동이 늦고, 가까운 척하지만 책임이 흐린 사람. 이런 사람한테 마음을 쓰면 인연운이 흐려진다.",
      blessingTitle: "인연등불",
      blessingText: `잘 맞는 사람은 ${love.good}이다. 설렘보다 오래 편해지는 사람이 복이다.`,
      detailA: `피해야 할 사람은 ${love.avoid}이다. 처음 끌려도 이 타입은 오래 보면 마음이 늙는다.`,
      detailB: `잘 맞는 상대의 분위기는 ${love.jobs} 쪽이다. 화려함보다 생활 리듬이 맞는지를 봐야 한다.`,
      timing: `${marriage.chance} 인연이 살아나는 시기는 ${getLoveTimingProfile(manse).timing} 전후로 본다.`,
      people: "가까워질수록 말투와 책임감이 드러난다. 말보다 반복 행동을 봐라.",
      money:
        "관계에서 돈 기준이 흐려지면 마음도 같이 흔들린다. 초반부터 시간과 돈의 선을 봐야 한다.",
      body: "마음이 피곤한 관계는 몸도 무겁게 만든다. 설레는데 자꾸 지치면 그건 좋은 인연이 아니다.",
      yearCaution: "올해는 외로움 때문에 아무 사람이나 붙잡는 선택이 약하다.",
      yearChance: `올해 인연운은 ${getLoveTimingProfile(manse).chance}`,
      avoid:
        "확답 없는 사람, 책임 흐린 사람, 말만 뜨거운 사람. 이 셋은 피해야 한다.",
      choose:
        "반복 행동이 일정하고, 불편한 말도 피하지 않고, 생활 리듬이 맞는 사람을 봐라.",
      final:
        "결론은 이거다. 너는 인연이 없는 게 아니다. 먼저 흔드는 사람을 걸러야 진짜 인연이 보인다.",
      mood: "mist",
    };
  }

  if (
    isCompatibilityCategory(categoryId, title) ||
    isPartnerCategory(categoryId, title)
  ) {
    const isBusiness =
      isPartnerCategory(categoryId, title) ||
      user.compatibilityType === "사업파트너 궁합";
    const score = isBusiness
      ? getBusinessPartnerScore(manse, partnerManse || null)
      : getCompatibilityScore(manse, partnerManse || null);
    return {
      opening: isBusiness
        ? "어? 같이 돈 이야기는 나올 수 있는 궁합인데?"
        : "어? 둘이 아예 안 맞는 궁합은 아닌데?",
      bigLuckTitle: isBusiness
        ? "좋은 사람이랑 돈 버는 사람은 다르다"
        : "끌림은 있다",
      bigLuckText: isBusiness
        ? `동업궁합은 ${score.score}점, '${score.grade}'으로 본다. 같이 움직일 수는 있지만 돈 기준을 봐야 한다.`
        : `두 사람의 궁합은 ${score.score}점, '${score.grade}'으로 본다. 처음 마음이 움직이는 이유는 있다.`,
      twistTitle: "근데 여기서 봐야 할 게 있다",
      twistText: isBusiness
        ? "친하다고 같이 돈을 벌 수 있는 건 아니다. 역할, 돈 기준, 책임에서 진짜 궁합이 갈린다."
        : "좋아하는 마음이랑 끝까지 같이 가는 운은 다르다.",
      blockedTitle: "갈리는 자리",
      blockedText: score.risk,
      ghostTitle: isBusiness ? "몫다툼귀신" : "감정귀신",
      ghostText: isBusiness
        ? "처음엔 같이 가자고 하지만, 돈이 들어오면 누가 했고 누가 가져가는지가 나온다."
        : "좋을 때는 다 맞는 것 같아도, 피곤할 때 말투와 책임에서 진짜 모습이 나온다.",
      blessingTitle: isBusiness ? "맞물림복" : "인연맞물림",
      blessingText: score.summary,
      detailA: isBusiness
        ? "같이 일하려면 역할을 먼저 잘라야 한다. 좋은 말보다 누가 무엇을 맡는지가 중요하다."
        : "연애로 좋은 궁합과 결혼까지 가는 궁합은 다르다. 생활 기준을 봐야 한다.",
      detailB: isBusiness
        ? "돈 기준을 말로만 넘기면 나중에 관계보다 돈이 먼저 깨진다."
        : "가까워질수록 돈, 가족, 말투, 쉬는 방식이 드러난다.",
      timing:
        "이 관계는 빠르게 확정하기보다 반복 상황을 봐야 한다. 좋은 때보다 불편할 때의 태도가 답이다.",
      people:
        "둘 사이에 제3자의 말이 끼면 흐려질 수 있다. 둘이 직접 정한 기준이 있어야 한다.",
      money: isBusiness
        ? "수익 배분, 비용 부담, 결정권을 미리 정하지 않으면 복이 아니라 다툼이 된다."
        : "연인 궁합도 돈 기준이 맞아야 오래 간다. 쓰는 방식이 다르면 마음도 피곤해진다.",
      body: "관계가 맞으면 몸이 편하고, 안 맞으면 계속 긴장한다. 몸이 먼저 알려준다.",
      yearCaution: "지금 조심할 건 감정만 보고 확정하는 선택이다.",
      yearChance:
        "좋아지는 조건은 선명하다. 말보다 역할, 책임, 생활 기준을 맞춰라.",
      avoid: isBusiness
        ? "계약 없는 동업, 친분으로 나누는 돈, 책임 흐린 역할은 피해야 한다."
        : "좋아한다는 말만 믿고 생활 기준을 나중으로 미루는 건 피해야 한다.",
      choose: isBusiness
        ? "역할, 돈 기준, 빠져나오는 조건까지 정하면 같이 갈 수 있다."
        : "끌림보다 반복 행동, 말투, 돈 기준, 가족 거리감을 봐라.",
      final: isBusiness
        ? "결론은 이거다. 같이 돈 이야기는 가능하다. 다만 기준 없이 가면 돈보다 관계가 먼저 깨진다."
        : "결론은 이거다. 안 맞는 궁합은 아니다. 근데 좋아하는 마음만으로 끝까지 가는 궁합도 아니다.",
      mood: "redDark",
    };
  }

  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    const health = getHealthProfile(manse);
    const grade = getHealthGrade(manse);
    return {
      opening: "어? 너 몸이 약한 사주는 아닌데?",
      bigLuckTitle: "버티는 힘은 있다",
      bigLuckText: `네 건강운은 '${grade}'으로 본다. 약해서 무너지는 게 아니라 버티는 힘이 있어서 늦게 꺼지는 쪽이다.`,
      twistTitle: "그래서 더 문제다",
      twistText:
        "약한 사람은 빨리 멈춘다. 너는 끝까지 간다. 그러다 어느 순간 확 꺼진다.",
      blockedTitle: "몸이 먼저 막히는 자리",
      blockedText: health.core,
      ghostTitle: "피로귀신",
      ghostText:
        "피곤한데 괜찮은 척하고, 속이 불편한데 넘기고, 잠이 부족한데 밀어붙이는 흐름이 붙는다.",
      blessingTitle: "회복문",
      blessingText: health.direction,
      detailA:
        "몸이 보내는 신호는 사소한 게 아니다. 잠, 소화, 피로, 목어깨 중 먼저 흔들리는 곳이 있다.",
      detailB:
        "이 신호를 잡으면 운이 들어올 때 몸이 받친다. 못 잡으면 좋은 일 앞에서도 지친다.",
      timing:
        "무리한 날 바로 무너지는 게 아니라 며칠 뒤에 피로가 올라올 수 있다. 누적을 봐야 한다.",
      people:
        "사람 때문에 리듬 깨지는 게 약하다. 부탁, 약속, 눈치 때문에 쉬는 시간을 뺏기면 몸이 먼저 반응한다.",
      money:
        "건강운이 흔들리면 돈도 샌다. 병원비보다 먼저 빠지는 건 집중력과 일의 흐름이다.",
      body: health.risk,
      yearCaution: "올해 조심할 건 버티면 괜찮겠지 하는 생각이다.",
      yearChance:
        "수면, 식사, 걷기 리듬을 잡는 시기에는 몸운이 빠르게 안정된다.",
      avoid: health.avoid.join(", "),
      choose: health.action.join(", "),
      final:
        "결론은 이거다. 너는 약해서 문제가 아니라 너무 버텨서 문제다. 꺼지기 전에 멈추면 산다.",
      mood: "mist",
    };
  }

  if (isMonthlyCategory(categoryId, title)) {
    return {
      opening: "어? 올해 운이 한 줄로 끝날 해는 아닌데?",
      bigLuckTitle: "좋은 달은 분명히 있다",
      bigLuckText:
        "올해는 무조건 나쁜 해도 아니고, 무조건 밀어붙일 해도 아니다. 운이 붙는 달이 따로 보인다.",
      twistTitle: "근데 나쁜 달도 같이 세다",
      twistText:
        "움직일 달, 멈춰야 할 달, 돈이 붙는 달, 사람 때문에 꼬이는 달이 갈린다.",
      blockedTitle: "올해 막히는 자리",
      blockedText:
        "달을 모르고 움직이면 복보다 손해가 먼저 붙는다. 좋은 달에 움직여야 산다.",
      ghostTitle: "엇박자귀신",
      ghostText:
        "운이 약한 달에 큰 결정을 하고, 운이 강한 달에 머뭇거리면 한 해가 꼬인다.",
      blessingTitle: "올해 천운문",
      blessingText: "강한 달을 잡고 흔들리는 달을 피하면 올해 흐름이 달라진다.",
      detailA:
        "올해는 돈, 일, 사람, 몸이 한꺼번에 같은 방향으로 가지 않는다. 항목별로 달이 다르다.",
      detailB:
        "좋은 달엔 작게라도 움직이고, 약한 달엔 새는 것부터 막아야 한다.",
      timing:
        "1~12월을 전부 나열하는 게 아니라, 돈이 움직이는 달과 조심할 달을 찍어야 한다.",
      people:
        "사람관계가 흔들리는 달에는 말이 길어지면 손해다. 약속과 부탁을 줄여야 한다.",
      money:
        "돈이 붙는 달과 새는 달이 다르다. 같은 돈도 달에 따라 복이 되거나 부담이 된다.",
      body: "몸운이 약한 달에는 좋은 일도 버거워진다. 무리한 일정부터 줄여라.",
      yearCaution: "올해 조심할 건 아무 달이나 크게 움직이는 선택이다.",
      yearChance: "올해 잡을 건 강한 달에 오는 연락, 제안, 돈의 움직임이다.",
      avoid: "운이 약한 달의 큰돈, 큰 약속, 감정적 결정은 피해야 한다.",
      choose: "운이 붙는 달엔 미루지 말고, 약한 달엔 정리하고 기다려라.",
      final:
        "결론은 이거다. 올해는 한 줄 운세가 아니다. 달을 갈라 봐야 복을 잡는다.",
      mood: "gold",
    };
  }

  if (
    categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  ) {
    return {
      opening: "어? 너 초반부터 편하게 풀리는 사주는 아닌데?",
      bigLuckTitle: "근데 나이대가 바뀌면 문도 바뀐다",
      bigLuckText: `인생대운은 전체 종합이 아니다. 초년, 20대, 30대, 40대, 말년에 어느 문이 열리는지 찍는 메뉴다. 네 인생 흐름은 '${getLifeFlow(manse)}'이다.`,
      twistTitle: "초반이 전부가 아니다",
      twistText:
        "초년에 마음이 눌렸다고 그게 평생 결론은 아니다. 다만 그때 생긴 버릇을 계속 들고 가면 30대와 40대의 문 앞에서도 멈춘다.",
      blockedTitle: "대운을 막는 착각",
      blockedText:
        "대운은 기분으로 열리지 않는다. 이직, 업종 변경, 거래처 변경, 이사, 사람 정리처럼 실제 사건으로 문이 열린다.",
      ghostTitle: "초년막힘귀신",
      ghostText:
        "초반의 답답함을 자기 팔자 전체로 믿게 만드는 흐름이다. 이게 붙으면 바꿔야 할 때도 익숙한 고생을 붙잡는다.",
      blessingTitle: "대운문",
      blessingText: `크게 방향이 바뀌는 기회는 ${getMajorLuckChanceCount(manse)} 들어온다. 중요한 시기는 ${getMostImportantLuckPhase(manse)}이다.`,
      detailA:
        "초년은 버티는 시기다. 20대는 방향을 찾는 시기다. 30대 중반부터 돈과 일의 눈이 뜨고, 40대 초중반에는 직업·거래처·사람관계 중 하나를 갈아야 하는 문이 온다.",
      detailB:
        "인생대운에서 잡을 건 직업명 하나가 아니다. 어느 시기에 움직여야 하고, 어느 시기에는 버려야 하는지다.",
      timing: `가장 중요한 대운은 ${getMostImportantLuckPhase(manse)}에 잡아야 한다. 이때 오는 변화는 미루면 늦어진다.`,
      people:
        "사람 책임을 떠안는 선택은 대운을 늦춘다. 특히 돈, 보증, 생활비, 감정노동을 네 쪽으로 미루는 사람은 이 시기에 정리해야 한다.",
      money:
        "돈은 초년보다 뒤에서 모양이 잡힌다. 대운기에 볼 것은 큰 말이 아니라 받을 금액, 입금일, 계약서, 견적서, 맡는 역할이다.",
      body: "대운기에는 몸도 같이 본다. 잠, 소화, 피로가 망가지면 좋은 변화가 와도 오래 못 끌고 간다.",
      yearCaution: "조심할 건 초년의 실패감 때문에 바꿀 때를 놓치는 것이다.",
      yearChance:
        "잡을 건 변화의 신호다. 직장 역할이 바뀌거나, 거래처가 생기거나, 돈 받는 구조가 달라지거나, 오래 끌던 사람이 정리되는 때다.",
      avoid:
        "익숙한 고생, 부탁 때문에 떠안는 일, 재고·월세·광고비가 먼저 나가는 판, 입금일 없는 일은 버려라.",
      choose:
        "대운 시기에는 받을 금액, 입금일, 맡는 역할, 책임 범위가 보이는 변화만 잡아라.",
      final:
        "결론은 이거다. 인생대운은 돈·일·사람·몸 전체를 길게 푸는 메뉴가 아니다. 어느 나이대에 바꿀 문이 오는지 찍는 메뉴다. 그 문은 중년 전후에 크게 열린다.",
      mood: "redDark",
    };
  }

  if (
    categoryId === "traditional" ||
    title.includes("평생") ||
    isChildrenCategory(categoryId, title)
  ) {
    const moneyDirection = getConcreteMoneyDirection(manse);
    const career = getCareerArchetype(manse);
    const health = getHealthProfile(manse);
    const ghost = getRepeatGhostProfile(user, manse);
    return {
      opening: "어? 이 사주 한 줄로 못 끝낸다.",
      bigLuckTitle: "평생종합은 전체판이다",
      bigLuckText: `평생 흐름은 '${getLifeFlow(manse)}'이다. 인생대운처럼 시기만 보는 게 아니라 돈, 일, 사람, 몸, 가족·자식까지 같이 본다.`,
      twistTitle: "같은 문제가 이름만 바꿔 나온다",
      twistText:
        "돈에서는 지출로 나오고, 일에서는 책임으로 나오고, 사람에서는 정으로 나오고, 몸에서는 피로로 나온다. 그래서 평생종합은 한 가지만 보면 틀린다.",
      blockedTitle: "평생운을 누르는 자리",
      blockedText:
        "정 때문에 떠안는 사람, 받을 금액과 입금일이 흐린 일, 재고·월세·광고비가 먼저 나가는 돈, 잠·소화·피로를 무시하는 생활. 이 네 개가 같이 오면 인생이 무거워진다.",
      ghostTitle: ghost.primary,
      ghostText:
        `${ghost.summary} ${ghost.risk} 이 기운은 돈, 일, 사람, 몸에서 모양만 바꿔 반복된다.`,
      blessingTitle: "평생복이 붙는 조건",
      blessingText:
        "견적, 단가, 납기, 거래처, 입금일, 원가, 재고가 눈에 보이는 일. 생활비·보증·빚·감정노동의 선을 지키는 사람관계. 잠·소화·피로를 망가뜨리지 않는 생활. 이 세 개가 맞아야 평생복이 남는다.",
      detailA:
        `돈은 이렇게 잡는다. ${moneyDirection.workAnswer} ${moneyDirection.earn}`,
      detailB:
        `일은 '${career.combined}' 판정이다. 회사 안이면 견적·단가·납기·거래처·입금일·원가·재고를 직접 보는 자리로 가라. 밖이면 ${moneyDirection.start}`,
      timing:
        `초년은 책임과 눈치가 먼저 붙고, 20대는 방향을 찾느라 흔들린다. 30대 중반부터 돈눈이 뜨고, 40대 초중반부터 일과 돈이 굵어진다. 말년은 새로 벌리는 운보다 지키는 돈, 몸, 사람 거리에서 편해진다.`,
      people:
        `${ghost.primary}이 반복된다. 불쌍해서 챙기는 사람, 책임을 네 쪽으로 미루는 사람, 돈과 시간을 빼가는 사람은 복이 아니라 누르는 사람이다.`,
      money:
        `돈은 '${getMoneyGrade(manse)}'로 찍는다. ${moneyDirection.start} 재고를 오래 안고 기다리는 장사, 월세부터 나가는 매장, 광고비 먼저 태우는 온라인몰은 버려라.`,
      body:
        `건강은 '${getHealthGrade(manse)}'로 찍는다. ${health.type}을 먼저 잡아라. ${health.action.join(", ")}부터 바꾸고, ${health.avoid.join(", ")}은 버려라.`,
      yearCaution:
        "평생 조심할 건 정 때문에 떠안는 사람, 받을 날짜 없는 일, 재고·월세·광고비가 먼저 나가는 돈, 몸의 신호 무시하기다.",
      yearChance:
        `잡을 시기는 30대 중반과 40대 초중반이다. 그때 견적·단가·납기·거래처·입금일이 보이는 일, 책임을 나누는 사람, 몸을 망가뜨리지 않는 생활을 잡아라.`,
      avoid:
        "정 때문에 떠안는 책임, 받을 금액과 입금일이 흐린 일, 재고 먼저 안는 장사, 잠·소화·피로를 무시하는 생활은 버려라.",
      choose:
        "회사 안이면 견적·단가·납기·거래처·입금일·원가·재고를 직접 보는 자리를 잡아라. 밖이면 주문 먼저 받고 물건을 맞추는 납품, 구매대행, 소싱대행, 거래처 연결을 잡아라. 사람은 돈과 책임을 네 쪽으로 미루지 않는 사람만 남겨라.",
      final:
        "결론은 이거다. 평생종합은 인생대운과 다르다. 시기만 보는 게 아니라 돈을 어떻게 벌고, 어떤 일을 잡고, 어떤 사람을 끊고, 몸 어디를 먼저 지켜야 하는지까지 보는 전체판이다.",
      mood: "paper",
    };
  }

  const domain = getPremiumQuestionDomain(safeText(user.question, ""));
  return {
    opening: "어? 이 질문 그냥 고민상담으로 보면 안 되겠는데?",
    bigLuckTitle: "이미 마음속으로 몇 번 답을 냈을 거다",
    bigLuckText:
      "근데 아직 못 움직이고 있지. 이건 생각이 부족해서가 아니라 운이 막힌 자리랑 붙어 있다.",
    twistTitle: "해도 되는지, 멈춰야 하는지",
    twistText: `${domain.focus}. 여기서 바로 갈린다.`,
    blockedTitle: "질문 속 막힌 자리",
    blockedText:
      "질문은 하나처럼 보여도 그 안에 돈, 사람, 일, 몸 중 하나가 먼저 막혀 있다.",
    ghostTitle: "망설임귀신",
    ghostText:
      "이미 알고 있는데도 움직이지 못하게 만드는 흐름이다. 같은 생각을 계속 돌게 만든다.",
    blessingTitle: "답이 열리는 자리",
    blessingText:
      "질문을 흐리지 말고 하나로 좁히면 사주가 답하는 방향도 선명해진다.",
    detailA: `이 고민에서 봐야 할 기준은 ${domain.criteria.join(", ")}이다.`,
    detailB: `피해야 할 선택은 ${domain.avoid.join(", ")}이다.`,
    timing:
      "지금 당장 결정할 것과 미룰 것을 갈라야 한다. 급한 마음이 붙으면 답이 흐려진다.",
    people:
      "이 고민에 사람이 엮여 있다면 좋은 사람인지보다 네 운을 살리는 사람인지 봐야 한다.",
    money:
      "돈이 엮여 있다면 먼저 빠지는 돈과 나중에 돌아오는 돈을 구분해야 한다.",
    body: "고민이 길어지면 몸이 먼저 눌린다. 잠, 소화, 피로가 같이 흔들리면 이미 오래 들고 간 문제다.",
    yearCaution: "조심할 건 불안해서 크게 결정하는 것이다.",
    yearChance: "잡을 건 질문의 핵심 하나다. 하나만 잡으면 길이 보인다.",
    avoid: domain.avoid.join(", "),
    choose: domain.action.join(", "),
    final:
      "결론은 이거다. 이 질문은 가볍게 넘길 고민이 아니다. 사주에서 막힌 자리를 보고 답을 잘라야 한다.",
    mood: "black",
  };
}

function makeComicChapter(
  params: Omit<ComicChapter, "visualHint"> & { visualHint?: string },
): ComicChapter {
  return {
    ...params,
    visualHint:
      params.visualHint || "도훈이 사주판 앞에서 장면을 넘기는 웹툰 컷",
  };
}

function hardenComicText(value: string) {
  return String(value || "")
    .replace(/첫 번째 판정이 방향이라면, 두 번째 판정은 반복되는 함정이다\.?/g, "")
    .replace(/이번엔 그 문을 그냥 지나가면 안 된다\.?/g, "")
    .replace(/반복귀신/g, "반복되는 문제")
    .replace(/전생기질/g, "오래된 버릇")
    .replace(/새는돈귀신/g, "돈이 새는 문제")
    .replace(/막힌 문/g, "막히는 지점")
    .replace(/문 앞/g, "갈리는 자리")
    .replace(/그림자/g, "흔들림")
    .replace(/돈의 입구와 출구/g, "돈이 들어오고 빠지는 장면")
    .replace(/네 판단과 네 몫/g, "직접 보고 움직이는 일")
    .replace(/네 판단/g, "직접 보는 눈")
    .replace(/네 몫/g, "받을 돈")
    .replace(/역할값/g, "받을 돈")
    .replace(/자기판/g, "내 일")
    .replace(/돈길/g, "돈")
    .replace(/방향을 잡아라/g, "무엇을 할지 좁혀라")
    .replace(/기준을 잡아라/g, "무엇을 볼지 먼저 정해라")
    .replace(/기준을 봐라/g, "무엇을 봐야 하는지부터 봐라")
    .replace(/쪽이 먼저 맞다/g, "부터 봐라")
    .replace(/쪽이 맞다/g, "을 봐라")
    .replace(/쪽이 좋다/g, "을 봐라");
}

function cleanComicSourceText(value: string) {
  return hardenComicText(String(value || ""))
    .replace(/^\|\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function comicText(...parts: Array<string | undefined | null>) {
  return parts
    .map((part) => cleanComicSourceText(String(part || "")))
    .filter(Boolean)
    .join("\n\n");
}

function categoryLabelForComic(categoryId: CategoryId, categoryTitle: string) {
  const title = categoryTitle || "";
  if (categoryId === "today" || title.includes("오늘")) return "오늘운세";
  if (categoryId === "money" || title.includes("재물운") || title.includes("재물")) return "재물운";
  if (isCareerCategory(categoryId, title) || title.includes("일·사업운")) return "일·사업운";
  if (categoryId === "love" || title.includes("연애")) return "연애운";
  if (categoryId === "marriage" || title.includes("결혼")) return "결혼운";
  if (
    isCompatibilityCategory(categoryId, title) ||
    isPartnerCategory(categoryId, title)
  )
    return isPartnerCategory(categoryId, title) ? "사업파트너 궁합" : "궁합운";
  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) return "건강운";
  if (isMonthlyCategory(categoryId, title)) return "올해운세";
  if (
    categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  )
    return "인생대운";
  if (
    categoryId === "traditional" ||
    title.includes("평생") ||
    isChildrenCategory(categoryId, title)
  )
    return "평생종합사주";
  return "내 고민 상담";
}

function getComicDeepFocus(params: {
  categoryId: CategoryId;
  categoryTitle: string;
  script: WebtoonCategoryScript;
}) {
  const title = params.categoryTitle || "";
  const script = params.script;

  if (params.categoryId === "today" || title.includes("오늘")) {
    return {
      mind: "오늘운은 거창한 인생 얘기가 아니다. 아침부터 밤까지 네 말, 돈, 연락, 몸 컨디션 중 어디가 먼저 흔들리는지 보는 거다.",
      core: "좋은 날이면 필요한 연락과 정리가 들어오고, 조심할 날이면 작은 말 하나가 커진다. 오늘은 운이 좋냐 나쁘냐보다 어디서 갈라지는지가 중요하다.",
      lock: "전체판에서는 오늘 들어오는 작은 복, 오늘 새는 구멍, 말조심, 돈조심, 사람 반응, 몸 신호까지 하루 안에서 바로 보이는 것만 연다.",
    };
  }

  if (params.categoryId === "money" || title.includes("재물")) {
    return {
      mind: "재물운은 돈이 있냐 없냐로 끝나지 않는다. 돈이 들어오는 모양, 빠지는 구멍, 손에 남는 방식이 전부 다르다.",
      core: "네 재물운은 작게만 볼 흐름이 아니다. 다만 돈이 붙는 문보다 빠지는 문이 먼저 열리면, 벌어도 남는 게 약해진다.",
      lock: "전체판에서는 언제 돈이 움직이는지, 뭘 해야 돈이 붙는지, 어떤 사람 말에 돈이 새는지, 올해 어느 달을 조심해야 하는지까지 연다.",
    };
  }

  if (isCareerCategory(params.categoryId, title)) {
    return {
      mind: "일운은 직업 이름보다 자리가 중요하다. 같은 일을 해도 네 이름이 남는 자리와 책임만 남는 자리는 완전히 다르다.",
      core: "일은 하는데 내 몫이 늦게 오는 느낌이 있었다면, 그건 게으름 문제가 아니라 일·사업운이 재물운으로 바뀌는 문이 막힌 흐름이다.",
      lock: "전체판에서는 네가 들어가면 사는 일 구조, 들어가면 눌리는 일 구조, 올해 움직일 타이밍과 피해야 할 판을 나눠서 연다.",
    };
  }

  if (isLoveMarriageCategory(params.categoryId, title)) {
    return {
      mind: "사랑운은 사람이 있냐 없냐가 전부가 아니다. 먼저 흔드는 사람과 오래 편해지는 사람을 구분해야 한다.",
      core: "마음이 움직이는 인연은 들어올 수 있다. 문제는 피해야 할 사람에게 먼저 반응하면, 좋은 사람이 와도 자리가 비지 않는다는 거다.",
      lock: "전체판에서는 끌리는 사람, 피해야 할 사람, 결혼까지 볼 수 있는 기준, 올해 인연이 살아나는 시기를 따로 연다.",
    };
  }

  if (
    isCompatibilityCategory(params.categoryId, title) ||
    isPartnerCategory(params.categoryId, title)
  ) {
    return {
      mind: "궁합운은 좋다 나쁘다 한 줄로 끝내면 틀린다. 상대가 나를 진짜 원하는지, 몸도 맞는지, 가까워질수록 붙는지 식는지까지 봐야 한다.",
      core: "처음 끌림은 있어도 오래 가면 전혀 다르게 나온다. 말투가 막히면 마음도 식고, 가까워지는 속도가 다르면 한쪽은 부족하고 한쪽은 부담스럽다.",
      lock: "전체판에서는 궁합 점수, 상대가 너에게 진짜 끌리는지, 상대가 원하는 이상형과 말투, 끌리는 외형, 가까워졌을 때 맞는지 점수, 가까워지면 식는 지점까지 바로 연다.",
    };
  }

  if (params.categoryId === "health" || title.includes("건강")) {
    return {
      mind: "건강운은 겁주는 게 아니다. 몸이 어디서 먼저 신호를 보내는지, 운이 와도 몸이 받을 수 있는지 보는 거다.",
      core: "약해서 바로 무너지는 게 아니라, 버티다가 늦게 꺼지는 흐름이면 더 조심해야 한다. 신호가 늦게 보일 뿐, 몸은 먼저 알고 있다.",
      lock: "전체판에서는 수면, 소화, 피로, 목어깨, 스트레스성 긴장 중 어디가 먼저 흔들리는지와 바로 바꿔야 할 생활 리듬을 연다.",
    };
  }

  if (isMonthlyCategory(params.categoryId, title)) {
    return {
      mind: "올해운세는 한 줄 총평으로 보면 안 된다. 움직일 달과 멈출 달이 다르고, 돈이 붙는 달과 사람이 꼬이는 달이 다르다.",
      core: "좋은 달에 머뭇거리고 약한 달에 크게 벌리면 한 해가 꼬인다. 올해는 달을 갈라 봐야 운을 잡는다.",
      lock: "전체판에서는 돈이 움직이는 달, 일·사업운이 살아나는 달, 사람관계가 흔들리는 달, 몸을 조심할 달만 찍어서 연다.",
    };
  }

  if (
    params.categoryId === "lifeFlow" ||
    title.includes("인생") ||
    title.includes("대운")
  ) {
    return {
      mind: "인생대운은 지금까지 답답했는지만 보는 게 아니다. 어느 시점에 판이 바뀌고, 어떤 신호가 오면 잡아야 하는지 보는 거다.",
      core: "초반이 편하지 않았다고 평생 그렇게 가는 사주는 아니다. 다만 문이 열리는 때를 놓치면 같은 막힘을 오래 끌고 간다.",
      lock: "전체판에서는 초년·청년·중년·말년 흐름, 큰 대운 기회, 중년 이후 돈과 일이 맞물리는 자리를 연다.",
    };
  }

  if (
    params.categoryId === "traditional" ||
    title.includes("평생") ||
    isChildrenCategory(params.categoryId, title)
  ) {
    return {
      mind: "평생종합은 돈만 보고 끝내면 놓친다. 돈, 일, 사람, 몸이 어디서 같은 뿌리로 반복되는지 봐야 한다.",
      core: "돈이 안 남는 이유와 사람이 피곤한 이유, 일을 해도 몫이 늦는 이유가 따로가 아닐 수 있다. 한 뿌리에서 같이 움직인다.",
      lock: "전체판에서는 평생 재물운, 일·사업운, 인연운, 건강운, 자식·가족 흐름, 시기별 대운까지 한 줄기로 묶어서 연다.",
    };
  }

  return {
    mind: "내 고민 상담는 일반 상담이 아니다. 질문 하나 안에 돈, 사람, 일, 몸 중 어디가 먼저 막혔는지 보는 거다.",
    core: "이미 마음속으로 답을 몇 번 냈는데도 못 움직이는 건, 생각이 부족해서가 아니라 막힌 자리가 아직 안 보였기 때문이다.",
    lock: "전체판에서는 해도 되는지, 멈춰야 하는지, 기다려야 하는지, 1년 안에 어떤 선택을 해야 하는지까지 질문 중심으로 연다.",
  };
}


function buildCompatibilityPreviewComicChapters(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed?: number;
}): ComicChapter[] {
  const compatibility = getCompatibilityScore(params.manse, params.partnerManse || null);
  const attraction = getPartnerAttractionProfile(params.manse, params.partnerManse || null);

  return [
    makeComicChapter({
      id: "preview-compat-01",
      sceneType: "entrance",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "pointing",
      mood: "dark",
      title: "궁합운 첫 판정",
      text: comicText(
        `두 사람의 궁합은 ${compatibility.score}점, '${compatibility.grade}'으로 본다.`,
        compatibility.summary,
        "안 맞는 궁합은 아니다. 그런데 좋아한다는 말만 믿고 밀면 중간에 지친다."
      ),
      visualHint: "도훈이 두 사람의 사주판을 나란히 놓고 점수를 가리키는 장면",
    }),
    makeComicChapter({
      id: "preview-compat-02",
      sceneType: "core",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "redDark",
      title: "왜 끌렸나",
      text: comicText(
        "처음 끌림은 있다. 서로에게 신경 쓰이는 지점이 있다.",
        "문제는 끌림이 오래 가는 힘으로 바뀌느냐다.",
        "말투, 연락 속도, 가까워지는 속도가 안 맞으면 좋아해도 피곤해진다."
      ),
      visualHint: "붉은 실이 두 사주판을 연결하지만 중간에 팽팽해지는 장면",
    }),
    makeComicChapter({
      id: "preview-compat-03",
      sceneType: "mind",
      speaker: "dohoon",
      character: "user-shadow",
      emotion: "serious",
      mood: "mist",
      title: "상대가 진짜 원하는 것",
      text: comicText(
        attraction.ideal,
        attraction.look,
        "상대가 마음을 여는 외향과 분위기는 따로 있다. 네가 그 취향에 들어가는지는 전체 리포트에서 바로 가른다."
      ),
      visualHint: "상대방 실루엣 뒤로 이상형의 단서가 카드처럼 뜨는 장면",
    }),
    makeComicChapter({
      id: "preview-compat-04",
      sceneType: "warning",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "black",
      title: "속궁합은 유료에서 숫자로 본다",
      text: comicText(
        "무료에서는 속궁합 점수를 열지 않는다.",
        "전체 리포트에서는 이 사람과 가까워졌을 때 더 붙는지, 아니면 식는 지점이 먼저 올라오는지 숫자로 바로 본다.",
        "스킨십 속도, 원하는 분위기, 좋아지려면 바꿔야 할 행동까지 돌려 말하지 않고 판정한다."
      ),
      visualHint: "잠긴 카드 위에 속궁합 점수라는 글자가 희미하게 보이는 장면",
      isLocked: true,
      ctaText: "속궁합 점수 열기",
    }),
    makeComicChapter({
      id: "preview-compat-05",
      sceneType: "lock",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "black",
      title: "여기서 결제해야 보는 것",
      text: comicText(
        "유료에서는 궁합 점수만 다시 말하지 않는다.",
        "상대가 너에게 진짜 끌리는지, 상대가 약해지는 말투, 끌리는 외형과 분위기, 가까워졌을 때 맞는지 점수, 결혼까지 가면 부딪히는 지점을 전부 연다.",
        "이 사람 계속 만나도 되는지 보려면 여기부터 봐야 한다."
      ),
      visualHint: "검은 문 뒤로 궁합운 카드들이 차례로 켜지는 장면",
      isLocked: true,
      ctaText: "궁합운 전체 열기",
    }),
  ];
}

function buildCompatibilityFullComicChapters(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  resultText: string;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed?: number;
}): ComicChapter[] {
  const compatibility = getCompatibilityScore(params.manse, params.partnerManse || null);
  const sokgunghap = getSokgunghapScore(params.manse, params.partnerManse || null);
  const attraction = getPartnerAttractionProfile(params.manse, params.partnerManse || null);

  const pages: Array<Omit<ComicChapter, "visualHint"> & { visualHint?: string }> = [
    {
      id: "full-compat-01-score",
      sceneType: "entrance",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "pointing",
      mood: "dark",
      title: "궁합 점수부터 말하면",
      text: comicText(
        `두 사람의 궁합은 ${compatibility.score}점, '${compatibility.grade}'이다.`,
        compatibility.summary,
        "안 맞는 궁합은 아니다. 그런데 좋아하는 마음만으로 끝까지 가는 궁합도 아니다."
      ),
      visualHint: "두 사람의 사주판 사이에 궁합 점수가 크게 뜨는 장면",
    },
    {
      id: "full-compat-02-why-attracted",
      sceneType: "core",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "redDark",
      title: "두 사람은 왜 끌렸나",
      text: comicText(
        "처음 끌림은 있다. 서로에게 없는 분위기가 보여서 신경이 쓰인다.",
        "한쪽은 상대의 반응이나 생기에 끌릴 수 있고, 한쪽은 상대의 거리감이나 차분함에 끌릴 수 있다.",
        "이 궁합은 처음부터 편해서 붙는 궁합이 아니라, 묘하게 신경 쓰여서 붙는 궁합이다."
      ),
      visualHint: "서로 다른 색의 기운이 한 지점에서 마주치는 장면",
    },
    {
      id: "full-compat-03-real-want",
      sceneType: "mind",
      speaker: "dohoon",
      character: "user-shadow",
      emotion: "serious",
      mood: "mist",
      title: "상대가 나를 진짜 원하는가",
      text: comicText(
        attraction.fit,
        attraction.mismatch,
        "좋아한다는 말보다 중요한 건 반복 행동이다. 연락, 말투, 약속, 가까워지는 속도에서 진짜 마음이 나온다."
      ),
      visualHint: "상대방의 마음 카드와 실제 행동 카드가 갈라지는 장면",
    },
    {
      id: "full-compat-04-ideal",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "serious",
      mood: "paper",
      title: "상대가 원하는 이상형",
      text: comicText(
        attraction.ideal,
        "이건 모든 사람에게 똑같이 쓰는 말이 아니다. 상대 사주 기준으로 마음이 열리는 사람을 보는 거다.",
        "네가 그 자리에 들어맞으면 끌림이 오래 가고, 어긋나면 좋아해도 상대가 부담을 느낀다."
      ),
      visualHint: "상대 사주판 위에 이상형 단서가 하나씩 떠오르는 장면",
    },
    {
      id: "full-compat-05-speech",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "paper",
      title: "상대가 약해지는 말투",
      text: comicText(
        attraction.speech,
        "이 사람은 아무 말에나 풀리는 사람이 아니다. 어떤 말에는 마음이 열리고, 어떤 말에는 바로 닫힌다.",
        "싸울 때 이 말투를 놓치면 관계는 좋아해도 피곤해진다."
      ),
      visualHint: "말풍선 하나는 금빛으로, 하나는 붉게 깨지는 장면",
    },
    {
      id: "full-compat-06-look",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "serious",
      mood: "paper",
      title: "상대가 끌리는 외형과 분위기",
      text: comicText(
        attraction.look,
        "체형 하나로 싸게 단정하지 않는다. 사주에서는 외형보다 분위기, 색감, 움직임, 정돈된 느낌을 같이 본다.",
        "상대 눈에 들어오는 포인트가 어디인지 여기서 갈린다."
      ),
      visualHint: "옷차림, 눈빛, 자세 카드가 상대 시선 앞에 떠오르는 장면",
    },
    {
      id: "full-compat-07-conflict",
      sceneType: "warning",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "redDark",
      title: "두 사람은 왜 부딪히나",
      text: comicText(
        compatibility.risk,
        "처음엔 성격 차이처럼 보인다. 그런데 반복되면 이건 그냥 성격 문제가 아니다.",
        "한쪽은 바로 확인하고 싶고, 한쪽은 시간을 둬야 말이 나온다. 여기서 한 사람은 서운하고 한 사람은 부담스럽다."
      ),
      visualHint: "두 사람이 같은 문 앞에서 서로 다른 방향을 보는 장면",
    },
    {
      id: "full-compat-08-sok-score",
      sceneType: "core",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "dark",
      title: "가까워졌을 때 맞는지 점수부터 말하면",
      text: comicText(
        `가까워졌을 때 맞는지 점수는 ${sokgunghap.score}점, '${sokgunghap.grade}'이다.`,
        sokgunghap.summary,
        "몸이 아예 안 당기는 궁합은 아니다. 다만 가까워지는 속도를 못 맞추면 식는다."
      ),
      visualHint: "가까워졌을 때 맞는지 점수가 잠긴 카드에서 열리는 장면",
    },
    {
      id: "full-compat-09-intimacy-style",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "serious",
      mood: "mist",
      title: "이 사람과 몸도 맞을까",
      text: comicText(
        attraction.intimacy,
        sokgunghap.risk,
        "한쪽은 스킨십이 빨라야 사랑받는 느낌이 들고, 한쪽은 마음이 편해야 몸이 열린다. 이 차이를 모르면 좋아해도 멀어진다."
      ),
      visualHint: "두 사람 사이의 거리 표시가 가까워졌다 멀어지는 장면",
    },
    {
      id: "full-compat-10-cooling-point",
      sceneType: "warning",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "black",
      title: "가까워지면 어디서 식나",
      text: comicText(
        "식는 지점은 거창하지 않다. 답이 늦고, 말투가 차갑고, 한쪽만 더 원하는 느낌이 반복될 때 식는다.",
        "한 사람은 부족하다고 느끼고, 한 사람은 부담스럽다고 느끼면 스킨십도 어색해진다.",
        "이 궁합은 끌림이 있어도 방치하면 식는다. 맞춰야 할 건 속도다."
      ),
      visualHint: "뜨겁던 붉은 실이 중간에서 식어가는 장면",
    },
    {
      id: "full-compat-11-love",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "gold",
      title: "연애로 보면",
      text: comicText(
        "연애로 보면 끌림은 있는 궁합이다. 처음부터 완전히 식은 관계로 보진 않는다.",
        "다만 연애가 오래 가려면 연락 속도와 말투를 맞춰야 한다.",
        "한쪽만 확인하고 한쪽만 피하면 좋아하는데도 지친다."
      ),
      visualHint: "연락 말풍선과 하트가 엇갈리는 장면",
    },
    {
      id: "full-compat-12-marriage",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "serious",
      mood: "paper",
      title: "결혼까지 보면",
      text: comicText(
        "결혼까지 가면 설렘보다 생활이 먼저 나온다.",
        "돈 쓰는 방식, 쉬는 방식, 가족과의 거리, 화났을 때 말투가 맞아야 버틴다.",
        "연애 때 넘긴 작은 차이가 결혼에서는 매일 반복된다."
      ),
      visualHint: "집, 돈, 가족 카드가 두 사람 사이에 놓이는 장면",
    },
    {
      id: "full-compat-13-money-standard",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "paper",
      title: "돈 쓰는 방식",
      text: comicText(
        "관계에서도 돈 기준은 봐야 한다. 누가 더 쓰는지, 어디까지 같이 부담하는지 흐리면 마음이 상한다.",
        "데이트 비용, 선물, 생활비 이야기를 계속 피하면 나중에 더 크게 터진다.",
        "돈 얘기를 꺼냈을 때 상대가 피하는지, 같이 맞추는지 봐라."
      ),
      visualHint: "두 사람 사이에 놓인 지갑과 계산서가 흔들리는 장면",
    },
    {
      id: "full-compat-14-family-distance",
      sceneType: "detail",
      speaker: "dohoon",
      character: "user-shadow",
      emotion: "serious",
      mood: "mist",
      title: "가족 거리감",
      text: comicText(
        "가족 문제는 결혼으로 갈수록 커진다. 둘이 정한 선이 없으면 주변 말이 둘 사이를 흔든다.",
        "상대가 가족 말에 쉽게 흔들리는지, 아니면 둘 사이 기준을 먼저 세우는지 봐야 한다.",
        "이 부분을 나중으로 미루면 좋아하는 마음이 있어도 피곤해진다."
      ),
      visualHint: "두 사람 뒤로 가족 그림자가 길게 드리워지는 장면",
    },
    {
      id: "full-compat-15-speech-fight",
      sceneType: "warning",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "redDark",
      title: "싸울 때 드러나는 것",
      text: comicText(
        "좋을 때는 누구나 좋다. 궁합은 싸울 때 보인다.",
        "불편한 말을 꺼냈을 때 상대가 듣는지, 피하는지, 비꼬는지, 침묵하는지 봐라.",
        "여기서 관계의 오래 갈 힘이 나온다."
      ),
      visualHint: "두 말풍선이 부딪히며 하나는 깨지고 하나는 이어지는 장면",
    },
    {
      id: "full-compat-16-speed",
      sceneType: "detail",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "gold",
      title: "가까워지는 속도",
      text: comicText(
        "이 궁합은 속도가 중요하다. 빨리 붙고 싶은 사람과 천천히 열리는 사람이 엇갈리면 마음이 삐끗한다.",
        "빨리 가는 사람이 조금 늦추고, 늦게 여는 사람이 아예 닫지만 않으면 살 수 있다.",
        "둘 다 자기 속도만 밀면 좋아해도 멀어진다."
      ),
      visualHint: "두 사람이 같은 길을 다른 속도로 걷는 장면",
    },
    {
      id: "full-compat-17-catch",
      sceneType: "blessing",
      speaker: "dohoon",
      character: "dohoon-blessing",
      emotion: "smile",
      mood: "gold",
      title: "잡아야 할 것",
      text: comicText(
        "잡아야 할 건 끌림 하나가 아니다.",
        "반복 행동, 말투, 돈 쓰는 방식, 가족 거리감, 가까워지는 속도를 같이 봐야 한다.",
        "이 다섯 가지가 맞으면 이 관계는 오래 갈 힘이 생긴다."
      ),
      visualHint: "다섯 개의 금빛 카드가 한 줄로 정렬되는 장면",
    },
    {
      id: "full-compat-18-avoid",
      sceneType: "warning",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "black",
      title: "버려야 할 것",
      text: comicText(
        "버릴 건 좋아한다는 말만 믿고 생활 문제를 미루는 거다.",
        "연락이 불안한데 참고, 돈 얘기 피하고, 가족 문제를 나중으로 넘기면 결국 같은 자리에서 터진다.",
        "외롭다고 밀면 안 된다. 확인할 건 확인해야 한다."
      ),
      visualHint: "붉은 미끼 카드들이 사주판 밖으로 밀려나는 장면",
    },
    {
      id: "full-compat-19-continue",
      sceneType: "final",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "redDark",
      title: "계속 만나도 되나",
      text: comicText(
        "계속 만나도 된다. 단, 감정만 믿고 가면 안 된다.",
        "상대가 너를 원하는 마음은 행동으로 확인해야 한다. 말보다 반복 행동이다.",
        "가까워졌을 때 맞는지도 나쁘게만 보진 않는다. 다만 속도와 표현을 못 맞추면 식는다."
      ),
      visualHint: "도훈이 계속과 멈춤 두 갈래 길 중 하나를 가리키는 장면",
    },
    {
      id: "full-compat-20-final",
      sceneType: "final",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "serious",
      mood: "dark",
      title: "궁합 최종 판정",
      text: comicText(
        `최종 판정은 ${compatibility.score}점 궁합, ${sokgunghap.score}점 가까워졌을 때 맞는지이다.`,
        "끌림은 있다. 상대 취향에 맞는 부분도 있다. 그런데 가까워지는 속도와 생활 기준을 못 맞추면 좋아해도 지친다.",
        "이 관계는 말투, 연락, 돈, 가족 거리감, 스킨십 속도를 맞추면 살고, 좋아한다는 말만 믿으면 식는다."
      ),
      visualHint: "궁합운 위에 최종 판정 도장이 찍히는 장면",
    },
  ];

  return pages.map(makeComicChapter);
}

function cleanCategoryChapterPlan(categoryId: CategoryId, categoryTitle: string, mode: ComicMode) {
  const title = categoryTitle || "";
  const locked = mode === "preview";
  if (categoryId === "today" || title.includes("오늘")) {
    return locked
      ? [
          ["오늘 먼저 꼬이는 자리", "오늘은 긴 하루 전체가 아니라, 말·돈·사람·몸 중 어디가 먼저 흔들리는지 보는 날이다."],
          ["무료에서 보이는 신호", "급한 답장, 기분 따라 쓰는 돈, 불편한 부탁을 바로 받는 장면에서 꼬임이 먼저 온다."],
          ["오늘운세 전체 리포트", "전체 리포트에서는 오늘 돈 쓰면 안 되는 자리, 말조심할 사람, 미뤄야 할 일, 몸이 무거워지는 순간을 바로 찍는다."],
        ]
      : [
          ["오늘 전체 판정", "오늘은 전부 막히는 날이 아니다. 재물운은 작은 지출을 가려야 하고, 일운은 오후부터 정리할 일이 보인다. 인연운은 말투에서 갈리고, 건강운은 무리하면 피로가 먼저 올라오는 날이다."],
          ["오늘 재물운", "오늘 돈은 전부 막는 게 아니다. 필요한 결제와 기분 때문에 나가는 돈을 갈라야 한다. 누가 재촉해서 쓰는 돈, 괜히 체면 때문에 쓰는 돈은 피하고, 꼭 필요한 물건이나 이미 정해둔 지출만 잡아라."],
          ["오늘 일운", "오늘 일은 새로 벌리는 것보다 마무리하는 쪽이 낫다. 오전에는 말이 길어지면 일이 꼬이고, 오후에는 미뤄둔 확인이나 짧은 정리가 풀린다. 오늘은 큰 결정보다 끝낼 수 있는 일을 끝내는 날이다."],
          ["오늘 연애운과 인연운", "오늘 인연운은 말투에서 갈린다. 연인이 있으면 서운한 말을 바로 꺼내지 말고, 없는 사람은 갑자기 마음 흔드는 연락에 너무 빨리 반응하지 마라. 오늘은 뜨겁게 밀기보다 상대 반응을 보는 날이다."],
          ["오늘 건강운", "오늘 몸은 무리하면 바로 무거워진다. 특히 밥을 넘기거나 커피로 버티면 오후부터 집중력이 빠진다. 가볍게 걷거나 목과 어깨를 풀어주는 행동은 오늘 몸운을 살린다."],
          ["오늘 시간대별 운세", "오전에는 말과 돈을 늦추고, 오후에는 정리할 일을 처리해라. 저녁에는 감정이 올라온 말을 바로 보내지 말고 한 번 더 읽어라. 오늘은 시간대를 잘 가르면 손해가 줄어든다."],
          ["오늘 피해야 할 악운", "오늘 피해야 할 악운은 급한 답장, 체면 지출, 남 부탁을 바로 떠안는 일이다. 이 셋은 작아 보여도 오늘 하루를 피곤하게 만든다."],
          ["오늘 마지막 종합 판정", "오늘은 재물·일·인연·건강이 모두 한쪽으로만 나쁜 날이 아니다. 돈은 가려 쓰고, 일은 끝낼 것부터 잡고, 사람은 말투를 줄이고, 몸은 오후 피로를 먼저 막아라. 그러면 오늘 운은 나쁘게 흐르지 않는다."],
        ];
  }
  if (categoryId === "money" || title.includes("재물")) {
    return locked
      ? [
          ["재물운 첫 느낌", "돈복이 아예 없는 사주는 아니다. 다만 아무 방식으로 벌리는 돈은 아니다."],
          ["돈이 새기 쉬운 자리", "사람 말에 끌려 들어가는 돈, 정 때문에 쓰는 돈은 조심해야 한다."],
          ["재물운 전체 리포트", "전체 리포트에서는 무엇으로 돈을 벌어야 하는지, 어떤 장사는 피해야 하는지 바로 본다."],
        ]
      : [
          ["재물운 첫 판정", "재물운은 등급만 말하면 안 된다. 돈그릇이 3억권인지, 10억권인지, 30억~50억권까지 보는지 먼저 갈라야 한다."],
          ["네 돈그릇은 얼마짜리인가", "작게 풀릴 때, 제대로 풀릴 때, 크게 열릴 때의 금액을 나누고, 맞는 직업을 잡았을 때 열리는 돈그릇을 말해야 한다."],
          ["돈이 붙는 직업 큰 계열", "나랏밥, 의료, 교사, 법무, 기술, 사업, 요식업, 외식·야간 매장, 옷장사, 온라인사업, 금융·부동산 중 명식에 맞는 순위를 찍어야 한다."],
          ["사업 업종별 판정", "요식업, 외식·야간 매장, 옷장사, 가게창업, 온라인사업, 유통·납품은 전부 따로 본다. 맞는 업종과 안 맞는 업종을 갈라야 한다."],
          ["돈이 붙는 장면과 새는 장면", "반복 손님, 자기 이름, 자격, 기술, 거래처에서 돈이 붙고, 재고·월세·광고비·정 때문에 흐린 돈에서 샌다."],
          ["재물운 마지막 종합 판정", "최종 판정에는 3억~7억권, 10억~20억권, 20억~30억권, 30억~50억권 중 어느 그릇인지와 조건을 반드시 담는다."],
        ];
  }
  if (isCareerCategory(categoryId, title) || title.includes("일·사업")) {
    return locked
      ? [
          ["일·사업운 첫 판정", "회사냐 사업이냐보다 네 판단·가격·거래·기술 중 무엇이 돈으로 바뀌는지 먼저 본다."],
          ["가장 돈 되는 직업길", "무료에서도 계산된 1순위 직업길과 그 이유를 숨기지 않는다."],
          ["일·사업운 전체 리포트", "전체 리포트에서는 1~3순위, 회사에서 잡을 역할, 독립 확장법, 사업 TOP 3, 돈그릇이 커지는 조건을 이어서 본다."],
        ]
      : [
          ["일·사업운 첫 판정", "회사냐 사업이냐 한 단어로 끝내지 말고, 어떤 방식으로 자기 몫이 커지는지 먼저 판정한다."],
          ["내 사주상 일 그릇 분석", "직업명보다 돈이 붙는 역할·가격·거래·기술·반복수입 구조를 먼저 본다."],
          ["내게 가장 돈이 되는 직업 1순위", "가장 크게 여는 중심축과 회사/독립 각각의 실제 역할을 말한다."],
          ["내게 돈이 되는 직업 2순위", "몸값과 단가를 높이는 보조축을 말한다."],
          ["내게 돈이 되는 직업 3순위", "수입원을 넓히는 현실 확장축을 말한다."],
          ["직장에 남는다면 어디까지 갈 수 있나", "회사에서 어떤 역할을 쥐어야 돈이 커지는지 말한다."],
          ["밖으로 나가면 어디서 돈이 커지나", "작은 주문에서 반복매출·가격결정권·자기거래처로 커지는 단계를 말한다."],
          ["돈그릇이 커지는 조건", "금액만 말하지 말고 그 금액까지 가는 조건을 단계별로 말한다."],
          ["사업을 한다면 TOP 3", "사업 후보 중 상위 3개만 길게 설명하고 나머지는 과감히 줄인다."],
          ["하면 돈보다 피로가 먼저 붙는 일", "선재고·큰 고정비·권한 없는 책임·외상·사람 부탁을 구체적으로 경고한다."],
          ["일이 크게 움직이는 시기", "지난 시기는 회고, 현재 구간은 현재형, 미래 구간은 준비형으로 말한다."],
          ["지금부터 해야 할 순서", "역할 확보→가격/거래 경험→작은 검증→반복수입→확장 순서로 행동을 준다."],
          ["일·사업운 마지막 판정", "1~3순위와 돈그릇 조건을 다시 한 번 모순 없이 정리한다."],
        ];
  }
  if (categoryId === "love" || title.includes("연애")) {
    return locked
      ? [
          ["연애운 첫 느낌", "너는 아무나 좋아하는 사주가 아니다."],
          ["내가 흔들리는 사람", "끌리는 사람의 공통점과 내가 약해지는 순간을 따로 봐야 한다."],
          ["연애운 전체 리포트", "전체 리포트에서는 내가 끌리는 사람의 공통점, 내가 연애에서 약해지는 순간, 상대가 나에게 빠지는 지점, 상대가 나에게 질리는 지점, 올해 놓치면 아까운 인연을 본다."],
        ]
      : [
          ["연애운 첫 판정", "좋아하는 마음만으로 오래 가는 사주는 아니다."],
          ["내가 끌리는 사람의 공통점", "말투, 분위기, 거리감에서 네가 약해지는 사람이 따로 있다."],
          ["내가 연애에서 약해지는 순간", "좋은 사람인지보다 네가 왜 그 사람에게 약해지는지를 봐야 한다."],
          ["상대가 나에게 빠지는 지점", "상대가 처음엔 몰라도 시간이 지나며 네게 붙는 지점이 있다."],
          ["상대가 나에게 질리는 지점", "표현이 늦거나 마음을 닫는 장면이 반복되면 상대는 지친다."],
          ["올해 놓치면 아까운 인연", "처음부터 불타는 사람보다 자주 마주치며 편해지는 사람을 봐야 한다."],
          ["연애운 마지막 종합 판정", "너를 편하게 만드는 사람과 흔들기만 하는 사람을 갈라야 연애운이 산다."],
        ];
  }

  if (isCompatibilityCategory(categoryId, title) || title.includes("궁합")) {
    return locked
      ? [
          ["두 사람의 첫 끌림", "두 사람은 그냥 스쳐 지나가는 궁합은 아니다."],
          ["상대 취향을 봐야 하는 자리", "서로 어떤 스타일에 끌리는지와 속궁합이 맞는지를 봐야 한다."],
          ["궁합운 전체 리포트", "전체 리포트에서는 궁합 점수, 내가 원하는 취향, 상대가 원하는 외향과 말투, 속궁합, 계속 만나도 되는지 바로 본다."],
        ]
      : [
          ["궁합운 첫 판정", "좋다 나쁘다를 먼저 자르고, 왜 끌리고 왜 부딪히는지 본다."],
          ["내가 원하는 취향", "내가 어떤 분위기와 외향에 끌리는지 본다."],
          ["상대가 원하는 외향", "상대가 어떤 인상과 분위기에 마음을 여는지 본다."],
          ["상대가 원하는 말투", "상대가 편하게 느끼는 말투와 닫히는 말투를 가른다."],
          ["서로 끌리는 지점", "두 사람이 사주적으로 어디에 끌리는지 본다."],
          ["어긋나는 지점", "좋아해도 반복해서 부딪히는 지점을 본다."],
          ["속궁합 판정", "좋은지 약한지 점수와 판정으로 자른다."],
          ["속궁합이 좋아지는 조건", "좋아지려면 무엇을 바꿔야 하는지 말한다."],
          ["가까워지면 더 붙는가", "가까워질수록 깊어지는지 식는지 본다."],
          ["연애로 오래 가는가", "연애로 유지되는 힘을 본다."],
          ["결혼까지 조심할 부분", "결혼으로 가면 터지는 생활 문제를 본다."],
          ["이 관계를 살리는 방법", "관계를 살리는 행동을 찍는다."],
          ["궁합운 마지막 판정", "계속 만나도 되는 관계인지 정리한다."],
        ];
  }
  if (categoryId === "marriage" || title.includes("결혼")) {
    return locked
      ? [["결혼운 첫 판정", "결혼은 설렘보다 생활에서 갈린다."], ["결혼하면 피곤해지는 자리", "돈, 가족, 말투, 생활 습관이 맞지 않으면 좋아해도 외로워진다."], ["결혼운 전체 리포트", "맞는 배우자, 피해야 할 배우자, 결혼 시기를 본다."]]
      : [["결혼운 첫 판정", "좋아한다고 바로 같이 살면 피곤해지는 사주가 있다."], ["맞는 배우자", "약속을 지키고 돈을 함부로 쓰지 않고 가족과 부부 사이 선을 아는 사람이 맞다."], ["피해야 할 배우자", "말은 다정한데 힘든 일 생기면 뒤로 빠지는 사람은 피해야 한다."], ["결혼 후 생활", "돈 쓰는 방식, 가족 거리, 말투, 집안일에서 결혼운이 갈린다."], ["결혼운 마지막 판정", "결혼하면 편해지는 사람과 더 외로워지는 사람을 갈라본다."]];
  }
  if (categoryId === "health" || title.includes("건강") || title.includes("몸운")) {
    return locked
      ? [["몸이 먼저 보내는 신호", "몸이 약해서가 아니라 버티다 한 번에 꺼지는 쪽이 문제다."], ["무리하면 꺼지는 자리", "잠, 소화, 장, 목·어깨, 피로 중 먼저 무너지는 곳이 있다."], ["건강운 전체 리포트", "전체 리포트에서는 피해야 할 습관과 몸이 보내는 신호를 본다."]]
      : [["건강운 첫 판정", "버티는 힘이 있어서 더 문제다."], ["잠과 소화", "잠을 줄이고 밥을 넘기면 몸이 먼저 무거워진다."], ["목·어깨와 피로", "긴장이 쌓이면 목과 어깨가 굳고 피로가 늦게 빠진다."], ["피해야 할 습관", "야식, 찬 음료, 커피로 버티는 습관은 몸을 눌러버린다."], ["건강운 마지막 판정", "아프고 나서 고치는 사주가 아니다. 무너지기 전에 끊어야 한다."]];
  }
  if (isMonthlyCategory(categoryId, title)) {
    return locked
      ? [["올해운세 첫 판정", "올해는 다 잡는 해가 아니다. 잡을 것과 버릴 것이 갈린다."], ["올해 조심할 자리", "돈, 일, 사람, 몸 중 강하게 움직이는 달만 봐야 한다."], ["올해운세 전체 리포트", "전체 리포트에서는 돈이 움직이는 달과 새는 달을 찍는다."]]
      : [["올해 첫 판정", "올해는 무조건 밀어붙이는 해가 아니다."], ["돈이 움직이는 달", "돈 이야기가 움직이는 달과 돈이 새는 달을 갈라본다."], ["일이 살아나는 달", "일 제안, 연락, 판매, 이직 이야기가 들어오는 달을 본다."], ["사람과 몸 조심할 달", "사람 말 때문에 흔들리는 달과 몸이 꺼지는 달을 본다."], ["올해운세 마지막 판정", "올해 잡을 것 하나와 버릴 것 하나를 정리한다."]];
  }
  if (categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return locked
      ? [["인생대운 첫 판정", "초반부터 편하게 풀리는 사주인지, 늦게 힘이 붙는 사주인지 봐야 한다."], ["초반에 답답했던 자리", "초년과 청년운의 답답함이 중년 이후 돈과 일로 바뀌는지 본다."], ["인생대운 전체 리포트", "초년·청년·중년·말년과 크게 바뀌는 시기를 본다."]]
      : [["인생대운 첫 판정", "초반부터 쉽게 풀리는 사주는 아니다."], ["초년과 청년", "초년에는 마음이 먼저 늙고, 청년에는 사람과 돈 때문에 흔들린다."], ["중년", "중년부터 돈과 일이 같이 움직이는 시기가 온다."], ["말년", "말년은 빠르게 버는 돈보다 지키는 돈에서 편해진다."], ["인생대운 마지막 판정", "언제부터 풀리는지, 그때 무엇을 잡아야 하는지 정리한다."]];
  }
  if (categoryId === "traditional" || title.includes("평생")) {
    return locked
      ? [["평생종합사주 첫 판정", "평생종합사주는 한 가지 운만 보는 메뉴가 아니다."], ["많이 흔들리는 자리", "돈, 일, 인연, 건강 중 어디서 많이 흔들리는지 먼저 본다."], ["평생종합사주 전체 리포트", "돈, 일, 인연, 결혼, 건강, 자식운, 대운을 한 번에 본다."]]
      : [["평생종합사주 첫 판정", "이 사람의 인생이 어디서 눌리고 어디서 살아나는지 본다."], ["평생 재물운", "돈이 붙는 방식과 돈이 새는 사람을 같이 본다."], ["평생 일·사업운", "직장형인지 사업형인지, 언제 일이 살아나는지 본다."], ["평생 인연과 결혼", "맞는 사람, 피해야 할 사람, 결혼 후 생활을 본다."], ["평생 건강운과 대운", "몸이 무너지는 자리와 인생이 바뀌는 시기를 같이 본다."]];
  }
  return locked
    ? [["질문에 대한 첫 판정", "이 고민은 그냥 마음 문제로 넘길 일이 아니다."], ["지금 조심할 자리", "지금 밀고 갈지, 멈출지, 기다릴지 먼저 갈라야 한다."], ["내 고민 전체 리포트", "전체 리포트에서는 질문 하나를 끝까지 판다."]]
    : [["질문에 대한 답", "지금 이 선택을 밀고 갈지 멈출지 먼저 말한다."], ["지금 밀면 생기는 일", "지금 바로 밀면 돈, 사람, 일 중 어디서 부담이 붙는지 본다."], ["멈추면 보이는 일", "멈췄을 때 손해가 줄어드는지, 기회가 사라지는지 본다."], ["앞으로 3개월", "3개월 안에 조심할 장면을 찍는다."], ["최종 답", "질문 하나에 대한 답을 다시 정리한다."]];
}

function buildCleanComicChapters(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  mode: ComicMode;
}): ComicChapter[] {
  const plan = cleanCategoryChapterPlan(params.categoryId, params.categoryTitle, params.mode);
  const isPreview = params.mode === "preview";
  return plan.map((item, idx) => makeComicChapter({
    id: `${params.mode}-clean-${idx + 1}`,
    sceneType: idx === 0 ? "entrance" : isPreview && idx === plan.length - 1 ? "lock" : idx === plan.length - 1 ? "final" : "detail",
    speaker: "dohoon",
    character: idx === 0 ? "dohoon-serious" : idx === plan.length - 1 ? "dohoon-pointing" : "dohoon",
    emotion: idx === 0 ? "serious" : idx === plan.length - 1 ? "pointing" : "normal",
    mood: idx === 0 ? "dark" : idx === plan.length - 1 ? "gold" : "paper",
    title: item[0],
    text: item[1],
    visualHint: "도훈이 사주판 앞에서 카테고리 장면을 하나씩 짚는 웹툰 컷",
    isLocked: isPreview && idx === plan.length - 1,
    ctaText: isPreview && idx === plan.length - 1 ? "전체 리포트 열기" : undefined,
  }));
}

function buildV104FreeHookChapter(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
}): ComicChapter | null {
  const title = params.categoryTitle || "";
  const namePrefix = params.user?.name ? `${params.user.name}, ` : "";

  if (isCareerCategory(params.categoryId, title) || title.includes("일·사업") || title.includes("직업") || title.includes("사업")) {
    return makeComicChapter({
      id: "preview-00-sticky-career-hook",
      sceneType: "entrance",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "serious",
      mood: "dark",
      title: "지금 네가 일에서 걸리는 것",
      text: comicText(
        `${namePrefix}너 지금 일 얘기에서 제일 걸리는 게 이거일 거다.`,
        "내가 지금 하는 일을 계속 가도 되는 건가? 나는 남 밑에서만 살 사람인가, 언젠가는 내 걸 해야 하는 사람인가? 일은 하는데 왜 내 이름도 돈도 크게 남지 않는 느낌이지?",
        "이 사주는 그 질문을 피해 가면 풀이가 얕아진다. 직업명 하나보다 밥벌이가 되는 자리, 돈이 굵어지는 자리, 피해야 할 일을 갈라야 한다.",
      ),
      visualHint: "도훈이 사주판 앞에서 직장 문과 사업 문 사이에 선 내담자의 그림자를 바라보는 웹툰 컷",
    });
  }

  return null;
}

function buildPreviewComicChapters(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed?: number;
}): ComicChapter[] {
  if (isCompatibilityCategory(params.categoryId, params.categoryTitle)) {
    return buildCompatibilityPreviewComicChapters(params);
  }

  const isMoneyPreview = params.categoryId === "money" || params.categoryTitle.includes("재물");
  if (isMoneyPreview) {
    const profile = buildWealthProfile(params.user, params.manse);
    const name = safeText(params.user.name, "너");
    const blocker = profile.primaryBlocker;
    return [
      makeComicChapter({
        id: "money-preview-01-capacity",
        sceneType: "entrance",
        speaker: "dohoon",
        character: "dohoon-serious",
        emotion: "shock",
        mood: "dark",
        title: "도훈이 보는 네 돈그릇",
        text: comicText(
          `${name}, 네 돈그릇은 ${profile.capacity.range}으로 본다.`,
          "작은 돈만 만지다 끝날 사주는 아니다.",
          "문제는 그릇이 아니라 지금 그 그릇을 얼마나 쓰고 있느냐다.",
        ),
        visualHint: "실제 도훈이 사주판 위에 큰 금액 판정을 띄우는 실사 웹툰형 컷",
      }),
      makeComicChapter({
        id: "money-preview-02-utilization",
        sceneType: "core",
        speaker: "dohoon",
        character: "dohoon-pointing",
        emotion: "pointing",
        mood: "gold",
        title: `현재 돈그릇 활용도 ${profile.utilization}%`,
        text: comicText(
          `버는 힘 ${profile.scores.earning}점 · 모으는 힘 ${profile.scores.saving}점`,
          `키우는 힘 ${profile.scores.growing}점 · 지키는 힘 ${profile.scores.keeping}점`,
          "높은 점수와 낮은 점수의 차이가 지금 네 돈이 답답한 이유다.",
        ),
        visualHint: "도훈 옆에 네 개의 재물 점수 게이지가 크게 떠 있는 컷",
      }),
      makeComicChapter({
        id: "money-preview-03-style",
        sceneType: "core",
        speaker: "dohoon",
        character: "dohoon",
        emotion: "serious",
        mood: "paper",
        title: "네가 돈을 만드는 방식",
        text: comicText(
          `${profile.moneyStyle.primary} ${profile.moneyStyle.score}점`,
          profile.moneyStyle.description,
          `보조 돈길은 ${profile.moneyStyle.secondary} 쪽이다.`,
        ),
        visualHint: "도훈이 두 갈래 돈길 중 강한 길을 손으로 가리키는 컷",
      }),
      makeComicChapter({
        id: "money-preview-04-blocker",
        sceneType: "warning",
        speaker: "dohoon",
        character: "dohoon-warning",
        emotion: "warning",
        mood: "redDark",
        title: `돈그릇을 깨는 1순위 · ${blocker.type}`,
        text: comicText(
          `위험도 ${blocker.score}점`,
          blocker.description,
          "돈복이 없어서가 아니라 이 선택에서 돈복이 자꾸 새는 것이다.",
        ),
        visualHint: "도훈이 붉은 경고선과 깨진 돈그릇을 가리키는 컷",
      }),
      makeComicChapter({
        id: "money-preview-05-first-window",
        sceneType: "timing",
        speaker: "dohoon",
        character: "dohoon-serious",
        emotion: "serious",
        mood: "mist",
        title: `첫 돈문 · ${profile.windows.first.age}`,
        text: comicText(
          profile.windows.first.meaning,
          `그다음 확장 돈문은 ${profile.windows.expansion.age}다.`,
          "이 두 구간은 네 인생에서 돈을 보는 방식과 다루는 규모가 달라지는 시기다.",
        ),
        visualHint: "도훈 뒤로 나이 구간이 표시된 금빛 평생 재물 타임라인이 펼쳐지는 컷",
      }),
      makeComicChapter({
        id: "money-preview-06-peak",
        sceneType: "blessing",
        speaker: "dohoon",
        character: "dohoon-pointing",
        emotion: "pointing",
        mood: "gold",
        title: `인생 최대 재물 돈문 · ${profile.windows.peak.age}`,
        text: comicText(
          "이 구간이 네 인생에서 가장 큰 돈을 다룰 수 있는 핵심 구간이다.",
          `최대 피크 돈그릇은 ${profile.peakRange}으로 본다.`,
          "그 돈이 직장·사업·거래·자산 중 어디에서 열리는지는 전체 리포트에서 푼다.",
        ),
        visualHint: "도훈이 가장 밝게 열린 금빛 돈문 앞에서 최대 재물 시기를 가리키는 컷",
      }),
      makeComicChapter({
        id: "money-preview-07-risk-lock",
        sceneType: "lock",
        speaker: "dohoon",
        character: "dohoon-warning",
        emotion: "warning",
        mood: "black",
        title: "돈이 크게 깨질 수 있는 시기",
        text: comicText(
          `위험 돈문은 ${profile.windows.risk.age} 전후에 따로 잡힌다.`,
          "이 구간에서 무엇을 피해야 하는지는 잠겨 있다.",
          `돈이 내 것으로 굳는 시기 ${profile.windows.consolidation.age}도 전체판에서 이어서 본다.`,
        ),
        visualHint: "평생 돈 타임라인 중 위험구간과 자산구간이 자물쇠로 잠긴 컷",
        isLocked: true,
        ctaText: "평생 재물 흐름 전체 보기",
      }),
      makeComicChapter({
        id: "money-preview-08-cta",
        sceneType: "lock",
        speaker: "dohoon",
        character: "dohoon-pointing",
        emotion: "pointing",
        mood: "gold",
        title: "돈그릇은 보였다. 이제 채우는 법을 볼 차례다",
        text: comicText(
          `네 돈그릇은 ${profile.capacity.range}, 현재 활용도는 ${profile.utilization}%다.`,
          `${profile.windows.peak.age}의 최대 돈문에서 무엇으로 벌어야 하는지, ${profile.windows.risk.age} 무엇을 피해야 하는지까지 이어서 봐야 한다.`,
          "유료 전체 리포트는 무료 판정을 바꾸지 않고 그 이유와 현실 돈길을 길게 푼다.",
        ),
        visualHint: "도훈이 잠긴 전체 재물 리포트를 열어 보라고 손짓하는 마지막 컷",
        isLocked: true,
        ctaText: "내 평생 재물 흐름 전체 보기",
      }),
    ];
  }

  const script = getWebtoonCategoryScript(params);
  const focus = getComicDeepFocus({
    categoryId: params.categoryId,
    categoryTitle: params.categoryTitle,
    script,
  });
  const label = categoryLabelForComic(params.categoryId, params.categoryTitle);
  const snap = getElementSnapshot(params.manse);
  const ghost = getRepeatGhostProfile(params.user, params.manse);
  const stickyHookChapter = buildV104FreeHookChapter(params);

  return [
    ...(stickyHookChapter ? [stickyHookChapter] : []),
    makeComicChapter({
      id: "preview-01-found",
      sceneType: "entrance",
      speaker: "dohoon",
      character: "dohoon-serious",
      emotion: "shock",
      mood: "dark",
      title: "어? 잠깐만",
      text: isMoneyPreview
        ? comicText(
            "어? 너 재물운이 작진 않은데?",
            `크게 보면 ${buildWealthProfile(params.user, params.manse).capacity.range} 볼 수 있는 운인데, 그런데 너는 지금도 이렇게 생각하고 있을 거다. 나는 왜 돈이 모이지 않는 거지?`,
            "사주판에서 먼저 튀어나오는 게 하나 있다. 이건 그냥 좋은 말 몇 줄 듣고 넘길 운이 아니다.",
            "지금부터 봐야 할 건 운이 있냐 없냐가 아니다. 어디서 열리고, 어디서 막히는지다.",
          )
        : comicText(
            script.opening,
            "사주판에서 먼저 튀어나오는 게 하나 있다. 이건 그냥 좋은 말 몇 줄 듣고 넘길 운이 아니다.",
            "지금부터 봐야 할 건 운이 있냐 없냐가 아니다. 어디서 열리고, 어디서 막히는지다.",
          ),
      visualHint: "검붉은 방 안에서 도훈이 사주판을 보다가 멈칫하는 장면",
    }),
    makeComicChapter({
      id: "preview-02-big-door",
      sceneType: "core",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: script.mood,
      title: script.bigLuckTitle,
      text: comicText(
        script.bigLuckText,
        "여기까지 보면 괜찮아 보인다. 그런데 여기서 바로 움직이면 반쪽만 본 거다.",
        "진짜 중요한 건 다음 장이다. 왜 이 운이 아직 네 손에 확 잡히지 않았는지 봐야 한다.",
      ),
      visualHint: "사주판 위로 금빛 문이 열리려다 멈추는 장면",
    }),
    makeComicChapter({
      id: "preview-03-strange",
      sceneType: "mind",
      speaker: "dohoon",
      character: "user-shadow",
      emotion: "serious",
      mood: "mist",
      title: script.twistTitle,
      text: comicText(
        script.twistText,
        focus.mind,
        "사람들은 여기서 착각한다. 좋은 운이 보이면 다 끝난 줄 안다. 아니다. 좋은 운 옆에 붙은 막힌 문까지 봐야 판정이 나온다.",
      ),
      visualHint: "내담자 그림자 뒤로 닫힌 문과 작은 균열이 보이는 장면",
    }),
    makeComicChapter({
      id: "preview-04-door",
      sceneType: "warning",
      speaker: "dohoon",
      character: "dohoon-warning",
      emotion: "warning",
      mood: "redDark",
      title: script.blockedTitle,
      text: comicText(
        script.blockedText,
        `이 막힘은 네 사주에서 ${snap.strongestElement} 쪽 힘과 ${snap.weakestElement} 쪽 흔들림이 부딪히는 자리에서 먼저 드러난다.`,
        "쉽게 말하면, 잘하는 쪽으로만 밀면 안 풀린다. 약하게 새는 쪽을 잡아야 열린다.",
      ),
      visualHint: "도훈이 붉은 실로 막힌 문고리를 가리키는 장면",
    }),
    makeComicChapter({
      id: "preview-05-ghost",
      sceneType: "warning",
      speaker: "badLuckGhost",
      character: "bad-luck-ghost",
      emotion: "warning",
      mood: "black",
      title: ghost.primary,
      text: comicText(
        ghost.summary,
        ghost.risk,
        "이건 진짜 귀신이 아니다. 같은 장면에서 같은 선택을 하게 만드는 반복 기운이다. 이걸 모르면 다음에도 같은 문 앞에서 막힌다.",
      ),
      visualHint: "작은 악운 캐릭터가 닫힌 문틈에서 얼굴을 내미는 장면",
    }),
    makeComicChapter({
      id: "preview-06-half-open",
      sceneType: "blessing",
      speaker: "fortuneSpirit",
      character: "fortune-spirit",
      emotion: "smile",
      mood: "gold",
      title: script.blessingTitle,
      text: comicText(
        script.blessingText,
        "여기서 방향이 바뀐다. 막힌 문을 모르고 움직이면 운이 새고, 문을 알고 움직이면 같은 사주도 결과가 달라진다.",
        "무료판에서 보여줄 수 있는 건 여기까지다. 이제 진짜 판정은 안쪽에 있다.",
      ),
      visualHint: "금빛 복 캐릭터가 닫힌 문에 손을 대자 틈이 열리는 장면",
    }),
    makeComicChapter({
      id: "preview-07-locked-report",
      sceneType: "lock",
      speaker: "dohoon",
      character: "dohoon-pointing",
      emotion: "pointing",
      mood: "black",
      title: `${label} 20페이지 안쪽`,
      text: comicText(
        "여기서부터는 짧게 못 본다.",
        focus.lock,
        "언제 열리는지, 뭘 잡아야 하는지, 뭘 버려야 하는지, 마지막 판정까지 20페이지로 갈라서 본다.",
      ),
      visualHint: "검붉은 문 뒤로 스무 장의 금빛 페이지가 차례로 켜지는 장면",
      isLocked: true,
      ctaText: "20페이지 사주극장 열기",
    }),
  ];
}


function getConcreteLifeTimingSummary(user: UserInfo, manse: any) {
  const moneyTiming = getMoneyTimingText(user, manse);
  return comicText(
    "초년은 편한 운으로 보지 않는다. 책임, 눈치, 사람 피로가 먼저 붙는 구간이다.",
    "20대 후반부터 30대 초반은 방향을 바꾸는 구간이다. 사람 따라 움직이면 흔들리고, 돈 받을 구조가 보이는 일로 좁히면 산다.",
    `${moneyTiming.firstMoneyAge}~${moneyTiming.firstMoneyAge + 2}세에는 돈 보는 눈이 뜬다. 이때부터 지인 말, 급한 투자, 재고 안는 장사를 갈라내야 한다.`,
    `${moneyTiming.strongMoneyAge}~${moneyTiming.strongMoneyAge + 3}세에는 일과 돈이 같이 굵어진다. 구매, 납품, 소싱, 기술값, 관리비, 반복 주문처럼 받을 금액과 입금일이 보이는 돈을 잡아라.`,
    `${moneyTiming.assetAge}세 이후에는 빠르게 벌어 쓰는 돈보다 쌓고 지키는 돈이 강해진다. 월세·재고·광고비가 먼저 나가는 판은 줄이고, 반복으로 들어오는 돈을 남겨라.`
  );
}

function getConcreteChoosePage(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  script: WebtoonCategoryScript;
  manse: any;
  partnerManse?: any | null;
}) {
  const title = params.categoryTitle || "";
  const moneyDirection = getConcreteMoneyDirection(params.manse);
  const moneyTiming = getMoneyTimingText(params.user, params.manse);
  const career = getCareerArchetype(params.manse);
  const health = getHealthProfile(params.manse);
  const love = getLovePartnerProfile(params.manse);

  if (params.categoryId === "money" || title.includes("재물")) {
    return comicText(
      moneyDirection.workAnswer,
      moneyDirection.earn,
      `시작은 이렇게 자른다. ${moneyDirection.start}`,
      `시기는 ${moneyTiming.firstMoneyAge}~${moneyTiming.firstMoneyAge + 2}세에 돈눈이 뜨고, ${moneyTiming.strongMoneyAge}~${moneyTiming.strongMoneyAge + 3}세에 돈길이 굵어진다. 올해는 ${moneyTiming.moneyMoveMonth}월과 ${moneyTiming.moneyCatchMonth}월에 잡고, ${moneyTiming.moneyLeakMonth}월에는 돈을 넣지 마라.`
    );
  }

  if (isCareerCategory(params.categoryId, title)) {
    return comicText(
      `일 판정은 '${career.combined}'이다. 이 판정은 회사냐 창업이냐보다 먼저다.`,
      "회사에 있으면 그냥 오래 버티는 자리 말고, 견적·단가·납기·거래처·품질·현장 결과를 직접 보는 자리를 잡아라.",
      "밖으로 판을 열면 먼저 사무실 차리고 사람 쓰지 마라. 주문, 받을 금액, 입금일, 네 받을 돈이 먼저 보이는 작은 판부터 잡아라.",
      `버릴 판은 ${career.warning}이다. 이 판은 바쁘기만 하고 돈과 이름이 남지 않는다.`
    );
  }

  if (isLoveMarriageCategory(params.categoryId, title)) {
    return comicText(
      `잡을 사람은 ${love.good}이다.`,
      `피할 사람은 ${love.avoid}이다. 이 사람은 처음엔 설레도 끝에 가면 네 마음만 늙힌다.`,
      "좋은 사람인지 보려면 말보다 약속 시간, 돈 쓰는 방식, 불편한 말에 답하는 태도, 가족과의 거리감을 봐라.",
      "연애는 감정으로 시작해도 결혼은 생활로 버틴다. 생활비·시간·연락·가족 거리감이 흐리면 멈춰라."
    );
  }

  if (params.categoryId === "health" || title.includes("건강")) {
    return comicText(
      `먼저 잡을 몸 신호는 ${health.type}이다.`,
      `오늘부터 바꿀 것은 ${health.action.join(", ")}이다.`,
      `버릴 습관은 ${health.avoid.join(", ")}이다.`,
      "운동은 센 운동부터 하지 마라. 걷기, 하체 스트레칭, 수면 시간 고정, 소화가 덜 부담되는 식사부터 잡아라."
    );
  }

  if (isMonthlyCategory(params.categoryId, title)) {
    return comicText(
      `올해는 ${moneyTiming.moneyMoveMonth}월에 돈 이야기가 움직이고, ${moneyTiming.moneyLeakMonth}월에 돈이 샌다. ${moneyTiming.moneyCatchMonth}월에 다시 잡을 문이 온다.`,
      "움직일 달에는 연락, 견적, 거래, 제안, 이직 이야기를 잡아라. 새는 달에는 계약·투자·지인 부탁·큰 지출을 미뤄라.",
      "올해는 무조건 밀어붙이는 해가 아니다. 달마다 문이 다르다. 잡을 달과 멈출 달을 갈라라."
    );
  }

  if (params.categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운")) {
    return comicText(
      getConcreteLifeTimingSummary(params.user, params.manse),
      "대운이 열린다는 말은 추상적인 말이 아니다. 이 시기에 직업, 거래처, 돈 버는 방식, 사람관계 중 하나를 갈아야 한다는 뜻이다.",
      "그때 잡을 건 월세·재고·광고비가 먼저 나가는 판이 아니라 받을 금액, 입금일, 네 받을 돈이 먼저 정해진 일이다."
    );
  }

  if (params.categoryId === "traditional" || title.includes("평생") || isChildrenCategory(params.categoryId, title)) {
    return comicText(
      getConcreteLifeTimingSummary(params.user, params.manse),
      `돈은 이렇게 잡아라. ${moneyDirection.workAnswer} ${moneyDirection.earn}`,
      "사람은 불쌍해서 챙기는 사람, 책임을 미루는 사람, 돈과 시간을 계속 빼가는 사람을 끊어라.",
      `몸은 ${health.type}부터 잡아라. ${health.action.join(", ")}부터 바꾸고, ${health.avoid.join(", ")}은 버려라.`
    );
  }

  return params.script.choose;
}

function getConcreteAvoidPage(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  script: WebtoonCategoryScript;
  manse: any;
}) {
  const title = params.categoryTitle || "";
  const moneyDirection = getConcreteMoneyDirection(params.manse);
  const career = getCareerArchetype(params.manse);
  const health = getHealthProfile(params.manse);
  const love = getLovePartnerProfile(params.manse);

  if (params.categoryId === "money" || title.includes("재물")) return moneyDirection.avoid;
  if (isCareerCategory(params.categoryId, title)) return `버릴 건 ${career.warning}이다. 책임은 네가 지고 돈 받을 사람, 받을 금액, 입금일이 남 손에 있는 일은 버려라.`;
  if (isLoveMarriageCategory(params.categoryId, title)) return `버릴 사람은 ${love.avoid}이다. 말은 뜨겁고 책임이 늦은 사람, 돈과 시간 기준을 흐리는 사람, 가족 문제를 나중으로 미루는 사람은 피하라.`;
  if (params.categoryId === "health" || title.includes("건강")) return `버릴 습관은 ${health.avoid.join(", ")}이다. 이걸 계속하면 운이 들어와도 몸이 못 받친다.`;
  return params.script.avoid;
}

function getConcreteTimingPage(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  script: WebtoonCategoryScript;
  manse: any;
}) {
  const title = params.categoryTitle || "";
  const moneyTiming = getMoneyTimingText(params.user, params.manse);
  const loveTiming = getLoveTimingProfile(params.manse);
  const marriageTiming = getMarriageTimingProfile(params.manse);

  if (params.categoryId === "money" || title.includes("재물")) {
    return comicText(
      `${moneyTiming.firstMoneyAge}~${moneyTiming.firstMoneyAge + 2}세에 돈 보는 눈이 뜬다.`,
      `${moneyTiming.strongMoneyAge}~${moneyTiming.strongMoneyAge + 3}세에 재물운이 굵어진다. 이때 거래처, 반복 주문, 납품, 기술값, 관리비처럼 다시 들어오는 돈을 잡아라.`,
      `${moneyTiming.assetAge}세 이후에는 빨리 버는 돈보다 쌓고 지키는 돈이 강하다.`,
      `올해는 ${moneyTiming.moneyMoveMonth}월에 돈 이야기가 움직이고, ${moneyTiming.moneyLeakMonth}월에는 돈이 샌다. ${moneyTiming.moneyCatchMonth}월에는 다시 잡을 문이 열린다.`
    );
  }

  if (params.categoryId === "lifeFlow" || title.includes("인생") || title.includes("대운") || params.categoryId === "traditional" || title.includes("평생")) {
    return getConcreteLifeTimingSummary(params.user, params.manse);
  }

  if (isMonthlyCategory(params.categoryId, title)) {
    return comicText(
      `${moneyTiming.moneyMoveMonth}월은 돈 이야기가 움직이는 달이다. 견적, 거래, 제안, 판매, 받을 돈 확인을 잡아라.`,
      `${moneyTiming.moneyLeakMonth}월은 돈이 새는 달이다. 투자, 지인 부탁, 큰 지출, 재고 안는 선택을 미뤄라.`,
      `${moneyTiming.moneyCatchMonth}월은 다시 잡을 달이다. 앞에서 놓친 거래나 정리한 일을 다시 잡아라.`
    );
  }

  if (isLoveMarriageCategory(params.categoryId, title)) {
    return comicText(
      `인연이 살아나는 시기는 ${loveTiming.timing}이다.`,
      `결혼으로 보는 시기는 ${marriageTiming.timing}이다.`,
      "이 시기에 들어오는 사람은 말보다 반복 행동을 봐라. 약속, 돈, 가족 거리감에서 답이 나온다."
    );
  }

  return params.script.timing;
}


function fullComicText(value: string, fallback = "") {
  const cleaned = cleanGeneratedText(String(value || ""))
    .replace(/^[-•]\s*/gm, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  return cleaned || fallback;
}

function extractFullComicSections(resultText: string, categoryId: CategoryId, categoryTitle: string) {
  const text = cleanGeneratedText(resultText || "").trim();
  const sections: { title: string; body: string }[] = [];
  const allowedTitles = getAllowedFullSectionTitles(categoryId, categoryTitle)
    .split(/\r?\n/)
    .map((line) => stripSectionTitle(line).trim())
    .filter(Boolean);
  const limit = categoryId === "today" ? 950 : 1300;

  function splitLongTextIntoUnits(body: string) {
    const rawParas = body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
    const units: string[] = [];
    for (const para of rawParas.length ? rawParas : [body]) {
      if (para.length <= limit) {
        units.push(para);
        continue;
      }
      // 문단 하나가 너무 길면 문장 단위로 쪼갠다. 한 페이지 통짜 방지용이다.
      const sentences = para
        .replace(/([.!?。！？]|다\.|요\.|죠\.)\s+/g, "$1\n")
        .split(/\n+/)
        .map((x) => x.trim())
        .filter(Boolean);
      let chunk = "";
      for (const sentence of sentences.length ? sentences : [para]) {
        const next = chunk ? `${chunk} ${sentence}` : sentence;
        if (next.length > limit && chunk) {
          units.push(chunk);
          chunk = sentence;
        } else {
          chunk = next;
        }
      }
      if (chunk) units.push(chunk);
    }
    return units;
  }

  function push(title: string, body: string) {
    const cleanTitle = stripSectionTitle(title || "").trim();
    const cleanBody = fullComicText(body || "");
    if (!cleanTitle || !cleanBody) return;
    if (/내부|규칙|고정|만세력|프롬프트|AI는|절대/.test(cleanTitle + cleanBody)) return;

    if (cleanBody.length <= limit) {
      sections.push({ title: cleanTitle, body: cleanBody });
      return;
    }

    const units = splitLongTextIntoUnits(cleanBody);
    let buf: string[] = [];
    let idx = 1;
    for (const unit of units) {
      const next = [...buf, unit].join("\n\n");
      if (next.length > limit && buf.length) {
        sections.push({ title: idx === 1 ? cleanTitle : `${cleanTitle} ${idx}`, body: buf.join("\n\n") });
        idx += 1;
        buf = [unit];
      } else {
        buf.push(unit);
      }
    }
    if (buf.length) sections.push({ title: idx === 1 ? cleanTitle : `${cleanTitle} ${idx}`, body: buf.join("\n\n") });
  }

  // 1) [제목] 형식
  const bracketRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=\n\[[^\]]+\]|$)/g;
  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(text)) !== null) push(match[1], match[2] || "");
  if (sections.length > 0) return sections;

  // 2) 허용된 제목이 대괄호 없이 나온 경우
  if (allowedTitles.length) {
    const escaped = allowedTitles.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const titleGroup = escaped.join("|");
    const plainRegex = new RegExp(`(?:^|\\n)(?:\\*\\*)?(?:\\d{1,2}[.)]\\s*)?(${titleGroup})(?:\\*\\*)?\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n(?:\\*\\*)?(?:\\d{1,2}[.)]\\s*)?(?:${titleGroup})(?:\\*\\*)?\\s*:?\\s*\\n|$)`, "g");
    while ((match = plainRegex.exec(text)) !== null) push(match[1], match[2] || "");
    if (sections.length > 0) return sections;
  }

  // 3) Markdown 제목
  const mdRegex = /(?:^|\n)#{1,3}\s+(.+?)\s*\n([\s\S]*?)(?=\n#{1,3}\s+|$)/g;
  while ((match = mdRegex.exec(text)) !== null) push(match[1], match[2] || "");
  if (sections.length > 0) return sections;

  // 4) 굵은 제목/번호 제목/콜론 제목. 허용 제목과 비슷한 것만 잡는다.
  const looseTitleRegex = /(?:^|\n)(?:\*\*)?(?:\d{1,2}[.)]\s*)?([^\n\[\]#]{2,42})(?:\*\*)?\s*:?\s*\n([\s\S]*?)(?=\n(?:\*\*)?(?:\d{1,2}[.)]\s*)?[^\n\[\]#]{2,42}(?:\*\*)?\s*:?\s*\n|$)/g;
  while ((match = looseTitleRegex.exec(text)) !== null) {
    const maybeTitle = stripSectionTitle(match[1]).trim();
    if (allowedTitles.includes(maybeTitle) || /판정|재물운|일운|연애운|인연운|건강운|시간대|악운|종합|사주상 분석|장사|시기|배우자|궁합|결혼|올해|대운|평생|고민/.test(maybeTitle)) {
      push(maybeTitle, match[2] || "");
    }
  }
  if (sections.length > 0) return sections;

  // 5) 마지막 fallback: 제목 없이 온 본문도 절대 한 페이지로 몰아넣지 않는다.
  const units = splitLongTextIntoUnits(text);
  let buf: string[] = [];
  let page = 1;
  for (const unit of units) {
    const next = [...buf, unit].join("\n\n");
    if (next.length > limit && buf.length) {
      push(page === 1 ? "도훈의 첫 판정" : `사주 풀이 ${page}`, buf.join("\n\n"));
      page += 1;
      buf = [unit];
    } else {
      buf.push(unit);
    }
  }
  if (buf.length) push(page === 1 ? "도훈의 첫 판정" : `사주 풀이 ${page}`, buf.join("\n\n"));
  return sections;
}

function buildFullComicChapters(params: {
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  resultText: string;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed?: number;
}): ComicChapter[] {
  // 유료 화면은 짧은 고정 카드가 아니라, AI가 생성한 긴 본문 섹션을 그대로 페이지로 보여준다.
  // 여기서 170자 요약을 쓰면 유료가 한 문장짜리 카드처럼 보인다.
  const sections = extractFullComicSections(params.resultText, params.categoryId, params.categoryTitle);
  const fallback = buildCleanComicChapters({
    user: params.user,
    categoryId: params.categoryId,
    categoryTitle: params.categoryTitle,
    mode: "full",
  });

  if (sections.length === 0) return fallback;

  return sections.map((item, idx) => makeComicChapter({
    id: `full-report-${idx + 1}`,
    sceneType: idx === 0 ? "entrance" : idx === sections.length - 1 ? "final" : "detail",
    speaker: "dohoon",
    character: idx === 0 ? "dohoon-serious" : idx === sections.length - 1 ? "dohoon-pointing" : "dohoon",
    emotion: idx === 0 ? "serious" : idx === sections.length - 1 ? "pointing" : "normal",
    mood: idx === 0 ? "dark" : idx === sections.length - 1 ? "gold" : "paper",
    title: item.title,
    text: item.body,
    visualHint: "도훈이 긴 유료 사주풀이 본문을 한 장면씩 자세히 읽어주는 화면",
  }));
}

function buildComicChapters(params: {
  mode: ComicMode;
  user: UserInfo;
  categoryId: CategoryId;
  categoryTitle: string;
  resultText: string;
  manse: any;
  partnerManse?: any | null;
  fortuneSeed?: number;
}): ComicChapter[] {
  if (params.mode === "preview") return buildPreviewComicChapters(params);
  return buildFullComicChapters(params);
}

function responsePayload(params: {
  preview: string;
  full: string;
  result: string;
  manse?: any;
  partnerManse?: any | null;
  fixedConclusion?: string;
  profileText?: string;
  fortuneSeed?: number;
  birthConversion?: {
    user: BirthConversionInfo;
    partner: BirthConversionInfo | null;
  };
  repeatGhostProfile?: RepeatGhostProfile;
  pastLifeProfile?: any;
  comicChapters?: ComicChapter[];
  scoreVisual?: RelationshipScoreVisual;
  wealthProfile?: WealthProfile | null;
  categoryPreviewProfile?: CategoryPreviewProfile | null;
}) {
  const freeComicScenes =
    params.categoryPreviewProfile?.webtoonScenes?.length
      ? params.categoryPreviewProfile.webtoonScenes
      : undefined;

  return {
    ...params,
    freeComicScenes,
    routeVersion: ROUTE_VERSION,
    relationshipLogic: RELATIONSHIP_LOGIC,
    yearlyLogic: YEARLY_LOGIC,
    worryLogic: "v118-worry-paid-openai-call-restored",
    premiumLogic: PREMIUM_QUESTION_LOGIC,
    childrenLogic: CHILDREN_LOGIC,
    deterministicLogic: DETERMINISTIC_LOGIC,
    moneyUniqueLogic: MONEY_UNIQUE_LOGIC,
    wealthProfileLogic: "wealth-profile-v170-shared-preview-full-lifetime-windows",
    categoryPreviewProfileLogic: "category-preview-profile-v177-personalized-content-cinematic-dohoon-scene-engine",
    plainLanguageLogic: "no-standalone-five-elements-v2",
    fixedCareerLogic: "shared-money-career-pathways-v211",
    profileLogic: PROFILE_LOGIC,
    previewLogic: PREVIEW_LOGIC,
    preserveLogic:
      "original-final-route-preserved-premium-question-core-only-no-shrink-v4",
    promptLeakFixLogic: "v24-internal-data-separated-no-bracket-leak-v1",
    sajuTypeStoryLogic: "v29-ghost-saju-story-paid-structure-v1",
    ghostSajuLogic: "ghost-metaphor-no-fear-story-layer-v1",
    todayFourCardLogic: "v83-today-date-status-timeflow-weekend-aware",
    comicTheaterLogic: "v84-compatibility-full-pages-direct-report",
    careerDetailedLogic: "v211-money-career-single-source-plus-foundation",
    relationshipScoreVisualLogic: RELATIONSHIP_LOGIC,
    freeWebtoonContentLogic: "v182-health-paid-ai-longform-retry",
    healthPaidReportFormat:
      params.categoryPreviewProfile?.kind === "health" ? "part-report" : null,
    healthPaidReportSource:
      params.categoryPreviewProfile?.kind === "health"
        ? params.categoryPreviewProfile.healthPaidReportSource || "fallback"
        : null,
  };
}


function cleanWorryStringV149(value: any) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 900);
}


function normalizeSelectedWorryTypeV157(value: any) {
  const t = cleanWorryStringV149(value);
  if (!t) return "";
  if (/^(일·사업|일|직장|직업|구직|취업|이직|퇴사|창업|커리어|일자리)$/.test(t) || /일·사업|직장|직업|구직|취업|이직|퇴사|창업|커리어|일자리/.test(t)) return "일·사업";
  if (/^(돈·거래|돈|재물|금전|거래|대출|투자)$/.test(t) || /돈·거래|재물|금전|대출|투자|빌려/.test(t)) return "돈";
  if (/^(이사·거주|이사|거주|지역|집)$/.test(t) || /이사·거주|거주|지역|집/.test(t)) return "이사";
  if (/^(사람·관계|연애|관계|사람|애인|재회)$/.test(t) || /사람·관계|연애|애인|재회|관계/.test(t)) return "연애";
  if (/^(경조사·예의|조문|장례|상가집|문상|부고)$/.test(t) || /경조사·예의|조문|장례|상가집|문상|부고/.test(t)) return "조문";
  if (/^(가족|부모|형제|자식)$/.test(t) || /가족|부모|형제|자식/.test(t)) return "가족";
  if (/^(건강·몸|건강|몸|수면|피로)$/.test(t) || /건강·몸|건강|몸|수면|피로/.test(t)) return "건강";
  if (/^(선택·결정|선택|결정)$/.test(t) || /선택·결정/.test(t)) return "선택";
  if (/^기타$/.test(t)) return "기타";
  return t;
}

function inferWorryTypeFromTextV157(source: string) {
  const q = cleanWorryStringV149(source);
  if (/친구가\s*죽|친구\s*죽|상가집|장례식|장례|문상|조문|부고|빈소|조의|조의금|고인/.test(q)) return "조문";
  if (/직장|구직|취업|일자리|이직|퇴사|직업|회사|알바|창업|사업|커리어|면접|채용|합격|출근/.test(q)) return "일·사업";
  if (/이사|지역|어디로|집|거주|동네|생활권|월세|전세|매매/.test(q)) return "이사";
  if (/돈|빌려|빌려달라|대출|투자|금액|생활비|수익|손해|재물/.test(q)) return "돈";
  if (/연애|애인|남자친구|여자친구|헤어|이별|재회|상대|사랑/.test(q)) return "연애";
  if (/가족|부모|자식|형제|배우자|남편|아내/.test(q)) return "가족";
  if (/건강|몸|아프|병원|수면|피로|불안/.test(q)) return "건강";
  return "선택";
}
function inferWorryTypeV151(body: any, user: any) {
  const directRaw = body?.worryType || user?.worryType;
  const direct = normalizeSelectedWorryTypeV157(directRaw);

  // v157: 사용자가 화면에서 선택한 고민 유형이 최우선이다.
  // 예: "일·사업/직장/구직"을 선택했으면 질문 안에 돈, 가족, 형, 월세가 있어도 직장·구직 상담으로 고정한다.
  if (direct && direct !== "선택" && direct !== "기타") return direct;

  const source = cleanWorryStringV149(
    `${body?.question || ""} ${user?.question || ""} ${body?.situation || ""} ${body?.worrySituation || ""} ${user?.worrySituation || ""}`,
  );

  const explicit = source.match(/고민\s*유형\s*[:：]\s*([^\n]+)/);
  const explicitType = normalizeSelectedWorryTypeV157(explicit?.[1] || "");
  if (explicitType && explicitType !== "선택" && explicitType !== "기타") return explicitType;

  return inferWorryTypeFromTextV157(source);
}

function getStructuredWorryPayloadV149(body: any, user: any) {
  const type = inferWorryTypeV151(body, user);
  const payload: Record<string, string> = {
    worryType: type,
    question: cleanWorryStringV149(body?.question || user?.question),
    situation: cleanWorryStringV149(body?.situation || body?.worrySituation || user?.worrySituation),
    reason: cleanWorryStringV149(body?.reason || body?.worryReason || user?.worryReason),
    desiredVerdict: cleanWorryStringV149(body?.desiredVerdict || user?.desiredVerdict),
  };

  const add = (key: string, value: any) => {
    const text = cleanWorryStringV149(value);
    if (text) payload[key] = text;
  };

  if (type === "이사") {
    add("currentRegion", body?.currentRegion || user?.currentRegion);
    add("candidateRegions", body?.candidateRegions || user?.candidateRegions);
    add("currentWork", body?.currentWork || user?.currentWork);
    add("moneySituation", body?.moneySituation || user?.moneySituation);
    add("relationshipInfo", body?.relationshipInfo || user?.relationshipInfo);
    add("healthConcern", body?.healthConcern || user?.healthConcern);
  } else if (type === "돈") {
    add("moneySituation", body?.moneySituation || user?.moneySituation);
    add("relationshipInfo", body?.relationshipInfo || user?.relationshipInfo);
  } else if (type === "조문") {
    add("relationshipInfo", body?.relationshipInfo || user?.relationshipInfo);
    add("moneySituation", body?.moneySituation || user?.moneySituation);
    add("healthConcern", body?.healthConcern || user?.healthConcern);
  } else if (type === "연애") {
    add("relationshipInfo", body?.relationshipInfo || user?.relationshipInfo);
  } else if (type === "가족") {
    add("relationshipInfo", body?.relationshipInfo || user?.relationshipInfo);
    add("moneySituation", body?.moneySituation || user?.moneySituation);
  } else if (type === "퇴사·창업" || type === "일·사업") {
    add("currentWork", body?.currentWork || user?.currentWork);
    // v158: 일·사업 상담에서는 이전 돈상담 잔여값이 섞이면 바로 오염된다.
    // 급여/연봉/세후/월급 같은 구직 조건만 받되, 빌려주는 돈/형/친구 돈거래 문맥은 버린다.
    const rawMoneyForCareer = cleanWorryStringV149(body?.moneySituation || user?.moneySituation);
    if (rawMoneyForCareer && !/빌려|빌려달라|돈거래|형|오빠|누나|언니|동생|친구|지인|가족/.test(rawMoneyForCareer)) {
      add("moneySituation", rawMoneyForCareer);
    }
    add("candidateRegions", body?.candidateRegions || user?.candidateRegions);
  } else if (type === "건강") {
    add("healthConcern", body?.healthConcern || user?.healthConcern);
    add("currentWork", body?.currentWork || user?.currentWork);
  } else {
    add("currentRegion", body?.currentRegion || user?.currentRegion);
    add("candidateRegions", body?.candidateRegions || user?.candidateRegions);
    add("currentWork", body?.currentWork || user?.currentWork);
    add("moneySituation", body?.moneySituation || user?.moneySituation);
    add("relationshipInfo", body?.relationshipInfo || user?.relationshipInfo);
    add("healthConcern", body?.healthConcern || user?.healthConcern);
  }

  return payload;
}

function buildStructuredWorryQuestionV149(payload: Record<string, string>) {
  const labels: Record<string, string> = {
    worryType: "고민 유형",
    question: "질문",
    situation: "현재 상황",
    currentRegion: "현재 지역/기준점",
    candidateRegions: "후보/선택지",
    reason: "고민 이유",
    currentWork: "현재 일/사업",
    moneySituation: "돈/예산/금액",
    relationshipInfo: "사람/관계/가족",
    healthConcern: "몸/건강",
    desiredVerdict: "원하는 판정",
  };

  return Object.entries(payload)
    .filter(([, value]) => cleanWorryStringV149(value))
    .map(([key, value]) => `${labels[key] || key}: ${value}`)
    .join("\n");
}


function normalizePremiumWorryTypeV154(type: string, question = "") {
  const direct = normalizeSelectedWorryTypeV157(type);
  // v157: 접수 화면에서 사용자가 선택한 분야가 최우선이다.
  // 선택한 분야가 일·사업이면 질문에 돈/형/가족 단어가 있어도 돈 상담으로 바꾸지 않는다.
  if (direct && direct !== "선택" && direct !== "기타") return direct;

  const explicit = String(question || "").match(/고민\s*유형\s*[:：]\s*([^\n]+)/);
  const explicitType = normalizeSelectedWorryTypeV157(explicit?.[1] || "");
  if (explicitType && explicitType !== "선택" && explicitType !== "기타") return explicitType;

  return inferWorryTypeFromTextV157(question);
}

function isStructuredWorryReadyV149(payload: Record<string, string>) {
  // v154: 유료 풀이가 열리는 기준은 "한 줄 고민"이다.
  // AI 추가 질문 답변은 품질 보강용이지 결제/생성을 막는 필수값이 아니다.
  return cleanWorryStringV149(payload.question).length >= 6;
}


function getWorryTypePromptRuleV150(type: string) {
  if (type === "이사") {
    return `
[이사 상담 전용 규칙]
- 이 상담의 본질은 연애가 아니라 이사다. 질문에 "애인", "헤어짐", "버림"이 있어도 그것은 이사를 고민하게 된 이유일 뿐이다.
- 연애운, 궁합, 속궁합, 결혼, 상대 마음, 붙잡아야 하는지 같은 장면을 쓰지 마라.
- 반드시 지역 판정을 먼저 써라.
- 현재 지역이 있으면 현재 지역을 기준으로 가까운 현실권부터 비교한다.
- 후보가 "없음"이면 후보가 없다고 도망가지 말고, 현재 지역 기준으로 1순위/2순위/3순위/비추천을 제시한다.
- 출력 목차는 아래만 사용한다.
[도훈의 첫 판정]
[1순위 지역]
[2순위 지역]
[3순위 지역]
[비추천 지역]
[왜 이 순서인지]
[돈과 월세로 보면]
[일과 생활 동선으로 보면]
[감정 때문에 떠나는 이사에서 조심할 것]
[도훈의 마지막 판정]`;
  }
  if (type === "조문") {
    return `
[조문/상가집 상담 전용 규칙]
- 이 상담은 친구의 장례식/상가집을 가야 하는지 말아야 하는지에만 답한다.
- 이사, 연애, 궁합, 직업, 돈벌이, 성욕, 건강 일반론으로 새지 마라.
- 첫 문장에서 가라/가지 마라/조건부로 가라 중 하나를 찍어라.
- 단, 실제 예의와 안전을 같이 본다. 조문을 가는 경우와 가지 않는 경우 각각 할 행동을 구체적으로 적어라.
- 사주 근거는 죽음 예언이나 무속 공포로 쓰지 말고, 정리해야 할 인연/마음/예의/후회가 남는지 기준으로만 풀어라.
- 출력 목차는 아래만 사용한다.
[도훈의 첫 판정]
[왜 가야 하는지 또는 멈춰야 하는지]
[가면 지켜야 할 선]
[못 가면 해야 할 예의]
[이 고민에서 남는 후회]
[도훈의 마지막 판정]`;
  }

  if (type === "돈") {
    return `
[돈 상담 전용 규칙]
- 돈을 빌려줄지/말지만 답한다. 이사, 애인, 직업 추천으로 새지 마라.
- 돈을 빌려달라는 대상이 친구인지, 형인지, 가족인지, 거래처인지 반드시 접수지에서 확인해서 그 대상 이름으로 써라.
- 접수지에 형/오빠/누나/동생/부모/가족이 있으면 친구라고 부르지 마라.
- 첫 문장에서 빌려주지 마라/작게만 도와라/조건부로 가능하다 중 하나를 찍어라.
- 출력 목차는 아래만 사용한다.
[도훈의 첫 판정]
[돈을 빌려달라는 사람이 누구인지]
[이 돈을 빌려주면 생기는 일]
[가족 돈거래에서 무너지는 지점]
[돈을 지키는 기준]
[상대에게 할 말]
[도훈의 마지막 판정]`;
  }
  if (type === "연애") {
    return `
[연애 상담 전용 규칙]
- 이 상담은 연애 관계만 답한다. 이사, 직업, 돈 추천으로 새지 마라.
- 상대가 명확하지 않으면 상대를 만들어내지 마라.
- 출력 목차는 아래만 사용한다.
[도훈의 첫 판정]
[이 관계의 핵심]
[상대 행동에서 봐야 할 것]
[붙잡을지 멈출지]
[도훈의 마지막 판정]`;
  }
  if (type === "퇴사·창업" || type === "일·사업") {
    return `
[일·사업/직장/구직 상담 전용 규칙]
- 이 상담은 직장을 구하는 문제, 직업 선택, 이직·취업·구직 방향만 답한다.
- 돈, 가족, 형, 친구 같은 단어가 접수지에 있어도 그것은 배경일 뿐이다. 돈 빌려주는 이야기로 바꾸지 마라.
- 절대 "빌려주지 마라", "돈을 빌려달라는 사람", "친구에게 할 말", "가족 돈거래" 같은 문장을 쓰지 마라.
- 첫 문장에서 지금은 어떤 직장/일자리 방향으로 가야 하는지 바로 찍어라.
- 직장형/사업형/부업형 판정, 맞는 직무군, 피해야 할 일자리, 당장 해야 할 구직 순서를 써라.
- 출력 목차는 아래만 사용한다.
[도훈의 첫 판정]
[지금 직장을 구할 때 먼저 봐야 할 자리]
[맞는 직무군]
[피해야 할 직장]
[구직에서 바로 해야 할 행동]
[돈과 현실 조건]
[도훈의 마지막 판정]`;
  }
  return `
[공통 상담 규칙]
- 접수지의 고민 유형 하나만 답한다.
- 질문에 섞인 다른 주제는 배경으로만 보고 목차를 만들지 마라.
- 접수지 원문을 길게 인용하지 마라.`;
}

function isWorryRefusalTextV161(text: string) {
  const source = cleanGeneratedText(text || "");
  if (!source) return true;
  return /죄송하지만|처리할\s*수\s*없습니다|도와드릴\s*수\s*없습니다|답변할\s*수\s*없습니다|제공할\s*수\s*없습니다|I\s*(am|'m)\s*sorry|I\s*can(?:not|'t)\s*(assist|help)|cannot\s*comply/i.test(source.trim());
}


function buildWorryEvidenceSourceV164(payload: Record<string, string>) {
  return cleanWorryStringV149([
    payload.worryType,
    payload.question,
    payload.situation,
    payload.reason,
    payload.candidateRegions,
    payload.currentWork,
    payload.moneySituation,
    payload.relationshipInfo,
    payload.healthConcern,
    payload.desiredVerdict,
  ].filter(Boolean).join(" "));
}

function hasUnsupportedWorryHallucinationV164(text: string, payload: Record<string, string>) {
  const source = cleanGeneratedText(text || "");
  const evidence = buildWorryEvidenceSourceV164(payload);
  if (!source) return false;

  const absent = (pattern: RegExp) => !pattern.test(evidence);

  // 사용자가 말하지 않은 장례/사망 장면을 지어내면 바로 이탈로 본다.
  if (/(장례식|상가집|빈소|문상|조문|부고|조의금|고인|마지막\s*인사|추모|발인)/.test(source) && absent(/장례식|상가집|빈소|문상|조문|부고|조의금|고인|사망|죽|마지막\s*인사|추모|발인/)) return true;

  // 사용자가 적지 않은 배우자/가족 인물을 만들어내면 바로 이탈로 본다.
  if (/(아내|와이프|부인|남편|배우자)/.test(source) && absent(/아내|와이프|부인|남편|배우자/)) return true;
  if (/(형|오빠|누나|언니|동생|부모|아버지|어머니|엄마|아빠)/.test(source) && absent(/형|오빠|누나|언니|동생|부모|아버지|어머니|엄마|아빠|가족/)) return true;

  // 사용자가 말하지 않은 관계 상태를 단정하면 이탈로 본다.
  if (/(헤어진\s*상태|다른\s*사람과\s*만나는|전혀\s*연락\s*없음|직접\s*만남)/.test(source) && absent(/헤어진|이별|다른\s*사람|전혀\s*연락|직접\s*만남|만났다|재회/)) return true;

  return false;
}

function isOffTopicPremiumWorryTextV160(text: string, payload: Record<string, string>) {
  const source = cleanGeneratedText(text || "");
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);

  // v160: 이 함수는 "폐기" 전용이다. 짧다는 이유만으로 폐기하지 않는다.
  // 짧은 결과는 재작성으로 보정하고, 그래도 짧으면 화면에는 보여준다.
  // 유료 화면을 죽이는 조건은 정말 다른 분야로 튄 경우와 내부 문구 노출뿐이다.
  if (/접수지\s*기준으로\s*다시\s*생성|내부\s*경고문|유료\s*결과에\s*내부|fallback으로\s*가짜/.test(source)) return true;
  if (hasUnsupportedWorryHallucinationV164(source, payload)) return true;

  if (type === "이사" || type === "이사·거주") {
    if (/인연의\s*지속성|속궁합|결혼까지|상대는\s*어떤\s*방식|붙잡되\s*매달리면|두\s*사람은/.test(source)) return true;
  }
  if (type === "돈" || type === "돈·거래") {
    if (/1순위\s*지역|속궁합|결혼까지|상가집|조문/.test(source)) return true;
  }
  if (type === "조문" || type === "경조사·예의") {
    if (/1순위\s*지역|속궁합|결혼까지|성욕|직업을\s*구하는|맞는\s*직무군/.test(source)) return true;
  }
  if (type === "일·사업" || type === "직장" || type === "구직") {
    if (/빌려주지\s*마라|돈을\s*빌려|돈을\s*빌려달라는|친구에게\s*할\s*말|가족\s*돈거래|상가집|조문|속궁합|1순위\s*지역/.test(source)) return true;
  }
  return false;
}

function isWeakPremiumWorryTextV150(text: string, payload: Record<string, string>) {
  const source = cleanGeneratedText(text || "");
  if (isWorryRefusalTextV161(source)) return true;
  if (isOffTopicPremiumWorryTextV160(source, payload)) return true;
  // v160: 재작성 유도 기준. 15,000자를 목표로 하되, 이 기준은 폐기 기준이 아니다.
  // 모델이 한 번에 짧게 내면 repair prompt로 한 번 더 길게 쓰게 한다.
  if (source.length < 7000) return true;
  return false;
}


function getLoanTargetV156(payload: Record<string, string>) {
  const source = cleanWorryStringV149(`${payload.question || ""} ${payload.situation || ""} ${payload.reason || ""} ${payload.relationshipInfo || ""}`);
  if (/친형|형님|\b형\b|오빠/.test(source)) return { label: "형", group: "가족", polite: "형에게" };
  if (/누나|언니/.test(source)) return { label: /언니/.test(source) ? "언니" : "누나", group: "가족", polite: /언니/.test(source) ? "언니에게" : "누나에게" };
  if (/동생|남동생|여동생/.test(source)) return { label: "동생", group: "가족", polite: "동생에게" };
  if (/아버지|아빠|어머니|엄마|부모/.test(source)) return { label: "부모", group: "가족", polite: "부모에게" };
  if (/가족|형제/.test(source)) return { label: "가족", group: "가족", polite: "가족에게" };
  if (/거래처|업체|사장|대표|고객/.test(source)) return { label: "거래처", group: "거래", polite: "거래처에" };
  if (/친구|지인|동료|선배|후배/.test(source)) return { label: /동료/.test(source) ? "동료" : /지인/.test(source) ? "지인" : "친구", group: "관계", polite: /동료/.test(source) ? "동료에게" : /지인/.test(source) ? "지인에게" : "친구에게" };
  return { label: "상대", group: "관계", polite: "상대에게" };
}

function buildDeterministicPremiumWorryReportV150(payload: Record<string, string>, user: any, manse: any) {
  const name = cleanWorryStringV149(user?.name) || "너";
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);
  const currentRegion = cleanWorryStringV149(payload.currentRegion);
  const candidates = cleanWorryStringV149(payload.candidateRegions);
  const work = cleanWorryStringV149(payload.currentWork);
  const money = cleanWorryStringV149(payload.moneySituation);
  const relation = cleanWorryStringV149(payload.relationshipInfo);
  const question = cleanWorryStringV149(payload.question);

  if (type === "이사") {
    const isGumi = /구미/.test(currentRegion + " " + question);
    const primary = isGumi ? "대구권" : "현재 생활권보다 일자리와 거래 흐름이 큰 도시권";
    const second = isGumi ? "구미 안에서 동선이 살아 있는 생활권" : "현재 지역과 완전히 끊기지 않는 근거리 확장권";
    const third = isGumi ? "김천·칠곡·왜관 같은 실속권" : "월세와 출퇴근이 버티는 실속권";
    const avoid = isGumi ? "감정 때문에 멀리 도망가는 부산·서울 단독 이동" : "감정 때문에 확 멀어지는 낯선 도시";
    return cleanGeneratedText(`[도훈의 첫 판정]
${name}, 답부터 말한다. 지금 이사는 연애 상담이 아니다. 애인에게 버림받아서 마음이 아픈 건 이사를 생각하게 만든 이유일 뿐이고, 판정의 중심은 어디로 움직이면 돈·일·몸이 덜 무너지는가다.

1순위는 ${primary}이다. 2순위는 ${second}이다. 3순위는 ${third}이다. 비추천은 ${avoid}이다.

[1순위 지역]
${primary}을 먼저 봐라. ${currentRegion ? `현재 기준점이 ${currentRegion}이기 때문에` : "현재 기준점이 불분명해도"} 완전히 판을 끊는 이사보다 일과 생활 리듬이 이어지는 쪽이 먼저다. 지금은 마음이 아파서 떠나고 싶은 시기라, 멀리 가면 시원할 것 같지만 돈과 몸이 먼저 흔들린다.

[2순위 지역]
${second}은 도망이 아니라 재정비다. ${work ? `현재 일이 ${work}이면` : "현재 일이 있다면"} 이사를 해도 출근, 수입, 생활비 계산이 끊기면 안 된다. 네 사주는 감정이 흔들릴 때 큰 결정을 한 번에 밀면 뒤가 무거워진다.

[3순위 지역]
${third}은 월세 부담을 줄이고 몸을 세우는 자리다. ${money ? `지금 돈 조건이 ${money}로 잡혀 있으니` : "돈 조건이 빠듯하면"} 집값보다 고정비, 출퇴근, 수면, 병원, 주차, 장보기 동선을 먼저 봐야 한다.

[비추천 지역]
${avoid}은 지금 잡으면 안 된다. 이유는 간단하다. 그 이사는 새 출발이 아니라 상처에서 도망치는 이사가 되기 쉽다. 애인 문제를 잊으려고 지역을 바꾸면, 처음 한 달은 버티지만 월세와 외로움이 같이 올라온다.

[왜 이 순서인지]
이 사주는 감정이 무너질 때 생활 기반까지 같이 흔들면 회복이 늦다. 그래서 이사는 멀리 가는 게 답이 아니라, 돈이 덜 새고 일이 이어지고 몸이 쉬는 순서로 잡아야 한다. ${relation ? `혼자 이동이라면 더더욱 사람보다 생활 동선을 먼저 잡아야 한다.` : ""}

[돈과 월세로 보면]
월세 부담이 이미 걸려 있으면 넓고 좋은 집보다 덜 새는 집이 먼저다. 보증금, 월세, 관리비, 출퇴근비, 식비까지 더해서 지금보다 매달 빠지는 돈이 늘면 그 이사는 틀린 자리다.

[일과 생활 동선으로 보면]
일이 끊기지 않는 곳이 맞다. 사무직이라면 이동 후 바로 수입이 이어져야 한다. 이직을 같이 걸지 마라. 이사와 이직을 동시에 걸면 마음은 시원해도 현실은 더 피곤해진다.

[감정 때문에 떠나는 이사에서 조심할 것]
지금 제일 조심할 건 애인에게 버림받은 마음으로 인생판 전체를 뒤엎는 것이다. 이별은 이사의 이유가 될 수 있지만, 이사의 기준이 되면 안 된다. 기준은 돈, 일, 몸, 동선이다.

[도훈의 마지막 판정]
${name}, 움직여도 된다. 단, 멀리 도망가듯 움직이지 마라. 1순위 ${primary}, 2순위 ${second}, 3순위 ${third} 순서로 봐라. ${avoid}은 지금 잡지 마라. 이번 이사는 상처를 잊는 이사가 아니라 생활을 다시 세우는 이사여야 산다.`);
  }

  if (type === "일·사업") {
    const career = getCareerArchetype(manse);
    const careerProfile = getCareerProfile(manse);
    const workText = work || "현재 직장/경력 정보가 짧게 들어왔다";
    const moneyText = money || "수입 조건은 아직 자세히 적히지 않았다";
    return cleanGeneratedText(`[도훈의 첫 판정]
${name}, 답부터 말한다. 이 상담은 돈 빌려주는 문제가 아니라 직장을 구하는 문제다. 지금은 아무 직장이나 잡으면 안 된다. ${name}에게 맞는 방향은 오래 버티는 자리보다, 네가 한 만큼 결과가 남고 다음 기회로 이어지는 자리다. 사주상 큰 판정은 '${career.combined}' 쪽으로 본다. 그래서 지금 구직은 안정만 보고 들어가면 답답해지고, 역할·단가·성과·배울 기술이 보이는 자리로 가야 산다.

[지금 직장을 구할 때 먼저 봐야 할 자리]
지금 제일 먼저 볼 건 회사 이름이 아니다. 월급이 조금 높아 보여도 하는 일이 흐리고, 내 역할이 남지 않고, 책임만 늘어나는 직장은 오래 못 간다. ${workText}라는 조건이 있다면 더더욱 지금은 '내가 무엇을 맡고 무엇을 배워서 다음 돈길로 바꿀 수 있는가'를 봐야 한다. 네 사주는 시키는 일만 오래 처리하는 자리보다, 기준을 보고 판단하고 결과를 남기는 자리에서 일이 살아난다. 구직할 때 공고를 볼 때도 복지 문구보다 직무 설명을 먼저 봐라. 담당 업무가 구체적인지, 성과 기준이 있는지, 거래처·자료·관리·기술·정산처럼 네 손에 남는 일이 있는지 확인해야 한다.

[맞는 직무군]
맞는 쪽은 ${careerProfile.action.slice(0, 4).join(" · ")} 흐름이다. 쉽게 말하면 아무나 대신할 수 있는 단순 반복보다, 네가 맡은 기준이 생기고 자료나 결과가 쌓이는 일이 맞다. 사무직이라도 단순 입력만 하는 사무직은 약하고, 발주, 견적, 정산, 구매관리, 거래처관리, 일정관리, 재고관리, 품질자료, 고객응대처럼 숫자와 흐름을 같이 보는 사무직이 낫다. 기술직으로 가도 손기술 하나만 보는 게 아니라, 현장과 사무 사이를 이어주는 기술지원, 자재관리, 납기관리, 문서관리, CS, 영업지원 쪽이 더 살아난다. 네가 들어가서 '내가 이 회사에서 무엇을 책임지는지'가 보이면 잡아도 된다.

[피해야 할 직장]
피해야 할 쪽은 ${careerProfile.avoid.slice(0, 4).join(" · ")} 흐름이다. 말은 가족 같은 회사라고 하는데 업무 범위가 없고, 입사하면 이것도 하고 저것도 하라는 곳은 피해야 한다. 면접 때 월급만 말하고 실제 하는 일을 흐리게 넘기는 곳도 피해야 한다. 사람 좋다는 말만 앞세우고 인수인계가 없는 곳, 퇴근 시간이 흐린 곳, 사장이 감정으로 지시하는 곳, 작은 회사인데 회계·영업·배송·고객응대까지 다 떠안기는 곳은 네 기운을 갉아먹는다. 그런 자리는 처음엔 취업됐다는 안도감이 있지만, 몇 달 지나면 내 경력도 돈도 남지 않고 피로만 남는다.

[구직에서 바로 해야 할 행동]
오늘 바로 할 일은 직장 이름을 찾는 게 아니라 직무군을 3개로 좁히는 것이다. 첫째, 사무·관리 쪽이면 구매관리, 발주관리, 정산, 거래처관리, 영업지원 같은 식으로 좁혀라. 둘째, 기술 쪽이면 장비, 부품, 품질, 설치, 유지보수, 기술지원처럼 네가 배워서 단가를 올릴 수 있는 쪽을 봐라. 셋째, 사람 상대가 필요하다면 그냥 서비스직이 아니라 상담, CS, 영업지원, 거래처 응대처럼 기록과 결과가 남는 자리를 봐라. 이력서도 '열심히 하겠습니다'가 아니라 내가 처리한 업무, 다룬 프로그램, 맡은 거래처, 관리한 숫자, 줄인 비용, 맞춘 납기를 써야 한다.

[돈과 현실 조건]
${moneyText}라는 조건이 걸려 있다면 월급만 보고 결정하지 마라. 출퇴근 시간, 식비, 교통비, 야근 빈도, 수습기간, 상여 구조, 4대보험, 퇴직금, 실제 세후 금액까지 봐야 한다. 월급이 조금 높아도 출퇴근과 식비가 많이 들면 남는 돈은 약하다. 반대로 월급이 처음엔 조금 낮아도 배우는 기술과 거래 흐름이 남으면 다음 직장이나 부업으로 이어질 수 있다. 지금 구직은 당장 숨통을 트는 선택이면서 동시에 다음 돈길을 만드는 선택이어야 한다. 그냥 급해서 들어가는 직장은 다시 같은 고민으로 돌아온다.

[도훈의 마지막 판정]
${name}, 마지막 판정은 이거다. 아무 직장이나 들어가지 마라. 지금은 직장 구하는 문제를 돈 빌려주는 문제나 사람 눈치 문제로 풀 때가 아니다. 네가 잡아야 할 자리는 사무·관리·거래·정산·기술지원처럼 결과와 기록이 남는 자리다. 피해야 할 자리는 업무 범위가 흐리고, 책임만 크고, 돈과 경력이 남지 않는 자리다. 이번 구직은 오래 버틸 곳을 찾는 게 아니라 다음 기회로 이어질 일을 잡는 싸움이다. 직무군 3개로 좁히고, 면접에서는 월급보다 역할·업무범위·퇴근시간·세후금액·배울 기술을 먼저 물어라. 그 기준을 통과하면 들어가고, 흐리면 멈춰라.`);
  }

  if (type === "돈") {
    const target = getLoanTargetV156(payload);
    const isFamily = target.group === "가족";
    const amountText = money || "금액이 정확히 적히지 않았다";
    return cleanGeneratedText(`[도훈의 첫 판정]
${name}, 답부터 말한다. 지금 이 돈은 빌려주지 마라. 특히 대상이 ${target.label}이면 더 세게 잘라야 한다. 친구 돈거래보다 가족 돈거래가 더 위험한 이유는 돈만 잃고 끝나는 게 아니라, 거절하지 못한 죄책감과 집안 감정까지 같이 물고 들어오기 때문이다. 도와주고 싶으면 빌려주는 돈으로 잡지 말고, 돌려받지 않아도 되는 작은 금액을 한 번만 주는 방식으로 끝내라. 네 생활비를 건드리는 순간 이 돈은 복이 아니라 악운으로 바뀐다.

[돈을 빌려달라는 사람이 누구인지]
이번 질문의 대상은 친구가 아니라 ${target.label}이다. 그래서 이 상담은 의리 문제가 아니라 가족 경계 문제로 봐야 한다. ${isFamily ? "가족이 돈을 부탁하면 거절하는 순간 나쁜 사람이 된 것 같고, 들어주면 내 생활이 흔들리는 구조가 된다." : "가까운 관계의 돈 부탁은 거절이 어렵지만, 가까움이 회수 가능성을 보장하지는 않는다."} 사주에서 돈을 볼 때 가장 먼저 갈라야 하는 건 ‘내 돈’과 ‘남의 급한 불’이다. ${target.label}의 사정이 급하다고 해서 네 생활비, 월세, 고정비까지 같이 흔들리면 순서가 틀린다. 지금 이 돈은 정으로 판단하면 안 되고, 회수 가능성과 네가 잃어도 버틸 수 있는지로 판단해야 한다.

[이 돈을 빌려주면 생기는 일]
이 돈을 빌려주면 처음에는 마음이 편해진다. ${target.label}의 부탁을 외면하지 않았다는 안도감이 생기고, 네가 할 도리를 했다는 생각도 든다. 그런데 문제는 그 다음부터다. 돈이 제때 돌아오지 않으면 네 마음속에서 계산이 시작된다. 연락을 해야 하나, 기다려야 하나, 재촉하면 관계가 틀어지나, 그냥 넘어가면 내가 손해 보는 건가 하는 생각이 붙는다. 가족 돈거래는 이 지점에서 더 피곤하다. 친구라면 거리를 두면 끝날 수 있지만, ${target.label}이면 명절, 부모, 가족 연락, 주변 말까지 같이 엮인다. 결국 돈을 빌려준 사람이 더 눈치를 보게 된다. 이게 제일 나쁜 흐름이다. 네가 도와줬는데 네가 불편해지는 돈은 사주상 좋은 돈이 아니다.

[가족 돈거래에서 무너지는 지점]
가족 사이의 돈은 차용증보다 감정이 먼저 들어온다. 그래서 처음부터 기준이 없으면 갚는 날짜가 흐려지고, 금액이 흐려지고, 말이 흐려진다. ${target.label}이 정말 갚을 생각이 있어도 상황이 안 되면 밀릴 수 있다. 그때부터 너는 돈을 빌려준 사람이 아니라 기다리는 사람이 된다. 기다리는 사람은 약해진다. 네 사주에서는 돈을 크게 불리는 것보다 새는 돈을 막는 쪽이 먼저 살아야 한다. 특히 정 때문에 빠지는 돈, 가족 부탁으로 들어가는 돈, 기록 없이 나가는 돈은 제일 조심해야 한다. 이 돈이 한 번 새면 다음에도 비슷한 부탁을 거절하기 어려워진다. 그래서 이번 한 번을 어떻게 자르느냐가 중요하다.

[돈을 지키는 기준]
기준은 분명하다. 첫째, 네 생활비와 월세에 손대야 하는 돈이면 빌려주지 마라. 둘째, 갚는 날짜와 방법을 말하지 못하면 빌려주지 마라. 셋째, 말로만 미안하다 하고 구체적인 상환 계획이 없으면 빌려주지 마라. 넷째, 네가 속으로 ‘못 받아도 어쩔 수 없다’고 생각할 수 없는 금액이면 빌려주지 마라. 다섯째, 가족이라서 차용증을 못 쓰겠다는 분위기라면 더더욱 빌려주지 마라. 차용증을 쓰자는 말에 상대가 기분 나빠하면 그 돈은 이미 위험한 돈이다. 돈을 빌리는 사람은 미안해야 하고, 빌려주는 사람이 눈치를 보면 안 된다.

[상대에게 할 말]
${target.polite} 이렇게 말해라. "나도 지금 월세랑 생활비 때문에 여유가 없다. 그래서 빌려주는 방식은 어렵다. 대신 내가 감당 가능한 선에서 한 번 도와줄 수 있는 금액만 말하겠다. 이건 빌려주는 돈이 아니라 내가 줄 수 있는 선이다." 이 문장이 핵심이다. 빌려준다고 말하지 말고, 줄 수 있는 금액과 줄 수 없는 금액을 갈라라. 만약 정말 빌려줘야 하는 상황이면 반드시 날짜와 방법을 문자로 남겨라. 말로 하지 마라. 가족일수록 말로 하면 나중에 서로 기억이 달라진다. 그리고 금액은 네 생활이 흔들리지 않는 선에서 끝내라. 네 통장 잔고를 긁어 도와주는 건 도움도 아니고 희생도 아니다. 그건 나중에 원망으로 돌아온다.

[도훈의 마지막 판정]
${name}, 마지막 판정은 이거다. ${target.label}에게 돈을 빌려주지 마라. 단, 마음이 너무 걸리면 받을 생각 없는 작은 금액만 한 번 줘라. 이 돈을 빌려주는 순간 너는 돈을 빌려준 사람이 아니라 관계를 담보 잡힌 사람이 된다. 가족이라서 더 조심해야 한다. 가족 돈거래는 돈보다 감정이 오래 간다. 지금 네가 잡아야 할 건 착한 사람 노릇이 아니라 네 생활을 지키는 기준이다. 월세, 생활비, 고정비를 건드리는 돈은 절대 내보내지 마라. 도와주려면 작게 주고 끝내라. 빌려주는 돈으로 잡지 마라. 그게 네 사주에서 돈 새는 길을 막는 답이다.`);
  }

  const combined = `${type} ${question} ${cleanWorryStringV149(payload.situation)} ${cleanWorryStringV149(payload.reason)} ${candidates} ${currentRegion}`;
  if ((type === "선택" || type === "기타") && /직장|구직|취업|일자리|이직|퇴사|직업|회사|면접|커리어/.test(combined)) {
    const patchedPayload = { ...payload, worryType: "일·사업" };
    return buildDeterministicPremiumWorryReportV150(patchedPayload, user, manse);
  }
  if ((type === "선택" || type === "기타") && /이사|지역|어디로|집|거주|동네|생활권|월세|구미|대구|부산|서울/.test(combined)) {
    const patchedPayload = { ...payload, worryType: "이사" };
    return buildDeterministicPremiumWorryReportV150(patchedPayload, user, manse);
  }
  if ((type === "선택" || type === "기타") && /돈|빌려|빌려달라|생활비|금액|대출|투자/.test(combined)) {
    const patchedPayload = { ...payload, worryType: "돈" };
    return buildDeterministicPremiumWorryReportV150(patchedPayload, user, manse);
  }

  return cleanGeneratedText(`[도훈의 첫 판정]
${name}, 답부터 말한다. 이 상담은 아직 유형이 흐리다. 하지만 유료 결과에 내부 경고문을 띄우면 안 된다. 지금 질문에 가장 직접 걸린 선택 하나만 다시 잡아야 한다.

[지금 바로 잡을 기준]
질문을 한 문장으로 줄이면 답이 선명해진다. 돈이면 빌려줄지 말지, 이사면 어디로 움직일지, 연애면 붙잡을지 멈출지, 일이면 버틸지 나갈지를 하나만 잡아라.

[도훈의 마지막 판정]
이번 상담은 다시 접수해야 한다. 단, 결제 결과처럼 내부 문구를 보여주지 말고, 고민 유형 하나를 선택해서 다시 생성해라.`);
}


function getWorryWritingStructureV163(type: string, name: string) {
  const t = normalizePremiumWorryTypeV154(type, "");
  if (t === "연애") {
    return `[작성 구조 - 연애/재회 전용]
[도훈의 첫 판정]
첫 문장에서 ${name}에게 재회는 밀어라/멈춰라/기다려라/조건부 중 하나로 바로 판정한다. "가능성이 있다"로 흐리지 마라.

[재회 가능성부터 자르면]
재회 가능성을 높게 보는지 낮게 보는지 먼저 잘라라. 가능성이 낮으면 왜 낮은지, 조건부면 무엇이 충족되어야 하는지 현실 말로 설명한다.

[상대 행동에서 이미 나온 답]
상대의 최근 행동, 다른 사람을 만나는 듯한 정황, 연락의 끊김, 약속을 지키는지 여부를 기준으로 본다. 상대 마음을 예언하지 말고 보이는 행동으로 판단한다.

[연락이 없는 상태의 의미]
전혀 연락이 없는 상태가 단순 자존심인지, 정리 신호인지, 새 관계로 넘어간 신호인지 구분한다. 사용자가 적은 답변을 반드시 반영한다.

[다른 사람이 있는 것 같을 때]
다른 사람을 만나는 것 같다는 조건이 있으면 재회 전략을 세게 제한한다. 질투로 밀어붙이면 어떤 식으로 더 밀려나는지 쓴다.

[이미 직접 만난 뒤의 흐름]
재회를 위해 이미 직접 만났다면 그 만남 이후 연락·태도·반응이 왜 중요한지 설명한다. 한 번 만난 사실만으로 희망을 부풀리지 마라.

[지금 밀면 깨지는 지점]
지금 바로 붙잡거나 장문 연락하거나 감정적으로 확인하려 들면 무엇이 망가지는지 쓴다.

[기다린다면 어디까지 기다릴지]
막연히 기다리라고 하지 마라. 며칠 또는 몇 주 단위의 확인 기준, 그 기간 안에 봐야 할 행동 신호를 정한다. 날짜를 지어내지 말고 기준으로 말한다.

[다시 연락한다면 이렇게 해라]
연락 문구, 연락 횟수, 답이 없을 때 멈출 기준을 구체적으로 쓴다. 자존심 싸움 말투와 매달리는 말투를 구분한다.

[완전히 끊어질까 두려운 마음]
사용자가 가장 피하고 싶은 결말이 완전히 끊어짐이라면 그 두려움 때문에 하면 안 되는 행동을 자른다.

[도훈의 마지막 판정]
마지막에 다시 한 번 재회 시도 여부, 기다릴 기간, 먼저 연락할지 말지, 끊어야 할 행동을 단정한다.`;
  }
  if (t === "일·사업" || t === "퇴사·창업") {
    return `[작성 구조 - 직장/구직 전용]
[도훈의 첫 판정]
첫 문장에서 지금 구직은 어떤 방향으로 가야 하는지 바로 찍어라.

[지금 직장을 구할 때 먼저 봐야 할 자리]
안정, 급여, 직무, 사람, 성장 중 무엇을 먼저 봐야 하는지 정한다.

[맞는 직무군]
사용자의 사주 흐름과 접수 답변을 기준으로 맞는 직무군을 3개로 좁힌다.

[피해야 할 직장]
사람 갈아 넣는 곳, 월급만 보고 들어가는 곳, 역할이 흐린 곳 등 피해야 할 회사를 구체적으로 쓴다.

[면접에서 확인할 질문]
면접에서 반드시 물어볼 질문을 실제 문장으로 준다.

[수입과 현실 조건]
생활비, 출퇴근, 수습기간, 급여일, 고정비 기준으로 판단한다.

[이번 주 구직 행동]
이력서, 지원 분야, 연락, 면접 준비 순서로 바로 할 행동을 정한다.

[도훈의 마지막 판정]
어떤 회사는 잡고 어떤 회사는 버릴지 다시 판정한다.`;
  }
  if (t === "돈") {
    return `[작성 구조 - 돈/거래 전용]
[도훈의 첫 판정]
첫 문장에서 빌려줘라/빌려주지 마라/작게만 도와라/조건부 중 하나를 찍어라.

[돈을 요구한 사람이 누구인지]
상대가 형, 가족, 친구, 지인, 거래처 중 누구인지 접수 정보 그대로 반영한다.

[빌려주면 생기는 일]
돈 회수, 관계 부담, 생활비 흔들림을 설명한다.

[거절하거나 작게 도울 기준]
금액, 상환일, 내 생활비, 받을 생각 없는 돈의 기준을 정한다.

[상대에게 할 말]
실제로 보낼 수 있는 문장으로 준다.

[도훈의 마지막 판정]
최종 금액 기준과 금지선을 자른다.`;
  }
  if (t === "조문") {
    return `[작성 구조 - 조문/경조사 전용]
[도훈의 첫 판정]
첫 문장에서 가라/가지 마라/조건부로 가라 중 하나를 찍어라.

[관계로 보면]
고인과의 관계, 최근 연락, 마음의 후회를 기준으로 본다.

[현실적으로 갈 수 있는지]
거리, 일정, 몸과 마음 상태를 기준으로 본다.

[가면 지켜야 할 선]
머무는 시간, 말, 술자리, 유족에게 할 행동을 쓴다.

[못 가면 해야 할 예의]
조의금, 문자, 전화, 장례 후 연락을 구체적으로 쓴다.

[도훈의 마지막 판정]
후회가 덜 남는 선택을 다시 판정한다.`;
  }
  if (t === "이사") {
    return `[작성 구조 - 이사/거주 전용]
[도훈의 첫 판정]
첫 문장에서 이사는 가라/가지 마라/조건부로 가라와 1순위 방향을 찍어라.

[1순위 생활권]
현재 기준점과 후보를 보고 가장 현실적인 생활권을 말한다.

[2순위 생활권]
차선책을 말한다.

[비추천 생활권]
감정 때문에 잡으면 안 되는 지역을 말한다.

[돈과 월세]
보증금, 월세, 관리비, 출퇴근비를 기준으로 말한다.

[일과 생활 동선]
출퇴근, 장보기, 병원, 사람 동선을 본다.

[도훈의 마지막 판정]
어디를 먼저 보고 어디를 버릴지 자른다.`;
  }
  return `[작성 구조 - 공통 선택 상담]
[도훈의 첫 판정]
[이 고민의 중심]
[상황에서 먼저 봐야 할 기준]
[첫 번째 선택을 잡으면 생기는 일]
[두 번째 선택을 잡으면 생기는 일]
[피해야 할 선택]
[잡아야 할 선택]
[오늘 바로 할 행동]
[도훈의 마지막 판정]`;
}

function buildSafeWorryBriefV163(payload: Record<string, string>) {
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);
  const entries: string[] = [];
  const add = (label: string, value: any) => {
    const v = cleanWorryStringV149(value);
    if (v) entries.push(`- ${label}: ${v}`);
  };
  add("고민 유형", type);
  add("핵심 질문", payload.question);
  add("현재 상황", payload.situation);
  add("고민 이유", payload.reason);
  add("선택지/후보", payload.candidateRegions);
  add("일/직장 조건", payload.currentWork);
  add("돈/현실 조건", payload.moneySituation);
  add("관계 정보", payload.relationshipInfo);
  add("몸/마음 상태", payload.healthConcern);
  add("원하는 판정", payload.desiredVerdict);
  return entries.join("\n");
}

function buildWorryFullPromptV149(params: {
  user: any;
  categoryId: CategoryId;
  categoryTitle: string;
  manseText: string;
  fixedConclusionText: string;
  profileText: string;
  payload: Record<string, string>;
}) {
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const type = normalizePremiumWorryTypeV154(params.payload.worryType, params.payload.question);
  const structured = buildSafeWorryBriefV163({ ...params.payload, worryType: type });
  const typeRule = getWorryTypePromptRuleV150(type);
  const writingStructure = getWorryWritingStructureV163(type, name);

  return `너는 소름사주 앱의 도훈이다.
이번 요청은 내 고민 상담 유료 본문이다.

[절대 원칙]
- 한 상담에는 한 고민만 다룬다.
- 이번 상담의 고민 유형은 "${type}"이다.
- 질문 안에 다른 주제 단어가 섞여 있어도, 아래 [이번 상담 접수지]에 없는 내용은 절대 끌어오지 마라.
- 이번 상담의 고민 유형 "${type}"만 답한다. 다른 분야의 예시 문장, 이전 상담 문장, fallback 문장을 끌어오지 마라.
- 사용자가 선택한 고민 유형이 최상위 기준이다. 질문 안의 배경 단어가 다른 분야처럼 보여도 유형을 바꾸지 마라.
- 이번 유형과 맞지 않는 목차나 판정을 만들지 마라.
- 사용자가 적지 않은 지역명, 사람, 사건을 만들어내지 마라.
- 사용자가 장례식/상가집/조문/부고/고인/마지막 인사를 적지 않았다면 그런 장면을 절대 쓰지 마라.
- 사용자가 아내/남편/배우자/형/친구 같은 대상을 적지 않았다면 그 인물을 새로 만들지 마라.
- 사용자가 말한 사실만 근거로 삼고, 빈칸은 추론하지 말고 "정보가 짧다"고 보고 현실 기준으로만 답해라.
- [이번 상담 접수지] 전체를 따옴표로 길게 복붙하지 마라. 질문은 자연스럽게 한 문장으로만 받는다.
- 본문에 "접수된 핵심은", "고민 유형:", "질문:", "현재 상황:", "원하는 판정:" 같은 접수지 라벨을 그대로 쓰지 마라. 라벨은 내부 참고용이다.
- 사용자가 고른 추가 질문 답변은 해석해서 녹여라. 원문 목록을 복사하지 마라.
- 이전 질문, 예시 질문, 다른 사용자의 고민을 학습한 것처럼 섞지 마라.
- 마지막 판정만 짧게 쓰고 끝내지 말고, 전체 본문을 먼저 충분히 쓴 뒤 마지막에 판정한다.
- "자연스러운 부분", "건강하게 다뤄라", "만족스러운 삶", "찾아봐", "고민해봐", "중요해" 같은 상담센터식 말투 금지.
- 단정해라. 첫 문장에서 이번 고민 유형에 맞는 결론을 바로 찍어라.
- 거절문으로 끝내지 마라. 민감한 주제는 안전한 현실 선택 상담으로 바꿔서 답한다.

[이번 상담 접수지]
${structured}

${typeRule}

[사주 근거]
${params.manseText}

[고정 기준]
${params.fixedConclusionText}

[분량 규칙]
- 유료 내 고민 상담은 짧은 무료 판정이 아니다. 반드시 15,000자 안팎으로 써라. 최소 12,000자 이상을 목표로 길게 쓴다.
- 각 장면은 5~8문장 이상 써라. 한 문단으로 요약하지 마라.
- 같은 말을 반복해서 분량을 채우지 마라. 각 장면마다 새 정보, 새 기준, 새 현실 예시를 넣어라.
- 마지막 판정만 길게 쓰는 방식 금지. 중간 본문이 충분히 길어야 한다.
- 유료 결제자가 읽는 완성 리포트다. “새로운 인연이 기다린다”, “찾아봐”, “고민해봐” 같은 마무리 금지.

${writingStructure}

반드시 한국어로만 써라. 15,000자 안팎의 완성 리포트로 써라. 최소 12,000자 이하로 짧게 끝내지 마라.`;
}

function buildWorryRepairPromptV152(params: {
  originalPrompt: string;
  badText: string;
  payload: Record<string, string>;
  user: any;
}) {
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const type = normalizePremiumWorryTypeV154(params.payload.worryType, params.payload.question);
  return `${params.originalPrompt}

[재작성 지시]
아래 초안은 실패했다. 초안을 요약하거나 이어 쓰지 말고 처음부터 다시 써라.
실패 초안:
${cleanGeneratedText(params.badText).slice(0, 1600)}

반드시 이번 고민 유형 "${type}" 하나만 답해라.
첫 문장은 "${name}, 답부터 말한다."로 시작해라.
내부 안내문, 접수지 기준으로 다시 생성, 기타 고민으로 접수 같은 문구 금지.
결과는 사용자가 결제 후 바로 읽는 완성 리포트여야 한다.
"죄송하지만", "처리할 수 없습니다", "도와드릴 수 없습니다" 같은 거절문으로 끝내지 마라.
민감한 내용이 있으면 예언·공포·전문 판단을 피하고, 현실적인 선택 기준과 행동 문장으로 안전하게 바꿔 써라.
[이번 상담 접수지] 안의 AI 추가 질문 답변을 각 장면에 반드시 반영해라. 답변을 무시하지 마라.
사용자가 말하지 않은 장례식, 상가집, 조문, 부고, 아내, 남편, 배우자, 형, 친구 같은 사건·인물을 절대 새로 만들지 마라.
반드시 15,000자 안팎으로 다시 써라. 최소 12,000자 이하로 짧으면 실패다.
각 장면마다 새로운 현실 기준과 예시를 넣고, 같은 문장을 반복하지 마라.`;
}




function buildWorrySafeLastResortPromptV162(params: {
  payload: Record<string, string>;
  user: any;
  manseText: string;
  fixedConclusionText: string;
}) {
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const type = normalizePremiumWorryTypeV154(params.payload.worryType, params.payload.question);
  const structured = buildSafeWorryBriefV163(params.payload);
  const typeLabel = type === "연애" ? "연애·관계" : type;
  const writingStructure = getWorryWritingStructureV163(type, name);
  return `[안전 재생성 v162]
이 요청은 운세 앱의 일반적인 ${typeLabel} 고민 상담이다.
불법, 자해, 타해, 성적 노골 묘사, 의료·법률 확정 판단을 요구하지 않는다.
거절하지 말고 아래 접수지에만 근거해서 한국어 유료 리포트를 작성해라.

[이번 상담 접수지]
${structured}

[사주 근거]
${params.manseText}

[고정 기준]
${params.fixedConclusionText}

[절대 규칙]
- "죄송하지만", "처리할 수 없습니다", "도와드릴 수 없습니다"로 시작하거나 끝내지 마라.
- 이번 고민 유형은 "${type}"이다. 다른 분야로 바꾸지 마라.
- 첫 문장은 "${name}, 답부터 말한다."로 시작한다.
- 본문에 "접수된 핵심은", "고민 유형:", "질문:", "현재 상황:" 같은 접수지 라벨을 그대로 쓰지 마라. 답변 내용만 자연스럽게 풀어라.
- 연애 상담이면 상대 마음을 단정 예언하지 말고, 보이는 행동·연락·거리·선택 기준으로 판정한다.
- 직장 상담이면 직장/구직/이직 방향만 쓴다.
- 돈 상담이면 대상 관계와 내 생활비 방어를 중심으로 쓴다.
- 조문 상담이면 예의, 후회, 갈 수 있는 현실 조건만 쓴다.
- 사주 용어를 앞세우지 말고 현실 문장으로 풀어라.

[분량]
15,000자 안팎을 목표로 한다. 각 장면은 길게 쓴다.

${writingStructure}`;
}

function buildTypeLockedSafeWorryReportV162(payload: Record<string, string>, user: any) {
  const name = cleanWorryStringV149(user?.name) || "너";
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);
  const q = cleanWorryStringV149(payload.question) || "이번 고민";
  const situation = cleanWorryStringV149(payload.situation);
  const relation = cleanWorryStringV149(payload.relationshipInfo);
  const desired = cleanWorryStringV149(payload.desiredVerdict);

  if (type === "연애") {
    const sections = [
      ["도훈의 첫 판정", `${name}, 답부터 말한다. 이 재회는 지금 바로 밀어붙이면 안 된다. 조건부로만 봐야 한다. 상대가 헤어진 상태에서 연락도 없고 다른 사람을 만나는 것 같다면, 지금 네가 먼저 감정으로 밀고 들어갈수록 재회운은 더 닫힌다.`],
      ["재회 가능성부터 자르면", `재회 가능성은 없다고 끊을 정도는 아니지만, 지금 당장 높게 보기도 어렵다. 핵심은 상대가 먼저 흔들리는지, 연락의 문이 다시 열리는지, 직접 만난 뒤에도 태도가 이어지는지다. 지금처럼 전혀 연락이 없고 다른 사람이 보이는 흐름이면, 네가 한 번 더 매달리는 순간 관계의 균형은 무너진다.`],
      ["상대 행동에서 이미 나온 답", `상대의 말보다 행동을 봐야 한다. 헤어진 뒤 연락이 끊겼고, 다른 사람을 만나는 것 같고, 네가 이미 직접 만났는데도 흐름이 이어지지 않았다면 지금 상대는 관계를 다시 열 준비가 약하다. 이걸 애정이 남았는지 아닌지로만 보면 판단이 흐려진다.`],
      ["연락이 없는 상태의 의미", `전혀 연락이 없다는 건 지금 네가 계속 밀어도 바로 받아줄 흐름이 아니라는 뜻이다. 자존심 싸움일 수도 있지만, 다른 사람의 그림자가 있다면 정리 신호에 더 가깝다. 그래서 지금은 장문 연락, 술김 연락, 확인성 연락을 전부 막아야 한다.`],
      ["다른 사람이 있는 것 같을 때", `상대 곁에 다른 사람이 있는 것 같다면 재회 전략은 더 짧고 차갑게 가야 한다. 질투를 드러내거나 따지면 너만 불리해진다. 묻고 추궁하는 순간 상대는 네 마음을 부담으로 처리한다.`],
      ["다시 연락한다면 이렇게 해라", `연락은 한 번만 가능하다. 문장은 짧아야 한다. “잘 지내는지 궁금했다. 부담 주려는 건 아니고, 한 번 차분히 이야기할 수 있으면 좋겠다.” 이 정도에서 멈춰라. 답이 없으면 다시 보내지 마라.`],
      ["완전히 끊어질까 두려운 마음", `네가 제일 두려워하는 건 완전히 끊어지는 것이다. 그런데 그 두려움 때문에 밀면 오히려 완전히 끊어진다. 끊어짐을 막으려면 지금은 감정 표현보다 거리 조절이 먼저다.`],
      ["도훈의 마지막 판정", `${name}, 마지막 판정은 조건부 기다림이다. 지금은 밀지 마라. 한 번만 짧게 연락하고, 답이 없으면 멈춰라. 상대가 다시 연락의 문을 열지 않으면 재회는 네가 끌고 갈 관계가 아니다.`],
    ];
    return cleanGeneratedText(sections.map(([title, body]) => `[${title}]\n${body}`).join("\n\n"));
  }

  if (type === "일·사업") {
    const sections = [
      ["도훈의 첫 판정", `${name}, 답부터 말한다. 지금 직장은 아무 데나 들어가면 안 된다. 급하다고 들어가는 자리보다, 네가 맡을 역할과 돈 흐름이 분명한 자리부터 잡아야 한다.`],
      ["지금 직장을 구할 때 먼저 봐야 할 자리", `지금은 이름 좋은 회사보다 실제로 버틸 수 있는 업무 구조가 먼저다. 역할이 흐리고 잡무만 많은 곳, 사람 말로만 움직이는 곳, 급여일과 업무 범위가 불분명한 곳은 피해야 한다.`],
      ["맞는 직무군", `맞는 쪽은 거래처, 견적, 일정, 납기, 관리, 조율처럼 결과가 숫자와 일정으로 남는 일이다. 단순 반복보다 네 판단이 들어가는 자리가 낫다.`],
      ["피해야 할 직장", `피해야 할 곳은 사람만 믿고 들어가는 회사다. 면접 때 말은 좋은데 실제 업무표, 급여 조건, 수습기간, 야근 기준이 흐리면 들어가지 마라.`],
      ["도훈의 마지막 판정", `${name}, 구직은 하되 기준 없이 움직이지 마라. 역할이 분명하고 돈과 시간이 약속되는 자리만 잡아라.`],
    ];
    return cleanGeneratedText(sections.map(([title, body]) => `[${title}]\n${body}`).join("\n\n"));
  }

  const sections = [
    ["도훈의 첫 판정", `${name}, 답부터 말한다. ${q}은 감정으로 바로 결정하지 말고, 지금 선택의 손실과 후회를 같이 봐야 한다.`],
    ["이 고민의 중심", `${situation || q} 이 흐름에서 중요한 건 네가 무엇을 감당할 수 있고 무엇을 감당하면 무너지는지다.`],
    ["상황에서 먼저 봐야 할 기준", `${relation ? `관련된 사람은 ${relation}이다. ` : ""}말보다 반복된 행동과 현실 조건을 봐야 한다.`],
    ["오늘 바로 할 행동", `${desired || "원하는 답"}을 기준으로 오늘 할 행동 하나와 하지 말아야 할 행동 하나를 정해라.`],
    ["도훈의 마지막 판정", `${name}, 흐리게 끌지 마라. 지금은 기준을 정하고, 기준 밖의 선택은 버리는 쪽이 맞다.`],
  ];
  return cleanGeneratedText(sections.map(([title, body]) => `[${title}]\n${body}`).join("\n\n"));
}


type WorryFollowupQuestionV153 = {
  id: string;
  label: string;
  options: string[];
  allowCustom?: boolean;
};

function inferSimpleWorryTypeV153(question: string) {
  const q = cleanWorryStringV149(question);
  if (/친구가\s*죽|친구\s*죽|상가집|장례식|장례|문상|조문|부고|빈소|조의|조의금/.test(q)) return "경조사·예의";
  if (/이사|지역|어디로|집|거주|동네|생활권|월세|전세|매매/.test(q)) return "이사·거주";
  if (/돈|빌려|빌려달라|대출|투자|금액|생활비|수익|손해/.test(q)) return "돈·거래";
  if (/연애|애인|남자친구|여자친구|헤어|이별|재회|상대|사랑/.test(q)) return "사람·관계";
  if (/퇴사|창업|직장|사업|일자리|이직|직업/.test(q)) return "일·사업";
  if (/가족|부모|자식|형제|배우자|남편|아내/.test(q)) return "가족";
  if (/건강|몸|아프|병원|수면|피로|불안/.test(q)) return "건강·몸";
  return "선택·결정";
}

function fallbackWorryFollowupV153(question: string) {
  const worryType = inferSimpleWorryTypeV153(question);

  if (worryType === "경조사·예의") {
    return {
      worryType,
      questions: [
        { id: "relation", label: "고인과의 관계는 어느 쪽에 가까웠나요?", options: ["가까웠다", "예전엔 가까웠다", "연락은 뜸했다", "애매하다"], allowCustom: true },
        { id: "recent", label: "최근 고인과의 연락이나 관계는 어땠나요?", options: ["최근에도 연락했다", "예전엔 가까웠다", "오래 연락 안 했다", "사이가 애매했다"], allowCustom: true },
        { id: "canGo", label: "현실적으로 상가집에 갈 수 있는 상황인가요?", options: ["바로 갈 수 있다", "거리 때문에 어렵다", "일정 때문에 어렵다", "몸/마음이 너무 힘들다"], allowCustom: true },
        { id: "burden", label: "가장 걸리는 마음은 무엇인가요?", options: ["안 가면 후회할까 봐", "가면 무너질까 봐", "주변 시선이 신경 쓰여서", "예의가 맞는지 몰라서"], allowCustom: true },
        { id: "alternative", label: "못 간다면 가능한 대안은 무엇인가요?", options: ["조의금만 보낸다", "문자/전화만 한다", "장례 후 따로 연락한다", "아무것도 못 하겠다"], allowCustom: true },
        { id: "avoid", label: "가장 피하고 싶은 결과는 무엇인가요?", options: ["나중에 후회하는 것", "가서 감정이 무너지는 것", "유족에게 예의 없어 보이는 것", "주변 사람 말에 휘둘리는 것"], allowCustom: true },
        { id: "want", label: "도훈이 어떤 식으로 답해주면 좋나요?", options: ["가라/가지 마라로 찍어줘", "못 가면 예의 차리는 법까지", "후회 안 남는 쪽으로", "사주상 마음 정리까지"], allowCustom: true },
      ],
    };
  }

  if (worryType === "돈·거래") {
    return {
      worryType,
      questions: [
        { id: "amount", label: "걸린 돈의 크기는 어느 정도인가요?", options: ["소액", "생활비에 영향 있음", "크다", "잃으면 곤란하다"], allowCustom: true },
        { id: "relation", label: "상대와의 관계는 어떤가요?", options: ["가족", "친구/지인", "직장/거래 관계", "거절하기 어려운 사람"], allowCustom: true },
        { id: "purpose", label: "그 돈은 어떤 이유로 필요한 돈인가요?", options: ["생활비", "사업/투자", "빚/카드값", "이유가 흐리다"], allowCustom: true },
        { id: "payback", label: "돌려받을 가능성은 어느 정도로 보이나요?", options: ["날짜가 정해져 있다", "말로만 갚는다고 한다", "잘 모르겠다", "못 받을 수도 있다"], allowCustom: true },
        { id: "myImpact", label: "내 생활에는 어느 정도 영향이 있나요?", options: ["거의 없다", "조금 부담", "생활비가 흔들린다", "비상금까지 건드린다"], allowCustom: true },
        { id: "limit", label: "도와준다면 어디까지 가능하나요?", options: ["아예 어렵다", "작은 금액만", "조건부로 가능", "빌려주기보다 그냥 조금 준다"], allowCustom: true },
        { id: "want", label: "원하는 답은 무엇인가요?", options: ["빌려줘/거절해로 찍어줘", "조건을 정해줘", "관계 안 깨지게 말하는 법", "돈 잃을지 봐줘"], allowCustom: true },
      ],
    };
  }

  if (worryType === "일·사업") {
    return {
      worryType,
      questions: [
        { id: "goal", label: "지금 일 고민의 핵심은 무엇인가요?", options: ["직장을 구해야 한다", "이직 고민", "퇴사 고민", "창업/부업 고민"], allowCustom: true },
        { id: "career", label: "현재 경력이나 해본 일은 어느 쪽인가요?", options: ["사무/관리", "영업/거래처", "기술/현장", "아직 뚜렷하지 않다"], allowCustom: true },
        { id: "urgent", label: "얼마나 급한 상황인가요?", options: ["바로 구해야 한다", "1~3개월 안", "천천히 봐도 된다", "돈 때문에 급하다"], allowCustom: true },
        { id: "avoid", label: "절대 피하고 싶은 일자리는 무엇인가요?", options: ["월급 낮은 곳", "사람 스트레스 큰 곳", "몸이 너무 힘든 곳", "배울 게 없는 곳"], allowCustom: true },
        { id: "money", label: "수입 조건은 어느 정도가 필요하나요?", options: ["생활비만 맞으면 된다", "최소 월급이 중요하다", "장기적으로 올라야 한다", "당장 돈이 급하다"], allowCustom: true },
        { id: "condition", label: "현실 조건에서 중요한 건 무엇인가요?", options: ["출퇴근 거리", "근무시간", "안정성", "경력으로 남는 일"], allowCustom: true },
        { id: "want", label: "도훈이 어떤 답을 내려주면 좋나요?", options: ["맞는 직무를 찍어줘", "피해야 할 회사를 말해줘", "지금 움직일 순서", "취업/이직 판정"], allowCustom: true },
      ],
    };
  }

  if (worryType === "이사·거주") {
    return {
      worryType,
      questions: [
        { id: "reason", label: "이사를 고민하는 가장 큰 이유는 무엇인가요?", options: ["돈/월세", "일/출퇴근", "사람/관계", "마음 정리"], allowCustom: true },
        { id: "current", label: "현재 기준점은 어디에 가깝나요?", options: ["현재 동네 유지", "근처 이동", "완전히 다른 지역", "아직 기준 없음"], allowCustom: true },
        { id: "candidate", label: "비교 중인 후보가 있나요?", options: ["1곳 있다", "2~3곳 있다", "없다", "지역만 고민 중"], allowCustom: true },
        { id: "money", label: "돈 조건은 어떤가요?", options: ["월세 부담 큼", "보증금이 문제", "생활비까지 봐야 함", "돈은 큰 문제 아님"], allowCustom: true },
        { id: "work", label: "일과 생활 동선은 어떤가요?", options: ["출퇴근 중요", "일자리도 바뀔 수 있음", "가족 동선 중요", "혼자 기준으로 보면 됨"], allowCustom: true },
        { id: "avoid", label: "이사에서 제일 피하고 싶은 건 무엇인가요?", options: ["돈 새는 것", "외로워지는 것", "일이 꼬이는 것", "후회하는 것"], allowCustom: true },
        { id: "want", label: "원하는 답은 무엇인가요?", options: ["가라/가지 마라", "지역 우선순위", "돈 기준", "시기와 순서"], allowCustom: true },
      ],
    };
  }

  return {
    worryType,
    questions: [
      { id: "core", label: "이 고민에서 제일 걸리는 건 무엇인가요?", options: ["돈", "사람", "일", "몸/마음", "후회"], allowCustom: true },
      { id: "target", label: "이 고민에 관련된 사람이나 대상은 누구인가요?", options: ["가족", "연인/배우자", "친구/지인", "회사/거래처", "나 혼자 문제"], allowCustom: true },
      { id: "state", label: "현재 상황은 어느 쪽에 가까운가요?", options: ["바로 결정해야 함", "계속 미뤄짐", "마음이 흔들림", "현실 조건이 막힘"], allowCustom: true },
      { id: "choice", label: "지금 비교 중인 선택지는 무엇인가요?", options: ["한다/안 한다", "간다/안 간다", "붙잡는다/끊는다", "기다린다/움직인다"], allowCustom: true },
      { id: "risk", label: "가장 걱정되는 손해는 무엇인가요?", options: ["돈 손해", "관계 손상", "일이 꼬임", "몸/마음이 무너짐"], allowCustom: true },
      { id: "avoid", label: "절대 피하고 싶은 결과는 무엇인가요?", options: ["후회", "손해", "사람 잃는 것", "시간 낭비"], allowCustom: true },
      { id: "want", label: "도훈이 어떤 식으로 답해주면 좋나요?", options: ["딱 잘라 판정", "이유까지", "실제 행동까지", "후회 안 남는 쪽"], allowCustom: true },
    ],
  };
}
function normalizeFollowupQuestionsV153(value: any, question: string) {
  const fallback = fallbackWorryFollowupV153(question);
  const worryType = cleanWorryStringV149(value?.worryType) || fallback.worryType;
  const rawQuestions = Array.isArray(value?.questions) ? value.questions : [];
  const questions = rawQuestions
    .map((item: any, index: number) => {
      const label = cleanWorryStringV149(item?.label).slice(0, 80);
      const options = Array.isArray(item?.options)
        ? item.options.map((option: any) => cleanWorryStringV149(option).slice(0, 30)).filter(Boolean).slice(0, 4)
        : [];
      if (!label || options.length < 2) return null;
      return {
        id: cleanWorryStringV149(item?.id) || `q${index + 1}`,
        label,
        options,
        allowCustom: item?.allowCustom !== false,
      } as WorryFollowupQuestionV153;
    })
    .filter(Boolean)
    .slice(0, 7) as WorryFollowupQuestionV153[];

  return {
    worryType,
    questions: questions.length >= 5 ? questions : fallback.questions,
  };
}

async function buildWorryFollowupQuestionsV153(question: string) {
  const q = cleanWorryStringV149(question);
  const fallback = fallbackWorryFollowupV153(q);
  if (!q || q.length < 4) return { ...fallback, aiUsed: false, reason: "QUESTION_TOO_SHORT" };
  if (!process.env.OPENAI_API_KEY) return { ...fallback, aiUsed: false, reason: "OPENAI_KEY_MISSING" };

  const prompt = `너는 소름사주 앱의 도훈이다.
사용자가 휴대폰에서 한 줄 고민을 적었다.
너의 임무는 풀이를 쓰는 게 아니라, 유료 풀이 전에 15,000자급 상담에 꼭 필요한 추가 질문 5~7개를 만드는 것이다.

규칙:
- 사용자가 긴 접수지를 직접 쓰게 하지 마라.
- 각 질문은 버튼 선택지 3~5개로 답할 수 있어야 한다.
- 질문은 현재 고민 상황에 정확히 맞아야 한다.
- 반드시 질문 5~7개를 만든다. 4개 이하는 실패다.
- 질문은 관계 대상, 현재 상태, 선택 후보, 막히는 이유, 돈/시간/거리/현실조건, 원하는 판정, 절대 피하고 싶은 결과를 나눠 물어라.
- 이사 질문이 아니면 이사/지역 질문을 던지지 마라.
- 장례식/상가집/조문 질문이면 고인과의 관계, 최근 관계 거리, 갈 수 있는 현실 조건, 마음 부담, 못 갈 때 대안, 원하는 판정 방식을 묻는다.
- 돈 질문이면 금액 부담, 상대 관계, 갚을 가능성, 내 생활비 영향, 거절 가능성, 도와줄 수 있는 한도를 묻는다.
- 직장/구직 질문이면 희망 직무, 현재 경력, 급한 정도, 피하고 싶은 회사, 수입 조건, 출퇴근/지역 조건, 원하는 판정을 묻는다.
- 연애 질문이면 현재 관계, 상대 행동, 내가 원하는 결론, 연락/만남 상태, 이미 한 행동, 절대 피하고 싶은 결말을 묻는다.
- 반드시 JSON만 반환한다.

반환 형식:
{"worryType":"경조사·예의","questions":[{"id":"relation","label":"고인과의 관계는 어느 쪽에 가까웠나요?","options":["가까웠다","예전엔 가까웠다","연락은 뜸했다","애매하다"],"allowCustom":true}]}

사용자 질문:
${q}`;

  const completion = await client.chat.completions.create({
    model: WORRY_MODEL,
    temperature: 0.2,
    max_tokens: 1600,
    messages: [
      { role: "system", content: "너는 모바일 상담 접수 질문 생성기다. JSON만 반환한다." },
      { role: "user", content: prompt },
    ],
  });
  const content = completion.choices[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
    return { ...normalizeFollowupQuestionsV153(parsed, q), aiUsed: true };
  } catch (error) {
    console.error("worry followup parse error", { error, content });
    return { ...fallback, aiUsed: false, reason: "AI_PARSE_FAILED" };
  }
}



function getWorryFactsV165(payload: Record<string, string>) {
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);
  const facts: string[] = [];
  const push = (label: string, value: any) => {
    const v = cleanWorryStringV149(value);
    if (v) facts.push(`${label}: ${v}`);
  };
  push("핵심 질문", payload.question);
  push("현재 상황", payload.situation);
  push("고민 이유", payload.reason);
  push("선택지/비교 대상", payload.candidateRegions);
  push("일/직장 조건", payload.currentWork);
  push("돈/현실 조건", payload.moneySituation);
  push("관계 정보", payload.relationshipInfo);
  push("몸/마음 상태", payload.healthConcern);
  push("원하는 판정", payload.desiredVerdict);
  return { type, facts };
}

function getWorryTypeNameV165(type: string) {
  const t = normalizePremiumWorryTypeV154(type, "");
  if (t === "일·사업") return "직장·구직·일 상담";
  if (t === "연애") return "연애·재회·관계 상담";
  if (t === "돈") return "돈·거래 상담";
  if (t === "이사") return "이사·거주 상담";
  if (t === "조문") return "경조사·조문 상담";
  if (t === "가족") return "가족 상담";
  if (t === "건강") return "몸·컨디션 상담";
  return "선택 상담";
}

function getWorryForbiddenGuideV165(type: string, payload: Record<string, string>) {
  const t = normalizePremiumWorryTypeV154(type, payload.question);
  const source = buildWorryEvidenceSourceV164(payload);
  const lines = [
    "본문에 '고민 유형:', '질문:', '현재 상황:', '접수된 핵심은', '이번 상담 접수지', 'facts' 같은 라벨을 그대로 출력하지 마라.",
    "사용자가 말하지 않은 인물, 사건, 지역, 장례식, 배우자, 형제, 친구를 만들지 마라.",
  ];
  if (!/장례|상가집|조문|부고|고인|빈소|조의|마지막 인사/.test(source)) {
    lines.push("장례식, 상가집, 조문, 부고, 고인, 마지막 인사 이야기를 절대 만들지 마라.");
  }
  if (!/아내|남편|배우자|와이프|신랑|신부/.test(source)) {
    lines.push("아내, 남편, 배우자 이야기를 절대 만들지 마라.");
  }
  if (!/형|오빠|누나|언니|동생|형제/.test(source)) {
    lines.push("형, 오빠, 누나, 언니, 동생, 형제 이야기를 절대 만들지 마라.");
  }
  if (!/친구|지인|동료/.test(source)) {
    lines.push("친구, 지인, 동료 이야기를 새로 만들지 마라.");
  }
  if (t === "일·사업") {
    lines.push("돈을 빌려줘라/빌려주지 마라, 가족 돈거래, 친구에게 할 말 같은 돈대여 상담 문장을 절대 쓰지 마라.");
  }
  if (t === "연애") {
    lines.push("이사 지역 추천, 직업 추천, 돈 빌려주는 상담으로 새지 마라.");
  }
  if (t === "돈") {
    lines.push("직장 구직, 재회, 이사 지역 추천으로 새지 마라.");
  }
  return lines.map((line) => `- ${line}`).join("\n");
}

function getWorryPartPlanV165(type: string, name: string) {
  const t = normalizePremiumWorryTypeV154(type, "");
  if (t === "연애") {
    return [
      { no: 1, title: "첫 판정·관계 핵심", sections: ["도훈의 첫 판정", "재회 가능성부터 자르면", "지금 관계의 진짜 중심", "사주에서 먼저 반응하는 관계 흐름"] },
      { no: 2, title: "상대 행동·연락·다른 사람", sections: ["상대 행동에서 이미 나온 답", "연락이 없는 상태의 의미", "다른 사람이 있는 것 같을 때", "이미 직접 만난 뒤의 흐름"] },
      { no: 3, title: "밀기·기다리기·끊기 비교", sections: ["지금 밀면 깨지는 지점", "기다린다면 어디까지 기다릴지", "완전히 끊어질까 두려운 마음", "피해야 할 행동"] },
      { no: 4, title: "실행 문장·마지막 판정", sections: ["다시 연락한다면 이렇게 해라", "답이 없을 때 멈출 기준", "오늘부터 할 행동", "도훈의 마지막 판정"] },
    ];
  }
  if (t === "일·사업") {
    return [
      { no: 1, title: "첫 판정·구직 핵심", sections: ["도훈의 첫 판정", "지금 직장을 구할 때 먼저 봐야 할 자리", "사주에서 먼저 반응하는 일의 축", "이번 구직의 핵심 기준"] },
      { no: 2, title: "맞는 일·피해야 할 일", sections: ["맞는 직무군 3개", "피해야 할 직장", "하면 오래 못 버티는 자리", "잡으면 경력으로 남는 자리"] },
      { no: 3, title: "돈·현실·면접 기준", sections: ["수입과 현실 조건", "출퇴근과 근무시간", "면접에서 확인할 질문", "입사 전 반드시 볼 조건"] },
      { no: 4, title: "구직 실행·마지막 판정", sections: ["이번 주 구직 행동", "이력서에서 밀어야 할 포인트", "합격해도 버릴 회사", "도훈의 마지막 판정"] },
    ];
  }
  if (t === "돈") {
    return [
      { no: 1, title: "첫 판정·돈의 성격", sections: ["도훈의 첫 판정", "이 돈의 진짜 성격", "상대와 돈의 경계", "사주에서 돈이 새는 지점"] },
      { no: 2, title: "빌려주면 생기는 일", sections: ["빌려주면 생기는 일", "거절하면 생기는 일", "관계가 흔들리는 지점", "회수 가능성 판단"] },
      { no: 3, title: "금액·조건·말하는 법", sections: ["금액 기준", "조건을 걸어도 되는 경우", "상대에게 할 말", "절대 쓰면 안 되는 말"] },
      { no: 4, title: "최종 기준·마지막 판정", sections: ["도와줄 수 있는 한도", "생활비 방어선", "오늘 바로 할 행동", "도훈의 마지막 판정"] },
    ];
  }
  if (t === "이사") {
    return [
      { no: 1, title: "첫 판정·이사 핵심", sections: ["도훈의 첫 판정", "이사를 가야 하는 이유", "지금 집에서 막히는 지점", "사주에서 움직임이 열리는 방향"] },
      { no: 2, title: "후보 비교", sections: ["1순위 생활권", "2순위 생활권", "비추천 생활권", "후보가 없을 때 잡을 기준"] },
      { no: 3, title: "돈·동선·생활", sections: ["돈과 월세", "일과 생활 동선", "사람과 마음의 후폭풍", "계약 전에 볼 조건"] },
      { no: 4, title: "실행 순서·마지막 판정", sections: ["집 보러 갈 때 확인할 것", "이번 달 움직임", "절대 피할 선택", "도훈의 마지막 판정"] },
    ];
  }
  if (t === "조문") {
    return [
      { no: 1, title: "첫 판정·예의 핵심", sections: ["도훈의 첫 판정", "관계로 보면", "마음에 남는 후회", "사주에서 예의가 걸리는 지점"] },
      { no: 2, title: "갈 때와 못 갈 때", sections: ["현실적으로 갈 수 있는지", "가면 지켜야 할 선", "못 가면 해야 할 예의", "주변 시선에 흔들리지 않는 기준"] },
      { no: 3, title: "몸·마음·후폭풍", sections: ["마음의 준비가 안 됐을 때", "감정이 무너질 것 같을 때", "장례 후 남는 감정", "후회가 덜 남는 행동"] },
      { no: 4, title: "실행 문장·마지막 판정", sections: ["문자와 조의금 기준", "유족에게 할 말", "오늘 바로 할 행동", "도훈의 마지막 판정"] },
    ];
  }
  return [
    { no: 1, title: "첫 판정·고민 핵심", sections: ["도훈의 첫 판정", "이 고민의 중심", "사주에서 먼저 반응하는 축", "지금 바로 봐야 할 기준"] },
    { no: 2, title: "선택지 비교", sections: ["첫 번째 선택을 잡으면 생기는 일", "두 번째 선택을 잡으면 생기는 일", "피해야 할 선택", "잡아야 할 선택"] },
    { no: 3, title: "현실 조건", sections: ["돈과 현실 조건", "사람과 마음의 후폭풍", "몸과 일상 리듬", "주변 말에 흔들리는 지점"] },
    { no: 4, title: "실행·마지막 판정", sections: ["오늘 바로 할 행동", "확인해야 할 조건", "멈춰야 할 선", "도훈의 마지막 판정"] },
  ];
}

function buildWorryPartPromptV165(params: {
  user: any;
  payload: Record<string, string>;
  manseText: string;
  fixedConclusionText: string;
  part: { no: number; title: string; sections: string[] };
  previousSummary: string;
}) {
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const { type, facts } = getWorryFactsV165(params.payload);
  const typeName = getWorryTypeNameV165(type);
  const forbidden = getWorryForbiddenGuideV165(type, params.payload);
  return `너는 소름사주 앱의 도훈이다.
지금은 내 고민 상담 유료 리포트 ${params.part.no}/4 파트를 쓰는 중이다.
이번 상담 유형은 "${type}"이고, 성격은 "${typeName}"이다.

[상담 facts]
${facts.map((f) => `- ${f}`).join("\n")}

[절대 금지]
${forbidden}
- facts를 목록 그대로 복붙하지 마라. 본문 안에서 자연스럽게 해석해라.
- 없는 사건, 없는 사람, 없는 지역을 만들지 마라.
- 거절문을 쓰지 마라. 일반 선택 상담으로 안전하게 답해라.
- 애매하게 "가능성이 있다"로 흐리지 말고 판정해라.
- 상담센터식 말투 금지. "고민해봐", "찾아봐", "건강하게 다뤄라" 금지.

[사주 근거]
${params.manseText}

[고정 기준]
${params.fixedConclusionText}

[이전 파트 요약]
${params.previousSummary || "없음. 이번 파트가 첫 파트다."}

[이번 파트 목표]
- 파트 제목: ${params.part.title}
- 아래 섹션만 쓴다.
${params.part.sections.map((s) => `[${s}]`).join("\n")}

[분량]
- 이번 파트만 3,000~4,000자 정도로 쓴다.
- 각 섹션은 최소 2문단 이상, 문단마다 현실 기준과 행동 예시를 넣는다.
- 전체 리포트의 한 부분이므로 끝맺음으로 전체를 마무리하지 마라. 단, 4파트의 [도훈의 마지막 판정]은 최종 결론으로 끝낸다.

첫 문장은 ${params.part.no === 1 ? `"${name}, 답부터 말한다."로 시작한다.` : "바로 섹션 제목부터 시작한다."}
한국어로만 작성해라.`;
}

function stripWorryPartArtifactsV165(text: string) {
  return cleanGeneratedText(text || "")
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/^\s*(파트\s*\d+\s*[:：].*|이번\s*파트\s*[:：].*)\s*$/gim, "")
    .trim();
}

function hasContextDumpV165(text: string) {
  return /고민\s*유형\s*[:：]|핵심\s*질문\s*[:：]|현재\s*상황\s*[:：]|이번\s*상담\s*접수지|접수된\s*핵심은|상담\s*facts|facts\s*[:：]/i.test(text || "");
}

function hasTypeForbiddenLeakV165(text: string, payload: Record<string, string>) {
  const source = text || "";
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);
  if (hasUnsupportedWorryHallucinationV164(source, payload)) return true;
  if (type === "일·사업" && /빌려주지\s*마라|돈을\s*빌려|가족\s*돈거래|친구에게\s*할\s*말|상대에게\s*할\s*말/.test(source)) return true;
  if (type === "연애" && /1순위\s*지역|월세로\s*보면|직무군|면접에서\s*확인|빌려주지\s*마라/.test(source)) return true;
  if (type === "돈" && /재회\s*가능성|직무군|1순위\s*생활권|장례식에\s*가/.test(source)) return true;
  if (type === "이사" && /재회\s*가능성|빌려주지\s*마라|면접에서\s*확인/.test(source)) return true;
  return false;
}

function isBadWorryPartV165(text: string, payload: Record<string, string>) {
  const cleaned = stripWorryPartArtifactsV165(text);
  if (isWorryRefusalTextV161(cleaned)) return true;
  if (hasContextDumpV165(cleaned)) return true;
  if (hasTypeForbiddenLeakV165(cleaned, payload)) return true;
  if (cleaned.length < 700) return true;
  return false;
}

function sanitizeWorryPartForDisplayV166(text: string, payload: Record<string, string>) {
  const type = normalizePremiumWorryTypeV154(payload.worryType, payload.question);
  let cleaned = stripWorryPartArtifactsV165(text || "");

  cleaned = cleaned
    .split(/\n+/)
    .filter((line) => !/고민\s*유형\s*[:：]|핵심\s*질문\s*[:：]|현재\s*상황\s*[:：]|이번\s*상담\s*접수지|접수된\s*핵심은|상담\s*facts|facts\s*[:：]/i.test(line))
    .join("\n")
    .trim();

  if (type === "일·사업") {
    cleaned = cleaned.replace(/[^\n]*?(빌려주지\s*마라|돈을\s*빌려|가족\s*돈거래|친구에게\s*할\s*말|상대에게\s*할\s*말)[^\n]*\n?/g, "");
  }
  if (type === "연애") {
    cleaned = cleaned.replace(/[^\n]*?(1순위\s*지역|월세로\s*보면|직무군|면접에서\s*확인|빌려주지\s*마라|장례식|상가집|조문|고인|마지막\s*인사)[^\n]*\n?/g, "");
  }
  if (type === "돈") {
    cleaned = cleaned.replace(/[^\n]*?(재회\s*가능성|직무군|1순위\s*생활권|장례식에\s*가)[^\n]*\n?/g, "");
  }
  if (type === "이사") {
    cleaned = cleaned.replace(/[^\n]*?(재회\s*가능성|빌려주지\s*마라|면접에서\s*확인)[^\n]*\n?/g, "");
  }

  return cleaned.trim();
}

function buildEmergencyWorryPartPromptV166(params: {
  user: any;
  payload: Record<string, string>;
  part: { no: number; title: string; sections: string[] };
}) {
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const { type, facts } = getWorryFactsV165(params.payload);
  return `소름사주 도훈의 내 고민 상담 리포트 일부를 작성해라.
선택 유형: ${type}
사용자 이름: ${name}
사용자가 실제로 준 정보:
${facts.map((f) => `- ${f}`).join("\n")}

이번 파트: ${params.part.no}/4 ${params.part.title}
반드시 아래 제목만 사용:
${params.part.sections.map((s) => `[${s}]`).join("\n")}

규칙:
- 본문에 '고민 유형:', '핵심 질문:', '현재 상황:', 'facts' 같은 접수지 라벨을 절대 쓰지 마라.
- 사용자가 말하지 않은 장례식, 아내, 남편, 형, 친구, 지역을 만들지 마라.
- 선택 유형 ${type} 하나만 답해라.
- 거절문 금지.
- 각 제목마다 2문단 이상 써라.
- ${params.part.no === 1 ? `첫 문장은 "${name}, 답부터 말한다."로 시작해라.` : "바로 제목부터 시작해라."}`;
}

async function generateWorryReportPartV165(params: {
  user: any;
  payload: Record<string, string>;
  manseText: string;
  fixedConclusionText: string;
  part: { no: number; title: string; sections: string[] };
  previousSummary: string;
  seed: number;
}) {
  const prompt = buildWorryPartPromptV165(params);

  // v166: 4파트 장문 생성에서 한 파트가 검사에 걸렸다고 전체 유료 리포트를 죽이지 않는다.
  // 첫 생성 → 안전 재작성 1회 → 정리 후 반환으로 끝낸다.
  let raw = await generateWorryTextV152(prompt, 4300, params.seed);
  let cleaned = sanitizeWorryPartForDisplayV166(raw, params.payload);
  if (!isBadWorryPartV165(cleaned, params.payload)) return { text: cleaned, repaired: false };

  const emergencyPrompt = buildEmergencyWorryPartPromptV166({
    user: params.user,
    payload: params.payload,
    part: params.part,
  });
  raw = await generateWorryTextV152(emergencyPrompt, 4400, params.seed + 101);
  cleaned = sanitizeWorryPartForDisplayV166(raw, params.payload);

  if (isWorryRefusalTextV161(cleaned)) {
    cleaned = params.part.sections
      .map((section, index) => {
        if (params.part.no === 1 && index === 0) {
          const name = cleanWorryStringV149(params.user?.name) || "너";
          return `[${section}]\n${name}, 답부터 말한다. 이번 고민은 선택한 분야 안에서만 봐야 한다. 지금은 다른 이야기로 새지 말고, 네가 적은 질문과 추가 답변을 기준으로 판단해야 한다.`;
        }
        return `[${section}]\n이 부분은 네가 적은 질문과 추가 답변을 기준으로 정리해야 한다. 모르는 사건이나 인물을 만들지 않고, 지금 드러난 조건 안에서 판단한다.`;
      })
      .join("\n\n");
  }

  if (cleaned.length < 500) {
    const { facts } = getWorryFactsV165(params.payload);
    cleaned = `${params.part.sections.map((s) => `[${s}]`).join("\n\n")}\n\n${facts.slice(0, 5).join("\n")}`;
  }

  return { text: cleaned, repaired: true };
}


function summarizeWorryPartForNextV165(text: string) {
  return cleanWorryStringV149(
    cleanGeneratedText(text || "")
      .split(/\n+/)
      .filter((line) => line.trim() && !line.trim().startsWith("["))
      .slice(0, 6)
      .join(" "),
  ).slice(0, 700);
}


async function generatePremiumWorryReportV165(params: {
  user: any;
  payload: Record<string, string>;
  manseText: string;
  fixedConclusionText: string;
  seed: number;
}) {
  const type = normalizePremiumWorryTypeV154(params.payload.worryType, params.payload.question);
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const parts = getWorryPartPlanV165(type, name);
  const outputs: string[] = [];
  let previousSummary = "";
  let repaired = false;

  for (const part of parts) {
    const generated = await generateWorryReportPartV165({
      user: params.user,
      payload: { ...params.payload, worryType: type },
      manseText: params.manseText,
      fixedConclusionText: params.fixedConclusionText,
      part,
      previousSummary,
      seed: params.seed + part.no * 1000,
    });
    outputs.push(generated.text);
    repaired = repaired || generated.repaired;
    previousSummary = summarizeWorryPartForNextV165(generated.text);
  }

  let full = outputs.join("\n\n").trim();
  full = cleanGeneratedText(full);
  const qualityWarnings: string[] = [];

  if (isWorryRefusalTextV161(full)) {
    qualityWarnings.push("WORRY_REPORT_REFUSAL_REMOVED");
    full = outputs
      .map((part) => sanitizeWorryPartForDisplayV166(part, { ...params.payload, worryType: type }))
      .filter((part) => !isWorryRefusalTextV161(part))
      .join("\n\n")
      .trim();
  }

  if (hasContextDumpV165(full)) {
    qualityWarnings.push("WORRY_REPORT_CONTEXT_DUMP_REMOVED");
    full = full
      .split(/\n+/)
      .filter((line) => !/고민\s*유형\s*[:：]|핵심\s*질문\s*[:：]|현재\s*상황\s*[:：]|이번\s*상담\s*접수지|접수된\s*핵심은|상담\s*facts|facts\s*[:：]/i.test(line))
      .join("\n")
      .trim();
  }

  if (hasTypeForbiddenLeakV165(full, { ...params.payload, worryType: type })) {
    qualityWarnings.push("WORRY_REPORT_OFF_TOPIC_OR_HALLUCINATION_CLEANED");
    full = sanitizeWorryPartForDisplayV166(full, { ...params.payload, worryType: type });
  }

  if (!full || full.length < 1200) {
    qualityWarnings.push("WORRY_REPORT_TOO_SHORT_AFTER_CLEANUP");
    full = buildGuaranteedWorryReportV168({
      user: params.user,
      payload: { ...params.payload, worryType: type },
      manseText: params.manseText,
      fixedConclusionText: params.fixedConclusionText,
      reason: "AI_RESULT_TOO_SHORT",
    });
  }

  return { full, repaired, qualityWarnings };
}

function getGuaranteedWorryTypeGuideV168(type: string) {
  if (type === "연애") {
    return {
      core: "관계는 감정이 아니라 상대의 반복 행동, 연락의 지속성, 만남 이후의 태도, 네가 무너지지 않는 선으로 판정한다.",
      push: "먼저 밀어붙이는 선택은 짧게 한 번만 가능하다. 장문 연락, 확인성 연락, 질투를 드러내는 말, 상대를 몰아붙이는 말은 관계의 문을 더 닫는다.",
      wait: "기다림은 가만히 버티는 것이 아니라 기한을 정해 놓고 상대의 행동을 확인하는 일이다. 기한 없는 기다림은 재회운이 아니라 미련이다.",
      avoid: "상대가 보이지 않는 마음을 네가 대신 해석해서 희망으로 만들면 안 된다. 보이는 행동이 없으면 지금은 닫힌 흐름으로 봐야 한다.",
    };
  }
  if (type === "일·사업") {
    return {
      core: "일 문제는 체면보다 역할, 급여, 출퇴근, 배울 것, 오래 버틸 수 있는 구조로 판정한다.",
      push: "지금 움직여야 한다면 아무 회사나 넣는 것이 아니라 맞는 직무군을 좁히고, 면접에서 업무 범위와 급여 조건을 확인해야 한다.",
      wait: "기다릴 수 있다면 준비 없이 쉬는 것이 아니라 이력서, 경력 설명, 지원 직무, 면접 답변을 정리하는 기간으로 써야 한다.",
      avoid: "말만 좋은 회사, 업무 범위가 흐린 자리, 급여일과 수습 조건이 불분명한 곳, 사람으로 버티라는 회사는 피해야 한다.",
    };
  }
  if (type === "돈") {
    return {
      core: "돈 문제는 의리보다 회수 가능성, 내 생활비 방어선, 관계가 깨졌을 때 감당할 수 있는지로 판정한다.",
      push: "도와야 한다면 받을 돈으로 잡지 말고 잃어도 되는 한도 안에서만 움직여야 한다.",
      wait: "바로 돈을 내보내기 전에 금액, 날짜, 상환 방법, 내 생활비 영향부터 확인해야 한다.",
      avoid: "월세, 카드값, 생활비, 비상금까지 건드리는 선택은 피해야 한다. 그 돈은 상대를 돕는 돈이 아니라 나까지 흔드는 돈이다.",
    };
  }
  if (type === "이사") {
    return {
      core: "이사 문제는 감정 회피가 아니라 돈, 동선, 일상 리듬, 사람과의 거리, 다시 무너지지 않을 환경으로 판정한다.",
      push: "움직여야 한다면 후보지를 넓게 잡기보다 생활비와 출퇴근, 실제 생활권을 먼저 좁혀야 한다.",
      wait: "기다릴 수 있다면 집을 안 보는 것이 아니라 보증금, 월세, 관리비, 이동 시간, 주변 환경을 표로 비교해야 한다.",
      avoid: "기분 때문에 급하게 계약하거나, 첫 느낌만 보고 움직이거나, 돈 계산 없이 지역만 고르는 선택은 피해야 한다.",
    };
  }
  if (type === "조문") {
    return {
      core: "경조사 문제는 예의, 후회, 현실적으로 갈 수 있는지, 마음이 무너지는 정도를 같이 보고 판정한다.",
      push: "가야 한다면 오래 머물 필요는 없다. 짧게 예의를 지키고, 감정이 무너지기 전에 나오는 방식도 충분히 예의다.",
      wait: "못 간다면 아무것도 안 하는 것이 아니라 연락, 조의, 장례 후 인사처럼 후회를 줄이는 대안을 남겨야 한다.",
      avoid: "남 눈치 때문에 가거나, 마음이 완전히 무너질 정도인데 억지로 버티는 선택은 피해야 한다.",
    };
  }
  return {
    core: "이번 고민은 감정 하나가 아니라 현실 조건, 사람 관계, 내 생활 리듬, 나중에 남을 후회까지 같이 보고 판정한다.",
    push: "움직여야 한다면 크게 벌리지 말고 작게 확인한 뒤 다음 결정을 잡아야 한다.",
    wait: "기다린다면 흐리게 미루는 것이 아니라 확인할 조건과 기한을 정해야 한다.",
    avoid: "눈치, 불안, 죄책감 때문에 하는 선택은 피해야 한다. 그 선택은 나중에 내 결정으로 남지 않는다.",
  };
}

function buildGuaranteedWorryReportV168(params: {
  user: any;
  payload: Record<string, string>;
  manseText?: string;
  fixedConclusionText?: string;
  reason?: string;
}) {
  const type = normalizePremiumWorryTypeV154(params.payload.worryType, params.payload.question);
  const name = cleanWorryStringV149(params.user?.name) || "너";
  const question = cleanWorryStringV149(params.payload.question || params.user?.question) || "이번 고민";
  const { facts } = getWorryFactsV165({ ...params.payload, worryType: type });
  const safeFacts = facts.length ? facts : [`사용자의 핵심 질문은 ${question}이다.`];
  const plan = getWorryPartPlanV165(type, name);
  const guide = getGuaranteedWorryTypeGuideV168(type);
  const factText = safeFacts.slice(0, 8).map((f) => f.replace(/^[-•]\s*/, "")).join(" ");
  const directVerdict = (() => {
    if (type === "연애") return "지금은 감정으로 밀지 말고, 한 번만 확인한 뒤 상대 행동이 없으면 물러서는 쪽이 맞다.";
    if (type === "일·사업") return "직장은 구하되 아무 자리나 잡지 말고, 역할·급여·근무조건이 분명한 곳으로 좁혀야 한다.";
    if (type === "돈") return "돈은 지켜라. 도와야 한다면 잃어도 되는 한도 안에서만 움직여야 한다.";
    if (type === "이사") return "이사는 감정으로 움직이지 말고 돈과 생활 동선이 맞는 후보만 남겨야 한다.";
    if (type === "조문") return "예의를 남기되 네 몸과 마음이 무너지는 방식으로는 가지 마라.";
    return "지금은 흐리게 끌지 말고 기준을 정한 뒤 작은 행동부터 잡아야 한다.";
  })();

  const sectionBody = (section: string, partNo: number, idx: number) => {
    const first = partNo === 1 && idx === 0
      ? `${name}, 답부터 말한다. ${directVerdict}`
      : `${section}을 보면, 이 고민은 ${question} 하나만 놓고 봐야 한다.`;
    return `[${section}]\n${first}\n\n${guide.core} 네가 적은 내용에서 보이는 흐름은 ${factText} 이다. 이 정보를 그대로 나열하는 것이 아니라, 여기서 실제 판단 기준을 뽑아야 한다. 지금 필요한 건 멋있는 위로가 아니라, 선택했을 때 무엇이 살아나고 무엇이 무너지는지 가르는 일이다.\n\n${guide.push} 이 선택을 밀고 간다면 오늘 당장 해야 할 행동은 하나로 줄여야 한다. 말을 많이 하거나 한 번에 결론을 끝내려 하면 오히려 판이 흐려진다. 먼저 확인할 조건 하나, 버릴 조건 하나, 절대 넘지 않을 선 하나를 잡아라. 그래야 나중에 후회가 남아도 최소한 네가 기준 없이 끌려간 결과는 되지 않는다.\n\n${guide.wait} 반대로 멈추거나 기다린다면 그것도 판정이 있어야 한다. 그냥 미루는 것은 기다림이 아니다. 언제까지 볼지, 무엇이 확인되면 움직일지, 무엇이 확인되면 접을지를 정해야 한다. 이 기준이 없으면 같은 고민을 며칠 뒤에 다시 반복하게 된다.\n\n${guide.avoid} 특히 이번 고민에서 피해야 할 것은 남 눈치와 순간 감정으로 결정하는 일이다. 사주 흐름으로 보면 ${name}은 마음이 복잡할수록 겉으로는 괜찮은 척하면서 안쪽에서 오래 곱씹는 쪽이다. 그래서 지금 결정은 당장의 감정 해소보다 나중에 마음이 덜 흔들리는 쪽으로 잡아야 한다.`;
  };

  const chunks: string[] = [];
  for (const part of plan) {
    chunks.push(`\n[${part.no}부 · ${part.title}]`);
    part.sections.forEach((section, idx) => chunks.push(sectionBody(section, part.no, idx)));
  }

  chunks.push(`[최종 판정]\n${name}, 마지막으로 다시 자른다. ${directVerdict} 이번 고민은 다른 분야로 새면 안 된다. 사용자가 말하지 않은 사람, 사건, 지역을 끌어와 답을 만들면 안 되고, 오직 네가 적은 조건 안에서 결론을 내려야 한다. 오늘 할 일은 복잡하지 않다. 첫째, 지금 선택에서 절대 넘지 않을 선을 하나 적어라. 둘째, 확인해야 할 조건 하나를 상대나 상황에 맞게 짧게 확인해라. 셋째, 그 조건이 맞지 않으면 더 끌지 말고 멈춰라. 이게 이번 고민에서 후회를 가장 적게 남기는 길이다.`);

  return cleanGeneratedText(chunks.join("\n\n"));
}

async function generatePremiumWorryReportV168(params: {
  user: any;
  payload: Record<string, string>;
  manseText: string;
  fixedConclusionText: string;
  seed: number;
}) {
  const qualityWarnings: string[] = [];
  try {
    const generated = await generatePremiumWorryReportV165(params);
    let full = sanitizeWorryPartForDisplayV166(generated.full || "", params.payload);
    const tooShort = !full || full.length < 5000;
    const bad = isWorryRefusalTextV161(full) || hasContextDumpV165(full) || hasTypeForbiddenLeakV165(full, params.payload);
    if (!tooShort && !bad) {
      return { ...generated, full, qualityWarnings: [...((generated as any).qualityWarnings || []), "WORRY_V168_AI_OK"] };
    }
    qualityWarnings.push(...((generated as any).qualityWarnings || []));
    if (tooShort) qualityWarnings.push("WORRY_V168_AI_TOO_SHORT_USED_GUARANTEED");
    if (bad) qualityWarnings.push("WORRY_V168_AI_BAD_USED_GUARANTEED");
  } catch (error: any) {
    console.error("worry v168 safe wrapper caught:", error);
    qualityWarnings.push(`WORRY_V168_CAUGHT:${String(error?.message || error || "UNKNOWN").slice(0, 200)}`);
  }

  const full = buildGuaranteedWorryReportV168({
    user: params.user,
    payload: params.payload,
    manseText: params.manseText,
    fixedConclusionText: params.fixedConclusionText,
  });
  return { full, repaired: true, qualityWarnings: [...qualityWarnings, "WORRY_V168_GUARANTEED_REPORT"] };
}

function normalizeCategoryIdForRequest(
  rawCategoryId: CategoryId,
  rawCategoryTitle: string | undefined,
  user: UserInfo,
): CategoryId {
  const title = safeText(rawCategoryTitle, "");
  const hasPartner = hasPartnerBirthInfo(user);

  if (rawCategoryId === "children") return "traditional";
  if (rawCategoryId === "family") return "worry";
  if (rawCategoryId === "partner") return "partner";

  if (title.includes("재물") || title.includes("돈복")) return "money";
  if (title.includes("오늘")) return "today";
  if (title.includes("일·사업") || title.includes("직업") || title.includes("사업운")) return "career";
  if (title.includes("건강") || title.includes("몸운")) return "health";
  if (title.includes("올해") || title.includes("신년") || title.includes("월별") || title.includes("12개월")) return "monthly";
  if (title.includes("인생대운") || title.includes("대운")) return "lifeFlow";
  if (title.includes("평생")) return "traditional";
  if (title.includes("고민") || title.includes("프리미엄")) return "worry";

  // 궁합운은 상대 정보가 있거나, 사용자가 명확히 궁합운을 선택했을 때만 궁합으로 본다.
  // 사랑·결혼운/연애운/결혼운처럼 혼자 보는 카테고리는 넣지도 않은 사람의 궁합을 만들지 않는다.
  if (title.includes("궁합")) return "compatibility";
  if (rawCategoryId === "compatibility") return "compatibility";
  if (rawCategoryId === "love") return "love";
  if (title.includes("궁합")) return "compatibility";
  if (title.includes("연애") || title.includes("사랑")) return "love";
  if (title.includes("결혼")) return "marriage";

  return rawCategoryId;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FortuneRequest;
    const mode = body.mode || "preview";
    const user = body.user || {};

    if (mode === "worry_followup") {
      const sourceQuestion = safeText((body as any).question || user.question || "", "");
      const followup = await buildWorryFollowupQuestionsV153(sourceQuestion);
      return NextResponse.json(
        responsePayload({
          preview: "",
          full: "",
          result: "",
          followupQuestions: followup.questions,
          worryType: followup.worryType,
          aiUsed: followup.aiUsed,
          followupReason: (followup as any).reason || "",
        } as any),
      );
    }
    const rawCategoryId = body.categoryId || "today";
    const categoryId = normalizeCategoryIdForRequest(rawCategoryId, body.categoryTitle, user);
    const categoryTitle = getEffectiveCategoryTitle(
      categoryId,
      getCategoryTitle(categoryId, body.categoryTitle),
      user,
    );
    const question = getWorryQuestionFromRequest(body, user);

    const userForManse = convertUserBirthForManse(user);
    const partnerForManse = convertPartnerBirthForManse(user);

    const userBirthConversion = buildBirthConversionInfo({
      inputCalendar: user.calendar,
      inputYear: user.year,
      inputMonth: user.month,
      inputDay: user.day,
      lunarLeapMonth: user.lunarLeapMonth,
      convertedUser: userForManse,
    });

    const partnerBirthConversion = hasPartnerBirthInfo(user)
      ? buildBirthConversionInfo({
          inputCalendar: user.partnerCalendar,
          inputYear: user.partnerYear,
          inputMonth: user.partnerMonth,
          inputDay: user.partnerDay,
          lunarLeapMonth: user.partnerLunarLeapMonth,
          convertedUser: partnerForManse,
        })
      : null;

    const birthConversion = {
      user: userBirthConversion,
      partner: partnerBirthConversion,
    };

    const birthConversionText = buildBirthConversionText({
      userBirthConversion,
      partnerBirthConversion,
    });

    const myManse = calculateManse(userForManse);
    const partnerManse = hasPartnerBirthInfo(user)
      ? calculateManse(partnerForManse)
      : null;

    const myManseText = formatManseForPrompt(myManse);
    const partnerManseText = partnerManse
      ? formatManseForPrompt(partnerManse)
      : "상대방 만세력 정보: 상대방 생년월일 또는 출생 정보가 부족합니다.";

    const rawFixedConclusionText = getFixedConclusionBlock(
      categoryId,
      categoryTitle,
      userForManse,
      myManse,
      partnerManse,
    );
    let fixedConclusionText = buildSafeFixedConclusionBlock(
      rawFixedConclusionText,
    );
    let profileText = getCategoryProfileText(
      categoryId,
      categoryTitle,
      myManse,
      question,
    );
    const careerBlock = shouldUseCareerArchetype(categoryId)
      ? getCareerArchetypeGuide(myManse)
      : `[고정 직업 성향 판정]
이 카테고리에서는 직업 성향 판정을 사용하지 않는다.
직업운, 사업운, 직장형/사업형/부업형 판정, 직업군 추천을 쓰지 마라.`;

    const globalCareer = getCareerArchetype(myManse);
    const globalMoneyGrade = getMoneyGrade(myManse);
    const globalHealthGrade = getHealthGrade(myManse);
    const fortuneSeed = buildFortuneSeed({
      user: userForManse,
      categoryId,
      categoryTitle,
      manse: myManse,
      partnerManse,
    });
    const repeatGhostProfile = getRepeatGhostProfile(user, myManse);
    const pastLifeProfile = getPastLifeProfile(user, myManse);

    const promptUser: UserInfo = {
      ...user,
      question: safeText(question || user.question, ""),
      year: userForManse.year,
      month: userForManse.month,
      day: userForManse.day,
      calendar: "양력",
      lunarLeapMonth: user.lunarLeapMonth === true,
      partnerYear: hasPartnerBirthInfo(user)
        ? partnerForManse.year
        : user.partnerYear,
      partnerMonth: hasPartnerBirthInfo(user)
        ? partnerForManse.month
        : user.partnerMonth,
      partnerDay: hasPartnerBirthInfo(user)
        ? partnerForManse.day
        : user.partnerDay,
      partnerCalendar: hasPartnerBirthInfo(user)
        ? "양력"
        : user.partnerCalendar,
      partnerLunarLeapMonth: user.partnerLunarLeapMonth === true,
    };

    const scoreVisual = buildRelationshipScoreVisual({
      categoryId,
      categoryTitle,
      user: promptUser,
      manse: myManse,
      partnerManse,
      fortuneSeed,
    });

    if (categoryId === "today" || categoryTitle.includes("오늘")) {
      const todayProfile = buildCategoryPreviewProfile({
        categoryId,
        categoryTitle,
        user: promptUser,
        manse: myManse,
        fortuneSeed,
        scoreVisual,
      });
      if (todayProfile?.kind === "today") {
        profileText = `[오늘운세 서버 계산 해설 기준]
- 오늘 종합점수: ${todayProfile.overallScore}점
- 오늘 재물운 점수: ${todayProfile.moneyScore}점
- 오늘 일·사업운 점수: ${todayProfile.workScore}점
- 오늘 연애·인연운 점수: ${todayProfile.relationshipScore}점
- 오늘 건강운 점수: ${todayProfile.healthScore}점
- 첫 판정: ${todayProfile.verdict}
- 가장 좋은 시간: ${todayProfile.bestTime}
- 가장 강한 분야: ${todayProfile.strongestArea}
- 가장 조심할 분야: ${todayProfile.warningArea}
- 오늘 해야 할 행동: ${todayProfile.doOne}
- 오늘 피해야 할 행동: ${todayProfile.avoidOne}

무료와 유료는 위 판정을 공유한다. 오늘 하루의 돈·일·사람·몸·시간대에서 왜 이런 판정이 나오는지 현실 장면으로 설명하고, 없는 과거 경험이나 질병·장기 문제를 만들어내지 않는다.`;
        fixedConclusionText = `[오늘운세 계산 고정값]
- 오늘 종합점수: ${todayProfile.overallScore}점
- 오늘 재물운 점수: ${todayProfile.moneyScore}점
- 오늘 일·사업운 점수: ${todayProfile.workScore}점
- 오늘 연애·인연운 점수: ${todayProfile.relationshipScore}점
- 오늘 건강운 점수: ${todayProfile.healthScore}점
- 오늘 첫 판정: ${todayProfile.verdict}
- 오늘 가장 좋은 시간: ${todayProfile.bestTime}
- 오늘 가장 강한 분야: ${todayProfile.strongestArea}
- 오늘 가장 조심할 분야: ${todayProfile.warningArea}
- 오늘 꼭 해야 할 것: ${todayProfile.doOne}
- 오늘 피해야 할 것: ${todayProfile.avoidOne}

위 값은 무료 결과와 동일한 서버 계산값이다. 유료에서 절대 바꾸지 말고 각각의 운세 항목에서 깊게 설명한다.`;
      }
    }

    if (isMonthlyCategory(categoryId, categoryTitle)) {
      const yearBaseProfile = buildCategoryPreviewProfile({
        categoryId,
        categoryTitle,
        user: promptUser,
        manse: myManse,
        fortuneSeed,
        scoreVisual,
      });
      const yearTotal = buildYearTotalProfileV199({
        user: promptUser,
        manse: myManse,
        fortuneSeed,
        baseProfile: yearBaseProfile,
      });
      profileText = `[올해운세 서버 계산값]
- 올해 총점: ${yearTotal.overallScore}점
- 재물운: ${yearTotal.moneyScore}점
- 직장운: ${yearTotal.careerScore}점
- 사업운: ${yearTotal.businessScore}점
- 연애운: ${yearTotal.loveScore}점
- 결혼운: ${yearTotal.marriageScore}점
- 인간관계운: ${yearTotal.relationshipScore}점
- 건강운: ${yearTotal.healthScore}점
- 올해 가장 강한 운: ${yearTotal.strongestArea}
- 올해 가장 약한 운: ${yearTotal.weakestArea}
- 올해 최고 달: ${yearTotal.bestMonth}
- 돈이 들어오는 달: ${yearTotal.moneyMonth}
- 돈이 새기 쉬운 달: ${yearTotal.moneyLeakMonth}
- 일이 가장 크게 움직이는 달: ${yearTotal.careerMonth}
- 인연이 강하게 움직이는 달: ${yearTotal.relationshipMonth}
- 사람 관계 주의 달: ${yearTotal.relationshipWarningMonth}
- 몸과 생활 주의 달: ${yearTotal.healthWarningMonth}
- 올해 반드시 잡아야 할 것: ${yearTotal.action}
- 올해 반드시 버려야 할 것: ${yearTotal.avoid}`;
      fixedConclusionText = `[올해운세 계산 고정값]
${profileText}

위 점수와 월은 무료와 유료가 공유하는 서버 계산값이다. AI는 숫자·월·강약 순위를 바꾸거나 새로 만들지 않는다.`;
    }

    const wealthProfile =
      categoryId === "money" || categoryTitle.includes("재물")
        ? buildWealthProfile(promptUser, myManse)
        : null;
    let categoryPreviewProfile = buildCategoryPreviewProfile({
      categoryId,
      categoryTitle,
      user: promptUser,
      manse: myManse,
      partnerManse,
      fortuneSeed,
      scoreVisual,
    });
    if (isMonthlyCategory(categoryId, categoryTitle) && categoryPreviewProfile?.kind === "year") {
      const yearTotalForClient = buildYearTotalProfileV199({ user: promptUser, manse: myManse, fortuneSeed, baseProfile: categoryPreviewProfile });
      categoryPreviewProfile = { ...categoryPreviewProfile, ...yearTotalForClient } as any;
    }
    const categoryPreviewProfileBlock = buildCategoryPreviewProfilePromptBlock(categoryPreviewProfile);

    console.log("SOREUM_BIRTH_CONVERSION_DEBUG", {
      originalUser: {
        year: user.year,
        month: user.month,
        day: user.day,
        calendar: user.calendar,
        lunarLeapMonth: user.lunarLeapMonth === true,
      },
      userForManse: {
        year: userForManse.year,
        month: userForManse.month,
        day: userForManse.day,
        calendar: userForManse.calendar,
        lunarLeapMonth: userForManse.lunarLeapMonth === true,
      },
      birthConversion: userBirthConversion,
    });

    console.log("SOREUM_MANSE_DEBUG", {
      dayMaster:
        (myManse as any)?.dayMaster?.label ||
        (myManse as any)?.dayMaster ||
        (myManse as any)?.ilgan,
      year: userForManse.year,
      month: userForManse.month,
      day: userForManse.day,
      calendar: userForManse.calendar,
    });

    const manseText = `
[전체 고정 운세 기준]
- 재물운 등급: ${globalMoneyGrade}
- 건강운 등급: ${globalHealthGrade}
- 일·사업 성향: ${globalCareer.combined}
- 결과 고정용 seed: ${fortuneSeed}
- 이 기준은 모든 카테고리에서 동일하게 유지한다.
- 재물운, 올해운세, 평생종합사주, 내 고민 상담에서 재물운·건강운·직업성향을 말할 때 이 값을 절대 바꾸지 마라.

${categoryPreviewProfileBlock}

${birthConversionText}

[본인 만세력]
${myManseText}

${careerBlock}

[상대방 만세력]
${partnerManseText}

`;

    // 건강운 유료 AI에는 무료 웹툰/healthStory/고정 healthPaidReport 문장을 넘기지 않는다.
    // 만세력 원문과 계산 사실만 전달한다.
    const healthFullManseText = `
[건강운 유료용 전체 고정 기준]
- 건강운 등급: ${globalHealthGrade}
- 결과 고정용 seed: ${fortuneSeed}
- 아래 만세력 원문과 계산 사실을 근거로 새 건강운을 작성한다.
- 무료 결과 문장이나 카테고리 미리보기 문장을 참고하지 않는다.

${birthConversionText}

[본인 만세력]
${myManseText}

[본인 만세력 구조 원자료]
${JSON.stringify(myManse).slice(0, 12000)}
`;

    const makeComicChapters = (resultText: string, comicMode: ComicMode) =>
      buildComicChapters({
        mode: comicMode,
        user: promptUser,
        categoryId,
        categoryTitle,
        resultText,
        manse: myManse,
        partnerManse,
        fortuneSeed,
      });


    if (isWorryCategoryV112(categoryId, categoryTitle)) {
      const worryPayload = getStructuredWorryPayloadV149(body as any, promptUser as any);
      const structuredWorryQuestion = buildStructuredWorryQuestionV149(worryPayload);
      const cleanWorryUser = {
        ...(promptUser as any),
        question: structuredWorryQuestion || promptUser.question || question || "",
        worryType: worryPayload.worryType || "",
        worrySituation: worryPayload.situation || "",
        currentRegion: worryPayload.currentRegion || "",
        candidateRegions: worryPayload.candidateRegions || "",
        worryReason: worryPayload.reason || "",
        currentWork: worryPayload.currentWork || "",
        moneySituation: worryPayload.moneySituation || "",
        relationshipInfo: worryPayload.relationshipInfo || "",
        healthConcern: worryPayload.healthConcern || "",
        desiredVerdict: worryPayload.desiredVerdict || "",
      };

      if (mode === "preview") {
        const ready = isStructuredWorryReadyV149(worryPayload);
        const intakePreview = ready
          ? `[도훈의 무료 접수]
${safeText(promptUser.name, "너")}, 접수는 됐다.

${structuredWorryQuestion}

| 이 정도면 유료 상담에서 바로 판정 가능하다. 결제 후에는 이 접수지 안의 고민 하나만 보고 답을 자른다.`
          : `[도훈의 무료 접수]
${safeText(promptUser.name, "너")}, 아직 상담 정보가 부족하다.

${structuredWorryQuestion || "질문을 먼저 적어라."}

| 유료로 넘어가기 전에 고민 유형, 현재 상황, 선택지, 고민 이유, 원하는 판정을 먼저 채워라.`;

        return NextResponse.json(
          responsePayload({
            preview: intakePreview,
            full: "",
            result: intakePreview,
            intakePreview,
            manse: myManse,
            partnerManse,
            fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
            profileText: "",
            fortuneSeed,
            birthConversion,

            scoreVisual,
            wealthProfile,
        categoryPreviewProfile,
            repeatGhostProfile,
            pastLifeProfile,
            comicChapters: [],
            requiresWorryIntake: !ready,
            blockPaidWorryReport: !ready,
            premiumOneQuestionOnly: true,
          } as any),
        );
      }

      if (!isStructuredWorryReadyV149(worryPayload)) {
        return NextResponse.json(
          responsePayload({
            preview: "",
            full: "",
            result: "",
            intakePreview: `[도훈의 무료 접수]
${safeText(promptUser.name, "너")}, 유료 상담 전에 접수 정보가 부족하다.

${structuredWorryQuestion || "질문을 먼저 적어라."}`,
            manse: myManse,
            partnerManse,
            fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
            profileText: "",
            fortuneSeed,
            birthConversion,

            scoreVisual,
            wealthProfile,
        categoryPreviewProfile,
            repeatGhostProfile,
            pastLifeProfile,
            comicChapters: [],
            requiresWorryIntake: true,
            blockPaidWorryReport: true,
            errorCode: "WORRY_INTAKE_REQUIRED",
            premiumOneQuestionOnly: true,
          } as any),
        );
      }

      let worryApiUsed = false;
      let worryRepairUsed = false;

      if (!process.env.OPENAI_API_KEY) {
        const guaranteedWorry = buildGuaranteedWorryReportV168({
          user: cleanWorryUser,
          payload: worryPayload,
          manseText,
          fixedConclusionText,
          reason: "OPENAI_KEY_MISSING",
        });
        return NextResponse.json(
          responsePayload({
            preview: "",
            full: guaranteedWorry,
            result: guaranteedWorry,
            manse: myManse,
            partnerManse,
            fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
            profileText: makeInternalReferenceText(profileText),
            fortuneSeed,
            birthConversion,

            scoreVisual,
            wealthProfile,
        categoryPreviewProfile,
            repeatGhostProfile,
            pastLifeProfile,
            comicChapters: [],
            worryApiUsed: false,
            worryRepairUsed: true,
            worryQualityWarnings: ["OPENAI_KEY_MISSING", "WORRY_V168_GUARANTEED_REPORT"],
            worryModel: WORRY_MODEL,
            worryQuestion: structuredWorryQuestion,
            premiumOneQuestionOnly: true,
          } as any),
        );
      }

      let worryFull = "";
      let worryQualityWarnings: string[] = [];
      try {
        const generatedWorry = await generatePremiumWorryReportV168({
          user: cleanWorryUser,
          payload: worryPayload,
          manseText,
          fixedConclusionText,
          seed: fortuneSeed,
        });
        worryFull = generatedWorry.full;
        worryApiUsed = true;
        worryRepairUsed = generatedWorry.repaired;
        worryQualityWarnings = (generatedWorry as any).qualityWarnings || [];
      } catch (error: any) {
        console.error("worry multipart generation error recovered by v168:", error);
        worryFull = buildGuaranteedWorryReportV168({
          user: cleanWorryUser,
          payload: worryPayload,
          manseText,
          fixedConclusionText,
          reason: String(error?.message || error || "UNKNOWN"),
        });
        worryApiUsed = false;
        worryRepairUsed = true;
        worryQualityWarnings = [
          "WORRY_MULTIPART_GENERATION_RECOVERED",
          String(error?.message || error || "UNKNOWN").slice(0, 200),
          "WORRY_V168_GUARANTEED_REPORT",
        ];
      }

      return NextResponse.json(
        responsePayload({
          preview: "",
          full: worryFull,
          result: worryFull,
          manse: myManse,
          partnerManse,
          fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
          profileText: makeInternalReferenceText(profileText),
          fortuneSeed,
          birthConversion,

          scoreVisual,
          wealthProfile,
        categoryPreviewProfile,
          repeatGhostProfile,
          pastLifeProfile,
          comicChapters: [],
          worryApiUsed,
          worryRepairUsed,
          worryQualityWarnings,
          worryModel: WORRY_MODEL,
          worryQuestion: structuredWorryQuestion,
          premiumOneQuestionOnly: true,
        } as any),
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      const safePreview = finalizePreviewText({ raw: fallbackPreview(categoryId, categoryTitle, promptUser, myManse, partnerManse), categoryId, categoryTitle, user: promptUser, manse: myManse, partnerManse });
      const safeFullRaw = categoryId === "health" ? buildV85HealthFullReport(promptUser, myManse) : fallbackFull(categoryId, categoryTitle, promptUser, myManse, partnerManse, fortuneSeed);
      const safeFull = finalizeFullText({ raw: safeFullRaw, categoryId, categoryTitle, user: promptUser, manse: myManse, partnerManse });
      return NextResponse.json(responsePayload({
        preview: mode === "full" ? "" : safePreview, full: mode === "preview" ? "" : safeFull, result: mode === "preview" ? safePreview : safeFull,
        manse: myManse, partnerManse, fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText), profileText, fortuneSeed, birthConversion,
        scoreVisual, wealthProfile, categoryPreviewProfile, repeatGhostProfile, pastLifeProfile,
        comicChapters: makeComicChapters(mode === "preview" ? safePreview : safeFull, mode === "preview" ? "preview" : "full"),
      }));
    }

    if (mode === "preview") {
      let preview = "";
      try {
        preview =
        categoryId === "health"
          ? await generateText(
              buildPreviewPrompt({
                user: promptUser,
                categoryId,
                categoryTitle,
                question,
                manseText,
                fixedConclusionText,
                profileText,
                manse: myManse,
              }),
              getPreviewMaxTokens(categoryId),
              fortuneSeed,
            )
          : await generateStablePreviewV1943({
              user: promptUser,
              categoryId,
              categoryTitle,
              question,
              manseText,
              fixedConclusionText,
              profileText,
              manse: myManse,
              fortuneSeed,
            });
      } catch (error) {
        console.error("preview generation error:", error);
        preview = fallbackPreview(
          categoryId,
          categoryTitle,
          promptUser,
          myManse,
          partnerManse,
        );
      }

      const finalPreview =
        preview ||
        fallbackPreview(
          categoryId,
          categoryTitle,
          promptUser,
          myManse,
          partnerManse,
        );

      return NextResponse.json(
        responsePayload({
          preview: finalizePreviewText({ raw: finalPreview, categoryId, categoryTitle, user: promptUser, manse: myManse, partnerManse }),
          full: "",
          result: finalizePreviewText({ raw: finalPreview, categoryId, categoryTitle, user: promptUser, manse: myManse, partnerManse }),
          manse: myManse,
          partnerManse,
          fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
          profileText: makeInternalReferenceText(profileText),
          fortuneSeed,
          birthConversion,

          scoreVisual,
          wealthProfile,
        categoryPreviewProfile,
          repeatGhostProfile,
          pastLifeProfile,
          comicChapters: makeComicChapters(
            finalizePreviewText({ raw: finalPreview, categoryId, categoryTitle, user: promptUser, manse: myManse, partnerManse }),
            "preview",
          ),
        }),
      );
    }

    if (mode === "full") {
      let full = "";
      try {
        if (categoryId === "health") {
          full = await generateHealthPaidMultipartV188({
            user: promptUser,
            manse: myManse,
            manseText: healthFullManseText,
            fortuneSeed,
          });
        } else {
          full = await generateCategoryPaidMultipartV205({
            user: promptUser, categoryId, categoryTitle, question, manseText,
            fixedConclusionText, profileText, manse: myManse, fortuneSeed,
          });
        }
      } catch (error) {
        console.error("full generation error; recovering with calculated report:", error);
        if (categoryId === "love") {
          console.error("SOREUM_LOVE_PAID_FALLBACK_V216", {
            reason: String((error as any)?.message || error || ""),
          });
        }
        full = categoryId === "health" ? buildV85HealthFullReport(promptUser, myManse) : fallbackFull(categoryId, categoryTitle, promptUser, myManse, partnerManse, fortuneSeed);
      }

      const finalFull = full;

      const finalizedFullRaw = finalizeFullText({
        raw: finalFull,
        categoryId,
        categoryTitle,
        user: promptUser,
        manse: myManse,
        partnerManse,
      });
      const finalizedFull =
        categoryId === "today"
          ? finalizeTodayPaidSingleReportV213(
              normalizeTodayPaidSectionHeadingsV215(finalizedFullRaw),
            )
          : finalizedFullRaw;

      const fullCategoryPreviewProfile =
        categoryPreviewProfile?.kind === "health"
          ? buildAIHealthPaidReportV188({
              profile: categoryPreviewProfile,
              fullText: finalizedFull,
              user: promptUser,
              manse: myManse,
              fortuneSeed,
            })
          : categoryPreviewProfile;

      console.log("SOREUM_PAID_REPORT_DEBUG", {
        categoryId,
        mode,
        source:
          fullCategoryPreviewProfile?.kind === "health"
            ? fullCategoryPreviewProfile.healthPaidReportSource
            : null,
        aiFullLength: finalizedFull.length,
        targetLengthMet:
          categoryId === "health" ? finalizedFull.length >= 4500 && finalizedFull.length <= 7500 : null,
        user: {
          year: promptUser.year,
          month: promptUser.month,
          day: promptUser.day,
        },
      });

      return NextResponse.json(
        responsePayload({
          preview: "",
          full: finalizedFull,
          result: finalizedFull,
          manse: myManse,
          partnerManse,
          fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
          profileText: makeInternalReferenceText(profileText),
          fortuneSeed,
          birthConversion,

          scoreVisual,
          wealthProfile,
        categoryPreviewProfile: fullCategoryPreviewProfile,
          repeatGhostProfile,
          pastLifeProfile,
          comicChapters: makeComicChapters(finalizedFull, "full"),
        }),
      );
    }

    let preview = "";
    let full = "";

    try {
      preview =
        categoryId === "health"
          ? await generateText(
              buildPreviewPrompt({
                user: promptUser,
                categoryId,
                categoryTitle,
                question,
                manseText,
                fixedConclusionText,
                profileText,
                manse: myManse,
              }),
              getPreviewMaxTokens(categoryId),
              fortuneSeed,
            )
          : await generateStablePreviewV1943({
              user: promptUser,
              categoryId,
              categoryTitle,
              question,
              manseText,
              fixedConclusionText,
              profileText,
              manse: myManse,
              fortuneSeed,
            });
    } catch (error) {
      console.error("full generation error; recovering with calculated report:", error);
      full = categoryId === "health" ? buildV85HealthFullReport(promptUser, myManse) : fallbackFull(categoryId, categoryTitle, promptUser, myManse, partnerManse, fortuneSeed);
    }

    const finalPreview =
      preview ||
      fallbackPreview(
        categoryId,
        categoryTitle,
        promptUser,
        myManse,
        partnerManse,
      );
    const finalFull = full;

    const finalizedFullForBothRaw = finalizeFullText({
      raw: finalFull,
      categoryId,
      categoryTitle,
      user: promptUser,
      manse: myManse,
      partnerManse,
    });
    const finalizedFullForBoth =
      categoryId === "today"
        ? finalizeTodayPaidSingleReportV213(
            normalizeTodayPaidSectionHeadingsV215(finalizedFullForBothRaw),
          )
        : finalizedFullForBothRaw;

    const bothCategoryPreviewProfile =
      categoryPreviewProfile?.kind === "health"
        ? buildAIHealthPaidReportV188({
            profile: categoryPreviewProfile,
            fullText: finalizedFullForBoth,
            user: promptUser,
            manse: myManse,
            fortuneSeed,
          })
        : categoryPreviewProfile;

    return NextResponse.json(
      responsePayload({
        preview: finalizePreviewText({ raw: finalPreview, categoryId, categoryTitle, user: promptUser, manse: myManse, partnerManse }),
        full: finalizedFullForBoth,
        result: finalizedFullForBoth,
        manse: myManse,
        partnerManse,
        fixedConclusion: getPublicFixedConclusionText(rawFixedConclusionText),
        profileText,
        fortuneSeed,
        birthConversion,

        scoreVisual,
        wealthProfile,
        categoryPreviewProfile: bothCategoryPreviewProfile,
        repeatGhostProfile,
        pastLifeProfile,
        comicChapters: makeComicChapters(finalizedFullForBoth, "full"),
      }),
    );
  } catch (error) {
    console.error("fortune route error:", error);

    return NextResponse.json(
      responsePayload({
        preview: `[결론부터 말하면]

지금 운세 생성 중 문제가 생겼어.

[왜 그렇게 보냐면]

서버에서 만세력 또는 AI 응답을 처리하는 중 오류가 난 상태야.

[이 운에서 조심할 부분]

코드 오류가 있는 상태에서 계속 확인하면 결과가 흔들릴 수 있어.

[전체 리포트에서 이어지는 핵심]

터미널 에러 메시지를 확인해서 route.ts와 manse.ts 연결을 먼저 잡아야 해.`,
        full: "",
        result: "",
      }),
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "soreum saju fortune route is working",
    model: MODEL,
    routeVersion: ROUTE_VERSION,
    relationshipLogic: RELATIONSHIP_LOGIC,
    yearlyLogic: YEARLY_LOGIC,
    worryLogic: "v118-worry-paid-openai-call-restored",
    premiumLogic: PREMIUM_QUESTION_LOGIC,
    childrenLogic: CHILDREN_LOGIC,
    deterministicLogic: DETERMINISTIC_LOGIC,
    moneyUniqueLogic: MONEY_UNIQUE_LOGIC,
    profileLogic: PROFILE_LOGIC,
    previewLogic: PREVIEW_LOGIC,
    ghostSajuLogic: "ghost-metaphor-no-fear-story-layer-v1",
    todayFourCardLogic: "v83-today-date-status-timeflow-weekend-aware",
    comicTheaterLogic: "v84-compatibility-full-pages-direct-report",
    careerDetailedLogic: "v84-direct-full-render-money-career-compatibility",
    relationshipScoreVisualLogic: RELATIONSHIP_LOGIC,
    freeWebtoonContentLogic: "v188-health-preview-no-paid-fallback-parallel-paid-ai",
  });
}
