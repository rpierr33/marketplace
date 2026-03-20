-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'SEEMS_NEW', 'PRETTY_GOOD', 'USED_BATTLE_SCARS');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "condition" "ProductCondition" NOT NULL DEFAULT 'NEW';
