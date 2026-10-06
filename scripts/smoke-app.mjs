/**
 * Smoke test do app em navegador real (Chrome headless via puppeteer-core).
 * Valida: renderização da sugestão, leitura do Markdown, busca, biblioteca,
 * registro do histórico, Service Worker e funcionamento OFFLINE.
 *
 * Pré-requisito: build feito (`npm run build`) e preview rodando em :4173.
 * Uso: node scripts/smoke-app.mjs [url]
 */
import puppeteer from "puppeteer-core";

const URL = process.argv[2] ?? "http://localhost:4173/";
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let falhas = 0;
const verificar = (rotulo, condicao, detalhe = "") => {
  if (condicao) console.log(`  ✔ ${rotulo}`);
  else {
    falhas++;
    console.error(`  ✘ ${rotulo} ${detalhe}`);
  }
};

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  protocolTimeout: 60000,
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

const errosDeConsole = [];
pagina.on("pageerror", (erro) => errosDeConsole.push(`pageerror: ${erro.message}`));
pagina.on("console", (mensagem) => {
  if (mensagem.type() === "error") errosDeConsole.push(`console: ${mensagem.text()}`);
});

try {
  console.log("1) Home / Sugestão do dia");
  await pagina.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
  await pagina.waitForSelector(".destaque__titulo", { timeout: 15000 });
  const titulo = await pagina.$eval(".destaque__titulo", (el) => el.textContent.trim());
  verificar("título da sugestão renderizado", titulo.length > 3, `→ "${titulo}"`);

  const etiquetas = await pagina.$$eval(".destaque .etiqueta", (els) => els.map((e) => e.textContent.trim()));
  verificar("etiquetas de tema/origem presentes", etiquetas.length >= 2, `→ ${etiquetas.join(" | ")}`);

  const estatisticas = await pagina.$$eval(".painel-estatisticas strong", (els) => els.map((e) => e.textContent));
  verificar("painel com 228 DDS no catálogo", estatisticas.includes("228"), `→ ${estatisticas.join(",")}`);

  console.log("2) Leitura (Markdown + histórico)");
  await pagina.click(".destaque__acoes a.botao--primario");
  await pagina.waitForSelector(".markdown p", { timeout: 15000 });
  const tamanhoTexto = await pagina.$eval(".markdown", (el) => el.textContent.length);
  verificar("texto do DDS carregado", tamanhoTexto > 800, `→ ${tamanhoTexto} caracteres`);

  const historico = await pagina.evaluate(() =>
    JSON.parse(localStorage.getItem("dds-na-mao:historico:v1") ?? "null"),
  );
  verificar("histórico gravado no localStorage", Object.keys(historico?.leituras ?? {}).length >= 1);
  verificar("sugestão do dia registrada", Object.keys(historico?.sugestoes ?? {}).length >= 1);
  verificar("último tema registrado para a regra de diversidade", Boolean(historico?.ultimoTema));

  console.log("3) Busca manual");
  await pagina.goto(`${URL}#/busca`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".campo-busca input", { timeout: 15000 });
  await pagina.type(".campo-busca input", "altura");
  await pagina.waitForFunction(
    () => document.querySelectorAll(".lista .item-dds").length > 0,
    { timeout: 15000 },
  );
  const resultados = await pagina.$$eval(".lista .item-dds", (els) => els.length);
  verificar("busca retorna resultados para 'altura'", resultados > 0, `→ ${resultados}`);

  await pagina.evaluate(() => {
    const campo = document.querySelector(".campo-busca input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(campo, "");
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await pagina.type(".campo-busca input", "zzzzz-sem-resultado");
  const vazios = await pagina.$$eval(".lista .item-dds", (els) => els.length);
  verificar("busca sem resultados é vazia", vazios === 0, `→ ${vazios}`);

  console.log("4) Biblioteca");
  await pagina.goto(`${URL}#/biblioteca`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".grupo", { timeout: 15000 });
  const grupos = await pagina.$$eval(".grupo", (els) => els.length);
  const itens = await pagina.$$eval(".item-dds", (els) => els.length);
  verificar("6 partes agrupadas", grupos === 6, `→ ${grupos}`);
  verificar("todos os 228 DDS listados", itens === 228, `→ ${itens}`);
  const lidos = await pagina.$$eval(".item-dds__situacao--lido", (els) => els.length);
  verificar("marcação de lido visível", lidos >= 1, `→ ${lidos}`);

  console.log("5) Tela de DDS lidos (título + data)");
  await pagina.goto(`${URL}#/lidos`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".lista .item-dds", { timeout: 15000 });
  const metaLidos = await pagina.$$eval(".item-dds__meta", (els) => els.map((e) => e.textContent));
  verificar("lista de lidos traz ao menos 1 item", metaLidos.length >= 1, `→ ${metaLidos.length}`);
  verificar(
    "cada item mostra a data da leitura",
    metaLidos.every((texto) => /Lido em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/.test(texto)),
    `→ ${metaLidos[0] ?? ""}`,
  );
  const temLink = await pagina.$(".lista a.item-dds");
  verificar("item da lista reabre o DDS (link)", Boolean(temLink));

  await pagina.goto(`${URL}#/lidos?janela=180`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".titulo-pagina", { timeout: 15000 });
  const rotuloJanela = await pagina.$eval(".chips__item--ativo", (el) => el.textContent.trim());
  verificar("filtro de 180 dias aplicado", rotuloJanela.includes("180"), `→ ${rotuloJanela}`);

  console.log("6) Cabeçalho: botão 'i' de instalação");
  await pagina.goto(URL, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".btn-info", { timeout: 15000 });
  const atalhosEstatisticas = await pagina.$$eval(".painel-estatisticas__item", (els) =>
    els.map((e) => e.tagName),
  );
  verificar("cards de estatística viraram links", atalhosEstatisticas.every((t) => t === "A"));
  await pagina.click(".btn-info");
  await pagina.waitForSelector(".modal-overlay--aberto .modal", { timeout: 10000 });
  const textoModal = await pagina.$eval(".modal", (el) => el.textContent);
  verificar(
    "modal explica como instalar (Android e iPhone)",
    textoModal.includes("Android") && textoModal.includes("iPhone"),
  );
  const credito = await pagina.$eval(".modal__creditos", (el) => ({
    texto: el.textContent,
    href: el.querySelector("a")?.getAttribute("href") ?? "",
    externo: el.querySelector("a")?.target === "_blank",
  }));
  verificar(
    "créditos com o autor e link do LinkedIn",
    credito.texto.includes("Leonam Dias") &&
      credito.href === "https://www.linkedin.com/in/leonamdias1" &&
      credito.externo,
    `→ ${credito.href}`,
  );
  await pagina.keyboard.press("Escape");
  await pagina.waitForFunction(() => !document.querySelector(".modal-overlay--aberto"), {
    timeout: 5000,
  });
  verificar("modal fecha com Escape", true);

  console.log("7) PWA (manifest + Service Worker)");
  await pagina.goto(URL, { waitUntil: "networkidle0" });
  const manifest = await pagina.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return null;
    const resposta = await fetch(link.href);
    return resposta.ok ? resposta.json() : null;
  });
  verificar("manifest encontrado", Boolean(manifest));
  verificar(
    "manifest com nome 'DDS na mão'",
    manifest?.name === "DDS na mão" && manifest?.short_name === "DDS na mão",
    `→ name=${manifest?.name} / short_name=${manifest?.short_name}`,
  );
  verificar("manifest com 3 ícones", manifest?.icons?.length === 3, `→ ${manifest?.icons?.length}`);

  const swAtivo = await pagina.evaluate(async () => {
    const registro = await navigator.serviceWorker.ready;
    return Boolean(registro.active);
  });
  verificar("Service Worker ativo", swAtivo);

  // Dá tempo do pré-cache terminar antes de simular offline.
  await new Promise((resolver) => setTimeout(resolver, 2500));

  console.log("8) Funcionamento offline");
  await pagina.setOfflineMode(true);
  try {
    await pagina.reload({ waitUntil: "networkidle0", timeout: 20000 });
    await pagina.waitForSelector(".destaque__titulo", { timeout: 15000 });
    verificar("app carrega sem conexão", true);

    await pagina.goto(`${URL}#/biblioteca`, { waitUntil: "networkidle0" });
    await pagina.waitForSelector(".grupo", { timeout: 15000 });
    verificar("biblioteca acessível offline", true);

    const idOffline = await pagina.evaluate(async () => {
      const resposta = await fetch("conteudo/catalogo.json");
      if (!resposta.ok) return null;
      const catalogo = await resposta.json();
      return catalogo.length;
    });
    verificar("catálogo servido pelo cache offline", idOffline === 228, `→ ${idOffline}`);
  } catch (falha) {
    verificar("app carrega sem conexão", false, `→ ${falha.message}`);
  } finally {
    await pagina.setOfflineMode(false);
  }
} catch (falha) {
  verificar("execução geral do smoke test", false, `→ ${falha.message}`);
} finally {
  await navegador.close();
}

const falhasIgnoradas = errosDeConsole.filter(
  (linha) => !/favicon|manifest\.webmanifest/.test(linha),
);
verificar("nenhum erro de console na aplicação", falhasIgnoradas.length === 0, `→ ${falhasIgnoradas.join(" | ")}`);

console.log(falhas ? `\n✘ ${falhas} verificação(ões) falharam` : "\n✔ smoke test passou");
process.exit(falhas ? 1 : 0);
