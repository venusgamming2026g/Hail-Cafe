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
      default: "هيل كافيه | المنيو والطلب وخدمة الطاولة",
      template: "%s | هيل كافيه",
    },
    description:
      "المنيو الرسمي لمطعم وكافيه هيل في إربد سيتي سنتر، مع طلب سفري، طلب من الطاولة، متابعة التحضير، وخدمة طاولة مباشرة.",
    applicationName: "Hail Cafe",
    keywords: [
      "هيل كافيه",
      "Hail Cafe",
      "مطعم إربد",
      "كافيه إربد",
      "إربد سيتي سنتر",
      "منيو هيل",
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
      title: "هيل كافيه | من المطبخ للطاولة",
      description:
        "منيو رسمي وطلب سفري وطلب طاولة وخدمة مباشرة في إربد سيتي سنتر.",
      siteName: "Hail Cafe",
      images: [{ url: socialImage, width: 1732, height: 909, alt: "Hail Cafe" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "هيل كافيه | من المطبخ للطاولة",
      description: "المنيو الرسمي وطلبات الطاولة والسفري.",
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c0462a",
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
