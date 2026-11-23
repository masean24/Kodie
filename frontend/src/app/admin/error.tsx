"use client";

import { StateError } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";

export default function ErrorAdmin({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StateError aksi={<Tombol onClick={() => reset()}>Coba lagi</Tombol>} />;
}
