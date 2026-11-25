import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck, Star } from "lucide-react";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilPengajarPublik, ambilUlasanPengajar } from "@/lib/api/pengajar";
import { formatTanggal } from "@/lib/format";
import { ambilKatalogKelas } from "@/lib/api/kelas";
import { Kartu, Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { TagBidang } from "@/components/kategori";
import { Avatar, Rating, keteranganPengajar } from "@/components/pengajar/kartu-pengajar";
import { KartuKelas } from "@/components/kelas/kartu-kelas";
import { FormLaporMasalah } from "@/components/sesi/interaksi-sesi";

export async function generateMetadata({ params }: PageProps<"/pengajar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await ambilPengajarPublik(id);
  return p
    ? {
        title: `${p.nama} · Pengajar`,
        description: `${p.nama}, pengajar Kodie terverifikasi (${keteranganPengajar(p)}). Lihat keahlian, rating, dan kelas yang diajar.`,
        alternates: { canonical: `/pengajar/${id}` },
      }
    : { title: "Pengajar tidak ditemukan" };
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
  const [semuaKelas, ulasan] = await Promise.all([ambilKatalogKelas(), ambilUlasanPengajar(p.id)]);
  const kelas = semuaKelas.filter((k) => k.pengajar_id === p.id);
  const bolehLapor = pengguna?.peran === "orang_tua" || pengguna?.peran === "siswa";

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-text-muted">
          <li>
            <Link href="/" className="underline-offset-4 hover:text-text hover:underline">
              Beranda
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/kelas" className="underline-offset-4 hover:text-text hover:underline">
              Katalog kelas
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-bold text-text">
            {p.nama}
          </li>
        </ol>
      </nav>
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

      {p.bio ? (
        <section aria-labelledby="judul-bio" className="mt-10">
          <h2 id="judul-bio" className="text-2xl font-bold">
            Gaya mengajar
          </h2>
          <p className="mt-3 max-w-3xl text-lg leading-8">{p.bio}</p>
        </section>
      ) : null}

      <section aria-labelledby="judul-ulasan" className="mt-10">
        <h2 id="judul-ulasan" className="text-2xl font-bold">
          Ulasan orang tua dan siswa
        </h2>
        {ulasan.length === 0 ? (
          <p className="mt-3 text-text-muted">Ulasan tampil setelah pengajar menerima minimal 3 rating dari kelas yang selesai.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {ulasan.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 rounded-card-sm bg-surface p-5 shadow-kartu">
                <p className="flex items-center gap-1" aria-label={`${u.bintang} dari 5 bintang`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={i <= u.bintang ? "size-4 fill-warning text-warning" : "size-4 text-border-strong"}
                    />
                  ))}
                </p>
                <p className="leading-7">&ldquo;{u.komentar}&rdquo;</p>
                <p className="mt-auto text-sm text-text-muted">
                  {u.pemberi_label}
                  {u.program_nama ? ` · ${u.program_nama}` : ""} · {formatTanggal(u.dibuat_pada)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-text-muted">Nama pemberi ulasan disamarkan untuk menjaga privasi.</p>
      </section>

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
