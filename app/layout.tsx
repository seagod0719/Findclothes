import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FINDCLOTHES — Find your look",
  description: "사진 속 스타일을 발견하고 비슷한 쇼핑 상품을 찾아보세요.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
