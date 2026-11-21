export interface AlertsConfig {
  stock: {
    enabled: boolean;
    threshold: number;
    repeatMinutes: number;
    sound: boolean;
    popup: boolean;
  };
  appointments: {
    enabled: boolean;
    leadMinutes: number;
    repeatMinutes: number;
    sound: boolean;
    popup: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;
  };
}

const KEY = "genomni_alerts_config";

export const defaultAlertsConfig: AlertsConfig = {
  stock: { enabled: true, threshold: 5, repeatMinutes: 60, sound: false, popup: true },
  appointments: { enabled: true, leadMinutes: 15, repeatMinutes: 5, sound: true, popup: true },
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
};

export const loadAlertsConfig = (): AlertsConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultAlertsConfig;
    const parsed = JSON.parse(raw);
    return {
      stock: { ...defaultAlertsConfig.stock, ...parsed.stock },
      appointments: { ...defaultAlertsConfig.appointments, ...parsed.appointments },
      quietHours: { ...defaultAlertsConfig.quietHours, ...parsed.quietHours },
    };
  } catch {
    return defaultAlertsConfig;
  }
};

export const saveAlertsConfig = (cfg: AlertsConfig) => {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("alerts-config-updated"));
};

export const isQuietNow = (cfg: AlertsConfig) => {
  if (!cfg.quietHours.enabled) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = cfg.quietHours.start.split(":").map(Number);
  const [eh, em] = cfg.quietHours.end.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  // overnight window
  return cur >= start || cur < end;
};
