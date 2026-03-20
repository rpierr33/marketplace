import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      // Update payment status
      await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: "SUCCEEDED",
          stripePaymentId: session.payment_intent as string,
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      // Reduce stock
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Transfer funds to sellers (minus platform fee)
      const orderWithItems = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: { seller: true },
              },
            },
          },
        },
      });

      if (orderWithItems) {
        const sellerAmounts = new Map<string, number>();
        for (const item of orderWithItems.items) {
          const sellerId = item.product.seller.stripeAccountId;
          if (sellerId) {
            const current = sellerAmounts.get(sellerId) || 0;
            const sellerAmount =
              item.price * (1 - PLATFORM_FEE_PERCENT / 100);
            sellerAmounts.set(sellerId, current + sellerAmount);
          }
        }

        for (const [stripeAccountId, amount] of sellerAmounts) {
          try {
            await stripe.transfers.create({
              amount: Math.round(amount * 100),
              currency: "usd",
              destination: stripeAccountId,
              transfer_group: orderId,
            });
          } catch (err) {
            console.error(
              `Transfer to ${stripeAccountId} failed:`,
              err
            );
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
