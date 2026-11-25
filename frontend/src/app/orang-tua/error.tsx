"use client";

import { StateError } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";

/** State error dengan tombol coba lagi untuk area orang tua. `retry` memuat ulang data segmen ini. */
export default function ErrorOrangTua({ retry }: { error: unknown; retry: () => void }) {
  return <StateError aksi={<Tombol onClick={() => retry()}>Coba lagi</Tombol>} />;
}
