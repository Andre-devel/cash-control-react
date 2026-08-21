# Compartilhar comprovante PIX com o app (PWA Share Target + OCR)

> Plano original desta feature, movido para dentro do repo para sobreviver a troca de
> máquina — vivia em `~/.claude/plans/` local a uma sessão específica. Ver
> `docs/receipt-import/TODO.md` para o estado atual (o que já foi feito, o que falta).

## Contexto

Hoje, lançar um PIX no Cash Control é digitação manual: abrir o app, criar transação,
preencher valor, data e descrição. O comprovante fica no celular e nunca chega ao sistema.

O objetivo é que, logo depois de fazer um PIX, o botão **compartilhar** do app do banco
mostre "Cash Control" na lista, e que escolher essa opção abra o app já com valor, data e
destinatário preenchidos, para revisar e confirmar em um toque — com o comprovante
guardado como anexo da transação.

**Decisões travadas com o usuário:**

| Decisão | Escolha |
|---|---|
| Plataforma | **Android (Chrome)** — PWA com Web Share Target resolve inteiro |
| Leitura do comprovante | **OCR no servidor**, offline, sem dado saindo do VPS |
| Fluxo | **Sempre abrir para revisar** antes de gravar |

**Restrição de plataforma (documentada, não resolvida aqui):** Web Share Target não existe
no Safari/iOS. Um PWA nunca entra na folha de compartilhamento do iPhone. Se o iOS entrar
em escopo depois, o caminho é um Atalho (app Atalhos) fazendo POST na API — a tela de
upload manual desta feature já serve de fallback comum.

---

## O que já existe e vai ser reaproveitado

Esta feature é barata porque quase toda a infraestrutura já está no repo:

| Peça pronta | Onde | Uso aqui |
|---|---|---|
| Anexos ponta a ponta | `POST /transactions/{id}/attachments`, `AttachmentServiceImpl`, `StoragePort`/`LocalFileStorageAdapter`, tabela `attachments` (V11), limite 10 MB, tipos `pdf,png,jpg,jpeg` | Guardar o comprovante |
| PDFBox 3.0.7 | `service/fatura/InterFaturaPdfParser` | Comprovante em PDF já é legível hoje |
| Memória de apelido de estabelecimento | `MerchantAliasService` (`suggest`/`remember`), `MerchantKey`, tabela `merchant_aliases` (V27) | **O destinatário do PIX é o estabelecimento** — apelido e categoria aprendidos exatamente como no import |
| Sugestão de categoria | `CategorySuggester` (`RULE → HISTORY exato → HISTORY por token → NONE`), `SuggestionSource` | Categoria sugerida na revisão |
| Dedupe por `external_ref` | Coluna V21 + índice **UNIQUE** parcial `uidx_transactions_external_ref (user_id, account_id, external_ref)` | `endToEndId` do PIX cabe nos 64 chars → dedupe sem migration nova |
| Padrão preview → revisão → commit | `FaturaImportServiceImpl`, `StatementImportServiceImpl`, `import-fatura-dialog.tsx` | Comprovante é um import de uma linha só |
| Separação testável de parser | `extractText(InputStream)` vs `parseText(String)` em `InterFaturaPdfParser`; `FaturaPdfFixture` gera PDF sintético em tempo de teste | Mesma divisão para o comprovante |
| `FilePicker` com drag & drop | `src/components/ui/file-picker.tsx` | Caminho manual / desktop |
| `TransactionFormFields`, `CategoryPickerCombobox` | `src/features/transactions/components/`, `src/features/categories/components/` | Formulário da revisão |
| `invalidate-financial-queries.ts` | `src/lib/` | Obrigatório no commit |
| Manifest do M8 já especificado | `cash-control-react/docs/v1/responsive-mobile-phases.md` (Phase M8, tudo desmarcado) — `theme_color: #ff6b35`, `background_color: #0a0a0b`, ícones em `/icons/` | Usar esses valores, não inventar outros |

**Nenhuma migration Flyway é necessária.** (Próximo número livre seria V28, caso surja algo.)

---

## Pré-requisito: corrigir a perda de anexos em produção

Bug pré-existente que esta feature torna intolerável.

