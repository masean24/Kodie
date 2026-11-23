const ZONA = "Asia/Jakarta";

function bagian(tanggal: Date, opsi: Intl.DateTimeFormatOptions) {
  const hasil: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, ...opsi }).formatToParts(tanggal)) {
    hasil[p.type] = p.value;
  }
  return hasil;
}

/** "Senin, 24 November 2026" (WIB). */
export function formatTanggal(iso: string | Date): string {
  const p = bagian(new Date(iso), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

/** "19.00 WIB". */
export function formatJam(iso: string | Date): string {
  const p = bagian(new Date(iso), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${p.hour}.${p.minute} WIB`;
}

/** "Senin, 24 November 2026, 19.00 WIB". */
export function formatTanggalJam(iso: string | Date): string {
  return `${formatTanggal(iso)}, ${formatJam(iso)}`;
}

/** "19.00" dari "19:00:00". */
export function formatJamTeks(jam: string): string {
  const [h, m] = jam.split(":");
  return `${h.padStart(2, "0")}.${(m ?? "00").padStart(2, "0")}`;
}

const NAMA_HARI = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

/** 1 = Senin … 7 = Minggu. */
export function namaHari(hari: number): string {
  return NAMA_HARI[hari] ?? "";
}

/** "Rp275.000". */
export function formatRupiah(nilai: number): string {
  return `Rp${Math.round(nilai).toLocaleString("id-ID")}`;
}
