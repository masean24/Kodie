// ============================================================================
// Script CLI Ingestion Knowledge Base untuk AI Chatbot "Kiko"
// - Split berbasis heading (#, ##, ###) + recursive character splitter (~1200 char, overlap 200)
// - SHA-256 contentHash agar dokumen yang belum berubah tidak di-embed ulang
// - Batch embedding gemini-embedding-001 (768d) + WAJIB L2 Normalization
// ============================================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSafeExternalUrl, l2Normalize } from '../supabase/functions/chat/guardrails.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface KnowledgeChunk {
  sourceTitle: string;
  sourceUrl: string;
  headingPath: string;
  content: string;
}

const SOURCE_URL_MAP: Record<string, string> = {
  '01-tentang-kodie-dan-program.md': '/program',
  '02-cara-daftar-dan-persetujuan-ortu.md': '/daftar',
  '03-tes-minat-dan-simulasi-jurusan.md': '/tes-minat',
  '04-booking-pembayaran-dan-masuk-kelas.md': '/kelas',
  '05-faq-dan-kebijakan-privasi.md': '/kebijakan-privasi',
};

/**
 * Recursive character splitter dengan target ~1.200 karakter dan overlap 200 karakter.
 */
export function recursiveSplitText(
  text: string,
  targetSize = 1200,
  overlap = 200,
): string[] {
  const clean = text.trim();
  if (clean.length <= targetSize) {
    return clean ? [clean] : [];
  }

  const separators = ['\n\n', '\n', '. ', ' '];
  const results: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + targetSize, clean.length);
    if (end < clean.length) {
      for (const sep of separators) {
        const lastIdx = clean.lastIndexOf(sep, end);
        if (lastIdx > start + Math.floor(targetSize * 0.4)) {
          end = lastIdx + sep.length;
          break;
        }
      }
    }

    const slice = clean.slice(start, end).trim();
    if (slice) {
      results.push(slice);
    }
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return results;
}

/**
 * Split dokumen Markdown berbasis heading (#, ##, ###) lalu recursive character splitter.
 */
export function splitMarkdownByHeadings(
  markdown: string,
  sourceUrl: string,
  fallbackTitle: string,
): { sourceTitle: string; chunks: KnowledgeChunk[] } {
  const lines = markdown.split(/\r?\n/);
  let h1 = fallbackTitle;
  let h2 = '';
  let h3 = '';
  let currentBuffer: string[] = [];
  const rawSections: Array<{ headingPath: string; text: string }> = [];

  const flushSection = () => {
    const body = currentBuffer.join('\n').trim();
    if (body.length > 0) {
      const pathParts = [h1, h2, h3].filter(Boolean);
      rawSections.push({
        headingPath: pathParts.join(' > '),
        text: body,
      });
    }
    currentBuffer = [];
  };

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match) {
      flushSection();
      h1 = h1Match[1].trim();
      h2 = '';
      h3 = '';
    } else if (h2Match) {
      flushSection();
      h2 = h2Match[1].trim();
      h3 = '';
    } else if (h3Match) {
      flushSection();
      h3 = h3Match[1].trim();
    } else {
      currentBuffer.push(line);
    }
  }
  flushSection();

  const chunks: KnowledgeChunk[] = [];
  for (const sec of rawSections) {
    const subChunks = recursiveSplitText(sec.text, 1200, 200);
    for (const sub of subChunks) {
      chunks.push({
        sourceTitle: h1,
        sourceUrl,
        headingPath: sec.headingPath,
        content: sub,
      });
    }
  }

  return { sourceTitle: h1, chunks };
}

/**
 * Batch embedding menggunakan gemini-embedding-001 (outputDimensionality: 768) + L2 Normalization.
 */
