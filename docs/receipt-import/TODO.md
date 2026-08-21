# Comprovante de PIX via Web Share Target — o que falta

Estado após a implementação inicial (backend Fases 1+2, frontend PWA/share target
completo). Ver [`PLAN.md`](./PLAN.md), neste mesmo diretório, para o desenho completo;
este arquivo é só a lista do que ainda falta.

## Testes automatizados

- [ ] **`ReceiptImportServiceImplTest`** (Mockito) em `cash-control-api` — cobrir `preview`
      (com/sem `accountId`, com/sem leitura, duplicata detectada) e `commit` (conta
      arquivada → 422, `externalRef` repetido → 409, apelido lembrado, anexo gravado na
      mesma transação).
- [ ] **`ReceiptImportIntegrationTest`** (Testcontainers) em `cash-control-api` — ponta a
      ponta: preview → commit → assload da transação com anexo → replay do mesmo
      `externalRef` deve dar 409. Não foi possível rodar Testcontainers neste ambiente
      (sem Docker disponível na sessão que implementou a feature) — só o compile foi
      verificado, não a execução real.
- [ ] Testes de `shared-file-store.ts` (IndexedDB) em `cash-control-react` — round-trip de
      `stashSharedFile`/`takeSharedFile`, idealmente com `fake-indexeddb` (não está
      instalado ainda).
- [ ] Testes de componente para `ReceiptReviewDialog` e `ShareTargetPage` — pré-preenchimento
      pela prévia, aviso de duplicata, campos não lidos, fallback de arquivo manual.

## Fase 3 do plano — refinar o parser

- [ ] Montar um corpus de comprovantes reais (Nubank, Inter, PicPay, Itaú), sanitizado como
      texto (não a imagem/PDF original — mesma prática do `FaturaPdfFixture`, que gera o
      PDF em tempo de teste em vez de versionar um arquivo real com dado pessoal).
- [ ] Iterar `PixReceiptParser` contra esse corpus. `valor` e `data` devem acertar quase
      sempre; `recipientName` é o campo mais frágil — é o que mais precisa de ajuste.

## Verificação manual (não automatizável)

- [ ] Testar a instalação e o share target de verdade num Android, via
      `chrome://inspect` → port forwarding `5173 → localhost:5173` (contexto seguro no
      aparelho sem precisar de deploy). Roteiro completo na seção "Verificação" do plano
      original.
- [ ] Depois do primeiro deploy real: confirmar que os anexos **sobrevivem** a um novo
      `docker compose up -d --build` (valida o volume `attachments_data` adicionado no
      `docker-compose.yml`).
- [ ] Confirmar que `tesseract-ocr` + `tesseract-ocr-data-por` funcionam de fato no
      container de produção (Alpine) — só foi validado que a imagem builda, não que o OCR
      lê um comprovante real no ambiente do VPS.

## Notas / decisões que quem for continuar deveria saber

- `OCR_ENABLED=true` por padrão. Se o binário não estiver disponível por algum motivo,
  `OcrReceiptTextExtractor.supports()` ainda retorna `true` (checa só a flag e o mime
  type) e a chamada ao processo falha silenciosamente (`extract` devolve `""`) — o
  comprovante em imagem cai para preenchimento manual em vez de erro. Vale confirmar que
  esse é o comportamento desejado quando o binário realmente faltar.
- `externalRef` para comprovante ilegível (nada foi lido) é um `crypto.randomUUID()`
  gerado no frontend (`receipt-review-dialog.tsx`) — não há deduplicação nesse caso raro.
  Documentado no código, mas é uma limitação real, não um bug.
- Não existe endpoint dedicado para "esquecer" um apelido de destinatário criado via
  comprovante — usa o mesmo mecanismo implícito do import (reenviar a descrição original
  apaga o apelido). Consistente com o resto do repo, só registrando que não é óbvio.
