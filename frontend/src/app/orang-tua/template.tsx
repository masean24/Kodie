import { TransisiHalaman } from "@/components/situs/transisi-halaman";

export default function Template({ children }: { children: React.ReactNode }) {
  return <TransisiHalaman diArea>{children}</TransisiHalaman>;
}
