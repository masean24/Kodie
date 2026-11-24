import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types/database.ts';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'DemoSeventX123!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PROGRAM_CODING_DASAR = '11111111-1111-4111-8111-000000000001';
const BIMA_SD_ID = '33333333-3333-4333-8333-000000000001';

const KELAS_IDS = {
  k1: '22222222-2222-4222-8222-000000000001',
  k2Penuh: '22222222-2222-4222-8222-000000000002',
  k5: '22222222-2222-4222-8222-000000000005',
  k7Live: '22222222-2222-4222-8222-000000000007',
} as const;

const BOOKING_K1_PENDING_ID = '55555555-5555-4555-8555-000000000001';
const BOOKING_LIVE_ID = '55555555-5555-4555-8555-000000000008';

function hasRealMeetUri(uri: string | null | undefined): boolean {
  return (
    typeof uri === 'string' &&
    uri.startsWith('https://meet.google.com/') &&
    !uri.includes('demo-')
  );
}

async function resolveDemoUserId(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error(`Akun demo ${email} belum tersedia. Jalankan npm run seed:akun terlebih dahulu.`);
  }
  return user.id;
}

async function getAdminAccessToken(): Promise<string | null> {
  if (!SUPABASE_ANON_KEY) return null;
  const adminAuth = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await adminAuth.auth.signInWithPassword({
    email: 'admin@seventx.id',
    password: DEMO_PASSWORD,
  });
  if (error || !data.session) return null;
  return data.session.access_token;
}

async function tryBuatMeet(kelasId: string, adminToken: string | null) {
  const token = adminToken ?? SUPABASE_SERVICE_ROLE_KEY!;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/buat-meet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY ?? SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kelas_id: kelasId }),
    });
    const text = await res.text();
    if (res.ok) {
      console.log(`   -> buat-meet(${kelasId}): ${text}`);
    } else {
      console.warn(`   -> Peringatan buat-meet(${kelasId}) [${res.status}]: ${text}`);
    }
  } catch (err) {
    console.warn(`   -> Gagal memanggil buat-meet(${kelasId}), lanjut tanpa memblokir:`, err);
  }
}

