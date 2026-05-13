"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
  subWeeks
} from "date-fns";
import { es } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  LayoutList,
  MapPin,
  PhoneCall,
  Plus,
  Rows3,
  Sparkles,
  UserRound,
  Users
} from "lucide-react";
import { createActivity, createReservation, updateActivityStatus, updateReservationStatus } from "@/actions/agenda";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AgendaMode = "event" | "crm";
type ViewMode = "week" | "day" | "list";

type SpaceOption = {
  id: string;
  name: string;
  capacity: number;
};

type UserOption = {
  id: string;
  name: string;
};

type OpportunityOption = {
  id: string;
  title: string;
  leadName: string;
  eventType: string;
};

type AgendaReservation = {
  id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  spaceId: string | null;
  space: SpaceOption | null;
  opportunity: {
    id: string;
    title: string;
    lead: {
      fullName: string;
      eventType: string;
      peopleCount: number;
    };
  };
};

type AgendaActivity = {
  id: string;
  title: string;
  description: string | null;
  activityDate: string;
  type: string;
  status: string;
  user: UserOption;
  opportunity: {
    id: string;
    title: string;
    lead: {
      fullName: string;
      eventType: string;
    };
  };
};

type AgendaWorkspaceProps = {
  mode?: AgendaMode;
  activities: AgendaActivity[];
  reservations: AgendaReservation[];
  opportunities: OpportunityOption[];
  users: UserOption[];
  spaces: SpaceOption[];
};

type AgendaListRow =
  | { type: "Reserva"; date: string; reservation: AgendaReservation }
  | { type: "Actividad"; date: string; activity: AgendaActivity };

const statusOptions = ["Todos", "Pendiente", "Confirmada", "Cancelada", "Finalizada"];

