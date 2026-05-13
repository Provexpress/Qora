"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations";

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlug(base: string) {
  const clean = normalizeSlug(base) || "cliente";
  let slug = clean;
  let suffix = 2;

  while (await prisma.client.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${clean}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createClient(formData: FormData) {
  await assertRoles(["Administrador"]);
  const data = clientSchema.parse(Object.fromEntries(formData));
  const slug = await uniqueSlug(data.slug || data.name);

  await prisma.client.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
      status: data.status || "Activo"
    }
  });

  revalidatePath("/clientes");
  revalidatePath("/usuarios");
  redirect("/clientes");
}

export async function updateClientStatus(clientId: string, status: string) {
  await assertRoles(["Administrador"]);
  if (!["Activo", "Inactivo"].includes(status)) throw new Error("Estado invalido.");

  await prisma.client.update({
    where: { id: clientId },
    data: { status }
  });

  revalidatePath("/clientes");
  revalidatePath("/usuarios");
  redirect("/clientes");
}
