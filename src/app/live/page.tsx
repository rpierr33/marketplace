"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Radio,
  Users,
  Package,
  Clock,
  Zap,
  Tag,
  Sparkles,
  Gavel,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher-client";

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
  _count: {
    items: number;
  };
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CLEARANCE: {
    label: "Clearance",
    icon: <Tag className="h-3 w-3" />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  FLASH_SALE: {
    label: "Flash Sale",
    icon: <Zap className="h-3 w-3" />,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  SPECIAL_OCCASION: {
    label: "Special",
    icon: <Sparkles className="h-3 w-3" />,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  AUCTION: {
    label: "Auction",
    icon: <Gavel className="h-3 w-3" />,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

function getTimeRemaining(startTime: string) {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function LiveSaleCard({ sale, isLive }: { sale: LiveSale; isLive: boolean }) {
  const router = useRouter();
  const typeConfig = TYPE_CONFIG[sale.type] || TYPE_CONFIG.FLASH_SALE;
  const [countdown, setCountdown] = useState(getTimeRemaining(sale.startTime));

  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(() => {
      setCountdown(getTimeRemaining(sale.startTime));
    }, 60000);
    return () => clearInterval(interval);
  }, [sale.startTime, isLive]);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/live/${sale.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-violet-600/20 via-purple-500/20 to-emerald-500/20 overflow-hidden">
        {sale.thumbnailUrl ? (
          <Image
            src={sale.thumbnailUrl}
            alt={sale.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/30 to-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
              <Radio className="h-8 w-8 text-violet-400" />
            </div>
          </div>
        )}

        {/* Live badge / Countdown */}
        {isLive ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            LIVE
          </div>
        ) : (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            <Clock className="h-3 w-3" />
            {countdown}
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${typeConfig.color} backdrop-blur-sm`}>
          {typeConfig.icon}
          {typeConfig.label}
        </div>

        {/* Watcher count */}
        {isLive && sale.watcherCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
            <Users className="h-3 w-3" />
            {sale.watcherCount}
          </div>
        )}

        {/* Item count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
          <Package className="h-3 w-3" />
          {sale._count.items} item{sale._count.items !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {sale.title}
        </h3>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
            {sale.seller.user.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {sale.seller.storeName}
          </span>
          {sale.seller.isVerified && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Verified
            </Badge>
          )}
        </div>

        <Button
          size="sm"
          className={`mt-1 w-full rounded-xl text-xs font-semibold cursor-pointer ${
            isLive
              ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/20"
              : "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white shadow-md shadow-violet-500/20"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/live/${sale.id}`);
          }}
        >
          {isLive ? (
            <>
              Watch Now
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </>
          ) : (
            <>
              <Clock className="mr-1.5 h-3 w-3" />
              Set Reminder
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function LiveSalesPage() {
  const [liveSales, setLiveSales] = useState<LiveSale[]>([]);
  const [scheduledSales, setScheduledSales] = useState<LiveSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [liveRes, scheduledRes] = await Promise.all([
        fetch("/api/live-sales?status=LIVE&limit=50"),
        fetch("/api/live-sales?status=SCHEDULED&limit=50"),
      ]);
      const liveData = await liveRes.json();
      const scheduledData = await scheduledRes.json();
      setLiveSales(liveData.liveSales || []);
      setScheduledSales(scheduledData.liveSales || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to global live-sales channel for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("live-sales");

    channel.bind("sale-started", (data: { saleId: string; title: string }) => {
      toast.info(`"${data.title}" is now LIVE!`);
      // Re-fetch to move the sale from scheduled to live
      fetchData();
    });

    channel.bind("sale-ended", (data: { saleId: string; title: string }) => {
      toast.info(`"${data.title}" has ended.`);
      // Remove from live sales list
      setLiveSales((prev) => prev.filter((s) => s.id !== data.saleId));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("live-sales");
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasLive = liveSales.length > 0;
  const hasScheduled = scheduledSales.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-500/20">
          <Radio className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold">Live Sales</h1>
          <p className="text-sm text-muted-foreground">
            Watch sellers go live, bid on items, and grab deals in real time
          </p>
        </div>
      </div>

      {/* Live Now Section */}
      {hasLive && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <h2 className="text-xl font-heading font-bold">Live Now</h2>
            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
              {liveSales.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {liveSales.map((sale) => (
              <LiveSaleCard key={sale.id} sale={sale} isLive />
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon Section */}
      {hasScheduled && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-5 w-5 text-violet-500" />
            <h2 className="text-xl font-heading font-bold">Coming Soon</h2>
            <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
              {scheduledSales.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {scheduledSales.map((sale) => (
              <LiveSaleCard key={sale.id} sale={sale} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasLive && !hasScheduled && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Radio className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-heading font-semibold mb-2">
            No Live Sales Right Now
          </h3>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            There are no active or upcoming live sales at the moment. Check back
            later or become a seller to host your own live sale!
          </p>
        </div>
      )}
    </div>
  );
}
