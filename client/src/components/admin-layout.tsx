import { useState } from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  LogOut,
  Pin,
  PinOff,
  Settings2,
  Zap,
  Shield,
  FileText,
  Megaphone,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from "framer-motion";
import { useMarketplace } from '@/lib/provider';
import { ThemeToggle } from '@/components/theme-toggle';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, logout } = useMarketplace();
  const [open, setOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-pinned');
    return saved === 'true';
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/auth');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const isAdminUser = user?.email?.endsWith("@turbopartners.com") || user?.email === "rodrigoqs9@gmail.com" || user.role === 'admin';
  
  if (!isAdminUser) {
    return <Redirect to="/" />;
  }

  const togglePin = () => {
    const newValue = !isPinned;
    setIsPinned(newValue);
    localStorage.setItem('admin-sidebar-pinned', newValue.toString());
  };

  const handleSetOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (!isPinned) {
      setOpen(value);
    }
  };

  const navItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-dashboard' 
    },
    { 
      href: '/admin/users', 
      label: 'Usuários', 
      icon: <Users className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-users' 
    },
    { 
      href: '/admin/campaigns', 
      label: 'Campanhas', 
      icon: <Megaphone className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-campaigns' 
    },
    { 
      href: '/admin/financial', 
      label: 'Financeiro', 
      icon: <DollarSign className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-financial' 
    },
    { 
      href: '/admin/support', 
      label: 'Suporte', 
      icon: <MessageSquare className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-support' 
    },
    { 
      href: '/admin/modules', 
      label: 'Módulos', 
      icon: <Settings2 className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-modules' 
    },
    { 
      href: '/admin/content', 
      label: 'Conteúdo', 
      icon: <FileText className="text-muted-foreground group-hover:text-primary h-5 w-5 flex-shrink-0 transition-colors" />, 
      testid: 'nav-admin-content' 
    },
  ];

  const logoutLink = {
    label: 'Sair',
    href: '#',
    icon: <LogOut className="text-muted-foreground group-hover:text-destructive h-5 w-5 flex-shrink-0 transition-colors" />,
    onClick: handleLogout,
    testid: 'button-admin-logout'
  };

  return (
    <div className={cn(
      "flex flex-col md:flex-row bg-background w-full flex-1 mx-auto overflow-hidden",
      "h-screen"
    )}>
      <Sidebar open={open || isPinned} setOpen={handleSetOpen}>
        <SidebarBody 
          className="justify-between gap-10 bg-card border-r border-border"
          mobileLogo={<AdminMobileLogo />}
        >
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between">
              {(open || isPinned) ? <AdminLogo /> : <AdminLogoIcon />}
              {(open || isPinned) && (
                <button
                  onClick={togglePin}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title={isPinned ? "Desafixar sidebar" : "Fixar sidebar"}
                  data-testid="button-pin-admin-sidebar"
                >
                  {isPinned ? (
                    <PinOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Pin className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-1">
              {navItems.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {(open || isPinned) && (
              <div className="px-3 pb-2">
                <ThemeToggle />
              </div>
            )}
            <SidebarLink link={logoutLink} />
          </div>
        </SidebarBody>
      </Sidebar>
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

const AdminLogo = () => {
  return (
    <Link
      href="/admin"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 group"
    >
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold font-heading text-base flex-shrink-0 shadow-lg shadow-violet-500/20">
        <Shield className="h-4 w-4" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-heading font-bold text-lg tracking-tight text-foreground whitespace-pre"
      >
        Admin
      </motion.span>
    </Link>
  );
};

const AdminLogoIcon = () => {
  return (
    <Link
      href="/admin"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold font-heading text-base flex-shrink-0 shadow-lg shadow-violet-500/20">
        <Shield className="h-4 w-4" />
      </div>
    </Link>
  );
};

const AdminMobileLogo = () => {
  return (
    <Link
      href="/admin"
      className="font-normal flex space-x-2 items-center text-sm"
    >
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold font-heading text-base flex-shrink-0 shadow-lg shadow-violet-500/20">
        <Shield className="h-4 w-4" />
      </div>
      <span className="font-heading font-bold text-base tracking-tight text-foreground whitespace-nowrap">
        Admin
      </span>
    </Link>
  );
};
