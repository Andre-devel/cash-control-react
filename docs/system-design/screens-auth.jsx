/* global React, Icons, Avatar, Toggle */
// ============================================================
// Cash Control — Shell (Sidebar + Topbar) + Login
// ============================================================
const { useState: useStateShell } = React;

function Sidebar({ route, onNav, theme, onToggleTheme }) {
  const items = [
    { sec: "Geral" },
    { id: "dashboard",    label: "Dashboard",     icon: Icons.home },
    { id: "transactions", label: "Transações",    icon: Icons.list, badge: "287" },
    { id: "accounts",     label: "Contas",        icon: Icons.wallet },
    { id: "cards",        label: "Cartões",       icon: Icons.card,  badge: "2" },
    { sec: "Gestão" },
    { id: "categories",   label: "Categorias",    icon: Icons.tag },
    { id: "installments", label: "Parcelamentos", icon: Icons.layers },
    { id: "recurrences",  label: "Recorrências",  icon: Icons.repeat },
    { sec: "Sistema" },
    { id: "design-system",label: "Design System", icon: Icons.cog },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="logo">C</span>
        <div className="name">Cash Control<small>cashcontrol.app</small></div>
      </div>

      <nav className="sidebar-nav">
        {items.map((it, i) =>
          it.sec ? (
            <div className="nav-section" key={"s"+i}>{it.sec}</div>
          ) : (
            <div
              key={it.id}
              className={`nav-item ${route === it.id ? "active" : ""}`}
              onClick={() => onNav(it.id)}
            >
              <it.icon size={16}/>
              <span>{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </div>
          )
        )}
      </nav>

      <div className="sidebar-foot">
        <Avatar name="RM" color="var(--accent)"/>
        <div className="who">
          <div className="n">Rafael Mendes</div>
          <div className="e">rafael@cashcontrol.app</div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" title="Tema" onClick={onToggleTheme}>
          {theme === "dark" ? <Icons.sun size={14}/> : <Icons.moon size={14}/>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, breadcrumb, children }) {
  return (
    <header className="topbar">
      {breadcrumb ? (
        <div className="breadcrumb">
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icons.chevR size={12} stroke={2}/>}
              {i === breadcrumb.length - 1 ? <b>{b}</b> : <span>{b}</span>}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      <div className="spacer"/>
      {children}
    </header>
  );
}

// ============================================================
// LOGIN / REGISTRO / ESQUECI MINHA SENHA
// ============================================================
function LoginScreen({ onEnter }) {
  const [mode, setMode] = useStateShell("login"); // login | register | forgot | reset
  const [email, setEmail] = useStateShell("rafael@cashcontrol.app");
  const [pwd, setPwd] = useStateShell("");
  const [consent, setConsent] = useStateShell(false);

  return (
    <div className="auth-shell" data-screen-label="01 Login">
      <aside className="auth-aside">
        <div className="brand">
          <span className="logo" style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--accent-press))", display: "grid", placeItems: "center", color: "var(--accent-fg)", fontWeight: 700, letterSpacing: "-0.04em" }}>C</span>
          <div className="name">Cash Control</div>
        </div>

        {/* Mini mock of dashboard floating */}
        <svg className="mock" viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--surface-1)"/>
              <stop offset="1" stopColor="var(--surface-2)"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="480" height="360" rx="14" fill="url(#g1)" stroke="var(--border)"/>
          {/* topbar */}
          <rect x="0" y="0" width="480" height="36" fill="var(--surface-2)" />
          <rect x="14" y="14" width="60" height="8" rx="2" fill="var(--border-strong)"/>
          <circle cx="460" cy="18" r="6" fill="var(--accent)"/>
          {/* KPI row */}
          <g transform="translate(16, 52)">
            {[0,1,2].map(i => (
              <g key={i} transform={`translate(${i*150}, 0)`}>
                <rect width="140" height="74" rx="8" fill="var(--surface-2)" stroke="var(--border)"/>
                <rect x="12" y="14" width="60" height="6" rx="2" fill="var(--border-strong)"/>
                <rect x="12" y="32" width="86" height="14" rx="3" fill={i===0?"var(--text)":i===1?"var(--income)":"var(--expense)"}/>
                <rect x="12" y="56" width="40" height="5" rx="2" fill="var(--border)"/>
              </g>
            ))}
          </g>
          {/* chart card */}
          <g transform="translate(16, 142)">
            <rect width="290" height="200" rx="8" fill="var(--surface-2)" stroke="var(--border)"/>
            <rect x="14" y="14" width="100" height="8" rx="2" fill="var(--border-strong)"/>
            <g transform="translate(14, 50)">
              {[0,1,2,3,4,5].map(i => (
                <g key={i} transform={`translate(${i*44}, 0)`}>
                  <rect x="2"  y={120-60-Math.random()*40} width="14" height={60+Math.random()*40} rx="2" fill="var(--income)" opacity="0.85"/>
                  <rect x="20" y={120-50-Math.random()*30} width="14" height={50+Math.random()*30} rx="2" fill="var(--expense)" opacity="0.85"/>
                </g>
              ))}
              <line x1="0" y1="120" x2="262" y2="120" stroke="var(--border)"/>
            </g>
          </g>
          {/* upcoming */}
          <g transform="translate(322, 142)">
            <rect width="142" height="200" rx="8" fill="var(--surface-2)" stroke="var(--border)"/>
            <rect x="12" y="14" width="80" height="8" rx="2" fill="var(--border-strong)"/>
            {[0,1,2,3].map(i => (
              <g key={i} transform={`translate(12, ${36 + i*40})`}>
                <rect width="24" height="24" rx="6" fill={["var(--accent)","var(--info)","var(--pending)","var(--cat-4)"][i]} opacity="0.25"/>
                <rect x="32" y="4" width="60" height="6" rx="2" fill="var(--text)" opacity="0.6"/>
                <rect x="32" y="14" width="42" height="5" rx="2" fill="var(--text-dim)" opacity="0.4"/>
                <rect x="100" y="8" width="18" height="6" rx="2" fill="var(--expense)" opacity="0.7"/>
              </g>
            ))}
          </g>
        </svg>

        <div className="pitch">
          <h2>Seu dinheiro,<br/>sob controle.</h2>
          <p>Contas, cartões, parcelamentos e recorrências em um só lugar — com a precisão de uma planilha e a fluidez de um app moderno.</p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          {(mode === "login" || mode === "register") && (
            <div className="auth-tabs">
              <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Entrar</button>
              <button className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>Criar conta</button>
            </div>
          )}

          {mode === "login" && (
            <>
              <h1>Bem-vindo de volta</h1>
              <div className="sub">Entre para gerenciar suas finanças.</div>

              <div className="col" style={{ gap: 14 }}>
                <Field label="E-mail" required>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"/>
                </Field>
                <Field label="Senha" required>
                  <PasswordInput value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••"/>
                </Field>
                <div className="row between" style={{ marginTop: -4 }}>
                  <label className="row gap-2" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    <input type="checkbox" className="checkbox"/> Manter conectado
                  </label>
                  <a className="link" style={{ fontSize: 12 }} onClick={() => setMode("forgot")}>Esqueci minha senha</a>
                </div>
                <Button variant="primary" size="lg" onClick={onEnter}>Entrar</Button>
                <div className="auth-divider">ou continue com</div>
                <Button size="lg" leading={<Icons.google size={16}/>}>Entrar com Google</Button>
              </div>

              <div className="auth-foot">
                Novo por aqui? <a className="link" onClick={() => setMode("register")}>Crie sua conta</a>
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <h1>Crie sua conta</h1>
              <div className="sub">Comece a organizar suas finanças hoje.</div>

              <div className="col" style={{ gap: 14 }}>
                <Field label="E-mail" required>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"/>
                </Field>
                <Field label="Senha" required hint="Mínimo 8 caracteres, incluindo número e símbolo.">
                  <PasswordInput value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Crie uma senha forte"/>
                </Field>
                <label className="row gap-2" style={{ fontSize: 12, color: "var(--text-muted)", alignItems: "flex-start", lineHeight: 1.4 }}>
                  <input type="checkbox" className="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2 }}/>
                  <span>Li e aceito os <a className="link">Termos de Uso</a> e a <a className="link">Política de Privacidade</a>.</span>
                </label>
                <Button variant="primary" size="lg" disabled={!consent} onClick={onEnter}>Criar conta</Button>
                <div className="auth-divider">ou</div>
                <Button size="lg" leading={<Icons.google size={16}/>}>Continuar com Google</Button>
              </div>

              <div className="auth-foot">
                Já tem uma conta? <a className="link" onClick={() => setMode("login")}>Entrar</a>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h1>Recuperar acesso</h1>
              <div className="sub">Enviaremos um link para redefinir sua senha.</div>

              <div className="col" style={{ gap: 14 }}>
                <Field label="E-mail" required>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"/>
                </Field>
                <Button variant="primary" size="lg" onClick={() => setMode("reset")}>Enviar link</Button>
                <Button variant="ghost" size="lg" onClick={() => setMode("login")}>Voltar para login</Button>
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1>Defina uma nova senha</h1>
              <div className="sub">Escolha algo forte e único.</div>

              <div className="col" style={{ gap: 14 }}>
                <Field label="Nova senha" required>
                  <PasswordInput placeholder="••••••••"/>
                </Field>
                <Field label="Confirmar senha" required>
                  <PasswordInput placeholder="••••••••"/>
                </Field>
                <Button variant="primary" size="lg" onClick={onEnter}>Redefinir senha</Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, LoginScreen });
