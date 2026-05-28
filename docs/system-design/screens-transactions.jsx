/* global React, Icons, Money, Money$, Badge, StatusBadge, TypeBadge, IconBubble, Button, Field, Input, Select, Textarea, DateInput, PasswordInput, Modal, fmtDate, fmtDateShort, ACCOUNTS, CATS, TX, acc, cat */
// ============================================================
// Cash Control — Transactions + NewTransaction modal
// ============================================================
const { useState: useStateTx, useMemo: useMemoTx } = React;

function TransactionsScreen({ onNew }) {
  const [activeFilters, setActiveFilters] = useStateTx({
    type: null, status: null, accountId: null, includeCancelled: false,
  });

  // Group transactions by date
  const grouped = useMemoTx(() => {
    const sorted = [...TX].sort((a,b) => b.competence.localeCompare(a.competence));
    const groups = {};
    sorted.forEach(t => {
      const key = t.competence;
      (groups[key] = groups[key] || []).push(t);
    });
    return Object.entries(groups);
  }, []);

  // Summary
  const sum = useMemoTx(() => {
    const income  = TX.filter(t => t.type === "INCOME"  && t.status === "PAID").reduce((a,b) => a + b.amount, 0);
    const expense = TX.filter(t => t.type === "EXPENSE" && t.status === "PAID").reduce((a,b) => a + Math.abs(b.amount), 0);
    return { income, expense, net: income - expense, count: TX.length };
  }, []);

  return (
    <div data-screen-label="03 Transações">
      <div className="page-h">
        <div>
          <h1 className="title">Transações</h1>
          <div className="desc">{sum.count} transações · maio 2026</div>
        </div>
        <div className="spacer"/>
        <div className="actions">
          <Button leading={<Icons.download size={14}/>}>Exportar</Button>
          <Button leading={<Icons.upload size={14}/>}>Importar</Button>
          <Button variant="primary" leading={<Icons.plus size={14}/>} onClick={onNew}>Nova transação</Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-3 mb-4">
        <SummaryStrip kind="income"  label="Receitas (período)" value={sum.income}  meta="3 transações"/>
        <SummaryStrip kind="expense" label="Despesas (período)" value={sum.expense} meta="10 transações"/>
        <SummaryStrip kind="net"     label="Resultado líquido"  value={sum.net}     meta="+R$ 1.842 vs abril"/>
      </div>

      {/* Filter bar */}
      <div className="filterbar">
        <div className="search">
          <Icons.search size={13}/>
          <input placeholder="Buscar por descrição, valor ou categoria…"/>
          <kbd style={{ fontSize: 10, padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 3, color: "var(--text-faint)", background: "var(--surface-1)" }}>⌘K</kbd>
        </div>

        <FilterChip label="Conta" value="Nubank" onClear={() => {}}/>
        <FilterChip label="Tipo" value="Despesa" onClear={() => {}}/>
        <FilterChip label="Período" value="Mai 2026"/>
        <FilterChip label="Status" placeholder/>
        <FilterChip label="Categoria" placeholder/>
        <FilterChip label="Valor" placeholder/>

        <div style={{ flex: 1, minWidth: 12 }}/>

        <label className="row gap-2 text-xs text-muted" style={{ padding: "0 8px" }}>
          <input type="checkbox" className="checkbox"/> Incluir cancelados
        </label>
        <Button size="sm" variant="ghost" leading={<Icons.filter size={12}/>}>Mais filtros</Button>
      </div>

      {/* Table */}
      <div className="card flush">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 16, width: 32 }}>
                <input type="checkbox" className="checkbox"/>
              </th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Competência</th>
              <th>Pagamento</th>
              <th className="num">Valor</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([date, rows]) => (
              <React.Fragment key={date}>
                <tr style={{ background: "var(--surface-2)" }}>
                  <td colSpan={10} style={{ padding: "8px 16px", color: "var(--text-dim)", fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ marginRight: 12 }}>{fmtDate(date)}</span>
                    <span className="mono" style={{ color: "var(--income)" }}>
                      <Money value={rows.filter(t => t.amount > 0).reduce((a,b) => a + b.amount, 0)} signed/>
                    </span>
                    <span style={{ margin: "0 8px", color: "var(--text-faint)" }}>·</span>
                    <span className="mono" style={{ color: "var(--expense)" }}>
                      <Money value={rows.filter(t => t.amount < 0).reduce((a,b) => a + b.amount, 0)} signed/>
                    </span>
                  </td>
                </tr>
                {rows.map(t => <TxRow key={t.id} t={t}/>)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="row between mt-4">
        <div className="text-xs text-dim">Mostrando 1–{TX.length} de 287 transações</div>
        <div className="row gap-2">
          <Button size="sm" variant="ghost" icon={<Icons.chevL size={14}/>}/>
          <Button size="sm">1</Button>
          <Button size="sm" variant="ghost">2</Button>
          <Button size="sm" variant="ghost">3</Button>
          <span className="text-xs text-dim">…</span>
          <Button size="sm" variant="ghost">15</Button>
          <Button size="sm" variant="ghost" icon={<Icons.chevR size={14}/>}/>
        </div>
      </div>
    </div>
  );
}

