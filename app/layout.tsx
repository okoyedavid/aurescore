import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./QueryProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AureScore | Academic Result Management",
  description:
    "Secure result management, GPA computation, and approval workflows for higher education institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetBrainsMono.variable}`}>
      <body className="font-body antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
