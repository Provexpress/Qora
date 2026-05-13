"use server";

import { subDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { assertRoles } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { buildCateringRequirement, isCateringQuoteItem } from "@/lib/catering";
import { prisma } from "@/lib/prisma";
import { defaultEventTimeline, suggestedSupplier } from "@/lib/event-plan";
import { canUseClient, canUseCommercialRecord, isAdmin } from "@/lib/scopes";
import { quoteSchema } from "@/lib/validations";

async function assertCommercialOpportunityAccess(user: Awaited<ReturnType<typeof assertRoles>>, opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      id: true,
      operationCode: true,
      assignedUserId: true,
      lead: { select: { assignedUserId: true, clientId: true, client: true } }
    }
  });

  if (!opportunity) throw new Error("Oportunidad no encontrada.");
  if (!canUseClient(user, opportunity.lead.clientId)) throw new Error("Esta oportunidad no pertenece al cliente activo.");
  if (opportunity.operationCode) throw new Error("Esta oportunidad ya fue enviada a operación.");
  if (!isAdmin(user) && !canUseCommercialRecord(user, opportunity.assignedUserId) && !canUseCommercialRecord(user, opportunity.lead.assignedUserId)) {
    throw new Error("Esta oportunidad pertenece a otro responsable comercial.");
  }

  return opportunity;
}

export async function createQuote(payload: unknown) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const data = quoteSchema.parse(payload);
  const opportunity = await assertCommercialOpportunityAccess(user, data.opportunityId);
  const canManageCosts = user.role.name === "Administrador";
  const serviceIds = data.items.map((item) => item.serviceItemId).filter(Boolean) as string[];
  const serviceCosts = new Map(
    (
      await prisma.serviceItem.findMany({
        where: { id: { in: serviceIds }, clientId: opportunity.lead.clientId },
        select: { id: true, cost: true }
      })
    ).map((service) => [service.id, Number(service.cost)])
  );
  const items = data.items.map((item) => ({
    ...item,
    unitCost: item.serviceItemId && !canManageCosts ? serviceCosts.get(item.serviceItemId) ?? 0 : item.unitCost
  }));
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const costSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  if (data.discount > subtotal) {
    throw new Error("El descuento no puede superar el subtotal de la cotización.");
  }

  const customItemWithoutCost = items.find((item) => !item.serviceItemId && item.unitCost <= 0);
  if (customItemWithoutCost) {
    throw new Error(`El ítem personalizado "${customItemWithoutCost.description}" debe tener costo estimado mayor a cero.`);
  }

  const total = Math.max(subtotal - data.discount, 0);
  const profit = total - costSubtotal;
  const marginPercent = total > 0 ? (profit / total) * 100 : 0;
  const status = data.status === "Enviada" ? "Enviada" : "Borrador";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const quoteNumber = await nextQuoteNumber(opportunity.lead.client?.slug ?? "qora");

    try {
      const quote = await prisma.quote.create({
        data: {
          opportunityId: data.opportunityId,
          quoteNumber,
          title: data.title,
          status,
          subtotal,
          costSubtotal,
          discount: data.discount,
          total,
          profit,
          marginPercent,
          validUntil: new Date(data.validUntil),
          notes: data.notes || null,
          items: {
            create: items.map((item) => ({
              serviceItemId: item.serviceItemId || null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              total: item.quantity * item.unitPrice,
              totalCost: item.quantity * item.unitCost
            }))
          }
        }
      });

      if (status === "Enviada") {
        await moveOpportunityToSentStage(data.opportunityId);
      }

      await recordAudit({
        userId: user.id,
        entityType: "Quote",
        entityId: quote.id,
        action: "create",
        summary: `Cotización ${quote.quoteNumber} creada`,
        metadata: { status, total }
      });
      revalidateQuoteViews();
      return { id: quote.id };
    } catch (error) {
      if (isUniqueQuoteNumberError(error)) continue;
      throw error;
    }
  }

  throw new Error("No fue posible generar un número de cotización único.");
}

