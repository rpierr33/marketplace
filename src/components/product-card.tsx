"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import type { ProductWithSeller } from "@/types";

interface ProductCardProps {
  product: ProductWithSeller;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      sellerId: product.seller.id,
      sellerName: product.seller.storeName,
    });
    toast.success("Added to cart");
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-violet-100 dark:hover:shadow-violet-900/20 hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
          {product.stock <= 3 && product.stock > 0 && (
            <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
              Only {product.stock} left
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium line-clamp-2 text-sm leading-snug">
              {product.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-0.5">
              {product.seller.storeName}
            </span>
            {product.seller.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-violet-600" />
            )}
          </div>

          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product._count?.reviews || product.reviews.length})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-lg font-bold text-violet-600">
              ${product.price.toFixed(2)}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-8 text-xs hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300 dark:hover:bg-violet-900/30"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
