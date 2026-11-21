// Payroll engine — base salary + commissions − legal/manual deductions.
// Angola: INSS empregado 3%, IRT progressivo (Lei 28/20 simplificada).
import { useEffect, useState } from "react";
import { salesEngine } from "./salesEngine";
import { attendanceEngine } from "./attendanceEngine";

export interface Advance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // yyyy-mm-dd
  value: number;
  reason?: string;
  status: "pending" | "deducted";
  payrollRunId?: string;
  createdAt: string;
}

export interface ManualDeduction {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // yyyy-mm
  label: string;
  value: number;
  createdAt: string;
}

export interface PayrollRun {
  id: string;
  month: string; // yyyy-mm
  employeeId: string;
  employeeName: string;
  base: number;
  commissions: number;
  commissionIds: string[];
  absenceDays: number;
  absenceDeduction: number;
  lateMinutes: number;
  lateDeduction: number;
  advances: number;
  advanceIds: string[];
  otherDeductions: number;
  inss: number;
  irt: number;
  gross: number;
  totalDeductions: number;
  net: number;
  paidAt: string;
}

interface State {
  advances: Advance[];
  deductions: ManualDeduction[];
  runs: PayrollRun[];
}

const KEY = "genomni.payroll.v1";
const EVENT = "genomni:payroll:change";
const empty = (): State => ({ advances: [], deductions: [], runs: [] });

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch { return empty(); }
}
function save(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(EVENT));
}
const uid = (p = "") => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ───────── Angola tax tables ─────────

const INSS_RATE = 0.03; // employee share

/** Simplified IRT progressive — returns tax for a given monthly base. */
export function calcIRT(base: number): number {
  if (base <= 70_000) return 0;
  if (base <= 100_000) return (base - 70_000) * 0.10;
  if (base <= 150_000) return 3_000  + (base - 100_000) * 0.13;
  if (base <= 200_000) return 9_500  + (base - 150_000) * 0.16;
  if (base <= 300_000) return 17_500 + (base - 200_000) * 0.18;
  if (base <= 500_000) return 35_500 + (base - 300_000) * 0.19;
  if (base <= 1_000_000) return 73_500  + (base - 500_000) * 0.20;
  if (base <= 1_500_000) return 173_500 + (base - 1_000_000) * 0.21;
  if (base <= 2_000_000) return 278_500 + (base - 1_500_000) * 0.22;
  if (base <= 2_500_000) return 388_500 + (base - 2_000_000) * 0.23;
  if (base <= 5_000_000) return 503_500 + (base - 2_500_000) * 0.24;
  if (base <= 10_000_000) return 1_103_500 + (base - 5_000_000) * 0.245;
  return 2_328_500 + (base - 10_000_000) * 0.25;
}

