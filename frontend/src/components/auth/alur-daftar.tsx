"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, GraduationCap, Users, type LucideIcon } from "lucide-react";
import type { z } from "zod";
import type { Bidang } from "@/types/database";
import { aksiDaftar } from "@/app/(auth)/aksi";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import {
  BIDANG_PILIHAN,
  DAFTAR_KELAS,
  skemaOrangTua,
  skemaPengajar,
  skemaSiswa,
} from "@/lib/validasi/auth";
import { cx } from "@/lib/cx";
import { Input, Pilihan } from "@/components/ui/formulir";
import { InputPassword } from "@/components/ui/input-password";
import { Catatan } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";
import { KartuAuth, Kelompok, Langkah, PesanFormulir, fokusGalatPertama } from "./bagian";

/** Halaman /daftar hanya untuk orang tua dan siswa. Pengajar melamar lewat /karier. */
export type PeranDaftar = "orang_tua" | "siswa";

const PILIHAN: { peran: PeranDaftar; judul: string; ket: string; ikon: LucideIcon }[] = [
  { peran: "orang_tua", judul: "Orang tua atau wali", ket: "Untuk mendaftarkan anak SD, SMP, atau SMA dan membayar kelas.", ikon: Users },
  { peran: "siswa", judul: "Siswa SMP atau SMA", ket: "Akunmu aktif setelah orang tua menyetujui lewat link.", ikon: GraduationCap },
];

