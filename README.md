# Card Rotina Codex

Projeto scaffold para continuacao no Codex.

## GitHub Codespaces

O repositorio esta pronto para abrir em GitHub Codespaces.

Fluxo recomendado:
1. Abra o repositorio no GitHub.
2. Clique em `Code`.
3. Abra a aba `Codespaces`.
4. Clique em `Create codespace on main`.

Quando o ambiente subir:
1. As dependencias serao instaladas automaticamente com `npm ci`.
2. Rode `npm run dev -- --host 0.0.0.0 --port 5173`.
3. Abra a porta 5173 no preview do proprio Codespaces.

## Testar uma versao candidata

Este repositorio usa sempre a mesma branch temporaria de teste:
- `codex/teste`

Para testar uma alteracao no mesmo Codespace:
1. Rode `git fetch origin`
2. Rode `git checkout codex/teste`
3. Rode `git pull`
4. Rode `npm run dev -- --host 0.0.0.0 --port 5173`

Promocao para baseline:
- so atualize `main` depois de aprovacao explicita do usuario

Se a alteracao for reprovada:
1. Rode `git fetch origin`
2. Rode `git checkout main`
3. Rode `git pull`
4. Rode `npm run dev -- --host 0.0.0.0 --port 5173`

Observacao:
- GitHub Mobile e otimo para revisar e acompanhar.
- Para editar com conforto no celular ou navegador, o melhor caminho e o Codespaces.
