import { LayoutDashboard, Building2, LifeBuoy, FileSearch, Crown, LogOut, Settings, PanelBottom, Palette, Scale } from "lucide-react";
import genomniLogo from "@/assets/genomni-logo.png";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const items = [
  { title: "Visão Geral", url: "/super-admin", icon: LayoutDashboard },
  { title: "Empresas", url: "/super-admin/tenants", icon: Building2 },
  { title: "Suporte Técnico", url: "/super-admin/support", icon: LifeBuoy },
  { title: "Logs da Plataforma", url: "/super-admin/logs", icon: FileSearch },
  { title: "Branding & Aparência", url: "/super-admin/branding", icon: Palette },
  { title: "Termos & Políticas", url: "/super-admin/legal", icon: Scale },
  { title: "Configurações", url: "/super-admin/settings", icon: Settings },
  { title: "Rodapé do Site", url: "/super-admin/footer", icon: PanelBottom },
];

export function SuperAdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const handleNavClick = () => { if (isMobile) setOpenMobile(false); };
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
    toast.success("Sessão de Super Admin terminada");
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <img src={genomniLogo} alt="GenOmni" className="h-8 w-8 rounded-lg object-contain shrink-0 drop-shadow-sm" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-serif font-bold text-sidebar-foreground text-sm leading-tight">Super Admin</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">GenOmni Platform</span>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/super-admin"}
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
              Tem a certeza de que deseja sair do painel de Super Admin?
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
