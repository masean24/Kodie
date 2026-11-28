import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Award, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilDetailProfilPengajar, ambilPengajarPublik, ambilUlasanPengajar } from "@/lib/api/pengajar";
import { Bintang, DeretBintang } from "@/components/ui/bintang";
import { TangkapReferral, TombolBagikanProfil } from "@/components/pengajar/bagikan-profil";
import { fiturLanjutan } from "@/lib/api/sumber";
import { cx } from "@/lib/cx";
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
        description: `${p.nama}, pengajar Kodie terverifikasi (${keteranganPengajar(p)}). Lihat pengalaman, sertifikat, testimoni, rating, dan kelas yang diajar.`,
        alternates: { canonical: `/pengajar/${id}` },
        openGraph: {
          title: `${p.nama} · Pengajar Kodie`,
          description: `Pengajar terverifikasi Kodie: ${keteranganPengajar(p)}.`,
          url: `/pengajar/${id}`,
          type: "profile",
        },
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
  const [semuaKelas, ulasan, detail] = await Promise.all([
    ambilKatalogKelas(),
    ambilUlasanPengajar(p.id),
    ambilDetailProfilPengajar(p.id),
  ]);
  const kelas = semuaKelas.filter((k) => k.pengajar_id === p.id);
  const bolehLapor = pengguna?.peran === "orang_tua" || pengguna?.peran === "siswa";
  const pendidikan = [p.jurusan, p.kampus].filter(Boolean).join(" · ");
  // Sebelum tabel sertifikat ada di backend (fitur lanjutan mati), bagian sertifikat disembunyikan.
  const adaSertifikat = fiturLanjutan || detail.sertifikat.length > 0;

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
          <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">{p.nama}</h1>
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
          <TombolBagikanProfil path={`/pengajar/${p.id}`} nama={p.nama} />
        </div>
      </Kartu>
      <TangkapReferral pengajarId={p.id} />

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card-sm bg-surface p-5 shadow-kartu">
          <dt className="text-sm text-text-muted">Rating rata-rata</dt>
          <dd className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold">
            {p.rata_rata_rating !== null ? (
              <>
                <Bintang ukuran="lg" />
                {p.rata_rata_rating.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <span className="text-base font-semibold text-text-muted">/ 5</span>
              </>
            ) : (
              <span className="text-base font-semibold text-text-muted">Belum cukup rating</span>
            )}
          </dd>
        </div>
        <div className="rounded-card-sm bg-surface p-5 shadow-kartu">
          <dt className="text-sm text-text-muted">Jumlah penilaian</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold">{p.jumlah_rating}</dd>
        </div>
        <div className="rounded-card-sm bg-surface p-5 shadow-kartu">
          <dt className="text-sm text-text-muted">Kelas dibuka</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold">{kelas.length}</dd>
        </div>
      </dl>

      {p.bio ? (
        <section aria-labelledby="judul-bio" className="mt-10">
          <h2 id="judul-bio" className="text-2xl font-bold">
            Gaya mengajar
          </h2>
          <p className="mt-3 max-w-3xl text-lg leading-8">{p.bio}</p>
        </section>
      ) : null}

      <div className={cx("mt-10 grid gap-8", adaSertifikat ? "lg:grid-cols-2" : "")}>
        <section aria-labelledby="judul-pengalaman">
          <h2 id="judul-pengalaman" className="flex items-center gap-2 text-2xl font-bold">
            <BriefcaseBusiness aria-hidden className="size-6 text-primary" /> Pendidikan dan pengalaman
          </h2>
          <ol className="mt-4 flex flex-col gap-4 border-l-2 border-border pl-5">
            {pendidikan ? (
              <li className="relative">
                <span aria-hidden className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-primary" />
                <p className="font-bold">{keteranganPengajar(p)}</p>
                <p className="text-text-muted">{pendidikan}</p>
              </li>
            ) : null}
            {detail.pengalaman.map((x) => (
              <li key={x.id} className="relative">
                <span aria-hidden className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-lime ring-2 ring-ink/20" />
                <p className="font-bold">{x.peran}</p>
                <p className="text-text-muted">
                  {x.tempat} · {x.periode}
                </p>
                {x.deskripsi ? <p className="mt-1 leading-7">{x.deskripsi}</p> : null}
              </li>
            ))}
          </ol>
          {detail.pengalaman.length === 0 && fiturLanjutan ? (
            <p className="mt-3 text-sm text-text-muted">Pengajar belum menambahkan riwayat pengalaman.</p>
          ) : null}
        </section>

        {adaSertifikat ? (
          <section aria-labelledby="judul-sertifikat">
            <h2 id="judul-sertifikat" className="flex items-center gap-2 text-2xl font-bold">
              <Award aria-hidden className="size-6 text-primary" /> Sertifikat
            </h2>
            {detail.sertifikat.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">Pengajar belum menambahkan sertifikat.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {detail.sertifikat.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 rounded-card-sm bg-surface p-4 shadow-kartu">
                    <Award aria-hidden className="mt-0.5 size-5 shrink-0 text-bintang-garis" />
                    <div>
                      <p className="font-bold">{s.nama}</p>
                      <p className="text-sm text-text-muted">
                        {s.penerbit} · {s.tahun}
                      </p>
                      {s.tautan ? (
                        <a
                          href={s.tautan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex min-h-touch items-center text-sm font-bold text-primary underline-offset-4 hover:underline"
                        >
                          Lihat sertifikat<span className="sr-only"> {s.nama} (tab baru)</span>
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      <section aria-labelledby="judul-ulasan" className="mt-10">
        <h2 id="judul-ulasan" className="text-2xl font-bold">
          Testimoni orang tua dan siswa
        </h2>
        {ulasan.length === 0 ? (
          <p className="mt-3 text-text-muted">Testimoni tampil setelah pengajar menerima minimal 3 rating dari kelas yang selesai.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {ulasan.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 rounded-card-sm bg-surface p-5 shadow-kartu">
                <DeretBintang nilai={u.bintang} ukuran="sm" />
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
