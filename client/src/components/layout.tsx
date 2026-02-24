import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMarketplace } from "@/lib/provider";
import { queryClient } from "@/lib/queryClient";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  LogOut,
  Briefcase,
  UserCog,
  Users,
  UserPlus,
  ChevronUp,
  Rocket,
  HelpCircle,
  Mail,
  Settings,
  Heart,
  BarChart3,
  Trophy,
  PieChart,
  Bell,
  Sun,
  Moon,
  MessageSquare,
  ChevronLeft,
  Shield,
  Compass,
  Link2,
  Megaphone,
  Radio,
  Lock,
  Wallet,
  Building2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { cn, getAvatarUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./notification-bell";
import { MessageIcon } from "./message-icon";
import { MissingDateOfBirthBanner } from "./missing-dob-banner";
import { Button } from "@/components/ui/button";
import { CompanySwitcher } from "./company-switcher";
import { CreateCompanyModal } from "./create-company-modal";
import { CompanySelectionModal } from "./company-selection-modal";
import { ThemeToggleSimple } from "./theme-toggle";
import { useTheme } from "./theme-provider";
import { SupportModal } from "./support-modal";
import { Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Company, CompanyMember } from "@shared/schema";

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

type CompanyMembership = CompanyMember & { company: Company };

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isImpersonating, stopImpersonation } = useMarketplace();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("sidebar-pinned");
    return saved === "true";
  });
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [companySelectionModalOpen, setCompanySelectionModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem("sidebar-pinned", isPinned.toString());
  }, [isPinned]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [location]);

  // Determine user role before any conditional returns (hooks must be called unconditionally)
  const isCreator = user?.role === "creator";
  const isCompany = user?.role === "company";
  
  // Check if user has admin access (turbopartners.com domain or specific emails)
  const isAdminUser = user?.email?.endsWith("@turbopartners.com.br") || user?.email === "rodrigoqs9@gmail.com";

  // Fetch user's companies for selection modal (company users only)
  const { data: userCompanies = [] } = useQuery<CompanyMembership[]>({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isCompany,
  });

  // Show company selection modal on login for users with multiple companies
  const hasShownSelectionModalRef = useRef(false);
  useEffect(() => {
    if (isCompany && userCompanies.length > 1 && !hasShownSelectionModalRef.current) {
      // Check if we should show the modal (stored in sessionStorage per login)
      const sessionKey = `company_selection_shown_${user?.id}`;
      const hasShownThisSession = sessionStorage.getItem(sessionKey);
      
      if (!hasShownThisSession) {
        setCompanySelectionModalOpen(true);
        sessionStorage.setItem(sessionKey, "true");
        hasShownSelectionModalRef.current = true;
      }
    }
  }, [isCompany, userCompanies.length, user?.id]);

  // Fetch invite count for creators - must be called before any conditional returns
  const { data: inviteCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/invites/count"],
    queryFn: async () => {
      const res = await fetch("/api/invites/count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: isCreator,
    refetchInterval: 30000,
    staleTime: 0, // Always consider data stale for immediate refetch on invalidation
  });

  const pendingInviteCount = inviteCountData?.count || 0;
  
  // Fetch unread message count - must be called before any conditional returns
  const { data: unreadMessageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/messages/unread-count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const unreadMessageCount = unreadMessageData?.count || 0;

  // Fetch unread notification count for Bell badge
  const { data: unreadNotificationData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const unreadNotificationCount = unreadNotificationData?.count || 0;

  const autoSyncTriggeredRef = useRef(false);
  useEffect(() => {
    if (isCompany && user?.id && !autoSyncTriggeredRef.current) {
      const syncKey = `dm_auto_sync_${user.id}`;
      const alreadySynced = sessionStorage.getItem(syncKey);
      if (!alreadySynced) {
        autoSyncTriggeredRef.current = true;
        sessionStorage.setItem(syncKey, "true");
        fetch("/api/instagram/conversations/sync", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.status === "sync_started") {
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
              }, 10000);
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
              }, 30000);
            }
          }
        }).catch(() => {});
      }
    }
  }, [isCompany, user?.id]);
  
  const [, setLocation] = useLocation();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const isCampaignInvite =
            data.type === "campaign_invite" ||
            (data.type === "notification" &&
              data.data?.type === "campaign_invite");

          if (isCampaignInvite) {
            queryClient.invalidateQueries({ queryKey: ["/api/invites/count"] });
            queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
            queryClient.invalidateQueries({
              queryKey: ["/api/invites/pending"],
            });
          }

          if (data.type === "instagram_dm") {
            queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
          }

          if (data.type === "dm_sync_progress" && data.data?.done) {
            queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
          }

          if (data.type === "message:new") {
            queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
          }
        } catch (error) {
          console.error("[Layout WebSocket] Error parsing message:", error);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [user?.id]);


  // Public pages that should never show sidebar
  const publicPages = ["/", "/auth", "/verify-request", "/verify-result", "/terms", "/termos-uso", "/politica-privacidade", "/cases", "/blog", "/para-criadores"];
  const isPublicPage = publicPages.includes(location) || location.startsWith("/case/") || location.startsWith("/blog/") || location.startsWith("/public/");

  // Don't show sidebar on public pages or when not logged in
  if (!user || isPublicPage) return <>{children}</>;

  // Don't show sidebar on onboarding page
  if (location === "/onboarding") {
    return (
      <div className="min-h-screen bg-background font-sans">
        <main className="container mx-auto">{children}</main>
      </div>
    );
  }

  // Keep sidebar open when dropdown is open or pinned
  const handleSetOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (!dropdownOpen && !isPinned) {
      setOpen(value);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  // Get current brandId from URL or user's activeCompanyId
  // Note: activeCompanyId is added dynamically by the backend from session
  const brandId = (user as any)?.activeCompanyId as number | undefined;

  // Main navigation items - CREATOR
  const creatorNavItems = [
    {
      href: "/home",
      label: "Início",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-home",
    },
    {
      href: "/explore",
      label: "Descobrir",
      icon: <Compass className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-explore",
    },
    {
      href: "/brands",
      label: "Marcas",
      icon: <Building2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brands",
      badge: pendingInviteCount > 0 ? pendingInviteCount : undefined,
    },
    {
      href: "/campaigns",
      label: "Campanhas",
      icon: <Megaphone className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-campaigns",
    },
    {
      href: "/messages",
      label: "Mensagens",
      icon: <MessageSquare className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-messages",
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      href: "/wallet",
      label: "Carteira",
      icon: <Wallet className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-wallet",
    },
    {
      href: "/academy",
      label: "Academy",
      icon: <GraduationCap className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-academy",
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-settings",
    },
    ...(isAdminUser ? [{
      href: "/admin",
      label: "Painel Admin",
      icon: (
        <div className="h-6 w-6 rounded-md bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Shield className="text-blue-500 h-4 w-4 flex-shrink-0" />
        </div>
      ),
      testid: "nav-admin-panel",
      textBadge: "ADMIN",
    }] : []),
  ];

  // Main navigation items - COMPANY (brand-first)
  const companyNavItems: typeof creatorNavItems = [];

  // Brand Hub items (only shown when brand is selected)
  const brandHubItems = brandId ? [
    {
      href: "/company/home",
      label: "Dashboard",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-dashboard",
    },
    {
      href: `/company/brand/${brandId}/discovery`,
      label: "Discovery",
      icon: <Search className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brand-discovery",
    },
    {
      href: `/company/brand/${brandId}/community`,
      label: "Comunidade",
      icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brand-community",
    },
    {
      href: `/company/brand/${brandId}/campaigns`,
      label: "Campanhas",
      icon: <Megaphone className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brand-campaigns",
    },
    {
      href: `/company/brand/${brandId}/tracking`,
      label: "Tracking",
      icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brand-tracking",
    },
    {
      href: `/company/brand/${brandId}/messages`,
      label: "Mensagens",
      icon: <MessageSquare className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brand-messages",
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
  ] : [];

  const companyFooterItems = [
    {
      href: "/company/brand-canvas",
      label: "Brand Canvas",
      icon: <Sparkles className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-brand-canvas",
    },
    {
      href: "/company/settings",
      label: "Configurações",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      testid: "nav-company-settings",
    },
    ...(isAdminUser ? [{
      href: "/admin",
      label: "Painel Admin",
      icon: (
        <div className="h-6 w-6 rounded-md bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Shield className="text-blue-500 h-4 w-4 flex-shrink-0" />
        </div>
      ),
      testid: "nav-admin-panel",
      textBadge: "ADMIN",
    }] : []),
  ];

  // Combined nav items based on role
  const navItems = isCompany ? companyNavItems : creatorNavItems;

  // Footer navigation items (settings and help)
  const footerNavItems = isCompany
    ? [
        {
          href: "/workflow-settings",
          label: "Configurações",
          icon: (
            <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
          ),
          testid: "nav-workflow-settings",
        },
        {
          href: "/help",
          label: "Ajuda",
          icon: (
            <HelpCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
          ),
          testid: "nav-help",
        },
      ]
    : [
        {
          href: "/analytics",
          label: "Analytics",
          icon: (
            <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
          ),
          testid: "nav-analytics",
        },
        {
          href: "/help",
          label: "Ajuda",
          icon: (
            <HelpCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
          ),
          testid: "nav-help",
        },
      ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-background w-full mx-auto border-neutral-200 dark:border-neutral-700",
        "h-screen",
      )}
    >
      <Sidebar open={open || dropdownOpen || companySwitcherOpen || isPinned} setOpen={handleSetOpen}>
        <SidebarBody
          className="justify-between gap-6 bg-sidebar border-r border-sidebar-border"
          mobileHeaderRight={null}
          mobileLogo={<MobileLogo href={isCompany ? "/dashboard" : "/feed"} />}
        >
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <div className="flex items-center justify-between">
              {open || dropdownOpen || companySwitcherOpen || isPinned ? (
                <Logo href={isCompany ? "/dashboard" : "/feed"} />
              ) : (
                <LogoIcon href={isCompany ? "/dashboard" : "/feed"} />
              )}
              {(open || dropdownOpen || companySwitcherOpen || isPinned) && (
                <button
                  onClick={() => setOpen(false)}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all border border-primary/20"
                  title="Fechar menu"
                  data-testid="button-close-sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Company Switcher - for companies, at top */}
            {isCompany && (open || dropdownOpen || companySwitcherOpen || isPinned) && (
              <div className="mt-3 px-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                  Marca Selecionada
                </p>
                <CompanySwitcher 
                  isOpen={open || dropdownOpen || companySwitcherOpen || isPinned}
                  onCreateClick={() => setCreateCompanyModalOpen(true)}
                  onDropdownOpenChange={setCompanySwitcherOpen}
                  compact
                />
              </div>
            )}
            
            <div className="mt-4 flex flex-col gap-1">
              {navItems.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            
            {/* Brand Hub items for Company */}
            {isCompany && brandHubItems.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {(open || dropdownOpen || companySwitcherOpen || isPinned) && (
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1">
                    Brand Hub
                  </p>
                )}
                {brandHubItems.map((link, idx) => (
                  <SidebarLink key={`brand-${idx}`} link={link} />
                ))}
              </div>
            )}
            
            {/* Company footer items */}
            {isCompany && (
              <div className="mt-5 flex flex-col gap-1">
                {companyFooterItems.map((link, idx) => (
                  <SidebarLink key={`footer-${idx}`} link={link} />
                ))}
              </div>
            )}
          </div>
          {/* Footer section - Desktop */}
          <div className="hidden md:flex flex-col gap-2 pt-3 border-t border-border/50">

            {/* User Profile Section */}
            {(open || dropdownOpen || companySwitcherOpen || isPinned) && (
              <Link href="/profile">
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer" data-testid="link-user-profile">
                  <Avatar className="h-8 w-8 ring-2 ring-border flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(user.avatar, user.name)} alt={user.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant={user.role === 'company' ? 'secondary' : 'primary'} 
                        appearance="light" 
                        className="text-[10px] px-1.5 py-0"
                      >
                        {user.role === 'company' ? 'CO' : user.role === 'creator' ? 'CR' : 'AD'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.role === 'company' ? 'Empresa' : user.role === 'creator' ? 'Creator' : 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Icon Buttons Row */}
            <TooltipProvider delayDuration={300}>
              <div className={cn(
                "flex items-center",
                (open || dropdownOpen || companySwitcherOpen || isPinned) ? "justify-between px-1.5 py-1.5 bg-muted/30 rounded-md mx-0.5" : "flex-col gap-1.5"
              )}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        theme === 'light' 
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      data-testid="button-sidebar-theme"
                    >
                      {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={isCompany ? "/company/settings" : "/settings"}>
                      <button
                        className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        data-testid="button-sidebar-settings"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Configurações</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/notifications">
                      <button
                        className="relative p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        data-testid="button-sidebar-notifications"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        {unreadNotificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                          </span>
                        )}
                      </button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Notificações</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSupportModalOpen(true)}
                      className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                      data-testid="button-sidebar-support"
                    >
                      <Headphones className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Suporte</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = "/";
                      }}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                      data-testid="button-sidebar-logout"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Sair</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Footer section - Mobile */}
          <div className="md:hidden flex flex-col gap-3 pt-4 border-t border-border/50">
            {/* Company Switcher - for companies only */}
            {isCompany && (
              <div className="px-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Cliente Atual
                </p>
                <CompanySwitcher 
                  isOpen={true}
                  onCreateClick={() => setCreateCompanyModalOpen(true)}
                  onDropdownOpenChange={setCompanySwitcherOpen}
                  compact
                />
              </div>
            )}

            {/* User Profile Section */}
            <Link href="/profile">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" data-testid="link-user-profile-mobile">
                <Avatar className="h-10 w-10 ring-2 ring-border flex-shrink-0">
                  <AvatarImage src={getAvatarUrl(user.avatar, user.name)} alt={user.name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge 
                      variant={user.role === 'company' ? 'secondary' : 'primary'} 
                      appearance="light" 
                      className="text-[10px] px-1.5 py-0"
                    >
                      {user.role === 'company' ? 'CO' : user.role === 'creator' ? 'CR' : 'AD'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {user.role === 'company' ? 'Empresa' : user.role === 'creator' ? 'Creator' : 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Icon Buttons Row */}
            <div className="flex items-center justify-between px-2 py-2 bg-muted/30 rounded-lg mx-1">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  theme === 'light' 
                    ? "bg-amber-100 text-amber-600" 
                    : "bg-muted/50 text-muted-foreground"
                )}
                data-testid="button-sidebar-theme-mobile"
              >
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              <Link href="/notifications">
                <button
                  className="relative p-2.5 rounded-xl bg-muted/50 text-muted-foreground transition-all"
                  data-testid="button-sidebar-notifications-mobile"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
              </Link>

              <button
                onClick={() => setSupportModalOpen(true)}
                className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 transition-all"
                data-testid="button-sidebar-support-mobile"
              >
                <Headphones className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 transition-all"
                data-testid="button-sidebar-logout-mobile"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 bg-background flex flex-col h-screen max-h-screen overflow-hidden relative">
        {/* Premium Background - Both Modes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Light mode gradient orbs - subtle and professional */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/[0.04] via-violet-500/[0.02] to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 dark:from-primary/10 dark:via-violet-500/5" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/[0.03] via-cyan-500/[0.02] to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 dark:from-cyan-500/8 dark:via-blue-500/5" />
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/[0.02] via-fuchsia-500/[0.01] to-violet-500/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 dark:from-primary/5 dark:via-fuchsia-500/3 dark:to-violet-500/5" />
          
          {/* Grid pattern - subtle in light, visible in dark */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.015)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)]" />
          
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/10 dark:to-background/30" />
        </div>

        {/* Missing Date of Birth Banner for Creators - Temporariamente desabilitado para teste */}
        {/* {user.role === "creator" && !user.dateOfBirth && (
          <MissingDateOfBirthBanner />
        )} */}

        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-4 shadow-lg z-50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>Você está visualizando como <strong>{user?.name}</strong> ({user?.email})</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-amber-700 hover:bg-amber-800 text-white border-0 h-7 text-xs font-medium"
              onClick={stopImpersonation}
              data-testid="button-stop-impersonation"
            >
              Sair da visualização
            </Button>
          </div>
        )}

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto mobile-content-padding px-4 pb-4 md:px-8 md:pb-8 h-full relative"
        >
          <div className="w-full">{children}</div>
        </div>
      </main>

      {/* Creator Onboarding Tour */}
      {/*user.role === "creator" && <CreatorOnboardingTour />*/}

      {/* Create Company Modal */}
      {isCompany && (
        <CreateCompanyModal 
          open={createCompanyModalOpen} 
          onOpenChange={setCreateCompanyModalOpen} 
        />
      )}

      {/* Company Selection Modal (for users with multiple companies) */}
      {isCompany && userCompanies.length > 1 && (
        <CompanySelectionModal
          open={companySelectionModalOpen}
          onOpenChange={setCompanySelectionModalOpen}
        />
      )}

      {/* Support Modal */}
      <SupportModal 
        open={supportModalOpen} 
        onOpenChange={setSupportModalOpen} 
      />
    </div>
  );
}

