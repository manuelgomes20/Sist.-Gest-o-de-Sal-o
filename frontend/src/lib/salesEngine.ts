// Central sales engine — single source of truth for cash, receivables, stock & commissions.
// Frontend-only mock; uses localStorage and a pub/sub event so all pages stay in sync.

import { mockProducts, mockServices } from "@/data/mockData";

export type PaymentMethod = "Multicaixa Express" | "TPA" | "Transferência Bancária" | "Dinheiro" | "Fiado";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Multicaixa Express",
  "TPA",
  "Transferência Bancária",
  "Dinheiro",
  "Fiado",
];

export interface CashMovement {
  id: string;
  appointmentId?: string;
  receivableId?: string;
  source: "appointment" | "receivable" | "manual" | "reversal";
  type: "in" | "out";
  method: PaymentMethod | "—";
  description: string;
  value: number; // positive number
  date: string; // yyyy-mm-dd
  time: string;
  createdAt: string;
}

export interface Receivable {
  id: string;
  appointmentId?: string;
  client: string;
  description: string;
  total: number;
  paid: number;
  status: "open" | "partial" | "paid" | "reversed";
  createdAt: string;
  dueDate?: string;
  payments: { id: string; date: string; value: number; method: PaymentMethod }[];
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  qty: number; // positive number
  type: "consume" | "restock" | "reversal";
  appointmentId?: string;
  reason: string;
  date: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  appointmentId: string;
  employee: string;
  service: string;
  price: number;
  rate: number;
  value: number;
  status: "pending" | "paid" | "reversed";
  date: string;
  createdAt: string;
}

export interface ServiceBOMItem { productId: string; qty: number }
export type ServiceBOM = Record<string, ServiceBOMItem[]>;

interface EngineState {
  movements: CashMovement[];
  receivables: Receivable[];
  stockMovements: StockMovement[];
  commissions: Commission[];
  bom: ServiceBOM;
  finalizedAppointments: string[]; // idempotency
  openingBalance: number;
}

const KEY = "genomni.salesEngine.v1";
const EVENT = "genomni:salesEngine:change";

const defaultBom: ServiceBOM = {
  // sensible defaults so the user can see consumption immediately
  "1": [{ productId: "1", qty: 1 }], // Corte Feminino → Shampoo
  "2": [{ productId: "1", qty: 1 }], // Corte Masculino → Shampoo
  "3": [{ productId: "3", qty: 1 }, { productId: "6", qty: 1 }], // Coloração → Tinta + Água Oxigenada
  "4": [{ productId: "1", qty: 1 }, { productId: "2", qty: 1 }], // Progressiva → Shampoo + Condicionador
  "5": [{ productId: "4", qty: 1 }], // Manicure → Esmalte
  "6": [{ productId: "4", qty: 1 }], // Pedicure → Esmalte
  "7": [{ productId: "5", qty: 1 }], // Limpeza Pele → Creme
};

const empty = (): EngineState => ({
  movements: [],
  receivables: [],
  stockMovements: [],
  commissions: [],
  bom: defaultBom,
  finalizedAppointments: [],
  openingBalance: 15000,
});

function load(): EngineState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as EngineState;
    return { ...empty(), ...parsed, bom: { ...defaultBom, ...(parsed.bom || {}) } };
  } catch {
    return empty();
  }
}

function save(state: EngineState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const nowParts = () => {
  const d = new Date();
  return {
    iso: d.toISOString(),
    date: d.toISOString().split("T")[0],
    time: d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }),
  };
};

// ───────── public API ─────────

