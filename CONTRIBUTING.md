# Guia de Contribuição e Padrões de Código

## 1. Requisitos de Ambiente
- **Node.js**: `>= 24.0.0` (recomendado utilizar o Dev Container incluso em `.devcontainer/` ou `nvm use` com `.nvmrc`).
- **Gerenciador de Pacotes**: `npm >= 10.0.0`.

## 2. Convenções de Código
- **Componentes Vue 3**: Utilize sempre `<script setup lang="ts">` com tipagem explícita em `defineProps` e `defineEmits`.
- **Lógica de Domínio**: Novas transformações de dados, filtros ou cálculos devem ser implementados como funções puras em `src/utils/portfolioLogic.ts` e acompanhados de testes unitários em `src/utils/portfolioLogic.test.ts`.
- **Internacionalização e Dual-Mode**: Toda string visível na interface deve ser registrada em `src/data/i18n.ts` nos idiomas `pt-br` e `en`, incluindo o mapeamento correspondente em `traditionalI18nOverrides` quando houver distinção entre o modo Tech HUD (`core`) e o modo Recrutador Tradicional (`void`).

## 3. Checklist antes de abrir um Pull Request
Execute o pipeline local completo:

```bash
npm run ci
```

Este comando executa em sequência:
1. `npm run lint` (`tsc --noEmit`)
2. `npm test` (suíte de testes unitários `node:test`)
3. `npm run build` (empacotamento de produção Vite)
