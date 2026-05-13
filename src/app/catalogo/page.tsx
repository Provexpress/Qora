import { Pencil, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { createService, toggleService, updateService } from "@/actions/services";
import { StatusBadge } from "@/components/crm/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeClientFilter } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const category = params.category;
  const currentUser = await requireModuleAccess("catalogo");
  const clientFilter = activeClientFilter(currentUser);
  const [allServices, services] = await Promise.all([
    prisma.serviceItem.findMany({ where: clientFilter, select: { category: true } }),
    prisma.serviceItem.findMany({
      where: { ...clientFilter, ...(category ? { category } : {}) },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    })
  ]);
  const canManage = currentUser?.role.name === "Administrador";
  const categories = [...new Set(allServices.map((item) => item.category))].filter(Boolean).sort();
  const activeServices = services.filter((service) => service.active).length;
  const averagePrice = services.length > 0 ? services.reduce((sum, service) => sum + Number(service.price), 0) / services.length : 0;

  return (
    <AppShell title="Catálogo de servicios" module="catalogo">
      <PageTransition>
        <ModuleHero
          eyebrow="Servicios y adicionales"
          title="Catálogo con precio de venta y costo operativo para cotizar con margen."
          description="Los servicios activos alimentan el cotizador y permiten construir propuestas consistentes con utilidad proyectada."
        />

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Kpi label="Servicios" value={String(services.length)} />
          <Kpi label="Activos" value={String(activeServices)} />
          <Kpi label="Categorías" value={String(categories.length)} />
          <Kpi label="Precio prom." value={formatCurrency(averagePrice)} />
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={!category ? "default" : "outline"} size="sm"><a href="/catalogo">Todos</a></Button>
            {categories.map((cat) => (
              <Button asChild key={cat} variant={category === cat ? "default" : "outline"} size="sm">
                <a href={`/catalogo?category=${encodeURIComponent(cat)}`}>{cat}</a>
              </Button>
            ))}
          </div>
          {canManage && (
            <Dialog>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Servicio</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Crear servicio</DialogTitle></DialogHeader><ServiceForm action={createService} /></DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{service.name}</p><p className="mt-1 text-sm text-muted-foreground">{service.category}</p></div>
                <StatusBadge value={service.active ? "Activo" : "Inactivo"} />
              </div>
              <p className="mt-4 text-xl font-semibold">{formatCurrency(Number(service.price))}</p>
              <p className="mt-1 text-sm text-muted-foreground">Costo: {formatCurrency(Number(service.cost))}</p>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{service.description}</p>
              {canManage && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> Editar</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Editar servicio</DialogTitle></DialogHeader><ServiceForm action={updateService.bind(null, service.id)} service={service} /></DialogContent>
                  </Dialog>
                  <form action={toggleService.bind(null, service.id, !service.active)}>
                    <SubmitButton variant="outline" size="sm" pendingText="Guardando...">{service.active ? "Desactivar" : "Activar"}</SubmitButton>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function ServiceForm({
  action,
  service
}: {
  action: (formData: FormData) => void | Promise<void>;
  service?: { name: string; category: string; description: string | null; price: unknown; cost: unknown; active: boolean };
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field label="Nombre"><Input name="name" defaultValue={service?.name ?? ""} /></Field>
      <Field label="Categoría"><Input name="category" defaultValue={service?.category ?? ""} /></Field>
      <Field label="Precio venta"><Input name="price" type="number" defaultValue={service ? Number(service.price) : 0} /></Field>
      <Field label="Costo"><Input name="cost" type="number" defaultValue={service ? Number(service.cost) : 0} /></Field>
      <Field label="Activo">
        <select name="active" defaultValue={String(service?.active ?? true)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </Field>
      <Field label="Descripción"><Textarea name="description" defaultValue={service?.description ?? ""} /></Field>
      <div className="md:col-span-2 flex justify-end"><SubmitButton pendingText="Guardando...">Guardar</SubmitButton></div>
    </form>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
