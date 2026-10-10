import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseUrl } from "@/lib/rag/parsers";
import { chunkText } from "@/lib/rag/chunker";
import { storeChunkEmbeddings } from "@/lib/rag/embeddings";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kbId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify KB ownership
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      select: { userId: true },
    });

    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    if (kb.userId !== user.id) {
      return NextResponse.json(
        { error: "Permission denied for this Knowledge Base" },
        { status: 403 }
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL string is required" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // Create Document record in PROCESSING status
    const docRecord = await prisma.document.create({
      data: {
        kbId,
        name: trimmedUrl,
        type: "URL",
        status: "PROCESSING",
      },
    });

    try {
      const { title, content } = await parseUrl(trimmedUrl);

      if (!content || !content.trim()) {
        throw new Error("Target web page yielded no readable body text.");
      }

      // Chunk the extracted page text
      const chunks = chunkText(content, {
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      if (chunks.length > 0) {
        await prisma.documentChunk.createMany({
          data: chunks.map((c) => ({
            documentId: docRecord.id,
            content: c.content,
            tokenCount: c.tokenCount,
            chunkIndex: c.index,
          })),
        });

        const createdChunks = await prisma.documentChunk.findMany({
          where: { documentId: docRecord.id },
          select: { id: true, content: true },
        });

        await storeChunkEmbeddings(createdChunks);
      }

      // Mark Document as READY and store page title
      const updatedDoc = await prisma.document.update({
        where: { id: docRecord.id },
        data: {
          name: title ? `${title} (${new URL(trimmedUrl).hostname})` : trimmedUrl,
          status: "READY",
          fileSize: Buffer.byteLength(content, "utf-8"),
        },
        include: {
          _count: { select: { chunks: true } },
        },
      });

      return NextResponse.json({
        message: "URL scraped and indexed successfully",
        document: updatedDoc,
      });
    } catch (crawlErr: unknown) {
      const crawlErrorMessage =
        crawlErr instanceof Error ? crawlErr.message : "Failed to crawl web URL";
      console.error("Scraping error:", crawlErr);
      await prisma.document.update({
        where: { id: docRecord.id },
        data: {
          status: "FAILED",
          errorMessage: crawlErrorMessage,
        },
      });

      return NextResponse.json(
        {
          error: crawlErrorMessage,
          documentId: docRecord.id,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Scrape route error:", error);
    return NextResponse.json(
      { error: "Failed to scrape target URL" },
      { status: 500 }
    );
  }
}
