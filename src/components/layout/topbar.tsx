import Link from "next/link";
import { Bell, Building2, LogOut, Search, ShieldCheck, Sparkles } from "lucide-react";
import { logout } from "@/actions/auth";
import { AuthUser } from "@/lib/auth";
import { initials } from "@/lib/utils";

export function Topbar({ title, user }: { title: string; user: AuthUser }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">CRM interno</p>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 md:inline-flex">
              Aplicación activa
            </span>
          </div>
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden h-10 min-w-72 items-center gap-2 rounded-md border bg-slate-50 px-3 text-sm text-muted-foreground shadow-sm md:flex">
            <Search className="h-4 w-4" />
            Buscar cliente, cotización, reserva o código
          </div>
          <div className="hidden items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-medium text-slate-600 xl:flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {user.activeClient?.name ?? "Sin cliente activo"}
          </div>
          {user.role.name === "Administrador" && (
            <Link
              href="/clientes"
              className="hidden h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-muted md:inline-flex"
            >
              <Building2 className="h-4 w-4" />
              Clientes
            </Link>
          )}
          <button className="rounded-md border bg-white p-2.5 text-muted-foreground shadow-sm transition hover:bg-muted" aria-label="Notificaciones">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{initials(user.name)}</div>
            <div className="hidden leading-tight md:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                {user.role.name}
              </p>
            </div>
          </div>
          <form action={logout}>
            <button className="rounded-md border bg-white p-2.5 text-muted-foreground shadow-sm transition hover:bg-muted" aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
