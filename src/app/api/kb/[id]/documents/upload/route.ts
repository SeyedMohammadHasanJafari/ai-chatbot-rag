import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parsePdf, parseDocx, parseText } from "@/lib/rag/parsers";
import { chunkText } from "@/lib/rag/chunker";
import { storeChunkEmbeddings } from "@/lib/rag/embeddings";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      // Check single 'file' fallback
      const singleFile = formData.get("file") as File | null;
      if (singleFile) {
        files.push(singleFile);
      } else {
        return NextResponse.json(
          { error: "No files provided in upload request" },
          { status: 400 }
        );
      }
    }

    const results = [];

    for (const file of files) {
      const fileName = file.name;
      const fileSize = file.size;

      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${fileName}" exceeds the 5MB size limit.` },
          { status: 400 }
        );
      }

      const lowerName = fileName.toLowerCase();
      let docType: "PDF" | "DOCX" | "TXT" | "MD" | null = null;

      if (lowerName.endsWith(".pdf")) docType = "PDF";
      else if (lowerName.endsWith(".docx")) docType = "DOCX";
      else if (lowerName.endsWith(".txt")) docType = "TXT";
      else if (lowerName.endsWith(".md")) docType = "MD";

      if (!docType) {
        return NextResponse.json(
          {
            error: `Unsupported file format for "${fileName}". Only PDF, DOCX, TXT, and MD are supported.`,
          },
          { status: 400 }
        );
      }

      // Create Document in PROCESSING status
      const docRecord = await prisma.document.create({
        data: {
          kbId,
          name: fileName,
          type: docType,
          fileSize,
          status: "PROCESSING",
        },
      });

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let extractedText = "";
        if (docType === "PDF") {
          extractedText = await parsePdf(buffer);
        } else if (docType === "DOCX") {
          extractedText = await parseDocx(buffer);
        } else {
          extractedText = parseText(buffer);
        }

        if (!extractedText || !extractedText.trim()) {
          throw new Error("No readable text found in document.");
        }

        // Split text into chunks
        const chunks = chunkText(extractedText, {
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        // Insert chunks into database
        if (chunks.length > 0) {
          await prisma.documentChunk.createMany({
            data: chunks.map((c) => ({
              documentId: docRecord.id,
              content: c.content,
              tokenCount: c.tokenCount,
              chunkIndex: c.index,
            })),
          });

          // Generate vector embeddings and store in pgvector
          const createdChunks = await prisma.documentChunk.findMany({
            where: { documentId: docRecord.id },
            select: { id: true, content: true },
          });

          await storeChunkEmbeddings(createdChunks);
        }

        // Mark document as READY
        const updatedDoc = await prisma.document.update({
          where: { id: docRecord.id },
          data: { status: "READY" },
          include: {
            _count: { select: { chunks: true } },
          },
        });

        results.push(updatedDoc);
      } catch (parseErr: unknown) {
        const parseErrorMessage =
          parseErr instanceof Error ? parseErr.message : "Failed to parse document text";
        console.error(`Error processing file ${fileName}:`, parseErr);
        await prisma.document.update({
          where: { id: docRecord.id },
          data: {
            status: "FAILED",
            errorMessage: parseErrorMessage,
          },
        });
        results.push({
          ...docRecord,
          status: "FAILED",
          errorMessage: parseErrorMessage,
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} document(s)`,
      documents: results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload request" },
      { status: 500 }
    );
  }
}
