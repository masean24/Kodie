"use client";

import dynamic from "next/dynamic";
import { Kerangka, StatusMemuat } from "@/components/ui/dasar";

/** Kodie Lab hanya dirender di browser: editor, localStorage, iframe, dan Web Worker tidak ada di server. */
export const LabKlien = dynamic(() => import("./kodie-lab").then((m) => m.KodieLab), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4">
      <StatusMemuat label="Menyiapkan Kodie Lab…" />
      <Kerangka className="h-12 w-72 rounded-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kerangka className="h-[420px] md:h-[520px] lg:h-[600px]" />
        <Kerangka className="h-[420px] md:h-[520px] lg:h-[600px]" />
      </div>
    </div>
  ),
});
