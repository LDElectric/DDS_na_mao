# Plano de Implementação - PWA "DDS na Mão"

## 1. Visão Geral e Arquitetura
O aplicativo "DDS na Mão" será um Progressive Web App (PWA) focado na entrega rápida, offline e inteligente de Diálogos Diários de Segurança. 

**Arquitetura:**
- **Frontend / UI:** Desenvolvido em React utilizando Vite para garantir máxima velocidade de build e um pacote final leve.
- **Armazenamento de Dados (Backend-less):** Os textos dos DDS e seus metadados ficarão armazenados estaticamente no próprio repositório do código (em formato JSON e Markdown). Isso evita custos com servidores de banco de dados e agiliza o carregamento.
- **Persistência de Estado (Histórico):** O registro dos DDS já lidos pelo usuário ficará armazenado localmente no dispositivo (usando `localStorage` ou `IndexedDB` através de bibliotecas como `zustand-persist` ou localforage).
- **Hospedagem:** GitHub Pages, Vercel ou Netlify (todos oferecem integração contínua e certificados SSL gratuitos, obrigatórios para PWAs).

---

## 2. Estrutura de Dados (O Catálogo)

Para que a lógica de negócio funcione, todos os DDS serão mapeados em um arquivo `catalogo.json`.

**Exemplo de Modelo de Dados:**
```json
[
  {
    "id": "dds-001",
    "titulo": "A importância da Hidratação no Verão",
    "tema": "saude",
    "campanha_sesmt": "janeiro",
    "arquivo_md": "/conteudo/dds-001.md",
    "data_criacao": "2026-10-01"
  },
  {
    "id": "dds-002",
    "titulo": "Uso correto do Cinto de Segurança tipo Paraquedista",
    "tema": "altura",
    "campanha_sesmt": null,
    "arquivo_md": "/conteudo/dds-002.md",
    "data_criacao": "2026-10-02"
  }
]
```

---

## 3. A Lógica de Negócio (O Algoritmo de Sugestão)

O motor de sugestão do aplicativo operará seguindo uma ordem estrita de prioridades:

### Prioridade 1: O Calendário SESMT (Primeiro DDS do mês)
1. O app verifica o mês atual do sistema.
2. Consulta o armazenamento local (histórico) para ver se alguma sugestão foi gerada neste mês.
3. Se for o primeiro acesso do mês (ou se não houver registros nos primeiros dias do mês), o algoritmo filtra o catálogo por DDS que possuam a tag `campanha_sesmt` correspondente ao mês atual (Ex: `janeiro` para o Janeiro Branco).
4. Sorteia e sugere um desses DDS.

### Prioridade 2: Regra dos 6 Meses (Antirrepeticão)
1. Antes de gerar qualquer sugestão aleatória (fora da Prioridade 1), o app lê o histórico local do usuário.
2. Identifica os IDs dos DDS que foram lidos nos últimos 180 dias.
3. Exclui temporariamente esses IDs da lista de possíveis sorteios.
*Exceção: Se o usuário usar a barra de "Pesquisa Manual", ele pode acessar e ler qualquer DDS, mesmo os repetidos recentemente.*

### Prioridade 3: Regra de Diversidade (Evitar monotonia)
1. Verifica qual foi o `tema` (Ex: `ergonomia`) do último DDS sugerido.
2. Da lista já filtrada na Prioridade 2, exclui temporariamente todos os DDS que possuam o mesmo tema.
3. Realiza o sorteio final (aleatório) com a lista resultante e apresenta ao usuário.

### Ciclo do dia (ler → escolher → imprimir)
Regra de uso real (turnos rotativos, mesmo dispositivo):

1. **Abrir o texto não conta como leitura.** O DDS pode ser aberto à vontade para conferir
   antes de decidir — nada é gravado no histórico.
2. **"Escolher este DDS"** é a confirmação e fica **dentro da tela de leitura**, na
   **barra superior** — ao lado de **"‹ Voltar"** e da **ferramenta de tamanho do texto
   (A−/A+)**, sempre à vista (sticky sob o cabeçalho). Na Home o cartão traz só o botão
   **"Ver texto"** e, logo abaixo, a instrução de que nada é registrado antes da confirmação.
   Ao confirmar, grava a leitura e, sendo a **primeira escolha da data**, fixa o **DDS do dia**
   (`escolhas["AAAA-MM-DD"] = { id, iso }`).
3. **O DDS fixado permanece até 23:59** — os demais turnos do mesmo dia acessam o mesmo DDS
   pela Home (selo "✓ DDS do dia").
4. **Outros turnos podem escolher outro tema**: cada escolha vira um novo registro na mesma
   data, mas **não troca** o DDS já fixado.
5. **Escolher encerra o ciclo**: depois da confirmação não há sugestão de "próximo conteúdo
   relacionado" — só confirmação, impressão e links de navegação. As sugestões continuam
   aleatórias seguindo as Prioridades 1–3 acima.
6. **Impressão com ata:** `/imprimir/:id` gera o documento (texto + lista de presença em
   **página seguinte**, ideal frente e verso) para imprimir ou salvar em PDF, assinar e
   arquivar — acessível pelos cartões da tela "DDS lidos". Ao escolher, um **diálogo pede o
   nome do leitor (opcional)**, usado para preencher o campo *Leitor* da ata; a lista tem
   **só a assinatura do leitor** (sem assinatura do responsável).
7. **Mensagens amigáveis:** todos os estados vazios e de erro orientam o próximo passo
   (ex.: busca sem resultado sugere temas e leva à biblioteca completa).
8. **Título único:** o H1 inicial dos arquivos (`# DDS: …`) é removido na leitura e na
   impressão, pois o título do catálogo já aparece logo acima do texto.
