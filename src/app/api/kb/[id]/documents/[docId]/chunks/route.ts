import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: kbId, docId } = await params;
    const user = await getCurrentUser();

    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      select: { userId: true, isPublic: true },
    });

    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    const isOwner = user?.id === kb.userId;
    if (!isOwner && !kb.isPublic) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            content: true,
            tokenCount: true,
            createdAt: true,
          },
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!document || document.kbId !== kbId) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        status: document.status,
      },
      chunks: document.chunks,
    });
  } catch (error) {
    console.error("GET chunks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document chunks" },
      { status: 500 }
    );
  }
}
