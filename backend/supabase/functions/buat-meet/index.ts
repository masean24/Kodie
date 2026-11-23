import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

async function getGoogleAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`OAuth token gagal (${tokenRes.status}): ${errText}`);
  }

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('OAuth token response tidak memuat access_token');
  }

  return tokenData.access_token as string;
}

async function createMeetSpace(accessToken: string): Promise<{ name: string; meetingUri: string }> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        accessType: 'OPEN',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Meet spaces.create gagal (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.name || !data.meetingUri) {
    throw new Error('Response Google Meet API tidak lengkap (name / meetingUri kosong)');
  }

  return {
    name: data.name as string,
    meetingUri: data.meetingUri as string,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: 'KONFIGURASI_SERVER_BELUM_LENGKAP' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!bearerToken) {
    return jsonResponse({ error: 'TIDAK_BERHAK' }, 401);
  }

  let body: { kelas_id?: string } = {};
  try {
    const text = await req.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return jsonResponse({ error: 'VALIDASI_GAGAL' }, 400);
  }

  const kelasId = typeof body.kelas_id === 'string' && body.kelas_id.trim() !== ''
    ? body.kelas_id.trim()
    : null;

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const isServiceCall = bearerToken === supabaseServiceRoleKey;

  if (!isServiceCall) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return jsonResponse({ error: 'TIDAK_BERHAK' }, 401);
    }

    const userId = authData.user.id;
    const { data: pengguna, error: penggunaErr } = await adminClient
      .from('pengguna')
      .select('peran, status')
      .eq('id', userId)
      .single();

    if (penggunaErr || !pengguna) {
      return jsonResponse({ error: 'TIDAK_BERHAK' }, 403);
    }

    const isAdmin = pengguna.peran === 'admin' && pengguna.status === 'aktif';

    if (kelasId) {
      if (!isAdmin) {
        if (pengguna.peran !== 'pengajar' || pengguna.status !== 'terverifikasi') {
          return jsonResponse({ error: 'TIDAK_BERHAK' }, 403);
        }

        const { data: kelas, error: kelasErr } = await adminClient
          .from('kelas')
          .select('pengajar_id')
          .eq('id', kelasId)
          .single();

        if (kelasErr || !kelas || kelas.pengajar_id !== userId) {
          return jsonResponse({ error: 'TIDAK_BERHAK' }, 403);
        }
      }
    } else if (!isAdmin) {
      // Pemanggilan global (tanpa kelas_id) hanya untuk cron (service_role) atau admin
      return jsonResponse({ error: 'TIDAK_BERHAK' }, 403);
    }
  }

  // Ambil sesi terjadwal yang belum punya meet_uri
  let sesiQuery = adminClient
    .from('sesi')
    .select('id')
    .eq('status', 'terjadwal')
    .is('meet_uri', null)
    .order('mulai_pada', { ascending: true });

  if (kelasId) {
    sesiQuery = sesiQuery.eq('kelas_id', kelasId);
  }

  const { data: sesiList, error: sesiErr } = await sesiQuery;
  if (sesiErr) {
    return jsonResponse({ error: 'GAGAL_MEMBACA_SESI' }, 500);
  }

  if (!sesiList || sesiList.length === 0) {
    return jsonResponse({ berhasil: 0, gagal: 0 }, 200);
  }

  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
  const googleRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') ?? '';

  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    const errMsg = `[${new Date().toISOString()}] Secret Google OAuth belum dikonfigurasi`;
    await adminClient
      .from('sesi')
      .update({ meet_gagal_terakhir: errMsg })
      .in('id', sesiList.map((s) => s.id));

    return jsonResponse({ berhasil: 0, gagal: sesiList.length }, 200);
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(googleClientId, googleClientSecret, googleRefreshToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const errMsg = `[${new Date().toISOString()}] ${msg}`;
    await adminClient
      .from('sesi')
      .update({ meet_gagal_terakhir: errMsg.slice(0, 500) })
      .in('id', sesiList.map((s) => s.id));

    return jsonResponse({ berhasil: 0, gagal: sesiList.length }, 200);
  }

  let berhasil = 0;
  let gagal = 0;

  for (const sesi of sesiList) {
    try {
      const space = await createMeetSpace(accessToken);
      const { error: updateErr } = await adminClient
        .from('sesi')
        .update({
          meet_space: space.name,
          meet_uri: space.meetingUri,
          meet_dibuat_pada: new Date().toISOString(),
          meet_gagal_terakhir: null,
        })
        .eq('id', sesi.id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }
      berhasil += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const errMsg = `[${new Date().toISOString()}] ${msg}`;
      await adminClient
        .from('sesi')
        .update({ meet_gagal_terakhir: errMsg.slice(0, 500) })
        .eq('id', sesi.id);
      gagal += 1;
    }
  }

  // Jangan pernah mengembalikan meet_uri atau meet_space pada respons
  return jsonResponse({ berhasil, gagal }, 200);
});
