import { subDays } from "date-fns";
import { BarChart3, CalendarCheck, CircleDollarSign, Percent, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activityScope, quoteScope, reservationScope, salesLeadScope, salesOpportunityScope } from "@/lib/scopes";
import { closedLeadStatuses } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();
  const staleQuoteDate = subDays(now, 3);
  const currentUser = await requireModuleAccess("reportes");

  const [stages, quotes, reservations, activities, leads, leadsWithoutOpportunity, eventsWithoutPlan] = await Promise.all([
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { opportunities: { where: salesOpportunityScope(currentUser) } } } } }),
    prisma.quote.findMany({ where: quoteScope(currentUser), orderBy: { createdAt: "desc" }, include: { opportunity: { include: { lead: true } } } }),
    prisma.reservation.findMany({ where: reservationScope(currentUser), include: { space: true, opportunity: { include: { lead: true } } }, orderBy: { reservationDate: "asc" } }),
    prisma.activity.findMany({ where: activityScope(currentUser), include: { user: true, opportunity: { include: { lead: true } } }, orderBy: { activityDate: "asc" } }),
    prisma.lead.findMany({ where: salesLeadScope(currentUser) }),
    prisma.lead.count({
      where: { AND: [salesLeadScope(currentUser), { status: { notIn: [...closedLeadStatuses] }, opportunities: { none: {} } }] }
    }),
    prisma.opportunity.count({
      where: {
        AND: [
          salesOpportunityScope(currentUser),
          {
            operationCode: { not: null },
            closedAt: null,
            OR: [{ purchaseTasks: { none: {} } }, { scheduleItems: { none: {} } }]
          }
        ]
      }
    })
  ]);

  const totalSales = quotes.reduce((sum, quote) => sum + Number(quote.total), 0);
  const totalProfit = quotes.reduce((sum, quote) => sum + Number(quote.profit), 0);
  const acceptedQuotes = quotes.filter((quote) => quote.status === "Aceptada");
  const conversion = leads.length > 0 ? (acceptedQuotes.length / leads.length) * 100 : 0;
  const averageMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const pendingActivities = activities.filter((activity) => activity.status === "Pendiente").length;
  const overdueActivities = activities.filter((activity) => activity.status === "Pendiente" && activity.activityDate < now).length;
  const staleSentQuotes = quotes.filter((quote) => quote.status === "Enviada" && quote.updatedAt < staleQuoteDate).length;
  const confirmedReservations = reservations.filter((reservation) => reservation.status === "Confirmada").length;
  const maxStageCount = Math.max(...stages.map((stage) => stage._count.opportunities), 1);
  const sourceRows = groupCount(leads.map((lead) => lead.source));
  const eventRows = groupCount(leads.map((lead) => lead.eventType));
  const quoteStatusRows = groupCount(quotes.map((quote) => quote.status));
  const reservationStatusRows = groupCount(reservations.map((reservation) => reservation.status));

  return (
    <AppShell title="Reportes" module="reportes">
      <PageTransition>
        <ModuleHero
          eyebrow="Analítica CRM"
          title="Reportes ejecutivos para leer embudo, conversión, rentabilidad y agenda."
          description="Una vista de control para entender de dónde vienen los leads, qué tan sano está el pipeline y qué volumen operativo está generando el equipo comercial."
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Conversión comercial" value={`${conversion.toFixed(1)}%`} helper={`${acceptedQuotes.length} aceptadas / ${leads.length} leads`} />
          <KpiCard icon={<CircleDollarSign className="h-5 w-5" />} label="Venta cotizada" value={formatCurrency(totalSales)} helper={`${quotes.length} cotizaciones`} />
          <KpiCard icon={<Percent className="h-5 w-5" />} label="Margen promedio" value={`${averageMargin.toFixed(1)}%`} helper={formatCurrency(totalProfit)} />
          <KpiCard icon={<CalendarCheck className="h-5 w-5" />} label="Reservas confirmadas" value={String(confirmedReservations)} helper={`${reservations.length} reservas totales`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Embudo comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.map((stage) => (
                <div key={stage.id} className="grid gap-3 md:grid-cols-[170px_1fr_44px] md:items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div className="h-3 rounded-full" style={{ width: `${(stage._count.opportunities / maxStageCount) * 100}%`, backgroundColor: stage.color }} />
                  </div>
                  <span className="text-right text-sm font-semibold">{stage._count.opportunities}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salud del CRM</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <HealthRow label="Actividades vencidas" value={String(overdueActivities)} helper="Seguimiento fuera de fecha" />
              <HealthRow label="Cotizaciones sin respuesta" value={String(staleSentQuotes)} helper="Enviadas hace 3+ dias" />
              <HealthRow label="Eventos sin alistamiento" value={String(eventsWithoutPlan)} helper="Compras o cronograma pendientes" />
              <HealthRow label="Leads sin oportunidad" value={String(leadsWithoutOpportunity)} helper="Requieren calificacion" />
              <HealthRow label="Actividades pendientes" value={String(pendingActivities)} helper="Seguimiento por ejecutar" />
              <HealthRow label="Cotizaciones aceptadas" value={String(acceptedQuotes.length)} helper="Enviadas a operación" />
              <HealthRow label="Reservas en agenda" value={String(reservations.length)} helper={`${confirmedReservations} confirmadas`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Origen de leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sourceRows.map((row) => <DistributionRow key={row.label} row={row} max={Math.max(...sourceRows.map((item) => item.count), 1)} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventRows.map((row) => <DistributionRow key={row.label} row={row} max={Math.max(...eventRows.map((item) => item.count), 1)} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de cotizaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quoteStatusRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border bg-white p-4">
                  <StatusBadge value={row.label} />
                  <span className="text-xl font-semibold">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de reservas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservationStatusRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border bg-white p-4">
                  <StatusBadge value={row.label} />
                  <span className="text-xl font-semibold">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Cotizaciones recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotes.slice(0, 8).map((quote) => (
                <div key={quote.id} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_140px_140px_110px] md:items-center">
                  <div>
                    <p className="font-medium">{quote.quoteNumber} · {quote.opportunity.lead.fullName}</p>
                    <p className="text-sm text-muted-foreground">{quote.opportunity.lead.eventType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Venta</p>
                    <p className="font-semibold">{formatCurrency(Number(quote.total))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Utilidad</p>
                    <p className="font-semibold">{formatCurrency(Number(quote.profit))}</p>
                  </div>
                  <StatusBadge value={quote.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}

function KpiCard({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-lg border border-primary/10 bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </Card>
  );
}

function HealthRow({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className="text-2xl font-semibold">{value}</span>
      </div>
    </div>
  );
}

function DistributionRow({ row, max }: { row: { label: string; count: number }; max: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{row.label}</span>
        <span className="text-muted-foreground">{row.count}</span>
      </div>
      <div className="h-3 rounded-full bg-muted">
        <div className="h-3 rounded-full bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
      </div>
    </div>
  );
}

function groupCount(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
