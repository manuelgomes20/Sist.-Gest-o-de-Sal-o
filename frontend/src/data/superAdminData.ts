import type { TenantEvent, StoredStatus } from "@/lib/subscriptionEngine";

// Mantemos "expired" como alias visual antigo, mas internamente usamos StoredStatus
export type TenantStatus = StoredStatus | "expired";
export type SupportStatus = "open" | "in_progress" | "resolved";
export type SupportPriority = "low" | "medium" | "high" | "critical";

export interface Tenant {
  id: string;
  name: string;
  nif: string;
  owner: string;
  email: string;
  phone: string;
  city: string;
  plan: "Essencial" | "Profissional" | "Premium";
  status: StoredStatus;            // estado persistido (overrides manuais)
  users: number;
  monthlyRevenue: number;
  createdAt: string;
  lastAccess: string;
  nextBilling: string;             // data alvo da próxima cobrança / expiração
  billingCycle: "monthly" | "yearly";
  autoSuspend: boolean;            // corte automático após período de tolerância
  events: TenantEvent[];           // timeline de auditoria
}

export const mockTenants: Tenant[] = [
  { id: "T-001", name: "Bella Studio Salon", nif: "5417823901", owner: "Maria Silva", email: "contato@bellastudio.ao", phone: "(923) 100-200", city: "Luanda", plan: "Premium", status: "active", users: 12, monthlyRevenue: 1950000, createdAt: "2025-08-15", lastAccess: "2026-06-28", nextBilling: "2026-07-15", billingCycle: "monthly", autoSuspend: true, events: [{ id: "EV-1", at: "2025-08-15T10:00:00Z", type: "created", by: "Sistema" }, { id: "EV-2", at: "2026-06-15T08:00:00Z", type: "renewed", by: "Sistema", note: "Renovação automática mensal" }] },
  { id: "T-002", name: "Glamour Beauty Center", nif: "5418923022", owner: "Joana Pires", email: "geral@glamour.ao", phone: "(924) 300-400", city: "Benguela", plan: "Profissional", status: "active", users: 8, monthlyRevenue: 1280000, createdAt: "2025-10-02", lastAccess: "2026-06-27", nextBilling: "2026-07-05", billingCycle: "monthly", autoSuspend: true, events: [{ id: "EV-3", at: "2025-10-02T09:00:00Z", type: "created", by: "Sistema" }] },
  { id: "T-003", name: "Estilo & Arte Cabeleireiros", nif: "5419023144", owner: "Patrícia Mendes", email: "estilo@arte.ao", phone: "(925) 500-600", city: "Huambo", plan: "Essencial", status: "trial", users: 3, monthlyRevenue: 420000, createdAt: "2026-06-15", lastAccess: "2026-06-28", nextBilling: "2026-06-30", billingCycle: "monthly", autoSuspend: true, events: [{ id: "EV-4", at: "2026-06-15T11:00:00Z", type: "created", by: "Sistema", note: "Trial de 14 dias" }] },
  { id: "T-004", name: "Royal Spa & Salon", nif: "5417654321", owner: "Sofia Tavares", email: "royal@spa.ao", phone: "(926) 700-800", city: "Luanda", plan: "Premium", status: "active", users: 18, monthlyRevenue: 3200000, createdAt: "2025-05-22", lastAccess: "2026-06-29", nextBilling: "2027-05-22", billingCycle: "yearly", autoSuspend: false, events: [{ id: "EV-5", at: "2025-05-22T14:00:00Z", type: "created", by: "Sistema" }, { id: "EV-6", at: "2026-05-22T09:00:00Z", type: "renewed", by: "Suporte GenOmni", note: "Renovação anual Premium" }] },
  { id: "T-005", name: "Charme Hair Studio", nif: "5419988776", owner: "Carla Santos", email: "charme@hair.ao", phone: "(927) 900-100", city: "Lobito", plan: "Profissional", status: "suspended", users: 5, monthlyRevenue: 0, createdAt: "2025-12-10", lastAccess: "2026-05-15", nextBilling: "2026-06-10", billingCycle: "monthly", autoSuspend: true, events: [{ id: "EV-7", at: "2025-12-10T10:00:00Z", type: "created", by: "Sistema" }, { id: "EV-8", at: "2026-06-15T03:00:00Z", type: "auto_suspended", by: "Sistema", note: "Falha no pagamento após 5 dias de tolerância" }] },
  { id: "T-006", name: "Diva Nails & Beauty", nif: "5418112233", owner: "Fernanda Lima", email: "diva@nails.ao", phone: "(928) 222-333", city: "Luanda", plan: "Essencial", status: "cancelled", users: 2, monthlyRevenue: 0, createdAt: "2025-11-18", lastAccess: "2026-02-28", nextBilling: "2026-03-18", billingCycle: "monthly", autoSuspend: true, events: [{ id: "EV-9", at: "2025-11-18T08:00:00Z", type: "created", by: "Sistema" }, { id: "EV-10", at: "2026-03-20T10:00:00Z", type: "cancelled", by: "Suporte GenOmni", note: "Pedido do cliente" }] },
  { id: "T-007", name: "Luxe Barber Lounge", nif: "5417334455", owner: "Roberto Alves", email: "luxe@barber.ao", phone: "(929) 444-555", city: "Cabinda", plan: "Profissional", status: "active", users: 6, monthlyRevenue: 980000, createdAt: "2026-01-12", lastAccess: "2026-06-29", nextBilling: "2026-07-12", billingCycle: "monthly", autoSuspend: true, events: [{ id: "EV-11", at: "2026-01-12T09:00:00Z", type: "created", by: "Sistema" }] },
];

