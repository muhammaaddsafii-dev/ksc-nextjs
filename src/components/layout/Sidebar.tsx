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
  Wrench,
  Shield,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuGroups = [
  {
    label: "MENU UTAMA",
    items: [{ path: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "PENGAJUAN",
    items: [
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
      { path: "/berita-acara", label: "Berita Acara", icon: Shield },
    ],
  },
  {
    label: "INVENTARIS",
    items: [
      { path: "/tenaga-ahli", label: "Tim", icon: Users },
      { path: "/alat", label: "Alat", icon: Wrench },
      { path: "/legalitas", label: "Dokumen", icon: Shield },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { settings, toggleTheme } = useSettingsStore();

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex justify-between items-center gap-2">
            <Image
              src="https://www.kurniasylva.com/wp-content/uploads/2024/09/cropped-logo-ksc-scaled-1.jpg"
              alt="KSC Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <h1 className="text-lg font-bold text-primary">KSC</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
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
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
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
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
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
      <div className="p-4 border-t">
        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          onClick={toggleTheme}
          className="w-full"
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
    </div>
  );
}