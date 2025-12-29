"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const auth = useContext(useAuth());
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!auth?.token) {
      router.push("/auth/login");
      return;
    }
    setIsChecking(false);
  }, [auth, router]);

  if (isChecking) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Verifying authentication...</p>
        <p className="text-sm text-gray-500 mt-2">
          Redirecting to login if not authenticated
        </p>
      </div>
    );
  }

  return <>{children}</>;
}