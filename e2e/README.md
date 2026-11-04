# Testes E2E (Playwright)

Fluxos críticos rodando no navegador contra a API de verdade: login e logout, criar transação e
vê-la no Início, importar extrato CSV do Inter, confirmar pendente em `/revisar`, pagar fatura e
criar orçamento. Cada spec roda em dois projetos: `desktop` (1280 px) e `mobile` (Pixel 7).

Os specs **não** fazem parte de `pnpm test` / `pnpm test:coverage` (Vitest exclui `e2e/**`) e
precisam do ambiente abaixo de pé.

## Ambiente

`e2e/docker-compose.yml` sobe três serviços (projeto `cash-control-e2e`, isolado do compose do umbrella):

| Serviço    | O que faz |
|------------|-----------|
| `postgres` | Postgres 18, banco `cashcontrol_e2e`, exposto em `127.0.0.1:5434` |
| `api`      | build de `../../cash-control-api`, `SPRING_PROFILES_ACTIVE=dev`, `APP_SCHEDULING_ENABLED=false`, sem Pluggy, sem Web Push, sem SMTP; em `127.0.0.1:8080` |
| `seed`     | espera a API ficar saudável (Flyway já rodou), aplica `fixtures/seed.sql` e sai |

O seed cria:

- usuário **`e2e@cashcontrol.test`**, senha **`E2e-Senha#2026`** (só deste ambiente descartável);
- a conta corrente `Conta E2E` e o cartão `Cartão E2E` (final 4242, fecha dia 1, vence dia 10);
- duas pendências do banco em `/revisar`, uma para cada projeto do Playwright
  (`Padaria Pendente Desktop` e `Padaria Pendente Mobile`).

`fixtures/extrato-inter.csv` é um extrato **sintético** de 20 linhas no formato do CSV do Inter.

## Rodando

Da raiz de `cash-control-react/`:

```bash
# 1) API + banco + seed (o primeiro build da API leva alguns minutos)
docker compose -f e2e/docker-compose.yml up -d --build --wait

# 2) specs (sobem o `pnpm dev` em :5173 sozinhos, se não houver um rodando)
pnpm e2e                              # todos os specs, desktop e mobile
pnpm e2e --project=desktop            # só um projeto
pnpm e2e e2e/review.spec.ts           # só um arquivo
pnpm exec playwright test --list      # lista sem rodar
pnpm exec playwright show-trace test-results/<pasta>/trace.zip   # trace de uma falha
```

O `webServer` do `playwright.config.ts` sobe o Vite com `VITE_API_BASE_URL=/api/v1`: as chamadas
passam pelo proxy de `/api` para `localhost:8080` e o cookie de refresh fica na mesma origem. Se já
houver um `pnpm dev` em :5173 ele é reaproveitado, então ele precisa ter sido aberto do mesmo jeito
(`VITE_API_BASE_URL=/api/v1 pnpm dev`) e não com um `.env.local` apontando para outra API.

Para apontar para outro front (ex.: `pnpm preview` ou o container `web`), use
`E2E_BASE_URL=http://localhost:4173 pnpm e2e`. Na primeira vez numa máquina nova, instale o
navegador com `pnpm exec playwright install chromium`.

## Rodando de novo

Os specs consomem o que o seed deixou (a pendência confirmada sai da fila, o extrato importado vira
transação, o orçamento da categoria passa a existir). Para uma nova rodada completa, recrie o banco:

```bash
docker compose -f e2e/docker-compose.yml down -v
docker compose -f e2e/docker-compose.yml up -d --wait
```

Portas ocupadas? `E2E_API_PORT` e `E2E_DB_PORT` trocam as portas publicadas (com outra porta da API,
o proxy do `pnpm dev` precisa apontar para ela).
