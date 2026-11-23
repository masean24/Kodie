import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { StatusBooking } from "@/types/database";
import { LABEL_STATUS_BOOKING, NADA_STATUS_BOOKING } from "@/lib/booking";
import { Lencana } from "@/components/ui/dasar";

const IKON = {
  peringatan: AlertTriangle,
  info: Clock,
  sukses: CheckCircle2,
  netral: XCircle,
  bahaya: XCircle,
};

/** Lencana status booking: selalu ikon dan teks, bukan warna saja. */
export function LencanaStatus({ status }: { status: StatusBooking }) {
  const nada = NADA_STATUS_BOOKING[status];
  const Ikon = IKON[nada];
  return (
    <Lencana nada={nada}>
      <Ikon aria-hidden className="size-4" />
      {LABEL_STATUS_BOOKING[status]}
    </Lencana>
  );
}
