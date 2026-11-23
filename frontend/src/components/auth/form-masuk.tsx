"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aksiMasuk } from "@/app/(auth)/aksi";
import { skemaMasuk, type InputMasuk } from "@/lib/validasi/auth";
import { Input } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { KartuAuth, PesanFormulir, fokusGalatPertama } from "./bagian";

export function FormMasuk({
  lanjut,
  akunMock,
  ringkas,
}: {
  lanjut: string | null;
  akunMock?: string[];
  /** Hanya formulir, tanpa kartu dan judul (dipakai di halaman persetujuan). */
  ringkas?: boolean;
}) {
  const [galat, setGalat] = useState<string>();
  const [menunggu, mulai] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InputMasuk>({ resolver: zodResolver(skemaMasuk), shouldFocusError: false });

  const kirim = handleSubmit((data) => {
    setGalat(undefined);
    mulai(async () => {
      const hasil = await aksiMasuk(data, lanjut);
      if (hasil?.galatIsian) {
        for (const [k, v] of Object.entries(hasil.galatIsian)) setError(k as keyof InputMasuk, { message: v });
      }
      if (hasil?.galat) setGalat(hasil.galat);
    });
  }, fokusGalatPertama);

  const form = (
      <form onSubmit={kirim} noValidate className={ringkas ? "flex flex-col gap-4" : "mt-6 flex flex-col gap-4 rounded-card-sm bg-surface p-5"}>
        <PesanFormulir galat={galat} />
        <Input id="email" type="email" label="Email" autoComplete="email" galat={errors.email?.message} {...register("email")} />
        <Input
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          galat={errors.password?.message}
          {...register("password")}
        />
        <Tombol type="submit" ukuran="lg" disabled={menunggu} aria-busy={menunggu} className="mt-2 w-full">
          {menunggu ? "Memeriksa…" : "Masuk"}
        </Tombol>
      </form>
  );
  if (ringkas) return form;

  return (
    <KartuAuth>
      <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Masuk</h1>
      <p className="mt-2 text-text-muted">Masuk untuk memesan kelas, melihat laporan, atau mengajar.</p>
      {form}
      <p className="mt-6 text-center">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-display font-semibold text-primary underline-offset-4 hover:underline">
          Daftar
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-text-muted">Lupa password? Hubungi admin Kodie.</p>
      {akunMock ? (
        <details className="mt-6 rounded-card-sm bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-bold">Mode mock: akun contoh</summary>
          <p className="mt-2">Password semua akun: kodie-mock-123</p>
          <ul className="mt-1 list-disc pl-5">
            {akunMock.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </KartuAuth>
  );
}
