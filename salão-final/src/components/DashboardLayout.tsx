import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileDialog, UserProfile } from "@/components/UserProfileDialog";
import AlertCenter from "@/components/AlertCenter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { User, Settings, LogOut, ShieldCheck } from "lucide-react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [tenantLogo, setTenantLogo] = useState<string | undefined>();
  const [tenantName, setTenantName] = useState("Salão Belíssima");
  const [profile, setProfile] = useState<UserProfile>({
    name: "Maria Silva",
    initials: "MS",
    email: "maria.silva@genomni.ao",
    phone: "+244 923 456 789",
    role: "Administradora",
    tenant: "Salão Belíssima",
    createdAt: "12 de Janeiro de 2024",
    lastLogin: "Hoje, 09:42",
  });

  useEffect(() => {
    const tenantRaw = localStorage.getItem("genomni_tenant");
    const userRaw = localStorage.getItem("genomni_user");
    if (tenantRaw) {
      const tenant = JSON.parse(tenantRaw);
      setTenantName(tenant.name || "Meu Salão");
      setTenantLogo(tenant.logo || undefined);
      setProfile(prev => ({ ...prev, tenant: tenant.name }));
    }
    if (userRaw) {
      const user = JSON.parse(userRaw);
      const initials = user.name ? user.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase() : "US";
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        avatar: user.avatar || undefined,
        initials,
        role: user.role || prev.role,
      }));
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar tenantName={tenantName} tenantLogo={tenantLogo} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4 shrink-0">
            <SidebarTrigger />
            <div className="flex-1" />
            <LanguageSwitcher compact />
            <AlertCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm hover:bg-muted/60 rounded-md p-1 pr-2 transition-colors">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="h-8 w-8 rounded-full object-cover border border-border/40" />
                  ) : (
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {profile.initials}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-foreground font-medium text-sm leading-tight">{profile.name}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{profile.role}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="h-4 w-4" /> Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/audit")}>
                  <ShieldCheck className="h-4 w-4" /> Auditoria
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")} className="text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <UserProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profile}
        onUpdate={setProfile}
        isAdmin={profile.role === "Administradora" || profile.role === "Administrador"}
      />
    </SidebarProvider>
  );
};

export default DashboardLayout;
