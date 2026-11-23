"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Clock, FileCheck2, RefreshCw, ShieldAlert, Upload } from "lucide-react";
import type { PengajarProgram, Pengguna, ProfilPengajar, Program } from "@/types/database";
import { aksiSimpanDokumenPengajar, aksiSimpanProfilPengajar } from "@/lib/aksi/mengajar";
import { unggahDokumenPengajar, unggahFotoPengajar } from "@/lib/api/unggah";
import { pesanError } from "@/lib/errors";
import { LABEL_STATUS_KERJA } from "@/lib/mengajar";
import { LABEL_PERAN_STATUS, STATUS_KERJA_PILIHAN } from "./konstanta";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { BIDANG_PILIHAN } from "@/lib/validasi/auth";
import { formatUkuran } from "@/lib/validasi/bukti";
import {
  ACCEPT_DOKUMEN_PENGAJAR,
  ACCEPT_FOTO_PENGAJAR,
  cekDokumenPengajar,
  cekFotoPengajar,
  skemaProfilPengajar,
} from "@/lib/validasi/mengajar";
import { Input } from "@/components/ui/formulir";
import { Catatan, Lencana } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";
import { Kelompok, PesanFormulir, fokusGalatPertama } from "@/components/auth/bagian";
import { inisialNama } from "@/lib/nama";

type I = z.input<typeof skemaProfilPengajar>;

