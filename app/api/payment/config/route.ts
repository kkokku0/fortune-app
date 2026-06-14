import { NextResponse } from "next/server";

export async function GET() {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  return NextResponse.json({
    storeId: storeId || "",
    channelKey: channelKey || "",
    hasStoreId: Boolean(storeId),
    hasChannelKey: Boolean(channelKey),
  });
}