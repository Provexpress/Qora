import { AppShell } from "@/components/layout/app-shell";
import { AppModule } from "@/lib/permissions";

export function LoadingScreen({ title = "Cargando", module = "dashboard" }: { title?: string; module?: AppModule }) {
  return (
    <AppShell title={title} module={module}>
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 rounded-lg border bg-white shadow-soft">
              <div className="p-5">
                <div className="h-3 w-28 rounded bg-slate-200" />
                <div className="mt-5 h-7 w-20 rounded bg-slate-200" />
                <div className="mt-4 h-3 w-40 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-80 rounded-lg border bg-white shadow-soft">
              <div className="space-y-4 p-5">
                <div className="h-4 w-44 rounded bg-slate-200" />
                {Array.from({ length: 5 }).map((__, row) => (
                  <div key={row} className="h-12 rounded-md bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
