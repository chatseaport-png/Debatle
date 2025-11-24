"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("debatel_user");
    setUser(null);
    setDropdownOpen(false);
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
              Support
            </Link>
            {user ? (
              <>
                <Link
                  href="/lobby"
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-black"
                >
                  Lobby
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-black"
                >
                  Profile
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-4 py-2 text-sm font-semibold text-black hover:text-gray-700 transition"
                  >
                    {user.username} ▼
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-sm border border-gray-300 bg-white shadow-lg z-50">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
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
