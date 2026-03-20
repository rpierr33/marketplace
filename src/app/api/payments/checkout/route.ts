import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = checkoutSchema.parse(body);

    // Fetch products with seller info
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { seller: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "Some products are no longer available" },
        { status: 400 }
      );
    }

    // Check stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product?.title || "product"}` },
          { status: 400 }
        );
      }
    }

    // Group by seller for Stripe Connect payment splitting
    const sellerGroups = new Map<
      string,
      { stripeAccountId: string; lineItems: { productId: string; title: string; price: number; quantity: number }[] }
    >();

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const sellerId = product.sellerId;

      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, {
          stripeAccountId: product.seller.stripeAccountId || "",
          lineItems: [],
        });
      }
      sellerGroups.get(sellerId)!.lineItems.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price * item.quantity,
            };
          }),
        },
      },
    });

    // Build Stripe line items
    const lineItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.title,
            ...(product.imageUrl && { images: [product.imageUrl] }),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const platformFee = Math.round(total * 100 * (PLATFORM_FEE_PERCENT / 100));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // For simplicity with multiple sellers, use a single checkout session
    // The platform collects the full amount, then handles payouts via Stripe transfers
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/cart`,
      customer_email: user.email,
      metadata: {
        orderId: order.id,
        userId: user.id,
      },
    });

    // Store payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        stripeSessionId: session.id,
        amount: total,
        platformFee: platformFee / 100,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
