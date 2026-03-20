import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const buyNowSchema = z.object({
  liveSaleItemId: z.string().uuid(),
});

// POST /api/live-sales/[id]/buy-now - Buy now at the buyNowPrice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = buyNowSchema.parse(body);

    // Get the live sale and verify status
    const liveSale = await prisma.liveSale.findUnique({
      where: { id },
      include: {
        seller: true,
        items: {
          where: { id: data.liveSaleItemId },
        },
      },
    });

    if (!liveSale) {
      return NextResponse.json({ error: "Live sale not found" }, { status: 404 });
    }

    if (liveSale.status !== "LIVE") {
      return NextResponse.json(
        { error: "This sale is not currently live" },
        { status: 400 }
      );
    }

    const item = liveSale.items[0];
    if (!item) {
      return NextResponse.json(
        { error: "Item not found in this live sale" },
        { status: 404 }
      );
    }

    if (item.isSold) {
      return NextResponse.json(
        { error: "This item has already been sold" },
        { status: 400 }
      );
    }

    if (!item.buyNowPrice) {
      return NextResponse.json(
        { error: "This item does not have a Buy Now price" },
        { status: 400 }
      );
    }

    // User can't buy their own items
    if (liveSale.seller.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot buy your own items" },
        { status: 400 }
      );
    }

    // Mark item as sold with winner
    const updatedItem = await prisma.liveSaleItem.update({
      where: { id: data.liveSaleItemId },
      data: {
        isSold: true,
        winnerId: user.id,
        currentBid: item.buyNowPrice,
      },
      include: {
        product: {
          select: { id: true, title: true, imageUrl: true, price: true },
        },
        winner: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process buy now" },
      { status: 500 }
    );
  }
}
