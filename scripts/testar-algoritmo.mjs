/**
 * Testes do motor de sugestão com datas forçadas (Fase 5 do plano).
 * Uso: node scripts/testar-algoritmo.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DIAS_JANELA_LEITURA,
  campanhaDoDia,
  chaveDia,
  filtrarLidosRecentes,
  mesAtual,
  sortearNovoDDS,
  sortearOutro,
  sugerirCampanhaMes,
  sugerirDoDia,
} from "../src/lib/algoritmo.js";
import { listarLeituras, registrarEscolha, escolhaDoDia, escolhidoHoje, registradoHoje } from "../src/lib/historico.js";
import { semTituloInicial } from "../src/lib/markdown.js";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalogo = JSON.parse(
  fs.readFileSync(path.join(RAIZ, "public", "conteudo", "catalogo.json"), "utf8"),
);

const historicoVazio = () => ({
  versao: 2,
  leituras: {},
  escolhas: {},
  leitores: {},
  sugestoes: {},
  ultimoTema: null,
});

let falhas = 0;
const verificar = (rotulo, condicao, detalhe = "") => {
  if (condicao) console.log(`  ✔ ${rotulo}`);
  else {
    falhas++;
    console.error(`  ✘ ${rotulo} ${detalhe}`);
  }
};

const diasAtras = (dias) => new Date(Date.now() - dias * 86400000).toISOString();

console.log("1) Campanha do mês: sempre na 1ª sugestão");
{
  const agora = new Date("2026-11-05T09:00:00");
  verificar("mês atual é novembro", mesAtual(agora) === "novembro", `→ ${mesAtual(agora)}`);

  const historico = historicoVazio();
  const campanha = sugerirCampanhaMes(catalogo, historico, agora);
  verificar(
    "primeira sugestão do mês vem da campanha",
    Boolean(campanha?.dds) && campanha.origem === "campanha",
  );
  verificar(
    "o DDS sorteado é de novembro",
    campanha?.dds?.campanha_sesmt === "novembro",
    `→ ${campanha?.dds?.id}`,
  );

  // A campanha não "acaba" no primeiro acesso: reabrir o app volta a sortear
  // um DDS do mês (a 1ª sugestão é sempre da campanha).
  const novamente = sugerirCampanhaMes(catalogo, historico, agora);
  verificar(
    "reabrir o app mantém a campanha na frente",
    novamente?.dds?.campanha_sesmt === "novembro",
    `→ ${novamente?.dds?.id}`,
  );

  const historicoDoDia = { ...historico, sugestoes: { [chaveDia(agora)]: campanha.dds.id } };
  const repetida = sugerirDoDia(catalogo, historicoDoDia, agora);
  verificar("na mesma sessão a sugestão é estável (mesmo id)", repetida?.dds.id === campanha.dds.id);
}

console.log("2) Regra dos 6 meses (Prioridade 2)");
{
  const agora = new Date();
  const historico = historicoVazio();
  const amostra = catalogo.slice(0, 40);
  amostra.forEach((item, indice) => {
    historico.leituras[item.id] = indice % 2 === 0 ? diasAtras(30) : diasAtras(400);
  });

  const recentes = filtrarLidosRecentes(amostra, historico, DIAS_JANELA_LEITURA, agora);
  verificar(
    "exclui DDS lidos há menos de 180 dias",
    recentes.length === 20 &&
      recentes.every(
        (i) => new Date(historico.leituras[i.id]).getTime() < agora.getTime() - 180 * 86400000,
      ),
    `→ ${recentes.length} itens`,
  );
  verificar("mantém DDS lidos há mais de 180 dias", recentes.some((i) => i.id === amostra[1].id));

  const sorteio = sortearOutro(amostra, historico, { agora });
  verificar("o sorteio sai da lista filtrada", recentes.some((i) => i.id === sorteio?.dds.id));
  verificar(
    "o sorteio nunca repete leitura recente",
    !historico.leituras[sorteio?.dds.id] ||
      new Date(historico.leituras[sorteio.dds.id]).getTime() < agora.getTime() - 180 * 86400000,
  );
}

console.log("3) Regra de diversidade (Prioridade 3)");
{
  const ultimoTema = "ergonomia";
  const comTema = catalogo.filter((i) => i.tema === "ergonomia");
  const resultado = sortearNovoDDS(comTema, ultimoTema);
  verificar("esvazia a lista quando só há o mesmo tema", resultado !== null);

  const misto = catalogo.filter((i) => ["ergonomia", "cultura", "incendio"].includes(i.tema));
  const escolhas = Array.from({ length: 60 }, () => sortearNovoDDS(misto, ultimoTema));
  verificar(
    "nunca sorteia o mesmo tema em 60 tentativas",
    escolhas.every((i) => i && i.tema !== ultimoTema),
  );
  verificar("a diversidade de resultados é real", new Set(escolhas.map((i) => i.id)).size > 1);
}

console.log("4) Integração: ordem estrita de prioridades");
{
  // 06/10 não é dia celebrado: o fluxo normal começa pela campanha do mês.
  const agora = new Date("2026-10-06T08:00:00");
  const historico = historicoVazio();
  catalogo.slice(0, 60).forEach((item, indice) => {
    historico.leituras[item.id] = diasAtras(10 + indice);
  });

  const primeira = sugerirDoDia(catalogo, historico, agora);
  verificar("primeiro acesso do mês sorteia a campanha", primeira?.origem === "campanha");
  verificar("campanha de outubro", primeira?.dds.campanha_sesmt === "outubro");

  // Voltar da leitura mantém a sugestão da sessão (sem re-sorteio).
  const comSugestao = { ...historico, sugestoes: { [chaveDia(agora)]: primeira.dds.id } };
  const segundaLigacao = sugerirDoDia(catalogo, comSugestao, agora);
  verificar("voltar da leitura mantém a sugestão da sessão", segundaLigacao?.dds.id === primeira.dds.id);

  // Dia celebrado tem prioridade sobre a campanha.
  const no27 = sugerirDoDia(catalogo, historicoVazio(), new Date("2026-11-27T09:00:00"));
  verificar("27/11 rege a sugestão com o DDS da data", no27?.dds.id === "novembro-o-dia-do-tst-e-engenheiro");

  // Toda a campanha do mês lida: a 1ª sugestão segue vindo da campanha
  // (repetição permitida — ela nunca deixa de ser a 1ª posição).
  const doMes = catalogo.filter((i) => i.campanha_sesmt === "novembro");
  const tudoLido = {
    ...historicoVazio(),
    leituras: Object.fromEntries(doMes.map((i) => [i.id, diasAtras(5)])),
  };
  const semDisponivel = sugerirDoDia(catalogo, tudoLido, new Date("2026-11-20T09:00:00"));
  verificar(
    "mesmo lendo o mês todo, a 1ª sugestão segue da campanha",
    semDisponivel?.dds?.campanha_sesmt === "novembro",
    `→ ${semDisponivel?.dds?.id}`,
  );

  // Sem nenhum DDS de campanha no mês, cai para a antirrepeticão (6 meses).
  const semCalendario = catalogo.filter((i) => !i.campanha_sesmt);
  const semMes = sugerirDoDia(semCalendario, historicoVazio(), new Date("2026-11-20T09:00:00"));
  verificar("sem campanha no mês, aplica a regra dos 6 meses", semMes?.origem === "antirepeticao");
}

console.log("5) Campanhas do mês e dias celebrados");
{
  const outubro = campanhaDoDia(new Date("2026-10-06T09:00:00"));
  verificar(
    "campanha do mês traz o nome oficial (Outubro Rosa)",
    outubro?.chave === "outubro" && outubro.nome === "Outubro Rosa" && outubro.dia === null,
    `→ ${JSON.stringify(outubro)}`,
  );

  const diaMama = campanhaDoDia(new Date("2027-10-19T09:00:00"));
  verificar(
    "19/10 sem texto de data: vale a campanha do mês",
    diaMama?.nome === "Outubro Rosa" && diaMama.dia === null,
    `→ ${JSON.stringify(diaMama)}`,
  );

  const abril28 = new Date("2027-04-28T09:00:00");
  const sugestao28 = sugerirDoDia(catalogo, historicoVazio(), abril28);
  verificar(
    "28/04 sugere o DDS que alude à data",
    sugestao28?.dds.id === "abril-28-de-abril" && sugestao28.origem === "campanha",
    `→ ${sugestao28?.dds.id}`,
  );

  const diaMulher = new Date("2027-03-08T09:00:00");
  const sugestaoMulher = sugerirDoDia(catalogo, historicoVazio(), diaMulher);
  verificar(
    "08/03 sugere um DDS da campanha da mulher",
    sugestaoMulher?.dds.campanha_sesmt === "marco" && sugestaoMulher.origem === "campanha",
    `→ ${sugestaoMulher?.dds.id}`,
  );

  const jaLido = {
    ...historicoVazio(),
    leituras: {
      "abril-28-de-abril": new Date(abril28.getTime() - 10 * 86400000).toISOString(),
    },
  };
  const sugestaoJaLido = sugerirDoDia(catalogo, jaLido, abril28);
  verificar(
    "dia celebrado respeita a janela de 6 meses (cai para a campanha do mês)",
    sugestaoJaLido?.dds.campanha_sesmt === "abril" && sugestaoJaLido.dds.id !== "abril-28-de-abril",
    `→ ${sugestaoJaLido?.dds.id}`,
  );

  const outubro6 = new Date("2026-10-06T09:00:00");
  const outubro6Camp = campanhaDoDia(outubro6);
  verificar(
    "campanha traz a cor do mês (hex rosado)",
    /^#[0-9a-f]{6}$/i.test(outubro6Camp?.cor ?? "") && outubro6Camp.cor === "#d95f8b",
    `→ ${outubro6Camp?.cor}`,
  );

  verificar(
    "campanha traz o assunto (do que se trata)",
    outubro6Camp?.assunto === "Conscientização sobre o Câncer de Mama",
    `→ ${outubro6Camp?.assunto}`,
  );

  const sugestaoOut = sugerirDoDia(catalogo, historicoVazio(), outubro6);
  verificar(
    "sugestão de outubro vem da campanha do mês",
    sugestaoOut?.origem === "campanha" && sugestaoOut.dds.campanha_sesmt === "outubro",
    `→ ${sugestaoOut?.dds.id}`,
  );

  const variedade = new Set(
    Array.from({ length: 60 }, () => sugerirDoDia(catalogo, historicoVazio(), outubro6).dds.id),
  );
  verificar(
    "a sugestão da campanha é aleatória (varia entre os textos do mês)",
    variedade.size > 1,
    `→ ${[...variedade].join(", ")}`,
  );

  const nucleoLido = {
    ...historicoVazio(),
    leituras: {
      "outubro-rosa-incentivo-a-prevencao-do-cancer-de-mama":
        new Date(outubro6.getTime() - 5 * 86400000).toISOString(),
    },
  };
  const sugestaoSemNucleo = sugerirDoDia(catalogo, nucleoLido, outubro6);
  verificar(
    "texto da campanha lido há pouco não volta na sugestão",
    sugestaoSemNucleo?.dds.campanha_sesmt === "outubro" &&
      sugestaoSemNucleo.dds.id !== "outubro-rosa-incentivo-a-prevencao-do-cancer-de-mama",
    `→ ${sugestaoSemNucleo?.dds.id}`,
  );

  const novAdv = new Date("2026-11-05T09:00:00");
  const sugNovo = sugerirDoDia(catalogo, historicoVazio(), novAdv);
  verificar(
    "campanha de novembro abre com um DDS do mês",
    sugNovo?.dds.campanha_sesmt === "novembro" && sugNovo.origem === "campanha",
    `→ ${sugNovo?.dds.id}`,
  );

  const dez3 = new Date("2026-12-03T09:00:00");
  const sugDez = sugerirDoDia(catalogo, historicoVazio(), dez3);
  verificar(
    "campanha de dezembro abre com um DDS do mês",
    sugDez?.dds.campanha_sesmt === "dezembro" && sugDez.origem === "campanha",
    `→ ${sugDez?.dds.id}`,
  );

  // Datas comemorativas continuam regendo a sugestão com o DDS que alude à data.
  const sugTst = sugerirDoDia(catalogo, historicoVazio(), new Date("2026-11-27T09:00:00"));
  verificar(
    "27/11 sugere o DDS alusivo à data (homenagem ao TST)",
    sugTst?.dds.id === "novembro-o-dia-do-tst-e-engenheiro",
    `→ ${sugTst?.dds.id}`,
  );

  const sugEng = sugerirDoDia(catalogo, historicoVazio(), new Date("2026-12-11T09:00:00"));
  verificar(
    "11/12 sugere o DDS alusivo à data (Dia do Engenheiro)",
    sugEng?.dds.id === "dezembro-o-dia-do-engenheiro",
    `→ ${sugEng?.dds.id}`,
  );

  // Sugestão da sessão é mantida (é a nova abertura do app que troca o texto).
  const out8 = new Date("2026-10-08T09:00:00");
  const sugestaoSalva = {
    ...historicoVazio(),
    sugestoes: {
      [chaveDia(out8)]: "outubro-rosa-mes-de-conscientizacao-sobre-o-cancer-de-mama",
    },
  };
  const mantida = sugerirDoDia(catalogo, sugestaoSalva, out8);
  verificar(
    "sugestão da sessão é mantida ao navegar",
    mantida?.dds.id === "outubro-rosa-mes-de-conscientizacao-sobre-o-cancer-de-mama" &&
      mantida.origem === "do-dia",
    `→ ${mantida?.dds.id}`,
  );

  // Sem textos próprios de 10/10 e 19/10, outubro é campanha pura.
  const diaEscolas = new Date("2026-10-10T09:00:00");
  const semEscola = sugerirDoDia(catalogo, historicoVazio(), diaEscolas);
  verificar(
    "10/10: sem texto de escolas, cai para a campanha do mês",
    semEscola?.origem === "campanha" && semEscola.dds.campanha_sesmt === "outubro",
    `→ ${semEscola?.dds.id}`,
  );
}

console.log("6) Busca e catálogo");
{
  verificar("catálogo com 228 itens", catalogo.length === 228, `→ ${catalogo.length}`);
  verificar("ids únicos", new Set(catalogo.map((i) => i.id)).size === catalogo.length);
  verificar("todos têm H1/título", catalogo.every((i) => i.titulo?.length > 0));
  verificar(
    "60 DDS de campanha SESMT",
    catalogo.filter((i) => i.campanha_sesmt).length === 60,
    `→ ${catalogo.filter((i) => i.campanha_sesmt).length}`,
  );
  verificar(
    "novos DDS de campanha incluídos (outubro x3, novembro e dezembro)",
    [
      "outubro-rosa-incentivo-a-prevencao-do-cancer-de-mama",
      "outubro-rosa-mes-de-conscientizacao-sobre-o-cancer-de-mama",
      "outubro-rosa-saude-da-mulher-cuidados-antes-durante-e-apos-o-cancer-de-mama",
      "novembro-o-exame-que-incomoda-e-salva",
      "dezembro-sinais-que-a-pele-da",
    ].every((id) => catalogo.some((i) => i.id === id)),
  );
  verificar(
    "outubro reúne 3 DDS de campanha (textos novos)",
    catalogo.filter((i) => i.campanha_sesmt === "outubro").length === 3,
    `→ ${catalogo.filter((i) => i.campanha_sesmt === "outubro").length}`,
  );
  verificar(
    "todos os arquivos .md existem",
    catalogo.every((i) => fs.existsSync(path.join(RAIZ, "public", i.arquivo_md))),
  );
}

console.log("7) Lista de DDS lidos");
{
  const agora = new Date("2026-10-06T12:00:00").getTime();
  const historico = {
    ...historicoVazio(),
    leituras: {
      [catalogo[0].id]: "2026-10-06T10:00:00.000Z",
      [catalogo[1].id]: "2026-01-01T10:00:00.000Z",
    },
    escolhas: {
      "2026-10-06": { id: catalogo[0].id, iso: "2026-10-06T10:00:00.000Z" },
    },
  };
  const todos = listarLeituras(historico, catalogo, null, agora);
  const janela = listarLeituras(historico, catalogo, 180, agora);
  verificar("lista total tem 2 itens", todos.length === 2);
  verificar("mais recente vem primeiro", todos[0].id === catalogo[0].id);
  verificar("janela de 180 dias omite leitura antiga", janela.length === 1 && janela[0].id === catalogo[0].id);
  verificar("traz o título do catálogo", todos[0].titulo === catalogo[0].titulo);
  verificar("identifica qual é o DDS do dia", todos[0].doDia === true && todos[1].doDia === false);
}

console.log("8) Ciclo do dia: abrir não é lido; escolher fixa o DDS");
{
  const turnoda = new Date("2026-10-06T07:00:00");
  const tarde = new Date("2026-10-06T15:30:00");
  const noite = new Date("2026-10-06T23:00:00");
  const amanha = new Date("2026-10-07T07:00:00");
  const primeiro = catalogo[0];
  const outro = catalogo[1];

  let historico = historicoVazio();
  historico = registrarEscolha(historico, primeiro.id, turnoda, "João Silva");
  verificar("1ª escolha fixa o DDS do dia", escolhaDoDia(historico, turnoda)?.id === primeiro.id);
  verificar("a escolha grava a leitura", Boolean(historico.leituras[primeiro.id]));
  verificar("nome do leitor fica gravado (opcional)", historico.leitores[primeiro.id] === "João Silva", `→ ${historico.leitores[primeiro.id]}`);
  verificar("escolhidoHoje confirma no mesmo dia", escolhidoHoje(historico, primeiro.id, tarde));

  historico = registrarEscolha(historico, outro.id, tarde, "  Ana Souza  ");
  verificar(
    "2ª escolha do dia NÃO troca o DDS fixado",
    escolhaDoDia(historico, tarde)?.id === primeiro.id,
  );
  verificar("2ª escolha vira registro extra na mesma data", Boolean(historico.leituras[outro.id]));
  verificar("nome é aparado (trim)", historico.leitores[outro.id] === "Ana Souza", `→ ${historico.leitores[outro.id]}`);
  verificar("turno da noite segue no mesmo ciclo", escolhaDoDia(historico, noite)?.id === primeiro.id);

  historico = registrarEscolha(historico, catalogo[2].id, noite);
  verificar("3 registros no mesmo dia", registradoHoje(historico, noite) === 3, `→ ${registradoHoje(historico, noite)}`);
  verificar("escolher sem nome não cria leitor em branco", historico.leitores[catalogo[2].id] === undefined);

  historico = registrarEscolha(historico, outro.id, new Date("2026-10-06T23:30:00"));
  verificar("escolher sem nome apaga o leitor anterior", historico.leitores[outro.id] === undefined, `→ ${historico.leitores[outro.id]}`);

  verificar("novo dia começa ciclo novo (sem DDS fixado)", escolhaDoDia(historico, amanha) === null);
  verificar("escolha antiga não vale como 'hoje'", escolhidoHoje(historico, primeiro.id, amanha) === false);
}

console.log("9) Título único: H1 inicial removido da exibição");
{
  const comTitulo = "# DDS: O impacto da privação do sono\n\nTexto do DDS começa aqui.";
  const semTitulo = semTituloInicial(comTitulo);
  verificar(
    "remove o H1 inicial e a linha em branco seguinte",
    !semTitulo.startsWith("#") && semTitulo.startsWith("Texto do DDS"),
    `→ ${JSON.stringify(semTitulo.slice(0, 40))}`,
  );

  const semH1 = "Parágrafo de abertura.\n\n## Subseção mantida";
  verificar("texto sem H1 inicial passa inalterado", semTituloInicial(semH1) === semH1);

  const comH1NoMeio = "Intro.\n\n# Título interno\n\nCorpo.";
  verificar(
    "não remove H1 que não está no início",
    semTituloInicial(comH1NoMeio) === comH1NoMeio,
  );

  const arquivos = fs.readdirSync(path.join(RAIZ, "public", "conteudo")).filter((nome) => nome.endsWith(".md"));
  const real = fs.readFileSync(path.join(RAIZ, "public", "conteudo", arquivos[0]), "utf8");
  const tratado = semTituloInicial(real);
  const linhasReais = real.split(/\r?\n/);
  verificar(
    "arquivo real do catálogo perde só título e linha em branco",
    !tratado.startsWith("#") &&
      real.split("\n").length - tratado.split("\n").length === 2 &&
      tratado.startsWith(linhasReais[2]),
    `→ ${arquivos[0]}`,
  );
}

console.log(falhas ? `\n✘ ${falhas} verificação(ões) falharam` : "\n✔ todos os testes passaram");
process.exit(falhas ? 1 : 0);