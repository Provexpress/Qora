import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarClock, ClipboardList, FileDown, KanbanSquare, Mail, MessageSquare, Phone, UserRound } from "lucide-react";
import { createLeadNote } from "@/actions/notes";
import { StatusBadge } from "@/components/crm/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseClient, canUseCommercialRecord, isAdmin } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await requireModuleAccess("leads");
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedUser: true,
      timelineNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      opportunities: {
        orderBy: { updatedAt: "desc" },
        include: {
          stage: true,
          assignedUser: true,
          quotes: { orderBy: { createdAt: "desc" } },
          reservations: { include: { space: true }, orderBy: { reservationDate: "asc" } },
          activities: { include: { user: true }, orderBy: { activityDate: "desc" } },
          timelineNotes: { include: { author: true }, orderBy: { createdAt: "desc" } }
        }
      }
    }
  });

  if (!lead) notFound();
  if (!canUseClient(currentUser, lead.clientId)) notFound();
  if (!isAdmin(currentUser) && !canUseCommercialRecord(currentUser, lead.assignedUserId)) notFound();

  const quotes = lead.opportunities.flatMap((opportunity) =>
    opportunity.quotes.map((quote) => ({ ...quote, opportunityTitle: opportunity.title }))
  );
  const activities = lead.opportunities.flatMap((opportunity) =>
    opportunity.activities.map((activity) => ({ ...activity, opportunityTitle: opportunity.title }))
  );
  const reservations = lead.opportunities.flatMap((opportunity) =>
    opportunity.reservations.map((reservation) => ({ ...reservation, opportunityTitle: opportunity.title }))
  );
  const pipelineValue = lead.opportunities.reduce((sum, opportunity) => sum + Number(opportunity.estimatedValue), 0);
  const acceptedValue = quotes.filter((quote) => quote.status === "Aceptada").reduce((sum, quote) => sum + Number(quote.total), 0);
  const pendingActivities = activities.filter((activity) => activity.status === "Pendiente").length;
  const manualNotes = [
    ...lead.timelineNotes.map((note) => ({ ...note, context: "Cliente" })),
    ...lead.opportunities.flatMap((opportunity) => opportunity.timelineNotes.map((note) => ({ ...note, context: opportunity.title })))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const audits = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "Lead", entityId: lead.id },
        { entityType: "Opportunity", entityId: { in: lead.opportunities.map((opportunity) => opportunity.id) } },
        { entityType: "Quote", entityId: { in: quotes.map((quote) => quote.id) } }
      ]
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <AppShell title="Ficha del cliente" module="leads">
      <PageTransition>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button asChild variant="outline">
            <Link href="/leads"><ArrowLeft className="h-4 w-4" /> Leads</Link>
          </Button>
          <StatusBadge value={lead.status} />
        </div>

        <section className="mb-6 rounded-lg border bg-white p-6 shadow-soft">
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Vista 360 del cliente</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">{lead.fullName}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Historial comercial del contacto: datos base, oportunidades, cotizaciones, actividades, reservas y operación conectada.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Info icon={<Mail className="h-4 w-4" />} label="Correo" value={lead.email} />
                <Info icon={<Phone className="h-4 w-4" />} label="Teléfono" value={lead.phone} />
                <Info icon={<UserRound className="h-4 w-4" />} label="Responsable" value={lead.assignedUser?.name ?? "Sin asignar"} />
              </div>
            </div>
            <Card className="p-5">
              <p className="font-semibold">Resumen del negocio</p>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Tipo de evento" value={lead.eventType} />
                <Row label="Personas" value={String(lead.peopleCount)} />
                <Row label="Origen" value={lead.source} />
                <Row label="Fecha tentativa" value={lead.estimatedDate ? format(lead.estimatedDate, "dd MMM yyyy", { locale: es }) : "Por definir"} />
              </div>
            </Card>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Kpi label="Oportunidades" value={String(lead.opportunities.length)} />
          <Kpi label="Valor pipeline" value={formatCurrency(pipelineValue)} />
          <Kpi label="Venta aceptada" value={formatCurrency(acceptedValue)} />
          <Kpi label="Tareas pendientes" value={String(pendingActivities)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <SectionTitle icon={<KanbanSquare className="h-5 w-5" />} title="Oportunidades" helper="Negocios asociados a este cliente" />
            <div className="mt-4 space-y-3">
              {lead.opportunities.length === 0 ? <Empty text="Este cliente aún no tiene oportunidades." /> : lead.opportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold">{opportunity.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {opportunity.assignedUser?.name ?? "Sin responsable"} · {formatCurrency(Number(opportunity.estimatedValue))}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={opportunity.stage.name} />
                      {opportunity.operationCode && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/operacion/${opportunity.id}`}>Expediente</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  {opportunity.notes && <p className="mt-3 text-sm text-muted-foreground">{opportunity.notes}</p>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={<FileDown className="h-5 w-5" />} title="Cotizaciones" helper="Propuestas vinculadas" />
            <div className="mt-4 space-y-3">
              {quotes.length === 0 ? <Empty text="Sin cotizaciones registradas." /> : quotes.map((quote) => (
                <div key={quote.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{quote.quoteNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{quote.opportunityTitle}</p>
                    </div>
                    <StatusBadge value={quote.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="font-semibold">{formatCurrency(Number(quote.total))}</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/cotizaciones/${quote.id}/pdf`} target="_blank"><FileDown className="h-4 w-4" /> PDF</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="p-5">
            <SectionTitle icon={<ClipboardList className="h-5 w-5" />} title="Historial de actividades" helper="Seguimientos y tareas" />
            <div className="mt-4 space-y-3">
              {activities.length === 0 ? <Empty text="Sin actividades asociadas." /> : activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{activity.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.opportunityTitle} · {activity.user.name} · {format(activity.activityDate, "dd MMM yyyy p", { locale: es })}
                      </p>
                    </div>
                    <StatusBadge value={activity.status} />
                  </div>
                  {activity.description && <p className="mt-3 text-sm text-muted-foreground">{activity.description}</p>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={<CalendarClock className="h-5 w-5" />} title="Reservas y agenda" helper="Bloqueos de espacio relacionados" />
            <div className="mt-4 space-y-3">
              {reservations.length === 0 ? <Empty text="Sin reservas registradas." /> : reservations.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{reservation.space?.name ?? "Espacio por definir"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {format(reservation.reservationDate, "dd MMM yyyy", { locale: es })} · {reservation.startTime} - {reservation.endTime}
                      </p>
                    </div>
                    <StatusBadge value={reservation.status} />
                  </div>
                  {reservation.notes && <p className="mt-3 text-sm text-muted-foreground">{reservation.notes}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-5">
          <SectionTitle icon={<MessageSquare className="h-5 w-5" />} title="Bitacora interna" helper="Notas visibles para el equipo, no para el cliente" />
          <form action={createLeadNote.bind(null, lead.id)} className="mt-4 grid gap-3">
            <Textarea name="content" placeholder="Agrega una novedad, acuerdo, riesgo o siguiente paso..." />
            <div className="flex justify-end">
              <SubmitButton pendingText="Guardando...">Guardar nota</SubmitButton>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {manualNotes.length === 0 ? <Empty text="Aun no hay notas internas para este cliente." /> : manualNotes.slice(0, 8).map((note) => (
              <div key={note.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm">{note.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{note.author.name} · {note.context}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(note.createdAt, "dd MMM yyyy p", { locale: es })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <SectionTitle icon={<ClipboardList className="h-5 w-5" />} title="Trazabilidad" helper="Últimos cambios relevantes del cliente y sus negocios" />
          <div className="mt-4 space-y-3">
            {audits.length === 0 ? <Empty text="Aún no hay trazabilidad registrada para este cliente." /> : audits.map((audit) => (
              <div key={audit.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{audit.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{audit.user?.name ?? "Sistema"} · {audit.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(audit.createdAt, "dd MMM yyyy p", { locale: es })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageTransition>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <p className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><strong className="text-right">{value}</strong></p>;
}

function SectionTitle({ icon, title, helper }: { icon: React.ReactNode; title: string; helper: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed bg-slate-50 p-5 text-center text-sm text-muted-foreground">{text}</div>;
}
