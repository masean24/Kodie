import type { Metadata } from "next";
import { Kontainer, Sorotan } from "@/components/ui/dasar";
import { LabKlien } from "@/components/lab/lab-klien";

export const metadata: Metadata = {
  title: "Kodie Lab",
  description: "Coding playground Kodie: tulis HTML, CSS, JavaScript, atau Python lalu jalankan langsung di browser tanpa install aplikasi.",
};

export default function HalamanLab() {
  return (
    <>
      <section className="blok-merek on-block rounded-b-[32px] md:rounded-b-block">
        <Kontainer className="py-10 md:py-12">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1 text-sm font-bold ring-1 ring-white/40">Gratis · Tanpa akun · Tanpa install</p>
          <h1 className="mt-4 text-[30px] leading-[40px] font-extrabold tracking-tight sm:text-[38px] sm:leading-[48px] md:text-[46px] md:leading-[58px]">
            Kodie <Sorotan diBlok>Lab</Sorotan>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 md:text-lg">
            Pilih bahasa, tulis kodenya, lalu klik Jalankan. Hasilnya langsung terlihat di sebelah editor.
          </p>
        </Kontainer>
      </section>
      <Kontainer className="py-8 md:py-10">
        <LabKlien />
      </Kontainer>
    </>
  );
}
