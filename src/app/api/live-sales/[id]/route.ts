import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateLiveSaleSchema = z.object({
  status: z.enum(["SCHEDULED", "LIVE", "ENDED", "CANCELLED"]),
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

// PATCH /api/live-sales/[id] - Update live sale status
export async function PATCH(
  request: NextRequest,
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

    // Only the seller who owns it or an admin can update
    if (
      user.role !== "ADMIN" &&
      (user.role !== "SELLER" || liveSale.seller.userId !== user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateLiveSaleSchema.parse(body);

    const updateData: Record<string, unknown> = { status: data.status };
    if (data.status === "ENDED" || data.status === "CANCELLED") {
      updateData.endTime = new Date();
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
