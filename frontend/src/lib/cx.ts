/** Gabungkan nama kelas, abaikan nilai kosong. */
export function cx(...kelas: (string | false | null | undefined)[]): string {
  return kelas.filter(Boolean).join(" ");
}
