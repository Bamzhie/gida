import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          include: {
            images: { orderBy: { order: "asc" } },
            agent: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { propertyId } = await req.json();
    const favorite = await prisma.favorite.create({
      data: { userId: session.user.id, propertyId },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already favorited" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { propertyId } = await req.json();
    await prisma.favorite.deleteMany({
      where: { userId: session.user.id, propertyId },
    });
    return NextResponse.json({ message: "Removed" });
  } catch {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
