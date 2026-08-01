export const officialMapUrl =
  "https://maps.google.com";

export const officialMenuUrl = "/hail-cafe-menu-official.pdf";

export const officialBranch = {
  id: "main-branch",
  nameAr: "مقهى ومطعم النخبة",
  nameEn: "Gourmet Cafe & Restaurant",
  addressAr: "الفرع الرئيسي - شارع الفخامة، العاصمة",
  addressEn: "Main Branch - Luxury Street, City Center",
  phone: "+962790000000",
  phoneDisplay: "+962 7 9000 0000",
  mapUrl: officialMapUrl,
  plusCode: "CITY-CENTER-DEMO",
  hours: [
    { dayAr: "الأحد", dayEn: "Sunday", opens: "10:00", closes: "24:00" },
    { dayAr: "الاثنين", dayEn: "Monday", opens: "10:00", closes: "24:00" },
    { dayAr: "الثلاثاء", dayEn: "Tuesday", opens: "10:00", closes: "24:00" },
    { dayAr: "الأربعاء", dayEn: "Wednesday", opens: "10:00", closes: "24:00" },
    { dayAr: "الخميس", dayEn: "Thursday", opens: "10:00", closes: "24:00" },
    { dayAr: "الجمعة", dayEn: "Friday", opens: "14:00", closes: "24:00" },
    { dayAr: "السبت", dayEn: "Saturday", opens: "10:00", closes: "24:00" },
  ],
} as const;

export const officialSocial = {
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
  linktree: "https://linktr.ee",
} as const;

export const serviceRequestTypes = [
  "staff",
  "water",
  "cutlery",
  "cleaning",
  "bill",
] as const;

export type ServiceRequestType = (typeof serviceRequestTypes)[number];

export const orderStatuses = [
  "new",
  "preparing",
  "ready",
  "served",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const serviceStatuses = [
  "new",
  "acknowledged",
  "on_way",
  "completed",
  "cancelled",
] as const;

export type ServiceStatus = (typeof serviceStatuses)[number];

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function createPublicOrderId() {
  return `H${Date.now().toString(36).slice(-5).toUpperCase()}${crypto
    .randomUUID()
    .slice(0, 3)
    .toUpperCase()}`;
}

export function cleanText(value: unknown, max = 240) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";
}

export function validTableNumber(value: unknown) {
  const table = Number(value);
  return Number.isInteger(table) && table >= 1 && table <= 80 ? table : null;
}

export function taxFor(subtotalMils: number) {
  return Math.round(subtotalMils * 0.07);
}
