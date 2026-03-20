import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";

export async function GET() {
  try {
    const { seller } = await requireSeller();

    const [products, orders, totalRevenue] = await Promise.all([
      prisma.product.count({ where: { sellerId: seller.id } }),
      prisma.orderItem.findMany({
        where: { product: { sellerId: seller.id } },
        include: {
          order: {
            include: {
              payment: { select: { status: true } },
              user: { select: { name: true, email: true } },
            },
          },
          product: {
            select: { id: true, title: true, imageUrl: true },
          },
        },
        orderBy: { order: { createdAt: "desc" } },
        take: 20,
      }),
      prisma.orderItem.aggregate({
        where: {
          product: { sellerId: seller.id },
          order: { payment: { status: "SUCCEEDED" } },
        },
        _sum: { price: true },
      }),
    ]);

    const revenue = totalRevenue._sum.price || 0;
    const platformFee = parseInt(process.env.PLATFORM_FEE_PERCENT || "10", 10);
    const sellerRevenue = revenue * (1 - platformFee / 100);

    return NextResponse.json({
      totalProducts: products,
      totalOrders: orders.length,
      totalRevenue: sellerRevenue,
      recentOrders: orders,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
