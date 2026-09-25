import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const inquirySchema = z.object({
  propertyId: z.string(),
  message: z.string().min(10).max(1000),
  agentId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = inquirySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: result.data.propertyId,
        message: result.data.message,
        agentId: result.data.agentId,
        buyerId: session.user.id,
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        OR: [
          { buyerId: session.user.id },
          { agentId: session.user.id },
        ],
      },
      include: {
        property: { select: { title: true, address: true } },
        buyer: { select: { name: true, email: true } },
        agent: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inquiries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
