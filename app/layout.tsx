import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Festival Growth Center | Mumbai 2026",
  description:
    "Analytics dashboard, campaign management tool, and embedded Gemini AI Growth Analyst for Challenge A: Attendee Growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
