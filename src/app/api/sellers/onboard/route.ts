import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const onboardSchema = z.object({
  storeName: z.string().min(2).max(100),
  storeDescription: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storeName, storeDescription } = onboardSchema.parse(body);

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: "standard",
      email: user.email,
      metadata: { userId: user.id },
    });

    // Create or update seller record
    const seller = await prisma.seller.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        storeName,
        storeDescription,
        stripeAccountId: account.id,
      },
      update: {
        storeName,
        storeDescription,
        stripeAccountId: account.id,
      },
    });

    // Update user role to SELLER
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "SELLER" },
    });

    // Create account link for Stripe onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/seller/onboarding?refresh=true`,
      return_url: `${appUrl}/seller/onboarding/complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      seller,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Seller onboarding error:", err);
    return NextResponse.json(
      { error: "Failed to start onboarding" },
      { status: 500 }
    );
  }
}
