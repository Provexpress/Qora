CREATE TABLE "CateringRequirement" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "quoteItemId" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Alimentos',
  "quantity" INTEGER NOT NULL,
  "serviceTime" TEXT,
  "chefNotes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pendiente',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CateringRequirement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CateringRequirement_opportunityId_idx" ON "CateringRequirement"("opportunityId");
CREATE INDEX "CateringRequirement_quoteItemId_idx" ON "CateringRequirement"("quoteItemId");

ALTER TABLE "CateringRequirement"
ADD CONSTRAINT "CateringRequirement_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CateringRequirement"
ADD CONSTRAINT "CateringRequirement_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
