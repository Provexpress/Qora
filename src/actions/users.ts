"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRoles } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { passwordResetSchema, userRoleSchema, userSchema } from "@/lib/validations";

export async function createUser(formData: FormData) {
  await assertRoles(["Administrador"]);
  const raw = Object.fromEntries(formData);
  const data = userSchema.parse(raw);
  const clientId = String(raw.clientId ?? "") || null;
  const returnTo = String(raw.returnTo ?? "/usuarios");

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      password: hashPassword(data.password),
      roleId: data.roleId,
      clientId
    }
  });

  revalidatePath("/usuarios");
  revalidatePath("/clientes");
  revalidatePath("/asignaciones");
  redirect(returnTo);
}

export async function updateUserRole(userId: string, formData: FormData) {
  await assertRoles(["Administrador"]);
  const data = userRoleSchema.parse(Object.fromEntries(formData));

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: data.roleId }
  });

  revalidatePath("/usuarios");
  revalidatePath("/asignaciones");
  redirect("/usuarios");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  await assertRoles(["Administrador"]);
  const data = passwordResetSchema.parse(Object.fromEntries(formData));

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashPassword(data.password) }
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}
