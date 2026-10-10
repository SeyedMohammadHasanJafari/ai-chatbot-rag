import { prisma } from "@/lib/prisma";

export interface SimilarChunk {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  content: string;
  tokenCount: number | null;
  similarity: number;
}

const VECTOR_DIMENSION = 1536;

/**
 * Generates a deterministic unit-normalized pseudo-embedding for testing/demo fallback.
 */
function generateDeterministicVector(text: string, dimensions = VECTOR_DIMENSION): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const vector: number[] = new Array(dimensions);
  let norm = 0;

  for (let i = 0; i < dimensions; i++) {
    // Linear congruential pseudo-random value based on hash and index
    const val = Math.sin(hash + i * 137.5) * 10000;
    const component = val - Math.floor(val) - 0.5;
    vector[i] = component;
    norm += component * component;
  }

  norm = Math.sqrt(norm) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Calls Aval AI embedding endpoint or falls back to deterministic vectors if no key is set.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  const apiKey = process.env.AVAL_AI_API_KEY;
  const baseUrl = (process.env.AVAL_AI_BASE_URL || "https://api.avalai.ir/v1").replace(/\/+$/, "");
  const model = process.env.AVAL_AI_EMBEDDING_MODEL || "text-embedding-3-small";

  // If no API key is provided, log notice and generate local deterministic embeddings
  if (!apiKey || apiKey.trim() === "") {
    console.warn(
      "Notice: AVAL_AI_API_KEY is not set. Generating normalized pseudo-embeddings for development/demo."
    );
    return texts.map((t) => generateDeterministicVector(t));
  }

  const batchSize = 16;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    try {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: batch,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Aval AI embedding API returned HTTP ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format from embedding API");
      }

      interface ApiEmbeddingItem {
        index: number;
        embedding: number[];
      }
      const sorted = (data.data as ApiEmbeddingItem[]).sort(
        (a, b) => a.index - b.index
      );
      for (const item of sorted) {
        allEmbeddings.push(item.embedding);
      }
    } catch (err) {
      console.error("Embedding generation failed, falling back for current batch:", err);
      // Fallback for this batch so ingestion doesn't crash completely
      for (const text of batch) {
        allEmbeddings.push(generateDeterministicVector(text));
      }
    }
  }

  return allEmbeddings;
}

/**
 * Generates an embedding for a user query.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([query]);
  return embeddings[0] || generateDeterministicVector(query);
}

/**
 * Stores embeddings into PostgreSQL using the pgvector extension for a batch of DocumentChunks.
 */
