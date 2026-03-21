"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isProfile = pathname.startsWith("/profile");

  // Common styles to ensure no "see-through" issues
  const navStyles = "sticky top-0 z-[100] w-full flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm";

  /* 🔹 DASHBOARD HEADER */
  if (isDashboard) {
    return (
      <nav className={navStyles}>
        <div className="flex items-center gap-2">
          <Image src="/images.png" alt="Q-cheque" width={40} height={40} />
          <span className="text-2xl font-bold text-blue-600">
            Q-cheque Dashboard
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Profile
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </nav>
    );
  }

  if (isProfile) {
    return (
      <nav className={navStyles}>
        <div className="flex items-center gap-2">
          <Image src="/images.png" alt="Q-cheque" width={40} height={40} />
          <span className="text-2xl font-bold text-blue-600">
            Q-cheque Profile
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-all active:scale-95"
          >
            Dashboard
          </button>
        </div>
      </nav>
    );
  }

  /* 🔹 NORMAL HEADER (ALL OTHER PAGES) */
  return (
    <nav className={navStyles}>
      <div className="flex items-center gap-2">
        <Image src="/images.png" alt="Q-cheque" width={40} height={40} />
        <span className="text-2xl font-bold text-blue-600">
          Q-cheque
        </span>
      </div>

      <Link
        href="/login"
        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all active:scale-95"
      >
        Login
      </Link>
    </nav>
  );
}