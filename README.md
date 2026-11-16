# Janyel Barbosa Lima — Senior Fullstack Portfolio (Vue 3 + TypeScript)

[![Node.js 24](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](./.devcontainer/devcontainer.json)
[![Vue 3.5](https://img.shields.io/badge/Vue-3.5_(Composition_API)-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](./tsconfig.json)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](./src/index.css)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-CI%2FCD_%26_Pages-2088FF?logo=github-actions&logoColor=white)](./.github/workflows/deploy.yml)

Portfólio profissional e currículo interativo de **Janyel Barbosa Lima** (Desenvolvedor Fullstack Sênior), migrado de uma implementação artesanal em HTML/CSS/JS Vanilla para uma arquitetura moderna em **Vue 3 (`<script setup lang="ts">`) + TypeScript + Vite + Tailwind CSS v4**, mantendo paridade visual e evoluindo para um sistema **Dual-Realm (Dois Reinos)** voltado a dois perfis de recrutadores.

---

## Sumário Executivo da Arquitetura

### 1. Sistema Dual-Realm (`useTheme.ts` + `useI18n.ts`)
A aplicação opera com dois modos visuais, funcionais e semânticos distintos acionados pelo botão **Troca de Reino (`Realm Shift`)**:

| Característica | Reino Turquesa (`theme-core` · Padrão) | Reino Roxo (`theme-void` · Elden Ring) |
| :--- | :--- | :--- |
| **Público-Alvo** | Recrutadores Tech modernos, Tech Leads e Engenheiros | Recrutadores tradicionais, RH Executivo e Gestores |
| **Direção de Arte** | Cyberpunk Tech HUD (`#00ffff` / `#00222b`), recortes poligonais, scanlines | Interface inspirada em *Elden Ring* em Ametista & Ouro Rúnico (`#b366ff` / `#c9a84c`), molduras duplas e placas clássicas |
| **Tipografia** | `EuroStile` / `Orbitron` / `Rajdhani` | `Cinzel` (títulos clássicos) + `Rajdhani` (corpo legível) |
| **Linguagem & Copy** | Telemetria de sistema (`■ Perfil_Dev`, `■ Registros_de_Projeto`, `// OPERACIONAL_EM::`) | Linguagem executiva direta (`Ficha do Profissional`, `Portfólio de Projetos Realizados`, `Histórico e Experiência Profissional`) |
| **UX de Leitura** | Painéis compactos sob demanda (`[ OFF ]` / `[ ON ]`) e desafio de descriptografia | Auto-expansão imediata de Habilidades, Stacks, Experiências, Certificados e Contatos |
| **Particles.js** | **Adição no clique** (`onclick: 'push'`) e conexão por proximidade (`onhover: 'grab'`) | **Repulsão magnética** (`onhover: 'repulse'`, `onclick: 'repulse'`) com partículas púrpuras e douradas |
| **Web Audio SFX** | Sintetizador Sci-Fi / Telemetria digital | Acordes harmônicos e sinos ressonantes (`playEldenChime`) |

### 2. Visualização Interativa de Competências (`SkillChartPanel.vue` + `SkillsSubsystem.vue`)
- **Gráficos Reativos (Chart.js 4)**: Suporte a alternância em tempo real entre **Barras (`▬ BAR`)**, **Radar (`◈ RADAR`)** e **Área Polar (`◎ POLAR`)**, além de exportação instantânea em **PNG** (com fundo adaptado ao tema ativo) e **CSV** localizado.
- **Paleta Dinâmica por Reino (`getChartThemePalette`)**: Os gráficos re-renderizam automaticamente ao alternar entre o modo Turquesa e o modo Roxo/Ouro Rúnico, ou ao trocar o idioma (`PT-BR` / `EN`).
- **Interação Bidirecional (Skills ↔ Charts)**: Clicar em qualquer habilidade na lista destaca a barra/vértice correspondente no gráfico e exibe o badge detalhado de proficiência (`Rank S/A/B/C/D`); clicar diretamente em uma barra ou ponto no canvas do gráfico seleciona a habilidade correspondente na grade.

### 3. Currículos Oficiais por Idioma (`getResumeAsset`)
- Download dinâmico e visualização integrada via modal PDF (`pdf.js`):
  - **Português (`pt-br`)**: `/cv/cv-br.pdf` → `Curriculo-Janyel-Barbosa-Lima-PT-BR.pdf`
  - **Inglês (`en`)**: `/cv/cv-en.pdf` → `Resume-Janyel-Barbosa-Lima-EN.pdf`

---

## Estrutura de Pastas

```text
├── .devcontainer/
│   ├── devcontainer.json          # Configuração VS Code Dev Container (Node 24)
│   └── Dockerfile                 # Imagem base node:24-bookworm
├── .github/workflows/
│   ├── ci.yml                     # Pipeline de Integração Contínua (Typecheck + Testes + Build)
│   └── deploy.yml                 # Deploy automatizado para GitHub Pages (Node 24)
├── docs/
│   └── ARCHITECTURE.md            # Documentação técnica detalhada da arquitetura
├── public/
│   ├── certs/                     # Certificados acadêmicos e técnicos em PDF
│   ├── cv/                        # Currículos oficiais (cv-br.pdf e cv-en.pdf)
│   └── img/                       # Logos de projetos, avatar e assets visuais
├── src/
│   ├── components/
│   │   ├── aside/                 # ProfileAside, SkillsSubsystem, SkillChartPanel, SecretFragmentPanel, TetrisChallengeCard
│   │   ├── common/                # ExpandableTypedText (efeito typewriter expansível)
│   │   ├── layout/                # AppHeader (busca, mute, reino, idioma), AppFooter, ParticlesBackground
│   │   ├── modals/                # CertViewerModal (PDF.js), TetrisChallengeModal, DecryptOverlay
│   │   └── sections/              # ProjectStreamSection, ProjectCard, ExperienceTimeline, EducationArchive
│   ├── composables/               # useTheme, useI18n, useSfx, useSearch (estado reativo compartilhado)
│   ├── data/                      # portfolioData.ts (projetos, histórico, skills) e i18n.ts (PT-BR / EN + Dual Mode)
│   ├── types/                     # Contratos e interfaces TypeScript (portfolio.ts)
│   └── utils/                     # Lógica pura desacoplada (portfolioLogic.ts) + testes unitários (portfolioLogic.test.ts)
├── .node-version                  # Pin Node 24
├── .nvmrc                         # Pin Node 24
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Ambiente de Desenvolvimento (Node 24 & Dev Container)

### Opção 1: VS Code Dev Container (Recomendado)
O projeto inclui configuração completa em `.devcontainer/` com **Node.js 24 (`node:24-bookworm`)**, extensões pré-configuradas (`Vue.volar`, `Tailwind CSS`, `ESLint`, `Prettier`) e porta `3000` mapeada automaticamente:
1. Abra a pasta no VS Code com a extensão **Dev Containers** instalada.
2. Execute `Dev Containers: Reopen in Container`.
3. O comando `npm install` será executado automaticamente.

### Opção 2: Execução Local
Requer **Node.js >= 24.0.0**:

```bash
# Instalar dependências
npm ci

# Iniciar servidor de desenvolvimento (http://localhost:3000)
npm run dev

# Executar verificação estática de tipos (TypeScript)
npm run typecheck

# Executar suíte de testes unitários (node:test via tsx)
npm test

# Gerar build de produção em ./dist
npm run build
```

---

## CI/CD & Deploy no GitHub Pages

O repositório conta com dois workflows automatizados em `.github/workflows/`:
1. **`ci.yml`**: Executado em todo `push` e `pull_request` para `main`, `master` ou `develop`, validando `npm run typecheck`, `npm test` e `npm run build` em **Node.js 24**.
2. **`deploy.yml`**: Constrói o bundle estático com `VITE_BASE_PATH` dinâmico, gera `.nojekyll` e `404.html` para roteamento SPA e publica automaticamente no **GitHub Pages** via `actions/deploy-pages@v4`.

Para ativar o GitHub Pages no seu repositório:
1. Acesse **Settings → Pages** no GitHub.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.

---

## Autor

**Janyel Barbosa Lima** — Desenvolvedor Fullstack Sênior
- **E-mail**: [janyel.lima2809@outlook.com](mailto:janyel.lima2809@outlook.com)
- **LinkedIn**: [linkedin.com/in/janyel-lima](https://www.linkedin.com/in/janyel-lima)
- **GitHub**: [github.com/janyel-lima](https://github.com/janyel-lima)
