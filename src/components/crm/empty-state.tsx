import { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-white/70 p-8 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
