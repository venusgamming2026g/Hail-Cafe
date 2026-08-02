import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hail Cafe - هيل كافيه",
    short_name: "Hail Cafe",
    description: "المنيو الرسمي والطلب وخدمة الطاولة في هيل كافيه.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF3E7",
    theme_color: "#C0462A",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/hail-logo.png",
        sizes: "955x955",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
