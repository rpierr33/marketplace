"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Star,
  ShoppingCart,
  BadgeCheck,
  Minus,
  Plus,
  Loader2,
  Package,
  Sparkles,
  ThumbsUp,
  Smile,
  Shield,
  Gem,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { PRODUCT_CONDITIONS } from "@/lib/constants";

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-4 w-4" />,
  thumbsUp: <ThumbsUp className="h-4 w-4" />,
  smile: <Smile className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
};

interface ValidationImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
}

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  stock: number;
  condition: string;
  isActive: boolean;
  isLuxury: boolean;
  createdAt: string;
  seller: {
    id: string;
    storeName: string;
    isVerified: boolean;
  };
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: string; name: string | null; avatarUrl: string | null };
  }[];
  validations: ValidationImage[];
  _count: { reviews: number };
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => setProduct(data.product))
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  const conditionInfo = PRODUCT_CONDITIONS.find(
    (c) => c.value === (product.condition || "NEW")
  ) || PRODUCT_CONDITIONS[0];

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      sellerId: product.seller.id,
      sellerName: product.seller.storeName,
    });
    toast.success(`${quantity} item(s) added to cart`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {product.category}
              </Badge>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${conditionInfo.color}`}
              >
                {CONDITION_ICONS[conditionInfo.icon]}
                {conditionInfo.label}
              </span>
              {product.isLuxury && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Gem className="h-3.5 w-3.5" />
                  Luxury Item
                </span>
              )}
            </div>
            <h1 className="text-3xl font-heading font-bold">{product.title}</h1>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sold by {product.seller.storeName}</span>
              {product.seller.isVerified && (
                <BadgeCheck className="h-4 w-4 text-violet-600" />
              )}
            </div>

            {avgRating > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {avgRating.toFixed(1)} ({product._count.reviews} reviews)
                </span>
              </div>
            )}
          </div>

          <p className="text-4xl font-bold text-violet-600">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              {product.stock > 0 ? (
                <span className="text-emerald-600 font-medium">
                  {product.stock} in stock
                </span>
              ) : (
                <span className="text-destructive font-medium">
                  Out of stock
                </span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 cursor-pointer"
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  size="lg"
                  className="flex-1 cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seller Verification Section for Luxury Items */}
      {product.isLuxury && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-heading font-bold">
              Seller Verification
            </h2>
          </div>

          {product.validations && product.validations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {product.validations.map((v) => (
                <div
                  key={v.id}
                  className="relative group rounded-xl overflow-hidden border cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLightboxImage(v.imageUrl)}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={v.imageUrl}
                      alt={v.caption || "Validation photo"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {v.caption && (
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {v.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Validation pending</p>
              <p className="text-xs mt-1">
                The seller has not yet uploaded verification evidence for this item
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 cursor-pointer z-10"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="relative max-w-3xl max-h-[85vh] w-full mx-4">
            <Image
              src={lightboxImage}
              alt="Validation photo enlarged"
              width={1200}
              height={1200}
              className="object-contain w-full h-auto max-h-[85vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-heading font-bold mb-6">
            Customer Reviews
          </h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {review.user.name || "Anonymous"}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
