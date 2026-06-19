import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  DollarSign,
  Truck,
  MessageCircle,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orcamento", label: "Orçamento", icon: FileText },
  { href: "/servicos", label: "Serviços", icon: ClipboardList },
  { href: "/cronograma", label: "Cronograma", icon: Calendar },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: User },
];

export const primaryNavItems: NavItem[] = navItems.filter((item) =>
  ["/", "/orcamento", "/servicos", "/cronograma"].includes(item.href)
);

export const moreNavItems: NavItem[] = navItems.filter(
  (item) => !primaryNavItems.includes(item)
);
