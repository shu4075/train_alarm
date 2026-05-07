import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrainAlarm | Chuo Line",
  description: "Sophisticated train alarm for your daily commute",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.className} antialiased bg-[#050505]`}>
        {children}
      </body>
    </html>
  );
}