export const Logo = ({ href = "/" }: { href?: string }) => {
  return (
    <Link
      href={href}
      className="font-normal flex items-center py-1 relative z-20"
    >
      <img 
        src="/attached_assets/freepik__adjust__40499_1767050491683.png" 
        alt="CreatorConnect" 
        className="h-10 w-auto object-contain hidden dark:block"
      />
      <img 
        src="/attached_assets/Logo_CC_Preta_1769604458305.png" 
        alt="CreatorConnect" 
        className="h-10 w-auto object-contain dark:hidden"
      />
    </Link>
  );
};

export const LogoIcon = ({ href = "/" }: { href?: string }) => {
  return (
    <Link
      href={href}
      className="font-normal flex items-center py-1 relative z-20"
    >
      <img 
        src="/attached_assets/freepik__background__5578_1767050858710.png" 
        alt="CreatorConnect" 
        className="h-10 w-10 rounded-lg object-contain"
      />
    </Link>
  );
};

export const MobileLogo = ({ href = "/" }: { href?: string }) => {
  return (
    <Link
      href={href}
      className="font-normal flex items-center"
    >
      <img 
        src="/attached_assets/freepik__adjust__40499_1767050491683.png" 
        alt="CreatorConnect" 
        className="h-7 w-auto object-contain hidden dark:block"
      />
      <img 
        src="/attached_assets/Logo_CC_Preta_1769604458305.png" 
        alt="CreatorConnect" 
        className="h-7 w-auto object-contain dark:hidden"
      />
    </Link>
  );
};
