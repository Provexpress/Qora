CREATE TABLE IF NOT EXISTS "Note" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "leadId" TEXT,
  "opportunityId" TEXT,
  "content" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'Interna',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Note_authorId_fkey'
  ) THEN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Note_leadId_fkey'
  ) THEN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Note_opportunityId_fkey'
  ) THEN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Note_authorId_idx" ON "Note"("authorId");
CREATE INDEX IF NOT EXISTS "Note_leadId_idx" ON "Note"("leadId");
CREATE INDEX IF NOT EXISTS "Note_opportunityId_idx" ON "Note"("opportunityId");
CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt");
