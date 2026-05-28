/* global window */
// ============================================================
// Cash Control — mock dataset (BRL, PT-BR)
// ============================================================

const ACCOUNTS = [
  { id: "a1", name: "Nubank",          type: "CHECKING",   balance: 8432.18,  currency: "BRL", color: "#a855f7", icon: "card",     last: "Hoje, 09:14" },
  { id: "a2", name: "Itaú Corrente",   type: "CHECKING",   balance: 2104.55,  currency: "BRL", color: "#f97316", icon: "building", last: "Hoje, 08:02" },
  { id: "a3", name: "Inter Poupança", type: "SAVINGS",    balance: 14230.00, currency: "BRL", color: "#ff6b35", icon: "pig",      last: "Ontem" },
  { id: "a4", name: "Carteira",        type: "CASH",       balance: 320.00,   currency: "BRL", color: "#22c55e", icon: "wallet",   last: "3 dias" },
  { id: "a5", name: "XP Investimentos",type: "INVESTMENT", balance: 38912.40, currency: "BRL", color: "#60a5fa", icon: "chart",    last: "Hoje, 07:30" },
];

const CATS = [
  // Receitas
  { id: "c1",  name: "Salário",        type: "INCOME",  color: "#34d399", icon: "wallet" },
  { id: "c2",  name: "Freelance",      type: "INCOME",  color: "#22d3ee", icon: "bolt", parent: "c1" },
  { id: "c3",  name: "Investimentos",  type: "INCOME",  color: "#a78bfa", icon: "chart" },
  // Despesas
  { id: "c10", name: "Alimentação",    type: "EXPENSE", color: "#fb7185", icon: "food" },
  { id: "c11", name: "Mercado",        type: "EXPENSE", color: "#fb7185", icon: "bag", parent: "c10" },
  { id: "c12", name: "Restaurantes",   type: "EXPENSE", color: "#f97316", icon: "food", parent: "c10" },
  { id: "c20", name: "Moradia",        type: "EXPENSE", color: "#fbbf24", icon: "building" },
  { id: "c21", name: "Aluguel",        type: "EXPENSE", color: "#fbbf24", icon: "building", parent: "c20" },
  { id: "c22", name: "Energia",        type: "EXPENSE", color: "#fbbf24", icon: "bolt", parent: "c20" },
  { id: "c30", name: "Transporte",     type: "EXPENSE", color: "#60a5fa", icon: "car" },
  { id: "c31", name: "Combustível",    type: "EXPENSE", color: "#60a5fa", icon: "car", parent: "c30" },
  { id: "c40", name: "Lazer",          type: "EXPENSE", color: "#c084fc", icon: "heart" },
  { id: "c41", name: "Streaming",      type: "EXPENSE", color: "#c084fc", icon: "heart", parent: "c40" },
  { id: "c50", name: "Saúde",          type: "EXPENSE", color: "#34d399", icon: "heart" },
  { id: "c60", name: "Presentes",      type: "EXPENSE", color: "#a78bfa", icon: "gift" },
];

const CARDS = [
  {
    id: "card1", name: "Nubank Ultravioleta", brand: "Mastercard", lastFour: "4827",
    creditLimit: 12000, billingCycleDay: 28, dueDay: 5, color: "#a855f7",
    invoice: { totalAmount: 3284.55, paidAmount: 0, remainingAmount: 3284.55, dueDate: "2026-06-05", closesAt: "2026-05-28", status: "OPEN" },
  },
  {
    id: "card2", name: "Itaú Click", brand: "Visa", lastFour: "1102",
    creditLimit: 5000, billingCycleDay: 15, dueDay: 22, color: "#f97316",
    invoice: { totalAmount: 1842.10, paidAmount: 0, remainingAmount: 1842.10, dueDate: "2026-06-22", closesAt: "2026-06-15", status: "OPEN" },
  },
  {
    id: "card3", name: "Inter Black", brand: "Mastercard", lastFour: "9034",
    creditLimit: 8000, billingCycleDay: 1, dueDay: 8, color: "#ff6b35",
    invoice: { totalAmount: 480.00, paidAmount: 480.00, remainingAmount: 0, dueDate: "2026-05-08", closesAt: "2026-05-01", status: "PAID" },
  },
];

const CARD_CHARGES = [
  { id: "h1", cardId: "card1", description: "iFood — Sushi Tomodachi",   amount: 78.40,  categoryId: "c12", date: "2026-05-25" },
  { id: "h2", cardId: "card1", description: "Uber",                       amount: 24.80,  categoryId: "c30", date: "2026-05-25" },
  { id: "h3", cardId: "card1", description: "Amazon — Livros",            amount: 142.90, categoryId: "c40", date: "2026-05-24" },
  { id: "h4", cardId: "card1", description: "Spotify Premium",            amount: 21.90,  categoryId: "c41", date: "2026-05-23" },
  { id: "h5", cardId: "card1", description: "Netflix",                    amount: 55.90,  categoryId: "c41", date: "2026-05-22" },
  { id: "h6", cardId: "card1", description: "Pão de Açúcar",              amount: 312.46, categoryId: "c11", date: "2026-05-21" },
  { id: "h7", cardId: "card1", description: "Posto Ipiranga",             amount: 240.00, categoryId: "c31", date: "2026-05-19" },
  { id: "h8", cardId: "card1", description: "Apple Store — AirPods Pro",  amount: 2408.19,categoryId: "c40", date: "2026-05-15" },
];

