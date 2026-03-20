import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/viewed - List user's recently viewed items (limit 20)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.viewedItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            imageUrl: true,
            category: true,
            stock: true,
            isActive: true,
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch viewed items" },
      { status: 500 }
    );
  }
}

// POST /api/viewed - Record a product view (upsert to update viewedAt)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const item = await prisma.viewedItem.upsert({
      where: {
        userId_productId: { userId: user.id, productId },
      },
      update: { viewedAt: new Date() },
      create: { userId: user.id, productId },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
