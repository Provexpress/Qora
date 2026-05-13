"use server";

import { revalidatePath } from "next/cache";
import { assertRoles } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canUseClient, canUseCommercialRecord, isAdmin, isCommercial, isOperational } from "@/lib/scopes";

function getNoteContent(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 3) {
    throw new Error("La nota debe tener al menos 3 caracteres.");
  }
  return content;
}

export async function createLeadNote(leadId: string, formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const content = getNoteContent(formData);
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, fullName: true, assignedUserId: true, clientId: true } });

  if (!lead) throw new Error("Lead no encontrado.");
  if (!canUseClient(user, lead.clientId)) throw new Error("Este lead no pertenece al cliente activo.");
  if (!canUseCommercialRecord(user, lead.assignedUserId)) {
    throw new Error("Este lead pertenece a otro responsable comercial.");
  }

  await prisma.note.create({
    data: {
      authorId: user.id,
      leadId,
      content
    }
  });

  await recordAudit({
    userId: user.id,
    entityType: "Lead",
    entityId: leadId,
    action: "note",
    summary: `Nota interna agregada para ${lead.fullName}`
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function createOpportunityNote(opportunityId: string, formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial", "Operativo"]);
  const content = getNoteContent(formData);
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      id: true,
      title: true,
      leadId: true,
      operationCode: true,
      assignedUserId: true,
      lead: { select: { assignedUserId: true, clientId: true } }
    }
  });

  if (!opportunity) throw new Error("Oportunidad no encontrada.");
  if (!canUseClient(user, opportunity.lead.clientId)) throw new Error("Esta oportunidad no pertenece al cliente activo.");
  const commercialCanAccess = isCommercial(user) && (canUseCommercialRecord(user, opportunity.assignedUserId) || canUseCommercialRecord(user, opportunity.lead.assignedUserId));
  const operationalCanAccess = isOperational(user) && Boolean(opportunity.operationCode);

  if (!isAdmin(user) && !commercialCanAccess && !operationalCanAccess) {
    throw new Error("No tienes acceso a esta oportunidad.");
  }

  await prisma.note.create({
    data: {
      authorId: user.id,
      opportunityId,
      content
    }
  });

  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunityId,
    action: "note",
    summary: `Nota interna agregada en ${opportunity.title}`
  });

  revalidatePath(`/leads/${opportunity.leadId}`);
  revalidatePath(`/operacion/${opportunityId}`);
}
