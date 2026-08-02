import type { Metadata } from "next";
import { CustomerApp } from "../../components/customer-app";

export const metadata: Metadata = {
  title: "المنيو والطلب",
  description:
    "منيو هيل كافيه الكامل مع طلب سفري أو طلب مباشر من الطاولة.",
};

export default function MenuPage() {
  return <CustomerApp />;
}
