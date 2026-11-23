"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CalendarDays } from "lucide-react";
import type { Program } from "@/types/database";
import { aksiBukaKelas } from "@/lib/aksi/mengajar";
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format";
import { batasKapasitas, buatJadwal4Sesi } from "@/lib/mengajar";
import { skemaBukaKelas } from "@/lib/validasi/mengajar";
import { Input, Pilihan } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { Kelompok, PesanFormulir, fokusGalatPertama } from "@/components/auth/bagian";

type I = z.input<typeof skemaBukaKelas>;

export function FormBukaKelas({ programDisetujui, tanggalMin }: { programDisetujui: Program[]; tanggalMin: string }) {
  const { register, handleSubmit, setError, control, setValue, formState } = useForm<I>({
    resolver: zodResolver(skemaBukaKelas),
    shouldFocusError: false,
    defaultValues: {
      program_id: programDisetujui[0]?.id ?? "",
      level: 1,
      tanggal_mulai: tanggalMin,
      jam_mulai: "19:00",
      kapasitas: programDisetujui[0] ? batasKapasitas(programDisetujui[0].jenjang) : 10,
    },
  });

  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();
  const e = formState.errors;

  const programId = useWatch({ control, name: "program_id" });
  const tanggalMulai = useWatch({ control, name: "tanggal_mulai" });
  const jamMulai = useWatch({ control, name: "jam_mulai" });

  const programAktif = programDisetujui.find((p) => p.id === programId);
  const maksKapasitas = programAktif ? batasKapasitas(programAktif.jenjang) : 15;
  const jadwalPratinjau =
    programAktif && tanggalMulai && jamMulai ? buatJadwal4Sesi(tanggalMulai, jamMulai, programAktif.durasi_menit) : [];

  const kirim = (data: I) =>
    mulai(async () => {
      setGalat(undefined);
      const kap = Number(data.kapasitas);
      if (programAktif && kap > maksKapasitas) {
        setError("kapasitas", {
          message: `Kapasitas maksimal ${maksKapasitas} siswa untuk program ${programAktif.jenjang.join("/")}.`,
        });
        fokusGalatPertama();
        return;
      }
      const res = await aksiBukaKelas(data);
      if (res?.galatIsian) {
        for (const [k, v] of Object.entries(res.galatIsian)) setError(k as keyof I, { message: v });
        fokusGalatPertama();
      }
      if (res?.galat) setGalat(res.galat);
    });

  return (
    <form onSubmit={handleSubmit(kirim, fokusGalatPertama)} noValidate className="flex flex-col gap-5">
      <PesanFormulir galat={galat} />

      <Kelompok judul="Detail kelas">
        <Pilihan
          id="program_id"
          label="Program"
          galat={e.program_id?.message}
          {...register("program_id", {
            onChange: (ev) => {
              const pr = programDisetujui.find((p) => p.id === ev.target.value);
              if (pr) setValue("kapasitas", batasKapasitas(pr.jenjang));
            },
          })}
        >
          {programDisetujui.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} ({p.jenjang.join("/")} · {p.durasi_menit} menit · honor {formatRupiah(p.honor_per_sesi)}/sesi)
            </option>
          ))}
        </Pilihan>

        <div className="grid gap-4 sm:grid-cols-2">
          <Pilihan id="level" label="Level" galat={e.level?.message} {...register("level")}>
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </Pilihan>
          <Input
            id="kapasitas"
            type="number"
            min={1}
            max={maksKapasitas}
            label="Kapasitas maksimal siswa"
            petunjuk={`Maksimal ${maksKapasitas} siswa untuk ${programAktif?.jenjang.join("/") ?? "program ini"}.`}
            galat={e.kapasitas?.message}
            {...register("kapasitas")}
          />
        </div>
      </Kelompok>

      <Kelompok judul="Jadwal mingguan (4 sesi, zona WIB)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="tanggal_mulai"
            type="date"
            min={tanggalMin}
            label="Tanggal sesi pertama"
            galat={e.tanggal_mulai?.message}
            {...register("tanggal_mulai")}
          />
          <Input
            id="jam_mulai"
            type="time"
            label="Jam mulai (WIB)"
            petunjuk={programAktif ? `Durasi ${programAktif.durasi_menit} menit per sesi.` : undefined}
            galat={e.jam_mulai?.message}
            {...register("jam_mulai")}
          />
        </div>

        {jadwalPratinjau.length === 4 ? (
          <div className="rounded-card-sm bg-surface-sunken p-4">
            <p className="font-bold">Pratinjau 4 sesi yang akan dibuat</p>
            <ol className="mt-2 flex flex-col gap-2 text-sm">
              {jadwalPratinjau.map((s) => (
                <li key={s.nomor} className="flex items-center gap-2">
                  <CalendarDays aria-hidden className="size-4 shrink-0 text-primary" />
                  <span className="font-bold">Sesi {s.nomor}:</span>
                  <span>
                    {formatTanggal(s.mulai_pada)}, {formatJam(s.mulai_pada).replace(" WIB", "")}–{formatJam(s.selesai_pada)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-text-muted">
              Link Google Meet dibuat otomatis oleh sistem untuk keempat sesi setelah kelas dibuka.
            </p>
          </div>
        ) : null}
      </Kelompok>

      <div>
        <Tombol type="submit" ukuran="lg" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Membuka kelas & membuat Meet…" : "Buka kelas"}
        </Tombol>
      </div>
    </form>
  );
}
