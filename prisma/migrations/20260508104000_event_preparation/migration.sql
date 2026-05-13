ALTER TABLE "Opportunity"
ADD COLUMN "closedAt" TIMESTAMP(3);

CREATE TABLE "PurchaseTask" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "quoteItemId" TEXT,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "quantity" INTEGER NOT NULL,
  "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "supplier" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pendiente',
  "dueDate" TIMESTAMP(3),
  "purchasedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventScheduleItem" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduleDate" TIMESTAMP(3),
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "owner" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pendiente',
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventScheduleItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PurchaseTask"
ADD CONSTRAINT "PurchaseTask_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PurchaseTask"
ADD CONSTRAINT "PurchaseTask_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventScheduleItem"
ADD CONSTRAINT "EventScheduleItem_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
