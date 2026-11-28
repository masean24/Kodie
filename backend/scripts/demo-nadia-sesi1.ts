import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types/database.ts';

/**
 * Data demo: Nadia Kusuma Putri (pengajar1@seventx.id) sudah selesai mengajar Sesi 1 untuk 9 siswa.
 *
 * 1. (service role) Kelas Reguler Teknologi Level 1 milik Nadia, kapasitas 15, Sesi 1 kemarin 19.00 WIB.
 * 2. (service role) 9 profil siswa SMP/SMA di bawah ortu1, masing-masing booking `paket` terkonfirmasi Rp350.000
 *    + pembayaran disetujui.
 * 3. (service role) Laporan Sesi 1 (9 hadir), sesi ditandai selesai, dan honor dihitung dengan rumus yang sama
 *    dengan RPC `kirim_laporan` (migrasi 14): Σ(total booking paket × 30%, atau 40% bila kode referral pengajar
 *    kelas) ÷ jumlah sesi program. Tidak login memakai password akun demo.
 *
 * Honor yang diharapkan: 9 × Rp350.000 × 30% ÷ 4 sesi = Rp236.250 untuk Sesi 1
 * (total satu kelas setelah 4 sesi: Rp945.000).
 *
 * Aman dijalankan ulang: id tetap, dan laporan/honor tidak dibuat dua kali.
 * Jalankan dari folder backend: `npm run demo:nadia` (membaca backend/.env).
 */

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // Variabel bisa juga sudah diset di lingkungan.
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE) {
  console.error('ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib di backend/.env');
  process.exit(1);
}