export const mockSupportTickets = [
  { id: "TK-1042", tenant: "Bella Studio Salon", subject: "Erro ao gerar relatório de comissões", priority: "high" as SupportPriority, status: "in_progress" as SupportStatus, openedAt: "2026-04-20", agent: "Suporte L2" },
  { id: "TK-1041", tenant: "Glamour Beauty Center", subject: "Pedido de migração de dados", priority: "medium" as SupportPriority, status: "open" as SupportStatus, openedAt: "2026-04-20", agent: "—" },
  { id: "TK-1040", tenant: "Royal Spa & Salon", subject: "Configuração de Multicaixa Express", priority: "critical" as SupportPriority, status: "in_progress" as SupportStatus, openedAt: "2026-04-19", agent: "Suporte L3" },
  { id: "TK-1039", tenant: "Estilo & Arte Cabeleireiros", subject: "Dúvida sobre permissões de gerente", priority: "low" as SupportPriority, status: "resolved" as SupportStatus, openedAt: "2026-04-18", agent: "Suporte L1" },
  { id: "TK-1038", tenant: "Charme Hair Studio", subject: "Conta suspensa por falta de pagamento", priority: "high" as SupportPriority, status: "open" as SupportStatus, openedAt: "2026-04-17", agent: "—" },
  { id: "TK-1037", tenant: "Luxe Barber Lounge", subject: "Solicitação de novo módulo de fidelidade", priority: "medium" as SupportPriority, status: "resolved" as SupportStatus, openedAt: "2026-04-16", agent: "Suporte L2" },
];

export const mockPlatformLogs = [
  { id: "L-9001", timestamp: "2026-04-21 14:32", tenant: "Bella Studio Salon", user: "Maria Silva", action: "Acesso ao módulo Financeiro", ip: "197.149.x.x" },
  { id: "L-9000", timestamp: "2026-04-21 14:28", tenant: "Royal Spa & Salon", user: "Sofia Tavares", action: "Exportação de relatório PDF", ip: "197.157.x.x" },
  { id: "L-8999", timestamp: "2026-04-21 14:15", tenant: "Glamour Beauty Center", user: "Joana Pires", action: "Cadastro de novo funcionário", ip: "197.149.x.x" },
  { id: "L-8998", timestamp: "2026-04-21 13:58", tenant: "Estilo & Arte Cabeleireiros", user: "Patrícia Mendes", action: "Login no sistema", ip: "197.218.x.x" },
  { id: "L-8997", timestamp: "2026-04-21 13:42", tenant: "Luxe Barber Lounge", user: "Roberto Alves", action: "Movimentação de caixa registada", ip: "197.149.x.x" },
  { id: "L-8996", timestamp: "2026-04-21 13:20", tenant: "Bella Studio Salon", user: "Sistema", action: "Alerta de stock baixo emitido", ip: "—" },
];

export const mockPlatformStats = {
  totalTenants: 7,
  activeTenants: 4,
  trialTenants: 1,
  monthlyRecurringRevenue: 7830000,
  openTickets: 2,
  growthByMonth: [
    { month: "Nov", tenants: 3, mrr: 3200000 },
    { month: "Dez", tenants: 4, mrr: 4500000 },
    { month: "Jan", tenants: 5, mrr: 5680000 },
    { month: "Fev", tenants: 6, mrr: 6420000 },
    { month: "Mar", tenants: 7, mrr: 7180000 },
    { month: "Abr", tenants: 7, mrr: 7830000 },
  ],
  tenantsByPlan: [
    { name: "Essencial", value: 2 },
    { name: "Profissional", value: 3 },
    { name: "Premium", value: 2 },
  ],
};
