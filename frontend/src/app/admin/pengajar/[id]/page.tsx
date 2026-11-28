import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { ambilDetailPengajarAdmin } from "@/lib/api/admin";
import { formatTanggalJam } from "@/lib/format";
import { LABEL_STATUS_KERJA } from "@/lib/mengajar";
import { LABEL_STATUS } from "@/lib/peran";
import { AksiVerifikasiPengajar } from "@/components/admin/aksi-pengajar";
import { TagBidang } from "@/components/kategori";
import { Catatan, Kartu, Lencana } from "@/components/ui/dasar";
import { kelasTombol } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Detail verifikasi pengajar" };

function nadaStatus(status: string) {
  if (status === "terverifikasi") return "sukses" as const;
  if (status === "menunggu_verifikasi") return "peringatan" as const;
  if (status === "ditolak" || status === "nonaktif") return "bahaya" as const;
  return "netral" as const;
}

function BlokDokumen({
  judul,
  path,
  signedUrl,
}: {
  judul: string;
  path: string | null | undefined;
  signedUrl: string | null;
}) {
  if (!path) {
    return (
      <div className="rounded-md bg-surface-sunken p-4">
        <p className="font-semibold">{judul}</p>
        <p className="mt-1 text-sm text-text-muted">Belum diunggah oleh pengajar.</p>
      </div>
    );
  }

  const adalahPdf = signedUrl
    ? signedUrl.split("?")[0].toLowerCase().endsWith(".pdf")
    : path.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col gap-3 rounded-md bg-surface-sunken p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{judul}</p>
        <Lencana nada="sukses">Sudah diunggah</Lencana>
      </div>
      {signedUrl ? (
        adalahPdf ? (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={kelasTombol("kedua")}
          >
            <ExternalLink aria-hidden className="size-4" /> Buka berkas PDF
          </a>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Signed URL privat dokumen pengajar; pakai <img> agar tidak lewat image proxy. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt={judul}
              className="max-h-64 w-full rounded bg-surface object-contain"
            />
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <ExternalLink aria-hidden className="size-4" /> Buka ukuran penuh
            </a>
          </div>
        )
      ) : (
        <div className="text-sm text-text-muted">
          <p className="inline-flex items-center gap-1.5 font-mono text-sm break-all text-ink">
            <FileText aria-hidden className="size-4 shrink-0 text-primary" />
            {path}
          </p>
          <p className="mt-1 text-sm">
            Mode contoh (mock): berkas berada di bucket privat dokumen-pengajar. Signed URL aktif saat terhubung ke
            Supabase.
          </p>
        </div>
      )}
    </div>
  );
}

export default async function HalamanDetailPengajarAdmin({
  params,
}: PageProps<"/admin/pengajar/[id]">) {
  const { id } = await params;
  const detail = await ambilDetailPengajarAdmin(id);
  if (!detail) notFound();

  const { pengguna, profil, programDipilih, semuaProgram, fotoUrl, identitasSignedUrl, skckSignedUrl } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/pengajar"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted hover:text-ink max-md:min-h-touch"
        >
          <ArrowLeft data-kembali aria-hidden className="size-4" /> Kembali ke daftar pengajar
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-28 leading-[34px] font-extrabold md:text-40 md:leading-[42px]">
            {pengguna.nama}
          </h1>
          <Lencana nada={nadaStatus(pengguna.status)}>{LABEL_STATUS[pengguna.status]}</Lencana>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {pengguna.no_wa ?? "No. WA belum diisi"} · Terdaftar {formatTanggalJam(pengguna.dibuat_pada)}
        </p>
      </div>

      {profil?.alasan_penolakan && (pengguna.status === "ditolak" || pengguna.status === "nonaktif") ? (
        <Catatan nada="peringatan" judul={pengguna.status === "nonaktif" ? "Alasan penonaktifan" : "Alasan penolakan"}>
          <p>{profil.alasan_penolakan}</p>
        </Catatan>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Profil & keahlian</h2>
          <div className="flex items-start gap-4">
            {fotoUrl ? (
              // Foto profil pengajar dari Supabase Storage
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt={pengguna.nama} className="size-16 rounded-full object-cover" />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-sunken font-display text-xl font-bold text-primary">
                {pengguna.nama.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-semibold">
                {profil ? LABEL_STATUS_KERJA[profil.status_kerja] : "Profil belum dilengkapi"}
              </p>
              {profil?.kampus || profil?.jurusan ? (
                <p className="text-text-muted">
                  {[profil.jurusan, profil.kampus].filter(Boolean).join(" — ")}
                </p>
              ) : null}
              {profil?.cv_url ? (
                <a
                  href={profil.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  <ExternalLink aria-hidden className="size-4" /> Lihat tautan CV / portofolio
                </a>
              ) : null}
            </div>
          </div>

          {profil?.keahlian.length ? (
            <div>
              <p className="mb-2 text-sm text-text-muted">Bidang keahlian</p>
              <div className="flex flex-wrap gap-2">
                {profil.keahlian.map((b) => (
                  <TagBidang key={b} bidang={b} />
                ))}
              </div>
            </div>
          ) : null}

          {profil?.diverifikasi_pada ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-text-muted">
              <ShieldCheck aria-hidden className="size-4 text-success" />
              Terverifikasi pada {formatTanggalJam(profil.diverifikasi_pada)}
            </p>
          ) : null}
        </Kartu>

        <Kartu className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Dokumen pribadi (privat)</h2>
          <BlokDokumen judul="Kartu identitas (KTP / KTM)" path={profil?.identitas_path} signedUrl={identitasSignedUrl} />
          <BlokDokumen judul="Surat Keterangan Catatan Kepolisian (SKCK)" path={profil?.skck_path} signedUrl={skckSignedUrl} />
        </Kartu>
      </div>

      <Kartu className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Wawancara, program & keputusan admin</h2>
        <AksiVerifikasiPengajar
          pengajarId={pengguna.id}
          namaPengajar={pengguna.nama}
          statusSaatIni={pengguna.status}
          profil={profil}
          programDipilih={programDipilih}
          semuaProgram={semuaProgram}
        />
      </Kartu>
    </div>
  );
}
