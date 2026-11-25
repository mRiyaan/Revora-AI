import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { SopCitation } from '@revora/shared';
import { CONFIG } from '../config';
import { getDb } from '../db/connection';

interface SopChunkRecord {
  chunkId: string;
  pointId: string;
  policyCode: string;
  docTitle: string;
  version: string;
  department: string;
  category: string;
  propertyScope: string;
  sectionRef: string;
  content: string;
  active: boolean;
  vector?: number[];
}

const LOCAL_DIM = 128;

function computeDeterministicVector(text: string): number[] {
  const vec = new Array<number>(LOCAL_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9₹\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const hash1 = crypto.createHash('sha256').update(tok).digest();
    const idx1 = hash1.readUInt16BE(0) % LOCAL_DIM;
    const sign1 = hash1[2] % 2 === 0 ? 1 : -1;
    vec[idx1] += sign1 * 1.0;

    if (i + 1 < tokens.length) {
      const bigram = `${tok}_${tokens[i + 1]}`;
      const hash2 = crypto.createHash('sha256').update(bigram).digest();
      const idx2 = hash2.readUInt16BE(0) % LOCAL_DIM;
      vec[idx2] += 0.7;
    }
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateEmbedding(text: string): Promise<{
  vector: number[];
  mode: 'gemini' | 'deterministic';
}> {
  if (CONFIG.geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
      const res = await ai.models.embedContent({
        model: CONFIG.geminiEmbeddingModel,
        contents: text,
      });
      const values =
        (res as { embeddings?: { values?: number[] }[] }).embeddings?.[0]?.values ||
        (res as { embedding?: { values?: number[] } }).embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return { vector: values, mode: 'gemini' };
      }
    } catch {
      // Fall back to deterministic embedding if live Gemini embedding fails
    }
  }
  return { vector: computeDeterministicVector(text), mode: 'deterministic' };
}

