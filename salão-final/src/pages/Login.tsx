import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Zap, Shield, Users } from "lucide-react";
import PasswordInput from "@/components/inputs/PasswordInput";
import BrandLogo from "@/components/BrandLogo";
import registerBg from "@/assets/register-bg.jpg";

const highlights = [
  { icon: Zap, text: "Gestão inteligente de salão de beleza" },
  { icon: Shield, text: "Segurança e controlo multi-tenant" },
  { icon: Users, text: "Equipas, clientes e agenda integrados" },
  { icon: CheckCircle, text: "Relatórios e comissões automatizados" },
];

const TEST_ACCOUNTS = [
  { email: "superadmin@genomni.ao", password: "super1234", role: "Super Admin", name: "Carlos Mendes", redirect: "/super-admin" },
  { email: "admin@salao.ao", password: "admin1234", role: "Administrador", name: "Maria Silva", redirect: "/dashboard" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const account = TEST_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (account) {
      localStorage.setItem("genomni_user", JSON.stringify({ name: account.name, email: account.email, role: account.role }));
      if (account.role !== "Super Admin") {
        const tenantRaw = localStorage.getItem("genomni_tenant");
        if (!tenantRaw) {
          localStorage.setItem("genomni_tenant", JSON.stringify({ name: "Salão Belíssima", email: "contato@salao.ao", phone: "+244 923 456 789" }));
        }
      }
      navigate(account.redirect);
    } else {
      setError("E-mail ou senha incorrectos. Use uma conta de teste.");
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={registerBg} alt="" className="w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-primary/20 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center w-full px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="glass rounded-2xl shadow-soft overflow-hidden">
            <div className="h-1.5 gradient-hero w-full" />

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left side — System Info */}
              <div className="hidden md:flex p-6 sm:p-8 flex-col justify-center bg-primary/5 border-r border-border/30">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <BrandLogo variant="login" className="h-12 w-auto drop-shadow-md" />
                    <span className="font-serif text-lg font-semibold text-foreground" translate="no">GenOmni Salon</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                    A plataforma de gestão para salões de excelência
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Aceda ao seu painel de controlo para gerir agendamentos, equipas, stock e finanças num só lugar.
                  </p>
                </div>

                <div className="space-y-3">
                  {highlights.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/30">
                        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.text}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Não tem uma conta?{" "}
                    <Link to="/register" className="text-primary hover:underline font-medium">
                      Cadastre a sua empresa
                    </Link>
                  </p>
                </div>
              </div>

              {/* Right side — Login Form */}
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <h1 className="font-serif text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
                  <p className="text-sm text-muted-foreground mt-1">Insira as suas credenciais para aceder ao painel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium" translate="no">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      translate="no"
                      className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors"
                    />
                  </div>

                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    label="Senha"
                    id="password"
                    required
                    showStrength={false}
                    showHint={false}
                  />

                  {error && (
                    <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-md">{error}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <Link to="#" className="text-xs text-primary hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 mt-2">
                    Entrar
                  </Button>
                </form>

                {/* Test credentials */}
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <p className="text-xs font-semibold text-foreground">🔐 Contas de Teste:</p>
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">Super Admin:</span> superadmin@genomni.ao / super1234
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">Admin Salão:</span> admin@salao.ao / admin1234
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/40 text-center">
                  <p className="text-xs">
                    <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Voltar ao início</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
