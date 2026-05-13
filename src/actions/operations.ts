"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function updateOperationalStatus(formData: FormData) {
  const user = await assertRoles(["Administrador", "Operativo"]);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const operationalStatus = String(formData.get("operationalStatus") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");

  if (!opportunityId || !operationalStatus) {
    throw new Error("Datos operativos incompletos.");
  }

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { operationalStatus }
  });

  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunityId,
    action: "operational_status",
    summary: `Estado operativo actualizado a ${operationalStatus}`
  });
  revalidateOperationViews();
  redirect(safeReturnTo(returnTo));
}

export async function completeOperationalTask(activityId: string, formData?: FormData) {
  const user = await assertRoles(["Administrador", "Operativo"]);
  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: { status: "Finalizada" }
  });

  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: activity.opportunityId,
    action: "complete_task",
    summary: `Tarea operativa completada: ${activity.title}`
  });
  revalidateOperationViews();
  redirect(safeReturnTo(formData ? String(formData.get("returnTo") ?? "") : ""));
}

export async function createOperationalTask(formData: FormData) {
  const user = await assertRoles(["Administrador", "Operativo"]);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "");
  const activityDate = String(formData.get("activityDate") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");

  if (!opportunityId || !userId || !title || !activityDate) {
    throw new Error("Faltan datos para crear la tarea operativa.");
  }

  const activity = await prisma.activity.create({
    data: {
      opportunityId,
      userId,
      title,
      description: String(formData.get("description") ?? "") || null,
      activityDate: new Date(activityDate),
      type: "Operación",
      status: "Pendiente"
    }
  });

  await recordAudit({
    userId: user.id,
    entityType: "Opportunity",
    entityId: opportunityId,
    action: "create_task",
    summary: `Tarea operativa creada: ${activity.title}`
  });
  revalidateOperationViews();
  redirect(safeReturnTo(returnTo));
}

function revalidateOperationViews() {
  revalidatePath("/operacion");
  revalidatePath("/operacion/[id]", "page");
  revalidatePath("/asignaciones");
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
}

function safeReturnTo(value?: string) {
  if (value?.startsWith("/operacion")) return value;
  if (value?.startsWith("/alistamiento")) return value;
  return "/operacion";
}