export async function sendQuote(quoteId: string) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { opportunity: true }
  });

  if (!quote) throw new Error("Cotización no encontrada.");
  if (quote.status === "Enviada") {
    revalidateQuoteViews();
    return;
  }
  if (quote.status !== "Borrador") throw new Error("Solo una cotización en borrador puede enviarse.");

  const sentStage = await findOrCreateStage("Cotización enviada", ["Cotizaci\u00c3\u00b3n enviada"], 4, "#db2777");

  await prisma.$transaction([
    prisma.quote.update({ where: { id: quoteId }, data: { status: "Enviada" } }),
    ...(sentStage ? [prisma.opportunity.update({ where: { id: quote.opportunityId }, data: { stageId: sentStage.id } })] : []),
    prisma.activity.create({
      data: {
        opportunityId: quote.opportunityId,
        userId: quote.opportunity.assignedUserId ?? user.id,
        title: `Cotización ${quote.quoteNumber} enviada`,
        description: "Registrar respuesta del cliente y próximos pasos comerciales.",
        activityDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: "Seguimiento",
        status: "Pendiente"
      }
    })
  ]);

  await recordAudit({
    userId: user.id,
    entityType: "Quote",
    entityId: quoteId,
    action: "send",
    summary: `Cotización ${quote.quoteNumber} enviada`
  });
  revalidateQuoteViews();
}

export async function rejectQuote(quoteId: string) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Cotización no encontrada.");
  if (quote.status === "Rechazada") {
    revalidateQuoteViews();
    return;
  }
  if (quote.status === "Aceptada") throw new Error("Una cotización aceptada no puede rechazarse desde este flujo.");

  const lostStage = await prisma.pipelineStage.findUnique({ where: { name: "Perdido" } });

  await prisma.$transaction([
    prisma.quote.update({ where: { id: quoteId }, data: { status: "Rechazada" } }),
    ...(lostStage ? [prisma.opportunity.update({ where: { id: quote.opportunityId }, data: { stageId: lostStage.id, operationalStatus: null } })] : [])
  ]);

  await recordAudit({
    userId: user.id,
    entityType: "Quote",
    entityId: quoteId,
    action: "reject",
    summary: `Cotización rechazada`
  });
  revalidateQuoteViews();
}

export async function expireQuote(quoteId: string) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Cotización no encontrada.");
  if (quote.status === "Vencida") {
    revalidateQuoteViews();
    return;
  }
  if (quote.status !== "Enviada") throw new Error("Solo una cotización enviada puede marcarse como vencida.");

  await prisma.quote.update({ where: { id: quoteId }, data: { status: "Vencida" } });
  await recordAudit({
    userId: user.id,
    entityType: "Quote",
    entityId: quoteId,
    action: "expire",
    summary: `Cotización vencida`
  });
  revalidateQuoteViews();
}

