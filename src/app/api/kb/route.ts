import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createKbSchema } from "@/lib/validations/kb";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: { userId: user.id },
      include: {
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            fileSize: true,
            createdAt: true,
            _count: {
              select: { chunks: true },
            },
          },
        },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ knowledgeBases });
  } catch (error) {
    console.error("GET /api/kb error:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge bases" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = createKbSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, prompt, colorCode, isPublic } = parseResult.data;

    const newKb = await prisma.knowledgeBase.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        prompt:
          prompt ||
          "You are an assistant. Answer the user's question ONLY using the provided context. If the answer is not in the context, say 'I do not know based on the provided documents.' Cite your sources using the [Doc X] format.",
        colorCode: colorCode || "#06b6d4",
        isPublic: isPublic !== undefined ? isPublic : true,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ knowledgeBase: newKb }, { status: 201 });
  } catch (error) {
    console.error("POST /api/kb error:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge base" },
      { status: 500 }
    );
  }
}
