"use client";

import { useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { aksiGeserSesi } from "@/lib/aksi/mengajar";
import { Input } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";

function keTanggalJamWib(iso: string): { tanggal: string; jam: string } {
  const d = new Date(iso);
  const tanggal = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "19";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return { tanggal, jam: `${h}:${m}` };
}

/** Form geser jadwal satu sesi (PRD F8), aktif maksimal H-1 sebelum sesi dimulai. */
export function FormGeserSesi({ sesiId, mulaiPada }: { sesiId: string; mulaiPada: string }) {
  const awal = keTanggalJamWib(mulaiPada);
  const [buka, setBuka] = useState(false);
  const [tanggal, setTanggal] = useState(awal.tanggal);
  const [jam, setJam] = useState(awal.jam);
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  if (!buka) {
    return (
      <div className="flex flex-col gap-1">
        <Tombol varian="kedua" onClick={() => setBuka(true)} aria-expanded={false}>
          <CalendarClock aria-hidden className="size-4" /> Geser jadwal
        </Tombol>
        {info ? (
          <p aria-live="polite" className="text-sm font-bold text-success">
            {info}
          </p>
        ) : null}
      </div>
    );
  }

  const simpan = () =>
    mulai(async () => {
      setGalat(undefined);
      setInfo(undefined);
      const res = await aksiGeserSesi(sesiId, { tanggal, jam });
      if (res.galat) {
        setGalat(res.galat);
        return;
      }
      if (res.galatIsian) {
        setGalat(Object.values(res.galatIsian)[0]);
        return;
      }
      setInfo("Jadwal sesi diperbarui. Link Meet tetap sama.");
      setBuka(false);
    });

  return (
    <div className="mt-3 w-full rounded-card-sm border border-border bg-surface-sunken p-4">
      <p className="font-display font-semibold">Geser jadwal sesi (WIB)</p>
      <p className="mt-1 text-sm text-text-muted">
        Link Google Meet sesi ini tetap dipakai. Siswa dan orang tua akan mendapat notifikasi.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input id={`tgl-${sesiId}`} type="date" label="Tanggal baru" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        <Input id={`jam-${sesiId}`} type="time" label="Jam baru (WIB)" value={jam} onChange={(e) => setJam(e.target.value)} />
      </div>
      {galat ? (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Tombol onClick={simpan} disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan jadwal baru"}
        </Tombol>
        <Tombol
          varian="kedua"
          onClick={() => {
            setBuka(false);
            setGalat(undefined);
          }}
        >
          Batal
        </Tombol>
      </div>
    </div>
  );
}
