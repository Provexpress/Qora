import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireModuleAccess } from "@/lib/auth";
import { AppModule } from "@/lib/permissions";

export async function AppShell({ title, module, children }: { title: string; module: AppModule; children: React.ReactNode }) {
  const user = await requireModuleAccess(module);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar roleName={user.role.name} clientName={user.activeClient?.name} />
      <div className="lg:pl-64">
        <Topbar title={title} user={user} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
