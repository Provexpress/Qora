import Link from "next/link";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, ArrowRight, CalendarClock, FileText, PhoneCall, Send, TrendingUp, UserRoundPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activityScope, quoteScope, salesLeadScope, salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommercialDeskPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const staleQuoteDate = subDays(now, 3);
  const currentUser = await requireModuleAccess("comercial");

  const [leads, opportunities, activities, quotes, overdueActivitiesCount, todayActivitiesCount, staleQuotesCount] = await Promise.all([
    prisma.lead.findMany({ where: salesLeadScope(currentUser), take: 6, orderBy: { createdAt: "desc" }, include: { assignedUser: true } }),
    prisma.opportunity.findMany({
      where: { AND: [salesOpportunityScope(currentUser), { operationCode: null }] },
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { lead: true, stage: true, assignedUser: true }
    }),
    prisma.activity.findMany({
      where: { AND: [activityScope(currentUser), { type: { not: "Operación" }, status: "Pendiente" }] },
      take: 8,
      orderBy: { activityDate: "asc" },
      include: { opportunity: { include: { lead: true } }, user: true }
    }),
    prisma.quote.findMany({
      where: { AND: [quoteScope(currentUser), { status: { in: ["Borrador", "Enviada"] } }] },
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { opportunity: { include: { lead: true } } }
    }),
    prisma.activity.count({
      where: { AND: [activityScope(currentUser), { type: { not: "Operación" }, status: "Pendiente", activityDate: { lt: now } }] }
    }),
    prisma.activity.count({
      where: { AND: [activityScope(currentUser), { type: { not: "Operación" }, status: "Pendiente", activityDate: { gte: todayStart, lte: todayEnd } }] }
    }),
    prisma.quote.count({
      where: { AND: [quoteScope(currentUser), { status: "Enviada", updatedAt: { lt: staleQuoteDate } }] }
    })
  ]);

  const pipelineValue = opportunities.reduce((sum, opportunity) => sum + Number(opportunity.estimatedValue), 0);

  return (
    <AppShell title="Mesa comercial" module="comercial">
      <PageTransition>
        <ModuleHero
          eyebrow="Rol comercial"
          title="Un workspace para vender: leads, acciones pendientes, pipeline y cotizaciones por cerrar."
          description="La mesa comercial reune lo que un asesor necesita para priorizar llamadas, propuestas y seguimiento sin saltar entre modulos."
          metrics={[
            { label: "Leads recientes", value: String(leads.length), helper: "Entrada comercial" },
            { label: "Oportunidades", value: String(opportunities.length), helper: "Abiertas" },
            { label: "Valor en gestion", value: formatCurrency(pipelineValue), helper: "Pipeline" },
            { label: "Cotizaciones vivas", value: String(quotes.length), helper: "Borrador o enviada" }
          ]}
        />
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tareas vencidas" value={String(overdueActivitiesCount)} helper="Requieren contacto" icon="todo" index={0} />
          <StatCard title="Tareas de hoy" value={String(todayActivitiesCount)} helper="Agenda comercial" icon="calendar" index={1} />
          <StatCard title="Valor en gestion" value={formatCurrency(pipelineValue)} helper="Pipeline comercial" icon="wallet" index={2} />
          <StatCard title="Cotizaciones frias" value={String(staleQuotesCount)} helper="Enviadas hace 3+ dias" icon="file" index={3} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Bandeja de atencion comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-slate-50 p-6 text-center text-sm text-muted-foreground">
                  No hay acciones comerciales pendientes.
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        {activity.activityDate < now && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        {activity.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.opportunity.lead.fullName} · {activity.user.name}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {format(activity.activityDate, "dd MMM p", { locale: es })}
                      </p>
                    </div>
                    <StatusBadge value={activity.activityDate < now ? "Vencida" : activity.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accesos de venta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <QuickLink href="/leads" icon={<UserRoundPlus className="h-4 w-4" />} title="Crear y calificar leads" />
              <QuickLink href="/pipeline" icon={<TrendingUp className="h-4 w-4" />} title="Mover oportunidades" />
              <QuickLink href="/cotizaciones" icon={<FileText className="h-4 w-4" />} title="Cotizar y presentar PDF" />
              <QuickLink href="/cotizaciones" icon={<Send className="h-4 w-4" />} title="Enviar o cerrar propuestas" />
              <QuickLink href="/agenda" icon={<PhoneCall className="h-4 w-4" />} title="Agendar seguimiento o reserva" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Oportunidades activas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {opportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{opportunity.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{opportunity.lead.fullName} · {opportunity.lead.eventType}</p>
                    </div>
                    <StatusBadge value={opportunity.stage.name} />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{formatCurrency(Number(opportunity.estimatedValue))}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cotizaciones por cerrar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {quotes.map((quote) => (
                <div key={quote.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{quote.quoteNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{quote.opportunity.lead.fullName}</p>
                    </div>
                    <StatusBadge value={quote.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{formatCurrency(Number(quote.total))}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}

function QuickLink({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Button asChild variant="outline" className="h-12 justify-between">
      <Link href={href}>
        <span className="flex items-center gap-2">{icon}{title}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
