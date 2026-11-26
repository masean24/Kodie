import type { Metadata } from "next";
import { ambilProfilLengkapPengajar } from "@/lib/api/mengajar";
import { FormProfilPengajar } from "@/components/mengajar/form-profil";

export const metadata: Metadata = { title: "Profil pengajar" };

export default async function HalamanProfilPengajar() {
  const data = await ambilProfilLengkapPengajar();
  return (
    <div className="flex max-w-[820px] flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">
          Profil dan dokumen pengajar
        </h1>
        <p className="mt-2 text-text-muted">
          Lengkapi data diri, unggah kartu identitas dan SKCK, lalu pilih program yang ingin Anda ajar.
        </p>
      </div>
      <FormProfilPengajar {...data} />
    </div>
  );
}
