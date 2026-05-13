import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/crm/status-badge";

export function AgendaItem({ title, subtitle, date, status, detail }: { title: string; subtitle: string; date: Date; status: string; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> {format(date, "PPP p", { locale: es })}</p>
        {detail && <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {detail}</p>}
      </div>
      <StatusBadge value={status} />
    </div>
  );
}
