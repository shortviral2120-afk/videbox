import {
  LayoutDashboard,
  ClipboardList,
  Users,
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
  { href: "/servicos", label: "Serviços", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cronograma", label: "Cronograma", icon: CalendarClock },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/fornecedores", label: "Fornecedores", icon: Factory },
  { href: "/instagram", label: "Instagram", icon: Instagram },
];
