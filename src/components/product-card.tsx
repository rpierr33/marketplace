"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingCart,
  BadgeCheck,
  Heart,
  Check,
  Loader2,
  Package,
  Sparkles,
  ThumbsUp,
  Smile,
  Shield,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { PRODUCT_CONDITIONS } from "@/lib/constants";
import type { ProductWithSeller } from "@/types";

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-3 w-3" />,
  thumbsUp: <ThumbsUp className="h-3 w-3" />,
  smile: <Smile className="h-3 w-3" />,
  shield: <Shield className="h-3 w-3" />,
};

interface ProductCardProps {
  product: ProductWithSeller;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "loading" | "success">(
    "idle"
  );
  const [imgError, setImgError] = useState(false);

  const handleImageError = useCallback(() => {
    setImgError(true);
  }, []);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  const reviewCount = product._count?.reviews || product.reviews.length;

  const stockStatus =
    product.stock === 0
      ? "out"
      : product.stock <= 3
        ? "low"
        : "in";

  const conditionInfo = PRODUCT_CONDITIONS.find(
    (c) => c.value === (product.condition || "NEW")
  ) || PRODUCT_CONDITIONS[0];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartState !== "idle" || product.stock === 0) return;

    setCartState("loading");

    // Simulate slight delay for animation feel
    await new Promise((r) => setTimeout(r, 400));

    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      sellerId: product.seller.id,
      sellerName: product.seller.storeName,
    });

    setCartState("success");
    toast.success("Added to cart");

    setTimeout(() => setCartState("idle"), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
      <Card className="group relative cursor-pointer overflow-hidden rounded-2xl border-muted/50 bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/5 hover:border-violet-200/60 dark:hover:border-violet-800/40 h-full flex flex-col">
        {/* Hover glow effect */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/0 via-transparent to-emerald-500/0 opacity-0 group-hover:opacity-100 group-hover:from-violet-500/20 group-hover:to-emerald-500/20 transition-all duration-500 pointer-events-none" />

        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          {product.imageUrl && !imgError ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted text-muted-foreground/30">
              <Package className="h-16 w-16" />
            </div>
          )}

          {/* Image overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Wishlist button */}
          <motion.button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:bg-white dark:hover:bg-black/70 shadow-sm z-10"
            whileTap={{ scale: 0.85 }}
          >
            <Heart
              className={`h-4 w-4 transition-all duration-300 ${
                isWishlisted
                  ? "fill-rose-500 text-rose-500 scale-110"
                  : "text-foreground/70"
              }`}
            />
          </motion.button>

          {/* Luxury badge */}
          {product.isLuxury && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
                <Gem className="h-3 w-3" />
                Luxury
              </span>
            </div>
          )}

          {/* Stock badges */}
          {stockStatus === "low" && (
            <div className={`absolute ${product.isLuxury ? "top-10" : "top-3"} left-3 z-10`}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/90 text-white backdrop-blur-sm shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Only {product.stock} left
              </span>
            </div>
          )}
          {stockStatus === "out" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10">
              <span className="px-4 py-2 rounded-xl bg-red-500/90 text-white text-sm font-bold shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Image carousel dots placeholder */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>

        <CardContent className="relative p-4 space-y-2.5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold line-clamp-2 text-sm leading-snug text-foreground/90 group-hover:text-foreground transition-colors">
            {product.title}
          </h3>

          {/* Seller */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{product.seller.storeName}</span>
            {product.seller.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            )}
          </div>

          {/* Condition badge */}
          <div className="flex items-center">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${conditionInfo.color}`}
            >
              {CONDITION_ICONS[conditionInfo.icon]}
              {conditionInfo.label}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-[11px] text-muted-foreground">
                ({reviewCount})
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                stockStatus === "in"
                  ? "bg-emerald-500"
                  : stockStatus === "low"
                    ? "bg-orange-400"
                    : "bg-red-500"
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                stockStatus === "in"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : stockStatus === "low"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {stockStatus === "in"
                ? "In Stock"
                : stockStatus === "low"
                  ? `${product.stock} left`
                  : "Out of Stock"}
            </span>
          </div>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between pt-2 mt-auto">
            <p className="text-xl font-bold bg-gradient-to-r from-violet-600 to-violet-700 bg-clip-text text-transparent">
              ${product.price.toFixed(2)}
            </p>

            <motion.div whileTap={{ scale: 0.92 }}>
              <Button
                size="sm"
                className={`relative cursor-pointer h-9 rounded-xl text-xs font-semibold overflow-hidden transition-all duration-500 ${
                  cartState === "success"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                    : "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/40"
                }`}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || cartState === "loading"}
              >
                <AnimatePresence mode="wait">
                  {cartState === "idle" && (
                    <motion.span
                      key="idle"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add
                    </motion.span>
                  )}
                  {cartState === "loading" && (
                    <motion.span
                      key="loading"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  )}
                  {cartState === "success" && (
                    <motion.span
                      key="success"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.3,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Added
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
