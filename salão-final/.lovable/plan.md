# Plano de Profissionalização da Plataforma GenOmni Salon

Esta é uma evolução grande, dividida em 5 frentes. Vou implementá-la em fases coerentes para manter o sistema estável e com qualidade premium em cada etapa.

---

## Fase 1 — Internacionalização Profissional (i18n)

**Por que primeiro:** resolve o bug visível de "tradução automática" do navegador que está a quebrar textos como "Logotipo da Empresa" → "que da Empresa".

- Instalar `react-i18next` + `i18next` + `i18next-browser-languagedetector`.
- Criar `src/i18n/index.ts` e ficheiros `src/i18n/locales/pt.json` e `en.json` com namespaces (`common`, `auth`, `dashboard`, `superAdmin`, `landing`, `footer`).
- Inicializar i18n no `main.tsx`.
- Definir `<html lang="pt-PT">` em `index.html` + `<meta name="google" content="notranslate">` + `class="notranslate"` no `<body>`.
- Adicionar `translate="no"` em logotipos, nomes de marca e labels críticos.
- Criar `LanguageSwitcher` reutilizável (PT/EN) no topbar do Dashboard, Super Admin e Landing.
- Migrar textos visíveis das principais telas (Landing, Login, Register, Layouts, Settings) para `t()`. Outras páginas ficam com fallback PT estático até serem migradas (sem regressão visual).

## Fase 2 — Validação Inteligente de Campos

Criar utilitários reutilizáveis em `src/lib/validators.ts` e componentes em `src/components/inputs/`:

- **`NIFInput`** — máscara: só dígitos, máx 9, validação em tempo real com mensagem (válido/inválido), `inputMode="numeric"`.
- **`PhoneAOInput`** — prefixo fixo `+244` visual (não editável), 9 dígitos numéricos, máscara `9XX XXX XXX`.
- **`PasswordInput`** — ícone olho (toggle show/hide via `Eye`/`EyeOff` do lucide), barra de força (fraca/média/forte/muito forte), regras: 8–64 chars, com helper text dinâmico.
- Schemas Zod para `nifAO`, `phoneAO`, `password` em `src/lib/validators.ts`.
- Substituir nos formulários: `Register.tsx`, `Login.tsx`, `UserProfileDialog.tsx`, `Settings.tsx` (telefone da empresa) e `Employees`/`Clients` onde aplicável.

## Fase 3 — Gestão de Branding (Super Admin)

Nova página `src/pages/super-admin/Branding.tsx` + módulo `src/lib/brandingConfig.ts`:

- Configuração persistente (localStorage com evento `branding-updated`) com campos: `landingLogo`, `loginLogo`, `registerLogo`, `footerLogo`, `favicon`, `heroBanner`, `loginBanner`, `brandName`, `brandTagline`.
- Upload de imagens com preview em tempo real (conversão para base64; nota visível "preparado para storage backend white-label").
- Redimensionamento automático com canvas (limites: logo 512px, banner 1920px, favicon 64px).
- Aplicação dinâmica:
  - Favicon atualiza `<link rel="icon">` em runtime.
  - Componentes `BrandLogo` (variants: landing/login/register/footer) substituem logos hardcoded.
  - Landing/Login/Register/SiteFooter consomem o config.
- Rota `/super-admin/branding` e item no `SuperAdminSidebar`.

## Fase 4 — Alertas Inteligentes (Dashboard da Empresa)

- `src/lib/alertsConfig.ts` — config por tenant: estoque (limiar, repetição), agenda (antecedência min, som on/off, janela horária), tipo (popup/toast/badge).
- `src/lib/alertsEngine.ts` — hook `useSmartAlerts()` que:
  - corre a cada 30 s,
  - cruza `mockData` de stock (qty < limiar) e appointments (próximos `N` minutos / em andamento),
  - dispara `sonner` toasts persistentes + opcional `Audio()` com beep curto (data URI),
  - respeita janela horária configurada.
- Componente `AlertCenter` (sino no topbar do `DashboardLayout`) com lista, badge de contagem e ação "marcar como lido".
- Página `src/pages/dashboard/Alerts.tsx` para configurar preferências por empresa (Switches, Sliders, Inputs).

## Fase 5 — Polimento UI/UX

- Animações suaves (`animate-fade-in`, `transition-all`) já presentes — aplicar consistência nos novos componentes.
- Garantir responsividade dos novos forms/inputs no viewport mobile (≤640px).
- Acessibilidade: `aria-label` nos toggles, `aria-live="polite"` nos alertas.
- Limpeza: remover código morto da antiga secção de contactos hardcoded.

---

## Detalhes técnicos

**Stack adicionada:** `react-i18next`, `i18next`, `i18next-browser-languagedetector`.
**Sem backend:** mantém-se mock + `localStorage` (consistente com o estado actual do projecto). Estrutura preparada para ligar ao Lovable Cloud depois (todos os módulos expõem funções `load/save` isoláveis).
**Multi-tenant ready:** `alertsConfig` e `brandingConfig` aceitam `tenantId` (default `__global__` para Super Admin).
**White-label ready:** `BrandLogo` + `brandingConfig` permitem trocar identidade visual sem editar código.

## Ficheiros a criar

```
src/i18n/index.ts
src/i18n/locales/pt.json
src/i18n/locales/en.json
src/components/LanguageSwitcher.tsx
src/components/BrandLogo.tsx
src/components/inputs/NIFInput.tsx
src/components/inputs/PhoneAOInput.tsx
src/components/inputs/PasswordInput.tsx
src/components/AlertCenter.tsx
src/lib/validators.ts
src/lib/brandingConfig.ts
src/lib/alertsConfig.ts
src/lib/alertsEngine.ts
src/pages/super-admin/Branding.tsx
src/pages/dashboard/Alerts.tsx
```

## Ficheiros a editar

```
index.html  (lang, notranslate, meta)
src/main.tsx  (import i18n)
src/App.tsx  (rotas /super-admin/branding e /dashboard/alerts)
src/components/SuperAdminSidebar.tsx  (item Branding)
src/components/AppSidebar.tsx  (item Alertas)
src/components/DashboardLayout.tsx  (AlertCenter + LanguageSwitcher)
src/components/SuperAdminLayout.tsx  (LanguageSwitcher)
src/components/SiteFooter.tsx  (BrandLogo + i18n)
src/pages/Landing.tsx  (BrandLogo + i18n)
src/pages/Login.tsx  (BrandLogo + PasswordInput + i18n)
src/pages/Register.tsx  (BrandLogo + NIF/Phone/Password + i18n)
src/pages/dashboard/Settings.tsx  (PhoneAO)
src/components/UserProfileDialog.tsx  (PasswordInput)
```

Confirma para eu avançar com a implementação completa, ou diz-me se queres começar só por uma fase específica (ex.: só i18n + validações primeiro).