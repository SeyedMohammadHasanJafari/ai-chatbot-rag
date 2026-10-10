import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateKbSchema } from "@/lib/validations/kb";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const kb = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            fileSize: true,
            errorMessage: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { chunks: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    // Allow access if owner or if public
    const isOwner = user?.id === kb.userId;
    if (!isOwner && !kb.isPublic) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      knowledgeBase: kb,
      isOwner,
    });
  } catch (error) {
    console.error("GET /api/kb/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.knowledgeBase.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to modify this Knowledge Base" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = updateKbSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: parseResult.data,
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ knowledgeBase: updated });
  } catch (error) {
    console.error("PATCH /api/kb/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge base" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.knowledgeBase.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this Knowledge Base" },
        { status: 403 }
      );
    }

    await prisma.knowledgeBase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/kb/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge base" },
      { status: 500 }
    );
  }
}
