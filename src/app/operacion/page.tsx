import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CalendarClock, ChefHat, CheckCircle2, Clock, Eye, FileText, MapPin, UserRound } from "lucide-react";
import { StatusBadge } from "@/components/crm/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const chefDoneStatuses = ["Listo", "Entregado", "Finalizada"];

export default async function OperationPage() {
  const currentUser = await requireModuleAccess("operacion");
  const events = await prisma.opportunity.findMany({
    where: { AND: [salesOpportunityScope(currentUser), { operationCode: { not: null } }] },
    orderBy: [{ closedAt: "asc" }, { wonAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      estimatedValue: true,
      operationCode: true,
      operationalStatus: true,
      closedAt: true,
      lead: { select: { fullName: true, eventType: true, peopleCount: true } },
      assignedUser: { select: { name: true } },
      quotes: {
        where: { status: "Aceptada" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { quoteNumber: true, total: true }
      },
      reservations: {
        orderBy: { reservationDate: "asc" },
        take: 1,
        select: {
          reservationDate: true,
          startTime: true,
          endTime: true,
          status: true,
          space: { select: { name: true } }
        }
      },
      activities: {
        where: { type: "Operación" },
        select: { status: true }
      },
      purchaseTasks: { select: { status: true } },
      scheduleItems: { select: { status: true } },
      cateringRequirements: { select: { status: true } }
    }
  });

  const completedTasks = events.flatMap((event) => event.activities).filter((activity) => activity.status === "Finalizada").length;
  const totalTasks = events.flatMap((event) => event.activities).length;
  const totalChefItems = events.flatMap((event) => event.cateringRequirements).length;
  const readyChefItems = events.flatMap((event) => event.cateringRequirements).filter((item) => chefDoneStatuses.includes(item.status)).length;
  const operativeValue = events.reduce((sum, event) => sum + Number(event.quotes[0]?.total ?? event.estimatedValue), 0);
  const inProgress = events.filter((event) => !event.closedAt && event.operationalStatus !== "Finalizado").length;
  const blockedItems = events.reduce((sum, event) => {
    const purchases = event.purchaseTasks.filter((task) => task.status === "Bloqueado").length;
    const schedule = event.scheduleItems.filter((item) => item.status === "Bloqueado").length;
    const chef = event.cateringRequirements.filter((item) => item.status === "Bloqueado").length;
    return sum + purchases + schedule + chef;
  }, 0);
  const blockedEvents = events.filter((event) =>
    event.purchaseTasks.some((task) => task.status === "Bloqueado") ||
    event.scheduleItems.some((item) => item.status === "Bloqueado") ||
    event.cateringRequirements.some((item) => item.status === "Bloqueado")
  ).length;

  return (
    <AppShell title="Eventos ganados" module="operacion">
      <PageTransition>
        <ModuleHero
          eyebrow="Operación postventa"
          title="Bandeja operativa de eventos ganados, con acceso directo al expediente de cada negocio."
          description="Desde aquí se priorizan eventos, responsables, reservas, alimentos, compras y cronograma sin cargar toda la operación en una sola pantalla."
        />

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Kpi label="Eventos" value={String(events.length)} helper="Con código operativo" />
          <Kpi label="En curso" value={String(inProgress)} helper="Pendientes de cierre" />
          <Kpi label="Valor ganado" value={formatCurrency(operativeValue)} helper="Cotizaciones aceptadas" />
          <Kpi label="Bloqueos" value={String(blockedItems)} helper={`${blockedEvents} eventos afectados`} />
          <Kpi label="Alimentos" value={`${readyChefItems}/${totalChefItems}`} helper="Preparación chef" />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">Eventos listos para operar</h2>
                <p className="text-sm text-muted-foreground">Vista ligera para seguimiento ejecutivo. El detalle vive en el expediente.</p>
              </div>
              <p className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} tareas completadas</p>
            </div>
          </div>

          <div className="divide-y">
            {events.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aún no hay cotizaciones aceptadas enviadas a operación.
              </div>
            ) : (
              events.map((event) => {
                const reservation = event.reservations[0];
                const quote = event.quotes[0];
                const taskReady = event.activities.filter((activity) => activity.status === "Finalizada").length;
                const purchaseReady = event.purchaseTasks.filter((task) => ["Comprado", "Contratado", "No requerido"].includes(task.status)).length;
                const scheduleReady = event.scheduleItems.filter((item) => ["Ejecutado", "Finalizado"].includes(item.status)).length;
                const chefReady = event.cateringRequirements.filter((item) => chefDoneStatuses.includes(item.status)).length;
                const blockedCount =
                  event.purchaseTasks.filter((task) => task.status === "Bloqueado").length +
                  event.scheduleItems.filter((item) => item.status === "Bloqueado").length +
                  event.cateringRequirements.filter((item) => item.status === "Bloqueado").length;

                return (
                  <article key={event.id} className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 xl:grid-cols-[1.2fr_0.9fr_0.9fr_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase text-primary">{event.operationCode}</p>
                        {blockedCount > 0 && <StatusBadge value="Bloqueado" />}
                        <StatusBadge value={event.operationalStatus ?? "Pendiente de planeación"} />
                      </div>
                      <h3 className="mt-2 truncate font-semibold">{event.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.lead.fullName} · {event.lead.eventType} · {event.lead.peopleCount} personas
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-1">
                      <Info icon={<CalendarClock className="h-4 w-4" />} label="Fecha" value={reservation ? format(reservation.reservationDate, "dd MMM yyyy", { locale: es }) : "Por definir"} />
                      <Info icon={<Clock className="h-4 w-4" />} label="Horario" value={reservation ? `${reservation.startTime} - ${reservation.endTime}` : "Por definir"} />
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-1">
                      <Info icon={<MapPin className="h-4 w-4" />} label="Zona" value={reservation?.space?.name ?? "Sin reserva"} />
                      <Info icon={<UserRound className="h-4 w-4" />} label="Responsable" value={event.assignedUser?.name ?? "Sin asignar"} />
                    </div>

                    <div className="flex flex-col gap-3 xl:min-w-80">
                      <div className="grid grid-cols-4 gap-2">
                        <MiniProgress icon={<CheckCircle2 className="h-4 w-4" />} label="Tareas" value={`${taskReady}/${event.activities.length}`} />
                        <MiniProgress icon={<FileText className="h-4 w-4" />} label="Compras" value={`${purchaseReady}/${event.purchaseTasks.length}`} />
                        <MiniProgress icon={<ChefHat className="h-4 w-4" />} label="Chef" value={`${chefReady}/${event.cateringRequirements.length}`} />
                        <MiniProgress icon={<AlertTriangle className="h-4 w-4" />} label="Bloq." value={String(blockedCount)} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm">
                          <p className="font-semibold">{formatCurrency(Number(quote?.total ?? event.estimatedValue))}</p>
                          <p className="text-xs text-muted-foreground">{quote?.quoteNumber ?? "Sin cotización aceptada"}</p>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/operacion/${event.id}`}>
                            <Eye className="h-4 w-4" />
                            Abrir
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Card>
      </PageTransition>
    </AppShell>
  );
}

function Kpi({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="shrink-0 text-xs">{label}:</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </p>
  );
}

function MiniProgress({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white px-2.5 py-2 text-xs">
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
