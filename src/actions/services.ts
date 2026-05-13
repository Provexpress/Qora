"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseClient, selectedClientId } from "@/lib/scopes";
import { serviceSchema } from "@/lib/validations";

export async function createService(formData: FormData) {
  const user = await assertRoles(["Administrador"]);
  const raw = Object.fromEntries(formData);
  const data = serviceSchema.parse({ ...raw, active: raw.active === "on" || raw.active === "true" });
  const clientId = selectedClientId(user);
  if (!clientId) throw new Error("Selecciona un cliente antes de crear servicios.");
  await prisma.serviceItem.create({ data: { ...data, clientId } });
  revalidatePath("/catalogo");
  redirect("/catalogo");
}

export async function updateService(id: string, formData: FormData) {
  const user = await assertRoles(["Administrador"]);
  const raw = Object.fromEntries(formData);
  const data = serviceSchema.parse({ ...raw, active: raw.active === "on" || raw.active === "true" });
  const current = await prisma.serviceItem.findUnique({ where: { id }, select: { clientId: true } });
  if (!current || !canUseClient(user, current.clientId)) throw new Error("Servicio no disponible para el cliente activo.");
  await prisma.serviceItem.update({ where: { id }, data });
  revalidatePath("/catalogo");
  redirect("/catalogo");
}

export async function toggleService(id: string, active: boolean) {
  const user = await assertRoles(["Administrador"]);
  const current = await prisma.serviceItem.findUnique({ where: { id }, select: { clientId: true } });
  if (!current || !canUseClient(user, current.clientId)) throw new Error("Servicio no disponible para el cliente activo.");
  await prisma.serviceItem.update({ where: { id }, data: { active } });
  revalidatePath("/catalogo");
  redirect("/catalogo");
}
