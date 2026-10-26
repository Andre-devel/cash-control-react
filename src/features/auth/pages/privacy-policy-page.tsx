import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'

const CONTROLLER = 'Dimension Lab'
const CONTACT_EMAIL = 'dimensionlab.financeiro@gmail.com'
const LAST_UPDATED = '26 de outubro de 2026'

/**
 * Política pública (sem login). A URL é cadastrada na tela de consentimento OAuth do
 * Google, então o conteúdo precisa acompanhar o que a API de fato coleta e retém.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <article>
        <Link to={ROUTES.LOGIN} className="link">
          ← Voltar para o Cash Control
        </Link>

        <h1>Política de Privacidade</h1>
        <p className="legal-meta">Última atualização: {LAST_UPDATED}</p>

        <p>
          Esta política explica como o Cash Control, aplicativo de controle financeiro pessoal
          mantido por {CONTROLLER}, trata os seus dados pessoais, em conformidade com a Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018 — LGPD). {CONTROLLER} é a controladora dos dados.
        </p>

        <h2>1. Dados que coletamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail e senha. A senha é armazenada apenas como hash
            (Argon2) e nunca em texto puro.
          </li>
          <li>
            <strong>Login com Google:</strong> quando você escolhe entrar com Google, recebemos seu
            nome, e-mail e o identificador da sua conta Google. Não acessamos seus contatos,
            arquivos, e-mails ou qualquer outro dado da sua conta Google.
          </li>
          <li>
            <strong>Dados financeiros que você cadastra:</strong> contas, cartões, faturas,
            transações, categorias, tags, parcelamentos, recorrências e formas de pagamento.
          </li>
          <li>
            <strong>Arquivos que você envia:</strong> anexos de transações, extratos, faturas e
            comprovantes importados. Imagens de comprovantes são lidas por reconhecimento de texto
            (OCR) executado no nosso próprio servidor, sem envio a terceiros.
          </li>
          <li>
            <strong>Dados de segurança:</strong> endereço IP (armazenado de forma mascarada),
            navegador (user-agent), tentativas de login, data dos consentimentos e registros de
            auditoria de ações sensíveis na conta.
          </li>
        </ul>

        <h2>2. Para que usamos</h2>
        <ul>
          <li>Criar e manter sua conta e autenticar seu acesso.</li>
          <li>Oferecer as funcionalidades do aplicativo, como saldos, faturas e relatórios.</li>
          <li>Enviar e-mails transacionais: verificação de e-mail e redefinição de senha.</li>
          <li>Proteger a conta contra acessos indevidos, fraudes e abusos.</li>
          <li>Cumprir obrigações legais.</li>
        </ul>
        <p>
          As bases legais são a execução do contrato (art. 7º, V), o legítimo interesse para
          segurança (art. 7º, IX), o cumprimento de obrigação legal (art. 7º, II) e o seu
          consentimento, quando aplicável (art. 7º, I).
        </p>
        <p>Não vendemos seus dados, não os usamos para publicidade e não exibimos anúncios.</p>

        <h2>3. Compartilhamento</h2>
        <p>Seus dados são compartilhados apenas com o necessário para o serviço funcionar:</p>
        <ul>
          <li>
            <strong>Google</strong>, somente se você usar o login com Google, para confirmar sua
            identidade.
          </li>
          <li>
            <strong>Provedor de e-mail</strong>, que recebe seu endereço de e-mail para entregar as
            mensagens transacionais.
          </li>
          <li>
            <strong>Provedor de hospedagem</strong> do servidor onde o aplicativo e o banco de dados
            funcionam.
          </li>
          <li>Autoridades públicas, quando houver obrigação legal ou ordem judicial.</li>
        </ul>

        <h2>4. Cookies e armazenamento local</h2>
        <ul>
          <li>
            <strong>cash_control_refresh:</strong> cookie essencial, HttpOnly, que mantém sua sessão
            por até 7 dias.
          </li>
          <li>
            <strong>OAUTH2_AUTH_REQUEST:</strong> cookie temporário usado apenas durante o login com
            Google.
          </li>
          <li>
            O armazenamento local do navegador guarda o token de acesso da sessão e sua preferência
            de tema.
          </li>
        </ul>
        <p>Não usamos cookies de rastreamento, publicidade ou analytics de terceiros.</p>

        <h2>5. Retenção</h2>
        <p>
          Mantemos seus dados enquanto sua conta estiver ativa. Tokens de verificação de e-mail, de
          redefinição de senha e de sessão são descartados automaticamente após o uso ou a
          expiração, em até 30 dias. Quando você pedir a exclusão da conta, seus dados serão
          excluídos ou anonimizados, exceto registros que a lei nos obrigue a manter.
        </p>

        <h2>6. Segurança</h2>
        <p>
          Usamos conexão criptografada (HTTPS), senhas com hash Argon2, sessões de curta duração com
          renovação controlada, bloqueio após tentativas de login malsucedidas e registros de
          auditoria. Nenhum sistema é totalmente imune a falhas; em caso de incidente relevante,
          avisaremos você e a ANPD conforme a lei.
        </p>

        <h2>7. Seus direitos</h2>
        <p>
          Pela LGPD, você pode pedir a qualquer momento: confirmação e acesso aos seus dados,
          correção, anonimização ou exclusão, portabilidade, informação sobre compartilhamentos,
          revogação do consentimento e revisão de decisões automatizadas.
        </p>
        <p>
          Para exercer esses direitos, escreva para{' '}
          <a className="link" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . Responderemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de
          Proteção de Dados (ANPD).
        </p>

        <h2>8. Crianças e adolescentes</h2>
        <p>O Cash Control não é destinado a menores de 18 anos.</p>

        <h2>9. Alterações</h2>
        <p>
          Podemos atualizar esta política. A data no topo indica a versão atual; mudanças relevantes
          serão comunicadas no aplicativo ou por e-mail.
        </p>

        <h2>10. Contato</h2>
        <p>
          {CONTROLLER} —{' '}
          <a className="link" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </article>
    </main>
  )
}
