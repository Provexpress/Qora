import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarClock,
  ChefHat,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  PackageCheck,
  PlayCircle,
  Plus,
  ShoppingCart,
  Utensils
} from "lucide-react";
import { createCateringRequirement, generateCateringPlan, updateCateringRequirement, updateCateringRequirementStatus } from "@/actions/catering";
import { createOpportunityNote } from "@/actions/notes";
import { completeOperationalTask, createOperationalTask, updateOperationalStatus } from "@/actions/operations";
import { closePreparedEvent, generatePreparationPlan, updatePurchaseTaskStatus, updateScheduleItemStatus } from "@/actions/preparation";
import { StatusBadge } from "@/components/crm/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { PrintButton } from "@/components/quotes/print-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const operationalStatuses = ["Pendiente de planeación", "Planeación en curso", "Montaje programado", "En ejecución", "Finalizado"];
const purchaseDone = ["Comprado", "Contratado", "No requerido"];
const scheduleDone = ["Ejecutado", "Finalizado"];
const chefDone = ["Listo", "Entregado", "Finalizada"];

export default async function OperationEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await requireModuleAccess("operacion");
  const returnTo = `/operacion/${id}`;
  const [event, operators] = await Promise.all([
    prisma.opportunity.findFirst({
      where: { AND: [salesOpportunityScope(currentUser), { id, operationCode: { not: null } }] },
      include: {
        lead: true,
        assignedUser: true,
        stage: true,
        quotes: {
          where: { status: "Aceptada" },
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: { items: { include: { serviceItem: true }, orderBy: { description: "asc" } } }
        },
        reservations: { include: { space: true }, orderBy: { reservationDate: "asc" } },
        activities: { where: { type: "Operación" }, orderBy: { activityDate: "asc" }, include: { user: true } },
        purchaseTasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
        scheduleItems: { orderBy: { order: "asc" } },
        cateringRequirements: { orderBy: [{ serviceTime: "asc" }, { createdAt: "asc" }] },
        timelineNotes: { include: { author: true }, orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.user.findMany({ where: { role: { name: "Operativo" }, clientId: currentUser.activeClient?.id ?? currentUser.clientId }, orderBy: { name: "asc" } })
  ]);

  if (!event) notFound();

  const reservation = event.reservations[0];
  const quote = event.quotes[0];
  const purchasesReady = event.purchaseTasks.filter((task) => purchaseDone.includes(task.status)).length;
  const scheduleReady = event.scheduleItems.filter((item) => scheduleDone.includes(item.status)).length;
  const chefReady = event.cateringRequirements.filter((item) => chefDone.includes(item.status)).length;
  const taskReady = event.activities.filter((activity) => activity.status === "Finalizada").length;
  const purchaseProgress = progress(event.purchaseTasks.length, purchasesReady);
  const scheduleProgress = progress(event.scheduleItems.length, scheduleReady);
  const canClose = purchaseProgress === 100 && scheduleProgress === 100 && event.purchaseTasks.length > 0 && event.scheduleItems.length > 0;

  return (
    <AppShell title="Expediente operativo" module="operacion">
      <PageTransition>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button asChild variant="outline">
            <Link href="/operacion"><ArrowLeft className="h-4 w-4" /> Eventos ganados</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <PrintButton />
            <StatusBadge value={event.operationalStatus ?? "Pendiente de planeación"} />
            {event.closedAt && <StatusBadge value="Finalizado" />}
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border bg-white shadow-soft">
          <div className="grid gap-6 p-6 xl:grid-cols-[1fr_340px]">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">{event.operationCode}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">{event.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {event.lead.fullName} · {event.lead.eventType} · {event.lead.peopleCount} personas
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <Info label="Fecha" value={reservation ? format(reservation.reservationDate, "dd MMM yyyy", { locale: es }) : "Por definir"} icon={<CalendarClock className="h-4 w-4" />} />
                <Info label="Horario" value={reservation ? `${reservation.startTime} - ${reservation.endTime}` : "Por definir"} icon={<Clock className="h-4 w-4" />} />
                <Info label="Espacio" value={reservation?.space?.name ?? "Sin reserva"} icon={<MapPin className="h-4 w-4" />} />
                <Info label="Valor" value={formatCurrency(Number(event.estimatedValue))} icon={<FileText className="h-4 w-4" />} />
              </div>
            </div>
            <Card className="p-5">
              <p className="font-semibold">Estado operativo</p>
              <form action={updateOperationalStatus} className="mt-4">
                <input type="hidden" name="opportunityId" value={event.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <select name="operationalStatus" defaultValue={event.operationalStatus ?? operationalStatuses[0]} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
                  {operationalStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <SubmitButton className="mt-3 w-full" variant="outline" pendingText="Actualizando...">Actualizar estado</SubmitButton>
              </form>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Responsable: <strong className="text-foreground">{event.assignedUser?.name ?? "Sin asignar"}</strong></p>
                <p>Etapa: <strong className="text-foreground">{event.stage.name}</strong></p>
                <p>Cotización: <strong className="text-foreground">{quote?.quoteNumber ?? "Sin cotización aceptada"}</strong></p>
              </div>
            </Card>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Kpi label="Checklist" value={`${taskReady}/${event.activities.length}`} />
          <Kpi label="Compras" value={`${purchasesReady}/${event.purchaseTasks.length}`} />
          <Kpi label="Cronograma" value={`${scheduleReady}/${event.scheduleItems.length}`} />
          <Kpi label="Alimentos" value={`${chefReady}/${event.cateringRequirements.length}`} />
        </div>

        <Card className="mt-6 p-5">
          <SectionTitle icon={<MessageSquare className="h-5 w-5" />} title="Bitacora operativa" helper="Novedades internas del evento, visibles para el equipo" />
          <form action={createOpportunityNote.bind(null, event.id)} className="mt-4 grid gap-3">
            <Textarea name="content" placeholder="Registra novedad de montaje, proveedor, chef, cliente o bloqueo..." />
            <div className="flex justify-end">
              <SubmitButton pendingText="Guardando...">Guardar nota</SubmitButton>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {event.timelineNotes.length === 0 ? <Empty text="Aun no hay novedades internas en este evento." /> : event.timelineNotes.slice(0, 6).map((note) => (
              <div key={note.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm">{note.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{note.author.name} · {note.visibility}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(note.createdAt, "dd MMM yyyy p", { locale: es })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <SectionTitle icon={<ChefHat className="h-5 w-5" />} title="Alimentos / chef" helper="Platos y bebidas enviados desde lo vendido" />
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={generateCateringPlan.bind(null, event.id)}>
                <input type="hidden" name="returnTo" value={returnTo} />
                <SubmitButton size="sm" variant="outline" pendingText="Trayendo..."><Utensils className="h-4 w-4" /> Traer de cotización</SubmitButton>
              </form>
              <Dialog>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Plato</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Agregar requerimiento de alimentos</DialogTitle></DialogHeader>
                  <CateringForm action={createCateringRequirement} opportunityId={event.id} defaultTime={reservation?.startTime} returnTo={returnTo} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-4 space-y-3">
              {event.cateringRequirements.length === 0 ? <Empty text="Sin requerimientos de alimentos. Usa Traer de cotización o crea un plato manual." /> : event.cateringRequirements.map((item) => (
                <div key={item.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.category} · {item.quantity} porciones/unidades · {item.serviceTime ?? "Hora por definir"}</p>
                      {item.chefNotes && <p className="mt-2 text-sm text-muted-foreground">{item.chefNotes}</p>}
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild><Button size="sm" variant="outline">Editar ficha</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Ficha para chef</DialogTitle></DialogHeader>
                        <CateringForm action={updateCateringRequirement.bind(null, item.id)} requirement={item} defaultTime={reservation?.startTime} returnTo={returnTo} />
                      </DialogContent>
                    </Dialog>
                    <form action={updateCateringRequirementStatus.bind(null, item.id, "En preparación", returnTo)}><SubmitButton size="sm" variant="outline" pendingText="Marcando...">En preparación</SubmitButton></form>
                    <form action={updateCateringRequirementStatus.bind(null, item.id, "Listo", returnTo)}><SubmitButton size="sm" pendingText="Guardando..."><CheckCircle2 className="h-4 w-4" /> Listo</SubmitButton></form>
                    <form action={updateCateringRequirementStatus.bind(null, item.id, "Bloqueado", returnTo)}><SubmitButton size="sm" variant="outline" pendingText="Bloqueando...">Bloquear</SubmitButton></form>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={<FileText className="h-5 w-5" />} title="Cotización aceptada" helper="Servicios vendidos para este evento" />
            {!quote ? <Empty text="No hay cotización aceptada asociada." /> : (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                  <p className="font-semibold">{quote.quoteNumber} · {quote.title}</p>
                  <p className="mt-2 flex justify-between"><span>Total</span><strong>{formatCurrency(Number(quote.total))}</strong></p>
                  <p className="mt-1 flex justify-between"><span>Utilidad</span><strong>{formatCurrency(Number(quote.profit))}</strong></p>
                </div>
                {quote.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 rounded-md border p-3 text-sm">
                    <div><p className="font-medium">{item.description}</p><p className="text-xs text-muted-foreground">{item.serviceItem?.category ?? "Personalizado"} · {item.quantity}</p></div>
                    <strong>{formatCurrency(Number(item.total))}</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-1">
            <SectionTitle icon={<CheckCircle2 className="h-5 w-5" />} title="Checklist operativo" helper="Tareas del equipo operativo" />
            <Dialog>
              <DialogTrigger asChild><Button className="mt-4" size="sm" variant="outline"><Plus className="h-4 w-4" /> Tarea</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva tarea operativa</DialogTitle></DialogHeader>
                <form action={createOperationalTask} className="grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="opportunityId" value={event.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Field label="Responsable"><select name="userId" className="h-10 w-full rounded-md border bg-white px-3 text-sm">{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}</select></Field>
                  <Field label="Fecha"><Input name="activityDate" type="datetime-local" /></Field>
                  <Field label="Título"><Input name="title" /></Field>
                  <Field label="Descripción"><Textarea name="description" /></Field>
                  <div className="md:col-span-2 flex justify-end"><SubmitButton pendingText="Creando...">Crear tarea</SubmitButton></div>
                </form>
              </DialogContent>
            </Dialog>
            <div className="mt-4 space-y-3">
              {event.activities.length === 0 ? <Empty text="Sin tareas operativas registradas." /> : event.activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-medium">{activity.title}</p><p className="mt-1 text-xs text-muted-foreground">{activity.user.name} · {format(activity.activityDate, "dd MMM p", { locale: es })}</p></div>
                    <StatusBadge value={activity.status} />
                  </div>
                  {activity.status !== "Finalizada" && (
                    <form action={completeOperationalTask.bind(null, activity.id)} className="mt-3">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton size="sm" variant="outline" pendingText="Completando...">Completar</SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={<ShoppingCart className="h-5 w-5" />} title="Compras y contrataciones" helper={`${purchaseProgress}% completo`} />
            <div className="mt-4 space-y-3">
              {event.purchaseTasks.length === 0 ? <GeneratePlan eventId={event.id} returnTo={returnTo} /> : event.purchaseTasks.map((task) => (
                <div key={task.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-medium">{task.description}</p><p className="mt-1 text-sm text-muted-foreground">{task.quantity} · {task.supplier ?? "Proveedor por definir"}</p></div>
                    <StatusBadge value={task.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Costo: <strong className="text-foreground">{formatCurrency(Number(task.estimatedCost))}</strong></p>
                  <div className="mt-3 flex gap-2">
                    <form action={updatePurchaseTaskStatus.bind(null, task.id, "En proceso")}><input type="hidden" name="returnTo" value={returnTo} /><SubmitButton size="sm" variant="outline" pendingText="Actualizando...">En proceso</SubmitButton></form>
                    <form action={updatePurchaseTaskStatus.bind(null, task.id, task.category === "Servicio" ? "Contratado" : "Comprado")}><input type="hidden" name="returnTo" value={returnTo} /><SubmitButton size="sm" pendingText="Guardando..."><PackageCheck className="h-4 w-4" /> Listo</SubmitButton></form>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={<Clock className="h-5 w-5" />} title="Cronograma del evento" helper={`${scheduleProgress}% ejecutado`} />
            <div className="mt-4 space-y-3">
              {event.scheduleItems.length === 0 ? <GeneratePlan eventId={event.id} returnTo={returnTo} /> : event.scheduleItems.map((item) => (
                <div key={item.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-medium">{item.startTime} - {item.endTime}</p><p className="mt-1 text-sm">{item.title}</p><p className="text-xs text-muted-foreground">{item.owner ?? "Responsable por definir"}</p></div>
                    <StatusBadge value={item.status} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <form action={updateScheduleItemStatus.bind(null, item.id, "En proceso")}><input type="hidden" name="returnTo" value={returnTo} /><SubmitButton size="sm" variant="outline" pendingText="Iniciando...">Iniciar</SubmitButton></form>
                    <form action={updateScheduleItemStatus.bind(null, item.id, "Ejecutado")}><input type="hidden" name="returnTo" value={returnTo} /><SubmitButton size="sm" pendingText="Guardando..."><PlayCircle className="h-4 w-4" /> Ejecutado</SubmitButton></form>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Cierre operativo</p>
              <p className="mt-1 text-sm text-muted-foreground">El cierre se habilita cuando compras y cronograma están completos.</p>
            </div>
            <form action={closePreparedEvent.bind(null, event.id)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <SubmitButton disabled={!canClose || Boolean(event.closedAt)} pendingText="Cerrando..."><CheckCircle2 className="h-4 w-4" /> Dar cierre al negocio</SubmitButton>
            </form>
          </div>
        </Card>
      </PageTransition>
    </AppShell>
  );
}

function CateringForm({
  action,
  opportunityId,
  requirement,
  defaultTime,
  returnTo
}: {
  action: (formData: FormData) => void | Promise<void>;
  opportunityId?: string;
  defaultTime?: string;
  returnTo: string;
  requirement?: {
    title: string;
    category: string;
    quantity: number;
    serviceTime: string | null;
    chefNotes: string | null;
  };
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="returnTo" value={returnTo} />
      {opportunityId && <input type="hidden" name="opportunityId" value={opportunityId} />}
      <Field label="Plato / servicio"><Input name="title" defaultValue={requirement?.title ?? ""} placeholder="Ej. Menú principal" /></Field>
      <Field label="Categoría"><select name="category" defaultValue={requirement?.category ?? "Alimentos"} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option>Alimentos</option><option>Bebidas</option><option>Postres</option><option>Servicio especial</option></select></Field>
      <Field label="Cantidad"><Input name="quantity" type="number" defaultValue={requirement?.quantity ?? 1} /></Field>
      <Field label="Hora de salida"><Input name="serviceTime" type="time" defaultValue={requirement?.serviceTime ?? defaultTime ?? ""} /></Field>
      <Field label="Notas para chef" className="md:col-span-2"><Textarea name="chefNotes" defaultValue={requirement?.chefNotes ?? ""} /></Field>
      <div className="md:col-span-2 flex justify-end"><SubmitButton pendingText="Guardando...">Guardar ficha</SubmitButton></div>
    </form>
  );
}

function GeneratePlan({ eventId, returnTo }: { eventId: string; returnTo: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-slate-50 p-5 text-center">
      <p className="text-sm font-medium">Aún no hay plan generado</p>
      <form action={generatePreparationPlan.bind(null, eventId)} className="mt-3">
        <input type="hidden" name="returnTo" value={returnTo} />
        <SubmitButton size="sm" pendingText="Generando...">Generar alistamiento</SubmitButton>
      </form>
    </div>
  );
}

function SectionTitle({ icon, title, helper }: { icon: React.ReactNode; title: string; helper: string }) {
  return <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div><div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{helper}</p></div></div>;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></Card>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-md border bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed bg-slate-50 p-5 text-center text-sm text-muted-foreground">{text}</div>;
}

function progress(total: number, completed: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
