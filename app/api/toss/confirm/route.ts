export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return Response.json({ message: "TOSS_SECRET_KEY가 없습니다." }, { status: 500 });
    }

    const encryptedSecretKey =
      "Basic " + Buffer.from(secretKey + ":").toString("base64");

    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ message: "결제 승인 중 오류가 발생했습니다." }, { status: 500 });
  }
}