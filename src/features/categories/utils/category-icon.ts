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
} from 'lucide-react'

type CategoryIconComponent = ComponentType<{ size?: number; stroke?: number }>

function asIcon(i: unknown): CategoryIconComponent {
  return i as CategoryIconComponent
}

/**
 * O seed `V13__seed_default_categories.sql` grava o ícone no padrão Material
 * Symbols (`home`, `local_gas_station`, …), que só renderiza como ligadura de
 * fonte. O projeto usa lucide-react, que expõe componentes SVG — sem este mapa
 * o nome vazava como texto cru sobre a tela de Categorias.
 */
const MATERIAL_SYMBOL_TO_LUCIDE: Record<string, CategoryIconComponent> = {
  account_balance: asIcon(Landmark),
  apartment: asIcon(Building2),
  attach_money: asIcon(DollarSign),
  bolt: asIcon(Zap),
  build: asIcon(Wrench),
  card_giftcard: asIcon(Gift),
  checkroom: asIcon(Shirt),
  computer: asIcon(Laptop),
  delivery_dining: asIcon(Bike),
  directions_bus: asIcon(Bus),
  directions_car: asIcon(Car),
  fitness_center: asIcon(Dumbbell),
  flight: asIcon(Plane),
  health_and_safety: asIcon(HeartPulse),
  home: asIcon(Home),
  local_gas_station: asIcon(Fuel),
  local_grocery_store: asIcon(ShoppingCart),
  local_hospital: asIcon(Stethoscope),
  local_pharmacy: asIcon(Pill),
  local_taxi: asIcon(CarTaxiFront),
  medical_services: asIcon(Stethoscope),
  more_horiz: asIcon(MoreHorizontal),
  movie: asIcon(Clapperboard),
  restaurant: asIcon(Utensils),
  restaurant_menu: asIcon(UtensilsCrossed),
  school: asIcon(GraduationCap),
  spa: asIcon(Flower2),
  subscriptions: asIcon(Repeat),
  trending_up: asIcon(TrendingUp),
  water_drop: asIcon(Droplet),
  wifi: asIcon(Wifi),
  work: asIcon(Briefcase),
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

  const mapped = MATERIAL_SYMBOL_TO_LUCIDE[value.toLowerCase()]
  if (mapped) return { icon: mapped }

  // Emoji e demais símbolos: renderizam como estão.
  if (!SYMBOL_NAME.test(value)) return { glyph: value }

  return { icon: FALLBACK_ICON }
}
