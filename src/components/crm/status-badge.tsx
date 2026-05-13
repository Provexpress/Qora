import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  Activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactivo: "bg-slate-100 text-slate-700 border-slate-200",
  Seleccionado: "bg-violet-50 text-violet-700 border-violet-200",
  Administrador: "bg-violet-50 text-violet-700 border-violet-200",
  Comercial: "bg-blue-50 text-blue-700 border-blue-200",
  Operativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Nuevo: "bg-blue-50 text-blue-700 border-blue-200",
  "En operación": "bg-sky-50 text-sky-700 border-sky-200",
  "Evento finalizado": "bg-slate-100 text-slate-700 border-slate-200",
  Perdido: "bg-rose-50 text-rose-700 border-rose-200",
  "Lead perdido": "bg-rose-50 text-rose-700 border-rose-200",
  "Bloqueado comercial": "bg-slate-100 text-slate-700 border-slate-200",
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Finalizada: "bg-slate-100 text-slate-700 border-slate-200",
  Finalizado: "bg-slate-100 text-slate-700 border-slate-200",
  Cancelada: "bg-rose-50 text-rose-700 border-rose-200",
  Borrador: "bg-slate-100 text-slate-700 border-slate-200",
  Enviada: "bg-violet-50 text-violet-700 border-violet-200",
  Aceptada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rechazada: "bg-rose-50 text-rose-700 border-rose-200",
  Vencida: "bg-orange-50 text-orange-700 border-orange-200",
  "Pendiente de planeación": "bg-amber-50 text-amber-700 border-amber-200",
  "Planeación en curso": "bg-blue-50 text-blue-700 border-blue-200",
  "Alistamiento en curso": "bg-sky-50 text-sky-700 border-sky-200",
  "Montaje programado": "bg-violet-50 text-violet-700 border-violet-200",
  "En ejecución": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Ganado / Operación": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Comprado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Contratado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "No requerido": "bg-slate-100 text-slate-700 border-slate-200",
  "En proceso": "bg-blue-50 text-blue-700 border-blue-200",
  Bloqueado: "bg-rose-50 text-rose-700 border-rose-200",
  Ejecutado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "En preparación": "bg-blue-50 text-blue-700 border-blue-200",
  Listo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Entregado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Alta: "bg-rose-50 text-rose-700 border-rose-200",
  Media: "bg-amber-50 text-amber-700 border-amber-200",
  Baja: "bg-sky-50 text-sky-700 border-sky-200"
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", toneMap[value] ?? "bg-muted text-muted-foreground", className)}>
      {value}
    </span>
  );
}
