"use client";

import { Kontainer, StateError } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";

/** State error dengan tombol coba lagi untuk semua halaman publik. */
export default function ErrorPublik({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Kontainer className="py-16">
      <StateError aksi={<Tombol onClick={() => retry()}>Coba lagi</Tombol>} />
    </Kontainer>
  );
}