9. **Biblioteca como sumário:** as partes aparecem como o índice de um livro, **todas
   colapsadas** — toque numa parte para expandir (várias podem ficar abertas), cada linha
   mostra o total de DDS e quantos já foram lidos, e há ações **"Expandir todas as partes"** /
   **"Recolher tudo"**. Os filtros "Lidos/Não lidos" já abrem as partes; "Todos" volta ao
   sumário.
10. **Tela de leitura enxuta:** a página do texto é **dedicada ao texto** — a barra superior
    concentra **"‹ Voltar"**, a ferramenta de **tamanho da letra (A−/A+)** e **"✓ Escolher
    este DDS"** (sem "Sortear outro", que é função da Home, e sem botões repetidos no
    rodapé). Após a confirmação a barra mostra **"✓ Escolhido"** e o rodapé exibe a
    confirmação com impressão/ata. A Home **não repete "Sugestão do dia"**, não traz cards
    duplicados de Busca/Biblioteca e o painel de lidos deixa o usuário fora do detalhe da
    janela de 180 dias (só mostra "DDS lidos" clicável para ver os últimos). A biblioteca
    **não oferece mais "Apagar histórico"** — o histórico fica guardado. O texto explicativo
    **"Ciclo do dia"** abaixo dos cards de resumo foi **removido** (app mais objetivo).
11. **Campanhas legíveis, coloridas e alinhadas:** o par de chips "Campanha SESMT" +
    "Campanha: mês" virou **um card de campanha com o nome oficial** (ex.: **"Outubro
    Rosa"**) e o **texto da campanha**, exibido quando há campanha ativa para o **mês** ou
    para o **dia celebrado** (se não houver, o card não aparece). Cada mês tem **uma cor
    dinâmica** (`cor` em `CAMPANHAS_MES`) que tinge o card e o chip — outubro fica
    **rosado**. Os **dias celebrados** (ex.: 28/04, 10/09, 19/10, 27/11…) ganham
    prioridade na sugestão: nessa data o motor prefere um DDS cujo texto **alude ao dia da
    campanha**. Além disso, a sugestão do mês **prefere o DDS central da campanha** (`ids`
    em `CAMPANHAS_MES`, ex.: outubro → prevenção do câncer de mama), respeitando a janela
    de 6 meses — se o DDS central foi lido recentemente, cai para outro DDS do mês. Mapas
    `CAMPANHAS_MES` e `DIAS_CELEBRADOS` em `src/lib/algoritmo.js` — fáceis de ajustar.

---

## 4. Fases de Implementação (Passo a Passo)

> **Status (06/10/2026):** Fases 1 a 4 concluídas e verificadas — 228 DDS convertidos,
> testes automatizados do algoritmo (`npm test`) e smoke test em navegador real com
> modo offline (`npm run smoke`). Lighthouse: **PWA 100 · Acessibilidade 100 ·
> Boas Práticas 100 · SEO 100 · Desempenho 98**.
> GitHub Pages ativo: publicação automática em https://ldelectric.github.io/DDS_na_mao/
> a cada push em `main`. Ciclo do dia (escolher/fixar DDS) e impressão com ata implementados
> — ver seção 3.

### Fase 1: Setup do Projeto e Estrutura Básica
- [x] Inicializar o projeto com Vite (`npm create vite@latest dds-na-mao -- --template react`).
- [x] Instalar dependências de roteamento e estilização (ex: `react-router-dom`, `tailwindcss` ou css modular).
- [x] Criar a estrutura de pastas: `/src/components`, `/src/pages`, `/src/hooks`, `/public/conteudo`.
- [x] Criar o mock inicial do `catalogo.json` e 2 arquivos `.md` de exemplo.

### Fase 2: Motor Lógico e Gerenciamento de Estado
- [x] Implementar um Hook customizado ou estado global (ex: Zustand) para gerenciar o `historicoLeituras`.
- [x] Escrever as funções utilitárias do algoritmo:
  - `verificarCampanhaMes(historico)`
  - `filtrarLidosRecentes(catalogo, historico)`
  - `sortearNovoDDS(catalogoFiltrado, ultimoTema)`

### Fase 3: Desenvolvimento da Interface (UI)
- [x] Criar layout base focado em Mobile First (Design Limpo, Dark Mode).
- [x] Tela Home: Exibir a "Sugestão do Dia" em destaque e botão para sortear outro.
- [x] Tela de Leitura: Um renderizador de Markdown (usando bibliotecas como `react-markdown`) para exibir o texto do DDS selecionado.
- [x] Tela de Busca: Um campo de pesquisa que filtra os DDS por título e tema.
- [x] Tela de Histórico/Biblioteca: Lista de todos os DDS disponíveis e os já lidos.

### Fase 4: Configuração PWA
- [x] Instalar o plugin `vite-plugin-pwa`.
- [x] Configurar o manifesto web (`manifest.webmanifest`) definindo ícones, cores do tema e nome do app ("DDS na Mão").
- [x] Configurar a estratégia de Cache do Service Worker para cachear o `catalogo.json`, a casca do app e os arquivos Markdown (Permitindo acesso 100% offline).

### Fase 5: Testes e Deploy
- [x] Validar no navegador (Lighthouse) se atende aos critérios PWA. *(PWA 100 · Acessibilidade 100 · Boas Práticas 100 · SEO 100 · Desempenho 98)*
- [x] Realizar testes forçando datas diferentes no sistema para validar a lógica do Calendário SESMT e dos 6 meses. *(`npm test` — datas simuladas de out/nov 2026)*
- [x] Realizar o deploy inicial via GitHub Pages. *(automático a cada push em `main`)*

---

## 5. Próximos Passos Imediatos
Para iniciar o código agora, o primeiro passo prático é rodar o comando de criação do projeto frontend usando Vite na pasta do seu workspace.
