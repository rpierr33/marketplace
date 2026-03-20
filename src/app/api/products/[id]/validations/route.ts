import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createValidationSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(500).optional(),
});

// GET /api/products/[id]/validations - list validation images
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const validations = await prisma.productValidation.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ validations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch validations" },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/validations - add validation image (seller only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== "SELLER" || !user.seller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createValidationSchema.parse(body);

    const validation = await prisma.productValidation.create({
      data: {
        productId: id,
        imageUrl: data.imageUrl,
        caption: data.caption,
      },
    });

    return NextResponse.json({ validation }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add validation" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/validations - delete a validation image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== "SELLER" || !user.seller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validationId = searchParams.get("validationId");
    if (!validationId) {
      return NextResponse.json(
        { error: "validationId is required" },
        { status: 400 }
      );
    }

    const validation = await prisma.productValidation.findUnique({
      where: { id: validationId },
      include: { product: { include: { seller: true } } },
    });

    if (!validation) {
      return NextResponse.json(
        { error: "Validation not found" },
        { status: 404 }
      );
    }

    if (validation.product.seller.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (validation.productId !== id) {
      return NextResponse.json({ error: "Mismatch" }, { status: 400 });
    }

    await prisma.productValidation.delete({ where: { id: validationId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete validation" },
      { status: 500 }
    );
  }
}
