"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Heart,
  Eye,
  MapPin,
  CreditCard,
  ShoppingBag,
  DollarSign,
  Plus,
  Trash2,
  Star,
  Loader2,
  Wallet,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

// --- Types ---

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: number;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  payment: { status: string } | null;
}

interface WishlistProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  category: string;
  stock: number;
}

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

interface ViewedProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  category: string;
}

interface ViewedItem {
  id: string;
  productId: string;
  viewedAt: string;
  product: ViewedProduct;
}

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string | null;
  isDefault: boolean;
}

interface DashboardData {
  recentOrders: Order[];
  wishlistItems: WishlistItem[];
  viewedItems: ViewedItem[];
  savedAddresses: SavedAddress[];
  savedPaymentMethods: SavedPaymentMethod[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    wishlistCount: number;
  };
}

// --- Status maps ---

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4 text-amber-500" />,
  CONFIRMED: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  SHIPPED: <Truck className="h-4 w-4 text-violet-500" />,
  DELIVERED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-destructive" />,
};

const statusColors: Record<string, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  DELIVERED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const paymentTypeIcons: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="h-5 w-5" />,
  paypal: <Wallet className="h-5 w-5" />,
  cashapp: <DollarSign className="h-5 w-5" />,
  zelle: <DollarSign className="h-5 w-5" />,
};

const paymentTypeLabels: Record<string, string> = {
  credit_card: "Credit Card",
  paypal: "PayPal",
  cashapp: "Cash App",
  zelle: "Zelle",
};

