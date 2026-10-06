/**
 * Gera os ícones PNG do PWA a partir do desenho oficial: public/favicon.svg.
 *
 *   public/icon-192.png          ícone normal (192)
 *   public/icon-512.png          ícone normal (512)
 *   public/icon-512-maskable.png ícone adaptável (conteúdo a 70%, fundo grafite)
 *
 * A rasterização usa o Chrome local (puppeteer-core, sem baixar navegador).
 * Sem Chrome no ambiente (ex.: CI), os PNGs já versionados são mantidos.
 *
 * Uso: npm run icones
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLICO = path.join(RAIZ, "public");
const SVG = path.join(PUBLICO, "favicon.svg");
const FUNDO_MASKABLE = "#2c2c2c"; // mesma cor do fundo do SVG

const CANDIDATOS_CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const SAIDAS = ["icon-192.png", "icon-512.png", "icon-512-maskable.png"];

const chrome = CANDIDATOS_CHROME.find((caminho) => caminho && fs.existsSync(caminho));

if (!chrome) {
  if (SAIDAS.every((arquivo) => fs.existsSync(path.join(PUBLICO, arquivo)))) {
    console.warn("! Chrome não encontrado: mantendo os ícones PNG já versionados.");
    process.exit(0);
  }
  throw new Error("Chrome não encontrado para rasterizar o favicon.svg (defina CHROME_PATH).");
}

if (!fs.existsSync(SVG)) {
  throw new Error(`favicon.svg não encontrado em ${SVG}`);
}

const svgBase64 = fs.readFileSync(SVG).toString("base64");

const renderizar = async (navegador, { arquivo, tamanho, escala, fundo }) => {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: tamanho, height: tamanho, deviceScaleFactor: 1 });
  await pagina.setContent(
    `<!doctype html><html><body style="margin:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:${fundo};overflow:hidden">
      <img src="data:image/svg+xml;base64,${svgBase64}" style="width:${escala * 100}%;height:${escala * 100}%;display:block" />
    </body></html>`,
    { waitUntil: "load" },
  );
  await pagina.waitForFunction(() => {
    const img = document.querySelector("img");
    return img && img.complete && img.naturalWidth > 0;
  }, { timeout: 15000 });

  const caminho = path.join(PUBLICO, arquivo);
  await pagina.screenshot({
    path: caminho,
    omitBackground: fundo === "transparent",
    clip: { x: 0, y: 0, width: tamanho, height: tamanho },
  });
  await pagina.close();
  const { size } = fs.statSync(caminho);
  console.log(`✔ public/${path.basename(caminho)} (${tamanho}x${tamanho}, ${size} bytes)`);
};

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"],
});

try {
  await renderizar(navegador, { arquivo: "icon-192.png", tamanho: 192, escala: 1, fundo: "transparent" });
  await renderizar(navegador, { arquivo: "icon-512.png", tamanho: 512, escala: 1, fundo: "transparent" });
  await renderizar(navegador, { arquivo: "icon-512-maskable.png", tamanho: 512, escala: 0.7, fundo: FUNDO_MASKABLE });
} finally {
  await navegador.close();
}
