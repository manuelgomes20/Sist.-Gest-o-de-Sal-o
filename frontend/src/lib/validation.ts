export const phonePattern = /^(?:\+?244)?\s?9\d{2}\s?\d{3}\s?\d{3}$/;
export const nifPattern = /^[0-9A-Za-z]{9,15}$/;

export function isValidAngolaPhone(value: string) {
  return phonePattern.test((value || "").trim());
}

export function isValidNif(value: string) {
  return nifPattern.test((value || "").trim());
}

export function passwordIssues(value: string) {
  const password = value || "";
  const issues: string[] = [];
  if (password.length < 8) issues.push("mínimo de 8 caracteres");
  if (!/[A-Z]/.test(password)) issues.push("uma letra maiúscula");
  if (!/[a-z]/.test(password)) issues.push("uma letra minúscula");
  if (!/\d/.test(password)) issues.push("um número");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("um símbolo");
  return issues;
}

export function isStrongPassword(value: string) {
  return passwordIssues(value).length === 0;
}
