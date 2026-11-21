// Attendance / time-tracking engine — frontend-only mock, localStorage backed.
import { useEffect, useState } from "react";

export type AttendanceStatus = "present" | "late" | "absent" | "justified" | "dayoff";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;        // yyyy-mm-dd
  checkIn?: string;    // HH:mm
  checkOut?: string;   // HH:mm
  expectedIn: string;  // HH:mm
  lateMinutes: number; // computed
  status: AttendanceStatus;
  note?: string;
  createdAt: string;
}

export interface AttendanceSettings {
  shiftStart: string;       // HH:mm — default expected check-in
  toleranceMinutes: number; // grace period before counting as late
  workingDaysPerMonth: number;
  shiftHours: number;
}

interface State {
  records: AttendanceRecord[];
  settings: AttendanceSettings;
}

const KEY = "genomni.attendance.v1";
const EVENT = "genomni:attendance:change";

const defaultSettings: AttendanceSettings = {
  shiftStart: "08:00",
  toleranceMinutes: 10,
  workingDaysPerMonth: 22,
  shiftHours: 8,
};

const empty = (): State => ({ records: [], settings: defaultSettings });

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as State;
    return { ...empty(), ...p, settings: { ...defaultSettings, ...(p.settings || {}) } };
  } catch { return empty(); }
}
function save(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(EVENT));
}
const uid = (p = "") => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const today = () => new Date().toISOString().split("T")[0];
const nowHM = () => new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit", hour12: false });
const toMin = (hm: string) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };

export const attendanceEngine = {
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

  updateSettings(patch: Partial<AttendanceSettings>) {
    const s = load();
    s.settings = { ...s.settings, ...patch };
    save(s);
  },

  /** Today's record for an employee (creates none). */
  getToday(employeeId: string) {
    return load().records.find(r => r.employeeId === employeeId && r.date === today());
  },

  /** Punch in / out — toggles automatically based on current state. */
  punch(employeeId: string, employeeName: string) {
    const s = load();
    const t = today();
    const time = nowHM();
    let rec = s.records.find(r => r.employeeId === employeeId && r.date === t);
    if (!rec) {
      const lateMin = Math.max(0, toMin(time) - toMin(s.settings.shiftStart) - s.settings.toleranceMinutes);
      rec = {
        id: uid("at_"),
        employeeId, employeeName, date: t,
        checkIn: time,
        expectedIn: s.settings.shiftStart,
        lateMinutes: lateMin,
        status: lateMin > 0 ? "late" : "present",
        createdAt: new Date().toISOString(),
      };
      s.records.push(rec);
    } else if (!rec.checkOut) {
      rec.checkOut = time;
    } else {
      // already complete — replace checkout (correction)
      rec.checkOut = time;
    }
    save(s);
    return rec;
  },

  /** Manually set status (absent / justified / dayoff). */
  setStatus(employeeId: string, employeeName: string, date: string, status: AttendanceStatus, note?: string) {
    const s = load();
    let rec = s.records.find(r => r.employeeId === employeeId && r.date === date);
    if (!rec) {
      rec = {
        id: uid("at_"),
        employeeId, employeeName, date,
        expectedIn: s.settings.shiftStart,
        lateMinutes: 0,
        status,
        note,
        createdAt: new Date().toISOString(),
      };
      s.records.push(rec);
    } else {
      rec.status = status;
      rec.note = note ?? rec.note;
    }
    save(s);
  },

  removeRecord(id: string) {
    const s = load();
    s.records = s.records.filter(r => r.id !== id);
    save(s);
  },

  /** Aggregate for a yyyy-mm month. */
  monthlySummary(employeeId: string, month: string) {
    const s = load();
    const recs = s.records.filter(r => r.employeeId === employeeId && r.date.startsWith(month));
    return {
      records: recs,
      present: recs.filter(r => r.status === "present" || r.status === "late").length,
      late: recs.filter(r => r.status === "late").length,
      absent: recs.filter(r => r.status === "absent").length,
      justified: recs.filter(r => r.status === "justified").length,
      lateMinutes: recs.reduce((a, r) => a + (r.lateMinutes || 0), 0),
    };
  },
};

export function useAttendance<T>(selector: (s: State) => T): T {
  const [v, setV] = useState<T>(() => selector(load()));
  useEffect(() => attendanceEngine.subscribe(() => setV(selector(load()))), []);
  return v;
}
