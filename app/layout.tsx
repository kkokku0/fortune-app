import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "소름사주",
  description: "AI 사주 운세 리포트",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html lang="ko">
      <body>
        {children}

        <Script
          src={
            isProd
              ? "https://spay.kcp.co.kr/plugin/kcp_spay_hub.js"
              : "https://testspay.kcp.co.kr/plugin/kcp_spay_hub.js"
          }
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}