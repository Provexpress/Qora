import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BriefcaseBusiness, CalendarClock, ClipboardList, UserRoundPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { selectedClientId } from "@/lib/scopes";
import { formatCurrency, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const currentUser = await requireModuleAccess("asignaciones");
  const clientId = selectedClientId(currentUser);
  const users = await prisma.user.findMany({
    where: clientId ? { OR: [{ clientId }, { clientId: null }] } : {},
    orderBy: { name: "asc" },
    include: {
      role: true,
      leads: { where: clientId ? { clientId } : {}, take: 4, orderBy: { updatedAt: "desc" } },
      opportunities: { where: clientId ? { lead: { clientId } } : {}, take: 4, orderBy: { updatedAt: "desc" }, include: { lead: true, stage: true } },
      activities: { where: clientId ? { opportunity: { lead: { clientId } } } : {}, take: 5, orderBy: { activityDate: "asc" }, include: { opportunity: { include: { lead: true } } } }
    }
  });
  const totalLeads = users.reduce((sum, user) => sum + user.leads.length, 0);
  const totalOpportunities = users.reduce((sum, user) => sum + user.opportunities.length, 0);
  const totalActivities = users.reduce((sum, user) => sum + user.activities.length, 0);

  return (
    <AppShell title="Asignaciones" module="asignaciones">
      <PageTransition>
        <ModuleHero
          eyebrow="Responsabilidad por rol"
          title="Carga de trabajo visible para comercial, operación y administración."
          description="Esta vista ayuda a explicar cómo el CRM mantiene trazabilidad por responsable: leads, oportunidades y tareas asignadas."
          metrics={[
            { label: "Usuarios", value: String(users.length), helper: "Roles básicos" },
            { label: "Leads asignados", value: String(totalLeads), helper: "Muestra reciente" },
            { label: "Oportunidades", value: String(totalOpportunities), helper: "Por responsable" },
            { label: "Tareas", value: String(totalActivities), helper: "Pendientes y finalizadas" }
          ]}
        />
        <div className="grid gap-5">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{initials(user.name)}</div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.role.name} · {user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">{user.leads.length} leads</span>
                  <span className="rounded-full bg-muted px-3 py-1">{user.opportunities.length} oportunidades</span>
                  <span className="rounded-full bg-muted px-3 py-1">{user.activities.length} tareas</span>
                </div>
              </div>
              <div className="grid gap-5 p-5 xl:grid-cols-3">
                <AssignmentColumn title="Leads" icon={<UserRoundPlus className="h-4 w-4" />}>
                  {user.leads.map((lead) => (
                    <div key={lead.id} className="rounded-md border p-3">
                      <p className="text-sm font-medium">{lead.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{lead.eventType} · {lead.source}</p>
                    </div>
                  ))}
                </AssignmentColumn>
                <AssignmentColumn title="Oportunidades" icon={<BriefcaseBusiness className="h-4 w-4" />}>
                  {user.opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{opportunity.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{opportunity.lead.fullName}</p>
                        </div>
                        <StatusBadge value={opportunity.stage.name} />
                      </div>
                      <p className="mt-2 text-xs font-semibold">{formatCurrency(Number(opportunity.estimatedValue))}</p>
                    </div>
                  ))}
                </AssignmentColumn>
                <AssignmentColumn title="Tareas" icon={<ClipboardList className="h-4 w-4" />}>
                  {user.activities.map((activity) => (
                    <div key={activity.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{activity.opportunity.lead.fullName}</p>
                        </div>
                        <StatusBadge value={activity.status} />
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3" /> {format(activity.activityDate, "dd MMM p", { locale: es })}</p>
                    </div>
                  ))}
                </AssignmentColumn>
              </div>
            </Card>
          ))}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function AssignmentColumn({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-slate-50 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
