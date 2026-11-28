"use client";

import { useState, useTransition } from "react";
import { FileText, GraduationCap, ShieldCheck } from "lucide-react";
import type { Bidang, LaporanSesi, LaporanSiswa, RaporJurusan } from "@/types/database";
import { aksiKirimLaporan } from "@/lib/aksi/mengajar";
import type { SiswaRingkas } from "@/lib/api/booking";
import { SKOR_BIDANG_URUT } from "@/lib/mengajar";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { BIDANG_PILIHAN } from "@/lib/validasi/auth";
import { Input, Pilihan, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir, fokusGalatPertama } from "@/components/auth/bagian";
import { labelKelas } from "@/lib/format";

type StateSiswa = {
  siswa_id: string;
  hadir: boolean;
  catatan: string;
  karya_url: string;
};

type StateRapor = {
  siswa_id: string;
  skor_software: number;
  skor_jaringan: number;
  skor_iot: number;
  skor_ai_data: number;
  bidang_rekomendasi: Bidang;
  alasan: string;
  saran: string;
};

/**
 * Form laporan setelah kelas (F10, Figma 10) + rapor rekomendasi jurusan sesi ke-4 Simulasi Jurusan IT (F11).
 */
export function FormLaporan({
  sesiId,
  siswa,
  laporanAwal,
  laporanSiswaAwal,
  raporAwal,
  wajibRapor,
}: {
  sesiId: string;
  siswa: SiswaRingkas[];
  laporanAwal: LaporanSesi | null;
  laporanSiswaAwal: LaporanSiswa[];
  raporAwal: RaporJurusan[];
  wajibRapor: boolean;
}) {
  const [ringkasan, setRingkasan] = useState(laporanAwal?.ringkasan ?? "");
  const [rekamanUrl, setRekamanUrl] = useState(laporanAwal?.rekaman_url ?? "");
  const [kendala, setKendala] = useState(laporanAwal?.kendala ?? "");

  const [isianSiswa, setIsianSiswa] = useState<StateSiswa[]>(() =>
    siswa.map((s) => {
      const ada = laporanSiswaAwal.find((x) => x.siswa_id === s.id);
      return {
        siswa_id: s.id,
        hadir: ada ? ada.hadir : true,
        catatan: ada?.catatan ?? "",
        karya_url: ada?.karya_url ?? "",
      };
    }),
  );

  const [isianRapor, setIsianRapor] = useState<Record<string, StateRapor>>(() => {
    const awal: Record<string, StateRapor> = {};
    for (const s of siswa) {
      const r = raporAwal.find((x) => x.siswa_id === s.id);
      awal[s.id] = {
        siswa_id: s.id,
        skor_software: r?.skor_software ?? 4,
        skor_jaringan: r?.skor_jaringan ?? 3,
        skor_iot: r?.skor_iot ?? 3,
        skor_ai_data: r?.skor_ai_data ?? 3,
        bidang_rekomendasi: r?.bidang_rekomendasi ?? "software",
        alasan: r?.alasan ?? "",
        saran: r?.saran ?? "",
      };
    }
    return awal;
  });

  const [galat, setGalat] = useState<string>();
  const [galatIsian, setGalatIsian] = useState<Record<string, string>>({});
  const [menunggu, mulai] = useTransition();

  const ubahSiswa = (idx: number, patch: Partial<StateSiswa>) => {
    setIsianSiswa((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const ubahRapor = (siswaId: string, patch: Partial<StateRapor>) => {
    setIsianRapor((prev) => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], ...patch },
    }));
  };

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setGalatIsian({});

    const hadirIds = new Set(isianSiswa.filter((x) => x.hadir).map((x) => x.siswa_id));
    const raporPayload = wajibRapor ? isianSiswa.filter((x) => hadirIds.has(x.siswa_id)).map((x) => isianRapor[x.siswa_id]) : [];

    mulai(async () => {
      const res = await aksiKirimLaporan(sesiId, wajibRapor, {
        ringkasan,
        rekaman_url: rekamanUrl,
        kendala,
        siswa: isianSiswa,
        rapor: raporPayload,
      });
      if (res?.galatIsian) {
        // Petakan index array `rapor.0.alasan` agar mudah ditampilkan di kartu siswa masing-masing.
        const dipetakan: Record<string, string> = { ...res.galatIsian };
        if (wajibRapor) {
          const daftarHadir = isianSiswa.filter((x) => x.hadir);
          for (const [k, v] of Object.entries(res.galatIsian)) {
            const m = k.match(/^rapor\.(\d+)\.(.+)$/);
            if (m) {
              const sId = daftarHadir[Number(m[1])]?.siswa_id;
              if (sId) dipetakan[`rapor.${sId}.${m[2]}`] = v;
            }
          }
        }
        setGalatIsian(dipetakan);
        fokusGalatPertama();
      }
      if (res?.galat) setGalat(res.galat);
    });
  };

  return (
    <form onSubmit={kirim} noValidate className="flex max-w-[820px] flex-col gap-5">
      <PesanFormulir galat={galat} />

      <section aria-labelledby="judul-tentang-sesi" className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <h2 id="judul-tentang-sesi" className="flex items-center gap-3 text-xl font-semibold">
          <FileText aria-hidden className="size-6 shrink-0 text-primary" />
          Tentang sesi
        </h2>

        <Textarea
          id="ringkasan"
          label="Ringkasan materi"
          value={ringkasan}
          onChange={(e) => setRingkasan(e.target.value)}
          maxLength={500}
          maksKarakter={500}
          panjangSaatIni={ringkasan.length}
          petunjuk="Wajib. Maksimal 500 karakter."
          galat={galatIsian.ringkasan}
          placeholder="Contoh: Membuat animasi kucing berjalan dengan blok perulangan…"
        />

        <Input
          id="rekaman_url"
          type="url"
          label="Link rekaman sesi (opsional)"
          value={rekamanUrl}
          onChange={(e) => setRekamanUrl(e.target.value)}
          placeholder="https://"
          petunjuk="Kosongkan jika sesi tidak direkam."
          galat={galatIsian.rekaman_url}
        />

        <Input
          id="kendala"
          label="Kendala (opsional)"
          value={kendala}
          onChange={(e) => setKendala(e.target.value)}
          maxLength={500}
          placeholder="Contoh: dua siswa terlambat karena sinyal"
          galat={galatIsian.kendala}
        />
      </section>

      <section aria-labelledby="judul-laporan-siswa" className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <h2 id="judul-laporan-siswa" className="flex items-center gap-3 text-xl font-semibold">
          <ShieldCheck aria-hidden className="size-6 shrink-0 text-primary" />
          Siswa ({siswa.length} peserta)
        </h2>

        {siswa.length === 0 ? (
          <p className="text-text-muted">Belum ada siswa terkonfirmasi di kelas ini.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {siswa.map((s, idx) => {
              const st = isianSiswa[idx];
              const rapor = isianRapor[s.id];
              return (
                <div key={s.id} className="flex flex-col gap-3 rounded-md bg-surface-sunken p-4">
                  <div>
                    <p className="font-bold">{s.nama}</p>
                    <p className="text-sm text-text-muted">
                      {labelKelas(s.jenjang, s.kelas)}
                    </p>
                  </div>

                  <fieldset>
                    <legend className="sr-only">Kehadiran {s.nama}</legend>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex min-h-touch cursor-pointer items-center gap-2 px-1">
                        <input
                          type="radio"
                          name={`hadir-${s.id}`}
                          checked={st.hadir}
                          onChange={() => ubahSiswa(idx, { hadir: true })}
                          className="size-5 accent-primary"
                        />
                        <span>Hadir</span>
                      </label>
                      <label className="flex min-h-touch cursor-pointer items-center gap-2 px-1">
                        <input
                          type="radio"
                          name={`hadir-${s.id}`}
                          checked={!st.hadir}
                          onChange={() => ubahSiswa(idx, { hadir: false })}
                          className="size-5 accent-primary"
                        />
                        <span>Tidak hadir</span>
                      </label>
                    </div>
                  </fieldset>

                  {st.hadir ? (
                    <>
                      <Textarea
                        id={`catatan-${s.id}`}
                        label="Catatan untuk siswa"
                        value={st.catatan}
                        onChange={(e) => ubahSiswa(idx, { catatan: e.target.value })}
                        maxLength={300}
                        maksKarakter={300}
                        panjangSaatIni={st.catatan.length}
                        petunjuk="Wajib jika hadir. Maksimal 300 karakter. Hanya dilihat siswa ini dan orang tuanya."
                        galat={galatIsian[`siswa.${idx}.catatan`]}
                      />
                      <Input
                        id={`karya-${s.id}`}
                        type="url"
                        label="Link hasil karya (opsional)"
                        value={st.karya_url}
                        onChange={(e) => ubahSiswa(idx, { karya_url: e.target.value })}
                        placeholder="https://scratch.mit.edu/projects/…"
                        galat={galatIsian[`siswa.${idx}.karya_url`]}
                      />

                      {wajibRapor ? (
                        <div className="mt-2 flex flex-col gap-4 rounded-card-sm border border-primary/30 bg-surface p-4">
                          <div className="flex items-center gap-2">
                            <GraduationCap aria-hidden className="size-5 text-primary" />
                            <h3 className="text-lg font-semibold">Rapor rekomendasi jurusan</h3>
                          </div>
                          <p className="text-sm text-text-muted">
                            Wajib diisi untuk sesi ke-4 Simulasi Jurusan IT. Skor 1 (kurang tertarik) sampai 5 (sangat cocok).
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {SKOR_BIDANG_URUT.map(({ key, bidang }) => (
                              <Pilihan
                                key={key}
                                id={`${key}-${s.id}`}
                                label={NAMA_BIDANG[bidang]}
                                value={rapor[key]}
                                onChange={(e) => ubahRapor(s.id, { [key]: Number(e.target.value) })}
                                galat={galatIsian[`rapor.${s.id}.${key}`]}
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n} / 5
                                  </option>
                                ))}
                              </Pilihan>
                            ))}
                          </div>

                          <Pilihan
                            id={`bidang-${s.id}`}
                            label="Bidang yang direkomendasikan"
                            value={rapor.bidang_rekomendasi}
                            onChange={(e) => ubahRapor(s.id, { bidang_rekomendasi: e.target.value as Bidang })}
                            galat={galatIsian[`rapor.${s.id}.bidang_rekomendasi`]}
                          >
                            {BIDANG_PILIHAN.map((b) => (
                              <option key={b} value={b}>
                                {NAMA_BIDANG[b]}
                              </option>
                            ))}
                          </Pilihan>

                          <Textarea
                            id={`alasan-${s.id}`}
                            label="Alasan rekomendasi"
                            value={rapor.alasan}
                            onChange={(e) => ubahRapor(s.id, { alasan: e.target.value })}
                            maxLength={1000}
                            maksKarakter={1000}
                            panjangSaatIni={rapor.alasan.length}
                            petunjuk="Wajib. Maksimal 1.000 karakter."
                            galat={galatIsian[`rapor.${s.id}.alasan`]}
                          />

                          <Textarea
                            id={`saran-${s.id}`}
                            label="Saran langkah berikutnya"
                            value={rapor.saran}
                            onChange={(e) => ubahRapor(s.id, { saran: e.target.value })}
                            maxLength={500}
                            maksKarakter={500}
                            panjangSaatIni={rapor.saran.length}
                            petunjuk="Wajib. Maksimal 500 karakter."
                            galat={galatIsian[`rapor.${s.id}.saran`]}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-text-muted">Tidak perlu catatan untuk siswa yang tidak hadir.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Tombol type="submit" ukuran="lg" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Menyimpan laporan…" : laporanAwal ? "Simpan perubahan" : "Kirim laporan"}
        </Tombol>
      </div>
    </form>
  );
}