const admin = createClient<Database>(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

const PROGRAM_KELAS_REGULER = '11111111-1111-4111-8111-000000000002';
const KELAS_ID = '22222222-2222-4222-8222-000000000009';
const ANAK_BIMA = '33333333-3333-4333-8333-000000000001'; // dipakai untuk menemukan ortu1
const HARGA = 350_000;

const SISWA: Array<{ nama: string; jenjang: 'SMP' | 'SMA'; kelas: number; lahir: string }> = [
  { nama: 'Aditya Nugraha', jenjang: 'SMP', kelas: 7, lahir: '2013-02-14' },
  { nama: 'Bunga Lestari', jenjang: 'SMP', kelas: 7, lahir: '2013-06-21' },
  { nama: 'Cahya Ramadhan', jenjang: 'SMP', kelas: 8, lahir: '2012-04-03' },
  { nama: 'Dewi Anggraini', jenjang: 'SMP', kelas: 8, lahir: '2012-09-17' },
  { nama: 'Eko Saputra', jenjang: 'SMP', kelas: 9, lahir: '2011-01-29' },
  { nama: 'Farah Azzahra', jenjang: 'SMA', kelas: 10, lahir: '2010-03-08' },
  { nama: 'Gilang Permana', jenjang: 'SMA', kelas: 10, lahir: '2010-11-12' },
  { nama: 'Hana Puspita', jenjang: 'SMA', kelas: 11, lahir: '2009-05-25' },
  { nama: 'Irfan Maulana', jenjang: 'SMA', kelas: 11, lahir: '2009-08-30' },
];

const idSiswa = (i: number) => `33333333-3333-4333-8333-0000000009${String(i + 1).padStart(2, '0')}`;
const idBooking = (i: number) => `55555555-5555-4555-8555-0000000009${String(i + 1).padStart(2, '0')}`;
const idBayar = (i: number) => `66666666-6666-4666-8666-0000000009${String(i + 1).padStart(2, '0')}`;
const idSesi = (n: number) => `44444444-4444-4444-8444-00000000009${n}`;

function wibIso(daysOffset: number, jam: number, menit = 0): string {
  const target = new Date(Date.now() + daysOffset * 86_400_000);
  const tgl = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(target);
  return new Date(`${tgl}T${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}:00+07:00`).toISOString();
}

function cek(error: { message: string } | null, langkah: string) {
  if (error) throw new Error(`${langkah}: ${error.message}`);
}

async function main() {
  const { data: nadia, error: eNadia } = await admin
    .from('profil_pengajar')
    .select('pengguna_id')
    .eq('slug', 'nadia-kusuma-putri')
    .single();
  cek(eNadia, 'cari Nadia');
  const nadiaId = nadia!.pengguna_id;

  const { data: bima, error: eBima } = await admin.from('siswa').select('orang_tua_id').eq('id', ANAK_BIMA).single();
  cek(eBima, 'cari ortu1');
  const ortuId = bima!.orang_tua_id;
  if (!ortuId) throw new Error('ortu1 tidak ditemukan; jalankan npm run seed:akun dulu');

  console.log('1. Kelas Reguler Teknologi milik Nadia, Sesi 1 kemarin 19.00 WIB...');
  cek(
    (
      await admin.from('kelas').upsert(
        {
          id: KELAS_ID,
          program_id: PROGRAM_KELAS_REGULER,
          pengajar_id: nadiaId,
          level: 1,
          kapasitas: 15,
          jam_mulai: '19:00:00',
          status: 'berjalan',
        },
        { onConflict: 'id' },
      )
    ).error,
    'kelas',
  );
  const sesiIds: string[] = [];
  for (let n = 1; n <= 4; n++) {
    const mulai = wibIso(-1 + (n - 1) * 7, 19);
    const { error } = await admin.from('sesi').upsert(
      {
        id: idSesi(n),
        kelas_id: KELAS_ID,
        nomor: n,
        mulai_pada: mulai,
        selesai_pada: new Date(new Date(mulai).getTime() + 90 * 60_000).toISOString(),
        status: 'terjadwal',
        meet_uri: n === 1 ? 'https://meet.google.com/demo-seventx-nadia' : null,
        meet_dibuat_pada: n === 1 ? mulai : null,
      },
      // Status sesi yang sudah selesai (laporan terkirim) tidak dikembalikan ke terjadwal.
      { onConflict: 'kelas_id,nomor', ignoreDuplicates: true },
    );
    cek(error, `sesi ${n}`);
    const { data } = await admin.from('sesi').select('id').eq('kelas_id', KELAS_ID).eq('nomor', n).single();
    sesiIds.push(data!.id);
  }

  console.log('2. 9 siswa + booking terkonfirmasi Rp350.000...');
  cek(
    (
      await admin.from('siswa').upsert(
        SISWA.map((s, i) => ({
          id: idSiswa(i),
          nama: s.nama,
          tanggal_lahir: s.lahir,
          jenjang: s.jenjang,
          kelas: s.kelas,
          sekolah: null,
          orang_tua_id: ortuId,
        })),
        { onConflict: 'id' },
      )
    ).error,
    'siswa',
  );
  cek(
    (
      await admin.from('booking').upsert(
        SISWA.map((_, i) => ({
          id: idBooking(i),
          kode: `BK-NADIA-S1-${String(i + 1).padStart(2, '0')}`,
          kelas_id: KELAS_ID,
          siswa_id: idSiswa(i),
          dibuat_oleh: ortuId,
          status: 'terkonfirmasi' as const,
          jenis: 'paket' as const,
          total: HARGA,
          potongan: 0,
          kode_referral: null,
          batas_bayar_pada: wibIso(-3, 12),
        })),
        { onConflict: 'id' },
      )
    ).error,
    'booking',
  );
  cek(
    (
      await admin.from('pembayaran').upsert(
        SISWA.map((_, i) => ({
          id: idBayar(i),
          booking_id: idBooking(i),
          bukti_path: `${idBooking(i)}/bukti-demo.png`,
          status: 'disetujui' as const,
          diverifikasi_pada: wibIso(-3, 13),
        })),
        { onConflict: 'id' },
      )
    ).error,
    'pembayaran',
  );

  console.log('3. Laporan Sesi 1 + honor bagi hasil (rumus kirim_laporan)...');
  const sesi1 = sesiIds[0];
  const { data: sudah } = await admin.from('laporan_sesi').select('id').eq('sesi_id', sesi1).maybeSingle();
  let laporanId = sudah?.id;
  if (!laporanId) {
    const { data, error } = await admin
      .from('laporan_sesi')
      .insert({
        sesi_id: sesi1,
        pengajar_id: nadiaId,
        ringkasan:
          'Sesi 1: pengenalan HTML. Semua siswa membuat halaman profil sederhana dengan judul, paragraf, gambar, dan tautan.',
        rekaman_url: null,
        kendala: null,
      })
      .select('id')
      .single();
    cek(error, 'laporan_sesi');
    laporanId = data!.id;
  } else {
    console.log('   Laporan Sesi 1 sudah ada, dipakai ulang.');
  }
  cek(
    (
      await admin.from('laporan_siswa').upsert(
        SISWA.map((s, i) => ({
          laporan_sesi_id: laporanId!,
          siswa_id: idSiswa(i),
          hadir: true,
          catatan: `${s.nama.split(' ')[0]} menyelesaikan halaman profil HTML dan aktif bertanya.`,
          karya_url: null,
        })),
        { onConflict: 'laporan_sesi_id,siswa_id' },
      )
    ).error,
    'laporan_siswa',
  );
  cek((await admin.from('sesi').update({ status: 'selesai' }).eq('id', sesi1)).error, 'status sesi');

  // Rumus sama dengan kirim_laporan: booking paket terkonfirmasi/selesai di kelas ini.
  const [{ data: daftarBooking, error: eB }, { data: kodeNadia, error: eK }, { data: program, error: eP }] = await Promise.all([
    admin.from('booking').select('total, kode_referral').eq('kelas_id', KELAS_ID).eq('jenis', 'paket').in('status', ['terkonfirmasi', 'selesai']),
    admin.from('kode_referral').select('kode').eq('pengajar_id', nadiaId),
    admin.from('program').select('jumlah_sesi').eq('id', PROGRAM_KELAS_REGULER).single(),
  ]);
  cek(eB ?? eK ?? eP, 'data honor');
  const kodeMilikNadia = new Set((kodeNadia ?? []).map((k) => k.kode));
  const bagian = (daftarBooking ?? []).reduce(
    (n, b) => n + b.total * (b.kode_referral && kodeMilikNadia.has(b.kode_referral) ? 0.4 : 0.3),
    0,
  );
  const jumlahHonor = Math.round(bagian / Math.max(program!.jumlah_sesi, 1));
  cek(
    (
      await admin
        .from('honor')
        .upsert({ pengajar_id: nadiaId, sesi_id: sesi1, jumlah: jumlahHonor, status: 'belum_dibayar' }, { onConflict: 'sesi_id', ignoreDuplicates: true })
    ).error,
    'honor',
  );

  const { data: honor, error: eHonor } = await admin.from('honor').select('jumlah, status').eq('sesi_id', sesi1).single();
  cek(eHonor, 'baca honor');
  const harapan = Math.round((SISWA.length * HARGA * 0.3) / 4);
  console.log(`   Honor Sesi 1 Nadia: Rp${honor!.jumlah.toLocaleString('id-ID')} (${honor!.status}); harapan Rp${harapan.toLocaleString('id-ID')}`);
  if (honor!.jumlah !== harapan) {
    console.warn('   PERINGATAN: honor tidak sama dengan harapan. Cek booking lain di kelas ini.');
    process.exitCode = 1;
  }
  console.log('Selesai.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
