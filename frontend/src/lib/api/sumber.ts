/** true = data mock (default), false = Supabase sungguhan. Diatur lewat NEXT_PUBLIC_USE_MOCK. */
export const pakaiMock = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/** Ubah error Supabase menjadi Error berisi kode, supaya bisa dipetakan lib/errors.ts. */
export function lemparJikaError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}
