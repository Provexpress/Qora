"use server";

import { revalidatePath } from "next/cache";
import { assertRoles } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canUseClient, canUseCommercialRecord, isAdmin, selectedClientId } from "@/lib/scopes";
import { leadSchema, opportunitySchema } from "@/lib/validations";

function optionalDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function createLead(formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const data = leadSchema.parse(Object.fromEntries(formData));
  const clientId = selectedClientId(user);
  if (!clientId) throw new Error("Selecciona un cliente antes de crear leads.");
  const existing = await prisma.lead.findFirst({
    where: {
      clientId,
      OR: [
        { email: data.email.trim().toLowerCase() },
        { phone: data.phone.trim() }
      ]
    },
    select: { id: true, fullName: true }
  });

  if (existing) {
    throw new Error(`Ya existe un lead con ese correo o teléfono: ${existing.fullName}.`);
  }

  const lead = await prisma.lead.create({
    data: {
      ...data,
      clientId,
      assignedUserId: isAdmin(user) ? data.assignedUserId : user.id,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      estimatedDate: optionalDate(data.estimatedDate),
      notes: data.notes || null
    }
  });
  await recordAudit({
    userId: user.id,
    entityType: "Lead",
    entityId: lead.id,
    action: "create",
    summary: `Lead creado: ${lead.fullName}`
  });
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLead(id: string, formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const data = leadSchema.parse(Object.fromEntries(formData));
  const currentLead = await prisma.lead.findUnique({ where: { id }, select: { assignedUserId: true, clientId: true } });

  if (!currentLead) throw new Error("Lead no encontrado.");
  if (!canUseClient(user, currentLead.clientId)) throw new Error("Este lead no pertenece al cliente activo.");
  if (!canUseCommercialRecord(user, currentLead.assignedUserId)) {
    throw new Error("Este lead pertenece a otro responsable comercial.");
  }

  const existing = await prisma.lead.findFirst({
    where: {
      id: { not: id },
      clientId: currentLead.clientId,
      OR: [
        { email: data.email.trim().toLowerCase() },
        { phone: data.phone.trim() }
      ]
    },
    select: { id: true, fullName: true }
  });

  if (existing) {
    throw new Error(`Ya existe otro lead con ese correo o teléfono: ${existing.fullName}.`);
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...data,
      assignedUserId: isAdmin(user) ? data.assignedUserId : user.id,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      estimatedDate: optionalDate(data.estimatedDate),
      notes: data.notes || null
    }
  });
  await recordAudit({
    userId: user.id,
    entityType: "Lead",
    entityId: id,
    action: "update",
    summary: `Lead actualizado: ${lead.fullName}`
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function createOpportunityFromLead(formData: FormData) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const data = opportunitySchema.parse(Object.fromEntries(formData));
  const lead = await prisma.lead.findUnique({ where: { id: data.leadId }, select: { assignedUserId: true, clientId: true } });

  if (!lead) throw new Error("Lead no encontrado.");
  if (!canUseClient(user, lead.clientId)) throw new Error("Este lead no pertenece al cliente activo.");
  if (!canUseCommercialRecord(user, lead.assignedUserId)) {
    throw new Error("Este lead pertenece a otro responsable comercial.");
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      ...data,
      assignedUserId: isAdmin(user) ? data.assignedUserId : user.id,
      estimatedValue: data.estimatedValue,
      expectedCloseDate: optionalDate(data.expectedCloseDate),
      notes: data.notes || null
    }
  });
  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunity.id,
    action: "create",
    summary: `Oportunidad creada desde lead`
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${data.leadId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}
