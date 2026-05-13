import { KeyRound, Plus, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { createUser, resetUserPassword, updateUserRole } from "@/actions/users";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { selectedClientId } from "@/lib/scopes";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await requireModuleAccess("usuarios");
  const clientId = selectedClientId(currentUser);
  const [users, roles, clients] = await Promise.all([
    prisma.user.findMany({
      where: clientId ? { OR: [{ clientId }, { clientId: null }] } : {},
      include: { role: true, client: true, _count: { select: { leads: true, opportunities: true, activities: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { status: "Activo" }, orderBy: { name: "asc" } })
  ]);
  const assignedWork = users.reduce((sum, user) => sum + user._count.leads + user._count.opportunities + user._count.activities, 0);

  return (
    <AppShell title="Usuarios / roles" module="usuarios">
      <PageTransition>
        <ModuleHero
          eyebrow="Seguridad y permisos"
          title="Usuarios reales por rol, con acceso limitado al trabajo que les corresponde."
          description="El administrador controla responsables comerciales, equipo operativo y accesos internos desde una sola vista."
        />

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Kpi label="Usuarios" value={String(users.length)} />
          <Kpi label="Roles" value={String(roles.length)} />
          <Kpi label="Asignaciones" value={String(assignedWork)} />
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Equipo</h2>
            <p className="text-sm text-muted-foreground">Administra credenciales, roles y carga asociada.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Usuario</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear usuario</DialogTitle></DialogHeader>
              <form action={createUser} className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre"><Input name="name" /></Field>
                <Field label="Correo"><Input name="email" type="email" /></Field>
                <Field label="Clave inicial"><Input name="password" type="password" defaultValue="demo" /></Field>
                <Field label="Rol">
                  <RoleSelect roles={roles} />
                </Field>
                <Field label="Cliente asignado">
                  <ClientSelect clients={clients} defaultValue={clientId ?? ""} />
                </Field>
                <div className="md:col-span-2 flex justify-end"><SubmitButton pendingText="Guardando...">Guardar usuario</SubmitButton></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{initials(user.name)}</div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.client?.name ?? "Provexpress / multi-cliente"}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {user.role.name}
                </span>
              </div>

              <div className="mt-5 rounded-lg border bg-slate-50 p-4 text-sm">
                <p className="font-medium">Carga asociada</p>
                <p className="mt-2 text-muted-foreground">
                  {user._count.leads} leads · {user._count.opportunities} oportunidades · {user._count.activities} actividades
                </p>
              </div>

              <div className="mt-4 grid gap-2">
                <form action={updateUserRole.bind(null, user.id)} className="flex gap-2">
                  <select name="roleId" defaultValue={user.roleId} className="h-10 min-w-0 flex-1 rounded-md border bg-white px-3 text-sm">
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  <SubmitButton variant="outline" size="sm" pendingText="Guardando...">Cambiar rol</SubmitButton>
                </form>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><KeyRound className="h-4 w-4" /> Restablecer clave</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Restablecer clave de {user.name}</DialogTitle></DialogHeader>
                    <form action={resetUserPassword.bind(null, user.id)} className="space-y-4">
                      <Field label="Nueva clave"><Input name="password" type="password" defaultValue="demo" /></Field>
                      <div className="flex justify-end"><SubmitButton pendingText="Actualizando...">Actualizar clave</SubmitButton></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function ClientSelect({ clients, defaultValue }: { clients: Array<{ id: string; name: string }>; defaultValue: string }) {
  return (
    <select name="clientId" defaultValue={defaultValue} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
      <option value="">Provexpress / multi-cliente</option>
      {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
    </select>
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

function RoleSelect({ roles }: { roles: Array<{ id: string; name: string }> }) {
  return (
    <select name="roleId" className="h-10 w-full rounded-md border bg-white px-3 text-sm">
      {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
    </select>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
