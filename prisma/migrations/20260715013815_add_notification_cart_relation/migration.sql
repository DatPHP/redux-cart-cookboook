-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "cartId" INTEGER;

-- CreateIndex
CREATE INDEX "notifications_cartId_idx" ON "notifications"("cartId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
