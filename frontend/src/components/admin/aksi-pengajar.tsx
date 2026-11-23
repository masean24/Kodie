"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCircle2, XCircle } from "lucide-react";
import type { PengajarProgram, ProfilPengajar, Program, StatusPengguna } from "@/types/database";
import {
  aksiAdminNonaktifkanPengguna,
  aksiAdminSetujuiPengajar,
  aksiAdminTolakPengajar,
  aksiAdminWawancara,
} from "@/lib/aksi/admin";
import { bolehSetujuiPengajar } from "@/lib/admin";
import { Catatan } from "@/components/ui/dasar";
import { Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir } from "@/components/auth/bagian";

export function AksiVerifikasiPengajar({
  pengajarId,
  namaPengajar,
  statusSaatIni,
  profil,
  programDipilih,
  semuaProgram,
}: {
  pengajarId: string;
  namaPengajar: string;
  statusSaatIni: StatusPengguna;
  profil: ProfilPengajar | null;
  programDipilih: PengajarProgram[];
  semuaProgram: Program[];
}) {
  const [wawancara, setWawancara] = useState(profil?.wawancara_selesai ?? false);
  const [programIds, setProgramIds] = useState<string[]>(() => programDipilih.map((x) => x.program_id));
  const [mode, setMode] = useState<"tolak" | "nonaktif" | null>(null);
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState<string>();
  const [galatAlasan, setGalatAlasan] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const siapSetujui = bolehSetujuiPengajar(
    profil ? { ...profil, wawancara_selesai: wawancara } : null,
    programIds.length,
  );

  const ubahWawancara = (selesai: boolean) => {
    setWawancara(selesai);
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminWawancara(pengajarId, selesai);
      if (res.galat) {
        setWawancara(!selesai);
        setGalat(res.galat);
      } else {
        setInfo(selesai ? "Status wawancara ditandai selesai." : "Centang wawancara dibatalkan.");
      }
    });
  };

  const toggleProgram = (id: string) => {
    setProgramIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setujui = () =>
    mulai(async () => {
      setGalat(undefined);
      setInfo(undefined);
      const res = await aksiAdminSetujuiPengajar(pengajarId, programIds);
      if (res.galat) setGalat(res.galat);
      else setInfo(`${namaPengajar} sekarang berstatus terverifikasi dan dapat membuka kelas.`);
    });

  const kirimAlasan = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setGalatAlasan(undefined);
    setInfo(undefined);
    mulai(async () => {
      if (mode === "tolak") {
        const res = await aksiAdminTolakPengajar(pengajarId, alasan);
        if (res.galatIsian) setGalatAlasan(res.galatIsian.alasan);
        else if (res.galat) setGalat(res.galat);
        else {
          setInfo(`Pendaftaran ${namaPengajar} ditolak.`);
          setMode(null);
        }
      } else if (mode === "nonaktif") {
        const res = await aksiAdminNonaktifkanPengguna(pengajarId, alasan);
        if (res.galatIsian) setGalatAlasan(res.galatIsian.alasan);
        else if (res.galat) setGalat(res.galat);
        else {
          setInfo(
            `Akun ${namaPengajar} dinonaktifkan.${
              res.bookingTerdampak ? ` ${res.bookingTerdampak} booking aktif pada kelasnya terdampak.` : ""
            }`,
          );
          setMode(null);
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 rounded-card bg-surface p-6">
      <h2 className="text-xl font-semibold">Pemeriksaan & keputusan admin</h2>
      <PesanFormulir galat={galat} info={info} />

      <label className="flex min-h-touch cursor-pointer items-center gap-3 rounded-card-sm border border-border bg-surface-sunken px-4 py-3 font-bold">
        <input
          type="checkbox"
          checked={wawancara}
          disabled={menunggu}
          onChange={(e) => ubahWawancara(e.target.checked)}
          className="size-5 accent-primary"
        />
        <span>Wawancara selesai</span>
      </label>

      <fieldset>
        <legend className="font-bold">Program yang disetujui untuk diajar</legend>
        <p className="text-sm text-text-muted">Minimal 1 program harus dicentang sebelum menyetujui pengajar.</p>
        <div className="mt-2 flex flex-col gap-2">
          {semuaProgram.map((pr) => (
            <label
              key={pr.id}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle"
            >
              <input
                type="checkbox"
                checked={programIds.includes(pr.id)}
                onChange={() => toggleProgram(pr.id)}
                className="size-5 accent-primary"
              />
              <span className="font-semibold">{pr.nama}</span>
              <span className="text-sm text-text-muted">({pr.jenjang.join("/")})</span>
            </label>
          ))}
        </div>
      </fieldset>

      {!siapSetujui && statusSaatIni === "menunggu_verifikasi" ? (
        <Catatan nada="peringatan" judul="Syarat setujui belum lengkap">
          <p>
            Tombol Setujui aktif setelah KTP/KTM diunggah, SKCK diunggah, wawancara dicentang, dan minimal 1 program
            dipilih (PRD F7).
          </p>
        </Catatan>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {statusSaatIni !== "terverifikasi" ? (
          <Tombol onClick={setujui} disabled={!siapSetujui || menunggu} aria-busy={menunggu}>
            <CheckCircle2 aria-hidden className="size-5" /> Setujui pengajar
          </Tombol>
        ) : null}
        {statusSaatIni === "menunggu_verifikasi" ? (
          <Tombol varian="bahaya" onClick={() => setMode("tolak")} disabled={menunggu}>
            <XCircle aria-hidden className="size-5" /> Tolak
          </Tombol>
        ) : null}
        {statusSaatIni !== "nonaktif" ? (
          <Tombol varian="kedua" onClick={() => setMode("nonaktif")} disabled={menunggu}>
            <Ban aria-hidden className="size-5" /> Nonaktifkan pengajar
          </Tombol>
        ) : null}
      </div>

      {mode ? (
        <form onSubmit={kirimAlasan} noValidate className="flex flex-col gap-3 rounded-card-sm bg-danger-subtle p-4">
          <Textarea
            id="alasan-pengajar"
            label={mode === "tolak" ? "Alasan penolakan (wajib)" : "Alasan penonaktifan (wajib)"}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            maxLength={500}
            maksKarakter={500}
            panjangSaatIni={alasan.length}
            galat={galatAlasan}
          />
          <div className="flex flex-wrap gap-2">
            <Tombol type="submit" varian="bahaya" disabled={menunggu} aria-busy={menunggu}>
              {menunggu ? "Memproses…" : mode === "tolak" ? "Konfirmasi tolak" : "Konfirmasi nonaktifkan"}
            </Tombol>
            <Tombol
              varian="kedua"
              onClick={() => {
                setMode(null);
                setGalatAlasan(undefined);
              }}
            >
              Batal
            </Tombol>
          </div>
        </form>
      ) : null}
    </div>
  );
}
