"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getPusherClient } from "@/lib/pusher-client";

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

interface BidActivity {
  id: string;
  liveSaleItemId: string;
  amount: number;
  bidderName: string;
  bidderId: string;
  timestamp: string;
}

interface WinnerInfo {
  itemId: string;
  productTitle: string;
  winnerId: string;
  winnerName?: string;
  amount: number;
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

function formatTimer(startTime: string, endTime: string | null, status: string) {
  const now = Date.now();

  if (status === "SCHEDULED") {
    const diff = new Date(startTime).getTime() - now;
    if (diff <= 0) return "Starting soon";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) return `Starts in ${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `Starts in ${minutes}m ${seconds}s`;
    return `Starts in ${seconds}s`;
  }

  if (status === "LIVE") {
    const elapsed = now - new Date(startTime).getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    if (hours > 0) return `Live for ${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `Live for ${minutes}m ${seconds}s`;
    return `Live for ${seconds}s`;
  }

  return "Ended";
}

export default function LiveSaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [liveSale, setLiveSale] = useState<LiveSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [bidding, setBidding] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [watcherCount, setWatcherCount] = useState(0);
  const [flashingItems, setFlashingItems] = useState<Set<string>>(new Set());
  const [bidActivity, setBidActivity] = useState<BidActivity[]>([]);
  const [winners, setWinners] = useState<WinnerInfo[]>([]);
  const [saleEnded, setSaleEnded] = useState(false);
  const [timer, setTimer] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const hasJoinedRef = useRef(false);

  const saleId = params.id as string;

