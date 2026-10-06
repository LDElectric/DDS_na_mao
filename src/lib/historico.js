import { chaveDia } from "./algoritmo.js";

/** Quantidade de DDS lidos dentro da janela (padrão: 6 meses). */
export const contarLidos = (historico, dias = 180, agora = Date.now()) => {
  const limite = agora - dias * 86400000;
  return Object.values(historico.leituras).filter(
    (data) => new Date(data).getTime() >= limite,
  ).length;
};

/** Dia (AAAA-MM-DD) em que uma leitura foi registrada. */
const diaDaLeitura = (iso) => {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : chaveDia(data);
};

/**
 * Escolha do dia: a primeira leitura confirmada na data.
 * É ela que fica fixada para todos os turnos daquele dia.
 */
export const escolhaDoDia = (historico, agora = new Date()) =>
  historico.escolhas?.[chaveDia(agora)] ?? null;

/** Este DDS foi registrado (escolhido) na data de hoje? */
export const escolhidoHoje = (historico, id, agora = new Date()) =>
  diaDaLeitura(historico.leituras?.[id]) === chaveDia(agora);

/** Quantos DDS foram registrados na data de hoje. */
export const registradoHoje = (historico, agora = new Date()) =>
  Object.values(historico.leituras ?? {}).filter((iso) => diaDaLeitura(iso) === chaveDia(agora))
    .length;

/**
 * Registra a escolha de um DDS: grava a leitura e, se for a primeira do dia,
 * fixa o "DDS do dia" (mantido até 23:59 para os demais turnos).
 * Abrir o texto sem confirmar NÃO altera o histórico.
 */
export const registrarEscolha = (historico, id, agora = new Date()) => {
  const iso = agora.toISOString();
  const chave = chaveDia(agora);
  const escolhas = { ...(historico.escolhas ?? {}) };
  if (!escolhas[chave]) escolhas[chave] = { id, iso };
  return {
    ...historico,
    versao: 2,
    leituras: { ...historico.leituras, [id]: iso },
    escolhas,
  };
};

/** Lista de leituras (mais recente primeiro), opcionalmente só da janela em dias. */
export const listarLeituras = (historico, itens, dias = null, agora = Date.now()) => {
  const porId = new Map(itens.map((item) => [item.id, item]));
  const limite = dias == null ? 0 : agora - dias * 86400000;
  return Object.entries(historico.leituras)
    .filter(([, iso]) => new Date(iso).getTime() >= limite)
    .map(([id, iso]) => {
      const item = porId.get(id) ?? null;
      const dia = diaDaLeitura(iso);
      return {
        id,
        iso,
        item,
        doDia: historico.escolhas?.[dia]?.id === id,
        titulo: item?.titulo ?? "DDS indisponível no catálogo",
      };
    })
    .sort((a, b) => new Date(b.iso) - new Date(a.iso));
};

export const formatarDataLeitura = (iso) => {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "data desconhecida";
  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
};
