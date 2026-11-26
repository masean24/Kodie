"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aksiMasuk } from "@/app/(auth)/aksi";
import { skemaMasuk, type InputMasuk } from "@/lib/validasi/auth";
import { Input } from "@/components/ui/formulir";
import { InputPassword } from "@/components/ui/input-password";
import { Tombol } from "@/components/ui/tombol";
import { KartuAuth, PesanFormulir, fokusGalatPertama } from "./bagian";

export function FormMasuk({
  lanjut,
  akunMock,
  infoDemo,
  ringkas,
  passwordDiubah,
}: {
  lanjut: string | null;
  akunMock?: string[];
  infoDemo?: { judul: string; password: string; akun: string[] };
  /** Hanya formulir, tanpa kartu dan judul (dipakai di halaman persetujuan). */
  ringkas?: boolean;
  /** Setelah atur ulang password berhasil (`/masuk?password=diubah`). */
  passwordDiubah?: boolean;
}) {
  const demo = infoDemo ?? (akunMock ? { judul: "Mode mock: akun contoh", password: "kodie-mock-123", akun: akunMock } : undefined);
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

  // method="post": jika form terkirim sebelum React selesai hidrasi, browser tidak menaruh
  // email dan password di URL (GET bawaan). Hal yang sama berlaku di form daftar.
  const form = (
      <form method="post" onSubmit={kirim} noValidate className={ringkas ? "flex flex-col gap-4" : "mt-6 flex flex-col gap-4 rounded-card-sm bg-surface p-5"}>
        <PesanFormulir galat={galat} />
        <Input id="email" type="email" label="Email" autoComplete="email" galat={errors.email?.message} {...register("email")} />
        <InputPassword
          id="password"
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
      <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">Masuk</h1>
      <p className="mt-2 text-text-muted">Masuk untuk memesan kelas, melihat laporan, atau mengajar.</p>
      {passwordDiubah ? (
        <p role="status" className="mt-4 rounded-card-sm bg-success-subtle px-4 py-3 text-sm font-bold text-text">
          Password baru tersimpan. Silakan masuk dengan password baru Anda.
        </p>
      ) : null}
      {lanjut ? (
        <p role="status" className="mt-4 rounded-card-sm bg-primary-subtle px-4 py-3 text-sm font-bold text-text">
          Masuk dulu untuk melanjutkan ke halaman yang tadi Anda buka.
        </p>
      ) : null}
      {form}
      <p className="mt-6 text-center">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-display font-semibold text-primary underline-offset-4 hover:underline">
          Daftar
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/lupa-password" className="font-bold text-primary underline-offset-4 hover:underline">
          Lupa password?
        </Link>
      </p>
      {demo ? (
        <details className="mt-6 rounded-card-sm bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-bold">{demo.judul}</summary>
          <p className="mt-2">Password semua akun: {demo.password}</p>
          <ul className="mt-1 list-disc pl-5">
            {demo.akun.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </KartuAuth>
  );
}
