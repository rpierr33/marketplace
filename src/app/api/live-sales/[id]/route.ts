import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { z } from "zod";

const updateLiveSaleSchema = z.object({
  status: z.enum(["SCHEDULED", "LIVE", "ENDED", "CANCELLED"]).optional(),
  watcherDelta: z.number().int().min(-1).max(1).optional(),
});

// GET /api/live-sales/[id] - Get single live sale with all details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const liveSale = await prisma.liveSale.findUnique({
      where: { id },
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                price: true,
              },
            },
            winner: {
              select: { id: true, name: true },
            },
            bids: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    if (!liveSale) {
      return NextResponse.json({ error: "Live sale not found" }, { status: 404 });
    }

    return NextResponse.json({ liveSale });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch live sale" },
      { status: 500 }
    );
  }
}

// PATCH /api/live-sales/[id] - Update live sale status or watcher count
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateLiveSaleSchema.parse(body);

    // Handle watcher count delta (no auth required for anonymous watching)
    if (data.watcherDelta !== undefined) {
      const updated = await prisma.liveSale.update({
        where: { id },
        data: {
          watcherCount: {
            increment: data.watcherDelta,
          },
        },
        select: { watcherCount: true },
      });

      // Ensure watcher count never goes below 0
      if (updated.watcherCount < 0) {
        await prisma.liveSale.update({
          where: { id },
          data: { watcherCount: 0 },
        });
        updated.watcherCount = 0;
      }

      await pusher.trigger(`live-sale-${id}`, "watcher-update", {
        watcherCount: updated.watcherCount,
      });

      return NextResponse.json({ watcherCount: updated.watcherCount });
    }

    // Status change requires authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const liveSale = await prisma.liveSale.findUnique({
      where: { id },
      include: {
        seller: true,
        items: {
          include: {
            bids: { orderBy: { amount: "desc" }, take: 1, include: { user: { select: { id: true, name: true } } } },
            product: { select: { id: true, title: true, imageUrl: true, price: true } },
          },
        },
      },
    });

    if (!liveSale) {
      return NextResponse.json({ error: "Live sale not found" }, { status: 404 });
    }

    // Only the seller who owns it or an admin can update
    if (
      user.role !== "ADMIN" &&
      (user.role !== "SELLER" || liveSale.seller.userId !== user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!data.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: data.status };
    if (data.status === "ENDED" || data.status === "CANCELLED") {
      updateData.endTime = new Date();
    }

    // If ending the sale, process winners for each unsold item with bids
    if (data.status === "ENDED") {
      for (const item of liveSale.items) {
        if (item.isSold) continue;

        const highestBid = item.bids[0];
        if (highestBid) {
          // Mark item as sold to highest bidder
          await prisma.liveSaleItem.update({
            where: { id: item.id },
            data: {
              isSold: true,
              winnerId: highestBid.userId,
              currentBid: highestBid.amount,
            },
          });

          // Create order for the winner
          const order = await prisma.order.create({
            data: {
              userId: highestBid.userId,
              total: highestBid.amount,
              status: "PENDING",
              items: {
                create: {
                  productId: item.productId,
                  quantity: 1,
                  price: highestBid.amount,
                },
              },
            },
          });

          await prisma.payment.create({
            data: {
              orderId: order.id,
              amount: highestBid.amount,
              platformFee: highestBid.amount * 0.1,
              status: "PENDING",
            },
          });
        }
      }
    }

    const updated = await prisma.liveSale.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          select: { id: true, storeName: true },
        },
        _count: { select: { items: true } },
      },
    });

    // Trigger Pusher events based on status change
    if (data.status === "LIVE") {
      await pusher.trigger(`live-sale-${id}`, "sale-started", {
        saleId: id,
        title: liveSale.title,
      });
      // Also notify the global channel so the browse page updates
      await pusher.trigger("live-sales", "sale-started", {
        saleId: id,
        title: liveSale.title,
      });
    }

    if (data.status === "ENDED") {
      const winners = liveSale.items
        .filter((i) => i.bids[0] && !i.isSold)
        .map((i) => ({
          itemId: i.id,
          productTitle: i.product.title,
          winnerId: i.bids[0].userId,
          winnerName: i.bids[0].user.name || "Anonymous",
          amount: i.bids[0].amount,
        }));

      await pusher.trigger(`live-sale-${id}`, "sale-ended", {
        saleId: id,
        winners,
      });
      // Also notify the global channel
      await pusher.trigger("live-sales", "sale-ended", {
        saleId: id,
        title: liveSale.title,
      });
    }

    return NextResponse.json({ liveSale: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update live sale" },
      { status: 500 }
    );
  }
}

// DELETE /api/live-sales/[id] - Delete live sale (seller only, only if SCHEDULED)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const liveSale = await prisma.liveSale.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!liveSale) {
      return NextResponse.json({ error: "Live sale not found" }, { status: 404 });
    }

    if (user.role !== "SELLER" || liveSale.seller.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (liveSale.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Can only delete scheduled live sales" },
        { status: 400 }
      );
    }

    await prisma.liveSale.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete live sale" },
      { status: 500 }
    );
  }
}
