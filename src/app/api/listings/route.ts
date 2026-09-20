import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const city = searchParams.get("city") || undefined;
    const listingType = searchParams.get("listingType") || undefined;
    const propertyType = searchParams.get("propertyType") || undefined;
    const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined;
    const bedrooms = searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms")!) : undefined;

    const where: Record<string, unknown> = {};
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (listingType) where.listingType = listingType;
    if (propertyType) where.propertyType = propertyType;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = minPrice;
      if (maxPrice) (where.price as Record<string, number>).lte = maxPrice;
    }
    if (bedrooms) where.bedrooms = { gte: bedrooms };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" } },
          amenities: true,
          agent: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "AGENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const property = await prisma.property.create({
      data: {
        ...body,
        agentId: session.user.id,
      },
    });
    return NextResponse.json(property, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
