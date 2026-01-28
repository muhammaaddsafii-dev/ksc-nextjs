"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  LayoutDashboard,
  FileText,
  Gavel,
  Briefcase,
  Users,
  Shield,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  X,
  Wrench,
  Route
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const menuGroups = [
  {
    label: "MENU UTAMA",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "PENAWARAN",
    items: [
      { path: "/kategori-dan-tahapan", label: "Kategori & Tahapan", icon: Route },
      { path: "/lelang", label: "Lelang", icon: Gavel },
      { path: "/pra-kontrak", label: "Non Lelang", icon: FileText },
    ],
  },
  {
    label: "PELAKSANAAN",
    items: [
      { path: "/pekerjaan", label: "Pekerjaan", icon: Briefcase },
    ],
  },
  {
    label: "PENYELESAIAN",
    items: [
      { path: "/arsip", label: "Arsip Pekerjaan", icon: Archive },
    ],
  },
  {
    label: "INVENTARIS",
    items: [
      { path: "/tenaga-ahli", label: "Tim", icon: Users },
      { path: "/legalitas", label: "Dokumen", icon: Shield },
      { path: "/alat", label: "Alat", icon: Wrench },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { settings, toggleTheme } = useSettingsStore();

  // Auto-collapse on desktop only
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop - do nothing, keep current collapsed state
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose();
    }
  }, [pathname]); // Removed onClose from dependencies to prevent infinite loop

  const handleLinkClick = () => {
    // Only close on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          settings={settings}
          toggleTheme={toggleTheme}
          pathname={pathname}
          onLinkClick={handleLinkClick}
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] lg:hidden flex flex-col h-screen bg-card border-r shadow-2xl transition-transform duration-300 ease-out w-72 sm:w-80",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <SidebarContent
          collapsed={false}
          setCollapsed={() => { }}
          settings={settings}
          toggleTheme={toggleTheme}
          pathname={pathname}
          isMobile={true}
          onClose={onClose}
          onLinkClick={handleLinkClick}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  settings: any;
  toggleTheme: () => void;
  pathname: string;
  isMobile?: boolean;
  onClose?: () => void;
  onLinkClick: () => void;
}

function SidebarContent({
  collapsed,
  setCollapsed,
  settings,
  toggleTheme,
  pathname,
  isMobile = false,
  onClose,
  onLinkClick
}: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        {!collapsed && (
          <div className="flex justify-between items-center gap-2">
            <Image
              src="https://www.kurniasylva.com/wp-content/uploads/2024/09/cropped-logo-ksc-scaled-1.jpg"
              alt="KSC Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <h1 className="text-lg font-bold text-primary">KSC</h1>
          </div>
        )}

        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="ml-auto hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {/* Group Label */}
            {!collapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </div>
            )}
            {collapsed && groupIndex > 0 && <div className="my-2 border-t" />}

            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLinkClick();
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      "active:scale-95",
                      isActive &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Settings - Separate from groups */}
        <div className="mt-auto pt-4 border-t">
          <Link
            href="/settings"
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick();
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground",
              "active:scale-95",
              pathname === "/settings" &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Profil & Settings" : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </Link>
        </div>
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t bg-card">
        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          className={cn(
            "w-full active:scale-95 transition-transform",
            collapsed && "h-10 w-10"
          )}
          title={collapsed ? "Toggle Theme" : undefined}
        >
          {settings.theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!collapsed && (
            <span className="ml-2">
              {settings.theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </Button>
      </div>
    </>
  );
}
