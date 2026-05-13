import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";

export function isAdmin(user: AuthUser | null | undefined) {
  return user?.role.name === "Administrador";
}

export function isCommercial(user: AuthUser | null | undefined) {
  return user?.role.name === "Comercial";
}

export function isOperational(user: AuthUser | null | undefined) {
  return user?.role.name === "Operativo";
}

export function selectedClientId(user: AuthUser) {
  return isAdmin(user) ? user.activeClient?.id ?? null : user.clientId;
}

export function activeClientFilter(user: AuthUser): { clientId?: string | null } {
  const clientId = selectedClientId(user);
  return clientId ? { clientId } : {};
}

export function salesLeadScope(user: AuthUser): Prisma.LeadWhereInput {
  const clientId = selectedClientId(user);
  const clientFilter = clientId ? { clientId } : {};

  if (isAdmin(user)) return clientFilter;
  if (isCommercial(user)) {
    return { AND: [clientFilter, { OR: [{ assignedUserId: user.id }, { assignedUserId: null }] }] };
  }

  return { id: "__no_leads_for_role__" };
}

export function salesOpportunityScope(user: AuthUser): Prisma.OpportunityWhereInput {
  const clientId = selectedClientId(user);
  const clientFilter = clientId ? { lead: { clientId } } : {};

  if (isAdmin(user)) return clientFilter;
  if (isCommercial(user)) {
    return {
      AND: [
        clientFilter,
        {
          OR: [
            { assignedUserId: user.id },
            { assignedUserId: null },
            { lead: { assignedUserId: user.id } },
            { lead: { assignedUserId: null } }
          ]
        }
      ]
    };
  }
  if (isOperational(user)) {
    return { AND: [clientFilter, { operationCode: { not: null } }] };
  }

  return { id: "__no_opportunities_for_role__" };
}

export function quoteScope(user: AuthUser): Prisma.QuoteWhereInput {
  return { opportunity: salesOpportunityScope(user) };
}

export function activityScope(user: AuthUser): Prisma.ActivityWhereInput {
  if (isAdmin(user)) return { opportunity: salesOpportunityScope(user) };
  if (isCommercial(user)) return { opportunity: salesOpportunityScope(user), type: { not: "Operación" } };
  if (isOperational(user)) return { opportunity: salesOpportunityScope(user) };
  return { id: "__no_activities_for_role__" };
}

export function reservationScope(user: AuthUser): Prisma.ReservationWhereInput {
  return { opportunity: salesOpportunityScope(user) };
}

export function canUseCommercialRecord(user: AuthUser, assignedUserId?: string | null) {
  return isAdmin(user) || !assignedUserId || assignedUserId === user.id;
}

export function canUseClient(user: AuthUser, clientId?: string | null) {
  if (isAdmin(user)) return !user.activeClient?.id || user.activeClient.id === clientId;
  return Boolean(clientId && user.clientId === clientId);
}
