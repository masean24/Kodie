"use client";

import { Kontainer, StateError } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";

/** State error dengan tombol coba lagi untuk halaman masuk, daftar, dan persetujuan. */
export default function ErrorAuth({ retry }: { error: unknown; retry: () => void }) {
  return (
    <Kontainer className="py-16">
      <StateError aksi={<Tombol onClick={() => retry()}>Coba lagi</Tombol>} />
    </Kontainer>
  );
}
