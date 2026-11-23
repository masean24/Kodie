"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { JawabanMinat, KodeOpsi, SoalMinatPublik } from "@/types/database";
import { aksiHitungTesMinat } from "@/lib/aksi/akun";
import { cx } from "@/lib/cx";
import { Tombol, TombolTautan } from "@/components/ui/tombol";
import { Pilihan } from "@/components/ui/formulir";
import { bacaJawaban, simpanHasil, simpanJawaban } from "./penyimpanan";

/** Siapa yang mengerjakan tes (PRD F4). Tamu: hasil tidak disimpan. */
export type Peserta =
  | { mode: "tamu" }
  | { mode: "siswa"; siswaId: string | null; nama: string }
  | { mode: "orang_tua"; anak: { id: string; nama: string; jenjang: string; kelas: number }[] };

export function Kuis({ soal, peserta }: { soal: SoalMinatPublik[]; peserta: Peserta }) {
  const [anakId, setAnakId] = useState<string | null>(null);
  const [pilihan, setPilihan] = useState("");
  const [galat, setGalat] = useState(false);

  if (peserta.mode === "siswa") {
    return <KuisInti soal={soal} siswaId={peserta.siswaId} namaPeserta={peserta.siswaId ? peserta.nama : undefined} />;
  }
  if (peserta.mode === "tamu") return <KuisInti soal={soal} siswaId={null} />;

  const anak = peserta.anak.find((a) => a.id === anakId);
  if (anak) {
    return <KuisInti key={anak.id} soal={soal} siswaId={anak.id} namaPeserta={anak.nama} gantiPeserta={() => setAnakId(null)} />;
  }

  return (
    <div className="mx-auto max-w-[700px] rounded-card bg-gradient-to-b from-primary-subtle to-surface-sunken p-5 md:p-12">
      <h2 className="text-[26px] leading-8 font-extrabold md:text-[36px] md:leading-[42px]">Tes minat untuk anak siapa?</h2>
      <p className="mt-3 text-text-muted">Hasilnya disimpan di profil anak dan dipakai untuk rekomendasi program sesuai jenjangnya.</p>
      {peserta.anak.length === 0 ? (
        <div className="mt-6 rounded-card-sm bg-surface p-5">
          <p>Belum ada profil anak. Tambahkan dulu, lalu kembali ke sini.</p>
          <TombolTautan href="/orang-tua/anak" className="mt-4">
            Tambah anak
          </TombolTautan>
        </div>
      ) : (
        <form
          className="mt-6 flex flex-col gap-4 rounded-card-sm bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pilihan) setGalat(true);
            else setAnakId(pilihan);
          }}
        >
          <Pilihan
            id="pilih-anak"
            label="Pilih anak"
            value={pilihan}
            galat={galat ? "Pilih salah satu anak." : undefined}
            onChange={(e) => {
              setPilihan(e.target.value);
              setGalat(false);
            }}
          >
            <option value="">Pilih anak</option>
            {peserta.anak.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nama} ({a.jenjang} kelas {a.kelas})
              </option>
            ))}
          </Pilihan>
          <div>
            <Tombol type="submit">Mulai tes</Tombol>
          </div>
        </form>
      )}
    </div>
  );
}