export const salesEngine = {
  getState: load,

  subscribe(cb: () => void) {
    const handler = () => cb();
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  },

  // ── BOM ──
  setServiceBom(serviceId: string, items: ServiceBOMItem[]) {
    const s = load();
    s.bom[serviceId] = items.filter(i => i.productId && i.qty > 0);
    save(s);
  },

  // ── stock ──
  /** Live stock = base - consumed + restocked */
  getProductStock(productId: string): number {
    const s = load();
    const base = mockProducts.find(p => p.id === productId)?.stock ?? 0;
    return s.stockMovements
      .filter(m => m.productId === productId)
      .reduce((acc, m) => {
        if (m.type === "consume") return acc - m.qty;
        if (m.type === "restock") return acc + m.qty;
        if (m.type === "reversal") return acc + m.qty; // reverse of a consume
        return acc;
      }, base);
  },

  restockProduct(productId: string, qty: number, reason = "Reposição manual") {
    if (qty <= 0) return;
    const s = load();
    const p = mockProducts.find(x => x.id === productId);
    if (!p) return;
    const np = nowParts();
    s.stockMovements.push({ id: uid("sm_"), productId, productName: p.name, qty, type: "restock", reason, date: np.date, createdAt: np.iso });
    save(s);
  },

  /** Manual adjustment — loss / breakage / surplus / inventory correction. */
  adjustStock(productId: string, qty: number, direction: "consume" | "restock", reason: string) {
    if (qty <= 0) return;
    const s = load();
    const p = mockProducts.find(x => x.id === productId);
    if (!p) return;
    const np = nowParts();
    s.stockMovements.push({
      id: uid("sm_"), productId, productName: p.name, qty,
      type: direction,
      reason: reason || (direction === "consume" ? "Ajuste — saída" : "Ajuste — entrada"),
      date: np.date, createdAt: np.iso,
    });
    save(s);
  },

  /** Mark a list of commissions as paid (used by payroll). */
  payCommissions(ids: string[]) {
    if (!ids.length) return;
    const s = load();
    s.commissions.forEach(c => { if (ids.includes(c.id) && c.status === "pending") c.status = "paid"; });
    save(s);
  },



  // ── cashier ──
  isOpen(): boolean {
    return localStorage.getItem("genomni.cashierOpen") !== "0";
  },
  setOpen(open: boolean) {
    localStorage.setItem("genomni.cashierOpen", open ? "1" : "0");
    window.dispatchEvent(new CustomEvent(EVENT));
  },

  addManualMovement(input: { type: "in" | "out"; method: PaymentMethod; description: string; value: number }) {
    const s = load();
    const np = nowParts();
    s.movements.push({
      id: uid("mv_"),
      source: "manual",
      type: input.type,
      method: input.method,
      description: input.description,
      value: Math.abs(input.value),
      date: np.date,
      time: np.time,
      createdAt: np.iso,
    });
    save(s);
  },

  /** Aggregated cash summary (optionally filtered by date yyyy-mm-dd). */
  getCashSummary(date?: string) {
    const s = load();
    const items = date ? s.movements.filter(m => m.date === date) : s.movements;
    const entradas = items.filter(m => m.type === "in").reduce((a, m) => a + m.value, 0);
    const saidas = items.filter(m => m.type === "out").reduce((a, m) => a + m.value, 0);
    const byMethod = items.reduce<Record<string, { in: number; out: number }>>((acc, m) => {
      const k = m.method || "—";
      acc[k] = acc[k] || { in: 0, out: 0 };
      acc[k][m.type] += m.value;
      return acc;
    }, {});
    return { entradas, saidas, total: entradas - saidas, byMethod, items };
  },

  // ── receivables ──
  getReceivablesOpenTotal(): number {
    const s = load();
    return s.receivables
      .filter(r => r.status === "open" || r.status === "partial")
      .reduce((a, r) => a + (r.total - r.paid), 0);
  },

  payReceivable(receivableId: string, amount: number, method: PaymentMethod) {
    const s = load();
    const r = s.receivables.find(x => x.id === receivableId);
    if (!r || r.status === "paid" || r.status === "reversed") return;
    const due = r.total - r.paid;
    const pay = Math.min(Math.max(amount, 0), due);
    if (pay <= 0) return;
    const np = nowParts();
    r.paid += pay;
    r.payments.push({ id: uid("rp_"), date: np.date, value: pay, method });
    r.status = r.paid >= r.total ? "paid" : "partial";
    s.movements.push({
      id: uid("mv_"),
      receivableId,
      source: "receivable",
      type: "in",
      method,
      description: `Recebimento — ${r.client} (${r.description})`,
      value: pay,
      date: np.date,
      time: np.time,
      createdAt: np.iso,
    });
    save(s);
  },

  // ── core: finalize appointment ──
  finalizeAppointment(input: {
    appointmentId: string;
    client: string;
    serviceId?: string;
    serviceName: string;
    employee: string;
    price: number;
    discount?: number;
    tip?: number;
    paid: number;
    method: PaymentMethod;
    commissionRate?: number; // override; otherwise pulled from mockServices
    consumed?: ServiceBOMItem[]; // overrides BOM with REAL consumption
  }) {

    const s = load();
    if (s.finalizedAppointments.includes(input.appointmentId)) {
      return { duplicated: true };
    }
    const np = nowParts();
    const total = Math.max(0, input.price - (input.discount || 0)) + (input.tip || 0);
    const paid = Math.min(Math.max(input.paid, 0), total);
    const remaining = total - paid;

    // 1) Cash entry for paid amount (if any)
    if (paid > 0) {
      s.movements.push({
        id: uid("mv_"),
        appointmentId: input.appointmentId,
        source: "appointment",
        type: "in",
        method: input.method,
        description: `${input.client} — ${input.serviceName}`,
        value: paid,
        date: np.date,
        time: np.time,
        createdAt: np.iso,
      });
    }

    // 2) Receivable for remainder (fiado / parcial)
    if (remaining > 0) {
      s.receivables.push({
        id: uid("rc_"),
        appointmentId: input.appointmentId,
        client: input.client,
        description: input.serviceName,
        total: remaining,
        paid: 0,
        status: "open",
        createdAt: np.iso,
        payments: [],
      });
    }

    // 3) Stock consumption — uses real `consumed` override, else falls back to BOM
    const serviceId = input.serviceId
      || mockServices.find(x => x.name === input.serviceName)?.id;
    const toConsume = (input.consumed && input.consumed.length > 0)
      ? input.consumed
      : (serviceId ? s.bom[serviceId] || [] : []);
    for (const item of toConsume) {
      if (!item.productId || item.qty <= 0) continue;
      const p = mockProducts.find(x => x.id === item.productId);
      if (!p) continue;
      s.stockMovements.push({
        id: uid("sm_"),
        productId: item.productId,
        productName: p.name,
        qty: item.qty,
        type: "consume",
        appointmentId: input.appointmentId,
        reason: `Atendimento ${input.serviceName}`,
        date: np.date,
        createdAt: np.iso,
      });
    }


    // 4) Commission
    const svc = mockServices.find(x => x.name === input.serviceName);
    const rate = input.commissionRate ?? svc?.commission ?? 0;
    if (rate > 0) {
      s.commissions.push({
        id: uid("cm_"),
        appointmentId: input.appointmentId,
        employee: input.employee,
        service: input.serviceName,
        price: input.price,
        rate,
        value: Math.round((input.price * rate) / 100),
        status: "pending",
        date: np.date,
        createdAt: np.iso,
      });
    }

    s.finalizedAppointments.push(input.appointmentId);
    save(s);
    return { duplicated: false, total, paid, remaining };
  },

  /** Undo everything created by a previous finalizeAppointment call. */
  reverseAppointment(appointmentId: string) {
    const s = load();
    if (!s.finalizedAppointments.includes(appointmentId)) return;
    const np = nowParts();

    // refund cash entries linked to this appointment
    const cashFromAppt = s.movements.filter(m => m.appointmentId === appointmentId && m.source === "appointment" && m.type === "in");
    for (const m of cashFromAppt) {
      s.movements.push({
        id: uid("mv_"),
        appointmentId,
        source: "reversal",
        type: "out",
        method: m.method,
        description: `Estorno — ${m.description}`,
        value: m.value,
        date: np.date,
        time: np.time,
        createdAt: np.iso,
      });
    }

    // mark linked receivables as reversed (only if no money received yet)
    s.receivables.forEach(r => {
      if (r.appointmentId === appointmentId && r.paid === 0 && r.status !== "paid") {
        r.status = "reversed";
      }
    });

    // restock consumed products
    const consumed = s.stockMovements.filter(m => m.appointmentId === appointmentId && m.type === "consume");
    for (const c of consumed) {
      s.stockMovements.push({
        id: uid("sm_"),
        productId: c.productId,
        productName: c.productName,
        qty: c.qty,
        type: "reversal",
        appointmentId,
        reason: `Estorno de atendimento`,
        date: np.date,
        createdAt: np.iso,
      });
    }

    // reverse commissions
    s.commissions.forEach(c => { if (c.appointmentId === appointmentId) c.status = "reversed"; });

    s.finalizedAppointments = s.finalizedAppointments.filter(id => id !== appointmentId);
    save(s);
  },

  isFinalized(appointmentId: string) {
    return load().finalizedAppointments.includes(appointmentId);
  },
};

// React helper
import { useEffect, useState } from "react";
export function useSalesEngine<T>(selector: (s: EngineState) => T): T {
  const [value, setValue] = useState<T>(() => selector(load()));
  useEffect(() => salesEngine.subscribe(() => setValue(selector(load()))), []);
  return value;
}
