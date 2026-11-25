import type { Metadata } from "next";
import { Kontainer } from "@/components/ui/dasar";
import { LabKlien } from "@/components/lab/lab-klien";
import { GulirKeLab } from "@/components/lab/gulir-ke-lab";
import { BandKodie, LencanaBand, SorotanBand } from "@/components/situs/judul-halaman";
import { KataHero } from "@/components/situs/reveal-hero";

export const metadata: Metadata = {
  title: "Kodie Lab",
  alternates: { canonical: "/lab" },
  description: "Coding playground Kodie: susun blok, gambar dengan Python Turtle, atau tulis HTML, CSS, JavaScript, dan Python, lalu jalankan langsung di browser tanpa install aplikasi.",
};

export default function HalamanLab() {
  return (
    <>
      <BandKodie>
        <Kontainer className="relative pb-10 pt-6 md:pb-12 md:pt-8">
          <LencanaBand>Gratis · Tanpa akun · Tanpa install</LencanaBand>
          <h1 className="mt-4 text-[30px] leading-[40px] font-extrabold tracking-tight sm:text-[38px] sm:leading-[48px] md:text-[46px] md:leading-[58px]">
            <KataHero teks="Kodie" /> <SorotanBand>Lab</SorotanBand>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#dbeafe] md:text-lg">
            <KataHero teks="Pilih mode, susun blok atau tulis kodenya, lalu klik Jalankan. Hasilnya langsung terlihat di sebelah editor." />
          </p>
        </Kontainer>
      </BandKodie>
      {/* scroll-mt setinggi header (72 px) agar ruang kerja tidak tertutup header saat digulir otomatis. */}
      <Kontainer id="ruang-lab" className="scroll-mt-[72px] py-8 md:py-10">
        <LabKlien />
      </Kontainer>
      <GulirKeLab idTarget="ruang-lab" />
    </>
  );
}
