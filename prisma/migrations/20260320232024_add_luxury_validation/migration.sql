-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_luxury" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "product_validations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_validations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product_validations" ADD CONSTRAINT "product_validations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
