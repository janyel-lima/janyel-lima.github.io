# Arquitetura Técnica — Portfólio Janyel Barbosa Lima

Este documento descreve as decisões de engenharia, padrões de projeto e arquitetura de estado adotados na migração e evolução do portfólio para **Vue 3 + TypeScript + Vite + Tailwind CSS v4**.

---

## 1. Princípios de Engenharia

1. **Separação Estrita entre Domínio Puro e Camada de Apresentação**:
   - Toda regra de negócio determinística (cálculo de senioridade e progresso de carreira, filtragem normalizada de projetos sem acentos, janela circular de paginação, resolução de currículos por idioma, paleta de cores de gráficos por reino e quebra de rótulos de radar) reside em `src/utils/portfolioLogic.ts`.
   - Essas funções puras não dependem do DOM nem do runtime do Vue, permitindo execução instantânea de testes unitários com `node:test` (`src/utils/portfolioLogic.test.ts`).

2. **Estado Reativo Singleton via Composables (`src/composables/`)**:
   - Em vez de introduzir overhead desnecessário para estado global simples, os módulos `useTheme.ts`, `useI18n.ts`, `useSfx.ts` e `useSearch.ts` utilizam `ref` e `computed` em escopo de módulo (padrão Singleton Composable do Vue 3), garantindo sincronização imediata entre `AppHeader`, `ParticlesBackground`, `ProfileAside`, `SkillChartPanel` e as seções principais.

3. **Design Tokens Dinâmicos com Tailwind CSS v4 (`@theme inline`)**:
   - As variáveis semânticas `--theme-primary`, `--theme-secondary`, `--theme-accent` e `--theme-main` são registradas na diretiva `@theme inline` em `src/index.css`.
   - Isso permite que modificadores de opacidade nativos do Tailwind v4 (`border-primary/35`, `bg-primary/15`, `text-primary/70`) funcionem automaticamente tanto no Reino Turquesa (`.theme-core`) quanto no Reino Roxo Elden Ring (`.theme-void`).

---

## 2. Fluxo de Troca de Reino (`Dual-Realm Engine`)

Quando o usuário aciona o botão **Troca de Reino (`Realm Shift`)**:

1. `useTheme.ts` alterna `currentRealm` entre `'core'` (Turquesa) e `'void'` (Roxo Elden Ring), persistindo a escolha em `localStorage` e aplicando as classes `theme-core` ou `theme-void elden-realm` no `document.body`.
2. `useI18n.ts` recalcula todas as traduções via `translateKey(key, lang, currentRealm)`:
   - No modo `'core'`, retorna o dicionário Cyberpunk Tech HUD.
   - No modo `'void'`, aplica os overrides executivos de `traditionalI18nOverrides` voltados a recrutadores tradicionais.
3. `ParticlesBackground.vue` observa `currentRealm` e reinicializa o `particles.js`:
   - `'core'`: Partículas ciano (`#00ffff`) com adição por clique (`onclick: 'push'`) e conexão por hover (`onhover: 'grab'`).
   - `'void'`: Partículas em ametista e ouro rúnico (`#a855f7`, `#c084fc`, `#c9a84c`) com efeito de repulsão (`onhover: 'repulse'`, `onclick: 'repulse'`).
4. `SkillChartPanel.vue` observa `[lang, currentRealm, selectedSkillKey]` e reconstrói a instância do `Chart.js` com a paleta retornada por `getChartThemePalette(currentRealm)`.
5. `useSfx.ts` direciona os gatilhos sonoros para o sintetizador Web Audio correspondente ao reino ativo (telemetria digital em `'core'` vs. acordes harmônicos ressonantes em `'void'`), respeitando o estado global de Mute no header.

---

## 3. Pipeline de Qualidade e Deploy

- **Testes Unitários (`npm test`)**: Executados via `tsx --test src/utils/portfolioLogic.test.ts` usando o runner nativo `node:test` e `node:assert/strict`.
- **Verificação Estática (`npm run typecheck`)**: `tsc --noEmit` valida todos os tipos TypeScript.
- **GitHub Pages (`vite.config.ts` + `.github/workflows/deploy.yml`)**: O plugin `copy-unbundled-src-assets` copia assets estáticos, gera `404.html` e `.nojekyll` dentro de `dist/`, garantindo funcionamento completo em qualquer subcaminho do GitHub Pages.
