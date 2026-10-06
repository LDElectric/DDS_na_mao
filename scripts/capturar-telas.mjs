/**
 * Captura as telas do app em um navegador headless (Chrome) para revisão visual.
 *
 * Uso: node scripts/capturar-telas.mjs <url> <pasta-saida>
 *      node scripts/capturar-telas.mjs http://localhost:4173/ ./telas
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const URL = process.argv[2] ?? "http://localhost:4173/";
const SAIDA = path.resolve(process.argv[3] ?? "./telas");
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

fs.mkdirSync(SAIDA, { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

const capturar = async (pagina, nome) => {
  const arquivo = path.join(SAIDA, `${nome}.png`);
  await pagina.screenshot({ path: arquivo });
  console.log(`  ✔ ${arquivo}`);
};

const abrir = async (url, { largura = 390, altura = 844 } = {}) => {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: largura, height: altura, isMobile: largura < 700 });
  await pagina.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
  return pagina;
};

// 1) Home (mobile)
let pagina = await abrir(URL);
await pagina.waitForSelector(".destaque__titulo", { timeout: 20000 });
await new Promise((resolver) => setTimeout(resolver, 600));
await capturar(pagina, "01-home-mobile");

// 2) Leitura
await pagina.click(".destaque__acoes a.botao--primario");
await pagina.waitForSelector(".markdown p", { timeout: 20000 });
await new Promise((resolver) => setTimeout(resolver, 600));
await capturar(pagina, "02-leitura-mobile");

// 3) Busca
await pagina.goto(`${URL}#/busca`, { waitUntil: "networkidle0" });
await pagina.waitForSelector(".campo-busca input", { timeout: 20000 });
await pagina.type(".campo-busca input", "altura");
await pagina.waitForFunction(() => document.querySelectorAll(".lista .item-dds").length > 0, {
  timeout: 20000,
});
await new Promise((resolver) => setTimeout(resolver, 400));
await capturar(pagina, "03-busca-mobile");
await pagina.close();

// 4) Biblioteca
pagina = await abrir(`${URL}#/biblioteca`);
await pagina.waitForSelector(".grupo", { timeout: 20000 });
await new Promise((resolver) => setTimeout(resolver, 400));
await capturar(pagina, "04-biblioteca-mobile");
await pagina.close();

// 5) Home desktop
pagina = await abrir(URL, { largura: 1280, altura: 900 });
await pagina.waitForSelector(".destaque__titulo", { timeout: 20000 });
await new Promise((resolver) => setTimeout(resolver, 600));
await capturar(pagina, "05-home-desktop");
await pagina.close();

// 6) Modo claro
pagina = await abrir(URL);
await pagina.waitForSelector(".destaque__titulo", { timeout: 20000 });
await pagina.click(".cabecalho .botao-icone");
await new Promise((resolver) => setTimeout(resolver, 500));
await capturar(pagina, "06-home-claro");
await pagina.close();

await navegador.close();
console.log("✔ telas capturadas");
