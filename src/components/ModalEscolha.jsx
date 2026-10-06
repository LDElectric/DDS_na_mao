import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Diálogo exibido ao tocar em "Escolher este DDS": pede (opcionalmente) o nome
 * de quem está lendo — usado para preencher a ata de presença na impressão.
 */
export default function ModalEscolha({ aberto, onConfirmar, onFechar }) {
  const [nome, setNome] = useState("");
  const campo = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    setNome("");
    const aoTeclado = (evento) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclado);
    const foco = window.setTimeout(() => campo.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", aoTeclado);
      window.clearTimeout(foco);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return createPortal(
    <div
      className="modal-overlay modal-overlay--aberto"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-escolha-titulo">
        <h3 id="modal-escolha-titulo">✓ Escolher este DDS</h3>
        <p className="modal__texto">
          Confirma a leitura e fixa este DDS para <strong>todos os turnos de hoje</strong> (até às
          23:59). Você pode cancelar e continuar só lendo.
        </p>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            onConfirmar(nome.trim());
          }}
        >
          <label className="campo-form" htmlFor="nome-leitor">
            <span>
              Nome de quem está lendo <em>(opcional)</em>
            </span>
            <input
              id="nome-leitor"
              ref={campo}
              type="text"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="Ex.: João da Silva"
              autoComplete="name"
              maxLength={60}
            />
          </label>

          <div className="modal__acoes">
            <button type="button" className="botao" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="botao botao--primario botao--confirmar-escolha">
              Confirmar escolha
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