export async function storeChunkEmbeddings(
  chunks: { id: string; content: string }[]
): Promise<void> {
  if (!chunks || chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    if (!embedding) continue;

    const vectorString = `[${embedding.join(",")}]`;

    try {
      // Execute pgvector parameterized raw update
      await prisma.$executeRawUnsafe(
        `UPDATE "DocumentChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
        vectorString,
        chunk.id
      );
    } catch (dbError) {
      console.warn(
        `pgvector update failed for chunk ${chunk.id}. Verify pgvector extension is enabled in PostgreSQL:`,
        dbError
      );
    }
  }
}

/**
 * Performs Cosine Similarity vector search in pgvector with diversified multi-document coverage.
 * Ensures all document formats (PDF, DOCX, TXT, MD, URL) are fairly represented and not starved by large documents.
 */
interface RawSimilarityRow {
  id: string;
  documentId: string;
  content: string;
  tokenCount: number | null;
  documentName: string;
  documentType: string;
  similarity: number | string;
}

export async function searchSimilarChunks(
  kbId: string,
  queryEmbedding: number[],
  topK: number = 8,
  queryText?: string
): Promise<SimilarChunk[]> {
  const vectorString = `[${queryEmbedding.join(",")}]`;

  try {
    // 1. Primary pgvector Cosine Similarity query across all chunks
    const results = await prisma.$queryRawUnsafe<RawSimilarityRow[]>(
      `
      SELECT 
        c."id",
        c."documentId",
        c."content",
        c."tokenCount",
        d."name" as "documentName",
        d."type"::text as "documentType",
        (1 - (c."embedding" <=> $1::vector)) as "similarity"
      FROM "DocumentChunk" c
      JOIN "Document" d ON c."documentId" = d."id"
      WHERE d."kbId" = $2 
        AND d."status" = 'READY'
        AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" <=> $1::vector ASC
      LIMIT $3;
      `,
      vectorString,
      kbId,
      topK
    );

    const chunkMap = new Map<string, SimilarChunk>();
    for (const row of results) {
      chunkMap.set(row.id, {
        id: row.id,
        documentId: row.documentId,
        documentName: row.documentName,
        documentType: row.documentType,
        content: row.content,
        tokenCount: row.tokenCount,
        similarity: Number(row.similarity) || 0,
      });
    }

    // 2. Multi-document fair coverage: Ensure every READY document in KB has at least 1 top relevant chunk represented
    const readyDocs = await prisma.document.findMany({
      where: { kbId, status: "READY" },
      select: { id: true, name: true, type: true },
    });

    const coveredDocIds = new Set(Array.from(chunkMap.values()).map((c) => c.documentId));

    for (const doc of readyDocs) {
      if (!coveredDocIds.has(doc.id) && chunkMap.size < 10) {
        // Fetch the highest similarity chunk specifically for this unrepresented document
        const docChunks = await prisma.$queryRawUnsafe<RawSimilarityRow[]>(
          `
          SELECT 
            c."id",
            c."documentId",
            c."content",
            c."tokenCount",
            d."name" as "documentName",
            d."type"::text as "documentType",
            (1 - (c."embedding" <=> $1::vector)) as "similarity"
          FROM "DocumentChunk" c
          JOIN "Document" d ON c."documentId" = d."id"
          WHERE c."documentId" = $2 
            AND c."embedding" IS NOT NULL
          ORDER BY c."embedding" <=> $1::vector ASC
          LIMIT 1;
          `,
          vectorString,
          doc.id
        );

        if (docChunks && docChunks.length > 0) {
          const row = docChunks[0];
          chunkMap.set(row.id, {
            id: row.id,
            documentId: row.documentId,
            documentName: row.documentName,
            documentType: row.documentType,
            content: row.content,
            tokenCount: row.tokenCount,
            similarity: Number(row.similarity) || 0.1,
          });
        }
      }
    }

    // 3. Keyword / Direct document name matching if query mentions a file type (pdf, docx, txt, etc.) or terms
    if (queryText && queryText.trim()) {
      const lowerQuery = queryText.toLowerCase();
      const typeKeywords = ["pdf", "docx", "txt", "word", "پی دی اف", "متن", "سند", "فایل"];
      const hasTypeIntent = typeKeywords.some((k) => lowerQuery.includes(k));

      if (hasTypeIntent || lowerQuery.length > 3) {
        const keywordChunks = await prisma.documentChunk.findMany({
          where: {
            document: { kbId, status: "READY" },
            OR: [
              { content: { contains: queryText.slice(0, 25), mode: "insensitive" } },
              { document: { name: { contains: queryText.slice(0, 20), mode: "insensitive" } } },
            ],
          },
          include: {
            document: { select: { name: true, type: true } },
          },
          take: 3,
        });

        for (const kc of keywordChunks) {
          if (!chunkMap.has(kc.id)) {
            chunkMap.set(kc.id, {
              id: kc.id,
              documentId: kc.documentId,
              documentName: kc.document.name,
              documentType: kc.document.type,
              content: kc.content,
              tokenCount: kc.tokenCount,
              similarity: 0.75,
            });
          }
        }
      }
    }

    return Array.from(chunkMap.values());
  } catch (vectorSearchError) {
    console.warn(
      "pgvector similarity search failed. Falling back to keyword/document matching:",
      vectorSearchError
    );

    // Fallback if pgvector is not initialized or vector column is empty: return top chunks from ready documents
    const fallbackChunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          kbId,
          status: "READY",
        },
      },
      include: {
        document: {
          select: { name: true, type: true },
        },
      },
      take: topK,
    });

    return fallbackChunks.map((c) => ({
      id: c.id,
      documentId: c.documentId,
      documentName: c.document.name,
      documentType: c.document.type,
      content: c.content,
      tokenCount: c.tokenCount,
      similarity: 0.85,
    }));
  }
}