  const fetchSale = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setLiveSale(data.liveSale);
        setWatcherCount(data.liveSale.watcherCount);
        if (data.liveSale.status === "ENDED") {
          setSaleEnded(true);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  // Initial fetch
  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  // Timer update + auto-end when countdown reaches zero
  useEffect(() => {
    if (!liveSale) return;
    const update = () => {
      setTimer(formatTimer(liveSale.startTime, liveSale.endTime, liveSale.status));
      // Auto-end: if sale is LIVE and endTime has passed, trigger end
      if (
        liveSale.status === "LIVE" &&
        liveSale.endTime &&
        new Date(liveSale.endTime) <= new Date() &&
        !saleEnded
      ) {
        fetch(`/api/live-sales/${saleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ENDED" }),
        }).catch(() => {});
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [liveSale, saleEnded, saleId]);

  // Watcher count: increment on mount, decrement on unmount
  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    fetch(`/api/live-sales/${saleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watcherDelta: 1 }),
    }).catch(() => {});

    return () => {
      // Use sendBeacon for reliable unmount tracking
      const body = JSON.stringify({ watcherDelta: -1 });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(`/api/live-sales/${saleId}`, blob);
      } else {
        fetch(`/api/live-sales/${saleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [saleId]);

  // Pusher subscription
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`live-sale-${saleId}`);

    channel.bind("new-bid", (data: BidActivity) => {
      // Update the item's current bid in state
      setLiveSale((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) => {
            if (item.id === data.liveSaleItemId) {
              const newBid: Bid = {
                id: crypto.randomUUID(),
                amount: data.amount,
                createdAt: data.timestamp,
                user: { id: data.bidderId, name: data.bidderName },
              };
              return {
                ...item,
                currentBid: data.amount,
                bids: [newBid, ...item.bids].slice(0, 10),
              };
            }
            return item;
          }),
        };
      });

      // Flash animation
      setFlashingItems((prev) => new Set(prev).add(data.liveSaleItemId));
      setTimeout(() => {
        setFlashingItems((prev) => {
          const next = new Set(prev);
          next.delete(data.liveSaleItemId);
          return next;
        });
      }, 1500);

      // Add to activity feed
      setBidActivity((prev) => [data, ...prev].slice(0, 50));

      toast.info(`New bid: $${data.amount.toFixed(2)} by ${data.bidderName}`);
    });

    channel.bind("item-sold", (data: { liveSaleItemId: string; buyerName: string; buyNowPrice: number }) => {
      setLiveSale((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) => {
            if (item.id === data.liveSaleItemId) {
              return {
                ...item,
                isSold: true,
                currentBid: data.buyNowPrice,
                winner: { id: "", name: data.buyerName },
              };
            }
            return item;
          }),
        };
      });
      toast.success(`Item sold to ${data.buyerName} for $${data.buyNowPrice.toFixed(2)}!`);
    });

    channel.bind("sale-ended", (data: { saleId: string; winners: WinnerInfo[] }) => {
      setSaleEnded(true);
      setWinners(data.winners || []);
      setLiveSale((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "ENDED" };
      });
      toast.info("This sale has ended!");
    });

    channel.bind("sale-started", () => {
      setLiveSale((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "LIVE" };
      });
      setSaleEnded(false);
      toast.success("The sale is now LIVE!");
    });

    channel.bind("watcher-update", (data: { watcherCount: number }) => {
      setWatcherCount(data.watcherCount);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`live-sale-${saleId}`);
    };
  }, [saleId]);

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
  const isEnded = liveSale.status === "ENDED" || saleEnded;

  // Image carousel items (for when no streamUrl)
  const carouselImages = liveSale.items
    .filter((i) => i.product.imageUrl)
    .map((i) => ({ url: i.product.imageUrl!, title: i.product.title }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Sale Ended Banner */}
      {isEnded && (
        <div className="mb-6 rounded-2xl border border-gray-500/20 bg-gray-500/5 p-6 text-center">
          <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-2xl font-heading font-bold mb-2">Sale Ended</h2>
          {winners.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-muted-foreground">Winners</p>
              {winners.map((w) => (
                <div
                  key={w.itemId}
                  className="flex items-center justify-center gap-3 text-sm"
                >
                  <span className="font-medium">{w.productTitle}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {w.winnerName || "Winner"} (${w.amount.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top bar */}
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
            {isLive && !isEnded && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </span>
            )}
            {isEnded && (
              <Badge className={STATUS_CONFIG.ENDED.color}>
                Ended
              </Badge>
            )}
            {!isLive && !isEnded && (
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
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {watcherCount} watching
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timer}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video / Image area (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main display area */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/10 via-purple-500/10 to-emerald-500/10 border border-border/50">
            {liveSale.streamUrl ? (
              <iframe
                src={liveSale.streamUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            ) : carouselImages.length > 0 ? (
              <>
                <Image
                  src={carouselImages[carouselIndex % carouselImages.length].url}
                  alt={carouselImages[carouselIndex % carouselImages.length].title}
                  fill
                  className="object-contain"
                />
                {carouselImages.length > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      onClick={() =>
                        setCarouselIndex((prev) =>
                          prev === 0 ? carouselImages.length - 1 : prev - 1
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      onClick={() =>
                        setCarouselIndex((prev) => (prev + 1) % carouselImages.length)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {carouselImages.map((_, i) => (
                        <button
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === carouselIndex % carouselImages.length
                              ? "bg-white"
                              : "bg-white/40"
                          }`}
                          onClick={() => setCarouselIndex(i)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Radio className="h-12 w-12 text-violet-400" />
                </div>
              </div>
            )}

            {/* Overlay badges */}
            {isLive && !isEnded && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </div>
            )}
          </div>

          {/* Description and type badge */}
          {liveSale.description && (
            <Card className="rounded-2xl">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{liveSale.description}</p>
                  </div>
                  <Badge className={`${typeConfig.color} border shrink-0`}>
                    {typeConfig.icon}
                    <span className="ml-1">{typeConfig.label}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bid activity feed */}
          <Card className="rounded-2xl">
            <CardContent className="pt-5">
              <h3 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                Bid Activity
              </h3>
              {bidActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No bid activity yet. Bids will appear here in real-time.
                </p>
              ) : (
                <ScrollArea className="h-32">
                  <div className="space-y-2 pr-3">
                    {bidActivity.map((activity, idx) => (
                      <div
                        key={`${activity.liveSaleItemId}-${activity.timestamp}-${idx}`}
                        className="flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-300"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-[7px] font-bold shrink-0">
                            {activity.bidderName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{activity.bidderName}</span>
                            {" bid "}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ${activity.amount.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Items grid for mobile */}
          <div className="lg:hidden space-y-3">
            {liveSale.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                saleId={saleId}
                isLive={isLive && !isEnded}
                userId={user?.id}
                bidAmount={bidAmounts[item.id] || ""}
                onBidAmountChange={(v) =>
                  setBidAmounts((prev) => ({ ...prev, [item.id]: v }))
                }
                onBid={() => handleBid(item.id)}
                onBuyNow={() => handleBuyNow(item.id)}
                isBidding={bidding === item.id}
                isBuying={buying === item.id}
                isFlashing={flashingItems.has(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar: Items list (1/3 width) */}
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
                  isLive={isLive && !isEnded}
                  userId={user?.id}
                  bidAmount={bidAmounts[item.id] || ""}
                  onBidAmountChange={(v) =>
                    setBidAmounts((prev) => ({ ...prev, [item.id]: v }))
                  }
                  onBid={() => handleBid(item.id)}
                  onBuyNow={() => handleBuyNow(item.id)}
                  isBidding={bidding === item.id}
                  isBuying={buying === item.id}
                  isFlashing={flashingItems.has(item.id)}
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
  bidAmount,
  onBidAmountChange,
  onBid,
  onBuyNow,
  isBidding,
  isBuying,
  isFlashing,
}: {
  item: LiveSaleItem;
  saleId: string;
  isLive: boolean;
  userId?: string;
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onBid: () => void;
  onBuyNow: () => void;
  isBidding: boolean;
  isBuying: boolean;
  isFlashing?: boolean;
}) {
  const currentBid = item.currentBid ?? item.startingBid;

  return (
    <Card
      className={`rounded-xl overflow-hidden transition-all duration-300 ${
        isFlashing
          ? "ring-2 ring-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20"
          : "hover:border-violet-500/20"
      } ${item.isSold ? "opacity-75" : ""}`}
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
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 transition-colors duration-300 ${
                  isFlashing
                    ? "text-emerald-500 scale-110"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                ${currentBid.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {item.bids.length} bid{item.bids.length !== 1 ? "s" : ""}
              </span>
              {item.buyNowPrice && !item.isSold && (
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                  Buy Now: ${item.buyNowPrice.toFixed(2)}
                </span>
              )}
            </div>
            {item.isSold && item.winner && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Won by {item.winner.name || "Anonymous"} - ${currentBid.toFixed(2)}
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
                  "Place Bid"
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

        {/* Last 3 bids */}
        {item.bids.length > 0 && (
          <div className="mt-3">
            <Separator className="mb-2" />
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
              Recent Bids
            </p>
            <div className="space-y-1">
              {item.bids.slice(0, 3).map((bid) => (
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
