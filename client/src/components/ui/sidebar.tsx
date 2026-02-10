import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
  testid?: string;
  badge?: number;
  textBadge?: string;
  locked?: boolean;
  lockIcon?: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (
  props: React.ComponentProps<typeof motion.div> & {
    mobileHeaderRight?: React.ReactNode;
    mobileLogo?: React.ReactNode;
  },
) => {
  const { mobileHeaderRight, mobileLogo, ...rest } = props;
  return (
    <>
      <DesktopSidebar {...rest} />
      <MobileSidebar
        {...(rest as React.ComponentProps<"div">)}
        headerRight={mobileHeaderRight}
        logo={mobileLogo}
      />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-2.5 py-3 hidden md:flex md:flex-col w-[220px] flex-shrink-0 relative",
        "bg-sidebar border-r border-sidebar-border",
        "dark:backdrop-blur-2xl",
        className,
      )}
      style={{
        boxShadow: "inset -1px 0 0 rgba(79, 70, 229, 0.05)",
      }}
      animate={{
        width: animate ? (open ? "220px" : "60px") : "220px",
      }}
      onClick={() => !open && setOpen(true)}
      {...props}
    >
      {/* Premium gradient overlays - subtle in light, prominent in dark */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-violet-500/[0.01] pointer-events-none dark:from-primary/8 dark:to-violet-500/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.01] to-transparent pointer-events-none dark:via-white/[0.02]" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="relative z-10 flex flex-col h-full">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  headerRight,
  logo,
  ...props
}: React.ComponentProps<"div"> & {
  headerRight?: React.ReactNode;
  logo?: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-sidebar border-b border-sidebar-border backdrop-blur-xl w-full fixed top-0 left-0 right-0 z-[10000] mobile-header-safe",
        )}
        {...props}
      >
        <Menu
          className="text-foreground cursor-pointer h-5 w-5 flex-shrink-0"
          onClick={() => setOpen(!open)}
          data-testid="button-mobile-menu"
        />

        {logo && (
          <div className="flex-1 flex items-center justify-center px-4">
            {logo}
          </div>
        )}

        {headerRight && (
          <div className="flex items-center flex-shrink-0">{headerRight}</div>
        )}

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-sidebar p-10 z-[9999] flex flex-col justify-between overflow-hidden menu-mobile-teste-caio",
                className,
              )}
            >
              {/* Mobile menu background effects - both modes */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/[0.03] via-violet-500/[0.02] to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 dark:from-primary/10 dark:via-violet-500/5" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-500/[0.02] to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 dark:from-cyan-500/8" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.01)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)]" />
              </div>

              <div
                className="absolute right-10 top-10 z-50 text-foreground cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setOpen(!open)}
                data-testid="button-close-mobile-menu"
              >
                <X />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: any;
}) => {
  const { open, animate, setOpen } = useSidebar();
  const [location] = useLocation();
  const isActive = location === link.href;

  const iconWithActiveColor = React.isValidElement(link.icon)
    ? React.cloneElement(
        link.icon as React.ReactElement<{ className?: string }>,
        {
          className: cn(
            (link.icon as React.ReactElement<{ className?: string }>).props
              ?.className,
            isActive && "!text-primary",
          ),
        },
      )
    : link.icon;

  const content = (
    <>
      <div className="relative">
        {iconWithActiveColor}
        {link.badge !== undefined && link.badge > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
            {link.badge > 99 ? "99+" : link.badge}
          </span>
        )}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
          isActive && "font-semibold text-primary dark:text-primary",
          link.locked && "text-neutral-400 dark:text-neutral-500",
        )}
      >
        {link.label}
        {link.textBadge && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]">
            {link.textBadge}
          </span>
        )}
      </motion.span>
      {link.badge !== undefined && link.badge > 0 && open && (
        <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
          {link.badge > 99 ? "99+" : link.badge}
        </span>
      )}
      {link.locked && link.lockIcon && open && (
        <span className="ml-auto flex-shrink-0">
          {link.lockIcon}
        </span>
      )}
    </>
  );

  const handleClick = () => {
    // Close mobile menu when clicking on a link
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
  };

  if (link.locked) {
    return (
      <div
        className={cn(
          "flex items-center justify-start gap-2.5 group/sidebar py-2.5 rounded-md px-3 transition-all duration-200 relative overflow-hidden cursor-not-allowed opacity-60",
          className,
        )}
        data-testid={link.testid}
        title="Em breve"
        {...props}
      >
        {content}
      </div>
    );
  }

  if (link.onClick) {
    return (
      <button
        onClick={() => {
          handleClick();
          link.onClick?.();
        }}
        className={cn(
          "flex items-center justify-start gap-2.5 group/sidebar py-2.5 w-full bg-transparent border-none cursor-pointer rounded-md px-3 transition-all duration-200 relative overflow-hidden",
          "hover:bg-neutral-200/50 dark:hover:bg-white/[0.06]",
          "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          isActive &&
            "bg-primary/10 dark:bg-primary/15 dark:shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]",
          className,
        )}
        data-testid={link.testid}
        {...props}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-primary via-primary to-violet-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
        )}
        {content}
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-2.5 group/sidebar py-2.5 rounded-md px-3 transition-all duration-200 relative overflow-hidden",
        "hover:bg-neutral-200/50 dark:hover:bg-white/[0.06]",
        "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        isActive &&
          "bg-primary/10 dark:bg-primary/15 dark:shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]",
        className,
      )}
      data-testid={link.testid}
      {...props}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-primary via-primary to-violet-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
      )}
      {content}
    </Link>
  );
};