function parseSopFiles(): {
  policies: {
    id: string;
    policyCode: string;
    docTitle: string;
    version: string;
    department: string;
    category: string;
    propertyScope: string;
    filePath: string;
  }[];
  chunks: SopChunkRecord[];
} {
  const files = fs.existsSync(CONFIG.sopsDir)
    ? fs.readdirSync(CONFIG.sopsDir).filter((f) => f.endsWith('.md'))
    : [];

  const policies: {
    id: string;
    policyCode: string;
    docTitle: string;
    version: string;
    department: string;
    category: string;
    propertyScope: string;
    filePath: string;
  }[] = [];
  const chunks: SopChunkRecord[] = [];

  for (const file of files) {
    const fullPath = path.join(CONFIG.sopsDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const lines = raw.split('\n');

    const titleLine = lines.find((l) => l.startsWith('# ')) || `# ${file}`;
    const docTitle = titleLine.replace(/^#\s+/, '').trim();
    const extractMeta = (key: string, fallback: string) => {
      const m = raw.match(new RegExp(`-\\s*${key}:\\s*(.+)`, 'i'));
      return m ? m[1].trim() : fallback;
    };

    const policyCode = extractMeta('Policy Code', file.replace('.md', '').toUpperCase());
    const version = extractMeta('Version', '1.0');
    const department = extractMeta('Department', 'Support');
    const category = extractMeta('Category', 'general').toLowerCase();
    const propertyScope = extractMeta('Property Scope', 'ALL');
    const policyId = `pol_${policyCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    policies.push({
      id: policyId,
      policyCode,
      docTitle,
      version,
      department,
      category,
      propertyScope,
      filePath: fullPath,
    });

    const sectionMatches = raw.split(/^##\s+/m).slice(1);
    sectionMatches.forEach((sectionBlock, idx) => {
      const blockLines = sectionBlock.trim().split('\n');
      const heading = blockLines[0].trim();
      const content = blockLines.slice(1).join('\n').trim();
      if (!content) return;

      const secMatch = heading.match(/(Section\s+[\d.]+)/i);
      const sectionRef = secMatch ? secMatch[1] : `Section ${idx + 1}`;
      const chunkId = `${policyCode}_${sectionRef.replace(/[^a-zA-Z0-9]/g, '_')}`;
      // Deterministic UUID for Qdrant point id
      const md5 = crypto.createHash('md5').update(chunkId).digest('hex');
      const pointId = `${md5.slice(0, 8)}-${md5.slice(8, 12)}-${md5.slice(12, 16)}-${md5.slice(16, 20)}-${md5.slice(20, 32)}`;

      chunks.push({
        chunkId,
        pointId,
        policyCode,
        docTitle,
        version,
        department,
        category,
        propertyScope,
        sectionRef: `${sectionRef} — ${heading.replace(/^Section\s+[\d.]+\s*[—-]\s*/i, '')}`,
        content,
        active: true,
      });
    });
  }

  return { policies, chunks };
}

async function isQdrantReachable(): Promise<QdrantClient | null> {
  try {
    const client = new QdrantClient({ url: CONFIG.qdrantUrl });
    await Promise.race([
      client.getCollections(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
    ]);
    return client;
  } catch {
    return null;
  }
}

export async function indexAllSops(): Promise<{
  policiesCount: number;
  chunksCount: number;
  vectorMode: 'qdrant_live' | 'local_qdrant_mirror';
}> {
  const db = getDb();
  const { policies, chunks } = parseSopFiles();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare('DELETE FROM policy_chunks').run();
    db.prepare('DELETE FROM policies').run();

    for (const p of policies) {
      db.prepare(
        `INSERT INTO policies (id, policy_code, doc_title, version, department, category, property_scope, file_path, active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).run(
        p.id,
        p.policyCode,
        p.docTitle,
        p.version,
        p.department,
        p.category,
        p.propertyScope,
        p.filePath,
        now
      );
    }

    for (const c of chunks) {
      const policyId = `pol_${c.policyCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      db.prepare(
        `INSERT INTO policy_chunks (id, policy_id, policy_code, doc_title, version, department, category, property_scope, section_ref, content, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        c.chunkId,
        policyId,
        c.policyCode,
        c.docTitle,
        c.version,
        c.department,
        c.category,
        c.propertyScope,
        c.sectionRef,
        c.content
      );
    }
  })();

  const embeddedChunks: SopChunkRecord[] = [];
  for (const chunk of chunks) {
    const { vector } = await generateEmbedding(
      `${chunk.docTitle} ${chunk.category} ${chunk.department} ${chunk.sectionRef} ${chunk.content}`
    );
    embeddedChunks.push({ ...chunk, vector });
  }

  // Always persist local Qdrant-mirror vectors under ./storage/qdrant/
  fs.mkdirSync(path.dirname(CONFIG.qdrantStorageFile), { recursive: true });
  fs.writeFileSync(
    CONFIG.qdrantStorageFile,
    JSON.stringify({ updatedAt: now, chunks: embeddedChunks }, null, 2)
  );

  // Attempt live Qdrant indexing if Qdrant server (:6333) is running
  const qdrant = await isQdrantReachable();
  if (qdrant && embeddedChunks.length > 0) {
    try {
      const dim = embeddedChunks[0].vector!.length;
      const existing = await qdrant.getCollections();
      const exists = existing.collections.some((c) => c.name === CONFIG.qdrantCollection);
      if (exists) {
        await qdrant.deleteCollection(CONFIG.qdrantCollection);
      }
      await qdrant.createCollection(CONFIG.qdrantCollection, {
        vectors: { size: dim, distance: 'Cosine' },
      });

      await qdrant.upsert(CONFIG.qdrantCollection, {
        wait: true,
        points: embeddedChunks.map((c) => ({
          id: c.pointId,
          vector: c.vector!,
          payload: {
            chunkId: c.chunkId,
            policyCode: c.policyCode,
            docTitle: c.docTitle,
            version: c.version,
            department: c.department,
            category: c.category,
            propertyScope: c.propertyScope,
            sectionRef: c.sectionRef,
            content: c.content,
            active: c.active,
          },
        })),
      });

      return {
        policiesCount: policies.length,
        chunksCount: embeddedChunks.length,
        vectorMode: 'qdrant_live',
      };
    } catch (err) {
      console.warn('[SOP RAG] Qdrant upsert failed, using local Qdrant mirror:', err);
    }
  }

  return {
    policiesCount: policies.length,
    chunksCount: embeddedChunks.length,
    vectorMode: 'local_qdrant_mirror',
  };
}

export interface SearchSopParams {
  query: string;
  category?: string;
  department?: string;
  propertyId?: string;
  limit?: number;
}