const TX = [
  { id: "t1",  desc: "Salário — Acme Inc.",         amount:  9800.00, type: "INCOME",  status: "PAID",    accountId: "a1", categoryId: "c1",  competence: "2026-05-05", payment: "2026-05-05" },
  { id: "t2",  desc: "Aluguel — Vila Madalena",     amount: -2300.00, type: "EXPENSE", status: "PAID",    accountId: "a2", categoryId: "c21", competence: "2026-05-05", payment: "2026-05-05" },
  { id: "t3",  desc: "Pão de Açúcar",               amount:  -312.46, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c11", competence: "2026-05-21", payment: "2026-05-21" },
  { id: "t4",  desc: "Conta de luz — Enel",         amount:  -184.20, type: "EXPENSE", status: "PENDING", accountId: "a2", categoryId: "c22", competence: "2026-05-28", payment: null,         due: "2026-05-30" },
  { id: "t5",  desc: "Freelance — projeto Orion",   amount:  3200.00, type: "INCOME",  status: "PENDING", accountId: "a1", categoryId: "c2",  competence: "2026-05-30", payment: null },
  { id: "t6",  desc: "Spotify Family",              amount:   -34.90, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c41", competence: "2026-05-15", payment: "2026-05-15" },
  { id: "t7",  desc: "Uber — semana 21",            amount:  -127.40, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c30", competence: "2026-05-20", payment: "2026-05-20" },
  { id: "t8",  desc: "Transferência → Inter Poup.", amount: -2000.00, type: "TRANSFER",status: "PAID",    accountId: "a1", categoryId: null,  competence: "2026-05-10", payment: "2026-05-10" },
  { id: "t9",  desc: "Restaurante Fasano",          amount:  -428.00, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c12", competence: "2026-05-18", payment: "2026-05-18" },
  { id: "t10", desc: "Dividendos — XPLG11",         amount:   142.30, type: "INCOME",  status: "PAID",    accountId: "a5", categoryId: "c3",  competence: "2026-05-12", payment: "2026-05-12" },
  { id: "t11", desc: "Plano de saúde — Bradesco",   amount:  -894.00, type: "EXPENSE", status: "PENDING", accountId: "a2", categoryId: "c50", competence: "2026-06-02", payment: null,         due: "2026-06-02" },
  { id: "t12", desc: "Cinema IMAX — Dune Pt. III",  amount:   -88.00, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c40", competence: "2026-05-23", payment: "2026-05-23" },
  { id: "t13", desc: "Reembolso plano de saúde",    amount:   312.00, type: "REFUND",  status: "PAID",    accountId: "a2", categoryId: "c50", competence: "2026-05-09", payment: "2026-05-09" },
  { id: "t14", desc: "Internet — Vivo Fibra",       amount:  -129.90, type: "EXPENSE", status: "PENDING", accountId: "a2", categoryId: "c20", competence: "2026-06-05", payment: null,         due: "2026-06-05" },
  { id: "t15", desc: "Combustível — Posto Shell",   amount:  -260.00, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c31", competence: "2026-05-19", payment: "2026-05-19" },
  { id: "t16", desc: "Ajuste de saldo",             amount:    -8.43, type: "ADJUSTMENT",status:"PAID",   accountId: "a4", categoryId: null,  competence: "2026-05-11", payment: "2026-05-11" },
  { id: "t17", desc: "Presente — aniversário mãe",  amount:  -180.00, type: "EXPENSE", status: "PAID",    accountId: "a1", categoryId: "c60", competence: "2026-05-08", payment: "2026-05-08" },
];

// 6-month income/expense series (BRL)
const SERIES = [
  { m: "Dez", income: 10240, expense: 6820 },
  { m: "Jan", income:  9800, expense: 7104 },
  { m: "Fev", income:  9800, expense: 6512 },
  { m: "Mar", income: 11200, expense: 7980 },
  { m: "Abr", income: 10300, expense: 6240 },
  { m: "Mai", income: 13142, expense: 5947 },  // current month so far
];

// upcoming bills
const UPCOMING = TX.filter(t => t.status === "PENDING").sort((a,b) => (a.due||a.competence).localeCompare(b.due||b.competence));

const totalBalance = ACCOUNTS.reduce((a,b) => a + b.balance, 0);
const monthIncome  = TX.filter(t => t.type === "INCOME"  && t.competence.startsWith("2026-05") && t.status === "PAID").reduce((a,b) => a + b.amount, 0);
const monthExpense = TX.filter(t => (t.type === "EXPENSE" || t.type === "TRANSFER") && t.competence.startsWith("2026-05") && t.status === "PAID").reduce((a,b) => a + Math.abs(b.amount), 0);

// account / cat lookup
const acc = (id) => ACCOUNTS.find(a => a.id === id);
const cat = (id) => CATS.find(c => c.id === id);
const accIcon = (id) => {
  const a = acc(id);
  return a ? window.Icons[a.icon] : window.Icons.wallet;
};
const catIcon = (id) => {
  const c = cat(id);
  return c ? window.Icons[c.icon] : null;
};

Object.assign(window, {
  ACCOUNTS, CATS, CARDS, CARD_CHARGES, TX, SERIES, UPCOMING,
  totalBalance, monthIncome, monthExpense, acc, cat, accIcon, catIcon,
});
