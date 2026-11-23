import { LayoutArea } from "@/components/area/layout-area";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <LayoutArea peran="admin">{children}</LayoutArea>;
}
