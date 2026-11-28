import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types/database.ts';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPasswordEnv = process.env.DEMO_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env');
  process.exit(1);
}
if (!demoPasswordEnv) {
  console.error('ERROR: DEMO_USER_PASSWORD wajib diisi di backend/.env (lihat backend/.env.example)');
  process.exit(1);
}

const DEMO_PASSWORD: string = demoPasswordEnv;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PROGRAM_KELAS_REGULER = '11111111-1111-4111-8111-000000000002';

const KELAS_IDS = {
  k1: '22222222-2222-4222-8222-000000000001',
  k2Penuh: '22222222-2222-4222-8222-000000000002',
  k3: '22222222-2222-4222-8222-000000000003',
  k4: '22222222-2222-4222-8222-000000000004',
  k5: '22222222-2222-4222-8222-000000000005',
  k7Live: '22222222-2222-4222-8222-000000000007',
  k8Kenal: '22222222-2222-4222-8222-000000000008',
} as const;
const KELAS_NADIA_SESI1 = '22222222-2222-4222-8222-000000000009';

const BOOKING_K1_PENDING_ID = '55555555-5555-4555-8555-000000000001';
const BOOKING_LIVE_ID = '55555555-5555-4555-8555-000000000008';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasRealMeetUri(uri: string | null | undefined): boolean {
  return (
    typeof uri === 'string' &&
    uri.startsWith('https://meet.google.com/') &&
    !uri.includes('demo-')
  );
}

function wibDateIso(daysOffset: number, hourWib: number, minuteWib = 0): string {
  const target = new Date(Date.now() + daysOffset * 86_400_000);
  const wibDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target);
  const hh = String(hourWib).padStart(2, '0');
  const mm = String(minuteWib).padStart(2, '0');
  return new Date(`${wibDate}T${hh}:${mm}:00+07:00`).toISOString();
}

function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function getCurrentWibHour(): number {
  const raw = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  return Number(raw) % 24;
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

async function tryBuatMeet(
  kelasId: string,
  adminToken: string | null,
): Promise<{ berhasil?: number; gagal?: number } | null> {
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
      try {
        return JSON.parse(text) as { berhasil?: number; gagal?: number };
      } catch {
        return null;
      }
    }
    console.warn(`   -> Peringatan buat-meet(${kelasId}) [${res.status}]: ${text}`);
    return null;
  } catch (err) {
    console.warn(`   -> Gagal memanggil buat-meet(${kelasId}), lanjut tanpa memblokir:`, err);
    return null;
  }
}

async function ensureAllSesiHaveMeet(kelasId: string, adminToken: string | null) {
  const { data: sesiRows, error } = await supabase
    .from('sesi')
    .select('id, nomor, meet_uri')
    .eq('kelas_id', kelasId)
    .eq('status', 'terjadwal')
    .order('nomor', { ascending: true });
  if (error) throw error;

  const missingIds = (sesiRows ?? [])
    .filter((s) => !hasRealMeetUri(s.meet_uri))
    .map((s) => s.id);

  if (missingIds.length === 0) {
    console.log(`   -> Seluruh link Google Meet asli kelas ${kelasId.slice(-4)} sudah lengkap.`);
    return;
  }

  // Bersihkan placeholder demo jika ada agar buat-meet mengisi ulang ruang Meet asli
  const invalidNonNullIds = (sesiRows ?? [])
    .filter((s) => s.meet_uri !== null && !hasRealMeetUri(s.meet_uri))
    .map((s) => s.id);
  if (invalidNonNullIds.length > 0) {
    const { error: clrErr } = await supabase
      .from('sesi')
      .update({ meet_uri: null, meet_space: null, meet_dibuat_pada: null })
      .in('id', invalidNonNullIds);
    if (clrErr) throw clrErr;
  }

  const res1 = await tryBuatMeet(kelasId, adminToken);
  if ((res1?.gagal ?? 0) > 0) {
    console.log('   -> Menunggu 8 detik untuk cooldown kuota Google Meet API sebelum retry...');
    await sleep(8000);
    await tryBuatMeet(kelasId, adminToken);
  }
  await sleep(2000);
}

