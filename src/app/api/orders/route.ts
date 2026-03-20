import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/orders - Get orders for current user (buyer or seller)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "buyer";

    if (view === "seller" && user.role === "SELLER" && user.seller) {
      // Seller view: orders containing their products
      const orderItems = await prisma.orderItem.findMany({
        where: { product: { sellerId: user.seller.id } },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              payment: { select: { status: true } },
            },
          },
          product: {
            select: { id: true, title: true, imageUrl: true, price: true },
          },
        },
        orderBy: { order: { createdAt: "desc" } },
      });

      return NextResponse.json({ orderItems });
    }

    // Buyer view
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true, imageUrl: true },
            },
          },
        },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
