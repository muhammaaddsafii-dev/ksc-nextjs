"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

function AuthSync() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Sync localStorage auth state ke cookie untuk middleware
    if (isAuthenticated) {
      document.cookie = "ksc-auth-status=true; path=/; SameSite=Lax";
    } else {
      document.cookie =
        "ksc-auth-status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [isAuthenticated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthSync />
        {children}
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
