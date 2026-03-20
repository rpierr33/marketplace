import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: user.id },
    });

    if (!seller) {
      return NextResponse.json({ seller: null, stripeComplete: false });
    }

    let stripeComplete = false;
    if (seller.stripeAccountId) {
      const account = await stripe.accounts.retrieve(seller.stripeAccountId);
      stripeComplete = account.charges_enabled && account.payouts_enabled;

      if (stripeComplete && !seller.isOnboarded) {
        await prisma.seller.update({
          where: { id: seller.id },
          data: { isOnboarded: true },
        });
      }
    }

    return NextResponse.json({ seller, stripeComplete });
  } catch {
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
