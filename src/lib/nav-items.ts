import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarClock,
  Wallet,
  Factory,
  Instagram,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/cronograma", label: "Cronograma", icon: CalendarClock },
  { href: "/caixa", label: "Caixa", icon: Wallet },
  { href: "/fornecedores", label: "Fornecedores", icon: Factory },
  { href: "/instagram", label: "Instagram", icon: Instagram },
];
