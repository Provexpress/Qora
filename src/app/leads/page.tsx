import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/crm/lead-form";
import { OpportunityForm } from "@/components/crm/opportunity-form";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, salesLeadScope } from "@/lib/scopes";
import { closedLeadStatuses } from "@/lib/status";

export const dynamic = "force-dynamic";
const pageSize = 12;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = params.status ?? "";
  const source = params.source ?? "";
  const scope = params.scope ?? "activos";
  const page = Math.max(Number(params.page ?? 1), 1);
  const showHistorical = scope === "historico";
  const currentUser = await requireModuleAccess("leads");
  const where: Prisma.LeadWhereInput = {
    AND: [
      salesLeadScope(currentUser),
      q ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" as const } }] } : {},
      status ? { status } : {},
      !status && !showHistorical ? { status: { notIn: [...closedLeadStatuses] } } : {},
      source ? { source } : {}
    ]
  };
  const [leads, totalLeads, filterData, users, stages] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignedUser: true, _count: { select: { opportunities: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.lead.count({ where }),
    prisma.lead.findMany({ where: salesLeadScope(currentUser), select: { source: true, status: true }, orderBy: { source: "asc" } }),
    prisma.user.findMany({ where: isAdmin(currentUser) ? { role: { name: { in: ["Administrador", "Comercial"] } } } : { id: currentUser.id }, orderBy: { name: "asc" } }),
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" } })
  ]);

  const userOptions = users.map((user) => ({ id: user.id, name: user.name }));
  const stageOptions = stages.map((stage) => ({ id: stage.id, name: stage.name }));
  const leadRows = leads.map((lead) => ({
    id: lead.id,
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    eventType: lead.eventType,
    estimatedDate: lead.estimatedDate?.toISOString().slice(0, 10) ?? "",
    peopleCount: lead.peopleCount,
    status: lead.status,
    notes: lead.notes ?? "",
    assignedUserId: lead.assignedUserId ?? "",
    assignedUserName: lead.assignedUser?.name ?? null,
    opportunities: lead._count.opportunities
  }));
  const sourceOptions = [...new Set(filterData.map((lead) => lead.source))].filter(Boolean);
  const statusOptions = [...new Set(filterData.map((lead) => lead.status))].filter(Boolean);
  const newLeads = leads.filter((lead) => lead.status === "Nuevo").length;
  const totalOpportunities = leads.reduce((sum, lead) => sum + lead._count.opportunities, 0);
  const historicalLeads = filterData.filter((lead) => closedLeadStatuses.includes(lead.status as (typeof closedLeadStatuses)[number])).length;
  const totalPages = Math.max(Math.ceil(totalLeads / pageSize), 1);

  return (
    <AppShell title="Leads / clientes" module="leads">
      <PageTransition>
        <ModuleHero
          eyebrow="Mesa de entrada comercial"
          title="Captura, califica y convierte interesados en oportunidades accionables."
          description="Concentra información inicial del cliente, origen, tipo de evento, responsable y el salto natural hacia el pipeline comercial."
        />

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Kpi label="Leads visibles" value={String(leads.length)} />
          <Kpi label="Nuevos" value={String(newLeads)} />
          <Kpi label="Oportunidades" value={String(totalOpportunities)} />
          <Kpi label="Históricos" value={String(historicalLeads)} />
        </div>

        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <form className="flex flex-1 flex-wrap items-center gap-2">
            {showHistorical && <input type="hidden" name="scope" value="historico" />}
            <div className="flex h-10 min-w-72 flex-1 items-center gap-2 rounded-md border bg-white px-3 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input name="q" defaultValue={q} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar por nombre, teléfono o correo" />
            </div>
            <select name="status" defaultValue={status} className="h-10 rounded-md border bg-white px-3 text-sm shadow-sm">
              <option value="">Todos los estados</option>
              {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="source" defaultValue={source} className="h-10 rounded-md border bg-white px-3 text-sm shadow-sm">
              <option value="">Todos los orígenes</option>
              {sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button variant="outline">Filtrar</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={!showHistorical ? "default" : "outline"}>
              <a href="/leads">Cartera activa</a>
            </Button>
            <Button asChild variant={showHistorical ? "default" : "outline"}>
              <a href="/leads?scope=historico">Histórico</a>
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Nuevo lead</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Crear lead</DialogTitle></DialogHeader><LeadForm users={userOptions} /></DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm text-muted-foreground">
            <span>{totalLeads} registros encontrados</span>
            <span>Página {page} de {totalPages}</span>
          </div>
          <div className="grid min-w-[1060px] grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.8fr_340px] gap-3 border-b bg-muted px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
            <span>Cliente</span><span>Evento</span><span>Origen</span><span>Estado</span><span>Responsable</span><span>Acciones</span>
          </div>
          <div className="divide-y overflow-x-auto">
            {leadRows.map((lead) => (
              <div key={lead.id} className="grid min-w-[1060px] grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.8fr_340px] items-center gap-3 px-4 py-4 text-sm">
                <div><p className="font-medium">{lead.fullName}</p><p className="text-muted-foreground">{lead.email} · {lead.phone}</p></div>
                <span>{lead.eventType}</span>
                <span>{lead.source}</span>
                <StatusBadge value={lead.status} />
                <span>{lead.assignedUserName ?? "Sin asignar"}</span>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/leads/${lead.id}`}><Eye className="h-4 w-4" /> Ficha</Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Editar</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Editar lead</DialogTitle></DialogHeader><LeadForm users={userOptions} lead={lead} /></DialogContent>
                  </Dialog>
                  <OpportunityForm lead={lead} users={userOptions} stages={stageOptions} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Button asChild variant="outline" disabled={page <= 1}>
            <a href={leadPageHref(params, page - 1)}>Anterior</a>
          </Button>
          <Button asChild variant="outline" disabled={page >= totalPages}>
            <a href={leadPageHref(params, page + 1)}>Siguiente</a>
          </Button>
        </div>
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

function leadPageHref(params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") search.set(key, value);
  });
  search.set("page", String(Math.max(page, 1)));
  return `/leads?${search.toString()}`;
}
