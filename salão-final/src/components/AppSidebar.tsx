import {
  LayoutDashboard, Calendar, Scissors, Users, UserCheck, Package, DollarSign,
  BarChart3, Wallet, Settings, LogOut, ShieldCheck, Bell, Clock, Banknote,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda", url: "/dashboard/agenda", icon: Calendar },
  { title: "Clientes", url: "/dashboard/clients", icon: Users },
  { title: "Serviços", url: "/dashboard/services", icon: Scissors },
];

const teamItems = [
  { title: "Funcionários", url: "/dashboard/employees", icon: UserCheck },
  { title: "Ponto Eletrónico", url: "/dashboard/attendance", icon: Clock },
  { title: "Folha Salarial", url: "/dashboard/payroll", icon: Banknote },
  { title: "Comissões", url: "/dashboard/commissions", icon: DollarSign },
];

const businessItems = [
  { title: "Financeiro", url: "/dashboard/financial", icon: BarChart3 },
  { title: "Caixa", url: "/dashboard/cashier", icon: Wallet },
  { title: "A Receber", url: "/dashboard/receivables", icon: DollarSign },
  { title: "Estoque", url: "/dashboard/stock", icon: Package },
];

const systemItems = [
  { title: "Alertas Inteligentes", url: "/dashboard/alerts", icon: Bell },
  { title: "Auditoria", url: "/dashboard/audit", icon: ShieldCheck },
  { title: "Configurações", url: "/dashboard/settings", icon: Settings },
];


interface AppSidebarProps {
  tenantName?: string;
  tenantLogo?: string;
}

export function AppSidebar({ tenantName = "Salão Belíssima", tenantLogo }: AppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const handleNavClick = () => { if (isMobile) setOpenMobile(false); };
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
    toast.success("Sessão terminada com sucesso");
    navigate("/");
  };

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  onClick={handleNavClick}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          {tenantLogo ? (
            <img src={tenantLogo} alt={tenantName} className="h-8 w-8 rounded-lg object-contain shrink-0 border border-border/40 shadow-sm" />
          ) : (
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
              {tenantName.substring(0, 2).toUpperCase()}
            </div>
          )}
          {!collapsed && <span className="font-serif font-bold text-sidebar-foreground text-lg truncate">{tenantName}</span>}
        </div>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Equipa", teamItems)}
        {renderGroup("Negócio", businessItems)}
        {renderGroup("Sistema", systemItems)}

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setLogoutOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza de que deseja sair do sistema? Será redirecionado para a página inicial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
