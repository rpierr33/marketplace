import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createLiveSaleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["CLEARANCE", "FLASH_SALE", "SPECIAL_OCCASION", "AUCTION"]).default("FLASH_SALE"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  streamUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      startingBid: z.number().positive(),
      buyNowPrice: z.number().positive().optional(),
    })
  ).min(1),
});

// GET /api/live-sales - List live sales with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (sellerId) {
      where.sellerId = sellerId;
    }

    const [liveSales, total] = await Promise.all([
      prisma.liveSale.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              storeName: true,
              isVerified: true,
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.liveSale.count({ where }),
    ]);

    return NextResponse.json({
      liveSales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch live sales" },
      { status: 500 }
    );
  }
}

// POST /api/live-sales - Create a live sale (seller only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SELLER" || !user.seller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createLiveSaleSchema.parse(body);

    // Verify all products belong to this seller
    const products = await prisma.product.findMany({
      where: {
        id: { in: data.items.map((i) => i.productId) },
        sellerId: user.seller.id,
      },
    });

    if (products.length !== data.items.length) {
      return NextResponse.json(
        { error: "One or more products not found or don't belong to you" },
        { status: 400 }
      );
    }

    const liveSale = await prisma.liveSale.create({
      data: {
        sellerId: user.seller.id,
        title: data.title,
        description: data.description,
        type: data.type,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        streamUrl: data.streamUrl,
        thumbnailUrl: data.thumbnailUrl,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            startingBid: item.startingBid,
            buyNowPrice: item.buyNowPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true, imageUrl: true, price: true },
            },
          },
        },
        seller: {
          select: { id: true, storeName: true },
        },
      },
    });

    return NextResponse.json({ liveSale }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create live sale" },
      { status: 500 }
    );
  }
}
