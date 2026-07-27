import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { OpsApp } from "../../components/ops-app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "شاشة المطبخ KDS",
  robots: { index: false, follow: false },
};

export default async function KdsPage() {
  await requireChatGPTUser("/kds");
  return <OpsApp initialMode="kds" />;
}
