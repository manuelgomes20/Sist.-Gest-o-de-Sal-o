import { z } from "zod";

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

// Angola NIF: 9 digits
export const isValidNIF = (v: string) => /^\d{9}$/.test(v);
export const nifSchema = z.string().regex(/^\d{9}$/, "NIF deve ter 9 dígitos");

// Angola phone: 9 digits after +244
export const isValidPhoneAO = (v: string) => /^\d{9}$/.test(v);
export const phoneAOSchema = z.string().regex(/^\d{9}$/, "Telefone deve ter 9 dígitos");
export const formatPhoneAO = (v: string) => {
  const d = onlyDigits(v).slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

// Password strength: 0-4
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

export const evaluatePassword = (pwd: string): PasswordStrength => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length < 8) score = 0;
  const labels = ["—", "Fraca", "Média", "Forte", "Muito forte"];
  const colors = ["bg-muted", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  return {
    score: score as PasswordStrength["score"],
    label: labels[score],
    color: colors[score],
  };
};

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(64, "Máximo 64 caracteres");
