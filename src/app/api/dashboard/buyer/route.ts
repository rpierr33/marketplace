import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/dashboard/buyer - Combined dashboard view
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      recentOrders,
      wishlistItems,
      viewedItems,
      savedAddresses,
      savedPaymentMethods,
      orderStats,
    ] = await Promise.all([
      // Recent orders (last 5)
      prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, imageUrl: true, price: true },
              },
            },
          },
          payment: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Wishlist items (last 8)
      prisma.wishlistItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              imageUrl: true,
              category: true,
              stock: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),

      // Viewed items (last 8)
      prisma.viewedItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              imageUrl: true,
              category: true,
            },
          },
        },
        orderBy: { viewedAt: "desc" },
        take: 8,
      }),

      // Saved addresses
      prisma.savedAddress.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      }),

      // Saved payment methods
      prisma.savedPaymentMethod.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      }),

      // Stats
      prisma.order.aggregate({
        where: { userId: user.id },
        _count: { id: true },
        _sum: { total: true },
      }),
    ]);

    // Count wishlist separately for the stat
    const wishlistCount = await prisma.wishlistItem.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      recentOrders,
      wishlistItems,
      viewedItems,
      savedAddresses,
      savedPaymentMethods,
      stats: {
        totalOrders: orderStats._count.id,
        totalSpent: orderStats._sum.total || 0,
        wishlistCount,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
