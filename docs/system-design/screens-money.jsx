/* global React, Icons, Money, Money$, Badge, StatusBadge, TypeBadge, IconBubble, Button, Field, Input, Select, Textarea, DateInput, Modal, fmtDate, fmtDateShort, ACCOUNTS, CATS, CARDS, CARD_CHARGES, TX, acc, cat, monthIncome, monthExpense, totalBalance */
// ============================================================
// Cash Control — Accounts + Cards screens
// ============================================================
const { useState: useStateAc } = React;

// ----------------------------------------------------------------
// ACCOUNTS
// ----------------------------------------------------------------
function AccountsScreen() {
  const totalByType = ACCOUNTS.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.balance;
    return acc;
  }, {});
  const typeLabel = { CHECKING: "Conta corrente", SAVINGS: "Poupança", CASH: "Carteira", INVESTMENT: "Investimento", CREDIT: "Crédito", OTHER: "Outros" };

  return (
    <div data-screen-label="05 Contas">
      <div className="page-h">
        <div>
          <h1 className="title">Contas</h1>
          <div className="desc">{ACCOUNTS.length} contas · saldo total <span className="mono fw-500" style={{ color: "var(--text)" }}><Money value={totalBalance}/></span></div>
        </div>
        <div className="spacer"/>
        <div className="actions">
          <Button leading={<Icons.arrowLR size={14}/>}>Transferir</Button>
          <Button variant="primary" leading={<Icons.plus size={14}/>}>Nova conta</Button>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-3 mb-6">
        {ACCOUNTS.map(a => <AccountCard key={a.id} a={a}/>)}
        <NewAccountCard/>
      </div>

      {/* Distribution + recent transfers */}
      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Distribuição por tipo</h3>
              <div className="sub">Como seu patrimônio está alocado</div>
            </div>
          </div>
          <div className="card-b" style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <DonutChart segments={ACCOUNTS.map(a => ({ value: a.balance, color: a.color, label: a.name }))} total={totalBalance}/>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(totalByType).map(([t, v]) => {
                const pct = (v / totalBalance) * 100;
                const sample = ACCOUNTS.find(a => a.type === t);
                return (
                  <div key={t} className="row gap-3" style={{ alignItems: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: sample.color, display: "inline-block" }}/>
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{typeLabel[t]}</span>
                    <span className="mono text-sm text-dim">{pct.toFixed(1)}%</span>
                    <span className="mono text-sm fw-500" style={{ minWidth: 110, textAlign: "right" }}><Money value={v}/></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Transferências recentes</h3>
              <div className="sub">Entre suas contas</div>
            </div>
          </div>
          <div className="card-b flush">
            {TX.filter(t => t.type === "TRANSFER").slice(0, 4).concat([
              { id: "tr1", desc: "Itaú → Inter Poupança", amount: -500, fromAccountId: "a2", toAccountId: "a3", competence: "2026-05-04" },
              { id: "tr2", desc: "Nubank → XP Investimentos", amount: -1500, fromAccountId: "a1", toAccountId: "a5", competence: "2026-04-28" },
            ]).slice(0, 4).map(t => (
              <div key={t.id} className="list-row">
                <IconBubble color="var(--info)" icon={Icons.arrowLR}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title">{t.desc}</div>
                  <div className="meta">{fmtDate(t.competence)}</div>
                </div>
                <div className="amount mono"><Money value={Math.abs(t.amount)}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ a }) {
  const IconCmp = Icons[a.icon];
  const monthlyChange = ((a.id.charCodeAt(1) % 5) - 2) * 0.018; // -3.6% .. +5.4% mock
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      {/* color glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(120% 100% at 0% 0%, ${a.color}22, transparent 50%)`,
        pointerEvents: "none",
      }}/>
      <div className="card-b" style={{ position: "relative" }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <IconBubble color={a.color} icon={IconCmp} size="lg"/>
          <Button size="sm" variant="ghost" icon={<Icons.more size={14}/>}/>
        </div>
        <div className="text-xs text-dim fw-500" style={{ marginBottom: 2 }}>{a.name}</div>
        <div className="row gap-2" style={{ marginBottom: 10 }}>
          <Badge kind="muted" square dot={false} style={{ fontSize: 10 }}>{a.type}</Badge>
          <span className="text-xs text-faint">{a.currency}</span>
        </div>
        <div className="text-xl mono fw-500"><Money value={a.balance}/></div>
        <div className="row gap-2 mt-2 text-xs text-dim" style={{ alignItems: "center" }}>
          <span className="row gap-1" style={{ color: monthlyChange >= 0 ? "var(--income)" : "var(--expense)" }}>
            {monthlyChange >= 0 ? <Icons.arrowUp size={10} stroke={2.4}/> : <Icons.arrowDown size={10} stroke={2.4}/>}
            {(monthlyChange * 100).toFixed(1).replace(".", ",")}%
          </span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span>Atualizado {a.last}</span>
        </div>
      </div>
    </div>
  );
}

function NewAccountCard() {
  return (
    <div className="card" style={{
      borderStyle: "dashed",
      background: "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: 184,
      cursor: "pointer",
    }}>
      <div className="col" style={{ alignItems: "center", gap: 6 }}>
        <div className="icon-bubble lg" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
          <Icons.plus size={18}/>
        </div>
        <div className="text-sm fw-500">Adicionar conta</div>
        <div className="text-xs text-dim" style={{ maxWidth: 180, textAlign: "center" }}>Corrente, poupança, carteira ou investimento</div>
      </div>
    </div>
  );
}

function DonutChart({ segments, total, size = 160 }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 10;
  const inner = r - 22;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={size/2 - inner}/>
      {segments.map((s, i) => {
        const len = (s.value / total) * C;
        const c = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={size/2 - inner}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return c;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="var(--text-dim)" fontFamily="var(--font-mono)">PATRIMÔNIO</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="16" fill="var(--text)" fontFamily="var(--font-mono)" fontWeight="500" style={{ fontVariantNumeric: "tabular-nums" }}>
        R$ {(total / 1000).toFixed(1).replace(".", ",")}k
      </text>
    </svg>
  );
}

// ----------------------------------------------------------------
// CARDS + invoice
// ----------------------------------------------------------------
function CardsScreen() {
  const [selectedId, setSelectedId] = useStateAc("card1");
  const [showPay, setShowPay] = useStateAc(false);
  const selected = CARDS.find(c => c.id === selectedId);

  const totalLimit = CARDS.reduce((a,b) => a + b.creditLimit, 0);
  const totalOpen  = CARDS.reduce((a,b) => a + b.invoice.remainingAmount, 0);

  return (
    <div data-screen-label="06 Cartões">
      <div className="page-h">
        <div>
          <h1 className="title">Cartões de crédito</h1>
          <div className="desc">{CARDS.length} cartões · <span className="mono fw-500" style={{ color: "var(--text)" }}><Money value={totalOpen}/></span> em faturas abertas</div>
        </div>
        <div className="spacer"/>
        <div className="actions">
          <Button leading={<Icons.plus size={14}/>}>Novo lançamento</Button>
          <Button variant="primary" leading={<Icons.plus size={14}/>}>Novo cartão</Button>
        </div>
      </div>

      {/* Top: card visuals row */}
      <div className="row gap-4 mb-6" style={{ overflowX: "auto", paddingBottom: 4 }}>
        {CARDS.map(c => (
          <CreditCardVisual key={c.id} c={c} selected={c.id === selectedId} onSelect={() => setSelectedId(c.id)}/>
        ))}
        <AddCardVisual/>
      </div>

      {/* Invoice detail */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 360px" }}>
        <InvoiceCard c={selected} onPay={() => setShowPay(true)}/>
        <CardSidebar c={selected}/>
      </div>

      {showPay && <PayInvoiceModal c={selected} onClose={() => setShowPay(false)}/>}
    </div>
  );
}

function CreditCardVisual({ c, selected, onSelect }) {
  const usedPct = (c.invoice.totalAmount / c.creditLimit) * 100;
  return (
    <button
      onClick={onSelect}
      style={{
        flexShrink: 0,
        width: 280,
        height: 170,
        borderRadius: 14,
        padding: 18,
        border: `1px solid ${selected ? c.color : "var(--border)"}`,
        background: `
          radial-gradient(140% 80% at 0% 0%, ${c.color}55, transparent 55%),
          linear-gradient(135deg, ${c.color}22, transparent 70%),
          var(--surface-2)
        `,
        position: "relative",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: selected ? `0 0 0 2px ${c.color}, 0 12px 32px -8px ${c.color}44` : "none",
        color: "var(--text)",
        transition: "box-shadow 120ms, border-color 120ms",
      }}
    >
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="text-xs text-dim">{c.brand}</div>
          <div className="fw-600" style={{ fontSize: 14, marginTop: 2 }}>{c.name}</div>
        </div>
        <div style={{
          width: 32, height: 22,
          background: "linear-gradient(135deg, #d4af6a, #8b6a35)",
          borderRadius: 4,
          opacity: 0.7,
        }}/>
      </div>

      <div className="mono" style={{ marginTop: 24, fontSize: 18, letterSpacing: "0.08em", color: "var(--text)" }}>
        ••••  ••••  ••••  {c.lastFour}
      </div>

      <div className="row between" style={{ marginTop: 16 }}>
        <div>
          <div className="text-xs text-faint" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Fatura aberta</div>
          <div className="mono text-sm fw-500"><Money value={c.invoice.totalAmount}/></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="text-xs text-faint" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Limite</div>
          <div className="mono text-sm fw-500" style={{ color: "var(--text-muted)" }}>{usedPct.toFixed(0)}% usado</div>
        </div>
      </div>
    </button>
  );
}

function AddCardVisual() {
  return (
    <button style={{
      flexShrink: 0,
      width: 280, height: 170,
      borderRadius: 14,
      border: "1.5px dashed var(--border-strong)",
      background: "transparent",
      cursor: "pointer",
      display: "grid", placeItems: "center",
      color: "var(--text-muted)",
    }}>
      <div className="col" style={{ alignItems: "center", gap: 6 }}>
        <div className="icon-bubble lg" style={{ background: "var(--surface-2)" }}><Icons.plus size={18}/></div>
        <div className="text-sm fw-500">Adicionar cartão</div>
      </div>
    </button>
  );
}

function InvoiceCard({ c, onPay }) {
  const inv = c.invoice;
  const usedPct = (inv.totalAmount / c.creditLimit) * 100;
  const days = Math.max(0, Math.ceil((new Date(inv.dueDate) - new Date("2026-05-27")) / 86400000));
  const charges = CARD_CHARGES.filter(ch => ch.cardId === c.id);

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Fatura — {c.name}</h3>
          <div className="sub">Período {fmtDateShort(inv.closesAt)} · Fecha em {fmtDate(inv.closesAt)}</div>
        </div>
        <div className="right">
          <div className="tabs">
            <button className="on">Atual</button>
            <button>Abril</button>
            <button>Março</button>
            <button>+</button>
          </div>
        </div>
      </div>
      <div className="card-b">
        <div className="row gap-6" style={{ alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <div className="text-xs text-dim">Valor total</div>
            <div className="text-3xl mono fw-500" style={{ color: "var(--text)" }}>
              <Money value={inv.totalAmount}/>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="row between text-xs text-dim mb-2">
              <span>Pago: <span className="mono"><Money value={inv.paidAmount}/></span></span>
              <span>Restante: <span className="mono fw-500" style={{ color: inv.remainingAmount > 0 ? "var(--pending)" : "var(--paid)" }}><Money value={inv.remainingAmount}/></span></span>
            </div>
            <div className="bar"><i style={{ width: ((inv.paidAmount / inv.totalAmount) * 100 || 0) + "%", background: "var(--paid)" }}/></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Badge kind={days <= 3 ? "pending" : "info"}>Vence em {days} dias</Badge>
            <div className="text-xs text-dim mt-2">{fmtDate(inv.dueDate)}</div>
          </div>
          <Button variant="primary" onClick={onPay} leading={<Icons.check size={14}/>}>Pagar fatura</Button>
        </div>

        {/* Charges list */}
        <div className="row between mb-2 mt-4">
          <div className="text-sm fw-500">Lançamentos ({charges.length})</div>
          <div className="row gap-2">
            <span className="text-xs text-dim">Ordenar por</span>
            <Button size="sm" variant="ghost" trailing={<Icons.chevD size={12}/>}>Data</Button>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {charges.map(ch => {
            const c = cat(ch.categoryId);
            const IconCmp = c ? Icons[c.icon] : Icons.bag;
            return (
              <div className="list-row" key={ch.id} style={{ padding: "10px 0", borderColor: "var(--border)" }}>
                <IconBubble color={c?.color || "var(--text-muted)"} icon={IconCmp} size="sm"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title">{ch.description}</div>
                  <div className="meta">{c?.name || "—"} · {fmtDate(ch.date)}</div>
                </div>
                <div className="amount mono"><Money value={ch.amount}/></div>
                <Button size="sm" variant="ghost" icon={<Icons.more size={14}/>}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CardSidebar({ c }) {
  const usedPct = (c.invoice.totalAmount / c.creditLimit) * 100;
  return (
    <div className="col gap-4">
      <div className="card">
        <div className="card-b">
          <div className="text-xs text-dim mb-2">Uso do limite</div>
          <div className="row gap-2" style={{ alignItems: "baseline" }}>
            <div className="text-2xl mono fw-500">{usedPct.toFixed(0)}%</div>
            <div className="text-xs text-dim mono">de <Money value={c.creditLimit}/></div>
          </div>
          <div className="bar mt-3"><i style={{ width: usedPct + "%", background: c.color }}/></div>
          <div className="row between text-xs text-dim mt-2">
            <span>Disponível</span>
            <span className="mono fw-500" style={{ color: "var(--text)" }}><Money value={c.creditLimit - c.invoice.totalAmount}/></span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3>Por categoria</h3></div>
        <div className="card-b">
          {Object.entries(CARD_CHARGES.filter(ch => ch.cardId === c.id).reduce((acc, ch) => {
            const cc = cat(ch.categoryId);
            const key = cc?.name || "Outros";
            acc[key] = (acc[key] || { value: 0, color: cc?.color || "#71717a" });
            acc[key].value += ch.amount;
            return acc;
          }, {})).sort((a,b) => b[1].value - a[1].value).map(([name, d]) => {
            const pct = (d.value / c.invoice.totalAmount) * 100;
            return (
              <div key={name} className="mb-4">
                <div className="row between text-xs mb-2">
                  <span className="row gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }}/>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                  </span>
                  <span className="mono"><Money value={d.value}/></span>
                </div>
                <div className="bar"><i style={{ width: pct + "%", background: d.color }}/></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3>Detalhes do cartão</h3></div>
        <div className="card-b col gap-3">
          <Row k="Bandeira" v={c.brand}/>
          <Row k="Final" v={"•••• " + c.lastFour} mono/>
          <Row k="Fechamento" v={`Dia ${c.billingCycleDay}`}/>
          <Row k="Vencimento" v={`Dia ${c.dueDay}`}/>
          <Row k="Limite total" v={<Money value={c.creditLimit}/>} mono/>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="row between">
      <span className="text-xs text-dim">{k}</span>
      <span className={`text-sm fw-500 ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}

function PayInvoiceModal({ c, onClose }) {
  const inv = c.invoice;
  const [amount, setAmount] = useStateAc(inv.remainingAmount.toFixed(2).replace(".", ","));
  return (
    <Modal
      title={`Pagar fatura · ${c.name}`}
      subtitle={`Vence em ${fmtDate(inv.dueDate)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <div className="spacer"/>
          <Button variant="primary" onClick={onClose}>Confirmar pagamento</Button>
        </>
      }
    >
      <div className="grid grid-3 mb-6">
        <Mini label="Total da fatura" value={inv.totalAmount} tone=""/>
        <Mini label="Já pago" value={inv.paidAmount} tone="muted"/>
        <Mini label="Restante" value={inv.remainingAmount} tone="pending"/>
      </div>

      <Field label="Valor a pagar" required hint="Pagamento parcial ou total">
        <Money$ value={amount}/>
      </Field>

      <div className="row gap-2 mt-4">
        <Button size="sm" onClick={() => setAmount(inv.remainingAmount.toFixed(2).replace(".", ","))}>Pagar tudo</Button>
        <Button size="sm" onClick={() => setAmount((inv.remainingAmount/2).toFixed(2).replace(".", ","))}>50%</Button>
        <Button size="sm">Mínimo (15%)</Button>
      </div>

      <Field label="Conta de origem" required>
        <AccountSelectMini defaultId="a1"/>
      </Field>
      <Field label="Data do pagamento" required>
        <DateInput value="27/05/2026"/>
      </Field>
    </Modal>
  );
}

function Mini({ label, value, tone }) {
  const color = tone === "pending" ? "var(--pending)" : tone === "muted" ? "var(--text-muted)" : "var(--text)";
  return (
    <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
      <div className="text-xs text-dim">{label}</div>
      <div className="text-lg mono fw-500 mt-2" style={{ color }}><Money value={value}/></div>
    </div>
  );
}

function AccountSelectMini({ defaultId }) {
  const a = acc(defaultId);
  const IconCmp = Icons[a.icon];
  return (
    <div className="input" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", height: 36 }}>
      <IconBubble color={a.color} icon={IconCmp} size="sm"/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
      </div>
      <span className="mono text-xs text-dim"><Money value={a.balance}/></span>
      <Icons.chevD size={14} className="text-dim"/>
    </div>
  );
}

Object.assign(window, { AccountsScreen, CardsScreen });
