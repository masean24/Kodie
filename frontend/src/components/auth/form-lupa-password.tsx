"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aksiLupaPassword } from "@/app/(auth)/aksi";
import { skemaLupaPassword, type InputLupaPassword } from "@/lib/validasi/auth";
import { Input } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { KartuAuth, PesanFormulir, fokusGalatPertama } from "./bagian";

export function FormLupaPassword({ kedaluwarsa }: { kedaluwarsa?: boolean }) {
  const [galat, setGalat] = useState<string | undefined>(
    kedaluwarsa ? "Tautan atur ulang password sudah tidak berlaku. Minta tautan baru di bawah." : undefined,
  );
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InputLupaPassword>({ resolver: zodResolver(skemaLupaPassword), shouldFocusError: false });

  const kirim = handleSubmit((data) => {
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const hasil = await aksiLupaPassword(data);
      if (hasil?.galatIsian) {
        for (const [k, v] of Object.entries(hasil.galatIsian)) setError(k as keyof InputLupaPassword, { message: v });
      }
      if (hasil?.galat) setGalat(hasil.galat);
      if (hasil?.info) setInfo(hasil.info);
    });
  }, fokusGalatPertama);

  return (
    <KartuAuth>
      <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">Lupa password</h1>
      <p className="mt-2 text-text-muted">Masukkan email akun Anda. Kami kirim tautan untuk membuat password baru.</p>
      <form method="post" onSubmit={kirim} noValidate className="mt-6 flex flex-col gap-4 rounded-card-sm bg-surface p-5">
        <PesanFormulir galat={galat} info={info} />
        <Input id="email" type="email" label="Email" autoComplete="email" galat={errors.email?.message} {...register("email")} />
        <Tombol type="submit" ukuran="lg" disabled={menunggu} aria-busy={menunggu} className="mt-2 w-full">
          {menunggu ? "Mengirim…" : "Kirim tautan"}
        </Tombol>
      </form>
      <p className="mt-6 text-center">
        Ingat password Anda?{" "}
        <Link href="/masuk" className="font-display font-semibold text-primary underline-offset-4 hover:underline">
          Masuk
        </Link>
      </p>
    </KartuAuth>
  );
}
