/**
 * Gera o catálogo estático do PWA a partir dos arquivos-fonte .txt.
 *
 *   Pasta "Parte X - ..." > "Capitulo N - ..." > "DDS - Título.txt"
 *   Pasta "Parte VI - Calendario Anual SESMT" > "Mes NN - ..." > "DDS - Mês - Título.txt"
 *   Pasta "Parte VII - Datas Comemorativas" > "Datas Comemorativas" > "DDS - Título.txt"
 *
 * Saída:
 *   public/conteudo/<slug>.md      (texto integral do DDS)
 *   public/conteudo/catalogo.json  (índice usado pelo app)
 *
 * Uso: npm run conteudo
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SAINDA = path.join(RAIZ, "public", "conteudo");

/** Tema (agrupamento lógico) derivado do capítulo de origem. */
const TEMAS_CAPITULO = {
  1: "cultura",
  2: "gestao-de-riscos",
  3: "ergonomia",
  4: "saude-mental",
  5: "higiene-ocupacional",
  6: "maquinas-e-equipamentos",
  7: "eletricidade",
  8: "trabalho-em-altura",
  9: "espacos-confinados",
  10: "incendio",
  11: "logistica",
  12: "emergencias",
  13: "meio-ambiente",
  14: "seguranca-vida",
};

const MESES = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const romanoParaNumero = (romano) => {
  const tabela = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
  return tabela[romano.trim().toUpperCase()] ?? null;
};

const semAcento = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const slugificar = (texto) =>
  semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "# DDS: Título - Legenda" -> { titulo, subtitulo } */
const extrairTitulo = (primeiraLinha) => {
  let titulo = primeiraLinha.replace(/^#+\s*/, "").replace(/^DDS:\s*/i, "").trim();
  const corte = titulo.indexOf(" - ");
  if (corte > 0 && titulo.length - (corte + 3) >= 12) {
    return {
      titulo: titulo.slice(0, corte).trim(),
      subtitulo: titulo.slice(corte + 3).trim(),
    };
  }
  return { titulo, subtitulo: null };
};

const listarPastas = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

const principal = () => {
  fs.rmSync(SAINDA, { recursive: true, force: true });
  fs.mkdirSync(SAINDA, { recursive: true });

  const pastasParte = listarPastas(RAIZ)
    .filter((n) => /^Parte\s+[IVX]+\b/.test(n))
    .sort((a, b) => romanoParaNumero(a.match(/^Parte\s+([IVX]+)/)[1]) - romanoParaNumero(b.match(/^Parte\s+([IVX]+)/)[1]));

  const catalogo = [];
  const slugs = new Set();
  let ignorados = 0;

  for (const pastaParte of pastasParte) {
    const parteRomana = pastaParte.match(/^Parte\s+([IVX]+)/)[1];
    const parte = romanoParaNumero(parteRomana);
    const parteNome = pastaParte.replace(/^Parte\s+[IVX]+\s*-\s*/, "").trim();
    const caminhoParte = path.join(RAIZ, pastaParte);

    for (const pastaInterna of listarPastas(caminhoParte).sort()) {
      const caminhoInterno = path.join(caminhoParte, pastaInterna);
      const arquivos = fs
        .readdirSync(caminhoInterno, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".txt"))
        .map((e) => e.name)
        .sort();

      const ehCalendario = /^Mes\s+\d{2}/.test(pastaInterna);
      const capituloMatch = pastaInterna.match(/^Capitulo\s+(\d+)/);
      const capitulo = capituloMatch ? Number(capituloMatch[1]) : null;
      const capituloNome = pastaInterna.replace(/^Capitulo\s+\d+\s*-\s*/, "").trim();

      const mesMatch = pastaInterna.match(/^Mes\s+\d{2}\s*-\s*(.+)$/);
      const campanha = ehCalendario && mesMatch
        ? MESES[Number(pastaInterna.match(/^Mes\s+(\d{2})/)[1]) - 1]
        : null;

      for (const nomeArquivo of arquivos) {
        const caminhoArquivo = path.join(caminhoInterno, nomeArquivo);
        const conteudo = fs.readFileSync(caminhoArquivo, "utf8").replace(/\r\n/g, "\n").trim();
        const primeiraLinha = (conteudo.split("\n").find((l) => l.trim().startsWith("#")) ?? "").trim();

        if (!primeiraLinha) {
          console.warn(`  ! sem H1, ignorado: ${nomeArquivo}`);
          ignorados++;
          continue;
        }

        const { titulo, subtitulo } = extrairTitulo(primeiraLinha);

        let slug = slugificar(nomeArquivo.replace(/^DDS\s*-\s*/i, "").replace(/\.txt$/i, ""));
        if (!slug) slug = `dds-${catalogo.length + 1}`;
        while (slugs.has(slug)) slug = `${slug}-${slugs.size + 1}`;
        slugs.add(slug);

        fs.writeFileSync(path.join(SAINDA, `${slug}.md`), `${conteudo}\n`, "utf8");

        const estatutica = fs.statSync(caminhoArquivo);
        catalogo.push({
          id: slug,
          titulo,
          subtitulo,
          tema: ehCalendario ? "campanha-sesmt" : TEMAS_CAPITULO[capitulo] ?? "geral",
          campanha_sesmt: campanha,
          arquivo_md: `conteudo/${slug}.md`,
          data_criacao: estatutica.mtime.toISOString().slice(0, 10),
          parte,
          parte_nome: parteNome,
          capitulo,
          capitulo_nome: ehCalendario ? pastaInterna.replace(/^Mes\s+\d{2}\s*-\s*/, "").trim() : capituloNome,
        });
      }
    }
  }

  catalogo.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  fs.writeFileSync(path.join(SAINDA, "catalogo.json"), `${JSON.stringify(catalogo, null, 2)}\n`, "utf8");

  const comCampanha = catalogo.filter((i) => i.campanha_sesmt).length;
  const temas = [...new Set(catalogo.map((i) => i.tema))].sort();
  console.log(`✔ ${catalogo.length} DDS catalogados em public/conteudo/ (${ignorados} ignorados)`);
  console.log(`✔ ${comCampanha} DDS com campanha SESMT | ${temas.length} temas: ${temas.join(", ")}`);
};

principal();