async function batchEmbedDocuments(
  chunks: KnowledgeChunk[],
  apiKey: string,
): Promise<number[][]> {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents';

  const requests = chunks.map((c) => ({
    model: 'models/gemini-embedding-001',
    content: {
      parts: [
        {
          // Gabungkan sourceTitle dan headingPath di awal teks chunk untuk akurasi semantik
          text: `${c.sourceTitle} | ${c.headingPath}\n\n${c.content}`,
        },
      ],
    },
    taskType: 'RETRIEVAL_DOCUMENT',
    title: c.sourceTitle,
    outputDimensionality: 768,
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`batchEmbedContents gagal (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const embeddings = data?.embeddings;
  if (!Array.isArray(embeddings) || embeddings.length !== chunks.length) {
    throw new Error('Jumlah embedding dari Gemini tidak sesuai dengan jumlah chunk');
  }

  return embeddings.map((item: { values: number[] }) => {
    if (!Array.isArray(item?.values) || item.values.length !== 768) {
      throw new Error('Dimensi vektor dari Gemini bukan 768');
    }
    // WAJIB L2 Normalization
    return l2Normalize(item.values);
  });
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error(
      'ERROR: GEMINI_API_KEY belum diisi di backend/.env. Tambahkan GEMINI_API_KEY untuk menjalankan embedding gemini-embedding-001.',
    );
    process.exit(1);
  }

  const knowledgeDir = path.resolve(__dirname, '../../docs/knowledge');
  if (!fs.existsSync(knowledgeDir)) {
    console.error(`Folder ${knowledgeDir} tidak ditemukan.`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(knowledgeDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  console.log(`Ditemukan ${files.length} dokumen di docs/knowledge/...`);

  for (const file of files) {
    const fullPath = path.join(knowledgeDir, file);
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    const contentHash = crypto.createHash('sha256').update(rawContent).digest('hex');
    const slug = file.replace(/\.md$/i, '');
    const sourceUrl = SOURCE_URL_MAP[file] ?? '/';

    // Jika URL eksternal, pastikan lolos SSRF check
    if (sourceUrl.startsWith('http') && !isSafeExternalUrl(sourceUrl)) {
      throw new Error(`SSRF Guard: URL tidak diizinkan (${sourceUrl})`);
    }

    const { data: existingSource } = await supabase
      .from('knowledge_sources')
      .select('id, content_hash')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSource && existingSource.content_hash === contentHash) {
      console.log(`  [SKIP] ${file} belum berubah (SHA-256 cocok).`);
      continue;
    }

    const { sourceTitle, chunks } = splitMarkdownByHeadings(rawContent, sourceUrl, slug);
    console.log(`  [INGEST] ${file} -> ${chunks.length} chunk...`);

    const vectors = await batchEmbedDocuments(chunks, GEMINI_API_KEY);

    const { data: sourceRow, error: sourceErr } = await supabase
      .from('knowledge_sources')
      .upsert(
        {
          slug,
          source_title: sourceTitle,
          source_url: sourceUrl,
          content_hash: contentHash,
          diperbarui_pada: new Date().toISOString(),
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();

    if (sourceErr || !sourceRow) {
      throw new Error(`Gagal menyimpan knowledge_sources untuk ${file}: ${sourceErr?.message}`);
    }

    // Hapus chunk lama untuk source_id tersebut lalu masukkan chunk baru
    await supabase.from('document_chunks').delete().eq('source_id', sourceRow.id);

    const chunkRows = chunks.map((c, idx) => ({
      source_id: sourceRow.id,
      chunk_index: idx,
      source_title: c.sourceTitle,
      source_url: c.sourceUrl,
      heading_path: c.headingPath,
      content: c.content,
      embedding: JSON.stringify(vectors[idx]),
    }));

    const { error: chunkErr } = await supabase.from('document_chunks').insert(chunkRows);
    if (chunkErr) {
      throw new Error(`Gagal menyimpan document_chunks untuk ${file}: ${chunkErr.message}`);
    }

    console.log(`  [OK] ${file}: ${chunks.length} chunk tersimpan (768d L2-normalized).`);
  }

  console.log('\nIngestion knowledge base selesai!');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((err) => {
    console.error('Ingestion gagal:', err);
    process.exit(1);
  });
}
