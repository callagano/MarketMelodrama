import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fear and Greed index",
  description: "Market sentiment analysis based on multiple indicators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} antialiased h-full bg-slate-900`}>
        {children}
      </body>
    </html>
  );
}
