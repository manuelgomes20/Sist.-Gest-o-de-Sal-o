// Legal documents storage with versioning. Frontend-only (localStorage)
// prepared for future FastAPI backend integration.

export type LegalDocType = "terms" | "privacy" | "contract" | "cookies";

export interface LegalDocVersion {
  id: string;
  type: LegalDocType;
  version: string; // e.g. "1.0.0"
  title: string;
  content: string; // HTML / markdown
  active: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  author?: string;
}

export interface LegalAcceptance {
  id: string;
  tenantName: string;
  userName: string;
  userEmail: string;
  acceptedAt: string;
  ip: string;
  userAgent: string;
  device: string;
  versions: { type: LegalDocType; version: string; id: string }[];
}

const DOCS_KEY = "genomni_legal_docs";
const ACCEPT_KEY = "genomni_legal_acceptances";

export const LEGAL_LABELS: Record<LegalDocType, string> = {
  terms: "Termos e Condições",
  privacy: "Política de Privacidade",
  contract: "Contrato da Plataforma",
  cookies: "Política de Cookies",
};

const defaultDoc = (type: LegalDocType): LegalDocVersion => ({
  id: crypto.randomUUID(),
  type,
  version: "1.0.0",
  title: LEGAL_LABELS[type],
  content: `<h2>${LEGAL_LABELS[type]}</h2><p>Versão inicial — edite este conteúdo no painel de Super Admin.</p>`,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: "Sistema",
});

export const loadAllDocs = (): LegalDocVersion[] => {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (!raw) {
      const seed: LegalDocVersion[] = (["terms", "privacy", "contract", "cookies"] as LegalDocType[]).map(defaultDoc);
      localStorage.setItem(DOCS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveAllDocs = (docs: LegalDocVersion[]) => {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  window.dispatchEvent(new Event("legal-docs-updated"));
};

export const getActiveDoc = (type: LegalDocType): LegalDocVersion | undefined => {
  const docs = loadAllDocs().filter(d => d.type === type);
  return docs.find(d => d.active) ?? docs[0];
};

export const getActiveDocs = (): Record<LegalDocType, LegalDocVersion | undefined> => ({
  terms: getActiveDoc("terms"),
  privacy: getActiveDoc("privacy"),
  contract: getActiveDoc("contract"),
  cookies: getActiveDoc("cookies"),
});

export const upsertDoc = (doc: LegalDocVersion) => {
  const all = loadAllDocs();
  const i = all.findIndex(d => d.id === doc.id);
  if (i >= 0) all[i] = { ...doc, updatedAt: new Date().toISOString() };
  else all.push(doc);
  saveAllDocs(all);
};

export const deleteDoc = (id: string) => {
  saveAllDocs(loadAllDocs().filter(d => d.id !== id));
};

export const setActiveVersion = (type: LegalDocType, id: string) => {
  const all = loadAllDocs().map(d =>
    d.type === type ? { ...d, active: d.id === id } : d
  );
  saveAllDocs(all);
};

export const newVersionFrom = (base: LegalDocVersion, version: string): LegalDocVersion => ({
  ...base,
  id: crypto.randomUUID(),
  version,
  active: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ---- Acceptance audit ----

export const loadAcceptances = (): LegalAcceptance[] => {
  try {
    return JSON.parse(localStorage.getItem(ACCEPT_KEY) || "[]");
  } catch { return []; }
};

export const detectDevice = (ua: string): string => {
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Desconhecido";
};

export const fetchClientIP = async (): Promise<string> => {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return j.ip || "0.0.0.0";
  } catch {
    return "0.0.0.0";
  }
};

export const recordAcceptance = async (params: {
  tenantName: string;
  userName: string;
  userEmail: string;
}): Promise<LegalAcceptance> => {
  const ua = navigator.userAgent;
  const ip = await fetchClientIP();
  const active = getActiveDocs();
  const acceptance: LegalAcceptance = {
    id: crypto.randomUUID(),
    tenantName: params.tenantName,
    userName: params.userName,
    userEmail: params.userEmail,
    acceptedAt: new Date().toISOString(),
    ip,
    userAgent: ua,
    device: detectDevice(ua),
    versions: (Object.values(active).filter(Boolean) as LegalDocVersion[]).map(d => ({
      type: d.type, version: d.version, id: d.id,
    })),
  };
  const all = loadAcceptances();
  all.unshift(acceptance);
  localStorage.setItem(ACCEPT_KEY, JSON.stringify(all));
  return acceptance;
};
