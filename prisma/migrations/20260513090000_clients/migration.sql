CREATE TABLE IF NOT EXISTS "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Activo',
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Client_slug_key" ON "Client"("slug");
CREATE INDEX IF NOT EXISTS "Client_status_idx" ON "Client"("status");

INSERT INTO "Client" ("id", "name", "slug", "status", "description", "updatedAt")
VALUES
  ('client_hacienda_la_julieta', 'Hacienda La Julieta', 'hacienda-la-julieta', 'Activo', 'Cliente operativo de eventos sociales y empresariales.', CURRENT_TIMESTAMP),
  ('client_qora_demo', 'Qora Demo', 'qora-demo', 'Activo', 'Espacio demostrativo generico para presentar Qora sin datos de un cliente especifico.', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "ServiceItem" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

UPDATE "User"
SET "clientId" = 'client_hacienda_la_julieta'
WHERE "clientId" IS NULL
  AND "email" <> 'admin@provexpress.co';

UPDATE "Lead" SET "clientId" = 'client_hacienda_la_julieta' WHERE "clientId" IS NULL;
UPDATE "ServiceItem" SET "clientId" = 'client_hacienda_la_julieta' WHERE "clientId" IS NULL;
UPDATE "Space" SET "clientId" = 'client_hacienda_la_julieta' WHERE "clientId" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_clientId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_clientId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceItem_clientId_fkey') THEN
    ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Space_clientId_fkey') THEN
    ALTER TABLE "Space" ADD CONSTRAINT "Space_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_clientId_idx" ON "User"("clientId");
CREATE INDEX IF NOT EXISTS "Lead_clientId_idx" ON "Lead"("clientId");
CREATE INDEX IF NOT EXISTS "ServiceItem_clientId_idx" ON "ServiceItem"("clientId");
CREATE INDEX IF NOT EXISTS "Space_clientId_idx" ON "Space"("clientId");
