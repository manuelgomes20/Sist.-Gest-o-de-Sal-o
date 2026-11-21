import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { loadAlertsConfig, isQuietNow, AlertsConfig } from "./alertsConfig";
import { mockProducts, mockAppointments } from "@/data/mockData";

export interface SmartAlert {
  id: string;
  type: "stock" | "appointment";
  title: string;
  message: string;
  severity: "warning" | "critical" | "info";
  createdAt: number;
  read: boolean;
}

// Short beep via WebAudio API to avoid asset bloat
const playBeep = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* noop */
  }
};

const STORE_KEY = "genomni_alerts_inbox";
const FIRED_KEY = "genomni_alerts_last_fired";

const loadInbox = (): SmartAlert[] => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
};
const saveInbox = (a: SmartAlert[]) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(a.slice(0, 50)));
  window.dispatchEvent(new Event("alerts-inbox-updated"));
};

const lastFired = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}"); } catch { return {}; }
};
const markFired = (key: string) => {
  const all = lastFired(); all[key] = Date.now();
  localStorage.setItem(FIRED_KEY, JSON.stringify(all));
};

const computeAlerts = (cfg: AlertsConfig): SmartAlert[] => {
  const out: SmartAlert[] = [];
  const fired = lastFired();
  const now = Date.now();

  if (cfg.stock.enabled) {
    mockProducts.forEach(p => {
      if (p.stock <= cfg.stock.threshold) {
        const key = `stock:${p.id}`;
        const last = fired[key] || 0;
        if (now - last >= cfg.stock.repeatMinutes * 60 * 1000) {
          out.push({
            id: `${key}:${now}`,
            type: "stock",
            title: "Stock baixo",
            message: `${p.name} — restam ${p.stock} unidades (mín. ${cfg.stock.threshold})`,
            severity: p.stock === 0 ? "critical" : "warning",
            createdAt: now,
            read: false,
          });
          markFired(key);
        }
      }
    });
  }

  if (cfg.appointments.enabled) {
    const lead = cfg.appointments.leadMinutes * 60 * 1000;
    mockAppointments.forEach(a => {
      const at = new Date(`${a.date}T${a.time}:00`).getTime();
      const diff = at - now;
      if (diff > 0 && diff <= lead && a.status !== "completed") {
        const key = `appt:${a.id}`;
        const last = fired[key] || 0;
        if (now - last >= cfg.appointments.repeatMinutes * 60 * 1000) {
          const mins = Math.max(1, Math.round(diff / 60000));
          out.push({
            id: `${key}:${now}`,
            type: "appointment",
            title: "Agendamento próximo",
            message: `${a.client} • ${a.service} em ${mins} min (${a.time})`,
            severity: "info",
            createdAt: now,
            read: false,
          });
          markFired(key);
        }
      }
    });
  }

  return out;
};

export const useSmartAlerts = () => {
  const [inbox, setInbox] = useState<SmartAlert[]>(loadInbox);

  const refresh = useCallback(() => setInbox(loadInbox()), []);

  useEffect(() => {
    window.addEventListener("alerts-inbox-updated", refresh);
    return () => window.removeEventListener("alerts-inbox-updated", refresh);
  }, [refresh]);

  useEffect(() => {
    const tick = () => {
      const cfg = loadAlertsConfig();
      if (isQuietNow(cfg)) return;
      const newAlerts = computeAlerts(cfg);
      if (newAlerts.length === 0) return;
      const merged = [...newAlerts, ...loadInbox()];
      saveInbox(merged);

      newAlerts.forEach(a => {
        const wantsPopup = a.type === "stock" ? cfg.stock.popup : cfg.appointments.popup;
        const wantsSound = a.type === "stock" ? cfg.stock.sound : cfg.appointments.sound;
        if (wantsPopup) {
          if (a.severity === "critical") toast.error(a.title, { description: a.message });
          else if (a.severity === "warning") toast.warning(a.title, { description: a.message });
          else toast.info(a.title, { description: a.message });
        }
        if (wantsSound) playBeep();
      });
    };
    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const markAllRead = () => {
    const updated = loadInbox().map(a => ({ ...a, read: true }));
    saveInbox(updated);
  };
  const remove = (id: string) => {
    const updated = loadInbox().filter(a => a.id !== id);
    saveInbox(updated);
  };
  const clear = () => saveInbox([]);

  const unread = inbox.filter(a => !a.read).length;

  return { inbox, unread, markAllRead, remove, clear };
};