export async function markQuoteAsWon(quoteId: string) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: { include: { serviceItem: true } },
      opportunity: {
        include: {
          activities: true,
          lead: true,
          reservations: { orderBy: { reservationDate: "asc" } },
          purchaseTasks: true,
          scheduleItems: true,
          cateringRequirements: true
        }
      }
    }
  });

  if (!quote) throw new Error("Cotización no encontrada.");
  if (!canUseClient(user, quote.opportunity.lead.clientId)) throw new Error("Esta cotización no pertenece al cliente activo.");
  if (quote.status === "Aceptada") {
    await removeDuplicateOperationalArtifacts(quote.opportunityId);
    revalidateQuoteViews();
    return;
  }
  if (quote.status !== "Borrador" && quote.status !== "Enviada") {
    throw new Error("Esta cotización ya tiene un estado final.");
  }

  const wonStage = await findOrCreateStage("Ganado / Operación", ["Ganado / Operaci\u00c3\u00b3n"], 6, "#059669");
  const operator = await prisma.user.findFirst({ where: { role: { name: "Operativo" }, clientId: quote.opportunity.lead.clientId } });
  const operationCode = quote.opportunity.operationCode ?? (await nextOperationCode());
  const hasOperationalTasks = quote.opportunity.activities.some((activity) => activity.type === "Operación");
  const reservation = quote.opportunity.reservations[0];
  const dueDate = reservation?.reservationDate ? subDays(reservation.reservationDate, 5) : quote.validUntil;
  const scheduleDate = reservation?.reservationDate ?? quote.opportunity.expectedCloseDate ?? new Date();
  const cateringQuoteItemIds = new Set(quote.opportunity.cateringRequirements.map((item) => item.quoteItemId).filter(Boolean));
  const cateringItems = quote.items.filter(isCateringQuoteItem).filter((item) => !cateringQuoteItemIds.has(item.id));

  await prisma.$transaction([
    prisma.quote.update({ where: { id: quote.id }, data: { status: "Aceptada" } }),
    prisma.quote.updateMany({
      where: {
        opportunityId: quote.opportunityId,
        id: { not: quote.id },
        status: { in: ["Borrador", "Enviada"] }
      },
      data: { status: "Rechazada" }
    }),
    prisma.opportunity.update({
      where: { id: quote.opportunityId },
      data: {
        stageId: wonStage.id,
        estimatedValue: quote.total,
        operationCode,
        operationalStatus: "Alistamiento en curso",
        wonAt: quote.opportunity.wonAt ?? new Date(),
        assignedUserId: operator?.id ?? quote.opportunity.assignedUserId
      }
    }),
    prisma.lead.update({
      where: { id: quote.opportunity.leadId },
      data: { status: "En operación" }
    }),
    prisma.reservation.updateMany({
      where: { opportunityId: quote.opportunityId, status: "Pendiente" },
      data: { status: "Confirmada" }
    }),
    ...(hasOperationalTasks || !operator
      ? []
      : [
          prisma.activity.createMany({
            data: [
              "Confirmar alcance operativo con comercial",
              "Validar disponibilidad de zona y proveedores",
              "Preparar ficha técnica del evento",
              "Coordinar montaje y personal de apoyo"
            ].map((title, index) => ({
              opportunityId: quote.opportunityId,
              userId: operator.id,
              title,
              description: `Tarea operativa generada al aceptar la cotización ${quote.quoteNumber}.`,
              activityDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
              type: "Operación",
              status: "Pendiente"
            }))
          })
        ]),
    ...(quote.opportunity.purchaseTasks.length > 0
      ? []
      : [
          prisma.purchaseTask.createMany({
            data: quote.items.map((item) => ({
              opportunityId: quote.opportunityId,
              quoteItemId: item.id,
              description: item.description,
              category: item.serviceItem?.category ?? "Servicio",
              quantity: item.quantity,
              estimatedCost: item.totalCost,
              supplier: suggestedSupplier(item.serviceItem?.category ?? item.description),
              status: "Pendiente",
              dueDate,
              notes: `Compra o contratación derivada de ${quote.quoteNumber}.`
            }))
          })
        ]),
    ...(quote.opportunity.scheduleItems.length > 0
      ? []
      : [
          prisma.eventScheduleItem.createMany({
            data: defaultEventTimeline.map((item, index) => ({
              opportunityId: quote.opportunityId,
              scheduleDate,
              title: item.title,
              description: "Bloque sugerido para coordinar el día del evento.",
              startTime: index === 3 && reservation ? reservation.startTime : item.startTime,
              endTime: index === 6 && reservation ? reservation.endTime : item.endTime,
              type: item.type,
              owner: item.owner,
              status: "Pendiente",
              order: index + 1
            }))
          })
        ]),
    ...(cateringItems.length === 0
      ? []
      : [
          prisma.cateringRequirement.createMany({
            data: cateringItems.map((item) => ({
              opportunityId: quote.opportunityId,
              ...buildCateringRequirement(item, reservation?.startTime)
            }))
          })
        ])
  ]);

  await removeDuplicateOperationalArtifacts(quote.opportunityId);
  await recordAudit({
    userId: user.id,
    entityType: "Quote",
    entityId: quote.id,
    action: "won",
    summary: `Cotización ${quote.quoteNumber} aceptada y enviada a operación`,
    metadata: { opportunityId: quote.opportunityId, operationCode }
  });
  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: quote.opportunityId,
    action: "send_to_operation",
    summary: `Oportunidad enviada a operación con código ${operationCode}`
  });
  revalidateQuoteViews();
}

