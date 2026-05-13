import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/quotes/print-button";
import { Button } from "@/components/ui/button";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteScope } from "@/lib/scopes";
import { quotePresentationForTenant } from "@/lib/tenant-copy";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuotePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireModuleAccess("cotizaciones");
  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { AND: [{ id }, quoteScope(currentUser)] },
    include: {
      opportunity: {
        include: {
          lead: { include: { client: true } },
          assignedUser: true,
          reservations: { include: { space: true }, orderBy: { reservationDate: "asc" } }
        }
      },
      items: { include: { serviceItem: true }, orderBy: { description: "asc" } }
    }
  });

  if (!quote) {
    notFound();
  }

  const lead = quote.opportunity.lead;
  const clientName = lead.client?.name ?? currentUser.activeClient?.name ?? "Qora CRM";
  const clientInitials = clientName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const copy = quotePresentationForTenant(lead.client?.slug ?? currentUser.activeClient?.slug);
  const reservation = quote.opportunity.reservations[0];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between print:hidden">
        <Button asChild variant="outline">
          <Link href="/cotizaciones"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        </Button>
        <PrintButton />
      </div>

      <section className="mx-auto max-w-5xl rounded-lg bg-white p-10 shadow-soft print:rounded-none print:p-8 print:shadow-none">
        <header className="grid gap-8 border-b pb-8 md:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">{clientInitials}</div>
              <div>
                <p className="text-xl font-semibold">{clientName}</p>
                <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
              </div>
            </div>
            <h1 className="mt-8 text-3xl font-semibold tracking-normal">{quote.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {copy.intro(lead.eventType)}
            </p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Numero</p>
            <p className="mt-1 text-2xl font-semibold">{quote.quoteNumber}</p>
            <div className="mt-5 grid gap-3 text-sm">
              <p className="flex justify-between"><span>Documento</span><strong>Cliente</strong></p>
              <p className="flex justify-between"><span>Estado</span><strong>{quote.status}</strong></p>
              <p className="flex justify-between"><span>Creada</span><strong>{format(quote.createdAt, "dd MMM yyyy", { locale: es })}</strong></p>
              <p className="flex justify-between"><span>Valida hasta</span><strong>{format(quote.validUntil, "dd MMM yyyy", { locale: es })}</strong></p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 border-b py-8 md:grid-cols-3">
          <InfoBlock title="Cliente" lines={[lead.fullName, lead.email, lead.phone]} />
          <InfoBlock title={copy.contextTitle} lines={[lead.eventType, copy.peopleLabel(lead.peopleCount), lead.estimatedDate ? format(lead.estimatedDate, "PPP", { locale: es }) : "Fecha por definir"]} />
          <InfoBlock title={copy.operationTitle} lines={[reservation?.space?.name ?? copy.operationLines.locationFallback, reservation ? `${reservation.startTime} - ${reservation.endTime}` : copy.operationLines.scheduleFallback, quote.opportunity.assignedUser?.name ?? "Comercial por asignar"]} />
        </section>

        <section className="py-8">
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_80px_140px_140px] bg-primary px-4 py-3 text-sm font-semibold text-white">
              <span>Servicio</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">Valor unit.</span>
              <span className="text-right">Total</span>
            </div>
            <div className="divide-y">
              {quote.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_140px_140px] px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {item.serviceItem?.category && <p className="text-xs text-muted-foreground">{item.serviceItem.category}</p>}
                  </div>
                  <span className="text-right">{item.quantity}</span>
                  <span className="text-right">{formatCurrency(Number(item.unitPrice))}</span>
                  <span className="text-right font-medium">{formatCurrency(Number(item.total))}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="rounded-lg border bg-slate-50 p-5">
            <p className="font-semibold">Notas comerciales</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {quote.notes || "Valores sujetos a disponibilidad, validacion final de alcance y condiciones acordadas con el cliente."}
            </p>
          </div>
          <div className="rounded-lg border p-5">
            <p className="flex justify-between text-sm"><span>Subtotal</span><strong>{formatCurrency(Number(quote.subtotal))}</strong></p>
            <p className="mt-3 flex justify-between text-sm"><span>Descuento</span><strong>{formatCurrency(Number(quote.discount))}</strong></p>
            <p className="mt-4 flex justify-between border-t pt-4 text-xl"><span>Total</span><strong>{formatCurrency(Number(quote.total))}</strong></p>
          </div>
        </section>

        <footer className="mt-10 border-t pt-6 text-xs leading-5 text-muted-foreground">
          {copy.footer}
        </footer>
      </section>
    </main>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1 text-sm">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </div>
  );
}
