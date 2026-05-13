"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  KanbanSquare,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  Tags,
  Users,
  UserRoundCheck,
  UserRoundPlus,
  WalletCards
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppModule, getNavigationForRole } from "@/lib/permissions";

const icons: Record<AppModule, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  clientes: Building2,
  asignaciones: UserRoundCheck,
  reportes: LineChart,
  comercial: BriefcaseBusiness,
  leads: UserRoundPlus,
  pipeline: KanbanSquare,
  cotizaciones: ListChecks,
  operacion: ClipboardList,
  alistamiento: ClipboardCheck,
  agenda: CalendarDays,
  financiero: WalletCards,
  catalogo: Tags,
  usuarios: Users,
  configuracion: Settings
};

export function Sidebar({ roleName, clientName }: { roleName: string; clientName?: string | null }) {
  const pathname = usePathname();
  const sections = getNavigationForRole(roleName);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white/90 backdrop-blur lg:block">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Qora CRM</p>
          <p className="text-xs text-muted-foreground">{clientName ?? "Provexpress"}</p>
        </div>
      </div>
      <nav className="h-[calc(100vh-4rem)] space-y-5 overflow-y-auto p-3 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase text-muted-foreground">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = icons[item.module];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                      active ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
