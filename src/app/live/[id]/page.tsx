"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Radio,
  Users,
  Clock,
  Zap,
  Tag,
  Sparkles,
  Gavel,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface LiveSaleItem {
  id: string;
  startingBid: number;
  currentBid: number | null;
  buyNowPrice: number | null;
  isSold: boolean;
  winnerId: string | null;
  product: {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    price: number;
  };
  winner: {
    id: string;
    name: string | null;
  } | null;
  bids: Bid[];
}

interface LiveSale {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  startTime: string;
  endTime: string | null;
  watcherCount: number;
  seller: {
    id: string;
    storeName: string;
    isVerified: boolean;
    user: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  };
  items: LiveSaleItem[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CLEARANCE: {
    label: "Clearance",
    icon: <Tag className="h-3.5 w-3.5" />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  FLASH_SALE: {
    label: "Flash Sale",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  SPECIAL_OCCASION: {
    label: "Special Occasion",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  AUCTION: {
    label: "Auction",
    icon: <Gavel className="h-3.5 w-3.5" />,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  LIVE: { label: "Live", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  ENDED: { label: "Ended", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  CANCELLED: { label: "Cancelled", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
};

export default function LiveSaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [liveSale, setLiveSale] = useState<LiveSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [bidding, setBidding] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const saleId = params.id as string;

  const fetchSale = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setLiveSale(data.liveSale);
        if (!selectedItem && data.liveSale.items.length > 0) {
          setSelectedItem(data.liveSale.items[0].id);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [saleId, selectedItem]);

  useEffect(() => {
    fetchSale();
    // Poll for updates if sale is live
    const interval = setInterval(fetchSale, 5000);
    return () => clearInterval(interval);
  }, [fetchSale]);

  const handleBid = async (itemId: string) => {
    const amount = parseFloat(bidAmounts[itemId] || "0");
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bid amount");
      return;
    }

    setBidding(itemId);
    try {
      const res = await fetch(`/api/live-sales/${saleId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveSaleItemId: itemId, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to place bid");
        return;
      }
      toast.success(`Bid of $${amount.toFixed(2)} placed!`);
      setBidAmounts((prev) => ({ ...prev, [itemId]: "" }));
      fetchSale();
    } catch {
      toast.error("Failed to place bid");
    } finally {
      setBidding(null);
    }
  };

  const handleBuyNow = async (itemId: string) => {
    setBuying(itemId);
    try {
      const res = await fetch(`/api/live-sales/${saleId}/buy-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveSaleItemId: itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to buy");
        return;
      }
      toast.success("Item purchased!");
      fetchSale();
    } catch {
      toast.error("Failed to buy");
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="aspect-video rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!liveSale) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Radio className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">
          Live Sale Not Found
        </h2>
        <Button
          variant="outline"
          className="cursor-pointer rounded-xl"
          onClick={() => router.push("/live")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Live Sales
        </Button>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[liveSale.type] || TYPE_CONFIG.FLASH_SALE;
  const statusConfig = STATUS_CONFIG[liveSale.status] || STATUS_CONFIG.SCHEDULED;
  const isLive = liveSale.status === "LIVE";
  const activeItem = liveSale.items.find((i) => i.id === selectedItem) || liveSale.items[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl cursor-pointer hover:bg-muted/60"
          onClick={() => router.push("/live")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-heading font-bold truncate">
              {liveSale.title}
            </h1>
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </span>
            )}
            {!isLive && (
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            )}
            <Badge className={`${typeConfig.color} border`}>
              {typeConfig.icon}
              <span className="ml-1">{typeConfig.label}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-[7px] font-bold">
                {liveSale.seller.user.name?.charAt(0).toUpperCase() || "S"}
              </div>
              {liveSale.seller.storeName}
            </div>
            {isLive && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {liveSale.watcherCount} watching
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(liveSale.startTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video / Image area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main display area */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/10 via-purple-500/10 to-emerald-500/10 border border-border/50">
            {liveSale.streamUrl ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Radio className="h-12 w-12 text-violet-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Live Stream</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Stream embed placeholder
                  </p>
                </div>
              </div>
            ) : activeItem?.product.imageUrl ? (
              <Image
                src={activeItem.product.imageUrl}
                alt={activeItem.product.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Radio className="h-12 w-12 text-violet-400" />
                </div>
              </div>
            )}

            {/* Overlay badges */}
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </div>
            )}
          </div>

          {/* Description */}
          {liveSale.description && (
            <Card className="rounded-2xl">
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{liveSale.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Items grid for mobile */}
          <div className="lg:hidden space-y-3">
            {liveSale.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                saleId={saleId}
                isLive={isLive}
                userId={user?.id}
                bidAmount={bidAmounts[item.id] || ""}
                onBidAmountChange={(v) =>
                  setBidAmounts((prev) => ({ ...prev, [item.id]: v }))
                }
                onBid={() => handleBid(item.id)}
                onBuyNow={() => handleBuyNow(item.id)}
                isBidding={bidding === item.id}
                isBuying={buying === item.id}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar: Items list */}
        <div className="hidden lg:block space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-heading font-bold">
              Items ({liveSale.items.length})
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-3 pr-3">
              {liveSale.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  saleId={saleId}
                  isLive={isLive}
                  userId={user?.id}
                  isSelected={selectedItem === item.id}
                  onSelect={() => setSelectedItem(item.id)}
                  bidAmount={bidAmounts[item.id] || ""}
                  onBidAmountChange={(v) =>
                    setBidAmounts((prev) => ({ ...prev, [item.id]: v }))
                  }
                  onBid={() => handleBid(item.id)}
                  onBuyNow={() => handleBuyNow(item.id)}
                  isBidding={bidding === item.id}
                  isBuying={buying === item.id}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  isLive,
  userId,
  isSelected,
  onSelect,
  bidAmount,
  onBidAmountChange,
  onBid,
  onBuyNow,
  isBidding,
  isBuying,
}: {
  item: LiveSaleItem;
  saleId: string;
  isLive: boolean;
  userId?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onBid: () => void;
  onBuyNow: () => void;
  isBidding: boolean;
  isBuying: boolean;
}) {
  const currentBid = item.currentBid ?? item.startingBid;

  return (
    <Card
      className={`rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? "ring-2 ring-violet-500/50 border-violet-500/30"
          : "hover:border-violet-500/20"
      } ${item.isSold ? "opacity-75" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Product image */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
            {item.product.imageUrl ? (
              <Image
                src={item.product.imageUrl}
                alt={item.product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
            {item.isSold && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  SOLD
                </Badge>
              </div>
            )}
          </div>

          {/* Item info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{item.product.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Start: ${item.startingBid.toFixed(2)}
              </span>
              {item.currentBid && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  ${item.currentBid.toFixed(2)}
                </span>
              )}
            </div>
            {item.buyNowPrice && !item.isSold && (
              <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                Buy Now: ${item.buyNowPrice.toFixed(2)}
              </span>
            )}
            {item.isSold && item.winner && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Won by {item.winner.name || "Anonymous"}
              </span>
            )}
          </div>
        </div>

        {/* Bid controls - only if live and not sold */}
        {isLive && !item.isSold && userId && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min={currentBid + 0.01}
                placeholder={`Min $${(currentBid + 0.01).toFixed(2)}`}
                value={bidAmount}
                onChange={(e) => onBidAmountChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-xs rounded-lg"
              />
              <Button
                size="sm"
                className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                disabled={isBidding}
                onClick={(e) => {
                  e.stopPropagation();
                  onBid();
                }}
              >
                {isBidding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Bid"
                )}
              </Button>
            </div>
            {item.buyNowPrice && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 rounded-lg text-xs font-semibold cursor-pointer border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                disabled={isBuying}
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyNow();
                }}
              >
                {isBuying ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : (
                  <ShoppingBag className="h-3 w-3 mr-1.5" />
                )}
                Buy Now ${item.buyNowPrice.toFixed(2)}
              </Button>
            )}
          </div>
        )}

        {/* Recent bids */}
        {item.bids.length > 0 && (
          <div className="mt-3">
            <Separator className="mb-2" />
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
              Recent Bids
            </p>
            <div className="space-y-1">
              {item.bids.slice(0, 5).map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-muted-foreground truncate">
                    {bid.user.name || "Anonymous"}
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${bid.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
