import { CustomerApp } from "../components/customer-app";
import {
  officialBranch,
  officialMapUrl,
  officialMenuUrl,
  officialSocial,
} from "../lib/restaurant";

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["Restaurant", "CafeOrCoffeeShop"],
  name: officialBranch.nameAr,
  alternateName: officialBranch.nameEn,
  image: "/hail-logo.png",
  telephone: officialBranch.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: officialBranch.addressAr,
    addressLocality: "إربد",
    addressCountry: "JO",
  },
  hasMap: officialMapUrl,
  hasMenu: officialMenuUrl,
  priceRange: "JOD 0.60-13.90",
  currenciesAccepted: "JOD",
  sameAs: [
    officialSocial.instagram,
    officialSocial.facebook,
    officialSocial.linktree,
  ],
  openingHoursSpecification: officialBranch.hours.map((entry) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${entry.dayEn}`,
    opens: entry.opens,
    closes: entry.closes,
  })),
  servesCuisine: "Restaurant and cafe menu",
  /* الحجز متاح عبر نطاق "احجز طاولتك" في الصفحة الرئيسية،
     ويُؤكَّد بمحادثة واتساب مع الفرع. */
  acceptsReservations: true,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CustomerApp />
    </>
  );
}
