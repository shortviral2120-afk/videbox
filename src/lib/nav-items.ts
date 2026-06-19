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
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicos", label: "Serviços", icon: ClipboardList },
  { href: "/cronograma", label: "Cronograma", icon: Calendar },
  { href: "/orcamento", label: "Orçamento", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: User },
];

export const primaryNavItems: NavItem[] = navItems.filter((item) =>
  ["/", "/servicos", "/cronograma", "/financeiro"].includes(item.href)
);

export const moreNavItems: NavItem[] = navItems.filter(
  (item) => !primaryNavItems.includes(item)
);
