const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "genomni_token";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado") {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function normalizeErrorDetail(detail: unknown): string | null {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
          return item.msg;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (messages.length) return messages.join("; ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return null;
}

export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: ApiMethod;
    body?: any;
    token?: string | null;
    auth?: boolean;
  } = {}
): Promise<T> {
  const method = options.method || "GET";
  const auth = options.auth ?? true;
  const token = options.token ?? getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Sem ligação ao servidor. Verifique se o backend está ativo.");
  }

  if (!response.ok) {
    let message = `Erro ${response.status}`;

    try {
      const data = await response.json();
      message = normalizeErrorDetail(data?.detail) || data?.message || message;
    } catch {
      // ignore
    }

    if (auth && response.status === 401) {
      clearStoredToken();
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ access_token: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      }),
    registerTenant: (payload: any) =>
      apiRequest<{ access_token: string }>("/auth/register-tenant", {
        method: "POST",
        auth: false,
        body: payload,
      }),
    me: () => apiRequest<any>("/auth/me"),
  },

  dashboard: {
    overview: () => apiRequest<any>("/dashboard/overview"),
    audit: () => apiRequest<any[]>("/dashboard/audit"),
  },

  clients: {
    list: () => apiRequest<any[]>("/clients"),
    create: (body: any) => apiRequest<any>("/clients", { method: "POST", body }),
    update: (id: string, body: any) => apiRequest<any>(`/clients/${id}`, { method: "PUT", body }),
    delete: (id: string) => apiRequest<any>(`/clients/${id}`, { method: "DELETE" }),
  },

  employees: {
    list: () => apiRequest<any[]>("/employees"),
    create: (body: any) => apiRequest<any>("/employees", { method: "POST", body }),
    update: (id: string, body: any) => apiRequest<any>(`/employees/${id}`, { method: "PUT", body }),
    delete: (id: string) => apiRequest<any>(`/employees/${id}`, { method: "DELETE" }),
  },

  services: {
    list: () => apiRequest<any[]>("/services"),
    create: (body: any) => apiRequest<any>("/services", { method: "POST", body }),
    update: (id: string, body: any) => apiRequest<any>(`/services/${id}`, { method: "PUT", body }),
    delete: (id: string) => apiRequest<any>(`/services/${id}`, { method: "DELETE" }),
  },

  products: {
    list: () => apiRequest<any[]>("/products"),
    create: (body: any) => apiRequest<any>("/products", { method: "POST", body }),
    update: (id: string, body: any) => apiRequest<any>(`/products/${id}`, { method: "PUT", body }),
    delete: (id: string) => apiRequest<any>(`/products/${id}`, { method: "DELETE" }),
    movements: () => apiRequest<any[]>("/products/movements"),
    createMovement: (body: any) => apiRequest<any>("/products/movements", { method: "POST", body }),
    bom: () => apiRequest<Record<string, any[]>>("/products/bom"),
    updateBom: (serviceId: string, body: any[]) => apiRequest<any>(`/products/bom/${serviceId}`, { method: "PUT", body }),
  },

  appointments: {
    list: (date?: string) => apiRequest<any[]>(`/appointments${date ? `?date=${date}` : ""}`),
    create: (body: any) => apiRequest<any>("/appointments", { method: "POST", body }),
    update: (id: string, body: any) => apiRequest<any>(`/appointments/${id}`, { method: "PUT", body }),
    delete: (id: string) => apiRequest<any>(`/appointments/${id}`, { method: "DELETE" }),
    finalize: (id: string, body: any) => apiRequest<any>(`/appointments/${id}/finalize`, { method: "POST", body }),
  },

  financial: {
    summary: () => apiRequest<any>("/financial/summary"),
    commissions: (month?: string) => apiRequest<any>(`/financial/commissions${month ? `?month=${month}` : ""}`),
  },

  cashier: {
    movements: () => apiRequest<any[]>("/cashier/movements"),
    summary: () => apiRequest<any>("/cashier/summary"),
    createMovement: (body: any) => apiRequest<any>("/cashier/movements", { method: "POST", body }),
  },

  receivables: {
    list: () => apiRequest<any[]>("/receivables"),
    create: (body: any) => apiRequest<any>("/receivables", { method: "POST", body }),
    pay: (id: string, body: any) => apiRequest<any>(`/receivables/${id}/payments`, { method: "POST", body }),
  },

  attendance: {
    records: (month?: string) => apiRequest<any[]>(`/attendance/records${month ? `?month=${month}` : ""}`),
    upsert: (body: any) => apiRequest<any>("/attendance/records", { method: "POST", body }),
    delete: (id: string) => apiRequest<any>(`/attendance/records/${id}`, { method: "DELETE" }),
    settings: () => apiRequest<any>("/attendance/settings"),
    updateSettings: (settings: any) => apiRequest<any>("/attendance/settings", { method: "PUT", body: { settings } }),
  },

  payroll: {
    state: () => apiRequest<any>("/payroll/state"),
    addAdvance: (body: any) => apiRequest<any>("/payroll/advances", { method: "POST", body }),
    addDeduction: (body: any) => apiRequest<any>("/payroll/deductions", { method: "POST", body }),
    run: (body: any) => apiRequest<any>("/payroll/runs", { method: "POST", body }),
  },

  alerts: {
    list: () => apiRequest<any[]>("/alerts"),
    markRead: (id: string) => apiRequest<any>(`/alerts/${id}/read`, { method: "PATCH" }),
    config: () => apiRequest<any>("/alerts/config"),
    updateConfig: (config: any) => apiRequest<any>("/alerts/config", { method: "PUT", body: { config } }),
  },

  platform: {
    setting: (key: string) => apiRequest<any>(`/platform/settings/${key}`, { auth: false }),
    updateSetting: (key: string, value: any) => apiRequest<any>(`/platform/settings/${key}`, { method: "PUT", body: { value } }),
    legal: (type: string) => apiRequest<any>(`/platform/legal/${type}`, { auth: false }),
    legalDocuments: () => apiRequest<any[]>("/platform/legal"),
    saveLegalDocument: (body: any) => apiRequest<any>("/platform/legal", { method: "POST", body }),
    acceptLegal: (type: string) => apiRequest<any>(`/platform/legal/${type}/accept`, { method: "POST" }),
  },

  settings: {
    get: () => apiRequest<any>("/settings"),
    update: (body: any) => apiRequest<any>("/settings", { method: "PUT", body }),
    createSupportTicket: (body: any) => apiRequest<any>("/settings/support", { method: "POST", body }),
  },

  superAdmin: {
    tenants: () => apiRequest<any[]>("/super-admin/tenants"),
    updateTenantStatus: (tenantId: string, status: string) =>
      apiRequest<any>(`/super-admin/tenants/${tenantId}/status`, { method: "PATCH", body: { status } }),
    stats: () => apiRequest<any>("/super-admin/stats"),
    logs: () => apiRequest<any[]>("/super-admin/logs"),
    tickets: () => apiRequest<any[]>("/super-admin/support/tickets"),
    updateTicket: (ticketId: string, body: any) =>
      apiRequest<any>(`/super-admin/support/tickets/${ticketId}`, { method: "PATCH", body }),
    replyTicket: (ticketId: string, body: any) =>
      apiRequest<any>(`/super-admin/support/tickets/${ticketId}/reply`, { method: "POST", body }),
    ticketReplies: (ticketId: string) => apiRequest<any[]>(`/super-admin/support/tickets/${ticketId}/replies`),
  },
};
