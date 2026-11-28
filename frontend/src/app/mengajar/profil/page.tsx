import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ambilProfilLengkapPengajar } from "@/lib/api/mengajar";
import { ambilDetailProfilSaya } from "@/lib/api/pengajar-lanjutan";
import { fiturLanjutan } from "@/lib/api/sumber";
import { buatSlugDariNama } from "@/lib/validasi/pengajar-lanjutan";
import { FormProfilPengajar } from "@/components/mengajar/form-profil";
import { FormDetailProfil, KartuSlugProfil } from "@/components/mengajar/profil-publik";

export const metadata: Metadata = { title: "Profil pengajar" };

export default async function HalamanProfilPengajar() {
  const [data, detail] = await Promise.all([
    ambilProfilLengkapPengajar(),
    fiturLanjutan ? ambilDetailProfilSaya() : Promise.resolve(null),
  ]);
  const terverifikasi = data.pengguna.status === "terverifikasi";
  const pathProfil = `/pengajar/${data.profil?.slug || data.pengguna.id}`;
  return (
    <div className="flex max-w-[820px] flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">
          Profil dan dokumen pengajar
        </h1>
        <p className="mt-2 text-text-muted">
          Lengkapi data diri, unggah kartu identitas dan SKCK, lalu pilih program yang ingin Anda ajar.
        </p>
        {terverifikasi ? (
          <Link
            href={pathProfil}
            className="mt-3 inline-flex min-h-touch items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline"
          >
            Lihat profil publik saya <ExternalLink aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
      <FormProfilPengajar {...data} />
      {fiturLanjutan ? (
        <KartuSlugProfil
          awalSlug={data.profil?.slug ?? buatSlugDariNama(data.pengguna.nama)}
          pengajarId={data.pengguna.id}
          nama={data.pengguna.nama}
          terverifikasi={terverifikasi}
        />
      ) : null}
      {detail ? <FormDetailProfil awal={detail} /> : null}
    </div>
  );
}