export const payrollEngine = {
  getState: load,
  subscribe(cb: () => void) {
    const h = () => cb();
    window.addEventListener(EVENT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVENT, h);
      window.removeEventListener("storage", h);
    };
  },

  // ── advances ──
  addAdvance(input: { employeeId: string; employeeName: string; value: number; reason?: string; date?: string }) {
    const s = load();
    const a: Advance = {
      id: uid("ad_"),
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      value: Math.abs(input.value),
      reason: input.reason,
      date: input.date || new Date().toISOString().split("T")[0],
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    s.advances.push(a);
    // cash outflow registered immediately
    salesEngine.addManualMovement({
      type: "out", method: "Dinheiro",
      description: `Adiantamento — ${input.employeeName}${input.reason ? ` (${input.reason})` : ""}`,
      value: a.value,
    });
    save(s);
  },
  removeAdvance(id: string) {
    const s = load();
    s.advances = s.advances.filter(a => a.id !== id);
    save(s);
  },

  // ── manual deductions ──
  addDeduction(input: { employeeId: string; employeeName: string; month: string; label: string; value: number }) {
    const s = load();
    s.deductions.push({
      id: uid("dd_"),
      ...input,
      value: Math.abs(input.value),
      createdAt: new Date().toISOString(),
    });
    save(s);
  },
  removeDeduction(id: string) {
    const s = load();
    s.deductions = s.deductions.filter(d => d.id !== id);
    save(s);
  },

  /** Preview the payroll for a single employee for `month` (yyyy-mm). */
  compute(employee: { id: string; name: string; salary: number }, month: string) {
    const eng = salesEngine.getState();
    const att = attendanceEngine.getState();
    const settings = att.settings;

    // commissions pending in the month
    const commissions = eng.commissions.filter(c => c.employee === employee.name && c.date.startsWith(month) && c.status === "pending");
    const commissionTotal = commissions.reduce((a, c) => a + c.value, 0);

    // attendance
    const summary = attendanceEngine.monthlySummary(employee.id, month);
    const dailyRate = employee.salary / settings.workingDaysPerMonth;
    const minuteRate = employee.salary / settings.workingDaysPerMonth / settings.shiftHours / 60;
    const absenceDeduction = summary.absent * dailyRate;
    const lateDeduction = summary.lateMinutes * minuteRate;

    // pending advances (not yet deducted) up to month end
    const monthEnd = month + "-31";
    const advances = load().advances.filter(a => a.employeeId === employee.id && a.status === "pending" && a.date <= monthEnd);
    const advanceTotal = advances.reduce((a, x) => a + x.value, 0);

    // manual deductions for the month
    const manual = load().deductions.filter(d => d.employeeId === employee.id && d.month === month);
    const manualTotal = manual.reduce((a, d) => a + d.value, 0);

    const gross = employee.salary + commissionTotal;
    const inss = Math.round(employee.salary * INSS_RATE);
    const irtBase = Math.max(0, gross - inss - absenceDeduction - lateDeduction);
    const irt = Math.round(calcIRT(irtBase));
    const totalDeductions = Math.round(absenceDeduction + lateDeduction + advanceTotal + manualTotal + inss + irt);
    const net = Math.max(0, Math.round(gross - totalDeductions));

    return {
      employee,
      month,
      base: employee.salary,
      commissions: commissionTotal,
      commissionIds: commissions.map(c => c.id),
      absenceDays: summary.absent,
      absenceDeduction: Math.round(absenceDeduction),
      lateMinutes: summary.lateMinutes,
      lateDeduction: Math.round(lateDeduction),
      advances: advanceTotal,
      advanceIds: advances.map(a => a.id),
      otherDeductions: manualTotal,
      manualDeductions: manual,
      inss, irt,
      gross: Math.round(gross),
      totalDeductions,
      net,
    };
  },

  /** Persist a payroll run, mark commissions paid, mark advances deducted, register cash out. */
  run(employee: { id: string; name: string; salary: number }, month: string) {
    const c = payrollEngine.compute(employee, month);
    if (c.net <= 0 && c.gross <= 0) return null;
    const s = load();
    const run: PayrollRun = {
      id: uid("pr_"),
      month, employeeId: employee.id, employeeName: employee.name,
      base: c.base, commissions: c.commissions, commissionIds: c.commissionIds,
      absenceDays: c.absenceDays, absenceDeduction: c.absenceDeduction,
      lateMinutes: c.lateMinutes, lateDeduction: c.lateDeduction,
      advances: c.advances, advanceIds: c.advanceIds,
      otherDeductions: c.otherDeductions,
      inss: c.inss, irt: c.irt,
      gross: c.gross, totalDeductions: c.totalDeductions, net: c.net,
      paidAt: new Date().toISOString(),
    };
    s.runs.push(run);
    s.advances.forEach(a => { if (run.advanceIds.includes(a.id)) { a.status = "deducted"; a.payrollRunId = run.id; } });
    save(s);
    salesEngine.payCommissions(run.commissionIds);
    salesEngine.addManualMovement({
      type: "out", method: "Transferência Bancária",
      description: `Folha salarial ${month} — ${employee.name}`,
      value: run.net,
    });
    return run;
  },

  /** Has this employee already been paid for the month? */
  isPaid(employeeId: string, month: string) {
    return load().runs.some(r => r.employeeId === employeeId && r.month === month);
  },
};

export function usePayroll<T>(selector: (s: State) => T): T {
  const [v, setV] = useState<T>(() => selector(load()));
  useEffect(() => payrollEngine.subscribe(() => setV(selector(load()))), []);
  return v;
}
