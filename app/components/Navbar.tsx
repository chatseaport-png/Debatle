"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("debatel_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Listen for storage changes (in case user logs in/out in another tab)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("debatel_user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("debatel_user");
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="border-b border-gray-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="border-2 border-black bg-white px-3 py-1 text-2xl font-bold tracking-tight text-black">
              DEBATEL
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-black"
            >
              Contact
            </Link>
            {user ? (
              <>
                <Link
                  href="/lobby"
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-black"
                >
                  Lobby
                </Link>
                <span className="px-4 py-2 text-sm font-semibold text-black">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-sm bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-black"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-sm bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
