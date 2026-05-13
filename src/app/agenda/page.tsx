import { AgendaWorkspace } from "@/components/agenda/agenda-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeClientFilter, activityScope, isAdmin, reservationScope, salesOpportunityScope } from "@/lib/scopes";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const currentUser = await requireModuleAccess("agenda");
  const [activities, reservations, opportunities, users, spaces] = await Promise.all([
    prisma.activity.findMany({
      where: activityScope(currentUser),
      orderBy: { activityDate: "asc" },
      include: { opportunity: { include: { lead: true } }, user: true }
    }),
    prisma.reservation.findMany({
      where: reservationScope(currentUser),
      orderBy: { reservationDate: "asc" },
      include: { opportunity: { include: { lead: true } }, space: true }
    }),
    prisma.opportunity.findMany({ where: salesOpportunityScope(currentUser), include: { lead: true }, orderBy: { title: "asc" } }),
    prisma.user.findMany({ where: isAdmin(currentUser) ? {} : { OR: [{ id: currentUser.id }, { role: { name: "Operativo" } }] }, orderBy: { name: "asc" } }),
    prisma.space.findMany({ where: { ...activeClientFilter(currentUser), active: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell title="Agenda / reservas tentativas" module="agenda">
      <PageTransition>
        <AgendaWorkspace
          activities={activities.map((activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            activityDate: activity.activityDate.toISOString(),
            type: activity.type,
            status: activity.status,
            user: { id: activity.user.id, name: activity.user.name },
            opportunity: {
              id: activity.opportunity.id,
              title: activity.opportunity.title,
              lead: {
                fullName: activity.opportunity.lead.fullName,
                eventType: activity.opportunity.lead.eventType
              }
            }
          }))}
          reservations={reservations.map((reservation) => ({
            id: reservation.id,
            reservationDate: reservation.reservationDate.toISOString(),
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            status: reservation.status,
            notes: reservation.notes,
            spaceId: reservation.spaceId,
            space: reservation.space ? { id: reservation.space.id, name: reservation.space.name, capacity: reservation.space.capacity } : null,
            opportunity: {
              id: reservation.opportunity.id,
              title: reservation.opportunity.title,
              lead: {
                fullName: reservation.opportunity.lead.fullName,
                eventType: reservation.opportunity.lead.eventType,
                peopleCount: reservation.opportunity.lead.peopleCount
              }
            }
          }))}
          opportunities={opportunities.map((opportunity) => ({
            id: opportunity.id,
            title: opportunity.title,
            leadName: opportunity.lead.fullName,
            eventType: opportunity.lead.eventType
          }))}
          users={users.map((user) => ({ id: user.id, name: user.name }))}
          spaces={spaces.map((space) => ({ id: space.id, name: space.name, capacity: space.capacity }))}
        />
      </PageTransition>
    </AppShell>
  );
}
