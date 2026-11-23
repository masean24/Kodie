import { LayoutArea } from "@/components/area/layout-area";

export default function LayoutSiswa({ children }: { children: React.ReactNode }) {
  return <LayoutArea peran="siswa">{children}</LayoutArea>;
}