`LocalFileStorageAdapter` grava em `${java.io.tmpdir}/cash-control-attachments` por padrão
(`@Value("${app.storage.local-path:...}")`), e o serviço `api` no `docker-compose.yml`
**não tem volume montado**. Todo anexo já existente se perde a cada `docker compose up --build`
— e o `cd.yml` faz exatamente isso a cada deploy.

- `docker-compose.yml`: adicionar volume nomeado `attachments_data:/var/lib/cash-control/attachments`
  no serviço `api` e declará-lo em `volumes:`, ao lado de `postgres_data`.
- Passar `APP_STORAGE_LOCAL_PATH: /var/lib/cash-control/attachments` no `environment:` do `api`.
- `application.yml`: declarar `app.storage.local-path: ${APP_STORAGE_LOCAL_PATH:${java.io.tmpdir}/cash-control-attachments}`
  (hoje o default só existe no `@Value` do adapter).
- Registrar as duas variáveis nos `.env.example` (raiz e `cash-control-api/`).

**✅ Feito.**

---

## Fase 1 — PWA instalável + Share Target + revisão + PDF

Entrega o fluxo ponta a ponta. Comprovante em PDF já é lido; imagem entra como anexo com
os campos em branco até a Fase 2.

### 1.1 Backend — leitura do comprovante

Novo pacote `com.cashcontrol.api.service.receipt`, espelhando `service/fatura` e `service/statement`:

- **`ReceiptTextExtractor`** (interface, porta) — `boolean supports(String mimeType)` + `String extract(MultipartFile)`.
  - `PdfReceiptTextExtractor` — PDFBox `Loader.loadPDF` + `PDFTextStripper` com
    `setSortByPosition(true)`, igual ao `InterFaturaPdfParser`. Zero dependência nova.
  - `OcrReceiptTextExtractor` — Fase 2.
  - Resolvido por `List<ReceiptTextExtractor>` injetada, como `FaturaParser` já faz.
- **`PixReceiptParser`** — `ParsedReceipt parseText(String)`. Um parser heurístico único, **não**
  um por banco: ao contrário da fatura, o comprovante não tem formato declarado pelo usuário.
  Campos e âncoras:

  | Campo | Heurística |
  |---|---|
  | `amount` | `R\$\s*([\d.,]+)`, preferindo a ocorrência próxima de "Valor" |
  | `date` | `dd/MM/yyyy` próximo de "Data"/"Data do pagamento"/"efetuado em" |
  | `recipientName` | linha após "Para"/"Recebedor"/"Destinatário"/"Quem recebeu", ou a linha acima do CPF/CNPJ |
  | `recipientDocument` | CPF/CNPJ, inclusive mascarado (`***.123.456-**`) |
  | `endToEndId` | `E\d{8}\d{12}[A-Za-z0-9]{11}` (32 chars iniciando em `E`), ou após "ID da transação"/"Identificador" |
  | `institution`, `payerName`, `message` | melhor esforço |

  Campos não encontrados vêm `null` e entram em `unreadFields` — a tela mostra o que não leu.
- **`ReceiptImportService`** / `ReceiptImportServiceImpl`:
  - `preview(MultipartFile, userId)`:
    1. `validateFile` — vazio e teto `app.receipt-import.max-file-size-mb` (default 10, alinhado ao de anexo).
    2. extrai texto → `PixReceiptParser`.
    3. `externalRef` = `endToEndId`, ou SHA-256 de `data|valor|destinatário` quando ausente
       (mesma ideia de `FaturaRowHasher`).
    4. `merchantKey` = `MerchantKey.of(recipientName)`; `MerchantAliasService.suggest(...)` → `suggestedDescription`.
    5. `CategorySuggester` → `suggestedCategoryId/Name`, `suggestedSubcategoryId/Name`, `suggestionSource`.
    6. duplicata: busca `external_ref` do usuário → `duplicate` + `duplicateTransactionId`.
    - `@Transactional(readOnly = true)`, **nada é gravado**.
  - `commit(ReceiptCommitRequest, MultipartFile, userId)` — `@Transactional`:
    delega a `transactionService.createTransaction(...)` (campos já revisados pelo usuário),
    grava `externalRef`, chama `attachmentService.attach(...)` com o arquivo, e
    `merchantAliasService.remember(originalDescription, description)` — tudo na mesma transação,
    então uma transação nunca fica sem o comprovante.

    > Nota da implementação real: em vez de delegar a `transactionService.createTransaction`,
    > o `Transaction` é construído diretamente (como `StatementImportServiceImpl.toTransaction`
    > faz), porque `createTransaction` não aceita `externalRef`. Ver `ReceiptImportServiceImpl`.
  - **Controller** — em `TransactionController` (o `AttachmentService` e o `StatementImportService`
    já estão injetados lá):
    - `POST /api/v1/transactions/receipts/preview` — `@RequestPart("file") MultipartFile` → `ReceiptPreviewResponse`
    - `POST /api/v1/transactions/receipts` — `@RequestPart("data") @Valid ReceiptCommitRequest` +
      `@RequestPart("file") MultipartFile` → `TransactionDetailResponse`, HTTP 201
    - Ambos `@PreAuthorize("isAuthenticated()")`, usuário via `@AuthenticationPrincipal AuthenticatedUser principal`.

    O commit multipart com parte JSON evita mexer em `CreateTransactionRequest` e mantém o padrão
    preview/commit já estabelecido nas outras duas importações.