function KuisInti({
  soal,
  siswaId,
  namaPeserta,
  gantiPeserta,
}: {
  soal: SoalMinatPublik[];
  siswaId: string | null;
  namaPeserta?: string;
  gantiPeserta?: () => void;
}) {
  const router = useRouter();
  const total = soal.length;
  const [indeks, setIndeks] = useState(0);
  const [jawaban, setJawaban] = useState<JawabanMinat>({});
  const [galat, setGalat] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const pernahPindah = useRef(false);

  useEffect(() => {
    const tersimpan = bacaJawaban();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memulihkan jawaban dari sessionStorage setelah hidrasi
    if (tersimpan) setJawaban(tersimpan);
  }, []);

  useEffect(() => {
    if (pernahPindah.current) judulRef.current?.focus();
    pernahPindah.current = true;
  }, [indeks]);

  const s = soal[indeks];
  const terjawab = soal.filter((x) => jawaban[String(x.urutan)]).length;
  const terakhir = indeks === total - 1;
  const dipilih = jawaban[String(s.urutan)];

  function pilih(kode: KodeOpsi) {
    const baru = { ...jawaban, [String(s.urutan)]: kode };
    setJawaban(baru);
    simpanJawaban(baru);
    setGalat(null);
  }

  async function lihatHasil() {
    const belum = soal.filter((x) => !jawaban[String(x.urutan)]);
    if (belum.length > 0) {
      setGalat(`Masih ada ${belum.length} soal yang belum dijawab: nomor ${belum.map((x) => x.urutan).join(", ")}.`);
      setIndeks(soal.indexOf(belum[0]));
      return;
    }
    setMengirim(true);
    const hasil = await aksiHitungTesMinat(jawaban, siswaId);
    if ("galat" in hasil) {
      setGalat(hasil.galat);
      setMengirim(false);
      return;
    }
    simpanHasil(hasil.hasil);
    router.push("/tes-minat/hasil");
  }

  return (
    <div className="mx-auto max-w-[700px] rounded-card bg-gradient-to-b from-primary-subtle to-surface-sunken p-5 md:p-12">
      {namaPeserta ? (
        <p className="mb-4 text-sm">
          Tes untuk <span className="font-bold">{namaPeserta}</span>. Hasil tersimpan di profilnya.
          {gantiPeserta ? (
            <>
              {" "}
              <button type="button" onClick={gantiPeserta} className="min-h-touch font-bold text-primary underline-offset-4 hover:underline">
                Ganti anak
              </button>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="flex items-center justify-between text-sm">
        <p className="font-bold text-primary">
          Soal {indeks + 1} dari {total}
        </p>
        <p className="text-text-muted" aria-live="polite">
          {terjawab} sudah dijawab
        </p>
      </div>
      <ol aria-label="Kemajuan tes" className="mt-3 flex gap-1">
        {soal.map((x, i) => {
          const sudah = Boolean(jawaban[String(x.urutan)]);
          return (
            <li key={x.id} className="flex-1">
              <button
                type="button"
                onClick={() => setIndeks(i)}
                aria-label={`Soal ${x.urutan}${sudah ? ", sudah dijawab" : ", belum dijawab"}`}
                aria-current={i === indeks ? "step" : undefined}
                className="flex h-touch w-full items-center"
              >
                <span
                  className={cx(
                    "block h-2.5 w-full rounded-full",
                    i === indeks
                      ? "bg-surface ring-2 ring-primary"
                      : sudah
                        ? "bg-accent ring-1 ring-[#0f172a]/20"
                        : "bg-neutral-subtle",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>

      <fieldset className="mt-6">
        <legend className="contents">
          <h2 ref={judulRef} tabIndex={-1} className="text-[26px] leading-8 font-extrabold focus:outline-none md:text-[36px] md:leading-[42px]">
            {s.teks}
          </h2>
        </legend>
        <p className="mt-4 text-text-muted">Pilih satu jawaban yang paling mirip denganmu. Tidak ada jawaban benar atau salah.</p>
        <div className="mt-6 flex flex-col gap-3">
          {s.opsi.map((o) => {
            const aktif = dipilih === o.kode;
            return (
              <label
                key={o.kode}
                className={cx(
                  "flex min-h-[60px] cursor-pointer items-center gap-4 rounded-card-sm border-[1.5px] bg-surface px-5 py-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                  aktif ? "border-primary bg-primary-subtle font-bold text-primary" : "border-transparent hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name={`soal-${s.urutan}`}
                  value={o.kode}
                  checked={aktif}
                  onChange={() => pilih(o.kode)}
                  className="size-5 shrink-0 accent-primary"
                />
                {o.teks}
              </label>
            );
          })}
        </div>
      </fieldset>

      {galat ? (
        <p role="alert" className="mt-6 rounded-card-sm bg-danger-subtle p-4 font-bold text-danger">
          {galat}
        </p>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Tombol varian="kedua" onClick={() => setIndeks((i) => Math.max(0, i - 1))} disabled={indeks === 0}>
          Kembali
        </Tombol>
        {terakhir ? (
          <Tombol onClick={lihatHasil} disabled={mengirim} aria-busy={mengirim}>
            {mengirim ? "Menghitung…" : "Lihat hasil"}
          </Tombol>
        ) : (
          <Tombol onClick={() => setIndeks((i) => Math.min(total - 1, i + 1))}>Soal berikutnya</Tombol>
        )}
      </div>
      <p className="mt-6 text-sm text-text-muted">Semua {total} soal wajib dijawab sebelum hasil keluar.</p>
    </div>
  );
}
