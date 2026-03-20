-- CreateEnum
CREATE TYPE "LiveSaleStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveSaleType" AS ENUM ('CLEARANCE', 'FLASH_SALE', 'SPECIAL_OCCASION', 'AUCTION');

-- CreateTable
CREATE TABLE "live_sales" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LiveSaleType" NOT NULL DEFAULT 'FLASH_SALE',
    "status" "LiveSaleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "stream_url" TEXT,
    "thumbnail_url" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "watcher_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sale_items" (
    "id" TEXT NOT NULL,
    "live_sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "starting_bid" DOUBLE PRECISION NOT NULL,
    "current_bid" DOUBLE PRECISION,
    "buy_now_price" DOUBLE PRECISION,
    "is_sold" BOOLEAN NOT NULL DEFAULT false,
    "winner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "live_sale_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_sales_status_idx" ON "live_sales"("status");

-- CreateIndex
CREATE INDEX "live_sales_start_time_idx" ON "live_sales"("start_time");

-- CreateIndex
CREATE INDEX "bids_live_sale_item_id_idx" ON "bids"("live_sale_item_id");

-- AddForeignKey
ALTER TABLE "live_sales" ADD CONSTRAINT "live_sales_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sale_items" ADD CONSTRAINT "live_sale_items_live_sale_id_fkey" FOREIGN KEY ("live_sale_id") REFERENCES "live_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sale_items" ADD CONSTRAINT "live_sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sale_items" ADD CONSTRAINT "live_sale_items_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_live_sale_item_id_fkey" FOREIGN KEY ("live_sale_item_id") REFERENCES "live_sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
