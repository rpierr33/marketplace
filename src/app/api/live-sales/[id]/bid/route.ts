import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { z } from "zod";

const placeBidSchema = z.object({
  liveSaleItemId: z.string().uuid(),
  amount: z.number().positive(),
});

// POST /api/live-sales/[id]/bid - Place a bid
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
    const data = placeBidSchema.parse(body);

    // Get the live sale and verify status
    const liveSale = await prisma.liveSale.findUnique({
      where: { id },
      include: {
        seller: true,
        items: {
          where: { id: data.liveSaleItemId },
          include: { product: true },
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

    // User can't bid on their own items
    if (liveSale.seller.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot bid on your own items" },
        { status: 400 }
      );
    }

    // Amount must be higher than current bid or starting bid
    const minimumBid = item.currentBid ?? item.startingBid;
    if (data.amount <= minimumBid) {
      return NextResponse.json(
        { error: `Bid must be higher than $${minimumBid.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create bid and update current bid in a transaction
    const [bid] = await prisma.$transaction([
      prisma.bid.create({
        data: {
          liveSaleItemId: data.liveSaleItemId,
          userId: user.id,
          amount: data.amount,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.liveSaleItem.update({
        where: { id: data.liveSaleItemId },
        data: { currentBid: data.amount },
      }),
    ]);

    // Trigger Pusher events for real-time updates
    const bidEventData = {
      liveSaleItemId: data.liveSaleItemId,
      amount: data.amount,
      bidderName: user.name || "Anonymous",
      bidderId: user.id,
      timestamp: new Date().toISOString(),
    };

    await Promise.all([
      pusher.trigger(`live-sale-${id}`, "new-bid", bidEventData),
      pusher.trigger(`live-sale-${id}`, "outbid", bidEventData),
    ]);

    return NextResponse.json({ bid }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to place bid" },
      { status: 500 }
    );
  }
}