// --- Component ---

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingWishlist, setRemovingWishlist] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);

  // Address form
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "",
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    isDefault: false,
  });

  // Payment method form
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: "credit_card",
    label: "",
    details: "",
    isDefault: false,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/buyer");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const removeFromWishlist = async (productId: string) => {
    setRemovingWishlist(productId);
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              wishlistItems: prev.wishlistItems.filter(
                (i) => i.productId !== productId
              ),
              stats: {
                ...prev.stats,
                wishlistCount: prev.stats.wishlistCount - 1,
              },
            }
          : prev
      );
    } catch {
      // ignore
    } finally {
      setRemovingWishlist(null);
    }
  };

  const addAddress = async () => {
    setAddressSubmitting(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (res.ok) {
        setAddressDialogOpen(false);
        setAddressForm({
          label: "",
          fullName: "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "US",
          isDefault: false,
        });
        fetchDashboard();
      }
    } catch {
      // ignore
    } finally {
      setAddressSubmitting(false);
    }
  };

  const deleteAddress = async (id: string) => {
    setDeletingAddress(id);
    try {
      await fetch("/api/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              savedAddresses: prev.savedAddresses.filter((a) => a.id !== id),
            }
          : prev
      );
    } catch {
      // ignore
    } finally {
      setDeletingAddress(null);
    }
  };

  const addPaymentMethod = async () => {
    setPaymentSubmitting(true);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      if (res.ok) {
        setPaymentDialogOpen(false);
        setPaymentForm({
          type: "credit_card",
          label: "",
          details: "",
          isDefault: false,
        });
        fetchDashboard();
      }
    } catch {
      // ignore
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const deletePaymentMethod = async (id: string) => {
    setDeletingPayment(id);
    try {
      await fetch("/api/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              savedPaymentMethods: prev.savedPaymentMethods.filter(
                (m) => m.id !== id
              ),
            }
          : prev
      );
    } catch {
      // ignore
    } finally {
      setDeletingPayment(null);
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">Could not load dashboard</h3>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    recentOrders,
    wishlistItems,
    viewedItems,
    savedAddresses,
    savedPaymentMethods,
    stats,
  } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is a snapshot of your account activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-violet-200 dark:border-violet-800/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <ShoppingBag className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200 dark:border-pink-800/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/30">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wishlist Items</p>
                <p className="text-2xl font-bold">{stats.wishlistCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-1.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            <Heart className="h-4 w-4 mr-1.5" />
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="viewed">
            <Eye className="h-4 w-4 mr-1.5" />
            Recently Viewed
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="h-4 w-4 mr-1.5" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-1.5" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        {/* ----- ORDERS TAB ----- */}
        <TabsContent value="orders">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold">
                Recent Orders
              </h2>
            </div>

            {recentOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-base font-medium">No orders yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Your order history will appear here.
                    </p>
                    <Link href="/">
                      <Button className="mt-4" variant="outline" size="sm">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              recentOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-mono">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <Badge className={statusColors[order.status] || ""}>
                        <span className="flex items-center gap-1">
                          {statusIcons[order.status]}
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {item.product.imageUrl ? (
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/product/${item.product.id}`}
                              className="text-sm font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate block"
                            >
                              {item.product.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end border-t pt-3">
                      <p className="font-bold">
                        Total: ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ----- WISHLIST TAB ----- */}
        <TabsContent value="wishlist">
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">My Wishlist</h2>

            {wishlistItems.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Heart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-base font-medium">
                      Your wishlist is empty
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Save items you love and come back to them anytime.
                    </p>
                    <Link href="/">
                      <Button className="mt-4" variant="outline" size="sm">
                        Discover Products
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {wishlistItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <Link href={`/product/${item.product.id}`}>
                      <div className="relative aspect-square bg-muted">
                        {item.product.imageUrl ? (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-10 w-10 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-3">
                      <Link href={`/product/${item.product.id}`}>
                        <h3 className="text-sm font-medium truncate hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                          {item.product.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          ${item.product.price.toFixed(2)}
                        </p>
                        <Badge
                          className={
                            item.product.stock > 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {item.product.stock > 0
                            ? "In Stock"
                            : "Out of Stock"}
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => removeFromWishlist(item.productId)}
                        disabled={removingWishlist === item.productId}
                      >
                        {removingWishlist === item.productId ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ----- RECENTLY VIEWED TAB ----- */}
        <TabsContent value="viewed">
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">
              Recently Viewed
            </h2>

            {viewedItems.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Eye className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-base font-medium">
                      No recently viewed items
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Products you browse will show up here.
                    </p>
                    <Link href="/">
                      <Button className="mt-4" variant="outline" size="sm">
                        Start Browsing
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {viewedItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.product.id}`}
                      className="group"
                    >
                      <Card className="w-48 overflow-hidden hover:shadow-md transition-shadow shrink-0">
                        <div className="relative aspect-square bg-muted">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="text-sm font-medium truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {item.product.title}
                          </h3>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            ${item.product.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.viewedAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ----- ADDRESSES TAB ----- */}
        <TabsContent value="addresses">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold">
                Saved Addresses
              </h2>
              <Dialog
                open={addressDialogOpen}
                onOpenChange={setAddressDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Address
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                    <DialogDescription>
                      Enter the shipping address details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="addr-label">Label</Label>
                      <Input
                        id="addr-label"
                        placeholder="e.g. Home, Work, Mom's House"
                        value={addressForm.label}
                        onChange={(e) =>
                          setAddressForm((f) => ({
                            ...f,
                            label: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="addr-name">Full Name</Label>
                      <Input
                        id="addr-name"
                        placeholder="John Doe"
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm((f) => ({
                            ...f,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="addr-street">Street Address</Label>
                      <Input
                        id="addr-street"
                        placeholder="123 Main St"
                        value={addressForm.street}
                        onChange={(e) =>
                          setAddressForm((f) => ({
                            ...f,
                            street: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="addr-city">City</Label>
                        <Input
                          id="addr-city"
                          placeholder="New York"
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm((f) => ({
                              ...f,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="addr-state">State</Label>
                        <Input
                          id="addr-state"
                          placeholder="NY"
                          value={addressForm.state}
                          onChange={(e) =>
                            setAddressForm((f) => ({
                              ...f,
                              state: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="addr-zip">Zip Code</Label>
                        <Input
                          id="addr-zip"
                          placeholder="10001"
                          value={addressForm.zipCode}
                          onChange={(e) =>
                            setAddressForm((f) => ({
                              ...f,
                              zipCode: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="addr-country">Country</Label>
                        <Input
                          id="addr-country"
                          placeholder="US"
                          value={addressForm.country}
                          onChange={(e) =>
                            setAddressForm((f) => ({
                              ...f,
                              country: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) =>
                          setAddressForm((f) => ({
                            ...f,
                            isDefault: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      Set as default address
                    </label>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={addAddress}
                      disabled={
                        addressSubmitting ||
                        !addressForm.label ||
                        !addressForm.fullName ||
                        !addressForm.street ||
                        !addressForm.city ||
                        !addressForm.state ||
                        !addressForm.zipCode
                      }
                    >
                      {addressSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Save Address
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {savedAddresses.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Home className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-base font-medium">
                      No saved addresses
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add addresses for faster checkout.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedAddresses.map((addr) => (
                  <Card
                    key={addr.id}
                    className={
                      addr.isDefault
                        ? "border-violet-300 dark:border-violet-700"
                        : ""
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-500" />
                          <CardTitle className="text-sm">
                            {addr.label}
                          </CardTitle>
                        </div>
                        {addr.isDefault && (
                          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{addr.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.street}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.country}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-3"
                        onClick={() => deleteAddress(addr.id)}
                        disabled={deletingAddress === addr.id}
                      >
                        {deletingAddress === addr.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ----- PAYMENT METHODS TAB ----- */}
        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold">
                Payment Methods
              </h2>
              <Dialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Method
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                      Choose a payment type and provide the details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                      <Label>Type</Label>
                      <Select
                        value={paymentForm.type}
                        onValueChange={(val) =>
                          setPaymentForm((f) => ({
                            ...f,
                            type: val ?? f.type,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit_card">
                            Credit Card
                          </SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="cashapp">Cash App</SelectItem>
                          <SelectItem value="zelle">Zelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="pm-label">Label</Label>
                      <Input
                        id="pm-label"
                        placeholder={
                          paymentForm.type === "credit_card"
                            ? "Visa ending 4242"
                            : paymentForm.type === "paypal"
                              ? "PayPal - john@email.com"
                              : paymentForm.type === "cashapp"
                                ? "Cash App - $johndoe"
                                : "Zelle - john@email.com"
                        }
                        value={paymentForm.label}
                        onChange={(e) =>
                          setPaymentForm((f) => ({
                            ...f,
                            label: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="pm-details">
                        Details{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="pm-details"
                        placeholder={
                          paymentForm.type === "credit_card"
                            ? "**** **** **** 4242"
                            : "Email or username"
                        }
                        value={paymentForm.details}
                        onChange={(e) =>
                          setPaymentForm((f) => ({
                            ...f,
                            details: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentForm.isDefault}
                        onChange={(e) =>
                          setPaymentForm((f) => ({
                            ...f,
                            isDefault: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      Set as default payment method
                    </label>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={addPaymentMethod}
                      disabled={
                        paymentSubmitting ||
                        !paymentForm.type ||
                        !paymentForm.label
                      }
                    >
                      {paymentSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Save Method
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {savedPaymentMethods.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-base font-medium">
                      No saved payment methods
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add payment methods for faster checkout.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPaymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className={
                      method.isDefault
                        ? "border-emerald-300 dark:border-emerald-700"
                        : ""
                    }
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {paymentTypeIcons[method.type] || (
                              <CreditCard className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {method.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {paymentTypeLabels[method.type] || method.type}
                            </p>
                            {method.details && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {method.details}
                              </p>
                            )}
                          </div>
                        </div>
                        {method.isDefault && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={() => deletePaymentMethod(method.id)}
                        disabled={deletingPayment === method.id}
                      >
                        {deletingPayment === method.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
