/**
 * Testes do motor de sugestão com datas forçadas (Fase 5 do plano).
 * Uso: node scripts/testar-algoritmo.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DIAS_JANELA_LEITURA,
  chaveDia,
  chaveMes,
  filtrarLidosRecentes,
  mesAtual,
  sortearNovoDDS,
  sortearOutro,
  sugerirDoDia,
  verificarCampanhaMes,
} from "../src/lib/algoritmo.js";
import { listarLeituras, registrarEscolha, escolhaDoDia, escolhidoHoje, registradoHoje } from "../src/lib/historico.js";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalogo = JSON.parse(
  fs.readFileSync(path.join(RAIZ, "public", "conteudo", "catalogo.json"), "utf8"),
);

const historicoVazio = () => ({
  versao: 2,
  leituras: {},
  escolhas: {},
  sugestoes: {},
  campanhaDoMes: {},
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

console.log("1) Calendário SESMT (Prioridade 1)");
{
  const agora = new Date("2026-11-05T09:00:00");
  verificar("mês atual é novembro", mesAtual(agora) === "novembro", `→ ${mesAtual(agora)}`);

  const historico = historicoVazio();
  const campanha = verificarCampanhaMes(catalogo, historico, agora);
  verificar("há sugestão de campanha no primeiro acesso", Boolean(campanha?.dds));
  verificar("o DDS sorteado é de novembro", campanha?.dds.campanha_sesmt === "novembro");

  const historicoComCampanha = {
    ...historico,
    campanhaDoMes: { [chaveMes(agora)]: campanha.dds.id },
  };
  verificar(
    "não repete campanha dentro do mesmo mês",
    verificarCampanhaMes(catalogo, historicoComCampanha, agora) === null,
  );

  const historicoDoDia = {
    ...historico,
    sugestoes: { [chaveDia(agora)]: campanha.dds.id },
  };
  const repetida = sugerirDoDia(catalogo, historicoDoDia, agora);
  verificar("sugestão do dia é estável (mesmo id)", repetida?.dds.id === campanha.dds.id);
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
    recentes.length === 20 && recentes.every((i) => new Date(historico.leituras[i.id]).getTime() < agora.getTime() - 180 * 86400000),
    `→ ${recentes.length} itens`,
  );
  verificar("mantém DDS lidos há mais de 180 dias", recentes.some((i) => i.id === amostra[1].id));

  const sorteio = sortearOutro(amostra, historico, { agora });
  verificar("o sorteio sai da lista filtrada", recentes.some((i) => i.id === sorteio?.dds.id));
  verificar("o sorteio nunca repete leitura recente", !historico.leituras[sorteio?.dds.id] || new Date(historico.leituras[sorteio.dds.id]).getTime() < agora.getTime() - 180 * 86400000);
}

console.log("3) Regra de diversidade (Prioridade 3)");
{
  const ultimoTema = "ergonomia";
  const comTema = catalogo.filter((i) => i.tema === "ergonomia");
  const resultado = sortearNovoDDS(comTema, ultimoTema);
  verificar("esvazia a lista quando só há o mesmo tema", resultado !== null);

  const misto = catalogo.filter((i) => ["ergonomia", "cultura", "incendio"].includes(i.tema));
  const escolhas = Array.from({ length: 60 }, () => sortearNovoDDS(misto, ultimoTema));
  verificar("nunca sorteia o mesmo tema em 60 tentativas", escolhas.every((i) => i && i.tema !== ultimoTema));
  verificar("a diversidade de resultados é real", new Set(escolhas.map((i) => i.id)).size > 1);
}

console.log("4) Integração: sugerirDoDia usa a ordem estrita de prioridades");
{
  const agora = new Date("2026-10-10T08:00:00");
  const historico = historicoVazio();
  catalogo.slice(0, 60).forEach((item, indice) => {
    historico.leituras[item.id] = diasAtras(10 + indice);
  });

  const primeira = sugerirDoDia(catalogo, historico, agora);
  verificar("primeiro acesso do mês sorteia a campanha", primeira?.origem === "campanha");
  verificar("campanha de outubro", primeira?.dds.campanha_sesmt === "outubro");

  const segundoMes = {
    ...historico,
    campanhaDoMes: { [chaveMes(agora)]: primeira.dds.id },
  };
  const segunda = sugerirDoDia(catalogo, segundoMes, agora);
  verificar("sem campanha pendente, aplica antirrepeticão", segunda?.origem === "antirepeticao");
  verificar("não sugere algo lido há 10 dias", !segundoMes.leituras[segunda.dds.id]);

  const terceira = sugerirDoDia(catalogo, { ...segundoMes, ultimoTema: segunda.dds.tema }, agora);
  verificar("evita repetir o tema do último sugerido", terceira.dds.tema !== segunda.dds.tema);
}

console.log("5) Busca e catálogo");
{
  verificar("catálogo com 228 itens", catalogo.length === 228, `→ ${catalogo.length}`);
  verificar("ids únicos", new Set(catalogo.map((i) => i.id)).size === catalogo.length);
  verificar("todos têm H1/título", catalogo.every((i) => i.titulo?.length > 0));
  verificar("60 DDS de campanha SESMT", catalogo.filter((i) => i.campanha_sesmt).length === 60);
  verificar(
    "todos os arquivos .md existem",
    catalogo.every((i) => fs.existsSync(path.join(RAIZ, "public", i.arquivo_md))),
  );
}

console.log("6) Lista de DDS lidos");
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

console.log("7) Ciclo do dia: abrir não é lido; escolher fixa o DDS");
{
  const turnoda = new Date("2026-10-06T07:00:00");
  const tarde = new Date("2026-10-06T15:30:00");
  const noite = new Date("2026-10-06T23:00:00");
  const amanha = new Date("2026-10-07T07:00:00");
  const primeiro = catalogo[0];
  const outro = catalogo[1];

  let historico = historicoVazio();
  historico = registrarEscolha(historico, primeiro.id, turnoda);
  verificar("1ª escolha fixa o DDS do dia", escolhaDoDia(historico, turnoda)?.id === primeiro.id);
  verificar("a escolha grava a leitura", Boolean(historico.leituras[primeiro.id]));
  verificar("escolhidoHoje confirma no mesmo dia", escolhidoHoje(historico, primeiro.id, tarde));

  historico = registrarEscolha(historico, outro.id, tarde);
  verificar(
    "2ª escolha do dia NÃO troca o DDS fixado",
    escolhaDoDia(historico, tarde)?.id === primeiro.id,
  );
  verificar("2ª escolha vira registro extra na mesma data", Boolean(historico.leituras[outro.id]));
  verificar("turno da noite segue no mesmo ciclo", escolhaDoDia(historico, noite)?.id === primeiro.id);

  historico = registrarEscolha(historico, catalogo[2].id, noite);
  verificar("3 registros no mesmo dia", registradoHoje(historico, noite) === 3, `→ ${registradoHoje(historico, noite)}`);

  verificar("novo dia começa ciclo novo (sem DDS fixado)", escolhaDoDia(historico, amanha) === null);
  verificar("escolha antiga não vale como 'hoje'", escolhidoHoje(historico, primeiro.id, amanha) === false);
}

console.log(falhas ? `\n✘ ${falhas} verificação(ões) falharam` : "\n✔ todos os testes passaram");
process.exit(falhas ? 1 : 0);
