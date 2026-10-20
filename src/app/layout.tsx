import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const body = Cormorant_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: SITE.name,
  description: "The menu at " + SITE.name + ".",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={body.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
