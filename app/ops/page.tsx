import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { OpsApp } from "../../components/ops-app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة التشغيل",
  robots: { index: false, follow: false },
};

export default async function OpsPage() {
  await requireChatGPTUser("/ops");
  return <OpsApp initialMode="ops" />;
}
