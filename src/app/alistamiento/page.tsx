import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, CheckCircle2, ClipboardCheck, Clock, PackageCheck, PlayCircle, ShoppingCart } from "lucide-react";
import {
  closePreparedEvent,
  generatePreparationPlan,
  updatePurchaseTaskStatus,
  updateScheduleItemStatus
} from "@/actions/preparation";
import { StatusBadge } from "@/components/crm/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const purchaseDone = ["Comprado", "Contratado", "No requerido"];
const scheduleDone = ["Ejecutado", "Finalizado"];

export default async function PreparationPage() {
  const currentUser = await requireModuleAccess("alistamiento");
  const events = await prisma.opportunity.findMany({
    where: { AND: [salesOpportunityScope(currentUser), { operationCode: { not: null } }] },
    orderBy: { wonAt: "desc" },
    include: {
      lead: true,
      assignedUser: true,
      reservations: { include: { space: true }, orderBy: { reservationDate: "asc" } },
      quotes: {
        where: { status: "Aceptada" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { items: { include: { serviceItem: true } } }
      },
      purchaseTasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
      scheduleItems: { orderBy: { order: "asc" } }
    }
  });

  const allPurchases = events.flatMap((event) => event.purchaseTasks);
  const allSchedule = events.flatMap((event) => event.scheduleItems);
  const completedPurchases = allPurchases.filter((task) => purchaseDone.includes(task.status)).length;
  const completedSchedule = allSchedule.filter((item) => scheduleDone.includes(item.status)).length;
  const totalPurchaseCost = allPurchases.reduce((sum, task) => sum + Number(task.estimatedCost), 0);

  return (
    <AppShell title="Alistamiento" module="alistamiento">
      <PageTransition>
        <ModuleHero
          eyebrow="Preproducción del evento"
          title="Convierte lo cotizado en compras, contrataciones, cronograma y cierre operativo."
          description="Este módulo muestra el paso a paso después de aceptar la cotización: qué se debe comprar o contratar, cuándo se ejecuta cada bloque del evento y cómo se da cierre al negocio."
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={<ClipboardCheck className="h-5 w-5" />} label="Eventos en alistamiento" value={String(events.length)} helper="Con código operativo" />
          <Kpi icon={<ShoppingCart className="h-5 w-5" />} label="Compras listas" value={`${completedPurchases}/${allPurchases.length}`} helper={formatCurrency(totalPurchaseCost)} />
          <Kpi icon={<CalendarClock className="h-5 w-5" />} label="Cronograma ejecutado" value={`${completedSchedule}/${allSchedule.length}`} helper="Bloques del evento" />
          <Kpi icon={<CheckCircle2 className="h-5 w-5" />} label="Cerrados" value={String(events.filter((event) => event.closedAt).length)} helper="Negocios finalizados" />
        </div>

        <div className="space-y-6">
          {events.map((event) => {
            const reservation = event.reservations[0];
            const quote = event.quotes[0];
            const purchaseProgress = progress(event.purchaseTasks.length, event.purchaseTasks.filter((task) => purchaseDone.includes(task.status)).length);
            const scheduleProgress = progress(event.scheduleItems.length, event.scheduleItems.filter((item) => scheduleDone.includes(item.status)).length);
            const canClose = purchaseProgress === 100 && scheduleProgress === 100;

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="border-b bg-white p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-primary">{event.operationCode}</p>
                      <h2 className="mt-1 text-xl font-semibold">{event.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.lead.fullName} · {event.lead.eventType} · {event.lead.peopleCount} personas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={event.operationalStatus ?? "Pendiente de planeación"} />
                      {event.closedAt && <StatusBadge value="Finalizado" />}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <Info label="Fecha evento" value={reservation ? format(reservation.reservationDate, "dd MMM yyyy", { locale: es }) : "Por definir"} />
                    <Info label="Inicio" value={reservation?.startTime ?? "Por definir"} />
                    <Info label="Fin" value={reservation?.endTime ?? "Por definir"} />
                    <Info label="Espacio" value={reservation?.space?.name ?? "Sin reserva"} />
                  </div>
                </div>

                <div className="grid gap-6 p-5 xl:grid-cols-[1fr_1fr_320px]">
                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Compras y contrataciones</h3>
                        <p className="text-sm text-muted-foreground">Derivado de los ítems cotizados</p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{purchaseProgress}%</span>
                    </div>
                    <div className="space-y-3">
                      {event.purchaseTasks.length === 0 ? (
                        <EmptyPlan opportunityId={event.id} />
                      ) : event.purchaseTasks.map((task) => (
                        <div key={task.id} className="rounded-lg border bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{task.description}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{task.quantity} unidades · {task.supplier ?? "Proveedor por definir"}</p>
                            </div>
                            <StatusBadge value={task.status} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">Costo estimado: <strong className="text-foreground">{formatCurrency(Number(task.estimatedCost))}</strong></span>
                            <div className="flex gap-2">
                              <form action={updatePurchaseTaskStatus.bind(null, task.id, "En proceso")}><SubmitButton size="sm" variant="outline" pendingText="Actualizando...">En proceso</SubmitButton></form>
                              <form action={updatePurchaseTaskStatus.bind(null, task.id, task.category === "Servicio" ? "Contratado" : "Comprado")}><SubmitButton size="sm" pendingText="Guardando..."><PackageCheck className="h-4 w-4" /> Listo</SubmitButton></form>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Paso a paso del evento</h3>
                        <p className="text-sm text-muted-foreground">Horario de montaje, ejecución y cierre</p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{scheduleProgress}%</span>
                    </div>
                    <div className="space-y-3">
                      {event.scheduleItems.length === 0 ? (
                        <EmptyPlan opportunityId={event.id} />
                      ) : event.scheduleItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-[78px_1fr] gap-3 rounded-lg border bg-white p-4">
                          <div className="text-sm font-semibold text-primary">{item.startTime}<br /><span className="text-xs font-normal text-muted-foreground">{item.endTime}</span></div>
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{item.type} · {item.owner ?? "Responsable por definir"}</p>
                              </div>
                              <StatusBadge value={item.status} />
                            </div>
                            <div className="mt-3 flex gap-2">
                              <form action={updateScheduleItemStatus.bind(null, item.id, "En proceso")}><SubmitButton size="sm" variant="outline" pendingText="Iniciando...">Iniciar</SubmitButton></form>
                              <form action={updateScheduleItemStatus.bind(null, item.id, "Ejecutado")}><SubmitButton size="sm" pendingText="Guardando..."><PlayCircle className="h-4 w-4" /> Ejecutado</SubmitButton></form>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <aside className="rounded-lg border bg-slate-50 p-5">
                    <h3 className="font-semibold">Cierre del negocio</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cuando compras y cronograma estén al 100%, marca el evento como finalizado para cerrar el ciclo comercial y operativo.
                    </p>
                    <div className="mt-5 space-y-3 text-sm">
                      <p className="flex justify-between"><span className="text-muted-foreground">Cotización</span><strong>{quote?.quoteNumber ?? "Sin cotización"}</strong></p>
                      <p className="flex justify-between"><span className="text-muted-foreground">Valor</span><strong>{formatCurrency(Number(event.estimatedValue))}</strong></p>
                      <p className="flex justify-between"><span className="text-muted-foreground">Compras</span><strong>{purchaseProgress}%</strong></p>
                      <p className="flex justify-between"><span className="text-muted-foreground">Cronograma</span><strong>{scheduleProgress}%</strong></p>
                    </div>
                    {event.purchaseTasks.length === 0 || event.scheduleItems.length === 0 ? (
                      <form action={generatePreparationPlan.bind(null, event.id)} className="mt-5">
                        <SubmitButton className="w-full" pendingText="Generando..."><ClipboardCheck className="h-4 w-4" /> Generar alistamiento</SubmitButton>
                      </form>
                    ) : (
                      <form action={closePreparedEvent.bind(null, event.id)} className="mt-5">
                        <SubmitButton className="w-full" disabled={!canClose || Boolean(event.closedAt)} pendingText="Cerrando..."><CheckCircle2 className="h-4 w-4" /> Dar cierre al negocio</SubmitButton>
                      </form>
                    )}
                    {!canClose && event.purchaseTasks.length > 0 && event.scheduleItems.length > 0 && !event.closedAt && (
                      <p className="mt-3 text-xs text-muted-foreground">Completa compras y cronograma para habilitar el cierre.</p>
                    )}
                    {event.closedAt && <p className="mt-3 text-xs text-muted-foreground">Cerrado el {format(event.closedAt, "dd MMM yyyy", { locale: es })}</p>}
                  </aside>
                </div>
              </Card>
            );
          })}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function Kpi({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyPlan({ opportunityId }: { opportunityId: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-white p-5 text-center">
      <Clock className="mx-auto h-6 w-6 text-primary" />
      <p className="mt-3 text-sm font-medium">Aún no hay plan generado</p>
      <p className="mt-1 text-xs text-muted-foreground">Genera compras y cronograma a partir de la cotización aceptada.</p>
      <form action={generatePreparationPlan.bind(null, opportunityId)} className="mt-4">
        <SubmitButton size="sm" pendingText="Generando...">Generar alistamiento</SubmitButton>
      </form>
    </div>
  );
}

function progress(total: number, completed: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
