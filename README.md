# 🦺 DDS na Mão

Progressive Web App (PWA) com **Diálogos Diários de Segurança**: catálogo offline de 230 DDS,
com sugestão inteligente por prioridades, busca manual e histórico de leituras guardado
no próprio dispositivo (backend-less).

📱 **Mobile first · modo escuro · 100% offline · instalável**

---

## 🧠 Lógica de sugestão (ordem estrita de prioridades)

| # | Regra | Como funciona |
|---|-------|---------------|
| 1 | **Calendário SESMT** | A 1ª sugestão é sempre um DDS da campanha do mês em vigor (ex.: *Outubro Rosa*, *Novembro Azul*), sorteado aleatoriamente a cada **nova abertura** do app — nunca um texto fixo. Navegar entre telas mantém a mesma sugestão da sessão. |
| 2 | **Regra dos 6 meses** | Antes de qualquer sorteio aleatório, exclui da lista tudo que foi lido nos últimos **180 dias**. |
| 3 | **Regra de diversidade** | Exclui temporariamente os DDS do mesmo `tema` do último sugerido e só então sorteia. |

> A **pesquisa manual** nunca passa por esses filtros: você pode ler qualquer DDS, inclusive repetidos.
> Fechar e reabrir o app gera **um novo DDS da campanha do mês** na primeira sugestão.

Implementação: [`src/lib/algoritmo.js`](src/lib/algoritmo.js) — `sugerirCampanhaMes`,
`filtrarLidosRecentes`, `sortearNovoDDS`, `sugerirDoDia`, `sortearOutro`.

---

## 📂 Estrutura

```
├── Parte I … VII/           ← fontes .txt dos DDS (verdade do conteúdo)
├── scripts/
│   ├── gerar-conteudo.mjs   ← .txt → public/conteudo/*.md + catalogo.json
│   ├── gerar-icones.mjs     ← gera os ícones PNG (sem dependências externas)
│   ├── testar-algoritmo.mjs ← testes do motor de sugestão com datas forçadas
│   └── smoke-app.mjs        ← teste em navegador real (UI + offline)
├── src/
│   ├── components/          ← Cabeçalho, Rodapé (nav), ItemDDS
│   ├── hooks/               ← useCatalogo (JSON) e useHistorico (localStorage)
│   ├── lib/                 ← algoritmo.js e catalogo.js
│   ├── pages/               ← Home, Leitura, Busca, Biblioteca
│   ├── App.jsx  main.jsx  styles.css
├── public/conteudo/         ← 230 .md + catalogo.json (gerados)
├── index.html  vite.config.js  package.json
└── plano_implementacao_pwa.md
```

### Estrutura do catálogo (`public/conteudo/catalogo.json`)

```json
{
  "id": "percepcao-de-riscos",
  "titulo": "Percepção de Riscos",
  "subtitulo": null,
  "tema": "cultura",
  "campanha_sesmt": null,
  "arquivo_md": "conteudo/percepcao-de-riscos.md",
  "data_criacao": "2026-10-07",
  "parte": 1,
  "capitulo": 1,
  "capitulo_nome": "Cultura Comportamento e Reflexao"
}
```

Os campos `tema`, `parte`, `capitulo` e `campanha_sesmt` são derivados automaticamente da
pasta de origem de cada `.txt` — para incluir um novo DDS basta criar o `.txt` com H1 no
padrão `# DDS: Título - Subtítulo` e rodar `npm run conteudo`.

---

## 🛠️ Desenvolvimento

```bash
npm install
npm run dev          # servidor local (gera o catálogo antes)
npm run build        # build de produção em /dist
npm run preview      # serve o build em http://localhost:4173
```

### Testes

```bash
npm test             # motor de sugestão (datas forçadas: nov/2026, out/2026…)
npm run smoke        # navegador real: UI + Service Worker + offline (requer preview :4173)
```

### Qualidade (Lighthouse)

| Métrica | Nota |
|---------|------|
| PWA (instalável, splash, maskable) | **100** |
| Acessibilidade | **100** |
| Boas práticas | **100** |
| SEO | **100** |
| Desempenho | **98** (FCP 1,6 s · TBT 100 ms · CLS 0,01) |

---

## 📦 Stack

- **React 19 + Vite 7** — build rápido e bundle leve
- **react-router-dom** (HashRouter — compatível com GitHub Pages)
- **react-markdown** — renderização do texto do DDS
- **vite-plugin-pwa / Workbox** — manifest + Service Worker
  - `precache`: casca do app (HTML, JS, CSS, ícones)
  - `NetworkFirst` para `conteudo/catalogo.json` (lista sempre atual: reflete renames/remoções; cache só cobre offline)
  - `CacheFirst` para os textos `.md` de `/conteudo/` (leitura offline total); o app poda do cache os `.md` que deixaram de pertencer ao catálogo
- **localStorage** — histórico de leituras e escolhas confirmadas (a sugestão do dia é recalculada a cada abertura do app e vive na memória da sessão)

---

## 🚀 Publicação (GitHub Pages)

O build usa `base: "/DDS_na_mao/"` quando a variável `GITHUB_PAGES=1` está definida.

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. **Actions → “Deploy PWA no GitHub Pages → Run workflow”**
   (ou descomente o gatilho `push` em `.github/workflows/deploy.yml` para publicar a cada commit)

O workflow roda `npm ci` + `npm run build` e publica a pasta `/dist`.

---

## ✅ Checklist do plano

| Fase | Situação |
|------|----------|
| 1. Setup e estrutura | ✅ |
| 2. Motor lógico e estado | ✅ |
| 3. Interface (Home, Leitura, Busca, Biblioteca) | ✅ |
| 4. Configuração PWA (manifest + cache offline) | ✅ |
| 5. Testes e deploy | 🔄 Lighthouse validado (PWA 100) · deploy via Actions pendente de ativação |
