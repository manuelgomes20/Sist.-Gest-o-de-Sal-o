export interface BrandingConfig {
  brandName: string;
  brandTagline: string;
  landingLogo?: string;
  loginLogo?: string;
  registerLogo?: string;
  footerLogo?: string;
  favicon?: string;
  heroBanner?: string;
  loginBanner?: string;
}

const KEY = "genomni_branding";

const defaults: BrandingConfig = {
  brandName: "GenOmni Salon",
  brandTagline: "Inovação em Todas as direções",
  landingLogo: "/genomni-logo.jpeg",
  loginLogo: "/genomni-logo.jpeg",
  registerLogo: "/genomni-logo.jpeg",
  footerLogo: "/genomni-logo.jpeg",
  favicon: "/favicon.png",
};

export const loadBranding = (): BrandingConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
};

export const saveBranding = (cfg: BrandingConfig) => {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("branding-updated"));
  applyFavicon(cfg.favicon);
};

export const applyFavicon = (url?: string) => {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
};

// Resize image to max dimension and return base64
export const resizeImage = (file: File, maxDim: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type.includes("png") ? "image/png" : "image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
