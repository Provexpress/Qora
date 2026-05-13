import { ArrowRight, CheckCircle2, ClipboardList, FileText, KanbanSquare, UserRoundPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activityScope, quoteScope, reservationScope, salesLeadScope, salesOpportunityScope } from "@/lib/scopes";
import { closedLeadStatuses } from "@/lib/status";
import { vocabularyForTenant } from "@/lib/tenant-copy";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await requireModuleAccess("dashboard");
  const vocabulary = vocabularyForTenant(currentUser.activeClient?.slug);
  const processSteps = [
    { label: "Lead", helper: "Captura y calificacion", icon: UserRoundPlus },
    { label: "Pipeline", helper: "Seguimiento comercial", icon: KanbanSquare },
    { label: "Cotizacion", helper: "PDF y aprobacion", icon: FileText },
    { label: vocabulary.postSaleLabel, helper: "Codigo y checklist", icon: ClipboardList },
    { label: "Cierre", helper: "Ejecucion y utilidad", icon: CheckCircle2 }
  ];
  const opportunityScope = salesOpportunityScope(currentUser);

  const [leadCount, activeOpps, sentQuotes, tentativeReservations, pendingActivities, operationCount, opportunities, activities, quotes, stages] = await Promise.all([
    prisma.lead.count({ where: { AND: [salesLeadScope(currentUser), { status: { notIn: [...closedLeadStatuses] } }] } }),
    prisma.opportunity.count({ where: { AND: [opportunityScope, { closedAt: null, operationCode: null, stage: { name: { notIn: ["Confirmado", "Perdido", "Ganado / Operación"] } } }] } }),
    prisma.quote.count({ where: { AND: [quoteScope(currentUser), { status: "Enviada" }] } }),
    prisma.reservation.count({ where: { AND: [reservationScope(currentUser), { status: "Pendiente" }] } }),
    prisma.activity.count({ where: { AND: [activityScope(currentUser), { status: "Pendiente" }] } }),
    prisma.opportunity.count({ where: { AND: [opportunityScope, { operationCode: { not: null } }] } }),
    prisma.opportunity.findMany({ where: opportunityScope, take: 5, orderBy: { updatedAt: "desc" }, include: { lead: true, stage: true, assignedUser: true } }),
    prisma.activity.findMany({ where: activityScope(currentUser), take: 5, orderBy: { activityDate: "asc" }, include: { opportunity: { include: { lead: true } }, user: true } }),
    prisma.quote.findMany({ where: quoteScope(currentUser), take: 5, orderBy: { createdAt: "desc" }, include: { opportunity: { include: { lead: true } } } }),
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { opportunities: { where: opportunityScope } } } } })
  ]);
  const pipelineValue = opportunities.reduce((sum, item) => sum + Number(item.estimatedValue), 0);

  return (
    <AppShell title="Dashboard" module="dashboard">
      <PageTransition>
        <section className="mb-6 overflow-hidden rounded-lg border bg-white/95 p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 h-1 w-16 rounded-full bg-primary/70" />
              <p className="text-xs font-semibold uppercase text-primary">Proceso comercial {currentUser.activeClient?.name ?? "Qora"}</p>
              <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-normal">{vocabulary.dashboardTitle}</h2>
            </div>
            <div className="rounded-lg border bg-slate-50 px-4 py-3">
              <p className="text-xs text-muted-foreground">{vocabulary.dashboardMetric}</p>
              <p className="mt-1 text-2xl font-semibold">{operationCount}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {processSteps.map((step, index) => (
              <div key={step.label} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <step.icon className="h-5 w-5 text-primary" />
                  {index < processSteps.length - 1 && <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />}
                </div>
                <p className="mt-4 font-semibold">{step.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.helper}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Leads activos" value={String(leadCount)} helper="Cartera visible para tu rol" icon="users" index={0} />
          <StatCard title="Oportunidades activas" value={String(activeOpps)} helper="Negocios en gestion" icon="trending" index={1} />
          <StatCard title="Cotizaciones enviadas" value={String(sentQuotes)} helper="Pendientes de respuesta" icon="file" index={2} />
          <StatCard title={vocabulary.isEventTenant ? "Reservas tentativas" : "Agendas comerciales"} value={String(tentativeReservations)} helper={vocabulary.isEventTenant ? "Bloqueos pendientes" : "Confirmaciones pendientes"} icon="calendar" index={3} />
          <StatCard title="Valor estimado" value={formatCurrency(pipelineValue)} helper="Ultimas oportunidades visibles" icon="wallet" index={4} />
          <StatCard title="Actividades pendientes" value={String(pendingActivities)} helper="Seguimiento segun rol" icon="todo" index={5} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader><CardTitle>Oportunidades recientes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {opportunities.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border bg-white p-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.lead.fullName} · {item.stage.name}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(Number(item.estimatedValue))}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resumen por etapa</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm">{stage.name}</span>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{stage._count.opportunities}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Proximas actividades</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activities.map((item) => (
                <div key={item.id} className="rounded-md border bg-white p-3">
                  <div className="flex justify-between gap-3"><p className="font-medium">{item.title}</p><StatusBadge value={item.status} /></div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.opportunity.lead.fullName} · {item.user.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cotizaciones recientes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {quotes.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border bg-white p-3">
                  <div>
                    <p className="font-medium">{item.quoteNumber}</p>
                    <p className="text-sm text-muted-foreground">{item.opportunity.lead.fullName}</p>
                  </div>
                  <div className="text-right"><StatusBadge value={item.status} /><p className="mt-1 text-sm font-semibold">{formatCurrency(Number(item.total))}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}
