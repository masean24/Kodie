"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, RefreshCw, Upload, Video } from "lucide-react";
import type { Program, StatusKelas, StatusMasalah } from "@/types/database";
import {
  aksiAdminBayarHonor,
  aksiAdminBuatMeetUlang,
  aksiAdminSimpanPengaturan,
  aksiAdminStatusMasalah,
  aksiAdminUbahKelas,
  aksiAdminUbahProgram,
} from "@/lib/aksi/admin";
import type { KonfigurasiChatbot } from "@/lib/chatbot";
import { aksiAdminSimpanPengaturanChatbot } from "@/lib/aksi/chatbot";
import { unggahGambarQris } from "@/lib/api/unggah";
import { pesanError } from "@/lib/errors";
import { ACCEPT_QRIS, cekFileQris } from "@/lib/validasi/admin";
import { Input, Pilihan, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir } from "@/components/auth/bagian";
import { fiturLanjutan } from "@/lib/api/sumber";

/** Tombol ubah status laporan masalah (PRD F12). */
export function TombolStatusMasalah({ id, statusSaatIni }: { id: string; statusSaatIni: StatusMasalah }) {
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();

  const ubah = (st: StatusMasalah) =>
    mulai(async () => {
      setGalat(undefined);
      const res = await aksiAdminStatusMasalah(id, st);
      if (res.galat) setGalat(res.galat);
    });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {statusSaatIni === "baru" ? (
          <Tombol varian="kedua" disabled={menunggu} onClick={() => ubah("ditinjau")}>
            Tandai ditinjau
          </Tombol>
        ) : null}
        {statusSaatIni !== "selesai" ? (
          <Tombol disabled={menunggu} onClick={() => ubah("selesai")}>
            <CheckCircle2 aria-hidden className="size-4" /> Selesai
          </Tombol>
        ) : (
          <span className="text-sm font-bold text-success">Sudah selesai</span>
        )}
      </div>
      {galat ? <p role="alert" className="text-sm font-bold text-danger">{galat}</p> : null}
    </div>
  );
}

/** Tombol tandai honor dibayar (PRD F13). */
export function TombolBayarHonor({ id, dibayar }: { id: string; dibayar: boolean }) {
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();

  if (dibayar) return <span className="text-sm font-bold text-success">Sudah dibayar</span>;

  return (
    <div className="flex flex-col gap-1">
      <Tombol
        disabled={menunggu}
        aria-busy={menunggu}
        onClick={() =>
          mulai(async () => {
            setGalat(undefined);
            const res = await aksiAdminBayarHonor(id);
            if (res.galat) setGalat(res.galat);
          })
        }
      >
        {menunggu ? "Menyimpan…" : "Tandai dibayar"}
      </Tombol>
      {galat ? <p role="alert" className="text-sm font-bold text-danger">{galat}</p> : null}
    </div>
  );
}

/** Tombol coba ulang pembuatan Google Meet untuk kelas (PRD F8, F14). */
export function TombolBuatMeetUlang({ kelasId }: { kelasId: string }) {
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();

  return (
    <div className="flex flex-col gap-1">
      <Tombol
        varian="kedua"
        disabled={menunggu}
        aria-busy={menunggu}
        onClick={() =>
          mulai(async () => {
            setGalat(undefined);
            const res = await aksiAdminBuatMeetUlang(kelasId);
            if (res.galat) setGalat(res.galat);
          })
        }
      >
        <Video aria-hidden className="size-4" />
        {menunggu ? "Membuat link…" : "Coba buat link Meet"}
      </Tombol>
      {galat ? <p role="alert" className="text-sm font-bold text-danger">{galat}</p> : null}
    </div>
  );
}

/** Form ubah status & kapasitas kelas oleh admin (PRD F14). */
export function FormUbahKelasAdmin({
  kelasId,
  statusAwal,
  kapasitasAwal,
}: {
  kelasId: string;
  statusAwal: StatusKelas;
  kapasitasAwal: number;
}) {
  const [status, setStatus] = useState<StatusKelas>(statusAwal);
  const [kapasitas, setKapasitas] = useState(String(kapasitasAwal));
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminUbahKelas(kelasId, { status, kapasitas: Number(kapasitas) });
      if (res.galat) setGalat(res.galat);
      else if (res.galatIsian) setGalat(Object.values(res.galatIsian)[0]);
      else setInfo("Tersimpan");
    });
  };

  return (
    <form onSubmit={simpan} className="flex flex-wrap items-end gap-2">
      <Pilihan
        id={`status-kelas-${kelasId}`}
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as StatusKelas)}
        className="w-40"
      >
        <option value="terbuka">Terbuka</option>
        <option value="berjalan">Berjalan</option>
        <option value="selesai">Selesai</option>
        <option value="disembunyikan">Disembunyikan</option>
      </Pilihan>
      <Input
        id={`kapasitas-kelas-${kelasId}`}
        type="number"
        min={1}
        max={15}
        label="Kapasitas"
        value={kapasitas}
        onChange={(e) => setKapasitas(e.target.value)}
        className="w-24"
      />
      <Tombol type="submit" varian="kedua" disabled={menunggu}>
        {menunggu ? "…" : "Simpan"}
      </Tombol>
      {info ? <span aria-live="polite" className="text-sm font-bold text-success">{info}</span> : null}
      {galat ? <span role="alert" className="text-sm font-bold text-danger">{galat}</span> : null}
    </form>
  );
}

