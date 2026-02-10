"use client";

import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import dynamic from "next/dynamic";
const UserSearch = dynamic(() => import("@/components/user-search"), { ssr: false });
const Notifications = dynamic(() => import("@/components/notifications"), { ssr: false });

export function TopNav() {
  const router = useRouter();

  return (
    <div className="relative z-50 w-full px-4">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center">
          <h1
            onClick={() => router.push("/home")}
            className="text-xl font-bold text-zinc-900 cursor-pointer select-none"
          >
            Pact
          </h1>
        </div>

        {/* Right side - Search, Notifications, Wallet */}
        <div className="flex items-center gap-3">
          <UserSearch />
          <Notifications />
          <appkit-button />
        </div>
      </div>
    </div>
  );
}