export async function searchSops(params: SearchSopParams): Promise<{
  citations: SopCitation[];
  policyEvidenceUnavailable: boolean;
  vectorMode: 'qdrant_live' | 'local_qdrant_mirror';
}> {
  const limit = params.limit ?? 3;
  const { vector: queryVec } = await generateEmbedding(params.query);

  // Normalize category filter to known SOP buckets when appropriate
  const normCategory = params.category?.toLowerCase();
  const filterCategory =
    normCategory && ['billing', 'safety', 'cleanliness', 'general'].includes(normCategory)
      ? normCategory
      : normCategory === 'privacy' || normCategory === 'misconduct'
        ? 'safety'
        : undefined;

  const qdrant = await isQdrantReachable();
  if (qdrant) {
    try {
      const mustFilters: Record<string, unknown>[] = [
        { key: 'active', match: { value: true } },
      ];
      if (filterCategory) {
        mustFilters.push({ key: 'category', match: { value: filterCategory } });
      }
      if (params.department) {
        mustFilters.push({ key: 'department', match: { value: params.department } });
      }

      const queryRes = await qdrant.query(CONFIG.qdrantCollection, {
        query: queryVec,
        limit,
        filter: { must: mustFilters as never },
        with_payload: true,
      });

      const points = queryRes.points || [];
      const citations: SopCitation[] = points
        .filter((r) => (r.score ?? 0) >= 0.12)
        .map((r) => {
          const p = (r.payload || {}) as Record<string, unknown>;
          return {
            chunkId: String(p.chunkId || r.id),
            policyCode: String(p.policyCode || ''),
            docTitle: String(p.docTitle || ''),
            version: String(p.version || '1.0'),
            department: String(p.department || ''),
            category: String(p.category || ''),
            sectionRef: String(p.sectionRef || ''),
            score: Number((r.score ?? 0).toFixed(3)),
            excerpt: String(p.content || ''),
          };
        });

      return {
        citations,
        policyEvidenceUnavailable: citations.length === 0,
        vectorMode: 'qdrant_live',
      };
    } catch {
      // Fallback to local mirror
    }
  }

  if (!fs.existsSync(CONFIG.qdrantStorageFile)) {
    await indexAllSops();
  }

  const rawStore = JSON.parse(fs.readFileSync(CONFIG.qdrantStorageFile, 'utf8')) as {
    chunks: SopChunkRecord[];
  };

  const queryTerms = params.query
    .toLowerCase()
    .replace(/[^a-z0-9₹\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  let candidates = rawStore.chunks.filter((c) => c.active);
  if (filterCategory) {
    const catMatches = candidates.filter((c) => c.category.toLowerCase() === filterCategory);
    if (catMatches.length > 0) candidates = catMatches;
  }
  if (params.department) {
    const deptMatches = candidates.filter(
      (c) => c.department.toLowerCase() === params.department!.toLowerCase()
    );
    if (deptMatches.length > 0) candidates = deptMatches;
  }

  const scored = candidates.map((c) => {
    const vecSim =
      c.vector && c.vector.length === queryVec.length
        ? cosineSimilarity(queryVec, c.vector)
        : 0;
    const hay = `${c.docTitle} ${c.sectionRef} ${c.content}`.toLowerCase();
    const lexicalHits = queryTerms.reduce(
      (acc, term) => (hay.includes(term) ? acc + 1 : acc),
      0
    );
    const lexicalScore =
      queryTerms.length > 0 ? Math.min(1, lexicalHits / Math.min(queryTerms.length, 6)) : 0;
    const combined = Number((vecSim * 0.55 + lexicalScore * 0.45).toFixed(3));
    return { chunk: c, score: combined };
  });

  scored.sort((a, b) => b.score - a.score);

  const citations: SopCitation[] = scored
    .filter((s) => s.score >= 0.14)
    .slice(0, limit)
    .map((s) => ({
      chunkId: s.chunk.chunkId,
      policyCode: s.chunk.policyCode,
      docTitle: s.chunk.docTitle,
      version: s.chunk.version,
      department: s.chunk.department,
      category: s.chunk.category,
      sectionRef: s.chunk.sectionRef,
      score: s.score,
      excerpt: s.chunk.content,
    }));

  return {
    citations,
    policyEvidenceUnavailable: citations.length === 0,
    vectorMode: 'local_qdrant_mirror',
  };
}

export async function getVectorModeStatus(): Promise<'qdrant_live' | 'local_qdrant_mirror'> {
  const client = await isQdrantReachable();
  return client ? 'qdrant_live' : 'local_qdrant_mirror';
}

export function listPolicies() {
  const db = getDb();
  const policies = db
    .prepare(`SELECT * FROM policies ORDER BY policy_code ASC`)
    .all() as Record<string, unknown>[];
  const chunks = db
    .prepare(`SELECT * FROM policy_chunks ORDER BY id ASC`)
    .all() as Record<string, unknown>[];

  return policies.map((p) => ({
    id: String(p.id),
    policyCode: String(p.policy_code),
    docTitle: String(p.doc_title),
    version: String(p.version),
    department: String(p.department),
    category: String(p.category),
    propertyScope: String(p.property_scope),
    active: Boolean(p.active),
    updatedAt: String(p.updated_at),
    chunks: chunks
      .filter((c) => String(c.policy_id) === String(p.id))
      .map((c) => ({
        id: String(c.id),
        sectionRef: String(c.section_ref),
        content: String(c.content),
      })),
  }));
}