/** Form ubah harga, durasi, sesi, dan tarif honor program (PRD F5, F13, F14). */
export function FormProgramAdmin({ program }: { program: Program }) {
  const [harga, setHarga] = useState(String(program.harga_paket));
  const [honor, setHonor] = useState(String(program.honor_per_sesi));
  const [durasi, setDurasi] = useState(String(program.durasi_menit));
  const [sesi, setSesi] = useState(String(program.jumlah_sesi));
  const [aktif, setAktif] = useState(program.aktif);
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminUbahProgram(program.id, {
        harga_paket: Number(harga),
        honor_per_sesi: Number(honor),
        durasi_menit: Number(durasi),
        jumlah_sesi: Number(sesi),
        aktif,
      });
      if (res.galat) setGalat(res.galat);
      else if (res.galatIsian) setGalat(Object.values(res.galatIsian)[0]);
      else setInfo("Perubahan program disimpan.");
    });
  };

  return (
    <form onSubmit={simpan} className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{program.nama}</h2>
          <p className="text-sm text-text-muted">
            Jenjang {program.jenjang.join(" & ")} · Kelas {program.kelas_min}–{program.kelas_maks}
          </p>
        </div>
        <label className="flex min-h-touch cursor-pointer items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={aktif}
            onChange={(e) => setAktif(e.target.checked)}
            className="size-5 accent-primary"
          />
          <span>Aktif</span>
        </label>
      </div>

      <PesanFormulir galat={galat} info={info} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          id={`harga-${program.id}`}
          type="number"
          min={0}
          label="Harga paket (Rp)"
          value={harga}
          onChange={(e) => setHarga(e.target.value)}
        />
        <Input
          id={`honor-${program.id}`}
          type="number"
          min={0}
          label="Honor/sesi (Rp)"
          value={honor}
          onChange={(e) => setHonor(e.target.value)}
          petunjuk={fiturLanjutan ? "Tidak dipakai lagi: honor kini 30% per siswa terkonfirmasi ÷ 4 sesi." : undefined}
        />
        <Input
          id={`durasi-${program.id}`}
          type="number"
          min={30}
          max={180}
          label="Durasi (menit)"
          value={durasi}
          onChange={(e) => setDurasi(e.target.value)}
        />
        <Input
          id={`sesi-${program.id}`}
          type="number"
          min={1}
          max={12}
          label="Jumlah sesi"
          value={sesi}
          onChange={(e) => setSesi(e.target.value)}
        />
      </div>

      <div>
        <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan perubahan"}
        </Tombol>
      </div>
    </form>
  );
}

