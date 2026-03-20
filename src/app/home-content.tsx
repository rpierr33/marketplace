"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Truck,
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
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-emerald-50 dark:from-violet-950/30 dark:via-background dark:to-emerald-950/20">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            <Badge
              variant="secondary"
              className="px-4 py-1.5 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Trusted by thousands of sellers
            </Badge>
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
              Discover{" "}
              <span className="bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
                Amazing Products
              </span>
              <br />
              from Small Sellers
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A marketplace where independent sellers showcase their best
              products. Find unique items at great prices, directly from the
              people who make and curate them.
            </p>

            {/* Hero Search */}
            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-xl gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for anything..."
                  className="h-12 pl-10 text-base rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-6 rounded-xl cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
              >
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Trust badges */}
        <div className="border-t bg-background/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 text-violet-600" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-violet-600" />
                <span>Seller Direct</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-violet-600" />
                <span>Best Prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Products */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* Category pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge
            variant={category === "" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
            onClick={() => {
              setCategory("");
              setPage(1);
            }}
          >
            All
          </Badge>
          {PRODUCT_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Sort */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${total} products found`}
          </p>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "createdAt")}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
