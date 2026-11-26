/**
 * true = data mock, false = Supabase sungguhan.
 * Diatur lewat NEXT_PUBLIC_USE_MOCK; fail-safe ke Supabase bila URL Supabase sudah dikonfigurasi,
 * dan tetap jatuh ke mock saat lokal/CI build tanpa .env.local.
 */
export const pakaiMock =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  (process.env.NEXT_PUBLIC_USE_MOCK !== "false" && !process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Ubah error Supabase menjadi Error berisi kode, supaya bisa dipetakan lib/errors.ts. */
export function lemparJikaError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}
