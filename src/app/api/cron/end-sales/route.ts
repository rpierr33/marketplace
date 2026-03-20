import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all LIVE sales that have passed their endTime
  const expiredSales = await prisma.liveSale.findMany({
    where: {
      status: "LIVE",
      endTime: { not: null, lte: new Date() },
    },
    include: {
      items: {
        include: {
          bids: { orderBy: { amount: "desc" }, take: 1 },
          product: true,
        },
      },
    },
  });

  for (const sale of expiredSales) {
    // End the sale
    await prisma.liveSale.update({
      where: { id: sale.id },
      data: { status: "ENDED" },
    });

    // Process winners for each item
    for (const item of sale.items) {
      if (item.isSold) continue;

      const highestBid = item.bids[0];
      if (highestBid) {
        // Mark item as sold to highest bidder
        await prisma.liveSaleItem.update({
          where: { id: item.id },
          data: { isSold: true, winnerId: highestBid.userId, currentBid: highestBid.amount },
        });

        // Create order for winner
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

    // Notify via Pusher
    await pusher.trigger(`live-sale-${sale.id}`, "sale-ended", {
      saleId: sale.id,
      winners: sale.items
        .filter((i) => i.bids[0])
        .map((i) => ({
          itemId: i.id,
          productTitle: i.product.title,
          winnerId: i.bids[0].userId,
          amount: i.bids[0].amount,
        })),
    });

    // Also notify the global channel
    await pusher.trigger("live-sales", "sale-ended", {
      saleId: sale.id,
      title: sale.title,
    });
  }

  return NextResponse.json({ processed: expiredSales.length });
}
