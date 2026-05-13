-- Qora queda como CRM demo generico. El proyecto especializado de Hacienda se separa
-- en otro repositorio/carpeta, por eso se retiran sus datos del tenant demo.

DELETE FROM "CateringRequirement"
WHERE "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "PurchaseTask"
WHERE "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "EventScheduleItem"
WHERE "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "QuoteItem"
WHERE "quoteId" IN (
  SELECT q.id
  FROM "Quote" q
  JOIN "Opportunity" o ON o.id = q."opportunityId"
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "Quote"
WHERE "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "Reservation"
WHERE "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "Activity"
WHERE "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "Note"
WHERE "leadId" IN (
  SELECT l.id FROM "Lead" l JOIN "Client" c ON c.id = l."clientId" WHERE c.slug = 'hacienda-la-julieta'
)
OR "opportunityId" IN (
  SELECT o.id
  FROM "Opportunity" o
  JOIN "Lead" l ON l.id = o."leadId"
  JOIN "Client" c ON c.id = l."clientId"
  WHERE c.slug = 'hacienda-la-julieta'
)
OR "authorId" IN (
  SELECT u.id FROM "User" u JOIN "Client" c ON c.id = u."clientId" WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "AuditLog"
WHERE "userId" IN (
  SELECT u.id FROM "User" u JOIN "Client" c ON c.id = u."clientId" WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "Opportunity"
WHERE "leadId" IN (
  SELECT l.id FROM "Lead" l JOIN "Client" c ON c.id = l."clientId" WHERE c.slug = 'hacienda-la-julieta'
);

DELETE FROM "Lead"
WHERE "clientId" IN (SELECT id FROM "Client" WHERE slug = 'hacienda-la-julieta');

DELETE FROM "ServiceItem"
WHERE "clientId" IN (SELECT id FROM "Client" WHERE slug = 'hacienda-la-julieta');

DELETE FROM "Space"
WHERE "clientId" IN (SELECT id FROM "Client" WHERE slug = 'hacienda-la-julieta');

DELETE FROM "User"
WHERE "clientId" IN (SELECT id FROM "Client" WHERE slug = 'hacienda-la-julieta');

DELETE FROM "Client"
WHERE slug = 'hacienda-la-julieta';
