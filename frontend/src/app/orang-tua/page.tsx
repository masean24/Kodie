import type { Metadata } from "next";
import { DashboardSementara } from "@/components/area/dashboard-sementara";

export const metadata: Metadata = { title: "Dashboard orang tua" };

export default function DashboardOrangTua() {
  return <DashboardSementara />;
}
