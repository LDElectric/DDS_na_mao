import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalInstalar({ aberto, onFechar }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclado = (evento) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclado);
    return () => window.removeEventListener("keydown", aoTeclado);
  }, [aberto, onFechar]);

  return createPortal(
    <div
      className={`modal-overlay${aberto ? " modal-overlay--aberto" : ""}`}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-instalar-titulo">
        <h3 id="modal-instalar-titulo">📲 Como instalar o app</h3>
        <div className="modal__passo">
          <span className="modal__num">1</span>
          <p>Abra o site pelo celular ou computador usando o navegador (Chrome, Edge ou Safari).</p>
        </div>
        <div className="modal__passo">
          <span className="modal__num">2</span>
          <p>
            <b>Android / Chrome:</b> toque no botão <b>“📲 Instalar”</b> no topo ou, no menu <b>⋮</b>,
            escolha <i>“Adicionar à tela inicial”</i>.
          </p>
        </div>
        <div className="modal__passo">
          <span className="modal__num">3</span>
          <p>
            <b>iPhone / iPad (Safari):</b> toque no botão <b>Compartilhar</b> (quadrado com seta) e
            escolha <i>“Adicionar à Tela de Início”</i>.
          </p>
        </div>
        <div className="modal__passo">
          <span className="modal__num">4</span>
          <p>
            Pronto! O app abre em <b>tela cheia</b>, com ícone próprio, e funciona até <b>offline</b>.
          </p>
        </div>
        <p className="modal__creditos">
          Desenvolvido e mantido por <b>Leonam Dias</b>.<br />
          Sugestões ou dúvidas? Entre em contato pelo LinkedIn{" "}
          <a
            href="https://www.linkedin.com/in/leonamdias1"
            target="_blank"
            rel="noopener noreferrer"
            className="modal__creditos-link"
          >
            🔗 linkedin.com/in/leonamdias1/
          </a>
        </p>
        <button type="button" className="modal__fechar" onClick={onFechar}>
          Entendi
        </button>
      </div>
    </div>,
    document.body,
  );
}
