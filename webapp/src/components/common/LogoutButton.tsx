"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    
    // Force cleanup by redirecting with a full page reload
    window.location.href = "/auth/signin";
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${className}`}
    >
      Sign Out
    </button>
  );
}
