// Motor de ciclo de vida de assinaturas (tenants)
// Híbrido: cálculo automático com base em nextBilling + overrides manuais do Super Admin.

export type StoredStatus = "trial" | "active" | "suspended" | "cancelled";

export type LifecycleStatus =
  | "trial"
  | "active"
  | "expiring_soon" // <= 15 dias para expirar
  | "grace"         // expirou há <= 5 dias (acesso mantido)
  | "expired"       // > 5 dias sem renovar (corte automático)
  | "suspended"     // corte manual ou automático
  | "cancelled";    // cancelado pelo Super Admin

export interface TenantEvent {
  id: string;
  at: string; // ISO
  type:
    | "created"
    | "renewed"
    | "extended"
    | "suspended"
    | "reactivated"
    | "cancelled"
    | "plan_changed"
    | "auto_grace"
    | "auto_suspended"
    | "invoice_generated";
  by: string; // usuário responsável
  note?: string;
}

// Janelas (ajustáveis por configuração no futuro)
export const EXPIRING_SOON_DAYS = 15;
export const GRACE_PERIOD_DAYS = 5;

export function daysBetween(dateISO: string, ref: Date = new Date()): number {
  const target = new Date(dateISO + "T00:00:00");
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function computeLifecycle(args: {
  storedStatus: StoredStatus;
  nextBilling: string;
}): { status: LifecycleStatus; daysLeft: number } {
  const daysLeft = daysBetween(args.nextBilling);

  if (args.storedStatus === "cancelled") return { status: "cancelled", daysLeft };
  if (args.storedStatus === "suspended") return { status: "suspended", daysLeft };

  if (daysLeft > EXPIRING_SOON_DAYS) {
    return { status: args.storedStatus === "trial" ? "trial" : "active", daysLeft };
  }
  if (daysLeft > 0) return { status: "expiring_soon", daysLeft };
  if (daysLeft >= -GRACE_PERIOD_DAYS) return { status: "grace", daysLeft };
  return { status: "expired", daysLeft };
}

export const lifecycleLabel: Record<LifecycleStatus, string> = {
  trial: "Em Trial",
  active: "Ativa",
  expiring_soon: "A expirar",
  grace: "Período de tolerância",
  expired: "Expirada",
  suspended: "Suspensa",
  cancelled: "Cancelada",
};

export const lifecycleStyle: Record<LifecycleStatus, string> = {
  trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  expiring_soon: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  grace: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  expired: "bg-destructive/10 text-destructive border-destructive/30",
  suspended: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

// Semáforo visual com base em dias restantes
export function trafficLight(daysLeft: number): { color: string; label: string } {
  if (daysLeft > 15) return { color: "bg-emerald-500", label: `${daysLeft} dias` };
  if (daysLeft > 5) return { color: "bg-amber-500", label: `${daysLeft} dias` };
  if (daysLeft > 0) return { color: "bg-orange-500", label: `${daysLeft} dias` };
  if (daysLeft >= -GRACE_PERIOD_DAYS) return { color: "bg-red-500", label: `Tolerância ${Math.abs(daysLeft)}d` };
  return { color: "bg-gray-500", label: `Expirou há ${Math.abs(daysLeft)}d` };
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function newEvent(type: TenantEvent["type"], by: string, note?: string): TenantEvent {
  return {
    id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    type,
    by,
    note,
  };
}

export const eventLabel: Record<TenantEvent["type"], string> = {
  created: "Empresa criada",
  renewed: "Assinatura renovada",
  extended: "Prazo estendido",
  suspended: "Acesso suspenso",
  reactivated: "Acesso reativado",
  cancelled: "Assinatura cancelada",
  plan_changed: "Plano alterado",
  auto_grace: "Entrou em tolerância (auto)",
  auto_suspended: "Suspenso automaticamente",
  invoice_generated: "Fatura gerada",
};
