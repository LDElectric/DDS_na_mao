import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { chaveDia, chaveMes } from "../lib/algoritmo.js";
import { registrarEscolha } from "../lib/historico.js";

/**
 * Histórico de escolhas e sugestões persistido no dispositivo
 * (localStorage, conforme o plano: backend-less).
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
  sugestoes: {}, // "AAAA-MM-DD" -> id sugerido
  campanhaDoMes: {}, // "AAAA-MM" -> id da campanha já sorteada no mês
  ultimoTema: null,
});

const ler = () => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    return { ...vazio(), ...JSON.parse(bruto) };
  } catch {
    return vazio();
  }
};

const gravar = (historico) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(historico));
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
    (id) => atualizar((atual) => registrarEscolha(atual, id)),
    [atualizar],
  );

  const registrarSugestao = useCallback(
    ({ dds, origem }) =>
      atualizar((atual) => {
        const agora = new Date();
        const proximo = {
          ...atual,
          sugestoes: { ...atual.sugestoes, [chaveDia(agora)]: dds.id },
          ultimoTema: dds.tema,
        };
        if (origem === "campanha") {
          proximo.campanhaDoMes = { ...atual.campanhaDoMes, [chaveMes(agora)]: dds.id };
        }
        return proximo;
      }),
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
  registradoHoje,
} from "../lib/historico.js";