function SummaryStrip({ kind, label, value, meta }) {
  const color = kind === "income" ? "var(--income)" : kind === "expense" ? "var(--expense)" : "var(--text)";
  const I = kind === "income" ? Icons.arrowDown : kind === "expense" ? Icons.arrowUp : Icons.chart;
  return (
    <div className="kpi">
      <div className="label" style={{ color: color }}><I size={13}/> {label}</div>
      <div className="value" style={{ color, fontSize: 22 }}>
        <Money value={value} signed={kind === "net"}/>
      </div>
      <div className="delta">{meta}</div>
    </div>
  );
}

function FilterChip({ label, value, placeholder, onClear }) {
  if (placeholder) {
    return (
      <span className="chip">
        <Icons.plus size={12} stroke={2}/>
        {label}
      </span>
    );
  }
  return (
    <span className="chip on">
      <span style={{ color: "var(--text-dim)" }}>{label}:</span>
      <span>{value}</span>
      <button onClick={onClear} className="close" style={{ background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }}>
        <Icons.x size={11} stroke={2.4}/>
      </button>
    </span>
  );
}

function TxRow({ t }) {
  const c = cat(t.categoryId);
  const a = acc(t.accountId);
  const IconCmp = c ? Icons[c.icon] : (t.type === "TRANSFER" ? Icons.arrowLR : Icons[a.icon]);
  const color = c?.color || (t.type === "TRANSFER" ? "var(--info)" : a.color);
  return (
    <tr>
      <td style={{ paddingLeft: 16 }}>
        <input type="checkbox" className="checkbox"/>
      </td>
      <td style={{ whiteSpace: "normal", minWidth: 260 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconBubble color={color} icon={IconCmp} size="sm"/>
          <div style={{ fontWeight: 500 }}>{t.desc}</div>
        </div>
      </td>
      <td>
        {c ? (
          <span className="row gap-2" style={{ fontSize: 12.5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block" }}/>
            {c.name}
          </span>
        ) : <span className="text-dim">—</span>}
      </td>
      <td>
        <span className="row gap-2" style={{ fontSize: 12.5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: a.color, display: "inline-block" }}/>
          {a.name}
        </span>
      </td>
      <td><TypeBadge type={t.type}/></td>
      <td><StatusBadge status={t.status}/></td>
      <td className="text-xs text-dim">{fmtDate(t.competence)}</td>
      <td className="text-xs text-dim">{t.payment ? fmtDate(t.payment) : "—"}</td>
      <td className="num" style={{ paddingRight: 8, color: t.amount > 0 ? "var(--income)" : "var(--text)", fontWeight: 500 }}>
        <Money value={t.amount} signed/>
      </td>
      <td>
        <Button size="sm" variant="ghost" icon={<Icons.more size={14}/>}/>
      </td>
    </tr>
  );
}

// ============================================================
// New Transaction modal — exact API fields
// ============================================================
function NewTransactionModal({ onClose }) {
  const [type, setType] = useStateTx("EXPENSE");
  const [status, setStatus] = useStateTx("PAID");
  const [showCatDrop, setShowCatDrop] = useStateTx(false);
  const isTransfer = type === "TRANSFER";

  return (
    <Modal
      title="Nova transação"
      subtitle="Registre uma receita, despesa, transferência ou ajuste"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <div className="spacer"/>
          <label className="row gap-2 text-xs text-muted">
            <input type="checkbox" className="checkbox"/> Criar outra após salvar
          </label>
          <Button onClick={onClose}>Salvar como rascunho</Button>
          <Button variant="primary" onClick={onClose}>Salvar transação</Button>
        </>
      }
    >
      {/* Type selector */}
      <div className="lbl mb-4" style={{ marginBottom: 8 }}>Tipo<span className="req">*</span></div>
      <div className="row gap-2 mb-6" style={{ flexWrap: "wrap" }}>
        {[
          { id: "INCOME",     label: "Receita",       icon: Icons.arrowDown, color: "var(--income)" },
          { id: "EXPENSE",    label: "Despesa",       icon: Icons.arrowUp,   color: "var(--expense)" },
          { id: "TRANSFER",   label: "Transferência", icon: Icons.arrowLR,   color: "var(--info)" },
          { id: "REFUND",     label: "Reembolso",     icon: Icons.repeat,    color: "var(--info)" },
          { id: "ADJUSTMENT", label: "Ajuste",        icon: Icons.cog,       color: "var(--text-muted)" },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setType(o.id)}
            className="row gap-2"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${type === o.id ? o.color : "var(--border)"}`,
              background: type === o.id ? `color-mix(in oklab, ${o.color} 14%, transparent)` : "var(--surface-2)",
              color: type === o.id ? o.color : "var(--text-muted)",
              fontWeight: 500,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            <o.icon size={13} stroke={2}/>
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-2" style={{ gap: 14 }}>
        <Field label="Descrição" required span={2}>
          <Input placeholder="Ex: Supermercado, salário, aluguel…" defaultValue=""/>
        </Field>

        <Field label="Valor" required>
          <Money$ value="0,00"/>
        </Field>

        <Field label="Status" required>
          <div className="row gap-2">
            {[
              { id: "PENDING", label: "Pendente", color: "var(--pending)" },
              { id: "PAID",    label: "Pago",     color: "var(--paid)" },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                style={{
                  flex: 1, height: 36,
                  borderRadius: 6,
                  border: `1px solid ${status === s.id ? s.color : "var(--border)"}`,
                  background: status === s.id ? `color-mix(in oklab, ${s.color} 14%, transparent)` : "var(--surface-1)",
                  color: status === s.id ? s.color : "var(--text-muted)",
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        {!isTransfer && (
          <Field label="Conta" required span={2}>
            <AccountSelect/>
          </Field>
        )}
        {isTransfer && (
          <>
            <Field label="De" required>
              <AccountSelect defaultId="a1"/>
            </Field>
            <Field label="Para" required>
              <AccountSelect defaultId="a3"/>
            </Field>
          </>
        )}

        <Field label="Categoria" hint="Sugerimos automaticamente pela descrição" span={2}>
          <CategorySelect onOpen={() => setShowCatDrop(s => !s)} open={showCatDrop}/>
        </Field>

        <Field label="Data de competência" required>
          <DateInput value="27/05/2026"/>
        </Field>

        <Field label="Data de pagamento" hint="Opcional para PENDENTE">
          <DateInput value={status === "PAID" ? "27/05/2026" : ""}/>
        </Field>

        <Field label="Anexos" hint="Comprovantes, notas fiscais (PDF, JPG, PNG)" span={2}>
          <div style={{
            border: "1.5px dashed var(--border-strong)",
            borderRadius: 8,
            padding: 18,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}>
            <div className="icon-bubble" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
              <Icons.upload size={16}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Arraste arquivos aqui ou clique para enviar</div>
              <div className="text-xs text-dim">Múltiplos arquivos · até 10 MB cada</div>
            </div>
            <Button size="sm">Selecionar</Button>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function AccountSelect({ defaultId = "a1" }) {
  const a = acc(defaultId);
  const IconCmp = Icons[a.icon];
  return (
    <div className="input" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", height: 36 }}>
      <IconBubble color={a.color} icon={IconCmp} size="sm"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
      </div>
      <span className="mono text-xs text-dim"><Money value={a.balance}/></span>
      <Icons.chevD size={14} className="text-dim"/>
    </div>
  );
}

function CategorySelect({ open, onOpen }) {
  return (
    <div style={{ position: "relative" }}>
      <div className="input" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", height: 36 }} onClick={onOpen}>
        <Icons.search size={13} className="text-dim"/>
        <input
          style={{ flex: 1, background: "transparent", border: 0, color: "var(--text)", outline: "none", fontSize: 13 }}
          placeholder="Buscar categoria…"
          defaultValue="Mercado"
        />
        <Badge kind="info" dot={false} square style={{ fontSize: 10 }}>auto</Badge>
        <Icons.chevD size={14} className="text-dim"/>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          marginTop: 4,
          background: "var(--surface-1)",
          border: "1px solid var(--border-strong)",
          borderRadius: 8,
          boxShadow: "var(--shadow-pop)",
          maxHeight: 280, overflowY: "auto",
          zIndex: 10,
          padding: 4,
        }}>
          <div className="nav-section" style={{ padding: "8px 12px 4px" }}>Sugerida</div>
          <CategoryOption c={CATS.find(c => c.id === "c11")} suggested/>
          <div className="nav-section" style={{ padding: "8px 12px 4px" }}>Despesas</div>
          {CATS.filter(c => c.type === "EXPENSE" && !c.parent).map(c => (
            <React.Fragment key={c.id}>
              <CategoryOption c={c}/>
              {CATS.filter(s => s.parent === c.id).map(s => <CategoryOption key={s.id} c={s} indent/>)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryOption({ c, indent, suggested }) {
  const IconCmp = Icons[c.icon];
  return (
    <div className="row gap-2" style={{
      padding: "6px 10px",
      paddingLeft: indent ? 28 : 10,
      cursor: "pointer",
      borderRadius: 5,
      fontSize: 13,
    }}
      onMouseDown={e => e.preventDefault()}
      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <IconBubble color={c.color} icon={IconCmp} size="sm"/>
      <span style={{ flex: 1 }}>{c.name}</span>
      {suggested && <Badge kind="info" dot={false} square style={{ fontSize: 10 }}>match</Badge>}
    </div>
  );
}

Object.assign(window, { TransactionsScreen, NewTransactionModal });
