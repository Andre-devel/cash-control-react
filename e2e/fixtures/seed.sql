-- ============================================================
-- Seed do ambiente E2E (e2e/docker-compose.yml, serviço `seed`).
--
-- Roda depois que a API subiu, ou seja, com o schema já criado pelo Flyway.
-- Idempotente: ids fixos + ON CONFLICT DO NOTHING, então rodar de novo não duplica nada
-- (mas também não recria o que um teste já consumiu: para isso, `docker compose down -v`).
--
-- Usuário de teste, SÓ PARA ESTE AMBIENTE DESCARTÁVEL:
--   e-mail: e2e@cashcontrol.test
--   senha:  E2e-Senha#2026
-- O hash abaixo é Argon2id com os parâmetros do PasswordEncoderConfig
-- (m=65536, t=3, p=1, hash de 32 bytes, salt de 16 bytes).
-- ============================================================

BEGIN;

INSERT INTO users (id, email, password_hash, display_name, account_status_id, auth_origin_id,
                   email_verified_at, credentials_updated_at, consent_accepted_at, consent_version)
SELECT '00000000-0000-4000-8000-0000000000e2',
       'e2e@cashcontrol.test',
       '$argon2id$v=19$m=65536,t=3,p=1$1xLAPXXT5cToDKux3gqq7w$ydV9Y7bKRxTf5VbRvObRWQ7cJn8ifKjwpnj/I/h5TW4',
       'Usuário E2E',
       s.id, o.id, NOW(), NOW(), NOW(), '1.0'
FROM account_statuses s, auth_origins o
WHERE s.slug = 'ACTIVE' AND o.slug = 'LOCAL'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-4000-8000-0000000000e2', r.id FROM roles r WHERE r.name = 'USER'
ON CONFLICT DO NOTHING;

-- Conta corrente (destino do extrato importado e da pendência de /revisar).
INSERT INTO accounts (id, user_id, name, type, currency_code, scope)
VALUES ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-0000000000e2',
        'Conta E2E', 'CHECKING', 'BRL', 'PERSONAL')
ON CONFLICT DO NOTHING;

-- Cartão: fecha no dia 1 e vence no 10, para a fatura do mês corrente já existir com a compra.
INSERT INTO credit_cards (id, user_id, name, brand, issuer, credit_limit, closing_day, due_day, last4_digits, scope)
VALUES ('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000e2',
        'Cartão E2E', 'MASTERCARD', 'Banco E2E', 5000.00, 1, 10, '4242', 'PERSONAL')
ON CONFLICT DO NOTHING;

-- Pendências da fila do banco (/revisar), como o webhook da Pluggy gravaria. Uma por projeto do
-- Playwright (desktop e mobile rodam contra o mesmo banco e cada um confirma a sua).
INSERT INTO bank_pending_transactions (id, user_id, account_id, external_ref, date, history, description, amount)
VALUES
    ('00000000-0000-4000-8000-00000000b001', '00000000-0000-4000-8000-0000000000e2',
     '00000000-0000-4000-8000-00000000a001', 'plg:e2e-pending-desktop', CURRENT_DATE - 1,
     'Pix enviado', 'Padaria Pendente Desktop', -42.50),
    ('00000000-0000-4000-8000-00000000b002', '00000000-0000-4000-8000-0000000000e2',
     '00000000-0000-4000-8000-00000000a001', 'plg:e2e-pending-mobile', CURRENT_DATE - 1,
     'Pix enviado', 'Padaria Pendente Mobile', -37.90)
ON CONFLICT DO NOTHING;

COMMIT;