function KartuUnggah({
  id,
  judul,
  petunjuk,
  accept,
  sudahAda,
  labelSudah,
  cek,
  unggah,
  kolom,
  pratinjauFotoUrl,
}: {
  id: string;
  judul: string;
  petunjuk: string;
  accept: string;
  sudahAda: boolean;
  labelSudah: string;
  cek: (f: { name: string; size: number; type: string }) => string | null;
  unggah: (file: File) => Promise<string>;
  kolom: "foto_path" | "identitas_path" | "skck_path";
  pratinjauFotoUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [terunggah, setTerunggah] = useState(sudahAda);
  const [namaFile, setNamaFile] = useState<string>();
  const [menunggu, mulai] = useTransition();

  function pilih(f: File | undefined) {
    setGalat(undefined);
    setInfo(undefined);
    if (!f) return;
    const masalah = cek(f);
    if (masalah) {
      setGalat(masalah);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    mulai(async () => {
      try {
        const path = await unggah(f);
        const res = await aksiSimpanDokumenPengajar(kolom, path);
        if (res.galat) {
          setGalat(res.galat);
          return;
        }
        setTerunggah(true);
        setNamaFile(`${f.name} (${formatUkuran(f.size)})`);
        setInfo(`${judul} berhasil diunggah.`);
      } catch (e) {
        setGalat(pesanError(e));
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-card-sm border border-border bg-surface-sunken p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label htmlFor={id} className="font-bold">
            {judul}
          </label>
          <p id={`${id}-petunjuk`} className="text-sm text-text-muted">
            {petunjuk}
          </p>
        </div>
        <Lencana nada={terunggah ? "sukses" : "peringatan"}>
          {terunggah ? <FileCheck2 aria-hidden className="size-4" /> : <Clock aria-hidden className="size-4" />}
          {terunggah ? "Sudah diunggah" : "Belum diunggah"}
        </Lencana>
      </div>

      {pratinjauFotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL publik foto profil pengajar
        <img src={pratinjauFotoUrl} alt="Foto profil pengajar" className="size-20 rounded-full object-cover" />
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        aria-describedby={`${id}-petunjuk${galat ? ` ${id}-galat` : ""}`}
        aria-invalid={galat ? true : undefined}
        onChange={(e) => pilih(e.target.files?.[0])}
        className="sr-only"
      />

      {terunggah ? (
        <p className="text-sm text-text-muted">{namaFile ?? labelSudah}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Tombol varian="kedua" disabled={menunggu} aria-busy={menunggu} onClick={() => inputRef.current?.click()}>
          {terunggah ? <RefreshCw aria-hidden className="size-4" /> : <Upload aria-hidden className="size-4" />}
          {menunggu ? "Mengunggah…" : terunggah ? `Ganti ${judul.toLowerCase()}` : `Unggah ${judul.toLowerCase()}`}
        </Tombol>
      </div>

      {galat ? (
        <p id={`${id}-galat`} role="alert" className="text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
      {info ? (
        <p aria-live="polite" className="text-sm font-bold text-success">
          {info}
        </p>
      ) : null}
    </div>
  );
}

export function FormProfilPengajar({
  pengguna,
  profil,
  programDipilih,
  semuaProgram,
  fotoUrl,
}: {
  pengguna: Pengguna;
  profil: ProfilPengajar | null;
  programDipilih: PengajarProgram[];
  semuaProgram: Program[];
  fotoUrl: string | null;
}) {
  const { register, handleSubmit, setError, formState } = useForm<I>({
    resolver: zodResolver(skemaProfilPengajar),
    shouldFocusError: false,
    defaultValues: {
      nama: pengguna.nama,
      no_wa: pengguna.no_wa ?? "",
      status_kerja: profil?.status_kerja ?? "mahasiswa",
      kampus: profil?.kampus ?? "",
      jurusan: profil?.jurusan ?? "",
      keahlian: profil?.keahlian ?? [],
      cv_url: profil?.cv_url ?? "",
      program_ids: programDipilih.map((x) => x.program_id),
    },
  });

  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const e = formState.errors;

  const disetujuiIds = new Set(programDipilih.filter((x) => x.disetujui).map((x) => x.program_id));
  const statusInfo = LABEL_PERAN_STATUS[pengguna.status] ?? { label: pengguna.status, nada: "netral" as const };

  const kirim = (data: I) =>
    mulai(async () => {
      setGalat(undefined);
      setInfo(undefined);
      const res = await aksiSimpanProfilPengajar(data);
      if (res.galatIsian) {
        for (const [k, v] of Object.entries(res.galatIsian)) {
          setError(k as keyof I, { message: v });
        }
        fokusGalatPertama();
        return;
      }
      if (res.galat) {
        setGalat(res.galat);
        return;
      }
      setInfo("Profil dan pilihan program berhasil disimpan.");
    });

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="judul-status-verifikasi" className="rounded-card bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL publik foto pengajar
              <img src={fotoUrl} alt={pengguna.nama} className="size-14 rounded-full object-cover" />
            ) : (
              <span
                aria-hidden
                className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-subtle font-display text-lg font-semibold text-primary"
              >
                {inisialNama(pengguna.nama)}
              </span>
            )}
            <div>
              <h2 id="judul-status-verifikasi" className="text-xl font-semibold">
                Status verifikasi
              </h2>
              <p className="text-sm text-text-muted">
                {profil ? `${LABEL_STATUS_KERJA[profil.status_kerja]} · ${profil.kampus ?? "-"}` : "Lengkapi data dan dokumen Anda."}
              </p>
            </div>
          </div>
          <Lencana nada={statusInfo.nada}>{statusInfo.label}</Lencana>
        </div>

        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden className={profil?.identitas_path ? "size-4 text-success" : "size-4 text-text-muted"} />
            <span>Kartu identitas (KTP/KTM): {profil?.identitas_path ? "Sudah diunggah" : "Belum diunggah"}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden className={profil?.skck_path ? "size-4 text-success" : "size-4 text-text-muted"} />
            <span>SKCK: {profil?.skck_path ? "Sudah diunggah" : "Belum diunggah"}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden className={programDipilih.length > 0 ? "size-4 text-success" : "size-4 text-text-muted"} />
            <span>Program dipilih: {programDipilih.length} ({disetujuiIds.size} disetujui)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden className={profil?.wawancara_selesai ? "size-4 text-success" : "size-4 text-text-muted"} />
            <span>Wawancara admin: {profil?.wawancara_selesai ? "Selesai" : "Menunggu jadwal"}</span>
          </li>
        </ul>

        {pengguna.status === "ditolak" ? (
          <div className="mt-4">
            <Catatan nada="peringatan" judul="Pendaftaran ditolak admin">
              <p>{profil?.alasan_penolakan ?? "Periksa kembali kelengkapan data dan dokumen Anda."}</p>
            </Catatan>
          </div>
        ) : null}

        {pengguna.status === "nonaktif" ? (
          <div className="mt-4">
            <Catatan nada="peringatan" judul="Akun dinonaktifkan">
              <p>{profil?.alasan_penolakan ?? "Anda tidak dapat membuka kelas baru saat akun nonaktif."}</p>
            </Catatan>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="judul-dokumen" className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <div>
          <h2 id="judul-dokumen" className="text-xl font-semibold">
            Foto dan dokumen verifikasi
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Kartu identitas dan SKCK bersifat privat dan hanya bisa dibuka admin Kodie.
          </p>
        </div>

        <KartuUnggah
          id="unggah-foto"
          judul="Foto profil"
          petunjuk="JPG atau PNG, maksimal 1 MB. Tampil di halaman profil pengajar setelah terverifikasi."
          accept={ACCEPT_FOTO_PENGAJAR}
          sudahAda={Boolean(profil?.foto_path)}
          labelSudah="Foto profil sudah tersimpan."
          cek={cekFotoPengajar}
          unggah={(f) => unggahFotoPengajar(pengguna.id, f)}
          kolom="foto_path"
          pratinjauFotoUrl={fotoUrl}
        />

        <KartuUnggah
          id="unggah-identitas"
          judul="Kartu identitas (KTP atau KTM)"
          petunjuk="JPG, PNG, atau PDF, maksimal 2 MB. Wajib untuk verifikasi admin."
          accept={ACCEPT_DOKUMEN_PENGAJAR}
          sudahAda={Boolean(profil?.identitas_path)}
          labelSudah="File identitas sudah tersimpan aman dan hanya bisa diakses admin."
          cek={cekDokumenPengajar}
          unggah={(f) => unggahDokumenPengajar(pengguna.id, f)}
          kolom="identitas_path"
        />

        <KartuUnggah
          id="unggah-skck"
          judul="SKCK"
          petunjuk="JPG, PNG, atau PDF, maksimal 2 MB. Wajib untuk keamanan pengajaran anak."
          accept={ACCEPT_DOKUMEN_PENGAJAR}
          sudahAda={Boolean(profil?.skck_path)}
          labelSudah="File SKCK sudah tersimpan aman dan hanya bisa diakses admin."
          cek={cekDokumenPengajar}
          unggah={(f) => unggahDokumenPengajar(pengguna.id, f)}
          kolom="skck_path"
        />
      </section>

      <form onSubmit={handleSubmit(kirim, fokusGalatPertama)} noValidate className="flex flex-col gap-5">
        <PesanFormulir galat={galat} info={info} />

        <Kelompok judul="Data diri dan keahlian">
          <Input id="nama" label="Nama lengkap" galat={e.nama?.message} {...register("nama")} />
          <Input
            id="no_wa"
            type="tel"
            inputMode="tel"
            label="Nomor WhatsApp"
            petunjuk="Contoh: 081234567890."
            galat={e.no_wa?.message}
            {...register("no_wa")}
          />

          <fieldset aria-describedby={e.status_kerja ? "status_kerja-galat" : undefined}>
            <legend className="font-bold">Status saat ini</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS_KERJA_PILIHAN.map((s) => (
                <label
                  key={s.nilai}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-border-strong px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
                >
                  <input type="radio" value={s.nilai} className="size-4 accent-primary" {...register("status_kerja")} />
                  {s.label}
                </label>
              ))}
            </div>
            {e.status_kerja ? (
              <p id="status_kerja-galat" className="mt-2 text-sm font-bold text-danger">
                {e.status_kerja.message}
              </p>
            ) : null}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="kampus" label="Kampus atau kampus terakhir" galat={e.kampus?.message} {...register("kampus")} />
            <Input id="jurusan" label="Jurusan" galat={e.jurusan?.message} {...register("jurusan")} />
          </div>

          <fieldset aria-describedby={e.keahlian ? "keahlian-galat" : undefined}>
            <legend className="font-bold">Bidang keahlian</legend>
            <p className="text-sm text-text-muted">Boleh pilih lebih dari satu.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BIDANG_PILIHAN.map((b) => (
                <label
                  key={b}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-border-strong px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
                >
                  <input type="checkbox" value={b} className="size-4 accent-primary" {...register("keahlian")} />
                  {NAMA_BIDANG[b]}
                </label>
              ))}
            </div>
            {e.keahlian ? (
              <p id="keahlian-galat" className="mt-2 text-sm font-bold text-danger">
                {e.keahlian.message}
              </p>
            ) : null}
          </fieldset>

          <Input
            id="cv_url"
            type="url"
            label="Link CV atau portofolio (opsional)"
            placeholder="https://"
            galat={e.cv_url?.message}
            {...register("cv_url")}
          />
        </Kelompok>

        <Kelompok judul="Program yang ingin diajar">
          <p className="text-sm text-text-muted">
            Admin menyetujui program yang sesuai dengan latar belakang dan wawancara Anda. Anda hanya bisa membuka kelas untuk
            program yang sudah disetujui.
          </p>
          <fieldset aria-describedby={e.program_ids ? "program_ids-galat" : undefined}>
            <legend className="sr-only">Pilih program yang ingin diajar</legend>
            <div className="flex flex-col gap-3">
              {semuaProgram.map((pr) => {
                const disetujui = disetujuiIds.has(pr.id);
                return (
                  <label
                    key={pr.id}
                    className="flex cursor-pointer items-start gap-3 rounded-card-sm border-[1.5px] border-border bg-surface-sunken p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
                  >
                    <input
                      type="checkbox"
                      value={pr.id}
                      className="mt-1 size-5 shrink-0 accent-primary"
                      {...register("program_ids")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold">{pr.nama}</span>
                        {disetujui ? (
                          <Lencana nada="sukses">Disetujui admin</Lencana>
                        ) : (
                          <Lencana nada="netral">Perlu persetujuan admin</Lencana>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-text-muted">
                        Jenjang {pr.jenjang.join(" & ")} · {pr.durasi_menit} menit · {pr.jumlah_sesi} sesi
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {e.program_ids ? (
              <p id="program_ids-galat" className="mt-2 flex items-center gap-1.5 text-sm font-bold text-danger">
                <ShieldAlert aria-hidden className="size-4" />
                {e.program_ids.message}
              </p>
            ) : null}
          </fieldset>
        </Kelompok>

        <div>
          <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
            {menunggu ? "Menyimpan…" : "Simpan profil"}
          </Tombol>
        </div>
      </form>
    </div>
  );
}
