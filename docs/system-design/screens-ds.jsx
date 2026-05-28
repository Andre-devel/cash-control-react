/* global React, Icons, Money, Badge, StatusBadge, TypeBadge, IconBubble, Button, Field, Input, PasswordInput, Select, Textarea, DateInput, Toggle */
// ============================================================
// Cash Control — Design System reference page
// ============================================================
const { useState: useStateDS } = React;

function DesignSystemScreen() {
  const colors = {
    "Marca / Accent": [
      { n: "--accent",       v: "#ff6b35" },
      { n: "--accent-hover", v: "#ff8559" },
      { n: "--accent-press", v: "#e85a26" },
      { n: "--accent-soft",  v: "rgba(255,107,53,0.12)" },
    ],
    "Superfícies (dark)": [
      { n: "--bg",         v: "#0a0a0b" },
      { n: "--surface-1",  v: "#101012" },
      { n: "--surface-2",  v: "#16161a" },
      { n: "--surface-3",  v: "#1d1d22" },
      { n: "--border",     v: "#232328" },
      { n: "--border-strong", v: "#2e2e36" },
    ],
    "Texto": [
      { n: "--text",       v: "#f4f4f5" },
      { n: "--text-muted", v: "#a1a1aa" },
      { n: "--text-dim",   v: "#71717a" },
      { n: "--text-faint", v: "#52525b" },
    ],
    "Status": [
      { n: "--paid",      v: "#34d399" },
      { n: "--pending",   v: "#fbbf24" },
      { n: "--cancelled", v: "#71717a" },
    ],
    "Tipos de transação": [
      { n: "--income",  v: "#34d399" },
      { n: "--expense", v: "#fb7185" },
      { n: "--info",    v: "#60a5fa" },
    ],
    "Categorias (chart palette)": [
      { n: "--cat-1", v: "#ff6b35" },
      { n: "--cat-2", v: "#60a5fa" },
      { n: "--cat-3", v: "#34d399" },
      { n: "--cat-4", v: "#c084fc" },
      { n: "--cat-5", v: "#fbbf24" },
      { n: "--cat-6", v: "#fb7185" },
      { n: "--cat-7", v: "#22d3ee" },
      { n: "--cat-8", v: "#a78bfa" },
    ],
  };

  return (
    <div data-screen-label="07 Design System">
      <div className="page-h">
        <div>
          <h1 className="title">Design System</h1>
          <div className="desc">Tokens, componentes e padrões visuais do Cash Control</div>
        </div>
        <div className="spacer"/>
        <div className="actions">
          <Badge kind="info" dot={false} square>v 1.0</Badge>
          <Button leading={<Icons.download size={14}/>}>Exportar tokens</Button>
        </div>
      </div>

      {/* Visão geral / princípios */}
      <div className="grid grid-3 mb-6">
        <Principle title="Precisão" body="Tabular nums em todo valor monetário. Hierarquia clara, contraste calibrado, sem ruído visual." num="01"/>
        <Principle title="Densidade controlada" body="Informação financeira é densa por natureza — densidade calibrada por viewport, nunca apertada." num="02"/>
        <Principle title="Status sempre legível" body="Cores semânticas consistentes: Pago / Pendente / Cancelado. Receita verde, despesa rosa, neutro azul." num="03"/>
      </div>

      {/* Cores */}
      <Section title="Paleta" desc="Todas as cores são variáveis CSS — trocar tema = trocar tokens.">
        <div className="col gap-6">
          {Object.entries(colors).map(([group, items]) => (
            <div key={group}>
              <div className="lbl mb-2">{group}</div>
              <div className="ds-grid">
                {items.map(s => (
                  <div key={s.n} className="swatch">
                    <div className="chip" style={{ background: `var(${s.n})` }}/>
                    <div className="meta">
                      <div className="n">{s.n}</div>
                      <div className="v">{s.v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Tipografia */}
      <Section title="Tipografia" desc="Geist Sans para UI e textos; Geist Mono para valores monetários (tabular-nums).">
        <div className="card"><div className="card-b">
          <TypeRow size="40px" weight={600} ls="-0.03em">Cash Control · Display</TypeRow>
          <TypeRow size="32px" weight={600} ls="-0.025em">Patrimônio total · 88.999,13</TypeRow>
          <TypeRow size="22px" weight={600} ls="-0.02em">Título de página · h1</TypeRow>
          <TypeRow size="15px" weight={600} ls="-0.01em">Título de card · h3</TypeRow>
          <TypeRow size="14px" weight={500}>Body padrão · transações recentes</TypeRow>
          <TypeRow size="13px" weight={400}>Body table — Pão de Açúcar, Itaú, 21/05</TypeRow>
          <TypeRow size="12px" weight={500} color="var(--text-muted)">Label / form label — Valor *</TypeRow>
          <TypeRow size="11px" weight={500} color="var(--text-dim)" ls="0.04em" upper>Coluna de tabela / overline</TypeRow>
          <TypeRow size="22px" weight={500} mono>R$ 9.800,00</TypeRow>
          <TypeRow size="13px" weight={500} mono>R$ 312,46 · 28/05/2026</TypeRow>
        </div></div>
      </Section>

      {/* Spacing & radius */}
      <Section title="Spacing & Radius" desc="Escala 4pt. Raio principal 6–10px.">
        <div className="grid grid-2 gap-6">
          <div className="card"><div className="card-b">
            <div className="lbl mb-4">Spacing scale</div>
            {[
              { n: "--s-1", v: 4 }, { n: "--s-2", v: 8 }, { n: "--s-3", v: 12 },
              { n: "--s-4", v: 16 }, { n: "--s-5", v: 20 }, { n: "--s-6", v: 24 },
              { n: "--s-8", v: 32 }, { n: "--s-10", v: 40 }, { n: "--s-12", v: 48 },
            ].map(s => (
              <div key={s.n} className="row gap-3 mb-2" style={{ alignItems: "center" }}>
                <div style={{ width: 70, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{s.n}</div>
                <div style={{ width: s.v, height: 14, background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 2 }}/>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{s.v}px</div>
              </div>
            ))}
          </div></div>

          <div className="card"><div className="card-b">
            <div className="lbl mb-4">Border radius</div>
            <div className="row gap-3" style={{ flexWrap: "wrap" }}>
              {[
                { n: "--r-1", v: 4 }, { n: "--r-2", v: 6 }, { n: "--r-3", v: 8 },
                { n: "--r-4", v: 10 }, { n: "--r-5", v: 12 }, { n: "--r-6", v: 16 },
              ].map(r => (
                <div key={r.n} className="col gap-2" style={{ alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, background: "var(--surface-3)", border: "1px solid var(--border-strong)", borderRadius: r.v }}/>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{r.v}px</div>
                </div>
              ))}
            </div>
            <div className="lbl mt-6 mb-4">Shadows</div>
            <div className="row gap-3" style={{ flexWrap: "wrap" }}>
              {["1","2","3"].map(s => (
                <div key={s} style={{ width: 100, height: 60, background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: `var(--shadow-${s})`, display: "grid", placeItems: "center", fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>shadow-{s}</div>
              ))}
            </div>
          </div></div>
        </div>
      </Section>

      {/* Botões */}
      <Section title="Buttons" desc="Estados: default, hover, focus, disabled.">
        <div className="card"><div className="card-b" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <DSGroup label="Primary">
            <Button variant="primary" leading={<Icons.plus size={14}/>}>Nova transação</Button>
            <Button variant="primary" size="sm">Salvar</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </DSGroup>
          <DSGroup label="Default">
            <Button leading={<Icons.download size={14}/>}>Exportar</Button>
            <Button size="sm">Filtrar</Button>
            <Button disabled>Disabled</Button>
          </DSGroup>
          <DSGroup label="Ghost">
            <Button variant="ghost">Ver todas</Button>
            <Button variant="ghost" size="sm" icon={<Icons.more size={14}/>}/>
          </DSGroup>
          <DSGroup label="Danger">
            <Button variant="danger" leading={<Icons.trash size={14}/>}>Excluir</Button>
          </DSGroup>
        </div></div>
      </Section>

      {/* Inputs */}
      <Section title="Form controls" desc="Estados: default, hover, focus, error, disabled.">
        <div className="card"><div className="card-b grid grid-2 gap-6">
          <Field label="Input padrão" required>
            <Input placeholder="Ex: Supermercado"/>
          </Field>
          <Field label="Input com erro" error="Esse campo é obrigatório">
            <Input placeholder="Ex: 0,00" error/>
          </Field>
          <Field label="Senha (toggle visibilidade)" required>
            <PasswordInput placeholder="••••••••"/>
          </Field>
          <Field label="Select" required>
            <Select defaultValue="EXPENSE">
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
              <option value="TRANSFER">Transferência</option>
            </Select>
          </Field>
          <Field label="Date" required>
            <DateInput value="27/05/2026"/>
          </Field>
          <Field label="Textarea" hint="Máximo 280 caracteres">
            <Textarea placeholder="Observação opcional…"/>
          </Field>
          <div className="row gap-4" style={{ alignItems: "center" }}>
            <ToggleDemo/>
            <label className="row gap-2 text-sm"><input type="checkbox" className="checkbox" defaultChecked/> Incluir cancelados</label>
            <label className="row gap-2 text-sm"><input type="checkbox" className="checkbox"/> Manter conectado</label>
          </div>
        </div></div>
      </Section>

      {/* Badges */}
      <Section title="Status & type badges">
        <div className="card"><div className="card-b row gap-6" style={{ flexWrap: "wrap" }}>
          <DSGroup label="Status (PAGO / PENDENTE / CANCELADO)">
            <StatusBadge status="PAID"/>
            <StatusBadge status="PENDING"/>
            <StatusBadge status="CANCELLED"/>
          </DSGroup>
          <DSGroup label="Tipo de transação">
            <TypeBadge type="INCOME"/>
            <TypeBadge type="EXPENSE"/>
            <TypeBadge type="TRANSFER"/>
            <TypeBadge type="REFUND"/>
            <TypeBadge type="ADJUSTMENT"/>
          </DSGroup>
        </div></div>
      </Section>

      {/* Iconography / account bubbles */}
      <Section title="Account & Category bubbles" desc="Cor + ícone customizáveis por conta e categoria.">
        <div className="card"><div className="card-b row gap-3" style={{ flexWrap: "wrap" }}>
          <IconBubble color="#a855f7" icon={Icons.card} size="lg"/>
          <IconBubble color="#ff6b35" icon={Icons.pig} size="lg"/>
          <IconBubble color="#22c55e" icon={Icons.wallet} size="lg"/>
          <IconBubble color="#60a5fa" icon={Icons.chart} size="lg"/>
          <IconBubble color="#fb7185" icon={Icons.food} size="lg"/>
          <IconBubble color="#fbbf24" icon={Icons.bolt} size="lg"/>
          <IconBubble color="#c084fc" icon={Icons.heart} size="lg"/>
          <IconBubble color="#34d399" icon={Icons.gift} size="lg"/>
          <IconBubble color="#f97316" icon={Icons.car} size="lg"/>
          <IconBubble color="#22d3ee" icon={Icons.building} size="lg"/>
        </div></div>
      </Section>

      {/* Skeleton */}
      <Section title="Loading & Empty">
        <div className="grid grid-2">
          <div className="card"><div className="card-b">
            <div className="lbl mb-4">Skeleton loader</div>
            <Skel w="40%" h={14}/>
            <Skel w="80%" h={32} className="mt-2"/>
            <Skel w="60%" h={12} className="mt-2"/>
            <div className="mt-4 col gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="row gap-3" style={{ alignItems: "center" }}>
                  <Skel w={28} h={28} radius={6}/>
                  <Skel w="40%" h={12}/>
                  <Skel w="20%" h={12} style={{ marginLeft: "auto" }}/>
                </div>
              ))}
            </div>
          </div></div>
          <div className="card"><div className="card-b" style={{ padding: 0 }}>
            <EmptyState icon={Icons.list} title="Nenhuma transação encontrada" desc="Tente ajustar os filtros ou criar uma nova transação para começar." action={<Button variant="primary" leading={<Icons.plus size={14}/>}>Nova transação</Button>}/>
          </div></div>
        </div>
      </Section>
    </div>
  );
}

function Principle({ num, title, body }) {
  return (
    <div className="card"><div className="card-b">
      <div className="text-xs mono" style={{ color: "var(--accent)" }}>{num}</div>
      <div className="text-lg fw-600 mt-2" style={{ letterSpacing: "-0.01em" }}>{title}</div>
      <div className="text-sm text-muted mt-2">{body}</div>
    </div></div>
  );
}

function Section({ title, desc, children }) {
  return (
    <section className="mb-6" style={{ marginBottom: 36 }}>
      <div className="mb-4">
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</h2>
        {desc && <div className="text-sm text-dim mt-2">{desc}</div>}
      </div>
      {children}
    </section>
  );
}

function DSGroup({ label, children }) {
  return (
    <div>
      <div className="lbl mb-2">{label}</div>
      <div className="row gap-2" style={{ flexWrap: "wrap", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function TypeRow({ size, weight, ls, color, mono, upper, children }) {
  return (
    <div className="type-row">
      <div className="lbl-l">{size} {weight && `· ${weight}`}{mono && " · mono"}</div>
      <div className="sample" style={{
        fontSize: size, fontWeight: weight, letterSpacing: ls,
        color: color || "var(--text)",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        textTransform: upper ? "uppercase" : "none",
        fontVariantNumeric: mono ? "tabular-nums" : "normal",
      }}>{children}</div>
      <div className="meta-r" style={{ visibility: ls ? "visible" : "hidden" }}>ls {ls}</div>
    </div>
  );
}

function ToggleDemo() {
  const [on, setOn] = useStateDS(true);
  return (
    <label className="row gap-2 text-sm">
      <Toggle on={on} onChange={setOn}/>
      <span>Modo escuro</span>
    </label>
  );
}

function Skel({ w, h, radius = 4, className = "", style }) {
  return (
    <div
      className={className}
      style={{
        width: w, height: h, borderRadius: radius,
        background: "linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 50%, var(--surface-2) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// inject shimmer animation
if (typeof document !== "undefined" && !document.getElementById("ds-anim")) {
  const s = document.createElement("style");
  s.id = "ds-anim";
  s.textContent = "@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }";
  document.head.appendChild(s);
}

Object.assign(window, { DesignSystemScreen });
