import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "감정 일기",
  description: "오늘의 감정을 기록하고, 어울리는 이미지와 음악을 만들어보세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#FAF8F5] text-stone-800 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