export function AlurDaftar({ peranAwal }: { peranAwal: PeranDaftar | null }) {
  const [peran, setPeran] = useState<PeranDaftar | null>(peranAwal);
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [belumPilih, setBelumPilih] = useState(false);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const sudahPindah = useRef(false);

  useEffect(() => {
    if (sudahPindah.current) judulRef.current?.focus();
    sudahPindah.current = true;
  }, [langkah, peran]);

  if (langkah === 1 || !peran) {
    return (
      <KartuAuth>
        <Langkah ke={1} dari={2} label="Pilih peran" />
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (peran) setLangkah(2);
            else setBelumPilih(true);
          }}
        >
          <fieldset aria-describedby={belumPilih && !peran ? "galat-peran" : undefined}>
            <legend className="contents">
              <h1 ref={judulRef} tabIndex={-1} className="text-32 leading-[38px] font-extrabold focus:outline-none md:text-48 md:leading-[50px]">
                Daftar sebagai siapa?
              </h1>
            </legend>
            <p className="mt-3 text-text-muted">Pilih satu. Orang tua bisa menambahkan anak setelah akunnya jadi.</p>
            <div className="mt-6 flex flex-col gap-3">
              {PILIHAN.map((o) => {
                const aktif = peran === o.peran;
                return (
                  <label
                    key={o.peran}
                    className={cx(
                      "flex cursor-pointer items-center gap-4 rounded-card-sm border-[1.5px] bg-surface p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                      aktif ? "border-primary bg-primary-subtle" : "border-transparent hover:border-border-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="peran"
                      value={o.peran}
                      checked={aktif}
                      onChange={() => setPeran(o.peran)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cx(
                        "grid size-11 shrink-0 place-items-center rounded-md",
                        aktif ? "bg-primary text-primary-foreground" : "bg-neutral-subtle",
                      )}
                    >
                      <o.ikon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className={cx("block font-display text-lg font-semibold", aktif && "text-primary")}>{o.judul}</span>
                      <span className="block text-sm text-text-muted">{o.ket}</span>
                    </span>
                    {/* Lingkaran radio terlihat di setiap pilihan, jadi jelas ini pilihan tunggal. */}
                    <span
                      aria-hidden
                      className={cx(
                        "grid size-6 shrink-0 place-items-center rounded-full border-2",
                        aktif ? "border-primary bg-primary" : "border-border-strong bg-surface",
                      )}
                    >
                      {aktif ? <span className="size-2.5 rounded-full bg-primary-foreground" /> : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {belumPilih && !peran ? (
              <p id="galat-peran" role="alert" className="mt-3 font-bold text-danger">
                Pilih peran dulu untuk melanjutkan.
              </p>
            ) : null}
          </fieldset>
          <p className="mt-4 text-sm text-text-muted">Siswa SD didaftarkan oleh orang tua.</p>
          <Link
            href="/karier"
            className="mt-4 flex min-h-touch items-center justify-between gap-3 rounded-card-sm bg-surface-sunken px-4 py-3 text-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            Ingin mengajar di Kodie? Lihat posisi pengajar yang dibuka
            <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
          <Tombol type="submit" ukuran="lg" className="mt-6 w-full">
            Lanjut
          </Tombol>
        </form>
        <p className="mt-6 text-center">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-display font-semibold text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </p>
      </KartuAuth>
    );
  }

  const kembali = () => setLangkah(1);
  const judul = { orang_tua: "Data orang tua", siswa: "Data siswa" }[peran];

  return (
    <KartuAuth lebar="max-w-[640px]">
      <Langkah ke={2} dari={2} label={`Isi ${judul.toLowerCase()}`} />
      <h1 ref={judulRef} tabIndex={-1} className="mt-6 text-32 leading-[38px] font-extrabold focus:outline-none md:text-48 md:leading-[50px]">
        {judul}
      </h1>
      {peran === "orang_tua" ? <FormOrangTua kembali={kembali} /> : null}
      {peran === "siswa" ? <FormSiswa kembali={kembali} pindahKeOrangTua={() => setPeran("orang_tua")} /> : null}
    </KartuAuth>
  );
}

/** Kirim ke Server Function dan pasang galat dari server ke isiannya. */
function useKirim<T extends FieldValues>(setError: UseFormSetError<T>, lanjut: string | null = null) {
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const kirim = (data: unknown) => {
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const hasil = await aksiDaftar(data, lanjut);
      if (hasil?.galatIsian) {
        for (const [k, v] of Object.entries(hasil.galatIsian)) setError(k as Path<T>, { message: v }, { shouldFocus: true });
      }
      if (hasil?.galat) setGalat(hasil.galat);
      if (hasil?.info) setInfo(hasil.info);
    });
  };
  return { kirim, menunggu, galat, info };
}

/** Centang wajib persetujuan Kebijakan Privasi, tepat sebelum tombol Buat akun (tautan dibuka di tab baru). */
function PersetujuanPrivasi<T extends FieldValues>({
  register,
  galat,
}: {
  register: (n: Path<T>) => object;
  galat?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="setuju_privasi" className="flex items-start gap-3 rounded-card-sm bg-surface p-4">
        <input
          id="setuju_privasi"
          type="checkbox"
          aria-invalid={galat ? true : undefined}
          aria-describedby={galat ? "setuju_privasi-galat" : undefined}
          className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
          {...register("setuju_privasi" as Path<T>)}
        />
        <span>
          Saya sudah membaca dan menyetujui{" "}
          <Link href="/kebijakan-privasi" target="_blank" rel="noopener" className="font-bold text-primary underline underline-offset-4">
            Kebijakan Privasi
          </Link>{" "}
          Kodie, termasuk cara data anak disimpan dan dipakai.
        </span>
      </label>
      {galat ? (
        <p id="setuju_privasi-galat" className="text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

function Aksi({ kembali, menunggu }: { kembali?: () => void; menunggu: boolean }) {
  return (
    <div className={kembali ? "flex items-center justify-between gap-3" : "flex"}>
      {kembali ? <Tombol varian="kedua" onClick={kembali}>
        Kembali
      </Tombol> : null}
      <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
        {menunggu ? "Membuat akun…" : "Buat akun"}
      </Tombol>
    </div>
  );
}

function IsianAkun<T extends FieldValues>({
  register,
  errors,
  petunjukNama,
}: {
  register: (n: Path<T>) => object;
  errors: Partial<Record<string, { message?: string }>>;
  petunjukNama?: string;
}) {
  return (
    <>
      <Input id="nama" label="Nama lengkap" autoComplete="name" petunjuk={petunjukNama} galat={errors.nama?.message} {...register("nama" as Path<T>)} />
      <Input id="email" type="email" label="Email" autoComplete="email" galat={errors.email?.message} {...register("email" as Path<T>)} />
      <InputPassword
        id="password"
        label="Password"
        autoComplete="new-password"
        kekuatan
        galat={errors.password?.message}
        {...register("password" as Path<T>)}
      />
      <InputPassword
        id="ulangi_password"
        label="Ulangi password"
        autoComplete="new-password"
        petunjuk="Ketik ulang password yang sama."
        galat={errors.ulangi_password?.message}
        {...register("ulangi_password" as Path<T>)}
      />
    </>
  );
}

export function FormOrangTua({ kembali, lanjut = null }: { kembali?: () => void; lanjut?: string | null }) {
  type I = z.input<typeof skemaOrangTua>;
  const { register, handleSubmit, setError, formState } = useForm<I>({
    resolver: zodResolver(skemaOrangTua),
    shouldFocusError: false,
    defaultValues: { peran: "orang_tua" },
  });
  const { kirim, menunggu, galat, info } = useKirim(setError, lanjut);
  return (
    <form method="post" onSubmit={handleSubmit(kirim, fokusGalatPertama)} noValidate className="mt-6 flex flex-col gap-5">
      <p className="text-text-muted">Data anak ditambahkan setelah akun jadi.</p>
      <PesanFormulir galat={galat} info={info} />
      <Kelompok judul="Akun">
        <IsianAkun<I> register={register} errors={formState.errors} />
        <Input
          id="no_wa"
          type="tel"
          inputMode="tel"
          label="Nomor WhatsApp"
          autoComplete="tel"
          petunjuk="Contoh: 081234567890."
          galat={formState.errors.no_wa?.message}
          {...register("no_wa")}
        />
      </Kelompok>
      <PersetujuanPrivasi<I> register={register} galat={formState.errors.setuju_privasi?.message} />
      <Aksi kembali={kembali} menunggu={menunggu} />
    </form>
  );
}

function FormSiswa({ kembali, pindahKeOrangTua }: { kembali: () => void; pindahKeOrangTua: () => void }) {
  type I = z.input<typeof skemaSiswa>;
  const { register, handleSubmit, setError, control, setValue, formState } = useForm<I>({
    resolver: zodResolver(skemaSiswa),
    shouldFocusError: false,
    defaultValues: { peran: "siswa", jenjang: "" as I["jenjang"], kelas: "" },
  });
  const { kirim, menunggu, galat, info } = useKirim(setError);
  const jenjang = useWatch({ control, name: "jenjang" }) as string;
  const e = formState.errors;
  const daftarKelas = jenjang === "SMP" || jenjang === "SMA" ? DAFTAR_KELAS[jenjang] : [];

  return (
    <form method="post" onSubmit={handleSubmit(kirim, fokusGalatPertama)} noValidate className="mt-6 flex flex-col gap-5">
      <p className="text-text-muted">Kami hanya meminta data yang diperlukan untuk kelas. Tidak ada foto, alamat, atau nomor identitas.</p>
      <PesanFormulir galat={galat} info={info} />
      <Kelompok judul="Sekolah">
        <Pilihan
          id="jenjang"
          label="Jenjang"
          galat={e.jenjang?.message}
          {...register("jenjang", { onChange: () => setValue("kelas", "") })}
        >
          <option value="">Pilih jenjang</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </Pilihan>
        {jenjang === "SD" ? (
          <Catatan nada="peringatan" judul="Siswa SD didaftarkan oleh orang tua">
            <p>Siswa SD tidak punya akun sendiri. Minta orang tua mendaftar, lalu menambahkan profilmu dari dashboard mereka.</p>
            <Tombol varian="utama" className="mt-3" onClick={pindahKeOrangTua}>
              Daftar sebagai orang tua
            </Tombol>
          </Catatan>
        ) : (
          <>
            <Pilihan id="kelas" label="Kelas" galat={e.kelas?.message} disabled={daftarKelas.length === 0} {...register("kelas")}>
              <option value="">{daftarKelas.length ? "Pilih kelas" : "Pilih jenjang dulu"}</option>
              {daftarKelas.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </Pilihan>
            <Input
              id="tanggal_lahir"
              type="date"
              label="Tanggal lahir"
              galat={e.tanggal_lahir?.message}
              {...register("tanggal_lahir")}
            />
            <Input id="sekolah" label="Nama sekolah (opsional)" autoComplete="organization" galat={e.sekolah?.message} {...register("sekolah")} />
          </>
        )}
      </Kelompok>
      {jenjang === "SD" ? (
        <div>
          <Tombol varian="kedua" onClick={kembali}>
            Kembali
          </Tombol>
        </div>
      ) : (
        <>
          <Kelompok judul="Akun">
            <IsianAkun<I> register={register} errors={e} petunjukNama="Tulis nama sesuai rapor sekolah." />
          </Kelompok>
          <Kelompok judul="Orang tua">
            <Input id="nama_orang_tua" label="Nama orang tua" galat={e.nama_orang_tua?.message} {...register("nama_orang_tua")} />
            <Input
              id="email_orang_tua"
              type="email"
              label="Email orang tua (opsional)"
              placeholder="Contoh: ibu@contoh.id"
              petunjuk="Opsional. Membantu admin menghubungi orang tua bila perlu. Link persetujuan tetap kamu kirim sendiri."
              galat={e.email_orang_tua?.message}
              {...register("email_orang_tua")}
            />
          </Kelompok>
          <PersetujuanPrivasi<I> register={register} galat={e.setuju_privasi?.message} />
          <Aksi kembali={kembali} menunggu={menunggu} />
        </>
      )}
    </form>
  );
}

const STATUS_KERJA = [
  { nilai: "mahasiswa", label: "Mahasiswa" },
  { nilai: "lulusan", label: "Lulusan" },
  { nilai: "pencari_kerja", label: "Pencari kerja" },
] as const;

/** Form akun pengajar. Dipakai di halaman lamaran /karier/[posisi]. */
export function FormPengajar({ kembali, keahlianAwal = [] }: { kembali?: () => void; keahlianAwal?: Bidang[] }) {
  type I = z.input<typeof skemaPengajar>;
  const { register, handleSubmit, setError, formState } = useForm<I>({
    resolver: zodResolver(skemaPengajar),
    shouldFocusError: false,
    defaultValues: { peran: "pengajar", keahlian: keahlianAwal },
  });
  const { kirim, menunggu, galat, info } = useKirim(setError);
  const e = formState.errors;

  return (
    <form method="post" onSubmit={handleSubmit(kirim, fokusGalatPertama)} noValidate className="mt-6 flex flex-col gap-5">
      <p className="text-text-muted">
        Foto profil, kartu identitas (KTP atau KTM), SKCK, dan program yang ingin diajar diunggah setelah akun jadi, di halaman profil.
      </p>
      <PesanFormulir galat={galat} info={info} />
      <Kelompok judul="Akun">
        <IsianAkun<I> register={register} errors={e} />
        <Input id="no_wa" type="tel" inputMode="tel" label="Nomor WhatsApp" autoComplete="tel" petunjuk="Contoh: 081234567890." galat={e.no_wa?.message} {...register("no_wa")} />
      </Kelompok>
      <Kelompok judul="Pendidikan dan keahlian">
        <fieldset aria-describedby={e.status_kerja ? "status_kerja-galat" : undefined}>
          <legend className="font-bold">Status saat ini</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_KERJA.map((s) => (
              <label key={s.nilai} className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-border-strong px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
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
        <Input id="kampus" label="Kampus atau kampus terakhir" galat={e.kampus?.message} {...register("kampus")} />
        <Input id="jurusan" label="Jurusan" galat={e.jurusan?.message} {...register("jurusan")} />
        <fieldset aria-describedby={e.keahlian ? "keahlian-galat" : undefined}>
          <legend className="font-bold">Bidang keahlian</legend>
          <p className="text-sm text-text-muted">Boleh lebih dari satu.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BIDANG_PILIHAN.map((b) => (
              <label key={b} className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-border-strong px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
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
      <PersetujuanPrivasi<I> register={register} galat={e.setuju_privasi?.message} />
      <Aksi kembali={kembali} menunggu={menunggu} />
    </form>
  );
}

