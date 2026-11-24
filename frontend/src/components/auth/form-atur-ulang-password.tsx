"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aksiAturUlangPassword } from "@/app/(auth)/aksi";
import { skemaAturUlangPassword, type InputAturUlangPassword } from "@/lib/validasi/auth";
import { InputPassword } from "@/components/ui/input-password";
import { Tombol } from "@/components/ui/tombol";
import { KartuAuth, PesanFormulir, fokusGalatPertama } from "./bagian";

/** Formulir password baru setelah membuka tautan dari email (sesi pemulihan dari `/auth/atur-ulang`). */
export function FormAturUlangPassword() {
  const [galat, setGalat] = useState<string>();
  const [menunggu, mulai] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InputAturUlangPassword>({ resolver: zodResolver(skemaAturUlangPassword), shouldFocusError: false });

  const kirim = handleSubmit((data) => {
    setGalat(undefined);
    mulai(async () => {
      const hasil = await aksiAturUlangPassword(data);
      if (hasil?.galatIsian) {
        for (const [k, v] of Object.entries(hasil.galatIsian)) setError(k as keyof InputAturUlangPassword, { message: v });
      }
      if (hasil?.galat) setGalat(hasil.galat);
    });
  }, fokusGalatPertama);

  return (
    <KartuAuth>
      <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Buat password baru</h1>
      <p className="mt-2 text-text-muted">Setelah disimpan, masuk lagi dengan password baru Anda.</p>
      <form method="post" onSubmit={kirim} noValidate className="mt-6 flex flex-col gap-4 rounded-card-sm bg-surface p-5">
        <PesanFormulir galat={galat} />
        <InputPassword
          id="password"
          label="Password baru"
          autoComplete="new-password"
          kekuatan
          galat={errors.password?.message}
          {...register("password")}
        />
        <InputPassword
          id="ulangi_password"
          label="Ulangi password baru"
          autoComplete="new-password"
          galat={errors.ulangi_password?.message}
          {...register("ulangi_password")}
        />
        <Tombol type="submit" ukuran="lg" disabled={menunggu} aria-busy={menunggu} className="mt-2 w-full">
          {menunggu ? "Menyimpan…" : "Simpan password baru"}
        </Tombol>
      </form>
      {galat ? (
        <p className="mt-6 text-center">
          <Link href="/lupa-password" className="font-display font-semibold text-primary underline-offset-4 hover:underline">
            Minta tautan baru
          </Link>
        </p>
      ) : null}
    </KartuAuth>
  );
}
