import { Header } from "@/components/situs/header";
import { Footer } from "@/components/situs/footer";

export default function LayoutPublik({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