- **`AppProperties`**: novo bloco `app.receipt-import` (`max-file-size-mb`), declarado **também**
  no `application.yml` — ao contrário de `app.invoice-import`, que só existia no campo Java (foi
  adicionado ao `application.yml` também nesta implementação).

**Violação da UNIQUE no commit** (mesmo E2E, mesma conta) → mapeada para 409 (`ConflictException`)
com mensagem pt-BR ("Este comprovante já foi lançado"), checado antes do insert em vez de capturar
a exceção de constraint.

**✅ Feito.**

### 1.2 Frontend — PWA

- `pnpm add -D vite-plugin-pwa` com **`strategies: 'injectManifest'`** — o `generateSW` não
  permite o handler de `fetch` customizado que o Share Target exige.
- `vite.config.ts`: plugin com `srcDir: 'src'`, `filename: 'sw.ts'`, `registerType: 'autoUpdate'`,
  `devOptions.enabled: true` (para testar o SW com `pnpm dev`), e o manifest com `theme_color:
  '#ff6b35'`, `background_color: '#0a0a0b'`, ícones 192/512/512-maskable, e `share_target`
  (`action: '/share-target'`, `method: 'POST'`, `enctype: 'multipart/form-data'`, arquivo aceitando
  `image/*` e `application/pdf`).
- **Apagar `public/manifest.json`** — era lixo do Create React App ("Create React App Sample"),
  nunca referenciado. Ícones reais gerados em `public/icons/` (os `logo192/512.png` também eram do CRA).
- `index.html`: `<meta name="theme-color">` e `apple-touch-icon` (o `<link rel="manifest">` é
  injetado pelo plugin automaticamente).
- **`src/sw.ts`** — `precacheAndRoute(self.__WB_MANIFEST)`, `skipWaiting`/`clients.claim()`, e um
  handler de `fetch` que intercepta só `POST /share-target`, lê o `FormData`, estaciona o arquivo
  via `stashSharedFile`, e responde com `Response.redirect(..., 303)` para `/share-target?ready=1`.
- **`src/app/pwa/shared-file-store.ts`** — wrapper IndexedDB (`stashSharedFile`/`takeSharedFile`,
  lê e apaga na mesma operação).

  Guardar em IDB **não é detalhe de implementação, é o que salva o arquivo**: o `AuthGuard`
  (`src/app/router/guards/auth-guard.tsx`) redireciona para `/login?redirect=...` preservando
  só `pathname + search`. Um corpo POST seria perdido nesse desvio. Como o SW estaciona o
  arquivo antes de qualquer código React rodar, depois do login o usuário volta para
  `/share-target?ready=1` e a página encontra o comprovante intacto.

**✅ Feito.**

### 1.3 Frontend — rota, tela e revisão

- `src/app/router/routes.ts`: `SHARE_TARGET: '/share-target'`. Registrada em `router.tsx`
  **dentro** do bloco protegido por `AuthGuard`, com `lazy()` como as demais.
- `src/features/transactions/pages/share-target-page.tsx`: no mount chama `takeSharedFile()`;
  achou → abre `ReceiptReviewDialog` já com o arquivo; não achou (navegação manual/desktop) →
  mostra `FilePicker` com o mesmo destino.