async function removeDuplicateOperationalArtifacts(opportunityId: string) {
  const [purchases, schedule, catering] = await Promise.all([
    prisma.purchaseTask.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "asc" },
      select: { id: true, quoteItemId: true, description: true, category: true, supplier: true }
    }),
    prisma.eventScheduleItem.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, startTime: true, endTime: true, order: true }
    }),
    prisma.cateringRequirement.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "asc" },
      select: { id: true, quoteItemId: true, title: true, category: true, serviceTime: true }
    })
  ]);

  await Promise.all([
    deleteDuplicates(
      purchases,
      (item) => item.quoteItemId ?? `${item.description}|${item.category ?? ""}|${item.supplier ?? ""}`,
      (ids) => prisma.purchaseTask.deleteMany({ where: { id: { in: ids } } })
    ),
    deleteDuplicates(
      schedule,
      (item) => `${item.order}|${item.title}|${item.startTime}|${item.endTime}`,
      (ids) => prisma.eventScheduleItem.deleteMany({ where: { id: { in: ids } } })
    ),
    deleteDuplicates(
      catering,
      (item) => item.quoteItemId ?? `${item.title}|${item.category}|${item.serviceTime ?? ""}`,
      (ids) => prisma.cateringRequirement.deleteMany({ where: { id: { in: ids } } })
    )
  ]);
}

async function deleteDuplicates<T extends { id: string }>(
  items: T[],
  keyFor: (item: T) => string,
  remove: (ids: string[]) => Promise<unknown>
) {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) {
      duplicates.push(item.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    await remove(duplicates);
  }
}

async function moveOpportunityToSentStage(opportunityId: string) {
  const sentStage = await findOrCreateStage("Cotización enviada", ["Cotizaci\u00c3\u00b3n enviada"], 4, "#db2777");
  await prisma.opportunity.update({ where: { id: opportunityId }, data: { stageId: sentStage.id } });
}

async function findOrCreateStage(name: string, legacyNames: string[], order: number, color: string) {
  const current = await prisma.pipelineStage.findUnique({ where: { name } });
  if (current) return current;

  const legacy = await prisma.pipelineStage.findFirst({ where: { name: { in: legacyNames } } });
  if (legacy) {
    return prisma.pipelineStage.update({
      where: { id: legacy.id },
      data: { name, order, color }
    });
  }

  return prisma.pipelineStage.create({ data: { name, order, color } });
}

async function nextQuoteNumber(clientSlug: string) {
  const prefix = quotePrefix(clientSlug);
  const lastQuote = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: `${prefix}-` } },
    orderBy: { quoteNumber: "desc" },
    select: { quoteNumber: true }
  });
  const lastNumber = lastQuote?.quoteNumber.match(new RegExp(`^${prefix}-(\\d+)$`))?.[1];
  const nextNumber = lastNumber ? Number(lastNumber) + 1 : 1;
  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

function quotePrefix(clientSlug: string) {
  if (clientSlug === "hacienda-la-julieta") return "HJ";
  if (clientSlug === "qora-demo") return "QD";

  const initials = clientSlug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "QR";
}

async function nextOperationCode() {
  const year = new Date().getFullYear();
  const prefix = `OP-${year}-`;
  const last = await prisma.opportunity.findFirst({
    where: { operationCode: { startsWith: prefix } },
    orderBy: { operationCode: "desc" },
    select: { operationCode: true }
  });
  const lastNumber = last?.operationCode?.match(/^OP-\d{4}-(\d+)$/)?.[1];
  const nextNumber = lastNumber ? Number(lastNumber) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

function isUniqueQuoteNumberError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("quoteNumber")
  );
}

function revalidateQuoteViews() {
  revalidatePath("/cotizaciones");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/financiero");
  revalidatePath("/operacion");
  revalidatePath("/alistamiento");
  revalidatePath("/asignaciones");
  revalidatePath("/reportes");
  revalidatePath("/agenda");
}
