-- Audit trail for key CRM actions.
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes for common CRM filters and dashboards.
CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");

CREATE INDEX IF NOT EXISTS "Lead_assignedUserId_idx" ON "Lead"("assignedUserId");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");

CREATE INDEX IF NOT EXISTS "Opportunity_leadId_idx" ON "Opportunity"("leadId");
CREATE INDEX IF NOT EXISTS "Opportunity_stageId_idx" ON "Opportunity"("stageId");
CREATE INDEX IF NOT EXISTS "Opportunity_assignedUserId_idx" ON "Opportunity"("assignedUserId");
CREATE INDEX IF NOT EXISTS "Opportunity_closedAt_idx" ON "Opportunity"("closedAt");
CREATE INDEX IF NOT EXISTS "Opportunity_wonAt_idx" ON "Opportunity"("wonAt");

CREATE INDEX IF NOT EXISTS "Activity_opportunityId_idx" ON "Activity"("opportunityId");
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "Activity_activityDate_idx" ON "Activity"("activityDate");
CREATE INDEX IF NOT EXISTS "Activity_status_idx" ON "Activity"("status");
CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity"("type");

CREATE INDEX IF NOT EXISTS "Reservation_opportunityId_idx" ON "Reservation"("opportunityId");
CREATE INDEX IF NOT EXISTS "Reservation_spaceId_idx" ON "Reservation"("spaceId");
CREATE INDEX IF NOT EXISTS "Reservation_reservationDate_idx" ON "Reservation"("reservationDate");
CREATE INDEX IF NOT EXISTS "Reservation_status_idx" ON "Reservation"("status");

CREATE INDEX IF NOT EXISTS "Quote_opportunityId_idx" ON "Quote"("opportunityId");
CREATE INDEX IF NOT EXISTS "Quote_status_idx" ON "Quote"("status");
CREATE INDEX IF NOT EXISTS "Quote_createdAt_idx" ON "Quote"("createdAt");

CREATE INDEX IF NOT EXISTS "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");
CREATE INDEX IF NOT EXISTS "QuoteItem_serviceItemId_idx" ON "QuoteItem"("serviceItemId");

CREATE INDEX IF NOT EXISTS "PurchaseTask_opportunityId_idx" ON "PurchaseTask"("opportunityId");
CREATE INDEX IF NOT EXISTS "PurchaseTask_quoteItemId_idx" ON "PurchaseTask"("quoteItemId");
CREATE INDEX IF NOT EXISTS "PurchaseTask_status_idx" ON "PurchaseTask"("status");
CREATE INDEX IF NOT EXISTS "PurchaseTask_dueDate_idx" ON "PurchaseTask"("dueDate");

CREATE INDEX IF NOT EXISTS "EventScheduleItem_opportunityId_idx" ON "EventScheduleItem"("opportunityId");
CREATE INDEX IF NOT EXISTS "EventScheduleItem_scheduleDate_idx" ON "EventScheduleItem"("scheduleDate");
CREATE INDEX IF NOT EXISTS "EventScheduleItem_status_idx" ON "EventScheduleItem"("status");
CREATE INDEX IF NOT EXISTS "EventScheduleItem_order_idx" ON "EventScheduleItem"("order");

CREATE INDEX IF NOT EXISTS "ServiceItem_category_idx" ON "ServiceItem"("category");
CREATE INDEX IF NOT EXISTS "ServiceItem_active_idx" ON "ServiceItem"("active");

CREATE INDEX IF NOT EXISTS "Space_active_idx" ON "Space"("active");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
