import { NextRequest, NextResponse } from "next/server";

type CompletePaymentBody = {
  paymentId?: string;
  orderName?: string;
  amount?: number;
  categoryId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const apiSecret = process.env.PORTONE_API_SECRET;

    if (!apiSecret) {
      return NextResponse.json(
        { ok: false, message: "PORTONE_API_SECRET 환경변수가 없습니다." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CompletePaymentBody;
    const paymentId = body.paymentId;
    const expectedAmount = Number(body.amount || 0);

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, message: "paymentId가 없습니다." },
        { status: 400 }
      );
    }

    if (!expectedAmount || expectedAmount <= 0) {
      return NextResponse.json(
        { ok: false, message: "검증할 결제 금액이 없습니다." },
        { status: 400 }
      );
    }

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const paymentText = await paymentResponse.text();

    let payment: any = null;

    try {
      payment = JSON.parse(paymentText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: "포트원 결제조회 응답을 해석하지 못했습니다.",
          raw: paymentText.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    if (!paymentResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            payment?.message ||
            payment?.error ||
            "포트원 결제조회에 실패했습니다.",
          payment,
        },
        { status: paymentResponse.status }
      );
    }

    const status = payment?.status;
    const paidAmount =
      Number(payment?.amount?.total || 0) ||
      Number(payment?.paidAmount || 0) ||
      Number(payment?.totalAmount || 0);

    if (status !== "PAID") {
      return NextResponse.json(
        {
          ok: false,
          message: `결제 완료 상태가 아닙니다. 현재 상태: ${status || "알 수 없음"}`,
          status,
          payment,
        },
        { status: 400 }
      );
    }

    if (paidAmount !== expectedAmount) {
      return NextResponse.json(
        {
          ok: false,
          message: `결제 금액이 맞지 않습니다. 요청금액: ${expectedAmount}, 실제금액: ${paidAmount}`,
          expectedAmount,
          paidAmount,
          payment,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "결제 검증 완료",
      paymentId,
      status,
      paidAmount,
      orderName: body.orderName || payment?.orderName || "",
      categoryId: body.categoryId || "",
    });
  } catch (error) {
    console.error("PORTONE COMPLETE ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "결제 검증 중 알 수 없는 오류가 발생했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}