export function AgendaWorkspace({ mode = "event", activities, reservations, opportunities, users, spaces }: AgendaWorkspaceProps) {
  const isEventMode = mode === "event";
  const firstUpcoming = reservations.find((reservation) => parseISO(reservation.reservationDate) >= new Date());
  const [anchorDate, setAnchorDate] = useState(() => firstUpcoming ? parseISO(firstUpcoming.reservationDate) : new Date());
  const [view, setView] = useState<ViewMode>(() => isEventMode ? "week" : "list");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const visibleSpaces = spaceFilter === "all" ? spaces : spaces.filter((space) => space.id === spaceFilter);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesSpace = spaceFilter === "all" || reservation.spaceId === spaceFilter;
      const matchesStatus = statusFilter === "Todos" || reservation.status === statusFilter;
      return matchesSpace && matchesStatus;
    });
  }, [reservations, spaceFilter, statusFilter]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => statusFilter === "Todos" || activity.status === statusFilter);
  }, [activities, statusFilter]);

  const weekReservations = filteredReservations.filter((reservation) =>
    isWithinInterval(parseISO(reservation.reservationDate), { start: weekStart, end: weekEnd })
  );
  const weekActivities = filteredActivities.filter((activity) =>
    isWithinInterval(parseISO(activity.activityDate), { start: weekStart, end: weekEnd })
  );
  const dayReservations = filteredReservations.filter((reservation) => isSameDay(parseISO(reservation.reservationDate), anchorDate));
  const dayActivities = filteredActivities.filter((activity) => isSameDay(parseISO(activity.activityDate), anchorDate));
  const upcomingReservations = filteredReservations
    .filter((reservation) => parseISO(reservation.reservationDate) >= new Date())
    .slice(0, 8);
  const upcomingActivities = filteredActivities
    .filter((activity) => activity.status === "Pendiente")
    .sort((a, b) => parseISO(a.activityDate).getTime() - parseISO(b.activityDate).getTime())
    .slice(0, 8);

  const confirmedWeek = weekReservations.filter((reservation) => reservation.status === "Confirmada").length;
  const tentativeWeek = weekReservations.filter((reservation) => reservation.status === "Pendiente").length;
  const committedPeople = dayReservations.reduce((sum, reservation) => sum + reservation.opportunity.lead.peopleCount, 0);
  const occupancy = visibleSpaces.length > 0 ? Math.round((weekReservations.length / (visibleSpaces.length * 7)) * 100) : 0;
  const pendingWeekActivities = weekActivities.filter((activity) => activity.status === "Pendiente").length;
  const completedWeekActivities = weekActivities.filter((activity) => activity.status === "Finalizada").length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-white/95 shadow-soft">
        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-4 h-1 w-16 rounded-full bg-primary/70" />
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
              <Sparkles className="h-4 w-4" />
              {isEventMode ? "Planeacion comercial y operativa" : "Agenda CRM comercial"}
            </div>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-normal">
              {isEventMode
                ? "Agenda por zonas con reservas, actividades y capacidad comprometida en una sola vista."
                : "Seguimiento de llamadas, reuniones, tareas y proximos contactos sin mezclar reservas operativas."}
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {isEventMode ? (
                <>
                  <HeroMetric label="Reservas semana" value={String(weekReservations.length)} />
                  <HeroMetric label="Confirmadas" value={String(confirmedWeek)} />
                  <HeroMetric label="Tentativas" value={String(tentativeWeek)} />
                  <HeroMetric label="Ocupacion" value={`${occupancy}%`} />
                </>
              ) : (
                <>
                  <HeroMetric label="Actividades semana" value={String(weekActivities.length)} />
                  <HeroMetric label="Pendientes" value={String(pendingWeekActivities)} />
                  <HeroMetric label="Finalizadas" value={String(completedWeekActivities)} />
                  <HeroMetric label="Hoy" value={String(dayActivities.length)} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-slate-50 p-5">
            <p className="text-sm font-semibold">Brief del dia</p>
            <p className="mt-1 text-sm text-muted-foreground">{format(anchorDate, "EEEE d 'de' MMMM", { locale: es })}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {isEventMode ? (
                <>
                  <BriefItem icon={<CalendarDays className="h-4 w-4" />} label="Reservas" value={String(dayReservations.length)} />
                  <BriefItem icon={<Users className="h-4 w-4" />} label="Personas" value={String(committedPeople)} />
                  <BriefItem icon={<Rows3 className="h-4 w-4" />} label="Actividades" value={String(dayActivities.length)} />
                  <BriefItem icon={<MapPin className="h-4 w-4" />} label="Zonas" value={String(new Set(dayReservations.map((item) => item.spaceId)).size)} />
                </>
              ) : (
                <>
                  <BriefItem icon={<PhoneCall className="h-4 w-4" />} label="Llamadas" value={String(dayActivities.filter((activity) => activity.type === "Llamada").length)} />
                  <BriefItem icon={<Users className="h-4 w-4" />} label="Reuniones" value={String(dayActivities.filter((activity) => activity.type === "Reunion").length)} />
                  <BriefItem icon={<Rows3 className="h-4 w-4" />} label="Tareas" value={String(dayActivities.length)} />
                  <BriefItem icon={<UserRound className="h-4 w-4" />} label="Responsables" value={String(new Set(dayActivities.map((item) => item.user.id)).size)} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white/95 shadow-soft">
        <div className="flex flex-col gap-4 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setAnchorDate(subWeeks(anchorDate, 1))} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setAnchorDate(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={() => setAnchorDate(addWeeks(anchorDate, 1))} aria-label="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-0 rounded-md border bg-slate-50 px-3 py-2 text-sm font-medium xl:ml-2">
              {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl mode={mode} value={view} onChange={setView} />
            {isEventMode && (
              <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <select value={spaceFilter} onChange={(event) => setSpaceFilter(event.target.value)} className="bg-transparent text-sm outline-none">
                  <option value="all">Todas las zonas</option>
                  {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
                </select>
              </div>
            )}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none">
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
            <AgendaDialogs mode={mode} opportunities={opportunities} users={users} spaces={spaces} anchorDate={anchorDate} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "week" && isEventMode && (
            <motion.div key="week" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="overflow-x-auto scrollbar-thin">
              <WeekCalendar weekDays={weekDays} spaces={visibleSpaces} reservations={weekReservations} setAnchorDate={setAnchorDate} />
            </motion.div>
          )}
          {view === "day" && (
            <motion.div key="day" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <DayView mode={mode} date={anchorDate} reservations={dayReservations} activities={dayActivities} spaces={visibleSpaces} />
            </motion.div>
          )}
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <ListView reservations={isEventMode ? filteredReservations : []} activities={filteredActivities} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-white/95 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Actividades del dia</h3>
              <p className="text-sm text-muted-foreground">{isEventMode ? "Seguimiento comercial y tareas operativas" : "Llamadas, reuniones y tareas de seguimiento"}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{dayActivities.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {dayActivities.length === 0 ? <EmptyMessage text="No hay actividades programadas para este dia." /> : dayActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
          </div>
        </div>

        {isEventMode ? (
          <aside className="rounded-lg border bg-white/95 p-5 shadow-soft">
            <h3 className="font-semibold">Proximas reservas</h3>
            <p className="text-sm text-muted-foreground">Vista rapida para anticipar operacion</p>
            <div className="mt-4 space-y-3">
              {upcomingReservations.length === 0 ? <EmptyMessage text="No hay proximas reservas con estos filtros." /> : upcomingReservations.map((reservation) => <ReservationSummary key={reservation.id} reservation={reservation} showDate />)}
            </div>
          </aside>
        ) : (
          <aside className="rounded-lg border bg-white/95 p-5 shadow-soft">
            <h3 className="font-semibold">Proximos seguimientos</h3>
            <p className="text-sm text-muted-foreground">Llamadas y reuniones por ejecutar</p>
            <div className="mt-4 space-y-3">
              {upcomingActivities.length === 0 ? <EmptyMessage text="No hay seguimientos pendientes." /> : upcomingActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}

function WeekCalendar({ weekDays, spaces, reservations, setAnchorDate }: { weekDays: Date[]; spaces: SpaceOption[]; reservations: AgendaReservation[]; setAnchorDate: (date: Date) => void }) {
  return (
    <div className="min-w-[1120px]">
      <div className="grid border-b bg-slate-50" style={{ gridTemplateColumns: "190px repeat(7, minmax(132px, 1fr))" }}>
        <div className="border-r p-3 text-xs font-semibold uppercase text-muted-foreground">Zona</div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <button key={day.toISOString()} onClick={() => setAnchorDate(day)} className={cn("border-r p-3 text-center transition last:border-r-0 hover:bg-primary/5", isToday && "bg-primary/5")}>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{format(day, "EEE", { locale: es })}</p>
              <p className={cn("mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold", isToday ? "bg-primary text-white" : "text-foreground")}>{format(day, "d")}</p>
            </button>
          );
        })}
      </div>
      {spaces.map((space) => (
        <div key={space.id} className="grid min-h-36 border-b last:border-b-0" style={{ gridTemplateColumns: "190px repeat(7, minmax(132px, 1fr))" }}>
          <div className="border-r bg-white p-4">
            <p className="text-sm font-semibold">{space.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Cap. {space.capacity} personas</p>
            <p className="mt-3 text-xs text-muted-foreground">{spaceLoadLabel(space, reservations)}</p>
          </div>
          {weekDays.map((day) => {
            const dayBookings = reservations.filter((reservation) => reservation.spaceId === space.id && isSameDay(parseISO(reservation.reservationDate), day));
            return (
              <div key={`${space.id}-${day.toISOString()}`} className="min-h-36 border-r bg-white p-2 last:border-r-0">
                {dayBookings.length === 0 ? (
                  <div className="flex h-full min-h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">Disponible</div>
                ) : (
                  <div className="space-y-2">
                    {dayBookings.map((booking) => <ReservationBlock key={booking.id} booking={booking} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayView({ mode, date, reservations, activities, spaces }: { mode: AgendaMode; date: Date; reservations: AgendaReservation[]; activities: AgendaActivity[]; spaces: SpaceOption[] }) {
  if (mode === "crm") {
    return (
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{format(date, "EEEE d 'de' MMMM", { locale: es })}</h3>
          <p className="text-sm text-muted-foreground">Agenda comercial por hora, responsable y oportunidad.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {activities.length === 0 ? <EmptyMessage text="Sin llamadas ni reuniones para esta fecha." /> : activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 p-5 xl:grid-cols-[1fr_340px]">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{format(date, "EEEE d 'de' MMMM", { locale: es })}</h3>
          <p className="text-sm text-muted-foreground">Reservas organizadas por zona y hora</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {spaces.map((space) => {
            const spaceReservations = reservations.filter((reservation) => reservation.spaceId === space.id);
            return (
              <div key={space.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{space.name}</p>
                    <p className="text-xs text-muted-foreground">Cap. {space.capacity}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs">{spaceReservations.length}</span>
                </div>
                <div className="space-y-2">
                  {spaceReservations.length === 0 ? <EmptyMessage text="Disponible todo el dia." compact /> : spaceReservations.map((reservation) => <ReservationBlock key={reservation.id} booking={reservation} expanded />)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <aside className="rounded-lg border bg-slate-50 p-4">
        <h3 className="font-semibold">Agenda de actividades</h3>
        <div className="mt-4 space-y-3">
          {activities.length === 0 ? <EmptyMessage text="Sin actividades para esta fecha." /> : activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
        </div>
      </aside>
    </div>
  );
}

function ListView({ reservations, activities }: { reservations: AgendaReservation[]; activities: AgendaActivity[] }) {
  const rows: AgendaListRow[] = [
    ...reservations.map((reservation): AgendaListRow => ({ type: "Reserva", date: reservation.reservationDate, reservation })),
    ...activities.map((activity): AgendaListRow => ({ type: "Actividad", date: activity.activityDate, activity }))
  ].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  return (
    <div className="p-5">
      <div className="space-y-3">
        {rows.length === 0 ? <EmptyMessage text="No hay elementos para mostrar con estos filtros." /> : rows.map((row) => (
          <div key={`${row.type}-${row.date}-${listRowId(row)}`} className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-[120px_1fr_160px] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{row.type}</p>
              <p className="mt-1 text-sm font-medium">{format(parseISO(row.date), "dd MMM", { locale: es })}</p>
            </div>
            {row.type === "Reserva" ? (
              <div>
                <p className="font-medium">{row.reservation.opportunity.title}</p>
                <p className="text-sm text-muted-foreground">{row.reservation.space?.name ?? "Sin zona"} - {row.reservation.startTime} - {row.reservation.endTime}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">{row.activity.title}</p>
                <p className="text-sm text-muted-foreground">{row.activity.opportunity.lead.fullName} - {row.activity.user.name}</p>
              </div>
            )}
            <div className="text-right"><StatusPill value={listRowStatus(row)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function listRowId(row: AgendaListRow) {
  return row.type === "Reserva" ? row.reservation.id : row.activity.id;
}

function listRowStatus(row: AgendaListRow) {
  return row.type === "Reserva" ? row.reservation.status : row.activity.status;
}

function AgendaDialogs({ mode, opportunities, users, spaces, anchorDate }: { mode: AgendaMode; opportunities: OpportunityOption[]; users: UserOption[]; spaces: SpaceOption[]; anchorDate: Date }) {
  const dateValue = format(anchorDate, "yyyy-MM-dd");
  const isEventMode = mode === "event";

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={isEventMode ? "outline" : "default"}><Plus className="h-4 w-4" /> Actividad</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva actividad</DialogTitle></DialogHeader>
          <form action={createActivity} className="grid gap-4 md:grid-cols-2">
            <SelectField name="opportunityId" label="Oportunidad" options={opportunities.map((o) => [o.id, `${o.title} - ${o.leadName}`])} />
            <SelectField name="userId" label="Responsable" options={users.map((u) => [u.id, u.name])} />
            <Field label="Titulo"><Input name="title" placeholder={isEventMode ? "Validar montaje" : "Llamada de seguimiento"} /></Field>
            <Field label="Fecha"><Input name="activityDate" type="datetime-local" defaultValue={`${dateValue}T09:00`} /></Field>
            <Field label="Tipo">
              <select name="type" defaultValue={isEventMode ? "Tarea" : "Llamada"} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
                <option>Llamada</option>
                <option>Reunion</option>
                <option>Correo</option>
                <option>Seguimiento</option>
                <option>Tarea</option>
                {isEventMode && <option>Operacion</option>}
              </select>
            </Field>
            <Field label="Estado"><select name="status" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option>Pendiente</option><option>Finalizada</option><option>Cancelada</option></select></Field>
            <Field label="Descripcion"><Textarea name="description" /></Field>
            <div className="flex justify-end md:col-span-2"><SubmitButton pendingText="Guardando...">Guardar actividad</SubmitButton></div>
          </form>
        </DialogContent>
      </Dialog>

      {isEventMode && (
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Reserva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva reserva tentativa</DialogTitle></DialogHeader>
            <form action={createReservation} className="grid gap-4 md:grid-cols-2">
              <SelectField name="opportunityId" label="Oportunidad" options={opportunities.map((o) => [o.id, `${o.title} - ${o.leadName}`])} />
              <SelectField name="spaceId" label="Espacio" options={spaces.map((s) => [s.id, s.name])} />
              <Field label="Fecha"><Input name="reservationDate" type="date" defaultValue={dateValue} /></Field>
              <Field label="Inicio"><Input name="startTime" type="time" defaultValue="15:00" /></Field>
              <Field label="Fin"><Input name="endTime" type="time" defaultValue="23:00" /></Field>
              <Field label="Estado"><select name="status" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option>Pendiente</option><option>Confirmada</option><option>Cancelada</option><option>Finalizada</option></select></Field>
              <Field label="Notas"><Textarea name="notes" /></Field>
              <div className="flex justify-end md:col-span-2"><SubmitButton pendingText="Guardando...">Guardar reserva</SubmitButton></div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SegmentedControl({ mode, value, onChange }: { mode: AgendaMode; value: ViewMode; onChange: (value: ViewMode) => void }) {
  const options: Array<{ value: ViewMode; label: string; icon: ReactNode }> = mode === "event"
    ? [
        { value: "week", label: "Semana", icon: <CalendarDays className="h-4 w-4" /> },
        { value: "day", label: "Dia", icon: <Rows3 className="h-4 w-4" /> },
        { value: "list", label: "Lista", icon: <LayoutList className="h-4 w-4" /> }
      ]
    : [
        { value: "day", label: "Dia", icon: <Rows3 className="h-4 w-4" /> },
        { value: "list", label: "Lista", icon: <LayoutList className="h-4 w-4" /> }
      ];

  return (
    <div className="flex rounded-md border bg-slate-50 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn("flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium transition", value === option.value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ReservationBlock({ booking, expanded = false }: { booking: AgendaReservation; expanded?: boolean }) {
  const tone = getReservationTone(booking.status);
  const duration = `${booking.startTime} - ${booking.endTime}`;

  return (
    <motion.div layout whileHover={{ y: -2 }} className={cn("rounded-md border p-3 shadow-sm", tone.block)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase">{booking.opportunity.lead.eventType}</p>
          <p className="mt-1 truncate text-sm font-semibold">{booking.opportunity.lead.fullName}</p>
        </div>
        <StatusPill value={booking.status} />
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs opacity-80"><Clock className="h-3.5 w-3.5" /> {duration}</p>
      {expanded && (
        <div className="mt-3 space-y-1 border-t pt-3 text-xs opacity-85">
          <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {booking.space?.name ?? "Sin espacio"}</p>
          <p className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {booking.opportunity.lead.peopleCount} personas</p>
        </div>
      )}
    </motion.div>
  );
}

function ReservationSummary({ reservation, showDate = false }: { reservation: AgendaReservation; showDate?: boolean }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{reservation.opportunity.title}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="h-3 w-3" /> {reservation.opportunity.lead.fullName}</p>
        </div>
        <StatusPill value={reservation.status} />
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {reservation.space?.name ?? "Sin espacio"} - {reservation.startTime} - {reservation.endTime}</p>
      {showDate && <p className="mt-1 text-xs text-muted-foreground">{format(parseISO(reservation.reservationDate), "EEE d MMM", { locale: es })}</p>}
      {reservation.status === "Pendiente" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={updateReservationStatus.bind(null, reservation.id, "Confirmada")}>
            <SubmitButton size="sm" variant="outline" pendingText="Confirmando...">Confirmar</SubmitButton>
          </form>
          <form action={updateReservationStatus.bind(null, reservation.id, "Cancelada")}>
            <SubmitButton size="sm" variant="outline" pendingText="Cancelando...">Cancelar</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: AgendaActivity }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{activity.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{activity.opportunity.lead.fullName} - {activity.user.name}</p>
        </div>
        <StatusPill value={activity.status} />
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {format(parseISO(activity.activityDate), "dd MMM p", { locale: es })}</p>
      <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{activity.type}</p>
      {activity.status === "Pendiente" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={updateActivityStatus.bind(null, activity.id, "Finalizada")}>
            <SubmitButton size="sm" variant="outline" pendingText="Finalizando...">Finalizar</SubmitButton>
          </form>
          <form action={updateActivityStatus.bind(null, activity.id, "Cancelada")}>
            <SubmitButton size="sm" variant="outline" pendingText="Cancelando...">Cancelar</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function BriefItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[][] }) {
  return <Field label={label}><select name={name} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field>;
}

function EmptyMessage({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={cn("rounded-md border border-dashed bg-white text-center text-sm text-muted-foreground", compact ? "p-3" : "p-5")}>{text}</div>;
}

function StatusPill({ value }: { value: string }) {
  const tone = getReservationTone(value);
  return <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-semibold", tone.pill)}>{value}</span>;
}

function getReservationTone(status: string) {
  if (status === "Confirmada" || status === "Finalizada") {
    return { block: "border-emerald-200 bg-emerald-50 text-emerald-900", pill: "bg-emerald-100 text-emerald-700" };
  }
  if (status === "Cancelada") {
    return { block: "border-rose-200 bg-rose-50 text-rose-900", pill: "bg-rose-100 text-rose-700" };
  }
  return { block: "border-amber-200 bg-amber-50 text-amber-900", pill: "bg-amber-100 text-amber-700" };
}

function spaceLoadLabel(space: SpaceOption, reservations: AgendaReservation[]) {
  const people = reservations
    .filter((reservation) => reservation.spaceId === space.id)
    .reduce((sum, reservation) => sum + reservation.opportunity.lead.peopleCount, 0);

  if (people === 0) {
    return "Sin ocupacion esta semana";
  }

  return `${people} personas comprometidas`;
}
