import Link from "next/link";
import { Calculator, CheckCircle2, Clock3, FileDown, Send, ShieldCheck, Tags, XCircle } from "lucide-react";
import { expireQuote, markQuoteAsWon, rejectQuote, sendQuote } from "@/actions/quotes";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeClientFilter, quoteScope, salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const currentUser = await requireModuleAccess("cotizaciones");
  const [quotes, opportunities, services] = await Promise.all([
    prisma.quote.findMany({
      where: quoteScope(currentUser),
      orderBy: { createdAt: "desc" },
      include: {
        opportunity: { include: { lead: true, stage: true } },
        items: true
      }
    }),
    prisma.opportunity.findMany({ where: { AND: [salesOpportunityScope(currentUser), { operationCode: null }] }, orderBy: { title: "asc" }, include: { lead: true } }),
    prisma.serviceItem.findMany({ where: { ...activeClientFilter(currentUser), active: true }, orderBy: { name: "asc" } })
  ]);
  const canManageCosts = currentUser?.role.name === "Administrador";
  const totalQuoted = quotes.reduce((sum, quote) => sum + Number(quote.total), 0);
  const averageMargin = quotes.length > 0 ? quotes.reduce((sum, quote) => sum + Number(quote.marginPercent), 0) / quotes.length : 0;
  const accepted = quotes.filter((quote) => quote.status === "Aceptada").length;

  return (
    <AppShell title="Cotizaciones" module="cotizaciones">
      <PageTransition>
        <ModuleHero
          eyebrow="Propuestas y cierre"
          title="Cotizaciones con estados reales: borrador, enviada, aceptada, rechazada y vencida."
          description="El comercial puede crear la propuesta, enviarla, abrir el PDF, aceptar el negocio y disparar automáticamente operación y alistamiento."
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Cotizaciones" value={String(quotes.length)} helper="Histórico actual" />
          <Kpi label="Valor cotizado" value={formatCurrency(totalQuoted)} helper="Total neto" />
          <Kpi label="Aceptadas" value={String(accepted)} helper="Ganadas" />
          <Kpi label="Margen prom." value={`${averageMargin.toFixed(1)}%`} helper="Venta menos costo" />
        </div>

        <Card className="mb-6 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MarginRule icon={<ShieldCheck className="h-4 w-4" />} title="Costo base" text="Lo administra el rol Administrador en Catálogo." />
            <MarginRule icon={<Tags className="h-4 w-4" />} title="Precio y descuento" text="Lo define Comercial al armar la propuesta." />
            <MarginRule icon={<Calculator className="h-4 w-4" />} title="Margen" text="Se calcula: utilidad / total neto. No se digita manualmente." />
          </div>
        </Card>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Propuestas comerciales</h2>
            <p className="text-sm text-muted-foreground">Crea, presenta, acepta, rechaza o vence propuestas sin salir del flujo CRM.</p>
          </div>
          <QuoteForm
            canManageCosts={canManageCosts}
            opportunities={opportunities.map((o) => ({ id: o.id, title: o.title, lead: { fullName: o.lead.fullName, eventType: o.lead.eventType } }))}
            services={services.map((s) => ({ id: s.id, name: s.name, category: s.category, price: Number(s.price), cost: Number(s.cost) }))}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {quotes.map((quote) => (
            <Card key={quote.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{quote.quoteNumber}</p>
                  <h2 className="mt-1 font-semibold">{quote.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.opportunity.lead.fullName} · {quote.opportunity.lead.eventType}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge value={quote.status} />
                  <span className="text-xs text-muted-foreground">{quote.opportunity.stage.name}</span>
                </div>
              </div>

              <QuoteProcess status={quote.status} />

              <div className="mt-5 rounded-lg border bg-slate-50 p-4">
                <div className="flex justify-between text-sm"><span>Subtotal</span><strong>{formatCurrency(Number(quote.subtotal))}</strong></div>
                <div className="mt-2 flex justify-between text-sm"><span>Costo estimado</span><strong>{formatCurrency(Number(quote.costSubtotal))}</strong></div>
                <div className="mt-2 flex justify-between text-sm"><span>Descuento</span><strong>{formatCurrency(Number(quote.discount))}</strong></div>
                <div className="mt-2 flex justify-between text-sm"><span>Utilidad</span><strong>{formatCurrency(Number(quote.profit))}</strong></div>
                <div className="mt-2 flex justify-between text-sm"><span>Margen</span><strong>{Number(quote.marginPercent).toFixed(1)}%</strong></div>
                <div className="mt-3 flex justify-between border-t pt-3 text-base"><span>Total</span><strong>{formatCurrency(Number(quote.total))}</strong></div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{quote.items.length} items cotizados</span>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cotizaciones/${quote.id}/pdf`} target="_blank"><FileDown className="h-4 w-4" /> PDF</Link>
                  </Button>
                  {quote.status === "Borrador" && (
                    <form action={sendQuote.bind(null, quote.id)}>
                      <SubmitButton size="sm" pendingText="Enviando..."><Send className="h-4 w-4" /> Enviar</SubmitButton>
                    </form>
                  )}
                  {(quote.status === "Borrador" || quote.status === "Enviada") && (
                    <form action={markQuoteAsWon.bind(null, quote.id)}>
                      <SubmitButton size="sm" pendingText="Aceptando..."><CheckCircle2 className="h-4 w-4" /> Aceptar y operar</SubmitButton>
                    </form>
                  )}
                  {quote.status === "Enviada" && (
                    <form action={expireQuote.bind(null, quote.id)}>
                      <SubmitButton size="sm" variant="outline" pendingText="Actualizando..."><Clock3 className="h-4 w-4" /> Vencer</SubmitButton>
                    </form>
                  )}
                  {(quote.status === "Borrador" || quote.status === "Enviada") && (
                    <form action={rejectQuote.bind(null, quote.id)}>
                      <SubmitButton size="sm" variant="outline" pendingText="Rechazando..."><XCircle className="h-4 w-4" /> Rechazar</SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function Kpi({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

function MarginRule({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-slate-50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function QuoteProcess({ status }: { status: string }) {
  const steps = ["Borrador", "Enviada", "Aceptada", "Operación"];
  const index = status === "Aceptada" ? 3 : Math.max(steps.indexOf(status), 0);
  const failed = status === "Rechazada" || status === "Vencida";

  return (
    <div className="mt-5 rounded-lg border bg-white p-3">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, stepIndex) => (
          <div key={step} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${!failed && stepIndex <= index ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {stepIndex + 1}
            </span>
            <span className={`truncate text-xs font-medium ${!failed && stepIndex <= index ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
          </div>
        ))}
      </div>
      {failed && <p className="mt-3 text-xs text-muted-foreground">Proceso detenido por estado: {status}.</p>}
    </div>
  );
}
