import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Restaurant OS - نظام إدارة المطاعم والمقاهي",
    short_name: "Restaurant OS",
    description: "المنيو الرقمي والطلب وخدمة الطاولة المباشرة وكاشير العمليات.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5EF",
    theme_color: "#172026",
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
