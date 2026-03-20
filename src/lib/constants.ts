export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
  "Health & Beauty",
  "Automotive",
  "Food & Drink",
  "Art & Crafts",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PRODUCT_CONDITIONS = [
  { value: "NEW", label: "New", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "sparkles" },
  { value: "SEEMS_NEW", label: "Seems New", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400", icon: "thumbsUp" },
  { value: "PRETTY_GOOD", label: "Pretty Good", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400", icon: "smile" },
  { value: "USED_BATTLE_SCARS", label: "Used - Battle Scars", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400", icon: "shield" },
] as const;
