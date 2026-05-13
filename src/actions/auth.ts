"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultPathForRole } from "@/lib/permissions";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientCookieName, roleCookieName, sessionCookieName } from "@/lib/session";

const maxAge = 60 * 60 * 8;

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, client: true }
  });

  if (!user || !verifyPassword(password, user.password)) {
    redirect("/login?error=credenciales");
  }

  if (user.password && !user.password.startsWith("scrypt$")) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(password) }
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/"
  });
  cookieStore.set(roleCookieName, user.role.name, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/"
  });
  const activeClient = user.role.name === "Administrador"
    ? await prisma.client.findFirst({ where: { status: "Activo" }, orderBy: { name: "asc" } })
    : user.client;

  if (activeClient) {
    cookieStore.set(clientCookieName, activeClient.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge,
      path: "/"
    });
  } else {
    cookieStore.delete(clientCookieName);
  }

  redirect(getDefaultPathForRole(user.role.name));
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  cookieStore.delete(roleCookieName);
  cookieStore.delete(clientCookieName);
  redirect("/login");
}

export async function setActiveClient(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const clientId = String(formData.get("clientId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/clientes");

  if (!userId || !clientId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user || user.role.name !== "Administrador") redirect("/login");

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || client.status !== "Activo") throw new Error("Cliente no disponible.");

  cookieStore.set(clientCookieName, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/"
  });

  redirect(returnTo);
}
