export const roleNames = ["Administrador", "Comercial", "Operativo"] as const;

export type KnownRole = (typeof roleNames)[number];

export type AppModule =
  | "dashboard"
  | "clientes"
  | "asignaciones"
  | "reportes"
  | "comercial"
  | "leads"
  | "pipeline"
  | "cotizaciones"
  | "operacion"
  | "alistamiento"
  | "agenda"
  | "financiero"
  | "catalogo"
  | "usuarios"
  | "configuracion";

export type NavigationItem = {
  module: AppModule;
  href: string;
  label: string;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const allRoles = roleNames;
const salesRoles = ["Administrador", "Comercial"] as const;
const opsRoles = ["Administrador", "Operativo"] as const;

export const moduleAccess: Record<AppModule, readonly KnownRole[]> = {
  dashboard: allRoles,
  clientes: ["Administrador"],
  asignaciones: allRoles,
  reportes: salesRoles,
  comercial: salesRoles,
  leads: salesRoles,
  pipeline: salesRoles,
  cotizaciones: salesRoles,
  operacion: opsRoles,
  alistamiento: opsRoles,
  agenda: allRoles,
  financiero: ["Administrador"],
  catalogo: salesRoles,
  usuarios: ["Administrador"],
  configuracion: ["Administrador"]
};

export const navigationSections: NavigationSection[] = [
  {
    label: "Visión general",
    items: [
      { module: "dashboard", href: "/dashboard", label: "Dashboard" },
      { module: "asignaciones", href: "/asignaciones", label: "Asignaciones" },
      { module: "reportes", href: "/reportes", label: "Reportes" }
    ]
  },
  {
    label: "Comercial",
    items: [
      { module: "comercial", href: "/comercial", label: "Mesa comercial" },
      { module: "leads", href: "/leads", label: "Leads" },
      { module: "pipeline", href: "/pipeline", label: "Pipeline" },
      { module: "cotizaciones", href: "/cotizaciones", label: "Cotizaciones" }
    ]
  },
  {
    label: "Operación",
    items: [
      { module: "operacion", href: "/operacion", label: "Eventos ganados" },
      { module: "alistamiento", href: "/alistamiento", label: "Alistamiento" },
      { module: "agenda", href: "/agenda", label: "Agenda" }
    ]
  },
  {
    label: "Administración",
    items: [
      { module: "financiero", href: "/financiero", label: "Financiero" },
      { module: "catalogo", href: "/catalogo", label: "Catálogo" },
      { module: "usuarios", href: "/usuarios", label: "Usuarios" },
      { module: "configuracion", href: "/configuracion", label: "Configuración" }
    ]
  }
];

const modulePaths: Array<{ module: AppModule; href: string }> = navigationSections
  .flatMap((section) => section.items.map((item) => ({ module: item.module, href: item.href })))
  .sort((a, b) => b.href.length - a.href.length);

export function canAccessModule(roleName: string | null | undefined, module: AppModule) {
  if (!roleName) return false;
  return moduleAccess[module].includes(roleName as KnownRole);
}

export function getModuleForPath(pathname: string) {
  return modulePaths.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.module ?? null;
}

export function canAccessPath(roleName: string | null | undefined, pathname: string) {
  const module = getModuleForPath(pathname);
  if (!module) return true;
  return canAccessModule(roleName, module);
}

export function getNavigationForRole(roleName: string | null | undefined) {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessModule(roleName, item.module))
    }))
    .filter((section) => section.items.length > 0);
}

export function getDefaultPathForRole(roleName: string | null | undefined) {
  if (roleName === "Operativo") return "/operacion";
  if (roleName === "Comercial") return "/comercial";
  return "/clientes";
}
