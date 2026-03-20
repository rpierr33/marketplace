"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Truck,
  Monitor,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Heart,
  Car,
  UtensilsCrossed,
  Palette,
  MoreHorizontal,
  PackageSearch,
  Clock,
  Flame,
  Tag,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product-card";
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from "@/lib/constants";
import type { ProductWithSeller } from "@/types";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Electronics: <Monitor className="h-4 w-4" />,
  Clothing: <Shirt className="h-4 w-4" />,
  "Home & Garden": <Home className="h-4 w-4" />,
  Sports: <Dumbbell className="h-4 w-4" />,
  Books: <BookOpen className="h-4 w-4" />,
  Toys: <Gamepad2 className="h-4 w-4" />,
  "Health & Beauty": <Heart className="h-4 w-4" />,
  Automotive: <Car className="h-4 w-4" />,
  "Food & Drink": <UtensilsCrossed className="h-4 w-4" />,
  "Art & Crafts": <Palette className="h-4 w-4" />,
  Other: <MoreHorizontal className="h-4 w-4" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [conditionFilter, setConditionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (conditionFilter) params.set("condition", conditionFilter);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortBy === "price" ? "asc" : "desc");
    params.set("page", page.toString());
    params.set("limit", "12");

    try {
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, conditionFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setSearch(s);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // Derived data for special sections
  const trendingProducts = useMemo(() => products.slice(0, 4), [products]);

  const dealOfTheDay = useMemo(() => {
    if (products.length === 0) return null;
    // Pick the product with most reviews, or highest price as fallback
    return [...products].sort((a, b) => {
      const aReviews = a._count?.reviews || a.reviews.length;
      const bReviews = b._count?.reviews || b.reviews.length;
      if (bReviews !== aReviews) return bReviews - aReviews;
      return b.price - a.price;
    })[0];
  }, [products]);

  const gridProducts = useMemo(() => {
    // Exclude trending (first 4) to avoid duplication, but only if we have enough
    if (products.length > 4) return products.slice(4);
    return products;
  }, [products]);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* ============ HERO BANNER ============ */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.08),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            {/* Trust signal */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Trusted marketplace with secure checkout
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Shop the Best Deals
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                All in One Place
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-lg text-slate-300 leading-relaxed">
              Discover thousands of products from independent sellers.
              Great prices, direct from the people who make them.
            </p>

            {/* Hero Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-2xl gap-0 mt-8"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, brands, and more..."
                  className="h-14 pl-12 pr-4 text-base rounded-l-xl rounded-r-none bg-white dark:bg-slate-800 border-0 shadow-2xl focus-visible:ring-2 focus-visible:ring-emerald-400 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-8 rounded-r-xl rounded-l-none cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-2xl transition-colors"
              >
                <Search className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Search</span>
              </Button>
            </form>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 pt-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                New arrivals daily
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-400" />
                Free shipping available
              </span>
              <span className="hidden md:flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Best price guarantee
              </span>
            </div>
          </div>
        </div>

        {/* Trust badges bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                {
                  icon: <Shield className="h-4 w-4 text-emerald-400" />,
                  label: "Secure Checkout",
                  sub: "256-bit SSL encryption",
                },
                {
                  icon: <Truck className="h-4 w-4 text-cyan-400" />,
                  label: "Free Shipping",
                  sub: "On eligible orders",
                },
                {
                  icon: <Tag className="h-4 w-4 text-amber-400" />,
                  label: "Best Prices",
                  sub: "Direct from sellers",
                },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center justify-center gap-2.5"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
                    {badge.icon}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-white/90">
                      {badge.label}
                    </p>
                    <p className="text-[11px] text-white/50">{badge.sub}</p>
                  </div>
                  <span className="sm:hidden text-xs font-medium text-white/80">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATEGORY BAR ============ */}
      <section className="sticky top-0 z-30 bg-white dark:bg-background border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                category === ""
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              All
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  category === cat
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {CATEGORY_ICONS[cat]}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRENDING NOW ============ */}
      {!loading && trendingProducts.length > 0 && !search && (
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Trending Now
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Most popular picks this week
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("all-products");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              See all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {trendingProducts.map((product) => (
              <motion.div key={`trending-${product.id}`} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ============ DEAL OF THE DAY ============ */}
      {!loading && dealOfTheDay && !search && products.length > 4 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30">
              <Zap className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Deal of the Day
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don&apos;t miss this top-rated item
              </p>
            </div>
          </div>

          <motion.div
            className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
              {/* Product image side */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <ProductCard product={dealOfTheDay} />
                </div>
              </div>

              {/* Info side */}
              <div className="flex flex-col justify-center space-y-4">
                <Badge className="w-fit bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Featured Deal
                </Badge>

                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  {dealOfTheDay.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {dealOfTheDay.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avgRating =
                        dealOfTheDay.reviews.length > 0
                          ? dealOfTheDay.reviews.reduce(
                              (sum, r) => sum + r.rating,
                              0
                            ) / dealOfTheDay.reviews.length
                          : 0;
                      return (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(avgRating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm text-slate-500">
                    ({dealOfTheDay._count?.reviews || dealOfTheDay.reviews.length}{" "}
                    reviews)
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    ${dealOfTheDay.price.toFixed(2)}
                  </span>
                  <span className="text-lg text-slate-400 line-through">
                    ${(dealOfTheDay.price * 1.25).toFixed(2)}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">
                    Save 20%
                  </Badge>
                </div>

                {/* Trust signals for the deal */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Truck className="h-3.5 w-3.5 text-emerald-500" />
                    Free shipping
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    Buyer protection
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    Limited time
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ============ ALL PRODUCTS GRID ============ */}
      <section id="all-products" className="mx-auto max-w-7xl px-4 py-8">
        {/* Section header with sort */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {search
                ? `Results for "${search}"`
                : category
                  ? category
                  : "Browse All Products"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Searching...
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {total}
                  </span>{" "}
                  products found
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={conditionFilter}
              onValueChange={(v) => {
                setConditionFilter(v === "ALL" ? "" : (v ?? ""));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40 cursor-pointer rounded-lg border-slate-200 dark:border-slate-700 text-sm">
                <SelectValue placeholder="Condition">
                  {(value: string) => {
                    if (!value || value === "ALL") return "All Conditions";
                    const found = PRODUCT_CONDITIONS.find((c) => c.value === value);
                    return found ? found.label : "All Conditions";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="ALL" className="cursor-pointer">
                  All Conditions
                </SelectItem>
                {PRODUCT_CONDITIONS.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value} className="cursor-pointer">
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v ?? "createdAt")}
            >
              <SelectTrigger className="w-44 cursor-pointer rounded-lg border-slate-200 dark:border-slate-700 text-sm">
                <SelectValue placeholder="Sort by">
                  {(value: string) => {
                    const labels: Record<string, string> = {
                      createdAt: "Newest First",
                      price: "Price: Low to High",
                      title: "Name: A to Z",
                    };
                    return labels[value] || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="createdAt" className="cursor-pointer">
                  Newest First
                </SelectItem>
                <SelectItem value="price" className="cursor-pointer">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="title" className="cursor-pointer">
                  Name: A to Z
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
                >
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-3 w-3 rounded-full" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-6 w-16 rounded" />
                      <Skeleton className="h-8 w-20 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-24 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <PackageSearch className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Try adjusting your search or filters to discover more products
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-lg cursor-pointer"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setConditionFilter("");
                  setPage(1);
                }}
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {(search || products.length <= 4
                ? products
                : gridProducts
              ).map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="cursor-pointer h-10 w-10 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      page === pageNum
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="cursor-pointer h-10 w-10 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>

      {/* ============ BOTTOM CTA / NEWSLETTER ============ */}
      <section className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Start Selling Today
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Join thousands of sellers and reach millions of customers.
              Easy setup, secure payments, and powerful tools to grow your business.
            </p>
            <div className="flex items-center justify-center gap-6 pt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" />
                Secure payments
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-blue-500" />
                Seller tools
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Analytics
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
