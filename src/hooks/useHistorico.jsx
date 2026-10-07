import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { chaveDia } from "../lib/algoritmo.js";
import { registrarEscolha } from "../lib/historico.js";

/**
 * Histórico de escolhas e sugestões do app (backend-less).
 *
 * Definitivo (localStorage): leituras, escolhas (DDS do dia) e leitores.
 * Da sessão (só memória do provider): a sugestão sorteada hoje. Ela NÃO é
 * persistida de propósito — cada nova abertura do app sorteia um novo DDS da
 * campanha do mês, e navegar entre telas mantém a mesma sugestão da sessão.
 *
 * Regra importante: abrir o texto de um DDS NÃO conta como leitura.
 * Só a confirmação ("Escolher este DDS") grava o registro — e a primeira
 * escolha do dia vira o "DDS do dia", fixo para todos os turnos da data.
 */
const CHAVE = "dds-na-mao:historico:v1";
const Contexto = createContext(null);

const vazio = () => ({
  versao: 2,
  leituras: {}, // id -> ISO da última escolha confirmada
  escolhas: {}, // "AAAA-MM-DD" -> { id, iso } = DDS fixado do dia (1ª escolha)
  leitores: {}, // id -> nome de quem confirmou a última escolha (opcional)
  sugestoes: {}, // "AAAA-MM-DD" -> id sugerido (apenas desta sessão)
  ultimoTema: null,
});

const ler = () => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    return {
      ...vazio(),
      ...JSON.parse(bruto),
      sugestoes: {}, // não restaura a sugestão antiga: cada abertura sorteia de novo
    };
  } catch {
    return vazio();
  }
};

const gravar = (historico) => {
  try {
    const { sugestoes, ...persistente } = historico;
    localStorage.setItem(CHAVE, JSON.stringify(persistente));
  } catch {
    /* modo privado / cota cheia: segue apenas em memória */
  }
};

export function HistoricoProvider({ children }) {
  const [historico, setHistorico] = useState(ler);

  const atualizar = useCallback((mutacao) => {
    setHistorico((atual) => {
      const proximo = mutacao(atual);
      gravar(proximo);
      return proximo;
    });
  }, []);

  const escolherDDS = useCallback(
    (id, leitor = "") => atualizar((atual) => registrarEscolha(atual, id, new Date(), leitor)),
    [atualizar],
  );

  const registrarSugestao = useCallback(
    ({ dds }) =>
      atualizar((atual) => ({
        ...atual,
        sugestoes: { ...atual.sugestoes, [chaveDia(new Date())]: dds.id },
        ultimoTema: dds.tema,
      })),
    [atualizar],
  );

  const limparHistorico = useCallback(() => atualizar(() => vazio()), [atualizar]);

  const valor = useMemo(
    () => ({ historico, escolherDDS, registrarSugestao, limparHistorico }),
    [historico, escolherDDS, registrarSugestao, limparHistorico],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useHistorico = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useHistorico precisa estar dentro de <HistoricoProvider>");
  return contexto;
};

export {
  contarLidos,
  escolhaDoDia,
  escolhidoHoje,
  formatarDataLeitura,
  listarLeituras,
  nomeLeitor,
  registradoHoje,
} from "../lib/historico.js";