import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, Building2, Calendar, ClipboardCheck, ClipboardList, FileText, Home, Settings, Users, Zap, Navigation, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { HeaderSearch } from './HeaderSearch';

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Subcontractor Operations", path: "/subcontractor-dashboard" },
  { icon: Building2, label: "Companies & Accounts", path: "/companies" },
  { icon: ClipboardList, label: "Work Orders", path: "/work-orders" },
  { icon: Users, label: "Direct Customers", path: "/customers" },
  { icon: BarChart3, label: "Projects", path: "/projects" },
  { icon: FileText, label: "Estimates", path: "/estimates" },
  { icon: ClipboardCheck, label: "Inspections", path: "/inspections" },
  { icon: FileText, label: "Invoices", path: "/invoices" },
  { icon: Settings, label: "Invoice Templates", path: "/invoice-templates" },
  { icon: BarChart3, label: "Financial Dashboard", path: "/financial-dashboard" },
  { icon: BarChart3, label: "Financial Reports", path: "/financial-reports" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Navigation, label: "Route Optimization", path: "/route-optimization" },
  { icon: Package, label: "Materials", path: "/materials" },
  { icon: Users, label: "Crews", path: "/crews" },
  { icon: BarChart3, label: "Crew Productivity", path: "/crew-productivity" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [history, setHistory] = useState<string[]>([location]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  // Track navigation history
  useEffect(() => {
    if (location !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(location);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [location]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLocation(history[newIndex]);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLocation(history[newIndex]);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-border bg-sidebar"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              {!isCollapsed ? (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-sidebar-foreground truncate">
                    MSRE
                  </span>
                  <span className="text-xs text-sidebar-foreground/70 truncate">
MUNRO & Sons
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-4">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-medium rounded-lg ${
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 rounded-lg px-1 py-1 w-full group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9 border border-sidebar-border flex-shrink-0">
                <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                  M
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold truncate leading-none text-sidebar-foreground">
                  MUNRO and Sons
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                  Public CRM access
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <div className="flex border-b border-border h-14 min-w-0 items-center justify-between bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            <div className="flex items-center gap-1">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward}
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Go forward"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {isMobile && (
              <div className="ml-1 flex min-w-0 items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="truncate tracking-tight text-foreground font-semibold text-sm">
                    {activeMenuItem?.label ?? "Roofing CRM"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!isMobile && <HeaderSearch />}
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden bg-background p-3 sm:p-4 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
