"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  LogOut,
  LayoutDashboard,
  Store,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  Radio,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading, fetchUser, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const items = useCart((s) => s.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchLiveCount() {
      try {
        const res = await fetch("/api/live-sales?status=LIVE&limit=1");
        const data = await res.json();
        setLiveCount(data.pagination?.total || 0);
      } catch {
        // silent
      }
    }
    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?search=${encodeURIComponent(search.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 dark:border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-emerald-500 shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow duration-300">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline font-heading text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent">
            Marketplace
          </span>
        </Link>

        {/* Search - Desktop */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl hidden md:flex"
        >
          <div
            className={`relative w-full transition-all duration-500 ease-out ${
              searchFocused ? "max-w-xl scale-[1.02]" : "max-w-md"
            }`}
          >
            <Search
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                searchFocused
                  ? "text-violet-500"
                  : "text-muted-foreground/50"
              }`}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search products..."
              className={`pl-10 pr-4 h-10 rounded-xl bg-muted/40 border-transparent transition-all duration-300 ${
                searchFocused
                  ? "bg-background/80 backdrop-blur-xl border-violet-300 dark:border-violet-700 shadow-lg shadow-violet-500/5 ring-2 ring-violet-500/10"
                  : "hover:bg-muted/60"
              }`}
            />
          </div>
        </form>

        {/* Live Sales Link */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-1.5 cursor-pointer rounded-xl text-sm hover:bg-muted/60 relative"
          onClick={() => router.push("/live")}
        >
          <div className="relative">
            <Radio className="h-4 w-4" />
            {liveCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
            )}
          </div>
          <span className={liveCount > 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
            Live
          </span>
        </Button>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative cursor-pointer h-9 w-9 rounded-xl hover:bg-muted/60"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {theme === "dark" ? (
                  <Moon className="h-[18px] w-[18px]" />
                ) : (
                  <Sun className="h-[18px] w-[18px]" />
                )}
              </motion.div>
            </Button>
          )}

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-pointer h-9 w-9 rounded-xl hover:bg-muted/60"
            onClick={() => router.push("/cart")}
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key="cart-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                  }}
                  className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-gradient-to-r from-violet-600 to-violet-700 text-[10px] font-bold text-white shadow-md shadow-violet-500/30"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          {/* User section */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger >
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative cursor-pointer h-9 w-9 rounded-xl hover:bg-muted/60"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {userInitial}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl p-1.5 mt-1 border-muted/50 bg-background/95 backdrop-blur-xl shadow-xl"
              >
                <div className="px-3 py-2.5 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="mx-1" />
                {user.role === "SELLER" && (
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-violet-50 dark:focus:bg-violet-900/20"
                    onClick={() => router.push("/dashboard/seller")}
                  >
                    <LayoutDashboard className="mr-2.5 h-4 w-4 text-violet-500" />
                    Seller Dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "BUYER" && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-violet-50 dark:focus:bg-violet-900/20"
                      onClick={() => router.push("/dashboard/buyer")}
                    >
                      <LayoutDashboard className="mr-2.5 h-4 w-4 text-violet-500" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-violet-50 dark:focus:bg-violet-900/20"
                      onClick={() => router.push("/seller/onboarding")}
                    >
                      <Store className="mr-2.5 h-4 w-4 text-emerald-500" />
                      Become a Seller
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-violet-50 dark:focus:bg-violet-900/20"
                    onClick={() => router.push("/admin")}
                  >
                    <Shield className="mr-2.5 h-4 w-4 text-amber-500" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading && !user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer rounded-xl text-sm hover:bg-muted/60"
                onClick={() => router.push("/auth/login")}
              >
                Log in
              </Button>
              <Button
                size="sm"
                className="cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 transition-all duration-300 text-sm font-semibold"
                onClick={() => router.push("/auth/signup")}
              >
                Sign up
              </Button>
            </div>
          ) : null}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden cursor-pointer h-9 w-9 rounded-xl hover:bg-muted/60"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden border-t border-white/10 dark:border-white/5 md:hidden bg-background/80 backdrop-blur-xl"
          >
            <div className="p-4 space-y-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10 h-11 rounded-xl bg-muted/40 border-transparent focus:border-violet-300 dark:focus:border-violet-700 focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>
              </form>

              <button
                onClick={() => {
                  router.push("/live");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Radio className="h-4 w-4 text-red-500" />
                  {liveCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                    </span>
                  )}
                </div>
                <span className={liveCount > 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                  Live Sales {liveCount > 0 ? `(${liveCount})` : ""}
                </span>
              </button>

              {user && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      {userInitial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role?.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {user.role === "SELLER" && (
                    <button
                      onClick={() => {
                        router.push("/dashboard/seller");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="h-4 w-4 text-violet-500" />
                      Seller Dashboard
                    </button>
                  )}
                  {user.role === "BUYER" && (
                    <>
                      <button
                        onClick={() => {
                          router.push("/dashboard/buyer");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="h-4 w-4 text-violet-500" />
                        My Orders
                      </button>
                      <button
                        onClick={() => {
                          router.push("/seller/onboarding");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <Store className="h-4 w-4 text-emerald-500" />
                        Become a Seller
                      </button>
                    </>
                  )}
                  {user.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        router.push("/admin");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <Shield className="h-4 w-4 text-amber-500" />
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}

              {!user && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex gap-2"
                >
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl cursor-pointer"
                    onClick={() => {
                      router.push("/auth/login");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    className="flex-1 rounded-xl cursor-pointer bg-gradient-to-r from-violet-600 to-violet-700 text-white"
                    onClick={() => {
                      router.push("/auth/signup");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign up
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
