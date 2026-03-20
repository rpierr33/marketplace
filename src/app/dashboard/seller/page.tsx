"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Zap,
  Tag,
  Sparkles,
  Gavel,
  Play,
  Square,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCT_CATEGORIES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
}

interface LiveSaleData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startTime: string;
  endTime: string | null;
  watcherCount: number;
  _count: {
    items: number;
  };
}

const LIVE_SALE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  LIVE: { label: "Live", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  ENDED: { label: "Ended", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
};

const LIVE_SALE_TYPE_LABELS: Record<string, string> = {
  CLEARANCE: "Clearance",
  FLASH_SALE: "Flash Sale",
  SPECIAL_OCCASION: "Special Occasion",
  AUCTION: "Auction",
};

export default function SellerDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [liveSales, setLiveSales] = useState<LiveSaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [liveDialogOpen, setLiveDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLive, setSavingLive] = useState(false);

  // Product form
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Live Sale form
  const [liveForm, setLiveForm] = useState({
    title: "",
    description: "",
    type: "FLASH_SALE",
    startTime: "",
    endTime: "",
    streamUrl: "",
    thumbnailUrl: "",
    selectedProducts: [] as { productId: string; startingBid: string; buyNowPrice: string }[],
  });

  const fetchData = async () => {
    try {
      const [dashRes, prodRes] = await Promise.all([
        fetch("/api/sellers/dashboard"),
        fetch("/api/products?sellerId=mine&limit=100"),
      ]);
      const dashData = await dashRes.json();
      const prodData = await prodRes.json();

      setDashboard(dashData);
      setProducts(prodData.products || []);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveSales = async () => {
    try {
      const res = await fetch("/api/live-sales?limit=100");
      const data = await res.json();
      // Filter to only show the seller's own sales (API returns all)
      setLiveSales(data.liveSales || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchData();
    fetchLiveSales();
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        stock: parseInt(form.stock),
        ...(form.imageUrl && { imageUrl: form.imageUrl }),
      };

      const url = editingId
        ? `/api/products/${editingId}`
        : "/api/products";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save product");
        return;
      }

      toast.success(editingId ? "Product updated" : "Product created");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLiveSale = async () => {
    if (liveForm.selectedProducts.length === 0) {
      toast.error("Add at least one product to the live sale");
      return;
    }
    if (!liveForm.title || !liveForm.startTime) {
      toast.error("Title and start time are required");
      return;
    }

    setSavingLive(true);
    try {
      const payload = {
        title: liveForm.title,
        description: liveForm.description || undefined,
        type: liveForm.type,
        startTime: new Date(liveForm.startTime).toISOString(),
        endTime: liveForm.endTime ? new Date(liveForm.endTime).toISOString() : undefined,
        streamUrl: liveForm.streamUrl || undefined,
        thumbnailUrl: liveForm.thumbnailUrl || undefined,
        items: liveForm.selectedProducts.map((p) => ({
          productId: p.productId,
          startingBid: parseFloat(p.startingBid) || 1,
          buyNowPrice: p.buyNowPrice ? parseFloat(p.buyNowPrice) : undefined,
        })),
      };

      const res = await fetch("/api/live-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create live sale");
        return;
      }

      toast.success("Live sale created!");
      setLiveDialogOpen(false);
      resetLiveForm();
      fetchLiveSales();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingLive(false);
    }
  };

  const handleLiveSaleAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/live-sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
        return;
      }
      toast.success(
        status === "LIVE"
          ? "You are now live!"
          : status === "ENDED"
          ? "Sale ended"
          : "Sale cancelled"
      );
      fetchLiveSales();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDeleteLiveSale = async (id: string) => {
    if (!confirm("Delete this live sale?")) return;
    try {
      const res = await fetch(`/api/live-sales/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Live sale deleted");
        fetchLiveSales();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
        fetchData();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchData();
    } catch {
      toast.error("Failed to update");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      imageUrl: "",
    });
    setEditingId(null);
  };

  const resetLiveForm = () => {
    setLiveForm({
      title: "",
      description: "",
      type: "FLASH_SALE",
      startTime: "",
      endTime: "",
      streamUrl: "",
      thumbnailUrl: "",
      selectedProducts: [],
    });
  };

  const startEdit = (product: Product) => {
    setForm({
      title: product.title,
      description: "",
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || "",
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
        toast.success("Image uploaded");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
  };

  const addProductToLiveSale = (productId: string) => {
    if (liveForm.selectedProducts.some((p) => p.productId === productId)) return;
    setLiveForm((f) => ({
      ...f,
      selectedProducts: [
        ...f.selectedProducts,
        { productId, startingBid: "", buyNowPrice: "" },
      ],
    }));
  };

  const removeProductFromLiveSale = (productId: string) => {
    setLiveForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.filter(
        (p) => p.productId !== productId
      ),
    }));
  };

  const updateLiveProduct = (
    productId: string,
    field: "startingBid" | "buyNowPrice",
    value: string
  ) => {
    setLiveForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p
      ),
    }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold">Seller Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  ${(dashboard?.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <ShoppingBag className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold">
                  {dashboard?.totalOrders || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">
                  {dashboard?.totalProducts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Products and Live Sales */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" className="cursor-pointer">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="live-sales" className="cursor-pointer">
            <Radio className="h-4 w-4 mr-2" />
            Live Sales
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger>
                <Button className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Product" : "New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? "Update your product details"
                      : "Add a new product to your store"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Product title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        placeholder="29.99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, stock: e.target.value }))
                        }
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v ?? "" }))
                      }
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="cursor-pointer"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {form.imageUrl && (
                      <p className="text-xs text-emerald-600 truncate">
                        Image uploaded
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Update" : "Create"} Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>Manage your product listings</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    No products yet. Add your first product!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>${product.price.toFixed(2)}</span>
                          <span>·</span>
                          <span>{product.stock} in stock</span>
                          <span>·</span>
                          <span>{product.category}</span>
                        </div>
                      </div>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {product.isActive ? "Active" : "Hidden"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          onClick={() =>
                            toggleActive(product.id, product.isActive)
                          }
                        >
                          {product.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          onClick={() => startEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Sales Tab */}
        <TabsContent value="live-sales">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Dialog
              open={liveDialogOpen}
              onOpenChange={(open) => {
                setLiveDialogOpen(open);
                if (!open) resetLiveForm();
              }}
            >
              <DialogTrigger>
                <Button className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/20">
                  <Radio className="mr-2 h-4 w-4" />
                  Create Live Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Live Sale</DialogTitle>
                  <DialogDescription>
                    Set up a live selling session for your products
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={liveForm.title}
                      onChange={(e) =>
                        setLiveForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Weekend Flash Sale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={liveForm.description}
                      onChange={(e) =>
                        setLiveForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe your live sale..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Type</Label>
                    <Select
                      value={liveForm.type}
                      onValueChange={(v) =>
                        setLiveForm((f) => ({ ...f, type: v ?? "FLASH_SALE" }))
                      }
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLASH_SALE" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-violet-500" />
                            Flash Sale
                          </div>
                        </SelectItem>
                        <SelectItem value="CLEARANCE" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-amber-500" />
                            Clearance
                          </div>
                        </SelectItem>
                        <SelectItem value="SPECIAL_OCCASION" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                            Special Occasion
                          </div>
                        </SelectItem>
                        <SelectItem value="AUCTION" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Gavel className="h-3.5 w-3.5 text-rose-500" />
                            Auction
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={liveForm.startTime}
                        onChange={(e) =>
                          setLiveForm((f) => ({
                            ...f,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={liveForm.endTime}
                        onChange={(e) =>
                          setLiveForm((f) => ({
                            ...f,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stream URL (optional)</Label>
                    <Input
                      value={liveForm.streamUrl}
                      onChange={(e) =>
                        setLiveForm((f) => ({
                          ...f,
                          streamUrl: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </div>

                  {/* Product selection */}
                  <div className="space-y-2">
                    <Label>Products</Label>
                    <Select
                      onValueChange={(v) => addProductToLiveSale(v as string)}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Add a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(
                            (p) =>
                              !liveForm.selectedProducts.some(
                                (sp) => sp.productId === p.id
                              )
                          )
                          .map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              className="cursor-pointer"
                            >
                              {p.title} (${p.price.toFixed(2)})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {liveForm.selectedProducts.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {liveForm.selectedProducts.map((sp) => {
                          const product = products.find(
                            (p) => p.id === sp.productId
                          );
                          return (
                            <div
                              key={sp.productId}
                              className="flex items-center gap-2 rounded-lg border p-2.5"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {product?.title || "Unknown"}
                                </p>
                                <div className="flex gap-2 mt-1.5">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Starting bid"
                                    value={sp.startingBid}
                                    onChange={(e) =>
                                      updateLiveProduct(
                                        sp.productId,
                                        "startingBid",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs"
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Buy now (opt)"
                                    value={sp.buyNowPrice}
                                    onChange={(e) =>
                                      updateLiveProduct(
                                        sp.productId,
                                        "buyNowPrice",
                                        e.target.value
                                      )
                                    }
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  removeProductFromLiveSale(sp.productId)
                                }
                              >
                                <XIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateLiveSale}
                    disabled={savingLive}
                    className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                  >
                    {savingLive && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Live Sale
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Live Sales</CardTitle>
              <CardDescription>
                Manage your live selling sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Radio className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    No live sales yet. Create your first live sale!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveSales.map((sale) => {
                    const statusConfig =
                      LIVE_SALE_STATUS_CONFIG[sale.status] ||
                      LIVE_SALE_STATUS_CONFIG.SCHEDULED;
                    return (
                      <div
                        key={sale.id}
                        className="flex items-center gap-4 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => router.push(`/live/${sale.id}`)}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-emerald-500/20 shrink-0">
                          <Radio className="h-5 w-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {sale.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {LIVE_SALE_TYPE_LABELS[sale.type] || sale.type}
                            </span>
                            <span>·</span>
                            <span>
                              {new Date(sale.startTime).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                            <span>·</span>
                            <span>{sale._count.items} items</span>
                          </div>
                        </div>
                        <Badge
                          className={`shrink-0 border ${statusConfig.color}`}
                        >
                          {sale.status === "LIVE" && (
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                            </span>
                          )}
                          {statusConfig.label}
                        </Badge>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sale.status === "SCHEDULED" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs font-semibold"
                                onClick={() =>
                                  handleLiveSaleAction(sale.id, "LIVE")
                                }
                              >
                                <Play className="h-3.5 w-3.5 mr-1" />
                                Go Live
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                                onClick={() => handleDeleteLiveSale(sale.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {sale.status === "LIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold"
                              onClick={() =>
                                handleLiveSaleAction(sale.id, "ENDED")
                              }
                            >
                              <Square className="h-3.5 w-3.5 mr-1" />
                              End Sale
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
