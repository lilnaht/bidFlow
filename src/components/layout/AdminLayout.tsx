import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  FileText,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Search,
  Settings,
  UserCog,
  Users,
  Layers3,
  Package,
  PieChart,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchRequests } from "@/integrations/supabase/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/use-settings";
import logoMark from "@/assets/logo2.png";

const navItems = [
  { title: "Painel", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Solicitacoes", href: "/admin/solicitacoes", icon: Inbox },
  { title: "Orcamentos", href: "/admin/orcamentos", icon: FileText },
  { title: "Clientes", href: "/admin/clientes", icon: Users },
  { title: "Servicos", href: "/admin/servicos", icon: Package },
  { title: "Templates", href: "/admin/templates", icon: Layers3 },
  { title: "Faturas", href: "/admin/faturas", icon: CreditCard },
  { title: "Tarefas", href: "/admin/tarefas", icon: ListTodo },
  { title: "Usuarios", href: "/admin/usuarios", icon: UserCog },
  { title: "Relatorios", href: "/admin/relatorios", icon: PieChart },
  { title: "Configuracoes", href: "/admin/configuracoes", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { companyName } = useSettings();
  const { data: requests = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });
  const newRequestsCount = requests.filter((request) => request.status === "new").length;

  useEffect(() => {
    const channel = supabase
      .channel("crm-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => queryClient.invalidateQueries({ queryKey: ["requests"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotes" },
        () => queryClient.invalidateQueries({ queryKey: ["quotes"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => queryClient.invalidateQueries({ queryKey: ["clients"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        () => queryClient.invalidateQueries({ queryKey: ["clients"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        () => queryClient.invalidateQueries({ queryKey: ["settings"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_items" },
        () => queryClient.invalidateQueries({ queryKey: ["quotes"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => queryClient.invalidateQueries({ queryKey: ["services"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proposal_templates" },
        () => queryClient.invalidateQueries({ queryKey: ["templates"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => queryClient.invalidateQueries({ queryKey: ["invoices"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attachments" },
        () => queryClient.invalidateQueries({ queryKey: ["attachments"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_versions" },
        () => queryClient.invalidateQueries({ queryKey: ["quote_versions"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_acceptances" },
        () => queryClient.invalidateQueries({ queryKey: ["quote_acceptances"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_events" },
        () => queryClient.invalidateQueries({ queryKey: ["quote_events"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log" },
        () => queryClient.invalidateQueries({ queryKey: ["activity"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link to="/" className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary/10">
              <img
                src={logoMark}
                alt={companyName ? `${companyName} logo` : "Logo"}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold text-sidebar-foreground">
                {companyName}
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Painel administrativo
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link to={item.href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
          <SidebarSeparator />
          <div className="px-2">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/70">
              <p className="mb-3 leading-relaxed">
                {newRequestsCount > 0
                  ? `Voce tem ${newRequestsCount} solicitacoes novas aguardando retorno.`
                  : "Sem solicitacoes novas no momento."}
              </p>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link to="/admin/solicitacoes">Ver fila</Link>
              </Button>
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="space-y-2 rounded-lg bg-sidebar-accent/30 p-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {(user?.email?.slice(0, 2) ?? "NA").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  {user?.email ?? "Administrador"}
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Acesso autenticado
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-background/80 px-6 py-4 backdrop-blur">
          <SidebarTrigger />
          <div className="flex flex-1 items-center gap-3">
            <div className="relative hidden w-full max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes, propostas ou projetos"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {newRequestsCount > 0 && (
                <span
                  className={cn(
                    "absolute right-2 top-2 h-2 w-2 rounded-full bg-status-new"
                  )}
                />
              )}
            </Button>
          </div>
        </header>
        <div className="flex-1 space-y-8 px-6 py-8 lg:px-10">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
