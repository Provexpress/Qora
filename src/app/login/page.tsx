import { ArrowRight, Building2, LockKeyhole, ShieldCheck } from "lucide-react";
import { login } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const hasError = params.error === "credenciales";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-soft md:grid-cols-[1.1fr_0.9fr]">
        <section className="border-r bg-gradient-to-br from-white via-violet-50/60 to-sky-50 p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-12 text-sm font-semibold uppercase tracking-wide text-primary">Qora CRM</p>
          <h1 className="mt-3 max-w-md text-4xl font-semibold tracking-normal text-foreground">
            CRM comercial y operativo para clientes Provexpress
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Plataforma interna desarrollada por Provexpress para gestionar leads, pipeline, cotizaciones, reservas,
            alistamiento, operacion y rentabilidad en un solo flujo.
          </p>
          <div className="mt-10 grid gap-3 rounded-xl border bg-white/75 p-4 text-sm text-muted-foreground">
            <p>Lead nuevo {"->"} pipeline comercial {"->"} cotizacion {"->"} negocio ganado {"->"} alistamiento {"->"} cierre operativo.</p>
            <p>Roles disponibles: Administrador, Comercial y Operativo.</p>
          </div>
        </section>
        <section className="p-8 md:p-10">
          <Card className="border-0 p-0 shadow-none">
            <div className="mb-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold">Ingreso a Qora</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Accede con tu usuario asignado para ver solo los modulos de tu rol y tu cliente autorizado.
              </p>
            </div>
            <form action={login} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Correo</label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@empresa.com"
                  className="mt-1.5 h-10 w-full rounded-md border px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Clave</label>
                <input
                  name="password"
                  autoComplete="current-password"
                  placeholder="Clave asignada"
                  type="password"
                  className="mt-1.5 h-10 w-full rounded-md border px-3 text-sm"
                />
              </div>
              {hasError && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  Correo o clave incorrectos.
                </div>
              )}
              <SubmitButton className="w-full" pendingText="Ingresando...">
                Entrar al CRM
                <ArrowRight className="h-4 w-4" />
              </SubmitButton>
            </form>
            <div className="mt-6 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Acceso privado
              </p>
              <p className="mt-2">Las credenciales de demostracion y produccion se entregan por canal interno autorizado.</p>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
