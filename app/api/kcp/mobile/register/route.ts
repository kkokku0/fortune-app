import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function onlyNumber(value: unknown) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getMobileGoodName(value: unknown) {
  // KCP 모바일 결제창에서 한글 상품명이 ?????로 표시되는 문제를 막기 위해
  // 모바일 거래등록 상품명은 page.tsx에서 넘긴 카테고리별 영문명을 우선 사용합니다.
  const raw = safeText(value);

  // 한글/특수 인코딩 깨짐 방지를 위해 ASCII 영문 상품명만 허용합니다.
  if (raw && /^[\x20-\x7E]+$/.test(raw)) {
    return raw.slice(0, 80);
  }

  return "SoreumSaju Fortune Report";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const siteCd = safeText(process.env.KCP_SITE_CD || process.env.NEXT_PUBLIC_KCP_SITE_CD);
    const orderId = safeText(body.orderId);
    const orderName = getMobileGoodName(body.orderName);
    const amount = onlyNumber(body.amount);
    const buyerName = safeText(body.buyerName, "고객");
    const buyerTel = onlyNumber(body.buyerTel) || "01000000000";
    const retUrl =
      safeText(body.retUrl) ||
      `${safeText(process.env.NEXT_PUBLIC_APP_URL, "https://soreumsaju.com")}/api/kcp/approve`;

    if (!siteCd) {
      return NextResponse.json(
        { error: "KCP_SITE_CD가 없습니다. Vercel 환경변수를 확인하세요." },
        { status: 500 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "주문번호(orderId)가 없습니다." },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "결제금액(amount)이 없습니다." },
        { status: 400 }
      );
    }

    const kcpResponse = await fetch("https://smpay.kcp.co.kr/trade/register.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        site_cd: siteCd,
        ordr_idxx: orderId,
        good_mny: amount,
        good_name: orderName,
        pay_method: "CARD",
        Ret_URL: retUrl,
        escw_used: "N",
        user_agent: req.headers.get("user-agent") || "",
        buyr_name: buyerName,
        buyr_tel2: buyerTel,
      }),
    });

    const rawText = await kcpResponse.text();

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error: "KCP 거래등록 응답이 JSON이 아닙니다.",
          status: kcpResponse.status,
          raw: rawText.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    if (!kcpResponse.ok || data?.Code !== "0000") {
      return NextResponse.json(
        {
          error: "KCP 모바일 거래등록 실패",
          code: data?.Code,
          message: data?.Message || "KCP 거래등록에 실패했습니다.",
          raw: data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      Code: data.Code,
      Message: data.Message,
      approvalKey: data.approvalKey,
      PayUrl: data.PayUrl,
      traceNo: data.traceNo,
      paymentMethod: data.paymentMethod,
    });
  } catch (error) {
    console.error("KCP mobile register error:", error);

    return NextResponse.json(
      {
        error: "KCP 모바일 거래등록 중 서버 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
