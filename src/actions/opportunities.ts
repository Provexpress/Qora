"use server";

import { revalidatePath } from "next/cache";
import { assertRoles } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canUseClient, canUseCommercialRecord, isAdmin } from "@/lib/scopes";
import { isCommerciallyLockedOpportunity } from "@/lib/status";

export async function moveOpportunity(opportunityId: string, stageId: string) {
  const user = await assertRoles(["Administrador", "Comercial"]);
  const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage) throw new Error("Etapa no encontrada.");
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { stage: true, lead: true }
  });
  if (!opportunity) throw new Error("Oportunidad no encontrada.");
  if (!canUseClient(user, opportunity.lead.clientId)) {
    throw new Error("Esta oportunidad no pertenece al cliente activo.");
  }
  if (!isAdmin(user) && !canUseCommercialRecord(user, opportunity.assignedUserId) && !canUseCommercialRecord(user, opportunity.lead.assignedUserId)) {
    throw new Error("Esta oportunidad pertenece a otro responsable comercial.");
  }

  if (isCommerciallyLockedOpportunity(opportunity)) {
    throw new Error("Esta oportunidad ya está cerrada o en operación. Ábrela desde Operación para continuar.");
  }

  await prisma.$transaction([
    prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        stageId,
        ...(stage.name === "Perdido" ? { operationalStatus: null, closedAt: new Date() } : {})
      }
    }),
    ...(stage.name === "Perdido"
      ? [
          prisma.lead.update({
            where: { id: opportunity.leadId },
            data: { status: "Perdido" }
          })
        ]
      : []),
    ...(stage.name === "Perdido"
      ? [
          prisma.quote.updateMany({
            where: {
              opportunityId,
              status: { in: ["Borrador", "Enviada"] }
            },
            data: { status: "Rechazada" }
          })
        ]
      : [])
  ]);

  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunityId,
    action: stage.name === "Perdido" ? "lost" : "stage_change",
    summary: `Oportunidad movida de ${opportunity.stage.name} a ${stage.name}`,
    metadata: { fromStage: opportunity.stage.name, toStage: stage.name }
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/cotizaciones");
  revalidatePath("/reportes");
  revalidatePath("/leads");
  revalidatePath(`/leads/${opportunity.leadId}`);
}
