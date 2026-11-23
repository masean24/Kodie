import { LayoutArea } from "@/components/area/layout-area";

export default function LayoutMengajar({ children }: { children: React.ReactNode }) {
  return <LayoutArea peran="pengajar">{children}</LayoutArea>;
}
