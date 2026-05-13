import { BadgePercent, CircleDollarSign, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteScope, salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FinancialPage() {
  const currentUser = await requireModuleAccess("financiero");
  const [quotes, wonQuotes, wonOpportunities] = await Promise.all([
    prisma.quote.findMany({
      where: quoteScope(currentUser),
      orderBy: { createdAt: "desc" },
      include: { opportunity: { include: { lead: true } } }
    }),
    prisma.quote.findMany({
      where: { AND: [quoteScope(currentUser), { status: "Aceptada" }] },
      include: { opportunity: { include: { lead: true } } }
    }),
    prisma.opportunity.findMany({
      where: { AND: [salesOpportunityScope(currentUser), { operationCode: { not: null } }] },
      orderBy: { wonAt: "desc" },
      include: { lead: true, stage: true }
    })
  ]);

  const totalQuoted = quotes.reduce((sum, quote) => sum + Number(quote.total), 0);
  const totalCosts = quotes.reduce((sum, quote) => sum + Number(quote.costSubtotal), 0);
  const totalProfit = quotes.reduce((sum, quote) => sum + Number(quote.profit), 0);
  const weightedMargin = totalQuoted > 0 ? (totalProfit / totalQuoted) * 100 : 0;
  const wonRevenue = wonQuotes.reduce((sum, quote) => sum + Number(quote.total), 0);
  const wonProfit = wonQuotes.reduce((sum, quote) => sum + Number(quote.profit), 0);
  const wonMargin = wonRevenue > 0 ? (wonProfit / wonRevenue) * 100 : 0;

  return (
    <AppShell title="Tablero financiero" module="financiero">
      <PageTransition>
        <ModuleHero
          eyebrow="Control financiero comercial"
          title="Venta, costo, utilidad y margen conectados al flujo de cotización y operación."
          description="Este tablero permite explicar la rentabilidad de cada propuesta y distinguir valor cotizado, valor ganado y eventos enviados a operación."
          metrics={[
            { label: "Venta ganada", value: formatCurrency(wonRevenue), helper: "Cotizaciones aceptadas" },
            { label: "Utilidad ganada", value: formatCurrency(wonProfit), helper: `${wonMargin.toFixed(1)}% margen` },
            { label: "Cotizaciones", value: String(quotes.length), helper: "Histórico actual" },
            { label: "Eventos operativos", value: String(wonOpportunities.length), helper: "Con código generado" }
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Venta cotizada" value={formatCurrency(totalQuoted)} helper="Total de cotizaciones" icon="wallet" index={0} />
          <StatCard title="Costo estimado" value={formatCurrency(totalCosts)} helper="Base operativa estimada" icon="file" index={1} />
          <StatCard title="Utilidad proyectada" value={formatCurrency(totalProfit)} helper="Venta menos costos" icon="trending" index={2} />
          <StatCard title="Margen promedio" value={`${weightedMargin.toFixed(1)}%`} helper="Sobre venta neta" icon="todo" index={3} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Cotizaciones y margen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotes.map((quote) => (
                <div key={quote.id} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_120px_120px_90px] md:items-center">
                  <div>
                    <p className="font-medium">{quote.quoteNumber} · {quote.title}</p>
                    <p className="text-sm text-muted-foreground">{quote.opportunity.lead.fullName} · {quote.opportunity.lead.eventType}</p>
                  </div>
                  <div className="text-sm"><p className="text-muted-foreground">Venta</p><p className="font-semibold">{formatCurrency(Number(quote.total))}</p></div>
                  <div className="text-sm"><p className="text-muted-foreground">Utilidad</p><p className="font-semibold">{formatCurrency(Number(quote.profit))}</p></div>
                  <div className="text-right"><StatusBadge value={quote.status} /><p className="mt-1 text-sm font-semibold">{Number(quote.marginPercent).toFixed(1)}%</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 text-primary" />
                <div><p className="text-sm text-muted-foreground">Venta ganada</p><p className="text-2xl font-semibold">{formatCurrency(wonRevenue)}</p></div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <BadgePercent className="h-5 w-5 text-primary" />
                <div><p className="text-sm text-muted-foreground">Utilidad ganada</p><p className="text-2xl font-semibold">{formatCurrency(wonProfit)}</p></div>
              </div>
            </Card>
            <Card>
              <CardHeader><CardTitle>Eventos enviados a operación</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {wonOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{opportunity.operationCode}</p>
                      <ReceiptText className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{opportunity.title} · {opportunity.lead.fullName}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{opportunity.operationalStatus ?? "Pendiente de planeación"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
