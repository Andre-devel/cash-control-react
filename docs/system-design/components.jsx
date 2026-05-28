/* global React */
// ============================================================
// Cash Control — shared primitives + icons
// ============================================================

const { useState, useEffect, useRef, useMemo } = React;

// -------------- Icons (Lucide-style stroke) ----------------
const Ico = ({ d, children, size = 16, stroke = 1.6, className = "", style }) => (
  <svg
    className={`ico ${className}`}
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden="true"
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  home: (p) => <Ico {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></Ico>,
  list: (p) => <Ico {...p}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></Ico>,
  wallet: (p) => <Ico {...p}><path d="M3 7a2 2 0 0 1 2-2h13l3 4v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M16 12h4"/></Ico>,
  card: (p) => <Ico {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/></Ico>,
  layers: (p) => <Ico {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></Ico>,
  repeat: (p) => <Ico {...p}><path d="M17 2l4 4-4 4"/><path d="M3 12V8a2 2 0 0 1 2-2h16"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v4a2 2 0 0 1-2 2H3"/></Ico>,
  tag: (p) => <Ico {...p}><path d="M20.59 13.41 13 21l-9-9V4h8l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="8" cy="8" r="1.4"/></Ico>,
  user: (p) => <Ico {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></Ico>,
  shield: (p) => <Ico {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></Ico>,
  search: (p) => <Ico {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Ico>,
  filter: (p) => <Ico {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/></Ico>,
  plus: (p) => <Ico {...p}><path d="M12 5v14M5 12h14"/></Ico>,
  minus: (p) => <Ico {...p}><path d="M5 12h14"/></Ico>,
  x: (p) => <Ico {...p}><path d="M18 6 6 18M6 6l12 12"/></Ico>,
  check: (p) => <Ico {...p}><path d="m5 12 5 5L20 7"/></Ico>,
  chevR: (p) => <Ico {...p}><path d="m9 6 6 6-6 6"/></Ico>,
  chevL: (p) => <Ico {...p}><path d="m15 6-6 6 6 6"/></Ico>,
  chevD: (p) => <Ico {...p}><path d="m6 9 6 6 6-6"/></Ico>,
  chevU: (p) => <Ico {...p}><path d="m6 15 6-6 6 6"/></Ico>,
  arrowUp: (p) => <Ico {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Ico>,
  arrowDown: (p) => <Ico {...p}><path d="M12 5v14M5 12l7 7 7-7"/></Ico>,
  arrowRight: (p) => <Ico {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Ico>,
  arrowLR: (p) => <Ico {...p}><path d="M3 7h13l-3-3"/><path d="M21 17H8l3 3"/></Ico>,
  cal: (p) => <Ico {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Ico>,
  eye: (p) => <Ico {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></Ico>,
  eyeOff: (p) => <Ico {...p}><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.4 4.3"/><path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></Ico>,
  more: (p) => <Ico {...p}><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></Ico>,
  trash: (p) => <Ico {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></Ico>,
  edit: (p) => <Ico {...p}><path d="M4 20h4l11-11-4-4L4 16Z"/><path d="m14 5 4 4"/></Ico>,
  download: (p) => <Ico {...p}><path d="M12 4v12M6 12l6 6 6-6M4 20h16"/></Ico>,
  upload: (p) => <Ico {...p}><path d="M12 20V8M6 12l6-6 6 6M4 4h16"/></Ico>,
  bell: (p) => <Ico {...p}><path d="M6 8a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8Z"/><path d="M10 21a2 2 0 0 0 4 0"/></Ico>,
  sun: (p) => <Ico {...p}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></Ico>,
  moon: (p) => <Ico {...p}><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10Z"/></Ico>,
  cog: (p) => <Ico {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></Ico>,
  pin: (p) => <Ico {...p}><path d="M12 2v6M5 21l7-7M19 8l-7 7"/><path d="m16 6 6 6"/></Ico>,
  alert: (p) => <Ico {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></Ico>,
  bag: (p) => <Ico {...p}><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></Ico>,
  car: (p) => <Ico {...p}><path d="M5 17h14"/><path d="M3 17v-4l2-5h14l2 5v4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></Ico>,
  food: (p) => <Ico {...p}><path d="M4 4v17"/><path d="M4 9c3 0 3-5 0-5"/><path d="M20 4v17M16 4v6a4 4 0 0 0 4 4"/></Ico>,
  bolt: (p) => <Ico {...p}><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/></Ico>,
  heart: (p) => <Ico {...p}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21Z"/></Ico>,
  gift: (p) => <Ico {...p}><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 13h18M12 8v13"/><path d="M7 8a3 3 0 0 1 5-3 3 3 0 0 1 5 3"/></Ico>,
  building: (p) => <Ico {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/></Ico>,
  pig: (p) => <Ico {...p}><path d="M3 12a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v3a3 3 0 0 1-3 3h-1l-1 2h-3l-1-2H9l-1 2H5l-1-2a3 3 0 0 1-1-3v-3Z"/><circle cx="16" cy="11" r="1"/></Ico>,
  chart: (p) => <Ico {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-7"/></Ico>,
  google: (p) => (
    <svg width={p?.size || 16} height={p?.size || 16} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFC107" d="M21.8 10.2H21V10H12v4h5.5a6 6 0 1 1-1.6-6.4l3-3A10 10 0 1 0 22 12c0-.6 0-1.2-.2-1.8Z"/>
      <path fill="#FF3D00" d="m3.2 7.3 3.3 2.4A6 6 0 0 1 12 6c1.5 0 2.9.6 4 1.5l3-3A10 10 0 0 0 3.2 7.3Z"/>
      <path fill="#4CAF50" d="M12 22a10 10 0 0 0 6.7-2.6l-3.1-2.6c-1 .7-2.2 1.2-3.6 1.2a6 6 0 0 1-5.6-4l-3.3 2.5A10 10 0 0 0 12 22Z"/>
      <path fill="#1976D2" d="M21.8 10.2H21V10H12v4h5.5a6 6 0 0 1-2 2.8l3.1 2.6c-.2.2 3.4-2.4 3.4-7.4 0-.6 0-1.2-.2-1.8Z"/>
    </svg>
  ),
};

// ---------------- Money formatter (BRL) -----------------
const fmt = (n, currency = "BRL") => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const [int, dec] = abs.toFixed(2).split(".");
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sym = currency === "BRL" ? "R$" : currency === "USD" ? "$" : currency;
  return { sym, sign, int: intGrouped, dec };
};
const Money = ({ value, currency = "BRL", signed = false, className = "", muted = false }) => {
  const { sym, sign, int, dec } = fmt(value, currency);
  const showSign = signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : sign;
  return (
    <span className={`mono ${className}`}>
      <span style={{ color: muted ? "var(--text-faint)" : "inherit", marginRight: 4, fontSize: "0.78em" }}>{sym}</span>
      {showSign}{int}<span style={{ color: "var(--text-dim)" }}>,{dec}</span>
    </span>
  );
};

// --------------- Date display -------------
const fmtDate = (iso) => {
  // iso "YYYY-MM-DD" -> "DD/MM/YYYY"
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const fmtDateShort = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
};
const monthNamePt = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// --------------- UI primitives ----------------
const Button = ({ variant = "default", size = "md", icon, children, leading, trailing, onClick, disabled, type = "button", style, className = "" }) => {
  const cls = ["btn"];
  if (variant === "primary") cls.push("btn-primary");
  if (variant === "ghost") cls.push("btn-ghost");
  if (variant === "danger") cls.push("btn-danger");
  if (size === "sm") cls.push("btn-sm");
  if (size === "lg") cls.push("btn-lg");
  if (icon && !children) cls.push("btn-icon");
  if (className) cls.push(className);
  return (
    <button type={type} className={cls.join(" ")} disabled={disabled} onClick={onClick} style={style}>
      {leading}
      {icon && !children ? icon : null}
      {children}
      {trailing}
    </button>
  );
};

const Field = ({ label, required, hint, error, children, span }) => (
  <div className="field" style={span ? { gridColumn: `span ${span}` } : null}>
    {label && (
      <label>{label}{required && <span className="req">*</span>}</label>
    )}
    {children}
    {error && <div className="err"><Icons.alert size={11} stroke={2}/> {error}</div>}
    {!error && hint && <div className="hint">{hint}</div>}
  </div>
);

const Input = ({ leading, trailing, type = "text", error, ...rest }) => {
  if (!leading && !trailing) {
    return <input className={`input ${error ? "error" : ""}`} type={type} {...rest}/>;
  }
  return (
    <div className="input-group">
      {leading && <span className="leading">{leading}</span>}
      <input
        className={`input ${error ? "error" : ""} ${leading ? "with-leading" : ""} ${trailing ? "with-trailing" : ""}`}
        type={type}
        {...rest}
      />
      {trailing && trailing}
    </div>
  );
};

const PasswordInput = ({ error, ...rest }) => {
  const [show, setShow] = useState(false);
  return (
    <Input
      type={show ? "text" : "password"}
      error={error}
      trailing={
        <button type="button" className="trailing btn-eye" onClick={() => setShow(s => !s)} aria-label={show ? "Ocultar" : "Mostrar"}>
          {show ? <Icons.eyeOff size={15}/> : <Icons.eye size={15}/>}
        </button>
      }
      {...rest}
    />
  );
};

const Select = ({ children, error, ...rest }) => (
  <select className={`select ${error ? "error" : ""}`} {...rest}>{children}</select>
);

const Textarea = ({ error, ...rest }) => (
  <textarea className={`textarea ${error ? "error" : ""}`} {...rest}/>
);

const DateInput = ({ value, placeholder = "DD/MM/AAAA", error }) => (
  <div className="input-group">
    <input className={`input with-trailing ${error ? "error" : ""}`} defaultValue={value} placeholder={placeholder}/>
    <span className="trailing"><Icons.cal size={14}/></span>
  </div>
);

const Money$ = ({ value, error, currency = "R$" }) => (
  <div className="input-group">
    <span className="leading"><span className="currency">{currency}</span></span>
    <input className={`input with-leading ${error ? "error" : ""}`} defaultValue={value} inputMode="decimal" style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}/>
  </div>
);

const Toggle = ({ on, onChange }) => (
  <button type="button" className={`toggle ${on ? "on" : ""}`} onClick={() => onChange?.(!on)} aria-pressed={on}/>
);

const Badge = ({ children, kind = "muted", dot = true, square = false, style }) => (
  <span className={`badge ${kind} ${square ? "square" : ""}`} style={style}>
    {dot && <span className="dot"/>}
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const map = {
    PAID:      { kind: "paid",      label: "Pago" },
    PENDING:   { kind: "pending",   label: "Pendente" },
    CANCELLED: { kind: "cancelled", label: "Cancelado" },
  };
  const s = map[status] || map.PENDING;
  return <Badge kind={s.kind}>{s.label}</Badge>;
};

const TypeBadge = ({ type }) => {
  const map = {
    INCOME:     { kind: "income",   label: "Receita" },
    EXPENSE:    { kind: "expense",  label: "Despesa" },
    TRANSFER:   { kind: "info",     label: "Transferência" },
    REFUND:     { kind: "info",     label: "Reembolso" },
    ADJUSTMENT: { kind: "muted",    label: "Ajuste" },
  };
  const t = map[type] || map.EXPENSE;
  return <Badge kind={t.kind} square dot={false}>{t.label}</Badge>;
};

// --------------- Icon Bubble (account / category color + icon) ----------------
const IconBubble = ({ color = "#7c5cff", icon: IconCmp, size = "md", glyph }) => {
  const cls = size === "sm" ? "icon-bubble sm" : size === "lg" ? "icon-bubble lg" : size === "xl" ? "icon-bubble xl" : "icon-bubble";
  // tint background using color at low alpha; icon at full color
  return (
    <span className={cls} style={{ "--icon-bg": color + "22", "--icon-fg": color, color }}>
      {IconCmp ? <IconCmp/> : glyph}
    </span>
  );
};

// --------------- Modal ----------------
const Modal = ({ title, subtitle, onClose, children, footer, wide }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h2>{title}</h2>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="x" onClick={onClose} aria-label="Fechar"><Icons.x size={16}/></button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
};

// --------------- Avatar (initials) ----------------
const Avatar = ({ name = "RM", color }) => (
  <span className="avatar" style={color ? { background: color, color: "white" } : null}>{name}</span>
);

// --------------- Empty state ----------------
const EmptyState = ({ icon: I, title, desc, action }) => (
  <div className="empty">
    <div className="icon">{I ? <I size={22} stroke={1.4}/> : <Icons.list size={22} stroke={1.4}/>}</div>
    <h4>{title}</h4>
    <p>{desc}</p>
    {action}
  </div>
);

// --------------- expose to window ----------------
Object.assign(window, {
  Ico, Icons, fmt, fmtDate, fmtDateShort, monthNamePt,
  Money, Button, Field, Input, PasswordInput, Select, Textarea, DateInput, Money$,
  Toggle, Badge, StatusBadge, TypeBadge, IconBubble, Modal, Avatar, EmptyState,
});
