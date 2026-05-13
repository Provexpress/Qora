"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseClient, canUseCommercialRecord, isAdmin, isCommercial, isOperational } from "@/lib/scopes";
import { activitySchema, reservationSchema } from "@/lib/validations";

async function assertAgendaOpportunityAccess(user: Awaited<ReturnType<typeof assertRoles>>, opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { operationCode: true, assignedUserId: true, lead: { select: { assignedUserId: true, clientId: true } } }
  });

  if (!opportunity) throw new Error("Oportunidad no encontrada.");
  if (!canUseClient(user, opportunity.lead.clientId)) throw new Error("Esta oportunidad no pertenece al cliente activo.");

  const commercialAccess = isCommercial(user) && (canUseCommercialRecord(user, opportunity.assignedUserId) || canUseCommercialRecord(user, opportunity.lead.assignedUserId));
  const operationalAccess = isOperational(user) && Boolean(opportunity.operationCode);

  if (!isAdmin(user) && !commercialAccess && !operationalAccess) {
    throw new Error("No tienes acceso a la agenda de esta oportunidad.");
  }
}

export async function createActivity(formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial", "Operativo"]);
  const data = activitySchema.parse(Object.fromEntries(formData));
  await assertAgendaOpportunityAccess(user, data.opportunityId);
  await prisma.activity.create({
    data: {
      ...data,
      description: data.description || null,
      activityDate: new Date(data.activityDate)
    }
  });
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  redirect("/agenda");
}

export async function createReservation(formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const data = reservationSchema.parse(Object.fromEntries(formData));
  await assertAgendaOpportunityAccess(user, data.opportunityId);
  await prisma.reservation.create({
    data: {
      ...data,
      notes: data.notes || null,
      reservationDate: new Date(data.reservationDate)
    }
  });
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  redirect("/agenda");
}

export async function updateReservationStatus(id: string, status: string) {
  await assertRoles(["Administrador", "Comercial", "Operativo"]);
  await prisma.reservation.update({ where: { id }, data: { status } });
  revalidatePath("/agenda");
  revalidatePath("/operacion");
  revalidatePath("/alistamiento");
  redirect("/agenda");
}

export async function updateActivityStatus(id: string, status: string) {
  await assertRoles(["Administrador", "Comercial", "Operativo"]);
  await prisma.activity.update({ where: { id }, data: { status } });
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/asignaciones");
  redirect("/agenda");
}
