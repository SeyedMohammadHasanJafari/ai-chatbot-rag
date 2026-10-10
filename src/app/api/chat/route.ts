import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { generateQueryEmbedding, searchSimilarChunks } from "@/lib/rag/embeddings";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, kbId } = await req.json();

    if (!kbId) {
      return new Response(JSON.stringify({ error: "kbId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: {
        documents: {
          where: { status: "READY" },
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!kb) {
      return new Response(JSON.stringify({ error: "Knowledge Base not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract the latest user query
    const lastUserMessage =
      messages && messages.length > 0
        ? messages[messages.length - 1].content
        : "";

    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "Empty query" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Generate query embedding and retrieve top similar chunks with multi-document fair coverage
    const queryEmbedding = await generateQueryEmbedding(lastUserMessage);
    const similarChunks = await searchSimilarChunks(kbId, queryEmbedding, 8, lastUserMessage);

    // 2. Build structured context block with [Doc X] citations
    let contextText = "";
    const citations = similarChunks.map((chunk, index) => {
      const docLabel = `Doc ${index + 1}`;
      contextText += `\n[${docLabel}] (Source: ${chunk.documentName} [${chunk.documentType}]):\n${chunk.content}\n`;
      return {
        id: chunk.id,
        label: docLabel,
        documentName: chunk.documentName,
        documentType: chunk.documentType,
        snippet: chunk.content,
        similarity: chunk.similarity,
      };
    });

    const sourcesHeader = Buffer.from(
      encodeURIComponent(JSON.stringify(citations)),
      "utf-8"
    ).toString("base64");

    // Summary of all available documents attached to this knowledge base
    const attachedDocsSummary =
      kb.documents && kb.documents.length > 0
        ? kb.documents.map((d, i) => `${i + 1}. ${d.name} (${d.type})`).join("\n")
        : "None";

    // 3. Formulate strict system prompt
    const basePrompt =
      kb.prompt ||
      "You are a helpful knowledge assistant. Answer the user's questions clearly based on the provided context.";

    const systemPrompt = `
${basePrompt}

=== ATTACHED KNOWLEDGE DOCUMENTS IN THIS BOT ===
${attachedDocsSummary}

=== RETRIEVED CONTEXT DOCUMENT CHUNKS ===
${contextText || "No relevant document chunks retrieved."}
================================================

INSTRUCTIONS:
1. Answer the user question accurately using the information in the CONTEXT DOCUMENTS above.
2. You have access to all document types in this knowledge base (PDF, Word DOCX, Plain Text TXT, Markdown MD, and Web URLs). If the user asks about a specific file or all files, refer to all relevant context chunks and the attached documents list.
3. If the user asks for a general summary or overview of the uploaded files, synthesize an organized overview across the available documents.
4. If the context does not contain enough relevant information to answer a specific question, explain what is available or state: "بر اساس مستندات ارائه شده، پاسخ این پرسش در دسترس نیست."
5. Every factual statement derived from a source MUST cite its source like [Doc 1], [Doc 2], etc.
6. If the user query is in Persian (Farsi), reply in polite, fluent Persian while citing [Doc X] sources.
`.trim();

    const apiKey = process.env.AVAL_AI_API_KEY;
    const baseURL = (process.env.AVAL_AI_BASE_URL || "https://api.avalai.ir/v1").replace(/\/+$/, "");
    const modelName = process.env.AVAL_AI_MODEL || "gpt-4o-mini";

    // Fallback streaming mode if Aval AI API key is not yet configured
    if (!apiKey || apiKey.trim() === "") {
      const isPersianQuery = /[\u0600-\u06FF]/.test(lastUserMessage);

      let simulatedResponse = "";
      if (citations.length > 0) {
        if (isPersianQuery) {
          simulatedResponse = `بر اساس مستندات موجود [${citations[0].label}]، اطلاعات استخراج‌شده به شرح زیر است:\n\n${citations[0].snippet}\n\n`;
          if (citations.length > 1) {
            simulatedResponse += `همچنین مطابق با منبع [${citations[1].label}]:\n${citations[1].snippet}\n\n`;
          }
        } else {
          simulatedResponse = `Based on the retrieved documentation [${citations[0].label}], here is the verified information:\n\n${citations[0].snippet}\n\n`;
          if (citations.length > 1) {
            simulatedResponse += `Furthermore, according to [${citations[1].label}]:\n${citations[1].snippet}\n\n`;
          }
        }
      } else {
        simulatedResponse = isPersianQuery
          ? "با توجه به مدارک و مستندات بارگذاری‌شده در این پایگاه دانش، پاسخی برای این پرسش یافت نشد."
          : "I do not know based on the provided documents.";
      }

      // Stream grounded tokens
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const words = simulatedResponse.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((r) => setTimeout(r, 25));
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Sources": sourcesHeader,
          "Cache-Control": "no-cache",
        },
      });
    }

    // 4. Live streaming with Aval AI via Vercel AI SDK
    const avalAi = createOpenAI({
      baseURL,
      apiKey,
    });

    const result = streamText({
      model: avalAi(modelName),
      system: systemPrompt,
      messages,
      temperature: 0.2, // Low temperature for high factual accuracy & zero hallucination
    });

    const response = result.toTextStreamResponse();
    response.headers.set("X-Sources", sourcesHeader);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process chat query";
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
