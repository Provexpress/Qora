"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { buildCateringRequirement, isCateringQuoteItem } from "@/lib/catering";
import { prisma } from "@/lib/prisma";

const operationRoles = ["Administrador", "Operativo"] as const;

export async function generateCateringPlan(opportunityId: string, formData?: FormData) {
  await assertRoles(operationRoles);
  const returnTo = formData ? String(formData.get("returnTo") ?? "") : "";
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      reservations: { orderBy: { reservationDate: "asc" }, take: 1 },
      cateringRequirements: true,
      quotes: {
        where: { status: "Aceptada" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { items: { include: { serviceItem: true } } }
      }
    }
  });

  if (!opportunity) throw new Error("Oportunidad no encontrada.");
  const quote = opportunity.quotes[0];
  if (!quote) throw new Error("Primero debe existir una cotización aceptada.");

  const currentQuoteItemIds = new Set(opportunity.cateringRequirements.map((item) => item.quoteItemId).filter(Boolean));
  const reservation = opportunity.reservations[0];
  const foodItems = quote.items.filter(isCateringQuoteItem).filter((item) => !currentQuoteItemIds.has(item.id));

  if (foodItems.length === 0) {
    await removeDuplicateCateringRequirementsForOpportunity(opportunityId);
    revalidateCateringViews();
    redirect(safeReturnTo(returnTo));
  }

  await prisma.cateringRequirement.createMany({
    data: foodItems.map((item) => ({
      opportunityId,
      ...buildCateringRequirement(item, reservation?.startTime)
    }))
  });

  await removeDuplicateCateringRequirementsForOpportunity(opportunityId);
  revalidateCateringViews();
  redirect(safeReturnTo(returnTo));
}

export async function updateCateringRequirementStatus(id: string, status: string, returnTo?: string | FormData) {
  await assertRoles(operationRoles);
  await prisma.cateringRequirement.update({
    where: { id },
    data: { status }
  });
  revalidateCateringViews();
  redirect(safeReturnTo(typeof returnTo === "string" ? returnTo : ""));
}

export async function updateCateringRequirement(id: string, formData: FormData) {
  await assertRoles(operationRoles);
  const updated = await prisma.cateringRequirement.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      category: String(formData.get("category") ?? "Alimentos").trim(),
      quantity: Number(formData.get("quantity") ?? 1),
      serviceTime: String(formData.get("serviceTime") ?? "").trim() || null,
      chefNotes: String(formData.get("chefNotes") ?? "").trim() || null
    },
    select: { opportunityId: true, title: true, category: true, serviceTime: true }
  });
  await removeDuplicateCateringRequirements(updated);
  await removeDuplicateCateringRequirementsForOpportunity(updated.opportunityId);
  revalidateCateringViews();
  redirect(safeReturnTo(String(formData.get("returnTo") ?? "")));
}

export async function createCateringRequirement(formData: FormData) {
  await assertRoles(operationRoles);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "Alimentos").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const serviceTime = String(formData.get("serviceTime") ?? "").trim() || null;
  const chefNotes = String(formData.get("chefNotes") ?? "").trim() || null;

  if (!opportunityId || !title) {
    throw new Error("Faltan datos para crear el requerimiento de alimentos.");
  }

  const existing = await prisma.cateringRequirement.findFirst({
    where: {
      opportunityId,
      title,
      category,
      serviceTime
    },
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    await prisma.cateringRequirement.update({
      where: { id: existing.id },
      data: {
        quantity,
        chefNotes,
        status: existing.status === "Bloqueado" ? "Pendiente" : existing.status
      }
    });
  } else {
    await prisma.cateringRequirement.create({
      data: {
        opportunityId,
        title,
        category,
        quantity,
        serviceTime,
        chefNotes,
        status: "Pendiente"
      }
    });
  }

  await removeDuplicateCateringRequirements({
    opportunityId,
    title,
    category,
    serviceTime
  });

  revalidateCateringViews();
  redirect(safeReturnTo(String(formData.get("returnTo") ?? "")));
}

async function removeDuplicateCateringRequirements(where: { opportunityId: string; title: string; category: string; serviceTime: string | null }) {
  const matches = await prisma.cateringRequirement.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  const duplicates = matches.slice(1).map((item) => item.id);
  if (duplicates.length > 0) {
    await prisma.cateringRequirement.deleteMany({
      where: { id: { in: duplicates } }
    });
  }
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

function revalidateCateringViews() {
  revalidatePath("/operacion");
  revalidatePath("/operacion/[id]", "page");
  revalidatePath("/alistamiento");
  revalidatePath("/dashboard");
  revalidatePath("/reportes");
}

function safeReturnTo(value?: string) {
  return value?.startsWith("/operacion") ? value : "/operacion";
}