- `src/features/transactions/components/receipt-review-dialog.tsx`: formulário inline (o repo não
  tem um `TransactionFormFields` de verdade reutilizável — `create-transaction-dialog.tsx` também
  inlina os campos, então esta implementação segue o mesmo padrão). Mostra faixa de campos não
  lidos, badge de procedência da sugestão de categoria, aviso quando `duplicate` é verdadeiro com
  link para a transação existente.
- `src/features/transactions/api/receipt-import.api.ts` + hooks `use-receipt-preview.ts` /
  `use-commit-receipt.ts`. Usa o mesmo `headers: { 'Content-Type': undefined }` de
  `statement-import.api.ts`. No commit, a parte JSON vai como
  `fd.append('data', new Blob([JSON.stringify(x)], { type: 'application/json' }))`.
- Commit bem-sucedido → `invalidateFinancialQueries()`.
- **Prompt de instalação**: `src/app/pwa/use-install-prompt.ts` capturando `beforeinstallprompt`
  + botão "Instalar app" na página de perfil (`profile-page.tsx`). Sem instalação não existe share
  target — sem isso a feature simplesmente nunca aparece para o usuário.

**✅ Feito.**

### 1.4 nginx — duas armadilhas reais

Em `cash-control-react/nginx.conf`:

- A regra `location ~* \.(js|css|...)$ { expires 1y; immutable; }` **casa com `sw.js`** e
  congelaria o service worker por um ano. Adicionado `location = /sw.js { no-store }` — exato
  vence regex no nginx.
- `.webmanifest` não está no `mime.types` padrão: `location = /manifest.webmanifest` servindo
  `application/manifest+json` explicitamente.

O `try_files $uri $uri/ /index.html` faz o nginx responder **405** a um POST em rota do app —
motivo pelo qual o Share Target *precisa* ser interceptado pelo service worker e nunca chegar à rede.

**✅ Feito.**

---

## Fase 2 — OCR de imagem

O caso principal: Nubank e PicPay compartilham **imagem**, não PDF.

- `OcrReceiptTextExtractor` chamando o binário do sistema via `ProcessBuilder`:
  `tesseract <tmp> stdout -l por --psm 6`.

  **Por que CLI e não Tess4J:** a imagem de runtime é `eclipse-temurin:25-jre-alpine` (musl).
  Tess4J depende de JNA + `libtesseract` compilado para glibc e dá atrito conhecido em Alpine.
  A CLI custa **zero dependência Gradle**, não tem problema de thread-safety (Tesseract não é
  thread-safe), isola falha em processo separado, e `Process.waitFor()` não fixa carrier thread —
  ao contrário de uma chamada JNI, que fixaria, já que `spring.threads.virtual.enabled=true`.
- `cash-control-api/Dockerfile`, estágio de runtime:
  `RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-por` (~50 MB).
- Pré-processamento mínimo com `ImageIO`/`java.awt` antes de chamar o binário: escala de cinza
  + 2x de upscale. Print de banco já é render digital limpo — não precisa de OpenCV.
- **Proteção do VPS**: `Semaphore` de `app.ocr.max-concurrent` (default 2) em volta do OCR e
  timeout duro no processo (`waitFor(app.ocr.timeout-seconds)` + `destroyForcibly()`).

**✅ Feito** (código e Dockerfile). **Não verificado em produção real** — ver `TODO.md`.

---

## Fase 3 — Refino do parser

O que decide se a feature é boa é a taxa de acerto. `valor` e `data` são muito estruturados e
acertam quase sempre; `recipientName` é o campo frágil, e é exatamente por isso que o fluxo
escolhido é "sempre revisar".

Montar um corpus de comprovantes reais (Nubank, Inter, PicPay, Itaú) e iterar o `PixReceiptParser`
contra ele. Testar contra **texto extraído e higienizado**, não contra as imagens: é a mesma
divisão que `InterFaturaPdfParserTest` já usa (`parseText(String)` separado de `extractText`),
e evita versionar comprovante bancário real com dado pessoal.

**⬜ Não feito.** Ver `TODO.md`.

---

## Arquivos principais

**Backend** (`cash-control-api/`)
- `service/receipt/{ReceiptTextExtractor,PdfReceiptTextExtractor,OcrReceiptTextExtractor,PixReceiptParser,ParsedReceipt}.java`
- `service/ReceiptImportService{,Impl}.java`
- `dto/request/ReceiptCommitRequest.java`, `dto/response/ReceiptPreviewResponse.java`
- Alterados: `controller/TransactionController.java`, `config/AppProperties.java`,
  `src/main/resources/application.yml`, `Dockerfile`, `.env.example`,
  `storage/LocalFileStorageAdapter.java`