/** Form pengaturan rekening bank dan gambar QRIS (PRD F6, F14). */
export function FormPengaturanAdmin({
  awal,
}: {
  awal: {
    nama_bank: string;
    nomor_rekening: string;
    nama_pemilik_rekening: string;
    qris_path: string | null;
    qris_url: string | null;
  };
}) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [namaBank, setNamaBank] = useState(awal.nama_bank);
  const [noRek, setNoRek] = useState(awal.nomor_rekening);
  const [pemilik, setPemilik] = useState(awal.nama_pemilik_rekening);
  const [qrisPath, setQrisPath] = useState<string | null>(awal.qris_path);
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const pilihQris = (file: File | undefined) => {
    setGalat(undefined);
    setInfo(undefined);
    if (!file) return;
    const masalah = cekFileQris(file);
    if (masalah) {
      setGalat(masalah);
      if (inputFile.current) inputFile.current.value = "";
      return;
    }
    mulai(async () => {
      try {
        const path = await unggahGambarQris(file);
        setQrisPath(path);
        const res = await aksiAdminSimpanPengaturan({
          nama_bank: namaBank,
          nomor_rekening: noRek,
          nama_pemilik_rekening: pemilik,
          qris_path: path,
        });
        if (res.galat) setGalat(res.galat);
        else setInfo("Gambar QRIS baru berhasil diunggah dan disimpan.");
      } catch (e) {
        setGalat(pesanError(e));
      }
    });
  };

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminSimpanPengaturan({
        nama_bank: namaBank,
        nomor_rekening: noRek,
        nama_pemilik_rekening: pemilik,
        qris_path: qrisPath,
      });
      if (res.galat) setGalat(res.galat);
      else if (res.galatIsian) setGalat(Object.values(res.galatIsian)[0]);
      else setInfo("Pengaturan rekening dan pembayaran disimpan.");
    });
  };

  return (
    <form onSubmit={simpan} className="flex max-w-[680px] flex-col gap-5 rounded-card bg-surface p-6">
      <PesanFormulir galat={galat} info={info} />

      <Input
        id="nama_bank"
        label="Nama bank"
        value={namaBank}
        onChange={(e) => setNamaBank(e.target.value)}
      />
      <Input
        id="nomor_rekening"
        label="Nomor rekening"
        value={noRek}
        onChange={(e) => setNoRek(e.target.value)}
      />
      <Input
        id="nama_pemilik_rekening"
        label="Nama pemilik rekening"
        value={pemilik}
        onChange={(e) => setPemilik(e.target.value)}
      />

      <div className="flex flex-col gap-3 rounded-card-sm bg-surface-sunken p-4">
        <label htmlFor="unggah-qris" className="font-bold">
          Gambar QRIS statis
        </label>
        <p className="text-sm text-text-muted">JPG atau PNG, maksimal 1 MB.</p>
        {awal.qris_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL bucket privat pengaturan
          <img src={awal.qris_url} alt="QRIS saat ini" width={160} height={160} className="size-40 rounded-md" />
        ) : null}
        <input
          ref={inputFile}
          id="unggah-qris"
          type="file"
          accept={ACCEPT_QRIS}
          onChange={(e) => pilihQris(e.target.files?.[0])}
          className="sr-only"
        />
        <div>
          <Tombol varian="kedua" disabled={menunggu} onClick={() => inputFile.current?.click()}>
            {qrisPath ? <RefreshCw aria-hidden className="size-4" /> : <Upload aria-hidden className="size-4" />}
            {qrisPath ? "Ganti gambar QRIS" : "Unggah gambar QRIS"}
          </Tombol>
        </div>
      </div>

      <div>
        <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan pengaturan"}
        </Tombol>
      </div>
    </form>
  );
}

/** Form pengaturan Asisten AI Kiko & kontak handoff Admin (Prompt Chatbot FE). */
export function FormPengaturanChatbotAdmin({ awal }: { awal: KonfigurasiChatbot }) {
  const [aktif, setAktif] = useState(awal.chatbot_aktif);
  const [nama, setNama] = useState(awal.chatbot_nama);
  const [sapaan, setSapaan] = useState(awal.chatbot_sapaan);
  const [wa, setWa] = useState(awal.chatbot_kontak_wa);
  const [email, setEmail] = useState(awal.chatbot_kontak_email);
  const [galat, setGalat] = useState<string>();
  const [galatIsian, setGalatIsian] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setGalatIsian({});
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminSimpanPengaturanChatbot({
        chatbot_aktif: aktif,
        chatbot_nama: nama,
        chatbot_sapaan: sapaan,
        chatbot_kontak_wa: wa,
        chatbot_kontak_email: email,
      });
      if (res.galat) setGalat(res.galat);
      else if (res.galatIsian) setGalatIsian(res.galatIsian);
      else setInfo("Pengaturan asisten AI & live chat berhasil disimpan.");
    });
  };

  return (
    <form onSubmit={simpan} className="flex max-w-[680px] flex-col gap-5 rounded-card bg-surface p-6">
      <div>
        <h2 className="text-xl font-semibold">Asisten AI Kiko & Live Chat</h2>
        <p className="mt-1 text-sm text-text-muted">
          Atur ketersediaan widget Kiko, pesan sapaan pembuka, serta kontak WhatsApp dan email untuk bantuan Admin.
        </p>
      </div>

      <PesanFormulir galat={galat} info={info} />

      <label className="flex min-h-touch cursor-pointer items-center gap-3 font-bold">
        <input
          type="checkbox"
          checked={aktif}
          onChange={(e) => setAktif(e.target.checked)}
          className="size-5 accent-primary"
        />
        <span>Tampilkan widget asisten AI di seluruh website</span>
      </label>

      <Input
        id="chatbot_nama"
        label="Nama asisten"
        value={nama}
        galat={galatIsian.chatbot_nama}
        onChange={(e) => setNama(e.target.value)}
      />

      <Textarea
        id="chatbot_sapaan"
        label="Pesan sapaan pembuka"
        value={sapaan}
        maxLength={300}
        maksKarakter={300}
        panjangSaatIni={sapaan.length}
        galat={galatIsian.chatbot_sapaan}
        onChange={(e) => setSapaan(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="chatbot_kontak_wa"
          label="Nomor WhatsApp bantuan"
          petunjuk="Format angka diawali 62, contoh 6281100000001."
          value={wa}
          galat={galatIsian.chatbot_kontak_wa}
          onChange={(e) => setWa(e.target.value)}
        />
        <Input
          id="chatbot_kontak_email"
          type="email"
          label="Email bantuan"
          value={email}
          galat={galatIsian.chatbot_kontak_email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan pengaturan asisten"}
        </Tombol>
      </div>
    </form>
  );
}