async function main() {
  const now = Date.now();
  const isoInMinutes = (mins: number) => new Date(now + mins * 60_000).toISOString();
  const isoInHours = (hrs: number) => new Date(now + hrs * 3_600_000).toISOString();
  const adminToken = await getAdminAccessToken();

  console.log('=== Reset Jadwal Demo & QA Pasca-Login Kodie ===\n');

  // 1. Segarkan batas bayar booking k1 (BK-20261123-0001) +24 jam untuk QA checkout
  console.log('1. Menyegarkan booking pending k1 (BK-20261123-0001) -> batas_bayar +24 jam...');
  const { error: k1SesiErr } = await supabase
    .from('sesi')
    .update({
      mulai_pada: isoInHours(72),
      selesai_pada: isoInHours(73),
      status: 'terjadwal',
    })
    .eq('kelas_id', KELAS_IDS.k1)
    .eq('nomor', 1);
  if (k1SesiErr) throw k1SesiErr;

  const { error: bk1Err } = await supabase
    .from('booking')
    .update({
      status: 'menunggu_pembayaran',
      batas_bayar_pada: isoInHours(24),
    })
    .eq('id', BOOKING_K1_PENDING_ID);
  if (bk1Err) throw bk1Err;

  // 2. Kembalikan/jaga Sesi 1–4 kelas k2Penuh ke masa depan (+5 hari dst.) agar Waitlist & test:rls selalu valid
  console.log('2. Mengatur Sesi 1–4 k2Penuh ke jadwal masa depan (+5 hari dst.) untuk QA Waitlist...');
  const { data: k2SesiRows, error: k2FetchErr } = await supabase
    .from('sesi')
    .select('id, nomor, meet_uri')
    .eq('kelas_id', KELAS_IDS.k2Penuh)
    .order('nomor', { ascending: true });
  if (k2FetchErr || !k2SesiRows || k2SesiRows.length === 0) {
    throw k2FetchErr ?? new Error('Sesi k2Penuh tidak ditemukan');
  }

  for (const s of k2SesiRows) {
    const startOffsetHours = 120 + (s.nomor - 1) * 7 * 24;
    const { error: k2UpdErr } = await supabase
      .from('sesi')
      .update({
        mulai_pada: isoInHours(startOffsetHours),
        selesai_pada: isoInHours(startOffsetHours + 1),
        status: 'terjadwal',
      })
      .eq('id', s.id);
    if (k2UpdErr) throw k2UpdErr;
  }

  const k2Sesi1 = k2SesiRows.find((s) => s.nomor === 1);
  if (hasRealMeetUri(k2Sesi1?.meet_uri)) {
    console.log(`   -> Mempertahankan link Google Meet asli k2Penuh: ${k2Sesi1!.meet_uri}`);
  } else {
    await tryBuatMeet(KELAS_IDS.k2Penuh, adminToken);
  }

  // 3. Siapkan kelas khusus Live H-15m (k7Live: berjalan, Citra + Bima SD terkonfirmasi)
  console.log('3. Menyiapkan kelas Live H-15m khusus demo k7Live (Citra + Bima SD)...');
  const [pengajar3Id, ortu1Id] = await Promise.all([
    resolveDemoUserId('pengajar3@seventx.id'),
    resolveDemoUserId('ortu1@seventx.id'),
  ]);

  const { error: k7Err } = await supabase.from('kelas').upsert(
    {
      id: KELAS_IDS.k7Live,
      program_id: PROGRAM_CODING_DASAR,
      pengajar_id: pengajar3Id,
      level: 1,
      kapasitas: 10,
      jam_mulai: '10:00:00',
      status: 'berjalan',
    },
    { onConflict: 'id' },
  );
  if (k7Err) throw k7Err;

  const { data: k7ExistingSesi, error: k7SesiFetchErr } = await supabase
    .from('sesi')
    .select('id, nomor, meet_uri')
    .eq('kelas_id', KELAS_IDS.k7Live)
    .order('nomor', { ascending: true });
  if (k7SesiFetchErr) throw k7SesiFetchErr;

  const k7SesiByNomor = new Map((k7ExistingSesi ?? []).map((s) => [s.nomor, s]));
  for (let nomor = 1; nomor <= 4; nomor++) {
    const mulaiPada =
      nomor === 1 ? isoInMinutes(5) : isoInHours((nomor - 1) * 24 * 7);
    const selesaiPada =
      nomor === 1 ? isoInMinutes(65) : isoInHours((nomor - 1) * 24 * 7 + 1);
    const existing = k7SesiByNomor.get(nomor);

    if (existing) {
      const { error: updErr } = await supabase
        .from('sesi')
        .update({
          mulai_pada: mulaiPada,
          selesai_pada: selesaiPada,
          status: 'terjadwal',
        })
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase.from('sesi').insert({
        id: `44444444-4444-4444-8444-00000000007${nomor}`,
        kelas_id: KELAS_IDS.k7Live,
        nomor,
        mulai_pada: mulaiPada,
        selesai_pada: selesaiPada,
        status: 'terjadwal',
      });
      if (insErr) throw insErr;
    }
  }

  const k7Sesi1 = k7SesiByNomor.get(1);
  if (hasRealMeetUri(k7Sesi1?.meet_uri)) {
    console.log(`   -> Mempertahankan link Google Meet asli k7Live: ${k7Sesi1!.meet_uri}`);
  } else {
    await tryBuatMeet(KELAS_IDS.k7Live, adminToken);
  }

  const { error: bkLiveErr } = await supabase.from('booking').upsert(
    {
      id: BOOKING_LIVE_ID,
      kode: 'BK-DEMO-LIVE-0001',
      kelas_id: KELAS_IDS.k7Live,
      siswa_id: BIMA_SD_ID,
      dibuat_oleh: ortu1Id,
      status: 'terkonfirmasi',
      total: 200000,
      batas_bayar_pada: isoInHours(24),
    },
    { onConflict: 'kode' },
  );
  if (bkLiveErr) throw bkLiveErr;

  // 4. Atur Sesi 1 kelas k5 (Simulasi Jurusan IT - Nadia) ke +18 jam (dalam jendela H-1 Playbook & tetap terbuka)
  console.log('4. Mengatur Sesi 1 k5 (Nadia - Simulasi Jurusan IT) ke +18 jam (jendela Playbook H-1)...');
  const { data: k5Sesi1, error: k5FetchErr } = await supabase
    .from('sesi')
    .select('id, meet_uri')
    .eq('kelas_id', KELAS_IDS.k5)
    .eq('nomor', 1)
    .single();
  if (k5FetchErr || !k5Sesi1) throw k5FetchErr ?? new Error('Sesi 1 k5 tidak ditemukan');

  const { error: k5UpdErr } = await supabase
    .from('sesi')
    .update({
      mulai_pada: isoInHours(18),
      selesai_pada: new Date(now + 18 * 3_600_000 + 90 * 60_000).toISOString(),
      status: 'terjadwal',
    })
    .eq('id', k5Sesi1.id);
  if (k5UpdErr) throw k5UpdErr;

  if (!hasRealMeetUri(k5Sesi1.meet_uri)) {
    await tryBuatMeet(KELAS_IDS.k5, adminToken);
  }

  // 5. Bersihkan entri waitlist sisa pengujian di k2Penuh
  console.log('5. Membersihkan sisa antrean waitlist uji di k2Penuh...');
  const { error: wlCleanErr } = await supabase
    .from('waitlist_kelas')
    .delete()
    .eq('kelas_id', KELAS_IDS.k2Penuh);
  if (wlCleanErr) {
    console.warn('   -> Peringatan pembersihan waitlist_kelas:', wlCleanErr.message);
  }

  console.log('\nReset demo selesai! Ringkasan skenario QA & Live Demo siap pakai:');
  console.log('====================================================================');
  console.log(`Password seluruh akun demo : ${DEMO_PASSWORD}`);
  console.log('1. Checkout Transfer/QRIS  : ortu1@seventx.id (Booking BK-20261123-0001 aktif +24 jam di k1)');
  console.log('2. Masuk Kelas Live H-15m  : ortu1@seventx.id (Bima SD) & pengajar3@seventx.id (k7Live Sesi 1 +5m)');
  console.log('3. Playbook H-1 Pengajar   : pengajar3@seventx.id (k7Live Sesi 1) & pengajar1@seventx.id (k5 Sesi 1 +18j)');
  console.log('4. Waitlist Kelas Penuh    : ortu2@seventx.id / siswa.aktif@seventx.id di Coding Dasar penuh (k2Penuh +5 hari)');
  console.log('5. Verifikasi Admin        : admin@seventx.id (/admin/pembayaran, /admin/pengajar, /admin/chat)');
  console.log('====================================================================');
}

main().catch((err) => {
  console.error('Demo reset gagal:', err);
  process.exit(1);
});