async function updateKelasScheduleAndEnsureMeet(params: {
  kelasId: string;
  startDaysOffset: number;
  hourWib: number;
  minuteWib?: number;
  durationMinutes: number;
  adminToken: string | null;
}) {
  const { data: sesiRows, error: fetchErr } = await supabase
    .from('sesi')
    .select('id, nomor')
    .eq('kelas_id', params.kelasId)
    .order('nomor', { ascending: true });
  if (fetchErr || !sesiRows || sesiRows.length === 0) {
    throw fetchErr ?? new Error(`Sesi kelas ${params.kelasId} tidak ditemukan`);
  }

  for (const s of sesiRows) {
    const mulai = wibDateIso(
      params.startDaysOffset + (s.nomor - 1) * 7,
      params.hourWib,
      params.minuteWib ?? 0,
    );
    const selesai = addMinutesIso(mulai, params.durationMinutes);
    const { error: updErr } = await supabase
      .from('sesi')
      .update({
        mulai_pada: mulai,
        selesai_pada: selesai,
        status: 'terjadwal',
      })
      .eq('id', s.id);
    if (updErr) throw updErr;
  }

  await ensureAllSesiHaveMeet(params.kelasId, params.adminToken);
}

async function main() {
  const now = Date.now();
  const isoInMinutes = (mins: number) => new Date(now + mins * 60_000).toISOString();
  const isoInHours = (hrs: number) => new Date(now + hrs * 3_600_000).toISOString();
  const adminToken = await getAdminAccessToken();

  console.log('=== Reset Jadwal Demo & QA Pasca-Login Kodie ===\n');

  // 1. Segarkan jadwal k1 (Coding Dasar, Citra, 16:00 WIB) & batas bayar BK-20261123-0001
  console.log('1. Mengatur jadwal k1 (16:00 WIB) & booking pending BK-20261123-0001 (+24 jam)...');
  await updateKelasScheduleAndEnsureMeet({
    kelasId: KELAS_IDS.k1,
    startDaysOffset: 3,
    hourWib: 16,
    minuteWib: 0,
    durationMinutes: 60,
    adminToken,
  });

  const { error: bk1Err } = await supabase
    .from('booking')
    .update({
      status: 'menunggu_pembayaran',
      batas_bayar_pada: isoInHours(24),
    })
    .eq('id', BOOKING_K1_PENDING_ID);
  if (bk1Err) throw bk1Err;

  // 2. Segarkan k2Penuh (Coding Dasar penuh, Citra, 10:00 WIB +5 hari) untuk QA Waitlist & bersihkan antrean uji
  console.log('2. Mengatur k2Penuh (10:00 WIB, +5 hari dst.) & membersihkan sisa waitlist uji...');
  await updateKelasScheduleAndEnsureMeet({
    kelasId: KELAS_IDS.k2Penuh,
    startDaysOffset: 5,
    hourWib: 10,
    minuteWib: 0,
    durationMinutes: 60,
    adminToken,
  });

  const { error: wlCleanErr } = await supabase
    .from('waitlist_kelas')
    .delete()
    .eq('kelas_id', KELAS_IDS.k2Penuh);
  if (wlCleanErr) {
    console.warn('   -> Peringatan pembersihan waitlist_kelas:', wlCleanErr.message);
  }

  // 3. Lengkapi link Meet asli & jadwal WIB realistis untuk k3 (19:00 WIB) dan k4 (15:30 WIB)
  console.log('3. Melengkapi link Google Meet & jadwal WIB realistis untuk k3 (19:00) dan k4 (15:30)...');
  await updateKelasScheduleAndEnsureMeet({
    kelasId: KELAS_IDS.k3,
    startDaysOffset: 2,
    hourWib: 19,
    minuteWib: 0,
    durationMinutes: 90,
    adminToken,
  });
  await updateKelasScheduleAndEnsureMeet({
    kelasId: KELAS_IDS.k4,
    startDaysOffset: 4,
    hourWib: 15,
    minuteWib: 30,
    durationMinutes: 90,
    adminToken,
  });
  await updateKelasScheduleAndEnsureMeet({
    kelasId: KELAS_IDS.k8Kenal,
    startDaysOffset: 4,
    hourWib: 9,
    minuteWib: 0,
    durationMinutes: 45,
    adminToken,
  });

  // 4. Siapkan k7Live di Kelas Reguler Teknologi (Nadia + Fajar SMA/ortu1) agar tidak duplikat Coding Dasar
  console.log('4. Menyiapkan kelas Live H-15m k7Live (Nadia + Fajar SMA / ortu1)...');
  const [pengajar1Id, siswaAktifUserId] = await Promise.all([
    resolveDemoUserId('pengajar1@seventx.id'),
    resolveDemoUserId('siswa.aktif@seventx.id'),
  ]);

  const { data: siswaAktifRow, error: saErr } = await supabase
    .from('siswa')
    .select('id')
    .eq('pengguna_id', siswaAktifUserId)
    .single();
  if (saErr || !siswaAktifRow) {
    throw saErr ?? new Error('Baris siswa untuk siswa.aktif@seventx.id tidak ditemukan');
  }

  const { error: k7Err } = await supabase.from('kelas').upsert(
    {
      id: KELAS_IDS.k7Live,
      program_id: PROGRAM_KELAS_REGULER,
      pengajar_id: pengajar1Id,
      level: 1,
      kapasitas: 15,
      jam_mulai: '19:00:00',
      status: 'berjalan',
    },
    { onConflict: 'id' },
  );
  if (k7Err) throw k7Err;

  const { data: k7ExistingSesi, error: k7SesiFetchErr } = await supabase
    .from('sesi')
    .select('id, nomor')
    .eq('kelas_id', KELAS_IDS.k7Live)
    .order('nomor', { ascending: true });
  if (k7SesiFetchErr) throw k7SesiFetchErr;

  const k7SesiByNomor = new Map((k7ExistingSesi ?? []).map((s) => [s.nomor, s]));
  for (let nomor = 1; nomor <= 4; nomor++) {
    const mulaiPada =
      nomor === 1 ? isoInMinutes(5) : wibDateIso((nomor - 1) * 7, 19, 0);
    const selesaiPada =
      nomor === 1 ? isoInMinutes(95) : addMinutesIso(mulaiPada, 90);
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

  await ensureAllSesiHaveMeet(KELAS_IDS.k7Live, adminToken);

  const { error: bkLiveErr } = await supabase.from('booking').upsert(
    {
      id: BOOKING_LIVE_ID,
      kode: 'BK-DEMO-LIVE-0001',
      kelas_id: KELAS_IDS.k7Live,
      siswa_id: siswaAktifRow.id,
      dibuat_oleh: siswaAktifUserId,
      status: 'terkonfirmasi',
      total: 350000,
      batas_bayar_pada: isoInHours(24),
    },
    { onConflict: 'kode' },
  );
  if (bkLiveErr) throw bkLiveErr;

  // 5. Atur Sesi 1–4 kelas k5 (Simulasi Jurusan IT, Nadia) ke jendela Playbook H-1 di jam WIB realistis
  const wibHour = getCurrentWibHour();
  const k5DaysOffset = wibHour < 18 ? 0 : 1;
  const k5Hour = wibHour < 18 ? 19 : 16;
  console.log(
    `5. Mengatur k5 (Nadia - Simulasi Jurusan IT) ke +${k5DaysOffset} hari pukul ${String(k5Hour).padStart(2, '0')}:00 WIB (jendela H-1 Playbook)...`,
  );
  const { error: k5JamErr } = await supabase
    .from('kelas')
    .update({ jam_mulai: `${String(k5Hour).padStart(2, '0')}:00:00` })
    .eq('id', KELAS_IDS.k5);
  if (k5JamErr) throw k5JamErr;

  await updateKelasScheduleAndEnsureMeet({
    kelasId: KELAS_IDS.k5,
    startDaysOffset: k5DaysOffset,
    hourWib: k5Hour,
    minuteWib: 0,
    durationMinutes: 90,
    adminToken,
  });

  // 6. Lengkapi link Meet sesi terjadwal kelas demo Nadia Sesi 1 (k9) bila ada, tanpa mengubah jadwal/Sesi 1
  const { data: k9Row } = await supabase
    .from('kelas')
    .select('id')
    .eq('id', KELAS_NADIA_SESI1)
    .maybeSingle();
  if (k9Row) {
    console.log('6. Melengkapi link Google Meet sesi terjadwal kelas demo Nadia (k9)...');
    await ensureAllSesiHaveMeet(KELAS_NADIA_SESI1, adminToken);
  }

  console.log('\nReset demo selesai! Ringkasan skenario QA & Live Demo siap pakai:');
  console.log('====================================================================');
  console.log('Password akun demo         : Sesuai DEMO_USER_PASSWORD di backend/.env');
  console.log('1. Checkout Transfer/QRIS  : ortu1@seventx.id (Booking BK-20261123-0001 aktif +24 jam di k1, 16:00 WIB)');
  console.log('2. Masuk Kelas Live H-15m  : pengajar1@seventx.id (Nadia), siswa.aktif@seventx.id (Fajar), ortu1@seventx.id (k7Live +5m)');
  console.log(`3. Playbook H-1 Pengajar   : pengajar1@seventx.id (k7Live Sesi 1 +5m & k5 Sesi 1 pukul ${String(k5Hour).padStart(2, '0')}:00 WIB)`);
  console.log('4. Waitlist Kelas Penuh    : ortu2@seventx.id / siswa.aktif@seventx.id di Coding Dasar penuh (k2Penuh +5 hari 10:00 WIB)');
  console.log('5. Verifikasi Admin        : admin@seventx.id (0 sesi terjadwal tanpa Google Meet)');
  console.log('====================================================================');
}

main().catch((err) => {
  console.error('Demo reset gagal:', err);
  process.exit(1);
});
