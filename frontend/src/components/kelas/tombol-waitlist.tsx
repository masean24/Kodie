"use client";

import { useState, useTransition } from "react";
import { BellRing } from "lucide-react";
import type { WaitlistKelas } from "@/types/database";
import { aksiBatalWaitlist, aksiDaftarWaitlist } from "@/lib/aksi/waitlist";
import { Pilihan } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";

/**
 * Pengganti status "Kelas penuh" di detail kelas: masuk atau keluar daftar tunggu. Orang tua memilih anak dulu;
 * siswa terdaftar untuk dirinya sendiri. Notifikasi dikirim backend saat kursi kembali tersedia.
 */
export function TombolWaitlist({
  kelasId,
  waitlist,
  anak,
}: {
  kelasId: string;
  waitlist: WaitlistKelas | null;
  /** Diisi untuk orang tua: anak yang boleh dipilih. Kosong/undefined untuk siswa. */
  anak?: { id: string; nama: string }[];
}) {
  const [siswaId, setSiswaId] = useState(anak?.[0]?.id ?? "");
  const [pesan, setPesan] = useState<{ galat?: string; info?: string }>({});
  const [menunggu, mulai] = useTransition();

  const kirim = (fn: () => Promise<{ galat?: string; info?: string }>) =>
    mulai(async () => {
      setPesan(await fn());
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-card-sm bg-surface-sunken px-4 py-3 text-sm">
        <span className="font-bold">Kelas penuh.</span> Masuk daftar tunggu, nanti kami beri notifikasi begitu ada kursi kosong.
      </p>
      {waitlist ? (
        <>
          <p className="flex items-center gap-2 font-bold text-success">
            <BellRing aria-hidden className="size-5" /> Anda ada di daftar tunggu
          </p>
          <Tombol
            varian="kedua"
            ukuran="lg"
            className="w-full"
            disabled={menunggu}
            aria-busy={menunggu}
            onClick={() => kirim(() => aksiBatalWaitlist(kelasId))}
          >
            {menunggu ? "Memproses…" : "Keluar dari daftar tunggu"}
          </Tombol>
        </>
      ) : (
        <>
          {anak ? (
            anak.length > 0 ? (
              <Pilihan id="waitlist-anak" label="Untuk anak" value={siswaId} onChange={(e) => setSiswaId(e.target.value)}>
                {anak.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama}
                  </option>
                ))}
              </Pilihan>
            ) : (
              <p className="text-sm text-text-muted">Tambahkan profil anak dulu di dashboard untuk masuk daftar tunggu.</p>
            )
          ) : null}
          <Tombol
            ukuran="lg"
            className="w-full"
            disabled={menunggu || (anak !== undefined && !siswaId)}
            aria-busy={menunggu}
            onClick={() => kirim(() => aksiDaftarWaitlist(kelasId, anak ? siswaId : null))}
          >
            <BellRing aria-hidden className="size-5" />
            {menunggu ? "Memproses…" : "Masuk daftar tunggu"}
          </Tombol>
        </>
      )}
      <p aria-live="polite" className={pesan.galat ? "text-sm font-bold text-danger" : "text-sm text-text-muted"}>
        {pesan.galat ?? pesan.info ?? ""}
      </p>
    </div>
  );
}
