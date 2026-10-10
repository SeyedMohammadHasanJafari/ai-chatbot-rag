import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: kbId, docId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify KB ownership
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      select: { userId: true },
    });

    if (!kb || kb.userId !== user.id) {
      return NextResponse.json(
        { error: "Permission denied for this Knowledge Base" },
        { status: 403 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { kbId: true },
    });

    if (!document || document.kbId !== kbId) {
      return NextResponse.json(
        { error: "Document not found in this Knowledge Base" },
        { status: 404 }
      );
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
