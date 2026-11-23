import { KerangkaSitus } from "@/components/situs/kerangka-situs";

export default function LayoutPublik({ children }: { children: React.ReactNode }) {
  return <KerangkaSitus>{children}</KerangkaSitus>;
}
