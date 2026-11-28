"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import type { HasilMinat, Siswa } from "@/types/database";
import { aksiHapusAnak, aksiSimpanAnak } from "@/lib/aksi/akun";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { inisialNama } from "@/lib/nama";
import { formatTanggal, labelKelas } from "@/lib/format";
import { KELAS_ANAK, skemaAnak } from "@/lib/validasi/anak";
import { fiturLanjutan } from "@/lib/api/sumber";
import { Input, Pilihan } from "@/components/ui/formulir";
import { Lencana, StateKosong } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir, fokusGalatPertama } from "@/components/auth/bagian";

type I = z.input<typeof skemaAnak>;

function FormAnak({ anak, selesai }: { anak: Siswa | null; selesai: (pesan?: string) => void }) {
  const { register, handleSubmit, setError, control, setValue, formState } = useForm<I>({
    resolver: zodResolver(skemaAnak),
    shouldFocusError: false,
    defaultValues: anak
      ? { nama: anak.nama, tanggal_lahir: anak.tanggal_lahir, jenjang: anak.jenjang, kelas: String(anak.kelas), sekolah: anak.sekolah ?? "" }
      : { nama: "", tanggal_lahir: "", jenjang: "" as I["jenjang"], kelas: "", sekolah: "" },
  });
  const [galat, setGalat] = useState<string>();
  const [menunggu, mulai] = useTransition();
  const jenjang = useWatch({ control, name: "jenjang" }) as string;
  const daftarKelas: readonly number[] =
    jenjang === "TK" || jenjang === "SD" || jenjang === "SMP" || jenjang === "SMA" ? KELAS_ANAK[jenjang] : [];
  const e = formState.errors;
  const awalan = anak ? `ubah-${anak.id}` : "tambah";

  const kirim = (data: I) =>
    mulai(async () => {
      setGalat(undefined);
      const hasil = await aksiSimpanAnak(anak?.id ?? null, data);
      if (hasil.galatIsian) {
        for (const [k, v] of Object.entries(hasil.galatIsian)) setError(k as keyof I, { message: v });
        fokusGalatPertama();
      }
      if (hasil.galat) setGalat(hasil.galat);
      if (hasil.ok) selesai(anak ? `Data ${data.nama} disimpan.` : `${data.nama} ditambahkan.`);
    });

  return (
    <form onSubmit={handleSubmit(kirim, fokusGalatPertama)} noValidate className="flex flex-col gap-4">
      <PesanFormulir galat={galat} />
      <Input id={`${awalan}-nama`} label="Nama lengkap" galat={e.nama?.message} {...register("nama")} />
      <Input id={`${awalan}-tanggal_lahir`} type="date" label="Tanggal lahir" galat={e.tanggal_lahir?.message} {...register("tanggal_lahir")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Pilihan
          id={`${awalan}-jenjang`}
          label="Jenjang"
          galat={e.jenjang?.message}
          {...register("jenjang", { onChange: () => setValue("kelas", "") })}
        >
          <option value="">Pilih jenjang</option>
          {fiturLanjutan || anak?.jenjang === "TK" ? <option value="TK">TK (usia 5–6 tahun)</option> : null}
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </Pilihan>
        <Pilihan id={`${awalan}-kelas`} label="Kelas" galat={e.kelas?.message} disabled={daftarKelas.length === 0} {...register("kelas")}>
          <option value="">{daftarKelas.length ? "Pilih kelas" : "Pilih jenjang dulu"}</option>
          {daftarKelas.map((k) => (
            <option key={k} value={k}>
              {jenjang === "TK" ? "TK B" : `Kelas ${k}`}
            </option>
          ))}
        </Pilihan>
      </div>
      <Input id={`${awalan}-sekolah`} label="Nama sekolah (opsional)" galat={e.sekolah?.message} {...register("sekolah")} />
      <div className="flex flex-wrap gap-3">
        <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Menyimpan…" : anak ? "Simpan perubahan" : "Tambah anak"}
        </Tombol>
        <Tombol varian="kedua" onClick={() => selesai()}>
          Batal
        </Tombol>
      </div>
    </form>
  );
}

export function ManajerAnak({ anak, hasilMinat }: { anak: Siswa[]; hasilMinat: Record<string, HasilMinat> }) {
  const [mode, setMode] = useState<{ jenis: "tambah" } | { jenis: "ubah" | "hapus"; id: string } | null>(null);
  const [pesan, setPesan] = useState<string>();
  const [galatHapus, setGalatHapus] = useState<string>();
  const [menunggu, mulai] = useTransition();
  const tombolTambah = useRef<HTMLButtonElement>(null);
  const pertama = useRef(true);

  useEffect(() => {
    // Saat panel dibuka, fokus ke isian pertama di dalamnya.
    if (pertama.current) {
      pertama.current = false;
      return;
    }
    if (mode) document.querySelector<HTMLElement>("[data-panel-anak] input, [data-panel-anak] button")?.focus();
  }, [mode]);

  const tutup = (p?: string) => {
    setMode(null);
    setGalatHapus(undefined);
    if (p) setPesan(p);
    tombolTambah.current?.focus();
  };

  const hapus = (s: Siswa) =>
    mulai(async () => {
      setGalatHapus(undefined);
      const hasil = await aksiHapusAnak(s.id);
      if (hasil.galat) setGalatHapus(hasil.galat);
      else tutup(`Profil ${s.nama} dihapus.`);
    });

  return (
    <div className="flex flex-col gap-6">
      <p aria-live="polite" className={pesan ? "rounded-card-sm bg-success-subtle p-4 font-bold text-success" : "sr-only"}>
        {pesan}
      </p>

      {anak.length === 0 && mode?.jenis !== "tambah" ? (
        <StateKosong
          judul="Belum ada profil anak"
          keterangan="Tambahkan anak untuk memesan kelas dan mengerjakan tes minat atas namanya."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {anak.map((s) => {
            const punyaAkun = Boolean(s.pengguna_id);
            const h = hasilMinat[s.id];
            const aktif = mode && mode.jenis !== "tambah" && mode.id === s.id ? mode.jenis : null;
            return (
              <li key={s.id} className="rounded-card bg-surface p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-subtle font-display font-semibold text-primary">
                    {inisialNama(s.nama)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold">{s.nama}</h2>
                    <p className="text-text-muted">
                      {labelKelas(s.jenjang, s.kelas)}
                      {s.sekolah ? ` · ${s.sekolah}` : ""} · lahir {formatTanggal(`${s.tanggal_lahir}T00:00:00+07:00`).split(", ")[1]}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {punyaAkun ? (
                        <Lencana nada="info">
                          <UserCheck aria-hidden className="size-4" /> Punya akun sendiri
                        </Lencana>
                      ) : null}
                      <Lencana nada={h ? "aksen" : "netral"}>
                        {h ? `Tes minat: ${NAMA_BIDANG[h.bidang_teratas]} ${h.skor[h.bidang_teratas]}%` : "Belum tes minat"}
                      </Lencana>
                    </div>
                  </div>
                  {punyaAkun ? null : (
                    <div className="flex gap-2">
                      <Tombol varian="kedua" onClick={() => setMode({ jenis: "ubah", id: s.id })} aria-expanded={aktif === "ubah"}>
                        <Pencil aria-hidden className="size-4" /> Ubah<span className="sr-only"> {s.nama}</span>
                      </Tombol>
                      <Tombol varian="kedua" onClick={() => setMode({ jenis: "hapus", id: s.id })} aria-expanded={aktif === "hapus"}>
                        <Trash2 aria-hidden className="size-4" /> Hapus<span className="sr-only"> {s.nama}</span>
                      </Tombol>
                    </div>
                  )}
                </div>
                {punyaAkun ? (
                  <p className="mt-3 text-sm text-text-muted">Data akun siswa dikelola {s.nama.split(" ")[0]} dari akunnya sendiri.</p>
                ) : null}
                {aktif === "ubah" ? (
                  <div data-panel-anak className="mt-5 border-t border-border pt-5">
                    <FormAnak anak={s} selesai={tutup} />
                  </div>
                ) : null}
                {aktif === "hapus" ? (
                  <div data-panel-anak role="alertdialog" aria-labelledby={`hapus-${s.id}`} className="mt-5 rounded-card-sm bg-danger-subtle p-5">
                    <p id={`hapus-${s.id}`} className="font-display text-lg font-semibold">
                      Hapus profil {s.nama}?
                    </p>
                    <p className="mt-1">Riwayat tes minat anak ini ikut terhapus. Profil yang punya booking aktif tidak bisa dihapus.</p>
                    {galatHapus ? <p role="alert" className="mt-3 font-bold text-danger">{galatHapus}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Tombol varian="bahaya" onClick={() => hapus(s)} disabled={menunggu} aria-busy={menunggu}>
                        Ya, hapus
                      </Tombol>
                      <Tombol varian="kedua" onClick={() => tutup()}>
                        Batal
                      </Tombol>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {mode?.jenis === "tambah" ? (
        <section data-panel-anak aria-labelledby="judul-tambah" className="rounded-card bg-surface p-6">
          <h2 id="judul-tambah" className="mb-4 text-xl font-semibold">
            Tambah anak
          </h2>
          <FormAnak anak={null} selesai={tutup} />
        </section>
      ) : (
        <div>
          <Tombol ref={tombolTambah} varian="kedua" ukuran="lg" onClick={() => setMode({ jenis: "tambah" })}>
            <Plus aria-hidden className="size-5" /> Tambah anak
          </Tombol>
        </div>
      )}
    </div>
  );
}
