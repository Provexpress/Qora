import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, LayoutDashboard, LogOut, Plus, ShieldCheck, UserPlus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { logout, setActiveClient } from "@/actions/auth";
import { createClient, updateClientStatus } from "@/actions/clients";
import { createUser } from "@/actions/users";
import { StatusBadge } from "@/components/crm/status-badge";
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
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const user = await requireModuleAccess("clientes");
  const [clients, roles] = await Promise.all([
    prisma.client.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: {
        users: { include: { role: true }, orderBy: { name: "asc" }, take: 6 },
        _count: { select: { users: true, leads: true, services: true, spaces: true } }
      }
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } })
  ]);

  const activeClients = clients.filter((client) => client.status === "Activo").length;
  const totalUsers = clients.reduce((sum, client) => sum + client._count.users, 0);
  const selectedClient = user.activeClient?.id
    ? clients.find((client) => client.id === user.activeClient?.id)
    : clients.find((client) => client.status === "Activo");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-5 text-slate-950 md:px-8">
      <PageTransition>
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-xl border bg-white/90 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Qora Admin</p>
                <h1 className="text-xl font-semibold">Portal de clientes</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedClient && (
                <form action={setActiveClient}>
                  <input type="hidden" name="clientId" value={selectedClient.id} />
                  <input type="hidden" name="returnTo" value="/dashboard" />
                  <SubmitButton variant="outline" pendingText="Entrando...">
                    <LayoutDashboard className="h-4 w-4" />
                    Entrar al CRM actual
                  </SubmitButton>
                </form>
              )}
              <form action={logout}>
                <Button type="submit" variant="outline">
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </form>
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="overflow-hidden border-white/80 bg-white/90 p-0 shadow-soft backdrop-blur">
              <div className="p-7 md:p-9">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Consola Provexpress
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">
                  Elige el cliente y entra a su CRM sin mezclar datos ni navegacion.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Esta pantalla funciona como inicio administrativo de Qora. Desde aqui se habilitan tenants, usuarios y el contexto
                  de trabajo. Al entrar a un cliente, la aplicacion abre la interfaz CRM completa para ese negocio.
                </p>
              </div>
              <div className="grid border-t bg-slate-50/80 sm:grid-cols-3">
                <PortalMetric label="Clientes" value={String(clients.length)} helper="Tenants creados" />
                <PortalMetric label="Activos" value={String(activeClients)} helper="Listos para operar" />
                <PortalMetric label="Usuarios" value={String(totalUsers)} helper="Asignados por cliente" />
              </div>
            </Card>

            <Card className="border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">Cliente actual</p>
                  <h3 className="mt-2 text-2xl font-semibold">{selectedClient?.name ?? "Sin cliente activo"}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedClient
                      ? "El CRM usara este contexto para dashboard, pipeline, cotizaciones, operacion y reportes."
                      : "Crea o habilita un cliente para iniciar un contexto CRM."}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
                  {selectedClient ? initials(selectedClient.name) : "Q"}
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniKpi label="Leads" value={String(selectedClient?._count.leads ?? 0)} />
                <MiniKpi label="Usuarios" value={String(selectedClient?._count.users ?? 0)} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4" />
                      Nuevo cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Crear cliente / tenant</DialogTitle></DialogHeader>
                    <ClientForm />
                  </DialogContent>
                </Dialog>
                <Button asChild variant="outline">
                  <Link href="/usuarios">
                    <Users className="h-4 w-4" />
                    Ver usuarios globales
                  </Link>
                </Button>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Espacios Qora</p>
                <h2 className="text-2xl font-semibold">Clientes habilitados</h2>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Cada tarjeta es una puerta de entrada. Los usuarios del cliente no ven esta consola: ingresan directo a su Qora asignado.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {clients.map((client) => {
                const isSelected = user.activeClient?.id === client.id;
                const isActive = client.status === "Activo";

                return (
                  <Card key={client.id} className="overflow-hidden bg-white/95 shadow-sm">
                    <div className="border-b p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
                            {initials(client.name)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{client.name}</h3>
                              {isSelected && <StatusBadge value="Seleccionado" />}
                              <StatusBadge value={client.status} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{client.description ?? "Sin descripcion"}</p>
                            <p className="mt-2 text-xs text-muted-foreground">/{client.slug}</p>
                          </div>
                        </div>
                        {isActive ? (
                          <form action={setActiveClient}>
                            <input type="hidden" name="returnTo" value="/dashboard" />
                            <input type="hidden" name="clientId" value={client.id} />
                            <SubmitButton size="sm" pendingText="Entrando...">
                              <ArrowRight className="h-4 w-4" />
                              Entrar al CRM
                            </SubmitButton>
                          </form>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Cliente inactivo
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 border-b bg-slate-50/80 p-5 sm:grid-cols-4">
                      <MiniKpi label="Usuarios" value={String(client._count.users)} />
                      <MiniKpi label="Leads" value={String(client._count.leads)} />
                      <MiniKpi label="Servicios" value={String(client._count.services)} />
                      <MiniKpi label="Espacios" value={String(client._count.spaces)} />
                    </div>

                    <div className="p-5">
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">Usuarios del cliente</p>
                          <p className="text-sm text-muted-foreground">Cuentas que entran directamente a este contexto.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <UserPlus className="h-4 w-4" />
                                Usuario
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Crear usuario para {client.name}</DialogTitle></DialogHeader>
                              <UserForm clientId={client.id} roles={roles} />
                            </DialogContent>
                          </Dialog>
                          <form action={updateClientStatus.bind(null, client.id, isActive ? "Inactivo" : "Activo")}>
                            <SubmitButton size="sm" variant="outline" pendingText="Guardando...">
                              {isActive ? "Deshabilitar" : "Habilitar"}
                            </SubmitButton>
                          </form>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {client.users.length === 0 ? (
                          <div className="rounded-lg border border-dashed bg-slate-50 p-4 text-center text-sm text-muted-foreground">
                            Este cliente aun no tiene usuarios asignados.
                          </div>
                        ) : (
                          client.users.map((clientUser) => (
                            <div key={clientUser.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
                              <div>
                                <p className="font-medium">{clientUser.name}</p>
                                <p className="text-sm text-muted-foreground">{clientUser.email}</p>
                              </div>
                              <StatusBadge value={clientUser.role.name} />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}

function ClientForm() {
  return (
    <form action={createClient} className="grid gap-4 md:grid-cols-2">
      <Field label="Nombre"><Input name="name" placeholder="Ej. Cliente Eventos Norte" /></Field>
      <Field label="Slug"><Input name="slug" placeholder="cliente-eventos-norte" /></Field>
      <Field label="Estado">
        <select name="status" defaultValue="Activo" className="h-10 w-full rounded-md border bg-white px-3 text-sm">
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </Field>
      <Field label="Descripcion"><Textarea name="description" /></Field>
      <div className="flex justify-end md:col-span-2"><SubmitButton pendingText="Creando...">Crear cliente</SubmitButton></div>
    </form>
  );
}

function UserForm({ clientId, roles }: { clientId: string; roles: Array<{ id: string; name: string }> }) {
  return (
    <form action={createUser} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="returnTo" value="/clientes" />
      <Field label="Nombre"><Input name="name" /></Field>
      <Field label="Correo"><Input name="email" type="email" /></Field>
      <Field label="Clave inicial"><Input name="password" type="password" defaultValue="demo" /></Field>
      <Field label="Rol">
        <select name="roleId" className="h-10 w-full rounded-md border bg-white px-3 text-sm">
          {roles.filter((role) => role.name !== "Administrador").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
      </Field>
      <div className="flex justify-end md:col-span-2"><SubmitButton pendingText="Guardando...">Guardar usuario</SubmitButton></div>
    </form>
  );
}

function PortalMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="border-b p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
