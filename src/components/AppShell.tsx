"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

function InnerShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // Login page: no sidebar, full width
  if (isLoginPage || !isAuthenticated) {
    return <main className="flex-1 overflow-y-auto bg-[#f8fafc]">{children}</main>;
  }

  // Authenticated: show sidebar + content
  return (
    <>
      <Suspense>
        <Sidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto bg-[#f8fafc]">{children}</main>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      }
    >
      <AuthProvider>
        <InnerShell>{children}</InnerShell>
      </AuthProvider>
    </Suspense>
  );
}
