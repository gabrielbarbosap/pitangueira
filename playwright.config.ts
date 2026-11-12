import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Testes de ponta a ponta. O app roda em MODO DEMO (sem Firebase): os dados ficam no navegador de cada teste,
// então cada teste começa limpo, como um arquiteto novo. As regras do Firestore NÃO são exercitadas aqui.

// Alguns terminais definem NO_COLOR e FORCE_COLOR juntos; o Node avisa disso a cada processo e polui a saída.
delete process.env.NO_COLOR;

const PORTA = Number(process.env.E2E_PORT ?? 3412);
const URL_BASE = `http://localhost:${PORTA}`;

// Usa o Chrome instalado quando existe (não baixa navegador). Senão, o Chromium do Playwright
// (instale com: npx playwright install chromium). E2E_CHANNEL força outro canal (ex.: msedge).
const CHROME_WINDOWS = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const canal = process.env.E2E_CHANNEL ?? (existsSync(CHROME_WINDOWS) ? "chrome" : undefined);

// Variáveis do Firebase em branco: o app cai no modo demo mesmo com .env.local presente.
// (Valem para o build, pois o Next embute as NEXT_PUBLIC_* na hora de compilar.)
const semFirebase = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "",
  NEXT_PUBLIC_FIREBASE_APP_ID: "",
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: URL_BASE,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: canal } },
    { name: "celular", use: { ...devices["Pixel 7"], channel: canal } },
  ],
  // Compila e serve uma versão de produção (pega erros que o modo dev esconde). Reaproveita um servidor já ligado.
  webServer: {
    command: `npm run build && npx next start --port ${PORTA}`,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: semFirebase,
    stdout: "ignore",
    stderr: "pipe",
  },
});