**Frontend** (`cash-control-react/`)
- `src/sw.ts`, `src/app/pwa/{shared-file-store.ts,use-install-prompt.ts}`
- `src/features/transactions/pages/share-target-page.tsx`
- `src/features/transactions/components/receipt-review-dialog.tsx`
- `src/features/transactions/api/receipt-import.api.ts`
- `src/features/transactions/hooks/{use-receipt-preview,use-commit-receipt}.ts`
- `src/features/transactions/schemas/receipt-review.schema.ts`
- `public/icons/*`
- Alterados: `vite.config.ts`, `index.html`, `nginx.conf`,
  `src/app/router/{routes.ts,router.tsx}`, `src/features/transactions/types/index.ts`,
  `src/features/profile/pages/profile-page.tsx`, `eslint.config.js` (globals de service worker
  para `src/sw.ts`)
- Removidos: `public/manifest.json`, `public/logo192.png`, `public/logo512.png`

**Raiz**: `docker-compose.yml` (volume de anexos), `.env.example`, `.github/workflows/ci-api.yml`

Lembrar dos **dois passos de deploy**: commit dentro de cada submódulo **e** bump do ponteiro
aqui — sem os dois, o `cd.yml` não publica.

---

## Verificação

**Backend**
- `PixReceiptParserTest` — fixtures de texto higienizado por banco; assertar valor, data,
  destinatário, E2E, e `unreadFields` quando o campo falta. **Feito, 6 testes passando.**
- `PdfReceiptTextExtractorTest`, `ReceiptImportIntegrationTest` (Testcontainers) — **não feito**,
  ver `TODO.md`.
- Rodar via `cash-control-api/run_tests_wsl.sh` (Testcontainers precisa do daemon Docker).

**Frontend**
- `pnpm test:run` — testes de `receipt-import.api.ts` feitos; `share-target-page`/
  `receipt-review-dialog` com IDB mockado — **não feito**, ver `TODO.md`.
- `pnpm build && pnpm lint && pnpm format:check` — os quatro gates do CI web. **Todos verificados
  passando** nesta implementação.

**Ponta a ponta no celular** (é onde o Share Target realmente se prova) — **não executado**,
requer um Android físico:
1. `docker compose up -d --build` na raiz.
2. Ligar o celular por USB, `chrome://inspect` → **Port forwarding** `5173 → localhost:5173`.
   Isso faz `http://localhost:5173` contar como contexto seguro **no aparelho**, permitindo
   instalar o PWA e testar o share target sem depender de deploy.
3. No Chrome do Android: menu → "Instalar app" / "Adicionar à tela inicial".
4. Abrir o app do banco, um comprovante PIX → **Compartilhar** → "Cash Control" deve aparecer.
5. Confirmar: app abre na revisão preenchida → confirmar → transação na lista, comprovante
   no bloco de anexos, dashboard atualizado sem reload.
6. Compartilhar o **mesmo** comprovante de novo → aviso de duplicata na revisão.
7. Deslogar, compartilhar um comprovante: deve cair no login e, após autenticar, voltar para
   a revisão **com o arquivo preservado** (é o teste que valida a escolha do IndexedDB).
8. Depois do deploy real, repetir 3–6 em `https://cashcontrol.dimensionlab.tech` e confirmar
   que os anexos **sobrevivem** a um novo `docker compose up -d --build`.

---

## Riscos e observações

- **Instalação é pré-condição invisível.** Sem o PWA instalado, o share target não existe. O
  prompt de instalação não é enfeite.
- **Precisão do OCR varia por banco.** O fluxo "sempre revisar" absorve isso; a Fase 3 é o que
  transforma "preenche às vezes" em "preenche quase sempre".
- **Custo de CPU no VPS.** OCR é o processamento mais pesado que a API vai rodar. Semáforo e
  timeout da Fase 2 são obrigatórios, não opcionais.
- **Fora do escopo, encontrado no caminho:** `attachment-section.tsx` renderiza
  `<a href={att.url} target="_blank">`. Se `att.url` aponta para endpoint que exige bearer,
  esse link não funciona em navegação simples (sem header de auth). Vale conferir depois —
  não fez parte desta entrega.
