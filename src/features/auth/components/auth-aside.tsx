export function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="brand">
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-press))',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--accent-fg)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          C
        </span>
        <div className="name">Cash Control</div>
      </div>

      <svg
        className="mock"
        viewBox="0 0 480 360"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="auth-mock-g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--surface-1)" />
            <stop offset="1" stopColor="var(--surface-2)" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="480"
          height="360"
          rx="14"
          fill="url(#auth-mock-g1)"
          stroke="var(--border)"
        />
        {/* topbar */}
        <rect x="0" y="0" width="480" height="36" fill="var(--surface-2)" />
        <rect x="14" y="14" width="60" height="8" rx="2" fill="var(--border-strong)" />
        <circle cx="460" cy="18" r="6" fill="var(--accent)" />
        {/* KPI row */}
        <g transform="translate(16, 52)">
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${i * 150}, 0)`}>
              <rect width="140" height="74" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
              <rect x="12" y="14" width="60" height="6" rx="2" fill="var(--border-strong)" />
              <rect
                x="12"
                y="32"
                width="86"
                height="14"
                rx="3"
                fill={i === 0 ? 'var(--text)' : i === 1 ? 'var(--income)' : 'var(--expense)'}
              />
              <rect x="12" y="56" width="40" height="5" rx="2" fill="var(--border)" />
            </g>
          ))}
        </g>
        {/* chart card */}
        <g transform="translate(16, 142)">
          <rect width="290" height="200" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
          <rect x="14" y="14" width="100" height="8" rx="2" fill="var(--border-strong)" />
          <g transform="translate(14, 50)">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i} transform={`translate(${i * 44}, 0)`}>
                <rect
                  x="2"
                  y="55"
                  width="14"
                  height="65"
                  rx="2"
                  fill="var(--income)"
                  opacity="0.85"
                />
                <rect
                  x="20"
                  y="65"
                  width="14"
                  height="55"
                  rx="2"
                  fill="var(--expense)"
                  opacity="0.85"
                />
              </g>
            ))}
            <line x1="0" y1="120" x2="262" y2="120" stroke="var(--border)" />
          </g>
        </g>
        {/* upcoming */}
        <g transform="translate(322, 142)">
          <rect width="142" height="200" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
          <rect x="12" y="14" width="80" height="8" rx="2" fill="var(--border-strong)" />
          {(['var(--accent)', 'var(--info)', 'var(--pending)', 'var(--cat-4)'] as const).map(
            (color, i) => (
              <g key={i} transform={`translate(12, ${36 + i * 40})`}>
                <rect width="24" height="24" rx="6" fill={color} opacity="0.25" />
                <rect x="32" y="4" width="60" height="6" rx="2" fill="var(--text)" opacity="0.6" />
                <rect
                  x="32"
                  y="14"
                  width="42"
                  height="5"
                  rx="2"
                  fill="var(--text-dim)"
                  opacity="0.4"
                />
                <rect
                  x="100"
                  y="8"
                  width="18"
                  height="6"
                  rx="2"
                  fill="var(--expense)"
                  opacity="0.7"
                />
              </g>
            ),
          )}
        </g>
      </svg>

      <div className="pitch">
        <h2>
          Seu dinheiro,
          <br />
          sob controle.
        </h2>
        <p>
          Contas, cartões, parcelamentos e recorrências em um só lugar — com a precisão de uma
          planilha e a fluidez de um app moderno.
        </p>
      </div>
    </aside>
  )
}
