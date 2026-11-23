"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { aksiAdminSetujuiPembayaran, aksiAdminTolakPembayaran } from "@/lib/aksi/admin";
import { Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir } from "@/components/auth/bagian";

export function AksiVerifikasiPembayaran({
  pembayaranId,
  kodeBooking,
  statusSaatIni,
}: {
  pembayaranId: string;
  kodeBooking: string;
  statusSaatIni: "menunggu" | "disetujui" | "ditolak";
}) {
  const [modeTolak, setModeTolak] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState<string>();
  const [galatAlasan, setGalatAlasan] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  if (statusSaatIni !== "menunggu") {
    return (
      <p className="text-sm text-text-muted">
        Pembayaran untuk {kodeBooking} sudah diputuskan ({statusSaatIni}).
      </p>
    );
  }

  const setujui = () =>
    mulai(async () => {
      setGalat(undefined);
      setInfo(undefined);
      const res = await aksiAdminSetujuiPembayaran(pembayaranId);
      if (res.galat) setGalat(res.galat);
      else setInfo(`Pembayaran ${kodeBooking} disetujui. Status booking sekarang terkonfirmasi.`);
    });

  const tolak = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setGalatAlasan(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminTolakPembayaran(pembayaranId, alasan);
      if (res.galatIsian) {
        setGalatAlasan(res.galatIsian.alasan);
        return;
      }
      if (res.galat) {
        setGalat(res.galat);
        return;
      }
      setInfo(`Bukti bayar ${kodeBooking} ditolak. Pengguna diberi 24 jam baru untuk mengunggah ulang.`);
      setModeTolak(false);
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <h2 className="text-xl font-semibold">Keputusan admin</h2>
      <PesanFormulir galat={galat} info={info} />

      {!info ? (
        <>
          <div className="flex flex-wrap gap-3">
            <Tombol onClick={setujui} disabled={menunggu} aria-busy={menunggu}>
              <CheckCircle2 aria-hidden className="size-5" />
              {menunggu && !modeTolak ? "Menyetujui…" : "Setujui pembayaran"}
            </Tombol>
            {!modeTolak ? (
              <Tombol varian="bahaya" onClick={() => setModeTolak(true)} disabled={menunggu}>
                <XCircle aria-hidden className="size-5" /> Tolak bukti bayar
              </Tombol>
            ) : null}
          </div>

          {modeTolak ? (
            <form onSubmit={tolak} noValidate className="flex flex-col gap-3 rounded-card-sm bg-danger-subtle p-4">
              <Textarea
                id="alasan-tolak-bayar"
                label="Alasan penolakan (wajib)"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                maxLength={500}
                maksKarakter={500}
                panjangSaatIni={alasan.length}
                petunjuk="Alasan ini langsung tampil di halaman booking pengguna."
                galat={galatAlasan}
                placeholder="Contoh: Nominal transfer kurang Rp50.000 atau foto bukti buram."
              />
              <div className="flex flex-wrap gap-2">
                <Tombol type="submit" varian="bahaya" disabled={menunggu} aria-busy={menunggu}>
                  {menunggu ? "Menolak…" : "Konfirmasi tolak"}
                </Tombol>
                <Tombol
                  varian="kedua"
                  onClick={() => {
                    setModeTolak(false);
                    setGalatAlasan(undefined);
                  }}
                >
                  Batal
                </Tombol>
              </div>
            </form>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
