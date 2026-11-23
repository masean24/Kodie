import type { Metadata } from "next";
import { DashboardSementara } from "@/components/area/dashboard-sementara";

export const metadata: Metadata = { title: "Dashboard admin" };

export default function DashboardAdmin() {
  return <DashboardSementara />;
}
