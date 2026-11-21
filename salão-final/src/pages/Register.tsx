import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { ArrowLeft, ArrowRight, Building2, UserCog, Sparkles } from "lucide-react";
import ImageUpload from "@/components/register/ImageUpload";
import NIFInput from "@/components/inputs/NIFInput";
import PhoneAOInput from "@/components/inputs/PhoneAOInput";
import PasswordInput from "@/components/inputs/PasswordInput";
import BrandLogo from "@/components/BrandLogo";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidNIF, isValidPhoneAO, evaluatePassword } from "@/lib/validators";
import { recordAcceptance } from "@/lib/legalDocs";
import registerBg from "@/assets/register-bg.jpg";

const Register = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyNif, setCompanyNif] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminPhoto, setAdminPhoto] = useState<File | null>(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const navigate = useNavigate();

  const handleImageChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleContinueToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== adminConfirmPassword) return;
    if (!acceptedLegal) return;

    // Persist registration data for dashboard usage
    const tenantData = {
      name: companyName,
      logo: companyLogoPreview,
      email: companyEmail,
      phone: companyPhone,
      nif: companyNif,
      address: companyAddress,
    };
    const adminData = {
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      avatar: adminPhotoPreview,
      role: "Administrador",
    };
    localStorage.setItem("genomni_tenant", JSON.stringify(tenantData));
    localStorage.setItem("genomni_user", JSON.stringify(adminData));

    // Record legal acceptance audit
    try {
      await recordAcceptance({
        tenantName: companyName,
        userName: adminName,
        userEmail: adminEmail,
      });
    } catch { /* non-blocking */ }

    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src={registerBg} alt="" className="w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-primary/20 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center w-full px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Glass card */}
          <div className="glass rounded-2xl shadow-soft overflow-hidden">
            {/* Header gradient strip */}
            <div className="h-1.5 gradient-hero w-full" />

            <div className="p-6 sm:p-8">
              {/* Logo & Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <BrandLogo variant="register" className="h-12 w-auto" />
                  <span className="font-serif text-lg font-semibold text-foreground" translate="no">GenOmni Salon</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground" translate="no">
                  {step === 1 ? "Cadastrar Empresa" : "Cadastrar Administrador"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {step === 1
                    ? "Preencha os dados da sua empresa para começar"
                    : "Crie a conta do administrador da empresa"}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  step === 1 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                    : "bg-muted/60 text-muted-foreground"
                }`}>
                  <Building2 className="h-3.5 w-3.5" />
                  Empresa
                </div>
                <div className="flex items-center gap-0.5">
                  <div className={`w-2 h-0.5 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-border"}`} />
                  <div className={`w-2 h-0.5 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-border"}`} />
                  <div className={`w-2 h-0.5 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-border"}`} />
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  step === 2 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                    : "bg-muted/60 text-muted-foreground"
                }`}>
                  <UserCog className="h-3.5 w-3.5" />
                  Admin
                </div>
              </div>

              {/* Forms */}
              {step === 1 ? (
                <form onSubmit={handleContinueToAdmin} className="space-y-4">
                  <ImageUpload
                    label="Logótipo da Empresa"
                    preview={companyLogoPreview}
                    onChange={(file) => handleImageChange(file, setCompanyLogo, setCompanyLogoPreview)}
                    icon={<Building2 className="h-5 w-5" />}
                    shape="rounded"
                  />

                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-xs font-medium" translate="no">Nome da Empresa *</Label>
                      <Input id="companyName" placeholder="Salão Beleza Pura" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required translate="no" className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="companyEmail" className="text-xs font-medium" translate="no">E-mail *</Label>
                        <Input id="companyEmail" type="email" placeholder="contato@salao.co.ao" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} required translate="no" className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors" />
                      </div>
                      <PhoneAOInput value={companyPhone} onChange={setCompanyPhone} label="Telefone" required id="companyPhone" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <NIFInput value={companyNif} onChange={setCompanyNif} label="NIF" required id="companyNif" />
                      <div className="space-y-1.5">
                        <Label htmlFor="companyAddress" className="text-xs font-medium" translate="no">Endereço <span className="text-muted-foreground">(opcional)</span></Label>
                        <Input id="companyAddress" placeholder="Rua da Missão, Luanda" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} translate="no" className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={!isValidNIF(companyNif) || !isValidPhoneAO(companyPhone)} className="w-full h-11 gap-2 gradient-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 mt-2">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <ImageUpload
                    label="Foto do Administrador"
                    preview={adminPhotoPreview}
                    onChange={(file) => handleImageChange(file, setAdminPhoto, setAdminPhotoPreview)}
                    icon={<UserCog className="h-5 w-5" />}
                    shape="circle"
                  />

                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="adminName" className="text-xs font-medium" translate="no">Nome Completo *</Label>
                      <Input id="adminName" placeholder="Maria Silva" value={adminName} onChange={(e) => setAdminName(e.target.value)} required translate="no" className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="adminEmail" className="text-xs font-medium" translate="no">E-mail *</Label>
                        <Input id="adminEmail" type="email" placeholder="maria@salao.co.ao" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required translate="no" className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors" />
                      </div>
                      <PhoneAOInput value={adminPhone} onChange={setAdminPhone} label="Telefone" required id="adminPhone" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PasswordInput value={adminPassword} onChange={setAdminPassword} label="Senha" required id="adminPassword" />
                      <PasswordInput value={adminConfirmPassword} onChange={setAdminConfirmPassword} label="Confirmar Senha" required id="adminConfirmPassword" showStrength={false} showHint={false} />
                    </div>
                    {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
                      <p className="text-xs text-destructive -mt-2">As senhas não coincidem</p>
                    )}
                  </div>

                  {/* Legal acceptance */}
                  <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                    <Checkbox id="legal-accept" checked={acceptedLegal} onCheckedChange={(v) => setAcceptedLegal(v === true)} className="mt-0.5" />
                    <Label htmlFor="legal-accept" className="text-xs leading-relaxed cursor-pointer">
                      Li e aceito os{" "}
                      <Link to="/legal/terms" target="_blank" className="text-primary hover:underline font-medium">Termos de Uso</Link>,{" "}
                      <Link to="/legal/privacy" target="_blank" className="text-primary hover:underline font-medium">Política de Privacidade</Link>{" "}
                      e o{" "}
                      <Link to="/legal/contract" target="_blank" className="text-primary hover:underline font-medium">Contrato da Plataforma</Link>.
                    </Label>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-1.5 h-11 border-border/60 bg-background/50 hover:bg-background">
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!acceptedLegal || !isValidPhoneAO(adminPhone) || evaluatePassword(adminPassword).score < 2 || adminPassword !== adminConfirmPassword}
                      className="flex-1 h-11 gap-2 gradient-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                      <Sparkles className="h-4 w-4" /> Criar Conta
                    </Button>
                  </div>
                </form>
              )}

              {/* Footer links */}
              <div className="mt-6 pt-4 border-t border-border/40 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
                </p>
                <p className="text-xs">
                  <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Voltar ao início</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Success Dialog */}
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader className="items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <DialogTitle className="font-serif text-xl">Cadastro Realizado com Sucesso!</DialogTitle>
                <DialogDescription>
                  A sua empresa e conta de administrador foram criadas. Você já pode aceder ao sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                  Voltar para a página inicial
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>
                  Entrar no sistema
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Register;
