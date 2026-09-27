import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-numeric",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Game Night",
  description: "L'app della serata: iscrizioni, tabellone e regia.",
};

export const viewport: Viewport = {
  themeColor: "#0a0512",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${fraunces.variable} ${bebasNeue.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
