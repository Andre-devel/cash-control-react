/* global React, Icons, Money, Money$, Badge, StatusBadge, TypeBadge, IconBubble, Button, fmtDate, fmtDateShort, ACCOUNTS, CATS, CARDS, CARD_CHARGES, TX, SERIES, UPCOMING, totalBalance, monthIncome, monthExpense, acc, cat, accIcon, catIcon, monthNamePt */
// ============================================================
// Cash Control — Dashboard
// ============================================================

function Dashboard({ onNew }) {
  const balanceDelta = (monthIncome - monthExpense);
  return (
    <div data-screen-label="02 Dashboard">
      <div className="page-h">
        <div>
          <h1 className="title">Olá, Rafael 👋</h1>
          <div className="desc">Aqui está um resumo das suas finanças em maio · 2026</div>
        </div>
        <div className="spacer"/>
        <div className="actions">
          <div className="tabs">
            <button>7d</button>
            <button>30d</button>
            <button className="on">Mês</button>
            <button>Ano</button>
          </div>
          <Button leading={<Icons.download size={14}/>}>Exportar</Button>
          <Button variant="primary" leading={<Icons.plus size={14}/>} onClick={onNew}>Nova transação</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-4 mb-6">
        <KPI label="Patrimônio total" icon={Icons.wallet} value={totalBalance} delta="+R$ 1.842 este mês" deltaKind="up"/>
        <KPI label="Receitas (mai.)"   icon={Icons.arrowDown} value={monthIncome} delta="+12,4% vs abril" deltaKind="up" tone="income"/>
        <KPI label="Despesas (mai.)"   icon={Icons.arrowUp}   value={monthExpense} delta="−4,7% vs abril" deltaKind="up" tone="expense"/>
        <KPI label="Saldo do mês"      icon={Icons.chart}     value={balanceDelta} delta="Receitas − Despesas" deltaKind="neutral" signed/>
      </div>

      {/* Main row: bars + upcoming */}
      <div className="grid mb-6" style={{ gridTemplateColumns: "1.65fr 1fr" }}>
        <BarChartCard/>
        <UpcomingCard/>
      </div>

      {/* Bottom row: cards + recent */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        <OpenInvoicesCard/>
        <RecentTxCard/>
      </div>
    </div>
  );
}

function KPI({ label, icon: I, value, delta, deltaKind, tone, signed }) {
  const cents = String(Math.abs(value).toFixed(2)).split(".")[1];
  const intPart = Math.floor(Math.abs(value)).toLocaleString("pt-BR").replace(/,/g, ".");
  const showSign = signed ? (value >= 0 ? "+" : "−") : (value < 0 ? "−" : "");
  const color = tone === "income" ? "var(--income)" : tone === "expense" ? "var(--expense)" : "var(--text)";
  return (
    <div className="kpi">
      <div className="label"><I size={13}/> {label}</div>
      <div className="value" style={{ color }}>
        <span style={{ color: "var(--text-dim)", fontSize: "0.65em", marginRight: 4 }}>R$</span>
        {showSign}{intPart}<span className="cents">,{cents}</span>
      </div>
      <div className={`delta ${deltaKind || ""}`}>
        {deltaKind === "up" && <Icons.arrowUp size={11} stroke={2.2}/>}
        {deltaKind === "down" && <Icons.arrowDown size={11} stroke={2.2}/>}
        {delta}
      </div>
    </div>
  );
}

function BarChartCard() {
  // Layout
  const W = 620, H = 280, PAD_L = 44, PAD_R = 12, PAD_T = 20, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R, chartH = H - PAD_T - PAD_B;
  const max = Math.max(...SERIES.flatMap(d => [d.income, d.expense])) * 1.12;
  const groupW = chartW / SERIES.length;
  const barW = (groupW * 0.30);
  const gap = 4;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(p => max * p);

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Receitas vs Despesas</h3>
          <div className="sub">Últimos 6 meses · R$ mil</div>
        </div>
        <div className="right">
          <span className="legend"><span className="sw" style={{ background: "var(--income)" }}/>Receitas</span>
          <span className="legend"><span className="sw" style={{ background: "var(--expense)" }}/>Despesas</span>
          <Button size="sm" variant="ghost" icon={<Icons.more size={14}/>}/>
        </div>
      </div>
      <div className="card-b" style={{ padding: 12 }}>
        <svg className="bar-chart" viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
          {/* gridlines */}
          {gridYs.map((v, i) => {
            const y = PAD_T + chartH - (v / max) * chartH;
            return (
              <g key={i}>
                <line className="gridline" x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}/>
                <text className="axis" x={PAD_L - 8} y={y + 3} textAnchor="end">{Math.round(v/1000)}k</text>
              </g>
            );
          })}
          {/* bars */}
          {SERIES.map((d, i) => {
            const x0 = PAD_L + i * groupW + groupW/2;
            const incH = (d.income / max) * chartH;
            const expH = (d.expense / max) * chartH;
            const ix = x0 - barW - gap/2;
            const ex = x0 + gap/2;
            const iy = PAD_T + chartH - incH;
            const ey = PAD_T + chartH - expH;
            const isCurrent = i === SERIES.length - 1;
            return (
              <g key={i}>
                <rect className="bar-income"  x={ix} y={iy} width={barW} height={incH} rx="3" opacity={isCurrent ? 1 : 0.85}/>
                <rect className="bar-expense" x={ex} y={ey} width={barW} height={expH} rx="3" opacity={isCurrent ? 1 : 0.85}/>
                <text className="axis" x={x0} y={H - 10} textAnchor="middle" style={{ fontWeight: isCurrent ? 600 : 400, fill: isCurrent ? "var(--text)" : "var(--text-faint)" }}>{d.m}</text>
                {isCurrent && (
                  <g>
                    <rect x={x0 - 46} y={iy - 34} width="92" height="26" rx="6" fill="var(--surface-3)" stroke="var(--border-strong)"/>
                    <text x={x0} y={iy - 16} textAnchor="middle" fontSize="11" fill="var(--text)" fontFamily="var(--font-mono)" style={{ fontVariantNumeric: "tabular-nums" }}>+R$ 7.195</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function UpcomingCard() {
  const items = UPCOMING.slice(0, 5);
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Próximas contas</h3>
          <div className="sub">{items.length} pendentes nos próximos 14 dias</div>
        </div>
        <div className="right">
          <Button size="sm" variant="ghost">Ver todas</Button>
        </div>
      </div>
      <div className="card-b flush">
        {items.map(t => {
          const c = cat(t.categoryId);
          const a = acc(t.accountId);
          const IconCmp = c ? Icons[c.icon] : Icons[a.icon];
          const due = t.due || t.competence;
          const days = daysUntil(due);
          return (
            <div className="list-row" key={t.id}>
              <IconBubble color={c?.color || a.color} icon={IconCmp}/>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                <div className="meta">{a.name} · vence {fmtDateShort(due)} {days <= 3 && <span style={{ color: "var(--pending)" }}>· em {days}d</span>}</div>
              </div>
              <div className="right">
                <div className="amount" style={{ color: t.amount < 0 ? "var(--expense)" : "var(--income)" }}>
                  <Money value={t.amount} signed/>
                </div>
                <Badge kind="pending" style={{ marginTop: 4 }}>Pendente</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpenInvoicesCard() {
  const open = CARDS.filter(c => c.invoice.status === "OPEN");
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Faturas em aberto</h3>
          <div className="sub">{open.length} cartões com fatura aberta</div>
        </div>
        <div className="right">
          <Button size="sm" variant="ghost">Ver cartões</Button>
        </div>
      </div>
      <div className="card-b" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {open.map(c => {
          const pct = Math.min(100, (c.invoice.totalAmount / c.creditLimit) * 100);
          const days = daysUntil(c.invoice.dueDate);
          return (
            <div key={c.id} style={{
              padding: 14,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${c.color}26, transparent 60%), var(--surface-2)`,
              border: "1px solid var(--border)",
            }}>
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <div className="row gap-2">
                  <IconBubble color={c.color} icon={Icons.card}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                    <div className="text-xs text-dim mono">•••• {c.lastFour} · {c.brand}</div>
                  </div>
                </div>
                <Badge kind={days <= 3 ? "pending" : "info"}>Vence {fmtDateShort(c.invoice.dueDate)}</Badge>
              </div>
              <div className="num text-2xl mt-2" style={{ fontWeight: 500 }}>
                <Money value={c.invoice.totalAmount}/>
              </div>
              <div className="bar mt-2">
                <i style={{ width: pct + "%", background: c.color }}/>
              </div>
              <div className="row between text-xs text-dim mt-2">
                <span>{pct.toFixed(0)}% do limite</span>
                <span className="mono">Limite <Money value={c.creditLimit}/></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentTxCard() {
  const recent = [...TX].sort((a,b) => b.competence.localeCompare(a.competence)).slice(0, 7);
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Transações recentes</h3>
          <div className="sub">Últimas atualizações</div>
        </div>
        <div className="right">
          <Button size="sm" variant="ghost" trailing={<Icons.chevR size={12} stroke={2}/>}>Ver todas</Button>
        </div>
      </div>
      <div className="card-b flush">
        <table className="tbl">
          <tbody>
            {recent.map(t => {
              const c = cat(t.categoryId);
              const a = acc(t.accountId);
              const IconCmp = c ? Icons[c.icon] : (t.type === "TRANSFER" ? Icons.arrowLR : Icons[a.icon]);
              const color = c?.color || (t.type === "TRANSFER" ? "var(--info)" : a.color);
              return (
                <tr key={t.id}>
                  <td style={{ paddingLeft: 16, width: 44 }}>
                    <IconBubble color={color} icon={IconCmp} size="sm"/>
                  </td>
                  <td style={{ whiteSpace: "normal" }}>
                    <div style={{ fontWeight: 500 }}>{t.desc}</div>
                    <div className="row-meta">{c?.name || (t.type === "TRANSFER" ? "Transferência" : "—")} · {a.name}</div>
                  </td>
                  <td><StatusBadge status={t.status}/></td>
                  <td className="text-xs text-dim" style={{ width: 90 }}>{fmtDateShort(t.competence)}</td>
                  <td className="num" style={{ paddingRight: 16, color: t.amount > 0 ? "var(--income)" : "var(--text)", fontWeight: 500 }}>
                    <Money value={t.amount} signed/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// helper
function daysUntil(iso) {
  const today = new Date("2026-05-27");
  const t = new Date(iso);
  return Math.max(0, Math.ceil((t - today) / 86400000));
}

Object.assign(window, { Dashboard });
