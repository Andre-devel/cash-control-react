/* global React, ReactDOM, Sidebar, Topbar, LoginScreen, Dashboard, TransactionsScreen, NewTransactionModal, AccountsScreen, CardsScreen, DesignSystemScreen, Icons, Button, TweaksPanel, TweakToggle, useTweaks */
// ============================================================
// Cash Control — app shell + routing
// ============================================================
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState("dashboard");          // dashboard | transactions | accounts | cards | design-system | etc
  const [authed, setAuthed] = useState(true);                // start authed for fast preview
  const [showNew, setShowNew] = useState(false);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.dark ? "dark" : "light");
  }, [t.dark]);

  // Title per route
  const titles = {
    dashboard:      "Dashboard",
    transactions:   "Transações",
    accounts:       "Contas",
    cards:          "Cartões de crédito",
    "design-system":"Design System",
    categories:     "Categorias",
    installments:   "Parcelamentos",
    recurrences:    "Recorrências",
  };

  if (!authed) {
    return (
      <>
        <LoginScreen onEnter={() => setAuthed(true)}/>
        <TweaksPanel title="Tweaks">
          <TweakToggle label="Modo escuro" value={t.dark} onChange={v => setTweak("dark", v)}/>
        </TweaksPanel>
      </>
    );
  }

  return (
    <div className="app" data-screen-label={`Cash Control — ${titles[route] || route}`}>
      <Sidebar route={route} onNav={setRoute} theme={t.dark ? "dark" : "light"} onToggleTheme={() => setTweak("dark", !t.dark)}/>
      <div className="shell">
        <Topbar breadcrumb={["Cash Control", titles[route] || route]}>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-icon" title="Notificações">
              <Icons.bell size={15}/>
            </button>
            <button className="btn btn-ghost btn-icon" title="Sair" onClick={() => setAuthed(false)}>
              <Icons.arrowRight size={15}/>
            </button>
          </div>
        </Topbar>

        <main className="content">
          {route === "dashboard"      && <Dashboard onNew={() => setShowNew(true)}/>}
          {route === "transactions"   && <TransactionsScreen onNew={() => setShowNew(true)}/>}
          {route === "accounts"       && <AccountsScreen/>}
          {route === "cards"          && <CardsScreen/>}
          {route === "design-system"  && <DesignSystemScreen/>}
          {(["categories","installments","recurrences"].includes(route)) && (
            <ComingSoon title={titles[route]}/>
          )}
        </main>
      </div>

      {showNew && <NewTransactionModal onClose={() => setShowNew(false)}/>}

      <TweaksPanel title="Tweaks">
        <TweakToggle label="Modo escuro" value={t.dark} onChange={v => setTweak("dark", v)}/>
      </TweaksPanel>
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 480 }}>
      <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", maxWidth: 360 }}>
        <div className="icon-bubble xl" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
          <Icons.cog size={22}/>
        </div>
        <h2 style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</h2>
        <p className="text-sm text-muted" style={{ margin: 0 }}>
          Tela fora do escopo desta rodada (Prioridade 2 ou 3). O design system, componentes e padrões já estão prontos para construí-la.
        </p>
        <div className="row gap-2 mt-4">
          <Button onClick={() => history.back()}>Voltar</Button>
          <Button variant="primary" leading={<Icons.plus size={14}/>}>Solicitar prioridade</Button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
