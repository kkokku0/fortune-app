import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("payment", "fail");
  url.searchParams.set(
    "message",
    "KCP 결제 결과가 GET으로 들어왔습니다. 결제를 다시 시도해 주세요."
  );
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const resCd = String(formData.get("res_cd") || "");
  const resMsg = String(formData.get("res_msg") || "");
  const tranCd = String(formData.get("tran_cd") || "");
  const encData = String(formData.get("enc_data") || "");
  const encInfo = String(formData.get("enc_info") || "");
  const orderId = String(formData.get("ordr_idxx") || "");
  const goodMny = String(formData.get("good_mny") || "");

  console.log("KCP RETURN:", {
    resCd,
    resMsg,
    tranCd,
    orderId,
    goodMny,
    hasEncData: Boolean(encData),
    hasEncInfo: Boolean(encInfo),
  });

  const url = req.nextUrl.clone();
  url.pathname = "/";

  if (resCd && resCd !== "0000") {
    url.searchParams.set("payment", "fail");
    url.searchParams.set(
      "message",
      resMsg || "KCP 결제가 취소되었거나 실패했습니다."
    );
    return NextResponse.redirect(url);
  }

  url.searchParams.set("payment", "success");
  if (orderId) url.searchParams.set("orderId", orderId);

  return NextResponse.redirect(url);
}