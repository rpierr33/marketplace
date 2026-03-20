"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } =
    useCart();
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-heading font-semibold">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground">
          Start shopping to add items to your cart
        </p>
        <Button
          className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => router.push("/")}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  // Group items by seller
  const groupedBySeller = items.reduce(
    (groups, item) => {
      const key = item.sellerId;
      if (!groups[key]) {
        groups[key] = { sellerName: item.sellerName, items: [] };
      }
      groups[key].items.push(item);
      return groups;
    },
    {} as Record<string, { sellerName: string; items: typeof items }>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-heading font-bold mb-8">Shopping Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-6">
          {Object.entries(groupedBySeller).map(
            ([sellerId, { sellerName, items: sellerItems }]) => (
              <Card key={sellerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sold by {sellerName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sellerItems.map((item) => (
                    <div key={item.productId}>
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium text-sm line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-lg font-bold text-violet-600">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          )}

          <Button
            variant="ghost"
            className="text-destructive cursor-pointer"
            onClick={clearCart}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-emerald-600">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-violet-600">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
