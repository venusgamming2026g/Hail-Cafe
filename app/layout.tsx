import type { Metadata, Viewport } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const displayFont = Alexandria({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const bodyFont = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "نظام إدارة المطاعم والمقاهي | المنيو والطلب الرقمي",
      template: "%s | Restaurant OS",
    },
    description:
      "المنظومة الرقمية الشاملة لإدارة المطاعم والمقاهي: منيو QR ذكي، طلب طاولة، كاشير، شاشة مطبخ (KDS)، وإدارة الصالة.",
    applicationName: "Restaurant OS",
    keywords: [
      "نظام مطاعم",
      "Restaurant OS",
      "منيو رقمي",
      "كاشير مطاعم",
      "نظام كافيهات",
      "طلب طاولة",
    ],
    alternates: { canonical: `${origin}/` },
    icons: {
      icon: "/hail-logo.png",
      apple: "/hail-logo.png",
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      url: origin,
      locale: "ar_JO",
      alternateLocale: "en_US",
      title: "نظام إدارة المطاعم والمقاهي | المنظومة الذكية",
      description:
        "منيو رقمي وطلب سفري وطلب طاولة وخدمة كاشير ومطبخ متكاملة.",
      siteName: "Restaurant OS",
      images: [{ url: socialImage, width: 1732, height: 909, alt: "Restaurant OS" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "نظام إدارة المطاعم والمقاهي | المنظومة الذكية",
      description: "المنيو الرسمي وطلبات الطاولة والسفري والعمليات.",
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#172026",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
