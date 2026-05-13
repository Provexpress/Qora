import { BookOpen, Database, Route, Server, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { requireModuleAccess } from "@/lib/auth";

const roleGuides = [
  {
    role: "Administrador",
    focus: "Gobierna usuarios, catálogo, configuración, reportes y control financiero.",
    modules: "Todos los módulos"
  },
  {
    role: "Comercial",
    focus: "Gestiona leads, pipeline, agenda comercial y cotizaciones hasta aceptación.",
    modules: "Comercial, Leads, Pipeline, Agenda, Cotizaciones"
  },
  {
    role: "Operativo",
    focus: "Recibe proyectos ganados, tareas internas, compras, cronograma y cierre de implementacion.",
    modules: "Agenda, Operación, Alistamiento, Asignaciones"
  }
];

const flowSteps = [
  "Lead creado y asignado",
  "Oportunidad en pipeline",
  "Seguimiento y reserva tentativa",
  "Cotización enviada",
  "Cotización aceptada",
  "Proyecto enviado a postventa",
  "Alistamiento, tareas y compras",
  "Cierre del negocio"
];

export default async function SettingsPage() {
  const user = await requireModuleAccess("configuracion");
  const items = [
    ["Nombre del sistema", "Qora CRM"],
    ["Cliente activo", user.activeClient?.name ?? "Provexpress / multi-cliente"],
    ["Estado", "Aplicacion interna activa"],
    ["Infraestructura", "Next.js en Vercel, PostgreSQL en Neon, Prisma ORM"],
    ["Version", "1.0.0"]
  ];

  return (
    <AppShell title="Configuración básica" module="configuracion">
      <PageTransition>
        <ModuleHero
          eyebrow="Parámetros del sistema"
          title="Configuracion central para operar Qora por cliente activo."
          description="Esta seccion documenta el estado del producto, infraestructura recomendada y limites operativos controlados por administracion."
        />
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div>
            <h2 className="mt-6 text-xl font-semibold">Provexpress</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Aplicativo interno CRM para gestión comercial, cotización, agenda, alistamiento, operación y control financiero.
              Los módulos externos como pagos, sitio público e integraciones de terceros permanecen fuera de este alcance.
            </p>
          </Card>
          <Card className="p-0">
            <div className="divide-y">
              {items.map(([label, value]) => (
                <div key={label} className="grid gap-1 p-5 md:grid-cols-[220px_1fr]">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5"><Database className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Persistencia</p><p className="mt-1 text-sm text-muted-foreground">Modelos Prisma conectados a PostgreSQL usando Neon.</p></Card>
          <Card className="p-5"><Server className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Ejecución</p><p className="mt-1 text-sm text-muted-foreground">Ambiente local con npm run dev y despliegue sugerido en Vercel.</p></Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><UsersRound className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">Instructivo por rol</h2>
                <p className="text-sm text-muted-foreground">Guía rápida de operación según la posición desde donde se vea el CRM.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {roleGuides.map((item) => (
                <div key={item.role} className="rounded-lg border bg-slate-50 p-4">
                  <p className="font-semibold">{item.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.focus}</p>
                  <p className="mt-2 text-xs font-medium text-primary">{item.modules}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Route className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">Flujo completo</h2>
                <p className="text-sm text-muted-foreground">Del primer contacto al cierre operativo.</p>
              </div>
            </div>
            <ol className="mt-5 space-y-3">
              {flowSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5 xl:col-span-2">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><BookOpen className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">Manual operativo ampliado</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  El documento completo queda en <span className="font-medium text-foreground">docs/manual-roles-y-flujo.md</span> con responsabilidades, acciones por módulo, flujo recomendado y reglas de uso.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  La comparación frente a CRMs de mercado queda en <span className="font-medium text-foreground">docs/matriz-crm-mercado.md</span>.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}


