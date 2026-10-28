import type { ComponentType, ReactNode } from 'react'
import {
  Home,
  Utensils,
  UtensilsCrossed,
  Car,
  CarTaxiFront,
  Bus,
  Bike,
  Fuel,
  Wrench,
  Stethoscope,
  Pill,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Clapperboard,
  Shirt,
  Flower2,
  Repeat,
  Plane,
  Landmark,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  DollarSign,
  Building2,
  Zap,
  Droplet,
  Wifi,
  ShoppingCart,
  Tag,
  Coffee,
  PawPrint,
  ShoppingBag,
  PiggyBank,
  CreditCard,
  Smartphone,
  Music,
  BookOpen,
  Gamepad2,
  Baby,
  PartyPopper,
  Receipt,
  Shield,
  Wallet,
  Sparkles,
} from 'lucide-react'

type CategoryIconComponent = ComponentType<{ size?: number; stroke?: number }>

function asIcon(i: unknown): CategoryIconComponent {
  return i as CategoryIconComponent
}

/**
 * O seed `V13__seed_default_categories.sql` grava o ícone no padrão Material
 * Symbols (`home`, `local_gas_station`, …), que só renderiza como ligadura de
 * fonte. O projeto usa lucide-react, que expõe componentes SVG — sem este mapa
 * o nome vazava como texto cru sobre a tela de Categorias. O `IconPicker` oferece
 * os mesmos nomes, para as categorias do usuário terem o visual das do sistema.
 */
const CATEGORY_ICONS: Record<string, { icon: CategoryIconComponent; label: string }> = {
  account_balance: { icon: asIcon(Landmark), label: 'Banco' },
  account_balance_wallet: { icon: asIcon(Wallet), label: 'Carteira' },
  apartment: { icon: asIcon(Building2), label: 'Prédio' },
  attach_money: { icon: asIcon(DollarSign), label: 'Dinheiro' },
  auto_awesome: { icon: asIcon(Sparkles), label: 'Beleza' },
  bolt: { icon: asIcon(Zap), label: 'Energia' },
  build: { icon: asIcon(Wrench), label: 'Manutenção' },
  card_giftcard: { icon: asIcon(Gift), label: 'Presente' },
  celebration: { icon: asIcon(PartyPopper), label: 'Festa' },
  checkroom: { icon: asIcon(Shirt), label: 'Roupas' },
  child_care: { icon: asIcon(Baby), label: 'Filhos' },
  coffee: { icon: asIcon(Coffee), label: 'Café' },
  computer: { icon: asIcon(Laptop), label: 'Computador' },
  credit_card: { icon: asIcon(CreditCard), label: 'Cartão' },
  delivery_dining: { icon: asIcon(Bike), label: 'Entrega' },
  directions_bus: { icon: asIcon(Bus), label: 'Ônibus' },
  directions_car: { icon: asIcon(Car), label: 'Carro' },
  fitness_center: { icon: asIcon(Dumbbell), label: 'Academia' },
  flight: { icon: asIcon(Plane), label: 'Viagem' },
  health_and_safety: { icon: asIcon(HeartPulse), label: 'Saúde' },
  home: { icon: asIcon(Home), label: 'Casa' },
  local_gas_station: { icon: asIcon(Fuel), label: 'Combustível' },
  local_grocery_store: { icon: asIcon(ShoppingCart), label: 'Mercado' },
  local_hospital: { icon: asIcon(Stethoscope), label: 'Hospital' },
  local_pharmacy: { icon: asIcon(Pill), label: 'Farmácia' },
  local_taxi: { icon: asIcon(CarTaxiFront), label: 'Táxi' },
  medical_services: { icon: asIcon(Stethoscope), label: 'Médico' },
  menu_book: { icon: asIcon(BookOpen), label: 'Livros' },
  more_horiz: { icon: asIcon(MoreHorizontal), label: 'Outros' },
  movie: { icon: asIcon(Clapperboard), label: 'Cinema' },
  music_note: { icon: asIcon(Music), label: 'Música' },
  pets: { icon: asIcon(PawPrint), label: 'Pet' },
  receipt: { icon: asIcon(Receipt), label: 'Contas' },
  restaurant: { icon: asIcon(Utensils), label: 'Restaurante' },
  restaurant_menu: { icon: asIcon(UtensilsCrossed), label: 'Refeição' },
  savings: { icon: asIcon(PiggyBank), label: 'Poupança' },
  school: { icon: asIcon(GraduationCap), label: 'Educação' },
  shield: { icon: asIcon(Shield), label: 'Seguro' },
  shopping_bag: { icon: asIcon(ShoppingBag), label: 'Compras' },
  smartphone: { icon: asIcon(Smartphone), label: 'Celular' },
  spa: { icon: asIcon(Flower2), label: 'Bem-estar' },
  sports_esports: { icon: asIcon(Gamepad2), label: 'Jogos' },
  subscriptions: { icon: asIcon(Repeat), label: 'Assinatura' },
  trending_up: { icon: asIcon(TrendingUp), label: 'Investimento' },
  water_drop: { icon: asIcon(Droplet), label: 'Água' },
  wifi: { icon: asIcon(Wifi), label: 'Internet' },
  work: { icon: asIcon(Briefcase), label: 'Trabalho' },
}

/** Ícone usado quando o valor é desconhecido — nunca exibir a string crua. */
const FALLBACK_ICON = asIcon(Tag)

/** Identificador snake_case, formato dos nomes de Material Symbols. */
const SYMBOL_NAME = /^[a-z0-9_]+$/i

export interface ResolvedCategoryIcon {
  icon?: CategoryIconComponent
  glyph?: ReactNode
}

/**
 * Traduz o campo `icon` da categoria em props do `IconBubble`.
 *
 * Cobre as duas origens do valor: os nomes Material Symbols do seed e os emoji
 * gravados pelo `IconPicker`. Qualquer outro nome de símbolo cai no ícone
 * padrão em vez de virar texto na tela.
 */
export function resolveCategoryIcon(icon?: string | null): ResolvedCategoryIcon {
  const value = icon?.trim()
  if (!value) return { icon: FALLBACK_ICON }

  const mapped = CATEGORY_ICONS[value.toLowerCase()]
  if (mapped) return { icon: mapped.icon }

  // Emoji e demais símbolos: renderizam como estão.
  if (!SYMBOL_NAME.test(value)) return { glyph: value }

  return { icon: FALLBACK_ICON }
}

/** Opções do `IconPicker`: um nome por ícone (alguns nomes do seed repetem o mesmo desenho). */
export const CATEGORY_ICON_OPTIONS: { name: string; label: string }[] = (() => {
  const seen = new Set<CategoryIconComponent>()
  const options: { name: string; label: string }[] = []
  for (const [name, { icon, label }] of Object.entries(CATEGORY_ICONS)) {
    if (seen.has(icon)) continue
    seen.add(icon)
    options.push({ name, label })
  }
  return options
})()
