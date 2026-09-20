import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        amenities: true,
        agent: {
          select: { id: true, name: true, image: true, phone: true },
          include: { agentProfile: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment views
    await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.property.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
