/** Dua huruf awal nama untuk avatar, mis. "Raka Pratama" menjadi "RP". */
export function inisialNama(nama: string): string {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}
