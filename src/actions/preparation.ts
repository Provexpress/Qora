"use server";

import { addDays, subDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { buildCateringRequirement, isCateringQuoteItem } from "@/lib/catering";
import { prisma } from "@/lib/prisma";
import { defaultEventTimeline, suggestedSupplier } from "@/lib/event-plan";

export async function generatePreparationPlan(opportunityId: string, formData?: FormData) {
  const user = await assertRoles(["Administrador", "Operativo"]);
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      quotes: {
        where: { status: "Aceptada" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { items: { include: { serviceItem: true } } }
      },
      reservations: { orderBy: { reservationDate: "asc" } },
      purchaseTasks: true,
      scheduleItems: true,
      cateringRequirements: true
    }
  });

  if (!opportunity) {
    throw new Error("Oportunidad no encontrada.");
  }

  const quote = opportunity.quotes[0];
  if (!quote) {
    throw new Error("Primero debe existir una cotización aceptada.");
  }

  const reservation = opportunity.reservations[0];
  const dueDate = reservation?.reservationDate ? subDays(reservation.reservationDate, 5) : addDays(new Date(), 5);
  const scheduleDate = reservation?.reservationDate ?? opportunity.expectedCloseDate ?? new Date();
  const cateringQuoteItemIds = new Set(opportunity.cateringRequirements.map((item) => item.quoteItemId).filter(Boolean));
  const cateringItems = quote.items.filter(isCateringQuoteItem).filter((item) => !cateringQuoteItemIds.has(item.id));

  await prisma.$transaction([
    ...(opportunity.purchaseTasks.length > 0
      ? []
      : [
          prisma.purchaseTask.createMany({
            data: quote.items.map((item) => ({
              opportunityId,
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
    ...(opportunity.scheduleItems.length > 0
      ? []
      : [
          prisma.eventScheduleItem.createMany({
            data: defaultEventTimeline.map((item, index) => ({
              opportunityId,
              scheduleDate,
              title: item.title,
              description: "Bloque sugerido para coordinar la ejecucion del proyecto.",
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
              opportunityId,
              ...buildCateringRequirement(item, reservation?.startTime)
            }))
          })
        ]),
    prisma.opportunity.update({
      where: { id: opportunityId },
      data: { operationalStatus: "Implementacion en curso" }
    })
  ]);

  await removeDuplicateCateringRequirementsForOpportunity(opportunityId);
  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunityId,
    action: "generate_preparation",
    summary: "Alistamiento generado desde cotización aceptada"
  });
  revalidatePreparationViews();
  redirect(safeReturnTo(formData ? String(formData.get("returnTo") ?? "") : ""));
}

export async function updatePurchaseTaskStatus(taskId: string, status: string, formData?: FormData) {
  await assertRoles(["Administrador", "Operativo"]);
  await prisma.purchaseTask.update({
    where: { id: taskId },
    data: {
      status,
      purchasedAt: status === "Comprado" || status === "Contratado" ? new Date() : null
    }
  });
  revalidatePreparationViews();
  redirect(safeReturnTo(formData ? String(formData.get("returnTo") ?? "") : ""));
}

export async function updateScheduleItemStatus(itemId: string, status: string, formData?: FormData) {
  await assertRoles(["Administrador", "Operativo"]);
  await prisma.eventScheduleItem.update({
    where: { id: itemId },
    data: { status }
  });
  revalidatePreparationViews();
  redirect(safeReturnTo(formData ? String(formData.get("returnTo") ?? "") : ""));
}

export async function closePreparedEvent(opportunityId: string, formData?: FormData) {
  const user = await assertRoles(["Administrador", "Operativo"]);
  await prisma.$transaction([
    prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        operationalStatus: "Finalizado",
        closedAt: new Date()
      }
    }),
    prisma.activity.updateMany({
      where: { opportunityId, type: { in: ["Operacion", "Operación", "OperaciÃ³n"] }, status: { not: "Finalizada" } },
      data: { status: "Finalizada" }
    }),
    prisma.lead.updateMany({
      where: { opportunities: { some: { id: opportunityId } } },
      data: { status: "Cerrado" }
    })
  ]);

  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunityId,
    action: "close",
    summary: "Proyecto finalizado y negocio cerrado"
  });
  revalidatePreparationViews();
  redirect(safeReturnTo(formData ? String(formData.get("returnTo") ?? "") : ""));
}

function revalidatePreparationViews() {
  revalidatePath("/alistamiento");
  revalidatePath("/operacion");
  revalidatePath("/operacion/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/reportes");
  revalidatePath("/leads");
}

async function removeDuplicateCateringRequirementsForOpportunity(opportunityId: string) {
  const requirements = await prisma.cateringRequirement.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quoteItemId: true,
      title: true,
      category: true,
      serviceTime: true
    }
  });

  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of requirements) {
    const key = item.quoteItemId ?? `${item.title}|${item.category}|${item.serviceTime ?? ""}`;
    if (seen.has(key)) {
      duplicates.push(item.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    await prisma.cateringRequirement.deleteMany({
      where: { id: { in: duplicates } }
    });
  }
}

function safeReturnTo(value?: string) {
  if (value?.startsWith("/operacion")) return value;
  if (value?.startsWith("/alistamiento")) return value;
  return "/alistamiento";
}
