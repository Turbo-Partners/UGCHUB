import React from "react";
import {
  LayoutDashboard,
  Search,
  Users,
  Megaphone,
  Wallet,
  Bell,
  Trophy,
  BarChart3,
  Settings,
  MessageSquare,
  User,
  Handshake,
  Package,
  Shield,
  Compass,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  testid: string;
  badge?: "invites" | "messages";
  textBadge?: string;
  adminOnly?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

const iconClass = "text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0";

export function getCreatorNav(): NavItem[] {
  return [
    { href: "/home", label: "Início", icon: React.createElement(LayoutDashboard, { className: iconClass }), testid: "nav-home" },
    { href: "/explore", label: "Explorar", icon: React.createElement(Compass, { className: iconClass }), testid: "nav-explore" },
    { href: "/hub", label: "Minhas Parcerias", icon: React.createElement(Handshake, { className: iconClass }), testid: "nav-hub" },
    { href: "/ranking", label: "Ranking", icon: React.createElement(Trophy, { className: iconClass }), testid: "nav-ranking" },
    { href: "/wallet", label: "Carteira", icon: React.createElement(Wallet, { className: iconClass }), testid: "nav-wallet" },
  ];
}

export function getCreatorFooterNav(): NavItem[] {
  return [
    { href: "/messages", label: "Mensagens", icon: React.createElement(MessageSquare, { className: iconClass }), testid: "nav-messages", badge: "messages" },
    { href: "/notifications", label: "Notificações", icon: React.createElement(Bell, { className: iconClass }), testid: "nav-notifications" },
    { href: "/settings", label: "Perfil & Config", icon: React.createElement(User, { className: iconClass }), testid: "nav-settings" },
  ];
}

export function getCompanyNav(): NavItem[] {
  return [
    { href: "/company/home", label: "Visão Geral", icon: React.createElement(LayoutDashboard, { className: iconClass }), testid: "nav-company-home" },
    { href: "/company/hub", label: "Campaign Hub", icon: React.createElement(Megaphone, { className: iconClass }), testid: "nav-company-hub" },
    { href: "/company/creators", label: "Criadores", icon: React.createElement(Users, { className: iconClass }), testid: "nav-company-creators" },
    { href: "/company/ops", label: "Operação", icon: React.createElement(Package, { className: iconClass }), testid: "nav-company-ops" },
    { href: "/company/analytics", label: "Resultados", icon: React.createElement(BarChart3, { className: iconClass }), testid: "nav-company-analytics" },
    { href: "/company/wallet", label: "Financeiro", icon: React.createElement(Wallet, { className: iconClass }), testid: "nav-company-wallet" },
  ];
}

export function getCompanyFooterNav(): NavItem[] {
  return [
    { href: "/company/settings", label: "Configurações", icon: React.createElement(Settings, { className: iconClass }), testid: "nav-company-settings" },
  ];
}

export function getAdminNavItem(): NavItem {
  return {
    href: "/admin",
    label: "Painel Admin",
    icon: React.createElement("div", {
      className: "h-6 w-6 rounded-md bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
    }, React.createElement(Shield, { className: "text-blue-500 h-4 w-4 flex-shrink-0" })),
    testid: "nav-admin-panel",
    textBadge: "ADMIN",
    adminOnly: true,
  };
}

export const legacyRedirects: Record<string, string> = {
  "/feed": "/explore",
  "/brands": "/hub?tab=brands",
  "/active-campaigns": "/hub?tab=campaigns",
  "/applications": "/hub?tab=applications",
  "/meus-ganhos": "/wallet",
  "/leaderboard": "/ranking",
  "/profile": "/settings",
  "/dashboard": "/company/home",
  "/campaigns": "/company/hub",
  "/creators": "/company/creators",
  "/kanban": "/company/ops",
  "/financeiro": "/company/wallet",
  "/workflow-settings": "/company/settings",
};
