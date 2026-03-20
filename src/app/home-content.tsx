"use client";

import { useEffect, useState, useCallback } from "react";
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
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import type { ProductWithSeller } from "@/types";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Electronics: <Monitor className="h-3.5 w-3.5" />,
  Clothing: <Shirt className="h-3.5 w-3.5" />,
  "Home & Garden": <Home className="h-3.5 w-3.5" />,
  Sports: <Dumbbell className="h-3.5 w-3.5" />,
  Books: <BookOpen className="h-3.5 w-3.5" />,
  Toys: <Gamepad2 className="h-3.5 w-3.5" />,
  "Health & Beauty": <Heart className="h-3.5 w-3.5" />,
  Automotive: <Car className="h-3.5 w-3.5" />,
  "Food & Drink": <UtensilsCrossed className="h-3.5 w-3.5" />,
  "Art & Crafts": <Palette className="h-3.5 w-3.5" />,
  Other: <MoreHorizontal className="h-3.5 w-3.5" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const HEADLINE_WORDS = ["Amazing", "Unique", "Curated", "Premium"];

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % HEADLINE_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
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
  }, [search, category, sortBy, page]);

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-emerald-50 dark:from-violet-950/40 dark:via-background dark:to-emerald-950/30">
        {/* Animated gradient mesh blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-400/20 dark:bg-violet-600/10 blur-3xl animate-pulse" />
          <div
            className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-emerald-400/20 dark:bg-emerald-600/10 blur-3xl animate-pulse"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          />
          <div
            className="absolute -bottom-20 left-1/3 w-[350px] h-[350px] rounded-full bg-pink-400/15 dark:bg-pink-600/10 blur-3xl animate-pulse"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-[250px] h-[250px] rounded-full bg-violet-300/10 dark:bg-violet-500/10 blur-2xl animate-pulse"
            style={{ animationDelay: "3s", animationDuration: "6s" }}
          />
        </div>

        {/* Floating dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`dot-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/25 dark:bg-emerald-400/15"
              style={{
                right: `${10 + i * 20}%`,
                bottom: `${15 + (i % 2) * 30}%`,
              }}
              animate={{
                y: [0, 15, 0],
                x: [0, -8, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 5 + i * 0.7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.2,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="px-5 py-2 text-sm bg-violet-100/80 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 backdrop-blur-sm border border-violet-200/50 dark:border-violet-700/30 shadow-sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Trusted by thousands of sellers
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Discover{" "}
              <span className="relative inline-block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headlineIndex}
                    className="bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent inline-block"
                    initial={{ opacity: 0, y: 20, rotateX: -90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -20, rotateX: 90 }}
                    transition={{ duration: 0.5 }}
                  >
                    {HEADLINE_WORDS[headlineIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <br />
              <span className="text-foreground/90">Products</span>
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground/80 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              A marketplace where independent sellers showcase their best
              products. Find unique items at great prices, directly from the
              people who make and curate them.
            </motion.p>

            {/* Hero Search */}
            <motion.form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-2xl gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
            >
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 transition-colors group-focus-within:text-violet-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for anything..."
                  className="h-14 pl-12 pr-4 text-base rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-lg shadow-violet-500/5 focus:shadow-violet-500/10 focus:border-violet-300 dark:focus:border-violet-600 transition-all duration-300"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-8 rounded-2xl cursor-pointer bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 text-base font-semibold"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </motion.form>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          className="relative border-t border-white/30 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="mx-auto max-w-7xl px-4 py-5">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                {
                  icon: <Shield className="h-5 w-5" />,
                  label: "Secure Payments",
                  sub: "256-bit encryption",
                },
                {
                  icon: <Truck className="h-5 w-5" />,
                  label: "Seller Direct",
                  sub: "No middlemen",
                },
                {
                  icon: <TrendingUp className="h-5 w-5" />,
                  label: "Best Prices",
                  sub: "Price guarantee",
                },
              ].map((badge, i) => (
                <motion.div
                  key={badge.label}
                  className="flex items-center justify-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.15, duration: 0.5 }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100/80 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                    {badge.icon}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-foreground/90">
                      {badge.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{badge.sub}</p>
                  </div>
                  <span className="sm:hidden text-sm font-medium text-foreground/80">
                    {badge.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Filters + Products */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {/* Category pills */}
        <motion.div
          className="mb-8 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <button
            onClick={() => {
              setCategory("");
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              category === ""
                ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-500/25"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                category === cat
                  ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-500/25"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
              }`}
            >
              {CATEGORY_ICONS[cat]}
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Sort */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-medium">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <motion.span
                  className="inline-block w-2 h-2 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                Searching...
              </span>
            ) : (
              <span>
                <span className="text-foreground font-semibold">{total}</span>{" "}
                products found
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v ?? "createdAt")}
            >
              <SelectTrigger className="w-44 cursor-pointer rounded-xl border-muted-foreground/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="createdAt" className="cursor-pointer">
                  Newest
                </SelectItem>
                <SelectItem value="price" className="cursor-pointer">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="title" className="cursor-pointer">
                  Name
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
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-muted/50 overflow-hidden bg-card"
                >
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-3 w-3 rounded-full" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-6 w-16 rounded-lg" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
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
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                No products found
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Try adjusting your search or filters to discover more products
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl cursor-pointer"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="mt-12 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="cursor-pointer h-10 w-10 rounded-xl hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/30 dark:hover:border-violet-700 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5">
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
                    className={`h-10 w-10 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                      page === pageNum
                        ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-500/25"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              className="cursor-pointer h-10 w-10 rounded-xl hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/30 dark:hover:border-violet-700 transition-all duration-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </section>
    </div>
  );
}
