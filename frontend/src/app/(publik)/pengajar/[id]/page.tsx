import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilPengajarPublik } from "@/lib/api/pengajar";
import { ambilKatalogKelas } from "@/lib/api/kelas";
import { Kartu, Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { TagBidang } from "@/components/kategori";
import { Avatar, Rating, keteranganPengajar } from "@/components/pengajar/kartu-pengajar";
import { KartuKelas } from "@/components/kelas/kartu-kelas";
import { FormLaporMasalah } from "@/components/sesi/interaksi-sesi";

export async function generateMetadata({ params }: PageProps<"/pengajar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await ambilPengajarPublik(id);
  return p ? { title: `${p.nama} · Pengajar` } : { title: "Pengajar tidak ditemukan" };
}

export default function HalamanPengajar({ params }: PageProps<"/pengajar/[id]">) {
  return (
    <Kontainer className="py-8 md:py-12">
      <Suspense
        fallback={
          <div className="grid gap-6">
            <StatusMemuat label="Memuat profil pengajar…" />
            <Kerangka className="h-56" />
            <Kerangka className="h-80" />
          </div>
        }
      >
        <Isi params={params} />
      </Suspense>
    </Kontainer>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, pengguna] = await Promise.all([ambilPengajarPublik(id), ambilPenggunaSaya()]);
  if (!p) notFound();
  const kelas = (await ambilKatalogKelas()).filter((k) => k.pengajar_id === p.id);
  const bolehLapor = pengguna?.peran === "orang_tua" || pengguna?.peran === "siswa";

  return (
    <>
      <Kartu className="flex flex-col gap-6 md:flex-row md:items-center md:p-10">
        <Avatar nama={p.nama} foto={p.foto_url} besar />
        <div className="flex flex-col gap-3">
          <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">{p.nama}</h1>
          <p className="text-lg text-text-muted">
            {keteranganPengajar(p)}
            {p.kampus ? ` · ${p.kampus}` : ""}
          </p>
          <p className="flex items-center gap-2 font-bold text-success">
            <ShieldCheck aria-hidden className="size-5" /> Terverifikasi admin: identitas, SKCK, dan wawancara
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Keahlian">
            {p.keahlian.map((b) => (
              <li key={b}>
                <TagBidang bidang={b} />
              </li>
            ))}
          </ul>
          <Rating p={p} />
        </div>
      </Kartu>

      <section aria-labelledby="judul-kelas-pengajar" className="mt-10">
        <h2 id="judul-kelas-pengajar" className="text-2xl font-bold">
          Kelas yang diajar
        </h2>
        {kelas.length === 0 ? (
          <div className="mt-4">
            <StateKosong judul="Belum ada kelas yang dibuka" keterangan="Jadwal baru dari pengajar ini akan tampil di sini." />
          </div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {kelas.map((k) => (
              <KartuKelas key={k.id} k={k} />
            ))}
          </div>
        )}
      </section>

      {bolehLapor ? (
        <div className="mt-10">
          <FormLaporMasalah sesiId={null} pengajarId={p.id} namaPengajar={p.nama} />
        </div>
      ) : null}
    </>
  );
}
