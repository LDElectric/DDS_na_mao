/**
 * Smoke test do app em navegador real (Chrome headless via puppeteer-core).
 * Valida: sugestão, ciclo ler→escolher (abrir NÃO conta como leitura),
 * DDS do dia fixado para os turnos, impressão com ata, busca/biblioteca,
 * Service Worker e funcionamento OFFLINE.
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

const lerHistorico = () =>
  pagina.evaluate(() =>
    JSON.parse(localStorage.getItem("dds-na-mao:historico:v1") ?? "null"),
  );

const chaveHoje = () =>
  pagina.evaluate(() => {
    const d = new Date();
    const dois = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
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

  console.log("2) Leitura: abrir não conta, ESCOLHER registra");
  await pagina.click(".destaque__acoes a.botao--primario");
  await pagina.waitForSelector(".markdown p", { timeout: 15000 });
  const tamanhoTexto = await pagina.$eval(".markdown", (el) => el.textContent.length);
  verificar("texto do DDS carregado", tamanhoTexto > 800, `→ ${tamanhoTexto} caracteres`);

  let historico = await lerHistorico();
  verificar(
    "abrir o texto NÃO grava leitura",
    Object.keys(historico?.leituras ?? {}).length === 0,
    `→ ${Object.keys(historico?.leituras ?? {}).length} leitura(s)`,
  );
  verificar("sugestão do dia registrada", Object.keys(historico?.sugestoes ?? {}).length >= 1);
  verificar("último tema registrado para a regra de diversidade", Boolean(historico?.ultimoTema));

  await pagina.waitForSelector(".botao-escolher", { timeout: 5000 });
  await pagina.click(".botao-escolher");
  await pagina.waitForSelector(".confirmacao--ok", { timeout: 5000 });
  const confirmacao = await pagina.$eval(".confirmacao--ok", (el) => el.textContent);
  verificar(
    "confirmação encerra o ciclo (sem próximo sugerido)",
    /DDS do dia escolhido/i.test(confirmacao) && !/Sortear/i.test(confirmacao),
    `→ ${confirmacao.slice(0, 70)}…`,
  );

  historico = await lerHistorico();
  const hoje = await chaveHoje();
  verificar(
    "escolher grava a leitura",
    Object.keys(historico?.leituras ?? {}).length >= 1,
    `→ ${Object.keys(historico?.leituras ?? {}).length}`,
  );
  verificar(
    "DDS do dia fixado na data de hoje",
    Boolean(historico?.escolhas?.[hoje]),
    `→ ${JSON.stringify(historico?.escolhas?.[hoje])}`,
  );

  const linkImprimirConfirmacao = await pagina.$('.confirmacao a[href*="imprimir"]');
  verificar("confirmação oferece impressão com ata", Boolean(linkImprimirConfirmacao));

  console.log("3) Home com DDS fixado (turnos do dia)");
  await pagina.goto(URL, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".destaque__titulo", { timeout: 15000 });
  const seloDoDia = await pagina.$(".destaque .etiqueta--escolha");
  verificar("home exibe o selo 'DDS do dia'", Boolean(seloDoDia));
  const botaoResortear = await pagina.$(".destaque__acoes button");
  verificar("DDS fixado não oferece re-sorteio do dia", !botaoResortear);
  const notaFixado = await pagina.$eval(".destaque__nota", (el) => el.textContent).catch(() => "");
  verificar(
    "nota explica permanência até 23:59",
    /23:59/.test(notaFixado),
    `→ ${notaFixado.slice(0, 60)}`,
  );

  console.log("4) Busca manual");
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

  const avisoBusca = await pagina.$eval(".aviso", (el) => el.textContent);
  verificar(
    "estado vazio amigável com orientação",
    /Ops/i.test(avisoBusca) && /Biblioteca completa/.test(avisoBusca),
    `→ ${avisoBusca.slice(0, 70)}`,
  );
  const temasSugeridos = await pagina.$$eval(".sugestoes-tema .chips__item", (els) => els.length);
  verificar("sugere temas quando não encontra nada", temasSugeridos > 0, `→ ${temasSugeridos}`);

  console.log("5) Biblioteca");
  await pagina.goto(`${URL}#/biblioteca`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".grupo", { timeout: 15000 });
  const grupos = await pagina.$$eval(".grupo", (els) => els.length);
  const itens = await pagina.$$eval(".item-dds", (els) => els.length);
  verificar("6 partes agrupadas", grupos === 6, `→ ${grupos}`);
  verificar("todos os 228 DDS listados", itens === 228, `→ ${itens}`);
  const lidos = await pagina.$$eval(".item-dds__situacao--lido", (els) => els.length);
  verificar("marcação de lido visível", lidos >= 1, `→ ${lidos}`);

  console.log("6) Tela de DDS lidos (título + data + imprimir)");
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
  const botaoImprimir = await pagina.$(".item-lista__imprimir");
  verificar("cartão de lido oferece Imprimir / PDF", Boolean(botaoImprimir));
  const seloLista = await pagina.$(".item-dds .etiqueta--escolha");
  verificar("item do dia marcado como 'DDS do dia'", Boolean(seloLista));

  await pagina.goto(`${URL}#/lidos?janela=180`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".titulo-pagina", { timeout: 15000 });
  const rotuloJanela = await pagina.$eval(".chips__item--ativo", (el) => el.textContent.trim());
  verificar("filtro de 180 dias aplicado", rotuloJanela.includes("180"), `→ ${rotuloJanela}`);

  console.log("7) Impressão: texto + ata em página seguinte");
  const idEscolhido = await pagina.evaluate(() => {
    const bruto = localStorage.getItem("dds-na-mao:historico:v1");
    if (!bruto) return null;
    const h = JSON.parse(bruto);
    const d = new Date();
    const dois = (n) => String(n).padStart(2, "0");
    const chave = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
    return h?.escolhas?.[chave]?.id ?? Object.keys(h?.leituras ?? {})[0] ?? null;
  });
  await pagina.goto(`${URL}#/imprimir/${idEscolhido}`, { waitUntil: "networkidle0" });
  await pagina.waitForSelector(".folha__ata table", { timeout: 15000 });
  await pagina.waitForSelector(".folha__texto, .aviso--erro", { timeout: 15000 });

  const textoDocumento = await pagina.$eval(".folha__texto", (el) => el.textContent.length);
  verificar("documento traz o texto do DDS", textoDocumento > 800, `→ ${textoDocumento} caracteres`);

  const linhasAta = await pagina.$$eval(".folha__ata tbody tr", (els) => els.length);
  verificar("ata com 20 linhas de presença", linhasAta >= 20, `→ ${linhasAta}`);

  const tituloAta = await pagina.$eval(".folha__ata h2", (el) => el.textContent);
  verificar("título da lista de presença", /Lista de Presença/i.test(tituloAta), `→ ${tituloAta}`);

  const quebraDePagina = await pagina.$eval(".folha__ata", (el) => {
    const estilo = getComputedStyle(el);
    return estilo.breakBefore === "page" || estilo.pageBreakBefore === "always";
  });
  verificar("ata começa em página nova (frente e verso)", quebraDePagina);

  const assinaturas = await pagina.$$eval(".folha__assinatura", (els) => els.length);
  verificar("dois espaços de assinatura", assinaturas === 2, `→ ${assinaturas}`);

  const botoesImpressao = await pagina.$$eval(".impressao-acoes button", (els) =>
    els.map((e) => e.textContent.trim()),
  );
  verificar(
    "botões Imprimir/PDF e adicionar linhas",
    botoesImpressao.some((t) => /Imprimir/.test(t)) && botoesImpressao.some((t) => /10 linhas/.test(t)),
    `→ ${botoesImpressao.join(" | ")}`,
  );

  console.log("8) Cabeçalho: botão 'i' de instalação");
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

  console.log("9) PWA (manifest + Service Worker)");
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

  console.log("10) Funcionamento offline");
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
