import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppModule, canAccessModule, getDefaultPathForRole, KnownRole } from "@/lib/permissions";
import { clientCookieName, sessionCookieName } from "@/lib/session";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  clientId: string | null;
  client: {
    id: string;
    name: string;
    slug: string;
  } | null;
  activeClient: {
    id: string;
    name: string;
    slug: string;
  } | null;
  availableClients: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const activeClientCookie = cookieStore.get(clientCookieName)?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, client: true }
  });

  if (!user) {
    return null;
  }

  const isAdmin = user.role.name === "Administrador";
  const availableClients = isAdmin
    ? await prisma.client.findMany({ where: { status: "Activo" }, orderBy: { name: "asc" } })
    : user.client
      ? [user.client]
      : [];
  const activeClient = isAdmin
    ? availableClients.find((client) => client.id === activeClientCookie) ?? availableClients[0] ?? null
    : user.client ?? null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name
    },
    clientId: user.clientId,
    client: user.client ? { id: user.client.id, name: user.client.name, slug: user.client.slug } : null,
    activeClient: activeClient ? { id: activeClient.id, name: activeClient.name, slug: activeClient.slug } : null,
    availableClients: availableClients.map((client) => ({ id: client.id, name: client.name, slug: client.slug }))
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireModuleAccess(module: AppModule) {
  const user = await requireAuth();

  if (!canAccessModule(user.role.name, module)) {
    redirect(getDefaultPathForRole(user.role.name));
  }

  return user;
}

export async function assertRoles(roles: readonly KnownRole[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role.name as KnownRole)) {
    throw new Error("No tienes permisos para ejecutar esta acción.");
  }

  return user;
}

export async function assertModuleAccess(module: AppModule) {
  const user = await requireAuth();

  if (!canAccessModule(user.role.name, module)) {
    throw new Error("No tienes permisos para ejecutar esta acción.");
  }

  return user;
}
