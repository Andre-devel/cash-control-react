/* global React, Icons, Money, Badge, StatusBadge, TypeBadge, IconBubble, fmtDate, fmtDateShort, ACCOUNTS, CATS, CARDS, CARD_CHARGES, TX, SERIES, UPCOMING, totalBalance, monthIncome, monthExpense, acc, cat */
// ============================================================
// Cash Control — MOBILE screens (inside iOS frame children)
// ============================================================
const { useState: useStateMb } = React;

// ----- Status bar spacer (we render content inside IOSDevice which already has its own statusbar) -----
// Tab bar component
function MBTabs({ active = "home", onChange }) {
  const items = [
    { id: "home",    label: "Início",    icon: Icons.home },
    { id: "tx",      label: "Transações",icon: Icons.list },
    { id: "fab",     fab: true },
    { id: "accounts",label: "Contas",    icon: Icons.wallet },
    { id: "cards",   label: "Cartões",   icon: Icons.card },
  ];
  return (
    <nav className="mb-tabs">
      {items.map(it => it.fab ? (
        <div className="mb-tab-center" key="fab">
          <button className="mb-fab" onClick={() => onChange?.("new")} aria-label="Nova transação">
            <Icons.plus size={22} stroke={2.2}/>
          </button>
        </div>
      ) : (
        <button key={it.id} className={`mb-tab ${active === it.id ? "active" : ""}`} onClick={() => onChange?.(it.id)}>
          <it.icon size={20}/>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ============================================================
// MOBILE: Login
// ============================================================
function MBLogin() {
  const [tab, setTab] = useStateMb("login");
  return (
    <div className="mb">
      <div className="mb-content auth no-tabs">
        <div className="mb-auth">
          <div className="brand-row">
            <span className="logo">C</span>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Cash Control</div>
          </div>

          <h1>Bem-vindo de volta</h1>
          <div className="sub">Suas finanças, na palma da mão.</div>

          <div className="tabs-row">
            <button className={tab === "login" ? "on" : ""} onClick={() => setTab("login")}>Entrar</button>
            <button className={tab === "register" ? "on" : ""} onClick={() => setTab("register")}>Criar conta</button>
          </div>

          <div className="mb-field">
            <label>E-mail</label>
            <div className="ctrl">
              <Icons.user size={15} className="text-dim"/>
              <input defaultValue="rafael@cashcontrol.app"/>
            </div>
          </div>

          <div className="mb-field">
            <label>Senha</label>
            <div className="ctrl">
              <Icons.shield size={15} className="text-dim"/>
              <input type="password" defaultValue="••••••••"/>
              <Icons.eye size={15} className="text-dim"/>
            </div>
          </div>

          {tab === "register" && (
            <label style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45, marginBottom: 18 }}>
              <input type="checkbox" className="checkbox" defaultChecked style={{ marginTop: 2, flexShrink: 0 }}/>
              <span>Li e aceito os <span style={{ color: "var(--accent)" }}>Termos de Uso</span> e a <span style={{ color: "var(--accent)" }}>Política de Privacidade</span>.</span>
            </label>
          )}

          {tab === "login" && (
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <a style={{ color: "var(--accent)", fontSize: 12, fontWeight: 500 }}>Esqueci minha senha</a>
            </div>
          )}

          <button className="mb-btn-block primary">{tab === "login" ? "Entrar" : "Criar conta"}</button>

          <div className="mb-divider">ou continue com</div>

          <button className="mb-btn-block">
            <Icons.google size={18}/>
            <span>Continuar com Google</span>
          </button>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--text-dim)" }}>
            {tab === "login" ? (
              <>Novo aqui? <a style={{ color: "var(--accent)" }} onClick={() => setTab("register")}>Crie sua conta</a></>
            ) : (
              <>Já tem conta? <a style={{ color: "var(--accent)" }} onClick={() => setTab("login")}>Entrar</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MOBILE: Dashboard (Início)
// ============================================================
function MBDashboard() {
  return (
    <div className="mb">
      <div className="mb-content">
        {/* Top: greeting + bell */}
        <div className="mb-top">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Bom dia, Rafael</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 2 }}>Quarta, 27 de maio</div>
          </div>
          <button className="ico-btn"><Icons.bell size={16}/></button>
          <button className="ico-btn"><Icons.user size={16}/></button>
        </div>

        {/* Hero balance */}
        <div className="mb-hero">
          <div className="lbl"><Icons.wallet size={12}/> Patrimônio total · mai 2026</div>
          <div className="v">
            <span className="sym">R$</span>63.999<span className="cents">,13</span>
          </div>
          <div className="delta"><Icons.arrowUp size={11} stroke={2.4}/> +R$ 1.842 este mês · +2,9%</div>
        </div>

        {/* Quick actions */}
        <div className="mb-actions">
          <button className="mb-action"><span className="ico"><Icons.plus size={16}/></span>Lançar</button>
          <button className="mb-action"><span className="ico"><Icons.arrowLR size={16}/></span>Transferir</button>
          <button className="mb-action"><span className="ico"><Icons.card size={16}/></span>Pagar</button>
          <button className="mb-action"><span className="ico"><Icons.chart size={16}/></span>Análise</button>
        </div>

        {/* Accounts carousel */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Contas</h3>
            <span className="sub">{ACCOUNTS.length}</span>
            <div className="right"><a>Ver todas</a></div>
          </div>
        </div>
        <div className="mb-hcarousel">
          {ACCOUNTS.slice(0, 4).map(a => {
            const IconCmp = Icons[a.icon];
            return (
              <div key={a.id} className="mb-account-card">
                <div className="ico-bub" style={{ background: a.color + "22", color: a.color }}>
                  <IconCmp size={14}/>
                </div>
                <div className="n">{a.name}</div>
                <div className="b"><Money value={a.balance}/></div>
              </div>
            );
          })}
        </div>

        {/* Receitas vs Despesas */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Receitas vs Despesas</h3>
            <span className="sub">6 meses</span>
            <div className="right"><a>Ver mais</a></div>
          </div>
          <div className="mb-card">
            <div style={{ display: "flex", gap: 18, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Receitas (mai)</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: "var(--income)" }}><Money value={monthIncome}/></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Despesas (mai)</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: "var(--expense)" }}><Money value={monthExpense}/></div>
              </div>
            </div>
            <MBMiniBars/>
          </div>
        </div>

        {/* Próximas contas */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Próximas contas</h3>
            <span className="sub">{UPCOMING.length} pendentes</span>
            <div className="right"><a>Ver todas</a></div>
          </div>
          <div className="mb-card flush" style={{ padding: "0 16px" }}>
            {UPCOMING.slice(0, 3).map(t => {
              const c = cat(t.categoryId);
              const a = acc(t.accountId);
              const IconCmp = c ? Icons[c.icon] : Icons[a.icon];
              const due = t.due || t.competence;
              return (
                <div className="mb-row" key={t.id}>
                  <IconBubble color={c?.color || a.color} icon={IconCmp}/>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ttl" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                    <div className="meta">{a.name} · vence {fmtDateShort(due)}</div>
                  </div>
                  <div className="right">
                    <div className="amt" style={{ color: t.amount < 0 ? "var(--expense)" : "var(--income)" }}><Money value={t.amount} signed/></div>
                    <Badge kind="pending" style={{ fontSize: 10, marginTop: 4 }}>Pendente</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Faturas em aberto */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Faturas em aberto</h3>
            <span className="sub">{CARDS.filter(c => c.invoice.status === "OPEN").length} cartões</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CARDS.filter(c => c.invoice.status === "OPEN").map(c => {
              const pct = (c.invoice.totalAmount / c.creditLimit) * 100;
              const days = Math.max(0, Math.ceil((new Date(c.invoice.dueDate) - new Date("2026-05-27")) / 86400000));
              return (
                <div key={c.id} style={{
                  padding: 14,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${c.color}22, transparent 60%), var(--surface-1)`,
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <IconBubble color={c.color} icon={Icons.card}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>•••• {c.lastFour}</div>
                    </div>
                    <Badge kind={days <= 3 ? "pending" : "info"}>Vence em {days}d</Badge>
                  </div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}>
                    <Money value={c.invoice.totalAmount}/>
                  </div>
                  <div className="bar" style={{ marginTop: 8 }}><i style={{ width: pct + "%", background: c.color }}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MBTabs active="home"/>
    </div>
  );
}

function MBMiniBars() {
  const W = 320, H = 84;
  const PAD_T = 4, PAD_B = 14, PAD_X = 4;
  const cw = W - PAD_X * 2, ch = H - PAD_T - PAD_B;
  const max = Math.max(...SERIES.flatMap(d => [d.income, d.expense])) * 1.1;
  const gw = cw / SERIES.length;
  const bw = (gw * 0.34);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
      {SERIES.map((d, i) => {
        const x = PAD_X + i * gw + gw/2;
        const ih = (d.income / max) * ch;
        const eh = (d.expense / max) * ch;
        const isCurrent = i === SERIES.length - 1;
        return (
          <g key={i}>
            <rect x={x - bw - 1.5} y={PAD_T + ch - ih} width={bw} height={ih} rx="2" fill="var(--income)" opacity={isCurrent ? 1 : 0.7}/>
            <rect x={x + 1.5}      y={PAD_T + ch - eh} width={bw} height={eh} rx="2" fill="var(--expense)" opacity={isCurrent ? 1 : 0.7}/>
            <text x={x} y={H - 2} textAnchor="middle" fontSize="9" fill={isCurrent ? "var(--text)" : "var(--text-faint)"} fontFamily="var(--font-mono)" fontWeight={isCurrent ? 600 : 400}>{d.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// MOBILE: Transações
// ============================================================
function MBTransactions() {
  const grouped = [...TX].sort((a,b) => b.competence.localeCompare(a.competence)).reduce((acc, t) => {
    (acc[t.competence] = acc[t.competence] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="mb">
      <div className="mb-content">
        <div className="mb-top">
          <h1>Transações</h1>
          <button className="ico-btn"><Icons.search size={16}/></button>
          <button className="ico-btn"><Icons.filter size={16}/></button>
        </div>

        <div className="mb-search">
          <Icons.search size={14} className="text-dim"/>
          <input placeholder="Buscar por descrição ou valor…"/>
        </div>

        <div className="mb-seg">
          <button className="on">Todas</button>
          <button>Receitas</button>
          <button>Despesas</button>
        </div>

        <div className="mb-chips" style={{ marginTop: 12 }}>
          <span className="mb-chip on">Mai 2026 <Icons.chevD size={11}/></span>
          <span className="mb-chip">Conta <Icons.chevD size={11}/></span>
          <span className="mb-chip">Categoria <Icons.chevD size={11}/></span>
          <span className="mb-chip">Status <Icons.chevD size={11}/></span>
          <span className="mb-chip">Valor <Icons.chevD size={11}/></span>
        </div>

        {/* Sticky summary card */}
        <div style={{ padding: "0 20px" }}>
          <div className="mb-card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Resultado</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: monthIncome - monthExpense >= 0 ? "var(--income)" : "var(--expense)" }}>
                <Money value={monthIncome - monthExpense} signed/>
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: "var(--border)" }}/>
            <div style={{ textAlign: "right", flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Transações</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>{TX.length}<span style={{ color: "var(--text-dim)", fontSize: 12, marginLeft: 4 }}>/ 287</span></div>
            </div>
          </div>
        </div>

        {Object.entries(grouped).map(([date, rows]) => {
          const dayIncome = rows.filter(t => t.amount > 0).reduce((a,b) => a + b.amount, 0);
          const dayExpense = rows.filter(t => t.amount < 0).reduce((a,b) => a + b.amount, 0);
          return (
            <React.Fragment key={date}>
              <div className="mb-day">
                <span className="d">{fmtDate(date)}</span>
                <span className="sum">
                  {dayIncome > 0 && <span style={{ color: "var(--income)" }}>+<Money value={dayIncome}/></span>}
                  {dayIncome > 0 && dayExpense < 0 && <span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span>}
                  {dayExpense < 0 && <span style={{ color: "var(--expense)" }}><Money value={dayExpense} signed/></span>}
                </span>
              </div>
              <div style={{ padding: "0 20px" }}>
                <div className="mb-card flush" style={{ padding: "0 16px" }}>
                  {rows.map(t => {
                    const c = cat(t.categoryId);
                    const a = acc(t.accountId);
                    const IconCmp = c ? Icons[c.icon] : (t.type === "TRANSFER" ? Icons.arrowLR : Icons[a.icon]);
                    const color = c?.color || (t.type === "TRANSFER" ? "var(--info)" : a.color);
                    return (
                      <div key={t.id} className="mb-row">
                        <IconBubble color={color} icon={IconCmp}/>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="ttl" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                          <div className="meta">
                            {c?.name || (t.type === "TRANSFER" ? "Transferência" : "—")} · {a.name}
                            {t.status === "PENDING" && <span style={{ color: "var(--pending)" }}> · Pendente</span>}
                          </div>
                        </div>
                        <div className="amt" style={{ color: t.amount > 0 ? "var(--income)" : "var(--text)" }}>
                          <Money value={t.amount} signed/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <MBTabs active="tx"/>
    </div>
  );
}

// ============================================================
// MOBILE: Nova Transação (Bottom Sheet over Dashboard)
// ============================================================
function MBNewTransaction() {
  const [type, setType] = useStateMb("EXPENSE");
  const [amount, setAmount] = useStateMb("142,90");
  const types = [
    { id: "INCOME",   label: "Receita",       icon: Icons.arrowDown, color: "var(--income)" },
    { id: "EXPENSE",  label: "Despesa",       icon: Icons.arrowUp,   color: "var(--expense)" },
    { id: "TRANSFER", label: "Transferência", icon: Icons.arrowLR,   color: "var(--info)" },
  ];

  return (
    <div className="mb" style={{ position: "relative" }}>
      {/* Dimmed background (mock dashboard underneath) */}
      <div className="mb-content" style={{ filter: "brightness(0.35) blur(2px)", pointerEvents: "none" }}>
        <MBDashboard/>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}/>

      <div className="mb-sheet">
        <div className="grabber"/>
        <div style={{ display: "flex", alignItems: "center", padding: "4px 20px 0" }}>
          <button style={{ background: "transparent", border: 0, color: "var(--text-muted)", fontSize: 14, padding: 4 }}>Cancelar</button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600 }}>Nova transação</div>
          <button style={{ background: "transparent", border: 0, color: "var(--accent)", fontSize: 14, fontWeight: 600, padding: 4 }}>Salvar</button>
        </div>

        <div className="body">
          {/* Amount entry — central */}
          <div className="mb-amount-entry">
            <div className="lbl">Valor</div>
            <div style={{ marginTop: 6 }}>
              <span className="sym">R$</span>
              <span className="val">{amount.split(",")[0]}<span className="cents">,{amount.split(",")[1] || "00"}</span></span>
            </div>
          </div>

          {/* Type pills */}
          <div className="mb-types">
            {types.map(o => (
              <button
                key={o.id}
                onClick={() => setType(o.id)}
                className={`mb-type ${type === o.id ? "on" : ""}`}
                style={{ "--type-color": o.color }}
              >
                <div className="ico-c" style={{ background: type === o.id ? "transparent" : "var(--surface-3)" }}>
                  <o.icon size={15} stroke={2}/>
                </div>
                <span className="label">{o.label}</span>
              </button>
            ))}
          </div>

          {/* Form fields */}
          <div className="mb-field">
            <label>DESCRIÇÃO</label>
            <div className="ctrl">
              <input defaultValue="Amazon — Livros"/>
            </div>
          </div>

          <div className="mb-field">
            <label>CATEGORIA</label>
            <div className="ctrl">
              <IconBubble color="#c084fc" icon={Icons.heart} size="sm"/>
              <input defaultValue="Lazer"/>
              <Badge kind="info" dot={false} square style={{ fontSize: 10 }}>auto</Badge>
              <Icons.chevD size={14} className="text-dim"/>
            </div>
          </div>

          <div className="mb-field">
            <label>CONTA</label>
            <div className="ctrl">
              <IconBubble color="#a855f7" icon={Icons.card} size="sm"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Nubank</div>
              </div>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}><Money value={8432.18}/></span>
              <Icons.chevD size={14} className="text-dim"/>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="mb-field">
              <label>DATA</label>
              <div className="ctrl">
                <Icons.cal size={14} className="text-dim"/>
                <input defaultValue="27/05/2026"/>
              </div>
            </div>
            <div className="mb-field">
              <label>STATUS</label>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ flex: 1, height: 46, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-dim)", fontWeight: 500, fontSize: 13 }}>Pendente</button>
                <button style={{ flex: 1, height: 46, borderRadius: 10, border: "1px solid var(--paid)", background: "var(--paid-soft)", color: "var(--paid)", fontWeight: 500, fontSize: 13 }}>Pago</button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-field">
            <label>ANEXOS</label>
            <div style={{
              border: "1.5px dashed var(--border-strong)",
              borderRadius: 10,
              padding: 14,
              background: "var(--surface-2)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div className="icon-bubble" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                <Icons.upload size={14}/>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>
                <div style={{ fontWeight: 500, color: "var(--text)" }}>Adicionar comprovante</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>PDF, JPG, PNG · até 10 MB</div>
              </div>
              <Icons.plus size={16} className="text-muted"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MOBILE: Contas
// ============================================================
function MBAccounts() {
  return (
    <div className="mb">
      <div className="mb-content">
        <div className="mb-top">
          <h1>Contas</h1>
          <button className="ico-btn"><Icons.arrowLR size={16}/></button>
          <button className="ico-btn"><Icons.plus size={16}/></button>
        </div>

        <div className="mb-hero" style={{ background: "linear-gradient(135deg, rgba(96,165,250,0.16), transparent 60%), var(--surface-1)" }}>
          <div className="lbl"><Icons.chart size={12}/> Patrimônio total</div>
          <div className="v">
            <span className="sym">R$</span>63.999<span className="cents">,13</span>
          </div>
          <div className="delta"><Icons.arrowUp size={11} stroke={2.4}/> +2,9% no mês</div>
        </div>

        {/* Distribution donut */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Distribuição</h3>
            <span className="sub">por tipo</span>
          </div>
          <div className="mb-card">
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <MBDonut total={totalBalance}/>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(ACCOUNTS.reduce((acc, a) => {
                  acc[a.type] = (acc[a.type] || { value: 0, color: a.color });
                  acc[a.type].value += a.balance;
                  return acc;
                }, {})).map(([t, d]) => {
                  const pct = (d.value / totalBalance) * 100;
                  const label = { CHECKING: "Corrente", SAVINGS: "Poupança", CASH: "Carteira", INVESTMENT: "Investimento" }[t] || t;
                  return (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: d.color }}/>
                      <span style={{ fontSize: 12, flex: 1 }}>{label}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Account list */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Suas contas</h3>
            <span className="sub">{ACCOUNTS.length}</span>
            <div className="right"><a>Editar</a></div>
          </div>
          <div className="mb-card flush" style={{ padding: "0 16px" }}>
            {ACCOUNTS.map(a => {
              const IconCmp = Icons[a.icon];
              return (
                <div key={a.id} className="mb-row">
                  <IconBubble color={a.color} icon={IconCmp} size="lg"/>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ttl">{a.name}</div>
                    <div className="meta">{a.type === "CHECKING" ? "Conta corrente" : a.type === "SAVINGS" ? "Poupança" : a.type === "CASH" ? "Carteira" : "Investimento"} · {a.last}</div>
                  </div>
                  <div className="right">
                    <div className="amt"><Money value={a.balance}/></div>
                  </div>
                </div>
              );
            })}
            <div className="mb-row" style={{ cursor: "pointer" }}>
              <div className="icon-bubble lg" style={{ background: "var(--surface-2)", color: "var(--text-muted)", borderStyle: "dashed", border: "1.5px dashed var(--border-strong)" }}>
                <Icons.plus size={16}/>
              </div>
              <div className="ttl" style={{ color: "var(--text-muted)" }}>Adicionar nova conta</div>
            </div>
          </div>
        </div>

        {/* Transfer button */}
        <div className="mb-section">
          <button className="mb-btn-block">
            <Icons.arrowLR size={16}/>
            Transferir entre contas
          </button>
        </div>
      </div>
      <MBTabs active="accounts"/>
    </div>
  );
}

function MBDonut({ total }) {
  const size = 96;
  const cx = size/2, cy = size/2;
  const r = size/2 - 8;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={12}/>
      {ACCOUNTS.map((a, i) => {
        const len = (a.balance / total) * C;
        const c = (
          <circle key={a.id} cx={cx} cy={cy} r={r} fill="none" stroke={a.color}
            strokeWidth={12}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}/>
        );
        offset += len;
        return c;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="var(--font-mono)">TOTAL</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="13" fill="var(--text)" fontFamily="var(--font-mono)" fontWeight="500" style={{ fontVariantNumeric: "tabular-nums" }}>
        R$ 64k
      </text>
    </svg>
  );
}

// ============================================================
// MOBILE: Cartões + Fatura
// ============================================================
function MBCards() {
  const card = CARDS[0];
  const charges = CARD_CHARGES.filter(ch => ch.cardId === card.id);
  const inv = card.invoice;
  const usedPct = (inv.totalAmount / card.creditLimit) * 100;
  const days = Math.max(0, Math.ceil((new Date(inv.dueDate) - new Date("2026-05-27")) / 86400000));

  return (
    <div className="mb">
      <div className="mb-content">
        <div className="mb-top">
          <h1>Cartões</h1>
          <button className="ico-btn"><Icons.plus size={16}/></button>
        </div>

        {/* Card carousel */}
        <div className="mb-cc-carousel">
          {CARDS.map(c => (
            <div key={c.id} className="mb-cc" style={{
              background: `
                radial-gradient(140% 80% at 0% 0%, ${c.color}66, transparent 55%),
                linear-gradient(135deg, ${c.color}33, transparent 70%),
                var(--surface-2)
              `,
              border: `1px solid ${c.color}55`,
              boxShadow: `0 12px 32px -10px ${c.color}66`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{c.brand}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{c.name}</div>
                </div>
                <div style={{
                  width: 32, height: 24, borderRadius: 5,
                  background: "linear-gradient(135deg, #d4af6a, #8b6a35)",
                  opacity: 0.85,
                }}/>
              </div>
              <div style={{ flex: 1 }}/>
              <div className="mono" style={{ fontSize: 16, letterSpacing: "0.1em", marginBottom: 12 }}>
                ••••  ••••  ••••  {c.lastFour}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Fatura</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}><Money value={c.invoice.totalAmount}/></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Limite</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{((c.invoice.totalAmount/c.creditLimit)*100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 0 4px" }}>
          {CARDS.map((c, i) => (
            <span key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, background: i === 0 ? "var(--accent)" : "var(--border-strong)", transition: "width 200ms" }}/>
          ))}
        </div>

        {/* Invoice summary */}
        <div style={{ padding: "0 20px", marginTop: 12 }}>
          <div className="mb-card">
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Fatura atual · vence em {days} dias</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", marginTop: 4 }}>
                  <Money value={inv.totalAmount}/>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Fecha em {fmtDate(inv.closesAt)}</div>
              </div>
              <Badge kind={days <= 3 ? "pending" : "info"}>{fmtDateShort(inv.dueDate)}</Badge>
            </div>
            <div className="bar" style={{ marginBottom: 8 }}><i style={{ width: usedPct + "%", background: card.color }}/></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-dim)" }}>
              <span>{usedPct.toFixed(0)}% do limite</span>
              <span className="mono">Disponível <Money value={card.creditLimit - inv.totalAmount}/></span>
            </div>
            <button className="mb-btn-block primary" style={{ marginTop: 14, height: 44 }}>
              <Icons.check size={15}/>
              Pagar fatura
            </button>
          </div>
        </div>

        {/* Charges list */}
        <div className="mb-section">
          <div className="mb-section-h">
            <h3>Lançamentos</h3>
            <span className="sub">{charges.length} compras</span>
            <div className="right">
              <button style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", border: 0, color: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}>
                Data <Icons.chevD size={11}/>
              </button>
            </div>
          </div>
          <div className="mb-card flush" style={{ padding: "0 16px" }}>
            {charges.map(ch => {
              const c = cat(ch.categoryId);
              const IconCmp = c ? Icons[c.icon] : Icons.bag;
              return (
                <div key={ch.id} className="mb-row">
                  <IconBubble color={c?.color || "var(--text-muted)"} icon={IconCmp}/>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ttl" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.description}</div>
                    <div className="meta">{c?.name || "—"} · {fmtDateShort(ch.date)}</div>
                  </div>
                  <div className="amt"><Money value={ch.amount}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MBTabs active="cards"/>
    </div>
  );
}

Object.assign(window, { MBLogin, MBDashboard, MBTransactions, MBNewTransaction, MBAccounts, MBCards });
